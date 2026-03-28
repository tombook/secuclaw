import type { JsonStore } from '../storage/json-store.js';

const TEMPLATES_KEY = 'notification-templates.json';

export interface NotificationTemplate {
  id: string;
  name: string;
  eventType: string;
  channel: string;
  subject: string;
  body: string;
  variables: string[];
}

export interface RenderedMessage {
  subject: string;
  body: string;
  renderedAt: number;
}

const DEFAULT_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'tpl-incident-created',
    name: '新安全事件通知',
    eventType: 'incident.created',
    channel: 'email',
    subject: '[安全告警] 新事件: {{title}}',
    body: '检测到新的安全事件:\n\n标题: {{title}}\n严重程度: {{severity}}\n类别: {{category}}\n时间: {{detectedAt}}\n\n请及时处理。',
    variables: ['title', 'severity', 'category', 'detectedAt'],
  },
  {
    id: 'tpl-sla-breached',
    name: 'SLA超时告警',
    eventType: 'sla.breached',
    channel: 'email',
    subject: '[SLA超时] 事件 {{incidentId}} 已超时',
    body: '安全事件 {{incidentId}} 已超过SLA时限:\n\n严重程度: {{severity}}\n超时时长: {{overdueMs}}ms\n\n请立即处理。',
    variables: ['incidentId', 'severity', 'overdueMs'],
  },
  {
    id: 'tpl-vuln-critical',
    name: '高危漏洞告警',
    eventType: 'vulnerability.critical',
    channel: 'email',
    subject: '[高危漏洞] {{cveId}}',
    body: '检测到高危漏洞:\n\nCVE: {{cveId}}\nCVSS: {{cvss}}\n影响资产: {{affectedAssets}}\n\n请尽快修复。',
    variables: ['cveId', 'cvss', 'affectedAssets'],
  },
];

export class TemplateManager {
  constructor(private store: JsonStore) {}

  async renderTemplate(templateId: string, variables: Record<string, string>): Promise<RenderedMessage | null> {
    const tpl = await this.getTemplate(templateId);
    if (!tpl) return null;

    let subject = tpl.subject;
    let body = tpl.body;
    for (const [key, val] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      subject = subject.replaceAll(placeholder, val);
      body = body.replaceAll(placeholder, val);
    }

    return { subject, body, renderedAt: Date.now() };
  }

  async getTemplate(templateId: string): Promise<NotificationTemplate | null> {
    const all = await this.getAll();
    return all.find(t => t.id === templateId) ?? null;
  }

  async getTemplatesForEvent(eventType: string, channel: string): Promise<NotificationTemplate[]> {
    const all = await this.getAll();
    return all.filter(t => (t.eventType === eventType || t.eventType === '*') && t.channel === channel);
  }

  async listTemplates(filter?: { eventType?: string; channel?: string }): Promise<NotificationTemplate[]> {
    let results = await this.getAll();
    if (filter?.eventType) results = results.filter(t => t.eventType === filter.eventType);
    if (filter?.channel) results = results.filter(t => t.channel === filter.channel);
    return results;
  }

  async createTemplate(template: NotificationTemplate): Promise<NotificationTemplate> {
    const all = await this.getAll();
    all.push(template);
    await this.store.set(TEMPLATES_KEY, all);
    return template;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const all = await this.getAll();
    const filtered = all.filter(t => t.id !== id);
    if (filtered.length === all.length) return false;
    await this.store.set(TEMPLATES_KEY, filtered);
    return true;
  }

  private async getAll(): Promise<NotificationTemplate[]> {
    const raw = await this.store.get<NotificationTemplate[]>(TEMPLATES_KEY);
    return raw ?? [...DEFAULT_TEMPLATES];
  }
}
