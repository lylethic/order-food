import { Router } from 'express';
import { cartService } from '../services/cart.service.js';
import { optionalAuthenticate } from '../middleware/auth.js';
import { AddToCartSchema, UpdateCartItemSchema } from '../schemas/cart.js';
import { sendResponse, handleRouteError } from '../utils/response.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Shopping cart management
 */

/**
 * @swagger
 * /api/v1/cart:
 *   get:
 *     summary: Get cart items
 *     tags: [Cart]
 *     parameters:
 *       - in: header
 *         name: x-session-id
 *         schema:
 *           type: string
 *         description: Guest session ID if not logged in
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 */
router.get('/cart', optionalAuthenticate, async (req, res) => {
  try {
    const userId = req.user?.userId ? BigInt(req.user.userId) : undefined;
    const sessionId = req.headers['x-session-id'] as string;

    const cart = await cartService.getCart(userId, sessionId);
    sendResponse(res, {
      message: 'Lấy giỏ hàng thành công',
      message_en: 'Cart retrieved successfully',
      data: cart,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/cart/add:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     parameters:
 *       - in: header
 *         name: x-session-id
 *         schema:
 *           type: string
 *         description: Guest session ID if not logged in
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               menu_item_id:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               modifications:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Item added to cart successfully
 */
router.post('/cart/add', optionalAuthenticate, async (req, res) => {
  try {
    const dto = AddToCartSchema.parse(req.body);
    const userId = req.user?.userId ? BigInt(req.user.userId) : undefined;
    const sessionId = req.headers['x-session-id'] as string;

    const item = await cartService.addToCart(
      {
        menu_item_id: BigInt(dto.menu_item_id),
        quantity: dto.quantity,
        modifications: dto.modifications,
      },
      userId,
      sessionId,
    );

    sendResponse(res, {
      message: 'Thêm vào giỏ hàng thành công',
      message_en: 'Item added to cart successfully',
      data: item,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/cart/update-item/{id}:
 *   put:
 *     summary: Update cart item quantity or modifications
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *               modifications:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Cart item updated successfully
 */
router.put('/cart/update-item/:id', async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const dto = UpdateCartItemSchema.parse(req.body);
    const item = await cartService.updateCartItem(id, dto);
    sendResponse(res, {
      message: 'Cập nhật giỏ hàng thành công',
      message_en: 'Cart item updated successfully',
      data: item,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/cart/remove/{id}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item removed from cart successfully
 */
router.delete('/cart/remove/:id', async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    await cartService.removeFromCart(id);
    sendResponse(res, {
      message: 'Xóa khỏi giỏ hàng thành công',
      message_en: 'Item removed from cart successfully',
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

export default router;
