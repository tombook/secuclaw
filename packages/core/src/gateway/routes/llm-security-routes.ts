import type { RouterDeps } from '../router.js';
import { GarakRunner } from '../../llm/garak-runner.js';
import { AigScanner } from '../../skills/aig-scanner.js';
import { sanitizerRegistry } from '../../llm/sanitizer-registry.js';

const SCANS_KEY = 'llm-security/scans.json';
const REPORTS_KEY = 'llm-security/reports.json';
const SKILL_AUDITS_KEY = 'llm-security/skill-audits.json';
const SANITIZER_KEY = 'llm-security/sanitizer-results.json';

let seq = 0;
function gid(): string {
  return 'llmsec_' + Date.now() + '_' + (++seq);
}

export function registerLlmSecurityRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  deps: RouterDeps
): void {

  handlers.set('llm.security.scan', async (p) => {
    const providerId = String(p.providerId ?? '');
    const model = String(p.model ?? '');
    const probes = p.probes as string[] | undefined;
    const scanId = gid();
    const scan = {
      id: scanId,
      providerId,
      model,
      probes: probes ?? [],
      status: 'pending',
      startedAt: Date.now(),
      completedAt: null as number | null,
    };
    const scans = await deps.jsonStore.get<any[]>(SCANS_KEY) ?? [];
    scans.push(scan);
    await deps.jsonStore.set(SCANS_KEY, scans);

    const runner = new GarakRunner();
    const config = {
      provider: providerId,
      model,
      probes: probes ?? ['promptinject', 'jailbreak', 'leak', 'misinformation', 'know'],
      generationsPerProbe: 10,
      parallel: 1,
    };
    runner.scan(config).then(async (report) => {
      const all = await deps.jsonStore.get<any[]>(SCANS_KEY) ?? [];
      const entry = all.find((s: any) => s.id === scanId);
      if (entry) {
        entry.status = 'completed';
        entry.completedAt = Date.now();
        await deps.jsonStore.set(SCANS_KEY, all);
      }
      const reports = await deps.jsonStore.get<any[]>(REPORTS_KEY) ?? [];
      reports.push({ scanId, ...report, generatedAt: Date.now() });
      await deps.jsonStore.set(REPORTS_KEY, reports);
    }).catch(async (err: unknown) => {
      const all = await deps.jsonStore.get<any[]>(SCANS_KEY) ?? [];
      const entry = all.find((s: any) => s.id === scanId);
      if (entry) {
        entry.status = 'failed';
        entry.error = err instanceof Error ? err.message : String(err);
        entry.completedAt = Date.now();
        await deps.jsonStore.set(SCANS_KEY, all);
      }
    });
    return { scanId, status: 'pending' };
  });

  handlers.set('llm.security.status', async (p) => {
    const scanId = String(p.scanId ?? '');
    const scans = await deps.jsonStore.get<any[]>(SCANS_KEY) ?? [];
    const scan = scans.find((s: any) => s.id === scanId);
    if (!scan) throw new Error('Scan not found');
    return { scanId: scan.id, status: scan.status, startedAt: scan.startedAt, completedAt: scan.completedAt, error: scan.error };
  });

  handlers.set('llm.security.report', async () => {
    const reports = await deps.jsonStore.get<any[]>(REPORTS_KEY) ?? [];
    if (reports.length === 0) return null;
    return reports.sort((a: any, b: any) => (b.generatedAt ?? 0) - (a.generatedAt ?? 0))[0];
  });

  handlers.set('llm.security.skills.audit', async () => {
    const configService = (deps as any).configService;
    const skillsPath = configService?.get?.('storage')?.skillsPath ?? './skills';
    const scanner = new AigScanner();
    const result = await scanner.scanAllSkills(skillsPath);
    const audits = await deps.jsonStore.get<any[]>(SKILL_AUDITS_KEY) ?? [];
    const entry = { id: gid(), ...result, auditedAt: Date.now() };
    audits.push(entry);
    await deps.jsonStore.set(SKILL_AUDITS_KEY, audits);
    return { id: entry.id, findingCount: result.findings.length, summary: result.summary, findings: result.findings };
  });

  handlers.set('llm.security.skills.findings', async () => {
    const audits = await deps.jsonStore.get<any[]>(SKILL_AUDITS_KEY) ?? [];
    if (audits.length === 0) return { findings: [] };
    return audits.sort((a: any, b: any) => (b.auditedAt ?? 0) - (a.auditedAt ?? 0))[0];
  });

  handlers.set('llm.security.sanitizer.check', async (p) => {
    const text = String(p.text ?? '');
    const results = sanitizerRegistry.sanitize(text);
    const history = await deps.jsonStore.get<any[]>(SANITIZER_KEY) ?? [];
    history.push({ id: gid(), text: text.slice(0, 200), results, checkedAt: Date.now() });
    await deps.jsonStore.set(SANITIZER_KEY, history);
    return results;
  });
}
