import { Injectable } from '@nestjs/common';

export interface TaxLot {
  id: string;
  symbol: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: Date;
  currentPrice: number;
  unrealizedGainLoss: number;
  holdingPeriod: number; // days
}

export interface RealizedGain {
  symbol: string;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
  gainLoss: number;
  holdingPeriod: number;
  isShortTerm: boolean; // < 1 year
  saleDate: Date;
}

export interface HarvestOpportunity {
  symbol: string;
  unrealizedLoss: number;
  holdingPeriod: number;
  washSaleRisk: boolean;
  taxBenefit: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  lots: TaxLot[];
  offsetGains: RealizedGain[];
}

@Injectable()
export class TaxHarvestService {
  private taxLots: Map<string, TaxLot[]> = new Map();
  private realizedGains: RealizedGain[] = [];

  /**
   * Registra una compra (crea un tax lot)
   */
  recordPurchase(symbol: string, quantity: number, price: number, date: Date = new Date()): TaxLot {
    const lot: TaxLot = {
      id: `${symbol}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      symbol,
      quantity,
      purchasePrice: price,
      purchaseDate: date,
      currentPrice: price,
      unrealizedGainLoss: 0,
      holdingPeriod: 0,
    };

    const existing = this.taxLots.get(symbol) || [];
    existing.push(lot);
    this.taxLots.set(symbol, existing);

    return lot;
  }

  /**
   * Registra una venta (realiza ganancia/pérdida usando FIFO)
   */
  recordSale(symbol: string, quantity: number, salePrice: number, saleDate: Date = new Date()): RealizedGain[] {
    const lots = this.taxLots.get(symbol) || [];
    let remaining = quantity;
    const gains: RealizedGain[] = [];

    // FIFO: vender los lots más antiguos primero
    for (const lot of lots) {
      if (remaining <= 0) break;
      if (lot.quantity <= 0) continue;

      const soldQty = Math.min(lot.quantity, remaining);
      const gainLoss = (salePrice - lot.purchasePrice) * soldQty;
      const holdingPeriod = Math.floor((saleDate.getTime() - lot.purchaseDate.getTime()) / 86400000);

      const gain: RealizedGain = {
        symbol,
        quantity: soldQty,
        purchasePrice: lot.purchasePrice,
        salePrice,
        gainLoss,
        holdingPeriod,
        isShortTerm: holdingPeriod < 365,
        saleDate,
      };

      gains.push(gain);
      this.realizedGains.push(gain);

      lot.quantity -= soldQty;
      remaining -= soldQty;
    }

    // Clean up empty lots
    this.taxLots.set(symbol, lots.filter(l => l.quantity > 0));

    return gains;
  }

  /**
   * Actualiza precios actuales de los tax lots
   */
  updatePrices(prices: Record<string, number>): void {
    for (const [symbol, price] of Object.entries(prices)) {
      const lots = this.taxLots.get(symbol) || [];
      for (const lot of lots) {
        lot.currentPrice = price;
        lot.unrealizedGainLoss = (price - lot.purchasePrice) * lot.quantity;
        lot.holdingPeriod = Math.floor((Date.now() - lot.purchaseDate.getTime()) / 86400000);
      }
    }
  }

  /**
   * Detecta oportunidades de tax loss harvesting
   */
  findHarvestOpportunities(minLoss = 500): HarvestOpportunity[] {
    const opportunities: HarvestOpportunity[] = [];
    const now = Date.now();
    const thirtyDaysMs = 30 * 86400000;

    for (const [symbol, lots] of this.taxLots.entries()) {
      const totalUnrealizedLoss = lots.reduce((sum, lot) => {
        const loss = (lot.currentPrice - lot.purchasePrice) * lot.quantity;
        return sum + (loss < 0 ? loss : 0);
      }, 0);

      if (totalUnrealizedLoss >= -minLoss) continue;

      // Wash-sale rule: compute holding period live from purchaseDate (not from stale lot.holdingPeriod
      // which is only updated inside updatePrices()). Risk if any lot was purchased within last 30 days.
      const recentBuys = lots.filter(l => now - l.purchaseDate.getTime() < thirtyDaysMs);
      const washSaleRisk = recentBuys.length > 0;

      // Find offset gains
      const offsetGains = this.realizedGains.filter(g => g.gainLoss > 0);

      const totalGains = offsetGains.reduce((sum, g) => sum + g.gainLoss, 0);
      const taxBenefit = Math.min(Math.abs(totalUnrealizedLoss), totalGains) * 0.20; // 20% tax rate assumption

      // Holding period also computed live to avoid stale data from updatePrices()
      const avgHoldingPeriod = lots.reduce((sum, l) => sum + Math.floor((now - l.purchaseDate.getTime()) / 86400000), 0) / lots.length;

      opportunities.push({
        symbol,
        unrealizedLoss: Math.round(totalUnrealizedLoss * 100) / 100,
        holdingPeriod: Math.round(avgHoldingPeriod),
        washSaleRisk,
        taxBenefit: Math.round(taxBenefit * 100) / 100,
        priority: Math.abs(totalUnrealizedLoss) > 10000 ? 'HIGH' : Math.abs(totalUnrealizedLoss) > 2000 ? 'MEDIUM' : 'LOW',
        lots,
        offsetGains,
      });
    }

    return opportunities.sort((a, b) => Math.abs(b.unrealizedLoss) - Math.abs(a.unrealizedLoss));
  }

  /**
   * Obtiene el resumen de ganancias/pérdidas realizadas en el año
   */
  getYearSummary(year: number = new Date().getFullYear()): {
    shortTermGains: number;
    longTermGains: number;
    shortTermLosses: number;
    longTermLosses: number;
    netGainLoss: number;
    totalTrades: number;
  } {
    const yearGains = this.realizedGains.filter(g => g.saleDate.getFullYear() === year);

    return {
      shortTermGains: Math.round(yearGains.filter(g => g.isShortTerm && g.gainLoss > 0).reduce((s, g) => s + g.gainLoss, 0) * 100) / 100,
      longTermGains: Math.round(yearGains.filter(g => !g.isShortTerm && g.gainLoss > 0).reduce((s, g) => s + g.gainLoss, 0) * 100) / 100,
      shortTermLosses: Math.round(yearGains.filter(g => g.isShortTerm && g.gainLoss < 0).reduce((s, g) => s + g.gainLoss, 0) * 100) / 100,
      longTermLosses: Math.round(yearGains.filter(g => !g.isShortTerm && g.gainLoss < 0).reduce((s, g) => s + g.gainLoss, 0) * 100) / 100,
      netGainLoss: Math.round(yearGains.reduce((s, g) => s + g.gainLoss, 0) * 100) / 100,
      totalTrades: yearGains.length,
    };
  }
}
