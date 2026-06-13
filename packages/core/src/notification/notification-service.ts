import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';

export type NotificationChannel = 'email' | 'sms' | 'webhook' | 'slack' | 'teams' | 'pagerduty' | 'in_app' | 'push';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent' | 'critical';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'retrying' | 'bounced' | 'suppressed';
export type NotificationTemplate = 'alert' | 'incident' | 'vulnerability' | 'compliance' | 'billing' | 'welcome' | 'password_reset' | 'mfa_required' | 'system' | 'custom';

export interface Notification {
  id: string;
  tenantId: string;
  channel: NotificationChannel;
  priority: NotificationPriority;
  status: NotificationStatus;
  template: NotificationTemplate;
  subject: string;
  body: string;
  recipient: string;
  metadata: Record<string, any>;
  attempts: number;
  maxAttempts: number;
  sentAt: number | null;
  deliveredAt: number | null;
  failedAt: number | null;
  failureReason: string | null;
  retryAfter: number | null;
  createdAt: number;
}

export interface NotificationPreference {
  tenantId: string;
  userId: string | null;
  channels: NotificationChannel[];
  priorities: NotificationPriority[];
  templates: NotificationTemplate[];
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
  enabled: boolean;
  rateLimitPerHour: number;
}

export interface NotificationStats {
  totalNotifications: number;
  sentToday: number;
  byChannel: Record<NotificationChannel, { sent: number; failed: number; pending: number }>;
  byStatus: Record<NotificationStatus, number>;
  byPriority: Record<NotificationPriority, number>;
  byTemplate: Record<NotificationTemplate, number>;
  successRate: number;
  averageDeliveryTime: number;
  activeSubscribers: number;
  totalSubscribers: number;
}

const STORE_KEYS = {
  notifications: 'notification/notifications.json',
  preferences: 'notification/preferences.json',
  subscribers: 'notification/subscribers.json',
};

function emptyChannelMap(): Record<NotificationChannel, { sent: number; failed: number; pending: number }> {
  return { email: { sent: 0, failed: 0, pending: 0 }, sms: { sent: 0, failed: 0, pending: 0 }, webhook: { sent: 0, failed: 0, pending: 0 }, slack: { sent: 0, failed: 0, pending: 0 }, teams: { sent: 0, failed: 0, pending: 0 }, pagerduty: { sent: 0, failed: 0, pending: 0 }, in_app: { sent: 0, failed: 0, pending: 0 }, push: { sent: 0, failed: 0, pending: 0 } };
}
function emptyStatusMap(): Record<NotificationStatus, number> {
  return { pending: 0, sent: 0, delivered: 0, failed: 0, retrying: 0, bounced: 0, suppressed: 0 };
}
function emptyPriorityMap(): Record<NotificationPriority, number> {
  return { low: 0, normal: 0, high: 0, urgent: 0, critical: 0 };
}
function emptyTemplateMap(): Record<NotificationTemplate, number> {
  return { alert: 0, incident: 0, vulnerability: 0, compliance: 0, billing: 0, welcome: 0, password_reset: 0, mfa_required: 0, system: 0, custom: 0 };
}

export class NotificationService {
  constructor(private store: JsonStore) {}

  async send(params: { tenantId: string; channel: NotificationChannel; priority?: NotificationPriority; template: NotificationTemplate; subject: string; body: string; recipient: string; metadata?: Record<string, any> }): Promise<Notification> {
    const pref = await this.getPreferences(params.tenantId, null);
    if (pref && !pref.enabled) {
      return await this.persistNotification({ ...params, status: 'suppressed', failureReason: 'notifications disabled for tenant' });
    }
    if (pref && pref.channels.length > 0 && !pref.channels.includes(params.channel)) {
      return await this.persistNotification({ ...params, status: 'suppressed', failureReason: `channel ${params.channel} not in preferences` });
    }
    if (pref && this.isQuietHours(pref)) {
      return await this.persistNotification({ ...params, status: 'suppressed', failureReason: 'in quiet hours' });
    }
    const n = await this.persistNotification({ ...params, status: 'pending' });
    return await this.attemptDelivery(n.id);
  }

  async sendBulk(notifications: Array<{ tenantId: string; channel: NotificationChannel; template: NotificationTemplate; subject: string; body: string; recipient: string; priority?: NotificationPriority; metadata?: Record<string, any> }>): Promise<Notification[]> {
    const result: Notification[] = [];
    for (const n of notifications) result.push(await this.send(n));
    return result;
  }

  async getNotification(notificationId: string): Promise<Notification | null> {
    const all = await this.loadNotifications();
    return all.find((n) => n.id === notificationId) || null;
  }

  async listNotifications(filter?: { tenantId?: string; channel?: NotificationChannel; status?: NotificationStatus; priority?: NotificationPriority; since?: number; limit?: number }): Promise<Notification[]> {
    let items = await this.loadNotifications();
    if (filter?.tenantId) items = items.filter((n) => n.tenantId === filter.tenantId);
    if (filter?.channel) items = items.filter((n) => n.channel === filter.channel);
    if (filter?.status) items = items.filter((n) => n.status === filter.status);
    if (filter?.priority) items = items.filter((n) => n.priority === filter.priority);
    if (filter?.since !== undefined) items = items.filter((n) => n.createdAt >= filter.since!);
    items.sort((a, b) => b.createdAt - a.createdAt);
    if (filter?.limit !== undefined) items = items.slice(0, filter.limit);
    return items;
  }

  async attemptDelivery(notificationId: string): Promise<Notification> {
    const all = await this.loadNotifications();
    const idx = all.findIndex((n) => n.id === notificationId);
    if (idx === -1) throw new Error('notification not found');
    const n = all[idx];
    n.attempts++;
    try {
      const success = await this.deliver(n);
      if (success) {
        n.status = 'sent';
        n.sentAt = Date.now();
        n.deliveredAt = Date.now();
      } else {
        if (n.attempts >= n.maxAttempts) {
          n.status = 'failed';
          n.failedAt = Date.now();
          n.failureReason = 'max attempts reached';
        } else {
          n.status = 'retrying';
          n.retryAfter = Date.now() + 60000 * n.attempts;
        }
      }
    } catch (e: any) {
      n.status = n.attempts >= n.maxAttempts ? 'failed' : 'retrying';
      n.failureReason = e?.message || String(e);
      if (n.status === 'failed') n.failedAt = Date.now();
    }
    await this.store.set(STORE_KEYS.notifications, all);
    return n;
  }

  async setPreferences(params: Omit<NotificationPreference, 'userId'> & { userId?: string | null }): Promise<NotificationPreference> {
    const pref: NotificationPreference = { ...params, userId: params.userId ?? null };
    const all = await this.loadPreferences();
    const idx = all.findIndex((p) => p.tenantId === pref.tenantId && p.userId === pref.userId);
    if (idx >= 0) all[idx] = pref;
    else all.push(pref);
    await this.store.set(STORE_KEYS.preferences, all);
    return pref;
  }

  async getPreferences(tenantId: string, userId: string | null): Promise<NotificationPreference | null> {
    const all = await this.loadPreferences();
    return all.find((p) => p.tenantId === tenantId && p.userId === userId) || null;
  }

  async listPreferences(tenantId?: string): Promise<NotificationPreference[]> {
    let all = await this.loadPreferences();
    if (tenantId) all = all.filter((p) => p.tenantId === tenantId);
    return all;
  }

  async addSubscriber(params: { tenantId: string; userId: string; name: string; email: string; phone?: string; channels: NotificationChannel[]; metadata?: Record<string, any> }): Promise<{ id: string }> {
    const id = this.generateId('sub');
    const subscribers = await this.loadSubscribers();
    subscribers.push({ ...params, id, createdAt: Date.now() });
    await this.store.set(STORE_KEYS.subscribers, subscribers);
    return { id };
  }

  async listSubscribers(tenantId?: string): Promise<any[]> {
    let subs = await this.loadSubscribers();
    if (tenantId) subs = subs.filter((s) => s.tenantId === tenantId);
    return subs;
  }

  async getStats(since?: number): Promise<NotificationStats> {
    let notifications = await this.loadNotifications();
    if (since !== undefined) notifications = notifications.filter((n) => n.createdAt >= since);
    const prefs = await this.loadPreferences();
    const subs = await this.loadSubscribers();
    const byChannel = emptyChannelMap();
    const byStatus = emptyStatusMap();
    const byPriority = emptyPriorityMap();
    const byTemplate = emptyTemplateMap();
    let totalDeliveryTime = 0;
    let deliveredCount = 0;
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
    for (const n of notifications) {
      byChannel[n.channel][n.status === 'sent' || n.status === 'delivered' ? 'sent' : n.status === 'failed' ? 'failed' : 'pending']++;
      byStatus[n.status]++;
      byPriority[n.priority]++;
      byTemplate[n.template]++;
      if (n.sentAt && n.deliveredAt) {
        totalDeliveryTime += n.deliveredAt - n.sentAt;
        deliveredCount++;
      }
    }
    const sentCount = byStatus.sent + byStatus.delivered;
    const failedCount = byStatus.failed;
    return {
      totalNotifications: notifications.length,
      sentToday: notifications.filter((n) => n.createdAt >= todayStart && (n.status === 'sent' || n.status === 'delivered')).length,
      byChannel,
      byStatus,
      byPriority,
      byTemplate,
      successRate: sentCount + failedCount > 0 ? sentCount / (sentCount + failedCount) : 1,
      averageDeliveryTime: deliveredCount > 0 ? totalDeliveryTime / deliveredCount : 0,
      activeSubscribers: subs.length,
      totalSubscribers: subs.length + prefs.length,
    };
  }

  private createNotification(params: { tenantId: string; channel: NotificationChannel; priority?: NotificationPriority; template: NotificationTemplate; subject: string; body: string; recipient: string; status: NotificationStatus; failureReason?: string; metadata?: Record<string, any> }): Notification {
    return {
      id: this.generateId('ntf'),
      tenantId: params.tenantId,
      channel: params.channel,
      priority: params.priority || 'normal',
      status: params.status,
      template: params.template,
      subject: params.subject,
      body: params.body,
      recipient: params.recipient,
      metadata: params.metadata || {},
      attempts: 0,
      maxAttempts: 3,
      sentAt: null,
      deliveredAt: null,
      failedAt: null,
      failureReason: params.failureReason || null,
      retryAfter: null,
      createdAt: Date.now(),
    };
  }

  private async persistNotification(params: { tenantId: string; channel: NotificationChannel; priority?: NotificationPriority; template: NotificationTemplate; subject: string; body: string; recipient: string; status: NotificationStatus; failureReason?: string; metadata?: Record<string, any> }): Promise<Notification> {
    const n = this.createNotification(params);
    const all = await this.loadNotifications();
    all.push(n);
    if (all.length > 50000) all.splice(0, all.length - 50000);
    await this.store.set(STORE_KEYS.notifications, all);
    return n;
  }

  private isQuietHours(pref: NotificationPreference): boolean {
    if (pref.quietHoursStart === null || pref.quietHoursEnd === null) return false;
    const now = new Date();
    const h = now.getHours();
    if (pref.quietHoursStart < pref.quietHoursEnd) return h >= pref.quietHoursStart && h < pref.quietHoursEnd;
    return h >= pref.quietHoursStart || h < pref.quietHoursEnd;
  }

  private async deliver(n: Notification): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 10));
    return true;
  }

  private async loadNotifications(): Promise<Notification[]> {
    return (await this.store.get<Notification[]>(STORE_KEYS.notifications)) || [];
  }
  private async loadPreferences(): Promise<NotificationPreference[]> {
    return (await this.store.get<NotificationPreference[]>(STORE_KEYS.preferences)) || [];
  }
  private async loadSubscribers(): Promise<any[]> {
    return (await this.store.get<any[]>(STORE_KEYS.subscribers)) || [];
  }

  private generateId(prefix: string): string {
    return `${prefix}_${randomUUID()}`;
  }
}
