import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as categoryController from '@/controllers/category.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { authorize } from '@/middleware/role.middleware';
import { validateBody, validateParams } from '@/middleware/validate.middleware';
import { createCategorySchema, updateCategorySchema } from '@/validators/product.validator';
import { idParamSchema } from '@/validators/order.validator';

const router = Router();

router.get('/', categoryController.getCategories);
router.get('/:slug', categoryController.getCategoryBySlug);

router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateBody(createCategorySchema),
  categoryController.createCategory,
);

router.patch(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateParams(idParamSchema),
  validateBody(updateCategorySchema),
  categoryController.updateCategory,
);

router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateParams(idParamSchema),
  categoryController.deleteCategory,
);

export default router;
