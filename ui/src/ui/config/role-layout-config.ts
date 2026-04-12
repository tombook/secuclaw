import type { RoleId } from './role-themes.js';

export type LayoutType = 'grid' | 'card-flow' | 'three-column' | 'timeline' | 'war-room' | 'dashboard' | 'queue' | 'graph';

export interface LayoutSection {
  id: string;
  type: 'raci' | 'metrics' | 'collaboration' | 'custom';
  title: string;
  order: number;
  size: 'small' | 'medium' | 'large' | 'full';
}

export interface RoleLayoutConfig {
  roleId: RoleId;
  layoutType: LayoutType;
  sections: LayoutSection[];
  gridConfig?: {
    columns: number;
    rows?: number;
    gap: number;
  };
  timelineConfig?: {
    orientation: 'horizontal' | 'vertical';
    showMilestones: boolean;
  };
  queueConfig?: {
    priorityOrdering: boolean;
    maxVisible: number;
  };
}

export const ROLE_LAYOUT_CONFIG: Record<RoleId, RoleLayoutConfig> = {
  'security-expert': {
    roleId: 'security-expert',
    layoutType: 'grid',
    sections: [
      { id: 'vuln-distribution', type: 'metrics', title: '漏洞分布', order: 0, size: 'large' },
      { id: 'threat-landscape', type: 'metrics', title: '威胁态势', order: 1, size: 'medium' },
      { id: 'raci-tasks', type: 'raci', title: 'RACI任务', order: 2, size: 'medium' },
      { id: 'collaboration', type: 'collaboration', title: '协作讨论', order: 3, size: 'small' },
    ],
    gridConfig: { columns: 3, gap: 16 },
  },
  'privacy-officer': {
    roleId: 'privacy-officer',
    layoutType: 'card-flow',
    sections: [
      { id: 'compliance-status', type: 'metrics', title: '合规状态', order: 0, size: 'large' },
      { id: 'data-protection', type: 'metrics', title: '数据保护', order: 1, size: 'medium' },
      { id: 'raci-tasks', type: 'raci', title: 'RACI任务', order: 2, size: 'medium' },
      { id: 'collaboration', type: 'collaboration', title: '协作讨论', order: 3, size: 'small' },
    ],
  },
  'security-architect': {
    roleId: 'security-architect',
    layoutType: 'three-column',
    sections: [
      { id: 'threat-modeling', type: 'metrics', title: '威胁建模', order: 0, size: 'medium' },
      { id: 'architecture-diagram', type: 'custom', title: '架构图', order: 1, size: 'large' },
      { id: 'control-effectiveness', type: 'metrics', title: '控制有效性', order: 2, size: 'medium' },
      { id: 'raci-tasks', type: 'raci', title: 'RACI任务', order: 3, size: 'small' },
    ],
  },
  'business-security-officer': {
    roleId: 'business-security-officer',
    layoutType: 'timeline',
    sections: [
      { id: 'business-impact', type: 'metrics', title: '业务影响', order: 0, size: 'large' },
      { id: 'recovery-plan', type: 'metrics', title: '恢复计划', order: 1, size: 'medium' },
      { id: 'timeline', type: 'custom', title: '时间线', order: 2, size: 'large' },
      { id: 'raci-tasks', type: 'raci', title: 'RACI任务', order: 3, size: 'small' },
    ],
    timelineConfig: { orientation: 'horizontal', showMilestones: true },
  },
  'secuclaw-commander': {
    roleId: 'secuclaw-commander',
    layoutType: 'war-room',
    sections: [
      { id: 'global-situation', type: 'metrics', title: '全域态势', order: 0, size: 'full' },
      { id: 'raci-coordination', type: 'raci', title: 'RACI协调', order: 1, size: 'large' },
      { id: 'cross-role-discussion', type: 'collaboration', title: '跨角色讨论', order: 2, size: 'medium' },
      { id: 'crisis-management', type: 'custom', title: '危机管理', order: 3, size: 'medium' },
    ],
  },
  'ciso': {
    roleId: 'ciso',
    layoutType: 'dashboard',
    sections: [
      { id: 'strategic-view', type: 'metrics', title: '战略视图', order: 0, size: 'large' },
      { id: 'board-report', type: 'metrics', title: '董事会报告', order: 1, size: 'medium' },
      { id: 'budget-status', type: 'metrics', title: '预算状态', order: 2, size: 'small' },
      { id: 'kpi-dashboard', type: 'custom', title: 'KPI仪表盘', order: 3, size: 'large' },
    ],
  },
  'security-ops': {
    roleId: 'security-ops',
    layoutType: 'queue',
    sections: [
      { id: 'alert-queue', type: 'custom', title: '告警队列', order: 0, size: 'full' },
      { id: 'incident-response', type: 'metrics', title: '事件响应', order: 1, size: 'medium' },
      { id: 'raci-tasks', type: 'raci', title: 'RACI任务', order: 2, size: 'medium' },
      { id: 'collaboration', type: 'collaboration', title: '协作讨论', order: 3, size: 'small' },
    ],
    queueConfig: { priorityOrdering: true, maxVisible: 20 },
  },
  'supply-chain-security': {
    roleId: 'supply-chain-security',
    layoutType: 'graph',
    sections: [
      { id: 'vendor-risk-map', type: 'custom', title: '供应商风险图', order: 0, size: 'large' },
      { id: 'sbom-status', type: 'metrics', title: 'SBOM状态', order: 1, size: 'medium' },
      { id: 'dependency-graph', type: 'custom', title: '依赖关系图', order: 2, size: 'medium' },
      { id: 'raci-tasks', type: 'raci', title: 'RACI任务', order: 3, size: 'small' },
    ],
  },
};

export function getRoleLayoutConfig(roleId: RoleId): RoleLayoutConfig {
  return ROLE_LAYOUT_CONFIG[roleId] || ROLE_LAYOUT_CONFIG['security-expert'];
}
