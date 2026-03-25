/**
 * Incidents Service
 * 安全事件业务逻辑层
 */

import type {
  SecurityIncident,
  IncidentQueryParams,
  CreateIncidentRequest,
  UpdateIncidentRequest,
  IncidentTimelineUpdate,
  IncidentStatus,
} from './types.js';
import { IncidentsRepository } from './repository.js';
import type { DomainId } from '../capabilities/types.js';

const logger = {
  info: (...args: any[]) => console.log('[IncidentsService]', ...args),
  error: (...args: any[]) => console.error('[IncidentsService]', ...args),
};

// 状态流转映射
const STATUS_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  detected: ['reported', 'acknowledged', 'closed'],
  reported: ['acknowledged', 'investigating'],
  acknowledged: ['investigating', 'containing'],
  investigating: ['containing', 'eradicating'],
  containing: ['eradicating'],
  eradicating: ['recovering'],
  recovering: ['closed'],
  closed: ['reopened'],
  reopened: ['investigating', 'containing'],
};

export class IncidentsService {
  constructor(private repo: IncidentsRepository) {}

  // ==================== CRUD ====================

  async list(params: IncidentQueryParams = {}): Promise<SecurityIncident[]> {
    return this.repo.query(params);
  }

  async get(id: string): Promise<SecurityIncident | null> {
    return this.repo.getById(id);
  }

  async getByTicketId(ticketId: string): Promise<SecurityIncident | null> {
    return this.repo.getByTicketId(ticketId);
  }

  async create(data: CreateIncidentRequest, createdBy?: string): Promise<SecurityIncident> {
    const ticketId = await this.repo.getNextTicketId();
    const now = Date.now();

    const incident: SecurityIncident = {
      id: `incident_${now}_${Math.random().toString(36).substr(2, 9)}`,
      ticketId,
      domainId: data.domainId || 'security',
      info: {
        title: data.title,
        description: data.description,
        category: data.category,
        severity: data.severity,
        priority: this.severityToPriority(data.severity),
        source: data.source || 'manual',
      },
      timeline: {
        detectedAt: now,
        reportedAt: now,
      },
      sla: {
        responseDeadline: now + this.getResponseSLA(data.severity) * 60 * 1000,
        resolutionDeadline: now + this.getResolutionSLA(data.severity) * 60 * 1000,
      },
      workflow: {
        status: 'detected',
        previousStatus: undefined,
      },
      impact: {
        affectedAssets: data.affectedAssets || [],
        affectedUsers: data.affectedUsers || 0,
        dataTypes: data.dataTypes || [],
        businessImpact: data.businessImpact || '',
      },
      attack: data.attackVector ? {
        attackVector: data.attackVector,
        mitreTechniques: data.mitreTechniques || [],
      } : undefined,
      handlers: [],
      createdAt: now,
      updatedAt: now,
    };

    await this.repo.create(incident);
    logger.info(`Created incident: ${incident.ticketId} - ${incident.info.title}`);
    
    return incident;
  }

  async update(id: string, data: UpdateIncidentRequest): Promise<SecurityIncident> {
    const existing = await this.repo.getById(id);
    if (!existing) {
      throw new Error(`Incident not found: ${id}`);
    }

    const updates: Partial<SecurityIncident> = {
      updatedAt: Date.now(),
    };

    // Update info
    if (data.title || data.description || data.category || data.severity) {
      updates.info = {
        ...existing.info,
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.category && { category: data.category }),
        ...(data.severity && { 
          severity: data.severity,
          priority: this.severityToPriority(data.severity),
        }),
      };
    }

    // Update workflow
    if (data.assignee || data.assigneeRole || data.resolution || data.resolver) {
      updates.workflow = {
        ...existing.workflow,
        ...(data.assignee && { assignee: data.assignee }),
        ...(data.assigneeRole && { assigneeRole: data.assigneeRole }),
        ...(data.resolution && { resolution: data.resolution }),
        ...(data.resolver && { resolver: data.resolver }),
      };
    }

    const updated = await this.repo.update(id, updates);
    logger.info(`Updated incident: ${existing.ticketId}`);
    
    return updated!;
  }

  async delete(id: string): Promise<boolean> {
    return this.repo.delete(id);
  }

  // ==================== Status Workflow ====================

  async updateStatus(
    id: string, 
    newStatus: IncidentStatus, 
    actor?: string,
    note?: string
  ): Promise<SecurityIncident> {
    const incident = await this.repo.getById(id);
    if (!incident) {
      throw new Error(`Incident not found: ${id}`);
    }

    const currentStatus = incident.workflow.status;
    
    // Validate status transition
    const allowed = STATUS_TRANSITIONS[currentStatus];
    if (!allowed.includes(newStatus)) {
      throw new Error(`Invalid status transition: ${currentStatus} -> ${newStatus}`);
    }

    const now = Date.now();
    const timelineUpdates: Partial<SecurityIncident['timeline']> = {};
    
    // Update timeline based on new status
    switch (newStatus) {
      case 'acknowledged':
        timelineUpdates.acknowledgedAt = now;
        break;
      case 'containing':
        timelineUpdates.containingAt = now;
        break;
      case 'eradicating':
        timelineUpdates.eradicatedAt = now;
        break;
      case 'recovering':
        timelineUpdates.recoveredAt = now;
        break;
      case 'closed':
        timelineUpdates.closedAt = now;
        
        // Calculate SLA
        const responseTime = incident.timeline.acknowledgedAt 
          ? (incident.timeline.acknowledgedAt - (incident.timeline.detectedAt || now))
          : 0;
        const resolutionTime = now - (incident.timeline.detectedAt || now);
        
        incident.sla.responseBreached = responseTime > (incident.sla.responseDeadline || 0) - (incident.timeline.detectedAt || now);
        incident.sla.resolutionBreached = resolutionTime > ((incident.sla.resolutionDeadline || 0) - (incident.timeline.detectedAt || now));
        incident.sla.responseTimeMinutes = Math.round(responseTime / 60000);
        incident.sla.resolutionTimeMinutes = Math.round(resolutionTime / 60000);
        break;
      case 'reopened':
        timelineUpdates.reopenedAt = now;
        break;
    }

    const updated = await this.repo.update(id, {
      workflow: {
        ...incident.workflow,
        status: newStatus,
        previousStatus: currentStatus,
      },
      timeline: {
        ...incident.timeline,
        ...timelineUpdates,
      },
      updatedAt: now,
    });

    // Add handler note if provided
    if (actor && note) {
      incident.handlers.push({
        user: actor,
        role: 'Analyst',
        joinedAt: now,
        actions: [`Status changed to ${newStatus}`],
        notes: note,
      });
      await this.repo.update(id, { handlers: incident.handlers });
    }

    logger.info(`Incident ${incident.ticketId} status: ${currentStatus} -> ${newStatus}`);
    return updated!;
  }

  // ==================== Stats ====================

  async getStats() {
    return this.repo.getStats();
  }

  // ==================== Helpers ====================

  private severityToPriority(severity: string): number {
    const map: Record<string, number> = {
      'P0': 1,
      'P1': 2,
      'P2': 3,
      'P3': 4,
      'P4': 5,
    };
    return map[severity] || 3;
  }

  private getResponseSLA(severity: string): number {
    // Response SLA in minutes
    const map: Record<string, number> = {
      'P0': 15,   // 15 minutes
      'P1': 30,   // 30 minutes
      'P2': 60,   // 1 hour
      'P3': 240,  // 4 hours
      'P4': 1440, // 24 hours
    };
    return map[severity] || 240;
  }

  private getResolutionSLA(severity: string): number {
    // Resolution SLA in minutes
    const map: Record<string, number> = {
      'P0': 240,   // 4 hours
      'P1': 1440,  // 24 hours
      'P2': 4320,  // 3 days
      'P3': 10080, // 7 days
      'P4': 43200, // 30 days
    };
    return map[severity] || 10080;
  }
}
