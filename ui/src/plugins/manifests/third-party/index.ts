/**
 * 第三方工具 Manifest 定义
 * Nessus / Splunk / CrowdStrike / VirusTotal / Elastic
 */

import type { ToolPluginManifest } from '../types';

// ─── Nessus 漏洞扫描 ──────────────────────────────

const nessusScan: ToolPluginManifest = {
  meta: {
    id: 'nessus-scan', name: 'Nessus 漏洞扫描', icon: 'Shield',
    version: '1.0.0', category: 'vulnerability-mgmt', provider: 'third-party',
    author: 'Tenable', description: '通过 Nessus Professional 进行专业漏洞扫描',
    docsUrl: 'https://docs.tenable.com/nessus.htm',
  },
  ui: {
    panelMode: 'modal', width: 580,
    form: [
      { name: 'scanPolicy', label: '扫描策略', type: 'select', options: [{ value: 'basic', label: '基础网络扫描' }, { value: 'deep', label: '深度扫描' }, { value: 'compliance', label: '合规基线检查' }] },
      { name: 'targets', label: '目标资产', type: 'tag-input', required: true, placeholder: '输入 IP 后回车添加' },
      { name: 'credentials', label: '认证凭据', type: 'select', options: [{ value: 'none', label: '无认证' }, { value: 'ssh', label: 'SSH 密钥' }, { value: 'smb', label: 'SMB 凭据' }] },
    ],
    result: {
      type: 'table',
      columns: [
        { field: 'pluginId', label: 'Plugin ID', type: 'link', width: '90px' },
        { field: 'name', label: '漏洞名称', type: 'text' },
        { field: 'severity', label: '严重性', type: 'badge', width: '70px', colorRule: { field: 'severity', rules: [{ condition: 'eq', value: 'Critical', color: '#ef4444' }, { condition: 'eq', value: 'High', color: '#f59e0b' }, { condition: 'eq', value: 'Medium', color: '#3b82f6' }, { condition: 'eq', value: 'Low', color: '#22c55e' }] } },
        { field: 'host', label: '主机', type: 'text', width: '120px' },
        { field: 'protocol', label: '协议', type: 'tag', width: '60px' },
      ],
    },
  },
  api: { endpoint: '/api/v1/adapters/nessus/scan', method: 'POST', adapter: 'nessus', auth: { type: 'api-key', tokenSource: 'store', tokenKey: 'nessus-api-key' }, timeout: 60000, mockFn: 'nessus-scan' },
  schema: { input: { type: 'object', properties: { scanPolicy: { type: 'string' }, targets: { type: 'array' } } }, output: { type: 'object', properties: { vulnerabilities: { type: 'array' } } } },
  bindings: { roles: [{ roleId: 'security-expert', priority: 8, group: 'secondary' }], metrics: [{ metricId: 'vuln-count', delta: 0 }] },
};

// ─── Splunk 日志查询 ───────────────────────────────

const splunkQuery: ToolPluginManifest = {
  meta: {
    id: 'splunk-query', name: 'Splunk 日志查询', icon: 'Search',
    version: '1.0.0', category: 'monitoring', provider: 'third-party',
    author: 'Splunk', description: '通过 Splunk SPL 查询安全事件日志和威胁指标',
    docsUrl: 'https://docs.splunk.com/',
  },
  ui: {
    panelMode: 'modal', width: 600,
    form: [
      { name: 'query', label: 'SPL 查询语句', type: 'code-editor', required: true, placeholder: 'index=security sourcetype=firewall action=blocked' },
      { name: 'timeRange', label: '时间范围', type: 'select', options: [{ value: '-1h', label: '最近 1 小时' }, { value: '-24h', label: '最近 24 小时' }, { value: '-7d', label: '最近 7 天' }, { value: '-30d', label: '最近 30 天' }] },
      { name: 'maxResults', label: '最大结果数', type: 'number', defaultValue: 100, validation: { min: 1, max: 10000 } },
    ],
    result: {
      type: 'table',
      columns: [
        { field: '_time', label: '时间', width: '140px' },
        { field: 'source', label: '来源', type: 'tag', width: '100px' },
        { field: 'action', label: '动作', type: 'badge', colorRule: { field: 'action', rules: [{ condition: 'eq', value: 'blocked', color: '#ef4444' }, { condition: 'eq', value: 'allowed', color: '#22c55e' }, { condition: 'eq', value: 'detected', color: '#f59e0b' }] } },
        { field: 'src_ip', label: '源 IP', width: '110px' },
        { field: 'dest_ip', label: '目标 IP', width: '110px' },
        { field: 'message', label: '消息' },
      ],
    },
  },
  api: { endpoint: '/api/v1/adapters/splunk/search', method: 'POST', adapter: 'splunk', auth: { type: 'basic', tokenSource: 'store', tokenKey: 'splunk-credentials' }, timeout: 30000, mockFn: 'splunk-query' },
  schema: { input: { type: 'object', properties: { query: { type: 'string' }, timeRange: { type: 'string' } } }, output: { type: 'object', properties: { results: { type: 'array' } } } },
  bindings: { roles: [{ roleId: 'security-ops', priority: 6, group: 'secondary' }, { roleId: 'secuclaw-commander', priority: 8, group: 'secondary' }], metrics: [] },
};

// ─── CrowdStrike EDR 查询 ─────────────────────────

const crowdstrikeDetections: ToolPluginManifest = {
  meta: {
    id: 'crowdstrike-detections', name: 'CrowdStrike EDR', icon: 'Crosshair',
    version: '1.0.0', category: 'threat-detection', provider: 'third-party',
    author: 'CrowdStrike', description: '查询 CrowdStrike Falcon 端点检测和响应告警',
    docsUrl: 'https://developer.crowdstrike.com/',
  },
  ui: {
    panelMode: 'modal', width: 600,
    form: [
      { name: 'severity', label: '严重级别', type: 'multiselect', options: [{ value: 'Critical', label: '严重' }, { value: 'High', label: '高' }, { value: 'Medium', label: '中' }, { value: 'Low', label: '低' }] },
      { name: 'status', label: '检测状态', type: 'select', options: [{ value: 'new', label: '新检测' }, { value: 'in_progress', label: '处理中' }, { value: 'closed', label: '已关闭' }] },
      { name: 'hostname', label: '主机名', type: 'text', placeholder: '输入主机名过滤' },
    ],
    result: {
      type: 'table',
      columns: [
        { field: 'detection_id', label: '检测 ID', type: 'link', width: '120px' },
        { field: 'severity', label: '严重性', type: 'badge', width: '60px', colorRule: { field: 'severity', rules: [{ condition: 'eq', value: 'Critical', color: '#ef4444' }, { condition: 'eq', value: 'High', color: '#f59e0b' }, { condition: 'eq', value: 'Medium', color: '#3b82f6' }] } },
        { field: 'technique', label: '攻击技术', type: 'tag', width: '100px' },
        { field: 'hostname', label: '主机', width: '110px' },
        { field: 'timestamp', label: '时间', width: '130px' },
        { field: 'description', label: '描述' },
      ],
    },
  },
  api: { endpoint: '/detects/queries/detects/v1', method: 'GET', adapter: 'crowdstrike', auth: { type: 'oauth2', tokenSource: 'store', tokenKey: 'crowdstrike-token' }, timeout: 15000, mockFn: 'crowdstrike-detections' },
  schema: { input: { type: 'object', properties: { severity: { type: 'array' }, status: { type: 'string' } } }, output: { type: 'object', properties: { resources: { type: 'array' } } } },
  bindings: { roles: [{ roleId: 'security-ops', priority: 7, group: 'secondary' }, { roleId: 'security-expert', priority: 9, group: 'secondary' }], metrics: [{ metricId: 'pending-alerts', delta: 0 }] },
};

// ─── VirusTotal 威胁分析 ───────────────────────────

const virusTotalScan: ToolPluginManifest = {
  meta: {
    id: 'virustotal-scan', name: 'VirusTotal 分析', icon: 'Bug',
    version: '1.0.0', category: 'intelligence', provider: 'third-party',
    author: 'Google (VirusTotal)', description: '查询文件、URL、IP 或域名的威胁情报和恶意软件分析',
    docsUrl: 'https://developers.virustotal.com/reference/overview',
  },
  ui: {
    panelMode: 'modal', width: 560,
    form: [
      { name: 'query', label: '查询目标', type: 'text', required: true, placeholder: '输入 IP / URL / 域名 / 文件哈希' },
      { name: 'type', label: '查询类型', type: 'select', options: [{ value: 'auto', label: '自动检测' }, { value: 'ip', label: 'IP 地址' }, { value: 'domain', label: '域名' }, { value: 'file', label: '文件哈希' }, { value: 'url', label: 'URL' }] },
    ],
    result: {
      type: 'cards',
      cardFields: { title: 'engine', subtitle: 'category', badges: ['result'], description: 'detail' },
    },
  },
  api: { endpoint: '/search', method: 'GET', adapter: 'virustotal', auth: { type: 'api-key', tokenSource: 'store', tokenKey: 'virustotal-api-key' }, timeout: 15000, mockFn: 'virustotal-scan' },
  schema: { input: { type: 'object', properties: { query: { type: 'string' } } }, output: { type: 'object', properties: { data: { type: 'array' } } } },
  bindings: { roles: [{ roleId: 'security-expert', priority: 7, group: 'secondary' }, { roleId: 'security-ops', priority: 8, group: 'secondary' }], metrics: [{ metricId: 'intel-match', delta: 1 }] },
};

// ─── Elastic Security 查询 ────────────────────────

const elasticSecurity: ToolPluginManifest = {
  meta: {
    id: 'elastic-security', name: 'Elastic Security', icon: 'Database',
    version: '1.0.0', category: 'monitoring', provider: 'third-party',
    author: 'Elastic', description: '查询 Elasticsearch 安全事件日志和 Kibana Security 告警',
    docsUrl: 'https://www.elastic.co/guide/en/security/current/index.html',
  },
  ui: {
    panelMode: 'modal', width: 600,
    form: [
      { name: 'index', label: '索引模式', type: 'select', options: [{ value: 'logs-*', label: '所有日志' }, { value: 'alerts-security*', label: '安全告警' }, { value: 'metrics-*', label: '性能指标' }], group: '查询配置' },
      { name: 'dsl', label: 'Elastic DSL', type: 'code-editor', group: '查询配置', placeholder: '{ "query": { "match_all": {} } }' },
      { name: 'timeField', label: '时间字段', type: 'select', options: [{ value: '@timestamp', label: '@timestamp' }, { value: 'event.created', label: 'event.created' }], group: '查询配置' },
    ],
    result: {
      type: 'table',
      columns: [
        { field: '@timestamp', label: '时间', width: '140px', sortable: true },
        { field: 'event.kind', label: '类型', type: 'badge', width: '60px', colorRule: { field: 'event.kind', rules: [{ condition: 'eq', value: 'alert', color: '#ef4444' }, { condition: 'eq', value: 'event', color: '#3b82f6' }, { condition: 'eq', value: 'metric', color: '#22c55e' }] } },
        { field: 'host.name', label: '主机', width: '100px' },
        { field: 'source.ip', label: '源 IP', width: '100px' },
        { field: 'message', label: '消息' },
      ],
    },
  },
  api: { endpoint: '/_search', method: 'POST', adapter: 'elastic', auth: { type: 'basic', tokenSource: 'store', tokenKey: 'elastic-credentials' }, timeout: 30000, mockFn: 'elastic-security' },
  schema: { input: { type: 'object', properties: { index: { type: 'string' }, dsl: { type: 'object' } } }, output: { type: 'object', properties: { hits: { type: 'object' } } } },
  bindings: { roles: [{ roleId: 'security-ops', priority: 5, group: 'secondary' }, { roleId: 'secuclaw-commander', priority: 7, group: 'secondary' }], metrics: [] },
};

export const THIRD_PARTY_MANIFESTS: ToolPluginManifest[] = [
  nessusScan,
  splunkQuery,
  crowdstrikeDetections,
  virusTotalScan,
  elasticSecurity,
];
