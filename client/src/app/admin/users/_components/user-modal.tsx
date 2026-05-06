'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Check, Users, Camera } from 'lucide-react';
import { useAppContext } from '@/app/app-provider';
import userApiRequest from '@/apiRequests/user';
import Spinner from '@/components/restaurant/spinner';
import type { AdminUserType } from '@/schemaValidations/user.schema';
import Image from 'next/image';
import envConfig from '@/config';

interface SaveData {
  username: string;
  email: string;
  password: string;
  name: string;
  phone: string;
  active: boolean;
}

interface Props {
  initial?: AdminUserType;
  onSave: (data: SaveData) => Promise<void>;
  onClose: () => void;
  onAvatarUpdated?: (imgUrl: string | null) => void;
}

export default function UserModal({
  initial,
  onSave,
  onClose,
  onAvatarUpdated,
}: Props) {
  const { t } = useAppContext();
  const [form, setForm] = useState({
    username: initial?.username ?? '',
    email: initial?.email ?? '',
    password: '',
    name: initial?.name ?? '',
    phone: '',
    active: initial?.active !== false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    initial?.img ? `/${initial.img}` : null,
  );
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleAvatarChange = async (files: FileList | null) => {
    if (!files?.[0] || !initial) return;
    setUploadingAvatar(true);
    try {
      const res = await userApiRequest.uploadAvatar(initial.id, files[0]);
      const updated = res.payload.data as Record<string, unknown>;
      const img = updated.img != null ? String(updated.img) : null;
      setAvatarPreview(img ? `/${img}` : null);
      onAvatarUpdated?.(img);
    } catch {
      /* ignore */
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || (!initial && !form.email.trim())) return;
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError((err as Error).message || t.errorOccurred);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className='fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4'
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className='w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden bg-white'
      >
        <div className='flex items-center justify-between px-6 py-4 border-b border-border'>
          <h2 className='text-base font-extrabold text-foreground'>
            {initial ? t.edit : t.addNew} người dùng
          </h2>
          <button
            onClick={onClose}
            className='text-muted-foreground hover:text-muted-foreground'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='px-6 py-5 space-y-4'>
          {initial && (
            <div className='flex justify-center'>
              <div
                className='relative w-16 h-16 rounded-full bg-muted cursor-pointer group overflow-hidden ring-2 ring-slate-200 hover:ring-indigo-400 transition-all'
                onClick={() => avatarInputRef.current?.click()}
              >
                {avatarPreview ? (
                  <Image
                    src={`${envConfig.NEXT_PUBLIC_API_ENDPOINT}${avatarPreview}`}
                    width={24}
                    height={24}
                    alt=''
                    className='w-full h-full rounded-lg object-cover flex-shrink-0'
                    loading='lazy'
                  />
                ) : (
                  <Users className='w-8 h-8 text-muted-foreground absolute inset-0 m-auto' />
                )}
                <div className='absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full'>
                  {uploadingAvatar ? (
                    <Spinner size='sm' />
                  ) : (
                    <Camera className='w-4 h-4 text-white' />
                  )}
                </div>
              </div>
              <input
                ref={avatarInputRef}
                type='file'
                accept='image/*'
                className='hidden'
                onChange={(e) => handleAvatarChange(e.target.files)}
              />
            </div>
          )}

          <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className='block text-xs font-bold text-muted-foreground mb-1.5'>
                {t.username} *
              </label>
              <input
                autoFocus
                value={form.username}
                onChange={(e) =>
                  setForm((f) => ({ ...f, username: e.target.value }))
                }
                className='w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
              />
            </div>
            <div>
              <label className='block text-xs font-bold text-muted-foreground mb-1.5'>
                {t.name}
              </label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className='w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
              />
            </div>
          </div>

          {!initial && (
            <>
              <div>
                <label className='block text-xs font-bold text-muted-foreground mb-1.5'>
                  {t.email} *
                </label>
                <input
                  type='email'
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className='w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
                />
              </div>
              <div>
                <label className='block text-xs font-bold text-muted-foreground mb-1.5'>
                  {t.password} *
                </label>
                <input
                  type='password'
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className='w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
                />
              </div>
              <div>
                <label className='block text-xs font-bold text-muted-foreground mb-1.5'>
                  Phone *
                </label>
                <input
                  type='tel'
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  className='w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
                />
              </div>
            </>
          )}

          {initial && (
            <div className='flex items-center gap-3'>
              <button
                type='button'
                onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
                className={`relative w-10 h-6 rounded-full transition-colors ${form.active ? 'bg-indigo-600' : 'bg-muted'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow transition-transform ${form.active ? 'translate-x-4' : 'translate-x-0'}`}
                />
              </button>
              <span className='text-sm font-semibold text-foreground'>
                {form.active ? t.active : t.inactive}
              </span>
            </div>
          )}

          {error && <p className='text-xs text-red-500'>{error}</p>}

          <div className='flex gap-2 pt-1'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 border border-border text-muted-foreground text-sm font-semibold py-2.5 rounded-xl hover:bg-accent'
            >
              {t.cancel}
            </button>
            <button
              type='submit'
              disabled={saving}
              className='flex-1 bg-indigo-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center gap-2'
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
