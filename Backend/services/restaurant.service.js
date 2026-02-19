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
import { executeQueryWithTransaction } from '../lib/db.js'
import axios from 'axios'

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

  async createPromotion(data, restaurantId) {
    return await executeQueryWithTransaction(async (client) => {

      if (data.discount_value <= 0 || data.discount_value > 100) {
        throw new Error('Discount Error');
      }

      const menus = await this.restaurantRepo.findMenuByElement(client, data.element, restaurantId)


      if (!menus || menus.length === 0) {
        throw new Error('No menus match the specified elements')
      }

      const promotionElements = [
        ...new Set(
          menus.flatMap(menu => menu.element).filter(element => data.element.includes(element))
        )
      ]

      await this.pushPromotionAsync(promotionElements, restaurantId, {
        name: data.name,
        description: data.description,
        element: promotionElements.join(', '),
        discount_value: data.discount_value
      })

      return {
        message: "Promotion created successfully",
        totalMenus: menus.length
      }
    })
  }

  async pushPromotionAsync(targetElements, restaurantId, promotion) {
    setImmediate(async () => {
      try {
        const users = await this.restaurantRepo.findUsersByElements(restaurantId, targetElements)

        if (!users || users.length === 0) {
          return;
        }

        await this.pushPromotion(users, promotion, restaurantId)
      } catch (err) {
        console.error('Push Promotion Error:', err.response?.data || err.message);
      }
    })
  }

  async pushPromotion(users, promotion, restaurantId) {
    const chunks = this.chunkArray(users, 100)
    const URL = await this.regisUserbyRestaurant(restaurantId);
    const messageText = `🎉 โปรโมชั่นพิเศษสำหรับคุณ!

📌 ชื่อโปรโมชัน: ${promotion?.name ?? '-'}
📝 รายละเอียด: ${promotion?.description ?? '-'}
🔥 ธาตุที่เข้าร่วม: ${promotion?.element ?? '-'}
💸 ส่วนลด: ${promotion?.discount_value ?? 0}%

 ตรจจสอบโปรโมชันได้ที่ ${URL}
 รีบใช้ก่อนหมดเขตนะ ✨
`;

    for (const group of chunks) {
      await Promise.all(
        group.map(user =>
          axios.post(
            'https://api.line.me/v2/bot/message/push',
            {
              to: user.line_uid,
              messages: [
                {
                  type: 'text',
                  text: messageText
                }
              ]
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
              }
            }
          )
        )
      )
    }
  }

  chunkArray(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }

  async getAllPromotion(restaurantId) {
    const rows = await this.restaurantRepo.getAllPromotionByRestaurant(restaurantId);

    const groupMap = {};

    for (const row of rows) {
      const groupId = row.promotion_group_id;

      if (!groupMap[groupId]) {
        groupMap[groupId] = {
          promotion_group_id: groupId,
          name: row.name,
          description: row.description,
          discount_value: row.discount_value,
          start_date: row.start_date,
          end_date: row.end_date,
          status: row.status,
          created_at: row.created_at,
          updated_at: row.updated_at,
          menus: []
        };
      }

      if (row.menu_id) {
        const discountValue = row.discount_value;

        const afterDiscount = row.menu_price - (row.menu_price * discountValue) / 100;

        groupMap[groupId].menus.push({
          id: row.menu_id,
          name: row.menu_name,
          price: row.menu_price,
          afterDiscount: String(Number(afterDiscount.toFixed(2)))
        });
      }
    }

    return {
      total_groups: Object.keys(groupMap).length,
      promotion_groups: Object.values(groupMap),
    };
  }

  async getPromotionGroup(groupId) {
    const rows = await this.restaurantRepo.getPromotionGroup(groupId);

    if (rows.length === 0) {
      throw new Error('Promotion group not found');
    }

    const first = rows[0];

    const result = {
      promotion_group_id: first.promotion_group_id,
      name: first.name,
      description: first.description,
      discount_value: first.discount_value,
      start_date: first.start_date,
      end_date: first.end_date,
      status: first.status,
      created_at: first.created_at,
      updated_at: first.updated_at,
      menus: []
    };

    for (const row of rows) {
      if (row.menu_id) {
        const discount = row.discount_value || 0;
        const afterDiscount =
          row.menu_price - (row.menu_price * discount) / 100;

        result.menus.push({
          id: row.menu_id,
          name: row.menu_name,
          price: row.menu_price,
          afterDiscount: String(Number(afterDiscount.toFixed(2)))
        });
      }
    }

    return result;
  }

  async updatePromotionGroup(groupId, data) {

    const result = await this.restaurantRepo.updatePromotionGroup({
      ...data,
      groupId
    });

    if (result.length === 0) {
      throw new Error('Promotion group not found');
    }

    return { message: 'Promotion group updated successfully' };
  }


  async deletePromotionGroup(groupId) {
    const result = await this.restaurantRepo.deletePromotionGroup(groupId);

    if (result.length === 0) {
      throw new Error('Promotion group not found');
    }

    return { message: 'Promotion group deleted successfully' };
  }


  async restaurantUser(restaurantId) {
    const user = await this.restaurantRepo.findUser(restaurantId)

    const element = await this.restaurantRepo.collectElement(restaurantId)

    return {
      element: element || [],
      user: user || []
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
    const token = encodeShort(restaurantId);

    const baseUrl = process.env.FRONTEND_URL;

    if (!baseUrl) {
      throw new Error('FRONTEND_URL is not defined');
    }

    return `${baseUrl}/loginuser?t=${token}`;
  }
}

export default RestaurantService