import type { RouterDeps } from '../router.js';

interface AttackPath {
  id: string; name: string; startNode: string; endNode: string;
  steps: { assetId: string; vulnId: string; technique: string }[];
  riskScore: number; likelihood: string;
}
interface RedTeamExercise {
  id: string; name: string; type: string; status: string;
  scope: string; objectives: string[]; timeline: string;
  results: string[]; score: number; createdAt: number;
}

const attackPaths = new Map<string, AttackPath>();
const exercises = new Map<string, RedTeamExercise>();
let seq = 0;
function gid(): string { return 'atk_' + Date.now() + '_' + (++seq); }

function seed(): void {
  if (attackPaths.size > 0) return;
  const now = Date.now();
  [{ name: '外网→内网横向移动', startNode: 'DMZ', endNode: 'CoreDB', steps: [{ assetId: 'web_server', vulnId: 'CVE-2026-0001', technique: 'T1190-Exploit Public App' }, { assetId: 'app_server', vulnId: 'CVE-2026-0002', technique: 'T1021-Remote Services' }, { assetId: 'db_server', vulnId: '', technique: 'T1078-Valid Accounts' }], riskScore: 88, likelihood: 'high' },
   { name: '钓鱼→权限提升', startNode: 'Mail', endNode: 'Domain Controller', steps: [{ assetId: 'workstation', vulnId: '', technique: 'T1566-Phishing' }, { assetId: 'workstation', vulnId: 'CVE-2026-0003', technique: 'T1068-Privilege Exploitation' }, { assetId: 'dc', vulnId: '', technique: 'T1558-Kerberoasting' }], riskScore: 75, likelihood: 'medium' },
   { name: '供应链→代码注入', startNode: 'CI/CD', endNode: 'Production', steps: [{ assetId: 'build_server', vulnId: '', technique: 'T1195-Supply Chain Compromise' }, { assetId: 'prod_server', vulnId: '', technique: 'T1059-Command Scripting' }], riskScore: 65, likelihood: 'low' },
  ].forEach(p => { const id = gid(); attackPaths.set(id, { id, ...p }); });

  [{ name: '2026 Q1红蓝对抗', type: 'purple', status: 'completed', scope: '全公司网络', objectives: ['检测APT能力', '响应流程验证', '架构安全评估'], timeline: '2026-01-15 ~ 2026-01-20', results: ['检测到3个攻击路径', '平均响应时间45分钟', '发现2个未覆盖盲区'], score: 78, createdAt: now - 7776000000 },
   { name: '2026 Q2钓鱼演练', type: 'red', status: 'scheduled', scope: '全员邮件', objectives: ['钓鱼识别率测试'], timeline: '2026-05-01', results: [], score: 0, createdAt: now },
   { name: '安全架构评估', type: 'blue', status: 'in-progress', scope: '零信任架构', objectives: ['架构覆盖度评估', '检测盲区发现'], timeline: '2026-04-10 ~ 2026-04-25', results: ['初步发现网络分段弱点'], score: 0, createdAt: now - 864000000 },
  ].forEach(e => { const id = gid(); exercises.set(id, { id, ...e }); });
}

export function registerAttackPathRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  _deps: RouterDeps
): void { seed();

  handlers.set('attack-path.generate', async () => {
    const newId = gid();
    const path: AttackPath = { id: newId, name: '自动生成路径', startNode: 'Internet', endNode: 'CoreData', steps: [{ assetId: 'firewall', vulnId: '', technique: 'T1190' }, { assetId: 'web_app', vulnId: 'CVE-2026-0001', technique: 'T1059' }], riskScore: 55, likelihood: 'medium' };
    attackPaths.set(newId, path);
    return path;
  });
  handlers.set('attack-path.list', async () => Array.from(attackPaths.values()));
  handlers.set('attack-path.get', async (p) => attackPaths.get(p.id as string) || null);
  handlers.set('attack-path.surface', async () => ({
    entryPoints: [{ asset: 'Web Server', exposures: ['HTTP/HTTPS', 'API'] }, { asset: 'VPN Gateway', exposures: ['VPN'] }],
    linkedVulns: [{ asset: 'Web Server', vulnCount: 3, highestCVSS: 9.1 }, { asset: 'App Server', vulnCount: 1, highestCVSS: 7.5 }],
  }));
  handlers.set('attack-path.coverage', async () => {
    const paths = Array.from(attackPaths.values());
    const techniques = new Set(paths.flatMap(p => p.steps.map(s => s.technique)));
    return { totalTechniques: techniques.size, covered: Math.ceil(techniques.size * 0.6), uncovered: Math.floor(techniques.size * 0.4), coverageRate: 0.6 };
  });

  handlers.set('red-team.exercises.list', async () => Array.from(exercises.values()));
  handlers.set('red-team.exercises.get', async (p) => exercises.get(p.id as string) || null);
  handlers.set('red-team.exercises.create', async (p) => { const id = gid(); const item = { id, ...p, status: 'planned', results: [], score: 0, createdAt: Date.now() } as RedTeamExercise; exercises.set(id, item); return item; });
  handlers.set('red-team.exercises.update', async (p) => { const ex = exercises.get(p.id as string); if (!ex) throw new Error('Not found'); const u = { ...ex, ...p } as RedTeamExercise; exercises.set(ex.id, u); return u; });
  handlers.set('red-team.exercises.evaluate', async (p) => { const ex = exercises.get(p.id as string); if (!ex) throw new Error('Not found'); ex.score = (p.score as number) || 0; ex.status = 'completed'; ex.results = (p.results as string[]) || []; return ex; });
}
