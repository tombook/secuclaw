import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type AlertStatus =
  | 'open'
  | 'in_progress'
  | 'resolved'
  | 'false_positive'
  | 'merged';

export type AttackTactic =
  | 'reconnaissance'
  | 'initial_access'
  | 'execution'
  | 'persistence'
  | 'privilege_escalation'
  | 'defense_evasion'
  | 'credential_access'
  | 'discovery'
  | 'lateral_movement'
  | 'collection'
  | 'command_and_control'
  | 'exfiltration'
  | 'impact';

export interface AlertEntity {
  type: 'user' | 'host' | 'ip' | 'process' | 'file' | 'domain';
  id: string;
}

export interface RawAlert {
  id: string;
  timestamp: number;
  source: string;
  alertType: string;
  severity: AlertSeverity;
  entity: AlertEntity;
  description: string;
  rawData: Record<string, unknown>;
  mitreTactic: AttackTactic | null;
  mitreTechnique: string | null;
}

export interface CorrelatedIncidentEntity {
  type: string;
  id: string;
  role: 'actor' | 'target' | 'intermediate';
}

export interface KillChainStep {
  tactic: AttackTactic;
  technique: string;
  alertId: string;
  timestamp: number;
}

export interface CorrelatedIncident {
  id: string;
  title: string;
  status: AlertStatus;
  severity: AlertSeverity;
  confidence: number;
  firstSeen: number;
  lastSeen: number;
  alertCount: number;
  alertIds: string[];
  entities: CorrelatedIncidentEntity[];
  killChain: KillChainStep[];
  mitreTechniques: string[];
  mitreTactics: AttackTactic[];
  isAttackChain: boolean;
  requiresEscalation: boolean;
  suggestedAssignee: string | null;
  suggestedPlaybook: string | null;
  narrative: string;
}

export interface CorrelationRuleStep {
  source: string;
  alertType: string;
  mitreTactic: AttackTactic;
  timeWindowMs: number;
}

export interface CorrelationRule {
  id: string;
  name: string;
  description: string;
  matchSequence: CorrelationRuleStep[];
  minMatches: number;
  resultTactic: AttackTactic;
  resultTechnique: string;
  confidenceBoost: number;
  generateNarrative(alerts: RawAlert[]): string;
}

export interface IngestBatchResult {
  ingested: number;
  correlated: number;
  incidents: number;
}

export interface IncidentFilters {
  status?: AlertStatus;
  severity?: AlertSeverity;
  since?: number;
}

const SEVERITY_RANK: Record<AlertSeverity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

const TACTIC_ORDER: AttackTactic[] = [
  'reconnaissance',
  'initial_access',
  'execution',
  'persistence',
  'privilege_escalation',
  'defense_evasion',
  'credential_access',
  'discovery',
  'lateral_movement',
  'collection',
  'command_and_control',
  'exfiltration',
  'impact',
];

const CORRELATION_WINDOW_MS = 60 * 60 * 1000;
const ALERTS_KEY = 'soar/alerts.json';
const INCIDENTS_KEY = 'soar/incidents.json';

const logger = {
  info: (...args: unknown[]) => console.log('[AlertCorrelator]', ...args),
  error: (...args: unknown[]) => console.error('[AlertCorrelator]', ...args),
};

function formatTimestamp(ts: number): string {
  try {
    return new Date(ts).toISOString();
  } catch {
    return String(ts);
  }
}

function truncate(value: string, length: number): string {
  if (value.length <= length) return value;
  return `${value.slice(0, length - 3)}...`;
}

const BUILT_IN_RULES: CorrelationRule[] = [
  {
    id: 'rule-bruteforce-success',
    name: 'Brute Force Leading to Successful Login',
    description:
      'Reconnaissance brute-force attempts followed by a successful authentication event indicating initial access.',
    matchSequence: [
      {
        source: 'wazuh',
        alertType: 'ssh_bruteforce',
        mitreTactic: 'reconnaissance',
        timeWindowMs: 15 * 60 * 1000,
      },
      {
        source: 'wazuh',
        alertType: 'successful_login',
        mitreTactic: 'initial_access',
        timeWindowMs: 30 * 60 * 1000,
      },
    ],
    minMatches: 2,
    resultTactic: 'initial_access',
    resultTechnique: 'T1110',
    confidenceBoost: 0.35,
    generateNarrative(alerts: RawAlert[]): string {
      const recon = alerts.filter((a) => a.alertType === 'ssh_bruteforce');
      const success = alerts.find((a) => a.alertType === 'successful_login');
      const lines = [
        `Brute-force reconnaissance observed with ${recon.length} failed attempt(s).`,
      ];
      if (success) {
        lines.push(
          `Successful login detected at ${formatTimestamp(success.timestamp)} from suspected compromised source.`,
        );
      }
      lines.push(
        'Likely progression from credential brute-forcing (T1110) to valid account acquisition (T1078).',
      );
      return truncate(lines.join(' '), 1024);
    },
  },
  {
    id: 'rule-suspicious-process-c2',
    name: 'Suspicious Process Spawning Outbound Connection',
    description:
      'Suspicious process execution followed by outbound network connection indicating command and control.',
    matchSequence: [
      {
        source: 'falco',
        alertType: 'suspicious_process',
        mitreTactic: 'execution',
        timeWindowMs: 10 * 60 * 1000,
      },
      {
        source: 'falco',
        alertType: 'outbound_connection',
        mitreTactic: 'command_and_control',
        timeWindowMs: 10 * 60 * 1000,
      },
    ],
    minMatches: 2,
    resultTactic: 'command_and_control',
    resultTechnique: 'T1071',
    confidenceBoost: 0.3,
    generateNarrative(alerts: RawAlert[]): string {
      const proc = alerts.find((a) => a.alertType === 'suspicious_process');
      const c2 = alerts.find((a) => a.alertType === 'outbound_connection');
      const lines = ['Suspicious process activity followed by outbound network beaconing.'];
      if (proc) {
        lines.push(`Process observed: ${proc.description} at ${formatTimestamp(proc.timestamp)}.`);
      }
      if (c2) {
        lines.push(`Outbound connection observed at ${formatTimestamp(c2.timestamp)}.`);
      }
      lines.push('Indicates execution (T1059) progressing to application-layer C2 (T1071).');
      return truncate(lines.join(' '), 1024);
    },
  },
  {
    id: 'rule-privesc-sensitive-access',
    name: 'Privilege Escalation to Sensitive File Access',
    description:
      'Privilege escalation event followed by access to sensitive files or data stores.',
    matchSequence: [
      {
        source: 'osquery',
        alertType: 'privilege_escalation',
        mitreTactic: 'privilege_escalation',
        timeWindowMs: 15 * 60 * 1000,
      },
      {
        source: 'osquery',
        alertType: 'sensitive_file_access',
        mitreTactic: 'collection',
        timeWindowMs: 20 * 60 * 1000,
      },
    ],
    minMatches: 2,
    resultTactic: 'collection',
    resultTechnique: 'T1005',
    confidenceBoost: 0.3,
    generateNarrative(alerts: RawAlert[]): string {
      const privesc = alerts.find((a) => a.alertType === 'privilege_escalation');
      const collection = alerts.find((a) => a.alertType === 'sensitive_file_access');
      const lines = ['Privilege escalation followed by access to sensitive data.'];
      if (privesc) {
        lines.push(`Escalation detected: ${privesc.description} at ${formatTimestamp(privesc.timestamp)}.`);
      }
      if (collection) {
        lines.push(`Sensitive file access at ${formatTimestamp(collection.timestamp)}.`);
      }
      lines.push('Suggests escalation (T1068) progressing to data collection from local system (T1005).');
      return truncate(lines.join(' '), 1024);
    },
  },
  {
    id: 'rule-lateral-persistence',
    name: 'Lateral Movement to New Service Install',
    description:
      'Lateral movement to a remote host followed by installation of a new service for persistence.',
    matchSequence: [
      {
        source: 'wazuh',
        alertType: 'lateral_movement',
        mitreTactic: 'lateral_movement',
        timeWindowMs: 20 * 60 * 1000,
      },
      {
        source: 'wazuh',
        alertType: 'new_service_install',
        mitreTactic: 'persistence',
        timeWindowMs: 30 * 60 * 1000,
      },
    ],
    minMatches: 2,
    resultTactic: 'persistence',
    resultTechnique: 'T1543',
    confidenceBoost: 0.3,
    generateNarrative(alerts: RawAlert[]): string {
      const lateral = alerts.find((a) => a.alertType === 'lateral_movement');
      const persist = alerts.find((a) => a.alertType === 'new_service_install');
      const lines = ['Lateral movement followed by persistence mechanism installation.'];
      if (lateral) {
        lines.push(`Lateral movement detected at ${formatTimestamp(lateral.timestamp)}.`);
      }
      if (persist) {
        lines.push(`New service installation at ${formatTimestamp(persist.timestamp)}.`);
      }
      lines.push('Indicates lateral movement (T1021) leading to system service persistence (T1543).');
      return truncate(lines.join(' '), 1024);
    },
  },
  {
    id: 'rule-staging-exfil',
    name: 'Data Staging Leading to Large Outbound Upload',
    description:
      'Data staging activity followed by a large outbound upload suggesting exfiltration.',
    matchSequence: [
      {
        source: 'osquery',
        alertType: 'data_staging',
        mitreTactic: 'collection',
        timeWindowMs: 30 * 60 * 1000,
      },
      {
        source: 'falco',
        alertType: 'large_upload',
        mitreTactic: 'exfiltration',
        timeWindowMs: 30 * 60 * 1000,
      },
    ],
    minMatches: 2,
    resultTactic: 'exfiltration',
    resultTechnique: 'T1041',
    confidenceBoost: 0.35,
    generateNarrative(alerts: RawAlert[]): string {
      const stage = alerts.find((a) => a.alertType === 'data_staging');
      const upload = alerts.find((a) => a.alertType === 'large_upload');
      const lines = ['Data staging activity followed by anomalous large outbound upload.'];
      if (stage) {
        lines.push(`Staging observed at ${formatTimestamp(stage.timestamp)}.`);
      }
      if (upload) {
        lines.push(`Large outbound upload detected at ${formatTimestamp(upload.timestamp)}.`);
      }
      lines.push('Pattern consistent with data collection (T1074) progressing to exfiltration over C2 (T1041).');
      return truncate(lines.join(' '), 1024);
    },
  },
  {
    id: 'rule-phishing-macro',
    name: 'Phishing Email to Macro Execution',
    description:
      'Phishing email delivery followed by macro execution representing initial access to execution.',
    matchSequence: [
      {
        source: 'nuclei',
        alertType: 'phishing_email',
        mitreTactic: 'initial_access',
        timeWindowMs: 60 * 60 * 1000,
      },
      {
        source: 'wazuh',
        alertType: 'macro_execution',
        mitreTactic: 'execution',
        timeWindowMs: 60 * 60 * 1000,
      },
    ],
    minMatches: 2,
    resultTactic: 'execution',
    resultTechnique: 'T1204',
    confidenceBoost: 0.3,
    generateNarrative(alerts: RawAlert[]): string {
      const phish = alerts.find((a) => a.alertType === 'phishing_email');
      const macro = alerts.find((a) => a.alertType === 'macro_execution');
      const lines = ['Phishing email delivered with subsequent macro execution.'];
      if (phish) {
        lines.push(`Phishing email observed at ${formatTimestamp(phish.timestamp)}.`);
      }
      if (macro) {
        lines.push(`Macro execution at ${formatTimestamp(macro.timestamp)}.`);
      }
      lines.push('Consistent with initial access via spearphishing attachment (T1566.001) followed by user execution (T1204).');
      return truncate(lines.join(' '), 1024);
    },
  },
];

export class AlertCorrelator {
  private store: JsonStore;
  private alerts: RawAlert[] = [];
  private incidents: CorrelatedIncident[] = [];
  private rules: CorrelationRule[] = [];
  private initialized = false;

  constructor(store: JsonStore) {
    this.store = store;
    for (const rule of BUILT_IN_RULES) {
      this.rules.push(rule);
    }
  }

  private async ensureLoaded(): Promise<void> {
    if (this.initialized) return;
    const [alerts, incidents] = await Promise.all([
      this.store.get<RawAlert[]>(ALERTS_KEY),
      this.store.get<CorrelatedIncident[]>(INCIDENTS_KEY),
    ]);
    this.alerts = alerts ?? [];
    this.incidents = incidents ?? [];
    this.initialized = true;
  }

  private async persistAlerts(): Promise<void> {
    await this.store.set(ALERTS_KEY, this.alerts);
  }

  private async persistIncidents(): Promise<void> {
    await this.store.set(INCIDENTS_KEY, this.incidents);
  }

  async ingestAlert(alert: RawAlert): Promise<void> {
    await this.ensureLoaded();
    const exists = this.alerts.some((a) => a.id === alert.id);
    if (!exists) {
      this.alerts.push(alert);
    }
    await this.persistAlerts();
    const related = this.findRelatedIncidents(alert);
    if (related.length > 0) {
      for (const incident of related) {
        this.addAlertToIncident(incident, alert);
        await this.recomputeIncident(incident);
      }
      await this.persistIncidents();
      return;
    }
    const newIncident = this.shouldCreateNewIncident(alert);
    if (newIncident) {
      this.addAlertToIncident(newIncident, alert);
      await this.recomputeIncident(newIncident);
      await this.persistIncidents();
    }
  }

  async ingestBatch(alerts: RawAlert[]): Promise<IngestBatchResult> {
    await this.ensureLoaded();
    let ingested = 0;
    const beforeIncidentCount = this.incidents.length;
    for (const alert of alerts) {
      const exists = this.alerts.some((a) => a.id === alert.id);
      if (!exists) {
        this.alerts.push(alert);
        ingested += 1;
      }
      const related = this.findRelatedIncidents(alert);
      if (related.length > 0) {
        for (const incident of related) {
          this.addAlertToIncident(incident, alert);
          await this.recomputeIncident(incident);
        }
        continue;
      }
      const newIncident = this.shouldCreateNewIncident(alert);
      if (newIncident) {
        this.addAlertToIncident(newIncident, alert);
        await this.recomputeIncident(newIncident);
      }
    }
    await this.persistAlerts();
    await this.persistIncidents();
    const afterIncidentCount = this.incidents.length;
    const correlated = alerts.length - ingested + (afterIncidentCount - beforeIncidentCount);
    return {
      ingested,
      correlated: Math.max(0, correlated),
      incidents: this.incidents.length,
    };
  }

  async correlate(timeRange?: { start: number; end: number }): Promise<CorrelatedIncident[]> {
    await this.ensureLoaded();
    let result = this.incidents.slice();
    if (timeRange) {
      result = result.filter(
        (i) => i.lastSeen >= timeRange.start && i.firstSeen <= timeRange.end,
      );
    }
    result.sort((a, b) => b.lastSeen - a.lastSeen);
    return result;
  }

  async getIncident(incidentId: string): Promise<CorrelatedIncident | null> {
    await this.ensureLoaded();
    return this.incidents.find((i) => i.id === incidentId) ?? null;
  }

  async listIncidents(filters?: IncidentFilters): Promise<CorrelatedIncident[]> {
    await this.ensureLoaded();
    let result = this.incidents.slice();
    if (filters?.status) {
      const status = filters.status;
      result = result.filter((i) => i.status === status);
    }
    if (filters?.severity) {
      const severity = filters.severity;
      result = result.filter((i) => i.severity === severity);
    }
    if (filters?.since !== undefined) {
      const since = filters.since;
      result = result.filter((i) => i.lastSeen >= since);
    }
    result.sort((a, b) => b.lastSeen - a.lastSeen);
    return result;
  }

  async updateIncidentStatus(incidentId: string, status: AlertStatus): Promise<boolean> {
    await this.ensureLoaded();
    const incident = this.incidents.find((i) => i.id === incidentId);
    if (!incident) return false;
    incident.status = status;
    await this.persistIncidents();
    return true;
  }

  registerCorrelationRule(rule: CorrelationRule): void {
    const existingIndex = this.rules.findIndex((r) => r.id === rule.id);
    if (existingIndex >= 0) {
      this.rules[existingIndex] = rule;
    } else {
      this.rules.push(rule);
    }
  }

  listCorrelationRules(): CorrelationRule[] {
    return this.rules.slice();
  }

  private findRelatedIncidents(alert: RawAlert): CorrelatedIncident[] {
    const candidates: CorrelatedIncident[] = [];
    for (const incident of this.incidents) {
      if (incident.status === 'resolved' || incident.status === 'false_positive') continue;
      const inWindow = Math.abs(alert.timestamp - incident.lastSeen) <= CORRELATION_WINDOW_MS;
      if (!inWindow) continue;
      const entityMatch = incident.entities.some(
        (e) => e.type === alert.entity.type && e.id === alert.entity.id,
      );
      if (entityMatch) {
        candidates.push(incident);
      }
    }
    return candidates;
  }

  private addAlertToIncident(incident: CorrelatedIncident, alert: RawAlert): void {
    if (!incident.alertIds.includes(alert.id)) {
      incident.alertIds.push(alert.id);
    }
    incident.alertCount = incident.alertIds.length;
    if (alert.timestamp < incident.firstSeen) incident.firstSeen = alert.timestamp;
    if (alert.timestamp > incident.lastSeen) incident.lastSeen = alert.timestamp;
    const existingEntity = incident.entities.find(
      (e) => e.type === alert.entity.type && e.id === alert.entity.id,
    );
    if (!existingEntity) {
      incident.entities.push({
        type: alert.entity.type,
        id: alert.entity.id,
        role: this.inferEntityRole(alert),
      });
    }
    if (alert.mitreTactic && !incident.mitreTactics.includes(alert.mitreTactic)) {
      incident.mitreTactics.push(alert.mitreTactic);
    }
    if (
      alert.mitreTechnique &&
      !incident.mitreTechniques.includes(alert.mitreTechnique)
    ) {
      incident.mitreTechniques.push(alert.mitreTechnique);
    }
  }

  private shouldCreateNewIncident(alert: RawAlert): CorrelatedIncident | null {
    const now = Date.now();
    const ruleMatch = this.matchRuleForAlert(alert);
    const incident: CorrelatedIncident = {
      id: this.generateId(),
      title: this.buildTitle(alert, ruleMatch),
      status: 'open',
      severity: alert.severity,
      confidence: 0.5,
      firstSeen: alert.timestamp,
      lastSeen: alert.timestamp,
      alertCount: 0,
      alertIds: [],
      entities: [
        {
          type: alert.entity.type,
          id: alert.entity.id,
          role: this.inferEntityRole(alert),
        },
      ],
      killChain: [],
      mitreTechniques: alert.mitreTechnique ? [alert.mitreTechnique] : [],
      mitreTactics: alert.mitreTactic ? [alert.mitreTactic] : [],
      isAttackChain: false,
      requiresEscalation: false,
      suggestedAssignee: null,
      suggestedPlaybook: null,
      narrative: '',
      ...(ruleMatch ? { suggestedPlaybook: ruleMatch.resultTechnique } : {}),
    };
    void now;
    this.incidents.push(incident);
    return incident;
  }

  private async recomputeIncident(incident: CorrelatedIncident): Promise<void> {
    const incidentAlerts = this.alerts.filter((a) => incident.alertIds.includes(a.id));
    incident.killChain = this.buildKillChain(incidentAlerts);
    incident.severity = this.computeSeverity(incidentAlerts);
    incident.confidence = this.computeConfidence(incidentAlerts);
    incident.mitreTactics = Array.from(
      new Set(
        incidentAlerts
          .map((a) => a.mitreTactic)
          .filter((t): t is AttackTactic => t !== null),
      ),
    );
    incident.mitreTechniques = Array.from(
      new Set(incidentAlerts.map((a) => a.mitreTechnique).filter((t) => t !== null) as string[]),
    );
    incident.isAttackChain = this.detectAttackChain(incidentAlerts);
    incident.requiresEscalation = this.detectEscalation(incident);
    incident.suggestedAssignee = this.suggestAssignee(incident);
    incident.suggestedPlaybook = this.suggestPlaybook(incidentAlerts);
    incident.narrative = this.generateNarrative(incident);
    if (incident.alertCount === 0) {
      incident.alertCount = incident.alertIds.length;
    }
  }

  private computeSeverity(alerts: RawAlert[]): AlertSeverity {
    if (alerts.length === 0) return 'info';
    let top: AlertSeverity = 'info';
    for (const alert of alerts) {
      if (SEVERITY_RANK[alert.severity] > SEVERITY_RANK[top]) {
        top = alert.severity;
      }
    }
    return top;
  }

  private computeConfidence(alerts: RawAlert[]): number {
    if (alerts.length === 0) return 0;
    const sources = new Set(alerts.map((a) => a.source));
    const tactics = new Set(
      alerts.map((a) => a.mitreTactic).filter((t): t is AttackTactic => t !== null),
    );
    const entities = new Set(alerts.map((a) => `${a.entity.type}:${a.entity.id}`));
    let score = 0.3;
    score += Math.min(0.25, alerts.length * 0.05);
    score += Math.min(0.2, (sources.size - 1) * 0.07);
    score += Math.min(0.15, (tactics.size - 1) * 0.05);
    score += entities.size > 1 ? 0.05 : 0;
    for (const alert of alerts) {
      if (alert.severity === 'critical') score += 0.02;
      else if (alert.severity === 'high') score += 0.01;
    }
    let ruleBoost = 0;
    for (const rule of this.rules) {
      if (this.ruleMatchesAlerts(rule, alerts)) {
        ruleBoost = Math.max(ruleBoost, rule.confidenceBoost);
      }
    }
    score += ruleBoost;
    return Math.max(0, Math.min(1, Number(score.toFixed(2))));
  }

  private buildKillChain(alerts: RawAlert[]): KillChainStep[] {
    const sorted = alerts.slice().sort((a, b) => a.timestamp - b.timestamp);
    const steps: KillChainStep[] = [];
    for (const alert of sorted) {
      steps.push({
        tactic: (alert.mitreTactic ?? 'discovery') as AttackTactic,
        technique: alert.mitreTechnique ?? 'unknown',
        alertId: alert.id,
        timestamp: alert.timestamp,
      });
    }
    return steps;
  }

  private generateNarrative(incident: CorrelatedIncident): string {
    const incidentAlerts = this.alerts.filter((a) => incident.alertIds.includes(a.id));
    const sorted = incidentAlerts.slice().sort((a, b) => a.timestamp - b.timestamp);
    if (sorted.length === 0) return incident.title;
    for (const rule of this.rules) {
      if (this.ruleMatchesAlerts(rule, incidentAlerts)) {
        return rule.generateNarrative(incidentAlerts);
      }
    }
    const lines: string[] = [];
    lines.push(`Correlated incident with ${sorted.length} alert(s).`);
    lines.push(`Severity: ${incident.severity}. Confidence: ${incident.confidence.toFixed(2)}.`);
    for (const alert of sorted.slice(0, 5)) {
      lines.push(
        `- [${formatTimestamp(alert.timestamp)}] (${alert.source}/${alert.alertType}) ${truncate(
          alert.description,
          160,
        )}`,
      );
    }
    if (incident.isAttackChain) {
      lines.push('Multi-stage attack chain detected across distinct MITRE tactics.');
    }
    return truncate(lines.join('\n'), 2048);
  }

  private detectEscalation(incident: CorrelatedIncident): boolean {
    if (incident.severity === 'critical') return true;
    const criticalCount = this.alerts
      .filter((a) => incident.alertIds.includes(a.id))
      .filter((a) => a.severity === 'critical').length;
    if (criticalCount >= 2) return true;
    if (incident.isAttackChain && incident.severity === 'high') return true;
    const hasExfil = incident.mitreTactics.includes('exfiltration');
    const hasImpact = incident.mitreTactics.includes('impact');
    if (hasExfil || hasImpact) return true;
    return false;
  }

  private suggestAssignee(incident: CorrelatedIncident): string {
    if (incident.mitreTactics.includes('exfiltration') || incident.mitreTactics.includes('impact')) {
      return 'ir-lead';
    }
    if (incident.mitreTactics.includes('lateral_movement')) return 'tier2-analyst';
    if (
      incident.mitreTactics.includes('privilege_escalation') ||
      incident.mitreTactics.includes('credential_access')
    ) {
      return 'host-analyst';
    }
    if (incident.mitreTactics.includes('command_and_control')) return 'network-analyst';
    if (incident.severity === 'critical') return 'ir-lead';
    if (incident.severity === 'high') return 'tier2-analyst';
    return 'tier1-analyst';
  }

  private suggestPlaybook(alerts: RawAlert[]): string | null {
    for (const rule of this.rules) {
      if (this.ruleMatchesAlerts(rule, alerts)) {
        return rule.resultTechnique;
      }
    }
    const top = alerts
      .filter((a) => a.mitreTechnique)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    return top?.mitreTechnique ?? null;
  }

  private generateId(): string {
    try {
      return `inc_${randomUUID()}`;
    } catch {
      return `inc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    }
  }

  private inferEntityRole(alert: RawAlert): 'actor' | 'target' | 'intermediate' {
    const tactic = alert.mitreTactic;
    if (
      tactic === 'reconnaissance' ||
      tactic === 'initial_access' ||
      tactic === 'execution' ||
      tactic === 'command_and_control'
    ) {
      return 'actor';
    }
    if (
      tactic === 'collection' ||
      tactic === 'exfiltration' ||
      tactic === 'impact' ||
      tactic === 'credential_access'
    ) {
      return 'target';
    }
    if (tactic === 'lateral_movement' || tactic === 'persistence') {
      return 'intermediate';
    }
    if (alert.entity.type === 'ip') return 'actor';
    return 'target';
  }

  private detectAttackChain(alerts: RawAlert[]): boolean {
    const tactics = new Set(
      alerts.map((a) => a.mitreTactic).filter((t): t is AttackTactic => t !== null),
    );
    if (tactics.size < 2) return false;
    const sortedTactics = Array.from(tactics).sort(
      (a, b) => TACTIC_ORDER.indexOf(a) - TACTIC_ORDER.indexOf(b),
    );
    for (let i = 0; i < sortedTactics.length - 1; i += 1) {
      const currentIdx = TACTIC_ORDER.indexOf(sortedTactics[i]);
      const nextIdx = TACTIC_ORDER.indexOf(sortedTactics[i + 1]);
      if (currentIdx !== -1 && nextIdx !== -1 && nextIdx > currentIdx) {
        return true;
      }
    }
    return tactics.size >= 3;
  }

  private buildTitle(alert: RawAlert, rule: CorrelationRule | null): string {
    if (rule) {
      return `${rule.name} on ${alert.entity.id}`;
    }
    const tacticLabel = alert.mitreTactic
      ? alert.mitreTactic.replace(/_/g, ' ')
      : 'suspicious activity';
    return `${tacticLabel} detected on ${alert.entity.type}:${alert.entity.id}`;
  }

  private matchRuleForAlert(alert: RawAlert): CorrelationRule | null {
    for (const rule of this.rules) {
      const firstStep = rule.matchSequence[0];
      if (!firstStep) continue;
      if (
        firstStep.source === alert.source &&
        firstStep.alertType === alert.alertType &&
        firstStep.mitreTactic === alert.mitreTactic
      ) {
        return rule;
      }
    }
    return null;
  }

  private ruleMatchesAlerts(rule: CorrelationRule, alerts: RawAlert[]): boolean {
    if (alerts.length < rule.minMatches) return false;
    const sorted = alerts.slice().sort((a, b) => a.timestamp - b.timestamp);
    let stepIdx = 0;
    let stepStartTs = sorted[0]?.timestamp ?? 0;
    for (const alert of sorted) {
      const step = rule.matchSequence[stepIdx];
      if (!step) break;
      if (alert.timestamp - stepStartTs > step.timeWindowMs) {
        stepIdx = 0;
        stepStartTs = alert.timestamp;
      }
      if (
        alert.source === step.source &&
        alert.alertType === step.alertType &&
        alert.mitreTactic === step.mitreTactic
      ) {
        stepIdx += 1;
        if (stepIdx >= rule.matchSequence.length) {
          return true;
        }
        stepStartTs = alert.timestamp;
      }
    }
    return false;
  }
}