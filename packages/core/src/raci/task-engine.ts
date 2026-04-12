import { TaskRepository } from './task-repository.js';
import { SessionRepository } from './session-repository.js';
import type { RaciTask, TaskStatus, ScenarioType, RoleId } from './types.js';
import { RACI_SCENARIO_MAP, ROLE_HIERARCHY } from './types.js';

const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  'created': ['assigned'],
  'assigned': ['in_progress'],
  'in_progress': ['pending_handoff', 'completed', 'escalated'],
  'pending_handoff': ['completed'],
  'completed': [],
  'escalated': ['in_progress'],
};

export class TaskEngine {
  constructor(
    private taskRepo: TaskRepository,
    private sessionRepo: SessionRepository,
  ) {}

  validateTransition(from: TaskStatus, to: TaskStatus): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
  }

  async createTask(input: {
    sessionId: string;
    title: string;
    scenario: ScenarioType;
    assignedRole: RoleId;
    assignedBy?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    eventId?: string;
    eventType?: 'incident' | 'vulnerability' | 'threat';
    description?: string;
    parentTaskId?: string;
  }): Promise<RaciTask> {
    const task = await this.taskRepo.create({
      sessionId: input.sessionId,
      title: input.title,
      description: input.description,
      scenario: input.scenario,
      assignedRole: input.assignedRole,
      assignedBy: input.assignedBy,
      status: 'created',
      priority: input.priority || 'medium',
      eventId: input.eventId,
      eventType: input.eventType,
      parentTaskId: input.parentTaskId,
      escalationLevel: 0,
    });

    await this.sessionRepo.addTimelineEvent({
      sessionId: input.sessionId,
      type: 'task_created',
      actor: input.assignedBy || 'system',
      actorRole: input.assignedRole,
      data: { taskId: task.id, title: input.title },
    });

    return task;
  }

  async assignTask(taskId: string, role: RoleId, actor?: string): Promise<RaciTask> {
    const task = await this.taskRepo.update(taskId, { assignedRole: role, status: 'assigned' });
    if (!task) throw new Error(`Task ${taskId} not found`);

    await this.sessionRepo.addTimelineEvent({
      sessionId: task.sessionId,
      type: 'task_assigned',
      actor: actor || 'system',
      actorRole: role,
      data: { taskId, assignedRole: role },
    });

    return task;
  }

  async updateTaskStatus(taskId: string, newStatus: TaskStatus, actor: string): Promise<RaciTask> {
    const existing = await this.taskRepo.getById(taskId);
    if (!existing) throw new Error(`Task ${taskId} not found`);
    if (!this.validateTransition(existing.status, newStatus)) {
      throw new Error(`Invalid transition: ${existing.status} → ${newStatus}`);
    }

    const updates: Partial<RaciTask> = { status: newStatus };
    if (newStatus === 'completed') updates.completedAt = Date.now();

    const task = await this.taskRepo.update(taskId, updates);
    if (!task) throw new Error(`Task ${taskId} update failed`);

    await this.sessionRepo.addTimelineEvent({
      sessionId: task.sessionId,
      type: newStatus === 'completed' ? 'task_completed' : 'task_updated',
      actor,
      actorRole: existing.assignedRole,
      data: { taskId, oldStatus: existing.status, newStatus },
    });

    return task;
  }

  async getTasksForRole(roleId: RoleId): Promise<RaciTask[]> {
    return this.taskRepo.getByRole(roleId);
  }

  async getTasksForSession(sessionId: string): Promise<RaciTask[]> {
    return this.taskRepo.getBySession(sessionId);
  }

  async createTasksForEvent(eventType: string, eventId: string): Promise<RaciTask[]> {
    const scenario = eventType === 'incident' ? 'incident-response' as ScenarioType
      : eventType === 'vulnerability' ? 'vulnerability-management' as ScenarioType
      : 'threat-hunting' as ScenarioType;

    const roleMap = RACI_SCENARIO_MAP[scenario];

    let session = (await this.sessionRepo.getActiveSessions())
      .find(s => s.eventId === eventId && s.eventType === eventType as any);

    if (!session) {
      const rRoles = Object.entries(roleMap).filter(([, v]) => v === 'R').map(([k]) => k as RoleId);
      session = await this.sessionRepo.createSession({
        title: `War Room: ${eventType} ${eventId}`,
        scenario,
        eventId,
        eventType: eventType as any,
        status: 'active',
        participants: rRoles.map(r => ({ roleId: r, joinedAt: Date.now() })),
        createdBy: 'system',
      });

      await this.sessionRepo.addTimelineEvent({
        sessionId: session.id,
        type: 'session_created',
        actor: 'system',
        data: { eventType, eventId },
      });
    }

    const created: RaciTask[] = [];
    for (const [role, raci] of Object.entries(roleMap)) {
      if (raci === 'R') {
        const task = await this.taskRepo.create({
          sessionId: session.id,
          title: `[${scenario}] Handle ${eventType} ${eventId}`,
          scenario,
          assignedRole: role as RoleId,
          status: 'assigned',
          priority: 'high',
          eventId,
          eventType: eventType as any,
          escalationLevel: 0,
        });

        await this.sessionRepo.addTimelineEvent({
          sessionId: session.id,
          type: 'task_created',
          actor: 'system',
          actorRole: role as RoleId,
          data: { taskId: task.id, assignedRole: role },
        });

        created.push(task);
      }
    }

    return created;
  }

  async handoffTask(taskId: string, nextRole: RoleId, actor: string): Promise<{ originalTask: RaciTask; newTask: RaciTask }> {
    const existing = await this.taskRepo.getById(taskId);
    if (!existing) throw new Error(`Task ${taskId} not found`);

    const completed = await this.taskRepo.update(taskId, {
      status: 'completed',
      completedAt: Date.now(),
      nextRole,
    });
    if (!completed) throw new Error(`Task ${taskId} complete failed`);

    await this.sessionRepo.addTimelineEvent({
      sessionId: existing.sessionId,
      type: 'task_handoff',
      actor,
      actorRole: existing.assignedRole,
      data: { taskId, fromRole: existing.assignedRole, toRole: nextRole },
    });

    const newTask = await this.taskRepo.create({
      sessionId: existing.sessionId,
      title: existing.title + ' (handoff)',
      description: existing.description,
      scenario: existing.scenario,
      assignedRole: nextRole,
      status: 'assigned',
      priority: existing.priority,
      eventId: existing.eventId,
      eventType: existing.eventType,
      parentTaskId: taskId,
      escalationLevel: 0,
    });

    await this.sessionRepo.addTimelineEvent({
      sessionId: existing.sessionId,
      type: 'task_assigned',
      actor,
      actorRole: nextRole,
      data: { taskId: newTask.id, assignedRole: nextRole, parentTaskId: taskId },
    });

    return { originalTask: completed, newTask };
  }

  async escalateTask(taskId: string, actor: string): Promise<RaciTask> {
    const existing = await this.taskRepo.getById(taskId);
    if (!existing) throw new Error(`Task ${taskId} not found`);

    const supervisors = ROLE_HIERARCHY[existing.assignedRole] || [];
    if (supervisors.length === 0) throw new Error(`No escalation target for role ${existing.assignedRole}`);

    const escalateTo = supervisors[0] as RoleId;

    const task = await this.taskRepo.update(taskId, {
      status: 'escalated',
      escalationLevel: (existing.escalationLevel || 0) + 1,
      nextRole: escalateTo,
    });
    if (!task) throw new Error(`Task ${taskId} escalate failed`);

    await this.sessionRepo.addTimelineEvent({
      sessionId: existing.sessionId,
      type: 'task_escalated',
      actor,
      actorRole: existing.assignedRole,
      data: { taskId, fromRole: existing.assignedRole, escalateTo, level: task.escalationLevel },
    });

    return task;
  }

  async listTasks(filters: { sessionId?: string; role?: RoleId; status?: TaskStatus }): Promise<RaciTask[]> {
    return this.taskRepo.query(filters);
  }
}
