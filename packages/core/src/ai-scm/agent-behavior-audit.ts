import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';

export type ActionType =
  | 'tool_call'
  | 'llm_query'
  | 'file_read'
  | 'file_write'
  | 'network_request'
  | 'data_access'
  | 'auth_attempt'
  | 'state_change'
  | 'output_emission';

export type ActionStatus = 'success' | 'failure' | 'denied' | 'timeout' | 'error';

export type RiskClassification = 'safe' | 'low' | 'medium' | 'high' | 'critical';

export type AlertType =
  | 'unauthorized_data_access'
  | 'data_exfiltration'
  | 'privilege_escalation'
  | 'tool_misuse'
  | 'loop_detection'
  | 'cost_anomaly'
  | 'pii_leak'
  | 'anomalous_behavior';

export interface AgentDataAccessEvent {
  type: 'pii' | 'credential' | 'confidential' | 'public' | 'other';
  identifier: string;
  bytesAccessed: number;
}

export interface AgentDataTransmissionEvent {
  destination: 'llm_api' | 'external_url' | 'file' | 'email' | 'message';
  data: string;
  bytes: number;
  encrypted: boolean;
}

export interface AgentAction {
  id: string;
  agentId: string;
  sessionId: string;
  actionType: ActionType;
  toolName: string | null;
  timestamp: number;
  duration: number;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  status: ActionStatus;
  riskClassification: RiskClassification;
  dataAccessed: AgentDataAccessEvent[];
  dataTransmitted: AgentDataTransmissionEvent[];
  userApproval: boolean;
  cost: number;
  metadata: Record<string, unknown>;
}

export interface AgentBehaviorBaseline {
  agentId: string;
  typicalActionsPerHour: number;
  typicalToolNames: string[];
  typicalActionTypes: ActionType[];
  avgInputSize: number;
  avgOutputSize: number;
  avgCostPerHour: number;
  typicalHours: number[];
  piiAccessRate: number;
  lastUpdated: number;
  sampleCount: number;
}

export interface BehaviorAnomaly {
  agentId: string;
  sessionId: string;
  action: AgentAction;
  alertType: AlertType;
  severity: RiskClassification;
  description: string;
  evidence: string[];
  recommendedAction: 'monitor' | 'pause' | 'rollback' | 'kill_session' | 'notify';
  detectedAt: number;
  confidence: number;
}

export interface BehaviorSummary {
  agentId: string;
  timeRange: { start: number; end: number };
  totalActions: number;
  byType: Record<ActionType, number>;
  byRisk: Record<RiskClassification, number>;
  anomaliesDetected: number;
  dataAccessedBytes: number;
  dataTransmittedBytes: number;
  totalCost: number;
  piiAccessEvents: number;
  topTools: Array<{ tool: string; count: number }>;
}

const ACTIONS_KEY = 'ai-scm/agent-actions.json';
const ANOMALIES_KEY = 'ai-scm/agent-anomalies.json';
const BASELINES_KEY = 'ai-scm/agent-baselines.json';

const PII_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'chinese_id', pattern: /\b[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]\b/ },
  { name: 'email', pattern: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/ },
  { name: 'chinese_phone', pattern: /\b1[3-9]\d{9}\b/ },
  { name: 'credit_card', pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/ },
  { name: 'aws_access_key', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'us_ssn', pattern: /\b\d{3}-\d{2}-\d{4}\b/ },
];

const ALL_ACTION_TYPES: ActionType[] = [
  'tool_call',
  'llm_query',
  'file_read',
  'file_write',
  'network_request',
  'data_access',
  'auth_attempt',
  'state_change',
  'output_emission',
];

const ALL_RISK_LEVELS: RiskClassification[] = ['safe', 'low', 'medium', 'high', 'critical'];

const ALL_ALERT_TYPES: AlertType[] = [
  'unauthorized_data_access',
  'data_exfiltration',
  'privilege_escalation',
  'tool_misuse',
  'loop_detection',
  'cost_anomaly',
  'pii_leak',
  'anomalous_behavior',
];

const LOOP_WINDOW_MS = 5 * 60 * 1000;
const LOOP_REPETITION_THRESHOLD = 8;
const COST_SPIKE_MULTIPLIER = 5;
const COST_SPIKE_MIN_AMOUNT = 1;
const UNUSUAL_HOUR_THRESHOLD = 0.3;

function stringifyForScan(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function byteSizeOf(value: unknown): number {
  return Buffer.byteLength(stringifyForScan(value), 'utf-8');
}

function detectPiiMatches(text: string): string[] {
  const hits: string[] = [];
  for (const { name, pattern } of PII_PATTERNS) {
    if (pattern.test(text)) {
      hits.push(name);
    }
  }
  return hits;
}

export class AgentBehaviorAuditService {
  constructor(private store: JsonStore) {}

  async recordAction(action: Omit<AgentAction, 'id'>): Promise<AgentAction> {
    const full: AgentAction = {
      ...action,
      id: this.generateId(),
    };
    const actions = await this.loadActions();
    actions.push(full);
    await this.saveActions(actions);

    const anomalies = await this.detectAnomalies(full);
    if (anomalies.length > 0) {
      const existing = await this.loadAnomalies();
      existing.push(...anomalies);
      await this.saveAnomalies(existing);
    }

    return full;
  }

  async recordBatch(actions: Omit<AgentAction, 'id'>[]): Promise<AgentAction[]> {
    const full: AgentAction[] = actions.map((a) => ({ ...a, id: this.generateId() }));
    const existing = await this.loadActions();
    existing.push(...full);
    await this.saveActions(existing);

    const newAnomalies: BehaviorAnomaly[] = [];
    for (const action of full) {
      const found = await this.detectAnomalies(action);
      newAnomalies.push(...found);
    }
    if (newAnomalies.length > 0) {
      const stored = await this.loadAnomalies();
      stored.push(...newAnomalies);
      await this.saveAnomalies(stored);
    }

    return full;
  }

  async getAction(actionId: string): Promise<AgentAction | null> {
    const actions = await this.loadActions();
    return actions.find((a) => a.id === actionId) ?? null;
  }

  async listActions(filters?: {
    agentId?: string;
    sessionId?: string;
    actionType?: ActionType;
    riskClassification?: RiskClassification;
    since?: number;
    limit?: number;
  }): Promise<AgentAction[]> {
    const actions = await this.loadActions();
    let result = [...actions];
    if (filters?.agentId) {
      result = result.filter((a) => a.agentId === filters.agentId);
    }
    if (filters?.sessionId) {
      result = result.filter((a) => a.sessionId === filters.sessionId);
    }
    if (filters?.actionType) {
      result = result.filter((a) => a.actionType === filters.actionType);
    }
    if (filters?.riskClassification) {
      result = result.filter((a) => a.riskClassification === filters.riskClassification);
    }
    if (typeof filters?.since === 'number') {
      result = result.filter((a) => a.timestamp >= filters.since!);
    }
    result.sort((a, b) => b.timestamp - a.timestamp);
    if (filters?.limit && filters.limit > 0) {
      result = result.slice(0, filters.limit);
    }
    return result;
  }

  async buildBaseline(
    agentId: string,
    timeRange?: { start: number; end: number },
  ): Promise<AgentBehaviorBaseline | null> {
    const all = await this.loadActions();
    const filtered = all.filter((a) => {
      if (a.agentId !== agentId) return false;
      if (timeRange) {
        if (a.timestamp < timeRange.start) return false;
        if (a.timestamp > timeRange.end) return false;
      }
      return true;
    });
    if (filtered.length === 0) return null;

    const baseline = this.computeBaseline(filtered);
    const baselines = await this.loadBaselines();
    const idx = baselines.findIndex((b) => b.agentId === agentId);
    if (idx >= 0) {
      baselines[idx] = baseline;
    } else {
      baselines.push(baseline);
    }
    await this.saveBaselines(baselines);
    return baseline;
  }

  async getBaseline(agentId: string): Promise<AgentBehaviorBaseline | null> {
    const baselines = await this.loadBaselines();
    return baselines.find((b) => b.agentId === agentId) ?? null;
  }

  async listBaselines(): Promise<AgentBehaviorBaseline[]> {
    const baselines = await this.loadBaselines();
    return [...baselines];
  }

  async detectAnomalies(action: AgentAction): Promise<BehaviorAnomaly[]> {
    const anomalies: BehaviorAnomaly[] = [];
    const recent = await this.listActions({ agentId: action.agentId, limit: 50 });

    const exfil = this.checkDataExfiltration(action);
    if (exfil) anomalies.push(exfil);

    const pii = this.checkPiiLeak(action);
    if (pii) anomalies.push(pii);

    const misuse = this.checkToolMisuse(action, recent);
    if (misuse) anomalies.push(misuse);

    const loop = this.checkLoopPattern(recent);
    if (loop) anomalies.push(loop);

    const cost = this.checkCostAnomaly(action, recent);
    if (cost) anomalies.push(cost);

    const baseline = await this.getBaseline(action.agentId);
    const unusualScore = this.checkUnusualTime(action, baseline);
    if (unusualScore > UNUSUAL_HOUR_THRESHOLD) {
      anomalies.push({
        agentId: action.agentId,
        sessionId: action.sessionId,
        action,
        alertType: 'anomalous_behavior',
        severity: unusualScore > 0.7 ? 'high' : 'medium',
        description: `Action occurred outside the agent's typical operating hours (score=${unusualScore.toFixed(2)})`,
        evidence: [
          `timestamp=${action.timestamp}`,
          `hour=${new Date(action.timestamp).getHours()}`,
          `baseline.typicalHours=${baseline ? baseline.typicalHours.join(',') : 'none'}`,
        ],
        recommendedAction: unusualScore > 0.7 ? 'pause' : 'monitor',
        detectedAt: Date.now(),
        confidence: Math.min(1, unusualScore),
      });
    }

    return anomalies;
  }

  async getAnomalies(filters?: {
    agentId?: string;
    severity?: RiskClassification;
    since?: number;
    limit?: number;
  }): Promise<BehaviorAnomaly[]> {
    const all = await this.loadAnomalies();
    let result = [...all];
    if (filters?.agentId) {
      result = result.filter((a) => a.agentId === filters.agentId);
    }
    if (filters?.severity) {
      result = result.filter((a) => a.severity === filters.severity);
    }
    if (typeof filters?.since === 'number') {
      result = result.filter((a) => a.detectedAt >= filters.since!);
    }
    result.sort((a, b) => b.detectedAt - a.detectedAt);
    if (filters?.limit && filters.limit > 0) {
      result = result.slice(0, filters.limit);
    }
    return result;
  }

  async getBehaviorSummary(
    agentId: string,
    timeRange: { start: number; end: number },
  ): Promise<BehaviorSummary> {
    const all = await this.loadActions();
    const filtered = all.filter(
      (a) =>
        a.agentId === agentId &&
        a.timestamp >= timeRange.start &&
        a.timestamp <= timeRange.end,
    );
    const anomalies = await this.loadAnomalies();
    const filteredAnomalies = anomalies.filter(
      (a) =>
        a.agentId === agentId &&
        a.action.timestamp >= timeRange.start &&
        a.action.timestamp <= timeRange.end,
    );

    const byType: Record<ActionType, number> = {
      tool_call: 0,
      llm_query: 0,
      file_read: 0,
      file_write: 0,
      network_request: 0,
      data_access: 0,
      auth_attempt: 0,
      state_change: 0,
      output_emission: 0,
    };
    const byRisk: Record<RiskClassification, number> = {
      safe: 0,
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    let dataAccessedBytes = 0;
    let dataTransmittedBytes = 0;
    let totalCost = 0;
    let piiAccessEvents = 0;
    const toolCounts = new Map<string, number>();

    for (const action of filtered) {
      byType[action.actionType] = (byType[action.actionType] || 0) + 1;
      byRisk[action.riskClassification] = (byRisk[action.riskClassification] || 0) + 1;
      totalCost += action.cost;
      for (const ev of action.dataAccessed) {
        dataAccessedBytes += ev.bytesAccessed;
        if (ev.type === 'pii') piiAccessEvents++;
      }
      for (const ev of action.dataTransmitted) {
        dataTransmittedBytes += ev.bytes;
      }
      if (action.toolName) {
        toolCounts.set(action.toolName, (toolCounts.get(action.toolName) || 0) + 1);
      }
    }

    const topTools = Array.from(toolCounts.entries())
      .map(([tool, count]) => ({ tool, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      agentId,
      timeRange,
      totalActions: filtered.length,
      byType,
      byRisk,
      anomaliesDetected: filteredAnomalies.length,
      dataAccessedBytes,
      dataTransmittedBytes,
      totalCost,
      piiAccessEvents,
      topTools,
    };
  }

  async detectDataExfiltration(): Promise<BehaviorAnomaly[]> {
    const anomalies = await this.loadAnomalies();
    return anomalies.filter(
      (a) => a.alertType === 'data_exfiltration' || a.alertType === 'pii_leak',
    );
  }

  async detectLoopBehavior(): Promise<BehaviorAnomaly[]> {
    const anomalies = await this.loadAnomalies();
    return anomalies.filter((a) => a.alertType === 'loop_detection');
  }

  async detectCostAnomaly(): Promise<BehaviorAnomaly[]> {
    const anomalies = await this.loadAnomalies();
    return anomalies.filter((a) => a.alertType === 'cost_anomaly');
  }

  async getStats(): Promise<{
    totalActions: number;
    totalAnomalies: number;
    byAlertType: Record<AlertType, number>;
    bySeverity: Record<RiskClassification, number>;
  }> {
    const actions = await this.loadActions();
    const anomalies = await this.loadAnomalies();

    const byAlertType: Record<AlertType, number> = {
      unauthorized_data_access: 0,
      data_exfiltration: 0,
      privilege_escalation: 0,
      tool_misuse: 0,
      loop_detection: 0,
      cost_anomaly: 0,
      pii_leak: 0,
      anomalous_behavior: 0,
    };
    const bySeverity: Record<RiskClassification, number> = {
      safe: 0,
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };
    for (const a of anomalies) {
      byAlertType[a.alertType] = (byAlertType[a.alertType] || 0) + 1;
      bySeverity[a.severity] = (bySeverity[a.severity] || 0) + 1;
    }

    return {
      totalActions: actions.length,
      totalAnomalies: anomalies.length,
      byAlertType,
      bySeverity,
    };
  }

  private computeBaseline(actions: AgentAction[]): AgentBehaviorBaseline {
    const agentId = actions[0].agentId;
    const sorted = [...actions].sort((a, b) => a.timestamp - b.timestamp);
    const first = sorted[0].timestamp;
    const last = sorted[sorted.length - 1].timestamp;
    const span = Math.max(1, last - first);
    const hours = span / (1000 * 60 * 60);
    const typicalActionsPerHour = hours > 0 ? actions.length / hours : actions.length;

    const toolCounts = new Map<string, number>();
    const typeCounts = new Map<ActionType, number>();
    const hourCounts = new Map<number, number>();
    let totalInput = 0;
    let totalOutput = 0;
    let totalCost = 0;
    let piiEvents = 0;

    for (const action of actions) {
      if (action.toolName) {
        toolCounts.set(action.toolName, (toolCounts.get(action.toolName) || 0) + 1);
      }
      typeCounts.set(action.actionType, (typeCounts.get(action.actionType) || 0) + 1);
      const hour = new Date(action.timestamp).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      totalInput += byteSizeOf(action.input);
      totalOutput += action.output ? byteSizeOf(action.output) : 0;
      totalCost += action.cost;
      for (const ev of action.dataAccessed) {
        if (ev.type === 'pii') piiEvents++;
      }
    }

    const typicalToolNames = Array.from(toolCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name]) => name);

    const typicalActionTypes: ActionType[] = Array.from(typeCounts.entries())
      .filter(([, count]) => count / actions.length >= 0.05)
      .map(([type]) => type);

    const typicalHours = Array.from(hourCounts.entries())
      .filter(([, count]) => count / actions.length >= 0.05)
      .map(([hour]) => hour)
      .sort((a, b) => a - b);

    return {
      agentId,
      typicalActionsPerHour: Number(typicalActionsPerHour.toFixed(4)),
      typicalToolNames,
      typicalActionTypes,
      avgInputSize: actions.length > 0 ? totalInput / actions.length : 0,
      avgOutputSize: actions.length > 0 ? totalOutput / actions.length : 0,
      avgCostPerHour: hours > 0 ? totalCost / hours : totalCost,
      typicalHours,
      piiAccessRate: actions.length > 0 ? piiEvents / actions.length : 0,
      lastUpdated: Date.now(),
      sampleCount: actions.length,
    };
  }

  private checkDataExfiltration(action: AgentAction): BehaviorAnomaly | null {
    const external = action.dataTransmitted.filter(
      (t) => t.destination === 'external_url' || t.destination === 'email',
    );
    if (external.length === 0) return null;

    const totalBytes = external.reduce((sum, t) => sum + t.bytes, 0);
    const unencrypted = external.filter((t) => !t.encrypted);

    let severity: RiskClassification = 'medium';
    if (totalBytes > 1024 * 1024) severity = 'critical';
    else if (totalBytes > 100 * 1024) severity = 'high';
    if (unencrypted.length > 0 && totalBytes > 10 * 1024) severity = 'critical';

    return {
      agentId: action.agentId,
      sessionId: action.sessionId,
      action,
      alertType: 'data_exfiltration',
      severity,
      description: `Detected ${external.length} external transmission(s) totaling ${totalBytes} bytes`,
      evidence: external.map(
        (t) =>
          `destination=${t.destination} bytes=${t.bytes} encrypted=${t.encrypted}`,
      ),
      recommendedAction: severity === 'critical' ? 'kill_session' : severity === 'high' ? 'pause' : 'notify',
      detectedAt: Date.now(),
      confidence: unencrypted.length > 0 ? 0.95 : 0.7,
    };
  }

  private checkPiiLeak(action: AgentAction): BehaviorAnomaly | null {
    const scanTarget = stringifyForScan(action.input) + '\n' + stringifyForScan(action.output);
    const hits = detectPiiMatches(scanTarget);
    if (hits.length === 0) return null;

    const transmittedExternally = action.dataTransmitted.some(
      (t) => t.destination === 'external_url' || t.destination === 'email',
    );
    const severity: RiskClassification = transmittedExternally
      ? 'critical'
      : action.riskClassification === 'critical'
        ? 'high'
        : 'medium';

    return {
      agentId: action.agentId,
      sessionId: action.sessionId,
      action,
      alertType: 'pii_leak',
      severity,
      description: `PII patterns detected in action payload: ${hits.join(', ')}`,
      evidence: hits.map((h) => `pattern=${h}`),
      recommendedAction: severity === 'critical' ? 'kill_session' : 'pause',
      detectedAt: Date.now(),
      confidence: 0.9,
    };
  }

  private checkToolMisuse(action: AgentAction, recent: AgentAction[]): BehaviorAnomaly | null {
    if (!action.toolName) return null;

    const baseline = this.computeBaselineFromRecent(recent, action.agentId);
    if (!baseline) return null;

    if (baseline.typicalToolNames.includes(action.toolName)) return null;

    const sameSession = recent.filter(
      (a) => a.sessionId === action.sessionId && a.toolName === action.toolName,
    );
    if (sameSession.length === 0 && action.riskClassification === 'critical') {
      return {
        agentId: action.agentId,
        sessionId: action.sessionId,
        action,
        alertType: 'tool_misuse',
        severity: 'high',
        description: `Tool "${action.toolName}" is not in agent's typical toolset and was invoked on a critical-risk action`,
        evidence: [
          `tool=${action.toolName}`,
          `baseline.typicalToolNames=${baseline.typicalToolNames.join(',') || 'none'}`,
        ],
        recommendedAction: 'pause',
        detectedAt: Date.now(),
        confidence: 0.7,
      };
    }

    return null;
  }

  private checkLoopPattern(recent: AgentAction[]): BehaviorAnomaly | null {
    if (recent.length < LOOP_REPETITION_THRESHOLD) return null;
    const now = recent[0]?.timestamp ?? Date.now();
    const window = recent.filter((a) => now - a.timestamp <= LOOP_WINDOW_MS);
    if (window.length < LOOP_REPETITION_THRESHOLD) return null;

    const signatures = new Map<string, number>();
    for (const action of window) {
      const sig = `${action.actionType}|${action.toolName ?? ''}|${stringifyForScan(action.input).slice(0, 200)}`;
      signatures.set(sig, (signatures.get(sig) || 0) + 1);
    }

    for (const [sig, count] of signatures.entries()) {
      if (count >= LOOP_REPETITION_THRESHOLD) {
        const repeated = window.find(
          (a) =>
            `${a.actionType}|${a.toolName ?? ''}|${stringifyForScan(a.input).slice(0, 200)}` === sig,
        );
        if (!repeated) continue;
        return {
          agentId: repeated.agentId,
          sessionId: repeated.sessionId,
          action: repeated,
          alertType: 'loop_detection',
          severity: count >= LOOP_REPETITION_THRESHOLD * 2 ? 'high' : 'medium',
          description: `Detected ${count} identical actions within ${LOOP_WINDOW_MS / 1000}s window`,
          evidence: [
            `signature=${sig.slice(0, 120)}`,
            `count=${count}`,
            `windowMs=${LOOP_WINDOW_MS}`,
          ],
          recommendedAction: 'pause',
          detectedAt: Date.now(),
          confidence: Math.min(1, count / (LOOP_REPETITION_THRESHOLD * 2)),
        };
      }
    }

    return null;
  }

  private checkCostAnomaly(action: AgentAction, recent: AgentAction[]): BehaviorAnomaly | null {
    if (action.cost < COST_SPIKE_MIN_AMOUNT) return null;
    const window = recent.slice(0, 20);
    if (window.length < 5) return null;
    const avg = window.reduce((s, a) => s + a.cost, 0) / window.length;
    if (avg <= 0) return null;
    if (action.cost < avg * COST_SPIKE_MULTIPLIER) return null;

    return {
      agentId: action.agentId,
      sessionId: action.sessionId,
      action,
      alertType: 'cost_anomaly',
      severity: action.cost > avg * (COST_SPIKE_MULTIPLIER * 4) ? 'critical' : 'high',
      description: `Action cost $${action.cost.toFixed(4)} is ${(action.cost / avg).toFixed(2)}x the recent average of $${avg.toFixed(4)}`,
      evidence: [
        `actionCost=${action.cost}`,
        `recentAverage=${avg.toFixed(4)}`,
        `windowSize=${window.length}`,
      ],
      recommendedAction: 'notify',
      detectedAt: Date.now(),
      confidence: Math.min(1, action.cost / (avg * COST_SPIKE_MULTIPLIER * 2)),
    };
  }

  private checkUnusualTime(action: AgentAction, baseline: AgentBehaviorBaseline | null): number {
    const hour = new Date(action.timestamp).getHours();
    if (!baseline || baseline.typicalHours.length === 0) return 0;
    if (baseline.typicalHours.includes(hour)) return 0;
    const distance = Math.min(
      ...baseline.typicalHours.map((h) => {
        const diff = Math.abs(hour - h);
        return Math.min(diff, 24 - diff);
      }),
    );
    const score = Math.min(1, distance / 12);
    return score;
  }

  private computeBaselineFromRecent(
    recent: AgentAction[],
    agentId: string,
  ): AgentBehaviorBaseline | null {
    const sameAgent = recent.filter((a) => a.agentId === agentId);
    if (sameAgent.length < 3) return null;
    return this.computeBaseline(sameAgent);
  }

  private generateId(): string {
    return randomUUID();
  }

  private async loadActions(): Promise<AgentAction[]> {
    const raw = await this.store.get<AgentAction[]>(ACTIONS_KEY);
    return raw ?? [];
  }

  private async saveActions(actions: AgentAction[]): Promise<void> {
    await this.store.set(ACTIONS_KEY, actions);
  }

  private async loadAnomalies(): Promise<BehaviorAnomaly[]> {
    const raw = await this.store.get<BehaviorAnomaly[]>(ANOMALIES_KEY);
    return raw ?? [];
  }

  private async saveAnomalies(anomalies: BehaviorAnomaly[]): Promise<void> {
    await this.store.set(ANOMALIES_KEY, anomalies);
  }

  private async loadBaselines(): Promise<AgentBehaviorBaseline[]> {
    const raw = await this.store.get<AgentBehaviorBaseline[]>(BASELINES_KEY);
    return raw ?? [];
  }

  private async saveBaselines(baselines: AgentBehaviorBaseline[]): Promise<void> {
    await this.store.set(BASELINES_KEY, baselines);
  }
}