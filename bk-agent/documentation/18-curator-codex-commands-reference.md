# Curator-Codex Agent — Referencia Rápida de Comandos

**Guía de referencia rápida de todos los comandos disponibles en curator-codex-agent (11 comandos).**

---

## **🗂️ Workspaces (5 comandos)**

Organiza tus vaults por tema. Cada workspace tiene su propio input y output path.

| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `curator_workspace_list` | Listar todos los workspaces configurados | `curator_workspace_list` |
| `curator_workspace_current` | Ver detalles del workspace activo | `curator_workspace_current` |
| `curator_workspace_switch "nombre"` | Cambiar a otro workspace | `curator_workspace_switch "backend"` |
| `curator_workspace_add {...}` | Crear o actualizar un workspace | `curator_workspace_add {"name":"mi-proyecto","inputPath":"C:\\...","outputPath":"C:\\...","description":"..."}` |
| `curator_workspace_remove "nombre"` | Eliminar un workspace | `curator_workspace_remove "backend"` |

---

## **🔍 Curation (3 comandos)**

Analiza código y documentación generando notas estructuradas en el vault.

| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `curator_vault_status` | Ver estado del vault actual (archivos, subdirectorios) | `curator_vault_status` |
| `curator_process_file "ruta"` | Procesar un archivo individual y generar nota de conocimiento | `curator_process_file "C:\proyecto\src\analyzer.ts"` |
| `curator_process_directory "ruta"` | Procesar directorio completo (asincrónico, no bloquea) | `curator_process_directory "C:\proyecto"` |

---

## **📚 Knowledge (3 comandos)**

Busca y gestiona el conocimiento curado en tus vaults.

| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `knowledge_search "query"` | Búsqueda semántica simple en el vault (RAG con síntesis automática) | `knowledge_search "cómo analizar TypeScript"` |
| `knowledge_search {...}` | Búsqueda avanzada con opciones personalizadas | `knowledge_search {"query":"patrones autenticación","topK":10,"autoSynthesize":true}` |
| `knowledge_reload` | Reindexar vault después de cambios manuales o agregar archivos | `knowledge_reload` |
| `knowledge_stats` | Ver estadísticas del vault (total docs, indexados, embeddings) | `knowledge_stats` |

---

## **⚡ Flujo de Trabajo Recomendado**

### **Escenario 1: Curar un nuevo proyecto**

```bash
# 1. Crear o cambiar a workspace
curator_workspace_switch "backend"

# 2. Verificar estado del vault
curator_vault_status

# 3. Procesar todo el directorio
curator_process_directory "C:\Users\mairon.cuello\development\workspace-ia\backendkit-agents"

# 4. Esperar a que termine (async) y verificar
curator_vault_status

# 5. Buscar en el vault
knowledge_search "patrones de error handling"
```

### **Escenario 2: Procesar archivo único**

```bash
# 1. Asegúrate de estar en el workspace correcto
curator_workspace_current

# 2. Procesar el archivo
curator_process_file "C:\Users\mairon.cuello\development\workspace-ia\backendkit-agents\src\analyzer.ts"

# 3. Ver estadísticas
knowledge_stats
```

### **Escenario 3: Búsqueda avanzada**

```bash
# Búsqueda con parámetros personalizados
knowledge_search {
  "query": "patrones de seguridad en APIs",
  "topK": 10,
  "autoSynthesize": true
}
```

---

## **📊 Parámetros de Knowledge Search**

### **Búsqueda Simple**
```bash
knowledge_search "tu pregunta natural aquí"
```

### **Búsqueda Avanzada**
```bash
knowledge_search {
  "query": "string (requerido) - lo que buscas",
  "topK": "number (1-20, default: 5) - máximo de resultados",
  "autoSynthesize": "boolean (default: true) - generar síntesis automática"
}
```

---

## **📍 Estado Actual**

```
Workspace Activo: bk-agent-docs
Vault Path: C:\Users\mairon.cuello\development\workspace-ia\global-vaults\bk-agent-vault
MCP Status: ✅ Conectado
Model: deepseek-reasoner
```

---

## **✅ Mejores Prácticas**

1. **Cambiar workspace ANTES de curar**
   ```bash
   curator_workspace_switch "nombre"  # Primero
   curator_process_directory "..."    # Luego
   ```

2. **Verificar workspace antes de buscar**
   ```bash
   curator_workspace_current
   ```

3. **La búsqueda es más rápida después de la primera vez**
   - Primera búsqueda: genera embeddings (10-30 segundos)
   - Búsquedas posteriores: más rápidas (segundos)

4. **Reindexar después de cambios manuales**
   ```bash
   knowledge_reload
   ```

5. **Las notas se guardan automáticamente**
   - No requiere acciones adicionales
   - Se guardan en el vault del workspace actual

6. **Sincronización multi-agente**
   - Los workspaces se sincronizan entre bk-agent, Claude Desktop, etc.
   - Config compartida: `.bk-agent/curator-workspace.json`

---

## **❌ Errores Comunes y Soluciones**

| Error | Causa | Solución |
|-------|-------|----------|
| `Workspace not found` | Nombre incorrecto | Usar `curator_workspace_list` para ver nombres exactos |
| `No results found` | Vault vacío | Ejecutar `curator_process_directory` primero |
| `Connection closed` | Servidor MCP no disponible | Reiniciar bk-agent: `exit` y `bk-agent` |
| Búsqueda lenta | Primera indexación de embeddings | Esperar a que terminen (normal, 10-30 seg) |
| `CURATOR_OUTPUT_PATH is required` | Config incompleta | Verificar `.bk-agent/config.json` |

---

## **📚 Documentación Relacionada**

- **16-curator-codex-agent.md** — Documentación completa con arquitectura
- **CURATOR-CODEX-COMMANDS.md** — Guía paso a paso con ejemplos detallados
- **11-plugins-mcp.md** — Integración MCP en bk-agent
- **packages/curator-codex-agent/README.md** — Documentación técnica

---

**Estado MCP:** ✅ Operativo  
**Última actualización:** 2026-06-14

¡Listo para curar y buscar conocimiento! 🚀
