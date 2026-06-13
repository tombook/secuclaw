import { SigmaRuleEngine } from '../../detection/sigma-rule-engine.js';
import type { RouterDeps } from '../router.js';
import type { JsonStore } from '../../storage/json-store.js';

export function registerSigmaRoutes(handlers: Map<string, Function>, deps: RouterDeps): void {
  const store: any = (deps as any).jsonStore ?? (deps as any).store;
  const engine = new SigmaRuleEngine(store);

  handlers.set('sigma.rule.import', async (params: Record<string, unknown>) => {
    const content = params.content as string;
    return await engine.importRule(content);
  });

  handlers.set('sigma.rule.import-bulk', async (params: Record<string, unknown>) => {
    const contents = (params.contents as string[]) || [];
    return await engine.importBulk(contents);
  });

  handlers.set('sigma.rule.list', async (params: Record<string, unknown>) => {
    const filters: any = {};
    if (params.level) filters.level = params.level;
    if (params.status) filters.status = params.status;
    if (params.tag) filters.tag = params.tag;
    return await engine.listRules(filters);
  });

  handlers.set('sigma.rule.get', async (params: Record<string, unknown>) => {
    const ruleId = params.ruleId as string;
    return await engine.getRule(ruleId);
  });

  handlers.set('sigma.rule.update', async (params: Record<string, unknown>) => {
    const ruleId = params.ruleId as string;
    const updates = (params.updates as Record<string, any>) || {};
    return await engine.updateRule(ruleId, updates);
  });

  handlers.set('sigma.rule.delete', async (params: Record<string, unknown>) => {
    const ruleId = params.ruleId as string;
    const success = await engine.deleteRule(ruleId);
    return { success };
  });

  handlers.set('sigma.match', async (params: Record<string, unknown>) => {
    const log = (params.log as Record<string, any>) || {};
    const ruleIds = params.ruleIds as string[] | undefined;
    let rules;
    if (ruleIds && ruleIds.length > 0) {
      const fetched = await Promise.all(ruleIds.map((id) => engine.getRule(id)));
      rules = fetched.filter((r): r is NonNullable<typeof r> => r !== null);
    }
    return await engine.matchLog(log, rules);
  });

  handlers.set('sigma.test', async (params: Record<string, unknown>) => {
    const rule = params.rule as any;
    const testLogs = (params.testLogs as Record<string, any>[]) || [];
    return await engine.testRule(rule, testLogs);
  });

  handlers.set('sigma.convert', async (params: Record<string, unknown>) => {
    const rule = params.rule as any;
    const target = params.target as any;
    const query = engine.convertRule(rule, target);
    return { query };
  });

  handlers.set('sigma.convert-all', async (params: Record<string, unknown>) => {
    const target = params.target as any;
    const filters: any = {};
    if (params.level) filters.level = params.level;
    return await engine.convertAll(target, filters);
  });

  handlers.set('sigma.stats', async () => {
    return await engine.getStats();
  });
}