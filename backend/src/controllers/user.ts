import { Router } from 'express';
import { userService } from '../services/user.service.js';
import { authenticate } from '../middleware/auth.js';
import { isAdmin } from '../middleware/rbac.js';
import { AppError } from '../utils/AppError.js';
import { BaseSearchRequest } from '../schemas/search.js';
import { UserCreateBody, UserUpdateBody } from '../schemas/user.js';
import { sendResponse, handleRouteError } from '../utils/response.js';
import { staticFileService, uploadUserImage } from '../services/staticFile.service.js';

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

/**
 * @swagger
 * /api/v1/users/{id}/avatar:
 *   put:
 *     summary: Upload avatar for a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     description: Upload an image and save it as the user's avatar. User can update their own avatar; Admin can update anyone's.
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file (jpg, png, gif, webp, svg, bmp). Max 5 MB.
 *     responses:
 *       200:
 *         description: Avatar updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid user id or no file provided
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Cannot update another user's avatar
 *       404:
 *         description: User not found
 *       415:
 *         description: Unsupported file type — images only
 */
router.put('/users/:id/avatar', authenticate, uploadUserImage.single('file'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0)
      throw new AppError(400, 'Invalid user id');

    const rawRole = req.user!.role;
    const isAdmin = Array.isArray(rawRole)
      ? rawRole.includes('ADMIN')
      : rawRole === 'ADMIN';
    const isSelf = req.user!.userId === String(id);
    if (!isAdmin && !isSelf)
      throw new AppError(403, 'Không thể cập nhật avatar của người dùng khác');

    if (!req.file) throw new AppError(400, 'Chưa chọn file ảnh');

    // Delete old avatar from disk if it exists
    const existing = await userService.findById(id);
    if (existing.img) {
      try { staticFileService.delete(existing.img); } catch { /* ignore */ }
    }

    const imgUrl = staticFileService.getPath(req.file);
    const data = await userService.updateAvatar(id, imgUrl);

    sendResponse(res, {
      message: 'Cập nhật avatar thành công',
      message_en: 'Avatar updated successfully',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

export default router;
