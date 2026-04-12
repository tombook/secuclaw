import type { RouterDeps } from '../router.js';
import type { AssetQueryParams, CreateAssetRequest } from '../../assets/types.js';

export function registerAssetsRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  deps: RouterDeps
): void {
  const svc = () => deps.assetsService!;

  handlers.set('assets.list', async (p: Record<string, unknown>) => svc().list({
    type: p.type as any,
    criticality: p.criticality as any,
    environment: p.environment as any,
    status: p.status as any,
    riskLevel: p.riskLevel as any,
    owner: p.owner as string,
    department: p.department as string,
    businessLine: p.businessLine as string,
    tag: p.tag as string,
    ip: p.ip as string,
    fromDate: p.fromDate as number,
    toDate: p.toDate as number,
    page: p.page as number,
    pageSize: p.pageSize as number,
  } as AssetQueryParams));

  handlers.set('assets.get', async (p: Record<string, unknown>) => {
    const { id } = p;
    if (!id) throw new Error('Missing required parameter: id');
    return svc().get(id as string);
  });

  handlers.set('assets.create', async (p: Record<string, unknown>) => svc().create({
    domainId: p.domainId as string,
    name: p.name as string,
    description: p.description as string,
    type: p.type as any,
    criticality: p.criticality as any,
    environment: p.environment as any,
    status: p.status as any,
    owner: p.owner as string,
    department: p.department as string,
    businessLine: p.businessLine as string,
    tags: p.tags as string[],
    ipAddresses: p.ipAddresses as string[],
    macAddresses: p.macAddresses as string[],
    hostnames: p.hostnames as string[],
    ports: p.ports as number[],
    os: p.os as string,
    osVersion: p.osVersion as string,
    software: p.software as Array<{ name: string; version: string }>,
  } as CreateAssetRequest));

  handlers.set('assets.update', async (p: Record<string, unknown>) => {
    const { id, ...data } = p;
    if (!id) throw new Error('Missing required parameter: id');
    return svc().update(id as string, data as Partial<import('../../assets/types.js').SecurityAsset>);
  });

  handlers.set('assets.delete', async (p: Record<string, unknown>) => {
    const { id } = p;
    if (!id) throw new Error('Missing required parameter: id');
    return svc().delete(id as string);
  });

  handlers.set('assets.linkVulnerability', async (p: Record<string, unknown>) => {
    const { assetId, vulnId } = p;
    if (!assetId || !vulnId) {
      throw new Error('Missing required parameters: assetId, vulnId');
    }
    return svc().linkVulnerability(
      assetId as string,
      vulnId as string
    );
  });

  handlers.set('assets.unlinkVulnerability', async (p: Record<string, unknown>) => {
    const { assetId, vulnId } = p;
    if (!assetId || !vulnId) {
      throw new Error('Missing required parameters: assetId, vulnId');
    }
    return svc().unlinkVulnerability(
      assetId as string,
      vulnId as string
    );
  });

  handlers.set('assets.stats', async () => svc().getStats());

  handlers.set('assets.batchImport', async (p: Record<string, unknown>) => {
    const { assets, createdBy: _createdBy } = p;
    if (!assets || !Array.isArray(assets)) {
      throw new Error('Missing required parameter: assets (must be array)');
    }
    return svc().batchImport(assets as CreateAssetRequest[]);
  });
}