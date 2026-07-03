import { Router } from 'express';
import * as cartController from '@/controllers/cart.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validateBody, validateParams } from '@/middleware/validate.middleware';
import { addCartItemSchema, updateCartItemSchema } from '@/validators/order.validator';
import { z } from 'zod';

const itemParamSchema = z.object({ itemId: z.string().uuid() });

const router = Router();

router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/items', validateBody(addCartItemSchema), cartController.addCartItem);
router.patch('/items/:itemId', validateParams(itemParamSchema), validateBody(updateCartItemSchema), cartController.updateCartItem);
router.delete('/items/:itemId', validateParams(itemParamSchema), cartController.removeCartItem);
router.delete('/', cartController.clearCart);

export default router;
