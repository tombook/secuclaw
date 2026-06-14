/**
 * Layer 1: 套餐驱动（Plan-Driven）
 *
 * 决定用户能"看到"哪些模块 + 哪些能力 + 配额
 * 来源：商业模式 + 销售策略
 */
import type { ModuleId, CapabilityId, PlanTier } from './types.js';

export interface PlanDefinition {
  code: PlanTier;
  name: string;
  description: string;
  price: { monthly: number; currency: string };
  // 模块可见性（'*' 表示全部）
  modules: ModuleId[] | '*';
  // 能力可见性
  capabilities: CapabilityId[] | '*';
  // 配额
  limits: {
    members: number;                   // 团队成员
    assets: number;                    // 资产
    apiCallsPerDay: number;            // 每日 API
    storageGb: number;                 // 存储
    retentionDays: number;             // 数据保留
    raciTasksPerMonth: number;         // RACI 任务
    evolutionSkills: number;           // 自动化技能
    customRoles: number;               // 自定义角色数
  };
  // 高级特性
  features: {
    multiTenant: boolean;
    sso: boolean;
    auditLog: boolean;
    customBranding: boolean;
    apiAccess: boolean;
    prioritySupport: 'community' | 'email' | '24x7';
    dedicatedInstance: boolean;
  };
  trialDays: number;
}

const FREE: PlanDefinition = {
  code: 'free',
  name: 'Free',
  description: '试用 + 评估 · 适合个人安全研究人员',
  price: { monthly: 0, currency: 'USD' },
  modules: ['landing', 'auth', 'overview'],
  capabilities: [],
  limits: {
    members: 3, assets: 50, apiCallsPerDay: 1000,
    storageGb: 1, retentionDays: 7,
    raciTasksPerMonth: 20, evolutionSkills: 0,
    customRoles: 0,
  },
  features: {
    multiTenant: false, sso: false, auditLog: false,
    customBranding: false, apiAccess: false,
    prioritySupport: 'community', dedicatedInstance: false,
  },
  trialDays: 0,
};

const STARTER: PlanDefinition = {
  code: 'starter',
  name: 'Starter',
  description: '小型团队起步',
  price: { monthly: 29, currency: 'USD' },
  modules: ['overview', 'commander', 'ciso', 'expert', 'secops',
            'assets', 'incidents', 'vulnerabilities', 'tasks'],
  capabilities: ['cspm', 'dspm'],
  limits: {
    members: 10, assets: 200, apiCallsPerDay: 5000,
    storageGb: 5, retentionDays: 30,
    raciTasksPerMonth: 100, evolutionSkills: 5,
    customRoles: 2,
  },
  features: {
    multiTenant: false, sso: false, auditLog: true,
    customBranding: false, apiAccess: true,
    prioritySupport: 'email', dedicatedInstance: false,
  },
  trialDays: 14,
};

const PROFESSIONAL: PlanDefinition = {
  code: 'professional',
  name: 'Professional',
  description: '中型企业 · 8 角色 + 12 能力',
  price: { monthly: 99, currency: 'USD' },
  modules: '*',  // 全部 8 角色
  capabilities: ['cspm', 'dspm', 'easm', 'rasp', 'itdr', 'soar', 'sigma'],
  limits: {
    members: 50, assets: 1000, apiCallsPerDay: 20000,
    storageGb: 50, retentionDays: 90,
    raciTasksPerMonth: 1000, evolutionSkills: 20,
    customRoles: 10,
  },
  features: {
    multiTenant: false, sso: false, auditLog: true,
    customBranding: false, apiAccess: true,
    prioritySupport: 'email', dedicatedInstance: false,
  },
  trialDays: 14,
};

const ENTERPRISE: PlanDefinition = {
  code: 'enterprise',
  name: 'Enterprise',
  description: '大型企业 · 12 能力 + 多租户 + SSO',
  price: { monthly: 999, currency: 'USD' },
  modules: '*',
  capabilities: '*',  // 全部 12 能力
  limits: {
    members: 500, assets: 10000, apiCallsPerDay: 200000,
    storageGb: 500, retentionDays: 365,
    raciTasksPerMonth: -1, evolutionSkills: 100,  // -1 = 无限
    customRoles: -1,
  },
  features: {
    multiTenant: true, sso: true, auditLog: true,
    customBranding: true, apiAccess: true,
    prioritySupport: '24x7', dedicatedInstance: true,
  },
  trialDays: 30,
};

const MSSP: PlanDefinition = {
  code: 'mssp',
  name: 'MSSP',
  description: '托管安全服务商 · 无限多租户 + 转售',
  price: { monthly: 2999, currency: 'USD' },
  modules: '*',
  capabilities: '*',
  limits: {
    members: -1, assets: -1, apiCallsPerDay: -1,
    storageGb: -1, retentionDays: 730,
    raciTasksPerMonth: -1, evolutionSkills: -1,
    customRoles: -1,
  },
  features: {
    multiTenant: true, sso: true, auditLog: true,
    customBranding: true, apiAccess: true,
    prioritySupport: '24x7', dedicatedInstance: true,
  },
  trialDays: 30,
};

export const PLAN_REGISTRY: Record<PlanTier, PlanDefinition> = {
  free: FREE,
  starter: STARTER,
  professional: PROFESSIONAL,
  enterprise: ENTERPRISE,
  mssp: MSSP,
};

// 套餐升级路径
export const PLAN_UPGRADE_PATH: Record<PlanTier, PlanTier | null> = {
  free: 'starter',
  starter: 'professional',
  professional: 'enterprise',
  enterprise: 'mssp',
  mssp: null,
};

export function getPlan(code: PlanTier): PlanDefinition {
  return PLAN_REGISTRY[code];
}

export function isModuleAllowedByPlan(plan: PlanTier, module: ModuleId): boolean {
  const def = PLAN_REGISTRY[plan];
  if (def.modules === '*') return true;
  return def.modules.includes(module);
}

export function isCapabilityAllowedByPlan(plan: PlanTier, capability: CapabilityId): boolean {
  const def = PLAN_REGISTRY[plan];
  if (def.capabilities === '*') return true;
  return def.capabilities.includes(capability);
}

export function getRecommendedUpgrade(currentPlan: PlanTier, reason: 'module' | 'capability' | 'limit'): PlanTier {
  // 简化：返回上一档
  return PLAN_UPGRADE_PATH[currentPlan] || 'enterprise';
}
