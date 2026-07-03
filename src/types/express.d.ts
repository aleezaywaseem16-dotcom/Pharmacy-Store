import { UserRole } from '@prisma/client';
import 'multer';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
      requestId: string;
    }
  }
}

export {};
