/**
 * Incidents Routes
 * RESTful API for security incident management
 * DB-003: 事件库 API
 */

import { Router, Request, Response, NextFunction } from 'express';
import { JsonStore } from '../../storage/json-store.js';
import { ApiError, ErrorCodes, successResponse, PaginatedResponse } from '../types.js';

// Type for request body to help TypeScript inference
interface IncidentRequestBody {
  title?: string;
  description?: string;
  category?: string;
  severity?: string;
  priority?: number;
  affectedAssets?: string[];
  affectedUsers?: number;
  dataTypes?: string[];
  businessImpact?: string;
  estimatedLoss?: number;
  attackVector?: string;
  threatActor?: string;
  mitreTechniques?: string[];
  iocs?: string[];
  assignee?: string;
  createdBy?: string;
  status?: string;
  updatedBy?: string | string[];
  action?: string;
  userId?: string | string[];
}

const router = Router();

// Initialize store
const jsonStore = new JsonStore('./data/storage');

// ==================== Types ====================

export interface Incident {
  id: string;
  ticketId: string;
  title: string;
  description: string;
  category: 'MALWARE' | 'INTRUSION' | 'PHISHING' | 'DDOS' | 'DATA_BREACH' | 'INSIDER' | 'OTHER';
  severity: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
  priority: number;
  
  // Timeline
  detectedAt?: number;
  reportedAt?: number;
  acknowledgedAt?: number;
  containingAt?: number;
  eradicatedAt?: number;
  recoveredAt?: number;
  closedAt?: number;
  
  // SLA
  responseDeadline?: number;
  resolutionDeadline?: number;
  responseBreached: boolean;
  resolutionBreached: boolean;
  
  // Status
  status: IncidentStatus;
  assignee?: string;
  previousStatus?: string;
  
  // Impact
  affectedAssets: string[];
  affectedUsers: number;
  dataTypes: string[];
  businessImpact?: string;
  estimatedLoss?: number;
  
  // Attack info
  attackVector?: string;
  threatActor?: string;
  mitreTechniques: string[];
  iocs: string[];
  
  // Post-mortem
  rootCause?: string;
  lessonsLearned: string[];
  recommendations: string[];
  postMortemCompleted: boolean;
  
  // Audit
  createdBy: string;
  createdAt: number;
  updatedBy: string;
  updatedAt: number;
}

export interface IncidentHandler {
  id: string;
  incidentId: string;
  userId: string;
  role: string;
  joinedAt: number;
  actions: string[];
}

export interface IncidentTimelineEvent {
  id: string;
  incidentId: string;
  timestamp: number;
  action: string;
  description?: string;
  userId?: string;
}

export type IncidentStatus = 
  | 'NEW' 
  | 'CONFIRMED' 
  | 'ANALYZING' 
  | 'CONTAINING' 
  | 'ERADICATING' 
  | 'RECOVERING' 
  | 'CLOSED' 
  | 'REOPENED' 
  | 'FALSE_POSITIVE';

// ==================== Valid Enums ====================

const IncidentCategories = ['MALWARE', 'INTRUSION', 'PHISHING', 'DDOS', 'DATA_BREACH', 'INSIDER', 'OTHER'] as const;
const IncidentSeverities = ['P0', 'P1', 'P2', 'P3', 'P4'] as const;
const IncidentStatuses = ['NEW', 'CONFIRMED', 'ANALYZING', 'CONTAINING', 'ERADICATING', 'RECOVERING', 'CLOSED', 'REOPENED', 'FALSE_POSITIVE'] as const;

// Valid status transitions
const StatusTransitions: Record<IncidentStatus, IncidentStatus[]> = {
  NEW: ['CONFIRMED', 'FALSE_POSITIVE'],
  CONFIRMED: ['ANALYZING', 'FALSE_POSITIVE'],
  ANALYZING: ['CONTAINING', 'CONFIRMED'],
  CONTAINING: ['ERADICATING', 'RECOVERING'],
  ERADICATING: ['RECOVERING'],
  RECOVERING: ['CLOSED'],
  CLOSED: ['REOPENED'],
  REOPENED: ['ANALYZING', 'FALSE_POSITIVE'],
  FALSE_POSITIVE: ['NEW'],
};

// ==================== Helpers ====================

async function getIncidentsStore() {
  const data = await jsonStore.get<Incident[]>('incidents.json');
  return data || [];
}

async function saveIncidentsStore(data: Incident[]) {
  await jsonStore.set('incidents.json', data);
}

async function getHandlersStore() {
  const data = await jsonStore.get<IncidentHandler[]>('incident-handlers.json');
  return data || [];
}

async function saveHandlersStore(data: IncidentHandler[]) {
  await jsonStore.set('incident-handlers.json', data);
}

async function getTimelineStore() {
  const data = await jsonStore.get<IncidentTimelineEvent[]>('incident-timeline.json');
  return data || [];
}

async function saveTimelineStore(data: IncidentTimelineEvent[]) {
  await jsonStore.set('incident-timeline.json', data);
}

function generateTicketId(): string {
  const year = new Date().getFullYear();
  return `INC-${year}-${String(Date.now()).slice(-6)}`;
}

function addTimelineEvent(incidentId: string, action: string, description?: string, userId?: string) {
  return {
    id: `timeline_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    incidentId,
    timestamp: Date.now(),
    action,
    description,
    userId,
  };
}

// ==================== Routes ====================

/**
 * GET /api/v1/incidents - List incidents
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      status,
      severity,
      category,
      assignee,
      page = '1',
      pageSize = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    let incidents = await getIncidentsStore();

    // Filters
    if (status) {
      incidents = incidents.filter(i => i.status === status);
    }
    if (severity) {
      incidents = incidents.filter(i => i.severity === severity);
    }
    if (category) {
      incidents = incidents.filter(i => i.category === category);
    }
    if (assignee) {
      incidents = incidents.filter(i => i.assignee === assignee);
    }

    // Sort
    incidents.sort((a, b) => {
      const aVal = a[sortBy as keyof Incident] as number;
      const bVal = b[sortBy as keyof Incident] as number;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    // Pagination
    const pageNum = parseInt(page as string, 10);
    const pageSizeNum = parseInt(pageSize as string, 10);
    const total = incidents.length;
    const totalPages = Math.ceil(total / pageSizeNum);
    const paginatedData = incidents.slice((pageNum - 1) * pageSizeNum, pageNum * pageSizeNum);

    const response: PaginatedResponse<Incident> = {
      data: paginatedData,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages,
      },
    };

    res.json(successResponse(response, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/incidents/enums - Get incident enum values
 */
router.get('/enums', (req: Request, res: Response) => {
  res.json(successResponse({
    categories: IncidentCategories,
    severities: IncidentSeverities,
    statuses: IncidentStatuses,
    statusTransitions: StatusTransitions,
  }, (req as any).requestId));
});

/**
 * GET /api/v1/incidents/stats - Get incident statistics
 */
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const incidents = await getIncidentsStore();

    const stats = {
      total: incidents.length,
      bySeverity: {
        P0: incidents.filter(i => i.severity === 'P0').length,
        P1: incidents.filter(i => i.severity === 'P1').length,
        P2: incidents.filter(i => i.severity === 'P2').length,
        P3: incidents.filter(i => i.severity === 'P3').length,
        P4: incidents.filter(i => i.severity === 'P4').length,
      },
      byStatus: {
        NEW: incidents.filter(i => i.status === 'NEW').length,
        CONFIRMED: incidents.filter(i => i.status === 'CONFIRMED').length,
        ANALYZING: incidents.filter(i => i.status === 'ANALYZING').length,
        CONTAINING: incidents.filter(i => i.status === 'CONTAINING').length,
        ERADICATING: incidents.filter(i => i.status === 'ERADICATING').length,
        RECOVERING: incidents.filter(i => i.status === 'RECOVERING').length,
        CLOSED: incidents.filter(i => i.status === 'CLOSED').length,
        REOPENED: incidents.filter(i => i.status === 'REOPENED').length,
        FALSE_POSITIVE: incidents.filter(i => i.status === 'FALSE_POSITIVE').length,
      },
      openIncidents: incidents.filter(i => !['CLOSED', 'FALSE_POSITIVE'].includes(i.status)).length,
      slaBreaches: {
        response: incidents.filter(i => i.responseBreached).length,
        resolution: incidents.filter(i => i.resolutionBreached).length,
      },
    };

    res.json(successResponse(stats, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/incidents/:id - Get incident by ID with timeline
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const incidents = await getIncidentsStore();
    const incident = incidents.find(i => i.id === id);

    if (!incident) {
      throw new ApiError(ErrorCodes.INCIDENT_NOT_FOUND, `Incident with id ${id} not found`, 404);
    }

    // Get handlers
    const handlers = await getHandlersStore();
    const incidentHandlers = handlers.filter(h => h.incidentId === id);

    // Get timeline
    const timeline = await getTimelineStore();
    const incidentTimeline = timeline.filter(t => t.incidentId === id).sort((a, b) => a.timestamp - b.timestamp);

    res.json(successResponse({
      ...incident,
      handlers: incidentHandlers,
      timeline: incidentTimeline,
    }, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/incidents - Create new incident
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;

    // Validate required fields
    if (!data.title) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, 'Title is required', 400);
    }
    if (!data.category) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, 'Category is required', 400);
    }
    if (!data.severity) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, 'Severity is required', 400);
    }

    // Validate enum values
    if (data.category && !IncidentCategories.includes(data.category as any)) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, `Invalid category`, 400);
    }
    if (data.severity && !IncidentSeverities.includes(data.severity as any)) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, `Invalid severity`, 400);
    }

    const now = Date.now();
    const incident: Incident = {
      id: `inc_${now}_${Math.random().toString(36).substring(2, 11)}`,
      ticketId: generateTicketId(),
      title: data.title,
      description: data.description || '',
      category: data.category,
      severity: data.severity,
      priority: data.priority || 50,
      detectedAt: data.detectedAt || now,
      reportedAt: data.reportedAt || now,
      responseBreached: false,
      resolutionBreached: false,
      status: 'NEW',
      affectedAssets: data.affectedAssets || [],
      affectedUsers: data.affectedUsers || 0,
      dataTypes: data.dataTypes || [],
      businessImpact: data.businessImpact,
      estimatedLoss: data.estimatedLoss,
      attackVector: data.attackVector,
      threatActor: data.threatActor,
      mitreTechniques: data.mitreTechniques || [],
      iocs: data.iocs || [],
      lessonsLearned: [],
      recommendations: [],
      postMortemCompleted: false,
      createdBy: data.createdBy || 'system',
      createdAt: now,
      updatedBy: data.createdBy || 'system',
      updatedAt: now,
    };

    const incidents = await getIncidentsStore();
    incidents.push(incident);
    await saveIncidentsStore(incidents);

    // Add initial timeline event
    const timeline = await getTimelineStore();
    timeline.push(addTimelineEvent(incident.id, 'INCIDENT_CREATED', 'Incident created', data.createdBy));
    await saveTimelineStore(timeline);

    // Add handler if provided
    if (data.assignee) {
      const handlers = await getHandlersStore();
      handlers.push({
        id: `handler_${now}_${Math.random().toString(36).substring(2, 11)}`,
        incidentId: incident.id,
        userId: data.assignee,
        role: 'handler',
        joinedAt: now,
        actions: ['Assigned to incident'],
      });
      await saveHandlersStore(handlers);
    }

    res.status(201).json(successResponse(incident, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/v1/incidents/:id - Update incident status
 */
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const incidentId = Array.isArray(id) ? id[0] : id;
    const patches = req.body;

    const incidents = await getIncidentsStore();
    const index = incidents.findIndex(i => i.id === incidentId);

    if (index === -1) {
      throw new ApiError(ErrorCodes.INCIDENT_NOT_FOUND, `Incident with id ${incidentId} not found`, 404);
    }

    const current = incidents[index];
    const newStatus = patches.status;

    // Validate status transition
    if (newStatus && newStatus !== current.status) {
      if (!StatusTransitions[current.status]?.includes(newStatus)) {
        throw new ApiError(
          ErrorCodes.INVALID_STATUS_TRANSITION,
          `Cannot transition from ${current.status} to ${newStatus}. Valid transitions: ${StatusTransitions[current.status]?.join(', ')}`,
          400
        );
      }

      // Update timeline timestamps
      const timeline = await getTimelineStore();
      const timestampField = `${newStatus.toLowerCase()}At` as keyof Incident;
      if (timestampField in current) {
        patches[timestampField] = Date.now();
      }
      
      // Add timeline event
      const updatedByVal = patches.updatedBy;
      const updatedByStr = Array.isArray(updatedByVal) ? updatedByVal[0] : (updatedByVal as string | undefined);
      timeline.push(addTimelineEvent(incidentId, 'STATUS_CHANGED', `Status changed from ${current.status} to ${newStatus}`, updatedByStr));
      await saveTimelineStore(timeline);
    }

    const updated: Incident = {
      ...current,
      ...patches,
      id: current.id,
      ticketId: current.ticketId,
      createdAt: current.createdAt,
      previousStatus: patches.status ? current.status : current.previousStatus,
      updatedAt: Date.now(),
    };

    incidents[index] = updated;
    await saveIncidentsStore(incidents);

    res.json(successResponse(updated, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/incidents/:id/timeline - Add timeline event
 */
router.post('/:id/timeline', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const incidentId = Array.isArray(id) ? id[0] : id;
    const { action, description } = req.body;
    const userId = typeof req.body.userId === 'string' ? req.body.userId : undefined;

    if (!action) {
      throw new ApiError(ErrorCodes.VALIDATION_ERROR, 'Action is required', 400);
    }

    const incidents = await getIncidentsStore();
    const incident = incidents.find(i => i.id === incidentId);

    if (!incident) {
      throw new ApiError(ErrorCodes.INCIDENT_NOT_FOUND, `Incident with id ${incidentId} not found`, 404);
    }

    const timeline = await getTimelineStore();
    const userIdVal = req.body.userId;
    const userIdStr = Array.isArray(userIdVal) ? userIdVal[0] : (userIdVal as string | undefined);
    const event = addTimelineEvent(incidentId, action, description, userIdStr);
    timeline.push(event);
    await saveTimelineStore(timeline);

    // Update incident updatedAt
    incident.updatedAt = Date.now();
    await saveIncidentsStore(incidents);

    res.status(201).json(successResponse(event, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/incidents/:id - Delete incident
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    let incidents = await getIncidentsStore();
    const index = incidents.findIndex(i => i.id === id);

    if (index === -1) {
      throw new ApiError(ErrorCodes.INCIDENT_NOT_FOUND, `Incident with id ${id} not found`, 404);
    }

    incidents = incidents.filter(i => i.id !== id);
    await saveIncidentsStore(incidents);

    // Also delete related handlers and timeline
    let handlers = await getHandlersStore();
    handlers = handlers.filter(h => h.incidentId !== id);
    await saveHandlersStore(handlers);

    let timeline = await getTimelineStore();
    timeline = timeline.filter(t => t.incidentId !== id);
    await saveTimelineStore(timeline);

    res.json(successResponse({ deleted: true, id }, (req as any).requestId));
  } catch (error) {
    next(error);
  }
});

export { router as incidentsRouter };
