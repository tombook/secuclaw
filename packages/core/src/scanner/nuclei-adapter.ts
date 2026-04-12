/**
 * Nuclei Adapter - Real vulnerability scanner integration
 * Implements ToolAdapter interface, calls system nuclei binary
 */
import { spawn } from 'child_process';
import { readFile } from 'fs/promises';
import type { ToolTask, VulnerabilityFinding, ToolAdapter } from './scanner-adapter.js';

export class NucleiAdapter implements ToolAdapter {
  id = 'nuclei';
  name = 'Nuclei Vulnerability Scanner';
  version = '3.7.1';
  type = 'scanner' as const;

  private tasks: Map<string, ToolTask> = new Map();
  private processes: Map<string, ReturnType<typeof spawn>> = new Map();

  async isAvailable(): Promise<boolean> {
    try {
      const { execSync } = await import('child_process');
      execSync('nuclei --version', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  async createTask(target: string, config?: Record<string, unknown>): Promise<ToolTask> {
    const taskId = `nuclei_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const toolTaskId = `NUCLEI-${Date.now()}`;

    const task: ToolTask = {
      id: taskId,
      toolId: this.id,
      taskId: toolTaskId,
      status: 'pending',
      target,
      config,
      logs: [`[${new Date().toISOString()}] Nuclei task created for ${target}`],
      findings: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.tasks.set(taskId, task);
    this.runNuclei(taskId, target, config);
    return task;
  }

  private async runNuclei(taskId: string, target: string, config?: Record<string, unknown>): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    try {
      await this.updateTask(taskId, 'queued');
      this.updateLog(taskId, `Starting Nuclei scan on: ${target}`);

      const args = this.buildNucleiArgs(target, config);
      this.updateLog(taskId, `Command: nuclei ${args.join(' ')}`);

      await this.updateTask(taskId, 'running', { progress: 5 });

      const outputFile = `/tmp/nuclei_${taskId}.json`;

      const proc = spawn('nuclei', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false,
      });

      this.processes.set(taskId, proc);
      task.startedAt = Date.now();

      proc.stderr?.on('data', (data: Buffer) => {
        const line = data.toString();
        if (line.includes('[WRN]') || line.includes('[ERR]')) {
          this.updateLog(taskId, line.trim());
        }
      });

      proc.stdout?.on('data', (data: Buffer) => {
        const line = data.toString();
        this.updateProgressFromOutput(taskId, line);
      });

      proc.on('close', async (code) => {
        this.processes.delete(taskId);
        this.updateLog(taskId, `Nuclei exited with code ${code}`);
        await this.updateTask(taskId, 'running', { progress: 90 });

        try {
          // Read JSON output
          const rawContent = await readFile(outputFile, 'utf-8').catch(() => '');
          if (rawContent) {
            const findings = this.parseNucleiJson(rawContent, target);
            task.findings = findings;
            this.updateLog(taskId, `Found ${findings.length} vulnerabilities`);

            // Summary by severity
            const summary = this.summarizeFindings(findings);
            Object.entries(summary).forEach(([severity, count]) => {
              this.updateLog(taskId, `  [${severity.toUpperCase()}] ${count} findings`);
            });
          }
        } catch (e) {
          this.updateLog(taskId, 'Could not load nuclei output file');
        }

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

  private buildNucleiArgs(target: string, config?: Record<string, unknown>): string[] {
    const args: string[] = [];

    // Target
    args.push('-u', target);

    // Templates
    const templateType = (config?.template as string) || 'default';
    switch (templateType) {
      case 'cves':
        args.push('-t', 'cves/');
        break;
      case 'vuln':
        args.push('-t', 'vulnerabilities/');
        break;
      case 'misconfig':
        args.push('-t', 'misconfiguration/');
        break;
      case 'exposures':
        args.push('-t', 'exposures/');
        break;
      case 'full':
        // All templates - no -t flag
        break;
      case 'default':
      default:
        args.push('-t', 'cves/,vulnerabilities/,misconfiguration/');
        break;
    }

    // Severity filter
    const severity = (config?.severity as string) || 'critical,high,medium';
    args.push('-severity', severity);

    // Rate limit
    const rateLimit = (config?.rateLimit as number) || 150;
    args.push('-rl', rateLimit.toString());

    // Threads
    const threads = (config?.threads as number) || 25;
    args.push('-c', threads.toString());

    // Timeout
    const timeout = (config?.timeout as number) || 300;
    args.push('-timeout', timeout.toString());

    // Stats interval
    args.push('-si', '30');

    // JSON output
    args.push('-json-export', `/tmp/nuclei_${Date.now()}.json`);

    // Markdown export (optional)
    const mdExport = (config?.markdownExport as string);
    if (mdExport) {
      args.push('-markdown-export', mdExport);
    }

    // Update templates
    if (config?.updateTemplates !== false) {
      args.push('-ut');
    }

    return args;
  }

  private parseNucleiJson(jsonContent: string, target: string): VulnerabilityFinding[] {
    const findings: VulnerabilityFinding[] = [];

    try {
      const lines = jsonContent.trim().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;

        let entry: any;
        try {
          entry = JSON.parse(line);
        } catch {
          continue;
        }

        const info = entry.info || {};
        const _matcher = entry.matcher || {};

        // Map nuclei severity to our severity
        const severityMap: Record<string, VulnerabilityFinding['severity']> = {
          'info': 'info',
          'low': 'low',
          'medium': 'medium',
          'high': 'high',
          'critical': 'critical',
          'unknown': 'info',
        };
        const severity = severityMap[info.severity?.toLowerCase()] || 'info';

        // Map CVSS
        let cvssScore: number | undefined;
        const cvssStr = info.cvss_metrics || info.cvss || '';
        if (cvssStr) {
          cvssScore = parseFloat(cvssStr.split('/')[0]) || undefined;
        }

        const cveIds = (info.cve_id || []).map((c: string) => c.trim()).filter(Boolean);
        const _cweIds = (info.cwe_id || []).map((c: string) => c.trim()).filter(Boolean);

        for (const cveId of cveIds) {
          findings.push({
            id: `nuclei-${entry.template_id || 'unknown'}-${cveId}`,
            cveId,
            title: info.name || entry.matcher_name || 'Nuclei Finding',
            description: info.description || `Nuclei template ${entry.template_id} matched at ${entry.host}`,
            severity,
            cvssScore,
            affectedAsset: entry.host || target,
            affectedComponent: entry.template_id || 'unknown',
            exploitAvailable: false,
            fixAvailable: info.classification?.cve_id?.length ? true : false,
            discoveredAt: entry.timestamp ? new Date(entry.timestamp).getTime() : Date.now(),
            fixSteps: info.remediation ? [info.remediation] : [],
          });
        }

        // If no CVE, add as general finding
        if (cveIds.length === 0) {
          findings.push({
            id: `nuclei-${entry.template_id || 'unknown'}-${Date.now()}`,
            title: info.name || entry.matcher_name || 'Nuclei Finding',
            description: info.description || `Nuclei template ${entry.template_id} matched at ${entry.host}`,
            severity,
            cvssScore,
            affectedAsset: entry.host || target,
            affectedComponent: entry.template_id || 'unknown',
            exploitAvailable: false,
            discoveredAt: entry.timestamp ? new Date(entry.timestamp).getTime() : Date.now(),
            fixSteps: info.remediation ? [info.remediation] : [],
          });
        }
      }
    } catch (error) {
      console.error('[NucleiAdapter] Parse error:', error);
    }

    return findings;
  }

  private summarizeFindings(findings: VulnerabilityFinding[]): Record<string, number> {
    const summary: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const f of findings) {
      summary[f.severity] = (summary[f.severity] || 0) + 1;
    }
    return summary;
  }

  private updateProgressFromOutput(taskId: string, line: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    // Parse nuclei stats output
    const statsMatch = line.match(/[\s\S]*?\[(\d+)\/(\d+)\][\s\S]*/);
    if (statsMatch) {
      const current = parseInt(statsMatch[1]);
      const total = parseInt(statsMatch[2]);
      if (total > 0) {
        task.progress = Math.min(Math.round((current / total) * 80) + 10, 89);
      }
    }

    // Log interesting lines
    if (
      (line.includes('[VULN]') || line.includes('[CRITICAL]') || line.includes('[HIGH]')) &&
      !line.includes('[WRN]')
    ) {
      this.updateLog(taskId, line.trim());
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
