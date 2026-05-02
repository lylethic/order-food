import { useState } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { UtensilsCrossed, ClipboardList, ShoppingCart, ScanQrCode } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { useTableSession } from '../context/TableContext';
import { useCart } from '../hooks/useCart';
import { useSSE } from '../hooks/useSSE';
import type { SSEEvent, StatusEvent, CommentRepliedEvent, NotificationCreatedEvent } from '../hooks/useSSE';

function toStatusEvent(event: SSEEvent | null): StatusEvent | null {
  if (!event) return null;
  const t = event.eventType;
  if (t === 'status' || t === 'payment' || t === undefined) return event as StatusEvent;
  return null;
}
import { api } from '../services/api';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { BottomNav } from '../components/BottomNav';
import { CartPanel } from '../components/CartPanel';
import { NotificationDropdown } from '../components/NotificationDropdown';
import type { CartItem, NavItem, OrderStatus, PlacedOrder } from '../types';

// ─── Outlet context type ──────────────────────────────────────────────────────

export interface CustomerOutletContext {
  cart: CartItem[];
  cartCount: number;
  addItem: (item: Omit<CartItem, 'qty' | 'modifications'>) => void;
  updateQty: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  onOpenCart: () => void;
  placedOrder: PlacedOrder | null;
  onCancelOrder: () => Promise<void>;
  /** Order status/payment events only — backward-compatible with existing pages */
  lastEvent: StatusEvent | null;
  commentRepliedEvent: CommentRepliedEvent | null;
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function CustomerLayout() {
  const { user, token, isStaff, isLoading, logout, guestLogin } = useAuthContext();
  const { t } = useLang();
  const { tableSession } = useTableSession();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const { cart, addItem, removeItem, updateQty, clearCart, count } = useCart();
  const lastEvent = useSSE(token);

  const [cartOpen, setCartOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);

  // Role guards
  if (isLoading) return null;
  if (isStaff) return <Navigate to='/kitchen' replace />;

  const isGuest = !user;

  // Dispatch SSE events by type
  const commentRepliedEvent =
    lastEvent?.eventType === 'comment.replied' ? (lastEvent as CommentRepliedEvent) : null;
  const notificationEvent =
    lastEvent?.eventType === 'notification.created'
      ? (lastEvent as NotificationCreatedEvent)
      : null;

  const navItems: NavItem[] = [
    { id: 'menu', label: t.menu, icon: UtensilsCrossed },
    { id: 'status', label: t.status, icon: ClipboardList },
  ];

  const activeTab = pathname.startsWith('/status') ? 'status' : 'menu';
  const topTitle = activeTab === 'status' ? t.orderStatus : t.ourMenu;
  const topSubtitle = tableSession
    ? `${t.qrTableBadge} ${tableSession.tableNumber} · ${t.qrVerifiedBadge}`
    : activeTab === 'status'
      ? t.statusSub
      : t.menuSub;

  const handlePlaceOrder = async (tableNumber: string, guestName?: string, guestPhone?: string) => {
    setPlacing(true);
    try {
      if (isGuest && guestName && guestPhone) {
        await guestLogin(guestName, guestPhone);
      }
      const order = await api.createOrder({
        tableNumber,
        items: cart.map((c) => ({
          menuItemId: c.menuItemId,
          qty: c.qty,
          modifications: c.modifications,
        })),
      });
      setPlacedOrder({
        id: order.id,
        ticketNumber: order.ticketNumber,
        table: order.table,
        status: order.status as OrderStatus,
        total: order.total,
      });
      clearCart();
      setCartOpen(false);
      navigate('/status');
    } finally {
      setPlacing(false);
    }
  };

  const onCancelOrder = async () => {
    if (!placedOrder) return;
    await api.cancelOrder(placedOrder.id);
    setPlacedOrder((p) =>
      p ? { ...p, status: 'Cancelled' as OrderStatus } : null,
    );
  };

  const outletCtx: CustomerOutletContext = {
    cart,
    cartCount: count,
    addItem,
    updateQty,
    removeItem,
    onOpenCart: () => setCartOpen(true),
    placedOrder,
    onCancelOrder,
    lastEvent: toStatusEvent(lastEvent),
    commentRepliedEvent,
  };

  return (
    <div className='min-h-screen bg-slate-50 flex'>
      <Sidebar
        items={navItems}
        active={activeTab}
        onChange={(id) => navigate(`/${id}`)}
        user={user ?? { userId: '', email: '', name: t.guestUser, img: null, role: ['CUSTOMER'] }}
        onLogout={isGuest ? () => navigate('/auth') : logout}
      />

      <div className='flex-1 md:ml-64 flex flex-col'>
        <TopBar
          title={topTitle}
          subtitle={topSubtitle}
          onLogout={logout}
          right={
            <div className='flex items-center gap-1'>
              {/* Table badge when QR verified */}
              {tableSession && (
                <div className='hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-xs font-semibold'>
                  <ScanQrCode className='w-3.5 h-3.5' />
                  {t.qrTableBadge} {tableSession.tableNumber}
                </div>
              )}

              {/* Notification bell */}
              <NotificationDropdown notificationEvent={notificationEvent} />

              {/* Cart button */}
              {count > 0 && (
                <button
                  onClick={() => setCartOpen(true)}
                  className='relative p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-all'
                >
                  <ShoppingCart className='w-5 h-5' />
                  <span className='absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center'>
                    {count}
                  </span>
                </button>
              )}
            </div>
          }
        />

        <main className='flex-1'>
          <Outlet context={outletCtx} />
        </main>
      </div>

      <BottomNav
        items={navItems}
        active={activeTab}
        onChange={(id) => navigate(`/${id}`)}
      />

      {cartOpen && (
        <CartPanel
          cart={cart}
          onClose={() => setCartOpen(false)}
          onUpdateQty={updateQty}
          onRemove={removeItem}
          onPlaceOrder={handlePlaceOrder}
          isPlacing={placing}
          isGuest={isGuest}
        />
      )}
    </div>
  );
}
