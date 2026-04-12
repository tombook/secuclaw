import type { RouterDeps } from '../router.js';

type IncidentStatus = 'NEW' | 'CONFIRMED' | 'ANALYZING' | 'CONTAINING' | 'ERADICATING' | 'RECOVERING' | 'CLOSED' | 'REOPENED' | 'FALSE_POSITIVE';

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

export function registerIncidentsCrudRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  deps: RouterDeps
): void {

  async function getStore(key: string): Promise<any[]> {
    const data = await deps.jsonStore.get(key);
    return (data as any[]) || [];
  }

  async function saveStore(key: string, data: any[]): Promise<void> {
    await deps.jsonStore.set(key, data);
  }

  handlers.set('incidents.list', async (params) => {
    let incidents = await getStore('incidents.json');
    if (params.status) incidents = incidents.filter((i: any) => i.status === params.status);
    if (params.severity) incidents = incidents.filter((i: any) => i.severity === params.severity);
    if (params.category) incidents = incidents.filter((i: any) => i.category === params.category);
    if (params.assignee) incidents = incidents.filter((i: any) => i.assignee === params.assignee);

    const sortBy = (params.sortBy as string) || 'createdAt';
    const sortOrder = (params.sortOrder as string) || 'desc';
    incidents.sort((a: any, b: any) => {
      const aVal = a[sortBy], bVal = b[sortBy];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    const page = Number(params.page) || 1;
    const pageSize = Number(params.pageSize) || 20;
    const total = incidents.length;
    const paginated = incidents.slice((page - 1) * pageSize, page * pageSize);
    return { data: paginated, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  });

  handlers.set('incidents.get', async (params) => {
    const { id } = params;
    if (!id) throw new Error('Missing required parameter: id');
    const incidents = await getStore('incidents.json');
    const incident = incidents.find((i: any) => i.id === id);
    if (!incident) throw new Error(`Incident with id ${id} not found`);
    const allHandlers = await getStore('incident-handlers.json');
    const allTimeline = await getStore('incident-timeline.json');
    return {
      ...incident,
      handlers: allHandlers.filter((h: any) => h.incidentId === id),
      timeline: allTimeline.filter((t: any) => t.incidentId === id).sort((a: any, b: any) => a.timestamp - b.timestamp),
    };
  });

  handlers.set('incidents.create', async (params) => {
    const data = params as Record<string, unknown>;
    if (!data.title) throw new Error('Title is required');
    if (!data.category) throw new Error('Category is required');
    if (!data.severity) throw new Error('Severity is required');

    const now = Date.now();
    const incident = {
      id: `inc_${now}_${Math.random().toString(36).substring(2, 11)}`,
      ticketId: `INC-${new Date().getFullYear()}-${String(now).slice(-6)}`,
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

    const incidents = await getStore('incidents.json');
    incidents.push(incident);
    await saveStore('incidents.json', incidents);

    const timeline = await getStore('incident-timeline.json');
    timeline.push({
      id: `timeline_${now}_${Math.random().toString(36).substring(2, 11)}`,
      incidentId: incident.id,
      timestamp: now,
      action: 'INCIDENT_CREATED',
      description: 'Incident created',
      userId: data.createdBy,
    });
    await saveStore('incident-timeline.json', timeline);

    if (data.assignee) {
      const ih = await getStore('incident-handlers.json');
      ih.push({
        id: `handler_${now}_${Math.random().toString(36).substring(2, 11)}`,
        incidentId: incident.id,
        userId: data.assignee,
        role: 'handler',
        joinedAt: now,
        actions: ['Assigned to incident'],
      });
      await saveStore('incident-handlers.json', ih);
    }

    return incident;
  });

  handlers.set('incidents.update', async (params) => {
    const { id, ...patches } = params;
    if (!id) throw new Error('Missing required parameter: id');
    const incidents = await getStore('incidents.json');
    const index = incidents.findIndex((i: any) => i.id === id);
    if (index === -1) throw new Error(`Incident with id ${id} not found`);

    const current = incidents[index];
    const newStatus = patches.status as IncidentStatus | undefined;

    if (newStatus && newStatus !== current.status) {
      if (!StatusTransitions[current.status as IncidentStatus]?.includes(newStatus)) {
        throw new Error(`Cannot transition from ${current.status} to ${newStatus}`);
      }
      const timeline = await getStore('incident-timeline.json');
      timeline.push({
        id: `timeline_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        incidentId: id,
        timestamp: Date.now(),
        action: 'STATUS_CHANGED',
        description: `Status changed from ${current.status} to ${newStatus}`,
        userId: patches.updatedBy as string | undefined,
      });
      await saveStore('incident-timeline.json', timeline);
    }

    incidents[index] = { ...current, ...patches, id: current.id, ticketId: current.ticketId, createdAt: current.createdAt, updatedAt: Date.now() };
    await saveStore('incidents.json', incidents);
    return incidents[index];
  });

  handlers.set('incidents.delete', async (params) => {
    const { id } = params;
    if (!id) throw new Error('Missing required parameter: id');
    let incidents = await getStore('incidents.json');
    if (!incidents.find((i: any) => i.id === id)) throw new Error(`Incident with id ${id} not found`);
    incidents = incidents.filter((i: any) => i.id !== id);
    await saveStore('incidents.json', incidents);
    let ih = await getStore('incident-handlers.json');
    ih = ih.filter((h: any) => h.incidentId !== id);
    await saveStore('incident-handlers.json', ih);
    let tl = await getStore('incident-timeline.json');
    tl = tl.filter((t: any) => t.incidentId !== id);
    await saveStore('incident-timeline.json', tl);
    return { deleted: true, id };
  });

  handlers.set('incidents.stats', async () => {
    const incidents = await getStore('incidents.json');
    return {
      total: incidents.length,
      bySeverity: { P0: 0, P1: 0, P2: 0, P3: 0, P4: 0, ...Object.fromEntries(['P0','P1','P2','P3','P4'].map(s => [s, incidents.filter((i: any) => i.severity === s).length])) },
      byStatus: Object.fromEntries(['NEW','CONFIRMED','ANALYZING','CONTAINING','ERADICATING','RECOVERING','CLOSED','REOPENED','FALSE_POSITIVE'].map(s => [s, incidents.filter((i: any) => i.status === s).length])),
      openIncidents: incidents.filter((i: any) => !['CLOSED', 'FALSE_POSITIVE'].includes(i.status)).length,
      slaBreaches: {
        response: incidents.filter((i: any) => i.responseBreached).length,
        resolution: incidents.filter((i: any) => i.resolutionBreached).length,
      },
    };
  });

  handlers.set('incidents.enums', async () => ({
    categories: ['MALWARE', 'INTRUSION', 'PHISHING', 'DDOS', 'DATA_BREACH', 'INSIDER', 'OTHER'],
    severities: ['P0', 'P1', 'P2', 'P3', 'P4'],
    statuses: ['NEW', 'CONFIRMED', 'ANALYZING', 'CONTAINING', 'ERADICATING', 'RECOVERING', 'CLOSED', 'REOPENED', 'FALSE_POSITIVE'],
    statusTransitions: StatusTransitions,
  }));

  // --- Merged from incidents-routes.ts (unique methods) ---

  handlers.set('incidents.getByTicketId', async (params) => {
    const { ticketId } = params;
    if (!ticketId) throw new Error('Missing required parameter: ticketId');
    const incidents = await getStore('incidents.json');
    return incidents.find((i: any) => i.ticketId === ticketId) || null;
  });

  handlers.set('incidents.updateStatus', async (params) => {
    const { id, status, actor, note } = params;
    if (!id || !status) throw new Error('Missing required parameters: id, status');
    return handlers.get('incidents.update')!({ id, status, updatedBy: actor || 'system', ...(note ? { note } : {}) });
  });

  handlers.set('incidents.escalate', async (params) => {
    const { id, level, reason } = params;
    if (!id || !level) throw new Error('Missing required parameters: id, level');
    const incidents = await getStore('incidents.json');
    const incident = incidents.find((i: any) => i.id === id);
    if (!incident) throw new Error(`Incident with id ${id} not found`);
    const escalatedSeverity = level === 'ciso' ? 'P0' : level === 'director' ? 'P1' : 'P2';
    const timeline = await getStore('incident-timeline.json');
    timeline.push({
      id: `timeline_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      incidentId: id as string,
      timestamp: Date.now(),
      action: 'ESCALATED',
      description: `Escalated to ${level}. Reason: ${reason || 'N/A'}`,
      userId: 'system',
    });
    await saveStore('incident-timeline.json', timeline);
    return handlers.get('incidents.update')!({ id, severity: escalatedSeverity, escalationLevel: level, escalationReason: reason, updatedBy: 'system' });
  });

  handlers.set('incidents.linkedResources', async (params) => {
    const { incidentId } = params;
    if (!incidentId) throw new Error('Missing required parameter: incidentId');
    const incident = await handlers.get('incidents.get')!({ id: incidentId });
    return {
      assets: (incident as any)?.affectedAssets || [],
      timeline: (incident as any)?.timeline || [],
      handlers_list: (incident as any)?.handlers || [],
    };
  });
}
