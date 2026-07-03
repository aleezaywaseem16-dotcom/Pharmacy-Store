import { Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { db } from '@/config/database';
import { asyncHandler } from '@/utils/asyncHandler';
import { AppError } from '@/utils/AppError';
import { parsePagination, buildPaginatedResponse } from '@/utils/pagination';

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const pagination = parsePagination(req.query.page, req.query.limit);
  const q = req.query.q as string | undefined;

  const where = {
    deletedAt: null,
    ...(q && {
      OR: [
        { email: { contains: q, mode: 'insensitive' as const } },
        { firstName: { contains: q, mode: 'insensitive' as const } },
        { lastName: { contains: q, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    db.user.count({ where }),
  ]);

  res.json(buildPaginatedResponse(users, total, pagination));
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await db.user.findFirst({
    where: { id: req.params.id, deletedAt: null },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      isActive: true,
      isVerified: true,
      createdAt: true,
      _count: { select: { orders: true, prescriptions: true } },
    },
  });
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
  res.json({ success: true, data: user });
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const { isActive } = req.body as { isActive: boolean };
  const user = await db.user.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

  const updated = await db.user.update({
    where: { id: req.params.id },
    data: { isActive },
    select: { id: true, email: true, isActive: true },
  });

  res.json({ success: true, data: updated });
});

export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.body as { role: UserRole };

  if (!Object.values(UserRole).includes(role)) {
    throw new AppError('Invalid role', 400, 'INVALID_ROLE');
  }

  if (req.params.id === req.user!.id) {
    throw new AppError('Cannot change your own role', 400, 'SELF_ROLE_CHANGE');
  }

  const user = await db.user.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

  const updated = await db.user.update({
    where: { id: req.params.id },
    data: { role },
    select: { id: true, email: true, role: true },
  });

  res.json({ success: true, data: updated });
});
