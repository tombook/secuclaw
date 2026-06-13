import { exec } from 'child_process';
import { promisify } from 'util';
import type { JsonStore } from '../storage/json-store.js';

const execAsync = promisify(exec);

export interface TheHiveConfig {
  url: string;
  apiKey: string;
  organization: string;
  verifyTLS: boolean;
}

export interface TheHiveTask {
  id: string;
  title: string;
  description: string;
  status: 'Waiting' | 'InProgress' | 'Completed' | 'Cancel';
  assignee: string;
  order: number;
}

export interface TheHiveCase {
  id: string;
  caseId: number;
  title: string;
  description: string;
  severity: 1 | 2 | 3 | 4;
  status: 'Open' | 'InProgress' | 'Resolved' | 'Duplicated' | 'Deleted';
  startDate: number;
  tags: string[];
  tasks: TheHiveTask[];
}

export interface TheHiveObservable {
  id: string;
  dataType: 'ip' | 'domain' | 'url' | 'hash' | 'file' | 'other';
  data: string;
  message: string;
  tags: string[];
  ioc: boolean;
  sighted: boolean;
}

export interface SecuClawPlaybookMapping {
  theHiveCaseId: string;
  playbookId: string;
  execId: string;
  status: 'synced' | 'pending' | 'error';
  syncedAt: string;
}

const STORE_KEY = 'thehive/playbook-mappings.json';

export class TheHiveAdapter {
  constructor(
    private config: TheHiveConfig,
    private store: JsonStore,
  ) {}

  private buildAuthHeaders(): string[] {
    return [
      '-H',
      `"Authorization: Bearer ${this.config.apiKey}"`,
      '-H',
      '"Content-Type: application/json"',
      '-H',
      `"X-Organization: ${this.config.organization}"`,
    ];
  }

  private buildBaseArgs(): string[] {
    const args: string[] = ['-s'];
    if (!this.config.verifyTLS) {
      args.push('-k');
    }
    return args;
  }

  private async request(method: string, path: string, body?: unknown): Promise<unknown> {
    const url = `${this.config.url}${path}`;
    const args = [
      ...this.buildBaseArgs(),
      '-X',
      method,
      ...this.buildAuthHeaders(),
    ];

    if (body !== undefined) {
      const payload = JSON.stringify(body).replace(/'/g, "'\\''");
      args.push('-d', `'${payload}'`);
    }

    args.push(`"${url}"`);

    const { stdout } = await execAsync(`curl ${args.join(' ')}`);
    return JSON.parse(stdout);
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.request('GET', '/api/status');
      return true;
    } catch {
      return false;
    }
  }

  async fetchCases(since?: number): Promise<TheHiveCase[]> {
    const body: Record<string, unknown> = {};
    if (since !== undefined) {
      body.query = [
        { _name: 'list' },
        {
          _name: 'filter',
          _and: [
            { _field: 'startDate', _gt: since },
          ],
        },
      ];
    }
    const result = await this.request('POST', '/api/v1/query', { query: since ? body.query : [{ _name: 'list' }] });
    return (result as TheHiveCase[]);
  }

  async fetchObservables(caseId: string): Promise<TheHiveObservable[]> {
    const result = await this.request('GET', `/api/v1/case/${caseId}/observable`);
    return (result as TheHiveObservable[]);
  }

  async createCase(params: {
    title: string;
    description: string;
    severity: number;
    tags: string[];
  }): Promise<TheHiveCase> {
    const body = {
      title: params.title,
      description: params.description,
      severity: params.severity,
      tags: params.tags,
    };
    return (await this.request('POST', '/api/v1/case', body)) as TheHiveCase;
  }

  async createTask(
    caseId: string,
    params: { title: string; description: string },
  ): Promise<TheHiveTask> {
    const body = {
      title: params.title,
      description: params.description,
    };
    return (await this.request('POST', `/api/v1/case/${caseId}/task`, body)) as TheHiveTask;
  }

  caseToPlaybookSteps(
    theCase: TheHiveCase,
  ): Array<{
    id: string;
    type: 'manual' | 'automated';
    title: string;
    description: string;
    order: number;
    status: string;
  }> {
    return theCase.tasks.map((task) => ({
      id: task.id,
      type: task.assignee ? ('automated' as const) : ('manual' as const),
      title: task.title,
      description: task.description,
      order: task.order,
      status: task.status,
    }));
  }

  async syncToPlaybookEngine(
    caseId: string,
    playbookId: string,
  ): Promise<SecuClawPlaybookMapping> {
    const mapping: SecuClawPlaybookMapping = {
      theHiveCaseId: caseId,
      playbookId,
      execId: `${playbookId}-${caseId}-${Date.now()}`,
      status: 'synced',
      syncedAt: new Date().toISOString(),
    };

    try {
      const theCase = (await this.request('GET', `/api/v1/case/${caseId}`)) as TheHiveCase;
      if (!theCase || !theCase.id) {
        mapping.status = 'error';
        return mapping;
      }
      mapping.status = 'synced';
    } catch {
      mapping.status = 'error';
    }

    return mapping;
  }

  async syncToStore(mappings: SecuClawPlaybookMapping[]): Promise<void> {
    await this.store.set(STORE_KEY, mappings);
  }

  private severityToLevel(sev: number): 'critical' | 'high' | 'medium' | 'low' {
    switch (sev) {
      case 4:
        return 'critical';
      case 3:
        return 'high';
      case 2:
        return 'medium';
      default:
        return 'low';
    }
  }
}
