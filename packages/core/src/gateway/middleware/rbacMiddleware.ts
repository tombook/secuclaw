import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * RBAC Middleware
 * - Enforces that the authenticated user has at least one of the required roles.
 * - Admin role bypasses checks.
 * - If roles are missing, the request is forbidden.
 */
export function rbacMiddleware(requiredRoles: string[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    const roles: string[] = Array.isArray(user?.roles) ? user.roles : [];

    // No authenticated user or no roles -> forbidden
    if (!roles.length) {
      res.status(403).json({ error: 'Forbidden: missing user roles' });
      return;
    }

    // Admin bypass
    if (roles.includes('admin') || requiredRoles.length === 0) {
      return next();
    }

    // Check if user has any of the required roles
    const hasAccess = roles.some((r) => requiredRoles.includes(r) || r === 'admin');
    if (!hasAccess) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}
