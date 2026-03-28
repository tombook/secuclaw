import type { LLMProvider, LLMProviderConfig, ChatMessage, ChatOptions, ChatResponse } from './types.js';
import { Sanitizer } from './sanitizer.js';

export class OllamaProvider implements LLMProvider {
  private config: LLMProviderConfig;

  constructor(config: LLMProviderConfig) {
    this.config = config;
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const url = `${this.config.baseUrl}/api/chat`;
    const payload = {
      model: options?.model ?? (this.config.models?.[0] ?? 'default'),
      messages: Sanitizer.sanitize(messages),
      stream: false,
      options: {
        temperature: options?.temperature ?? 0,
        top_p: options?.topP ?? 1
      }
    };
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) {
      throw new Error(`Ollama chat request failed: ${resp.status} ${resp.statusText}`);
    }
    const data: any = await resp.json();
    const content = data?.message?.content ?? '';
    const model = data?.model ?? payload.model;
    const finishReason = data?.done ? 'completed' : 'in_progress';
    return { content, model, provider: this.config.type, finishReason };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const resp = await fetch(`${this.config.baseUrl}/api/tags`);
      return resp.ok;
    } catch {
      return false;
    }
  }
}
