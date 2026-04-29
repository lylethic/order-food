import { useState, useCallback, useMemo } from 'react';
import type { CartItem } from '../types';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addItem = useCallback((item: Omit<CartItem, 'qty' | 'modifications'>) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.menuItemId);
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === item.menuItemId ? { ...c, qty: c.qty + 1 } : c,
        );
      }
      return [...prev, { ...item, qty: 1, modifications: [] }];
    });
  }, []);

  const removeItem = useCallback((menuItemId: string) => {
    setCart((prev) => prev.filter((c) => c.menuItemId !== menuItemId));
  }, []);

  const updateQty = useCallback((menuItemId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((c) => c.menuItemId !== menuItemId));
    } else {
      setCart((prev) =>
        prev.map((c) => (c.menuItemId === menuItemId ? { ...c, qty } : c)),
      );
    }
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const total = useMemo(
    () => cart.reduce((sum, c) => sum + c.price * c.qty, 0),
    [cart],
  );

  const count = useMemo(
    () => cart.reduce((sum, c) => sum + c.qty, 0),
    [cart],
  );

  return { cart, addItem, removeItem, updateQty, clearCart, total, count };
}
