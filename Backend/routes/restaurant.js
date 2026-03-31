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
import { restaurantValidation } from "../middlewares/validation.js"
import { asyncHandler } from "../middlewares/errorHandler.js"
import { authenticateToken, requireRole } from "../middlewares/auth.js"

import multer from "multer"
const upload = multer({
  storage: multer.memoryStorage(),
})

const routes = express.Router()

/**
 * @swagger
 * tags:
 *   - name: Restaurant
 *     description: Restaurant account, menu, promotions
 */

/**
 * @swagger
 * /restaurant/login:
 *   post:
 *     tags: [Restaurant]
 *     summary: Restaurant login; sets refreshToken cookie (path /api/restaurant)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RestaurantLoginSuccess'
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: controllers/restaurant.js — message เท่ากับ Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RestaurantLogin401InvalidCreds'
 *       429:
 *         description: Too many login attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TooManyRequests429'
 *       500:
 *         description: "controllers/restaurant.js catch — JSON message: Server error"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthMessageServerError'
 */
routes.post("/restaurant/login", restaurantValidation.login, asyncHandler(login))

/**
 * @swagger
 * /restaurant/refresh:
 *   post:
 *     tags: [Restaurant]
 *     summary: Refresh access token (restaurant refresh cookie)
 *     responses:
 *       200:
 *         description: Token payload from service
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServicePayload'
 *       401:
 *         description: |
 *           ไม่มี cookie — { message: No refresh token }; หมดอายุ — message + code REFRESH_TOKEN_EXPIRED
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RestaurantRefresh401'
 *             examples:
 *               noCookie:
 *                 value:
 *                   message: No refresh token
 *               expired:
 *                 value:
 *                   message: Refresh token expired
 *                   code: REFRESH_TOKEN_EXPIRED
 *       403:
 *         description: controllers/restaurant.js refresh catch
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthRefresh403Invalid'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerError500'
 */
routes.post("/restaurant/refresh", asyncHandler(refreshAccessToken))

/**
 * @swagger
 * /restaurant/logout:
 *   post:
 *     tags: [Restaurant]
 *     summary: Restaurant logout (Bearer + refreshToken in body)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token string (controller reads from body)
 *     responses:
 *       200:
 *         description: Logged out
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogoutSuccess'
 *       500:
 *         description: "controllers/restaurant.js catch — JSON message: Server error"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthMessageServerError'
 */
routes.post("/restaurant/logout", asyncHandler(logout))

/**
 * @swagger
 * /restaurant/logout-all:
 *   post:
 *     tags: [Restaurant]
 *     summary: Logout all restaurant sessions (RESTAURANT)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Result from service
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServicePayload'
 *       401:
 *         description: JWT หรือ logoutAllDevices เมื่อ !req.user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer401'
 *       403:
 *         description: middlewares/auth.js — TOKEN_INVALID หรือ Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer403'
 *       500:
 *         description: "controllers/restaurant.js catch — JSON message: Server error"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthMessageServerError'
 */
routes.post(
  "/restaurant/logout-all",
  authenticateToken,
  requireRole("RESTAURANT"),
  asyncHandler(logoutAllDevices),
)

/**
 * @swagger
 * /restaurant/info:
 *   post:
 *     tags: [Restaurant]
 *     summary: Get restaurant profile for editing (RESTAURANT)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Restaurant data from service
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServicePayload'
 *       401:
 *         description: middlewares/auth.js — JWT / Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer401'
 *       403:
 *         description: middlewares/auth.js — TOKEN_INVALID หรือ Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer403'
 *       500:
 *         description: "controllers/restaurant.js catch — JSON message: Server error"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthMessageServerError'
 */
routes.post("/restaurant/info", authenticateToken, requireRole("RESTAURANT"), asyncHandler(preEdit))

/**
 * @swagger
 * /restaurant/edit:
 *   put:
 *     tags: [Restaurant]
 *     summary: Edit restaurant (RESTAURANT)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 200
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Updated restaurant from service
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServicePayload'
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: middlewares/auth.js — JWT / Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer401'
 *       403:
 *         description: middlewares/auth.js — TOKEN_INVALID หรือ Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer403'
 *       409:
 *         description: error.code === 23505 — message ตาม controller
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RestaurantEmailExists409'
 *       500:
 *         description: "controllers/restaurant.js catch — JSON message: Server error"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthMessageServerError'
 */
routes.put(
  "/restaurant/edit",
  authenticateToken,
  requireRole("RESTAURANT"),
  restaurantValidation.editRestaurant,
  asyncHandler(editRestaurant),
)

/**
 * @swagger
 * /restaurant/create/user:
 *   post:
 *     tags: [Restaurant]
 *     summary: Register user link/token for restaurant (RESTAURANT)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Result from service (e.g. invite token)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServicePayload'
 *       401:
 *         description: middlewares/auth.js — JWT / Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer401'
 *       403:
 *         description: middlewares/auth.js — TOKEN_INVALID หรือ Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer403'
 *       500:
 *         description: "controllers/restaurant.js catch — JSON message: Server error"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthMessageServerError'
 */
routes.post(
  "/restaurant/create/user",
  authenticateToken,
  requireRole("RESTAURANT"),
  asyncHandler(regisUserbyRestaurant),
)

/**
 * @swagger
 * /restaurant/menu:
 *   post:
 *     tags: [Restaurant]
 *     summary: Paginated menu list (RESTAURANT)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [page]
 *             properties:
 *               page:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Menu from service
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServicePayload'
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: middlewares/auth.js — JWT / Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer401'
 *       403:
 *         description: middlewares/auth.js — TOKEN_INVALID หรือ Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer403'
 *       500:
 *         description: "controllers/restaurant.js catch — JSON message: Server error"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthMessageServerError'
 */
routes.post(
  "/restaurant/menu",
  authenticateToken,
  requireRole("RESTAURANT"),
  restaurantValidation.menu,
  asyncHandler(menu),
)

/**
 * @swagger
 * /restaurant/add/menu:
 *   post:
 *     tags: [Restaurant]
 *     summary: Add menu item with image (RESTAURANT)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, price, image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 200
 *               price:
 *                 type: number
 *                 minimum: 0
 *               element:
 *                 type: string
 *                 description: JSON array string, e.g. ["WOOD","FIRE"]
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, UNAVAILABLE]
 *     responses:
 *       201:
 *         description: Created menu from service
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServicePayload'
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: middlewares/auth.js — JWT / Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer401'
 *       403:
 *         description: middlewares/auth.js — TOKEN_INVALID หรือ Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer403'
 *       500:
 *         description: "controllers/restaurant.js catch — JSON message: Server error"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthMessageServerError'
 */
routes.post(
  "/restaurant/add/menu",
  authenticateToken,
  requireRole("RESTAURANT"),
  upload.single("image"),
  restaurantValidation.addNewMenu,
  asyncHandler(addNewMenu),
)

/**
 * @swagger
 * /restaurant/edit/menu:
 *   put:
 *     tags: [Restaurant]
 *     summary: Edit menu; optional new image (RESTAURANT)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [menuid]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               menuid:
 *                 type: integer
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 200
 *               price:
 *                 type: number
 *                 minimum: 0
 *               element:
 *                 type: string
 *                 description: JSON array string
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, UNAVAILABLE]
 *     responses:
 *       200:
 *         description: Updated menu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServicePayload'
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: middlewares/auth.js — JWT / Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer401'
 *       403:
 *         description: middlewares/auth.js — TOKEN_INVALID หรือ Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer403'
 *       404:
 *         description: controllers/restaurant.js — Menu not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RestaurantMenuNotFound404'
 *       500:
 *         description: "controllers/restaurant.js catch — JSON message: Server error"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthMessageServerError'
 */
routes.put(
  "/restaurant/edit/menu",
  authenticateToken,
  requireRole("RESTAURANT"),
  upload.single("image"),
  restaurantValidation.editMenu,
  asyncHandler(editMenu),
)

/**
 * @swagger
 * /restaurant/delete/menu:
 *   delete:
 *     tags: [Restaurant]
 *     summary: Delete menu by id (RESTAURANT)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [menuid]
 *             properties:
 *               menuid:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Delete result from service
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServicePayload'
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: middlewares/auth.js — JWT / Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer401'
 *       403:
 *         description: middlewares/auth.js — TOKEN_INVALID หรือ Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer403'
 *       404:
 *         description: controllers/restaurant.js — Menu not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RestaurantMenuNotFound404'
 *       500:
 *         description: "controllers/restaurant.js catch — JSON message: Server error"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthMessageServerError'
 */
routes.delete(
  "/restaurant/delete/menu",
  authenticateToken,
  requireRole("RESTAURANT"),
  restaurantValidation.deleteMenuByRestaurant,
  asyncHandler(deleteMenuByRestaurant),
)

/**
 * @swagger
 * /restaurant/promotion/create:
 *   post:
 *     tags: [Restaurant]
 *     summary: Create promotion (RESTAURANT)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, element, discount_value, start_date, end_date]
 *             properties:
 *               name:
 *                 type: string
 *               element:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               discount_value:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Promotion created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServicePayload'
 *       400:
 *         description: Discount error or validation
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationError'
 *                 - $ref: '#/components/schemas/RestaurantPromotion400Discount'
 *       401:
 *         description: middlewares/auth.js — JWT / Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer401'
 *       403:
 *         description: middlewares/auth.js — TOKEN_INVALID หรือ Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer403'
 *       404:
 *         description: No menus match the specified elements
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RestaurantPromotion404NoMenus'
 *       500:
 *         description: "controllers/restaurant.js catch — JSON message: Server error"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthMessageServerError'
 */
routes.post(
  "/restaurant/promotion/create",
  authenticateToken,
  requireRole("RESTAURANT"),
  restaurantValidation.createPromotion,
  asyncHandler(createPromotion),
)

/**
 * @swagger
 * /restaurant/promotion/get/all:
 *   post:
 *     tags: [Restaurant]
 *     summary: List all promotions (RESTAURANT)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Promotions from service
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServicePayload'
 *       401:
 *         description: middlewares/auth.js — JWT / Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer401'
 *       403:
 *         description: middlewares/auth.js — TOKEN_INVALID หรือ Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer403'
 *       500:
 *         description: "controllers/restaurant.js catch — JSON message: Server error"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthMessageServerError'
 */
routes.post(
  "/restaurant/promotion/get/all",
  authenticateToken,
  requireRole("RESTAURANT"),
  asyncHandler(getAllPromotion),
)

/**
 * @swagger
 * /restaurant/promotionGroup/get/{group_id}:
 *   post:
 *     tags: [Restaurant]
 *     summary: Get promotion group (RESTAURANT)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: group_id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Group detail
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServicePayload'
 *       400:
 *         description: Invalid group_id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: middlewares/auth.js — JWT / Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer401'
 *       403:
 *         description: middlewares/auth.js — TOKEN_INVALID หรือ Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer403'
 *       404:
 *         description: controllers/restaurant.js — Promotion group not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RestaurantPromotionGroupNotFound404'
 *       500:
 *         description: "controllers/restaurant.js catch — JSON message: Server error"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthMessageServerError'
 */
routes.post(
  "/restaurant/promotionGroup/get/:group_id",
  authenticateToken,
  requireRole("RESTAURANT"),
  restaurantValidation.getPromotionGroup,
  asyncHandler(getPromotionGroup),
)

/**
 * @swagger
 * /restaurant/promotionGroup/update:
 *   put:
 *     tags: [Restaurant]
 *     summary: Update promotion group (RESTAURANT)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [group_id]
 *             properties:
 *               group_id:
 *                 type: integer
 *                 minimum: 1
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, UNAVAILABLE]
 *     responses:
 *       200:
 *         description: Updated group
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServicePayload'
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: middlewares/auth.js — JWT / Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer401'
 *       403:
 *         description: middlewares/auth.js — TOKEN_INVALID หรือ Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer403'
 *       404:
 *         description: controllers/restaurant.js — Promotion group not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RestaurantPromotionGroupNotFound404'
 *       500:
 *         description: "controllers/restaurant.js catch — JSON message: Server error"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthMessageServerError'
 */
routes.put(
  "/restaurant/promotionGroup/update",
  authenticateToken,
  requireRole("RESTAURANT"),
  restaurantValidation.updatePromotionGroup,
  asyncHandler(updatePromotionGroup),
)

/**
 * @swagger
 * /restaurant/promotionGroup/delete/{group_id}:
 *   delete:
 *     tags: [Restaurant]
 *     summary: Delete promotion group (RESTAURANT)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: group_id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServicePayload'
 *       400:
 *         description: Invalid group_id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: middlewares/auth.js — JWT / Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer401'
 *       403:
 *         description: middlewares/auth.js — TOKEN_INVALID หรือ Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer403'
 *       404:
 *         description: controllers/restaurant.js — Promotion group not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RestaurantPromotionGroupNotFound404'
 *       500:
 *         description: "controllers/restaurant.js catch — JSON message: Server error"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthMessageServerError'
 */
routes.delete(
  "/restaurant/promotionGroup/delete/:group_id",
  authenticateToken,
  requireRole("RESTAURANT"),
  restaurantValidation.deletePromotionGroup,
  asyncHandler(deletePromotionGroup),
)

/**
 * @swagger
 * /restaurant/restaurantUser:
 *   post:
 *     tags: [Restaurant]
 *     summary: Users in this restaurant (RESTAURANT)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users list from service
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServicePayload'
 *       401:
 *         description: middlewares/auth.js — JWT / Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer401'
 *       403:
 *         description: middlewares/auth.js — TOKEN_INVALID หรือ Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer403'
 *       404:
 *         description: controllers/restaurant.js — No users found in restaurant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RestaurantNoUsers404'
 *       500:
 *         description: "controllers/restaurant.js catch — JSON message: Server error"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthMessageServerError'
 */
routes.post(
  "/restaurant/restaurantUser",
  authenticateToken,
  requireRole("RESTAURANT"),
  restaurantValidation.restaurantUser,
  asyncHandler(restaurantUser),
)

export default routes
