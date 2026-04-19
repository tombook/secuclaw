import type { RouterDeps } from '../router.js';

interface BudgetItem { id: string; category: string; name: string; amount: number; spent: number; period: string; owner: string; status: string; }
interface Investment { id: string; name: string; cost: number; riskReduction: number; roiScore: number; status: string; category: string; }
interface BoardReport { id: string; type: string; sections: Record<string, unknown>; generatedAt: number; author: string; }

const budgetItems = new Map<string, BudgetItem>();
const investments = new Map<string, Investment>();
const reports = new Map<string, BoardReport>();
let seq = 0;
function gid(): string { return 'bgt_' + Date.now() + '_' + (++seq); }

function seed(): void {
  if (budgetItems.size > 0) return;
  const items: Omit<BudgetItem, 'id'>[] = [
    { category: '工具', name: 'SIEM许可', amount: 500000, spent: 350000, period: '2026', owner: 'CISO', status: 'active' },
    { category: '工具', name: 'EDR许可', amount: 300000, spent: 200000, period: '2026', owner: 'SOC', status: 'active' },
    { category: '人员', name: '安全团队', amount: 2000000, spent: 500000, period: '2026', owner: 'HR', status: 'active' },
    { category: '培训', name: '安全意识培训', amount: 100000, spent: 30000, period: '2026', owner: '安全部', status: 'active' },
    { category: '合规', name: '合规审计', amount: 200000, spent: 0, period: '2026', owner: '合规部', status: 'planned' },
    { category: '基础设施', name: '安全设备更新', amount: 800000, spent: 150000, period: '2026', owner: 'IT', status: 'active' },
  ];
  items.forEach(i => { const id = gid(); budgetItems.set(id, { id, ...i }); });

  [{ name: '零信任架构实施', cost: 500000, riskReduction: 35, roiScore: 0.7, status: 'approved', category: '架构' },
   { name: 'SOC自动化(SOAR)', cost: 300000, riskReduction: 25, roiScore: 0.83, status: 'in-review', category: '运营' },
   { name: '员工安全培训', cost: 50000, riskReduction: 15, roiScore: 3.0, status: 'approved', category: '培训' },
  ].forEach(i => { const id = gid(); investments.set(id, { id, ...i }); });
}

export function registerBudgetRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  _deps: RouterDeps
): void { seed();

  handlers.set('budget.items.list', async (p) => {
    let results = Array.from(budgetItems.values());
    if (p.category) results = results.filter(i => i.category === p.category);
    return { data: results };
  });
  handlers.set('budget.items.create', async (p) => { const id = gid(); const item = { id, ...p } as BudgetItem; budgetItems.set(id, item); return item; });
  handlers.set('budget.items.update', async (p) => { const ex = budgetItems.get(p.id as string); if (!ex) throw new Error('Not found'); const u = { ...ex, ...p } as BudgetItem; budgetItems.set(ex.id, u); return u; });
  handlers.set('budget.summary', async () => {
    const items = Array.from(budgetItems.values());
    return { total: items.reduce((s, i) => s + i.amount, 0), spent: items.reduce((s, i) => s + i.spent, 0), remaining: items.reduce((s, i) => s + (i.amount - i.spent), 0), byCategory: items.reduce((acc, i) => { acc[i.category] = (acc[i.category] || 0) + i.amount; return acc; }, {} as Record<string, number>) };
  });

  handlers.set('budget.investments.list', async () => Array.from(investments.values()));
  handlers.set('budget.investments.create', async (p) => { const id = gid(); const item = { id, ...p } as Investment; investments.set(id, item); return item; });
  handlers.set('budget.roi.calculate', async (p) => {
    const cost = (p.cost as number) || 0;
    const riskReduction = (p.riskReduction as number) || 0;
    const avgIncidentCost = 500000;
    const annualRiskReduction = avgIncidentCost * riskReduction / 100;
    const roi = cost > 0 ? ((annualRiskReduction - cost) / cost) : 0;
    return { cost, riskReduction, annualRiskReduction, roi: Math.round(roi * 100) / 100, paybackMonths: annualRiskReduction > 0 ? Math.ceil(cost / annualRiskReduction * 12) : Infinity };
  });

  handlers.set('reports.board.generate', async (p) => {
    const type = (p.type as string) || 'quarterly';
    const budget = Array.from(budgetItems.values());
    const report = {
      id: gid(), type, author: (p.author as string) || 'admin', generatedAt: Date.now(),
      sections: {
        executiveSummary: `SecuClaw安全态势报告 - ${type}`,
        riskPosture: { overallScore: 72, trend: 'improving', topRisks: ['供应链风险', '内部威胁', '数据泄露'] },
        compliance: { frameworks: ['GDPR', 'PIPL', 'NIST CSF'], overallCompliance: 0.78 },
        kpis: { mttd: 12, mttr: 45, vulnRemediation: 0.85, securityScore: 88 },
        budget: { total: budget.reduce((s, i) => s + i.amount, 0), spent: budget.reduce((s, i) => s + i.spent, 0), utilization: budget.reduce((s, i) => s + i.amount, 0) > 0 ? budget.reduce((s, i) => s + i.spent, 0) / budget.reduce((s, i) => s + i.amount, 0) : 0 },
        recommendations: ['加强供应链安全评估', '部署SOAR自动化', '提升安全培训覆盖率'],
      },
    } as BoardReport;
    reports.set(report.id, report);
    return report;
  });
  handlers.set('reports.board.list', async () => Array.from(reports.values()).sort((a, b) => b.generatedAt - a.generatedAt));
  handlers.set('reports.board.export', async (p) => { const r = reports.get(p.id as string); if (!r) throw new Error('Report not found'); return { format: 'json', data: JSON.stringify(r, null, 2), filename: `security-report-${r.type}-${new Date(r.generatedAt).toISOString().slice(0, 10)}.json` }; });
}
