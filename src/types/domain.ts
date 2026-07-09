import type { RoleName } from "@/lib/permissions";

export type TableStatus =
  | "available"
  | "occupied"
  | "reserved"
  | "cleaning"
  | "merged"
  | "split";
export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "delivered"
  | "paid"
  | "void";
export type PaymentMethod = "cash" | "card" | "qr" | "mixed";
export type InventoryMovementType = "in" | "out" | "waste" | "adjustment";

export interface Branch {
  id: string;
  name: string;
  code: string;
  city: string;
  address: string;
}

export interface Permission {
  key: string;
  label: string;
  description: string;
}

export interface Role {
  id: string;
  name: RoleName;
  label: string;
  permissions: string[];
}

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  role: RoleName;
  branchId: string;
  active: boolean;
  avatar?: string;
  lastLoginAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image: string;
  color: string;
}

export interface ProductVariant {
  id: string;
  label: string;
  price: number;
  cost: number;
}

export interface ProductAddon {
  id: string;
  label: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  image: string;
  price: number;
  cost: number;
  available: boolean;
  stock: number;
  recipe?: string[];
  variants?: ProductVariant[];
  addons?: ProductAddon[];
  lowStockThreshold: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  birthday?: string;
  address?: string;
  loyaltyPoints: number;
  favoriteOrders: string[];
}

export interface Supplier {
  id: string;
  company: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
}

export interface RestaurantTable {
  id: string;
  label: string;
  seats: number;
  zone: string;
  status: TableStatus;
  billId?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  modifiers?: string[];
}

export interface Order {
  id: string;
  orderNumber: string;
  tableId?: string;
  tableLabel?: string;
  waiterName: string;
  customerName?: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  serviceCharge: number;
  grandTotal: number;
  createdAt: string;
  priority: "low" | "normal" | "high";
  notes?: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  createdAt: string;
}

export interface KitchenOrder {
  id: string;
  orderId: string;
  orderNumber: string;
  tableLabel: string;
  waiterName: string;
  status: Exclude<OrderStatus, "paid" | "void">;
  items: OrderItem[];
  notes?: string;
  createdAt: string;
  priority: "low" | "normal" | "high";
}

export interface InventoryItem {
  id: string;
  productId: string;
  name: string;
  unit: string;
  stockOnHand: number;
  stockReserved: number;
  reorderLevel: number;
  expiryDate?: string;
  barcode?: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  type: InventoryMovementType;
  quantity: number;
  reason: string;
  createdAt: string;
}

export interface Reservation {
  id: string;
  customerName: string;
  tableLabel: string;
  partySize: number;
  time: string;
  status: "pending" | "confirmed" | "seated" | "cancelled";
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type:
    | "low-stock"
    | "new-order"
    | "kitchen-ready"
    | "payment-completed"
    | "printer-offline";
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  createdAt: string;
}
