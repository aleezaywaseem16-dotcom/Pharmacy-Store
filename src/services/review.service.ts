import { UserRole } from '@prisma/client';
import { db } from '@/config/database';
import { AppError } from '@/utils/AppError';
import { parsePagination, buildPaginatedResponse } from '@/utils/pagination';
import { productService } from '@/services/product.service';
import { CreateReviewInput } from '@/validators/prescription.validator';

class ReviewService {
  async getProductReviews(productId: string, page: unknown, limit: unknown) {
    const pagination = parsePagination(page, limit);

    const [reviews, total] = await Promise.all([
      db.productReview.findMany({
        where: { productId, isApproved: true },
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      db.productReview.count({ where: { productId, isApproved: true } }),
    ]);

    return buildPaginatedResponse(reviews, total, pagination);
  }

  async createReview(userId: string, productId: string, data: CreateReviewInput) {
    const product = await db.product.findFirst({
      where: { id: productId, isActive: true, deletedAt: null },
    });
    if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');

    const existing = await db.productReview.findUnique({
      where: { productId_userId: { productId, userId } },
    });
    if (existing) throw new AppError('You have already reviewed this product', 409, 'ALREADY_REVIEWED');

    const verifiedPurchase = await db.orderItem.findFirst({
      where: {
        productId,
        order: { userId, status: 'DELIVERED' },
      },
    });

    const review = await db.productReview.create({
      data: {
        productId,
        userId,
        rating: data.rating,
        title: data.title,
        body: data.body,
        isVerified: !!verifiedPurchase,
        isApproved: false,
      },
    });

    return review;
  }

  async approveReview(id: string): Promise<void> {
    const review = await db.productReview.findUnique({ where: { id } });
    if (!review) throw new AppError('Review not found', 404, 'NOT_FOUND');

    await db.productReview.update({ where: { id }, data: { isApproved: true } });
    await productService.recalculateRating(review.productId);
  }

  async deleteReview(id: string, userId: string, role: UserRole): Promise<void> {
    const review = await db.productReview.findUnique({ where: { id } });
    if (!review) throw new AppError('Review not found', 404, 'NOT_FOUND');

    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && review.userId !== userId) {
      throw new AppError('You cannot delete this review', 403, 'FORBIDDEN');
    }

    await db.productReview.delete({ where: { id } });
    await productService.recalculateRating(review.productId);
  }
}

export const reviewService = new ReviewService();
