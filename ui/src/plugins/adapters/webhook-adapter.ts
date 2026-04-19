/**
 * Webhook Adapter — 通用 HTTP 请求适配器
 * 
 * 用于接入任意第三方 HTTP API：
 * - 支持自定义 URL、headers、body
 * - 支持响应路径提取（dataPath）
 * - 支持字段重映射（fieldMap）
 * - 兼容 REST / GraphQL / Webhook 等风格
 */

import type { AdapterRequest, StandardToolResult, ResponseMapping } from '../types';
import { applyResponseMapping } from './adapter-interface';

export class WebhookAdapter {
  readonly id = 'webhook';
  readonly name = '通用 Webhook';

  /** 额外 headers（可由用户配置注入） */
  private extraHeaders: Record<string, string> = {};

  setExtraHeaders(headers: Record<string, string>): void {
    this.extraHeaders = headers;
  }

  async execute(
    request: AdapterRequest,
    responseMapping?: ResponseMapping,
  ): Promise<StandardToolResult> {
    const start = performance.now();

    try {
      const controller = new AbortController();
      const timeoutMs = request.timeout || 30000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      // Build headers: auth + extra + content-type
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...request.headers,
        ...this.extraHeaders,
      };

      const fetchOptions: RequestInit = {
        method: request.method,
        headers,
        signal: controller.signal,
      };

      // Body: only for non-GET methods
      if (request.method !== 'GET' && request.body) {
        fetchOptions.body = JSON.stringify(request.body);
      }

      const response = await fetch(request.endpoint, fetchOptions);
      clearTimeout(timeoutId);

      const duration = Math.round(performance.now() - start);

      // Handle non-2xx responses
      if (!response.ok) {
        let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errBody = await response.json();
          if (errBody.error || errBody.message) {
            errorMsg += ` — ${errBody.error || errBody.message}`;
          }
        } catch { /* ignore parse error */ }

        return {
          rows: [],
          status: 'error',
          duration,
          error: errorMsg,
        };
      }

      // Parse response
      const contentType = response.headers.get('content-type') ?? '';
      let rawData: Record<string, unknown>;

      if (contentType.includes('application/json')) {
        rawData = await response.json() as Record<string, unknown>;
      } else {
        // Non-JSON response: wrap in a single-row result
        const text = await response.text();
        rawData = { rawResponse: text };
      }

      return applyResponseMapping(rawData, responseMapping, duration);

    } catch (err) {
      const duration = Math.round(performance.now() - start);

      if (err instanceof DOMException && err.name === 'AbortError') {
        return { rows: [], status: 'error', duration, error: `请求超时 (${timeoutMs}ms)` };
      }
      if (err instanceof TypeError && err.message.includes('fetch')) {
        return { rows: [], status: 'error', duration, error: `网络错误: ${err.message}` };
      }

      return {
        rows: [],
        status: 'error',
        duration,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

// Singleton
export const webhookAdapter = new WebhookAdapter();
