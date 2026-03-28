import type { Router } from '../router.js';

export function registerSecurityRoutes(router: Router): void {
  const vulnSvc = () => router['getVulnerabilitiesService']();
  const threatSvc = () => router['getThreatsService']();
  const complianceSvc = () => router['getComplianceService']();
  const assetSvc = () => router['getAssetsService']();

  router.registerHandler('vulnerabilities.list', async (p: Record<string, unknown>) => vulnSvc().list({
    status: p.status as string, severity: p.severity as string, cveId: p.cveId as string,
    assetId: p.assetId as string, assignedTo: p.assignedTo as string,
    page: p.page as number, pageSize: p.pageSize as number,
  }));
  router.registerHandler('vulnerabilities.get', async (p: Record<string, unknown>) => {
    const { id } = p;
    if (!id) throw new Error('Missing required parameter: id');
    return vulnSvc().get(id as string);
  });
  router.registerHandler('vulnerabilities.updateStatus', async (p: Record<string, unknown>) => {
    const { id, status, assignedTo, user } = p;
    if (!id || !status) throw new Error('Missing required parameters: id, status');
    return vulnSvc().updateRemediation(id as string, status as any, assignedTo as string, user as string);
  });
  router.registerHandler('vulnerabilities.assign', async (p: Record<string, unknown>) => {
    const { id, assignedTo, user } = p;
    if (!id || !assignedTo) throw new Error('Missing required parameters: id, assignedTo');
    const vuln = await vulnSvc().get(id as string);
    if (!vuln) throw new Error(`Vulnerability not found: ${id}`);
    return vulnSvc().updateRemediation(id as string, vuln.remediation.status, assignedTo as string, user as string);
  });
  router.registerHandler('vulnerabilities.stats', async () => vulnSvc().getStats());
  router.registerHandler('vulnerabilities.nextStatuses', async (p: Record<string, unknown>) => {
    const { id } = p;
    if (!id) throw new Error('Missing required parameter: id');
    return vulnSvc().getValidNextStatuses(id as string);
  });

  router.registerHandler('threats.list', async (p: Record<string, unknown>) => threatSvc().list({
    type: p.type as string, motivation: p.motivation as string, target: p.target as string,
    page: p.page as number, pageSize: p.pageSize as number,
  }));
  router.registerHandler('threats.get', async (p: Record<string, unknown>) => {
    const { id } = p;
    if (!id) throw new Error('Missing required parameter: id');
    return threatSvc().get(id as string);
  });
  router.registerHandler('threats.stats', async () => threatSvc().getStats());
  router.registerHandler('threats.search', async (p: Record<string, unknown>) => {
    const { keyword } = p;
    if (!keyword) throw new Error('Missing required parameter: keyword');
    return threatSvc().search(keyword as string);
  });

  router.registerHandler('compliance.list', async (p: Record<string, unknown>) => complianceSvc().list({
    jurisdiction: p.jurisdiction as string, page: p.page as number, pageSize: p.pageSize as number,
  }));
  router.registerHandler('compliance.get', async (p: Record<string, unknown>) => {
    const { id } = p;
    if (!id) throw new Error('Missing required parameter: id');
    return complianceSvc().get(id as string);
  });
  router.registerHandler('compliance.stats', async () => complianceSvc().getStats());

  router.registerHandler('assets.list', async (p: Record<string, unknown>) => assetSvc().list({
    type: p.type as string, category: p.category as string, environment: p.environment as string,
    criticality: p.criticality as string, status: p.status as string,
    owner: p.owner as string, department: p.department as string,
    page: p.page as number, pageSize: p.pageSize as number,
  }));
  router.registerHandler('assets.get', async (p: Record<string, unknown>) => {
    const { id } = p;
    if (!id) throw new Error('Missing required parameter: id');
    return assetSvc().get(id as string);
  });
  router.registerHandler('assets.stats', async () => assetSvc().getStats());
}
