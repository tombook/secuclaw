import type { RouterDeps } from '../router.js';

interface Assessment {
  id: string; frameworkId: string; frameworkName: string; status: string;
  scores: Record<string, number>; assessor: string; createdAt: number; completedAt: number | null;
}
interface ImprovementPlan {
  id: string; assessmentId: string; gaps: string[]; actions: string[];
  priority: string; deadline: string; owner: string; createdAt: number;
}

const assessments = new Map<string, Assessment>();
const plans = new Map<string, ImprovementPlan>();
let seq = 0;
function gid(): string { return 'mat_' + Date.now() + '_' + (++seq); }

const frameworks = [
  { id: 'nist-csf', name: 'NIST CSF', categories: [
    { id: 'ID', name: 'Identify', questions: ['资产管理', '风险治理', '风险管理策略', '供应链管理'] },
    { id: 'PR', name: 'Protect', questions: ['访问控制', '安全意识培训', '数据安全', '维护', '保护技术'] },
    { id: 'DE', name: 'Detect', questions: ['异常检测', '持续监测', '检测过程'] },
    { id: 'RS', name: 'Respond', questions: ['响应计划', '通信', '分析', '缓解', '改进'] },
    { id: 'RC', name: 'Recover', questions: ['恢复计划', '改进', '通信'] },
  ]},
  { id: 'iso27001', name: 'ISO 27001', categories: [
    { id: 'A5', name: '信息安全政策', questions: ['管理方向', '信息安全政策'] },
    { id: 'A6', name: '信息安全组织', questions: ['内部组织', '移动设备', '远程工作'] },
    { id: 'A8', name: '资产管理', questions: ['资产责任', '信息分类', '介质处理'] },
    { id: 'A9', name: '访问控制', questions: ['访问控制要求', '用户管理', '系统访问'] },
    { id: 'A12', name: '运营安全', questions: ['操作程序', '恶意软件防护', '备份', '日志监控'] },
  ]},
];

function seed(): void {
  if (assessments.size > 0) return;
  const id = gid();
  assessments.set(id, {
    id, frameworkId: 'nist-csf', frameworkName: 'NIST CSF', status: 'completed',
    scores: { ID: 3, PR: 4, DE: 2, RS: 3, RC: 2 }, assessor: 'admin',
    createdAt: Date.now() - 2592000000, completedAt: Date.now() - 2592000000,
  });
  plans.set(gid(), {
    id: plans.size ? Array.from(plans.keys())[0] : gid(), assessmentId: id,
    gaps: ['DE-异常检测: 当前Level 2, 目标Level 4', 'RC-恢复计划: 当前Level 2, 目标Level 3'],
    actions: ['部署SIEM实时监控', '制定BCP/DRP演练计划', '实施零信任架构'],
    priority: 'high', deadline: '2026-Q3', owner: 'admin', createdAt: Date.now(),
  });
}

export function registerMaturityRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  _deps: RouterDeps
): void { seed();

  handlers.set('maturity.frameworks.list', async () => frameworks);

  handlers.set('maturity.assessments.list', async () => Array.from(assessments.values()));
  handlers.set('maturity.assessments.get', async (p) => assessments.get(p.id as string) || null);
  handlers.set('maturity.assessments.create', async (p) => {
    const fw = frameworks.find(f => f.id === p.frameworkId);
    const id = gid();
    const item = { id, frameworkId: p.frameworkId as string, frameworkName: fw?.name || '', status: 'in-progress', scores: (p.scores as Record<string, number>) || {}, assessor: (p.assessor as string) || 'admin', createdAt: Date.now(), completedAt: null } as Assessment;
    assessments.set(id, item);
    return item;
  });
  handlers.set('maturity.assessments.submit', async (p) => {
    const ex = assessments.get(p.id as string); if (!ex) throw new Error('Not found');
    ex.scores = (p.scores as Record<string, number>) || ex.scores;
    ex.status = 'completed'; ex.completedAt = Date.now();
    return ex;
  });

  handlers.set('maturity.gaps.list', async (p) => {
    const a = assessments.get(p.assessmentId as string);
    if (!a) return [];
    const fw = frameworks.find(f => f.id === a.frameworkId);
    if (!fw) return [];
    return fw.categories.map(c => ({ category: c.name, current: a.scores[c.id] || 1, target: 4, gap: Math.max(0, 4 - (a.scores[c.id] || 1)) })).filter(g => g.gap > 0);
  });

  handlers.set('maturity.trends', async () => {
    const all = Array.from(assessments.values()).filter(a => a.status === 'completed').sort((a, b) => a.createdAt - b.createdAt);
    return all.map(a => ({ date: new Date(a.createdAt).toISOString().slice(0, 10), overall: Object.values(a.scores).reduce((s, v) => s + v, 0) / Object.values(a.scores).length, scores: a.scores }));
  });

  handlers.set('maturity.improvements.list', async () => Array.from(plans.values()));
  handlers.set('maturity.improvements.create', async (p) => { const id = gid(); const item = { id, ...p, createdAt: Date.now() } as ImprovementPlan; plans.set(id, item); return item; });
}
