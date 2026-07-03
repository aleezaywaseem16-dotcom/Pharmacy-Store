import fs from 'fs';
import path from 'path';
import { env } from '@/config/env';
import { AppError } from '@/utils/AppError';

class StorageService {
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    const dirs = [
      this.baseDir,
      path.join(this.baseDir, 'products'),
      path.join(this.baseDir, 'prescriptions'),
    ];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  getFileUrl(storageKey: string): string {
    return `/uploads/${storageKey}`;
  }

  getPresignedUrl(storageKey: string, _expiresInSeconds = 900): string {
    return `/uploads/${storageKey}`;
  }

  async deleteFile(storageKey: string): Promise<void> {
    const filePath = path.join(this.baseDir, storageKey);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      throw new AppError('Failed to delete file', 500, 'FILE_DELETE_ERROR');
    }
  }

  buildKey(folder: string, filename: string): string {
    return `${folder}/${filename}`;
  }
}

export const storageService = new StorageService();
