import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from './entities/portfolio.entity';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(Portfolio) private portfolioRepo: Repository<Portfolio>,
  ) {}

  async create(walletId: string, dto: { name: string; strategy?: string }): Promise<Portfolio> {
    const portfolio = this.portfolioRepo.create({ ...dto, walletId });
    return this.portfolioRepo.save(portfolio);
  }

  async findAll(walletId: string): Promise<Portfolio[]> {
    return this.portfolioRepo.find({
      where: { walletId },
      relations: ['holdings', 'holdings.asset'],
    });
  }

  async findOne(walletId: string, id: string): Promise<Portfolio> {
    const portfolio = await this.portfolioRepo.findOne({
      where: { id, walletId },
      relations: ['holdings', 'holdings.asset'],
    });
    if (!portfolio) throw new NotFoundException('Portfolio not found');
    return portfolio;
  }

  async update(walletId: string, id: string, dto: { name?: string; strategy?: string }): Promise<Portfolio> {
    const portfolio = await this.findOne(walletId, id);
    Object.assign(portfolio, dto);
    return this.portfolioRepo.save(portfolio);
  }

  async remove(walletId: string, id: string): Promise<void> {
    const portfolio = await this.findOne(walletId, id);
    await this.portfolioRepo.remove(portfolio);
  }
}
