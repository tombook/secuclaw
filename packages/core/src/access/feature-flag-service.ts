/**
 * Layer 4: 原型/灰度（Module/Feature-Flag）
 *
 * 内部 Beta 功能灰度发布 + 模块级 kill switch
 * 多维度：租户 / 用户 / 套餐 / 比例
 */
import { createHash } from 'crypto';
import { randomUUID } from 'crypto';
import type { FeatureFlagRule, AccessContext, PlanTier } from './types.js';

// ─── 持久化（内存；可替换为 Redis/DB）────────────────────────
class FeatureFlagStore {
  private rules: Map<string, FeatureFlagRule> = new Map();

  get(key: string): FeatureFlagRule | null {
    return this.rules.get(key) || null;
  }

  set(rule: FeatureFlagRule): void {
    this.rules.set(rule.flagKey, rule);
  }

  delete(key: string): void {
    this.rules.delete(key);
  }

  list(): FeatureFlagRule[] {
    return Array.from(this.rules.values());
  }
}

export const featureFlagStore = new FeatureFlagStore();

// ─── 默认规则集 ─────────────────────────────────────────────
export function initDefaultFlags(): void {
  const now = Date.now();
  const defaults: FeatureFlagRule[] = [
    {
      flagKey: 'new-soar-v2',
      enabled: true,
      allowedTenants: ['acme-corp', 'beta-inc'],
      allowedPlans: ['enterprise', 'mssp'],
      percentage: 25,
      metadata: { description: '新一代 SOAR 引擎（Playbook V2）' },
      createdAt: now,
      updatedAt: now,
    },
    {
      flagKey: 'ai-context-engine',
      enabled: true,
      allowedPlans: ['professional', 'enterprise', 'mssp'],
      percentage: 50,
      metadata: { description: 'AI 上下文引擎（Phase 4）' },
      createdAt: now,
      updatedAt: now,
    },
    {
      flagKey: 'beta-warroom',
      enabled: true,
      allowedUserIds: ['u-001', 'u-005'],
      metadata: { description: '战情室 Beta 邀请制' },
      createdAt: now,
      updatedAt: now,
    },
    {
      flagKey: 'kill-switch-llm',
      enabled: true,  // 启用 = 开关打开
      metadata: { description: 'LLM 服务 kill switch（关闭后所有 AI 功能降级）' },
      createdAt: now,
      updatedAt: now,
    },
  ];
  defaults.forEach(r => featureFlagStore.set(r));
}

// ─── 评估 Flag ─────────────────────────────────────────────
export interface FlagEvaluation {
  flagKey: string;
  enabled: boolean;
  reason: string;
  matchedRule?: string;
}

export function evaluateFlag(flagKey: string, context: AccessContext): FlagEvaluation {
  const rule = featureFlagStore.get(flagKey);
  if (!rule) {
    return { flagKey, enabled: true, reason: 'flag not found, default to enabled' };
  }

  if (!rule.enabled) {
    return { flagKey, enabled: false, reason: 'flag globally disabled' };
  }

  // 租户白名单
  if (rule.allowedTenants && rule.allowedTenants.length > 0) {
    if (rule.allowedTenants.includes(context.tenantId)) {
      return { flagKey, enabled: true, reason: `tenant ${context.tenantId} in allowlist`, matchedRule: 'tenant' };
    }
  }

  // 用户白名单
  if (rule.allowedUserIds && rule.allowedUserIds.length > 0) {
    if (rule.allowedUserIds.includes(context.userId)) {
      return { flagKey, enabled: true, reason: `user ${context.userId} in allowlist`, matchedRule: 'user' };
    }
  }

  // 套餐白名单
  if (rule.allowedPlans && rule.allowedPlans.length > 0) {
    if (!rule.allowedPlans.includes(context.plan as PlanTier)) {
      return {
        flagKey,
        enabled: false,
        reason: `plan ${context.plan} not in allowlist [${rule.allowedPlans.join(', ')}]`,
        matchedRule: 'plan',
      };
    }
  }

  // 比例灰度（基于 userId 哈希）
  if (typeof rule.percentage === 'number' && rule.percentage < 100) {
    const bucket = computeUserBucket(context.userId, flagKey);
    if (bucket >= rule.percentage) {
      return {
        flagKey,
        enabled: false,
        reason: `user bucket ${bucket} >= threshold ${rule.percentage}%`,
        matchedRule: 'percentage',
      };
    }
  }

  // 没有任何限制规则 → 视为启用
  return { flagKey, enabled: true, reason: 'no restrictions' };
}

/**
 * 用户分桶：基于 userId + flagKey 的稳定哈希
 * 同一用户在同一 flag 下永远落在同一桶
 */
export function computeUserBucket(userId: string, flagKey: string): number {
  const hash = createHash('sha256')
    .update(`${userId}::${flagKey}`)
    .digest();
  // 取前 4 字节作为无符号整数，模 100
  const num = hash.readUInt32BE(0);
  return num % 100;
}

// ─── CRUD 辅助 ──────────────────────────────────────────────
export function createFlag(input: {
  flagKey: string;
  enabled: boolean;
  allowedTenants?: string[];
  allowedUserIds?: string[];
  allowedPlans?: PlanTier[];
  percentage?: number;
  metadata?: Record<string, any>;
}): FeatureFlagRule {
  const now = Date.now();
  const rule: FeatureFlagRule = {
    flagKey: input.flagKey,
    enabled: input.enabled,
    allowedTenants: input.allowedTenants,
    allowedUserIds: input.allowedUserIds,
    allowedPlans: input.allowedPlans,
    percentage: input.percentage,
    metadata: input.metadata,
    createdAt: now,
    updatedAt: now,
  };
  featureFlagStore.set(rule);
  return rule;
}

export function toggleFlag(flagKey: string, enabled: boolean): FeatureFlagRule | null {
  const rule = featureFlagStore.get(flagKey);
  if (!rule) return null;
  rule.enabled = enabled;
  rule.updatedAt = Date.now();
  return rule;
}

// 初始化默认 flags
initDefaultFlags();
