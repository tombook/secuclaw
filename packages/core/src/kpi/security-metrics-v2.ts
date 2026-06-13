import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';

const LATEST_KEY = 'kpi/security-metrics-v2.json';
const HISTORY_KEY = 'kpi/security-metrics-v2-history.json';

export interface MetricTimeRange {
  start: number;
  end: number;
}

export type MetricTrend = 'improving' | 'stable' | 'degrading' | 'insufficient_data';

export interface MTTDMetrics {
  avgDetectionTimeMs: number;
  medianDetectionTimeMs: number;
  p95DetectionTimeMs: number;
  bySource: Record<string, number>;
  bySeverity: Record<string, number>;
  trend: MetricTrend;
  dataPoints: number;
}

export interface MTTRMetrics {
  avgResponseTimeMs: number;
  avgResolutionTimeMs: number;
  medianResponseTimeMs: number;
  medianResolutionTimeMs: number;
  bySeverity: Record<string, { response: number; resolution: number }>;
  byRole: Record<string, { response: number; resolution: number }>;
  trend: MetricTrend;
  dataPoints: number;
}

export interface ROIMetrics {
  totalSecurityInvestment: number;
  estimatedRiskReduction: number;
  incidentsPrevented: number;
  costPerIncident: number;
  estimatedSavings: number;
  roi: number;
  breakdown: Array<{ category: string; investment: number; riskReduction: number; roi: number }>;
}

export interface CollaborationMetrics {
  avgRaciHandoffTimeMs: number;
  escalationRate: number;
  falsePositiveRate: number;
  crossRoleActions: number;
  warRoomSessions: number;
  avgWarRoomDurationMs: number;
  byRole: Record<string, {
    tasksAssigned: number;
    tasksCompleted: number;
    avgCompletionTimeMs: number;
    escalationCount: number;
  }>;
}

export interface AttackSimulationMetrics {
  basCoverageScore: number;
  mitreTechniquesTested: number;
  mitreTechniquesDetected: number;
  detectionRate: number;
  byTactic: Record<string, { tested: number; detected: number; rate: number }>;
}

export interface SecurityMetricsV2 {
  id: string;
  timestamp: number;
  timeRange: MetricTimeRange;
  mttd: MTTDMetrics;
  mttr: MTTRMetrics;
  roi: ROIMetrics;
  collaboration: CollaborationMetrics;
  attackSimulation: AttackSimulationMetrics;
  overallScore: number;
  previousScore: number | null;
  trend: MetricTrend;
}

export class SecurityMetricsV2Service {
  constructor(private store: JsonStore) {}

  async compute(timeRange: MetricTimeRange): Promise<SecurityMetricsV2> {
    const previous = await this.getLatest();
    const previousScore = previous?.overallScore ?? null;

    const [mttd, mttr, roi, collaboration, attackSimulation] = await Promise.all([
      this.computeMTTD(timeRange),
      this.computeMTTR(timeRange),
      this.computeROI(timeRange),
      this.computeCollaboration(timeRange),
      this.computeAttackSimulation(timeRange),
    ]);

    const metrics: SecurityMetricsV2 = {
      id: this.generateId(),
      timestamp: Date.now(),
      timeRange,
      mttd,
      mttr,
      roi,
      collaboration,
      attackSimulation,
      overallScore: 0,
      previousScore,
      trend: 'insufficient_data',
    };

    metrics.overallScore = this.computeOverallScore(metrics);
    metrics.trend = this.determineTrend(metrics.overallScore, previousScore);

    await this.store.set(LATEST_KEY, metrics);

    const history = await this.getHistory();
    const updatedHistory = [...history, metrics].slice(-200);
    await this.store.set(HISTORY_KEY, updatedHistory);

    return metrics;
  }

  async getLatest(): Promise<SecurityMetricsV2 | null> {
    const raw = await this.store.get<SecurityMetricsV2>(LATEST_KEY);
    return raw ?? null;
  }

  async getHistory(limit?: number): Promise<SecurityMetricsV2[]> {
    const raw = await this.store.get<SecurityMetricsV2[]>(HISTORY_KEY);
    const history = raw ?? [];
    if (limit !== undefined && limit > 0) {
      return history.slice(-limit);
    }
    return history;
  }

  async getExecutiveSummary(): Promise<string> {
    const latest = await this.getLatest();
    if (!latest) {
      return '# Security Metrics Report\n\nNo metrics data available. Run a compute cycle first.';
    }

    const trendEmoji = latest.trend === 'improving' ? '📈' : latest.trend === 'degrading' ? '📉' : '➡️';
    const scoreColor = latest.overallScore >= 80 ? '🟢' : latest.overallScore >= 60 ? '🟡' : '🔴';

    return [
      `# Security Metrics Executive Summary`,
      ``,
      `**Report ID:** ${latest.id}`,
      `**Generated:** ${new Date(latest.timestamp).toISOString()}`,
      `**Period:** ${new Date(latest.timeRange.start).toISOString()} — ${new Date(latest.timeRange.end).toISOString()}`,
      ``,
      `## Overall Score: ${scoreColor} ${latest.overallScore}/100 ${trendEmoji} ${latest.trend}`,
      ``,
      `## Mean Time to Detect (MTTD)`,
      `- **Average:** ${(latest.mttd.avgDetectionTimeMs / 60000).toFixed(1)} min`,
      `- **Median:** ${(latest.mttd.medianDetectionTimeMs / 60000).toFixed(1)} min`,
      `- **P95:** ${(latest.mttd.p95DetectionTimeMs / 60000).toFixed(1)} min`,
      `- **Data Points:** ${latest.mttd.dataPoints}`,
      ``,
      `## Mean Time to Respond/Resolve (MTTR)`,
      `- **Avg Response:** ${(latest.mttr.avgResponseTimeMs / 60000).toFixed(1)} min`,
      `- **Avg Resolution:** ${(latest.mttr.avgResolutionTimeMs / 3600000).toFixed(1)} hr`,
      `- **Median Response:** ${(latest.mttr.medianResponseTimeMs / 60000).toFixed(1)} min`,
      `- **Median Resolution:** ${(latest.mttr.medianResolutionTimeMs / 3600000).toFixed(1)} hr`,
      `- **Data Points:** ${latest.mttr.dataPoints}`,
      ``,
      `## Return on Investment`,
      `- **Total Investment:** $${latest.roi.totalSecurityInvestment.toLocaleString()}`,
      `- **Estimated Savings:** $${latest.roi.estimatedSavings.toLocaleString()}`,
      `- **ROI:** ${latest.roi.roi.toFixed(1)}%`,
      `- **Incidents Prevented:** ${latest.roi.incidentsPrevented}`,
      ``,
      `## Collaboration Efficiency`,
      `- **Escalation Rate:** ${(latest.collaboration.escalationRate * 100).toFixed(1)}%`,
      `- **False Positive Rate:** ${(latest.collaboration.falsePositiveRate * 100).toFixed(1)}%`,
      `- **War Room Sessions:** ${latest.collaboration.warRoomSessions}`,
      ``,
      `## Attack Simulation (MITRE ATT&CK)`,
      `- **BAS Coverage:** ${latest.attackSimulation.basCoverageScore}/100`,
      `- **Detection Rate:** ${(latest.attackSimulation.detectionRate * 100).toFixed(1)}%`,
      `- **Techniques Tested:** ${latest.attackSimulation.mitreTechniquesTested}`,
      `- **Techniques Detected:** ${latest.attackSimulation.mitreTechniquesDetected}`,
    ].join('\n');
  }

  async getMTTDReport(): Promise<MTTDMetrics | null> {
    const latest = await this.getLatest();
    return latest?.mttd ?? null;
  }

  async getMTTRReport(): Promise<MTTRMetrics | null> {
    const latest = await this.getLatest();
    return latest?.mttr ?? null;
  }

  async getROIReport(): Promise<ROIMetrics | null> {
    const latest = await this.getLatest();
    return latest?.roi ?? null;
  }

  async getCollaborationReport(): Promise<CollaborationMetrics | null> {
    const latest = await this.getLatest();
    return latest?.collaboration ?? null;
  }

  private async computeMTTD(timeRange: MetricTimeRange): Promise<MTTDMetrics> {
    const incidents = await this.store.get<any[]>('incidents.json');
    const inRange = (incidents ?? []).filter(i => {
      const detected = i.timeline?.detectedAt ?? i.timeline?.reportedAt ?? 0;
      return detected >= timeRange.start && detected <= timeRange.end;
    });

    const detectionTimes: number[] = [];
    const bySource: Record<string, number[]> = {};
    const bySeverity: Record<string, number[]> = {};

    for (const incident of inRange) {
      const detected = incident.timeline?.detectedAt ?? incident.timeline?.reportedAt;
      const created = incident.timeline?.createdAt ?? incident.createdAt;
      if (detected && created) {
        const dt = detected - created;
        if (dt >= 0) {
          detectionTimes.push(dt);
          const source = incident.info?.source ?? incident.info?.detectionSource ?? 'unknown';
          if (!bySource[source]) bySource[source] = [];
          bySource[source].push(dt);
          const severity = incident.info?.severity ?? 'unknown';
          if (!bySeverity[severity]) bySeverity[severity] = [];
          bySeverity[severity].push(dt);
        }
      }
    }

    const sorted = [...detectionTimes].sort((a, b) => a - b);
    const avg = sorted.length > 0
      ? sorted.reduce((s, v) => s + v, 0) / sorted.length
      : 0;
    const median = sorted.length > 0
      ? sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)]
      : 0;
    const p95 = sorted.length > 0
      ? sorted[Math.min(Math.ceil(sorted.length * 0.95) - 1, sorted.length - 1)]
      : 0;

    const bySourceAvg: Record<string, number> = {};
    for (const [source, times] of Object.entries(bySource)) {
      bySourceAvg[source] = times.length > 0
        ? Math.round(times.reduce((s, v) => s + v, 0) / times.length)
        : 0;
    }

    const bySeverityAvg: Record<string, number> = {};
    for (const [sev, times] of Object.entries(bySeverity)) {
      bySeverityAvg[sev] = times.length > 0
        ? Math.round(times.reduce((s, v) => s + v, 0) / times.length)
        : 0;
    }

    const history = await this.getHistory(5);
    let trend: MetricTrend = 'insufficient_data';
    if (history.length >= 2) {
      const prevAvg = history[history.length - 1].mttd.avgDetectionTimeMs;
      if (prevAvg > 0) {
        const change = (avg - prevAvg) / prevAvg;
        trend = change < -0.05 ? 'improving' : change > 0.05 ? 'degrading' : 'stable';
      }
    }

    return {
      avgDetectionTimeMs: Math.round(avg),
      medianDetectionTimeMs: Math.round(median),
      p95DetectionTimeMs: Math.round(p95),
      bySource: bySourceAvg,
      bySeverity: bySeverityAvg,
      trend,
      dataPoints: sorted.length,
    };
  }

  private async computeMTTR(timeRange: MetricTimeRange): Promise<MTTRMetrics> {
    const incidents = await this.store.get<any[]>('incidents.json');
    const inRange = (incidents ?? []).filter(i => {
      const reported = i.timeline?.reportedAt ?? i.createdAt ?? 0;
      return reported >= timeRange.start && reported <= timeRange.end;
    });

    const responseTimes: number[] = [];
    const resolutionTimes: number[] = [];
    const bySeverity: Record<string, { response: number[]; resolution: number[] }> = {};
    const byRole: Record<string, { response: number[]; resolution: number[] }> = {};

    for (const incident of inRange) {
      const reported = incident.timeline?.reportedAt ?? incident.createdAt;
      const acknowledged = incident.timeline?.acknowledgedAt;
      const closed = incident.timeline?.closedAt ?? incident.timeline?.resolvedAt;

      const severity = incident.info?.severity ?? 'unknown';
      if (!bySeverity[severity]) bySeverity[severity] = { response: [], resolution: [] };

      const assignee = incident.workflow?.assignee ?? incident.assignee?.role ?? 'unassigned';
      if (!byRole[assignee]) byRole[assignee] = { response: [], resolution: [] };

      if (reported && acknowledged) {
        const rt = acknowledged - reported;
        if (rt >= 0) {
          responseTimes.push(rt);
          bySeverity[severity].response.push(rt);
          byRole[assignee].response.push(rt);
        }
      }

      if (reported && closed) {
        const rzt = closed - reported;
        if (rzt >= 0) {
          resolutionTimes.push(rzt);
          bySeverity[severity].resolution.push(rzt);
          byRole[assignee].resolution.push(rzt);
        }
      }
    }

    const calcAvg = (arr: number[]) => arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
    const calcMedian = (arr: number[]) => {
      if (arr.length === 0) return 0;
      const s = [...arr].sort((a, b) => a - b);
      return s.length % 2 === 0
        ? (s[s.length / 2 - 1] + s[s.length / 2]) / 2
        : s[Math.floor(s.length / 2)];
    };

    const aggregateBySeverity: Record<string, { response: number; resolution: number }> = {};
    for (const [sev, data] of Object.entries(bySeverity)) {
      aggregateBySeverity[sev] = {
        response: Math.round(calcAvg(data.response)),
        resolution: Math.round(calcAvg(data.resolution)),
      };
    }

    const aggregateByRole: Record<string, { response: number; resolution: number }> = {};
    for (const [role, data] of Object.entries(byRole)) {
      aggregateByRole[role] = {
        response: Math.round(calcAvg(data.response)),
        resolution: Math.round(calcAvg(data.resolution)),
      };
    }

    const history = await this.getHistory(5);
    let trend: MetricTrend = 'insufficient_data';
    if (history.length >= 2) {
      const prevAvg = history[history.length - 1].mttr.avgResolutionTimeMs;
      const curAvg = calcAvg(resolutionTimes);
      if (prevAvg > 0) {
        const change = (curAvg - prevAvg) / prevAvg;
        trend = change < -0.05 ? 'improving' : change > 0.05 ? 'degrading' : 'stable';
      }
    }

    return {
      avgResponseTimeMs: Math.round(calcAvg(responseTimes)),
      avgResolutionTimeMs: Math.round(calcAvg(resolutionTimes)),
      medianResponseTimeMs: Math.round(calcMedian(responseTimes)),
      medianResolutionTimeMs: Math.round(calcMedian(resolutionTimes)),
      bySeverity: aggregateBySeverity,
      byRole: aggregateByRole,
      trend,
      dataPoints: responseTimes.length,
    };
  }

  private async computeROI(timeRange: MetricTimeRange): Promise<ROIMetrics> {
    const [incidents, investments, preventionLogs] = await Promise.all([
      this.store.get<any[]>('incidents.json'),
      this.store.get<any[]>('security-investments.json'),
      this.store.get<any[]>('prevention-logs.json'),
    ]);

    const inRangeIncidents = (incidents ?? []).filter(i => {
      const ts = i.timeline?.reportedAt ?? i.createdAt ?? 0;
      return ts >= timeRange.start && ts <= timeRange.end;
    });

    const inRangePrevention = (preventionLogs ?? []).filter(p => {
      const ts = p.timestamp ?? p.detectedAt ?? 0;
      return ts >= timeRange.start && ts <= timeRange.end;
    });

    const allInvestments = investments ?? [];
    const totalSecurityInvestment = allInvestments.reduce((sum, inv) => {
      const cost = inv.amount ?? inv.cost ?? 0;
      return sum + cost;
    }, 0);

    const incidentsPrevented = inRangePrevention.length;
    const totalIncidents = inRangeIncidents.length + incidentsPrevented;
    const estimatedRiskReduction = totalIncidents > 0
      ? Math.round((incidentsPrevented / totalIncidents) * 100)
      : 0;

    const resolvedIncidents = inRangeIncidents.filter(i =>
      ['resolved', 'closed'].includes(i.workflow?.status),
    );
    const totalResolutionCost = resolvedIncidents.reduce((sum, i) => {
      return sum + (i.cost ?? i.estimatedCost ?? 0);
    }, 0);
    const costPerIncident = resolvedIncidents.length > 0
      ? Math.round(totalResolutionCost / resolvedIncidents.length)
      : 50000;

    const estimatedSavings = incidentsPrevented * costPerIncident;
    const roi = totalSecurityInvestment > 0
      ? Math.round(((estimatedSavings - totalSecurityInvestment) / totalSecurityInvestment) * 10000) / 100
      : 0;

    const categoryMap: Record<string, { investment: number; riskReduction: number; prevented: number }> = {};
    for (const inv of allInvestments) {
      const cat = inv.category ?? 'general';
      if (!categoryMap[cat]) categoryMap[cat] = { investment: 0, riskReduction: 0, prevented: 0 };
      categoryMap[cat].investment += inv.amount ?? inv.cost ?? 0;
    }

    for (const p of inRangePrevention) {
      const cat = p.category ?? p.type ?? 'general';
      if (categoryMap[cat]) {
        categoryMap[cat].prevented++;
      }
    }

    const breakdown = Object.entries(categoryMap).map(([category, data]) => ({
      category,
      investment: data.investment,
      riskReduction: totalIncidents > 0
        ? Math.round((data.prevented / totalIncidents) * 100)
        : 0,
      roi: data.investment > 0
        ? Math.round(((data.prevented * costPerIncident - data.investment) / data.investment) * 10000) / 100
        : 0,
    }));

    return {
      totalSecurityInvestment,
      estimatedRiskReduction,
      incidentsPrevented,
      costPerIncident,
      estimatedSavings,
      roi,
      breakdown,
    };
  }

  private async computeCollaboration(timeRange: MetricTimeRange): Promise<CollaborationMetrics> {
    const [raciLogs, escalationLogs, warRoomSessions] = await Promise.all([
      this.store.get<any[]>('raci-logs.json'),
      this.store.get<any[]>('escalation-logs.json'),
      this.store.get<any[]>('warroom-sessions.json'),
    ]);

    const filterByRange = <T extends Record<string, any>>(items: T[], tsField: string): T[] =>
      (items ?? []).filter(item => {
        const ts = item[tsField] ?? 0;
        return ts >= timeRange.start && ts <= timeRange.end;
      });

    const inRangeRaci = filterByRange(raciLogs ?? [], 'timestamp');
    const inRangeEscalations = filterByRange(escalationLogs ?? [], 'timestamp');
    const inRangeWarRooms = filterByRange(warRoomSessions ?? [], 'startedAt');

    const handoffTimes = inRangeRaci
      .filter(r => r.handoffTimeMs != null && r.handoffTimeMs >= 0)
      .map(r => r.handoffTimeMs);
    const avgRaciHandoffTimeMs = handoffTimes.length > 0
      ? Math.round(handoffTimes.reduce((s, v) => s + v, 0) / handoffTimes.length)
      : 0;

    const totalAlerts = inRangeRaci.length + inRangeEscalations.length;
    const escalationRate = totalAlerts > 0
      ? inRangeEscalations.length / totalAlerts
      : 0;

    const falsePositives = inRangeRaci.filter(r => r.falsePositive === true).length;
    const falsePositiveRate = inRangeRaci.length > 0
      ? falsePositives / inRangeRaci.length
      : 0;

    const crossRoleActions = inRangeRaci.filter(r => r.crossRole === true).length;

    const warRoomDurations = inRangeWarRooms
      .filter(w => w.endedAt != null)
      .map(w => (w.endedAt as number) - (w.startedAt as number));
    const avgWarRoomDurationMs = warRoomDurations.length > 0
      ? Math.round(warRoomDurations.reduce((s, v) => s + v, 0) / warRoomDurations.length)
      : 0;

    const roleData: Record<string, {
      tasksAssigned: number;
      tasksCompleted: number;
      completionTimes: number[];
      escalationCount: number;
    }> = {};

    for (const r of inRangeRaci) {
      const role = r.assignedRole ?? r.role ?? 'unknown';
      if (!roleData[role]) {
        roleData[role] = { tasksAssigned: 0, tasksCompleted: 0, completionTimes: [], escalationCount: 0 };
      }
      roleData[role].tasksAssigned++;
      if (r.status === 'completed' || r.completed === true) {
        roleData[role].tasksCompleted++;
        if (r.completionTimeMs != null) {
          roleData[role].completionTimes.push(r.completionTimeMs);
        }
      }
    }

    for (const e of inRangeEscalations) {
      const role = e.fromRole ?? e.role ?? 'unknown';
      if (roleData[role]) {
        roleData[role].escalationCount++;
      }
    }

    const byRole: Record<string, {
      tasksAssigned: number;
      tasksCompleted: number;
      avgCompletionTimeMs: number;
      escalationCount: number;
    }> = {};
    for (const [role, data] of Object.entries(roleData)) {
      byRole[role] = {
        tasksAssigned: data.tasksAssigned,
        tasksCompleted: data.tasksCompleted,
        avgCompletionTimeMs: data.completionTimes.length > 0
          ? Math.round(data.completionTimes.reduce((s, v) => s + v, 0) / data.completionTimes.length)
          : 0,
        escalationCount: data.escalationCount,
      };
    }

    return {
      avgRaciHandoffTimeMs,
      escalationRate,
      falsePositiveRate,
      crossRoleActions,
      warRoomSessions: inRangeWarRooms.length,
      avgWarRoomDurationMs,
      byRole,
    };
  }

  private async computeAttackSimulation(timeRange: MetricTimeRange): Promise<AttackSimulationMetrics> {
    const [basResults, mitreResults] = await Promise.all([
      this.store.get<any[]>('bas-results.json'),
      this.store.get<any[]>('mitre-test-results.json'),
    ]);

    const inRangeBas = (basResults ?? []).filter(b => {
      const ts = b.timestamp ?? b.executedAt ?? 0;
      return ts >= timeRange.start && ts <= timeRange.end;
    });

    const inRangeMitre = (mitreResults ?? []).filter(m => {
      const ts = m.timestamp ?? m.executedAt ?? 0;
      return ts >= timeRange.start && ts <= timeRange.end;
    });

    const basCoverageScore = inRangeBas.length > 0
      ? Math.round(
          (inRangeBas.filter(b => b.covered === true || b.detected === true).length /
            inRangeBas.length) * 100,
        )
      : 0;

    const mitreTechniquesTested = inRangeMitre.length;
    const mitreTechniquesDetected = inRangeMitre.filter(
      m => m.detected === true || m.alertTriggered === true,
    ).length;
    const detectionRate = mitreTechniquesTested > 0
      ? mitreTechniquesDetected / mitreTechniquesTested
      : 0;

    const tacticMap: Record<string, { tested: number; detected: number }> = {};
    for (const m of inRangeMitre) {
      const tactic = m.tactic ?? m.killChainPhase ?? 'unknown';
      if (!tacticMap[tactic]) tacticMap[tactic] = { tested: 0, detected: 0 };
      tacticMap[tactic].tested++;
      if (m.detected === true || m.alertTriggered === true) {
        tacticMap[tactic].detected++;
      }
    }

    const byTactic: Record<string, { tested: number; detected: number; rate: number }> = {};
    for (const [tactic, data] of Object.entries(tacticMap)) {
      byTactic[tactic] = {
        tested: data.tested,
        detected: data.detected,
        rate: data.tested > 0 ? data.detected / data.tested : 0,
      };
    }

    return {
      basCoverageScore,
      mitreTechniquesTested,
      mitreTechniquesDetected,
      detectionRate,
      byTactic,
    };
  }

  private computeOverallScore(metrics: Partial<SecurityMetricsV2>): number {
    const mttd = metrics.mttd;
    const mttr = metrics.mttr;
    const roi = metrics.roi;
    const collab = metrics.collaboration;
    const attackSim = metrics.attackSimulation;
    if (!mttd || !mttr || !roi || !collab || !attackSim) return 0;

    const mttdScore = mttd.dataPoints > 0
      ? Math.max(0, 100 - (mttd.avgDetectionTimeMs / 60000) * 2)
      : 50;

    const mttrScore = mttr.dataPoints > 0
      ? Math.max(0, 100 - (mttr.avgResolutionTimeMs / 3600000) * 5)
      : 50;

    const roiScore = Math.min(Math.max(roi.roi / 10, 0), 100);

    const collabScore = Math.max(0,
      (1 - collab.escalationRate) * 40 +
      (1 - collab.falsePositiveRate) * 30 +
      (collab.crossRoleActions > 0 ? 30 : 15),
    );

    const attackScore = attackSim.basCoverageScore * 0.4 + attackSim.detectionRate * 100 * 0.6;

    const overallScore = Math.round(
      mttdScore * 0.2 +
      mttrScore * 0.2 +
      roiScore * 0.15 +
      collabScore * 0.2 +
      attackScore * 0.25,
    );

    return Math.min(Math.max(overallScore, 0), 100);
  }

  private determineTrend(current: number, previous: number | null): MetricTrend {
    if (previous === null) return 'insufficient_data';
    const diff = current - previous;
    if (diff > 3) return 'improving';
    if (diff < -3) return 'degrading';
    return 'stable';
  }

  private generateId(): string {
    return randomUUID();
  }
}
