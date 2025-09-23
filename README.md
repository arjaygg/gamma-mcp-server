# Gamma MCP Server

An MCP (Model Context Protocol) server for the Gamma API, enabling AI assistants to create presentations, documents, and social content using Gamma's generation capabilities.

🔗 **GitHub Repository**: [https://github.com/CryptoJym/gamma-mcp-server](https://github.com/CryptoJym/gamma-mcp-server)

## Features

- 🎨 Generate presentations, documents, and social content
- 🎯 Customize text generation with different modes (generate, condense, preserve)
- 🧩 Fine-tune card splitting, layouts, and export targets (PDF/PPTX)
- 🖼️ Control image generation from sources such as AI, Unsplash, Giphy, or curated web results
- 📊 Configure text amount, tone, audience, and language with per-card density controls
- 🔒 Set workspace and external sharing permissions with one call
- 📚 Discover supported option values (formats, image sources, dimensions, etc.) via MCP tooling

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
DEFAULT_CARD_SPLIT=auto
# Comma-separated list, e.g. "pdf,pptx"
DEFAULT_EXPORT_AS=
# Apply when defaulting card dimensions, e.g. "16x9"
DEFAULT_CARD_DIMENSIONS=
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
- `inputText` (required): Text used to generate content (1–750k characters)
- `textMode`: Controls text generation mode (`generate`, `condense`, `preserve`)
- `format`: Output format (`presentation`, `document`, `social`)
- `themeName`: Visual theme for the content
- `numCards`: Number of cards (1–75, defaults respect `DEFAULT_NUM_CARDS` when `cardSplit=auto`)
- `cardSplit`: How Gamma splits cards (`auto`, `inputTextBreaks`)
- `additionalInstructions`: Extra layout/style guidance (≤500 chars)
- `exportAs`: Extra export format(s) (`pdf`, `pptx` or array of both)
- `textOptions`: Object with:
  - `amount`: Text volume per card (`brief`, `medium`, `detailed`, `extensive`)
  - `tone`: Content mood/voice (≤500 chars)
  - `audience`: Target readers (≤500 chars)
  - `language`: Output language code (see Gamma docs)
- `imageOptions`: Object with:
  - `source`: Image origin (`aiGenerated`, `pictographic`, `unsplash`, `webAllImages`, `webFreeToUse`, `webFreeToUseCommercially`, `giphy`, `placeholder`, `noImages`)
  - `model`: AI image generation model
  - `style`: Visual image style (≤500 chars)
- `cardOptions`: Object with:
  - `dimensions`: Aspect/page size (e.g. `16x9`, `4x3`, `pageless`, `4x5`)
- `sharingOptions`: Object with:
  - `workspaceAccess`: Internal workspace sharing permissions (`noAccess`, `view`, `comment`, `edit`, `fullAccess`)
  - `externalAccess`: External sharing permissions (`noAccess`, `view`, `comment`, `edit`)

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

#### `gamma_describe_options`
List the accepted option values supported by the Gamma API (formats, image sources, dimensions, permissions, etc.).

**Parameters:**
- `category`: Optional filter (`textModes`, `formats`, `textAmounts`, `imageSources`, `cardSplits`, `exportTypes`, `cardDimensions`, `cardDimensionsByFormat`, `workspaceAccessLevels`, `externalAccessLevels`)
- `format`: Optional format filter when requesting card dimensions

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