import type { RouterDeps } from '../router.js';

export function registerVulnerabilitiesCrudRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  deps: RouterDeps
): void {

  async function getStore(key: string): Promise<any[]> {
    const data = await deps.jsonStore.get(key);
    return (data as any[]) || [];
  }

  async function saveStore(key: string, data: any[]): Promise<void> {
    await deps.jsonStore.set(key, data);
  }

  handlers.set('vulnerabilities.list', async (params) => {
    let vulns = await getStore('vulnerabilities.json');
    if (params.severity) vulns = vulns.filter((v: any) => v.severity === params.severity);
    if (params.status) vulns = vulns.filter((v: any) => v.status === params.status);
    if (params.cveId) vulns = vulns.filter((v: any) => v.cveId?.toLowerCase().includes(String(params.cveId).toLowerCase()));
    if (params.assignedTo) vulns = vulns.filter((v: any) => v.assignedTo === params.assignedTo);

    const sortBy = (params.sortBy as string) || 'createdAt';
    const sortOrder = (params.sortOrder as string) || 'desc';
    vulns.sort((a: any, b: any) => {
      const aVal = a[sortBy], bVal = b[sortBy];
      if (typeof aVal === 'number' && typeof bVal === 'number') return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      if (typeof aVal === 'string' && typeof bVal === 'string') return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return 0;
    });

    const page = Number(params.page) || 1;
    const pageSize = Number(params.pageSize) || 20;
    const total = vulns.length;
    const paginated = vulns.slice((page - 1) * pageSize, page * pageSize);
    return { data: paginated, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  });

  handlers.set('vulnerabilities.get', async (params) => {
    const { id } = params;
    if (!id) throw new Error('Missing required parameter: id');
    const vulns = await getStore('vulnerabilities.json');
    const vuln = vulns.find((v: any) => v.id === id);
    if (!vuln) throw new Error(`Vulnerability with id ${id} not found`);
    const assets = await getStore('vulnerability-assets.json');
    return { ...vuln, affectedAssets: assets.filter((a: any) => a.vulnerabilityId === id) };
  });

  handlers.set('vulnerabilities.create', async (params) => {
    const data = params as Record<string, unknown>;
    if (!data.cveId) throw new Error('CVE ID is required');
    if (!data.title) throw new Error('Title is required');
    if (!data.severity) throw new Error('Severity is required');

    const vulns = await getStore('vulnerabilities.json');
    if (vulns.find((v: any) => v.cveId === data.cveId)) throw new Error(`Vulnerability with CVE ${data.cveId} already exists`);

    const now = Date.now();
    const vuln = {
      id: `vuln_${now}_${Math.random().toString(36).substring(2, 11)}`,
      cveId: data.cveId, title: data.title, description: data.description || '',
      cvssScore: data.cvssScore, cvssVector: data.cvssVector, severity: data.severity,
      cweIds: data.cweIds || [], affectedProducts: data.affectedProducts || [],
      status: data.status || 'OPEN', priority: data.priority,
      exploitAvailable: data.exploitAvailable || false, exploitInWild: data.exploitInWild || false,
      fixAvailable: data.fixAvailable || false, fixVersion: data.fixVersion, fixSteps: data.fixSteps,
      aiPriority: data.aiPriority || 0, businessImpact: data.businessImpact || 0,
      exposureScore: data.exposureScore || 0, threatScore: data.threatScore || 0,
      scanSource: data.scanSource, firstDetected: now, lastDetected: now,
      proofOfConcept: data.proofOfConcept, assignedTo: data.assignedTo,
      dueDate: data.dueDate, slaDeadline: data.slaDeadline,
      createdBy: data.createdBy || 'system', createdAt: now,
      updatedBy: data.createdBy || 'system', updatedAt: now,
    };

    vulns.push(vuln);
    await saveStore('vulnerabilities.json', vulns);

    if (data.affectedAssets && Array.isArray(data.affectedAssets)) {
      const assets = await getStore('vulnerability-assets.json');
      for (const asset of data.affectedAssets as any[]) {
        assets.push({
          id: `vuln-asset_${now}_${Math.random().toString(36).substring(2, 11)}`,
          vulnerabilityId: vuln.id, assetId: asset.assetId, assetName: asset.assetName,
          componentName: asset.componentName, componentVersion: asset.componentVersion, fixVersion: asset.fixVersion,
        });
      }
      await saveStore('vulnerability-assets.json', assets);
    }

    return vuln;
  });

  handlers.set('vulnerabilities.update', async (params) => {
    const { id, ...patches } = params;
    if (!id) throw new Error('Missing required parameter: id');
    const vulns = await getStore('vulnerabilities.json');
    const index = vulns.findIndex((v: any) => v.id === id);
    if (index === -1) throw new Error(`Vulnerability with id ${id} not found`);
    vulns[index] = { ...vulns[index], ...patches, id: vulns[index].id, cveId: patches.cveId || vulns[index].cveId, createdAt: vulns[index].createdAt, updatedAt: Date.now() };
    await saveStore('vulnerabilities.json', vulns);
    return vulns[index];
  });

  handlers.set('vulnerabilities.delete', async (params) => {
    const { id } = params;
    if (!id) throw new Error('Missing required parameter: id');
    let vulns = await getStore('vulnerabilities.json');
    if (!vulns.find((v: any) => v.id === id)) throw new Error(`Vulnerability with id ${id} not found`);
    vulns = vulns.filter((v: any) => v.id !== id);
    await saveStore('vulnerabilities.json', vulns);
    let assets = await getStore('vulnerability-assets.json');
    assets = assets.filter((a: any) => a.vulnerabilityId !== id);
    await saveStore('vulnerability-assets.json', assets);
    return { deleted: true, id };
  });

  handlers.set('vulnerabilities.stats', async () => {
    const vulns = await getStore('vulnerabilities.json');
    return {
      total: vulns.length,
      bySeverity: Object.fromEntries(['CRITICAL','HIGH','MEDIUM','LOW','INFO'].map(s => [s, vulns.filter((v: any) => v.severity === s).length])),
      byStatus: Object.fromEntries(['OPEN','IN_PROGRESS','FIXED','WONT_FIX','RISK_ACCEPTED'].map(s => [s, vulns.filter((v: any) => v.status === s).length])),
      criticalExploitable: vulns.filter((v: any) => v.severity === 'CRITICAL' && v.exploitInWild).length,
      avgCvssScore: vulns.length > 0 ? vulns.reduce((sum: number, v: any) => sum + (v.cvssScore || 0), 0) / vulns.length : 0,
    };
  });

  handlers.set('vulnerabilities.enums', async () => ({
    severities: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'],
    statuses: ['OPEN', 'IN_PROGRESS', 'FIXED', 'WONT_FIX', 'RISK_ACCEPTED'],
  }));

  // --- Merged from vulnerabilities-routes.ts (unique methods) ---

  handlers.set('vulnerabilities.getByVulnId', async (params) => {
    const { vulnId } = params;
    if (!vulnId) throw new Error('Missing required parameter: vulnId');
    const vulns = await getStore('vulnerabilities.json');
    return vulns.find((v: any) => v.vulnId === vulnId || v.cveId === vulnId) || null;
  });

  handlers.set('vulnerabilities.findByAssetId', async (params) => {
    const { assetId } = params;
    if (!assetId) throw new Error('Missing required parameter: assetId');
    const assets = await getStore('vulnerability-assets.json');
    const links = assets.filter((a: any) => a.assetId === assetId);
    const vulnIds = links.map((l: any) => l.vulnerabilityId);
    const vulns = await getStore('vulnerabilities.json');
    return vulns.filter((v: any) => vulnIds.includes(v.id));
  });

  handlers.set('vulnerabilities.updateStatus', async (params) => {
    const { id, status, actor, note } = params;
    if (!id || !status) throw new Error('Missing required parameters: id, status');
    return handlers.get('vulnerabilities.update')!({ id, status, updatedBy: actor || 'system', ...(note ? { note } : {}) });
  });

  handlers.set('vulnerabilities.assign', async (params) => {
    const { id, assignedTo, user } = params;
    if (!id || !assignedTo) throw new Error('Missing required parameters: id, assignedTo');
    const vulns = await getStore('vulnerabilities.json');
    const index = vulns.findIndex((v: any) => v.id === id);
    if (index === -1) throw new Error(`Vulnerability with id ${id} not found`);
    vulns[index] = { ...vulns[index], assignedTo, updatedBy: user || 'system', updatedAt: Date.now() };
    await saveStore('vulnerabilities.json', vulns);
    return { success: true, assignedTo };
  });

  handlers.set('vulnerabilities.batchUpdateStatus', async (params) => {
    const { ids, status, user } = params;
    if (!Array.isArray(ids) || ids.length === 0) throw new Error('ids must be a non-empty array');
    if (!status) throw new Error('status is required');
    const vulns = await getStore('vulnerabilities.json');
    let updated = 0;
    for (const id of ids) {
      const index = vulns.findIndex((v: any) => v.id === id);
      if (index !== -1) {
        vulns[index] = { ...vulns[index], status, updatedBy: user || 'system', updatedAt: Date.now() };
        updated++;
      }
    }
    await saveStore('vulnerabilities.json', vulns);
    return { updated, ids: ids.length };
  });

  handlers.set('vulnerabilities.active', async () => {
    const vulns = await getStore('vulnerabilities.json');
    return vulns.filter((v: any) => ['OPEN', 'IN_PROGRESS'].includes(v.status));
  });

  handlers.set('vulnerabilities.batchImport', async (params) => {
    const { items } = params;
    if (!Array.isArray(items)) throw new Error('items must be an array');
    const vulns = await getStore('vulnerabilities.json');
    let imported = 0;
    for (const item of items) {
      const now = Date.now();
      vulns.push({
        id: `vuln_${now}_${Math.random().toString(36).substring(2, 11)}`,
        status: 'OPEN',
        createdAt: now,
        updatedAt: now,
        ...item,
      });
      imported++;
    }
    await saveStore('vulnerabilities.json', vulns);
    return { imported };
  });

  handlers.set('vulnerabilities.linkAsset', async (params) => {
    const { vulnerabilityId, assetId } = params;
    if (!vulnerabilityId || !assetId) throw new Error('Missing required parameters');
    const assets = await getStore('vulnerability-assets.json');
    const exists = assets.find((a: any) => a.vulnerabilityId === vulnerabilityId && a.assetId === assetId);
    if (exists) return { alreadyLinked: true };
    assets.push({ vulnerabilityId, assetId, linkedAt: Date.now() });
    await saveStore('vulnerability-assets.json', assets);
    return { linked: true };
  });

  handlers.set('vulnerabilities.unlinkAsset', async (params) => {
    const { vulnerabilityId, assetId } = params;
    if (!vulnerabilityId || !assetId) throw new Error('Missing required parameters');
    let assets = await getStore('vulnerability-assets.json');
    assets = assets.filter((a: any) => !(a.vulnerabilityId === vulnerabilityId && a.assetId === assetId));
    await saveStore('vulnerability-assets.json', assets);
    return { unlinked: true };
  });
}
