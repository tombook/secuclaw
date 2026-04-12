import { mkdir, readFile, writeFile, unlink, access, rename, readdir } from 'fs/promises';
// Simple write lock to ensure sequential writes
import { join, dirname } from 'path';

const logger = {
  info: (...args: any[]) => console.log('[JsonStore]', ...args),
  error: (...args: any[]) => console.error('[JsonStore]', ...args),
  debug: (...args: any[]) => console.log('[JsonStore:DEBUG]', ...args),
};

export class JsonStore {
  private basePath: string;
  private writeLock: Promise<void> = Promise.resolve();

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  private async ensureDir(filePath: string): Promise<void> {
    const dir = dirname(filePath);
    await mkdir(dir, { recursive: true });
  }

  private resolvePath(key: string): string {
    return join(this.basePath, key);
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const filePath = this.resolvePath(key);
      const content = await readFile(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch (error) {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    const filePath = this.resolvePath(key);
    
    let capturedError: Error | null = null;
    
    this.writeLock = this.writeLock.then(async () => {
      await this.ensureDir(filePath);
      const tempPath = `${filePath}.tmp`;
      await writeFile(tempPath, JSON.stringify(value, null, 2), 'utf-8');
      await rename(tempPath, filePath);
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
}
