/**
 * SecuClaw Adapter 协议定义
 * 所有工具 API 适配器必须实现此接口
 *
 * 职责：
 * 1. 构建请求（bodyTemplate 变量插值）
 * 2. 注入认证信息
 * 3. 发送请求并处理响应
 * 4. 执行 responseMapping 数据转换
 */

import type { AuthConfig, AdapterRequest, StandardToolResult, ResponseMapping } from '../types';

// ─── 变量插值引擎 ────────────────────────────────────

/**
 * 将 bodyTemplate 中的 {{form.fieldName}} 替换为 formValues 中的实际值
 * 支持：
 *   {{form.target}}          → formValues.target
 *   {{form.severityFilter}}  → formValues.severityFilter（数组/对象/原始值）
 *   {{config.apiKey}}        → configValues.apiKey
 *   {{env.BASE_URL}}         → 环境变量（仅限白名单）
 */
export function interpolateTemplate(
  template: Record<string, unknown>,
  formValues: Record<string, unknown>,
  configValues?: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(template)) {
    result[key] = _interpolateValue(value, formValues, configValues);
  }
  return result;
}

function _interpolateValue(
  value: unknown,
  form: Record<string, unknown>,
  config?: Record<string, unknown>,
): unknown {
  if (typeof value === 'string') {
    return _interpolateString(value, form, config);
  }
  if (Array.isArray(value)) {
    return value.map(v => _interpolateValue(v, form, config));
  }
  if (value !== null && typeof value === 'object') {
    return interpolateTemplate(value as Record<string, unknown>, form, config);
  }
  return value;
}

function _interpolateString(
  s: string,
  form: Record<string, unknown>,
  config?: Record<string, unknown>,
): unknown {
  // Match {{form.xxx}}, {{config.xxx}}, {{env.xxx}}
  const match = s.match(/^\{\{(\w+)\.(\w+)\}\}$/);
  if (!match) {
    // Partial interpolation (e.g., "prefix-{{form.name}}-suffix")
    return s.replace(/\{\{(\w+)\.(\w+)\}\}/g, (_m, ns: string, key: string) => {
      const source = ns === 'form' ? form : ns === 'config' ? (config ?? {}) : {};
      return String(source[key] ?? '');
    });
  }
  const [, ns, key] = match;
  if (ns === 'form') return form[key] ?? '';
  if (ns === 'config') return config?.[key] ?? '';
  return '';
}

// ─── Response Mapping 引擎 ──────────────────────────

/**
 * 根据 responseMapping 将原始 API 响应转换为 StandardToolResult
 *
 * responseMapping 支持：
 *   dataPath: JSONPath 风格路径，如 "response.vulnerabilities" → 在响应中嵌套取数据
 *   fieldMap: 字段重命名映射，如 { plugin_name: name } → 每行数据的 key 被替换
 *   pagination: 分页字段映射
 */
export function applyResponseMapping(
  rawResponse: Record<string, unknown>,
  mapping: ResponseMapping | undefined,
  durationMs: number,
): StandardToolResult {
  if (!mapping) {
    // No mapping — assume rawResponse IS the result
    const rows = Array.isArray(rawResponse) ? rawResponse : rawResponse.rows ?? [rawResponse];
    return {
      rows: rows as Record<string, unknown>[],
      summary: (rawResponse.summary as Record<string, number | string>) ?? undefined,
      status: 'success',
      duration: durationMs,
    };
  }

  // Extract data from dataPath
  let data: unknown = rawResponse;
  if (mapping.dataPath) {
    const segments = mapping.dataPath.replace(/^\$?\./, '').split('.');
    for (const seg of segments) {
      if (data && typeof data === 'object') {
        data = (data as Record<string, unknown>)[seg];
      } else {
        data = [];
        break;
      }
    }
  }

  const rows = Array.isArray(data) ? data as Record<string, unknown>[] : data ? [data as Record<string, unknown>] : [];

  // Apply fieldMap (rename keys)
  const mappedRows = mapping.fieldMap
    ? rows.map(row => {
        const mapped: Record<string, unknown> = {};
        for (const [rawKey, displayKey] of Object.entries(mapping.fieldMap!)) {
          if (rawKey in row) {
            mapped[displayKey] = row[rawKey];
          }
        }
        // Also preserve unmapped fields
        for (const [k, v] of Object.entries(row)) {
          if (!(k in (mapping.fieldMap ?? {}))) {
            mapped[k] = v;
          }
        }
        return mapped;
      })
    : rows;

  // Extract pagination info
  const pagination = mapping.pagination
    ? {
        page: Number(rawResponse[mapping.pagination.pageField] ?? 1),
        size: Number(rawResponse[mapping.pagination.sizeField] ?? 20),
        total: Number(rawResponse[mapping.pagination.totalField] ?? mappedRows.length),
      }
    : undefined;

  return {
    rows: mappedRows,
    summary: (rawResponse.summary as Record<string, number | string>) ?? undefined,
    pagination,
    status: 'success',
    duration: durationMs,
  };
}

// ─── Auth Header 构建器 ──────────────────────────────

/**
 * 根据 AuthConfig 生成请求 headers
 */
export function buildAuthHeaders(auth: AuthConfig): Record<string, string> {
  switch (auth.type) {
    case 'bearer':
      return { Authorization: `Bearer ${_getToken(auth)}` };
    case 'api-key':
      return { 'X-API-Key': _getToken(auth) };
    case 'basic': {
      const token = _getToken(auth);
      return { Authorization: `Basic ${token}` };
    }
    case 'oauth2':
      return { Authorization: `Bearer ${_getToken(auth)}` };
    case 'none':
    default:
      return {};
  }
}

function _getToken(auth: AuthConfig): string {
  // In production: read from secure storage / env / session
  // For now: return a placeholder
  const key = auth.tokenKey ?? 'API_TOKEN';
  switch (auth.tokenSource) {
    case 'env':
      return (globalThis as Record<string, unknown>)[key] as string ?? '';
    case 'session':
      return (globalThis as Record<string, unknown>).__secuclaw_session_token as string ?? '';
    case 'store':
    case 'prompt':
    default:
      return '';
  }
}

// ─── 请求构建器 ──────────────────────────────────────

/**
 * 构建完整的 AdapterRequest
 */
export function buildAdapterRequest(
  manifest: { api: { endpoint: string; method: string; auth: AuthConfig; timeout: number; bodyTemplate?: Record<string, unknown> } },
  formValues: Record<string, unknown>,
  configValues?: Record<string, unknown>,
): AdapterRequest {
  const body = manifest.api.bodyTemplate
    ? interpolateTemplate(manifest.api.bodyTemplate, formValues, configValues)
    : formValues;

  return {
    endpoint: manifest.api.endpoint,
    method: manifest.api.method,
    body,
    headers: buildAuthHeaders(manifest.api.auth),
    auth: manifest.api.auth,
    timeout: manifest.api.timeout,
  };
}
