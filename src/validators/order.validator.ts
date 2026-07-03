import { z } from 'zod';
import { OrderStatus, PaymentMethod } from '@prisma/client';

export const createOrderSchema = z.object({
  addressId: z.string().min(1),
  paymentMethod: z.nativeEnum(PaymentMethod),
  prescriptionId: z.string().uuid().optional(),
  couponCode: z.string().trim().optional(),
  notes: z.string().max(500).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  note: z.string().max(500).optional(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const orderQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 20)),
  status: z.nativeEnum(OrderStatus).optional(),
  userId: z.string().uuid().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const addCartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(100),
  prescriptionId: z.string().uuid().optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(100),
});

export const addAddressSchema = z.object({
  label: z.string().min(1).max(50),
  streetLine1: z.string().min(1).max(200),
  streetLine2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  postalCode: z.string().min(1).max(20),
  country: z.string().length(2).toUpperCase().default('PK'),
  isDefault: z.boolean().default(false),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
