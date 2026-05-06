'use client';

import { useState, useRef } from 'react';
import { X, Upload, ImageOff, Star } from 'lucide-react';
import { useAppContext } from '@/app/app-provider';
import menuItemApiRequest from '@/apiRequests/menu-item';
import Spinner from '@/components/restaurant/spinner';
import type {
  MenuItemImageType,
  MenuItemDetailType,
} from '@/schemaValidations/menu.schema';
import Image from 'next/image';

interface Props {
  itemId: string;
  images: MenuItemImageType[];
  onChange: (updated: MenuItemDetailType) => void;
}

export default function ImageManager({ itemId, images, onChange }: Props) {
  const { t } = useAppContext();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const res = await menuItemApiRequest.uploadImages(
        itemId,
        Array.from(files),
        0,
      );
      onChange(res.payload.data as MenuItemDetailType);
    } catch {
      /* ignore */
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (imageId: string) => {
    setDeletingId(imageId);
    try {
      const res = await menuItemApiRequest.deleteImage(itemId, imageId);
      onChange(res.payload.data as MenuItemDetailType);
    } catch {
      /* ignore */
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className='flex items-center justify-between mb-2'>
        <p className='text-xs font-bold text-muted-foreground'>{t.images}</p>
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
        <div className='border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 text-muted-foreground'>
          <ImageOff className='w-8 h-8' />
          <p className='text-xs'>Chưa có ảnh</p>
        </div>
      ) : (
        <div className='flex gap-2 flex-wrap'>
          {images.map((img) => (
            <div key={img.id} className='relative group'>
              <Image
                src={`/${img.image_url}`}
                alt={itemId}
                className={`w-20 h-20 object-fill rounded-xl border-2 ${img.is_primary ? 'border-indigo-500' : 'border-transparent'}`}
                loading='lazy'
                unoptimized
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
