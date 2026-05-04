import { prisma } from '../lib/prisma.js';
import { CreateOrderBodyType } from '../schemas/order.js';
import { BaseSearchRequestType } from '../schemas/search.js';
import parseFilterString from '../utils/filterParser.js';

/**
 * Data Access Layer — Order
 */
export const orderProvider = {
  /** Find a single order by id. */
  async findById(id: bigint) {
    return prisma.order.findFirst({
      where: { id, deleted: false },
      include: {
        items: {
          where: { deleted: false },
          include: {
            menu_item: {
              include: {
                menu_item_images: {
                  where: { is_primary: true },
                  orderBy: [{ display_order: 'asc' }],
                  take: 1,
                },
              },
            },
          },
        },
      },
    });
  },

  /** Return all active orders, optionally filtered by status. */
  async findAll(request: BaseSearchRequestType) {
    const where = parseFilterString(request.search, {
      allowedFields: [
        'id',
        'customer_id',
        'ticket_number',
        'table_number',
        'status',
        'wait_level',
        'is_paid',
        'payment_method',
        'paid_at',
      ],
      fieldTypes: {
        id: 'number',
        customer_id: 'number',
        ticket_number: 'string',
        table_number: 'string',
        status: 'string',
        wait_level: 'string',
        is_paid: 'boolean',
        payment_method: 'string',
        paid_at: 'date',
      },
      defaultSearchFields: ['status'],
      defaultDeleted: true,
    });

    return prisma.order.findMany({
      where,
      orderBy: { id: request.order },
      take: request.limit + 1,
      ...(request.cursor ? { cursor: { id: request.cursor }, skip: 1 } : {}),
      include: {
        items: {
          where: { deleted: false },
          include: {
            menu_item: {
              include: {
                menu_item_images: {
                  where: { is_primary: true },
                  orderBy: [{ display_order: 'asc' }],
                  take: 1,
                },
              },
            },
          },
        },
      },
    });
  },

  /** Insert a new order with its line items in a single transaction. */
  async create(data: CreateOrderBodyType, ticketNumber: string) {
    return prisma.order.create({
      data: {
        ticket_number: ticketNumber,
        table_number: data.tableNumber,
        status: 'Received',
        total: data.total,
        customer_id: data.customerId,
        items: {
          create: data.items.map((item, idx) => ({
            menu_item_id: item.menuItemId,
            name_at_order: item.nameAtOrder,
            qty: item.qty,
            price_at_order: item.priceAtOrder,
            modifications: item.modifications,
          })),
        },
      },
      include: { items: true },
    });
  },

  /** Return all orders placed by a specific customer, newest first. */
  async findByCustomerId(request: BaseSearchRequestType) {
    const where = parseFilterString(request.search, {
      allowedFields: [
        'id',
        'customer_id',
        'ticket_number',
        'table_number',
        'status',
        'wait_level',
        'is_paid',
        'payment_method',
        'paid_at',
      ],
      fieldTypes: {
        id: 'number',
        customer_id: 'number',
        ticket_number: 'string',
        table_number: 'string',
        status: 'string',
        wait_level: 'string',
        is_paid: 'boolean',
        payment_method: 'string',
        paid_at: 'date',
      },
      defaultSearchFields: ['status'],
      defaultDeleted: true,
    });

    // If controller/service supplied customer_id directly, apply it as a filter.
    const suppliedCustomerId = (request as any).customer_id;
    if (suppliedCustomerId != null) {
      // Prisma expects BigInt for the customer_id column
      (where as any).customer_id = BigInt(suppliedCustomerId);
    }

    return prisma.order.findMany({
      where,
      orderBy: { id: request.order },
      take: request.limit + 1,
      ...(request.cursor ? { cursor: { id: request.cursor }, skip: 1 } : {}),
      include: {
        items: {
          include: {
            menu_item: {
              include: {
                menu_item_images: {
                  where: { is_primary: true },
                  orderBy: [{ display_order: 'asc' }],
                  take: 1,
                },
              },
            },
          },
        },
      },
    });
  },

  /** Update only the `status` field of an order. */
  async updateStatus(id: bigint, status: string) {
    return prisma.order.update({
      where: { id },
      data: { status },
    });
  },

  /** Mark an order as paid and persist payment metadata. */
  async markAsPaid(id: bigint, paymentMethod: string, paidAt: Date) {
    await prisma.$executeRaw`
      UPDATE orders
      SET is_paid = TRUE,
          payment_method = ${paymentMethod},
          paid_at = ${paidAt}
      WHERE id = ${id}
    `;

    return prisma.order.findFirst({ where: { id, deleted: false } });
  },
};
