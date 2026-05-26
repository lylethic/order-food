import z from 'zod';

// ── Notification ──────────────────────────────────────────────────────────────

export const NotificationItem = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  isRead: z.boolean(),
  readAt: z.string().nullable(),
  refId: z.string().nullable(),
  createdAt: z.string(),
});
export type NotificationItemType = z.TypeOf<typeof NotificationItem>;

// ── API response wrappers ─────────────────────────────────────────────────────

export const NotificationListRes = z.object({
  success: z.boolean(),
  statusCode: z.number(),
  message: z.string(),
  message_en: z.string().optional(),
  data: z.unknown(),
  errors: z.array(z.any()).optional(),
});
export type NotificationListResType = z.TypeOf<typeof NotificationListRes>;

export const NotificationRes = z.object({
  success: z.boolean(),
  statusCode: z.number(),
  message: z.string(),
  message_en: z.string().optional(),
  data: z.unknown(),
  errors: z.array(z.any()).optional(),
});
export type NotificationResType = z.TypeOf<typeof NotificationRes>;
