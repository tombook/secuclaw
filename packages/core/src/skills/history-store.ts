import { ExecutionResult } from './executor.js';

const HISTORY_KEY = 'secuclaw-skill-execution-history';
const MAX_HISTORY = 100;

class HistoryStore {
  private history: ExecutionResult[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        this.history = JSON.parse(stored).map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp),
        }));
      }
    } catch {
      this.history = [];
    }
  }

  private save() {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history));
    } catch {
      console.warn('Failed to save execution history');
    }
  }

  add(execution: ExecutionResult) {
    this.history.unshift(execution);
    if (this.history.length > MAX_HISTORY) {
      this.history = this.history.slice(0, MAX_HISTORY);
    }
    this.save();
  }

  getAll(): ExecutionResult[] {
    return [...this.history];
  }

  getBySkill(skillId: string): ExecutionResult[] {
    return this.history.filter(e => e.skill === skillId);
  }

  getByRole(roleId: string): ExecutionResult[] {
    return this.history.filter(e => e.executedBy === roleId);
  }

  clear() {
    this.history = [];
    this.save();
  }

  cleanupOlderThan(days: number) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    this.history = this.history.filter(e => e.timestamp.getTime() > cutoff);
    this.save();
  }
}

export const historyStore = new HistoryStore();
