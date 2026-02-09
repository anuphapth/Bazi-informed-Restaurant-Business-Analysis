import RestaurantRepository from '../repositories/restaurant.repository.js'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js'
import { getPublicIdFromUrl } from '../utils/cloudinary.js'
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
} from '../utils/cryptoUtil.js'
import constants from '../lib/constants.js'

dotenv.config()

const SALT_ROUNDS = 12

class RestaurantService {
  constructor() {
    this.restaurantRepo = new RestaurantRepository()
  }
  
  async login(email, password) {
    const checkLogin = await this.restaurantRepo.getRestaurantByEmail(email)
    if (checkLogin.length === 0) {
      throw new Error('Invalid email or password')
    }
    
    const isMatch = await bcrypt.compare(password, checkLogin[0].password)
    if (!isMatch) {
      throw new Error('Invalid email or password')
    }

    const restaurant = checkLogin[0]
    const accessToken = generateAccessToken({
      userId: restaurant.id,
      userType: 'RESTAURANT',
      restaurantId: restaurant.id,
    })

    const refreshToken = await generateRefreshToken(restaurant.id, 'RESTAURANT', {
      deviceInfo: 'web',
      ipAddress: '127.0.0.1',
    })

    return {
      restaurant,
      tokens: { accessToken, refreshToken }
    }
  }
  
  async preEdit(restaurantId) {
    const info = await this.restaurantRepo.getRestaurantById(restaurantId)
    return { info }
  }
  
  async editRestaurant(restaurantId, data) {
    let hashPassword = null
    if (data.password) {
      hashPassword = await bcrypt.hash(data.password, SALT_ROUNDS)
    }

    await this.restaurantRepo.editRestaurant({
      ...data,
      password: hashPassword,
      restaurantId
    })

    return { message: 'Restaurant updated successfully' }
  }
  
  async menu(restaurantId, page) {
    const limit = 12
    const offset = (page - 1) * limit

    const getMenu = await this.restaurantRepo.getMenu(restaurantId, limit, offset)
    const rows = await this.restaurantRepo.getAllMenuRows(restaurantId)
    const lastPage = Math.ceil(rows[0].total / limit)
    
    return { lastPage, getMenu }
  }
  
  async addNewMenu(restaurantId, data, file) {
    let elementValue = '[]'
    if (data.element) {
      elementValue = Array.isArray(data.element)
        ? JSON.stringify(data.element)
        : JSON.stringify([data.element])
    }

    let image_url = null
    let image_public_id = null

    if (file) {
      const uploadResult = await uploadToCloudinary(file.buffer)
      image_url = uploadResult.secure_url
      image_public_id = uploadResult.public_id
    }

    await this.restaurantRepo.addNewMenu({
      restaurantId,
      name: data.name,
      description: data.description,
      price: data.price,
      element: elementValue,
      image_url,
      status: data.status || 'AVAILABLE'
    })

    return { message: 'Menu created successfully' }
  }
  
  async editMenu(menuId, data, file) {
    const findMenu = await this.restaurantRepo.findMenuById(menuId)

    if (findMenu.length === 0) {
      throw new Error('Menu not found')
    }

    let imageUrlToSave = findMenu[0].image_url

    if (file) {
      const uploadResult = await uploadToCloudinary(file.buffer)
      imageUrlToSave = uploadResult.secure_url

      if (findMenu[0].image_url) {
        const publicId = getPublicIdFromUrl(findMenu[0].image_url)
        if (publicId) {
          await deleteFromCloudinary(publicId)
        }
      }
    }

    const elementValue = data.element
      ? JSON.stringify(Array.isArray(data.element) ? data.element : [data.element])
      : null

    await this.restaurantRepo.editMenu({
      ...data,
      element: elementValue,
      image_url: imageUrlToSave,
      menuId
    })

    return { message: 'Menu updated successfully' }
  }
  
  async deleteMenu(menuId) {
    const findMenu = await this.restaurantRepo.findMenuById(menuId)

    if (findMenu.length === 0) {
      throw new Error('Menu not found')
    }

    const oldImageUrl = findMenu[0].image_url
    const publicId = getPublicIdFromUrl(oldImageUrl)
    if (publicId) {
      await deleteFromCloudinary(publicId)
    }
    
    await this.restaurantRepo.deleteMenu(menuId)

    return { message: 'Delete Menu successfully' }
  }
  
  async createPromotion(data) {
    const menus = await this.restaurantRepo.findMenuByElement(data.element)

    if (menus.length === 0) {
      throw new Error('No menus match the specified elements')
    }

    const groupResult = await this.restaurantRepo.createGroupPromotion()
    const promotionGroupId = groupResult[0].nextGroup

    const queries = menus.map(menu => ({
      query: constants.createPromotion,
      params: [
        promotionGroupId,
        menu.id,
        data.description || null,
        data.discount_value,
        data.start_date,
        data.end_date,
        'AVAILABLE',
      ]
    }))

    await executeQueryWithTransaction(queries)

    return {
      message: 'Promotion created successfully',
      promotion_group_id: promotionGroupId,
      menu_count: menus.length,
    }
  }
  
  async getAllPromotion(restaurantId) {
    const rows = await this.restaurantRepo.getAllPromotionByRestaurant(restaurantId)

    const groupMap = {}

    for (const row of rows) {
      const groupId = row.promotion_group_id

      if (!groupMap[groupId]) {
        groupMap[groupId] = {
          promotion_group_id: groupId,
          promotions: [],
        }
      }

      groupMap[groupId].promotions.push({
        description: row.description,
        discount_value: row.discount_value,
        start_date: row.start_date,
        end_date: row.end_date,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })
    }

    return {
      total_groups: Object.keys(groupMap).length,
      promotion_groups: Object.values(groupMap),
    }
  }
  
  async getPromotionGroup(groupId) {
    const rows = await this.restaurantRepo.getPromotionGroup(groupId)

    if (rows.length === 0) {
      throw new Error('Promotion group not found')
    }

    return rows[0]
  }
  
  async updatePromotionGroup(groupId, data) {
    const result = await this.restaurantRepo.updatePromotionGroup({
      ...data,
      groupId
    })

    if (result.length === 0) {
      throw new Error('Promotion group not found')
    }

    return { message: 'Promotion group updated successfully' }
  }
  
  async deletePromotionGroup(groupId) {
    const result = await this.restaurantRepo.deletePromotionGroup(groupId)

    if (result.length === 0) {
      throw new Error('Promotion group not found')
    }

    return { message: 'Promotion group deleted successfully' }
  }
  
  async restaurantUser(restaurantId, page) {
    const limit = 12
    const offset = (page - 1) * limit

    const user = await this.restaurantRepo.findUser(restaurantId, limit, offset)

    if (user.length === 0) {
      throw new Error('No users found in restaurant')
    }

    const element = await this.restaurantRepo.collectElement()
    const rows = await this.restaurantRepo.getAllUserRows(restaurantId)
    const lastPage = Math.ceil(rows[0].total / limit)
    
    return {
      lastPage,
      element: element || [],
      user: user || [],
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
      restaurantId: decoded.restaurantId || decoded.userId,
    })

    return { accessToken: newAccessToken }
  }
  
  async logout(accessToken, refreshToken) {
    if (accessToken) {
      await revokeAccessToken(accessToken, 'restaurant_logout')
    }

    if (refreshToken) {
      await revokeRefreshToken(refreshToken, 'restaurant_logout')
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
  
  async regisUserbyRestaurant(restaurantId) {
    const token = encodeShort(restaurantId)
    return `https://meningococcic-geratologic-harriett.ngrok-free.dev/loginuser?t=${token}`
  }
}

export default RestaurantService