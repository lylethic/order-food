import type { FC } from 'react';

/** Shared nav-item shape used by Sidebar and BottomNav */
export interface NavItem {
  id: string;
  label: string;
  icon: FC<{ className?: string; strokeWidth?: number }>;
}

export type OrderStatus =
  | 'Received'
  | 'Preparing'
  | 'Cooking'
  | 'Ready'
  | 'Delivered'
  | 'Cancelled';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category?: string;
  isAvailable?: boolean;
  rating?: number;
  tag?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface OrderItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  modifications?: string[];
  image?: string;
}

export interface OrderSummary {
  id: string;
  ticketNumber: string;
  table: string;
  status: OrderStatus;
  timestamp: string;
  itemCount: number;
  total: number;
}

export interface OrderDetail extends OrderSummary {
  items: OrderItem[];
}

export interface Order {
  id: string;
  ticketNumber: string;
  table: string;
  items: OrderItem[];
  status: OrderStatus;
  timestamp: string;
  waitLevel?: 'Low' | 'Medium' | 'High';
  waitTimeMinutes?: number;
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  image?: string;
  qty: number;
  modifications: string[];
}

export interface User {
  userId: string;
  email: string;
  name?: string;
  role: string;
}

export interface PlacedOrder {
  id: string;
  ticketNumber: string;
  table: string;
  status: OrderStatus;
}
