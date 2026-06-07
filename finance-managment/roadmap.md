# Roadmap — Finance Portfolio Management System

> **Status**: Active  
> **Last Updated**: 2026-06-06  
> **Current Phase**: Phase 1 (Foundation)

---

## Phase 1: Foundation (Weeks 1-3)
**Objective**: Establish project scaffolding, database schema, authentication, and core agent engine.

### Deliverables
- [ ] Monorepo setup with npm workspaces
- [ ] NestJS backend scaffold with TypeORM + PostgreSQL
- [ ] Database schema (all entities with migrations)
- [ ] Auth module (register, login, refresh, logout, JWT rotation)
- [ ] Users module (CRUD, role management)
- [ ] Agent engine setup with @backendkit-labs/agent-core
- [ ] Basic agent orchestration service
- [ ] Docker Compose for local development (backend + PostgreSQL + Redis)
- [ ] **Test infrastructure**:
  - [ ] Test database configuration (separate PostgreSQL instance via Docker Compose test profile)
  - [ ] Test data factories for all entities (using typeorm-factory or custom builders)
  - [ ] Agent test harness setup (@backendkit-labs/agent-core test utilities)
  - [ ] GitHub Actions workflow for `npm test` on every PR
  - [ ] Jest configuration with coverage thresholds
- [ ] CI/CD pipeline (GitHub Actions: lint, test, build)
- [ ] README with setup instructions

### Definition of Done
- [ ] All entities created with TypeORM decorators
- [ ] Auth endpoints working with Postman collection
- [ ] Agent engine starts and registers placeholder agents
- [ ] `docker-compose up` starts all services
- [ ] Test database spins up with `docker-compose --profile test up`
- [ ] Test data factories generate valid entities for all 9 entities
- [ ] Agent test harness validates agent registration and tool discovery
- [ ] GitHub Actions runs `npm test` on every PR with coverage reporting
- [ ] Test coverage >60% on auth and users modules
- [ ] npm audit passes with 0 critical vulnerabilities

### Estimated Effort: 3 weeks / ~120 hours

---

## Phase 2: Core Business Logic (Weeks 4-6)
**Objective**: Implement wallet, portfolio, asset management, and transaction recording.

### Deliverables
- [ ] Wallets module (CRUD with ownership enforcement)
- [ ] Portfolios module (CRUD with target allocations)
- [ ] Assets module (catalog with price tracking)
- [ ] Holdings management (add/remove assets to portfolios)
- [ ] Transactions module (manual buy/sell recording)
- [ ] Idempotency middleware for trade endpoints
- [ ] WebSocket gateway for real-time price updates
- [ ] React frontend scaffold with MUI
- [ ] Dashboard page (wallet overview, portfolio summary)

### Definition of Done
- [ ] Full CRUD for wallets, portfolios, assets, transactions
- [ ] Ownership checks on all endpoints
- [ ] Idempotency prevents duplicate trades
- [ ] WebSocket pushes price updates every 5 seconds
- [ ] Frontend displays wallet list and portfolio details
- [ ] Test coverage >70% on business modules

### Estimated Effort: 3 weeks / ~120 hours

---

## Phase 3: Agent Implementation (Weeks 7-9)
**Objective**: Implement all five agents with full tool definitions and orchestration.

### Deliverables
- [ ] PortfolioManagerAgent (portfolio health, optimization suggestions, **news impact evaluation**, **smart money impact evaluation**)
- [ ] RebalancingAgent (deviation calculation, order generation, auto-rebalance, **news-adjusted rebalance**, **smart-money-adjusted rebalance**)
- [ ] MarketAnalyzerAgent (technical indicators, sentiment analysis, **news reliability evaluation**)
- [ ] TradeExecutorAgent (order execution, batch orders, idempotency)
- [ ] NewsResearchAgent (MCP client for external news server)
- [ ] **SmartMoneyTrackerAgent** (13F filings, Form 4 insider trades, whale transactions)
- [ ] **Smart Money MCP Server** (SEC EDGAR parsing, Whale Alert integration)
- [ ] **Smart money signal generation** (conviction scoring, co-investment detection)
- [ ] **Tracked investors** (10 default investors: ARK, Berkshire, Bridgewater, etc.)
- [ ] **Signal Fusion Engine** (normalize → weight → detect conflict → weighted score → action)
- [ ] **Investor profiles** (value, growth, crypto, conservative with configurable weights)
- [ ] **Conflict resolution** (weighted comparison, co-investment priority, CONFLICT_HOLD)
- [ ] **Unified evaluateAsset tool** (fuses news + smart money + technical for one symbol)
- [ ] **Unified evaluatePortfolio tool** (evaluates all holdings with fusion)
- [ ] **News evaluation pipeline**: source weighting, recency decay, confidence scoring
- [ ] **Recommendation engine**: decision matrix (sentiment × allocation → action)
- [ ] **News evaluations persistence** (`news_evaluations` table)
- [ ] **Smart money signals persistence** (`smart_money_signals`, `tracked_investors` tables)
- [ ] **Fused signals persistence** (`fused_signals` table with contributions, conflict, rationale)
- [ ] Agent orchestrator with Redis transport (production-ready)
- [ ] Agent error recovery and automatic restart
- [ ] Agent monitoring dashboard (status, queue depth, error rates)
- [ ] Rebalance API endpoint (manual trigger + dry run)

### Definition of Done
- [ ] All 5 agents registered and communicating via agent-core
- [ ] Rebalancing agent calculates orders correctly (tested with sample data)
- [ ] MarketAnalyzer connects to external MCP for sentiment
- [ ] News evaluation pipeline: source weighting, recency decay, confidence scoring
- [ ] PortfolioManager generates recommendations from news signals
- [ ] RebalancingAgent incorporates news signals into rebalance calculations
- [ ] SmartMoneyTrackerAgent fetches and parses 13F filings correctly
- [ ] Smart money signals generated with conviction scoring
- [ ] Co-investment clusters detected across tracked investors
- [ ] Signal Fusion Engine normalizes and fuses all signal types correctly
- [ ] Conflict detection identifies contradictory signals across sources
- [ ] Conflict resolution produces correct action (CONFLICT_HOLD, priority-based)
- [ ] Investor profiles adjust weights and produce different recommendations
- [ ] evaluateAsset returns fused signal with contributions and rationale
- [ ] evaluatePortfolio returns complete report with rebalance suggestions
- [ ] Smart money API endpoints return correct data
- [ ] TradeExecutor executes orders with idempotency
- [ ] Agent recovery works (kill agent → auto-restart)
- [ ] Test coverage >70% on agent logic
- [ ] 20 concurrent agents without degradation (load test)

### Estimated Effort: 3 weeks / ~120 hours

---

## Phase 4: MCP Gateway & External Integration (Weeks 10-11)
**Objective**: Expose agents as MCP tools and build the external news research MCP server.

### Deliverables
- [ ] MCP Gateway (@backendkit-labs/mcp-server) exposing agent tools
- [ ] SSE transport on port 3100
- [ ] News Research MCP server (separate service, stdio transport)
- [ ] NewsAPI integration with circuit breaker + retry
- [ ] Sentiment analysis via CodingAgent
- [ ] MCP tool documentation (auto-generated)
- [ ] External tool testing (Postman MCP client, curl)

### Definition of Done
- [ ] MCP Gateway exposes 5+ tools (rebalance, sentiment, trade, analysis, overview)
- [ ] News Research MCP server returns sentiment for any ticker
- [ ] Circuit breaker triggers on NewsAPI failure
- [ ] External MCP client can call all tools
- [ ] Test coverage >60% on MCP gateway

### Estimated Effort: 2 weeks / ~80 hours

---

## Phase 5: Risk Management & Tax Optimization (Weeks 12-13)
**Objective**: Implement risk rules, tax loss harvesting, and portfolio optimization.

### Deliverables
- [ ] Risk Manager module (configurable rules: max allocation, stop-loss, VaR, drawdown)
- [ ] Risk rules enforced as hard constraints on RebalancingAgent
- [ ] Automatic stop-loss monitoring (cron every hour)
- [ ] Tax Loss Harvesting service (cost basis tracking, wash-sale rule)
- [ ] Tax harvest opportunity detection integrated with Signal Fusion Engine
- [ ] Portfolio Optimizer (Modern Portfolio Theory, efficient frontier)
- [ ] Correlation matrix calculation between held assets
- [ ] Max Sharpe and Min Volatility portfolio suggestions
- [ ] Risk/optimization API endpoints
- [ ] Frontend risk configuration panel

### Definition of Done
- [ ] Risk rules prevent trades that violate constraints
- [ ] Stop-loss triggers automatic sell order
- [ ] Tax harvest opportunities detected and prioritized correctly
- [ ] Wash-sale rule respected (30-day cooldown)
- [ ] Efficient frontier calculated for any portfolio with 3+ assets
- [ ] Correlation matrix matches expected values (±0.05)
- [ ] Test coverage >70% on risk and tax modules

### Estimated Effort: 2 weeks / ~80 hours

---

## Phase 6: Backtesting & Performance Attribution (Weeks 14-15)
**Objective**: Enable historical validation of strategies and performance decomposition.

### Deliverables
- [ ] Backtesting Engine (simulates trades from historical signals)
- [ ] Strategy selection (follow agent X, follow fusion signals, custom)
- [ ] Benchmark comparison (S&P 500, BTC, custom)
- [ ] Backtest metrics: Sharpe ratio, max drawdown, win rate, alpha, beta
- [ ] Performance Attribution service (market vs allocation vs selection vs timing)
- [ ] Agent-level performance tracking (accuracy, return when followed/ignored)
- [ ] Backtesting API endpoints
- [ ] Performance reports API
- [ ] Frontend backtesting dashboard
- [ ] Frontend performance attribution charts

### Definition of Done
- [ ] Backtest over 1 year of historical signals completes in <30 seconds
- [ ] Backtest results match manual calculation (±0.5%)
- [ ] Performance attribution decomposes return correctly (sum of parts = total)
- [ ] Agent accuracy metrics match expected values
- [ ] Test coverage >70% on backtesting and attribution modules

### Estimated Effort: 2 weeks / ~80 hours

---

## Phase 8: Alerts & Notifications (Weeks 18-19)
**Objective**: Implement alert system with condition evaluation and multi-channel notifications.

### Deliverables
- [ ] Alerts module (CRUD with conditions and actions)
- [ ] Alert evaluation engine (periodic check by MarketAnalyzerAgent)
- [ ] Email notifications (Nodemailer / SendGrid)
- [ ] Webhook notifications
- [ ] Automatic trade execution from alerts
- [ ] Alert history and audit log
- [ ] Frontend alert management page
- [ ] Notification preferences per user

### Definition of Done
- [ ] Alerts trigger correctly based on conditions
- [ ] Email notifications sent within 1 minute of trigger
- [ ] Webhook delivers payload to configured URL
- [ ] Auto-trade executes with idempotency
- [ ] Test coverage >70% on alerts module

### Estimated Effort: 2 weeks / ~80 hours

---

## Phase 9: Frontend Complete (Weeks 20-21)
**Objective**: Complete all frontend pages with full agent interaction.

### Deliverables
- [ ] Wallet management page (create/edit/delete, portfolio tree)
- [ ] Portfolio detail page (holdings table, allocation pie chart)
- [ ] Rebalance panel (target allocation sliders, deviation visualization, simulate/execute)
- [ ] Analysis dashboard (sentiment gauge, technical indicators, performance charts)
- [ ] Transaction history (filterable, exportable to CSV)
- [ ] Alert management page (create/edit, condition builder UI)
- [ ] MCP configuration page (server list, connectivity test)
- [ ] User settings (profile, notification preferences, API keys)

### Definition of Done
- [ ] All pages responsive and functional
- [ ] Rebalance panel shows real-time deviation visualization
- [ ] Charts update with WebSocket data
- [ ] CSV export works for transactions
- [ ] E2E tests for critical paths (login, wallet CRUD, rebalance)

### Estimated Effort: 2 weeks / ~80 hours

---

## Phase 10: Hardening & Production (Weeks 22-23)
**Objective**: Security audit, performance optimization, documentation, and production deployment.

### Deliverables
- [ ] Security audit (OWASP Top 10, penetration testing)
- [ ] Performance load testing (k6 / Artillery)
- [ ] Production Docker Compose (with reverse proxy, SSL)
- [ ] Monitoring setup (Prometheus + Grafana)
- [ ] Log aggregation (ELK or similar)
- [ ] Backup strategy (PostgreSQL WAL, Redis RDB)
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Agent documentation (tools, invocation, MCP interface)
- [ ] Postman collection for all endpoints
- [ ] Deployment runbook

### Definition of Done
- [ ] OWASP Top 10: 0 critical findings
- [ ] Load test: 100 concurrent users, p95 < 500ms
- [ ] All services start with `docker-compose up -d`
- [ ] Monitoring dashboards show agent health, API latency, error rates
- [ ] Backup restores successfully in test environment
- [ ] Documentation covers setup, configuration, and troubleshooting

### Estimated Effort: 2 weeks / ~80 hours

---

## Summary

| Phase | Duration | Hours | Key Milestone |
|-------|----------|-------|---------------|
| 1. Foundation | 3 weeks | 120 | Auth + agent engine working |
| 2. Core Business | 3 weeks | 120 | Full CRUD + frontend scaffold |
| 3. Agents | 3 weeks | 120 | All 6 agents + Signal Fusion Engine |
| 4. MCP Gateway | 2 weeks | 80 | External MCP integration |
| 5. Risk & Tax | 2 weeks | 80 | Risk rules + Tax Loss Harvesting |
| 6. Backtesting & Attribution | 2 weeks | 80 | Strategy validation + performance decomposition |
| 7. Alerts | 2 weeks | 80 | Multi-channel notifications |
| 8. Frontend | 2 weeks | 80 | Complete UI |
| 9. Hardening | 2 weeks | 80 | Production-ready |
| **Total** | **23 weeks** | **920** | |

---

## Current Status

```
Phase 1: ████████░░░░░░░░░░░░  40%  (In Progress)
Phase 2: ████████░░░░░░░░░░░░  40%  (In Progress — prompt.md provides full spec)
Phase 3: ░░░░░░░░░░░░░░░░░░░░   0%
Phase 4: ░░░░░░░░░░░░░░░░░░░░   0%
Phase 5: ░░░░░░░░░░░░░░░░░░░░   0%
Phase 6: ░░░░░░░░░░░░░░░░░░░░   0%
Phase 7: ░░░░░░░░░░░░░░░░░░░░   0%
Phase 8: ░░░░░░░░░░░░░░░░░░░░   0%
Phase 9: ░░░░░░░░░░░░░░░░░░░░   0%
Phase 10: ░░░░░░░░░░░░░░░░░░░░   0%
```

> **Note**: The project prompt (`prompt.md`) already contains detailed specifications for all phases. The initial implementation can proceed with Phase 1 (scaffolding) and Phase 2 (core business logic) in parallel since the data models and API contracts are fully defined.
