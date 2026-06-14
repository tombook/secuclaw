/**
 * Layer 2: 角色驱动（Role-Driven）
 *
 * 决定用户能"操作"哪些模块 + 哪些动作
 * 特点：跨角色"只读"友好（CISO 可查看 SOAR 但不能执行）
 */
import type { RoleId, ModuleId, ActionType } from './types.js';

export interface RoleDefinition {
  id: RoleId;
  name: string;
  emoji: string;
  description: string;
  // 主指挥台（写权限）
  home: ModuleId;
  // 拥有写权限的模块
  writeAccess: ModuleId[];
  // 拥有读权限的模块（可查看但不能修改）
  readAccess: ModuleId[];
  // 拥有的能力
  capabilities: string[];
}

// 8 角色指挥台 + 3 系统角色
const ROLE_REGISTRY_LIST: RoleDefinition[] = [
  {
    id: 'commander',
    name: '指挥官',
    emoji: '🎖️',
    description: '全域态势协调 + 战情室主导',
    home: 'commander',
    writeAccess: ['commander', 'warroom', 'team-dynamics', 'tasks', 'raci', 'overview'],
    readAccess: ['*'],  // 指挥官全局可读
    capabilities: ['warroom', 'resource-scheduling', 'cross-role-raci'],
  },
  {
    id: 'ciso',
    name: 'CISO 战略官',
    emoji: '👔',
    description: '战略决策 + 预算 + 合规 + 战略目标',
    home: 'ciso',
    writeAccess: ['ciso', 'compliance', 'billing', 'tasks', 'overview'],
    readAccess: ['*'],
    capabilities: ['budget', 'strategic-targets', 'compliance-approval'],
  },
  {
    id: 'expert',
    name: '安全专家',
    emoji: '🔍',
    description: '漏洞 + 渗透 + 威胁狩猎 + SBOM',
    home: 'expert',
    writeAccess: ['expert', 'vulnerabilities', 'threats', 'tasks', 'overview'],
    readAccess: ['assets', 'incidents', 'compliance'],
    capabilities: ['vuln-scan', 'pentest', 'threat-hunting', 'sbom-analyze'],
  },
  {
    id: 'secops',
    name: '安全运营',
    emoji: '⚡',
    description: '告警响应 + SOAR + 应急 + 取证',
    home: 'secops',
    writeAccess: ['secops', 'incidents', 'tasks', 'overview'],
    readAccess: ['vulnerabilities', 'assets', 'threats', 'compliance'],
    capabilities: ['alert-triage', 'soar-execute', 'incident-response', 'forensics'],
  },
  {
    id: 'architect',
    name: '安全架构师',
    emoji: '🏗️',
    description: '零信任 + 威胁建模 + 架构审查 + 加密策略',
    home: 'architect',
    writeAccess: ['architect', 'assets', 'tasks', 'overview'],
    readAccess: ['incidents', 'vulnerabilities', 'compliance', 'easm'],
    capabilities: ['zero-trust-design', 'threat-modeling', 'architecture-review'],
  },
  {
    id: 'privacy',
    name: '隐私官',
    emoji: '🔒',
    description: 'DSR + PIA + GDPR/PIPL + 数据资产',
    home: 'privacy',
    writeAccess: ['privacy', 'compliance', 'tasks', 'overview'],
    readAccess: ['incidents', 'assets'],
    capabilities: ['dsr-handle', 'pia-review', 'cross-border-transfer'],
  },
  {
    id: 'business',
    name: '业务安全',
    emoji: '💼',
    description: 'BCP + BIA + 业务连续性 + 保险',
    home: 'business',
    writeAccess: ['business', 'tasks', 'overview'],
    readAccess: ['assets', 'incidents', 'compliance'],
    capabilities: ['bcp-plan', 'bia-assessment', 'crisis-comms'],
  },
  {
    id: 'supply',
    name: '供应链安全',
    emoji: '🔗',
    description: 'SBOM + 供应商 + AI 工具链',
    home: 'supply',
    writeAccess: ['supply', 'assets', 'tasks', 'overview'],
    readAccess: ['vulnerabilities', 'compliance', 'easm'],
    capabilities: ['sbom-manage', 'vendor-risk', 'ai-scm'],
  },
  // 系统角色
  {
    id: 'admin',
    name: '租户管理员',
    emoji: '⚙️',
    description: '租户配置 + 成员管理 + 计费',
    home: 'overview',
    writeAccess: ['*'],  // 全部
    readAccess: ['*'],
    capabilities: ['tenant-admin', 'billing', 'member-manage'],
  },
  {
    id: 'auditor',
    name: '审计员',
    emoji: '🔍',
    description: '只读 + 审计日志 + 报告',
    home: 'audit',
    writeAccess: [],
    readAccess: ['*'],
    capabilities: ['audit-readonly', 'export-audit'],
  },
  {
    id: 'developer',
    name: '开发者',
    emoji: '💻',
    description: '工具市场 + 技能开发 + 集成',
    home: 'market',
    writeAccess: ['market', 'evolution', 'tasks', 'overview'],
    readAccess: ['incidents', 'vulnerabilities'],
    capabilities: ['skill-dev', 'plugin-install', 'api-access'],
  },
];

export const ROLE_REGISTRY: Record<RoleId, RoleDefinition> = ROLE_REGISTRY_LIST
  .reduce((acc, r) => { acc[r.id] = r; return acc; }, {} as Record<RoleId, RoleDefinition>);

export function getRole(id: RoleId): RoleDefinition {
  return ROLE_REGISTRY[id];
}

/**
 * 检查用户（可能多角色）对某模块的访问权限
 * 规则：任一角色拥有 write 权限 → write；任一角色拥有 read 权限 → read；都没有 → deny
 */
export function checkRoleAccess(
  userRoles: RoleId[],
  module: ModuleId,
  action: ActionType
): { allowed: boolean; effective: ActionType | null } {
  let bestAccess: ActionType | null = null;

  for (const roleId of userRoles) {
    const def = ROLE_REGISTRY[roleId];
    if (!def) continue;

    // 写权限（更高优先级）
    if (def.writeAccess.includes('*') || def.writeAccess.includes(module)) {
      return { allowed: true, effective: 'admin' };
    }
    // 读权限
    if (def.readAccess.includes('*') || def.readAccess.includes(module)) {
      if (!bestAccess) bestAccess = 'read';
    }
  }

  // read 已足够执行 read 动作
  if (action === 'read' && bestAccess === 'read') {
    return { allowed: true, effective: 'read' };
  }

  return { allowed: false, effective: null };
}

/**
 * 角色可访问的模块集合（用于 UI 侧栏）
 */
export function getAccessibleModules(userRoles: RoleId[]): ModuleId[] {
  const modules = new Set<ModuleId>();
  for (const roleId of userRoles) {
    const def = ROLE_REGISTRY[roleId];
    if (!def) continue;
    def.writeAccess.forEach(m => modules.add(m));
    def.readAccess.forEach(m => modules.add(m));
  }
  return Array.from(modules);
}
