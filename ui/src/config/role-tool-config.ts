/**
 * SecuClaw 角色工具配置 v3.1
 * 基于 SKILL.md 安全能力重新设计分配
 * Phase 1A: secuclaw-commander 增加 bcp-mgmt 工具
 *
 * 设计原则:
 *   1. 每个 light 能力有对应工具支撑
 *   2. coreTools ≤ 5（高频），secondaryTools 低频/高级
 *   3. 第三方工具按角色 MITRE 覆盖匹配分配
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
  icon: string;
  badge?: number;
  priority: number;
}

export interface RoleToolConfig {
  roleId: RoleId;
  label: string;
  coreTools: ToolDef[];
  secondaryTools: ToolDef[];
}

// ─── Tool Definitions ─────────────────────────────────────────

const T = {
  // ─── 监控 & 运营 ────────────────────────
  alertQueue:        { id: 'alert-queue',      label: '告警队列',      icon: 'BellRing',     priority: 1 },
  soarExec:          { id: 'soar-exec',        label: 'SOAR 剧本',     icon: 'Play',         priority: 2 },
  logAnalysis:       { id: 'log-analysis',     label: '日志分析',      icon: 'ScrollText',   priority: 5 },
  incidentMgmt:      { id: 'incident-mgmt',    label: '事件管理',      icon: 'Siren',        priority: 2 },
  globalSituation:   { id: 'global-situation',  label: '全域态势',      icon: 'Globe',        priority: 1 },
  aiDispatch:        { id: 'ai-dispatch',      label: 'AI 调度',       icon: 'Bot',          priority: 5 },

  // ─── 风险 & 治理 ────────────────────────
  riskScore:         { id: 'risk-score',       label: '风险评分板',    icon: 'BarChart3',    priority: 1 },
  riskRegister:      { id: 'risk-register',    label: '风险登记册',    icon: 'ListChecks',   priority: 6 },
  kpiTrack:          { id: 'kpi-track',        label: 'KPI 追踪',      icon: 'Target',       priority: 2 },
  budgetDash:        { id: 'budget-dash',      label: '预算仪表盘',    icon: 'PiggyBank',    priority: 3 },
  boardReport:       { id: 'board-report',     label: '董事会报告',    icon: 'FileText',     priority: 4 },
  policyMgmt:        { id: 'policy-mgmt',      label: '策略管理',      icon: 'FileCode',     priority: 7 },
  reportGen:         { id: 'report-gen',       label: '报表生成',      icon: 'FileBarChart', priority: 4 },

  // ─── 合规 & 隐私 ────────────────────────
  complianceChk:     { id: 'compliance-chk',   label: '合规检查',      icon: 'FileCheck',    priority: 1 },
  gdprAudit:         { id: 'gdpr-audit',       label: 'GDPR 审计',     icon: 'ScrollText',   priority: 5 },
  dataMap:           { id: 'data-map',         label: '数据地图',      icon: 'Map',          priority: 2 },
  zeroTrust:         { id: 'zero-trust',       label: '零信任评估',    icon: 'Fingerprint',  priority: 4 },

  // ─── 漏洞 & 威胁 ────────────────────────
  vulnScan:          { id: 'vuln-scan',        label: '漏洞扫描',      icon: 'ShieldAlert',  priority: 1 },
  threatIntel:       { id: 'threat-intel',     label: '威胁情报',      icon: 'Radio',        priority: 2 },
  penTest:           { id: 'pen-test',         label: '渗透测试',      icon: 'Bug',          priority: 4 },
  patchMgmt:         { id: 'patch-mgmt',       label: '补丁管理',      icon: 'PackageCheck', priority: 5 },
  threatModel:       { id: 'threat-model',     label: '威胁建模',      icon: 'AlertTriangle',priority: 1 },

  // ─── 架构 & 云安全 ──────────────────────
  iamConfig:         { id: 'iam-config',       label: 'IAM 配置',      icon: 'KeyRound',     priority: 3 },
  cloudSecurity:     { id: 'cloud-security',   label: '云安全评估',    icon: 'Cloud',        priority: 5 },

  // ─── 业务连续性 ──────────────────────────
  bcpMgmt:           { id: 'bcp-mgmt',         label: 'BCP 管理',      icon: 'ShieldCheck',  priority: 1 },
  costCalc:          { id: 'cost-calc',        label: '成本计算',      icon: 'Calculator',   priority: 3 },

  // ─── 供应链安全 ──────────────────────────
  sbomScan:          { id: 'sbom-scan',        label: 'SBOM 扫描',     icon: 'PackageSearch',priority: 1 },
  vendorEval:        { id: 'vendor-eval',      label: '供应商评估',    icon: 'Building',     priority: 2 },
  contractReview:    { id: 'contract-review',  label: '合同审查',      icon: 'FileCheck2',   priority: 4 },
  thirdPartyRisk:    { id: 'third-party-risk', label: '第三方风险',    icon: 'UsersRound',   priority: 3 },

  // ─── 第三方安全工具 ──────────────────────
  nessusScan:        { id: 'nessus-scan',           label: 'Nessus 扫描',      icon: 'Shield',       priority: 10 },
  splunkQuery:       { id: 'splunk-query',          label: 'Splunk 查询',      icon: 'Search',       priority: 10 },
  crowdstrikeEdr:    { id: 'crowdstrike-detections', label: 'CrowdStrike EDR',  icon: 'Crosshair',    priority: 10 },
  virusTotalScan:    { id: 'virustotal-scan',       label: 'VirusTotal',       icon: 'Bug',          priority: 10 },
  elasticSecurity:   { id: 'elastic-security',      label: 'Elastic SIEM',     icon: 'Database',     priority: 10 },
} as const;

// ─── Role × Tool Matrix (基于 SKILL.md 能力映射) ──────────────

export const ROLE_TOOL_CONFIGS: Record<RoleId, RoleToolConfig> = {

  // ═══════════════════════════════════════════════════════════
  // CISO（SEC+LEG+IT 三元）— 安全战略、合规治理、风险决策
  // Light: 战略规划→risk-score, 合规治理→compliance-chk, 预算管理→budget-dash,
  //        监管对接→board-report, 绩效评估→kpi-track
  // ═══════════════════════════════════════════════════════════
  'ciso': {
    roleId: 'ciso',
    label: 'CISO',
    coreTools: [
      T.riskScore,        // 安全战略规划
      T.kpiTrack,         // 安全绩效评估
      T.boardReport,      // 监管对接/董事会汇报
      T.budgetDash,       // 安全预算管理
      T.complianceChk,    // 合规治理
    ],
    secondaryTools: [
      T.riskRegister,     // 风险管理
      T.policyMgmt,       // 安全政策制定
      T.threatModel,      // 架构设计(审阅视角)
      T.incidentMgmt,     // 危机管理(监督视角)
      T.vendorEval,       // 供应链评估
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 安全指挥官（SEC+LEG+IT+BIZ 四元）— 全域指挥、协调调度
  // Light: 战略规划→global-situation, 危机管理→incident-mgmt,
  //        跨部门协调→ai-dispatch, 董事会汇报→board-report, 风险管理→risk-score
  // Phase 1A: 增加 bcp-mgmt 支持业务连续性管理全域协调
  // ═══════════════════════════════════════════════════════════
  'secuclaw-commander': {
    roleId: 'secuclaw-commander',
    label: '安全指挥官',
    coreTools: [
      T.globalSituation,  // 战略规划/全域态势
      T.aiDispatch,       // 跨部门协调/AI调度
      T.incidentMgmt,     // 危机管理(指挥视角)
      T.riskScore,        // 风险管理(全域)
      T.boardReport,      // 董事会汇报
    ],
    secondaryTools: [
      T.complianceChk,    // 合规管理
      T.bcpMgmt,          // [Phase 1A] 业务连续性管理-指挥官视角
      T.zeroTrust,        // 架构设计(指挥视角)
      T.budgetDash,       // 预算管理
      T.vendorEval,       // 供应链管理
      T.splunkQuery,      // Splunk 全域日志
      T.elasticSecurity,  // Elastic Security
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 隐私官（SEC+LEG 二元）— 数据隐私、法律合规
  // Light: PIA评估→gdpr-audit, 数据分类→data-map, 合规审计→compliance-chk,
  //        用户权利→(表单内), 跨境传输→gdpr-audit, 同意管理→(表单内)
  // ═══════════════════════════════════════════════════════════
  'privacy-officer': {
    roleId: 'privacy-officer',
    label: '隐私官',
    coreTools: [
      T.gdprAudit,        // 隐私影响评估/跨境传输合规
      T.complianceChk,    // 合规审计
      T.dataMap,          // 数据分类分级
      T.policyMgmt,       // 数据保护政策
      T.vendorEval,       // 第三方数据处理评估
    ],
    secondaryTools: [
      T.riskRegister,     // 隐私风险登记
      T.reportGen,        // 合规报表
      T.thirdPartyRisk,   // 第三方数据泄露风险
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 业务安全官（SEC+BIZ 二元）— 业务连续、风险量化
  // Light: BCP管理→bcp-mgmt, 风险量化→risk-score, 供应链安全→vendor-eval,
  //        投资ROI→cost-calc, 业务影响分析→(BCP内置), KPI→kpi-track
  // ═══════════════════════════════════════════════════════════
  'business-security-officer': {
    roleId: 'business-security-officer',
    label: '业务安全官',
    coreTools: [
      T.bcpMgmt,          // 业务连续性管理
      T.riskScore,        // 风险量化评估
      T.costCalc,         // 安全投资回报分析
      T.vendorEval,       // 供应链安全
      T.kpiTrack,         // 安全KPI制定
    ],
    secondaryTools: [
      T.incidentMgmt,     // 业务中断事件
      T.reportGen,        // 运营报表
      T.budgetDash,       // 预算追踪
      T.thirdPartyRisk,   // 供应链风险
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 安全运营（SEC+IT+BIZ 三元）— SOC运营、告警处置、自动化
  // Light: 威胁监控→alert-queue, 事件响应→incident-mgmt, SOC→splunk/elastic,
  //        漏洞管理→vuln-scan, 日志分析→log-analysis, 威胁狩猎→threat-intel,
  //        安全自动化→soar-exec
  // ═══════════════════════════════════════════════════════════
  'security-ops': {
    roleId: 'security-ops',
    label: '安全运营',
    coreTools: [
      T.alertQueue,       // 威胁监控
      T.incidentMgmt,     // 事件响应
      T.soarExec,         // 安全自动化
      T.logAnalysis,      // 日志分析
      T.threatIntel,      // 威胁狩猎
    ],
    secondaryTools: [
      T.kpiTrack,         // 运营指标
      T.vulnScan,         // 漏洞管理
      T.patchMgmt,        // 补丁管理
      T.splunkQuery,      // Splunk SIEM
      T.crowdstrikeEdr,   // CrowdStrike EDR
      T.virusTotalScan,   // VirusTotal
      T.elasticSecurity,  // Elastic Security
      T.nessusScan,       // Nessus 漏洞扫描
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 安全专家（SEC 单一）— 技术攻防、漏洞分析、渗透测试
  // Light: 漏洞扫描→vuln-scan, 补丁管理→patch-mgmt, 威胁检测→threat-intel,
  //        事件响应→incident-mgmt, 访问控制→iam-config
  // Dark:  渗透测试→pen-test, 红队演练→pen-test(红队模式)
  // ═══════════════════════════════════════════════════════════
  'security-expert': {
    roleId: 'security-expert',
    label: '安全专家',
    coreTools: [
      T.vulnScan,         // 漏洞扫描
      T.threatIntel,      // 威胁检测
      T.penTest,          // 渗透测试/红队演练
      T.incidentMgmt,     // 事件响应(技术视角)
      T.patchMgmt,        // 补丁管理
    ],
    secondaryTools: [
      T.alertQueue,       // 安全监控
      T.iamConfig,        // 访问控制/身份认证
      T.logAnalysis,      // 日志取证
      T.threatModel,      // 威胁建模(攻击视角)
      T.nessusScan,       // Nessus 漏洞扫描
      T.crowdstrikeEdr,   // CrowdStrike EDR
      T.virusTotalScan,   // VirusTotal 恶意软件分析
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 安全架构师（SEC+IT 二元）— 架构设计、零信任、纵深防御
  // Light: 架构设计→threat-model, 零信任→zero-trust, 身份架构→iam-config,
  //        云安全→cloud-security, 防御纵深→threat-model(纵深模式)
  // Dark:  架构弱点→threat-model(攻击路径模式)
  // ═══════════════════════════════════════════════════════════
  'security-architect': {
    roleId: 'security-architect',
    label: '安全架构师',
    coreTools: [
      T.threatModel,      // 安全架构设计/STRIDE
      T.zeroTrust,        // 零信任架构
      T.iamConfig,        // 身份架构
      T.cloudSecurity,    // 云安全架构
      T.complianceChk,    // 控制映射/合规基线
    ],
    secondaryTools: [
      T.vulnScan,         // 架构弱点评估
      T.riskScore,        // 架构风险评分
      T.policyMgmt,       // 安全基线/标准
      T.incidentMgmt,     // 架构级事件分析
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 供应链安全（SEC+LEG+BIZ 三元）— 供应商评估、第三方风险、合规
  // Light: 供应商评估→vendor-eval, 第三方风险→third-party-risk,
  //        供应链合规→compliance-chk, 合同审查→contract-review,
  //        供应链可视化→sbom-scan
  // ═══════════════════════════════════════════════════════════
  'supply-chain-security': {
    roleId: 'supply-chain-security',
    label: '供应链安全',
    coreTools: [
      T.sbomScan,         // 供应链可视化/SBOM
      T.vendorEval,       // 供应商安全评估
      T.thirdPartyRisk,   // 第三方风险管理
      T.contractReview,   // 合同安全条款
      T.complianceChk,    // 供应链合规
    ],
    secondaryTools: [
      T.riskRegister,     // 供应商风险登记
      T.policyMgmt,       // 供应商安全标准
      T.incidentMgmt,     // 供应商安全事件
      T.vulnScan,         // 组件漏洞
      T.nessusScan,       // Nessus 供应链扫描
    ],
  },
};

// ─── Helpers ──────────────────────────────────────────────────

export function getCoreTools(roleId: RoleId): ToolDef[] {
  return ROLE_TOOL_CONFIGS[roleId]?.coreTools ?? [];
}

export function getAllTools(roleId: RoleId): ToolDef[] {
  const config = ROLE_TOOL_CONFIGS[roleId];
  if (!config) return [];
  return [...config.coreTools, ...config.secondaryTools];
}

export function findToolById(toolId: string): ToolDef | undefined {
  return Object.values(T).find(t => t.id === toolId);
}

export const ALL_ROLE_IDS: RoleId[] = [
  'ciso',
  'secuclaw-commander',
  'privacy-officer',
  'business-security-officer',
  'security-ops',
  'security-expert',
  'security-architect',
  'supply-chain-security',
];
