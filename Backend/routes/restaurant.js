import express from "express"
import {
  login,
  editRestaurant,
  menu,
  regisUserbyRestaurant,
  addNewMenu,
  deleteMenuByRestaurant,
  preEdit,
  editMenu,
  createPromotion,
  getPromotionGroup,
  updatePromotionGroup,
  getAllPromotion,
  deletePromotionGroup,
  restaurantUser,
  refreshAccessToken,
  logout,
  logoutAllDevices,
} from "../controllers/restaurant.js"
import { restaurantValidation } from "../middleware/validation.js"
import { authLimiter } from "../middleware/rateLimiter.js"
import { asyncHandler } from "../middleware/errorHandler.js"
import { authenticateToken,requireRole } from "../middleware/auth.js"

import multer from "multer"
const upload = multer({
  storage: multer.memoryStorage(),
});

const routes = express.Router()

routes.post("/restaurant/login", restaurantValidation.login, asyncHandler(login))
routes.post("/restaurant/refresh", asyncHandler(refreshAccessToken))
routes.post("/restaurant/logout", asyncHandler(logout))
routes.post("/restaurant/logout-all", authenticateToken, requireRole("restaurant"), asyncHandler(logoutAllDevices))

routes.post("/restaurant/info",
  authenticateToken,
  requireRole("restaurant"),
  asyncHandler(preEdit)
)
routes.put(
  "/restaurant/edit",
  authenticateToken,
  requireRole("restaurant"),
  restaurantValidation.editRestaurant,
  asyncHandler(editRestaurant),
)
routes.post(
  "/restaurant/create/user",
  authenticateToken,
  requireRole("restaurant"),
  asyncHandler(regisUserbyRestaurant),
)
routes.post(
  "/restaurant/menu",
  authenticateToken,
  requireRole("restaurant"),
  restaurantValidation.menu,
  asyncHandler(menu),
)
routes.post(
  "/restaurant/add/menu",
  authenticateToken,
  requireRole("restaurant"),
  upload.single("image"),
  restaurantValidation.addNewMenu,
  asyncHandler(addNewMenu),
)
routes.put(
  "/restaurant/edit/menu",
  authenticateToken,
  requireRole("restaurant"),
  upload.single("image"),
  restaurantValidation.editMenu,
  asyncHandler(editMenu),
)
routes.delete(
  "/restaurant/delete/menu",
  authenticateToken,
  requireRole("restaurant"),
  restaurantValidation.deleteMenuByRestaurant,
  asyncHandler(deleteMenuByRestaurant),
)
routes.post(
  "/restaurant/promotion/create",
  authenticateToken,
  requireRole("restaurant"),
  restaurantValidation.createPromotion,
  asyncHandler(createPromotion),
)
routes.get(
  "/restaurant/promotion/get/all",
  authenticateToken,
  requireRole("restaurant"),
  asyncHandler(getAllPromotion),
)
routes.get(
  "/restaurant/promotionGroup/get/:group_id",
  authenticateToken,
  requireRole("restaurant"),
  restaurantValidation.getPromotionGroup,
  asyncHandler(getPromotionGroup),
)
routes.put(
  "/restaurant/promotionGroup/update",
  authenticateToken,
  requireRole("restaurant"),
  restaurantValidation.updatePromotionGroup,
  asyncHandler(updatePromotionGroup),
)
routes.delete(
  "/restaurant/promotionGroup/delete/:group_id",
  authenticateToken,
  requireRole("restaurant"),
  restaurantValidation.deletePromotionGroup,
  asyncHandler(deletePromotionGroup),
)
routes.post(
  "/restaurant/restaurantUser",
  authenticateToken,
  requireRole("restaurant"),
  restaurantValidation.restaurantUser,
  asyncHandler(restaurantUser),
)

export default routes
