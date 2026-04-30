import { prisma } from '../lib/prisma.js';

/**
 * Data Access Layer — Notifications
 */
export const notificationProvider = {
  /** Create a notification for a specific user. */
  async create(data: {
    userId: bigint;
    type: string;
    title: string;
    body: string;
    refId?: bigint;
  }) {
    return prisma.notifications.create({
      data: {
        user_id: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        ref_id: data.refId,
      },
    });
  },

  /** Return the 50 most recent notifications for a user, newest first. */
  async findByUserId(userId: bigint) {
    return prisma.notifications.findMany({
      where: { user_id: userId, deleted: false },
      orderBy: { created: 'desc' },
      take: 50,
    });
  },

  /** Find a single notification by id. */
  async findById(id: bigint) {
    return prisma.notifications.findFirst({
      where: { id, deleted: false },
    });
  },

  /** Mark a notification as read. */
  async markRead(id: bigint, readAt: Date) {
    return prisma.notifications.update({
      where: { id },
      data: { is_read: true, read_at: readAt },
    });
  },

  /**
   * Find all active staff/admin users (employee, chef, admin roles).
   * Used to fan-out notifications when a customer posts a comment.
   */
  async findAllStaffAdminIds(): Promise<bigint[]> {
    const users = await prisma.user.findMany({
      where: {
        deleted: false,
        active: true,
        roles: {
          some: {
            deleted: false,
            active: true,
            role: {
              deleted: false,
              active: true,
              name: { in: ['admin', 'employee', 'chef'] },
            },
          },
        },
      },
      select: { id: true },
    });
    return users.map((u) => u.id);
  },
};
