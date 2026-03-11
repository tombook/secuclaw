/**
 * Capabilities Service
 * 
 * 业务逻辑层，包含黑暗面审批校验等业务规则
 */

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
  DomainKPI,
  TaskPriority,
  TaskStatus,
} from './types.js';
import { ErrorCodes } from './types.js';
import { CapabilitiesRepository } from './repository.js';

const logger = {
  info: (...args: any[]) => console.log('[CapabilitiesService]', ...args),
  error: (...args: any[]) => console.error('[CapabilitiesService]', ...args),
  warn: (...args: any[]) => console.warn('[CapabilitiesService]', ...args),
};

export class CapabilitiesService {
  constructor(private repo: CapabilitiesRepository) {}

  // ==================== Domains ====================

  async listDomains(): Promise<CapabilityDomain[]> {
    return this.repo.getDomains();
  }

  async getDomain(id: DomainId): Promise<CapabilityDomain | null> {
    return this.repo.getDomain(id);
  }

  // ==================== Items ====================

  async listItems(params: CapabilityQueryParams = {}): Promise<CapabilityItem[]> {
    return this.repo.getItemsByQuery(params);
  }

  async getItem(id: string): Promise<CapabilityItem | null> {
    return this.repo.getItem(id);
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
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

    const updated = await this.repo.updateTask(params.id, {
      status: params.status,
      updatedAt: Date.now(),
    });

    logger.info(`Updated task ${params.id} status to ${params.status}`);
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
      id: `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
      const error = new Error('Approval has expired');
      (error as any).code = ErrorCodes.APPROVAL_EXPIRED;
      throw error;
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
      id: `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
    
    // Simulate execution (in real implementation, this would trigger actual tool)
    // For now, we'll mark it as running and then success
    setTimeout(async () => {
      await this.updateRunStatus(run.id, 'running');
    }, 100);
    
    setTimeout(async () => {
      await this.updateRunStatus(run.id, 'success');
    }, 2000);

    return run;
  }

  async updateRunStatus(id: string, status: ExecutionRun['status'], summary?: string, error?: string): Promise<ExecutionRun | null> {
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
      id: `evidence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
    if (tasks.length === 0) return 100;

    let onTimeCount = 0;
    for (const task of tasks) {
      if (task.status === 'closed' || task.status === 'done') {
        if (task.slaMinutes) {
          const elapsed = (task.updatedAt - task.createdAt) / 60000;
          if (elapsed <= task.slaMinutes) {
            onTimeCount++;
          }
        } else {
          onTimeCount++; // No SLA = always on time
        }
      }
    }

    return Math.round((onTimeCount / tasks.length) * 100);
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

    const updated = await this.repo.updateDomain(domainId, {
      kpi: {
        ...domain.kpi,
        riskScore,
        closureRate,
        slaRate,
        updatedAt: Date.now(),
      },
    });

    logger.info(`Refreshed KPI for domain ${domainId}: risk=${riskScore}%, closure=${closureRate}%, sla=${slaRate}%`);
    return updated!;
  }

  // ==================== Metrics ====================

  async getOverviewMetrics(domainId?: DomainId): Promise<OverviewMetrics> {
    const domains = await this.repo.getDomains();
    const tasks = await this.repo.getTasks();
    
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
    // Simple hash for demo - in production use crypto
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
}
