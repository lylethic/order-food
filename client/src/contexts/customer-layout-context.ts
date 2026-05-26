import { createContext, useContext } from 'react';
import type { PlacedOrderType, OrderStatusType } from '@/schemaValidations/order.schema';
import type { StatusEvent, CommentRepliedEvent } from '@/hooks/useSSE';

export interface CustomerLayoutContextValue {
  placedOrder: PlacedOrderType | null;
  onCancelOrder: () => Promise<void>;
  lastEvent: StatusEvent | null;
  commentRepliedEvent: CommentRepliedEvent | null;
  onOpenCart: () => void;
}

export const CustomerLayoutContext = createContext<CustomerLayoutContextValue>({
  placedOrder: null,
  onCancelOrder: async () => {},
  lastEvent: null,
  commentRepliedEvent: null,
  onOpenCart: () => {},
});

export function useCustomerLayout() {
  return useContext(CustomerLayoutContext);
}
