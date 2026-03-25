/**
 * Incidents Repository
 * 安全事件数据访问层
 */

import type { JsonStore } from '../storage/json-store.js';
import type { 
  SecurityIncident, 
  IncidentQueryParams,
  IncidentStatus,
  IncidentSeverity,
  IncidentCategory
} from './types.js';

const FILE_NAME = 'incidents.json';

export class IncidentsRepository {
  constructor(private store: JsonStore) {}

  async getAll(): Promise<SecurityIncident[]> {
    return this.store.get<SecurityIncident[]>(FILE_NAME) || [];
  }

  async getById(id: string): Promise<SecurityIncident | null> {
    const incidents = await this.getAll();
    return incidents.find(i => i.id === id) || null;
  }

  async getByTicketId(ticketId: string): Promise<SecurityIncident | null> {
    const incidents = await this.getAll();
    return incidents.find(i => i.ticketId === ticketId) || null;
  }

  async query(params: IncidentQueryParams): Promise<SecurityIncident[]> {
    let incidents = await this.getAll();

    if (params.status) {
      incidents = incidents.filter(i => i.workflow.status === params.status);
    }
    if (params.severity) {
      incidents = incidents.filter(i => i.info.severity === params.severity);
    }
    if (params.category) {
      incidents = incidents.filter(i => i.info.category === params.category);
    }
    if (params.assignee) {
      incidents = incidents.filter(i => i.workflow.assignee === params.assignee);
    }
    if (params.domainId) {
      incidents = incidents.filter(i => i.domainId === params.domainId);
    }
    if (params.fromDate) {
      incidents = incidents.filter(i => i.timeline.detectedAt && i.timeline.detectedAt >= params.fromDate!);
    }
    if (params.toDate) {
      incidents = incidents.filter(i => i.timeline.detectedAt && i.timeline.detectedAt <= params.toDate!);
    }

    // Sort by detectedAt descending
    incidents.sort((a, b) => (b.timeline.detectedAt || 0) - (a.timeline.detectedAt || 0));

    // Pagination
    if (params.page !== undefined && params.pageSize) {
      const start = (params.page - 1) * params.pageSize;
      incidents = incidents.slice(start, start + params.pageSize);
    }

    return incidents;
  }

  async create(incident: SecurityIncident): Promise<SecurityIncident> {
    const incidents = await this.getAll();
    incidents.push(incident);
    await this.store.set(FILE_NAME, incidents);
    return incident;
  }

  async update(id: string, updates: Partial<SecurityIncident>): Promise<SecurityIncident | null> {
    const incidents = await this.getAll();
    const index = incidents.findIndex(i => i.id === id);
    if (index === -1) return null;

    incidents[index] = { ...incidents[index], ...updates, updatedAt: Date.now() };
    await this.store.set(FILE_NAME, incidents);
    return incidents[index];
  }

  async delete(id: string): Promise<boolean> {
    const incidents = await this.getAll();
    const index = incidents.findIndex(i => i.id === id);
    if (index === -1) return false;

    incidents.splice(index, 1);
    await this.store.set(FILE_NAME, incidents);
    return true;
  }

  async count(params: IncidentQueryParams = {}): Promise<number> {
    const incidents = await this.query({ ...params, page: undefined, pageSize: undefined });
    return incidents.length;
  }

  async getStats(): Promise<{
    total: number;
    open: number;
    closed: number;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
    avgResponseTime: number;
    avgResolutionTime: number;
  }> {
    const incidents = await this.getAll();
    
    const bySeverity: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let totalResponseTime = 0;
    let totalResolutionTime = 0;
    let responseCount = 0;
    let resolutionCount = 0;

    for (const incident of incidents) {
      const sev = incident.info.severity;
      const status = incident.workflow.status;
      
      bySeverity[sev] = (bySeverity[sev] || 0) + 1;
      byStatus[status] = (byStatus[status] || 0) + 1;

      // Calculate response time
      if (incident.timeline.acknowledgedAt && incident.timeline.detectedAt) {
        totalResponseTime += (incident.timeline.acknowledgedAt - incident.timeline.detectedAt);
        responseCount++;
      }

      // Calculate resolution time
      if (incident.timeline.closedAt && incident.timeline.detectedAt) {
        totalResolutionTime += (incident.timeline.closedAt - incident.timeline.detectedAt);
        resolutionCount++;
      }
    }

    return {
      total: incidents.length,
      open: incidents.filter(i => !['closed'].includes(i.workflow.status)).length,
      closed: incidents.filter(i => i.workflow.status === 'closed').length,
      bySeverity,
      byStatus,
      avgResponseTime: responseCount > 0 ? Math.round(totalResponseTime / responseCount / 60000) : 0,
      avgResolutionTime: resolutionCount > 0 ? Math.round(totalResolutionTime / resolutionCount / 60000) : 0,
    };
  }

  async getNextTicketId(): Promise<string> {
    const incidents = await this.getAll();
    const year = new Date().getFullYear();
    const prefix = `INC-${year}-`;
    
    const existingIds = incidents
      .map(i => i.ticketId)
      .filter(t => t.startsWith(prefix))
      .map(t => parseInt(t.replace(prefix, ''), 10))
      .filter(n => !isNaN(n));
    
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    const nextNum = String(maxId + 1).padStart(3, '0');
    
    return `${prefix}${nextNum}`;
  }
}
