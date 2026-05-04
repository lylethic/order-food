'use client';

import { useRouter, usePathname } from 'next/navigation';
import {
  Tag,
  Users,
  ShieldCheck,
  LogOut,
  UtensilsCrossed,
  MessageCircle,
  QrCode,
  ClipboardList,
} from 'lucide-react';
import { useAppContext } from '@/app/app-provider';
import { useSSE } from '@/hooks/useSSE';
import type { NotificationCreatedEvent } from '@/hooks/useSSE';
import LangToggle from '@/components/restaurant/lang-toggle';
import TopBar from '@/components/restaurant/top-bar';
import NotificationDropdown from '@/components/restaurant/notification-dropdown';
import Link from 'next/link';
import { ModeToggle } from '@/components/mode-toggle';

interface AdminNavItem {
  id: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  href: string;
}

function NavLink({ item, active }: { item: AdminNavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
        active
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
          : 'hover:bg-accent'
      }`}
    >
      <item.icon className='w-4 h-4' />
      {item.label}
    </Link>
  );
}

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAdmin, isChef, isEmployee, t, logout, token } =
    useAppContext();

  const lastEvent = useSSE(token);
  const notificationEvent =
    lastEvent?.eventType === 'notification.created'
      ? (lastEvent as NotificationCreatedEvent)
      : null;

  // Guards
  if (!user) {
    router.replace('/login');
    return null;
  }
  if (!isAdmin) {
    if (isChef) {
      router.replace('/kitchen');
      return null;
    }
    if (isEmployee) {
      router.replace('/server');
      return null;
    }
    router.replace('/menu');
    return null;
  }

  const navItems: AdminNavItem[] = [
    {
      id: 'categories',
      label: t.adminCategories,
      icon: Tag,
      href: '/admin/categories',
    },
    {
      id: 'menu-items',
      label: t.adminMenuItems,
      icon: UtensilsCrossed,
      href: '/admin/menu-items',
    },
    { id: 'users', label: t.adminUsers, icon: Users, href: '/admin/users' },
    {
      id: 'comments',
      label: 'Đánh giá',
      icon: MessageCircle,
      href: '/admin/comments',
    },
    { id: 'qr', label: t.adminQR, icon: QrCode, href: '/admin/qr' },
    {
      id: 'orders',
      label: t.adminOrders,
      icon: ClipboardList,
      href: '/admin/orders',
    },
  ];

  const activeId = pathname.startsWith('/admin/menu-items')
    ? 'menu-items'
    : pathname.startsWith('/admin/users')
      ? 'users'
      : pathname.startsWith('/admin/comments')
        ? 'comments'
        : pathname.startsWith('/admin/qr')
          ? 'qr'
          : pathname.startsWith('/admin/orders')
            ? 'orders'
            : 'categories';

  const activeNav = navItems.find((item) => item.id === activeId);
  const topTitle = activeNav?.label ?? t.adminPanel;

  const displayName =
    (user as any).name ?? (user as any).fullname ?? user.email ?? 'Admin';

  return (
    <div className='min-h-screen flex'>
      {/* Desktop sidebar */}
      <aside className='hidden md:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-border shadow-sm z-30'>
        {/* Logo */}
        <div className='flex items-center gap-3 px-6 py-5 border-b border-border'>
          <div className='w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow'>
            <ShieldCheck className='w-5 h-5 text-white' />
          </div>
          <div>
            <p className='text-sm font-extrabold'>{t.adminPanel}</p>
            <p className='text-xs'>Administrator</p>
          </div>
        </div>

        {/* Nav */}
        <nav className='flex-1 px-3 py-4 flex flex-col gap-1'>
          {navItems.map((item) => (
            <NavLink key={item.id} item={item} active={activeId === item.id} />
          ))}
        </nav>

        {/* Footer */}
        <div className='px-4 py-4 border-t border-border space-y-3'>
          <div className='flex items-center gap-2 px-1'>
            <div className='w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0'>
              {user.img ? (
                <img
                  src={`/${user.img}`}
                  alt=''
                  className='w-8 h-8 rounded-full object-cover'
                />
              ) : (
                <Users className='w-4 h-4 text-indigo-600' />
              )}
            </div>
            <div className='flex-1 min-w-0'>
              <p className='text-xs font-bold truncate'>{displayName}</p>
              <p className='text-[10px] text-indigo-500 font-semibold'>ADMIN</p>
            </div>
            <ModeToggle />
          </div>
          <button
            onClick={logout}
            className='w-full flex items-center justify-end gap-2 px-3 py-2 rounded-lg text-sm hover:bg-red-50 hover:text-red-600 transition-colors font-medium'
          >
            {t.logout}
            <LogOut className='w-4 h-4' />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className='flex-1 md:ml-64 flex flex-col min-h-screen'>
        {/* Mobile header */}
        <header className='md:hidden sticky top-0 z-20 border-b border-border px-4 py-3 flex items-center gap-3'>
          <div className='w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center'>
            <ShieldCheck className='w-4 h-4 text-white' />
          </div>
          <span className='font-extrabold text-base flex-1'>
            {t.adminPanel}
          </span>
          <LangToggle />
        </header>

        {/* Mobile bottom nav */}
        <nav className='md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border flex'>
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition-colors ${
                activeId === item.id ? 'text-indigo-600' : ''
              }`}
            >
              <item.icon className='w-5 h-5' />
              {item.label}
            </Link>
          ))}
          <button
            onClick={logout}
            className='flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold '
          >
            <LogOut className='w-5 h-5' />
            {t.logout}
          </button>
        </nav>

        <main className='flex-1 flex flex-col'>
          <TopBar
            title={topTitle}
            subtitle={t.adminPanel}
            right={
              <NotificationDropdown notificationEvent={notificationEvent} />
            }
          />
          <div className='flex-1 overflow-y-auto overflow-x-hidden p-4 pt-20 pb-16 md:pb-4'>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
