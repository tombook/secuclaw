import { LLMConfig, LLMChatRequest, LLMChatResponse, LLMError, LLMErrorCode } from './llm-types.js';
import { OpenAIProvider } from './providers/openai.js';
import { AnthropicProvider } from './providers/anthropic.js';
import { OllamaProvider } from './providers/ollama.js';
import { BigModelProvider } from './providers/bigmodel.js';
import { MiniMaxProvider } from './providers/minimax.js';

export interface LLMProvider {
  chat(request: LLMChatRequest): Promise<LLMChatResponse>;
}

export class LLMService {
  private provider: LLMProvider;
  private config: LLMConfig;
  private timeout: number;

  constructor(config: LLMConfig) {
    this.config = config;
    this.timeout = config.timeout ?? 10000;
    this.provider = this.createProvider(config);
  }

  private createProvider(config: LLMConfig): LLMProvider {
    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'anthropic':
        return new AnthropicProvider(config);
      case 'ollama':
        return new OllamaProvider(config);
      case 'bigmodel':
      case 'zhipu':
        return new BigModelProvider(config);
      case 'minimax':
        return new MiniMaxProvider(config);
      default:
        throw new LLMError(
          LLMErrorCode.INVALID_CONFIG,
          `Unknown LLM provider: ${config.provider}`
        );
    }
  }

  async chat(messages: import('./llm-types.js').LLMMessage[]): Promise<LLMChatResponse> {
    const request: LLMChatRequest = {
      messages,
      temperature: this.config.temperature ?? 0.3,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await this.provider.chat({
        ...request,
        signal: controller.signal as any,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new LLMError(
            LLMErrorCode.TIMEOUT,
            `LLM request timed out after ${this.timeout}ms`,
            this.config.provider
          );
        }
        throw new LLMError(
          LLMErrorCode.PROVIDER_ERROR,
          error.message,
          this.config.provider,
          error
        );
      }
      throw error;
    }
  }

  getConfig(): LLMConfig {
    return { ...this.config };
  }
}
