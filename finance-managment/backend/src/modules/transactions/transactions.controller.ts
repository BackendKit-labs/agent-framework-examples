import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transaction, TransactionType } from './transaction.entity';
import { Holding } from '../wallets/entities/holding.entity';

@Controller('transactions')
export class TransactionsController {
  constructor(
    @InjectRepository(Transaction) private txRepo: Repository<Transaction>,
    @InjectRepository(Holding) private holdingRepo: Repository<Holding>,
    private dataSource: DataSource,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() dto: {
    type: 'buy' | 'sell';
    assetId: string;
    quantity: number;
    price: number;
    walletId: string;
    portfolioId?: string;
    userId?: string;
    reason?: string;
  }, @Request() req: any) {
    dto.userId = req.user.sub;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const totalAmount = dto.quantity * dto.price;

      // Create transaction
      const tx = this.txRepo.create({
        type: dto.type as TransactionType,
        assetId: dto.assetId,
        quantity: dto.quantity,
        price: dto.price,
        totalAmount,
        commission: 0,
        reason: dto.reason || 'manual',
        walletId: dto.walletId,
        portfolioId: dto.portfolioId,
        userId: dto.userId,
      });
      const savedTx = await queryRunner.manager.save(tx);

      // Update holding
      if (dto.portfolioId) {
        let holding = await queryRunner.manager.findOne(Holding, {
          where: { portfolioId: dto.portfolioId, assetId: dto.assetId },
        });

        if (dto.type === 'buy') {
          if (holding) {
            const totalCost = Number(holding.averageBuyPrice) * Number(holding.quantity) + totalAmount;
            const totalQty = Number(holding.quantity) + dto.quantity;
            holding.averageBuyPrice = totalCost / totalQty;
            holding.quantity = totalQty;
          } else {
            holding = queryRunner.manager.create(Holding, {
              portfolioId: dto.portfolioId,
              assetId: dto.assetId,
              quantity: dto.quantity,
              averageBuyPrice: dto.price,
              currentValue: totalAmount,
              returnPercentage: 0,
            });
          }
          holding.currentValue = Number(holding.quantity) * dto.price;
          await queryRunner.manager.save(holding);
        }
      }

      await queryRunner.commitTransaction();
      return { status: 'executed', transaction: savedTx };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
