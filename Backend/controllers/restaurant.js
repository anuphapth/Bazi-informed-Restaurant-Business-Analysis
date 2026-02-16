import RestaurantService from '../services/restaurant.service.js'

const restaurantService = new RestaurantService()

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const result = await restaurantService.login(email, password)

    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'Lax',
      secure: false,
      path: '/api/restaurant',
    })
    return res.status(200).json({
      message: 'Login successful',
      user: {
        restaurant_id: result.restaurant.id,
        name: result.restaurant.name,
        email: result.restaurant.email,
      },
      tokens: {accessToken:result.tokens.accessToken},
    })
  } catch (error) {
    console.error('[Restaurant Login Error]', error)
    if (error.message === 'Invalid email or password') {
      return res.status(401).json({ message: error.message })
    }
    return res.status(500).json({ message: 'Server error' })
  }
}

export const preEdit = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId
    const result = await restaurantService.preEdit(restaurantId)
    return res.status(200).json(result)
  } catch (error) {
    console.error('[preEdit Error]', error)
    return res.status(500).json({ message: 'Server error' })
  }
}

export const editRestaurant = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId
    const result = await restaurantService.editRestaurant(restaurantId, req.body)
    return res.status(200).json(result)
  } catch (error) {
    console.error('[EditRestaurant Error]', error)
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Email already exists' })
    }
    return res.status(500).json({ message: 'Server error' })
  }
}

export const menu = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId
    const { page } = req.body
    const result = await restaurantService.menu(restaurantId, page)
    return res.status(200).json(result)
  } catch (error) {
    console.error('[Menu Error]', error)
    return res.status(500).json({ message: 'Server error' })
  }
}

export const addNewMenu = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId
    const result = await restaurantService.addNewMenu(restaurantId, req.body, req.file)
    return res.status(201).json(result)
  } catch (error) {
    console.error('[AddMenu Error]', error)
    return res.status(500).json({ message: 'Server error' })
  }
}

export const editMenu = async (req, res) => {
  try {
    const { menuid, ...data } = req.body
    const result = await restaurantService.editMenu(menuid, data, req.file)
    return res.status(200).json(result)
  } catch (error) {
    console.error('[EditMenu Error]', error)
    if (error.message === 'Menu not found') {
      return res.status(404).json({ message: error.message })
    }
    return res.status(500).json({ message: 'Server error' })
  }
}

export const deleteMenuByRestaurant = async (req, res) => {
  try {
    const { menuid } = req.body
    const result = await restaurantService.deleteMenu(menuid)
    return res.status(200).json(result)
  } catch (error) {
    console.error('[DeleteMenu Error]', error)
    if (error.message === 'Menu not found') {
      return res.status(404).json({ message: error.message })
    }
    return res.status(500).json({ message: 'Server error' })
  }
}

export const createPromotion = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId

    const result = await restaurantService.createPromotion(
      req.body,
      restaurantId
    );

    return res.status(201).json(result);
  } catch (error) {
    if (error.message === 'Discount Error') {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === 'No menus match the specified elements') {
      return res.status(404).json({ message: error.message });
    }

    console.error('[CreatePromotion Error]', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getAllPromotion = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId
    const result = await restaurantService.getAllPromotion(restaurantId)
    return res.status(200).json(result)
  } catch (error) {
    console.error('[getAllPromotion Error]', error)
    return res.status(500).json({ message: 'Server error' })
  }
}

export const getPromotionGroup = async (req, res) => {
  try {
    const { group_id } = req.params
    const result = await restaurantService.getPromotionGroup(group_id)
    return res.status(200).json(result)
  } catch (error) {
    console.error('[GetPromotionGroup Error]', error)
    if (error.message === 'Promotion group not found') {
      return res.status(404).json({ message: error.message })
    }
    return res.status(500).json({ message: 'Server error' })
  }
}

export const updatePromotionGroup = async (req, res) => {
  try {
    const { group_id, ...data } = req.body
    const result = await restaurantService.updatePromotionGroup(group_id, data)
    return res.status(200).json(result)
  } catch (error) {
    console.error('[UpdatePromotionGroup Error]', error)
    if (error.message === 'Promotion group not found') {
      return res.status(404).json({ message: error.message })
    }
    return res.status(500).json({ message: 'Server error' })
  }
}

export const deletePromotionGroup = async (req, res) => {
  try {
    const { group_id } = req.params
    const result = await restaurantService.deletePromotionGroup(group_id)
    return res.status(200).json(result)
  } catch (error) {
    console.error('[DeletePromotionGroup Error]', error)
    if (error.message === 'Promotion group not found') {
      return res.status(404).json({ message: error.message })
    }
    return res.status(500).json({ message: 'Server error' })
  }
}

export const restaurantUser = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId
    const { page } = req.body
    const result = await restaurantService.restaurantUser(restaurantId, page)
    return res.status(200).json(result)
  } catch (error) {
    console.error('[RestaurantUser Error]', error)
    if (error.message === 'No users found in restaurant') {
      return res.status(404).json({ message: error.message })
    }
    return res.status(500).json({ message: 'Server error' })
  }
}

export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken

    if (!refreshToken) {
      return res.status(401).json({
        message: 'No refresh token',
      })
    }

    const result = await restaurantService.refreshAccessToken(refreshToken)

    return res.status(200).json(result)
  } catch (error) {
    if (
      error.message === 'Refresh token expired' ||
      error.message === 'Refresh token not found or expired'
    ) {
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
    const { refreshToken } = req.body
    const authHeader = req.headers.authorization
    const accessToken = authHeader && authHeader.split(' ')[1]

    await restaurantService.logout(accessToken, refreshToken)

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

    const result = await restaurantService.logoutAllDevices(req.user.id, req.user.type)
    return res.status(200).json(result)
  } catch (error) {
    console.error('[LogoutAllDevices Error]', error)
    return res.status(500).json({ message: 'Server error' })
  }
}

export const regisUserbyRestaurant = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId
    const result = await restaurantService.regisUserbyRestaurant(restaurantId)
    return res.status(200).json(result)
  } catch (error) {
    console.error('[regisUserbyRestaurant Error]', error)
    return res.status(500).json({ message: 'Server error' })
  }
}
