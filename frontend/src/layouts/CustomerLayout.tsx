import { useState } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { UtensilsCrossed, ClipboardList, ShoppingCart } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { useCart } from '../hooks/useCart';
import { useSSE, type StatusEvent } from '../hooks/useSSE';
import { api } from '../services/api';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { BottomNav } from '../components/BottomNav';
import { CartPanel } from '../components/CartPanel';
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
  lastEvent: StatusEvent | null;
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function CustomerLayout() {
  const { user, token, isStaff, logout } = useAuthContext();
  const { t } = useLang();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const { cart, addItem, removeItem, updateQty, clearCart, count } = useCart();
  const lastEvent = useSSE(token);

  const [cartOpen, setCartOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);

  // Role guards
  if (!user) return <Navigate to="/auth" replace />;
  if (isStaff) return <Navigate to="/kitchen" replace />;

  const navItems: NavItem[] = [
    { id: 'menu',   label: t.menu,   icon: UtensilsCrossed },
    { id: 'status', label: t.status, icon: ClipboardList   },
  ];

  const activeTab = pathname.startsWith('/status') ? 'status' : 'menu';
  const topTitle    = activeTab === 'status' ? t.orderStatus : t.ourMenu;
  const topSubtitle = activeTab === 'status' ? t.statusSub   : t.menuSub;

  const handlePlaceOrder = async (tableNumber: string) => {
    setPlacing(true);
    try {
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
    setPlacedOrder((p) => (p ? { ...p, status: 'Cancelled' as OrderStatus } : null));
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
    lastEvent,
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar
        items={navItems}
        active={activeTab}
        onChange={(id) => navigate(`/${id}`)}
        user={user}
        onLogout={logout}
      />

      <div className="flex-1 md:ml-64 flex flex-col">
        <TopBar
          title={topTitle}
          subtitle={topSubtitle}
          onLogout={logout}
          right={
            count > 0 ? (
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-all"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                  {count}
                </span>
              </button>
            ) : undefined
          }
        />

        <main className="flex-1">
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
        />
      )}
    </div>
  );
}
