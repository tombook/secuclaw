import type { EventBus } from './event-bus.js';
import type { EventMap } from './types.js';

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

export function registerDefaultRules(eventBus: EventBus): void {
  // Rule 1: Critical Incident → Create Capability Task
  eventBus.on('incident.created', async (payload) => {
    try {
      if (payload.severity === 'critical') {
        console.log('[Rule: Critical Incident → Create Capability Task] Detected critical incident', payload.incidentId);
        const taskPayload: EventMap['task.created'] = {
          taskId: generateId('task'),
          domainId: payload.incidentId,
          capabilityId: 'incident-response',
          priority: 'high',
        };
        await eventBus.emit('task.created', taskPayload);
      }
    } catch (err) {
      console.error('[Rule: Critical Incident → Create Capability Task] error', err);
    }
  });

  // Rule 2: Critical Vulnerability → Send Notification
  eventBus.on('vulnerability.critical', async (payload) => {
    try {
      const message = `Critical vulnerability detected: ${payload.cveId} (CVSS ${payload.cvss}).`;
      const notification: EventMap['notification.send'] = {
        channelId: 'email',
        message,
        priority: 'high',
        recipients: ['security-team@example.com'],
      };
      await eventBus.emit('notification.send', notification);
    } catch (err) {
      console.error('[Rule: Critical Vulnerability → Send Notification] error', err);
    }
  });

  // Rule 3: Compliance Violation → Create Task + Notify
  eventBus.on('compliance.violation', async (payload) => {
    try {
      const taskPayload: EventMap['task.created'] = {
        taskId: generateId('task'),
        domainId: 'compliance',
        capabilityId: 'compliance-monitoring',
        priority: 'high',
      };
      const notification: EventMap['notification.send'] = {
        channelId: 'email',
        message: `Compliance violation detected: ${payload.framework} - ${payload.controlId} (severity: ${payload.severity})`,
        priority: 'high',
        recipients: ['security-team@example.com'],
      };
      await eventBus.emit('task.created', taskPayload);
      await eventBus.emit('notification.send', notification);
    } catch (err) {
      console.error('[Rule: Compliance Violation → Create Task + Notify] error', err);
    }
  });

  // Rule 4: Approval Expired → Notify + Escalate
  eventBus.on('approval.expired', async (payload) => {
    try {
      const notification: EventMap['notification.send'] = {
        channelId: 'email',
        message: `Approval ${payload.approvalId} expired for task ${payload.taskId}. Escalation required.`,
        priority: 'escalation',
        recipients: ['ops-team@example.com'],
      };
      const alert: EventMap['system.alert'] = {
        level: 'warning',
        message: `Approval expired: ${payload.approvalId}`,
        source: 'approvals',
        details: { payload },
      };
      await eventBus.emit('notification.send', notification);
      await eventBus.emit('system.alert', alert);
    } catch (err) {
      console.error('[Rule: Approval Expired → Notify + Escalate] error', err);
    }
  });

  // Rule 5: Anomaly Detected → Threat Correlation + Notify
  eventBus.on('anomaly.detected', async (payload) => {
    try {
      const shouldCorrelate = payload.severity === 'critical' || payload.deviation > 50;
      if (shouldCorrelate) {
        const correlationIndicators = {
          anomalyId: payload.anomalyId,
          metric: payload.metric,
          deviation: payload.deviation,
        };
        const threatPayload: EventMap['threat.detected'] = {
          threatId: payload.anomalyId,
          type: 'anomaly-correlation',
          confidence: payload.severity === 'critical' ? 0.9 : 0.75,
          indicators: correlationIndicators,
        };
        await eventBus.emit('threat.detected', threatPayload);
      }
      // Also notify about the anomaly
      const notification: EventMap['notification.send'] = {
        channelId: 'email',
        message: `Anomaly detected: ${payload.anomalyId} (metric: ${payload.metric}, deviation: ${payload.deviation})`,
        priority: 'normal',
        recipients: ['ops-team@example.com'],
      };
      await eventBus.emit('notification.send', notification);
    } catch (err) {
      console.error('[Rule: Anomaly Detected → Threat Correlation] error', err);
    }
  });
}
