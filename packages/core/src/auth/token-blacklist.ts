import type { JsonStore } from '../storage/json-store.js';

const STORE_KEY = 'token-blacklist.json';

interface BlacklistEntry {
  jti: string;
  expiresAt: number;
  revokedAt: number;
}

export class TokenBlacklist {
  constructor(private store: JsonStore) {}

  async add(jti: string, expiresAt: number): Promise<void> {
    const entries = await this.getAll();
    entries.push({ jti, expiresAt, revokedAt: Date.now() });
    await this.cleanup(entries);
    await this.store.set(STORE_KEY, entries);
  }

  async isRevoked(jti: string): Promise<boolean> {
    const entries = await this.getAll();
    const now = Date.now();
    return entries.some(e => e.jti === jti && e.expiresAt > now);
  }

  async cleanup(entries?: BlacklistEntry[]): Promise<void> {
    const list = entries ?? await this.getAll();
    const now = Date.now();
    const pruned = list.filter(e => e.expiresAt > now);
    if (pruned.length < list.length) {
      await this.store.set(STORE_KEY, pruned);
    }
  }

  private async getAll(): Promise<BlacklistEntry[]> {
    const data = await this.store.get<BlacklistEntry[]>(STORE_KEY);
    return data ?? [];
  }
}
