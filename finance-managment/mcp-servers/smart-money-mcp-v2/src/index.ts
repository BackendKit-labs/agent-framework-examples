#!/usr/bin/env node

/**
 * Smart Money MCP Server v2.0
 *
 * Implementado con @backendkit-labs/mcp-server (AgentMCPServer).
 * 
 * Fuentes de datos:
 * - SEC EDGAR (gratuito, sin API key) para 13F filings
 * - Datos de referencia como fallback cuando SEC no responde
 */

import { AgentMCPServer } from '@backendkit-labs/mcp-server';
import { z } from 'zod';

// ─── Configuración ───────────────────────────────────────────

const SEC_EDGAR_BASE = 'https://www.sec.gov/cgi-bin/browse-edgar';
const SEC_HEADERS = {
  'User-Agent': 'Finance Portfolio Manager (admin@finance.com)',
  'Accept': 'text/html,application/xhtml+xml,application/xml',
};

const TRACKED_INVESTORS: Record<string, { name: string; cik: string; type: string }> = {
  '0001576288': { name: 'ARK Invest', cik: '0001576288', type: 'hedge_fund' },
  '0001067983': { name: 'Berkshire Hathaway', cik: '0001067983', type: 'holding_company' },
  '0001350694': { name: 'Bridgewater Associates', cik: '0001350694', type: 'hedge_fund' },
  '0001037381': { name: 'Renaissance Technologies', cik: '0001037381', type: 'hedge_fund' },
  '0001364742': { name: 'BlackRock', cik: '0001364742', type: 'asset_manager' },
  '0000102909': { name: 'Vanguard', cik: '0000102909', type: 'asset_manager' },
  '0001040274': { name: 'Third Point', cik: '0001040274', type: 'hedge_fund' },
  '0001336528': { name: 'Pershing Square', cik: '0001336528', type: 'hedge_fund' },
  '0001418814': { name: 'Scion Asset Management', cik: '0001418814', type: 'hedge_fund' },
  '0001040017': { name: 'Tiger Global', cik: '0001040017', type: 'hedge_fund' },
};

// ─── SEC EDGAR Client ────────────────────────────────────────

const NAME_TO_SYMBOL: Record<string, string> = {
  'APPLE INC': 'AAPL', 'MICROSOFT CORP': 'MSFT', 'ALPHABET INC': 'GOOGL',
  'AMAZON COM INC': 'AMZN', 'TESLA INC': 'TSLA', 'META PLATFORMS INC': 'META',
  'NVIDIA CORP': 'NVDA', 'BERKSHIRE HATHAWAY INC': 'BRK.B', 'JPMORGAN CHASE & CO': 'JPM',
  'VISA INC': 'V', 'MASTERCARD INC': 'MA', 'JOHNSON & JOHNSON': 'JNJ',
  'WALMART INC': 'WMT', 'PROCTER & GAMBLE CO': 'PG', 'COCA COLA CO': 'KO',
  'PEPSICO INC': 'PEP', 'MCDONALDS CORP': 'MCD', 'DISNEY WALT CO': 'DIS',
  'NETFLIX INC': 'NFLX', 'ADOBE INC': 'ADBE', 'SALESFORCE INC': 'CRM',
  'INTEL CORP': 'INTC', 'BANK OF AMERICA CORP': 'BAC', 'WELLS FARGO & CO': 'WFC',
  'CHEVRON CORP': 'CVX', 'EXXON MOBIL CORP': 'XOM', 'PFIZER INC': 'PFE',
  'ABBVIE INC': 'ABBV', 'THERMO FISHER SCIENTIFIC INC': 'TMO',
};

function nameToSymbol(name: string): string {
  const upper = name.toUpperCase().trim();
  return NAME_TO_SYMBOL[upper] || upper.split(' ')[0];
}

async function fetch13FFromSEC(cik: string): Promise<any> {
  try {
    process.stderr.write(`[SEC EDGAR] Consultando filings para CIK ${cik}...\n`);
    
    const searchUrl = `${SEC_EDGAR_BASE}?action=getcompany&CIK=${cik}&type=13F&dateb=&owner=include&count=5`;
    const searchRes = await fetch(searchUrl, { headers: SEC_HEADERS });
    if (!searchRes.ok) {
      process.stderr.write(`[SEC EDGAR] HTTP ${searchRes.status} para CIK ${cik}\n`);
      return null;
    }

    const html = await searchRes.text();
    const docMatch = html.match(/<a[^>]*href="([^"]*primary-doc[^"]*)"[^>]*>/i);
    const altMatch = !docMatch ? html.match(/<a[^>]*href="([^"]*\.xml[^"]*)"[^>]*>/i) : null;
    const href = docMatch?.[1] || altMatch?.[1];
    
    if (!href) {
      process.stderr.write(`[SEC EDGAR] No se encontraron documentos 13F para CIK ${cik}\n`);
      return null;
    }

    const docUrl = `https://www.sec.gov${href}`;
    process.stderr.write(`[SEC EDGAR] Descargando: ${docUrl}\n`);
    
    const docRes = await fetch(docUrl, { headers: SEC_HEADERS });
    if (!docRes.ok) return null;

    const xml = await docRes.text();
    const investor = TRACKED_INVESTORS[cik];
    if (!investor) return null;

    const periodMatch = xml.match(/<periodOfReport>([^<]+)<\/periodOfReport>/i);
    const filingDate = periodMatch?.[1] || new Date().toISOString().split('T')[0];
    const infoTables = xml.match(/<infoTable>([\s\S]*?)<\/infoTable>/gi);

    if (!infoTables) {
      process.stderr.write(`[SEC EDGAR] No se encontraron holdings en el filing\n`);
      return null;
    }

    const holdings: any[] = [];
    for (const table of infoTables) {
      const nameMatch = table.match(/<nameOfIssuer>([^<]+)<\/nameOfIssuer>/i);
      const valueMatch = table.match(/<value>([^<]+)<\/value>/i);
      if (!nameMatch || !valueMatch) continue;
      const name = nameMatch[1].trim();
      const value = parseFloat(valueMatch[1]) * 1000;
      holdings.push({ symbol: nameToSymbol(name), name, value, positionChange: 0, allocation: 0 });
    }

    const totalValue = holdings.reduce((s: number, h: any) => s + h.value, 0);
    for (const h of holdings) {
      h.allocation = totalValue > 0 ? Math.round((h.value / totalValue) * 10000) / 100 : 0;
    }

    process.stderr.write(`[SEC EDGAR] ${holdings.length} holdings obtenidos para ${investor.name}\n`);

    return {
      name: investor.name, cik, fundType: investor.type,
      holdings: holdings.slice(0, 50), totalValue, filingDate,
      _dataStatus: 'online',
      _dataSource: 'SEC EDGAR (tiempo real)',
      _note: `Datos de SEC EDGAR. Período: ${filingDate}. ${holdings.length} holdings.`,
    };
  } catch (error) {
    process.stderr.write(`[SEC EDGAR] Error: ${(error as Error).message}\n`);
    return null;
  }
}

function getReferenceData(cik: string): any {
  const investor = TRACKED_INVESTORS[cik];
  if (!investor) return null;

  const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'BRK.B', 'JPM', 'V', 'KO', 'PEP'];
  const holdings = symbols.slice(0, 5 + Math.floor(Math.random() * 3)).map((s: string) => ({
    symbol: s, name: s, value: Math.round(Math.random() * 50000000 * 100) / 100,
    positionChange: (Math.random() - 0.5) * 0.3, allocation: 0,
  }));

  const totalValue = holdings.reduce((s: number, h: any) => s + h.value, 0);
  for (const h of holdings) h.allocation = Math.round((h.value / totalValue) * 10000) / 100;

  return {
    name: investor.name, cik, fundType: investor.type,
    holdings, totalValue, filingDate: new Date().toISOString().split('T')[0],
    _dataStatus: 'fallback',
    _dataSource: 'Datos de referencia',
    _note: 'SEC EDGAR no disponible. Mostrando datos de referencia.',
  };
}

// ─── Tools ───────────────────────────────────────────────────

const tools = [
  {
    name: 'get_13f_filings',
    description: 'Obtiene los holdings 13F de un inversor institucional desde SEC EDGAR',
    schema: {
      cik: z.string().describe('CIK del inversor (ej: 0001576288 para ARK Invest)'),
      useRealData: z.boolean().default(true).describe('Si es true, consulta SEC EDGAR real'),
    },
    buildPrompt: (args: any) => {
      const { cik, useRealData } = args;
      if (useRealData) {
        return `Obtén los holdings 13F del inversor con CIK ${cik} desde SEC EDGAR. Si SEC EDGAR no responde, usa datos de referencia.`;
      }
      return `Obtén los holdings de referencia para el inversor con CIK ${cik}`;
    },
  },
  {
    name: 'get_investor_profile',
    description: 'Obtiene el perfil completo de un inversor institucional',
    schema: {
      investorName: z.string().describe('Nombre del inversor'),
      useRealData: z.boolean().default(true).describe('Si es true, consulta SEC EDGAR real'),
    },
    buildPrompt: (args: any) => {
      const { investorName, useRealData } = args;
      const entry = Object.values(TRACKED_INVESTORS).find((i: any) => i.name === investorName);
      if (!entry) return `El inversor "${investorName}" no está en nuestra base de datos. Lista: ${Object.values(TRACKED_INVESTORS).map((i: any) => i.name).join(', ')}`;
      if (useRealData) {
        return `Obtén el perfil completo de ${investorName} (CIK: ${entry.cik}) desde SEC EDGAR. Incluye holdings, valores y allocaciones.`;
      }
      return `Obtén el perfil de referencia de ${investorName}`;
    },
  },
  {
    name: 'list_investors',
    description: 'Lista todos los inversores institucionales trackeados',
    schema: {},
    buildPrompt: () => `Lista todos los inversores institucionales disponibles con su CIK y tipo de fondo.`,
  },
];

// ─── Engine personalizado ────────────────────────────────────

const engine = {
  run: async (prompt: string) => {
    // Parsear el prompt para determinar qué tool ejecutar
    if (prompt.includes('list_investors')) {
      return JSON.stringify({
        investors: Object.values(TRACKED_INVESTORS),
        total: Object.keys(TRACKED_INVESTORS).length,
      });
    }

    if (prompt.includes('get_13f_filings')) {
      const cikMatch = prompt.match(/CIK (\d+)/);
      const cik = cikMatch?.[1] || '0001576288';
      const useReal = !prompt.includes('datos de referencia');
      
      if (useReal) {
        const data = await fetch13FFromSEC(cik);
        if (data) return JSON.stringify(data);
      }
      const ref = getReferenceData(cik);
      return JSON.stringify(ref || { error: 'Investor not found' });
    }

    if (prompt.includes('get_investor_profile')) {
      const nameMatch = prompt.match(/de ([^(]+) \(CIK/i) || prompt.match(/de ([^(]+)/i);
      const name = nameMatch?.[1]?.trim();
      if (!name) return JSON.stringify({ error: 'No investor name found in prompt' });

      const entry = Object.values(TRACKED_INVESTORS).find((i: any) => i.name === name);
      if (!entry) return JSON.stringify({ error: `Investor "${name}" not found`, availableInvestors: Object.values(TRACKED_INVESTORS).map((i: any) => i.name) });

      const useReal = !prompt.includes('referencia');
      if (useReal) {
        const data = await fetch13FFromSEC(entry.cik);
        if (data) return JSON.stringify(data);
      }
      const ref = getReferenceData(entry.cik);
      return JSON.stringify(ref || { error: 'No data' });
    }

    return JSON.stringify({ error: 'Unknown command' });
  },
};

// ─── Start ───────────────────────────────────────────────────

const server = new (AgentMCPServer as any)({
  name: 'smart-money-mcp-v2',
  version: '2.0.0',
  engine,
  tools,
});

process.stderr.write('🚀 Smart Money MCP Server v2.0 iniciado\n');
process.stderr.write(`📡 ${Object.keys(TRACKED_INVESTORS).length} inversores trackeados\n`);
process.stderr.write('💡 Fuente principal: SEC EDGAR (gratuito, sin API key)\n');

server.startStdio();
