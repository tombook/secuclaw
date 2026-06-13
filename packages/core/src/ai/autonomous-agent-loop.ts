import { randomUUID } from 'crypto';
import type { JsonStore } from '../storage/json-store.js';
import type { LLMService } from './llm-service.js';
import type { LLMMessage } from './llm-types.js';

export type AutonomyLevel = 'L1' | 'L2' | 'L3';

export type AgentPhase =
  | 'idle'
  | 'observing'
  | 'thinking'
  | 'acting'
  | 'verifying'
  | 'waiting_approval'
  | 'completed'
  | 'failed'
  | 'rolled_back';

export interface AgentObservation {
  timestamp: number;
  source: string;
  eventType: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  summary: string;
  rawData: Record<string, unknown>;
  relatedEntities: Array<{ type: string; id: string }>;
}

export interface AgentThought {
  timestamp: number;
  analysis: string;
  riskAssessment: { score: number; factors: string[] };
  recommendedActions: AgentAction[];
  confidence: number;
  reasoningChain: string[];
  mitreMapping: string[];
}

export interface AgentAction {
  id: string;
  type: string;
  target: string;
  params: Record<string, unknown>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresApproval: boolean;
  rollbackAction?: AgentAction;
  timeoutMs: number;
}

export interface AgentVerification {
  actionId: string;
  timestamp: number;
  success: boolean;
  evidence: string;
  metricsBefore: Record<string, number>;
  metricsAfter: Record<string, number>;
}

export interface AgentLoopState {
  id: string;
  autonomyLevel: AutonomyLevel;
  phase: AgentPhase;
  observation: AgentObservation | null;
  thoughts: AgentThought[];
  plannedActions: AgentAction[];
  executedActions: Array<{ action: AgentAction; result: unknown; verified: boolean }>;
  verifications: AgentVerification[];
  startedAt: number;
  completedAt: number | null;
  humanApprovals: Array<{
    actionId: string;
    approved: boolean;
    approver: string;
    timestamp: number;
    comment: string;
  }>;
  totalDurationMs: number;
}

export interface AgentLoopConfig {
  defaultAutonomy?: AutonomyLevel;
  maxIterations?: number;
  thinkTimeoutMs?: number;
  actTimeoutMs?: number;
  verifyTimeoutMs?: number;
  approvalTimeoutMs?: number;
  autoEscalateOnFailure?: boolean;
  riskThresholdForAutoExecute?: 'low' | 'medium';
}

const ACTIVE_KEY = 'agent-loop/active.json';
const HISTORY_KEY = 'agent-loop/history.json';

const RISK_RANK: Record<string, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

const SEVERITY_RANK: Record<string, number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const logger = {
  info: (...args: any[]) => console.log('[AutonomousAgentLoop]', ...args),
  error: (...args: any[]) => console.error('[AutonomousAgentLoop]', ...args),
  warn: (...args: any[]) => console.warn('[AutonomousAgentLoop]', ...args),
  debug: (...args: any[]) => console.log('[AutonomousAgentLoop:DEBUG]', ...args),
};

export class AutonomousAgentLoop {
  private config: Required<AgentLoopConfig>;
  private store: JsonStore;
  private llm: LLMService;
  private activeLoops: Map<string, AgentLoopState> = new Map();
  private approvalResolvers: Map<
    string,
    { resolve: (approved: boolean) => void; timer: ReturnType<typeof setTimeout> }
  > = new Map();

  constructor(config: AgentLoopConfig, store: JsonStore, llm: LLMService) {
    this.config = {
      defaultAutonomy: config.defaultAutonomy ?? 'L1',
      maxIterations: config.maxIterations ?? 10,
      thinkTimeoutMs: config.thinkTimeoutMs ?? 60000,
      actTimeoutMs: config.actTimeoutMs ?? 30000,
      verifyTimeoutMs: config.verifyTimeoutMs ?? 30000,
      approvalTimeoutMs: config.approvalTimeoutMs ?? 3600000,
      autoEscalateOnFailure: config.autoEscalateOnFailure ?? true,
      riskThresholdForAutoExecute: config.riskThresholdForAutoExecute ?? 'low',
    };
    this.store = store;
    this.llm = llm;
  }

  async start(
    observation: AgentObservation,
    autonomyLevel?: AutonomyLevel,
  ): Promise<AgentLoopState> {
    const level = autonomyLevel ?? this.config.defaultAutonomy;
    const state: AgentLoopState = {
      id: this.generateId(),
      autonomyLevel: level,
      phase: 'observing',
      observation: null,
      thoughts: [],
      plannedActions: [],
      executedActions: [],
      verifications: [],
      startedAt: Date.now(),
      completedAt: null,
      humanApprovals: [],
      totalDurationMs: 0,
    };

    this.activeLoops.set(state.id, state);
    await this.persistActive(state);

    try {
      state.phase = 'observing';
      state.observation = observation;
      await this.persistActive(state);
      logger.info(`Loop ${state.id}: observed ${observation.eventType} from ${observation.source}`);

      state.phase = 'thinking';
      await this.persistActive(state);
      const thought = await this.think(observation);
      state.thoughts.push(thought);
      await this.persistActive(state);
      logger.info(
        `Loop ${state.id}: thinking complete, ${thought.recommendedActions.length} actions recommended`,
      );

      state.phase = 'acting';
      state.plannedActions = thought.recommendedActions;
      await this.persistActive(state);

      for (const action of thought.recommendedActions) {
        if (this.shouldAutoExecute(action)) {
          logger.info(`Loop ${state.id}: auto-executing action ${action.type} on ${action.target}`);
          const result = await this.executeAction(action);
          state.executedActions.push({ action, result, verified: false });
          await this.persistActive(state);

          state.phase = 'verifying';
          await this.persistActive(state);
          const verification = await this.verify(action, result);
          state.verifications.push(verification);
          const executedIdx = state.executedActions.length - 1;
          state.executedActions[executedIdx]!.verified = verification.success;
          await this.persistActive(state);

          if (!verification.success && this.config.autoEscalateOnFailure) {
            logger.warn(
              `Loop ${state.id}: verification failed for ${action.type}, escalating`,
            );
            const escalateAction: AgentAction = {
              id: this.generateId(),
              type: 'escalate',
              target: action.target,
              params: {
                originalActionId: action.id,
                reason: 'Verification failed',
                evidence: verification.evidence,
              },
              riskLevel: 'low',
              requiresApproval: false,
              timeoutMs: this.config.actTimeoutMs,
            };
            const escalateResult = await this.executeAction(escalateAction);
            state.executedActions.push({
              action: escalateAction,
              result: escalateResult,
              verified: true,
            });
            await this.persistActive(state);
          }
        } else {
          logger.info(
            `Loop ${state.id}: action ${action.type} requires approval, waiting`,
          );
          state.phase = 'waiting_approval';
          await this.persistActive(state);

          const approved = await this.waitForApproval(action.id);
          if (approved) {
            logger.info(
              `Loop ${state.id}: approval granted for ${action.type}`,
            );
            const result = await this.executeAction(action);
            state.executedActions.push({ action, result, verified: false });
            await this.persistActive(state);

            state.phase = 'verifying';
            await this.persistActive(state);
            const verification = await this.verify(action, result);
            state.verifications.push(verification);
            const executedIdx = state.executedActions.length - 1;
            state.executedActions[executedIdx]!.verified = verification.success;
            await this.persistActive(state);

            if (!verification.success && action.rollbackAction) {
              logger.warn(
                `Loop ${state.id}: rolling back ${action.type}`,
              );
              state.phase = 'rolled_back';
              await this.executeAction(action.rollbackAction);
              await this.persistActive(state);
            }
          } else {
            logger.info(
              `Loop ${state.id}: action ${action.type} was rejected`,
            );
          }
        }
      }

      state.phase = 'completed';
      state.completedAt = Date.now();
      state.totalDurationMs = state.completedAt - state.startedAt;
    } catch (error) {
      state.phase = 'failed';
      state.completedAt = Date.now();
      state.totalDurationMs = state.completedAt - state.startedAt;
      logger.error(`Loop ${state.id}: failed - ${error}`);
    }

    await this.persistActive(state);
    await this.archiveToHistory(state);
    this.activeLoops.delete(state.id);

    return state;
  }

  observe(rawEvent: Record<string, unknown>): AgentObservation {
    const severity = (rawEvent.severity as AgentObservation['severity']) ?? 'info';
    const source = (rawEvent.source as string) ?? 'unknown';
    const eventType = (rawEvent.eventType as string) ?? 'event.unknown';

    const relatedEntities: Array<{ type: string; id: string }> = [];
    if (Array.isArray(rawEvent.relatedEntities)) {
      for (const entity of rawEvent.relatedEntities) {
        if (entity && typeof entity === 'object' && 'type' in entity && 'id' in entity) {
          relatedEntities.push({ type: String(entity.type), id: String(entity.id) });
        }
      }
    }

    return {
      timestamp: typeof rawEvent.timestamp === 'number' ? rawEvent.timestamp : Date.now(),
      source,
      eventType,
      severity,
      summary: (rawEvent.summary as string) ?? (rawEvent.message as string) ?? `Event from ${source}`,
      rawData: rawEvent,
      relatedEntities,
    };
  }

  async think(
    observation: AgentObservation,
    context?: Record<string, unknown>,
  ): Promise<AgentThought> {
    const prompt = this.buildReasoningPrompt(observation, context ?? {});

    const messages: LLMMessage[] = [
      {
        role: 'system',
        content:
          'You are an autonomous SOC (Security Operations Center) agent. Analyze security events and recommend precise, actionable response steps. Return valid JSON only.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    const response = await this.llm.chat(messages);

    return this.parseThoughtResponse(response.content, observation);
  }

  async act(
    thought: AgentThought,
  ): Promise<Array<{ action: AgentAction; result: unknown }>> {
    const results: Array<{ action: AgentAction; result: unknown }> = [];

    for (const action of thought.recommendedActions) {
      try {
        const result = await this.executeAction(action);
        results.push({ action, result });
      } catch (error) {
        results.push({ action, result: { error: String(error) } });
      }
    }

    return results;
  }

  async verify(action: AgentAction, result: unknown): Promise<AgentVerification> {
    const metricsBefore = this.extractMetrics(result, 'before');
    const metricsAfter = this.extractMetrics(result, 'after');
    const success = this.evaluateActionResult(action, result);

    return {
      actionId: action.id,
      timestamp: Date.now(),
      success,
      evidence: this.buildVerificationEvidence(action, result, success),
      metricsBefore,
      metricsAfter,
    };
  }

  async approve(
    actionId: string,
    approved: boolean,
    approver: string,
    comment?: string,
  ): Promise<boolean> {
    const resolver = this.approvalResolvers.get(actionId);
    if (!resolver) return false;

    for (const [, state] of this.activeLoops) {
      state.humanApprovals.push({
        actionId,
        approved,
        approver,
        timestamp: Date.now(),
        comment: comment ?? '',
      });
      await this.persistActive(state);
    }

    clearTimeout(resolver.timer);
    this.approvalResolvers.delete(actionId);
    resolver.resolve(approved);
    return true;
  }

  getState(loopId: string): AgentLoopState | null {
    return this.activeLoops.get(loopId) ?? null;
  }

  cancel(loopId: string): boolean {
    const state = this.activeLoops.get(loopId);
    if (!state) return false;

    state.phase = 'failed';
    state.completedAt = Date.now();
    state.totalDurationMs = state.completedAt - state.startedAt;

    for (const [actionId, resolver] of this.approvalResolvers) {
      clearTimeout(resolver.timer);
      resolver.resolve(false);
      this.approvalResolvers.delete(actionId);
    }

    this.activeLoops.delete(loopId);
    return true;
  }

  setAutonomyLevel(loopId: string, level: AutonomyLevel): void {
    const state = this.activeLoops.get(loopId);
    if (state) {
      state.autonomyLevel = level;
    }
  }

  async getHistory(limit: number = 50): Promise<AgentLoopState[]> {
    const history = await this.store.get<AgentLoopState[]>(HISTORY_KEY);
    if (!history) return [];
    return history.slice(-limit);
  }

  private shouldAutoExecute(action: AgentAction): boolean {
    const level = this.determineCurrentAutonomy();

    if (level === 'L1') return false;

    if (level === 'L3') return true;

    const threshold = RISK_RANK[this.config.riskThresholdForAutoExecute] ?? 0;
    const actionRisk = RISK_RANK[action.riskLevel] ?? 0;
    return actionRisk <= threshold;
  }

  private determineCurrentAutonomy(): AutonomyLevel {
    for (const [, state] of this.activeLoops) {
      if (state.phase !== 'completed' && state.phase !== 'failed') {
        return state.autonomyLevel;
      }
    }
    return this.config.defaultAutonomy;
  }

  private async executeAction(action: AgentAction): Promise<unknown> {
    const timeoutMs = action.timeoutMs || this.config.actTimeoutMs;

    return new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Action ${action.id} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      (async () => {
        try {
          const result = await this.dispatchAction(action);
          clearTimeout(timer);
          resolve(result);
        } catch (error) {
          clearTimeout(timer);
          reject(error);
        }
      })();
    });
  }

  private async dispatchAction(action: AgentAction): Promise<unknown> {
    logger.info(`Dispatching action: ${action.type} -> ${action.target}`);

    switch (action.type) {
      case 'block_ip':
        return { blocked: true, ip: action.target, ruleId: this.generateId() };
      case 'isolate_host':
        return { isolated: true, host: action.target, isolatedAt: Date.now() };
      case 'create_incident':
        return { incidentId: this.generateId(), created: true };
      case 'notify':
        return { notified: true, channel: action.params.channel ?? 'default' };
      case 'run_tool':
        return { toolOutput: `Tool execution result for ${action.target}`, exitCode: 0 };
      case 'escalate':
        return { escalated: true, target: action.target, timestamp: Date.now() };
      case 'update_ticket':
        return { updated: true, ticketId: action.target };
      case 'enrich_ioc':
        return { enriched: true, ioc: action.target, details: action.params };
      default:
        return { executed: true, type: action.type, target: action.target };
    }
  }

  private buildReasoningPrompt(
    observation: AgentObservation,
    context: Record<string, unknown>,
  ): string {
    return JSON.stringify({
      task: 'Analyze this security observation and recommend response actions.',
      observation: {
        source: observation.source,
        eventType: observation.eventType,
        severity: observation.severity,
        summary: observation.summary,
        timestamp: new Date(observation.timestamp).toISOString(),
        relatedEntities: observation.relatedEntities,
      },
      context,
      outputFormat: {
        analysis: 'string - brief analysis of the event',
        riskAssessment: {
          score: 'number 0-100',
          factors: 'string[] - risk factors identified',
        },
        recommendedActions: [
          {
            type: 'action type: block_ip | isolate_host | create_incident | notify | run_tool | escalate | update_ticket | enrich_ioc',
            target: 'string - target of the action',
            params: 'Record<string, unknown> - action parameters',
            riskLevel: 'low | medium | high | critical',
            reasoning: 'string - why this action is recommended',
          },
        ],
        confidence: 'number 0-1',
        reasoningChain: 'string[] - step by step reasoning',
        mitreMapping: 'string[] - MITRE ATT&CK technique IDs if applicable',
      },
    });
  }

  private parseThoughtResponse(content: string, observation: AgentObservation): AgentThought {
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      const actions: AgentAction[] = (parsed.recommendedActions ?? []).map(
        (a: any, index: number) => {
          const riskLevel = this.assessRiskFromParams(a);
          return {
            id: this.generateId(),
            type: a.type ?? 'notify',
            target: a.target ?? observation.source,
            params: a.params ?? {},
            riskLevel,
            requiresApproval: riskLevel === 'high' || riskLevel === 'critical',
            timeoutMs: this.config.actTimeoutMs,
          } satisfies AgentAction;
        },
      );

      return {
        timestamp: Date.now(),
        analysis: parsed.analysis ?? 'No analysis provided',
        riskAssessment: {
          score: typeof parsed.riskAssessment?.score === 'number' ? parsed.riskAssessment.score : 50,
          factors: Array.isArray(parsed.riskAssessment?.factors) ? parsed.riskAssessment.factors : [],
        },
        recommendedActions: actions,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
        reasoningChain: Array.isArray(parsed.reasoningChain) ? parsed.reasoningChain : [],
        mitreMapping: Array.isArray(parsed.mitreMapping) ? parsed.mitreMapping : [],
      };
    } catch {
      logger.warn('Failed to parse LLM thought response, using fallback');
      return {
        timestamp: Date.now(),
        analysis: `Fallback analysis for ${observation.eventType} from ${observation.source}`,
        riskAssessment: {
          score: SEVERITY_RANK[observation.severity] * 25,
          factors: [`Source: ${observation.source}`, `Severity: ${observation.severity}`],
        },
        recommendedActions: [
          {
            id: this.generateId(),
            type: 'create_incident',
            target: observation.source,
            params: { summary: observation.summary, severity: observation.severity },
            riskLevel: 'low',
            requiresApproval: false,
            timeoutMs: this.config.actTimeoutMs,
          },
        ],
        confidence: 0.3,
        reasoningChain: ['LLM response parse failed, creating fallback incident'],
        mitreMapping: [],
      };
    }
  }

  private assessRiskFromParams(action: any): 'low' | 'medium' | 'high' | 'critical' {
    if (action.riskLevel && RISK_RANK[action.riskLevel] !== undefined) {
      return action.riskLevel;
    }

    const highRiskTypes = ['block_ip', 'isolate_host'];
    const criticalRiskTypes: string[] = [];

    if (criticalRiskTypes.includes(action.type)) return 'critical';
    if (highRiskTypes.includes(action.type)) return 'high';

    return 'low';
  }

  private evaluateActionResult(action: AgentAction, result: unknown): boolean {
    if (!result || typeof result !== 'object') return false;
    const res = result as Record<string, unknown>;

    if (res.error) return false;

    switch (action.type) {
      case 'block_ip':
        return res.blocked === true;
      case 'isolate_host':
        return res.isolated === true;
      case 'create_incident':
        return res.created === true;
      case 'notify':
        return res.notified === true;
      case 'run_tool':
        return res.exitCode === 0;
      case 'escalate':
        return res.escalated === true;
      case 'update_ticket':
        return res.updated === true;
      case 'enrich_ioc':
        return res.enriched === true;
      default:
        return res.executed === true;
    }
  }

  private buildVerificationEvidence(
    action: AgentAction,
    result: unknown,
    success: boolean,
  ): string {
    const res = result as Record<string, unknown> | null;
    if (success) {
      return `Action ${action.type} on ${action.target} completed successfully. Result: ${JSON.stringify(res)}`;
    }
    return `Action ${action.type} on ${action.target} failed. Result: ${JSON.stringify(res)}`;
  }

  private extractMetrics(
    result: unknown,
    phase: 'before' | 'after',
  ): Record<string, number> {
    if (!result || typeof result !== 'object') return {};
    const res = result as Record<string, unknown>;
    const metrics = (phase === 'before' ? res.metricsBefore : res.metricsAfter) as
      | Record<string, number>
      | undefined;
    return metrics ?? {};
  }

  private waitForApproval(actionId: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => {
        this.approvalResolvers.delete(actionId);
        logger.warn(`Approval timed out for action ${actionId}`);
        resolve(false);
      }, this.config.approvalTimeoutMs);

      this.approvalResolvers.set(actionId, { resolve, timer });
    });
  }

  private async persistActive(state: AgentLoopState): Promise<void> {
    this.activeLoops.set(state.id, state);
    try {
      const all: Record<string, AgentLoopState> = {};
      for (const [id, s] of this.activeLoops) {
        all[id] = s;
      }
      await this.store.set(ACTIVE_KEY, all);
    } catch (error) {
      logger.error('Failed to persist active state', error);
    }
  }

  private async archiveToHistory(state: AgentLoopState): Promise<void> {
    try {
      const history = (await this.store.get<AgentLoopState[]>(HISTORY_KEY)) ?? [];
      history.push(state);
      const trimmed = history.slice(-this.config.maxIterations * 10);
      await this.store.set(HISTORY_KEY, trimmed);
    } catch (error) {
      logger.error('Failed to archive to history', error);
    }
  }

  private generateId(): string {
    return randomUUID();
  }
}
