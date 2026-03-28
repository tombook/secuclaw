import { ChannelProvider, ChannelConfig, NotificationMessage, SendResult } from './types';

export class WebhookProvider implements ChannelProvider {
  readonly type = 'webhook';
  
  async send(message: NotificationMessage, config: ChannelConfig): Promise<SendResult> {
    const cfg = config.config as any;
    const url = cfg?.url as string | undefined;
    if (!url) {
      return { success: false, channelId: this.type, timestamp: Date.now(), message: 'Webhook URL not configured' };
    }
    try {
      // Use native fetch (Bun) with a 10s timeout
      const payload = {
        title: message.title,
        body: message.body,
        priority: message.priority,
        recipients: message.recipients,
        metadata: message.metadata,
      };
      const signal = (AbortSignal as any).timeout?.(10000) ?? undefined;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal,
      });
      const ok = res?.ok ?? false;
      return { success: ok, channelId: this.type, timestamp: Date.now() };
    } catch (err) {
      return { success: false, channelId: this.type, timestamp: Date.now(), message: String(err) };
    }
  }
  
  validate(config: ChannelConfig): boolean {
    const cfg = config.config as any;
    return !!cfg?.url;
  }
}
