import { orderProvider } from '../providers/orderProvider.js';
import { menuItemProvider } from '../providers/menuItemProvider.js';
import { AppError } from '../utils/AppError.js';
import { orderEmitter } from '../lib/orderEvents.js';
import type {
  CreateOrderBodyType,
  MarkOrderPaidBodyType,
  UpdateStatusBodyType,
} from '../schemas/validation.js';
import {
  OrderCreatedDtoType,
  OrderDtoType,
  OrderItemDtoType,
  OrderPaymentDtoType,
  OrderStatusDtoType,
  OrderSummaryDtoType,
} from '../schemas/order.js';

const STAFF_ROLES = new Set(['admin', 'employee', 'chef']);
export const isStaffRole = (role: string) =>
  STAFF_ROLES.has(role.toLowerCase());

function formatOrderSummary(order: any): OrderSummaryDtoType {
  const items: any[] = order.items ?? [];
  const total =
    order.total != null
      ? Number(order.total)
      : Math.round(
          items.reduce(
            (sum: number, i: any) => sum + Number(i.price_at_order) * i.qty,
            0,
          ),
        );
  return {
    id: order.id.toString(),
    ticketNumber: order.ticket_number,
    table: order.table_number,
    status: order.status,
    isPaid: Boolean(order.is_paid),
    paymentMethod: order.payment_method ?? undefined,
    paidAt: order.paid_at ? (order.paid_at as Date).toISOString() : undefined,
    timestamp: (order.created as Date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    itemCount: items.reduce((sum: number, i: any) => sum + i.qty, 0),
    total,
  };
}

function formatOrder(order: any): OrderDtoType {
  const items: any[] = order.items ?? [];
  const total =
    order.total != null
      ? Number(order.total)
      : Math.round(
          items.reduce(
            (sum: number, i: any) => sum + Number(i.price_at_order) * i.qty,
            0,
          ),
        );
  return {
    id: order.id.toString(),
    ticketNumber: order.ticket_number,
    table: order.table_number,
    status: order.status,
    total,
    isPaid: Boolean(order.is_paid),
    paymentMethod: order.payment_method ?? undefined,
    paidAt: order.paid_at ? (order.paid_at as Date).toISOString() : undefined,
    timestamp: (order.created as Date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    waitLevel: order.wait_level ?? undefined,
    waitTimeMinutes: order.wait_time_minutes ?? undefined,
    items: order.items.map(
      (item: any): OrderItemDtoType => ({
        id: item.id.toString(),
        name: item.name_at_order,
        qty: item.qty,
        price: Number(item.price_at_order),
        modifications: item.modifications,
      }),
    ),
  };
}

/**
 * Service Layer — Order
 * Handles order querying, creation, and status transitions.
 */
export const orderService = {
  async getAll(status?: string): Promise<OrderDtoType[]> {
    const rows = await orderProvider.findAll(status);
    return rows.map(formatOrder);
  },

  /** List all orders placed by the given customer (summary only). */
  async getByCustomer(customerId: string): Promise<OrderSummaryDtoType[]> {
    const rows = await orderProvider.findByCustomerId(BigInt(customerId));
    return rows.map(formatOrderSummary);
  },

  /**
   * Get full detail of a single order including all items.
   * Customers may only view their own orders; staff can view any.
   */
  async getDetail(
    orderId: string,
    requesterId: string,
    requesterRole: string,
  ): Promise<OrderDtoType> {
    const order = await orderProvider.findById(BigInt(orderId));
    if (!order) throw new AppError(404, 'Order not found');

    if (
      !isStaffRole(requesterRole) &&
      order.customer_id?.toString() !== requesterId
    ) {
      throw new AppError(403, 'You can only view your own orders');
    }

    return formatOrder(order);
  },

  /**
   * Create a new order:
   * 1. Resolve menu item prices from DB (prevents client-side price tampering)
   * 2. Generate unique ticket number
   * 3. Persist order + line items atomically via Prisma nested write
   */
  async create(
    dto: CreateOrderBodyType,
    customerId?: string,
  ): Promise<OrderCreatedDtoType> {
    const menuItemIds = dto.items.map((i) => BigInt(i.menuItemId));
    const menuItems = await menuItemProvider.findByIds(menuItemIds);

    if (menuItems.length === 0) {
      throw new AppError(422, 'None of the requested menu items were found');
    }

    const menuItemMap = new Map(menuItems.map((mi) => [mi.id.toString(), mi]));
    const ticketNumber = `RBK-${Math.floor(10000 + Math.random() * 90000)}`;
    const resolvedItems = dto.items.map((item) => {
      const mi = menuItemMap.get(item.menuItemId);
      return {
        menuItemId: BigInt(item.menuItemId),
        nameAtOrder: mi?.name ?? 'Unknown Item',
        qty: item.qty,
        priceAtOrder: Number(mi?.price ?? 0),
        modifications: item.modifications ?? [],
      };
    });

    const total = Math.round(
      resolvedItems.reduce(
        (sum, item) => sum + Number(item.priceAtOrder) * item.qty,
        0,
      ),
    );

    const order = await orderProvider.create(
      {
        tableNumber: dto.tableNumber,
        customerId: customerId ? BigInt(customerId) : undefined,
        total,
        items: resolvedItems,
      },
      ticketNumber,
    );

    return {
      id: order.id.toString(),
      ticketNumber: order.ticket_number,
      table: order.table_number,
      status: order.status,
      total: Number((order as any).total ?? total),
    };
  },

  async updateStatus(
    id: string,
    dto: UpdateStatusBodyType,
  ): Promise<OrderStatusDtoType> {
    const order = await orderProvider.updateStatus(BigInt(id), dto.status);
    const result = { id: order.id.toString(), status: order.status };
    orderEmitter.emit('status', {
      eventType: 'status',
      orderId: order.id.toString(),
      status: order.status,
    });
    return result;
  },

  async cancelByCustomer(
    id: string,
    customerId: string,
  ): Promise<OrderStatusDtoType> {
    const order = await orderProvider.findById(BigInt(id));
    if (!order) throw new AppError(404, 'Order not found');

    if (order.customer_id?.toString() !== customerId) {
      throw new AppError(403, 'You can only cancel your own order');
    }

    if (order.status !== 'Received') {
      throw new AppError(409, 'Order can only be cancelled before processing');
    }

    const updated = await orderProvider.updateStatus(BigInt(id), 'Cancelled');
    const result = { id: updated.id.toString(), status: updated.status };
    orderEmitter.emit('status', {
      eventType: 'status',
      orderId: updated.id.toString(),
      status: updated.status,
    });
    return result;
  },

  async markPaid(
    id: string,
    dto: MarkOrderPaidBodyType,
  ): Promise<OrderPaymentDtoType> {
    const order = await orderProvider.findById(BigInt(id));
    if (!order) throw new AppError(404, 'Order not found');
    const orderRow = order as any;

    if (order.status !== 'Delivered') {
      throw new AppError(409, 'Order can only be paid after it is delivered');
    }

    if (orderRow.is_paid) {
      throw new AppError(409, 'Order is already paid');
    }

    const paidAt = new Date();
    const updated = await orderProvider.markAsPaid(
      BigInt(id),
      dto.paymentMethod,
      paidAt,
    );
    if (!updated) throw new AppError(404, 'Order not found');
    const updatedRow = updated as any;

    orderEmitter.emit('payment', {
      eventType: 'payment',
      orderId: updated.id.toString(),
      status: updated.status,
      isPaid: true,
      paymentMethod: updatedRow.payment_method ?? dto.paymentMethod,
      paidAt: (updatedRow.paid_at ?? paidAt).toISOString(),
    });

    return {
      id: updated.id.toString(),
      isPaid: Boolean(updatedRow.is_paid),
      paymentMethod: updatedRow.payment_method ?? dto.paymentMethod,
      paidAt: (updatedRow.paid_at ?? paidAt).toISOString(),
    };
  },
};
