'use client';

import type { ReactNode } from 'react';
import { LogOut, LogIn, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useAppContext } from '@/app/app-provider';
import LangToggle from './lang-toggle';

interface Props {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export default function TopBar({ title, subtitle, right }: Props) {
  const { t, logout, user } = useAppContext();
  const isGuest = !user;

  return (
    <header className='sticky top-0 backdrop-blur-md border-b border-border z-30 h-16 flex items-center px-8 justify-between shadow'>
      <div>
        <h1 className='text-base font-extrabold text-foreground'>{title}</h1>
        {subtitle && (
          <p className='text-xs text-muted-foreground font-medium hidden sm:block'>
            {subtitle}
          </p>
        )}
      </div>
      <div className='flex items-center gap-3'>
        <div className='hidden md:block'>
          <LangToggle />
        </div>
        {right}
        {isGuest ? (
          <div className='flex items-center gap-2'>
            <Link
              href='/login'
              className='flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-all'
            >
              <LogIn className='w-4 h-4' />
              <span className='hidden sm:inline'>
                {t.loginLink ?? 'Đăng nhập'}
              </span>
            </Link>
            <Link
              href='/register'
              className='flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-all'
            >
              <UserPlus className='w-4 h-4' />
              <span className='hidden sm:inline'>
                {t.continueRegister ?? 'Đăng ký'}
              </span>
            </Link>
          </div>
        ) : (
          <button
            onClick={logout}
            className='p-2 text-muted-foreground hover:text-rose-500 hover:bg-accent rounded-xl transition-all'
            title={t.logout}
          >
            <LogOut className='w-5 h-5' />
          </button>
        )}
      </div>
    </header>
  );
}
