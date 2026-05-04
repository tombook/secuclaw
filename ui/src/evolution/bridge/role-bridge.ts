/**
 * SecuClaw Evolution — RoleBridge (跨角色知识桥接)
 *
 * SecuClaw 独有，Hermes 无对应实现
 *
 * 设计目标：
 * 1. 事件总线 — 角色间通过结构化事件传递知识摘要
 * 2. 知识共享策略 — 可配置的跨角色同步规则（RACI 职责映射）
 * 3. 委派路由 — secuclaw-commander 可将任务委派给其他常驻角色
 *
 * 安全原则：
 * - 角色间不共享原始记忆（安全隔离）
 * - 共享经过 LLM 压缩的摘要
 * - 每个角色有独立的 nudge 状态，独立触发进化
 *
 * 对标 Hermes：无（Hermes 只有临时子代理委派，不需要持久化跨角色知识）
 */

import type { BridgeEvent, BridgeEventType, RoleBridgeConfig, SharePolicy } from '../types';
import { getEvolutionDB, STORES, putMemory } from '../db';
import type { EvolutionConfig } from '../types';
import type { MemoryEntry, RoleId } from '../types';

// 默认共享策略（对标 RACI 职责映射）
export const DEFAULT_SHARE_POLICIES: SharePolicy[] = [
  {
    trigger: 'vulnerability_found',
    sourceRole: 'security-expert',
    targetRoles: ['security-ops', 'ciso'],
    transform: 'summarize',
    enabled: true,
  },
  {
    trigger: 'compliance_gap',
    sourceRole: 'privacy-officer',
    targetRoles: ['business-security-officer', 'ciso'],
    transform: 'summarize',
    enabled: true,
  },
  {
    trigger: 'risk_accepted',
    sourceRole: 'ciso',
    targetRoles: ['security-expert', 'security-ops'],
    transform: 'pass_through',
    enabled: true,
  },
  {
    trigger: 'strategy_defined',
    sourceRole: 'secuclaw-commander',
    targetRoles: ['security-expert', 'ciso', 'security-ops'],
    transform: 'pass_through',
    enabled: true,
  },
  {
    trigger: 'incident_detected',
    sourceRole: 'security-ops',
    targetRoles: ['security-expert', 'ciso'],
    transform: 'summarize',
    enabled: true,
  },
  {
    trigger: 'supply_chain_alert',
    sourceRole: 'supply-chain-security',
    targetRoles: ['business-security-officer', 'ciso'],
    transform: 'summarize',
    enabled: true,
  },
  {
    trigger: 'architecture_review',
    sourceRole: 'security-architect',
    targetRoles: ['security-expert', 'ciso'],
    transform: 'pass_through',
    enabled: true,
  },
  {
    trigger: 'business_impact',
    sourceRole: 'business-security-officer',
    targetRoles: ['ciso', 'secuclaw-commander'],
    transform: 'pass_through',
    enabled: true,
  },
  {
    trigger: 'raci_phase_complete',
    sourceRole: 'security-expert',
    targetRoles: ['ciso'],
    transform: 'pass_through',
    enabled: true,
  },
];

// ─── 订阅管理 ─────────────────────────────────────────────────

interface Subscription {
  id: number;
  role: RoleId;
  eventTypes: BridgeEventType[];
  handler: (event: BridgeEvent) => void | Promise<void>;
}

export class RoleBridge {
  private config: RoleBridgeConfig;
  private subscriptions: Subscription[] = [];
  private nextSubId = 1;

  constructor(config?: Partial<RoleBridgeConfig>) {
    this.config = {
      policies: config?.policies ?? [...DEFAULT_SHARE_POLICIES],
      maxEventsPerRole: config?.maxEventsPerRole ?? 100,
      ttlHours: config?.ttlHours ?? 24,
    };
  }

  // ─── 发布事件 ──────────────────────────────────────────────

  /**
   * 发布跨角色事件
   * 根据配置的 SharePolicy 自动分发到目标角色
   */
  async publish(event: Omit<BridgeEvent, 'id'>): Promise<void> {
    const db = getEvolutionDB();
    await db.getDB();

    // 1. 持久化事件
    const persisted: BridgeEvent = { ...event, timestamp: Date.now() };
    await db.put(STORES.EVOLUTION_LOG, {
      type: `bridge_${event.type}` as any,
      role: event.sourceRole,
      timestamp: event.timestamp,
      details: event.summary,
      metadata: {
        eventType: event.type,
        targetRoles: event.targetRoles,
        metadata: event.metadata,
      },
    });

    // 2. 查找匹配的策略
    const matchingPolicies = this.config.policies.filter(
      (p) => p.enabled && p.trigger === event.type && p.sourceRole === event.sourceRole
    );

    for (const policy of matchingPolicies) {
      // 3. 确定目标角色
      const targets = event.targetRoles.length > 0
        ? event.targetRoles.filter((r) => policy.targetRoles.includes(r))
        : policy.targetRoles;

      for (const targetRole of targets) {
        // 4. 写入目标角色的记忆（带 bridge tag）
        const memoryEntry: Partial<MemoryEntry> = {
          target: 'memory',
          role: targetRole,
          category: 'insight',
          content: this._formatBridgeEntry(event),
          tags: ['bridge', `from:${event.sourceRole}`, `event:${event.type}`],
          confidence: 0.7,
          source: 'auto',
          turnCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          lastUsedAt: Date.now(),
        };
        await putMemory(memoryEntry as MemoryEntry);

        // 5. 触发订阅处理器
        await this._dispatchToSubscriptions(targetRole, event.type, event as BridgeEvent);
      }
    }
  }

  // ─── 订阅管理 ──────────────────────────────────────────────

  /**
   * 订阅事件
   * @returns 取消订阅函数
   */
  subscribe(
    role: RoleId,
    eventTypes: BridgeEventType[],
    handler: (event: BridgeEvent) => void | Promise<void>
  ): () => void {
    const sub: Subscription = {
      id: this.nextSubId++,
      role,
      eventTypes,
      handler,
    };
    this.subscriptions.push(sub);

    // 返回取消订阅函数
    return () => {
      const idx = this.subscriptions.findIndex((s) => s.id === sub.id);
      if (idx !== -1) {
        this.subscriptions.splice(idx, 1);
      }
    };
  }

  /** 取消所有订阅 */
  unsubscribeAll(): void {
    this.subscriptions = [];
  }

  // ─── 策略管理 ──────────────────────────────────────────────

  updatePolicies(policies: SharePolicy[]): void {
    this.config.policies = policies;
  }

  getPolicies(): SharePolicy[] {
    return [...this.config.policies];
  }

  /** 启用/禁用某个策略 */
  setPolicyEnabled(trigger: BridgeEventType, sourceRole: RoleId, enabled: boolean): void {
    const policy = this.config.policies.find(
      (p) => p.trigger === trigger && p.sourceRole === sourceRole
    );
    if (policy) {
      policy.enabled = enabled;
    }
  }

  // ─── 历史查询 ──────────────────────────────────────────────

  /**
   * 查询历史事件
   * 目前从 evolution-log store 中过滤 bridge_* 类型事件
   */
  async getEvents(opts?: {
    role?: RoleId;
    eventType?: BridgeEventType;
    since?: number;
    limit?: number;
  }): Promise<BridgeEvent[]> {
    // 暂从 IndexedDB 的 evolution-log 读取
    // 实际实现可能需要单独的 bridge-events store
    return [];
  }

  // ─── RACI 阶段通知 ───────────────────────────────────────

  /**
   * 当某个 RACI 阶段完成时，自动将摘要同步到下一阶段角色
   * 对标 openspec/specs/ai-collaboration-engine 的 RACI 编排
   */
  async notifyRaciPhaseComplete(
    phase: 'R' | 'C' | 'A' | 'Commander' | 'I',
    summary: string,
    warRoomId: string,
    participants: RoleId[]
  ): Promise<void> {
    // RACI 阶段顺序: R → C → A → Commander → I
    const phaseEventMap: Record<string, BridgeEventType> = {
      R: 'vulnerability_found',
      C: 'compliance_gap',
      A: 'risk_accepted',
      Commander: 'strategy_defined',
      I: 'incident_detected',
    };

    const eventType = phaseEventMap[phase];
    if (!eventType) return;

    // 下一阶段的参与者（简化：所有参与者都会收到）
    await this.publish({
      type: 'raci_phase_complete',
      sourceRole: participants[0] || 'secuclaw-commander',
      targetRoles: participants,
      timestamp: Date.now(),
      summary: `[RACI:${phase}] ${summary}`,
      metadata: {
        warRoomId,
        severity: 'medium',
      },
    });
  }

  // ─── 内部方法 ──────────────────────────────────────────────

  private async _dispatchToSubscriptions(
    role: RoleId,
    eventType: BridgeEventType,
    event: BridgeEvent
  ): Promise<void> {
    const subs = this.subscriptions.filter(
      (s) => s.role === role && s.eventTypes.includes(eventType)
    );
    for (const sub of subs) {
      try {
        await Promise.resolve(sub.handler(event));
      } catch (e) {
        console.warn(`[RoleBridge] Subscription handler error:`, e);
      }
    }
  }

  /** 格式化桥接记忆条目 */
  private _formatBridgeEntry(event: BridgeEvent): string {
    const time = new Date(event.timestamp).toLocaleString('zh-CN');
    return [
      `[跨角色通知] ${event.type}`,
      `来源角色: ${event.sourceRole}`,
      event.metadata?.severity ? `严重程度: ${event.metadata.severity}` : '',
      event.metadata?.eventId ? `关联事件: ${event.metadata.eventId}` : '',
      event.metadata?.warRoomId ? `作战室: ${event.metadata.warRoomId}` : '',
      '',
      `内容摘要:`,
      event.summary,
      '',
      `(${time})`,
    ]
      .filter(Boolean)
      .join('\n');
  }
}
