'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Tag,
  Users,
  ShieldCheck,
  LogOut,
  UtensilsCrossed,
  MessageCircle,
  QrCode,
  ClipboardList,
  Menu,
  X,
} from 'lucide-react';
import { useAppContext } from '@/app/app-provider';
import { useSSE } from '@/hooks/useSSE';
import type { NotificationCreatedEvent } from '@/hooks/useSSE';
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

function NavLink({
  item,
  active,
  onClick,
}: {
  item: AdminNavItem;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
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

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const { user, isAdmin, isChef, isEmployee, t, logout, token } =
    useAppContext();

  const lastEvent = useSSE(token);
  const notificationEvent =
    lastEvent?.eventType === 'notification.created'
      ? (lastEvent as NotificationCreatedEvent)
      : null;

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }

    if (!isAdmin) {
      if (isChef) {
        router.replace('/kitchen');
      } else if (isEmployee) {
        router.replace('/server');
      } else {
        router.replace('/menu');
      }
    }
  }, [user, isAdmin, isChef, isEmployee, router]);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  if (!user || !isAdmin) return null;

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
    {
      id: 'users',
      label: t.adminUsers,
      icon: Users,
      href: '/admin/users',
    },
    {
      id: 'comments',
      label: 'Đánh giá',
      icon: MessageCircle,
      href: '/admin/comments',
    },
    {
      id: 'qr',
      label: t.adminQR,
      icon: QrCode,
      href: '/admin/qr',
    },
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
      <aside className='hidden md:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-border shadow-sm z-30 bg-background'>
        {/* Logo */}
        <div className='flex items-center gap-3 px-6 py-5 border-b border-border'>
          <div className='w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow'>
            <ShieldCheck className='w-5 h-5 text-white' />
          </div>

          <div>
            <p className='text-sm font-extrabold'>{t.adminPanel}</p>
            <p className='text-xs text-muted-foreground'>Administrator</p>
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
        <header className='md:hidden sticky top-0 z-40 border-b border-border bg-background px-4 py-3 flex items-center gap-3'>
          <button
            type='button'
            onClick={() => setMobileSidebarOpen(true)}
            className='w-9 h-9 rounded-lg flex items-center justify-center hover:bg-accent transition-colors'
            aria-label='Open menu'
          >
            <Menu className='w-5 h-5' />
          </button>

          <div className='w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center'>
            <ShieldCheck className='w-4 h-4 text-white' />
          </div>

          <span className='font-extrabold text-base flex-1 truncate'>
            {t.adminPanel}
          </span>
        </header>

        {/* Mobile sidebar drawer */}
        {mobileSidebarOpen && (
          <div className='md:hidden fixed inset-0 z-50'>
            {/* Overlay */}
            <div
              className='absolute inset-0 bg-black/50'
              onClick={() => setMobileSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside className='absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-background border-r border-border shadow-xl flex flex-col'>
              {/* Drawer header */}
              <div className='flex items-center justify-between px-5 py-4 border-b border-border'>
                <div className='flex items-center gap-3 min-w-0'>
                  <div className='w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow shrink-0'>
                    <ShieldCheck className='w-5 h-5 text-white' />
                  </div>

                  <div className='min-w-0'>
                    <p className='text-sm font-extrabold truncate'>
                      {t.adminPanel}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      Administrator
                    </p>
                  </div>
                </div>

                <button
                  type='button'
                  onClick={() => setMobileSidebarOpen(false)}
                  className='w-9 h-9 rounded-lg flex items-center justify-center hover:bg-accent transition-colors shrink-0'
                  aria-label='Close menu'
                >
                  <X className='w-5 h-5' />
                </button>
              </div>

              {/* Drawer nav */}
              <nav className='flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto'>
                {navItems.map((item) => (
                  <NavLink
                    key={item.id}
                    item={item}
                    active={activeId === item.id}
                    onClick={() => setMobileSidebarOpen(false)}
                  />
                ))}
              </nav>

              {/* Drawer footer */}
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
                    <p className='text-[10px] text-indigo-500 font-semibold'>
                      ADMIN
                    </p>
                  </div>

                  <ModeToggle />
                </div>

                <button
                  onClick={() => {
                    setMobileSidebarOpen(false);
                    logout();
                  }}
                  className='w-full flex items-center justify-end gap-2 px-3 py-2 rounded-lg text-sm hover:bg-red-50 hover:text-red-600 transition-colors font-medium'
                >
                  {t.logout}
                  <LogOut className='w-4 h-4' />
                </button>
              </div>
            </aside>
          </div>
        )}

        <main className='flex-1 flex flex-col'>
          <TopBar
            title={topTitle}
            subtitle={t.adminPanel}
            right={
              <NotificationDropdown notificationEvent={notificationEvent} />
            }
          />

          <div className='flex-1 overflow-y-auto overflow-x-hidden p-4 pt-20'>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
