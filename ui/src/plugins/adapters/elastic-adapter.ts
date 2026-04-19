/**
 * Elastic Adapter — Elasticsearch / Elastic Security 适配器
 *
 * 负责：
 * - Elasticsearch _search API 查询
 * - Kibana Security API（alerts / cases / timelines）
 * - 解析 ES 响应的 hits 结构
 */

import type { AdapterRequest, StandardToolResult, ResponseMapping } from '../types';
import { applyResponseMapping } from './adapter-interface';

export class ElasticAdapter {
  readonly id = 'elastic';
  readonly name = 'Elasticsearch / Elastic Security';
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

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'kbn-xsrf': 'secuclaw', // Kibana CSRF header
        ...request.headers,
      };

      const response = await fetch(url, {
        method: request.method,
        headers,
        body: request.method !== 'GET' ? JSON.stringify(request.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const duration = Math.round(performance.now() - start);

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: { reason: response.statusText } }));
        return {
          rows: [],
          status: 'error',
          duration,
          error: `Elastic ${response.status}: ${err.error?.reason ?? err.message ?? response.statusText}`,
        };
      }

      const raw = await response.json();

      // Elasticsearch _search response: hits.hits[].['_source']
      const normalized = raw.hits?.hits
        ? {
          ...raw,
          rows: raw.hits.hits.map((h: { _source: Record<string, unknown>; _id: string; _score: number }) => ({
            _id: h._id,
            _score: h._score,
            ...h._source,
          })),
          summary: {
            total: raw.hits.total?.value ?? raw.hits.hits.length,
            ...(raw.aggregations ? { aggregations: Object.keys(raw.aggregations).length } : {}),
          },
        }
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

export const elasticAdapter = new ElasticAdapter();
