/**
 * SecuClaw Evolution — Memory Provider 抽象基类
 * 
 * 对标 Hermes MemoryProvider (agent/memory_provider.py)
 * 
 * 浏览器端差异:
 * - initialize() 使用 IndexedDB 而非文件系统
 * - 无需 hermes_home, platform 等 Python 特有参数
 * - 保持相同的生命周期钩子接口
 */

import type { ChatMessage } from './types';

export abstract class MemoryProvider {
  /** Provider 标识符 */
  abstract readonly name: string;

  // ─── 核心生命周期（子类必须实现）─────────────────────────

  /** 是否可用（配置检查，不发起网络请求） */
  abstract isAvailable(): boolean;

  /** 初始化（打开 IndexedDB 连接、预热缓存等） */
  abstract initialize(opts: {
    roleId?: string;
    sessionId?: string;
  }): Promise<void>;

  /** 静态系统提示块（注入到 system prompt） */
  systemPromptBlock(): string {
    return '';
  }

  /** 预取相关记忆（每轮开始前调用，返回上下文文本） */
  abstract prefetch(query: string, opts?: { roleId?: string; sessionId?: string }): string;

  /** 排队后台预取（为下一轮预热，默认 no-op） */
  queuePrefetch(query: string, opts?: { roleId?: string }): void {
    // 默认不实现后台预取
  }

  /** 持久化一轮对话 */
  abstract syncTurn(userContent: string, assistantContent: string, opts?: { roleId?: string }): void;

  /** 关闭连接、释放资源 */
  shutdown(): void {
    // 默认 no-op
  }

  // ─── 工具接口（可选）─────────────────────────────────────

  /** 返回此 provider 暴露的工具 schema */
  getToolSchemas(): Array<{ name: string; description: string; parameters: Record<string, unknown> }> {
    return [];
  }

  /** 处理工具调用 */
  handleToolCall(toolName: string, args: Record<string, unknown>): Promise<string> {
    return Promise.resolve(JSON.stringify({ success: false, error: `Provider ${this.name} does not handle tool ${toolName}` }));
  }

  // ─── 可选钩子（子类按需覆盖）─────────────────────────────

  /** 每轮开始时调用 */
  onTurnStart(turnNumber: number, message: string, opts?: Record<string, unknown>): void {
    // 默认 no-op
  }

  /** 会话结束时调用 */
  onSessionEnd(messages: ChatMessage[]): void {
    // 默认 no-op
  }

  /** 上下文压缩前调用（提取即将被丢弃的信息） */
  onPreCompress(messages: ChatMessage[]): string {
    return '';
  }

  /** 内置记忆写入时通知外部 provider */
  onMemoryWrite(action: string, target: string, content: string): void {
    // 默认 no-op
  }

  /** 子代理完成时通知 */
  onDelegation(task: string, result: string, opts?: { childSessionId?: string }): void {
    // 默认 no-op
  }
}
