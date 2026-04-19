/**
 * CrowdStrike Adapter — CrowdStrike Falcon EDR 适配器
 *
 * 负责：
 * - CrowdStrike OAuth2 认证流程
 * - 将 Falcon API 响应转为 StandardToolResult
 * - 支持 detections / hosts / incidents 查询
 */

import type { AdapterRequest, StandardToolResult, ResponseMapping } from '../types';
import { applyResponseMapping } from './adapter-interface';

export class CrowdStrikeAdapter {
  readonly id = 'crowdstrike';
  readonly name = 'CrowdStrike Falcon';
  readonly version = '1.0.0';

  private baseUrl = 'https://api.crowdstrike.com';
  private accessToken = '';

  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  async execute(
    request: AdapterRequest,
    responseMapping?: ResponseMapping,
  ): Promise<StandardToolResult> {
    const start = performance.now();
    const url = `${this.baseUrl}${request.endpoint}`;

    try {
      const controller = new AbortController();
      const timeoutMs = request.timeout || 30000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...request.headers,
      };

      // Inject CrowdStrike bearer token if available
      if (this.accessToken) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
      }

      const response = await fetch(url, {
        method: request.method,
        headers,
        body: request.method !== 'GET' ? JSON.stringify(request.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const duration = Math.round(performance.now() - start);

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        const errors = errBody.errors?.map((e: { message: string }) => e.message).join('; ')
          ?? response.statusText;
        return {
          rows: [],
          status: 'error',
          duration,
          error: `CrowdStrike ${response.status}: ${errors}`,
        };
      }

      const raw = await response.json();
      // CrowdStrike wraps resources under "resources" key
      const normalized = raw.resources
        ? { ...raw, rows: raw.resources, summary: { total: raw.meta?.pagination?.total ?? raw.resources.length } }
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

export const crowdstrikeAdapter = new CrowdStrikeAdapter();
