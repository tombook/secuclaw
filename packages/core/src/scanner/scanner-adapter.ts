export interface PortInfo {
  port: number;
  protocol: 'tcp' | 'udp';
  state: 'open' | 'closed' | 'filtered';
  service?: string;
  banner?: string;
}

export interface ServiceInfo {
  name: string;
  version: string;
  port: number;
}

export interface ScanTarget {
  host: string;
  ports: PortInfo[];
  os?: string;
  services?: ServiceInfo[];
}

export interface ScanResult {
  targets: ScanTarget[];
  scannedAt: number;
  duration: number;
}

export interface VulnerabilityFinding {
  id: string;
  cveId?: string;
  cweId?: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  cvssScore?: number;
  cvssVector?: string;
  affectedAsset?: string;
  affectedComponent?: string;
  exploitAvailable?: boolean;
  exploitInWild?: boolean;
  fixAvailable?: boolean;
  fixVersion?: string;
  fixSteps?: string[];
  discoveredAt: number;
}

export interface ToolTask {
  id: string;
  toolId: string;
  taskId: string;
  status: 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'canceled';
  progress?: number; // 0-100
  target?: string;
  config?: Record<string, unknown>;
  startedAt?: number;
  completedAt?: number;
  duration?: number;
  logs?: string[];
  findings?: VulnerabilityFinding[];
  resultPath?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ToolAdapter {
  id: string;
  name: string;
  version: string;
  type: 'scanner' | 'pentest' | 'baseline' | 'threathunt' | 'custom';
  configSchema?: Record<string, unknown>;
  
  createTask(target: string, config?: Record<string, unknown>): Promise<ToolTask>;
  getStatus(taskId: string): Promise<ToolTask>;
  getResult(taskId: string): Promise<unknown>;
  getFindings(taskId: string): Promise<VulnerabilityFinding[]>;
  cancelTask(taskId: string): Promise<boolean>;
  isAvailable(): Promise<boolean>;
}

const COMMON_PORTS = [
  { port: 22, service: 'ssh', banners: ['OpenSSH_8.9p1 Ubuntu-3', 'OpenSSH_9.0p1 Debian', 'OpenSSH_7.4p1 CentOS'] },
  { port: 80, service: 'http', banners: ['nginx/1.24.0', 'Apache/2.4.57', 'Caddy v2.7'] },
  { port: 443, service: 'https', banners: ['nginx/1.24.0', 'Apache/2.4.57', 'Cloudflare'] },
  { port: 3306, service: 'mysql', banners: ['MySQL 8.0.35', 'MariaDB 10.11.6'] },
  { port: 5432, service: 'postgresql', banners: ['PostgreSQL 15.4', 'PostgreSQL 16.0'] },
  { port: 8080, service: 'http-proxy', banners: ['Apache Tomcat/10.1', 'Jetty 12.0', 'WildFly 28'] },
  { port: 8443, service: 'https-alt', banners: ['Tomcat/10.1', 'Kubernetes Ingress', 'Istio Gateway'] },
];

const OS_OPTIONS = ['Linux 5.x', 'Windows Server 2022', 'FreeBSD 14', 'Ubuntu 22.04'];

export interface ScannerAdapter extends ToolAdapter {
  scan(targets: string[]): Promise<ScanResult>;
}

export class PortScannerAdapter implements ScannerAdapter {
  id = 'portscan';
  name = 'Port Scanner';
  version = '1.0.0';
  type = 'scanner' as const;
  
  private tasks: Map<string, ToolTask> = new Map();

  constructor(private options?: { timeout?: number }) {}

  async createTask(target: string, config?: Record<string, unknown>): Promise<ToolTask> {
    const task: ToolTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      toolId: this.id,
      taskId: `SCAN-${Date.now()}`,
      status: 'pending',
      target,
      config,
      logs: ['Task created'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.tasks.set(task.id, task);
    return task;
  }

  async getStatus(taskId: string): Promise<ToolTask> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);
    return task;
  }

  async getResult(_taskId: string): Promise<unknown> {
    const task = await this.getStatus(_taskId);
    if (task.status !== 'completed') throw new Error(`Task not completed`);
    return this.scan([task.target!]);
  }

  async getFindings(taskId: string): Promise<VulnerabilityFinding[]> {
    const task = await this.getStatus(taskId);
    return task.findings || [];
  }

  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task || task.status === 'completed' || task.status === 'failed') return false;
    task.status = 'canceled';
    task.logs?.push('Task canceled');
    task.updatedAt = Date.now();
    return true;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async scan(targets: string[]): Promise<ScanResult> {
    const scannedAt = Date.now();
    const delay = Math.min(this.options?.timeout ?? 3000, 1000 + Math.random() * 4000);
    await new Promise(resolve => setTimeout(resolve, delay));

    const scanTargets: ScanTarget[] = targets.map(host => {
      const ports: PortInfo[] = [];
      const services: ServiceInfo[] = [];
      for (const { port, service, banners } of COMMON_PORTS) {
        const roll = Math.random();
        let state: PortInfo['state'] = 'closed';
        let banner: string | undefined;
        if (roll < 0.3) {
          state = 'open';
          banner = banners[Math.floor(Math.random() * banners.length)];
          const version = banner.match(/[\d.]+/)?.[0] ?? '1.0';
          services.push({ name: service, version, port });
        } else if (roll < 0.5) {
          state = 'filtered';
        }
        ports.push({ port, protocol: 'tcp', state, service: state === 'open' ? service : undefined, banner });
      }
      const os = Math.random() > 0.2 ? OS_OPTIONS[Math.floor(Math.random() * OS_OPTIONS.length)] : undefined;
      return { host, ports, os, services: services.length > 0 ? services : undefined };
    });

    return { targets: scanTargets, scannedAt, duration: Date.now() - scannedAt };
  }
}

export class BurpSuiteAdapter implements ToolAdapter {
  id = 'burpsuite';
  name = 'Burp Suite Professional';
  version = '2024.x';
  type = 'scanner' as const;

  private tasks: Map<string, ToolTask> = new Map();

  async createTask(target: string, config?: Record<string, unknown>): Promise<ToolTask> {
    const task: ToolTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      toolId: this.id,
      taskId: `BURP-${Date.now()}`,
      status: 'pending',
      target,
      config,
      logs: ['BurpSuite task created - placeholder implementation'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.tasks.set(task.id, task);
    return task;
  }

  async getStatus(taskId: string): Promise<ToolTask> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);
    if (task.status === 'pending') {
      task.status = 'queued';
      task.updatedAt = Date.now();
    }
    return task;
  }

  async getResult(_taskId: string): Promise<unknown> {
    return { placeholder: 'BurpSuite results not implemented' };
  }

  async getFindings(taskId: string): Promise<VulnerabilityFinding[]> {
    return [];
  }

  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) return false;
    task.status = 'canceled';
    return true;
  }

  async isAvailable(): Promise<boolean> {
    return false; // Requires actual BurpSuite installation
  }
}

export class AWVSAdapter implements ToolAdapter {
  id = 'awvs';
  name = 'Acunetix Web Vulnerability Scanner';
  version = '24.x';
  type = 'scanner' as const;

  private tasks: Map<string, ToolTask> = new Map();

  async createTask(target: string, config?: Record<string, unknown>): Promise<ToolTask> {
    const task: ToolTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      toolId: this.id,
      taskId: `AWVS-${Date.now()}`,
      status: 'pending',
      target,
      config,
      logs: ['AWVS task created - placeholder implementation'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.tasks.set(task.id, task);
    return task;
  }

  async getStatus(taskId: string): Promise<ToolTask> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);
    return task;
  }

  async getResult(_taskId: string): Promise<unknown> {
    return { placeholder: 'AWVS results not implemented' };
  }

  async getFindings(taskId: string): Promise<VulnerabilityFinding[]> {
    return [];
  }

  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) return false;
    task.status = 'canceled';
    return true;
  }

  async isAvailable(): Promise<boolean> {
    return false; // Requires actual AWVS installation
  }
}

import { NmapAdapter } from './nmap-adapter.js';
import { SqlmapAdapter } from './sqlmap-adapter.js';
import { NucleiAdapter } from './nuclei-adapter.js';
import { WazuhAdapter } from './wazuh-adapter.js';
import { FalcoAdapter } from './falco-adapter.js';
import { OsqueryAdapter } from './osquery-adapter.js';
import { VelociraptorAdapter } from './velociraptor-adapter.js';

export class ToolRegistry {
  private adapters: Map<string, ToolAdapter> = new Map();

  constructor() {
    this.register(new PortScannerAdapter());
    this.register(new BurpSuiteAdapter());
    this.register(new AWVSAdapter());
    this.register(new NmapAdapter());
    this.register(new SqlmapAdapter());
    this.register(new NucleiAdapter());
    this.register(new WazuhAdapter());
    this.register(new FalcoAdapter());
    this.register(new OsqueryAdapter());
    this.register(new VelociraptorAdapter());
  }

  register(adapter: ToolAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  get(id: string): ToolAdapter | undefined {
    return this.adapters.get(id);
  }

  list(): ToolAdapter[] {
    return Array.from(this.adapters.values());
  }

  listAvailable(): Promise<ToolAdapter[]> {
    return Promise.all(
      this.list().map(async (adapter) => {
        const available = await adapter.isAvailable();
        return available ? adapter : null;
      })
    ).then(results => results.filter(Boolean) as ToolAdapter[]);
  }
}

export const toolRegistry = new ToolRegistry();
