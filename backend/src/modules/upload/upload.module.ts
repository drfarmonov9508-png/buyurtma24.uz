import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (req, file, cb) => {
          cb(null, `${uuidv4()}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 100 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowedMime = [
          'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
          'image/gif', 'image/bmp', 'image/avif', 'image/svg+xml',
          'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo',
        ];
        const allowedExt = /\.(jpg|jpeg|jfif|png|webp|gif|bmp|avif|svg|mp4|webm|ogg|mov|avi)$/i;
        const isAllowed = allowedMime.includes(file.mimetype) || allowedExt.test(file.originalname);
        if (isAllowed) { cb(null, true); }
        else { cb(new Error('Faqat rasm yoki video fayllari ruxsat etiladi'), false); }
      },
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
