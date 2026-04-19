/**
 * SecuClaw Plugin System — 类型定义
 * 安全工具统一接入平台的完整类型系统
 */

import type { RoleId } from '../config/role-tool-config';

// ─── 工具分类 ─────────────────────────────────────────
export type ToolCategory =
  | 'threat-detection'
  | 'vulnerability-mgmt'
  | 'compliance'
  | 'incident-response'
  | 'risk-assessment'
  | 'architecture'
  | 'business-continuity'
  | 'supply-chain'
  | 'governance'
  | 'intelligence'
  | 'automation'
  | 'monitoring'
  | 'data-protection'
  | 'identity-access'
  | 'reporting'
  | 'third-party';

// ─── 表单字段定义 ──────────────────────────────────────
export interface FormFieldDef {
  name: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange'
      | 'number' | 'toggle' | 'textarea' | 'checkbox'
      | 'tag-input' | 'code-editor';
  required?: boolean;
  defaultValue?: unknown;
  placeholder?: string;
  options?: Array<{ value: string; label: string; icon?: string }>;
  optionsEndpoint?: string;
  validation?: { min?: number; max?: number; pattern?: string };
  dependsOn?: { field: string; value: unknown };
  group?: string;
}

// ─── 颜色规则 ────────────────────────────────────────
export interface ColorRule {
  field: string;
  rules: Array<{
    condition: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
    value: unknown;
    color: string;
  }>;
}

// ─── 结果展示定义 ──────────────────────────────────────
export interface ResultDisplayDef {
  type: 'table' | 'cards' | 'chart' | 'json-tree' | 'markdown'
      | 'progress-steps' | 'radar' | 'timeline' | 'custom' | 'composite';
  columns?: Array<{
    field: string;
    label: string;
    width?: string;
    type?: 'text' | 'badge' | 'link' | 'score' | 'progress' | 'tag';
    colorRule?: ColorRule;
    sortable?: boolean;
  }>;
  cardFields?: {
    title: string;
    subtitle?: string;
    badges?: string[];
    description?: string;
    actions?: string[];
  };
  chartConfig?: {
    chartType: 'bar' | 'line' | 'pie' | 'radar' | 'gauge' | 'donut' | 'heatmap' | 'grouped-bar';
    xField?: string;
    yField?: string;
    categoryField?: string;
    valueField?: string;
    colors?: string[];
    title?: string;
    labels?: string[];
    scoreField?: string;
    maxValue?: number;
    metrics?: Array<{ field: string; label: string; max: number; color?: string }>;
    showLegend?: boolean;
    showLabels?: boolean;
    groupField?: string;
    chartTitle?: string;
    series?: Array<{ field: string; name: string; color?: string }>;
  };
  steps?: Array<{ label: string; statusField: string }>;
  /** 多区布局：摘要条 + 主图表 + AI 分析区 */
  sections?: ResultSection[];
  /** 摘要条指标定义 */
  summaryBar?: Array<{ field: string; label: string; icon?: string; color?: string }>;
  emptyText?: string;
  loadingText?: string;
  customRenderer?: string;
}

/** 结果区段定义 */
export interface ResultSection {
  id: string;
  title?: string;
  layout: 'full' | 'half' | 'third';
  display: ResultDisplayDef;
}

// ─── 认证配置 ────────────────────────────────────────
export interface AuthConfig {
  type: 'none' | 'bearer' | 'api-key' | 'basic' | 'oauth2' | 'custom';
  tokenSource?: 'env' | 'store' | 'prompt' | 'session';
  tokenKey?: string;
  customAuthFn?: string;
}

// ─── 重试策略 ────────────────────────────────────────
export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
  retryOn: number[];
}

// ─── 响应映射 ────────────────────────────────────────
export interface ResponseMapping {
  fieldMap?: Record<string, string>;
  dataPath?: string;
  pagination?: {
    pageField: string;
    sizeField: string;
    totalField: string;
  };
}

// ─── 角色绑定 ────────────────────────────────────────
export interface RoleBinding {
  roleId: RoleId;
  priority: number;
  group: 'core' | 'secondary';
}

// ─── 指标绑定 ────────────────────────────────────────
export interface MetricBinding {
  metricId: string;
  delta: number;
  condition?: string;
}

// ─── 事件绑定 ────────────────────────────────────────
export interface EventBinding {
  eventType: string;
  payload: Record<string, string>;
}

// ─── RACI 绑定 ───────────────────────────────────────
export interface RaciBinding {
  type: 'R' | 'A' | 'C' | 'I';
  autoCreateTask?: boolean;
  taskTitleTemplate?: string;
}

// ─── 完整 Manifest ───────────────────────────────────
export interface ToolPluginManifest {
  meta: {
    id: string;
    name: string;
    icon: string;
    uri: string; // 工具页面 URI，用于直接访问
    version: string;
    category: ToolCategory;
    provider: 'built-in' | 'third-party' | 'custom';
    description: string;
    author?: string;
    docsUrl?: string;
    apiDocUrl?: string;
    /** 是否启用 */
    enabled: boolean;
    /** 创建时间 */
    createdAt: number;
    /** 更新时间 */
    updatedAt: number;
  };
  ui: {
    panelMode: 'slide' | 'modal' | 'fullscreen' | 'inline';
    width?: number;
    height?: number;
    form: FormFieldDef[];
    result: ResultDisplayDef;
    customRenderer?: string;
  };
  api: {
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    adapter: string;
    auth: AuthConfig;
    timeout: number;
    retryPolicy?: RetryPolicy;
    bodyTemplate?: Record<string, unknown>;
    responseMapping?: ResponseMapping;
    /** Mock response generator (for development without backend) */
    mockFn?: string;
  };
  schema: {
    input: { type: string; properties: Record<string, { type: string; description?: string }>; required?: string[] };
    output: { type: string; properties: Record<string, { type: string; description?: string }> };
  };
  bindings: {
    roles: RoleBinding[];
    metrics?: MetricBinding[];
    events?: EventBinding[];
    raci?: RaciBinding[];
  };
}

// ─── Plugin 状态 ─────────────────────────────────────
export type PluginStatus = 'not-installed' | 'installed' | 'configured' | 'enabled';

export interface PluginState {
  manifest: ToolPluginManifest;
  status: PluginStatus;
  enabled: boolean;
  config?: Record<string, unknown>;
  lastExecuted?: number;
  executionCount: number;
}

// ─── Adapter 协议 ────────────────────────────────────
export interface AdapterRequest {
  endpoint: string;
  method: string;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  auth: AuthConfig;
  timeout: number;
}

export interface StandardToolResult {
  rows: Record<string, unknown>[];
  summary?: Record<string, any>;
  pagination?: { page: number; size: number; total: number };
  status: 'success' | 'partial' | 'error';
  duration: number;
  error?: string;
  aiAnalysis?: {
    summary: string;
    riskLevel: string;
    analysis: string;
    recommendations: string[];
    actionItems: Array<{ priority: string; action: string; owner: string; deadline: string }>;
    boardSummary: string;
    dataEnrichment?: { scfControlsMatched: number; mitreTechniquesMatched: number; coverageScore: number };
  };
  _meta?: Record<string, any>;
}

export interface ToolAdapter {
  id: string;
  name: string;
  execute(request: AdapterRequest): Promise<StandardToolResult>;
}
