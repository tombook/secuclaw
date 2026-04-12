import { LLMConfig, LLMChatRequest, LLMChatResponse, LLMError, LLMErrorCode } from '../llm-types.js';
import type { LLMProvider } from '../llm-service.js';

export class OllamaProvider implements LLMProvider {
  private baseUrl: string;
  private model: string;

  constructor(config: LLMConfig) {
    this.baseUrl = (config.baseUrl || 'http://localhost:11434').replace(/\/$/, '');
    this.model = config.model || 'llama2';
  }

  async chat(request: LLMChatRequest): Promise<LLMChatResponse> {
    const systemMessage = request.messages.find(m => m.role === 'system');
    const otherMessages = request.messages.filter(m => m.role !== 'system');

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          ...(systemMessage ? [{ role: 'system', content: systemMessage.content }] : []),
          ...otherMessages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          })),
        ],
        options: {
          temperature: request.temperature ?? 0.3,
        },
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new LLMError(
        LLMErrorCode.PROVIDER_ERROR,
        `Ollama API error: ${response.status} - ${errorText}`,
        'ollama'
      );
    }

    const data = await response.json() as {
      message: { content: string };
    };

    return {
      content: data.message?.content || '',
      model: this.model,
    };
  }
}
