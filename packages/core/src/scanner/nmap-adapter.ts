/**
 * Nmap Adapter - Real network scanner integration
 * Implements ToolAdapter interface, calls system nmap binary
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import type { ToolTask, VulnerabilityFinding, ToolAdapter } from './scanner-adapter.js';

const execAsync = promisify(exec);

export class NmapAdapter implements ToolAdapter {
  id = 'nmap';
  name = 'Nmap Network Scanner';
  version = '7.99';
  type = 'scanner' as const;

  private tasks: Map<string, ToolTask> = new Map();
  private runningProcesses: Map<string, ReturnType<typeof exec>> = new Map();

  async isAvailable(): Promise<boolean> {
    try {
      await execAsync('nmap --version');
      return true;
    } catch {
      return false;
    }
  }

  async createTask(target: string, config?: Record<string, unknown>): Promise<ToolTask> {
    const scanType = (config?.scanType as string) || 'basic';
    const ports = (config?.ports as string) || '1-1000';
    const timing = (config?.timing as string) || '-T4';

    const taskId = `nmap_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const toolTaskId = `NMAP-${Date.now()}`;

    const task: ToolTask = {
      id: taskId,
      toolId: this.id,
      taskId: toolTaskId,
      status: 'pending',
      target,
      config,
      logs: [`[${new Date().toISOString()}] Task created: nmap ${scanType} scan on ${target}`],
      findings: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.tasks.set(taskId, task);
    this.executeScan(taskId, target, scanType, ports, timing);
    return task;
  }

  private async executeScan(
    taskId: string,
    target: string,
    scanType: string,
    ports: string,
    timing: string
  ): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    try {
      await this.updateTask(taskId, 'queued');

      const args = this.buildNmapArgs(scanType, ports, timing);
      const cmd = `nmap ${args} -oX - ${target}`;

      this.updateLog(taskId, `Executing: nmap ${args} ${target}`);
      this.updateLog(taskId, `Full command: ${cmd}`);

      await this.updateTask(taskId, 'running', { progress: 10 });

      const { stdout, stderr } = await execAsync(cmd, {
        timeout: (task.config?.timeout as number) || 300000,
      });

      if (stderr && !stderr.includes('WARNING')) {
        this.updateLog(taskId, `stderr: ${stderr}`);
      }

      await this.updateTask(taskId, 'running', { progress: 70 });
      this.updateLog(taskId, 'Parsing scan results...');

      const findings = this.parseNmapXml(stdout, target);
      const result = await this.updateTask(taskId, 'running', { progress: 90 });
      result.findings = findings;
      result.logs?.push(`[${new Date().toISOString()}] Scan complete: ${findings.length} findings`);
      result.logs?.push(...findings.map(f => `  - ${f.title} (${f.severity}) on ${f.affectedAsset}`));

      await this.updateTask(taskId, 'completed', { progress: 100 });
    } catch (error: any) {
      this.updateLog(taskId, `ERROR: ${error.message}`);
      await this.updateTask(taskId, 'failed', { error: error.message });
    }
  }

  private buildNmapArgs(scanType: string, ports: string, timing: string): string {
    const baseArgs: string[] = [];

    switch (scanType) {
      case 'full':
        baseArgs.push('-sS', '-sV', '-sC', '-O', '-p-', timing);
        break;
      case 'vuln':
        baseArgs.push('--script', 'vuln', '-sV', timing);
        break;
      case 'stealth':
        baseArgs.push('-sS', '-T1', '-f', '--data-length', '50');
        break;
      case 'udp':
        baseArgs.push('-sU', '-sV', `--top-ports ${ports || '100'}`, timing);
        break;
      case 'service':
        baseArgs.push('-sV', '--version-intensity', '5', timing);
        break;
      case 'basic':
      default:
        baseArgs.push('-sS', '-sV', '-p', ports || '1-1000', timing);
        break;
    }

    // Add common flags
    baseArgs.push('--privileged', '--reason', '--open');

    return baseArgs.join(' ');
  }

  private parseNmapXml(xmlOutput: string, target: string): VulnerabilityFinding[] {
    const findings: VulnerabilityFinding[] = [];

    try {
      // Simple regex-based XML parsing (no external dependencies)
      const hostMatches = xmlOutput.match(/<host[^>]*>[\s\S]*?<\/host>/g) || [];

      for (const hostXml of hostMatches) {
        const addrMatch = hostMatch(hostXml, 'address');
        const hostnamesMatch = hostMatch(hostXml, 'hostnames');
        const hostname = hostnamesMatch ? hostnamesMatch.getAttribute?.('name') || '' : '';
        const ip = addrMatch?.getAttribute?.('addr') || target;

        const osMatch = hostXml.match(/<osmatch[^>]*name="([^"]*)"[^>]*accuracy="([^"]*)"/);

        // Parse ports
        const portMatches = hostXml.match(/<port[^>]*protocol="tcp"[^>]*>[\s\S]*?<\/port>/g) || [];
        for (const portXml of portMatches) {
          const portId = getAttr(portXml, 'portid');
          const stateMatch = portXml.match(/<state[^>]*state="([^"]*)"/);
          const state = stateMatch?.[1] || '';

          if (state !== 'open') continue;

          const serviceMatch = portXml.match(/<service[^>]*(?:name="([^"]*)")?[^>]*(?:product="([^"]*)")?[^>]*(?:version="([^"]*)")?/);
          const service = serviceMatch?.[1] || 'unknown';
          const product = serviceMatch?.[2] || '';
          const version = serviceMatch?.[3] || '';

          const portInfo = `${ip}:${portId}/${service}`;
          const banner = [product, version].filter(Boolean).join(' ');

          // Determine severity based on port/service
          const severity = this.assessPortSeverity(parseInt(portId), service);

          findings.push({
            id: `nmap-${ip}-${portId}`,
            title: `Open Port: ${portId}/${service}`,
            description: `Port ${portId} is open running ${service}${banner ? ` (${banner})` : ''}. Host: ${hostname || ip}`,
            severity,
            cvssScore: severity === 'critical' ? 9.8 : severity === 'high' ? 7.5 : severity === 'medium' ? 5.0 : 2.0,
            affectedAsset: ip,
            affectedComponent: `${service}:${portId}`,
            discoveredAt: Date.now(),
            fixSteps: this.getPortFixRecommendations(parseInt(portId), service),
            extra: {
              port: parseInt(portId),
              protocol: 'tcp',
              state,
              service,
              product,
              version,
              hostname,
              os: osMatch?.[1],
              banner,
            },
          });
        }
      }
    } catch (error) {
      console.error('[NmapAdapter] XML parse error:', error);
    }

    return findings;
  }

  private assessPortSeverity(port: number, service: string): VulnerabilityFinding['severity'] {
    const highRiskPorts = [21, 23, 445, 1433, 3306, 5432, 27017, 6379, 11211];
    const medRiskPorts = [22, 25, 80, 443, 8080, 8443, 33060];

    if (highRiskPorts.includes(port)) return 'high';
    if (medRiskPorts.includes(port)) return 'medium';
    if (service === 'http' || service === 'https') return 'low';
    return 'info';
  }

  private getPortFixRecommendations(port: number, service: string): string[] {
    const recs: Record<number, string[]> = {
      21: ['Disable FTP or use SFTP instead', 'Restrict FTP access by IP'],
      23: ['Disable Telnet, use SSH instead', 'If required, restrict to trusted IPs'],
      22: ['Use SSH key-based auth', 'Disable password authentication', 'Change default port'],
      445: ['Disable SMB if not needed', 'Enable SMB signing', 'Restrict to internal network'],
      3306: ['Bind to localhost or internal interface', 'Use strong passwords', 'Enable SSL connections'],
      5432: ['Set pg_hba.conf restrictions', 'Use SSL connections', 'Change default port'],
      6379: ['Bind to localhost', 'Enable AUTH', 'Rename commands'],
      8080: ['Review running services', 'Close if not needed', 'Use proper authentication'],
    };
    return recs[port] || (service === 'http' ? ['Enable HTTPS', 'Use HSTS', 'Add WAF protection'] : ['Review if port is required', 'Close if not in use']);
  }

  async getStatus(taskId: string): Promise<ToolTask> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);
    return task;
  }

  async getResult(taskId: string): Promise<unknown> {
    const task = await this.getStatus(taskId);
    if (task.status !== 'completed') throw new Error(`Task ${taskId} not completed`);
    return { taskId, status: task.status, findings: task.findings };
  }

  async getFindings(taskId: string): Promise<VulnerabilityFinding[]> {
    const task = await this.getStatus(taskId);
    return task.findings || [];
  }

  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) return false;
    if (task.status === 'completed' || task.status === 'failed') return false;

    const proc = this.runningProcesses.get(taskId);
    if (proc) {
      proc.kill('SIGTERM');
      this.runningProcesses.delete(taskId);
    }

    task.status = 'canceled';
    task.logs?.push(`[${new Date().toISOString()}] Task canceled`);
    task.updatedAt = Date.now();
    return true;
  }

  private async updateTask(
    taskId: string,
    status: ToolTask['status'],
    options?: { progress?: number; error?: string }
  ): Promise<ToolTask> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    task.status = status;
    task.updatedAt = Date.now();

    if (options?.progress !== undefined) task.progress = options.progress;
    if (options?.error) task.error = options.error;
    if (status === 'running' && !task.startedAt) task.startedAt = Date.now();
    if (status === 'completed' || status === 'failed' || status === 'canceled') {
      task.completedAt = Date.now();
      if (task.startedAt) task.duration = task.completedAt - task.startedAt;
    }

    return task;
  }

  private updateLog(taskId: string, message: string): void {
    const task = this.tasks.get(taskId);
    if (task?.logs) {
      task.logs.push(`[${new Date().toISOString()}] ${message}`);
    }
  }
}

function hostMatch(xml: string, tag: string): { getAttribute: (name: string) => string | null } | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*>`));
  if (!match) return null;
  const fullTag = match[0];
  return {
    getAttribute: (name: string) => {
      const re = new RegExp(`${name}="([^"]*)"`);
      const m = fullTag.match(re);
      return m ? m[1] : null;
    },
  };
}

function getAttr(xml: string, name: string): string | null {
  const re = new RegExp(`${name}="([^"]*)"`);
  const m = xml.match(re);
  return m ? m[1] : null;
}
