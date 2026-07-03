import jwt, { SignOptions } from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { JwtPayload } from '@/types';
import { AppError } from '@/utils/AppError';
import { env } from '@/config/env';

export function signAccessToken(payload: {
  id: string;
  email: string;
  role: UserRole;
}): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };

  return jwt.sign(
    { sub: payload.id, email: payload.email, role: payload.role },
    env.JWT_SECRET,
    options,
  );
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError('Token expired', 401, 'TOKEN_EXPIRED');
    }
    throw new AppError('Invalid token', 401, 'TOKEN_INVALID');
  }
}
