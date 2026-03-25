/**
 * Tasks Repository
 * 任务管理数据访问层
 */

import type { JsonStore } from '../storage/json-store.js';

const FILE_NAME = 'tasks.json';
const EXECUTIONS_FILE = 'task-executions.json';

export interface Task {
  id: string;
  taskId: string;
  name: string;
  description?: string;
  type: TaskType;
  category?: string;
  status: TaskStatus;
  priority: number;
  urgency: TaskUrgency;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  dueDate?: number;
  estimatedHours?: number;
  actualHours?: number;
  creatorId: string;
  ownerId?: string;
  assigneeId?: string;
  approverId?: string;
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: number;
  approvalNote?: string;
  dependsOn: string[];
  tags: string[];
  webhookUrl?: string;
  notifyOnComplete: boolean;
  createdBy: string;
  updatedBy: string;
  updatedAt: number;
}

export interface TaskExecution {
  id: string;
  taskId: string;
  attempt: number;
  status: TaskExecutionStatus;
  startedAt: number;
  completedAt?: number;
  durationMs?: number;
  output?: string;
  error?: string;
  exitCode?: number;
  executedBy?: string;
  retryCount: number;
  maxRetries: number;
}

export type TaskType = 
  | 'SCAN' 
  | 'REMEDIATION' 
  | 'NOTIFICATION' 
  | 'REPORT' 
  | 'COMPLIANCE' 
  | 'AUTOMATION' 
  | 'MANUAL' 
  | 'OTHER';

export type TaskStatus = 
  | 'PENDING' 
  | 'READY' 
  | 'RUNNING' 
  | 'COMPLETED' 
  | 'FAILED' 
  | 'CANCELLED' 
  | 'PAUSED';

export type TaskUrgency = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';

export type TaskExecutionStatus = 'STARTED' | 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'CANCELLED';

export interface TaskQueryParams {
  type?: TaskType;
  status?: TaskStatus;
  urgency?: TaskUrgency;
  ownerId?: string;
  assigneeId?: string;
  creatorId?: string;
  approvalStatus?: ApprovalStatus;
  page?: number;
  pageSize?: number;
}

// 有效状态转换
export const STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  PENDING: ['READY', 'CANCELLED'],
  READY: ['RUNNING', 'CANCELLED'],
  RUNNING: ['COMPLETED', 'FAILED', 'PAUSED', 'CANCELLED'],
  COMPLETED: ['PENDING'],
  FAILED: ['PENDING', 'RUNNING', 'CANCELLED'],
  CANCELLED: ['PENDING'],
  PAUSED: ['RUNNING', 'CANCELLED'],
};

export class TasksRepository {
  constructor(private store: JsonStore) {}

  // ==================== Task Methods ====================

  async getAll(): Promise<Task[]> {
    return this.store.get<Task[]>(FILE_NAME) || [];
  }

  async getById(id: string): Promise<Task | null> {
    const tasks = await this.getAll();
    return tasks.find(t => t.id === id) || null;
  }

  async getByTaskId(taskId: string): Promise<Task | null> {
    const tasks = await this.getAll();
    return tasks.find(t => t.taskId === taskId) || null;
  }

  async query(params: TaskQueryParams): Promise<Task[]> {
    let tasks = await this.getAll();

    if (params.type) tasks = tasks.filter(t => t.type === params.type);
    if (params.status) tasks = tasks.filter(t => t.status === params.status);
    if (params.urgency) tasks = tasks.filter(t => t.urgency === params.urgency);
    if (params.ownerId) tasks = tasks.filter(t => t.ownerId === params.ownerId);
    if (params.assigneeId) tasks = tasks.filter(t => t.assigneeId === params.assigneeId);
    if (params.creatorId) tasks = tasks.filter(t => t.creatorId === params.creatorId);
    if (params.approvalStatus) tasks = tasks.filter(t => t.approvalStatus === params.approvalStatus);

    if (params.page !== undefined && params.pageSize) {
      const start = (params.page - 1) * params.pageSize;
      tasks = tasks.slice(start, start + params.pageSize);
    }

    return tasks;
  }

  async getStats(): Promise<{
    total: number;
    byStatus: Record<TaskStatus, number>;
    byType: Record<TaskType, number>;
    byUrgency: Record<TaskUrgency, number>;
    pendingApproval: number;
    overdue: number;
  }> {
    const tasks = await this.getAll();
    
    const byStatus: Record<TaskStatus, number> = {
      PENDING: 0, READY: 0, RUNNING: 0, COMPLETED: 0, FAILED: 0, CANCELLED: 0, PAUSED: 0
    };
    const byType: Record<TaskType, number> = {
      SCAN: 0, REMEDIATION: 0, NOTIFICATION: 0, REPORT: 0, COMPLIANCE: 0, AUTOMATION: 0, MANUAL: 0, OTHER: 0
    };
    const byUrgency: Record<TaskUrgency, number> = {
      CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0
    };

    let pendingApproval = 0;
    let overdue = 0;
    const now = Date.now();

    for (const task of tasks) {
      byStatus[task.status] = (byStatus[task.status] || 0) + 1;
      byType[task.type] = (byType[task.type] || 0) + 1;
      byUrgency[task.urgency] = (byUrgency[task.urgency] || 0) + 1;
      
      if (task.approvalStatus === 'PENDING') pendingApproval++;
      if (task.dueDate && task.dueDate < now && task.status !== 'COMPLETED') overdue++;
    }

    return { total: tasks.length, byStatus, byType, byUrgency, pendingApproval, overdue };
  }

  async create(task: Task): Promise<Task> {
    const tasks = await this.getAll();
    tasks.push(task);
    await this.store.set(FILE_NAME, tasks);
    return task;
  }

  async update(id: string, updates: Partial<Task>): Promise<Task | null> {
    const tasks = await this.getAll();
    const index = tasks.findIndex(t => t.id === id);
    
    if (index === -1) {
      return null;
    }

    tasks[index] = { ...tasks[index], ...updates };
    await this.store.set(FILE_NAME, tasks);
    return tasks[index];
  }

  async delete(id: string): Promise<boolean> {
    const tasks = await this.getAll();
    const filtered = tasks.filter(t => t.id !== id);
    
    if (filtered.length === tasks.length) {
      return false;
    }

    await this.store.set(FILE_NAME, filtered);
    
    // Also delete related executions
    const executions = await this.getAllExecutions();
    const filteredExecutions = executions.filter(e => e.taskId !== id);
    await this.store.set(EXECUTIONS_FILE, filteredExecutions);
    
    return true;
  }

  async updateStatus(id: string, newStatus: TaskStatus): Promise<Task | null> {
    const task = await this.getById(id);
    if (!task) return null;

    // Validate status transition
    const allowed = STATUS_TRANSITIONS[task.status];
    if (!allowed.includes(newStatus)) {
      throw new Error(`Invalid status transition: ${task.status} -> ${newStatus}`);
    }

    const now = Date.now();
    const updates: Partial<Task> = {
      status: newStatus,
      updatedAt: now,
    };

    if (newStatus === 'RUNNING' && !task.startedAt) {
      updates.startedAt = now;
    }
    if (newStatus === 'COMPLETED' || newStatus === 'FAILED') {
      updates.completedAt = now;
      if (task.startedAt) {
        updates.actualHours = (now - task.startedAt) / 3600000;
      }
    }

    return this.update(id, updates);
  }

  // ==================== Execution Methods ====================

  async getAllExecutions(): Promise<TaskExecution[]> {
    return this.store.get<TaskExecution[]>(EXECUTIONS_FILE) || [];
  }

  async getExecutionsByTaskId(taskId: string): Promise<TaskExecution[]> {
    const executions = await this.getAllExecutions();
    return executions.filter(e => e.taskId === taskId);
  }

  async createExecution(execution: TaskExecution): Promise<TaskExecution> {
    const executions = await this.getAllExecutions();
    executions.push(execution);
    await this.store.set(EXECUTIONS_FILE, executions);
    return execution;
  }

  async updateExecution(id: string, updates: Partial<TaskExecution>): Promise<TaskExecution | null> {
    const executions = await this.getAllExecutions();
    const index = executions.findIndex(e => e.id === id);
    
    if (index === -1) {
      return null;
    }

    executions[index] = { ...executions[index], ...updates };
    await this.store.set(EXECUTIONS_FILE, executions);
    return executions[index];
  }

  // ==================== Helper Methods ====================

  canTransition(current: TaskStatus, next: TaskStatus): boolean {
    return STATUS_TRANSITIONS[current]?.includes(next) || false;
  }

  async getNextTaskId(): Promise<string> {
    const tasks = await this.getAll();
    const year = new Date().getFullYear();
    const maxNum = tasks.reduce((max, task) => {
      const match = task.taskId?.match(/TASK-(\d+)-(\w+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    return `TASK-${year}-${String(maxNum + 1).padStart(6, '0')}`;
  }
}
