import AdminService from '../services/admin.service.js'

import {
  generateAccessToken,
  verifyRefreshToken
} from '../lib/jwt.js'
const adminService = new AdminService()

export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    const result = await adminService.login(email, password)

    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'Lax',
      secure: false,
      path: '/api/admin',
    })

    return res.status(200).json({
      message: 'Login successful',
      user: {
        userId: result.restaurant.id,
        email: email,
      },
      tokens: { accessToken: result.tokens.accessToken }
    });

  } catch (error) {
    if (error.message === 'Invalid email or password') {
      return res.status(401).json({ message: error.message })
    }
    console.error('[Admin Login Error]', error)
    return res.status(500).json({ message: 'Server error' })
  }
}

export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken
    console.log(refreshToken)
    if (!refreshToken) {
      return res.status(401).json({
        message: 'Refresh token required',
        code: 'TOKEN_REQUIRED',
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
    if (error.message === 'Refresh token expired' || error.message === 'Refresh token not found or expired') {
      return res.status(401).json({
        message: 'Refresh token expired',
        code: 'REFRESH_TOKEN_EXPIRED',
      })
    }

    return res.status(403).json({
      message: 'Invalid refresh token',
      code: 'REFRESH_TOKEN_INVALID',
    })
  }
}

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken
    const authHeader = req.headers.authorization
    const accessToken = authHeader && authHeader.split(' ')[1]

    await adminService.logout(accessToken, refreshToken)

    return res.status(200).json({
      message: 'Logged out successfully',
    })
  } catch (error) {
    console.error('[Logout Error]', error)
    return res.status(500).json({ message: 'Server error' })
  }
}

export const createRestaurant = async (req, res) => {
  try {
    const result = await adminService.createRestaurant(req.body)
    res.status(201).json({ message: 'Restaurant created' })
  } catch (error) {
    if (error.message === 'Duplicate Email') {
      return res.status(400).json({ message: 'Duplicate Email' })
    }
    console.error('[CreateRestaurant Error]', error)
    return res.status(500).json({ message: 'Server error' })
  }
}

export const getAllRestaurant = async (req, res) => {
  try {
    const result = await adminService.getAllRestaurant()
    return res.status(200).json(result)
  } catch (error) {
    console.error('[getAllRestaurant Error]', error)
    return res.status(500).json({ message: 'Server error' })
  }
}

export const updateUserByAdmin = async (req, res) => {
  try {
    const data = req.body || {}
    if (!Object.keys(data).length) {
      return res.status(400).json({ message: "Request body is required" })
    }

    const updateResult = await adminService.updateUserByAdmin(data)
    return res.status(200).json({ message: "Update successful" })
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ message: error.message })
    }
    console.error('[updateUserByAdmin Error]', error)
    return res.status(500).json({ message: 'Server error' })
  }
}