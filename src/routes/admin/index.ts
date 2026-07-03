import { Router } from 'express';
import { getDashboard } from '@/controllers/admin/dashboard.controller';
import productRoutes from '@/routes/admin/product.routes';
import orderRoutes from '@/routes/admin/order.routes';
import inventoryRoutes from '@/routes/admin/inventory.routes';
import userRoutes from '@/routes/admin/user.routes';
import categoryRoutes from '@/routes/admin/category.routes';
import reviewRoutes from '@/routes/admin/review.routes';
import couponRoutes from '@/routes/admin/coupon.routes';
import reportRoutes from '@/routes/admin/report.routes';

const router = Router();

router.get('/dashboard', getDashboard);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/reviews', reviewRoutes);
router.use('/coupons', couponRoutes);
router.use('/reports', reportRoutes);

export default router;
