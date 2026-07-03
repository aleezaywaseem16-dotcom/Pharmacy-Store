import crypto from 'crypto';
import { PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { db } from '@/config/database';
import { AppError } from '@/utils/AppError';
import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { notificationService } from '@/services/notification.service';

class PaymentService {
  async initiatePayment(orderId: string, userId: string) {
    const order = await db.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');

    if (order.paymentStatus === 'PAID') {
      throw new AppError('Order is already paid', 400, 'ALREADY_PAID');
    }

    const existing = await db.payment.findUnique({ where: { orderId } });
    if (existing) return existing;

    return db.payment.create({
      data: {
        orderId,
        amount: order.total,
        method: order.paymentMethod as PaymentMethod,
        status: 'UNPAID',
      },
    });
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    const expected = crypto
      .createHmac('sha256', env.WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  }

  async handleWebhook(rawBody: Buffer, signature: string, payload: Record<string, unknown>): Promise<void> {
    const valid = this.verifyWebhookSignature(rawBody, signature);
    if (!valid) {
      throw new AppError('Invalid webhook signature', 401, 'WEBHOOK_SIGNATURE_INVALID');
    }

    const transactionId = String(payload.transactionId ?? '');
    const status = String(payload.status ?? '');
    const orderId = String(payload.orderId ?? '');

    if (!transactionId || !status || !orderId) {
      logger.warn({ event: 'webhook_invalid_payload', payload });
      return;
    }

    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) {
      logger.warn({ event: 'webhook_order_not_found', orderId });
      return;
    }

    const paymentStatus: PaymentStatus = status === 'SUCCESS' ? 'PAID' : 'FAILED';

    await db.$transaction(async (tx) => {
      await tx.payment.upsert({
        where: { orderId },
        create: {
          orderId,
          amount: order.total,
          method: order.paymentMethod,
          status: paymentStatus,
          transactionId,
          gatewayResponse: payload as Prisma.InputJsonValue,
          paidAt: paymentStatus === 'PAID' ? new Date() : undefined,
        },
        update: {
          status: paymentStatus,
          transactionId,
          gatewayResponse: payload as Prisma.InputJsonValue,
          paidAt: paymentStatus === 'PAID' ? new Date() : undefined,
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { paymentStatus },
      });
    });

    if (paymentStatus === 'PAID') {
      await notificationService.create(
        order.userId,
        'PAYMENT_RECEIVED',
        'Payment Received',
        `Payment of PKR ${order.total} confirmed for order ${order.orderNumber}.`,
        { orderId },
      );
    }

    logger.info({ event: 'webhook_processed', orderId, paymentStatus, transactionId });
  }
}

export const paymentService = new PaymentService();
