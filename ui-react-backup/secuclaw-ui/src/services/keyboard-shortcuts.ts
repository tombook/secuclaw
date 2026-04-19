/**
 * keyboard-shortcuts.ts — 全局键盘快捷键
 * @see v2.1 文档 3.9 无障碍设计
 *
 * Ctrl+Shift+[1-8] → 切换角色
 * Ctrl+Shift+0     → 返回总览
 * Escape            → 返回上一视图
 */

import type { RoleId } from '../config/role-tool-config';
import { ALL_ROLE_IDS } from '../config/role-tool-config';

export type ViewMode = 'overview' | 'role';

export interface ShortcutAction {
  type: 'switch-role' | 'go-overview' | 'go-back';
  roleId?: RoleId;
}

type ShortcutHandler = (action: ShortcutAction) => void;

let handler: ShortcutHandler | null = null;

function onKeyDown(e: KeyboardEvent) {
  // Ctrl+Shift+0 → Overview
  if (e.ctrlKey && e.shiftKey && e.key === '0') {
    e.preventDefault();
    handler?.({ type: 'go-overview' });
    return;
  }

  // Ctrl+Shift+[1-8] → Switch role
  if (e.ctrlKey && e.shiftKey) {
    const num = parseInt(e.key, 10);
    if (num >= 1 && num <= 8) {
      e.preventDefault();
      const roleId = ALL_ROLE_IDS[num - 1];
      handler?.({ type: 'switch-role', roleId });
      return;
    }
  }

  // Escape → Go back
  if (e.key === 'Escape') {
    handler?.({ type: 'go-back' });
  }
}

/**
 * Register global keyboard shortcuts.
 * Call once at app bootstrap.
 */
export function initKeyboardShortcuts(callback: ShortcutHandler) {
  handler = callback;
  window.addEventListener('keydown', onKeyDown);
}

/**
 * Cleanup keyboard shortcuts.
 */
export function destroyKeyboardShortcuts() {
  handler = null;
  window.removeEventListener('keydown', onKeyDown);
}

/**
 * Get shortcut label for a role (for display in UI).
 */
export function getShortcutLabel(roleId: RoleId): string {
  const idx = ALL_ROLE_IDS.indexOf(roleId);
  return idx >= 0 ? `Ctrl+Shift+${idx + 1}` : '';
}
