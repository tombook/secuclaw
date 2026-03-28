import type { RouterDeps } from '../router.js';

export function registerKnowledgeRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  deps: RouterDeps
): void {
  
  handlers.set('skills.list', (params) => handleSkillsList(params, deps));
  handlers.set('skills.get', (params) => handleSkillsGet(params, deps));

  
  handlers.set('knowledge.mitre.stats', (params) => handleMitreStats(params, deps));
  handlers.set('knowledge.mitre.tactics', (params) => handleMitreTactics(params, deps));
  handlers.set('knowledge.mitre.techniques', (params) => handleMitreTechniques(params, deps));
  handlers.set('knowledge.mitre.search', (params) => handleMitreSearch(params, deps));

  
  handlers.set('knowledge.scf.stats', (params) => handleScfStats(params, deps));
  handlers.set('knowledge.scf.domains', (params) => handleScfDomains(params, deps));
  handlers.set('knowledge.scf.controls', (params) => handleScfControls(params, deps));
  handlers.set('knowledge.scf.search', (params) => handleScfSearch(params, deps));
}

// Simple pass-through handlers relying on loaders present in deps
async function handleSkillsList(_params: Record<string, unknown>, deps: RouterDeps) {
  return deps.skillLoader.getAll();
}

async function handleSkillsGet(params: Record<string, unknown>, deps: RouterDeps) {
  const { roleId } = params;
  if (!roleId || typeof roleId !== 'string') throw new Error('roleId is required');
  return deps.skillLoader.get(roleId);
}

async function handleMitreStats(_params: Record<string, unknown>, deps: RouterDeps) {
  return deps.mitreLoader.getStats();
}

async function handleMitreTactics(_params: Record<string, unknown>, deps: RouterDeps) {
  return deps.mitreLoader.getTactics();
}

async function handleMitreTechniques(params: Record<string, unknown>, deps: RouterDeps) {
  const { tacticId } = params;
  return deps.mitreLoader.getTechniques(tacticId as string | undefined);
}

async function handleMitreSearch(params: Record<string, unknown>, deps: RouterDeps) {
  const { query, type } = params;
  if (!query || typeof query !== 'string') throw new Error('query is required');
  return deps.mitreLoader.search(query, type as 'technique' | 'tactic' | 'all' | undefined);
}

async function handleScfStats(_params: Record<string, unknown>, deps: RouterDeps) {
  return deps.scfLoader.getStats();
}

async function handleScfDomains(_params: Record<string, unknown>, deps: RouterDeps) {
  return deps.scfLoader.getDomains();
}

async function handleScfControls(params: Record<string, unknown>, deps: RouterDeps) {
  const { domainId } = params;
  return deps.scfLoader.getControls(domainId as string | undefined);
}

async function handleScfSearch(params: Record<string, unknown>, deps: RouterDeps) {
  const { query } = params;
  if (!query || typeof query !== 'string') throw new Error('query is required');
  return deps.scfLoader.search(query);
}
