/**
 * 统一仪表盘 Mock 数据
 * 为 8 个角色仪表盘提供集中、可类型化的演示数据
 * 颜色一律通过 CSS 变量（var(--sc-*）引用，业务配色与主题保持一致
 */

export const ROLE_COLORS = {
  ciso: '#00d4ff',
  'secuclaw-commander': '#7c3aed',
  'security-ops': '#22c55e',
  'security-expert': '#ef4444',
  'privacy-officer': '#a78bfa',
  'security-architect': '#06b6d4',
  'business-security-officer': '#f59e0b',
  'supply-chain-security': '#3b82f6',
} as const;

export const CISO_MOCK = {
  maturity: [
    { name: '治理', value: 78 },
    { name: '防护', value: 85 },
    { name: '检测', value: 72 },
    { name: '响应', value: 68 },
    { name: '恢复', value: 80 },
  ],
  compliance: [
    { framework: 'ISO 27001', score: 92, color: '#22c55e' },
    { framework: 'SOC 2', score: 87, color: '#3b82f6' },
    { framework: 'GDPR', score: 95, color: '#a78bfa' },
    { framework: '等保2.0', score: 83, color: '#f59e0b' },
    { framework: 'PCI DSS', score: 76, color: '#f97316' },
  ],
  budget: {
    total: 8500,
    used: 5355,
    breakdown: [
      { name: '人员', value: 2400, color: '#3b82f6' },
      { name: '工具', value: 1800, color: '#8b5cf6' },
      { name: '培训', value: 600, color: '#22c55e' },
      { name: '咨询', value: 555, color: '#f59e0b' },
    ],
  },
  kpis: [
    { label: '安全评分', value: '82', unit: '/100', trend: 3, color: 'var(--sc-low, #22c55e)' },
    { label: '风险评分', value: '44', unit: '/100', trend: -5, color: 'var(--sc-medium, #f59e0b)' },
    { label: '合规率', value: '91', unit: '%', trend: 2, color: 'var(--sc-info, #3b82f6)' },
    { label: 'KPI 达成', value: '85', unit: '%', trend: 7, color: 'var(--sc-primary, #00d4ff)' },
  ],
  topRisks: [
    { id: 'r1', label: '第三方供应链风险', value: 8.5, severity: 'critical' as const, trend: 'up' as const },
    { id: 'r2', label: '内部数据泄露', value: 7.2, severity: 'high' as const, trend: 'up' as const },
    { id: 'r3', label: '勒索软件攻击', value: 6.8, severity: 'high' as const, trend: 'flat' as const },
    { id: 'r4', label: 'APT 持续渗透', value: 5.5, severity: 'medium' as const, trend: 'up' as const },
    { id: 'r5', label: '合规审计未通过', value: 4.2, severity: 'medium' as const, trend: 'down' as const },
  ],
};

export const COMMANDER_MOCK = {
  posture: { score: 78, trend: 5 },
  kpis: [
    { label: '全域告警', value: '247', unit: '条', trend: 12, color: 'var(--sc-medium, #f59e0b)' },
    { label: '活跃事件', value: '7', unit: '个', trend: -2, color: 'var(--sc-critical, #ef4444)' },
    { label: '检测时间', value: '8', unit: 'min', trend: -3, color: 'var(--sc-info, #3b82f6)' },
    { label: '安全评分', value: '78', unit: '/100', trend: 5, color: 'var(--sc-low, #22c55e)' },
  ],
  roleCoordination: [
    { name: 'CISO', value: 92, color: '#00d4ff' },
    { name: '安全运营', value: 85, color: '#22c55e' },
    { name: '安全专家', value: 78, color: '#ef4444' },
    { name: '隐私官', value: 88, color: '#a78bfa' },
    { name: '架构师', value: 82, color: '#06b6d4' },
    { name: '业务安全', value: 75, color: '#f59e0b' },
  ],
  alertTrend: {
    labels: ['5/5', '5/6', '5/7', '5/8', '5/9', '5/10', '5/11'],
    critical: [3, 5, 4, 7, 6, 4, 5],
    high: [8, 12, 10, 15, 14, 11, 13],
    medium: [22, 25, 28, 30, 27, 24, 26],
  },
  events: [
    { time: '14:32', title: 'Web 攻击检测', severity: 'critical' as const, desc: 'SQL 注入尝试，来源 IP 203.0.113.42' },
    { time: '13:15', title: '权限异常变更', severity: 'high' as const, desc: 'admin 账户被添加到生产环境' },
    { time: '11:48', title: '数据外传告警', severity: 'high' as const, desc: '检测到 1.2GB 数据下载到外部存储' },
    { time: '10:22', title: '系统补丁更新', severity: 'low' as const, desc: 'OpenSSL 已更新到 3.0.13' },
    { time: '09:05', title: '威胁情报匹配', severity: 'medium' as const, desc: 'APT-29 IOC 在边界流量中匹配' },
  ],
  topPriorities: [
    { id: 'p1', label: '协调安全运营处置 7 起活跃事件', value: 'P1', severity: 'critical' as const },
    { id: 'p2', label: '审批安全架构师零信任方案', value: 'P2', severity: 'high' as const },
    { id: 'p3', label: '审查 CISO 季度风险报告', value: 'P2', severity: 'high' as const },
    { id: 'p4', label: '批准隐私官 GDPR 整改计划', value: 'P3', severity: 'medium' as const },
    { id: 'p5', label: '审阅供应链安全事件', value: 'P3', severity: 'medium' as const },
  ],
};

export const SECOPS_MOCK = {
  kpis: [
    { label: '待处理告警', value: '47', unit: '条', trend: 8, color: 'var(--sc-medium, #f59e0b)' },
    { label: '误报率', value: '18', unit: '%', trend: -3, color: 'var(--sc-low, #22c55e)' },
    { label: '响应时间', value: '12', unit: 'min', trend: -5, color: 'var(--sc-info, #3b82f6)' },
    { label: 'SOAR 自动化', value: '73', unit: '%', trend: 12, color: 'var(--sc-primary, #00d4ff)' },
  ],
  severityDist: [
    { label: '严重', value: 12, color: 'var(--sc-critical, #ef4444)' },
    { label: '高', value: 28, color: 'var(--sc-high, #f97316)' },
    { label: '中', value: 45, color: 'var(--sc-medium, #f59e0b)' },
    { label: '低', value: 22, color: 'var(--sc-low, #22c55e)' },
    { label: '信息', value: 18, color: 'var(--sc-info, #3b82f6)' },
  ],
  mttrTrend: {
    labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    series: [
      { label: 'MTTR (min)', color: '#22c55e', data: [28, 25, 22, 24, 19, 16, 14] },
      { label: 'MTTD (min)', color: '#3b82f6', data: [8, 7, 9, 6, 7, 5, 4] },
    ],
  },
  topAlerts: [
    { id: 'a1', label: 'SQL 注入 - web-prod-01', value: '高危', severity: 'critical' as const, trend: 'up' as const },
    { id: 'a2', label: '异常登录 - admin@corp', value: '高危', severity: 'critical' as const, trend: 'up' as const },
    { id: 'a3', label: '横向移动检测', value: '中危', severity: 'high' as const, trend: 'flat' as const },
    { id: 'a4', label: '恶意软件检出 - endpoint-42', value: '中危', severity: 'high' as const, trend: 'down' as const },
    { id: 'a5', label: '策略违规 - 数据外传', value: '中危', severity: 'medium' as const, trend: 'flat' as const },
  ],
};

export const SECURITY_EXPERT_MOCK = {
  kpis: [
    { label: '漏洞总数', value: '142', unit: '个', trend: -8, color: 'var(--sc-medium, #f59e0b)' },
    { label: '高危漏洞', value: '8', unit: '个', trend: -2, color: 'var(--sc-critical, #ef4444)' },
    { label: 'CVSS 均分', value: '6.8', unit: '', trend: -0.3, color: 'var(--sc-info, #3b82f6)' },
    { label: '补丁覆盖率', value: '87', unit: '%', trend: 4, color: 'var(--sc-low, #22c55e)' },
  ],
  cvssDist: [
    { label: '9.0+', value: 8, color: 'var(--sc-critical, #ef4444)' },
    { label: '7.0-8.9', value: 24, color: 'var(--sc-high, #f97316)' },
    { label: '4.0-6.9', value: 67, color: 'var(--sc-medium, #f59e0b)' },
    { label: '0.1-3.9', value: 43, color: 'var(--sc-low, #22c55e)' },
  ],
  topVulns: [
    { id: 'v1', label: 'CVE-2026-1234 Apache Log4j RCE', value: '9.8', severity: 'critical' as const, trend: 'up' as const },
    { id: 'v2', label: 'CVE-2026-1198 Nginx 缓冲区溢出', value: '7.8', severity: 'high' as const, trend: 'flat' as const },
    { id: 'v3', label: 'CVE-2026-1055 OpenSSL 信息泄露', value: '6.5', severity: 'medium' as const, trend: 'flat' as const },
    { id: 'v4', label: 'CVE-2026-0892 MySQL 权限提升', value: '5.3', severity: 'medium' as const, trend: 'down' as const },
    { id: 'v5', label: 'CVE-2026-0712 Redis 未授权访问', value: '4.8', severity: 'medium' as const, trend: 'down' as const },
  ],
  mitre: {
    rows: ['初始访问', '执行', '持久化', '权限提升', '防御绕过', '凭据访问', '发现', '横向移动', '收集', '外传', '影响'],
    cols: ['过去 7 天', '过去 30 天', '过去 90 天'],
    data: [
      { row: '初始访问', col: '过去 7 天', value: 12, label: '12' },
      { row: '初始访问', col: '过去 30 天', value: 45, label: '45' },
      { row: '初始访问', col: '过去 90 天', value: 156, label: '156' },
      { row: '执行', col: '过去 7 天', value: 8, label: '8' },
      { row: '执行', col: '过去 30 天', value: 32, label: '32' },
      { row: '执行', col: '过去 90 天', value: 112, label: '112' },
      { row: '持久化', col: '过去 7 天', value: 5, label: '5' },
      { row: '持久化', col: '过去 30 天', value: 18, label: '18' },
      { row: '持久化', col: '过去 90 天', value: 67, label: '67' },
      { row: '权限提升', col: '过去 7 天', value: 6, label: '6' },
      { row: '权限提升', col: '过去 30 天', value: 22, label: '22' },
      { row: '权限提升', col: '过去 90 天', value: 78, label: '78' },
      { row: '防御绕过', col: '过去 7 天', value: 9, label: '9' },
      { row: '防御绕过', col: '过去 30 天', value: 28, label: '28' },
      { row: '防御绕过', col: '过去 90 天', value: 95, label: '95' },
      { row: '凭据访问', col: '过去 7 天', value: 4, label: '4' },
      { row: '凭据访问', col: '过去 30 天', value: 15, label: '15' },
      { row: '凭据访问', col: '过去 90 天', value: 52, label: '52' },
      { row: '发现', col: '过去 7 天', value: 11, label: '11' },
      { row: '发现', col: '过去 30 天', value: 38, label: '38' },
      { row: '发现', col: '过去 90 天', value: 124, label: '124' },
      { row: '横向移动', col: '过去 7 天', value: 3, label: '3' },
      { row: '横向移动', col: '过去 30 天', value: 12, label: '12' },
      { row: '横向移动', col: '过去 90 天', value: 45, label: '45' },
      { row: '收集', col: '过去 7 天', value: 2, label: '2' },
      { row: '收集', col: '过去 30 天', value: 9, label: '9' },
      { row: '收集', col: '过去 90 天', value: 34, label: '34' },
      { row: '外传', col: '过去 7 天', value: 1, label: '1' },
      { row: '外传', col: '过去 30 天', value: 5, label: '5' },
      { row: '外传', col: '过去 90 天', value: 18, label: '18' },
      { row: '影响', col: '过去 7 天', value: 0, label: '0' },
      { row: '影响', col: '过去 30 天', value: 2, label: '2' },
      { row: '影响', col: '过去 90 天', value: 8, label: '8' },
    ],
  },
};

export const PRIVACY_MOCK = {
  kpis: [
    { label: 'GDPR 合规', value: '95', unit: '%', trend: 2, color: 'var(--sc-low, #22c55e)' },
    { label: 'PIPL 合规', value: '88', unit: '%', trend: 4, color: 'var(--sc-info, #3b82f6)' },
    { label: 'DPIA 完成', value: '76', unit: '%', trend: 8, color: 'var(--sc-primary, #00d4ff)' },
    { label: '主体请求', value: '23', unit: '件', trend: -5, color: 'var(--sc-medium, #f59e0b)' },
  ],
  dataCategories: [
    { label: '身份信息', value: 1240, color: '#3b82f6' },
    { label: '联系方式', value: 890, color: '#8b5cf6' },
    { label: '交易数据', value: 670, color: '#22c55e' },
    { label: '行为数据', value: 540, color: '#f59e0b' },
    { label: '生物特征', value: 120, color: '#ef4444' },
  ],
  consentRate: {
    labels: ['一月', '二月', '三月', '四月', '五月'],
    series: [
      { label: '同意率 %', color: '#22c55e', data: [82, 85, 87, 89, 91] },
    ],
  },
  requests: [
    { id: 'p1', label: '数据访问请求 DSAR', value: '8 待处理', severity: 'medium' as const, trend: 'up' as const },
    { id: 'p2', label: '数据删除请求', value: '5 待处理', severity: 'high' as const, trend: 'up' as const },
    { id: 'p3', label: '数据可携请求', value: '2 待处理', severity: 'low' as const, trend: 'flat' as const },
    { id: 'p4', label: '拒绝处理请求', value: '1 待处理', severity: 'low' as const, trend: 'flat' as const },
  ],
  riskMatrix: {
    items: [
      { id: 'rm1', label: '数据泄露', likelihood: 4, impact: 5, count: 3 },
      { id: 'rm2', label: '跨境传输违规', likelihood: 3, impact: 4, count: 2 },
      { id: 'rm3', label: '未授权访问', likelihood: 3, impact: 3, count: 1 },
      { id: 'rm4', label: '同意管理缺陷', likelihood: 2, impact: 3, count: 1 },
    ],
  },
};

export const ARCHITECT_MOCK = {
  kpis: [
    { label: '架构风险', value: '12', unit: '项', trend: -2, color: 'var(--sc-medium, #f59e0b)' },
    { label: '威胁覆盖', value: '82', unit: '%', trend: 5, color: 'var(--sc-low, #22c55e)' },
    { label: '控制数', value: '127', unit: '项', trend: 8, color: 'var(--sc-info, #3b82f6)' },
    { label: '零信任进度', value: '45', unit: '%', trend: 12, color: 'var(--sc-primary, #00d4ff)' },
  ],
  controlCoverage: {
    axes: [
      { label: '身份', max: 100 },
      { label: '设备', max: 100 },
      { label: '网络', max: 100 },
      { label: '应用', max: 100 },
      { label: '数据', max: 100 },
      { label: '基础设施', max: 100 },
    ],
    series: [
      { label: '当前', color: '#3b82f6', values: [82, 65, 78, 70, 88, 60] },
      { label: '目标', color: '#22c55e', values: [95, 90, 95, 90, 95, 85] },
    ],
  },
  ztMaturity: [
    { name: '身份验证', value: 85 },
    { name: '微分段', value: 60 },
    { name: '加密', value: 90 },
    { name: '策略', value: 55 },
    { name: '可见性', value: 70 },
  ],
  architectureRisks: [
    { id: 'a1', label: '传统 VPN 接入风险', value: '高', severity: 'high' as const, trend: 'up' as const },
    { id: 'a2', label: 'IAM 权限过度授予', value: '中', severity: 'medium' as const, trend: 'flat' as const },
    { id: 'a3', label: 'API 网关认证缺失', value: '中', severity: 'medium' as const, trend: 'down' as const },
    { id: 'a4', label: '遗留系统 EOL', value: '高', severity: 'high' as const, trend: 'up' as const },
    { id: 'a5', label: '多云网络可见性', value: '中', severity: 'medium' as const, trend: 'flat' as const },
  ],
};

export const BUSINESS_MOCK = {
  kpis: [
    { label: 'BCP 评分', value: '88', unit: '/100', trend: 4, color: 'var(--sc-low, #22c55e)' },
    { label: 'MTTR', value: '3.2', unit: 'h', trend: -0.5, color: 'var(--sc-info, #3b82f6)' },
    { label: '待演练', value: '2', unit: '场', trend: -1, color: 'var(--sc-medium, #f59e0b)' },
    { label: '保险覆盖', value: '92', unit: '%', trend: 2, color: 'var(--sc-primary, #00d4ff)' },
  ],
  impactBySystem: [
    { system: '电商平台', revenue: 1200, color: '#ef4444' },
    { system: '支付网关', revenue: 800, color: '#f97316' },
    { system: 'CRM', revenue: 200, color: '#f59e0b' },
    { system: 'ERP', revenue: 350, color: '#3b82f6' },
    { system: '邮件系统', revenue: 80, color: '#22c55e' },
  ],
  bcDrillStatus: [
    { name: '已通过', value: 18, color: '#22c55e' },
    { name: '进行中', value: 4, color: '#f59e0b' },
    { name: '未开始', value: 3, color: '#6b7280' },
    { name: '未通过', value: 1, color: '#ef4444' },
  ],
  insuranceBreakdown: [
    { name: '网络责任', coverage: 95 },
    { name: '数据泄露', coverage: 88 },
    { name: '业务中断', coverage: 90 },
    { name: '合规罚款', coverage: 78 },
  ],
};

export const SUPPLY_CHAIN_MOCK = {
  kpis: [
    { label: '高风险供应商', value: '5', unit: '家', trend: 1, color: 'var(--sc-critical, #ef4444)' },
    { label: 'SBOM 覆盖', value: '78', unit: '%', trend: 6, color: 'var(--sc-low, #22c55e)' },
    { label: '第三方漏洞', value: '23', unit: '个', trend: 4, color: 'var(--sc-medium, #f59e0b)' },
    { label: '关键供应商', value: '12', unit: '家', trend: 0, color: 'var(--sc-info, #3b82f6)' },
  ],
  vendorRisk: [
    { name: '高风险', value: 5, color: '#ef4444' },
    { name: '中风险', value: 18, color: '#f59e0b' },
    { name: '低风险', value: 87, color: '#22c55e' },
    { name: '未评估', value: 12, color: '#6b7280' },
  ],
  topVendors: [
    { id: 'v1', label: 'AWS 云服务', value: '95%', severity: 'low' as const, trend: 'flat' as const },
    { id: 'v2', label: 'Microsoft 365', value: '92%', severity: 'low' as const, trend: 'down' as const },
    { id: 'v3', label: 'Oracle DB', value: '78%', severity: 'medium' as const, trend: 'up' as const },
    { id: 'v4', label: '第三方物流 API', value: '65%', severity: 'high' as const, trend: 'up' as const },
    { id: 'v5', label: '开源组件 npm', value: '82%', severity: 'medium' as const, trend: 'down' as const },
  ],
  vulnerabilityFlow: {
    nodes: [
      { name: '供应链' },
      { name: '构建系统' },
      { name: '部署' },
      { name: '生产' },
    ],
    links: [
      { source: 0, target: 1, value: 45 },
      { source: 1, target: 2, value: 32 },
      { source: 2, target: 3, value: 28 },
    ],
    colors: ['#3b82f6', '#8b5cf6', '#06b6d4', '#22c55e'],
  },
};
