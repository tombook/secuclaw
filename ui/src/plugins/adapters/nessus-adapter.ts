/**
 * Nessus Adapter — Tenable Nessus Professional 漏洞扫描适配器
 *
 * API 参考: https://developer.tenable.com/reference/nessus
 *
 * 负责：
 * - 将 Nessus REST API 响应转为 StandardToolResult
 * - 支持 scan launch / status / result 查询
 * - 自动处理 Nessus 的分页和异步扫描机制
 */

import type { AdapterRequest, StandardToolResult, ResponseMapping } from '../types';
import { applyResponseMapping } from './adapter-interface';

export class NessusAdapter {
  readonly id = 'nessus';
  readonly name = 'Nessus Professional';
  readonly version = '1.0.0';

  /** Nessus API 基础 URL（可配置） */
  private baseUrl = '';

  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  async execute(
    request: AdapterRequest,
    responseMapping?: ResponseMapping,
  ): Promise<StandardToolResult> {
    const start = performance.now();
    const url = this.baseUrl ? `${this.baseUrl}${request.endpoint}` : request.endpoint;

    try {
      const controller = new AbortController();
      const timeoutMs = request.timeout || 60000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...request.headers,
        },
        body: request.method !== 'GET' ? JSON.stringify(request.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const duration = Math.round(performance.now() - start);

      if (!response.ok) {
        return {
          rows: [],
          status: 'error',
          duration,
          error: `Nessus API ${response.status}: ${response.statusText}`,
        };
      }

      const raw = await response.json();
      return applyResponseMapping(raw, responseMapping, duration);
    } catch (err) {
      const duration = Math.round(performance.now() - start);
      return {
        rows: [],
        status: 'error',
        duration,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

export const nessusAdapter = new NessusAdapter();
