/**
 * SecuClaw Evolution — Insights Engine
 *
 * 对标 Hermes InsightsEngine (agent/insights.py)
 *
 * 职责:
 * 1. 聚合 usage tracker 的数据
 * 2. 生成进化活动报告
 * 3. 提供 top tools / skills / memories 统计
 */

import { UsageTracker, type UsageRecord } from './usage-tracker';
import { getEvolutionDB, STORES } from '../db';
import type { EvolutionLogEntry, InsightsReport, RoleId } from '../types';

// ─── InsightsEngine ───────────────────────────────────────────

export class InsightsEngine {
  private tracker: UsageTracker;
  private config: { trackingDays: number };

  constructor(config?: { trackingDays?: number }) {
    this.config = { trackingDays: config?.trackingDays ?? 30 };
    this.tracker = new UsageTracker(this.config);
  }

  /** 获取 UsageTracker 实例 */
  getTracker(): UsageTracker {
    return this.tracker;
  }

  // ─── 主报告 ─────────────────────────────────────────────

  /**
   * 获取完整的洞察报告
   * 对标 Hermes get_session_insights()
   */
  async getInsights(opts?: { days?: number; roleId?: RoleId }): Promise<InsightsReport> {
    return this.tracker.getReport(opts);
  }

  // ─── 进化活动统计 ────────────────────────────────────

  /**
   * 获取进化活动统计（从 evolution log）
   * 对标 Hermes InsightsEngine._get_evolution_activity()
   */
  async getEvolutionActivity(opts?: { days?: number; roleId?: RoleId }): Promise<InsightsReport['evolutionActivity']> {
    const days = opts?.days ?? this.config.trackingDays;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const db = getEvolutionDB();
    await db.getDB();

    const allLogs = await db.getAll<EvolutionLogEntry>(STORES.EVOLUTION_LOG);
    const relevantLogs = allLogs.filter(
      (log) => log.timestamp > cutoff && (!opts?.roleId || log.role === opts.roleId)
    );

    let skillsCreated = 0;
    let skillsUpdated = 0;
    let memoriesAdded = 0;
    let reviewsTriggered = 0;

    for (const log of relevantLogs) {
      switch (log.type) {
        case 'skill_create':
          skillsCreated++;
          break;
        case 'skill_edit':
        case 'skill_patch':
          skillsUpdated++;
          break;
        case 'memory_add':
          memoriesAdded++;
          break;
        case 'review_triggered':
        case 'nudge_memory':
        case 'nudge_skill':
          reviewsTriggered++;
          break;
      }
    }

    return { skillsCreated, skillsUpdated, memoriesAdded, reviewsTriggered };
  }

  // ─── 工具使用排行 ────────────────────────────────────

  /**
   * 获取工具使用排行
   * 对标 Hermes InsightsEngine._compute_tool_breakdown()
   */
  async getTopTools(opts?: { days?: number; roleId?: RoleId; limit?: number }): Promise<
    Array<{ name: string; count: number; role: RoleId }>
  > {
    const days = opts?.days ?? this.config.trackingDays;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const limit = opts?.limit ?? 10;
    const db = getEvolutionDB();

    const allLogs = await db.getAll<EvolutionLogEntry>(STORES.EVOLUTION_LOG);
    const toolLogs = allLogs.filter(
      (log) =>
        log.timestamp > cutoff &&
        log.type.startsWith('tool_') &&
        (!opts?.roleId || log.role === opts.roleId)
    );

    const counts: Record<string, { count: number; role: RoleId }> = {};
    for (const log of toolLogs) {
      const name = (log.metadata as Record<string, string>)?.toolName ?? 'unknown';
      counts[name] = { count: (counts[name]?.count ?? 0) + 1, role: log.role };
    }

    return Object.entries(counts)
      .map(([name, { count, role }]) => ({ name, count, role }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // ─── 技能使用统计 ────────────────────────────────────

  /**
   * 获取技能使用统计
   * 对标 Hermes InsightsEngine._compute_skill_breakdown()
   */
  async getSkillUsage(opts?: { days?: number }): Promise<
    Array<{ name: string; callCount: number; successCount: number }>
  > {
    // 技能使用需要从 skills store 的 usageCount 字段读取
    const db = getEvolutionDB();
    await db.getDB();
    const allSkills = await db.getByIndex<{ name: string; usageCount: number; successCount: number; role: RoleId }>(STORES.SKILLS, 'role', opts?.roleId as RoleId);

    return (allSkills ?? [])
      .map((s) => ({ name: s.name, callCount: s.usageCount ?? 0, successCount: s.successCount ?? 0 }))
      .filter((s) => s.callCount > 0)
      .sort((a, b) => b.callCount - a.callCount);
  }

  // ─── 记忆统计 ───────────────────────────────────────

  /**
   * 获取记忆统计
   */
  async getMemoryStats(opts?: { days?: number; roleId?: RoleId }): Promise<{
    total: number;
    byCategory: Record<string, number>;
    byRole: Partial<Record<RoleId, number>>;
  }> {
    const db = getEvolutionDB();
    await db.getDB();

    const allMemories = await db.getByIndex<{ role: RoleId; category: string; createdAt: number }>(
      STORES.MEMORIES,
      'role',
      opts?.roleId as RoleId
    );

    const byCategory: Record<string, number> = {};
    const byRole: Partial<Record<RoleId, number>> = {};

    for (const m of allMemories ?? []) {
      byCategory[m.category] = (byCategory[m.category] ?? 0) + 1;
      byRole[m.role] = (byRole[m.role] ?? 0) + 1;
    }

    return { total: allMemories?.length ?? 0, byCategory, byRole };
  }

  // ─── 趋势分析 ───────────────────────────────────────

  /**
   * 获取每日 token 消耗趋势
   */
  async getTokenTrend(opts?: { days?: number; roleId?: RoleId }): Promise<
    Array<{ date: string; input: number; output: number; cost: number }>
  > {
    const days = opts?.days ?? 7;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const db = getEvolutionDB();

    const allLogs = await db.getAll<UsageRecord & { date: string; timestamp: number }>(STORES.EVOLUTION_LOG);
    const usageLogs = allLogs.filter(
      (r) =>
        r.timestamp > cutoff &&
        r.inputTokens !== undefined &&
        (!opts?.roleId || r.role === opts.roleId)
    );

    // 按日期分组
    const byDate: Record<string, { input: number; output: number; cost: number }> = {};
    for (const log of usageLogs) {
      const date = log.date;
      if (!byDate[date]) {
        byDate[date] = { input: 0, output: 0, cost: 0 };
      }
      byDate[date].input += log.inputTokens;
      byDate[date].output += log.outputTokens;
      byDate[date].cost += log.estimatedCostUsd;
    }

    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { input, output, cost }]) => ({ date, input, output, cost }));
  }
}
