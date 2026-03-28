interface EventBusLike {
  emit(event: string, payload: unknown): Promise<void>;
}

export interface ControlCheckResult {
  controlId: string;
  status: 'compliant' | 'non-compliant' | 'partial' | 'not-applicable';
  evidence: string;
  checkedAt: number;
}

export interface AutoCheckResult {
  frameworkId: string;
  totalChecks: number;
  passed: number;
  failed: number;
  warnings: number;
  results: ControlCheckResult[];
  checkedAt: number;
}

export interface ComplianceReport {
  frameworkId: string;
  frameworkName: string;
  overallScore: number;
  controls: ControlCheckResult[];
  generatedAt: number;
  nextAuditDate: number;
}

interface RegulationLike {
  id: string;
  name: string;
  controlFramework: { totalControls: number; domains: string[] };
  requirements: { auditCycle: string };
}

export class AutoCheckEngine {
  constructor(
    private jsonStore: any,
    private eventBus?: EventBusLike,
  ) {}

  async runChecks(frameworkId: string): Promise<AutoCheckResult> {
    const regs = await this.loadRegulations();
    const reg = regs.find((r: RegulationLike) => r.id === frameworkId);
    if (!reg) {
      return { frameworkId, totalChecks: 0, passed: 0, failed: 0, warnings: 0, results: [], checkedAt: Date.now() };
    }

    const results: ControlCheckResult[] = [];
    const now = Date.now();

    for (let i = 0; i < reg.controlFramework.totalControls; i++) {
      const controlId = `${frameworkId}-ctrl-${i + 1}`;
      const result = await this.checkControl(frameworkId, controlId);
      results.push(result);
    }

    const passed = results.filter(r => r.status === 'compliant').length;
    const failed = results.filter(r => r.status === 'non-compliant').length;
    const warnings = results.filter(r => r.status === 'partial').length;

    if (this.eventBus) {
      await this.eventBus.emit('compliance.scoreChanged' as any, {
        framework: reg.name,
        oldScore: 0,
        newScore: reg.controlFramework.totalControls > 0
          ? Math.round((passed / reg.controlFramework.totalControls) * 100)
          : 0,
      }).catch(() => {});
    }

    return { frameworkId, totalChecks: results.length, passed, failed, warnings, results, checkedAt: now };
  }

  async checkControl(_frameworkId: string, controlId: string): Promise<ControlCheckResult> {
    const now = Date.now();

    const vulns = await this.loadFromStore('vulnerabilities.json');
    const incidents = await this.loadFromStore('incidents.json');
    const assets = await this.loadFromStore('assets.json');

    const openVulns = vulns.filter((v: any) => v.remediation?.status === 'open').length;
    const openIncidents = incidents.filter((i: any) => !['closed', 'resolved'].includes(i.workflow?.status)).length;
    const totalAssets = assets.length;

    if (totalAssets === 0) {
      return { controlId, status: 'not-applicable', evidence: 'No assets registered in the system', checkedAt: now };
    }

    const vulnRatio = openVulns / Math.max(totalAssets, 1);
    const incidentRatio = openIncidents / Math.max(totalAssets, 1);

    if (vulnRatio < 0.1 && incidentRatio < 0.1) {
      return { controlId, status: 'compliant', evidence: `Low risk: ${openVulns} open vulns, ${openIncidents} open incidents across ${totalAssets} assets`, checkedAt: now };
    }
    if (vulnRatio < 0.3 && incidentRatio < 0.3) {
      return { controlId, status: 'partial', evidence: `Moderate risk: ${openVulns} open vulns, ${openIncidents} open incidents across ${totalAssets} assets`, checkedAt: now };
    }
    return { controlId, status: 'non-compliant', evidence: `High risk: ${openVulns} open vulns, ${openIncidents} open incidents across ${totalAssets} assets`, checkedAt: now };
  }

  async generateReport(frameworkId: string): Promise<ComplianceReport> {
    const regs = await this.loadRegulations();
    const reg = regs.find((r: RegulationLike) => r.id === frameworkId) ?? null;

    const checkResult = await this.runChecks(frameworkId);

    const overallScore = checkResult.totalChecks > 0
      ? Math.round((checkResult.passed / checkResult.totalChecks) * 100)
      : 0;

    const cycle = reg?.requirements?.auditCycle?.toLowerCase() ?? 'annual';
    let delta = 365 * 24 * 60 * 60 * 1000;
    if (cycle === 'quarterly') delta = 90 * 24 * 60 * 60 * 1000;
    else if (cycle === 'monthly') delta = 30 * 24 * 60 * 60 * 1000;

    return {
      frameworkId,
      frameworkName: reg?.name ?? frameworkId,
      overallScore,
      controls: checkResult.results,
      generatedAt: Date.now(),
      nextAuditDate: Date.now() + delta,
    };
  }

  private async loadRegulations(): Promise<RegulationLike[]> {
    return this.loadFromStore('compliance.json');
  }

  private async loadFromStore(key: string): Promise<any[]> {
    const raw = await this.jsonStore.get(key);
    return Array.isArray(raw) ? raw : [];
  }
}
