import { describe, it, expect, beforeAll } from 'vitest';
import { CachedJsonStore } from '../src/storage/cached-json-store.js';
import { CspmEngine } from '../src/cspm/cspm-engine.js';
import { CredentialStuffingDetector } from '../src/itdr/credential-stuffing-detector.js';
import { IncidentResponder } from '../src/itdr/incident-responder.js';
import { BillingService } from '../src/billing/billing-service.js';
import { AuditLogger } from '../src/audit/audit-logger.js';

const TEST_DIR = './data/bench';

function fmtMs(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(1)}us`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function fmtOps(ops: number, timeMs: number): string {
  return `${(ops / (timeMs / 1000)).toFixed(0)} ops/sec`;
}

describe('SecuClaw Performance Benchmark', () => {
  let store: CachedJsonStore;

  beforeAll(async () => {
    store = new CachedJsonStore(TEST_DIR, { enabled: true, maxKeys: 1000 });
  });

  it('CachedJsonStore: 10000 sequential reads', async () => {
    await store.set('bench/key1.json', { v: 'cached' });
    const start = Date.now();
    for (let i = 0; i < 10000; i++) {
      await store.get('bench/key1.json');
    }
    const elapsed = Date.now() - start;
    const stats = store.getCacheStats();
    console.log(`[BENCH] 10000 reads: ${fmtMs(elapsed)} total, ${fmtOps(10000, elapsed)}, hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
    expect(elapsed).toBeLessThan(5000);
  });

  it('CachedJsonStore: 1000 writes', async () => {
    const start = Date.now();
    for (let i = 0; i < 1000; i++) {
      await store.set(`bench/writes/${i}.json`, { idx: i, payload: 'x'.repeat(100) });
    }
    const elapsed = Date.now() - start;
    console.log(`[BENCH] 1000 writes: ${fmtMs(elapsed)} total, ${fmtOps(1000, elapsed)}`);
    expect(elapsed).toBeLessThan(10000);
  });

  it('CachedJsonStore: 100 mixed (50% read, 50% write)', async () => {
    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      if (i % 2 === 0) await store.set(`bench/mixed/${i}.json`, { idx: i });
      else await store.get(`bench/mixed/${i - 1}.json`);
    }
    const elapsed = Date.now() - start;
    console.log(`[BENCH] 100 mixed: ${fmtMs(elapsed)} total, ${fmtOps(100, elapsed)}`);
    expect(elapsed).toBeLessThan(2000);
  });

  it('ITDR: 100 credential stuffing logins', async () => {
    const cred = new CredentialStuffingDetector(store);
    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      await cred.recordLogin({
        timestamp: Date.now(), userId: `u${i % 10}`, username: `user${i % 10}`, sourceIp: `1.2.3.${i % 255}`, userAgent: 'bench', geo: 'Beijing', country: 'CN', asn: 12345, deviceFingerprint: null, authMethod: 'password', mfaCompleted: false, success: false, failureReason: 'invalid', responseTime: 50, sessionId: null, application: 'web', headers: {},
      });
    }
    const elapsed = Date.now() - start;
    console.log(`[BENCH] 100 credential logins: ${fmtMs(elapsed)} total, ${fmtOps(100, elapsed)}`);
    expect(elapsed).toBeLessThan(10000);
  });

  it('Audit Logger: 500 audit entries with chain validation', async () => {
    const audit = new AuditLogger(store);
    const start = Date.now();
    for (let i = 0; i < 500; i++) {
      await audit.log({ tenantId: 't1', actorId: `u${i}`, actorType: 'user', action: 'read', resource: 'asset', outcome: 'success', severity: 'info', description: `read ${i}` });
    }
    const elapsed = Date.now() - start;
    const chain = await audit.verifyChain('t1');
    console.log(`[BENCH] 500 audit logs: ${fmtMs(elapsed)} total, ${fmtOps(500, elapsed)}, chain valid: ${chain.valid}, checked: ${chain.checked}`);
    expect(chain.valid).toBe(true);
    expect(elapsed).toBeLessThan(20000);
  });

  it('Billing: 50 subscription creations + stats aggregation', async () => {
    const freshStore = new CachedJsonStore('./data/bench-billing-' + Date.now(), { enabled: false, maxKeys: 100 });
    const billing = new BillingService(freshStore);
    await billing.initializePlans();
    const plans = await billing.listPlans();
    const enterprise = plans.find((p) => p.code === 'enterprise')!;
    expect(enterprise).toBeDefined();
    const start = Date.now();
    let successCount = 0;
    for (let i = 0; i < 50; i++) {
      try {
        await billing.createSubscription({ tenantId: `bench-t-${i}`, planId: enterprise.id, cycle: 'monthly' });
        successCount++;
      } catch (e) {
        console.log(`[BENCH] sub ${i} failed: ${(e as Error).message?.slice(0, 80)}`);
      }
    }
    const statsStart = Date.now();
    const stats = await billing.getStats();
    const statsElapsed = Date.now() - statsStart;
    const elapsed = Date.now() - start;
    console.log(`[BENCH] ${successCount} subscriptions: ${fmtMs(elapsed)} total (stats: ${fmtMs(statsElapsed)}), MRR: $${stats.monthlyRecurringRevenue.toFixed(0)}`);
    expect(successCount).toBeGreaterThan(0);
  });

  it('ITDR Responder: 100 trigger evaluations', async () => {
    const responder = new IncidentResponder(store);
    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      await responder.trigger({ threatType: 'brute_force', threatId: `t${i}`, severity: 'critical', userId: 'alice', sourceIp: '9.9.9.9', detection: {} });
    }
    const elapsed = Date.now() - start;
    console.log(`[BENCH] 100 responder triggers: ${fmtMs(elapsed)} total, ${fmtOps(100, elapsed)}`);
    expect(elapsed).toBeLessThan(20000);
  });

  it('CspmEngine: 100 control evaluations', async () => {
    const cspm = new CspmEngine(store);
    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      await cspm.runAllChecks?.({
        cloudProvider: 'aws',
        accessKeyId: 'test',
        secretAccessKey: 'test',
        regions: ['us-east-1'],
        services: ['ec2', 's3', 'iam'],
      }).catch(() => null);
    }
    const elapsed = Date.now() - start;
    console.log(`[BENCH] 100 CSPM checks: ${fmtMs(elapsed)} total, ${fmtOps(100, elapsed)}`);
  });

  it('Cache hit rate after workload', async () => {
    const stats = store.getCacheStats();
    console.log(`[BENCH] Final cache stats: size=${stats.size}, hits=${stats.hits}, misses=${stats.misses}, hit rate=${(stats.hitRate * 100).toFixed(1)}%`);
    expect(stats.hitRate).toBeGreaterThan(0.5);
  });
});
