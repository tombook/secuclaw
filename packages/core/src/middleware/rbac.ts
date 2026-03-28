import { hasAnyPermission } from '../roles/permissions.js';

type Handler = (params: Record<string, unknown>) => Promise<unknown>;

export function createRbacGuard(requiredPermissions: string[]): (handler: Handler) => Handler {
  return (handler: Handler): Handler => {
    return async (params: Record<string, unknown>) => {
      const user = params._user as { permissions?: string[] } | undefined;

      if (!user?.permissions) {
        throw Object.assign(new Error('Authentication required'), { code: 'AUTH_REQUIRED' });
      }

      if (!hasAnyPermission(user.permissions, requiredPermissions)) {
        throw Object.assign(
          new Error(`Insufficient permissions. Required: ${requiredPermissions.join(', ')}`),
          { code: 'FORBIDDEN' }
        );
      }

      return handler(params);
    };
  };
}

export const METHOD_PERMISSIONS: Record<string, string[]> = {
  assets: ['assets.read'],
  vulnerabilities: ['vulnerabilities.read'],
  incidents: ['incidents.read'],
  threats: ['threats.read'],
  compliance: ['compliance.read'],
  capabilities: ['capabilities.read'],
  commander: ['commander.read'],
  channels: ['channels.read'],
  kpi: ['kpi.read'],
  ai: ['ai.read'],
  knowledge: ['knowledge.read'],
  skills: ['skills.read'],
  auth: ['auth.read'],
  llm: ['llm.manage'],
  aiExperts: ['llm.manage'],
};
