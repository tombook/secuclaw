import type { LLMProvider, LLMProviderConfig, ChatMessage, ChatOptions, ChatResponse } from './types.js';

export class AnthropicProvider implements LLMProvider {
  private config: LLMProviderConfig;

  constructor(config: LLMProviderConfig) {
    this.config = config;
  }

  private filterMessages(messages: ChatMessage[]): ChatMessage[] {
    return messages.filter(m => m.role === 'user' || m.role === 'assistant');
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const url = `${this.config.baseUrl}/messages`;
    const payload: any = {
      model: options?.model ?? this.config.models[0] ?? 'default',
      messages: this.filterMessages(messages),
      max_tokens: options?.maxTokens,
      temperature: options?.temperature ?? 0
    };
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey ?? '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(300000)
    });
    if (!resp.ok) {
      throw new Error(`Anthropic chat request failed: ${resp.status} ${resp.statusText}`);
    }
    const data: any = await resp.json();
    let content = '';
    if (Array.isArray(data?.content)) {
      content = data.content[0]?.text ?? '';
    } else if (data?.choices?.[0]?.message?.content) {
      content = data.choices[0].message.content;
    } else if (typeof data?.content === 'string') {
      content = data.content;
    } else if (data?.text) {
      content = data.text;
    }
    const model = data?.model ?? payload.model;
    return { content, model, provider: this.config.type };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const url = `${this.config.baseUrl}/messages`;
      const payload = {
        model: this.config.models[0] ?? 'default',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
        temperature: 0
      };
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey ?? '',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(payload)
      });
      return resp.ok || resp.status === 401;
    } catch {
      return false;
    }
  }
}
