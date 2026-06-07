import { Injectable, Logger } from '@nestjs/common';

export interface NewsSentimentResult {
  ticker: string;
  overallScore: number;
  confidence: number;
  sources: Array<{
    title: string;
    sourceName: string;
    sourceType: 'traditional' | 'social' | 'blog' | 'official';
    url: string;
    publishedAt: string;
    sentimentScore: number;
    reliabilityScore: number;
  }>;
  summary: string;
  timestamp: string;
}

export interface NewsEvaluation {
  symbol: string;
  evaluatedScore: number;
  confidence: number;
  isActionable: boolean;
  sourceDiversity: boolean;
  trend: 'improving' | 'declining' | 'stable' | 'volatile';
  summary: string;
  reliabilityBreakdown: {
    traditionalMedia: number;
    socialMedia: number;
    officialSources: number;
  };
  timestamp: string;
}

export interface TechnicalAnalysis {
  symbol: string;
  rsi: number;
  macd: { macd: number; signal: number };
  sma50: number;
  sma200: number;
}

const POSITIVE_WORDS = ['record', 'surpass', 'growth', 'beat', 'raise', 'positive', 'upgrade', 'bullish', 'profit', 'gain', 'rally', 'high', 'strong'];
const NEGATIVE_WORDS = ['miss', 'fall', 'decline', 'drop', 'investigation', 'lawsuit', 'downgrade', 'bearish', 'loss', 'cut', 'weak', 'low', 'warning'];

@Injectable()
export class MarketAnalyzerAgent {
  public readonly name = 'market-analyzer';
  public readonly description = 'Análisis técnico, fundamental y de sentimiento vía Yahoo Finance';
  private readonly logger = new Logger(MarketAnalyzerAgent.name);

  private readonly SOURCE_RELIABILITY: Record<string, number> = {
    traditional: 0.9,
    official: 0.85,
    blog: 0.5,
    social: 0.3,
  };

  constructor() {
    this.logger.log('MarketAnalyzerAgent initialized');
  }

  async onModuleInit() {
    this.logger.log('MarketAnalyzerAgent ready');
  }

  async getMarketSentiment(symbols: string[]): Promise<Record<string, NewsSentimentResult>> {
    const results: Record<string, NewsSentimentResult> = {};
    await Promise.all(symbols.map(async (symbol) => {
      results[symbol] = await this.fetchNewsSentiment(symbol);
    }));
    return results;
  }

  async evaluateNewsReliability(symbol: string, minConfidence = 0.6): Promise<NewsEvaluation> {
    const raw = await this.getMarketSentiment([symbol]);
    const result = raw[symbol];

    const sourceTypes = new Set(result.sources.map(s => s.sourceType));
    const hasDiverseSources = sourceTypes.size >= 2;

    const weightedScore = this.calculateWeightedScore(result.sources);
    const trend = this.detectSentimentShift(weightedScore);
    const confidence = this.calculateConfidence(result, hasDiverseSources);

    return {
      symbol,
      evaluatedScore: weightedScore,
      confidence,
      isActionable: confidence >= minConfidence && Math.abs(weightedScore) >= 0.3,
      sourceDiversity: hasDiverseSources,
      trend,
      summary: result.summary,
      reliabilityBreakdown: {
        traditionalMedia: this.averageByType(result.sources, 'traditional'),
        socialMedia: this.averageByType(result.sources, 'social'),
        officialSources: this.averageByType(result.sources, 'official'),
      },
      timestamp: new Date().toISOString(),
    };
  }

  normalizeTechnical(ta: TechnicalAnalysis, expiresInHours = 24): import('../../services/signal-fusion/signal-fusion.engine').NormalizedSignal {
    const rsi = this.scoreRsi(ta.rsi);
    const macd = this.scoreMacd(ta.macd.macd, ta.macd.signal);
    const sma = this.scoreSma(ta.sma50, ta.sma200);

    // Weighted composite: RSI 40%, MACD 40%, SMA trend 20%
    const direction = Math.max(-1, Math.min(1, rsi.direction * 0.4 + macd.direction * 0.4 + sma.direction * 0.2));
    const magnitude = Math.max(0, Math.min(1, rsi.magnitude * 0.4 + macd.magnitude * 0.4 + sma.magnitude * 0.2));

    return {
      symbol: ta.symbol,
      source: 'technical',
      direction,
      magnitude,
      confidence: 0.6,
      sourceWeight: 0.10,
      metadata: { rsi: ta.rsi, macd: ta.macd, sma50: ta.sma50, sma200: ta.sma200 },
      expiresAt: new Date(Date.now() + expiresInHours * 3_600_000),
      rationale: `RSI=${ta.rsi} (${ta.rsi < 30 ? 'oversold' : ta.rsi > 70 ? 'overbought' : 'neutral'}), MACD ${ta.macd.macd > ta.macd.signal ? 'above' : 'below'} signal, SMA50 ${ta.sma50 > ta.sma200 ? '>' : '<'} SMA200`,
    };
  }

  async technicalAnalysis(symbol: string, _interval = '1d'): Promise<TechnicalAnalysis> {
    const closes = await this.fetchClosingPrices(symbol, 200);

    if (closes.length < 26) {
      this.logger.warn(`Not enough data for ${symbol} (${closes.length} days), using fallback`);
      return { symbol, rsi: 50, macd: { macd: 0, signal: 0 }, sma50: closes[closes.length - 1] ?? 0, sma200: closes[closes.length - 1] ?? 0 };
    }

    return {
      symbol,
      rsi: this.calcRSI(closes, 14),
      macd: this.calcMACD(closes),
      sma50: this.calcSMA(closes, 50),
      sma200: this.calcSMA(closes, 200),
    };
  }

  // --- private helpers ---

  private async fetchNewsSentiment(ticker: string): Promise<NewsSentimentResult> {
    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v1/finance/search?q=${ticker}&newsCount=10`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } },
      );
      const data: any = await res.json();
      const news: any[] = data?.news ?? [];

      if (news.length === 0) {
        return this.emptyResult(ticker);
      }

      const sources = news.slice(0, 10).map((a: any) => {
        const title = (a.title ?? '').toLowerCase();
        let score = 0;
        for (const w of POSITIVE_WORDS) if (title.includes(w)) score += 0.15;
        for (const w of NEGATIVE_WORDS) if (title.includes(w)) score -= 0.2;
        score = Math.max(-1, Math.min(1, score));

        return {
          title: a.title ?? '',
          sourceName: a.publisher ?? 'Unknown',
          sourceType: 'traditional' as const,
          url: a.link ?? '',
          publishedAt: a.providerPublishTime
            ? new Date(a.providerPublishTime * 1000).toISOString()
            : new Date().toISOString(),
          sentimentScore: score,
          reliabilityScore: this.SOURCE_RELIABILITY.traditional,
        };
      });

      const overallScore = sources.reduce((s, a) => s + a.sentimentScore, 0) / sources.length;
      const sentiment = overallScore > 0.1 ? 'positive' : overallScore < -0.1 ? 'negative' : 'neutral';

      return {
        ticker,
        overallScore,
        confidence: Math.min(1, 0.3 + Math.abs(overallScore) * 0.5 + Math.min(sources.length / 10, 1) * 0.2),
        sources,
        summary: `${ticker} shows ${sentiment} sentiment across ${sources.length} recent articles`,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      this.logger.warn(`News fetch failed for ${ticker}: ${(err as Error).message}`);
      return this.emptyResult(ticker);
    }
  }

  private async fetchClosingPrices(symbol: string, days: number): Promise<number[]> {
    try {
      const range = days <= 60 ? '3mo' : days <= 120 ? '6mo' : '1y';
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=${range}`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } },
      );
      const data: any = await res.json();
      const closes: number[] = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
      return closes.filter((c: any) => c != null).slice(-days);
    } catch (err) {
      this.logger.warn(`Price fetch failed for ${symbol}: ${(err as Error).message}`);
      return [];
    }
  }

  private calcRSI(closes: number[], period = 14): number {
    if (closes.length < period + 1) return 50;
    let gains = 0;
    let losses = 0;
    for (let i = closes.length - period; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff > 0) gains += diff;
      else losses -= diff;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return Math.round(100 - 100 / (1 + rs));
  }

  private calcSMA(closes: number[], period: number): number {
    const slice = closes.slice(-period);
    if (slice.length === 0) return 0;
    return Math.round((slice.reduce((a, b) => a + b, 0) / slice.length) * 100) / 100;
  }

  private calcEMA(closes: number[], period: number): number[] {
    const k = 2 / (period + 1);
    const emas: number[] = [closes[0]];
    for (let i = 1; i < closes.length; i++) {
      emas.push(closes[i] * k + emas[i - 1] * (1 - k));
    }
    return emas;
  }

  private calcMACD(closes: number[]): { macd: number; signal: number } {
    if (closes.length < 35) return { macd: 0, signal: 0 };
    const ema12 = this.calcEMA(closes, 12);
    const ema26 = this.calcEMA(closes, 26);
    const macdLine = ema12.map((v, i) => v - ema26[i]);
    const signalLine = this.calcEMA(macdLine.slice(-9), 9);
    const last = (v: number) => Math.round(v * 10000) / 10000;
    return {
      macd: last(macdLine[macdLine.length - 1]),
      signal: last(signalLine[signalLine.length - 1]),
    };
  }

  private detectSentimentShift(score: number): NewsEvaluation['trend'] {
    if (Math.abs(score) > 0.5) return 'volatile';
    if (score > 0.2) return 'improving';
    if (score < -0.2) return 'declining';
    return 'stable';
  }

  private calculateWeightedScore(sources: NewsSentimentResult['sources']): number {
    if (sources.length === 0) return 0;
    let totalWeight = 0;
    let weightedSum = 0;
    for (const source of sources) {
      const ageHours = (Date.now() - new Date(source.publishedAt).getTime()) / 3_600_000;
      const recencyWeight = Math.max(0, 1 - ageHours / 24);
      const reliability = this.SOURCE_RELIABILITY[source.sourceType] ?? 0.5;
      const w = reliability * recencyWeight;
      totalWeight += w;
      weightedSum += source.sentimentScore * w;
    }
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private calculateConfidence(result: NewsSentimentResult, hasDiverseSources: boolean): number {
    const sourceCount = Math.min(1, result.sources.length / 5);
    const diversityBonus = hasDiverseSources ? 0.2 : 0;
    return Math.min(1, sourceCount * 0.6 + result.confidence * 0.3 + diversityBonus);
  }

  private averageByType(sources: NewsSentimentResult['sources'], type: string): number {
    const filtered = sources.filter(s => s.sourceType === type);
    if (filtered.length === 0) return 0;
    return filtered.reduce((sum, s) => sum + s.sentimentScore, 0) / filtered.length;
  }

  private scoreRsi(rsi: number): { direction: number; magnitude: number } {
    if (rsi < 30) return { direction: 0.7, magnitude: 0.8 };
    if (rsi < 45) return { direction: 0.3, magnitude: 0.5 };
    if (rsi < 55) return { direction: 0, magnitude: 0.1 };
    if (rsi < 70) return { direction: -0.2, magnitude: 0.4 };
    return { direction: -0.7, magnitude: 0.8 };
  }

  private scoreMacd(macd: number, signal: number): { direction: number; magnitude: number } {
    const diff = macd - signal;
    return {
      direction: diff > 0 ? 1 : diff < 0 ? -1 : 0,
      magnitude: Math.min(1, Math.abs(diff) * 20),
    };
  }

  private scoreSma(sma50: number, sma200: number): { direction: number; magnitude: number } {
    if (sma50 === 0 || sma200 === 0) return { direction: 0, magnitude: 0 };
    const ratio = (sma50 - sma200) / sma200;
    return {
      direction: ratio > 0 ? 1 : -1,
      magnitude: Math.min(1, Math.abs(ratio) * 5),
    };
  }

  private emptyResult(ticker: string): NewsSentimentResult {
    return {
      ticker,
      overallScore: 0,
      confidence: 0,
      sources: [],
      summary: `No news found for ${ticker}`,
      timestamp: new Date().toISOString(),
    };
  }
}
