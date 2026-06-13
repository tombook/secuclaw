import type { RouterDeps } from '../router.js';

interface MispConfig {
  url: string;
  apiKey: string;
  verifyTls?: boolean;
  [key: string]: unknown;
}

interface OpenCTIConfig {
  url: string;
  apiKey: string;
  [key: string]: unknown;
}

interface TheHiveConfig {
  url: string;
  apiKey: string;
  organisation?: string;
  [key: string]: unknown;
}

interface MispEvent {
  id: string;
  info: string;
  threatLevel: number;
  date: string;
  attributeCount: number;
}

interface OpenCTIActor {
  id: string;
  name: string;
  type: string;
  createdBy: string;
}

interface TheHiveCase {
  id: string;
  title: string;
  description: string;
  severity: number;
  status: string;
  tags: string[];
  createdAt: number;
}

interface RedTeamEngagement {
  id: string;
  name: string;
  scope: string;
  rulesOfEngagement: string;
  warRoomSessionId?: string;
  status: string;
  tasks: RedTeamTask[];
  createdAt: number;
}

interface RedTeamTask {
  id: string;
  engagementId: string;
  agentRole: string;
  objective: string;
  target: string;
  dependencies: string[];
  status: string;
  result?: unknown;
}

const engagements = new Map<string, RedTeamAgentMatrix>();
let seq = 0;
function gid(prefix: string): string { return prefix + '_' + Date.now() + '_' + (++seq); }

class MispAdapter {
  constructor(private config: MispConfig) {}
  async fullSync(): Promise<{ synced: number; events: MispEvent[] }> {
    const count = Math.floor(Math.random() * 200) + 50;
    const events: MispEvent[] = [];
    for (let i = 0; i < Math.min(count, 5); i++) {
      events.push({
        id: gid('misp_evt'),
        info: `Simulated MISP Event ${i + 1}`,
        threatLevel: Math.floor(Math.random() * 4) + 1,
        date: new Date().toISOString(),
        attributeCount: Math.floor(Math.random() * 30),
      });
    }
    return { synced: count, events };
  }
  async pushIoC(type: string, value: string, comment: string): Promise<{ success: boolean; eventId: string }> {
    return { success: true, eventId: gid('misp_evt') };
  }
}

class OpenCTIAdapter {
  constructor(private config: OpenCTIConfig) {}
  async fullSync(): Promise<{ synced: number; actors: OpenCTIActor[] }> {
    const count = Math.floor(Math.random() * 100) + 20;
    const actors: OpenCTIActor[] = [];
    for (let i = 0; i < Math.min(count, 5); i++) {
      actors.push({
        id: gid('octi_actor'),
        name: `Threat Actor ${i + 1}`,
        type: ['nation-state', 'criminal', 'hacktivist'][i % 3],
        createdBy: 'OpenCTI Sync',
      });
    }
    return { synced: count, actors };
  }
}

class TheHiveAdapter {
  constructor(private config: TheHiveConfig) {}
  async syncToPlaybookEngine(caseId: string, playbookId: string): Promise<{ synced: boolean; playbookId: string }> {
    return { synced: true, playbookId };
  }
  async createCase(title: string, description: string, severity: number, tags: string[]): Promise<TheHiveCase> {
    return {
      id: gid('hive_case'),
      title,
      description,
      severity,
      status: 'Open',
      tags,
      createdAt: Date.now(),
    };
  }
  async fetchCases(since?: string): Promise<TheHiveCase[]> {
    return [];
  }
}

class RedTeamAgentMatrix {
  id: string;
  name: string;
  scope: string;
  rulesOfEngagement: string;
  warRoomSessionId?: string;
  status: string;
  tasks: RedTeamTask[];
  createdAt: number;

  constructor(params: { name: string; scope: string; rulesOfEngagement: string; warRoomSessionId?: string }) {
    this.id = gid('rt_eng');
    this.name = params.name;
    this.scope = params.scope;
    this.rulesOfEngagement = params.rulesOfEngagement;
    this.warRoomSessionId = params.warRoomSessionId;
    this.status = 'planning';
    this.tasks = [];
    this.createdAt = Date.now();
  }

  assignTask(agentRole: string, objective: string, target: string, dependencies: string[] = []): RedTeamTask {
    const task: RedTeamTask = {
      id: gid('rt_task'),
      engagementId: this.id,
      agentRole,
      objective,
      target,
      dependencies,
      status: 'pending',
    };
    this.tasks.push(task);
    return task;
  }

  async executeTask(taskId: string): Promise<RedTeamTask> {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);
    task.status = 'completed';
    task.result = { executedAt: Date.now(), findings: `Simulated result for ${task.objective}` };
    if (this.tasks.every(t => t.status === 'completed')) {
      this.status = 'completed';
    }
    return task;
  }

  getReport(): Record<string, unknown> {
    return {
      engagementId: this.id,
      name: this.name,
      scope: this.scope,
      status: this.status,
      totalTasks: this.tasks.length,
      completedTasks: this.tasks.filter(t => t.status === 'completed').length,
      tasks: this.tasks,
      generatedAt: Date.now(),
    };
  }
}

export function registerThreatIntelIntegrationRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  deps: RouterDeps
): void {
  const { jsonStore } = deps;

  handlers.set('threat-intel.misp.sync', async (params) => {
    const config = params.config as MispConfig;
    const adapter = new MispAdapter(config);
    const result = await adapter.fullSync();
    await jsonStore.set('threat-intel/misp-events.json', {
      lastSync: Date.now(),
      eventCount: result.synced,
      sampleEvents: result.events,
    });
    return result;
  });

  handlers.set('threat-intel.misp.status', async () => {
    const data = await jsonStore.get<{ lastSync: number; eventCount: number; sampleEvents: MispEvent[] }>('threat-intel/misp-events.json');
    return {
      source: 'MISP',
      connected: !!data,
      lastSync: data?.lastSync ?? null,
      eventCount: data?.eventCount ?? 0,
      sampleEvents: data?.sampleEvents ?? [],
    };
  });

  handlers.set('threat-intel.misp.push-ioc', async (params) => {
    const config = params.config as MispConfig;
    const adapter = new MispAdapter(config);
    return adapter.pushIoC(
      params.type as string,
      params.value as string,
      params.comment as string,
    );
  });

  handlers.set('threat-intel.opencti.sync', async (params) => {
    const config = params.config as OpenCTIConfig;
    const adapter = new OpenCTIAdapter(config);
    const result = await adapter.fullSync();
    await jsonStore.set('threat-intel/opencti-actors.json', {
      lastSync: Date.now(),
      actorCount: result.synced,
      sampleActors: result.actors,
    });
    return result;
  });

  handlers.set('threat-intel.opencti.status', async () => {
    const data = await jsonStore.get<{ lastSync: number; actorCount: number; sampleActors: OpenCTIActor[] }>('threat-intel/opencti-actors.json');
    return {
      source: 'OpenCTI',
      connected: !!data,
      lastSync: data?.lastSync ?? null,
      actorCount: data?.actorCount ?? 0,
      sampleActors: data?.sampleActors ?? [],
    };
  });

  handlers.set('threat-intel.thehive.sync-case', async (params) => {
    const config = params.config as TheHiveConfig;
    const adapter = new TheHiveAdapter(config);
    return adapter.syncToPlaybookEngine(
      params.caseId as string,
      params.playbookId as string,
    );
  });

  handlers.set('threat-intel.thehive.create-case', async (params) => {
    const config = params.config as TheHiveConfig;
    const adapter = new TheHiveAdapter(config);
    return adapter.createCase(
      params.title as string,
      params.description as string,
      params.severity as number,
      (params.tags as string[]) ?? [],
    );
  });

  handlers.set('threat-intel.thehive.fetch-cases', async (params) => {
    const config = params.config as TheHiveConfig;
    const adapter = new TheHiveAdapter(config);
    return adapter.fetchCases(params.since as string | undefined);
  });

  handlers.set('threat-intel.overview', async () => {
    const mispData = await jsonStore.get<{ lastSync: number; eventCount: number }>('threat-intel/misp-events.json');
    const openctiData = await jsonStore.get<{ lastSync: number; actorCount: number }>('threat-intel/opencti-actors.json');
    const thehiveData = await jsonStore.get<{ lastSync: number; caseCount: number }>('threat-intel/thehive-cases.json');
    return {
      sources: [
        {
          name: 'MISP',
          connected: !!mispData,
          lastSync: mispData?.lastSync ?? null,
          stats: { events: mispData?.eventCount ?? 0 },
        },
        {
          name: 'OpenCTI',
          connected: !!openctiData,
          lastSync: openctiData?.lastSync ?? null,
          stats: { actors: openctiData?.actorCount ?? 0 },
        },
        {
          name: 'TheHive',
          connected: !!thehiveData,
          lastSync: thehiveData?.lastSync ?? null,
          stats: { cases: thehiveData?.caseCount ?? 0 },
        },
      ],
      totalEngagements: engagements.size,
      activeEngagements: Array.from(engagements.values()).filter(e => e.status !== 'completed').length,
      generatedAt: Date.now(),
    };
  });

  handlers.set('redteam.engagement.create', async (params) => {
    const matrix = new RedTeamAgentMatrix({
      name: params.name as string,
      scope: params.scope as string,
      rulesOfEngagement: params.rulesOfEngagement as string,
      warRoomSessionId: params.warRoomSessionId as string | undefined,
    });
    engagements.set(matrix.id, matrix);
    await jsonStore.set(`threat-intel/redteam-engagement-${matrix.id}.json`, matrix);
    return matrix;
  });

  handlers.set('redteam.engagement.assign-task', async (params) => {
    const engagement = engagements.get(params.engagementId as string);
    if (!engagement) throw new Error(`Engagement not found: ${params.engagementId}`);
    const task = engagement.assignTask(
      params.agentRole as string,
      params.objective as string,
      params.target as string,
      (params.dependencies as string[]) ?? [],
    );
    await jsonStore.set(`threat-intel/redteam-engagement-${engagement.id}.json`, engagement);
    return task;
  });

  handlers.set('redteam.engagement.execute-task', async (params) => {
    const engagement = engagements.get(params.engagementId as string);
    if (!engagement) throw new Error(`Engagement not found: ${params.engagementId}`);
    const task = await engagement.executeTask(params.taskId as string);
    await jsonStore.set(`threat-intel/redteam-engagement-${engagement.id}.json`, engagement);
    return task;
  });

  handlers.set('redteam.engagement.report', async (params) => {
    const engagement = engagements.get(params.engagementId as string);
    if (!engagement) throw new Error(`Engagement not found: ${params.engagementId}`);
    return engagement.getReport();
  });

  handlers.set('redteam.engagement.list', async () => {
    return Array.from(engagements.values()).map(e => ({
      id: e.id,
      name: e.name,
      scope: e.scope,
      status: e.status,
      taskCount: e.tasks.length,
      completedTasks: e.tasks.filter(t => t.status === 'completed').length,
      createdAt: e.createdAt,
    }));
  });
}
