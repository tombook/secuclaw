import type { JsonStore } from '../storage/json-store.js';

const RULES_KEY = 'notification-routes.json';

export type ChannelType = 'email' | 'sms' | 'webhook' | 'wechat' | 'slack';

export interface RoutingRule {
  id: string;
  name: string;
  eventPatterns: string[];
  severityFilter?: ('critical' | 'high' | 'medium' | 'low')[];
  channels: ChannelType[];
  enabled: boolean;
}

export interface RouteRequest {
  eventType: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  payload: Record<string, unknown>;
}

export interface RouteResult {
  matchedRules: string[];
  routedChannels: ChannelType[];
  deliveryStatus: Record<string, 'queued' | 'failed' | 'skipped'>;
}

const DEFAULT_RULES: RoutingRule[] = [
  { id: 'rule-critical', name: 'Critical alerts to all channels', eventPatterns: ['incident.created', 'sla.breached'], severityFilter: ['critical'], channels: ['email', 'sms', 'wechat', 'webhook'], enabled: true },
  { id: 'rule-high', name: 'High severity to IM + email', eventPatterns: ['*'], severityFilter: ['high'], channels: ['email', 'wechat'], enabled: true },
  { id: 'rule-default', name: 'Default notification', eventPatterns: ['*'], channels: ['email'], enabled: true },
];

export class ChannelRouter {
  constructor(private store: JsonStore) {}

  async routeNotification(request: RouteRequest): Promise<RouteResult> {
    const rules = await this.getRules();
    const activeRules = rules.filter(r => r.enabled);

    const matched: RoutingRule[] = [];
    for (const rule of activeRules) {
      const eventMatch = rule.eventPatterns.includes('*') || rule.eventPatterns.some(p => request.eventType.startsWith(p.replace('*', '')));
      const severityMatch = !rule.severityFilter || rule.severityFilter.includes(request.priority);
      if (eventMatch && severityMatch) {
        matched.push(rule);
      }
    }

    const channelSet = new Set<ChannelType>();
    for (const rule of matched) {
      for (const ch of rule.channels) channelSet.add(ch);
    }

    const deliveryStatus: Record<string, 'queued' | 'failed' | 'skipped'> = {};
    for (const ch of channelSet) {
      deliveryStatus[ch] = 'queued';
    }

    return {
      matchedRules: matched.map(r => r.id),
      routedChannels: Array.from(channelSet),
      deliveryStatus,
    };
  }

  async getRules(): Promise<RoutingRule[]> {
    const raw = await this.store.get<RoutingRule[]>(RULES_KEY);
    return raw ?? [...DEFAULT_RULES];
  }

  async addRule(rule: RoutingRule): Promise<void> {
    const rules = await this.getRules();
    rules.push(rule);
    await this.store.set(RULES_KEY, rules);
  }

  async updateRule(id: string, updates: Partial<RoutingRule>): Promise<boolean> {
    const rules = await this.getRules();
    const idx = rules.findIndex(r => r.id === id);
    if (idx === -1) return false;
    rules[idx] = { ...rules[idx], ...updates };
    await this.store.set(RULES_KEY, rules);
    return true;
  }

  async deleteRule(id: string): Promise<boolean> {
    const rules = await this.getRules();
    const filtered = rules.filter(r => r.id !== id);
    if (filtered.length === rules.length) return false;
    await this.store.set(RULES_KEY, filtered);
    return true;
  }
}
