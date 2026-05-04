/**
 * SecuClaw Evolution — EvolutionService (单例服务)
 *
 * 整个进化系统的入口单例，封装 EvolutionFacade。
 * 其他模块通过导入此服务与进化系统交互。
 *
 * 使用方式:
 *   import { evolutionService } from './evolution-service';
 *   await evolutionService.init(roleId);
 *   const context = await evolutionService.onUserMessage(msg, role);
 *   await evolutionService.onTurnComplete(response, role);
 */

import { EvolutionFacade } from './facade';
import type { EvolutionConfig, RoleId } from './types';

let _instance: EvolutionService | null = null;

export class EvolutionService {
  private facade: EvolutionFacade | null = null;
  private _initialized = false;
  private _role: RoleId = 'secuclaw-commander';

  /** 获取单例实例 */
  static getInstance(): EvolutionService {
    if (!_instance) {
      _instance = new EvolutionService();
    }
    return _instance;
  }

  // ─── 生命周期 ──────────────────────────────────────────────

  async init(opts?: { roleId?: RoleId; config?: Partial<EvolutionConfig> }): Promise<void> {
    if (this._initialized) return;
    this.facade = new EvolutionFacade(opts?.config);
    await this.facade.init({ roleId: opts?.roleId ?? this._role });
    this._initialized = true;
    console.log('[EvolutionService] Initialized for role:', this._role);
  }

  async destroy(): Promise<void> {
    if (this.facade) {
      await this.facade.destroy();
      this.facade = null;
      this._initialized = false;
    }
  }

  // ─── 每轮调用 ───────────────────────────────────────────────

  /**
   * 用户消息进入时调用
   * 返回注入 LLM 的记忆上下文
   */
  async onUserMessage(msg: string, role?: RoleId): Promise<string> {
    if (!this._initialized) await this.init();
    return this.facade!.onUserMessage(msg, role ?? this._role);
  }

  /**
   * 工具调用结果
   */
  onToolCallResult(toolName: string, args: unknown, result: string): void {
    if (!this._initialized) return;
    this.facade!.onToolCallResult(toolName, args, result);
  }

  /**
   * 轮次完成
   */
  async onTurnComplete(assistantMsg: string, role?: RoleId): Promise<void> {
    if (!this._initialized) await this.init();
    await this.facade!.onTurnComplete(assistantMsg, role ?? this._role);
  }

  // ─── 角色切换 ──────────────────────────────────────────────

  async switchRole(newRole: RoleId): Promise<string> {
    this._role = newRole;
    if (!this._initialized) await this.init();
    return this.facade!.onRoleSwitch(newRole);
  }

  // ─── 手动操作 ──────────────────────────────────────────────

  async addMemory(target: 'memory' | 'user', content: string, role?: RoleId): Promise<void> {
    if (!this._initialized) await this.init();
    await this.facade!.addMemory(target, content, role ?? this._role);
  }

  async readMemory(target: 'memory' | 'user', role?: RoleId): Promise<string> {
    if (!this._initialized) await this.init();
    return this.facade!.readMemory(target, role ?? this._role);
  }

  async createSkill(name: string, content: string, role?: RoleId): Promise<void> {
    if (!this._initialized) await this.init();
    await this.facade!.createSkill(name, content, role ?? this._role);
  }

  async getSkills(role?: RoleId): Promise<ReturnType<EvolutionFacade['getSkills']>> {
    if (!this._initialized) await this.init();
    return this.facade!.getSkills(role ?? this._role);
  }

  // ─── 跨角色事件 ─────────────────────────────────────────────

  async publishBridgeEvent(
    type: import('./types').BridgeEventType,
    summary: string,
    opts?: {
      targetRoles?: RoleId[];
      severity?: 'low' | 'medium' | 'high' | 'critical';
      eventId?: string;
      warRoomId?: string;
    }
  ): Promise<void> {
    if (!this._initialized) await this.init();
    await this.facade!.publishBridgeEvent(type, summary, opts);
  }

  // ─── 配置 ─────────────────────────────────────────────────

  updateConfig(config: EvolutionConfig): void {
    if (!this._initialized) return;
    this.facade!.updateConfig(config);
  }

  getConfig(): Readonly<EvolutionConfig> | null {
    return this.facade?.getConfig() ?? null;
  }

  getStatus() {
    return this.facade?.getStatus() ?? null;
  }

  // ─── HTTP 端点（供后端调用）───────────────────────────────

  httpGetStatus() {
    return this.getStatus();
  }

  async httpAddMemory(req: { target: 'memory' | 'user'; content: string; role?: string }): Promise<{ success: boolean }> {
    await this.addMemory(req.target, req.content, req.role as RoleId);
    return { success: true };
  }

  async httpReadMemory(req: { target: 'memory' | 'user'; role?: string }): Promise<{ content: string }> {
    const content = await this.readMemory(req.target, req.role as RoleId);
    return { content };
  }

  async httpTriggerReview(req: { type: 'memory' | 'skill' | 'combined'; role?: string }): Promise<{ triggered: boolean }> {
    console.log('[EvolutionService] Manual review triggered:', req.type);
    return { triggered: true };
  }

  // ─── 状态 ─────────────────────────────────────────────────

  get initialized(): boolean {
    return this._initialized;
  }

  get currentRole(): RoleId {
    return this._role;
  }

  getFacade(): EvolutionFacade | null {
    return this.facade;
  }
}

// ─── 单例导出 ───────────────────────────────────────────────

export const evolutionService = EvolutionService.getInstance();
