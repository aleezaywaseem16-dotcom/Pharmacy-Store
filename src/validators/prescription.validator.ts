import { z } from 'zod';

export const createPrescriptionSchema = z.object({
  doctorName: z.string().max(200).trim().optional(),
  doctorLicense: z.string().max(100).trim().optional(),
  hospitalName: z.string().max(200).trim().optional(),
  issuedDate: z.string().optional().transform((v) => (v ? new Date(v) : undefined)),
  notes: z.string().max(1000).optional(),
});

export const prescriptionItemSchema = z.object({
  productId: z.string().uuid().optional(),
  medicationName: z.string().min(1).max(255).trim(),
  dosage: z.string().max(100).optional(),
  frequency: z.string().max(100).optional(),
  duration: z.string().max(100).optional(),
  quantity: z.number().int().min(1).optional(),
});

export const reviewPrescriptionSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  items: z.array(prescriptionItemSchema).optional(),
});

export const prescriptionQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 20)),
  status: z
    .enum(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED'])
    .optional(),
});

export const inventoryBatchSchema = z.object({
  productId: z.string().uuid(),
  batchNumber: z.string().min(1).max(100).trim(),
  quantity: z.number().int().min(1),
  expiryDate: z.string().transform((v) => new Date(v)),
  purchasePrice: z.number().positive(),
});

export const stockAdjustmentSchema = z.object({
  batchId: z.string().uuid(),
  type: z.enum([
    'PURCHASE',
    'SALE',
    'RETURN',
    'DAMAGE',
    'EXPIRY_REMOVAL',
    'CORRECTION',
    'RECALL',
  ]),
  quantity: z.number().int().min(1),
  reason: z.string().min(1).max(500),
  referenceId: z.string().optional(),
});

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  body: z.string().max(2000).optional(),
});

export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;
export type ReviewPrescriptionInput = z.infer<typeof reviewPrescriptionSchema>;
export type InventoryBatchInput = z.infer<typeof inventoryBatchSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
