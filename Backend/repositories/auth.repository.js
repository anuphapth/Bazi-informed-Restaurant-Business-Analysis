import { executeQuery, executeQueryWithTransaction } from '../lib/db.js'
import constants from '../lib/constants.js'

class AuthRepository {
  async getUserByLineUidAndRestaurant(lineUid, restaurantId) {
    return await executeQuery(constants.CheckUser, [lineUid, restaurantId])
  }

  async getUserById(userId) {
    return await executeQuery(constants.CheckUserByID, [userId])
  }

  async checkUserExists(userId) {
    return await executeQuery(constants.checkUserAlready, [userId])
  }

  async checkRestaurant(restaurantId) {
    return await executeQuery(constants.CheckRestarant, [restaurantId])
  }

  async createUser(data) {
    return await executeQuery(constants.createNewUser, [
      data.lineUid,
      data.restaurantId,
      data.name,
      data.gender,
      data.phone,
      data.birth_date,
      data.birth_time,
      data.birth_place
    ])
  }

  async insertUserElements(data) {
    return await executeQuery(constants.insertElement, [
      data.userId,
      data.main_element,
      JSON.stringify(data.favorable_elements),
      JSON.stringify(data.unfavorable_elements),
    ])
  }

  async updateUser(data) {
    return await executeQuery(constants.editProfile, [
      data.name,
      data.gender,
      data.phone,
      data.birth_date,
      data.birth_time,
      data.birth_place,
      data.userId
    ])
  }

  async updateUserElements(data) {
    return await executeQuery(constants.updateElementAfterEditProfile, [
      data.main_element,
      JSON.stringify(data.favorable_elements),
      JSON.stringify(data.unfavorable_elements),
      data.userId
    ])
  }

  async getPredictionByUserAndDate(userId, date) {
    return await executeQuery(constants.checkPrediction, [userId, date])
  }

  async getPredictionByUser(userId) {
    return await executeQuery(constants.checkPredictionBefor, [userId])
  }

  async insertPrediction(data) {
    return await executeQuery(constants.insertPrediction, [
      data.userId,
      data.prediction_date,
      data.prediction_text
    ])
  }

  async updatePrediction(data) {
    return await executeQuery(constants.updatePrediction, [
      data.prediction_text,
      data.prediction_date,
      data.userId
    ])
  }

  async getMenuByUser(userId, limit, offset) {
    return await executeQuery(constants.getMenuByUser, [userId, limit, offset]);
  }


  async getAllMenuRowsByUser(userId) {
    return await executeQuery(constants.getAllrowMenu, [userId])
  }

  async findMenuElementLike(userId, limit, offset) {
    return await executeQuery(constants.findMenuElementLike, [userId, userId, limit, offset])
  }

  async getAllMenuElementLikeRows(restaurantId, userId) {
    return await executeQuery(constants.getAllrowMenuElementLike, [restaurantId, userId])
  }

  async filterMenu(restaurantId, userId, element, price, limit, offset) {

    const order = price === 'desc' ? 'DESC' : 'ASC'

    const sql = constants.filterMenu.replace('%%ORDER%%', order)

    const menu = await executeQuery(sql, [
      restaurantId,
      userId,
      Array.isArray(element) && element.length ? element : null,
      limit,
      offset
    ])

    const rows = await executeQuery(constants.filterMenuCount, [
      restaurantId,
      Array.isArray(element) && element.length ? element : null
    ])

    return { menu, rows }
  }

  async checkUserCoupon(userId, promotionId) {
    return await executeQuery(constants.checkUserCoupon, [userId, promotionId])
  }

  async addCoupon(data) {
    return await executeQuery(constants.addCoupon, [
      data.userId,
      data.promotionId,
      data.code
    ])
  }

  async checkCoupon(code) {
    return await executeQuery(constants.checkCoupon, [code])
  }

  async useCoupon(couponId) {
    return await executeQuery(constants.useCoupon, [couponId])
  }
}

export default AuthRepository