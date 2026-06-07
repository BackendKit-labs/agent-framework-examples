import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from './asset.entity';

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);

  constructor(
    @InjectRepository(Asset) private assetRepo: Repository<Asset>,
  ) {}

  async findAll(): Promise<Asset[]> {
    return this.assetRepo.find({ order: { symbol: 'ASC' }, take: 50 });
  }

  /**
   * Valida un símbolo contra fuentes públicas
   * 1. Primero busca en nuestra DB
   * 2. Si no existe, consulta Yahoo Finance
   * 3. Si existe en Yahoo, lo guarda en nuestra DB para futuras consultas
   */
  async validateSymbol(symbol: string): Promise<{ valid: boolean; symbol: string; name?: string; type?: string; id?: string; currentPrice?: number }> {
    const sym = symbol.toUpperCase().trim();

    // 1. Buscar en DB local
    const existing = await this.assetRepo.findOneBy({ symbol: sym });
    if (existing) {
      return { valid: true, symbol: sym, name: existing.name, type: existing.type, id: existing.id, currentPrice: Number(existing.currentPrice) };
    }

    // 2. Consultar Yahoo Finance (público, sin API key)
    try {
      const result = await this.lookupYahooFinance(sym);
      if (result) {
        // Guardar en DB para futuras consultas
        try {
          const asset = this.assetRepo.create({
            symbol: sym,
            name: result.name,
            type: result.type as any,
            currentPrice: result.price || 0,
          });
          await this.assetRepo.save(asset);
          this.logger.log(`Added new asset to database: ${sym} - ${result.name}`);
        } catch {
          // Si ya existe (carrera), ignorar
        }
        return { valid: true, symbol: sym, name: result.name, type: result.type };
      }
    } catch (error) {
      this.logger.warn(`Yahoo Finance lookup failed for ${sym}:`, (error as Error).message);
    }

    return { valid: false, symbol: sym };
  }

  /**
   * Busca un símbolo en Yahoo Finance
   * Usa el endpoint público de búsqueda (sin API key)
   */
  private async lookupYahooFinance(symbol: string): Promise<{ name: string; type: string; price: number } | null> {
    try {
      // Yahoo Finance v8 chart API (público)
      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } },
      );

      if (!response.ok) return null;

      const data: any = await response.json();
      const meta = data?.chart?.result?.[0]?.meta;

      if (!meta) return null;

      // Determinar tipo por symbol
      let type = 'stock';
      if (symbol.endsWith('-USD') || symbol.endsWith('USD')) type = 'crypto';
      else if (symbol === 'BTC' || symbol === 'ETH' || symbol === 'SOL') type = 'crypto';
      else if (symbol.endsWith('=X')) type = 'currency';

      return {
        name: meta.shortName || meta.longName || symbol,
        type,
        price: meta.regularMarketPrice || meta.previousClose || 0,
      };
    } catch {
      return null;
    }
  }

  /**
   * Busca sugerencias de símbolos (autocomplete)
   */
  async searchSymbols(query: string): Promise<Array<{ symbol: string; name: string; type: string }>> {
    if (!query || query.length < 1) return [];

    // 1. Buscar en DB local
    const localResults = await this.assetRepo.find({
      where: { symbol: query.toUpperCase() },
      take: 5,
    });

    if (localResults.length > 0) {
      return localResults.map(a => ({ symbol: a.symbol, name: a.name, type: a.type }));
    }

    // 2. Consultar Yahoo Finance autocomplete
    try {
      const response = await fetch(
        `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=5`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } },
      );

      if (!response.ok) return [];

      const data: any = await response.json();
      return (data.quotes || [])
        .filter((q: any) => q.symbol && q.shortname)
        .map((q: any) => ({
          symbol: q.symbol,
          name: q.shortname || q.longname,
          type: q.quoteType?.toLowerCase() || 'stock',
        }));
    } catch {
      return [];
    }
  }
}
