import { UseFormSetError } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';
import jwt from 'jsonwebtoken';
import { type ClassValue, clsx } from 'clsx';
import { EntityError } from '@/lib/http';
import { toast } from '@/components/ui/use-toast';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const handleErrorApi = ({
  error,
  setError,
  duration,
}: {
  error: any;
  setError?: UseFormSetError<any>;
  duration?: number;
}) => {
  if (error instanceof EntityError && setError) {
    error.payload.errors.forEach((item) => {
      setError(item.field, {
        type: 'server',
        message: item.message,
      });
    });
  } else {
    toast({
      title: 'Error',
      description: error?.payload?.message ?? 'Error Undefined',
      variant: 'destructive',
      duration: duration ?? 5000,
    });
  }
};
/**
 * Xóa đi ký tự `/` đầu tiên của path
 */
export const normalizePath = (path: string) => {
  return path.startsWith('/') ? path.slice(1) : path;
};

export const decodeJWT = <Payload = any>(token: string) => {
  return jwt.decode(token) as Payload;
};

export function createStorage(key: string) {
  const raw = localStorage.getItem(key);
  const store: Record<string, string> = raw ? JSON.parse(raw) : {};
  const save = () => {
    localStorage.setItem(key, JSON.stringify(store));
  };

  const storage = {
    get(key: string) {
      return store[key];
    },
    set(key: string, value: string) {
      store[key] = value;
      save();
    },
    remove(key: string) {
      delete store[key];
      save();
    },
  };
  return storage;
}
