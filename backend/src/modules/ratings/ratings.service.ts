import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from './rating.entity';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateRatingDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;
}

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating) private ratingRepo: Repository<Rating>,
  ) {}

  async upsert(userId: string, dto: CreateRatingDto) {
    let existing = await this.ratingRepo.findOne({
      where: { userId, tenantId: dto.tenantId },
    });

    if (existing) {
      await this.ratingRepo.update(existing.id, {
        rating: dto.rating,
        comment: dto.comment,
      });
      return this.ratingRepo.findOne({ where: { id: existing.id } });
    }

    return this.ratingRepo.save(
      this.ratingRepo.create({
        userId,
        tenantId: dto.tenantId,
        rating: dto.rating,
        comment: dto.comment,
      }),
    );
  }

  async getMyRatings(userId: string) {
    return this.ratingRepo.find({
      where: { userId },
      relations: ['tenant'],
      order: { updatedAt: 'DESC' },
    });
  }

  async getTenantRating(tenantId: string) {
    const result = await this.ratingRepo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(r.id)', 'count')
      .where('r.tenantId = :tenantId', { tenantId })
      .getRawOne();

    return {
      average: result.avg ? parseFloat(parseFloat(result.avg).toFixed(1)) : 0,
      count: parseInt(result.count) || 0,
    };
  }

  async getTenantRatings(tenantId: string) {
    return this.ratingRepo.find({
      where: { tenantId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}
