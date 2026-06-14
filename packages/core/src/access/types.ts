/**
 * SecuClaw 四层混合访问控制 · 类型定义
 *
 * Layer 1: 套餐驱动（Plan-Driven）    → 商业能力边界
 * Layer 2: 角色驱动（Role-Driven）    → 操作权限隔离
 * Layer 3: 数据驱动（Data-Driven）    → 能力自动激活
 * Layer 4: 原型/灰度（Module/Flag）   → Beta 与 kill switch
 */

// ─── 通用类型 ──────────────────────────────────────────────────
export type PlanTier = 'free' | 'starter' | 'professional' | 'enterprise' | 'mssp';
export type RoleId =
  | 'commander' | 'ciso' | 'expert' | 'secops'
  | 'architect' | 'privacy' | 'business' | 'supply'
  | 'admin' | 'auditor' | 'developer';
export type CapabilityId =
  // 12 大安全能力
  | 'cspm' | 'dspm' | 'easm' | 'rasp' | 'itdr' | 'soar'
  | 'ueba' | 'sigma' | 'ai-scm' | 'ai-spm' | 'privacy' | 'saas-ops';
export type ModuleId =
  // 核心模块（与 UI 路由对应）
  | 'overview' | 'landing' | 'auth' | 'billing'
  | 'commander' | 'ciso' | 'expert' | 'secops'
  | 'architect' | 'privacy' | 'business' | 'supply'
  | 'assets' | 'incidents' | 'vulnerabilities' | 'threats'
  | 'compliance' | 'tasks' | 'raci' | 'roles' | 'audit'
  | 'evolution' | 'market' | 'knowledge'
  | 'monitor' | 'notifications' | 'team-dynamics' | 'command-palette'
  | 'new-modules' | 'warroom' | 'sso' | 'multi-tenant'
  | 'easm' | 'cspm' | 'dspm' | 'rasp' | 'itdr'
  | 'soar' | 'sigma' | 'ueba' | 'ai-scm' | 'ai-spm' | 'saas-ops'
  // 特殊：通配
  | '*';
export type ActionType = 'read' | 'create' | 'update' | 'delete' | 'execute' | 'admin';

// ─── 上下文（输入）───────────────────────────────────────────
export interface AccessContext {
  userId: string;
  tenantId: string;
  roleIds: RoleId[];                  // 用户拥有的角色（可多个）
  plan: PlanTier;                      // 当前套餐
  planStatus: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'expired';
  trialEndsAt: number | null;
  // 数据信号（由 CapabilityActivator 计算并缓存）
  dataSignals: {
    cloudAssets: number;               // 云资产数
    k8sAssets: number;                 // K8s 集群数
    endpoints: number;                 // 端点数
    piiFields: number;                 // PII 字段数
    behaviorLogVolume: number;         // 行为日志条数
    ssoEnabled: boolean;               // SSO 是否启用
    teamSize: number;                  // 团队成员数
  };
  // 时间窗口（用于灰度比例）
  userCreatedAt: number;
}

// ─── 决策（输出）─────────────────────────────────────────────
export interface AccessDecision {
  allowed: boolean;
  reason: string;                      // 拒绝原因（用于审计/排错）
  layer?: 1 | 2 | 3 | 4;                // 由哪一层判定为 true
  hint?: string;                       // 给用户的可执行建议
  upgradedPlan?: PlanTier;             // 若可解锁，需要的套餐
}

// ─── 能力激活记录 ────────────────────────────────────────────
export interface ActivationRecord {
  id: string;
  capability: CapabilityId;
  tenantId: string;
  status: 'pending' | 'active' | 'suspended';
  reason: string;                      // 触发原因
  signalSnapshot: Record<string, any>;// 触发时的数据快照
  activatedAt: number | null;
  suspendedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

// ─── 灰度规则 ────────────────────────────────────────────────
export interface FeatureFlagRule {
  flagKey: string;
  enabled: boolean;                    // 全局开关
  allowedTenants?: string[];           // 租户白名单
  allowedUserIds?: string[];           // 用户白名单
  allowedPlans?: PlanTier[];           // 套餐白名单
  percentage?: number;                 // 用户比例 0-100
  metadata?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

// ─── 能力需求（用于 Layer 3 数据驱动）─────────────────────────
export interface CapabilityRequirement {
  capability: CapabilityId;
  // 数据条件（任一满足即可激活）
  conditions: Array<{
    signal: keyof AccessContext['dataSignals'];
    operator: '>=' | '>' | '<' | '<=' | '==' | '!=' | 'truthy' | 'exists';
    value: number | boolean | string;
  }>;
  // 是否需要至少满足一个条件
  matchAll?: boolean;
  description: string;
}
