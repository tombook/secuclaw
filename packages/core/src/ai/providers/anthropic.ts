import { LLMConfig, LLMChatRequest, LLMChatResponse, LLMError, LLMErrorCode } from '../llm-types.js';
import type { LLMProvider } from '../llm-service.js';

export class AnthropicProvider implements LLMProvider {
  private baseUrl: string;
  private apiKey: string;
  private model: string;

  constructor(config: LLMConfig) {
    this.baseUrl = (config.baseUrl || 'https://api.anthropic.com').replace(/\/$/, '');
    this.apiKey = config.apiKey || '';
    this.model = config.model || 'claude-3-opus-20240229';
  }

  async chat(request: LLMChatRequest): Promise<LLMChatResponse> {
    if (!this.apiKey) {
      throw new LLMError(
        LLMErrorCode.INVALID_CONFIG,
        'Anthropic API key is required'
      );
    }

    const systemMessage = request.messages.find(m => m.role === 'system');
    const otherMessages = request.messages.filter(m => m.role !== 'system');

    const response = await fetch(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: this.model,
        messages: otherMessages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        system: systemMessage?.content,
        temperature: request.temperature ?? 0.3,
        max_tokens: request.maxTokens ?? 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new LLMError(
        LLMErrorCode.PROVIDER_ERROR,
        `Anthropic API error: ${response.status} - ${errorText}`,
        'anthropic'
      );
    }

    const data = await response.json() as {
      content: Array<{ type: string; text: string }>;
      usage?: { input_tokens: number; output_tokens: number };
    };

    const content = data.content[0]?.text || '';

    return {
      content,
      usage: data.usage ? {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      } : undefined,
      model: this.model,
    };
  }
}
