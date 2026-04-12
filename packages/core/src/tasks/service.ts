import 'reflect-metadata';
import { Service } from 'typedi';
import {
  TasksRepository,
  type Task,
  type TaskExecution,
  type TaskQueryParams,
  type TaskStatus,
  type TaskType,
  type TaskUrgency,
  type ApprovalStatus,
  STATUS_TRANSITIONS
} from './repository.js';

const logger = {
  info: (...args: any[]) => console.log('[TasksService]', ...args),
  error: (...args: any[]) => console.error('[TasksService]', ...args),
};

export interface CreateTaskRequest {
  name: string;
  description?: string;
  type: TaskType;
  category?: string;
  urgency?: TaskUrgency;
  priority?: number;
  dueDate?: number;
  estimatedHours?: number;
  ownerId?: string;
  assigneeId?: string;
  approverId?: string;
  dependsOn?: string[];
  tags?: string[];
  webhookUrl?: string;
  notifyOnComplete?: boolean;
  createdBy: string;
}

export interface UpdateTaskRequest {
  name?: string;
  description?: string;
  category?: string;
  urgency?: TaskUrgency;
  priority?: number;
  dueDate?: number;
  estimatedHours?: number;
  ownerId?: string;
  assigneeId?: string;
  approverId?: string;
  tags?: string[];
  webhookUrl?: string;
  notifyOnComplete?: boolean;
  updatedBy: string;
}

@Service()
export class TasksService {
  constructor(private repo: TasksRepository) {}

  // ==================== CRUD ====================

  async list(params: TaskQueryParams = {}): Promise<Task[]> {
    return this.repo.query(params);
  }

  async get(id: string): Promise<Task | null> {
    return this.repo.getById(id);
  }

  async getByTaskId(taskId: string): Promise<Task | null> {
    return this.repo.getByTaskId(taskId);
  }

  async create(data: CreateTaskRequest): Promise<Task> {
    const taskId = await this.repo.getNextTaskId();
    const now = Date.now();

    const task: Task = {
      id: `task_${now}_${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      name: data.name,
      description: data.description,
      type: data.type,
      category: data.category,
      status: 'PENDING',
      priority: data.priority || 50,
      urgency: data.urgency || 'MEDIUM',
      createdAt: now,
      startedAt: undefined,
      completedAt: undefined,
      dueDate: data.dueDate,
      estimatedHours: data.estimatedHours,
      actualHours: undefined,
      creatorId: data.createdBy,
      ownerId: data.ownerId,
      assigneeId: data.assigneeId,
      approverId: data.approverId,
      approvalStatus: data.approverId ? 'PENDING' : 'SKIPPED',
      approvedBy: undefined,
      approvedAt: undefined,
      approvalNote: undefined,
      dependsOn: data.dependsOn || [],
      tags: data.tags || [],
      webhookUrl: data.webhookUrl,
      notifyOnComplete: data.notifyOnComplete || false,
      createdBy: data.createdBy,
      updatedBy: data.createdBy,
      updatedAt: now,
    };

    // Validate dependencies
    if (data.dependsOn && data.dependsOn.length > 0) {
      for (const depId of data.dependsOn) {
        const dep = await this.repo.getById(depId);
        if (!dep) {
          throw new Error(`Dependency task ${depId} not found`);
        }
        if (dep.status !== 'COMPLETED') {
          throw new Error(`Dependency task ${depId} is not completed`);
        }
      }
    }

    await this.repo.create(task);
    logger.info(`Created task: ${task.taskId} - ${task.name}`);
    
    return task;
  }

  async update(id: string, data: UpdateTaskRequest): Promise<Task> {
    const existing = await this.repo.getById(id);
    if (!existing) {
      throw new Error(`Task not found: ${id}`);
    }

    const updated = await this.repo.update(id, {
      ...data,
      updatedAt: Date.now(),
    });
    
    logger.info(`Updated task: ${existing.taskId}`);
    return updated!;
  }

  async delete(id: string): Promise<boolean> {
    return this.repo.delete(id);
  }

  // ==================== Status Workflow ====================

  async updateStatus(id: string, newStatus: TaskStatus): Promise<Task> {
    const task = await this.repo.getById(id);
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }

    // Validate status transition
    if (!this.repo.canTransition(task.status, newStatus)) {
      throw new Error(`Invalid status transition: ${task.status} -> ${newStatus}`);
    }

    // Check approval requirement
    if (task.approvalStatus === 'PENDING' && newStatus !== 'PENDING') {
      throw new Error('Task requires approval before execution');
    }

    const updated = await this.repo.updateStatus(id, newStatus);
    logger.info(`Task ${task.taskId} status: ${task.status} -> ${newStatus}`);
    
    return updated!;
  }

  // ==================== Approval ====================

  async approve(id: string, approverId: string, approved: boolean, note?: string): Promise<Task> {
    const task = await this.repo.getById(id);
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }

    if (task.approvalStatus !== 'PENDING') {
      throw new Error('Task does not require approval');
    }

    const now = Date.now();
    const updates: Partial<Task> = {
      approvalStatus: approved ? 'APPROVED' : 'REJECTED',
      approvedBy: approverId,
      approvedAt: now,
      approvalNote: note,
      updatedAt: now,
    };

    // If approved, set to ready
    if (approved) {
      updates.status = 'READY';
    }

    const updated = await this.repo.update(id, updates);
    logger.info(`Task ${task.taskId} ${approved ? 'approved' : 'rejected'} by ${approverId}`);
    
    return updated!;
  }

  // ==================== Execution ====================

  async execute(id: string, userId: string, simulate: boolean = false): Promise<{ task: Task; execution: TaskExecution }> {
    const task = await this.repo.getById(id);
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }

    // Check if task can be executed
    if (task.status === 'RUNNING') {
      throw new Error('Task is already running');
    }
    if (task.status === 'COMPLETED') {
      throw new Error('Task is already completed');
    }
    if (task.approvalStatus === 'PENDING') {
      throw new Error('Task requires approval before execution');
    }
    if (task.approvalStatus === 'REJECTED') {
      throw new Error('Task has been rejected');
    }

    // Get previous executions
    const executions = await this.repo.getExecutionsByTaskId(id);
    const attempt = executions.length + 1;
    const now = Date.now();

    // Create execution record
    const execution: TaskExecution = {
      id: `exec_${now}_${Math.random().toString(36).substr(2, 9)}`,
      taskId: id,
      attempt,
      status: simulate ? 'SUCCESS' : 'STARTED',
      startedAt: now,
      completedAt: simulate ? now : undefined,
      durationMs: simulate ? 100 : undefined,
      output: simulate ? 'Task executed successfully (simulated)' : undefined,
      executedBy: userId,
      retryCount: 0,
      maxRetries: 3,
    };

    await this.repo.createExecution(execution);

    // Update task status
    const taskStatus: TaskStatus = simulate ? 'COMPLETED' : 'RUNNING';
    const taskUpdates: Partial<Task> = {
      status: taskStatus,
      updatedAt: now,
    };

    if (simulate) {
      taskUpdates.completedAt = now;
      taskUpdates.actualHours = 0.0001;
    } else {
      taskUpdates.startedAt = now;
    }

    const updatedTask = await this.repo.update(id, taskUpdates);
    logger.info(`Task ${task.taskId} execution started (attempt ${attempt})`);
    
    return { task: updatedTask!, execution };
  }

  async getExecutions(taskId: string): Promise<TaskExecution[]> {
    return this.repo.getExecutionsByTaskId(taskId);
  }

  // ==================== Stats ====================

  async getStats() {
    return this.repo.getStats();
  }

  // ==================== Helpers ====================

  getValidTransitions(status: TaskStatus): TaskStatus[] {
    return STATUS_TRANSITIONS[status] || [];
  }

  async canApprove(taskId: string, userId: string): Promise<boolean> {
    const task = await this.repo.getById(taskId);
    if (!task) return false;
    return task.approverId === userId || task.ownerId === userId;
  }

  async canExecute(taskId: string, userId: string): Promise<boolean> {
    const task = await this.repo.getById(taskId);
    if (!task) return false;
    return task.assigneeId === userId || task.ownerId === userId || task.creatorId === userId;
  }
}
