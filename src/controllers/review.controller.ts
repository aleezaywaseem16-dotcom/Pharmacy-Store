import { Request, Response } from 'express';
import { reviewService } from '@/services/review.service';
import { asyncHandler } from '@/utils/asyncHandler';

export const getProductReviews = asyncHandler(async (req: Request, res: Response) => {
  const result = await reviewService.getProductReviews(
    req.params.productId,
    req.query.page,
    req.query.limit,
  );
  res.json(result);
});

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await reviewService.createReview(
    req.user!.id,
    req.params.productId,
    req.body,
  );
  res.status(201).json({ success: true, data: review });
});

export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  await reviewService.deleteReview(req.params.id, req.user!.id, req.user!.role);
  res.json({ success: true, message: 'Review deleted' });
});
