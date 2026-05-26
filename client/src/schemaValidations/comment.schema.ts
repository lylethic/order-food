import z from 'zod';

// ── Comment Reply ─────────────────────────────────────────────────────────────

export const CommentReply = z.object({
  id: z.string(),
  content: z.string(),
  staffName: z.string().nullable(),
  staffImg: z.string().nullable(),
  createdAt: z.string(),
});
export type CommentReplyType = z.TypeOf<typeof CommentReply>;

// ── Comment ───────────────────────────────────────────────────────────────────

export const CommentItem = z.object({
  id: z.string(),
  menuItemId: z.string(),
  menuItemName: z.string().optional(),
  customerId: z.string(),
  customerName: z.string().nullable(),
  customerImg: z.string().nullable(),
  content: z.string(),
  rating: z.number().nullable(),
  status: z.string(),
  createdAt: z.string(),
  reply: CommentReply.nullable(),
});
export type CommentItemType = z.TypeOf<typeof CommentItem>;

// ── API response wrappers ─────────────────────────────────────────────────────

export const CommentListRes = z.object({
  success: z.boolean(),
  statusCode: z.number(),
  message: z.string(),
  message_en: z.string().optional(),
  data: z.unknown(),
  errors: z.array(z.any()).optional(),
});
export type CommentListResType = z.TypeOf<typeof CommentListRes>;

export const CommentRes = z.object({
  success: z.boolean(),
  statusCode: z.number(),
  message: z.string(),
  message_en: z.string().optional(),
  data: z.unknown(),
  errors: z.array(z.any()).optional(),
});
export type CommentResType = z.TypeOf<typeof CommentRes>;

// ── Create Comment ────────────────────────────────────────────────────────────

export const CreateCommentBody = z.object({
  content: z.string().trim().min(1, 'Nội dung bình luận là bắt buộc').max(1000),
  rating: z.number().min(1).max(5).optional(),
});
export type CreateCommentBodyType = z.TypeOf<typeof CreateCommentBody>;

// ── Reply to Comment ──────────────────────────────────────────────────────────

export const ReplyCommentBody = z.object({
  content: z.string().trim().min(1, 'Nội dung phản hồi là bắt buộc').max(1000),
});
export type ReplyCommentBodyType = z.TypeOf<typeof ReplyCommentBody>;

// ── Update Comment Status ─────────────────────────────────────────────────────

export const UpdateCommentStatusBody = z.object({
  status: z.enum(['Visible', 'Hidden']),
});
export type UpdateCommentStatusBodyType = z.TypeOf<typeof UpdateCommentStatusBody>;
