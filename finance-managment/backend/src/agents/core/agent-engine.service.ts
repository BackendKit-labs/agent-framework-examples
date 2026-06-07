import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AgentEngine, AgentRegistry, ToolRegistry, ProviderRegistry, CallbackTransport, defineTool, z } from '@backendkit-labs/agent-core';
import type { AgentEvent } from '@backendkit-labs/agent-core';
import { spawn } from 'child_process';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeepSeekProvider } from './deepseek-provider';
import { ORCHESTRATOR_PROFILE } from '../profiles/orchestrator.profile';
import { MARKET_ANALYZER_PROFILE } from '../profiles/market-analyzer.profile';
import { SMART_MONEY_PROFILE } from '../profiles/smart-money.profile';
import { PORTFOLIO_MANAGER_PROFILE } from '../profiles/portfolio-manager.profile';
import { Wallet } from '../../modules/wallets/entities/wallet.entity';
import { Portfolio } from '../../modules/wallets/entities/portfolio.entity';
import { Holding } from '../../modules/wallets/entities/holding.entity';
import { Asset } from '../../modules/assets/asset.entity';
import { SmartMoneySignal } from '../../modules/smart-money/entities/smart-money-signal.entity';
import { TrackedInvestor } from '../../modules/smart-money/entities/tracked-investor.entity';

@Injectable()
export class AgentEngineService implements OnModuleInit {
  private readonly logger = new Logger(AgentEngineService.name);
  private readonly MODEL = 'deepseek-v4-flash';

  // Shared registries — immutable after init, reused across requests
  private tools: ToolRegistry | null = null;
  private agents: AgentRegistry | null = null;
  private providers: ProviderRegistry | null = null;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Wallet) private walletRepo: Repository<Wallet>,
    @InjectRepository(Portfolio) private portfolioRepo: Repository<Portfolio>,
    @InjectRepository(Holding) private holdingRepo: Repository<Holding>,
    @InjectRepository(Asset) private assetRepo: Repository<Asset>,
    @InjectRepository(SmartMoneySignal) private signalRepo: Repository<SmartMoneySignal>,
    @InjectRepository(TrackedInvestor) private investorRepo: Repository<TrackedInvestor>,
  ) {}

  async onModuleInit() {
    const apiKey = this.configService.get<string>('DEEPSEEK_API_KEY');
    if (!apiKey) {
      this.logger.warn('DEEPSEEK_API_KEY not set — agent engine disabled');
      return;
    }

    this.tools = new ToolRegistry();
    this.tools
      .register(this.createGetStockPriceTool())
      .register(this.createGetPortfolioTool())
      .register(this.createGetNewsSentimentTool())
      .register(this.createGetSmartMoneySignalTool());

    this.agents = new AgentRegistry();
    this.agents
      .register(ORCHESTRATOR_PROFILE)
      .register(MARKET_ANALYZER_PROFILE)
      .register(SMART_MONEY_PROFILE)
      .register(PORTFOLIO_MANAGER_PROFILE);

    this.providers = new ProviderRegistry();
    this.providers.register('default', new DeepSeekProvider({ apiKey, model: this.MODEL }));

    this.logger.log('AgentEngineService ready');
  }

  async analyze(request: string): Promise<{ result: string; steps: string[] }> {
    if (!this.tools || !this.agents || !this.providers) {
      return { result: 'Agent engine not available. Configure DEEPSEEK_API_KEY.', steps: [] };
    }

    const steps: string[] = [];
    const tokens: string[] = [];

    steps.push(`[${new Date().toLocaleTimeString()}] 🎯 Orchestrator recibió: "${request.substring(0, 50)}..."`);

    // Fresh transport and engine per request — avoids shared state between concurrent calls
    const transport = new CallbackTransport((event: AgentEvent) => {
      if (event.type === 'token') {
        tokens.push(event.content);
      } else if (event.type === 'agent_switch') {
        steps.push(`[${new Date().toLocaleTimeString()}] 🔄 Delegando a: ${event.to}`);
      } else if (event.type === 'tool_call') {
        steps.push(`[${new Date().toLocaleTimeString()}] 🔧 Ejecutando tool: ${event.name}`);
      } else if (event.type === 'tool_result') {
        steps.push(`[${new Date().toLocaleTimeString()}] ✅ Tool completada: ${event.name}`);
      } else if (event.type === 'error') {
        this.logger.error('Agent error:', event.message);
      }
    });

    const engine = new AgentEngine({
      model: { provider: 'default', id: this.MODEL },
      agents: this.agents,
      tools: this.tools,
      providers: this.providers,
      transport,
      defaultProvider: 'default',
      defaultAgentId: 'orchestrator',
      maxIterations: 15,
      iterationMode: 'auto',
    });

    try {
      let timeoutHandle: NodeJS.Timeout;
      const timeout = new Promise<void>((resolve) => {
        timeoutHandle = setTimeout(() => {
          steps.push(`[${new Date().toLocaleTimeString()}] ⏱ Timeout después de 60s`);
          resolve();
        }, 60000);
      });

      this.logger.log(`🎯 Agent analysis started: "${request.substring(0, 80)}..."`);
      await Promise.race([engine.run(request), timeout]);
      clearTimeout(timeoutHandle!);
      steps.push(`[${new Date().toLocaleTimeString()}] ✅ Análisis completado`);
    } catch (error) {
      this.logger.error('Agent analysis failed:', error);
      return { result: `Analysis failed: ${(error as Error).message}`, steps };
    }

    const result = tokens.join('');
    this.logger.log(`✅ Agent analysis completed: ${result.substring(0, 100)}...`);
    return { result: result || 'No response generated', steps };
  }

  private runMcpProcess(mcpPath: string, req: object): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn('node', [mcpPath]);
      const chunks: string[] = [];
      proc.stdout.on('data', (d: Buffer) => chunks.push(d.toString()));
      proc.on('close', () => resolve(chunks.join('')));
      proc.on('error', reject);
      const timer = setTimeout(() => {
        proc.kill();
        resolve('');
      }, 15000);
      proc.on('close', () => clearTimeout(timer));
      proc.stdin.write(JSON.stringify(req));
      proc.stdin.end();
    });
  }

  private createGetStockPriceTool() {
    return defineTool({
      name: 'get_stock_price',
      description: 'Obtiene el precio actual de una acción o crypto desde Yahoo Finance. Fuente: Yahoo Finance API.',
      input: z.object({
        symbol: z.string().describe('Símbolo del activo (ej: AAPL, BTC-USD)'),
      }),
      execute: async ({ symbol }) => {
        try {
          const response = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
            { headers: { 'User-Agent': 'Mozilla/5.0' } },
          );
          const data: any = await response.json();
          const meta = data?.chart?.result?.[0]?.meta;
          if (!meta) return JSON.stringify({ error: 'Symbol not found', source: 'Yahoo Finance' });
          return JSON.stringify({
            symbol: symbol.toUpperCase(),
            price: meta.regularMarketPrice || meta.previousClose,
            name: meta.shortName || meta.longName,
            currency: meta.currency || 'USD',
            _source: 'Yahoo Finance',
            _timestamp: new Date().toISOString(),
            _url: `https://finance.yahoo.com/quote/${symbol}`,
          });
        } catch (error) {
          return JSON.stringify({ error: (error as Error).message, source: 'Yahoo Finance' });
        }
      },
    });
  }

  private createGetPortfolioTool() {
    return defineTool({
      name: 'get_portfolio_summary',
      description: 'Obtiene el resumen del portafolio del usuario desde la base de datos local.',
      input: z.object({
        walletId: z.string().optional().describe('ID de la wallet'),
      }),
      execute: async ({ walletId }) => {
        try {
          const wallets = await this.walletRepo.find({ relations: ['portfolios', 'portfolios.holdings', 'portfolios.holdings.asset'] });
          const wallet = walletId ? wallets.find(w => w.id === walletId) : wallets[0];
          if (!wallet) return JSON.stringify({ error: 'No wallet found', _source: 'Base de datos local' });

          const holdings = wallet.portfolios?.flatMap(p => p.holdings || []) || [];
          const totalValue = holdings.reduce((sum, h) => sum + Number(h.currentValue), 0);

          return JSON.stringify({
            walletName: wallet.name,
            totalValue,
            portfolioCount: wallet.portfolios?.length || 0,
            holdings: holdings.map(h => ({
              symbol: h.asset?.symbol || 'unknown',
              value: Number(h.currentValue),
              allocation: totalValue > 0 ? Number(h.currentValue) / totalValue : 0,
              return: Number(h.returnPercentage),
              quantity: Number(h.quantity),
            })),
            _source: 'Base de datos local (PostgreSQL)',
            _timestamp: new Date().toISOString(),
          });
        } catch (error) {
          return JSON.stringify({ error: (error as Error).message, _source: 'Base de datos local' });
        }
      },
    });
  }

  private createGetNewsSentimentTool() {
    return defineTool({
      name: 'get_news_sentiment',
      description: 'Obtiene el sentimiento de noticias para un activo desde Yahoo Finance noticias (gratuito, sin API key).',
      input: z.object({
        symbol: z.string().describe('Símbolo del activo'),
      }),
      execute: async ({ symbol }) => {
        try {
          // Yahoo Finance RSS feed for news (gratuito, sin API key)
          const response = await fetch(
            `https://query1.finance.yahoo.com/v1/finance/search?q=${symbol}&newsCount=5`,
            { headers: { 'User-Agent': 'Mozilla/5.0' } },
          );
          const data: any = await response.json();
          const news = data?.news || [];

          if (news.length === 0) {
            return JSON.stringify({
              symbol: symbol.toUpperCase(),
              articleCount: 0,
              sentiment: 'unknown',
              _source: 'Yahoo Finance News',
              _timestamp: new Date().toISOString(),
            });
          }

          // Simple sentiment analysis based on title keywords
          const positiveWords = ['record', 'surpass', 'growth', 'beat', 'raise', 'positive', 'upgrade', 'bullish'];
          const negativeWords = ['miss', 'fall', 'decline', 'drop', 'investigation', 'lawsuit', 'downgrade', 'bearish'];
          
          let score = 0;
          const articles = news.slice(0, 5).map((a: any) => {
            const title = (a.title || '').toLowerCase();
            let articleScore = 0;
            positiveWords.forEach(w => { if (title.includes(w)) articleScore += 0.2; });
            negativeWords.forEach(w => { if (title.includes(w)) articleScore -= 0.25; });
            score += articleScore;
            return { title: a.title, publisher: a.publisher, link: a.link };
          });

          const avgScore = score / articles.length;
          const sentiment = avgScore > 0.1 ? 'positive' : avgScore < -0.1 ? 'negative' : 'neutral';

          return JSON.stringify({
            symbol: symbol.toUpperCase(),
            articleCount: articles.length,
            sentiment,
            confidence: Math.min(1, Math.abs(avgScore) + 0.3).toFixed(2),
            articles,
            _source: 'Yahoo Finance News',
            _timestamp: new Date().toISOString(),
          });
        } catch (error) {
          return JSON.stringify({ error: (error as Error).message, _source: 'Yahoo Finance News' });
        }
      },
    });
  }

  
  private createGetSmartMoneySignalTool() {
    return defineTool({
      name: 'get_smart_money_signal',
      description: 'Obtiene senales de inversores institucionales. PRIORIZA smart-money-mcp-v2 (SEC EDGAR), fallback a DB local.',
      input: z.object({
        symbol: z.string().describe('Simbolo del activo'),
      }),
      execute: async ({ symbol }) => {
        const sym = symbol.toUpperCase();
        try {
          // 1. PRIMERO: smart-money-mcp-v2 (SEC EDGAR en tiempo real)
          try {
            const mcpPath = path.resolve(process.cwd(), 'mcp-servers/smart-money-mcp-v2/dist/index.js');
            const investors = await this.investorRepo.find({ where: { isActive: true } });
            for (const inv of investors.slice(0, 3)) {
              const req = {
                jsonrpc: '2.0', id: 1, method: 'tools/call',
                params: { name: 'get_13f_filings', arguments: { cik: inv.cik, useRealData: true } },
              };
              const output = await this.runMcpProcess(mcpPath, req);
              for (const line of output.trim().split('\n')) {
                try {
                  const parsed = JSON.parse(line);
                  if (parsed.id === 1 && parsed.result?.content) {
                    const data = parsed.result.content;
                    if (data.holdings?.some((h: any) => h.symbol === sym)) {
                      return JSON.stringify({
                        ...data, symbol: sym,
                        _source: 'smart-money-mcp-v2 (SEC EDGAR - tiempo real)',
                        _timestamp: new Date().toISOString(),
                        _status: 'online',
                      });
                    }
                  }
                } catch { /* skip malformed lines */ }
              }
            }
          } catch (error) {
            this.logger.warn('smart-money-mcp-v2 not available:', (error as Error).message);
          }

          // 2. FALLBACK: DB local
          const signals = await this.signalRepo.find({ where: { symbol: sym }, order: { detectedAt: 'DESC' }, take: 5 });
          if (signals.length > 0) {
            const s = signals[0];
            const investors = await this.investorRepo.find({ where: { isActive: true } });
            return JSON.stringify({
              symbol: sym, signalType: s.signalType,
              conviction: (s.conviction * 100).toFixed(0) + '%',
              investorCount: s.investorCount, netFlow: s.netFlow,
              backingInvestors: s.backingInvestors?.slice(0, 5).map((i) => i.name) || [],
              totalTrackedInvestors: investors.length, detectedAt: s.detectedAt,
              _source: 'Base de datos local',
              _timestamp: new Date().toISOString(),
              _status: 'local',
              _note: 'Datos locales. Conecta smart-money-mcp-v2 para datos SEC EDGAR en tiempo real.',
            });
          }

          return JSON.stringify({
            symbol: sym,
            message: 'No hay datos. Inicia smart-money-mcp-v2 o genera una senal manualmente.',
            _source: 'No disponible',
            _timestamp: new Date().toISOString(),
            _status: 'unavailable',
          });
        } catch (error) {
          return JSON.stringify({ error: (error as Error).message, _source: 'Error' });
        }
      },
    });
  }

}