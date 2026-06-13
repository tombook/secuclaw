import { exec } from 'child_process';
import { readFile } from 'fs/promises';
import { promisify } from 'util';
import type { ToolTask, VulnerabilityFinding, ToolAdapter } from './scanner-adapter.js';

const execAsync = promisify(exec);

interface FalcoAlert {
  output: string;
  priority: 'Emergency' | 'Alert' | 'Critical' | 'Error' | 'Warning' | 'Notice' | 'Informational' | 'Debug';
  rule: string;
  time: string;
  output_fields: Record<string, string>;
  tags: string[];
}

type FalcoPriority = FalcoAlert['priority'];

const PRIORITY_SEVERITY_MAP: Record<FalcoPriority, VulnerabilityFinding['severity']> = {
  Emergency: 'critical',
  Alert: 'critical',
  Critical: 'critical',
  Error: 'high',
  Warning: 'medium',
  Notice: 'low',
  Informational: 'info',
  Debug: 'info',
};

export class FalcoAdapter implements ToolAdapter {
  id = 'falco';
  name = 'Falco Runtime Security';
  version = '0.38.0';
  type = 'scanner' as const;

  private tasks: Map<string, ToolTask> = new Map();

  async isAvailable(): Promise<boolean> {
    try {
      await execAsync('falco --version');
      return true;
    } catch {
      try {
        const response = await fetch('http://localhost:2801/health');
        return response.ok;
      } catch {
        return false;
      }
    }
  }

  async createTask(target: string, config?: Record<string, unknown>): Promise<ToolTask> {
    const taskId = `falco_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const toolTaskId = `FALCO-${Date.now()}`;

    const task: ToolTask = {
      id: taskId,
      toolId: this.id,
      taskId: toolTaskId,
      status: 'pending',
      target,
      config,
      logs: [`[${new Date().toISOString()}] Falco alert fetch task created for ${target}`],
      findings: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.tasks.set(taskId, task);
    this.fetchAlerts(taskId, target, config);
    return task;
  }

  private async fetchAlerts(taskId: string, target: string, config?: Record<string, unknown>): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    try {
      await this.updateTask(taskId, 'queued');
      this.updateLog(taskId, `Starting Falco alert retrieval for: ${target}`);
      await this.updateTask(taskId, 'running', { progress: 10 });

      const falcosidekickUrl = (config?.falcosidekickUrl as string) || 'http://localhost:2801';
      const outputPath = config?.outputPath as string | undefined;

      let alerts: FalcoAlert[];

      if (outputPath) {
        this.updateLog(taskId, `Reading Falco alerts from file: ${outputPath}`);
        const rawContent = await readFile(outputPath, 'utf-8');
        alerts = this.parseAlerts(rawContent);
        this.updateLog(taskId, `Parsed ${alerts.length} alerts from file`);
      } else {
        this.updateLog(taskId, `Fetching Falco alerts from falcosidekick: ${falcosidekickUrl}`);
        alerts = await this.fetchFromFalcosidekick(falcosidekickUrl, config);
        this.updateLog(taskId, `Retrieved ${alerts.length} alerts from falcosidekick`);
      }

      await this.updateTask(taskId, 'running', { progress: 60 });

      const findings = this.convertAlertsToFindings(alerts, target);
      task.findings = findings;

      this.updateLog(taskId, `Converted ${findings.length} alerts to findings`);

      const summary = this.summarizeFindings(findings);
      for (const [severity, count] of Object.entries(summary)) {
        this.updateLog(taskId, `  [${severity.toUpperCase()}] ${count} findings`);
      }

      await this.updateTask(taskId, 'completed', { progress: 100 });
    } catch (error: any) {
      this.updateLog(taskId, `ERROR: ${error.message}`);
      await this.updateTask(taskId, 'failed', { error: error.message });
    }
  }

  private async fetchFromFalcosidekick(baseUrl: string, config?: Record<string, unknown>): Promise<FalcoAlert[]> {
    const timeout = (config?.timeout as number) || 30000;
    const limit = (config?.limit as number) || 1000;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${baseUrl}/alerts?limit=${limit}`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`falcosidekick returned status ${response.status}`);
      }

      const data: unknown = await response.json();
      return Array.isArray(data) ? data : (data as any)?.alerts || [];
    } finally {
      clearTimeout(timer);
    }
  }

  private parseAlerts(rawContent: string): FalcoAlert[] {
    const alerts: FalcoAlert[] = [];
    const lines = rawContent.trim().split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const alert: FalcoAlert = JSON.parse(line);
        if (alert.output && alert.rule && alert.priority) {
          alerts.push(alert);
        }
      } catch {
        continue;
      }
    }

    return alerts;
  }

  private convertAlertsToFindings(alerts: FalcoAlert[], target: string): VulnerabilityFinding[] {
    return alerts.map((alert, index) => {
      const severity = PRIORITY_SEVERITY_MAP[alert.priority] || 'info';
      const mitreTags = this.extractMitreTags(alert.tags);
      const asset = this.extractAsset(alert.output_fields) || target;

      return {
        id: `falco-${alert.rule}-${index}-${Date.now()}`,
        title: `[Falco] ${alert.rule}`,
        description: alert.output,
        severity,
        affectedAsset: asset,
        affectedComponent: (alert.output_fields as any)?.proc?.name || (alert.output_fields as any)?.container?.id || 'unknown',
        discoveredAt: alert.time ? new Date(alert.time).getTime() : Date.now(),
        fixSteps: mitreTags.length > 0
          ? [`Review MITRE ATT&CK technique: ${mitreTags.join(', ')}`, 'Investigate the triggering process and container']
          : ['Investigate the triggering process and container'],
      };
    });
  }

  private extractMitreTags(tags: string[] | undefined): string[] {
    if (!tags) return [];
    return tags
      .filter(tag => tag.startsWith('mitre_'))
      .map(tag => {
        const technique = tag.replace('mitre_', '').replace(/_/g, '.');
        return `T${technique}`;
      });
  }

  private extractAsset(outputFields: Record<string, string> | undefined): string {
    if (!outputFields) return '';
    const parts: string[] = [];
    if (outputFields['k8s.ns.name']) parts.push(`ns/${outputFields['k8s.ns.name']}`);
    if (outputFields['container.id']) parts.push(`container/${outputFields['container.id']}`);
    if (outputFields['fd.name']) parts.push(outputFields['fd.name']);
    return parts.join(' ') || '';
  }

  private summarizeFindings(findings: VulnerabilityFinding[]): Record<string, number> {
    const summary: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const f of findings) {
      summary[f.severity] = (summary[f.severity] || 0) + 1;
    }
    return summary;
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
