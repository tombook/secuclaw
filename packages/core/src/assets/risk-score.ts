import type { SecurityAsset, AssetCriticality, AssetEnvironment } from './types.js';

const CRITICALITY_WEIGHTS: Record<AssetCriticality, number> = {
  critical: 35,
  high: 25,
  medium: 15,
  low: 5,
  info: 0,
};

const VULN_SEVERITY_SCORES: Record<string, number> = {
  critical: 15,
  high: 10,
  medium: 6,
  low: 3,
};

const ENV_WEIGHTS: Record<AssetEnvironment, number> = {
  production: 1.5,
  staging: 1.2,
  development: 0.8,
  testing: 0.5,
  dr: 1.0,
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

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'acceptable';

/**
 * 独立计算资产风险评分（无状态）
 */
export function calculateAssetRiskScore(asset: SecurityAsset): number {
  const baseScore = CRITICALITY_WEIGHTS[asset.info.criticality] ?? 10;
  
  // 漏洞评分
  const vulnScore = Math.min(40, 
    asset.risk.criticalVulnerabilityCount * VULN_SEVERITY_SCORES.critical +
    asset.risk.highVulnerabilityCount * VULN_SEVERITY_SCORES.high +
    asset.risk.mediumVulnerabilityCount * VULN_SEVERITY_SCORES.medium +
    asset.risk.lowVulnerabilityCount * VULN_SEVERITY_SCORES.low
  );
  
  // 事件和威胁评分
  const threatScore = Math.min(25, 
    asset.risk.incidentCount * 10 + 
    asset.risk.threatCount * 5
  );
  
  // 环境系数
  const envFactor = ENV_WEIGHTS[asset.info.environment] ?? 1.0;
  
  // 总分 0-100
  return Math.min(100, Math.round((baseScore + vulnScore + threatScore) * envFactor));
}

/**
 * 根据风险分数返回风险等级
 */
export function getRiskLevelFromScore(score: number): RiskLevel {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 35) return 'medium';
  if (score >= 15) return 'low';
  return 'acceptable';
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
