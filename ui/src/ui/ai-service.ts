/**
 * SecuClaw AI Service - AI能力基础设施
 * 
 * 提供智能洞察、异常检测、趋势预测、建议引擎和AI对话能力
 */

import { gatewayClient } from './gateway-client.js';

// ============ 类型定义 ============

/** AI服务响应类型 */
interface AIInsightsResponse {
  insights?: Array<{
    id: string;
    type: InsightType;
    title: string;
    description: string;
    priority: InsightPriority;
    category: string;
    source: string;
    relatedEntities?: Array<{ type: string; id: string; name: string }>;
    metrics?: Array<{ name: string; value: number; trend?: string }>;
    createdAt: string | Date;
    expiresAt?: string | Date;
  }>;
}

interface AIAnomaliesResponse {
  anomalies?: Array<{
    id: string;
    severity: AnomalySeverity;
    metric: string;
    currentValue: number;
    expectedValue: number;
    deviation: number;
    threshold: number;
    detectedAt: string | Date;
    status: AnomalyStatus;
    category: string;
    description: string;
    suggestedActions?: string[];
  }>;
}

interface AITrendResponse {
  trend?: {
    metric: string;
    currentValue: number;
    predictedValue: number;
    confidence: number;
    timeframe: string;
    trend: TrendDirection;
    factors?: string[];
    historicalData?: Array<{ date: string | Date; value: number }>;
  };
}

interface AIRecommendationsResponse {
  recommendations?: Array<{
    id: string;
    title: string;
    description: string;
    priority: InsightPriority;
    impact: string;
    effort: string;
    category: string;
    actions?: string[];
  }>;
}

interface AIChatResponse {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string | Date;
}

/** 智能洞察类型 */
export type InsightType = 'warning' | 'info' | 'recommendation';

/** 智能洞察优先级 */
export type InsightPriority = 'high' | 'medium' | 'low';

/** 智能洞察 */
export interface SmartInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  priority: InsightPriority;
  category: 'security' | 'compliance' | 'operations' | 'risk';
  source: string;
  relatedEntities?: {
    type: 'vulnerability' | 'incident' | 'risk' | 'asset' | 'threat';
    id: string;
    name: string;
  }[];
  metrics?: {
    name: string;
    value: number;
    trend?: 'up' | 'down' | 'stable';
  }[];
  createdAt: Date;
  expiresAt?: Date;
}

/** 异常严重程度 */
export type AnomalySeverity = 'critical' | 'high' | 'medium' | 'low';

/** 异常状态 */
export type AnomalyStatus = 'new' | 'acknowledged' | 'resolved';

/** 异常告警 */
export interface AnomalyAlert {
  id: string;
  severity: AnomalySeverity;
  metric: string;
  currentValue: number;
  expectedValue: number;
  deviation: number; // 偏差百分比
  threshold: number;
  detectedAt: Date;
  status: AnomalyStatus;
  category: 'security' | 'compliance' | 'performance' | 'availability';
  description: string;
  suggestedActions: string[];
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolution?: string;
}

/** 趋势方向 */
export type TrendDirection = 'increasing' | 'stable' | 'decreasing';

/** 趋势预测 */
export interface TrendPrediction {
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number; // 0-100
  timeframe: '7d' | '30d' | '90d';
  trend: TrendDirection;
  factors: string[]; // 影响因素
  historicalData?: {
    date: Date;
    value: number;
  }[];
  recommendation?: string;
  riskLevel?: 'high' | 'medium' | 'low';
}

/** 建议操作 */
export interface RecommendedAction {
  id: string;
  title: string;
  description: string;
  type: 'immediate' | 'short_term' | 'long_term';
  effort: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  assignee?: string;
  dueDate?: Date;
  status: 'pending' | 'in_progress' | 'completed';
}

/** AI建议 */
export interface AIRecommendation {
  id: string;
  category: 'security' | 'compliance' | 'operations' | 'risk';
  title: string;
  description: string;
  priority: number; // 1-100
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  rationale: string; // AI提供的理由
  actions: RecommendedAction[];
  relatedEntities: {
    type: 'vulnerability' | 'incident' | 'risk' | 'asset' | 'threat';
    id: string;
    name: string;
  }[];
  createdAt: Date;
  validUntil?: Date;
}

/** AI对话上下文 */
export interface ChatContext {
  pageId: string;
  pageTitle: string;
  userRole: string;
  currentData?: Record<string, unknown>;
  selectedEntities?: {
    type: string;
    id: string;
  }[];
  recentActions?: string[];
}

/** AI对话消息 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: RecommendedAction[];
  relatedEntities?: {
    type: string;
    id: string;
    name: string;
  }[];
}

/** AI对话会话 */
export interface ChatSession {
  id: string;
  context: ChatContext;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// ============ AI服务类 ============

/**
 * AI服务 - 提供所有AI能力
 */
class AIService {
  private static instance: AIService;
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60000; // 1分钟缓存

  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  // ============ 智能洞察 ============

  /**
   * 生成智能洞察
   */
  async generateInsights(context: {
    pageId: string;
    data: Record<string, unknown>;
    userRole: string;
  }): Promise<SmartInsight[]> {
    const cacheKey = `insights:${context.pageId}:${context.userRole}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached as SmartInsight[];

    try {
    const response = await gatewayClient.request<AIInsightsResponse>('ai.insights', {
      pageId: context.pageId,
      data: context.data,
      userRole: context.userRole,
    });

    const insights: SmartInsight[] = (response.insights || [])
      .filter((i: unknown) => i && typeof i === 'object')
      .map((i: any) => ({
        ...i,
        createdAt: new Date(i.createdAt),
        expiresAt: i.expiresAt ? new Date(i.expiresAt) : undefined,
      }));

    this.setCache(cacheKey, insights);
    return insights;
  } catch (error) {
    console.error('[AI Service] Failed to generate insights:', error);
    // 返回模拟数据
    return this.generateMockInsights(context.pageId);
  }
  }

  /**
   * 生成模拟洞察（降级处理）
   */
  private generateMockInsights(pageId: string): SmartInsight[] {
    const mockInsights: Record<string, SmartInsight[]> = {
    dashboard: [
      {
        id: 'mock-1',
        type: 'warning',
        title: '高危漏洞待处理',
        description: '检测到3个CVSS 9.0+漏洞超过SLA，建议24小时内处理',
        priority: 'high',
        category: 'security',
        source: '漏洞管理系统',
        createdAt: new Date(),
      },
      {
        id: 'mock-2',
        type: 'info',
        title: '合规率上升趋势',
        description: '本周合规率提升5%，主要改善在数据处理记录方面',
        priority: 'medium',
        category: 'compliance',
        source: '合规审计系统',
        createdAt: new Date(),
      },
    ],
    vulnerabilities: [
      {
        id: 'mock-3',
        type: 'recommendation',
        title: '优先修复CVE-2024-XXX',
        description: '该漏洞已有公开利用代码，影响核心生产系统',
        priority: 'high',
        category: 'security',
        source: 'AI分析引擎',
        relatedEntities: [{ type: 'vulnerability', id: 'CVE-2024-XXX', name: 'CVE-2024-XXX' }],
        createdAt: new Date(),
      },
    ],
  };

    return mockInsights[pageId] || [];
  }

  // ============ 异常检测 ============

  /**
   * 检测异常
   */
  async detectAnomalies(context: {
    pageId: string;
    metrics: { name: string; value: number; expected?: number }[];
  }): Promise<AnomalyAlert[]> {
    const cacheKey = `anomalies:${context.pageId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached as AnomalyAlert[];

    try {
    const response = await gatewayClient.request<AIAnomaliesResponse>('ai.anomalies', {
      pageId: context.pageId,
      metrics: context.metrics,
    });

    const anomalies: AnomalyAlert[] = (response.anomalies || []).map((a: any) => ({
      ...a,
      detectedAt: new Date(a.detectedAt),
      acknowledgedAt: a.acknowledgedAt ? new Date(a.acknowledgedAt) : undefined,
      resolvedAt: a.resolvedAt ? new Date(a.resolvedAt) : undefined,
    }));

    this.setCache(cacheKey, anomalies);
    return anomalies;
  } catch (error) {
    console.error('[AI Service] Failed to detect anomalies:', error);
    return this.detectMockAnomalies(context.metrics);
  }
  }

  /**
   * 本地异常检测（降级处理）
   */
  private detectMockAnomalies(
    metrics: { name: string; value: number; expected?: number }[]
  ): AnomalyAlert[] {
    const anomalies: AnomalyAlert[] = [];

    for (const metric of metrics) {
      const expected = metric.expected ?? this.getExpectedValue(metric.name);
      const deviation = Math.abs((metric.value - expected) / expected) * 100;

      if (deviation > 20) {
        anomalies.push({
          id: `anomaly-${metric.name}-${Date.now()}`,
          severity: deviation > 50 ? 'critical' : deviation > 30 ? 'high' : 'medium',
          metric: metric.name,
          currentValue: metric.value,
          expectedValue: expected,
          deviation,
          threshold: 20,
          detectedAt: new Date(),
          status: 'new',
          category: 'security',
          description: `${metric.name} 偏离预期值 ${deviation.toFixed(1)}%`,
          suggestedActions: ['检查数据来源', '确认是否正常', '调整阈值'],
        });
      }
    }

    return anomalies;
  }

  private getExpectedValue(metricName: string): number {
    const expectedValues: Record<string, number> = {
      'riskScore': 50,
      'complianceRate': 90,
      'closureRate': 85,
      'slaRate': 95,
    };
    return expectedValues[metricName] ?? 80;
  }

  // ============ 趋势预测 ============

  /**
   * 预测趋势
   */
  async predictTrend(context: {
    metric: string;
    historicalData: { date: Date; value: number }[];
    timeframe?: '7d' | '30d' | '90d';
  }): Promise<TrendPrediction> {
    const cacheKey = `trend:${context.metric}:${context.timeframe || '30d'}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached as TrendPrediction;

    try {
      const response = await gatewayClient.request<AITrendResponse>('ai.trend', {
        metric: context.metric,
        historicalData: context.historicalData,
        timeframe: context.timeframe || '30d',
      });

      const prediction: TrendPrediction = {
        metric: response.trend?.metric || context.metric,
        currentValue: response.trend?.currentValue || 0,
        predictedValue: response.trend?.predictedValue || 0,
        confidence: response.trend?.confidence || 0,
        timeframe: (response.trend?.timeframe as TrendPrediction['timeframe']) || '30d',
        trend: response.trend?.trend || 'stable',
        factors: response.trend?.factors || [],
        historicalData: context.historicalData,
      };

      this.setCache(cacheKey, prediction);
      return prediction;
    } catch (error) {
      console.error('[AI Service] Failed to predict trend:', error);
      return this.generateMockPrediction(context.metric, context.timeframe || '30d');
    }
  }

  /**
   * 生成模拟预测（降级处理）
   */
  private generateMockPrediction(metric: string, timeframe: string): TrendPrediction {
    const baseValue = 70;
    const change = Math.random() * 20 - 10; // -10 to +10

    return {
      metric,
      currentValue: baseValue,
      predictedValue: baseValue + change,
      confidence: 75,
      timeframe: timeframe as '7d' | '30d' | '90d',
      trend: change > 2 ? 'increasing' : change < -2 ? 'decreasing' : 'stable',
      factors: ['历史趋势', '季节性因素', '近期事件'],
      recommendation: change < -5 
        ? '建议关注该指标，可能需要干预' 
        : change > 5 
          ? '趋势良好，建议保持当前策略'
          : '指标稳定，继续保持监控',
    };
  }

  // ============ 建议引擎 ============

  /**
   * 生成建议
   */
  async generateRecommendations(context: {
    pageId: string;
    entityType?: string;
    entityId?: string;
    data: Record<string, unknown>;
    userRole: string;
  }): Promise<AIRecommendation[]> {
    const cacheKey = `recommendations:${context.pageId}:${context.entityType || 'all'}:${context.userRole}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached as AIRecommendation[];

    try {
      const response = await gatewayClient.request<AIRecommendationsResponse>('ai.recommendations', {
        pageId: context.pageId,
        entityType: context.entityType,
        entityId: context.entityId,
        data: context.data,
        userRole: context.userRole,
      });

      const recommendations: AIRecommendation[] = (response.recommendations || [])
        .filter((r: unknown) => r && typeof r === 'object')
        .map((r: any) => ({
          ...r,
          createdAt: new Date(r.createdAt),
          validUntil: r.validUntil ? new Date(r.validUntil) : undefined,
        }));

      this.setCache(cacheKey, recommendations);
      return recommendations;
    } catch (error) {
      console.error('[AI Service] Failed to generate recommendations:', error);
      return this.generateMockRecommendations(context.pageId, context.entityType);
    }
  }

  /**
   * 生成模拟建议（降级处理）
   */
  private generateMockRecommendations(pageId: string, entityType?: string): AIRecommendation[] {
    const mockRecommendations: Record<string, AIRecommendation[]> = {
    vulnerabilities: [
      {
        id: 'rec-1',
        category: 'security',
        title: '优先修复高危漏洞',
        description: '检测到多个高危漏洞已有公开利用代码，建议优先处理',
        priority: 95,
        impact: 'high',
        effort: 'medium',
        rationale: '基于CVSS评分、资产重要性和威胁情报分析',
        actions: [
          {
            id: 'action-1',
            title: '分配修复任务',
            description: '将漏洞分配给相应负责人',
            type: 'immediate',
            effort: 'low',
            impact: 'high',
            status: 'pending',
          },
        ],
        relatedEntities: [],
        createdAt: new Date(),
      },
    ],
    incidents: [
      {
        id: 'rec-2',
        category: 'operations',
        title: '加强事件关联分析',
        description: '检测到多个事件可能来自同一攻击组织',
        priority: 88,
        impact: 'high',
        effort: 'low',
        rationale: '基于事件IOC重叠和时间关联性分析',
        actions: [
          {
            id: 'action-2',
            title: '合并相关事件',
            description: '将关联事件合并处理',
            type: 'immediate',
            effort: 'low',
            impact: 'medium',
            status: 'pending',
          },
        ],
        relatedEntities: [],
        createdAt: new Date(),
      },
    ],
  };

    const key = entityType || pageId;
    return mockRecommendations[key] || [];
  }

  // ============ AI对话 ============

  /**
   * 发送对话消息
   */
  async chat(context: ChatContext, message: string): Promise<ChatMessage> {
    try {
      const response = await gatewayClient.request<AIChatResponse>('ai.chat', {
        context,
        message,
      });

      return {
        id: response.id || `msg-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        actions: [],
        relatedEntities: [],
      };
    } catch (error) {
      console.error('[AI Service] Chat failed:', error);
      // 降级处理
      return {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: this.generateMockChatResponse(message, context),
        timestamp: new Date(),
      };
    }
  }

  /**
   * 生成模拟对话响应（降级处理）
   */
  private generateMockChatResponse(message: string, context: ChatContext): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('漏洞') || lowerMessage.includes('vulnerability')) {
      return `根据当前数据，您有 ${context.currentData?.['vulnCount'] || '若干'} 个待处理漏洞。建议优先处理高危漏洞，特别是那些已有公开利用代码的CVE。`;
    }
    
    if (lowerMessage.includes('风险') || lowerMessage.includes('risk')) {
      return `当前整体风险评分为 ${context.currentData?.['riskScore'] || '72'}。建议关注高危风险项，制定缓解计划。`;
    }
    
    if (lowerMessage.includes('建议') || lowerMessage.includes('recommend')) {
      return `基于您当前的${context.pageTitle}页面数据，我建议：\n1. 优先处理高优先级项目\n2. 关注即将到期的SLA\n3. 定期审查关键指标`;
    }
    
    return `我理解您关于"${message}"的问题。作为AI助手，我可以帮助您分析${context.pageTitle}相关的数据，提供洞察和建议。请告诉我您具体想了解什么？`;
  }

  // ============ 辅助方法 ============

  /**
   * 设置缓存
   */
  private setCache(key: string, data: unknown): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * 从缓存获取
   */
  private getFromCache(key: string): unknown | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 确认异常
   */
  async acknowledgeAnomaly(anomalyId: string, acknowledgedBy: string): Promise<void> {
    // 调用后端API确认异常
    await gatewayClient.request('ai.anomaly.acknowledge', {
      anomalyId,
      acknowledgedBy,
    });
  }

  /**
   * 解决异常
   */
  async resolveAnomaly(
    anomalyId: string,
    resolvedBy: string,
    resolution: string
  ): Promise<void> {
    await gatewayClient.request('ai.anomaly.resolve', {
      anomalyId,
      resolvedBy,
      resolution,
    });
  }

  /**
   * 执行建议操作
   */
  async executeAction(actionId: string): Promise<void> {
    await gatewayClient.request('ai.action.execute', {
      actionId,
    });
  }
}

// 导出单例
export const aiService = AIService.getInstance();
