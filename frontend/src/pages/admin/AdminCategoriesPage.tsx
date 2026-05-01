import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Pencil, Trash2, X, Check, Tag, Upload, ImageOff } from 'lucide-react';
import { useLang } from '../../context/LangContext';
import { api } from '../../services/api';
import { Spinner } from '../../components/Spinner';
import type { Category } from '../../types';

// ─── Modal ────────────────────────────────────────────────────────────────────

function CategoryModal({
  initial,
  onSave,
  onClose,
  onImgUpdated,
}: {
  initial?: Category;
  onSave: (name: string) => Promise<void>;
  onClose: () => void;
  onImgUpdated?: (imgUrl: string | null) => void;
}) {
  const { t } = useLang();
  const [name, setName] = useState(initial?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const imgInputRef = useRef<HTMLInputElement>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(
    initial?.img ? `/${initial.img}` : null,
  );
  const [uploadingImg, setUploadingImg] = useState(false);

  const handleImgChange = async (files: FileList | null) => {
    if (!files?.[0] || !initial) return;
    setUploadingImg(true);
    try {
      const updated = await api.adminUploadCategoryImage(initial.id, files[0]);
      const preview = updated.img ? `/${updated.img}` : null;
      setImgPreview(preview);
      onImgUpdated?.(updated.img ?? null);
    } catch {
      /* ignore */
    } finally {
      setUploadingImg(false);
      if (imgInputRef.current) imgInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      await onSave(name.trim());
      onClose();
    } catch (err) {
      setError((err as Error).message || t.errorOccurred);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className='bg-white rounded-2xl shadow-xl w-full max-w-sm p-6'
      >
        <div className='flex items-center justify-between mb-5'>
          <h2 className='text-base font-extrabold text-slate-800'>
            {initial ? t.edit : t.addNew} {t.adminCategories.slice(0, -1)}
          </h2>
          <button
            onClick={onClose}
            className='text-slate-400 hover:text-slate-600'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block text-xs font-bold text-slate-500 mb-1.5'>
              {t.name}
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g. Appetizers'
              className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
            />
          </div>

          {/* Image upload — edit mode only */}
          {initial && (
            <div>
              <label className='block text-xs font-bold text-slate-500 mb-1.5'>
                {t.uploadImages}
              </label>
              <div
                className='w-full h-28 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer group overflow-hidden relative hover:border-indigo-400 transition-colors'
                onClick={() => imgInputRef.current?.click()}
              >
                {imgPreview ? (
                  <img
                    src={imgPreview}
                    alt=''
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <div className='flex flex-col items-center gap-1.5 text-slate-300'>
                    <ImageOff className='w-7 h-7' />
                    <span className='text-xs'>Chưa có ảnh</span>
                  </div>
                )}
                <div className='absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                  {uploadingImg ? (
                    <Spinner size='sm' />
                  ) : (
                    <Upload className='w-5 h-5 text-white' />
                  )}
                </div>
              </div>
              <input
                ref={imgInputRef}
                type='file'
                accept='image/*'
                className='hidden'
                onChange={(e) => handleImgChange(e.target.files)}
              />
            </div>
          )}

          {error && <p className='text-xs text-red-500'>{error}</p>}
          <div className='flex gap-2 pt-1'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 border border-slate-200 text-slate-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition-colors'
            >
              {t.cancel}
            </button>
            <button
              type='submit'
              disabled={saving || !name.trim()}
              className='flex-1 bg-indigo-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-indigo-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2'
            >
              {saving ? <Spinner size='sm' /> : <Check className='w-4 h-4' />}
              {t.save}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

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
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setDeleting(true);
    setError('');
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError((err as Error).message || t.errorOccurred);
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
        {error && <p className='text-xs text-red-500 mb-3'>{error}</p>}
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminCategoriesPage() {
  const { t } = useLang();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<Category | null | 'new'>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const load = () => {
    setLoading(true);
    api
      .getCategories()
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (name: string) => {
    if (editTarget === 'new') {
      const created = await api.adminCreateCategory(name);
      setCategories((prev) => [created, ...prev]);
    } else if (editTarget) {
      await api.adminUpdateCategory(editTarget.id, name);
      setCategories((prev) =>
        prev.map((c) => (c.id === editTarget.id ? { ...c, name } : c)),
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await api.adminDeleteCategory(deleteTarget.id);
    setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
  };

  const handleImgUpdated = (imgUrl: string | null) => {
    if (!editTarget || editTarget === 'new') return;
    const id = (editTarget as Category).id;
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, img: imgUrl } : c)),
    );
  };

  return (
    <div className='px-6 py-8 max-w-3xl mt-10 mx-auto w-full'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <div className='w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center'>
            <Tag className='w-5 h-5 text-indigo-600' />
          </div>
          <div>
            <h1 className='text-xl font-extrabold text-slate-800'>
              {t.adminCategories}
            </h1>
            <p className='text-xs text-slate-400'>
              {categories.length} {t.items}
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

      {/* List */}
      {loading ? (
        <div className='flex justify-center py-20'>
          <Spinner size='lg' />
        </div>
      ) : categories.length === 0 ? (
        <div className='text-center py-20 text-slate-400 text-sm'>
          {t.noData}
        </div>
      ) : (
        <div className='space-y-2'>
          <AnimatePresence initial={false}>
            {categories.map((cat) => (
              <motion.div
                key={cat.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className='bg-white border border-slate-100 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm'
              >
                <div className='w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 overflow-hidden'>
                  {cat.img ? (
                    <img
                      src={`/${cat.img}`}
                      alt=''
                      className='w-full h-full object-cover rounded-lg'
                    />
                  ) : (
                    <Tag className='w-4 h-4 text-indigo-500' />
                  )}
                </div>
                <span className='flex-1 text-sm font-semibold text-slate-800'>
                  {cat.name}
                </span>
                <span className='text-xs text-slate-300 font-mono'>
                  #{cat.id}
                </span>
                <div className='flex items-center gap-1.5'>
                  <button
                    onClick={() => setEditTarget(cat)}
                    className='w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors'
                  >
                    <Pencil className='w-4 h-4' />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(cat)}
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
          <CategoryModal
            key='edit-modal'
            initial={editTarget === 'new' ? undefined : editTarget}
            onSave={handleSave}
            onClose={() => setEditTarget(null)}
            onImgUpdated={handleImgUpdated}
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
