import { Service } from 'typedi';
import type { EventName, EventMap } from './types.js';
import type { EventRule, EventRuleContext } from './rule.js';

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

@Service()
export class CriticalIncidentRule implements EventRule {
  readonly name = 'Critical Incident → Create Capability Task';
  readonly events: EventName[] = ['incident.created'];
  shouldExecute(event: EventName): boolean {
    return this.events.includes(event);
  }
  async execute(
    _event: EventName,
    payload: EventMap[EventName],
    context: EventRuleContext
  ): Promise<void> {
    const p = payload as EventMap['incident.created'];
    if (p.severity !== 'critical') return;

    console.log(`[${this.name}] Detected critical incident`, p.incidentId);
    const taskPayload: EventMap['task.created'] = {
      taskId: generateId('task'),
      domainId: p.incidentId,
      capabilityId: 'incident-response',
      priority: 'high',
    };
    await context.emit('task.created', taskPayload);
  }
}

@Service()
export class CriticalVulnerabilityRule implements EventRule {
  readonly name = 'Critical Vulnerability → Send Notification';
  readonly events: EventName[] = ['vulnerability.critical'];
  shouldExecute(event: EventName): boolean {
    return this.events.includes(event);
  }
  async execute(
    _event: EventName,
    payload: EventMap[EventName],
    context: EventRuleContext
  ): Promise<void> {
    const p = payload as EventMap['vulnerability.critical'];
    const message = `Critical vulnerability detected: ${p.cveId} (CVSS ${p.cvss}).`;
    const notification: EventMap['notification.send'] = {
      channelId: 'email',
      message,
      priority: 'high',
      recipients: ['security-team@example.com'],
    };
    await context.emit('notification.send', notification);
  }
}

@Service()
export class ComplianceViolationRule implements EventRule {
  readonly name = 'Compliance Violation → Create Task + Notify';
  readonly events: EventName[] = ['compliance.violation'];
  shouldExecute(event: EventName): boolean {
    return this.events.includes(event);
  }
  async execute(
    _event: EventName,
    payload: EventMap[EventName],
    context: EventRuleContext
  ): Promise<void> {
    const p = payload as EventMap['compliance.violation'];
    const taskPayload: EventMap['task.created'] = {
      taskId: generateId('task'),
      domainId: 'compliance',
      capabilityId: 'compliance-monitoring',
      priority: 'high',
    };
    const notification: EventMap['notification.send'] = {
      channelId: 'email',
      message: `Compliance violation detected: ${p.framework} - ${p.controlId} (severity: ${p.severity})`,
      priority: 'high',
      recipients: ['security-team@example.com'],
    };
    await context.emit('task.created', taskPayload);
    await context.emit('notification.send', notification);
  }
}

@Service()
export class ApprovalExpiredRule implements EventRule {
  readonly name = 'Approval Expired → Notify + Escalate';
  readonly events: EventName[] = ['approval.expired'];
  shouldExecute(event: EventName): boolean {
    return this.events.includes(event);
  }
  async execute(
    _event: EventName,
    payload: EventMap[EventName],
    context: EventRuleContext
  ): Promise<void> {
    const p = payload as EventMap['approval.expired'];
    const notification: EventMap['notification.send'] = {
      channelId: 'email',
      message: `Approval ${p.approvalId} expired for task ${p.taskId}. Escalation required.`,
      priority: 'escalation',
      recipients: ['ops-team@example.com'],
    };
    const alert: EventMap['system.alert'] = {
      level: 'warning',
      message: `Approval expired: ${p.approvalId}`,
      source: 'approvals',
      details: { payload: p },
    };
    await context.emit('notification.send', notification);
    await context.emit('system.alert', alert);
  }
}

@Service()
export class AnomalyDetectedRule implements EventRule {
  readonly name = 'Anomaly Detected → Threat Correlation + Notify';
  readonly events: EventName[] = ['anomaly.detected'];
  shouldExecute(event: EventName): boolean {
    return this.events.includes(event);
  }
  async execute(
    _event: EventName,
    payload: EventMap[EventName],
    context: EventRuleContext
  ): Promise<void> {
    const p = payload as EventMap['anomaly.detected'];
    const shouldCorrelate = p.severity === 'critical' || p.deviation > 50;

    if (shouldCorrelate) {
      const correlationIndicators = {
        anomalyId: p.anomalyId,
        metric: p.metric,
        deviation: p.deviation,
      };
      const threatPayload: EventMap['threat.detected'] = {
        threatId: p.anomalyId,
        type: 'anomaly-correlation',
        confidence: p.severity === 'critical' ? 0.9 : 0.75,
        indicators: correlationIndicators,
      };
      await context.emit('threat.detected', threatPayload);
    }

    const notification: EventMap['notification.send'] = {
      channelId: 'email',
      message: `Anomaly detected: ${p.anomalyId} (metric: ${p.metric}, deviation: ${p.deviation})`,
      priority: 'normal',
      recipients: ['ops-team@example.com'],
    };
    await context.emit('notification.send', notification);
  }
}

export type DefaultRuleClass = new () => EventRule;

export const defaultRuleClasses: DefaultRuleClass[] = [
  CriticalIncidentRule,
  CriticalVulnerabilityRule,
  ComplianceViolationRule,
  ApprovalExpiredRule,
  AnomalyDetectedRule,
];