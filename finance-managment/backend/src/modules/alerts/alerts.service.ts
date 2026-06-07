import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from './alert.entity';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert) private alertRepo: Repository<Alert>,
  ) {}

  async findAll(): Promise<Alert[]> {
    return this.alertRepo.find();
  }

  async create(dto: {
    name: string;
    type: string;
    assetId?: string;
    portfolioId?: string;
    conditions: Record<string, any>;
    actions?: Record<string, any>;
  }): Promise<Alert> {
    const alert = this.alertRepo.create({
      name: dto.name,
      type: dto.type as any,
      assetId: dto.assetId,
      portfolioId: dto.portfolioId,
      conditions: dto.conditions,
      actions: dto.actions || {},
      userId: '392ef270-0acd-4b8a-9486-4a0100e946a0',
    });
    return this.alertRepo.save(alert);
  }

  async findOne(id: string): Promise<Alert> {
    const alert = await this.alertRepo.findOneBy({ id });
    if (!alert) throw new NotFoundException('Alert not found');
    return alert;
  }

  async update(id: string, dto: Partial<{ name: string; isActive: boolean; conditions: Record<string, any> }>): Promise<Alert> {
    const alert = await this.findOne(id);
    Object.assign(alert, dto);
    return this.alertRepo.save(alert);
  }

  async remove(id: string): Promise<void> {
    const alert = await this.findOne(id);
    await this.alertRepo.remove(alert);
  }
}
