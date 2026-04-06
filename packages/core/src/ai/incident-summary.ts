/**
 * Incident Summary API - 安全事件摘要生成
 * 
 * 自动生成安全事件摘要报告
 * 支持多维度分析和趋势对比
 */

import type { JsonStore } from '../storage/json-store.js';
import type {
  SecurityEventSummary,
  SecurityEventSummaryRequest,
  ThreatIntelligence,
  VulnerabilityFixRecommendation,
  Insight,
} from './types.js';

const logger = {
  info: (...args: any[]) => console.log('[IncidentSummary]', ...args),
  error: (...args: any[]) => console.error('[IncidentSummary]', ...args),
  warn: (...args: any[]) => console.warn('[IncidentSummary]', ...args),
};

/**
 * Raw Incident Data - 原始事件数据输入
 */
export interface RawIncidentData {
  id: string;
  title?: string;
  description?: string;
  
  // 分类
  category?: string;
  type?: string;
  
  // 严重性
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
  
  // 状态
  status?: 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
  
  // 来源
  source?: string;
  sourceIp?: string;
  destinationIp?: string;
  
  // 时间
  createdAt?: number;
  detectedAt?: number;
  resolvedAt?: number;
  
  // 涉及实体
  affectedAssets?: string[];
  affectedUsers?: string[];
  
  // 攻击者信息
  attackerInfo?: {
    ip?: string;
    country?: string;
    asn?: string;
  };
  
  // 标签
  tags?: string[];
  
  // 相关漏洞
  relatedVulnerabilities?: string[];
  
  // 相关威胁
  relatedThreats?: string[];
  
  // 处置信息
  resolution?: string;
  responder?: string;
}

/**
 * Security Event Summary Engine - 安全事件摘要生成引擎
 */
export class IncidentSummaryEngine {
  constructor(private store: JsonStore) {}

  /**
   * 生成安全事件摘要
   * @param request 摘要请求
   */
  async generateSummary(request: SecurityEventSummaryRequest): Promise<SecurityEventSummary> {
    const { period, options } = request;
    logger.info(`Generating security event summary for period: ${new Date(period.start).toISOString()} - ${new Date(period.end).toISOString()}`);

    try {
      // 1. 获取期间内的事件数据
      const incidents = await this.getIncidentsInPeriod(period.start, period.end);
      
      // 2. 统计分析
      const totalEvents = incidents.length;
      const criticalEvents = incidents.filter(i => i.severity === 'critical' || i.severity === 'high');
      const resolvedEvents = incidents.filter(i => i.status === 'resolved' || i.status === 'closed');
      
      // 3. 计算平均解决时间
      const resolvedWithTime = incidents.filter(i => i.resolvedAt && i.createdAt);
      const meanResolutionTime = resolvedWithTime.length > 0
        ? resolvedWithTime.reduce((sum, i) => sum + ((i.resolvedAt! - (i.createdAt || i.detectedAt || 0)) / 1000 / 60), 0) / resolvedWithTime.length
        : undefined;

      // 4. 分类统计
      const byCategory = this.countByField(incidents, 'category');
      const bySeverity = this.countByField(incidents, 'severity');
      const byStatus = this.countByField(incidents, 'status');
      const bySource = this.countByField(incidents, 'source');

      // 5. 趋势对比
      let trendComparison: SecurityEventSummary['trendComparison'];
      if (options?.includeTrends) {
        trendComparison = await this.calculateTrendComparison(period, totalEvents);
      }

      // 6. 获取TOP项
      let topThreats: ThreatIntelligence[] = [];
      let topVulnerabilities: VulnerabilityFixRecommendation[] = [];
      let topInsights: Insight[] = [];

      if (options?.includeThreats) {
        topThreats = await this.getTopThreats(period);
      }

      if (options?.includeVulnerabilities) {
        topVulnerabilities = await this.getTopVulnerabilities(period);
      }

      if (options?.includeInsights) {
        topInsights = await this.getTopInsights(period);
      }

      // 7. 生成建议
      const recommendations = this.generateRecommendations(incidents, bySeverity, byCategory, byStatus);

      const summary: SecurityEventSummary = {
        id: `summary-${period.start}-${period.end}-${Date.now()}`,
        period: {
          start: period.start,
          end: period.end,
        },
        totalEvents,
        criticalEvents: criticalEvents.length,
        resolvedEvents: resolvedEvents.length,
        meanResolutionTime: meanResolutionTime ? Math.round(meanResolutionTime) : undefined,
        byCategory,
        bySeverity,
        byStatus,
        bySource,
        topThreats,
        topVulnerabilities,
        topInsights,
        trendComparison,
        recommendations,
        generatedAt: Date.now(),
      };

      // 保存摘要
      await this.saveSummary(summary);

      return summary;

    } catch (error) {
      logger.error('Failed to generate summary:', error);
      throw error;
    }
  }

  /**
   * 获取摘要列表
   */
  async listSummaries(filter?: {
    fromDate?: number;
    toDate?: number;
  }): Promise<SecurityEventSummary[]> {
    const all = await this.store.get<SecurityEventSummary[]>('incident-summaries.json');
    if (!all) return [];

    let results = [...all];

    if (filter?.fromDate) {
      results = results.filter(s => s.period.start >= filter.fromDate!);
    }

    if (filter?.toDate) {
      results = results.filter(s => s.period.end <= filter.toDate!);
    }

    return results.sort((a, b) => b.generatedAt - a.generatedAt);
  }

  /**
   * 获取单个摘要
   */
  async getSummary(id: string): Promise<SecurityEventSummary | null> {
    const summaries = await this.listSummaries();
    return summaries.find(s => s.id === id) || null;
  }

  /**
   * 获取最近的摘要
   */
  async getLatestSummary(): Promise<SecurityEventSummary | null> {
    const summaries = await this.listSummaries();
    return summaries[0] || null;
  }

  // ==================== Private Methods ====================

  private async getIncidentsInPeriod(start: number, end: number): Promise<RawIncidentData[]> {
    const all = await this.store.get<RawIncidentData[]>('incidents.json');
    if (!all) return [];

    return all.filter(i => {
      const time = i.createdAt || i.detectedAt || 0;
      return time >= start && time <= end;
    });
  }

  private countByField(incidents: RawIncidentData[], field: keyof RawIncidentData): Record<string, number> {
    const counts: Record<string, number> = {};

    incidents.forEach(incident => {
      const value = String(incident[field] || 'unknown');
      counts[value] = (counts[value] || 0) + 1;
    });

    return counts;
  }

  private async calculateTrendComparison(
    period: { start: number; end: number },
    currentCount: number
  ): Promise<SecurityEventSummary['trendComparison']> {
    // 计算上一周期
    const periodDuration = period.end - period.start;
    const previousStart = period.start - periodDuration;
    const previousEnd = period.start;

    // 获取上一周期事件
    const previousIncidents = await this.getIncidentsInPeriod(previousStart, previousEnd);
    const previousCount = previousIncidents.length;

    // 计算环比变化
    const vsPreviousPeriod = previousCount > 0
      ? Math.round(((currentCount - previousCount) / previousCount) * 100)
      : 0;

    // 计算同比（假设周期为一个月）
    const samePeriodLastYearStart = period.start - 365 * 24 * 60 * 60 * 1000;
    const samePeriodLastYearEnd = period.end - 365 * 24 * 60 * 60 * 1000;
    const samePeriodLastYearIncidents = await this.getIncidentsInPeriod(samePeriodLastYearStart, samePeriodLastYearEnd);
    const samePeriodLastYearCount = samePeriodLastYearIncidents.length;

    const vsSamePeriodLastYear = samePeriodLastYearCount > 0
      ? Math.round(((currentCount - samePeriodLastYearCount) / samePeriodLastYearCount) * 100)
      : undefined;

    return {
      vsPreviousPeriod,
      vsSamePeriodLastYear,
    };
  }

  private async getTopThreats(period: { start: number; end: number }): Promise<ThreatIntelligence[]> {
    const allThreats = await this.store.get<ThreatIntelligence[]>('threat-intelligence.json');
    if (!allThreats) return [];

    return allThreats
      .filter(t => t.generatedAt >= period.start && t.generatedAt <= period.end)
      .sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      })
      .slice(0, 5);
  }

  private async getTopVulnerabilities(period: { start: number; end: number }): Promise<VulnerabilityFixRecommendation[]> {
    const allVulns = await this.store.get<VulnerabilityFixRecommendation[]>('vulnerability-fixes.json');
    if (!allVulns) return [];

    return allVulns
      .filter(v => v.generatedAt >= period.start && v.generatedAt <= period.end)
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, 5);
  }

  private async getTopInsights(period: { start: number; end: number }): Promise<Insight[]> {
    const allInsights = await this.store.get<Insight[]>('insights.json');
    if (!allInsights) return [];

    return allInsights
      .filter(i => i.createdAt >= period.start && i.createdAt <= period.end)
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, 5);
  }

  private generateRecommendations(
    incidents: RawIncidentData[],
    bySeverity: Record<string, number>,
    byCategory: Record<string, number>,
    byStatus: Record<string, number>
  ): string[] {
    const recommendations: string[] = [];

    // 基于严重性分布的建议
    const criticalCount = bySeverity['critical'] || 0;
    const highCount = bySeverity['high'] || 0;

    if (criticalCount > 0) {
      recommendations.push(`关注${criticalCount}个严重事件，立即进行根因分析并完善防护措施`);
    }

    if (highCount > 5) {
      recommendations.push(`高危事件数量较多(${highCount}个)，建议加强安全监控和事件响应能力`);
    }

    // 基于分类的建议
    const topCategories = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    topCategories.forEach(([category, count]) => {
      if (count > 10) {
        switch (category.toLowerCase()) {
          case 'malware':
            recommendations.push(`恶意软件事件较多(${count}个)，建议加强终端防护和恶意软件检测`);
            break;
          case 'phishing':
            recommendations.push(`钓鱼事件较多(${count}个)，建议加强员工安全意识和邮件防护`);
            break;
          case 'unauthorized_access':
          case 'access':
            recommendations.push(`未授权访问事件较多(${count}个)，建议审查访问控制策略`);
            break;
          case 'ddos':
            recommendations.push(`DDoS攻击事件较多(${count}个)，建议检查DDoS防护能力`);
            break;
          case 'databreach':
          case 'data_leak':
            recommendations.push(`数据泄露事件较多(${count}个)，建议加强数据保护措施`);
            break;
          default:
            recommendations.push(`${category}类型事件较多(${count}个)，建议进行专项分析`);
        }
      }
    });

    // 基于状态的建议
    const openCount = (byStatus['open'] || 0) + (byStatus['investigating'] || 0);
    if (openCount > 10) {
      recommendations.push(`当前有${openCount}个未关闭事件，建议加快处置进度`);
    }

    // 通用建议
    if (recommendations.length === 0) {
      recommendations.push('安全态势整体平稳，继续保持现有安全防护措施');
      recommendations.push('建议定期进行安全评估和漏洞扫描');
    }

    // 去重
    return [...new Set(recommendations)];
  }

  /**
   * 生成每日摘要
   */
  async generateDailySummary(date?: Date): Promise<SecurityEventSummary> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    return this.generateSummary({
      period: {
        start: startOfDay.getTime(),
        end: endOfDay.getTime(),
      },
      options: {
        includeTrends: true,
        includeThreats: true,
        includeVulnerabilities: true,
        includeInsights: true,
      },
    });
  }

  /**
   * 生成每周摘要
   */
  async generateWeeklySummary(weekStartDate?: Date): Promise<SecurityEventSummary> {
    const startDate = weekStartDate || new Date();
    const start = new Date(startDate);
    start.setDate(start.getDate() - start.getDay()); // 周日
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6); // 周六
    end.setHours(23, 59, 59, 999);

    return this.generateSummary({
      period: {
        start: start.getTime(),
        end: end.getTime(),
      },
      options: {
        includeTrends: true,
        includeThreats: true,
        includeVulnerabilities: true,
        includeInsights: true,
      },
    });
  }

  /**
   * 生成每月摘要
   */
  async generateMonthlySummary(year?: number, month?: Date): Promise<SecurityEventSummary> {
    const targetDate = month || new Date();
    const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const end = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);

    return this.generateSummary({
      period: {
        start: start.getTime(),
        end: end.getTime(),
      },
      options: {
        includeTrends: true,
        includeThreats: true,
        includeVulnerabilities: true,
        includeInsights: true,
      },
    });
  }

  /**
   * 生成自定义周期摘要
   */
  async generateCustomSummary(
    startDate: Date,
    endDate: Date,
    options?: SecurityEventSummaryRequest['options']
  ): Promise<SecurityEventSummary> {
    return this.generateSummary({
      period: {
        start: startDate.getTime(),
        end: endDate.getTime(),
      },
      options,
    });
  }

  /**
   * 获取实时态势摘要
   */
  async getRealtimeSummary(): Promise<{
    todayEvents: number;
    openEvents: number;
    criticalEvents: number;
    resolutionRate: number;
    topCategories: Array<{ category: string; count: number }>;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const incidents = await this.getIncidentsInPeriod(today.getTime(), Date.now());
    const allIncidents = await this.store.get<RawIncidentData[]>('incidents.json') || [];

    const todayEvents = incidents.length;
    const openEvents = allIncidents.filter(i => !['resolved', 'closed'].includes(i.status || '')).length;
    const criticalEvents = allIncidents.filter(i => i.severity === 'critical').length;
    const resolvedCount = allIncidents.filter(i => ['resolved', 'closed'].includes(i.status || '')).length;
    const resolutionRate = allIncidents.length > 0
      ? Math.round((resolvedCount / allIncidents.length) * 100)
      : 0;

    const byCategory = this.countByField(incidents, 'category');
    const topCategories = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));

    return {
      todayEvents,
      openEvents,
      criticalEvents,
      resolutionRate,
      topCategories,
    };
  }

  private async saveSummary(summary: SecurityEventSummary): Promise<void> {
    const existing = await this.store.get<SecurityEventSummary[]>('incident-summaries.json') || [];
    const updated = [summary, ...existing].slice(0, 100);
    await this.store.set('incident-summaries.json', updated);
  }
}
