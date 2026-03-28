import type { LLMProvider, LLMProviderConfig, ChatMessage, ChatOptions, ChatResponse } from './types.js';

export class OpenAIProvider implements LLMProvider {
  private config: LLMProviderConfig;

  constructor(config: LLMProviderConfig) {
    this.config = config;
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const baseUrl = this.config.baseUrl.endsWith('/') ? this.config.baseUrl.slice(0, -1) : this.config.baseUrl;
    const url = `${baseUrl}/chat/completions`;
    const payload: any = {
      model: options?.model ?? this.config.models[0] ?? 'default',
      messages,
      temperature: options?.temperature ?? 0,
      max_tokens: options?.maxTokens ?? 256,
      top_p: options?.topP ?? 1
    };
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey ?? ''}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) {
      throw new Error(`OpenAI-like chat request failed: ${resp.status} ${resp.statusText}`);
    }
    const data: any = await resp.json();
    const firstChoice = Array.isArray(data?.choices) ? data.choices[0] : null;
    const content = firstChoice?.message?.content ?? firstChoice?.text ?? '';
    const model = data?.model ?? payload.model;
    const usage = data?.usage ? {
      promptTokens: data.usage.prompt_tokens ?? 0,
      completionTokens: data.usage.completion_tokens ?? 0,
      totalTokens: data.usage.total_tokens ?? 0
    } : undefined;
    return { content, model, provider: this.config.type, usage };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const base = this.config.baseUrl.endsWith('/') ? this.config.baseUrl.slice(0, -1) : this.config.baseUrl;
      const resp = await fetch(`${base}/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey ?? ''}`
        }
      });
      return resp.ok;
    } catch {
      return false;
    }
  }
}
