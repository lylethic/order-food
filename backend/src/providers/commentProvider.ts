import { prisma } from '../lib/prisma.js';

/**
 * Data Access Layer — Comments & Replies
 */
export const commentProvider = {
  /** Return all visible, non-deleted comments for a menu item, newest first. */
  async findByMenuItemId(menuItemId: bigint) {
    return prisma.menu_item_comments.findMany({
      where: { menu_item_id: menuItemId, deleted: false, status: 'Visible' },
      include: {
        users: { select: { id: true, name: true, img: true } },
        menu_item_comment_replies: {
          where: { deleted: false },
          include: { users: { select: { id: true, name: true, img: true } } },
          take: 1,
        },
      },
      orderBy: { created: 'desc' },
    });
  },

  /** Find a single comment by id. */
  async findById(id: bigint) {
    return prisma.menu_item_comments.findFirst({
      where: { id, deleted: false },
    });
  },

  /** Create a new comment. */
  async create(data: {
    menuItemId: bigint;
    customerId: bigint;
    content: string;
    rating?: number;
  }) {
    return prisma.menu_item_comments.create({
      data: {
        menu_item_id: data.menuItemId,
        customer_id: data.customerId,
        content: data.content,
        rating: data.rating,
      },
    });
  },

  /** Find the first (non-deleted) reply for a comment. */
  async findReplyByCommentId(commentId: bigint) {
    return prisma.menu_item_comment_replies.findFirst({
      where: { comment_id: commentId, deleted: false },
    });
  },

  /** Create a reply to a comment. */
  async createReply(data: {
    commentId: bigint;
    staffId: bigint;
    content: string;
  }) {
    return prisma.menu_item_comment_replies.create({
      data: {
        comment_id: data.commentId,
        staff_id: data.staffId,
        content: data.content,
      },
      include: {
        users: { select: { id: true, name: true, img: true } },
      },
    });
  },

  /**
   * Return all comments (for staff/admin), newest first.
   * Includes the menu item name for display purposes.
   */
  async findAll(options: {
    limit?: number;
    status?: string;
    menuItemId?: bigint;
  } = {}) {
    return prisma.menu_item_comments.findMany({
      where: {
        deleted: false,
        ...(options.status ? { status: options.status } : {}),
        ...(options.menuItemId ? { menu_item_id: options.menuItemId } : {}),
      },
      include: {
        users: { select: { id: true, name: true, img: true } },
        menu_items: { select: { id: true, name: true } },
        menu_item_comment_replies: {
          where: { deleted: false },
          include: { users: { select: { id: true, name: true, img: true } } },
          take: 1,
        },
      },
      orderBy: { created: 'desc' },
      take: options.limit ?? 50,
    });
  },

  /** Toggle comment visibility status (Visible / Hidden). */
  async updateStatus(id: bigint, status: 'Visible' | 'Hidden') {
    return prisma.menu_item_comments.update({
      where: { id },
      data: { status },
    });
  },
};
