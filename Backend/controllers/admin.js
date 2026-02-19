import AdminService from '../services/admin.service.js'
import { generateAccessToken, verifyRefreshToken } from '../lib/jwt.js'

const adminService = new AdminService()

const handleServerError = (res, error, context) => {
  console.error(`[${context} Error]`, error)
  return res.status(500).json({
    message: 'An error occurred while processing your request',
    code: 'INTERNAL_SERVER_ERROR'
  })
}

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
        userId: result.admin.id,
        email: email,
      },
      tokens: { accessToken: result.tokens.accessToken }
    })

  } catch (error) {
    if (error.message === 'Invalid email or password') {
      return res.status(401).json({
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      })
    }
    return handleServerError(res, error, 'Admin Login')
  }
}

export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken
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
    return handleServerError(res, error, 'Logout')
  }
}

export const createRestaurant = async (req, res) => {
  try {
    const result = await adminService.createRestaurant(req.body)
    res.status(201).json({ message: 'Restaurant created successfully' })
  } catch (error) {
    if (error.message === 'Duplicate Email') {
      return res.status(400).json({
        message: 'Email already exists',
        code: 'DUPLICATE_EMAIL'
      })
    }
    return handleServerError(res, error, 'CreateRestaurant')
  }
}

export const getAllRestaurant = async (req, res) => {
  try {
    const result = await adminService.getAllRestaurant()
    return res.status(200).json(result)
  } catch (error) {
    return handleServerError(res, error, 'GetAllRestaurant')
  }
}

export const getAllMemberRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.body
    const result = await adminService.getAllMemberRestaurant(restaurantId)
    return res.status(200).json(result)
  } catch (error) {
    return handleServerError(res, error, 'getAllMemberRestaurant')
  }
}
export const updateUserByAdmin = async (req, res) => {
  try {
    const data = req.body || {}
    if (!Object.keys(data).length) {
      return res.status(400).json({
        message: "Request body is required",
        code: 'MISSING_REQUEST_BODY'
      })
    }

    await adminService.updateUserByAdmin(data)
    return res.status(200).json({ message: "Update successful" })
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      })
    }
    return handleServerError(res, error, 'UpdateUserByAdmin')
  }
}

export const deleteUserByAdmin = async (req, res) => {
  try {
    const data = req.body
    await adminService.deleteUserByAdmin(data)
    return res.status(200).json({ message: 'Delete successful' })
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      })
    }
    if (error.message === 'userId is required') {
      return res.status(400).json({
        message: 'User id is required',
        code: 'MISSING_USER_ID'
      })
    }
    return handleServerError(res, error, 'DeleteUserByAdmin')
  }
}

export const deleteRestaurantByAdmin = async (req, res) => {
  try {
    const data = req.body
    await adminService.deleteRestaurantByAdmin(data)
    return res.status(200).json({ message: 'Delete successful' })
  } catch (error) {
    if (error.message === 'Restaurant not found') {
      return res.status(404).json({
        message: 'Restaurant not found',
        code: 'RESTAURANT_NOT_FOUND'
      })
    }
    return handleServerError(res, error, 'DeleteRestaurantByAdmin')
  }
}
