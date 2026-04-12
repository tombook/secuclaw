/**
 * Role-Centric Menu Configuration
 * 角色中心化菜单 - 按安全专业领域重组
 *
 * 设计理念：
 * - 菜单按专业领域分组（威胁分析、事件响应、漏洞管理...）
 * - 每个菜单项标记哪些角色最关注（relevantRoles）
 * - 当前角色相关的菜单项自动高亮/排序靠前
 * - 所有功能保留，只是组织方式改变
 */

import type { RoleId } from '../store/role-context.js';

export interface DomainNavItem {
  path: string;
  icon: string;
  labelKey: string;
  /** 相关角色 - 当前角色匹配时该菜单项会高亮 */
  relevantRoles: RoleId[];
  /** 角色特定的视角标签，如 "Security Expert View" */
  roleViewLabel?: Partial<Record<RoleId, string>>;
}

export interface DomainNavGroup {
  id: string;
  name: string;
  icon: string;
  order: number;
  items: DomainNavItem[];
}

/**
 * 角色中心化菜单结构
 * 按安全专业领域分组，而非传统功能分类
 */
export const DOMAIN_MENU_GROUPS: DomainNavGroup[] = [
  {
    id: 'dashboard',
    name: '我的仪表盘',
    icon: '📊',
    order: 0,
    items: [
      {
        path: '/',
        icon: '📊',
        labelKey: 'nav.overview',
        relevantRoles: [
          'security-expert', 'privacy-officer', 'security-architect',
          'business-security-officer', 'secuclaw-commander', 'ciso',
          'security-ops', 'supply-chain-security'
        ],
      },
    ],
  },
  {
    id: 'threat-analysis',
    name: '威胁分析',
    icon: '🔍',
    order: 1,
    items: [
      {
        path: '/threats',
        icon: '🔍',
        labelKey: 'nav.threats',
        relevantRoles: ['security-expert', 'security-architect', 'secuclaw-commander', 'security-ops'],
        roleViewLabel: {
          'security-expert': '威胁检测视角',
          'security-architect': '威胁建模视角',
          'security-ops': '入侵追踪视角',
        },
      },
    ],
  },
  {
    id: 'incident-response',
    name: '事件响应',
    icon: '🚨',
    order: 2,
    items: [
      {
        path: '/incidents',
        icon: '🚨',
        labelKey: 'nav.incidents',
        relevantRoles: ['business-security-officer', 'secuclaw-commander', 'security-ops'],
      },
      {
        path: '/war-room',
        icon: '🎯',
        labelKey: 'nav.warRoom',
        relevantRoles: ['secuclaw-commander', 'security-ops'],
      },
    ],
  },
  {
    id: 'vulnerability-management',
    name: '漏洞管理',
    icon: '🐛',
    order: 3,
    items: [
      {
        path: '/vulnerabilities',
        icon: '🐛',
        labelKey: 'nav.vulnerabilities',
        relevantRoles: ['security-expert', 'security-architect'],
        roleViewLabel: {
          'security-expert': '漏洞扫描视角',
          'security-architect': '架构弱点视角',
        },
      },
    ],
  },
  {
    id: 'compliance-governance',
    name: '合规治理',
    icon: '✅',
    order: 4,
    items: [
      {
        path: '/compliance',
        icon: '✅',
        labelKey: 'nav.compliance',
        relevantRoles: ['privacy-officer', 'ciso'],
      },
      {
        path: '/audit',
        icon: '📋',
        labelKey: 'nav.audit',
        relevantRoles: ['privacy-officer', 'ciso', 'supply-chain-security'],
      },
      {
        path: '/approval',
        icon: '🔐',
        labelKey: 'nav.approval',
        relevantRoles: ['ciso'],
      },
    ],
  },
  {
    id: 'risk-management',
    name: '风险管理',
    icon: '📈',
    order: 5,
    items: [
      {
        path: '/risk-center',
        icon: '📈',
        labelKey: 'nav.riskCenter',
        relevantRoles: ['business-security-officer', 'ciso'],
        roleViewLabel: {
          'business-security-officer': '业务风险矩阵',
          'ciso': '战略风险视图',
        },
      },
    ],
  },
  {
    id: 'supply-chain',
    name: '供应链安全',
    icon: '🔗',
    order: 6,
    items: [
      {
        path: '/vendors',
        icon: '🏢',
        labelKey: 'nav.vendors',
        relevantRoles: ['supply-chain-security'],
      },
      {
        path: '/dependencies',
        icon: '📦',
        labelKey: 'nav.dependencies',
        relevantRoles: ['supply-chain-security'],
      },
    ],
  },
  {
    id: 'data-governance',
    name: '数据治理',
    icon: '🗄️',
    order: 7,
    items: [
      {
        path: '/data-center',
        icon: '🗄️',
        labelKey: 'nav.dataCenter',
        relevantRoles: ['privacy-officer', 'security-architect'],
      },
      {
        path: '/assets',
        icon: '💻',
        labelKey: 'nav.assets',
        relevantRoles: ['security-expert', 'security-architect'],
      },
    ],
  },
  {
    id: 'security-tools',
    name: '安全工具',
    icon: '🛠️',
    order: 8,
    items: [
      {
        path: '/tools/security-ops',
        icon: '🛡️',
        labelKey: 'nav.securityOps',
        relevantRoles: ['security-ops', 'security-expert'],
      },
    ],
  },
  {
    id: 'capabilities',
    name: '能力中心',
    icon: '⚡',
    order: 9,
    items: [
      {
        path: '/capabilities',
        icon: '⚔️',
        labelKey: 'nav.capabilities',
        relevantRoles: ['security-architect', 'security-expert', 'secuclaw-commander'],
      },
      {
        path: '/skills-market',
        icon: '🛒',
        labelKey: 'nav.skillsMarket',
        relevantRoles: [
          'security-expert', 'privacy-officer', 'security-architect',
          'business-security-officer', 'secuclaw-commander', 'ciso',
          'security-ops', 'supply-chain-security'
        ],
      },
    ],
  },
  {
    id: 'collaboration',
    name: '协作',
    icon: '💬',
    order: 10,
    items: [
      {
        path: '/channels',
        icon: '💬',
        labelKey: 'nav.channels',
        relevantRoles: ['secuclaw-commander', 'security-ops'],
      },
      {
        path: '/tasks',
        icon: '📋',
        labelKey: 'nav.tasks',
        relevantRoles: ['secuclaw-commander', 'ciso'],
      },
    ],
  },
  {
    id: 'admin',
    name: '管理',
    icon: '⚙️',
    order: 11,
    items: [
      {
        path: '/settings',
        icon: '⚙️',
        labelKey: 'nav.settings',
        relevantRoles: ['ciso'],
      },
      {
        path: '/ai-experts',
        icon: '🤖',
        labelKey: 'nav.aiExperts',
        relevantRoles: [
          'security-expert', 'privacy-officer', 'security-architect',
          'business-security-officer', 'secuclaw-commander', 'ciso',
          'security-ops', 'supply-chain-security'
        ],
      },
      {
        path: '/settings/llm-config',
        icon: '🌐',
        labelKey: 'nav.llmConfig',
        relevantRoles: ['ciso'],
      },
    ],
  },
];

/**
 * 判断菜单项是否与当前角色相关
 */
export function isRelevantToRole(item: DomainNavItem, roleId: RoleId | null): boolean {
  if (!roleId) return true; // 没选角色时显示全部
  return item.relevantRoles.includes(roleId);
}

/**
 * 获取角色相关的菜单项（排序：相关优先）
 */
export function getRelevantItemsForRole(
  items: DomainNavItem[],
  roleId: RoleId | null
): (DomainNavItem & { isRelevant: boolean })[] {
  return items
    .map(item => ({
      ...item,
      isRelevant: isRelevantToRole(item, roleId),
    }))
    .sort((a, b) => {
      // 相关项排前面
      if (a.isRelevant && !b.isRelevant) return -1;
      if (!a.isRelevant && b.isRelevant) return 1;
      return 0;
    });
}
