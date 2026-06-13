import { AutonomousAgentLoop } from '../../ai/autonomous-agent-loop.js';
import { AgentEvalHarness } from '../../ai/agent-eval-harness.js';
import { AgentReplayLogger } from '../../ai/agent-replay-logger.js';
import type { JsonStore } from '../../storage/json-store.js';
import type { RouterDeps } from '../router.js';


const loops: Map<string, AutonomousAgentLoop> = new Map();
let evalHarness: AgentEvalHarness | null = null;
let replayLogger: AgentReplayLogger | null = null;

const stubLLM = {
  async chat(_messages: unknown[]): Promise<{ content: string }> {
    return {
      content: JSON.stringify({
        analysis: 'Stub LLM response',
        riskAssessment: { score: 0, factors: [] },
        recommendedActions: [],
        confidence: 0,
        reasoningChain: [],
        mitreMapping: [],
      }),
    };
  },
};

const DEFAULT_CONFIG = {
  defaultAutonomy: 'L1' as const,
  maxIterations: 10,
  thinkTimeoutMs: 60000,
  actTimeoutMs: 30000,
  verifyTimeoutMs: 30000,
  approvalTimeoutMs: 3600000,
};

function ensureEvalHarness(store: JsonStore): AgentEvalHarness {
  if (!evalHarness) evalHarness = new AgentEvalHarness(store);
  return evalHarness;
}

function ensureReplayLogger(store: JsonStore): AgentReplayLogger {
  if (!replayLogger) replayLogger = new AgentReplayLogger(store);
  return replayLogger;
}

export function registerAutonomousAgentRoutes(
  handlers: Map<string, Function>,
  deps: RouterDeps
): void {
  const store: any = (deps as any).jsonStore ?? (deps as any).store;

  handlers.set('agent.autonomy.start', async (params: Record<string, unknown>) => {
    const observation = params.observation as Record<string, unknown>;
    const autonomyLevel = (params.autonomyLevel as 'L1' | 'L2' | 'L3' | undefined) ?? 'L1';
    const loop = new AutonomousAgentLoop(
      DEFAULT_CONFIG,
      store,
      stubLLM as any
    );
    const state = await loop.start(observation as any, autonomyLevel);
    loops.set(state.id, loop);
    return { loopId: state.id, state };
  });

  handlers.set('agent.autonomy.get', async (params: Record<string, unknown>) => {
    const loopId = params.loopId as string;
    const loop = loops.get(loopId);
    if (loop) {
      const state = loop.getState(loopId);
      if (state) return state;
    }
    const active = await store.get('agent-loop/active.json') as Record<string, any> | null;
    if (active && active[loopId]) return active[loopId];
    const history = (await store.get('agent-loop/history.json') as any[]) || [];
    return history.find((s: any) => s.id === loopId) ?? null;
  });

  handlers.set('agent.autonomy.history', async (params: Record<string, unknown>) => {
    const limit = (params.limit as number | undefined) ?? 50;
    const history = (await store.get('agent-loop/history.json') as any[]) || [];
    return history.slice(-limit);
  });

  handlers.set('agent.autonomy.approve', async (params: Record<string, unknown>) => {
    const loopId = params.loopId as string;
    const actionId = params.actionId as string;
    const approved = params.approved as boolean;
    const approver = params.approver as string;
    const comment = params.comment as string | undefined;
    const loop = loops.get(loopId);
    if (!loop) return { success: false };
    const result = await loop.approve(actionId, approved, approver, comment);
    return { success: result };
  });

  handlers.set('agent.autonomy.cancel', async (params: Record<string, unknown>) => {
    const loopId = params.loopId as string;
    const loop = loops.get(loopId);
    if (!loop) return { success: false };
    const result = loop.cancel(loopId);
    if (result) loops.delete(loopId);
    return { success: result };
  });

  handlers.set('agent.autonomy.set-level', async (params: Record<string, unknown>) => {
    const loopId = params.loopId as string;
    const level = params.level as 'L1' | 'L2' | 'L3';
    const loop = loops.get(loopId);
    if (!loop) return { success: false };
    loop.setAutonomyLevel(loopId, level);
    return { success: true };
  });

  handlers.set('agent.eval.run-suite', async (params: Record<string, unknown>) => {
    const suiteId = params.suiteId as string;
    const input = params.input;
    const output = params.output;
    const harness = ensureEvalHarness(store);
    return await harness.runSuite(suiteId, input, output);
  });

  handlers.set('agent.eval.run-all', async (params: Record<string, unknown>) => {
    const input = params.input;
    const output = params.output;
    const harness = ensureEvalHarness(store);
    return await harness.runAllGates(input, output);
  });

  handlers.set('agent.eval.list-suites', async () => {
    const harness = ensureEvalHarness(store);
    return await harness.listSuites();
  });

  handlers.set('agent.eval.quick-check', async (params: Record<string, unknown>) => {
    const output = params.output;
    const harness = ensureEvalHarness(store);
    const safe = await harness.isOutputSafe(output);
    return { safe };
  });

  handlers.set('agent.replay.start-trace', async (params: Record<string, unknown>) => {
    const loopId = params.loopId as string;
    const metadata = params.metadata as Record<string, unknown> | undefined;
    const replay = ensureReplayLogger(store);
    return replay.startTrace(loopId, metadata);
  });

  handlers.set('agent.replay.log-event', async (params: Record<string, unknown>) => {
    const loopId = params.loopId as string;
    const type = params.type as any;
    const data = params.data as Record<string, unknown>;
    const actor = params.actor as any;
    const parentEventId = params.parentEventId as string | undefined;
    const replay = ensureReplayLogger(store);
    return replay.logEvent(loopId, type, data, actor, parentEventId);
  });

  handlers.set('agent.replay.end-trace', async (params: Record<string, unknown>) => {
    const loopId = params.loopId as string;
    const outcome = params.outcome as any;
    const replay = ensureReplayLogger(store);
    return await replay.endTrace(loopId, outcome);
  });

  handlers.set('agent.replay.get-trace', async (params: Record<string, unknown>) => {
    const traceId = params.traceId as string;
    const replay = ensureReplayLogger(store);
    return await replay.getTrace(traceId);
  });

  handlers.set('agent.replay.list-traces', async (params: Record<string, unknown>) => {
    const outcome = params.outcome as string | undefined;
    const since = params.since as number | undefined;
    const limit = params.limit as number | undefined;
    const replay = ensureReplayLogger(store);
    return await replay.listTraces({ outcome, since, limit });
  });

  handlers.set('agent.replay.export', async (params: Record<string, unknown>) => {
    const traceId = params.traceId as string;
    const format = params.format as 'json' | 'markdown' | 'timeline';
    const replay = ensureReplayLogger(store);
    const content = await replay.exportTrace(traceId, format);
    return { content };
  });

  handlers.set('agent.replay.stats', async () => {
    const replay = ensureReplayLogger(store);
    return await replay.getAgentAuditStats();
  });
}
