import { LogOut, User } from 'lucide-react';
import { UtensilsCrossed } from 'lucide-react';
import { useLang } from '../context/LangContext';
import type { NavItem, User as UserType } from '../types';

interface Props {
  items: NavItem[];
  active: string;
  onChange: (id: string) => void;
  user: UserType;
  onLogout: () => void;
}

export function Sidebar({ items, active, onChange, user, onLogout }: Props) {
  const { t } = useLang();
  return (
    <aside className='hidden md:flex w-64 bg-white border-r border-slate-100 flex-col fixed h-full z-40'>
      {/* Logo */}
      <div className='p-7 flex items-center gap-3 border-b border-slate-50'>
        <div className='w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-100'>
          <UtensilsCrossed className='w-5 h-5 text-white' strokeWidth={2.5} />
        </div>
        <span className='font-extrabold text-lg text-slate-800 italic uppercase tracking-tight'>
          RUBYKET
        </span>
      </div>

      {/* Nav items */}
      <nav className='flex-1 px-4 py-6 space-y-1'>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${
              active === item.id
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <item.icon
              className='w-5 h-5'
              strokeWidth={active === item.id ? 2.5 : 2}
            />
            {item.label}
          </button>
        ))}
      </nav>

      {/* User / logout */}
      <div className='p-4 border-t border-slate-50'>
        <div className='flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all'>
          <div className='w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0'>
            <User className='w-4 h-4 text-indigo-600' />
          </div>
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-bold text-slate-800 truncate'>
              {user.name || user.email}
            </p>
            <p className='text-xs text-slate-400 font-medium'>{user.role}</p>
          </div>
          <button
            onClick={onLogout}
            className='text-slate-300 hover:text-rose-500 transition-colors p-1 rounded-lg'
            title={t.logout}
          >
            <LogOut className='w-4 h-4' />
          </button>
        </div>
      </div>
    </aside>
  );
}
