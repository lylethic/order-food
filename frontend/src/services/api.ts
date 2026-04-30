import type {
  MenuItem,
  MenuItemDetail,
  Order,
  OrderStatus,
  PaymentMethod,
  Category,
  User,
  AdminUser,
  Role,
  OrderDetail,
  OrderSummary,
  OrderItem,
  Comment,
  Notification,
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
    img: raw.img != null ? String(raw.img) : null,
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
    categoryId:
      typeof cat === 'object' && cat != null
        ? String((cat as Record<string, unknown>).id ?? '')
        : String(raw.category_id ?? ''),
    isAvailable: raw.isAvailable !== false && raw.is_available !== false,
    rating: raw.rating != null ? Number(raw.rating) : undefined,
    commentCount:
      raw.commentCount != null
        ? Number(raw.commentCount)
        : raw.comment_count != null
          ? Number(raw.comment_count)
          : undefined,
    tag: raw.tag != null ? String(raw.tag) : undefined,
  };
}

function normalizeMenuItemDetail(raw: Record<string, unknown>): MenuItemDetail {
  const base = normalizeMenuItem(raw);
  const imgs = Array.isArray(raw.images) ? raw.images : [];
  return {
    ...base,
    images: imgs.map((img: Record<string, unknown>) => ({
      id: String(img.id ?? ''),
      image_url: String(img.image_url ?? ''),
      is_primary: Boolean(img.is_primary),
      display_order: Number(img.display_order ?? 0),
    })),
  };
}

function normalizeOrderSummary(raw: Record<string, unknown>): OrderSummary {
  return {
    id: String(raw.id ?? ''),
    ticketNumber: String(raw.ticketNumber ?? raw.ticket_number ?? ''),
    table: String(raw.table ?? raw.table_number ?? ''),
    status: String(raw.status ?? 'Received') as OrderStatus,
    isPaid: Boolean(raw.isPaid ?? raw.is_paid ?? false),
    paymentMethod:
      raw.paymentMethod != null
        ? (String(raw.paymentMethod) as PaymentMethod)
        : raw.payment_method != null
          ? (String(raw.payment_method) as PaymentMethod)
          : undefined,
    paidAt:
      raw.paidAt != null
        ? String(raw.paidAt)
        : raw.paid_at != null
          ? String(raw.paid_at)
          : undefined,
    timestamp: String(raw.timestamp ?? ''),
    itemCount: Number(raw.itemCount ?? raw.item_count ?? 0),
    total: Number(raw.total ?? 0),
  };
}

function normalizeOrderItem(raw: Record<string, unknown>): OrderItem {
  return {
    id: String(raw.id ?? ''),
    menuItemId: raw.menuItemId != null ? String(raw.menuItemId) : undefined,
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

  async uploadAvatar(userId: string, file: File): Promise<User> {
    const form = new FormData();
    form.append('file', file);
    const r = await fetch(`${BASE}/api/v1/users/${userId}/avatar`, {
      method: 'PUT',
      headers: authHeaders(),
      body: form,
    });
    const raw = await unwrap<Record<string, unknown>>(r);
    return normalizeUser(raw);
  },

  // --- Categories ---

  async getCategories(): Promise<Category[]> {
    const r = await fetch(`${BASE}/api/v1/categories`);
    return unwrapList<Category>(r);
  },

  // --- Menu Items ---

  async getMenuItems(categoryId?: string): Promise<MenuItem[]> {
    const params = new URLSearchParams({ limit: '100' });
    if (categoryId) params.set('categoryId', categoryId);
    const r = await fetch(`${BASE}/api/v1/menuItems?${params}`);
    const raw = await unwrapList<Record<string, unknown>>(r);
    return raw.map(normalizeMenuItem);
  },

  async getMenuItemDetail(id: string): Promise<MenuItemDetail> {
    const r = await fetch(`${BASE}/api/v1/menuItems/${id}`);
    const raw = await unwrap<Record<string, unknown>>(r);
    return normalizeMenuItemDetail(raw);
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
    total: number;
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

  async markOrderPaid(
    id: string,
    paymentMethod: PaymentMethod,
  ): Promise<{
    id: string;
    isPaid: boolean;
    paymentMethod: PaymentMethod;
    paidAt: string;
  }> {
    const r = await fetch(`${BASE}/api/v1/orders/${id}/payment`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify({ paymentMethod }),
    });
    return unwrap(r);
  },

  // --- Admin: Categories ---

  async adminCreateCategory(name: string): Promise<Category> {
    const r = await fetch(`${BASE}/api/v1/categories`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ name }),
    });
    const raw = await unwrap<Record<string, unknown>>(r);
    return { id: String(raw.id ?? ''), name: String(raw.name ?? '') };
  },

  async adminUpdateCategory(id: string, name: string): Promise<Category> {
    const r = await fetch(`${BASE}/api/v1/categories/${id}`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify({ name }),
    });
    const raw = await unwrap<Record<string, unknown>>(r);
    return { id: String(raw.id ?? ''), name: String(raw.name ?? '') };
  },

  async adminDeleteCategory(id: string): Promise<void> {
    const r = await fetch(`${BASE}/api/v1/categories/${id}`, {
      method: 'DELETE',
      headers: jsonHeaders(),
    });
    await unwrap(r);
  },

  // --- Admin: Menu Items ---

  async adminCreateMenuItem(data: {
    category_id: number;
    name: string;
    description: string;
    price: number;
    tag?: string;
  }): Promise<MenuItem> {
    const r = await fetch(`${BASE}/api/v1/menuItems`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({
        category_id: data.category_id,
        name: data.name,
        description: data.description,
        price: data.price,
        image: '',
        rating: 0,
        tag: data.tag ?? '',
      }),
    });
    const raw = await unwrap<Record<string, unknown>>(r);
    return normalizeMenuItem(raw);
  },

  async adminUpdateMenuItem(
    id: string,
    data: {
      category_id: number;
      name: string;
      description: string;
      price: number;
      tag?: string;
    },
  ): Promise<MenuItem> {
    const r = await fetch(`${BASE}/api/v1/menuItems/${id}`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify({
        category_id: data.category_id,
        name: data.name,
        description: data.description,
        price: data.price,
        image: '',
        rating: 0,
        tag: data.tag ?? '',
      }),
    });
    const raw = await unwrap<Record<string, unknown>>(r);
    return normalizeMenuItem(raw);
  },

  async adminDeleteMenuItem(id: string): Promise<void> {
    const r = await fetch(`${BASE}/api/v1/menuItems/${id}`, {
      method: 'DELETE',
      headers: jsonHeaders(),
    });
    await unwrap(r);
  },

  async adminUploadMenuItemImages(
    id: string,
    files: File[],
    primaryIndex?: number,
  ): Promise<MenuItemDetail> {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    if (primaryIndex !== undefined)
      form.append('primaryIndex', String(primaryIndex));
    const r = await fetch(`${BASE}/api/v1/menuItems/${id}/images`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    });
    const raw = await unwrap<Record<string, unknown>>(r);
    return normalizeMenuItemDetail(raw);
  },

  async adminDeleteMenuItemImage(
    menuItemId: string,
    imageId: string,
  ): Promise<MenuItemDetail> {
    const r = await fetch(
      `${BASE}/api/v1/menuItems/${menuItemId}/images/${imageId}`,
      {
        method: 'DELETE',
        headers: jsonHeaders(),
      },
    );
    const raw = await unwrap<Record<string, unknown>>(r);
    return normalizeMenuItemDetail(raw);
  },

  // --- Admin: Users ---

  async adminGetUsers(): Promise<AdminUser[]> {
    const r = await fetch(`${BASE}/api/v1/users?limit=100`, {
      headers: authHeaders(),
    });
    const raw = await unwrapList<Record<string, unknown>>(r);
    return raw.map((u) => ({
      id: String(u.id ?? ''),
      username: String(u.username ?? ''),
      email: String(u.email ?? ''),
      name: u.name != null ? String(u.name) : null,
      img: u.img != null ? String(u.img) : null,
      active: Boolean(u.active !== false),
      deleted: Boolean(u.deleted),
      created: String(u.created ?? ''),
      updated: String(u.updated ?? ''),
    }));
  },

  async adminCreateUser(data: {
    username: string;
    email: string;
    password: string;
    name?: string;
  }): Promise<AdminUser> {
    const r = await fetch(`${BASE}/api/v1/users`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    });
    const raw = await unwrap<Record<string, unknown>>(r);
    return {
      id: String(raw.id ?? ''),
      username: String(raw.username ?? ''),
      email: String(raw.email ?? ''),
      name: raw.name != null ? String(raw.name) : null,
      img: raw.img != null ? String(raw.img) : null,
      active: Boolean(raw.active !== false),
      deleted: Boolean(raw.deleted),
      created: String(raw.created ?? ''),
      updated: String(raw.updated ?? ''),
    };
  },

  async adminUpdateUser(
    id: string,
    data: { username: string; name?: string; active?: boolean },
  ): Promise<AdminUser> {
    const r = await fetch(`${BASE}/api/v1/users/${id}`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    });
    const raw = await unwrap<Record<string, unknown>>(r);
    return {
      id: String(raw.id ?? ''),
      username: String(raw.username ?? ''),
      email: String(raw.email ?? ''),
      name: raw.name != null ? String(raw.name) : null,
      img: raw.img != null ? String(raw.img) : null,
      active: Boolean(raw.active !== false),
      deleted: Boolean(raw.deleted),
      created: String(raw.created ?? ''),
      updated: String(raw.updated ?? ''),
    };
  },

  async adminDeleteUser(id: string): Promise<void> {
    const r = await fetch(`${BASE}/api/v1/users/${id}`, {
      method: 'DELETE',
      headers: jsonHeaders(),
    });
    await unwrap(r);
  },

  // --- Admin: Roles ---

  async getRoles(): Promise<Role[]> {
    const r = await fetch(`${BASE}/api/v1/roles?limit=50`, {
      headers: authHeaders(),
    });
    const raw = await unwrapList<Record<string, unknown>>(r);
    return raw.map((role) => ({
      id: String(role.id ?? ''),
      name: String(role.name ?? ''),
      active: Boolean(role.active !== false),
      deleted: Boolean(role.deleted),
    }));
  },

  async adminAssignRole(userId: string, roleId: string): Promise<void> {
    const r = await fetch(`${BASE}/api/v1/roles/${userId}/assign`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ roleId: Number(roleId) }),
    });
    await unwrap(r);
  },

  async adminRemoveRole(userId: string, roleId: string): Promise<void> {
    const r = await fetch(`${BASE}/api/v1/roles/${userId}/removeAssign`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ roleId: Number(roleId) }),
    });
    await unwrap(r);
  },

  // --- Comments & Ratings ---

  async getComments(menuItemId: string): Promise<Comment[]> {
    const r = await fetch(`${BASE}/api/v1/menu-items/${menuItemId}/comments`);
    return unwrap<Comment[]>(r);
  },

  async createComment(
    menuItemId: string,
    data: { content: string; rating?: number },
  ): Promise<Comment> {
    const r = await fetch(`${BASE}/api/v1/menu-items/${menuItemId}/comments`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    });
    return unwrap<Comment>(r);
  },

  async replyToComment(commentId: string, content: string): Promise<void> {
    const r = await fetch(`${BASE}/api/v1/comments/${commentId}/reply`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ content }),
    });
    await unwrap(r);
  },

  // --- Notifications ---

  async getNotifications(): Promise<Notification[]> {
    const r = await fetch(`${BASE}/api/v1/notifications`, {
      headers: authHeaders(),
    });
    return unwrap<Notification[]>(r);
  },

  async markNotificationRead(id: string): Promise<void> {
    const r = await fetch(`${BASE}/api/v1/notifications/${id}/read`, {
      method: 'PATCH',
      headers: jsonHeaders(),
    });
    await unwrap(r);
  },

  // --- Staff/Admin: All Comments ---

  async getAllComments(params?: {
    status?: string;
    menuItemId?: string;
    limit?: number;
  }): Promise<Comment[]> {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.menuItemId) qs.set('menuItemId', params.menuItemId);
    if (params?.limit) qs.set('limit', String(params.limit));
    const url = `${BASE}/api/v1/comments${qs.toString() ? `?${qs}` : ''}`;
    const r = await fetch(url, { headers: authHeaders() });
    return unwrap<Comment[]>(r);
  },

  async adminUpdateCommentStatus(
    commentId: string,
    status: 'Visible' | 'Hidden',
  ): Promise<void> {
    const r = await fetch(`${BASE}/api/v1/comments/${commentId}/status`, {
      method: 'PATCH',
      headers: jsonHeaders(),
      body: JSON.stringify({ status }),
    });
    await unwrap(r);
  },
};
