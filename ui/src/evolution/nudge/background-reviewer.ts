/**
 * SecuClaw Evolution — Background Reviewer
 * 
 * 对标 Hermes _spawn_background_review (run_agent.py:2860-3000)
 * 
 * 浏览器端实现差异:
 * - 不 fork AIAgent，而是通过 Gateway 发送 isolated 请求
 * - 使用 fetch/WebSocket 发送 review prompt + 对话历史
 * - 结果解析后直接调用 MemoryManager / SkillManager
 * - 使用 Web Worker 或 async 执行，不阻塞主线程
 */

import type { ChatMessage, ReviewType, ReviewResult, RoleId } from '../types';
import { REVIEW_PROMPTS, type ReviewPromptType } from './review-prompts';
import { logEvolution } from '../db';
import type { MemoryManager } from '../memory/memory-manager';

export interface BackgroundReviewerConfig {
  maxIterations: number;
  quietMode: boolean;
  gatewayEndpoint?: string;
}

export class BackgroundReviewer {
  private config: BackgroundReviewerConfig;
  private memoryManager: MemoryManager | null = null;
  private skillManager: import('../skill/skill-manager').SkillManager | null = null;

  constructor(config: BackgroundReviewerConfig) {
    this.config = config;
  }

  /** 注入 MemoryManager 依赖 */
  setMemoryManager(mm: MemoryManager): void {
    this.memoryManager = mm;
  }

  /** 注入 SkillManager 依赖 */
  setSkillManager(sm: import('../skill/skill-manager').SkillManager): void {
    this.skillManager = sm;
  }

  /**
   * 执行后台审查
   * 对标 Hermes _spawn_background_review
   * 
   * @param messages 对话历史快照
   * @param type 审查类型
   * @param opts 可选配置
   */
  async review(
    messages: ChatMessage[],
    type: ReviewType,
    opts?: { roleId?: RoleId; maxIterations?: number }
  ): Promise<ReviewResult> {
    // 1. 选择 review prompt
    const promptKey = type as ReviewPromptType;
    const prompt = REVIEW_PROMPTS[promptKey] || REVIEW_PROMPTS.combined;

    // 2. 构建精简的对话历史（减少 token 消耗）
    const compactHistory = this._compactMessages(messages);

    // 3. 发送到 Gateway 进行 isolated review
    const response = await this._sendToGateway(prompt, compactHistory, opts);

    // 4. 解析工具调用结果
    const actions = this._parseToolCalls(response);

    // 5. 执行工具调用
    for (const action of actions) {
      await this._executeToolCall(action, opts?.roleId);
    }

    // 6. 构建摘要
    const summary = actions.length > 0
      ? actions.map(a => a.message).join(' · ')
      : 'Nothing to save.';

    // 7. 记录进化日志
    if (actions.length > 0) {
      await logEvolution({
        type: 'review_completed',
        role: opts?.roleId || 'security-expert',
        timestamp: Date.now(),
        details: `${type} review: ${actions.length} action(s)`,
        metadata: { actions: actions.map(a => ({ tool: a.tool, action: a.action, success: a.success })) },
      });
    }

    return { type, actions, summary };
  }

  // ─── 内部方法 ──────────────────────────────────────────────

  /**
   * 精简对话历史（对标 Hermes messages_snapshot）
   * 保留关键信息，移除过大的工具输出
   */
  private _compactMessages(messages: ChatMessage[]): ChatMessage[] {
    return messages.map(msg => {
      if (msg.role === 'tool' && typeof msg.content === 'string') {
        // 大于 500 字符的工具输出截断
        if (msg.content.length > 500) {
          return {
            ...msg,
            content: msg.content.slice(0, 500) + '...[truncated]',
          };
        }
      }
      return msg;
    });
  }

  /**
   * 发送 isolated review 请求到 Gateway
   * 
   * 对标 Hermes: 在后台线程中创建 AIAgent fork 并运行
   * 浏览器端: 通过 HTTP API 发送 isolated 请求
   */
  private async _sendToGateway(
    prompt: string,
    history: ChatMessage[],
    opts?: { roleId?: RoleId }
  ): Promise<string> {
    const endpoint = this.config.gatewayEndpoint || '/api/evolution-review';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'evolution-review',
          payload: {
            prompt,
            conversationHistory: history,
            maxIterations: opts?.maxIterations ?? this.config.maxIterations,
            roleId: opts?.roleId,
            tools: ['memory', 'skill_manage'],
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gateway returned ${response.status}`);
      }

      const data = await response.json();
      return data.response || data.content || '';
    } catch (e) {
      // Gateway 不可用时，回退到静默模式
      console.warn('[BackgroundReviewer] Gateway unavailable, skipping review:', e);
      return 'Nothing to save.';
    }
  }

  /**
   * 解析 LLM 响应中的工具调用
   * 
   * 对标 Hermes: 扫描 review_agent 的 _session_messages 中的 tool 角色
   */
  private _parseToolCalls(response: string): ReviewResult['actions'] {
    const actions: ReviewResult['actions'] = [];

    // 尝试从 JSON 格式的响应中提取工具调用
    try {
      // 查找类似 {"name": "memory", "arguments": {...}} 的模式
      const toolCallPattern = /\{[^}]*"name"\s*:\s*"(memory|skill_manage)"[^}]*\}/g;
      let match;
      while ((match = toolCallPattern.exec(response)) !== null) {
        try {
          const parsed = JSON.parse(match[0]);
          if (parsed.name && parsed.arguments) {
            actions.push({
              tool: parsed.name,
              action: parsed.arguments.action || 'unknown',
              args: parsed.arguments,
              success: true,
              message: `${parsed.name}: ${parsed.arguments.action || 'executed'}`,
            });
          }
        } catch {
          // 跳过解析失败的 match
        }
      }
    } catch {
      // 整体解析失败，返回空 actions
    }

    return actions;
  }

  /**
   * 执行工具调用
   * 对标 Hermes: 直接写入共享 memory_store / skills 目录
   */
  private async _executeToolCall(
    action: ReviewResult['actions'][0],
    role?: string
  ): Promise<void> {
    if (!action.success) return;

    try {
      if (action.tool === 'memory' && this.memoryManager) {
        // 调用 MemoryManager 处理
        await this.memoryManager.handleToolCall('memory', action.args);
      }
      // skill_manage 暂由 Phase 2 的 SkillManager 处理
      // if (action.tool === 'skill_manage' && this.skillManager) {
      //   await this.skillManager.handleToolCall('skill_manage', action.args);
      // }
    } catch (e) {
      action.success = false;
      action.message = `Failed: ${String(e)}`;
    }
  }
}
