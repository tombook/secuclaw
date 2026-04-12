import type { RoleId } from '../store/role-context.js';
import type { ScenarioType } from './raci-matrix.js';

export type WorkflowStepType = 'auto' | 'manual' | 'ai-suggest';

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  type: WorkflowStepType;
  skillId?: string;
  dependsOn?: string[];
  notifyRoles?: RoleId[];
  estimatedDuration?: string;
}

export interface RoleWorkflow {
  roleId: RoleId;
  scenario: ScenarioType;
  steps: WorkflowStep[];
}

export const ROLE_WORKFLOWS: RoleWorkflow[] = [
  {
    roleId: 'security-ops',
    scenario: 'incident-response',
    steps: [
      {
        id: 'ir-ops-1',
        name: '接收事件告警',
        description: '接收并初步分析安全事件告警',
        type: 'auto',
        skillId: 'alert-analysis',
        estimatedDuration: '5分钟'
      },
      {
        id: 'ir-ops-2',
        name: '执行遏制措施',
        description: '根据响应计划执行紧急遏制措施',
        type: 'manual',
        dependsOn: ['ir-ops-1'],
        notifyRoles: ['secuclaw-commander'],
        estimatedDuration: '15-30分钟'
      },
      {
        id: 'ir-ops-3',
        name: '收集取证数据',
        description: '收集和保存相关的日志和取证数据',
        type: 'manual',
        dependsOn: ['ir-ops-2'],
        estimatedDuration: '30-60分钟'
      },
      {
        id: 'ir-ops-4',
        name: '监控事件状态',
        description: '持续监控事件处理状态和系统活动',
        type: 'auto',
        skillId: 'threat-monitoring',
        dependsOn: ['ir-ops-3'],
        estimatedDuration: '持续'
      }
    ]
  },
  {
    roleId: 'security-ops',
    scenario: 'vulnerability-management',
    steps: [
      {
        id: 'vm-ops-1',
        name: '接收漏洞通知',
        description: '接收新发现漏洞的通知和详情',
        type: 'auto',
        skillId: 'vuln-intake',
        estimatedDuration: '即时'
      },
      {
        id: 'vm-ops-2',
        name: '执行补丁部署',
        description: '按照优先级计划执行补丁部署',
        type: 'manual',
        dependsOn: ['vm-ops-1'],
        notifyRoles: ['ciso'],
        estimatedDuration: '1-4小时'
      },
      {
        id: 'vm-ops-3',
        name: '验证修复结果',
        description: '验证漏洞已成功修复',
        type: 'auto',
        skillId: 'vuln-verification',
        dependsOn: ['vm-ops-2'],
        estimatedDuration: '15-30分钟'
      },
      {
        id: 'vm-ops-4',
        name: '监控系统状态',
        description: '监控修复后的系统状态和性能',
        type: 'auto',
        dependsOn: ['vm-ops-3'],
        estimatedDuration: '持续'
      }
    ]
  },

  {
    roleId: 'secuclaw-commander',
    scenario: 'incident-response',
    steps: [
      {
        id: 'ir-cmd-1',
        name: '评估事件严重性',
        description: '快速评估事件的严重级别和影响范围',
        type: 'ai-suggest',
        skillId: 'incident-assessment',
        estimatedDuration: '5-10分钟'
      },
      {
        id: 'ir-cmd-2',
        name: '激活响应团队',
        description: '激活相关响应团队并分配任务',
        type: 'manual',
        dependsOn: ['ir-cmd-1'],
        notifyRoles: ['security-ops', 'security-expert', 'ciso'],
        estimatedDuration: '5-15分钟'
      },
      {
        id: 'ir-cmd-3',
        name: '制定响应策略',
        description: '制定整体响应策略和协调计划',
        type: 'ai-suggest',
        skillId: 'response-strategy',
        dependsOn: ['ir-cmd-2'],
        estimatedDuration: '10-30分钟'
      },
      {
        id: 'ir-cmd-4',
        name: '协调跨团队行动',
        description: '协调各团队执行响应行动',
        type: 'manual',
        dependsOn: ['ir-cmd-3'],
        estimatedDuration: '持续'
      },
      {
        id: 'ir-cmd-5',
        name: '发布官方声明',
        description: '准备和发布事件相关的官方声明',
        type: 'manual',
        dependsOn: ['ir-cmd-4'],
        notifyRoles: ['business-security-officer', 'ciso'],
        estimatedDuration: '30-60分钟'
      }
    ]
  },

  {
    roleId: 'security-expert',
    scenario: 'incident-response',
    steps: [
      {
        id: 'ir-expert-1',
        name: '分析攻击手法',
        description: '深入分析攻击者的手法和意图',
        type: 'ai-suggest',
        skillId: 'attack-analysis',
        estimatedDuration: '30-60分钟'
      },
      {
        id: 'ir-expert-2',
        name: '评估影响范围',
        description: '评估事件对系统和数据的潜在影响',
        type: 'manual',
        dependsOn: ['ir-expert-1'],
        notifyRoles: ['ciso', 'privacy-officer'],
        estimatedDuration: '15-30分钟'
      },
      {
        id: 'ir-expert-3',
        name: '提供技术指导',
        description: '为响应团队提供技术指导和建议',
        type: 'manual',
        dependsOn: ['ir-expert-2'],
        estimatedDuration: '持续'
      },
      {
        id: 'ir-expert-4',
        name: '建议缓解策略',
        description: '建议和验证技术缓解策略',
        type: 'ai-suggest',
        skillId: 'mitigation-advisor',
        dependsOn: ['ir-expert-3'],
        estimatedDuration: '30-60分钟'
      }
    ]
  },
  {
    roleId: 'security-expert',
    scenario: 'vulnerability-management',
    steps: [
      {
        id: 'vm-expert-1',
        name: '发现和识别漏洞',
        description: '通过扫描和分析发现系统和应用漏洞',
        type: 'auto',
        skillId: 'vuln-scanner',
        estimatedDuration: '1-4小时'
      },
      {
        id: 'vm-expert-2',
        name: '分析漏洞严重性',
        description: '分析CVSS评分和实际业务影响',
        type: 'ai-suggest',
        skillId: 'vuln-severity',
        dependsOn: ['vm-expert-1'],
        estimatedDuration: '15-30分钟'
      },
      {
        id: 'vm-expert-3',
        name: '验证漏洞存在',
        description: '手动验证漏洞的真实性和可利用性',
        type: 'manual',
        dependsOn: ['vm-expert-2'],
        estimatedDuration: '30-60分钟'
      },
      {
        id: 'vm-expert-4',
        name: '提供修复建议',
        description: '提供详细的修复建议和最佳实践',
        type: 'ai-suggest',
        skillId: 'remediation-advisor',
        dependsOn: ['vm-expert-3'],
        estimatedDuration: '15-30分钟'
      }
    ]
  },
  {
    roleId: 'security-expert',
    scenario: 'threat-response',
    steps: [
      {
        id: 'tr-expert-1',
        name: '分析威胁情报',
        description: '分析和解读威胁情报源数据',
        type: 'ai-suggest',
        skillId: 'threat-intel',
        estimatedDuration: '30-60分钟'
      },
      {
        id: 'tr-expert-2',
        name: '识别攻击模式',
        description: '识别已知的攻击模式和TTPs',
        type: 'auto',
        skillId: 'attack-patterns',
        dependsOn: ['tr-expert-1'],
        estimatedDuration: '15-30分钟'
      },
      {
        id: 'tr-expert-3',
        name: '评估威胁能力',
        description: '评估威胁行为者的能力和意图',
        type: 'ai-suggest',
        skillId: 'threat-capability',
        dependsOn: ['tr-expert-2'],
        estimatedDuration: '30-60分钟'
      },
      {
        id: 'tr-expert-4',
        name: '制定响应策略',
        description: '制定针对性的威胁响应策略',
        type: 'manual',
        dependsOn: ['tr-expert-3'],
        notifyRoles: ['secuclaw-commander', 'ciso'],
        estimatedDuration: '1-2小时'
      }
    ]
  },
  {
    roleId: 'security-expert',
    scenario: 'supply-chain-incident',
    steps: [
      {
        id: 'sci-expert-1',
        name: '分析漏洞影响',
        description: '分析第三方组件漏洞对系统的影响',
        type: 'ai-suggest',
        skillId: 'dependency-analysis',
        estimatedDuration: '30-60分钟'
      },
      {
        id: 'sci-expert-2',
        name: '评估攻击向量',
        description: '评估可能的攻击向量和利用条件',
        type: 'manual',
        dependsOn: ['sci-expert-1'],
        estimatedDuration: '30-60分钟'
      },
      {
        id: 'sci-expert-3',
        name: '建议缓解措施',
        description: '建议技术缓解措施和替代方案',
        type: 'ai-suggest',
        skillId: 'mitigation-strategies',
        dependsOn: ['sci-expert-2'],
        estimatedDuration: '30-60分钟'
      },
      {
        id: 'sci-expert-4',
        name: '验证漏洞存在',
        description: '验证系统中是否存在该漏洞',
        type: 'auto',
        skillId: 'vuln-verification',
        dependsOn: ['sci-expert-3'],
        estimatedDuration: '15-30分钟'
      }
    ]
  },

  {
    roleId: 'ciso',
    scenario: 'incident-response',
    steps: [
      {
        id: 'ir-ciso-1',
        name: '审批响应计划',
        description: '审批安全事件响应计划和资源分配',
        type: 'manual',
        dependsOn: [],
        notifyRoles: ['secuclaw-commander'],
        estimatedDuration: '15-30分钟'
      },
      {
        id: 'ir-ciso-2',
        name: '协调跨部门合作',
        description: '协调IT、法务、公关等跨部门合作',
        type: 'manual',
        dependsOn: ['ir-ciso-1'],
        estimatedDuration: '持续'
      },
      {
        id: 'ir-ciso-3',
        name: '向管理层汇报',
        description: '准备并向高层管理层汇报事件状态',
        type: 'manual',
        dependsOn: ['ir-ciso-2'],
        estimatedDuration: '30-60分钟'
      },
      {
        id: 'ir-ciso-4',
        name: '评估业务影响',
        description: '评估事件对业务的潜在影响和风险',
        type: 'ai-suggest',
        skillId: 'business-impact',
        dependsOn: ['ir-ciso-3'],
        estimatedDuration: '30-60分钟'
      }
    ]
  },
  {
    roleId: 'ciso',
    scenario: 'vulnerability-management',
    steps: [
      {
        id: 'vm-ciso-1',
        name: '审批修复计划',
        description: '审批漏洞修复计划和优先级',
        type: 'manual',
        dependsOn: [],
        estimatedDuration: '15-30分钟'
      },
      {
        id: 'vm-ciso-2',
        name: '确定优先级',
        description: '基于业务风险确定修复优先级',
        type: 'manual',
        dependsOn: ['vm-ciso-1'],
        estimatedDuration: '15-30分钟'
      },
      {
        id: 'vm-ciso-3',
        name: '分配修复资源',
        description: '分配人员和技术资源用于漏洞修复',
        type: 'manual',
        dependsOn: ['vm-ciso-2'],
        estimatedDuration: '15-30分钟'
      },
      {
        id: 'vm-ciso-4',
        name: '监控修复进度',
        description: '持续监控修复进度和合规性',
        type: 'auto',
        skillId: 'progress-monitor',
        dependsOn: ['vm-ciso-3'],
        estimatedDuration: '持续'
      }
    ]
  },
  {
    roleId: 'ciso',
    scenario: 'threat-response',
    steps: [
      {
        id: 'tr-ciso-1',
        name: '评估威胁影响',
        description: '评估威胁对组织的整体影响',
        type: 'ai-suggest',
        skillId: 'threat-impact',
        estimatedDuration: '15-30分钟'
      },
      {
        id: 'tr-ciso-2',
        name: '批准响应计划',
        description: '批准威胁响应计划和资源分配',
        type: 'manual',
        dependsOn: ['tr-ciso-1'],
        estimatedDuration: '15-30分钟'
      },
      {
        id: 'tr-ciso-3',
        name: '协调组织资源',
        description: '协调跨组织的安全资源和能力',
        type: 'manual',
        dependsOn: ['tr-ciso-2'],
        estimatedDuration: '持续'
      },
      {
        id: 'tr-ciso-4',
        name: '向高管汇报',
        description: '向高管层汇报威胁态势和响应行动',
        type: 'manual',
        dependsOn: ['tr-ciso-3'],
        estimatedDuration: '30-60分钟'
      }
    ]
  },
  {
    roleId: 'ciso',
    scenario: 'compliance-audit',
    steps: [
      {
        id: 'ca-ciso-1',
        name: '审批审计计划',
        description: '审批合规审计计划和范围',
        type: 'manual',
        dependsOn: [],
        estimatedDuration: '15-30分钟'
      },
      {
        id: 'ca-ciso-2',
        name: '分配审计资源',
        description: '分配人员和资源支持审计活动',
        type: 'manual',
        dependsOn: ['ca-ciso-1'],
        estimatedDuration: '15-30分钟'
      },
      {
        id: 'ca-ciso-3',
        name: '批准审计报告',
        description: '审阅和批准最终的审计报告',
        type: 'manual',
        dependsOn: ['ca-ciso-2'],
        estimatedDuration: '30-60分钟'
      },
      {
        id: 'ca-ciso-4',
        name: '监督整改执行',
        description: '监督和跟踪审计发现问题的整改',
        type: 'auto',
        skillId: 'remediation-tracker',
        dependsOn: ['ca-ciso-3'],
        estimatedDuration: '持续'
      }
    ]
  },
  {
    roleId: 'ciso',
    scenario: 'supply-chain-incident',
    steps: [
      {
        id: 'sci-ciso-1',
        name: '审批响应计划',
        description: '审批供应链事件响应计划',
        type: 'manual',
        dependsOn: [],
        notifyRoles: ['secuclaw-commander'],
        estimatedDuration: '15-30分钟'
      },
      {
        id: 'sci-ciso-2',
        name: '协调组织资源',
        description: '协调组织资源和第三方响应',
        type: 'manual',
        dependsOn: ['sci-ciso-1'],
        estimatedDuration: '持续'
      },
      {
        id: 'sci-ciso-3',
        name: '做出关键决策',
        description: '做出停止使用、隔离等关键决策',
        type: 'manual',
        dependsOn: ['sci-ciso-2'],
        estimatedDuration: '15-30分钟'
      },
      {
        id: 'sci-ciso-4',
        name: '向管理层汇报',
        description: '向高层管理层汇报供应链事件',
        type: 'manual',
        dependsOn: ['sci-ciso-3'],
        estimatedDuration: '30-60分钟'
      }
    ]
  },

  {
    roleId: 'privacy-officer',
    scenario: 'compliance-audit',
    steps: [
      {
        id: 'ca-po-1',
        name: '执行合规检查',
        description: '执行GDPR、CCPA等法规合规性检查',
        type: 'ai-suggest',
        skillId: 'compliance-check',
        estimatedDuration: '1-2天'
      },
      {
        id: 'ca-po-2',
        name: '准备审计证据',
        description: '收集和整理合规审计所需证据',
        type: 'manual',
        dependsOn: ['ca-po-1'],
        estimatedDuration: '1-2天'
      },
      {
        id: 'ca-po-3',
        name: '撰写合规报告',
        description: '撰写详细的合规审计报告',
        type: 'manual',
        dependsOn: ['ca-po-2'],
        estimatedDuration: '1-2天'
      },
      {
        id: 'ca-po-4',
        name: '跟踪整改行动',
        description: '跟踪和验证整改措施的执行',
        type: 'auto',
        skillId: 'action-tracker',
        dependsOn: ['ca-po-3'],
        estimatedDuration: '持续'
      }
    ]
  },

  {
    roleId: 'security-architect',
    scenario: 'vulnerability-management',
    steps: [
      {
        id: 'vm-arch-1',
        name: '评估架构漏洞',
        description: '评估漏洞在系统架构层面的影响',
        type: 'manual',
        dependsOn: [],
        estimatedDuration: '30-60分钟'
      },
      {
        id: 'vm-arch-2',
        name: '设计缓解方案',
        description: '设计架构级别的漏洞缓解方案',
        type: 'ai-suggest',
        skillId: 'mitigation-design',
        dependsOn: ['vm-arch-1'],
        estimatedDuration: '1-2小时'
      },
      {
        id: 'vm-arch-3',
        name: '审查补丁策略',
        description: '审查补丁策略对架构的影响',
        type: 'manual',
        dependsOn: ['vm-arch-2'],
        estimatedDuration: '30-60分钟'
      },
      {
        id: 'vm-arch-4',
        name: '规划架构改进',
        description: '规划长期的架构安全改进',
        type: 'manual',
        dependsOn: ['vm-arch-3'],
        notifyRoles: ['ciso'],
        estimatedDuration: '2-4小时'
      }
    ]
  },
  {
    roleId: 'security-architect',
    scenario: 'compliance-audit',
    steps: [
      {
        id: 'ca-arch-1',
        name: '评估控制设计',
        description: '评估安全控制的设计有效性',
        type: 'manual',
        dependsOn: [],
        estimatedDuration: '1-2小时'
      },
      {
        id: 'ca-arch-2',
        name: '审查架构合规',
        description: '审查系统架构是否符合合规要求',
        type: 'manual',
        dependsOn: ['ca-arch-1'],
        estimatedDuration: '1-2小时'
      },
      {
        id: 'ca-arch-3',
        name: '建议控制改进',
        description: '建议安全控制的改进方案',
        type: 'ai-suggest',
        skillId: 'control-improvement',
        dependsOn: ['ca-arch-2'],
        estimatedDuration: '1-2小时'
      },
      {
        id: 'ca-arch-4',
        name: '参与技术审计',
        description: '参与技术层面的合规审计',
        type: 'manual',
        dependsOn: ['ca-arch-3'],
        estimatedDuration: '1-2天'
      }
    ]
  },

  {
    roleId: 'supply-chain-security',
    scenario: 'supply-chain-incident',
    steps: [
      {
        id: 'sci-scs-1',
        name: '发现供应链威胁',
        description: '通过监控和情报发现供应链威胁',
        type: 'auto',
        skillId: 'supply-chain-monitor',
        estimatedDuration: '持续'
      },
      {
        id: 'sci-scs-2',
        name: '评估第三方风险',
        description: '评估第三方供应商的风险等级',
        type: 'ai-suggest',
        skillId: 'vendor-risk-assessment',
        dependsOn: ['sci-scs-1'],
        estimatedDuration: '30-60分钟'
      },
      {
        id: 'sci-scs-3',
        name: '更新依赖清单',
        description: '更新和维护软件依赖和供应商清单',
        type: 'manual',
        dependsOn: ['sci-scs-2'],
        estimatedDuration: '30-60分钟'
      },
      {
        id: 'sci-scs-4',
        name: '通知受影响方',
        description: '通知所有受影响的内部和外部方',
        type: 'manual',
        dependsOn: ['sci-scs-3'],
        notifyRoles: ['ciso', 'security-ops'],
        estimatedDuration: '30-60分钟'
      }
    ]
  },
  {
    roleId: 'supply-chain-security',
    scenario: 'vulnerability-management',
    steps: [
      {
        id: 'vm-scs-1',
        name: '检查第三方漏洞',
        description: '检查第三方组件的已知漏洞',
        type: 'auto',
        skillId: 'dependency-scanner',
        estimatedDuration: '1-2小时'
      },
      {
        id: 'vm-scs-2',
        name: '更新依赖清单',
        description: '更新软件物料清单(SBOM)',
        type: 'manual',
        dependsOn: ['vm-scs-1'],
        estimatedDuration: '30-60分钟'
      },
      {
        id: 'vm-scs-3',
        name: '通知供应商修复',
        description: '联系并要求供应商修复漏洞',
        type: 'manual',
        dependsOn: ['vm-scs-2'],
        estimatedDuration: '1-2小时'
      },
      {
        id: 'vm-scs-4',
        name: '评估供应链风险',
        description: '评估漏洞对整个供应链的影响',
        type: 'ai-suggest',
        skillId: 'supply-chain-risk',
        dependsOn: ['vm-scs-3'],
        notifyRoles: ['ciso'],
        estimatedDuration: '30-60分钟'
      }
    ]
  }
];

export function getWorkflowForRole(roleId: RoleId, scenario: ScenarioType): WorkflowStep[] {
  const workflow = ROLE_WORKFLOWS.find(w => w.roleId === roleId && w.scenario === scenario);
  return workflow ? workflow.steps : [];
}

export function getAllWorkflowsForRole(roleId: RoleId): Array<{
  scenario: ScenarioType;
  steps: WorkflowStep[];
}> {
  return ROLE_WORKFLOWS
    .filter(w => w.roleId === roleId)
    .map(w => ({
      scenario: w.scenario,
      steps: w.steps,
    }));
}

export function getAllWorkflowsForScenario(scenario: ScenarioType): Array<{
  roleId: RoleId;
  steps: WorkflowStep[];
}> {
  return ROLE_WORKFLOWS
    .filter(w => w.scenario === scenario)
    .map(w => ({
      roleId: w.roleId,
      steps: w.steps,
    }));
}
