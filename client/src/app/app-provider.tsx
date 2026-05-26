'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AuthUserType } from '@/schemaValidations/auth.schema';
import { CartItemType } from '@/schemaValidations/order.schema';
import { translations, type Language, type TranslationKeys } from '@/lib/translations';

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
  addItem: (item: Omit<CartItemType, 'qty' | 'modifications'>) => void;
  removeItem: (menuItemId: string) => void;
  updateQty: (menuItemId: string, qty: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;

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
  addItem: () => {},
  removeItem: () => {},
  updateQty: () => {},
  clearCart: () => {},
  cartTotal: 0,
  cartCount: 0,

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
      ? (document.cookie.match(/(?:^|; )accessToken=([^;]*)/))?.[1] ?? null
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

  const addItem = useCallback(
    (item: Omit<CartItemType, 'qty' | 'modifications'>) => {
      setCart((prev) => {
        const existing = prev.find((c) => c.menuItemId === item.menuItemId);
        if (existing) {
          return prev.map((c) =>
            c.menuItemId === item.menuItemId ? { ...c, qty: c.qty + 1 } : c,
          );
        }
        return [...prev, { ...item, qty: 1, modifications: [] }];
      });
    },
    [],
  );

  const removeItem = useCallback((menuItemId: string) => {
    setCart((prev) => prev.filter((c) => c.menuItemId !== menuItemId));
  }, []);

  const updateQty = useCallback((menuItemId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((c) => c.menuItemId !== menuItemId));
    } else {
      setCart((prev) =>
        prev.map((c) => (c.menuItemId === menuItemId ? { ...c, qty } : c)),
      );
    }
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = useMemo(
    () => cart.reduce((sum, c) => sum + c.price * c.qty, 0),
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
      cart, cartTotal, cartCount,
      tableSession,
      lang,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
