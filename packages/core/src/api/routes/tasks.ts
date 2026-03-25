/**
 * Tasks Routes
 * RESTful API for task management
 * DB-004: 任务库 API
 */

import { Router, Request, Response, NextFunction } from 'express';
import { JsonStore } from '../../storage/json-store.js';
import { ApiError, ErrorCodes, successResponse, PaginatedResponse } from '../types.js';

const router = Router();

// Initialize store
const jsonStore = new JsonStore('./data/storage');

// ==================== Types ====================

export interface Task {
  id: string;
  taskId: string;
  name: string;
  description?: string;
  type: TaskType;
  category?: string;
  
  // Status
  status: TaskStatus;
  
  // Priority
  priority: number;
  urgency: TaskUrgency;
  
  // Time
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  dueDate?: number;
  
  // Hours
  estimatedHours?: number;
  actualHours?: number;
  
  // Assignment
  creatorId: string;
  ownerId?: string;
  assigneeId?: string;
  approverId?: string;
  
  // Approval
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: number;
  approvalNote?: string;
  
  // Dependencies
  dependsOn: string[];
  
  // Tags
  tags: string[];
  
  // Webhook
  webhookUrl?: string;
  notifyOnComplete: boolean;
  
  // Audit
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

// ==================== Valid Enums ====================

const TaskTypes = ['SCAN', 'REMEDIATION', 'NOTIFICATION', 'REPORT', 'COMPLIANCE', 'AUTOMATION', 'MANUAL', 'OTHER'] as const;
const TaskStatuses = ['PENDING', 'READY', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'PAUSED'] as const;
const TaskUrgencies = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
const ApprovalStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'SKIPPED'] as const;

// Valid status transitions
const StatusTransitions: Record<TaskStatus, TaskStatus[]> = {
  PENDING: ['READY', 'CANCELLED'],
  READY: ['RUNNING', 'CANCELLED'],
  RUNNING: ['COMPLETED', 'FAILED', 'PAUSED', 'CANCELLED'],
  COMPLETED: ['PENDING'], // Can reopen
  FAILED: ['PENDING', 'RUNNING', 'CANCELLED'], // Can retry
  CANCELLED: ['PENDING'], // Can restart
  PAUSED: ['RUNNING', 'CANCELLED'],
};

// ==================== Helpers ====================

async function getTasksStore() {
  const data = await jsonStore.get<Task[]>('tasks.json');
  return data || [];
}

async function saveTasksStore(data: Task[]) {
  await jsonStore.set('tasks.json', data);
}

async function getExecutionsStore() {
  const data = await jsonStore.get<TaskExecution[]>('task-executions.json');
  return data || [];
}

async function saveExecutionsStore(data: TaskExecution[]) {
  await jsonStore.set('task-executions.json', data);
}

function generateTaskId(): string {
  return `TASK-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

function canApprove(task: Task, userId: string): boolean {
  return task.approverId === userId || task.ownerId === userId;
}

function canExecute(task: Task, userId: string): boolean {
  return task.assigneeId === userId || task.ownerId === userId || task.creatorId === userId;
}

// ==================== Routes ====================

/**
 * GET /api/v1/tasks - List tasks
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      status,
      type,
      urgency,
      ownerId,
      assigneeId,
      approvalStatus,
      page = '1',
      pageSize = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    let tasks = await getTasksStore();

    // Filters
    if (status) {
      tasks = tasks.filter(t => t.status === status);
    }
    if (type) {
      tasks = tasks.filter(t => t.type === type);
    }
    if (urgency) {
      tasks = tasks.filter(t => t.urgency === urgency);
    }
    if (ownerId) {
      tasks = tasks.filter(t => t.ownerId === ownerId);
    }
    if (assigneeId) {
      tasks = tasks.filter(t => t.assigneeId === assigneeId);
    }
    if (approvalStatus) {
      tasks = tasks.filter(t => t.approvalStatus === approvalStatus);
    }

    // Sort
    tasks.sort((a, b) => {
      const aVal = a[sortBy as keyof Task] as number;
      const bVal = b[sortBy as keyof Task] as number;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    // Pagination
    const pageNum = parseInt(page as string, 10);
    const pageSizeNum = parseInt(pageSize as string, 10);
    const total = tasks.length;
    const totalPages = Math.ceil(total / pageSizeNum);
    const paginatedData = tasks.slice((pageNum - 1) * pageSizeNum, pageNum * pageSizeNum);

    const response: PaginatedResponse<Task> = {
      data: paginatedData,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages,
      },
    };

    res.json(successResponse(response, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/tasks/enums - Get task enum values
 */
router.get('/enums', (req: Request, res: Response) => {
  res.json(successResponse({
    types: TaskTypes,
    statuses: TaskStatuses,
    urgencies: TaskUrgencies,
    approvalStatuses: ApprovalStatuses,
    statusTransitions: StatusTransitions,
  }, (req as any).requestId));
});

/**
 * GET /api/v1/tasks/stats - Get task statistics
 */
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tasks = await getTasksStore();

    const stats = {
      total: tasks.length,
      byStatus: {
        PENDING: tasks.filter(t => t.status === 'PENDING').length,
        READY: tasks.filter(t => t.status === 'READY').length,
        RUNNING: tasks.filter(t => t.status === 'RUNNING').length,
        COMPLETED: tasks.filter(t => t.status === 'COMPLETED').length,
        FAILED: tasks.filter(t => t.status === 'FAILED').length,
        CANCELLED: tasks.filter(t => t.status === 'CANCELLED').length,
        PAUSED: tasks.filter(t => t.status === 'PAUSED').length,
      },
      byType: TaskTypes.reduce((acc, type) => {
        acc[type] = tasks.filter(t => t.type === type).length;
        return acc;
      }, {} as Record<string, number>),
      byUrgency: {
        CRITICAL: tasks.filter(t => t.urgency === 'CRITICAL').length,
        HIGH: tasks.filter(t => t.urgency === 'HIGH').length,
        MEDIUM: tasks.filter(t => t.urgency === 'MEDIUM').length,
        LOW: tasks.filter(t => t.urgency === 'LOW').length,
      },
      pendingApproval: tasks.filter(t => t.approvalStatus === 'PENDING').length,
      overdue: tasks.filter(t => t.dueDate && t.dueDate < Date.now() && t.status !== 'COMPLETED').length,
    };

    res.json(successResponse(stats, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/tasks/:id - Get task by ID with executions
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const tasks = await getTasksStore();
    const task = tasks.find(t => t.id === id);

    if (!task) {
      throw new ApiError(ErrorCodes.TASK_NOT_FOUND, `Task with id ${id} not found`, 404);
    }

    // Get executions
    const executions = await getExecutionsStore();
    const taskExecutions = executions.filter(e => e.taskId === id).sort((a, b) => b.startedAt - a.startedAt);

    res.json(successResponse({
      ...task,
      executions: taskExecutions,
    }, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/tasks - Create new task
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;

    // Validate required fields
    if (!data.name) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, 'Task name is required', 400);
    }
    if (!data.type) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, 'Task type is required', 400);
    }
    if (!data.creatorId) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, 'Creator ID is required', 400);
    }

    // Validate enum values
    if (data.type && !TaskTypes.includes(data.type as any)) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, `Invalid type`, 400);
    }
    if (data.urgency && !TaskUrgencies.includes(data.urgency as any)) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, `Invalid urgency`, 400);
    }

    // Check dependencies exist
    if (data.dependsOn && data.dependsOn.length > 0) {
      const tasks = await getTasksStore();
      for (const depId of data.dependsOn) {
        const dep = tasks.find(t => t.id === depId);
        if (!dep) {
          throw new ApiError(ErrorCodes.VALIDATION_ERROR, `Dependency task ${depId} not found`, 400);
        }
        if (dep.status !== 'COMPLETED') {
          throw new ApiError(ErrorCodes.VALIDATION_ERROR, `Dependency task ${depId} is not completed`, 400);
        }
      }
    }

    const now = Date.now();
    const task: Task = {
      id: `task_${now}_${Math.random().toString(36).substring(2, 11)}`,
      taskId: generateTaskId(),
      name: data.name,
      description: data.description,
      type: data.type,
      category: data.category,
      status: data.status || 'PENDING',
      priority: data.priority || 50,
      urgency: data.urgency || 'MEDIUM',
      createdAt: now,
      startedAt: undefined,
      completedAt: undefined,
      dueDate: data.dueDate,
      estimatedHours: data.estimatedHours,
      actualHours: undefined,
      creatorId: data.creatorId,
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
      createdBy: data.creatorId,
      updatedBy: data.creatorId,
      updatedAt: now,
    };

    const tasks = await getTasksStore();
    tasks.push(task);
    await saveTasksStore(tasks);

    res.status(201).json(successResponse(task, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/v1/tasks/:id/status - Update task status (state machine)
 */
router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, userId: rawUserId } = req.body;
    const userId = typeof rawUserId === 'string' ? rawUserId : undefined;

    if (!status) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, 'Status is required', 400);
    }

    const tasks = await getTasksStore();
    const index = tasks.findIndex(t => t.id === id);

    if (index === -1) {
      throw new ApiError(ErrorCodes.TASK_NOT_FOUND, `Task with id ${id} not found`, 404);
    }

    const task = tasks[index];

    // Validate status transition
    if (!StatusTransitions[task.status]?.includes(status)) {
      throw new ApiError(
        ErrorCodes.INVALID_STATUS_TRANSITION,
        `Cannot transition from ${task.status} to ${status}. Valid: ${StatusTransitions[task.status]?.join(', ')}`,
        400
      );
    }

    // Update timestamps based on new status
    const now = Date.now();
    if (status === 'RUNNING' && !task.startedAt) {
      task.startedAt = now;
    }
    if (status === 'COMPLETED' || status === 'FAILED') {
      task.completedAt = now;
      if (task.startedAt) {
        task.actualHours = (now - task.startedAt) / 3600000;
      }
    }

    // Handle approval requirement
    if (task.approvalStatus === 'PENDING' && status !== 'PENDING') {
      throw new ApiError(ErrorCodes.TASK_REQUIRES_APPROVAL, 'Task requires approval before execution', 403);
    }

    task.status = status;
    task.updatedBy = userId || task.updatedBy;
    task.updatedAt = now;

    tasks[index] = task;
    await saveTasksStore(tasks);

    res.json(successResponse(task, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/tasks/:id/approve - Approve task
 */
router.post('/:id/approve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { approved, approverId, note } = req.body;

    if (approverId === undefined) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, 'Approver ID is required', 400);
    }
    if (approved === undefined) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, 'Approved flag is required', 400);
    }

    const tasks = await getTasksStore();
    const index = tasks.findIndex(t => t.id === id);

    if (index === -1) {
      throw new ApiError(ErrorCodes.TASK_NOT_FOUND, `Task with id ${id} not found`, 404);
    }

    const task = tasks[index];

    // Check if user can approve
    if (!canApprove(task, approverId)) {
      throw new ApiError(ErrorCodes.PERMISSION_DENIED, 'User is not authorized to approve this task', 403);
    }

    // Check if task needs approval
    if (task.approvalStatus !== 'PENDING') {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, 'Task does not require approval', 400);
    }

    task.approvalStatus = approved ? 'APPROVED' : 'REJECTED';
    task.approvedBy = approverId;
    task.approvedAt = Date.now();
    task.approvalNote = note;
    
    // If approved, set to ready
    if (approved) {
      task.status = 'READY';
    }

    task.updatedAt = Date.now();

    tasks[index] = task;
    await saveTasksStore(tasks);

    res.json(successResponse(task, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/tasks/:id/execute - Execute task
 */
router.post('/:id/execute', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { userId: rawUserId, simulate = false } = req.body;
    const userId = typeof rawUserId === 'string' ? rawUserId : undefined;

    const tasks = await getTasksStore();
    const index = tasks.findIndex(t => t.id === id);

    if (index === -1) {
      throw new ApiError(ErrorCodes.TASK_NOT_FOUND, `Task with id ${id} not found`, 404);
    }

    const task = tasks[index];

    // Check if user can execute
    if (!userId || !canExecute(task, userId)) {
      throw new ApiError(ErrorCodes.PERMISSION_DENIED, 'User is not authorized to execute this task', 403);
    }

    // Check if task can be executed
    if (task.status === 'RUNNING') {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, 'Task is already running', 400);
    }
    if (task.status === 'COMPLETED') {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, 'Task is already completed', 400);
    }
    if (task.approvalStatus === 'PENDING') {
      throw new ApiError(ErrorCodes.TASK_REQUIRES_APPROVAL, 'Task requires approval before execution', 403);
    }
    if (task.approvalStatus === 'REJECTED') {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, 'Task has been rejected', 400);
    }

    // Get previous executions
    const executions = await getExecutionsStore();
    const taskExecutions = executions.filter(e => e.taskId === id);
    const attempt = taskExecutions.length + 1;

    // Create execution record
    const now = Date.now();
    const execution: TaskExecution = {
      id: `exec_${now}_${Math.random().toString(36).substring(2, 11)}`,
      taskId: id,
      attempt,
      status: simulate ? 'SUCCESS' : 'STARTED',
      startedAt: now,
      completedAt: simulate ? now : undefined,
      durationMs: simulate ? 100 : undefined,
      output: simulate ? 'Task executed successfully (simulated)' : undefined,
      executedBy: userId || '',
      retryCount: 0,
      maxRetries: 3,
    };

    executions.push(execution);
    await saveExecutionsStore(executions);

    // Update task status
    task.status = simulate ? 'COMPLETED' : 'RUNNING';
    if (simulate) {
      task.completedAt = now;
      task.actualHours = 0.0001;
    } else {
      task.startedAt = now;
    }
    task.updatedAt = now;

    tasks[index] = task;
    await saveTasksStore(tasks);

    res.json(successResponse({
      task,
      execution,
    }, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/v1/tasks/:id - Update task
 */
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const patches = req.body;

    const tasks = await getTasksStore();
    const index = tasks.findIndex(t => t.id === id);

    if (index === -1) {
      throw new ApiError(ErrorCodes.TASK_NOT_FOUND, `Task with id ${id} not found`, 404);
    }

    const task = tasks[index];

    // Validate enum values
    if (patches.type && !TaskTypes.includes(patches.type as any)) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, `Invalid type`, 400);
    }
    if (patches.urgency && !TaskUrgencies.includes(patches.urgency as any)) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, `Invalid urgency`, 400);
    }

    // Prevent status change via PATCH (use /status endpoint)
    delete patches.status;

    const updated: Task = {
      ...task,
      ...patches,
      id: task.id,
      taskId: task.taskId,
      createdAt: task.createdAt,
      updatedAt: Date.now(),
    };

    tasks[index] = updated;
    await saveTasksStore(tasks);

    res.json(successResponse(updated, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/tasks/:id - Delete task
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    let tasks = await getTasksStore();
    const index = tasks.findIndex(t => t.id === id);

    if (index === -1) {
      throw new ApiError(ErrorCodes.TASK_NOT_FOUND, `Task with id ${id} not found`, 404);
    }

    tasks = tasks.filter(t => t.id !== id);
    await saveTasksStore(tasks);

    // Also delete related executions
    let executions = await getExecutionsStore();
    executions = executions.filter(e => e.taskId !== id);
    await saveExecutionsStore(executions);

    res.json(successResponse({ deleted: true, id }, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

export { router as tasksRouter };
