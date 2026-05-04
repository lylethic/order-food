'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useAppContext } from '@/app/app-provider';
import Spinner from '@/components/restaurant/spinner';

interface Props {
  name: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export default function ConfirmDeleteModal({
  name,
  onConfirm,
  onClose,
}: Props) {
  const { t } = useAppContext();
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
    <div
      className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className='rounded-2xl shadow-xl w-full max-w-sm p-6'
      >
        <div className='flex items-center gap-3 mb-4'>
          <div className='w-10 h-10 rounded-full bg-red-100 flex items-center justify-center'>
            <Trash2 className='w-5 h-5 text-red-600' />
          </div>
          <div>
            <p className='text-sm font-extrabold text-foreground'>
              {t.delete} "{name}"?
            </p>
            <p className='text-xs text-muted-foreground mt-0.5'>{t.confirmDelete}</p>
          </div>
        </div>
        <div className='flex gap-2'>
          <button
            onClick={onClose}
            className='flex-1 border border-border text-muted-foreground text-sm font-semibold py-2.5 rounded-xl hover:bg-accent transition-colors'
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
      </div>
    </div>
  );
}
