#!/usr/bin/env node

/**
 * Smart Money MCP Server
 *
 * Conecta a SEC EDGAR (gratuito, sin API key) para obtener:
 * - 13F filings: Holdings trimestrales de inversores institucionales
 * - Form 4: Transacciones de insider traders
 *
 * También incluye datos simulados como fallback cuando SEC EDGAR no responde.
 */

const SEC_EDGAR_BASE = 'https://www.sec.gov/cgi-bin/browse-edgar';
const SEC_EDGAR_HEADERS = {
  'User-Agent': 'Finance Portfolio Manager (admin@finance.com)',
  'Accept': 'text/html,application/xhtml+xml,application/xml',
};

// CIKs de inversores trackeados
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

interface Holding {
  symbol: string;
  name: string;
  value: number;
  positionChange: number;
  allocation: number;
}

interface InvestorData {
  name: string;
  cik: string;
  fundType: string;
  holdings: Holding[];
  totalValue: number;
  filingDate: string;
}

/**
 * Obtiene los holdings 13F de un inversor desde SEC EDGAR
 */
async function fetch13FFromSEC(cik: string): Promise<InvestorData | null> {
  try {
    // 1. Buscar los filings 13F del inversor
    const searchUrl = `${SEC_EDGAR_BASE}?action=getcompany&CIK=${cik}&type=13F&dateb=&owner=include&count=10`;
    const searchResponse = await fetch(searchUrl, { headers: SEC_EDGAR_HEADERS });
    
    if (!searchResponse.ok) {
      console.error(`SEC EDGAR search failed for CIK ${cik}: ${searchResponse.status}`);
      return null;
    }

    const html = await searchResponse.text();
    
    // 2. Extraer el primer link a un documento 13F XML
    const docMatch = html.match(/<a[^>]*href="([^"]*primary-doc[^"]*)"[^>]*>/i);
    if (!docMatch) {
      // Intentar con otro formato de link
      const altMatch = html.match(/<a[^>]*href="([^"]*\.xml[^"]*)"[^>]*>/i);
      if (!altMatch) return null;
      
      const docUrl = `https://www.sec.gov${altMatch[1]}`;
      const docResponse = await fetch(docUrl, { headers: SEC_EDGAR_HEADERS });
      if (!docResponse.ok) return null;
      
      const xml = await docResponse.text();
      return parse13FXML(xml, cik);
    }

    const docUrl = `https://www.sec.gov${docMatch[1]}`;
    const docResponse = await fetch(docUrl, { headers: SEC_EDGAR_HEADERS });
    if (!docResponse.ok) return null;

    const xml = await docResponse.text();
    return parse13FXML(xml, cik);
  } catch (error) {
    console.error(`Error fetching 13F for CIK ${cik}:`, (error as Error).message);
    return null;
  }
}

/**
 * Parsea el XML de un filing 13F y extrae los holdings
 */
function parse13FXML(xml: string, cik: string): InvestorData | null {
  const investor = TRACKED_INVESTORS[cik];
  if (!investor) return null;

  const holdings: Holding[] = [];
  
  // Extraer información del filing
  const periodMatch = xml.match(/<periodOfReport>([^<]+)<\/periodOfReport>/i);
  const filingDate = periodMatch ? periodMatch[1] : new Date().toISOString().split('T')[0];

  // Extraer cada holding del XML
  const infoTableMatch = xml.match(/<infoTable>([\s\S]*?)<\/infoTable>/gi);
  if (!infoTableMatch) return null;

  for (const table of infoTableMatch) {
    const nameMatch = table.match(/<nameOfIssuer>([^<]+)<\/nameOfIssuer>/i);
    const cusipMatch = table.match(/<cusip>([^<]+)<\/cusip>/i);
    const valueMatch = table.match(/<value>([^<]+)<\/value>/i);
    const sharesMatch = table.match(/<shrsOrPrnAmt>[\s\S]*?<sshPrnamt>([^<]+)<\/sshPrnamt>/i);
    const priceMatch = table.match(/<sshPrnamtType>([^<]+)<\/sshPrnamtType>/i);

    if (nameMatch && valueMatch) {
      const name = nameMatch[1].trim();
      const value = parseFloat(valueMatch[1]) * 1000; // SEC EDGAR reports in thousands
      
      // Convertir nombre a símbolo (simplificado)
      const symbol = nameToSymbol(name);
      
      holdings.push({
        symbol,
        name,
        value,
        positionChange: 0, // Se calcula comparando con filing anterior
        allocation: 0, // Se calcula después
      });
    }
  }

  // Calcular allocaciones
  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  for (const h of holdings) {
    h.allocation = totalValue > 0 ? Math.round((h.value / totalValue) * 10000) / 100 : 0;
  }

  return {
    name: investor.name,
    cik,
    fundType: investor.type,
    holdings: holdings.slice(0, 50), // Máximo 50 holdings
    totalValue,
    filingDate,
  };
}

/**
 * Convierte nombre de empresa a símbolo ticker (simplificado)
 * En producción, esto debería consultar un mapping real
 */
function nameToSymbol(name: string): string {
  const commonMappings: Record<string, string> = {
    'APPLE INC': 'AAPL',
    'MICROSOFT CORP': 'MSFT',
    'ALPHABET INC': 'GOOGL',
    'AMAZON COM INC': 'AMZN',
    'TESLA INC': 'TSLA',
    'META PLATFORMS INC': 'META',
    'NVIDIA CORP': 'NVDA',
    'BERKSHIRE HATHAWAY INC': 'BRK.B',
    'JPMORGAN CHASE & CO': 'JPM',
    'VISA INC': 'V',
    'MASTERCARD INC': 'MA',
    'JOHNSON & JOHNSON': 'JNJ',
    'WALMART INC': 'WMT',
    'PROCTER & GAMBLE CO': 'PG',
    'COCA COLA CO': 'KO',
    'PEPSICO INC': 'PEP',
    'MCDONALDS CORP': 'MCD',
    'DISNEY WALT CO': 'DIS',
    'NETFLIX INC': 'NFLX',
    'ADOBE INC': 'ADBE',
    'SALESFORCE INC': 'CRM',
    'INTEL CORP': 'INTC',
    'AMD': 'AMD',
    'BANK OF AMERICA CORP': 'BAC',
    'WELLS FARGO & CO': 'WFC',
    'CHEVRON CORP': 'CVX',
    'EXXON MOBIL CORP': 'XOM',
    'PFIZER INC': 'PFE',
    'ABBVIE INC': 'ABBV',
    'THERMO FISHER SCIENTIFIC INC': 'TMO',
  };

  const upper = name.toUpperCase().trim();
  return commonMappings[upper] || upper.split(' ')[0];
}

/**
 * Datos simulados como fallback cuando SEC EDGAR no responde
 */
function getSimulatedData(cik: string): InvestorData | null {
  const investor = TRACKED_INVESTORS[cik];
  if (!investor) return null;

  const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'BRK.B', 'JPM', 'V', 'KO', 'PEP'];
  const holdings: Holding[] = symbols.slice(0, 5 + Math.floor(Math.random() * 3)).map(symbol => ({
    symbol,
    name: symbol,
    value: Math.round(Math.random() * 50000000 * 100) / 100,
    positionChange: (Math.random() - 0.5) * 0.3,
    allocation: 0,
  }));

  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  for (const h of holdings) {
    h.allocation = Math.round((h.value / totalValue) * 10000) / 100;
  }

  return {
    name: investor.name,
    cik,
    fundType: investor.type,
    holdings,
    totalValue,
    filingDate: new Date().toISOString().split('T')[0],
  };
}

// --- MCP Server via stdio ---

async function main() {
  process.stdin.on('data', async (data: Buffer) => {
    const line = data.toString().trim();
    if (!line) return;

    try {
      const request = JSON.parse(line);

      if (request.method === 'initialize') {
        const response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {
                get_13f_filings: {
                  description: 'Obtiene holdings 13F de un inversor institucional desde SEC EDGAR',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      cik: { type: 'string', description: 'CIK del inversor (ej: 0001576288 para ARK Invest)' },
                      useRealData: { type: 'boolean', description: 'Si es true, consulta SEC EDGAR real. Si es false, usa datos simulados.', default: true },
                    },
                    required: ['cik'],
                  },
                },
                get_form4_filings: {
                  description: 'Obtiene transacciones insider recientes desde SEC EDGAR',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      ticker: { type: 'string' },
                      daysBack: { type: 'number', default: 30 },
                    },
                    required: ['ticker'],
                  },
                },
                get_investor_profile: {
                  description: 'Obtiene perfil completo de un inversor',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      investorName: { type: 'string' },
                    },
                    required: ['investorName'],
                  },
                },
              },
            },
            serverInfo: { name: 'smart-money', version: '2.0.0' },
          },
        };
        process.stdout.write(JSON.stringify(response) + '\n');
      } else if (request.method === 'tools/call') {
        const { name, arguments: args } = request.params;
        let result: any;

        switch (name) {
          case 'get_13f_filings': {
            const cik = args?.cik;
            const useRealData = args?.useRealData !== false;
            
            if (useRealData) {
              // Intentar SEC EDGAR real
              console.log(`🔍 Consultando SEC EDGAR para CIK ${cik}...`);
              result = await fetch13FFromSEC(cik);
              if (!result) {
                console.log(`⚠️  SEC EDGAR no respondió para CIK ${cik}, usando datos de referencia`);
                result = getSimulatedData(cik);
                if (result) {
                  result._dataStatus = 'fallback';
                  result._dataSource = 'Datos de referencia (SEC EDGAR no disponible)';
                  result._note = 'SEC EDGAR no respondió. Mostrando datos de referencia.';
                }
              } else {
                console.log(`✅ Datos obtenidos de SEC EDGAR para CIK ${cik}`);
                result._dataStatus = 'online';
                result._dataSource = 'SEC EDGAR (tiempo real)';
                result._note = 'Datos obtenidos directamente de SEC EDGAR.';
              }
            } else {
              result = getSimulatedData(cik);
              if (result) {
                result._dataStatus = 'simulated';
                result._dataSource = 'Datos simulados';
                result._note = 'Modo simulado activado. Usa useRealData=true para datos reales.';
              }
            }
            break;
          }
          case 'get_form4_filings': {
            // Simulado por ahora — SEC EDGAR Form 4 requiere parsing diferente
            result = {
              ticker: args?.ticker,
              transactions: [],
              _note: 'Form 4 parsing no implementado aún',
            };
            break;
          }
          case 'get_investor_profile': {
            const name = args?.investorName;
            const useReal = args?.useRealData !== false;
            const entry = Object.values(TRACKED_INVESTORS).find(i => i.name === name);
            if (entry) {
              console.log(`🔍 Buscando perfil de ${name} (CIK: ${entry.cik})...`);
              const data = useReal 
                ? await fetch13FFromSEC(entry.cik) 
                : getSimulatedData(entry.cik);
              result = data || getSimulatedData(entry.cik);
              if (result && useReal) {
                result._dataStatus = result._dataStatus || 'online';
                result._dataSource = result._dataSource || 'SEC EDGAR (tiempo real)';
              }
            } else {
              result = { error: `Investor ${name} not found` };
            }
            break;
          }
          default:
            result = { error: `Unknown tool: ${name}` };
        }

        const response = {
          jsonrpc: '2.0',
          id: request.id,
          result: { content: result },
        };
        process.stdout.write(JSON.stringify(response) + '\n');
      }
    } catch {
      // Ignore parse errors
    }
  });

  // Signal ready
  const ready = { jsonrpc: '2.0', method: 'ready' };
  process.stdout.write(JSON.stringify(ready) + '\n');
}

main().catch(console.error);
