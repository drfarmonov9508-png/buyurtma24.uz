import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BilliardClub } from './billiard-club.entity';
import { BilliardTable, BilliardTableStatus } from './billiard-table.entity';
import { BilliardOrder, BilliardOrderStatus } from './billiard-order.entity';

@Injectable()
export class BilliardService {
  constructor(
    @InjectRepository(BilliardClub)
    private readonly clubRepo: Repository<BilliardClub>,
    @InjectRepository(BilliardTable)
    private readonly tableRepo: Repository<BilliardTable>,
    @InjectRepository(BilliardOrder)
    private readonly orderRepo: Repository<BilliardOrder>,
  ) {}

  async findClubs(regionId?: string, serviceSlug?: string) {
    const query = this.clubRepo.createQueryBuilder('club')
      .leftJoinAndSelect('club.region', 'region')
      .leftJoinAndSelect('club.service', 'service')
      .where('club.isActive = true');

    if (regionId) query.andWhere('club.regionId = :regionId', { regionId });
    if (serviceSlug) query.andWhere('service.slug = :serviceSlug', { serviceSlug });

    return query.orderBy('club.name', 'ASC').getMany();
  }

  async findClub(id: string) {
    const club = await this.clubRepo.findOne({ where: { id, isActive: true }, relations: ['region', 'service'] });
    if (!club) throw new NotFoundException('Club not found');
    return club;
  }

  async findTables(clubId: string) {
    const club = await this.clubRepo.findOne({ where: { id: clubId, isActive: true } });
    if (!club) throw new NotFoundException('Club not found');
    return this.tableRepo.find({ where: { clubId, isActive: true }, order: { name: 'ASC' } });
  }

  async bookTable(userId: string, tableId: string, startAt: Date, durationMinutes: number, note?: string) {
    const table = await this.tableRepo.findOne({ where: { id: tableId, isActive: true } });
    if (!table) throw new NotFoundException('Table not found');
    if (table.status !== BilliardTableStatus.FREE) {
      throw new BadRequestException('Table is not available');
    }

    const club = await this.clubRepo.findOne({ where: { id: table.clubId, isActive: true } });
    if (!club) throw new NotFoundException('Club not found');

    const start = startAt instanceof Date ? startAt : new Date(startAt);
    const end = new Date(start.getTime() + durationMinutes * 60000);
    const total = Number((Number(table.pricePerHour) * (durationMinutes / 60)).toFixed(2));

    const order = this.orderRepo.create({
      userId,
      clubId: club.id,
      tableId: table.id,
      status: BilliardOrderStatus.PENDING,
      startAt: start,
      endAt: end,
      durationMinutes,
      pricePerHour: Number(table.pricePerHour),
      total,
      note,
    });

    table.status = BilliardTableStatus.RESERVED;
    await this.tableRepo.save(table);
    return this.orderRepo.save(order);
  }

  async findMyOrders(userId: string) {
    return this.orderRepo.find({ where: { userId }, order: { createdAt: 'DESC' }, relations: ['table', 'club'] });
  }
}
