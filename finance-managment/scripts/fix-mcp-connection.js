const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../backend/src/agents/core/agent-engine.service.ts');
let c = fs.readFileSync(filePath, 'utf8');

const oldText = `          try {
            const mcpResponse = await fetch(
              \`http://localhost:3101/api/smart-money/signal/\${sym}\`,
              { signal: AbortSignal.timeout(5000) },
            );
            if (mcpResponse.ok) {
              const mcpData: any = await mcpResponse.json();
              return JSON.stringify({
                ...mcpData,
                _source: 'smart-money-mcp (SEC EDGAR)',
                _timestamp: new Date().toISOString(),
              });
            }
          } catch {
            this.logger.warn('smart-money-mcp not available');
          }`;

const newText = `          try {
            const { execSync } = require('child_process');
            const pathMod = require('path');
            const mcpPath = pathMod.resolve(process.cwd(), 'mcp-servers/smart-money-mcp-v2/dist/index.js');
            const req = JSON.stringify({
              jsonrpc: '2.0', id: 1, method: 'tools/call',
              params: { name: 'get_13f_filings', arguments: { cik: '0001576288', useRealData: true } },
            });
            const cmd = 'echo ' + JSON.stringify(req) + ' | node "' + mcpPath + '"';
            const output = require('child_process').execSync(cmd, { timeout: 15000, encoding: 'utf-8', shell: true });
            const lines = output.trim().split('\\n');
            for (const line of lines) {
              try {
                const parsed = JSON.parse(line);
                if (parsed.id === 1 && parsed.result?.content) {
                  const mcpData = parsed.result.content;
                  return JSON.stringify({ ...mcpData, symbol: sym, _source: 'smart-money-mcp-v2 (SEC EDGAR)', _timestamp: new Date().toISOString() });
                }
              } catch {}
            }
            this.logger.warn('smart-money-mcp-v2 returned no valid data');
          } catch (error) {
            this.logger.warn('smart-money-mcp-v2 not available:', error.message);
          }`;

if (c.includes(oldText)) {
  c = c.replace(oldText, newText);
  fs.writeFileSync(filePath, c);
  console.log('✅ MCP connection updated to v2');
} else {
  console.log('❌ Old text not found');
  // Debug: show context around the first occurrence
  const idx = c.indexOf('smart-money-mcp');
  if (idx > 0) {
    console.log('Context:', c.substring(idx - 50, idx + 150));
  }
}
