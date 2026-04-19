import type { RouterDeps } from '../router.js';

interface Alert {
  id: string; source: string; severity: string; category: string; status: string;
  title: string; description: string; assignee: string;
  relatedIncidents: string[]; relatedIOCs: string[];
  createdAt: number; updatedAt: number; resolvedAt: number | null;
}
interface PlaybookTemplate {
  id: string; name: string; description: string; triggers: string[];
  steps: { name: string; action: string; params: Record<string, string> }[]; version: string;
}
interface SOARExecution {
  id: string; playbookId: string; alertId: string; status: string;
  currentStep: number; results: string[];
  startedAt: number; completedAt: number | null;
}

const alerts = new Map<string, Alert>();
const executions = new Map<string, SOARExecution>();
let seq = 0;
function gid(): string { return 'alert_' + Date.now() + '_' + (++seq); }

const templates: PlaybookTemplate[] = [
  { id: 'pb-phishing', name: 'Phishing Response', description: 'Automated phishing email response', triggers: ['email.alert'], steps: [{ name: 'Quarantine', action: 'email.quarantine', params: {} }, { name: 'Block Sender', action: 'firewall.block', params: {} }, { name: 'Notify User', action: 'notification.send', params: {} }], version: '1.0' },
  { id: 'pb-malware', name: 'Malware Containment', description: 'Isolate infected endpoint', triggers: ['edr.malware'], steps: [{ name: 'Isolate Host', action: 'edr.isolate', params: {} }, { name: 'Scan Network', action: 'network.scan', params: {} }, { name: 'Collect Forensics', action: 'forensic.collect', params: {} }], version: '1.0' },
  { id: 'pb-bruteforce', name: 'Brute Force Lockout', description: 'Block brute force attempts', triggers: ['auth.bruteforce'], steps: [{ name: 'Lock Account', action: 'auth.lock', params: {} }, { name: 'Block IP', action: 'firewall.block', params: {} }, { name: 'Alert SOC', action: 'notification.send', params: {} }], version: '1.0' },
  { id: 'pb-exfil', name: 'Data Exfiltration Block', description: 'Block data exfiltration attempt', triggers: ['dlp.alert'], steps: [{ name: 'Block Transfer', action: 'dlp.block', params: {} }, { name: 'Capture Evidence', action: 'forensic.collect', params: {} }, { name: 'Notify DPO', action: 'notification.send', params: {} }], version: '1.1' },
  { id: 'pb-susplogin', name: 'Suspicious Login', description: 'Handle suspicious login detection', triggers: ['auth.suspicious'], steps: [{ name: 'Require MFA', action: 'auth.mfa', params: {} }, { name: 'Review Logs', action: 'log.review', params: {} }], version: '1.0' },
];

function seed(): void {
  if (alerts.size > 0) return;
  const now = Date.now();
  const seeds: Omit<Alert, 'id'>[] = [
    { source: 'SIEM', severity: 'P0', category: 'intrusion', status: 'new', title: 'SQL注入攻击检测', description: '检测到来自外部IP的SQL注入攻击尝试', assignee: '', relatedIncidents: [], relatedIOCs: ['10.0.0.99'], createdAt: now - 300000, updatedAt: now, resolvedAt: null },
    { source: 'EDR', severity: 'P0', category: 'malware', status: 'assigned', title: '勒索软件检测', description: '终端检测到勒索软件行为模式', assignee: 'admin', relatedIncidents: [], relatedIOCs: ['hash_abc123'], createdAt: now - 600000, updatedAt: now, resolvedAt: null },
    { source: 'Firewall', severity: 'P1', category: 'network', status: 'investigating', title: '异常出站流量', description: '检测到大量异常出站数据传输', assignee: 'admin', relatedIncidents: [], relatedIOCs: ['203.0.113.50'], createdAt: now - 1800000, updatedAt: now, resolvedAt: null },
    { source: 'SIEM', severity: 'P1', category: 'auth', status: 'new', title: '暴力破解尝试', description: '管理员账户遭遇多次登录失败', assignee: '', relatedIncidents: [], relatedIOCs: ['192.168.1.200'], createdAt: now - 3600000, updatedAt: now, resolvedAt: null },
    { source: 'DLP', severity: 'P1', category: 'data-leak', status: 'new', title: '敏感数据外传', description: '检测到敏感文件通过邮件外发', assignee: '', relatedIncidents: [], relatedIOCs: [], createdAt: now - 7200000, updatedAt: now, resolvedAt: null },
    { source: 'EDR', severity: 'P2', category: 'malware', status: 'resolved', title: '可疑PowerShell执行', description: '非标准PowerShell脚本执行', assignee: 'admin', relatedIncidents: [], relatedIOCs: [], createdAt: now - 86400000, updatedAt: now - 43200000, resolvedAt: now - 43200000 },
    { source: 'SIEM', severity: 'P2', category: 'policy', title: '未经授权的VPN连接', description: '非工作时间VPN连接', assignee: 'admin', relatedIncidents: [], relatedIOCs: [], createdAt: now - 172800000, updatedAt: now - 86400000, resolvedAt: now - 86400000 },
    { source: 'WAF', severity: 'P3', category: 'web', status: 'closed', title: 'XSS探测', description: 'Web应用防火墙拦截XSS探测', assignee: 'admin', relatedIncidents: [], relatedIOCs: [], createdAt: now - 259200000, updatedAt: now - 172800000, resolvedAt: now - 172800000 },
  ];
  for (const a of seeds) { const id = gid(); alerts.set(id, { id, ...a }); }
}

export function registerAlertRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  _deps: RouterDeps
): void { seed();

  handlers.set('alerts.list', async (p) => {
    let results = Array.from(alerts.values());
    if (p.severity) results = results.filter(a => a.severity === p.severity);
    if (p.status) results = results.filter(a => a.status === p.status);
    if (p.assignee) results = results.filter(a => a.assignee === p.assignee);
    return { data: results.sort((a, b) => b.createdAt - a.createdAt) };
  });

  handlers.set('alerts.get', async (p) => { const a = alerts.get(p.id as string); if (!a) throw new Error('Alert not found'); return a; });
  handlers.set('alerts.classify', async (p) => { const a = alerts.get(p.id as string); if (!a) throw new Error('Alert not found'); a.severity = (p.severity as string) || a.severity; a.assignee = (p.assignee as string) || a.assignee; a.status = 'assigned'; a.updatedAt = Date.now(); return a; });
  handlers.set('alerts.escalate', async (p) => { const a = alerts.get(p.id as string); if (!a) throw new Error('Alert not found'); a.status = 'investigating'; a.updatedAt = Date.now(); return { alert: a, incidentId: 'inc_' + Date.now() }; });
  handlers.set('alerts.resolve', async (p) => { const a = alerts.get(p.id as string); if (!a) throw new Error('Alert not found'); a.status = 'resolved'; a.resolvedAt = Date.now(); a.updatedAt = Date.now(); return a; });
  handlers.set('alerts.stats', async () => {
    const all = Array.from(alerts.values());
    const resolved = all.filter(a => a.resolvedAt);
    const mttd = resolved.length ? resolved.reduce((s, a) => s + (a.updatedAt - a.createdAt), 0) / resolved.length / 60000 : 0;
    const mttr = resolved.length ? resolved.reduce((s, a) => s + ((a.resolvedAt || a.updatedAt) - a.createdAt), 0) / resolved.length / 60000 : 0;
    return { total: all.length, bySeverity: { P0: all.filter(a => a.severity === 'P0').length, P1: all.filter(a => a.severity === 'P1').length, P2: all.filter(a => a.severity === 'P2').length, P3: all.filter(a => a.severity === 'P3').length }, byStatus: { new: all.filter(a => a.status === 'new').length, assigned: all.filter(a => a.status === 'assigned').length, investigating: all.filter(a => a.status === 'investigating').length, resolved: all.filter(a => a.status === 'resolved').length, closed: all.filter(a => a.status === 'closed').length }, mttd: Math.round(mttd), mttr: Math.round(mttr) };
  });
}

export function registerSoarRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  _deps: RouterDeps
): void {

  handlers.set('soar.templates.list', async () => templates);
  handlers.set('soar.templates.get', async (p) => templates.find(t => t.id === p.templateId) || null);
  handlers.set('soar.execute', async (p) => {
    const tpl = templates.find(t => t.id === p.playbookId);
    if (!tpl) throw new Error('Template not found');
    const id = gid();
    const exec = { id, playbookId: tpl.id, alertId: (p.alertId as string) || '', status: 'running', currentStep: 0, results: [`Started: ${tpl.name}`], startedAt: Date.now(), completedAt: null } as SOARExecution;
    executions.set(id, exec);
    setTimeout(() => { exec.status = 'completed'; exec.currentStep = tpl.steps.length; exec.results = tpl.steps.map(s => `✓ ${s.name}`); exec.completedAt = Date.now(); }, 3000);
    return exec;
  });
  handlers.set('soar.executions.list', async () => Array.from(executions.values()).sort((a, b) => b.startedAt - a.startedAt));
  handlers.set('soar.executions.get', async (p) => executions.get(p.id as string) || null);
}
