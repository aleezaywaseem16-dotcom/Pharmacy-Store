import { db } from '@/config/database';
import { AppError } from '@/utils/AppError';

class WishlistService {
  async add(userId: string, productId: string) {
    const product = await db.product.findFirst({
      where: { id: productId, isActive: true, deletedAt: null },
    });
    if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');

    const existing = await db.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (existing) throw new AppError('Product already in wishlist', 409, 'ALREADY_IN_WISHLIST');

    return db.wishlistItem.create({ data: { userId, productId } });
  }

  async getWishlist(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      db.wishlistItem.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { addedAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              discountedPrice: true,
              totalStock: true,
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      }),
      db.wishlistItem.count({ where: { userId } }),
    ]);
    return { data, total, page, limit };
  }

  async isInWishlist(userId: string, productId: string): Promise<boolean> {
    const item = await db.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    return !!item;
  }

  async remove(userId: string, productId: string): Promise<void> {
    const item = await db.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (!item) throw new AppError('Item not in wishlist', 404, 'NOT_FOUND');

    await db.wishlistItem.delete({
      where: { userId_productId: { userId, productId } },
    });
  }
}

export const wishlistService = new WishlistService();
