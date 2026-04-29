import { prisma } from '../lib/prisma.js';

export interface CreateOrderData {
  tableNumber: string;
  customerId?: bigint;
  total: number;
  items: Array<{
    menuItemId: bigint;
    nameAtOrder: string;
    qty: number;
    priceAtOrder: number | string;
    modifications: string[];
  }>;
}

/**
 * Data Access Layer — Order
 */
export const orderDal = {
  /** Find a single order by id. */
  async findById(id: bigint) {
    return prisma.order.findFirst({
      where: { id, deleted: false },
      include: { items: { where: { deleted: false } } },
    });
  },

  /** Return all active orders, optionally filtered by status. */
  async findAll(status?: string) {
    return prisma.order.findMany({
      where: {
        deleted: false,
        active: true,
        ...(status ? { status } : {}),
      },
      include: { items: { where: { deleted: false } } },
      orderBy: { created: 'desc' },
    });
  },

  /** Insert a new order with its line items in a single transaction. */
  async create(data: CreateOrderData, ticketNumber: string) {
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
  async findByCustomerId(customerId: bigint) {
    return prisma.order.findMany({
      where: { customer_id: customerId, deleted: false },
      include: { items: { where: { deleted: false } } },
      orderBy: { created: 'desc' },
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
