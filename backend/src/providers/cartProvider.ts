import { prisma } from '../lib/prisma.js';

export const cartProvider = {
  async findByUserId(userId: bigint) {
    return prisma.carts.findUnique({
      where: { user_id: userId, deleted: false },
      include: {
        cart_items: {
          where: { deleted: false },
          include: {
            menu_items: {
              include: {
                menu_item_images: {
                  where: { is_primary: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });
  },

  async findBySessionId(sessionId: string) {
    return prisma.carts.findFirst({
      where: { session_id: sessionId, user_id: null, deleted: false },
      include: {
        cart_items: {
          where: { deleted: false },
          include: {
            menu_items: {
              include: {
                menu_item_images: {
                  where: { is_primary: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });
  },

  async create(data: { user_id?: bigint; session_id?: string }) {
    return prisma.carts.create({
      data: {
        ...data,
      },
    });
  },

  async findItem(cartId: bigint, menuItemId: bigint, modifications: string[]) {
    // Note: modifications is an array, comparing arrays in SQL can be tricky.
    // Prisma's equals for string[] should work if order matches.
    return prisma.cart_items.findFirst({
      where: {
        cart_id: cartId,
        menu_item_id: menuItemId,
        modifications: { equals: modifications },
        deleted: false,
      },
    });
  },

  async addItem(data: {
    cart_id: bigint;
    menu_item_id: bigint;
    quantity: number;
    modifications: string[];
  }) {
    return prisma.cart_items.create({
      data,
    });
  },

  async updateItem(
    itemId: bigint,
    data: { quantity?: number; modifications?: string[] },
  ) {
    return prisma.cart_items.update({
      where: { id: itemId },
      data,
    });
  },

  async removeItem(itemId: bigint) {
    return prisma.cart_items.update({
      where: { id: itemId },
      data: { deleted: true },
    });
  },

  async deleteItem(itemId: bigint) {
    return prisma.cart_items.delete({
      where: { id: itemId },
    });
  },

  async mergeCartItems(fromCartId: bigint, toCartId: bigint) {
    // This is more complex, usually done in service
    // But we can have a provider method to update all items' cart_id
    return prisma.cart_items.updateMany({
      where: { cart_id: fromCartId, deleted: false },
      data: { cart_id: toCartId },
    });
  },

  async deleteCart(cartId: bigint) {
    return prisma.carts.update({
      where: { id: cartId },
      data: { deleted: true },
    });
  },

  async clearItemsByCartId(cartId: bigint) {
    return prisma.cart_items.updateMany({
      where: { cart_id: cartId, deleted: false },
      data: { deleted: true },
    });
  },
};
