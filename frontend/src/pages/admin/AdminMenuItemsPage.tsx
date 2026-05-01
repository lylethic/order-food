import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  UtensilsCrossed,
  ImageOff,
  Upload,
  Star,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useLang } from '../../context/LangContext';
import { api } from '../../services/api';
import { Spinner } from '../../components/Spinner';
import { formatVnd } from '../../utils/money';
import type {
  MenuItem,
  MenuItemDetail,
  MenuItemImage,
  Category,
} from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ConfirmDeleteModal({
  name,
  onConfirm,
  onClose,
}: {
  name: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const { t } = useLang();
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className='bg-white rounded-2xl shadow-xl w-full max-w-sm p-6'
      >
        <div className='flex items-center gap-3 mb-4'>
          <div className='w-10 h-10 rounded-full bg-red-100 flex items-center justify-center'>
            <Trash2 className='w-5 h-5 text-red-600' />
          </div>
          <div>
            <p className='text-sm font-extrabold text-slate-800'>
              {t.delete} "{name}"?
            </p>
            <p className='text-xs text-slate-400 mt-0.5'>{t.confirmDelete}</p>
          </div>
        </div>
        <div className='flex gap-2'>
          <button
            onClick={onClose}
            className='flex-1 border border-slate-200 text-slate-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition-colors'
          >
            {t.cancel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className='flex-1 bg-red-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-red-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2'
          >
            {deleting ? <Spinner size='sm' /> : <Trash2 className='w-4 h-4' />}
            {t.delete}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Image manager ────────────────────────────────────────────────────────────

function ImageManager({
  itemId,
  images,
  onChange,
}: {
  itemId: string;
  images: MenuItemImage[];
  onChange: (updated: MenuItemDetail) => void;
}) {
  const { t } = useLang();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const updated = await api.adminUploadMenuItemImages(
        itemId,
        Array.from(files),
        0,
      );
      onChange(updated);
    } catch {
      /* ignore */
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    setDeletingId(imageId);
    try {
      const updated = await api.adminDeleteMenuItemImage(itemId, imageId);
      onChange(updated);
    } catch {
      /* ignore */
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className='flex items-center justify-between mb-2'>
        <p className='text-xs font-bold text-slate-500'>{t.images}</p>
        <button
          type='button'
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className='flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-500 disabled:opacity-50'
        >
          {uploading ? (
            <Spinner size='sm' />
          ) : (
            <Upload className='w-3.5 h-3.5' />
          )}
          {t.uploadImages}
        </button>
        <input
          ref={fileRef}
          type='file'
          accept='image/*'
          multiple
          className='hidden'
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>
      {images.length === 0 ? (
        <div className='border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center gap-2 text-slate-300'>
          <ImageOff className='w-8 h-8' />
          <p className='text-xs'>Chưa có ảnh</p>
        </div>
      ) : (
        <div className='flex gap-2 flex-wrap'>
          {images.map((img) => (
            <div key={img.id} className='relative group'>
              <img
                src={`/${img.image_url}`}
                alt=''
                className={`w-20 h-20 object-cover rounded-xl border-2 ${img.is_primary ? 'border-indigo-500' : 'border-transparent'}`}
              />
              {img.is_primary && (
                <span className='absolute top-1 left-1 bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5'>
                  <Star className='w-2.5 h-2.5 fill-white' />
                </span>
              )}
              <button
                type='button'
                onClick={() => handleDelete(img.id)}
                disabled={deletingId === img.id}
                className='absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50'
              >
                {deletingId === img.id ? (
                  <Spinner size='sm' />
                ) : (
                  <X className='w-3 h-3' />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Form modal ───────────────────────────────────────────────────────────────

function MenuItemModal({
  initial,
  categories,
  onSave,
  onClose,
  onDetailChange,
}: {
  initial?: MenuItem;
  categories: Category[];
  onSave: (data: {
    category_id: number;
    name: string;
    description: string;
    price: number;
    tag: string;
  }) => Promise<void>;
  onClose: () => void;
  onDetailChange?: (updated: MenuItemDetail) => void;
}) {
  const { t } = useLang();
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    price: initial?.price ?? 0,
    category_id: initial?.categoryId ?? categories[0]?.id ?? '',
    tag: initial?.tag ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<MenuItemDetail | null>(null);
  const [showImages, setShowImages] = useState(false);

  // Fetch detail (for images) when editing
  useEffect(() => {
    if (initial?.id) {
      api
        .getMenuItemDetail(initial.id)
        .then(setDetail)
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

  const handleDetailChange = (updated: MenuItemDetail) => {
    setDetail(updated);
    onDetailChange?.(updated);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4'
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        onClick={(e) => e.stopPropagation()}
        className='bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden'
      >
        <div className='flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0'>
          <h2 className='text-base font-extrabold text-slate-800'>
            {initial ? t.edit : t.addNew} {t.adminMenuItems.slice(0, -1)}
          </h2>
          <button
            onClick={onClose}
            className='text-slate-400 hover:text-slate-600'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <div className='flex-1 overflow-y-auto px-6 py-5'>
          <form
            id='menu-item-form'
            onSubmit={handleSubmit}
            className='space-y-4'
          >
            {/* Name */}
            <div>
              <label className='block text-xs font-bold text-slate-500 mb-1.5'>
                {t.name} *
              </label>
              <input
                autoFocus
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
              />
            </div>

            {/* Description */}
            <div>
              <label className='block text-xs font-bold text-slate-500 mb-1.5'>
                {t.description}
              </label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none'
              />
            </div>

            {/* Price + Category */}
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='block text-xs font-bold text-slate-500 mb-1.5'>
                  {t.price} (VND) *
                </label>
                <input
                  type='number'
                  min={0}
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: Number(e.target.value) }))
                  }
                  className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
                />
              </div>
              <div>
                <label className='block text-xs font-bold text-slate-500 mb-1.5'>
                  {t.category} *
                </label>
                <select
                  value={form.category_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category_id: e.target.value }))
                  }
                  className='w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'
                >
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
              <label className='block text-xs font-bold text-slate-500 mb-1.5'>
                {t.tag}
              </label>
              <input
                value={form.tag}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tag: e.target.value }))
                }
                placeholder='e.g. Chef Special'
                className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
              />
            </div>

            {error && <p className='text-xs text-red-500'>{error}</p>}
          </form>

          {/* Images section — only when editing */}
          {initial && (
            <div className='mt-5 pt-4 border-t border-slate-100'>
              <button
                type='button'
                onClick={() => setShowImages((v) => !v)}
                className='flex items-center gap-2 text-sm font-bold text-slate-700 mb-3'
              >
                {showImages ? (
                  <ChevronUp className='w-4 h-4' />
                ) : (
                  <ChevronDown className='w-4 h-4' />
                )}
                {t.images}
                {detail && (
                  <span className='ml-1 text-xs text-slate-400 font-normal'>
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

        <div className='px-6 pb-6 pt-4 border-t border-slate-100 shrink-0 flex gap-2'>
          <button
            type='button'
            onClick={onClose}
            className='flex-1 border border-slate-200 text-slate-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition-colors'
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
      </motion.div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminMenuItemsPage() {
  const { t } = useLang();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState<MenuItem | null | 'new'>(null);
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);

  const [activeCat, setActiveCat] = useState<string>('');
  const allCats: Category[] = [
    { id: '', name: t.allCategories },
    ...categories,
  ];

  useEffect(() => {
    Promise.all([api.getMenuItems(), api.getCategories()])
      .then(([menuItems, cats]) => {
        setItems(menuItems);
        setCategories(cats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = items
    .filter((i) => !activeCat || i.categoryId === activeCat)
    .filter((i) => !search.trim() || i.name.toLowerCase().includes(search.toLowerCase()));

  const handleSave = async (data: {
    category_id: number;
    name: string;
    description: string;
    price: number;
    tag: string;
  }) => {
    if (editTarget === 'new') {
      const created = await api.adminCreateMenuItem(data);
      setItems((prev) => [created, ...prev]);
    } else if (editTarget) {
      const updated = await api.adminUpdateMenuItem(editTarget.id, data);
      setItems((prev) =>
        prev.map((i) => (i.id === editTarget.id ? updated : i)),
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await api.adminDeleteMenuItem(deleteTarget.id);
    setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
  };

  const handleDetailChange = (updated: { id: string; image?: string }) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === updated.id ? { ...i, image: updated.image } : i,
      ),
    );
  };

  return (
    <div className='px-6 py-8 max-w-5xl mt-10 mx-auto w-full'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <div className='w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center'>
            <UtensilsCrossed className='w-5 h-5 text-amber-600' />
          </div>
          <div>
            <h1 className='text-xl font-extrabold text-slate-800'>
              {t.adminMenuItems}
            </h1>
            <p className='text-xs text-slate-400'>
              {filtered.length} {t.items}
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

      {/* Search */}
      <div className='mb-5'>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`${t.search}…`}
          className='w-full sm:max-w-xs border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
        />
      </div>

      {/* Category filter */}
      <div className='overflow-x-auto scrollbar-hide flex gap-2 mb-8 -mx-1 px-1'>
        {allCats.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCat(cat.id)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
              activeCat === cat.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className='flex justify-center py-20'>
          <Spinner size='lg' />
        </div>
      ) : filtered.length === 0 ? (
        <div className='text-center py-20 text-slate-400 text-sm'>
          {t.noData}
        </div>
      ) : (
        <div className='space-y-2'>
          <AnimatePresence initial={false}>
            {filtered.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className='bg-white border border-slate-100 rounded-2xl px-4 py-3 flex items-center gap-4 shadow-sm'
              >
                {/* Image */}
                <div className='w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0'>
                  {item.image ? (
                    <img
                      src={`/${item.image}`}
                      alt={item.name}
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <div className='w-full h-full flex items-center justify-center text-slate-300'>
                      <ImageOff className='w-5 h-5' />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-bold text-slate-800 truncate'>
                    {item.name}
                  </p>
                  <p className='text-xs text-slate-400 truncate'>
                    {item.category}
                  </p>
                </div>

                {/* Price */}
                <span className='text-sm font-extrabold text-slate-700 shrink-0 hidden sm:block'>
                  {formatVnd(item.price)}
                </span>

                {/* Actions */}
                <div className='flex items-center gap-1.5 shrink-0'>
                  <button
                    onClick={() => setEditTarget(item)}
                    className='w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors'
                  >
                    <Pencil className='w-4 h-4' />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className='w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors'
                  >
                    <Trash2 className='w-4 h-4' />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {editTarget !== null && (
          <MenuItemModal
            key='edit-modal'
            initial={editTarget === 'new' ? undefined : editTarget}
            categories={categories}
            onSave={handleSave}
            onClose={() => setEditTarget(null)}
            onDetailChange={handleDetailChange}
          />
        )}
        {deleteTarget && (
          <ConfirmDeleteModal
            key='delete-modal'
            name={deleteTarget.name}
            onConfirm={handleDelete}
            onClose={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
