import jwt from "jsonwebtoken"
import crypto from "crypto"
import { executeQuery } from "./db.js"
import dotenv from "dotenv"
dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key-change-in-production"

// Token expiration times
const ACCESS_TOKEN_EXPIRY = "30m"
const REFRESH_TOKEN_EXPIRY = "7d"
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

/**
 * Generate access token (short-lived)
 */
export const generateAccessToken = (payload) => {
  const jti = crypto.randomBytes(16).toString("hex")

  return jwt.sign(
    {
      ...payload,
      jti, // JWT ID for blacklisting
      type: "access",
    },
    JWT_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: "restaurant-api",
      audience: "restaurant-app",
    },
  )
}

/**
 * Generate refresh token (long-lived) and store in database
 */
export const generateRefreshToken = async (userId, userType, metadata = {}) => {
  const jti = crypto.randomBytes(32).toString("hex")
  const tokenHash = crypto.createHash("sha256").update(jti).digest("hex")

  const refreshToken = jwt.sign(
    {
      jti,
      userId,
      userType,
      type: "refresh",
    },
    JWT_REFRESH_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: "restaurant-api",
      audience: "restaurant-app",
    },
  )

  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS)

  await executeQuery(
    `INSERT INTO refresh_tokens (
      user_id,
      user_type,
      token_hash,
      device_info,
      ip_address,
      expires_at,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [userId, userType, tokenHash, metadata.deviceInfo || null, metadata.ipAddress || null, expiresAt],
  )

  return refreshToken
}

/**
 * Verify access token
 */
export const verifyAccessToken = async (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "restaurant-api",
      audience: "restaurant-app",
    })

    if (decoded.type !== "access") {
      throw new Error("Invalid token type")
    }

    const blacklistCheck = await executeQuery(
      "SELECT id FROM token_blacklist WHERE token_hash = $1 AND expires_at > NOW()",
      [crypto.createHash("sha256").update(decoded.jti).digest("hex")],
    )

    if (blacklistCheck.length > 0) {
      throw new Error("Token has been revoked")
    }

    return decoded
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Token expired")
    }
    if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid token")
    }
    throw error
  }
}

/**
 * Verify refresh token
 */
export const verifyRefreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: "restaurant-api",
      audience: "restaurant-app",
    })

    if (decoded.type !== "refresh") {
      throw new Error("Invalid token type")
    }

    const tokenHash = crypto.createHash("sha256").update(decoded.jti).digest("hex")

    const result = await executeQuery(
      `SELECT id, user_id, user_type, revoked, expires_at
       FROM refresh_tokens
       WHERE token_hash = $1 AND revoked = false AND expires_at > NOW()`,
      [tokenHash],
    )

    if (result.length === 0) {
      throw new Error("Refresh token not found or expired")
    }

    return {
      ...decoded,
      tokenId: result[0].id,
    }
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Refresh token expired")
    }
    if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid refresh token")
    }
    throw error
  }
}

/**
 * Revoke access token (add to blacklist)
 */
export const revokeAccessToken = async (token, reason = "user_logout") => {
  try {
    const decoded = jwt.decode(token)

    if (!decoded || !decoded.jti) {
      throw new Error("Invalid token")
    }

    const tokenHash = crypto.createHash("sha256").update(decoded.jti).digest("hex")
    const expiresAt = new Date(decoded.exp * 1000)

    await executeQuery(
      `INSERT INTO token_blacklist (token_hash, user_id, user_type, reason, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (token_hash) DO NOTHING`,
      [tokenHash, decoded.userId, decoded.userType || "user", reason, expiresAt],
    )

    return true
  } catch (error) {
    console.error("[Revoke Access Token Error]", error)
    return false
  }
}

/**
 * Revoke refresh token
 */
export const revokeRefreshToken = async (token, reason = "user_logout") => {
  try {
    const decoded = jwt.decode(token)

    if (!decoded || !decoded.jti) {
      throw new Error("Invalid token")
    }

    const tokenHash = crypto.createHash("sha256").update(decoded.jti).digest("hex")

    await executeQuery(
      `UPDATE refresh_tokens 
       SET revoked = true, revoked_at = NOW(), revoked_reason = $1
       WHERE token_hash = $2`,
      [reason, tokenHash],
    )

    return true
  } catch (error) {
    console.error("[Revoke Refresh Token Error]", error)
    return false
  }
}

/**
 * Revoke all user tokens (logout from all devices)
 */
export const revokeAllUserTokens = async (userId, userType) => {
  try {
    await executeQuery(
      `UPDATE refresh_tokens 
       SET revoked = true, revoked_at = NOW(), revoked_reason = 'logout_all_devices'
       WHERE user_id = $1 AND user_type = $2 AND revoked = false`,
      [userId, userType],
    )

    return true
  } catch (error) {
    console.error("[Revoke All Tokens Error]", error)
    return false
  }
}

/**
 * Track login attempt
 */
export const trackLoginAttempt = async (identifier, userType, success, metadata = {}) => {
  try {
    await executeQuery(
      `INSERT INTO login_attempts (identifier, user_type, ip_address, success, failure_reason, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [identifier, userType, metadata.ipAddress || null, success ? true : false, metadata.failureReason || null],
    )
  } catch (error) {
    console.error("[Track Login Attempt Error]", error)
  }
}

/**
 * Check if user has too many failed login attempts
 */
export const checkLoginAttempts = async (identifier, userType, maxAttempts = 5, windowMinutes = 15) => {
  try {
    const result = await executeQuery(
      `SELECT COUNT(*) as attempts
       FROM login_attempts
       WHERE identifier = $1 
         AND user_type = $2
         AND success = false
         AND created_at > NOW() - INTERVAL '$3 minutes'`,
      [identifier, userType, windowMinutes],
    )

    const attempts = Number.parseInt(result[0]?.attempts || 0)

    return {
      locked: attempts >= maxAttempts,
      attempts,
      maxAttempts,
    }
  } catch (error) {
    console.error("[Check Login Attempts Error]", error)
    return { locked: false, attempts: 0, maxAttempts }
  }
}

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  revokeAccessToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  trackLoginAttempt,
  checkLoginAttempts,
}
