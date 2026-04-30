import z from 'zod';

export const CreateOrderBody = z.object({
  tableNumber: z.string(),
  customerId: z.bigint().optional(),
  total: z.number(),
  items: z.array(
    z.object({
      menuItemId: z.bigint(),
      nameAtOrder: z.string(),
      qty: z.number().int().positive(), // Added .int() and .positive() for better safety
      priceAtOrder: z.union([z.number(), z.string()]), // This handles number | string
      modifications: z.array(z.string()),
    }),
  ),
});

// z.infer is the standard way to extract the TypeScript type
export type CreateOrderBodyType = z.infer<typeof CreateOrderBody>;

export const OrderItemDto = z.object({
  id: z.string(),
  menuItemId: z.string().optional(),
  name: z.string(),
  qty: z.number(),
  price: z.number(),
  modifications: z.array(z.string()),
});
export type OrderItemDtoType = z.TypeOf<typeof OrderItemDto>;

export const OrderDto = z.object({
  id: z.string(),
  ticketNumber: z.string(),
  table: z.string(),
  status: z.string(),
  total: z.number(),
  isPaid: z.boolean(),
  paymentMethod: z.string().optional(),
  paidAt: z.string().optional(),
  timestamp: z.string(),
  waitLevel: z.string().optional(),
  waitTimeMinutes: z.number().optional(),
  items: z.array(OrderItemDto),
});
export type OrderDtoType = z.TypeOf<typeof OrderDto>;

export const OrderCreatedDto = z.object({
  id: z.string(),
  ticketNumber: z.string(),
  table: z.string(),
  status: z.string(),
  total: z.number(),
});
export type OrderCreatedDtoType = z.TypeOf<typeof OrderCreatedDto>;

export const OrderStatusDto = z.object({
  id: z.string(),
  status: z.string(),
});
export type OrderStatusDtoType = z.TypeOf<typeof OrderStatusDto>;

export const OrderSummaryDto = z.object({
  id: z.string(),
  ticketNumber: z.string(),
  table: z.string(),
  status: z.string(),
  isPaid: z.boolean(),
  paymentMethod: z.string().optional(),
  paidAt: z.string().optional(),
  timestamp: z.string(),
  itemCount: z.number(),
  total: z.number(),
});
export type OrderSummaryDtoType = z.TypeOf<typeof OrderSummaryDto>;

export const OrderPaymentDto = z.object({
  id: z.string(),
  isPaid: z.boolean(),
  paymentMethod: z.string(),
  paidAt: z.string(),
});
export type OrderPaymentDtoType = z.TypeOf<typeof OrderPaymentDto>;
