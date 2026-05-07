import z from 'zod';

// ── Enums ─────────────────────────────────────────────────────────────────────

export const OrderStatusEnum = z.enum([
  'Received',
  'Preparing',
  'Cooking',
  'Ready',
  'Delivered',
  'Cancelled',
]);
export type OrderStatusType = z.TypeOf<typeof OrderStatusEnum>;

export const PaymentMethodEnum = z.enum([
  'Cash',
  'Credit Card',
  'E-Wallet',
  'Bank Transfer',
]);
export type PaymentMethodType = z.TypeOf<typeof PaymentMethodEnum>;

// ── Cart ─────────────────────────────────────────────────────────────────────

export const CartItem = z.object({
  menuItemId: z.string(),
  name: z.string(),
  price: z.number(),
  image: z.string().optional(),
  qty: z.number().min(1),
  modifications: z.array(z.string()),
});
export type CartItemType = z.TypeOf<typeof CartItem>;

// ── Order Item ────────────────────────────────────────────────────────────────

export const OrderItem = z.object({
  id: z.string(),
  menuItemId: z.string().optional(),
  name: z.string(),
  qty: z.number(),
  price: z.number(),
  modifications: z.array(z.string()),
  image: z.string().optional(),
});
export type OrderItemType = z.TypeOf<typeof OrderItem>;

// ── Order Summary ─────────────────────────────────────────────────────────────

export const OrderSummary = z.object({
  id: z.string(),
  ticketNumber: z.string(),
  table: z.string(),
  status: OrderStatusEnum,
  isPaid: z.boolean().optional(),
  paymentMethod: PaymentMethodEnum.optional(),
  paidAt: z.string().optional(),
  timestamp: z.string(),
  itemCount: z.number(),
  total: z.number(),
  items: z.array(z.object({})).nullable(),
});
export type OrderSummaryType = z.TypeOf<typeof OrderSummary>;

// ── Order Detail ──────────────────────────────────────────────────────────────

export const OrderDetail = OrderSummary.extend({
  items: z.array(OrderItem),
});
export type OrderDetailType = z.TypeOf<typeof OrderDetail>;

// ── Full Order (kitchen / server view) ───────────────────────────────────────

export const Order = OrderDetail.extend({
  createdAt: z.string().optional(),
  waitLevel: z.enum(['Low', 'Medium', 'High']).optional(),
  waitTimeMinutes: z.number().optional(),
});
export type OrderType = z.TypeOf<typeof Order>;

// ── API response wrappers ─────────────────────────────────────────────────────

export const OrderListRes = z.object({
  success: z.boolean(),
  statusCode: z.number(),
  message: z.string(),
  message_en: z.string().optional(),
  data: z.unknown(),
  errors: z.array(z.any()).optional(),
});

export type OrderListResType = z.TypeOf<typeof OrderListRes>;

export const OrderRes = z.object({
  success: z.boolean(),
  statusCode: z.number(),
  message: z.string(),
  message_en: z.string().optional(),
  data: z.unknown(),
  errors: z.array(z.any()).optional(),
});

export type OrderResType = z.TypeOf<typeof OrderRes>;

// Define a function that accepts a generic Zod schema
export const CreateOrderRes = <T extends z.ZodTypeAny>(dataSchema: T) => {
  return z.object({
    success: z.boolean(),
    statusCode: z.number(),
    message: z.string(),
    message_en: z.string().optional(),
    data: dataSchema.nullable(),
    errors: z.array(z.any()).optional(),
  });
};

export const OrderDetailRes = CreateOrderRes(OrderDetail);
export type OrderDetailResType = z.TypeOf<typeof OrderDetailRes>;

// ── Create Order ──────────────────────────────────────────────────────────────

export const CreateOrderItemBody = z.object({
  menuItemId: z.string(),
  qty: z.number().min(1),
  modifications: z.array(z.string()).optional(),
});

export const CreateOrderBody = z.object({
  tableNumber: z.string().min(1, 'Số bàn là bắt buộc'),
  items: z.array(CreateOrderItemBody).min(1, 'Đơn hàng phải có ít nhất 1 món'),
  guestName: z.string().optional(),
  guestPhone: z.string().optional(),
});
export type CreateOrderBodyType = z.TypeOf<typeof CreateOrderBody>;

// ── Update Status ─────────────────────────────────────────────────────────────

export const UpdateOrderStatusBody = z.object({
  status: OrderStatusEnum,
});
export type UpdateOrderStatusBodyType = z.TypeOf<typeof UpdateOrderStatusBody>;

// ── Mark Paid ─────────────────────────────────────────────────────────────────

export const MarkOrderPaidBody = z.object({
  paymentMethod: PaymentMethodEnum,
});
export type MarkOrderPaidBodyType = z.TypeOf<typeof MarkOrderPaidBody>;

// ── Placed Order (response after create) ─────────────────────────────────────

export const PlacedOrder = z.object({
  id: z.string(),
  ticketNumber: z.string(),
  table: z.string(),
  status: z.string(),
  total: z.number(),
});
export type PlacedOrderType = z.TypeOf<typeof PlacedOrder>;
