# Curator-Codex Agent — Code Curation & Knowledge Management

**Integrated MCP server for analyzing code, generating knowledge notes, and performing semantic search across your codebase.**

---

## 📖 Table of Contents

1. [Overview](#overview)
2. [What is Curator-Codex?](#what-is-curator-codex)
3. [Key Features](#key-features)
4. [Workspace Management](#workspace-management)
5. [Curation Process](#curation-process)
6. [Knowledge Search](#knowledge-search)
7. [Integration with bk-agent](#integration-with-bk-agent)
8. [Command Categories](#command-categories)
9. [Quick Examples](#quick-examples)
10. [Next Steps](#next-steps)

---

## Overview

**Curator-Codex Agent** is an AI-powered MCP (Model Context Protocol) server integrated into bk-agent that:

✅ **Analyzes your code** — Extracts patterns, architecture, and design decisions  
✅ **Creates knowledge notes** — Generates structured documentation from code  
✅ **Organizes by domain** — Manages multiple code vaults using workspaces  
✅ **Enables semantic search** — Find code knowledge using natural language  
✅ **Works agnóstically** — Integrates with bk-agent, Claude Desktop, OpenCode, etc.

---

## What is Curator-Codex?

Curator-Codex is an MCP server that bridges the gap between:

- **Your Code** (TypeScript, JavaScript, Python, Go, Rust, Java, etc.)
- **AI Knowledge** (LLM-generated insights and patterns)
- **Searchable Vaults** (RAG-based knowledge retrieval)

### Problem It Solves

```
Before:
├─ You write code
├─ Knowledge exists only in code
├─ Hard to search across projects
└─ Context is scattered

After (with Curator-Codex):
├─ You write code
├─ Curator analyzes and creates notes
├─ Knowledge is organized in vaults
├─ Semantic search finds everything
└─ Context is centralized & searchable
```

---

## Key Features

### 1. **Workspace Management**
Organize your code knowledge by domain:

```bash
# Create separate vaults for different projects
curator_workspace_add { "name": "backend", "inputPath": "...", "outputPath": "..." }
curator_workspace_add { "name": "security", "inputPath": "...", "outputPath": "..." }
curator_workspace_add { "name": "devops", "inputPath": "...", "outputPath": "..." }

# Switch between them
curator_workspace_switch "backend"
```

### 2. **Code Curation**
Analyze code and generate structured notes:

```bash
# Process entire directory
curator_process_directory "C:\my-project"

# Or analyze single file
curator_process_file "C:\my-project\src\analyzer.ts"
```

### 3. **Semantic Search**
Find code knowledge using natural language:

```bash
# Search your vault
knowledge_search "how to handle errors in async functions"

# Get results with synthesis
knowledge_search {
  "query": "authentication patterns",
  "topK": 5,
  "autoSynthesize": true
}
```

### 4. **Knowledge Indexing**
Maintain efficient search indices:

```bash
# Reindex vault after changes
knowledge_reload

# View statistics
knowledge_stats
```

---

## Workspace Management

### What is a Workspace?

A workspace is a logical grouping of code analysis with:
- **Input path** — Where your code is
- **Output path** — Where knowledge notes are stored
- **Description** — What this workspace contains

### Creating a Workspace

```bash
curator_workspace_add {
  "name": "backend",
  "inputPath": "C:\\development\\backend-api",
  "outputPath": "C:\\vaults\\vault-backend",
  "description": "Backend APIs and services"
}
```

### Switching Workspaces

All subsequent commands use the active workspace:

```bash
# Switch to backend workspace
curator_workspace_switch "backend"

# Now these commands use vault-backend/
curator_process_directory "..."
knowledge_search "..."
```

### Workspace Isolation

Each workspace has its own vault:

```
C:\vaults\
├── vault-backend\        ← Backend code knowledge
├── vault-security\       ← Security patterns
└── vault-devops\         ← DevOps & infrastructure
```

Search is isolated per workspace:

```bash
curator_workspace_switch "backend"
knowledge_search "error handling"    # Searches vault-backend only

curator_workspace_switch "security"
knowledge_search "authentication"    # Searches vault-security only
```

---

## Curation Process

### Step 1: Verify Workspace

```bash
curator_workspace_current
```

**Output:**
```json
{
  "name": "backend",
  "workspace": {
    "outputPath": "C:\\vaults\\vault-backend",
    "description": "Backend APIs and services"
  }
}
```

### Step 2: Check Vault Status

```bash
curator_vault_status
```

**Output:**
```json
{
  "vaultPath": "C:\\vaults\\vault-backend",
  "subdirectories": 0,
  "rootFiles": 0,
  "status": "ready"
}
```

### Step 3: Process Code

```bash
curator_process_directory "C:\development\backend-api"
```

**What happens:**
- ✅ Scans all code files (TypeScript, JavaScript, Python, etc.)
- ✅ Analyzes code structure, patterns, and architecture
- ✅ Discovers associated documentation (README.md, code.md files)
- ✅ Generates structured knowledge notes
- ✅ Saves notes to vault

**Output:**
```json
{
  "notesWritten": 12,
  "filesAnalyzed": 45,
  "codeFiles": 38,
  "docFiles": 7,
  "durationMs": 45000
}
```

### Step 4: Verify Results

```bash
curator_vault_status
```

**Output:**
```json
{
  "vaultPath": "C:\\vaults\\vault-backend",
  "subdirectories": 5,
  "rootFiles": 12,
  "status": "ready"
}
```

---

## Knowledge Search

### Basic Search

```bash
knowledge_search "how does authentication work"
```

**Returns:**
- Relevant code notes (sorted by relevance)
- Snippets from matching files
- AI-synthesized summary

### Advanced Search

```bash
knowledge_search {
  "query": "error handling patterns",
  "topK": 10,
  "autoSynthesize": true
}
```

**Parameters:**
- `query` — What you're looking for (natural language)
- `topK` — Number of results (1-20, default: 5)
- `autoSynthesize` — Generate synthesis (default: true)

### Search Results

```json
{
  "results": [
    {
      "file": "src/error-handler.ts.md",
      "relevance": 0.94,
      "snippet": "Error handling uses try-catch with custom error codes..."
    },
    {
      "file": "src/middleware/error.ts.md",
      "relevance": 0.82,
      "snippet": "Middleware catches errors and formats responses..."
    }
  ],
  "synthesis": "Error handling in this project uses...",
  "count": 2
}
```

---

## Integration with bk-agent

### Configuration

Curator-Codex is automatically registered as an MCP server in bk-agent:

```json
// .bk-agent/config.json
{
  "mcpServers": [
    {
      "name": "curator-codex",
      "command": "node",
      "args": ["path/to/curator-codex-agent/dist/server.js"],
      "env": {
        "CURATOR_API_KEY": "sk-...",
        "CURATOR_PROVIDER": "deepseek",
        "CURATOR_MODEL": "deepseek-reasoner"
      }
    }
  ]
}
```

### Usage in bk-agent

All curator-codex commands are available directly in bk-agent:

```bash
# List available workspaces
curator_workspace_list

# Switch workspace
curator_workspace_switch "backend"

# Curate code
curator_process_directory "C:\my-project"

# Search knowledge
knowledge_search "authentication"
```

### Multi-Agent Synchronization

If you use Curator-Codex in multiple places:

```
Claude Desktop
└─→ curator_workspace_switch "security"
    └─→ Updates .bk-agent/curator-workspace.json

bk-agent (5 minutes later)
└─→ knowledge_search "..."
    └─→ Searches vault-security (synchronized!)
```

Workspaces are automatically synchronized across all agents via shared config file.

---

## Command Categories

### 11 Total Commands

#### **Workspace Management (5)**
| Command | Purpose |
|---------|---------|
| `curator_workspace_list` | List all workspaces |
| `curator_workspace_current` | View active workspace |
| `curator_workspace_switch` | Change workspace |
| `curator_workspace_add` | Create/update workspace |
| `curator_workspace_remove` | Delete workspace |

#### **Code Curation (3)**
| Command | Purpose |
|---------|---------|
| `curator_process_file` | Analyze single file |
| `curator_process_directory` | Analyze directory recursively |
| `curator_vault_status` | View vault status |

#### **Knowledge Search (3)**
| Command | Purpose |
|---------|---------|
| `knowledge_search` | Semantic search with synthesis |
| `knowledge_reload` | Reindex vault |
| `knowledge_stats` | View statistics |

---

## Quick Examples

### Example 1: Curate a Backend Project

```bash
# 1. Create workspace
curator_workspace_add {
  "name": "my-api",
  "inputPath": "C:\\development\\my-api",
  "outputPath": "C:\\vaults\\vault-api"
}

# 2. Switch to workspace
curator_workspace_switch "my-api"

# 3. Process code
curator_process_directory "C:\development\my-api"

# 4. Search knowledge
knowledge_search "how to add a new endpoint"
```

### Example 2: Curate Multiple Projects

```bash
# Project 1: Backend
curator_workspace_switch "backend"
curator_process_directory "C:\projects\backend"

# Project 2: Frontend
curator_workspace_switch "frontend"
curator_process_directory "C:\projects\frontend"

# Project 3: DevOps
curator_workspace_switch "devops"
curator_process_directory "C:\projects\devops"

# Search backend knowledge
curator_workspace_switch "backend"
knowledge_search "database patterns"

# Search devops knowledge
curator_workspace_switch "devops"
knowledge_search "docker configuration"
```

### Example 3: Keep Knowledge Updated

```bash
# Initial curation
curator_process_directory "C:\my-project"

# Later: Update code and reindex
knowledge_reload

# Search updated knowledge
knowledge_search "new features added"
```

---

## Architecture

### How It Works

```
┌────────────────────────────────┐
│  Your Code                     │
│  (TypeScript, Python, etc.)    │
└─────────────┬──────────────────┘
              │
              ↓
┌────────────────────────────────┐
│  Curator-Codex Agent           │
│  • Code Analysis               │
│  • Pattern Recognition         │
│  • Documentation Generation    │
└─────────────┬──────────────────┘
              │
              ↓
┌────────────────────────────────┐
│  Knowledge Vault               │
│  (Structured Notes)            │
└─────────────┬──────────────────┘
              │
              ↓
┌────────────────────────────────┐
│  RAG + Semantic Search         │
│  (Find knowledge via LLM)      │
└────────────────────────────────┘
```

### Vault Structure

```
vault-backend/
├── src/
│   ├── analyzer.ts.md           ← Generated from analyzer.ts
│   ├── routes.ts.md             ← Generated from routes.ts
│   └── handlers/
│       ├── auth.ts.md
│       └── user.ts.md
├── api/
│   └── controller.ts.md
└── config.ts.md
```

---

## Next Steps

### 1. **Learn All Commands**
→ Read [CURATOR-CODEX-COMMANDS.md](CURATOR-CODEX-COMMANDS.md)

### 2. **Understand Architecture**
→ See [15-mcp-knowledge-service-strategy.md](15-mcp-knowledge-service-strategy.md)

### 3. **Create Your First Workspace**
```bash
curator_workspace_add {
  "name": "my-project",
  "inputPath": "C:\\my-code",
  "outputPath": "C:\\vaults\\my-vault"
}
```

### 4. **Curate Your Code**
```bash
curator_workspace_switch "my-project"
curator_process_directory "C:\my-code"
```

### 5. **Search Your Knowledge**
```bash
knowledge_search "what you want to find"
```

---

## Tips & Best Practices

✅ **Start small** — Curate one project, then expand  
✅ **Use descriptive workspace names** — Makes switching easier  
✅ **Reindex after big changes** — Keep search up-to-date with `knowledge_reload`  
✅ **Search frequently** — It gets better as you curate more  
✅ **Organize by domain** — Backend, frontend, devops, security, etc.  

---

## Version Information

- **Curator-Codex Version**: 0.4.0
- **Integration**: bk-agent v1.0.0+
- **Transport**: Stdio (works everywhere)
- **Model**: DeepSeek Reasoner (default)

---

**Ready to curate your code knowledge! 🚀**

For detailed command reference, see [CURATOR-CODEX-COMMANDS.md](CURATOR-CODEX-COMMANDS.md).
