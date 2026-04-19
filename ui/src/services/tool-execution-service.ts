/**
 * SecuClaw 工具执行事件总线
 * 解耦工具操作与指标更新
 *
 * @see v2.0 文档 第 4.4 节 工具执行事件流
 */

import type { RoleId } from '../config/role-tool-config';

// ─── Types ────────────────────────────────────────────────────

export type ToolOperation = 'execute' | 'approve' | 'reject' | 'notify';

export interface MetricUpdate {
  metricId: string;
  delta?: number;      // 变化量（如漏洞 -1）
  absolute?: number;   // 绝对值（如覆盖率 92%）
}

export interface BadgeUpdate {
  toolId: string;
  count: number;
}

export interface RaciUpdate {
  taskId: string;
  newStatus: string;
}

export interface ToolExecutionEvent {
  toolId: string;
  roleId: RoleId;
  operation: ToolOperation;
  timestamp: number;
  result: {
    metrics: MetricUpdate[];
    badge?: BadgeUpdate;
    raci?: RaciUpdate;
  };
}

type EventHandler = (event: ToolExecutionEvent) => void;

// ─── Event Bus ────────────────────────────────────────────────

class ToolEventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private globalHandlers: Set<EventHandler> = new Set();

  /** 订阅特定工具的事件 */
  on(toolId: string, handler: EventHandler): () => void {
    if (!this.handlers.has(toolId)) {
      this.handlers.set(toolId, new Set());
    }
    this.handlers.get(toolId)!.add(handler);
    return () => this.handlers.get(toolId)?.delete(handler);
  }

  /** 订阅所有工具事件 */
  onAny(handler: EventHandler): () => void {
    this.globalHandlers.add(handler);
    return () => this.globalHandlers.delete(handler);
  }

  /** 派发工具执行事件 */
  emit(event: ToolExecutionEvent): void {
    // 通知特定工具的订阅者
    const toolHandlers = this.handlers.get(event.toolId);
    if (toolHandlers) {
      for (const handler of toolHandlers) {
        try { handler(event); } catch (e) { console.error('[ToolEventBus]', e); }
      }
    }

    // 通知全局订阅者
    for (const handler of this.globalHandlers) {
      try { handler(event); } catch (e) { console.error('[ToolEventBus]', e); }
    }
  }

  /** 清理所有订阅 */
  clear(): void {
    this.handlers.clear();
    this.globalHandlers.clear();
  }
}

// 单例导出
export const toolEventBus = new ToolEventBus();

// ─── Tool Execution Service ───────────────────────────────────

/**
 * 执行工具操作并派发事件
 * 此函数由 UI 组件调用，触发工具执行 → 指标联动
 */
export async function executeTool(
  toolId: string,
  roleId: RoleId,
  operation: ToolOperation,
  params?: Record<string, unknown>
): Promise<ToolExecutionEvent> {
  const event: ToolExecutionEvent = {
    toolId,
    roleId,
    operation,
    timestamp: Date.now(),
    result: {
      metrics: [],
    },
  };

  // TODO: 实际执行工具逻辑（调用后端 API）
  // 目前只模拟事件派发
  // const apiResponse = await fetch(`/api/tools/${toolId}/${operation}`, { body: JSON.stringify(params) });

  toolEventBus.emit(event);
  return event;
}
