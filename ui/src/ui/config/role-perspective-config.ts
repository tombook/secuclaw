import type { RoleId } from '../store/role-context.js';

export type DataType = 'incidents' | 'threats' | 'vulnerabilities';

export interface PerspectiveConfig {
  focusFields: string[];
  highlightKeywords: string[];
  summary: string;
}

export interface RolePerspectiveConfig {
  incidents: PerspectiveConfig;
  threats: PerspectiveConfig;
  vulnerabilities: PerspectiveConfig;
}

export const ROLE_PERSPECTIVE_CONFIG: Record<RoleId, RolePerspectiveConfig> = {
  'security-expert': {
    incidents: {
      focusFields: ['attackTechnique', 'ttp', 'vulnerabilityDetails', 'remediation', 'exploitationMethod'],
      highlightKeywords: ['攻击技术', 'TTP', '漏洞详情', '利用', '缓解', '攻击路径', '漏洞利用'],
      summary: '专注于攻击手法、技术细节和漏洞分析'
    },
    threats: {
      focusFields: ['attackPattern', 'mitigationTechniques', 'threatBehavior', 'technicalAnalysis'],
      highlightKeywords: ['攻击模式', '缓解技术', '威胁行为', '技术分析', '攻击向量'],
      summary: '关注威胁的技术特征和攻击模式'
    },
    vulnerabilities: {
      focusFields: ['severity', 'exploitability', 'impact', 'patchInfo', 'technicalDetails'],
      highlightKeywords: ['严重性', '可利用性', '影响', '补丁信息', '技术细节'],
      summary: '聚焦漏洞的技术分析和修复方案'
    }
  },
  'ciso': {
    incidents: {
      focusFields: ['businessImpact', 'complianceRisk', 'budgetImpact', 'boardReport', 'strategicImplications'],
      highlightKeywords: ['业务影响', '合规风险', '预算影响', '董事会报告', '战略影响', '组织风险'],
      summary: '关注业务影响、合规风险和战略决策'
    },
    threats: {
      focusFields: ['organizationalRisk', 'strategicAlignment', 'resourceRequirements', 'governanceImpact'],
      highlightKeywords: ['组织风险', '战略对齐', '资源需求', '治理影响', '管理决策'],
      summary: '从管理和战略角度评估威胁'
    },
    vulnerabilities: {
      focusFields: ['riskScore', 'complianceImpact', 'remediationPriority', 'resourcePlanning'],
      highlightKeywords: ['风险评分', '合规影响', '修复优先级', '资源规划', '管理决策'],
      summary: '基于风险优先级和管理视角评估漏洞'
    }
  },
  'security-ops': {
    incidents: {
      focusFields: ['responseActions', 'affectedSystems', 'iocIndicators', 'timeline', 'containmentSteps'],
      highlightKeywords: ['响应行动', '受影响系统', 'IOC', '时间线', '遏制步骤', '操作流程', 'SOC'],
      summary: '关注事件响应流程、系统状态和操作指标'
    },
    threats: {
      focusFields: ['detectionMethods', 'responseProcedures', 'systemImpact', 'operationalMitigation'],
      highlightKeywords: ['检测方法', '响应程序', '系统影响', '操作缓解', '监控指标'],
      summary: '专注于威胁的检测和运营响应'
    },
    vulnerabilities: {
      focusFields: ['patchDeployment', 'systemAvailability', 'remediationTimeline', 'verificationSteps'],
      highlightKeywords: ['补丁部署', '系统可用性', '修复时间线', '验证步骤', '操作影响'],
      summary: '关注漏洞修复的操作执行和系统影响'
    }
  },
  'secuclaw-commander': {
    incidents: {
      focusFields: ['globalCoordination', 'resourceAllocation', 'priorityOrdering', 'crossTeamSync'],
      highlightKeywords: ['全局协调', '资源分配', '优先级排序', '跨团队同步', '指挥决策'],
      summary: '从全局指挥角度协调资源和行动'
    },
    threats: {
      focusFields: ['strategicThreatLevel', 'organizationalReadiness', 'coordinationRequirements'],
      highlightKeywords: ['战略威胁等级', '组织就绪状态', '协调需求', '指挥决策'],
      summary: '评估威胁的战略影响和协调需求'
    },
    vulnerabilities: {
      focusFields: ['organizationalRisk', 'remediationPrioritization', 'resourceCoordination'],
      highlightKeywords: ['组织风险', '修复优先级', '资源协调', '战略决策'],
      summary: '从组织层面管理漏洞和资源分配'
    }
  },
  'privacy-officer': {
    incidents: {
      focusFields: ['dataBreachScope', 'privacyRisk', 'complianceImpact', 'dataSubjectsAffected'],
      highlightKeywords: ['数据泄露范围', '隐私风险', '合规影响', '受影响数据主体', '个人信息'],
      summary: '关注数据泄露的隐私影响和合规性'
    },
    threats: {
      focusFields: ['privacyImpact', 'dataClassification', 'regulatoryImplications'],
      highlightKeywords: ['隐私影响', '数据分类', '监管影响', '合规要求', 'GDPR', 'PIPL'],
      summary: '评估威胁对隐私和数据保护的冲击'
    },
    vulnerabilities: {
      focusFields: ['personalDataExposure', 'privacyCompliance', 'dataProtectionMeasures'],
      highlightKeywords: ['个人信息暴露', '隐私合规', '数据保护措施', '合规风险'],
      summary: '关注漏洞对个人数据隐私的影响'
    }
  },
  'security-architect': {
    incidents: {
      focusFields: ['architectureWeakness', 'attackPath', 'designFlaw', 'architecturalRootCause'],
      highlightKeywords: ['架构弱点', '攻击路径', '设计缺陷', '架构根因', '安全架构'],
      summary: '分析事件背后的架构问题和设计缺陷'
    },
    threats: {
      focusFields: ['architecturalVulnerability', 'designPattern', 'securityControlEffectiveness'],
      highlightKeywords: ['架构漏洞', '设计模式', '安全控制有效性', '架构安全'],
      summary: '从架构层面评估威胁和控制措施'
    },
    vulnerabilities: {
      focusFields: ['architecturalImpact', 'designRootCause', 'architecturalRemediation'],
      highlightKeywords: ['架构影响', '设计根因', '架构修复', '设计改进'],
      summary: '识别漏洞的架构根本原因和改进方案'
    }
  },
  'business-security-officer': {
    incidents: {
      focusFields: ['businessContinuity', 'operationalImpact', 'recoveryTime', 'serviceAvailability'],
      highlightKeywords: ['业务连续性', '运营影响', '恢复时间', '服务可用性', '业务中断'],
      summary: '关注事件对业务运营和连续性的影响'
    },
    threats: {
      focusFields: ['businessRisk', 'operationalDisruption', 'financialImpact', 'recoveryPlanning'],
      highlightKeywords: ['业务风险', '运营中断', '财务影响', '恢复规划', '业务连续性'],
      summary: '评估威胁对业务运营和财务的影响'
    },
    vulnerabilities: {
      focusFields: ['businessImpact', 'recoveryRequirements', 'operationalRisk'],
      highlightKeywords: ['业务影响', '恢复需求', '运营风险', '业务连续性'],
      summary: '分析漏洞对业务运营和连续性的影响'
    }
  },
  'supply-chain-security': {
    incidents: {
      focusFields: ['supplyChainImpact', 'thirdPartyRisk', 'dependencyRisk', 'vendorCompromise'],
      highlightKeywords: ['供应链影响', '第三方风险', '依赖风险', '供应商被入侵', '供应链安全'],
      summary: '关注事件对供应链和第三方的影响'
    },
    threats: {
      focusFields: ['supplyChainVulnerability', 'thirdPartyExposure', 'dependencyAnalysis'],
      highlightKeywords: ['供应链漏洞', '第三方暴露', '依赖分析', '供应链威胁'],
      summary: '评估威胁对供应链和依赖的影响'
    },
    vulnerabilities: {
      focusFields: ['supplyChainRisk', 'thirdPartyVulnerability', 'dependencyManagement'],
      highlightKeywords: ['供应链风险', '第三方漏洞', '依赖管理', '供应链安全'],
      summary: '关注供应链中的漏洞和第三方风险'
    }
  }
};

export function getPerspectiveConfig(roleId: RoleId, dataType: DataType): PerspectiveConfig {
  return ROLE_PERSPECTIVE_CONFIG[roleId]?.[dataType] || {
    focusFields: [],
    highlightKeywords: [],
    summary: '默认视角'
  };
}

export function getAllRolePerspectives(dataType: DataType): Array<{ roleId: RoleId; config: PerspectiveConfig }> {
  return Object.entries(ROLE_PERSPECTIVE_CONFIG).map(([roleId, config]) => ({
    roleId: roleId as RoleId,
    config: config[dataType]
  }));
}

export function compareRolePerspectives(role1: RoleId, role2: RoleId, dataType: DataType): {
  role1: PerspectiveConfig;
  role2: PerspectiveConfig;
  commonFields: string[];
  uniqueToRole1: string[];
  uniqueToRole2: string[];
} {
  const config1 = getPerspectiveConfig(role1, dataType);
  const config2 = getPerspectiveConfig(role2, dataType);

  const commonFields = config1.focusFields.filter(f => config2.focusFields.includes(f));
  const uniqueToRole1 = config1.focusFields.filter(f => !config2.focusFields.includes(f));
  const uniqueToRole2 = config2.focusFields.filter(f => !config1.focusFields.includes(f));

  return {
    role1: config1,
    role2: config2,
    commonFields,
    uniqueToRole1,
    uniqueToRole2
  };
}
