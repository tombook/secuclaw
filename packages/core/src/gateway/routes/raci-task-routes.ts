import type { RouterDeps } from '../router.js';
import { TaskEngine } from '../../raci/task-engine.js';
import { TaskRepository } from '../../raci/task-repository.js';
import { SessionRepository } from '../../raci/session-repository.js';
import { SessionManager } from '../../raci/session-manager.js';
import type { TaskStatus, ScenarioType, RoleId } from '../../raci/types.js';

let taskEngine: TaskEngine | null = null;
function getEngine(deps: RouterDeps): TaskEngine {
  if (!taskEngine) {
    const taskRepo = new TaskRepository(deps.jsonStore);
    const sessionRepo = new SessionRepository(deps.jsonStore);
    taskEngine = new TaskEngine(taskRepo, sessionRepo);
  }
  return taskEngine;
}

export function registerRaciTaskRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  deps: RouterDeps
): void {

  handlers.set('raci.task.create', async (params) => {
    const engine = getEngine(deps);
    return engine.createTask({
      sessionId: params.sessionId as string,
      title: params.title as string,
      scenario: params.scenario as ScenarioType,
      assignedRole: params.assignedRole as RoleId,
      assignedBy: params.assignedBy as string | undefined,
      priority: params.priority as 'low' | 'medium' | 'high' | 'critical' | undefined,
      eventId: params.eventId as string | undefined,
      eventType: params.eventType as 'incident' | 'vulnerability' | 'threat' | undefined,
      description: params.description as string | undefined,
    });
  });

  handlers.set('raci.task.list', async (params) => {
    return getEngine(deps).listTasks({
      sessionId: params.sessionId as string | undefined,
      role: params.role as RoleId | undefined,
      status: params.status as TaskStatus | undefined,
    });
  });

  handlers.set('raci.task.updateStatus', async (params) => {
    const { taskId, status, actor } = params;
    if (!taskId || !status || !actor) throw new Error('Missing required parameters: taskId, status, actor');
    return getEngine(deps).updateTaskStatus(taskId as string, status as TaskStatus, actor as string);
  });

  handlers.set('raci.task.assign', async (params) => {
    const { taskId, role, actor } = params;
    if (!taskId || !role) throw new Error('Missing required parameters: taskId, role');
    return getEngine(deps).assignTask(taskId as string, role as RoleId, actor as string | undefined);
  });

  handlers.set('raci.task.handoff', async (params) => {
    const { taskId, nextRole, actor } = params;
    if (!taskId || !nextRole || !actor) throw new Error('Missing required parameters: taskId, nextRole, actor');
    return getEngine(deps).handoffTask(taskId as string, nextRole as RoleId, actor as string);
  });

  handlers.set('raci.task.escalate', async (params) => {
    const { taskId, actor } = params;
    if (!taskId || !actor) throw new Error('Missing required parameters: taskId, actor');
    return getEngine(deps).escalateTask(taskId as string, actor as string);
  });

  handlers.set('raci.task.createForEvent', async (params) => {
    const { eventType, eventId } = params;
    if (!eventType || !eventId) throw new Error('Missing required parameters: eventType, eventId');
    return getEngine(deps).createTasksForEvent(eventType as string, eventId as string);
  });
}
