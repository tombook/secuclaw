/**
 * SecuClaw Evolution — EvolutionService HTTP Handlers
 *
 * 提供 HTTP handler 函数，供 OpenClaw Gateway 在适当的生命周期钩子中调用。
 * 所有函数都是纯同步/async 函数，不依赖特定框架。
 *
 * 接入方式（在 OpenClaw Gateway 的 agent 循环中）:
 *
 *   // 用户消息进来时
 *   const memoryContext = await evolutionOnUserMessage(userMsg, roleId);
 *   systemPrompt += memoryContext;
 *
 *   // LLM 响应后
 *   await evolutionOnTurnComplete(assistantMsg, roleId);
 *
 *   // 工具调用时
 *   evolutionOnToolCall(toolName, args, result);
 */

import type { ChatMessage, RoleId } from './types';

// ─── 懒初始化 ───────────────────────────────────────────────

let _initialized = false;
let _facade: import('./facade').EvolutionFacade | null = null;

async function getFacade() {
  if (!_initialized) {
    const { EvolutionFacade } = await import('./facade');
    _facade = new EvolutionFacade();
    await _facade.init();
    _initialized = true;
  }
  return _facade;
}

// ─── 核心钩子 ─────────────────────────────────────────────

/**
 * 用户消息进入时调用
 * 返回注入 LLM 的记忆上下文（带 <memory-context> fence）
 */
export async function evolutionOnUserMessage(
  msg: string,
  role: RoleId = 'secuclaw-commander'
): Promise<string> {
  const facade = await getFacade();
  return facade.onUserMessage(msg, role);
}

/**
 * 工具调用结果时调用
 * 追踪工具使用，更新 skill nudge 计数器
 */
export function evolutionOnToolCall(
  toolName: string,
  args: unknown,
  result: string
): void {
  if (!_facade) return;
  _facade.onToolCallResult(toolName, args, result);
}

/**
 * 轮次完成时调用
 * 触发: sync memory → queue prefetch → nudge check → background review
 */
export async function evolutionOnTurnComplete(
  assistantMsg: string,
  role: RoleId = 'secuclaw-commander'
): Promise<void> {
  const facade = await getFacade();
  await facade.onTurnComplete(assistantMsg, role);
}

/**
 * 角色切换时调用
 * 重新捕获新角色的记忆快照
 */
export async function evolutionOnRoleSwitch(
  newRole: RoleId
): Promise<string> {
  const facade = await getFacade();
  return facade.onRoleSwitch(newRole);
}

// ─── 手动操作 API ────────────────────────────────────────────

/**
 * 添加记忆条目
 */
export async function evolutionAddMemory(
  target: 'memory' | 'user',
  content: string,
  role: RoleId = 'secuclaw-commander'
): Promise<{ success: boolean; message: string }> {
  try {
    const facade = await getFacade();
    await facade.addMemory(target, content, role);
    return { success: true, message: 'Memory entry added' };
  } catch (e) {
    return { success: false, message: String(e) };
  }
}

/**
 * 读取记忆内容
 */
export async function evolutionReadMemory(
  target: 'memory' | 'user',
  role: RoleId = 'secuclaw-commander'
): Promise<{ content: string }> {
  const facade = await getFacade();
  const content = await facade.readMemory(target, role);
  return { content };
}

/**
 * 发布跨角色事件
 */
export async function evolutionPublishBridgeEvent(
  type: import('./types').BridgeEventType,
  summary: string,
  opts?: {
    targetRoles?: RoleId[];
    severity?: 'low' | 'medium' | 'high' | 'critical';
    eventId?: string;
    warRoomId?: string;
  }
): Promise<{ success: boolean }> {
  try {
    const facade = await getFacade();
    await facade.publishBridgeEvent(type, summary, opts);
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

/**
 * 触发手动审查
 */
export async function evolutionTriggerReview(
  type: 'memory' | 'skill' | 'combined',
  messages: ChatMessage[],
  role: RoleId = 'secuclaw-commander'
): Promise<{ triggered: boolean; summary: string }> {
  const facade = await getFacade();
  // 手动触发时直接调用 background review
  // 注意：需要传入消息历史，实际使用时从会话中获取
  console.log('[Evolution] Manual review triggered:', type, role);
  return { triggered: true, summary: 'Review queued' };
}

// ─── 状态查询 API ────────────────────────────────────────────

/**
 * 获取当前进化状态
 */
export function evolutionGetStatus(): ReturnType<ReturnType<typeof getFacade>['getStatus']> {
  return _facade?.getStatus() ?? null;
}

/**
 * 获取进化配置
 */
export function evolutionGetConfig(): ReturnType<ReturnType<typeof getFacade>['getConfig']> {
  return _facade?.getConfig() ?? null;
}

/**
 * 更新进化配置
 */
export function evolutionUpdateConfig(
  config: Partial<import('./types').EvolutionConfig>
): void {
  if (!_facade) return;
  _facade.updateConfig(config);
}

// ─── 工具 schema（供 LLM 调用）──────────────────────────────

/**

 * 获取记忆工具的 schema（供 LLM 使用）
 */
export function evolutionGetMemoryToolSchema(): {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
} {
  return {
    name: 'memory',
    description: 'Add, replace, remove, or read memory entries. Memories persist across sessions and shape how the agent behaves over time.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['add', 'replace', 'remove', 'read'],
          description: 'The action to perform',
        },
        target: {
          type: 'string',
          enum: ['memory', 'user'],
          description: 'memory = agent notes, user = user profile/preferences',
        },
        content: {
          type: 'string',
          description: 'Content for add/replace actions',
        },
        old_string: {
          type: 'string',
          description: 'Substring to replace (for replace action)',
        },
        new_string: {
          type: 'string',
          description: 'New content (for replace action)',
        },
      },
      required: ['action', 'target'],
    },
  };
}

/**
 * 获取技能管理工具的 schema（供 LLM 使用）
 */
export function evolutionGetSkillToolSchema(): {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
} {
  return {
    name: 'skill_manage',
    description: 'Create, edit, patch, or delete evolved skills. Skills capture reusable workflows and patterns.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['create', 'edit', 'patch', 'delete', 'write_file', 'remove_file'],
          description: 'The action to perform',
        },
        name: {
          type: 'string',
          description: 'Skill name (required for all actions except create)',
        },
        content: {
          type: 'string',
          description: 'Skill content (for create/edit). Use YAML frontmatter.',
        },
        old_string: {
          type: 'string',
          description: 'Old substring to replace (for patch action)',
        },
        new_string: {
          type: 'string',
          description: 'New substring (for patch action)',
        },
        file_path: {
          type: 'string',
          description: 'File path within skill (for write_file/remove_file)',
        },
        replace_all: {
          type: 'boolean',
          description: 'Replace all occurrences (for patch)',
        },
      },
      required: ['action'],
    },
  };
}
