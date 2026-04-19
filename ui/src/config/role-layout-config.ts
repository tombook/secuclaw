/**
 * SecuClaw 角色布局配置
 * 定义 8 个角色的差异化布局：布局类型、三区排列、响应式策略
 *
 * @see v2.0 文档 第 3.3 节 布局系统
 */

import type { RoleId } from './role-tool-config';

// ─── Types ────────────────────────────────────────────────────

export type LayoutType =
  | 'grid-dashboard'       // 网格仪表盘
  | 'card-flow'            // 卡片流
  | 'three-column'         // 三栏并列
  | 'timeline-kpi'         // 时间线 + KPI
  | 'war-room'             // 战情室
  | 'executive-dashboard'  // 高管仪表盘
  | 'alert-queue'          // 告警队列
  | 'relationship-graph';  // 关系图

export interface ZoneLayout {
  /** 区域宽度占比（CSS Grid fr 或百分比） */
  raci: string;
  metrics: string;
  collaboration: string;
  /** 核心工作区占位说明 */
  mainArea: string;
}

export interface RoleLayout {
  roleId: RoleId;
  type: LayoutType;
  label: string;
  /** 主工作区描述 */
  mainAreaLabel: string;
  /** 三区排列比例 */
  zones: ZoneLayout;
  /** 指标区位置 */
  metricsPosition: 'top' | 'top-banner' | 'bottom' | 'sidebar';
  /** RACI 展示模式 */
  raciMode: 'horizontal-cards' | 'timeline' | 'left-panel' | 'queue';
  /** 协作区位置 */
  collabPosition: 'right' | 'bottom' | 'overlay';
  /** 平板以下协作区折叠到哪里 */
  tabletCollapseCollabTo: 'bottom' | 'hidden';
}

// ─── Layout Definitions ───────────────────────────────────────

export const ROLE_LAYOUTS: Record<RoleId, RoleLayout> = {
  'security-expert': {
    roleId: 'security-expert',
    type: 'grid-dashboard',
    label: '网格仪表盘',
    mainAreaLabel: '漏洞分布 + 威胁态势',
    zones: {
      raci: '1fr',
      metrics: '65%',
      collaboration: '35%',
      mainArea: '漏洞热力图 + CVSS 分布',
    },
    metricsPosition: 'top',
    raciMode: 'horizontal-cards',
    collabPosition: 'right',
    tabletCollapseCollabTo: 'bottom',
  },

  'privacy-officer': {
    roleId: 'privacy-officer',
    type: 'card-flow',
    label: '卡片流',
    mainAreaLabel: '合规进度 + 数据保护',
    zones: {
      raci: '55%',
      metrics: '1fr',
      collaboration: '45%',
      mainArea: '合规进度条 + 数据地图',
    },
    metricsPosition: 'top-banner',
    raciMode: 'horizontal-cards',
    collabPosition: 'right',
    tabletCollapseCollabTo: 'bottom',
  },

  'security-architect': {
    roleId: 'security-architect',
    type: 'three-column',
    label: '三栏并列',
    mainAreaLabel: '架构画布（中心）',
    zones: {
      raci: '2fr',
      metrics: '8fr',
      collaboration: '2fr',
      mainArea: '架构图 + 威胁建模画布',
    },
    metricsPosition: 'top',
    raciMode: 'left-panel',
    collabPosition: 'right',
    tabletCollapseCollabTo: 'hidden',
  },

  'business-security-officer': {
    roleId: 'business-security-officer',
    type: 'timeline-kpi',
    label: '时间线 + KPI',
    mainAreaLabel: 'BCP 时间线',
    zones: {
      raci: '100%',
      metrics: '100%',
      collaboration: '100%',
      mainArea: 'BCP 时间线 + 恢复计划',
    },
    metricsPosition: 'top',
    raciMode: 'timeline',
    collabPosition: 'bottom',
    tabletCollapseCollabTo: 'bottom',
  },

  'secuclaw-commander': {
    roleId: 'secuclaw-commander',
    type: 'war-room',
    label: '战情室',
    mainAreaLabel: '全域态势大屏',
    zones: {
      raci: '3fr',
      metrics: 'auto',
      collaboration: '3fr',
      mainArea: '威胁分布地图 + 活跃事件',
    },
    metricsPosition: 'bottom',
    raciMode: 'left-panel',
    collabPosition: 'right',
    tabletCollapseCollabTo: 'hidden',
  },

  'ciso': {
    roleId: 'ciso',
    type: 'executive-dashboard',
    label: '高管仪表盘',
    mainAreaLabel: 'KPI 大字卡片 + 趋势图',
    zones: {
      raci: '40%',
      metrics: '100%',
      collaboration: '60%',
      mainArea: '风险评分 + 预算 + KPI',
    },
    metricsPosition: 'top',
    raciMode: 'horizontal-cards',
    collabPosition: 'right',
    tabletCollapseCollabTo: 'bottom',
  },

  'security-ops': {
    roleId: 'security-ops',
    type: 'alert-queue',
    label: '告警队列',
    mainAreaLabel: '告警队列',
    zones: {
      raci: '40%',
      metrics: '100%',
      collaboration: '60%',
      mainArea: '告警列表（P1-P4 优先级）',
    },
    metricsPosition: 'top',
    raciMode: 'queue',
    collabPosition: 'right',
    tabletCollapseCollabTo: 'bottom',
  },

  'supply-chain-security': {
    roleId: 'supply-chain-security',
    type: 'relationship-graph',
    label: '关系图',
    mainAreaLabel: '供应商关系图',
    zones: {
      raci: '35%',
      metrics: '65%',
      collaboration: '100%',
      mainArea: '供应商节点图 + SBOM 状态',
    },
    metricsPosition: 'top',
    raciMode: 'left-panel',
    collabPosition: 'bottom',
    tabletCollapseCollabTo: 'bottom',
  },
};

// ─── Helpers ──────────────────────────────────────────────────

/** 获取角色的 CSS Grid Template */
export function getGridTemplate(roleId: RoleId): string {
  const layout = ROLE_LAYOUTS[roleId];
  switch (layout.type) {
    case 'three-column':
      return `'metrics metrics metrics' auto 'raci main collab' 1fr / ${layout.zones.raci} ${layout.zones.metrics} ${layout.zones.collaboration}`;
    case 'war-room':
      return `'statusbar statusbar statusbar' auto 'raci main collab' 1fr 'metrics metrics metrics' auto / ${layout.zones.raci} 1fr ${layout.zones.collaboration}`;
    case 'alert-queue':
      return `'metrics metrics' auto 'main main' 1fr 'raci collab' auto / ${layout.zones.raci} ${layout.zones.collaboration}`;
    case 'timeline-kpi':
      return `'metrics' auto 'raci' 1fr 'collab' auto / 1fr`;
    case 'relationship-graph':
      return `'metrics metrics' auto 'main raci' 1fr 'collab collab' auto / ${layout.zones.metrics} ${layout.zones.raci}`;
    case 'grid-dashboard':
      return `'raci raci raci' auto 'metrics metrics collab' 1fr / ${layout.zones.metrics} ${layout.zones.metrics} ${layout.zones.collaboration}`;
    case 'card-flow':
      return `'metrics' auto 'raci collab' 1fr / ${layout.zones.raci} ${layout.zones.collaboration}`;
    case 'executive-dashboard':
      return `'metrics metrics' auto 'raci collab' 1fr / ${layout.zones.raci} ${layout.zones.collaboration}`;
    default:
      return `'raci' auto 'metrics' 1fr 'collab' auto / 1fr`;
  }
}
