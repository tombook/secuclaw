/**
 * SecuClaw Evolution — 统一门面 (Facade)
 * 
 * 暴露给 SecuClaw 主应用的最小接口。
 * 对标 Hermes 的 AIAgent 中所有进化相关的入口方法。
 * 
 * 使用方式:
 *   const evolution = new EvolutionFacade();
 *   await evolution.init();
 *   const memoryContext = await evolution.onUserMessage(msg, role);
 *   // ... LLM 处理 ...
 *   await evolution.onTurnComplete(response, role);
 */

import { MemoryManager } from './memory/memory-manager';
import { NudgeTracker } from './nudge/nudge-tracker';
import { BackgroundReviewer } from './nudge/background-reviewer';
import { SkillManager } from './skill/skill-manager';
import { RoleBridge } from './bridge/role-bridge';
import { DefaultContextEngine } from './context/context-engine';
import { DEFAULT_EVOLUTION_CONFIG, loadEvolutionConfig, saveEvolutionConfig } from './config';
import { logEvolution } from './db';
import type {
  ChatMessage,
  EvolutionConfig,
  MemoryEntry,
  EvolvedSkill,
  InsightsReport,
  MemoryTarget,
  RoleId,
  EvolutionLogEntry,
  BridgeEvent,
  BridgeEventType,
} from './types';
import type { CompressionResult } from './context/compressor';

export class EvolutionFacade {
  private config: EvolutionConfig;
  private memoryManager: MemoryManager;
  private skillManager: SkillManager;
  private nudgeTracker: NudgeTracker;
  private backgroundReviewer: BackgroundReviewer;
  private roleBridge: RoleBridge;
  private contextEngine: DefaultContextEngine;
  private _initialized = false;
  private _currentRole: RoleId = 'secuclaw-commander';

  constructor(config?: Partial<EvolutionConfig>) {
    const base = loadEvolutionConfig();
    this.config = config ? this._mergeConfig(base, config) : base;

    this.memoryManager = new MemoryManager(this.config.memory);
    this.skillManager = new SkillManager(this.config.skills);
    this.nudgeTracker = new NudgeTracker(this.config);
    this.backgroundReviewer = new BackgroundReviewer({
      maxIterations: this.config.review.maxIterations,
      quietMode: this.config.review.quietMode,
    });
    this.backgroundReviewer.setMemoryManager(this.memoryManager);
    this.backgroundReviewer.setSkillManager(this.skillManager);
    this.roleBridge = new RoleBridge();
    this.contextEngine = new DefaultContextEngine(this.config.context);
  }

  // ─── 生命周期 ──────────────────────────────────────────────

  /** 初始化进化系统（IndexedDB + 加载状态） */
  async init(opts?: { roleId?: RoleId }): Promise<void> {
    if (this._initialized) return;

    await this.memoryManager.initialize(opts);
    await this.nudgeTracker.load();

    if (opts?.roleId) {
      this._currentRole = opts.roleId;
    }

    this._initialized = true;
  }

  /** 销毁进化系统 */
  async destroy(): Promise<void> {
    this.memoryManager.shutdownAll();
    await this.nudgeTracker.save();
    this._initialized = false;
  }

  // ─── 每轮调用（对标 Hermes run_agent.py 主循环）───────────

  /**
   * 用户消息进入时调用
   * 对标 Hermes run_agent.py:8765-8779
   * 
   * 返回: 注入到 LLM 提示中的记忆上下文（带 <memory-context> fence）
   */
  async onUserMessage(msg: string, role: RoleId): Promise<string> {
    if (!this._initialized) return '';

    // 更新当前角色
    if (role !== this._currentRole) {
      await this.onRoleSwitch(role);
    }

    // 追踪轮次
    this.nudgeTracker.trackUserTurn();
    this.nudgeTracker.trackTurn();

    // 生命周期钩子
    this.memoryManager.onTurnStart(this.nudgeTracker.getState().turnsSinceMemory, msg);

    // 预取记忆上下文
    const context = await this.memoryManager.prefetchAll(msg, { roleId: role });

    // 构建 system prompt
    const sysPrompt = this.memoryManager.buildSystemPrompt();

    // 组合上下文（带 fence）
    if (context) {
      return this.memoryManager.buildContextBlock(context);
    }
    if (sysPrompt) {
      return this.memoryManager.buildContextBlock(sysPrompt);
    }
    return '';
  }

  /**
   * 工具调用结果时调用
   * 追踪工具使用，更新 skill nudge 计数器
   * 对标 Hermes run_agent.py:9054-9056
   */
  onToolCallResult(_toolName: string, _args: unknown, _result: string): void {
    this.nudgeTracker.trackToolIter();
  }

  /**
   * 轮次完成后调用
   * 对标 Hermes run_agent.py:11870-11920
   * 
   * 执行:
   * 1. sync memory
   * 2. queue prefetch
   * 3. 检查 nudge → 触发 background review
   */
  async onTurnComplete(assistantMsg: string, role: RoleId): Promise<void> {
    if (!this._initialized) return;

    // 同步记忆
    this.memoryManager.syncAll('', assistantMsg, { roleId: role });

    // 预热下一轮预取
    this.memoryManager.queuePrefetchAll(assistantMsg, { roleId: role });

    // 检查 memory nudge
    const memoryCheck = this.nudgeTracker.shouldReviewMemory();
    const skillCheck = this.nudgeTracker.shouldReviewSkills();

    // 触发后台审查（对标 Hermes _spawn_background_review）
    if (memoryCheck.trigger || skillCheck.trigger) {
      if (memoryCheck.trigger) memoryCheck.reset();
      if (skillCheck.trigger) skillCheck.reset();

      // 异步执行，不阻塞主线程
      const reviewType = memoryCheck.trigger && skillCheck.trigger
        ? 'combined'
        : memoryCheck.trigger ? 'memory' : 'skill';

      // 记录 nudge 触发
      await logEvolution({
        type: memoryCheck.trigger ? 'nudge_memory' : 'nudge_skill',
        role,
        timestamp: Date.now(),
        details: `${reviewType} review triggered after ${this.nudgeTracker.getState().turnsSinceMemory} turns`,
      });

      // 后台执行（非阻塞）
      this._runBackgroundReview(assistantMsg, reviewType, role).catch(e => {
        console.warn('[Evolution] Background review failed:', e);
      });
    }

    // 保存 nudge 状态
    await this.nudgeTracker.save();
  }

  // ─── 角色切换 ──────────────────────────────────────────────

  /**
   * 切换安全角色
   * 重新加载记忆快照
   */
  async onRoleSwitch(newRole: RoleId): Promise<string> {
    this._currentRole = newRole;
    this.nudgeTracker.reset();
    return this.memoryManager.switchRole(newRole);
  }

  // ─── 手动操作 ──────────────────────────────────────────────

  /** 添加记忆条目 */
  async addMemory(target: MemoryTarget, content: string, role?: RoleId): Promise<void> {
    const store = this.memoryManager.getStore();
    const result = await store.add(target, content, role || this._currentRole);
    if (result.success) {
      await logEvolution({
        type: 'memory_add',
        role: role || this._currentRole,
        timestamp: Date.now(),
        details: `Added ${target} entry`,
      });
    }
  }

  /** 读取记忆 */
  async readMemory(target: MemoryTarget, role?: RoleId): Promise<string> {
    const store = this.memoryManager.getStore();
    return store.read(target, role || this._currentRole);
  }

  /** 获取进化日志 */
  async getEvolutionLogs(opts?: { type?: string; roleId?: string; limit?: number }): Promise<EvolutionLogEntry[]> {
    // 由 Phase 4 的 InsightsEngine 实现
    return [];
  }

  /** 更新配置 */
  updateConfig(partial: Partial<EvolutionConfig>): void {
    this.config = this._mergeConfig(this.config, partial);
    saveEvolutionConfig(this.config);
  }

  /** 获取当前配置 */
  getConfig(): Readonly<EvolutionConfig> {
    return this.config;
  }

  /** 获取当前状态统计 */
  getStatus() {
    const nudgeState = this.nudgeTracker.getState();
    return {
      initialized: this._initialized,
      currentRole: this._currentRole,
      nudge: {
        turnsSinceMemory: nudgeState.turnsSinceMemory,
        itersSinceSkill: nudgeState.itersSinceSkill,
        turnsSinceContextCheck: nudgeState.turnsSinceContextCheck,
      },
      config: {
        memoryEnabled: this.config.memory.enabled,
        skillEvolutionEnabled: this.config.skills.evolutionEnabled,
        compressionEnabled: this.config.context.compressionEnabled,
      },
    };
  }

  // ─── Skill Manager 访问 ─────────────────────────────────

  /** 获取 SkillManager 实例 */
  getSkillManager(): SkillManager {
    return this.skillManager;
  }

  /** 创建技能 */
  async createSkill(name: string, content: string, role?: RoleId): Promise<import('./types').SkillResult> {
    const result = await this.skillManager.create({
      name,
      content,
      role: role || this._currentRole,
      description: '',
    });
    return result;
  }

  /** 获取角色的所有技能 */
  async getSkills(role?: RoleId): Promise<EvolvedSkill[]> {
    return this.skillManager.getForRole(role || this._currentRole);
  }

  // ─── Context Engine ─────────────────────────────────────

  /**
   * 检查是否需要上下文压缩
   */
  shouldCompress(messages: ChatMessage[]): { needed: boolean; reason?: string } {
    return this.contextEngine.shouldCompress(messages);
  }

  /**
   * 执行上下文压缩
   * 对标 Hermes context_compressor.compress()
   */
  async compress(messages: ChatMessage[]): Promise<CompressionResult> {
    const result = await this.contextEngine.compress(messages);

    if (result.compressed) {
      await logEvolution({
        type: 'compression',
        role: this._currentRole,
        timestamp: Date.now(),
        details: `Compressed ${result.originalTokens} → ${result.newTokens} tokens (saved ${result.savedTokens})`,
        metadata: {
          originalTokens: result.originalTokens,
          newTokens: result.newTokens,
          savedTokens: result.savedTokens,
        },
      });
    }

    return result;
  }

  /**
   * 更新 token 计数（每次 LLM 响应后调用）
   */
  updateTokenUsage(usage: { prompt_tokens?: number; completion_tokens?: number }): void {
    this.contextEngine.updateFromResponse(usage);
  }

  // ─── RoleBridge 访问 ─────────────────────────────────────

  /** 获取 RoleBridge 实例 */
  getRoleBridge(): RoleBridge {
    return this.roleBridge;
  }

  /** 发布跨角色事件 */
  async publishBridgeEvent(
    type: BridgeEventType,
    summary: string,
    opts?: {
      targetRoles?: RoleId[];
      severity?: 'low' | 'medium' | 'high' | 'critical';
      eventId?: string;
      warRoomId?: string;
    }
  ): Promise<void> {
    const event: BridgeEvent = {
      type,
      sourceRole: this._currentRole,
      targetRoles: opts?.targetRoles ?? [],
      timestamp: Date.now(),
      summary,
      metadata: opts?.severity ? { severity: opts.severity } : undefined,
    };
    if (opts?.eventId) event.metadata = { ...event.metadata, eventId: opts.eventId };
    if (opts?.warRoomId) event.metadata = { ...event.metadata, warRoomId: opts.warRoomId };
    await this.roleBridge.publish(event);
  }

  // ─── 内部方法 ──────────────────────────────────────────────

  private async _runBackgroundReview(
    lastMessage: string,
    type: 'memory' | 'skill' | 'combined',
    role: RoleId,
  ): Promise<void> {
    // 构建最小消息快照（只包含最近一轮）
    const messages: ChatMessage[] = [
      { role: 'user', content: '[Previous conversation context]' },
      { role: 'assistant', content: lastMessage },
    ];

    await this.backgroundReviewer.review(messages, type, { roleId: role });
  }

  private _mergeConfig(base: EvolutionConfig, partial: Partial<EvolutionConfig>): EvolutionConfig {
    return {
      memory: { ...base.memory, ...partial.memory },
      skills: { ...base.skills, ...partial.skills },
      context: { ...base.context, ...partial.context },
      review: { ...base.review, ...partial.review },
      insights: { ...base.insights, ...partial.insights },
    };
  }
}
