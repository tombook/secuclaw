/**
 * Default Adapter — SecuClaw 后端 API 适配器
 * 
 * 负责与 SecuClaw 统一后端通信：
 * - 注入认证 header
 * - 发送 HTTP 请求
 * - 处理错误和超时
 * - 执行 responseMapping 转换
 */

import type { AdapterRequest, StandardToolResult, ResponseMapping } from '../types';
import { applyResponseMapping } from './adapter-interface';

export class DefaultAdapter {
  readonly id = 'default';
  readonly name = 'SecuClaw API';

  async execute(
    request: AdapterRequest,
    responseMapping?: ResponseMapping,
  ): Promise<StandardToolResult> {
    const start = performance.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), request.timeout || 15000);

      const fetchOptions: RequestInit = {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          ...request.headers,
        },
        signal: controller.signal,
      };

      if (request.method !== 'GET' && request.body) {
        fetchOptions.body = JSON.stringify(request.body);
      }

      const response = await fetch(request.endpoint, fetchOptions);
      clearTimeout(timeoutId);

      const duration = Math.round(performance.now() - start);

      if (!response.ok) {
        return {
          rows: [],
          status: 'error',
          duration,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const rawData = await response.json();
      return applyResponseMapping(rawData, responseMapping, duration);

    } catch (err) {
      const duration = Math.round(performance.now() - start);
      const message = err instanceof DOMException && err.name === 'AbortError'
        ? `请求超时 (${request.timeout}ms)`
        : err instanceof Error ? err.message : String(err);

      return {
        rows: [],
        status: 'error',
        duration,
        error: message,
      };
    }
  }
}

// Singleton
export const defaultAdapter = new DefaultAdapter();
