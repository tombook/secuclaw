import type { RouterDeps } from '../router.js';

interface PIA {
  id: string; projectId: string; projectName: string; status: string;
  dataTypes: string[]; riskLevel: string; mitigations: string[];
  approver: string; createdAt: number; updatedAt: number;
}
interface DataClass {
  id: string; dataType: string; sensitivityLevel: string;
  protectionMeasures: string[]; retention: string; createdAt: number;
}
interface SubjectRequest {
  id: string; type: string; status: string; dataSubject: string;
  description: string; deadline: string; response: string;
  createdAt: number; updatedAt: number;
}
interface PrivacyFramework {
  id: string; name: string; articleCount: number; complianceScore: number; articles: { id: string; title: string; status: string }[];
}

const pias = new Map<string, PIA>();
const dataClasses = new Map<string, DataClass>();
const subjectRequests = new Map<string, SubjectRequest>();
let seq = 0;
function gid(): string { return 'priv_' + Date.now() + '_' + (++seq); }

const frameworks: PrivacyFramework[] = [
  { id: 'gdpr', name: 'GDPR', articleCount: 10, complianceScore: 78, articles: [{ id: 'art5', title: '数据处理原则', status: 'compliant' }, { id: 'art6', title: '处理合法性', status: 'compliant' }, { id: 'art13', title: '信息提供义务', status: 'partial' }, { id: 'art17', title: '删除权', status: 'compliant' }, { id: 'art25', title: '数据保护设计', status: 'non-compliant' }] },
  { id: 'pipl', name: 'PIPL', articleCount: 8, complianceScore: 65, articles: [{ id: 's4', title: '个人信息处理规则', status: 'compliant' }, { id: 's5', title: '跨境提供', status: 'partial' }, { id: 's6', title: '个人权利', status: 'compliant' }, { id: 's7', title: '个人信息处理者义务', status: 'non-compliant' }] },
  { id: 'ccpa', name: 'CCPA', articleCount: 6, complianceScore: 82, articles: [{ id: 's1798.100', title: '知情权', status: 'compliant' }, { id: 's1798.105', title: '删除权', status: 'compliant' }, { id: 's1798.110', title: '访问权', status: 'compliant' }] },
];

function seed(): void {
  if (pias.size > 0) return;
  const now = Date.now();
  [{ projectId: 'crm-upgrade', projectName: 'CRM系统升级', status: 'approved', dataTypes: ['个人身份信息', '联系方式'], riskLevel: 'medium', mitigations: ['数据脱敏', '访问控制'], approver: 'admin' },
   { projectId: 'ai-analytics', projectName: 'AI分析平台', status: 'review', dataTypes: ['行为数据', '位置信息'], riskLevel: 'high', mitigations: ['差分隐私', '联邦学习'], approver: '' },
   { projectId: 'partner-api', projectName: '合作伙伴API', status: 'draft', dataTypes: ['业务数据'], riskLevel: 'low', mitigations: [], approver: '' },
  ].forEach(p => { const id = gid(); pias.set(id, { id, ...p, createdAt: now - 86400000, updatedAt: now } as PIA); });

  ['public|公开数据|公开|无特殊要求|永久', 'internal|内部运营数据|内部|访问控制|3年', 'confidential|客户个人信息|机密|加密+脱敏+审计|法规要求', 'restricted|支付卡数据|受限|加密+令牌化+PCI DSS|1年'].forEach(s => {
    const [id, dt, sl, pm, ret] = s.split('|');
    dataClasses.set(id, { id, dataType: dt, sensitivityLevel: sl, protectionMeasures: pm.split('+'), retention: ret, createdAt: now });
  });

  [{ type: 'access', status: 'pending', dataSubject: 'user_001', description: '请求查看个人数据', deadline: '2026-05-01', response: '' },
   { type: 'delete', status: 'fulfilled', dataSubject: 'user_002', description: '请求删除所有个人数据', deadline: '2026-04-20', response: '已于2026-04-18完成删除' },
   { type: 'portability', status: 'pending', dataSubject: 'user_003', description: '请求数据可携带导出', deadline: '2026-05-15', response: '' },
  ].forEach(r => { const id = gid(); subjectRequests.set(id, { id, ...r, createdAt: now - 86400000, updatedAt: now } as SubjectRequest); });
}

export function registerPrivacyRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  _deps: RouterDeps
): void {
  seed();

  handlers.set('privacy.frameworks.list', async () => frameworks);
  handlers.set('privacy.frameworks.get', async (p) => frameworks.find(f => f.id === p.id) || null);

  handlers.set('privacy.pia.list', async () => Array.from(pias.values()));
  handlers.set('privacy.pia.get', async (p) => pias.get(p.id as string) || null);
  handlers.set('privacy.pia.create', async (p) => { const id = gid(); const item = { id, ...p, status: 'draft', createdAt: Date.now(), updatedAt: Date.now() } as PIA; pias.set(id, item); return item; });
  handlers.set('privacy.pia.update', async (p) => { const existing = pias.get(p.id as string); if (!existing) throw new Error('PIA not found'); const u = { ...existing, ...p, updatedAt: Date.now() } as PIA; pias.set(existing.id, u); return u; });
  handlers.set('privacy.pia.approve', async (p) => { const existing = pias.get(p.id as string); if (!existing) throw new Error('PIA not found'); existing.status = 'approved'; existing.approver = p.approver as string; existing.updatedAt = Date.now(); return existing; });

  handlers.set('privacy.classification.list', async () => Array.from(dataClasses.values()));
  handlers.set('privacy.classification.create', async (p) => { const id = (p.id as string) || gid(); const item = { id, ...p, createdAt: Date.now() } as DataClass; dataClasses.set(id, item); return item; });

  handlers.set('privacy.subjectRequests.list', async () => Array.from(subjectRequests.values()));
  handlers.set('privacy.subjectRequests.create', async (p) => { const id = gid(); const item = { id, ...p, status: 'pending', response: '', createdAt: Date.now(), updatedAt: Date.now() } as SubjectRequest; subjectRequests.set(id, item); return item; });
  handlers.set('privacy.subjectRequests.fulfill', async (p) => { const existing = subjectRequests.get(p.id as string); if (!existing) throw new Error('Request not found'); existing.status = 'fulfilled'; existing.response = p.response as string; existing.updatedAt = Date.now(); return existing; });

  handlers.set('privacy.consent.stats', async () => ({ totalConsents: 1247, coverageRate: 0.89, expiringCount: 23, byType: { marketing: 456, analytics: 312, functional: 479 } }));
}
