import http from '@/lib/http';
import {
  OrderListResType,
  CreateOrderBodyType,
  UpdateOrderStatusBodyType,
  MarkOrderPaidBodyType,
  OrderDetailResType,
  OrderResType,
} from '@/schemaValidations/order.schema';

const orderApiRequest = {
  // ── Staff / Admin ──────────────────────────────────────────────────────────

  list: (params?: BaseSearchParams & { status?: string; is_paid?: boolean }) => {
    const { status, is_paid, ...rest } = params ?? {};
    const filters: string[] = [];
    if (status) filters.push(`status=${status}`);
    if (is_paid !== undefined) filters.push(`is_paid=${is_paid}`);
    const search = filters.length ? filters.join(',') : rest.search;
    return http.get<OrderListResType>('api/v1/orders', {
      params: { limit: 10, ...rest, ...(search ? { search } : {}) },
    });
  },

  getById: (id: string, token?: string) =>
    http.get<OrderDetailResType>(`api/v1/orders/${id}`),

  getDetailOrder: (id: number, token?: string) =>
    http.get<OrderDetailResType>(`api/v1/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }),

  updateStatus: (id: string, body: UpdateOrderStatusBodyType) =>
    http.put<OrderResType>(`api/v1/orders/${id}/status`, body),

  cancel: (id: string) =>
    http.put<OrderResType>(`api/v1/orders/${id}/cancel`, {}),

  markPaid: (id: string, body: MarkOrderPaidBodyType) =>
    http.put<OrderResType>(`api/v1/orders/${id}/payment`, body),

  // ── Customer ───────────────────────────────────────────────────────────────

  myOrders: () => http.get<OrderListResType>('api/v1/orders/my'),

  myOrderDetail: (id: string) => http.get<OrderResType>(`api/v1/orders/${id}`),

  create: (body: CreateOrderBodyType) =>
    http.post<OrderResType>('api/v1/orders', body),
};

export default orderApiRequest;
