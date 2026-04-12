# 角色指挥台 UI 重设计实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 SecuClaw UI 从传统安全仪表盘重新设计为角色指挥台模式，实现智能推荐条、三者融合角色指挥台、8角色差异化设计

**Architecture:** 
- 前端基于 LitElement + TypeScript，保持现有技术栈
- 角色主题系统通过 CSS 变量实现
- 智能推荐条作为顶部固定组件
- 角色指挥台为可切换视图，与统一总览共享数据层
- 推荐算法服务基于实时安全态势数据

**Tech Stack:** LitElement, TypeScript, CSS Variables, Lit Router (if exists)

---

## 文件结构

```
ui/src/ui/
├── components/
│   ├── sc-smart-recommendation-bar.ts    # 新增：智能推荐条
│   ├── sc-role-commander.ts              # 新增：角色指挥台主组件
│   ├── sc-raci-task-section.ts          # 新增：RACI任务区
│   ├── sc-role-metrics-section.ts        # 新增：专业指标区
│   ├── sc-role-collaboration-section.ts # 新增：协作指挥区
│   ├── sc-role-perspective-panel.ts     # 新增：角色视角面板
│   └── ...
├── config/
│   ├── role-themes.ts                   # 扩展：8角色完整主题配置
│   ├── role-layout-config.ts            # 新增：角色布局配置
│   └── role-dashboard-config.ts         # 已有：扩展角色指标
├── services/
│   └── recommendation-service.ts         # 新增：推荐算法服务
├── store/
│   └── role-context.ts                  # 扩展：场景状态管理
└── pages/
    └── sc-dashboard.ts                  # 修改：支持两种视图模式
```

---

## Task 1: 创建角色主题配置 (role-themes.ts)

**Files:**
- Create: `ui/src/ui/config/role-themes.ts`

- [ ] **Step 1: 创建 role-themes.ts 文件**

```typescript
// ui/src/ui/config/role-themes.ts

export type RoleId = 
  | 'security-expert' 
  | 'privacy-officer' 
  | 'security-architect' 
  | 'business-security-officer' 
  | 'secuclaw-commander' 
  | 'ciso' 
  | 'security-ops' 
  | 'supply-chain-security';

export interface RoleTheme {
  id: RoleId;
  name: string;
  nameCn: string;
  icon: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
  };
  backgroundPattern: string;
  animation: 'scan' | 'pulse' | 'flow' | 'build' | 'trend' | 'tactical' | 'steady' | 'chain';
  layout: 'grid' | 'card-flow' | 'three-column' | 'timeline' | 'war-room' | 'dashboard' | 'queue' | 'graph';
  description: string;
}

export const ROLE_THEMES: Record<RoleId, RoleTheme> = {
  'security-expert': {
    id: 'security-expert',
    name: 'Security Expert',
    nameCn: '安全专家',
    icon: '🛡️',
    colors: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#ef4444',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
    },
    backgroundPattern: '/patterns/circuit.svg',
    animation: 'scan',
    layout: 'grid',
    description: '漏洞管理、威胁检测、渗透测试',
  },
  'privacy-officer': {
    id: 'privacy-officer',
    name: 'Privacy Officer',
    nameCn: '隐私官',
    icon: '🔐',
    colors: {
      primary: '#7c3aed',
      secondary: '#a78bfa',
      accent: '#10b981',
      background: '#1a0a2e',
      surface: '#2d1b4e',
      text: '#f1f5f9',
      textSecondary: '#c4b5fd',
    },
    backgroundPattern: '/patterns/data-flow.svg',
    animation: 'flow',
    layout: 'card-flow',
    description: '隐私合规(GDPR/PIPL/CCPA)、数据保护',
  },
  'security-architect': {
    id: 'security-architect',
    name: 'Security Architect',
    nameCn: '安全架构师',
    icon: '🏗️',
    colors: {
      primary: '#0891b2',
      secondary: '#06b6d4',
      accent: '#f59e0b',
      background: '#0c1a2e',
      surface: '#162d4a',
      text: '#f1f5f9',
      textSecondary: '#7dd3fc',
    },
    backgroundPattern: '/patterns/grid.svg',
    animation: 'build',
    layout: 'three-column',
    description: '零信任架构、防御纵深、安全架构设计',
  },
  'business-security-officer': {
    id: 'business-security-officer',
    name: 'Business Security Officer',
    nameCn: '业务安全官',
    icon: '📊',
    colors: {
      primary: '#059669',
      secondary: '#10b981',
      accent: '#6366f1',
      background: '#0a1f1a',
      surface: '#143d2e',
      text: '#f1f5f9',
      textSecondary: '#6ee7b7',
    },
    backgroundPattern: '/patterns/business-curves.svg',
    animation: 'trend',
    layout: 'timeline',
    description: '业务连续性、灾难恢复、ROI分析',
  },
  'secuclaw-commander': {
    id: 'secuclaw-commander',
    name: 'SecuClaw Commander',
    nameCn: '安全指挥官',
    icon: '🎯',
    colors: {
      primary: '#dc2626',
      secondary: '#ef4444',
      accent: '#fbbf24',
      background: '#1a0a0a',
      surface: '#2d1a1a',
      text: '#f1f5f9',
      textSecondary: '#fca5a5',
    },
    backgroundPattern: '/patterns/tactical-map.svg',
    animation: 'tactical',
    layout: 'war-room',
    description: '全域安全指挥、跨角色协调、危机管理',
  },
  'ciso': {
    id: 'ciso',
    name: 'CISO',
    nameCn: '首席信息安全官',
    icon: '👔',
    colors: {
      primary: '#1e3a8a',
      secondary: '#3b82f6',
      accent: '#fbbf24',
      background: '#0a1628',
      surface: '#1e3a5f',
      text: '#f1f5f9',
      textSecondary: '#93c5fd',
    },
    backgroundPattern: '/patterns/executive-texture.svg',
    animation: 'steady',
    layout: 'dashboard',
    description: '安全战略、治理、预算管理、董事会汇报',
  },
  'security-ops': {
    id: 'security-ops',
    name: 'Security Ops',
    nameCn: '安全运营',
    icon: '⚙️',
    colors: {
      primary: '#ea580c',
      secondary: '#f97316',
      accent: '#fef08a',
      background: '#1a140a',
      surface: '#2d2416',
      text: '#f1f5f9',
      textSecondary: '#fdba74',
    },
    backgroundPattern: '/patterns/soc-monitor.svg',
    animation: 'pulse',
    layout: 'queue',
    description: 'SOC运营、SIEM/SOAR、事件响应',
  },
  'supply-chain-security': {
    id: 'supply-chain-security',
    name: 'Supply Chain Security',
    nameCn: '供应链安全',
    icon: '🔗',
    colors: {
      primary: '#65a30d',
      secondary: '#84cc16',
      accent: '#f97316',
      background: '#0f1a0a',
      surface: '#1f3516',
      text: '#f1f5f9',
      textSecondary: '#bef264',
    },
    backgroundPattern: '/patterns/supply-network.svg',
    animation: 'chain',
    layout: 'graph',
    description: '供应商评估、SBOM管理、第三方风险',
  },
};

export function getRoleTheme(roleId: RoleId): RoleTheme {
  return ROLE_THEMES[roleId] || ROLE_THEMES['security-expert'];
}
```

- [ ] **Step 2: 导出 RoleId 类型供其他组件使用**

```typescript
// 在文件末尾添加导出
export type { RoleId as SecurityRoleId };
```

---

## Task 2: 创建角色布局配置 (role-layout-config.ts)

**Files:**
- Create: `ui/src/ui/config/role-layout-config.ts`

- [ ] **Step 1: 创建 role-layout-config.ts**

```typescript
// ui/src/ui/config/role-layout-config.ts

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
```

---

## Task 3: 创建推荐算法服务 (recommendation-service.ts)

**Files:**
- Create: `ui/src/ui/services/recommendation-service.ts`

- [ ] **Step 1: 创建 recommendation-service.ts**

```typescript
// ui/src/ui/services/recommendation-service.ts

import type { RoleId } from '../config/role-themes.js';

export interface SecurityEvent {
  type: 'vulnerability' | 'incident' | 'compliance' | 'threat-intel' | 'supply-chain';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: number;
  relatedRole?: RoleId;
}

export interface Recommendation {
  id: string;
  type: 'role' | 'scenario';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  roleId?: RoleId;
  scenarioId?: string;
  action: {
    label: string;
    handler: () => void;
  };
  dismissible: boolean;
  createdAt: number;
}

export interface RecommendationContext {
  currentRole: RoleId | null;
  securityEvents: SecurityEvent[];
  activeIncidents: number;
  criticalVulnerabilities: number;
  pendingComplianceTasks: number;
  supplyChainAlerts: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

type RecommendationHandler = (context: RecommendationContext) => Recommendation[];

class RecommendationService {
  private handlers: Map<string, RecommendationHandler> = new Map();
  private recommendations: Recommendation[] = [];
  private listeners: Set<(recs: Recommendation[]) => void> = new Set();

  constructor() {
    this.registerDefaultHandlers();
  }

  private registerDefaultHandlers() {
    // 高危漏洞 → 推荐 security-expert
    this.registerHandler('vulnerability-critical', (ctx) => {
      if (ctx.criticalVulnerabilities > 0) {
        return [{
          id: `vuln-${Date.now()}`,
          type: 'role' as const,
          priority: 'high' as const,
          title: '发现高危漏洞',
          description: `当前有 ${ctx.criticalVulnerabilities} 个高危漏洞需要处理`,
          roleId: 'security-expert' as RoleId,
          scenarioId: 'vulnerability-response',
          action: {
            label: '进入漏洞响应',
            handler: () => console.log('Navigate to vulnerability response'),
          },
          dismissible: true,
          createdAt: Date.now(),
        }];
      }
      return [];
    });

    // 大规模安全事件 → 推荐 secuclaw-commander
    this.registerHandler('incident-massive', (ctx) => {
      if (ctx.activeIncidents > 5) {
        return [{
          id: `incident-${Date.now()}`,
          type: 'role' as const,
          priority: 'high' as const,
          title: '多起活跃安全事件',
          description: `当前有 ${ctx.activeIncidents} 起活跃安全事件需要协调`,
          roleId: 'secuclaw-commander' as RoleId,
          scenarioId: 'crisis-management',
          action: {
            label: '进入危机管理',
            handler: () => console.log('Navigate to crisis management'),
          },
          dismissible: true,
          createdAt: Date.now(),
        }];
      }
      return [];
    });

    // 合规审计周期 → 推荐 privacy-officer
    this.registerHandler('compliance-audit', (ctx) => {
      if (ctx.pendingComplianceTasks > 3) {
        return [{
          id: `compliance-${Date.now()}`,
          type: 'scenario' as const,
          priority: 'medium' as const,
          title: '合规审计周期',
          description: `当前有 ${ctx.pendingComplianceTasks} 项合规任务待处理`,
          roleId: 'privacy-officer' as RoleId,
          scenarioId: 'compliance-audit',
          action: {
            label: '进入合规审计',
            handler: () => console.log('Navigate to compliance audit'),
          },
          dismissible: true,
          createdAt: Date.now(),
        }];
      }
      return [];
    });

    // 供应链告警 → 推荐 supply-chain-security
    this.registerHandler('supply-chain-alert', (ctx) => {
      if (ctx.supplyChainAlerts > 0) {
        return [{
          id: `supply-${Date.now()}`,
          type: 'role' as const,
          priority: 'medium' as const,
          title: '供应链安全告警',
          description: `当前有 ${ctx.supplyChainAlerts} 项供应链告警需要处理`,
          roleId: 'supply-chain-security' as RoleId,
          scenarioId: 'supply-chain-review',
          action: {
            label: '进入供应链审查',
            handler: () => console.log('Navigate to supply chain review'),
          },
          dismissible: true,
          createdAt: Date.now(),
        }];
      }
      return [];
    });
  }

  registerHandler(id: string, handler: RecommendationHandler) {
    this.handlers.set(id, handler);
  }

  async generateRecommendations(context: RecommendationContext): Promise<Recommendation[]> {
    const results: Recommendation[] = [];
    
    for (const handler of this.handlers.values()) {
      try {
        const recs = handler(context);
        results.push(...recs);
      } catch (e) {
        console.error('Recommendation handler error:', e);
      }
    }

    // 按优先级排序
    results.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // 只保留前3个
    this.recommendations = results.slice(0, 3);
    this.notifyListeners();
    
    return this.recommendations;
  }

  dismissRecommendation(id: string) {
    this.recommendations = this.recommendations.filter(r => r.id !== id);
    this.notifyListeners();
  }

  subscribe(listener: (recs: Recommendation[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.recommendations);
    }
  }

  getCurrentRecommendations(): Recommendation[] {
    return this.recommendations;
  }
}

export const recommendationService = new RecommendationService();
```

---

## Task 4: 创建智能推荐条组件 (sc-smart-recommendation-bar.ts)

**Files:**
- Create: `ui/src/ui/components/sc-smart-recommendation-bar.ts`

- [ ] **Step 1: 创建智能推荐条组件**

```typescript
// ui/src/ui/components/sc-smart-recommendation-bar.ts

import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { recommendationService, type Recommendation } from '../services/recommendation-service.js';
import { roleContext } from '../store/role-context.js';
import { ROLE_THEMES, type RoleId } from '../config/role-themes.js';

@customElement('sc-smart-recommendation-bar')
export class ScSmartRecommendationBar extends LitElement {
  @state() private recommendations: Recommendation[] = [];
  @state() private collapsed = false;
  @state() private expanded = false;

  private unsubscribe?: () => void;

  static styles = css`
    :host {
      display: block;
      position: sticky;
      top: 0;
      z-index: 1000;
      background: linear-gradient(90deg, var(--rec-bg-start, #1e293b), var(--rec-bg-end, #0f172a));
      border-bottom: 1px solid var(--sc-border-color, #334155);
      transition: all 0.3s ease;
    }

    :host([collapsed]) {
      height: 32px;
      overflow: hidden;
    }

    .bar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      min-height: 48px;
    }

    .toggle-btn {
      background: none;
      border: none;
      color: var(--sc-text-secondary, #94a3b8);
      cursor: pointer;
      padding: 4px 8px;
      font-size: 14px;
      transition: color 0.2s;
    }

    .toggle-btn:hover {
      color: var(--sc-text-primary, #f1f5f9);
    }

    .rec-icon {
      font-size: 16px;
    }

    .rec-list {
      display: flex;
      flex: 1;
      gap: 12px;
      overflow-x: auto;
    }

    .rec-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 6px;
      background: var(--rec-item-bg, rgba(255,255,255,0.1));
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      border: 1px solid transparent;
    }

    .rec-item:hover {
      background: var(--rec-item-hover-bg, rgba(255,255,255,0.15));
      border-color: var(--rec-accent, #3b82f6);
    }

    .rec-item.high {
      --rec-accent: #ef4444;
      --rec-bg-start: #1a0a0a;
      --rec-bg-end: #2d1a1a;
    }

    .rec-item.medium {
      --rec-accent: #f59e0b;
      --rec-bg-start: #1a140a;
      --rec-bg-end: #2d2416;
    }

    .rec-item.low {
      --rec-accent: #3b82f6;
      --rec-bg-start: #0a1628;
      --rec-bg-end: #1e3a5f;
    }

    .rec-priority {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .rec-priority.high {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }

    .rec-priority.medium {
      background: rgba(245, 158, 11, 0.2);
      color: #f59e0b;
    }

    .rec-priority.low {
      background: rgba(59, 130, 246, 0.2);
      color: #3b82f6;
    }

    .rec-content {
      display: flex;
      flex-direction: column;
    }

    .rec-title {
      font-size: 13px;
      font-weight: 500;
      color: var(--sc-text-primary, #f1f5f9);
    }

    .rec-description {
      font-size: 11px;
      color: var(--sc-text-secondary, #94a3b8);
    }

    .rec-action {
      font-size: 12px;
      padding: 4px 8px;
      background: var(--rec-accent, #3b82f6);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .rec-action:hover {
      opacity: 0.9;
    }

    .rec-dismiss {
      background: none;
      border: none;
      color: var(--sc-text-tertiary, #64748b);
      cursor: pointer;
      padding: 4px;
      font-size: 12px;
    }

    .rec-dismiss:hover {
      color: var(--sc-text-secondary, #94a3b8);
    }

    .role-badge {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
    }

    .empty-state {
      color: var(--sc-text-tertiary, #64748b);
      font-size: 13px;
      padding: 4px 0;
    }

    .collapse-indicator {
      color: var(--sc-text-tertiary, #64748b);
      font-size: 12px;
      cursor: pointer;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.unsubscribe = recommendationService.subscribe((recs) => {
      this.recommendations = recs;
    });
    this.loadRecommendations();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribe?.();
  }

  private async loadRecommendations() {
    const context = await this.buildContext();
    await recommendationService.generateRecommendations(context);
  }

  private async buildContext() {
    const roleState = roleContext.getState();
    
    return {
      currentRole: roleState.currentRole as RoleId | null,
      securityEvents: [],
      activeIncidents: 12, // TODO: 从 store 获取真实数据
      criticalVulnerabilities: 5, // TODO: 从 store 获取真实数据
      pendingComplianceTasks: 3, // TODO: 从 store 获取真实数据
      supplyChainAlerts: 2, // TODO: 从 store 获取真实数据
      timeOfDay: this.getTimeOfDay() as 'morning' | 'afternoon' | 'evening' | 'night',
    };
  }

  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  private handleRecommendationClick(rec: Recommendation) {
    if (rec.roleId) {
      roleContext.setRole(rec.roleId);
    }
    rec.action.handler();
  }

  private handleDismiss(e: Event, id: string) {
    e.stopPropagation();
    recommendationService.dismissRecommendation(id);
  }

  private toggleCollapse() {
    this.collapsed = !this.collapsed;
    if (this.collapsed) {
      this.setAttribute('collapsed', '');
    } else {
      this.removeAttribute('collapsed');
    }
  }

  private getRoleIcon(roleId?: RoleId): string {
    if (!roleId) return '🤖';
    return ROLE_THEMES[roleId]?.icon || '🤖';
  }

  private getRoleColor(roleId?: RoleId): string {
    if (!roleId) return '#3b82f6';
    return ROLE_THEMES[roleId]?.colors.primary || '#3b82f6';
  }

  render() {
    return html`
      <div class="bar">
        <button class="toggle-btn" @click=${this.toggleCollapse}>
          ${this.collapsed ? '▶' : '▼'}
        </button>
        
        <span class="rec-icon">🔍</span>
        
        <div class="rec-list">
          ${this.recommendations.length === 0 
            ? html`<span class="empty-state">暂无推荐</span>`
            : this.recommendations.map(rec => html`
              <div 
                class="rec-item ${rec.priority}"
                @click=${() => this.handleRecommendationClick(rec)}
              >
                <span 
                  class="role-badge" 
                  style="background: ${this.getRoleColor(rec.roleId)}20; color: ${this.getRoleColor(rec.roleId)}"
                >
                  ${this.getRoleIcon(rec.roleId)}
                </span>
                <span class="rec-priority ${rec.priority}">${rec.priority}</span>
                <div class="rec-content">
                  <span class="rec-title">${rec.title}</span>
                  <span class="rec-description">${rec.description}</span>
                </div>
                <button class="rec-action" @click=${(e: Event) => { e.stopPropagation(); rec.action.handler(); }}>
                  ${rec.action.label}
                </button>
                ${rec.dismissible ? html`
                  <button class="rec-dismiss" @click=${(e: Event) => this.handleDismiss(e, rec.id)}>
                    ✕
                  </button>
                ` : ''}
              </div>
            `)
          }
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-smart-recommendation-bar': ScSmartRecommendationBar;
  }
}
```

---

## Task 5: 创建 RACI 任务区组件 (sc-raci-task-section.ts)

**Files:**
- Create: `ui/src/ui/components/sc-raci-task-section.ts`

- [ ] **Step 1: 创建 sc-raci-task-section.ts**

```typescript
// ui/src/ui/components/sc-raci-task-section.ts

import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { RoleId } from '../config/role-themes.js';

export interface RaciTask {
  id: string;
  type: 'R' | 'A' | 'C' | 'I';
  title: string;
  description: string;
  scenario: string;
  status: 'pending' | 'in-progress' | 'completed';
  dueDate?: number;
  assignees: RoleId[];
}

@customElement('sc-raci-task-section')
export class ScRaciTaskSection extends LitElement {
  @state() private tasks: RaciTask[] = [];
  @state() private expandedType: 'R' | 'A' | 'C' | 'I' | null = null;

  static styles = css`
    :host {
      display: block;
    }

    .raci-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .raci-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--sc-text-primary, #f1f5f9);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .raci-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }

    @media (max-width: 768px) {
      .raci-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .raci-card {
      background: var(--sc-bg-card, #1e293b);
      border: 1px solid var(--sc-border-color, #334155);
      border-radius: 8px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .raci-card:hover {
      border-color: var(--role-primary, #3b82f6);
      transform: translateY(-2px);
    }

    .raci-card.R {
      border-left: 3px solid #3b82f6;
    }

    .raci-card.A {
      border-left: 3px solid #ef4444;
    }

    .raci-card.C {
      border-left: 3px solid #10b981;
    }

    .raci-card.I {
      border-left: 3px solid #f59e0b;
    }

    .raci-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .raci-type-badge {
      font-size: 12px;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 4px;
    }

    .raci-type-badge.R {
      background: rgba(59, 130, 246, 0.2);
      color: #3b82f6;
    }

    .raci-type-badge.A {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }

    .raci-type-badge.C {
      background: rgba(16, 185, 129, 0.2);
      color: #10b981;
    }

    .raci-type-badge.I {
      background: rgba(245, 158, 11, 0.2);
      color: #f59e0b;
    }

    .raci-count {
      font-size: 24px;
      font-weight: 700;
      color: var(--sc-text-primary, #f1f5f9);
    }

    .raci-type-label {
      font-size: 13px;
      color: var(--sc-text-secondary, #94a3b8);
      margin-top: 4px;
    }

    .raci-type-full {
      font-size: 12px;
      color: var(--sc-text-tertiary, #64748b);
      margin-top: 2px;
    }

    .task-list {
      margin-top: 16px;
      max-height: 300px;
      overflow-y: auto;
    }

    .task-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      background: var(--sc-bg-secondary, #0f172a);
      border-radius: 6px;
      margin-bottom: 8px;
    }

    .task-status {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-top: 6px;
      flex-shrink: 0;
    }

    .task-status.pending { background: #f59e0b; }
    .task-status.in-progress { background: #3b82f6; }
    .task-status.completed { background: #10b981; }

    .task-content {
      flex: 1;
    }

    .task-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--sc-text-primary, #f1f5f9);
    }

    .task-description {
      font-size: 12px;
      color: var(--sc-text-secondary, #94a3b8);
      margin-top: 4px;
    }

    .task-scenario {
      font-size: 11px;
      color: var(--sc-text-tertiary, #64748b);
      margin-top: 4px;
      padding: 2px 6px;
      background: var(--sc-bg-tertiary, #1e293b);
      border-radius: 4px;
      display: inline-block;
    }

    .task-actions {
      display: flex;
      gap: 8px;
    }

    .task-action-btn {
      background: none;
      border: 1px solid var(--sc-border-color, #334155);
      color: var(--sc-text-secondary, #94a3b8);
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s;
    }

    .task-action-btn:hover {
      border-color: var(--role-primary, #3b82f6);
      color: var(--role-primary, #3b82f6);
    }
  `;

  setTasks(tasks: RaciTask[]) {
    this.tasks = tasks;
    this.requestUpdate();
  }

  private getTasksByType(type: 'R' | 'A' | 'C' | 'I'): RaciTask[] {
    return this.tasks.filter(t => t.type === type);
  }

  private getTypeLabel(type: 'R' | 'A' | 'C' | 'I'): string {
    const labels = {
      R: '执行',
      A: '审批',
      C: '咨询',
      I: '通知'
    };
    return labels[type];
  }

  private getTypeFullLabel(type: 'R' | 'A' | 'C' | 'I'): string {
    const labels = {
      R: 'Responsible - 执行/做事',
      A: 'Accountable - 负责/拍板',
      C: 'Consulted - 咨询/征求意见',
      I: 'Informed - 通知/知晓结果'
    };
    return labels[type];
  }

  private toggleExpanded(type: 'R' | 'A' | 'C' | 'I') {
    this.expandedType = this.expandedType === type ? null : type;
  }

  private handleTaskAction(task: RaciTask, action: string) {
    this.dispatchEvent(new CustomEvent('task-action', {
      detail: { task, action },
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    const types: Array<'R' | 'A' | 'C' | 'I'> = ['R', 'A', 'C', 'I'];

    return html`
      <div class="raci-header">
        <h3 class="raci-title">
          <span>🎯</span>
          RACI 任务概览
        </h3>
      </div>

      <div class="raci-grid">
        ${types.map(type => {
          const tasks = this.getTasksByType(type);
          const isExpanded = this.expandedType === type;
          
          return html`
            <div class="raci-card ${type}" @click=${() => this.toggleExpanded(type)}>
              <div class="raci-card-header">
                <span class="raci-type-badge ${type}">${type}</span>
                <span class="raci-count">${tasks.length}</span>
              </div>
              <div class="raci-type-label">${this.getTypeLabel(type)}</div>
              <div class="raci-type-full">${this.getTypeFullLabel(type)}</div>
            </div>
          `;
        })}
      </div>

      ${this.expandedType ? html`
        <div class="task-list">
          <h4 style="color: var(--sc-text-primary); margin-bottom: 12px;">
            ${this.getTypeLabel(this.expandedType)} 任务详情
          </h4>
          ${this.getTasksByType(this.expandedType).map(task => html`
            <div class="task-item">
              <div class="task-status ${task.status}"></div>
              <div class="task-content">
                <div class="task-title">${task.title}</div>
                <div class="task-description">${task.description}</div>
                <span class="task-scenario">${task.scenario}</span>
              </div>
              <div class="task-actions">
                ${this.expandedType === 'R' ? html`
                  <button class="task-action-btn" @click=${(e: Event) => { e.stopPropagation(); this.handleTaskAction(task, 'execute'); }}>
                    执行
                  </button>
                ` : ''}
                ${this.expandedType === 'A' ? html`
                  <button class="task-action-btn" @click=${(e: Event) => { e.stopPropagation(); this.handleTaskAction(task, 'approve'); }}>
                    审批
                  </button>
                  <button class="task-action-btn" @click=${(e: Event) => { e.stopPropagation(); this.handleTaskAction(task, 'reject'); }}>
                    驳回
                  </button>
                ` : ''}
                ${this.expandedType === 'C' ? html`
                  <button class="task-action-btn" @click=${(e: Event) => { e.stopPropagation(); this.handleTaskAction(task, 'respond'); }}>
                    回复
                  </button>
                ` : ''}
                ${this.expandedType === 'I' ? html`
                  <button class="task-action-btn" @click=${(e: Event) => { e.stopPropagation(); this.handleTaskAction(task, 'acknowledge'); }}>
                    确认
                  </button>
                ` : ''}
              </div>
            </div>
          `)}
        </div>
      ` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-raci-task-section': ScRaciTaskSection;
  }
}
```

---

## Task 6: 创建角色指挥台主组件 (sc-role-commander.ts)

**Files:**
- Create: `ui/src/ui/components/sc-role-commander.ts`

- [ ] **Step 1: 创建 sc-role-commander.ts**

```typescript
// ui/src/ui/components/sc-role-commander.ts

import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { roleContext } from '../store/role-context.js';
import { ROLE_THEMES, type RoleId } from '../config/role-themes.js';
import { getRoleLayoutConfig, type RoleLayoutConfig } from '../config/role-layout-config.js';
import type { RaciTask } from './sc-raci-task-section.js';

import './sc-raci-task-section.js';
import './sc-role-metrics-section.js';
import './sc-role-collaboration-section.js';

@customElement('sc-role-commander')
export class ScRoleCommander extends LitElement {
  @state() private currentRole: RoleId = 'security-expert';
  @state() private layoutConfig: RoleLayoutConfig | null = null;
  @state() private raciTasks: RaciTask[] = [];

  private unsubscribe?: () => void;

  static styles = css`
    :host {
      display: block;
      min-height: 100%;
    }

    .commander-container {
      padding: 20px;
      background: var(--role-background, var(--sc-bg-primary, #0f172a));
      min-height: calc(100vh - 48px);
      transition: background 0.3s ease;
    }

    .commander-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--sc-border-color, #334155);
    }

    .role-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .role-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      background: var(--role-primary, #3b82f6);
      box-shadow: 0 4px 12px var(--role-primary, #3b82f6);
    }

    .role-details {
      display: flex;
      flex-direction: column;
    }

    .role-name {
      font-size: 24px;
      font-weight: 700;
      color: var(--sc-text-primary, #f1f5f9);
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .role-name-cn {
      font-size: 14px;
      color: var(--sc-text-secondary, #94a3b8);
      margin-top: 4px;
    }

    .role-description {
      font-size: 13px;
      color: var(--sc-text-tertiary, #64748b);
      margin-top: 8px;
      max-width: 600px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .action-btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid var(--sc-border-color, #334155);
      background: var(--sc-bg-card, #1e293b);
      color: var(--sc-text-primary, #f1f5f9);
    }

    .action-btn:hover {
      border-color: var(--role-primary, #3b82f6);
      color: var(--role-primary, #3b82f6);
    }

    .action-btn.primary {
      background: var(--role-primary, #3b82f6);
      border-color: var(--role-primary, #3b82f6);
      color: white;
    }

    .action-btn.primary:hover {
      opacity: 0.9;
    }

    .commander-content {
      display: grid;
      gap: 20px;
    }

    .content-grid {
      display: grid;
      gap: 20px;
    }

    .content-grid.grid-3col {
      grid-template-columns: repeat(3, 1fr);
    }

    .content-grid.grid-2col {
      grid-template-columns: repeat(2, 1fr);
    }

    .content-grid.war-room {
      grid-template-columns: 1fr 1fr;
      grid-template-rows: auto auto;
    }

    .war-room .section-full {
      grid-column: 1 / -1;
    }

    .section-card {
      background: var(--sc-bg-card, #1e293b);
      border: 1px solid var(--sc-border-color, #334155);
      border-radius: 12px;
      padding: 20px;
      position: relative;
      overflow: hidden;
    }

    .section-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: var(--role-primary, #3b82f6);
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--sc-text-primary, #f1f5f9);
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-icon {
      font-size: 18px;
    }

    .back-to-overview {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: var(--sc-bg-card, #1e293b);
      border: 1px solid var(--sc-border-color, #334155);
      border-radius: 6px;
      color: var(--sc-text-secondary, #94a3b8);
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .back-to-overview:hover {
      border-color: var(--role-primary, #3b82f6);
      color: var(--role-primary, #3b82f6);
    }

    @media (max-width: 1024px) {
      .content-grid.grid-3col,
      .content-grid.grid-2col {
        grid-template-columns: 1fr;
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.unsubscribe = roleContext.subscribe((state) => {
      if (state.currentRole) {
        this.currentRole = state.currentRole as RoleId;
        this.layoutConfig = getRoleLayoutConfig(this.currentRole);
        this.applyTheme();
        this.loadRoleData();
      }
    });
    
    // 初始化
    const state = roleContext.getState();
    if (state.currentRole) {
      this.currentRole = state.currentRole as RoleId;
      this.layoutConfig = getRoleLayoutConfig(this.currentRole);
      this.applyTheme();
      this.loadRoleData();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribe?.();
  }

  private applyTheme() {
    const theme = ROLE_THEMES[this.currentRole];
    if (!theme) return;

    const root = this.shadowRoot?.host;
    if (!root) return;

    root.style.setProperty('--role-primary', theme.colors.primary);
    root.style.setProperty('--role-secondary', theme.colors.secondary);
    root.style.setProperty('--role-accent', theme.colors.accent);
    root.style.setProperty('--role-background', theme.colors.background);
    root.style.setProperty('--role-surface', theme.colors.surface);
  }

  private async loadRoleData() {
    // TODO: 从后端或 store 加载该角色的真实数据
    // 目前使用 mock 数据
    this.raciTasks = this.generateMockRaciTasks();
  }

  private generateMockRaciTasks(): RaciTask[] {
    return [
      { id: '1', type: 'R', title: '处理 CVE-2024-XXXX 漏洞', description: '高危漏洞需要紧急修复', scenario: '漏洞管理', status: 'pending', assignees: ['security-expert'] },
      { id: '2', type: 'R', title: '完成渗透测试报告', description: 'Q1 季度渗透测试结果整理', scenario: '安全评估', status: 'in-progress', assignees: ['security-expert'] },
      { id: '3', type: 'A', title: '审批漏洞修复方案', description: '等待审批高危漏洞修复方案', scenario: '漏洞管理', status: 'pending', assignees: ['security-architect'] },
      { id: '4', type: 'C', title: '零信任架构评审', description: '需要安全架构师提供技术意见', scenario: '架构评审', status: 'pending', assignees: ['security-architect'] },
      { id: '5', type: 'I', title: 'SOC 日报', description: '今日 SOC 运营概况已生成', scenario: '安全运营', status: 'completed', assignees: ['security-ops'] },
    ];
  }

  private goBackToOverview() {
    this.dispatchEvent(new CustomEvent('back-to-overview', {
      bubbles: true,
      composed: true,
    }));
  }

  private handleTaskAction(e: CustomEvent) {
    const { task, action } = e.detail;
    console.log('Task action:', task, action);
    // TODO: 调用后端 API 处理任务
  }

  private renderSection(section: any) {
    switch (section.type) {
      case 'raci':
        return html`
          <div class="section-card">
            <sc-raci-task-section 
              @task-action=${this.handleTaskAction}
            ></sc-raci-task-section>
          </div>
        `;
      case 'metrics':
        return html`
          <div class="section-card">
            <sc-role-metrics-section 
              .title=${section.title}
              .roleId=${this.currentRole}
            ></sc-role-metrics-section>
          </div>
        `;
      case 'collaboration':
        return html`
          <div class="section-card">
            <sc-role-collaboration-section 
              .roleId=${this.currentRole}
            ></sc-role-collaboration-section>
          </div>
        `;
      default:
        return html`<div class="section-card">${section.title}</div>`;
    }
  }

  render() {
    const theme = ROLE_THEMES[this.currentRole];
    
    return html`
      <div class="commander-container">
        <div class="commander-header">
          <div class="role-info">
            <div class="role-icon">${theme?.icon || '🛡️'}</div>
            <div class="role-details">
              <div class="role-name">
                ${theme?.name || 'Security Expert'}
                <span style="font-size: 14px; color: var(--sc-text-secondary);">|</span>
                <span style="font-size: 18px;">${theme?.nameCn || '安全专家'}</span>
              </div>
              <div class="role-description">${theme?.description || ''}</div>
            </div>
          </div>
          
          <div class="header-actions">
            <button class="back-to-overview" @click=${this.goBackToOverview}>
              ← 返回总览
            </button>
            <button class="action-btn">📤 导出报告</button>
            <button class="action-btn primary">⚡ 快速操作</button>
          </div>
        </div>

        <div class="commander-content">
          <div class="content-grid ${this.layoutConfig?.layoutType || 'grid'}">
            ${this.layoutConfig?.sections.map(section => {
              const sizeClass = section.size === 'full' ? 'section-full' : '';
              return html`
                <div class="${sizeClass}">
                  ${this.renderSection(section)}
                </div>
              `;
            })}
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-role-commander': ScRoleCommander;
  }
}
```

---

## Task 7: 创建专业指标区组件 (sc-role-metrics-section.ts)

**Files:**
- Create: `ui/src/ui/components/sc-role-metrics-section.ts`

- [ ] **Step 1: 创建 sc-role-metrics-section.ts**

```typescript
// ui/src/ui/components/sc-role-metrics-section.ts

import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { RoleId } from '../config/role-themes.js';
import { ROLE_THEMES } from '../config/role-themes.js';

export interface MetricCard {
  id: string;
  label: string;
  value: number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  status?: 'healthy' | 'warning' | 'critical';
  sparkline?: number[];
}

@customElement('sc-role-metrics-section')
export class ScRoleMetricsSection extends LitElement {
  @state() private metrics: MetricCard[] = [];
  
  private _title = '';
  private _roleId: RoleId = 'security-expert';

  static styles = css`
    :host {
      display: block;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--sc-text-primary, #f1f5f9);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-icon {
      font-size: 16px;
    }

    .view-all-btn {
      background: none;
      border: none;
      color: var(--role-primary, #3b82f6);
      font-size: 12px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .view-all-btn:hover {
      background: rgba(59, 130, 246, 0.1);
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
    }

    .metric-card {
      background: var(--sc-bg-secondary, #0f172a);
      border-radius: 8px;
      padding: 16px;
      transition: all 0.2s;
      cursor: pointer;
    }

    .metric-card:hover {
      background: var(--sc-bg-tertiary, #1e293b);
      transform: translateY(-2px);
    }

    .metric-label {
      font-size: 12px;
      color: var(--sc-text-secondary, #94a3b8);
      margin-bottom: 8px;
    }

    .metric-value-row {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .metric-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--sc-text-primary, #f1f5f9);
    }

    .metric-unit {
      font-size: 14px;
      color: var(--sc-text-tertiary, #64748b);
    }

    .metric-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 8px;
      font-size: 12px;
    }

    .metric-trend.up {
      color: #10b981;
    }

    .metric-trend.down {
      color: #ef4444;
    }

    .metric-trend.stable {
      color: #94a3b8;
    }

    .metric-sparkline {
      margin-top: 12px;
      height: 32px;
    }

    .sparkline-path {
      fill: none;
      stroke: var(--role-primary, #3b82f6);
      stroke-width: 2;
    }

    .sparkline-area {
      fill: var(--role-primary, #3b82f6);
      opacity: 0.1;
    }

    .metric-status {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      margin-top: 8px;
    }

    .metric-status.healthy {
      background: rgba(16, 185, 129, 0.2);
      color: #10b981;
    }

    .metric-status.warning {
      background: rgba(245, 158, 11, 0.2);
      color: #f59e0b;
    }

    .metric-status.critical {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }
  `;

  set title(val: string) {
    this._title = val;
    this.requestUpdate();
  }

  set roleId(val: RoleId) {
    this._roleId = val;
    this.loadMetrics();
    this.requestUpdate();
  }

  private async loadMetrics() {
    // TODO: 从后端获取该角色的真实指标数据
    // 目前使用 mock 数据
    this.metrics = this.getMockMetrics();
  }

  private getMockMetrics(): MetricCard[] {
    const baseMetrics: Record<RoleId, MetricCard[]> = {
      'security-expert': [
        { id: 'total-vulns', label: '漏洞总数', value: 127, unit: '个', trend: 'down', trendValue: '-12', status: 'warning', sparkline: [45, 52, 38, 65, 42, 55, 38] },
        { id: 'critical-vulns', label: '严重漏洞', value: 5, unit: '个', trend: 'down', trendValue: '-2', status: 'critical', sparkline: [8, 7, 6, 9, 7, 5, 5] },
        { id: 'patch-coverage', label: '补丁覆盖率', value: 87, unit: '%', trend: 'up', trendValue: '+3%', status: 'healthy', sparkline: [82, 84, 85, 83, 86, 85, 87] },
        { id: 'cvss-high', label: '高危CVSS', value: 23, unit: '个', trend: 'stable', trendValue: '0', status: 'warning', sparkline: [25, 22, 24, 23, 21, 23, 23] },
      ],
      'privacy-officer': [
        { id: 'compliance-rate', label: '合规率', value: 92, unit: '%', trend: 'up', trendValue: '+5%', status: 'healthy', sparkline: [85, 87, 89, 88, 90, 91, 92] },
        { id: 'data-breaches', label: '数据泄露事件', value: 0, unit: '个', trend: 'stable', trendValue: '0', status: 'healthy', sparkline: [2, 1, 1, 0, 0, 0, 0] },
        { id: 'dpia-completed', label: '已完成DPIA', value: 45, unit: '个', trend: 'up', trendValue: '+8', status: 'healthy', sparkline: [30, 35, 38, 40, 42, 44, 45] },
        { id: 'consent-rate', label: '同意率', value: 94, unit: '%', trend: 'stable', trendValue: '0', status: 'healthy', sparkline: [93, 94, 93, 95, 94, 94, 94] },
      ],
      'secuclaw-commander': [
        { id: 'total-alerts', label: '总告警数', value: 1567, unit: '个', trend: 'down', trendValue: '-23%', status: 'warning', sparkline: [2000, 1890, 1750, 1680, 1590, 1580, 1567] },
        { id: 'security-score', label: '安全评分', value: 85, unit: '分', trend: 'up', trendValue: '+3', status: 'healthy', sparkline: [78, 80, 81, 82, 83, 84, 85] },
        { id: 'coverage-rate', label: '覆盖率', value: 92, unit: '%', trend: 'up', trendValue: '+2%', status: 'healthy', sparkline: [88, 89, 90, 90, 91, 91, 92] },
        { id: 'automation-rate', label: '自动化率', value: 78, unit: '%', trend: 'up', trendValue: '+5%', status: 'healthy', sparkline: [65, 68, 70, 72, 74, 76, 78] },
      ],
      'ciso': [
        { id: 'risk-score', label: '风险评分', value: 68, unit: '分', trend: 'down', trendValue: '-5', status: 'warning', sparkline: [78, 75, 73, 71, 70, 69, 68] },
        { id: 'budget-utilization', label: '预算使用率', value: 65, unit: '%', trend: 'stable', trendValue: '0', status: 'healthy', sparkline: [60, 62, 63, 64, 65, 65, 65] },
        { id: 'kpi-compliance', label: 'KPI达成率', value: 88, unit: '%', trend: 'up', trendValue: '+3%', status: 'healthy', sparkline: [82, 84, 85, 86, 86, 87, 88] },
        { id: 'maturity-score', label: '成熟度评分', value: 3.8, unit: '/5', trend: 'up', trendValue: '+0.2', status: 'healthy', sparkline: [3.4, 3.5, 3.5, 3.6, 3.7, 3.7, 3.8] },
      ],
      'security-ops': [
        { id: 'open-alerts', label: '待处理告警', value: 45, unit: '个', trend: 'down', trendValue: '-12', status: 'warning', sparkline: [78, 65, 58, 52, 49, 57, 45] },
        { id: 'false-positive-rate', label: '误报率', value: 12, unit: '%', trend: 'down', trendValue: '-3%', status: 'healthy', sparkline: [18, 16, 15, 14, 13, 13, 12] },
        { id: 'escalation-rate', label: '升级率', value: 8, unit: '%', trend: 'stable', trendValue: '0', status: 'healthy', sparkline: [9, 8, 9, 8, 7, 8, 8] },
        { id: 'response-time', label: '平均响应时间', value: 12, unit: '分钟', trend: 'down', trendValue: '-3分钟', status: 'healthy', sparkline: [18, 16, 15, 14, 13, 13, 12] },
      ],
      'supply-chain-security': [
        { id: 'vendor-risks', label: '供应商风险数', value: 23, unit: '个', trend: 'up', trendValue: '+5', status: 'warning', sparkline: [15, 16, 18, 19, 20, 22, 23] },
        { id: 'critical-vendors', label: '关键供应商', value: 8, unit: '家', trend: 'stable', trendValue: '0', status: 'healthy', sparkline: [8, 8, 8, 8, 8, 8, 8] },
        { id: 'sbom-coverage', label: 'SBOM覆盖率', value: 76, unit: '%', trend: 'up', trendValue: '+8%', status: 'warning', sparkline: [55, 60, 65, 68, 70, 73, 76] },
        { id: 'license-risks', label: '许可证风险', value: 5, unit: '个', trend: 'down', trendValue: '-2', status: 'healthy', sparkline: [12, 10, 9, 8, 7, 7, 5] },
      ],
      'security-architect': [
        { id: 'design-risks', label: '架构风险数', value: 12, unit: '个', trend: 'down', trendValue: '-3', status: 'warning', sparkline: [20, 18, 17, 15, 14, 13, 12] },
        { id: 'threat-coverage', label: '威胁覆盖率', value: 89, unit: '%', trend: 'up', trendValue: '+2%', status: 'healthy', sparkline: [82, 84, 85, 86, 87, 88, 89] },
        { id: 'security-controls', label: '安全控制数', value: 156, unit: '个', trend: 'up', trendValue: '+12', status: 'healthy', sparkline: [130, 135, 140, 145, 148, 152, 156] },
        { id: 'technical-debt', label: '技术债务', value: 18, unit: '项', trend: 'down', trendValue: '-4', status: 'warning', sparkline: [30, 28, 25, 23, 22, 20, 18] },
      ],
      'business-security-officer': [
        { id: 'business-impact', label: '业务影响事件', value: 3, unit: '个', trend: 'down', trendValue: '-2', status: 'healthy', sparkline: [8, 7, 6, 5, 4, 5, 3] },
        { id: 'recovery-time', label: '平均恢复时间', value: 2.5, unit: '小时', trend: 'down', trendValue: '-0.5h', status: 'healthy', sparkline: [4.5, 4.0, 3.5, 3.2, 3.0, 2.8, 2.5] },
        { id: 'continuity-score', label: '连续性评分', value: 94, unit: '%', trend: 'up', trendValue: '+2%', status: 'healthy', sparkline: [88, 90, 91, 92, 92, 93, 94] },
        { id: 'risk-accepted', label: '已接受风险', value: 5, unit: '个', trend: 'stable', trendValue: '0', status: 'warning', sparkline: [5, 5, 6, 5, 5, 5, 5] },
      ],
    };

    return baseMetrics[this._roleId] || baseMetrics['security-expert'];
  }

  private renderSparkline(data: number[]): string {
    if (!data || data.length === 0) return '';
    
    const width = 100;
    const height = 32;
    const padding = 2;
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    const points = data.map((val, i) => {
      const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((val - min) / range) * (height - 2 * padding);
      return `${x},${y}`;
    });
    
    const areaPoints = [
      `${padding},${height - padding}`,
      ...points,
      `${width - padding},${height - padding}`
    ];
    
    return `M ${points.join(' L ')}`;
  }

  private renderSparklineArea(data: number[]): string {
    if (!data || data.length === 0) return '';
    
    const width = 100;
    const height = 32;
    const padding = 2;
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    const points = data.map((val, i) => {
      const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((val - min) / range) * (height - 2 * padding);
      return `${x},${y}`;
    });
    
    const areaPoints = [
      `${padding},${height - padding}`,
      ...points,
      `${width - padding},${height - padding}`
    ];
    
    return `M ${areaPoints.join(' L ')} Z`;
  }

  render() {
    const theme = ROLE_THEMES[this._roleId];

    return html`
      <div class="section-header">
        <h3 class="section-title">
          <span class="section-icon">📊</span>
          ${this._title || '专业指标'}
        </h3>
        <button class="view-all-btn">查看全部 →</button>
      </div>

      <div class="metrics-grid">
        ${this.metrics.map(metric => html`
          <div class="metric-card">
            <div class="metric-label">${metric.label}</div>
            <div class="metric-value-row">
              <span class="metric-value">${metric.value}</span>
              ${metric.unit ? html`<span class="metric-unit">${metric.unit}</span>` : ''}
            </div>
            
            ${metric.trend ? html`
              <div class="metric-trend ${metric.trend}">
                ${metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                ${metric.trendValue}
              </div>
            ` : ''}

            ${metric.sparkline && metric.sparkline.length > 0 ? html`
              <div class="metric-sparkline">
                <svg viewBox="0 0 100 32" preserveAspectRatio="none">
                  <path 
                    class="sparkline-area" 
                    d="${this.renderSparklineArea(metric.sparkline)}"
                    style="fill: ${theme?.colors.primary || '#3b82f6'}"
                  />
                  <path 
                    class="sparkline-path" 
                    d="${this.renderSparkline(metric.sparkline)}"
                    style="stroke: ${theme?.colors.primary || '#3b82f6'}"
                  />
                </svg>
              </div>
            ` : ''}

            ${metric.status ? html`
              <span class="metric-status ${metric.status}">
                ${metric.status === 'healthy' ? '✓ 正常' : metric.status === 'warning' ? '⚠ 警告' : '✕ 严重'}
              </span>
            ` : ''}
          </div>
        `)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-role-metrics-section': ScRoleMetricsSection;
  }
}
```

---

## Task 8: 创建协作指挥区组件 (sc-role-collaboration-section.ts)

**Files:**
- Create: `ui/src/ui/components/sc-role-collaboration-section.ts`

- [ ] **Step 1: 创建 sc-role-collaboration-section.ts**

```typescript
// ui/src/ui/components/sc-role-collaboration-section.ts

import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { RoleId } from '../config/role-themes.js';
import { ROLE_THEMES } from '../config/role-themes.js';

export interface CollaborationItem {
  id: string;
  type: 'discussion' | 'request' | 'invitation' | 'task';
  title: string;
  description: string;
  participants: RoleId[];
  timestamp: number;
  status: 'active' | 'pending' | 'resolved';
  scenario?: string;
}

@customElement('sc-role-collaboration-section')
export class ScRoleCollaborationSection extends LitElement {
  @state() private items: CollaborationItem[] = [];
  @state() private activeTab: 'discussions' | 'requests' | 'tasks' = 'discussions';
  
  private _roleId: RoleId = 'security-expert';

  static styles = css`
    :host {
      display: block;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--sc-text-primary, #f1f5f9);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-icon {
      font-size: 16px;
    }

    .new-btn {
      background: var(--role-primary, #3b82f6);
      border: none;
      color: white;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .new-btn:hover {
      opacity: 0.9;
    }

    .tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--sc-border-color, #334155);
      padding-bottom: 8px;
    }

    .tab {
      padding: 6px 12px;
      background: none;
      border: none;
      color: var(--sc-text-secondary, #94a3b8);
      font-size: 13px;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .tab:hover {
      color: var(--sc-text-primary, #f1f5f9);
      background: var(--sc-bg-secondary, #0f172a);
    }

    .tab.active {
      color: var(--role-primary, #3b82f6);
      background: rgba(59, 130, 246, 0.1);
    }

    .tab-badge {
      margin-left: 4px;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 10px;
      background: var(--sc-bg-tertiary, #1e293b);
    }

    .tab.active .tab-badge {
      background: var(--role-primary, #3b82f6);
      color: white;
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 300px;
      overflow-y: auto;
    }

    .item-card {
      background: var(--sc-bg-secondary, #0f172a);
      border-radius: 8px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .item-card:hover {
      background: var(--sc-bg-tertiary, #1e293b);
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .item-type {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      font-weight: 600;
    }

    .item-type.discussion {
      background: rgba(59, 130, 246, 0.2);
      color: #3b82f6;
    }

    .item-type.request {
      background: rgba(245, 158, 11, 0.2);
      color: #f59e0b;
    }

    .item-type.invitation {
      background: rgba(16, 185, 129, 0.2);
      color: #10b981;
    }

    .item-type.task {
      background: rgba(139, 92, 246, 0.2);
      color: #8b5cf6;
    }

    .item-time {
      font-size: 11px;
      color: var(--sc-text-tertiary, #64748b);
    }

    .item-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--sc-text-primary, #f1f5f9);
      margin-bottom: 4px;
    }

    .item-description {
      font-size: 12px;
      color: var(--sc-text-secondary, #94a3b8);
      margin-bottom: 8px;
    }

    .item-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .item-participants {
      display: flex;
      gap: -4px;
    }

    .participant-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      border: 2px solid var(--sc-bg-secondary, #0f172a);
      margin-left: -4px;
    }

    .participant-avatar:first-child {
      margin-left: 0;
    }

    .item-scenario {
      font-size: 11px;
      padding: 2px 6px;
      background: var(--sc-bg-tertiary, #1e293b);
      border-radius: 4px;
      color: var(--sc-text-tertiary, #64748b);
    }

    .item-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }

    .item-action-btn {
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .item-action-btn.primary {
      background: var(--role-primary, #3b82f6);
      border: none;
      color: white;
    }

    .item-action-btn.secondary {
      background: none;
      border: 1px solid var(--sc-border-color, #334155);
      color: var(--sc-text-secondary, #94a3b8);
    }

    .item-action-btn:hover {
      opacity: 0.9;
    }

    .empty-state {
      text-align: center;
      padding: 32px;
      color: var(--sc-text-tertiary, #64748b);
      font-size: 13px;
    }
  `;

  set roleId(val: RoleId) {
    this._roleId = val;
    this.loadItems();
  }

  private async loadItems() {
    // TODO: 从后端获取真实的协作数据
    this.items = this.getMockItems();
  }

  private getMockItems(): CollaborationItem[] {
    return [
      {
        id: '1',
        type: 'discussion',
        title: 'CVE-2024-XXXX 漏洞响应讨论',
        description: '需要协调安全专家和架构师共同评估漏洞影响范围',
        participants: ['security-expert', 'security-architect', 'secuclaw-commander'],
        timestamp: Date.now() - 3600000,
        status: 'active',
        scenario: '漏洞管理',
      },
      {
        id: '2',
        type: 'request',
        title: '零信任架构评审请求',
        description: '新系统上线前需要安全架构师进行架构评审',
        participants: ['security-architect'],
        timestamp: Date.now() - 7200000,
        status: 'pending',
        scenario: '架构评审',
      },
      {
        id: '3',
        type: 'invitation',
        title: '参与安全运营例会',
        description: '每周安全运营例会，讨论本周安全态势',
        participants: ['security-ops', 'secuclaw-commander', 'ciso'],
        timestamp: Date.now() - 86400000,
        status: 'active',
        scenario: '安全运营',
      },
      {
        id: '4',
        type: 'task',
        title: '供应链安全评估任务',
        description: '对新增供应商进行安全评估和风险评级',
        participants: ['supply-chain-security'],
        timestamp: Date.now() - 1800000,
        status: 'active',
        scenario: '供应链安全',
      },
    ];
  }

  private getFilteredItems(): CollaborationItem[] {
    const typeMap = {
      'discussions': 'discussion',
      'requests': 'request',
      'tasks': 'task',
    } as const;
    
    if (this.activeTab === 'requests') {
      return this.items.filter(i => i.type === 'request' || i.type === 'invitation');
    }
    return this.items.filter(i => i.type === typeMap[this.activeTab]);
  }

  private getParticipantAvatar(roleId: RoleId): { bg: string; fg: string } {
    const theme = ROLE_THEMES[roleId];
    return {
      bg: theme?.colors.primary || '#3b82f6',
      fg: theme?.colors.text || '#ffffff',
    };
  }

  private formatTime(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    return `${days}天前`;
  }

  private handleItemClick(item: CollaborationItem) {
    this.dispatchEvent(new CustomEvent('collaboration-item-click', {
      detail: { item },
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    const filteredItems = this.getFilteredItems();
    const counts = {
      discussions: this.items.filter(i => i.type === 'discussion').length,
      requests: this.items.filter(i => i.type === 'request' || i.type === 'invitation').length,
      tasks: this.items.filter(i => i.type === 'task').length,
    };

    return html`
      <div class="section-header">
        <h3 class="section-title">
          <span class="section-icon">💬</span>
          协作指挥
        </h3>
        <button class="new-btn" @click=${() => console.log('New collaboration')}>+ 新建</button>
      </div>

      <div class="tabs">
        <button 
          class="tab ${this.activeTab === 'discussions' ? 'active' : ''}"
          @click=${() => this.activeTab = 'discussions'}
        >
          讨论
          <span class="tab-badge">${counts.discussions}</span>
        </button>
        <button 
          class="tab ${this.activeTab === 'requests' ? 'active' : ''}"
          @click=${() => this.activeTab = 'requests'}
        >
          请求
          <span class="tab-badge">${counts.requests}</span>
        </button>
        <button 
          class="tab ${this.activeTab === 'tasks' ? 'active' : ''}"
          @click=${() => this.activeTab = 'tasks'}
        >
          任务
          <span class="tab-badge">${counts.tasks}</span>
        </button>
      </div>

      <div class="items-list">
        ${filteredItems.length === 0 ? html`
          <div class="empty-state">暂无相关协作内容</div>
        ` : filteredItems.map(item => {
          const avatar = this.getParticipantAvatar(item.participants[0]);
          return html`
            <div class="item-card" @click=${() => this.handleItemClick(item)}>
              <div class="item-header">
                <span class="item-type ${item.type}">${item.type}</span>
                <span class="item-time">${this.formatTime(item.timestamp)}</span>
              </div>
              <div class="item-title">${item.title}</div>
              <div class="item-description">${item.description}</div>
              <div class="item-footer">
                <div class="item-participants">
                  ${item.participants.slice(0, 3).map(p => {
                    const av = this.getParticipantAvatar(p);
                    const theme = ROLE_THEMES[p];
                    return html`
                      <div 
                        class="participant-avatar"
                        style="background: ${av.bg}; color: ${av.fg}"
                        title="${theme?.nameCn || p}"
                      >
                        ${theme?.icon || '🤖'}
                      </div>
                    `;
                  })}
                  ${item.participants.length > 3 ? html`
                    <div class="participant-avatar" style="background: var(--sc-bg-tertiary);">
                      +${item.participants.length - 3}
                    </div>
                  ` : ''}
                </div>
                ${item.scenario ? html`
                  <span class="item-scenario">${item.scenario}</span>
                ` : ''}
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-role-collaboration-section': ScRoleCollaborationSection;
  }
}
```

---

## Task 9: 修改仪表盘支持两种视图模式 (sc-dashboard.ts)

**Files:**
- Modify: `ui/src/ui/pages/sc-dashboard.ts`

- [ ] **Step 1: 在 sc-dashboard.ts 中添加视图模式切换逻辑**

在文件开头的类型定义之后，添加以下常量：

```typescript
// 视图模式枚举
type ViewMode = 'overview' | 'commander';

const VIEW_MODE_KEY = 'secuclaw-view-mode';
```

- [ ] **Step 2: 在 ScDashboard 类中添加 viewMode 状态**

在现有状态定义之后添加：

```typescript
@state()
private viewMode: ViewMode = 'overview';
```

- [ ] **Step 3: 在 constructor 中初始化视图模式**

```typescript
constructor() {
  super();
  // 从 localStorage 恢复视图模式
  const saved = localStorage.getItem(VIEW_MODE_KEY) as ViewMode;
  if (saved) {
    this.viewMode = saved;
  }
  
  this.currentRole = roleContext.getState().currentRole || 'security-expert';
  this.loadDashboardData();
}
```

- [ ] **Step 4: 在 connectedCallback 中监听视图切换事件**

```typescript
connectedCallback() {
  super.connectedCallback();
  this.roleUnsubscribe = roleContext.subscribe((state) => {
    if (state.currentRole && state.currentRole !== this.currentRole) {
      this.currentRole = state.currentRole as RoleId;
      this.loadDashboardData();
    }
  });

  // 监听从角色指挥台返回的事件
  this.addEventListener('back-to-overview', this.handleBackToOverview as EventListener);
  this.addEventListener('enter-commander', this.handleEnterCommander as EventListener);
}

disconnectedCallback() {
  super.disconnectedCallback();
  this.roleUnsubscribe?.();
  this.removeEventListener('back-to-overview', this.handleBackToOverview as EventListener);
  this.removeEventListener('enter-commander', this.handleEnterCommander as EventListener);
}
```

- [ ] **Step 5: 添加视图切换处理方法**

```typescript
private handleBackToOverview = () => {
  this.viewMode = 'overview';
  localStorage.setItem(VIEW_MODE_KEY, 'overview');
};

private handleEnterCommander = (e: CustomEvent) => {
  if (e.detail?.roleId) {
    roleContext.setRole(e.detail.roleId);
  }
  this.viewMode = 'commander';
  localStorage.setItem(VIEW_MODE_KEY, 'commander');
};

private switchToCommander(roleId: RoleId) {
  roleContext.setRole(roleId);
  this.viewMode = 'commander';
  localStorage.setItem(VIEW_MODE_KEY, 'commander');
}
```

- [ ] **Step 6: 修改 render 方法实现视图切换**

找到 `render()` 方法，将其修改为：

```typescript
render() {
  // 如果是指挥官模式，渲染指挥官组件
  if (this.viewMode === 'commander') {
    return html`<sc-role-commander></sc-role-commander>`;
  }

  // 否则渲染统一总览
  if (this.loading) {
    return html`
      <div style="text-align: center; padding: 2rem;">
        <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
        <div style="color: var(--sc-text-secondary);">${this.i18n.t('common.loading')}</div>
      </div>
    `;
  }

  return html`
    <!-- 智能推荐条 -->
    <sc-smart-recommendation-bar></sc-smart-recommendation-bar>
    
    <div class="dashboard-container">
      <div class="main-content">
        ${this.toastMessage ? html`<div style="padding:12px 16px;border-radius:8px;margin-bottom:16px;font-size:14px;background:${this.toastType === 'success' ? '#d4edda' : '#f8d7da'};color:${this.toastType === 'success' ? '#155724' : '#721c24'};}>
          ${this.toastType === 'success' ? '✅' : '❌'} ${this.toastMessage}
        </div>` : ''}
        
        <sc-dashboard-header
          @refresh=${() => this.loadDashboardData()}
          @kpi-calc=${() => this.loadKPI()}
        ></sc-dashboard-header>

        ${this.renderSecurityScore()}
        ${this.renderRaciSummary()}
        ${this.renderInsights()}
        ${this.renderTrendsChart()}
        ${this.renderCompliance()}
        ${this.renderAnomalies()}
      </div>

      <div class="ai-sidebar">
        <sc-ai-assistant
          pageId="dashboard"
          pageTitle="仪表盘"
          .pageData=${{
            metrics: this.metrics,
            compliance: this.complianceItems,
            score: this.securityScore,
            predictions: this.predictions,
            recommendations: this.recommendations,
          }}
          .userRole=${this.currentRole}
        ></sc-ai-assistant>
      </div>
    </div>
  `;
}
```

- [ ] **Step 7: 在 renderRaciSummary 中添加进入指挥官的功能**

找到 `renderRaciSummary()` 方法，在返回的 HTML 中添加一个"进入指挥官"按钮：

```typescript
private renderRaciSummary() {
  const roleConfig = ROLE_DASHBOARD_CONFIG[this.currentRole as keyof typeof ROLE_DASHBOARD_CONFIG];
  if (!roleConfig || !roleConfig.raciTaskSummary) return html``;

  const { showRSummary, showASummary, showISummary, label } = roleConfig.raciTaskSummary;

  const rCount = this.getRaciCount('R');
  const aCount = this.getRaciCount('A');
  const iCount = this.getRaciCount('I');

  return html`
    <div class="raci-summary-section">
      <div class="raci-summary-header">
        <h3 class="raci-summary-title">
          <span>🎯</span>
          ${label || 'RACI 任务概览'}
        </h3>
        <button 
          class="btn btn-primary"
          @click=${() => this.switchToCommander(this.currentRole as RoleId)}
          style="background: var(--role-primary, #3b82f6);"
        >
          🎖️ 进入${ROLE_THEMES[this.currentRole as RoleId]?.nameCn || '角色'}指挥台
        </button>
      </div>
      <div class="raci-summary-grid">
        ${showRSummary ? html`
          <div class="raci-card">
            <div class="raci-card-icon">🔵</div>
            <div class="raci-badge r">R</div>
            <div class="raci-card-value">${rCount}</div>
            <div class="raci-card-label">待执行任务</div>
          </div>
        ` : ''}
        ${showASummary ? html`
          <div class="raci-card">
            <div class="raci-card-icon">🔴</div>
            <div class="raci-badge a">A</div>
            <div class="raci-card-value">${aCount}</div>
            <div class="raci-card-label">待审批任务</div>
          </div>
        ` : ''}
        ${showISummary ? html`
          <div class="raci-card">
            <div class="raci-card-icon">🟠</div>
            <div class="raci-badge i">I</div>
            <div class="raci-card-value">${iCount}</div>
            <div class="raci-card-label">未读通知</div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}
```

---

## Task 10: 扩展角色上下文管理 (role-context.ts)

**Files:**
- Modify: `ui/src/ui/store/role-context.ts`

- [ ] **Step 1: 添加场景状态到 RoleContextState**

找到 RoleContextState 接口，添加场景相关字段：

```typescript
export interface RoleContextState {
  currentRole: string | null;
  availableRoles: RoleId[];
  raciAssignments: RaciAssignments;
  isCommanderMode: boolean;  // 新增
  currentScenario: string | null;  // 新增
}
```

- [ ] **Step 2: 添加 setScenario 方法**

在 RoleContext 类中添加：

```typescript
setScenario(scenario: string | null) {
  this.state = {
    ...this.state,
    currentScenario: scenario,
    isCommanderMode: scenario !== null,
  };
  this.notify();
}

resetToOverview() {
  this.state = {
    ...this.state,
    currentScenario: null,
    isCommanderMode: false,
  };
  this.notify();
}
```

- [ ] **Step 3: 添加 isCommanderMode getter**

```typescript
get isCommanderMode(): boolean {
  return this.state.isCommanderMode;
}

get currentScenario(): string | null {
  return this.state.currentScenario;
}
```

---

## 实施检查清单

完成所有 Task 后，确保：

- [ ] `role-themes.ts` - 8 个角色的完整主题配置
- [ ] `role-layout-config.ts` - 角色布局配置
- [ ] `recommendation-service.ts` - 推荐算法服务
- [ ] `sc-smart-recommendation-bar.ts` - 智能推荐条组件
- [ ] `sc-raci-task-section.ts` - RACI 任务区组件
- [ ] `sc-role-metrics-section.ts` - 专业指标区组件
- [ ] `sc-role-collaboration-section.ts` - 协作指挥区组件
- [ ] `sc-role-commander.ts` - 角色指挥台主组件
- [ ] `sc-dashboard.ts` - 修改支持两种视图模式
- [ ] `role-context.ts` - 扩展场景状态管理

---

## 计划完成

**保存到:** `docs/superpowers/plans/2026-04-11-role-commander-ui-implementation.md`

---

## 执行选择

**两种执行方式：**

**1. Subagent-Driven (推荐)** - 每个 Task 由独立 subagent 执行，任务间有检查点 review，快速迭代

**2. Inline Execution** - 在当前 session 执行，使用 executing-plans 技能批量执行带检查点

您选择哪种方式？
