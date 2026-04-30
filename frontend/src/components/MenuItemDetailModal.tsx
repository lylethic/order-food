import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, Plus, Minus, Star, Tag, ImageOff } from 'lucide-react';
import { api } from '../services/api';
import { Spinner } from './Spinner';
import { formatVnd } from '../utils/money';
import type { MenuItemDetail, MenuItemImage } from '../types';

interface Props {
  itemId: string;
  initialImage?: string;
  cart: { menuItemId: string; qty: number }[];
  onAddItem: (item: { menuItemId: string; name: string; price: number; image?: string }) => void;
  onUpdateQty: (id: string, qty: number) => void;
  onClose: () => void;
}

function ImagePlaceholder() {
  return (
    <div className='w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-300 gap-2'>
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
  img: MenuItemImage;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
        active ? 'border-indigo-500 shadow-md shadow-indigo-100' : 'border-transparent opacity-60 hover:opacity-100'
      }`}
    >
      <img
        src={`/${img.image_url}`}
        alt=''
        className='w-full h-full object-cover'
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    </button>
  );
}

export function MenuItemDetailModal({
  itemId,
  initialImage,
  cart,
  onAddItem,
  onUpdateQty,
  onClose,
}: Props) {
  const [detail, setDetail] = useState<MenuItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState<string | undefined>(initialImage);

  useEffect(() => {
    api
      .getMenuItemDetail(itemId)
      .then((d) => {
        setDetail(d);
        // set default image: primary first, then first in list
        const primary = d.images.find((i) => i.is_primary);
        setActiveImg(primary?.image_url ?? d.images[0]?.image_url ?? d.image);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [itemId]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const qty = cart.find((c) => c.menuItemId === itemId)?.qty ?? 0;

  // Non-primary thumbnails (those listed below the main image)
  const thumbnails = detail?.images.filter((i) => !i.is_primary) ?? [];

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key='backdrop'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4'
        onClick={onClose}
      >
        {/* Modal */}
        <motion.div
          key='modal'
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className='relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col'
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className='absolute top-4 right-4 z-10 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow text-slate-500 hover:text-slate-800 transition-colors'
          >
            <X className='w-4 h-4' />
          </button>

          {loading ? (
            <div className='flex items-center justify-center h-64'>
              <Spinner size='lg' />
            </div>
          ) : !detail ? (
            <div className='flex items-center justify-center h-64 text-slate-400 text-sm'>
              Không tìm thấy món ăn
            </div>
          ) : (
            <>
              {/* Main image */}
              <div className='aspect-4/3 w-full bg-slate-100 shrink-0'>
                {activeImg ? (
                  <img
                    src={`/${activeImg}`}
                    alt={detail.name}
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <ImagePlaceholder />
                )}
              </div>

              {/* Thumbnail strip — only non-primary images */}
              {thumbnails.length > 0 && (
                <div className='flex gap-2 px-5 pt-3 overflow-x-auto scrollbar-hide shrink-0'>
                  {/* Show primary as first thumbnail too so user can switch back */}
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

              {/* Info */}
              <div className='flex-1 overflow-y-auto px-5 pt-4 pb-6'>
                {/* Tags */}
                <div className='flex items-center gap-2 mb-2 flex-wrap'>
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

                <h2 className='text-xl font-extrabold text-slate-800 mb-1'>{detail.name}</h2>

                {detail.rating != null && (
                  <div className='flex items-center gap-1 mb-3'>
                    <Star className='w-4 h-4 text-amber-400 fill-amber-400' />
                    <span className='text-sm font-bold text-slate-700'>{detail.rating.toFixed(1)}</span>
                  </div>
                )}

                {detail.description && (
                  <p className='text-sm text-slate-500 leading-relaxed mb-5'>{detail.description}</p>
                )}

                {/* Price + Cart action */}
                <div className='flex items-center justify-between'>
                  <span className='text-2xl font-extrabold text-slate-800'>
                    {formatVnd(detail.price)}
                  </span>

                  {qty === 0 ? (
                    <button
                      onClick={() =>
                        onAddItem({
                          menuItemId: detail.id,
                          name: detail.name,
                          price: detail.price,
                          image: activeImg,
                        })
                      }
                      className='flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-3 rounded-xl active:scale-95 transition-all shadow-md shadow-indigo-100'
                    >
                      <ShoppingCart className='w-4 h-4' />
                      Thêm vào giỏ
                    </button>
                  ) : (
                    <div className='flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1'>
                      <button
                        onClick={() =>
                          onAddItem({
                            menuItemId: detail.id,
                            name: detail.name,
                            price: detail.price,
                            image: activeImg,
                          })
                        }
                        className='w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 active:scale-90 transition-all'
                      >
                        <Plus className='w-4 h-4' />
                      </button>
                      <span className='text-base font-extrabold text-slate-800 w-6 text-center'>{qty}</span>
                      <button
                        onClick={() => onUpdateQty(detail.id, qty - 1)}
                        className='w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100 active:scale-90 transition-all'
                      >
                        <Minus className='w-4 h-4' />
                      </button>
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
