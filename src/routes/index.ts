import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate } from '@/middleware/auth.middleware';
import { authorize } from '@/middleware/role.middleware';
import authRoutes from '@/routes/auth.routes';
import productRoutes from '@/routes/product.routes';
import categoryRoutes from '@/routes/category.routes';
import cartRoutes from '@/routes/cart.routes';
import orderRoutes from '@/routes/order.routes';
import prescriptionRoutes from '@/routes/prescription.routes';
import reviewRoutes from '@/routes/review.routes';
import paymentRoutes from '@/routes/payment.routes';
import uploadRoutes from '@/routes/upload.routes';
import adminRoutes from '@/routes/admin/index';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/reviews', reviewRoutes);
router.use('/payments', paymentRoutes);
router.use('/uploads', uploadRoutes);
router.use(
  '/admin',
  authenticate,
  authorize(UserRole.PHARMACIST, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  adminRoutes,
);

export default router;
