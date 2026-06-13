# BackendKit Agent (bk-agent)

Agente de IA especializado en **desarrollo backend con Node.js y NestJS**, integrado con librerías **BackendKit Labs**. Sistema multi-agente con orquestación inteligente, spec-driven development, auto-aprendizaje, auditoría integrada y memoria persistente.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D20-green)
![License](https://img.shields.io/badge/license-MIT-brightgreen)

---

## 📋 Tabla de Contenidos

1. [Qué es bk-agent?](#qué-es-bk-agent)
2. [Instalación](#instalación)
3. [Inicio rápido](#inicio-rápido)
4. [Arquitectura del sistema](#arquitectura-del-sistema)
5. [Comandos CLI](#comandos-cli)
6. [Spec-Driven Development](#spec-driven-development)
7. [Gestión de Workspaces](#gestión-de-workspaces)
8. [Sistema de Skills](#sistema-de-skills)
9. [Agentes Especializados](#agentes-especializados)
10. [Plugins y BackendKit Integration](#plugins-y-backendkit-integration)
11. [Reflexión y Aprendizaje](#reflexión-y-aprendizaje)
12. [Memoria y Persistencia](#memoria-y-persistencia)
13. [Configuración Avanzada](#configuración-avanzada)

---

## Qué es bk-agent?

**bk-agent** es un asistente de codificación autónomo especializado en arquitectura backend Node.js/NestJS. No es un chat genérico: entiende tu proyecto real, ejecuta herramientas nativas (`read_file`, `write_file`, `execute_command`), orquesta **agentes especializados** y automatiza flujos completos de desarrollo con **Spec-Driven Development**.

### Capacidades clave

| Capacidad | Descripción |
|-----------|-------------|
| **Spec-Driven Development** | `/spec.*` - Ciclo completo: requisitos → especificación → diseño → implementación → QA → despliegue |
| **Múltiples Agentes** | General, Project Manager, Code Generator, QA Engineer, Architecture Reviewer, Performance Analyst |
| **Workspaces Multi-proyecto** | Gestionar monorepos con contexto independiente por proyecto |
| **Skills Dinámicos** | Extensiones YAML + Vault Obsidian para NestJS, TypeScript, patrones específicos |
| **QA Automático** | Evaluación automática de código con hallazgos y recomendaciones |
| **Reflection Engine** | Auto-aprendizaje: patrones de error → políticas automáticas |
| **Auditoría Integrada** | Reportes multi-gate con integridad SHA-256 y trazabilidad |
| **Memoria Persistente** | Contexto de proyecto que sobrevive entre sesiones |
| **Integración BackendKit Labs** | Soporte nativo para Result, Circuit Breaker, Bulkhead, HTTP Client, Observability, Pipeline, Request Scanner |

---

## 🚀 Instalación

### Requisitos

| Requisito | Versión mínima | Notas |
|-----------|---------------|-------|
| Node.js | 20+ | Requerido para ejecución |
| npm | 9+ | Gestor de paquetes |
| Git | 2.30+ | Control de versiones |
| API Key DeepSeek | - | Requerido (env: `DEEPSEEK_API_KEY`) |

### Via npm

```bash
npm install -g @backendkit-labs/agent
```

Crea los comandos:
```bash
bk-agent                # Comando principal
deepseek-code          # Alias alternativo
```

### Desde el repositorio

```bash
git clone <repo-url>
cd bk-agent
npm install
npm run build
npm link
```

### Verificar instalación

```bash
bk-agent --version
# -> 1.0.0
```

---

## 🎯 Inicio Rápido

### 1. Configurar API Key

```bash
# Windows PowerShell
$env:DEEPSEEK_API_KEY = "sk-..."

# Linux / macOS
export DEEPSEEK_API_KEY="sk-..."
```

### 2. Iniciar el agente

```bash
cd mi-proyecto
bk-agent
```

### 3. Primeros comandos

```
> /help                 # Ver todos los comandos
> /init                 # Analizar o inicializar proyecto
> /spec.prompt "descripción"  # Iniciar spec-driven flow
> /status               # Ver estado del sistema
> /context              # Ver contexto cargado
```

---

## 🏗️ Arquitectura del Sistema

### Componentes principales

```
┌──────────────────────────────────────────────────────────────────┐
│                   BackendKit Agent CLI v1.0.0                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Terminal         Intent/Routing       LLM Loop         Skills   │
│  ┌─────────┐      ┌────────────┐      ┌──────────┐    ┌────────┐│
│  │Terminal │─────→│Router      │─────→│Agent     │───→│Skill   ││
│  │Input    │      │Command Clf │      │Loop      │    │Engine  ││
│  └─────────┘      └────────────┘      └──────────┘    └────────┘│
│                          ↓                    ↓                    │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │              LLM Router (select agent + model)               ││
│  │    deepseek-chat (V3) ←→ deepseek-reasoner (R1)             ││
│  └──────────────────────────────────────────────────────────────┘│
│         ↓            ↓           ↓           ↓          ↓         │
│    Workspace   Agent Select  Tool Exec    Evaluation   QA Review  │
│                                                                   │
│  ┌────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐│
│  │Workspace   │ │Orchestr. │ │Reflection│ │Audit Reporter    ││
│  │Manager     │ │(FSM)     │ │Engine    │ │(multi-gate)      ││
│  └────────────┘ └──────────┘ └──────────┘ └──────────────────┘│
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │         Memory System (Project + Session Persistence)        ││
│  │  - Checkpoints   - Lessons Learned   - Audit Reports        ││
│  └──────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
       ↓                    ↓                        ↓
  ┌──────────┐      ┌──────────────┐      ┌──────────────────┐
  │Filesystem│      │DeepSeek API  │      │Obsidian Vault    │
  │(code)    │      │(V3 / R1)     │      │(patterns/skills) │
  └──────────┘      └──────────────┘      └──────────────────┘
```

### Flujo de ejecución

1. **Usuario** escribe mensaje o comando en terminal
2. **Intent Detector** → ¿es comando `/` o mensaje?
3. **Command Registry** → Si es comando, ejecutar directamente
4. **LLM Router** → Si es mensaje, ¿a qué agente? ¿qué modelo?
5. **Agent Selection** → Seleccionar agente + skills relevantes
6. **Tool Loop** → LLM genera respuesta + tool calls → ejecutar → iterar
7. **QA Review** → Si aplica, revisar automáticamente
8. **Output** → Mostrar respuesta formateada
9. **Reflection** → Capturar patrones, fallos, lecciones
10. **Persistence** → Guardar en memoria del proyecto

---

## 💬 Sistema de Comandos

### Ejecutar bk-agent

```bash
bk-agent [opciones]
```

**Opciones principales:**

| Opción | Default | Descripción |
|--------|---------|-------------|
| `-k, --api-key <key>` | `$DEEPSEEK_API_KEY` | API key de DeepSeek |
| `-m, --model <model>` | `deepseek-chat` | Modelo: deepseek-chat \| deepseek-reasoner |
| `-b, --base-url <url>` | API oficial | URL base alternativa |
| `--max-iterations <n>` | `100` | Límite de tool calls por turno |
| `--iteration-mode <mode>` | `step-by-step` | interactive \| auto \| step-by-step |
| `--command-timeout <s>` | sin límite | Timeout para run_command |
| `--no-stream` | - | Deshabilitar streaming |
| `--no-qa` | - | Desactivar QA automático |
| `--no-delegation` | - | Desactivar delegación a sub-agentes |
| `--headless` | - | Modo headless (JSON-Lines a stdout) |
| `-h, --help` | - | Mostrar ayuda |
| `-v, --version` | - | Mostrar versión |

### Comandos Slash (`/`) en sesión

#### Control básico

| Comando | Descripción |
|---------|-------------|
| `/help` | Muestra todos los comandos disponibles |
| `/clear` | Limpiar pantalla |
| `/reset-context` | Reinicia conversación (mantiene sistema) |

#### Contexto y estado

| Comando | Descripción |
|---------|-------------|
| `/context` | Ver contexto activo del proyecto |
| `/tokens` | Ver tokens de sesión actual |
| `/usage` | Ver tokens y costo de sub-agentes |
| `/status` | Panel completo de estado del sistema |
| `/memory` | Ver memoria persistente del proyecto |

#### Configuración

| Comando | Descripción |
|---------|-------------|
| `/agent [id]` | Listar agentes \| cambiar agente activo |
| `/models [id]` | Listar modelos \| cambiar modelo |
| `/iteration` | Ver/cambiar modo de iteración |
| `/skills` | Ver/instalar skills disponibles |

#### Gestión de proyectos

| Comando | Descripción |
|---------|-------------|
| `/switch [ws] [proj]` | Cambiar workspace/proyecto (picker TUI) |
| `/workspace [sub]` | Gestionar workspaces (create/add/remove/delete) |
| `/init` | Inicializar/analizar proyecto actual |

#### Checkpoints y persistencia

| Comando | Descripción |
|---------|-------------|
| `/checkpoint <nombre>` | Crear checkpoint de sesión |
| `/checkpoint list` | Listar checkpoints |
| `/checkpoint load <n>` | Cargar checkpoint |

#### Spec-Driven Development (ver [sección dedicada](#spec-driven-development))

| Comando | Descripción |
|---------|-------------|
| `/spec.prompt <desc>` | Guardar requisitos en prompt.md |
| `/spec.specify` | Generar specification.md |
| `/spec.plan` | Generar design.md |
| `/spec.init` | Crear roadmap de fases |
| `/spec.next` | Ver instrucciones de fase actual |
| `/spec.run` | Ejecutar generación de código |
| `/spec.qa` | Evaluación QA de fase |
| `/spec.advance [--passed\|--failed]` | Avanzar a siguiente fase |
| `/spec.go` | Ejecutar todas las fases autónomamente |
| `/spec.context` | Ver documentos de diseño |
| `/spec.overview` | Vista de proyectos con diseño activo |

#### Generación de prompts

| Comando | Descripción |
|---------|-------------|
| `/prompt new <frase>` | Generar prompt estructurado |

---

## 📋 Spec-Driven Development

El flujo `/spec` es el sistema principal para desarrollo dirigido por especificación. Automatiza el ciclo completo desde requisitos hasta despliegue.

### Fases del roadmap

```
1. SPECIFY
   ├─ /spec.prompt       → Guardar requisitos en prompt.md
   ├─ /spec.specify      → Generar specification.md
   ├─ /spec.plan         → Generar design.md
   └─ /spec.init         → Crear roadmap
   
2. IMPLEMENT (repetir para cada feature)
   ├─ /spec.next         → Ver instrucciones
   ├─ /spec.run          → Generar código
   └─ IMPLEMENTACIÓN COMPLETADA
   
3. VERIFY (QA)
   ├─ /spec.qa           → Evaluación de QA
   └─ Hallazgos guardados en qa-phase{N}.md
   
4. INTEGRATE
   └─ Integración con rama principal
   
5. DEPLOY
   └─ Despliegue a producción

[+] /spec.advance --passed   → Pasar a siguiente fase
    /spec.advance --failed   → Revenir a IMPLEMENT (QA inyecta hallazgos)
```

### Flujo detallado (paso a paso)

```bash
# FASE 1: Especificación
/spec.prompt "API REST para gestión de usuarios con JWT y roles"
# → Crea prompt.md

/spec.specify
# → Lee prompt.md → genera specification.md con requirements detallados

/spec.revise.specify "agregar soporte para OAuth2"
# → Actualizar specification.md

/spec.plan
# → Lee specification.md + prompt.md → genera design.md con arquitectura

/spec.init
# → Lee design.md → genera roadmap.md con fases

/spec.show.roadmap
# → Ver todas las fases
/spec.show.roadmap 1
# → Ver solo fase 1

# FASE 2-5: Ejecución
/spec.next
# → Muestra instrucciones de IMPLEMENT para fase 1

/spec.run
# → Orquesta especialistas, genera código, muestra progreso

/spec.qa
# → QA Engineer evalúa código
# → Guarda hallazgos en qa-phase1.md

/spec.advance --passed "Fase 1 completada exitosamente"
# → Avanza a fase 2 (SPECIFY si falta, IMPLEMENT si está lista)

# Si hay problemas:
/spec.advance --failed "Falta manejo de excepciones"
# → Revierte a IMPLEMENT
# → Próximo /spec.next inyecta hallazgos de QA

# Ejecución autónoma (todo en un comando)
/spec.go
# → Ejecuta todas las fases sin intervención hasta completar
```

### Documentos generados

```
proyecto/
├── prompt.md           # Requisitos iniciales del usuario
├── specification.md    # Especificación detallada (funcional + no-funcional)
├── design.md          # Arquitectura, componentes, flujos
├── roadmap.md         # Fases de implementación
├── qa-phase1.md       # Hallazgos QA de fase 1
├── qa-phase2.md       # Hallazgos QA de fase 2
└── src/               # Código generado
```

### Control de calidad integrado

```
/spec.run
    ↓
Agentes especializados generan código
    ↓
QA automático valida (si --no-qa no usado)
    ↓
/spec.qa (manual o automático)
    ↓
Hallazgos guardados
    ↓
/spec.advance
    ├─→ --passed   → siguiente fase
    └─→ --failed   → revierte, inyecta hallazgos
```

---

## 🤖 Agentes Especializados

bk-agent incluye múltiples agentes especializados que se activan automáticamente según el contexto.

### Agentes built-in

| ID | Nombre | Icono | Modelo | Triggers |
|----|----|:-----:|--------|----------|
| `general` | General Multipropósito | 🤖 | `deepseek-chat` | Default |
| `project-manager` | Project Manager | 📊 | `deepseek-chat` | project, init, setup, analysis |
| `code-generator` | Code Generator | 💻 | `deepseek-reasoner` | implement, generate, code, feature |
| `qa-engineer` | QA Engineer | 🧪 | `deepseek-chat` | test, qa, coverage, validate |
| `architecture-reviewer` | Architecture Reviewer | 🏛️ | `deepseek-reasoner` | architecture, design, adr, pattern |
| `performance-analyst` | Performance Analyst | 📈 | `deepseek-chat` | performance, optimize, benchmark |

### Cómo funciona el routing

1. **Detección de intención** - El mensaje se analiza para detectar palabras clave
2. **Selección de agente** - Se elige el agente con mayor coincidencia
3. **Cambio de modelo** - Si requiere `deepseek-reasoner`, cambia automáticamente
4. **Ejecución** - El agente ejecuta la tarea
5. **Retorno** - Vuelve a `general` después

```bash
# Ejemplos
"generar módulo NestJS"           → code-generator (deepseek-reasoner)
"diseñar arquitectura"             → architecture-reviewer (deepseek-reasoner)
"crear tests para UserService"     → qa-engineer (deepseek-chat)
"explicar el proyecto"             → project-manager (deepseek-chat)
```

### Cambiar agente activo

```bash
/agent                      # Listar disponibles
/agent code-generator       # Cambiar a code-generator
```

**En el header se muestra:** Nombre + icono del agente actual

### Agentes personalizados

Ubicación: `~/.deepseek-code/agents/[id].yaml`

**Formato:**
```yaml
id: "mi-agente"
name: "Mi Agente Personalizado"
icon: "⚡"
description: "Descripción de lo que hace"
triggers:
  - "palabra-clave-1"
  - "palabra-clave-2"
profile:
  model: "deepseek-reasoner"
  temperature: 0.7
  maxTokens: 8000
systemPrompt: |
  Instrucciones especializadas para el agente...
```

Los agentes personalizados se fusionan con los built-in. Usar el mismo `id` los reemplaza.

---

## 🎯 Sistema de Skills

Los **skills** son extensiones dinámicas que especialización capacidades del agente.

### Tipos de skills

#### 1. Skills YAML

Ubicación: `~/.deepseek-code/skills/*.yaml`

**Estructura:**
```yaml
name: "NestJS Module Generator"
version: "1.0.0"
description: "Genera módulos NestJS completos con decoradores"
triggers:
  - "nestjs"
  - "module"
  - "generate"
agents:
  - "code-generator"     # Agentes con este skill siempre activo
systemPromptAddition: |
  Cuando generes módulos NestJS:
  - Usa @Module(), @Injectable(), @Controller()
  - Implementa servicios con Result<T>
  - Agrega observabilidad desde el inicio
tools:
  - name: "generate_nestjs_module"
    description: "Genera módulo NestJS"
    handler: "nestjs.generateModule"
```

#### 2. Skills de Vault Obsidian

Ubicación: `Vault/04-Recursos/Skills/SKILL.md`

**Frontmatter:**
```yaml
---
name: "Circuit Breaker Pattern"
version: "1.0.0"
description: "Patrón Circuit Breaker con clasificación de errores"
tags:
  - "backend"
  - "resilience"
  - "nestjs"
---

# Circuit Breaker Pattern

Errores HTTP 4xx (excepto 429, 503) = negocio, NO abren circuito
Errores HTTP 5xx, timeouts = infraestructura, SÍ abren circuito

Implementación en BackendKit Labs...
```

### Activación automática

Los skills se activan cuando:
- El input contiene palabras clave de `triggers`
- El agente actual está en la lista de `agents`

### Gestionar skills

```bash
/skills                         # Listar skills activos
/skills install mi-skill        # Instalar desde vault
/skills --reload                # Recargar skills
```

### Handlers especializados

#### **NestJS Handler**
Auto-activo con code-generator. Genera:
- Módulos con decoradores
- Servicios tipados con Result
- Controllers con validación
- Middlewares y pipes
- Configuración de observabilidad

#### **TypeScript Handler**
Para tareas que requieren análisis de tipos:
- Validación de tipos
- Detección de breaking changes
- Refactoring de interfaces

#### **Builtin Handlers**
- File operations (`read_file`, `write_file`, `list_directory`)
- Git integration (`git_diff`, `git_log`)
- Command execution (`execute_command`)
- Search (`ripgrep_search`)

---

## 📁 Gestión de Workspaces

Un **workspace** contiene múltiples proyectos (monorepo).

### Comandos

```bash
/workspace create mi-workspace   # Crear nuevo workspace
/workspace add /ruta/proyecto    # Agregar proyecto existente
/workspace list                  # Listar workspaces
/workspace remove mi-workspace   # Remover workspace

/switch                          # Picker TUI interactivo
/switch ws-name proj-name        # Cambiar específico
```

### Estructura

```
mi-workspace/
├── proyecto-1/
│   ├── package.json
│   ├── specification.md
│   ├── design.md
│   └── src/
├── proyecto-2/
│   ├── package.json
│   └── src/
└── .bk-workspace/
    └── workspaces.yaml          # Metadatos del workspace
```

Cada proyecto tiene su propia memoria, contexto y checkpoints independientes.

---

## 🔄 Reflexión y Aprendizaje

El **Reflection Engine** aprende de fallos y patrones para mejorar automáticamente.

### Pipeline de reflexión

```
Incidente Detectado
    ↓
FailureCatalog (registro persistente)
    ↓
PatternDetector (>=3 ocurrencias del mismo tipo)
    ↓
PolicyPromoter (convertir patrón en policy)
    ↓
Orquestador (aplicar policy preventiva futura)
```

**Regla de oro:** Si un fallo ocurre 3 veces, no debe seguir siendo decisión del LLM - debe convertirse en policy automática.

### 5 Dominios de captura

| Dominio | Ejemplos de FailureTypes | Integración |
|---------|-------------------------|------------|
| **audit** | LINT_ERROR, TYPE_ERROR, LOGIC_ERROR | AuditReporter |
| **test** | TEST_FAIL, COVERAGE_LOW, TIMEOUT | Test Validation Gate |
| **commit** | COMMIT_HOOK_FAIL, MERGE_CONFLICT | Pre-commit hooks |
| **agent** | TOOL_FAIL, DELEGATION_FAIL | Orchestrator |
| **bootstrap** | CONFIG_ERROR, SETUP_FAIL | Project Initialization |

### Ejemplo de ciclo completo

```
1. Usuario ejecuta /spec.run
2. Code Generator genera código
3. QA Engine detecta: "missing_error_handling"
4. Incidente registrado en FailureCatalog
5. Esperar 2 más...
6. Ya hay 3 ocurrencias de "missing_error_handling"
7. PatternDetector identifica patrón
8. PolicyPromoter crea policy automática
9. Próximo /spec.run: Orquestador bloquea código sin error handling
```

### Información estadística

```bash
/status                         # Ver estadísticas de reflexión
# → Fallos detectados: 42
# → Patrones identificados: 5
# → Políticas promovidas: 3
# → Lecciones aprendidas: 8
```

---

## 💾 Memoria y Persistencia

El agente mantiene múltiples niveles de memoria para contexto y aprendizaje.

### Estructura de directorios

```
~/.deepseek-code/
├── projects/
│   └── [project-hash]/
│       ├── memory/
│       │   ├── memory.yaml          # Contexto persistente
│       │   ├── lessons.md           # Lecciones aprendidas
│       │   └── checkpoints/
│       │       ├── checkpoint-1.json
│       │       └── checkpoint-2.json
│       ├── audit-reports/
│       │   ├── phase-1.md
│       │   └── findings.yaml
│       └── reflection/
│           └── failures.json
├── agents/                          # Agentes personalizados
└── skills/                          # Skills instalados
```

### Tipos de memoria

#### 1. **Memory.yaml** (contexto del proyecto)
```yaml
projectName: "mi-proyecto"
stack: ["Node.js", "NestJS", "PostgreSQL"]
architecture: "Microservicios con Domain-Driven Design"
conventions:
  - "Usa Result<T> para errores de dominio"
  - "Observabilidad desde el inicio"
  - "Tests para lógica de negocio"
relatedProjects:
  - "api-gateway"
  - "auth-service"
keyFiles:
  - "src/domain/entities/"
  - "src/application/services/"
  - "src/infrastructure/repositories/"
```

#### 2. **Lessons.md** (lecciones aprendidas)
```markdown
# Lecciones Aprendidas

## Patrón: Error Handling
- Siempre usar Result<T, E> en dominio
- Mapear errores en application layer
- Loguear con context

## Antipatrón: Tight Coupling
- Evitar inyectar concretos
- Usar interfaces para abstracciones
- Casos de uso dentro de services
```

#### 3. **Checkpoints** (snapshots de sesión)
```bash
/checkpoint save mi-checkpoint      # Guardar
/checkpoint load mi-checkpoint      # Restaurar
/checkpoint list                    # Listar
```

### Cargar y visualizar memoria

```bash
/memory                             # Ver memoria del proyecto activo
/context                            # Ver contexto completo (incluye memoria)
```

**Información mostrada:**
- Nombre del proyecto
- Stack tecnológico
- Convenciones
- Archivos clave
- Últimas lecciones aprendidas
- Patrones detectados

---

## ⚙️ Configuración Avanzada

### Archivo de configuración global

**Ubicación:** `~/.deepseek-code/config.yaml`

```yaml
# Proveedor de IA por defecto
defaultProvider: "deepseek"

# Configuración de proveedores
providers:
  deepseek:
    apiKey: "${DEEPSEEK_API_KEY}"    # Puede usar variables de entorno
    model: "deepseek-chat"           # deepseek-chat o deepseek-reasoner
    baseUrl: "https://api.deepseek.com/v1"

# Agentes activos
agents:
  defaultAgentId: "general"

# Skills
skills:
  autoLoad: true
  vaultPath: "${OBSIDIAN_VAULT}"

# Contexto
context:
  maxTokensPerMessage: 8000
  contextWindow: 64000
  summarizeAfterTokens: 32000

# Control de calidad
qa:
  enabled: true
  autoReview: true

# Delegación
delegation:
  enabled: true
  maxDelegationDepth: 2

# Persistencia
memory:
  persistCheckpoints: true
  checkpointRetention: 10
  auditReports: true
```

### Opciones de línea de comandos

```bash
bk-agent [opciones]

Options:
  -k, --api-key <key>            API key de DeepSeek
  -m, --model <model>            deepseek-chat | deepseek-reasoner
  -b, --base-url <url>           URL base alternativa
  --max-iterations <n>           Límite de tool calls (default: 100)
  --iteration-mode <mode>        interactive | auto | step-by-step
  --command-timeout <s>          Timeout en segundos (0 = sin límite)
  --no-stream                    Deshabilitar streaming
  --no-qa                        Desactivar QA automático
  --no-delegation                Desactivar delegación
  --headless                     Modo headless (JSON-Lines)
  -h, --help                     Mostrar ayuda
  -v, --version                  Mostrar versión
```

### Modos de iteración

| Modo | Confirmación | Uso |
|------|:------------:|-----|
| **interactive** | Confirma cada tool call | Máximo control |
| **step-by-step** | Sin confirmación (default) | Balance entre automatización y control |
| **auto** | Sin confirmación, ejecuta todo | Máxima velocidad |

### Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `DEEPSEEK_API_KEY` | API key de DeepSeek (requerida) |
| `OBSIDIAN_VAULT` | Path a vault de Obsidian |
| `BK_ITERATION_MODE` | Modo de iteración por defecto |
| `BK_MAX_ITERATIONS` | Máximo de iteraciones |
| `BK_COMMAND_TIMEOUT` | Timeout en segundos |
| `BK_DEBUG` | Habilitar debug logging |
| `BK_LOG_LEVEL` | Nivel de logging (debug, info, warn, error) |

---

## 🔌 Plugins y BackendKit Integration

### BackendKit Labs Integration

El agente incluye soporte nativo para librerías BackendKit Labs:

#### **@backendkit-labs/result**
```typescript
// Error handling tipado sin throw
import { ok, err } from '@backendkit-labs/result';

const result = ok(value);        // ✓ Éxito
const result = err('NOT_FOUND'); // ✗ Error de dominio
```

#### **@backendkit-labs/circuit-breaker**
```typescript
// Clasificación automática de errores
// HTTP 4xx (excepto 429, 503) = negocio, NO abre circuito
// HTTP 5xx, timeouts = infraestructura, SÍ abre circuito
```

#### **@backendkit-labs/bulkhead**
```typescript
// Control de concurrencia - orden correcto
Bulkhead.execute(() =>
  CircuitBreaker.execute(() =>
    httpCall()
  )
)
```

#### **@backendkit-labs/http-client**
```typescript
// HTTP client con circuit breaker, retry, Result
const client = new HttpClient({ baseUrl: '...' });
const response = await client.get('/endpoint');
```

#### **@backendkit-labs/observability**
```typescript
// Logging y métricas para NestJS
// ObservabilityModule.forRoot() (primer import en AppModule)
// BkLogger.log('msg')
// CorrelationIdInterceptor + BkExceptionFilter en main.ts
```

#### **@backendkit-labs/pipeline**
```typescript
// Pipeline async type-safe
const result = await pipe([...operations])
  .withMode('stop-on-first' | 'collect-all')
  .execute();
```

### Crear plugins personalizados

**Estructura:**
```
mi-plugin/
├── manifest.yaml
├── handlers/
│   ├── command-handler.ts
│   └── tool-handler.ts
├── skills/
│   └── skill-1.yaml
└── README.md
```

**manifest.yaml:**
```yaml
id: "mi-plugin"
version: "1.0.0"
name: "Mi Plugin"
description: "Descripción"
dependencies:
  - "@backendkit-labs/agent-core": ">=0.22.0"
handlers:
  - type: "command"
    path: "./handlers/command-handler.ts"
skills:
  - "./skills/skill-1.yaml"
```

---

## 🛠️ Desarrollo y Contribución

### Build

```bash
npm run build                   # TypeScript → JavaScript
npm run build:bundle           # Bundle con esbuild
```

### Testing

```bash
npm test                        # Ejecutar tests
npm run test:watch             # Watch mode
npm run test:coverage          # Coverage report
```

### Linting

```bash
npm run lint                    # ESLint
```

### Scripts de desarrollo

```bash
npm run dev                     # Ejecutar con tsx (sin compilar)
npm run update-global           # Actualizar instalación global
```

---

## 📚 Estructura del Proyecto

```
bk-agent/
├── bin/
│   └── cli.ts                        # Entry point principal
├── src/
│   ├── agent/                        # Sistema de agentes
│   │   ├── routing/                  # LLM router y text scoring
│   │   ├── evaluation/               # Evaluación de código
│   │   ├── qa/                       # Sistema de QA
│   │   ├── commit/                   # Workflow de commits
│   │   ├── loop.ts                   # Bucle principal
│   │   └── ...
│   ├── context/                      # Gestión de contexto
│   │   ├── stages/                   # Etapas de procesamiento
│   │   ├── history.ts                # Historial
│   │   └── token-counter.ts          # Conteo de tokens
│   ├── orchestrator/                 # Orquestación
│   │   ├── fsm.ts                    # Máquina de estados
│   │   ├── policy-engine.ts          # Motor de políticas
│   │   ├── intent-detector.ts        # Detección de intención
│   │   ├── audit/                    # Sistema de auditoría
│   │   └── ...
│   ├── reflection/                   # Motor de reflexión
│   │   ├── domains/                  # Dominios de fallos
│   │   ├── hooks/                    # Hooks de eventos
│   │   ├── pattern-detector.ts
│   │   ├── reflection-engine.ts
│   │   └── ...
│   ├── skills/                       # Sistema de skills
│   │   ├── loader.ts                 # Cargador de skills
│   │   ├── handlers/                 # Handlers (NestJS, TypeScript)
│   │   └── builtin/                  # Skills integrados
│   ├── memory/                       # Persistencia
│   ├── ui/                           # Terminal y formateo
│   ├── tools/                        # Definiciones de herramientas
│   ├── types/                        # Tipos TypeScript
│   └── bootstrap/                    # Inicialización
├── docs/
│   ├── c4/                           # Diagramas C4
│   ├── adr/                          # Architecture Decision Records
│   └── auditorias/                   # Reportes de auditoría
├── package.json
├── tsconfig.json
└── README.md
```

---

## 📊 Métricas y Monitoreo

### Estadísticas de sesión

```bash
/tokens                         # Tokens de sesión actual
/usage                          # Tokens y costo de sub-agentes
/status                         # Panel completo del sistema
```

**Métricas incluidas:**
- Tokens entrada/salida
- Costo estimado en USD
- Tiempo de ejecución
- Iteraciones realizadas
- Llamadas a herramientas

### Spinner de progreso

El CLI incluye spinner animado que muestra:
- Modelo actual
- Tokens en tiempo real
- Costo estimado
- Tiempo transcurrido

---

## 🤝 Soporte y Recursos

### Documentación adicional

- **[C4 System Context](./docs/c4/system-context.md)** - Diagrama de contexto
- **[C4 Containers](./docs/c4/containers.md)** - Descomposición en contenedores
- **[ADRs](./docs/adr/)** - Decisiones arquitectónicas
- **[Auditorías](./docs/auditorias/)** - Reportes de auditoría

### Troubleshooting

**"API key required"**
```bash
# Solución: Configurar DEEPSEEK_API_KEY
export DEEPSEEK_API_KEY="tu-key"
bk-agent
```

**"Project not found"**
```bash
# Solución: Usar /init o /switch
/init
# o
/switch
```

**"Skill not loading"**
```bash
# Solución: Verificar triggers y formato YAML
/skills
# Editar ~/.deepseek-code/skills/*.yaml
```

**"Workspace error"**
```bash
# Solución: Ver estado
/status
/workspace list
```

---

## 📄 Licencia

MIT License - Vea [LICENSE](LICENSE) para detalles

---

**Última actualización:** Junio 2026  
**Versión del agente:** 1.0.0  
**Desarrollado por:** BackendKit Labs

---

## 📞 Contacto y Contribuciones

- **Issues:** Reporte bugs y solicite features
- **Discussions:** Pregunta por mejoras y diseño
- **Pull Requests:** Contribuciones son bienvenidas

Para más información sobre BackendKit Labs: https://github.com/backendkit-labs
