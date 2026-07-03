import { db } from '@/config/database';
import { AppError } from '@/utils/AppError';
import { parsePagination, buildPaginatedResponse } from '@/utils/pagination';
import { notificationService } from '@/services/notification.service';
import {
  CreatePrescriptionInput,
  ReviewPrescriptionInput,
} from '@/validators/prescription.validator';

class PrescriptionService {
  async create(
    userId: string,
    data: CreatePrescriptionInput & { imageKeys?: string[] },
    legacyImageKeys?: string[],
  ) {
    const imageKeys = data.imageKeys ?? legacyImageKeys ?? [];

    if (imageKeys.length === 0) {
      throw new AppError('At least one prescription image is required', 400, 'IMAGES_REQUIRED');
    }

    const expiresAt = data.issuedDate
      ? new Date(data.issuedDate.getTime() + 180 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);

    return db.prescription.create({
      data: {
        userId,
        doctorName: data.doctorName,
        doctorLicense: data.doctorLicense,
        hospitalName: data.hospitalName,
        issuedDate: data.issuedDate,
        imageKeys,
        expiresAt,
        notes: data.notes,
      },
    });
  }

  async getUserPrescriptions(
    userId: string,
    page: unknown,
    limit: unknown,
    status?: string,
  ) {
    const pagination = parsePagination(page, limit);

    const where = {
      userId,
      ...(status && { status: status as never }),
    };

    const [prescriptions, total] = await Promise.all([
      db.prescription.findMany({
        where,
        include: { items: { include: { product: { select: { id: true, name: true, slug: true } } } } },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      db.prescription.count({ where }),
    ]);

    return buildPaginatedResponse(prescriptions, total, pagination);
  }

  async getById(id: string, userId?: string) {
    const prescription = await db.prescription.findFirst({
      where: { id, ...(userId && { userId }) },
      include: {
        items: { include: { product: { select: { id: true, name: true, slug: true } } } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
    if (!prescription) throw new AppError('Prescription not found', 404, 'NOT_FOUND');
    return prescription;
  }

  async delete(id: string, userId: string): Promise<void> {
    const prescription = await db.prescription.findFirst({ where: { id, userId } });
    if (!prescription) throw new AppError('Prescription not found', 404, 'NOT_FOUND');

    if (prescription.status !== 'PENDING') {
      throw new AppError(
        'Only PENDING prescriptions can be deleted',
        400,
        'CANNOT_DELETE',
      );
    }

    await db.prescription.delete({ where: { id } });
  }

  async getPendingQueue(page: unknown, limit: unknown, status?: string) {
    const pagination = parsePagination(page, limit);

    const where = {
      status: (status as never) ?? 'PENDING',
    };

    const [prescriptions, total] = await Promise.all([
      db.prescription.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          items: true,
        },
        orderBy: { createdAt: 'asc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      db.prescription.count({ where }),
    ]);

    return buildPaginatedResponse(prescriptions, total, pagination);
  }

  async review(id: string, pharmacistId: string, data: ReviewPrescriptionInput) {
    const prescription = await db.prescription.findFirst({ where: { id } });
    if (!prescription) throw new AppError('Prescription not found', 404, 'NOT_FOUND');

    if (!['PENDING', 'UNDER_REVIEW'].includes(prescription.status)) {
      throw new AppError('Prescription cannot be reviewed at this stage', 400, 'INVALID_STATUS');
    }

    if (data.status === 'APPROVED' && data.items && data.items.length > 0) {
      await db.prescriptionItem.deleteMany({ where: { prescriptionId: id } });
      await db.prescriptionItem.createMany({
        data: data.items.map((item) => ({
          prescriptionId: id,
          productId: item.productId,
          medicationName: item.medicationName,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          quantity: item.quantity,
        })),
      });
    }

    const updated = await db.prescription.update({
      where: { id },
      data: {
        status: data.status,
        reviewedById: pharmacistId,
        reviewedAt: new Date(),
        rejectionReason: data.rejectionReason,
        notes: data.notes ?? prescription.notes,
      },
    });

    await notificationService.create(
      prescription.userId,
      data.status === 'APPROVED' ? 'PRESCRIPTION_APPROVED' : 'PRESCRIPTION_REJECTED',
      `Prescription ${data.status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
      data.status === 'APPROVED'
        ? 'Your prescription has been approved. You can now place your order.'
        : `Your prescription was rejected: ${data.rejectionReason ?? 'See details.'}`,
      { prescriptionId: id },
    );

    return updated;
  }
}

export const prescriptionService = new PrescriptionService();
