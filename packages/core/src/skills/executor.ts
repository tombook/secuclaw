import { skillRegistry } from './registry.js';
import type { SkillDefinition, RoleId } from './registry.js';
import { executionEvents } from './execution-events.js';

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface ExecutionResult {
  executionId: string;
  skill: string;
  status: ExecutionStatus;
  result?: any;
  artifacts?: string[];
  executedBy: string;
  timestamp: Date;
  duration?: number;
  error?: {
    message: string;
    stack?: string;
  };
}

export interface ExecutionRequest {
  skillId: string;
  roleId: string;
  params: Record<string, any>;
}

class SkillExecutor {
  private executions = new Map<string, ExecutionResult>();
  private actionRunners = new Map<string, (params: Record<string, any>) => Promise<any>>();
  private defaultTimeout = 300000;

  registerExecutor(name: string, runner: (params: Record<string, any>) => Promise<any>) {
    this.actionRunners.set(name, runner);
  }

  setDefaultTimeout(ms: number) {
    this.defaultTimeout = ms;
  }

  async execute(request: ExecutionRequest, timeout?: number): Promise<ExecutionResult> {
    const executionId = crypto.randomUUID();
    const skill = skillRegistry.getSkill(request.skillId);

    if (!skill) {
      return this.fail(executionId, request, `Skill not found: ${request.skillId}`);
    }

    if (!skillRegistry.canExecute(request.skillId, request.roleId as RoleId)) {
      return this.fail(executionId, request, `Role ${request.roleId} cannot execute skill ${request.skillId}`);
    }

    const validationError = this.validateParams(skill, request.params);
    if (validationError) {
      return this.fail(executionId, request, validationError);
    }

    const result: ExecutionResult = {
      executionId,
      skill: request.skillId,
      status: 'pending',
      executedBy: request.roleId,
      timestamp: new Date(),
    };

    this.executions.set(executionId, result);

    executionEvents.emitComplete(result);

    this.run(executionId, skill, request.params, timeout).catch(err => {
      this.fail(executionId, request, err.message);
    });

    return result;
  }

  private async run(executionId: string, skill: SkillDefinition, params: Record<string, any>, timeout?: number): Promise<void> {
    this.updateStatus(executionId, 'running');

    const runner = this.actionRunners.get(skill.executor);
    if (!runner) {
      this.fail(executionId, { skillId: skill.id, roleId: '', params }, `Executor not found: ${skill.executor}`);
      return;
    }

    const timeoutMs = timeout ?? this.defaultTimeout;

    try {
      const start = Date.now();
      const result = await Promise.race([
        runner(params),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Execution timed out after ${timeoutMs}ms`)), timeoutMs)
        ),
      ]);
      const duration = Date.now() - start;

      const execution = this.executions.get(executionId);
      if (execution) {
        execution.status = 'completed';
        execution.result = result;
        execution.duration = duration;
        execution.artifacts = [];
        this.executions.set(executionId, execution);
      }
    } catch (error: any) {
      this.fail(executionId, { skillId: skill.id, roleId: '', params }, error.message);
    }
  }

  private fail(executionId: string, request: ExecutionRequest, message: string): ExecutionResult {
    const result: ExecutionResult = {
      executionId,
      skill: request.skillId,
      status: 'failed',
      executedBy: request.roleId,
      timestamp: new Date(),
      error: { message },
    };
    this.executions.set(executionId, result);
    return result;
  }

  private validateParams(skill: SkillDefinition, params: Record<string, any>): string | null {
    for (const param of skill.params) {
      if (param.required && !(param.name in params)) {
        return `Missing required parameter: ${param.name}`;
      }
    }
    return null;
  }

  private updateStatus(executionId: string, status: ExecutionStatus) {
    const execution = this.executions.get(executionId);
    if (execution) {
      execution.status = status;
      this.executions.set(executionId, execution);
    }
  }

  getExecution(executionId: string): ExecutionResult | undefined {
    return this.executions.get(executionId);
  }

  getHistory(roleId?: string): ExecutionResult[] {
    return Array.from(this.executions.values())
      .filter(e => !roleId || e.executedBy === roleId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

export const skillExecutor = new SkillExecutor();
