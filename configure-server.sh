#!/bin/bash

echo "🚀 Gamma MCP Server - Configuration & Validation"
echo "=================================================="

# Get the current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if .env exists, if not create it
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
fi

# Extract API key from .env
GAMMA_API_KEY=$(grep GAMMA_API_KEY "$SCRIPT_DIR/.env" | cut -d '=' -f2)

# Check if API key is set or is still the placeholder
if [ -z "$GAMMA_API_KEY" ] || [ "$GAMMA_API_KEY" = "sk-gamma-your-api-key-here" ]; then
    echo ""
    echo "📝 Gamma API Key Required"
    echo "   Get your API key from: https://developers.gamma.app"
    echo ""
    
    # Prompt for API key
    read -p "Enter your Gamma API key: " USER_API_KEY
    
    # Validate the API key format
    if [ -z "$USER_API_KEY" ]; then
        echo "❌ Error: API key cannot be empty"
        exit 1
    fi
    
    if [[ ! "$USER_API_KEY" =~ ^sk-gamma- ]]; then
        echo "⚠️  Warning: API key should start with 'sk-gamma-'"
        read -p "Continue anyway? (y/N): " CONTINUE
        if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
            echo "❌ Setup cancelled"
            exit 1
        fi
    fi
    
    # Update the .env file
    if grep -q "GAMMA_API_KEY=" "$SCRIPT_DIR/.env"; then
        # Replace existing line (macOS and Linux compatible)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^GAMMA_API_KEY=.*|GAMMA_API_KEY=$USER_API_KEY|" "$SCRIPT_DIR/.env"
        else
            sed -i "s|^GAMMA_API_KEY=.*|GAMMA_API_KEY=$USER_API_KEY|" "$SCRIPT_DIR/.env"
        fi
    else
        # Add new line
        echo "GAMMA_API_KEY=$USER_API_KEY" >> "$SCRIPT_DIR/.env"
    fi
    
    GAMMA_API_KEY="$USER_API_KEY"
    echo "✅ API key saved to .env file"
    echo ""
fi

# Validate the build
echo ""
echo "🔍 Validating MCP Server Configuration..."
echo ""

if [ ! -f "$SCRIPT_DIR/dist/index.js" ]; then
    echo "❌ Error: MCP server not built"
    echo "   Run: npm run build"
    exit 1
fi

if [ ! -f "$SCRIPT_DIR/package.json" ]; then
    echo "❌ Error: package.json not found"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Warning: Node.js version $NODE_VERSION detected"
    echo "   This project requires Node.js >= 18"
fi

echo "✅ MCP Server Configuration Valid"
echo ""
echo "📊 Configuration Summary:"
echo "   • Location: $SCRIPT_DIR"
echo "   • Entry Point: dist/index.js"
echo "   • API Key: Configured ✓"
echo "   • Node.js: v$(node -v | cut -d'v' -f2)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔐 Security Best Practice: Manual Client Configuration"
echo ""
echo "This MCP server is now ready to use. To connect it to a coding"
echo "agent (Claude Desktop, etc.), YOU should manually configure each"
echo "project separately for better security isolation."
echo ""
echo "📋 Example Configuration (for reference only):"
echo ""
echo "   Location: ~/Library/Application Support/Claude/claude_desktop_config.json"
echo ""
echo "   {"
echo "     \"mcpServers\": {"
echo "       \"gamma\": {"
echo "         \"command\": \"node\","
echo "         \"args\": [\"$SCRIPT_DIR/dist/index.js\"],"
echo "         \"env\": {"
echo "           \"GAMMA_API_KEY\": \"<your-key-here>\""
echo "         }"
echo "       }"
echo "     }"
echo "   }"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Recommendations:"
echo "   • Use different API keys per environment (dev/staging/prod)"
echo "   • Enable/disable MCP servers per project as needed"
echo "   • Review SECURITY.md for deployment best practices"
echo "   • Keep API keys in secure secret management systems"
echo ""
echo "✅ Server Ready! Configure your coding agent when needed."