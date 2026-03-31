import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Bazi API",
      version: "1.0.0",
      description:
        "API documentation. Base path /api. For refresh endpoints, set httpOnly refreshToken cookie (from login) or use browser devtools; JWT protected routes use Authorize.",
    },
    servers: [
      {
        url: "/api",
        description: "Application API base path",
      },
    ],
    tags: [
      { name: "System", description: "Health and server metadata" },
      { name: "User Auth", description: "End-user LINE auth, profile, menu, coupons" },
      { name: "Admin", description: "Admin login and restaurant management" },
      { name: "Restaurant", description: "Restaurant portal, menus, promotions" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ValidationError: {
          type: "object",
          properties: {
            message: { type: "string", example: "Validation failed" },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
        Message: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
        MessageWithCode: {
          type: "object",
          properties: {
            message: { type: "string" },
            code: { type: "string" },
          },
        },
        /** ---- User auth /auth — exact bodies from controllers/auth.js ---- */
        AuthLineUid404RestaurantNotFound: {
          type: "object",
          required: ["action"],
          description:
            "res.status(404) when result.action === 'RestaurantNotFound' — ไม่มีร้านตาม token เชิญ",
          properties: {
            action: { type: "string", enum: ["Restaurant not found"] },
          },
        },
        AuthLineUid404Register: {
          type: "object",
          required: ["action"],
          description:
            "res.status(404) when result.action === 'Register' — ผู้ใช้ยังไม่ลงทะเบียน ต้องสมัครก่อน",
          properties: {
            action: { type: "string", enum: ["Register"] },
          },
        },
        AuthLineUid401CatchRestaurantNotFound: {
          type: "object",
          required: ["message"],
          description: "catch branch when error.message === 'Restaurant not found'",
          properties: {
            message: { type: "string", enum: ["Restaurant not found"] },
          },
        },
        AuthMessageServerError: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", enum: ["Server error"] },
          },
        },
        AuthRegister404: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", enum: ["Restaurant not found"] },
          },
        },
        AuthRegister409: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", enum: ["User already registered"] },
          },
        },
        AuthRegister502InvalidBazi: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", enum: ["Invalid Bazi response"] },
          },
        },
        AuthRegister502InvalidElement: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", enum: ["Invalid element data"] },
          },
        },
        AuthRegister503: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", enum: ["Bazi service unavailable"] },
          },
        },
        AuthRefresh401TokenRequired: {
          type: "object",
          required: ["message", "code"],
          properties: {
            message: { type: "string", enum: ["Refresh token required"] },
            code: { type: "string", enum: ["TOKEN_REQUIRED"] },
          },
        },
        AuthRefresh401Expired: {
          type: "object",
          required: ["message", "code"],
          properties: {
            message: { type: "string", enum: ["Refresh token expired"] },
            code: { type: "string", enum: ["REFRESH_TOKEN_EXPIRED"] },
          },
        },
        AuthRefresh403Invalid: {
          type: "object",
          required: ["message", "code"],
          properties: {
            message: { type: "string", enum: ["Invalid refresh token"] },
            code: { type: "string", enum: ["REFRESH_TOKEN_INVALID"] },
          },
        },
        AuthPrediction400InvalidElement: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", enum: ["Invalid user element data"] },
          },
        },
        AuthPrediction404: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", enum: ["User not found"] },
          },
        },
        AuthPrediction500AiNotConfigured: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", enum: ["AI service not configured"] },
          },
        },
        AuthPrediction503: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", enum: ["Prediction service unavailable"] },
          },
        },
        AuthCoupon400ServiceMessage: {
          type: "object",
          required: ["message"],
          description:
            "res.status(400).json({ message: error.message }) — ข้อความตรงจาก service / throw",
          properties: {
            message: {
              type: "string",
              description:
                "ตัวอย่างจากเงื่อนไข controller: ข้อความที่มีคำว่า Promotion, already, Invalid, expired, available เป็นต้น",
            },
          },
        },
        AuthController401Required: {
          type: "object",
          required: ["message"],
          description: "logoutAllDevices when !req.user",
          properties: {
            message: { type: "string", enum: ["Authentication required"] },
          },
        },
        /** ---- JWT middleware responses (middlewares/auth.js) ---- */
        Jwt401AccessTokenRequired: {
          type: "object",
          required: ["message", "code"],
          properties: {
            message: { type: "string", enum: ["Access token required"] },
            code: { type: "string", enum: ["TOKEN_REQUIRED"] },
          },
        },
        Jwt401AccessTokenExpired: {
          type: "object",
          required: ["message", "code"],
          properties: {
            message: { type: "string", enum: ["Access token expired"] },
            code: { type: "string", enum: ["TOKEN_EXPIRED"] },
          },
        },
        Jwt401AccessTokenRevoked: {
          type: "object",
          required: ["message", "code"],
          properties: {
            message: { type: "string", enum: ["Token has been revoked"] },
            code: { type: "string", enum: ["TOKEN_REVOKED"] },
          },
        },
        Jwt403InvalidAccessToken: {
          type: "object",
          required: ["message", "code"],
          properties: {
            message: { type: "string", enum: ["Invalid access token"] },
            code: { type: "string", enum: ["TOKEN_INVALID"] },
          },
        },
        RequireRole403Forbidden: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", enum: ["Forbidden"] },
          },
        },
        UserBearer401: {
          oneOf: [
            { $ref: "#/components/schemas/Jwt401AccessTokenRequired" },
            { $ref: "#/components/schemas/Jwt401AccessTokenExpired" },
            { $ref: "#/components/schemas/Jwt401AccessTokenRevoked" },
            { $ref: "#/components/schemas/AuthController401Required" },
          ],
        },
        UserBearer403: {
          oneOf: [
            { $ref: "#/components/schemas/Jwt403InvalidAccessToken" },
            { $ref: "#/components/schemas/RequireRole403Forbidden" },
          ],
        },
        /** controllers/admin.js + handleServerError */
        AdminInvalidCredentials401: {
          type: "object",
          required: ["message", "code"],
          properties: {
            message: { type: "string", enum: ["Invalid credentials"] },
            code: { type: "string", enum: ["INVALID_CREDENTIALS"] },
          },
        },
        AdminInternalServerError500: {
          type: "object",
          required: ["message", "code"],
          properties: {
            message: {
              type: "string",
              enum: ["An error occurred while processing your request"],
            },
            code: { type: "string", enum: ["INTERNAL_SERVER_ERROR"] },
          },
        },
        AdminDuplicateEmail400: {
          type: "object",
          required: ["message", "code"],
          properties: {
            message: { type: "string", enum: ["Email already exists"] },
            code: { type: "string", enum: ["DUPLICATE_EMAIL"] },
          },
        },
        AdminMissingRequestBody400: {
          type: "object",
          required: ["message", "code"],
          properties: {
            message: { type: "string", enum: ["Request body is required"] },
            code: { type: "string", enum: ["MISSING_REQUEST_BODY"] },
          },
        },
        AdminUserNotFound404: {
          type: "object",
          required: ["message", "code"],
          properties: {
            message: { type: "string", enum: ["User not found"] },
            code: { type: "string", enum: ["USER_NOT_FOUND"] },
          },
        },
        AdminMissingUserId400: {
          type: "object",
          required: ["message", "code"],
          properties: {
            message: { type: "string", enum: ["User id is required"] },
            code: { type: "string", enum: ["MISSING_USER_ID"] },
          },
        },
        AdminRestaurantNotFound404: {
          type: "object",
          required: ["message", "code"],
          properties: {
            message: { type: "string", enum: ["Restaurant not found"] },
            code: { type: "string", enum: ["RESTAURANT_NOT_FOUND"] },
          },
        },
        /** controllers/restaurant.js — refresh ไม่มี cookie */
        RestaurantRefresh401NoCookie: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", enum: ["No refresh token"] },
          },
        },
        RestaurantRefresh401: {
          oneOf: [
            { $ref: "#/components/schemas/RestaurantRefresh401NoCookie" },
            { $ref: "#/components/schemas/AuthRefresh401Expired" },
          ],
        },
        RestaurantLogin401InvalidCreds: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", enum: ["Invalid email or password"] },
          },
        },
        RestaurantPromotion400Discount: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", enum: ["Discount Error"] },
          },
        },
        RestaurantPromotion404NoMenus: {
          type: "object",
          required: ["message"],
          properties: {
            message: {
              type: "string",
              enum: ["No menus match the specified elements"],
            },
          },
        },
        RestaurantMenuNotFound404: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", enum: ["Menu not found"] },
          },
        },
        RestaurantPromotionGroupNotFound404: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", enum: ["Promotion group not found"] },
          },
        },
        RestaurantNoUsers404: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", enum: ["No users found in restaurant"] },
          },
        },
        RestaurantEmailExists409: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", enum: ["Email already exists"] },
          },
        },
        ErrorAction: {
          type: "object",
          properties: {
            action: { type: "string" },
          },
        },
        ServicePayload: {
          type: "object",
          description: "Response body from service layer (shape varies)",
          additionalProperties: true,
        },
        UserLineLoginSuccess: {
          type: "object",
          properties: {
            action: { type: "string", example: "LOGIN" },
            user: { $ref: "#/components/schemas/ServicePayload" },
            bazi: { $ref: "#/components/schemas/ServicePayload" },
            tokens: {
              type: "object",
              properties: {
                accessToken: { type: "string" },
              },
            },
          },
        },
        AdminLoginSuccess: {
          type: "object",
          properties: {
            message: { type: "string", example: "Login successful" },
            user: {
              type: "object",
              properties: {
                userId: { type: "integer" },
                email: { type: "string", format: "email" },
              },
            },
            tokens: {
              type: "object",
              properties: {
                accessToken: { type: "string" },
              },
            },
          },
        },
        RestaurantLoginSuccess: {
          type: "object",
          properties: {
            message: { type: "string", example: "Login successful" },
            user: {
              type: "object",
              properties: {
                restaurant_id: { type: "integer" },
                name: { type: "string" },
                email: { type: "string" },
              },
            },
            tokens: {
              type: "object",
              properties: {
                accessToken: { type: "string" },
              },
            },
          },
        },
        ServerInfo: {
          type: "object",
          properties: {
            message: { type: "string" },
            status: { type: "string" },
            timestamp: { type: "string", format: "date-time" },
          },
        },
        HealthOk: {
          type: "object",
          properties: {
            status: { type: "string", example: "healthy" },
            database: { type: "string", example: "connected" },
          },
        },
        HealthFail: {
          type: "object",
          properties: {
            status: { type: "string", example: "unhealthy" },
          },
        },
        AccessTokenOnly: {
          type: "object",
          properties: {
            accessToken: { type: "string" },
          },
        },
        LogoutSuccess: {
          type: "object",
          properties: {
            message: { type: "string", example: "Logged out successfully" },
          },
        },
        /** Common HTTP Status Codes */
        BadRequest400: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", example: "Bad request" },
            error: { type: "string", example: "Invalid input data" },
          },
        },
        Unauthorized401: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", example: "Unauthorized" },
            code: { type: "string", example: "UNAUTHORIZED" },
          },
        },
        Forbidden403: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", example: "Forbidden" },
            code: { type: "string", example: "FORBIDDEN" },
          },
        },
        NotFound404: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", example: "Resource not found" },
            code: { type: "string", example: "NOT_FOUND" },
          },
        },
        Conflict409: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", example: "Resource already exists" },
            code: { type: "string", example: "CONFLICT" },
          },
        },
        UnprocessableEntity422: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", example: "Unprocessable entity" },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
        TooManyRequests429: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", example: "Too many requests" },
            retryAfter: { type: "integer", example: 60 },
          },
        },
        InternalServerError500: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", example: "Internal server error" },
            code: { type: "string", example: "INTERNAL_SERVER_ERROR" },
          },
        },
        BadGateway502: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", example: "Bad gateway" },
            code: { type: "string", example: "BAD_GATEWAY" },
          },
        },
        ServiceUnavailable503: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", example: "Service unavailable" },
            code: { type: "string", example: "SERVICE_UNAVAILABLE" },
          },
        },
        GatewayTimeout504: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", example: "Gateway timeout" },
            code: { type: "string", example: "GATEWAY_TIMEOUT" },
          },
        },
      },
    },
  },
  apis: [path.join(__dirname, "../routes/*.js")],
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      swaggerOptions: {
        persistAuthorization: true,
        withCredentials: true,
      },
      customCss: `
    body {
      background: #0f172a;
      color: #e2e8f0;
    }

    .swagger-ui .topbar {
      background: #1e293b;
    }

    .swagger-ui .opblock {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 10px;
    }

    .swagger-ui .btn.authorize {
      background: #6BB8FF;
      color: #000;
    }
  `,
    }),
  );
};

export default setupSwagger;
