import { Router } from 'express';
import { orderService } from '../services/order.service.js';
import { orderEmitter, type OrderRealtimeEvent } from '../lib/orderEvents.js';
import { registerSSEClient, unregisterSSEClient } from '../lib/commentEvents.js';
import { authenticate } from '../middleware/auth.js';
import { isEmployee, isStaff } from '../middleware/rbac.js';
import {
  CreateOrderSchema,
  MarkOrderPaidSchema,
  UpdateStatusSchema,
} from '../schemas/validation.js';
import { sendResponse, handleRouteError } from '../utils/response.js';

const router = Router();

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     description: >
 *       Returns active orders newest-first. Filter by `status` to get orders
 *       for specific screens (Kitchen gets all, Server screen gets `Ready`).
 *       **Requires authentication** — staff roles only (Admin, Employee, Chef).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Received, Preparing, Cooking, Ready, Delivered]
 *         required: false
 *         description: Filter by order status
 *         example: Ready
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Insufficient permissions (customer role not allowed)
 *       500:
 *         description: Database error
 */
router.get('/orders', authenticate, isStaff, async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const data = await orderService.getAll(status);
    sendResponse(res, {
      message: 'Lấy danh sách đơn hàng thành công',
      message_en: 'Orders retrieved successfully',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     description: >
 *       Creates a new order with status `Received`. Prices are resolved server-side
 *       from the database to prevent tampering. Requires authentication (any role).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *           example:
 *             tableNumber: '12'
 *             items:
 *               - menuItemId: '1001'
 *                 qty: 2
 *                 modifications: ['No garlic']
 *               - menuItemId: '1003'
 *                 qty: 1
 *     responses:
 *       200:
 *         description: Order created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateOrderResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Missing or invalid token
 *       422:
 *         description: None of the requested menu items were found
 *       500:
 *         description: Database error
 */
router.post('/orders', authenticate, async (req, res) => {
  try {
    const dto = CreateOrderSchema.parse(req.body);
    const data = await orderService.create(dto, req.user!.userId);
    sendResponse(res, {
      message: 'Tạo đơn hàng thành công',
      message_en: 'Order created successfully',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/orders/events:
 *   get:
 *     summary: Subscribe to real-time order status updates (SSE)
 *     tags: [Orders]
 *     description: >
 *       Opens a persistent Server-Sent Events stream. The server pushes an
 *       `OrderStatusEvent` every time any order status changes (via status update
 *       or customer cancellation). Connect once per client session.
 *       **Requires authentication.**
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SSE stream (text/event-stream)
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: object
 *               properties:
 *                 orderId:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [Received, Preparing, Cooking, Ready, Delivered, Cancelled]
 *       401:
 *         description: Missing or invalid token
 */
router.get('/orders/events', authenticate, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Keep the connection alive through proxies / load balancers
  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 30_000);

  // Register client in the targeted SSE registry (for comment/notification events)
  const userId = req.user!.userId;
  registerSSEClient(userId, res);

  const onRealtime = (event: OrderRealtimeEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  orderEmitter.on('status', onRealtime);
  orderEmitter.on('payment', onRealtime);

  req.on('close', () => {
    clearInterval(heartbeat);
    unregisterSSEClient(userId, res);
    orderEmitter.off('status', onRealtime);
    orderEmitter.off('payment', onRealtime);
  });
});

/**
 * @swagger
 * /api/v1/orders/{id}/status:
 *   put:
 *     summary: Update order status
 *     tags: [Orders]
 *     description: >
 *       Advances the order through the workflow:
 *       `Received → Preparing → Cooking → Ready → Delivered`.
 *       Used by Kitchen screen (accept / mark ready) and Server screen (confirm delivery).
 *       **Requires authentication** — staff roles only.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *         example: '1714291200000'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStatusRequest'
 *           example:
 *             status: Ready
 *     responses:
 *       200:
 *         description: Status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateStatusResponse'
 *       400:
 *         description: Invalid status value
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Database error or order not found
 */
/**
 * @swagger
 * /api/v1/orders/my:
 *   get:
 *     summary: List orders placed by the current user
 *     tags: [Orders]
 *     description: >
 *       Returns a summary list of all orders placed by the authenticated customer,
 *       sorted newest-first. Each item includes status, table, item count, and total.
 *       Click an order to load its full details via `GET /orders/:id`.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of order summaries
 *       401:
 *         description: Missing or invalid token
 */
router.get('/orders/my', authenticate, async (req, res) => {
  try {
    const data = await orderService.getByCustomer(req.user!.userId);
    sendResponse(res, {
      message: 'Lấy danh sách đơn hàng của bạn thành công',
      message_en: 'Your orders retrieved successfully',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   get:
 *     summary: Get full detail of a single order
 *     tags: [Orders]
 *     description: >
 *       Returns the order with all its line items (name, qty, price, modifications).
 *       Customers may only view their own orders. Staff can view any order.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *         example: '1714291200000'
 *     responses:
 *       200:
 *         description: Order detail with items
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Trying to view another customer's order
 *       404:
 *         description: Order not found
 */
router.get('/orders/:id', authenticate, async (req, res) => {
  try {
    const data = await orderService.getDetail(
      req.params.id,
      req.user!.userId,
      req.user!.role,
    );
    sendResponse(res, {
      message: 'Lấy chi tiết đơn hàng thành công',
      message_en: 'Order detail retrieved successfully',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

router.put('/orders/:id/status', authenticate, isStaff, async (req, res) => {
  try {
    const dto = UpdateStatusSchema.parse(req.body);
    const data = await orderService.updateStatus(req.params.id, dto);
    sendResponse(res, {
      message: 'Cập nhật trạng thái đơn hàng thành công',
      message_en: 'Order status updated successfully',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/orders/{id}/cancel:
 *   put:
 *     summary: Cancel own order
 *     tags: [Orders]
 *     description: >
 *       Allows a customer to cancel their own order before it is processed.
 *       Only orders in `Received` status can be cancelled.
 *       Received → Preparing → Cooking → Ready → Delivered.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *         example: '1714291200000'
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateStatusResponse'
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Not the owner of this order
 *       404:
 *         description: Order not found
 *       409:
 *         description: Order already processed and cannot be cancelled
 */
router.put('/orders/:id/cancel', authenticate, async (req, res) => {
  try {
    const data = await orderService.cancelByCustomer(
      req.params.id,
      req.user!.userId,
    );
    sendResponse(res, {
      message: 'Hủy đơn hàng thành công',
      message_en: 'Order cancelled successfully',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * @swagger
 * /api/v1/orders/{id}/payment:
 *   put:
 *     summary: Mark order as paid
 *     tags: [Orders]
 *     description: >
 *       Confirms payment for a delivered order and stores payment metadata:
 *       `is_paid`, `payment_method`, and `paid_at`.
 *       Only staff responsible for checkout can perform this action.
 *       Order must be in `Delivered` status and not already paid.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *         example: '1714291200000'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MarkOrderPaidRequest'
 *           example:
 *             paymentMethod: E-Wallet
 *     responses:
 *       200:
 *         description: Payment confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MarkOrderPaidResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Missing or invalid token
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Order not found
 *       409:
 *         description: Order not delivered yet or already paid
 */
router.put(
  '/orders/:id/payment',
  authenticate,
  isEmployee,
  async (req, res) => {
    try {
      const dto = MarkOrderPaidSchema.parse(req.body);
      const data = await orderService.markPaid(req.params.id, dto);
      sendResponse(res, {
        message: 'Thanh toán đơn hàng thành công',
        message_en: 'Order paid successfully',
        data,
      });
    } catch (err) {
      handleRouteError(err, res);
    }
  },
);

export default router;
