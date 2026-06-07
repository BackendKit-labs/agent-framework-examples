import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './entities/wallet.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet) private walletRepo: Repository<Wallet>,
  ) {}

  async findAll(): Promise<Wallet[]> {
    return this.walletRepo.find({ relations: ['portfolios'] });
  }

  async create(dto: { name: string; description?: string }, userId?: string): Promise<Wallet> {
    const wallet = this.walletRepo.create({ ...dto, userId: userId || '392ef270-0acd-4b8a-9486-4a0100e946a0' });
    return this.walletRepo.save(wallet);
  }

  async findOne(id: string): Promise<Wallet> {
    const wallet = await this.walletRepo.findOne({
      where: { id },
      relations: ['portfolios', 'portfolios.holdings', 'portfolios.holdings.asset'],
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  async update(id: string, dto: { name?: string; description?: string }): Promise<Wallet> {
    const wallet = await this.findOne(id);
    Object.assign(wallet, dto);
    return this.walletRepo.save(wallet);
  }

  async remove(id: string): Promise<void> {
    const wallet = await this.findOne(id);
    await this.walletRepo.remove(wallet);
  }
}
