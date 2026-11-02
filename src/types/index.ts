export type Role = 'customer' | 'admin';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: Role;
  createdAt: string;
  isActive: boolean;
  addresses: Address[];
}

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  isActive: boolean;
  itemCount?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  categoryId: string;
  categoryName: string;
  stock: number;
  lowStockThreshold: number;
  sku: string;
  images: string[];
  isActive: boolean;
  isFeatured?: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
  createdAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  couponCode?: string;
  total: number;
}

export type OrderStatus =
  | 'Pending Payment'
  | 'Confirmed'
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Return Requested'
  | 'Returned'
  | 'Refund Processing'
  | 'Refunded';

export type PaymentStatus =
  | 'Created'
  | 'Pending'
  | 'Authorized'
  | 'Captured'
  | 'Failed'
  | 'Refunded';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderEvent {
  status: OrderStatus;
  timestamp: string;
  description: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  shippingAddress: Address;
  subtotal: number;
  shippingFee: number;
  discount: number;
  finalAmount: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paymentReference?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  trackingNumber?: string;
  events: OrderEvent[];
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  amount: number;
  currency: string;
  gateway: 'Razorpay';
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  status: PaymentStatus;
  createdAt: string;
  signature?: string;
  refundStatus?: 'None' | 'Requested' | 'Processed';
  refundAmount?: number;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantityChange: number;
  reason: 'Initial Stock' | 'Order Placement' | 'Order Cancellation' | 'Admin Restock' | 'Damage / Loss' | 'Cycle Count Correction';
  administrator: string;
  timestamp: string;
  balanceAfter: number;
}
