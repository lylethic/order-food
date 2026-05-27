'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AuthUserType } from '@/schemaValidations/auth.schema';
import { CartItemType } from '@/schemaValidations/order.schema';
import { translations, type Language, type TranslationKeys } from '@/lib/translations';
import { getCookie, setCookie } from '@/lib/cookieUtils';
import cartApiRequest from '@/apiRequests/cart';

// ── Types ─────────────────────────────────────────────────────────────────────

type User = AuthUserType;

export interface TableSession {
  tableNumber: string;
  verifiedAt: string;
  source: 'qr' | 'manual';
}

// ── Derived role helpers ───────────────────────────────────────────────────────

const STAFF_ROLES = new Set(['ADMIN', 'EMPLOYEE', 'CHEF']);

function getRoles(user: User | null): string[] {
  if (!user) return [];
  if (Array.isArray(user.role)) return user.role.map(String);
  if (typeof user.role === 'string') return [user.role];
  if (user.roleId) return [user.roleId];
  return [];
}

// ── Context type ──────────────────────────────────────────────────────────────

interface AppContextValue {
  // Auth
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isChef: boolean;
  isEmployee: boolean;
  isStaff: boolean;
  token: string | null;
  logout: () => void;

  // Cart
  cart: CartItemType[];
  addItem: (item: { menuItemId: string; modifications?: string[]; qty?: number }) => Promise<void>;
  removeItem: (id: string, isMenuItemId?: boolean) => Promise<void>;
  updateQty: (id: string, qty: number, isMenuItemId?: boolean) => Promise<void>;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  refreshCart: () => Promise<void>;

  // Table session
  tableSession: TableSession | null;
  setTableSession: (session: TableSession | null) => void;
  clearTableSession: () => void;

  // Language
  lang: Language;
  setLang: (l: Language) => void;
  t: TranslationKeys;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue>({
  user: null,
  setUser: () => {},
  isAuthenticated: false,
  isAdmin: false,
  isChef: false,
  isEmployee: false,
  isStaff: false,
  token: null,
  logout: () => {},

  cart: [],
  addItem: async () => {},
  removeItem: async () => {},
  updateQty: async () => {},
  clearCart: () => {},
  cartTotal: 0,
  cartCount: 0,
  refreshCart: async () => {},

  tableSession: null,
  setTableSession: () => {},
  clearTableSession: () => {},

  lang: 'vi',
  setLang: () => {},
  t: translations.vi,
});

export const useAppContext = () => useContext(AppContext);

// ── Storage helpers ───────────────────────────────────────────────────────────

const TABLE_SESSION_KEY = 'table_session';

function readTableSession(): TableSession | null {
  try {
    const raw =
      typeof window !== 'undefined'
        ? sessionStorage.getItem(TABLE_SESSION_KEY)
        : null;
    return raw ? (JSON.parse(raw) as TableSession) : null;
  } catch {
    return null;
  }
}

function readStoredUser(): User | null {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────

export default function AppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // ── Auth ───────────────────────────────────────────────────────────────────
  const [user, setUserState] = useState<User | null>(null);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    if (typeof window === 'undefined') return;
    if (u) {
      localStorage.setItem('user', JSON.stringify(u));
    } else {
      localStorage.removeItem('user');
    }
  }, []);

  const token =
    typeof window !== 'undefined'
      ? getCookie('accessToken') ?? null
      : null;

  const isAuthenticated = Boolean(user);
  const roles = getRoles(user);
  const isAdmin = roles.some((r) => r.toUpperCase() === 'ADMIN');
  const isChef = roles.some((r) => r.toUpperCase() === 'CHEF');
  const isEmployee = roles.some((r) => r.toUpperCase() === 'EMPLOYEE');
  const isStaff = roles.some((r) => STAFF_ROLES.has(r.toUpperCase()));

  const logout = useCallback(() => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }),
      }).finally(() => {
        window.location.href = '/login';
      });
    }
  }, [setUser]);

  // Hydrate user from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    setUserState(readStoredUser());
  }, []);

  // ── Cart ───────────────────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItemType[]>([]);

  const refreshCart = useCallback(async () => {
    try {
      const res = await cartApiRequest.getCart();
      const cartData = res.payload.data;
      const mappedItems: CartItemType[] = cartData.cart_items.map((item) => {
        // Safe price parsing to handle potential Decimal objects or strings
        let price = 0;
        const rawPrice = item.menu_items.price;
        if (typeof rawPrice === 'number') {
          price = rawPrice;
        } else if (typeof rawPrice === 'string') {
          price = Number(rawPrice);
        } else if (rawPrice && typeof rawPrice === 'object') {
          // Fallback for complex objects like Prisma Decimal {s, e, d}
          if ('toNumber' in rawPrice && typeof (rawPrice as any).toNumber === 'function') {
            price = (rawPrice as any).toNumber();
          } else if ('d' in rawPrice && Array.isArray((rawPrice as any).d)) {
            // Very specific fallback for the Decimal.js internal structure
            price = (rawPrice as any).d[0];
          }
        }

        return {
          id: item.id,
          menuItemId: item.menu_item_id,
          name: item.menu_items.name,
          price: price,
          qty: item.quantity,
          modifications: item.modifications,
          image: item.menu_items.menu_item_images[0]?.image_url,
        };
      });
      setCart(mappedItems);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    }
  }, []);

  // Initialize sessionId if not exists
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let sid = getCookie('sessionId');
      if (!sid) {
        // Fallback for non-secure contexts where crypto.randomUUID might be missing
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          sid = crypto.randomUUID();
        } else {
          sid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
        }
        setCookie('sessionId', sid, 30);
      }
      refreshCart();
    }
  }, [refreshCart, user]);

  const addItem = useCallback(
    async (item: { menuItemId: string; modifications?: string[]; qty?: number }) => {
      try {
        await cartApiRequest.add({
          menu_item_id: item.menuItemId,
          quantity: item.qty ?? 1,
          modifications: item.modifications ?? [],
        });
        await refreshCart();
      } catch (error) {
        console.error('Failed to add to cart:', error);
      }
    },
    [refreshCart],
  );

  const removeItem = useCallback(
    async (id: string, isMenuItemId = false) => {
      try {
        let cartItemId = id;
        if (isMenuItemId) {
          const item = cart.find((c) => c.menuItemId === id);
          if (!item || !item.id) return;
          cartItemId = item.id;
        }
        await cartApiRequest.removeItem(cartItemId);
        await refreshCart();
      } catch (error) {
        console.error('Failed to remove from cart:', error);
      }
    },
    [cart, refreshCart],
  );

  const updateQty = useCallback(
    async (id: string, qty: number, isMenuItemId = false) => {
      try {
        let cartItemId = id;
        if (isMenuItemId) {
          const item = cart.find((c) => c.menuItemId === id);
          if (!item || !item.id) return;
          cartItemId = item.id;
        }
        if (qty <= 0) {
          await cartApiRequest.removeItem(cartItemId);
        } else {
          await cartApiRequest.updateItem(cartItemId, { quantity: qty });
        }
        await refreshCart();
      } catch (error) {
        console.error('Failed to update qty:', error);
      }
    },
    [cart, refreshCart],
  );

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = useMemo(
    () => cart.reduce((sum, c) => sum + Number(c.price) * c.qty, 0),
    [cart],
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, c) => sum + c.qty, 0),
    [cart],
  );

  // ── Table session ──────────────────────────────────────────────────────────
  const [tableSession, setTableSessionState] = useState<TableSession | null>(null);

  useEffect(() => {
    setTableSessionState(readTableSession());
  }, []);

  const setTableSession = useCallback((session: TableSession | null) => {
    setTableSessionState(session);
    if (typeof window === 'undefined') return;
    if (session) {
      sessionStorage.setItem(TABLE_SESSION_KEY, JSON.stringify(session));
    } else {
      sessionStorage.removeItem(TABLE_SESSION_KEY);
    }
  }, []);

  const clearTableSession = useCallback(() => setTableSession(null), [setTableSession]);

  // ── Language ───────────────────────────────────────────────────────────────
  const [lang, setLang] = useState<Language>('vi');
  const t = translations[lang];

  // ── Context value ──────────────────────────────────────────────────────────
  const value = useMemo<AppContextValue>(
    () => ({
      user,
      setUser,
      isAuthenticated,
      isAdmin,
      isChef,
      isEmployee,
      isStaff,
      token,
      logout,

      cart,
      addItem,
      removeItem,
      updateQty,
      clearCart,
      cartTotal,
      cartCount,
      refreshCart,

      tableSession,
      setTableSession,
      clearTableSession,

      lang,
      setLang,
      t,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      user, isAuthenticated, isAdmin, isChef, isEmployee, isStaff, token,
      cart, cartTotal, cartCount, refreshCart,
      tableSession,
      lang,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
