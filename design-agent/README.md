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

## Flujo completo de comandos

El flujo tiene dos fases bien separadas: **diseño** (antes de escribir código) y **ejecución** (por fases del roadmap).

### Fase de diseño

```
/spec.prompt App Todo full-stack: NestJS API + React frontend
```
Guarda la idea semilla en `prompt.md`. Debe ser corto — el detalle lo genera `specify`.

```
/spec.show.prompt
```
Muestra `prompt.md` sin coste de LLM. Revisa que la semilla esté bien.

```
/spec.revise.prompt agrega soporte multi-tenant por organización
```
Corrige o amplía `prompt.md` manteniendo el resto intacto.

---

```
/spec.specify
```
Activa **Architect** → lee `prompt.md` → genera `specification.md` con:
requisitos funcionales, contratos de API, modelos de datos, reglas de negocio y casos de uso.

```
/spec.show.specify
```
Muestra `specification.md` para revisión.

```
/spec.revise.specify agrega autenticación JWT con refresh tokens y rate limiting por IP
```
Aplica el cambio manteniendo todo lo que no se menciona. Muestra un diff resumido.

*Iterar hasta que la spec satisfaga al desarrollador.*

---

```
/spec.plan
```
Activa **Architect** → lee `specification.md` → genera `design.md` con:
arquitectura C4 L1, stack técnico y justificación, componentes principales,
flujo de datos, decisiones no obvias y trade-offs.

```
/spec.show.plan
```
Muestra `design.md` para revisión.

```
/spec.revise.plan cambia PostgreSQL por MongoDB, justifica el cambio
```
Actualiza `design.md`. Muestra diff.

*Iterar hasta que la arquitectura satisfaga al desarrollador.*

---

```
/spec.init
```
Activa **Architect** → lee `specification.md` + `design.md` → deriva las fases
del roadmap → crea `design.json` en `~/.bk-agent/projects/{key}/` y `ROADMAP.md` en el proyecto.

```
/spec.show.roadmap
```
Muestra todas las fases con progreso visual:

```
✓  Fase 1: Diseño y especificación
◉  Fase 2: Implementación Backend  (IMPLEMENT)
○  Fase 3: Implementación Frontend
○  Fase 4: Integración y tests
```

```
/spec.show.roadmap 2
```
Muestra el detalle completo de la fase 2: descripción, etapas y criterios de verificación.

---

### Fase de ejecución

Una vez que el roadmap está inicializado, cada fase pasa por tres etapas en orden:
**SPEC → IMPLEMENT → VERIFY**

```
/spec.next
```
Activa **General** (orquestador) → llama `design_next` → muestra las instrucciones
de la etapa actual. General delega al especialista correcto según la etapa:
- `SPEC` → delega a **Architect**
- `IMPLEMENT backend` → delega a **Backend Dev**
- `IMPLEMENT frontend` → delega a **Frontend Dev**
- `VERIFY` → delega a **QA Engineer**

El agente **muestra** las instrucciones y espera — no ejecuta hasta que el usuario lo pida.

```
/spec.advance implementé TaskService con CRUD completo
```
Avanza de etapa: SPEC → IMPLEMENT → VERIFY → siguiente fase.

```
/spec.advance tests pasaron, cobertura 82% --passed
/spec.advance 3 tests fallaron en el endpoint DELETE --failed
```
En etapa VERIFY, `--passed` completa la fase y avanza a la siguiente.
`--failed` revierte a IMPLEMENT para corregir.

---

### Ciclo de una fase

```
/spec.next          → SPEC: escribe spec-phase{N}.md con interfaces y contratos
/spec.advance       → avanza a IMPLEMENT
                    → el usuario implementa el código
/spec.advance       → avanza a VERIFY
                    → el usuario corre tests
/spec.advance --passed   → fase completa, avanza a la siguiente
/spec.next          → comienza la siguiente fase
```

---

### Comandos de información

```
/spec.context       → todos los documentos del proyecto + estado de ejecución
/spec.overview      → estado spec-driven de todos los proyectos conocidos
/spec.show.roadmap  → vista macro de fases (✓ ◉ ○)
/spec.show.roadmap 3 → detalle de una fase específica
```

---

## Referencia de agente automático

| Comando | Agente activado | Razón |
|---|---|---|
| `/spec.specify` | Architect `◉` | Diseño sistémico de la especificación |
| `/spec.plan` | Architect `◉` | Arquitectura es su dominio |
| `/spec.init` | Architect `◉` | Deriva fases del diseño |
| `/spec.revise.*` | Architect `◉` | Itera sobre los mismos documentos |
| `/spec.next` | General `◆` | Lee `design_next` y delega al especialista correcto |
| `/spec.advance` | *(sin cambio)* | Solo registra progreso |
| `/spec.show.*` | *(sin agente)* | Lee archivos directamente, sin LLM |

---

## Archivos generados

```
{proyecto}/
  prompt.md           ← /spec.prompt
  specification.md    ← /spec.specify
  design.md           ← /spec.plan
  ROADMAP.md          ← /spec.init
  AGENT.md            ← opcional, instrucciones del agente

~/.bk-agent/projects/{key}/
  design.json         ← estado de ejecución (fases, etapa actual, log)
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
       │    └─ design_advance(notes, specPath?) → stage: implement
       ├─ stage: implement
       │    └─ design_advance(notes) → stage: verify
       └─ stage: verify
            ├─ design_advance(notes, passed=true)  → status: complete → siguiente fase
            └─ design_advance(notes, passed=false) → status: blocked, stage: implement
```

---

## Ejemplo de sesión completa

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
/spec.next           → SPEC: escribe spec-phase1.md
/spec.advance path/to/spec-phase1.md

/spec.next           → IMPLEMENT: implementa el backend
# (el usuario pide al agente que implemente)
/spec.advance implementé TaskService + TaskController + migraciones

/spec.next           → VERIFY: corre los tests
# (el usuario pide al agente que corra los tests)
/spec.advance tests: 24/24, cobertura 85% --passed

/spec.show.roadmap   → fase 1 ✓, siguiente fase activa
/spec.next           → comienza fase 2
```

---

## Resilencia sin plugin

Si el plugin no está activo en `config.json`, todos los comandos `/spec.*` muestran un aviso con las instrucciones de configuración y no ejecutan. El agente sigue funcionando normalmente para chat y otros comandos — el flujo spec-driven simplemente no está disponible.
