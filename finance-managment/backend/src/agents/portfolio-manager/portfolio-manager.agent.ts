import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from '../../modules/wallets/entities/portfolio.entity';
import { Holding } from '../../modules/wallets/entities/holding.entity';
import { SignalFusionEngine, FusedSignal, FusedAction } from '../../services/signal-fusion/signal-fusion.engine';
import { RiskManagerService, RiskCheckResult } from '../../services/risk-manager/risk-manager.service';

export interface PortfolioPosition {
  symbol: string;
  value: number;
  allocation: number;
  returnPercentage: number;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
}

export interface PortfolioSummary {
  portfolioId: string;
  name: string;
  totalValue: number;
  positions: PortfolioPosition[];
  riskCheck: RiskCheckResult;
  timestamp: string;
}

export interface ContextualRecommendation {
  symbol: string;
  fusedAction: FusedAction;
  finalAction: FusedAction;
  score: number;
  confidence: number;
  overrides: string[];
  position: PortfolioPosition | null;
  rationale: string;
  timestamp: string;
}

@Injectable()
export class PortfolioManagerAgent {
  public readonly name = 'portfolio-manager';
  public readonly description = 'Analiza portafolios, genera recomendaciones y fusiona señales de múltiples fuentes';
  private readonly logger = new Logger(PortfolioManagerAgent.name);

  constructor(
    @InjectRepository(Portfolio) private portfolioRepo: Repository<Portfolio>,
    @InjectRepository(Holding) private holdingRepo: Repository<Holding>,
    private signalFusion: SignalFusionEngine,
    private riskManager: RiskManagerService,
  ) {
    this.logger.log('PortfolioManagerAgent initialized');
  }

  async getPortfolioSummary(portfolioId: string): Promise<PortfolioSummary> {
    const portfolio = await this.portfolioRepo.findOne({
      where: { id: portfolioId },
      relations: ['holdings', 'holdings.asset'],
    });

    if (!portfolio) throw new NotFoundException(`Portfolio ${portfolioId} not found`);

    const holdings = portfolio.holdings ?? [];
    const totalValue = holdings.reduce((sum, h) => sum + Number(h.currentValue), 0);

    const positions: PortfolioPosition[] = holdings.map(h => {
      const qty = Number(h.quantity);
      const value = Number(h.currentValue);
      return {
        symbol: h.asset?.symbol ?? 'UNKNOWN',
        value,
        allocation: totalValue > 0 ? value / totalValue : 0,
        returnPercentage: Number(h.returnPercentage),
        quantity: qty,
        averageBuyPrice: Number(h.averageBuyPrice),
        currentPrice: qty > 0 ? value / qty : Number(h.averageBuyPrice),
      };
    });

    const riskCheck = this.riskManager.evaluatePortfolioRisk(
      positions.map(p => ({
        symbol: p.symbol,
        value: p.value,
        allocation: p.allocation,
        returnPercentage: p.returnPercentage,
        quantity: p.quantity,
        averageBuyPrice: p.averageBuyPrice,
        currentPrice: p.currentPrice,
      })),
      totalValue,
    );

    return {
      portfolioId,
      name: portfolio.name,
      totalValue,
      positions,
      riskCheck,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Aplica contexto de posición y reglas de riesgo sobre un FusedSignal puro.
   * Convierte un HOLD estadístico en una acción accionable cuando el riesgo lo exige.
   */
  getContextualRecommendation(
    fused: FusedSignal,
    position: PortfolioPosition | null,
    userId?: string,
  ): ContextualRecommendation {
    const rules = this.riskManager.getRules(userId);
    let finalAction: FusedAction = fused.action;
    const overrides: string[] = [];

    if (position) {
      const ret = position.returnPercentage;

      // Stop-loss: HOLD/CONFLICT_HOLD con pérdida mayor al límite → forzar salida
      if ((finalAction === 'HOLD' || finalAction === 'CONFLICT_HOLD') && ret < rules.defaultStopLoss) {
        finalAction = 'CAUTIOUS_SELL';
        overrides.push(
          `Stop-loss triggered: position at ${(ret * 100).toFixed(1)}% (limit ${(rules.defaultStopLoss * 100).toFixed(0)}%)`,
        );
      }

      // Take-profit alcanzado: agregar nota sin cambiar la acción (el usuario decide cuánto recortar)
      if (finalAction === 'HOLD' && ret > rules.defaultTakeProfit) {
        overrides.push(
          `Take-profit zone: position at +${(ret * 100).toFixed(1)}% (target ${(rules.defaultTakeProfit * 100).toFixed(0)}%) — consider trimming`,
        );
      }

      // Trailing stop: posición en profit pero ya retrocedió más del trailing%
      // Requiere precio máximo histórico; aquí usamos avg como proxy conservador
      if (
        finalAction === 'HOLD' &&
        ret > 0 &&
        position.currentPrice < position.averageBuyPrice * (1 + ret - rules.trailingStop)
      ) {
        overrides.push(
          `Trailing stop proximity: price pulled back >${(rules.trailingStop * 100).toFixed(0)}% from peak`,
        );
      }
    }

    // Violaciones críticas de riesgo anulan cualquier señal de mantener
    const portfolioRisk = position
      ? this.riskManager.evaluatePortfolioRisk(
          [
            {
              symbol: position.symbol,
              value: position.value,
              allocation: position.allocation,
              returnPercentage: position.returnPercentage,
              quantity: position.quantity,
              averageBuyPrice: position.averageBuyPrice,
              currentPrice: position.currentPrice,
            },
          ],
          position.value,
          userId,
        )
      : null;

    const criticalViolations = portfolioRisk?.violations.filter(v => v.severity === 'CRITICAL') ?? [];
    if (criticalViolations.length > 0 && (finalAction === 'HOLD' || finalAction === 'CONFLICT_HOLD')) {
      finalAction = 'CAUTIOUS_SELL';
      for (const v of criticalViolations) {
        overrides.push(`Risk override [${v.rule}]: ${v.message}`);
      }
    }

    return {
      symbol: fused.symbol,
      fusedAction: fused.action,
      finalAction,
      score: fused.score,
      confidence: fused.confidence,
      overrides,
      position,
      rationale: fused.rationale,
      timestamp: fused.timestamp,
    };
  }
}
