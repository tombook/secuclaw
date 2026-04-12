import type { RouterDeps } from '../router.js';
import { AIModelRouter, DEFAULT_CONFIG } from '../../ai/ai-model-router.js';
import { AICollaborationEngine } from '../../ai/ai-collaboration-engine.js';
import { SessionManager } from '../../raci/session-manager.js';
import type { ScenarioType } from '../../raci/types.js';
import { EVENT_TYPE_TO_SCENARIO } from '../../raci/types.js';

let engine: AICollaborationEngine | null = null;
let modelRouter: AIModelRouter | null = null;

function getEngine(deps: RouterDeps): { engine: AICollaborationEngine; router: AIModelRouter } {
  if (!modelRouter) {
    modelRouter = new AIModelRouter(deps.jsonStore);
  }
  if (!engine) {
    const sessionManager = new SessionManager(deps.jsonStore);
    engine = new AICollaborationEngine(modelRouter, sessionManager);
  }
  return { engine, router: modelRouter };
}

export function registerAiCollaborationRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  deps: RouterDeps
): void {

  handlers.set('ai.collaboration.trigger', async (params) => {
    const { engine: eng, router: rt } = getEngine(deps);
    await rt.load();

    const sessionId = params.sessionId as string;
    const eventType = params.eventType as string;
    const eventId = params.eventId as string;
    const scenario = (params.scenario as ScenarioType) || EVENT_TYPE_TO_SCENARIO[eventType] || 'incident-response';
    const eventData = params.eventData as Record<string, unknown> | undefined;

    if (!sessionId || !eventType || !eventId) {
      throw new Error('Missing required parameters: sessionId, eventType, eventId');
    }

    return eng.trigger({ sessionId, scenario, eventType, eventId, eventData });
  });

  handlers.set('ai.collaboration.status', async (params) => {
    const sessionId = params.sessionId as string;
    if (!sessionId) throw new Error('Missing required parameter: sessionId');
    return getEngine(deps).engine.getStatus(sessionId);
  });

  handlers.set('ai.collaboration.configure', async (params) => {
    const { router: rt } = getEngine(deps);
    if (params.config) {
      return rt.save(params.config as Record<string, unknown>);
    }
    return rt.getConfig();
  });

  handlers.set('ai.collaboration.stop', async (params) => {
    const sessionId = params.sessionId as string;
    if (!sessionId) throw new Error('Missing required parameter: sessionId');
    return { success: getEngine(deps).engine.stop(sessionId) };
  });
}
