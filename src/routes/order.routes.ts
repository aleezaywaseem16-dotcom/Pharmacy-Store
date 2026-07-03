import { Router } from 'express';
import * as orderController from '@/controllers/order.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validateBody, validateParams } from '@/middleware/validate.middleware';
import { createOrderSchema, cancelOrderSchema } from '@/validators/order.validator';
import { idParamSchema } from '@/validators/order.validator';

const router = Router();

router.use(authenticate);

router.get('/', orderController.getUserOrders);
router.post('/', validateBody(createOrderSchema), orderController.createOrder);
router.get('/:id', validateParams(idParamSchema), orderController.getOrderById);
router.patch('/:id/cancel', validateParams(idParamSchema), validateBody(cancelOrderSchema), orderController.cancelOrder);

export default router;
