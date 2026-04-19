/**
 * SecuClaw 角色主题配置
 * 定义 8 个角色的 CSS Custom Properties（配色 token）
 *
 * @see v2.0 文档 第 3.2 节 配色系统
 */

import type { RoleId } from './role-tool-config';

// ─── Types ────────────────────────────────────────────────────

export interface RoleThemeTokens {
  '--role-bg': string;
  '--role-bg-surface': string;
  '--role-bg-elevated': string;
  '--role-primary': string;
  '--role-secondary': string;
  '--role-accent': string;
  '--role-text': string;
  '--role-text-muted': string;
  '--role-border': string;
  '--role-success': string;
  '--role-warning': string;
  '--role-danger': string;
}

export interface RoleTheme extends RoleThemeTokens {
  roleId: RoleId;
  label: string;
  bgPattern: string;      // SVG 纹理文件名
  bgPatternOpacity: number;
  animation: string;       // 专属动画名
}

// ─── Theme Definitions ────────────────────────────────────────

export const ROLE_THEMES: Record<RoleId, RoleTheme> = {
  'security-expert': {
    roleId: 'security-expert',
    label: '安全专家',
    bgPattern: 'pattern-circuit.svg',
    bgPatternOpacity: 0.05,
    animation: 'scan-effect',
    '--role-bg': '#0f172a',
    '--role-bg-surface': '#1e293b',
    '--role-bg-elevated': '#334155',
    '--role-primary': '#1e40af',
    '--role-secondary': '#3b82f6',
    '--role-accent': '#ef4444',
    '--role-text': '#f8fafc',
    '--role-text-muted': '#94a3b8',
    '--role-border': '#334155',
    '--role-success': '#22c55e',
    '--role-warning': '#f59e0b',
    '--role-danger': '#ef4444',
  },

  'privacy-officer': {
    roleId: 'privacy-officer',
    label: '隐私官',
    bgPattern: 'pattern-data-flow.svg',
    bgPatternOpacity: 0.05,
    animation: 'encrypt-effect',
    '--role-bg': '#2e1065',
    '--role-bg-surface': '#3b0764',
    '--role-bg-elevated': '#581c87',
    '--role-primary': '#7c3aed',
    '--role-secondary': '#a78bfa',
    '--role-accent': '#10b981',
    '--role-text': '#faf5ff',
    '--role-text-muted': '#c4b5fd',
    '--role-border': '#581c87',
    '--role-success': '#10b981',
    '--role-warning': '#fbbf24',
    '--role-danger': '#f87171',
  },

  'security-architect': {
    roleId: 'security-architect',
    label: '安全架构师',
    bgPattern: 'pattern-grid.svg',
    bgPatternOpacity: 0.05,
    animation: 'build-effect',
    '--role-bg': '#0c4a6e',
    '--role-bg-surface': '#0e7490',
    '--role-bg-elevated': '#0891b2',
    '--role-primary': '#0891b2',
    '--role-secondary': '#06b6d4',
    '--role-accent': '#f59e0b',
    '--role-text': '#f0f9ff',
    '--role-text-muted': '#7dd3fc',
    '--role-border': '#0e7490',
    '--role-success': '#34d399',
    '--role-warning': '#f59e0b',
    '--role-danger': '#fb923c',
  },

  'business-security-officer': {
    roleId: 'business-security-officer',
    label: '业务安全官',
    bgPattern: 'pattern-curves.svg',
    bgPatternOpacity: 0.05,
    animation: 'trend-up',
    '--role-bg': '#022c22',
    '--role-bg-surface': '#064e3b',
    '--role-bg-elevated': '#065f46',
    '--role-primary': '#059669',
    '--role-secondary': '#10b981',
    '--role-accent': '#6366f1',
    '--role-text': '#f0fdf4',
    '--role-text-muted': '#6ee7b7',
    '--role-border': '#065f46',
    '--role-success': '#22c55e',
    '--role-warning': '#eab308',
    '--role-danger': '#ef4444',
  },

  'secuclaw-commander': {
    roleId: 'secuclaw-commander',
    label: '安全指挥官',
    bgPattern: 'pattern-tactical.svg',
    bgPatternOpacity: 0.05,
    animation: 'tactical-deploy',
    '--role-bg': '#450a0a',
    '--role-bg-surface': '#7f1d1d',
    '--role-bg-elevated': '#991b1b',
    '--role-primary': '#dc2626',
    '--role-secondary': '#ef4444',
    '--role-accent': '#fbbf24',
    '--role-text': '#fef2f2',
    '--role-text-muted': '#fca5a5',
    '--role-border': '#991b1b',
    '--role-success': '#4ade80',
    '--role-warning': '#fbbf24',
    '--role-danger': '#dc2626',
  },

  'ciso': {
    roleId: 'ciso',
    label: 'CISO',
    bgPattern: 'pattern-board.svg',
    bgPatternOpacity: 0.04,
    animation: 'smooth-transition',
    '--role-bg': '#0f172a',
    '--role-bg-surface': '#1e3a8a',
    '--role-bg-elevated': '#1e40af',
    '--role-primary': '#1e3a8a',
    '--role-secondary': '#3b82f6',
    '--role-accent': '#fbbf24',
    '--role-text': '#eff6ff',
    '--role-text-muted': '#93c5fd',
    '--role-border': '#1e40af',
    '--role-success': '#4ade80',
    '--role-warning': '#fbbf24',
    '--role-danger': '#f87171',
  },

  'security-ops': {
    roleId: 'security-ops',
    label: '安全运营',
    bgPattern: 'pattern-monitor.svg',
    bgPatternOpacity: 0.05,
    animation: 'pulse-alert',
    '--role-bg': '#431407',
    '--role-bg-surface': '#7c2d12',
    '--role-bg-elevated': '#9a3412',
    '--role-primary': '#ea580c',
    '--role-secondary': '#f97316',
    '--role-accent': '#fef08a',
    '--role-text': '#fffbeb',
    '--role-text-muted': '#fed7aa',
    '--role-border': '#9a3412',
    '--role-success': '#4ade80',
    '--role-warning': '#fbbf24',
    '--role-danger': '#ef4444',
  },

  'supply-chain-security': {
    roleId: 'supply-chain-security',
    label: '供应链安全',
    bgPattern: 'pattern-network.svg',
    bgPatternOpacity: 0.05,
    animation: 'flow-nodes',
    '--role-bg': '#1a2e05',
    '--role-bg-surface': '#365314',
    '--role-bg-elevated': '#4d7c0f',
    '--role-primary': '#65a30d',
    '--role-secondary': '#84cc16',
    '--role-accent': '#f97316',
    '--role-text': '#f7fee7',
    '--role-text-muted': '#a3e635',
    '--role-border': '#4d7c0f',
    '--role-success': '#86efac',
    '--role-warning': '#fbbf24',
    '--role-danger': '#f97316',
  },
};

// ─── Helpers ──────────────────────────────────────────────────

/** 将主题 token 应用到 DOM 元素 */
export function applyTheme(element: HTMLElement, roleId: RoleId): void {
  const theme = ROLE_THEMES[roleId];
  if (!theme) return;

  element.setAttribute('data-role', roleId);

  const keys: (keyof RoleThemeTokens)[] = [
    '--role-bg', '--role-bg-surface', '--role-bg-elevated',
    '--role-primary', '--role-secondary', '--role-accent',
    '--role-text', '--role-text-muted', '--role-border',
    '--role-success', '--role-warning', '--role-danger',
  ];

  for (const key of keys) {
    element.style.setProperty(key, theme[key]);
  }
}

/** 获取角色的背景纹理 CSS */
export function getBgPatternCSS(roleId: RoleId): string {
  const theme = ROLE_THEMES[roleId];
  if (!theme) return '';
  return `background-image: url('/patterns/${theme.bgPattern}');
          background-repeat: repeat;
          opacity: ${theme.bgPatternOpacity};`;
}
