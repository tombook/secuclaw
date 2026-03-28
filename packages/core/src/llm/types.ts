export type LLMProviderType = 'openai' | 'anthropic' | 'ollama' | 'volcengine' | 'custom';

export interface LLMProviderConfig {
  id: string;
  name: string;
  type: LLMProviderType;
  baseUrl: string;
  apiKey?: string;
  models: string[];
  enabled: boolean;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface ChatResponse {
  content: string;
  model: string;
  provider: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  finishReason?: string;
}

export interface LLMProvider {
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  isAvailable(): Promise<boolean>;
}
