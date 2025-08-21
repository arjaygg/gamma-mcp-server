# Gamma MCP Server

An MCP (Model Context Protocol) server for the Gamma API, enabling AI assistants to create presentations, documents, and social content using Gamma's generation capabilities.

## Features

- 🎨 Generate presentations, documents, and social content
- 🎯 Customize text generation with different modes (generate, condense, preserve)
- 🖼️ Control image generation from various sources (AI, Unsplash, Giphy, etc.)
- 🎭 Apply different themes and styles
- 📊 Configure text amount, tone, audience, and language
- 🔒 Set sharing permissions for generated content

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/gamma-mcp-server.git
cd gamma-mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Add your Gamma API key:
```env
GAMMA_API_KEY=sk-gamma-your-api-key-here
```

3. (Optional) Configure default settings:
```env
DEFAULT_FORMAT=presentation
DEFAULT_NUM_CARDS=10
DEFAULT_TEXT_MODE=generate
DEFAULT_TEXT_AMOUNT=medium
DEFAULT_IMAGE_SOURCE=aiGenerated
```

## Usage

### With Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "gamma": {
      "command": "node",
      "args": ["/path/to/gamma-mcp-server/dist/index.js"],
      "env": {
        "GAMMA_API_KEY": "sk-gamma-your-api-key-here"
      }
    }
  }
}
```

### Available Tools

#### `gamma_generate`
Generate content using Gamma AI.

**Parameters:**
- `inputText` (required): Text used to generate content
- `textMode`: Controls text generation mode (`generate`, `condense`, `preserve`)
- `format`: Output format (`presentation`, `document`, `social`)
- `themeName`: Visual theme for the content
- `numCards`: Number of cards (1-60, default: 10)
- `textOptions`: Object with:
  - `amount`: Text volume (`brief`, `medium`, `detailed`)
  - `tone`: Content mood/voice
  - `audience`: Target readers
  - `language`: Output language
- `imageOptions`: Object with:
  - `source`: Image origin (`aiGenerated`, `unsplash`, `giphy`, `googleImages`, `none`)
  - `model`: AI image generation model
  - `style`: Visual image style
- `sharingOptions`: Object with:
  - `workspaceAccess`: Internal workspace sharing permissions
  - `externalAccess`: External sharing permissions

**Example:**
```javascript
{
  "inputText": "Create a presentation about the future of AI",
  "format": "presentation",
  "numCards": 12,
  "textOptions": {
    "amount": "detailed",
    "tone": "professional",
    "audience": "tech executives"
  },
  "imageOptions": {
    "source": "aiGenerated",
    "style": "futuristic"
  }
}
```

#### `gamma_get_themes`
Get available themes for Gamma presentations.

#### `gamma_get_status`
Check the status of a generation request.

**Parameters:**
- `generationId`: The ID of the generation to check

## Development

```bash
# Run in development mode
npm run dev

# Build the project
npm run build

# Start the server
npm start
```

## API Notes

- The Gamma API is currently in beta, so functionality and pricing may change
- API endpoint: `https://public-api.gamma.app/v0.2/generations`
- Authentication is done via `X-API-KEY` header
- Default values are applied when optional parameters are not specified

## Error Handling

The server handles various error scenarios:
- Missing API key
- Invalid parameters (validated with Zod)
- API errors with descriptive messages
- Network timeouts (30 second default)

## License

MIT