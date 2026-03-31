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
import { authValidation } from "../middlewares/validation.js"
import { asyncHandler } from "../middlewares/errorHandler.js"
import { authenticateToken, requireRole } from "../middlewares/auth.js"

const routes = express.Router()

/**
 * @swagger
 * tags:
 *   - name: User Auth
 *     description: User authentication and user features
 */

/**
 * @swagger
 * /auth/lineUIDCheck:
 *   post:
 *     tags: [User Auth]
 *     summary: Check LINE UID (login or prompt register)
 *     parameters:
 *       - in: query
 *         name: t
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 8
 *           maxLength: 8
 *           pattern: '^[A-Za-z0-9_-]{8}$'
 *         description: Restaurant invite token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lineUid]
 *             properties:
 *               lineUid:
 *                 type: string
 *                 maxLength: 100
 *     responses:
 *       200:
 *         description: Existing user login; sets refreshToken cookie on path /api/auth
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserLineLoginSuccess'
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       404:
 *         description: |
 *           กรณีที่สองแบบ (HTTP 404 เหมือนกัน)—คัดแยกด้วยฟิลด์ `action` ตาม controllers/auth.js
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/AuthLineUid404RestaurantNotFound'
 *                 - $ref: '#/components/schemas/AuthLineUid404Register'
 *             examples:
 *               noRestaurant:
 *                 summary: ไม่มีร้านในระบบ
 *                 description: "Body จาก controller — action Restaurant not found"
 *                 value:
 *                   action: Restaurant not found
 *               mustRegister:
 *                 summary: ต้องสมัครก่อน
 *                 description: "Body จาก controller — action Register"
 *                 value:
 *                   action: Register
 *       401:
 *         description: |
 *           catch เมื่อ error.message === 'Restaurant not found' — body เป็น `message` ไม่ใช่ `action`
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthLineUid401CatchRestaurantNotFound'
 *             examples:
 *               catchBranch:
 *                 value:
 *                   message: Restaurant not found
 *       500:
 *         description: Generic catch ใน lineUIDCheck
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthMessageServerError'
 *             examples:
 *               serverError:
 *                 value:
 *                   message: Server error
 */
routes.post("/auth/lineUIDCheck", authValidation.lineUIDCheck, asyncHandler(lineUIDCheck))

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [User Auth]
 *     summary: Register new user (after lineUIDCheck returned Register)
 *     parameters:
 *       - in: query
 *         name: t
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 8
 *           maxLength: 8
 *           pattern: '^[A-Za-z0-9_-]{8}$'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lineUid, name, gender, phone, birth_date, birth_time, birth_place]
 *             properties:
 *               lineUid:
 *                 type: string
 *                 maxLength: 100
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
 *                 example: "2000-01-15"
 *               birth_time:
 *                 type: string
 *                 pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]$'
 *                 example: "14:30"
 *               birth_place:
 *                 type: string
 *                 maxLength: 200
 *     responses:
 *       201:
 *         description: Registration success; response shape from service
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
 *       404:
 *         description: error.message === 'Restaurant not found'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthRegister404'
 *             examples:
 *               notFound:
 *                 value:
 *                   message: Restaurant not found
 *       409:
 *         description: error.message === 'User already registered'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthRegister409'
 *             examples:
 *               conflict:
 *                 value:
 *                   message: User already registered
 *       502:
 *         description: สองข้อความที่ต่างกัน (HTTP 502 เดียวกัน) — ดู `examples`
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/AuthRegister502InvalidBazi'
 *                 - $ref: '#/components/schemas/AuthRegister502InvalidElement'
 *             examples:
 *               invalidBazi:
 *                 summary: Invalid Bazi response
 *                 value:
 *                   message: Invalid Bazi response
 *               invalidElement:
 *                 summary: Invalid element data
 *                 value:
 *                   message: Invalid element data
 *       503:
 *         description: error.message === 'Bazi service unavailable'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthRegister503'
 *             examples:
 *               baziDown:
 *                 value:
 *                   message: Bazi service unavailable
 *       500:
 *         description: ท้าย catch ใน register
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthMessageServerError'
 *             examples:
 *               serverError:
 *                 value:
 *                   message: Server error
 */
routes.post("/auth/register", authValidation.register, asyncHandler(register))

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [User Auth]
 *     summary: Refresh access token (reads httpOnly refreshToken cookie from /api/auth)
 *     responses:
 *       200:
 *         description: New tokens or access payload from service
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServicePayload'
 *       401:
 *         description: |
 *           กรณีที่สองแบบ (401)—ไม่มี cookie หรือ refresh หมดอายุ (ฟิลด์ `code` ต่างกัน)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/AuthRefresh401TokenRequired'
 *                 - $ref: '#/components/schemas/AuthRefresh401Expired'
 *             examples:
 *               noCookie:
 *                 summary: ไม่ส่ง refreshToken
 *                 value:
 *                   message: Refresh token required
 *                   code: TOKEN_REQUIRED
 *               expired:
 *                 summary: Refresh หมดอายุ / ไม่พบในระบบ
 *                 value:
 *                   message: Refresh token expired
 *                   code: REFRESH_TOKEN_EXPIRED
 *       403:
 *         description: Invalid refresh token (catch สุดท้ายของ refreshAccessToken)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthRefresh403Invalid'
 *             examples:
 *               invalid:
 *                 value:
 *                   message: Invalid refresh token
 *                   code: REFRESH_TOKEN_INVALID
 */
routes.post("/auth/refresh", asyncHandler(refreshAccessToken))

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [User Auth]
 *     summary: Logout (Authorization Bearer + refresh cookie)
 *     responses:
 *       200:
 *         description: Logged out
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogoutSuccess'
 *       500:
 *         description: catch ใน logout
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthMessageServerError'
 *             examples:
 *               serverError:
 *                 value:
 *                   message: Server error
 */
routes.post("/auth/logout", asyncHandler(logout))

/**
 * @swagger
 * /auth/logout-all:
 *   post:
 *     tags: [User Auth]
 *     summary: Logout from all devices (USER)
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
 *         description: |
 *           จาก authenticateToken / requireRole / หรือ controller เมื่อ !req.user —ดู oneOf
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer401'
 *             examples:
 *               tokenRequired:
 *                 value:
 *                   message: Access token required
 *                   code: TOKEN_REQUIRED
 *               authRequired:
 *                 summary: จาก logoutAllDevices เมื่อไม่มี req.user
 *                 value:
 *                   message: Authentication required
 *       403:
 *         description: JWT ไม่ถูกต้อง หรือ role ไม่ใช่ USER
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer403'
 *             examples:
 *               invalidToken:
 *                 value:
 *                   message: Invalid access token
 *                   code: TOKEN_INVALID
 *               forbiddenRole:
 *                 value:
 *                   message: Forbidden
 *       500:
 *         description: catch ใน logoutAllDevices
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthMessageServerError'
 */
routes.post("/auth/logout-all", authenticateToken, requireRole("USER"), asyncHandler(logoutAllDevices))

/**
 * @swagger
 * /auth/detial:
 *   post:
 *     tags: [User Auth]
 *     summary: Get profile before edit (USER)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile payload from service
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServicePayload'
 *       401:
 *         description: JWT / role middleware หรือ authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer401'
 *       403:
 *         description: Token ไม่ถูกต้องหรือไม่ใช่ USER
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer403'
 *       500:
 *         description: catch ใน preEditProfile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthMessageServerError'
 */
routes.post(
  "/auth/detial",
  authenticateToken,
  requireRole("USER"),
  asyncHandler(preEditProfile),
)

/**
 * @swagger
 * /auth/editProfile:
 *   put:
 *     tags: [User Auth]
 *     summary: Edit user profile (USER)
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
 *         description: Updated profile from service
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
 *         description: JWT / role middleware
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer401'
 *       403:
 *         description: Token ไม่ถูกต้องหรือไม่ใช่ USER
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer403'
 *       500:
 *         description: catch ใน editProfile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthMessageServerError'
 */
routes.put(
  "/auth/editProfile",
  authenticateToken,
  requireRole("USER"),
  authValidation.editProfile,
  asyncHandler(editProfile),
)

/**
 * @swagger
 * /auth/prediction:
 *   post:
 *     tags: [User Auth]
 *     summary: AI/menu prediction for user (USER)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Prediction result from service
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServicePayload'
 *       400:
 *         description: error.message === 'Invalid user element data'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthPrediction400InvalidElement'
 *             examples:
 *               invalidElement:
 *                 value:
 *                   message: Invalid user element data
 *       401:
 *         description: JWT / role middleware
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer401'
 *       403:
 *         description: Token ไม่ถูกต้องหรือไม่ใช่ USER
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer403'
 *       404:
 *         description: error.message === 'User not found'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthPrediction404'
 *             examples:
 *               userNotFound:
 *                 value:
 *                   message: User not found
 *       503:
 *         description: error.message === 'Prediction service unavailable'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthPrediction503'
 *             examples:
 *               svcDown:
 *                 value:
 *                   message: Prediction service unavailable
 *       500:
 *         description: |
 *           สองกรณีใน catch — `AI service not configured` หรือ `Server error` (ท้ายฟังก์ชัน)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/AuthPrediction500AiNotConfigured'
 *                 - $ref: '#/components/schemas/AuthMessageServerError'
 *             examples:
 *               aiNotConfigured:
 *                 value:
 *                   message: AI service not configured
 *               genericServer:
 *                 value:
 *                   message: Server error
 */
routes.post(
  "/auth/prediction",
  authenticateToken,
  requireRole("USER"),
  asyncHandler(prediction),
)

/**
 * @swagger
 * /auth/menu:
 *   post:
 *     tags: [User Auth]
 *     summary: Paginated menu for user (USER)
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
 *         description: Menu payload from service
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
 *         description: JWT / role middleware
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer401'
 *       403:
 *         description: Token ไม่ถูกต้องหรือไม่ใช่ USER
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer403'
 *       500:
 *         description: catch ใน menu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthMessageServerError'
 */
routes.post(
  "/auth/menu",
  authenticateToken,
  requireRole("USER"),
  authValidation.page,
  asyncHandler(menu),
)

/**
 * @swagger
 * /auth/menu/like:
 *   post:
 *     tags: [User Auth]
 *     summary: Menu list based on likes (USER)
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
 *         description: Menu payload from service
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
 *         description: JWT / role middleware
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer401'
 *       403:
 *         description: Token ไม่ถูกต้องหรือไม่ใช่ USER
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer403'
 *       500:
 *         description: catch ใน findMenu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthMessageServerError'
 */
routes.post(
  "/auth/menu/like",
  authenticateToken,
  requireRole("USER"),
  authValidation.page,
  asyncHandler(findMenu),
)

/**
 * @swagger
 * /auth/menu/filter:
 *   post:
 *     tags: [User Auth]
 *     summary: Filter menus by element and price (USER)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               element:
 *                 description: Element filter (optional in controller)
 *                 nullable: true
 *               price:
 *                 type: string
 *                 description: Sort order for price (default asc)
 *                 example: asc
 *               page:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *     responses:
 *       200:
 *         description: Filtered menu from service
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServicePayload'
 *       401:
 *         description: JWT / role middleware
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer401'
 *       403:
 *         description: Token ไม่ถูกต้องหรือไม่ใช่ USER
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer403'
 *       500:
 *         description: catch ใน filterMenu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthMessageServerError'
 */
routes.post(
  "/auth/menu/filter",
  authenticateToken,
  requireRole("USER"),
  asyncHandler(filterMenu),
)

/**
 * @swagger
 * /auth/coupon/add:
 *   post:
 *     tags: [User Auth]
 *     summary: Create coupon from promotion (USER)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [promotion_id]
 *             properties:
 *               promotion_id:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       201:
 *         description: Coupon created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServicePayload'
 *       400:
 *         description: |
 *           express-validator หรือ catch เมื่อ error.message มีคำว่า Promotion / already (ข้อความจริงจาก error.message)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationError'
 *                 - $ref: '#/components/schemas/AuthCoupon400ServiceMessage'
 *       401:
 *         description: JWT / role middleware
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer401'
 *       403:
 *         description: Token ไม่ถูกต้องหรือไม่ใช่ USER
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserBearer403'
 *       500:
 *         description: catch ใน createCoupon
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthMessageServerError'
 */
routes.post(
  "/auth/coupon/add",
  authenticateToken,
  requireRole("USER"),
  authValidation.createCoupon,
  asyncHandler(createCoupon),
)

/**
 * @swagger
 * /auth/coupon/use:
 *   post:
 *     tags: [User Auth]
 *     summary: Redeem coupon by code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 50
 *     responses:
 *       200:
 *         description: Redeem result from service; emits socket couponUpdated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServicePayload'
 *       400:
 *         description: |
 *           เงื่อนไข includes Invalid / expired / already / available — `message` เป็นข้อความจริงจาก error.message
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthCoupon400ServiceMessage'
 *       500:
 *         description: catch ใน useCoupon
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthMessageServerError'
 */
routes.post(
  "/auth/coupon/use",
  authValidation.useCoupon,
  asyncHandler(useCoupon),
)

export default routes
