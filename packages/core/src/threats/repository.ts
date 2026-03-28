/**
 * Threats Repository
 * 威胁情报数据访问层
 */

import type { JsonStore } from '../storage/json-store.js';

const FILE_NAME = 'threats.json';

export interface ThreatActor {
  id: string;
  name: string;
  aliases: string[];
  type: string;
  motivation: string[];
  capabilities: {
    sophistication: string;
    techniques: string[];
    tools: string[];
    malware: string[];
  };
  campaigns: Array<{
    id: string;
    name: string;
    startDate: number;
    description: string;
    techniques: string[];
  }>;
  targets: string[];
  indicators: string[];
  sources: Array<{
    provider: string;
    confidence: number;
    lastUpdated: number;
  }>;
}

export interface ThreatQueryParams {
  type?: string;
  motivation?: string;
  target?: string;
  page?: number;
  pageSize?: number;
}

export class ThreatsRepository {
  constructor(private store: JsonStore) {}

  async getAll(): Promise<ThreatActor[]> {
    return (await this.store.get<ThreatActor[]>(FILE_NAME)) || [];
  }

  async getById(id: string): Promise<ThreatActor | null> {
    const threats = await this.getAll();
    return threats.find(t => t.id === id) || null;
  }

  async getByName(name: string): Promise<ThreatActor | null> {
    const threats = await this.getAll();
    return threats.find(t => 
      t.name.toLowerCase().includes(name.toLowerCase()) ||
      t.aliases.some(a => a.toLowerCase().includes(name.toLowerCase()))
    ) || null;
  }

  async query(params: ThreatQueryParams): Promise<ThreatActor[]> {
    let threats = await this.getAll();

    if (params.type) {
      threats = threats.filter(t => t.type === params.type);
    }
    if (params.motivation) {
      threats = threats.filter(t => t.motivation.includes(params.motivation!));
    }
    if (params.target) {
      threats = threats.filter(t => t.targets.includes(params.target!));
    }

    if (params.page !== undefined && params.pageSize) {
      const start = (params.page - 1) * params.pageSize;
      threats = threats.slice(start, start + params.pageSize);
    }

    return threats;
  }

  async getStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byMotivation: Record<string, number>;
    byTarget: Record<string, number>;
    avgConfidence: number;
  }> {
    const threats = await this.getAll();
    
    const byType: Record<string, number> = {};
    const byMotivation: Record<string, number> = {};
    const byTarget: Record<string, number> = {};
    let totalConfidence = 0;
    let confidenceCount = 0;

    for (const threat of threats) {
      byType[threat.type] = (byType[threat.type] || 0) + 1;
      
      for (const m of threat.motivation) {
        byMotivation[m] = (byMotivation[m] || 0) + 1;
      }
      
      for (const t of threat.targets) {
        byTarget[t] = (byTarget[t] || 0) + 1;
      }

      for (const s of threat.sources) {
        totalConfidence += s.confidence;
        confidenceCount++;
      }
    }

    return {
      total: threats.length,
      byType,
      byMotivation,
      byTarget,
      avgConfidence: confidenceCount > 0 ? Math.round(totalConfidence / confidenceCount) : 0,
    };
  }

  async searchByTechnique(techniqueId: string): Promise<ThreatActor[]> {
    const threats = await this.getAll();
    return threats.filter(t => 
      t.capabilities.techniques.includes(techniqueId) ||
      t.campaigns.some(c => c.techniques.includes(techniqueId))
    );
  }

  async update(id: string, updates: Partial<ThreatActor>): Promise<ThreatActor | null> {
    const threats = await this.getAll();
    const index = threats.findIndex(t => t.id === id);
    if (index === -1) return null;
    threats[index] = { ...threats[index], ...updates } as ThreatActor;
    await this.store.set(FILE_NAME, threats);
    return threats[index];
  }
}
