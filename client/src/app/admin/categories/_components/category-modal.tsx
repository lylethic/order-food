'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Check, ImageOff, Upload } from 'lucide-react';
import { useAppContext } from '@/app/app-provider';
import categoryApiRequest from '@/apiRequests/category';
import Spinner from '@/components/restaurant/spinner';
import type { CategoryItemType } from '@/schemaValidations/menu.schema';
import Image from 'next/image';
import envConfig from '@/config';

interface Props {
  initial?: CategoryItemType;
  onSave: (name: string) => Promise<void>;
  onClose: () => void;
  onImgUpdated?: (imgUrl: string | null) => void;
}

const getImageUrl = (img?: string | null) => {
  if (!img) return null;

  if (img.startsWith('http')) return img;

  return `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/${img.replace(/^\/+/, '')}`;
};

export default function CategoryModal({
  initial,
  onSave,
  onClose,
  onImgUpdated,
}: Props) {
  const { t } = useAppContext();
  const [name, setName] = useState(initial?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const imgInputRef = useRef<HTMLInputElement>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(
    getImageUrl(initial?.img),
  );
  const [uploadingImg, setUploadingImg] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleImgChange = async (files: FileList | null) => {
    if (!files?.[0] || !initial) return;
    setUploadingImg(true);
    try {
      const res = await categoryApiRequest.uploadImage(initial.id, files[0]);
      const updated = res.payload.data as Record<string, unknown>;
      const img = updated.img != null ? String(updated.img) : null;
      setImgPreview(getImageUrl(img));
      onImgUpdated?.(img);
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

  return (
    <div
      className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className='rounded-2xl shadow-xl w-full max-w-md p-6 bg-white'
      >
        <div className='flex items-center justify-between mb-5'>
          <h2 className='text-base font-extrabold text-black'>
            {initial ? t.edit : t.addNew} danh mục
          </h2>
          <button onClick={onClose} className='hover:text-muted-foreground'>
            <X className='w-5 h-5' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block text-xs text-black font-bold mb-1.5'>
              {t.name}
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g. Appetizers'
              className='w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
            />
          </div>

          {initial && (
            <div>
              <label className='block text-xs font-bold mb-1.5'>
                {t.uploadImages}
              </label>
              <div
                className='w-full h-[50vh] rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer group overflow-hidden relative hover:border-indigo-400 transition-colors'
                onClick={() => imgInputRef.current?.click()}
              >
                {imgPreview ? (
                  <Image
                    src={imgPreview}
                    alt='Image'
                    fill
                    unoptimized
                    className='object-cover group-hover:scale-105 transition-transform duration-700'
                  />
                ) : (
                  <div className='flex flex-col items-center gap-1.5'>
                    <ImageOff className='w-7 h-7' />
                    <span className='text-xs text-black'>Chưa có ảnh</span>
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
              className='flex-1 border border-border text-sm font-semibold py-2.5 rounded-xl hover:bg-accent transition-colors text-black'
            >
              {t.cancel}
            </button>
            <button
              type='submit'
              disabled={saving || !name.trim()}
              className='flex-1 bg-indigo-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-indigo-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer'
            >
              {saving ? <Spinner size='sm' /> : <Check className='w-4 h-4' />}
              {t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
