import type { RouterDeps } from '../router.js';
import { initRiskAssessmentService, getRiskAssessmentService } from '../../capabilities/risk-assessment-service.js';
import { PlaybookEngine } from '../../commander/playbook-engine.js';
import { PlaybookRepository } from '../../commander/playbook-repository.js';
import type { Playbook, PlaybookStatus, TriggerType, PlaybookTrigger, PlaybookStep } from '../../commander/playbook-types.js';

let engine: PlaybookEngine | null = null;

function getEngine(deps: RouterDeps): PlaybookEngine {
  if (!engine) {
    const repo = new PlaybookRepository(deps.jsonStore);
    // Initialize a capability bridge. This bridge is currently a simple passthrough
    // and is wired to allow future expansion (e.g., delegating to a risk service).
    const initBridge = (): Promise<{ invokeCapability: (capabilityId: string, params: Record<string, unknown>) => Promise<any> }> => {
      try {
        initRiskAssessmentService(deps.jsonStore);
      } catch {
        // ignore – not strictly required for playbooks
      }
      const bridge = {
        invokeCapability: async (capabilityId: string, params: Record<string, unknown>): Promise<any> => {
          try {
            // Access risk service if available; this is a placeholder for now
            getRiskAssessmentService();
            if (capabilityId.startsWith('risk.')) {
              return { ok: true, capabilityId, params, riskPresent: true };
            }
          } catch {
            // risk service not available; fall through to default
          }
          return { ok: true, capabilityId, params };
        },
      };
      return Promise.resolve(bridge);
    };

    const bridgePromise = initBridge();
    engine = new PlaybookEngine(repo, {
      invokeCapability: async (capabilityId: string, params: Record<string, unknown>) => {
        const bridge = await bridgePromise;
        return bridge.invokeCapability(capabilityId, params);
      },
    } as any);
  }
  // Cast safe; engine is now initialized
  return engine;
}

const SAMPLE_PLAYBOOKS: Playbook[] = [
  {
    id: 'pb-incident-response', name: '安全事件自动响应', description: '自动隔离受影响资产并通知安全团队', version: '1.0',
    trigger: { id: 'trg-1', type: 'alarm' as TriggerType, config: { severity: 'critical' } },
    rootStep: { id: 's1', name: 'root', type: 'serial', config: { subSteps: [] } },
    status: 'enabled' as PlaybookStatus, createdAt: Date.now() - 86400000 * 30, updatedAt: Date.now() - 86400000,
  },
  {
    id: 'pb-ransomware', name: '勒索软件应急处置', description: '检测→隔离→取证→恢复→报告', version: '1.0',
    trigger: { id: 'trg-2', type: 'alarm' as TriggerType, config: { type: 'ransomware' } },
    rootStep: { id: 's2', name: 'root', type: 'serial', config: { subSteps: [] } },
    status: 'enabled' as PlaybookStatus, createdAt: Date.now() - 86400000 * 20, updatedAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'pb-ddos-mitigation', name: 'DDoS攻击缓解', description: '检测异常流量→自动启动流量清洗→CDN切换→恢复', version: '1.0',
    trigger: { id: 'trg-3', type: 'alarm' as TriggerType, config: { type: 'ddos' } },
    rootStep: { id: 's3', name: 'root', type: 'serial', config: { subSteps: [] } },
    status: 'enabled' as PlaybookStatus, createdAt: Date.now() - 86400000 * 15, updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'pb-vuln-auto-patch', name: '高危漏洞自动修补', description: '检测高危漏洞→测试补丁→部署补丁→验证', version: '0.9',
    trigger: { id: 'trg-4', type: 'cron' as TriggerType, config: { schedule: '0 */6 * * *' } },
    rootStep: { id: 's4', name: 'root', type: 'serial', config: { subSteps: [] } },
    status: 'disabled' as PlaybookStatus, createdAt: Date.now() - 86400000 * 10, updatedAt: Date.now() - 86400000,
  },
  {
    id: 'pb-compliance-scan', name: '合规自动检查', description: '定期扫描配置→对比合规框架→生成差距报告', version: '1.1',
    trigger: { id: 'trg-5', type: 'cron' as TriggerType, config: { schedule: '0 2 * * 1' } },
    rootStep: { id: 's5', name: 'root', type: 'serial', config: { subSteps: [] } },
    status: 'enabled' as PlaybookStatus, createdAt: Date.now() - 86400000 * 5, updatedAt: Date.now() - 86400000 * 2,
  },
];

export function registerPlaybookRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  deps: RouterDeps
): void {
  handlers.set('playbook.list', async (params) => {
    const repo = new PlaybookRepository(deps.jsonStore);
    const stored = await repo.getAll();
    const status = params.status as PlaybookStatus | undefined;
    const list = stored.length > 0 ? stored : SAMPLE_PLAYBOOKS;
    const filtered = status ? list.filter(p => p.status === status) : list;
    return { data: filtered.map(p => ({
      id: p.id, name: p.name, description: p.description, version: p.version,
      status: p.status, triggerType: p.trigger.type,
      stepCount: countSteps(p.rootStep), createdAt: p.createdAt, updatedAt: p.updatedAt,
    })) };
  });

  // Create a new playbook
  handlers.set('playbook.create', async (params) => {
    const repo = new PlaybookRepository(deps.jsonStore);
    const now = Date.now();
    const id = `pb_${now}_${Math.random().toString(36).substring(2, 8)}`;
    const payload: Partial<Playbook> = params.playbook as any ?? {};
    // Basic fallbacks to keep the API ergonomic
    const newPlaybook: Playbook = {
      id,
      name: payload.name ?? 'New Playbook',
      description: payload.description ?? '',
      version: payload.version ?? '1.0',
      trigger: (payload.trigger ?? { id: 'trg-new', type: 'manual' as TriggerType, config: {} }) as PlaybookTrigger,
      rootStep: (payload.rootStep ?? { id: 's_root', name: 'root', type: 'serial' as const, config: { subSteps: [] } }) as PlaybookStep,
      status: (payload.status ?? 'enabled') as PlaybookStatus,
      createdAt: now,
      updatedAt: now,
    };
    const created = await repo.create(newPlaybook);
    return created;
  });

  // Update an existing playbook
  handlers.set('playbook.update', async (params) => {
    const repo = new PlaybookRepository(deps.jsonStore);
    const id = params.id as string;
    if (!id) throw new Error('id required');
    const updates = (params as any).updates ?? (params as any).update ?? {};
    const updated = await repo.update(id, updates as Partial<Playbook>);
    if (!updated) throw new Error(`Playbook not found: ${id}`);
    return updated;
  });

  // Delete a playbook
  handlers.set('playbook.delete', async (params) => {
    const repo = new PlaybookRepository(deps.jsonStore);
    const id = params.id as string;
    if (!id) throw new Error('id required');
    const ok = await repo.delete(id);
    return { id, deleted: ok };
  });

  handlers.set('playbook.listExecutions', async (_params) => {
    return { data: [] as any[] };
  });

  handlers.set('playbook.get', async (params) => {
    const repo = new PlaybookRepository(deps.jsonStore);
    const id = params.id as string;
    if (!id) throw new Error('id required');
    const stored = await repo.getById(id);
    const found = stored ?? SAMPLE_PLAYBOOKS.find(p => p.id === id);
    if (!found) throw new Error(`Playbook not found: ${id}`);
    return found;
  });

  handlers.set('playbook.start', async (params) => {
    const playbookId = params.playbookId as string;
    if (!playbookId) throw new Error('playbookId required');
    const execId = await getEngine(deps).start(playbookId, params.triggerParams as Record<string, unknown> ?? {});
    return { execId, playbookId, status: 'running' as const, startedAt: Date.now() };
  });

  handlers.set('playbook.cancel', async (params) => {
    const execId = params.execId as string;
    if (!execId) throw new Error('execId required');
    const eng = getEngine(deps);
    const cancelled = await eng.cancel(execId);
    return { execId, cancelled };
  });

  handlers.set('playbook.getStatus', async (params) => {
    const execId = params.execId as string;
    if (!execId) throw new Error('execId required');
    const eng = getEngine(deps);
    const ctx = eng.getStatus(execId);
    if (!ctx) return { execId, status: 'not_found'as const };
    return ctx;
  });

  handlers.set('playbook.getExecution', async (params) => {
    const execId = params.execId as string;
    if (!execId) throw new Error('execId required');
    const eng = getEngine(deps);
    const result = await eng.getExecutionResult(execId);
    return result ?? { execId, status: 'not_found'as const };
  });
}

function countSteps(step: any): number {
  let count = 1;
  if (step.config?.subSteps) {
    for (const sub of step.config.subSteps) { count += countSteps(sub); }
  }
  return count;
}
