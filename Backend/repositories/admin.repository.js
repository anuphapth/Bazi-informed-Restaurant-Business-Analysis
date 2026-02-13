import { executeQuery } from '../lib/db.js'
import constants from '../lib/constants.js'

class AdminRepository {
  async getAdminByEmail(email) {
    return await executeQuery(constants.adminLogin, [email])
  }

  async createRestaurant(data) {
    return await executeQuery(constants.adminRegisRestaurant, [
      data.name, data.email, data.password, data.phone, data.address
    ])
  }

  async checkRestaurantExists(email) {
    return await executeQuery(constants.restaurantLogin, [email])
  }

  async getAllRestaurantByAdmin() {
    return await executeQuery(constants.adminGetAllRestaurant)
  }

  async getUserById(userId) {
    return await executeQuery(constants.CheckUserByID, [userId])
  }

  async updateUserByAdmin(data) {
    return await executeQuery(constants.adminUpdateUser, [
      data.name,
      data.gender,
      data.phone,
      data.birth_date,
      data.birth_time,
      data.birth_place,
      data.id 
    ])
  }

}

export default AdminRepository