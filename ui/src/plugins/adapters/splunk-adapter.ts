/**
 * Splunk Adapter — Splunk Enterprise / Splunk Cloud 日志查询适配器
 *
 * 负责：
 * - 将 Splunk SPL 查询转为标准请求格式
 * - 解析 Splunk REST API 响应（results / search jobs）
 * - 支持 SID (Search ID) 异步查询轮询
 */

import type { AdapterRequest, StandardToolResult, ResponseMapping } from '../types';
import { applyResponseMapping } from './adapter-interface';

export class SplunkAdapter {
  readonly id = 'splunk';
  readonly name = 'Splunk Enterprise';
  readonly version = '1.0.0';

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
      const timeoutMs = request.timeout || 30000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      // Splunk uses form-urlencoded for some endpoints, JSON for others
      const isSearchQuery = request.body?.['search'] !== undefined;
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        ...request.headers,
      };

      let body: string | undefined;
      if (request.method !== 'GET' && request.body) {
        if (isSearchQuery) {
          headers['Content-Type'] = 'application/x-www-form-urlencoded';
          body = Object.entries(request.body)
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
            .join('&');
        } else {
          headers['Content-Type'] = 'application/json';
          body = JSON.stringify(request.body);
        }
      }

      const response = await fetch(url, {
        method: request.method,
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const duration = Math.round(performance.now() - start);

      if (!response.ok) {
        const msg = await response.text().catch(() => response.statusText);
        return {
          rows: [],
          status: 'error',
          duration,
          error: `Splunk API ${response.status}: ${msg}`,
        };
      }

      const raw = await response.json();
      // Splunk results are often nested under "results" key
      const normalized = raw.results ? { ...raw, rows: raw.results } : raw;
      return applyResponseMapping(normalized, responseMapping, duration);
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

export const splunkAdapter = new SplunkAdapter();
