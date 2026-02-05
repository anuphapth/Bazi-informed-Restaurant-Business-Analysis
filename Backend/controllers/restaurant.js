import constants from "../lib/constants.js"
import db from "../lib/db.js"
import bcrypt from "bcrypt"
import dotenv from "dotenv"
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"

import {
  encodeShort,
} from '../utils/cryptoUtil.js'

import { getPublicIdFromUrl } from '../utils/cloudinary.js'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeAccessToken,
  revokeRefreshToken,
  revokeAllUserTokens,
} from "../lib/jwt.js"
dotenv.config()

const SALT_ROUNDS = 12

export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    /*
        const loginCheck = await checkLoginAttempts(email, "restaurant")
        if (loginCheck.locked) {
          return res.status(429).json({
            message: `Too many failed login attempts. Please try again in 15 minutes.`,
            code: "ACCOUNT_LOCKED",
            attempts: loginCheck.attempts,
          })
        }
    */
    const [checkLogin] = await db.query(constants.restaurantLogin, [email])
    if (checkLogin.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" })
    }
    const isMatch = await bcrypt.compare(password, checkLogin[0].password)
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    const restaurant = checkLogin[0]
    const accessToken = generateAccessToken({
      userId: restaurant.id,
      userType: "restaurant",
      restaurantId: restaurant.id,
    })

    const refreshToken = await generateRefreshToken(restaurant.id, "restaurant", {
      deviceInfo: req.headers["user-agent"],
      ipAddress: req.ip,
    })

    //await trackLoginAttempt(email, "restaurant", true, { ipAddress: req.ip }

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "Lax",
      secure: false,
      path: "/api/restaurant",
    })
    return res.status(200).json({
      message: "Login successful",
      user: {
        restaurant_id: restaurant.id,
        name: restaurant.name,
        email: restaurant.email,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    })
  } catch (error) {
    console.error("[Restaurant Login Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const preEdit = async (req, res) => {
  try {
    const restaurant_id = req.user.restaurantId

    const [info] = await db.query(constants.CheckRestarant, [restaurant_id])

    return res.status(200).json({ info })
  } catch (error) {
    console.error("[preEdit Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const editRestaurant = async (req, res) => {
  try {
    const { name, email, password, status } = req.body
    const restaurant_id = req.user.restaurantId

    let hashPassword = null
    if (password) {
      hashPassword = await bcrypt.hash(password, SALT_ROUNDS)
    }

    await db.query(constants.editRestaurant, [name, email, hashPassword, status, restaurant_id])

    return res.status(200).json({ message: "Restaurant updated successfully" })
  } catch (error) {
    console.error("[EditRestaurant Error]", error)

    if (error.code === "23505") {
      return res.status(409).json({ message: "Email already exists" })
    }

    return res.status(500).json({ message: "Server error" })
  }
}

export const menu = async (req, res) => {
  try {
    const { page } = req.body
    const restaurant_id = req.user.restaurantId
    const limit = 12
    const offset = (page - 1) * limit

    const [getMenu] = await db.query(constants.getMenu, [restaurant_id, limit, offset])
    const [rows] = await db.query(constants.getAllrowMenuByRestaurant, [restaurant_id])
    const lastPage = Math.ceil(rows[0].total / limit);
    return res.status(200).json({
      lastPage,
      getMenu
    })
  } catch (error) {
    console.error("[Menu Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const addNewMenu = async (req, res) => {
  try {
    const { name, price, element, status, description } = req.body
    const restaurant_id = req.user.restaurantId

    let elementValue = "[]"
    if (element) {
      elementValue = Array.isArray(element)
        ? JSON.stringify(element)
        : JSON.stringify([element])
    }

    if (!req.file) {
      await db.query(constants.addNewMenu, [
        restaurant_id,
        name,
        description,
        price,
        elementValue,
        null,
        status || "AVAILABLE",
      ])

      res.status(201).json({
        message: "Menu created successfully",
      })
    } else {
      const uploadResult = await uploadToCloudinary(req.file.buffer)

      const image_url = uploadResult.secure_url

      const image_public_id = uploadResult.public_id

      await db.query(constants.addNewMenu, [
        restaurant_id,
        name,
        description,
        price,
        elementValue,
        image_url,
        status || "AVAILABLE",
      ])

      res.status(201).json({
        message: "Menu created successfully",
      })
    }
  } catch (error) {
    console.error("[AddMenu Error]", error)
    res.status(500).json({ message: "Server error" })
  }
}

export const editMenu = async (req, res) => {
  try {
    const { menuid, name, price, element, status } = req.body

    if (!menuid) {
      return res.status(400).json({ message: "menuid is required" })
    }

    const [findMenu] = await db.query(
      constants.findMenuByRestaurant,
      [menuid]
    )

    if (findMenu.length === 0) {
      return res.status(404).json({ message: "Menu not found" })
    }

    const oldImageUrl = findMenu[0].image_url
    let imageUrlToSave = oldImageUrl

    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer)
      imageUrlToSave = uploadResult.secure_url

      if (oldImageUrl) {
        const publicId = getPublicIdFromUrl(oldImageUrl)
        if (publicId) {
          await deleteFromCloudinary(publicId)
        }
      }
    }

    const elementValue = element
      ? JSON.stringify(Array.isArray(element) ? element : [element])
      : null

    await db.query(constants.editMenu, [
      name,
      price,
      elementValue,
      imageUrlToSave,
      status,
      menuid,
    ])

    return res.status(200).json({
      message: "Menu updated successfully",
    })
  } catch (error) {
    console.error("[EditMenu Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const deleteMenuByRestaurant = async (req, res) => {
  try {
    const { menuid } = req.body

    const [findMenu] = await db.query(
      constants.findMenuByRestaurant,
      [menuid]
    )

    if (findMenu.length === 0) {
      return res.status(404).json({ message: "Menu not found" })
    }

    const oldImageUrl = findMenu[0].image_url
    const publicId = getPublicIdFromUrl(oldImageUrl)
    if (publicId) {
      await deleteFromCloudinary(publicId)
    }
    await db.query(constants.deleteMenu, [menuid])

    return res.status(200).json({ message: "Delete Menu successfully" })
  } catch (error) {
    console.error("[DeleteMenu Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const createPromotion = async (req, res) => {
  const connection = await db.getConnection()

  try {
    await connection.query("BEGIN")

    const { element, description, discount_value, start_date, end_date } = req.body

    const [menus] = await connection.query(constants.findMenuelelemet, [JSON.stringify(element)])

    if (menus.length === 0) {
      await connection.query("ROLLBACK")
      return res.status(404).json({ message: "No menus match the specified elements" })
    }

    const [groupResult] = await connection.query(constants.createGroupPromotion)
    const promotionGroupId = groupResult[0].nextGroup

    for (const menu of menus) {
      await connection.query(constants.createPromotion, [
        promotionGroupId,
        menu.id,
        description || null,
        discount_value,
        start_date,
        end_date,
        "AVAILABLE",
      ])
    }

    await connection.query("COMMIT")

    return res.status(201).json({
      message: "Promotion created successfully",
      promotion_group_id: promotionGroupId,
      menu_count: menus.length,
    })
  } catch (error) {
    await connection.query("ROLLBACK")
    console.error("[CreatePromotion Error]", error)
    return res.status(500).json({ message: "Server error" })
  } finally {
    connection.release()
  }
}

export const getAllPromotion = async (req, res) => {
  try {
    const restaurant_id = req.user.restaurantId

    const [rows] = await db.query(
      constants.getAllPromotionByRestaurant,
      [restaurant_id]
    )

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

    return res.status(200).json({
      total_groups: Object.keys(groupMap).length,
      promotion_groups: Object.values(groupMap),
    })
  } catch (error) {
    console.error("[getAllPromotion Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const getPromotionGroup = async (req, res) => {
  try {
    const { group_id } = req.params
    const [rows] = await db.query(constants.getPromotionGroup, [group_id])

    if (rows.length === 0) {
      return res.status(404).json({ message: "Promotion group not found" })
    }

    return res.status(200).json(rows[0])
  } catch (error) {
    console.error("[GetPromotionGroup Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const updatePromotionGroup = async (req, res) => {
  try {
    const { group_id, start_date, end_date, status } = req.body

    const result = await db.query(constants.updatePromotionGroup, [
      start_date || null,
      end_date || null,
      status || null,
      group_id,
    ])

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Promotion group not found" })
    }

    return res.status(200).json({ message: "Promotion group updated successfully" })
  } catch (error) {
    console.error("[UpdatePromotionGroup Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const deletePromotionGroup = async (req, res) => {
  try {
    const { group_id } = req.params

    const result = await db.query(constants.deletePromotionGroup, [group_id])

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Promotion group not found" })
    }

    return res.status(200).json({ message: "Promotion group deleted successfully" })
  } catch (error) {
    console.error("[DeletePromotionGroup Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const restaurantUser = async (req, res) => {
  try {
    const { page } = req.body
    const restaurant_id = req.user.restaurantId
    const limit = 12
    const offset = (page - 1) * limit

    const [user] = await db.query(constants.findUser, [restaurant_id, limit, offset])

    if (user.length === 0) {
      return res.status(404).json({ message: "No users found in restaurant" })
    }

    const [element] = await db.query(constants.coolactElement)
    const [rows] = await db.query(constants.getAllrowUserByRestaurant, [restaurant_id])
    const lastPage = Math.ceil(rows[0].total / limit);
    return res.status(200).json({
      lastPage,
      element: element || [],
      user: user || [],
    })
  } catch (error) {
    console.error("[RestaurantUser Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body
    const authHeader = req.headers.authorization
    const accessToken = authHeader && authHeader.split(" ")[1]

    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token required",
        code: "TOKEN_REQUIRED",
      })
    }

    const decoded = await verifyRefreshToken(refreshToken)

    const newAccessToken = generateAccessToken({
      userId: decoded.userId,
      userType: decoded.userType,
      restaurantId: decoded.restaurantId || decoded.userId,
    })

    return res.status(200).json({
      accessToken: newAccessToken,
    })
  } catch (error) {
    if (error.message === "Refresh token expired" || error.message === "Refresh token not found or expired") {
      return res.status(401).json({
        message: "Refresh token expired",
        code: "REFRESH_TOKEN_EXPIRED",
      })
    }

    return res.status(403).json({
      message: "Invalid refresh token",
      code: "REFRESH_TOKEN_INVALID",
    })
  }
}

export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body
    const authHeader = req.headers.authorization
    const accessToken = authHeader && authHeader.split(" ")[1]

    if (accessToken) {
      await revokeAccessToken(accessToken, "restaurant_logout")
    }

    if (refreshToken) {
      await revokeRefreshToken(refreshToken, "restaurant_logout")
    }

    return res.status(200).json({
      message: "Logged out successfully",
    })
  } catch (error) {
    console.error("[Logout Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const logoutAllDevices = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" })
    }

    await revokeAllUserTokens(req.user.id, req.user.type)

    return res.status(200).json({
      message: "Logged out from all devices successfully",
    })
  } catch (error) {
    console.error("[LogoutAllDevices Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const regisUserbyRestaurant = async (req, res) => {
  try {
    const restaurant_id = req.user.restaurantId
    const token = encodeShort(restaurant_id)
    return res.status(200).json(`https://meningococcic-geratologic-harriett.ngrok-free.dev/loginuser?t=${token}`)
  } catch (error) {
    console.error("[Menu Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}