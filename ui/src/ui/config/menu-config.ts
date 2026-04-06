/**
 * SecuClaw Menu Configuration
 * 菜单配置 - 按用户角色分组
 */

export interface NavItem {
  path: string;
  icon: string;
  labelKey: string;
  children?: NavItem[];
}

export interface NavGroup {
  id: string;
  name: string;
  icon: string;
  order: number;
  items: NavItem[];
}

export const MENU_GROUPS: NavGroup[] = [
  {
    id: 'operations',
    name: '运营',
    icon: '📊',
    order: 1,
    items: [
      { path: '/', icon: '📊', labelKey: 'nav.overview' },
      { path: '/threats', icon: '🔍', labelKey: 'nav.threats' },
      { path: '/incidents', icon: '🚨', labelKey: 'nav.incidents' },
      { path: '/vulnerabilities', icon: '🐛', labelKey: 'nav.vulnerabilities' },
      { path: '/assets', icon: '💻', labelKey: 'nav.assets' },
    ]
  },
  {
    id: 'command',
    name: '作战',
    icon: '⚔️',
    order: 2,
    items: [
      { path: '/war-room', icon: '🎯', labelKey: 'nav.warRoom' },
      { path: '/tools/security-ops', icon: '🛡️', labelKey: 'nav.securityOps' },
    ]
  },
  {
    id: 'governance',
    name: '治理',
    icon: '✅',
    order: 3,
    items: [
      { path: '/compliance', icon: '✅', labelKey: 'nav.compliance' },
      { path: '/audit', icon: '📋', labelKey: 'nav.audit' },
      { path: '/approval', icon: '🔐', labelKey: 'nav.approval' },
      { path: '/risk-center', icon: '📈', labelKey: 'nav.riskCenter' },
      { path: '/data-center', icon: '🗄️', labelKey: 'nav.dataCenter' },
    ]
  },
  {
    id: 'ai',
    name: 'AI',
    icon: '🤖',
    order: 4,
    items: [
      { path: '/ai-experts', icon: '🤖', labelKey: 'nav.aiExperts' },
      { path: '/settings/ai-experts-config', icon: '⚡', labelKey: 'nav.aiExpertsConfig' },
      { path: '/settings/llm-config', icon: '🌐', labelKey: 'nav.llmConfig' },
    ]
  },
  {
    id: 'capabilities',
    name: '能力',
    icon: '🛒',
    order: 5,
    items: [
      { path: '/capabilities', icon: '⚔️', labelKey: 'nav.capabilities' },
      { path: '/skills-market', icon: '🛒', labelKey: 'nav.skillsMarket' },
    ]
  },
  {
    id: 'collaboration',
    name: '协作',
    icon: '💬',
    order: 6,
    items: [
      { path: '/channels', icon: '💬', labelKey: 'nav.channels' },
      { path: '/tasks', icon: '📋', labelKey: 'nav.tasks' },
    ]
  },
  {
    id: 'admin',
    name: '管理',
    icon: '⚙️',
    order: 7,
    items: [
      { path: '/settings', icon: '⚙️', labelKey: 'nav.settings' },
      { path: '/settings/roles', icon: '👥', labelKey: 'nav.roles' },
      { path: '/settings/siem-config', icon: '🔗', labelKey: 'nav.siemConfig' },
    ]
  },
];

// Flat list for backward compatibility (deprecated)
export const NAV_ITEMS: NavItem[] = MENU_GROUPS.flatMap(g => g.items);
