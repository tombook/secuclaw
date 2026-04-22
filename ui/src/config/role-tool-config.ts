/**
 * SecuClaw 角色工具配置 v3.3
 * 基于 SKILL.md 安全能力重新设计分配
 * Phase 1A: secuclaw-commander 增加 bcp-mgmt 工具
 * Phase 1B: 
 *   - security-architect 增加网络分段/DMZ/安全区域工具支持防御纵深
 *   - business-security-officer 增加灾难恢复工具
 *   - supply-chain-security 确认 T.contractReview (DPA) 已配置
 * Phase 1C:
 *   - secuclaw-commander 增加安全治理、投资决策工具
 *   - business-security-officer 增加安全意识培训工具
 *   - privacy-officer 增加 Cookie 管理、同意管理工具
 *   - security-ops 增加 BCP 管理工具
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
  "ransomware-simulator": { id: "ransomware-simulator", label: "Ransomware Simulator", icon: "🦹‍♂️", priority: 1 },
  "blueteam-defense-simulator": { id: "blueteam-defense-simulator", label: "Defense Simulator", icon: "🛡️", priority: 1 },
  "redteam-operations": { id: "redteam-operations", label: "Red Team Ops", icon: "🎯", priority: 1 },
  "pentest-workflow": { id: "pentest-workflow", label: "Pen Test Workflow", icon: "🐉", priority: 2 },
  "mitre-attack-heatmap": { id: "mitre-attack-heatmap", label: "MITRE ATT&CK Heatmap", icon: "🎯", priority: 2 },
  "attack-path-visualization": { id: "attack-path-visualization", label: "Attack Path Visualization", icon: "🗺️", priority: 2 },
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
  budgetDash:        { id: 'budget-dash',       label: '预算仪表盘',    icon: 'PiggyBank',    priority: 3 },
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
  // [Phase 1B] 防御纵深相关工具
  networkSeg:        { id: 'network-seg',      label: '网络分段',      icon: 'Network',      priority: 3 },  // 网络分段设计
  dmzConfig:         { id: 'dmz-config',       label: 'DMZ 配置',       icon: 'Shield',        priority: 4 },  // DMZ 区域设计
  appSec:            { id: 'app-sec',          label: '应用安全',      icon: 'Code2',        priority: 4 },  // 应用层防护

  // ─── 业务连续性 ──────────────────────────
  bcpMgmt:           { id: 'bcp-mgmt',         label: 'BCP 管理',      icon: 'ShieldCheck',  priority: 1 },
  // [Phase 1B] 灾难恢复工具
  disasterRecovery:  { id: 'disaster-recovery',label: '灾难恢复',      icon: 'RotateCcw',    priority: 2 },  // DR 站点/RTO/RPO
  costCalc:          { id: 'cost-calc',        label: '成本计算',      icon: 'Calculator',   priority: 3 },

  // ─── 供应链安全 ──────────────────────────
  sbomScan:          { id: 'sbom-scan',        label: 'SBOM 扫描',     icon: 'PackageSearch',priority: 1 },
  vendorEval:        { id: 'vendor-eval',      label: '供应商评估',    icon: 'Building',     priority: 2 },
  contractReview:    { id: 'contract-review',  label: '合同审查/DPA', icon: 'FileCheck2',   priority: 4 },  // [Phase 1B] 标注 DPA
  vendorAudit:       { id: 'vendor-audit',    label: '供应商审计',    icon: 'ClipboardCheck',priority: 3 }, // [Phase 1B] 新增
  thirdPartyRisk:    { id: 'third-party-risk', label: '第三方风险',    icon: 'UsersRound',   priority: 3 },

  // ─── Phase 1C 新增工具 ──────────────────
  securityGovernance: { id: 'security-governance', label: '安全治理',    icon: 'ShieldCheck', priority: 1 },
  investmentDecision: { id: 'investment-decision', label: '投资决策',    icon: 'TrendingUp',  priority: 2 },
  secAwareness:      { id: 'sec-awareness',    label: '安全意识培训',  icon: 'GraduationCap',priority: 3 },
  cookieMgmt:        { id: 'cookie-mgmt',      label: 'Cookie 管理',   icon: 'Cookie',       priority: 3 },
  consentMgmt:       { id: 'consent-mgmt',     label: '同意管理',      icon: 'CheckCircle',  priority: 3 },
  drillMgmt:         { id: 'drill-mgmt',       label: '应急演练',      icon: 'Flame',        priority: 2 },
  devsecops:         { id: 'devsecops',         label: 'DevSecOps',     icon: 'GitMerge',     priority: 2 },
  perfMgmt:          { id: 'perf-mgmt',         label: '绩效管理',      icon: 'BarChart3',    priority: 3 },
  vendorMonitor:     { id: 'vendor-monitor',   label: '供应商监控',    icon: 'Eye',          priority: 1 },
  slaMgmt:           { id: 'sla-mgmt',         label: 'SLA 管理',      icon: 'Clock',        priority: 2 },
  supplyIntel:       { id: 'supply-intel',     label: '供应链情报',    icon: 'Globe',        priority: 2 },
  materialTrack:     { id: 'material-track',   label: '物料追踪',      icon: 'Package',      priority: 3 },
  dataArch:          { id: 'data-arch',         label: '数据安全架构',  icon: 'Database',     priority: 1 },
  drArch:            { id: 'dr-arch',           label: '容灾架构',      icon: 'Server',       priority: 2 },
  archGovernance:    { id: 'arch-governance',   label: '架构治理',      icon: 'Sitemap',      priority: 2 },
  biaAnalysis:       { id: 'bia-analysis',     label: '业务影响分析',  icon: 'BarChart2',    priority: 1 },

  // ─── Phase 2: 高级交互面板 ──────────────────
  darkSimEngine:     { id: 'dark-sim-engine',   label: 'Dark Mode 攻击模拟', icon: 'Sword',      priority: 1 },
  scanResults:       { id: 'scan-results',      label: '扫描结果详情',  icon: 'Table',         priority: 2 },
  securityTimeline:  { id: 'security-timeline', label: '安全事件时间线', icon: 'Clock',         priority: 2 },

  // ─── Phase 2+ 工具定义 (81 components) ───
  attack_surface_graph: { id: 'attack-surface-graph', label: 'Attack Surface Graph', icon: 'Wrench', priority: 2 },
  risk_gauge: { id: 'risk-gauge', label: 'Risk Gauge', icon: 'Wrench', priority: 2 },
  vuln_summary_chart: { id: 'vuln-summary-chart', label: 'Vuln Summary Chart', icon: 'Wrench', priority: 2 },
  pentest_report: { id: 'pentest-report', label: 'Pentest Report', icon: 'Wrench', priority: 2 },
  access_matrix: { id: 'access-matrix', label: 'Access Matrix', icon: 'Wrench', priority: 2 },
  forensics_timeline: { id: 'forensics-timeline', label: 'Forensics Timeline', icon: 'Wrench', priority: 2 },
  malware_analysis: { id: 'malware-analysis', label: 'Malware Analysis', icon: 'Wrench', priority: 2 },
  vuln_trend: { id: 'vuln-trend', label: 'Vuln Trend', icon: 'Wrench', priority: 2 },
  vuln_priority: { id: 'vuln-priority', label: 'Vuln Priority', icon: 'Wrench', priority: 2 },
  attack_patterns: { id: 'attack-patterns', label: 'Attack Patterns', icon: 'Wrench', priority: 2 },
  scanner_integration: { id: 'scanner-integration', label: 'Scanner Integration', icon: 'Wrench', priority: 2 },
  endpoint_dash: { id: 'endpoint-dash', label: 'Endpoint Dash', icon: 'Wrench', priority: 2 },
  severity_calc: { id: 'severity-calc', label: 'Severity Calc', icon: 'Wrench', priority: 2 },
  osint_tool: { id: 'osint-tool', label: 'Osint Tool', icon: 'Wrench', priority: 2 },
  code_review: { id: 'code-review', label: 'Code Review', icon: 'Wrench', priority: 2 },
  exploit_predict: { id: 'exploit-predict', label: 'Exploit Predict', icon: 'Wrench', priority: 2 },
  password_audit: { id: 'password-audit', label: 'Password Audit', icon: 'Wrench', priority: 2 },
  wireless_security: { id: 'wireless-security', label: 'Wireless Security', icon: 'Wrench', priority: 2 },
  risk_heatmap: { id: 'risk-heatmap', label: 'Risk Heatmap', icon: 'Wrench', priority: 2 },
  roi_calculator: { id: 'roi-calculator', label: 'Roi Calculator', icon: 'Wrench', priority: 2 },
  budget_planner: { id: 'budget-planner', label: 'Budget Planner', icon: 'Wrench', priority: 2 },
  gov_framework: { id: 'gov-framework', label: 'Gov Framework', icon: 'Wrench', priority: 2 },
  board_report: { id: 'board-report', label: 'Board Report', icon: 'Wrench', priority: 2 },
  kpi_dashboard: { id: 'kpi-dashboard', label: 'Kpi Dashboard', icon: 'Wrench', priority: 2 },
  metrics_export: { id: 'metrics-export', label: 'Metrics Export', icon: 'Wrench', priority: 2 },
  compliance_map: { id: 'compliance-map', label: 'Compliance Map', icon: 'Wrench', priority: 2 },
  champions: { id: 'champions', label: 'Champions', icon: 'Wrench', priority: 2 },
  orchestration: { id: 'orchestration', label: 'Orchestration', icon: 'Wrench', priority: 2 },
  purple_team: { id: 'purple-team', label: 'Purple Team', icon: 'Wrench', priority: 2 },
  risk_register: { id: 'risk-register', label: 'Risk Register', icon: 'Wrench', priority: 2 },
  policy_checker: { id: 'policy-checker', label: 'Policy Checker', icon: 'Wrench', priority: 2 },
  reg_tracker: { id: 'reg-tracker', label: 'Reg Tracker', icon: 'Wrench', priority: 2 },
  compliance_calendar: { id: 'compliance-calendar', label: 'Compliance Calendar', icon: 'Wrench', priority: 2 },
  gdpr_tracker: { id: 'gdpr-tracker', label: 'Gdpr Tracker', icon: 'Wrench', priority: 2 },
  evidence_collector: { id: 'evidence-collector', label: 'Evidence Collector', icon: 'Wrench', priority: 2 },
  scf_questionnaire: { id: 'scf-questionnaire', label: 'Scf Questionnaire', icon: 'Wrench', priority: 2 },
  news_feed: { id: 'news-feed', label: 'News Feed', icon: 'Wrench', priority: 2 },
  soc_metrics: { id: 'soc-metrics', label: 'Soc Metrics', icon: 'Wrench', priority: 2 },
  ir_playbook: { id: 'ir-playbook', label: 'Ir Playbook', icon: 'Wrench', priority: 2 },
  threat_hunting: { id: 'threat-hunting', label: 'Threat Hunting', icon: 'Wrench', priority: 2 },
  alert_correlation: { id: 'alert-correlation', label: 'Alert Correlation', icon: 'Wrench', priority: 2 },
  log_query: { id: 'log-query', label: 'Log Query', icon: 'Wrench', priority: 2 },
  threat_feed: { id: 'threat-feed', label: 'Threat Feed', icon: 'Wrench', priority: 2 },
  incident_timeline: { id: 'incident-timeline', label: 'Incident Timeline', icon: 'Wrench', priority: 2 },
  integration_health: { id: 'integration-health', label: 'Integration Health', icon: 'Wrench', priority: 2 },
  dns_security: { id: 'dns-security', label: 'Dns Security', icon: 'Wrench', priority: 2 },
  exfil_detection: { id: 'exfil-detection', label: 'Exfil Detection', icon: 'Wrench', priority: 2 },
  alert_system: { id: 'alert-system', label: 'Alert System', icon: 'Wrench', priority: 2 },
  zero_trust_designer: { id: 'zero-trust-designer', label: 'Zero Trust Designer', icon: 'Wrench', priority: 2 },
  network_topo: { id: 'network-topo', label: 'Network Topo', icon: 'Wrench', priority: 2 },
  cloud_posture: { id: 'cloud-posture', label: 'Cloud Posture', icon: 'Wrench', priority: 2 },
  arch_review: { id: 'arch-review', label: 'Arch Review', icon: 'Wrench', priority: 2 },
  container_security: { id: 'container-security', label: 'Container Security', icon: 'Wrench', priority: 2 },
  k8s_security: { id: 'k8s-security', label: 'K8S Security', icon: 'Wrench', priority: 2 },
  config_audit: { id: 'config-audit', label: 'Config Audit', icon: 'Wrench', priority: 2 },
  baseline_scan: { id: 'baseline-scan', label: 'Baseline Scan', icon: 'Wrench', priority: 2 },
  data_flow: { id: 'data-flow', label: 'Data Flow', icon: 'Wrench', priority: 2 },
  dependency_tree: { id: 'dependency-tree', label: 'Dependency Tree', icon: 'Wrench', priority: 2 },
  privacy_computing: { id: 'privacy-computing', label: 'Privacy Computing', icon: 'Wrench', priority: 2 },
  dpia_workflow: { id: 'dpia-workflow', label: 'Dpia Workflow', icon: 'Wrench', priority: 2 },
  data_classification: { id: 'data-classification', label: 'Data Classification', icon: 'Wrench', priority: 2 },
  data_transfer: { id: 'data-transfer', label: 'Data Transfer', icon: 'Wrench', priority: 2 },
  sso_config: { id: 'sso-config', label: 'Sso Config', icon: 'Wrench', priority: 2 },
  dlp_dashboard: { id: 'dlp-dashboard', label: 'Dlp Dashboard', icon: 'Wrench', priority: 2 },
  email_security: { id: 'email-security', label: 'Email Security', icon: 'Wrench', priority: 2 },
  bcp_dashboard: { id: 'bcp-dashboard', label: 'Bcp Dashboard', icon: 'Wrench', priority: 2 },
  bia_analysis: { id: 'bia-analysis', label: 'Bia Analysis', icon: 'Wrench', priority: 2 },
  dr_plan: { id: 'dr-plan', label: 'Dr Plan', icon: 'Wrench', priority: 2 },
  dr_test: { id: 'dr-test', label: 'Dr Test', icon: 'Wrench', priority: 2 },
  vendor_scorecard: { id: 'vendor-scorecard', label: 'Vendor Scorecard', icon: 'Wrench', priority: 2 },
  contract_review: { id: 'contract-review', label: 'Contract Review', icon: 'Wrench', priority: 2 },
  training_tracker: { id: 'training-tracker', label: 'Training Tracker', icon: 'Wrench', priority: 2 },
  training_module: { id: 'training-module', label: 'Training Module', icon: 'Wrench', priority: 2 },
  sec_quiz: { id: 'sec-quiz', label: 'Sec Quiz', icon: 'Wrench', priority: 2 },
  change_review: { id: 'change-review', label: 'Change Review', icon: 'Wrench', priority: 2 },
  supply_chain_graph: { id: 'supply-chain-graph', label: 'Supply Chain Graph', icon: 'Wrench', priority: 2 },
  vendor_onboard: { id: 'vendor-onboard', label: 'Vendor Onboard', icon: 'Wrench', priority: 2 },
  vendor_sla: { id: 'vendor-sla', label: 'Vendor Sla', icon: 'Wrench', priority: 2 },
  vendor_monitor: { id: 'vendor-monitor', label: 'Vendor Monitor', icon: 'Wrench', priority: 2 },
  material_track: { id: 'material-track', label: 'Material Track', icon: 'Wrench', priority: 2 },
  supply_intel: { id: 'supply-intel', label: 'Supply Intel', icon: 'Wrench', priority: 2 },

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
          T.compliance_map,
      T.risk_register,
      T.policy_checker,
      T.reg_tracker,
      T.compliance_calendar,
      T.gdpr_tracker,
      T.evidence_collector,
      T.scf_questionnaire,
      T.news_feed,
],
  },

  // ═══════════════════════════════════════════════════════════
  // 安全指挥官（SEC+LEG+IT+BIZ 四元）— 全域指挥、协调调度
  // Light: 战略规划→global-situation, 危机管理→incident-mgmt,
  //        跨部门协调→ai-dispatch, 董事会汇报→board-report, 风险管理→risk-score
  // Phase 1A: 增加 bcp-mgmt 支持业务连续性管理全域协调
  // Phase 1C: 增加 securityGovernance, investmentDecision 支持治理与决策
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
      // [Phase 1C] 治理与决策
      T.securityGovernance, // 安全治理框架与合规体系
      T.investmentDecision, // 安全投资决策与ROI分析
      T.drillMgmt,          // [Phase 1D] 应急演练管理
      T.devsecops,          // [Phase 1D] DevSecOps流水线
      T.perfMgmt,           // [Phase 1D] 安全绩效管理
      // [Phase 2] 高级交互
      T.darkSimEngine,      // Dark Mode 攻击模拟引擎
      T.securityTimeline,   // 安全事件时间线
          T.risk_heatmap,
      T.roi_calculator,
      T.budget_planner,
      T.gov_framework,
      T.board_report,
      T.kpi_dashboard,
      T.metrics_export,
      T.compliance_map,
      T.champions,
      T.orchestration,
      T.purple_team,
],
  },

  // ═══════════════════════════════════════════════════════════
  // 隐私官（SEC+LEG 二元）— 数据隐私、法律合规
  // Light: PIA评估→gdpr-audit, 数据分类→data-map, 合规审计→compliance-chk,
  //        用户权利→(表单内), 跨境传输→gdpr-audit, 同意管理→(表单内)
  // Phase 1C: 增加 cookieMgmt, consentMgmt 支持 Cookie & 同意管理
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
      // [Phase 1C] Cookie & 同意管理
      T.cookieMgmt,       // Cookie 管理与审计
      T.consentMgmt,      // 同意管理与用户权利
          T.privacy_computing,
      T.dpia_workflow,
      T.data_classification,
      T.data_transfer,
      T.sso_config,
      T.dlp_dashboard,
      T.email_security,
],
  },

  // ═══════════════════════════════════════════════════════════
  // 业务安全官（SEC+BIZ 二元）— 业务连续、风险量化
  // Light: BCP管理→bcp-mgmt, 风险量化→risk-score, 供应链安全→vendor-eval,
  //        投资ROI→cost-calc, 业务影响分析→(BCP内置), KPI→kpi-track
  // [Phase 1B] 增加灾难恢复工具支持 DR 规划
  // [Phase 1C] 增加 secAwareness 支持安全意识培训
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
      T.disasterRecovery, // [Phase 1B] 灾难恢复规划 RTO/RPO/灾备站点
      // [Phase 1C] 安全意识培训
      T.secAwareness,    // 安全意识培训与钓鱼演练
      T.biaAnalysis,     // [Phase 1E] 业务影响分析
          T.bcp_dashboard,
      T.bia_analysis,
      T.dr_plan,
      T.dr_test,
      T.vendor_scorecard,
      T.contract_review,
      T.training_tracker,
      T.training_module,
      T.sec_quiz,
      T.change_review,
],
  },

  // ═══════════════════════════════════════════════════════════
  // 安全运营（SEC+IT+BIZ 三元）— SOC运营、告警处置、自动化
  // Light: 威胁监控→alert-queue, 事件响应→incident-mgmt, SOC→splunk/elastic,
  //        漏洞管理→vuln-scan, 日志分析→log-analysis, 威胁狩猎→threat-intel,
  //        安全自动化→soar-exec
  // [Phase 1C] 增加 bcpMgmt 支持业务连续性运营视角
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
      // [Phase 1C] 业务连续性运营
      T.bcpMgmt,         // BCP 运营指标监控
      // [Phase 2] 高级交互
      T.securityTimeline,  // 安全事件时间线
          T.soc_metrics,
      T.ir_playbook,
      T.threat_hunting,
      T.alert_correlation,
      T.log_query,
      T.threat_feed,
      T.incident_timeline,
      T.integration_health,
      T.dns_security,
      T.exfil_detection,
      T.alert_system,
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
      // [Phase 2] 高级交互面板
      T.darkSimEngine,    // Dark Mode 攻击模拟引擎
      T.scanResults,      // 高级扫描结果表格
      T.securityTimeline, // 安全事件时间线
          T.attack_surface_graph,
      T.risk_gauge,
      T.vuln_summary_chart,
      T.pentest_report,
      T.access_matrix,
      T.forensics_timeline,
      T.malware_analysis,
      T.vuln_trend,
      T.vuln_priority,
      T.attack_patterns,
      T.scanner_integration,
      T.endpoint_dash,
      T.severity_calc,
      T.osint_tool,
      T.code_review,
      T.exploit_predict,
      T.password_audit,
      T.wireless_security,
],
  },

  // ═══════════════════════════════════════════════════════════
  // 安全架构师（SEC+IT 二元）— 架构设计、零信任、纵深防御
  // Light: 架构设计→threat-model, 零信任→zero-trust, 身份架构→iam-config,
  //        云安全→cloud-security, 防御纵深→threat-model(纵深模式)
  // Dark:  架构弱点→threat-model(攻击路径模式)
  // [Phase 1B] 增加网络分段/DMZ/安全区域/应用安全工具支持防御纵深设计
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
      // [Phase 1B] 防御纵深工具
      T.networkSeg,       // 网络分段设计
      T.dmzConfig,        // DMZ 区域规划
      T.appSec,           // 应用层安全设计
      T.dataArch,         // [Phase 1E] 数据安全架构
      T.drArch,           // [Phase 1E] 容灾架构
      T.archGovernance,   // [Phase 1E] 架构治理
          T.zero_trust_designer,
      T.network_topo,
      T.cloud_posture,
      T.arch_review,
      T.container_security,
      T.k8s_security,
      T.config_audit,
      T.baseline_scan,
      T.data_flow,
      T.dependency_tree,
],
  },

  // ═══════════════════════════════════════════════════════════
  // 供应链安全（SEC+LEG+BIZ 三元）— 供应商评估、第三方风险、合规
  // Light: 供应商评估→vendor-eval, 第三方风险→third-party-risk,
  //        供应链合规→compliance-chk, 合同审查→contract-review(DPA),
  //        供应链可视化→sbom-scan
  // [Phase 1B] 确认 contractReview (DPA) 已配置，增加供应商审计工具
  // ═══════════════════════════════════════════════════════════
  'supply-chain-security': {
    roleId: 'supply-chain-security',
    label: '供应链安全',
    coreTools: [
      T.sbomScan,         // 供应链可视化/SBOM
      T.vendorEval,       // 供应商安全评估
      T.thirdPartyRisk,   // 第三方风险管理
      T.contractReview,   // 合同审查/DPA 数据处理协议 [Phase 1B] 标注 DPA
      T.complianceChk,    // 供应链合规
    ],
    secondaryTools: [
      T.riskRegister,     // 供应商风险登记
      T.policyMgmt,       // 供应商安全标准
      T.incidentMgmt,     // 供应商安全事件
      T.vulnScan,         // 组件漏洞
      T.nessusScan,       // Nessus 供应链扫描
      T.vendorAudit,      // [Phase 1B] 供应商审计检查表
      T.vendorMonitor,    // [Phase 1D] 持续监控
      T.slaMgmt,          // [Phase 1D] SLA 管理
      T.supplyIntel,      // [Phase 1D] 供应链威胁情报
      T.materialTrack,    // [Phase 1D] 物料来源追踪
          T.supply_chain_graph,
      T.vendor_onboard,
      T.vendor_sla,
      T.vendor_monitor,
      T.material_track,
      T.supply_intel,
      T.dependency_tree,
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
  'security-ops',
  'security-expert',
  'security-architect',
  'business-security-officer',
  'supply-chain-security',
];
