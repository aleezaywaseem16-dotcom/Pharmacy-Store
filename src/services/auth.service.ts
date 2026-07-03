import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/config/database';
import { env } from '@/config/env';
import { AppError } from '@/utils/AppError';
import { signAccessToken } from '@/utils/jwt';
import { emailService } from '@/services/email.service';
import {
  RegisterInput,
  LoginInput,
  ResetPasswordInput,
  UpdateProfileInput,
  AddressInput,
} from '@/validators/auth.validator';

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function generateRawToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

class AuthService {
  async register(data: RegisterInput) {
    const existing = await db.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new AppError('Email already in use', 409, 'EMAIL_TAKEN');
    }

    const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);
    const user = await db.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });

    const verificationToken = generateRawToken();
    const tokenHash = hashToken(verificationToken);

    await db.emailVerificationToken.create({
      data: {
        email: data.email,
        token: tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await emailService.sendVerificationEmail(data.email, verificationToken);

    return user;
  }

  async login(
    data: LoginInput,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ accessToken: string; refreshToken: string; rememberMe: boolean; user: object }> {
    const user = await db.user.findUnique({ where: { email: data.email } });

    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403, 'ACCOUNT_INACTIVE');
    }

    const accessToken = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const rawRefreshToken = generateRawToken();
    const tokenHash = hashToken(rawRefreshToken);

    // rememberMe = 30 days; default session = REFRESH_TOKEN_EXPIRES_DAYS (7 days)
    const ttlDays = data.rememberMe ? 30 : env.REFRESH_TOKEN_EXPIRES_DAYS;
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    await db.refreshToken.create({
      data: { userId: user.id, tokenHash, expiresAt, ipAddress, userAgent },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      rememberMe: data.rememberMe,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified,
      },
    };
  }

  async logoutAll(userId: string): Promise<void> {
    await db.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async refreshToken(
    rawToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenHash = hashToken(rawToken);

    const stored = await db.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token', 401, 'TOKEN_INVALID');
    }

    const user = await db.user.findUnique({ where: { id: stored.userId } });
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401, 'AUTH_REQUIRED');
    }

    if (
      user.passwordChangedAt &&
      stored.issuedAt < user.passwordChangedAt
    ) {
      await db.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      });
      throw new AppError('Session invalidated — please log in again', 401, 'SESSION_INVALID');
    }

    await db.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const accessToken = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const newRaw = generateRawToken();
    const newHash = hashToken(newRaw);
    const expiresAt = new Date(
      Date.now() + env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
    );

    await db.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: newHash,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    return { accessToken, refreshToken: newRaw };
  }

  async logout(rawToken: string): Promise<void> {
    const tokenHash = hashToken(rawToken);
    await db.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async verifyEmail(rawToken: string): Promise<void> {
    const tokenHash = hashToken(rawToken);

    const record = await db.emailVerificationToken.findUnique({
      where: { token: tokenHash },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new AppError('Invalid or expired verification token', 400, 'TOKEN_INVALID');
    }

    await db.$transaction([
      db.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      db.user.update({
        where: { email: record.email },
        data: { isVerified: true, emailVerifiedAt: new Date() },
      }),
    ]);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await db.user.findUnique({ where: { email } });
    if (!user) return;

    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);

    await db.passwordResetToken.create({
      data: {
        email,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await emailService.sendPasswordReset(email, rawToken);
  }

  async resetPassword(data: ResetPasswordInput): Promise<void> {
    const tokenHash = hashToken(data.token);

    const record = await db.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new AppError('Invalid or expired reset token', 400, 'TOKEN_INVALID');
    }

    const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);

    await db.$transaction([
      db.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      db.user.update({
        where: { email: record.email },
        data: { passwordHash, passwordChangedAt: new Date() },
      }),
    ]);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new AppError('Current password is incorrect', 400, 'INVALID_CREDENTIALS');

    const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
    await db.user.update({
      where: { id: userId },
      data: { passwordHash, passwordChangedAt: new Date() },
    });

    await db.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getProfile(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
    return user;
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    return db.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
      },
    });
  }

  async getAddresses(userId: string) {
    return db.userAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { id: 'asc' }],
    });
  }

  async addAddress(userId: string, data: AddressInput) {
    if (data.isDefault) {
      await db.userAddress.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }
    return db.userAddress.create({ data: { userId, ...data } });
  }

  async updateAddress(id: string, userId: string, data: AddressInput) {
    const address = await db.userAddress.findFirst({ where: { id, userId } });
    if (!address) throw new AppError('Address not found', 404, 'NOT_FOUND');

    if (data.isDefault) {
      await db.userAddress.updateMany({
        where: { userId, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return db.userAddress.update({ where: { id }, data });
  }

  async deleteAddress(id: string, userId: string): Promise<void> {
    const address = await db.userAddress.findFirst({ where: { id, userId } });
    if (!address) throw new AppError('Address not found', 404, 'NOT_FOUND');
    await db.userAddress.delete({ where: { id } });
  }
}

export const authService = new AuthService();
