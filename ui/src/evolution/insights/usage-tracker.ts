/**
 * SecuClaw Evolution — Usage Tracker
 *
 * 对标 Hermes insights.py 的 token/cost 追踪逻辑
 * + Hermes usage_pricing.py 的定价计算
 *
 * 职责:
 * 1. 记录每个 session 的 token 消耗
 * 2. 按角色/工具/技能统计使用情况
 * 3. 估算 USD 成本
 * 4. 持久化到 IndexedDB
 */

import { getEvolutionDB, STORES } from '../db';
import type { RoleId } from '../../config/role-tool-config';
import type { InsightsReport, RoleInsights } from '../types';

// ─── 定价表（简化版，对标 Hermes usage_pricing.py）────────────

interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
  cacheReadPerMillion: number;
  cacheWritePerMillion: number;
}

const MODEL_PRICING: Record<string, ModelPricing> = {
  'gpt-4o': { inputPerMillion: 2.5, outputPerMillion: 10, cacheReadPerMillion: 1.25, cacheWritePerMillion: 3.5 },
  'gpt-4o-mini': { inputPerMillion: 0.15, outputPerMillion: 0.6, cacheReadPerMillion: 0.075, cacheWritePerMillion: 0.3 },
  'gpt-4-turbo': { inputPerMillion: 10, outputPerMillion: 30, cacheReadPerMillion: 3.5, cacheWritePerMillion: 10 },
  'claude-3-5-sonnet': { inputPerMillion: 3, outputPerMillion: 15, cacheReadPerMillion: 0.3, cacheWritePerMillion: 3 },
  'claude-3-opus': { inputPerMillion: 15, outputPerMillion: 75, cacheReadPerMillion: 1.5, cacheWritePerMillion: 15 },
  'glm-4': { inputPerMillion: 0.5, outputPerMillion: 1, cacheReadPerMillion: 0.1, cacheWritePerMillion: 0.5 },
  'glm-4-flash': { inputPerMillion: 0.1, outputPerMillion: 0.1, cacheReadPerMillion: 0.01, cacheWritePerMillion: 0.1 },
  'default': { inputPerMillion: 1, outputPerMillion: 2, cacheReadPerMillion: 0.1, cacheWritePerMillion: 0.5 },
};

// ─── Usage Record ─────────────────────────────────────────────

export interface UsageRecord {
  id?: number;
  role: RoleId;
  date: string;           // YYYY-MM-DD
  timestamp: number;

  // Token counts
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;

  // Counts
  turnCount: number;
  toolCallCount: number;
  messageCount: number;

  // Cost
  estimatedCostUsd: number;

  // Metadata
  model: string;
  sessionId?: string;
}

// ─── Tool Usage Record ───────────────────────────────────────

export interface ToolUsageRecord {
  id?: number;
  role: RoleId;
  date: string;
  timestamp: number;
  toolName: string;
  callCount: number;
  totalTokens: number;
}

// ─── UsageTracker ─────────────────────────────────────────────

export class UsageTracker {
  private config: { trackingDays: number };

  constructor(config?: { trackingDays?: number }) {
    this.config = { trackingDays: config?.trackingDays ?? 30 };
  }

  // ─── 记录 API ────────────────────────────────────────────

  /**
   * 记录一次 LLM 调用的 token 消耗
   * 对标 Hermes InsightsEngine._track_session_row()
   */
  async recordUsage(opts: {
    role: RoleId;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
    model?: string;
    sessionId?: string;
  }): Promise<void> {
    const db = getEvolutionDB();
    await db.getDB();

    const today = new Date().toISOString().slice(0, 10);
    const model = opts.model ?? 'default';
    const pricing = this._getPricing(model);

    const estimatedCost = this._estimateCost(
      opts.inputTokens,
      opts.outputTokens,
      opts.cacheReadTokens ?? 0,
      opts.cacheWriteTokens ?? 0,
      pricing
    );

    const record: UsageRecord = {
      role: opts.role,
      date: today,
      timestamp: Date.now(),
      inputTokens: opts.inputTokens,
      outputTokens: opts.outputTokens,
      cacheReadTokens: opts.cacheReadTokens ?? 0,
      cacheWriteTokens: opts.cacheWriteTokens ?? 0,
      turnCount: 1,
      toolCallCount: 0,
      messageCount: 1,
      estimatedCostUsd: estimatedCost,
      model,
      sessionId: opts.sessionId,
    };

    await db.put(STORES.EVOLUTION_LOG, record as unknown as Record<string, unknown>);
  }

  /**
   * 记录工具调用
   */
  async recordToolCall(opts: {
    role: RoleId;
    toolName: string;
    tokens?: number;
  }): Promise<void> {
    const db = getEvolutionDB();
    await db.getDB();

    const today = new Date().toISOString().slice(0, 10);
    const record: ToolUsageRecord = {
      role: opts.role,
      date: today,
      timestamp: Date.now(),
      toolName: opts.toolName,
      callCount: 1,
      totalTokens: opts.tokens ?? 0,
    };

    // 尝试更新今天的记录
    const existing = await db.getByIndex<ToolUsageRecord>(STORES.EVOLUTION_LOG, 'role', opts.role);

    await db.put(STORES.EVOLUTION_LOG, record as unknown as Record<string, unknown>);
  }

  /**
   * 记录一轮对话
   */
  async recordTurn(opts: {
    role: RoleId;
    messageCount: number;
    toolCallCount: number;
  }): Promise<void> {
    const db = getEvolutionDB();
    const today = new Date().toISOString().slice(0, 10);

    // 简化：直接写入一条 turn 记录
    await db.put(STORES.EVOLUTION_LOG, {
      type: 'turn_recorded',
      role: opts.role,
      date: today,
      timestamp: Date.now(),
      messageCount: opts.messageCount,
      toolCallCount: opts.toolCallCount,
    } as unknown as Record<string, unknown>);
  }

  // ─── 统计 API ────────────────────────────────────────────

  /**
   * 获取使用统计报告
   * 对标 Hermes InsightsEngine.get_session_insights()
   */
  async getReport(opts?: { days?: number; roleId?: RoleId }): Promise<InsightsReport> {
    const days = opts?.days ?? this.config.trackingDays;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const db = getEvolutionDB();
    await db.getDB();

    // 从 evolution-log 中提取 usage 记录
    const allRecords = await db.getAll<Record<string, unknown>>(STORES.EVOLUTION_LOG);
    const usageRecords = allRecords.filter(
      (r) => r.role && r.timestamp && r.timestamp > cutoff && (r as UsageRecord).inputTokens !== undefined
    ) as UsageRecord[];

    // 按角色分组
    const byRole: Partial<Record<RoleId, RoleInsights>> = {};
    const allRoleIds: RoleId[] = ['security-expert', 'privacy-officer', 'security-architect', 'business-security-officer', 'secuclaw-commander', 'ciso', 'security-ops', 'supply-chain-security'];

    for (const roleId of allRoleIds) {
      if (opts?.roleId && opts.roleId !== roleId) continue;

      const roleRecords = usageRecords.filter((r) => r.role === roleId);
      if (roleRecords.length === 0) continue;

      const totalInput = roleRecords.reduce((s, r) => s + r.inputTokens, 0);
      const totalOutput = roleRecords.reduce((s, r) => s + r.outputTokens, 0);
      const totalCost = roleRecords.reduce((s, r) => s + r.estimatedCostUsd, 0);
      const totalTurns = roleRecords.reduce((s, r) => s + r.turnCount, 0);
      const totalToolCalls = roleRecords.reduce((s, r) => s + r.toolCallCount, 0);

      byRole[roleId] = {
        turns: totalTurns,
        toolCalls: totalToolCalls,
        topSkills: [],
        memoriesAdded: 0,
      };
    }

    // 工具统计
    const toolCounts: Record<string, number> = {};
    for (const record of usageRecords) {
      const toolCalls = (record as unknown as { toolCalls?: Array<{ name: string }> }).toolCalls;
      if (toolCalls) {
        for (const tc of toolCalls) {
          toolCounts[tc.name] = (toolCounts[tc.name] ?? 0) + 1;
        }
      }
    }

    const topTools = Object.entries(toolCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const totalInput = usageRecords.reduce((s, r) => s + r.inputTokens, 0);
    const totalOutput = usageRecords.reduce((s, r) => s + r.outputTokens, 0);
    const totalCost = usageRecords.reduce((s, r) => s + r.estimatedCostUsd, 0);
    const totalTurns = usageRecords.reduce((s, r) => s + r.turnCount, 0);
    const totalToolCalls = usageRecords.reduce((s, r) => s + r.toolCallCount, 0);

    const startDate = new Date(cutoff).toISOString().slice(0, 10);
    const endDate = new Date().toISOString().slice(0, 10);

    return {
      period: { start: startDate, end: endDate },
      summary: {
        totalTurns: totalTurns,
        totalToolCalls,
        estimatedTokens: { input: totalInput, output: totalOutput },
        estimatedCost: totalCost,
        skillsCreated: 0,
        memoriesSaved: 0,
        compressionsPerformed: 0,
      },
      byRole,
      topTools,
      evolutionActivity: {
        skillsCreated: 0,
        skillsUpdated: 0,
        memoriesAdded: 0,
        reviewsTriggered: 0,
      },
    };
  }

  /**
   * 按角色获取使用统计
   */
  async getRoleUsage(roleId: RoleId, days = 7): Promise<{
    totalTokens: number;
    totalCost: number;
    turns: number;
    toolCalls: number;
  }> {
    const report = await this.getReport({ days, roleId });
    const roleData = report.byRole[roleId];

    return {
      totalTokens: (report.summary.estimatedTokens.input + report.summary.estimatedTokens.output),
      totalCost: report.summary.estimatedCost,
      turns: roleData?.turns ?? 0,
      toolCalls: roleData?.toolCalls ?? 0,
    };
  }

  // ─── 内部方法 ────────────────────────────────────────────

  private _getPricing(model: string): ModelPricing {
    const lower = model.toLowerCase();
    for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
      if (lower.includes(key.toLowerCase())) {
        return pricing;
      }
    }
    return MODEL_PRICING['default'];
  }

  private _estimateCost(
    inputTokens: number,
    outputTokens: number,
    cacheReadTokens: number,
    cacheWriteTokens: number,
    pricing: ModelPricing
  ): number {
    const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMillion;
    const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillion;
    const cacheReadCost = (cacheReadTokens / 1_000_000) * pricing.cacheReadPerMillion;
    const cacheWriteCost = (cacheWriteTokens / 1_000_000) * pricing.cacheWritePerMillion;

    return inputCost + outputCost + cacheReadCost + cacheWriteCost;
  }
}
