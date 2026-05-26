'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { useAppContext } from '@/app/app-provider';
import categoryApiRequest from '@/apiRequests/category';
import Spinner from '@/components/restaurant/spinner';
import LoadMoreButton from '@/components/restaurant/load-more-button';
import type { CategoryItemType } from '@/schemaValidations/menu.schema';
import CategoryModal from './category-modal';
import ConfirmDeleteModal from './confirm-delete-modal';

export default function AdminCategories() {
  const { t } = useAppContext();
  const [categories, setCategories] = useState<CategoryItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | number | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [editTarget, setEditTarget] = useState<CategoryItemType | null | 'new'>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<CategoryItemType | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    setNextCursor(null);
    setHasNextPage(false);
    try {
      const res = await categoryApiRequest.list();
      const data = res.payload.data;
      const payload = data as any;
      const raw = Array.isArray(data) ? data : (payload?.data ?? []);
      setCategories(raw as CategoryItemType[]);
      setHasNextPage(payload?.hasNextPage ?? false);
      setNextCursor(payload?.hasNextPage ? payload?.nextCursor : null);
    } catch {
      // keep empty
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await categoryApiRequest.list({ cursor: nextCursor });
      const payload = res.payload.data as any;
      const raw = Array.isArray(payload) ? payload : (payload?.data ?? []);
      setCategories((prev) => [...prev, ...(raw as CategoryItemType[])]);
      setHasNextPage(payload?.hasNextPage ?? false);
      setNextCursor(payload?.hasNextPage ? payload?.nextCursor : null);
    } catch {
      // keep existing
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (name: string) => {
    if (editTarget === 'new') {
      const res = await categoryApiRequest.create({ name });
      const created = res.payload.data as CategoryItemType;
      setCategories((prev) => [created, ...prev]);
    } else if (editTarget) {
      await categoryApiRequest.update(editTarget.id, { name });
      setCategories((prev) =>
        prev.map((c) => (c.id === editTarget.id ? { ...c, name } : c)),
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await categoryApiRequest.delete(deleteTarget.id);
    setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
  };

  const handleImgUpdated = (imgUrl: string | null) => {
    if (!editTarget || editTarget === 'new') return;
    const id = (editTarget as CategoryItemType).id;
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, img: imgUrl ?? null } : c)),
    );
  };

  return (
    <div className='px-6 py-8 max-w-3xl mt-10 mx-auto w-full'>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <div className='w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center'>
            <Tag className='w-5 h-5 text-indigo-600' />
          </div>
          <div>
            <h1 className='text-xl font-extrabold'>{t.adminCategories}</h1>
            <p className='text-xs'>
              {categories.length} {t.items}
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

      {loading ? (
        <div className='flex justify-center py-20'>
          <Spinner size='lg' />
        </div>
      ) : categories.length === 0 ? (
        <div className='text-center py-20 text-sm'>{t.noData}</div>
      ) : (
        <div className='space-y-2'>
          {categories.map((cat) => (
            <div
              key={cat.id}
              className='border border-border rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm'
            >
              <div className='w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 overflow-hidden'>
                <div className='relative w-full h-[60px] rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 overflow-hidden'>
                  {cat.img ? (
                    <Image
                      src={`${process.env.NEXT_PUBLIC_API_ENDPOINT}/${cat.img}`}
                      alt={cat.name}
                      fill
                      unoptimized
                      sizes='60px'
                      className='object-cover group-hover:scale-105 transition-transform duration-700'
                    />
                  ) : (
                    <Tag className='w-4 h-4 text-indigo-500' />
                  )}
                </div>
              </div>
              <span className='flex-1 text-sm font-semibold'>{cat.name}</span>
              <span className='text-xs font-mono'>#{cat.id}</span>
              <div className='flex items-center gap-1.5'>
                <button
                  onClick={() => setEditTarget(cat)}
                  className='w-8 h-8 rounded-lg flex items-center justify-center hover:text-indigo-600 hover:bg-indigo-50 transition-colors'
                >
                  <Pencil className='w-4 h-4' />
                </button>
                <button
                  onClick={() => setDeleteTarget(cat)}
                  className='w-8 h-8 rounded-lg flex items-center justify-center hover:text-red-600 hover:bg-red-50 transition-colors'
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
        <CategoryModal
          initial={editTarget === 'new' ? undefined : editTarget}
          onSave={handleSave}
          onClose={() => setEditTarget(null)}
          onImgUpdated={handleImgUpdated}
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
