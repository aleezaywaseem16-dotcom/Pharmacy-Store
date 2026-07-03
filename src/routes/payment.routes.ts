import { Router, Request, Response, NextFunction } from 'express';
import * as paymentController from '@/controllers/payment.controller';
import { authenticate } from '@/middleware/auth.middleware';
import express from 'express';

const router = Router();

router.post('/initiate', authenticate, paymentController.initiatePayment);

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  (req: Request, _res: Response, next: NextFunction) => {
    if (req.body && Buffer.isBuffer(req.body)) {
      next();
    } else {
      req.body = Buffer.from(JSON.stringify(req.body));
      next();
    }
  },
  paymentController.handleWebhook,
);

export default router;
