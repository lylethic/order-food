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

export type PaymentMethod =
  | 'Cash'
  | 'Credit Card'
  | 'E-Wallet'
  | 'Bank Transfer';

export interface MenuItemImage {
  id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category?: string;
  categoryId?: string;
  isAvailable?: boolean;
  rating?: number;
  tag?: string;
}

export interface MenuItemDetail extends MenuItem {
  images: MenuItemImage[];
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
  isPaid?: boolean;
  paymentMethod?: PaymentMethod;
  paidAt?: string;
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
  total: number;
  isPaid?: boolean;
  paymentMethod?: PaymentMethod;
  paidAt?: string;
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
  img?: string | null;
  role: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  name: string | null;
  img: string | null;
  active: boolean;
  deleted: boolean;
  created: string;
  updated: string;
}

export interface Role {
  id: string;
  name: string;
  active: boolean;
  deleted: boolean;
}

export interface PlacedOrder {
  id: string;
  ticketNumber: string;
  table: string;
  status: OrderStatus;
  total: number;
}
