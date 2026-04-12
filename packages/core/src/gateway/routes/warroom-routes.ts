import type { RouterDeps } from '../router.js';
import { SessionManager } from '../../raci/session-manager.js';
import type { RoleId, ScenarioType } from '../../raci/types.js';

let sessionManager: SessionManager | null = null;
function getManager(deps: RouterDeps): SessionManager {
  if (!sessionManager) sessionManager = new SessionManager(deps.jsonStore);
  return sessionManager;
}

export function registerWarroomRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  deps: RouterDeps
): void {

  handlers.set('warroom.createSession', async (params) => {
    const mgr = getManager(deps);
    return mgr.createSession({
      title: params.title as string,
      scenario: params.scenario as ScenarioType,
      eventId: params.eventId as string | undefined,
      eventType: params.eventType as 'incident' | 'vulnerability' | 'threat' | undefined,
      createdBy: params.createdBy as string || 'user',
      initialParticipants: params.initialParticipants as Array<{ roleId: RoleId }> | undefined,
    });
  });

  handlers.set('warroom.listSessions', async (params) => {
    const mgr = getManager(deps);
    return mgr.listSessions({
      status: params.status as string | undefined,
      scenario: params.scenario as string | undefined,
    });
  });

  handlers.set('warroom.getSession', async (params) => {
    const { sessionId } = params;
    if (!sessionId) throw new Error('Missing required parameter: sessionId');
    return getManager(deps).getSession(sessionId as string);
  });

  handlers.set('warroom.joinSession', async (params) => {
    const { sessionId, roleId } = params;
    if (!sessionId || !roleId) throw new Error('Missing required parameters: sessionId, roleId');
    return getManager(deps).joinSession(sessionId as string, roleId as RoleId);
  });

  handlers.set('warroom.leaveSession', async (params) => {
    const { sessionId, roleId } = params;
    if (!sessionId || !roleId) throw new Error('Missing required parameters: sessionId, roleId');
    return getManager(deps).leaveSession(sessionId as string, roleId as RoleId);
  });

  handlers.set('warroom.closeSession', async (params) => {
    const { sessionId } = params;
    if (!sessionId) throw new Error('Missing required parameter: sessionId');
    return getManager(deps).closeSession(sessionId as string);
  });

  handlers.set('warroom.getTimeline', async (params) => {
    const { sessionId } = params;
    if (!sessionId) throw new Error('Missing required parameter: sessionId');
    return getManager(deps).getTimeline(sessionId as string);
  });

  handlers.set('warroom.sendMessage', async (params) => {
    const { sessionId, content, sender, senderRole } = params;
    if (!sessionId || !content) throw new Error('Missing required parameters: sessionId, content');
    return getManager(deps).sendMessage(
      sessionId as string,
      content as string,
      (sender as string) || 'user',
      (senderRole as RoleId) || 'security-expert'
    );
  });
}
