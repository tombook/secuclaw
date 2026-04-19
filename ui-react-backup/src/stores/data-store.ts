/**
 * SecuClaw Data Store — Zustand
 *
 * Manages cached data: databases, lineage, quality issues, data sources.
 * Migrated from the Lit DataStore singleton to Zustand.
 */

import { create } from 'zustand';

// ── Types ──

export type DatabaseHealth = 'healthy' | 'warning' | 'error' | 'unknown';
export type DatabaseType = 'business' | 'support' | 'knowledge' | 'organization';

export interface DatabaseInfo {
  id: string;
  name: string;
  nameEn: string;
  type: DatabaseType;
  icon: string;
  color: string;
  description: string;
  recordCount: number;
  lastSync: Date;
  health: DatabaseHealth;
  size: string;
  relatedPages: string[];
}

export interface LineageNode {
  id: string;
  type: 'source' | 'database' | 'consumer';
  name: string;
  icon: string;
  status: 'active' | 'inactive';
}

export interface LineageRelation {
  sourceId: string;
  targetId: string;
  type: 'sync' | 'api' | 'manual';
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  lastSync: Date;
  recordCount: number;
}

export interface LineageGraph {
  nodes: LineageNode[];
  relations: LineageRelation[];
}

export type QualityIssueSeverity = 'critical' | 'high' | 'medium' | 'low';
export type QualityIssueStatus = 'open' | 'investigating' | 'resolved';
export type QualityIssueType = 'missing' | 'duplicate' | 'invalid' | 'outdated';

export interface QualityIssue {
  id: string;
  databaseId: string;
  type: QualityIssueType;
  severity: QualityIssueSeverity;
  description: string;
  affectedRecords: number;
  detectedAt: Date;
  status: QualityIssueStatus;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'database' | 'api' | 'file' | 'stream';
  connection: {
    host?: string;
    port?: number;
    database?: string;
    apiKey?: string;
  };
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: Date;
  syncFrequency: string;
}

// ── Initial Data ──

function createInitialDatabases(): DatabaseInfo[] {
  return [
    // Business databases (6)
    { id: 'asset-db', name: '资产库', nameEn: 'Asset Database', type: 'business', icon: '💻', color: '#3b82f6', description: 'IT资产、业务资产、数据资产信息', recordCount: 156789, lastSync: new Date(), health: 'healthy', size: '2.3GB', relatedPages: ['仪表盘', '漏洞管理', '安全风险'] },
    { id: 'vuln-db', name: '漏洞库', nameEn: 'Vulnerability Database', type: 'business', icon: '🐛', color: '#ef4444', description: 'CVE漏洞信息、扫描结果、修复状态', recordCount: 89234, lastSync: new Date(), health: 'healthy', size: '1.8GB', relatedPages: ['漏洞管理', '威胁情报', '安全风险'] },
    { id: 'threat-db', name: '威胁情报库', nameEn: 'Threat Intelligence Database', type: 'business', icon: '🎯', color: '#f59e0b', description: 'IOC、TTP、威胁组织信息', recordCount: 234567, lastSync: new Date(), health: 'healthy', size: '3.2GB', relatedPages: ['威胁情报', '作战室', '安全事件'] },
    { id: 'incident-db', name: '安全事件库', nameEn: 'Security Incident Database', type: 'business', icon: '🚨', color: '#dc2626', description: '安全事件、响应记录、取证数据', recordCount: 45678, lastSync: new Date(), health: 'healthy', size: '890MB', relatedPages: ['安全事件', '作战室', '分析报告'] },
    { id: 'compliance-db', name: '合规库', nameEn: 'Compliance Database', type: 'business', icon: '✅', color: '#22c55e', description: '合规框架、控制项、审计记录', recordCount: 12345, lastSync: new Date(), health: 'healthy', size: '456MB', relatedPages: ['合规审计', '分析报告'] },
    { id: 'risk-db', name: '风险库', nameEn: 'Risk Database', type: 'business', icon: '⚠️', color: '#eab308', description: '风险项、评估记录、处置计划', recordCount: 8976, lastSync: new Date(), health: 'warning', size: '234MB', relatedPages: ['安全风险', '仪表盘', '分析报告'] },

    // Support databases (4)
    { id: 'config-db', name: '配置库', nameEn: 'Configuration Database', type: 'support', icon: '⚙️', color: '#6366f1', description: '系统配置、策略规则、阈值设置', recordCount: 3456, lastSync: new Date(), health: 'healthy', size: '128MB', relatedPages: ['能力中心', '基线检查'] },
    { id: 'scan-db', name: '扫描任务库', nameEn: 'Scan Task Database', type: 'support', icon: '🔍', color: '#8b5cf6', description: '扫描任务、扫描结果、调度记录', recordCount: 23456, lastSync: new Date(), health: 'healthy', size: '567MB', relatedPages: ['漏洞扫描', '基线检查', '渗透测试'] },
    { id: 'alert-db', name: '告警库', nameEn: 'Alert Database', type: 'support', icon: '🔔', color: '#ec4899', description: '告警规则、告警记录、通知配置', recordCount: 567890, lastSync: new Date(), health: 'healthy', size: '1.2GB', relatedPages: ['仪表盘', '安全事件', '作战室'] },
    { id: 'metric-db', name: '指标库', nameEn: 'Metrics Database', type: 'support', icon: '📊', color: '#14b8a6', description: '安全指标、统计数据、趋势数据', recordCount: 1234567, lastSync: new Date(), health: 'healthy', size: '2.8GB', relatedPages: ['仪表盘', '分析报告'] },

    // Knowledge databases (3)
    { id: 'knowledge-db', name: '知识库', nameEn: 'Knowledge Base', type: 'knowledge', icon: '📚', color: '#0ea5e9', description: '安全知识、最佳实践、案例库', recordCount: 8976, lastSync: new Date(), health: 'healthy', size: '345MB', relatedPages: ['能力中心', '威胁狩猎'] },
    { id: 'mitre-db', name: 'MITRE ATT&CK库', nameEn: 'MITRE ATT&CK Database', type: 'knowledge', icon: '🗺️', color: '#64748b', description: 'ATT&CK框架、战术技术、映射关系', recordCount: 1456, lastSync: new Date(), health: 'healthy', size: '89MB', relatedPages: ['威胁情报', '安全事件'] },
    { id: 'rule-db', name: '检测规则库', nameEn: 'Detection Rule Database', type: 'knowledge', icon: '📜', color: '#a855f7', description: '检测规则、Sigma规则、YARA规则', recordCount: 5678, lastSync: new Date(), health: 'warning', size: '234MB', relatedPages: ['威胁狩猎', '威胁情报'] },

    // Organization databases (3)
    { id: 'people-db', name: '人员库', nameEn: 'People Database', type: 'organization', icon: '👥', color: '#f97316', description: '员工信息、角色权限、技能矩阵', recordCount: 5678, lastSync: new Date(), health: 'healthy', size: '178MB', relatedPages: ['合规审计', '安全风险'] },
    { id: 'org-db', name: '组织架构库', nameEn: 'Organization Database', type: 'organization', icon: '🏢', color: '#84cc16', description: '组织架构、部门信息、汇报关系', recordCount: 234, lastSync: new Date(), health: 'healthy', size: '45MB', relatedPages: ['合规审计', '安全风险'] },
    { id: 'vendor-db', name: '供应商库', nameEn: 'Vendor Database', type: 'organization', icon: '🏭', color: '#06b6d4', description: '供应商信息、合同记录、评估结果', recordCount: 456, lastSync: new Date(Date.now() - 86400000), health: 'error', size: '67MB', relatedPages: ['安全风险', '合规审计'] },
  ];
}

// ── State & Actions ──

interface DataState {
  databases: DatabaseInfo[];
  lineageGraph: LineageGraph | null;
  qualityIssues: QualityIssue[];
  dataSources: DataSource[];
  loading: boolean;
}

interface DataActions {
  loadDatabases: () => Promise<void>;
  loadLineageGraph: () => Promise<void>;
  loadQualityIssues: () => Promise<void>;
  loadDataSources: () => Promise<void>;
  getDatabase: (id: string) => DatabaseInfo | undefined;
  getDatabasesByType: (type: DatabaseType) => DatabaseInfo[];
  getHealthStats: () => Record<DatabaseHealth, number>;
  getDataLineage: (databaseId: string) => { sources: string[]; consumers: string[] };
  getQualityIssuesByDatabase: (databaseId: string) => QualityIssue[];
  fixQualityIssue: (issueId: string) => void;
  syncDataSource: (sourceId: string) => void;
}

export type DataStore = DataState & DataActions;

export const useDataStore = create<DataStore>()((set, get) => ({
  // State
  databases: createInitialDatabases(),
  lineageGraph: null,
  qualityIssues: [],
  dataSources: [],
  loading: false,

  // Actions
  async loadDatabases() {
    set({ loading: true });
    // Data is pre-initialized; in production this would fetch from API
    await new Promise((r) => setTimeout(r, 200));
    set({ loading: false });
  },

  async loadLineageGraph() {
    const databases = get().databases;
    set({
      lineageGraph: {
        nodes: databases.map((db) => ({
          id: db.id,
          type: 'database' as const,
          name: db.name,
          icon: db.icon,
          status: db.health === 'healthy' ? 'active' : 'inactive',
        })),
        relations: [
          { sourceId: 'asset-db', targetId: 'vuln-db', type: 'sync', frequency: 'daily', lastSync: new Date(), recordCount: 2345 },
          { sourceId: 'threat-db', targetId: 'incident-db', type: 'api', frequency: 'realtime', lastSync: new Date(), recordCount: 567 },
          { sourceId: 'scan-db', targetId: 'vuln-db', type: 'sync', frequency: 'hourly', lastSync: new Date(), recordCount: 890 },
          { sourceId: 'mitre-db', targetId: 'threat-db', type: 'sync', frequency: 'weekly', lastSync: new Date(Date.now() - 604800000), recordCount: 145 },
          { sourceId: 'knowledge-db', targetId: 'rule-db', type: 'manual', frequency: 'weekly', lastSync: new Date(), recordCount: 234 },
        ],
      },
    });
  },

  async loadQualityIssues() {
    set({
      qualityIssues: [
        { id: 'qi-1', databaseId: 'risk-db', type: 'outdated', severity: 'medium', description: '风险评分数据超过30天未更新', affectedRecords: 234, detectedAt: new Date(Date.now() - 2592000000), status: 'open' },
        { id: 'qi-2', databaseId: 'vendor-db', type: 'missing', severity: 'high', description: '供应商安全评估记录缺失', affectedRecords: 45, detectedAt: new Date(Date.now() - 86400000), status: 'investigating' },
        { id: 'qi-3', databaseId: 'rule-db', type: 'outdated', severity: 'low', description: '部分检测规则需要更新', affectedRecords: 56, detectedAt: new Date(Date.now() - 172800000), status: 'open' },
      ],
    });
  },

  async loadDataSources() {
    set({
      dataSources: [
        { id: 'ds-1', name: '主数据库连接', type: 'database', connection: { host: 'db.internal', port: 5432, database: 'secuclaw' }, status: 'connected', lastSync: new Date(), syncFrequency: 'realtime' },
        { id: 'ds-2', name: '威胁情报API', type: 'api', connection: { apiKey: '***' }, status: 'connected', lastSync: new Date(), syncFrequency: 'hourly' },
        { id: 'ds-3', name: '日志数据流', type: 'stream', connection: {}, status: 'connected', lastSync: new Date(), syncFrequency: 'realtime' },
      ],
    });
  },

  getDatabase(id: string) {
    return get().databases.find((db) => db.id === id);
  },

  getDatabasesByType(type: DatabaseType) {
    return get().databases.filter((db) => db.type === type);
  },

  getHealthStats() {
    const dbs = get().databases;
    return {
      healthy: dbs.filter((db) => db.health === 'healthy').length,
      warning: dbs.filter((db) => db.health === 'warning').length,
      error: dbs.filter((db) => db.health === 'error').length,
      unknown: dbs.filter((db) => db.health === 'unknown').length,
    };
  },

  getDataLineage(databaseId: string) {
    const graph = get().lineageGraph;
    if (!graph) return { sources: [], consumers: [] };
    const sources: string[] = [];
    const consumers: string[] = [];
    for (const rel of graph.relations) {
      if (rel.targetId === databaseId) sources.push(rel.sourceId);
      if (rel.sourceId === databaseId) consumers.push(rel.targetId);
    }
    return { sources, consumers };
  },

  getQualityIssuesByDatabase(databaseId: string) {
    return get().qualityIssues.filter((qi) => qi.databaseId === databaseId);
  },

  fixQualityIssue(issueId: string) {
    set((state) => ({
      qualityIssues: state.qualityIssues.map((qi) =>
        qi.id === issueId ? { ...qi, status: 'resolved' as const } : qi
      ),
    }));
  },

  syncDataSource(sourceId: string) {
    set((state) => ({
      dataSources: state.dataSources.map((ds) =>
        ds.id === sourceId ? { ...ds, lastSync: new Date(), status: 'connected' as const } : ds
      ),
    }));
  },
}));
