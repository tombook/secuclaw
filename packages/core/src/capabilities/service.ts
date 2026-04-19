import 'reflect-metadata';
import { Service } from 'typedi';
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
  OverviewMetrics,
  DomainMetrics,
  TaskPriority,
  TaskStatus,
} from './types.js';
import { ErrorCodes } from './types.js';
import { CapabilitiesRepository } from './repository.js';
 
interface EventBus {
  emit(event: string, payload: unknown): Promise<void>;
}
import { randomUUID, createHash } from 'crypto';
import { validateTaskTransition, validateRunTransition } from './state-machine.js';

export interface TaskExecutor {
  execute(toolId: string, params: Record<string, unknown>): Promise<{ status: 'success'|'failed', summary?: string, error?: string }>;
}

export class ApprovalExpiredError extends Error {
  constructor(public readonly approval: Approval) {
    super('Approval has expired');
    this.name = 'ApprovalExpiredError';
  }
}

const logger = {
  info: (...args: any[]) => console.log('[CapabilitiesService]', ...args),
  error: (...args: any[]) => console.error('[CapabilitiesService]', ...args),
  warn: (...args: any[]) => console.warn('[CapabilitiesService]', ...args),
};

@Service()
export class CapabilitiesService {
  private eventBus: EventBus | null = null;

  constructor(private repo: CapabilitiesRepository, private executor?: TaskExecutor) {}

  setEventBus(bus: EventBus): void {
    this.eventBus = bus;
  }

  private async emitEvent(event: string, payload: unknown): Promise<void> {
    if (this.eventBus) {
      try {
        await this.eventBus.emit(event, payload);
      } catch (err) {
        console.error('[CapabilitiesService] Event emission failed:', err);
      }
    }
  }

  // ==================== Domains ====================

  async listDomains(): Promise<CapabilityDomain[]> {
    return this.repo.getDomains();
  }

  async getDomain(id: DomainId): Promise<CapabilityDomain | null> {
    return this.repo.getDomain(id);
  }

  async createDomain(domain: Omit<CapabilityDomain, 'id'> & { id?: DomainId }): Promise<CapabilityDomain> {
    const domains = await this.repo.getDomains();
    const newId = (domain.id || `domain-${Date.now()}`) as DomainId;
    if (domains.find(d => d.id === newId)) throw new Error(`Domain already exists: ${newId}`);
    const newDomain = { ...domain, id: newId } as CapabilityDomain;
    domains.push(newDomain);
    await this.repo.saveDomains(domains);
    return newDomain;
  }

  async updateDomain(id: DomainId, updates: Partial<CapabilityDomain>): Promise<CapabilityDomain> {
    const domains = await this.repo.getDomains();
    const idx = domains.findIndex(d => d.id === id);
    if (idx === -1) throw new Error(`Domain not found: ${id}`);
    domains[idx] = { ...domains[idx], ...updates, id };
    await this.repo.saveDomains(domains);
    return domains[idx];
  }

  async deleteDomain(id: DomainId): Promise<void> {
    const items = await this.repo.getItemsByQuery({ domainId: id });
    if (items.length > 0) throw new Error(`Cannot delete domain ${id}: has ${items.length} items`);
    const domains = await this.repo.getDomains();
    const filtered = domains.filter(d => d.id !== id);
    if (filtered.length === domains.length) throw new Error(`Domain not found: ${id}`);
    await this.repo.saveDomains(filtered);
  }

  // ==================== Items ====================

  async listItems(params: CapabilityQueryParams = {}): Promise<CapabilityItem[]> {
    return this.repo.getItemsByQuery(params);
  }

  async getItem(id: string): Promise<CapabilityItem | null> {
    return this.repo.getItem(id);
  }

  async createItem(item: Omit<CapabilityItem, 'id'> & { id?: string }): Promise<CapabilityItem> {
    const items = await this.repo.getItems();
    const newItem = { ...item, id: item.id || `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` } as CapabilityItem;
    items.push(newItem);
    await this.repo.saveItems(items);
    return newItem;
  }

  async updateItem(id: string, updates: Partial<CapabilityItem>): Promise<CapabilityItem> {
    const items = await this.repo.getItems();
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) throw new Error(`Item not found: ${id}`);
    items[idx] = { ...items[idx], ...updates, id };
    await this.repo.saveItems(items);
    return items[idx];
  }

  async deleteItem(id: string): Promise<void> {
    const tasks = await this.repo.getTasksByQuery({ capabilityId: id });
    if (tasks.length > 0) throw new Error(`Cannot delete item ${id}: has ${tasks.length} tasks`);
    const items = await this.repo.getItems();
    const filtered = items.filter(i => i.id !== id);
    if (filtered.length === items.length) throw new Error(`Item not found: ${id}`);
    await this.repo.saveItems(filtered);
  }

  // ==================== Tasks ====================

  async listTasks(params: TaskQueryParams = {}): Promise<SecurityTask[]> {
    return this.repo.getTasksByQuery(params);
  }

  async getTask(id: string): Promise<SecurityTask | null> {
    return this.repo.getTask(id);
  }

  async createTask(params: {
    domainId: DomainId;
    capabilityId: string;
    title: string;
    description?: string;
    priority: TaskPriority;
    assigneeRole: string;
    dueAt?: number;
    slaMinutes?: number;
  }): Promise<SecurityTask> {
    // Validate capability exists
    const capability = await this.repo.getItem(params.capabilityId);
    if (!capability) {
      throw new Error(`Capability not found: ${params.capabilityId}`);
    }

    const task: SecurityTask = {
      id: `task_${randomUUID()}`,
      domainId: params.domainId,
      capabilityId: params.capabilityId,
      title: params.title,
      description: params.description,
      priority: params.priority,
      status: 'todo',
      assigneeRole: params.assigneeRole,
      dueAt: params.dueAt,
      slaMinutes: params.slaMinutes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.repo.createTask(task);
    logger.info(`Created task: ${task.id} - ${task.title}`);
    await this.emitEvent('task.created', {
      taskId: task.id,
      domainId: task.domainId,
      capabilityId: task.capabilityId,
      priority: task.priority,
    });
    
    return task;
  }

  async updateTaskStatus(params: {
    id: string;
    status: TaskStatus;
    comment?: string;
  }): Promise<SecurityTask> {
    const task = await this.repo.getTask(params.id);
    if (!task) {
      const error = new Error('Task not found');
      (error as any).code = ErrorCodes.TASK_NOT_FOUND;
      throw error;
    }

    // Validate state transition
    const ok = validateTaskTransition(task.status, params.status);
    if (!ok) {
      throw new Error(`Invalid task transition: ${task.status} -> ${params.status}`);
    }

    const updated = await this.repo.updateTask(params.id, {
      status: params.status,
      updatedAt: Date.now(),
    });

    logger.info(`Updated task ${params.id} status to ${params.status}`);
    
    if (params.status === 'done' || params.status === 'closed') {
      await this.emitEvent('task.completed', {
        taskId: params.id,
        domainId: task?.domainId ?? '',
        result: params.comment ?? '',
      });
    }
    return updated!;
  }

  // ==================== Approvals ====================

  async createApproval(params: {
    taskId: string;
    requester: string;
    scope: string;
    ticketNo: string;
    expiresAt: number;
  }): Promise<Approval> {
    // Validate task exists
    const task = await this.repo.getTask(params.taskId);
    if (!task) {
      throw new Error(`Task not found: ${params.taskId}`);
    }

    // Check domain requires approval
    if (task.domainId !== 'dark') {
      throw new Error('Only dark domain tasks require approval');
    }

    const approval: Approval = {
      id: `approval_${randomUUID()}`,
      taskId: params.taskId,
      type: 'dark-operation',
      requester: params.requester,
      scope: params.scope,
      ticketNo: params.ticketNo,
      expiresAt: params.expiresAt,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.repo.createApproval(approval);
    logger.info(`Created approval: ${approval.id} for task ${params.taskId}`);
    
    return approval;
  }

  async approveApproval(params: {
    id: string;
    approver: string;
    approved: boolean;
    reason?: string;
  }): Promise<Approval> {
    const approval = await this.repo.getApproval(params.id);
    if (!approval) {
      const error = new Error('Approval not found');
      (error as any).code = ErrorCodes.APPROVAL_NOT_FOUND;
      throw error;
    }

    if (approval.status !== 'pending') {
      throw new Error(`Approval already ${approval.status}`);
    }

    if (Date.now() > approval.expiresAt) {
      const updated = await this.repo.updateApproval(params.id, {
        status: 'expired',
        updatedAt: Date.now(),
      });
    
      await this.emitEvent('approval.expired', {
        approvalId: updated!.id,
        taskId: updated!.taskId,
      });
      throw new ApprovalExpiredError(updated!);
    }

    const updated = await this.repo.updateApproval(params.id, {
      status: params.approved ? 'approved' : 'rejected',
      approver: params.approver,
      reason: params.reason,
      approvedAt: Date.now(),
      updatedAt: Date.now(),
    });

    logger.info(`Approval ${params.id} ${params.approved ? 'approved' : 'rejected'} by ${params.approver}`);
    return updated!;
  }

  async getApprovalForTask(taskId: string): Promise<Approval | null> {
    const approvals = await this.repo.getApprovals();
    const taskApprovals = approvals.filter(a => a.taskId === taskId);
    
    // Return the latest valid approval
    const validApprovals = taskApprovals.filter(a => 
      a.status === 'approved' && Date.now() <= a.expiresAt
    );
    
    if (validApprovals.length === 0) return null;
    
    return validApprovals.sort((a, b) => b.approvedAt! - a.approvedAt!)[0];
  }

  // ==================== Execution Runs ====================

  async executeRun(params: {
    taskId: string;
    toolId: string;
    params: Record<string, unknown>;
  }): Promise<ExecutionRun> {
    const task = await this.repo.getTask(params.taskId);
    if (!task) {
      const error = new Error('Task not found');
      (error as any).code = ErrorCodes.TASK_NOT_FOUND;
      throw error;
    }

    // DARK SIDE: Check for valid approval
    if (task.domainId === 'dark') {
      const approval = await this.getApprovalForTask(params.taskId);
      if (!approval) {
        const error = new Error('Dark operation requires valid approval. Create an approval first.');
        (error as any).code = ErrorCodes.APPROVAL_REQUIRED;
        throw error;
      }
    }

    const run: ExecutionRun = {
      id: `run_${randomUUID()}`,
      taskId: params.taskId,
      domainId: task.domainId,
      toolId: params.toolId,
      params: params.params,
      status: 'queued',
      artifacts: [],
      createdBy: task.assigneeRole,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.repo.createRun(run);
    logger.info(`Created run: ${run.id} for task ${params.taskId}`);
    
    // Execute using an optional TaskExecutor if configured
    if (this.executor) {
      try {
        const result = await this.executor.execute(run.toolId, run.params);
        const finalStatus = result.status === 'success' ? 'success' : 'failed';
        await this.updateRunStatus(run.id, finalStatus as ExecutionRun['status'], result.summary, result.error);
      } catch (err) {
        await this.updateRunStatus(run.id, 'failed', undefined, String(err));
      }
    } else {
      // Simulate execution (in real implementation, this would trigger actual tool)
      logger.warn('No TaskExecutor configured, using simulated execution');
      // For now, we'll mark it as running and then success
      setTimeout(async () => {
        await this.updateRunStatus(run.id, 'running');
      }, 100);
      
      setTimeout(async () => {
        await this.updateRunStatus(run.id, 'success');
      }, 2000);
    }

    return run;
  }

  async updateRunStatus(id: string, status: ExecutionRun['status'], summary?: string, error?: string): Promise<ExecutionRun | null> {
    const existing = await this.repo.getRun(id);
    if (!existing) {
      const err = new Error('Run not found');
      (err as any).code = ErrorCodes.RUN_EXECUTION_FAILED;
      throw err;
    }
    // Validate status transition
    if (!validateRunTransition(existing.status, status)) {
      throw new Error(`Invalid run transition: ${existing.status} -> ${status}`);
    }
    const updates: Partial<ExecutionRun> = {
      status,
      updatedAt: Date.now(),
    };
    
    if (status === 'running') {
      updates.startedAt = Date.now();
    }
    if (status === 'success' || status === 'failed' || status === 'canceled') {
      updates.endedAt = Date.now();
    }
    if (summary) {
      updates.summary = summary;
    }
    if (error) {
      updates.error = error;
    }

    return this.repo.updateRun(id, updates);
  }

  async listRunsByTask(taskId: string): Promise<ExecutionRun[]> {
    return this.repo.getRunsByQuery({ taskId });
  }

  async listRuns(params: RunQueryParams): Promise<ExecutionRun[]> {
    return this.repo.getRunsByQuery(params);
  }

  // ==================== Evidence ====================

  async createEvidence(params: {
    domainId: DomainId;
    taskId?: string;
    runId?: string;
    title: string;
    description?: string;
    files: string[];
    tags?: string[];
    createdBy?: string;
  }): Promise<EvidencePack> {
    const evidence: EvidencePack = {
      id: `evidence_${randomUUID()}`,
      domainId: params.domainId,
      taskId: params.taskId,
      runId: params.runId,
      title: params.title,
      description: params.description,
      files: params.files,
      hash: this.generateHash(params.files.join(',')),
      createdAt: Date.now(),
      tags: params.tags || [],
      createdBy: params.createdBy,
    };

    await this.repo.createEvidence(evidence);
    logger.info(`Created evidence: ${evidence.id} - ${evidence.title}`);
    
    return evidence;
  }

  async listEvidence(params: EvidenceQueryParams): Promise<EvidencePack[]> {
    return this.repo.getEvidenceByQuery(params);
  }

  async updateEvidence(id: string, updates: Partial<Pick<EvidencePack, 'title' | 'description' | 'tags' | 'files'>>): Promise<EvidencePack> {
    const existing = await this.repo.getEvidenceItem(id);
    if (!existing) throw new Error(`Evidence not found: ${id}`);
    const updated = await this.repo.updateEvidence(id, {
      ...updates,
      ...(updates.files ? { hash: this.generateHash(updates.files.join(',')) } : {}),
    });
    if (!updated) throw new Error(`Evidence update failed: ${id}`);
    logger.info(`Updated evidence: ${id}`);
    return updated;
  }

  async deleteEvidence(id: string): Promise<void> {
    const existing = await this.repo.getEvidenceItem(id);
    if (!existing) throw new Error(`Evidence not found: ${id}`);
    await this.repo.deleteEvidence(id);
    logger.info(`Deleted evidence: ${id}`);
  }

  // ==================== Task Status Machine ====================

  /**
   * 获取任务SLA状态
   */
  async getTaskSLAStatus(taskId: string): Promise<{
    slaStatus: 'ok' | 'warning' | 'breached';
    remainingMinutes?: number;
    elapsedMinutes?: number;
    totalMinutes?: number;
  }> {
    const task = await this.repo.getTask(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    if (!task.slaMinutes) {
      return { slaStatus: 'ok' };
    }

    const now = Date.now();
    const createdAt = task.createdAt;
    const elapsedMs = now - createdAt;
    const elapsedMinutes = Math.floor(elapsedMs / 60000);
    const remainingMinutes = task.slaMinutes - elapsedMinutes;

    let slaStatus: 'ok' | 'warning' | 'breached';
    if (remainingMinutes < 0) {
      slaStatus = 'breached';
    } else if (remainingMinutes < task.slaMinutes * 0.2) {
      // Less than 20% time remaining
      slaStatus = 'warning';
    } else {
      slaStatus = 'ok';
    }

    return {
      slaStatus,
      remainingMinutes: remainingMinutes > 0 ? remainingMinutes : 0,
      elapsedMinutes,
      totalMinutes: task.slaMinutes,
    };
  }

  /**
   * 计算域的SLA达成率
   */
  async calculateDomainSLARate(domainId: DomainId): Promise<number> {
    const tasks = await this.repo.getTasksByQuery({ domainId });
    // Only consider tasks that have SLA to measure
    const applicable = tasks.filter(t => t.status === 'closed' || t.status === 'done');
    if (applicable.length === 0) return 100;

    let onTimeCount = 0;
    for (const task of applicable) {
      if (task.slaMinutes) {
        const elapsed = (task.updatedAt - task.createdAt) / 60000;
        if (elapsed <= task.slaMinutes) {
          onTimeCount++;
        }
      } else {
        onTimeCount++; // No SLA = always on time
      }
    }

    return Math.round((onTimeCount / applicable.length) * 100);
  }

  /**
   * 计算域的闭环率
   */
  async calculateDomainClosureRate(domainId: DomainId): Promise<number> {
    const tasks = await this.repo.getTasksByQuery({ domainId });
    if (tasks.length === 0) return 100;

    const closedTasks = tasks.filter(t => t.status === 'closed' || t.status === 'done');
    return Math.round((closedTasks.length / tasks.length) * 100);
  }

  /**
   * 更新域的KPI
   */
  async refreshDomainKPI(domainId: DomainId): Promise<CapabilityDomain> {
    const domain = await this.repo.getDomain(domainId);
    if (!domain) {
      throw new Error('Domain not found');
    }

    const closureRate = await this.calculateDomainClosureRate(domainId);
    const slaRate = await this.calculateDomainSLARate(domainId);
    
    // Calculate risk score based on open tasks
    const tasks = await this.repo.getTasksByQuery({ domainId });
    const openTasks = tasks.filter(t => t.status !== 'closed' && t.status !== 'done');
    const highPriorityTasks = openTasks.filter(t => t.priority === 'P0' || t.priority === 'P1');
    const riskScore = Math.min(100, Math.round(
      (highPriorityTasks.length * 10) + (openTasks.length * 2)
    ));

    const newKPI: DomainMetrics['kpi'] = {
      riskScore,
      closureRate,
      slaRate,
      trend: domain.kpi?.trend ?? 0,
      updatedAt: Date.now(),
    } as any; // DomainKPI compatibility
    await this.repo.updateDomainKPI(domainId, newKPI as any);

    const refreshed = await this.repo.getDomain(domainId);
    logger.info(`Refreshed KPI for domain ${domainId}: risk=${riskScore}%, closure=${closureRate}%, sla=${slaRate}%`);
    return refreshed!;
  }

  // ==================== Metrics ====================

  async getOverviewMetrics(domainId?: DomainId): Promise<OverviewMetrics> {
    const domains = await this.repo.getDomains();
    
    let filteredDomains = domains;
    if (domainId) {
      filteredDomains = domains.filter(d => d.id === domainId);
    }

    const domainMetrics: DomainMetrics[] = await Promise.all(
      filteredDomains.map(async (domain) => {
        const taskCounts = await this.repo.getTaskCountsByDomain(domain.id);
        return {
          id: domain.id,
          name: domain.name,
          kpi: domain.kpi,
          taskCounts,
        };
      })
    );

    // Calculate totals
    const totalRiskScore = Math.round(
      domainMetrics.reduce((sum, d) => sum + d.kpi.riskScore, 0) / domainMetrics.length || 0
    );
    const totalClosureRate = Math.round(
      domainMetrics.reduce((sum, d) => sum + d.kpi.closureRate, 0) / domainMetrics.length || 0
    );
    const totalSlaRate = Math.round(
      domainMetrics.reduce((sum, d) => sum + d.kpi.slaRate, 0) / domainMetrics.length || 0
    );

    return {
      domains: domainMetrics,
      totalRiskScore,
      totalClosureRate,
      totalSlaRate,
      updatedAt: Date.now(),
    };
  }

  // ==================== Helpers ====================

  private generateHash(input: string): string {
    // Use real SHA-256 for stable hashing
    return createHash('sha256').update(input).digest('hex');
  }
}
