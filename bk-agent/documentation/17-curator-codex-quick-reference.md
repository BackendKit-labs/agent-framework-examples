# Curator-Codex Quick Reference

**Fast start guide for code curation and knowledge management with curator-codex-agent.**

---

## 🚀 Basic Usage (3 Steps)

### 1️⃣ List Available Workspaces

```bash
curator_workspace_list
```

**Result:** All configured workspaces + which one is active

---

### 2️⃣ Switch Workspace

```bash
curator_workspace_switch "backend"
```

**Result:** Activates workspace, routes now point to that vault

---

### 3️⃣ Process Directory

```bash
curator_process_directory
```

**Result:** Analyzes all files in workspace inputPath, saves notes to outputPath

---

## 🔧 All Commands

### Workspace Management
```bash
curator_workspace_list          # List all workspaces
curator_workspace_current       # Show active workspace
curator_workspace_switch "name" # Change workspace
curator_workspace_add {...}     # Create/update workspace
curator_workspace_remove "name" # Delete workspace
```

### Code Curation
```bash
curator_process_directory       # Process workspace inputPath (async, no timeout)
curator_process_directory "path"  # Process specific path
curator_process_file "file"     # Analyze single file
curator_vault_status            # Show vault stats
```

### Knowledge Search
```bash
knowledge_search "query"        # Semantic search in active vault
knowledge_reload                # Reindex vault
knowledge_stats                 # Vault statistics
```

---

## ⚙️ Configuration

### `.bk-agent/config.json` (Initialization)
```json
{
  "name": "curator-codex",
  "env": {
    "CURATOR_API_KEY": "sk-...",
    "CURATOR_PROVIDER": "deepseek",
    "CURATOR_MODEL": "deepseek-reasoner",
    "CURATOR_BASE_URL": "https://api.deepseek.com/v1"
  }
}
```

**Note:** `CURATOR_OUTPUT_PATH` is NOT here — paths come from workspace config.

---

### `.bk-agent/curator-workspace.json` (Route Management)
```json
{
  "workspaces": [
    {
      "name": "backend",
      "inputPath": "C:\\projects\\backend",
      "outputPath": "C:\\vaults\\vault-backend",
      "description": "Backend code knowledge"
    },
    {
      "name": "docs",
      "inputPath": "C:\\bk-agent\\documentation",
      "outputPath": "C:\\vaults\\vault-bk-docs",
      "description": "bk-agent documentation"
    }
  ],
  "lastUsed": "backend",
  "version": "1.0.0"
}
```

**This is where all paths are managed.** Change workspace → routes change automatically.

---

## 💡 Typical Workflow

```bash
# Start session
curator_workspace_switch "backend"

# Check what's active
curator_workspace_current

# Process code (background, no timeout)
curator_process_directory

# Search knowledge
knowledge_search "how to handle errors"

# Switch to another vault
curator_workspace_switch "docs"
curator_process_directory
knowledge_search "curator commands"
```

---

## 📂 Vault Structure

```
C:\vaults\
├── vault-backend\
│   ├── src/
│   ├── api/
│   └── handlers/
├── vault-docs\
│   ├── 00-index.md.md
│   ├── 01-overview.md.md
│   └── ...
└── vault-security\
    └── ...
```

Each vault is independent. Search is scoped to active workspace.

---

## 🔍 Example: Multi-Vault Curation

```bash
# Vault 1: Backend
curator_workspace_switch "backend"
curator_process_directory
knowledge_search "authentication patterns"

# Vault 2: Documentation
curator_workspace_switch "docs"
curator_process_directory
knowledge_search "how to use curator"

# Vault 3: Security
curator_workspace_switch "security"
curator_process_directory
knowledge_search "JWT implementation"
```

Each workspace maintains its own vault independently.

---

## ✅ Key Points

- **No timeout:** `curator_process_directory` processes async in background
- **Dynamic paths:** Change workspace → paths update automatically
- **No env vars for paths:** Use curator-workspace.json only
- **Config is immutable:** Change .bk-agent/config.json only to update API key/model
- **Multi-agent sync:** All agents share same curator-workspace.json

---

## 📖 Full Documentation

- **Architecture:** [16-curator-codex-agent.md](16-curator-codex-agent.md)
- **Commands:** [CURATOR-CODEX-COMMANDS.md](CURATOR-CODEX-COMMANDS.md)
- **Integration:** [11-plugins-mcp.md](11-plugins-mcp.md)

---

**Ready to curate! 🚀**
