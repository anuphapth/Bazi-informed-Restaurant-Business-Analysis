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
      throw new Error('Restaurant not found')
    }

    const checkUser = await this.authRepo.getUserByLineUidAndRestaurant(lineUid, restaurantId)
    if (checkUser.length === 0) {
      return { action: 'Register' }
    }

    const user = checkUser[0]
    const accessToken = generateAccessToken({
      userId: user.id,
      userType: 'user',
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

    let baziResponse
    try {
      baziResponse = await axios.post(
        'https://www.thailandfxwarrior.com/node/api/v1/bazi',
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

    console.log(favorable_elements)
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
      const [year, month, day] = (data.birth_date ?? user.birth_date).split('-').map(Number)
      const [hour, minute] = (data.birth_time ?? user.birth_time).split(':').map(Number)

      const baziResponse = await axios.post(
        'https://www.thailandfxwarrior.com/node/api/v1/bazi',
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
    if (checkUser.length === 0) {
      throw new Error('User not found')
    }

    const today = new Date().toISOString().slice(0, 10)
    const existingPrediction = await this.authRepo.getPredictionByUserAndDate(userId, today)

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
    if (!groqApiKey) {
      throw new Error('AI service not configured')
    }

    const prompt = `
คุณเป็นนักเขียนคอลัมน์ดวงรายวันเชิงบันเทิง
ภาษาไทย สำนวนธรรมชาติ เหมือนคนเขียนจริง
เน้นการเล่าบรรยากาศและความรู้สึกของวัน
ไม่ใช้ภาษาระบบ ไม่อธิบายโหราศาสตร์ และไม่สรุปเชิงทฤษฎี

ข้อมูลประกอบ
พลังดวงพื้นฐาน ${element}
ธาตุที่ส่งเสริม ${favorable_elements}
ธาตุที่ควรเลี่ยง ${unfavorable_elements}
วันที่ ${today}

รูปแบบผลลัพธ์
- แสดงวันที่เป็นบรรทัดแรก
- เนื้อหาต่อจากนี้เขียนเป็น 3 ย่อหน้า
- แต่ละย่อหน้าไม่ยาวเกิน 1 บรรทัดบนหน้าจอ
- แยกย่อหน้าด้วยบรรทัดว่างชัดเจน
- ห้ามเขียนวันที่ซ้ำในเนื้อหา

แนวการเขียน
- ใช้ภาษาคน อ่านลื่น เหมือนคอลัมน์ที่อ่านทุกเช้า
- เขียนในมุมมองบุคคลที่สามหรือเชิงบรรยากาศ
- แต่ละย่อหน้าใช้ภาพหรืออารมณ์หลักเพียง 1 อย่าง
- เลี่ยงคำซ้ำและโครงประโยคซ้ำในย่อหน้าเดียว
- ใช้คำและภาพที่จับต้องได้ หลีกเลี่ยงอุปมาเชิงกวีลอย ๆ
- เขียนเหมือนบทความที่ไม่ได้พูดกับใครโดยตรง
- เลี่ยงการชี้ไปที่ผู้อ่าน
- คำว่า วันนี้ ใช้ได้เฉพาะย่อหน้าที่สามเท่านั้น

ระดับดวง
- ถ้าคะแนนมากกว่า 7 ถือว่าดวงดีมาก
- ถ้าคะแนน 4 ถึง 7 ถือว่าดวงปานกลาง
- ถ้าคะแนนต่ำกว่า 4 ถือว่าดวงแย่
- หากไม่มีคะแนน ให้ถือเป็นดวงปานกลาง
- เลือกเพียงระดับเดียวและใช้ให้สอดคล้องทั้ง 3 ย่อหน้า

ย่อหน้าที่ 1
- เล่าบรรยากาศหรือจังหวะของวัน
- ห้ามขึ้นต้นด้วยคำว่า วันนี้
- ใส่อีโมจิระดับดวงเพียงครั้งเดียวต่อท้าย
  🌟 ⚖️ 💀💀💀💀💀
- ห้ามใช้อีโมจิในย่อหน้าอื่น

ย่อหน้าที่ 2
- กล่าวถึงสีที่เหมาะกับวันนี้เพียง 1 สี
- สีต้องสอดคล้องกับธาตุที่ส่งเสริม
- เอ่ยชื่อสีได้เพียงครั้งเดียว
- หลังจากนั้นใช้คำแทน เช่น โทน บรรยากาศ หรือเฉด
- เขียนเชิงอารมณ์ ไม่อธิบายเหตุผล

ย่อหน้าที่ 3
- เขียนภาพรวมของวัน ครอบคลุมการใช้ชีวิต งาน เงิน
- กล่าวถึงของชิ้นเล็กที่พกแล้วช่วยให้วันผ่านไปได้ดี
- ใช้เพียงประโยคเดียวจบ
- น้ำเสียงต้องสอดคล้องกับระดับดวง
- สิ่งของต้องไม่ผิดกฎหมาย

ข้อห้ามสำคัญ
- ห้ามใช้สรรพนาม ฉัน เรา คุณ ผม ดิฉัน
- ห้ามใช้แฮชแท็กหรือภาษาสื่อสังคม
- ห้ามใช้ศัพท์โหราศาสตร์หรือคำสรุประบบ
- ห้ามอธิบายเหตุผลเชิงตรรกะ เช่น เพราะว่า จึงทำให้
- ห้ามใช้คำอวยเวอร์หรือทั่วไป เช่น ดีมาก สำเร็จมาก ทำได้ทุกอย่าง
`

    let response
    try {
      response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: 'คุณเป็นนักเขียนคอลัมน์ดวงรายวันภาษาไทย สำนวนธรรมชาติ เหมือนคนเขียนจริง ไม่ใช้สำนวนระบบหรือบันทึกส่วนตัว'
            },
            { role: 'user', content: prompt },
          ],
          max_tokens: 260,
          temperature: 0.85,
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
        prediction_date: today,
        prediction_text: recommendation
      })
    } else {
      await this.authRepo.insertPrediction({
        userId,
        prediction_date: today,
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

  async filterMenu(restaurantId, element, price, page) {
    const limit = 12
    const offset = (page - 1) * limit

    if (!['asc', 'desc'].includes(price)) {
      price = 'asc'
    }

    const result = await this.authRepo.filterMenu(restaurantId, element, price, limit, offset)
    const lastPage = Math.ceil(result.rows[0].total / limit)

    return {
      lastPage,
      menu: result.menu,
    }
  }

  async createCoupon(userId, promotionId) {
    const promotion = await this.authRepo.checkPromotion(promotionId)
    if (promotion.length === 0) {
      throw new Error('Promotion is not active or does not exist')
    }

    const randomBytes = crypto.randomBytes(4).toString('hex').toUpperCase()
    const code = `PROMO-${randomBytes}`

    await this.authRepo.addCoupon({
      userId,
      promotionId,
      code
    })

    return { message: 'Coupon created', code }
  }

  async useCoupon(code) {
    const rows = await this.authRepo.checkCoupon(code)

    if (rows.length === 0) {
      throw new Error('Invalid or expired coupon')
    }

    const coupon = rows[0]

    if (coupon.status !== 'UNUSED') {
      throw new Error('Coupon already used')
    }

    await this.authRepo.useCoupon(coupon.coupon_id)

    return {
      message: 'Coupon applied successfully',
      discount_value: coupon.discount_value,
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