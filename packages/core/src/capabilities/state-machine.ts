/**
 * Task State Machine - 任务状态机
 * 
 * 定义任务状态转换规则和验证
 */

import type { TaskStatus, ApprovalStatus, RunStatus } from './types.js';

// Task状态转换规则
export const TASK_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  'todo': ['in_progress', 'blocked', 'closed'],
  'in_progress': ['done', 'blocked', 'todo'],
  'blocked': ['in_progress', 'todo', 'closed'],
  'done': ['closed', 'in_progress'],
  'closed': [], // 终态，不可转换
};

// Approval状态转换规则
export const APPROVAL_STATUS_TRANSITIONS: Record<ApprovalStatus, ApprovalStatus[]> = {
  'pending': ['approved', 'rejected', 'expired'],
  'approved': [], // 终态
  'rejected': [], // 终态
  'expired': ['pending'], // 可以重新激活
};

// Run状态转换规则
export const RUN_STATUS_TRANSITIONS: Record<RunStatus, RunStatus[]> = {
  'queued': ['running', 'canceled'],
  'running': ['success', 'failed', 'canceled'],
  'success': [], // 终态
  'failed': ['queued'], // 可以重试
  'canceled': [], // 终态
};

export interface TransitionResult {
  valid: boolean;
  error?: string;
}

/**
 * 验证状态转换是否合法
 */
export function validateTaskTransition(
  currentStatus: TaskStatus,
  newStatus: TaskStatus
): TransitionResult {
  const allowedTransitions = TASK_STATUS_TRANSITIONS[currentStatus];
  
  if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      error: `Invalid transition from '${currentStatus}' to '${newStatus}'. Allowed: ${allowedTransitions?.join(', ') || 'none'}`,
    };
  }
  
  return { valid: true };
}

/**
 * 验证Approval状态转换
 */
export function validateApprovalTransition(
  currentStatus: ApprovalStatus,
  newStatus: ApprovalStatus
): TransitionResult {
  const allowedTransitions = APPROVAL_STATUS_TRANSITIONS[currentStatus];
  
  if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      error: `Invalid approval transition from '${currentStatus}' to '${newStatus}'. Allowed: ${allowedTransitions?.join(', ') || 'none'}`,
    };
  }
  
  return { valid: true };
}

/**
 * 验证Run状态转换
 */
export function validateRunTransition(
  currentStatus: RunStatus,
  newStatus: RunStatus
): TransitionResult {
  const allowedTransitions = RUN_STATUS_TRANSITIONS[currentStatus];
  
  if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      error: `Invalid run transition from '${currentStatus}' to '${newStatus}'. Allowed: ${allowedTransitions?.join(', ') || 'none'}`,
    };
  }
  
  return { valid: true };
}

/**
 * 获取下一个允许的状态
 */
export function getNextAllowedStatuses(currentStatus: TaskStatus): TaskStatus[] {
  return TASK_STATUS_TRANSITIONS[currentStatus] || [];
}

/**
 * 检查是否为终态
 */
export function isTerminalStatus(status: TaskStatus): boolean {
  return TASK_STATUS_TRANSITIONS[status]?.length === 0;
}

/**
 * 任务状态机类
 */
export class TaskStateMachine {
  /**
   * 执行状态转换
   */
  static transition(
    currentStatus: TaskStatus,
    newStatus: TaskStatus
  ): TransitionResult {
    return validateTaskTransition(currentStatus, newStatus);
  }

  /**
   * 获取可用转换
   */
  static getAvailableTransitions(status: TaskStatus): TaskStatus[] {
    return getNextAllowedStatuses(status);
  }

  /**
   * 检查是否可关闭
   */
  static canClose(status: TaskStatus): boolean {
    return TASK_STATUS_TRANSITIONS[status]?.includes('closed') || false;
  }

  /**
   * 检查是否可打开
   */
  static canOpen(status: TaskStatus): boolean {
    return status === 'closed';
  }

  /**
   * 获取状态中文名
   */
  static getStatusName(status: TaskStatus): string {
    const names: Record<TaskStatus, string> = {
      'todo': '待办',
      'in_progress': '进行中',
      'blocked': '已阻塞',
      'done': '已完成',
      'closed': '已关闭',
    };
    return names[status] || status;
  }

  /**
   * 获取状态颜色
   */
  static getStatusColor(status: TaskStatus): string {
    const colors: Record<TaskStatus, string> = {
      'todo': '#6b7280',      // gray
      'in_progress': '#3b82f6', // blue
      'blocked': '#ef4444',   // red
      'done': '#22c55e',     // green
      'closed': '#9ca3af',    // gray-light
    };
    return colors[status] || '#6b7280';
  }
}

/**
 * Approval状态机
 */
export class ApprovalStateMachine {
  static transition(
    currentStatus: ApprovalStatus,
    newStatus: ApprovalStatus
  ): TransitionResult {
    return validateApprovalTransition(currentStatus, newStatus);
  }

  static getStatusName(status: ApprovalStatus): string {
    const names: Record<ApprovalStatus, string> = {
      'pending': '待审批',
      'approved': '已批准',
      'rejected': '已拒绝',
      'expired': '已过期',
    };
    return names[status] || status;
  }

  static getStatusColor(status: ApprovalStatus): string {
    const colors: Record<ApprovalStatus, string> = {
      'pending': '#f59e0b',  // yellow
      'approved': '#22c55e', // green
      'rejected': '#ef4444', // red
      'expired': '#6b7280',  // gray
    };
    return colors[status] || '#6b7280';
  }
}

/**
 * Run状态机
 */
export class RunStateMachine {
  static transition(
    currentStatus: RunStatus,
    newStatus: RunStatus
  ): TransitionResult {
    return validateRunTransition(currentStatus, newStatus);
  }

  static getStatusName(status: RunStatus): string {
    const names: Record<RunStatus, string> = {
      'queued': '排队中',
      'running': '执行中',
      'success': '成功',
      'failed': '失败',
      'canceled': '已取消',
    };
    return names[status] || status;
  }

  static getStatusColor(status: RunStatus): string {
    const colors: Record<RunStatus, string> = {
      'queued': '#6b7280',  // gray
      'running': '#3b82f6', // blue
      'success': '#22c55e', // green
      'failed': '#ef4444',  // red
      'canceled': '#9ca3af', // gray-light
    };
    return colors[status] || '#6b7280';
  }
}
