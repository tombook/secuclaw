/**
 * Assets Module Types
 * 资产管理数据类型定义
 */

import { DomainId } from '../capabilities/types.js';

// ==================== Asset Enums ====================

/** 资产类型 */
export type AssetType = 
  | 'server'        // 服务器
  | 'database'      // 数据库
  | 'network'       // 网络设备
  | 'storage'       // 存储设备
  | 'application'   // 应用系统
  | 'container'     // 容器
  | 'virtual_machine' // 虚拟机
  | 'endpoint'      // 终端设备
  | 'cloud_service' // 云服务
  | 'iot'           // IoT设备
  | 'other';        // 其他

/** 资产重要程度 */
export type AssetCriticality = 'critical' | 'high' | 'medium' | 'low' | 'info';

/** 资产风险等级 */
export type AssetRiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'acceptable';

/** 资产状态 */
export type AssetStatus = 'online' | 'offline' | 'maintenance' | 'decommissioned' | 'unknown';

/** 资产环境 */
export type AssetEnvironment = 'production' | 'staging' | 'testing' | 'development' | 'dr';

// ==================== Asset Interfaces ====================

/** 资产基本信息 */
export interface AssetBasicInfo {
  name: string;
  description?: string;
  type: AssetType;
  criticality: AssetCriticality;
  environment: AssetEnvironment;
  status: AssetStatus;
  owner?: string;
  department?: string;
  businessLine?: string;
  tags: string[];
}

/** 资产配置信息 */
export interface AssetConfig {
  ipAddresses: string[];
  macAddresses?: string[];
  hostnames?: string[];
  ports?: number[];
  os?: string;
  osVersion?: string;
  hardware?: string;
  software?: Array<{ name: string; version: string; path?: string }>;
  locations?: string[];
  customFields?: Record<string, string | number | boolean>;
}

/** 资产风险信息 */
export interface AssetRiskInfo {
  riskScore: number;
  riskLevel: AssetRiskLevel;
  lastRiskAssessmentAt?: number;
  vulnerabilityCount: number;
  criticalVulnerabilityCount: number;
  highVulnerabilityCount: number;
  mediumVulnerabilityCount: number;
  lowVulnerabilityCount: number;
  incidentCount: number;
  threatCount: number;
}

/** 资产关联信息 */
export interface AssetRelations {
  relatedAssets: string[];
  relatedVulnerabilities: string[];
  relatedIncidents: string[];
  relatedThreats: string[];
  relatedComplianceItems: string[];
}

/** 资产生命周期 */
export interface AssetLifecycle {
  discoveredAt: number;
  firstSeenAt?: number;
  lastSeenAt: number;
  onboardedAt?: number;
  maintainedAt?: number;
  decommissionedAt?: number;
}

/** 安全资产 */
export interface SecurityAsset {
  id: string;
  domainId?: DomainId;
  info: AssetBasicInfo;
  config: AssetConfig;
  risk: AssetRiskInfo;
  relations: AssetRelations;
  lifecycle: AssetLifecycle;
  createdAt: number;
  updatedAt: number;
}

// ==================== Query Types ====================

export interface AssetQueryParams {
  type?: AssetType;
  criticality?: AssetCriticality;
  environment?: AssetEnvironment;
  status?: AssetStatus;
  riskLevel?: AssetRiskLevel;
  owner?: string;
  department?: string;
  businessLine?: string;
  tag?: string;
  ip?: string;
  fromDate?: number;
  toDate?: number;
  page?: number;
  pageSize?: number;
}

export interface AssetStats {
  total: number;
  byType: Record<AssetType, number>;
  byCriticality: Record<AssetCriticality, number>;
  byEnvironment: Record<AssetEnvironment, number>;
  byStatus: Record<AssetStatus, number>;
  byRiskLevel: Record<AssetRiskLevel, number>;
  totalVulnerabilities: number;
  totalCriticalVulnerabilities: number;
  averageRiskScore: number;
}

// ==================== API Request/Response Types ====================

export interface CreateAssetRequest {
  domainId?: DomainId;
  name: string;
  description?: string;
  type: AssetType;
  criticality: AssetCriticality;
  environment: AssetEnvironment;
  status?: AssetStatus;
  owner?: string;
  department?: string;
  businessLine?: string;
  tags?: string[];
  ipAddresses?: string[];
  macAddresses?: string[];
  hostnames?: string[];
  ports?: number[];
  os?: string;
  osVersion?: string;
  software?: Array<{ name: string; version: string }>;
}

export interface UpdateAssetRequest {
  name?: string;
  description?: string;
  type?: AssetType;
  criticality?: AssetCriticality;
  environment?: AssetEnvironment;
  status?: AssetStatus;
  owner?: string;
  department?: string;
  businessLine?: string;
  tags?: string[];
  ipAddresses?: string[];
  macAddresses?: string[];
  hostnames?: string[];
  ports?: number[];
  os?: string;
  osVersion?: string;
  software?: Array<{ name: string; version: string }>;
  customFields?: Record<string, string | number | boolean>;
}

export interface AssetImportResult {
  successCount: number;
  errorCount: number;
  errors: Array<{ row: number; message: string }>;
  importedAssetIds: string[];
}