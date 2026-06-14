/**
 * 访问控制 API 路由
 *
 * 命名空间：access.*
 * 调用方式：POST /api/v1/access.<method>  body: {...params}
 *
 * 主要接口：
 * - access.menu.get            - 获取当前用户可见菜单
 * - access.check               - 单点访问决策
 * - access.capabilities.list   - 列出所有能力及激活状态
 * - access.signals.sync        - 触发数据信号同步（重新评估能力）
 * - access.activations.list    - 列出当前租户的能力激活记录
 * - access.flags.list          - 列出所有 Feature Flags
 * - access.flags.create        - 创建/更新 Flag
 * - access.flags.toggle        - 启用/禁用 Flag
 */
import type { Router } from '../router.js';
import {
  checkAccess,
  getAccessibleMenu,
  buildDevContext,
  evaluateAllCapabilities,
  activationStore,
  featureFlagStore,
  createFlag,
  toggleFlag,
  CAPABILITY_REQUIREMENTS,
  type AccessContext,
  type AccessRequest,
  type PlanTier,
  type RoleId,
} from '../../access/index.js';

export function registerAccessRoutes(router: Router): void {
  /**
   * 从 params 构建 AccessContext
   * 真实场景：从 JWT token + DB 解析
   */
  function buildContext(p: Record<string, unknown>): AccessContext {
    if (p.context) return p.context as AccessContext;
    return buildDevContext({
      userId: (p.userId as string) || 'u-dev-001',
      tenantId: (p.tenantId as string) || 'tenant-dev',
      plan: ((p.plan as PlanTier) || 'enterprise'),
      roleIds: ((p.roles as string) || 'admin,commander').split(',') as RoleId[],
    });
  }

  // ─── access.menu.get ──────────────────────────────────────
  router.registerHandler('access.menu.get', async (p: Record<string, unknown>) => {
    const ctx = buildContext(p);
    const menu = getAccessibleMenu(ctx);
    return { ok: true, menu, count: menu.length };
  });

  // ─── access.check ──────────────────────────────────────────
  router.registerHandler('access.check', async (p: Record<string, unknown>) => {
    const ctx = buildContext(p);
    const { module, capability, action } = p;
    if (!module || !action) {
      throw new Error('module and action required');
    }
    return checkAccess(ctx, { module, capability, action } as AccessRequest);
  });

  // ─── access.capabilities.list ─────────────────────────────
  router.registerHandler('access.capabilities.list', async (p: Record<string, unknown>) => {
    const ctx = buildContext(p);
    const evals = evaluateAllCapabilities(ctx);
    const records = activationStore.list(ctx.tenantId);
    return {
      ok: true,
      capabilities: evals,
      records,
      requirements: CAPABILITY_REQUIREMENTS,
    };
  });

  // ─── access.signals.sync ──────────────────────────────────
  router.registerHandler('access.signals.sync', async (p: Record<string, unknown>) => {
    const ctx = buildContext(p);
    // 支持从客户端覆盖 dataSignals
    if (p.dataSignals) {
      ctx.dataSignals = { ...ctx.dataSignals, ...(p.dataSignals as any) };
    }
    const evals = evaluateAllCapabilities(ctx);
    const result = activationStore.sync(ctx.tenantId, evals);
    return {
      ok: true,
      activated: result.activated.length,
      suspended: result.suspended.length,
      activatedCapabilities: result.activated.map(r => r.capability),
      suspendedCapabilities: result.suspended.map(r => r.capability),
    };
  });

  // ─── access.activations.list ──────────────────────────────
  router.registerHandler('access.activations.list', async (p: Record<string, unknown>) => {
    const ctx = buildContext(p);
    const records = activationStore.list(ctx.tenantId);
    return { ok: true, count: records.length, records };
  });

  // ─── access.flags.list ────────────────────────────────────
  router.registerHandler('access.flags.list', async () => {
    return { ok: true, flags: featureFlagStore.list() };
  });

  // ─── access.flags.create ──────────────────────────────────
  router.registerHandler('access.flags.create', async (p: Record<string, unknown>) => {
    const { flagKey, enabled, allowedTenants, allowedUserIds, allowedPlans, percentage, metadata } = p;
    if (!flagKey) throw new Error('flagKey required');
    return createFlag({
      flagKey: flagKey as string,
      enabled: enabled as boolean,
      allowedTenants: allowedTenants as string[] | undefined,
      allowedUserIds: allowedUserIds as string[] | undefined,
      allowedPlans: allowedPlans as PlanTier[] | undefined,
      percentage: percentage as number | undefined,
      metadata: metadata as Record<string, any> | undefined,
    });
  });

  // ─── access.flags.toggle ──────────────────────────────────
  router.registerHandler('access.flags.toggle', async (p: Record<string, unknown>) => {
    const { flagKey, enabled } = p;
    if (!flagKey) throw new Error('flagKey required');
    const rule = toggleFlag(flagKey as string, Boolean(enabled));
    if (!rule) throw new Error(`flag ${flagKey} not found`);
    return rule;
  });
}
