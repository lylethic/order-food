import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  Tag,
  Users,
  ShieldCheck,
  LogOut,
  UtensilsCrossed,
  MessageCircle,
  QrCode,
  ClipboardList,
} from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { LangToggle } from '../components/LangToggle';
import { TopBar } from '@/components/TopBar';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { useSSE } from '../hooks/useSSE';
import type { NotificationCreatedEvent } from '../hooks/useSSE';

// ─── Sidebar link ─────────────────────────────────────────────────────────────

function NavLink({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.FC<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
        active
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon className='w-4.5 h-4.5' />
      {label}
    </button>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function AdminLayout() {
  const { user, token, isAdmin, isLoading, logout } = useAuthContext();
  const { t } = useLang();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const lastEvent = useSSE(token);
  const notificationEvent =
    lastEvent?.eventType === 'notification.created'
      ? (lastEvent as NotificationCreatedEvent)
      : null;

  if (isLoading) return null;
  if (!user) return <Navigate to='/auth' replace />;
  if (!isAdmin) return <Navigate to='/menu' replace />;

  const navItems = [
    {
      id: 'categories',
      label: t.adminCategories,
      icon: Tag,
      path: '/admin/categories',
    },
    {
      id: 'menu-items',
      label: t.adminMenuItems,
      icon: UtensilsCrossed,
      path: '/admin/menu-items',
    },
    { id: 'users', label: t.adminUsers, icon: Users, path: '/admin/users' },
    {
      id: 'comments',
      label: 'Đánh giá',
      icon: MessageCircle,
      path: '/admin/comments',
    },
    {
      id: 'qr',
      label: t.adminQR,
      icon: QrCode,
      path: '/admin/qr',
    },
    {
      id: 'orders',
      label: t.adminOrders,
      icon: ClipboardList,
      path: '/admin/orders',
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
  const topSubtitle = t.adminPanel;

  return (
    <div className='min-h-screen bg-slate-50 flex'>
      {/* Sidebar */}
      <aside className='hidden md:flex fixed inset-y-0 left-0 w-64 flex-col bg-white border-r border-slate-100 shadow-sm z-30'>
        {/* Logo */}
        <div className='flex items-center gap-3 px-6 py-5 border-b border-slate-100'>
          <div className='w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow'>
            <ShieldCheck className='w-5 h-5 text-white' />
          </div>
          <div>
            <p className='text-sm font-extrabold text-slate-800'>
              {t.adminPanel}
            </p>
            <p className='text-xs text-slate-400'>Administrator</p>
          </div>
        </div>

        {/* Nav */}
        <nav className='flex-1 px-3 py-4 flex flex-col gap-1'>
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeId === item.id}
              onClick={() => navigate(item.path)}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className='px-4 py-4 border-t border-slate-100 space-y-3'>
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
              <p className='text-xs font-bold text-slate-800 truncate'>
                {user.name ?? user.email}
              </p>
              <p className='text-[10px] text-indigo-500 font-semibold'>ADMIN</p>
            </div>
          </div>
          <button
            onClick={logout}
            className='w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors font-medium'
          >
            <LogOut className='w-4 h-4' />
            {t.logout}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className='flex-1 md:ml-64 flex flex-col min-h-screen'>
        {/* Top bar (mobile) */}
        <header className='md:hidden sticky top-0 z-20 bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3'>
          <div className='w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center'>
            <ShieldCheck className='w-4 h-4 text-white' />
          </div>
          <span className='font-extrabold text-slate-800 text-base flex-1'>
            {t.adminPanel}
          </span>
          <LangToggle />
        </header>

        {/* Mobile bottom nav */}
        <nav className='md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-100 flex'>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition-colors ${
                activeId === item.id ? 'text-indigo-600' : 'text-slate-400'
              }`}
            >
              <item.icon className='w-5 h-5' />
              {item.label}
            </button>
          ))}
          <button
            onClick={logout}
            className='flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold text-slate-400'
          >
            <LogOut className='w-5 h-5' />
            {t.logout}
          </button>
        </nav>

        <main className='flex-1 flex flex-col'>
          <TopBar
            title={topTitle}
            subtitle={topSubtitle}
            onLogout={logout}
            right={
              <NotificationDropdown notificationEvent={notificationEvent} />
            }
          />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
