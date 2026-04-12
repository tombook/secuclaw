import 'reflect-metadata';
import { Service } from 'typedi';
import { ThreatsRepository, type ThreatActor, type ThreatQueryParams } from './repository.js';
import type { EventBus as EventBusType } from '../events/event-bus.js';

@Service()
export class ThreatsService {
  private eventBus: EventBusType | null = null;

  constructor(private repo: ThreatsRepository) {}

  setEventBus(bus: EventBusType): void {
    this.eventBus = bus;
  }

  private async emitEvent(event: string, payload: unknown): Promise<void> {
    if (this.eventBus) {
      try {
        await this.eventBus.emit(event as any, payload);
      } catch (err) {
        console.error('[ThreatsService] EventBus emit failed', err);
      }
    }
  }

  async list(params: ThreatQueryParams = {}): Promise<ThreatActor[]> {
    return this.repo.query(params);
  }

  async get(id: string): Promise<ThreatActor | null> {
    return this.repo.getById(id);
  }

  async getByName(name: string): Promise<ThreatActor | null> {
    return this.repo.getByName(name);
  }

  async getStats() {
    return this.repo.getStats();
  }

  async searchByTechnique(techniqueId: string): Promise<ThreatActor[]> {
    return this.repo.searchByTechnique(techniqueId);
  }

  async search(keyword: string): Promise<ThreatActor[]> {
    const t = await this.repo.getByName(keyword);
    return t ? [t] : [];
  }

  async getByTechnique(techniqueId: string): Promise<{ threat: ThreatActor; relatedTechniques: string[] } | null> {
    const threats = await this.repo.searchByTechnique(techniqueId);
    if (!threats || threats.length === 0) return null;

    const threat = threats[0];
    const techniqueSet = new Set<string>(threat.capabilities?.techniques ?? []);
    threat.campaigns?.forEach(c => c.techniques.forEach(t => techniqueSet.add(t)));
    const relatedTechniques = Array.from(techniqueSet);

    return { threat, relatedTechniques };
  }

  async getRelatedToIncident(techniques: string[]): Promise<ThreatActor[]> {
    const map = new Map<string, ThreatActor>();
    for (const t of techniques) {
      const threats = await this.repo.searchByTechnique(t);
      for (const threat of threats) {
        map.set(threat.id, threat);
      }
    }
    const list = Array.from(map.values());
    list.sort((a, b) => {
      const ca = a.sources?.reduce((acc, s) => acc + s.confidence, 0) ?? 0;
      const cb = b.sources?.reduce((acc, s) => acc + s.confidence, 0) ?? 0;
      return cb - ca;
    });
    return list;
  }

  async getLandscape(): Promise<{
    totalThreats: number;
    byMotivation: Record<string, number>;
    byType: Record<string, number>;
    topTargets: Array<{ target: string; count: number }>;
    activeCampaigns: number;
    avgConfidence: number;
  }> {
    const threats = await this.repo.getAll();

    const byMotivation: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const targetCounts: Record<string, number> = {};
    let totalConfidence = 0;
    let confidenceCount = 0;
    const campaignIds = new Set<string>();
    const now = Date.now();
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

    for (const t of threats) {
      byType[t.type] = (byType[t.type] ?? 0) + 1;
      t.motivation.forEach(m => {
        byMotivation[m] = (byMotivation[m] ?? 0) + 1;
      });
      t.targets.forEach(trg => {
        targetCounts[trg] = (targetCounts[trg] ?? 0) + 1;
      });

      t.sources.forEach(s => {
        totalConfidence += s.confidence;
        confidenceCount++;
      });

      t.campaigns?.forEach(c => {
        if (now - c.startDate <= ninetyDaysMs) {
          campaignIds.add(c.id);
        }
      });
    }

    const topTargets = Object.entries(targetCounts)
      .map(([target, count]) => ({ target, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const avgConfidence = confidenceCount> 0 ? Math.round(totalConfidence / confidenceCount) : 0;

    return {
      totalThreats: threats.length,
      byMotivation,
      byType,
      topTargets,
      activeCampaigns: campaignIds.size,
      avgConfidence,
    };
  }

  async analyzeIOCs(threatId: string): Promise<{
    threatId: string;
    indicators: string[];
    iocTypes: Record<string, number>;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  } | null> {
    const threat = await this.repo.getById(threatId);
    if (!threat) return null;

    const indicators = threat.indicators ?? [];
    const iocTypes: Record<string, number> = { ip: 0, domain: 0, url: 0, hash: 0, email: 0 };

    const isIp = (s: string) => /^\d{1,3}(?:\.\d{1,3}){3}$/.test(s);
    const isHash= (s: string) => /^[0-9a-fA-F]{32,}$/.test(s);
    const isEmail= (s: string) => /.+@.+\..+/.test(s);
    const isUrl= (s: string) => /^https?:\/\//.test(s);
    const isDomain= (s: string) => !isIp(s) && !isHash(s) && !isEmail(s) && !isUrl(s);

    for (const ind of indicators) {
      if (isIp(ind)) iocTypes.ip += 1;
      else if (isHash(ind)) iocTypes.hash += 1;
      else if (isEmail(ind)) iocTypes.email += 1;
      else if (isUrl(ind)) iocTypes.url += 1;
      else if (isDomain(ind)) iocTypes.domain += 1;
    }

    const totalIndicators = indicators.length;
    const avgConf = threat.sources?.length ? threat.sources.reduce((a, s) => a + s.confidence, 0) / threat.sources.length : 0;
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (totalIndicators >= 10 || avgConf >= 0.95) riskLevel = 'critical';
    else if (totalIndicators >= 6 || avgConf >= 0.85) riskLevel = 'high';
    else if (totalIndicators >= 3 || avgConf >= 0.6) riskLevel = 'medium';

    return { threatId, indicators, iocTypes, riskLevel };
  }

  async updateConfidence(threatId: string, source: string, confidence: number): Promise<ThreatActor | null> {
    const threat = await this.repo.getById(threatId);
    if (!threat) return null;

    const existingIndex = threat.sources.findIndex(s => s.provider === source);
    let updatedSources = threat.sources ?? [];
    if (existingIndex >= 0) {
      updatedSources[existingIndex] = {
        ...updatedSources[existingIndex],
        confidence: Math.max(updatedSources[existingIndex].confidence, confidence),
        lastUpdated: Date.now(),
      } as any;
    } else {
      updatedSources = [...updatedSources, { provider: source, confidence, lastUpdated: Date.now() } as any];
    }

    const updated = await this.repo.update(threatId, { sources: updatedSources });

    await this.emitEvent('threat.confidenceUpdated', { threatId, source, confidence });

    return updated;
  }
}
