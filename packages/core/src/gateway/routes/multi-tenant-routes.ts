import { TenantManager } from '../../multi-tenant/tenant-manager.js';
import type { JsonStore } from '../../storage/json-store.js';
import type { RouterDeps } from '../router.js';


const logger = {
  info: (...args: any[]) => console.log('[MultiTenant]', ...args),
  error: (...args: any[]) => console.error('[MultiTenant]', ...args),
};

const SHARE_RULES_KEY = 'multi-tenant/share-rules.json';

export function registerMultiTenantRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  deps: RouterDeps
): void {
  const store: any = (deps as any).jsonStore ?? (deps as any).store;
  const manager = new TenantManager(store);

  handlers.set('tenant.create', async (params) => {
    const tenant = await manager.createTenant({
      name: params.name as string,
      displayName: params.displayName as string,
      tier: params.tier as 'free' | 'professional' | 'enterprise' | 'mssp',
      domain: params.domain as string,
      adminEmail: params.adminEmail as string,
      contactName: params.contactName as string,
      settings: params.settings as any,
      quotas: params.quotas as any,
      metadata: params.metadata as Record<string, unknown> | undefined,
    });
    logger.info(`Tenant created: ${tenant.id} (${tenant.name})`);
    return tenant;
  });

  handlers.set('tenant.get', async (params) => {
    const tenantId = params.tenantId as string;
    return manager.getTenant(tenantId);
  });

  handlers.set('tenant.list', async (params) => {
    return manager.listTenants({
      status: params.status as any,
      tier: params.tier as any,
    });
  });

  handlers.set('tenant.update', async (params) => {
    const tenantId = params.tenantId as string;
    const updates = params.updates as any;
    return manager.updateTenant(tenantId, updates ?? {});
  });

  handlers.set('tenant.suspend', async (params) => {
    const tenantId = params.tenantId as string;
    const reason = (params.reason as string) || '';
    return manager.suspendTenant(tenantId, reason);
  });

  handlers.set('tenant.reactivate', async (params) => {
    const tenantId = params.tenantId as string;
    return manager.reactivateTenant(tenantId);
  });

  handlers.set('tenant.delete', async (params) => {
    const tenantId = params.tenantId as string;
    const success = await manager.deleteTenant(tenantId);
    return { success };
  });

  handlers.set('tenant.usage.check', async (params) => {
    const tenantId = params.tenantId as string;
    const resource = params.resource as 'apiCalls' | 'storage' | 'llmCalls' | 'scans';
    return manager.checkQuota(tenantId, resource);
  });

  handlers.set('tenant.usage.increment', async (params) => {
    const tenantId = params.tenantId as string;
    const resource = params.resource as 'apiCalls' | 'storage' | 'llmCalls' | 'scans';
    const amount = typeof params.amount === 'number' ? params.amount : 1;
    await manager.incrementUsage(tenantId, resource, amount);
    return { success: true };
  });

  handlers.set('tenant.usage.reset', async (params) => {
    const tenantId = params.tenantId as string;
    await manager.resetDailyUsage(tenantId);
    return { success: true };
  });

  handlers.set('tenant.usage.reset-all', async () => {
    const resetCount = await manager.resetAllDailyUsage();
    logger.info(`Daily usage reset for ${resetCount} tenants`);
    return { resetCount };
  });

  handlers.set('tenant.usage.report', async (params) => {
    const tenantId = params.tenantId as string;
    return manager.getUsageReport(tenantId);
  });

  handlers.set('tenant.data.get', async (params) => {
    const tenantId = params.tenantId as string;
    const key = params.key as string;
    return manager.getTenantData(tenantId, key);
  });

  handlers.set('tenant.data.set', async (params) => {
    const tenantId = params.tenantId as string;
    const key = params.key as string;
    const value = params.value;
    await manager.setTenantData(tenantId, key, value);
    return { success: true };
  });

  handlers.set('tenant.user.add', async (params) => {
    const tenantId = params.tenantId as string;
    const user = await manager.addUser(tenantId, {
      email: params.email as string,
      name: params.name as string,
      role: params.role as string,
      permissions: params.permissions as string[] | undefined,
      status: params.status as 'active' | 'disabled' | 'invited' | undefined,
    });
    return user;
  });

  handlers.set('tenant.user.get', async (params) => {
    const userId = params.userId as string;
    return manager.getUser(userId);
  });

  handlers.set('tenant.user.list', async (params) => {
    const tenantId = params.tenantId as string;
    return manager.listUsers(tenantId);
  });

  handlers.set('tenant.user.remove', async (params) => {
    const userId = params.userId as string;
    const success = await manager.removeUser(userId);
    return { success };
  });

  handlers.set('tenant.intel.share-rule.create', async (params) => {
    const rule = manager.createShareRule({
      sourceTenantId: params.sourceTenantId as string,
      targetTenantId: params.targetTenantId as string,
      dataType: params.dataType as 'ioc' | 'ttp' | 'vulnerability' | 'threat_actor',
      shareMode: params.shareMode as 'anonymized' | 'hashed' | 'full',
      autoShare: typeof params.autoShare === 'boolean' ? params.autoShare : false,
    });
    const existing = (await store.get(SHARE_RULES_KEY) as any[]) ?? [];
    existing.push(rule);
    await store.set(SHARE_RULES_KEY, existing);
    logger.info(`Share rule created: ${rule.id}`);
    return rule;
  });

  handlers.set('tenant.intel.share-rule.list', async (params) => {
    const tenantId = params.tenantId as string;
    return manager.listShareRules(tenantId);
  });

  handlers.set('tenant.intel.share-rule.remove', async (params) => {
    const ruleId = params.ruleId as string;
    const success = await manager.removeShareRule(ruleId);
    return { success };
  });

  handlers.set('tenant.intel.share', async (params) => {
    const sourceTenantId = params.sourceTenantId as string;
    const data = params.data as { type: 'ioc' | 'ttp' | 'vulnerability' | 'threat_actor'; payload: Record<string, unknown> };
    return manager.shareIntelligence(sourceTenantId, data);
  });
}