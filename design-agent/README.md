# design-agent

Plugin MCP para **spec-driven development** — diseño iterativo por documentos y ejecución por fases con ciclo SPEC → IMPLEMENT → VERIFY.

Se integra con **bk-agent** a través de comandos `/spec.*` que seleccionan automáticamente el agente especializado correcto para cada tarea.

---

## Instalación

```bash
cd design-agent
npm install
npm run build
```

### Configurar en bk-agent

Agregar el servidor en `~/.bk-agent/config.json`:

```json
{
  "mcpServers": [
    {
      "name": "design",
      "command": "node",
      "args": ["/ruta/absoluta/design-agent/dist/server.js"]
    }
  ]
}
```

---

## Flujo sin design-agent — solo diseño iterativo

Los comandos de diseño funcionan sin el plugin. El agente escribe los archivos directamente al disco del proyecto.

```
/spec.prompt "App Todo: NestJS + React, tasks con status y fecha de vencimiento"
  → escribe prompt.md en el directorio activo

/spec.specify
  → Architect lee prompt.md
  → genera specification.md (requisitos, contratos de API, modelos de datos)
  → escribe el archivo directo al disco

/spec.show.specify           → muestra specification.md sin LLM
/spec.revise.specify "…"     → Architect edita specification.md

/spec.plan
  → Architect lee specification.md + prompt.md
  → genera design.md (arquitectura C4 L1, stack, componentes, trade-offs)
  → escribe el archivo directo al disco

/spec.show.plan              → muestra design.md sin LLM
/spec.revise.plan "…"        → Architect edita design.md

AGENT.md                     → el desarrollador lo escribe a mano
                               describe qué hace cada subproyecto
```

**Comandos no disponibles sin plugin:** `/spec.init`, `/spec.next`, `/spec.run`, `/spec.advance`, `/spec.qa`, `/spec.show.roadmap`

---

## Flujo con design-agent — diseño + ejecución por fases

### Fase de diseño (igual que sin plugin)

```
/spec.prompt "App Todo: NestJS + React, tasks con status y fecha de vencimiento"

/spec.specify        → Architect genera specification.md
/spec.show.specify   → revisa sin LLM
/spec.revise.specify "agrega exportación a CSV"   → Architect edita

/spec.plan           → Architect genera design.md
/spec.show.plan      → revisa sin LLM
/spec.revise.plan "usa Redis para cache"          → Architect edita

AGENT.md             → el desarrollador escribe uno por subproyecto
```

*Iterar con `/spec.revise.*` hasta que el diseño satisfaga al desarrollador.*

### Inicializar roadmap

```
/spec.init
  → Architect lee specification.md + design.md + AGENT.md de subdirectorios
  → deriva las fases de desarrollo (nombre, descripción, criterios verificables)
  → llama design_init → crea design.json en ~/.bk-agent/projects/{key}/
  → muestra el roadmap creado

/spec.show.roadmap       → vista macro de todas las fases (✓ ◉ ○)
/spec.show.roadmap 2     → detalle de la fase 2: descripción y criterios
```

### Ciclo de ejecución por fase

Cada fase pasa por tres etapas en orden: **SPEC → IMPLEMENT → VERIFY**

```
── SPEC ────────────────────────────────────────────────

/spec.next
  → General llama design_next
  → muestra qué debe hacerse en la etapa actual

/spec.run
  → Architect lee design_next + specification.md + design.md
  → escribe spec-phase{N}.md con interfaces, contratos y criterios de la fase

/spec.advance
  → avanza SPEC → IMPLEMENT

── IMPLEMENT ───────────────────────────────────────────

/spec.next
  → General muestra instrucciones de IMPLEMENT
  → si hubo un fallo anterior, inyecta qa-phase{N}.md como contexto

/spec.run
  → General lee design_next + spec-phase{N}.md
  → identifica qué agentes necesita según el contexto de la fase:
      backend (NestJS, servicios, DB)  → delega a Backend Dev
      frontend (React, componentes)    → delega a Frontend Dev
      ambos                            → delegan en paralelo
  → cada especialista implementa su parte y reporta al General

/spec.advance
  → avanza IMPLEMENT → VERIFY
  → QA corre automáticamente al entrar a VERIFY

── VERIFY ──────────────────────────────────────────────

QA Engineer evalúa la fase automáticamente:
  → lee los archivos generados + criterios de la fase
  → guarda hallazgos en qa-phase{N}.md
  → muestra veredicto GO / NO-GO

/spec.advance --passed "tests: 24/24, cobertura 85%"
  → fase completa ✓ → avanza a la siguiente fase

/spec.advance --failed "F1: falta validación en endpoint DELETE"
  → revierte a IMPLEMENT
  → próximo /spec.next inyecta qa-phase{N}.md como contexto

── REPITE HASTA COMPLETAR TODAS LAS FASES ─────────────

/spec.show.roadmap   → muestra progreso: ✓ fases completas, ◉ en curso, ○ pendientes
```

---

## Diferencia entre los dos flujos

| | Sin plugin | Con plugin |
|---|---|---|
| `prompt.md`, `specification.md`, `design.md` | ✓ escritos directo | ✓ escritos directo |
| `/spec.show.*`, `/spec.revise.*` | ✓ | ✓ |
| Estado persistente entre sesiones | ✗ | ✓ `design.json` |
| Ciclo SPEC → IMPLEMENT → VERIFY enforced | ✗ | ✓ |
| Orquestación multi-agente (`/spec.run`) | ✗ | ✓ |
| QA automático con hallazgos persistidos | ✗ | ✓ `qa-phase{N}.md` |
| Vista de roadmap con progreso | ✗ | ✓ |

---

## Referencia de agente automático

| Comando | Agente activado | Razón |
|---|---|---|
| `/spec.specify` | Architect `◉` | Diseño sistémico de la especificación |
| `/spec.plan` | Architect `◉` | Arquitectura es su dominio |
| `/spec.init` | Architect `◉` | Deriva fases del diseño |
| `/spec.revise.*` | Architect `◉` | Itera sobre los mismos documentos |
| `/spec.next` | General `◆` | Orquestador — lee `design_next` y presenta |
| `/spec.run` (SPEC) | Architect `◉` | Escribe `spec-phase{N}.md` |
| `/spec.run` (IMPLEMENT) | General `◆` → especialistas | Delega a Backend/Frontend Dev según contexto |
| `/spec.qa` | QA Engineer `✓` | Evaluación manual sin avanzar |
| `/spec.advance` | *(sin cambio)* | Solo registra progreso en `design.json` |
| `/spec.show.*` | *(sin agente)* | Lee archivos directamente, sin LLM |

---

## Archivos generados

```
{proyecto}/
  prompt.md             ← /spec.prompt
  specification.md      ← /spec.specify
  design.md             ← /spec.plan
  spec-phase{N}.md      ← /spec.run (etapa SPEC)
  qa-phase{N}.md        ← auto al entrar VERIFY, o /spec.qa manual
  AGENT.md              ← el desarrollador lo escribe a mano

~/.bk-agent/projects/{key}/
  design.json           ← estado de ejecución (fases, etapa actual, log)
```

---

## Comandos de información

```
/spec.context       → todos los documentos del proyecto + estado de ejecución
/spec.overview      → estado spec-driven de todos los proyectos conocidos
/spec.show.roadmap  → vista macro de fases (✓ ◉ ○)
/spec.show.roadmap 3 → detalle de una fase específica
```

---

## MCP Tools (referencia interna)

Estos tools los usa el LLM directamente — los comandos `/spec.*` los invocan mediante instrucciones de prompt.

| Tool | Parámetros | Descripción |
|---|---|---|
| `design_save_prompt` | `cwd`, `content` | Guarda `prompt.md` |
| `design_save_docs` | `cwd`, `specification?`, `design?`, `agentMd?` | Guarda documentos de diseño |
| `design_read_context` | `cwd` | Lee todos los docs + estado de ejecución |
| `design_init` | `cwd`, `name`, `description`, `phases[]` | Crea roadmap |
| `design_status` | `cwd` | Estado actual del roadmap |
| `design_next` | `cwd` | Instrucciones de la etapa actual |
| `design_advance` | `cwd`, `notes`, `passed?`, `specPath?` | Avanza etapa |
| `design_edit` | `cwd`, `phase`, `description?`, `criteria?`, `stage?`, `status?` | Edita una fase manualmente |
| `design_overview` | `appName?` | Vista global de todos los proyectos |

### Máquina de estados de una fase

```
pending
  └─ in_progress
       ├─ stage: spec
       │    └─ design_advance(notes) → stage: implement
       ├─ stage: implement
       │    └─ design_advance(notes) → stage: verify → QA auto-trigger
       └─ stage: verify
            ├─ design_advance(notes, passed=true)  → status: complete → siguiente fase
            └─ design_advance(notes, passed=false) → stage: implement (con qa-phase{N}.md)
```

---

## Ejemplo de sesión completa (con plugin)

```
# 1. Semilla
/spec.prompt App Todo full-stack: NestJS + React, tasks con status y fecha de vencimiento

# 2. Especificación
/spec.specify
/spec.show.specify
/spec.revise.specify agrega endpoint de exportación a CSV

# 3. Arquitectura
/spec.plan
/spec.show.plan
/spec.revise.plan usa Redis para cache de queries frecuentes

# 4. Roadmap
/spec.init
/spec.show.roadmap

# 5. Ejecución — fase por fase
/spec.next           → SPEC: muestra qué especificar
/spec.run            → Architect escribe spec-phase1.md
/spec.advance        → avanza a IMPLEMENT

/spec.next           → IMPLEMENT: muestra qué implementar
/spec.run            → General delega: Backend Dev implementa API, Frontend Dev implementa UI
/spec.advance        → avanza a VERIFY → QA corre automático → guarda qa-phase1.md

                       VEREDICTO: GO
/spec.advance --passed "tests: 24/24, cobertura 85%"
  → fase 1 completa ✓

/spec.show.roadmap   → fase 1 ✓, fase 2 ◉
/spec.next           → comienza fase 2
```

### Si QA da NO-GO

```
/spec.advance        → VERIFY → QA evalúa → VEREDICTO: NO-GO

/spec.advance --failed "F1: falta validación en DELETE, F2: sin .gitignore"
  → revierte a IMPLEMENT

/spec.next           → inyecta qa-phase1.md como contexto automáticamente
/spec.run            → agentes corrigen exactamente lo que señaló QA
/spec.advance        → VERIFY → QA evalúa de nuevo
/spec.advance --passed "correcciones aplicadas, tests pasaron"
  → fase 1 completa ✓
```

---

## Resilencia sin plugin

Si el plugin no está activo en `config.json`, los comandos de ejecución (`/spec.init`, `/spec.next`, `/spec.run`, `/spec.advance`, `/spec.qa`, `/spec.show.roadmap`) muestran un aviso con instrucciones de configuración y no ejecutan.

Los comandos de diseño (`/spec.prompt`, `/spec.specify`, `/spec.plan`, `/spec.show.*`, `/spec.revise.*`) funcionan normalmente — el agente escribe los archivos directamente al disco del proyecto.
