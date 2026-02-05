import constants from "../lib/constants.js"
import db from "../lib/db.js"
import bcrypt from "bcrypt"
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeAccessToken,
  revokeRefreshToken,
} from "../lib/jwt.js"
import { stringify } from "querystring"

export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    const [checkLogin] = await db.query(constants.adminLogin, [email])

    if (checkLogin.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    const isMatch = await bcrypt.compare(String(password), checkLogin[0].password)
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" })
    }
    const admin = checkLogin[0]
    const accessToken = generateAccessToken({
      userId: admin.id,
      userType: "ADMIN",
    })

    const refreshToken = await generateRefreshToken(admin.id, "Admin", {
      deviceInfo: req.headers["user-agent"],
      ipAddress: req.ip,
    })

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "Lax",
      secure: false,
      path: "/api/admin",
    })

    return res.status(200).json({
      message: "Login successful",
      user: {
        userId: admin.id,
        email: email,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    })
  } catch (error) {
    console.error("[Admin Login Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken
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
      restaurantId: decoded.restaurantId,
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
    const refreshToken = req.cookies.refreshToken
    const authHeader = req.headers.authorization
    const accessToken = authHeader && authHeader.split(" ")[1]

    if (accessToken) {
      await revokeAccessToken(accessToken, "user_logout")
    }

    if (refreshToken) {
      await revokeRefreshToken(refreshToken, "user_logout")
    }

    return res.status(200).json({
      message: "Logged out successfully",
    })
  } catch (error) {
    console.error("[Logout Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const createRestaurant = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body
  
    const hashedPassword = await bcrypt.hash(stringify(password), 12)
    
    const [checkEmail] = await db.query(constants.restaurantLogin,[email])
    if(checkEmail.length > 0) {
      res.status(400).json({ message: "Dulipecate Email"})
    } else{
      await db.query(constants.adminRegisRestaurant, [name, email, hashedPassword, phone, address])
      res.status(201).json({ message: "Restaurant created" })
    }
  } catch (error) {
        console.error("[CreateRestauran Error]", error)
    return res.status(500).json({ message: "Server error" })
  }
}
