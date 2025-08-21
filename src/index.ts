#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { GammaClient } from './gamma-client.js';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const GenerateContentSchema = z.object({
  inputText: z.string().describe('Text used to generate content'),
  textMode: z.enum(['generate', 'condense', 'preserve']).optional().describe('Controls text generation mode'),
  format: z.enum(['presentation', 'document', 'social']).optional().describe('Output format type'),
  themeName: z.string().optional().describe('Visual theme for the content'),
  numCards: z.number().min(1).max(60).optional().describe('Number of cards (1-60)'),
  textOptions: z.object({
    amount: z.enum(['brief', 'medium', 'detailed']).optional(),
    tone: z.string().optional(),
    audience: z.string().optional(),
    language: z.string().optional()
  }).optional().describe('Text generation options'),
  imageOptions: z.object({
    source: z.enum(['aiGenerated', 'unsplash', 'giphy', 'googleImages', 'none']).optional(),
    model: z.string().optional(),
    style: z.string().optional()
  }).optional().describe('Image generation options'),
  sharingOptions: z.object({
    workspaceAccess: z.string().optional(),
    externalAccess: z.string().optional()
  }).optional().describe('Sharing permissions')
});

class GammaMcpServer {
  private server: Server;
  private gammaClient: GammaClient;

  constructor() {
    this.server = new Server(
      {
        name: 'gamma-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    const apiKey = process.env.GAMMA_API_KEY;
    if (!apiKey) {
      throw new Error('GAMMA_API_KEY environment variable is required');
    }

    this.gammaClient = new GammaClient(apiKey);
    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'gamma_generate',
          description: 'Generate a presentation, document, or social content using Gamma AI',
          inputSchema: {
            type: 'object',
            properties: {
              inputText: {
                type: 'string',
                description: 'Text used to generate content (required)'
              },
              textMode: {
                type: 'string',
                enum: ['generate', 'condense', 'preserve'],
                description: 'Controls text generation mode (default: generate)'
              },
              format: {
                type: 'string',
                enum: ['presentation', 'document', 'social'],
                description: 'Output format type (default: presentation)'
              },
              themeName: {
                type: 'string',
                description: 'Visual theme for the content'
              },
              numCards: {
                type: 'number',
                description: 'Number of cards (1-60, default: 10)'
              },
              textOptions: {
                type: 'object',
                properties: {
                  amount: {
                    type: 'string',
                    enum: ['brief', 'medium', 'detailed'],
                    description: 'Text volume'
                  },
                  tone: {
                    type: 'string',
                    description: 'Content mood/voice'
                  },
                  audience: {
                    type: 'string',
                    description: 'Target readers'
                  },
                  language: {
                    type: 'string',
                    description: 'Output language (default: English)'
                  }
                }
              },
              imageOptions: {
                type: 'object',
                properties: {
                  source: {
                    type: 'string',
                    enum: ['aiGenerated', 'unsplash', 'giphy', 'googleImages', 'none'],
                    description: 'Image origin'
                  },
                  model: {
                    type: 'string',
                    description: 'AI image generation model'
                  },
                  style: {
                    type: 'string',
                    description: 'Visual image style'
                  }
                }
              },
              sharingOptions: {
                type: 'object',
                properties: {
                  workspaceAccess: {
                    type: 'string',
                    description: 'Internal workspace sharing permissions'
                  },
                  externalAccess: {
                    type: 'string',
                    description: 'External sharing permissions'
                  }
                }
              }
            },
            required: ['inputText']
          }
        },
        {
          name: 'gamma_get_themes',
          description: 'Get available themes for Gamma presentations',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'gamma_get_status',
          description: 'Check the status of a generation request',
          inputSchema: {
            type: 'object',
            properties: {
              generationId: {
                type: 'string',
                description: 'The ID of the generation to check'
              }
            },
            required: ['generationId']
          }
        }
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case 'gamma_generate': {
            const params = GenerateContentSchema.parse(args);
            const result = await this.gammaClient.generateContent(params);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'gamma_get_themes': {
            const themes = await this.gammaClient.getAvailableThemes();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(themes, null, 2),
                },
              ],
            };
          }

          case 'gamma_get_status': {
            const { generationId } = args as { generationId: string };
            const status = await this.gammaClient.getGenerationStatus(generationId);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(status, null, 2),
                },
              ],
            };
          }

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Invalid parameters: ${error.errors.map(e => `${e.path}: ${e.message}`).join(', ')}`
          );
        }
        throw error;
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Gamma MCP server running on stdio');
  }
}

const server = new GammaMcpServer();
server.run().catch(console.error);