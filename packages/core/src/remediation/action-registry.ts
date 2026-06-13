import { randomUUID } from 'crypto';

export type RemediationActionType =
  | 'block_ip'
  | 'isolate_host'
  | 'kill_process'
  | 'rotate_credentials'
  | 'patch_vulnerability'
  | 'update_firewall'
  | 'quarantine_file'
  | 'disable_user'
  | 'update_security_group'
  | 'notify_team'
  | 'create_ticket'
  | 'enrich_ioc'
  | 'scan_target'
  | 'custom';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RemediationAction {
  id: string;
  type: RemediationActionType;
  name: string;
  description: string;
  riskLevel: RiskLevel;
  target: string;
  params: Record<string, unknown>;
  timeoutMs: number;
  retryCount: number;
  rollbackActionId: string | null;
  requiresApproval: boolean;
  tags: string[];
}

export interface RemediationResult {
  actionId: string;
  success: boolean;
  output: string;
  error: string | null;
  startedAt: number;
  completedAt: number;
  durationMs: number;
  sideEffects: Array<{ type: string; description: string; reversible: boolean }>;
}

export type ActionExecutor = (action: RemediationAction) => Promise<RemediationResult>;

interface ActionTemplate {
  type: RemediationActionType;
  defaultParams: Record<string, unknown>;
  defaultRisk: RiskLevel;
}

const BUILT_IN_TEMPLATES: ActionTemplate[] = [
  { type: 'block_ip', defaultParams: { ip: '', duration: 3600, firewallRule: '' }, defaultRisk: 'medium' },
  { type: 'isolate_host', defaultParams: { hostId: '', networkSegment: 'quarantine' }, defaultRisk: 'high' },
  { type: 'kill_process', defaultParams: { hostId: '', processName: '', pid: 0 }, defaultRisk: 'medium' },
  { type: 'rotate_credentials', defaultParams: { service: '', account: '', rotationType: 'auto' }, defaultRisk: 'medium' },
  { type: 'patch_vulnerability', defaultParams: { vulnerabilityId: '', patchVersion: '' }, defaultRisk: 'low' },
  { type: 'update_firewall', defaultParams: { rule: '', direction: 'inbound', action: 'deny' }, defaultRisk: 'high' },
  { type: 'quarantine_file', defaultParams: { filePath: '', hash: '', hostId: '' }, defaultRisk: 'low' },
  { type: 'disable_user', defaultParams: { userId: '', reason: '' }, defaultRisk: 'critical' },
  { type: 'notify_team', defaultParams: { channel: '', message: '', urgency: 'normal' }, defaultRisk: 'low' },
  { type: 'create_ticket', defaultParams: { title: '', description: '', assignee: '', priority: 'medium' }, defaultRisk: 'low' },
];

export class RemediationActionRegistry {
  private actions: Map<string, RemediationAction> = new Map();
  private executors: Map<RemediationActionType, ActionExecutor> = new Map();
  private templates: Map<RemediationActionType, ActionTemplate> = new Map();

  constructor() {
    for (const template of BUILT_IN_TEMPLATES) {
      this.templates.set(template.type, template);
    }
  }

  registerAction(action: RemediationAction): void {
    this.actions.set(action.id, action);
  }

  removeAction(actionId: string): boolean {
    return this.actions.delete(actionId);
  }

  getAction(actionId: string): RemediationAction | null {
    return this.actions.get(actionId) ?? null;
  }

  listActions(filters?: {
    type?: RemediationActionType;
    riskLevel?: RiskLevel;
    tag?: string;
  }): RemediationAction[] {
    let results = Array.from(this.actions.values());

    if (filters?.type !== undefined) {
      results = results.filter((a) => a.type === filters.type);
    }

    if (filters?.riskLevel !== undefined) {
      results = results.filter((a) => a.riskLevel === filters.riskLevel);
    }

    if (filters?.tag !== undefined) {
      results = results.filter((a) => a.tags.includes(filters.tag!));
    }

    return results;
  }

  registerExecutor(type: RemediationActionType, executor: ActionExecutor): void {
    this.executors.set(type, executor);
  }

  async execute(actionId: string): Promise<RemediationResult> {
    const action = this.actions.get(actionId);
    if (!action) {
      return {
        actionId,
        success: false,
        output: '',
        error: `Action not found: ${actionId}`,
        startedAt: Date.now(),
        completedAt: Date.now(),
        durationMs: 0,
        sideEffects: [],
      };
    }

    const executor = this.executors.get(action.type);
    if (!executor) {
      return {
        actionId,
        success: false,
        output: '',
        error: `No executor registered for action type: ${action.type}`,
        startedAt: Date.now(),
        completedAt: Date.now(),
        durationMs: 0,
        sideEffects: [],
      };
    }

    let lastResult: RemediationResult | undefined;
    const attempts = action.retryCount + 1;

    for (let attempt = 0; attempt < attempts; attempt++) {
      const result = await executor(action);
      if (result.success) {
        return result;
      }
      lastResult = result;
    }

    return lastResult!;
  }

  async executeByType(
    type: RemediationActionType,
    target: string,
    params: Record<string, unknown>,
  ): Promise<RemediationResult> {
    const action = this.createActionFromTemplate(type, target, params);
    this.registerAction(action);
    return this.execute(action.id);
  }

  createActionFromTemplate(
    type: RemediationActionType,
    target: string,
    params: Record<string, unknown>,
  ): RemediationAction {
    const template = this.templates.get(type);
    const defaultParams = template?.defaultParams ?? {};
    const defaultRisk = template?.defaultRisk ?? 'medium';

    return {
      id: this.generateId(),
      type,
      name: `${type} on ${target}`,
      description: `Execute ${type} against ${target}`,
      riskLevel: defaultRisk,
      target,
      params: { ...defaultParams, ...params },
      timeoutMs: 30000,
      retryCount: 2,
      rollbackActionId: null,
      requiresApproval: defaultRisk === 'critical' || defaultRisk === 'high',
      tags: [type],
    };
  }

  getActionTemplates(): Array<{
    type: RemediationActionType;
    defaultParams: Record<string, unknown>;
    defaultRisk: RiskLevel;
  }> {
    return Array.from(this.templates.values());
  }

  private generateId(): string {
    return randomUUID();
  }
}
