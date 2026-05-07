'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, UtensilsCrossed, ImageOff } from 'lucide-react';
import { useAppContext } from '@/app/app-provider';
import categoryApiRequest from '@/apiRequests/category';
import menuItemApiRequest from '@/apiRequests/menu-item';
import Spinner from '@/components/restaurant/spinner';
import LoadMoreButton from '@/components/restaurant/load-more-button';
import MenuItemModal from './menu-item-modal';
import ConfirmDeleteModal from './confirm-delete-modal';
import { formatVnd } from '@/lib/money';
import type {
  MenuItemType,
  MenuItemDetailType,
  CategoryItemType,
} from '@/schemaValidations/menu.schema';
import Image from 'next/image';
import { keyframes } from 'motion/react';

export default function AdminMenuItemsList() {
  const { t } = useAppContext();

  const [items, setItems] = useState<MenuItemType[]>([]);
  const [categories, setCategories] = useState<CategoryItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | number | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('');

  const [editTarget, setEditTarget] = useState<MenuItemType | null | 'new'>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<MenuItemType | null>(null);

  const allCats: CategoryItemType[] = [
    { id: '', name: t.allCategories } as CategoryItemType,
    ...categories,
  ];

  const fetchCategories = useCallback(async () => {
    try {
      const catRes = await categoryApiRequest.list();
      const catData = catRes.payload.data;

      setCategories(
        Array.isArray(catData) ? catData : ((catData as any)?.data ?? []),
      );
    } catch (error) {
      console.error('Fetch categories error:', error);
    }
  }, []);

  const buildParams = useCallback(
    (cursor?: string | number | null) => {
      const params: Parameters<typeof menuItemApiRequest.list>[0] = {
        limit: 10,
        order: 'desc',
      };
      if (search.trim()) params.search = `name=${search.trim()}`;
      if (activeCat) params.categoryId = activeCat;
      if (cursor) params.cursor = cursor;
      return params;
    },
    [search, activeCat],
  );

  const fetchMenuItems = useCallback(async () => {
    setLoading(true);
    setNextCursor(null);
    setHasNextPage(false);
    try {
      const res = await menuItemApiRequest.list(buildParams());
      const payload = res.payload.data as any;
      const list = Array.isArray(payload) ? payload : (payload?.data ?? []);
      setItems(list);
      setHasNextPage(payload?.hasNextPage ?? false);
      setNextCursor(payload?.hasNextPage ? payload?.nextCursor : null);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await menuItemApiRequest.list(buildParams(nextCursor));
      const payload = res.payload.data as any;
      const list = Array.isArray(payload) ? payload : (payload?.data ?? []);
      setItems((prev) => [...prev, ...list]);
      setHasNextPage(payload?.hasNextPage ?? false);
      setNextCursor(payload?.hasNextPage ? payload?.nextCursor : null);
    } catch {
      // keep existing items
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore, buildParams]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  const handleSave = async (data: {
    category_id: number;
    name: string;
    description: string;
    price: number;
    tag: string;
  }) => {
    if (editTarget === 'new') {
      const res = await menuItemApiRequest.create(data);
      const created = res.payload.data as MenuItemType;

      setItems((prev) => [created, ...prev]);
    } else if (editTarget) {
      const res = await menuItemApiRequest.update(editTarget.id, data);
      const updated = res.payload.data as MenuItemType;

      setItems((prev) =>
        prev.map((i) => (i.id === editTarget.id ? updated : i)),
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    await menuItemApiRequest.delete(deleteTarget.id);

    setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const handleDetailChange = (updated: MenuItemDetailType) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === updated.id ? { ...i, image: updated.image } : i,
      ),
    );
  };

  return (
    <div className='px-6 py-8 max-w-5xl mt-10 mx-auto w-full'>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <div className='w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center'>
            <UtensilsCrossed className='w-5 h-5 text-amber-600' />
          </div>

          <div>
            <h1 className='text-xl font-extrabold text-foreground'>
              {t.adminMenuItems}
            </h1>

            <p className='text-xs text-muted-foreground'>
              {items.length} {t.items}
              {hasNextPage && '+'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setEditTarget('new')}
          className='flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl active:scale-95 transition-all shadow-md shadow-indigo-100'
        >
          <Plus className='w-4 h-4' />
          {t.addNew}
        </button>
      </div>

      <div className='mb-5'>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`${t.search}…`}
          className='w-full sm:max-w-xs border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
        />
      </div>

      <div className='overflow-x-auto flex gap-2 mb-8 -mx-1 px-1'>
        {allCats.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCat(String(cat.id))}
            className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
              activeCat === String(cat.id)
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                : 'border border-border text-muted-foreground hover:bg-accent'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className='flex justify-center py-20'>
          <Spinner size='lg' />
        </div>
      ) : items.length === 0 ? (
        <div className='text-center py-20 text-muted-foreground text-sm'>
          {t.noData}
        </div>
      ) : (
        <div className='space-y-2'>
          {items.map((item) => (
            <div
              key={item.id}
              className='border border-border rounded-2xl px-4 py-3 flex items-center gap-4 shadow-sm'
            >
              <div className='w-14 h-14 rounded-xl overflow-hidden bg-muted shrink-0'>
                <div className='relative w-full h-[60px] rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 overflow-hidden'>
                  {item.image ? (
                    <Image
                      src={`${process.env.NEXT_PUBLIC_API_ENDPOINT}/${item.image}`}
                      alt={item.name || 'Menu'}
                      fill
                      unoptimized
                      sizes='60px'
                      className='object-cover group-hover:scale-105 transition-transform duration-700'
                    />
                  ) : (
                    <div className='w-full h-full flex items-center justify-center text-muted-foreground'>
                      <ImageOff className='w-5 h-5' />
                    </div>
                  )}
                </div>
              </div>

              <div className='flex-1 min-w-0'>
                <p className='text-sm font-bold text-foreground truncate'>
                  {item.name}
                </p>

                {/* <p className='text-xs text-muted-foreground truncate'>
                  {item.category.name}
                </p> */}
              </div>

              <span className='text-sm font-extrabold text-foreground shrink-0 hidden sm:block'>
                {formatVnd(item.price)}
              </span>

              <div className='flex items-center gap-1.5 shrink-0'>
                <button
                  onClick={() => setEditTarget(item)}
                  className='w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 transition-colors'
                >
                  <Pencil className='w-4 h-4' />
                </button>

                <button
                  onClick={() => setDeleteTarget(item)}
                  className='w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors'
                >
                  <Trash2 className='w-4 h-4' />
                </button>
              </div>
            </div>
          ))}

          {hasNextPage && (
            <LoadMoreButton onClick={loadMore} loading={loadingMore} />
          )}
        </div>
      )}

      {editTarget !== null && (
        <MenuItemModal
          initial={editTarget === 'new' ? undefined : editTarget}
          categories={categories}
          onSave={handleSave}
          onClose={() => setEditTarget(null)}
          onDetailChange={handleDetailChange}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
