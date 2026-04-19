import type { RouterDeps } from '../router.js';

interface IntelSource { id: string; name: string; type: string; url: string; enabled: boolean; lastSync: string; status: string; }
interface IOC { id: string; type: string; value: string; threatLevel: string; source: string; firstSeen: string; lastSeen: string; relatedThreats: string[]; }
interface ThreatHunt { id: string; name: string; iocQuery: string; status: string; findings: string[]; assignee: string; createdAt: number; }

const sources = new Map<string, IntelSource>();
const iocs = new Map<string, IOC>();
const hunts = new Map<string, ThreatHunt>();
let seq = 0;
function gid(): string { return 'ti_' + Date.now() + '_' + (++seq); }

function seed(): void {
  if (sources.size > 0) return;
  const now = new Date().toISOString();
  [{ name: 'MISP Feed', type: 'MISP', url: 'https://misp.example.com', enabled: true, lastSync: now, status: 'active' },
   { name: 'MITRE ATT&CK', type: 'framework', url: 'https://attack.mitre.org', enabled: true, lastSync: now, status: 'active' },
   { name: 'OpenCTI', type: 'OpenCTI', url: 'https://opencti.example.com', enabled: false, lastSync: '', status: 'inactive' },
   { name: 'Abuse.ch', type: 'API', url: 'https://feodotracker.abuse.ch', enabled: true, lastSync: now, status: 'active' },
  ].forEach(s => { const id = gid(); sources.set(id, { id, ...s }); });

  [{ type: 'ip', value: '203.0.113.50', threatLevel: 'high', source: 'MISP Feed', firstSeen: '2026-04-01', lastSeen: now, relatedThreats: ['APT28'] },
   { type: 'domain', value: 'malware-c2.evil.com', threatLevel: 'critical', source: 'OpenCTI', firstSeen: '2026-03-15', lastSeen: now, relatedThreats: ['Emotet'] },
   { type: 'hash', value: 'a1b2c3d4e5f6', threatLevel: 'medium', source: 'Abuse.ch', firstSeen: '2026-04-10', lastSeen: now, relatedThreats: [] },
   { type: 'url', value: 'http://phishing.example.com/login', threatLevel: 'high', source: 'MISP Feed', firstSeen: '2026-04-12', lastSeen: now, relatedThreats: ['Phishing'] },
   { type: 'email', value: 'attacker@evil.com', threatLevel: 'medium', source: 'MISP Feed', firstSeen: '2026-04-05', lastSeen: now, relatedThreats: ['Social Engineering'] },
   { type: 'ip', value: '198.51.100.23', threatLevel: 'low', source: 'Abuse.ch', firstSeen: '2026-03-20', lastSeen: now, relatedThreats: [] },
  ].forEach(i => { const id = gid(); iocs.set(id, { id, ...i }); });

  [{ name: 'Emotet C2 Hunt', iocQuery: 'type:domain threatLevel:critical', status: 'completed', findings: ['malware-c2.evil.com'], assignee: 'admin', createdAt: Date.now() - 86400000 },
   { name: 'Suspicious IP Sweep', iocQuery: 'type:ip threatLevel:high', status: 'in-progress', findings: ['203.0.113.50'], assignee: 'admin', createdAt: Date.now() - 3600000 },
  ].forEach(h => { const id = gid(); hunts.set(id, { id, ...h }); });
}

export function registerThreatIntelRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  _deps: RouterDeps
): void { seed();

  handlers.set('threat-intel.sources.list', async () => Array.from(sources.values()));
  handlers.set('threat-intel.sources.configure', async (p) => { const id = p.id as string; const ex = sources.get(id); if (!ex) throw new Error('Source not found'); Object.assign(ex, p); return ex; });
  handlers.set('threat-intel.sources.sync', async (p) => { const ex = sources.get(p.id as string); if (!ex) throw new Error('Source not found'); ex.lastSync = new Date().toISOString(); return { synced: true, newIndicators: 12 }; });

  handlers.set('threat-intel.iocs.list', async (p) => {
    let results = Array.from(iocs.values());
    if (p.type) results = results.filter(i => i.type === p.type);
    if (p.threatLevel) results = results.filter(i => i.threatLevel === p.threatLevel);
    return { data: results };
  });
  handlers.set('threat-intel.iocs.create', async (p) => { const id = gid(); const item = { id, ...p, firstSeen: new Date().toISOString(), lastSeen: new Date().toISOString(), relatedThreats: [] } as IOC; iocs.set(id, item); return item; });
  handlers.set('threat-intel.iocs.import', async (p) => { const items = (p.iocs as any[]) || []; const created: IOC[] = []; for (const item of items) { const id = gid(); const ioc = { id, ...item, firstSeen: new Date().toISOString(), lastSeen: new Date().toISOString() } as IOC; iocs.set(id, ioc); created.push(ioc); } return { imported: created.length }; });
  handlers.set('threat-intel.iocs.export', async () => Array.from(iocs.values()));
  handlers.set('threat-intel.iocs.match', async (p) => {
    const query = (p.query as string) || '';
    return Array.from(iocs.values()).filter(i => i.value.includes(query) || i.relatedThreats.some(t => t.toLowerCase().includes(query.toLowerCase())));
  });

  handlers.set('threat-intel.mitre.heatmap', async () => ({
    tactics: ['Initial Access', 'Execution', 'Persistence', 'Privilege Escalation', 'Defense Evasion', 'Credential Access', 'Discovery', 'Lateral Movement', 'Collection', 'Exfiltration', 'C2'],
    coverage: [0.85, 0.7, 0.6, 0.55, 0.5, 0.65, 0.4, 0.45, 0.3, 0.35, 0.6],
    gaps: ['T1078-Valid Accounts', 'T1059-Command Scripting', 'T1046-Network Service Discovery'],
  }));

  handlers.set('threat-intel.hunts.create', async (p) => { const id = gid(); const item = { id, ...p, status: 'in-progress', findings: [], createdAt: Date.now() } as ThreatHunt; hunts.set(id, item); return item; });
  handlers.set('threat-intel.hunts.list', async () => Array.from(hunts.values()));
}
