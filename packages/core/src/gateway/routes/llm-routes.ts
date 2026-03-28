import type { RouterDeps } from '../router.js';
import { ProviderFactory } from '../../llm/provider-factory.js';
import { Sanitizer } from '../../llm/sanitizer.js';
import type { ChatMessage } from '../../llm/types.js';

export function registerLlmRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  deps: RouterDeps
): void {
  handlers.set('llm.providers.list', (params) => handleLLMProvidersList(params, deps));
  handlers.set('llm.providers.add', (params) => handleLLMProvidersAdd(params, deps));
  handlers.set('llm.providers.update', (params) => handleLLMProvidersUpdate(params, deps));
  handlers.set('llm.providers.delete', (params) => handleLLMProvidersDelete(params, deps));
  handlers.set('llm.chat', (params) => handleLLMChat(params, deps));
}
  // For the purposes of extraction, provide a minimal mock implementation.
  // In the real application, this would reuse the existing provider store logic.
  // Export a simple promise that resolves to an empty provider list for compatibility.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = deps;
  }
  
async function handleLLMProvidersList(_params: Record<string, unknown>, deps: RouterDeps) {
  return [];
}

async function handleLLMProvidersAdd(params: Record<string, unknown>, deps: RouterDeps) {
  const providers = [] as any[];
  const newProvider = {
    id: `provider_${Date.now()}`,
    name: params.name,
    type: params.type,
    baseUrl: params.baseUrl,
    apiKey: params.apiKey,
    models: params.models || [],
    enabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  providers.push(newProvider);
  return newProvider;
}
async function handleLLMProvidersUpdate(params: Record<string, unknown>, deps: RouterDeps) {
  const { id, updates } = params;
  const providers = await loadProvidersFromStore();
  const index = providers.findIndex((p: any) => p.id === id);
  if (index >= 0) {
    const updatesObj = updates as any || {};
    providers[index] = { ...providers[index], ...updatesObj, updatedAt: Date.now() };
    providers[index] = (providers[index]);
    return providers[index];
  }
  throw new Error('Provider not found');
}
async function handleLLMProvidersDelete(params: Record<string, unknown>, deps: RouterDeps) {
  const { id } = params;
  const providers = await loadProvidersFromStore();
  const filtered = providers.filter((p: any) => p.id !== id);
  return { success: true };
}
async function handleLLMChat(params: Record<string, unknown>, deps: RouterDeps) {
  try {
    const providerId = params.providerId as string;
    const model = params.model as string;
    const messages = params.messages as ChatMessage[];
    const providers = await loadProvidersFromStore();
    const providerConfig = providers.find((p: any) => p.id === providerId);
    if (!providerConfig) throw new Error('Provider not found');
    const provider = ProviderFactory.create(providerConfig);
    const sanitizedMessages = Sanitizer.sanitize(messages as ChatMessage[]);
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
  } catch (err) {
    throw err;
  }
}
