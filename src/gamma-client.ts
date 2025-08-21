import axios, { AxiosInstance } from 'axios';

export interface GenerateContentParams {
  inputText: string;
  textMode?: 'generate' | 'condense' | 'preserve';
  format?: 'presentation' | 'document' | 'social';
  themeName?: string;
  numCards?: number;
  textOptions?: {
    amount?: 'brief' | 'medium' | 'detailed';
    tone?: string;
    audience?: string;
    language?: string;
  };
  imageOptions?: {
    source?: 'aiGenerated' | 'unsplash' | 'giphy' | 'googleImages' | 'none';
    model?: string;
    style?: string;
  };
  sharingOptions?: {
    workspaceAccess?: string;
    externalAccess?: string;
  };
}

export interface GenerationResponse {
  generationId: string;
  status: string;
  url?: string;
  message?: string;
  error?: string;
}

export interface Theme {
  id: string;
  name: string;
  description?: string;
  preview?: string;
}

export class GammaClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: 'https://public-api.gamma.app',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async generateContent(params: GenerateContentParams): Promise<GenerationResponse> {
    try {
      // Build request body with defaults
      const requestBody: any = {
        inputText: params.inputText,
        textMode: params.textMode || process.env.DEFAULT_TEXT_MODE || 'generate',
        format: params.format || process.env.DEFAULT_FORMAT || 'presentation',
        numCards: params.numCards || parseInt(process.env.DEFAULT_NUM_CARDS || '10'),
      };

      if (params.themeName) {
        requestBody.themeName = params.themeName;
      }

      if (params.textOptions) {
        requestBody.textOptions = {
          amount: params.textOptions.amount || process.env.DEFAULT_TEXT_AMOUNT || 'medium',
          ...params.textOptions
        };
      }

      if (params.imageOptions) {
        requestBody.imageOptions = {
          source: params.imageOptions.source || process.env.DEFAULT_IMAGE_SOURCE || 'aiGenerated',
          ...params.imageOptions
        };
      }

      if (params.sharingOptions) {
        requestBody.sharingOptions = params.sharingOptions;
      }

      const response = await this.client.post('/v0.2/generations', requestBody);

      return {
        generationId: response.data.generationId || response.data.id,
        status: response.data.status || 'submitted',
        url: response.data.url,
        message: response.data.message || 'Generation request submitted successfully',
      };
    } catch (error: any) {
      if (error.response) {
        return {
          generationId: '',
          status: 'error',
          error: `API Error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`,
        };
      }
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }

  async getGenerationStatus(generationId: string): Promise<GenerationResponse> {
    try {
      // Note: This endpoint might not exist yet in the beta API
      // Adjust based on actual API documentation
      const response = await this.client.get(`/v0.2/generations/${generationId}`);
      
      return {
        generationId: generationId,
        status: response.data.status,
        url: response.data.url,
        message: response.data.message,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          generationId: generationId,
          status: 'not_found',
          error: 'Generation not found or status endpoint not available in beta',
        };
      }
      throw new Error(`Failed to get generation status: ${error.message}`);
    }
  }

  async getAvailableThemes(): Promise<Theme[]> {
    // Since the API is in beta, themes might be predefined
    // This is a placeholder implementation
    const defaultThemes: Theme[] = [
      { id: 'minimal', name: 'Minimal', description: 'Clean and simple design' },
      { id: 'modern', name: 'Modern', description: 'Contemporary and sleek' },
      { id: 'professional', name: 'Professional', description: 'Business-oriented design' },
      { id: 'creative', name: 'Creative', description: 'Artistic and colorful' },
      { id: 'dark', name: 'Dark', description: 'Dark mode theme' },
      { id: 'nature', name: 'Nature', description: 'Natural and organic feel' },
      { id: 'tech', name: 'Tech', description: 'Technology-focused design' },
      { id: 'vintage', name: 'Vintage', description: 'Classic and retro style' },
    ];

    try {
      // Try to fetch themes from API if endpoint exists
      const response = await this.client.get('/v0.2/themes');
      return response.data.themes || defaultThemes;
    } catch (error) {
      // Return default themes if API doesn't have theme endpoint yet
      return defaultThemes;
    }
  }
}