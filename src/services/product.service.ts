import { Prisma } from '@prisma/client';
import { db } from '@/config/database';
import { AppError } from '@/utils/AppError';
import { parsePagination, buildPaginatedResponse } from '@/utils/pagination';
import {
  CreateProductInput,
  UpdateProductInput,
  ProductQueryInput,
} from '@/validators/product.validator';

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

class ProductService {
  async getProducts(query: ProductQueryInput) {
    const pagination = parsePagination(query.page, query.limit);

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.isFeatured !== undefined && { isFeatured: query.isFeatured }),
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.manufacturerId && { manufacturerId: query.manufacturerId }),
      ...(query.requiresPrescription !== undefined && {
        requiresPrescription: query.requiresPrescription,
      }),
      ...(query.q && {
        OR: [
          { name: { contains: query.q, mode: 'insensitive' } },
          { genericName: { contains: query.q, mode: 'insensitive' } },
          { sku: { contains: query.q, mode: 'insensitive' } },
        ],
      }),
      ...(query.minPrice !== undefined || query.maxPrice !== undefined
        ? {
            price: {
              ...(query.minPrice !== undefined && { gte: query.minPrice }),
              ...(query.maxPrice !== undefined && { lte: query.maxPrice }),
            },
          }
        : {}),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput = {
      [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc',
    };

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          manufacturer: { select: { id: true, name: true } },
          images: { where: { isPrimary: true }, take: 1 },
        },
        orderBy,
        skip: pagination.skip,
        take: pagination.limit,
      }),
      db.product.count({ where }),
    ]);

    return buildPaginatedResponse(products, total, pagination);
  }

  async getBySlug(slug: string) {
    const product = await db.product.findFirst({
      where: { slug, deletedAt: null },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        manufacturer: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');
    return product;
  }

  async getById(id: string) {
    const product = await db.product.findFirst({ where: { id, deletedAt: null } });
    if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');
    return product;
  }

  async getFeatured(limit = 8) {
    return db.product.findMany({
      where: { isActive: true, isFeatured: true, deletedAt: null },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: { select: { id: true, name: true, slug: true } },
      },
      take: limit,
      orderBy: { averageRating: 'desc' },
    });
  }

  async create(data: CreateProductInput) {
    const slug = toSlug(data.name);

    const existing = await db.product.findFirst({ where: { slug, deletedAt: null } });
    if (existing) {
      throw new AppError('A product with this name already exists', 409, 'DUPLICATE_ENTRY');
    }

    const skuExists = await db.product.findUnique({ where: { sku: data.sku } });
    if (skuExists) throw new AppError('SKU already in use', 409, 'DUPLICATE_ENTRY');

    return db.product.create({
      data: { ...data, slug, price: data.price, discountedPrice: data.discountedPrice },
      include: { category: true, manufacturer: true },
    });
  }

  async update(id: string, data: UpdateProductInput) {
    const product = await db.product.findFirst({ where: { id, deletedAt: null } });
    if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');

    const updateData: UpdateProductInput & { slug?: string } = { ...data };

    if (data.name && data.name !== product.name) {
      updateData.slug = toSlug(data.name);
    }

    return db.product.update({
      where: { id },
      data: updateData,
      include: { category: true, manufacturer: true },
    });
  }

  async softDelete(id: string): Promise<void> {
    const product = await db.product.findFirst({ where: { id, deletedAt: null } });
    if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');
    await db.product.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async addImage(productId: string, storageKey: string, altText?: string, isPrimary = false) {
    const product = await db.product.findFirst({ where: { id: productId, deletedAt: null } });
    if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');

    if (isPrimary) {
      await db.productImage.updateMany({
        where: { productId },
        data: { isPrimary: false },
      });
    }

    const count = await db.productImage.count({ where: { productId } });
    return db.productImage.create({
      data: { productId, storageKey, altText, isPrimary, sortOrder: count },
    });
  }

  async recalculateRating(productId: string): Promise<void> {
    const result = await db.productReview.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await db.product.update({
      where: { id: productId },
      data: {
        averageRating: result._avg.rating ?? 0,
        reviewCount: result._count.rating,
      },
    });
  }

  async recalculateStock(productId: string): Promise<void> {
    const batches = await db.inventoryBatch.findMany({
      where: { productId, isActive: true, expiryDate: { gt: new Date() } },
      select: { quantity: true, reservedQty: true },
    });

    const totalStock = batches.reduce(
      (sum, b) => sum + Math.max(0, b.quantity - b.reservedQty),
      0,
    );

    await db.product.update({ where: { id: productId }, data: { totalStock } });
  }
}

export const productService = new ProductService();
