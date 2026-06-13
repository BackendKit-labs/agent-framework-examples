# Processing bk-agent Documentation with Curator-Agent

Complete guide to curate the bk-agent documentation and create a knowledge vault.

## 📚 What We're Processing

The 14 documentation files from `bk-agent/documentation/` will be processed by curator-agent into semantically rich notes optimized for RAG search:

```
bk-agent/documentation/
├── 00-index.md
├── 01-overview.md
├── 02-installation-setup.md
├── 03-commands-slash.md
├── 04-spec-driven-development.md
├── 05-agents-specialization.md
├── 06-skills-system.md
├── 07-workspace-management.md
├── 08-reflection-learning.md
├── 09-memory-persistence.md
├── 10-backendkit-integration.md
├── 11-plugins-mcp.md
├── 12-advanced-config.md
├── 13-troubleshooting.md
├── 14-architecture.md
└── 15-mcp-knowledge-service-strategy.md

        ↓ curator-agent processes
        
bk-agent-vault/04-Recursos/Backend/bk-agent/
├── Agenst specialized notes
├── Skills system notes
├── Spec workflow notes
├── + indexed metadata
└── ready for knowledge-agent RAG
```

---

## ⚙️ Setup

### Step 1: Verify Files Are Ready

Files are already at: `bk-agent-vault/04-Recursos/Backend/bk-agent/`

```bash
# Check if files exist
ls "C:\Users\mairon.cuello\development\workspace-ia\agent-framework-examples\bk-agent-vault\04-Recursos\Backend\bk-agent\"
```

Should show:
```
00-index.md
01-overview.md
... (14 files total)
15-mcp-knowledge-service-strategy.md
```

### Step 2: Get Your DeepSeek API Key

1. Go to https://api.deepseek.com
2. Sign up or log in
3. Create an API key
4. Copy it (format: `sk-...`)

### Step 3: Set Environment Variables

**Option A: Using PowerShell (Windows)**

```powershell
# Set environment variables for this session
$env:CURATOR_API_KEY = "sk-your-key-here"
$env:CURATOR_VAULT_PATH = "C:\Users\mairon.cuello\development\workspace-ia\agent-framework-examples\bk-agent-vault"
$env:CURATOR_PROVIDER = "deepseek"
$env:CURATOR_MODEL = "deepseek-reasoner"

# Verify they're set
echo $env:CURATOR_API_KEY
```

**Option B: Using Bash**

```bash
export CURATOR_API_KEY="sk-your-key-here"
export CURATOR_VAULT_PATH="/c/Users/mairon.cuello/development/workspace-ia/agent-framework-examples/bk-agent-vault"
export CURATOR_PROVIDER="deepseek"
export CURATOR_MODEL="deepseek-reasoner"
```

**Option C: Create .env file (requires npm)**

Create `.env` in curator-agent directory:

```bash
cd "C:\Users\mairon.cuello\development\workspace-ia\backendkit-agents\packages\curator-agent"
```

Create `.env` file with:

```
CURATOR_API_KEY=sk-your-key-here
CURATOR_VAULT_PATH=C:\Users\mairon.cuello\development\workspace-ia\agent-framework-examples\bk-agent-vault
CURATOR_PROVIDER=deepseek
CURATOR_MODEL=deepseek-reasoner
```

---

## 🚀 Running Curator-Agent

### Method 1: Process All Files at Once (Recommended)

```bash
cd "C:\Users\mairon.cuello\development\workspace-ia\backendkit-agents\packages\curator-agent"

# Run curator-agent to process the documentation folder
npx @backendkit-labs/curator-agent curator-ingest-text \
  --input "C:\Users\mairon.cuello\development\workspace-ia\agent-framework-examples\bk-agent-vault\04-Recursos\Backend\bk-agent" \
  --output "C:\Users\mairon.cuello\development\workspace-ia\agent-framework-examples\bk-agent-vault\04-Recursos\Backend\bk-agent-knowledge"
```

### Method 2: Use HTTP Webhook (n8n / Automation)

```bash
# Start curator with HTTP server
$env:CURATOR_HTTP_PORT = "3099"
npx @backendkit-labs/curator-agent curator-watcher
```

Then in another terminal:

```bash
# Ingest each file
curl -X POST http://localhost:3099/ingest `
  -H "Content-Type: application/json" `
  -d '{
    "file_path": "C:\Users\mairon.cuello\development\workspace-ia\agent-framework-examples\bk-agent-vault\04-Recursos\Backend\bk-agent\03-commands-slash.md",
    "area_hint": "commands"
  }'
```

### Method 3: Watch Incoming Folder

1. Create folder structure:
```bash
mkdir "C:\Users\mairon.cuello\development\workspace-ia\agent-framework-examples\bk-agent-vault\incoming"
mkdir "C:\Users\mairon.cuello\development\workspace-ia\agent-framework-examples\bk-agent-vault\processed"
mkdir "C:\Users\mairon.cuello\development\workspace-ia\agent-framework-examples\bk-agent-vault\failed"
```

2. Copy docs to `incoming/`:
```bash
cp "C:\Users\mairon.cuello\development\workspace-ia\agent-framework-examples\bk-agent\documentation\*.md" `
   "C:\Users\mairon.cuello\development\workspace-ia\agent-framework-examples\bk-agent-vault\incoming\"
```

3. Run watcher:
```bash
npx @backendkit-labs/curator-agent curator-watcher
```

The watcher will:
- Pick up each `.md` file from `incoming/`
- Process it with curator-agent
- Move successful files to `processed/`
- Move failed files to `failed/`

---

## 🔄 What Happens During Processing

For each documentation file, curator-agent will:

1. **Read** the raw markdown
2. **Analyze** with DeepSeek R1 reasoning model
3. **Extract structured knowledge**:
   - `title` — Clear heading
   - `area` — Domain (backend, commands, integration, etc.)
   - `tipo` — Type (guia, referencia, procedimiento, etc.)
   - `resumen` — 1-2 sentences with searchable terms
   - `tags` — Auto-generated tags
   - `frontmatter` — YAML metadata

4. **Write** to vault as individual markdown notes
5. **Create cross-references** between related notes
6. **Index** for RAG search

### Example Output

Input: `03-commands-slash.md` (2000 lines, 50+ commands)

Output: Multiple notes like:
```markdown
---
title: "/spec.run Command"
area: backend
tipo: referencia
resumen: "Execute spec-driven development code generation for current phase; uses LLM specialists and QA review"
tags: ["spec", "commands", "code-generation"]
source_ref: "03-commands-slash.md"
---

Execute code generation for current phase using specialist agents...
```

---

## ✅ Verification

After processing, check for success:

```bash
# Should contain processed notes
ls "C:\Users\mairon.cuello\development\workspace-ia\agent-framework-examples\bk-agent-vault\processed"

# Should contain any failed files (if any)
ls "C:\Users\mairon.cuello\development\workspace-ia\agent-framework-examples\bk-agent-vault\failed"

# Check vault structure
ls "C:\Users\mairon.cuello\development\workspace-ia\agent-framework-examples\bk-agent-vault\04-Recursos\Backend\bk-agent-knowledge"
```

Expected: 100+ semantic notes, organized by area, indexed with embeddings.

---

## 🎯 Next Steps After Curation

Once curator-agent finishes:

1. **Create RAG Index** — knowledge-agent will index the curated notes
   ```bash
   npx knowledge-agent /reindex
   ```

2. **Verify Search Works** — Query the vault
   ```bash
   npx knowledge-agent
   > ¿Cuáles son los parámetros de /spec.run?
   ```

3. **Set Up MCP Server** — Expose as service for Claude Code, bk-agent, OpenCode
   (See `documentation/15-mcp-knowledge-service-strategy.md`)

---

## 🐛 Troubleshooting

### "CURATOR_API_KEY is not set"
```bash
# PowerShell: Set environment variable
$env:CURATOR_API_KEY = "sk-your-key"

# Then verify
echo $env:CURATOR_API_KEY
```

### "CURATOR_VAULT_PATH does not exist"
```bash
# Make sure path is absolute and correct
# Windows path: C:\Users\...
# NOT relative: ./bk-agent-vault

# Check it exists
Test-Path "C:\Users\mairon.cuello\development\workspace-ia\agent-framework-examples\bk-agent-vault"
```

### "deepseek-reasoner not available"
- Check API key is valid
- Check you have credits on your DeepSeek account
- Try `deepseek-chat` instead (faster, lower cost)

### Files moved to `failed/`
- Check curator logs for specific error
- Usually because: invalid API key, document too large, or rate limit
- Try again or use a different provider (OpenAI, Anthropic, Ollama)

### No output in vault
- Check CURATOR_VAULT_PATH is correct
- Verify source files exist and are readable
- Check disk space

---

## 📊 Provider Comparison

| Provider | Speed | Cost | Quality | Reasoning | Best For |
|----------|-------|------|---------|-----------|----------|
| **deepseek-reasoner** | Slower | Low | Excellent | Yes | Technical docs (recommended) |
| **deepseek-chat** | Fast | Very low | Good | No | Simple notes, quick processing |
| **openai** (o3-mini) | Medium | Medium | Excellent | Yes | Complex documents |
| **anthropic** (opus-4-8) | Slower | High | Best | Yes | Legal/regulatory docs |
| **ollama** (local) | Fast | Free | Good | No | Private vault, no API calls |

**For bk-agent documentation:** Use `deepseek-reasoner` (recommended) or `anthropic/claude-opus-4-8` for best semantic extraction.

---

## 💡 Tips

1. **Start with a small subset** — Test with one file first
2. **Monitor tokens** — DeepSeek charges per token; estimate ~2-5k tokens per file
3. **Use area hints** — Helps curator classify correctly
4. **Chain processing** — Process by topic (commands first, then agents, then advanced)

---

## 🔗 References

- **Curator-Agent GitHub:** https://github.com/backendkit-labs/curator-agent
- **DeepSeek API:** https://api.deepseek.com
- **Full Curator Config:** See `~/.env.example` in curator-agent package

---

**Status:** Ready to process  
**Estimated Time:** 5-10 minutes for all 15 files  
**Next:** Run curator-agent → Create RAG index → Test with knowledge-agent
