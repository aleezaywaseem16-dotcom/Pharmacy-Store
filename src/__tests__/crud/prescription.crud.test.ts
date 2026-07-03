import { prescriptionService } from '@/services/prescription.service';

jest.mock('@/config/database', () => ({
  db: {
    prescription: {
      create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(),
      update: jest.fn(), count: jest.fn(),
    },
    prescriptionItem: { createMany: jest.fn() },
    notification: { create: jest.fn() },
  },
}));
jest.mock('@/config/env', () => ({ env: { NODE_ENV: 'test' } }));
jest.mock('@/services/notification.service', () => ({
  notificationService: { create: jest.fn().mockResolvedValue(undefined) },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockDb = require('@/config/database').db;

beforeEach(() => jest.clearAllMocks());

const basePrescription = {
  id: 'rx-001', userId: 'u-1', status: 'PENDING',
  imageKeys: ['uploads/prescriptions/rx1.jpg'],
  doctorName: 'Dr. Ahmed', items: [],
};

describe('Prescription CRUD', () => {
  describe('CREATE', () => {
    it('creates a prescription with image keys', async () => {
      mockDb.prescription.create.mockResolvedValueOnce(basePrescription);

      const result = await prescriptionService.create('u-1', {
        imageKeys: ['uploads/prescriptions/rx1.jpg'],
        doctorName: 'Dr. Ahmed',
      });

      expect(mockDb.prescription.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 'u-1' }) }),
      );
      expect(result.status).toBe('PENDING');
    });
  });

  describe('READ', () => {
    it('returns all prescriptions for a user', async () => {
      mockDb.prescription.findMany.mockResolvedValueOnce([basePrescription]);
      mockDb.prescription.count.mockResolvedValueOnce(1);

      const result = await prescriptionService.getUserPrescriptions('u-1', 1, 10);
      expect(result.data).toHaveLength(1);
    });

    it('returns a single prescription by id for owner', async () => {
      mockDb.prescription.findFirst.mockResolvedValueOnce(basePrescription);
      const result = await prescriptionService.getById('rx-001', 'u-1');
      expect(result.id).toBe('rx-001');
    });

    it('throws NOT_FOUND for prescription not owned by user', async () => {
      mockDb.prescription.findFirst.mockResolvedValueOnce(null);
      await expect(prescriptionService.getById('rx-001', 'other')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('UPDATE — review', () => {
    it('approves a prescription', async () => {
      mockDb.prescription.findFirst.mockResolvedValueOnce({ ...basePrescription, status: 'PENDING' });
      mockDb.prescription.update.mockResolvedValueOnce({ ...basePrescription, status: 'APPROVED' });

      const result = await prescriptionService.review('rx-001', 'pharmacist-1', {
        status: 'APPROVED',
      });

      expect(result.status).toBe('APPROVED');
    });

    it('rejects a prescription with reason', async () => {
      mockDb.prescription.findFirst.mockResolvedValueOnce({ ...basePrescription, status: 'UNDER_REVIEW' });
      mockDb.prescription.update.mockResolvedValueOnce({ ...basePrescription, status: 'REJECTED' });

      const result = await prescriptionService.review('rx-001', 'pharmacist-1', {
        status: 'REJECTED',
        rejectionReason: 'Illegible image',
      });

      expect(result.status).toBe('REJECTED');
    });
  });
});
