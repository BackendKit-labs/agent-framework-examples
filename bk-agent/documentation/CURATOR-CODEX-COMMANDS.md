# Curator-Codex Agent — Paso a Paso Completo

**Guía detallada de todos los comandos de curator-codex-agent con ejemplos y resultados esperados.**

---

## **📋 Tabla de Contenidos**

1. [Verificación Inicial](#verificación-inicial)
2. [Parte 1: Workspace Management](#parte-1-workspace-management)
3. [Parte 2: Curation](#parte-2-curation-procesar-código)
4. [Parte 3: Knowledge Search](#parte-3-knowledge-search-buscar-en-el-vault)
5. [Parte 4: Flujo Completo](#parte-4-flujo-completo-ejemplo-real)
6. [Resumen de Comandos](#resumen-de-comandos)
7. [Tips](#tips)

---

## **Verificación Inicial**

Verifica que curator-codex esté online:

```bash
/plugin
```

**Resultado esperado:**
```
⎿  Plugins (3):
    ○ docker               (offline)
    ○ design               (offline)
    ○ curator-codex        (offline)  ← Debería estar aquí
```

Si no lo ves, bk-agent necesita reiniciarse.

---

# **PARTE 1: WORKSPACE MANAGEMENT**

Los workspaces te permiten organizar vaults por tema. Cada workspace tiene su propio input y output path.

---

## **Paso 1️⃣: Listar workspaces disponibles**

```bash
curator_workspace_list
```

**Resultado esperado:**
```json
{
  "current": "knowledge-vault",
  "workspaces": [
    {
      "name": "knowledge-vault",
      "inputPath": "",
      "outputPath": "C:\\Users\\mairon.cuello\\vaults\\knowledge-vault",
      "description": "Default knowledge vault",
      "active": true
    },
    {
      "name": "backend",
      "inputPath": "C:\\Users\\mairon.cuello\\development\\workspace-ia\\backendkit-agents",
      "outputPath": "C:\\Users\\mairon.cuello\\vaults\\vault-backend",
      "description": "Backend projects and patterns",
      "active": false
    },
    {
      "name": "security",
      "inputPath": "C:\\Users\\mairon.cuello\\development\\workspace-ia\\security-patterns",
      "outputPath": "C:\\Users\\mairon.cuello\\vaults\\vault-security",
      "description": "Security patterns and best practices",
      "active": false
    },
    {
      "name": "devops",
      "inputPath": "C:\\Users\\mairon.cuello\\development\\workspace-ia\\devops",
      "outputPath": "C:\\Users\\mairon.cuello\\vaults\\vault-devops",
      "description": "DevOps and infrastructure knowledge",
      "active": false
    }
  ]
}
```

### **Interpretación:**
- `"current": "knowledge-vault"` — Este es el workspace **ACTIVO**
- `"active": true` — El que está seleccionado actualmente
- Tienes 4 workspaces disponibles
- Cada uno tiene su propio `outputPath` (vault)

---

## **Paso 2️⃣: Ver detalles del workspace actual**

```bash
curator_workspace_current
```

**Resultado esperado:**
```json
{
  "name": "knowledge-vault",
  "workspace": {
    "name": "knowledge-vault",
    "inputPath": "",
    "outputPath": "C:\\Users\\mairon.cuello\\vaults\\knowledge-vault",
    "description": "Default knowledge vault"
  }
}
```

### **Interpretación:**
- Workspace actual: `knowledge-vault`
- Output path: `C:\Users\mairon.cuello\vaults\knowledge-vault`
- **Los archivos que cures se guardarán en este path**

---

## **Paso 3️⃣: Cambiar a un workspace diferente**

```bash
curator_workspace_switch "backend"
```

**Resultado esperado:**
```json
{
  "success": true,
  "workspace": "backend",
  "config": {
    "inputPath": "C:\\Users\\mairon.cuello\\development\\workspace-ia\\backendkit-agents",
    "outputPath": "C:\\Users\\mairon.cuello\\vaults\\vault-backend",
    "description": "Backend projects and patterns"
  },
  "message": "Switched to workspace: backend"
}
```

### **Interpretación:**
- ✓ Cambio exitoso
- Ahora el workspace activo es `backend`
- **Los próximos comandos usarán `vault-backend` como output**
- El cambio se guarda automáticamente en `.bk-agent/curator-workspace.json`

---

## **Paso 4️⃣: Verificar que el cambio se guardó**

```bash
curator_workspace_current
```

**Resultado esperado:**
```json
{
  "name": "backend",
  "workspace": {
    "name": "backend",
    "inputPath": "C:\\Users\\mairon.cuello\\development\\workspace-ia\\backendkit-agents",
    "outputPath": "C:\\Users\\mairon.cuello\\vaults\\vault-backend",
    "description": "Backend projects and patterns"
  }
}
```

### **Interpretación:**
- ✓ Ahora el workspace actual es `backend`
- ✓ Está sincronizado en `.bk-agent/curator-workspace.json`

---

# **PARTE 2: CURATION (Procesar Código)**

La curation es el proceso de analizar archivos de código y documentación, generando notas estructuradas en tu vault.

---

## **Paso 5️⃣: Ver estado actual del vault**

```bash
curator_vault_status
```

**Resultado esperado:**
```json
{
  "vaultPath": "C:\\Users\\mairon.cuello\\vaults\\vault-backend",
  "subdirectories": 0,
  "rootFiles": 0,
  "status": "ready"
}
```

### **Interpretación:**
- `vaultPath`: Ubicación del vault actual
- `subdirectories: 0` — No hay carpetas aún
- `rootFiles: 0` — El vault está vacío
- `status: ready` — Listo para recibir notas

---

## **Paso 6️⃣: Procesar un directorio completo**

Este es el comando más importante. Analiza TODOS los archivos TypeScript, JavaScript, Python, etc. de un directorio.

```bash
curator_process_directory "C:\Users\mairon.cuello\development\workspace-ia\backendkit-agents"
```

**⏱️ Este comando puede tomar 30-60 segundos (depende del tamaño del proyecto)**

**Resultado esperado:**
```json
{
  "notesWritten": [
    "src/analyzer.ts.md",
    "src/api/config.ts.md",
    "src/api/routes.ts.md",
    "src/api/security.ts.md",
    "src/knowledge/engine.ts.md",
    "src/server.ts.md"
  ],
  "notesSkipped": [],
  "errors": [],
  "filesAnalyzed": [
    "src/analyzer.ts",
    "src/api/config.ts",
    "src/api/routes.ts",
    "src/api/security.ts",
    "src/knowledge/engine.ts",
    "src/server.ts"
  ],
  "totalFiles": 45,
  "codeFiles": 38,
  "docFiles": 7,
  "durationMs": 45230
}
```

### **Interpretación:**
- ✓ **6 notas generadas** (`notesWritten`)
- ✓ **0 errores** (muy importante)
- ✓ **45 archivos totales analizados**
  - 38 archivos de código (TypeScript, JavaScript, etc.)
  - 7 documentos (Markdown, texto)
- ✓ **Duración: 45 segundos**

### **Estructura de notas generadas:**
```
vault-backend/
├── src/
│   ├── analyzer.ts.md         ← Análisis de CodeAnalyzer
│   ├── api/
│   │   ├── config.ts.md       ← Análisis de ConfigManager
│   │   ├── routes.ts.md       ← Análisis de rutas HTTP
│   │   └── security.ts.md     ← Análisis de seguridad
│   ├── knowledge/
│   │   └── engine.ts.md       ← Análisis de KnowledgeEngine
│   └── server.ts.md           ← Análisis de servidor MCP
```

---

## **Paso 7️⃣: Verificar que las notas se guardaron**

```bash
curator_vault_status
```

**Resultado esperado:**
```json
{
  "vaultPath": "C:\\Users\\mairon.cuello\\vaults\\vault-backend",
  "subdirectories": 3,
  "rootFiles": 6,
  "status": "ready"
}
```

### **Interpretación:**
- ✓ **6 archivos raíz** (las notas que generamos)
- ✓ **3 subdirectorios** (src/, src/api/, src/knowledge/)
- El vault ya no está vacío
- **Las notas están listas para ser buscadas**

---

## **Paso 8️⃣: Procesar un archivo individual**

Si quieres procesar solo un archivo específico:

```bash
curator_process_file "C:\Users\mairon.cuello\development\workspace-ia\backendkit-agents\packages\curator-codex-agent\src\analyzer.ts"
```

**Resultado esperado:**
```json
{
  "notesWritten": [
    "src/analyzer.ts.md"
  ],
  "notesSkipped": [],
  "errors": [],
  "filesAnalyzed": [
    "src/analyzer.ts"
  ],
  "durationMs": 8234
}
```

### **Interpretación:**
- ✓ **1 nota generada** para ese archivo específico
- ✓ **0 errores**
- ✓ **Duración: 8 segundos** (más rápido que directorio completo)

---

# **PARTE 3: KNOWLEDGE SEARCH (Buscar en el Vault)**

Una vez que tienes notas en tu vault, puedes buscar semánticamente en ellas.

---

## **Paso 9️⃣: Buscar semánticamente en el vault**

```bash
knowledge_search "cómo analizar archivos TypeScript"
```

**Resultado esperado:**
```json
{
  "results": [
    {
      "file": "src/analyzer.ts.md",
      "relevance": 0.94,
      "snippet": "CodeAnalyzer class provides comprehensive TypeScript file analysis...",
      "content": "..."
    },
    {
      "file": "src/server.ts.md",
      "relevance": 0.76,
      "snippet": "Analyzes code files recursively, discovering patterns..."
    }
  ],
  "query": "cómo analizar archivos TypeScript",
  "synthesis": "Para analizar archivos TypeScript, usa la clase CodeAnalyzer que proporciona análisis completo del AST...",
  "count": 2
}
```

### **Interpretación:**
- **2 resultados encontrados**
- `relevance: 0.94` — 94% de coincidencia (muy relevante ⭐⭐⭐)
- `relevance: 0.76` — 76% de coincidencia (relevante ⭐⭐)
- **synthesis** — Resumen automático combinando los documentos encontrados
- **snippet** — Fragmento relevante del documento

---

## **Paso 10️⃣: Buscar con opciones avanzadas**

```bash
knowledge_search {
  "query": "patrones de autenticación",
  "topK": 5,
  "autoSynthesize": true
}
```

### **Parámetros:**
- **`query`** (requerido) — Lo que buscas (puede ser natural language)
- **`topK`** (opcional) — Máximo número de resultados (1-20, default: 5)
- **`autoSynthesize`** (opcional) — Generar síntesis automática (default: true)

**Resultado esperado:**
```json
{
  "results": [
    {
      "file": "src/api/security.ts.md",
      "relevance": 0.89,
      "snippet": "Bearer token authentication with JWT support..."
    },
    {
      "file": "src/analyzer.ts.md",
      "relevance": 0.72,
      "snippet": "Security patterns in code analysis..."
    }
  ],
  "synthesis": "Los patrones de autenticación incluyen Bearer tokens, JWT, y validación de credenciales...",
  "count": 2
}
```

---

## **Paso 11️⃣: Recargar e indexar el vault**

Úsalo cuando:
- Hayas agregado archivos manualmente al vault
- Cambies archivos dentro del vault
- Quieras actualizar los índices de búsqueda

```bash
knowledge_reload
```

**Resultado esperado:**
```json
{
  "status": "reindexing",
  "filesIndexed": 6,
  "docsIndexed": 6,
  "embeddingsGenerated": 6,
  "message": "Vault reindexed successfully"
}
```

### **Interpretación:**
- ✓ **6 archivos reindexados**
- ✓ **6 documentos procesados**
- ✓ **6 embeddings generados** (vectores para búsqueda semántica)
- Los índices están al día

---

## **Paso 12️⃣: Ver estadísticas del vault**

```bash
knowledge_stats
```

**Resultado esperado:**
```json
{
  "vaultPath": "C:\\Users\\mairon.cuello\\vaults\\vault-backend",
  "totalDocs": 6,
  "indexedDocs": 6,
  "embeddingsReady": true,
  "embeddingModel": "bge-small-en-v1.5",
  "lastIndexTime": "2026-06-13T16:45:23.891Z",
  "searchReady": true
}
```

### **Interpretación:**
- ✓ **6 documentos totales**
- ✓ **6 documentos indexados** (100%)
- ✓ **Embeddings listos** para búsqueda semántica
- ✓ **Búsqueda operativa**
- Modelo usado: `bge-small-en-v1.5` (embeddings)

---

# **PARTE 4: FLUJO COMPLETO (Ejemplo Real)**

## **Escenario: Curar 3 proyectos diferentes en una sesión**

### **Sesión 1: Backend**

```bash
# 1. Cambiar workspace
curator_workspace_switch "backend"

# 2. Curar código
curator_process_directory "C:\desarrollo\backend"

# 3. Verificar estado
curator_vault_status

# 4. Buscar en el vault
knowledge_search "manejo de errores"
```

**Resultado:**
- Workspace activo: `backend`
- Vault path: `C:\vaults\vault-backend`
- Notas guardadas en `vault-backend`
- Búsqueda busca en `vault-backend`

---

### **Sesión 2: Security (minutos después)**

```bash
# 1. Cambiar workspace
curator_workspace_switch "security"

# 2. Curar código
curator_process_directory "C:\desarrollo\security"

# 3. Buscar en vault de security (NO en backend)
knowledge_search "autenticación JWT"

# 4. Ver estadísticas
knowledge_stats
```

**Resultado:**
- Workspace activo: `security`
- Vault path: `C:\vaults\vault-security`
- Notas guardadas en `vault-security`
- Búsqueda busca solo en `vault-security` (no en `vault-backend`)

---

### **Sesión 3: DevOps**

```bash
# 1. Cambiar workspace
curator_workspace_switch "devops"

# 2. Curar código
curator_process_directory "C:\desarrollo\devops"

# 3. Reindexar si necesario
knowledge_reload

# 4. Buscar en vault de devops
knowledge_search "docker kubernetes CI/CD"
```

**Resultado:**
- Workspace activo: `devops`
- Vault path: `C:\vaults\vault-devops`
- Notas guardadas en `vault-devops`
- Búsqueda busca solo en `vault-devops`

---

# **Resumen de Comandos**

## **12 Comandos Totales**

| # | Comando | Tipo | Propósito | Ejemplo |
|---|---------|------|----------|---------|
| 1 | `curator_workspace_list` | Workspace | Listar todos los workspaces | `curator_workspace_list` |
| 2 | `curator_workspace_current` | Workspace | Ver workspace activo | `curator_workspace_current` |
| 3 | `curator_workspace_switch` | Workspace | Cambiar a otro workspace | `curator_workspace_switch "backend"` |
| 4 | `curator_workspace_add` | Workspace | Crear nuevo workspace | `curator_workspace_add {...}` |
| 5 | `curator_workspace_remove` | Workspace | Eliminar workspace | `curator_workspace_remove "nombre"` |
| 6 | `curator_vault_status` | Curation | Ver estado del vault actual | `curator_vault_status` |
| 7 | `curator_process_file` | Curation | Procesar un archivo | `curator_process_file "ruta/archivo.ts"` |
| 8 | `curator_process_directory` | Curation | Procesar directorio completo | `curator_process_directory "C:\proyecto"` |
| 9 | `knowledge_search` | Knowledge | Buscar en el vault | `knowledge_search "query"` |
| 10 | `knowledge_reload` | Knowledge | Reindexar vault | `knowledge_reload` |
| 11 | `knowledge_stats` | Knowledge | Ver estadísticas | `knowledge_stats` |

---

# **Tips**

### **✅ Mejores Prácticas**

1. **Cambiar workspace ANTES de curar**
   ```bash
   curator_workspace_switch "backend"   # Primero
   curator_process_directory "..."      # Luego
   ```

2. **Verificar workspace actual si dudas**
   ```bash
   curator_workspace_current
   ```

3. **Búsqueda lenta la primera vez**
   - Se generan embeddings (vectores para búsqueda semántica)
   - Puede tardar 10-30 segundos la primera búsqueda
   - Las siguientes búsquedas son más rápidas

4. **Reindexar después de cambios manuales**
   ```bash
   knowledge_reload
   ```

5. **Las notas se guardan automáticamente**
   - No necesitas hacer nada extra
   - Se guardan en el vault del workspace actual

6. **Sincronización automática entre agentes**
   - Si usas curator-codex en Claude Desktop y bk-agent
   - Los workspaces se sincronizan a través de `.bk-agent/curator-workspace.json`

---

## **❌ Errores Comunes**

| Error | Causa | Solución |
|-------|-------|----------|
| "Workspace not found" | Nombre incorrecto | Usar `curator_workspace_list` para ver nombres correctos |
| "No results found" | Vault vacío | Ejecutar `curator_process_directory` primero |
| "Connection closed" | Servidor no disponible | Reiniciar bk-agent |
| Búsqueda lenta | Primera indexación | Esperar a que terminen los embeddings |

---

## **📚 Documentación Relacionada**

- **QUICK-START.md** — Guía rápida (3 pasos)
- **INTEGRATED-ARCHITECTURE.md** — Arquitectura de curator-codex
- **WORKSPACE-ARCHITECTURE.md** — Sistema de workspaces
- **packages/curator-codex-agent/README.md** — Documentación técnica completa

---

**¡Listo para curar tu código! 🚀**
