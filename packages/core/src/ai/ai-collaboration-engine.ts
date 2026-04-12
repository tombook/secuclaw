import { LLMService } from './llm-service.js';
import type { LLMMessage } from './llm-types.js';
import { AIModelRouter } from './ai-model-router.js';
import { RolePersonaManager } from './role-persona.js';
import { SessionManager } from '../raci/session-manager.js';
import { RACI_SCENARIO_MAP, EVENT_TYPE_TO_SCENARIO } from '../raci/types.js';
import type { RoleId, ScenarioType, RaciAssignment } from '../raci/types.js';

export type CollaborationPhase = 'idle' | 'analyzing' | 'consulting' | 'deciding' | 'synthesizing' | 'notifying' | 'complete' | 'failed';

export interface CollaborationStatus {
  sessionId: string;
  phase: CollaborationPhase;
  completedRoles: RoleId[];
  currentPhaseRoles: RoleId[];
  error?: string;
  startedAt: number;
  updatedAt: number;
}

interface CollaborationRun {
  status: CollaborationStatus;
  abortController: AbortController;
}

const activeRuns = new Map<string, CollaborationRun>();

export class AICollaborationEngine {
  private modelRouter: AIModelRouter;
  private personaManager: RolePersonaManager;
  private sessionManager: SessionManager;

  constructor(modelRouter: AIModelRouter, sessionManager: SessionManager) {
    this.modelRouter = modelRouter;
    this.personaManager = new RolePersonaManager();
    this.sessionManager = sessionManager;
  }

  async trigger(params: {
    sessionId: string;
    scenario: ScenarioType;
    eventType: string;
    eventId: string;
    eventData?: Record<string, unknown>;
  }): Promise<CollaborationStatus> {
    const existing = activeRuns.get(params.sessionId);
    if (existing && existing.status.phase !== 'complete' && existing.status.phase !== 'failed' && existing.status.phase !== 'idle') {
      return existing.status;
    }

    const abortController = new AbortController();
    const status: CollaborationStatus = {
      sessionId: params.sessionId,
      phase: 'analyzing',
      completedRoles: [],
      currentPhaseRoles: [],
      startedAt: Date.now(),
      updatedAt: Date.now(),
    };

    activeRuns.set(params.sessionId, { status, abortController });

    this.executeCollaboration(params, status, abortController).catch((err) => {
      console.error(`[AICollab] Collaboration failed for session ${params.sessionId}:`, err);
      status.phase = 'failed';
      status.error = err instanceof Error ? err.message : String(err);
      status.updatedAt = Date.now();
    });

    return status;
  }

  getStatus(sessionId: string): CollaborationStatus | null {
    return activeRuns.get(sessionId)?.status || null;
  }

  stop(sessionId: string): boolean {
    const run = activeRuns.get(sessionId);
    if (!run) return false;
    run.abortController.abort();
    run.status.phase = 'failed';
    run.status.error = 'Aborted by user';
    run.status.updatedAt = Date.now();
    return true;
  }

  private async executeCollaboration(
    params: {
      sessionId: string;
      scenario: ScenarioType;
      eventType: string;
      eventId: string;
      eventData?: Record<string, unknown>;
    },
    status: CollaborationStatus,
    abortController: AbortController,
  ): Promise<void> {
    const config = this.modelRouter.getConfig();
    const totalTimeout = setTimeout(() => abortController.abort(), config.totalTimeoutMs);
    const scenarioMap = RACI_SCENARIO_MAP[params.scenario];

    try {
      const eventContext = this.buildEventContext(params.eventType, params.eventId, params.eventData);

      // Phase 1: R-role analysis
      status.phase = 'analyzing';
      status.updatedAt = Date.now();
      const rRoles = Object.entries(scenarioMap)
        .filter(([, v]) => v === 'R')
        .map(([k]) => k as RoleId);
      status.currentPhaseRoles = rRoles;

      const rResults: Map<RoleId, string> = new Map();
      for (const roleId of rRoles) {
        if (abortController.signal.aborted) return;
        const result = await this.callRoleLLM(roleId, 'R', params.scenario, eventContext, '请分析此安全事件，识别威胁向量、影响范围和建议的初步响应措施。');
        if (result) {
          rResults.set(roleId, result);
          await this.sendAIMessage(params.sessionId, roleId, result);
          status.completedRoles.push(roleId);
          status.updatedAt = Date.now();
        }
      }

      // Phase 2: C-role consultation (parallel)
      status.phase = 'consulting';
      status.updatedAt = Date.now();
      const cRoles = Object.entries(scenarioMap)
        .filter(([, v]) => v === 'C')
        .map(([k]) => k as RoleId);
      status.currentPhaseRoles = cRoles;

      const rAnalysisText = Array.from(rResults.values()).join('\n\n');
      const cResults: Map<RoleId, string> = new Map();

      const cBatches = this.batch(cRoles, config.maxConcurrency);
      for (const batch of cBatches) {
        if (abortController.signal.aborted) return;
        const cPromises = batch.map(async (roleId) => {
          const result = await this.callRoleLLM(roleId, 'C', params.scenario, eventContext, `负责人角色的分析如下：\n${rAnalysisText}\n\n请从你的专业角度补充意见和建议。`);
          return { roleId, result };
        });
        const cResponses = await Promise.allSettled(cPromises);
        for (const resp of cResponses) {
          if (resp.status === 'fulfilled' && resp.value.result) {
            cResults.set(resp.value.roleId, resp.value.result);
            await this.sendAIMessage(params.sessionId, resp.value.roleId, resp.value.result);
            status.completedRoles.push(resp.value.roleId);
          }
        }
        status.updatedAt = Date.now();
      }

      // Phase 3: A-role decision
      status.phase = 'deciding';
      status.updatedAt = Date.now();
      const aRoles = Object.entries(scenarioMap)
        .filter(([, v]) => v === 'A')
        .map(([k]) => k as RoleId);
      status.currentPhaseRoles = aRoles;

      const allAnalysisText = `【负责人分析】\n${rAnalysisText}\n\n【咨询意见】\n${Array.from(cResults.entries()).map(([id, text]) => `[${id}]: ${text}`).join('\n\n')}`;

      const aResults: Map<RoleId, string> = new Map();
      for (const roleId of aRoles) {
        if (abortController.signal.aborted) return;
        const result = await this.callRoleLLM(roleId, 'A', params.scenario, eventContext, `各角色分析如下：\n${allAnalysisText}\n\n请综合所有分析，做出最终决策和行动计划。`);
        if (result) {
          aResults.set(roleId, result);
          await this.sendAIMessage(params.sessionId, roleId, result);
          status.completedRoles.push(roleId);
          status.updatedAt = Date.now();
        }
      }

      // Phase 4: Commander synthesis
      status.phase = 'synthesizing';
      status.updatedAt = Date.now();
      status.currentPhaseRoles = ['secuclaw-commander'];

      const decisionText = Array.from(aResults.values()).join('\n\n');
      const commanderResult = await this.callCommanderLLM(
        params.scenario,
        eventContext,
        `各角色分析汇总：\n${allAnalysisText}\n\n决策：\n${decisionText}\n\n请生成最终的综合分析报告和可执行的行动方案。`,
      );
      if (commanderResult) {
        await this.sendAIMessage(params.sessionId, 'secuclaw-commander', commanderResult);
        status.completedRoles.push('secuclaw-commander');
      }
      status.updatedAt = Date.now();

      // Phase 5: I-role notification
      status.phase = 'notifying';
      status.updatedAt = Date.now();
      const iRoles = Object.entries(scenarioMap)
        .filter(([, v]) => v === 'I')
        .map(([k]) => k as RoleId);
      status.currentPhaseRoles = iRoles;

      const summary = commanderResult || decisionText || rAnalysisText;
      for (const roleId of iRoles) {
        if (abortController.signal.aborted) return;
        const result = await this.callRoleLLM(roleId, 'I', params.scenario, eventContext, `安全事件汇总通知：\n${summary.substring(0, 500)}\n\n请简要确认你已了解此事件，并说明你将如何配合。`);
        if (result) {
          await this.sendAIMessage(params.sessionId, roleId, result);
          status.completedRoles.push(roleId);
        }
      }
      status.updatedAt = Date.now();

      status.phase = 'complete';
      status.updatedAt = Date.now();
    } finally {
      clearTimeout(totalTimeout);
    }
  }

  private async callRoleLLM(
    roleId: RoleId,
    raciType: RaciAssignment,
    scenario: ScenarioType,
    eventContext: string,
    instruction: string,
  ): Promise<string | null> {
    try {
      const route = this.modelRouter.getRouteForRaciType(raciType);
      const llmConfig = this.modelRouter.toLLMConfig(route);

      if (!llmConfig.apiKey) {
        console.warn(`[AICollab] No API key configured for RACI type ${raciType}, skipping role ${roleId}`);
        return null;
      }

      const llmService = new LLMService(llmConfig);
      const systemPrompt = this.personaManager.buildSystemPrompt(roleId);

      const messages: LLMMessage[] = [
        systemPrompt,
        {
          role: 'user',
          content: `${eventContext}\n\n${instruction}\n\n请用中文回答。`,
        },
      ];

      const response = await llmService.chat(messages);
      return response.content;
    } catch (err) {
      console.error(`[AICollab] LLM call failed for role ${roleId}:`, err);
      return null;
    }
  }

  private async callCommanderLLM(
    scenario: ScenarioType,
    eventContext: string,
    instruction: string,
  ): Promise<string | null> {
    try {
      const llmConfig = this.modelRouter.toCommanderLLMConfig();

      if (!llmConfig.apiKey) {
        console.warn('[AICollab] No API key configured for Commander, skipping synthesis');
        return null;
      }

      const llmService = new LLMService(llmConfig);
      const systemPrompt = this.personaManager.buildSystemPrompt('secuclaw-commander');

      const messages: LLMMessage[] = [
        systemPrompt,
        {
          role: 'user',
          content: `${eventContext}\n\n${instruction}\n\n请用中文回答，输出结构化的行动方案。`,
        },
      ];

      const response = await llmService.chat(messages);
      return response.content;
    } catch (err) {
      console.error('[AICollab] Commander LLM call failed:', err);
      return null;
    }
  }

  private buildEventContext(eventType: string, eventId: string, eventData?: Record<string, unknown>): string {
    const lines = [`安全事件类型: ${eventType}`, `事件ID: ${eventId}`];
    if (eventData) {
      lines.push(`事件详情: ${JSON.stringify(eventData, null, 2)}`);
    }
    return lines.join('\n');
  }

  private async sendAIMessage(sessionId: string, roleId: RoleId, content: string): Promise<void> {
    try {
      await this.sessionManager.sendMessage(sessionId, content, roleId, roleId);
    } catch (err) {
      console.error(`[AICollab] Failed to send message for role ${roleId}:`, err);
    }
  }

  private batch<T>(arr: T[], size: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      batches.push(arr.slice(i, i + size));
    }
    return batches;
  }
}
