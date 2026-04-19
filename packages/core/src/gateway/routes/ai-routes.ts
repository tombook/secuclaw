import type { RouterDeps } from '../router.js';
import { JsonStore } from '../../storage/json-store.js';
import { KpiService } from '../../kpi/service.js';
import { LLMService } from '../../ai/llm-service.js';
import { LLMConfig, LLMError, LLMErrorCode } from '../../ai/llm-types.js';
import { RolePersonaManager } from '../../ai/role-persona.js';
import { ChatContextAggregator } from '../../ai/chat-context.js';

const store = new JsonStore('./data/storage');
const kpiService = new KpiService(store);
const AI_EXPERTS_KEY = 'ai-experts/config.json';
const LLM_PROVIDERS_KEY = 'llm/providers.json';

interface ExpertRoleConfig {
  id: string;
  enabled: boolean;
  providerId: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
}

interface ExpertsConfig {
  roles: ExpertRoleConfig[];
  defaultProvider?: string;
  defaultModel?: string;
  defaultApiKey?: string;
  defaultBaseUrl?: string;
}

interface ChatRequest {
  pageId?: string;
  pageTitle?: string;
  roleId?: string;
  message: string;
  forceRefresh?: boolean;
}

interface LLMProvider {
  id: string;
  name: string;
  type: string;
  baseUrl: string;
  apiKey?: string;
  models: string[];
  enabled: boolean;
}

let llmService: LLMService | null = null;
let rolePersonaManager: RolePersonaManager;
let chatContextAggregator: ChatContextAggregator;
let currentLLMConfig: LLMConfig | null = null;

async function loadLLMProviders(): Promise<LLMProvider[]> {
  const data = await store.get<LLMProvider[]>(LLM_PROVIDERS_KEY);
  return Array.isArray(data) ? data : [];
}

function initializeServices(deps: RouterDeps) {
  if (!rolePersonaManager) {
    rolePersonaManager = new RolePersonaManager();
  }
  if (!chatContextAggregator && deps.jsonStore) {
    chatContextAggregator = new ChatContextAggregator(deps.jsonStore);
  }
}

function createLLMService(config: LLMConfig): LLMService {
  currentLLMConfig = config;
  llmService = new LLMService(config);
  return llmService;
}

async function loadExpertsConfig(): Promise<ExpertsConfig> {
  const data = await store.get<ExpertsConfig>(AI_EXPERTS_KEY);
  const defaultConfig: ExpertsConfig = {
    roles: [],
    defaultProvider: 'openai',
    defaultModel: 'gpt-4',
    defaultBaseUrl: 'https://api.openai.com/v1',
  };
  if (!data) return defaultConfig;
  return { ...defaultConfig, ...data };
}

async function saveExpertsConfig(config: ExpertsConfig): Promise<void> {
  await store.set(AI_EXPERTS_KEY, config);
}

export function registerAiRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  deps: RouterDeps
): void {
  initializeServices(deps);

  handlers.set('aiExperts.config.get', async () => {
    const config = await loadExpertsConfig();
    const safeConfig = {
      ...config,
      defaultApiKey: config.defaultApiKey ? '***' : undefined,
    };
    return {
      ...safeConfig,
      currentConfig: currentLLMConfig ? {
        provider: currentLLMConfig.provider,
        model: currentLLMConfig.model,
        baseUrl: currentLLMConfig.baseUrl,
      } : null,
    };
  });

  handlers.set('aiExperts.config.save', async (params) => {
    const config = params.config as Partial<ExpertsConfig>;
    const currentConfig = await loadExpertsConfig();
    const updatedConfig: ExpertsConfig = {
      ...currentConfig,
      ...config,
    };
    await saveExpertsConfig(updatedConfig);

    if (config.defaultProvider && config.defaultModel) {
      const llmConfig: LLMConfig = {
        provider: config.defaultProvider as any,
        model: config.defaultModel,
        apiKey: config.defaultApiKey,
        baseUrl: config.defaultBaseUrl,
        temperature: config.defaultProvider === 'openai' ? 0.3 : 0.5,
        timeout: 10000,
      };
      createLLMService(llmConfig);
    }

    return { success: true };
  });

  handlers.set('ai.chat', async (p) => {
    const req = p as unknown as ChatRequest;
    const { message, pageId = 'dashboard', pageTitle = 'Dashboard', roleId = 'security-expert', forceRefresh } = req;

    if (!message) {
      throw new Error('message is required');
    }

    // Try to find an enabled LLM provider from llm.providers.list
    const providers = await loadLLMProviders();
    const enabledProvider = providers.find((prov: LLMProvider) => prov.enabled && prov.apiKey && prov.baseUrl.includes('.'));

    if (enabledProvider) {
      createLLMService({
        provider: enabledProvider.type as any,
        model: enabledProvider.models[0] || 'glm-4',
        apiKey: enabledProvider.apiKey,
        baseUrl: enabledProvider.baseUrl,
        temperature: 0.3,
        timeout: 15000,
      });
    } else if (!llmService || !currentLLMConfig) {
      const config = await loadExpertsConfig();
      if (config.defaultProvider && config.defaultModel) {
        createLLMService({
          provider: config.defaultProvider as any,
          model: config.defaultModel,
          apiKey: config.defaultApiKey,
          baseUrl: config.defaultBaseUrl,
          temperature: 0.3,
          timeout: 10000,
        });
      } else {
        return {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: 'AI服务未配置。请在设置中添加LLM provider并配置API密钥。',
          timestamp: new Date().toISOString(),
        };
      }
    }

    try {
      const systemPrompt = rolePersonaManager.buildSystemPrompt(roleId);

      let contextText = '';
      if (chatContextAggregator) {
        const contextData = await chatContextAggregator.getContext(pageId, pageTitle, forceRefresh);
        contextText = chatContextAggregator.formatContextForPrompt(contextData);
      }

      const messages: import('../../ai/llm-types.js').LLMMessage[] = [
        systemPrompt,
        {
          role: 'user' as const,
          content: `当前安全数据:\n${contextText}\n\n用户问题: ${message}`,
        },
      ];

      const response = await llmService!.chat(messages);

      return {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof LLMError) {
        if (error.code === LLMErrorCode.TIMEOUT) {
          return {
            id: `msg_${Date.now()}`,
            role: 'assistant',
            content: 'AI请求超时。请稍后重试，或检查网络连接。',
            timestamp: new Date().toISOString(),
            error: 'TIMEOUT',
          };
        }
        if (error.code === LLMErrorCode.INVALID_CONFIG) {
          return {
            id: `msg_${Date.now()}`,
            role: 'assistant',
            content: `AI配置无效: ${error.message}。请检查设置中的API密钥和模型配置。`,
            timestamp: new Date().toISOString(),
            error: 'CONFIG_ERROR',
          };
        }
      }
      console.error('[ai-routes] ai.chat error:', error);
      return {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: '抱歉，AI服务暂时不可用。请稍后重试。',
        timestamp: new Date().toISOString(),
        error: 'SERVICE_ERROR',
      };
    }
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

  handlers.set('ai.action.execute', async (p) => {
    const { actionId: _actionId } = p;
    return { success: false, message: 'Action execution not implemented' };
  });

  handlers.set('kpi.calculate', async () => {
    try {
      const metrics = await kpiService.calculateAllMetrics();
      return {
        overallScore: metrics.overallScore,
        securityScore: metrics.securityScore,
        riskScore: metrics.riskScore,
        complianceScore: metrics.compliance.overall,
        lastCalculated: new Date(metrics.timestamp).toISOString(),
        details: {
          incidents: metrics.incidents,
          vulnerabilities: metrics.vulnerabilities,
          threats: metrics.threats,
          compliance: metrics.compliance,
          assets: metrics.assets,
          sla: metrics.sla,
          trends: metrics.trends,
        },
      };
    } catch (error) {
      console.error('[ai-routes] kpi.calculate failed:', error);
      return {
        securityScore: 0,
        riskScore: 100,
        complianceScore: 0,
        lastCalculated: new Date().toISOString(),
        error: 'KPI calculation failed',
      };
    }
  });

  handlers.set('kpi.summary', async () => {
    try {
      return await kpiService.getSummary();
    } catch (error) {
      console.error('[ai-routes] kpi.summary failed:', error);
      return {
        overallScore: 0,
        riskScore: 100,
        securityScore: 0,
        complianceScore: 0,
        lastCalculated: new Date().toISOString(),
        error: 'KPI summary failed',
      };
    }
  });
}
