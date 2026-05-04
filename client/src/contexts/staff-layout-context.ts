import { createContext, useContext } from 'react';
import type { StatusEvent } from '@/hooks/useSSE';

export interface StaffLayoutContextValue {
  lastEvent: StatusEvent | null;
}

export const StaffLayoutContext = createContext<StaffLayoutContextValue>({
  lastEvent: null,
});

export function useStaffLayout() {
  return useContext(StaffLayoutContext);
}
