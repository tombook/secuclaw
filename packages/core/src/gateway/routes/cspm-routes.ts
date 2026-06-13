import { CspmEngine } from '../../cspm/cspm-engine.js';
import type { JsonStore } from '../../storage/json-store.js';
import type { RouterDeps } from '../router.js';

import type {
  CspmResource,
  CspmRule,
  CspmFinding,
  CloudProvider,
  CspmSeverity,
} from '../../cspm/cspm-engine.js';

export function registerCspmRoutes(
  handlers: Map<string, Function>,
  deps: RouterDeps
): void {
  const engine = new CspmEngine(deps.jsonStore as JsonStore);

  handlers.set('cspm.scan', async (params: Record<string, unknown>) => {
    const resources = (params.resources as CspmResource[]) ?? [];
    return engine.scanResources(resources);
  });

  handlers.set('cspm.scan.provider', async (params: Record<string, unknown>) => {
    const provider = params.provider as CloudProvider;
    const resources = (params.resources as CspmResource[]) ?? [];
    return engine.scanProvider(provider, async () => resources);
  });

  handlers.set('cspm.rules.list', async (params: Record<string, unknown>) => {
    const filters: { provider?: CloudProvider; service?: string; severity?: CspmSeverity } = {};
    if (params.provider) filters.provider = params.provider as CloudProvider;
    if (params.service) filters.service = params.service as string;
    if (params.severity) filters.severity = params.severity as CspmSeverity;
    return engine.listRules(filters);
  });

  handlers.set('cspm.rules.register', async (params: Record<string, unknown>) => {
    const rule = params.rule as CspmRule;
    engine.registerRule(rule);
    return { success: true, ruleId: rule.id };
  });

  handlers.set('cspm.rules.remove', async (params: Record<string, unknown>) => {
    const ruleId = params.ruleId as string;
    const success = engine.removeRule(ruleId);
    return { success };
  });

  handlers.set('cspm.scans.latest', async () => {
    return engine.getLatestScan();
  });

  handlers.set('cspm.scans.history', async (params: Record<string, unknown>) => {
    const limit = typeof params.limit === 'number' ? params.limit : 10;
    return engine.getScanHistory(limit);
  });

  handlers.set('cspm.findings.dismiss', async (params: Record<string, unknown>) => {
    const findingId = params.findingId as string;
    const dismissedBy = params.dismissedBy as string;
    const reason = params.reason as string;
    const success = await engine.dismissFinding(findingId, dismissedBy, reason);
    return { success };
  });

  handlers.set('cspm.findings.by-framework', async (params: Record<string, unknown>) => {
    const framework = params.framework as string;
    return engine.getFindingsByFramework(framework);
  });

  handlers.set('cspm.compliance-trend', async (params: Record<string, unknown>) => {
    const limit = typeof params.limit === 'number' ? params.limit : 10;
    return engine.getComplianceTrend(limit);
  });
}