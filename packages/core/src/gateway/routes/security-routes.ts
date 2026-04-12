import type { RouterDeps } from '../router.js';

/**
 * Security Routes - threats & compliance endpoints
 * 
 * Note: vulnerabilities and assets are handled by their dedicated CRUD routes:
 * - vulnerabilities: vulnerabilities-crud-routes.ts (or vulnerabilities-routes.ts)
 * - assets: assets-routes.ts
 * This file only registers endpoints NOT covered by those modules.
 */
export function registerSecurityRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  deps: RouterDeps
): void {
  async function getData<T>(key: string): Promise<T[]> {
    const data = await deps.jsonStore.get<T>(key);
    return Array.isArray(data) ? data : [];
  }

  // Threats - only registered here
  handlers.set('threats.list', async () => {
    return getData('threats');
  });

  handlers.set('threats.get', async (p) => {
    const { id } = p;
    const list = await getData('threats');
    return list.find((t: any) => t.id === id) || null;
  });

  handlers.set('threats.stats', async () => {
    const list = await getData('threats');
    return { total: list.length };
  });

  handlers.set('threats.search', async (p) => {
    const { keyword } = p;
    const list = await getData('threats');
    if (!keyword) return list;
    const kw = String(keyword).toLowerCase();
    return list.filter((t: any) =>
      JSON.stringify(t).toLowerCase().includes(kw)
    );
  });

  // Compliance - only registered here
  handlers.set('compliance.list', async () => {
    return getData('compliance');
  });

  handlers.set('compliance.get', async (p) => {
    const { id } = p;
    const list = await getData('compliance');
    return list.find((c: any) => c.id === id) || null;
  });

  handlers.set('compliance.stats', async () => {
    const list = await getData('compliance');
    return { total: list.length, compliant: list.filter((c: any) => c.status === 'compliant').length, nonCompliant: list.filter((c: any) => c.status !== 'compliant').length };
  });
}
