import type { JsonStore } from '../storage/json-store.js';
import type { Commander } from './types.js';

export class CommanderRepository {
  constructor(private store: JsonStore) {}
  
  async getById(id: string): Promise<Commander | null> {
    const key = `commanders/${id}.json`;
    const data = await this.store.get<Commander>(key);
    return data ?? null;
  }

  async create(commander: Commander): Promise<Commander> {
    const key = `commanders/${commander.id}.json`;
    await this.store.set(key, commander);
    return commander;
  }

  async update(id: string, updates: Partial<Commander>): Promise<Commander | null> {
    const existing = await this.getById(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: Date.now() } as Commander;
    await this.store.set(`commanders/${id}.json`, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(`commanders/${id}.json`);
  }
}
