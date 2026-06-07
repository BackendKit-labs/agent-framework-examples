# AGENT.md — Finance Portfolio Management System

## Commands
- Build: `npm run build` (root workspace)
- Test: `npm test` (root workspace)
- Dev: `npm run dev` (root workspace)
- Lint: `npm run lint` (root workspace)

## Stack
NestJS + TypeScript backend with multi-agent architecture using @backendkit-labs/agent-core, PostgreSQL + TypeORM, Redis for cache/queues, React 18 + MUI + Vite frontend (Feature-Sliced Design), Docker Compose for dev, MCP servers for external integrations.

## Architecture
- **Backend**: 3-zone Modular Monolith — agents/ (business logic), modules/ (CRUD + state), services/ (analytics, stateless)
- **Frontend**: Feature-Sliced Design (FSD) — pages/ (composition), features/ (domain modules), shared/ (base layer)
- **Agent Layer**: Autonomous agents (PortfolioManager, Rebalancing, MarketAnalyzer, TradeExecutor, NewsResearch, SmartMoneyTracker) orchestrated by @backendkit-labs/agent-core with in-memory/Redis transport
- **MCP Gateway Layer**: Exposes agent capabilities as MCP tools via @backendkit-labs/mcp-server (SSE transport on port 3100)
- **NestJS Modules Layer**: Traditional CRUD modules (auth, users, wallets, assets, transactions, notifications, smart-money, alerts) with TypeORM + PostgreSQL
- **Services Layer**: Stateless analytical services (signal-fusion, risk-manager, tax-harvest, backtesting, performance, portfolio-optimizer)
- **External MCP Servers**: Separate services (news-research-mcp, smart-money-mcp) communicating via stdio/SSE
- **Resilience Layer**: Circuit breaker, retry, bulkhead, rate limiter from @backendkit-labs

## Dependency Rules
- agents/ → modules/ (repositorios) and agents/ → services/ (análisis)
- modules/ → shared/ only
- services/ → shared/ only
- ❌ modules/ → agents/ (prohibido)
- ❌ services/ → modules/ (prohibido)

## Frontend Conventions
- **Feature-Sliced Design**: pages/ composes features/, features/ use shared/, shared/ is base layer
- **No cross-feature imports**: a feature never imports from another feature
- **React Query for server state**: all API calls go through useQuery/useMutation hooks
- **WebSocket via custom hook**: useWebSocket() in shared/hooks/, not scattered across components
- **Types contract**: shared/api/types/ mirrors backend DTOs — single source of truth
- **Vite build**: no CRA, no Next.js — pure SPA with React Router DOM
- **No Redux/Zustand**: React Query + Context + useState covers all state needs

## Backend Conventions
- Agents use `@Tool()` decorator from @backendkit-labs/agent-core for all exposed capabilities
- All external API calls wrapped with circuit breaker + retry
- Logger with correlation IDs for all agent operations
- Idempotency key on all trade executions
- DTO validation with class-validator on all REST endpoints
- Repository pattern via TypeORM for data access
- **Agent checkpointing**: Every multi-step agent operation checkpoints state in `agent_executions` table after each step
- **Saga pattern**: All agent write operations define compensating actions for rollback
- **Agent rate limiting**: TradeExecutor (10/min per wallet), Rebalancing (2/min per wallet), MarketAnalyzer (30/min)
- **Portfolio snapshots**: Daily cron captures `portfolio_snapshots` for historical performance
- **News pipeline**: NewsResearch MCP → MarketAnalyzer (evaluate) → PortfolioManager (recommend) → Rebalancing (execute)
- **News evaluation**: Source reliability weighted (traditional=0.9, official=0.85, blog=0.5, social=0.3) with 24h recency decay
- **Recommendation matrix**: Sentiment score × allocation → CONSIDER_INCREASE/REDUCE/EXIT/HOLD/MONITOR
- **News persistence**: All evaluations stored in `news_evaluations` table for audit trail and historical analysis
- **Smart Money pipeline**: SEC EDGAR + Whale Alert → SmartMoney MCP → SmartMoneyTrackerAgent → PortfolioManagerAgent → RebalancingAgent
- **Smart Money sources**: 13F filings (quarterly), Form 4 insider trades (daily), Whale Alert blockchain tx (real-time)
- **Tracked investors**: 10 default (ARK Invest, Berkshire Hathaway, Bridgewater, Renaissance, BlackRock, Vanguard, Third Point, Pershing Square, Scion Asset Management, Tiger Global)
- **Conviction scoring**: baseScore × recencyWeight × consistencyWeight × sourceWeight (0-1 scale)
- **Co-investment detection**: Clusters of 3+ investors moving same direction → WEAK/MODERATE/STRONG/VERY_STRONG
- **Signal Fusion Engine**: PortfolioManagerAgent fusiona news + smart money + technical en una señal única por activo
- **Fusion process**: Normalize → Weight (configurable) → Detect conflict → Weighted score → Map to action
- **Default weights**: Smart Money 13F (35%), News (30%), Form 4 (15%), Whale (10%), Technical (10%)
- **Investor profiles**: value_investor (50% 13F), growth_investor (35% news), crypto_trader (50% whale), conservative (45% 13F)
- **Conflict resolution**: Weighted comparison → co-investment priority → CONFLICT_HOLD if tied
- **Fused actions**: STRONG_BUY (>0.6), CAUTIOUS_BUY (>0.3), HOLD (-0.3 to 0.3), CAUTIOUS_SELL (<-0.3), STRONG_SELL (<-0.6), CONFLICT_HOLD (high conflict)
- **Fusion persistence**: All fused signals stored in `fused_signals` table with contributions, conflict info, and rationale
- **Tax Loss Harvesting**: Post-fusion filter — prioriza ventas con beneficio fiscal cuando las señales son similares. Respeta regla wash-sale (30 días)
- **Backtesting**: Usa señales históricas persistidas (news_evaluations, smart_money_signals, fused_signals) para simular estrategias. Métricas: Sharpe, drawdown, win rate, alpha, beta
- **Risk Management**: Hard constraints en RebalancingAgent — max 20% por activo, stop-loss -15%, max drawdown -25%, VaR 95% <5%, 5% cash reserve
- **Performance Attribution**: Descompone retorno en marketMovement, assetAllocation, securitySelection, tradingActivity, taxImpact. Mide precisión de cada agente
- **Modern Portfolio Theory**: Calcula frontera eficiente de Markowitz, matriz de correlación, portafolio de máximo Sharpe y mínima volatilidad

## Do NOT touch
- `node_modules/`, `dist/`, `.env` files
- External MCP server configurations (managed separately in mcp-servers/)
- Docker Compose production overrides
- Cross-zone dependency violations (modules/ importing from agents/ or services/ importing from modules/)

## Current phase
Phase 1: Foundation — project scaffolding, database schema, auth module, core agent engine setup

## Key documents
- design.md — architecture overview, tech stack, key decisions (C4 Level 1)
- specification.md — API contracts, data models, business logic
- security.md — threat model, auth design, OWASP checklist, security requirements
- roadmap.md — phased delivery plan with objectives and definitions of done
