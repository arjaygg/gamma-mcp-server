#!/bin/bash

echo "🚀 Setting up Gamma MCP Server for Claude Desktop"
echo "================================================"

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

# Create the configuration
echo ""
echo "📋 Add this to your Claude Desktop configuration:"
echo "   ~/Library/Application Support/Claude/claude_desktop_config.json"
echo ""
echo "{"
echo "  \"mcpServers\": {"
echo "    \"gamma\": {"
echo "      \"command\": \"node\","
echo "      \"args\": [\"$SCRIPT_DIR/dist/index.js\"],"
echo "      \"env\": {"
echo "        \"GAMMA_API_KEY\": \"$GAMMA_API_KEY\""
echo "      }"
echo "    }"
echo "  }"
echo "}"
echo ""
echo "✅ After adding this configuration:"
echo "   1. Restart Claude Desktop"
echo "   2. Look for 'gamma' in the MCP tools list"
echo "   3. Try: 'Use gamma_generate to create a presentation about AI'"