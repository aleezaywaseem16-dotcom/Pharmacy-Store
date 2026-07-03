import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { authorize } from '@/middleware/role.middleware';
import { validateQuery } from '@/middleware/validate.middleware';
import { asyncHandler } from '@/utils/asyncHandler';
import { db } from '@/config/database';

const router = Router();
router.use(authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN));

const dateRangeQuery = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  period: z.enum(['day', 'week', 'month', 'year']).default('month'),
});

function periodRange(period: string): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  if (period === 'day') from.setDate(from.getDate() - 1);
  else if (period === 'week') from.setDate(from.getDate() - 7);
  else if (period === 'month') from.setMonth(from.getMonth() - 1);
  else if (period === 'year') from.setFullYear(from.getFullYear() - 1);
  return { from, to };
}

router.get(
  '/revenue',
  validateQuery(dateRangeQuery),
  asyncHandler(async (req, res) => {
    const { from: defaultFrom, to } = periodRange(req.query.period as string ?? 'month');
    const from = req.query.from ? new Date(req.query.from as string) : defaultFrom;
    const until = req.query.to ? new Date(req.query.to as string) : to;

    const [totalRevenue, paidOrders, pendingOrders, revenueByDay] = await Promise.all([
      db.order.aggregate({
        where: { paymentStatus: 'PAID', createdAt: { gte: from, lte: until } },
        _sum: { total: true },
        _count: true,
      }),
      db.order.count({ where: { paymentStatus: 'PAID', createdAt: { gte: from, lte: until } } }),
      db.order.count({ where: { paymentStatus: 'UNPAID', createdAt: { gte: from, lte: until } } }),
      db.$queryRaw<{ date: string; revenue: number; orders: number }[]>`
        SELECT
          DATE_TRUNC('day', created_at)::date::text AS date,
          SUM(CASE WHEN payment_status = 'PAID' THEN total ELSE 0 END)::float AS revenue,
          COUNT(*)::int AS orders
        FROM orders
        WHERE created_at >= ${from} AND created_at <= ${until}
        GROUP BY 1
        ORDER BY 1
      `,
    ]);

    res.json({
      success: true,
      data: {
        totalRevenue: totalRevenue._sum.total ?? 0,
        totalOrders: totalRevenue._count,
        paidOrders,
        pendingOrders,
        revenueByDay,
      },
    });
  }),
);

router.get(
  '/orders',
  validateQuery(dateRangeQuery),
  asyncHandler(async (req, res) => {
    const { from: defaultFrom, to } = periodRange(req.query.period as string ?? 'month');
    const from = req.query.from ? new Date(req.query.from as string) : defaultFrom;
    const until = req.query.to ? new Date(req.query.to as string) : to;

    const [byStatus, byPayment, topProducts] = await Promise.all([
      db.order.groupBy({
        by: ['status'],
        where: { createdAt: { gte: from, lte: until } },
        _count: true,
      }),
      db.order.groupBy({
        by: ['paymentMethod'],
        where: { createdAt: { gte: from, lte: until } },
        _count: true,
      }),
      db.orderItem.groupBy({
        by: ['productId', 'productName'],
        where: { order: { createdAt: { gte: from, lte: until } } },
        _sum: { quantity: true, subtotal: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),
    ]);

    res.json({
      success: true,
      data: { byStatus, byPayment, topProducts },
    });
  }),
);

export default router;
