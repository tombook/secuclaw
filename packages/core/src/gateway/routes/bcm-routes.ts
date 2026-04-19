import type { RouterDeps } from '../router.js';

interface BusinessProcess { id: string; name: string; criticality: string; owner: string; rto: number; rpo: number; dependencies: string[]; linkedAssets: string[]; }
interface BCPPlan { id: string; processId: string; version: string; status: string; sections: string[]; approver: string; approvedAt: number | null; createdAt: number; }
interface DRPPlan { id: string; name: string; scope: string; steps: { order: number; action: string; responsible: string; resources: string }[]; testDate: string | null; createdAt: number; }
interface BCMDrill { id: string; planId: string; type: string; status: string; participants: string[]; findings: string[]; score: number; createdAt: number; }

const processes = new Map<string, BusinessProcess>();
const bcpPlans = new Map<string, BCPPlan>();
const drpPlans = new Map<string, DRPPlan>();
const drills = new Map<string, BCMDrill>();
let seq = 0;
function gid(): string { return 'bcm_' + Date.now() + '_' + (++seq); }

function seed(): void {
  if (processes.size > 0) return;
  const now = Date.now();
  [{ name: '在线支付', criticality: 'critical', owner: 'CFO', rto: 1, rpo: 0, dependencies: ['银行网关', '支付网关'], linkedAssets: ['asset_app_01'] },
   { name: '客户服务', criticality: 'high', owner: 'COO', rto: 4, rpo: 1, dependencies: ['CRM', '呼叫中心'], linkedAssets: ['asset_app_02'] },
   { name: '供应链管理', criticality: 'high', owner: 'CSO', rto: 8, rpo: 4, dependencies: ['ERP', '物流系统'], linkedAssets: ['asset_app_03'] },
   { name: 'HR管理', criticality: 'medium', owner: 'CHRO', rto: 24, rpo: 8, dependencies: ['HRIS'], linkedAssets: [] },
   { name: '财务报告', criticality: 'medium', owner: 'CFO', rto: 48, rpo: 24, dependencies: ['ERP', '数据仓库'], linkedAssets: [] },
  ].forEach(p => { const id = gid(); processes.set(id, { id, ...p }); });

  const pids = Array.from(processes.keys());
  [{ processId: pids[0], version: '2.0', status: 'approved', sections: ['应急响应', '通信计划', '资源清单', '恢复步骤'], approver: 'admin', approvedAt: now - 86400000 },
   { processId: pids[1], version: '1.5', status: 'review', sections: ['服务降级方案', '备用系统切换'], approver: '', approvedAt: null },
   { processId: pids[2], version: '1.0', status: 'draft', sections: ['供应商备选方案'], approver: '', approvedAt: null },
  ].forEach(p => { const id = gid(); bcpPlans.set(id, { id, ...p, createdAt: now - 172800000 }); });

  [{ name: '数据中心灾难恢复', scope: '全部生产系统', steps: [{ order: 1, action: '启动备用数据中心', responsible: 'IT运维', resources: '备用DC' }, { order: 2, action: '恢复数据库', responsible: 'DBA', resources: '备份存储' }, { order: 3, action: '切换DNS', responsible: '网络组', resources: 'DNS服务' }], testDate: '2026-06-15' },
   { name: '勒索软件响应', scope: '所有终端', steps: [{ order: 1, action: '隔离受影响终端', responsible: 'SOC', resources: 'EDR' }, { order: 2, action: '从备份恢复', responsible: 'IT运维', resources: '备份系统' }], testDate: '2026-05-01' },
  ].forEach(p => { const id = gid(); drpPlans.set(id, { id, ...p, createdAt: now - 259200000 }); });

  [{ planId: Array.from(drpPlans.keys())[0], type: 'tabletop', status: 'completed', participants: ['IT运维', '安全团队', '管理层'], findings: ['DNS切换时间过长', '需要更新联系人列表'], score: 72, createdAt: now - 604800000 },
   { planId: Array.from(drpPlans.keys())[1], type: 'full', status: 'scheduled', participants: ['SOC', 'IT运维'], findings: [], score: 0, createdAt: now },
  ].forEach(d => { const id = gid(); drills.set(id, { id, ...d }); });
}

export function registerBcmRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  _deps: RouterDeps
): void { seed();

  handlers.set('bcm.processes.list', async () => Array.from(processes.values()));
  handlers.set('bcm.processes.get', async (p) => processes.get(p.id as string) || null);
  handlers.set('bcm.processes.create', async (p) => { const id = gid(); const item = { id, ...p } as BusinessProcess; processes.set(id, item); return item; });
  handlers.set('bcm.processes.update', async (p) => { const ex = processes.get(p.id as string); if (!ex) throw new Error('Not found'); const u = { ...ex, ...p } as BusinessProcess; processes.set(ex.id, u); return u; });

  handlers.set('bcm.bcp.list', async () => Array.from(bcpPlans.values()));
  handlers.set('bcm.bcp.get', async (p) => bcpPlans.get(p.id as string) || null);
  handlers.set('bcm.bcp.create', async (p) => { const id = gid(); const item = { id, ...p, status: 'draft', approvedAt: null, createdAt: Date.now() } as BCPPlan; bcpPlans.set(id, item); return item; });
  handlers.set('bcm.bcp.approve', async (p) => { const ex = bcpPlans.get(p.id as string); if (!ex) throw new Error('Not found'); ex.status = 'approved'; ex.approver = p.approver as string; ex.approvedAt = Date.now(); return ex; });

  handlers.set('bcm.drp.list', async () => Array.from(drpPlans.values()));
  handlers.set('bcm.drp.get', async (p) => drpPlans.get(p.id as string) || null);
  handlers.set('bcm.drp.create', async (p) => { const id = gid(); const item = { id, ...p, createdAt: Date.now() } as DRPPlan; drpPlans.set(id, item); return item; });
  handlers.set('bcm.drp.update', async (p) => { const ex = drpPlans.get(p.id as string); if (!ex) throw new Error('Not found'); const u = { ...ex, ...p } as DRPPlan; drpPlans.set(ex.id, u); return u; });

  handlers.set('bcm.drills.list', async () => Array.from(drills.values()));
  handlers.set('bcm.drills.get', async (p) => drills.get(p.id as string) || null);
  handlers.set('bcm.drills.create', async (p) => { const id = gid(); const item = { id, ...p, score: 0, findings: [], createdAt: Date.now() } as BCMDrill; drills.set(id, item); return item; });
  handlers.set('bcm.drills.evaluate', async (p) => { const ex = drills.get(p.id as string); if (!ex) throw new Error('Not found'); ex.score = (p.score as number) || 0; ex.findings = (p.findings as string[]) || []; ex.status = 'completed'; return ex; });
}
