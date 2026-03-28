import { ChannelProvider, ChannelConfig, NotificationMessage, SendResult } from './types';

export class EmailProvider implements ChannelProvider {
  readonly type = 'email';
  
  async send(message: NotificationMessage, config: ChannelConfig): Promise<SendResult> {
    // For now, just log the action. Real SMTP integration can be added later.
    const cfg = config.config as any;
    const recipients = message.recipients ?? (cfg?.recipients as string[] | undefined) ?? [];
    console.log(`[EmailProvider] Sending email to ${recipients.length} recipients via SMTP${cfg?.smtp?.host ? ' (' + cfg.smtp.host + ')' : ''}`);
    const ts = Date.now();
    return {
      success: true,
      channelId: this.type,
      timestamp: ts,
    };
  }
  
  validate(config: ChannelConfig): boolean {
    const cfg = config.config as any;
    if (!cfg || !cfg.smtp) return false;
    if (!cfg.smtp.host) return false;
    return true;
  }
}
