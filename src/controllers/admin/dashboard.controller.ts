import { Request, Response } from 'express';
import { db } from '@/config/database';
import { asyncHandler } from '@/utils/asyncHandler';

export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const [
    totalOrders,
    pendingOrders,
    totalUsers,
    totalProducts,
    recentOrders,
    lowStock,
    pendingPrescriptions,
    todayRevenue,
  ] = await Promise.all([
    db.order.count(),
    db.order.count({ where: { status: 'PENDING' } }),
    db.user.count({ where: { role: 'CUSTOMER', deletedAt: null } }),
    db.product.count({ where: { isActive: true, deletedAt: null } }),
    db.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    }),
    db.product.findMany({
      where: { totalStock: { lte: 10 }, isActive: true, deletedAt: null },
      select: { id: true, name: true, sku: true, totalStock: true },
      take: 5,
      orderBy: { totalStock: 'asc' },
    }),
    db.prescription.count({ where: { status: 'PENDING' } }),
    db.order.aggregate({
      where: {
        paymentStatus: 'PAID',
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      _sum: { total: true },
    }),
  ]);

  res.json({
    success: true,
    data: {
      metrics: {
        totalOrders,
        pendingOrders,
        totalUsers,
        totalProducts,
        pendingPrescriptions,
        todayRevenue: todayRevenue._sum.total ?? 0,
      },
      recentOrders,
      lowStockAlerts: lowStock,
    },
  });
});
