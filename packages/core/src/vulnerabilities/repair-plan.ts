import type { JsonStore } from '../storage/json-store.js';

const STORE_KEY = 'repair-plans.json';

export type RepairPlanPriority = 'critical' | 'high' | 'medium' | 'low';
export type RepairPlanStatus = 'open' | 'in_progress' | 'completed';

export interface RepairPlan {
  id: string;
  name: string;
  description: string;
  vulnIds: string[];
  completedVulnIds: string[];
  assignee: string;
  dueAt: number;
  priority: RepairPlanPriority;
  status: RepairPlanStatus;
  summary: string;
  createdAt: number;
  updatedAt: number;
}

export class RepairPlanManager {
  constructor(private store: JsonStore) {}

  async createPlan(plan: {
    name: string;
    description: string;
    vulnIds: string[];
    assignee: string;
    dueAt: number;
    priority: RepairPlanPriority;
  }): Promise<RepairPlan> {
    const plans = await this.getAll();
    const now = Date.now();
    const newPlan: RepairPlan = {
      id: `rp_${now}_${Math.random().toString(36).slice(2, 9)}`,
      ...plan,
      completedVulnIds: [],
      status: 'open',
      summary: '',
      createdAt: now,
      updatedAt: now,
    };
    plans.push(newPlan);
    await this.store.set(STORE_KEY, plans);
    return newPlan;
  }

  async getPlan(id: string): Promise<RepairPlan | null> {
    const plans = await this.getAll();
    return plans.find(p => p.id === id) ?? null;
  }

  async listPlans(filters?: { status?: string; assignee?: string }): Promise<RepairPlan[]> {
    let plans = await this.getAll();
    if (filters?.status) plans = plans.filter(p => p.status === filters.status);
    if (filters?.assignee) plans = plans.filter(p => p.assignee === filters.assignee);
    return plans;
  }

  async updatePlanProgress(id: string, completedVulnIds: string[]): Promise<RepairPlan | null> {
    const plans = await this.getAll();
    const plan = plans.find(p => p.id === id);
    if (!plan) return null;
    plan.completedVulnIds = completedVulnIds;
    plan.updatedAt = Date.now();
    if (completedVulnIds.length === 0) {
      plan.status = 'open';
    } else if (plan.vulnIds.length > 0 && completedVulnIds.length >= plan.vulnIds.length) {
      plan.status = 'completed';
    } else {
      plan.status = 'in_progress';
    }
    await this.store.set(STORE_KEY, plans);
    return plan;
  }

  async closePlan(id: string, summary: string): Promise<RepairPlan | null> {
    const plans = await this.getAll();
    const plan = plans.find(p => p.id === id);
    if (!plan) return null;
    plan.status = 'completed';
    plan.summary = summary;
    plan.updatedAt = Date.now();
    await this.store.set(STORE_KEY, plans);
    return plan;
  }

  private async getAll(): Promise<RepairPlan[]> {
    const data = await this.store.get<RepairPlan[]>(STORE_KEY);
    return data ?? [];
  }
}
