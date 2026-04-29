import { EventEmitter } from 'events';

export interface OrderStatusEvent {
  orderId: string;
  status: string;
}

// Single emitter shared across the process lifetime.
// Swap this for a Redis pub/sub adapter if you scale to multiple Node processes.
export const orderEmitter = new EventEmitter();
