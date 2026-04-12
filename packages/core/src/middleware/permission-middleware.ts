import { PermissionService } from '../roles/permission-service.js';

declare global {
  namespace Express {
    interface Request {
      permissionService?: PermissionService;
      roleId?: string;
    }
  }
}

export function extractRoleFromRequest(req: any): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.role || payload.roleId || null;
  } catch {
    return null;
  }
}

export function permissionMiddleware(requiredPermissions: string[]) {
  return (req: any, res: any, next: any) => {
    const roleId = extractRoleFromRequest(req);
    
    if (!roleId) {
      return res.status(401).json({ error: 'Unauthorized: No role found' });
    }

    const permissionService = PermissionService.fromRole(roleId);
    req.permissionService = permissionService;
    req.roleId = roleId;

    if (!permissionService.can(requiredPermissions)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
}

export function optionalPermissionMiddleware() {
  return (req: any, res: any, next: any) => {
    const roleId = extractRoleFromRequest(req);
    
    if (roleId) {
      const permissionService = PermissionService.fromRole(roleId);
      req.permissionService = permissionService;
      req.roleId = roleId;
    }

    next();
  };
}
