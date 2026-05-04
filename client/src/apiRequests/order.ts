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

  list: (params?: { status?: string }) =>
    http.get<OrderListResType>('api/v1/orders', { params }),

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
