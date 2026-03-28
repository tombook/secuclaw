import type { JsonStore } from '../storage/json-store.js';

const DEFINITIONS_KEY = 'kpi-definitions.json';
const VALUES_KEY = 'kpi-values.json';

export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max';

export interface KpiDefinition {
  id: string;
  name: string;
  description: string;
  expression: string;
  aggregation: AggregationType;
  timeWindow: string;
  dimensions: string[];
  unit: string;
  createdAt: number;
  updatedAt: number;
}

export interface KpiValue {
  kpiId: string;
  value: number;
  timestamp: number;
  dimensions: Record<string, string>;
}

export class KpiDefinitionEngine {
  constructor(private store: JsonStore) {}

  async createKpi(def: Omit<KpiDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<KpiDefinition> {
    const all = await this.getDefinitions();
    const kpi: KpiDefinition = {
      ...def,
      id: `kpi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    all.push(kpi);
    await this.store.set(DEFINITIONS_KEY, all);
    return kpi;
  }

  async getKpi(id: string): Promise<KpiDefinition | null> {
    const all = await this.getDefinitions();
    return all.find(k => k.id === id) ?? null;
  }

  async getDefinitions(): Promise<KpiDefinition[]> {
    const raw = await this.store.get<KpiDefinition[]>(DEFINITIONS_KEY);
    return raw ?? [];
  }

  async updateKpi(id: string, updates: Partial<KpiDefinition>): Promise<KpiDefinition | null> {
    const all = await this.getDefinitions();
    const idx = all.findIndex(k => k.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...updates, updatedAt: Date.now() };
    await this.store.set(DEFINITIONS_KEY, all);
    return all[idx];
  }

  async deleteKpi(id: string): Promise<boolean> {
    const all = await this.getDefinitions();
    const filtered = all.filter(k => k.id !== id);
    if (filtered.length === all.length) return false;
    await this.store.set(DEFINITIONS_KEY, filtered);
    return true;
  }

  async calculateKpi(kpiId: string, timeRange?: { from: number; to: number }): Promise<KpiValue | null> {
    const kpi = await this.getKpi(kpiId);
    if (!kpi) return null;

    const raw = await this.store.get<KpiValue[]>(VALUES_KEY);
    const values: KpiValue[] = Array.isArray(raw) ? raw : [];
    const relevant = values.filter(v => {
      if (v.kpiId !== kpiId) return false;
      if (timeRange && (v.timestamp < timeRange.from || v.timestamp > timeRange.to)) return false;
      return true;
    });

    let result: number;
    const nums = relevant.map(v => v.value);
    switch (kpi.aggregation) {
      case 'sum': result = nums.reduce((a, b) => a + b, 0); break;
      case 'avg': result = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0; break;
      case 'count': result = nums.length; break;
      case 'min': result = nums.length > 0 ? Math.min(...nums) : 0; break;
      case 'max': result = nums.length > 0 ? Math.max(...nums) : 0; break;
      default: result = 0;
    }

    return {
      kpiId,
      value: Math.round(result * 100) / 100,
      timestamp: Date.now(),
      dimensions: {},
    };
  }

  async recordValue(kpiId: string, value: number, dimensions: Record<string, string> = {}): Promise<KpiValue> {
    const raw = await this.store.get<KpiValue[]>(VALUES_KEY);
    const values: KpiValue[] = Array.isArray(raw) ? raw : [];
    const entry: KpiValue = { kpiId, value, timestamp: Date.now(), dimensions };
    values.push(entry);
    await this.store.set(VALUES_KEY, values);
    return entry;
  }
}
