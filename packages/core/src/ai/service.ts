/**
 * AI Service - 智能分析服务
 * 
 * 提供智能洞察、异常检测、趋势预测、建议生成
 */

import type { JsonStore } from '../storage/json-store.js';
// Real engines (for facade delegation)
import { AnomalyDetectionEngine } from './anomaly-detection.js';
import { InsightEngine } from './insight-engine.js';
import type {
  Prediction as EnginePrediction,
  AnomalyDetectRequest as EngineAnomalyDetectRequest,
  InsightGenerateRequest as EngineInsightGenerateRequest,
  Insight,
  Anomaly,
  Prediction,
} from './types.js';

const logger = {
  info: (...args: any[]) => console.log('[AIService]', ...args),
  error: (...args: any[]) => console.error('[AIService]', ...args),
};

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
  // Engine instances (optional injection)
  private anomalyEngine?: AnomalyDetectionEngine;
  private insightEngine?: InsightEngine;
  private llmGateway?: { chat(messages: any[], options?: any): Promise<{ content: string }> };
  private mode: 'mock' | 'engine';

  constructor(private store: JsonStore,
              anomalyEngine?: AnomalyDetectionEngine,
              insightEngine?: InsightEngine) {
    // Determine mode from environment variable (default to 'engine')
    const modeEnv = (process.env as { AI_ENGINE_MODE?: string }).AI_ENGINE_MODE ?? 'engine';
    this.mode = (modeEnv === 'mock' ? 'mock' : 'engine');

    if (this.mode === 'engine') {
      // Use injected engines or create real ones
      this.anomalyEngine = anomalyEngine ?? new AnomalyDetectionEngine(store);
      this.insightEngine = insightEngine ?? new InsightEngine(store);
    }
  }

  // Optional gateway for hybrid LLM analysis (inject via setLLMGateway)
  setLLMGateway(gateway: { chat(messages: any[], options?: any): Promise<{ content: string }> }): void {
    this.llmGateway = gateway;
  }

  private async analyzeWithLLM(context: string, data: any): Promise<string> {
    if (!this.llmGateway) return '';
    const messages: any[] = [
      { role: 'system', content: 'You are a cybersecurity analyst. Analyze the following data.' },
      { role: 'user', content: `Context: ${context}\nData: ${JSON.stringify(data)}` },
    ];
    const resp = await this.llmGateway.chat(messages, { });
    return resp?.content ?? '';
  }

  async generateInsights(context: string, data?: any): Promise<Insight[]> {
    // If engine mode, delegate to InsightEngine; otherwise keep mock behavior
    if (this.mode === 'engine' && this.insightEngine) {
      const req: EngineInsightGenerateRequest = {
        context,
        data,
      } as any;
      const engineInsights = await this.insightEngine.generateInsights(req);
      // Map Engine Insight -> Service Insight
      return engineInsights.map(i => {
        // sanitize type to fit service Insight type union (exclude 'critical')
        const sanitizedType = (i.type === 'critical' ? 'warning' : (i.type as unknown as string)) as Insight['type'];
        return {
          id: i.id,
          type: sanitizedType,
          title: i.title,
          description: i.description,
          priority: i.priority,
          category: i.category,
          source: i.source,
          relatedEntities: i.relatedEntities?.map((re: any) => ({ type: re.type, id: re.id, name: re.name })),
          metrics: i.metrics?.map((m: any) => ({ name: m.name, value: m.value, trend: m.trend })),
          createdAt: i.createdAt ?? Date.now(),
        } as Insight;
      });
    }

    // Mock mode or fallback: keep existing behavior
    const insights: Insight[] = [];
    try {
      // 基于数据生成智能洞察（保留原有实现）
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
            confidence: 85,
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
            confidence: 95,
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
        confidence: 90,
        createdAt: Date.now()
      });
    } catch (error) {
      logger.error('Failed to generate insights:', error);
    }
    // Hybrid fallback: if no insights and an LLM gateway is available, attempt to enrich with LLM
    if (insights.length === 0 && this.llmGateway) {
      const llmAnalysis = await this.analyzeWithLLM(context, data);
      if (llmAnalysis) {
        const llmInsight: Insight = {
          id: `insight-llm-${Date.now()}`,
          type: 'info',
          title: 'LLM Analysis',
          description: llmAnalysis,
          priority: 'low',
          category: 'security',
          source: 'Hybrid-LLM',
          confidence: 70,
          createdAt: Date.now(),
        };
        return [llmInsight];
      }
    }
    return insights;
  }

  async detectAnomalies(context: string, data?: any): Promise<Anomaly[]> {
    // Engine mode: delegate to anomaly engine and map results
    if (this.mode === 'engine' && this.anomalyEngine) {
      const req: EngineAnomalyDetectRequest = {
        context,
        data,
      } as any;
      const engineAnoms = await this.anomalyEngine.detectAnomalies(req);
      // Map to service Anomaly interface (with safe casting for differing types)
      return engineAnoms.map(a => ({
        id: a.id,
        type: (a.type as string) as string,
        title: a.title,
        description: a.description,
        severity: ((a.severity === 'info') ? ('low' as any) : (a.severity as any)) as any,
        metric: a.metric,
        value: a.value,
        baseline: (a.baseline as any)?.value ?? 0,
        deviation: a.deviation,
        status: (a as any).status as any,
        detectedAt: a.detectedAt,
        acknowledgedBy: (a as any).acknowledgedBy,
        resolvedAt: (a as any).resolvedAt,
      } as Anomaly));
    }

    // Mock mode: keep existing hardcoded anomalies
    const anomalies: Anomaly[] = [];
    try {
      const incidents = await this.store.get<any[]>('incidents.json');
      if (incidents && incidents.length > 5) {
        const baseValue = incidents.length * 0.6;
        anomalies.push({
          id: `anomaly-${Date.now()}`,
          type: 'event_spike',
          title: '事件数量异常',
          description: '24小时内安全事件数量显著增加',
          severity: 'medium',
          status: 'active',
          metric: 'incident_count',
          value: incidents.length,
          baseline: {
            value: baseValue,
            deviation: 40,
            upperThreshold: baseValue * 1.5,
            lowerThreshold: baseValue * 0.5,
            sampleSize: incidents.length,
            calculatedAt: Date.now()
          },
          detectedAt: Date.now()
        });
      }

      anomalies.push({
        id: `anomaly-${Date.now()}-2`,
        type: 'login_failure',
        title: '登录失败率升高',
        description: '检测到异常登录尝试',
        severity: 'low',
        status: 'active',
        metric: 'login_failure_rate',
        value: 2.5,
        baseline: {
          value: 1.0,
          deviation: 150,
          upperThreshold: 2.0,
          lowerThreshold: 0,
          sampleSize: 100,
          calculatedAt: Date.now() - 3600000
        },
        detectedAt: Date.now() - 3600000
      });
    } catch (error) {
      logger.error('Failed to detect anomalies:', error);
    }
    return anomalies;
  }

  async predictTrend(metric: string, timeframe: string): Promise<Prediction> {
    // Engine mode: delegate to anomaly engine if API exists; otherwise fall back
    let mappedFromEngine: Prediction | null = null;
    if (this.mode === 'engine' && this.anomalyEngine && typeof (this.anomalyEngine as any).predictTrend === 'function') {
      const enginePred: EnginePrediction = await (this.anomalyEngine as any).predictTrend(metric, timeframe);
      mappedFromEngine = {
        id: (enginePred as any).id || `pred-${Date.now()}`,
        metric: enginePred.metric,
        timeframe: (enginePred as any).timeframe || (timeframe as any),
        currentValue: (enginePred as any).currentValue,
        currentTrend: (enginePred as any).currentTrend || 'stable',
        predictedValue: (enginePred as any).predictedValue,
        predictionRange: {
          min: (enginePred as any).predictedValue * 0.9,
          max: (enginePred as any).predictedValue * 1.1,
        },
        confidence: (enginePred as any).confidence || 70,
        confidenceInterval: {
          lower: (enginePred as any).confidence ? (enginePred as any).confidence - 10 : 60,
          upper: (enginePred as any).confidence ? (enginePred as any).confidence + 10 : 80,
        },
        trend: (enginePred as any).trend || 'stable',
        trendStrength: (enginePred as any).trendStrength || 50,
        factors: Array.isArray((enginePred as any).factors) 
          ? (enginePred as any).factors.map((f: any) => typeof f === 'string' 
            ? { name: f, impact: 'neutral', weight: 50, description: '' } 
            : f)
          : [],
      } as Prediction;
    }
    if (mappedFromEngine) return mappedFromEngine;

    // Mock/default behavior
    const currentValue = 50;
    const predictedValue = 52;
    const confidence = 70;
    const trend = predictedValue > currentValue ? 'up' : (predictedValue < currentValue ? 'down' : 'stable');
    return {
      id: `pred-${Date.now()}`,
      metric,
      timeframe: timeframe as any,
      currentValue,
      currentTrend: trend,
      predictedValue,
      predictionRange: {
        min: predictedValue * 0.9,
        max: predictedValue * 1.1,
      },
      confidence,
      confidenceInterval: {
        lower: confidence - 10,
        upper: confidence + 10,
      },
      trend,
      trendStrength: 50,
      factors: [
        { name: '历史趋势', impact: 'neutral', weight: 60, description: '基于历史数据计算' },
        { name: '季节性因素', impact: 'neutral', weight: 30, description: '常规季节性变化' }
      ],
    };
  }

  async generateRecommendations(context: string, data?: any): Promise<AIRecommendation[]> {
    // Log context to acknowledge usage and avoid unused param
    logger.info(`Generating recommendations for context: ${context}`);
    // Acknowledge data usage to satisfy TS unused param rule
    if (data) {
      logger.info('generateRecommendations received data payload');
    } else {
      logger.info('generateRecommendations called with no data payload');
    }
    // Keep existing data-driven recommendations (no engine needed)
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

    if (recommendations.length === 0 && this.llmGateway) {
      const llmAnalysis = await this.analyzeWithLLM(context, data);
      if (llmAnalysis) {
        const llmRec: AIRecommendation = {
          id: `rec-llm-${Date.now()}`,
          title: 'LLM Suggested Action',
          description: llmAnalysis,
          priority: 'low',
          category: 'security',
          impact: '低',
          effort: '中',
          relatedEntities: [],
        };
        return [llmRec];
      }
    }
    return recommendations;
  }

  async acknowledgeAnomaly(anomalyId: string, acknowledgedBy: string): Promise<void> {
    if (this.mode === 'engine' && this.anomalyEngine) {
      // Persist via engine's store
      await this.anomalyEngine.acknowledge({ anomalyId, acknowledgedBy, note: undefined } as any);
      return;
    }
    logger.info(`Anomaly ${anomalyId} acknowledged by ${acknowledgedBy}`);
  }

  async resolveAnomaly(anomalyId: string): Promise<void> {
    if (this.mode === 'engine' && this.anomalyEngine) {
      // Use a conservative default resolution
      await this.anomalyEngine.resolve({ anomalyId, resolvedBy: 'system', resolution: 'fixed' } as any);
      return;
    }
    logger.info(`Anomaly ${anomalyId} resolved`);
  }
}
