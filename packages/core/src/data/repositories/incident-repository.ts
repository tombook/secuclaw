/**
 * Incident Repository
 * 
 * Manages security incidents
 */

import type { JsonStore } from '../../storage/json-store.js';
import type { Incident, IncidentSeverity, IncidentStatus, IncidentCategory } from '../types.js';

const FILE_NAME = 'incidents.json';

export interface IncidentQueryParams {
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  category?: IncidentCategory;
  assignee?: string;
  threatActor?: string;
  fromDate?: number;
  toDate?: number;
  limit?: number;
  offset?: number;
}

export class IncidentRepository {
  private fileName = FILE_NAME;
  
  constructor(private store: JsonStore) {}
  
  async list(): Promise<Incident[]> {
    const incidents = await this.store.get<Incident[]>(this.fileName);
    return incidents || [];
  }
  
  async get(id: string): Promise<Incident | null> {
    const incidents = await this.list();
    return incidents.find(i => i.id === id || i.ticketId === id) || null;
  }
  
  async getByQuery(params: IncidentQueryParams): Promise<Incident[]> {
    let incidents = await this.list();
    
    if (params.severity) {
      incidents = incidents.filter(i => i.info.severity === params.severity);
    }
    if (params.status) {
      incidents = incidents.filter(i => i.workflow.status === params.status);
    }
    if (params.category) {
      incidents = incidents.filter(i => i.info.category === params.category);
    }
    if (params.assignee) {
      incidents = incidents.filter(i => i.workflow.assignee === params.assignee);
    }
    if (params.threatActor) {
      incidents = incidents.filter(i => i.attack.threatActor === params.threatActor);
    }
    if (params.fromDate !== undefined) {
      incidents = incidents.filter(i => i.timeline.detectedAt >= params.fromDate);
    }
    if (params.toDate !== undefined) {
      incidents = incidents.filter(i => i.timeline.detectedAt <= params.toDate);
    }
    
    // Sort by severity and detected time
    const severityOrder: Record<IncidentSeverity, number> = { 
      P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 
    };
    incidents.sort((a, b) => {
      const sDiff = severityOrder[a.info.severity] - severityOrder[b.info.severity];
      if (sDiff !== 0) return sDiff;
      return b.timeline.detectedAt - a.timeline.detectedAt;
    });
    
    if (params.offset !== undefined && params.limit !== undefined) {
      incidents = incidents.slice(params.offset, params.offset + params.limit);
    }
    
    return incidents;
  }
  
  async create(incident: Incident): Promise<Incident> {
    const incidents = await this.list();
    incidents.push(incident);
    await this.store.set(this.fileName, incidents);
    return incident;
  }
  
  async update(id: string, updates: Partial<Incident>): Promise<Incident | null> {
    const incidents = await this.list();
    const index = incidents.findIndex(i => i.id === id || i.ticketId === id);
    
    if (index < 0) return null;
    
    incidents[index] = { ...incidents[index], ...updates };
    await this.store.set(this.fileName, incidents);
    return incidents[index];
  }
  
  async updateStatus(id: string, status: IncidentStatus): Promise<Incident | null> {
    return this.update(id, {
      workflow: { 
        ...(await this.get(id))?.workflow, 
        status,
        previousStatus: (await this.get(id))?.workflow.status || 'new',
      },
    });
  }
  
  async delete(id: string): Promise<boolean> {
    const incidents = await this.list();
    const filtered = incidents.filter(i => i.id !== id && i.ticketId !== id);
    
    if (filtered.length === incidents.length) return false;
    
    await this.store.set(this.fileName, filtered);
    return true;
  }
  
  // ==================== Status-based queries ====================
  
  async getOpen(): Promise<Incident[]> {
    return this.getByQuery({ status: 'new' });
  }
  
  async getActive(): Promise<Incident[]> {
    const statuses: IncidentStatus[] = ['confirmed', 'analyzing', 'containing', 'eradicating', 'recovering'];
    const incidents = await this.list();
    return incidents.filter(i => statuses.includes(i.workflow.status));
  }
  
  async getClosed(): Promise<Incident[]> {
    return this.getByQuery({ status: 'closed' });
  }
  
  async getCritical(): Promise<Incident[]> {
    return this.getByQuery({ severity: 'P0' });
  }
  
  // ==================== Summary ====================
  
  async getSummary(): Promise<{
    total: number;
    bySeverity: Record<IncidentSeverity, number>;
    byStatus: Record<IncidentStatus, number>;
    byCategory: Record<IncidentCategory, number>;
    slaBreached: number;
    avgResponseTime: number;
  }> {
    const incidents = await this.list();
    
    const bySeverity: Record<IncidentSeverity, number> = { P0: 0, P1: 0, P2: 0, P3: 0, P4: 0 };
    const byStatus: Record<IncidentStatus, number> = {
      new: 0,
      confirmed: 0,
      analyzing: 0,
      containing: 0,
      eradicating: 0,
      recovering: 0,
      closed: 0,
      reopened: 0,
      false_positive: 0,
    };
    const byCategory: Record<IncidentCategory, number> = {
      malware: 0,
      intrusion: 0,
      phishing: 0,
      ddos: 0,
      data_breach: 0,
      insider: 0,
      other: 0,
    };
    
    let slaBreached = 0;
    let totalResponseTime = 0;
    let respondedCount = 0;
    
    for (const incident of incidents) {
      bySeverity[incident.info.severity]++;
      byStatus[incident.workflow.status]++;
      byCategory[incident.info.category]++;
      
      if (incident.sla.responseBreached || incident.sla.resolutionBreached) {
        slaBreached++;
      }
      
      if (incident.timeline.acknowledgedAt && incident.timeline.detectedAt) {
        totalResponseTime += incident.timeline.acknowledgedAt - incident.timeline.detectedAt;
        respondedCount++;
      }
    }
    
    return {
      total: incidents.length,
      bySeverity,
      byStatus,
      byCategory,
      slaBreached,
      avgResponseTime: respondedCount > 0 ? totalResponseTime / respondedCount : 0,
    };
  }
}
