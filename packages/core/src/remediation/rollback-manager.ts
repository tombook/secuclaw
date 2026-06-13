import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export type RollbackStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';

export interface RollbackAction {
  id: string;
  originalActionId: string;
  originalActionType: string;
  rollbackType: string;
  command: string;
  params: Record<string, unknown>;
  status: RollbackStatus;
  result: string | null;
  error: string | null;
  createdAt: number;
  executedAt: number | null;
  completedAt: number | null;
}

export interface RollbackPlan {
  id: string;
  actionId: string;
  actionType: string;
  actions: RollbackAction[];
  status: RollbackStatus;
  createdAt: number;
  executedAt: number | null;
  completedAt: number | null;
  triggerReason: string;
}

export interface RollbackHistory {
  id: string;
  plan: RollbackPlan;
  originalActionType: string;
  originalRiskLevel: string;
  success: boolean;
  timestamp: number;
  lessonsLearned: string;
}

const ROLLBACK_TEMPLATES: Record<string, string> = {
  block_ip: 'unblock_ip',
  isolate_host: 'reconnect_host',
  kill_process: 'restart_process',
  disable_user: 'enable_user',
  update_firewall: 'revert_firewall_rule',
};

const PLANS_KEY = 'remediation/rollback-plans.json';
const HISTORY_KEY = 'remediation/rollback-history.json';

export class RollbackManager {
  private plansCache: RollbackPlan[] | null = null;

  constructor(private store: JsonStore) {}

  private async getPlansCache(): Promise<RollbackPlan[]> {
    if (this.plansCache === null) {
      this.plansCache = (await this.store.get<RollbackPlan[]>(PLANS_KEY)) ?? [];
    }
    return this.plansCache;
  }

  private async persistPlans(): Promise<void> {
    if (this.plansCache !== null) {
      await this.store.set(PLANS_KEY, this.plansCache);
    }
  }

  createPlan(
    actionId: string,
    actionType: string,
    rollbackActions: Array<{ rollbackType: string; command: string; params: Record<string, unknown> }>,
  ): RollbackPlan {
    const planId = this.generateId();
    const now = Date.now();

    const actions: RollbackAction[] = rollbackActions.map((ra) => ({
      id: this.generateId(),
      originalActionId: actionId,
      originalActionType: actionType,
      rollbackType: ra.rollbackType,
      command: ra.command,
      params: ra.params,
      status: 'pending' as RollbackStatus,
      result: null,
      error: null,
      createdAt: now,
      executedAt: null,
      completedAt: null,
    }));

    const plan: RollbackPlan = {
      id: planId,
      actionId,
      actionType,
      actions,
      status: 'pending',
      createdAt: now,
      executedAt: null,
      completedAt: null,
      triggerReason: '',
    };

    if (this.plansCache !== null) {
      this.plansCache.push(plan);
      this.persistPlans();
    } else {
      this.getPlansCache().then(() => {
        this.plansCache!.push(plan);
        this.persistPlans();
      });
    }

    return plan;
  }

  async executePlan(planId: string): Promise<RollbackPlan> {
    const plans = await this.getPlansCache();
    const plan = plans.find((p) => p.id === planId);
    if (!plan) {
      throw new Error(`Rollback plan not found: ${planId}`);
    }

    if (plan.status === 'in_progress') {
      throw new Error(`Rollback plan already in progress: ${planId}`);
    }

    if (plan.status === 'completed') {
      throw new Error(`Rollback plan already completed: ${planId}`);
    }

    plan.status = 'in_progress';
    plan.executedAt = Date.now();
    await this.persistPlans();

    let allSucceeded = true;
    const lessons: string[] = [];

    for (const action of plan.actions) {
      if (action.status === 'skipped') {
        lessons.push(`Skipped action ${action.rollbackType}`);
        continue;
      }

      try {
        action.status = 'in_progress';
        action.executedAt = Date.now();
        await this.persistPlans();

        const result = await this.executeCommand(action.command, action.params);
        action.status = 'completed';
        action.result = result;
        action.completedAt = Date.now();
        lessons.push(`${action.rollbackType} succeeded: ${result}`);
      } catch (err) {
        action.status = 'failed';
        action.error = err instanceof Error ? err.message : String(err);
        action.completedAt = Date.now();
        allSucceeded = false;
        lessons.push(`${action.rollbackType} failed: ${action.error}`);
      }

      await this.persistPlans();
    }

    plan.status = allSucceeded ? 'completed' : 'failed';
    plan.completedAt = Date.now();
    await this.persistPlans();

    await this.recordHistory(plan, allSucceeded, lessons.join('; '));
    return plan;
  }

  async executeSingleAction(rollbackActionId: string): Promise<RollbackAction> {
    const plans = await this.getPlansCache();
    let targetAction: RollbackAction | null = null;

    for (const plan of plans) {
      const found = plan.actions.find((a) => a.id === rollbackActionId);
      if (found) {
        targetAction = found;
        break;
      }
    }

    if (!targetAction) {
      throw new Error(`Rollback action not found: ${rollbackActionId}`);
    }

    targetAction.status = 'in_progress';
    targetAction.executedAt = Date.now();
    await this.persistPlans();

    try {
      const result = await this.executeCommand(targetAction.command, targetAction.params);
      targetAction.status = 'completed';
      targetAction.result = result;
      targetAction.completedAt = Date.now();
    } catch (err) {
      targetAction.status = 'failed';
      targetAction.error = err instanceof Error ? err.message : String(err);
      targetAction.completedAt = Date.now();
    }

    await this.persistPlans();
    return targetAction;
  }

  cancelPlan(planId: string): boolean {
    if (!this.plansCache) {
      return false;
    }

    const plan = this.plansCache.find((p) => p.id === planId);
    if (!plan) {
      return false;
    }

    if (plan.status !== 'pending') {
      return false;
    }

    plan.status = 'skipped';
    plan.completedAt = Date.now();

    for (const action of plan.actions) {
      if (action.status === 'pending') {
        action.status = 'skipped';
      }
    }

    this.persistPlans();
    return true;
  }

  getPlan(planId: string): RollbackPlan | null {
    if (!this.plansCache) {
      return null;
    }
    return this.plansCache.find((p) => p.id === planId) ?? null;
  }

  getPlansForAction(actionId: string): RollbackPlan[] {
    if (!this.plansCache) {
      return [];
    }
    return this.plansCache.filter((p) => p.actionId === actionId);
  }

  async autoRollback(actionId: string, reason: string): Promise<RollbackPlan | null> {
    await this.getPlansCache();

    const existingPlans = this.getPlansForAction(actionId);
    const pendingPlan = existingPlans.find((p) => p.status === 'pending');
    if (pendingPlan) {
      pendingPlan.triggerReason = reason;
      await this.persistPlans();
      return this.executePlan(pendingPlan.id);
    }

    const templateType = await this.resolveRollbackType(actionId);
    if (!templateType) {
      return null;
    }

    const plan = this.createPlan(actionId, templateType, [
      {
        rollbackType: templateType,
        command: templateType,
        params: {},
      },
    ]);

    plan.triggerReason = reason;
    await this.persistPlans();

    return this.executePlan(plan.id);
  }

  async getHistory(filters?: { actionType?: string; success?: boolean }): Promise<RollbackHistory[]> {
    const history = await this.store.get<RollbackHistory[]>(HISTORY_KEY);
    if (!history) {
      return [];
    }

    let results = history;

    if (filters?.actionType !== undefined) {
      results = results.filter((h) => h.originalActionType === filters.actionType);
    }

    if (filters?.success !== undefined) {
      results = results.filter((h) => h.success === filters.success);
    }

    return results;
  }

  async getRollbackStats(): Promise<{
    total: number;
    successful: number;
    failed: number;
    avgDurationMs: number;
  }> {
    const history = await this.store.get<RollbackHistory[]>(HISTORY_KEY);
    if (!history || history.length === 0) {
      return { total: 0, successful: 0, failed: 0, avgDurationMs: 0 };
    }

    const successful = history.filter((h) => h.success).length;
    const failed = history.filter((h) => !h.success).length;

    const durations = history
      .filter((h) => h.plan.executedAt !== null && h.plan.completedAt !== null)
      .map((h) => h.plan.completedAt! - h.plan.executedAt!);

    const avgDurationMs = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;

    return { total: history.length, successful, failed, avgDurationMs };
  }

  private async executeCommand(command: string, params: Record<string, unknown>): Promise<string> {
    const formattedCommand = Object.entries(params).reduce(
      (cmd, [key, value]) => cmd.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), String(value)),
      command,
    );

    const { stdout, stderr } = await execAsync(formattedCommand, { timeout: 30000 });
    return (stdout || stderr).trim();
  }

  private async recordHistory(plan: RollbackPlan, success: boolean, lessons: string): Promise<void> {
    const history = (await this.store.get<RollbackHistory[]>(HISTORY_KEY)) ?? [];

    const entry: RollbackHistory = {
      id: this.generateId(),
      plan,
      originalActionType: plan.actionType,
      originalRiskLevel: 'medium',
      success,
      timestamp: Date.now(),
      lessonsLearned: lessons,
    };

    history.push(entry);
    await this.store.set(HISTORY_KEY, history);
  }

  private generateId(): string {
    return randomUUID();
  }

  private async resolveRollbackType(actionId: string): Promise<string | null> {
    const plans = await this.getPlansCache();
    const matchingPlan = plans.find((p) => p.actionId === actionId);
    if (matchingPlan) {
      return matchingPlan.actionType;
    }

    for (const [key, value] of Object.entries(ROLLBACK_TEMPLATES)) {
      if (actionId.includes(key)) {
        return value;
      }
    }

    return null;
  }
}
