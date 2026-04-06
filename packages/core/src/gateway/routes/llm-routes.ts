import type { RouterDeps } from '../router.js';
import { ProviderFactory } from '../../llm/provider-factory.js';
import { Sanitizer } from '../../llm/sanitizer.js';
import type { ChatMessage } from '../../llm/types.js';
import { JsonStore } from '../../storage/json-store.js';

const PROVIDERS_KEY = 'llm/providers.json';
const store = new JsonStore('./data/storage');

interface LLMProvider {
  id: string;
  name: string;
  type: string;
  baseUrl: string;
  apiKey?: string;
  models: string[];
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

async function loadProviders(): Promise<LLMProvider[]> {
  const data = await store.get<LLMProvider[]>(PROVIDERS_KEY);
  return Array.isArray(data) ? data : [];
}

async function saveProviders(providers: LLMProvider[]): Promise<void> {
  await store.set(PROVIDERS_KEY, providers);
}

export function registerLlmRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  _deps: RouterDeps
): void {
  handlers.set('llm.providers.list', () => handleLLMProvidersList());
  handlers.set('llm.providers.add', (params) => handleLLMProvidersAdd(params));
  handlers.set('llm.providers.update', (params) => handleLLMProvidersUpdate(params));
  handlers.set('llm.providers.delete', (params) => handleLLMProvidersDelete(params));
  handlers.set('llm.chat', (params) => handleLLMChat(params));
  handlers.set('llm.chat.parallel', (params) => handleLLMChatParallel(params));
  handlers.set('llm.chat.collaborative', (params) => handleLLMChatCollaborative(params));
}

async function handleLLMProvidersList(): Promise<LLMProvider[]> {
  return loadProviders();
}

async function handleLLMProvidersAdd(params: Record<string, unknown>): Promise<LLMProvider> {
  const providers = await loadProviders();
  const newProvider: LLMProvider = {
    id: `provider_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: String(params.name || ''),
    type: String(params.type || 'custom'),
    baseUrl: String(params.baseUrl || ''),
    apiKey: params.apiKey ? String(params.apiKey) : undefined,
    models: Array.isArray(params.models) ? params.models.map(String) : [],
    enabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  providers.push(newProvider);
  await saveProviders(providers);
  return newProvider;
}

async function handleLLMProvidersUpdate(params: Record<string, unknown>): Promise<LLMProvider> {
  const id = String(params.id || '');
  const updates = (params.updates || {}) as Record<string, unknown>;
  const providers = await loadProviders();
  const index = providers.findIndex(p => p.id === id);
  if (index < 0) throw new Error('Provider not found');
  providers[index] = { ...providers[index], ...updates, updatedAt: Date.now() };
  await saveProviders(providers);
  return providers[index];
}

async function handleLLMProvidersDelete(params: Record<string, unknown>): Promise<{ success: boolean }> {
  const id = String(params.id || '');
  const providers = await loadProviders();
  await saveProviders(providers.filter(p => p.id !== id));
  return { success: true };
}

async function handleLLMChat(params: Record<string, unknown>) {
  const providerId = String(params.providerId || '');
  const model = String(params.model || '');
  const messages = params.messages as ChatMessage[];
  const providers = await loadProviders();
  const providerConfig = providers.find(p => p.id === providerId);
  if (!providerConfig) throw new Error('Provider not found');
  const provider = ProviderFactory.create(providerConfig as any);
  const sanitizedMessages = Sanitizer.sanitize(messages);
  const response = await provider.chat(sanitizedMessages, {
    model,
    temperature: params.temperature as number,
    maxTokens: params.maxTokens as number,
  });
  return {
    message: { role: 'assistant' as const, content: (response as any).content },
    providerId,
    model: (response as any).model ?? model,
    usage: (response as any).usage,
  };
}

async function handleLLMChatParallel(params: Record<string, unknown>) {
  const model = params.model as string | undefined;
  const messages = params.messages as ChatMessage[];
  const providerIds = params.providerIds as string[] | undefined;
  const providers = await loadProviders();

  let targetProviders = providers.filter(p => p.enabled);
  if (providerIds && Array.isArray(providerIds)) {
    targetProviders = targetProviders.filter(p => providerIds.includes(p.id));
  }

  if (targetProviders.length === 0) {
    throw new Error('No enabled LLM providers available');
  }

  const sanitizedMessages = Sanitizer.sanitize(messages);

  const results = await Promise.all(
    targetProviders.map(async (providerConfig) => {
      try {
        const provider = ProviderFactory.create(providerConfig as any);
        const response = await provider.chat(sanitizedMessages, {
          model: model ?? providerConfig.models[0],
          temperature: (params.temperature as number) ?? 0.1,
          maxTokens: (params.maxTokens as number) ?? 4096,
        });
        return {
          success: true as const,
          providerId: providerConfig.id,
          providerName: providerConfig.name,
          providerType: providerConfig.type,
          message: { role: 'assistant' as const, content: response.content },
          model: response.model,
          usage: response.usage,
        };
      } catch (error) {
        return {
          success: false as const,
          providerId: providerConfig.id,
          providerName: providerConfig.name,
          providerType: providerConfig.type,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    })
  );

  return {
    results,
    total: results.length,
    successCount: results.filter(r => r.success).length,
    errorCount: results.filter(r => !r.success).length,
  };
}

async function handleLLMChatCollaborative(params: Record<string, unknown>) {
  const prompt = String(params.prompt || '');
  const systemPrompt = String(
    params.systemPrompt ||
      '你是专业的软件架构分析师，擅长分析项目结构，提取核心功能，输出结构化的可执行落地步骤。输出内容要精准、详细、可直接执行。'
  );

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt },
  ];

  const parallelResult = (await handleLLMChatParallel({
    messages,
    temperature: 0.1,
    maxTokens: 8192,
  })) as { results: any[]; successCount: number; total: number };

  const successResults = parallelResult.results.filter((r: any) => r.success);

  if (successResults.length === 0) {
    throw new Error('All LLM providers failed to respond');
  }

  const aggregatedResult = {
    summary: '',
    detailedAnalysis: [] as string[],
    executionSteps: [] as string[],
    sources: successResults.map((r: any) => ({
      provider: r.providerName,
      content: r.message.content,
    })),
  };

  const allSteps = new Set<string>();
  successResults.forEach((result: any) => {
    const content = result.message.content;
    const stepMatches = content.match(/^\d+\.\s+.+$/gm) || [];
    stepMatches.forEach((step: string) => allSteps.add(step.trim()));

    const analysisMatches = content.match(/^[^\d].+$/gm) || [];
    analysisMatches.forEach((line: string) => {
      if (line.trim().length > 20) {
        aggregatedResult.detailedAnalysis.push(line.trim());
      }
    });
  });

  aggregatedResult.executionSteps = Array.from(allSteps).sort();
  aggregatedResult.summary = `基于${successResults.length}个LLM模型的协同分析，共提取${aggregatedResult.executionSteps.length}个可执行步骤。`;

  return {
    aggregated: aggregatedResult,
    rawResults: parallelResult.results,
    successCount: parallelResult.successCount,
    totalCount: parallelResult.total,
  };
}
