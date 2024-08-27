import { Timestamp } from 'firebase/firestore';
import { ReactNode } from 'react';

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  basePrice: string;
  sizes: { name: string; price: string }[];
  addOns: { name: string; price: string }[];
  image: string;
  categoryId: string;
}

export type Category = {
  id: string;
  name: string;
  description: string;
  dishes: string[];
  image: string;
}

export interface CartItem {
  id: string;
  name: string;
  description: string;
  basePrice: string;
  sizes: { name: string; price: string }[];
  addOns: { name: string; price: string }[];
  image: string;
  categoryId: string;
  quantity: number;
  selectedSize?: { name: string; price: string };
  selectedAddOns: { name: string; price: string }[];
  note: string;
  completed?: boolean;
  specialInstructions?: string;
}

export type Order = {
  orderType: ReactNode;
  id: string;
  orderNumber: string;
  tableNumber?: string;
  status: 'Received' | 'Preparing' | 'Ready to Serve' | 'Served';
  items: CartItem[];
  placedAt: Timestamp;
  isRush: boolean;
}

export type RestaurantInfo = {
  name: string;
  logo: string | null;
  taxEnabled: boolean;
  gstEnabled: boolean;
  serviceChargeEnabled: boolean;
  gstRate: number;
  serviceChargeRate: number;
  paymentMethods: { name: string; enabled: boolean }[];
  orderTypeEnabled: boolean;
  orderConfirmationSettings: {
    showCheckboxes: boolean;
    showEstimatedTime: boolean;
    showSimpleMessage: boolean;
  }
}