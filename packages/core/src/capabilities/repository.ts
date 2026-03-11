/**
 * Capabilities Repository
 * 
 * 数据存储层，使用 JsonStore 持久化
 */

import type { JsonStore } from '../storage/json-store.js';
import type {
  DomainId,
  CapabilityDomain,
  CapabilityItem,
  SecurityTask,
  ExecutionRun,
  Approval,
  EvidencePack,
  TaskQueryParams,
  CapabilityQueryParams,
  RunQueryParams,
  EvidenceQueryParams,
  DomainKPI,
} from './types.js';

const FILES = {
  DOMAINS: 'capability-domains.json',
  ITEMS: 'capability-items.json',
  TASKS: 'capability-tasks.json',
  RUNS: 'execution-runs.json',
  APPROVALS: 'approvals.json',
  EVIDENCE: 'evidence-packs.json',
};

export class CapabilitiesRepository {
  constructor(private store: JsonStore) {}

  // ==================== Domains ====================

  async getDomains(): Promise<CapabilityDomain[]> {
    const domains = await this.store.get<CapabilityDomain[]>(FILES.DOMAINS);
    return domains || [];
  }

  async getDomain(id: DomainId): Promise<CapabilityDomain | null> {
    const domains = await this.getDomains();
    return domains.find(d => d.id === id) || null;
  }

  async saveDomains(domains: CapabilityDomain[]): Promise<void> {
    await this.store.set(FILES.DOMAINS, domains);
  }

  async updateDomainKPI(id: DomainId, kpi: DomainKPI): Promise<void> {
    const domains = await this.getDomains();
    const index = domains.findIndex(d => d.id === id);
    if (index >= 0) {
      domains[index] = { ...domains[index], kpi };
      await this.saveDomains(domains);
    }
  }

  // ==================== Items ====================

  async getItems(): Promise<CapabilityItem[]> {
    const items = await this.store.get<CapabilityItem[]>(FILES.ITEMS);
    return items || [];
  }

  async getItemsByQuery(params: CapabilityQueryParams): Promise<CapabilityItem[]> {
    let items = await this.getItems();
    
    if (params.domainId) {
      items = items.filter(i => i.domainId === params.domainId);
    }
    if (params.enabledOnly) {
      items = items.filter(i => i.enabled);
    }
    if (params.roleId) {
      items = items.filter(i => 
        i.ownerRoles.includes(params.roleId!) || 
        i.partnerRoles.includes(params.roleId!)
      );
    }
    
    return items.sort((a, b) => b.priority - a.priority);
  }

  async getItem(id: string): Promise<CapabilityItem | null> {
    const items = await this.getItems();
    return items.find(i => i.id === id) || null;
  }

  async saveItems(items: CapabilityItem[]): Promise<void> {
    await this.store.set(FILES.ITEMS, items);
  }

  // ==================== Tasks ====================

  async getTasks(): Promise<SecurityTask[]> {
    const tasks = await this.store.get<SecurityTask[]>(FILES.TASKS);
    return tasks || [];
  }

  async getTasksByQuery(params: TaskQueryParams): Promise<SecurityTask[]> {
    let tasks = await this.getTasks();
    
    if (params.domainId) {
      tasks = tasks.filter(t => t.domainId === params.domainId);
    }
    if (params.status) {
      tasks = tasks.filter(t => t.status === params.status);
    }
    if (params.assigneeRole) {
      tasks = tasks.filter(t => t.assigneeRole === params.assigneeRole);
    }
    if (params.priority) {
      tasks = tasks.filter(t => t.priority === params.priority);
    }
    if (params.capabilityId) {
      tasks = tasks.filter(t => t.capabilityId === params.capabilityId);
    }
    
    // Sort by priority and creation time
    tasks.sort((a, b) => {
      const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pDiff !== 0) return pDiff;
      return b.createdAt - a.createdAt;
    });
    
    if (params.limit) {
      tasks = tasks.slice(params.offset || 0, (params.offset || 0) + params.limit);
    }
    
    return tasks;
  }

  async getTask(id: string): Promise<SecurityTask | null> {
    const tasks = await this.getTasks();
    return tasks.find(t => t.id === id) || null;
  }

  async createTask(task: SecurityTask): Promise<SecurityTask> {
    const tasks = await this.getTasks();
    tasks.push(task);
    await this.store.set(FILES.TASKS, tasks);
    return task;
  }

  async updateTask(id: string, updates: Partial<SecurityTask>): Promise<SecurityTask | null> {
    const tasks = await this.getTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index < 0) return null;
    
    tasks[index] = { ...tasks[index], ...updates, updatedAt: Date.now() };
    await this.store.set(FILES.TASKS, tasks);
    return tasks[index];
  }

  async deleteTask(id: string): Promise<boolean> {
    const tasks = await this.getTasks();
    const filtered = tasks.filter(t => t.id !== id);
    if (filtered.length === tasks.length) return false;
    await this.store.set(FILES.TASKS, filtered);
    return true;
  }

  // ==================== Runs ====================

  async getRuns(): Promise<ExecutionRun[]> {
    const runs = await this.store.get<ExecutionRun[]>(FILES.RUNS);
    return runs || [];
  }

  async getRunsByQuery(params: RunQueryParams): Promise<ExecutionRun[]> {
    let runs = await this.getRuns();
    
    if (params.taskId) {
      runs = runs.filter(r => r.taskId === params.taskId);
    }
    if (params.domainId) {
      runs = runs.filter(r => r.domainId === params.domainId);
    }
    if (params.status) {
      runs = runs.filter(r => r.status === params.status);
    }
    
    runs.sort((a, b) => b.createdAt - a.createdAt);
    
    if (params.limit) {
      runs = runs.slice(0, params.limit);
    }
    
    return runs;
  }

  async getRun(id: string): Promise<ExecutionRun | null> {
    const runs = await this.getRuns();
    return runs.find(r => r.id === id) || null;
  }

  async createRun(run: ExecutionRun): Promise<ExecutionRun> {
    const runs = await this.getRuns();
    runs.push(run);
    await this.store.set(FILES.RUNS, runs);
    return run;
  }

  async updateRun(id: string, updates: Partial<ExecutionRun>): Promise<ExecutionRun | null> {
    const runs = await this.getRuns();
    const index = runs.findIndex(r => r.id === id);
    if (index < 0) return null;
    
    runs[index] = { ...runs[index], ...updates, updatedAt: Date.now() };
    await this.store.set(FILES.RUNS, runs);
    return runs[index];
  }

  // ==================== Approvals ====================

  async getApprovals(): Promise<Approval[]> {
    const approvals = await this.store.get<Approval[]>(FILES.APPROVALS);
    return approvals || [];
  }

  async getApproval(id: string): Promise<Approval | null> {
    const approvals = await this.getApprovals();
    return approvals.find(a => a.id === id) || null;
  }

  async getApprovalByTask(taskId: string): Promise<Approval | null> {
    const approvals = await this.getApprovals();
    // Return the latest valid approval for the task
    const taskApprovals = approvals
      .filter(a => a.taskId === taskId)
      .sort((a, b) => b.createdAt - a.createdAt);
    return taskApprovals[0] || null;
  }

  async createApproval(approval: Approval): Promise<Approval> {
    const approvals = await this.getApprovals();
    approvals.push(approval);
    await this.store.set(FILES.APPROVALS, approvals);
    return approval;
  }

  async updateApproval(id: string, updates: Partial<Approval>): Promise<Approval | null> {
    const approvals = await this.getApprovals();
    const index = approvals.findIndex(a => a.id === id);
    if (index < 0) return null;
    
    approvals[index] = { ...approvals[index], ...updates, updatedAt: Date.now() };
    await this.store.set(FILES.APPROVALS, approvals);
    return approvals[index];
  }

  // ==================== Evidence ====================

  async getEvidence(): Promise<EvidencePack[]> {
    const evidence = await this.store.get<EvidencePack[]>(FILES.EVIDENCE);
    return evidence || [];
  }

  async getEvidenceByQuery(params: EvidenceQueryParams): Promise<EvidencePack[]> {
    let evidence = await this.getEvidence();
    
    if (params.domainId) {
      evidence = evidence.filter(e => e.domainId === params.domainId);
    }
    if (params.taskId) {
      evidence = evidence.filter(e => e.taskId === params.taskId);
    }
    if (params.runId) {
      evidence = evidence.filter(e => e.runId === params.runId);
    }
    
    evidence.sort((a, b) => b.createdAt - a.createdAt);
    
    if (params.limit) {
      evidence = evidence.slice(0, params.limit);
    }
    
    return evidence;
  }

  async getEvidenceItem(id: string): Promise<EvidencePack | null> {
    const evidence = await this.getEvidence();
    return evidence.find(e => e.id === id) || null;
  }

  async createEvidence(evidence: EvidencePack): Promise<EvidencePack> {
    const allEvidence = await this.getEvidence();
    allEvidence.push(evidence);
    await this.store.set(FILES.EVIDENCE, allEvidence);
    return evidence;
  }

  // ==================== Metrics ====================

  async getTaskCountsByDomain(domainId: DomainId): Promise<{ todo: number; inProgress: number; done: number; total: number }> {
    const tasks = await this.getTasks();
    const domainTasks = tasks.filter(t => t.domainId === domainId);
    
    return {
      todo: domainTasks.filter(t => t.status === 'todo').length,
      inProgress: domainTasks.filter(t => t.status === 'in_progress').length,
      done: domainTasks.filter(t => t.status === 'done' || t.status === 'closed').length,
      total: domainTasks.length,
    };
  }
}
