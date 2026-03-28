/**
 * Data Service - 数据服务
 * 
 * 处理与后端API的通信，支持Mock数据fallback
 */
import { gatewayClient } from './gateway-client.js';
import {
  mockIncidents,
  mockVulnerabilities,
  mockThreats,
  mockComplianceItems,
  mockAssets,
  mockIncidentStats,
  mockVulnerabilityStats,
  mockThreatStats,
  mockComplianceStats,
} from './mock-data.js';

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

// ============ Mock数据转换函数 ============

function convertMockIncident(mock: any): SecurityIncident {
  const severityMap: Record<string, string> = {
    critical: 'critical',
    high: 'high',
    medium: 'medium',
    low: 'low'
  };
  const statusMap: Record<string, string> = {
    new: 'new',
    investigating: 'investigating',
    containing: 'containing',
    eradicating: 'eradicating',
    recovering: 'recovering',
    resolved: 'resolved'
  };
  return {
    id: mock.id,
    ticketId: mock.ticketId,
    info: {
      title: mock.title,
      description: mock.description,
      category: mock.category,
      severity: severityMap[mock.severity] || mock.severity,
      priority: mock.severity === 'critical' ? 1 : mock.severity === 'high' ? 2 : mock.severity === 'medium' ? 3 : 4,
      source: 'Mock'
    },
    timeline: {
      detectedAt: new Date(mock.createdAt).getTime(),
      reportedAt: new Date(mock.createdAt).getTime(),
    },
    sla: {
      responseDeadline: new Date(mock.createdAt).getTime() + 3600000,
      resolutionDeadline: new Date(mock.createdAt).getTime() + 86400000,
    },
    workflow: {
      status: statusMap[mock.status] || mock.status,
      assignee: mock.assignee,
    },
    impact: {
      affectedAssets: [],
      affectedUsers: 0,
      dataTypes: [],
      businessImpact: 'Unknown',
    },
    handlers: [],
    createdAt: new Date(mock.createdAt).getTime(),
    updatedAt: new Date(mock.updatedAt).getTime(),
  };
}

function convertMockVulnerability(mock: any): Vulnerability {
  return {
    id: mock.id,
    info: {
      cveId: mock.cveId,
      title: mock.title,
      description: mock.title,
      cvss: {
        score: mock.cvss,
        vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
        severity: mock.severity,
      },
      cwe: [],
      affectedProducts: [],
      exploitAvailable: false,
      exploitInWild: false,
    },
    affectedAssets: mock.affectedAssets.map((asset: any) => ({
      assetId: `asset-${asset}`,
      componentName: 'Unknown',
      componentVersion: '1.0.0',
      fixVersion: 'N/A',
    })),
    remediation: {
      status: mock.status as any,
      priority: mock.severity === 'critical' ? 1 : mock.severity === 'high' ? 2 : 3,
      fixAvailable: mock.status !== 'resolved',
      fixSteps: [],
    },
    risk: {
      baseScore: mock.cvss,
      adjustedScore: mock.cvss,
      businessImpact: 0,
      exposureScore: 0,
      totalRiskScore: mock.cvss,
    },
    createdAt: new Date(mock.discoveredAt).getTime(),
    updatedAt: new Date(mock.fixedAt || mock.discoveredAt).getTime(),
  };
}

// ============ Service 类 ============

class DataService {
  // ==================== Incidents ====================

  async getIncidents(params: IncidentQueryParams = {}): Promise<SecurityIncident[]> {
    try {
      return await gatewayClient.request('incidents.list', params);
    } catch (error) {
      console.warn('[DataService] incidents.list failed, using mock data:', error);
      return mockIncidents.map(convertMockIncident);
    }
  }

  async getIncident(id: string): Promise<SecurityIncident> {
    try {
      return await gatewayClient.request('incidents.get', { id });
    } catch (error) {
      console.warn('[DataService] incidents.get failed, using mock data:', error);
      const mock = mockIncidents.find(i => i.id === id);
      if (mock) return convertMockIncident(mock);
      throw new Error(`Incident ${id} not found`);
    }
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
    try {
      return await gatewayClient.request('incidents.create', data);
    } catch (error) {
      console.warn('[DataService] incidents.create failed, using mock data:', error);
      // 返回一个模拟的创建结果
      return {
        id: `inc-${Date.now()}`,
        ticketId: `SEC-2026-${String(mockIncidents.length + 1).padStart(4, '0')}`,
        info: {
          title: data.title,
          description: data.description,
          category: data.category,
          severity: data.severity,
          priority: data.severity === 'critical' ? 1 : 2,
          source: data.source,
        },
        timeline: {},
        sla: {},
        workflow: { status: 'new' },
        impact: {
          affectedAssets: data.affectedAssets || [],
          affectedUsers: data.affectedUsers || 0,
          dataTypes: data.dataTypes || [],
          businessImpact: data.businessImpact || 'Unknown',
        },
        handlers: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }
  }

  async updateIncident(id: string, data: Partial<SecurityIncident>): Promise<SecurityIncident> {
    try {
      return await gatewayClient.request('incidents.update', { id, ...data });
    } catch (error) {
      console.warn('[DataService] incidents.update failed:', error);
      throw error;
    }
  }

  async updateIncidentStatus(
    id: string, 
    status: string, 
    actor?: string, 
    note?: string
  ): Promise<SecurityIncident> {
    try {
      return await gatewayClient.request('incidents.updateStatus', { id, status, actor, note });
    } catch (error) {
      console.warn('[DataService] incidents.updateStatus failed:', error);
      throw error;
    }
  }

  async getIncidentStats(): Promise<IncidentStats> {
    try {
      return await gatewayClient.request('incidents.stats');
    } catch (error) {
      console.warn('[DataService] incidents.stats failed, using mock data:', error);
      return mockIncidentStats;
    }
  }

  // ==================== Vulnerabilities ====================

  async getVulnerabilities(params: VulnerabilityQueryParams = {}): Promise<Vulnerability[]> {
    try {
      return await gatewayClient.request('vulnerabilities.list', params);
    } catch (error) {
      console.warn('[DataService] vulnerabilities.list failed, using mock data:', error);
      return mockVulnerabilities.map(convertMockVulnerability);
    }
  }

  async getVulnerability(id: string): Promise<Vulnerability> {
    try {
      return await gatewayClient.request('vulnerabilities.get', { id });
    } catch (error) {
      console.warn('[DataService] vulnerabilities.get failed, using mock data:', error);
      const mock = mockVulnerabilities.find(v => v.id === id);
      if (mock) return convertMockVulnerability(mock);
      throw new Error(`Vulnerability ${id} not found`);
    }
  }

  async updateVulnerabilityStatus(
    id: string, 
    status: string, 
    assignedTo?: string,
    user?: string
  ): Promise<Vulnerability> {
    try {
      return await gatewayClient.request('vulnerabilities.updateStatus', { id, status, assignedTo, user });
    } catch (error) {
      console.warn('[DataService] vulnerabilities.updateStatus failed:', error);
      throw error;
    }
  }

  async assignVulnerability(
    id: string, 
    assignedTo: string, 
    user?: string
  ): Promise<Vulnerability> {
    try {
      return await gatewayClient.request('vulnerabilities.assign', { id, assignedTo, user });
    } catch (error) {
      console.warn('[DataService] vulnerabilities.assign failed:', error);
      throw error;
    }
  }

  async getVulnerabilityStats(): Promise<VulnerabilityStats> {
    try {
      return await gatewayClient.request('vulnerabilities.stats');
    } catch (error) {
      console.warn('[DataService] vulnerabilities.stats failed, using mock data:', error);
      return mockVulnerabilityStats;
    }
  }

  // ==================== Threats ====================

  async getThreats(params: {
    type?: string;
    motivation?: string;
    target?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<any[]> {
    try {
      return await gatewayClient.request('threats.list', params);
    } catch (error) {
      console.warn('[DataService] threats.list failed, using mock data:', error);
      return mockThreats;
    }
  }

  async getThreat(id: string): Promise<any> {
    try {
      return await gatewayClient.request('threats.get', { id });
    } catch (error) {
      console.warn('[DataService] threats.get failed, using mock data:', error);
      return mockThreats.find(t => t.id === id);
    }
  }

  async getThreatStats(): Promise<any> {
    try {
      return await gatewayClient.request('threats.stats');
    } catch (error) {
      console.warn('[DataService] threats.stats failed, using mock data:', error);
      return mockThreatStats;
    }
  }

  async searchThreats(keyword: string): Promise<any[]> {
    try {
      return await gatewayClient.request('threats.search', { keyword });
    } catch (error) {
      console.warn('[DataService] threats.search failed, using mock data:', error);
      return mockThreats.filter(t => 
        t.name.toLowerCase().includes(keyword.toLowerCase()) ||
        t.type.toLowerCase().includes(keyword.toLowerCase())
      );
    }
  }

  // ==================== Compliance ====================

  async getComplianceList(params: { jurisdiction?: string; page?: number; pageSize?: number; } = {}): Promise<any[]> {
    try {
      return await gatewayClient.request('compliance.list', params);
    } catch (error) {
      console.warn('[DataService] compliance.list failed, using mock data:', error);
      return mockComplianceItems;
    }
  }

  async getCompliance(id: string): Promise<any> {
    try {
      return await gatewayClient.request('compliance.get', { id });
    } catch (error) {
      console.warn('[DataService] compliance.get failed, using mock data:', error);
      return mockComplianceItems.find(c => c.id === id);
    }
  }

  async getComplianceStats(): Promise<any> {
    try {
      return await gatewayClient.request('compliance.stats');
    } catch (error) {
      console.warn('[DataService] compliance.stats failed, using mock data:', error);
      return mockComplianceStats;
    }
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
    try {
      return await gatewayClient.request('assets.list', params);
    } catch (error) {
      console.warn('[DataService] assets.list failed, using mock data:', error);
      return mockAssets;
    }
  }

  async getAsset(id: string): Promise<any> {
    try {
      return await gatewayClient.request('assets.get', { id });
    } catch (error) {
      console.warn('[DataService] assets.get failed, using mock data:', error);
      return mockAssets.find(a => a.id === id);
    }
  }

  async getAssetStats(): Promise<any> {
    try {
      return await gatewayClient.request('assets.stats');
    } catch (error) {
      console.warn('[DataService] assets.stats failed, using mock data:', error);
      return {
        total: mockAssets.length,
        byType: mockAssets.reduce((acc, a) => { acc[a.type] = (acc[a.type] || 0) + 1; return acc; }, {} as Record<string, number>),
        byStatus: mockAssets.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {} as Record<string, number>),
      };
    }
  }
}

export const dataService = new DataService();
