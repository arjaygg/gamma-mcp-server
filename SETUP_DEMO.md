# Interactive Setup Demo

## New Interactive Setup Process

The `setup-claude.sh` script now features an **interactive API key prompt** for a seamless setup experience!

### 🎯 What's New

Previously, you had to:
1. Manually edit `.env` file
2. Copy/paste API key
3. Save the file
4. Run the script

**Now**, you just:
1. Run `./setup-claude.sh`
2. Enter your API key when prompted
3. Done! ✨

---

## 📋 Step-by-Step Demo

### Scenario 1: First Time Setup (No .env file)

```bash
$ ./setup-claude.sh

🚀 Setting up Gamma MCP Server for Claude Desktop
================================================
⚠️  .env file not found. Creating from .env.example...

📝 Gamma API Key Required
   Get your API key from: https://developers.gamma.app

Enter your Gamma API key: sk-gamma-abc123xyz789...
✅ API key saved to .env file

📋 Add this to your Claude Desktop configuration:
   ~/Library/Application Support/Claude/claude_desktop_config.json

{
  "mcpServers": {
    "gamma": {
      "command": "node",
      "args": ["/path/to/gamma-mcp-server/dist/index.js"],
      "env": {
        "GAMMA_API_KEY": "sk-gamma-abc123xyz789..."
      }
    }
  }
}

✅ After adding this configuration:
   1. Restart Claude Desktop
   2. Look for 'gamma' in the MCP tools list
   3. Try: 'Use gamma_generate to create a presentation about AI'
```

---

### Scenario 2: .env Exists but API Key Not Set

```bash
$ ./setup-claude.sh

🚀 Setting up Gamma MCP Server for Claude Desktop
================================================

📝 Gamma API Key Required
   Get your API key from: https://developers.gamma.app

Enter your Gamma API key: sk-gamma-mykey123...
✅ API key saved to .env file

📋 Add this to your Claude Desktop configuration:
   [Configuration JSON appears here...]
```

---

### Scenario 3: Invalid API Key Format (Warning)

```bash
$ ./setup-claude.sh

🚀 Setting up Gamma MCP Server for Claude Desktop
================================================

📝 Gamma API Key Required
   Get your API key from: https://developers.gamma.app

Enter your Gamma API key: abc123-wrong-format
⚠️  Warning: API key should start with 'sk-gamma-'
Continue anyway? (y/N): n
❌ Setup cancelled
```

---

### Scenario 4: Empty API Key (Error)

```bash
$ ./setup-claude.sh

🚀 Setting up Gamma MCP Server for Claude Desktop
================================================

📝 Gamma API Key Required
   Get your API key from: https://developers.gamma.app

Enter your Gamma API key: [just pressed Enter]
❌ Error: API key cannot be empty
```

---

### Scenario 5: API Key Already Configured

```bash
$ ./setup-claude.sh

🚀 Setting up Gamma MCP Server for Claude Desktop
================================================

📋 Add this to your Claude Desktop configuration:
   ~/Library/Application Support/Claude/claude_desktop_config.json

{
  "mcpServers": {
    "gamma": {
      [Configuration with existing key...]
    }
  }
}

✅ After adding this configuration:
   [Instructions...]
```

*Script detects existing valid API key and skips the prompt!*

---

## 🎨 Features

### ✅ Smart Detection
- Checks if `.env` exists, creates if needed
- Detects placeholder API keys
- Detects empty API keys
- Skips prompt if valid key already exists

### ✅ Validation
- **Format check**: Ensures key starts with `sk-gamma-`
- **Empty check**: Prevents empty submissions
- **User confirmation**: Allows override of format warning

### ✅ Cross-Platform
- Works on **macOS** (uses `sed -i ''`)
- Works on **Linux** (uses `sed -i`)
- Auto-detects OS type

### ✅ Safe Updates
- Creates `.env` from example if missing
- Updates existing `GAMMA_API_KEY` line
- Adds new line if not present
- Preserves other environment variables

---

## 🚀 Quick Start

```bash
# Make executable (first time only)
chmod +x setup-claude.sh

# Run the interactive setup
./setup-claude.sh

# Follow the prompts, then:
# 1. Copy the JSON output
# 2. Paste into Claude Desktop config
# 3. Restart Claude Desktop
# 4. Start creating presentations!
```

---

## 🔒 Security Notes

- Your API key is stored in `.env` (gitignored)
- The key is displayed in terminal output for the Claude config
- Don't run in shared/recorded terminals
- The script validates key format to prevent mistakes

---

## 💡 Pro Tips

**Tip 1: Quick Re-setup**
If you need to change your API key:
```bash
# Just run the script again with a new key
./setup-claude.sh
# Enter new key when prompted
```

**Tip 2: Manual Override**
You can still manually edit `.env` if you prefer:
```bash
nano .env
# Edit GAMMA_API_KEY=your-key-here
# Run ./setup-claude.sh (it will detect and use it)
```

**Tip 3: Environment Variables**
For CI/CD or automated deployments:
```bash
# Set environment variable before running
export GAMMA_API_KEY=sk-gamma-your-key
./setup-claude.sh
```

---

## 🎯 What Makes This Better?

| Old Process | New Process |
|-------------|-------------|
| 5 steps | 2 steps |
| Manual file editing | Interactive prompt |
| Risk of typos | Validated input |
| No format checking | Auto-validation |
| Multiple tools | Single script |

**Result:** Faster, safer, easier setup! 🎉
