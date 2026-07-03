import cron from 'node-cron';
import { db } from '@/config/database';
import { logger } from '@/config/logger';
import { notificationService } from '@/services/notification.service';

const LOW_STOCK_THRESHOLD = 10;

async function checkLowStock(): Promise<void> {
  try {
    const lowStock = await db.product.findMany({
      where: {
        totalStock: { lte: LOW_STOCK_THRESHOLD },
        isActive: true,
        deletedAt: null,
      },
      select: { id: true, name: true, sku: true, totalStock: true },
    });

    if (lowStock.length === 0) return;

    const admins = await db.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, isActive: true, deletedAt: null },
      select: { id: true },
    });

    for (const admin of admins) {
      await notificationService.create(
        admin.id,
        'LOW_STOCK_ALERT',
        'Low Stock Alert',
        `${lowStock.length} product(s) are running low on stock.`,
        { products: lowStock.map((p) => ({ id: p.id, name: p.name, stock: p.totalStock })) },
      );
    }

    logger.info({ event: 'low_stock_check_done', count: lowStock.length });
  } catch (error) {
    logger.error({ event: 'low_stock_check_failed', error: (error as Error).message });
  }
}

export function startStockAlertJob(): void {
  cron.schedule('0 */6 * * *', checkLowStock);
  logger.info('Stock alert job scheduled (every 6 hours)');
}
