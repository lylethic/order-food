'use client';

import { useState, useEffect } from 'react';
import { X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppContext } from '@/app/app-provider';
import menuItemApiRequest from '@/apiRequests/menu-item';
import Spinner from '@/components/restaurant/spinner';
import ImageManager from './image-manager';
import type {
  MenuItemType,
  MenuItemDetailType,
  CategoryItemType,
} from '@/schemaValidations/menu.schema';

interface SaveData {
  category_id: number;
  name: string;
  description: string;
  price: number;
  tag: string;
}

interface Props {
  initial?: MenuItemType;
  categories: CategoryItemType[];
  onSave: (data: SaveData) => Promise<void>;
  onClose: () => void;
  onDetailChange?: (updated: MenuItemDetailType) => void;
}

export default function MenuItemModal({
  initial,
  categories,
  onSave,
  onClose,
  onDetailChange,
}: Props) {
  const { t } = useAppContext();

  // Khởi tạo state: Đảm bảo lấy đúng categoryId từ props initial
  // Lưu ý: Kiểm tra xem API của bạn trả về categoryId hay category_id
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    price: initial?.price ?? 0,
    category_id:
      initial?.categoryId ??
      (typeof initial?.category === 'object' && initial?.category !== null
        ? initial.category.id
        : (initial?.category as string | undefined)) ??
      '',
    tag: initial?.tag ?? '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<MenuItemDetailType | null>(null);
  const [showImages, setShowImages] = useState(false);

  useEffect(() => {
    if (initial?.id) {
      menuItemApiRequest
        .getById(initial.id)
        .then((res) => {
          setDetail(res.payload.data as MenuItemDetailType);
        })
        .catch(() => {});
    }
  }, [initial?.id]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category_id) return;

    setSaving(true);
    setError('');
    try {
      await onSave({
        category_id: Number(form.category_id),
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        tag: form.tag.trim(),
      });
      onClose();
    } catch (err) {
      setError((err as Error).message || t.errorOccurred);
    } finally {
      setSaving(false);
    }
  };

  const handleDetailChange = (updated: MenuItemDetailType) => {
    setDetail(updated);
    onDetailChange?.(updated);
  };

  return (
    <div
      className='fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4'
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className='w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden bg-white'
      >
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-border shrink-0'>
          <h2 className='text-base font-extrabold text-foreground'>
            {initial ? t.edit : t.addNew}
          </h2>
          <button
            onClick={onClose}
            className='text-muted-foreground hover:text-foreground'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Body */}
        <div className='flex-1 overflow-y-auto px-6 py-5'>
          <form
            id='menu-item-form'
            onSubmit={handleSubmit}
            className='space-y-4'
          >
            {/* Name */}
            <div>
              <label className='block text-xs font-bold text-muted-foreground mb-1.5'>
                {t.name} *
              </label>
              <input
                autoFocus
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className='w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
              />
            </div>

            {/* Description */}
            <div>
              <label className='block text-xs font-bold text-muted-foreground mb-1.5'>
                {t.description}
              </label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                className='w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none'
              />
            </div>

            <div className='grid grid-cols-2 gap-3'>
              {/* Price */}
              <div>
                <label className='block text-xs font-bold text-muted-foreground mb-1.5'>
                  {t.price} (VND) *
                </label>
                <input
                  type='number'
                  min={0}
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: Number(e.target.value) }))
                  }
                  className='w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
                />
              </div>

              {/* Category Select */}
              <div>
                <label className='block text-xs font-bold text-muted-foreground mb-1.5'>
                  {t.category} *
                </label>
                <select
                  value={form.category_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category_id: e.target.value }))
                  }
                  className='w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
                >
                  <option value='' disabled hidden>
                    -----
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tag */}
            <div>
              <label className='block text-xs font-bold text-muted-foreground mb-1.5'>
                {t.tag}
              </label>
              <input
                value={form.tag}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tag: e.target.value }))
                }
                placeholder='e.g. Chef Special'
                className='w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
              />
            </div>

            {error && <p className='text-xs text-red-500'>{error}</p>}
          </form>

          {/* Image Manager Section */}
          {initial && (
            <div className='mt-5 pt-4 border-t border-border'>
              <button
                type='button'
                onClick={() => setShowImages((v) => !v)}
                className='flex items-center gap-2 text-sm font-bold text-foreground mb-3'
              >
                {showImages ? (
                  <ChevronUp className='w-4 h-4' />
                ) : (
                  <ChevronDown className='w-4 h-4' />
                )}
                {t.images}
                {detail && (
                  <span className='ml-1 text-xs text-muted-foreground font-normal'>
                    ({detail.images.length})
                  </span>
                )}
              </button>
              {showImages && detail && (
                <ImageManager
                  itemId={initial.id}
                  images={detail.images}
                  onChange={handleDetailChange}
                />
              )}
              {showImages && !detail && <Spinner size='sm' />}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className='px-6 pb-6 pt-4 border-t border-border shrink-0 flex gap-2'>
          <button
            type='button'
            onClick={onClose}
            className='flex-1 border border-border text-muted-foreground text-sm font-semibold py-2.5 rounded-xl hover:bg-accent transition-colors'
          >
            {t.cancel}
          </button>
          <button
            type='submit'
            form='menu-item-form'
            disabled={saving}
            className='flex-1 bg-indigo-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-indigo-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2'
          >
            {saving ? <Spinner size='sm' /> : <Check className='w-4 h-4' />}
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
