const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../backend/src/agents/core/agent-engine.service.ts');
let c = fs.readFileSync(filePath, 'utf8');

const idx = c.indexOf('private createGetSmartMoneySignalTool');
const before = c.substring(0, idx);

// Find the end of this method (next method or end of class)
const nextMethod = c.indexOf('private create', idx + 10);
const after = nextMethod > 0 ? c.substring(nextMethod) : '';

const newTool = `
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
            const { execSync } = require('child_process');
            const pathMod = require('path');
            const mcpPath = pathMod.resolve(process.cwd(), 'mcp-servers/smart-money-mcp-v2/dist/index.js');
            const investors = await this.investorRepo.find({ where: { isActive: true } });
            for (const inv of investors.slice(0, 3)) {
              const req = JSON.stringify({
                jsonrpc: '2.0', id: 1, method: 'tools/call',
                params: { name: 'get_13f_filings', arguments: { cik: inv.cik, useRealData: true } },
              });
              const cmd = 'echo ' + JSON.stringify(req) + ' | node "' + mcpPath + '"';
              const output = execSync(cmd, { timeout: 15000, encoding: 'utf-8', shell: true });
              const lines = output.trim().split('\\n');
              for (const line of lines) {
                try {
                  const parsed = JSON.parse(line);
                  if (parsed.id === 1 && parsed.result?.content) {
                    const data = parsed.result.content;
                    if (data.holdings?.some((h) => h.symbol === sym)) {
                      return JSON.stringify({
                        ...data, symbol: sym,
                        _source: 'smart-money-mcp-v2 (SEC EDGAR - tiempo real)',
                        _timestamp: new Date().toISOString(),
                        _status: 'online',
                      });
                    }
                  }
                } catch {}
              }
            }
          } catch (error) {
            this.logger.warn('smart-money-mcp-v2 not available:', (error).message);
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
          return JSON.stringify({ error: (error).message, _source: 'Error' });
        }
      },
    });
  }
`;

c = before + newTool + '\n' + after;
fs.writeFileSync(filePath, c);
console.log('OK - File rewritten');
