import { Router } from 'express';
import { userService } from '../services/user.service.js';
import { authenticate } from '../middleware/auth.js';
import { isAdmin } from '../middleware/rbac.js';
import { AppError } from '../utils/AppError.js';
import { BaseSearchRequest } from '../schemas/search.js';
import { UserCreateBody, UserUpdateBody } from '../schemas/user.js';
import { sendResponse, handleRouteError } from '../utils/response.js';

const router = Router();

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     description: Returns paginated users. Admin only.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: Search term
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         required: false
 *         description: Page size
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: integer
 *         required: false
 *         description: Cursor user id
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         required: false
 *         description: Sort order by id
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserListResponse'
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Forbidden for non-admin users
 */
router.get('/users', authenticate, async (_req, res) => {
  try {
    const query = BaseSearchRequest.parse(_req.query);
    const data = await userService.findAll(query);

    sendResponse(res, {
      message: 'Lấy danh sách người dùng thành công',
      message_en: 'Users retrieved successfully',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     description: Create a user account manually. Admin only.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserCreateRequest'
 *     responses:
 *       200:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already registered
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Forbidden for non-admin users
 */
router.post('/users', authenticate, isAdmin, async (req, res) => {
  try {
    const dto = UserCreateBody.parse(req.body);
    const data = await userService.create(dto);

    sendResponse(res, {
      message: 'Tạo người dùng thành công',
      message_en: 'User created successfully',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get a user by id
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     description: Returns one user by numeric id. Admin only.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User id
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid user id
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Forbidden for non-admin users
 *       404:
 *         description: User not found
 */
router.get('/users/:id', authenticate, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0)
      throw new AppError(400, 'Invalid user id');

    const data = await userService.findById(id);

    sendResponse(res, {
      message: 'Lấy thông tin người dùng thành công',
      message_en: 'User retrieved successfully',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/users/{id}:
 *   patch:
 *     summary: Update a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     description: Update user profile fields and active flag. Admin only.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdateRequest'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid user id or validation error
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Forbidden for non-admin users
 *       404:
 *         description: User not found
 */
router.put('/users/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const dto = UserUpdateBody.parse(req.body);
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0)
      throw new AppError(400, 'Invalid user id');

    const data = await userService.update(dto, id);

    sendResponse(res, {
      message: 'Cập nhật người dùng thành công',
      message_en: 'User updated successfully',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     description: Soft-deletes a user by id. Admin only.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User id
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid user id
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Forbidden for non-admin users
 *       404:
 *         description: User not found
 */
router.delete('/users/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0)
      throw new AppError(400, 'Invalid user id');

    const data = await userService.delete(id);

    sendResponse(res, {
      message: 'Xóa người dùng thành công',
      message_en: 'User deleted successfully',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

export default router;
