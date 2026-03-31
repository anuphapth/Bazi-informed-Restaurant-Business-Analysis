import express from "express"
import { authenticateToken, requireRole } from "../middlewares/auth.js"
import {
  login,
  refreshAccessToken,
  logout,
  createRestaurant,
  getAllRestaurant,
  updateUserByAdmin,
  deleteUserByAdmin,
  deleteRestaurantByAdmin,
} from "../controllers/admin.js"
import { adminValidation } from "../middlewares/validation.js"
import { asyncHandler } from "../middlewares/errorHandler.js"

const routes = express.Router()

/**
 * @swagger
 * tags:
 *   - name: Admin
 *     description: Admin authentication and management
 */

/**
 * @swagger
 * /admin/login:
 *   post:
 *     tags: [Admin]
 *     summary: Admin login; sets refreshToken cookie (path /api/admin)
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
 *               $ref: '#/components/schemas/AdminLoginSuccess'
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: controllers/admin.js — Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminInvalidCredentials401'
 *       500:
 *         description: handleServerError — INTERNAL_SERVER_ERROR
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminInternalServerError500'
 */
routes.post("/admin/login", adminValidation.login, asyncHandler(login))

/**
 * @swagger
 * /admin/restaurant/create:
 *   post:
 *     tags: [Admin]
 *     summary: Create restaurant (ADMIN)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
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
 *               phone:
 *                 type: string
 *                 description: Optional; passed to repository if present
 *               address:
 *                 type: string
 *                 description: Optional; passed to repository if present
 *     responses:
 *       201:
 *         description: Restaurant created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Restaurant created successfully
 *       400:
 *         description: Validation failed or duplicate email
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationError'
 *                 - $ref: '#/components/schemas/AdminDuplicateEmail400'
 *       401:
 *         description: middlewares/auth.js — JWT
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer401'
 *       403:
 *         description: ไม่ใช่ role ADMIN หรือ token ไม่ถูกต้อง
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer403'
 *       500:
 *         description: handleServerError
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminInternalServerError500'
 */
routes.post(
  "/admin/restaurant/create",
  authenticateToken,
  requireRole("ADMIN"),
  adminValidation.createRestaurant,
  asyncHandler(createRestaurant),
)

/**
 * @swagger
 * /admin/restaurant:
 *   post:
 *     tags: [Admin]
 *     summary: List all restaurants (ADMIN)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List payload from service
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServicePayload'
 *       401:
 *         description: middlewares/auth.js
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer401'
 *       403:
 *         description: UserBearer403
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer403'
 *       500:
 *         description: handleServerError
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminInternalServerError500'
 */
routes.post(
  "/admin/restaurant",
  authenticateToken,
  requireRole("ADMIN"),
  asyncHandler(getAllRestaurant),
)

/**
 * @swagger
 * /admin/restaurant/edit/user:
 *   put:
 *     tags: [Admin]
 *     summary: Update user by admin (ADMIN)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id]
 *             properties:
 *               id:
 *                 type: integer
 *                 minimum: 1
 *                 description: User id (maps to repository data.id)
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               phone:
 *                 type: string
 *                 pattern: '^[0-9]{9,15}$'
 *               birth_date:
 *                 type: string
 *                 format: date
 *               birth_time:
 *                 type: string
 *                 pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]$'
 *               birth_place:
 *                 type: string
 *                 maxLength: 200
 *     responses:
 *       200:
 *         description: Update successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Update successful
 *       400:
 *         description: Validation failed or empty body
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationError'
 *                 - $ref: '#/components/schemas/AdminMissingRequestBody400'
 *       401:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer401'
 *       403:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer403'
 *       404:
 *         description: updateUserByAdmin — User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminUserNotFound404'
 *       500:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminInternalServerError500'
 */
routes.put(
  "/admin/restaurant/edit/user",
  authenticateToken,
  requireRole("ADMIN"),
  adminValidation.editUser,
  asyncHandler(updateUserByAdmin),
)

/**
 * @swagger
 * /admin/restaurant/delete/user:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete user by admin (ADMIN)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Delete successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Delete successful
 *       400:
 *         description: deleteUserByAdmin — userId is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminMissingUserId400'
 *       401:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer401'
 *       403:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer403'
 *       404:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminUserNotFound404'
 *       500:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminInternalServerError500'
 */
routes.delete(
  "/admin/restaurant/delete/user",
  authenticateToken,
  requireRole("ADMIN"),
  adminValidation.deleteUser,
  asyncHandler(deleteUserByAdmin),
)

/**
 * @swagger
 * /admin/restaurant/delete:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete restaurant (ADMIN)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [restaurantId]
 *             properties:
 *               restaurantId:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Delete successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Delete successful
 *       401:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer401'
 *       403:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer403'
 *       404:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminRestaurantNotFound404'
 *       500:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminInternalServerError500'
 */
routes.delete(
  "/admin/restaurant/delete",
  authenticateToken,
  requireRole("ADMIN"),
  adminValidation.deleteRestaurant,
  asyncHandler(deleteRestaurantByAdmin),
)

/**
 * @swagger
 * /admin/refresh:
 *   post:
 *     tags: [Admin]
 *     summary: Refresh admin access token (cookie path /api/admin)
 *     responses:
 *       200:
 *         description: New access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AccessTokenOnly'
 *       401:
 *         description: เหมือน auth refresh (TOKEN_REQUIRED / REFRESH_TOKEN_EXPIRED)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/AuthRefresh401TokenRequired'
 *                 - $ref: '#/components/schemas/AuthRefresh401Expired'
 *       403:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthRefresh403Invalid'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminInternalServerError500'
 */
routes.post("/admin/refresh", asyncHandler(refreshAccessToken))

/**
 * @swagger
 * /admin/logout:
 *   post:
 *     tags: [Admin]
 *     summary: Admin logout (Bearer + cookie)
 *     responses:
 *       200:
 *         description: Logged out
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogoutSuccess'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer401'
 *       500:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminInternalServerError500'
 */
routes.post("/admin/logout", asyncHandler(logout))

export default routes
