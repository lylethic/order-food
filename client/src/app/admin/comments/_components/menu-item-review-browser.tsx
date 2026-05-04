'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Star, MessageCircle, ImageOff, Search } from 'lucide-react';
import categoryApiRequest from '@/apiRequests/category';
import menuItemApiRequest from '@/apiRequests/menu-item';
import Spinner from '@/components/restaurant/spinner';
import MenuItemReviewsModal from './menu-item-reviews-modal';
import { formatVnd } from '@/lib/money';
import type {
  CategoryItemType,
  MenuItemType,
} from '@/schemaValidations/menu.schema';

interface Props {
  title: string;
  subtitle?: string;
  canReply?: boolean;
  canToggleVisibility?: boolean;
  commentScope?: 'all' | 'visible';
}

export default function MenuItemReviewBrowser({
  title,
  subtitle,
  canReply = false,
  canToggleVisibility = false,
  commentScope = 'all',
}: Props) {
  const [categories, setCategories] = useState<CategoryItemType[]>([]);
  const [items, setItems] = useState<MenuItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItemType | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, itemRes] = await Promise.all([
        categoryApiRequest.list(),
        menuItemApiRequest.list(
          activeCategory ? { categoryId: activeCategory } : undefined,
        ),
      ]);
      const catData = catRes.payload.data;
      const itemData = itemRes.payload.data;
      setCategories(
        Array.isArray(catData) ? catData : ((catData as any)?.data ?? []),
      );
      setItems(
        Array.isArray(itemData) ? itemData : ((itemData as any)?.data ?? []),
      );
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
    () => [{ id: '', name: 'Tất cả' } as CategoryItemType, ...categories],
    [categories],
  );

  const selectedCategoryName =
    categoryOptions.find((c) => c.id === activeCategory)?.name ?? 'Tất cả';

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between gap-4 flex-wrap'>
        <div>
          <h2 className='text-2xl font-extrabold flex items-center gap-2'>
            <MessageCircle className='w-6 h-6 text-indigo-500' />
            {title}
          </h2>
          <p className='font-medium text-sm mt-0.5'>
            {subtitle ??
              'Duyệt danh sách món ăn và duyệt từng món để xem đánh giá'}
          </p>
        </div>
        <button
          onClick={load}
          className='flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border hover:bg-accent font-semibold text-sm transition-all'
        >
          <RefreshCw className='w-4 h-4' />
          Refresh
        </button>
      </div>

      <div className='overflow-x-auto flex gap-2 -mx-1 px-1'>
        {categoryOptions.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
              activeCategory === cat.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                : 'border border-border hover:bg-accent'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className='flex items-center justify-between gap-3 flex-wrap'>
        <p className='text-sm font-semibold'>
          {loading
            ? 'Loading...'
            : `${items.length} món ăn · ${selectedCategoryName}`}
        </p>
        <p className='text-xs font-semibold'>
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
        <div className='flex flex-col items-center justify-center py-20 gap-3 text-center border border-border rounded-3xl'>
          <Search className='w-14 h-14' />
          <p className='text-lg font-extrabol'>Không có món ăn</p>
          <p className='text-sm'>
            Không tìm thấy món ăn phù hợp với danh mục hiện tại
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'>
          {items.map((item) => {
            const rating = item.rating != null ? item.rating.toFixed(1) : '--';
            const commentCount = item.commentCount ?? 0;
            return (
              <article
                key={item.id}
                className='rounded-[28px] overflow-hidden border border-border shadow-sm hover:shadow-md transition-all group'
              >
                <button
                  type='button'
                  onClick={() => setSelectedItem(item)}
                  className='block w-full text-left'
                >
                  <div className='aspect-[4/3] overflow-hidden m-3 rounded-[20px] bg-muted relative'>
                    {item.image ? (
                      <img
                        src={`/${item.image}`}
                        alt={item.name}
                        className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-700'
                      />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center'>
                        <ImageOff className='w-8 h-8' />
                      </div>
                    )}
                    <div className='absolute top-3 left-3 flex gap-2 flex-wrap'>
                      {item.category && (
                        <span className='text-[11px] font-bold text-indigo-700 backdrop-blur px-2.5 py-1 rounded-full shadow-sm'>
                          {item.category}
                        </span>
                      )}
                      {commentCount > 0 && (
                        <span className='text-[11px] font-bold backdrop-blur px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1'>
                          <MessageCircle className='w-3 h-3' />
                          {commentCount}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className='px-6 pb-6 pt-2 flex flex-col gap-3'>
                    <div className='space-y-1'>
                      <h3 className='text-base font-extrabold line-clamp-1 group-hover:text-indigo-600 transition-colors'>
                        {item.name}
                      </h3>
                      <p className='text-sm line-clamp-2 leading-relaxed'>
                        {item.description}
                      </p>
                    </div>
                    <div className='flex items-center justify-between gap-3'>
                      <div className='flex items-center gap-2'>
                        <div className='flex items-center gap-1 text-amber-400'>
                          <Star className='w-4 h-4 fill-amber-400' />
                          <span className='text-sm font-extrabold'>
                            {rating}
                          </span>
                        </div>
                        <span className='text-xs'>{commentCount} đánh giá</span>
                      </div>
                      <span className='text-sm font-extrabold'>
                        {formatVnd(item.price)}
                      </span>
                    </div>
                    <div className='pt-1'>
                      <span className='inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold border border-border'>
                        Xem đánh giá
                      </span>
                    </div>
                  </div>
                </button>
              </article>
            );
          })}
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
