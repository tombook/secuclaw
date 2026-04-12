import type { EventBus } from './event-bus.js';
import type { JsonStore } from '../storage/json-store.js';
import { TaskEngine } from '../raci/task-engine.js';
import { TaskRepository } from '../raci/task-repository.js';
import { SessionRepository } from '../raci/session-repository.js';
import { SessionManager } from '../raci/session-manager.js';
import { EVENT_TYPE_TO_SCENARIO } from '../raci/types.js';
import { AICollaborationEngine } from '../ai/ai-collaboration-engine.js';
import { AIModelRouter } from '../ai/ai-model-router.js';

export function initRaciEventBridge(eventBus: EventBus, jsonStore: JsonStore): void {
  const taskRepo = new TaskRepository(jsonStore);
  const sessionRepo = new SessionRepository(jsonStore);
  const taskEngine = new TaskEngine(taskRepo, sessionRepo);
  const sessionManager = new SessionManager(jsonStore);
  const modelRouter = new AIModelRouter(jsonStore);
  const collaborationEngine = new AICollaborationEngine(modelRouter, sessionManager);

  async function handleEvent(eventType: string, eventId: string, eventData: Record<string, unknown>, title: string, createdBy: string) {
    const scenario = EVENT_TYPE_TO_SCENARIO[eventType] || 'incident-response';
    const session = await sessionManager.createSession({
      title,
      scenario,
      eventId,
      eventType: eventType as 'incident' | 'vulnerability' | 'threat',
      createdBy,
    });
    await taskEngine.createTasksForEvent(eventType, eventId);
    console.log(`[RaciBridge] Created war room session ${session.id} for ${eventType} ${eventId}`);

    collaborationEngine.trigger({
      sessionId: session.id,
      scenario,
      eventType,
      eventId,
      eventData,
    }).catch((err) => {
      console.error(`[RaciBridge] AI collaboration trigger failed for ${eventType} ${eventId}:`, err);
    });
  }

  eventBus.on('incident.created', async (payload) => {
    try {
      await handleEvent(
        'incident',
        payload.incidentId,
        payload as unknown as Record<string, unknown>,
        `Incident Response - ${payload.incidentId}`,
        payload.assignee || 'system',
      );
    } catch (err) {
      console.error('[RaciBridge] Failed to handle incident.created:', err);
    }
  });

  eventBus.on('vulnerability.created', async (payload) => {
    try {
      await handleEvent(
        'vulnerability',
        payload.vulnId,
        payload as unknown as Record<string, unknown>,
        `Vulnerability Management - ${payload.cveId || payload.vulnId}`,
        'system',
      );
    } catch (err) {
      console.error('[RaciBridge] Failed to handle vulnerability.created:', err);
    }
  });

  eventBus.on('threat.detected', async (payload) => {
    try {
      await handleEvent(
        'threat',
        payload.threatId,
        payload as unknown as Record<string, unknown>,
        `Threat Hunting - ${payload.threatId}`,
        'system',
      );
    } catch (err) {
      console.error('[RaciBridge] Failed to handle threat.detected:', err);
    }
  });

  console.log('[RaciBridge] Event bridge initialized with AI collaboration');
}
