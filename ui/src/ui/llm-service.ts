/**
 * LLM Service - LLM服务
 * 
 * 调用后端已实现的LLM提供商管理API
 */
import { gatewayClient } from './gateway-client.js';

// ============ Types ============

export interface LLMProvider {
  id: string;
  name: string;
  type: string;
  baseUrl: string;
  apiKey: string;
  models: string[];
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface LLMChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMChatRequest {
  providerId: string;
  model: string;
  messages: LLMChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface LLMChatResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMParallelChatRequest {
  providerIds?: string[];
  model?: string;
  messages: LLMChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface LLMParallelChatSuccessResult {
  success: true;
  providerId: string;
  providerName: string;
  providerType: string;
  message: { role: 'assistant'; content: string };
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMParallelChatErrorResult {
  success: false;
  providerId: string;
  providerName: string;
  providerType: string;
  error: string;
}

export type LLMParallelChatResult = LLMParallelChatSuccessResult | LLMParallelChatErrorResult;

export interface LLMParallelChatResponse {
  results: LLMParallelChatResult[];
  total: number;
  successCount: number;
  errorCount: number;
}

// ============ LLM Service ============

class LLMService {
  // ==================== Providers ====================

  async listProviders(): Promise<LLMProvider[]> {
    return gatewayClient.request('llm.providers.list', {});
  }

  async addProvider(provider: Omit<LLMProvider, 'id' | 'createdAt' | 'updatedAt'>): Promise<LLMProvider> {
    return gatewayClient.request('llm.providers.add', provider);
  }

  async updateProvider(id: string, updates: Partial<LLMProvider>): Promise<LLMProvider> {
    return gatewayClient.request('llm.providers.update', { id, ...updates });
  }

  async deleteProvider(id: string): Promise<void> {
    return gatewayClient.request('llm.providers.delete', { id });
  }

  // ==================== Chat ====================

  async chat(request: LLMChatRequest): Promise<LLMChatResponse> {
    return gatewayClient.request('llm.chat', request as unknown as Record<string, unknown>);
  }

  async chatParallel(request: LLMParallelChatRequest): Promise<LLMParallelChatResponse> {
    return gatewayClient.request('llm.chat.parallel', request as unknown as Record<string, unknown>);
  }
}

export const llmService = new LLMService();

// ============ Mock Data ============

export const mockLLMProviders: LLMProvider[] = [
  {
    id: 'provider-openai',
    name: 'OpenAI',
    type: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: 'sk-***',
    models: ['gpt-4', 'gpt-3.5-turbo'],
    enabled: true,
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 7,
  },
  {
    id: 'provider-anthropic',
    name: 'Anthropic Claude',
    type: 'anthropic',
    baseUrl: 'https://api.anthropic.com',
    apiKey: 'sk-***',
    models: ['claude-3-opus', 'claude-3-sonnet'],
    enabled: true,
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'provider-local',
    name: 'Local Ollama',
    type: 'ollama',
    baseUrl: 'http://localhost:11434',
    apiKey: '',
    models: ['llama2', 'mistral', 'codellama'],
    enabled: false,
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 1,
  },
];
