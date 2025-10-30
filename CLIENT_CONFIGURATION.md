# Client Configuration Guide

## 🔐 Security-First Approach

This MCP server is designed to be **manually configured per project** rather than auto-configured globally. This provides:

- **Better security isolation** - Each project has its own configuration
- **Granular control** - Enable/disable servers as needed
- **Environment separation** - Different keys for dev/staging/prod
- **Audit trail** - Know exactly which projects have access

---

## ✅ Server Configuration & Validation

Before configuring any client, configure and validate the MCP server:

```bash
# Run the configuration script
./configure-server.sh

# This will:
# 1. Prompt for API key (if needed) and save to .env
# 2. Validate the API key format
# 3. Check the build and Node.js version
# 4. Confirm configuration is ready
```

---

## 🎯 Client Configuration

### Claude Desktop

**Location:** `~/Library/Application Support/Claude/claude_desktop_config.json`

#### Option 1: Project-Specific Configuration (Recommended)

Create different configurations for different projects:

```json
{
  "mcpServers": {
    "gamma-project-a": {
      "command": "node",
      "args": ["/path/to/gamma-mcp-server/dist/index.js"],
      "env": {
        "GAMMA_API_KEY": "sk-gamma-project-a-key"
      }
    },
    "gamma-project-b": {
      "command": "node",
      "args": ["/path/to/gamma-mcp-server/dist/index.js"],
      "env": {
        "GAMMA_API_KEY": "sk-gamma-project-b-key"
      }
    }
  }
}
```

**Benefits:**
- ✅ Different API keys per project
- ✅ Separate usage tracking
- ✅ Easy to disable specific projects
- ✅ Clear audit trail

#### Option 2: Environment-Based Configuration

Use different keys for different environments:

```json
{
  "mcpServers": {
    "gamma-dev": {
      "command": "node",
      "args": ["/path/to/gamma-mcp-server/dist/index.js"],
      "env": {
        "GAMMA_API_KEY": "sk-gamma-dev-key",
        "GAMMA_TIMEOUT_MS": "10000"
      }
    },
    "gamma-prod": {
      "command": "node",
      "args": ["/path/to/gamma-mcp-server/dist/index.js"],
      "env": {
        "GAMMA_API_KEY": "sk-gamma-prod-key",
        "GAMMA_MAX_RETRIES": "5",
        "GAMMA_TIMEOUT_MS": "30000"
      }
    }
  }
}
```

#### Option 3: Single Configuration (Simplest)

For single-project or personal use:

```json
{
  "mcpServers": {
    "gamma": {
      "command": "node",
      "args": ["/absolute/path/to/gamma-mcp-server/dist/index.js"],
      "env": {
        "GAMMA_API_KEY": "sk-gamma-your-key"
      }
    }
  }
}
```

---

## 🔧 Configuration Options

### Required

- **`GAMMA_API_KEY`** - Your Gamma API key (get from https://developers.gamma.app)

### Optional (with defaults)

- **`GAMMA_TIMEOUT_MS`** - Request timeout in milliseconds (default: 30000)
- **`GAMMA_MAX_RETRIES`** - Max retry attempts (default: 3)
- **`DEFAULT_NUM_CARDS`** - Default slide count (default: 10)
- **`DEFAULT_FORMAT`** - presentation, document, or social (default: presentation)
- **`DEFAULT_TEXT_MODE`** - generate, condense, or preserve (default: generate)
- **`DEFAULT_TEXT_AMOUNT`** - brief, medium, detailed, extensive (default: medium)
- **`DEFAULT_IMAGE_SOURCE`** - Image source preference (default: aiGenerated)

See `.env.example` for complete list.

---

## 🛡️ Security Best Practices

### 1. API Key Management

```bash
# ✅ DO: Use different keys per environment
gamma-dev-key: sk-gamma-dev-abc123...
gamma-staging-key: sk-gamma-staging-xyz789...
gamma-prod-key: sk-gamma-prod-def456...

# ❌ DON'T: Reuse the same key everywhere
```

### 2. Project Isolation

```json
// ✅ DO: Name servers descriptively
"gamma-client-acme": { ... }
"gamma-internal-tools": { ... }

// ❌ DON'T: Use generic names
"gamma": { ... }
"gamma2": { ... }
```

### 3. Environment Variables

```json
// ✅ DO: Keep keys in config files (not in code)
"env": {
  "GAMMA_API_KEY": "sk-gamma-..."
}

// ❌ DON'T: Hardcode in application code
const key = "sk-gamma-...";
```

### 4. Access Control

```bash
# Protect your config file
chmod 600 ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Regular key rotation
# Update keys every 90 days or after team changes
```

---

## 🧪 Testing Your Configuration

### Test 1: Configure & Validate Server

```bash
./configure-server.sh
# Should show: ✅ MCP Server Configuration Valid
```

### Test 2: Test MCP Protocol

```bash
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node dist/index.js
# Should return list of available tools
```

### Test 3: Test API Connection

```bash
GAMMA_API_KEY=your-key npm run test
# Should successfully connect and generate test content
```

### Test 4: Verify in Claude Desktop

1. Restart Claude Desktop after config changes
2. Check Claude Desktop logs (Help → View Logs)
3. Look for MCP connection messages
4. Try: "What MCP tools are available?"
5. Should see gamma_generate, gamma_get_themes, etc.

---

## 🔄 Managing Multiple Configurations

### Disable Specific Server

Comment out in config:

```json
{
  "mcpServers": {
    // Temporarily disabled
    // "gamma-old-project": { ... },
    
    "gamma-active-project": {
      "command": "node",
      "args": ["/path/to/gamma-mcp-server/dist/index.js"],
      "env": {
        "GAMMA_API_KEY": "sk-gamma-..."
      }
    }
  }
}
```

### Switch Between Environments

Use configuration profiles:

```bash
# Development
cp claude_desktop_config.dev.json claude_desktop_config.json

# Production
cp claude_desktop_config.prod.json claude_desktop_config.json

# Restart Claude Desktop
```

---

## 📊 Monitoring Usage

### Track by Project

With project-specific API keys, you can monitor usage per project via Gamma's dashboard.

### Log Analysis

Check Claude Desktop logs for MCP activity:

```bash
# macOS
tail -f ~/Library/Logs/Claude/mcp*.log

# Look for:
# - Connection events
# - Tool invocations
# - Error messages
```

---

## 🚨 Troubleshooting

### Server Not Appearing in Claude

1. **Check config path:**
   ```bash
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

2. **Verify JSON syntax:**
   ```bash
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | jq .
   ```

3. **Check absolute paths:**
   - Use full paths, not relative
   - No `~` or environment variables
   - Example: `/Users/you/projects/gamma-mcp-server/dist/index.js`

4. **Restart Claude Desktop completely**

### API Calls Failing

1. **Verify API key:**
   ```bash
   ./configure-server.sh
   ```

2. **Check logs for errors:**
   ```bash
   ~/Library/Logs/Claude/mcp*.log
   ```

3. **Test direct connection:**
   ```bash
   GAMMA_API_KEY=your-key npm run test
   ```

---

## 📚 Additional Resources

- **Security Policy:** See `SECURITY.md`
- **Environment Variables:** See `.env.example`
- **API Documentation:** https://developers.gamma.app
- **MCP Protocol:** https://modelcontextprotocol.io

---

## ✅ Quick Checklist

Before enabling in production:

- [ ] Server configured & validated via `./configure-server.sh`
- [ ] Unique API key per environment
- [ ] Config file has correct absolute paths
- [ ] API key format validated (starts with `sk-gamma-`)
- [ ] Tested with `npm run test`
- [ ] Claude Desktop restarted after config changes
- [ ] Server appears in Claude's MCP tools list
- [ ] Test generation successful
- [ ] Monitoring/logging configured
- [ ] Team members trained on security practices

---

**Remember: You control when and where this MCP server is enabled. Keep it secure! 🔐**
