import { Router } from 'express';
import { commentService, notificationService } from '../services/comment.service.js';
import { authenticate } from '../middleware/auth.js';
import { isAdmin, isCustomer, isStaff } from '../middleware/rbac.js';
import { CreateCommentSchema, ReplyCommentSchema } from '../schemas/comment.js';
import { sendResponse, handleRouteError } from '../utils/response.js';

const router = Router();

// ─── Comments ─────────────────────────────────────────────────────────────────

/**
 * GET /menu-items/:menuItemId/comments
 * Public — anyone can read comments for a menu item.
 */
router.get('/menu-items/:menuItemId/comments', async (req, res) => {
  try {
    const data = await commentService.getByMenuItem(req.params.menuItemId);
    sendResponse(res, {
      message: 'Lấy danh sách đánh giá thành công',
      message_en: 'Comments retrieved successfully',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * POST /menu-items/:menuItemId/comments
 * Customer only — create a new comment/rating for a menu item.
 */
router.post('/menu-items/:menuItemId/comments', authenticate, isCustomer, async (req, res) => {
  try {
    const dto = CreateCommentSchema.parse(req.body);
    const data = await commentService.createComment(
      req.params.menuItemId,
      req.user!.userId,
      dto,
    );
    sendResponse(res, {
      message: 'Đánh giá món ăn thành công',
      message_en: 'Comment created successfully',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * POST /comments/:commentId/reply
 * Staff/Admin only — reply to a customer comment.
 */
router.post('/comments/:commentId/reply', authenticate, isStaff, async (req, res) => {
  try {
    const dto = ReplyCommentSchema.parse(req.body);
    const data = await commentService.replyToComment(
      req.params.commentId,
      req.user!.userId,
      dto,
    );
    sendResponse(res, {
      message: 'Phản hồi đánh giá thành công',
      message_en: 'Reply created successfully',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * GET /comments
 * Staff/Admin — all comments across all menu items, newest first.
 * Optional query params: status=Visible|Hidden, menuItemId=123, limit=50
 */
router.get('/comments', authenticate, isStaff, async (req, res) => {
  try {
    const { status, menuItemId, limit } = req.query;
    const data = await commentService.getAll({
      status: status as string | undefined,
      menuItemId: menuItemId as string | undefined,
      limit: limit ? Number(limit) : undefined,
    });
    sendResponse(res, {
      message: 'Lấy danh sách đánh giá thành công',
      message_en: 'Comments retrieved successfully',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * PATCH /comments/:id/status
 * Admin only — toggle comment visibility between Visible and Hidden.
 */
router.patch('/comments/:id/status', authenticate, isAdmin, async (req, res) => {
  try {
    const { status } = req.body as { status: 'Visible' | 'Hidden' };
    const data = await commentService.updateStatus(req.params.id, status);
    sendResponse(res, {
      message: 'Cập nhật trạng thái đánh giá thành công',
      message_en: 'Comment status updated',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

// ─── Notifications ────────────────────────────────────────────────────────────

/**
 * GET /notifications
 * Authenticated — returns the current user's 50 most recent notifications.
 */
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const data = await notificationService.getByUser(req.user!.userId);
    sendResponse(res, {
      message: 'Lấy thông báo thành công',
      message_en: 'Notifications retrieved successfully',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

/**
 * PATCH /notifications/:id/read
 * Authenticated — mark a notification as read.
 */
router.patch('/notifications/:id/read', authenticate, async (req, res) => {
  try {
    const data = await notificationService.markRead(req.params.id, req.user!.userId);
    sendResponse(res, {
      message: 'Đánh dấu đã đọc thành công',
      message_en: 'Notification marked as read',
      data,
    });
  } catch (err) {
    handleRouteError(err, res);
  }
});

export default router;
