import type { JsonStore } from '../storage/json-store.js';
import type { RaciTask, TaskStatus, ScenarioType, RoleId } from './types.js';

const FILE_NAME = 'raci-tasks.json';

export class TaskRepository {
  constructor(private store: JsonStore) {}

  async getAll(): Promise<RaciTask[]> {
    return (await this.store.get<RaciTask[]>(FILE_NAME)) ?? [];
  }

  async getById(id: string): Promise<RaciTask | null> {
    const tasks = await this.getAll();
    return tasks.find(t => t.id === id) || null;
  }

  async getBySession(sessionId: string): Promise<RaciTask[]> {
    const tasks = await this.getAll();
    return tasks.filter(t => t.sessionId === sessionId);
  }

  async getByRole(roleId: RoleId): Promise<RaciTask[]> {
    const tasks = await this.getAll();
    return tasks.filter(t => t.assignedRole === roleId);
  }

  async query(filters: { sessionId?: string; role?: RoleId; status?: TaskStatus }): Promise<RaciTask[]> {
    let tasks = await this.getAll();
    if (filters.sessionId) tasks = tasks.filter(t => t.sessionId === filters.sessionId);
    if (filters.role) tasks = tasks.filter(t => t.assignedRole === filters.role);
    if (filters.status) tasks = tasks.filter(t => t.status === filters.status);
    return tasks;
  }

  async create(task: Omit<RaciTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<RaciTask> {
    const tasks = await this.getAll();
    const newTask: RaciTask = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    tasks.push(newTask);
    await this.store.set(FILE_NAME, tasks);
    return newTask;
  }

  async update(id: string, updates: Partial<RaciTask>): Promise<RaciTask | null> {
    const tasks = await this.getAll();
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return null;
    tasks[index] = { ...tasks[index], ...updates, updatedAt: Date.now() };
    await this.store.set(FILE_NAME, tasks);
    return tasks[index];
  }

  async delete(id: string): Promise<boolean> {
    const tasks = await this.getAll();
    const filtered = tasks.filter(t => t.id !== id);
    if (filtered.length === tasks.length) return false;
    await this.store.set(FILE_NAME, filtered);
    return true;
  }
}
