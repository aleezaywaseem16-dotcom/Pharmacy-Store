export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'CUSTOMER' | 'PHARMACIST' | 'ADMIN' | 'SUPER_ADMIN';
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface Address {
  id: string;
  label: string;
  streetLine1: string;
  streetLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface ProductImage {
  id: string;
  storageKey: string;
  altText?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  parentId?: string;
  _count?: { products: number };
}

export interface Manufacturer {
  id: string;
  name: string;
  country?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  genericName?: string;
  description?: string;
  shortDescription?: string;
  sku: string;
  price: number;
  discountedPrice?: number;
  requiresPrescription: boolean;
  isControlled: boolean;
  dosageForm?: string;
  strength?: string;
  packSize?: string;
  storageInstructions?: string;
  sideEffects?: string;
  contraindications?: string;
  isActive: boolean;
  isFeatured: boolean;
  averageRating: number;
  reviewCount: number;
  totalStock: number;
  category: Category;
  manufacturer?: Manufacturer;
  images: ProductImage[];
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface Cart {
  id: string;
  items: CartItem[];
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productSku?: string;
  quantity: number;
  unitPrice: number | string;
  subtotal: number | string;
  product?: { name: string; sku: string; slug?: string };
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  subtotal: number | string;
  discountAmount: number | string;
  shippingFee: number | string;
  taxAmount: number | string;
  total: number | string;
  notes?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
  cancelledAt?: string;
  items: OrderItem[];
  address?: Address;
  coupon?: { code: string };
  payment?: { status: string; method: string };
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED'
  | 'REFUNDED';

export type PaymentMethod =
  | 'COD'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'BANK_TRANSFER'
  | 'EASYPAISA'
  | 'JAZZCASH';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  COD: 'Cash on Delivery',
  CREDIT_CARD: 'Credit Card',
  DEBIT_CARD: 'Debit Card',
  BANK_TRANSFER: 'Bank Transfer',
  EASYPAISA: 'Easypaisa',
  JAZZCASH: 'JazzCash',
};

export function toNum(v: number | string | undefined | null): number {
  if (v === null || v === undefined) return 0;
  return typeof v === 'number' ? v : parseFloat(v) || 0;
}

export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  title?: string;
  body?: string;
  isApproved: boolean;
  createdAt: string;
  user: { firstName: string; lastName: string };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
