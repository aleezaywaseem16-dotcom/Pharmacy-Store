import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as productController from '@/controllers/product.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { authorize } from '@/middleware/role.middleware';
import { validateBody, validateQuery, validateParams } from '@/middleware/validate.middleware';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} from '@/validators/product.validator';
import { idParamSchema } from '@/validators/order.validator';

const router = Router();

router.get('/', validateQuery(productQuerySchema), productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/:slug', productController.getProductBySlug);

router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateBody(createProductSchema),
  productController.createProduct,
);

router.patch(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateParams(idParamSchema),
  validateBody(updateProductSchema),
  productController.updateProduct,
);

router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateParams(idParamSchema),
  productController.deleteProduct,
);

export default router;
