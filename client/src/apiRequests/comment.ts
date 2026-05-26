import http from '@/lib/http';
import {
  CommentListResType,
  CommentResType,
  CreateCommentBodyType,
  ReplyCommentBodyType,
  UpdateCommentStatusBodyType,
} from '@/schemaValidations/comment.schema';

const commentApiRequest = {
  // ── Public / Customer ──────────────────────────────────────────────────────

  listByMenuItem: (menuItemId: string) =>
    http.get<CommentListResType>(`api/v1/menu-items/${menuItemId}/comments`),

  create: (menuItemId: string, body: CreateCommentBodyType) =>
    http.post<CommentResType>(`api/v1/menu-items/${menuItemId}/comments`, body),

  // ── Staff / Admin ──────────────────────────────────────────────────────────

  listAll: (params?: { status?: string; menuItemId?: string; limit?: number }) =>
    http.get<CommentListResType>('api/v1/comments', { params }),

  reply: (commentId: string, body: ReplyCommentBodyType) =>
    http.post<CommentResType>(`api/v1/comments/${commentId}/reply`, body),

  updateStatus: (commentId: string, body: UpdateCommentStatusBodyType) =>
    http.patch<CommentResType>(`api/v1/comments/${commentId}/status`, body),
};

export default commentApiRequest;
