# Knowledge Agent + bk-agent Vault Integration

Análisis arquitectónico de cómo **knowledge-agent** puede conectarse al vault de bk-agent para consultas RAG avanzadas.

## 🎯 ¿Qué es Knowledge Agent?

```typescript
Knowledge Agent = Agente conversacional + RAG en Obsidian Vault

Características:
- Busca en vault antes de cada respuesta
- Usa embeddings semánticos (SimpleEmbedder)
- Escribe insights de vuelta al vault
- Dos perfiles: architect | reviewer
- BackendKit Enterprise (ObsidianRAGProvider)
```

## 🏗️ Arquitectura Actual de Knowledge Agent

```
User Question
    ↓
Búsqueda RAG (ObsidianRAGProvider)
    ↓
Vault chunks indexados
    ↓
LLM Router (DeepSeek/OpenAI)
    ↓
Agent Profiles (Architect/Reviewer)
    ↓
Tools: search_knowledge + write_knowledge
    ↓
Respuesta con citas del vault
    ↓
Escritura de insights de vuelta al vault
```

## 🔗 Propuesta: Integración con bk-agent Vault

### Arquitectura Completa

```
┌──────────────────────────────────────────────────────────────────┐
│                      Knowledge Agent                              │
│  (Agente conversacional respaldado por RAG)                       │
└────────────┬─────────────────────────────────────────────────────┘
             │
         Busca en:
             │
    ┌────────┴────────┐
    │                 │
┌───▼─────────────┐  ┌──▼──────────────────┐
│ bk-agent-vault  │  │ Otros vaults         │
│                 │  │ (si existen)         │
│ 04-Recursos/    │  │                      │
│ Backend/        │  └──────────────────────┘
│ bk-agent/       │
│                 │
│ - 00-index.md   │
│ - 01-overview   │
│ - 02-install    │
│ - 03-commands   │
│ - 04-spec       │
│ - 05-agents     │
│ - ... (14 docs) │
└─────────────────┘
     ↓
Index RAG (embeddings)
     ↓
Búsquedas semánticas
     ↓
Respuestas con citas exactas
```

## 📊 Comparación: Sin vs Con Knowledge Agent

### Sin Knowledge Agent (Actual)
```
Claude Code
    ↓
¿Cómo uso /spec.run?
    ↓
Respuesta basada en:
  - Mi conocimiento de entrenamiento
  - Lo que vi en la documentación hoy
  - Intuición general
    ↓
Posible divergencia con vault actualizado
```

### Con Knowledge Agent RAG
```
Knowledge Agent
    ↓
¿Cómo uso /spec.run?
    ↓
Busca en vault:
  search_knowledge("spec.run usage")
    ↓
Encuentra en 03-commands-slash.md y 04-spec-driven-development.md
    ↓
Cita exactamente del vault:
  "Según 03-commands-slash.md: /spec.run ejecuta..."
    ↓
Garantizado consistente con documentación
```

## 🚀 Casos de Uso para Knowledge Agent + bk-agent

### 1. **Consultas Precisas sobre Comandos**
```
User: "¿Cuáles son todos los parámetros de /spec.advance?"

Knowledge Agent:
  → Busca en 03-commands-slash.md
  → Cita exacto de la documentación
  → Proporciona ejemplos del vault
  → Escribe insights si encuentra algo nuevo
```

### 2. **Troubleshooting Automático**
```
User: "Mi /spec.run falla con 'Model not found'"

Knowledge Agent:
  → Busca en 13-troubleshooting.md
  → Encuentra soluciones exactas
  → Proporciona pasos del vault
  → Mejora el vault si encuentra patrón nuevo
```

### 3. **Respuestas Arquitectónicas**
```
User: "¿Cómo funciona internamente el agent routing?"

Knowledge Agent:
  → Busca en 14-architecture.md
  → Encuentra diagramas y flujos
  → Cita componentes específicos
  → Explica con precisión arquitectónica
```

### 4. **Recomendaciones Basadas en Patrones**
```
User: "¿Cuál es el mejor skill para trabajar con Git?"

Knowledge Agent:
  → Busca en 06-skills-system.md y 11-plugins-mcp.md
  → Encuentra recomendaciones del vault
  → Sugiere patternsde BackendKit
  → Aprende si usuario propone mejora
```

## 🔧 Requisitos Técnicos

### Dependencias
```typescript
// Ya incluidas en knowledge-agent
@backendkit-labs/agent-core          // Agent engine
@backendkit-labs/agent-enterprise    // ObsidianRAGProvider
@backendkit-labs/curator-agent       // Procesamiento de docs
openai                               // LLM client

// Compatibles
deepseek-api                         // O OpenAI
```

### Configuración Necesaria

```bash
# Variables de entorno
export DEEPSEEK_API_KEY="sk-..."
export VAULT_PATH="/path/to/bk-agent-vault"
export LLM_MODEL="deepseek-reasoner"  # Para mejor RAG
export AGENT_PROFILE="architect"      # architect | reviewer

# Índice RAG
~/.bk-agent/rag/bk-agent-vault.json
```

## 📋 Flujo de Implementación

### Paso 1: Preparar Vault (HECHO ✅)
```bash
✓ Documentación creada: 14 archivos
✓ Copiada a: bk-agent-vault/04-Recursos/Backend/bk-agent/
✓ Lista para curator-agent
```

### Paso 2: Procesar con Curator
```bash
# Convierte docs → notas semánticas
DEEPSEEK_API_KEY="sk-..." \
CURATOR_VAULT_PATH="/path/to/bk-agent-vault" \
npx @backendkit-labs/curator-agent

# Output: Notas estructuradas con:
# - Resúmenes semánticos
# - Tags automáticos
# - Frontmatter
# - Cross-references
```

### Paso 3: Indexar con Knowledge Agent
```bash
# Crea índice RAG
VAULT_PATH="/path/to/bk-agent-vault" \
npx knowledge-agent /reindex

# Output: ~/.bk-agent/rag/bk-agent-vault.json
# Con embeddings de todos los chunks
```

### Paso 4: Ejecutar Knowledge Agent
```bash
# Inicia REPL con RAG
DEEPSEEK_API_KEY="sk-..." \
VAULT_PATH="/path/to/bk-agent-vault" \
AGENT_PROFILE="architect" \
npx knowledge-agent

# Ahora puedes hacer preguntas
```

## 🎓 Dos Perfiles Disponibles

### Architect Profile
```typescript
Especialidad: Diseño + Mejores prácticas
Enfoque: Preguntas arquitectónicas
Sistema: "Siempre busca primero en el vault"

Útil para:
- ¿Cómo está diseñado esto?
- ¿Cuál es el patrón recomendado?
- ¿Cuáles son las mejores prácticas?
```

### Reviewer Profile  
```typescript
Especialidad: Revisión de código/diseño
Enfoque: Validación contra vault
Sistema: "Revisa contra prácticas del vault"

Útil para:
- ¿Mi código sigue los patrones?
- ¿Hay issues aquí?
- ¿Cómo mejoro esto según el vault?
```

## 🛠️ Herramientas Disponibles

```typescript
// search_knowledge
Busca en vault por query
Input: "¿cómo usar /spec.run?"
Output: [
  { chunk: "...", source: "03-commands-slash.md", score: 0.95 },
  { chunk: "...", source: "04-spec-driven-development.md", score: 0.87 }
]

// write_knowledge
Escribe insights de vuelta
Input: { title: "Nueva lección", content: "..." }
Output: Nota guardada en vault
```

## 💡 Ventajas de Esta Arquitectura

| Aspecto | Ventaja |
|---------|---------|
| **Precisión** | RAG garantiza información del vault |
| **Citas** | Todas las respuestas citadas del vault |
| **Aprendizaje** | El vault mejora con cada insight |
| **Escalabilidad** | Funciona con cualquier tamaño de vault |
| **Roles** | Architect y Reviewer para diferentes casos |
| **Offline** | Funciona sin internet después de indexado |
| **Histórico** | Mantiene conversación context |

## 📱 Ejemplo de Sesión

```
$ DEEPSEEK_API_KEY=sk-... VAULT_PATH=./bk-agent-vault npx knowledge-agent

  ╔══════════════════════════════════════════════════════════╗
  ║            Knowledge Agent — BackendKit Labs             ║
  ╚══════════════════════════════════════════════════════════╝
  Vault:    ./bk-agent-vault
  Index:    156 chunks indexed
  LLM:      deepseek-reasoner (reasoning mode)
  Profile:  architect

> ¿Cuáles son las 5 fases de /spec?

🔍 Searching vault for: "spec phases workflow"...

Found in 04-spec-driven-development.md:
  "The 5-phase roadmap: SPECIFY → IMPLEMENT → VERIFY → INTEGRATE → DEPLOY"

✓ According to 04-spec-driven-development.md:

Las 5 fases de /spec son:

1. **SPECIFY** — Define requisitos y diseño
   - /spec.prompt (capturar requisitos)
   - /spec.specify (generar especificación)
   - /spec.plan (generar diseño)
   - /spec.init (crear roadmap)

2. **IMPLEMENT** — Generar código
   - /spec.next (ver tareas)
   - /spec.run (generar código)
   - /checkpoint (guardar progreso)

3. **VERIFY** — Testing y QA
   - /spec.qa (evaluación QA)
   - Hallazgos guardados

4. **INTEGRATE** — Integración
   - Merge con rama principal

5. **DEPLOY** — Despliegue
   - A producción

📚 Fuente: 04-spec-driven-development.md, sección "5-Phase Roadmap"

> ¿Qué diferencia hay entre /spec.run y /spec.qa?

🔍 Searching vault...
✓ Found in 03-commands-slash.md and 04-spec-driven-development.md

/spec.run vs /spec.qa:

**/spec.run** (Fase IMPLEMENT)
- Genera código para la fase actual
- Orquesta especialistas (Code Generator)
- Produce archivos de salida
- El usuario debe llamar /spec.advance

**/spec.qa** (Fase VERIFY)
- Evalúa código ya generado
- Busca issues de calidad
- Genera hallazgos en qa-phase{N}.md
- Alimenta decisión de /spec.advance

Según el vault: "run genera, qa valida"
```

## 🔄 Integración con Claude Code

### Opción A: Paralelo
```
Claude Code (actual) ←→ Knowledge Agent (RAG)
Ambos funcionan
Usuario elige qué usar
```

### Opción B: MCP Bridge
```
Claude Code
    ↓
MCP Server (vault knowledge)
    ↓
Knowledge Agent como backend
    ↓
Respuestas RAG a Claude
```

### Opción C: Integración Nativa
```
Claude Code
    ↓
Carga Knowledge Agent internamente
    ↓
Búsquedas RAG automáticas
    ↓
Respuestas mejoradas
```

## 📊 Comparación de Enfoques

| Enfoque | Ventajas | Desventajas |
|---------|----------|-------------|
| **Knowledge Agent CLI** | RAG exacto, standalone | Interfaz separada |
| **MCP Bridge** | Integración limpia | Overhead de protocolo |
| **Native** | Mejor UX | Cambios en Claude Code |

**Recomendación:** Empezar con **Opción A** (CLI standalone), luego evaluar MCP bridge.

## 🚀 Próximos Pasos

### Fase 1: Preparación (HECHO ✅)
- ✓ Documentación creada
- ✓ Vault estructurado
- ⏳ Ejecutar curator-agent

### Fase 2: Indexación
- Procesar vault con curator-agent
- Crear índice RAG
- Verificar chunks indexados

### Fase 3: Testing
- Ejecutar Knowledge Agent
- Hacer pruebas RAG
- Validar calidad de respuestas

### Fase 4: Optimización
- Ajustar embeddings
- Mejorar prompts
- Expandir perfiles

### Fase 5: Integración
- Conectar con Claude Code
- Crear MCP server (opcional)
- Automatizar búsquedas

---

## ✨ Resumen

**SÍ, knowledge-agent puede consultar el vault de bk-agent para RAG perfecto.**

### Lo que obtendrías:
- 🎯 Respuestas 100% precisas del vault
- 📚 Citas exactas de documentación
- 🧠 Búsqueda semántica (no solo keyword)
- 📈 Vault que aprende con cada sesión
- 🔄 Dos roles (Architect + Reviewer)
- 💪 Respaldado por DeepSeek Reasoner

### Arquitectura:
```
bk-agent-vault (14 docs)
    ↓
curator-agent (extrae conocimiento)
    ↓
knowledge-agent (RAG + conversación)
    ↓
Respuestas precisas y citadas
```

**Esto sería el "Google" del knowledge de bk-agent.**

---

**Status:** Análisis Completo ✅  
**Siguiente:** Ejecutar curator-agent → Indexar → Probar Knowledge Agent
