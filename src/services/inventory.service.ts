import { StockAdjustmentType } from '@prisma/client';
import { db } from '@/config/database';
import { AppError } from '@/utils/AppError';
import { parsePagination, buildPaginatedResponse } from '@/utils/pagination';
import { productService } from '@/services/product.service';
import { InventoryBatchInput, StockAdjustmentInput } from '@/validators/prescription.validator';

class InventoryService {
  async getBatches(page: unknown, limit: unknown, productId?: string) {
    const pagination = parsePagination(page, limit);

    const where = {
      ...(productId && { productId }),
    };

    const [batches, total] = await Promise.all([
      db.inventoryBatch.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
        orderBy: { expiryDate: 'asc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      db.inventoryBatch.count({ where }),
    ]);

    return buildPaginatedResponse(batches, total, pagination);
  }

  async createBatch(data: InventoryBatchInput, userId: string) {
    const product = await db.product.findFirst({
      where: { id: data.productId, deletedAt: null },
    });
    if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');

    const batch = await db.inventoryBatch.create({
      data: {
        productId: data.productId,
        batchNumber: data.batchNumber,
        quantity: data.quantity,
        expiryDate: data.expiryDate,
        purchasePrice: data.purchasePrice,
      },
    });

    await db.stockAdjustment.create({
      data: {
        batchId: batch.id,
        userId,
        type: 'PURCHASE',
        quantity: data.quantity,
        reason: 'Initial stock addition',
      },
    });

    await productService.recalculateStock(data.productId);
    return batch;
  }

  async adjustStock(data: StockAdjustmentInput, userId: string) {
    const batch = await db.inventoryBatch.findUnique({ where: { id: data.batchId } });
    if (!batch) throw new AppError('Batch not found', 404, 'NOT_FOUND');

    const isDecrease = ['SALE', 'DAMAGE', 'EXPIRY_REMOVAL', 'RECALL'].includes(data.type);

    if (isDecrease) {
      const available = batch.quantity - batch.reservedQty;
      if (available < data.quantity) {
        throw new AppError(
          `Only ${available} units available for adjustment`,
          400,
          'INSUFFICIENT_STOCK',
        );
      }
    }

    await db.$transaction(async (tx) => {
      await tx.inventoryBatch.update({
        where: { id: data.batchId },
        data: {
          quantity: isDecrease
            ? { decrement: data.quantity }
            : { increment: data.quantity },
        },
      });

      await tx.stockAdjustment.create({
        data: {
          batchId: data.batchId,
          userId,
          type: data.type as StockAdjustmentType,
          quantity: data.quantity,
          reason: data.reason,
          referenceId: data.referenceId,
        },
      });
    });

    await productService.recalculateStock(batch.productId);
  }

  async getExpiringSoon(days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);

    return db.inventoryBatch.findMany({
      where: {
        isActive: true,
        expiryDate: { lte: cutoff, gt: new Date() },
        quantity: { gt: 0 },
      },
      include: { product: { select: { id: true, name: true, sku: true } } },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async getLowStock(threshold = 10) {
    return db.product.findMany({
      where: { totalStock: { lte: threshold }, isActive: true, deletedAt: null },
      select: { id: true, name: true, sku: true, totalStock: true },
      orderBy: { totalStock: 'asc' },
    });
  }
}

export const inventoryService = new InventoryService();
