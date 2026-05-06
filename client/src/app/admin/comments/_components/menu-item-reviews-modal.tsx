'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  X,
  Star,
  MessageCircle,
  MessageSquareReply,
  Send,
  Eye,
  EyeOff,
  Tag,
  ImageOff,
} from 'lucide-react';
import commentApiRequest from '@/apiRequests/comment';
import menuItemApiRequest from '@/apiRequests/menu-item';
import Spinner from '@/components/restaurant/spinner';
import type { CommentItemType } from '@/schemaValidations/comment.schema';
import type {
  MenuItemType,
  MenuItemDetailType,
} from '@/schemaValidations/menu.schema';
import Image from 'next/image';
import envConfig from '@/config';

type CommentScope = 'all' | 'visible';

interface Props {
  item: MenuItemType;
  onClose: () => void;
  canReply?: boolean;
  canToggleVisibility?: boolean;
  commentScope?: CommentScope;
}

function Stars({ value }: { value: number }) {
  return (
    <div className='flex gap-0.5'>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${star <= value ? 'text-amber-400 fill-amber-400' : ''}`}
        />
      ))}
    </div>
  );
}

function ReviewCard({
  comment,
  canReply,
  canToggleVisibility,
  onReply,
  onToggleVisibility,
}: {
  comment: CommentItemType;
  canReply: boolean;
  canToggleVisibility: boolean;
  onReply: (commentId: string, content: string) => Promise<void>;
  onToggleVisibility: (
    commentId: string,
    status: 'Visible' | 'Hidden',
  ) => Promise<void>;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await onReply(comment.id, replyText.trim());
      setReplyText('');
      setReplyOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async () => {
    const nextStatus = comment.status === 'Visible' ? 'Hidden' : 'Visible';
    setToggling(true);
    try {
      await onToggleVisibility(comment.id, nextStatus);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm transition-all ${comment.status === 'Hidden' ? 'border-border opacity-80' : 'border-border'}`}
    >
      <div className='flex items-start justify-between gap-3 mb-3'>
        <div className='flex items-center gap-2 min-w-0'>
          <div className='w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0'>
            {comment.customerName ? comment.customerName[0].toUpperCase() : 'K'}
          </div>
          <div className='min-w-0'>
            <p className='text-sm font-bold  truncate'>
              {comment.customerName ?? 'Khách hàng'}
            </p>
            <p className='text-[11px] '>
              {new Date(comment.createdAt).toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2 shrink-0'>
          {comment.rating != null && <Stars value={comment.rating} />}
          {canToggleVisibility && (
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${comment.status === 'Visible' ? 'text-emerald-600 hover:bg-emerald-50' : ' hover:bg-accent'}`}
            >
              {toggling ? (
                <Spinner size='sm' />
              ) : comment.status === 'Visible' ? (
                <Eye className='w-4 h-4' />
              ) : (
                <EyeOff className='w-4 h-4' />
              )}
            </button>
          )}
        </div>
      </div>

      <p className='text-sm  leading-relaxed mb-3'>{comment.content}</p>

      <div className='flex items-center gap-2 mb-3'>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${comment.status === 'Visible' ? 'bg-emerald-50 text-emerald-600' : 'bg-muted '}`}
        >
          {comment.status === 'Visible' ? 'Hiển thị' : 'Đã ẩn'}
        </span>
      </div>

      {comment.reply ? (
        <div className='rounded-xl bg-indigo-50 p-3 border-l-4 border-indigo-200'>
          <div className='flex items-center gap-1.5 mb-1'>
            <MessageSquareReply className='w-3.5 h-3.5 text-indigo-500' />
            <span className='text-xs font-semibold text-indigo-700'>
              {comment.reply.staffName ?? 'Nhân viên'}
            </span>
          </div>
          <p className='text-xs  leading-relaxed'>{comment.reply.content}</p>
        </div>
      ) : canReply ? (
        <div>
          {!replyOpen ? (
            <button
              onClick={() => setReplyOpen(true)}
              className='text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1'
            >
              <MessageCircle className='w-3.5 h-3.5' />
              Phản hồi
            </button>
          ) : (
            <div className='flex gap-2'>
              <input
                autoFocus
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                placeholder='Nhập phản hồi...'
                className='flex-1 text-xs border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300'
              />
              <button
                onClick={handleReply}
                disabled={submitting || !replyText.trim()}
                className='px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-indigo-500 transition-colors flex items-center gap-1'
              >
                {submitting ? (
                  <Spinner size='sm' />
                ) : (
                  <Send className='w-3.5 h-3.5' />
                )}
              </button>
              <button
                onClick={() => {
                  setReplyOpen(false);
                  setReplyText('');
                }}
                className='px-2 hover:text-muted-foreground text-xs'
              >
                <X className='w-4 h-4' />
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function MenuItemReviewsModal({
  item,
  onClose,
  canReply = false,
  canToggleVisibility = false,
  commentScope = 'all',
}: Props) {
  const [detail, setDetail] = useState<MenuItemDetailType | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [comments, setComments] = useState<CommentItemType[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'' | 'Visible' | 'Hidden'>(
    '',
  );

  const imageUrl = useMemo(() => {
    const firstImage =
      detail?.images.find((img) => img.is_primary) ?? detail?.images[0];
    return firstImage?.image_url ?? detail?.image ?? item.image;
  }, [detail, item.image]);

  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      let data: CommentItemType[];
      if (commentScope === 'all') {
        const res = await commentApiRequest.listAll({
          menuItemId: item.id,
          status: statusFilter || undefined,
          limit: 100,
        });
        const raw = res.payload.data;
        data = Array.isArray(raw) ? raw : ((raw as any)?.data ?? []);
      } else {
        const res = await commentApiRequest.listByMenuItem(item.id);
        const raw = res.payload.data;
        data = Array.isArray(raw) ? raw : ((raw as any)?.data ?? []);
      }
      setComments(data);
    } catch {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  }, [commentScope, item.id, statusFilter]);

  useEffect(() => {
    setLoadingDetail(true);
    menuItemApiRequest
      .getById(item.id)
      .then((res) => setDetail(res.payload.data as MenuItemDetailType))
      .catch(() => setDetail(null))
      .finally(() => setLoadingDetail(false));
  }, [item.id]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleReply = async (commentId: string, content: string) => {
    await commentApiRequest.reply(commentId, { content });
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              reply: {
                id: Date.now().toString(),
                content,
                staffName: null,
                staffImg: null,
                createdAt: new Date().toISOString(),
              },
            }
          : c,
      ),
    );
  };

  const handleToggleVisibility = async (
    commentId: string,
    status: 'Visible' | 'Hidden',
  ) => {
    await commentApiRequest.updateStatus(commentId, { status });
    await loadComments();
  };

  const visibleCount = comments.filter((c) => c.status === 'Visible').length;
  const hiddenCount = comments.filter((c) => c.status === 'Hidden').length;

  return (
    <div
      className='fixed inset-0 z-50 bg-black/55 flex items-end sm:items-center justify-center p-0 sm:p-4'
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className='relative w-full sm:max-w-3xl rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col bg-white'
      >
        <button
          onClick={onClose}
          className='absolute top-4 right-4 z-10 w-8 h-8 backdrop-blur rounded-full flex items-center justify-center shadow transition-colors'
        >
          <X className='w-4 h-4' />
        </button>

        {loadingDetail ? (
          <div className='flex items-center justify-center h-64'>
            <Spinner size='lg' />
          </div>
        ) : !detail ? (
          <div className='flex items-center justify-center h-64 text-muted-foreground text-sm'>
            Không tìm thấy món ăn
          </div>
        ) : (
          <>
            <div className='grid md:grid-cols-[1.2fr_0.8fr] gap-0 border-b border-border'>
              <div className='relative aspect-[4/3] bg-muted'>
                {imageUrl ? (
                  <Image
                    src={`${envConfig.NEXT_PUBLIC_API_ENDPOINT}/${imageUrl}`}
                    alt={detail.name}
                    width={200}
                    height={200}
                    className='w-full h-full rounded-lg object-cover flex-shrink-0'
                    loading='lazy'
                  />
                ) : (
                  <div className='w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground gap-2'>
                    <ImageOff className='w-10 h-10' />
                  </div>
                )}
              </div>

              <div className='p-6 flex flex-col justify-between gap-4'>
                <div className='space-y-3'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    {detail.category && (
                      <span className='text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full'>
                        {typeof detail.category === 'object'
                          ? detail.category.name
                          : detail.category}
                      </span>
                    )}
                    {detail.tag && (
                      <span className='flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full'>
                        <Tag className='w-3 h-3' />
                        {detail.tag}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className='text-2xl font-extrabold text-foreground leading-tight'>
                      {detail.name}
                    </h2>
                    {detail.description && (
                      <p className='text-sm text-muted-foreground leading-relaxed mt-2'>
                        {detail.description}
                      </p>
                    )}
                  </div>
                  <div className='flex items-center gap-4 flex-wrap'>
                    {detail.rating != null && (
                      <div className='flex items-center gap-2'>
                        <Stars value={Math.round(detail.rating)} />
                        <span className='text-sm font-bold text-foreground'>
                          {detail.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                    <div className='text-sm font-semibold text-muted-foreground'>
                      {detail.commentCount ?? comments.length} đánh giá
                    </div>
                  </div>
                </div>

                <div className='grid grid-cols-3 gap-3'>
                  <div className='rounded-2xl border border-border p-3'>
                    <p className='text-[11px] font-bold text-muted-foreground uppercase tracking-wider'>
                      Tổng
                    </p>
                    <p className='text-xl font-extrabold text-foreground'>
                      {comments.length}
                    </p>
                  </div>
                  <div className='rounded-2xl bg-emerald-50 border border-emerald-100 p-3'>
                    <p className='text-[11px] font-bold text-emerald-500 uppercase tracking-wider'>
                      Hiển thị
                    </p>
                    <p className='text-xl font-extrabold text-emerald-700'>
                      {visibleCount}
                    </p>
                  </div>
                  <div className='rounded-2xl border border-border p-3'>
                    <p className='text-[11px] font-bold text-muted-foreground uppercase tracking-wider'>
                      Đã ẩn
                    </p>
                    <p className='text-xl font-extrabold text-foreground'>
                      {hiddenCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className='flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4'>
              {commentScope === 'all' && (
                <div className='flex items-center gap-2 flex-wrap'>
                  {(['', 'Visible', 'Hidden'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        statusFilter === status
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                          : 'border border-border text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      {status === ''
                        ? 'Tất cả'
                        : status === 'Visible'
                          ? 'Hiển thị'
                          : 'Đã ẩn'}
                    </button>
                  ))}
                </div>
              )}

              {loadingComments ? (
                <div className='flex justify-center py-10'>
                  <Spinner size='lg' />
                </div>
              ) : comments.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-14 gap-3 text-center border border-border rounded-3xl'>
                  <MessageCircle className='w-14 h-14 text-muted-foreground' />
                  <p className='text-lg font-extrabold text-muted-foreground'>
                    Chưa có đánh giá
                  </p>
                </div>
              ) : (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                  {comments.map((comment) => (
                    <ReviewCard
                      key={comment.id}
                      comment={comment}
                      canReply={canReply}
                      canToggleVisibility={canToggleVisibility}
                      onReply={handleReply}
                      onToggleVisibility={handleToggleVisibility}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
