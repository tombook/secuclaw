import { mkdir, readFile, writeFile, unlink, access, rename, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import type { IStorage } from './types.js';

const logger = {
  info: (...args: any[]) => console.log('[JsonStore]', ...args),
  error: (...args: any[]) => console.error('[JsonStore]', ...args),
  debug: (...args: any[]) => console.log('[JsonStore:DEBUG]', ...args),
};

export interface JsonStoreCacheOptions {
  enabled?: boolean;
  maxKeys?: number;
  invalidateOnWrite?: boolean;
}

export class CachedJsonStore implements IStorage {
  private basePath: string;
  private writeLock: Promise<void> = Promise.resolve();
  private cache: Map<string, { value: unknown; mtime: number; dirty: boolean }> = new Map();
  private options: Required<JsonStoreCacheOptions>;
  private hitCount = 0;
  private missCount = 0;

  constructor(basePath: string, options: JsonStoreCacheOptions = {}) {
    this.basePath = basePath;
    this.options = {
      enabled: options.enabled !== false,
      maxKeys: options.maxKeys ?? 500,
      invalidateOnWrite: options.invalidateOnWrite !== false,
    };
  }

  private async ensureDir(filePath: string): Promise<void> {
    const dir = dirname(filePath);
    await mkdir(dir, { recursive: true });
  }

  private resolvePath(key: string): string {
    return join(this.basePath, key);
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    if (this.options.enabled) {
      const cached = this.cache.get(key);
      if (cached && !cached.dirty) {
        this.hitCount++;
        return cached.value as T;
      }
    }
    this.missCount++;
    try {
      const filePath = this.resolvePath(key);
      const content = await readFile(filePath, 'utf-8');
      const value = JSON.parse(content) as T;
      if (this.options.enabled) this.setCache(key, value, false);
      return value;
    } catch (error) {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    const filePath = this.resolvePath(key);
    if (this.options.enabled) this.setCache(key, value, true);

    let capturedError: Error | null = null;

    this.writeLock = this.writeLock.then(async () => {
      await this.ensureDir(filePath);
      const tempPath = `${filePath}.tmp`;
      await writeFile(tempPath, JSON.stringify(value, null, 2), 'utf-8');
      await rename(tempPath, filePath);
      if (this.options.enabled) {
        const cached = this.cache.get(key);
        if (cached) cached.dirty = false;
      }
      logger.debug(`Saved: ${key}`);
    }).catch((error) => {
      capturedError = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to save: ${key}`, error);
    });

    await this.writeLock;

    if (capturedError) {
      throw capturedError;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (this.options.enabled) this.cache.delete(key);
    try {
      const filePath = this.resolvePath(key);
      await unlink(filePath);
      logger.debug(`Deleted: ${key}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const filePath = this.resolvePath(key);
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async list(prefix: string): Promise<string[]> {
    try {
      const dir = this.resolvePath(prefix);
      const files = await readdir(dir);
      return files.filter((f) => f.endsWith('.json'));
    } catch {
      return [];
    }
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateAll(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; hitRate: number; hits: number; misses: number; maxKeys: number } {
    const total = this.hitCount + this.missCount;
    return {
      size: this.cache.size,
      hitRate: total > 0 ? this.hitCount / total : 0,
      hits: this.hitCount,
      misses: this.missCount,
      maxKeys: this.options.maxKeys,
    };
  }

  private setCache(key: string, value: unknown, dirty: boolean): void {
    if (this.cache.size >= this.options.maxKeys && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, { value, mtime: Date.now(), dirty });
  }
}
