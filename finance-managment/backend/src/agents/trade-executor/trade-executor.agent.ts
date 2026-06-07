import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transaction, TransactionType } from '../../modules/transactions/transaction.entity';
import { Holding } from '../../modules/wallets/entities/holding.entity';
import { Asset } from '../../modules/assets/asset.entity';
import * as crypto from 'crypto';

export interface OrderResult {
  status: 'executed' | 'duplicate' | 'failed';
  transactionId?: string;
  symbol: string;
  side: 'buy' | 'sell';
  executedQuantity: number;
  executedPrice: number;
  reason?: string;
}

export interface BatchOrderResult {
  results: OrderResult[];
  totalExecuted: number;
  totalFailed: number;
  totalDuplicates: number;
}

@Injectable()
export class TradeExecutorAgent {
  public readonly name = 'trade-executor';
  public readonly description = 'Ejecuta órdenes de compra/venta con idempotencia';
  private readonly logger = new Logger(TradeExecutorAgent.name);

  constructor(
    @InjectRepository(Transaction) private txRepo: Repository<Transaction>,
    @InjectRepository(Holding) private holdingRepo: Repository<Holding>,
    @InjectRepository(Asset) private assetRepo: Repository<Asset>,
    private dataSource: DataSource,
  ) {
    this.logger.log('TradeExecutorAgent initialized');
  }

  async executeOrder(params: {
    type: 'buy' | 'sell';
    assetId: string;
    quantity: number;
    price: number;
    walletId: string;
    portfolioId?: string;
    userId: string;
    commission?: number;
    reason?: string;
    idempotencyKey?: string;
  }): Promise<OrderResult> {
    const idempotencyKey = params.idempotencyKey || crypto.randomUUID();

    // Check for duplicate
    if (params.idempotencyKey) {
      const existing = await this.txRepo.findOneBy({ idempotencyKey: params.idempotencyKey });
      if (existing) {
        this.logger.warn(`Duplicate transaction detected: ${params.idempotencyKey}`);
        return {
          status: 'duplicate',
          transactionId: existing.id,
          symbol: existing.assetId,
          side: existing.type as 'buy' | 'sell',
          executedQuantity: Number(existing.quantity),
          executedPrice: Number(existing.price),
          reason: 'Duplicate — already executed',
        };
      }
    }

    // Execute within a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const asset = await this.assetRepo.findOneBy({ id: params.assetId });
      if (!asset) throw new Error(`Asset ${params.assetId} not found`);

      const totalAmount = params.quantity * params.price;
      const commission = params.commission || 0;

      // Create transaction record
      const tx = this.txRepo.create({
        type: params.type as TransactionType,
        assetId: params.assetId,
        quantity: params.quantity,
        price: params.price,
        totalAmount,
        commission,
        reason: params.reason || 'manual',
        idempotencyKey,
        walletId: params.walletId,
        portfolioId: params.portfolioId,
        userId: params.userId,
      });
      const savedTx = await queryRunner.manager.save(tx);

      // Update holding
      if (params.portfolioId) {
        let holding = await queryRunner.manager.findOne(Holding, {
          where: { portfolioId: params.portfolioId, assetId: params.assetId },
        });

        if (params.type === 'buy') {
          if (holding) {
            // Average cost basis
            const totalCost = Number(holding.averageBuyPrice) * Number(holding.quantity) + totalAmount;
            const totalQty = Number(holding.quantity) + params.quantity;
            holding.averageBuyPrice = totalCost / totalQty;
            holding.quantity = totalQty;
          } else {
            holding = queryRunner.manager.create(Holding, {
              portfolioId: params.portfolioId,
              assetId: params.assetId,
              quantity: params.quantity,
              averageBuyPrice: params.price,
              currentValue: totalAmount,
              returnPercentage: 0,
            });
          }
          holding.currentValue = Number(holding.quantity) * params.price;
          await queryRunner.manager.save(holding);
        } else if (params.type === 'sell' && holding) {
          const remaining = Number(holding.quantity) - params.quantity;
          if (remaining < 0) throw new Error('Insufficient holdings');
          holding.quantity = remaining;
          holding.currentValue = remaining * params.price;
          if (remaining === 0) {
            await queryRunner.manager.remove(holding);
          } else {
            await queryRunner.manager.save(holding);
          }
        }
      }

      await queryRunner.commitTransaction();

      this.logger.log(`Order executed: ${params.type} ${params.quantity} of ${params.assetId} @ ${params.price}`);

      return {
        status: 'executed',
        transactionId: savedTx.id,
        symbol: params.assetId,
        side: params.type,
        executedQuantity: params.quantity,
        executedPrice: params.price,
        reason: params.reason,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Order failed: ${(error as Error).message}`);
      return {
        status: 'failed',
        symbol: params.assetId,
        side: params.type,
        executedQuantity: 0,
        executedPrice: 0,
        reason: (error as Error).message,
      };
    } finally {
      await queryRunner.release();
    }
  }

  async executeBatchOrders(orders: Array<{
    type: 'buy' | 'sell';
    assetId: string;
    quantity: number;
    price: number;
    walletId: string;
    portfolioId?: string;
    userId: string;
    reason?: string;
  }>): Promise<BatchOrderResult> {
    const results: OrderResult[] = [];
    let totalExecuted = 0;
    let totalFailed = 0;
    let totalDuplicates = 0;

    for (const order of orders) {
      const result = await this.executeOrder(order);
      results.push(result);

      if (result.status === 'executed') totalExecuted++;
      else if (result.status === 'failed') totalFailed++;
      else if (result.status === 'duplicate') totalDuplicates++;
    }

    return { results, totalExecuted, totalFailed, totalDuplicates };
  }
}
