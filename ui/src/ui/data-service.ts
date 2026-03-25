/**
 * Data Service - 数据服务
 * 
 * 处理与后端API的通信
 */
import { gatewayClient } from './gateway-client.js';

// ============ 类型定义 ============

// Incident types
export interface IncidentInfo {
  title: string;
  description: string;
  category: string;
  severity: string;
  priority: number;
  source?: string;
}

export interface IncidentTimeline {
  detectedAt?: number;
  reportedAt?: number;
  acknowledgedAt?: number;
  containingAt?: number;
  eradicatedAt?: number;
  recoveredAt?: number;
  closedAt?: number;
}

export interface IncidentWorkflow {
  status: string;
  assignee?: string;
  assigneeRole?: string;
  previousStatus?: string;
  resolution?: string;
}

export interface IncidentImpact {
  affectedAssets: string[];
  affectedUsers: number;
  dataTypes: string[];
  businessImpact: string;
  estimatedLoss?: number;
}

export interface SecurityIncident {
  id: string;
  ticketId: string;
  domainId?: string;
  info: IncidentInfo;
  timeline: IncidentTimeline;
  sla: {
    responseDeadline?: number;
    resolutionDeadline?: number;
    responseBreached?: boolean;
    resolutionBreached?: boolean;
  };
  workflow: IncidentWorkflow;
  impact: IncidentImpact;
  handlers: Array<{
    user: string;
    role: string;
    joinedAt: number;
    actions: string[];
  }>;
  createdAt: number;
  updatedAt: number;
}

// Vulnerability types
export interface VulnerabilityInfo {
  cveId: string;
  title: string;
  description: string;
  cvss: {
    score: number;
    vector: string;
    severity: string;
  };
  cwe: string[];
  affectedProducts: string[];
  exploitAvailable: boolean;
  exploitInWild: boolean;
}

export interface VulnerabilityRemediation {
  status: 'open' | 'in_progress' | 'mitigated' | 'resolved' | 'accepted';
  priority: number;
  assignedTo?: string;
  dueDate?: number;
  fixAvailable: boolean;
  fixSteps: string[];
}

export interface Vulnerability {
  id: string;
  info: VulnerabilityInfo;
  affectedAssets: Array<{
    assetId: string;
    componentName: string;
    componentVersion: string;
    fixVersion: string;
  }>;
  remediation: VulnerabilityRemediation;
  risk: {
    baseScore: number;
    adjustedScore: number;
    businessImpact: number;
    exposureScore: number;
    totalRiskScore: number;
  };
  createdAt: number;
  updatedAt: number;
}

// Stats types
export interface IncidentStats {
  total: number;
  open: number;
  closed: number;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  avgResponseTime: number;
  avgResolutionTime: number;
}

export interface VulnerabilityStats {
  total: number;
  open: number;
  resolved: number;
  bySeverity: Record<string, number>;
  avgCvss: number;
  exploitableCount: number;
}

// Query params
export interface IncidentQueryParams {
  status?: string;
  severity?: string;
  category?: string;
  assignee?: string;
  page?: number;
  pageSize?: number;
}

export interface VulnerabilityQueryParams {
  status?: string;
  severity?: string;
  cveId?: string;
  assetId?: string;
  assignedTo?: string;
  page?: number;
  pageSize?: number;
}

// ============ Service 类 ============

class DataService {
  // ==================== Incidents ====================

  async getIncidents(params: IncidentQueryParams = {}): Promise<SecurityIncident[]> {
    return gatewayClient.request('incidents.list', params);
  }

  async getIncident(id: string): Promise<SecurityIncident> {
    return gatewayClient.request('incidents.get', { id });
  }

  async createIncident(data: {
    title: string;
    description: string;
    category: string;
    severity: string;
    source?: string;
    affectedAssets?: string[];
    affectedUsers?: number;
    dataTypes?: string[];
    businessImpact?: string;
    attackVector?: string;
    mitreTechniques?: string[];
  }): Promise<SecurityIncident> {
    return gatewayClient.request('incidents.create', data);
  }

  async updateIncident(id: string, data: Partial<SecurityIncident>): Promise<SecurityIncident> {
    return gatewayClient.request('incidents.update', { id, ...data });
  }

  async updateIncidentStatus(
    id: string, 
    status: string, 
    actor?: string, 
    note?: string
  ): Promise<SecurityIncident> {
    return gatewayClient.request('incidents.updateStatus', { id, status, actor, note });
  }

  async getIncidentStats(): Promise<IncidentStats> {
    return gatewayClient.request('incidents.stats');
  }

  // ==================== Vulnerabilities ====================

  async getVulnerabilities(params: VulnerabilityQueryParams = {}): Promise<Vulnerability[]> {
    return gatewayClient.request('vulnerabilities.list', params);
  }

  async getVulnerability(id: string): Promise<Vulnerability> {
    return gatewayClient.request('vulnerabilities.get', { id });
  }

  async updateVulnerabilityStatus(
    id: string, 
    status: string, 
    assignedTo?: string,
    user?: string
  ): Promise<Vulnerability> {
    return gatewayClient.request('vulnerabilities.updateStatus', { id, status, assignedTo, user });
  }

  async assignVulnerability(
    id: string, 
    assignedTo: string, 
    user?: string
  ): Promise<Vulnerability> {
    return gatewayClient.request('vulnerabilities.assign', { id, assignedTo, user });
  }

  async getVulnerabilityStats(): Promise<VulnerabilityStats> {
    return gatewayClient.request('vulnerabilities.stats');
  }

  // ==================== Threats ====================

  async getThreats(params: {
    type?: string;
    motivation?: string;
    target?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<any[]> {
    return gatewayClient.request('threats.list', params);
  }

  async getThreat(id: string): Promise<any> {
    return gatewayClient.request('threats.get', { id });
  }

  async getThreatStats(): Promise<any> {
    return gatewayClient.request('threats.stats');
  }

  async searchThreats(keyword: string): Promise<any[]> {
    return gatewayClient.request('threats.search', { keyword });
  }

  // ==================== Compliance ====================

  async getComplianceList(params: { jurisdiction?: string; page?: number; pageSize?: number; } = {}): Promise<any[]> {
    return gatewayClient.request('compliance.list', params);
  }

  async getCompliance(id: string): Promise<any> {
    return gatewayClient.request('compliance.get', { id });
  }

  async getComplianceStats(): Promise<any> {
    return gatewayClient.request('compliance.stats');
  }

  // ==================== Assets ====================

  async getAssets(params: {
    type?: string;
    category?: string;
    environment?: string;
    criticality?: string;
    status?: string;
    owner?: string;
    department?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<any[]> {
    return gatewayClient.request('assets.list', params);
  }

  async getAsset(id: string): Promise<any> {
    return gatewayClient.request('assets.get', { id });
  }

  async getAssetStats(): Promise<any> {
    return gatewayClient.request('assets.stats');
  }
}

export const dataService = new DataService();
