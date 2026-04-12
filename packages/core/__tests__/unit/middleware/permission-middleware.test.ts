import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractRoleFromRequest, permissionMiddleware, optionalPermissionMiddleware } from '../../../src/middleware/permission-middleware.js';

function createMockReq(auth?: string): any {
  return { headers: auth ? { authorization: auth } : {} };
}

function createMockRes(): any {
  return {
    statusCode: 200,
    status(n: number) { this.statusCode = n; return this; },
    json: vi.fn(),
  };
}

describe('permission-middleware', () => {
  describe('extractRoleFromRequest', () => {
    it('should extract role from valid JWT token', () => {
      const payload = { role: 'security-expert', userId: 'u1' };
      const token = Buffer.from(JSON.stringify(payload)).toString('base64');
      const req = createMockReq(`Bearer header.${token}.signature`);
      const role = extractRoleFromRequest(req);
      expect(role).toBe('security-expert');
    });

    it('should extract roleId from token when role not present', () => {
      const payload = { roleId: 'ciso', userId: 'u2' };
      const token = Buffer.from(JSON.stringify(payload)).toString('base64');
      const req = createMockReq(`Bearer header.${token}.signature`);
      const role = extractRoleFromRequest(req);
      expect(role).toBe('ciso');
    });

    it('should return null when no authorization header', () => {
      const req = createMockReq();
      const role = extractRoleFromRequest(req);
      expect(role).toBeNull();
    });

    it('should return null when authorization header does not start with Bearer', () => {
      const req = createMockReq('Basic abc123');
      const role = extractRoleFromRequest(req);
      expect(role).toBeNull();
    });

    it('should return null for invalid base64 in token', () => {
      const req = createMockReq('Bearer invalid-token!!!');
      const role = extractRoleFromRequest(req);
      expect(role).toBeNull();
    });

    it('should return null when token payload has no role', () => {
      const payload = { userId: 'u1' };
      const token = Buffer.from(JSON.stringify(payload)).toString('base64');
      const req = createMockReq(`Bearer header.${token}.signature`);
      const role = extractRoleFromRequest(req);
      expect(role).toBeNull();
    });
  });

  describe('permissionMiddleware', () => {
    it('should call next when user has required permission', () => {
      const middleware = permissionMiddleware(['vulnerabilities.read']);
      const payload = { role: 'security-expert' };
      const token = Buffer.from(JSON.stringify(payload)).toString('base64');
      const req = createMockReq(`Bearer header.${token}.signature`);
      const res = createMockRes();
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      expect(req.permissionService).toBeDefined();
      expect(req.roleId).toBe('security-expert');
    });

    it('should return 403 when user lacks required permission', () => {
      const middleware = permissionMiddleware(['assets.write']);
      const payload = { role: 'supply-chain-security' };
      const token = Buffer.from(JSON.stringify(payload)).toString('base64');
      const req = createMockReq(`Bearer header.${token}.signature`);
      const res = createMockRes();
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden: Insufficient permissions' });
    });

    it('should return 401 when no authorization header', () => {
      const middleware = permissionMiddleware(['assets.read']);
      const req = createMockReq();
      const res = createMockRes();
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized: No role found' });
    });

    it('should accept multiple permissions (any match)', () => {
      const middleware = permissionMiddleware(['vulnerabilities.read', 'assets.write']);
      const payload = { role: 'security-expert' };
      const token = Buffer.from(JSON.stringify(payload)).toString('base64');
      const req = createMockReq(`Bearer header.${token}.signature`);
      const res = createMockRes();
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow admin wildcard bypass', () => {
      const middleware = permissionMiddleware(['anything.write']);
      const payload = { role: 'admin' };
      const token = Buffer.from(JSON.stringify(payload)).toString('base64');
      const req = createMockReq(`Bearer header.${token}.signature`);
      const res = createMockRes();
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('optionalPermissionMiddleware', () => {
    it('should call next even without auth header', () => {
      const middleware = optionalPermissionMiddleware();
      const req = createMockReq();
      const res = createMockRes();
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should attach permissionService when role is provided', () => {
      const middleware = optionalPermissionMiddleware();
      const payload = { role: 'security-expert' };
      const token = Buffer.from(JSON.stringify(payload)).toString('base64');
      const req = createMockReq(`Bearer header.${token}.signature`);
      const res = createMockRes();
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.permissionService).toBeDefined();
      expect(req.roleId).toBe('security-expert');
    });

    it('should not attach permissionService when no valid role', () => {
      const middleware = optionalPermissionMiddleware();
      const req = createMockReq();
      const res = createMockRes();
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.permissionService).toBeUndefined();
      expect(req.roleId).toBeUndefined();
    });
  });
});