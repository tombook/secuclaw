export const PERMISSIONS = {
  AUTH_READ: 'auth.read',
  AUTH_WRITE: 'auth.write',

  ASSETS_READ: 'assets.read',
  ASSETS_WRITE: 'assets.write',
  ASSETS_DELETE: 'assets.delete',

  VULNS_READ: 'vulnerabilities.read',
  VULNS_WRITE: 'vulnerabilities.write',
  VULNS_DELETE: 'vulnerabilities.delete',

  INCIDENTS_READ: 'incidents.read',
  INCIDENTS_WRITE: 'incidents.write',
  INCIDENTS_DELETE: 'incidents.delete',

  THREATS_READ: 'threats.read',
  THREATS_WRITE: 'threats.write',

  COMPLIANCE_READ: 'compliance.read',
  COMPLIANCE_WRITE: 'compliance.write',

  CAPABILITIES_READ: 'capabilities.read',
  CAPABILITIES_WRITE: 'capabilities.write',

  KNOWLEDGE_READ: 'knowledge.read',

  AI_READ: 'ai.read',
  AI_WRITE: 'ai.write',
  LLM_MANAGE: 'llm.manage',

  CHANNELS_READ: 'channels.read',
  CHANNELS_WRITE: 'channels.write',

  COMMANDER_READ: 'commander.read',
  COMMANDER_WRITE: 'commander.write',

  KPI_READ: 'kpi.read',

  ROLES_READ: 'roles.read',
  ROLES_WRITE: 'roles.write',
  USERS_READ: 'users.read',
  USERS_WRITE: 'users.write',

  REPORTS_READ: 'reports.read',
  REPORTS_WRITE: 'reports.write',

  AUDIT_READ: 'audit.read',

  SKILLS_READ: 'skills.read',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const PERMISSION_MATRIX: Record<string, string[]> = {
  admin: ['*'],
  'secuclaw-commander': [
    PERMISSIONS.ASSETS_READ, PERMISSIONS.ASSETS_WRITE, PERMISSIONS.ASSETS_DELETE,
    PERMISSIONS.VULNS_READ, PERMISSIONS.VULNS_WRITE, PERMISSIONS.VULNS_DELETE,
    PERMISSIONS.INCIDENTS_READ, PERMISSIONS.INCIDENTS_WRITE, PERMISSIONS.INCIDENTS_DELETE,
    PERMISSIONS.COMPLIANCE_READ, PERMISSIONS.COMPLIANCE_WRITE,
    PERMISSIONS.THREATS_READ, PERMISSIONS.THREATS_WRITE,
    PERMISSIONS.CAPABILITIES_READ, PERMISSIONS.CAPABILITIES_WRITE,
    PERMISSIONS.KNOWLEDGE_READ,
    PERMISSIONS.AI_READ, PERMISSIONS.AI_WRITE,
    PERMISSIONS.LLM_MANAGE,
    PERMISSIONS.KPI_READ,
    PERMISSIONS.ROLES_READ, PERMISSIONS.ROLES_WRITE,
    PERMISSIONS.USERS_READ, PERMISSIONS.USERS_WRITE,
    PERMISSIONS.REPORTS_READ, PERMISSIONS.REPORTS_WRITE,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.SKILLS_READ,
    PERMISSIONS.COMMANDER_READ, PERMISSIONS.COMMANDER_WRITE,
    PERMISSIONS.CHANNELS_READ, PERMISSIONS.CHANNELS_WRITE,
  ],
  'supply-chain-security': [
    PERMISSIONS.ASSETS_READ,
    PERMISSIONS.VULNS_READ,
    PERMISSIONS.INCIDENTS_READ,
    PERMISSIONS.COMPLIANCE_READ,
    PERMISSIONS.KNOWLEDGE_READ,
    PERMISSIONS.AI_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.SKILLS_READ,
  ],
  'business-security-officer': [
    PERMISSIONS.ASSETS_READ,
    PERMISSIONS.VULNS_READ, PERMISSIONS.VULNS_WRITE,
    PERMISSIONS.INCIDENTS_READ, PERMISSIONS.INCIDENTS_WRITE,
    PERMISSIONS.COMPLIANCE_READ,
    PERMISSIONS.THREATS_READ,
    PERMISSIONS.CAPABILITIES_READ,
    PERMISSIONS.KNOWLEDGE_READ,
    PERMISSIONS.AI_READ,
    PERMISSIONS.KPI_READ,
    PERMISSIONS.REPORTS_READ, PERMISSIONS.REPORTS_WRITE,
    PERMISSIONS.SKILLS_READ,
  ],
  'privacy-officer': [
    PERMISSIONS.ASSETS_READ,
    PERMISSIONS.VULNS_READ,
    PERMISSIONS.INCIDENTS_READ,
    PERMISSIONS.COMPLIANCE_READ, PERMISSIONS.COMPLIANCE_WRITE,
    PERMISSIONS.CAPABILITIES_READ,
    PERMISSIONS.KNOWLEDGE_READ,
    PERMISSIONS.AI_READ,
    PERMISSIONS.REPORTS_READ, PERMISSIONS.REPORTS_WRITE,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.SKILLS_READ,
  ],
  'security-architect': [
    PERMISSIONS.ASSETS_READ, PERMISSIONS.ASSETS_WRITE,
    PERMISSIONS.VULNS_READ, PERMISSIONS.VULNS_WRITE,
    PERMISSIONS.INCIDENTS_READ, PERMISSIONS.INCIDENTS_WRITE,
    PERMISSIONS.COMPLIANCE_READ,
    PERMISSIONS.THREATS_READ, PERMISSIONS.THREATS_WRITE,
    PERMISSIONS.CAPABILITIES_READ, PERMISSIONS.CAPABILITIES_WRITE,
    PERMISSIONS.KNOWLEDGE_READ,
    PERMISSIONS.AI_READ, PERMISSIONS.AI_WRITE,
    PERMISSIONS.SKILLS_READ,
    PERMISSIONS.AUDIT_READ,
  ],
  ciso: [
    PERMISSIONS.ASSETS_READ, PERMISSIONS.ASSETS_WRITE, PERMISSIONS.ASSETS_DELETE,
    PERMISSIONS.VULNS_READ, PERMISSIONS.VULNS_WRITE, PERMISSIONS.VULNS_DELETE,
    PERMISSIONS.INCIDENTS_READ, PERMISSIONS.INCIDENTS_WRITE, PERMISSIONS.INCIDENTS_DELETE,
    PERMISSIONS.COMPLIANCE_READ, PERMISSIONS.COMPLIANCE_WRITE,
    PERMISSIONS.THREATS_READ, PERMISSIONS.THREATS_WRITE,
    PERMISSIONS.CAPABILITIES_READ, PERMISSIONS.CAPABILITIES_WRITE,
    PERMISSIONS.KNOWLEDGE_READ,
    PERMISSIONS.AI_READ,
    PERMISSIONS.LLM_MANAGE,
    PERMISSIONS.KPI_READ,
    PERMISSIONS.ROLES_READ, PERMISSIONS.ROLES_WRITE,
    PERMISSIONS.USERS_READ, PERMISSIONS.USERS_WRITE,
    PERMISSIONS.REPORTS_READ, PERMISSIONS.REPORTS_WRITE,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.SKILLS_READ,
    PERMISSIONS.COMMANDER_READ, PERMISSIONS.COMMANDER_WRITE,
    PERMISSIONS.CHANNELS_READ, PERMISSIONS.CHANNELS_WRITE,
  ],
  'security-expert': [
    PERMISSIONS.ASSETS_READ,
    PERMISSIONS.VULNS_READ, PERMISSIONS.VULNS_WRITE,
    PERMISSIONS.INCIDENTS_READ, PERMISSIONS.INCIDENTS_WRITE,
    PERMISSIONS.THREATS_READ, PERMISSIONS.THREATS_WRITE,
    PERMISSIONS.COMPLIANCE_READ,
    PERMISSIONS.CAPABILITIES_READ,
    PERMISSIONS.KNOWLEDGE_READ,
    PERMISSIONS.AI_READ, PERMISSIONS.AI_WRITE,
    PERMISSIONS.KPI_READ,
    PERMISSIONS.SKILLS_READ,
    PERMISSIONS.AUDIT_READ,
  ],
  'security-ops': [
    PERMISSIONS.ASSETS_READ, PERMISSIONS.ASSETS_WRITE,
    PERMISSIONS.VULNS_READ,
    PERMISSIONS.INCIDENTS_READ, PERMISSIONS.INCIDENTS_WRITE,
    PERMISSIONS.THREATS_READ,
    PERMISSIONS.CAPABILITIES_READ, PERMISSIONS.CAPABILITIES_WRITE,
    PERMISSIONS.KNOWLEDGE_READ,
    PERMISSIONS.AI_READ,
    PERMISSIONS.CHANNELS_READ, PERMISSIONS.CHANNELS_WRITE,
    PERMISSIONS.SKILLS_READ,
  ],
  auditor: [
    PERMISSIONS.ASSETS_READ,
    PERMISSIONS.VULNS_READ,
    PERMISSIONS.INCIDENTS_READ,
    PERMISSIONS.COMPLIANCE_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.KPI_READ,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.SKILLS_READ,
    PERMISSIONS.KNOWLEDGE_READ,
  ],
};

export function getRolePermissions(roleCode: string): string[] {
  return PERMISSION_MATRIX[roleCode] ?? [];
}

const ROLE_HIERARCHY: Record<string, string[]> = {
  'secuclaw-commander': ['security-expert', 'security-ops', 'ciso'],
  'ciso': ['security-expert', 'security-architect'],
  'security-ops': ['security-expert'],
};

export function getInheritedPermissions(roleCode: string): string[] {
  const inherited = new Set<string>();
  const stack = [roleCode];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (inherited.has(current)) continue;
    inherited.add(current);

    const parents = ROLE_HIERARCHY[current];
    if (parents) {
      for (const parent of parents) {
        if (!inherited.has(parent)) {
          stack.push(parent);
        }
      }
    }
  }

  const allPermissions: string[] = [];
  for (const role of inherited) {
    const perms = PERMISSION_MATRIX[role] ?? [];
    for (const perm of perms) {
      if (!allPermissions.includes(perm)) {
        allPermissions.push(perm);
      }
    }
  }

  return allPermissions;
}

export function hasPermissionWithInheritance(roleCode: string, required: string | string[]): boolean {
  const permissions = getInheritedPermissions(roleCode);
  const requiredList = Array.isArray(required) ? required : [required];
  return hasAnyPermission(permissions, requiredList);
}

export function hasAnyPermission(userPermissions: string[], required: string[]): boolean {
  if (userPermissions.includes('*')) return true;
  return required.some(req => {
    if (req === '*') return true;
    if (userPermissions.includes(req)) return true;
    const domain = req.split('.')[0];
    return userPermissions.includes(`${domain}.*`);
  });
}

export function hasAllPermissions(userPermissions: string[], required: string[]): boolean {
  if (userPermissions.includes('*')) return true;
  return required.every(req => {
    if (req === '*') return true;
    if (userPermissions.includes(req)) return true;
    const domain = req.split('.')[0];
    return userPermissions.includes(`${domain}.*`);
  });
}
