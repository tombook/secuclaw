export type ChannelType = 'email' | 'webhook' | 'feishu' | 'telegram' | 'slack' | 'discord' | 'teams';

export interface ChannelConfig {
  id: ChannelType | string;
  name: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface NotificationMessage {
  title: string;
  body: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  recipients?: string[];
  metadata?: Record<string, unknown>;
}

export interface SendResult {
  success: boolean;
  channelId: string;
  message?: string;
  timestamp: number;
}

export interface ChannelProvider {
  readonly type: ChannelType | string;
  send(message: NotificationMessage, config: ChannelConfig): Promise<SendResult>;
  validate(config: ChannelConfig): boolean;
}
