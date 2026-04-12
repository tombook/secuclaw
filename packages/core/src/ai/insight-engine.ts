/**
 * Insight Engine API - 洞察引擎
 * 
 * 基于安全数据自动生成智能洞察
 * 支持事件、漏洞、威胁、合规等多维度分析
 */

import type { JsonStore } from '../storage/json-store.js';
import type {
  Insight,
  InsightFilter,
  InsightGenerateRequest,
} from './types.js';

const logger = {
  info: (...args: any[]) => console.log('[InsightEngine]', ...args),
  error: (...args: any[]) => console.error('[InsightEngine]', ...args),
  warn: (...args: any[]) => console.warn('[InsightEngine]', ...args),
};

/**
 * Insight Engine - 智能洞察生成引擎
 */
export class InsightEngine {
  constructor(private store: JsonStore) {}

  /**
   * 生成洞察
   * @param request 洞察生成请求
   */
  async generateInsights(request: InsightGenerateRequest): Promise<Insight[]> {
    const { context, data, options } = request;
    const insights: Insight[] = [];
    const maxInsights = options?.maxInsights || 10;
    const minConfidence = options?.minConfidence || 0;

    logger.info(`Generating insights for context: ${context}`);

    try {
      // 1. 基于事件数据分析
      if (data?.incidents || !data) {
        const incidentInsights = await this.analyzeIncidents(context);
        insights.push(...incidentInsights);
      }

      // 2. 基于漏洞数据分析
      if (data?.vulnerabilities || !data) {
        const vulnInsights = await this.analyzeVulnerabilities(context);
        insights.push(...vulnInsights);
      }

      // 3. 基于威胁数据分析
      if (data?.threats || !data) {
        const threatInsights = await this.analyzeThreats(context);
        insights.push(...threatInsights);
      }

      // 4. 基于合规数据分析
      if (data?.compliance || !data) {
        const complianceInsights = await this.analyzeCompliance(context);
        insights.push(...complianceInsights);
      }

      // 5. 基于资产数据分析
      if (data?.assets || !data) {
        const assetInsights = await this.analyzeAssets(context);
        insights.push(...assetInsights);
      }

      // 6. 基于指标数据分析
      if (data?.metrics) {
        const metricInsights = this.analyzeMetrics(data.metrics, context);
        insights.push(...metricInsights);
      }

      // 过滤和排序
      let filteredInsights = insights
        .filter(i => i.confidence >= minConfidence)
        .filter(i => {
          if (!options?.categories) return true;
          return options.categories.includes(i.category);
        })
        .sort((a, b) => {
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return b.confidence - a.confidence;
        });

      return filteredInsights.slice(0, maxInsights);

    } catch (error) {
      logger.error('Failed to generate insights:', error);
      throw error;
    }
  }

  /**
   * 获取洞察列表
   */
  async listInsights(filter?: InsightFilter): Promise<Insight[]> {
    const allInsights = await this.store.get<Insight[]>('insights.json');
    if (!allInsights) return [];

    let filtered = [...allInsights];

    if (filter) {
      if (filter.types?.length) {
        filtered = filtered.filter(i => filter.types!.includes(i.type));
      }
      if (filter.priorities?.length) {
        filtered = filtered.filter(i => filter.priorities!.includes(i.priority));
      }
      if (filter.categories?.length) {
        filtered = filtered.filter(i => filter.categories!.includes(i.category));
      }
      if (filter.sources?.length) {
        filtered = filtered.filter(i => filter.sources!.includes(i.source));
      }
      if (filter.fromDate) {
        filtered = filtered.filter(i => i.createdAt >= filter.fromDate!);
      }
      if (filter.toDate) {
        filtered = filtered.filter(i => i.createdAt <= filter.toDate!);
      }
      if (filter.acknowledged !== undefined) {
        filtered = filtered.filter(i => i.acknowledged === filter.acknowledged);
      }
    }

    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * 获取单个洞察
   */
  async getInsight(id: string): Promise<Insight | null> {
    const insights = await this.listInsights();
    return insights.find(i => i.id === id) || null;
  }

  /**
   * 确认洞察
   */
  async acknowledgeInsight(id: string, acknowledgedBy: string): Promise<Insight> {
    const insights = await this.store.get<Insight[]>('insights.json') || [];
    const index = insights.findIndex(i => i.id === id);
    
    if (index === -1) {
      throw new Error(`Insight not found: ${id}`);
    }

    insights[index] = {
      ...insights[index],
      acknowledged: true,
      acknowledgedBy,
      acknowledgedAt: Date.now(),
    };

    await this.store.set('insights.json', insights);
    return insights[index];
  }

  /**
   * 保存洞察到存储
   */
  async saveInsights(insights: Insight[]): Promise<void> {
    const existing = await this.store.get<Insight[]>('insights.json') || [];
    const updated = [...insights, ...existing].slice(0, 1000); // 保留最近1000条
    await this.store.set('insights.json', updated);
  }

  // ==================== Private Analysis Methods ====================

  private async analyzeIncidents(_context: string): Promise<Insight[]> {
    const insights: Insight[] = [];
    const incidents = await this.store.get<any[]>('incidents.json') || [];

    if (incidents.length === 0) return insights;

    // 分析事件数量趋势
    const recentIncidents = incidents.filter((i: any) => 
      Date.now() - (i.createdAt || 0) < 7 * 24 * 60 * 60 * 1000
    );
    
    if (recentIncidents.length > 5) {
      insights.push({
        id: `insight-incident-spike-${Date.now()}`,
        type: 'warning',
        title: '安全事件数量异常增加',
        description: `过去7天内共发生 ${recentIncidents.length} 起安全事件，较上周增长 ${Math.round((recentIncidents.length / Math.max(incidents.length - recentIncidents.length, 1)) * 100)}%。建议立即排查。`,
        priority: 'high',
        category: 'security',
        source: '洞察引擎',
        confidence: 85,
        relatedEntities: recentIncidents.slice(0, 3).map((i: any) => ({
          type: 'incident',
          id: i.id,
          name: i.title || i.info?.title || '未命名事件',
        })),
        metrics: [{
          name: '7天内事件数',
          value: recentIncidents.length,
          trend: 'up',
        }],
        createdAt: Date.now(),
      });
    }

    // 分析严重事件
    const criticalIncidents = incidents.filter((i: any) => 
      i.info?.severity === 'P0' || i.info?.severity === 'critical'
    );

    if (criticalIncidents.length > 0) {
      insights.push({
        id: `insight-critical-events-${Date.now()}`,
        type: 'critical',
        title: '存在未处理的高危安全事件',
        description: `当前有 ${criticalIncidents.length} 个P0/关键级别安全事件需要紧急处理。这些事件可能导致业务中断或数据泄露。`,
        priority: 'critical',
        category: 'security',
        source: '洞察引擎',
        confidence: 95,
        relatedEntities: criticalIncidents.slice(0, 5).map((i: any) => ({
          type: 'incident',
          id: i.id,
          name: i.title || i.info?.title || '未命名事件',
        })),
        recommendations: [
          '立即启动应急响应流程',
          '评估事件影响范围',
          '通知相关干系人',
        ],
        createdAt: Date.now(),
      });
    }

    // 正常运行洞察
    if (insights.length === 0 && incidents.length > 0) {
      insights.push({
        id: `insight-normal-${Date.now()}`,
        type: 'info',
        title: '安全态势总体平稳',
        description: '当前未发现重大安全风险，安全事件均在可控范围内。请继续保持安全防护措施。',
        priority: 'low',
        category: 'security',
        source: '洞察引擎',
        confidence: 80,
        metrics: [{
          name: '总事件数',
          value: incidents.length,
        }],
        createdAt: Date.now(),
      });
    }

    return insights;
  }

  private async analyzeVulnerabilities(_context: string): Promise<Insight[]> {
    const insights: Insight[] = [];
    const vulns = await this.store.get<any[]>('vulnerabilities.json') || [];

    if (vulns.length === 0) return insights;

    // 关键漏洞分析
    const criticalVulns = vulns.filter((v: any) => 
      v.info?.cvss?.score >= 9 || v.severity === 'critical'
    );

    if (criticalVulns.length > 0) {
      insights.push({
        id: `insight-critical-vulns-${Date.now()}`,
        type: 'critical',
        title: '发现关键级别漏洞',
        description: `系统中存在 ${criticalVulns.length} 个CVSS≥9的关键漏洞，这些漏洞可能被攻击者利用导致系统完全沦陷。建议立即修复。`,
        priority: 'critical',
        category: 'vulnerability',
        source: '漏洞扫描分析',
        confidence: 95,
        relatedEntities: criticalVulns.slice(0, 5).map((v: any) => ({
          type: 'vulnerability',
          id: v.id,
          name: v.cveId || v.info?.cveId || v.title || '未命名漏洞',
          metadata: { cvss: v.info?.cvss?.score },
        })),
        recommendations: [
          '优先修复CVSS≥9.0的漏洞',
          '评估漏洞可利用性',
          '实施临时缓解措施',
        ],
        metrics: [{
          name: '关键漏洞数',
          value: criticalVulns.length,
          trend: criticalVulns.length > 3 ? 'up' : 'stable',
        }],
        createdAt: Date.now(),
      });
    }

    // 高危漏洞分析
    const highVulns = vulns.filter((v: any) => 
      (v.info?.cvss?.score >= 7 && v.info?.cvss?.score < 9) || v.severity === 'high'
    );

    if (highVulns.length > 10) {
      insights.push({
        id: `insight-high-vulns-${Date.now()}`,
        type: 'warning',
        title: '高危漏洞数量较多',
        description: `存在 ${highVulns.length} 个高危漏洞，建议制定修复计划。这些漏洞可能影响系统机密性、完整性或可用性。`,
        priority: 'high',
        category: 'vulnerability',
        source: '漏洞扫描分析',
        confidence: 90,
        recommendations: [
          '制定漏洞修复计划',
          '评估业务影响',
          '优先修复面向互联网的系统',
        ],
        metrics: [{
          name: '高危漏洞数',
          value: highVulns.length,
        }],
        createdAt: Date.now(),
      });
    }

    return insights;
  }

  private async analyzeThreats(_context: string): Promise<Insight[]> {
    const insights: Insight[] = [];
    const threats = await this.store.get<any[]>('threats.json') || [];

    if (threats.length === 0) return insights;

    // 分析活跃威胁
    const activeThreats = threats.filter((t: any) => 
      t.info?.isActive || t.status === 'active'
    );

    if (activeThreats.length > 0) {
      insights.push({
        id: `insight-active-threats-${Date.now()}`,
        type: 'warning',
        title: '存在活跃威胁',
        description: `当前有 ${activeThreats.length} 个活跃威胁需要关注。这些威胁可能针对组织资产实施攻击。`,
        priority: 'high',
        category: 'threat',
        source: '威胁情报分析',
        confidence: 85,
        relatedEntities: activeThreats.slice(0, 3).map((t: any) => ({
          type: 'threat',
          id: t.id,
          name: t.name || t.info?.name || '未命名威胁',
        })),
        recommendations: [
          '加强威胁监控',
          '检查相关防御措施',
          '更新检测规则',
        ],
        createdAt: Date.now(),
      });
    }

    return insights;
  }

  private async analyzeCompliance(_context: string): Promise<Insight[]> {
    const insights: Insight[] = [];
    const compliance = await this.store.get<any[]>('compliance.json') || [];

    if (compliance.length === 0) return insights;

    // 分析不合规项
    const nonCompliant = compliance.filter((c: any) => 
      c.status === 'non_compliant' || c.info?.status === 'fail'
    );

    if (nonCompliant.length > 0) {
      insights.push({
        id: `insight-compliance-${Date.now()}`,
        type: 'recommendation',
        title: '合规性问题需要关注',
        description: `存在 ${nonCompliant.length} 个不合规项，可能导致监管处罚或业务风险。建议尽快整改。`,
        priority: 'medium',
        category: 'compliance',
        source: '合规检查',
        confidence: 90,
        relatedEntities: nonCompliant.slice(0, 3).map((c: any) => ({
          type: 'compliance',
          id: c.id,
          name: c.name || c.info?.name || '未命名合规项',
        })),
        recommendations: [
          '分析不合规原因',
          '制定整改计划',
          '跟踪整改进度',
        ],
        createdAt: Date.now(),
      });
    }

    return insights;
  }

  private async analyzeAssets(_context: string): Promise<Insight[]> {
    const insights: Insight[] = [];
    const assets = await this.store.get<any[]>('assets.json') || [];

    if (assets.length === 0) return insights;

    // 分析未保护资产
    const unprotectedAssets = assets.filter((a: any) => 
      !a.protected || !a.info?.protected
    );

    if (unprotectedAssets.length > 0 && unprotectedAssets.length > assets.length * 0.3) {
      insights.push({
        id: `insight-unprotected-assets-${Date.now()}`,
        type: 'warning',
        title: '存在未受保护的资产',
        description: `${unprotectedAssets.length} 个资产（占总资产 ${Math.round(unprotectedAssets.length / assets.length * 100)}%）未受保护，存在安全风险。`,
        priority: 'medium',
        category: 'security',
        source: '资产分析',
        confidence: 80,
        relatedEntities: unprotectedAssets.slice(0, 3).map((a: any) => ({
          type: 'asset',
          id: a.id,
          name: a.name || a.info?.name || '未命名资产',
        })),
        recommendations: [
          '为关键资产配置保护措施',
          '实施访问控制',
          '启用监控和审计',
        ],
        createdAt: Date.now(),
      });
    }

    return insights;
  }

  private analyzeMetrics(metrics: Record<string, number>, _context: string): Insight[] {
    const insights: Insight[] = [];

    // 风险评分分析
    if (metrics['risk-score'] !== undefined) {
      const riskScore = metrics['risk-score'];
      
      if (riskScore >= 80) {
        insights.push({
          id: `insight-risk-critical-${Date.now()}`,
          type: 'critical',
          title: '风险评分处于高位',
          description: `当前风险评分为 ${riskScore}，处于高危水平。建议立即采取风险缓解措施。`,
          priority: 'critical',
          category: 'risk',
          source: '风险评估',
          confidence: 90,
          metrics: [{
            name: '风险评分',
            value: riskScore,
            unit: '分',
            trend: riskScore > 90 ? 'up' : 'stable',
          }],
          createdAt: Date.now(),
        });
      } else if (riskScore >= 60) {
        insights.push({
          id: `insight-risk-high-${Date.now()}`,
          type: 'warning',
          title: '风险评分偏高',
          description: `当前风险评分为 ${riskScore}，需要关注。建议评估主要风险因素。`,
          priority: 'high',
          category: 'risk',
          source: '风险评估',
          confidence: 85,
          metrics: [{
            name: '风险评分',
            value: riskScore,
            unit: '分',
          }],
          createdAt: Date.now(),
        });
      }
    }

    return insights;
  }
}
