'use client';

import type { ReactNode } from 'react';
import { LogOut } from 'lucide-react';
import { useAppContext } from '@/app/app-provider';
import LangToggle from './lang-toggle';

interface Props {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export default function TopBar({ title, subtitle, right }: Props) {
  const { t, logout } = useAppContext();
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
        <LangToggle />
        {right}
        <button
          onClick={logout}
          className='p-2 text-muted-foreground hover:text-rose-500 hover:bg-accent rounded-xl transition-all md:hidden'
          title={t.logout}
        >
          <LogOut className='w-5 h-5' />
        </button>
      </div>
    </header>
  );
}
