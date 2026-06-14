/**
 * 统一访问控制（Unified Access Control）
 *
 * 整合四层决策：
 *   Layer 1: 套餐   → 商业边界
 *   Layer 2: 角色   → 操作权限
 *   Layer 3: 数据   → 能力激活
 *   Layer 4: 灰度   → 可见性开关
 *
 * 调用方：API 网关中间件 / UI 路由守卫 / 后端服务
 */
import type {
  AccessContext,
  AccessDecision,
  ModuleId,
  CapabilityId,
  ActionType,
  PlanTier,
  RoleId,
} from './types.js';
import {
  PLAN_REGISTRY,
  isModuleAllowedByPlan,
  isCapabilityAllowedByPlan,
  getRecommendedUpgrade,
} from './plan-registry.js';
import { checkRoleAccess, getAccessibleModules, ROLE_REGISTRY } from './role-registry.js';
import { evaluateCapability, activationStore } from './capability-activator.js';
import { evaluateFlag } from './feature-flag-service.js';

// ─── 单点访问决策 ────────────────────────────────────────────
export interface AccessRequest {
  module: ModuleId;
  capability?: CapabilityId;
  action: ActionType;
}

export interface AccessResponse extends AccessDecision {
  effectiveAction: ActionType | null;
  effectivePlan?: PlanTier;
}

/**
 * 统一访问决策函数
 *
 * 返回值：
 * - allowed: true → 允许
 * - allowed: false → 拒绝（reason + hint + upgradedPlan 给出建议）
 * - layer: 哪一层最终拒绝（或通过）
 */
export function checkAccess(ctx: AccessContext, req: AccessRequest): AccessResponse {
  // ─── 0. 套餐状态检查 ─────────────────────────────────────
  if (ctx.planStatus === 'expired' || ctx.planStatus === 'cancelled') {
    // 过期/取消：仅 Free 模块可访问
    if (!isModuleAllowedByPlan('free', req.module)) {
      return {
        allowed: false,
        reason: `subscription ${ctx.planStatus}, only free modules available`,
        layer: 1,
        upgradedPlan: 'starter',
        hint: '订阅已过期，请续费后继续使用',
        effectiveAction: null,
      };
    }
  }

  // ─── Layer 1: 套餐（Plan-Driven）─────────────────────────
  if (!isModuleAllowedByPlan(ctx.plan, req.module)) {
    return {
      allowed: false,
      reason: `plan ${ctx.plan} does not include module ${req.module}`,
      layer: 1,
      upgradedPlan: getRecommendedUpgrade(ctx.plan, 'module'),
      hint: `升级到 ${getRecommendedUpgrade(ctx.plan, 'module')} 解锁 ${req.module}`,
      effectiveAction: null,
    };
  }

  // 能力型请求（如果指定 capability）
  if (req.capability) {
    if (!isCapabilityAllowedByPlan(ctx.plan, req.capability)) {
      return {
        allowed: false,
        reason: `plan ${ctx.plan} does not include capability ${req.capability}`,
        layer: 1,
        upgradedPlan: getRecommendedUpgrade(ctx.plan, 'capability'),
        hint: `升级套餐以使用 ${req.capability} 能力`,
        effectiveAction: null,
      };
    }
  }

  // ─── Layer 4: Feature Flag（先于 Role 评估粒度更粗）──────
  const flagKey = `module.${req.module}`;
  const flagEval = evaluateFlag(flagKey, ctx);
  if (!flagEval.enabled && flagEval.reason !== 'flag not found, default to enabled') {
    return {
      allowed: false,
      reason: `feature flag disabled: ${flagEval.reason}`,
      layer: 4,
      hint: '该功能正在灰度发布中，请稍后再试',
      effectiveAction: null,
    };
  }

  // 能力级别的 flag
  if (req.capability) {
    const capFlag = evaluateFlag(`capability.${req.capability}`, ctx);
    if (!capFlag.enabled && capFlag.reason !== 'flag not found, default to enabled') {
      return {
        allowed: false,
        reason: `capability flag disabled: ${capFlag.reason}`,
        layer: 4,
        effectiveAction: null,
      };
    }
  }

  // ─── Layer 2: 角色（Role-Driven）─────────────────────────
  const roleAccess = checkRoleAccess(ctx.roleIds, req.module, req.action);
  if (!roleAccess.allowed) {
    return {
      allowed: false,
      reason: `role(s) ${ctx.roleIds.join(', ')} lack ${req.action} access to ${req.module}`,
      layer: 2,
      hint: '需要切换到合适的角色（如 commander/admin）',
      effectiveAction: null,
    };
  }

  // ─── Layer 3: 数据驱动（Data-Driven）─────────────────────
  if (req.capability) {
    const capEval = evaluateCapability(req.capability, ctx);
    if (!capEval.active) {
      // 数据不满足，但套餐/角色允许 → 提示"等数据接入"
      return {
        allowed: false,
        reason: `capability ${req.capability} not yet active: ${capEval.matched.length === 0 ? 'no data signals match' : 'data conditions partially met'}`,
        layer: 3,
        hint: `需要满足：${req.capability} 能力的数据条件`,
        effectiveAction: null,
      };
    }
  }

  // ─── 通过 ───────────────────────────────────────────────
  return {
    allowed: true,
    reason: 'all layers passed',
    layer: roleAccess.effective === 'admin' ? 2 : 2,
    effectiveAction: roleAccess.effective,
  };
}

// ─── 批量评估：UI 用于侧栏渲染 ───────────────────────────────
export interface MenuItem {
  module: ModuleId;
  name: string;
  emoji: string;
  group: 'main' | 'role' | 'capability' | 'admin' | 'other';
  writable: boolean;
  hint?: string;
}

export function getAccessibleMenu(ctx: AccessContext): MenuItem[] {
  const modules = getAccessibleModules(ctx.roleIds);
  const menu: MenuItem[] = [];

  // 角色指挥台
  for (const roleId of ctx.roleIds) {
    const def = ROLE_REGISTRY[roleId];
    if (!def) continue;
    if (def.home && modules.includes(def.home) && !menu.find(m => m.module === def.home)) {
      menu.push({
        module: def.home,
        name: def.name,
        emoji: def.emoji,
        group: 'role',
        writable: true,
      });
    }
  }

  // 通用模块
  const commonModules: Array<{ module: ModuleId; name: string; emoji: string }> = [
    { module: 'overview', name: '安全总览', emoji: '📊' },
    { module: 'assets', name: '资产', emoji: '📦' },
    { module: 'incidents', name: '事件', emoji: '🚨' },
    { module: 'vulnerabilities', name: '漏洞', emoji: '🛡️' },
    { module: 'threats', name: '威胁', emoji: '🎯' },
    { module: 'compliance', name: '合规', emoji: '📋' },
    { module: 'tasks', name: '任务', emoji: '📋' },
    { module: 'audit', name: '审计', emoji: '📋' },
    { module: 'evolution', name: '自主进化', emoji: '🧬' },
    { module: 'market', name: '工具市场', emoji: '🛒' },
    { module: 'knowledge', name: '知识库', emoji: '📚' },
    { module: 'monitor', name: '系统监控', emoji: '🖥️' },
  ];

  for (const { module, name, emoji } of commonModules) {
    if (!modules.includes(module)) continue;
    const access = checkAccess(ctx, { module, action: 'read' });
    if (access.allowed) {
      menu.push({
        module, name, emoji,
        group: 'main',
        writable: checkAccess(ctx, { module, action: 'update' }).allowed,
      });
    }
  }

  return menu;
}

// ─── 辅助：构建默认 context（开发用）───────────────────────
export function buildDevContext(overrides: Partial<AccessContext> = {}): AccessContext {
  return {
    userId: 'u-dev-001',
    tenantId: 'tenant-dev',
    roleIds: ['admin', 'commander', 'ciso'],
    plan: 'enterprise',
    planStatus: 'trialing',
    trialEndsAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
    dataSignals: {
      cloudAssets: 142,
      k8sAssets: 12,
      endpoints: 487,
      piiFields: 187,
      behaviorLogVolume: 1_250_000,
      ssoEnabled: true,
      teamSize: 25,
    },
    userCreatedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    ...overrides,
  };
}
