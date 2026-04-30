import { Router } from 'express';
import { menuItemService } from '../services/menuItem.service.js';
import { sendResponse, handleRouteError } from '../utils/response.js';
import { BaseSearchRequest } from '../schemas/search.js';
import { MenuItemCreateBody, MenuItemUpdateBody } from '../schemas/menuItem.js';
import { AppError } from '../utils/AppError.js';
import { uploadImage } from '../services/staticFile.service.js';

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
 *         name: categoryId
 *         schema:
 *           type: integer
 *         required: false
 *         description: Filter by category id
 *         example: 1
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

/**
 * @swagger
 * /api/v1/menuItems/{id}/images:
 *   post:
 *     summary: Upload images for a menu item
 *     tags: [Menu Items]
 *     description: Upload one or more images (max 10, 5 MB each). Send as multipart/form-data with field name "files". Optionally set "primaryIndex" (0-based) to mark one as primary.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [files]
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               primaryIndex:
 *                 type: integer
 *                 description: 0-based index of the primary image (default 0)
 *     responses:
 *       200:
 *         description: Images uploaded — returns updated menu item with images array
 *       400:
 *         description: No files provided
 *       404:
 *         description: Menu item not found
 *       415:
 *         description: Unsupported file type
 */
router.post('/menuItems/:id/images', uploadImage.array('files', 10), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) throw new AppError(400, 'Invalid menu item id');

    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) throw new AppError(400, 'Chưa chọn file ảnh');

    const { primaryIndex } = req.body as { primaryIndex?: string };
    const data = await menuItemService.uploadImages(id, files, primaryIndex);
    sendResponse(res, {
      message: 'Tải ảnh lên thành công',
      message_en: 'Images uploaded successfully',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/menuItems/{id}/images/{imageId}:
 *   delete:
 *     summary: Delete one image from a menu item
 *     tags: [Menu Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Menu item id
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Image id
 *     responses:
 *       200:
 *         description: Image deleted — returns updated menu item
 *       400:
 *         description: Invalid id or image does not belong to this menu item
 *       404:
 *         description: Image not found
 */
router.delete('/menuItems/:id/images/:imageId', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const imageId = Number(req.params.imageId);
    if (!Number.isInteger(id) || id <= 0) throw new AppError(400, 'Invalid menu item id');
    if (!Number.isInteger(imageId) || imageId <= 0) throw new AppError(400, 'Invalid image id');

    const data = await menuItemService.deleteImage(id, imageId);
    sendResponse(res, {
      message: 'Xóa ảnh thành công',
      message_en: 'Image deleted successfully',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

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
