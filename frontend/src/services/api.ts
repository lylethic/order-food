import type {
  MenuItem,
  Order,
  OrderStatus,
  Category,
  User,
  OrderDetail,
  OrderSummary,
  OrderItem,
} from '../types';

// In development the Vite proxy forwards /api/* → http://localhost:3001
// In production set VITE_API_URL to the backend's deployed origin
const BASE = import.meta.env.VITE_API_URL ?? '';

// ─── Token management ─────────────────────────────────────────────────────────

export const tokenStore = {
  get: (): string | null => localStorage.getItem('auth_token'),
  set: (token: string): void => {
    localStorage.setItem('auth_token', token);
  },
  clear: (): void => {
    localStorage.removeItem('auth_token');
  },
};

// ─── Response wrapper ─────────────────────────────────────────────────────────

interface ApiEnvelope<T> {
  success: boolean;
  status_code: number;
  message: string;
  message_en: string;
  data: T;
  errors: unknown[];
}

interface ListEnvelope<T> {
  data: T[];
  limit?: number;
  nextCursor?: string | number | null;
  hasNextPage?: boolean;
}

async function unwrap<T>(response: Response): Promise<T> {
  let body: ApiEnvelope<T>;
  try {
    body = await response.json();
  } catch {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  if (!body.success) {
    throw new Error(body.message_en || body.message || 'Request failed');
  }
  return body.data;
}

async function unwrapList<T>(response: Response): Promise<T[]> {
  const data = await unwrap<unknown>(response);

  if (Array.isArray(data)) {
    return data as T[];
  }

  if (
    data != null &&
    typeof data === 'object' &&
    Array.isArray((data as ListEnvelope<T>).data)
  ) {
    return (data as ListEnvelope<T>).data;
  }

  throw new Error('Unexpected list response shape');
}

// ─── Header helpers ───────────────────────────────────────────────────────────

function authHeaders(): HeadersInit {
  const token = tokenStore.get();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function jsonHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json', ...authHeaders() };
}

// ─── Normalisers ──────────────────────────────────────────────────────────────

function normalizeUser(raw: Record<string, unknown>): User {
  const role = raw.role;
  return {
    userId: String(raw.userId ?? raw.id ?? ''),
    email: String(raw.email ?? ''),
    name: raw.name != null ? String(raw.name) : undefined,
    role:
      typeof role === 'string'
        ? role
        : (role as Record<string, unknown>)?.name != null
          ? String((role as Record<string, unknown>).name)
          : 'Customer',
  };
}

function normalizeMenuItem(raw: Record<string, unknown>): MenuItem {
  const cat = raw.category;
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    description: String(raw.description ?? ''),
    price: Number(raw.price ?? 0),
    image: raw.image != null ? String(raw.image) : undefined,
    category:
      typeof cat === 'string'
        ? cat
        : (cat as Record<string, unknown>)?.name != null
          ? String((cat as Record<string, unknown>).name)
          : String(raw.categoryName ?? ''),
    isAvailable: raw.isAvailable !== false && raw.is_available !== false,
  };
}

function normalizeOrderSummary(raw: Record<string, unknown>): OrderSummary {
  return {
    id: String(raw.id ?? ''),
    ticketNumber: String(raw.ticketNumber ?? raw.ticket_number ?? ''),
    table: String(raw.table ?? raw.table_number ?? ''),
    status: String(raw.status ?? 'Received') as OrderStatus,
    timestamp: String(raw.timestamp ?? ''),
    itemCount: Number(raw.itemCount ?? raw.item_count ?? 0),
    total: Number(raw.total ?? 0),
  };
}

function normalizeOrderItem(raw: Record<string, unknown>): OrderItem {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? raw.name_at_order ?? ''),
    qty: Number(raw.qty ?? 0),
    price: Number(raw.price ?? raw.price_at_order ?? 0),
    modifications: Array.isArray(raw.modifications)
      ? raw.modifications.map((item) => String(item))
      : [],
    image: raw.image != null ? String(raw.image) : undefined,
  };
}

function normalizeOrderDetail(raw: Record<string, unknown>): OrderDetail {
  const summary = normalizeOrderSummary(raw);
  return {
    ...summary,
    items: Array.isArray(raw.items)
      ? raw.items.map((item) =>
          normalizeOrderItem(item as Record<string, unknown>),
        )
      : [],
  };
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const api = {
  // --- Auth ---

  async login(email: string, password: string): Promise<{ token: string }> {
    const r = await fetch(`${BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return unwrap<{ token: string }>(r);
  },

  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<{ token?: string }> {
    const r = await fetch(`${BASE}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return unwrap<{ token?: string }>(r);
  },

  async me(): Promise<User> {
    const r = await fetch(`${BASE}/api/v1/auth/me`, { headers: authHeaders() });
    const raw = await unwrap<Record<string, unknown>>(r);
    return normalizeUser(raw);
  },

  // --- Categories ---

  async getCategories(): Promise<Category[]> {
    const r = await fetch(`${BASE}/api/v1/categories`);
    return unwrapList<Category>(r);
  },

  // --- Menu Items ---

  async getMenuItems(): Promise<MenuItem[]> {
    const r = await fetch(`${BASE}/api/v1/menuItems`);
    const raw = await unwrapList<Record<string, unknown>>(r);
    return raw.map(normalizeMenuItem);
  },

  async getMenuItem(id: number): Promise<MenuItem[]> {
    const r = await fetch(`${BASE}/api/v1/menuItems/${id}`);
    const raw = await unwrapList<Record<string, unknown>>(r);
    return raw.map(normalizeMenuItem);
  },

  // --- Orders ---

  async getOrders(status?: string): Promise<Order[]> {
    const url = status
      ? `${BASE}/api/v1/orders?status=${encodeURIComponent(status)}`
      : `${BASE}/api/v1/orders`;
    const r = await fetch(url, { headers: authHeaders() });
    return unwrap<Order[]>(r);
  },

  async getCustomerOrders() {
    const r = await fetch(`${BASE}/api/v1/orders/my`, {
      headers: authHeaders(),
    });
    const raw = await unwrapList<Record<string, unknown>>(r);
    return raw.map(normalizeOrderSummary);
  },

  async getCustomerOrderDetail(id: string | number): Promise<OrderDetail> {
    const r = await fetch(`${BASE}/api/v1/orders/${id}`, {
      headers: authHeaders(),
    });
    const raw = await unwrap<Record<string, unknown>>(r);
    return normalizeOrderDetail(raw);
  },

  async createOrder(data: {
    tableNumber: string;
    items: Array<{ menuItemId: string; qty: number; modifications?: string[] }>;
  }): Promise<{
    id: string;
    ticketNumber: string;
    table: string;
    status: string;
  }> {
    const r = await fetch(`${BASE}/api/v1/orders`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    });
    return unwrap(r);
  },

  async updateOrderStatus(
    id: string,
    status: OrderStatus,
  ): Promise<{ id: string; status: string }> {
    const r = await fetch(`${BASE}/api/v1/orders/${id}/status`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify({ status }),
    });
    return unwrap(r);
  },

  async cancelOrder(id: string): Promise<{ id: string; status: string }> {
    const r = await fetch(`${BASE}/api/v1/orders/${id}/cancel`, {
      method: 'PUT',
      headers: jsonHeaders(),
    });
    return unwrap(r);
  },
};
