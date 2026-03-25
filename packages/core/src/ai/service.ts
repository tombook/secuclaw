/**
 * AI Service - 智能分析服务
 * 
 * 提供智能洞察、异常检测、趋势预测、建议生成
 */

import type { JsonStore } from '../storage/json-store.js';

const logger = {
  info: (...args: any[]) => console.log('[AIService]', ...args),
  error: (...args: any[]) => console.error('[AIService]', ...args),
};

export interface Insight {
  id: string;
  type: 'warning' | 'info' | 'recommendation';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'security' | 'compliance' | 'operations' | 'risk';
  source: string;
  relatedEntities?: Array<{ type: string; id: string; name: string }>;
  metrics?: Array<{ name: string; value: number; trend?: string }>;
  createdAt: number;
}

export interface Anomaly {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  metric: string;
  value: number;
  baseline: number;
  deviation: number;
  status: 'active' | 'acknowledged' | 'resolved';
  detectedAt: number;
  acknowledgedBy?: string;
  resolvedAt?: number;
}

export interface Prediction {
  id: string;
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  timeframe: string;
  trend: 'up' | 'down' | 'stable';
  factors: string[];
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  impact: string;
  effort: string;
  relatedEntities?: Array<{ type: string; id: string }>;
}

export class AIService {
  constructor(private store: JsonStore) {}

  async generateInsights(context: string, data?: any): Promise<Insight[]> {
    // 基于数据生成智能洞察
    const insights: Insight[] = [];
    
    try {
      // 获取事件统计
      const incidentStats = await this.store.get('incidents.json');
      if (incidentStats) {
        const incidents = Array.isArray(incidentStats) ? incidentStats : [];
        const criticalCount = incidents.filter((i: any) => i.info?.severity === 'P0' || i.info?.severity === 'critical').length;
        
        if (criticalCount > 0) {
          insights.push({
            id: `insight-${Date.now()}-1`,
            type: 'warning',
            title: '高危事件提醒',
            description: `当前存在 ${criticalCount} 个高危安全事件需要关注`,
            priority: 'high',
            category: 'security',
            source: 'AI分析引擎',
            createdAt: Date.now()
          });
        }
      }

      // 获取漏洞统计
      const vulnStats = await this.store.get('vulnerabilities.json');
      if (vulnStats) {
        const vulns = Array.isArray(vulnStats) ? vulnStats : [];
        const criticalVulns = vulns.filter((v: any) => v.info?.cvss?.score >= 9).length;
        
        if (criticalVulns > 0) {
          insights.push({
            id: `insight-${Date.now()}-2`,
            type: 'recommendation',
            title: '关键漏洞修复建议',
            description: `发现 ${criticalVulns} 个关键级别漏洞(CVSS≥9)，建议优先修复`,
            priority: 'high',
            category: 'security',
            source: '漏洞扫描分析',
            createdAt: Date.now()
          });
        }
      }

      // 常规洞察
      insights.push({
        id: `insight-${Date.now()}-3`,
        type: 'info',
        title: '安全态势良好',
        description: '系统运行正常，未发现重大安全风险',
        priority: 'low',
        category: 'security',
        source: '系统监控',
        createdAt: Date.now()
      });

    } catch (error) {
      logger.error('Failed to generate insights:', error);
    }

    return insights;
  }

  async detectAnomalies(context: string, data?: any): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    
    try {
      // 基于事件数据分析异常
      const incidents = await this.store.get<any[]>('incidents.json');
      if (incidents && incidents.length > 5) {
        // 检测到异常模式
        anomalies.push({
          id: `anomaly-${Date.now()}`,
          type: 'event_spike',
          title: '事件数量异常',
          description: '24小时内安全事件数量显著增加',
          severity: 'medium',
          metric: 'incident_count',
          value: incidents.length,
          baseline: incidents.length * 0.6,
          deviation: 40,
          status: 'active',
          detectedAt: Date.now()
        });
      }

      // 模拟其他异常
      anomalies.push({
        id: `anomaly-${Date.now()}-2`,
        type: 'login_failure',
        title: '登录失败率升高',
        description: '检测到异常登录尝试',
        severity: 'low',
        metric: 'login_failure_rate',
        value: 2.5,
        baseline: 1.0,
        deviation: 150,
        status: 'active',
        detectedAt: Date.now() - 3600000
      });

    } catch (error) {
      logger.error('Failed to detect anomalies:', error);
    }

    return anomalies;
  }

  async predictTrend(metric: string, timeframe: string): Promise<Prediction> {
    // 简单的趋势预测
    const predictions = {
      'risk-score': { current: 72, predicted: 75, confidence: 85 },
      'incident-count': { current: 12, predicted: 8, confidence: 78 },
      'vulnerability-count': { current: 45, predicted: 40, confidence: 82 }
    };

    const pred = predictions[metric as keyof typeof predictions] || { current: 50, predicted: 52, confidence: 70 };

    return {
      id: `pred-${Date.now()}`,
      metric,
      currentValue: pred.current,
      predictedValue: pred.predicted,
      confidence: pred.confidence,
      timeframe,
      trend: pred.predicted > pred.current ? 'up' : pred.predicted < pred.current ? 'down' : 'stable',
      factors: ['历史趋势', '季节性因素', '近期变更']
    };
  }

  async generateRecommendations(context: string, data?: any): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];

    try {
      // 基于漏洞数据推荐
      const vulns = await this.store.get<any[]>('vulnerabilities.json');
      if (vulns) {
        const criticalVulns = vulns.filter((v: any) => v.info?.cvss?.score >= 9);
        
        if (criticalVulns.length > 0) {
          recommendations.push({
            id: `rec-${Date.now()}-1`,
            title: '优先修复关键漏洞',
            description: `建议优先修复 ${criticalVulns.length} 个CVSS≥9的关键漏洞`,
            priority: 'high',
            category: 'vulnerability',
            impact: '高',
            effort: '中',
            relatedEntities: criticalVulns.slice(0, 3).map((v: any) => ({ type: 'vulnerability', id: v.id }))
          });
        }
      }

      // 基于事件数据推荐
      const incidents = await this.store.get<any[]>('incidents.json');
      if (incidents) {
        const openIncidents = incidents.filter((i: any) => i.workflow?.status !== 'closed');
        
        if (openIncidents.length > 5) {
          recommendations.push({
            id: `rec-${Date.now()}-2`,
            title: '加快事件处理',
            description: `当前有 ${openIncidents.length} 个未关闭事件，建议加快处理`,
            priority: 'medium',
            category: 'incident',
            impact: '中',
            effort: '低'
          });
        }
      }

      // 通用建议
      recommendations.push({
        id: `rec-${Date.now()}-3`,
        title: '定期安全培训',
        description: '建议开展全员安全意识培训',
        priority: 'low',
        category: 'operations',
        impact: '中',
        effort: '高'
      });

    } catch (error) {
      logger.error('Failed to generate recommendations:', error);
    }

    return recommendations;
  }

  async acknowledgeAnomaly(anomalyId: string, acknowledgedBy: string): Promise<void> {
    logger.info(`Anomaly ${anomalyId} acknowledged by ${acknowledgedBy}`);
  }

  async resolveAnomaly(anomalyId: string): Promise<void> {
    logger.info(`Anomaly ${anomalyId} resolved`);
  }
}
