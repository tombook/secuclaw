import type { JsonStore } from '../storage/json-store.js';
import type { Playbook, PlaybookStatus, TriggerType } from './playbook-types.js';

const STORE_KEY = 'playbooks.json';

export class PlaybookRepository {
  constructor(private store: JsonStore) {}

  async getAll(): Promise<Playbook[]> {
    const raw = await this.store.get<Playbook[]>(STORE_KEY);
    return raw ?? [];
  }

  async getById(id: string): Promise<Playbook | null> {
    const all = await this.getAll();
    return all.find(p => p.id === id) ?? null;
  }

  async create(playbook: Playbook): Promise<Playbook> {
    const all = await this.getAll();
    all.push(playbook);
    await this.store.set(STORE_KEY, all);
    return playbook;
  }

  async update(id: string, updates: Partial<Playbook>): Promise<Playbook | null> {
    const all = await this.getAll();
    const idx = all.findIndex(p => p.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...updates, updatedAt: Date.now() };
    await this.store.set(STORE_KEY, all);
    return all[idx];
  }

  async delete(id: string): Promise<boolean> {
    const all = await this.getAll();
    const filtered = all.filter(p => p.id !== id);
    if (filtered.length === all.length) return false;
    await this.store.set(STORE_KEY, filtered);
    return true;
  }

  async query(params?: { status?: PlaybookStatus; triggerType?: TriggerType }): Promise<Playbook[]> {
    let results = await this.getAll();
    if (params?.status) results = results.filter(p => p.status === params.status);
    if (params?.triggerType) results = results.filter(p => p.trigger.type === params.triggerType);
    return results;
  }

  async getVersionHistory(id: string): Promise<Playbook[]> {
    const all = await this.getAll();
    return all.filter(p => p.id === id || p.id.startsWith(id + '_v'));
  }
}
