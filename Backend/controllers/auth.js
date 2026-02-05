import AuthService from '../services/auth.service.js'

const authService = new AuthService()

export const lineUIDCheck = async (req, res) => {
  try {
    const { lineUid } = req.body
    const token = req.query.t

    const result = await authService.lineUIDCheck(lineUid, token)
    if (result.action === 'Register') {
      return res.status(404).json({ action: 'Register' })
    }
    
    return res.status(200).json(result)
  } catch (error) {
    console.error('[lineUIDCheck Error]', error)
    if (error.message === 'Restaurant not found') {
      return res.status(401).json({ message: error.message })
    }
    return res.status(500).json({ message: 'Server error' })
  }
}

export const register = async (req, res) => {
  try {
    const token = req.query.t
    const result = await authService.register(req.body, token)
    return res.status(201).json(result)
  } catch (error) {
    console.error('[Register Error]', error)
    if (error.message === 'Restaurant not found') {
      return res.status(404).json({ message: error.message })
    }
    if (error.message === 'User already registered') {
      return res.status(409).json({ message: error.message })
    }
    if (error.message === 'Bazi service unavailable') {
      return res.status(503).json({ message: error.message })
    }
    if (error.message === 'Invalid Bazi response') {
      return res.status(502).json({ message: error.message })
    }
    if (error.message === 'Invalid element data') {
      return res.status(502).json({ message: error.message })
    }
    return res.status(500).json({ message: 'Server error' })
  }
}

export const preEditProfile = async (req, res) => {
  try {
    const userID = req.user.id
    const result = await authService.preEditProfile(userID)
    return res.status(200).json(result)
  } catch (error) {
    console.error('[preEditProfile Error]', error)
    return res.status(500).json({ message: 'Server error' })
  }
}

export const editProfile = async (req, res) => {
  try {
    const userID = req.user.id
    const result = await authService.editProfile(userID, req.body)
    return res.status(200).json(result)
  } catch (error) {
    console.error('[EditProfile Error]', error)
    return res.status(500).json({ message: 'Server error' })
  }
}

export const prediction = async (req, res) => {
  try {
    const userID = req.user.id
    const result = await authService.prediction(userID)
    return res.status(200).json(result)
  } catch (error) {
    console.error('[Prediction Error]', error)
    if (error.message === 'User not found') {
      return res.status(404).json({ message: error.message })
    }
    if (error.message === 'Invalid user element data') {
      return res.status(400).json({ message: error.message })
    }
    if (error.message === 'AI service not configured') {
      return res.status(500).json({ message: error.message })
    }
    if (error.message === 'Prediction service unavailable') {
      return res.status(503).json({ message: error.message })
    }
    return res.status(500).json({ message: 'Server error' })
  }
}

export const menu = async (req, res) => {
  try {
    const userID = req.user.id
    const { page } = req.body
    const result = await authService.menu(userID, page)
    return res.status(200).json(result)
  } catch (error) {
    console.error('[menu Error]', error)
    return res.status(500).json({ message: 'Server error' })
  }
}

export const findMenu = async (req, res) => {
  try {
    const userID = req.user.id
    const { page } = req.body
    const result = await authService.findMenu(userID, page)
    return res.status(200).json(result)
  } catch (error) {
    console.error('[FindMenu Error]', error)
    return res.status(500).json({ message: 'Server error' })
  }
}

export const filterMenu = async (req, res) => {
  try {
    const { element, price = 'asc', page = 1 } = req.body
    const restaurantId = req.user.restaurantId
    const result = await authService.filterMenu(restaurantId, element, price, page)
    return res.status(200).json(result)
  } catch (error) {
    console.error('[filterMenu Error]', error)
    return res.status(500).json({ message: 'Server error' })
  }
}

export const createCoupon = async (req, res) => {
  try {
    const { promotion_id } = req.body
    const userID = req.user.id
    const result = await authService.createCoupon(userID, promotion_id)
    return res.status(201).json(result)
  } catch (error) {
    console.error('[CreateCoupon Error]', error)
    if (error.message === 'Promotion is not active or does not exist') {
      return res.status(400).json({ message: error.message })
    }
    return res.status(500).json({ message: 'Server error' })
  }
}

export const useCoupon = async (req, res) => {
  try {
    const { code } = req.body
    const result = await authService.useCoupon(code)
    return res.status(200).json(result)
  } catch (error) {
    console.error('[UseCoupon Error]', error)
    if (error.message === 'Invalid or expired coupon') {
      return res.status(400).json({ message: error.message })
    }
    if (error.message === 'Coupon already used') {
      return res.status(400).json({ message: error.message })
    }
    return res.status(500).json({ message: 'Server error' })
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

    const result = await authService.refreshAccessToken(refreshToken)
    return res.status(200).json(result)
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

    await authService.logout(accessToken, refreshToken)

    return res.status(200).json({
      message: 'Logged out successfully',
    })
  } catch (error) {
    console.error('[Logout Error]', error)
    return res.status(500).json({ message: 'Server error' })
  }
}

export const logoutAllDevices = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    const result = await authService.logoutAllDevices(req.user.id, req.user.type)
    return res.status(200).json(result)
  } catch (error) {
    console.error('[LogoutAllDevices Error]', error)
    return res.status(500).json({ message: 'Server error' })
  }
}
