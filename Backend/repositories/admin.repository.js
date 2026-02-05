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
}

export default AdminRepository