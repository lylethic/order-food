import { Router } from 'express';
import { authService } from '../services/auth.service.js';
import { authenticate } from '../middleware/auth.js';
import { RegisterSchema, LoginSchema } from '../schemas/validation.js';
import { sendResponse, handleRouteError } from '../utils/response.js';

const router = Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           example:
 *             email: chef@restaurant.com
 *             password: secret123
 *             name: Chef Rivera
 *             role: Chef
 *     responses:
 *       200:
 *         description: Account created — returns JWT + user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/auth/register', async (req, res) => {
  try {
    const dto = RegisterSchema.parse(req.body);
    const result = await authService.register(dto);
    sendResponse(res, {
      message: 'Đăng ký tài khoản thành công',
      message_en: 'Account registered successfully',
      data: result,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login and receive a JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: chef@restaurant.com
 *             password: secret123
 *     responses:
 *       200:
 *         description: Login successful — returns JWT + user profile + role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/auth/login', async (req, res) => {
  try {
    const dto = LoginSchema.parse(req.body);
    const result = await authService.login(dto);
    sendResponse(res, {
      message: 'Đăng nhập thành công',
      message_en: 'Login successful',
      data: result,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user's profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MeResponse'
 *       401:
 *         description: Missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/auth/me', authenticate, async (req, res) => {
  try {
    const user = await authService.me(req.user!.userId);
    sendResponse(res, {
      message: 'Lấy thông tin người dùng thành công',
      message_en: 'User profile retrieved successfully',
      data: user,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

export default router;
