import { z } from 'zod';

export const createProductSchema = z.object({
  categoryId: z.string().uuid(),
  manufacturerId: z.string().uuid().optional(),
  name: z.string().min(1).max(255).trim(),
  genericName: z.string().max(255).trim().optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  sku: z.string().min(1).max(100).trim(),
  barcode: z.string().max(100).trim().optional(),
  price: z.number().positive(),
  discountedPrice: z.number().positive().optional(),
  requiresPrescription: z.boolean().default(false),
  isControlled: z.boolean().default(false),
  dosageForm: z.string().max(100).optional(),
  strength: z.string().max(100).optional(),
  packSize: z.string().max(100).optional(),
  storageInstructions: z.string().optional(),
  sideEffects: z.string().optional(),
  contraindications: z.string().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 20)),
  categoryId: z.string().uuid().optional(),
  manufacturerId: z.string().uuid().optional(),
  requiresPrescription: z
    .string()
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  isActive: z
    .string()
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  isFeatured: z
    .string()
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  minPrice: z.string().optional().transform((v) => (v ? parseFloat(v) : undefined)),
  maxPrice: z.string().optional().transform((v) => (v ? parseFloat(v) : undefined)),
  sortBy: z.enum(['price', 'name', 'createdAt', 'averageRating']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  q: z.string().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createManufacturerSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  country: z.string().max(100).optional(),
  isActive: z.boolean().default(true),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateManufacturerInput = z.infer<typeof createManufacturerSchema>;
