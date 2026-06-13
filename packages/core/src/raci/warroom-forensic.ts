import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';

export type ForensicTaskType =
  | 'memory-collection'
  | 'disk-imaging'
  | 'network-capture'
  | 'log-collection'
  | 'registry-dump'
  | 'process-dump'
  | 'file-carving'
  | 'timeline-analysis';

export type ForensicTaskStatus = 'pending' | 'collecting' | 'analyzing' | 'completed' | 'failed';

export interface ForensicArtifact {
  id: string;
  name: string;
  type: string;
  size: number;
  hash: string;
  collectedAt: number;
  path: string;
}

export interface ForensicIoc {
  type: string;
  value: string;
}

export interface ForensicFinding {
  id: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence: string;
  mitreTechnique?: string;
  ioc: ForensicIoc[];
}

export interface ForensicTask {
  id: string;
  sessionId: string;
  type: ForensicTaskType;
  target: string;
  status: ForensicTaskStatus;
  assignedTo: string;
  raciRole: 'R' | 'A' | 'C' | 'I';
  artifacts: ForensicArtifact[];
  findings: ForensicFinding[];
  startedAt: number;
  completedAt: number | null;
  collectorTool?: string;
  collectorTaskId?: string;
  incidentId?: string;
}

const TASKS_KEY = 'forensic/tasks.json';

export class WarRoomForensicService {
  constructor(private store: JsonStore) {}

  private generateId(): string {
    return randomUUID();
  }

  async createForensicTask(params: {
    sessionId: string;
    type: ForensicTaskType;
    target: string;
    assignedTo: string;
    raciRole: 'R' | 'A' | 'C' | 'I';
    collectorTool?: string;
    collectorTaskId?: string;
  }): Promise<ForensicTask> {
    const task: ForensicTask = {
      id: this.generateId(),
      sessionId: params.sessionId,
      type: params.type,
      target: params.target,
      status: 'pending',
      assignedTo: params.assignedTo,
      raciRole: params.raciRole,
      artifacts: [],
      findings: [],
      startedAt: Date.now(),
      completedAt: null,
      collectorTool: params.collectorTool,
      collectorTaskId: params.collectorTaskId,
    };

    const tasks = await this.store.get<ForensicTask[]>(TASKS_KEY) ?? [];
    tasks.push(task);
    await this.store.set(TASKS_KEY, tasks);

    return task;
  }

  async getTask(taskId: string): Promise<ForensicTask | null> {
    const tasks = await this.store.get<ForensicTask[]>(TASKS_KEY) ?? [];
    return tasks.find(t => t.id === taskId) ?? null;
  }

  async listTasks(sessionId: string): Promise<ForensicTask[]> {
    const tasks = await this.store.get<ForensicTask[]>(TASKS_KEY) ?? [];
    return tasks.filter(t => t.sessionId === sessionId);
  }

  async updateTaskStatus(taskId: string, status: ForensicTaskStatus): Promise<ForensicTask> {
    const tasks = await this.store.get<ForensicTask[]>(TASKS_KEY) ?? [];
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx === -1) throw new Error(`Forensic task ${taskId} not found`);

    tasks[idx] = { ...tasks[idx], status };
    await this.store.set(TASKS_KEY, tasks);

    return tasks[idx];
  }

  async addArtifact(taskId: string, artifact: Omit<ForensicArtifact, 'id'>): Promise<void> {
    const tasks = await this.store.get<ForensicTask[]>(TASKS_KEY) ?? [];
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx === -1) throw new Error(`Forensic task ${taskId} not found`);

    tasks[idx].artifacts.push({ ...artifact, id: this.generateId() });
    await this.store.set(TASKS_KEY, tasks);
  }

  async addFinding(taskId: string, finding: Omit<ForensicFinding, 'id'>): Promise<void> {
    const tasks = await this.store.get<ForensicTask[]>(TASKS_KEY) ?? [];
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx === -1) throw new Error(`Forensic task ${taskId} not found`);

    tasks[idx].findings.push({ ...finding, id: this.generateId() });
    await this.store.set(TASKS_KEY, tasks);
  }

  async completeTask(taskId: string, findings: ForensicFinding[]): Promise<ForensicTask> {
    const tasks = await this.store.get<ForensicTask[]>(TASKS_KEY) ?? [];
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx === -1) throw new Error(`Forensic task ${taskId} not found`);

    tasks[idx] = {
      ...tasks[idx],
      status: 'completed',
      completedAt: Date.now(),
      findings: [...tasks[idx].findings, ...findings],
    };

    await this.store.set(TASKS_KEY, tasks);

    await this.persistSessionSummary(tasks[idx].sessionId);

    return tasks[idx];
  }

  async getSessionForensicSummary(sessionId: string): Promise<{
    totalTasks: number;
    byType: Record<string, number>;
    totalFindings: number;
    criticalFindings: number;
    artifacts: number;
  }> {
    const tasks = await this.listTasks(sessionId);
    const byType: Record<string, number> = {};
    let totalFindings = 0;
    let criticalFindings = 0;
    let artifacts = 0;

    for (const task of tasks) {
      byType[task.type] = (byType[task.type] ?? 0) + 1;
      totalFindings += task.findings.length;
      criticalFindings += task.findings.filter(f => f.severity === 'critical').length;
      artifacts += task.artifacts.length;
    }

    return { totalTasks: tasks.length, byType, totalFindings, criticalFindings, artifacts };
  }

  async linkToIncident(taskId: string, incidentId: string): Promise<void> {
    const tasks = await this.store.get<ForensicTask[]>(TASKS_KEY) ?? [];
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx === -1) throw new Error(`Forensic task ${taskId} not found`);

    tasks[idx] = { ...tasks[idx], incidentId };
    await this.store.set(TASKS_KEY, tasks);
  }

  private async persistSessionSummary(sessionId: string): Promise<void> {
    const summary = await this.getSessionForensicSummary(sessionId);
    await this.store.set(`forensic/session-${sessionId}-summary.json`, summary);
  }
}
