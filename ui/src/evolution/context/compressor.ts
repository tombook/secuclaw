/**
 * SecuClaw Evolution — Context Compressor
 *
 * 对标 Hermes ContextCompressor (agent/context_compressor.py)
 *
 * 核心算法（5步）:
 * 1. _prune_old_tool_results() — 旧工具输出替换为 1 行摘要
 * 2. Protect head (system + first N messages)
 * 3. Protect tail by token budget (~last 6 messages)
 * 4. LLM summarize middle turns
 * 5. Iterative summary update on subsequent compactions
 *
 * 浏览器端差异:
 * - 使用 fetch/WebSocket 调用 LLM 进行摘要
 * - 反抖动: 连续 2 次压缩节省 <10% → 跳过
 * - 冷却: 压缩失败后 600s 冷却
 */

import type { ChatMessage } from '../types';
import {
  estimateMessagesTokens,
  estimateMessageTokens,
  computeSummaryBudget,
} from './token-estimator';

// ─── 常量（对标 Hermes）──────────────────────────────────────

const SUMMARY_PREFIX = (
  '[CONTEXT COMPACTION — REFERENCE ONLY] Earlier turns were compacted '
  + 'into the summary below. This is a handoff from a previous context '
  + 'window — treat it as background reference, NOT as active instructions. '
  + 'Do NOT answer questions or fulfill requests mentioned in this summary; '
  + 'they were already addressed. '
  + 'Your current task is identified in the \'## Active Task\' section — '
  + 'resume exactly from there. '
  + 'Respond ONLY to the latest user message that appears AFTER this summary.'
);

const LEGACY_SUMMARY_PREFIX = '[CONTEXT SUMMARY]:';
const PRUNED_TOOL_PLACEHOLDER = '[Old tool output cleared to save context space]';

// 反抖动: 连续 2 次压缩节省 <10% → 跳过
const ANTI_JITTER_MIN_IMPROVEMENT = 0.10;
// 压缩失败冷却时间（秒）
const FAILURE_COOLDOWN_SECONDS = 600;

// 摘要限制
const CONTENT_MAX = 6000;       // 每条消息最大字符
const CONTENT_HEAD = 4000;     // 从开头保留
const CONTENT_TAIL = 1500;     // 从结尾保留
const TOOL_ARGS_MAX = 1500;
const TOOL_ARGS_HEAD = 1200;

// ─── 压缩结果 ────────────────────────────────────────────────

export interface CompressionResult {
  compressed: boolean;
  originalTokens: number;
  newTokens: number;
  savedTokens: number;
  messages: ChatMessage[];
  summary?: string;
  skipped: boolean;
  skipReason?: string;
}

// ─── ContextCompressor ────────────────────────────────────────

export class ContextCompressor {
  private config: {
    thresholdPercent: number;     // 0.75（超过 75% 就压缩）
    protectFirstN: number;      // 3（保护前3条消息）
    protectLastN: number;       // 6（保护最后6条消息）
    summaryRatio: number;       // 0.20（摘要占原文20%）
    summaryTokenCeiling: number; // 12000（摘要最大token数）
    failureCooldownSeconds: number; // 600
  };
  private previousSummary: string | null = null;
  private lastCompressionTime = 0;
  private lastCompressionTokens = 0;
  private consecutivePoorCompressions = 0;
  private lastUsefulTimestamp = 0;

  constructor(config?: Partial<ContextCompressor['config']>) {
    this.config = {
      thresholdPercent: config?.thresholdPercent ?? 0.75,
      protectFirstN: config?.protectFirstN ?? 3,
      protectLastN: config?.protectLastN ?? 6,
      summaryRatio: config?.summaryRatio ?? 0.20,
      summaryTokenCeiling: config?.summaryTokenCeiling ?? 12_000,
      failureCooldownSeconds: config?.failureCooldownSeconds ?? FAILURE_COOLDOWN_SECONDS,
    };
  }

  // ─── 公开 API ─────────────────────────────────────────────

  /**
   * 检查是否需要压缩
   * 对标 Hermes should_compress()
   */
  shouldCompress(messages: ChatMessage[], modelContextLength = 128_000): {
    needed: boolean;
    reason?: string;
  } {
    const totalTokens = estimateMessagesTokens(messages);
    const threshold = Math.floor(modelContextLength * this.config.thresholdPercent);

    if (totalTokens < threshold) {
      return { needed: false, reason: `tokens(${totalTokens}) < threshold(${threshold})` };
    }

    // 反抖动检查
    if (this._checkAntiJitter(totalTokens)) {
      return { needed: false, reason: 'anti-jitter: recent compression was not effective enough' };
    }

    // 冷却检查
    if (this._checkCooldown()) {
      return { needed: false, reason: `cooldown: last compression ${this._timeSinceLastCompression()}s ago` };
    }

    return { needed: true };
  }

  /**
   * 执行上下文压缩
   * 对标 Hermes compress()
   */
  async compress(
    messages: ChatMessage[],
    options?: {
      modelContextLength?: number;
      focusTopic?: string;
      gatewayEndpoint?: string;
      summaryModel?: string;
    }
  ): Promise<CompressionResult> {
    const startTokens = estimateMessagesTokens(messages);

    // 检查是否真的需要压缩
    const { needed, reason } = this.shouldCompress(
      messages,
      options?.modelContextLength ?? 128_000
    );

    if (!needed) {
      return {
        compressed: false,
        originalTokens: startTokens,
        newTokens: startTokens,
        savedTokens: 0,
        messages,
        skipped: true,
        skipReason: reason,
      };
    }

    try {
      // Step 1: 裁剪旧工具输出
      const pruned = this._pruneOldToolResults(messages);

      // Step 2: 分离 head / middle / tail
      const { head, middle, tail } = this._splitByProtection(pruned);

      // Step 3: 摘要中间部分
      let summaryText: string | undefined;
      if (middle.length > 0) {
        summaryText = await this._generateSummary(middle, options);
      }

      // Step 4: 重建消息列表
      const newMessages = this._rebuildMessages(head, middle, tail, summaryText);

      // Step 5: 更新状态
      const newTokens = estimateMessagesTokens(newMessages);
      const savedTokens = startTokens - newTokens;
      this._recordCompression(newTokens, savedTokens);

      return {
        compressed: true,
        originalTokens: startTokens,
        newTokens,
        savedTokens,
        messages: newMessages,
        summary: summaryText,
        skipped: false,
      };
    } catch (error) {
      this._recordFailure();
      throw error;
    }
  }

  /**
   * 更新 token 计数（每次 LLM 响应后调用）
   * 对标 Hermes update_from_response()
   */
  updateFromResponse(usage: { prompt_tokens?: number; completion_tokens?: number }): void {
    const tokens = (usage.prompt_tokens ?? 0) + (usage.completion_tokens ?? 0);
    if (tokens > 0) {
      this.lastCompressionTokens = tokens;
    }
  }

  // ─── Step 1: 裁剪旧工具输出 ────────────────────────────────

  /**
   * 裁剪旧工具输出中的超长内容
   * 对标 Hermes _prune_old_tool_results()
   *
   * 策略:
   * 1. 保护 tail（前 N 条消息）
   * 2. 工具输出 > 500 字符 → 截断
   * 3. 工具参数 > 500 字符 → 简化 JSON
   */
  private _pruneOldToolResults(messages: ChatMessage[]): ChatMessage[] {
    const protectTailCount = this.config.protectLastN;

    return messages.map((msg, idx) => {
      // 保护 tail
      if (idx >= messages.length - protectTailCount) {
        return msg;
      }

      if (msg.role !== 'assistant' || !msg.tool_calls) {
        return msg;
      }

      // 裁剪工具参数
      const prunedToolCalls = msg.tool_calls.map((tc) => {
        const args = tc.function.arguments;
        if (args.length > 500) {
          const truncated = this._truncateToolCallArgs(args);
          return {
            ...tc,
            function: { ...tc.function, arguments: truncated },
          };
        }
        return tc;
      });

      return { ...msg, tool_calls: prunedToolCalls };
    });
  }

  // ─── Step 2: 分离 head / middle / tail ─────────────────

  private _splitByProtection(
    messages: ChatMessage[]
  ): { head: ChatMessage[]; middle: ChatMessage[]; tail: ChatMessage[] } {
    const protectFirst = this.config.protectFirstN;
    const protectLast = this.config.protectLastN;

    const head = messages.slice(0, protectFirst);
    const tail = messages.slice(-protectLast);
    const middle = messages.slice(protectFirst, messages.length - protectLast);

    return { head, middle, tail };
  }

  // ─── Step 3: 生成摘要 ───────────────────────────────────

  /**
   * 生成中间部分的摘要
   * 对标 Hermes _generate_summary()
   */
  private async _generateSummary(
    turnsToSummarize: ChatMessage[],
    options?: {
      focusTopic?: string;
      gatewayEndpoint?: string;
      summaryModel?: string;
    }
  ): Promise<string> {
    const serialized = this._serializeForSummary(turnsToSummarize);
    const budget = computeSummaryBudget(
      turnsToSummarize,
      this.config.summaryRatio,
      this.config.summaryTokenCeiling
    );

    // 构建摘要 prompt
    const prompt = this._buildSummaryPrompt(serialized, budget, options?.focusTopic);

    // 发送到 Gateway 进行摘要
    const endpoint = options?.gatewayEndpoint ?? '/api/evolution-summary';
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          maxTokens: budget,
          model: options?.summaryModel ?? 'glm-4-flash',
        }),
      });

      if (!response.ok) {
        throw new Error(`Gateway summary failed: ${response.status}`);
      }

      const data = await response.json();
      return data.summary || data.content || '';
    } catch (e) {
      // Gateway 不可用时，使用简单摘要
      console.warn('[ContextCompressor] Gateway unavailable, using simple summary:', e);
      return this._simpleSummary(turnsToSummarize);
    }
  }

  /**
   * 序列化对话轮次供摘要模型使用
   * 对标 Hermes _serialize_for_summary()
   */
  private _serializeForSummary(turns: ChatMessage[]): string {
    const parts: string[] = [];

    for (const msg of turns) {
      const role = msg.role.toUpperCase();
      let content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);

      // 截断超长内容
      if (content.length > CONTENT_MAX) {
        content = content.slice(0, CONTENT_HEAD) + '\n...[truncated]...\n' + content.slice(-CONTENT_TAIL);
      }

      if (role === 'TOOL') {
        const toolId = msg.tool_call_id ?? '';
        parts.push(`[TOOL RESULT ${toolId}]: ${content}`);
        continue;
      }

      if (role === 'ASSISTANT') {
        const toolCalls = msg.tool_calls;
        if (toolCalls && toolCalls.length > 0) {
          const tcParts = toolCalls.map((tc) => {
            const name = tc.function.name;
            let args = tc.function.arguments;
            if (args.length > TOOL_ARGS_MAX) {
              args = args.slice(0, TOOL_ARGS_HEAD) + '...';
            }
            return `  ${name}(${args})`;
          });
          content += '\n[Tool calls:\n' + tcParts.join('\n') + '\n]';
        }
        parts.push(`[ASSISTANT]: ${content}`);
        continue;
      }

      parts.push(`[${role}]: ${content}`);
    }

    return parts.join('\n\n');
  }

  /**
   * 构建摘要 prompt
   * 对标 Hermes _generate_summary() 中的结构化模板
   */
  private _buildSummaryPrompt(serialized: string, budget: number, focusTopic?: string): string {
    const focusLine = focusTopic ? `\nFocus topic: ${focusTopic}` : '';
    return [
      'You are a conversation summarizer. Do NOT answer questions or fulfill requests.',
      'Summarize the following conversation turns into a structured format.',
      `Budget: ~${budget} tokens. Be concise but preserve key details.`,
      '',
      'Use this format:',
      '## Summary',
      '[2-3 paragraph summary of the conversation]',
      '',
      '## Key Decisions',
      '- [decision 1]',
      '- [decision 2]',
      '',
      '## Files & Code',
      '- [files created or modified, with brief descriptions]',
      '',
      '## Remaining Work',
      '- [unresolved tasks or next steps]',
      '',
      '## Resolved Questions',
      '- [questions that were answered]',
      `${focusLine}`,
      '',
      '---CONVERSATION---',
      serialized,
    ].join('\n');
  }

  /**
   * 简单摘要（当 Gateway 不可用时）
   */
  private _simpleSummary(turns: ChatMessage[]): string {
    const userMsgs = turns.filter((m) => m.role === 'user');
    const assistantMsgs = turns.filter((m) => m.role === 'assistant');
    const toolCalls = turns.filter((m) => m.role === 'assistant' && m.tool_calls).length;

    return [
      `[SIMPLE SUMMARY — ${userMsgs.length} user turns, ${assistantMsgs.length} assistant turns, ${toolCalls} tool calls]`,
      ...turns.slice(0, 3).map((m) => {
        const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
        return `[${m.role.toUpperCase()}]: ${content.slice(0, 200)}`;
      }),
      '...(additional turns omitted)...',
    ].join('\n');
  }

  // ─── Step 4: 重建消息列表 ────────────────────────────────

  private _rebuildMessages(
    head: ChatMessage[],
    _middle: ChatMessage[],
    tail: ChatMessage[],
    summaryText?: string
  ): ChatMessage[] {
    const result: ChatMessage[] = [...head];

    // 插入摘要消息
    if (summaryText) {
      const summaryMsg: ChatMessage = {
        role: 'system',
        content: `${SUMMARY_PREFIX}\n\n## Summary\n${summaryText}`,
      };
      result.push(summaryMsg);
      this.previousSummary = summaryText;
    }

    // 添加 tail（保护的消息）
    result.push(...tail);

    return result;
  }

  // ─── 工具方法 ────────────────────────────────────────────

  /**
   * 截断工具调用参数
   * 对标 Hermes _truncate_tool_call_args_json()
   *
   * 保留 JSON 结构，只截断过长的字符串值
   */
  private _truncateToolCallArgs(args: string): string {
    try {
      const parsed = JSON.parse(args);
      this._truncateObjectStrings(parsed, 200);
      return JSON.stringify(parsed);
    } catch {
      // 不是 JSON，截断处理
      return args.slice(0, TOOL_ARGS_HEAD) + '...';
    }
  }

  private _truncateObjectStrings(obj: unknown, maxLen: number): void {
    if (typeof obj === 'string') {
      if (obj.length > maxLen) {
        const replacement = obj.slice(0, maxLen - 3) + '...';
        Object.defineProperty(obj as object, 'value', { value: replacement });
      }
      return;
    }
    if (Array.isArray(obj)) {
      for (const item of obj) {
        this._truncateObjectStrings(item, maxLen);
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key of Object.keys(obj)) {
        this._truncateObjectStrings((obj as Record<string, unknown>)[key], maxLen);
      }
    }
  }

  // ─── 反抖动 & 冷却 ────────────────────────────────────────

  private _checkAntiJitter(currentTokens: number): boolean {
    if (this.lastUsefulTimestamp === 0) return false;

    const timeSinceLast = (Date.now() - this.lastUsefulTimestamp) / 1000;
    if (timeSinceLast > 60) return false; // 超过 60s 不考虑反抖动

    if (this.lastCompressionTokens === 0) return false;

    const improvement = (this.lastCompressionTokens - currentTokens) / this.lastCompressionTokens;
    if (improvement < ANTI_JITTER_MIN_IMPROVEMENT) {
      this.consecutivePoorCompressions++;
      if (this.consecutivePoorCompressions >= 2) {
        return true; // 连续 2 次改进 <10%，跳过
      }
    } else {
      this.consecutivePoorCompressions = 0;
    }

    return false;
  }

  private _checkCooldown(): boolean {
    const timeSince = (Date.now() - this.lastCompressionTime) / 1000;
    return timeSince < this.config.failureCooldownSeconds;
  }

  private _recordCompression(newTokens: number, savedTokens: number): void {
    this.lastCompressionTime = Date.now();
    this.lastCompressionTokens = newTokens;
    this.lastUsefulTimestamp = Date.now();
    const improvement = savedTokens / (savedTokens + newTokens);
    if (improvement >= ANTI_JITTER_MIN_IMPROVEMENT) {
      this.consecutivePoorCompressions = 0;
    }
  }

  private _recordFailure(): void {
    this.lastCompressionTime = Date.now() - (this.config.failureCooldownSeconds - 60) * 1000; // 提前 60s 以便重试
  }

  private _timeSinceLastCompression(): number {
    return Math.floor((Date.now() - this.lastCompressionTime) / 1000);
  }

  // ─── 状态访问 ────────────────────────────────────────────

  getConfig(): Readonly<ContextCompressor['config']> {
    return { ...this.config };
  }

  getPreviousSummary(): string | null {
    return this.previousSummary;
  }
}
