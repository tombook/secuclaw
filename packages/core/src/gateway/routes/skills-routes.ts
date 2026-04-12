import type { Router } from '../router.js';

export function registerSkillsRoutes(router: Router): void {
  router.registerHandler('skills.list', async () => {
    const loader = router.getDeps().skillLoader;
    if (!loader) throw new Error('Skill loader not available');
    return loader.getAll();
  });
  router.registerHandler('skills.get', async (params: Record<string, unknown>) => {
    const loader = router.getDeps().skillLoader;
    if (!loader) throw new Error('Skill loader not available');
    const { roleId } = params;
    if (!roleId || typeof roleId !== 'string') throw new Error('roleId is required');
    return loader.get(roleId);
  });
}
