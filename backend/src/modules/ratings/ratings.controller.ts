import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RatingsService, CreateRatingDto } from './ratings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Ratings')
@Controller('v1/ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create or update rating for a tenant' })
  upsert(@CurrentUser('id') userId: string, @Body() dto: CreateRatingDto) {
    return this.ratingsService.upsert(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('my')
  @ApiOperation({ summary: 'Get my ratings' })
  getMyRatings(@CurrentUser('id') userId: string) {
    return this.ratingsService.getMyRatings(userId);
  }

  @Public()
  @Get('tenant/:tenantId')
  @ApiOperation({ summary: 'Get average rating for a tenant' })
  getTenantRating(@Param('tenantId') tenantId: string) {
    return this.ratingsService.getTenantRating(tenantId);
  }

  @Public()
  @Get('tenant/:tenantId/all')
  @ApiOperation({ summary: 'Get all ratings for a tenant' })
  getTenantRatings(@Param('tenantId') tenantId: string) {
    return this.ratingsService.getTenantRatings(tenantId);
  }
}
