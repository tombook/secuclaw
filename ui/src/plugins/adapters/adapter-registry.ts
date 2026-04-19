/**
 * Adapter 注册中心
 * 管理所有已注册的 adapter 实例，提供统一的路由和执行接口
 */

import type { ToolPluginManifest, AdapterRequest, StandardToolResult, ToolAdapter } from '../types';
import { defaultAdapter } from './default-adapter';
import { webhookAdapter } from './webhook-adapter';
import { nessusAdapter } from './nessus-adapter';
import { splunkAdapter } from './splunk-adapter';
import { crowdstrikeAdapter } from './crowdstrike-adapter';
import { virusTotalAdapter } from './virustotal-adapter';
import { elasticAdapter } from './elastic-adapter';
import { buildAdapterRequest, applyResponseMapping } from './adapter-interface';

export class AdapterRegistry {
  private adapters = new Map<string, ToolAdapter>();
  private customAdapters = new Map<string, { execute: (req: AdapterRequest, mapping?: unknown) => Promise<StandardToolResult> }>();

  constructor() {
    // Register built-in adapters
    this.registerBuiltin('default', defaultAdapter);
    this.registerBuiltin('webhook', webhookAdapter);
    // Register third-party adapters
    this.registerBuiltin('nessus', nessusAdapter);
    this.registerBuiltin('splunk', splunkAdapter);
    this.registerBuiltin('crowdstrike', crowdstrikeAdapter);
    this.registerBuiltin('virustotal', virusTotalAdapter);
    this.registerBuiltin('elastic', elasticAdapter);
  }

  /** 注册内置 adapter */
  private registerBuiltin(id: string, adapter: { id: string; name: string; execute: (req: AdapterRequest, mapping?: unknown) => Promise<StandardToolResult> }) {
    this.adapters.set(id, adapter as ToolAdapter);
  }

  /** 注册自定义 adapter */
  registerCustom(id: string, adapter: { execute: (req: AdapterRequest, mapping?: unknown) => Promise<StandardToolResult> }) {
    this.customAdapters.set(id, adapter);
  }

  /** 获取 adapter */
  getAdapter(adapterId: string): { execute: (req: AdapterRequest, mapping?: unknown) => Promise<StandardToolResult> } | null {
    return this.adapters.get(adapterId) ?? this.customAdapters.get(adapterId) ?? null;
  }

  /** 列出所有已注册的 adapter IDs */
  listAdapters(): string[] {
    return [...this.adapters.keys(), ...this.customAdapters.keys()];
  }

  /**
   * 通过 manifest 执行工具（完整流程）
   * 1. 根据 manifest.api.adapter 选择 adapter
   * 2. 构建 AdapterRequest（bodyTemplate 插值 + auth 注入）
   * 3. 执行请求
   * 4. 应用 responseMapping
   */
  async executeManifest(
    manifest: ToolPluginManifest,
    formValues: Record<string, unknown>,
    configValues?: Record<string, unknown>,
  ): Promise<StandardToolResult> {
    const adapterId = manifest.api.adapter ?? 'default';
    const adapter = this.getAdapter(adapterId);

    if (!adapter) {
      return {
        rows: [],
        status: 'error' as const,
        duration: 0,
        error: `未找到 adapter: ${adapterId}`,
      };
    }

    // Build request
    const request = buildAdapterRequest(manifest, formValues, configValues);

    // Execute
    return adapter.execute(request, manifest.api.responseMapping);
  }
}

// Singleton
export const adapterRegistry = new AdapterRegistry();
