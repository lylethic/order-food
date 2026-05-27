import { Router } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';
import { cartService } from '../services/cart.service.js';
import { authenticate } from '../middleware/auth.js';
import {
  RegisterSchema,
  LoginSchema,
  GuestRegisterSchema,
} from '../schemas/validation.js';
import { sendResponse, handleRouteError } from '../utils/response.js';
import { AppError } from '../utils/AppError.js';
import { REFRESH_TOKEN_EXPIRY_MS } from '../utils/authUtils.js';

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
 *             role: CHEF
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
    const result = await authService.register(dto, {
      headers: req.headers as Record<string, string | string[] | undefined>,
      ip: req.ip,
    });
    const { refreshToken, ...rest } = result;

    // Merge cart if session_id exists
    const sessionId = req.headers['x-session-id'] as string;
    if (sessionId) {
      await cartService.mergeCart(BigInt(result.user.id), sessionId);
    }

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: REFRESH_TOKEN_EXPIRY_MS,
    });
    sendResponse(res, {
      message: 'Đăng ký tài khoản thành công',
      message_en: 'Account registered successfully',
      data: { ...rest, refreshToken },
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/auth/guestRegister:
 *   post:
 *     summary: Register a new guest user account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GuestRegisterRequest'
 *           example:
 *             name: Ngọc Linh
 *             phone: '0999999888'
 *     responses:
 *       200:
 *         description: Account created — returns JWT + user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */
router.post('/auth/guestRegister', async (req, res) => {
  try {
    const dto = GuestRegisterSchema.parse(req.body);
    const result = await authService.guestRegister(dto);
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
 *     summary: Login — returns access token + refresh token
 *     description: |
 *       Validates credentials and issues a short-lived **access token** (60 min) and a
 *       long-lived **refresh token** (7 days).
 *
 *       The refresh token is set as an `httpOnly` cookie (`refreshToken`) scoped to
 *       `/api/v1/auth` and is also returned in the response body for non-browser clients.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: chef@restaurant.com
 *             password: Aa@123123
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             description: httpOnly refresh token cookie scoped to /api/v1/auth
 *             schema:
 *               type: string
 *               example: refreshToken=abc123...; Path=/api/v1/auth; HttpOnly; SameSite=Strict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
    const result = await authService.login(dto, {
      headers: req.headers as Record<string, string | string[] | undefined>,
      ip: req.ip,
    });
    const { refreshToken, ...rest } = result;

    // Merge cart if session_id exists
    const sessionId = req.headers['x-session-id'] as string;
    if (sessionId) {
      await cartService.mergeCart(BigInt(result.user.id), sessionId);
    }

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: REFRESH_TOKEN_EXPIRY_MS,
    });
    sendResponse(res, {
      message: 'Đăng nhập thành công',
      message_en: 'Login successful',
      data: { ...rest, refreshToken },
    });
  } catch (err) {
    if (err instanceof AppError && err.status_code === 401) {
      res.status(422).json({
        success: false,
        status_code: 422,
        message: 'Email hoặc password không đúng',
        message_en: 'Invalid email or password',
        data: null,
        errors: [
          { field: 'password', message: 'Email hoặc password không đúng' },
        ],
      });
      return;
    }
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Rotate refresh token — returns new access + refresh tokens
 *     description: |
 *       Exchanges a valid refresh token for a new **access token** and a new **refresh token**
 *       (token rotation). The old refresh token is immediately revoked.
 *
 *       **Token reuse detection:** If a previously-revoked token is presented, the entire
 *       token family is revoked and a `401` is returned. This signals a possible theft.
 *
 *       The refresh token can be supplied via:
 *       1. `refreshToken` httpOnly cookie (preferred for browsers)
 *       2. `refreshToken` field in the JSON body (for non-browser clients)
 *     tags: [Auth]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *     responses:
 *       200:
 *         description: Tokens rotated successfully
 *         headers:
 *           Set-Cookie:
 *             description: New httpOnly refresh token cookie
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenPairResponse'
 *       401:
 *         description: Missing, invalid, expired, or reused refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/auth/refresh', async (req, res) => {
  try {
    const rawToken: string =
      req.cookies?.refreshToken ?? req.body?.refreshToken;
    if (!rawToken) {
      sendResponse(res, {
        success: false,
        status_code: 401,
        message: 'Refresh token required',
        errors: [],
      });
      return;
    }
    const result = await authService.refresh(rawToken, {
      headers: req.headers as Record<string, string | string[] | undefined>,
      ip: req.ip,
    });
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: REFRESH_TOKEN_EXPIRY_MS,
    });
    sendResponse(res, { message: 'Token refreshed', data: result });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout — revoke the current refresh token
 *     description: |
 *       Marks the provided refresh token as revoked and clears the `refreshToken` cookie.
 *       This endpoint is **idempotent** — calling it when already logged out returns 200.
 *
 *       The access token is short-lived (60 min) and cannot be revoked server-side;
 *       clients should discard it locally on logout.
 *     tags: [Auth]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 */
router.post('/auth/logout', async (req, res) => {
  try {
    const rawToken: string =
      req.cookies?.refreshToken ?? req.body?.refreshToken ?? '';
    await authService.logout(rawToken);
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    sendResponse(res, {
      message: 'Đăng xuất thành công',
      message_en: 'Logged out',
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/auth/logout-all:
 *   post:
 *     summary: Logout all devices — revoke every active session
 *     description: |
 *       Increments the user's `token_version`, which instantly invalidates **all** outstanding
 *       access tokens. All refresh tokens for the user are also revoked.
 *
 *       Use this when a user suspects their account is compromised or wants to sign out
 *       of every device at once.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All sessions revoked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/auth/logout-all', authenticate, async (req, res) => {
  try {
    await authService.logoutAll(BigInt(req.user!.userId));
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    sendResponse(res, {
      message: 'Tất cả phiên đã bị thu hồi',
      message_en: 'All sessions revoked',
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   post:
 *     summary: Change password — forces re-login on all other devices
 *     description: |
 *       Verifies the current password, updates it, then performs a **logout-all**
 *       (increments `token_version` + revokes all refresh tokens).
 *
 *       A fresh token pair is issued for the current session so the user does not need
 *       to log in again on the device where the password was changed.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed — returns fresh token pair
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenPairResponse'
 *       400:
 *         description: Validation error or new password too short
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid current password or missing access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/auth/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = ChangePasswordSchema.parse(
      req.body,
    );
    const result = await authService.changePassword(
      BigInt(req.user!.userId),
      currentPassword,
      newPassword,
      {
        headers: req.headers as Record<string, string | string[] | undefined>,
        ip: req.ip,
      },
    );
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: REFRESH_TOKEN_EXPIRY_MS,
    });
    sendResponse(res, {
      message: 'Đổi mật khẩu thành công',
      message_en: 'Password changed',
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
