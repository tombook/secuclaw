import { DataAssetDiscovery } from '../../dspm/data-asset-discovery.js';
import { DataAccessAnalyzer } from '../../dspm/data-access-analyzer.js';
import { DataResidencyChecker } from '../../dspm/data-residency-checker.js';
import { DataFlowMonitor } from '../../dspm/data-flow-monitor.js';
import type { RouterDeps } from '../router.js';
import type { JsonStore } from '../../storage/json-store.js';

export function registerDspmRoutes(handlers: Map<string, Function>, deps: RouterDeps): void {
  const store: any = (deps as any).jsonStore ?? (deps as any).store;
  const assets = new DataAssetDiscovery(store);
  const access = new DataAccessAnalyzer(store);
  const residency = new DataResidencyChecker(store);
  const flow = new DataFlowMonitor(store);

  handlers.set('dspm.asset.register', async (p: any) => assets.registerAsset(p.asset));
  handlers.set('dspm.asset.update', async (p: any) => assets.updateAsset(p.assetId, p.updates));
  handlers.set('dspm.asset.get', async (p: any) => assets.getAsset(p.assetId));
  handlers.set('dspm.asset.list', async (p: any) => assets.listAssets({
    type: p.type, classification: p.classification, encryption: p.encryption,
    minRiskScore: p.minRiskScore, region: p.region, piiOnly: p.piiOnly,
    monitored: p.monitored, limit: p.limit,
  }));
  handlers.set('dspm.asset.delete', async (p: any) => assets.deleteAsset(p.assetId));
  handlers.set('dspm.asset.scan-sample', async (p: any) => assets.scanDataSample(p.sample || ''));
  handlers.set('dspm.asset.stats', async () => assets.getStats());

  handlers.set('dspm.access.record', async (p: any) => access.recordEvent(p.event));
  handlers.set('dspm.access.record-batch', async (p: any) => access.recordBatch(p.events || []));
  handlers.set('dspm.access.get', async (p: any) => access.getEvent(p.eventId));
  handlers.set('dspm.access.list', async (p: any) => access.listEvents({
    assetId: p.assetId, subjectId: p.subjectId, action: p.action,
    classification: p.classification, since: p.since, status: p.status, limit: p.limit,
  }));
  handlers.set('dspm.access.detect-anomalies', async (p: any) => access.detectAnomalies(p.event));
  handlers.set('dspm.access.anomalies', async (p: any) => access.getAnomalies({
    assetId: p.assetId, subjectId: p.subjectId, type: p.type, severity: p.severity,
    resolved: p.resolved, since: p.since, limit: p.limit,
  }));
  handlers.set('dspm.access.resolve-anomaly', async (p: any) => access.resolveAnomaly(p.anomalyId, p.resolvedBy || 'system', p.notes || ''));
  handlers.set('dspm.access.pattern.get', async (p: any) => access.getAccessPattern(p.subjectId));
  handlers.set('dspm.access.pattern.list', async () => access.listPatterns());
  handlers.set('dspm.access.stats', async (p: any) => access.getStats(p.since));

  handlers.set('dspm.residency.policy.create', async (p: any) => residency.createPolicy(p.policy));
  handlers.set('dspm.residency.policy.update', async (p: any) => residency.updatePolicy(p.policyId, p.updates));
  handlers.set('dspm.residency.policy.get', async (p: any) => residency.getPolicy(p.policyId));
  handlers.set('dspm.residency.policy.list', async (p: any) => residency.listPolicies({ framework: p.framework, active: p.active }));
  handlers.set('dspm.residency.policy.delete', async (p: any) => residency.deletePolicy(p.policyId));
  handlers.set('dspm.residency.policy.init-defaults', async () => residency.initializeDefaultPolicies());
  handlers.set('dspm.residency.check', async (p: any) => residency.checkAccess(p.params));
  handlers.set('dspm.residency.violations', async (p: any) => residency.listViolations({
    framework: p.framework, severity: p.severity, status: p.status, since: p.since, limit: p.limit,
  }));
  handlers.set('dspm.residency.violation.update-status', async (p: any) => residency.updateViolationStatus(p.violationId, p.status, p.resolvedBy));
  handlers.set('dspm.residency.stats', async () => residency.getStats());

  handlers.set('dspm.flow.register', async (p: any) => flow.registerFlow(p.flow));
  handlers.set('dspm.flow.update', async (p: any) => flow.updateFlow(p.flowId, p.updates));
  handlers.set('dspm.flow.get', async (p: any) => flow.getFlow(p.flowId));
  handlers.set('dspm.flow.list', async (p: any) => flow.listFlows({
    status: p.status, flowType: p.flowType, sourceRegion: p.sourceRegion,
    destinationRegion: p.destinationRegion, approved: p.approved,
    crossRegionOnly: p.crossRegionOnly, unencryptedOnly: p.unencryptedOnly, limit: p.limit,
  }));
  handlers.set('dspm.flow.delete', async (p: any) => flow.deleteFlow(p.flowId));
  handlers.set('dspm.flow.record-event', async (p: any) => flow.recordFlowEvent(p.event));
  handlers.set('dspm.flow.events', async (p: any) => flow.listFlowEvents({
    flowId: p.flowId, status: p.status, since: p.since, limit: p.limit,
  }));
  handlers.set('dspm.flow.anomalies', async (p: any) => flow.listAnomalies({
    flowId: p.flowId, type: p.type, severity: p.severity,
    resolved: p.resolved, since: p.since, limit: p.limit,
  }));
  handlers.set('dspm.flow.resolve-anomaly', async (p: any) => flow.resolveAnomaly(p.anomalyId, p.notes || ''));
  handlers.set('dspm.flow.stats', async () => flow.getStats());
}
