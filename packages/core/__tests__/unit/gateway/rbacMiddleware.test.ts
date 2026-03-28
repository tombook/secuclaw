import { rbacMiddleware } from '../../../src/gateway/middleware/rbacMiddleware';

type Req = any;
type Res = any;

function createMockReq(user?: any): Req {
  return { user };
}

function createMockRes() {
  const res: any = {
    statusCode: 200,
    status(n: number) { this.statusCode = n; return this; },
    json: jest.fn(),
  };
  return res;
}

describe('RBAC Middleware', () => {
  test('allow when user has required role', () => {
    const middleware = rbacMiddleware(['manager']);
    const req = createMockReq({ id: 'u1', roles: ['user', 'manager'] });
    const res = createMockRes();
    const next = jest.fn();
    middleware(req, res, next);
    expect(next).toBeCalled();
    expect(res.statusCode).toBe(200);
  });

  test('forbid when user lacks required role', () => {
    const middleware = rbacMiddleware(['admin']);
    const req = createMockReq({ id: 'u2', roles: ['user'] });
    const res = createMockRes();
    const next = jest.fn();
    middleware(req, res, next);
    expect(next).not.toBeCalled();
    expect(res.statusCode).toBe(403);
  });

  test('allow admin bypass all role checks', () => {
    const middleware = rbacMiddleware(['manager']);
    const req = createMockReq({ id: 'u3', roles: ['admin'] });
    const res = createMockRes();
    const next = jest.fn();
    middleware(req, res, next);
    expect(next).toBeCalled();
  });

  test('allow when no required roles specified', () => {
    const middleware = rbacMiddleware([]);
    const req = createMockReq({ id: 'u4', roles: ['user'] });
    const res = createMockRes();
    const next = jest.fn();
    middleware(req, res, next);
    expect(next).toBeCalled();
  });

  test('forbid when user has no roles', () => {
    const middleware = rbacMiddleware(['user']);
    const req = createMockReq({ id: 'u5', roles: [] });
    const res = createMockRes();
    const next = jest.fn();
    middleware(req, res, next);
    expect(next).not.toBeCalled();
    expect(res.statusCode).toBe(403);
  });

  test('forbid when user is not authenticated', () => {
    const middleware = rbacMiddleware(['user']);
    const req = createMockReq();
    const res = createMockRes();
    const next = jest.fn();
    middleware(req, res, next);
    expect(next).not.toBeCalled();
    expect(res.statusCode).toBe(403);
  });
});
