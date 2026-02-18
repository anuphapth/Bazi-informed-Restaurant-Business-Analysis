import AuthRepository from '../repositories/auth.repository.js'
import axios from 'axios'
import crypto from 'crypto'
import dotenv from 'dotenv'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeAccessToken,
  revokeRefreshToken,
  revokeAllUserTokens,
} from '../lib/jwt.js'
import {
  encodeShort,
  decodeShort,
} from '../utils/cryptoUtil.js'
import { buildPredictionPrompt } from '../lib/predictionPrompt.js'

dotenv.config()

const VALID_ELEMENTS = ["ดิน", "น้ำ", "ไฟ", "ทอง", "ไม้"]

class AuthService {
  constructor() {
    this.authRepo = new AuthRepository()
  }

  async lineUIDCheck(lineUid, token) {
    const restaurantId = decodeShort(token)
    if (!restaurantId) {
      throw new Error('Restaurant not found')
    }

    const checkRestaurant = await this.authRepo.checkRestaurant(restaurantId)
    if (checkRestaurant.length === 0) {
      return { action: 'RestaurantNotFound' }
    }

    const checkUser = await this.authRepo.getUserByLineUidAndRestaurant(lineUid, restaurantId)
    if (checkUser.length === 0) {
      return { action: 'Register' }
    }

    const user = checkUser[0]
    const accessToken = generateAccessToken({
      userId: user.id,
      userType: 'USER',
      restaurantId: user.restaurant_id,
    })

    const refreshToken = await generateRefreshToken(user.id, 'USER', {
      deviceInfo: 'web',
      ipAddress: '127.0.0.1',
    })

    return {
      action: 'LOGIN',
      user: {
        id: user.id,
        line_uid: user.line_uid,
        name: user.name,
      },
      bazi: {
        main_element: user.main_element,
        favorable_elements: user.favorable_elements,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    }

  }

  async register(data, token) {
    const restaurantId = decodeShort(token)
    if (!restaurantId) {
      throw new Error('Restaurant not found')
    }

    const checkRestaurant = await this.authRepo.checkRestaurant(restaurantId)
    if (checkRestaurant.length === 0) {
      throw new Error('Restaurant not found')
    }

    const checkMember = await this.authRepo.getUserByLineUidAndRestaurant(data.lineUid, restaurantId)
    if (checkMember.length > 0) {
      throw new Error('User already registered')
    }

    const [year, month, day] = data.birth_date.split('-').map(Number)
    const [hour, minute] = data.birth_time.split(':').map(Number)

    const createUserResult = await this.authRepo.createUser({
      ...data,
      restaurantId
    })

    const userId = createUserResult[0].id
    const BaziURL = process.env.BAZI_URL
    let baziResponse
    try {
      baziResponse = await axios.post(
        BaziURL,
        {
          name: data.name,
          bday: day,
          bmonth: month,
          byear: year,
          b_hour: hour,
          b_minute: minute,
          bplace: data.birth_place,
          script: 'zh',
          view: 'full',
        },
        {
          timeout: 10000,
          headers: {
            'X-API-Key': process.env.BAZI_API_KEY,
          },
        },
      )
    } catch (apiError) {
      throw new Error('Bazi service unavailable')
    }

    if (!baziResponse?.data?.summary) {
      throw new Error('Invalid Bazi response')
    }

    const summary = baziResponse.data.summary
    const main_element = summary.dayMaster?.elementTh
    const favorable_elements = summary.favorableElements
    const unfavorable_elements = summary.unfavorableElements

    if (!main_element || !VALID_ELEMENTS.includes(main_element)) {
      throw new Error('Invalid element data')
    }

    await this.authRepo.insertUserElements({
      userId,
      main_element,
      favorable_elements,
      unfavorable_elements
    })

    const accessToken = generateAccessToken({
      userId: userId,
      userType: 'user',
      restaurantId: restaurantId,
    })

    const refreshToken = await generateRefreshToken(userId, 'USER', {
      deviceInfo: 'web',
      ipAddress: '127.0.0.1',
    })

    return {
      action: 'LOGIN',
      user: {
        id: userId,
        name: data.name,
        line_uid: data.lineUid,
      },
      bazi: {
        main_element,
        favorable_elements,
        unfavorable_elements,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    }
  }

  async preEditProfile(userId) {
    const info = await this.authRepo.getUserById(userId)

    if (info.length > 0 && info[0].main_element) {
      info[0].main_element = info[0].main_element.split(' ')[0]
    }

    return { info }
  }

  async editProfile(userId, data) {
    const users = await this.authRepo.getUserById(userId)
    const user = users[0]
    let main_element = user.main_element
    let baziResult = null

    await this.authRepo.updateUser({
      ...data,
      userId
    })

    const birthChanged =
      data.birth_date !== undefined ||
      data.birth_time !== undefined ||
      data.birth_place !== undefined

    if (birthChanged) {
      const BaziURL = process.env.BAZI_URL
      const [year, month, day] = (data.birth_date ?? user.birth_date).split('-').map(Number)
      const [hour, minute] = (data.birth_time ?? user.birth_time).split(':').map(Number)

      const baziResponse = await axios.post(
        BaziURL,
        {
          name: data.name ?? user.name,
          bday: day,
          bmonth: month,
          byear: year,
          b_hour: hour,
          b_minute: minute,
          bplace: data.birth_place ?? user.birth_place,
          script: 'zh',
          view: 'full',
        },
        { headers: { 'X-API-Key': process.env.BAZI_API_KEY } }
      )

      const summary = baziResponse.data.summary
      main_element = `${summary.dayMaster?.elementTh} ${summary.dayMaster?.polarity} ${summary.statusText}`
      const favorable_elements = summary.favorableElements
      const unfavorable_elements = summary.unfavorableElements

      await this.authRepo.updateUserElements({
        userId,
        main_element,
        favorable_elements,
        unfavorable_elements
      })

      baziResult = { main_element, favorable_elements, unfavorable_elements }
    }

    return { message: 'Profile updated', bazi: baziResult }
  }

  async prediction(userId) {

    const checkUser = await this.authRepo.checkUserExists(userId)
    const now = new Date()
    const dbDate = now.toISOString().slice(0, 10)
    const today = now.toLocaleDateString('th-TH', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    const existingPrediction = await this.authRepo.getPredictionByUserAndDate(userId, dbDate)

    if (existingPrediction.length > 0) {
      return { message: existingPrediction[0].prediction_text }
    }

    const element = checkUser[0].main_element
    const favorable_elements = checkUser[0].favorable_elements
    const unfavorable_elements = checkUser[0].unfavorable_elements

    if (!element) {
      throw new Error('Invalid user element data')
    }

    const groqApiKey = process.env.GROQ_API_KEY
    const AIURL = process.env.GROQ_API_URL
    const model = process.env.GROQ_MODEL
    if (!groqApiKey || !AIURL || !model) {
      throw new Error('AI service not configured')
    }

    const topics = ["งาน", "เงิน", "ความรัก", "สุขภาพ", "คำพูด", "การตัดสินใจ"];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    const prompt = buildPredictionPrompt({
      element,
      favorable_elements,
      unfavorable_elements,
      today,
      randomTopic
    })

    let response
    try {
      response = await axios.post(AIURL, {
        model: model,
        messages: [
          {
            role: 'system',
            content: 'คุณเป็นนักเขียนคอลัมน์ดวงรายวันภาษาไทย สำนวนธรรมชาติ เหมือนคนเขียนจริง ไม่ใช้สำนวนระบบหรือบันทึกส่วนตัว'
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 70,
        temperature: 0.65,
        frequency_penalty: 0.6,
        presence_penalty: 0.4,

      },
        {
          timeout: 15000,
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      )
    } catch (apiError) {
      throw new Error('Prediction service unavailable')
    }

    const recommendation =
      response.data.choices?.[0]?.message?.content ||
      response.data.choices?.[0]?.text ||
      'ขอโทษ ไม่สามารถให้คำทำนายได้ในขณะนี้'

    const predictionBefore = await this.authRepo.getPredictionByUser(userId)

    if (predictionBefore.length > 0) {
      await this.authRepo.updatePrediction({
        userId,
        prediction_date: dbDate,
        prediction_text: recommendation
      })
    } else {
      await this.authRepo.insertPrediction({
        userId,
        prediction_date: dbDate,
        prediction_text: recommendation
      })
    }

    return { message: recommendation }
  }

  async menu(userId, page) {
    const limit = 12
    const offset = (page - 1) * limit

    const menu = await this.authRepo.getMenuByUser(userId, limit, offset)
    const rows = await this.authRepo.getAllMenuRowsByUser(userId)
    const lastPage = Math.ceil(rows[0].total / limit)

    return { lastPage, menu }
  }

  async findMenu(userId, page) {
    const restaurantId = await this.authRepo.getUserById(userId)
    const limit = 12
    const offset = (page - 1) * limit
    const menu = await this.authRepo.findMenuElementLike(userId, limit, offset)
    const rows = await this.authRepo.getAllMenuElementLikeRows(restaurantId[0].restaurant_id, userId)
    const lastPage = Math.ceil(rows[0].total / limit)

    return { lastPage, menu: menu || [] }
  }

  async filterMenu(restaurantId, userId, element, price, page) {
    const limit = 12
    const offset = (page - 1) * limit

    if (!['asc', 'desc'].includes(price)) {
      price = 'asc'
    }

    const result = await this.authRepo.filterMenu(
      restaurantId,
      userId,
      element,
      price,
      limit,
      offset
    )

    const lastPage = Math.ceil(result.rows[0].total / limit)

    return {
      lastPage,
      menu: result.menu
    }
  }

  async createCoupon(userId, promotionId) {

    const promotion = await this.authRepo.checkPromotion(promotionId)

    if (promotion.length === 0) {
      throw new Error('Promotion is not active or does not exist')
    }

    const existing = await this.authRepo.checkUserCoupon(userId, promotionId)

    if (existing.length > 0) {
      throw new Error('You already claimed this promotion')
    }

    const code = `PROMO-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

    await this.authRepo.addCoupon({ userId, promotionId, code })

    return { message: 'Coupon created', code }
  }

  async useCoupon(code) {

    const rows = await this.authRepo.checkCoupon(code)

    if (rows.length === 0) {
      throw new Error('Invalid coupon')
    }

    const coupon = rows[0]

    if (coupon.status !== 'UNUSED') {
      throw new Error('Coupon already used')
    }

    if (coupon.promotion_status !== 'AVAILABLE') {
      throw new Error('Promotion is not available')
    }

    const today = new Date()
    const startDate = new Date(coupon.start_date)
    const endDate = new Date(coupon.end_date)

    if (today < startDate || today > endDate) {
      throw new Error('Coupon expired')
    }

    const updated = await this.authRepo.useCoupon(coupon.coupon_id)

    if (updated.rowCount === 0) {
      throw new Error('Coupon already used')
    }

    return {
      message: 'Coupon applied successfully',
      discount_value: coupon.discount_value,
      coupon_id: coupon.coupon_id,
      restaurant_id: coupon.restaurant_id,
      code: coupon.code
    }
  }

  async refreshAccessToken(refreshToken) {
    if (!refreshToken) {
      throw new Error('Refresh token required')
    }

    const decoded = await verifyRefreshToken(refreshToken)
    const newAccessToken = generateAccessToken({
      userId: decoded.userId,
      userType: decoded.userType,
      restaurantId: decoded.restaurantId,
    })

    return { accessToken: newAccessToken }
  }

  async logout(accessToken, refreshToken) {
    if (accessToken) {
      await revokeAccessToken(accessToken, 'user_logout')
    }

    if (refreshToken) {
      await revokeRefreshToken(refreshToken, 'user_logout')
    }

    return { message: 'Logged out successfully' }
  }

  async logoutAllDevices(userId, userType) {
    if (!userId) {
      throw new Error('Authentication required')
    }

    await revokeAllUserTokens(userId, userType)

    return { message: 'Logged out from all devices successfully' }
  }
}

export default AuthService