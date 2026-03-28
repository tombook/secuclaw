export type TriggerType = 'alarm' | 'webhook' | 'cron' | 'manual' | 'event';

export type StepType = 'serial' | 'parallel' | 'condition' | 'capability' | 'delay';

export type ConditionOp = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'and' | 'or' | 'not';

export type ExecStatus = 'pending' | 'running' | 'success' | 'failed' | 'cancelled' | 'skipped';

export type PlaybookStatus = 'enabled' | 'disabled' | 'draft';

export interface PlaybookTrigger {
  id: string;
  type: TriggerType;
  config: Record<string, unknown>;
}

export interface PlaybookCondition {
  op: ConditionOp;
  left?: string;
  right?: unknown;
  children?: PlaybookCondition[];
}

export interface PlaybookStep {
  id: string;
  name: string;
  type: StepType;
  condition?: PlaybookCondition;
  config: {
    capabilityId?: string;
    subSteps?: PlaybookStep[];
    branches?: Array<{ condition: PlaybookCondition; subSteps: PlaybookStep[] }>;
    params?: Record<string, unknown>;
    delayMs?: number;
    retryTimes?: number;
    timeout?: number;
  };
}

export interface Playbook {
  id: string;
  name: string;
  description: string;
  version: string;
  trigger: PlaybookTrigger;
  rootStep: PlaybookStep;
  status: PlaybookStatus;
  createdAt: number;
  updatedAt: number;
}

export interface ExecutionStepResult {
  stepId: string;
  status: ExecStatus;
  data?: unknown;
  error?: string;
  startedAt: number;
  finishedAt: number;
}

export interface ExecutionContext {
  execId: string;
  playbookId: string;
  triggerParams: Record<string, unknown>;
  globals: Record<string, unknown>;
  stepResults: Record<string, ExecutionStepResult>;
  startedAt: number;
  status: ExecStatus;
}

export interface ExecutionResult {
  execId: string;
  playbookId: string;
  status: ExecStatus;
  stepResults: ExecutionStepResult[];
  startedAt: number;
  finishedAt: number;
}
