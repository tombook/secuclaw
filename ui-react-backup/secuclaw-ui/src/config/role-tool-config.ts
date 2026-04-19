/**
 * SecuClaw 角色工具配置
 * 定义 8 个角色 × 工具矩阵
 *
 * @see v2.0 文档 第 2 章 角色建模 & 第 3.6 节 工具栏
 */

// ─── Types ────────────────────────────────────────────────────

export type RoleId =
  | 'security-expert'
  | 'privacy-officer'
  | 'security-architect'
  | 'business-security-officer'
  | 'secuclaw-commander'
  | 'ciso'
  | 'security-ops'
  | 'supply-chain-security';

export interface ToolDef {
  id: string;
  label: string;
  icon: string;         // Lucide icon name
  badge?: number;       // 待办数量，动态更新
  priority: number;     // 1=最高，决定排序
}

export interface RoleToolConfig {
  roleId: RoleId;
  label: string;
  coreTools: ToolDef[];       // ≤ 5 个，直接显示
  secondaryTools: ToolDef[];  // 折叠在"更多"
}

// ─── Tool Definitions ─────────────────────────────────────────

const TOOLS = {
  // security-expert
  vulnerabilityScan:    { id: 'vuln-scan',        label: '漏洞扫描',    icon: 'ShieldAlert',      priority: 1 },
  threatIntel:          { id: 'threat-intel',     label: '威胁情报',    icon: 'Radio',            priority: 2 },
  siemQuery:            { id: 'siem-query',       label: 'SIEM 查询',   icon: 'Search',           priority: 3 },
  penetrationTest:      { id: 'pen-test',         label: '渗透测试',    icon: 'Bug',              priority: 4 },
  patchManagement:      { id: 'patch-mgmt',       label: '补丁管理',    icon: 'PackageCheck',     priority: 5 },
  cveDetail:            { id: 'cve-detail',       label: 'CVE 详情',    icon: 'FileSearch',       priority: 6 },
  pocLibrary:           { id: 'poc-lib',          label: 'PoC 库',      icon: 'BookOpen',         priority: 7 },
  assetCorrelation:     { id: 'asset-corr',       label: '资产关联',    icon: 'Link2',            priority: 8 },
  emailNotify:          { id: 'email-notify',     label: '邮件通知',    icon: 'Mail',             priority: 9 },

  // privacy-officer
  complianceCheck:      { id: 'compliance-chk',   label: '合规检查',    icon: 'FileCheck',        priority: 1 },
  dataMap:              { id: 'data-map',         label: '数据地图',    icon: 'Map',              priority: 2 },
  dpiaTool:             { id: 'dpia',             label: 'DPIA 工具',   icon: 'ClipboardCheck',   priority: 3 },
  privacyRequest:       { id: 'privacy-req',      label: '隐私请求',    icon: 'UserCheck',        priority: 4 },
  gdprAudit:            { id: 'gdpr-audit',       label: 'GDPR 审计',   icon: 'ScrollText',       priority: 5 },
  consentMgmt:          { id: 'consent-mgmt',     label: '同意管理',    icon: 'ThumbsUp',         priority: 6 },
  cookieAudit:          { id: 'cookie-audit',     label: 'Cookie 审计', icon: 'Cookie',           priority: 7 },
  dataDeletion:         { id: 'data-deletion',    label: '数据删除',    icon: 'Trash2',           priority: 8 },
  dataSubjectRights:    { id: 'dsr',              label: '数据主体权利', icon: 'Shield',           priority: 9 },

  // security-architect
  threatModeling:       { id: 'threat-model',     label: '威胁建模',    icon: 'AlertTriangle',    priority: 1 },
  archDrawing:          { id: 'arch-draw',        label: '架构绘图',    icon: 'PenTool',          priority: 2 },
  iamConfig:            { id: 'iam-config',       label: 'IAM 配置',    icon: 'KeyRound',         priority: 3 },
  zeroTrustEval:        { id: 'zero-trust',       label: '零信任评估',  icon: 'Fingerprint',      priority: 4 },
  controlLibrary:       { id: 'control-lib',      label: '控制库',      icon: 'Database',         priority: 5 },
  defenseInDepth:       { id: 'defense-depth',    label: '防御纵深图',  icon: 'Layers',           priority: 6 },
  securityBaseline:     { id: 'sec-baseline',     label: '安全基线',    icon: 'Ruler',            priority: 7 },
  controlMapping:       { id: 'control-map',      label: '控制映射',    icon: 'GitBranch',        priority: 8 },
  changeApproval:       { id: 'change-approval',  label: '变更审批',    icon: 'CheckCircle',      priority: 9 },

  // business-security-officer
  bcpManagement:        { id: 'bcp-mgmt',         label: 'BCP 管理',    icon: 'ShieldCheck',      priority: 1 },
  recoveryDrill:        { id: 'recovery-drill',   label: '恢复演练',    icon: 'RotateCcw',        priority: 2 },
  costCalculation:      { id: 'cost-calc',        label: '成本计算',    icon: 'Calculator',       priority: 3 },
  reportGeneration:     { id: 'report-gen',       label: '报表生成',    icon: 'FileBarChart',     priority: 4 },
  insuranceMgmt:        { id: 'insurance-mgmt',   label: '保险管理',    icon: 'Landmark',         priority: 5 },
  impactAnalysis:       { id: 'impact-analysis',  label: '影响分析',    icon: 'TrendingDown',     priority: 6 },
  drPlan:               { id: 'dr-plan',          label: '灾难恢复计划', icon: 'FileText',         priority: 7 },
  budgetTracking:       { id: 'budget-track',     label: '预算追踪',    icon: 'Wallet',           priority: 8 },
  roiDashboard:         { id: 'roi-dash',         label: 'ROI 仪表盘',  icon: 'TrendingUp',       priority: 9 },

  // secuclaw-commander
  globalSituation:      { id: 'global-situation',  label: '全域态势',    icon: 'Globe',           priority: 1 },
  raciPanel:            { id: 'raci-panel',        label: 'RACI 面板',   icon: 'Users',           priority: 2 },
  escalationChannel:    { id: 'escalation',        label: '升级通道',    icon: 'ArrowUpCircle',   priority: 3 },
  commanderBrief:       { id: 'commander-brief',   label: '指挥官通报',  icon: 'Megaphone',       priority: 4 },
  aiDispatch:           { id: 'ai-dispatch',       label: 'AI 调度',     icon: 'Bot',             priority: 5 },
  crossDomainCorr:      { id: 'cross-domain',      label: '跨域关联',    icon: 'Network',         priority: 6 },
  eventTimeline:        { id: 'event-timeline',    label: '事件时间线',  icon: 'Clock',           priority: 7 },
  resourceAllocation:   { id: 'resource-alloc',    label: '资源调配',    icon: 'Settings2',       priority: 8 },
  statutoryReport:      { id: 'statutory-report',  label: '法定报告',    icon: 'Scale',           priority: 9 },

  // ciso
  riskScoreboard:       { id: 'risk-score',        label: '风险评分板',  icon: 'BarChart3',       priority: 1 },
  kpiTracking:          { id: 'kpi-track',         label: 'KPI 追踪',   icon: 'Target',          priority: 2 },
  budgetDashboard:      { id: 'budget-dash',       label: '预算仪表盘',  icon: 'PiggyBank',       priority: 3 },
  boardReport:          { id: 'board-report',      label: '董事会报告',  icon: 'FileText',        priority: 4 },
  governanceDoc:        { id: 'gov-doc',           label: '治理文档',    icon: 'BookMarked',      priority: 5 },
  riskRegister:         { id: 'risk-register',     label: '风险登记',    icon: 'ListChecks',      priority: 6 },
  policyMgmt:           { id: 'policy-mgmt',       label: '策略管理',    icon: 'FileCode',        priority: 7 },
  complianceGap:        { id: 'compliance-gap',    label: '合规差距',    icon: 'AlertCircle',     priority: 8 },
  vendorAssessment:     { id: 'vendor-assess',     label: '供应商评估',  icon: 'Building2',       priority: 9 },

  // security-ops
  alertQueue:           { id: 'alert-queue',       label: '告警队列',    icon: 'BellRing',        priority: 1 },
  incidentMgmt:         { id: 'incident-mgmt',     label: '事件管理',    icon: 'Siren',           priority: 2 },
  soarPlaybook:         { id: 'soar-playbook',     label: 'SOAR 剧本',   icon: 'Play',            priority: 3 },
  banMgmt:              { id: 'ban-mgmt',          label: '封禁管理',    icon: 'Ban',             priority: 4 },
  logAnalysis:          { id: 'log-analysis',      label: '日志分析',    icon: 'ScrollText',      priority: 5 },
  enrichIntel:          { id: 'enrich-intel',      label: 'Enrich 情报', icon: 'SearchCode',      priority: 6 },
  virusScan:            { id: 'virus-scan',        label: '病毒查杀',    icon: 'ShieldOff',       priority: 7 },
  sessionAnalysis:      { id: 'session-analysis',  label: '会话分析',    icon: 'Wifi',            priority: 8 },
  ticketFlow:           { id: 'ticket-flow',       label: '工单流转',    icon: 'ArrowRightLeft',  priority: 9 },

  // supply-chain-security
  sbomScan:             { id: 'sbom-scan',         label: 'SBOM 扫描',    icon: 'PackageSearch',  priority: 1 },
  vendorEval:           { id: 'vendor-eval',       label: '供应商评估',   icon: 'Building',       priority: 2 },
  thirdPartyRisk:       { id: 'third-party-risk',  label: '第三方风险',   icon: 'UsersRound',     priority: 3 },
  contractReview:       { id: 'contract-review',   label: '合同审查',     icon: 'FileCheck2',     priority: 4 },
  scMonitorAlert:       { id: 'sc-monitor',        label: '监控告警',     icon: 'Eye',            priority: 5 },
  ossAudit:             { id: 'oss-audit',         label: '开源组件审查', icon: 'Code',           priority: 6 },
  licenseCompliance:    { id: 'license-comply',    label: '许可证合规',   icon: 'Stamp',          priority: 7 },
  vendorTiering:        { id: 'vendor-tier',       label: '供应商分级',   icon: 'Star',           priority: 8 },
  continuousMonitor:    { id: 'continuous-mon',    label: '持续监控',     icon: 'Activity',       priority: 9 },
} as const;

// ─── Role × Tool Matrix ───────────────────────────────────────

export const ROLE_TOOL_CONFIGS: Record<RoleId, RoleToolConfig> = {
  'security-expert': {
    roleId: 'security-expert',
    label: '安全专家',
    coreTools: [
      TOOLS.vulnerabilityScan,
      TOOLS.threatIntel,
      TOOLS.siemQuery,
      TOOLS.penetrationTest,
      TOOLS.patchManagement,
    ],
    secondaryTools: [
      TOOLS.cveDetail,
      TOOLS.pocLibrary,
      TOOLS.assetCorrelation,
      TOOLS.emailNotify,
    ],
  },

  'privacy-officer': {
    roleId: 'privacy-officer',
    label: '隐私官',
    coreTools: [
      TOOLS.complianceCheck,
      TOOLS.dataMap,
      TOOLS.dpiaTool,
      TOOLS.privacyRequest,
      TOOLS.gdprAudit,
    ],
    secondaryTools: [
      TOOLS.consentMgmt,
      TOOLS.cookieAudit,
      TOOLS.dataDeletion,
      TOOLS.dataSubjectRights,
    ],
  },

  'security-architect': {
    roleId: 'security-architect',
    label: '安全架构师',
    coreTools: [
      TOOLS.threatModeling,
      TOOLS.archDrawing,
      TOOLS.iamConfig,
      TOOLS.zeroTrustEval,
      TOOLS.controlLibrary,
    ],
    secondaryTools: [
      TOOLS.defenseInDepth,
      TOOLS.securityBaseline,
      TOOLS.controlMapping,
      TOOLS.changeApproval,
    ],
  },

  'business-security-officer': {
    roleId: 'business-security-officer',
    label: '业务安全官',
    coreTools: [
      TOOLS.bcpManagement,
      TOOLS.recoveryDrill,
      TOOLS.costCalculation,
      TOOLS.reportGeneration,
      TOOLS.insuranceMgmt,
    ],
    secondaryTools: [
      TOOLS.impactAnalysis,
      TOOLS.drPlan,
      TOOLS.budgetTracking,
      TOOLS.roiDashboard,
    ],
  },

  'secuclaw-commander': {
    roleId: 'secuclaw-commander',
    label: '安全指挥官',
    coreTools: [
      TOOLS.globalSituation,
      TOOLS.raciPanel,
      TOOLS.escalationChannel,
      TOOLS.aiDispatch,
      TOOLS.commanderBrief,
    ],
    secondaryTools: [
      TOOLS.crossDomainCorr,
      TOOLS.eventTimeline,
      TOOLS.resourceAllocation,
      TOOLS.statutoryReport,
    ],
  },

  'ciso': {
    roleId: 'ciso',
    label: 'CISO',
    coreTools: [
      TOOLS.riskScoreboard,
      TOOLS.kpiTracking,
      TOOLS.budgetDashboard,
      TOOLS.boardReport,
      TOOLS.governanceDoc,
    ],
    secondaryTools: [
      TOOLS.riskRegister,
      TOOLS.policyMgmt,
      TOOLS.complianceGap,
      TOOLS.vendorAssessment,
    ],
  },

  'security-ops': {
    roleId: 'security-ops',
    label: '安全运营',
    coreTools: [
      TOOLS.alertQueue,
      TOOLS.incidentMgmt,
      TOOLS.soarPlaybook,
      TOOLS.banMgmt,
      TOOLS.logAnalysis,
    ],
    secondaryTools: [
      TOOLS.enrichIntel,
      TOOLS.virusScan,
      TOOLS.sessionAnalysis,
      TOOLS.ticketFlow,
    ],
  },

  'supply-chain-security': {
    roleId: 'supply-chain-security',
    label: '供应链安全',
    coreTools: [
      TOOLS.sbomScan,
      TOOLS.vendorEval,
      TOOLS.thirdPartyRisk,
      TOOLS.contractReview,
      TOOLS.scMonitorAlert,
    ],
    secondaryTools: [
      TOOLS.ossAudit,
      TOOLS.licenseCompliance,
      TOOLS.vendorTiering,
      TOOLS.continuousMonitor,
    ],
  },
};

// ─── Helpers ──────────────────────────────────────────────────

/** 获取角色的核心工具列表（已排序） */
export function getCoreTools(roleId: RoleId): ToolDef[] {
  return ROLE_TOOL_CONFIGS[roleId]?.coreTools ?? [];
}

/** 获取角色的全部工具（核心 + 次级） */
export function getAllTools(roleId: RoleId): ToolDef[] {
  const config = ROLE_TOOL_CONFIGS[roleId];
  if (!config) return [];
  return [...config.coreTools, ...config.secondaryTools];
}

/** 按 ID 查找工具定义 */
export function findToolById(toolId: string): ToolDef | undefined {
  return Object.values(TOOLS).find(t => t.id === toolId);
}

/** 所有角色 ID 列表 */
export const ALL_ROLE_IDS: RoleId[] = [
  'security-expert',
  'privacy-officer',
  'security-architect',
  'business-security-officer',
  'secuclaw-commander',
  'ciso',
  'security-ops',
  'supply-chain-security',
];
