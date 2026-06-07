# Finance Portfolio Management System

Sistema de gestión de carteras financieras con agentes inteligentes impulsados por DeepSeek AI.

## 🚀 Inicio Rápido

### Requisitos
- Node.js 20+
- Docker Desktop
- API Key de [DeepSeek](https://platform.deepseek.com/) (gratis, ~$0.14/1M tokens)

### Instalación

```bash
# 1. Clonar e instalar dependencias
npm install

# 2. Configurar variables de entorno
cp backend/.env.example backend/.env
# Editar backend/.env y agregar:
# DEEPSEEK_API_KEY=sk-tu-key-de-deepseek

# 3. Iniciar base de datos
docker compose up -d postgres redis

# 4. Ejecutar seed (crea usuario admin)
cd backend && npx ts-node src/database/seed.ts

# 5. Iniciar backend
cd backend && node dist/main.js

# 6. Iniciar frontend (otra terminal)
cd frontend-admin && npm run dev
```

### Credenciales
```
Email:    admin@finance.com
Password: Admin1234
```

---

## 🧭 Navegación

| Página | Ruta | Descripción |
|--------|------|-------------|
| **Dashboard** | `/` | Resumen general, precios en vivo, accesos rápidos |
| **Wallets** | `/wallets` | Crear y administrar carteras de inversión |
| **Wallet Detail** | `/wallets/:id` | Ver portafolios, agregar holdings, comprar/vender |
| **Signal Fusion** | `/fusion` | Señales de inversión combinadas de múltiples fuentes |
| **Smart Money** | `/smart-money` | Seguimiento de inversores institucionales |
| **Backtesting** | `/backtesting` | Simular estrategias con datos históricos reales |
| **Risk Management** | `/risk` | Configurar reglas de riesgo |
| **Performance** | `/performance` | Atribución de rendimiento del portafolio |

---

## 📊 Cómo Operar

### 1. Crear una Wallet
```
Wallets → "+ New Wallet" → Ingresar nombre → "Create"
```

### 2. Crear un Portafolio
```
Click en la wallet → "+ New Portfolio" → Nombre y estrategia → "Create"
```

### 3. Agregar Holdings (Comprar)
```
Click en "Add Holding" → Ingresar:
  - Symbol: AAPL, MSFT, BTC, etc.
  - Amount: Monto en dólares a invertir (ej: $500)
  - Price: Precio por unidad (se carga automático)
→ Click "Buy"
```

### 4. Analizar con Agentes IA
```
Signal Fusion → "Analyze" o
API: POST /api/v1/agents/analyze
  Body: { "request": "¿Debo comprar AAPL?" }
```

### 5. Generar Señales Smart Money
```
Smart Money → Ingresar símbolo → "Analyze"
```

### 6. Backtesting
```
Backtesting → Ingresar símbolo → Capital inicial → "Run Backtest"
```

---

## 🤖 Agentes Inteligentes

El sistema usa **DeepSeek V4 Flash** para análisis financiero con agentes especializados:

| Agente | Función |
|--------|---------|
| **Orchestrator** | Recibe preguntas y delega al especialista correcto |
| **Market Analyzer** | Analiza precios (Yahoo Finance) y noticias |
| **Smart Money Tracker** | Monitorea inversores institucionales |
| **Portfolio Manager** | Evalúa salud del portafolio y riesgo |

### Endpoint API
```bash
curl -X POST http://localhost:3000/api/v1/agents/analyze \
  -H "Content-Type: application/json" \
  -d '{"request":"¿Debo comprar AAPL?"}'
```

---

## 🐳 Servicios Docker

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| PostgreSQL | 5432 | Base de datos |
| Redis | 6379 | Cache y colas |
| Backend | 3000 | API REST |
| Frontend | 5173 | UI (Vite dev) |
| Swagger | 3000/api/docs | Documentación API |

---

## 🧪 Tests

```bash
cd backend && npm test
```

---

## 📁 Estructura del Proyecto

```
finance-portfolio-system/
├── backend/          → NestJS + TypeORM
│   ├── agents/       → Agentes IA (agent-core + DeepSeek)
│   ├── modules/      → CRUD tradicional (auth, wallets, etc.)
│   └── services/     → Lógica de negocio (fusion, risk, etc.)
├── frontend-admin/   → React + MUI + Vite
├── mcp-servers/      → Servidores MCP externos
└── scripts/          → Backup, restore, load testing
```

---

## 📄 Licencia

MIT © BackendKit Labs
