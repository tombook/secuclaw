/**
 * SecuClaw 智能推荐服务
 * 基于角色 Triggers 生成推荐
 *
 * @see v2.0 文档 第 2 章 角色建模 - Triggers
 */

import type { RoleId } from '../config/role-tool-config';

// ─── Types ────────────────────────────────────────────────────

export type RecommendationPriority = 'high' | 'medium' | 'low';

export interface TriggerCondition {
  id: string;
  roleId: RoleId;
  condition: string;          // 触发条件描述
  priority: RecommendationPriority;
  /** 评估函数：返回 true 表示触发 */
  evaluate: (context: TriggerContext) => boolean;
}

export interface Recommendation {
  id: string;
  roleId: RoleId;
  roleLabel: string;
  priority: RecommendationPriority;
  title: string;
  description: string;
  scenario?: string;
}

export interface TriggerContext {
  /** 当前安全事件 */
  activeAlerts: number;
  /** 是否有高危漏洞 */
  hasCriticalVulns: boolean;
  /** 最高 CVSS 评分 */
  maxCvss: number;
  /** 补丁覆盖率 */
  patchCoverage: number;
  /** GDPR 合规率 */
  gdprCompliance: number;
  /** 隐私请求积压 */
  privacyRequestBacklog: number;
  /** 安全评分 */
  securityScore: number;
  /** 待处理告警 */
  pendingAlerts: number;
  /** 误报率 */
  falsePositiveRate: number;
  /** 高风险供应商数 */
  highRiskVendors: number;
  /** SBOM 覆盖率 */
  sbomCoverage: number;
  /** 预算使用率 */
  budgetUsage: number;
  /** 风险评分 */
  riskScore: number;
  /** 活跃事件数 */
  activeEvents: number;
  /** BCP 演练是否到期 */
  bcpDrillDue: boolean;
  /** 新系统上线 */
  newSystemOnline: boolean;
  /** 架构变更申请 */
  archChangeRequest: boolean;
}

// ─── Trigger Definitions ──────────────────────────────────────

const TRIGGERS: TriggerCondition[] = [
  // security-expert
  { id: 'se-t1', roleId: 'security-expert', condition: 'CVSS ≥ 7.0 高危漏洞', priority: 'high',
    evaluate: (ctx) => ctx.hasCriticalVulns || ctx.maxCvss >= 7.0 },
  { id: 'se-t2', roleId: 'security-expert', condition: '补丁覆盖率低于 70%', priority: 'medium',
    evaluate: (ctx) => ctx.patchCoverage < 70 },
  { id: 'se-t3', roleId: 'security-expert', condition: '威胁情报新匹配', priority: 'high',
    evaluate: (ctx) => ctx.activeAlerts > 0 && ctx.maxCvss >= 5.0 },

  // privacy-officer
  { id: 'po-t1', roleId: 'privacy-officer', condition: '合规审计周期临近', priority: 'high',
    evaluate: (ctx) => ctx.gdprCompliance < 80 },
  { id: 'po-t2', roleId: 'privacy-officer', condition: '隐私请求积压超量', priority: 'medium',
    evaluate: (ctx) => ctx.privacyRequestBacklog > 20 },
  { id: 'po-t3', roleId: 'privacy-officer', condition: '数据泄露事件', priority: 'high',
    evaluate: (ctx) => ctx.activeEvents > 0 && ctx.gdprCompliance < 90 },

  // security-architect
  { id: 'sa-t1', roleId: 'security-architect', condition: '新系统上线需安全评审', priority: 'high',
    evaluate: (ctx) => ctx.newSystemOnline },
  { id: 'sa-t2', roleId: 'security-architect', condition: '架构变更申请', priority: 'medium',
    evaluate: (ctx) => ctx.archChangeRequest },

  // business-security-officer
  { id: 'bso-t1', roleId: 'business-security-officer', condition: 'BCP 演练到期', priority: 'medium',
    evaluate: (ctx) => ctx.bcpDrillDue },
  { id: 'bso-t2', roleId: 'business-security-officer', condition: '业务中断事件', priority: 'high',
    evaluate: (ctx) => ctx.activeEvents > 3 },

  // secuclaw-commander
  { id: 'cmd-t1', roleId: 'secuclaw-commander', condition: '大规模安全事件', priority: 'high',
    evaluate: (ctx) => ctx.activeEvents > 5 || ctx.activeAlerts > 100 },
  { id: 'cmd-t2', roleId: 'secuclaw-commander', condition: '安全评分骤降', priority: 'high',
    evaluate: (ctx) => ctx.securityScore < 60 },
  { id: 'cmd-t3', roleId: 'secuclaw-commander', condition: '多角色交叉告警', priority: 'medium',
    evaluate: (ctx) => ctx.activeAlerts > 50 && ctx.activeEvents > 2 },

  // ciso
  { id: 'ciso-t1', roleId: 'ciso', condition: '风险评分超标', priority: 'high',
    evaluate: (ctx) => ctx.riskScore > 60 },
  { id: 'ciso-t2', roleId: 'ciso', condition: '预算使用率异常', priority: 'medium',
    evaluate: (ctx) => ctx.budgetUsage > 90 },

  // security-ops
  { id: 'ops-t1', roleId: 'security-ops', condition: 'P1/P2 新告警', priority: 'high',
    evaluate: (ctx) => ctx.pendingAlerts > 20 },
  { id: 'ops-t2', roleId: 'security-ops', condition: '告警积压', priority: 'medium',
    evaluate: (ctx) => ctx.pendingAlerts > 50 },
  { id: 'ops-t3', roleId: 'security-ops', condition: '误报率上升', priority: 'medium',
    evaluate: (ctx) => ctx.falsePositiveRate > 25 },

  // supply-chain-security
  { id: 'scs-t1', roleId: 'supply-chain-security', condition: '供应商风险等级变化', priority: 'high',
    evaluate: (ctx) => ctx.highRiskVendors > 0 },
  { id: 'scs-t2', roleId: 'supply-chain-security', condition: 'SBOM 发现新漏洞组件', priority: 'high',
    evaluate: (ctx) => ctx.sbomCoverage < 60 },
];

// ─── Recommendation Labels ────────────────────────────────────

const ROLE_LABELS: Record<RoleId, string> = {
  'security-expert': '安全专家',
  'privacy-officer': '隐私官',
  'security-architect': '安全架构师',
  'business-security-officer': '业务安全官',
  'secuclaw-commander': '安全指挥官',
  'ciso': 'CISO',
  'security-ops': '安全运营',
  'supply-chain-security': '供应链安全',
};

// ─── Recommendation Service ───────────────────────────────────

/**
 * 根据当前上下文生成推荐
 * @returns 按优先级排序的推荐列表（最多 3 条）
 */
export function generateRecommendations(
  context: TriggerContext
): Recommendation[] {
  const triggered = TRIGGERS
    .filter((trigger) => trigger.evaluate(context))
    .map((trigger) => ({
      id: trigger.id,
      roleId: trigger.roleId,
      roleLabel: ROLE_LABELS[trigger.roleId],
      priority: trigger.priority,
      title: `${ROLE_LABELS[trigger.roleId]}：${trigger.condition}`,
      description: `建议切换到${ROLE_LABELS[trigger.roleId]}角色处理：${trigger.condition}`,
      scenario: trigger.condition,
    }));

  // 按优先级排序，同优先级按角色去重
  const priorityOrder: Record<RecommendationPriority, number> = {
    high: 0, medium: 1, low: 2,
  };

  const seen = new Set<RoleId>();
  const deduped = triggered
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .filter((rec) => {
      if (seen.has(rec.roleId)) return false;
      seen.add(rec.roleId);
      return true;
    });

  return deduped.slice(0, 3);
}
