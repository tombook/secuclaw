/**
 * SQLMap Adapter - Real SQL injection scanner integration
 * Implements ToolAdapter interface, calls system sqlmap binary
 */
import { spawn } from 'child_process';
import { readFile, unlink } from 'fs/promises';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import type { ToolTask, VulnerabilityFinding, ToolAdapter } from './scanner-adapter.js';

const SQLMAP_BIN = '/Users/tombook/Library/Python/3.9/bin/sqlmap';

export class SqlmapAdapter implements ToolAdapter {
  id = 'sqlmap';
  name = 'SQLMap SQL Injection Scanner';
  version = '1.10.3';
  type = 'scanner' as const;

  private tasks: Map<string, ToolTask> = new Map();
  private processes: Map<string, ReturnType<typeof spawn>> = new Map();

  async isAvailable(): Promise<boolean> {
    try {
      const { execSync } = await import('child_process');
      execSync(`${SQLMAP_BIN} --version`, { stdio: 'pipe' });
      return true;
    } catch {
      try {
        const { execSync } = await import('child_process');
        execSync('sqlmap --version', { stdio: 'pipe' });
        return true;
      } catch {
        return false;
      }
    }
  }

  async createTask(target: string, config?: Record<string, unknown>): Promise<ToolTask> {
    const taskId = `sqlmap_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const toolTaskId = `SQLMAP-${Date.now()}`;

    const task: ToolTask = {
      id: taskId,
      toolId: this.id,
      taskId: toolTaskId,
      status: 'pending',
      target,
      config,
      logs: [`[${new Date().toISOString()}] SQLMap task created for ${target}`],
      findings: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.tasks.set(taskId, task);
    this.runSqlmap(taskId, target, config);
    return task;
  }

  private async runSqlmap(taskId: string, target: string, config?: Record<string, unknown>): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    try {
      await this.updateTask(taskId, 'queued');
      this.updateLog(taskId, `Starting SQLMap scan on: ${target}`);

      const args = this.buildSqlmapArgs(target, config);
      this.updateLog(taskId, `Command: sqlmap ${args.join(' ')}`);

      await this.updateTask(taskId, 'running', { progress: 5 });

      const outputFile = join('/tmp', `sqlmap_${taskId}.json`);
      const logFile = join('/tmp', `sqlmap_${taskId}.log`);

      // Run sqlmap with batch mode
      const proc = spawn(SQLMAP_BIN, [...args, '--batch', '--flush-session', '--output-dir=/tmp'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false,
      });

      this.processes.set(taskId, proc);
      task.startedAt = Date.now();

      let stderrData = '';
      let stdoutData = '';

      proc.stderr?.on('data', (data: Buffer) => {
        const line = data.toString();
        stderrData += line;
        this.updateLog(taskId, line.trim());
      });

      proc.stdout?.on('data', (data: Buffer) => {
        const line = data.toString();
        stdoutData += line;
        this.updateProgressFromOutput(taskId, line);
      });

      proc.on('close', async (code) => {
        this.processes.delete(taskId);
        await this.updateTask(taskId, 'running', { progress: 90 });
        this.updateLog(taskId, `SQLMap exited with code ${code}`);

        try {
          // Try to load session JSON output
          const sessionFile = join('/tmp', `sqlmap_${taskId}.json`);
          const sessionData = await this.loadSqlmapSession(sessionFile);
          if (sessionData) {
            const findings = this.parseSqlmapOutput(sessionData, target);
            task.findings = findings;
            this.updateLog(taskId, `Found ${findings.length} SQL injection points`);
            findings.forEach(f => this.updateLog(taskId, `  - ${f.title} [${f.severity}]`));
          }
        } catch (e) {
          this.updateLog(taskId, 'Could not load SQLMap session data');
        }

        // Cleanup temp files
        try {
          await unlink(outputFile).catch(() => {});
          await unlink(logFile).catch(() => {});
        } catch {}

        await this.updateTask(taskId, 'completed', { progress: 100 });
      });

      proc.on('error', async (error) => {
        this.processes.delete(taskId);
        this.updateLog(taskId, `ERROR: ${error.message}`);
        await this.updateTask(taskId, 'failed', { error: error.message });
      });

    } catch (error: any) {
      this.updateLog(taskId, `ERROR: ${error.message}`);
      await this.updateTask(taskId, 'failed', { error: error.message });
    }
  }

  private buildSqlmapArgs(target: string, config?: Record<string, unknown>): string[] {
    const args: string[] = [];

    // Target
    args.push('-u', target);

    // Level/Risk
    const level = (config?.level as number) || 3;
    const risk = (config?.risk as number) || 2;
    args.push(`--level=${level}`, `--risk=${risk}`);

    // Technique
    const techniques = (config?.techniques as string) || 'BEUSTQ';
    args.push(`--technique=${techniques}`);

    // Threads
    const threads = (config?.threads as number) || 4;
    args.push(`--threads=${threads}`);

    // Timeout
    const timeout = (config?.timeout as number) || 60;
    args.push(`--timeout=${timeout}`);

    // Banner/version
    args.push('--banner');

    // Current user
    args.push('--current-user');

    // Current db
    args.push('--current-db');

    // Check all databases
    args.push('--dbs');

    // Tables enumeration
    if (config?.enumerateTables) {
      args.push('--tables');
      if (config?.database as string) {
        args.push('-D', config.database as string);
      }
    }

    // Columns enumeration
    if (config?.enumerateColumns) {
      args.push('--columns');
    }

    // Dump data
    if (config?.dumpData) {
      args.push('--dump');
    }

    // OS shell
    if (config?.osShell) {
      args.push('--os-shell');
    }

    // No progress output (reduces noise)
    args.push('--quiet');

    return args;
  }

  private async loadSqlmapSession(sessionFile: string): Promise<any> {
    try {
      const content = await readFile(sessionFile, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  private parseSqlmapOutput(data: any, target: string): VulnerabilityFinding[] {
    const findings: VulnerabilityFinding[] = [];

    if (!data || typeof data !== 'object') return findings;

    try {
      // SQLMap session data structure
      const targetInfo = data.target || {};
      const databases = data.databases || [];
      const injection = data.injection || {};

      // If injection was found
      if (injection && Object.keys(injection).length > 0) {
        findings.push({
          id: `sqlmap-${target}-injection`,
          title: 'SQL Injection Vulnerability Detected',
          description: `SQLMap confirmed a SQL injection vulnerability at ${target}. Injection point: ${JSON.stringify(injection.parameter || 'unknown')}. Technique: ${injection.type || 'unknown'}`,
          severity: 'critical',
          cvssScore: 9.8,
          cvssVector: 'CVSS:3.0/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
          affectedAsset: target,
          affectedComponent: injection.parameter || 'unknown',
          exploitAvailable: true,
          exploitInWild: false,
          fixAvailable: true,
          discoveredAt: Date.now(),
          fixSteps: [
            'Use parameterized queries (prepared statements)',
            'Implement input validation and sanitization',
            'Apply principle of least privilege for database accounts',
            'Use WAF (Web Application Firewall) as additional layer',
          ],
          extra: { injection, target: targetInfo },
        });
      }

      // Enumerate databases found
      if (databases && Array.isArray(databases)) {
        for (const db of databases) {
          const dbName = typeof db === 'string' ? db : db.name;
          if (dbName) {
            findings.push({
              id: `sqlmap-${target}-db-${dbName}`,
              title: `Database Accessible: ${dbName}`,
              description: `SQLMap was able to enumerate database "${dbName}" on ${target}. This indicates potential data exposure risk.`,
              severity: 'high',
              cvssScore: 7.5,
              affectedAsset: target,
              affectedComponent: `database:${dbName}`,
              discoveredAt: Date.now(),
              fixSteps: [
                'Restrict database user permissions',
                'Audit database access logs',
                'Implement network-level access controls',
              ],
            });
          }
        }
      }
    } catch (error) {
      console.error('[SqlmapAdapter] Parse error:', error);
    }

    return findings;
  }

  private updateProgressFromOutput(taskId: string, line: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    // Parse SQLMap progress output
    const progressMatch = line.match(/\[[\s]*(\d+)%\]/);
    if (progressMatch) {
      const progress = parseInt(progressMatch[1]);
      task.progress = Math.min(Math.round(progress * 0.8 + 10), 89); // Scale to 10-90 range
    }

    // Parse parameter testing
    if (line.includes('testing parameter') || line.includes('testing connection')) {
      if (!task.logs?.some(l => l.includes(line.trim()))) {
        this.updateLog(taskId, line.trim());
      }
    }
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

    const proc = this.processes.get(taskId);
    if (proc) {
      proc.kill('SIGTERM');
      this.processes.delete(taskId);
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
    if (task?.logs && message.trim()) {
      task.logs.push(`[${new Date().toISOString()}] ${message}`);
    }
  }
}
