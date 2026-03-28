import type { Router } from '../router.js';

export function registerSkillsRoutes(router: Router): void {
  router.registerHandler('skills.list', async () => router.getDeps().skillLoader.getAll());
  router.registerHandler('skills.get', async (params: Record<string, unknown>) => {
    const { roleId } = params;
    if (!roleId || typeof roleId !== 'string') throw new Error('roleId is required');
    return router.getDeps().skillLoader.get(roleId);
  });
}
