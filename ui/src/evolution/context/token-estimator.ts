/**
 * SecuClaw Evolution — Token Estimator
 *
 * 对标 Hermes context_compressor.py 的 estimate_messages_tokens_rough()
 * 用于估算消息列表的 token 数量，判断是否需要压缩
 */

import type { ChatMessage } from '../types';

// ─── 常量（对标 Hermes）──────────────────────────────────────

const CHARS_PER_TOKEN = 4;  // Hermes: 4 chars/token rough estimate

// 模型上下文窗口（用于 ceiling 计算）
const MODEL_CONTEXT_LENGTHS: Record<string, number> = {
  'gpt-4o': 128_000,
  'gpt-4o-mini': 128_000,
  'gpt-4-turbo': 128_000,
  'gpt-4': 8_192,
  'gpt-3.5-turbo': 16_385,
  'claude-3-5-sonnet': 200_000,
  'claude-3-opus': 200_000,
  'claude-3-haiku': 200_000,
  'gemini-1.5-pro': 1_000_000,
  'gemini-1.5-flash': 1_000_000,
  'glm-4': 128_000,
  'glm-4-flash': 128_000,
  'default': 128_000,
};

// ─── Token 估算 ─────────────────────────────────────────────

/**
 * 估算单条消息的 token 数量
 * 对标 Hermes estimate_message_tokens()
 */
export function estimateMessageTokens(msg: ChatMessage): number {
  // 角色前缀 token
  const roleTokens = 4; // role + newline

  // 内容 token
  let contentTokens = 0;
  const content = msg.content;

  if (typeof content === 'string') {
    contentTokens = estimateTextTokens(content);
  } else if (Array.isArray(content)) {
    for (const block of content) {
      if (typeof block === 'string') {
        contentTokens += estimateTextTokens(block);
      } else if (block.type === 'text' && block.text) {
        contentTokens += estimateTextTokens(block.text);
      } else if (block.type === 'image_url' && block.image_url) {
        // 图片 URL 消耗较少 token（实际由 vision 模型处理）
        contentTokens += 85; // 估算
      }
    }
  }

  // 工具调用 token（估算）
  let toolCallTokens = 0;
  if (msg.tool_calls && msg.tool_calls.length > 0) {
    for (const tc of msg.tool_calls) {
      // function name + arguments
      const fnStr = `${tc.function.name}(${tc.function.arguments})`;
      toolCallTokens += estimateTextTokens(fnStr) + 15; // overhead
    }
  }

  return roleTokens + contentTokens + toolCallTokens;
}

/**
 * 估算文本的 token 数量
 * 简单实现：字符数 / 4
 */
export function estimateTextTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * 估算消息列表的总 token 数
 * 对标 Hermes estimate_messages_tokens_rough()
 */
export function estimateMessagesTokens(messages: ChatMessage[]): number {
  return messages.reduce((sum, msg) => sum + estimateMessageTokens(msg), 0);
}

/**
 * 根据模型名称获取上下文窗口大小
 * 对标 Hermes get_model_context_length()
 */
export function getModelContextLength(modelName: string): number {
  const lower = modelName.toLowerCase();
  for (const [key, length] of Object.entries(MODEL_CONTEXT_LENGTHS)) {
    if (lower.includes(key.toLowerCase())) {
      return length;
    }
  }
  return MODEL_CONTEXT_LENGTHS['default'];
}

/**
 * 估算摘要预算
 * 对标 Hermes _compute_summary_budget()
 *
 * 公式: max(MIN, min(content_tokens * ratio, ceiling))
 */
export function computeSummaryBudget(
  turnsToSummarize: ChatMessage[],
  summaryRatio = 0.20,
  summaryCeiling = 12_000
): number {
  const MIN_SUMMARY_TOKENS = 2000;
  const contentTokens = estimateMessagesTokens(turnsToSummarize);
  const budget = Math.ceil(contentTokens * summaryRatio);
  return Math.max(MIN_SUMMARY_TOKENS, Math.min(budget, summaryCeiling));
}
