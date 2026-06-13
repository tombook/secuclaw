import { exec } from 'child_process';
import { promisify } from 'util';
import type { ToolTask, VulnerabilityFinding, ToolAdapter } from './scanner-adapter.js';

const execAsync = promisify(exec);

const DEFAULT_QUERIES = [
  'SELECT * FROM processes',
  'SELECT * FROM listening_ports',
  'SELECT * FROM users',
  'SELECT * FROM suid_bin',
  'SELECT * FROM crontab',
  'SELECT * FROM interface_addresses',
];

export class OsqueryAdapter implements ToolAdapter {
  id = 'osquery';
  name = 'osquery Endpoint Visibility';
  version = '5.x';
  type = 'scanner' as const;

  private tasks: Map<string, ToolTask> = new Map();

  async isAvailable(): Promise<boolean> {
    try {
      await execAsync('osqueryi --version');
      return true;
    } catch {
      try {
        await execAsync('osqueryd --version');
        return true;
      } catch {
        return false;
      }
    }
  }

  async createTask(target: string, config?: Record<string, unknown>): Promise<ToolTask> {
    const taskId = `osquery_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const toolTaskId = `OSQUERY-${Date.now()}`;

    const task: ToolTask = {
      id: taskId,
      toolId: this.id,
      taskId: toolTaskId,
      status: 'pending',
      target,
      config,
      logs: [`[${new Date().toISOString()}] osquery task created for ${target}`],
      findings: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.tasks.set(taskId, task);
    this.runQueries(taskId, config);
    return task;
  }

  private async runQueries(taskId: string, config?: Record<string, unknown>): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    try {
      await this.updateTask(taskId, 'queued');
      this.updateLog(taskId, 'Starting osquery queries');

      const queries = (config?.queries as string[]) || DEFAULT_QUERIES;
      const socketPath = config?.socketPath as string | undefined;

      await this.updateTask(taskId, 'running', { progress: 5 });

      const allResults: Record<string, Record<string, unknown>[]> = {};
      const totalQueries = queries.length;

      for (let i = 0; i < queries.length; i++) {
        const query = queries[i];
        const tableName = this.extractTableName(query);

        this.updateLog(taskId, `Executing query [${i + 1}/${totalQueries}]: ${query}`);

        try {
          const result = await this.executeOsqueryi(query, socketPath);
          allResults[tableName] = result;
          this.updateLog(taskId, `Query returned ${result.length} rows from ${tableName}`);
        } catch (err: any) {
          this.updateLog(taskId, `Query failed for ${tableName}: ${err.message}`);
          allResults[tableName] = [];
        }

        const progress = Math.min(Math.round(((i + 1) / totalQueries) * 80) + 5, 85);
        await this.updateTask(taskId, 'running', { progress });
      }

      await this.updateTask(taskId, 'running', { progress: 90 });
      this.updateLog(taskId, 'Converting results to findings...');

      const findings = this.convertToFindings(allResults);
      task.findings = findings;

      this.updateLog(taskId, `Generated ${findings.length} findings`);
      this.updateLog(taskId, `Extra data stored for tables: ${Object.keys(allResults).join(', ')}`);

      (task as any).extra = allResults;

      await this.updateTask(taskId, 'completed', { progress: 100 });
    } catch (error: any) {
      this.updateLog(taskId, `ERROR: ${error.message}`);
      await this.updateTask(taskId, 'failed', { error: error.message });
    }
  }

  private async executeOsqueryi(
    query: string,
    socketPath?: string,
  ): Promise<Record<string, unknown>[]> {
    const escapedQuery = query.replace(/"/g, '\\"');
    const socketArg = socketPath ? ` --socket ${socketPath}` : '';
    const cmd = `osqueryi${socketArg} --json "${escapedQuery}"`;

    const { stdout } = await execAsync(cmd, { timeout: 60000 });

    if (!stdout.trim()) return [];

    try {
      const parsed = JSON.parse(stdout);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private extractTableName(query: string): string {
    const match = query.match(/FROM\s+(\w+)/i);
    return match ? match[1] : 'unknown';
  }

  private convertToFindings(
    results: Record<string, Record<string, unknown>[]>,
  ): VulnerabilityFinding[] {
    const findings: VulnerabilityFinding[] = [];
    const now = Date.now();

    if (results.listening_ports) {
      for (const row of results.listening_ports) {
        const port = Number(row.port) || 0;
        const protocol = String(row.protocol || 'tcp');
        const address = String(row.address || '0.0.0.0');
        const pid = row.pid != null ? String(row.pid) : 'unknown';
        const path = String(row.path || '');

        findings.push({
          id: `osquery-openport-${address}-${port}-${protocol}`,
          title: `Open Port: ${port}/${protocol} on ${address}`,
          description: `Listening port ${port}/${protocol} bound to ${address}. PID: ${pid}${path ? `, Path: ${path}` : ''}`,
          severity: this.assessPortSeverity(port),
          affectedAsset: address,
          affectedComponent: `${protocol}:${port}`,
          discoveredAt: now,
          fixSteps: this.getPortRemediation(port),
        });
      }
    }

    if (results.suid_bin) {
      for (const row of results.suid_bin) {
        const path = String(row.path || 'unknown');
        const uid = String(row.uid || '');
        const gid = String(row.gid || '');

        findings.push({
          id: `osquery-suid-${path}`,
          title: `SUID Binary: ${path}`,
          description: `SUID binary found at ${path}. Owner UID: ${uid}, GID: ${gid}. Potential privilege escalation vector.`,
          severity: 'medium',
          affectedAsset: 'localhost',
          affectedComponent: path,
          discoveredAt: now,
          fixSteps: [
            'Review SUID binaries regularly',
            'Remove SUID bit from non-essential binaries: chmod u-s <path>',
            'Monitor for unauthorized SUID binaries',
          ],
        });
      }
    }

    if (results.crontab) {
      for (const row of results.crontab) {
        const command = String(row.command || '');
        const event = String(row.event || '');
        const minute = String(row.minute || '*');
        const hour = String(row.hour || '*');
        const dayOfMonth = String(row.day_of_month || '*');
        const month = String(row.month || '*');
        const dayOfWeek = String(row.day_of_week || '*');
        const schedule = `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;

        findings.push({
          id: `osquery-crontab-${command.substring(0, 50)}`,
          title: `Cron Job: ${event || 'scheduled task'}`,
          description: `Persistence mechanism found. Schedule: ${schedule}. Command: ${command}`,
          severity: 'low',
          affectedAsset: 'localhost',
          affectedComponent: 'crontab',
          discoveredAt: now,
          fixSteps: [
            'Review cron jobs for unauthorized entries',
            'Ensure cron entries are managed by configuration management',
            'Monitor for suspicious cron modifications',
          ],
        });
      }
    }

    return findings;
  }

  private assessPortSeverity(port: number): VulnerabilityFinding['severity'] {
    const highRiskPorts = [21, 23, 445, 1433, 3306, 5432, 27017, 6379, 9200, 11211];
    const medRiskPorts = [22, 25, 80, 8080, 8443, 3389, 5900];

    if (highRiskPorts.includes(port)) return 'high';
    if (medRiskPorts.includes(port)) return 'medium';
    if (port > 0) return 'low';
    return 'info';
  }

  private getPortRemediation(port: number): string[] {
    const recs: Record<number, string[]> = {
      21: ['Disable FTP, use SFTP/SCP instead', 'Restrict access by IP whitelist'],
      23: ['Disable Telnet immediately, use SSH', 'Remove telnetd package'],
      22: ['Use key-based SSH authentication', 'Disable password auth', 'Change default port'],
      445: ['Disable SMB if not required', 'Enable SMB signing', 'Restrict to internal network'],
      3306: ['Bind to localhost only', 'Enable TLS connections', 'Use firewall rules'],
      5432: ['Configure pg_hba.conf restrictions', 'Enable SSL', 'Bind to internal interface'],
      6379: ['Bind to 127.0.0.1', 'Enable AUTH', 'Disable dangerous commands'],
      27017: ['Enable authentication', 'Bind to internal interface', 'Enable TLS'],
      3389: ['Use VPN for RDP access', 'Enable Network Level Authentication', 'Change default port'],
    };
    return recs[port] || ['Review if port exposure is required', 'Restrict access with firewall rules'];
  }

  async getStatus(taskId: string): Promise<ToolTask> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);
    return task;
  }

  async getResult(taskId: string): Promise<unknown> {
    const task = await this.getStatus(taskId);
    if (task.status !== 'completed') throw new Error(`Task ${taskId} not completed`);
    return { taskId, status: task.status, findings: task.findings, extra: (task as any).extra };
  }

  async getFindings(taskId: string): Promise<VulnerabilityFinding[]> {
    const task = await this.getStatus(taskId);
    return task.findings || [];
  }

  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) return false;
    if (task.status === 'completed' || task.status === 'failed') return false;

    task.status = 'canceled';
    task.logs?.push(`[${new Date().toISOString()}] Task canceled`);
    task.updatedAt = Date.now();
    return true;
  }

  private async updateTask(
    taskId: string,
    status: ToolTask['status'],
    options?: { progress?: number; error?: string },
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
    if (task?.logs && message.trim()) {
      task.logs.push(`[${new Date().toISOString()}] ${message}`);
    }
  }
}
