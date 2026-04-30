import { prisma } from '../lib/prisma.js';
import { commentProvider } from '../providers/commentProvider.js';
import { menuItemProvider } from '../providers/menuItemProvider.js';
import { notificationProvider } from '../providers/notificationProvider.js';
import { AppError } from '../utils/AppError.js';
import { sendSSEToUser, sendSSEToUsers } from '../lib/commentEvents.js';
import type {
  CreateCommentBodyType,
  ReplyCommentBodyType,
  CommentDto,
  CommentReplyDto,
  NotificationDto,
} from '../schemas/comment.js';

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatReply(reply: any): CommentReplyDto {
  return {
    id: reply.id.toString(),
    content: reply.content,
    staffName: reply.users?.name ?? null,
    staffImg: reply.users?.img ?? null,
    createdAt: (reply.created as Date).toISOString(),
  };
}

function formatComment(row: any): CommentDto {
  const reply = row.menu_item_comment_replies?.[0] ?? null;
  return {
    id: row.id.toString(),
    menuItemId: row.menu_item_id.toString(),
    menuItemName: row.menu_items?.name ?? undefined,
    customerId: row.customer_id.toString(),
    customerName: row.users?.name ?? null,
    customerImg: row.users?.img ?? null,
    content: row.content,
    rating: row.rating != null ? Number(row.rating) : null,
    status: row.status,
    createdAt: (row.created as Date).toISOString(),
    reply: reply ? formatReply(reply) : null,
  };
}

function formatNotification(row: any): NotificationDto {
  return {
    id: row.id.toString(),
    type: row.type,
    title: row.title,
    body: row.body,
    isRead: Boolean(row.is_read),
    readAt: row.read_at ? (row.read_at as Date).toISOString() : null,
    refId: row.ref_id ? row.ref_id.toString() : null,
    createdAt: (row.created as Date).toISOString(),
  };
}

// ─── Comment Service ──────────────────────────────────────────────────────────

export const commentService = {
  /** Return all visible comments for a menu item. */
  async getByMenuItem(menuItemId: string): Promise<CommentDto[]> {
    // Verify menu item exists
    const menuItem = await prisma.menuItem.findFirst({
      where: { id: BigInt(menuItemId), deleted: false },
    });
    if (!menuItem) throw new AppError(404, 'Món ăn không tồn tại');

    const rows = await commentProvider.findByMenuItemId(BigInt(menuItemId));
    return rows.map(formatComment);
  },

  /**
   * Flow 1: Customer posts a comment.
   * 1. Validate menu item exists
   * 2. Save comment
   * 3. Find all active staff/admin
   * 4. Create CUSTOMER_COMMENT notification for each
   * 5. Send SSE: comment.created + notification.created to each online staff/admin
   */
  async createComment(
    menuItemId: string,
    customerId: string,
    dto: CreateCommentBodyType,
  ): Promise<CommentDto> {
    // Validate menu item
    const menuItem = await prisma.menuItem.findFirst({
      where: { id: BigInt(menuItemId), deleted: false },
      select: { id: true, name: true },
    });
    if (!menuItem) throw new AppError(404, 'Món ăn không tồn tại');

    // Fetch customer info for notification body
    const customer = await prisma.user.findFirst({
      where: { id: BigInt(customerId) },
      select: { name: true },
    });

    // Save comment
    const comment = await commentProvider.create({
      menuItemId: BigInt(menuItemId),
      customerId: BigInt(customerId),
      content: dto.content,
      rating: dto.rating,
    });

    await menuItemProvider.updateAverageRating(comment.menu_item_id);

    // Fan-out: notify all active staff/admin
    const staffIds = await notificationProvider.findAllStaffAdminIds();

    const notifications = await Promise.all(
      staffIds.map((uid) =>
        notificationProvider.create({
          userId: uid,
          type: 'CUSTOMER_COMMENT',
          title: 'Đánh giá mới',
          body: `${customer?.name ?? 'Khách hàng'} vừa đánh giá món "${menuItem.name}"`,
          refId: comment.id,
        }),
      ),
    );

    // SSE: push comment.created + notification.created to all online staff/admin
    const staffStrIds = staffIds.map((id) => id.toString());
    const commentEvent = {
      eventType: 'comment.created' as const,
      comment: {
        id: comment.id.toString(),
        menuItemId: comment.menu_item_id.toString(),
        menuItemName: menuItem.name,
        customerName: customer?.name ?? null,
        content: comment.content,
        rating: comment.rating != null ? Number(comment.rating) : null,
        createdAt: (comment.created as Date).toISOString(),
      },
    };
    sendSSEToUsers(staffStrIds, commentEvent);

    staffIds.forEach((uid, idx) => {
      sendSSEToUser(uid.toString(), {
        eventType: 'notification.created',
        notification: formatNotification(notifications[idx]),
      });
    });

    return {
      id: comment.id.toString(),
      menuItemId: comment.menu_item_id.toString(),
      customerId: comment.customer_id.toString(),
      customerName: customer?.name ?? null,
      customerImg: null,
      content: comment.content,
      rating: comment.rating != null ? Number(comment.rating) : null,
      status: comment.status,
      createdAt: (comment.created as Date).toISOString(),
      reply: null,
    };
  },

  /**
   * Flow 2: Staff/Admin replies to a comment.
   * 1. Validate comment exists
   * 2. Validate no existing reply
   * 3. Save reply
   * 4. Create STAFF_REPLY_COMMENT notification for the comment's customer
   * 5. Send SSE: comment.replied + notification.created to the customer
   */
  async replyToComment(
    commentId: string,
    staffId: string,
    dto: ReplyCommentBodyType,
  ): Promise<CommentReplyDto> {
    const comment = await commentProvider.findById(BigInt(commentId));
    if (!comment) throw new AppError(404, 'Comment không tồn tại');

    const existing = await commentProvider.findReplyByCommentId(
      BigInt(commentId),
    );
    if (existing) throw new AppError(409, 'Comment này đã có phản hồi');

    const reply = await commentProvider.createReply({
      commentId: BigInt(commentId),
      staffId: BigInt(staffId),
      content: dto.content,
    });

    const customerId = comment.customer_id.toString();

    // Create notification for the customer
    const notification = await notificationProvider.create({
      userId: comment.customer_id,
      type: 'STAFF_REPLY_COMMENT',
      title: 'Phản hồi mới',
      body: 'Nhân viên đã phản hồi đánh giá của bạn',
      refId: reply.id,
    });

    // SSE: push comment.replied + notification.created only to this customer
    sendSSEToUser(customerId, {
      eventType: 'comment.replied',
      commentId,
      reply: {
        id: reply.id.toString(),
        content: reply.content,
        staffName: (reply as any).users?.name ?? null,
        createdAt: (reply.created as Date).toISOString(),
      },
    });
    sendSSEToUser(customerId, {
      eventType: 'notification.created',
      notification: formatNotification(notification),
    });

    return formatReply(reply);
  },

  /**
   * Staff/Admin: Get all comments across all menu items.
   * Includes the menu item name for display.
   */
  async getAll(
    options: {
      limit?: number;
      status?: string;
      menuItemId?: string;
    } = {},
  ): Promise<CommentDto[]> {
    const rows = await commentProvider.findAll({
      limit: options.limit,
      status: options.status,
      menuItemId: options.menuItemId ? BigInt(options.menuItemId) : undefined,
    });
    return rows.map(formatComment);
  },

  /**
   * Admin: Toggle comment visibility (Visible / Hidden).
   */
  async updateStatus(
    commentId: string,
    status: 'Visible' | 'Hidden',
  ): Promise<CommentDto> {
    const existing = await commentProvider.findById(BigInt(commentId));
    if (!existing) throw new AppError(404, 'Comment không tồn tại');
    if (status !== 'Visible' && status !== 'Hidden') {
      throw new AppError(
        400,
        'Status không hợp lệ. Chấp nhận: Visible, Hidden',
      );
    }
    const updated = await commentProvider.updateStatus(
      BigInt(commentId),
      status,
    );
    return {
      id: updated.id.toString(),
      menuItemId: updated.menu_item_id.toString(),
      customerId: updated.customer_id.toString(),
      customerName: null,
      customerImg: null,
      content: updated.content,
      rating: updated.rating != null ? Number(updated.rating) : null,
      status: updated.status,
      createdAt: (updated.created as Date).toISOString(),
      reply: null,
    };
  },
};

// ─── Notification Service ─────────────────────────────────────────────────────

export const notificationService = {
  /** Return the 50 most recent notifications for the current user. */
  async getByUser(userId: string): Promise<NotificationDto[]> {
    const rows = await notificationProvider.findByUserId(BigInt(userId));
    return rows.map(formatNotification);
  },

  /**
   * Flow 3: Mark a single notification as read.
   * Verifies the notification belongs to the requesting user.
   */
  async markRead(
    notificationId: string,
    userId: string,
  ): Promise<NotificationDto> {
    const notification = await notificationProvider.findById(
      BigInt(notificationId),
    );
    if (!notification) throw new AppError(404, 'Thông báo không tồn tại');
    if (notification.user_id.toString() !== userId) {
      throw new AppError(403, 'Không có quyền truy cập thông báo này');
    }

    const updated = await notificationProvider.markRead(
      BigInt(notificationId),
      new Date(),
    );
    return formatNotification(updated);
  },
};
