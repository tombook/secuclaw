/**
 * AI 能力配置 - 角色能力中心
 * 定义每个角色可用的 AI 能力、自动度等级
 */

export type AutonomyLevel = 'L0' | 'L1' | 'L2';
export type Layer = 'A' | 'B' | 'C';
export type Combination = 'SEC' | 'OPS' | 'GOV' | 'ALL';

export interface AiCapabilityDef {
  id: string;
  roleId: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  layer: Layer;
  autonomyLevel: AutonomyLevel;
  combination: Combination;
  icon: string;
  enabled: boolean;
  promptTemplate: string;
  inputSchema: { required: Record<string, string>; optional: Record<string, string> };
  outputSchema: { type: 'json' | 'markdown' | 'table' | 'free'; fields: Record<string, string> };
  llmConfig?: { provider?: string; model?: string; temperature?: number };
}

export const AUTONOMY_LABELS: Record<AutonomyLevel, { name: string; nameEn: string; color: string; description: string }> = {
  L0: { name: '人工', nameEn: 'Manual', color: '#6b7280', description: '仅提供信息，所有动作需人工执行' },
  L1: { name: '辅助', nameEn: 'Assisted', color: '#3b82f6', description: 'AI 建议 + 人工确认后执行' },
  L2: { name: '监督', nameEn: 'Supervised', color: '#f59e0b', description: 'AI 执行 + 人工监督，可回滚' },
};

const CAPABILITIES: AiCapabilityDef[] = [
  {
    id: 'ciso-strategy',
    roleId: 'ciso',
    name: 'CISO 战略分析',
    nameEn: 'CISO Strategy Analysis',
    description: '基于业务风险、监管要求、行业趋势生成安全战略建议',
    descriptionEn: 'Generate security strategy recommendations based on business risk, regulatory requirements and industry trends',
    layer: 'A', autonomyLevel: 'L1', combination: 'GOV',
    icon: '🎯', enabled: true, promptTemplate: '',
    inputSchema: { required: { businessContext: 'string' }, optional: { timelineMonths: 'number' } },
    outputSchema: { type: 'markdown', fields: { recommendation: 'string' } },
  },
  {
    id: 'ciso-board-report',
    roleId: 'ciso',
    name: '董事会报告生成',
    nameEn: 'Board Report Generation',
    description: '自动生成面向董事会的安全态势季度报告',
    descriptionEn: 'Generate quarterly security posture report for board of directors',
    layer: 'A', autonomyLevel: 'L1', combination: 'GOV',
    icon: '📋', enabled: true, promptTemplate: '',
    inputSchema: { required: { period: 'string' }, optional: {} },
    outputSchema: { type: 'markdown', fields: { report: 'string' } },
  },
  {
    id: 'ciso-compliance',
    roleId: 'ciso',
    name: '合规差距分析',
    nameEn: 'Compliance Gap Analysis',
    description: '识别当前控制与合规框架的差距',
    descriptionEn: 'Identify gaps between current controls and compliance frameworks',
    layer: 'A', autonomyLevel: 'L1', combination: 'GOV',
    icon: '✅', enabled: true, promptTemplate: '',
    inputSchema: { required: { framework: 'string' }, optional: {} },
    outputSchema: { type: 'json', fields: { gaps: 'array', score: 'number' } },
  },
  {
    id: 'ciso-budget',
    roleId: 'ciso',
    name: '预算 ROI 评估',
    nameEn: 'Budget ROI Assessment',
    description: '评估安全投资回报率，给出预算分配建议',
    descriptionEn: 'Assess security investment ROI and provide budget allocation recommendations',
    layer: 'A', autonomyLevel: 'L1', combination: 'GOV',
    icon: '💰', enabled: true, promptTemplate: '',
    inputSchema: { required: { investment: 'string' }, optional: {} },
    outputSchema: { type: 'markdown', fields: { roi: 'string' } },
  },
  {
    id: 'commander-posture',
    roleId: 'secuclaw-commander',
    name: '全域态势研判',
    nameEn: 'Global Posture Analysis',
    description: '综合多角色数据生成全域安全态势分析',
    descriptionEn: 'Synthesize multi-role data into global security posture analysis',
    layer: 'A', autonomyLevel: 'L1', combination: 'ALL',
    icon: '🌐', enabled: true, promptTemplate: '',
    inputSchema: { required: {}, optional: { scope: 'string' } },
    outputSchema: { type: 'markdown', fields: { assessment: 'string' } },
  },
  {
    id: 'commander-incident',
    roleId: 'secuclaw-commander',
    name: '事件指挥协调',
    nameEn: 'Incident Command Coordination',
    description: '为重大安全事件生成多角色协调方案',
    descriptionEn: 'Generate multi-role coordination plan for major security incidents',
    layer: 'A', autonomyLevel: 'L1', combination: 'OPS',
    icon: '🚨', enabled: true, promptTemplate: '',
    inputSchema: { required: { incident: 'string' }, optional: {} },
    outputSchema: { type: 'markdown', fields: { plan: 'string' } },
  },
  {
    id: 'commander-priority',
    roleId: 'secuclaw-commander',
    name: '优先级排序',
    nameEn: 'Priority Ranking',
    description: '基于业务影响和资源约束给出任务优先级建议',
    descriptionEn: 'Recommend task priorities based on business impact and resource constraints',
    layer: 'A', autonomyLevel: 'L1', combination: 'ALL',
    icon: '🎯', enabled: true, promptTemplate: '',
    inputSchema: { required: { tasks: 'string' }, optional: {} },
    outputSchema: { type: 'json', fields: { ranked: 'array' } },
  },
  {
    id: 'secops-soar',
    roleId: 'security-ops',
    name: 'SOAR 剧本推荐',
    nameEn: 'SOAR Playbook Recommendation',
    description: '根据告警上下文推荐最合适的 SOAR 处置剧本',
    descriptionEn: 'Recommend best SOAR playbook based on alert context',
    layer: 'A', autonomyLevel: 'L1', combination: 'OPS',
    icon: '🤖', enabled: true, promptTemplate: '',
    inputSchema: { required: { alert: 'string' }, optional: {} },
    outputSchema: { type: 'json', fields: { playbook: 'string', steps: 'array' } },
  },
  {
    id: 'secops-fp',
    roleId: 'security-ops',
    name: '误报分析',
    nameEn: 'False Positive Analysis',
    description: '基于历史告警模式识别可能的误报',
    descriptionEn: 'Identify potential false positives based on historical alert patterns',
    layer: 'A', autonomyLevel: 'L1', combination: 'OPS',
    icon: '🔍', enabled: true, promptTemplate: '',
    inputSchema: { required: { alertId: 'string' }, optional: {} },
    outputSchema: { type: 'json', fields: { verdict: 'string', confidence: 'number' } },
  },
  {
    id: 'secops-triage',
    roleId: 'security-ops',
    name: '告警分诊',
    nameEn: 'Alert Triage',
    description: '智能告警分诊，识别真实威胁并分配处理人',
    descriptionEn: 'Intelligent alert triage, identify real threats and assign handlers',
    layer: 'A', autonomyLevel: 'L1', combination: 'OPS',
    icon: '🚦', enabled: true, promptTemplate: '',
    inputSchema: { required: { alertId: 'string' }, optional: {} },
    outputSchema: { type: 'json', fields: { severity: 'string', assignee: 'string' } },
  },
  {
    id: 'expert-vuln',
    roleId: 'security-expert',
    name: '漏洞优先级',
    nameEn: 'Vulnerability Prioritization',
    description: '基于资产关键性、威胁情报、利用代码可用性排序',
    descriptionEn: 'Prioritize based on asset criticality, threat intel and exploit availability',
    layer: 'A', autonomyLevel: 'L1', combination: 'SEC',
    icon: '🎯', enabled: true, promptTemplate: '',
    inputSchema: { required: { vulnerabilities: 'string' }, optional: {} },
    outputSchema: { type: 'json', fields: { prioritized: 'array' } },
  },
  {
    id: 'expert-pentest',
    roleId: 'security-expert',
    name: '渗透测试规划',
    nameEn: 'Penetration Test Planning',
    description: '基于攻击面自动生成渗透测试方案',
    descriptionEn: 'Generate penetration test plan based on attack surface',
    layer: 'A', autonomyLevel: 'L1', combination: 'SEC',
    icon: '🎯', enabled: true, promptTemplate: '',
    inputSchema: { required: { target: 'string' }, optional: {} },
    outputSchema: { type: 'markdown', fields: { plan: 'string' } },
  },
  {
    id: 'expert-exploit',
    roleId: 'security-expert',
    name: '漏洞利用分析',
    nameEn: 'Exploit Analysis',
    description: '分析漏洞的可利用性并给出复现步骤',
    descriptionEn: 'Analyze vulnerability exploitability and provide reproduction steps',
    layer: 'A', autonomyLevel: 'L1', combination: 'SEC',
    icon: '💥', enabled: true, promptTemplate: '',
    inputSchema: { required: { cve: 'string' }, optional: {} },
    outputSchema: { type: 'markdown', fields: { analysis: 'string' } },
  },
  {
    id: 'privacy-dpia',
    roleId: 'privacy-officer',
    name: 'DPIA 自动评估',
    nameEn: 'DPIA Auto Assessment',
    description: '自动生成数据保护影响评估报告',
    descriptionEn: 'Auto-generate Data Protection Impact Assessment',
    layer: 'A', autonomyLevel: 'L1', combination: 'GOV',
    icon: '📋', enabled: true, promptTemplate: '',
    inputSchema: { required: { processingActivity: 'string' }, optional: {} },
    outputSchema: { type: 'markdown', fields: { dpia: 'string' } },
  },
  {
    id: 'privacy-dsr',
    roleId: 'privacy-officer',
    name: '数据主体请求处理',
    nameEn: 'DSR Response',
    description: '协助处理数据访问、删除、可携等主体请求',
    descriptionEn: 'Assist in handling data subject access, erasure and portability requests',
    layer: 'A', autonomyLevel: 'L1', combination: 'GOV',
    icon: '👤', enabled: true, promptTemplate: '',
    inputSchema: { required: { requestType: 'string' }, optional: {} },
    outputSchema: { type: 'json', fields: { response: 'string' } },
  },
  {
    id: 'privacy-breach',
    roleId: 'privacy-officer',
    name: '数据泄露评估',
    nameEn: 'Data Breach Assessment',
    description: '评估数据泄露事件的影响范围和通知义务',
    descriptionEn: 'Assess data breach impact and notification obligations',
    layer: 'A', autonomyLevel: 'L1', combination: 'GOV',
    icon: '🚨', enabled: true, promptTemplate: '',
    inputSchema: { required: { incident: 'string' }, optional: {} },
    outputSchema: { type: 'markdown', fields: { assessment: 'string' } },
  },
  {
    id: 'arch-design',
    roleId: 'security-architect',
    name: '安全架构设计',
    nameEn: 'Security Architecture Design',
    description: '基于业务需求生成安全架构方案',
    descriptionEn: 'Generate security architecture based on business requirements',
    layer: 'A', autonomyLevel: 'L1', combination: 'SEC',
    icon: '🏗️', enabled: true, promptTemplate: '',
    inputSchema: { required: { requirements: 'string' }, optional: {} },
    outputSchema: { type: 'markdown', fields: { architecture: 'string' } },
  },
  {
    id: 'arch-threat',
    roleId: 'security-architect',
    name: '威胁建模',
    nameEn: 'Threat Modeling',
    description: '基于 STRIDE 进行系统威胁建模',
    descriptionEn: 'System threat modeling using STRIDE methodology',
    layer: 'A', autonomyLevel: 'L1', combination: 'SEC',
    icon: '⚠️', enabled: true, promptTemplate: '',
    inputSchema: { required: { system: 'string' }, optional: {} },
    outputSchema: { type: 'json', fields: { threats: 'array' } },
  },
  {
    id: 'arch-zt',
    roleId: 'security-architect',
    name: '零信任评估',
    nameEn: 'Zero Trust Assessment',
    description: '评估当前架构到零信任模型的差距',
    descriptionEn: 'Assess current architecture gap to zero trust model',
    layer: 'A', autonomyLevel: 'L1', combination: 'SEC',
    icon: '🛡️', enabled: true, promptTemplate: '',
    inputSchema: { required: { architecture: 'string' }, optional: {} },
    outputSchema: { type: 'json', fields: { score: 'number', gaps: 'array' } },
  },
  {
    id: 'biz-bcp',
    roleId: 'business-security-officer',
    name: 'BCP 规划',
    nameEn: 'BCP Planning',
    description: '基于业务影响分析生成业务连续性计划',
    descriptionEn: 'Generate business continuity plan based on BIA',
    layer: 'A', autonomyLevel: 'L1', combination: 'GOV',
    icon: '🛡️', enabled: true, promptTemplate: '',
    inputSchema: { required: { bia: 'string' }, optional: {} },
    outputSchema: { type: 'markdown', fields: { plan: 'string' } },
  },
  {
    id: 'biz-bia',
    roleId: 'business-security-officer',
    name: '业务影响分析',
    nameEn: 'Business Impact Analysis',
    description: '分析关键业务系统的影响范围和恢复优先级',
    descriptionEn: 'Analyze critical business system impact and recovery priority',
    layer: 'A', autonomyLevel: 'L1', combination: 'GOV',
    icon: '📉', enabled: true, promptTemplate: '',
    inputSchema: { required: { systems: 'string' }, optional: {} },
    outputSchema: { type: 'json', fields: { impacts: 'array' } },
  },
  {
    id: 'biz-drill',
    roleId: 'business-security-officer',
    name: '演练方案生成',
    nameEn: 'Drill Plan Generation',
    description: '基于历史事件生成应急演练方案',
    descriptionEn: 'Generate emergency drill plan based on historical incidents',
    layer: 'A', autonomyLevel: 'L1', combination: 'GOV',
    icon: '🔥', enabled: true, promptTemplate: '',
    inputSchema: { required: { scenario: 'string' }, optional: {} },
    outputSchema: { type: 'markdown', fields: { drill: 'string' } },
  },
  {
    id: 'supply-vendor',
    roleId: 'supply-chain-security',
    name: '供应商风险评估',
    nameEn: 'Vendor Risk Assessment',
    description: '基于多维度评估供应商安全风险',
    descriptionEn: 'Assess vendor security risk across multiple dimensions',
    layer: 'A', autonomyLevel: 'L1', combination: 'SEC',
    icon: '🏢', enabled: true, promptTemplate: '',
    inputSchema: { required: { vendor: 'string' }, optional: {} },
    outputSchema: { type: 'json', fields: { score: 'number', risks: 'array' } },
  },
  {
    id: 'supply-sbom',
    roleId: 'supply-chain-security',
    name: 'SBOM 漏洞关联',
    nameEn: 'SBOM Vulnerability Correlation',
    description: '将 SBOM 与漏洞情报库关联识别受影响组件',
    descriptionEn: 'Correlate SBOM with vulnerability intel to identify affected components',
    layer: 'A', autonomyLevel: 'L1', combination: 'SEC',
    icon: '📦', enabled: true, promptTemplate: '',
    inputSchema: { required: { sbom: 'string' }, optional: {} },
    outputSchema: { type: 'json', fields: { affected: 'array' } },
  },
  {
    id: 'supply-intel',
    roleId: 'supply-chain-security',
    name: '供应链威胁情报',
    nameEn: 'Supply Chain Threat Intel',
    description: '汇总供应链相关的最新威胁情报',
    descriptionEn: 'Aggregate latest supply chain threat intelligence',
    layer: 'A', autonomyLevel: 'L1', combination: 'SEC',
    icon: '🌐', enabled: true, promptTemplate: '',
    inputSchema: { required: {}, optional: { sector: 'string' } },
    outputSchema: { type: 'markdown', fields: { intel: 'string' } },
  },
  {
    id: 'ciso-incident',
    roleId: 'ciso',
    name: '事件复盘',
    nameEn: 'Incident Postmortem',
    description: '自动生成事件复盘报告，识别根因',
    descriptionEn: 'Auto-generate incident postmortem and identify root causes',
    layer: 'A', autonomyLevel: 'L1', combination: 'OPS',
    icon: '🔄', enabled: true, promptTemplate: '',
    inputSchema: { required: { incident: 'string' }, optional: {} },
    outputSchema: { type: 'markdown', fields: { report: 'string' } },
  },
  {
    id: 'commander-resource',
    roleId: 'secuclaw-commander',
    name: '资源调度',
    nameEn: 'Resource Allocation',
    description: '基于当前态势建议安全人员/工具资源分配',
    descriptionEn: 'Recommend security personnel/tool allocation based on current posture',
    layer: 'A', autonomyLevel: 'L1', combination: 'ALL',
    icon: '📊', enabled: true, promptTemplate: '',
    inputSchema: { required: { context: 'string' }, optional: {} },
    outputSchema: { type: 'markdown', fields: { allocation: 'string' } },
  },
  {
    id: 'secops-correlation',
    roleId: 'security-ops',
    name: '告警关联分析',
    nameEn: 'Alert Correlation',
    description: '将多个相关告警合并为事件',
    descriptionEn: 'Merge related alerts into single incidents',
    layer: 'A', autonomyLevel: 'L1', combination: 'OPS',
    icon: '🔗', enabled: true, promptTemplate: '',
    inputSchema: { required: { alertIds: 'string' }, optional: {} },
    outputSchema: { type: 'json', fields: { incidents: 'array' } },
  },
  {
    id: 'secops-hunt',
    roleId: 'security-ops',
    name: '威胁狩猎假设',
    nameEn: 'Threat Hunt Hypothesis',
    description: '基于最新威胁趋势生成狩猎假设',
    descriptionEn: 'Generate threat hunting hypotheses based on latest threat trends',
    layer: 'A', autonomyLevel: 'L1', combination: 'SEC',
    icon: '🔎', enabled: true, promptTemplate: '',
    inputSchema: { required: {}, optional: { sector: 'string' } },
    outputSchema: { type: 'markdown', fields: { hypotheses: 'array' } },
  },
  {
    id: 'privacy-consent',
    roleId: 'privacy-officer',
    name: '同意管理优化',
    nameEn: 'Consent Management',
    description: '优化同意流程，提升用户体验和合规性',
    descriptionEn: 'Optimize consent flow to improve UX and compliance',
    layer: 'A', autonomyLevel: 'L1', combination: 'GOV',
    icon: '✅', enabled: true, promptTemplate: '',
    inputSchema: { required: { currentFlow: 'string' }, optional: {} },
    outputSchema: { type: 'markdown', fields: { recommendation: 'string' } },
  },
  {
    id: 'arch-review',
    roleId: 'security-architect',
    name: '架构安全评审',
    nameEn: 'Architecture Security Review',
    description: '对架构方案进行安全评审',
    descriptionEn: 'Security review of architecture proposals',
    layer: 'A', autonomyLevel: 'L1', combination: 'SEC',
    icon: '🔍', enabled: true, promptTemplate: '',
    inputSchema: { required: { proposal: 'string' }, optional: {} },
    outputSchema: { type: 'markdown', fields: { review: 'string' } },
  },
];

export async function fetchAiCapabilities(roleId?: string, opts?: { signal?: AbortSignal }): Promise<AiCapabilityDef[]> {
  try {
    const res = await fetch('http://127.0.0.1:21981/api/v1/ai.capabilities.list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleId }),
      signal: opts?.signal,
    });
    const data = await res.json();
    const result = data.result || data;
    if (Array.isArray(result) && result.length > 0) return result;
  } catch { /* fallback to local */ }
  return CAPABILITIES.filter(c => !roleId || c.roleId === roleId);
}

export async function executeAiCapability(
  capabilityId: string,
  roleId: string,
  input?: Record<string, unknown>,
  llmConfig?: Record<string, unknown>,
): Promise<{ result: any }> {
  try {
    const res = await fetch('http://127.0.0.1:21981/api/v1/ai.capabilities.execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capabilityId, roleId, input: input || {}, llmConfig }),
    });
    return res.json();
  } catch (e) {
    return { result: { error: String(e), stub: true, capabilityId, roleId, input } };
  }
}

export async function fetchAutonomySummary(): Promise<Record<AutonomyLevel, { count: number; roles: string[] }>> {
  const summary: Record<AutonomyLevel, { count: number; roles: string[] }> = {
    L0: { count: 0, roles: [] }, L1: { count: 0, roles: [] }, L2: { count: 0, roles: [] },
  };
  for (const c of CAPABILITIES) {
    summary[c.autonomyLevel].count++;
    if (!summary[c.autonomyLevel].roles.includes(c.roleId)) {
      summary[c.autonomyLevel].roles.push(c.roleId);
    }
  }
  return summary;
}
