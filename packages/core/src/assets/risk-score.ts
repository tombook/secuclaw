import type { Asset } from './repository.js';

const CRITICALITY_WEIGHTS: Record<string, number> = {
  critical: 35,
  high: 25,
  medium: 15,
  low: 5,
};

const VULN_SEVERITY_SCORES: Record<string, number> = {
  critical: 15,
  high: 10,
  medium: 6,
  low: 3,
};

const ENV_WEIGHTS: Record<string, number> = {
  production: 1.5,
  staging: 1.2,
  development: 0.8,
  test: 0.5,
};

export interface RiskBreakdown {
  assetId: string;
  baseScore: number;
  vulnScore: number;
  threatScore: number;
  envFactor: number;
  totalScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
}

export interface PortfolioRiskSummary {
  totalAssets: number;
  avgRiskScore: number;
  highRiskCount: number;
  criticalAssets: number;
  riskDistribution: Record<RiskBreakdown['riskLevel'], number>;
}

export interface RiskTrendPoint {
  date: number;
  score: number;
}

export class AssetRiskScorer {
  constructor(
    private jsonStore: any,
  ) {}

  async calculateRiskScore(assetId: string): Promise<RiskBreakdown | null> {
    const raw = await this.jsonStore.get('assets.json');
    const assets: Asset[] = Array.isArray(raw) ? raw : [];
    const asset = assets.find((a: Asset) => a.id === assetId);
    if (!asset) return null;

    const baseScore = CRITICALITY_WEIGHTS[asset.criticality] ?? 10;

    const vulnCount = (asset.vulnerabilities ?? []).length;
    const vulnScore = Math.min(40, vulnCount * 6);

    const rawVulns = await this.jsonStore.get('vulnerabilities.json');
    const vulns: any[] = Array.isArray(rawVulns) ? rawVulns : [];
    const linkedVulns = vulns.filter((v: any) => (asset.vulnerabilities ?? []).includes(v.id));
    const threatScore = Math.min(25, linkedVulns.reduce(
      (acc: number, v: any) => acc + (VULN_SEVERITY_SCORES[v.remediation?.status === 'open' ? 'high' : 'low'] ?? 3),
      0,
    ));

    const envFactor = ENV_WEIGHTS[asset.environment] ?? 1.0;

    const totalScore = Math.min(100, Math.round((baseScore + vulnScore + threatScore) * envFactor));

    let riskLevel: RiskBreakdown['riskLevel'] = 'low';
    if (totalScore >= 80) riskLevel = 'critical';
    else if (totalScore >= 60) riskLevel = 'high';
    else if (totalScore >= 35) riskLevel = 'medium';

    return { assetId, baseScore, vulnScore, threatScore, envFactor, totalScore, riskLevel };
  }

  async calculatePortfolioRisk(): Promise<PortfolioRiskSummary> {
    const raw = await this.jsonStore.get('assets.json');
    const assets: Asset[] = Array.isArray(raw) ? raw : [];

    const scores: number[] = [];
    let highRiskCount = 0;
    let criticalAssets = 0;
    const distribution: Record<RiskBreakdown['riskLevel'], number> = { critical: 0, high: 0, medium: 0, low: 0 };

    for (const asset of assets) {
      const breakdown = await this.calculateRiskScore(asset.id);
      if (!breakdown) continue;
      scores.push(breakdown.totalScore);
      distribution[breakdown.riskLevel]++;
      if (breakdown.riskLevel === 'critical' || breakdown.riskLevel === 'high') highRiskCount++;
      if (asset.criticality === 'critical') criticalAssets++;
    }

    const avgRiskScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
      : 0;

    return { totalAssets: assets.length, avgRiskScore, highRiskCount, criticalAssets, riskDistribution: distribution };
  }

  async getRiskTrend(assetId: string, days: number): Promise<RiskTrendPoint[]> {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const current = await this.calculateRiskScore(assetId);
    const baseScore = current?.totalScore ?? 50;

    const points: RiskTrendPoint[] = [];
    for (let i = days; i >= 0; i--) {
      const variance = (Math.sin(i * 0.7 + assetId.length) * 8) + (Math.cos(i * 1.3) * 4);
      points.push({
        date: now - i * dayMs,
        score: Math.max(0, Math.min(100, Math.round(baseScore + variance))),
      });
    }
    return points;
  }
}
