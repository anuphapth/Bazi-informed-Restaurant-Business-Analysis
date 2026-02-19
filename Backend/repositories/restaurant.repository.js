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
      data.description,
      data.menuId
    ])
  }

  async deleteMenu(menuId) {
    return await executeQuery(constants.deleteMenu, [menuId])
  }

  async findMenuByElement(client, element, restaurantId) {
    const elementJsonb = JSON.stringify(element);
    const { rows } = await client.query(constants.findMenuelelemet, [restaurantId, elementJsonb]);
    return rows;
  }

  async createGroupPromotion(client, data) {
    const result = await client.query(constants.createGroupPromotion, [
      data.restaurant_id,
      data.name,
      data.description,
      data.discount_value,
      data.start_date,
      data.end_date,
    ]
    );

    return result.rows[0].id;
  }

  async createPromotionMapping(client, groupId, menuId) {
    await client.query(
      constants.createPromotionMapping,
      [groupId, menuId]
    );
  }

  async findUsersByElements(restaurantId, targetElements) {
    const targetJsonbArray = targetElements.map(element => `"${element}"`);
    return await executeQuery(constants.findUserByElemets, [restaurantId, targetJsonbArray]);
  }


  async getAllPromotionByRestaurant(restaurantId) {
    return await executeQuery(constants.getAllPromotionByRestaurant, [restaurantId])
  }

  async getPromotionGroup(groupId) {
    return await executeQuery(constants.getPromotionGroup, [groupId])
  }

  async updatePromotionGroup(data) {
    const result = await executeQuery(
      constants.updatePromotionGroup,
      [
        data.name,
        data.description,
        data.discount_value,
        data.start_date,
        data.end_date,
        data.status,
        data.groupId
      ]
    );

    return result;
  }


  async deletePromotionGroup(groupId) {
    const result = await executeQuery(
      constants.deletePromotionGroup,
      [groupId]
    );

    return result;
  }


  async findUser(restaurantId) {
    return await executeQuery(constants.findUser, [restaurantId])
  }


  async getAllUserRows(restaurantId) {
    return await executeQuery(constants.getAllrowUserByRestaurant, [restaurantId])
  }

  async collectElement() {
    return await executeQuery(constants.coolactElement)
  }
}

export default RestaurantRepository