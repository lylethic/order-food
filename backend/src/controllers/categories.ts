import { Router } from 'express';
import { categoryService } from '../services/category.service.js';
import { sendResponse, handleRouteError } from '../utils/response.js';
import { BaseSearchRequest } from '../schemas/search.js';
import { isChef } from '../middleware/rbac.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     description: Returns paginated active categories. Public — no auth required.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: Search by category name or dynamic filter string
 *         example: starters
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
 *         description: Cursor category id
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
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryListResponse'
 *             example:
 *               data:
 *                 - id: '1'
 *                   name: Beverages
 *                   created: '2026-04-28T08:00:00.000Z'
 *                   updated: '2026-04-28T08:00:00.000Z'
 *                   created_by: null
 *                   updated_by: null
 *                   deleted: false
 *                   active: true
 *               pagination:
 *                 limit: 10
 *                 nextCursor: null
 *                 hasNextPage: false
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Database error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/categories', async (_req, res) => {
  try {
    const query = BaseSearchRequest.parse(_req.query);
    const data = await categoryService.getAll(query);
    sendResponse(res, {
      message: 'Lấy danh sách danh mục thành công',
      message_en: 'Categories retrieved successfully',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     description: Create a category. Public in current implementation.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryRequest'
 *           example:
 *             name: Beverages
 *     responses:
 *       200:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Database error
 */
router.post('/categories', authenticate, isChef, async (_req, res) => {
  try {
    const { name } = _req.body;
    const data = await categoryService.create(name);
    sendResponse(res, {
      message: 'Tạo danh mục thành công',
      message_en: 'Category',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   put:
 *     summary: Update a category
 *     tags: [Categories]
 *     description: Update a category by id. Public in current implementation.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCategoryRequest'
 *           example:
 *             name: Desserts
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Invalid category id or validation error
 *       404:
 *         description: Category not found
 *       500:
 *         description: Database error
 */
router.put('/categories/:id', authenticate, isChef, async (_req, res) => {
  try {
    const { name } = _req.body;
    const id = Number(_req.params.id);
    const data = await categoryService.update(name, id);
    sendResponse(res, {
      message: 'Cập nhật danh mục thành công',
      message_en: 'Category updated',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Categories]
 *     description: Soft delete a category by id. Public in current implementation.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category id
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Invalid category id
 *       404:
 *         description: Category not found
 *       500:
 *         description: Database error
 */
router.delete('/categories/:id', authenticate, isChef, async (_req, res) => {
  try {
    const id = Number(_req.params.id);
    const data = await categoryService.delete(id);
    sendResponse(res, {
      message: 'Xóa danh mục thành công',
      message_en: 'Category deleted',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   get:
 *     summary: Get a category by id
 *     tags: [Categories]
 *     description: Retrieve a single category by id. Public in current implementation.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category id
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Invalid category id
 *       404:
 *         description: Category not found
 *       500:
 *         description: Database error
 */
router.get('/categories/:id', async (_req, res) => {
  try {
    const id = Number(_req.params.id);
    const data = await categoryService.findById(id);
    sendResponse(res, {
      message: 'Lấy danh mục thành công',
      message_en: 'Category retrieved',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

export default router;
