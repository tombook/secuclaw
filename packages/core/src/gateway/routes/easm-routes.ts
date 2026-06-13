import { AssetDiscoveryService } from '../../easm/asset-discovery.js';
import { ExposureScannerService } from '../../easm/exposure-scanner.js';
import { CredentialLeakMonitor } from '../../easm/credential-leak.js';
import { PhishingDetectorService } from '../../easm/phishing-detector.js';
import type { RouterDeps } from '../router.js';
import type { JsonStore } from '../../storage/json-store.js';

export function registerEasmRoutes(handlers: Map<string, Function>, deps: RouterDeps): void {
  const store: any = (deps as any).jsonStore ?? (deps as any).store;
  const discovery = new AssetDiscoveryService(store);
  const scanner = new ExposureScannerService(store);
  const leakMon = new CredentialLeakMonitor(store);
  const phishing = new PhishingDetectorService(store);

  handlers.set('easm.target.create', async (params: Record<string, unknown>) => {
    const p = params as any;
    return await discovery.createTarget({
      rootDomain: p.rootDomain,
      organization: p.organization,
      description: p.description,
      seeds: p.seeds ?? [],
      includedMethods: p.includedMethods ?? [],
      excludedMethods: p.excludedMethods ?? [],
      scopeIncludes: p.scopeIncludes ?? [],
      scopeExcludes: p.scopeExcludes ?? [],
      active: p.active ?? true,
      createdBy: p.createdBy,
    });
  });

  handlers.set('easm.target.list', async (params: Record<string, unknown>) => {
    const p = params as any;
    const filters: { active?: boolean; organization?: string } = {};
    if (p.active !== undefined) filters.active = p.active;
    if (p.organization) filters.organization = p.organization;
    return await discovery.listTargets(filters);
  });

  handlers.set('easm.target.get', async (params: Record<string, unknown>) => {
    const p = params as any;
    return await discovery.getTarget(p.targetId);
  });

  handlers.set('easm.target.update', async (params: Record<string, unknown>) => {
    const p = params as any;
    return await discovery.updateTarget(p.targetId, p.updates);
  });

  handlers.set('easm.target.delete', async (params: Record<string, unknown>) => {
    const p = params as any;
    const success = await discovery.deleteTarget(p.targetId);
    return { success };
  });

  handlers.set('easm.discovery.run', async (params: Record<string, unknown>) => {
    const p = params as any;
    return await discovery.runDiscovery(p.targetId, { methods: p.methods });
  });

  handlers.set('easm.discovery.simulate', async (params: Record<string, unknown>) => {
    const p = params as any;
    return await discovery.simulateDiscovery(p.targetId, p.seedSubdomains ?? []);
  });

  handlers.set('easm.asset.list', async (params: Record<string, unknown>) => {
    const p = params as any;
    const filters: any = {};
    if (p.targetId !== undefined) filters.targetId = p.targetId;
    if (p.type !== undefined) filters.type = p.type;
    if (p.status !== undefined) filters.status = p.status;
    if (p.riskScoreMin !== undefined) filters.riskScoreMin = p.riskScoreMin;
    if (p.rootDomain !== undefined) filters.rootDomain = p.rootDomain;
    if (p.cloudProvider !== undefined) filters.cloudProvider = p.cloudProvider;
    if (p.limit !== undefined) filters.limit = p.limit;
    return await discovery.listAssets(filters);
  });

  handlers.set('easm.asset.get', async (params: Record<string, unknown>) => {
    const p = params as any;
    return await discovery.getAsset(p.assetId);
  });

  handlers.set('easm.asset.update', async (params: Record<string, unknown>) => {
    const p = params as any;
    return await discovery.updateAsset(p.assetId, p.updates);
  });

  handlers.set('easm.asset.delete', async (params: Record<string, unknown>) => {
    const p = params as any;
    const success = await discovery.deleteAsset(p.assetId);
    return { success };
  });

  handlers.set('easm.asset.subdomains', async (params: Record<string, unknown>) => {
    const p = params as any;
    return await discovery.getSubdomains(p.rootDomain);
  });

  handlers.set('easm.asset.graph', async (params: Record<string, unknown>) => {
    const p = params as any;
    return await discovery.getAssetGraph(p.rootDomain);
  });

  handlers.set('easm.discovery.stats', async () => {
    return await discovery.getStats();
  });

  handlers.set('easm.exposure.scan-target', async (params: Record<string, unknown>) => {
    const p = params as any;
    return await scanner.scanTarget(p.targetId, { categories: p.categories });
  });

  handlers.set('easm.exposure.scan-asset', async (params: Record<string, unknown>) => {
    const p = params as any;
    return await scanner.scanAsset(p.assetId);
  });

  handlers.set('easm.exposure.list', async (params: Record<string, unknown>) => {
    const p = params as any;
    const filters: any = {};
    if (p.targetId !== undefined) filters.targetId = p.targetId;
    if (p.category !== undefined) filters.category = p.category;
    if (p.severity !== undefined) filters.severity = p.severity;
    if (p.status !== undefined) filters.status = p.status;
    if (p.assignedTo !== undefined) filters.assignedTo = p.assignedTo;
    if (p.since !== undefined) filters.since = p.since;
    if (p.limit !== undefined) filters.limit = p.limit;
    return await scanner.listExposures(filters);
  });

  handlers.set('easm.exposure.get', async (params: Record<string, unknown>) => {
    const p = params as any;
    return await scanner.getExposure(p.exposureId);
  });

  handlers.set('easm.exposure.update-remediation', async (params: Record<string, unknown>) => {
    const p = params as any;
    const success = await scanner.updateRemediation(p.exposureId, p.status, p.owner);
    return { success };
  });

  handlers.set('easm.exposure.stats', async () => {
    return await scanner.getStats();
  });

  handlers.set('easm.exposure.top-risky', async (params: Record<string, unknown>) => {
    const p = params as any;
    return await scanner.getTopRiskyExposures(p.limit);
  });

  handlers.set('easm.exposure.scans', async (params: Record<string, unknown>) => {
    const p = params as any;
    const filters: any = {};
    if (p.targetId !== undefined) filters.targetId = p.targetId;
    if (p.status !== undefined) filters.status = p.status;
    if (p.limit !== undefined) filters.limit = p.limit;
    return await scanner.listScans(filters);
  });

  handlers.set('easm.exposure.rules.list', async () => {
    return scanner.listRules();
  });

  handlers.set('easm.exposure.rules.register', async (params: Record<string, unknown>) => {
    const p = params as any;
    return scanner.registerRule(p.rule);
  });

  handlers.set('easm.leak.watch.create', async (params: Record<string, unknown>) => {
    const p = params as any;
    return await leakMon.createWatch({
      name: p.name,
      description: p.description,
      organization: p.organization,
      type: p.type,
      query: p.query,
      active: p.active ?? true,
      createdBy: p.createdBy,
    });
  });

  handlers.set('easm.leak.watch.list', async (params: Record<string, unknown>) => {
    const p = params as any;
    const filters: any = {};
    if (p.active !== undefined) filters.active = p.active;
    if (p.organization !== undefined) filters.organization = p.organization;
    return await leakMon.listWatches(filters);
  });

  handlers.set('easm.leak.watch.get', async (params: Record<string, unknown>) => {
    const p = params as any;
    return await leakMon.getWatch(p.watchId);
  });

  handlers.set('easm.leak.watch.update', async (params: Record<string, unknown>) => {
    const p = params as any;
    return await leakMon.updateWatch(p.watchId, p.updates);
  });

  handlers.set('easm.leak.watch.delete', async (params: Record<string, unknown>) => {
    const p = params as any;
    const success = await leakMon.deleteWatch(p.watchId);
    return { success };
  });

  handlers.set('easm.leak.watch.scan', async (params: Record<string, unknown>) => {
    const p = params as any;
    await leakMon.scanWatch(p.watchId, []);
    return await leakMon.listLeaks();
  });

  handlers.set('easm.leak.scan-content', async (params: Record<string, unknown>) => {
    const p = params as any;
    const content = [
      {
        url: p.sourceUrl ?? '',
        file: p.source ?? 'ad-hoc',
        body: p.content ?? '',
      },
    ];
    await leakMon.scanContent(content, {});
    return await leakMon.listLeaks();
  });

  handlers.set('easm.leak.list', async (params: Record<string, unknown>) => {
    const p = params as any;
    const filters: any = {};
    if (p.watchId !== undefined) filters.repository = p.watchId;
    if (p.status !== undefined) filters.status = p.status;
    if (p.severity !== undefined) filters.severity = p.severity;
    if (p.secretType !== undefined) filters.secretType = p.secretType;
    if (p.source !== undefined) filters.source = p.source;
    if (p.since !== undefined) filters.since = p.since;
    if (p.limit !== undefined) filters.limit = p.limit;
    return await leakMon.listLeaks(filters);
  });

  handlers.set('easm.leak.get', async (params: Record<string, unknown>) => {
    const p = params as any;
    return await leakMon.getLeak(p.leakId);
  });

  handlers.set('easm.leak.update-status', async (params: Record<string, unknown>) => {
    const p = params as any;
    const success = await leakMon.updateLeakStatus(p.leakId, p.status);
    return { success };
  });

  handlers.set('easm.leak.dismiss', async (params: Record<string, unknown>) => {
    const p = params as any;
    const success = await leakMon.dismissLeak(p.leakId, p.by, p.reason);
    return { success };
  });

  handlers.set('easm.leak.mark-revoked', async (params: Record<string, unknown>) => {
    const p = params as any;
    const success = await leakMon.markRevoked(p.leakId);
    return { success };
  });

  handlers.set('easm.leak.stats', async () => {
    return await leakMon.getStats();
  });

  handlers.set('easm.leak.active', async () => {
    return await leakMon.getActiveLeaks();
  });

  handlers.set('easm.leak.critical', async () => {
    return await leakMon.getCriticalLeaks();
  });

  handlers.set('easm.phishing.brand-watch.create', async (params: Record<string, unknown>) => {
    const p = params as any;
    return await phishing.createBrandWatch({
      brand: p.brand,
      description: p.description,
      officialDomains: p.officialDomains ?? [],
      keywords: p.keywords ?? [],
      protectionLevel: p.protectionLevel ?? 'medium_value',
      active: p.active ?? true,
      createdBy: p.createdBy,
    });
  });

  handlers.set('easm.phishing.brand-watch.list', async (params: Record<string, unknown>) => {
    const p = params as any;
    const filters: { active?: boolean; brand?: string } = {};
    if (p.active !== undefined) filters.active = p.active;
    if (p.brand !== undefined) filters.brand = p.brand;
    return await phishing.listBrandWatches(filters);
  });

  handlers.set('easm.phishing.brand-watch.get', async (params: Record<string, unknown>) => {
    const p = params as any;
    return await phishing.getBrandWatch(p.watchId);
  });

  handlers.set('easm.phishing.brand-watch.update', async (params: Record<string, unknown>) => {
    const p = params as any;
    return await phishing.updateBrandWatch(p.watchId, p.updates);
  });

  handlers.set('easm.phishing.brand-watch.delete', async (params: Record<string, unknown>) => {
    const p = params as any;
    const success = await phishing.deleteBrandWatch(p.watchId);
    return { success };
  });

  handlers.set('easm.phishing.check-url', async (params: Record<string, unknown>) => {
    const p = params as any;
    return await phishing.checkUrl(p.url, { brandWatchIds: p.brandWatchIds });
  });

  handlers.set('easm.phishing.check-domain', async (params: Record<string, unknown>) => {
    const p = params as any;
    return await phishing.checkDomain(p.domain, { brandWatchIds: p.brandWatchIds });
  });

  handlers.set('easm.phishing.list', async (params: Record<string, unknown>) => {
    const p = params as any;
    const filters: any = {};
    if (p.brandWatchId !== undefined) filters.brandWatchId = p.brandWatchId;
    if (p.type !== undefined) filters.type = p.type;
    if (p.status !== undefined) filters.status = p.status;
    if (p.risk !== undefined) filters.risk = p.risk;
    if (p.brand !== undefined) filters.brand = p.brand;
    if (p.since !== undefined) filters.since = p.since;
    if (p.limit !== undefined) filters.limit = p.limit;
    return await phishing.listPhishingSites(filters);
  });

  handlers.set('easm.phishing.get', async (params: Record<string, unknown>) => {
    const p = params as any;
    return await phishing.getPhishingSite(p.siteId);
  });

  handlers.set('easm.phishing.update-status', async (params: Record<string, unknown>) => {
    const p = params as any;
    const success = await phishing.updatePhishingStatus(p.siteId, p.status);
    return { success };
  });

  handlers.set('easm.phishing.mark-taken-down', async (params: Record<string, unknown>) => {
    const p = params as any;
    const success = await phishing.markTakenDown(p.siteId);
    return { success };
  });

  handlers.set('easm.phishing.report', async (params: Record<string, unknown>) => {
    const p = params as any;
    const success = await phishing.reportToExternal(p.siteId, p.target);
    return { success };
  });

  handlers.set('easm.phishing.generate-candidates', async (params: Record<string, unknown>) => {
    const p = params as any;
    return phishing.generateLookalikeCandidates(p.brand, p.tlds);
  });

  handlers.set('easm.phishing.brand-watch.scan', async (params: Record<string, unknown>) => {
    const p = params as any;
    return await phishing.runBrandWatchScan(p.watchId, p.candidateDomains ?? []);
  });

  handlers.set('easm.phishing.stats', async () => {
    return await phishing.getStats();
  });

  handlers.set('easm.phishing.active', async () => {
    return await phishing.getActiveSites();
  });
}
