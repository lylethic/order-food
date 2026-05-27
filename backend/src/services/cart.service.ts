import { cartProvider } from '../providers/cartProvider.js';
import { menuItemProvider } from '../providers/menuItemProvider.js';
import { AppError } from '../utils/AppError.js';

export const cartService = {
  async getCart(userId?: bigint, sessionId?: string) {
    if (!userId && !sessionId) {
      throw new AppError(400, 'UserId or SessionId is required');
    }

    let cart;
    if (userId) {
      cart = await cartProvider.findByUserId(userId);
    } else if (sessionId) {
      cart = await cartProvider.findBySessionId(sessionId);
    }

    if (!cart) {
      const newCart = await cartProvider.create({
        user_id: userId,
        session_id: userId ? undefined : sessionId,
      });
      return { ...newCart, cart_items: [] };
    }

    return cart;
  },

  async addToCart(
    data: { menu_item_id: bigint; quantity: number; modifications: string[] },
    userId?: bigint,
    sessionId?: string,
  ) {
    // 1. Check if menu item exists and is active
    const menuItem = await menuItemProvider.findById(Number(data.menu_item_id));
    if (!menuItem || !menuItem.active) {
      throw new AppError(404, 'Món ăn không tồn tại hoặc đã ngừng kinh doanh');
    }

    // 2. Get or create cart
    const cart = await this.getCart(userId, sessionId);

    // 3. Check if item already exists in cart with same modifications
    const existingItem = await cartProvider.findItem(
      cart.id,
      data.menu_item_id,
      data.modifications,
    );

    if (existingItem) {
      // 4. Update quantity
      return cartProvider.updateItem(existingItem.id, {
        quantity: (existingItem.quantity || 0) + data.quantity,
      });
    } else {
      // 5. Add new item
      return cartProvider.addItem({
        cart_id: cart.id,
        menu_item_id: data.menu_item_id,
        quantity: data.quantity,
        modifications: data.modifications,
      });
    }
  },

  async updateCartItem(
    itemId: bigint,
    data: { quantity: number; modifications?: string[] },
  ) {
    if (data.quantity <= 0) {
      return cartProvider.removeItem(itemId);
    }

    return cartProvider.updateItem(itemId, data);
  },

  async removeFromCart(itemId: bigint) {
    return cartProvider.removeItem(itemId);
  },

  async clearCart(userId?: bigint, sessionId?: string) {
    if (!userId && !sessionId) return;

    let cart;
    if (userId) {
      cart = await cartProvider.findByUserId(userId);
    } else if (sessionId) {
      cart = await cartProvider.findBySessionId(sessionId);
    }

    if (cart) {
      await cartProvider.clearItemsByCartId(cart.id);
    }
  },

  async mergeCart(userId: bigint, sessionId: string) {
    // 1. Find guest cart
    const guestCart = await cartProvider.findBySessionId(sessionId);
    if (!guestCart || guestCart.cart_items.length === 0) return;

    // 2. Find or create user cart
    let userCart = await cartProvider.findByUserId(userId);
    if (!userCart) {
      const newCart = await cartProvider.create({ user_id: userId });
      userCart = { ...newCart, cart_items: [] };
    }

    if (!userCart) return;

    // 3. Merge items
    for (const item of guestCart.cart_items) {
      const existingInUserCart = await cartProvider.findItem(
        userCart.id,
        item.menu_item_id,
        item.modifications,
      );

      if (existingInUserCart) {
        await cartProvider.updateItem(existingInUserCart.id, {
          quantity: (existingInUserCart.quantity || 0) + (item.quantity || 0),
        });
        await cartProvider.deleteItem(item.id);
      } else {
        await cartProvider.updateItem(item.id, {
          // @ts-ignore
          cart_id: userCart.id,
        });
      }
    }

    // 4. Delete guest cart
    await cartProvider.deleteCart(guestCart.id);
  },
};
