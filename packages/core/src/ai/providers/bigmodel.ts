import { LLMConfig, LLMChatRequest, LLMChatResponse, LLMError, LLMErrorCode } from '../llm-types.js';
import type { LLMProvider } from '../llm-service.js';

export class BigModelProvider implements LLMProvider {
  private baseUrl: string;
  private apiKey: string;
  private model: string;

  constructor(config: LLMConfig) {
    this.baseUrl = (config.baseUrl || 'https://open.bigmodel.cn/api/coding/paas/v4').replace(/\/$/, '');
    this.apiKey = config.apiKey || '';
    this.model = config.model || 'glm-5';
  }

  async chat(request: LLMChatRequest): Promise<LLMChatResponse> {
    if (!this.apiKey) {
      throw new LLMError(
        LLMErrorCode.INVALID_CONFIG,
        'BigModel API key is required'
      );
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.3,
        max_tokens: request.maxTokens ?? 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new LLMError(
        LLMErrorCode.PROVIDER_ERROR,
        `BigModel API error: ${response.status} - ${errorText}`,
        'bigmodel'
      );
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    const content = data.choices[0]?.message?.content || '';

    return {
      content,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
      model: this.model,
    };
  }
}
