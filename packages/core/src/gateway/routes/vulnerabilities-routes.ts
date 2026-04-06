import type { RouterDeps } from '../router.js';
import type { CreateVulnerabilityRequest, UpdateVulnerabilityRequest } from './types.js';

export function registerVulnerabilitiesRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  deps: RouterDeps
): void {
  const svc = () => deps.vulnerabilitiesService!;

  handlers.set('vulnerabilities.list', async (p: Record<string, unknown>) => svc().list({
    status: p.status as any,
    severity: p.severity as any,
    priority: p.priority as any,
    source: p.source as any,
    vulnId: p.vulnId as string,
    assetId: p.assetId as string,
    assignee: p.assignee as string,
    domainId: p.domainId as any,
    fromDate: p.fromDate as number,
    toDate: p.toDate as number,
    cvssScoreMin: p.cvssScoreMin as number,
    cvssScoreMax: p.cvssScoreMax as number,
    page: p.page as number,
    pageSize: p.pageSize as number,
  }));

  handlers.set('vulnerabilities.get', async (p: Record<string, unknown>) => {
    const { id } = p;
    if (!id) throw new Error('Missing required parameter: id');
    return svc().get(id as string);
  });

  handlers.set('vulnerabilities.getByVulnId', async (p: Record<string, unknown>) => {
    const { vulnId } = p;
    if (!vulnId) throw new Error('Missing required parameter: vulnId');
    return svc().getByVulnId(vulnId as string);
  });

  handlers.set('vulnerabilities.findByAssetId', async (p: Record<string, unknown>) => {
    const { assetId } = p;
    if (!assetId) throw new Error('Missing required parameter: assetId');
    return svc().findByAssetId(assetId as string);
  });

  handlers.set('vulnerabilities.create', async (p: Record<string, unknown>) => svc().create({
    domainId: p.domainId as string,
    vulnId: p.vulnId as string,
    title: p.title as string,
    description: p.description as string,
    severity: p.severity as any,
    source: p.source as any,
    cvss: p.cvss as any,
    affectedAssets: p.affectedAssets as string[],
    remediation: p.remediation as any,
    tags: p.tags as string[],
    cweIds: p.cweIds as string[],
    references: p.references as string[],
    assignee: p.assignee as string,
    notes: p.notes as string,
  } as CreateVulnerabilityRequest, p.createdBy as string));

  handlers.set('vulnerabilities.update', async (p: Record<string, unknown>) => {
    const { id, ...data } = p;
    if (!id) throw new Error('Missing required parameter: id');
    return svc().update(id as string, data as UpdateVulnerabilityRequest);
  });

  handlers.set('vulnerabilities.delete', async (p: Record<string, unknown>) => {
    const { id } = p;
    if (!id) throw new Error('Missing required parameter: id');
    return svc().delete(id as string);
  });

  handlers.set('vulnerabilities.updateStatus', async (p: Record<string, unknown>) => {
    const { id, status, actor, note } = p;
    if (!id || !status) throw new Error('Missing required parameters: id, status');
    return svc().updateStatus(
      id as string,
      status as any,
      actor as string,
      note as string
    );
  });

  handlers.set('vulnerabilities.stats', async () => svc().getStats());

  handlers.set('vulnerabilities.active', async () => svc().getActiveVulnerabilities());

  handlers.set('vulnerabilities.batchImport', async (p: Record<string, unknown>) => {
    const { vulnerabilities, importedBy } = p;
    if (!vulnerabilities || !Array.isArray(vulnerabilities)) {
      throw new Error('Missing required parameter: vulnerabilities (must be array)');
    }
    return svc().batchImport(vulnerabilities as CreateVulnerabilityRequest[], importedBy as string);
  });

  handlers.set('vulnerabilities.linkAsset', async (p: Record<string, unknown>) => {
    const { vulnId, assetId } = p;
    if (!vulnId || !assetId) throw new Error('Missing required parameters: vulnId, assetId');
    return svc().linkAsset(vulnId as string, assetId as string);
  });

  handlers.set('vulnerabilities.unlinkAsset', async (p: Record<string, unknown>) => {
    const { vulnId, assetId } = p;
    if (!vulnId || !assetId) throw new Error('Missing required parameters: vulnId, assetId');
    return svc().unlinkAsset(vulnId as string, assetId as string);
  });
}