import type { LLMProviderConfig, LLMProvider } from './types.js';
import { OllamaProvider } from './ollama-provider.js';
import { OpenAIProvider } from './openai-provider.js';
import { AnthropicProvider } from './anthropic-provider.js';

export class ProviderFactory {
  static create(config: LLMProviderConfig): LLMProvider {
    switch (config.type) {
      case 'ollama':
        return new OllamaProvider(config);
      case 'openai':
        return new OpenAIProvider(config);
      case 'anthropic':
      case 'minimax':
      case 'zhipu':
      case 'volcengine':
        return new AnthropicProvider(config);
      case 'custom':
        return new OpenAIProvider(config);
      default:
        throw new Error(`Unknown provider type: ${config.type}`);
    }
  }
}
