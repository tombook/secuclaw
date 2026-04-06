import type { RouterDeps } from '../router.js';

export function registerSecurityRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  deps: RouterDeps
): void {
  // 临时模拟实现，避免依赖问题
  handlers.set('vulnerabilities.list', async (p) => {
    return [];
  });
  
  handlers.set('vulnerabilities.get', async (p) => {
    const { id } = p;
    return { id, status: 'open', severity: 'low', cveId: 'CVE-2023-1234' };
  });
  
  handlers.set('vulnerabilities.updateStatus', async (p) => {
    const { id, status } = p;
    return { id, status };
  });
  
  handlers.set('vulnerabilities.assign', async (p) => {
    const { id, assignedTo } = p;
    return { id, assignedTo };
  });
  
  handlers.set('vulnerabilities.stats', async () => {
    return { total: 0, open: 0, inProgress: 0, resolved: 0 };
  });
  
  handlers.set('vulnerabilities.nextStatuses', async (p) => {
    return ['inProgress', 'resolved'];
  });
  
  handlers.set('threats.list', async (p) => {
    return [];
  });
  
  handlers.set('threats.get', async (p) => {
    const { id } = p;
    return { id, type: 'malware', motivation: 'financial' };
  });
  
  handlers.set('threats.stats', async () => {
    return { total: 0 };
  });
  
  handlers.set('threats.search', async (p) => {
    const { keyword } = p;
    return [];
  });
  
  handlers.set('compliance.list', async (p) => {
    return [];
  });
  
  handlers.set('compliance.get', async (p) => {
    const { id } = p;
    return { id, framework: 'ISO27001', controlId: 'A.12.3.1' };
  });
  
  handlers.set('compliance.stats', async () => {
    return { compliant: 0, nonCompliant: 0 };
  });
  
  handlers.set('assets.list', async (p) => {
    return [];
  });
  
  handlers.set('assets.get', async (p) => {
    const { id } = p;
    return { id, name: 'Test Server', type: 'server' };
  });
  
  handlers.set('assets.stats', async () => {
    return { total: 0, servers: 0, workstations: 0 };
  });
}