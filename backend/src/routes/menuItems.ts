import { Router } from 'express';
import { menuItemService } from '../services/menuItem.service.js';
import { sendResponse, handleRouteError } from '../utils/response.js';
import { BaseSearchRequest } from '../schemas/search.js';
import { MenuItemCreateBody, MenuItemUpdateBody } from '../schemas/menuItem.js';

const router = Router();

/**
 * @swagger
 * /api/v1/menuItems:
 *   get:
 *     summary: Get menu items
 *     tags: [Menu Items]
 *     description: Returns paginated menu items. Optionally filter by category name. Public — no auth required.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: Free text search or filter string
 *         example: Crispy
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [Starters, Mains, Desserts, Beverages, Specials]
 *         required: false
 *         description: Filter by category name
 *         example: Starters
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
 *         description: Cursor menu item id
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
 *         description: Menu items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MenuItem'
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Database error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/menuItems', async (_req, res) => {
  try {
    const query = BaseSearchRequest.parse(_req.query);
    const data = await menuItemService.getAll(query);
    sendResponse(res, {
      message: 'Lấy danh sách món ăn thành công',
      message_en: 'Menu items retrieved successfully',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

router.get('/menuItems/:id', async (_req, res) => {
  try {
    const id = Number(_req.params.id);
    const data = await menuItemService.findById(id);
    sendResponse(res, {
      message: 'Lấy thông tin món ăn thành công',
      message_en: 'Menu item retrieved successfully',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/menuItems/{id}:
 *   get:
 *     summary: Get a menu item by id
 *     tags: [Menu Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Menu item id
 *     responses:
 *       200:
 *         description: Menu item retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MenuItem'
 *       400:
 *         description: Invalid id
 *       404:
 *         description: Menu item not found
 */

router.post('/menuItems', async (_req, res) => {
  try {
    const request = MenuItemCreateBody.parse(_req.body);
    const data = await menuItemService.create(request);
    sendResponse(res, {
      message: 'Tạo món ăn thành công',
      message_en: 'Menu item',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/menuItems:
 *   post:
 *     summary: Create a new menu item
 *     tags: [Menu Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMenuItemRequest'
 *           example:
 *             category_id: '1'
 *             name: 'New Dish'
 *             description: 'Delicious new item'
 *             price: 12.5
 *             image: 'https://example.com/dish.jpg'
 *             rating: 4.5
 *             tag: 'Chef Favorite'
 *     responses:
 *       200:
 *         description: Menu item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MenuItem'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Database error
 */

router.put('/menuItems/:id', async (_req, res) => {
  try {
    const request = MenuItemUpdateBody.parse(_req.body);
    const id = Number(_req.params.id);
    const data = await menuItemService.update(request, id);
    sendResponse(res, {
      message: 'Cập nhật món ăn thành công',
      message_en: 'Menu item updated',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/menuItems/{id}:
 *   put:
 *     summary: Update a menu item
 *     tags: [Menu Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Menu item id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateMenuItemRequest'
 *           example:
 *             name: 'Updated Dish'
 *             price: 13.0
 *     responses:
 *       200:
 *         description: Menu item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MenuItem'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Menu item not found
 */

export default router;
