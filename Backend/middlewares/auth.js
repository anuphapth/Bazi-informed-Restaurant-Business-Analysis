import { verifyAccessToken } from "../lib/jwt.js"

/**
 * Middleware to verify JWT access token
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(" ")[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        message: "Access token required",
        code: "TOKEN_REQUIRED",
      })
    }
    const decoded = await verifyAccessToken(token)

    // Attach user info to request
    req.user = {
      id: decoded.userId,
      userType: decoded.userType,
      restaurantId: decoded.restaurantId,
    }
    next()
  } catch (error) {
    if (error.message === "Token expired") {
      return res.status(401).json({
        message: "Access token expired",
        code: "TOKEN_EXPIRED",
      })
    }

    if (error.message === "Token has been revoked") {
      return res.status(401).json({
        message: "Token has been revoked",
        code: "TOKEN_REVOKED",
      })
    }

    return res.status(403).json({
      message: "Invalid access token",
      code: "TOKEN_INVALID",
    })
  }
}

/**
 * Middleware to verify user type
 */
export const requireRole = (roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" })
  }

  const allowed = Array.isArray(roles) ? roles : [roles]
  if (!allowed.includes(req.user.userType)) {
    return res.status(403).json({ message: "Forbidden" })
  }

  next()
}

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(" ")[1]

    if (token) {
      const decoded = await verifyAccessToken(token)
      req.user = {
        id: decoded.userId,
        type: decoded.userType,
        restaurantId: decoded.restaurantId,
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }

  next()
}
