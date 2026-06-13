import { SbomService } from '../../supply-chain/sbom-service.js';
import type { JsonStore } from '../../storage/json-store.js';
import type { RouterDeps } from '../router.js';


let service: SbomService | null = null;
function getService(store: JsonStore): SbomService {
  if (!service) service = new SbomService(store);
  return service;
}

export function registerSupplyChainRoutes(
  handlers: Map<string, Function>,
  deps: RouterDeps,
): void {
  const store = (deps as any).jsonStore ?? (deps as any).store;

  handlers.set('sbom.create', async (params: Record<string, unknown>) => {
    const projectName = params.projectName as string;
    const format = params.format as 'cyclonedx' | 'spdx' | 'custom';
    const components = (params.components ?? []) as any[];
    return getService(store).createSbom(projectName, format, components);
  });

  handlers.set('sbom.parse.cyclonedx', async (params: Record<string, unknown>) => {
    const content = params.content as string;
    return getService(store).parseCycloneDX(content);
  });

  handlers.set('sbom.parse.spdx', async (params: Record<string, unknown>) => {
    const content = params.content as string;
    return getService(store).parseSPDX(content);
  });

  handlers.set('sbom.correlate-vulns', async (params: Record<string, unknown>) => {
    const sbomId = params.sbomId as string;
    return getService(store).correlateVulnerabilities(sbomId);
  });

  handlers.set('sbom.get', async (params: Record<string, unknown>) => {
    const sbomId = params.sbomId as string;
    return getService(store).getSbom(sbomId);
  });

  handlers.set('sbom.list', async (params: Record<string, unknown>) => {
    const projectName = params.projectName as string | undefined;
    const since = params.since as number | undefined;
    const filters: { projectName?: string; since?: number } = {};
    if (projectName) filters.projectName = projectName;
    if (typeof since === 'number') filters.since = since;
    const docs = await getService(store).listSboms({ projectName: filters.projectName });
    if (typeof filters.since === 'number') {
      return docs.filter((d) => d.timestamp >= filters.since!);
    }
    return docs;
  });

  handlers.set('sbom.latest', async (params: Record<string, unknown>) => {
    const projectName = params.projectName as string;
    return getService(store).getLatestSbom(projectName);
  });

  handlers.set('sbom.diff', async (params: Record<string, unknown>) => {
    const sbomIdA = params.sbomIdA as string;
    const sbomIdB = params.sbomIdB as string;
    return getService(store).diffSboms(sbomIdA, sbomIdB);
  });

  handlers.set('sbom.signatures.check', async (params: Record<string, unknown>) => {
    const sbomId = params.sbomId as string;
    return getService(store).checkCodeSignatures(sbomId);
  });

  handlers.set('sbom.ai-generated.detect', async (params: Record<string, unknown>) => {
    const sbomId = params.sbomId as string;
    return getService(store).detectAiGeneratedCode(sbomId);
  });

  handlers.set('sbom.score', async (params: Record<string, unknown>) => {
    const sbomId = params.sbomId as string;
    const score = await getService(store).getSupplyChainScore(sbomId);
    return { score };
  });

  handlers.set('sbom.vulnerability-report', async (params: Record<string, unknown>) => {
    const sbomId = params.sbomId as string;
    return getService(store).getVulnerabilityReport(sbomId);
  });
}