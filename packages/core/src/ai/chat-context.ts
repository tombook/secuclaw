import type { JsonStore } from '../storage/json-store.js';

export interface ChatContextData {
  pageId: string;
  pageTitle: string;
  currentData?: unknown;
}

export interface DashboardContext {
  vulnCounts: { critical: number; high: number; medium: number; low: number };
  openIncidents: number;
  riskScore: number;
  complianceScore: number;
}

export interface VulnerabilitiesContext {
  topVulnerabilities: Array<{
    id: string;
    cveId?: string;
    title: string;
    severity: string;
    cvss?: number;
    status: string;
  }>;
  slaBreaches: number;
  totalCount: number;
}

export interface IncidentsContext {
  openBySeverity: Record<string, number>;
  avgResponseTime?: number;
  totalOpen: number;
}

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

export class ChatContextAggregator {
  private store: JsonStore;
  private cache: Map<string, CacheEntry> = new Map();
  private cacheTtl: number;
  private logger = {
    debug: (...args: any[]) => console.debug('[ChatContextAggregator]', ...args),
    warn: (...args: any[]) => console.warn('[ChatContextAggregator]', ...args),
  };

  constructor(store: JsonStore, cacheTtlSeconds: number = 60) {
    this.store = store;
    this.cacheTtl = cacheTtlSeconds * 1000;
  }

  private getCached<T>(key: string, forceRefresh: boolean = false): T | null {
    if (forceRefresh) return null;
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.cacheTtl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  private setCache(key: string, data: unknown): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async getContext(pageId: string, pageTitle: string, forceRefresh: boolean = false): Promise<ChatContextData> {
    const baseContext: ChatContextData = { pageId, pageTitle };

    try {
      switch (pageId) {
        case 'dashboard':
          baseContext.currentData = await this.getDashboardContext(forceRefresh);
          break;
        case 'vulnerabilities':
          baseContext.currentData = await this.getVulnerabilitiesContext(forceRefresh);
          break;
        case 'incidents':
          baseContext.currentData = await this.getIncidentsContext(forceRefresh);
          break;
        case 'threats':
          baseContext.currentData = await this.getThreatsContext(forceRefresh);
          break;
        case 'compliance':
          baseContext.currentData = await this.getComplianceContext(forceRefresh);
          break;
        default:
          this.logger.debug(`No specific context for page: ${pageId}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to fetch context for ${pageId}:`, error);
    }

    return baseContext;
  }

  private async getDashboardContext(forceRefresh: boolean): Promise<DashboardContext> {
    const cacheKey = 'context:dashboard';
    const cached = this.getCached<DashboardContext>(cacheKey, forceRefresh);
    if (cached) return cached;

    const vulns = await this.store.get<any[]>('vulnerabilities.json') || [];
    const incidents = await this.store.get<any[]>('incidents.json') || [];

    const vulnCounts = {
      critical: vulns.filter((v: any) => v.info?.cvss?.score >= 9 || v.severity === 'critical').length,
      high: vulns.filter((v: any) => v.info?.cvss?.score >= 7 || v.severity === 'high').length,
      medium: vulns.filter((v: any) => v.info?.cvss?.score >= 4 || v.severity === 'medium').length,
      low: vulns.filter((v: any) => v.info?.cvss?.score < 4 || v.severity === 'low').length,
    };

    const openIncidents = incidents.filter((i: any) => i.workflow?.status !== 'closed').length;

    const riskScore = 72;
    const complianceScore = 85;

    const context: DashboardContext = { vulnCounts, openIncidents, riskScore, complianceScore };
    this.setCache(cacheKey, context);
    return context;
  }

  private async getVulnerabilitiesContext(forceRefresh: boolean): Promise<VulnerabilitiesContext> {
    const cacheKey = 'context:vulnerabilities';
    const cached = this.getCached<VulnerabilitiesContext>(cacheKey, forceRefresh);
    if (cached) return cached;

    const vulns = await this.store.get<any[]>('vulnerabilities.json') || [];

    const topVulns = vulns
      .filter((v: any) => (v.info?.cvss?.score >= 7 || v.severity === 'high' || v.severity === 'critical'))
      .sort((a: any, b: any) => (b.info?.cvss?.score || 0) - (a.info?.cvss?.score || 0))
      .slice(0, 5)
      .map((v: any) => ({
        id: v.id,
        cveId: v.cveId,
        title: v.title || v.name,
        severity: v.severity || (v.info?.cvss?.score >= 9 ? 'critical' : v.info?.cvss?.score >= 7 ? 'high' : 'medium'),
        cvss: v.info?.cvss?.score,
        status: v.status || 'open',
      }));

    const slaBreaches = vulns.filter((v: any) => v.slaBreach || (v.info?.cvss?.score >= 9 && v.status !== 'resolved')).length;

    const context: VulnerabilitiesContext = {
      topVulnerabilities: topVulns,
      slaBreaches,
      totalCount: vulns.length,
    };
    this.setCache(cacheKey, context);
    return context;
  }

  private async getIncidentsContext(forceRefresh: boolean): Promise<IncidentsContext> {
    const cacheKey = 'context:incidents';
    const cached = this.getCached<IncidentsContext>(cacheKey, forceRefresh);
    if (cached) return cached;

    const incidents = await this.store.get<any[]>('incidents.json') || [];
    const openIncidents = incidents.filter((i: any) => i.workflow?.status !== 'closed');

    const openBySeverity: Record<string, number> = {};
    for (const incident of openIncidents) {
      const severity = incident.info?.severity || 'P2';
      openBySeverity[severity] = (openBySeverity[severity] || 0) + 1;
    }

    const resolvedIncidents = incidents.filter((i: any) => i.workflow?.status === 'closed' && i.timeline?.resolvedAt);
    let avgResponseTime: number | undefined;
    if (resolvedIncidents.length > 0) {
      const totalTime = resolvedIncidents.reduce((sum: number, i: any) => {
        const created = i.timeline?.createdAt || i.createdAt;
        const resolved = i.timeline?.resolvedAt;
        return sum + (resolved - created);
      }, 0);
      avgResponseTime = Math.round(totalTime / resolvedIncidents.length / 3600000);
    }

    const context: IncidentsContext = { openBySeverity, avgResponseTime, totalOpen: openIncidents.length };
    this.setCache(cacheKey, context);
    return context;
  }

  private async getThreatsContext(forceRefresh: boolean): Promise<{ recentIoCs: number; activeThreats: number }> {
    const cacheKey = 'context:threats';
    const cached = this.getCached<{ recentIoCs: number; activeThreats: number }>(cacheKey, forceRefresh);
    if (cached) return cached;

    const threats = await this.store.get<any[]>('threats.json') || [];
    const recentIoCs = threats.reduce((count: number, t: any) => count + (t.indicators?.length || 0), 0);
    const activeThreats = threats.filter((t: any) => t.status === 'active').length;

    const context = { recentIoCs, activeThreats };
    this.setCache(cacheKey, context);
    return context;
  }

  private async getComplianceContext(forceRefresh: boolean): Promise<{ overallScore: number; nonCompliantItems: number }> {
    const cacheKey = 'context:compliance';
    const cached = this.getCached<{ overallScore: number; nonCompliantItems: number }>(cacheKey, forceRefresh);
    if (cached) return cached;

    const compliance = await this.store.get<any[]>('compliance.json') || [];
    const nonCompliantItems = compliance.filter((c: any) => c.status === 'non-compliant' || c.status === 'partial').length;

    const context = { overallScore: 85, nonCompliantItems };
    this.setCache(cacheKey, context);
    return context;
  }

  formatContextForPrompt(context: ChatContextData): string {
    if (!context.currentData) {
      return `当前页面: ${context.pageTitle} (${context.pageId})`;
    }

    const lines: string[] = [`页面: ${context.pageTitle}`, '当前数据:'];

    if (typeof context.currentData === 'object' && context.currentData !== null && 'vulnCounts' in context.currentData) {
      const dc = context.currentData as DashboardContext;
      lines.push(`- 漏洞: 严重${dc.vulnCounts.critical}个, 高危${dc.vulnCounts.high}个, 中危${dc.vulnCounts.medium}个, 低危${dc.vulnCounts.low}个`);
      lines.push(`- 未关闭事件: ${dc.openIncidents}个`);
      lines.push(`- 风险评分: ${dc.riskScore}/100`);
      lines.push(`- 合规评分: ${dc.complianceScore}%`);
    }

    if (typeof context.currentData === 'object' && context.currentData !== null && 'topVulnerabilities' in context.currentData) {
      const vc = context.currentData as VulnerabilitiesContext;
      lines.push(`- 共${vc.totalCount}个漏洞`);
      if (vc.topVulnerabilities.length > 0) {
        lines.push('- 最严重漏洞:');
        vc.topVulnerabilities.slice(0, 3).forEach(v => {
          lines.push(`  * ${v.cveId || v.id}: ${v.title} (${v.severity}${v.cvss ? `, CVSS ${v.cvss}` : ''})`);
        });
      }
      if (vc.slaBreaches > 0) lines.push(`- SLA逾期: ${vc.slaBreaches}个`);
    }

    if (typeof context.currentData === 'object' && context.currentData !== null && 'openBySeverity' in context.currentData) {
      const ic = context.currentData as IncidentsContext;
      lines.push(`- 未关闭事件: ${ic.totalOpen}个`);
      if (ic.avgResponseTime) lines.push(`- 平均响应时间: ${ic.avgResponseTime}小时`);
    }

    return lines.join('\n');
  }
}
