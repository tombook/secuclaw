import type { RouterDeps } from '../router.js';

type TaskStatus = 'PENDING' | 'READY' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'PAUSED';

const StatusTransitions: Record<TaskStatus, TaskStatus[]> = {
  PENDING: ['READY', 'CANCELLED'],
  READY: ['RUNNING', 'CANCELLED'],
  RUNNING: ['COMPLETED', 'FAILED', 'PAUSED', 'CANCELLED'],
  COMPLETED: ['PENDING'],
  FAILED: ['PENDING', 'RUNNING', 'CANCELLED'],
  CANCELLED: ['PENDING'],
  PAUSED: ['RUNNING', 'CANCELLED'],
};

export function registerTasksCrudRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  deps: RouterDeps
): void {

  async function getStore(key: string): Promise<any[]> {
    const data = await deps.jsonStore.get(key);
    return (data as any[]) || [];
  }

  async function saveStore(key: string, data: any[]): Promise<void> {
    await deps.jsonStore.set(key, data);
  }

  handlers.set('tasks.list', async (params) => {
    let tasks = await getStore('tasks.json');
    if (params.status) tasks = tasks.filter((t: any) => t.status === params.status);
    if (params.type) tasks = tasks.filter((t: any) => t.type === params.type);
    if (params.urgency) tasks = tasks.filter((t: any) => t.urgency === params.urgency);
    if (params.ownerId) tasks = tasks.filter((t: any) => t.ownerId === params.ownerId);
    if (params.assigneeId) tasks = tasks.filter((t: any) => t.assigneeId === params.assigneeId);
    if (params.approvalStatus) tasks = tasks.filter((t: any) => t.approvalStatus === params.approvalStatus);

    const sortBy = (params.sortBy as string) || 'createdAt';
    const sortOrder = (params.sortOrder as string) || 'desc';
    tasks.sort((a: any, b: any) => {
      const aVal = a[sortBy], bVal = b[sortBy];
      if (typeof aVal === 'number' && typeof bVal === 'number') return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      return 0;
    });

    const page = Number(params.page) || 1;
    const pageSize = Number(params.pageSize) || 20;
    const total = tasks.length;
    const paginated = tasks.slice((page - 1) * pageSize, page * pageSize);
    return { data: paginated, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  });

  handlers.set('tasks.get', async (params) => {
    const { id } = params;
    if (!id) throw new Error('Missing required parameter: id');
    const tasks = await getStore('tasks.json');
    const task = tasks.find((t: any) => t.id === id);
    if (!task) throw new Error(`Task with id ${id} not found`);
    const executions = await getStore('task-executions.json');
    return { ...task, executions: executions.filter((e: any) => e.taskId === id).sort((a: any, b: any) => b.startedAt - a.startedAt) };
  });

  handlers.set('tasks.create', async (params) => {
    const data = params as Record<string, unknown>;
    if (!data.name) throw new Error('Task name is required');
    if (!data.type) throw new Error('Task type is required');
    if (!data.creatorId) throw new Error('Creator ID is required');

    const now = Date.now();
    const task = {
      id: `task_${now}_${Math.random().toString(36).substring(2, 11)}`,
      taskId: `TASK-${now}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      name: data.name, description: data.description, type: data.type, category: data.category,
      status: data.status || 'PENDING', priority: data.priority || 50, urgency: data.urgency || 'MEDIUM',
      createdAt: now, startedAt: undefined, completedAt: undefined, dueDate: data.dueDate,
      estimatedHours: data.estimatedHours, actualHours: undefined,
      creatorId: data.creatorId, ownerId: data.ownerId, assigneeId: data.assigneeId, approverId: data.approverId,
      approvalStatus: data.approverId ? 'PENDING' : 'SKIPPED',
      approvedBy: undefined, approvedAt: undefined, approvalNote: undefined,
      dependsOn: data.dependsOn || [], tags: data.tags || [],
      webhookUrl: data.webhookUrl, notifyOnComplete: data.notifyOnComplete || false,
      createdBy: data.creatorId, updatedBy: data.creatorId, updatedAt: now,
    };

    const tasks = await getStore('tasks.json');
    tasks.push(task);
    await saveStore('tasks.json', tasks);
    return task;
  });

  handlers.set('tasks.updateStatus', async (params) => {
    const { id, status } = params;
    const userId = params.userId as string | undefined;
    if (!id || !status) throw new Error('id and status are required');
    const tasks = await getStore('tasks.json');
    const index = tasks.findIndex((t: any) => t.id === id);
    if (index === -1) throw new Error(`Task with id ${id} not found`);
    const task = tasks[index];
    if (!StatusTransitions[task.status as TaskStatus]?.includes(status as TaskStatus)) {
      throw new Error(`Cannot transition from ${task.status} to ${status}`);
    }
    if (task.approvalStatus === 'PENDING' && status !== 'PENDING') {
      throw new Error('Task requires approval before execution');
    }
    const now = Date.now();
    if (status === 'RUNNING' && !task.startedAt) task.startedAt = now;
    if (status === 'COMPLETED' || status === 'FAILED') {
      task.completedAt = now;
      if (task.startedAt) task.actualHours = (now - task.startedAt) / 3600000;
    }
    task.status = status;
    task.updatedBy = userId || task.updatedBy;
    task.updatedAt = now;
    tasks[index] = task;
    await saveStore('tasks.json', tasks);
    return task;
  });

  handlers.set('tasks.approve', async (params) => {
    const { id, approved, approverId, note } = params;
    if (!id || approverId === undefined || approved === undefined) throw new Error('id, approverId, and approved are required');
    const tasks = await getStore('tasks.json');
    const index = tasks.findIndex((t: any) => t.id === id);
    if (index === -1) throw new Error(`Task with id ${id} not found`);
    const task = tasks[index];
    if (task.approvalStatus !== 'PENDING') throw new Error('Task does not require approval');
    task.approvalStatus = approved ? 'APPROVED' : 'REJECTED';
    task.approvedBy = approverId as string;
    task.approvedAt = Date.now();
    task.approvalNote = note as string | undefined;
    if (approved) task.status = 'READY';
    task.updatedAt = Date.now();
    tasks[index] = task;
    await saveStore('tasks.json', tasks);
    return task;
  });

  handlers.set('tasks.update', async (params) => {
    const { id, ...patches } = params;
    if (!id) throw new Error('Missing required parameter: id');
    const tasks = await getStore('tasks.json');
    const index = tasks.findIndex((t: any) => t.id === id);
    if (index === -1) throw new Error(`Task with id ${id} not found`);
    const task = tasks[index];
    delete (patches as any).status;
    tasks[index] = { ...task, ...patches, id: task.id, taskId: task.taskId, createdAt: task.createdAt, updatedAt: Date.now() };
    await saveStore('tasks.json', tasks);
    return tasks[index];
  });

  handlers.set('tasks.delete', async (params) => {
    const { id } = params;
    if (!id) throw new Error('Missing required parameter: id');
    let tasks = await getStore('tasks.json');
    if (!tasks.find((t: any) => t.id === id)) throw new Error(`Task with id ${id} not found`);
    tasks = tasks.filter((t: any) => t.id !== id);
    await saveStore('tasks.json', tasks);
    let executions = await getStore('task-executions.json');
    executions = executions.filter((e: any) => e.taskId !== id);
    await saveStore('task-executions.json', executions);
    return { deleted: true, id };
  });

  handlers.set('tasks.stats', async () => {
    const tasks = await getStore('tasks.json');
    return {
      total: tasks.length,
      byStatus: Object.fromEntries(['PENDING','READY','RUNNING','COMPLETED','FAILED','CANCELLED','PAUSED'].map(s => [s, tasks.filter((t: any) => t.status === s).length])),
      byType: Object.fromEntries(['SCAN','REMEDIATION','NOTIFICATION','REPORT','COMPLIANCE','AUTOMATION','MANUAL','OTHER'].map(t => [t, tasks.filter((k: any) => k.type === t).length])),
      byUrgency: Object.fromEntries(['CRITICAL','HIGH','MEDIUM','LOW'].map(u => [u, tasks.filter((t: any) => t.urgency === u).length])),
      pendingApproval: tasks.filter((t: any) => t.approvalStatus === 'PENDING').length,
      overdue: tasks.filter((t: any) => t.dueDate && t.dueDate < Date.now() && t.status !== 'COMPLETED').length,
    };
  });

  handlers.set('tasks.enums', async () => ({
    types: ['SCAN', 'REMEDIATION', 'NOTIFICATION', 'REPORT', 'COMPLIANCE', 'AUTOMATION', 'MANUAL', 'OTHER'],
    statuses: ['PENDING', 'READY', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'PAUSED'],
    urgencies: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    approvalStatuses: ['PENDING', 'APPROVED', 'REJECTED', 'SKIPPED'],
    statusTransitions: StatusTransitions,
  }));
}
