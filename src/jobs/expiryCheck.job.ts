import cron from 'node-cron';
import { db } from '@/config/database';
import { logger } from '@/config/logger';
import { notificationService } from '@/services/notification.service';

async function checkExpiringBatches(): Promise<void> {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + 30);

    const expiring = await db.inventoryBatch.findMany({
      where: {
        isActive: true,
        expiryDate: { lte: cutoff, gt: new Date() },
        quantity: { gt: 0 },
      },
      include: { product: { select: { name: true, sku: true } } },
    });

    if (expiring.length === 0) return;

    const admins = await db.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, isActive: true, deletedAt: null },
      select: { id: true },
    });

    for (const admin of admins) {
      await notificationService.create(
        admin.id,
        'EXPIRY_ALERT',
        'Expiry Alert',
        `${expiring.length} batch(es) are expiring within 30 days.`,
        { count: expiring.length },
      );
    }

    logger.info({ event: 'expiry_check_done', count: expiring.length });
  } catch (error) {
    logger.error({ event: 'expiry_check_failed', error: (error as Error).message });
  }
}

export function startExpiryCheckJob(): void {
  cron.schedule('0 6 * * *', checkExpiringBatches, { timezone: 'Asia/Karachi' });
  logger.info('Expiry check job scheduled (daily at 06:00 PKT)');
}
