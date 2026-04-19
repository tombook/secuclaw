/**
 * SecuClaw RACI Matrix — React-compatible
 * Migrated from ui/src/ui/config/raci-matrix.ts
 */

import type { RoleId } from './role-themes';

export type RaciRole = 'R' | 'A' | 'C' | 'I';

export type ScenarioType =
  | 'incident-response'
  | 'vulnerability-management'
  | 'threat-response'
  | 'compliance-audit'
  | 'supply-chain-incident';

export interface RaciAssignment {
  role: RoleId;
  raci: RaciRole;
  tasks: string[];
}

export interface RaciScenario {
  id: ScenarioType;
  name: string;
  description: string;
  assignments: RaciAssignment[];
}

export const RACI_SCENARIOS: RaciScenario[] = [
  {
    id: 'incident-response',
    name: '安全事件响应',
    description: '处理安全事件、入侵检测和应急响应流程',
    assignments: [
      { role: 'security-ops', raci: 'R', tasks: ['执行事件响应', '收集取证数据', '实施遏制措施', '监控事件状态'] },
      { role: 'secuclaw-commander', raci: 'A', tasks: ['协调响应行动', '做出关键决策', '分配任务资源', '发布官方声明'] },
      { role: 'security-expert', raci: 'C', tasks: ['分析攻击手法', '评估影响范围', '提供技术指导', '建议缓解策略'] },
      { role: 'ciso', raci: 'C', tasks: ['审批响应计划', '协调跨部门合作', '向管理层汇报', '评估业务影响'] },
      { role: 'privacy-officer', raci: 'I', tasks: ['接收事件通知', '评估数据隐私影响', '准备隐私响应', '参与后续审查'] },
      { role: 'security-architect', raci: 'C', tasks: ['评估架构漏洞', '建议架构改进', '审查安全控制', '提供架构洞察'] },
      { role: 'business-security-officer', raci: 'I', tasks: ['评估业务影响', '制定恢复计划', '沟通业务影响', '协调业务恢复'] },
      { role: 'supply-chain-security', raci: 'I', tasks: ['检查供应链影响', '评估第三方风险', '通知相关供应商', '更新供应链状态'] },
    ],
  },
  {
    id: 'vulnerability-management',
    name: '漏洞管理',
    description: '识别、评估和修复系统和应用漏洞',
    assignments: [
      { role: 'security-expert', raci: 'R', tasks: ['发现和识别漏洞', '分析漏洞严重性', '验证漏洞存在', '提供修复建议'] },
      { role: 'security-architect', raci: 'R', tasks: ['评估架构漏洞', '设计缓解方案', '审查补丁策略', '规划架构改进'] },
      { role: 'ciso', raci: 'A', tasks: ['审批修复计划', '确定优先级', '分配修复资源', '监控修复进度'] },
      { role: 'security-ops', raci: 'C', tasks: ['执行补丁部署', '验证修复结果', '监控系统状态', '回滚失败的修复'] },
      { role: 'secuclaw-commander', raci: 'I', tasks: ['接收漏洞报告', '了解修复状态', '评估组织风险', '协调修复资源'] },
      { role: 'business-security-officer', raci: 'C', tasks: ['评估业务影响', '制定修复窗口', '协调业务部门', '管理风险接受'] },
      { role: 'supply-chain-security', raci: 'C', tasks: ['检查第三方漏洞', '更新依赖清单', '通知供应商修复', '评估供应链风险'] },
      { role: 'privacy-officer', raci: 'I', tasks: ['评估隐私影响', '确认数据暴露风险', '记录隐私合规性', '参与影响评估'] },
    ],
  },
  {
    id: 'threat-response',
    name: '威胁响应',
    description: '识别、分析和响应安全威胁和攻击活动',
    assignments: [
      { role: 'security-expert', raci: 'R', tasks: ['分析威胁情报', '识别攻击模式', '评估威胁能力', '制定响应策略'] },
      { role: 'security-ops', raci: 'R', tasks: ['监控威胁活动', '实施检测规则', '执行响应动作', '收集威胁数据'] },
      { role: 'secuclaw-commander', raci: 'A', tasks: ['指挥威胁响应', '制定应对策略', '协调跨团队行动', '做出战术决策'] },
      { role: 'ciso', raci: 'C', tasks: ['评估威胁影响', '批准响应计划', '协调组织资源', '向高管汇报'] },
      { role: 'security-architect', raci: 'C', tasks: ['评估防御架构', '建议架构增强', '设计缓解措施', '审查安全控制'] },
      { role: 'privacy-officer', raci: 'I', tasks: ['接收威胁通知', '评估隐私风险', '准备隐私响应', '参与事后分析'] },
      { role: 'business-security-officer', raci: 'I', tasks: ['评估业务影响', '制定应对计划', '沟通威胁状态', '协调业务行动'] },
      { role: 'supply-chain-security', raci: 'C', tasks: ['检查供应链威胁', '评估第三方风险', '通知相关供应商', '分析供应链影响'] },
    ],
  },
  {
    id: 'compliance-audit',
    name: '合规审计',
    description: '执行安全合规性评估和审计活动',
    assignments: [
      { role: 'privacy-officer', raci: 'R', tasks: ['执行合规检查', '准备审计证据', '撰写合规报告', '跟踪整改行动'] },
      { role: 'ciso', raci: 'A', tasks: ['审批审计计划', '分配审计资源', '批准审计报告', '监督整改执行'] },
      { role: 'security-architect', raci: 'C', tasks: ['评估控制设计', '审查架构合规', '建议控制改进', '参与技术审计'] },
      { role: 'security-expert', raci: 'C', tasks: ['技术审计支持', '评估控制有效性', '分析合规差距', '提供技术建议'] },
      { role: 'business-security-officer', raci: 'C', tasks: ['业务流程审计', '评估业务控制', '制定业务合规计划', '协调业务部门'] },
      { role: 'secuclaw-commander', raci: 'I', tasks: ['接收审计结果', '了解合规状态', '支持整改行动', '协调审计资源'] },
      { role: 'security-ops', raci: 'C', tasks: ['提供运营数据', '支持审计活动', '执行整改措施', '更新控制状态'] },
      { role: 'supply-chain-security', raci: 'C', tasks: ['供应商合规检查', '审查第三方协议', '评估供应链风险', '提供供应商审计数据'] },
    ],
  },
  {
    id: 'supply-chain-incident',
    name: '供应链事件',
    description: '处理供应链安全事件、第三方漏洞和依赖风险',
    assignments: [
      { role: 'supply-chain-security', raci: 'R', tasks: ['发现供应链威胁', '评估第三方风险', '更新依赖清单', '通知受影响方'] },
      { role: 'security-expert', raci: 'R', tasks: ['分析漏洞影响', '评估攻击向量', '建议缓解措施', '验证漏洞存在'] },
      { role: 'ciso', raci: 'A', tasks: ['审批响应计划', '协调组织资源', '做出关键决策', '向管理层汇报'] },
      { role: 'security-ops', raci: 'C', tasks: ['实施隔离措施', '部署安全补丁', '监控系统状态', '验证修复结果'] },
      { role: 'security-architect', raci: 'C', tasks: ['评估架构影响', '设计替代方案', '审查依赖关系', '建议架构改进'] },
      { role: 'business-security-officer', raci: 'I', tasks: ['评估业务影响', '制定恢复计划', '沟通影响范围', '协调业务行动'] },
      { role: 'secuclaw-commander', raci: 'I', tasks: ['接收事件通知', '协调响应行动', '分配应急资源', '发布官方声明'] },
      { role: 'privacy-officer', raci: 'I', tasks: ['评估隐私影响', '确认数据暴露', '准备隐私响应', '参与事后审查'] },
    ],
  },
];

/** Get RACI assignment for a specific role across all scenarios */
export function getRaciForRole(roleId: RoleId): Array<{ scenario: ScenarioType; raciRole: RaciRole; scenarioName: string }> {
  return RACI_SCENARIOS.map((scenario) => {
    const assignment = scenario.assignments.find((a) => a.role === roleId);
    return {
      scenario: scenario.id,
      raciRole: assignment?.raci ?? ('I' as RaciRole),
      scenarioName: scenario.name,
    };
  });
}

/** Get full scenario with assignments */
export function getScenario(scenarioId: ScenarioType): RaciScenario | undefined {
  return RACI_SCENARIOS.find((s) => s.id === scenarioId);
}
