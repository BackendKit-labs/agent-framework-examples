# Prompt para Agente de Codificación: Sistema de Gestión de Carteras Financieras con Arquitectura de Agentes (backendkit-labs)

## Contexto del Proyecto

Necesitas implementar una aplicación completa de gestión de finanzas personales y profesionales que permita a los usuarios administrar **múltiples carteras de inversión**, cada una conteniendo **múltiples portafolios** de acciones y criptomonedas. El sistema debe contar con análisis avanzado, capacidades de **rebalanceo automático** y ejecución de operaciones en **momentos clave del mercado** (alertas técnicas y noticiosas).

La implementación debe estar construida **exclusivamente** sobre las nuevas librerías de `@backendkit-labs`:
- `@backendkit-labs/agent-core`: motor multi-agente agnóstico a modelo y transporte.
- `@backendkit-labs/agent-coding`: perfiles de agente codificador y herramientas.
- `@backendkit-labs/mcp-server`: servidor MCP para habilidades, inteligencia de código y contexto de agente.

Además, usarás `@backendkit/circuit-breaker`, `@backendkit/retry`, etc., como respaldo para resiliencia, pero la **lógica de negocio** (análisis, rebalanceo, decisiones de compra/venta) será implementada como **agentes autónomos** orquestados por `agent-core`. El sistema debe conectarse a servidores MCP especializados (ej. uno de investigación de noticias), y podrás crear **nuevos agentes** que expongan sus capacidades como servidores MCP usando `@backendkit-labs/mcp-server`.

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Administrativo                  │
│                 (React + TypeScript + MUI)                   │
└─────────────────────────────┬───────────────────────────────┘
                              │ REST / WebSocket
┌─────────────────────────────▼───────────────────────────────┐
│                      Backend (NestJS)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            Agent Orchestrator (agent-core)             │ │
│  │  - PortfolioManagerAgent                                │ │
│  │  - RebalancingAgent                                     │ │
│  │  - MarketAnalyzerAgent                                  │ │
│  │  - TradeExecutorAgent                                   │ │
│  │  - NewsResearchAgent (conecta a MCP externo)           │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │       MCP Server Gateway (mcp-server integrado)        │ │
│  │   Expone habilidades de agentes como herramientas MCP   │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
┌──────────────▼──────────────┐  ┌─────────────▼─────────────┐
│  PostgreSQL + Redis         │  │  Servidores MCP externos  │
│  (datos, caché, colas)      │  │  - news-research-mcp      │
└─────────────────────────────┘  │  - market-data-mcp        │
                                 │  - trading-signals-mcp    │
                                 └───────────────────────────┘
```

## Especificaciones Técnicas

### Tecnologías Base
- **Backend**: Node.js 20+, TypeScript, NestJS.
- **Base de Datos**: PostgreSQL + TypeORM, Redis para caché y colas.
- **Frontend**: React 18, TypeScript, Material UI (MUI) v5, React Query, Chart.js.
- **Agentes**: `@backendkit-labs/agent-core`, `@backendkit-labs/agent-coding`, `@backendkit-labs/mcp-server`.
- **Resiliencia**: `@backendkit/circuit-breaker`, `@backendkit/retry`, `@backendkit/bulkhead`, `@backendkit/rate-limiter`.
- **MCP**: SDK oficial `@modelcontextprotocol/sdk` solo para clientes externos; las herramientas internas se exponen vía `@backendkit-labs/mcp-server`.
- **Despliegue**: Docker Compose con servicios separados.

### Estructura de Carpetas

```
finance-portfolio-system/
├── backend/
│   ├── src/
│   │   ├── agents/               # Agentes con agent-core
│   │   │   ├── portfolio-manager.agent.ts
│   │   │   ├── rebalancing.agent.ts
│   │   │   ├── market-analyzer.agent.ts
│   │   │   ├── trade-executor.agent.ts
│   │   │   └── news-research.agent.ts
│   │   ├── mcp-gateway/          # Exposición de agentes como MCP
│   │   │   └── mcp-server.gateway.ts
│   │   ├── modules/              # Módulos NestJS tradicionales
│   │   │   ├── auth/             # JWT, roles
│   │   │   ├── users/            # Gestión de usuarios
│   │   │   ├── wallets/          # Carteras y portafolios (CRUD)
│   │   │   ├── assets/           # Activos financieros
│   │   │   ├── transactions/     # Registro de operaciones
│   │   │   └── notifications/    # Alertas y webhooks
│   │   ├── shared/               # Utilidades, configuraciones
│   │   └── main.ts
│   ├── Dockerfile
│   └── package.json
├── frontend-admin/               # Frontend React
├── mcp-servers/                  # Servidores MCP externos (opcionales)
│   └── news-research-mcp/        # Implementado con agent-coding
├── docker-compose.yml
└── README.md
```

## Implementación de Agentes con @backendkit-labs/agent-core

Cada agente debe ser un **agente autónomo** que corre dentro del backend y se comunica mediante mensajes. Usarás el motor multi-agente para orquestar tareas complejas como rebalanceo, análisis y ejecución de trades.

### 1. Configuración del Motor de Agentes

```typescript
// backend/src/agents/agent-orchestrator.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { AgentCore, AgentContext, AgentTransport } from '@backendkit-labs/agent-core';
import { PortfolioManagerAgent } from './portfolio-manager.agent';
import { RebalancingAgent } from './rebalancing.agent';
import { MarketAnalyzerAgent } from './market-analyzer.agent';
import { TradeExecutorAgent } from './trade-executor.agent';
import { NewsResearchAgent } from './news-research.agent';

@Injectable()
export class AgentOrchestrator implements OnModuleInit {
  private engine: AgentCore;

  constructor(
    private portfolioAgent: PortfolioManagerAgent,
    private rebalancingAgent: RebalancingAgent,
    private marketAnalyzer: MarketAnalyzerAgent,
    private tradeExecutor: TradeExecutorAgent,
    private newsAgent: NewsResearchAgent,
  ) {}

  async onModuleInit() {
    this.engine = new AgentCore({
      transport: new AgentTransport({
        type: 'in-memory', // Cambiar a Redis en producción
        options: { namespace: 'finance-agents' }
      }),
      agents: [
        this.portfolioAgent,
        this.rebalancingAgent,
        this.marketAnalyzer,
        this.tradeExecutor,
        this.newsAgent,
      ],
      hooks: {
        onError: (error, agent) => console.error(`Agent ${agent.name} error:`, error),
        onMessage: (msg) => console.debug('Agent message:', msg),
      }
    });
    await this.engine.start();
  }

  async sendCommand(targetAgent: string, command: string, payload: any) {
    return this.engine.send(targetAgent, { type: command, payload });
  }
}
```

### 2. Ejemplo de Agente: RebalancingAgent

```typescript
// backend/src/agents/rebalancing.agent.ts
import { Agent, AgentContext, Tool } from '@backendkit-labs/agent-core';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '../modules/wallets/wallet.entity';
import { Asset } from '../modules/assets/asset.entity';

@Injectable()
export class RebalancingAgent extends Agent {
  name = 'rebalancing-agent';
  description = 'Monitorea desviaciones de carteras y calcula órdenes de rebalanceo';

  constructor(
    @InjectRepository(Wallet) private walletRepo: Repository<Wallet>,
    @InjectRepository(Asset) private assetRepo: Repository<Asset>,
  ) {
    super();
  }

  @Tool({
    description: 'Calcula las operaciones necesarias para rebalancear una cartera según objetivo',
    inputSchema: {
      type: 'object',
      properties: {
        walletId: { type: 'string' },
        targetAllocations: { type: 'object', additionalProperties: { type: 'number' } },
        tolerance: { type: 'number', default: 0.05 }
      },
      required: ['walletId', 'targetAllocations']
    }
  })
  async calculateRebalanceOrders(ctx: AgentContext, payload: any) {
    const { walletId, targetAllocations, tolerance } = payload;
    const wallet = await this.walletRepo.findOne({ where: { id: walletId }, relations: ['portfolios', 'portfolios.holdings'] });
    if (!wallet) throw new Error('Wallet not found');

    const currentAllocations = this.calculateCurrentAllocations(wallet);
    const deviations = this.computeDeviations(currentAllocations, targetAllocations);
    const orders = [];

    for (const [assetSymbol, deviation] of Object.entries(deviations)) {
      if (Math.abs(deviation) > tolerance) {
        const asset = await this.assetRepo.findOneBy({ symbol: assetSymbol });
        const totalValue = wallet.portfolios.reduce((sum, p) => sum + p.totalValue, 0);
        const adjustmentValue = deviation * totalValue;
        orders.push({
          assetSymbol,
          side: adjustmentValue > 0 ? 'buy' : 'sell',
          amount: Math.abs(adjustmentValue),
          reason: `Rebalance: desviación de ${(deviation * 100).toFixed(2)}%`
        });
      }
    }

    return { orders, estimatedImpact: this.estimateMarketImpact(orders) };
  }

  @Tool({
    description: 'Ejecuta automáticamente el rebalanceo si la desviación supera el umbral',
  })
  async autoRebalance(ctx: AgentContext, payload: { walletId: string, dryRun?: boolean }) {
    const orders = await this.calculateRebalanceOrders(ctx, payload);
    if (!payload.dryRun && orders.orders.length) {
      await ctx.send('trade-executor', { type: 'execute_orders', payload: { orders: orders.orders, walletId: payload.walletId } });
    }
    return { executed: !payload.dryRun, orders };
  }

  private calculateCurrentAllocations(wallet: any) { /* ... */ }
  private computeDeviations(current: any, target: any) { /* ... */ }
  private estimateMarketImpact(orders: any[]) { /* ... */ }
}
```

### 3. Agente de Análisis de Mercado con MCP Externo

```typescript
// backend/src/agents/market-analyzer.agent.ts
import { Agent, Tool } from '@backendkit-labs/agent-core';
import { Injectable } from '@nestjs/common';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

@Injectable()
export class MarketAnalyzerAgent extends Agent {
  name = 'market-analyzer';
  description = 'Proporciona análisis técnico, fundamental y de sentimiento usando MCP externo';
  private mcpClient: Client;

  async onInit() {
    const transport = new StdioClientTransport({
      command: 'node',
      args: ['./mcp-servers/news-research-mcp/dist/index.js']
    });
    this.mcpClient = new Client({ name: 'market-analyzer-client', version: '1.0.0' });
    await this.mcpClient.connect(transport);
  }

  @Tool({
    description: 'Obtiene el sentimiento de mercado para un conjunto de activos basado en noticias recientes',
    inputSchema: {
      type: 'object',
      properties: { symbols: { type: 'array', items: { type: 'string' } } }
    }
  })
  async getMarketSentiment(ctx: AgentContext, { symbols }: { symbols: string[] }) {
    const results = {};
    for (const symbol of symbols) {
      const response = await this.mcpClient.callTool({
        name: 'get_news_sentiment',
        arguments: { ticker: symbol }
      });
      results[symbol] = response.content;
    }
    return { sentiment: results, timestamp: new Date().toISOString() };
  }

  @Tool({
    description: 'Calcula indicadores técnicos (RSI, MACD, medias móviles) para un activo',
  })
  async technicalAnalysis(ctx: AgentContext, { symbol, interval = '1d' }) {
    return { rsi: 65, macd: { macd: 0.2, signal: 0.1 }, sma50: 150.2 };
  }
}
```

### 4. Exposición de Agentes como Servidor MCP (Gateway)

```typescript
// backend/src/mcp-gateway/mcp-server.gateway.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { McpServer } from '@backendkit-labs/mcp-server';
import { AgentOrchestrator } from '../agents/agent-orchestrator.service';

@Injectable()
export class McpGateway implements OnModuleInit {
  private mcpServer: McpServer;

  constructor(private orchestrator: AgentOrchestrator) {}

  async onModuleInit() {
    this.mcpServer = new McpServer({
      name: 'finance-portfolio-mcp',
      version: '1.0.0',
      transport: { type: 'sse', port: 3100 },
    });

    this.mcpServer.tool('rebalance_wallet', 'Rebalancea una cartera automáticamente', async ({ walletId, dryRun }) => {
      return this.orchestrator.sendCommand('rebalancing-agent', 'autoRebalance', { walletId, dryRun });
    });

    this.mcpServer.tool('get_sentiment', 'Obtiene sentimiento de mercado', async ({ symbols }) => {
      return this.orchestrator.sendCommand('market-analyzer', 'getMarketSentiment', { symbols });
    });

    this.mcpServer.tool('execute_trade', 'Ejecuta una orden de compra/venta', async (params) => {
      return this.orchestrator.sendCommand('trade-executor', 'executeOrder', params);
    });

    await this.mcpServer.start();
  }
}
```

### 5. Agente Codificador (Opcional) para Auto-mejora

```typescript
// backend/src/agents/coding-assistant.agent.ts
import { CodingAgent } from '@backendkit-labs/agent-coding';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CodingAssistantAgent extends CodingAgent {
  name = 'coding-assistant';

  async improveRebalancingStrategy(historicalTrades: any[]) {
    const prompt = `Analiza estos trades y sugiere una mejora a la lógica de rebalanceo:\n${JSON.stringify(historicalTrades)}`;
    const suggestedCode = await this.generateCode(prompt, { language: 'typescript', targetFile: 'rebalancing.agent.ts' });
    return { suggestedCode };
  }
}
```

## Funcionalidades Específicas del Sistema

### Backend (Además de Agentes)
1. **Módulo de Autenticación**: JWT con refresh token, roles (admin, user, viewer).
2. **Gestión de Carteras y Portafolios**:
   - Cada usuario tiene múltiples carteras. Cada cartera tiene múltiples portafolios.
   - CRUD completo, historial de cambios.
3. **Activos**:
   - Tabla de activos con símbolo, nombre, tipo (acción/cripto), precio actual, etc.
   - Actualización de precios en tiempo real vía WebSocket.
4. **Registro de Transacciones**:
   - Cada compra/venta (manual o automática) se registra con comisiones, timestamp, razón.
   - Uso de idempotencia (`@backendkit/idempotency`) para evitar duplicados.
5. **Notificaciones**:
   - Sistema de alertas: email, SMS (Twilio), webhook.
   - Condiciones: umbrales de precio, RSI, sentimiento de noticias.
   - Programación de tareas con `node-cron` o BullMQ.

### Frontend Administrativo
- **Dashboard**: Gráfico de rendimiento general, tabla de carteras con ROI, últimas alertas y operaciones.
- **Gestión de Carteras**: Crear/editar carteras y portafolios, asignar activos manualmente.
- **Panel de Rebalanceo**: Configurar asignaciones objetivo (sliders), ver desviaciones, simular y ejecutar.
- **Panel de Análisis**: Sentimiento de mercado, indicadores técnicos, reportes descargables (PDF/CSV).
- **Configuración MCP**: Lista de servidores MCP externos, prueba de conectividad.

### Servidor MCP Externo de Noticias

```typescript
// mcp-servers/news-research-mcp/src/index.ts
import { McpServer } from '@backendkit-labs/mcp-server';
import { CodingAgent } from '@backendkit-labs/agent-coding';
import axios from 'axios';

const server = new McpServer({ name: 'news-research', version: '1.0.0' });
const codingAgent = new CodingAgent();

server.tool('get_news_sentiment', 'Analiza sentimiento de noticias para un ticker', async ({ ticker }) => {
  const news = await axios.get(`https://newsapi.org/v2/everything?q=${ticker}&apiKey=${process.env.NEWS_API_KEY}`);
  const analysis = await codingAgent.analyze(news.data.articles.map(a => a.title + ' ' + a.description).join('\n'), {
    task: 'sentiment_analysis',
    outputFormat: 'json'
  });
  return { sentiment: analysis, articles: news.data.articles.slice(0, 5) };
});

server.start({ transport: 'stdio' });
```

## Requisitos de Resiliencia y Observabilidad

- **Circuit Breaker** para todas las llamadas a APIs externas y servidores MCP.
- **Retry con backoff exponencial** para operaciones de rebalanceo y obtención de precios.
- **Rate Limiting** por usuario y por endpoint.
- **Bulkhead** para limitar concurrencia en el motor de agentes.
- **Logger estructurado** con `@backendkit/logger` y correlación de IDs.
- **Métricas** (Prometheus) y endpoints de health check.

## Criterios de Aceptación

1. El sistema debe poder manejar **20 agentes simultáneos** sin degradación de rendimiento.
2. **Tolerancia a fallos**: Si un agente falla, el motor debe reiniciarlo automáticamente.
3. **Pruebas**: Cobertura >70% en lógica de agentes y módulos críticos.
4. **Seguridad**: Todas las claves de API externas en variables de entorno.
5. **Despliegue**: `docker-compose up -d` debe levantar backend, frontend, PostgreSQL, Redis, y el servidor MCP de noticias.

## Entregables Esperados

1. **Código fuente completo** organizado en mono-repo (turborepo o npm workspaces).
2. **README.md** con instrucciones detalladas de instalación, configuración y ejecución.
3. **Archivo `docker-compose.yml`** con todos los servicios.
4. **Colección de Postman** para probar endpoints.
5. **Documentación de agentes**: qué herramientas expone cada agente y cómo invocarlas (vía MCP o API REST).

## Referencias Útiles

- Documentación de `@backendkit-labs/agent-core`: https://backendkit.dev/agent-core
- Ejemplo de `@backendkit-labs/agent-coding`: https://backendkit.dev/agent-coding
- `@backendkit-labs/mcp-server` en npm: https://www.npmjs.com/package/@backendkit-labs/mcp-server
- Model Context Protocol oficial: https://modelcontextprotocol.io

## Nota Importante

El agente de codificación debe priorizar el uso de **agent-core** para la lógica de negocio. No implementes máquinas de estado o workflows manuales; todo debe ser delegado a agentes conversacionales o reactivos. Usa `agent-coding` solo para la parte de auto-mejora si el tiempo lo permite; no es obligatorio para la versión inicial. El servidor MCP de noticias es obligatorio y debe ser un servicio separado que se comunique con el backend vía stdio o SSE.
