export type EventMap = {
  // Incident related events
  'incident.created': { incidentId: string; severity: string; category: string; assignee?: string };
  'incident.statusChanged': { incidentId: string; fromStatus: string; toStatus: string; actor?: string };
  'incident.resolved': { incidentId: string; resolution: string; resolvedBy: string };

  // Vulnerability related events
  'vulnerability.created': { vulnId: string; cveId: string; severity: string; cvss?: number };
  'vulnerability.statusChanged': { vulnId: string; fromStatus: string; toStatus: string };
  'vulnerability.critical': { vulnId: string; cveId: string; cvss: number; affectedAssets: string[] };

  // Threat and compliance related events
  'threat.detected': { threatId: string; type: string; confidence: number; indicators?: Record<string, unknown> };
  'threat.confidenceUpdated': { threatId: string; source: string; confidence: number };
  'compliance.violation': { framework: string; controlId: string; severity: string };
  'compliance.scoreChanged': { framework: string; oldScore: number; newScore: number };

  // Asset related events
  'asset.created': { assetId: string; type: string; criticality: string; name: string };
  'asset.updated': { assetId: string; changes: string[] };
  'asset.deleted': { assetId: string; type: string };
  'asset.vulnerabilityLinked': { assetId: string; vulnId: string };

  // Task and approvals
  'task.created': { taskId: string; domainId: string; capabilityId: string; priority: string };
  'task.completed': { taskId: string; domainId: string; result: string };
  'approval.expired': { approvalId: string; taskId: string };

  // Monitoring / KPI / notifications
  'anomaly.detected': { anomalyId: string; metric: string; severity: string; deviation: number };
  'kpi.calculated': { timestamp: string; riskScore: number; securityScore: number };
  'notification.send': { channelId: string; message: string; priority: string; recipients?: string[] };
  'system.alert': { level: string; message: string; source?: string; details?: Record<string, unknown> };

  // SLA events
  'sla.warning': { incidentId: string; severity: string; remainingMs: number; remainingPercent: number };
  'sla.breached': { incidentId: string; severity: string; overdueMs: number };
};

export type EventName = keyof EventMap;
export type EventHandler<T> = (payload: T) => Promise<void>;
