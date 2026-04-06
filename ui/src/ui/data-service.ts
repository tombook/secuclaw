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

// ============ Task types ============

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: 'vulnerability' | 'configuration' | 'assessment' | 'audit' | 'review';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  assignee?: string;
  assigneeRole?: string;
  createdAt: number;
  updatedAt: number;
  dueDate?: number;
}

export interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  byPriority: Record<string, number>;
}

// Mock tasks data
const mockTasks: Task[] = [
  { id: 'task-1', title: '修复SQL注入漏洞', description: '修复用户登录处的SQL注入', type: 'vulnerability', status: 'in_progress', priority: 'high', assignee: '张三', assigneeRole: 'security-expert', createdAt: Date.now() - 86400000, updatedAt: Date.now() },
  { id: 'task-2', title: '安全配置审计', description: '检查服务器安全配置', type: 'audit', status: 'pending', priority: 'medium', assignee: '李四', assigneeRole: 'security-ops', createdAt: Date.now() - 172800000, updatedAt: Date.now() },
  { id: 'task-3', title: '渗透测试', description: '对API进行渗透测试', type: 'assessment', status: 'completed', priority: 'high', assignee: '王五', assigneeRole: 'security-expert', createdAt: Date.now() - 259200000, updatedAt: Date.now() },
];

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
      return await gatewayClient.request('incidents.list', params as Record<string, unknown>);
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
    const result = await gatewayClient.request<SecurityIncident>('incidents.create', data);
    return result;
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
      return await gatewayClient.request('vulnerabilities.list', params as Record<string, unknown>);
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

  // ==================== Tasks ====================

  private getTasksFromStorage(): Task[] {
    try {
      const stored = localStorage.getItem('secuclaw-tasks');
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? [...parsed] as Task[] : [...mockTasks] as Task[];
      }
      return [...mockTasks] as Task[];
    } catch {
      return [...mockTasks] as Task[];
    }
  }

  private saveTasksToStorage(tasks: Task[]): void {
    localStorage.setItem('secuclaw-tasks', JSON.stringify(tasks));
  }

  async getTasks(): Promise<Task[]> {
    // Always try localStorage first to ensure we get latest data
    const storedTasks = this.getTasksFromStorage();
    try {
      const res = await gatewayClient.request('tasks.list');
      const data = (res as any)?.data ?? res;
      if (Array.isArray(data) && data.length > 0) {
        // Merge with localStorage tasks that might not be synced
        const localIds = new Set(storedTasks.map(t => t.id));
        const newFromServer = (data as Task[]).filter((t: Task) => !localIds.has(t.id));
        return [...storedTasks, ...newFromServer] as Task[];
      }
    } catch (error) {
      console.warn('[DataService] tasks.list failed, using localStorage:', error);
    }
    return storedTasks;
  }

  async getTask(id: string): Promise<Task | null> {
    try {
      return await gatewayClient.request('tasks.get', { id });
    } catch (error) {
      console.warn('[DataService] tasks.get failed, using localStorage:', error);
      const tasks = this.getTasksFromStorage();
      return tasks.find(t => t.id === id) || null;
    }
  }

  async createTask(data: { title: string; description?: string; type?: string; priority?: string; }): Promise<Task> {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: data.title,
      description: data.description || '',
      type: (data.type as Task['type']) || 'assessment',
      status: 'pending',
      priority: (data.priority as Task['priority']) || 'medium',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    // Always save locally first (backend may not be available)
    const tasks = this.getTasksFromStorage();
    tasks.unshift(newTask);
    this.saveTasksToStorage(tasks);
    // Try to sync with backend
    try {
      const backendData = { ...newTask, name: newTask.title }; // Map title to name for backend
      const res = await gatewayClient.request('tasks.create', backendData as unknown as Record<string, unknown>);
      console.warn('[DataService] tasks.create synced to backend:', res);
      return res as Task;
    } catch (error) {
      console.warn('[DataService] tasks.create backend sync failed, saved locally:', error);
      return newTask;
    }
  }

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    // Always save locally first
    const tasks = this.getTasksFromStorage();
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) throw new Error(`Task ${id} not found`);
    tasks[index] = { ...tasks[index], ...data, updatedAt: Date.now() };
    this.saveTasksToStorage(tasks);
    // Try to sync with backend
    try {
      const backendData = { ...data, id, name: data.title }; // Map title to name for backend
      const res = await gatewayClient.request('tasks.update', backendData as Record<string, unknown>);
      console.warn('[DataService] tasks.update synced to backend:', res);
      return res as Task;
    } catch (error) {
      console.warn('[DataService] tasks.update backend sync failed, saved locally:', error);
      return tasks[index];
    }
  }

  async deleteTask(id: string): Promise<void> {
    // Always delete locally first
    const tasks = this.getTasksFromStorage();
    const filtered = tasks.filter(t => t.id !== id);
    this.saveTasksToStorage(filtered);
    // Try to sync with backend
    try {
      await gatewayClient.request('tasks.delete', { id });
    } catch (error) {
      console.warn('[DataService] tasks.delete backend sync failed, deleted locally:', error);
    }
  }

  async getTaskStats(): Promise<TaskStats> {
    const tasks = await this.getTasks();
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length,
      byPriority: tasks.reduce((acc, t) => { acc[t.priority] = (acc[t.priority] || 0) + 1; return acc; }, {} as Record<string, number>),
    };
  }
}

export const dataService = new DataService();
