import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { QrService } from './qr.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('v1/qr')
@UseGuards(JwtAuthGuard)
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Get('table/:tableId')
  generateQr(@Param('tableId') tableId: string) {
    const appUrl = process.env.APP_URL || 'http://localhost:3001';
    return this.qrService.generateQr(tableId, appUrl);
  }
}
