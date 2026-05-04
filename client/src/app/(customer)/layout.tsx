'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  UtensilsCrossed,
  ClipboardList,
  ShoppingCart,
  ScanQrCode,
} from 'lucide-react';
import { useAppContext } from '@/app/app-provider';
import { useSSE } from '@/hooks/useSSE';
import type {
  StatusEvent,
  CommentRepliedEvent,
  NotificationCreatedEvent,
} from '@/hooks/useSSE';
import orderApiRequest from '@/apiRequests/order';
import authApiRequest from '@/apiRequests/auth';
import Sidebar from '@/components/restaurant/sidebar';
import TopBar from '@/components/restaurant/top-bar';
import BottomNav from '@/components/restaurant/bottom-nav';
import CartPanel from '@/components/restaurant/cart-panel';
import NotificationDropdown from '@/components/restaurant/notification-dropdown';
import { CustomerLayoutContext } from '@/contexts/customer-layout-context';
import type {
  PlacedOrderType,
  OrderStatusType,
} from '@/schemaValidations/order.schema';
import type { SidebarNavItem } from '@/components/restaurant/sidebar';
import type { BottomNavItem } from '@/components/restaurant/bottom-nav';

function toStatusEvent(event: ReturnType<typeof useSSE>): StatusEvent | null {
  if (!event) return null;
  const t = event.eventType;
  if (t === 'status' || t === 'payment' || t === undefined)
    return event as StatusEvent;
  return null;
}

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    user,
    isAdmin,
    isChef,
    isEmployee,
    isStaff,
    t,
    cart,
    clearCart,
    token,
    tableSession,
  } = useAppContext();

  const lastEvent = useSSE(token);

  const [cartOpen, setCartOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrderType | null>(null);

  // Redirect staff to their home page
  if (isAdmin) {
    router.replace('/admin/categories');
    return null;
  }
  if (isChef) {
    router.replace('/kitchen');
    return null;
  }
  if (isEmployee) {
    router.replace('/server');
    return null;
  }

  const isGuest = !user;

  const notificationEvent =
    lastEvent?.eventType === 'notification.created'
      ? (lastEvent as NotificationCreatedEvent)
      : null;

  const navItems: SidebarNavItem[] = [
    { id: 'menu', label: t.menu, href: '/menu', icon: UtensilsCrossed },
    { id: 'status', label: t.status, href: '/status', icon: ClipboardList },
  ];

  const bottomItems: BottomNavItem[] = navItems.map((n) => ({
    id: n.id,
    label: n.label,
    href: n.href,
    icon: n.icon,
  }));

  const activeId = pathname.startsWith('/status') ? 'status' : 'menu';
  const topTitle = activeId === 'status' ? t.orderStatus : t.ourMenu;
  const topSubtitle = tableSession
    ? `${t.qrTableBadge} ${tableSession.tableNumber} · ${t.qrVerifiedBadge}`
    : activeId === 'status'
      ? t.statusSub
      : t.menuSub;

  const handlePlaceOrder = async (
    tableNumber: string,
    guestName?: string,
    guestPhone?: string,
  ) => {
    setPlacing(true);
    try {
      // Guest: create a guest session first
      if (isGuest && guestName && guestPhone) {
        const guestRes = await authApiRequest.guestRegister({
          name: guestName,
          phone: guestPhone,
        });
        const { token: guestToken, user: guestUser } = guestRes.payload.data;
        const expiresAt =
          typeof window !== 'undefined'
            ? (localStorage.getItem('sessionTokenExpiresAt') ?? '')
            : '';
        await authApiRequest.auth({
          sessionToken: guestToken,
          expiresAt,
          role: Array.isArray(guestUser.role)
            ? String(guestUser.role[0])
            : String(guestUser.role ?? 'GUEST'),
        });
      }

      const res = await orderApiRequest.create({
        tableNumber,
        items: cart.map((c) => ({
          menuItemId: c.menuItemId,
          qty: c.qty,
          modifications: c.modifications,
        })),
        guestName: isGuest ? guestName : undefined,
        guestPhone: isGuest ? guestPhone : undefined,
      });

      const order = res.payload.data as Record<string, unknown>;
      setPlacedOrder({
        id: String(order.id ?? ''),
        ticketNumber: String(order.ticketNumber ?? order.ticket_number ?? ''),
        table: String(order.table ?? order.table_number ?? ''),
        status: String(order.status ?? 'Received') as OrderStatusType,
        total: Number(order.total ?? 0),
      });
      clearCart();
      setCartOpen(false);
      router.push('/status');
    } finally {
      setPlacing(false);
    }
  };

  const onCancelOrder = async () => {
    if (!placedOrder) return;
    await orderApiRequest.cancel(placedOrder.id);
    setPlacedOrder((p) =>
      p ? { ...p, status: 'Cancelled' as OrderStatusType } : null,
    );
  };

  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const commentRepliedEvent =
    lastEvent?.eventType === 'comment.replied'
      ? (lastEvent as CommentRepliedEvent)
      : null;

  return (
    <div className='min-h-screen flex'>
      <Sidebar items={navItems} activeId={activeId} />

      <div className='flex-1 md:ml-64 flex flex-col'>
        <TopBar
          title={topTitle}
          subtitle={topSubtitle}
          right={
            <div className='flex items-center gap-1'>
              {tableSession && (
                <div className='hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-xs font-semibold'>
                  <ScanQrCode className='w-3.5 h-3.5' />
                  {t.qrTableBadge} {tableSession.tableNumber}
                </div>
              )}
              <NotificationDropdown notificationEvent={notificationEvent} />
              {cartCount > 0 && (
                <button
                  onClick={() => setCartOpen(true)}
                  className='relative p-2 hover:bg-accent rounded-xl transition-all'
                >
                  <ShoppingCart className='w-5 h-5' />
                  <span className='absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center'>
                    {cartCount}
                  </span>
                </button>
              )}
            </div>
          }
        />

        <CustomerLayoutContext.Provider
          value={{
            placedOrder,
            onCancelOrder,
            lastEvent: toStatusEvent(lastEvent),
            commentRepliedEvent,
            onOpenCart: () => setCartOpen(true),
          }}
        >
          <main className='flex-1 pt-2 pb-2 md:pb-0'>{children}</main>
        </CustomerLayoutContext.Provider>
      </div>

      <BottomNav items={bottomItems} activeId={activeId} />

      {cartOpen && (
        <CartPanel
          onClose={() => setCartOpen(false)}
          onPlaceOrder={handlePlaceOrder}
          isPlacing={placing}
          isGuest={isGuest}
        />
      )}
    </div>
  );
}
