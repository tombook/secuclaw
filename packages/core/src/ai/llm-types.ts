// ==================== LLM Provider Types ====================

export type LLMProviderType = 'openai' | 'anthropic' | 'ollama' | 'bigmodel' | 'minimax';

export interface LLMConfig {
  provider: LLMProviderType;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  timeout?: number; // milliseconds, default 10000
  temperature?: number; // 0-1, default 0.3
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMChatRequest {
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface LLMChatResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
}

// ==================== LLM Error ====================

export enum LLMErrorCode {
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  TIMEOUT = 'TIMEOUT',
  INVALID_CONFIG = 'INVALID_CONFIG',
  RATE_LIMIT = 'RATE_LIMIT',
  AUTH_FAILED = 'AUTH_FAILED',
}

export class LLMError extends Error {
  constructor(
    public code: LLMErrorCode,
    message: string,
    public provider?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'LLMError';
  }
}
