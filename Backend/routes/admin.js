import express from "express"
import { authenticateToken,requireRole } from "../middleware/auth.js"
import { login, refreshAccessToken, logout, createRestaurant,getAllRestaurant, updateUserByAdmin } from '../controllers/admin.js'
import { adminValidation, authValidation } from "../middleware/validation.js"
import { asyncHandler } from "../middleware/errorHandler.js"
const routes = express.Router()

routes.post(
  "/admin/login",
  adminValidation.login,
  asyncHandler(login)
)

routes.post(
  "/admin/restaurant/create",
  authenticateToken,
  requireRole("ADMIN"),
  adminValidation.createRestaurant,
  asyncHandler(createRestaurant)
)

routes.get(
  "/admin/restaurant",
  authenticateToken,
  requireRole("ADMIN"),
  asyncHandler(getAllRestaurant)
)

routes.post(
  "/admin/restaurant/edit/user",
  authenticateToken,
  requireRole("ADMIN"),
  asyncHandler(updateUserByAdmin)
)

routes.post(
  "/admin/refresh",
  asyncHandler(refreshAccessToken)
)

routes.post(
  "/admin/logout",
  asyncHandler(logout)
)

export default routes
