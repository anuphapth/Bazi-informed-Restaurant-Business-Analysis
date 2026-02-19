import express from "express"
import { authenticateToken, requireRole } from "../middleware/auth.js"
import { login, refreshAccessToken, logout, createRestaurant, getAllRestaurant, updateUserByAdmin, deleteUserByAdmin, deleteRestaurantByAdmin } from '../controllers/admin.js'
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

routes.post(
  "/admin/restaurant",
  authenticateToken,
  requireRole("ADMIN"),
  asyncHandler(getAllRestaurant)
)

routes.put(
  "/admin/restaurant/edit/user",
  authenticateToken,
  requireRole("ADMIN"),
  adminValidation.editUser,
  asyncHandler(updateUserByAdmin)
)

routes.delete(
  "/admin/restaurant/delete/user",
  authenticateToken,
  requireRole("ADMIN"),
  adminValidation.deleteUser,
  asyncHandler(deleteUserByAdmin)
)

routes.delete(
  "/admin/restaurant/delete",
  authenticateToken,
  requireRole("ADMIN"),
  adminValidation.deleteRestaurant,
  asyncHandler(deleteRestaurantByAdmin)
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
