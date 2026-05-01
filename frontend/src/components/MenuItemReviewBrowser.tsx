import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { RefreshCw, Star, MessageCircle, ImageOff, Search } from 'lucide-react';
import { api } from '../services/api';
import { Spinner } from './Spinner';
import { MenuItemReviewsModal } from './MenuItemReviewsModal';
import type { Category, MenuItem } from '../types';
import { formatVnd } from '../utils/money';

interface Props {
  title: string;
  subtitle?: string;
  canReply?: boolean;
  canToggleVisibility?: boolean;
  commentScope?: 'all' | 'visible';
}

function EmptyState() {
  return (
    <div className='flex flex-col items-center justify-center py-20 gap-3 text-center border border-slate-100 rounded-3xl bg-white'>
      <Search className='w-14 h-14 text-slate-200' />
      <p className='text-lg font-extrabold text-slate-600'>Khong co mon an</p>
      <p className='text-slate-400 text-sm'>
        Không tìm thấy món ăn phù hợp với danh mục hiện tại
      </p>
    </div>
  );
}

export function MenuItemReviewBrowser({
  title,
  subtitle,
  canReply = false,
  canToggleVisibility = false,
  commentScope = 'all',
}: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [categoryData, itemData] = await Promise.all([
        api.getCategories(),
        api.getMenuItems(activeCategory || undefined),
      ]);
      setCategories(categoryData);
      setItems(itemData);
    } catch {
      setCategories([]);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    load();
  }, [load]);

  const categoryOptions = useMemo(
    () => [{ id: '', name: 'Tất cả' }, ...categories],
    [categories],
  );

  const selectedCategoryName =
    categoryOptions.find((category) => category.id === activeCategory)?.name ??
    'Tất cả';

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between gap-4 flex-wrap'>
        <div>
          <h2 className='text-2xl font-extrabold text-slate-800 flex items-center gap-2'>
            <MessageCircle className='w-6 h-6 text-indigo-500' />
            {title}
          </h2>
          <p className='text-slate-400 font-medium text-sm mt-0.5'>
            {subtitle ??
              'Duyệt danh sách món ăn và duyệt từng món để xem đánh giá'}
          </p>
        </div>

        <button
          onClick={load}
          className='flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-sm transition-all'
        >
          <RefreshCw className='w-4 h-4' />
          Refresh
        </button>
      </div>

      <div className='overflow-x-auto scrollbar-hide flex gap-2 -mx-1 px-1'>
        {categoryOptions.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
              activeCategory === category.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className='flex items-center justify-between gap-3 flex-wrap'>
        <p className='text-sm font-semibold text-slate-400'>
          {loading
            ? 'Loading...'
            : `${items.length} mon an · ${selectedCategoryName}`}
        </p>
        <p className='text-xs font-semibold text-slate-400'>
          {canToggleVisibility
            ? 'Admin có thể ẩn/hiện đánh giá'
            : 'Nhân viên có thể phản hồi đánh giá'}
        </p>
      </div>

      {loading ? (
        <div className='flex justify-center py-20'>
          <Spinner size='lg' />
        </div>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'>
          <AnimatePresence>
            {items.map((item) => {
              const rating =
                item.rating != null ? item.rating.toFixed(1) : '--';
              const commentCount = item.commentCount ?? 0;

              return (
                <motion.article
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className='bg-white rounded-[28px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-card transition-all group'
                >
                  <button
                    type='button'
                    onClick={() => setSelectedItem(item)}
                    className='block w-full text-left'
                  >
                    <div className='aspect-4/3 overflow-hidden m-3 rounded-[20px] bg-slate-100 relative'>
                      {item.image ? (
                        <img
                          src={`/${item.image}`}
                          alt={item.name}
                          className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-700'
                        />
                      ) : (
                        <div className='w-full h-full flex items-center justify-center text-slate-300'>
                          <ImageOff className='w-8 h-8' />
                        </div>
                      )}

                      <div className='absolute top-3 left-3 flex gap-2 flex-wrap'>
                        {item.category && (
                          <span className='text-[11px] font-bold text-indigo-700 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full shadow-sm'>
                            {item.category}
                          </span>
                        )}
                        {commentCount > 0 && (
                          <span className='text-[11px] font-bold text-slate-700 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1'>
                            <MessageCircle className='w-3 h-3' />
                            {commentCount}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className='px-6 pb-6 pt-2 flex flex-col gap-3'>
                      <div className='space-y-1'>
                        <h3 className='text-base font-extrabold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors'>
                          {item.name}
                        </h3>
                        <p className='text-slate-400 text-sm line-clamp-2 leading-relaxed'>
                          {item.description}
                        </p>
                      </div>

                      <div className='flex items-center justify-between gap-3'>
                        <div className='flex items-center gap-2'>
                          <div className='flex items-center gap-1 text-amber-400'>
                            <Star className='w-4 h-4 fill-amber-400' />
                            <span className='text-sm font-extrabold text-slate-700'>
                              {rating}
                            </span>
                          </div>
                          <span className='text-xs text-slate-400'>
                            {commentCount} danh gia
                          </span>
                        </div>

                        <span className='text-sm font-extrabold text-slate-800'>
                          {formatVnd(item.price)}
                        </span>
                      </div>

                      <div className='pt-1'>
                        <span className='inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 border border-slate-100'>
                          Xem danh gia
                        </span>
                      </div>
                    </div>
                  </button>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {selectedItem && (
        <MenuItemReviewsModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          canReply={canReply}
          canToggleVisibility={canToggleVisibility}
          commentScope={commentScope}
        />
      )}
    </div>
  );
}
