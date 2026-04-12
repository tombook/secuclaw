import type { RoleId } from '../store/role-context.js';

export interface RoleMenuItem {
  path: string;
  icon: string;
  labelKey: string;
  requiresCapability?: string[];
}

export const ROLE_MENU_ITEMS: Record<RoleId, RoleMenuItem[]> = {
  'security-expert': [
    { path: '/vulnerabilities', icon: '🐛', labelKey: 'nav.vulnerabilities', requiresCapability: ['漏洞扫描', '渗透测试'] },
    { path: '/threats', icon: '🔍', labelKey: 'nav.threats', requiresCapability: ['威胁分析'] },
  ],
  'privacy-officer': [
    { path: '/compliance', icon: '✅', labelKey: 'nav.compliance', requiresCapability: ['合规审计'] },
    { path: '/data-center', icon: '🗄️', labelKey: 'nav.dataCenter', requiresCapability: ['数据分类'] },
  ],
  'security-architect': [
    { path: '/capabilities', icon: '⚔️', labelKey: 'nav.capabilities', requiresCapability: ['架构评审'] },
    { path: '/threats', icon: '🔍', labelKey: 'nav.threats', requiresCapability: ['威胁建模'] },
  ],
  'business-security-officer': [
    { path: '/risk-center', icon: '📈', labelKey: 'nav.riskCenter', requiresCapability: ['风险管理'] },
    { path: '/incidents', icon: '🚨', labelKey: 'nav.incidents', requiresCapability: ['事件响应'] },
  ],
  'secuclaw-commander': [
    { path: '/war-room', icon: '🎯', labelKey: 'nav.warRoom', requiresCapability: ['全域指挥'] },
    { path: '/threats', icon: '🔍', labelKey: 'nav.threats' },
    { path: '/incidents', icon: '🚨', labelKey: 'nav.incidents' },
  ],
  'ciso': [
    { path: '/risk-center', icon: '📈', labelKey: 'nav.riskCenter', requiresCapability: ['战略报告'] },
    { path: '/compliance', icon: '✅', labelKey: 'nav.compliance', requiresCapability: ['合规管理'] },
    { path: '/approval', icon: '🔐', labelKey: 'nav.approval', requiresCapability: ['策略审批'] },
  ],
  'security-ops': [
    { path: '/tools/security-ops', icon: '🛡️', labelKey: 'nav.securityOps', requiresCapability: ['日志分析'] },
    { path: '/incidents', icon: '🚨', labelKey: 'nav.incidents', requiresCapability: ['事件响应'] },
    { path: '/threats', icon: '🔍', labelKey: 'nav.threats', requiresCapability: ['入侵追踪'] },
  ],
  'supply-chain-security': [
    { path: '/vendors', icon: '🏢', labelKey: 'nav.vendors', requiresCapability: ['供应商评估'] },
    { path: '/dependencies', icon: '📦', labelKey: 'nav.dependencies', requiresCapability: ['SBOM扫描'] },
  ],
};

export const ROLE_QUICK_ACTIONS: Record<RoleId, { label: string; action: string; icon: string }[]> = {
  'security-expert': [
    { label: '漏洞扫描', action: 'skill:漏洞扫描', icon: '🔍' },
    { label: '代码审计', action: 'skill:代码审计', icon: '🔍' },
  ],
  'privacy-officer': [
    { label: '隐私影响评估', action: 'skill:隐私影响评估', icon: '📋' },
    { label: '合规审计', action: 'skill:合规审计', icon: '✅' },
  ],
  'security-architect': [
    { label: '安全架构评审', action: 'skill:安全架构评审', icon: '🏗️' },
    { label: '威胁建模', action: 'skill:威胁建模', icon: '🎯' },
  ],
  'business-security-officer': [
    { label: '业务影响评估', action: 'skill:业务影响评估', icon: '📊' },
    { label: '风险接受评审', action: 'skill:风险接受评审', icon: '✅' },
  ],
  'secuclaw-commander': [
    { label: '全域态势', action: 'skill:全域态势', icon: '🌐' },
    { label: '协同响应', action: 'skill:协同响应', icon: '⚡' },
  ],
  'ciso': [
    { label: '安全报告', action: 'skill:安全报告', icon: '📊' },
    { label: '预算规划', action: 'skill:预算规划', icon: '💰' },
  ],
  'security-ops': [
    { label: '日志分析', action: 'skill:日志分析', icon: '📋' },
    { label: '入侵追踪', action: 'skill:入侵追踪', icon: '🔍' },
  ],
  'supply-chain-security': [
    { label: '供应商评估', action: 'skill:供应商评估', icon: '🏢' },
    { label: 'SBOM扫描', action: 'skill:SBOM扫描', icon: '📦' },
  ],
};
