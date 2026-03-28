import { auditMiddleware, getInMemoryAudits } from '../../../src/gateway/middleware/auditMiddleware';

function createMockReq() {
  return {
    method: 'GET',
    url: '/api/test',
    originalUrl: '/api/test',
    headers: { 'content-length': '0' },
    user: { id: 'u1' },
  } as any;
}

function createMockRes() {
  const events: any[] = [];
  const res: any = {
    statusCode: 200,
    on(event: string, cb: Function) {
      if (event === 'finish') {
        events.push(cb);
      }
    },
  };
  res.emitFinish = () => { events.forEach((cb) => cb()); };
  return res;
}

describe('Audit Middleware', () => {
  afterEach(() => { (getInMemoryAudits() as any).length = 0; });

  test('records audit event on finish', () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = jest.fn();
    const mw = auditMiddleware({ logToConsole: false, enableInMemoryStore: true });
    mw(req, res, next);
    
    res.statusCode = 201;
    res.emitFinish();
    
    const audits = getInMemoryAudits();
    expect(audits.length).toBe(1);
    expect(audits[0].path).toBe('/api/test');
    expect(audits[0].method).toBe('GET');
    expect(audits[0].userId).toBe('u1');
    expect(audits[0].status).toBe(201);
    expect(audits[0].durationMs).toBeGreaterThanOrEqual(0);
  });

  test('calls custom log function if provided', () => {
    const customLogFn = jest.fn();
    const req = createMockReq();
    const res = createMockRes();
    const next = jest.fn();
    const mw = auditMiddleware({ logFn: customLogFn, enableInMemoryStore: false });
    
    mw(req, res, next);
    res.emitFinish();
    
    expect(customLogFn).toBeCalled();
    expect(getInMemoryAudits().length).toBe(0);
  });

  test('logs to console when enabled', () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    const req = createMockReq();
    const res = createMockRes();
    const next = jest.fn();
    const mw = auditMiddleware({ logToConsole: true, enableInMemoryStore: false });
    
    mw(req, res, next);
    res.emitFinish();
    
    expect(consoleLogSpy).toBeCalled();
    consoleLogSpy.mockRestore();
  });
});
