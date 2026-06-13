import { CredentialStuffingDetector } from '../../itdr/credential-stuffing-detector.js';
import { MfaAttackDetector } from '../../itdr/mfa-attack-detector.js';
import { LateralMovementDetector } from '../../itdr/lateral-movement-detector.js';
import { IncidentResponder } from '../../itdr/incident-responder.js';
import type { RouterDeps } from '../router.js';
import type { JsonStore } from '../../storage/json-store.js';

export function registerItdrRoutes(handlers: Map<string, Function>, deps: RouterDeps): void {
  const store: any = (deps as any).jsonStore ?? (deps as any).store;
  const cred = new CredentialStuffingDetector(store);
  const mfa = new MfaAttackDetector(store);
  const lateral = new LateralMovementDetector(store);
  const responder = new IncidentResponder(store);

  handlers.set('itdr.credential.record-login', async (p: any) => cred.recordLogin(p.attempt));
  handlers.set('itdr.credential.record-batch', async (p: any) => cred.recordBatch(p.attempts || []));
  handlers.set('itdr.credential.detections', async (p: any) => cred.getDetections({ attackType: p.attackType, severity: p.severity, sourceIp: p.sourceIp, userId: p.userId, since: p.since, resolved: p.resolved, limit: p.limit }));
  handlers.set('itdr.credential.update-detection', async (p: any) => cred.updateDetection(p.detectionId, p.updates));
  handlers.set('itdr.credential.ip-reputation', async (p: any) => cred.getIpReputation(p.ip));
  handlers.set('itdr.credential.ip-list', async (p: any) => cred.listIpReputations({ reputation: p.reputation, minScore: p.minScore, limit: p.limit }));
  handlers.set('itdr.credential.compromised-add', async (p: any) => cred.addCompromisedCredential(p.cred));
  handlers.set('itdr.credential.compromised-check', async (p: any) => cred.checkCompromisedCredentials(p.userId));
  handlers.set('itdr.credential.compromised-list', async (p: any) => cred.listCompromisedCredentials({ severity: p.severity, passwordReset: p.passwordReset, since: p.since, limit: p.limit }));
  handlers.set('itdr.credential.mark-reset', async (p: any) => cred.markPasswordReset(p.credId));
  handlers.set('itdr.credential.stats', async (p: any) => cred.getStats(p.since));

  handlers.set('itdr.mfa.record', async (p: any) => mfa.recordChallenge(p.challenge));
  handlers.set('itdr.mfa.record-batch', async (p: any) => mfa.recordBatch(p.challenges || []));
  handlers.set('itdr.mfa.challenge.get', async (p: any) => mfa.getChallenge(p.challengeId));
  handlers.set('itdr.mfa.challenge.list', async (p: any) => mfa.listChallenges({ userId: p.userId, method: p.method, status: p.status, since: p.since, limit: p.limit }));
  handlers.set('itdr.mfa.detections', async (p: any) => mfa.getDetections({ attackType: p.attackType, severity: p.severity, userId: p.userId, since: p.since, limit: p.limit }));
  handlers.set('itdr.mfa.update-detection', async (p: any) => mfa.updateDetection(p.detectionId, p.updates));
  handlers.set('itdr.mfa.sim-swap-record', async (p: any) => mfa.recordSimSwap(p.indicator));
  handlers.set('itdr.mfa.sim-swap-list', async (p: any) => mfa.listSimSwaps({ userId: p.userId, confirmed: p.confirmed, since: p.since, limit: p.limit }));
  handlers.set('itdr.mfa.sim-swap-confirm', async (p: any) => mfa.confirmSimSwap(p.swapId, p.confirmed));
  handlers.set('itdr.mfa.stats', async (p: any) => mfa.getStats(p.since));

  handlers.set('itdr.lateral.record', async (p: any) => lateral.recordEvent(p.event));
  handlers.set('itdr.lateral.record-batch', async (p: any) => lateral.recordBatch(p.events || []));
  handlers.set('itdr.lateral.event.get', async (p: any) => lateral.getEvent(p.eventId));
  handlers.set('itdr.lateral.event.list', async (p: any) => lateral.listEvents({ userId: p.userId, eventType: p.eventType, sourceHost: p.sourceHost, targetHost: p.targetHost, since: p.since, limit: p.limit }));
  handlers.set('itdr.lateral.detections', async (p: any) => lateral.getDetections({ technique: p.technique, severity: p.severity, userId: p.userId, since: p.since, limit: p.limit }));
  handlers.set('itdr.lateral.update-detection', async (p: any) => lateral.updateDetection(p.detectionId, p.updates));
  handlers.set('itdr.lateral.attack-path.get', async (p: any) => lateral.getAttackPath(p.pathId));
  handlers.set('itdr.lateral.attack-path.list', async (p: any) => lateral.listAttackPaths({ userId: p.userId, since: p.since, limit: p.limit }));
  handlers.set('itdr.lateral.attack-path.record', async (p: any) => lateral.recordAttackPath(p.path));
  handlers.set('itdr.lateral.stats', async (p: any) => lateral.getStats(p.since));

  handlers.set('itdr.responder.policy.create', async (p: any) => responder.createPolicy(p.policy));
  handlers.set('itdr.responder.policy.update', async (p: any) => responder.updatePolicy(p.policyId, p.updates));
  handlers.set('itdr.responder.policy.get', async (p: any) => responder.getPolicy(p.policyId));
  handlers.set('itdr.responder.policy.list', async (p: any) => responder.listPolicies({ active: p.active, triggerType: p.triggerType, severity: p.severity }));
  handlers.set('itdr.responder.policy.delete', async (p: any) => responder.deletePolicy(p.policyId));
  handlers.set('itdr.responder.trigger', async (p: any) => responder.trigger(p));
  handlers.set('itdr.responder.execution.get', async (p: any) => responder.getExecution(p.executionId));
  handlers.set('itdr.responder.execution.list', async (p: any) => responder.listExecutions({ status: p.status, severity: p.severity, userId: p.userId, since: p.since, limit: p.limit }));
  handlers.set('itdr.responder.execution.approve', async (p: any) => responder.approveExecution(p.executionId, p.approver, p.comment || ''));
  handlers.set('itdr.responder.execution.reject', async (p: any) => responder.rejectExecution(p.executionId, p.approver, p.comment || ''));
  handlers.set('itdr.responder.execution.rollback', async (p: any) => responder.rollbackExecution(p.executionId, p.reason || ''));
  handlers.set('itdr.responder.quarantine', async (p: any) => responder.quarantineUser(p.params));
  handlers.set('itdr.responder.release-quarantine', async (p: any) => responder.releaseQuarantine(p.userId, p.releasedBy, p.reason || ''));
  handlers.set('itdr.responder.quarantine-list', async (p: any) => responder.listQuarantinedUsers({ active: p.active, severity: p.severity, since: p.since }));
  handlers.set('itdr.responder.block-ip', async (p: any) => responder.blockIp(p.params));
  handlers.set('itdr.responder.unblock-ip', async (p: any) => responder.unblockIp(p.ip, p.reason || ''));
  handlers.set('itdr.responder.is-blocked', async (p: any) => ({ blocked: await responder.isIpBlocked(p.ip) }));
  handlers.set('itdr.responder.blocked-ips', async (p: any) => responder.listBlockedIps({ active: p.active, severity: p.severity, scope: p.scope, since: p.since }));
  handlers.set('itdr.responder.stats', async () => responder.getStats());
}
