import type { ToolTask } from '../scanner/scanner-adapter.js';
import { toolRegistry } from '../scanner/scanner-adapter.js';
import type { JsonStore } from '../storage/json-store.js';

const logger = {
  info: (...args: any[]) => console.log('[ToolTaskService]', ...args),
  error: (...args: any[]) => console.error('[ToolTaskService]', ...args),
  warn: (...args: any[]) => console.warn('[ToolTaskService]', ...args),
  debug: (...args: any[]) => console.log('[ToolTaskService:DEBUG]', ...args),
};

export class ToolTaskService {
  private tasks: Map<string, ToolTask> = new Map();
  private pollingTasks: Map<string, NodeJS.Timeout> = new Map();
  private jsonStore: JsonStore | undefined;

  constructor(store?: JsonStore) {
    this.jsonStore = store;
  }

  async initialize(): Promise<void> {
    if (this.jsonStore) {
      try {
        const savedTasks = await this.jsonStore.get<ToolTask[]>('tool-tasks.json');
        if (savedTasks) {
          for (const task of savedTasks) {
            this.tasks.set(task.id, task);
          }
          logger.info(`Loaded ${savedTasks.length} saved tasks`);
        }
      } catch (error) {
        logger.warn('Could not load saved tasks:', error);
      }
    }
  }

  private async saveTasks(): Promise<void> {
    if (this.jsonStore) {
      const tasksArray = Array.from(this.tasks.values());
      await this.jsonStore.set('tool-tasks.json', tasksArray);
    }
  }

  async createTask(
    toolId: string,
    target: string,
    config?: Record<string, unknown>
  ): Promise<ToolTask> {
    const adapter = toolRegistry.get(toolId);
    if (!adapter) {
      throw new Error(`Tool not found: ${toolId}`);
    }

    const available = await adapter.isAvailable();
    if (!available) {
      throw new Error(`Tool ${toolId} is not available`);
    }

    const task = await adapter.createTask(target, config);
    this.tasks.set(task.id, task);
    logger.info(`Created task: ${task.id} for tool ${toolId}`);
    
    await this.saveTasks();
    
    this.startPolling(task.id);
    return task;
  }

  async getTask(taskId: string): Promise<ToolTask> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    return task;
  }

  async listTasks(options?: {
    toolId?: string;
    status?: ToolTask['status'];
    limit?: number;
    offset?: number;
  }): Promise<ToolTask[]> {
    let tasks = Array.from(this.tasks.values());
    
    if (options?.toolId) {
      tasks = tasks.filter(t => t.toolId === options.toolId);
    }
    if (options?.status) {
      tasks = tasks.filter(t => t.status === options.status);
    }
    
    tasks.sort((a, b) => b.createdAt - a.createdAt);
    
    if (options?.limit) {
      const offset = options.offset || 0;
      tasks = tasks.slice(offset, offset + options.limit);
    }
    
    return tasks;
  }

  async updateTaskStatus(
    taskId: string,
    status: ToolTask['status'],
    options?: {
      progress?: number;
      logs?: string[];
      error?: string;
    }
  ): Promise<ToolTask> {
    const task = await this.getTask(taskId);
    const now = Date.now();
    
    task.status = status;
    task.updatedAt = now;
    
    if (options?.progress !== undefined) {
      task.progress = options.progress;
    }
    if (options?.logs && options.logs.length > 0) {
      task.logs = [...(task.logs || []), ...options.logs];
    }
    if (options?.error) {
      task.error = options.error;
    }
    
    if (status === 'running' && !task.startedAt) {
      task.startedAt = now;
    }
    if ((status === 'completed' || status === 'failed') && !task.completedAt) {
      task.completedAt = now;
      if (task.startedAt) {
        task.duration = now - task.startedAt;
      }
    }
    
    await this.saveTasks();
    return task;
  }

  async cancelTask(taskId: string): Promise<ToolTask> {
    const task = await this.getTask(taskId);
    
    if (task.status === 'completed' || task.status === 'failed') {
      throw new Error('Cannot cancel a completed or failed task');
    }
    
    const adapter = toolRegistry.get(task.toolId);
    if (adapter) {
      await adapter.cancelTask(taskId);
    }
    
    this.stopPolling(taskId);
    return this.updateTaskStatus(taskId, 'canceled', {
      logs: ['Task canceled by user']
    });
  }

  async getTaskResult(taskId: string): Promise<unknown> {
    const task = await this.getTask(taskId);
    
    if (task.status !== 'completed') {
      throw new Error('Task is not completed');
    }
    
    const adapter = toolRegistry.get(task.toolId);
    if (!adapter) {
      throw new Error(`Tool not found: ${task.toolId}`);
    }
    
    return adapter.getResult(taskId);
  }

  async getTaskFindings(taskId: string): Promise<unknown[]> {
    const task = await this.getTask(taskId);
    const adapter = toolRegistry.get(task.toolId);
    if (!adapter) {
      throw new Error(`Tool not found: ${task.toolId}`);
    }
    return adapter.getFindings(taskId);
  }

  private startPolling(taskId: string): void {
    if (this.pollingTasks.has(taskId)) {
      return;
    }

    const poll = async () => {
      try {
        const task = await this.getTask(taskId);
        const adapter = toolRegistry.get(task.toolId);
        
        if (!adapter) {
          this.stopPolling(taskId);
          return;
        }

        const currentStatus = await adapter.getStatus(taskId);
        
        if (currentStatus.status !== task.status || 
            currentStatus.progress !== task.progress) {
          await this.updateTaskStatus(taskId, currentStatus.status, {
            progress: currentStatus.progress,
            logs: currentStatus.logs,
            error: currentStatus.error,
          });
        }

        if (currentStatus.status === 'completed' || 
            currentStatus.status === 'failed' || 
            currentStatus.status === 'canceled') {
          this.stopPolling(taskId);
        }
      } catch (error) {
        logger.error(`Polling error for task ${taskId}:`, error);
        this.stopPolling(taskId);
      }
    };

    const interval = setInterval(poll, 2000);
    this.pollingTasks.set(taskId, interval);
    
    poll();
  }

  private stopPolling(taskId: string): void {
    const interval = this.pollingTasks.get(taskId);
    if (interval) {
      clearInterval(interval);
      this.pollingTasks.delete(taskId);
    }
  }

  shutdown(): void {
    logger.info('Shutting down tool task service...');
    for (const taskId of this.pollingTasks.keys()) {
      this.stopPolling(taskId);
    }
  }
}

export let toolTaskService: ToolTaskService | undefined;

export function initToolTaskService(store?: JsonStore): ToolTaskService {
  toolTaskService = new ToolTaskService(store);
  return toolTaskService;
}

export function getToolTaskService(): ToolTaskService {
  if (!toolTaskService) {
    throw new Error('ToolTaskService not initialized');
  }
  return toolTaskService;
}
