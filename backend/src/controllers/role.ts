import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { isAdmin } from '../middleware/rbac.js';
import { BaseSearchRequest } from '../schemas/search.js';
import { RoleCreateBody, RoleUpdateBody } from '../schemas/role.js';
import { roleService } from '../services/role.service.js';
import { AppError } from '../utils/AppError.js';
import { handleRouteError, sendResponse } from '../utils/response.js';
import { userService } from '../services/user.service.js';

const router = Router();

/**
 * @swagger
 * /api/v1/roles:
 *   get:
 *     summary: Get all roles
 *     tags: [Roles]
 *     description: Returns paginated roles. Admin only.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: Search by role name
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         required: false
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: integer
 *         required: false
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         required: false
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoleListResponse'
 */
router.get('/roles', authenticate, async (req, res) => {
  try {
    const query = BaseSearchRequest.parse(req.query);
    const data = await roleService.getAll(query);
    sendResponse(res, {
      message: 'Lấy danh sách vai trò thành công',
      message_en: 'Roles retrieved successfully',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/roles:
 *   post:
 *     summary: Create a new role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRoleRequest'
 *     responses:
 *       200:
 *         description: Role created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Role'
 */
router.post('/roles', authenticate, isAdmin, async (req, res) => {
  try {
    const dto = RoleCreateBody.parse(req.body);
    const data = await roleService.create(dto);
    sendResponse(res, {
      message: 'Tạo vai trò thành công',
      message_en: 'Role created successfully',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/roles/{id}:
 *   get:
 *     summary: Get a role by id
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Role retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Role'
 */
router.get('/roles/:id', authenticate, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0)
      throw new AppError(400, 'Invalid role id');
    const data = await roleService.findById(id);
    sendResponse(res, {
      message: 'Lấy vai trò thành công',
      message_en: 'Role retrieved successfully',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/roles/{id}:
 *   put:
 *     summary: Update a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRoleRequest'
 *     responses:
 *       200:
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Role'
 */
router.put('/roles/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const dto = RoleUpdateBody.parse(req.body);
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0)
      throw new AppError(400, 'Invalid role id');
    const data = await roleService.update(dto, id);
    sendResponse(res, {
      message: 'Cập nhật vai trò thành công',
      message_en: 'Role updated successfully',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/roles/{id}:
 *   delete:
 *     summary: Delete a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Role'
 */
router.delete('/roles/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0)
      throw new AppError(400, 'Invalid role id');
    const data = await roleService.delete(id);
    sendResponse(res, {
      message: 'Xóa vai trò thành công',
      message_en: 'Role deleted successfully',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/roles/{id}/assign:
 *   post:
 *     summary: Assign a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User id to assign the role to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roleId]
 *             properties:
 *               roleId:
 *                 type: integer
 *                 description: Role id to assign
 *     responses:
 *       200:
 *         description: Role assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status_code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Gán vai trò thành công
 *                 message_en:
 *                   type: string
 *                   example: Role assigned
 *                 data:
 *                   type: boolean
 *                   example: true
 */
router.post('/roles/:id/assign', authenticate, isAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const roleId = Number(req.body.roleId);
    const data = await userService.assignRole(userId, roleId);
    sendResponse(res, {
      message: 'Gán vai trò thành công',
      message_en: 'Role assigned',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/roles/{id}/removeAssign:
 *   post:
 *     summary: Remove assigned role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User id to remove the role from
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roleId]
 *             properties:
 *               roleId:
 *                 type: integer
 *                 description: Role id to remove
 *     responses:
 *       200:
 *         description: Role assignment removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status_code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Xóa gán vai trò thành công
 *                 message_en:
 *                   type: string
 *                   example: Role assignment removed
 *                 data:
 *                   type: boolean
 *                   example: true
 */
router.post(
  '/roles/:id/removeAssign',
  authenticate,
  isAdmin,
  async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const roleId = Number(req.body.roleId);
      const data = await userService.removeAssignRole(userId, roleId);
      sendResponse(res, {
        message: 'Xóa gán vai trò thành công',
        message_en: 'Role assignment removed',
        data,
      });
    } catch (err) {
      handleRouteError(err, res);
    }
  },
);

export default router;
