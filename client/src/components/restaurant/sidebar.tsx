'use client';

import { useRef, useState } from 'react';
import {
  LogOut,
  User,
  Camera,
  UtensilsCrossed,
  ChefHat,
  Truck,
} from 'lucide-react';
import Link from 'next/link';
import { useAppContext } from '@/app/app-provider';
import userApiRequest from '@/apiRequests/user';
import type { AuthUserType } from '@/schemaValidations/auth.schema';
import { ModeToggle } from '../mode-toggle';

export interface SidebarNavItem {
  id: string;
  label: string;
  href: string;
  icon: React.FC<{ className?: string; strokeWidth?: number }>;
}

export type SidebarVariant = 'customer' | 'chef' | 'employee';

interface Props {
  items: SidebarNavItem[];
  activeId: string;
  variant?: SidebarVariant;
}

// Variant-specific tokens
const variantTokens = {
  customer: {
    logoBg: 'bg-indigo-600 shadow-indigo-100',
    logoIcon: UtensilsCrossed,
    logoText: 'RUBYKET',
    activeNavBg: 'bg-indigo-50',
    activeNavText: 'text-indigo-700',
    avatarRing: 'bg-indigo-100',
    avatarIcon: 'text-indigo-600',
  },
  chef: {
    logoBg: 'bg-orange-500 shadow-orange-100',
    logoIcon: ChefHat,
    logoText: 'KITCHEN',
    activeNavBg: 'bg-orange-50',
    activeNavText: 'text-orange-700',
    avatarRing: 'bg-orange-100',
    avatarIcon: 'text-orange-600',
  },
  employee: {
    logoBg: 'bg-teal-600 shadow-teal-100',
    logoIcon: Truck,
    logoText: 'SERVICE',
    activeNavBg: 'bg-teal-50',
    activeNavText: 'text-teal-700',
    avatarRing: 'bg-teal-100',
    avatarIcon: 'text-teal-600',
  },
};

function Avatar({
  user,
  tokens,
}: {
  user: AuthUserType;
  tokens: (typeof variantTokens)['customer'];
}) {
  const { setUser } = useAppContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const userId = user.userId ?? user.id ?? '';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploading(true);
    try {
      const res = await userApiRequest.uploadAvatar(userId, file);
      const updated = res.payload.data as Record<string, unknown>;
      setUser({
        ...user,
        img: updated.img != null ? String(updated.img) : null,
      });
    } catch {
      // silent
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const imgSrc = user.img ? `/${user.img}` : null;
  const displayName =
    (user as any).name ?? (user as any).fullname ?? user.email;

  return (
    <div
      className='relative w-9 h-9 shrink-0 cursor-pointer group'
      onClick={() => inputRef.current?.click()}
      title='Change avatar'
    >
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={displayName}
          className='w-9 h-9 rounded-full object-cover'
        />
      ) : (
        <div
          className={`w-9 h-9 rounded-full ${tokens.avatarRing} flex items-center justify-center`}
        >
          <User className={`w-4 h-4 ${tokens.avatarIcon}`} />
        </div>
      )}

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

export default function Sidebar({
  items,
  activeId,
  variant = 'customer',
}: Props) {
  const { user, logout, t } = useAppContext();
  const tokens = variantTokens[variant];
  const LogoIcon = tokens.logoIcon;

  const displayName = user
    ? ((user as any).name ?? (user as any).fullname ?? user.email)
    : null;
  const roleLabel = user
    ? Array.isArray(user.role)
      ? user.role.join(', ')
      : (user.role ?? user.roleId ?? '')
    : null;

  return (
    <aside className='hidden md:flex w-64 border-r border-border flex-col fixed h-full z-40 shadow'>
      {/* Logo */}
      <div className='p-7 flex items-center gap-3 border-b border-border'>
        <div
          className={`w-9 h-9 ${tokens.logoBg} rounded-xl flex items-center justify-center shadow-md`}
        >
          <LogoIcon className='w-5 h-5 text-white' strokeWidth={2.5} />
        </div>
        <span className='font-extrabold text-lg text-foreground italic uppercase tracking-tight'>
          {tokens.logoText}
        </span>
      </div>

      {/* Nav items */}
      <nav className='flex-1 px-4 py-6 space-y-1'>
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${
              activeId === item.id
                ? `${tokens.activeNavBg} ${tokens.activeNavText}`
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <item.icon
              className='w-5 h-5'
              strokeWidth={activeId === item.id ? 2.5 : 2}
            />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User / logout — only when logged in */}
      {user && (
        <div className='p-4 border-t border-border'>
          <div className='flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-all'>
            <Avatar user={user} tokens={tokens} />
            <div className='flex-1 min-w-0'>
              <p className='text-sm font-bold text-foreground truncate'>
                {displayName}
              </p>
              <p className='text-xs text-muted-foreground font-medium'>
                {roleLabel}
              </p>
              <ModeToggle />
            </div>
            <button
              onClick={logout}
              className='text-muted-foreground hover:text-rose-500 transition-colors p-1 rounded-lg'
              title={t.logout}
            >
              <LogOut className='w-4 h-4' />
            </button>
          </div>
        </div>
      )}
      {!user && (
        <div className='flex w-full justify-end p-6'>
          <ModeToggle />
        </div>
      )}
    </aside>
  );
}
