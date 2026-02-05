import { executeQuery, executeQueryWithTransaction } from '../lib/db.js'
import constants from '../lib/constants.js'

class RestaurantRepository {
  async getRestaurantByEmail(email) {
    return await executeQuery(constants.restaurantLogin, [email])
  }
  
  async getRestaurantById(id) {
    return await executeQuery(constants.CheckRestarant, [id])
  }
  
  async editRestaurant(data) {
    return await executeQuery(constants.editRestaurant, [
      data.name,
      data.email,
      data.password,
      data.status,
      data.restaurantId
    ])
  }
  
  async getMenu(restaurantId, limit, offset) {
    return await executeQuery(constants.getMenu, [restaurantId, limit, offset])
  }
  
  async getAllMenuRows(restaurantId) {
    return await executeQuery(constants.getAllrowMenuByRestaurant, [restaurantId])
  }
  
  async addNewMenu(data) {
    return await executeQuery(constants.addNewMenu, [
      data.restaurantId,
      data.name,
      data.description,
      data.price,
      data.element,
      data.image_url,
      data.status
    ])
  }
  
  async findMenuById(menuId) {
    return await executeQuery(constants.findMenuByRestaurant, [menuId])
  }
  
  async editMenu(data) {
    return await executeQuery(constants.editMenu, [
      data.name,
      data.price,
      data.element,
      data.image_url,
      data.status,
      data.menuId
    ])
  }
  
  async deleteMenu(menuId) {
    return await executeQuery(constants.deleteMenu, [menuId])
  }
  
  async findMenuByElement(element) {
    return await executeQuery(constants.findMenuelelemet, [JSON.stringify(element)])
  }
  
  async createGroupPromotion() {
    return await executeQuery(constants.createGroupPromotion)
  }
  
  async createPromotion(data) {
    return await executeQuery(constants.createPromotion, [
      data.promotionGroupId,
      data.menuId,
      data.description,
      data.discount_value,
      data.start_date,
      data.end_date,
      data.status
    ])
  }
  
  async getAllPromotionByRestaurant(restaurantId) {
    return await executeQuery(constants.getAllPromotionByRestaurant, [restaurantId])
  }
  
  async getPromotionGroup(groupId) {
    return await executeQuery(constants.getPromotionGroup, [groupId])
  }
  
  async updatePromotionGroup(data) {
    return await executeQuery(constants.updatePromotionGroup, [
      data.start_date,
      data.end_date,
      data.status,
      data.groupId
    ])
  }
  
  async deletePromotionGroup(groupId) {
    return await executeQuery(constants.deletePromotionGroup, [groupId])
  }
  
  async findUser(restaurantId, limit, offset) {
    return await executeQuery(constants.findUser, [restaurantId, limit, offset])
  }
  
  async getAllUserRows(restaurantId) {
    return await executeQuery(constants.getAllrowUserByRestaurant, [restaurantId])
  }
  
  async collectElement() {
    return await executeQuery(constants.coolactElement)
  }
}

export default RestaurantRepository