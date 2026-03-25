/**
 * Threat Repository
 * 
 * Manages threat intelligence, IOCs, and threat actors
 */

import type { JsonStore } from '../../storage/json-store.js';
import { BaseRepository } from '../repository.js';
import type { IOC, ThreatActor, ThreatSeverity, IOCType, IOCStatus } from '../types.js';

const THREATS_FILE = 'threats.json';

export interface IOCQueryParams {
  type?: IOCType;
  severity?: ThreatSeverity;
  status?: IOCStatus;
  threatActor?: string;
  minConfidence?: number;
  blocked?: boolean;
  limit?: number;
  offset?: number;
}

export class ThreatRepository {
  private fileName = THREATS_FILE;
  
  constructor(private store: JsonStore) {}
  
  // ==================== Threat Actors ====================
  
  async listActors(): Promise<ThreatActor[]> {
    const data = await this.store.get<(ThreatActor | IOC)[]>(this.fileName);
    if (!data) return [];
    return data.filter(item => 'type' in item && (item as ThreatActor).type) as ThreatActor[];
  }
  
  async getActor(id: string): Promise<ThreatActor | null> {
    const actors = await this.listActors();
    return actors.find(a => a.id === id) || null;
  }
  
  async getActorByName(name: string): Promise<ThreatActor | null> {
    const actors = await this.listActors();
    return actors.find(a => 
      a.name.toLowerCase() === name.toLowerCase() ||
      a.aliases.some(alias => alias.toLowerCase() === name.toLowerCase())
    ) || null;
  }
  
  // ==================== IOCs ====================
  
  async listIOCs(): Promise<IOC[]> {
    const data = await this.store.get<(ThreatActor | IOC)[]>(this.fileName);
    if (!data) return [];
    return data.filter(item => 'value' in item && (item as IOC).value) as IOC[];
  }
  
  async getIOC(id: string): Promise<IOC | null> {
    const iocs = await this.listIOCs();
    return iocs.find(i => i.id === id) || null;
  }
  
  async getIOCsByQuery(params: IOCQueryParams): Promise<IOC[]> {
    let iocs = await this.listIOCs();
    
    if (params.type) {
      iocs = iocs.filter(i => i.type === params.type);
    }
    if (params.severity) {
      iocs = iocs.filter(i => i.classification.severity === params.severity);
    }
    if (params.status) {
      iocs = iocs.filter(i => i.status === params.status);
    }
    if (params.threatActor) {
      iocs = iocs.filter(i => i.threatActor === params.threatActor);
    }
    if (params.minConfidence !== undefined) {
      iocs = iocs.filter(i => i.classification.confidence >= params.minConfidence);
    }
    if (params.blocked !== undefined) {
      iocs = iocs.filter(i => i.response.blocked === params.blocked);
    }
    
    // Sort by confidence and last seen
    iocs.sort((a, b) => {
      const cDiff = b.classification.confidence - a.classification.confidence;
      if (cDiff !== 0) return cDiff;
      return b.context.lastSeen - a.context.lastSeen;
    });
    
    if (params.offset !== undefined && params.limit !== undefined) {
      iocs = iocs.slice(params.offset, params.offset + params.limit);
    }
    
    return iocs;
  }
  
  async getActiveIOCs(): Promise<IOC[]> {
    return this.getIOCsByQuery({ status: 'active' });
  }
  
  async getHighConfidenceIOCs(): Promise<IOC[]> {
    return this.getIOCsByQuery({ minConfidence: 80 });
  }
  
  async createIOC(ioc: IOC): Promise<IOC> {
    const iocs = await this.listIOCs();
    iocs.push(ioc);
    const data = await this.store.get<(ThreatActor | IOC)[]>(this.fileName) || [];
    data.push(ioc);
    await this.store.set(this.fileName, data);
    return ioc;
  }
  
  async updateIOC(id: string, updates: Partial<IOC>): Promise<IOC | null> {
    const data = await this.store.get<(ThreatActor | IOC)[]>(this.fileName) || [];
    const index = data.findIndex(item => 'value' in item && item.id === id);
    
    if (index < 0) return null;
    
    data[index] = { ...data[index], ...updates };
    await this.store.set(this.fileName, data);
    return data[index] as IOC;
  }
  
  // ==================== Summary ====================
  
  async getSummary(): Promise<{
    totalActors: number;
    totalIOCs: number;
    activeIOCs: number;
    blockedIOCs: number;
    byType: Record<IOCType, number>;
    bySeverity: Record<ThreatSeverity, number>;
  }> {
    const actors = await this.listActors();
    const iocs = await this.listIOCs();
    
    const byType: Record<IOCType, number> = {
      ip: 0,
      domain: 0,
      url: 0,
      hash: 0,
      email: 0,
      certificate: 0,
    };
    const bySeverity: Record<ThreatSeverity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    
    let activeIOCs = 0;
    let blockedIOCs = 0;
    
    for (const ioc of iocs) {
      byType[ioc.type]++;
      bySeverity[ioc.classification.severity]++;
      if (ioc.status === 'active') activeIOCs++;
      if (ioc.response.blocked) blockedIOCs++;
    }
    
    return {
      totalActors: actors.length,
      totalIOCs: iocs.length,
      activeIOCs,
      blockedIOCs,
      byType,
      bySeverity,
    };
  }
}
