import type { RouterDeps } from '../router.js';
import { JsonStore } from '../../storage/json-store.js';

const store = new JsonStore('./data/storage');
const AI_EXPERTS_KEY = 'ai-experts/config.json';

interface ExpertRoleConfig {
  id: string;
  enabled: boolean;
  providerId: string;
  model: string;
}

interface ExpertsConfig {
  roles: ExpertRoleConfig[];
}

async function loadExpertsConfig(): Promise<ExpertsConfig> {
  const data = await store.get<ExpertsConfig>(AI_EXPERTS_KEY);
  return data || { roles: [] };
}

async function saveExpertsConfig(config: ExpertsConfig): Promise<void> {
  await store.set(AI_EXPERTS_KEY, config);
}

export function registerAiRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  _deps: RouterDeps
): void {
  handlers.set('aiExperts.config.get', async () => {
    return loadExpertsConfig();
  });

  handlers.set('aiExperts.config.save', async (params) => {
    const roles = (params.roles || []) as ExpertRoleConfig[];
    const config: ExpertsConfig = { roles };
    await saveExpertsConfig(config);
    return { success: true, roles: config.roles };
  });

  handlers.set('ai.insights', async (p) => {
    const pageId = (p.pageId as string) || 'dashboard';
    const contextSpecific: Record<string, Array<{
      id: string; type: string; title: string; description: string;
      priority: string; category: string; source: string; createdAt: string;
    }>> = {
      dashboard: [
        { id: 'ins-1', type: 'warning', title: '高危漏洞待处理', description: '检测到3个CVSS 9.0+漏洞超过SLA，建议24小时内处理', priority: 'high', category: 'security', source: '漏洞管理系统', createdAt: new Date().toISOString() },
        { id: 'ins-2', type: 'info', title: '合规率上升趋势', description: '本周合规率提升5%，主要改善在数据处理记录方面', priority: 'medium', category: 'compliance', source: '合规审计系统', createdAt: new Date().toISOString() },
        { id: 'ins-3', type: 'recommendation', title: '建议更新安全策略', description: '根据最新威胁情报，建议更新边界防护策略和入侵检测规则', priority: 'medium', category: 'security', source: '威胁情报平台', createdAt: new Date().toISOString() },
      ],
      threats: [
        { id: 'ins-t1', type: 'warning', title: 'APT组织活动预警', description: '监测到APT28组织近期活动频繁，可能针对金融行业发起攻击', priority: 'high', category: 'security', source: '威胁情报中心', createdAt: new Date().toISOString() },
        { id: 'ins-t2', type: 'info', title: '威胁指标更新', description: '新增156个IOC指标，已自动关联到现有资产', priority: 'low', category: 'security', source: 'IOC管理平台', createdAt: new Date().toISOString() },
      ],
      vulnerabilities: [
        { id: 'ins-v1', type: 'recommendation', title: '优先修复CVE-2024-XXX', description: '该漏洞已有公开利用代码，影响核心生产系统', priority: 'high', category: 'security', source: 'AI分析引擎', createdAt: new Date().toISOString() },
      ],
      incidents: [
        { id: 'ins-i1', type: 'warning', title: '事件响应SLA预警', description: '2个P1事件即将突破响应SLA，请尽快处理', priority: 'high', category: 'operations', source: '事件管理系统', createdAt: new Date().toISOString() },
      ],
      compliance: [
        { id: 'ins-c1', type: 'info', title: '等保2.0合规进展', description: '等保三级测评准备进度78%，预计下周完成自评估', priority: 'medium', category: 'compliance', source: '合规管理平台', createdAt: new Date().toISOString() },
      ],
      reports: [
        { id: 'ins-r1', type: 'info', title: '报告生成建议', description: '基于当前数据，建议生成本月安全态势分析报告', priority: 'low', category: 'operations', source: '报告引擎', createdAt: new Date().toISOString() },
      ],
    };
    const insights = contextSpecific[pageId] || contextSpecific['dashboard'];
    return { insights };
  });
  
  handlers.set('ai.anomalies', async (_p) => {
    return { anomalies: [] };
  });
  
  handlers.set('ai.trend', async (p) => {
    const metric = (p.metric as string) || 'risk-score';
    const timeframe = (p.timeframe as string) || '30d';
    const currentValue = 72;
    const predictedValue = 75;
    return {
      metric,
      prediction: {
        metric,
        currentValue,
        predictedValue,
        confidence: 78,
        timeframe,
        trend: 'increasing',
        factors: ['历史趋势', '季节性因素', '近期事件'],
        recommendation: '指标呈上升趋势，建议保持当前策略并持续监控',
        riskLevel: 'low',
      },
    };
  });
  
  handlers.set('ai.recommendations', async (p) => {
    const pageId = (p.pageId as string) || 'dashboard';
    const contextSpecific: Record<string, Array<{
      id: string; category: string; title: string; description: string;
      priority: number; impact: string; effort: string; rationale: string;
      actions: Array<{ id: string; title: string; description: string; type: string; effort: string; impact: string; status: string }>;
      relatedEntities: unknown[]; createdAt: string;
    }>> = {
      dashboard: [
        { id: 'rec-1', category: 'security', title: '优化访问控制策略', description: '根据当前安全态势，建议收紧关键系统的访问控制策略', priority: 85, impact: 'high', effort: 'medium', rationale: '基于风险评估和合规要求分析', actions: [{ id: 'act-1', title: '审查访问策略', description: '审查并更新关键系统的访问控制列表', type: 'immediate', effort: 'medium', impact: 'high', status: 'pending' }], relatedEntities: [], createdAt: new Date().toISOString() },
        { id: 'rec-2', category: 'operations', title: '增强系统监控', description: '建议增加关键业务系统的实时监控覆盖率', priority: 70, impact: 'medium', effort: 'low', rationale: '当前监控覆盖率为78%，建议提升至95%以上', actions: [{ id: 'act-2', title: '部署监控代理', description: '在未覆盖的服务器上部署监控代理', type: 'short_term', effort: 'low', impact: 'medium', status: 'pending' }], relatedEntities: [], createdAt: new Date().toISOString() },
        { id: 'rec-3', category: 'compliance', title: '定期备份关键数据', description: '确保关键数据备份策略符合等保2.0要求', priority: 60, impact: 'high', effort: 'low', rationale: '数据备份是合规检查的必审项', actions: [], relatedEntities: [], createdAt: new Date().toISOString() },
      ],
      vulnerabilities: [
        { id: 'rec-v1', category: 'security', title: '优先修复高危漏洞', description: '检测到多个高危漏洞已有公开利用代码，建议优先处理', priority: 95, impact: 'high', effort: 'medium', rationale: '基于CVSS评分、资产重要性和威胁情报分析', actions: [{ id: 'act-v1', title: '分配修复任务', description: '将漏洞分配给相应负责人', type: 'immediate', effort: 'low', impact: 'high', status: 'pending' }], relatedEntities: [], createdAt: new Date().toISOString() },
      ],
    };
    const recommendations = contextSpecific[pageId] || contextSpecific['dashboard'];
    return { recommendations };
  });
  
  handlers.set('ai.anomaly.acknowledge', async (p) => {
    const { anomalyId: _anomalyId } = p;
    return { success: true, anomalyId: _anomalyId };
  });
  
  handlers.set('ai.anomaly.resolve', async (p) => {
    const { anomalyId } = p;
    return { success: true, anomalyId };
  });
  
  handlers.set('ai.chat', async (p) => {
    const { context, message } = p;
    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: `[Mock AI Response] Received message: "${message}" in context: "${context}"`,
      timestamp: new Date().toISOString()
    };
  });
  
  handlers.set('ai.action.execute', async (p) => {
    const { actionId: _actionId } = p;
    return { success: false, message: 'Action execution not implemented' };
  });
  
  handlers.set('kpi.calculate', async () => {
    return {
      securityScore: 85,
      riskScore: 15,
      complianceScore: 90,
      lastCalculated: new Date().toISOString()
    };
  });
}