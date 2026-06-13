import { SqlInjectionInterceptor } from '../../rasp/sql-injection-interceptor.js';
import { XssInterceptor } from '../../rasp/xss-interceptor.js';
import { ApiAbuseDetector } from '../../rasp/api-abuse-detector.js';
import type { RouterDeps } from '../router.js';
import type { JsonStore } from '../../storage/json-store.js';

export function registerRaspRoutes(handlers: Map<string, Function>, deps: RouterDeps): void {
  const store: any = (deps as any).jsonStore ?? (deps as any).store;
  const sql = new SqlInjectionInterceptor(store);
  const xss = new XssInterceptor(store);
  const abuse = new ApiAbuseDetector(store);

  handlers.set('rasp.sql.inspect', async (p: any) => {
    return sql.inspect(p.request);
  });
  handlers.set('rasp.sql.inspect-batch', async (p: any) => {
    return sql.inspectBatch(p.requests || []);
  });
  handlers.set('rasp.sql.pattern.add', async (p: any) => {
    return sql.addCustomPattern(p.pattern);
  });
  handlers.set('rasp.sql.pattern.list', async (p: any) => {
    return sql.listPatterns({ attackType: p.attackType, enabled: p.enabled });
  });
  handlers.set('rasp.sql.pattern.remove', async (p: any) => {
    return sql.removePattern(p.patternId);
  });
  handlers.set('rasp.sql.pattern.enable', async (p: any) => {
    return sql.enablePattern(p.patternId);
  });
  handlers.set('rasp.sql.pattern.disable', async (p: any) => {
    return sql.disablePattern(p.patternId);
  });
  handlers.set('rasp.sql.results.recent', async (p: any) => {
    return sql.getRecentResults({ applicationId: p.applicationId, since: p.since, severity: p.severity, limit: p.limit });
  });
  handlers.set('rasp.sql.stats', async (p: any) => {
    return sql.getStats(p.applicationId, p.since);
  });

  handlers.set('rasp.xss.inspect', async (p: any) => {
    return xss.inspect(p.request);
  });
  handlers.set('rasp.xss.inspect-batch', async (p: any) => {
    return xss.inspectBatch(p.requests || []);
  });
  handlers.set('rasp.xss.pattern.add', async (p: any) => {
    return xss.addCustomPattern(p.pattern);
  });
  handlers.set('rasp.xss.pattern.list', async (p: any) => {
    return xss.listPatterns({ attackType: p.attackType, context: p.context, enabled: p.enabled });
  });
  handlers.set('rasp.xss.pattern.remove', async (p: any) => {
    return xss.removePattern(p.patternId);
  });
  handlers.set('rasp.xss.pattern.enable', async (p: any) => {
    return xss.enablePattern(p.patternId);
  });
  handlers.set('rasp.xss.pattern.disable', async (p: any) => {
    return xss.disablePattern(p.patternId);
  });
  handlers.set('rasp.xss.sanitize', async (p: any) => {
    return { sanitized: xss.sanitize(p.value || '', p.context || 'html_body') };
  });
  handlers.set('rasp.xss.results.recent', async (p: any) => {
    return xss.getRecentResults({ applicationId: p.applicationId, since: p.since, severity: p.severity, context: p.context, limit: p.limit });
  });
  handlers.set('rasp.xss.stats', async (p: any) => {
    return xss.getStats(p.applicationId, p.since);
  });

  handlers.set('rasp.abuse.record', async (p: any) => {
    return abuse.recordRequest(p.request);
  });
  handlers.set('rasp.abuse.record-batch', async (p: any) => {
    return abuse.recordBatch(p.requests || []);
  });
  handlers.set('rasp.abuse.detections', async (p: any) => {
    return abuse.getDetections({
      subjectType: p.subjectType, subjectId: p.subjectId, type: p.type,
      severity: p.severity, status: p.status, since: p.since, limit: p.limit,
    });
  });
  handlers.set('rasp.abuse.detection.update-status', async (p: any) => {
    return abuse.updateDetectionStatus(p.detectionId, p.status, p.actionExpires);
  });
  handlers.set('rasp.abuse.profile.get', async (p: any) => {
    return abuse.getBehaviorProfile(p.subjectType, p.subjectId);
  });
  handlers.set('rasp.abuse.profile.list', async (p: any) => {
    return abuse.listBehaviorProfiles({ subjectType: p.subjectType, minSuspiciousScore: p.minSuspiciousScore, limit: p.limit });
  });
  handlers.set('rasp.abuse.rule.add', async (p: any) => {
    return abuse.addCustomRule(p.rule);
  });
  handlers.set('rasp.abuse.rule.list', async (p: any) => {
    return abuse.listRules({ type: p.type, enabled: p.enabled });
  });
  handlers.set('rasp.abuse.rule.remove', async (p: any) => {
    return abuse.removeRule(p.ruleId);
  });
  handlers.set('rasp.abuse.is-blocked', async (p: any) => {
    return { blocked: await abuse.isSubjectBlocked(p.subjectType, p.subjectId) };
  });
  handlers.set('rasp.abuse.whitelist.add', async (p: any) => {
    return abuse.whitelistSubject(p.subjectType, p.subjectId, p.reason || '');
  });
  handlers.set('rasp.abuse.whitelist.remove', async (p: any) => {
    return abuse.removeFromWhitelist(p.subjectType, p.subjectId);
  });
  handlers.set('rasp.abuse.stats', async (p: any) => {
    return abuse.getStats(p.since);
  });
}
