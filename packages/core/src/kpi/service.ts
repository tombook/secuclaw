/**
 * KPI Service - KPI指标服务
 * 
 * 提供统一的安全态势KPI计算
 */
import type { JsonStore } from '../storage/json-store.js';

export interface KpiMetrics {
  // Overall scores
  overallScore: number;
  riskScore: number;
  securityScore: number;
  
  // Incident metrics
  incidents: {
    total: number;
    open: number;
    critical: number;
    avgResponseTime: number;
    avgResolutionTime: number;
  };
  
  // Vulnerability metrics
  vulnerabilities: {
    total: number;
    open: number;
    critical: number;
    high: number;
    medium: number;
    avgCvss: number;
  };
  
  // Threat metrics
  threats: {
    total: number;
    apt: number;
    ransomware: number;
    highConfidence: number;
  };
  
  // Compliance metrics
  compliance: {
    overall: number;
    gdpr: number;
    soc2: number;
    iso27001: number;
    pipi: number;
  };
  
  // Asset metrics
  assets: {
    total: number;
    critical: number;
    atRisk: number;
  };
  
  // SLA metrics
  sla: {
    responseCompliance: number;
    resolutionCompliance: number;
  };
  
  // Trend data (last 7 days)
  trends: {
    incidents: number[];
    vulnerabilities: number[];
    threats: number[];
  };
  
  timestamp: number;
}

export class KpiService {
  constructor(private store: JsonStore) {}

  /**
   * 计算所有KPI指标
   */
  async calculateAllMetrics(): Promise<KpiMetrics> {
    const [
      incidents,
      vulnerabilities,
      threats,
      compliance,
      assets,
    ] = await Promise.all([
      this.store.get<any[]>('incidents.json'),
      this.store.get<any[]>('vulnerabilities.json'),
      this.store.get<any[]>('threats.json'),
      this.store.get<any[]>('compliance.json'),
      this.store.get<any[]>('assets.json'),
    ]);

    const now = Date.now();

    // Calculate incident metrics
    const incidentMetrics = this.calculateIncidentMetrics(incidents || []);
    
    // Calculate vulnerability metrics
    const vulnMetrics = this.calculateVulnerabilityMetrics(vulnerabilities || []);
    
    // Calculate threat metrics
    const threatMetrics = this.calculateThreatMetrics(threats || []);
    
    // Calculate compliance metrics
    const complianceMetrics = this.calculateComplianceMetrics(compliance || []);
    
    // Calculate asset metrics
    const assetMetrics = this.calculateAssetMetrics(assets || []);
    
    // Calculate SLA metrics
    const slaMetrics = this.calculateSlaMetrics(incidents || []);
    
    // Calculate risk score
    const riskScore = this.calculateRiskScore(incidentMetrics, vulnMetrics, threatMetrics, assetMetrics);
    
    // Calculate overall security score
    const securityScore = this.calculateSecurityScore(
      riskScore,
      complianceMetrics.overall,
      slaMetrics.responseCompliance,
      slaMetrics.resolutionCompliance
    );

    return {
      overallScore: securityScore,
      riskScore,
      securityScore,
      incidents: incidentMetrics,
      vulnerabilities: vulnMetrics,
      threats: threatMetrics,
      compliance: complianceMetrics,
      assets: assetMetrics,
      sla: slaMetrics,
      trends: {
        incidents: this.generateTrend(7, incidents || []),
        vulnerabilities: this.generateTrend(7, vulnerabilities || []),
        threats: this.generateTrend(7, threats || []),
      },
      timestamp: now,
    };
  }

  private calculateIncidentMetrics(incidents: any[]) {
    const total = incidents.length;
    const open = incidents.filter(i => !['resolved', 'closed'].includes(i.workflow?.status)).length;
    const critical = incidents.filter(i => i.info?.severity === 'critical').length;
    
    // Calculate average response time (in minutes)
    let totalResponseTime = 0;
    let responseCount = 0;
    incidents.forEach(i => {
      if (i.timeline?.reportedAt && i.timeline?.acknowledgedAt) {
        totalResponseTime += (i.timeline.acknowledgedAt - i.timeline.reportedAt) / 60000;
        responseCount++;
      }
    });
    const avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0;

    // Calculate average resolution time (in hours)
    let totalResolutionTime = 0;
    let resolutionCount = 0;
    incidents.forEach(i => {
      if (i.timeline?.reportedAt && i.timeline?.closedAt) {
        totalResolutionTime += (i.timeline.closedAt - i.timeline.reportedAt) / 3600000;
        resolutionCount++;
      }
    });
    const avgResolutionTime = resolutionCount > 0 ? Math.round(totalResolutionTime / resolutionCount) : 0;

    return {
      total,
      open,
      critical,
      avgResponseTime,
      avgResolutionTime,
    };
  }

  private calculateVulnerabilityMetrics(vulnerabilities: any[]) {
    const total = vulnerabilities.length;
    const open = vulnerabilities.filter(v => ['open', 'in_progress'].includes(v.remediation?.status)).length;
    const critical = vulnerabilities.filter(v => v.info?.cvss?.severity === 'critical').length;
    const high = vulnerabilities.filter(v => v.info?.cvss?.severity === 'high').length;
    const medium = vulnerabilities.filter(v => v.info?.cvss?.severity === 'medium').length;
    
    let totalCvss = 0;
    vulnerabilities.forEach(v => {
      if (v.info?.cvss?.score) {
        totalCvss += v.info.cvss.score;
      }
    });
    const avgCvss = total > 0 ? Math.round((totalCvss / total) * 10) / 10 : 0;

    return {
      total,
      open,
      critical,
      high,
      medium,
      avgCvss,
    };
  }

  private calculateThreatMetrics(threats: any[]) {
    const total = threats.length;
    const apt = threats.filter(t => t.type === 'apt').length;
    const ransomware = threats.filter(t => t.type === 'ransomware').length;
    const highConfidence = threats.filter(t => t.confidence >= 80).length;

    return {
      total,
      apt,
      ransomware,
      highConfidence,
    };
  }

  private calculateComplianceMetrics(items: any[]) {
    if (items.length === 0) {
      return { overall: 0, gdpr: 0, soc2: 0, iso27001: 0, pipi: 0 };
    }

    const byFramework: Record<string, { total: number; compliant: number }> = {};
    
    items.forEach(item => {
      const fw = item.framework;
      if (!byFramework[fw]) {
        byFramework[fw] = { total: 0, compliant: 0 };
      }
      byFramework[fw].total++;
      if (item.status === 'compliant') {
        byFramework[fw].compliant++;
      }
    });

    const frameworkScores: Record<string, number> = {};
    Object.keys(byFramework).forEach(fw => {
      const data = byFramework[fw];
      frameworkScores[fw] = data.total > 0 ? Math.round((data.compliant / data.total) * 100) : 0;
    });

    const allCompliant = items.filter(i => i.status === 'compliant').length;
    const overall = items.length > 0 ? Math.round((allCompliant / items.length) * 100) : 0;

    return {
      overall,
      gdpr: frameworkScores['GDPR'] || 0,
      soc2: frameworkScores['SOC 2'] || 0,
      iso27001: frameworkScores['ISO 27001'] || 0,
      pipi: frameworkScores['PIPL'] || 0,
    };
  }

  private calculateAssetMetrics(assets: any[]) {
    const total = assets.length;
    const critical = assets.filter(a => a.criticality === 'critical').length;
    const atRisk = assets.filter(a => a.vulnerabilities?.length > 0).length;

    return {
      total,
      critical,
      atRisk,
    };
  }

  private calculateSlaMetrics(incidents: any[]) {
    if (incidents.length === 0) {
      return { responseCompliance: 100, resolutionCompliance: 100 };
    }

    let responseBreached = 0;
    let resolutionBreached = 0;
    let responseTotal = 0;
    let resolutionTotal = 0;

    incidents.forEach(i => {
      if (i.sla?.responseBreached !== undefined) {
        responseTotal++;
        if (i.sla.responseBreached) responseBreached++;
      }
      if (i.sla?.resolutionBreached !== undefined) {
        resolutionTotal++;
        if (i.sla.resolutionBreached) resolutionBreached++;
      }
    });

    const responseCompliance = responseTotal > 0 
      ? Math.round(((responseTotal - responseBreached) / responseTotal) * 100) 
      : 100;
    const resolutionCompliance = resolutionTotal > 0 
      ? Math.round(((resolutionTotal - resolutionBreached) / resolutionTotal) * 100) 
      : 100;

    return {
      responseCompliance,
      resolutionCompliance,
    };
  }

  private calculateRiskScore(
    incidentMetrics: ReturnType<typeof this.calculateIncidentMetrics>,
    vulnMetrics: ReturnType<typeof this.calculateVulnerabilityMetrics>,
    threatMetrics: ReturnType<typeof this.calculateThreatMetrics>,
    assetMetrics: ReturnType<typeof this.calculateAssetMetrics>
  ): number {
    // Risk score formula (0-100, higher is worse)
    const incidentRisk = Math.min(incidentMetrics.critical * 10, 30);
    const vulnRisk = Math.min(vulnMetrics.critical * 5 + vulnMetrics.high * 2, 30);
    const threatRisk = Math.min(threatMetrics.highConfidence * 0.5 + threatMetrics.apt * 10 + threatMetrics.ransomware * 5, 25);
    const assetRisk = Math.min(assetMetrics.atRisk * 1.5, 15);

    return Math.min(incidentRisk + vulnRisk + threatRisk + assetRisk, 100);
  }

  private calculateSecurityScore(
    riskScore: number,
    complianceScore: number,
    responseSla: number,
    resolutionSla: number
  ): number {
    // Security score (0-100, higher is better)
    const complianceWeight = 0.3;
    const slaWeight = 0.3;
    const riskWeight = 0.4;

    const complianceComponent = complianceScore * complianceWeight;
    const slaComponent = ((responseSla + resolutionSla) / 2) * slaWeight;
    const riskComponent = (100 - riskScore) * riskWeight;

    return Math.round(complianceComponent + slaComponent + riskComponent);
  }

  private generateTrend(days: number, data: any[]): number[] {
    const now = Date.now();
    const dayMs = 86400000;
    const result: number[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = now - (i * dayMs);
      const dayEnd = dayStart + dayMs;
      
      // Count items created on this day
      const count = data.filter(item => {
        const createdAt = item.createdAt || item.timeline?.detectedAt || 0;
        return createdAt >= dayStart && createdAt < dayEnd;
      }).length;
      
      result.push(count);
    }

    return result;
  }

  /**
   * 获取KPI摘要（用于仪表盘）
   */
  async getKpiSummary(): Promise<{
    riskScore: number;
    complianceRate: number;
    openIncidents: number;
    criticalVulns: number;
  }> {
    const metrics = await this.calculateAllMetrics();
    
    return {
      riskScore: metrics.riskScore,
      complianceRate: metrics.compliance.overall,
      openIncidents: metrics.incidents.open,
      criticalVulns: metrics.vulnerabilities.critical,
    };
  }
}
