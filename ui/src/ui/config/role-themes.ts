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
    backgroundPattern: './assets/textures/circuit-pattern.svg',
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
    backgroundPattern: './assets/textures/hex-pattern.svg',
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
    backgroundPattern: './assets/textures/grid-pattern.svg',
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
    backgroundPattern: './assets/textures/dot-pattern.svg',
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
    backgroundPattern: './assets/textures/circuit-pattern.svg',
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
    backgroundPattern: './assets/textures/grid-pattern.svg',
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
    backgroundPattern: './assets/textures/hex-pattern.svg',
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
    backgroundPattern: './assets/textures/dot-pattern.svg',
    animation: 'chain',
    layout: 'graph',
    description: '供应商评估、SBOM管理、第三方风险',
  },
};

export function getRoleTheme(roleId: RoleId): RoleTheme {
  return ROLE_THEMES[roleId] || ROLE_THEMES['security-expert'];
}

export function applyRoleTheme(roleId: RoleId): void {
  const theme = ROLE_THEMES[roleId];
  if (theme) {
    document.documentElement.style.setProperty('--role-primary', theme.colors.primary);
    document.documentElement.style.setProperty('--role-secondary', theme.colors.secondary);
    document.documentElement.style.setProperty('--role-accent', theme.colors.accent);
    document.documentElement.style.setProperty('--role-background', theme.colors.background);
    document.documentElement.style.setProperty('--role-surface', theme.colors.surface);
    document.documentElement.style.setProperty('--role-text', theme.colors.text);
    document.documentElement.style.setProperty('--role-text-secondary', theme.colors.textSecondary);
  }
}
