import { randomUUID } from 'node:crypto';
import type {
  PlaybookStep,
  PlaybookCondition,
  ExecutionContext,
  ExecutionResult,
} from './playbook-types.js';
import type { PlaybookRepository } from './playbook-repository.js';

interface CapabilityBridge {
  invokeCapability(capabilityId: string, params: Record<string, unknown>): Promise<unknown>;
}

const logger = {
  info: (...args: any[]) => console.log('[PlaybookEngine]', ...args),
  error: (...args: any[]) => console.error('[PlaybookEngine]', ...args),
};

export class PlaybookEngine {
  private runningContexts: Map<string, ExecutionContext> = new Map();

  constructor(
    private repo: PlaybookRepository,
    private capabilityBridge: CapabilityBridge,
  ) {}

  async start(playbookId: string, triggerParams: Record<string, unknown> = {}): Promise<string> {
    const playbook = await this.repo.getById(playbookId);
    if (!playbook) throw new Error(`Playbook not found: ${playbookId}`);
    if (playbook.status !== 'enabled') throw new Error(`Playbook is not enabled: ${playbookId}`);

    const execId = `exec_${Date.now()}_${randomUUID().slice(0, 8)}`;
    const context: ExecutionContext = {
      execId,
      playbookId,
      triggerParams,
      globals: {},
      stepResults: {},
      startedAt: Date.now(),
      status: 'running',
    };
    this.runningContexts.set(execId, context);

    this.executeStep(playbook.rootStep, context).then(() => {
      context.status = 'success';
      logger.info(`Execution ${execId} completed successfully`);
    }).catch((err) => {
      context.status = 'failed';
      logger.error(`Execution ${execId} failed:`, err);
    });

    return execId;
  }

  async cancel(execId: string): Promise<boolean> {
    const ctx = this.runningContexts.get(execId);
    if (!ctx || ctx.status !== 'running') return false;
    ctx.status = 'cancelled';
    this.runningContexts.delete(execId);
    return true;
  }

  getStatus(execId: string): ExecutionContext | null {
    return this.runningContexts.get(execId) ?? null;
  }

  async getExecutionResult(execId: string): Promise<ExecutionResult | null> {
    const ctx = this.runningContexts.get(execId);
    if (!ctx) return null;
    return {
      execId: ctx.execId,
      playbookId: ctx.playbookId,
      status: ctx.status,
      stepResults: Object.values(ctx.stepResults),
      startedAt: ctx.startedAt,
      finishedAt: Date.now(),
    };
  }

  private async executeStep(step: PlaybookStep, context: ExecutionContext): Promise<void> {
    if (context.status === 'cancelled') return;
    if (step.condition && !this.evaluateCondition(step.condition, context)) {
      context.stepResults[step.id] = { stepId: step.id, status: 'skipped', startedAt: Date.now(), finishedAt: Date.now() };
      return;
    }

    const startedAt = Date.now();
    try {
      switch (step.type) {
        case 'serial':
          await this.executeSerial(step.config.subSteps ?? [], context);
          break;
        case 'parallel':
          await this.executeParallel(step.config.subSteps ?? [], context);
          break;
        case 'condition':
          await this.executeConditional(step.config.branches ?? [], context);
          break;
        case 'capability': {
          if (!step.config.capabilityId) throw new Error(`Step ${step.id} missing capabilityId`);
          const params = this.resolveVariables(step.config.params ?? {}, context);
          const data = await this.capabilityBridge.invokeCapability(step.config.capabilityId, params);
          context.stepResults[step.id] = { stepId: step.id, status: 'success', data, startedAt, finishedAt: Date.now() };
          break;
        }
        case 'delay':
          await new Promise(resolve => setTimeout(resolve, step.config.delayMs ?? 1000));
          context.stepResults[step.id] = { stepId: step.id, status: 'success', startedAt, finishedAt: Date.now() };
          break;
      }
      if (!context.stepResults[step.id]) {
        context.stepResults[step.id] = { stepId: step.id, status: 'success', startedAt, finishedAt: Date.now() };
      }
    } catch (err) {
      context.stepResults[step.id] = {
        stepId: step.id,
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
        startedAt,
        finishedAt: Date.now(),
      };
      throw err;
    }
  }

  private async executeSerial(steps: PlaybookStep[], context: ExecutionContext): Promise<void> {
    for (const step of steps) {
      if (context.status === 'cancelled') break;
      await this.executeStep(step, context);
    }
  }

  private async executeParallel(steps: PlaybookStep[], context: ExecutionContext): Promise<void> {
    await Promise.all(steps.map(step => this.executeStep(step, context).catch(() => {})));
  }

  private async executeConditional(
    branches: Array<{ condition: PlaybookCondition; subSteps: PlaybookStep[] }>,
    context: ExecutionContext,
  ): Promise<void> {
    for (const branch of branches) {
      if (this.evaluateCondition(branch.condition, context)) {
        await this.executeSerial(branch.subSteps, context);
        return;
      }
    }
  }

  private evaluateCondition(condition: PlaybookCondition, context: ExecutionContext): boolean {
    switch (condition.op) {
      case 'and':
        return (condition.children ?? []).every(c => this.evaluateCondition(c, context));
      case 'or':
        return (condition.children ?? []).some(c => this.evaluateCondition(c, context));
      case 'not':
        return !(condition.children?.[0] && this.evaluateCondition(condition.children[0], context));
      default: {
        const left = this.resolveValue(condition.left ?? '', context);
        const right = condition.right;
        return this.compareValues(left, right, condition.op);
      }
    }
  }

  private resolveValues(path: string, context: ExecutionContext): unknown {
    const parts = path.replace(/^\$\{|\}$/g, '').split('.');
    let current: unknown = context;
    for (const part of parts) {
      if (current == null || typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  }

  private resolveValue(path: string, context: ExecutionContext): unknown {
    return this.resolveValues(path, context);
  }

  private resolveVariables(params: Record<string, unknown>, context: ExecutionContext): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(params)) {
      if (typeof val === 'string' && val.startsWith('${') && val.endsWith('}')) {
        resolved[key] = this.resolveValues(val, context);
      } else {
        resolved[key] = val;
      }
    }
    return resolved;
  }

  private compareValues(left: unknown, right: unknown, op: ConditionOp): boolean {
    switch (op) {
      case 'eq': return left === right;
      case 'ne': return left !== right;
      case 'gt': return Number(left) > Number(right);
      case 'gte': return Number(left) >= Number(right);
      case 'lt': return Number(left) < Number(right);
      case 'lte': return Number(left) <= Number(right);
      case 'in': return Array.isArray(right) && right.includes(left as string);
      case 'contains': return String(left).includes(String(right));
      default: return false;
    }
  }
}

type ConditionOp = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'and' | 'or' | 'not';
