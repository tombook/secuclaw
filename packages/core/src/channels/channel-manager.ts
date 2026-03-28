import type { JsonStore } from '../storage/json-store.js';
import { EmailProvider } from './email-provider';
import { WebhookProvider } from './webhook-provider';
import type { ChannelConfig, NotificationMessage, SendResult, ChannelProvider } from './types';

export class ChannelManager {
  private providers = new Map<string, ChannelProvider>();
  private configs = new Map<string, ChannelConfig>();

  static readonly SUPPORTED_CHANNELS = [
    'email', 'webhook', 'feishu', 'telegram', 'slack', 'discord', 'teams', 'nostr', 'google-chat', 'whatsapp', 'signal', 'imessage'
  ];

  constructor(private store: JsonStore) {
    this.registerProvider(new EmailProvider());
    this.registerProvider(new WebhookProvider());
  }

  registerProvider(provider: ChannelProvider): void {
    this.providers.set(provider.type, provider);
  }

  private async loadFromStore(channelId: string): Promise<ChannelConfig | null> {
    const path = `channels/${channelId}.json`;
    const storeAny: any = this.store as any;
    const raw = await (storeAny.readJson?.(path) ?? storeAny.read?.(path));
    if (!raw) return null;
    const cfg = raw as ChannelConfig;
    // cache in memory
    this.configs.set(channelId, cfg);
    return cfg;
  }

  private async saveToStore(channelId: string, config: ChannelConfig): Promise<void> {
    const path = `channels/${channelId}.json`;
    const storeAny: any = this.store as any;
    await (storeAny.writeJson?.(path, config) ?? storeAny.write?.(path, config));
    this.configs.set(channelId, config);
  }

  async loadConfig(channelId: string): Promise<ChannelConfig | null> {
    // try in-memory cache first
    const cached = this.configs.get(channelId) ?? null;
    if (cached) return cached;
    return this.loadFromStore(channelId);
  }

  async saveConfig(channelId: string, config: ChannelConfig): Promise<void> {
    await this.saveToStore(channelId, config);
  }

  async send(channelId: string, message: NotificationMessage): Promise<SendResult> {
    const config = await this.loadConfig(channelId);
    if (!config) {
      return { success: false, channelId, message: 'No config for channel', timestamp: Date.now() };
    }
    const provider = this.providers.get(config.id as string);
    if (!provider) {
      return { success: false, channelId, message: 'No provider for channel', timestamp: Date.now() };
    }
    if (!provider.validate(config)) {
      return { success: false, channelId, message: 'Invalid channel config', timestamp: Date.now() };
    }
    try {
      return await provider.send(message, config);
    } catch (err) {
      return { success: false, channelId, message: String(err), timestamp: Date.now() };
    }
  }

  async sendAll(message: NotificationMessage): Promise<SendResult[]> {
    const results: SendResult[] = [];
    for (const ch of ChannelManager.SUPPORTED_CHANNELS) {
      const cfg = await this.loadConfig(ch);
      if (cfg && cfg.enabled) {
        const provider = this.providers.get(cfg.id as string);
        if (provider && provider.validate(cfg)) {
          const r = await provider.send(message, cfg);
          results.push(r);
        }
      }
    }
    return results;
  }

  async getStatus(): Promise<Array<{ id: string; name: string; connected: boolean; enabled: boolean }>> {
    const statuses: Array<{ id: string; name: string; connected: boolean; enabled: boolean }> = [];
    for (const id of ChannelManager.SUPPORTED_CHANNELS) {
      const cfg = this.configs.get(id) ?? null;
      // If not loaded in memory, attempt a quick asynchronous load to determine connectivity
      const loaded = cfg ?? (await this.loadFromStore(id));
      const connected = !!loaded;
      const enabled = loaded?.enabled ?? false;
      const name = id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' ');
      statuses.push({ id, name, connected, enabled });
    }
    return statuses;
  }
}
