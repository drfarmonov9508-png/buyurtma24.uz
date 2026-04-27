import { Injectable } from '@nestjs/common';
import { join } from 'path';
import * as sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';

@Injectable()
export class UploadService {
  private uploadsDir = join(process.cwd(), 'uploads');

  constructor() {
    if (!existsSync(this.uploadsDir)) mkdirSync(this.uploadsDir, { recursive: true });
  }

  async processImage(filePath: string, filename: string) {
    const thumbPath = join(this.uploadsDir, 'thumbs');
    if (!existsSync(thumbPath)) mkdirSync(thumbPath, { recursive: true });

    await sharp(filePath)
      .resize(300, 300, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(join(thumbPath, `${filename}.webp`));

    return {
      original: `/uploads/${filename}`,
      thumbnail: `/uploads/thumbs/${filename}.webp`,
    };
  }

  getFileUrl(filename: string) {
    return `/uploads/${filename}`;
  }
}
