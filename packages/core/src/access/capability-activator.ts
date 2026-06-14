/**
 * Layer 3: 数据驱动（Data-Driven）
 *
 * 监听数据流入 → 智能判断能力激活/暂停
 * 来源：用户实际操作、资产接入、日志量、配置变更
 */
import type {
  CapabilityId,
  CapabilityRequirement,
  ActivationRecord,
  AccessContext,
} from './types.js';
import { randomUUID } from 'crypto';

// ─── 能力需求配置 ────────────────────────────────────────────
export const CAPABILITY_REQUIREMENTS: Record<CapabilityId, CapabilityRequirement> = {
  cspm: {
    capability: 'cspm',
    description: '检测到云资产时自动激活',
    matchAll: false,
    conditions: [
      { signal: 'cloudAssets', operator: '>=', value: 1 },
    ],
  },
  dspm: {
    capability: 'dspm',
    description: '检测到数据库资产时自动激活',
    matchAll: false,
    conditions: [
      { signal: 'endpoints', operator: '>=', value: 3 },
    ],
  },
  easm: {
    capability: 'easm',
    description: '检测到外部域名时自动激活',
    matchAll: false,
    conditions: [
      { signal: 'endpoints', operator: '>=', value: 1 },
    ],
  },
  rasp: {
    capability: 'rasp',
    description: '检测到 K8s 集群或 Web 应用时自动激活',
    matchAll: false,
    conditions: [
      { signal: 'k8sAssets', operator: '>=', value: 1 },
      { signal: 'endpoints', operator: '>=', value: 5 },
    ],
  },
  itdr: {
    capability: 'itdr',
    description: '检测到 SSO 或超过 25 个用户时激活',
    matchAll: false,
    conditions: [
      { signal: 'ssoEnabled', operator: '==', value: true },
      { signal: 'teamSize', operator: '>=', value: 25 },
    ],
  },
  soar: {
    capability: 'soar',
    description: '接入 10+ 事件 / 启用 SOAR 集成时激活',
    matchAll: false,
    conditions: [
      { signal: 'endpoints', operator: '>=', value: 10 },
      { signal: 'behaviorLogVolume', operator: '>=', value: 10000 },
    ],
  },
  ueba: {
    capability: 'ueba',
    description: '行为日志达到 10K 条时激活',
    matchAll: true,
    conditions: [
      { signal: 'behaviorLogVolume', operator: '>=', value: 10000 },
    ],
  },
  sigma: {
    capability: 'sigma',
    description: '启用 Sigma 检测规则时激活',
    matchAll: false,
    conditions: [
      { signal: 'endpoints', operator: '>=', value: 5 },
    ],
  },
  'ai-scm': {
    capability: 'ai-scm',
    description: '团队规模超过 5 人或检测到 AI 工具时激活',
    matchAll: false,
    conditions: [
      { signal: 'teamSize', operator: '>=', value: 5 },
    ],
  },
  'ai-spm': {
    capability: 'ai-spm',
    description: '部署了 AI 模型或使用 AI 工具时激活',
    matchAll: false,
    conditions: [
      { signal: 'teamSize', operator: '>=', value: 10 },
    ],
  },
  privacy: {
    capability: 'privacy',
    description: '检测到 PII 字段时激活',
    matchAll: false,
    conditions: [
      { signal: 'piiFields', operator: '>=', value: 1 },
    ],
  },
  'saas-ops': {
    capability: 'saas-ops',
    description: '租户管理 + 计费核心能力',
    matchAll: true,
    conditions: [
      { signal: 'teamSize', operator: '>=', value: 1 },
    ],
  },
};

// ─── 评估能力是否激活 ──────────────────────────────────────
export function evaluateCapability(
  capability: CapabilityId,
  context: AccessContext
): { active: boolean; matched: string[] } {
  const req = CAPABILITY_REQUIREMENTS[capability];
  if (!req) return { active: false, matched: [] };

  const matched: string[] = [];
  for (const cond of req.conditions) {
    const actual = context.dataSignals[cond.signal];
    let ok = false;
    switch (cond.operator) {
      case '>=': ok = Number(actual) >= Number(cond.value); break;
      case '>': ok = Number(actual) > Number(cond.value); break;
      case '<': ok = Number(actual) < Number(cond.value); break;
      case '<=': ok = Number(actual) <= Number(cond.value); break;
      case '==': ok = actual === cond.value; break;
      case '!=': ok = actual !== cond.value; break;
      case 'truthy': ok = Boolean(actual); break;
      case 'exists': ok = actual !== undefined && actual !== null; break;
    }
    if (ok) {
      matched.push(`${cond.signal} ${cond.operator} ${cond.value} (实际: ${actual})`);
    } else if (req.matchAll) {
      // 必须满足全部条件，任一不满足则返回 false
      return { active: false, matched };
    }
  }

  // matchAll=false：任一满足即可
  // matchAll=true：matched.length === conditions.length
  const active = req.matchAll
    ? matched.length === req.conditions.length
    : matched.length > 0;

  return { active, matched };
}

// ─── 评估所有 12 能力 ──────────────────────────────────────
export function evaluateAllCapabilities(
  context: AccessContext
): Array<{ capability: CapabilityId; active: boolean; reason: string }> {
  const allCapabilities = Object.keys(CAPABILITY_REQUIREMENTS) as CapabilityId[];
  return allCapabilities.map(cap => {
    const { active, matched } = evaluateCapability(cap, context);
    return {
      capability: cap,
      active,
      reason: active
        ? `✓ ${CAPABILITY_REQUIREMENTS[cap].description}（${matched.join(', ')}）`
        : `⚠ ${CAPABILITY_REQUIREMENTS[cap].description}`,
    };
  });
}

// ─── 持久化激活记录（内存 + 可选 Redis/DB）─────────────────
export class CapabilityActivationStore {
  private records: Map<string, ActivationRecord> = new Map();
  // 索引：tenantId+capability
  private tenantIndex: Map<string, Set<string>> = new Map();

  private key(tenantId: string, capability: CapabilityId): string {
    return `${tenantId}::${capability}`;
  }

  get(tenantId: string, capability: CapabilityId): ActivationRecord | null {
    return this.records.get(this.key(tenantId, capability)) || null;
  }

  list(tenantId: string): ActivationRecord[] {
    const ids = this.tenantIndex.get(tenantId);
    if (!ids) return [];
    return Array.from(ids)
      .map(id => this.records.get(id))
      .filter((r): r is ActivationRecord => Boolean(r));
  }

  upsert(record: Omit<ActivationRecord, 'id' | 'createdAt' | 'updatedAt'>): ActivationRecord {
    const now = Date.now();
    const key = this.key(record.tenantId, record.capability);
    const existing = this.records.get(key);
    const id = existing?.id || randomUUID();
    const full: ActivationRecord = {
      ...record,
      id,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    this.records.set(key, full);
    if (!this.tenantIndex.has(record.tenantId)) {
      this.tenantIndex.set(record.tenantId, new Set());
    }
    this.tenantIndex.get(record.tenantId)!.add(key);
    return full;
  }

  /**
   * 增量同步：基于评估结果批量更新
   * 激活条件从 false→true 时触发事件
   */
  sync(tenantId: string, evaluations: Array<{ capability: CapabilityId; active: boolean; reason: string }>): {
    activated: ActivationRecord[];
    suspended: ActivationRecord[];
  } {
    const activated: ActivationRecord[] = [];
    const suspended: ActivationRecord[] = [];
    const now = Date.now();
    const signalSnapshot = JSON.parse(JSON.stringify(evaluations));

    for (const ev of evaluations) {
      const existing = this.get(tenantId, ev.capability);
      if (ev.active && (!existing || existing.status !== 'active')) {
        const rec = this.upsert({
          tenantId,
          capability: ev.capability,
          status: 'active',
          reason: ev.reason,
          signalSnapshot,
          activatedAt: now,
          suspendedAt: null,
        });
        activated.push(rec);
      } else if (!ev.active && existing && existing.status === 'active') {
        const rec = this.upsert({
          tenantId,
          capability: ev.capability,
          status: 'suspended',
          reason: ev.reason,
          signalSnapshot,
          activatedAt: existing.activatedAt,
          suspendedAt: now,
        });
        suspended.push(rec);
      }
    }
    return { activated, suspended };
  }
}

export const activationStore = new CapabilityActivationStore();

/**
 * 收集数据信号的辅助函数
 * 由各业务模块在事件触发时调用，更新租户的数据信号
 */
export function buildDataSignals(input: {
  cloudAssets?: number;
  k8sAssets?: number;
  endpoints?: number;
  piiFields?: number;
  behaviorLogVolume?: number;
  ssoEnabled?: boolean;
  teamSize?: number;
}): AccessContext['dataSignals'] {
  return {
    cloudAssets: input.cloudAssets ?? 0,
    k8sAssets: input.k8sAssets ?? 0,
    endpoints: input.endpoints ?? 0,
    piiFields: input.piiFields ?? 0,
    behaviorLogVolume: input.behaviorLogVolume ?? 0,
    ssoEnabled: input.ssoEnabled ?? false,
    teamSize: input.teamSize ?? 0,
  };
}
