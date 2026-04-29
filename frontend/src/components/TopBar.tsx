import type { ReactNode } from 'react';
import { LogOut } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { LangToggle } from './LangToggle';

interface Props {
  title: string;
  subtitle?: string;
  onLogout: () => void;
  right?: ReactNode;
}

export function TopBar({ title, subtitle, onLogout, right }: Props) {
  const { t } = useLang();
  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 bg-white/80 backdrop-blur-md border-b border-slate-100 z-30 h-16 flex items-center px-6 justify-between">
      <div>
        <h1 className="text-base font-extrabold text-slate-800">{title}</h1>
        {subtitle && (
          <p className="text-xs text-slate-400 font-medium hidden sm:block">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <LangToggle />
        {right}
        {/* Mobile-only logout */}
        <button
          onClick={onLogout}
          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-50 rounded-xl transition-all md:hidden"
          title={t.logout}
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
