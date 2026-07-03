import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as productController from '@/controllers/product.controller';
import { authorize } from '@/middleware/role.middleware';
import { validateBody, validateParams, validateQuery } from '@/middleware/validate.middleware';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} from '@/validators/product.validator';
import { idParamSchema } from '@/validators/order.validator';

const router = Router();

router.use(authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN));

router.get('/', validateQuery(productQuerySchema), productController.getProducts);
router.post('/', validateBody(createProductSchema), productController.createProduct);
router.patch('/:id', validateParams(idParamSchema), validateBody(updateProductSchema), productController.updateProduct);
router.delete('/:id', validateParams(idParamSchema), productController.deleteProduct);

export default router;
