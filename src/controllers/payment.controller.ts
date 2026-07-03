import { Request, Response } from 'express';
import { paymentService } from '@/services/payment.service';
import { asyncHandler } from '@/utils/asyncHandler';
import { AppError } from '@/utils/AppError';

export const initiatePayment = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.body;
  if (!orderId) throw new AppError('orderId is required', 400, 'VALIDATION_ERROR');
  const payment = await paymentService.initiatePayment(orderId, req.user!.id);
  res.json({ success: true, data: payment });
});

export const handleWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['x-webhook-signature'] as string | undefined;
  if (!signature) {
    throw new AppError('Webhook signature missing', 401, 'WEBHOOK_SIGNATURE_MISSING');
  }

  const rawBody = req.body as Buffer;
  let payload: Record<string, unknown>;

  try {
    payload = JSON.parse(rawBody.toString()) as Record<string, unknown>;
  } catch {
    throw new AppError('Invalid JSON payload', 400, 'INVALID_PAYLOAD');
  }

  await paymentService.handleWebhook(rawBody, signature, payload);
  res.json({ success: true });
});
