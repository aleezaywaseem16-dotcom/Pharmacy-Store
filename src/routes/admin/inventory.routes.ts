import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as inventoryController from '@/controllers/admin/inventory.controller';
import { authorize } from '@/middleware/role.middleware';
import { validateBody } from '@/middleware/validate.middleware';
import { inventoryBatchSchema, stockAdjustmentSchema } from '@/validators/prescription.validator';

const router = Router();

router.use(authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN));

router.get('/', inventoryController.getBatches);
router.post('/batches', validateBody(inventoryBatchSchema), inventoryController.createBatch);
router.post('/adjust', validateBody(stockAdjustmentSchema), inventoryController.adjustStock);
router.get('/expiring-soon', inventoryController.getExpiringSoon);
router.get('/low-stock', inventoryController.getLowStock);

export default router;
