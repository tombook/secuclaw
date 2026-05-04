/**
 * SecuClaw Evolution — Nudge Tracker
 * 
 * 对标 Hermes nudge 计数器 (run_agent.py:1429-1541, 8771-8779, 11891-11892)
 * 
 * 持久化到 IndexedDB，跨会话保留计数状态。
 * 
 * Hermes 的三个计数器:
 * - _memory_nudge_interval: 每 N 轮用户对话触发 memory review
 * - _skill_nudge_interval: 每 N 轮工具调用触发 skill review
 * - _context_check_interval: 每 N 轮检查是否需要压缩（SecuClaw 扩展）
 */

import { getNudgeState, saveNudgeState } from '../db';
import type { NudgeState, EvolutionConfig } from '../types';

export class NudgeTracker {
  private state: NudgeState;
  private config: EvolutionConfig;

  constructor(config: EvolutionConfig) {
    this.state = {
      id: 'current',
      turnsSinceMemory: 0,
      itersSinceSkill: 0,
      turnsSinceContextCheck: 0,
      lastMemoryReview: 0,
      lastSkillReview: 0,
      lastContextCheck: 0,
    };
    this.config = config;
  }

  /** 从 IndexedDB 加载状态 */
  async load(): Promise<void> {
    try {
      this.state = await getNudgeState();
    } catch (e) {
      console.warn('[NudgeTracker] Failed to load state, using defaults:', e);
    }
  }

  /** 保存状态到 IndexedDB */
  async save(): Promise<void> {
    try {
      await saveNudgeState(this.state);
    } catch (e) {
      console.warn('[NudgeTracker] Failed to save state:', e);
    }
  }

  // ─── 计数（对标 Hermes run_agent.py:8771-8779）────────────

  /** 追踪用户轮次 */
  trackUserTurn(): void {
    this.state.turnsSinceMemory++;
  }

  /** 追踪工具调用迭代 */
  trackToolIter(): void {
    this.state.itersSinceSkill++;
  }

  /** 追踪总轮次（用于 context check） */
  trackTurn(): void {
    this.state.turnsSinceContextCheck++;
  }

  // ─── 检查（对标 Hermes run_agent.py:8775-8779, 11891-11892）──

  /**
   * 检查是否需要 memory review
   * 对标 Hermes:
   *   if (self._memory_nudge_interval > 0
   *       and self._turns_since_memory >= self._memory_nudge_interval):
   *       _should_review_memory = True
   *       self._turns_since_memory = 0
   */
  shouldReviewMemory(): { trigger: boolean; reset: () => void } {
    const interval = this.config.memory.nudgeInterval;
    const trigger = interval > 0 && this.state.turnsSinceMemory >= interval;

    return {
      trigger,
      reset: () => {
        this.state.turnsSinceMemory = 0;
        this.state.lastMemoryReview = Date.now();
      },
    };
  }

  /**
   * 检查是否需要 skill review
   * 对标 Hermes:
   *   if (self._skill_nudge_interval > 0
   *       and self._iters_since_skill >= self._skill_nudge_interval):
   *       _should_review_skills = True
   */
  shouldReviewSkills(): { trigger: boolean; reset: () => void } {
    const interval = this.config.skills.creationNudgeInterval;
    const trigger = interval > 0 && this.state.itersSinceSkill >= interval;

    return {
      trigger,
      reset: () => {
        this.state.itersSinceSkill = 0;
        this.state.lastSkillReview = Date.now();
      },
    };
  }

  /**
   * 检查是否需要上下文检查
   * SecuClaw 扩展（Hermes 在主循环中内联检查）
   */
  shouldCheckContext(): { trigger: boolean; reset: () => void } {
    const interval = 3; // 固定每 3 轮
    const trigger = this.config.context.compressionEnabled
      && this.state.turnsSinceContextCheck >= interval;

    return {
      trigger,
      reset: () => {
        this.state.turnsSinceContextCheck = 0;
        this.state.lastContextCheck = Date.now();
      },
    };
  }

  /** 重置所有计数器（会话重置时调用） */
  reset(): void {
    this.state.turnsSinceMemory = 0;
    this.state.itersSinceSkill = 0;
    this.state.turnsSinceContextCheck = 0;
  }

  /** 获取当前状态（只读副本） */
  getState(): Readonly<NudgeState> {
    return { ...this.state };
  }
}
