import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as userController from '@/controllers/admin/user.controller';
import { authorize } from '@/middleware/role.middleware';
import { validateParams } from '@/middleware/validate.middleware';
import { idParamSchema } from '@/validators/order.validator';

const router = Router();

router.get('/', authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), userController.getUsers);
router.get('/:id', authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), validateParams(idParamSchema), userController.getUserById);
router.patch('/:id/status', authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), validateParams(idParamSchema), userController.updateUserStatus);
router.patch('/:id/role', authorize(UserRole.SUPER_ADMIN), validateParams(idParamSchema), userController.updateUserRole);

export default router;
