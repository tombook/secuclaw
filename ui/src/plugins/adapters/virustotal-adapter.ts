/**
 * VirusTotal Adapter — VirusTotal v3 API 适配器
 *
 * 负责：
 * - VirusTotal API key 认证
 * - 文件/URL/IP/域名 威胁查询
 * - 解析 VT v3 响应格式
 */

import type { AdapterRequest, StandardToolResult, ResponseMapping } from '../types';
import { applyResponseMapping } from './adapter-interface';

export class VirusTotalAdapter {
  readonly id = 'virustotal';
  readonly name = 'VirusTotal';
  readonly version = '1.0.0';

  private apiKey = '';

  setApiKey(key: string): void {
    this.apiKey = key;
  }

  async execute(
    request: AdapterRequest,
    responseMapping?: ResponseMapping,
  ): Promise<StandardToolResult> {
    const start = performance.now();
    // VirusTotal v3 API base URL
    const url = request.endpoint.startsWith('http')
      ? request.endpoint
      : `https://www.virustotal.com/api/v3${request.endpoint}`;

    try {
      const controller = new AbortController();
      const timeoutMs = request.timeout || 15000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const headers: Record<string, string> = {
        'Accept': 'application/json',
        ...request.headers,
      };

      // Inject VT API key
      if (this.apiKey) {
        headers['x-apikey'] = this.apiKey;
      }

      // VT v3 uses URL query params for filters
      let fetchUrl = url;
      if (request.method === 'GET' && request.body) {
        const params = new URLSearchParams(
          request.body as Record<string, string>
        ).toString();
        fetchUrl += (url.includes('?') ? '&' : '?') + params;
      }

      const response = await fetch(fetchUrl, {
        method: request.method,
        headers,
        body: request.method !== 'GET' ? JSON.stringify(request.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const duration = Math.round(performance.now() - start);

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
        return {
          rows: [],
          status: 'error',
          duration,
          error: `VirusTotal ${response.status}: ${err.error?.message ?? response.statusText}`,
        };
      }

      const raw = await response.json();
      // VT v3 wraps data under "data" key
      const normalized = raw.data
        ? (Array.isArray(raw.data)
          ? { ...raw, rows: raw.data }
          : { ...raw, rows: [raw.data] })
        : raw;

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

export const virusTotalAdapter = new VirusTotalAdapter();
