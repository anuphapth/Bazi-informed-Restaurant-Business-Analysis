import AdminRepository from '../repositories/admin.repository.js'
import bcrypt from 'bcrypt'
import {
  generateAccessToken,
  generateRefreshToken,
  revokeAccessToken,
  revokeRefreshToken,
} from '../lib/jwt.js'

class AdminService {
  constructor() {
    this.adminRepo = new AdminRepository()
  }

  async login(email, password) {
    const admin = await this.adminRepo.getAdminByEmail(email)
    if (!admin.length) {
      throw new Error('Invalid email or password')
    }

    const isMatch = await bcrypt.compare(String(password), String(admin[0].password))
    if (!isMatch) {
      throw new Error('Invalid email or password')
    }

    const accessToken = generateAccessToken({
      userId: admin[0].id,
      userType: 'ADMIN',
    })

    const refreshToken = await generateRefreshToken(admin[0].id, 'ADMIN', {
      deviceInfo: 'web',
      ipAddress: '127.0.0.1',
    })

    return {
      admin: admin[0],
      tokens: { accessToken, refreshToken }
    }
  }

  async createRestaurant(data) {
    const existingRestaurant = await this.adminRepo.checkRestaurantExists(data.email)
    if (existingRestaurant.length > 0) {
      throw new Error('Duplicate Email')
    }

    const hashedPassword = await bcrypt.hash(data.password, 12)
    const restaurantData = { ...data, password: hashedPassword }

    return await this.adminRepo.createRestaurant(restaurantData)
  }

  async getAllRestaurant() {
    return await this.adminRepo.getAllRestaurantByAdmin()
  }

  async getAllMemberRestaurant() {
    
  }

  async checkUserExiting(data) {
    if (!data || (!data.id && !data.userId)) {
      throw new Error('userId is required');
    }
    const checkUser = await this.adminRepo.getUserById(data.userId)

    if (checkUser.length === 0) {
      throw new Error('User not found')
    }

    return checkUser[0]
  }

  async updateUserByAdmin(data) {
    await this.checkUserExiting(data)
    return await this.adminRepo.updateUserByAdmin(data)
  }

  async deleteUserByAdmin(data) {
    await this.checkUserExiting(data)
    return await this.adminRepo.deleteUserByAdmin(data)
  }

  async deleteRestaurantByAdmin(data) {
    const checkRestaurant = await this.adminRepo.checkRestaurant(data)
    if (checkRestaurant.length <= 0) {
      throw new Error('Restaurant not found')
    } else {
      return await this.adminRepo.deleteRestaurant(data)
    }
  }

  async logout(accessToken, refreshToken) {
    if (accessToken) {
      await revokeAccessToken(accessToken, 'user_logout')
    }
    if (refreshToken) {
      await revokeRefreshToken(refreshToken, 'user_logout')
    }
  }
}

export default AdminService