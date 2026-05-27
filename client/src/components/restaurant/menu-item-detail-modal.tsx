'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ShoppingCart,
  Plus,
  Minus,
  Star,
  Tag,
  ImageOff,
  Send,
  MessageCircle,
} from 'lucide-react';
import menuItemApiRequest from '@/apiRequests/menu-item';
import commentApiRequest from '@/apiRequests/comment';
import Spinner from '@/components/restaurant/spinner';
import { formatVnd } from '@/lib/money';
import type {
  MenuItemDetailType,
  MenuItemImageType,
} from '@/schemaValidations/menu.schema';
import type { CommentItemType } from '@/schemaValidations/comment.schema';
import type { CommentRepliedEvent } from '@/hooks/useSSE';

interface Props {
  itemId: string;
  initialImage?: string;
  cart: { menuItemId: string; qty: number }[];
  onAddItem: (item: {
    menuItemId: string;
    modifications?: string[];
    qty?: number;
  }) => Promise<void>;
  onUpdateQty: (id: string, qty: number, isMenuItemId?: boolean) => Promise<void>;
  onClose: () => void;
  currentUserId?: string | null;
  currentUserRole?: string | null;
  commentRepliedEvent?: CommentRepliedEvent | null;
}

function ImagePlaceholder() {
  return (
    <div className='w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground gap-2'>
      <ImageOff className='w-10 h-10' />
      <span className='text-xs font-medium'>Chưa có ảnh</span>
    </div>
  );
}

function Thumbnail({
  img,
  active,
  onClick,
}: {
  img: MenuItemImageType;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
        active
          ? 'border-indigo-500 shadow-md shadow-indigo-100'
          : 'border-transparent opacity-60 hover:opacity-100'
      }`}
    >
      <img
        src={`${process.env.NEXT_PUBLIC_API_ENDPOINT}/${img.image_url}`}
        alt=''
        className='w-full h-full object-cover'
        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    </button>
  );
}

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className='flex gap-1'>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type='button'
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className='transition-transform active:scale-90'
        >
          <Star
            className={`w-6 h-6 transition-colors ${
              (hovered || value) >= star
                ? 'text-amber-400 fill-amber-400'
                : 'text-muted-foreground'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function CommentCard({
  comment,
  isStaff,
  onReply,
}: {
  comment: CommentItemType;
  isStaff: boolean;
  onReply: (commentId: string, content: string) => Promise<void>;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <div className='rounded-xl p-3 space-y-2'>
      <div className='flex items-center justify-between gap-2'>
        <div className='flex items-center gap-2 min-w-0'>
          <div className='w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-700 font-bold text-sm'>
            {comment.customerName ? comment.customerName[0].toUpperCase() : 'K'}
          </div>
          <span className='text-sm font-semibold text-foreground truncate'>
            {comment.customerName ?? 'Khách hàng'}
          </span>
        </div>
        {comment.rating != null && (
          <div className='flex items-center gap-0.5 shrink-0'>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-3.5 h-3.5 ${s <= comment.rating! ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}`}
              />
            ))}
          </div>
        )}
      </div>

      <p className='text-sm text-muted-foreground leading-relaxed'>
        {comment.content}
      </p>
      <p className='text-xs text-muted-foreground'>
        {new Date(comment.createdAt).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>

      {comment.reply ? (
        <div className='ml-3 pl-3 border-l-2 border-indigo-200'>
          <div className='flex items-center gap-1.5 mb-1'>
            <div className='w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center shrink-0'>
              <span className='text-white text-[9px] font-bold'>NV</span>
            </div>
            <span className='text-xs font-semibold text-indigo-700'>
              {comment.reply.staffName ?? 'Nhân viên'}
            </span>
          </div>
          <p className='text-xs text-muted-foreground leading-relaxed'>
            {comment.reply.content}
          </p>
        </div>
      ) : isStaff ? (
        <div>
          {!replyOpen ? (
            <button
              onClick={() => setReplyOpen(true)}
              className='text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1'
            >
              <MessageCircle className='w-3.5 h-3.5' />
              Phản hồi
            </button>
          ) : (
            <div className='flex gap-2 mt-1'>
              <input
                autoFocus
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && !e.shiftKey && handleReply()
                }
                placeholder='Nhập phản hồi...'
                className='flex-1 text-xs border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300'
              />
              <button
                onClick={handleReply}
                disabled={submitting || !replyText.trim()}
                className='p-1.5 bg-indigo-600 text-white rounded-lg disabled:opacity-50 hover:bg-indigo-500 transition-colors'
              >
                {submitting ? (
                  <Spinner size='sm' />
                ) : (
                  <Send className='w-3.5 h-3.5' />
                )}
              </button>
              <button
                onClick={() => setReplyOpen(false)}
                className='p-1.5 text-muted-foreground hover:text-muted-foreground transition-colors'
              >
                <X className='w-3.5 h-3.5' />
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function MenuItemDetailModal({
  itemId,
  initialImage,
  cart,
  onAddItem,
  onUpdateQty,
  onClose,
  currentUserId,
  currentUserRole,
  commentRepliedEvent,
}: Props) {
  const [detail, setDetail] = useState<MenuItemDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState<string | undefined>(initialImage);

  const [comments, setComments] = useState<CommentItemType[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentRating, setCommentRating] = useState(0);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState('');

  const isCustomer = currentUserRole?.toLowerCase() === 'customer';
  const isStaff = ['admin', 'employee', 'chef'].includes(
    currentUserRole?.toLowerCase() ?? '',
  );

  useEffect(() => {
    menuItemApiRequest
      .getById(itemId)
      .then((res) => {
        const raw = res.payload.data as any;
        // Normalise: backend may return category as {id, name} object
        const categoryName =
          typeof raw.category === 'string'
            ? raw.category
            : (raw.category?.name ?? null);
        const d: MenuItemDetailType = {
          ...raw,
          category: categoryName,
          images: Array.isArray(raw.images) ? raw.images : [],
        };
        setDetail(d);
        const primary = d.images?.find((i) => i.is_primary);
        setActiveImg(primary?.image_url ?? d.images?.[0]?.image_url ?? d.image);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [itemId]);

  useEffect(() => {
    setCommentsLoading(true);
    commentApiRequest
      .listByMenuItem(itemId)
      .then((res) => {
        const data = res.payload.data;
        setComments(Array.isArray(data) ? data : ((data as any)?.data ?? []));
      })
      .catch(() => {})
      .finally(() => setCommentsLoading(false));
  }, [itemId]);

  useEffect(() => {
    if (!commentRepliedEvent) return;
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentRepliedEvent.commentId
          ? { ...c, reply: commentRepliedEvent.reply }
          : c,
      ),
    );
  }, [commentRepliedEvent]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const qty = cart.find((c) => c.menuItemId === itemId)?.qty ?? 0;
  const thumbnails = detail?.images?.filter((i) => !i.is_primary) ?? [];

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      setCommentError('Vui lòng nhập nội dung đánh giá');
      return;
    }
    setCommentError('');
    setSubmittingComment(true);
    try {
      const res = await commentApiRequest.create(itemId, {
        content: commentText.trim(),
        rating: commentRating > 0 ? commentRating : undefined,
      });
      const created = res.payload.data as CommentItemType;
      setComments((prev) => [created, ...prev]);
      setCommentText('');
      setCommentRating(0);
    } catch (err: any) {
      setCommentError(err.message ?? 'Đăng đánh giá thất bại');
    } finally {
      setSubmittingComment(false);
    }
  };

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

  return (
    <AnimatePresence>
      <motion.div
        key='backdrop'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4'
        onClick={onClose}
      >
        <motion.div
          key='modal'
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          onClick={(e: any) => e.stopPropagation()}
          className='relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col'
        >
          <button
            onClick={onClose}
            className='absolute top-4 right-4 z-10 w-8 h-8 backdrop-blur rounded-full flex items-center justify-center shadow text-muted-foreground hover:text-foreground transition-colors'
          >
            <X className='w-4 h-4' />
          </button>

          {loading ? (
            <div className='flex items-center justify-center h-64'>
              <Spinner size='lg' />
            </div>
          ) : !detail ? (
            <div className='flex items-center justify-center h-64 text-muted-foreground text-sm'>
              Không tìm thấy món ăn
            </div>
          ) : (
            <>
              <div className='aspect-4/3 w-full bg-muted shrink-0'>
                {activeImg ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_ENDPOINT}/${activeImg}`}
                    alt={detail.name}
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <ImagePlaceholder />
                )}
              </div>

              {thumbnails.length > 0 && (
                <div className='flex gap-2 px-5 pt-3 overflow-x-auto scrollbar-hide shrink-0'>
                  {detail.images.map((img) => (
                    <Thumbnail
                      key={img.id}
                      img={img}
                      active={activeImg === img.image_url}
                      onClick={() => setActiveImg(img.image_url)}
                    />
                  ))}
                </div>
              )}

              <div className='flex-1 overflow-y-auto px-5 pt-4 pb-6 space-y-5 bg-white'>
                <div className='flex items-center gap-2 flex-wrap'>
                  {detail.category && (
                    <span className='text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full'>
                      {detail.category}
                    </span>
                  )}
                  {detail.tag && (
                    <span className='flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full'>
                      <Tag className='w-3 h-3' />
                      {detail.tag}
                    </span>
                  )}
                </div>

                <h2 className='text-xl font-extrabold text-foreground -mt-2'>
                  {detail.name}
                </h2>

                {detail.rating != null && (
                  <div className='flex items-center gap-1'>
                    <Star className='w-4 h-4 text-amber-400 fill-amber-400' />
                    <span className='text-sm font-bold text-foreground'>
                      {detail.rating.toFixed(1)}
                    </span>
                  </div>
                )}

                {detail.description && (
                  <p className='text-sm text-muted-foreground leading-relaxed'>
                    {detail.description}
                  </p>
                )}

                <div className='flex items-center justify-between'>
                  <span className='text-2xl font-extrabold text-foreground'>
                    {formatVnd(detail.price)}
                  </span>
                  {qty === 0 ? (
                    <button
                      onClick={() =>
                        onAddItem({
                          menuItemId: detail.id,
                        })
                      }
                      className='flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-3 rounded-xl active:scale-95 transition-all shadow-md shadow-indigo-100'
                    >
                      <ShoppingCart className='w-4 h-4' />
                      Thêm vào giỏ
                    </button>
                  ) : (
                    <div className='flex items-center gap-2 border border-border rounded-xl p-1'>
                      <button
                        onClick={() =>
                          onAddItem({
                            menuItemId: detail.id,
                          })
                        }
                        className='w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 active:scale-90 transition-all'
                      >
                        <Plus className='w-4 h-4' />
                      </button>
                      <span className='text-base font-extrabold text-foreground w-6 text-center'>
                        {qty}
                      </span>
                      <button
                        onClick={() => onUpdateQty(detail.id, qty - 1, true)}
                        className='w-9 h-9 rounded-lg border border-border text-muted-foreground flex items-center justify-center hover:bg-accent active:scale-90 transition-all'
                      >
                        <Minus className='w-4 h-4' />
                      </button>
                    </div>
                  )}
                </div>

                <div className='border-t border-border pt-4'>
                  <h3 className='text-sm font-bold text-foreground mb-3 flex items-center gap-1.5'>
                    <MessageCircle className='w-4 h-4 text-indigo-500' />
                    Đánh giá ({comments.length})
                  </h3>

                  {isCustomer && (
                    <div className='bg-indigo-50 rounded-xl p-3 mb-4 space-y-2'>
                      <div className='flex items-center justify-between'>
                        <span className='text-xs font-semibold text-muted-foreground'>
                          Đánh giá của bạn
                        </span>
                        <StarRating
                          value={commentRating}
                          onChange={setCommentRating}
                        />
                      </div>
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder='Chia sẻ cảm nhận về món ăn...'
                        rows={2}
                        className='w-full text-sm border border-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300'
                      />
                      {commentError && (
                        <p className='text-xs text-red-500'>{commentError}</p>
                      )}
                      <button
                        onClick={handleSubmitComment}
                        disabled={submittingComment || !commentText.trim()}
                        className='flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors'
                      >
                        {submittingComment ? (
                          <Spinner size='sm' />
                        ) : (
                          <Send className='w-3.5 h-3.5' />
                        )}
                        Gửi đánh giá
                      </button>
                    </div>
                  )}

                  {commentsLoading ? (
                    <div className='flex justify-center py-4'>
                      <Spinner size='md' />
                    </div>
                  ) : comments.length === 0 ? (
                    <p className='text-xs text-muted-foreground text-center py-4'>
                      Chưa có đánh giá nào. Hãy là người đầu tiên!
                    </p>
                  ) : (
                    <div className='space-y-3'>
                      {comments.map((c) => (
                        <CommentCard
                          key={c.id}
                          comment={c}
                          isStaff={isStaff}
                          onReply={handleReply}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
