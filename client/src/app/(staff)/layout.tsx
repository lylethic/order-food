'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ChefHat, Truck, ClipboardList } from 'lucide-react';
import { useAppContext } from '@/app/app-provider';
import { useSSE } from '@/hooks/useSSE';
import type { StatusEvent, NotificationCreatedEvent } from '@/hooks/useSSE';
import Sidebar from '@/components/restaurant/sidebar';
import TopBar from '@/components/restaurant/top-bar';
import BottomNav from '@/components/restaurant/bottom-nav';
import { StaffLayoutContext } from '@/contexts/staff-layout-context';
import NotificationDropdown from '@/components/restaurant/notification-dropdown';
import type {
  SidebarNavItem,
  SidebarVariant,
} from '@/components/restaurant/sidebar';
import type { BottomNavItem } from '@/components/restaurant/bottom-nav';

// ── Context type shared with child pages ─────────────────────────────────────

export interface StaffLayoutContext {
  lastEvent: StatusEvent | null;
}

function toStatusEvent(event: ReturnType<typeof useSSE>): StatusEvent | null {
  if (!event) return null;
  const t = event.eventType;
  if (t === 'status' || t === 'payment' || t === undefined)
    return event as StatusEvent;
  return null;
}

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAdmin, isChef, isEmployee, isStaff, t, token } =
    useAppContext();

  const lastEvent = useSSE(token);

  // Auth guard
  if (!user) {
    router.replace('/login');
    return null;
  }
  if (!isStaff) {
    router.replace('/menu');
    return null;
  }

  // Page-level role guard: CHEF can't access /server or /orders
  if (
    isChef &&
    !isAdmin &&
    (pathname.startsWith('/server') || pathname.startsWith('/orders'))
  ) {
    router.replace('/kitchen');
    return null;
  }
  // EMPLOYEE can't access /kitchen
  if (isEmployee && !isAdmin && pathname.startsWith('/kitchen')) {
    router.replace('/server');
    return null;
  }

  const notificationEvent =
    lastEvent?.eventType === 'notification.created'
      ? (lastEvent as NotificationCreatedEvent)
      : null;

  // Build nav items based on role
  const allNavItems: SidebarNavItem[] = [
    { id: 'kitchen', label: t.kitchen, href: '/kitchen', icon: ChefHat },
    { id: 'server', label: t.server, href: '/server', icon: Truck },
    {
      id: 'orders',
      label: t.adminOrders,
      href: '/orders',
      icon: ClipboardList,
    },
  ];

  const navItems = isAdmin
    ? allNavItems
    : isChef
      ? allNavItems.filter((n) => n.id === 'kitchen')
      : isEmployee
        ? allNavItems.filter((n) => n.id !== 'kitchen')
        : allNavItems;

  const bottomItems: BottomNavItem[] = navItems.map((n) => ({
    id: n.id,
    label: n.label,
    href: n.href,
    icon: n.icon,
  }));

  const activeId = pathname.startsWith('/server')
    ? 'server'
    : pathname.startsWith('/orders')
      ? 'orders'
      : 'kitchen';

  const topTitle =
    activeId === 'server'
      ? t.deliveryStation
      : activeId === 'orders'
        ? t.adminOrdersTitle
        : isEmployee
          ? t.deliveryStation
          : t.chefDashboard;

  const topSubtitle =
    activeId === 'server'
      ? t.serverSub
      : activeId === 'orders'
        ? t.adminOrdersSub
        : t.kitchenSub;

  // Sidebar/BottomNav visual variant per role
  const variant: SidebarVariant =
    isChef && !isAdmin
      ? 'chef'
      : isEmployee && !isAdmin
        ? 'employee'
        : 'customer';

  return (
    <div className='min-h-screen flex'>
      <Sidebar items={navItems} activeId={activeId} variant={variant} />

      <div className='flex-1 md:ml-64 flex flex-col'>
        <TopBar
          title={topTitle}
          subtitle={topSubtitle}
          right={<NotificationDropdown notificationEvent={notificationEvent} />}
        />

        <StaffLayoutContext.Provider
          value={{ lastEvent: toStatusEvent(lastEvent) }}
        >
          <main className='flex-1 pt-16 pb-16 md:pb-0'>{children}</main>
        </StaffLayoutContext.Provider>
      </div>

      <BottomNav items={bottomItems} activeId={activeId} variant={variant} />
    </div>
  );
}
