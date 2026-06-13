import type { RouterDeps } from '../router.js';
import type { CachedJsonStore } from '../../storage/cached-json-store.js';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

export function registerPerfRoutes(handlers: Map<string, Function>, deps: RouterDeps): void {
  const store: any = (deps as any).jsonStore ?? (deps as any).store;
  const basePath: string = (deps as any).storagePath ?? '';

  handlers.set('perf.cache.stats', async () => {
    if (store && typeof store.getCacheStats === 'function') {
      return store.getCacheStats();
    }
    return { size: 0, hitRate: 0, hits: 0, misses: 0, maxKeys: 0 };
  });

  handlers.set('perf.cache.invalidate', async (p: any) => {
    if (store && typeof store.invalidate === 'function') {
      if (p?.key) {
        store.invalidate(p.key);
        return { invalidated: p.key };
      }
      store.invalidateAll();
      return { invalidated: 'all' };
    }
    return { invalidated: 0 };
  });

  handlers.set('perf.storage.stats', async () => {
    if (!basePath) return { totalSize: 0, fileCount: 0, modules: [] };
    return await scanStorage(basePath);
  });

  handlers.set('perf.health', async () => {
    const uptime = process.uptime();
    const mem = process.memoryUsage();
    return {
      status: 'ok',
      timestamp: Date.now(),
      uptimeSeconds: Math.floor(uptime),
      memory: {
        rss: mem.rss,
        heapTotal: mem.heapTotal,
        heapUsed: mem.heapUsed,
        external: mem.external,
        rssMb: Math.round(mem.rss / 1024 / 1024),
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      },
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid,
    };
  });
}

async function scanStorage(basePath: string): Promise<{ totalSize: number; fileCount: number; modules: any[] }> {
  let totalSize = 0;
  let fileCount = 0;
  const modules: Array<{ name: string; size: number; count: number }> = [];
  async function walk(dir: string) {
    let entries: string[];
    try { entries = await readdir(dir); } catch { return; }
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const s = await stat(fullPath);
      if (s.isDirectory()) {
        await walk(fullPath);
      } else if (entry.endsWith('.json')) {
        totalSize += s.size;
        fileCount++;
        const moduleName = fullPath.split('/storage/')[1]?.split('/')[0] || 'root';
        const existing = modules.find((m) => m.name === moduleName);
        if (existing) {
          existing.size += s.size;
          existing.count++;
        } else {
          modules.push({ name: moduleName, size: s.size, count: 1 });
        }
      }
    }
  }
  await walk(basePath);
  modules.sort((a, b) => b.size - a.size);
  return { totalSize, fileCount, modules };
}
