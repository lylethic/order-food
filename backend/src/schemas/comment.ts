import { z } from 'zod';

// ─── Request schemas (Zod) ────────────────────────────────────────────────────

export const CreateCommentSchema = z.object({
  content: z.string().min(1, 'Nội dung không được để trống').max(1000),
  rating: z.number().min(1).max(5).optional(),
});

export const ReplyCommentSchema = z.object({
  content: z.string().min(1, 'Nội dung không được để trống').max(1000),
});

export type CreateCommentBodyType = z.infer<typeof CreateCommentSchema>;
export type ReplyCommentBodyType = z.infer<typeof ReplyCommentSchema>;

// ─── Response DTOs ────────────────────────────────────────────────────────────

export interface CommentReplyDto {
  id: string;
  content: string;
  staffName: string | null;
  staffImg: string | null;
  createdAt: string;
}

export interface CommentDto {
  id: string;
  menuItemId: string;
  menuItemName?: string;
  customerId: string;
  customerName: string | null;
  customerImg: string | null;
  content: string;
  rating: number | null;
  status: string;
  createdAt: string;
  reply: CommentReplyDto | null;
}

export interface NotificationDto {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  readAt: string | null;
  refId: string | null;
  createdAt: string;
}
