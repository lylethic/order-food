import { useRef, useState } from 'react';
import { LogOut, User, Camera } from 'lucide-react';
import { UtensilsCrossed } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { useAuthContext } from '../context/AuthContext';
import { api } from '../services/api';
import type { NavItem, User as UserType } from '../types';

interface Props {
  items: NavItem[];
  active: string;
  onChange: (id: string) => void;
  user: UserType;
  onLogout: () => void;
}

function Avatar({ user }: { user: UserType }) {
  const { updateUser } = useAuthContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const updated = await api.uploadAvatar(user.userId, file);
      updateUser({ img: updated.img });
    } catch {
      // silent — could show a toast here
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div
      className='relative w-9 h-9 shrink-0 cursor-pointer group'
      onClick={() => inputRef.current?.click()}
      title='Change avatar'
    >
      {user.img ? (
        <img
          src={`/${user.img}`}
          alt={user.name || user.email}
          className='w-9 h-9 rounded-full object-cover'
        />
      ) : (
        <div className='w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center'>
          <User className='w-4 h-4 text-indigo-600' />
        </div>
      )}

      {/* Hover overlay */}
      <div className='absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
        {uploading ? (
          <div className='w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin' />
        ) : (
          <Camera className='w-3 h-3 text-white' />
        )}
      </div>

      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={handleFileChange}
      />
    </div>
  );
}

export function Sidebar({ items, active, onChange, user, onLogout }: Props) {
  const { t } = useLang();
  return (
    <aside className='hidden md:flex w-64 bg-white border-r border-slate-100 flex-col fixed h-full z-40 shadow'>
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
          <Avatar user={user} />
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-bold text-slate-800 truncate'>
              {user.name || user.email}
            </p>
            <p className='text-xs text-slate-400 font-medium'>
              {Array.isArray(user.role) ? user.role.join(', ') : user.role}
            </p>
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
