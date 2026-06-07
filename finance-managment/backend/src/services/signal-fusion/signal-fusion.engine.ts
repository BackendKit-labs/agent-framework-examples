import { Injectable } from '@nestjs/common';

export type FusedAction = 'STRONG_BUY' | 'CAUTIOUS_BUY' | 'HOLD' | 'CAUTIOUS_SELL' | 'STRONG_SELL' | 'CONFLICT_HOLD';

export interface NormalizedSignal {
  symbol: string;
  source: 'news' | 'smart_money_13f' | 'smart_money_form4' | 'smart_money_whale' | 'technical';
  direction: number;    // -1 (bearish) a +1 (bullish)
  magnitude: number;    // 0 a 1
  confidence: number;   // 0 a 1
  sourceWeight: number;
  metadata: Record<string, any>;
  expiresAt: Date;
  rationale: string;
}

export interface ConflictInfo {
  hasConflict: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  bullishSources: string[];
  bearishSources: string[];
  resolution: string;
}

export interface FusedSignal {
  symbol: string;
  action: FusedAction;
  score: number;
  confidence: number;
  contributions: Array<{ source: string; score: number; weight: number }>;
  conflict: ConflictInfo | null;
  rationale: string;
  timestamp: string;
}

@Injectable()
export class SignalFusionEngine {
  private readonly DEFAULT_WEIGHTS: Record<string, number> = {
    news: 0.30,
    smart_money_13f: 0.35,
    smart_money_form4: 0.15,
    smart_money_whale: 0.10,
    technical: 0.10,
  };

  /**
   * Fusión principal: combina todas las señales de un activo en una recomendación única
   */
  fuse(signals: NormalizedSignal[], userWeights?: Partial<Record<string, number>>): FusedSignal {
    const now = new Date();
    const active = signals.filter(s => s.expiresAt > now);
    const expired = signals.length - active.length;

    if (active.length === 0) {
      return {
        symbol: signals[0]?.symbol ?? 'unknown',
        action: 'HOLD',
        score: 0,
        confidence: 0,
        contributions: [],
        conflict: null,
        rationale: expired > 0 ? `All ${expired} signal(s) expired — no actionable data` : 'No signals available',
        timestamp: now.toISOString(),
      };
    }

    const weights = { ...this.DEFAULT_WEIGHTS, ...userWeights };
    // Replace with active-only signals for the rest of the computation
    signals = active;
    const symbol = signals[0].symbol;

    // 1. Calcular score ponderado
    let weightedScore = 0;
    let totalWeight = 0;
    const contributions: Array<{ source: string; score: number; weight: number }> = [];

    for (const signal of signals) {
      const weight = weights[signal.source] || 0.10;
      const adjustedWeight = weight * signal.confidence;

      weightedScore += signal.direction * signal.magnitude * adjustedWeight;
      totalWeight += adjustedWeight;

      contributions.push({
        source: signal.source,
        score: signal.direction * signal.magnitude,
        weight: adjustedWeight,
      });
    }

    const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

    // 2. Detectar conflictos entre fuentes
    const conflict = this.detectConflict(signals);

    // 3. Determinar acción según score final
    const action = this.scoreToAction(finalScore, conflict);

    // 4. Calcular confianza de la fusión
    const fusionConfidence = this.calculateFusionConfidence(signals, totalWeight, conflict);

    // 5. Generar rationale legible
    const rationale = this.buildRationale(symbol, finalScore, action, contributions, conflict);

    return {
      symbol,
      action,
      score: Math.round(finalScore * 1000) / 1000,
      confidence: Math.round(fusionConfidence * 1000) / 1000,
      contributions,
      conflict,
      rationale,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Detecta si hay conflicto entre fuentes (una dice bullish, otra bearish)
   */
  private detectConflict(signals: NormalizedSignal[]): ConflictInfo | null {
    const bullish = signals.filter(s => s.direction > 0.3);
    const bearish = signals.filter(s => s.direction < -0.3);

    if (bullish.length > 0 && bearish.length > 0) {
      const severity = Math.min(bullish.length, bearish.length) / signals.length;

      return {
        hasConflict: true,
        severity: severity > 0.4 ? 'HIGH' : severity > 0.2 ? 'MEDIUM' : 'LOW',
        bullishSources: bullish.map(s => s.source),
        bearishSources: bearish.map(s => s.source),
        resolution: this.suggestConflictResolution(bullish, bearish),
      };
    }

    return null;
  }

  /**
   * Sugiere cómo resolver el conflicto basado en pesos y confianzas
   */
  private suggestConflictResolution(bullish: NormalizedSignal[], bearish: NormalizedSignal[]): string {
    const bullishWeight = bullish.reduce((sum, s) => sum + s.sourceWeight * s.confidence, 0);
    const bearishWeight = bearish.reduce((sum, s) => sum + s.sourceWeight * s.confidence, 0);

    if (bullishWeight > bearishWeight * 1.5) {
      return 'Bullish signals have significantly higher weighted confidence — leaning bullish';
    }
    if (bearishWeight > bullishWeight * 1.5) {
      return 'Bearish signals have significantly higher weighted confidence — leaning bearish';
    }

    const hasStrongCoInvestment = [...bullish, ...bearish].some(s =>
      s.metadata?.coInvestmentStrength === 'VERY_STRONG' || s.metadata?.coInvestmentStrength === 'STRONG'
    );

    if (hasStrongCoInvestment) {
      return 'Strong co-investment cluster detected — prioritizing smart money signal';
    }

    return 'Conflicting signals with similar weight — recommend HOLD and monitor';
  }

  /**
   * Convierte score numérico a acción con nombre
   */
  private scoreToAction(score: number, conflict: ConflictInfo | null): FusedAction {
    if (conflict?.severity === 'HIGH' && Math.abs(score) < 0.4) {
      return 'CONFLICT_HOLD';
    }
    if (score > 0.6) return 'STRONG_BUY';
    if (score > 0.3) return 'CAUTIOUS_BUY';
    if (score < -0.6) return 'STRONG_SELL';
    if (score < -0.3) return 'CAUTIOUS_SELL';
    return 'HOLD';
  }

  /**
   * Calcula la confianza general de la fusión
   */
  private calculateFusionConfidence(
    signals: NormalizedSignal[],
    totalWeight: number,
    conflict: ConflictInfo | null,
  ): number {
    if (signals.length === 0) return 0;

    const sourceDiversity = Math.min(1, signals.length / 4);
    const avgConfidence = signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length;
    const conflictPenalty = conflict ? 0.2 : 0;

    return Math.max(0, Math.min(1, sourceDiversity * 0.4 + avgConfidence * 0.6 - conflictPenalty));
  }

  /**
   * Genera explicación legible para el usuario
   */
  private buildRationale(
    symbol: string,
    score: number,
    action: FusedAction,
    contributions: Array<{ source: string; score: number; weight: number }>,
    conflict: ConflictInfo | null,
  ): string {
    const parts: string[] = [];
    parts.push(`**${symbol}**: ${action}`);

    const sourceLabels: Record<string, string> = {
      news: '📰 News',
      smart_money_13f: '🏦 Institutional (13F)',
      smart_money_form4: '🔍 Insider Trades (Form 4)',
      smart_money_whale: '🐋 Whale Transactions',
      technical: '📊 Technical Analysis',
    };

    const sorted = [...contributions].sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));

    for (const c of sorted) {
      const label = sourceLabels[c.source] || c.source;
      const emoji = c.score > 0.3 ? '🟢' : c.score < -0.3 ? '🔴' : '⚪';
      parts.push(`  ${emoji} ${label}: ${(c.score * 100).toFixed(0)}% (weight: ${(c.weight * 100).toFixed(0)}%)`);
    }

    if (conflict) {
      parts.push(`  ⚠️ **Conflict detected**: ${conflict.bullishSources.length} bullish vs ${conflict.bearishSources.length} bearish`);
      parts.push(`  💡 Resolution: ${conflict.resolution}`);
    }

    parts.push(`  📊 **Fused score**: ${(score * 100).toFixed(1)}% → **${action}**`);

    return parts.join('\n');
  }
}
