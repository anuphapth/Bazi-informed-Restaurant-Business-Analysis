import express from "express"
import {
  lineUIDCheck,
  register,
  preEditProfile,
  editProfile,
  prediction,
  menu,
  findMenu,
  filterMenu,
  createCoupon,
  useCoupon,
  refreshAccessToken,
  logout,
  logoutAllDevices,
} from "../controllers/auth.js"
import { authValidation } from "../middleware/validation.js"
// import { authLimiter, strictLimiter } from "../middleware/rateLimiter.js"
import { asyncHandler } from "../middleware/errorHandler.js"
import { authenticateToken, requireRole } from "../middleware/auth.js"

const routes = express.Router()

routes.post("/auth/lineUIDCheck", authValidation.lineUIDCheck, asyncHandler(lineUIDCheck))
routes.post("/auth/register", authValidation.register, asyncHandler(register))

routes.post("/auth/refresh", asyncHandler(refreshAccessToken))
routes.post("/auth/logout", asyncHandler(logout))
routes.post("/auth/logout-all", authenticateToken, requireRole("USER"), asyncHandler(logoutAllDevices))

routes.post(
  "/auth/detial",
  authenticateToken,
  requireRole("USER"),
  asyncHandler(preEditProfile),
)
routes.put(
  "/auth/editProfile",
  authenticateToken,
  requireRole("USER"),
  authValidation.editProfile,
  asyncHandler(editProfile),
)
routes.post(
  "/auth/prediction",
  authenticateToken,
  requireRole("USER"),
  asyncHandler(prediction),
)

routes.post(
  "/auth/menu",
  authenticateToken,
  requireRole("USER"),
  authValidation.page,
  asyncHandler(menu),
)

routes.post(
  "/auth/menu/like",
  authenticateToken,
  requireRole("USER"),
  authValidation.page,
  asyncHandler(findMenu),
)

routes.post(
  "/auth/menu/filter",
  authenticateToken,
  requireRole("USER"),
  asyncHandler(filterMenu),
)

routes.post(
  "/auth/coupon/add",
  authenticateToken,
  requireRole("USER"),
  authValidation.createCoupon,
  asyncHandler(createCoupon),
)

routes.post(
  "/auth/coupon/use",
  authValidation.useCoupon,
  asyncHandler(useCoupon),
)

export default routes
