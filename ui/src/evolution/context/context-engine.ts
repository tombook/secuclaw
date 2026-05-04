/**
 * SecuClaw Evolution — ContextEngine (抽象基类)
 *
 * 对标 Hermes ContextEngine (agent/context_engine.py)
 *
 * 提供上下文管理的抽象接口，支持多种压缩策略。
 * 具体的压缩逻辑由 ContextCompressor 实现。
 */

import type { ChatMessage } from '../types';
import { estimateMessagesTokens } from './token-estimator';
import { ContextCompressor, type CompressionResult } from './compressor';

export interface ContextEngineConfig {
  compressionEnabled: boolean;
  thresholdPercent: number;
  protectFirstN: number;
  protectLastN: number;
  summaryRatio: number;
  summaryTokenCeiling: number;
  failureCooldownSeconds: number;
}

export abstract class ContextEngine {
  /** 子类实现的压缩方法 */
  abstract compress(
    messages: ChatMessage[],
    options?: Record<string, unknown>
  ): Promise<CompressionResult>;

  /** 检查是否需要压缩 */
  abstract shouldCompress(messages: ChatMessage[]): { needed: boolean; reason?: string };

  /** 更新 token 计数 */
  abstract updateFromResponse(usage: { prompt_tokens?: number; completion_tokens?: number }): void;
}

// ─── DefaultContextEngine ──────────────────────────────────────

/**
 * 默认上下文引擎
 * 使用 ContextCompressor 作为压缩策略
 */
export class DefaultContextEngine extends ContextEngine {
  private compressor: ContextCompressor;
  private config: ContextEngineConfig;
  private modelContextLength: number;

  constructor(
    config: ContextEngineConfig,
    modelContextLength = 128_000
  ) {
    super();
    this.config = config;
    this.modelContextLength = modelContextLength;
    this.compressor = new ContextCompressor({
      thresholdPercent: config.thresholdPercent,
      protectFirstN: config.protectFirstN,
      protectLastN: config.protectLastN,
      summaryRatio: config.summaryRatio,
      summaryTokenCeiling: config.summaryTokenCeiling,
      failureCooldownSeconds: config.failureCooldownSeconds,
    });
  }

  override async compress(
    messages: ChatMessage[],
    options?: Record<string, unknown>
  ): Promise<CompressionResult> {
    if (!this.config.compressionEnabled) {
      return {
        compressed: false,
        originalTokens: estimateMessagesTokens(messages),
        newTokens: estimateMessagesTokens(messages),
        savedTokens: 0,
        messages,
        skipped: true,
        skipReason: 'compression disabled',
      };
    }

    return this.compressor.compress(messages, {
      modelContextLength: this.modelContextLength,
      ...options,
    });
  }

  override shouldCompress(messages: ChatMessage[]): { needed: boolean; reason?: string } {
    if (!this.config.compressionEnabled) {
      return { needed: false, reason: 'compression disabled' };
    }
    return this.compressor.shouldCompress(messages, this.modelContextLength);
  }

  override updateFromResponse(usage: { prompt_tokens?: number; completion_tokens?: number }): void {
    this.compressor.updateFromResponse(usage);
  }

  /** 切换模型上下文窗口大小 */
  setModelContextLength(length: number): void {
    this.modelContextLength = length;
  }

  getCompressor(): ContextCompressor {
    return this.compressor;
  }
}
