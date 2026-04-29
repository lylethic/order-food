import { orderDal } from '../dal/order.dal.js';
import { menuItemDal } from '../dal/menuItem.dal.js';
import { AppError } from '../utils/AppError.js';
import { orderEmitter } from '../lib/orderEvents.js';
import type {
  CreateOrderBodyType,
  UpdateStatusBodyType,
} from '../schemas/validation.js';

export interface OrderItemDto {
  id: string;
  name: string;
  qty: number;
  price: number;
  modifications: string[];
}

export interface OrderDto {
  id: string;
  ticketNumber: string;
  table: string;
  status: string;
  timestamp: string;
  waitLevel?: string;
  waitTimeMinutes?: number;
  items: OrderItemDto[];
}

export interface OrderCreatedDto {
  id: string;
  ticketNumber: string;
  table: string;
  status: string;
}

export interface OrderStatusDto {
  id: string;
  status: string;
}

export interface OrderSummaryDto {
  id: string;
  ticketNumber: string;
  table: string;
  status: string;
  timestamp: string;
  itemCount: number;
  total: number;
}

const STAFF_ROLES = new Set(['admin', 'employee', 'chef']);
export const isStaffRole = (role: string) =>
  STAFF_ROLES.has(role.toLowerCase());

function formatOrderSummary(order: any): OrderSummaryDto {
  const items: any[] = order.items ?? [];
  return {
    id: order.id.toString(),
    ticketNumber: order.ticket_number,
    table: order.table_number,
    status: order.status,
    timestamp: (order.created as Date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    itemCount: items.reduce((sum: number, i: any) => sum + i.qty, 0),
    total: items.reduce(
      (sum: number, i: any) => sum + Number(i.price_at_order) * i.qty,
      0,
    ),
  };
}

function formatOrder(order: any): OrderDto {
  return {
    id: order.id.toString(),
    ticketNumber: order.ticket_number,
    table: order.table_number,
    status: order.status,
    timestamp: (order.created as Date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    waitLevel: order.wait_level ?? undefined,
    waitTimeMinutes: order.wait_time_minutes ?? undefined,
    items: order.items.map(
      (item: any): OrderItemDto => ({
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
  async getAll(status?: string): Promise<OrderDto[]> {
    const rows = await orderDal.findAll(status);
    return rows.map(formatOrder);
  },

  /** List all orders placed by the given customer (summary only). */
  async getByCustomer(customerId: string): Promise<OrderSummaryDto[]> {
    const rows = await orderDal.findByCustomerId(BigInt(customerId));
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
  ): Promise<OrderDto> {
    const order = await orderDal.findById(BigInt(orderId));
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
  ): Promise<OrderCreatedDto> {
    const menuItemIds = dto.items.map((i) => BigInt(i.menuItemId));
    const menuItems = await menuItemDal.findByIds(menuItemIds);

    if (menuItems.length === 0) {
      throw new AppError(422, 'None of the requested menu items were found');
    }

    const menuItemMap = new Map(menuItems.map((mi) => [mi.id.toString(), mi]));
    const ticketNumber = `GK-${Math.floor(10000 + Math.random() * 90000)}`;

    const order = await orderDal.create(
      {
        tableNumber: dto.tableNumber,
        customerId: customerId ? BigInt(customerId) : undefined,
        items: dto.items.map((item) => {
          const mi = menuItemMap.get(item.menuItemId);
          return {
            menuItemId: BigInt(item.menuItemId),
            nameAtOrder: mi?.name ?? 'Unknown Item',
            qty: item.qty,
            priceAtOrder: Number(mi?.price ?? 0),
            modifications: item.modifications ?? [],
          };
        }),
      },
      ticketNumber,
    );

    return {
      id: order.id.toString(),
      ticketNumber: order.ticket_number,
      table: order.table_number,
      status: order.status,
    };
  },

  async updateStatus(
    id: string,
    dto: UpdateStatusBodyType,
  ): Promise<OrderStatusDto> {
    const order = await orderDal.updateStatus(BigInt(id), dto.status);
    const result = { id: order.id.toString(), status: order.status };
    orderEmitter.emit('status', {
      orderId: order.id.toString(),
      status: order.status,
    });
    return result;
  },

  async cancelByCustomer(
    id: string,
    customerId: string,
  ): Promise<OrderStatusDto> {
    const order = await orderDal.findById(BigInt(id));
    if (!order) throw new AppError(404, 'Order not found');

    if (order.customer_id?.toString() !== customerId) {
      throw new AppError(403, 'You can only cancel your own order');
    }

    if (order.status !== 'Received') {
      throw new AppError(409, 'Order can only be cancelled before processing');
    }

    const updated = await orderDal.updateStatus(BigInt(id), 'Cancelled');
    const result = { id: updated.id.toString(), status: updated.status };
    orderEmitter.emit('status', {
      orderId: updated.id.toString(),
      status: updated.status,
    });
    return result;
  },
};
