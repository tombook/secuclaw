import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';

export type RedTeamRole =
  | 'recon-agent'
  | 'scanner-agent'
  | 'exploit-agent'
  | 'post-exploit-agent'
  | 'social-engineer'
  | 'wireless-agent'
  | 'report-agent'
  | 'opsec-agent';

export interface RedTeamAgentConfig {
  id: string;
  role: RedTeamRole;
  raciAssignment: 'R' | 'A' | 'C' | 'I';
  secuclawRoleId: string;
  capabilities: string[];
  llmProvider: string;
  llmModel: string;
  maxConcurrent: number;
  timeoutMs: number;
}

export interface RedTeamFinding {
  id: string;
  taskId: string;
  category: string;
  title: string;
  description: string;
  severity: string;
  evidence: string;
  remediation: string;
  mitreTechnique: string;
  cvssScore: number;
}

export interface RedTeamTask {
  id: string;
  agentRole: RedTeamRole;
  phase: 'recon' | 'scan' | 'exploit' | 'post-exploit' | 'report';
  objective: string;
  target: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed';
  assignedTo: string;
  findings: RedTeamFinding[];
  dependencies: string[];
  startedAt: number;
  completedAt: number | null;
  output: string;
}

export interface RedTeamEngagement {
  id: string;
  name: string;
  scope: string[];
  rulesOfEngagement: string;
  status: 'planning' | 'active' | 'reporting' | 'completed' | 'cancelled';
  agents: RedTeamAgentConfig[];
  tasks: RedTeamTask[];
  raciMap: Record<string, { role: RedTeamRole; assignment: 'R' | 'A' | 'C' | 'I' }>;
  startedAt: number;
  completedAt: number | null;
  warRoomSessionId: string | null;
}

export const DEFAULT_AGENT_MATRIX: { role: RedTeamRole; secuclawRoleId: string; raciAssignment: 'R' | 'A' | 'C' | 'I' }[] = [
  { role: 'recon-agent', secuclawRoleId: 'security-ops', raciAssignment: 'R' },
  { role: 'scanner-agent', secuclawRoleId: 'security-expert', raciAssignment: 'R' },
  { role: 'exploit-agent', secuclawRoleId: 'security-expert', raciAssignment: 'R' },
  { role: 'post-exploit-agent', secuclawRoleId: 'security-expert', raciAssignment: 'R' },
  { role: 'social-engineer', secuclawRoleId: 'secuclaw-commander', raciAssignment: 'C' },
  { role: 'wireless-agent', secuclawRoleId: 'security-expert', raciAssignment: 'C' },
  { role: 'report-agent', secuclawRoleId: 'ciso', raciAssignment: 'I' },
  { role: 'opsec-agent', secuclawRoleId: 'secuclaw-commander', raciAssignment: 'A' },
];

const PHASE_ROLE_MAP: Record<string, RedTeamRole[]> = {
  recon: ['recon-agent'],
  scan: ['scanner-agent', 'wireless-agent'],
  exploit: ['exploit-agent', 'social-engineer'],
  'post-exploit': ['post-exploit-agent', 'opsec-agent'],
  report: ['report-agent'],
};

const STORE_KEY = 'redteam/engagements.json';

export class RedTeamAgentMatrix {
  constructor(private store: JsonStore) {}

  async createEngagement(params: {
    name: string;
    scope: string[];
    rulesOfEngagement: string;
    agents?: Partial<RedTeamAgentConfig>[];
  }): Promise<RedTeamEngagement> {
    const now = Date.now();
    const engagement: RedTeamEngagement = {
      id: this.generateId(),
      name: params.name,
      scope: params.scope,
      rulesOfEngagement: params.rulesOfEngagement,
      status: 'planning',
      agents: this.buildDefaultAgents(params.agents),
      tasks: [],
      raciMap: {},
      startedAt: now,
      completedAt: null,
      warRoomSessionId: null,
    };

    for (const entry of DEFAULT_AGENT_MATRIX) {
      engagement.raciMap[entry.role] = {
        role: entry.role,
        assignment: entry.raciAssignment,
      };
    }

    const engagements = await this.loadEngagements();
    engagements.push(engagement);
    await this.store.set(STORE_KEY, engagements);
    return engagement;
  }

  async getEngagement(id: string): Promise<RedTeamEngagement | null> {
    const engagements = await this.loadEngagements();
    return engagements.find((e) => e.id === id) ?? null;
  }

  async listEngagements(): Promise<RedTeamEngagement[]> {
    return this.loadEngagements();
  }

  async assignTask(
    engagementId: string,
    agentRole: RedTeamRole,
    objective: string,
    target: string,
    dependencies: string[] = [],
  ): Promise<RedTeamTask> {
    const engagement = await this.requireEngagement(engagementId);
    const agent = engagement.agents.find((a) => a.role === agentRole);
    if (!agent) {
      throw new Error(`No agent configured for role: ${agentRole}`);
    }

    const phase = this.inferPhase(agentRole);
    const task: RedTeamTask = {
      id: this.generateId(),
      agentRole,
      phase,
      objective,
      target,
      status: 'assigned',
      assignedTo: agent.id,
      findings: [],
      dependencies,
      startedAt: Date.now(),
      completedAt: null,
      output: '',
    };

    engagement.tasks.push(task);
    await this.saveEngagement(engagement);
    return task;
  }

  async executeTask(engagementId: string, taskId: string): Promise<RedTeamTask> {
    const engagement = await this.requireEngagement(engagementId);
    const task = engagement.tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const unmet = task.dependencies.filter((depId) => {
      const dep = engagement.tasks.find((t) => t.id === depId);
      return !dep || dep.status !== 'completed';
    });

    if (unmet.length > 0) {
      throw new Error(`Unmet dependencies: ${unmet.join(', ')}`);
    }

    task.status = 'in_progress';
    task.startedAt = Date.now();
    await this.saveEngagement(engagement);
    return task;
  }

  async completeTask(
    engagementId: string,
    taskId: string,
    findings: RedTeamFinding[],
  ): Promise<RedTeamTask> {
    const engagement = await this.requireEngagement(engagementId);
    const task = engagement.tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    task.status = 'completed';
    task.completedAt = Date.now();
    task.findings = findings.map((f) => ({
      ...f,
      id: f.id || this.generateId(),
      taskId: task.id,
    }));

    await this.saveEngagement(engagement);
    return task;
  }

  async getEngagementReport(engagementId: string): Promise<{
    summary: { totalTasks: number; completedTasks: number; failedTasks: number; totalFindings: number };
    findings: RedTeamFinding[];
    bySeverity: Record<string, number>;
    mitreCoverage: string[];
  }> {
    const engagement = await this.requireEngagement(engagementId);
    const allFindings = engagement.tasks.flatMap((t) => t.findings);

    const bySeverity: Record<string, number> = {};
    for (const f of allFindings) {
      bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;
    }

    const mitreCoverage = [...new Set(allFindings.map((f) => f.mitreTechnique).filter(Boolean))];

    return {
      summary: {
        totalTasks: engagement.tasks.length,
        completedTasks: engagement.tasks.filter((t) => t.status === 'completed').length,
        failedTasks: engagement.tasks.filter((t) => t.status === 'failed').length,
        totalFindings: allFindings.length,
      },
      findings: allFindings,
      bySeverity,
      mitreCoverage,
    };
  }

  async linkToWarRoom(engagementId: string, sessionId: string): Promise<void> {
    const engagement = await this.requireEngagement(engagementId);
    engagement.warRoomSessionId = sessionId;
    await this.saveEngagement(engagement);
  }

  private generateId(): string {
    return randomUUID();
  }

  private getAgentsForPhase(phase: RedTeamTask['phase']): RedTeamRole[] {
    return PHASE_ROLE_MAP[phase] ?? [];
  }

  private buildTaskDependencyGraph(tasks: RedTeamTask[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    for (const task of tasks) {
      graph.set(task.id, task.dependencies);
    }
    return graph;
  }

  private buildDefaultAgents(overrides?: Partial<RedTeamAgentConfig>[]): RedTeamAgentConfig[] {
    const overrideMap = new Map(overrides?.map((o) => [o.role, o]) ?? []);

    return DEFAULT_AGENT_MATRIX.map((entry, index) => {
      const override = overrideMap.get(entry.role) ?? {};
      return {
        id: override.id ?? `agent-${entry.role}-${index}`,
        role: entry.role,
        raciAssignment: entry.raciAssignment,
        secuclawRoleId: entry.secuclawRoleId,
        capabilities: override.capabilities ?? [entry.role],
        llmProvider: override.llmProvider ?? 'openai',
        llmModel: override.llmModel ?? 'gpt-4',
        maxConcurrent: override.maxConcurrent ?? 2,
        timeoutMs: override.timeoutMs ?? 300000,
      };
    });
  }

  private inferPhase(role: RedTeamRole): RedTeamTask['phase'] {
    const phaseMap: Record<RedTeamRole, RedTeamTask['phase']> = {
      'recon-agent': 'recon',
      'scanner-agent': 'scan',
      'wireless-agent': 'scan',
      'exploit-agent': 'exploit',
      'social-engineer': 'exploit',
      'post-exploit-agent': 'post-exploit',
      'opsec-agent': 'post-exploit',
      'report-agent': 'report',
    };
    return phaseMap[role] ?? 'recon';
  }

  private async loadEngagements(): Promise<RedTeamEngagement[]> {
    return (await this.store.get<RedTeamEngagement[]>(STORE_KEY)) ?? [];
  }

  private async saveEngagement(engagement: RedTeamEngagement): Promise<void> {
    const engagements = await this.loadEngagements();
    const idx = engagements.findIndex((e) => e.id === engagement.id);
    if (idx >= 0) {
      engagements[idx] = engagement;
    } else {
      engagements.push(engagement);
    }
    await this.store.set(STORE_KEY, engagements);
  }

  private async requireEngagement(id: string): Promise<RedTeamEngagement> {
    const engagement = await this.getEngagement(id);
    if (!engagement) {
      throw new Error(`Engagement not found: ${id}`);
    }
    return engagement;
  }
}
