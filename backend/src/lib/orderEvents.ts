import { EventEmitter } from 'events';

export interface OrderStatusEvent {
  eventType: 'status';
  orderId: string;
  status: string;
}

export interface OrderPaymentEvent {
  eventType: 'payment';
  orderId: string;
  status: string;
  isPaid: boolean;
  paymentMethod: string;
  paidAt: string;
}

export type OrderRealtimeEvent = OrderStatusEvent | OrderPaymentEvent;

// Single emitter shared across the process lifetime.
// Swap this for a Redis pub/sub adapter if you scale to multiple Node processes.
export const orderEmitter = new EventEmitter();
