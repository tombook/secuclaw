/**
 * SecuClaw 内置工具 Manifest 注册表
 * 11 个内置工具的声明式配置
 */

import type { ToolPluginManifest } from '../types';

// ─── 安全运营 ─────────────────────────────────────────
const alertQueue: ToolPluginManifest = {
  meta: { id: 'alert-queue', name: '告警队列', icon: 'BellRing', uri: '/tool/alert-queue', version: '2.0.0', category: 'monitoring', provider: 'built-in', description: '实时安全告警队列，支持按优先级筛选和批量处置 + 趋势图', enabled: true, createdAt: 1716134400000, updatedAt: 1716134400000 },
  ui: {
    panelMode: 'slide', width: 420,
    form: [
      { name: 'severity', label: '优先级筛选', type: 'select', options: [{ value: 'all', label: '全部' }, { value: 'P1', label: 'P1 紧急' }, { value: 'P2', label: 'P2 高' }, { value: 'P3', label: 'P3 中' }, { value: 'P4', label: 'P4 低' }], defaultValue: 'all' },
      { name: 'type', label: '告警类型', type: 'select', options: [{ value: 'all', label: '全部' }, { value: 'lateral', label: '横向移动' }, { value: 'dns-tunnel', label: 'DNS 隧道' }, { value: 'bruteforce', label: '暴力破解' }] },
    ],
    result: {
      type: 'composite',
      summaryBar: [
        { field: 'total', label: '总告警', icon: '🔔', color: '#f59e0b' },
        { field: 'P1', label: 'P1 紧急', icon: '🔴', color: '#ef4444' },
        { field: 'P2', label: 'P2 高', icon: '🟠', color: '#f97316' },
        { field: 'P3', label: 'P3 中', icon: '🔵', color: '#3b82f6' },
        { field: 'pending', label: '待处理', icon: '⏳', color: '#f59e0b' },
      ],
      sections: [
        { id: 'alerts', title: '📋 告警列表', layout: 'full', display: { type: 'table', columns: [
          { field: 'id', label: 'ID', type: 'text', width: '60px' },
          { field: 'severity', label: '级别', type: 'badge', width: '40px', colorRule: { field: 'severity', rules: [{ condition: 'eq', value: 'P1', color: '#ef4444' }, { condition: 'eq', value: 'P2', color: '#f59e0b' }, { condition: 'eq', value: 'P3', color: '#3b82f6' }, { condition: 'eq', value: 'P4', color: '#6b7280' }] } },
          { field: 'source', label: '来源', type: 'tag', width: '80px' },
          { field: 'type', label: '类型', type: 'text', width: '70px' },
          { field: 'time', label: '时间', type: 'text', width: '60px' },
          { field: 'status', label: '状态', type: 'badge', width: '50px', colorRule: { field: 'status', rules: [{ condition: 'eq', value: '待处理', color: '#f59e0b' }, { condition: 'eq', value: '处理中', color: '#3b82f6' }, { condition: 'eq', value: '已处理', color: '#22c55e' }] } },
        ], emptyText: '当前无待处理告警' } },
        { id: 'trend', title: '📈 近1h趋势', layout: 'full', display: { type: 'chart', chartConfig: { chartType: 'bar', chartTitle: '近1h告警趋势', xField: 'time', yField: 'count', categoryField: 'severity' } } },
      ],
    },
  },
  api: { endpoint: '/api/v1/alerts', method: 'GET', adapter: 'default', auth: { type: 'bearer', tokenSource: 'session' }, timeout: 10000, mockFn: 'alert-queue' },
  schema: {
    input: { type: 'object', properties: { severity: { type: 'string' }, type: { type: 'string' } } },
    output: { type: 'object', properties: { rows: { type: 'array' }, summary: { type: 'object' } } },
  },
  bindings: {
    roles: [{ roleId: 'security-ops', priority: 1, group: 'core' }],
    metrics: [{ metricId: 'pending-alerts', delta: -1 }, { metricId: 'soar-rate', delta: 2 }],
    raci: [{ type: 'R', autoCreateTask: true, taskTitleTemplate: '响应 {{form.severity}} 告警' }],
  },
};

const soarExec: ToolPluginManifest = {
  meta: { id: 'soar-exec', name: 'SOAR 剧本执行', icon: 'Play', uri: '/tool/soar-exec', version: '2.0.0', category: 'automation', provider: 'built-in', description: '自动化安全编排剧本执行 + 步骤进度 + 响应效果统计', enabled: true, createdAt: 1716134400000, updatedAt: 1716134400000 },
  ui: {
    panelMode: 'modal', width: 560,
    form: [
      { name: 'playbook', label: '选择剧本', type: 'select', required: true, options: [{ value: 'trojan-contain', label: '木马遏制剧本' }, { value: 'dns-block', label: 'DNS 隧道封堵' }, { value: 'lateral-isolate', label: '横向移动隔离' }] },
      { name: 'target', label: '目标资产', type: 'text', required: true, placeholder: '输入 IP 地址' },
    ],
    result: {
      type: 'composite',
      summaryBar: [
        { field: 'total', label: '执行步骤', icon: '📋', color: '#3b82f6' },
        { field: 'success', label: '成功', icon: '✅', color: '#22c55e' },
        { field: 'failed', label: '失败', icon: '❌', color: '#ef4444' },
        { field: 'duration', label: '耗时', icon: '⏱', color: '#f59e0b' },
      ],
      sections: [
        { id: 'timeline', title: '📋 执行时间线', layout: 'full', display: { type: 'timeline', columns: [{ field: 'time', label: '时间' }, { field: 'title', label: '步骤' }, { field: 'description', label: '详情' }] } },
        { id: 'results', title: '📋 执行详情', layout: 'full', display: { type: 'table', columns: [
          { field: 'step', label: '步骤', type: 'text', width: '100px' },
          { field: 'action', label: '动作', type: 'text' },
          { field: 'target', label: '目标', type: 'tag', width: '100px' },
          { field: 'status', label: '状态', type: 'badge', width: '60px', colorRule: { field: 'status', rules: [{ condition: 'eq', value: '成功', color: '#22c55e' }, { condition: 'eq', value: '失败', color: '#ef4444' }, { condition: 'eq', value: '跳过', color: '#64748b' }] } },
          { field: 'result', label: '结果' },
        ], emptyText: '等待执行' } },
      ],
    },
  },
  api: { endpoint: '/api/v1/soar/execute', method: 'POST', adapter: 'default', auth: { type: 'bearer', tokenSource: 'session' }, timeout: 30000, mockFn: 'soar-exec' },
  schema: { input: { type: 'object', properties: { playbook: { type: 'string' }, target: { type: 'string' } } }, output: { type: 'object', properties: { rows: { type: 'array' }, summary: { type: 'object' } } } },
  bindings: { roles: [{ roleId: 'security-ops', priority: 3, group: 'core' }], metrics: [{ metricId: 'pending-alerts', delta: -3 }, { metricId: 'soar-rate', delta: 5 }] },
};

// ─── 安全专家 ─────────────────────────────────────────
const vulnScan: ToolPluginManifest = {
  meta: { id: 'vuln-scan', name: '漏洞扫描', icon: 'ShieldAlert', uri: '/tool/vuln-scan', version: '2.0.0', category: 'vulnerability-mgmt', provider: 'built-in', description: '对目标资产进行漏洞扫描，返回 CVE 列表、CVSS 评分和漏洞分布图', enabled: true, createdAt: 1716134400000, updatedAt: 1716134400000 },
  ui: {
    panelMode: 'modal', width: 580,
    form: [
      { name: 'target', label: '扫描目标', type: 'text', required: true, placeholder: 'IP / 域名 / 网段', group: '基本配置' },
      { name: 'scanType', label: '扫描类型', type: 'select', defaultValue: 'quick', options: [{ value: 'quick', label: '快速扫描' }, { value: 'full', label: '全量扫描' }, { value: 'compliance', label: '合规扫描' }], group: '基本配置' },
      { name: 'severity', label: '严重级别', type: 'multiselect', options: [{ value: 'critical', label: 'Critical (9.0+)' }, { value: 'high', label: 'High (7.0-8.9)' }, { value: 'medium', label: 'Medium (4.0-6.9)' }], group: '过滤' },
    ],
    result: {
      type: 'composite',
      summaryBar: [
        { field: 'total', label: '漏洞总数', icon: '🔍', color: '#f59e0b' },
        { field: 'critical', label: '严重', icon: '🔴', color: '#ef4444' },
        { field: 'high', label: '高危', icon: '🟠', color: '#f97316' },
        { field: 'exploitable', label: '可利用', icon: '⚠️', color: '#ef4444' },
      ],
      sections: [
        { id: 'distribution', title: '🍩 漏洞严重度分布', layout: 'full', display: { type: 'chart', chartConfig: { chartType: 'pie', title: '漏洞严重度分布', valueField: 'count', categoryField: 'severity', showLegend: true, showLabels: true, colors: ['#ef4444', '#f97316', '#ffc107', '#22c55e'] } } },
        { id: 'vulns', title: '📋 漏洞清单', layout: 'full', display: { type: 'table', columns: [
          { field: 'cve', label: 'CVE ID', type: 'link', width: '120px', sortable: true },
          { field: 'cvss', label: 'CVSS', type: 'score', width: '60px', sortable: true, colorRule: { field: 'cvss', rules: [{ condition: 'gte', value: 9, color: '#ef4444' }, { condition: 'gte', value: 7, color: '#f59e0b' }, { condition: 'gte', value: 4, color: '#3b82f6' }, { condition: 'lt', value: 4, color: '#22c55e' }] } },
          { field: 'desc', label: '描述', type: 'text' },
          { field: 'asset', label: '影响资产', type: 'tag', width: '110px' },
          { field: 'status', label: '状态', type: 'badge', width: '70px', colorRule: { field: 'status', rules: [{ condition: 'eq', value: '未修复', color: '#ef4444' }, { condition: 'eq', value: '修复中', color: '#f59e0b' }, { condition: 'eq', value: '已修复', color: '#22c55e' }] } },
        ], emptyText: '未发现漏洞' } },
      ],
    },
  },
  api: { endpoint: '/api/v1/vuln/scan', method: 'POST', adapter: 'default', auth: { type: 'bearer', tokenSource: 'session' }, timeout: 30000, mockFn: 'vuln-scan' },
  schema: { input: { type: 'object', properties: { target: { type: 'string' }, scanType: { type: 'string' } } }, output: { type: 'object', properties: { rows: { type: 'array' }, summary: { type: 'object' } } } },
  bindings: { roles: [{ roleId: 'security-expert', priority: 1, group: 'core' }], metrics: [{ metricId: 'vuln-count', delta: -2 }, { metricId: 'patch-rate', delta: 3 }] },
};

const threatIntel: ToolPluginManifest = {
  meta: { id: 'threat-intel', name: '威胁情报查询', icon: 'Radio', uri: '/tool/threat-intel', version: '2.0.0', category: 'intelligence', provider: 'built-in', description: 'IOC/哈希/IP/域名情报查询 + MITRE ATT&CK 映射 + 关联分析', enabled: true, createdAt: 1716134400000, updatedAt: 1716134400000 },
  ui: {
    panelMode: 'slide', width: 420,
    form: [
      { name: 'query', label: '搜索', type: 'text', required: true, placeholder: 'IOC / 哈希 / IP / 域名 / ATT&CK Technique ID' },
      { name: 'source', label: '情报源', type: 'multiselect', options: [{ value: 'internal', label: '内部情报库' }, { value: 'mitre', label: 'MITRE ATT&CK' }, { value: 'virustotal', label: 'VirusTotal' }] },
      { name: 'tactic', label: 'ATT&CK 战术', type: 'select', options: [{ value: 'all', label: '全部战术' }, { value: 'initial-access', label: '初始访问' }, { value: 'execution', label: '执行' }, { value: 'persistence', label: '持久化' }, { value: 'privilege-escalation', label: '权限提升' }, { value: 'defense-evasion', label: '防御规避' }, { value: 'lateral-movement', label: '横向移动' }, { value: 'exfiltration', label: '数据渗出' }] },
    ],
    result: {
      type: 'composite',
      summaryBar: [
        { field: 'total', label: '情报条目', icon: '🔍', color: '#3b82f6' },
        { field: 'high', label: '高危', icon: '🔴', color: '#ef4444' },
        { field: 'mitreMatch', label: 'MITRE 匹配', icon: '🎯', color: '#8b5cf6' },
        { field: 'confidence', label: '平均置信度', icon: '📊', color: '#22c55e' },
      ],
      sections: [
        { id: 'intel', title: '📋 情报详情', layout: 'full', display: { type: 'table', columns: [
          { field: 'type', label: '类型', type: 'tag', width: '80px' },
          { field: 'name', label: '名称/技术' },
          { field: 'confidence', label: '置信度', type: 'badge', width: '55px', colorRule: { field: 'confidence', rules: [{ condition: 'gte', value: '90', color: '#22c55e' }, { condition: 'gte', value: '80', color: '#3b82f6' }] } },
          { field: 'desc', label: '描述' },
        ] } },
        { id: 'cards', title: '📊 MITRE 映射', layout: 'full', display: { type: 'cards', cardFields: { title: 'technique', subtitle: 'tactic', badges: ['severity'], description: 'description' } } },
      ],
    },
  },
  api: { endpoint: '/api/v1/threat-intel/search', method: 'POST', adapter: 'default', auth: { type: 'bearer', tokenSource: 'session' }, timeout: 10000, mockFn: 'threat-intel' },
  schema: { input: { type: 'object', properties: { query: { type: 'string' }, source: { type: 'array' } } }, output: { type: 'object', properties: { rows: { type: 'array' }, summary: { type: 'object' } } } },
  bindings: { roles: [{ roleId: 'security-expert', priority: 2, group: 'core' }], metrics: [{ metricId: 'intel-match', delta: 5 }] },
};

// ─── 安全指挥官 ───────────────────────────────────────
const globalSituation: ToolPluginManifest = {
  meta: { id: 'global-situation', name: '全域态势', icon: 'Globe', uri: '/tool/global-situation', version: '2.0.0', category: 'monitoring', provider: 'built-in', description: '8 角色实时安全态势聚合 + 健康度雷达 + 角色状态卡片', enabled: true, createdAt: 1716134400000, updatedAt: 1716134400000 },
  ui: {
    panelMode: 'fullscreen',
    form: [
      { name: 'timeRange', label: '时间范围', type: 'select', options: [{ value: '1h', label: '最近 1 小时' }, { value: '24h', label: '最近 24 小时' }, { value: '7d', label: '最近 7 天' }] },
    ],
    result: {
      type: 'composite',
      summaryBar: [
        { field: 'totalRoles', label: '监控角色', icon: '👥', color: '#3b82f6' },
        { field: 'healthy', label: '健康', icon: '✅', color: '#22c55e' },
        { field: 'warning', label: '告警', icon: '⚠️', color: '#f59e0b' },
        { field: 'danger', label: '危险', icon: '🔴', color: '#ef4444' },
      ],
      sections: [
        { id: 'radar', title: '📊 角色健康度', layout: 'full', display: { type: 'radar', chartConfig: { chartType: 'radar', title: '8 角色健康度', labels: ['CISO', '指挥官', '运营', '专家', '架构师', '隐私官', '业务安全', '供应链'], scoreField: 'score', maxValue: 100 } } },
        { id: 'roles', title: '📋 角色状态', layout: 'full', display: { type: 'cards', cardFields: { title: 'role', subtitle: 'score', badges: ['health'], description: 'status' } } },
        { id: 'table', title: '📋 详细状态', layout: 'full', display: { type: 'table', columns: [
          { field: 'role', label: '角色', type: 'text', width: '100px' },
          { field: 'status', label: '当前状态', type: 'text', width: '100px' },
          { field: 'health', label: '健康度', type: 'badge', width: '70px', colorRule: { field: 'health', rules: [{ condition: 'eq', value: 'danger', color: '#ef4444' }, { condition: 'eq', value: 'warning', color: '#f59e0b' }, { condition: 'eq', value: 'normal', color: '#22c55e' }] } },
        ], emptyText: '无数据' } },
      ],
    },
  },
  api: { endpoint: '/api/v1/situation', method: 'GET', adapter: 'default', auth: { type: 'bearer', tokenSource: 'session' }, timeout: 10000, mockFn: 'global-situation' },
  schema: { input: { type: 'object', properties: { timeRange: { type: 'string' } } }, output: { type: 'object', properties: { rows: { type: 'array' }, summary: { type: 'object' } } } },
  bindings: { roles: [{ roleId: 'secuclaw-commander', priority: 1, group: 'core' }] },
};

// ─── CISO ─────────────────────────────────────────────
const riskScore: ToolPluginManifest = {
  meta: { id: 'risk-score', name: '风险评分板', icon: 'BarChart3', uri: '/tool/risk-score', version: '2.0.0', category: 'risk-assessment', provider: 'built-in', description: '四维风险评估：技术/合规/运营/战略 + SCF 17域雷达图', enabled: true, createdAt: 1716134400000, updatedAt: 1716134400000 },
  ui: {
    panelMode: 'modal', width: 580,
    form: [
      { name: 'dimensions', label: '评估维度', type: 'multiselect', options: [{ value: 'tech', label: '技术风险' }, { value: 'compliance', label: '合规风险' }, { value: 'ops', label: '运营风险' }, { value: 'strategy', label: '战略风险' }], defaultValue: ['tech', 'compliance', 'ops', 'strategy'] },
      { name: 'period', label: '时间范围', type: 'select', options: [{ value: 'quarter', label: '当前季度' }, { value: 'half', label: '半年' }, { value: 'annual', label: '年度' }], defaultValue: 'quarter' },
    ],
    result: {
      type: 'composite',
      summaryBar: [
        { field: 'overall', label: '综合风险', icon: '📊', color: '#f59e0b' },
        { field: 'trend', label: '趋势', icon: '📉', color: '#22c55e' },
        { field: 'scfCoverage', label: 'SCF 覆盖', icon: '🛡', color: '#3b82f6' },
        { field: 'mitreCoverage', label: 'MITRE 覆盖', icon: '🎯', color: '#8b5cf6' },
      ],
      sections: [
        { id: 'gauge', title: '📊 四维风险评估', layout: 'full', display: { type: 'chart', chartConfig: { chartType: 'gauge', title: '四维风险评分', yField: 'score', chartTitle: '四维风险评分' } } },
        { id: 'radar', title: '🎯 SCF 域覆盖度', layout: 'full', display: { type: 'radar', chartConfig: { chartType: 'radar', title: 'SCF 17域覆盖度', labels: ['GOV', 'AC', 'AT', 'AU', 'CA', 'CM', 'CP', 'IA', 'IR', 'MP', 'PL', 'PRV', 'RA', 'SA', 'SC', 'SI', 'PM'], scoreField: 'score', maxValue: 100 } } },
        { id: 'trend', title: '📈 风险趋势', layout: 'full', display: { type: 'chart', chartConfig: { chartType: 'bar', chartTitle: '近4季度风险评分', xField: 'quarter', yField: 'score', categoryField: 'dimension', series: [{ field: 'tech', name: '技术', color: '#ef4444' }, { field: 'compliance', name: '合规', color: '#3b82f6' }] } } },
      ],
    },
  },
  api: { endpoint: '/api/v1/risk/score', method: 'GET', adapter: 'default', auth: { type: 'bearer', tokenSource: 'session' }, timeout: 10000, mockFn: 'risk-score' },
  schema: { input: { type: 'object', properties: { dimensions: { type: 'array' } } }, output: { type: 'object', properties: { rows: { type: 'array' }, summary: { type: 'object' } } } },
  bindings: { roles: [{ roleId: 'ciso', priority: 1, group: 'core' }, { roleId: 'secuclaw-commander', priority: 2, group: 'core' }, { roleId: 'business-security-officer', priority: 2, group: 'core' }] },
};

const boardReport: ToolPluginManifest = {
  meta: { id: 'board-report', name: '董事会报告', icon: 'FileText', uri: '/tool/board-report', version: '2.0.0', category: 'reporting', provider: 'built-in', description: '生成季度/年度/专项安全报告 + 核心指标摘要 + 风险趋势', enabled: true, createdAt: 1716134400000, updatedAt: 1716134400000 },
  ui: {
    panelMode: 'modal', width: 580,
    form: [
      { name: 'template', label: '报告模板', type: 'select', options: [{ value: 'quarterly', label: '季度报告' }, { value: 'annual', label: '年度报告' }, { value: 'incident', label: '专项事件报告' }] },
      { name: 'modules', label: '包含模块', type: 'multiselect', options: [{ value: 'risk', label: '风险评分' }, { value: 'kpi', label: 'KPI 指标' }, { value: 'incidents', label: '重大事件' }, { value: 'budget', label: '预算使用' }] },
    ],
    result: {
      type: 'composite',
      summaryBar: [
        { field: 'riskScore', label: '风险评分', icon: '📊', color: '#f59e0b' },
        { field: 'kpiRate', label: 'KPI 达成', icon: '🎯', color: '#22c55e' },
        { field: 'incidents', label: '重大事件', icon: '🚨', color: '#ef4444' },
        { field: 'budgetUsage', label: '预算使用', icon: '💰', color: '#3b82f6' },
      ],
      sections: [
        { id: 'summary', title: '📊 核心指标', layout: 'full', display: { type: 'cards', cardFields: { title: 'module', subtitle: 'value', badges: ['trend'], description: 'detail' } } },
        { id: 'timeline', title: '📋 关键时间线', layout: 'full', display: { type: 'timeline', columns: [{ field: 'time', label: '时间' }, { field: 'title', label: '事件' }, { field: 'description', label: '详情' }] } },
      ],
    },
  },
  api: { endpoint: '/api/v1/report/generate', method: 'POST', adapter: 'default', auth: { type: 'bearer', tokenSource: 'session' }, timeout: 20000, mockFn: 'board-report' },
  schema: { input: { type: 'object', properties: { template: { type: 'string' }, modules: { type: 'array' } } }, output: { type: 'object', properties: { rows: { type: 'array' } } } },
  bindings: { roles: [{ roleId: 'ciso', priority: 4, group: 'core' }] },
};

// ─── 隐私官 ───────────────────────────────────────────
const complianceChk: ToolPluginManifest = {
  meta: { id: 'compliance-chk', name: '合规检查', icon: 'FileCheck', uri: '/tool/compliance-chk', version: '2.0.0', category: 'compliance', provider: 'built-in', description: 'GDPR/PIPL/CCPA 合规检查 + 雷达图 + SCF 控制映射', enabled: true, createdAt: 1716134400000, updatedAt: 1716134400000 },
  ui: {
    panelMode: 'modal', width: 580,
    form: [
      { name: 'regulation', label: '法规选择', type: 'select', options: [{ value: 'gdpr', label: 'GDPR' }, { value: 'pipl', label: 'PIPL' }, { value: 'ccpa', label: 'CCPA' }, { value: 'scf', label: 'SCF 全域' }], defaultValue: 'gdpr' },
      { name: 'scfDomain', label: 'SCF 控制域', type: 'select', options: [{ value: 'PRI', label: 'PRI 数据隐私' }, { value: 'CPL', label: 'CPL 合规管理' }, { value: 'GOV', label: 'GOV 安全治理' }, { value: 'DCH', label: 'DCH 数据分类' }, { value: 'TPM', label: 'TPM 第三方管理' }], defaultValue: 'PRI' },
      { name: 'scope', label: '检查范围', type: 'select', options: [{ value: 'full', label: '全量检查' }, { value: 'sample', label: '抽样检查' }] },
    ],
    result: {
      type: 'composite',
      summaryBar: [
        { field: 'score', label: '合规度', icon: '🛡', color: '#3b82f6' },
        { field: 'pass', label: '已达标', icon: '✅', color: '#22c55e' },
        { field: 'fail', label: '未达标', icon: '❌', color: '#ef4444' },
        { field: 'pending', label: '整改中', icon: '⚠️', color: '#f59e0b' },
      ],
      sections: [
        { id: 'radar', title: '📊 合规覆盖度', layout: 'full', display: { type: 'radar', chartConfig: { chartType: 'radar', title: '合规域覆盖度', labels: ['数据保护', '访问控制', '事件响应', '审计日志', '隐私政策', '跨境传输', '同意管理'], scoreField: 'score', maxValue: 100 } } },
        { id: 'checklist', title: '📋 检查清单', layout: 'full', display: { type: 'table', columns: [
          { field: 'item', label: '检查项', type: 'text' },
          { field: 'regulation', label: '法规条款', type: 'tag', width: '90px' },
          { field: 'status', label: '状态', type: 'badge', width: '70px', colorRule: { field: 'status', rules: [{ condition: 'eq', value: '通过', color: '#22c55e' }, { condition: 'eq', value: '未通过', color: '#ef4444' }, { condition: 'eq', value: '整改中', color: '#f59e0b' }] } },
          { field: 'detail', label: '详情', type: 'text' },
        ] } },
      ],
    },
  },
  api: { endpoint: '/api/v1/compliance/check', method: 'POST', adapter: 'default', auth: { type: 'bearer', tokenSource: 'session' }, timeout: 15000, mockFn: 'compliance-chk' },
  schema: { input: { type: 'object', properties: { regulation: { type: 'string' }, scope: { type: 'string' } } }, output: { type: 'object', properties: { rows: { type: 'array' }, summary: { type: 'object' } } } },
  bindings: { roles: [{ roleId: 'privacy-officer', priority: 1, group: 'core' }, { roleId: 'ciso', priority: 2, group: 'core' }, { roleId: 'security-architect', priority: 2, group: 'core' }, { roleId: 'supply-chain-security', priority: 2, group: 'core' }], metrics: [{ metricId: 'gdpr-rate', delta: 2 }, { metricId: 'dpia-rate', delta: 5 }] },
};

// ─── 安全架构师 ───────────────────────────────────────
const threatModel: ToolPluginManifest = {
  meta: { id: 'threat-model', name: '威胁建模 STRIDE', icon: 'AlertTriangle', uri: '/tool/threat-model', version: '2.0.0', category: 'architecture', provider: 'built-in', description: 'STRIDE 威胁建模分析 + MITRE ATT&CK 映射', enabled: true, createdAt: 1716134400000, updatedAt: 1716134400000 },
  ui: {
    panelMode: 'modal', width: 600,
    form: [
      { name: 'system', label: '系统名称', type: 'text', required: true, placeholder: '输入目标系统名称' },
      { name: 'dimensions', label: 'STRIDE 维度', type: 'multiselect', options: [{ value: 'S', label: '伪造 (Spoofing)' }, { value: 'T', label: '篡改 (Tampering)' }, { value: 'R', label: '否认 (Repudiation)' }, { value: 'I', label: '信息泄露 (Info Disclosure)' }, { value: 'D', label: '拒绝服务 (DoS)' }, { value: 'E', label: '提权 (Elevation)' }] },
    ],
    result: {
      type: 'composite',
      summaryBar: [
        { field: 'total', label: '威胁总数', icon: '⚡', color: '#f59e0b' },
        { field: 'high', label: '高风险', icon: '🔴', color: '#ef4444' },
        { field: 'mitigated', label: '已缓解', icon: '✅', color: '#22c55e' },
        { field: 'mitreMatch', label: 'MITRE 映射', icon: '🎯', color: '#8b5cf6' },
      ],
      sections: [
        { id: 'stride-radar', title: '🎯 STRIDE 六维分析', layout: 'full', display: { type: 'radar', chartConfig: { chartType: 'radar', title: 'STRIDE 威胁覆盖度', labels: ['S 伪造', 'T 篡改', 'R 抵赖', 'I 泄露', 'D 拒绝服务', 'E 提权'], scoreField: 'score', maxValue: 100 } } },
        { id: 'threats', title: '📋 威胁清单', layout: 'full', display: { type: 'table', columns: [
          { field: 'threat', label: '威胁类型', type: 'text', width: '120px' },
          { field: 'component', label: '影响组件', type: 'tag', width: '130px' },
          { field: 'risk', label: '风险等级', type: 'badge', width: '70px', colorRule: { field: 'risk', rules: [{ condition: 'eq', value: '高', color: '#ef4444' }, { condition: 'eq', value: '中', color: '#f59e0b' }, { condition: 'eq', value: '低', color: '#22c55e' }] } },
          { field: 'mitigation', label: '缓解建议', type: 'text' },
        ] } },
        { id: 'mitre-mapping', title: '🎯 MITRE ATT&CK 映射', layout: 'full', display: { type: 'cards', cardFields: { title: 'technique', subtitle: 'tactic', badges: ['severity'], description: 'mapping' } } },
      ],
    },
  },
  api: { endpoint: '/api/v1/threat-model/stride', method: 'POST', adapter: 'default', auth: { type: 'bearer', tokenSource: 'session' }, timeout: 15000, mockFn: 'threat-model' },
  schema: { input: { type: 'object', properties: { system: { type: 'string' }, dimensions: { type: 'array' } } }, output: { type: 'object', properties: { rows: { type: 'array' }, summary: { type: 'object' } } } },
  bindings: { roles: [{ roleId: 'security-architect', priority: 1, group: 'core' }], metrics: [{ metricId: 'stride-coverage', delta: 3 }, { metricId: 'arch-risk', delta: -1 }] },
};

// ─── 业务安全官 ───────────────────────────────────────
const bcpMgmt: ToolPluginManifest = {
  meta: { id: 'bcp-mgmt', name: 'BCP 管理', icon: 'ShieldCheck', uri: '/tool/bcp-mgmt', version: '2.0.0', category: 'business-continuity', provider: 'built-in', description: '业务连续性演练计划管理 + RTO/RPO 监控 + 演练时间线', enabled: true, createdAt: 1716134400000, updatedAt: 1716134400000 },
  ui: {
    panelMode: 'modal', width: 560,
    form: [
      { name: 'planType', label: '计划类型', type: 'select', options: [{ value: 'bcp', label: 'BCP 业务连续性' }, { value: 'drp', label: 'DRP 灾难恢复' }] },
      { name: 'drillType', label: '演练方式', type: 'select', options: [{ value: 'tabletop', label: '桌面推演' }, { value: 'simulation', label: '模拟演练' }, { value: 'full', label: '全量演练' }] },
    ],
    result: {
      type: 'composite',
      summaryBar: [
        { field: 'rto', label: '平均RTO', icon: '⏱', color: '#f59e0b' },
        { field: 'rpo', label: '平均RPO', icon: '📊', color: '#3b82f6' },
        { field: 'passRate', label: '达标率', icon: '✅', color: '#22c55e' },
        { field: 'lastDrill', label: '上次演练', icon: '📅', color: '#64748b' },
      ],
      sections: [
        { id: 'rto-rpo', title: '📊 RTO/RPO 达标情况', layout: 'full', display: { type: 'chart', chartConfig: { chartType: 'bar', chartTitle: '各业务线 RTO/RPO 对比', xField: 'business', yField: 'hours', categoryField: 'metric', series: [{ field: 'rtoTarget', name: 'RTO目标', color: '#22c55e' }, { field: 'rtoActual', name: 'RTO实际', color: '#f59e0b' }] } } },
        { id: 'timeline', title: '📋 演练步骤', layout: 'full', display: { type: 'timeline', columns: [{ field: 'time', label: '时间' }, { field: 'title', label: '步骤' }, { field: 'description', label: '详情' }] } },
        { id: 'results', title: '📋 演练结果', layout: 'full', display: { type: 'table', columns: [
          { field: 'step', label: '步骤', type: 'text', width: '140px' },
          { field: 'status', label: '状态', type: 'badge', width: '70px', colorRule: { field: 'status', rules: [{ condition: 'eq', value: '已完成', color: '#22c55e' }, { condition: 'eq', value: '进行中', color: '#3b82f6' }, { condition: 'eq', value: '待执行', color: '#6b7280' }] } },
          { field: 'rto', label: 'RTO 目标', type: 'text', width: '70px' },
          { field: 'actual', label: '实际耗时', type: 'text', width: '70px' },
        ] } },
      ],
    },
  },
  api: { endpoint: '/api/v1/bcp/drill', method: 'POST', adapter: 'default', auth: { type: 'bearer', tokenSource: 'session' }, timeout: 20000, mockFn: 'bcp-mgmt' },
  schema: { input: { type: 'object', properties: { planType: { type: 'string' }, drillType: { type: 'string' } } }, output: { type: 'object', properties: { rows: { type: 'array' }, summary: { type: 'object' } } } },
  bindings: { roles: [{ roleId: 'business-security-officer', priority: 1, group: 'core' }], metrics: [{ metricId: 'rto-rate', delta: 2 }, { metricId: 'bcp-coverage', delta: 3 }] },
};

// ─── 供应链安全 ───────────────────────────────────────
const sbomScan: ToolPluginManifest = {
  meta: { id: 'sbom-scan', name: 'SBOM 扫描', icon: 'PackageSearch', uri: '/tool/sbom-scan', version: '2.0.0', category: 'supply-chain', provider: 'built-in', description: '软件物料清单扫描 + 组件漏洞分布图 + 依赖链时间线', enabled: true, createdAt: 1716134400000, updatedAt: 1716134400000 },
  ui: {
    panelMode: 'modal', width: 580,
    form: [
      { name: 'vendor', label: '供应商', type: 'text', placeholder: '输入供应商名称' },
      { name: 'depth', label: '扫描深度', type: 'select', options: [{ value: 'shallow', label: '浅层扫描' }, { value: 'deep', label: '深度扫描' }, { value: 'compliance', label: '合规扫描' }], defaultValue: 'deep' },
    ],
    result: {
      type: 'composite',
      summaryBar: [
        { field: 'components', label: '组件总数', icon: '📦', color: '#3b82f6' },
        { field: 'vulnComponents', label: '漏洞组件', icon: '🔴', color: '#ef4444' },
        { field: 'critical', label: '高危', icon: '⚠️', color: '#ef4444' },
        { field: 'licenseRisk', label: '许可证风险', icon: '📜', color: '#f59e0b' },
      ],
      sections: [
        { id: 'dist', title: '📊 组件类型分布', layout: 'full', display: { type: 'chart', chartConfig: { chartType: 'pie', title: '组件类型分布', valueField: 'count', categoryField: 'type', showLegend: true, colors: ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#64748b'] } } },
        { id: 'vulns', title: '📋 漏洞组件清单', layout: 'full', display: { type: 'table', columns: [
          { field: 'component', label: '组件', type: 'text', width: '120px', sortable: true },
          { field: 'version', label: '版本', type: 'tag', width: '70px' },
          { field: 'license', label: '许可证', type: 'text', width: '90px' },
          { field: 'vulns', label: '漏洞数', type: 'score', width: '60px', colorRule: { field: 'vulns', rules: [{ condition: 'gte', value: 3, color: '#ef4444' }, { condition: 'gte', value: 1, color: '#f59e0b' }, { condition: 'eq', value: 0, color: '#22c55e' }] } },
          { field: 'risk', label: '风险', type: 'badge', width: '60px', colorRule: { field: 'risk', rules: [{ condition: 'eq', value: '高危', color: '#ef4444' }, { condition: 'eq', value: '中危', color: '#f59e0b' }, { condition: 'eq', value: '低危', color: '#22c55e' }] } },
        ] } },
      ],
    },
  },
  api: { endpoint: '/api/v1/sbom/scan', method: 'POST', adapter: 'default', auth: { type: 'bearer', tokenSource: 'session' }, timeout: 30000, mockFn: 'sbom-scan' },
  schema: { input: { type: 'object', properties: { vendor: { type: 'string' }, depth: { type: 'string' } } }, output: { type: 'object', properties: { rows: { type: 'array' }, summary: { type: 'object' } } } },
  bindings: { roles: [{ roleId: 'supply-chain-security', priority: 1, group: 'core' }], metrics: [{ metricId: 'sbom-coverage', delta: 8 }, { metricId: 'third-party-vulns', delta: -2 }] },
};

// ─── security-expert: 渗透测试 ──────────────────────

const penetrationTest: ToolPluginManifest = {
  meta: { id: 'pen-test', name: '渗透测试', icon: 'Sword', uri: '/tool/pen-test', version: '2.0.0', category: 'vulnerability-mgmt', provider: 'built-in', description: '渗透测试 + 漏洞严重度分布 + 攻击路径时间线', enabled: true, createdAt: 1716134400000, updatedAt: 1716134400000 },
  ui: {
    panelMode: 'modal', width: 600,
    form: [
      { name: 'target', label: '测试目标', type: 'text', required: true, placeholder: 'IP 或域名' },
      { name: 'type', label: '测试类型', type: 'select', options: [{ value: 'full', label: '全面测试' }, { value: 'web', label: 'Web 应用' }, { value: 'network', label: '网络层' }, { value: 'social', label: '社会工程' }] },
      { name: 'intensity', label: '强度', type: 'select', options: [{ value: 'low', label: '低 (被动扫描)' }, { value: 'medium', label: '中 (常规测试)' }, { value: 'high', label: '高 (深度利用)' }] },
    ],
    result: {
      type: 'composite',
      summaryBar: [
        { field: 'total', label: '发现漏洞', icon: '🔍', color: '#f59e0b' },
        { field: 'critical', label: '严重', icon: '🔴', color: '#ef4444' },
        { field: 'exploitable', label: '可利用', icon: '⚠️', color: '#ef4444' },
        { field: 'coverage', label: '覆盖率', icon: '📊', color: '#22c55e' },
      ],
      sections: [
        { id: 'dist', title: '🍩 严重度分布', layout: 'full', display: { type: 'chart', chartConfig: { chartType: 'pie', title: '漏洞严重度分布', valueField: 'count', categoryField: 'severity', showLegend: true, colors: ['#ef4444', '#f97316', '#3b82f6', '#22c55e'] } } },
        { id: 'timeline', title: '📋 攻击路径', layout: 'full', display: { type: 'timeline', columns: [{ field: 'time', label: '时间' }, { field: 'title', label: '步骤' }, { field: 'description', label: '详情' }] } },
        { id: 'vulns', title: '📋 漏洞清单', layout: 'full', display: { type: 'table', columns: [
          { field: 'vuln', label: '漏洞', type: 'text' },
          { field: 'severity', label: '严重性', type: 'badge', width: '60px', colorRule: { field: 'severity', rules: [{ condition: 'eq', value: '严重', color: '#ef4444' }, { condition: 'eq', value: '高危', color: '#f59e0b' }, { condition: 'eq', value: '中危', color: '#3b82f6' }] } },
          { field: 'vector', label: '攻击向量', type: 'tag', width: '80px' },
          { field: 'exploitable', label: '可利用', type: 'badge', width: '50px', colorRule: { field: 'exploitable', rules: [{ condition: 'eq', value: '是', color: '#ef4444' }, { condition: 'eq', value: '否', color: '#22c55e' }] } },
          { field: 'detail', label: '详情' },
        ] } },
      ],
    },
  },
  api: { endpoint: '/api/v1/pen/test', method: 'POST', adapter: 'default', auth: { type: 'bearer', tokenSource: 'session' }, timeout: 45000, mockFn: 'pen-test' },
  schema: { input: { type: 'object' }, output: { type: 'object' } },
  bindings: { roles: [{ roleId: 'security-expert', priority: 3, group: 'core' }], metrics: [{ metricId: 'vuln-count', delta: -1 }] },
};

// ─── privacy-officer: GDPR 审计 ──────────────────────

const gdprAudit: ToolPluginManifest = {
  meta: { id: 'gdpr-audit', name: 'GDPR 审计', icon: 'ScrollText', uri: '/tool/gdpr-audit', version: '2.0.0', category: 'compliance', provider: 'built-in', description: 'GDPR 合规性全面审计 + 雷达图 + SCF PRI 域映射', enabled: true, createdAt: 1716134400000, updatedAt: 1716134400000 },
  ui: {
    panelMode: 'modal', width: 600,
    form: [
      { name: 'scope', label: '审计范围', type: 'select', options: [{ value: 'all', label: '全部数据处理活动' }, { value: 'marketing', label: '营销数据处理' }, { value: 'hr', label: '人力资源数据' }, { value: 'third-party', label: '第三方数据传输' }] },
      { name: 'period', label: '审计周期', type: 'daterange' },
    ],
    result: {
      type: 'composite',
      summaryBar: [
        { field: 'compliance', label: '合规度', icon: '🛡', color: '#3b82f6' },
        { field: 'critical', label: '高风险项', icon: '🔴', color: '#ef4444' },
        { field: 'gaps', label: '合规缺口', icon: '⚠️', color: '#f59e0b' },
        { field: 'articles', label: '条款覆盖', icon: '📋', color: '#8b5cf6' },
      ],
      sections: [
        { id: 'radar', title: '📊 GDPR 各章合规度', layout: 'full', display: { type: 'radar', chartConfig: { chartType: 'radar', title: 'GDPR 合规覆盖度', labels: ['透明性', '同意管理', '数据主体权利', '数据保护', '泄露通知', 'DPO职责', '跨境传输'], scoreField: 'score', maxValue: 100 } } },
        { id: 'audit', title: '📋 审计结果', layout: 'full', display: { type: 'table', columns: [
          { field: 'article', label: 'GDPR 条款', width: '80px' },
          { field: 'requirement', label: '要求描述' },
          { field: 'status', label: '合规状态', type: 'badge', width: '70px', colorRule: { field: 'status', rules: [{ condition: 'eq', value: '合规', color: '#22c55e' }, { condition: 'eq', value: '部分合规', color: '#f59e0b' }, { condition: 'eq', value: '不合规', color: '#ef4444' }] } },
          { field: 'gap', label: '差距说明' },
          { field: 'priority', label: '优先级', type: 'badge', width: '50px' },
        ] } },
      ],
    },
  },
  api: { endpoint: '/api/v1/gdpr/audit', method: 'POST', adapter: 'default', auth: { type: 'bearer', tokenSource: 'session' }, timeout: 20000, mockFn: 'gdpr-audit' },
  schema: { input: { type: 'object' }, output: { type: 'object' } },
  bindings: { roles: [{ roleId: 'privacy-officer', priority: 5, group: 'core' }], metrics: [{ metricId: 'gdpr-rate', delta: 3 }] },
};

// ─── security-architect: 零信任评估 ──────────────────

const zeroTrustEval: ToolPluginManifest = {
  meta: { id: 'zero-trust', name: '零信任评估', icon: 'Fingerprint', uri: '/tool/zero-trust', version: '2.0.0', category: 'architecture', provider: 'built-in', description: '零信任架构 5 维成熟度评估 + 雷达图 + SCF 控制映射', enabled: true, createdAt: 1716134400000, updatedAt: 1716134400000 },
  ui: {
    panelMode: 'modal', width: 580,
    form: [
      { name: 'pillar', label: '评估维度', type: 'multiselect', options: [{ value: 'identity', label: '身份验证' }, { value: 'device', label: '设备信任' }, { value: 'network', label: '网络分段' }, { value: 'app', label: '应用安全' }, { value: 'data', label: '数据保护' }] },
    ],
    result: {
      type: 'composite',
      summaryBar: [
        { field: 'maturity', label: '成熟度', icon: '🏗', color: '#3b82f6' },
        { field: 'identity', label: '身份', icon: '👤', color: '#22c55e' },
        { field: 'network', label: '网络', icon: '🌐', color: '#f59e0b' },
        { field: 'gaps', label: '差距项', icon: '⚠️', color: '#ef4444' },
      ],
      sections: [
        { id: 'radar', title: '📊 零信任 5 维成熟度', layout: 'full', display: { type: 'radar', chartConfig: { chartType: 'radar', title: '零信任成熟度', labels: ['身份验证', '设备信任', '网络分段', '应用安全', '数据保护'], scoreField: 'score', maxValue: 100 } } },
        { id: 'details', title: '📋 各域评估详情', layout: 'full', display: { type: 'cards', cardFields: { title: 'pillar', subtitle: 'score', badges: ['level'], description: 'finding' } } },
      ],
    },
  },
  api: { endpoint: '/api/v1/zero-trust/eval', method: 'POST', adapter: 'default', auth: { type: 'bearer', tokenSource: 'session' }, timeout: 15000, mockFn: 'zero-trust' },
  schema: { input: { type: 'object' }, output: { type: 'object' } },
  bindings: { roles: [{ roleId: 'security-architect', priority: 4, group: 'core' }], metrics: [{ metricId: 'stride-coverage', delta: 2 }] },
};

// ─── business-security-officer: 报表生成 ──────────────

const reportGeneration: ToolPluginManifest = {
  meta: { id: 'report-gen', name: '报表生成', icon: 'FileBarChart', uri: '/tool/report-gen', version: '2.0.0', category: 'reporting', provider: 'built-in', description: '安全态势报表自动生成 + 核心指标卡片 + 时间线', enabled: true, createdAt: 1716134400000, updatedAt: 1716134400000 },
  ui: {
    panelMode: 'modal', width: 560,
    form: [
      { name: 'type', label: '报表类型', type: 'select', options: [{ value: 'monthly', label: '月度安全报告' }, { value: 'quarterly', label: '季度风险报告' }, { value: 'incident', label: '事件总结报告' }, { value: 'compliance', label: '合规审计报告' }] },
      { name: 'period', label: '时间范围', type: 'daterange' },
      { name: 'format', label: '输出格式', type: 'select', options: [{ value: 'pdf', label: 'PDF' }, { value: 'xlsx', label: 'Excel' }, { value: 'pptx', label: 'PPT' }] },
    ],
    result: {
      type: 'composite',
      summaryBar: [
        { field: 'total', label: '数据条目', icon: '📋', color: '#3b82f6' },
        { field: 'critical', label: '关键发现', icon: '🔴', color: '#ef4444' },
        { field: 'improved', label: '改善项', icon: '✅', color: '#22c55e' },
        { field: 'period', label: '报告周期', icon: '📅', color: '#8b5cf6' },
      ],
      sections: [
        { id: 'cards', title: '📊 核心发现', layout: 'full', display: { type: 'cards', cardFields: { title: 'module', subtitle: 'value', badges: ['trend'], description: 'detail' } } },
        { id: 'timeline', title: '📋 关键事件时间线', layout: 'full', display: { type: 'timeline', columns: [{ field: 'time', label: '时间' }, { field: 'title', label: '事件' }, { field: 'description', label: '详情' }] } },
      ],
    },
  },
  api: { endpoint: '/api/v1/report/gen', method: 'POST', adapter: 'default', auth: { type: 'bearer', tokenSource: 'session' }, timeout: 10000, mockFn: 'report-gen' },
  schema: { input: { type: 'object' }, output: { type: 'object' } },
  bindings: { roles: [{ roleId: 'business-security-officer', priority: 4, group: 'core' }], metrics: [] },
};

// ─── secuclaw-commander: AI 调度 ──────────────────────

const aiDispatch: ToolPluginManifest = {
  meta: { id: 'ai-dispatch', name: 'AI 调度', icon: 'Bot', uri: '/tool/ai-dispatch', version: '2.0.0', category: 'automation', provider: 'built-in', description: 'AI 驱动的安全事件智能分析 + 分析步骤时间线 + 调度任务列表', enabled: true, createdAt: 1716134400000, updatedAt: 1716134400000 },
  ui: {
    panelMode: 'slide', width: 420,
    form: [
      { name: 'query', label: '分析指令', type: 'textarea', required: true, placeholder: '描述需要分析的安全场景，如"分析最近24小时异常登录"' },
      { name: 'scope', label: '分析范围', type: 'multiselect', options: [{ value: 'alerts', label: '告警数据' }, { value: 'logs', label: '日志数据' }, { value: 'threats', label: '威胁情报' }, { value: 'vulns', label: '漏洞数据' }] },
    ],
    result: {
      type: 'composite',
      summaryBar: [
        { field: 'tasks', label: '调度任务', icon: '🤖', color: '#8b5cf6' },
        { field: 'sources', label: '数据源', icon: '📊', color: '#3b82f6' },
        { field: 'findings', label: '发现', icon: '🔍', color: '#f59e0b' },
        { field: 'confidence', label: '置信度', icon: '🎯', color: '#22c55e' },
      ],
      sections: [
        { id: 'timeline', title: '📋 分析步骤', layout: 'full', display: { type: 'timeline', columns: [{ field: 'time', label: '时间' }, { field: 'title', label: '步骤' }, { field: 'description', label: '详情' }] } },
        { id: 'tasks', title: '📋 调度结果', layout: 'full', display: { type: 'table', columns: [
          { field: 'task', label: '任务', type: 'text' },
          { field: 'status', label: '状态', type: 'badge', width: '60px', colorRule: { field: 'status', rules: [{ condition: 'eq', value: '完成', color: '#22c55e' }, { condition: 'eq', value: '进行中', color: '#3b82f6' }, { condition: 'eq', value: '待处理', color: '#f59e0b' }] } },
          { field: 'finding', label: '发现' },
        ] } },
      ],
    },
  },
  api: { endpoint: '/api/v1/ai/dispatch', method: 'POST', adapter: 'default', auth: { type: 'bearer', tokenSource: 'session' }, timeout: 30000, mockFn: 'ai-dispatch' },
  schema: { input: { type: 'object' }, output: { type: 'object' } },
  bindings: { roles: [{ roleId: 'secuclaw-commander', priority: 5, group: 'core' }], metrics: [] },
};

// ─── ciso: KPI 追踪 ─────────────────────────────────

const kpiTracking: ToolPluginManifest = {
  meta: { id: 'kpi-track', name: 'KPI 追踪', icon: 'Target', uri: '/tool/kpi-track', version: '2.0.0', category: 'reporting', provider: 'built-in', description: '安全运营 KPI 指标卡片 + 趋势折线 + 达成率进度条', enabled: true, createdAt: 1716134400000, updatedAt: 1716134400000 },
  ui: {
    panelMode: 'modal', width: 580,
    form: [
      { name: 'period', label: '统计周期', type: 'select', options: [{ value: '7d', label: '最近 7 天' }, { value: '30d', label: '最近 30 天' }, { value: '90d', label: '最近 90 天' }, { value: 'year', label: '年度' }] },
      { name: 'category', label: 'KPI 类别', type: 'select', options: [{ value: 'all', label: '全部' }, { value: 'detection', label: '检测指标' }, { value: 'response', label: '响应指标' }, { value: 'prevention', label: '预防指标' }, { value: 'compliance', label: '合规指标' }] },
    ],
    result: {
      type: 'composite',
      summaryBar: [
        { field: 'mttd', label: 'MTTD', icon: '⏱', color: '#f59e0b' },
        { field: 'mttr', label: 'MTTR', icon: '🔧', color: '#3b82f6' },
        { field: 'detectionRate', label: '检出率', icon: '🎯', color: '#22c55e' },
        { field: 'satisfaction', label: '达成率', icon: '📊', color: '#8b5cf6' },
      ],
      sections: [
        { id: 'cards', title: '📊 关键指标', layout: 'full', display: { type: 'cards', cardFields: { title: 'kpi', subtitle: 'value', badges: ['trend'], description: 'detail' } } },
        { id: 'trend', title: '📈 趋势图', layout: 'full', display: { type: 'chart', chartConfig: { chartType: 'line', chartTitle: 'KPI 趋势', xField: 'month', yField: 'score', categoryField: 'kpi', series: [{ field: 'mttd', name: 'MTTD', color: '#f59e0b' }, { field: 'mttr', name: 'MTTR', color: '#3b82f6' }, { field: 'detection', name: '检出率', color: '#22c55e' }] } } },
      ],
    },
  },
  api: { endpoint: '/api/v1/kpi/track', method: 'GET', adapter: 'default', auth: { type: 'bearer', tokenSource: 'session' }, timeout: 10000, mockFn: 'kpi-track' },
  schema: { input: { type: 'object' }, output: { type: 'object' } },
  bindings: { roles: [{ roleId: 'ciso', priority: 2, group: 'core' }], metrics: [] },
};

// ─── security-ops: 事件管理 ─────────────────────────

const incidentMgmt: ToolPluginManifest = {
  meta: { id: 'incident-mgmt', name: '事件管理', icon: 'Siren', uri: '/tool/incident-mgmt', version: '2.0.0', category: 'incident-response', provider: 'built-in', description: '安全事件全生命周期管理 + 处置时间线 + MITRE 映射', enabled: true, createdAt: 1716134400000, updatedAt: 1716134400000 },
  ui: {
    panelMode: 'modal', width: 580,
    form: [
      { name: 'severity', label: '严重级别', type: 'select', options: [{ value: 'P1', label: 'P1 紧急' }, { value: 'P2', label: 'P2 高危' }, { value: 'P3', label: 'P3 中危' }, { value: 'P4', label: 'P4 低危' }] },
      { name: 'status', label: '事件状态', type: 'select', options: [{ value: 'open', label: '待处理' }, { value: 'investigating', label: '调查中' }, { value: 'contained', label: '已遏制' }, { value: 'resolved', label: '已解决' }] },
    ],
    result: {
      type: 'composite',
      summaryBar: [
        { field: 'active', label: '活跃事件', icon: '🔴', color: '#ef4444' },
        { field: 'todayNew', label: '今日新增', icon: '🆕', color: '#f59e0b' },
        { field: 'avgTime', label: '平均处置', icon: '⏱', color: '#3b82f6' },
        { field: 'resolved', label: '已闭环', icon: '✅', color: '#22c55e' },
      ],
      sections: [
        { id: 'timeline', title: '📋 事件处置时间线', layout: 'full', display: { type: 'timeline', columns: [{ field: 'time', label: '时间' }, { field: 'title', label: '步骤' }, { field: 'description', label: '详情' }] } },
        { id: 'events', title: '📋 事件列表', layout: 'full', display: { type: 'table', columns: [
          { field: 'id', label: '事件 ID', type: 'link', width: '80px' },
          { field: 'title', label: '事件标题' },
          { field: 'severity', label: '级别', type: 'badge', width: '40px', colorRule: { field: 'severity', rules: [{ condition: 'eq', value: 'P1', color: '#ef4444' }, { condition: 'eq', value: 'P2', color: '#f59e0b' }, { condition: 'eq', value: 'P3', color: '#3b82f6' }] } },
          { field: 'status', label: '状态', type: 'badge', width: '60px' },
          { field: 'assignee', label: '负责人', width: '80px' },
          { field: 'updated', label: '更新时间', width: '100px' },
        ] } },
      ],
    },
  },
  api: { endpoint: '/api/v1/incident/list', method: 'GET', adapter: 'default', auth: { type: 'bearer', tokenSource: 'session' }, timeout: 10000, mockFn: 'incident-mgmt' },
  schema: { input: { type: 'object' }, output: { type: 'object' } },
  bindings: { roles: [{ roleId: 'security-ops', priority: 2, group: 'core' }], metrics: [{ metricId: 'pending-alerts', delta: -2 }] },
};

// ─── security-ops: 日志分析 ─────────────────────────

const logAnalysis: ToolPluginManifest = {
  meta: { id: 'log-analysis', name: '日志分析', icon: 'ScrollText', uri: '/tool/log-analysis', version: '2.0.0', category: 'monitoring', provider: 'built-in', description: '集中式安全日志分析 + 异常级别分布 + 日志源统计', enabled: true, createdAt: 1716134400000, updatedAt: 1716134400000 },
  ui: {
    panelMode: 'modal', width: 600,
    form: [
      { name: 'source', label: '日志源', type: 'multiselect', options: [{ value: 'firewall', label: '防火墙' }, { value: 'ids', label: 'IDS/IPS' }, { value: 'proxy', label: '代理' }, { value: 'edr', label: 'EDR' }, { value: 'dns', label: 'DNS' }] },
      { name: 'query', label: '过滤条件', type: 'code-editor', placeholder: 'src_ip:10.0.* AND action:blocked' },
      { name: 'timeRange', label: '时间范围', type: 'select', options: [{ value: '-1h', label: '1小时' }, { value: '-6h', label: '6小时' }, { value: '-24h', label: '24小时' }] },
    ],
    result: {
      type: 'composite',
      summaryBar: [
        { field: 'total', label: '日志条数', icon: '📋', color: '#3b82f6' },
        { field: 'errors', label: 'ERROR', icon: '🔴', color: '#ef4444' },
        { field: 'warnings', label: 'WARN', icon: '⚠️', color: '#f59e0b' },
        { field: 'sources', label: '日志源', icon: '📊', color: '#8b5cf6' },
      ],
      sections: [
        { id: 'dist', title: '📊 级别分布', layout: 'full', display: { type: 'chart', chartConfig: { chartType: 'bar', chartTitle: '日志级别分布', xField: 'level', yField: 'count', categoryField: 'level', colors: ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e'] } } },
        { id: 'logs', title: '📋 日志详情', layout: 'full', display: { type: 'table', columns: [
          { field: 'time', label: '时间', width: '130px' },
          { field: 'source', label: '来源', type: 'tag', width: '70px' },
          { field: 'level', label: '级别', type: 'badge', width: '50px', colorRule: { field: 'level', rules: [{ condition: 'eq', value: 'ERROR', color: '#ef4444' }, { condition: 'eq', value: 'WARN', color: '#f59e0b' }, { condition: 'eq', value: 'INFO', color: '#3b82f6' }] } },
          { field: 'host', label: '主机', width: '90px' },
          { field: 'message', label: '消息' },
        ] } },
      ],
    },
  },
  api: { endpoint: '/api/v1/log/analysis', method: 'POST', adapter: 'default', auth: { type: 'bearer', tokenSource: 'session' }, timeout: 15000, mockFn: 'log-analysis' },
  schema: { input: { type: 'object' }, output: { type: 'object' } },
  bindings: { roles: [{ roleId: 'security-ops', priority: 5, group: 'core' }], metrics: [] },
};

// ─── supply-chain-security: 供应商评估 ────────────────

const vendorEval: ToolPluginManifest = {
  meta: { id: 'vendor-eval', name: '供应商评估', icon: 'Building', uri: '/tool/vendor-eval', version: '2.0.0', category: 'supply-chain', provider: 'built-in', description: '供应商安全风险评估 + SCF TPM/SCM 域映射 + 雷达图', enabled: true, createdAt: 1716134400000, updatedAt: 1716134400000 },
  ui: {
    panelMode: 'modal', width: 580,
    form: [
      { name: 'vendor', label: '供应商名称', type: 'text', required: true, placeholder: '输入供应商名称' },
      { name: 'category', label: '服务类型', type: 'select', options: [{ value: 'cloud', label: '云服务' }, { value: 'saas', label: 'SaaS' }, { value: 'outsourcing', label: '外包开发' }, { value: 'hardware', label: '硬件供应' }, { value: 'consulting', label: '安全咨询' }] },
      { name: 'depth', label: '评估深度', type: 'select', options: [{ value: 'quick', label: '快速评估' }, { value: 'standard', label: '标准评估' }, { value: 'deep', label: '深度评估' }] },
    ],
    result: {
      type: 'composite',
      summaryBar: [
        { field: 'overall', label: '综合评分', icon: '📊', color: '#3b82f6' },
        { field: 'critical', label: '高风险项', icon: '🔴', color: '#ef4444' },
        { field: 'domains', label: '评估域', icon: '📋', color: '#8b5cf6' },
        { field: 'recommendation', label: '建议', icon: '💡', color: '#22c55e' },
      ],
      sections: [
        { id: 'radar', title: '📊 供应商安全雷达', layout: 'full', display: { type: 'radar', chartConfig: { chartType: 'radar', title: '供应商安全评估', labels: ['数据保护', '访问控制', '安全治理', '事件响应', '合规管理', '供应链透明'], scoreField: 'score', maxValue: 100 } } },
        { id: 'details', title: '📋 评估详情', layout: 'full', display: { type: 'cards', cardFields: { title: 'domain', subtitle: 'score', badges: ['level'], description: 'finding' } } },
      ],
    },
  },
  api: { endpoint: '/api/v1/vendor/eval', method: 'POST', adapter: 'default', auth: { type: 'bearer', tokenSource: 'session' }, timeout: 15000, mockFn: 'vendor-eval' },
  schema: { input: { type: 'object' }, output: { type: 'object' } },
  bindings: { roles: [{ roleId: 'supply-chain-security', priority: 2, group: 'core' }], metrics: [{ metricId: 'sbom-coverage', delta: 3 }] },
};

// ─── 新增工具 v3 (基于 SKILL.md 能力映射) ──────────────

const riskRegister: ToolPluginManifest = {
  meta: { id: 'risk-register', name: '风险登记册', icon: 'ListChecks', uri: '/tool/risk-register', version: '2.0.0', category: 'risk-assessment', provider: 'built-in', description: '企业级风险登记册 + 风险热力图 + SCF 域映射', enabled: true, createdAt: 1716134400000, updatedAt: 1716134400000 },
  ui: {
    panelMode: 'modal', width: 580,
    form: [
      { name: 'domain', label: '风险域', type: 'select', options: [{ value: 'all', label: '全部域' }, { value: 'GOV', label: 'GOV 治理' }, { value: 'RSK', label: 'RSK 风险管理' }, { value: 'AST', label: 'AST 资产管理' }, { value: 'NET', label: 'NET 网络安全' }, { value: 'CLD', label: 'CLD 云安全' }] },
      { name: 'riskLevel', label: '风险等级', type: 'select', options: [{ value: 'all', label: '全部' }, { value: 'critical', label: '严重' }, { value: 'high', label: '高' }, { value: 'medium', label: '中' }, { value: 'low', label: '低' }] },
    ],
    result: {
      type: 'composite',
      summaryBar: [
        { field: 'total', label: '风险总数', icon: '📊', color: '#f59e0b' },
        { field: 'critical', label: '严重', icon: '🔴', color: '#ef4444' },
        { field: 'high', label: '高', icon: '🟠', color: '#f97316' },
        { field: 'open', label: '待处理', icon: '⚠️', color: '#f59e0b' },
      ],
      sections: [
        { id: 'dist', title: '📊 风险分布', layout: 'full', display: { type: 'chart', chartConfig: { chartType: 'bar', chartTitle: '风险等级分布', xField: 'level', yField: 'count', categoryField: 'level', colors: ['#ef4444', '#f97316', '#f59e0b', '#22c55e'] } } },
        { id: 'list', title: '📋 风险清单', layout: 'full', display: { type: 'table', columns: [{ field: 'id', label: '风险ID', width: '70px' }, { field: 'name', label: '风险描述' }, { field: 'level', label: '等级', type: 'badge', width: '50px' }, { field: 'owner', label: '责任人', width: '70px' }, { field: 'status', label: '状态', type: 'badge', width: '60px' }, { field: 'treatment', label: '处置措施' }] } },
      ],
    },
  },
  api: { endpoint: '/api/v1/risk/register', method: 'POST', adapter: 'default', auth: { type: 'bearer', tokenSource: 'session' }, timeout: 15000, mockFn: 'risk-register' },
  schema: { input: { type: 'object' }, output: { type: 'object' } },
  bindings: { roles: [{ roleId: 'ciso', priority: 1, group: 'core' }], metrics: [{ metricId: 'risk-score', delta: -2 }] },
};

const budgetDash: ToolPluginManifest = {
  meta: { id: 'budget-dash', name: '预算仪表盘', icon: 'PiggyBank', uri: '/tool/budget-dash', version: '2.0.0', category: 'governance', provider: 'built-in', description: '安全预算分配 + 使用率追踪 + 饼图 + 柱状图', enabled: true, createdAt: 1716134400000, updatedAt: 1716134400000 },
  ui: {
    panelMode: 'modal', width: 580,
    form: [
      { name: 'period', label: '预算周期', type: 'select', options: [{ value: 'Q1', label: 'Q1' }, { value: 'Q2', label: 'Q2' }, { value: 'Q3', label: 'Q3' }, { value: 'Q4', label: 'Q4' }, { value: 'annual', label: '年度' }] },
      { name: 'category', label: '支出类别', type: 'select', options: [{ value: 'all', label: '全部' }, { value: 'personnel', label: '人员' }, { value: 'technology', label: '技术' }, { value: 'training', label: '培训' }, { value: 'consulting', label: '咨询' }, { value: 'audit', label: '审计' }] },
    ],
    result: {
      type: 'composite',
      summaryBar: [
        { field: 'total', label: '总预算', icon: '💰', color: '#3b82f6' },
        { field: 'used', label: '已使用', icon: '📈', color: '#f59e0b' },
        { field: 'usage', label: '使用率', icon: '📊', color: '#22c55e' },
        { field: 'trend', label: '同比', icon: '📉', color: '#64748b' },
      ],
      sections: [
        { id: 'pie', title: '📊 支出分布', layout: 'full', display: { type: 'chart', chartConfig: { chartType: 'pie', title: '预算支出分布', valueField: 'amount', categoryField: 'category', showLegend: true, colors: ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444'] } } },
        { id: 'detail', title: '📋 支出明细', layout: 'full', display: { type: 'cards', cardFields: { title: 'category', subtitle: 'budget', badges: ['status'], description: 'detail' } } },
      ],
    },
  },
  api: { endpoint: '/api/v1/budget/dash', method: 'POST', adapter: 'default', auth: { type: 'bearer', tokenSource: 'session' }, timeout: 15000, mockFn: 'budget-dash' },
  schema: { input: { type: 'object' }, output: { type: 'object' } },
  bindings: { roles: [{ roleId: 'ciso', priority: 1, group: 'core' }, { roleId: 'secuclaw-commander', priority: 2, group: 'secondary' }], metrics: [] },
};

const policyMgmt: ToolPluginManifest = {
  meta: { id: 'policy-mgmt', name: '策略管理', icon: 'FileCode', uri: '/tool/policy-mgmt', version: '2.0.0', category: 'governance', provider: 'built-in', description: '策略生命周期管理 + 状态分布图 + 审核日历', enabled: true, createdAt: 1716134400000, updatedAt: 1716134400000 },
  ui: {
    panelMode: 'modal', width: 580,
    form: [
      { name: 'policyType', label: '策略类型', type: 'select', options: [{ value: 'security', label: '安全策略' }, { value: 'privacy', label: '隐私政策' }, { value: 'acceptable-use', label: '可接受使用' }, { value: 'incident', label: '事件响应' }, { value: 'access', label: '访问控制' }, { value: 'data', label: '数据保护' }] },
      { name: 'status', label: '状态', type: 'select', options: [{ value: 'all', label: '全部' }, { value: 'draft', label: '草稿' }, { value: 'review', label: '审核中' }, { value: 'active', label: '生效中' }, { value: 'deprecated', label: '已废止' }] },
    ],
    result: {
      type: 'composite',
      summaryBar: [
        { field: 'total', label: '策略总数', icon: '📋', color: '#3b82f6' },
        { field: 'active', label: '生效中', icon: '✅', color: '#22c55e' },
        { field: 'review', label: '审核中', icon: '📝', color: '#f59e0b' },
        { field: 'overdue', label: '逾期未审', icon: '⚠️', color: '#ef4444' },
      ],
      sections: [
        { id: 'policies', title: '📋 策略清单', layout: 'full', display: { type: 'table', columns: [{ field: 'id', label: '策略ID', width: '70px' }, { field: 'name', label: '策略名称' }, { field: 'version', label: '版本', width: '50px' }, { field: 'status', label: '状态', type: 'badge', width: '60px' }, { field: 'owner', label: '责任人', width: '70px' }, { field: 'nextReview', label: '下次审核', width: '90px' }] } },
      ],
    },
  },
  api: { endpoint: '/api/v1/policy/mgmt', method: 'POST', adapter: 'default', auth: { type: 'bearer', tokenSource: 'session' }, timeout: 15000, mockFn: 'policy-mgmt' },
  schema: { input: { type: 'object' }, output: { type: 'object' } },
  bindings: { roles: [{ roleId: 'ciso', priority: 1, group: 'secondary' }, { roleId: 'privacy-officer', priority: 2, group: 'secondary' }], metrics: [] },
};

const dataMap: ToolPluginManifest = {
  meta: { id: 'data-map', name: '数据地图', icon: 'Map', uri: '/tool/data-map', version: '2.0.0', category: 'privacy', provider: 'built-in', description: '数据资产分类分级 + 敏感度分布饼图 + 跨境传输状态', enabled: true, createdAt: 1716134400000, updatedAt: 1716134400000 },
  ui: {
    panelMode: 'modal', width: 580,
    form: [
      { name: 'dataType', label: '数据类型', type: 'select', options: [{ value: 'all', label: '全部' }, { value: 'pii', label: '个人身份信息' }, { value: 'financial', label: '金融数据' }, { value: 'health', label: '健康数据' }, { value: 'biometric', label: '生物特征' }, { value: 'behavior', label: '行为数据' }] },
      { name: 'sensitivity', label: '敏感等级', type: 'select', options: [{ value: 'all', label: '全部' }, { value: 'L4', label: 'L4 极敏感' }, { value: 'L3', label: 'L3 敏感' }, { value: 'L2', label: 'L2 内部' }, { value: 'L1', label: 'L1 公开' }] },
    ],
    result: {
      type: 'composite',
      summaryBar: [
        { field: 'datasets', label: '数据集', icon: '📦', color: '#3b82f6' },
        { field: 'l4', label: '极敏感', icon: '🔴', color: '#ef4444' },
        { field: 'crossBorder', label: '跨境', icon: '🌐', color: '#f59e0b' },
        { field: 'compliant', label: '合规', icon: '✅', color: '#22c55e' },
      ],
      sections: [
        { id: 'dist', title: '📊 敏感度分布', layout: 'full', display: { type: 'chart', chartConfig: { chartType: 'pie', title: '数据敏感级别分布', valueField: 'count', categoryField: 'sensitivity', showLegend: true, colors: ['#ef4444', '#f97316', '#3b82f6', '#22c55e'] } } },
        { id: 'assets', title: '📋 数据资产清单', layout: 'full', display: { type: 'table', columns: [{ field: 'id', label: '数据ID', width: '70px' }, { field: 'name', label: '数据集名称' }, { field: 'type', label: '类型', width: '80px' }, { field: 'sensitivity', label: '敏感等级', type: 'badge', width: '70px' }, { field: 'location', label: '存储位置', width: '100px' }, { field: 'count', label: '记录数', width: '80px' }] } },
      ],
    },
  },
  api: { endpoint: '/api/v1/data/map', method: 'POST', adapter: 'default', auth: { type: 'bearer', tokenSource: 'session' }, timeout: 15000, mockFn: 'data-map' },
  schema: { input: { type: 'object' }, output: { type: 'object' } },
  bindings: { roles: [{ roleId: 'privacy-officer', priority: 1, group: 'core' }], metrics: [{ metricId: 'gdpr-compliance', delta: 3 }] },
};

const costCalc: ToolPluginManifest = {
  meta: { id: 'cost-calc', name: '成本计算', icon: 'Calculator', uri: '/tool/cost-calc', version: '2.0.0', category: 'business', provider: 'built-in', description: '安全投资成本效益分析 + 瀑布图 + ROI 对比卡片', enabled: true, createdAt: 1716134400000, updatedAt: 1716134400000 },
  ui: {
    panelMode: 'modal', width: 580,
    form: [
      { name: 'scenario', label: '分析场景', type: 'select', options: [{ value: 'breach', label: '数据泄露成本' }, { value: 'downtime', label: '业务中断成本' }, { value: 'compliance', label: '合规违规成本' }, { value: 'investment', label: '安全投资 ROI' }] },
      { name: 'scope', label: '影响范围', type: 'select', options: [{ value: 'department', label: '部门级' }, { value: 'business', label: '业务线级' }, { value: 'enterprise', label: '企业级' }] },
      { name: 'records', label: '涉及记录数', type: 'number', defaultValue: 10000 },
    ],
    result: {
      type: 'composite',
      summaryBar: [
        { field: 'total', label: '预估损失', icon: '💰', color: '#ef4444' },
        { field: 'investment', label: '安全投入', icon: '🔒', color: '#3b82f6' },
        { field: 'roi', label: 'ROI', icon: '📊', color: '#22c55e' },
        { field: 'scenario', label: '场景', icon: '🎯', color: '#64748b' },
      ],
      sections: [
        { id: 'breakdown', title: '📊 损失构成', layout: 'full', display: { type: 'chart', chartConfig: { chartType: 'bar', chartTitle: '损失构成分析', xField: 'category', yField: 'amount', categoryField: 'severity', colors: ['#ef4444', '#f97316', '#f59e0b', '#64748b', '#22c55e'] } } },
        { id: 'items', title: '📋 损失明细', layout: 'full', display: { type: 'cards', cardFields: { title: 'category', subtitle: 'amount', badges: ['severity'], description: 'detail' } } },
      ],
    },
  },
  api: { endpoint: '/api/v1/cost/calc', method: 'POST', adapter: 'default', auth: { type: 'bearer', tokenSource: 'session' }, timeout: 15000, mockFn: 'cost-calc' },
  schema: { input: { type: 'object' }, output: { type: 'object' } },
  bindings: { roles: [{ roleId: 'business-security-officer', priority: 1, group: 'core' }], metrics: [] },
};

const patchMgmt: ToolPluginManifest = {
  meta: { id: 'patch-mgmt', name: '补丁管理', icon: 'PackageCheck', uri: '/tool/patch-mgmt', version: '2.0.0', category: 'vulnerability-mgmt', provider: 'built-in', description: '补丁扫描 + 优先级排序 + 系统分布图', enabled: true, createdAt: 1716134400000, updatedAt: 1716134400000 },
  ui: {
    panelMode: 'modal', width: 580,
    form: [
      { name: 'severity', label: '补丁级别', type: 'select', options: [{ value: 'critical', label: '紧急(Critical)' }, { value: 'important', label: '重要(Important)' }, { value: 'moderate', label: '中等(Moderate)' }, { value: 'low', label: '低(Low)' }] },
      { name: 'system', label: '目标系统', type: 'select', options: [{ value: 'all', label: '全部' }, { value: 'windows', label: 'Windows' }, { value: 'linux', label: 'Linux' }, { value: 'network', label: '网络设备' }, { value: 'middleware', label: '中间件' }] },
    ],
    result: {
      type: 'composite',
      summaryBar: [
        { field: 'total', label: '补丁总数', icon: '📦', color: '#3b82f6' },
        { field: 'missing', label: '缺失', icon: '🔴', color: '#ef4444' },
        { field: 'deploying', label: '部署中', icon: '🔄', color: '#f59e0b' },
        { field: 'completed', label: '已完成', icon: '✅', color: '#22c55e' },
      ],
      sections: [
        { id: 'dist', title: '📊 系统分布', layout: 'full', display: { type: 'chart', chartConfig: { chartType: 'bar', chartTitle: '各系统补丁状态', xField: 'system', yField: 'count', categoryField: 'status', colors: ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e'] } } },
        { id: 'list', title: '📋 补丁清单', layout: 'full', display: { type: 'table', columns: [{ field: 'patchId', label: '补丁ID', width: '90px' }, { field: 'system', label: '目标系统', width: '100px' }, { field: 'severity', label: '级别', type: 'badge', width: '50px' }, { field: 'cve', label: '关联CVE', width: '110px' }, { field: 'status', label: '状态', type: 'badge', width: '60px' }] } },
      ],
    },
  },
  api: { endpoint: '/api/v1/patch/mgmt', method: 'POST', adapter: 'default', auth: { type: 'bearer', tokenSource: 'session' }, timeout: 15000, mockFn: 'patch-mgmt' },
  schema: { input: { type: 'object' }, output: { type: 'object' } },
  bindings: { roles: [{ roleId: 'security-expert', priority: 1, group: 'core' }, { roleId: 'security-ops', priority: 2, group: 'secondary' }], metrics: [{ metricId: 'patch-coverage', delta: 5 }] },
};

const iamConfig: ToolPluginManifest = {
  meta: { id: 'iam-config', name: 'IAM 配置', icon: 'KeyRound', uri: '/tool/iam-config', version: '2.0.0', category: 'identity', provider: 'built-in', description: 'IAM 配置审计 + 权限分析卡片 + 异常清单', enabled: true, createdAt: 1716134400000, updatedAt: 1716134400000 },
  ui: {
    panelMode: 'modal', width: 580,
    form: [
      { name: 'checkType', label: '检查类型', type: 'select', options: [{ value: 'privilege', label: '权限审查' }, { value: 'mfa', label: 'MFA 覆盖' }, { value: 'orphan', label: '孤儿账号' }, { value: 'segregation', label: '职责分离' }, { value: 'lifecycle', label: '账号生命周期' }] },
      { name: 'system', label: '目标系统', type: 'select', options: [{ value: 'all', label: '全部' }, { value: 'ad', label: 'Active Directory' }, { value: 'cloud', label: '云 IAM' }, { value: 'app', label: '应用系统' }] },
    ],
    result: {
      type: 'composite',
      summaryBar: [
        { field: 'checks', label: '检查项', icon: '🔍', color: '#3b82f6' },
        { field: 'critical', label: '严重发现', icon: '🔴', color: '#ef4444' },
        { field: 'mfaRate', label: 'MFA 覆盖', icon: '🔐', color: '#22c55e' },
        { field: 'orphans', label: '孤儿账号', icon: '👤', color: '#f59e0b' },
      ],
      sections: [
        { id: 'overview', title: '📊 检查概览', layout: 'full', display: { type: 'cards', cardFields: { title: 'check', subtitle: 'count', badges: ['severity'], description: 'finding' } } },
      ],
    },
  },
  api: { endpoint: '/api/v1/iam/config', method: 'POST', adapter: 'default', auth: { type: 'bearer', tokenSource: 'session' }, timeout: 15000, mockFn: 'iam-config' },
  schema: { input: { type: 'object' }, output: { type: 'object' } },
  bindings: { roles: [{ roleId: 'security-expert', priority: 1, group: 'secondary' }, { roleId: 'security-architect', priority: 1, group: 'core' }], metrics: [{ metricId: 'iam-compliance', delta: 5 }] },
};

const cloudSecurity: ToolPluginManifest = {
  meta: { id: 'cloud-security', name: '云安全评估', icon: 'Cloud', uri: '/tool/cloud-security', version: '2.0.0', category: 'cloud', provider: 'built-in', description: '云环境 CSPM 评估 + 5 域评分雷达 + 配置清单', enabled: true, createdAt: 1716134400000, updatedAt: 1716134400000 },
  ui: {
    panelMode: 'modal', width: 580,
    form: [
      { name: 'provider', label: '云服务商', type: 'select', options: [{ value: 'aws', label: 'AWS' }, { value: 'azure', label: 'Azure' }, { value: 'gcp', label: 'GCP' }, { value: 'aliyun', label: '阿里云' }, { value: 'huawei', label: '华为云' }] },
      { name: 'framework', label: '评估框架', type: 'select', options: [{ value: 'SCF', label: 'SCF 云安全' }, { value: 'CIS', label: 'CIS Benchmark' }, { value: 'CSA', label: 'CSA CCM' }] },
    ],
    result: {
      type: 'composite',
      summaryBar: [
        { field: 'score', label: '综合评分', icon: '☁️', color: '#3b82f6' },
        { field: 'framework', label: '框架', icon: '📋', color: '#8b5cf6' },
        { field: 'critical', label: '高危项', icon: '🔴', color: '#ef4444' },
        { field: 'passed', label: '达标域', icon: '✅', color: '#22c55e' },
      ],
      sections: [
        { id: 'radar', title: '📊 5 域安全评分', layout: 'full', display: { type: 'radar', chartConfig: { chartType: 'radar', title: '云安全 5 域评分', labels: ['身份与访问', '网络安全', '存储安全', '计算安全', '日志监控'], scoreField: 'score', maxValue: 100 } } },
        { id: 'domains', title: '📋 各域评估详情', layout: 'full', display: { type: 'cards', cardFields: { title: 'domain', subtitle: 'score', badges: ['level'], description: 'finding' } } },
      ],
    },
  },
  api: { endpoint: '/api/v1/cloud/security', method: 'POST', adapter: 'default', auth: { type: 'bearer', tokenSource: 'session' }, timeout: 15000, mockFn: 'cloud-security' },
  schema: { input: { type: 'object' }, output: { type: 'object' } },
  bindings: { roles: [{ roleId: 'security-architect', priority: 1, group: 'core' }], metrics: [{ metricId: 'cloud-compliance', delta: 5 }] },
};

const contractReview: ToolPluginManifest = {
  meta: { id: 'contract-review', name: '合同审查', icon: 'FileCheck2', uri: '/tool/contract-review', version: '2.0.0', category: 'supply-chain', provider: 'built-in', description: '合同安全条款审查 + 合规状态条 + 条款清单', enabled: true, createdAt: 1716134400000, updatedAt: 1716134400000 },
  ui: {
    panelMode: 'modal', width: 580,
    form: [
      { name: 'vendor', label: '供应商', type: 'text', required: true, placeholder: '输入供应商名称' },
      { name: 'contractType', label: '合同类型', type: 'select', options: [{ value: 'service', label: '服务合同' }, { value: 'nda', label: '保密协议' }, { value: 'dpa', label: '数据处理协议' }, { value: 'sla', label: 'SLA 协议' }, { value: 'msa', label: '主服务协议' }] },
    ],
    result: {
      type: 'composite',
      summaryBar: [
        { field: 'compliance', label: '合规度', icon: '📋', color: '#3b82f6' },
        { field: 'gaps', label: '合规缺口', icon: '⚠️', color: '#ef4444' },
        { field: 'highRisk', label: '高风险条款', icon: '🔴', color: '#ef4444' },
        { field: 'vendor', label: '供应商', icon: '🏢', color: '#64748b' },
      ],
      sections: [
        { id: 'clauses', title: '📋 条款审查清单', layout: 'full', display: { type: 'table', columns: [{ field: 'clause', label: '条款', width: '100px' }, { field: 'requirement', label: '要求' }, { field: 'status', label: '合规状态', type: 'badge', width: '70px' }, { field: 'risk', label: '风险等级', type: 'badge', width: '60px' }, { field: 'recommendation', label: '建议' }] } },
      ],
    },
  },
  api: { endpoint: '/api/v1/contract/review', method: 'POST', adapter: 'default', auth: { type: 'bearer', tokenSource: 'session' }, timeout: 15000, mockFn: 'contract-review' },
  schema: { input: { type: 'object' }, output: { type: 'object' } },
  bindings: { roles: [{ roleId: 'supply-chain-security', priority: 1, group: 'core' }], metrics: [{ metricId: 'contract-compliance', delta: 3 }] },
};

const thirdPartyRisk: ToolPluginManifest = {
  meta: { id: 'third-party-risk', name: '第三方风险', icon: 'UsersRound', uri: '/tool/third-party-risk', version: '2.0.0', category: 'supply-chain', provider: 'built-in', description: '第三方风险评估 + 风险类型分布 + MITRE 供应链覆盖', enabled: true, createdAt: 1716134400000, updatedAt: 1716134400000 },
  ui: {
    panelMode: 'modal', width: 580,
    form: [
      { name: 'vendor', label: '供应商', type: 'text', required: true, placeholder: '输入供应商名称' },
      { name: 'riskType', label: '风险类型', type: 'select', options: [{ value: 'all', label: '全部' }, { value: 'cyber', label: '网络安全' }, { value: 'data', label: '数据泄露' }, { value: 'compliance', label: '合规违规' }, { value: 'supply', label: '供应链攻击' }] },
    ],
    result: {
      type: 'composite',
      summaryBar: [
        { field: 'overall', label: '综合风险', icon: '⚠️', color: '#f59e0b' },
        { field: 'critical', label: '严重', icon: '🔴', color: '#ef4444' },
        { field: 'high', label: '高危', icon: '🟠', color: '#f97316' },
        { field: 'recommendation', label: '建议', icon: '💡', color: '#3b82f6' },
      ],
      sections: [
        { id: 'risks', title: '📊 风险评分', layout: 'full', display: { type: 'cards', cardFields: { title: 'risk', subtitle: 'score', badges: ['level'], description: 'detail' } } },
      ],
    },
  },
  api: { endpoint: '/api/v1/thirdparty/risk', method: 'POST', adapter: 'default', auth: { type: 'bearer', tokenSource: 'session' }, timeout: 15000, mockFn: 'third-party-risk' },
  schema: { input: { type: 'object' }, output: { type: 'object' } },
  bindings: { roles: [{ roleId: 'supply-chain-security', priority: 1, group: 'core' }], metrics: [{ metricId: 'third-party-risk', delta: -3 }] },
};

// ─── 导出所有内置 manifest ────────────────────────────
export const BUILT_IN_MANIFESTS: ToolPluginManifest[] = [
  alertQueue, soarExec, vulnScan, threatIntel, globalSituation,
  riskScore, boardReport, complianceChk, threatModel, bcpMgmt, sbomScan,
  penetrationTest, gdprAudit, zeroTrustEval, reportGeneration,
  aiDispatch, kpiTracking, incidentMgmt, logAnalysis, vendorEval,
  riskRegister, budgetDash, policyMgmt, dataMap, costCalc,
  patchMgmt, iamConfig, cloudSecurity, contractReview, thirdPartyRisk,
];
