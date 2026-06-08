import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from '../../modules/wallets/entities/portfolio.entity';

export interface RebalancingMove {
  assetType: string;
  currentPct: number;
  targetPct: number;
  deltaPct: number;
  currentValue: number;
  targetValue: number;
  deltaValue: number;
  action: 'BUY' | 'SELL' | 'HOLD';
}

export interface RebalancingAnalysis {
  portfolioId: string;
  portfolioName: string;
  totalValue: number;
  tolerance: number;
  needsRebalance: boolean;
  maxDeviation: number;
  currentAllocations: Record<string, number>;
  targetAllocations: Record<string, number>;
  moves: RebalancingMove[];
}

@Injectable()
export class RebalancingService {
  constructor(
    @InjectRepository(Portfolio)
    private portfolioRepo: Repository<Portfolio>,
  ) {}

  async analyzePortfolio(walletId: string, portfolioId: string): Promise<RebalancingAnalysis> {
    const portfolio = await this.portfolioRepo.findOne({
      where: { id: portfolioId, walletId },
      relations: ['holdings', 'holdings.asset'],
    });

    if (!portfolio) throw new NotFoundException('Portfolio not found');
    if (!portfolio.targetAllocations || Object.keys(portfolio.targetAllocations).length === 0) {
      throw new BadRequestException(
        'Este portfolio no tiene asignación objetivo. Completa el cuestionario de perfil de riesgo y aplícalo al portfolio.',
      );
    }

    // Current allocation by asset type
    const valueByType: Record<string, number> = {};
    let totalValue = 0;

    for (const h of portfolio.holdings ?? []) {
      const type = h.asset?.type ?? 'stock';
      const value = Number(h.currentValue) || 0;
      valueByType[type] = (valueByType[type] ?? 0) + value;
      totalValue += value;
    }

    const currentAllocations: Record<string, number> = {};
    for (const [type, value] of Object.entries(valueByType)) {
      currentAllocations[type] = totalValue > 0 ? (value / totalValue) * 100 : 0;
    }

    // Ensure all target types appear in current (even if 0%)
    for (const type of Object.keys(portfolio.targetAllocations)) {
      if (!(type in currentAllocations)) currentAllocations[type] = 0;
    }

    // Tolerance stored as fraction (0.05 = 5pp)
    const tolerancePp = Number(portfolio.rebalanceTolerance) * 100;
    const target = portfolio.targetAllocations;

    // Build moves
    const allTypes = new Set([...Object.keys(currentAllocations), ...Object.keys(target)]);
    let maxDeviation = 0;
    const moves: RebalancingMove[] = [];

    for (const type of allTypes) {
      const currentPct = currentAllocations[type] ?? 0;
      const targetPct = target[type] ?? 0;
      const deltaPct = targetPct - currentPct;
      const absDelta = Math.abs(deltaPct);

      maxDeviation = Math.max(maxDeviation, absDelta);

      const currentValue = (currentPct / 100) * totalValue;
      const targetValue = (targetPct / 100) * totalValue;
      const deltaValue = targetValue - currentValue;

      moves.push({
        assetType: type,
        currentPct: Math.round(currentPct * 100) / 100,
        targetPct: Math.round(targetPct * 100) / 100,
        deltaPct: Math.round(deltaPct * 100) / 100,
        currentValue: Math.round(currentValue * 100) / 100,
        targetValue: Math.round(targetValue * 100) / 100,
        deltaValue: Math.round(deltaValue * 100) / 100,
        action: Math.abs(deltaPct) < 0.01 ? 'HOLD' : deltaPct > 0 ? 'BUY' : 'SELL',
      });
    }

    moves.sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct));

    return {
      portfolioId: portfolio.id,
      portfolioName: portfolio.name,
      totalValue,
      tolerance: tolerancePp,
      needsRebalance: maxDeviation >= tolerancePp,
      maxDeviation: Math.round(maxDeviation * 100) / 100,
      currentAllocations,
      targetAllocations: target,
      moves,
    };
  }

  async setTargetAllocation(
    walletId: string,
    portfolioId: string,
    targetAllocations: Record<string, number>,
    tolerance?: number,
  ): Promise<Portfolio> {
    const total = Object.values(targetAllocations).reduce((s, v) => s + v, 0);
    if (Math.abs(total - 100) > 0.01) throw new BadRequestException('Target allocations must sum to 100%');

    const portfolio = await this.portfolioRepo.findOne({ where: { id: portfolioId, walletId } });
    if (!portfolio) throw new NotFoundException('Portfolio not found');

    portfolio.targetAllocations = targetAllocations;
    if (tolerance !== undefined) portfolio.rebalanceTolerance = tolerance / 100;
    return this.portfolioRepo.save(portfolio);
  }
}
