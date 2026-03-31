import express from "express"
import { server, health } from "../controllers/index.js"

const routes = express.Router()

/**
 * @swagger
 * tags:
 *   - name: System
 *     description: System and health endpoints
 */

/**
 * @swagger
 * /:
 *   get:
 *     tags: [System]
 *     summary: Get API server information
 *     responses:
 *       200:
 *         description: Server information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerInfo'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerError500'
 */
routes.get("/", server)

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Health check (database connectivity)
 *     responses:
 *       200:
 *         description: Healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthOk'
 *       503:
 *         description: Unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthFail'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerError500'
 */
routes.get("/health", health)

export default routes
