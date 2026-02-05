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
    const restaurant = await this.adminRepo.getAdminByEmail(email)
    if (!restaurant.length) {
      throw new Error('Invalid email or password')
    }
    
    const isMatch = await bcrypt.compare(String(password), String(restaurant[0].password))
    if (!isMatch) {
      throw new Error('Invalid email or password')
    }
    
    const accessToken = generateAccessToken({
      userId: restaurant[0].id,
      userType: 'ADMIN',
    })
    
    const refreshToken = await generateRefreshToken(restaurant[0].id, 'ADMIN', {
      deviceInfo: 'web',
      ipAddress: '127.0.0.1',
    })
    
    return {
      restaurant: restaurant[0],
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