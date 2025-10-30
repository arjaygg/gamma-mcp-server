import axios, { AxiosError, AxiosInstance } from 'axios';
import {
  CARD_DIMENSIONS,
  CARD_DIMENSIONS_BY_FORMAT,
  CARD_SPLITS,
  EXPORT_TYPES,
  FORMATS,
  IMAGE_SOURCES,
  OPTION_REFERENCE,
  TEXT_AMOUNTS,
  TEXT_MODES,
  type CardDimension,
  type CardSplit,
  type ExternalAccessLevel,
  type Format,
  type ImageSource,
  type TextAmount,
  type TextMode,
  type WorkspaceAccessLevel,
  type ExportType,
} from './constants.js';

export interface TextOptionsInput {
  amount?: TextAmount;
  tone?: string;
  audience?: string;
  language?: string;
}

export interface ImageOptionsInput {
  source?: ImageSource;
  model?: string;
  style?: string;
}

export interface CardOptionsInput {
  dimensions?: CardDimension;
}

export interface SharingOptionsInput {
  workspaceAccess?: WorkspaceAccessLevel;
  externalAccess?: ExternalAccessLevel;
}

export interface GenerateContentParams {
  inputText: string;
  textMode?: TextMode;
  format?: Format;
  themeName?: string;
  numCards?: number;
  cardSplit?: CardSplit;
  additionalInstructions?: string;
  exportAs?: ExportType | ExportType[];
  textOptions?: TextOptionsInput;
  imageOptions?: ImageOptionsInput;
  cardOptions?: CardOptionsInput;
  sharingOptions?: SharingOptionsInput;
}

export interface GenerationResponse {
  generationId: string;
  status: string;
  url?: string;
  gammaUrl?: string;
  message?: string;
  error?: string;
  credits?: {
    deducted?: number;
    remaining?: number;
  };
}

export interface Theme {
  id: string;
  name: string;
  description?: string;
  preview?: string;
}

const DEFAULT_TIMEOUT_MS = 30000;
const MAX_NUM_CARDS = 75;
const MAX_BODY_LENGTH = 1_000_000; // 1MB
const MAX_CONTENT_LENGTH = 10_000_000; // 10MB
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

const normalizeEnum = <T extends readonly string[]>(value: string | undefined, allowed: T) => {
  if (!value) {
    return undefined;
  }
  return allowed.includes(value as T[number]) ? (value as T[number]) : undefined;
};

const parseDefaultExportTypes = (value: string | undefined): ExportType[] | undefined => {
  if (!value) {
    return undefined;
  }
  const parsed = value
    .split(',')
    .map((v) => v.trim())
    .filter((v): v is ExportType => (EXPORT_TYPES as readonly string[]).includes(v));
  return parsed.length ? parsed : undefined;
};

export class GammaClient {
  private client: AxiosInstance;
  private defaultNumCards: number;
  private defaultTextMode?: TextMode;
  private defaultFormat?: Format;
  private defaultCardSplit?: CardSplit;
  private defaultTextAmount?: TextAmount;
  private defaultImageSource?: ImageSource;
  private defaultExportAs?: ExportType | ExportType[];
  private defaultCardDimension?: CardDimension;
  private maxRetries: number;
  private version: string;

  constructor(apiKey: string) {
    // Validate API key format
    if (!apiKey || !apiKey.startsWith('sk-gamma-')) {
      throw new Error('Invalid API key format. API key must start with "sk-gamma-"');
    }
    
    this.version = '1.0.0'; // Should match package.json
    this.maxRetries = this.parseMaxRetries(process.env.GAMMA_MAX_RETRIES, MAX_RETRIES);
    
    const timeout = this.parseTimeout(process.env.GAMMA_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);
    
    this.client = axios.create({
      baseURL: 'https://public-api.gamma.app',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
        'User-Agent': `gamma-mcp-server/${this.version}`,
      },
      timeout,
      maxBodyLength: MAX_BODY_LENGTH,
      maxContentLength: MAX_CONTENT_LENGTH,
    });

    this.defaultNumCards = this.parseNumCards(process.env.DEFAULT_NUM_CARDS, 10);
    this.defaultTextMode = normalizeEnum(process.env.DEFAULT_TEXT_MODE, TEXT_MODES);
    this.defaultFormat = normalizeEnum(process.env.DEFAULT_FORMAT, FORMATS);
    this.defaultCardSplit = normalizeEnum(process.env.DEFAULT_CARD_SPLIT, CARD_SPLITS);
    this.defaultTextAmount = normalizeEnum(process.env.DEFAULT_TEXT_AMOUNT, TEXT_AMOUNTS);
    this.defaultImageSource = normalizeEnum(process.env.DEFAULT_IMAGE_SOURCE, IMAGE_SOURCES);
    this.defaultCardDimension = normalizeEnum(process.env.DEFAULT_CARD_DIMENSIONS, CARD_DIMENSIONS);
    this.defaultExportAs = parseDefaultExportTypes(process.env.DEFAULT_EXPORT_AS);
  }

  static getOptionReference() {
    return OPTION_REFERENCE;
  }

  async generateContent(params: GenerateContentParams): Promise<GenerationResponse> {
    return this.retryWithBackoff(async () => {
      const textMode = (params.textMode ?? this.defaultTextMode ?? 'generate') as TextMode;
      const format = (params.format ?? this.defaultFormat ?? 'presentation') as Format;
      const cardSplit = (params.cardSplit ?? this.defaultCardSplit ?? 'auto') as CardSplit;

      const requestBody: Record<string, unknown> = {
        inputText: params.inputText,
        textMode,
        format,
        cardSplit,
      };

      if (params.themeName) {
        requestBody.themeName = params.themeName;
      }

      const numCards = this.resolveNumCards(params.numCards, cardSplit);
      if (numCards) {
        requestBody.numCards = numCards;
      }

      if (params.additionalInstructions) {
        requestBody.additionalInstructions = params.additionalInstructions;
      }

      if (params.exportAs) {
        requestBody.exportAs = params.exportAs;
      } else if (this.defaultExportAs) {
        requestBody.exportAs = this.defaultExportAs;
      }

      const textOptions = this.buildTextOptions(params.textOptions);
      if (textOptions) {
        requestBody.textOptions = textOptions;
      }

      const imageOptions = this.buildImageOptions(params.imageOptions);
      if (imageOptions) {
        requestBody.imageOptions = imageOptions;
      }

      const cardOptions = this.buildCardOptions(params.cardOptions, format);
      if (cardOptions) {
        requestBody.cardOptions = cardOptions;
      }

      if (params.sharingOptions) {
        const sharingOptions = this.cleanObject(params.sharingOptions);
        if (sharingOptions) {
          requestBody.sharingOptions = sharingOptions;
        }
      }

      try {
        const response = await this.client.post('/v0.2/generations', requestBody);

        return {
          generationId: response.data.generationId || response.data.id,
          status: response.data.status || 'submitted',
          url: response.data.url || response.data.gammaUrl,
          gammaUrl: response.data.gammaUrl,
          message: response.data.message || 'Generation request submitted successfully',
          credits: response.data.credits,
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          return this.handleAxiosError(error);
        }
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to generate content: ${message}`);
      }
    });
  }

  async getGenerationStatus(generationId: string): Promise<GenerationResponse> {
    try {
      const response = await this.client.get(`/v0.2/generations/${generationId}`);
      return {
        generationId,
        status: response.data.status,
        url: response.data.url || response.data.gammaUrl,
        gammaUrl: response.data.gammaUrl,
        message: response.data.message,
        credits: response.data.credits,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          return {
            generationId,
            status: 'not_found',
            error: 'Generation not found or status endpoint not available in beta',
          };
        }
        return this.handleAxiosError(error, generationId);
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get generation status: ${message}`);
    }
  }

  async getAvailableThemes(): Promise<Theme[]> {
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
      const response = await this.client.get('/v0.2/themes');
      return response.data.themes || defaultThemes;
    } catch {
      return defaultThemes;
    }
  }

  private resolveNumCards(requested: number | undefined, cardSplit?: CardSplit): number | undefined {
    if (requested !== undefined) {
      return Math.max(1, Math.min(MAX_NUM_CARDS, requested));
    }

    if (cardSplit === 'auto') {
      return Math.max(1, Math.min(MAX_NUM_CARDS, this.defaultNumCards));
    }

    return undefined;
  }

  private parseNumCards(value: string | undefined, fallback: number): number {
    if (!value) {
      return fallback;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  private parseTimeout(value: string | undefined, fallback: number): number {
    if (!value) {
      return fallback;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  private parseMaxRetries(value: string | undefined, fallback: number): number {
    if (!value) {
      return fallback;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  }

  private buildTextOptions(options?: TextOptionsInput) {
    const merged: TextOptionsInput = {
      amount: options?.amount ?? this.defaultTextAmount ?? 'medium',
      tone: options?.tone,
      audience: options?.audience,
      language: options?.language,
    };
    return this.cleanObject(merged);
  }

  private buildImageOptions(options?: ImageOptionsInput) {
    const merged: ImageOptionsInput = {
      source: options?.source ?? this.defaultImageSource ?? 'aiGenerated',
      model: options?.model,
      style: options?.style,
    };
    return this.cleanObject(merged);
  }

  private buildCardOptions(options: CardOptionsInput | undefined, format: Format) {
    const dimension = options?.dimensions ?? this.defaultCardDimension;
    if (!dimension) {
      return undefined;
    }

    const allowedDimensions = CARD_DIMENSIONS_BY_FORMAT[format] as readonly string[] | undefined;
    if (allowedDimensions && !allowedDimensions.includes(dimension)) {
      return undefined;
    }

    return { dimensions: dimension };
  }

  private cleanObject<T extends object>(obj: T): Partial<T> | undefined {
    const entries = Object.entries(obj as Record<string, unknown>).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    );
    if (!entries.length) {
      return undefined;
    }
    return Object.fromEntries(entries) as Partial<T>;
  }

  private handleAxiosError(error: AxiosError, generationId?: string): GenerationResponse {
    const status = error.response?.status;
    const statusText = error.response?.statusText;
    const message = (error.response?.data as { message?: string } | undefined)?.message;

    if (status) {
      return {
        generationId: generationId ?? '',
        status: 'error',
        error: `API Error: ${status} - ${message ?? statusText ?? 'Unknown error'}`,
      };
    }

    if (error.code === 'ECONNABORTED') {
      return {
        generationId: generationId ?? '',
        status: 'timeout',
        error: 'Request timed out while waiting for Gamma API response',
      };
    }

    return {
      generationId: generationId ?? '',
      status: 'error',
      error: `Network error: ${error.message}`,
    };
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    attempt: number = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // Don't retry if max retries reached
      if (attempt >= this.maxRetries) {
        throw error;
      }

      // Check if error is retryable
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        
        // Don't retry client errors (except 429)
        if (status && status >= 400 && status < 500 && status !== 429) {
          throw error;
        }

        // Handle rate limiting (429) with Retry-After header
        if (status === 429) {
          const retryAfter = error.response?.headers['retry-after'];
          const delayMs = retryAfter 
            ? parseInt(retryAfter, 10) * 1000 
            : this.calculateBackoffDelay(attempt);
          
          console.error(`Rate limited (429). Retrying after ${delayMs}ms...`);
          await this.sleep(delayMs);
          return this.retryWithBackoff(operation, attempt + 1);
        }

        // Retry server errors (5xx) and network errors with exponential backoff
        if (!status || status >= 500) {
          const delayMs = this.calculateBackoffDelay(attempt);
          console.error(`Request failed (attempt ${attempt + 1}/${this.maxRetries}). Retrying after ${delayMs}ms...`);
          await this.sleep(delayMs);
          return this.retryWithBackoff(operation, attempt + 1);
        }
      }

      // Non-Axios errors or non-retryable errors
      throw error;
    }
  }

  private calculateBackoffDelay(attempt: number): number {
    // Exponential backoff with jitter: base * 2^attempt + random jitter
    const exponentialDelay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
    const jitter = Math.random() * 1000; // 0-1000ms jitter
    return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
