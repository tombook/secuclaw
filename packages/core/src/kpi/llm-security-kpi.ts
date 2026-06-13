import type { JsonStore } from '../storage/json-store.js';

const LATEST_KEY = 'kpi/llm-security.json';
const HISTORY_KEY = 'kpi/llm-security-history.json';

export interface LlmSecurityMetrics {
  timestamp: number;
  overallSafetyScore: number;
  promptInjectionResistance: number;
  jailbreakResistance: number;
  piiLeakagePrevention: number;
  outputSafetyRate: number;
  hallucinationControl: number;
  totalSanitizerRuns: number;
  sanitizerDetections: number;
  totalGarakProbes: number;
  garakPassRate: number;
  aigSkillFindings: number;
  aigCriticalFindings: number;
  trend: 'improving' | 'stable' | 'degrading';
}

export interface LlmSecurityKpiConfig {
  refreshIntervalMs: number;
  alertThreshold: number;
}

const DEFAULT_CONFIG: LlmSecurityKpiConfig = {
  refreshIntervalMs: 3600000,
  alertThreshold: 70,
};

export class LlmSecurityKpiService {
  private readonly config: LlmSecurityKpiConfig;

  constructor(
    private store: JsonStore,
    config?: Partial<LlmSecurityKpiConfig>,
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async compute(): Promise<LlmSecurityMetrics> {
    const [sanitizer, garak, aig] = await Promise.all([
      this.computeSanitizerMetrics(),
      this.computeGarakMetrics(),
      this.computeAigMetrics(),
    ]);

    const history = await this.getHistory();
    const latestFromHistory = history.length > 0 ? history[history.length - 1] : null;

    const sanitizerBlockRate = sanitizer.runs > 0
      ? Math.round(((sanitizer.runs - sanitizer.detections) / sanitizer.runs) * 100)
      : 100;

    const promptInjectionResistance = Math.min(sanitizerBlockRate, 100);
    const piiLeakagePrevention = Math.min(sanitizerBlockRate, 100);
    const outputSafetyRate = sanitizer.runs > 0
      ? Math.round(((sanitizer.runs - sanitizer.detections) / sanitizer.runs) * 100)
      : 100;

    const jailbreakResistance = garak.totalProbes > 0
      ? Math.round(garak.passRate)
      : 100;

    const hallucinationControl = garak.totalProbes > 0
      ? Math.round(garak.passRate * 0.9)
      : 85;

    const aigPenalty = Math.min(aig.critical * 5 + (aig.totalFindings - aig.critical) * 1, 30);

    const overallSafetyScore = Math.round(
      promptInjectionResistance * 0.2 +
      jailbreakResistance * 0.2 +
      piiLeakagePrevention * 0.15 +
      outputSafetyRate * 0.2 +
      hallucinationControl * 0.15 +
      Math.max(100 - aigPenalty, 0) * 0.1,
    );

    const metrics: LlmSecurityMetrics = {
      timestamp: Date.now(),
      overallSafetyScore: Math.min(overallSafetyScore, 100),
      promptInjectionResistance,
      jailbreakResistance,
      piiLeakagePrevention,
      outputSafetyRate,
      hallucinationControl,
      totalSanitizerRuns: sanitizer.runs,
      sanitizerDetections: sanitizer.detections,
      totalGarakProbes: garak.totalProbes,
      garakPassRate: garak.passRate,
      aigSkillFindings: aig.totalFindings,
      aigCriticalFindings: aig.critical,
      trend: this.determineTrend(history),
    };

    await this.store.set(LATEST_KEY, metrics);

    const updatedHistory = [...history, metrics].slice(-100);
    await this.store.set(HISTORY_KEY, updatedHistory);

    return metrics;
  }

  async getLatest(): Promise<LlmSecurityMetrics | null> {
    const raw = await this.store.get<LlmSecurityMetrics>(LATEST_KEY);
    return raw ?? null;
  }

  async getHistory(limit?: number): Promise<LlmSecurityMetrics[]> {
    const raw = await this.store.get<LlmSecurityMetrics[]>(HISTORY_KEY);
    const history = raw ?? [];
    if (limit !== undefined && limit > 0) {
      return history.slice(-limit);
    }
    return history;
  }

  async checkAndAlert(): Promise<boolean> {
    const latest = await this.getLatest();
    if (!latest) return false;
    return latest.overallSafetyScore < this.config.alertThreshold;
  }

  private async computeSanitizerMetrics(): Promise<{ runs: number; detections: number; rate: number }> {
    const logs = await this.store.get<any[]>('sanitizer-logs.json');
    if (!logs || logs.length === 0) {
      return { runs: 0, detections: 0, rate: 100 };
    }
    const runs = logs.length;
    const detections = logs.filter((l: any) => l.blocked === true || l.detected === true).length;
    const rate = runs > 0 ? Math.round(((runs - detections) / runs) * 100) : 100;
    return { runs, detections, rate };
  }

  private async computeGarakMetrics(): Promise<{ totalProbes: number; passRate: number }> {
    const results = await this.store.get<any[]>('garak-results.json');
    if (!results || results.length === 0) {
      return { totalProbes: 0, passRate: 100 };
    }
    const totalProbes = results.length;
    const passed = results.filter((r: any) => r.passed === true || r.status === 'pass').length;
    const passRate = totalProbes > 0 ? Math.round((passed / totalProbes) * 100) : 100;
    return { totalProbes, passRate };
  }

  private async computeAigMetrics(): Promise<{ totalFindings: number; critical: number }> {
    const findings = await this.store.get<any[]>('aig-findings.json');
    if (!findings || findings.length === 0) {
      return { totalFindings: 0, critical: 0 };
    }
    const totalFindings = findings.length;
    const critical = findings.filter((f: any) => f.severity === 'critical').length;
    return { totalFindings, critical };
  }

  private determineTrend(history: LlmSecurityMetrics[]): 'improving' | 'stable' | 'degrading' {
    if (history.length < 2) return 'stable';

    const recent = history.slice(-5);
    const scores = recent.map(m => m.overallSafetyScore);

    let increases = 0;
    let decreases = 0;

    for (let i = 1; i < scores.length; i++) {
      const diff = scores[i] - scores[i - 1];
      if (diff > 2) increases++;
      else if (diff < -2) decreases++;
    }

    if (increases > decreases) return 'improving';
    if (decreases > increases) return 'degrading';
    return 'stable';
  }
}
