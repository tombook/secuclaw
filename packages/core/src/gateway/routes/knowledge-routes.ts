import type { RouterDeps } from '../router.js';

export function registerKnowledgeRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  deps: RouterDeps
): void {
  
  // skills.* handlers live in skills-routes.ts — do not duplicate here

  handlers.set('knowledge.mitre.stats', (params) => handleMitreStats(params, deps));
  handlers.set('knowledge.mitre.tactics', (params) => handleMitreTactics(params, deps));
  handlers.set('knowledge.mitre.techniques', (params) => handleMitreTechniques(params, deps));
  handlers.set('knowledge.mitre.search', (params) => handleMitreSearch(params, deps));

  
  handlers.set('knowledge.scf.stats', (params) => handleScfStats(params, deps));
  handlers.set('knowledge.scf.domains', (params) => handleScfDomains(params, deps));
  handlers.set('knowledge.scf.controls', (params) => handleScfControls(params, deps));
  handlers.set('knowledge.scf.search', (params) => handleScfSearch(params, deps));
}

async function handleMitreStats(_params: Record<string, unknown>, deps: RouterDeps) {
  if (!deps.mitreLoader) throw new Error('MITRE loader not available');
  return deps.mitreLoader.getStats();
}

async function handleMitreTactics(_params: Record<string, unknown>, deps: RouterDeps) {
  if (!deps.mitreLoader) throw new Error('MITRE loader not available');
  return deps.mitreLoader.getTactics();
}

async function handleMitreTechniques(params: Record<string, unknown>, deps: RouterDeps) {
  if (!deps.mitreLoader) throw new Error('MITRE loader not available');
  const { tacticId } = params;
  return deps.mitreLoader.getTechniques(tacticId as string | undefined);
}

async function handleMitreSearch(params: Record<string, unknown>, deps: RouterDeps) {
  if (!deps.mitreLoader) throw new Error('MITRE loader not available');
  const { query, type } = params;
  if (!query || typeof query !== 'string') throw new Error('query is required');
  return deps.mitreLoader.search(query, type as 'technique' | 'tactic' | 'all' | undefined);
}

async function handleScfStats(_params: Record<string, unknown>, deps: RouterDeps) {
  if (!deps.scfLoader) throw new Error('SCF loader not available');
  return deps.scfLoader.getStats();
}

async function handleScfDomains(_params: Record<string, unknown>, deps: RouterDeps) {
  if (!deps.scfLoader) throw new Error('SCF loader not available');
  return deps.scfLoader.getDomains();
}

async function handleScfControls(params: Record<string, unknown>, deps: RouterDeps) {
  if (!deps.scfLoader) throw new Error('SCF loader not available');
  const { domainId } = params;
  return deps.scfLoader.getControls(domainId as string | undefined);
}

async function handleScfSearch(params: Record<string, unknown>, deps: RouterDeps) {
  if (!deps.scfLoader) throw new Error('SCF loader not available');
  const { query } = params;
  if (!query || typeof query !== 'string') throw new Error('query is required');
  return deps.scfLoader.search(query);
}
