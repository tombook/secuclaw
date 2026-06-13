import { exec } from 'child_process';
import { promisify } from 'util';
import type { ToolTask, VulnerabilityFinding, ToolAdapter } from './scanner-adapter.js';

const execAsync = promisify(exec);

interface WazuhConfig {
  apiUrl?: string;
  username?: string;
  password?: string;
  indexPrefix?: string;
  maxAlerts?: number;
  timeRange?: string;
}

interface WazuhAlert {
  rule?: {
    id?: number | string;
    level?: number;
    description?: string;
    mitre?: Array<{ id?: string; tactic?: string }>;
  };
  agent?: {
    id?: string;
    name?: string;
    ip?: string;
  };
  data?: {
    srcip?: string;
    dstip?: string;
    username?: string;
    [key: string]: unknown;
  };
  timestamp?: string;
  [key: string]: unknown;
}

export class WazuhAdapter implements ToolAdapter {
  id = 'wazuh';
  name = 'Wazuh SIEM/XDR';
  version = '4.9.0';
  type = 'scanner' as const;

  private tasks: Map<string, ToolTask> = new Map();

  private resolveConfig(config?: Record<string, unknown>): WazuhConfig {
    return {
      apiUrl: (config?.apiUrl as string) || process.env.WAZUH_API_URL || 'http://localhost:55000',
      username: (config?.username as string) || process.env.WAZUH_API_USER || 'wazuh-wui',
      password: (config?.password as string) || process.env.WAZUH_API_PASS || 'wazuh-wui',
      indexPrefix: (config?.indexPrefix as string) || 'wazuh-alerts',
      maxAlerts: (config?.maxAlerts as number) || 500,
      timeRange: (config?.timeRange as string) || '24h',
    };
  }

  private buildCurlAuthArgs(cfg: WazuhConfig): string[] {
    return [
      '-s',
      '-k',
      '-u', `${cfg.username}:${cfg.password}`,
      '-H', 'Content-Type: application/json',
    ];
  }

  async isAvailable(): Promise<boolean> {
    const cfg = this.resolveConfig();
    try {
      const args = this.buildCurlAuthArgs(cfg);
      const cmd = `curl ${args.join(' ')} ${cfg.apiUrl}/security/user/authenticate`;
      const { stdout } = await execAsync(cmd, { timeout: 10000 });
      const parsed = JSON.parse(stdout);
      return !!(parsed?.data?.token);
    } catch {
      return false;
    }
  }

  async createTask(target: string, config?: Record<string, unknown>): Promise<ToolTask> {
    const taskId = `wazuh_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const toolTaskId = `WAZUH-${Date.now()}`;

    const task: ToolTask = {
      id: taskId,
      toolId: this.id,
      taskId: toolTaskId,
      status: 'pending',
      target,
      config,
      logs: [`[${new Date().toISOString()}] Wazuh alert pull task created for ${target}`],
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
      const cfg = this.resolveConfig(config);
      await this.updateTask(taskId, 'queued');
      this.updateLog(taskId, `Authenticating with Wazuh API at ${cfg.apiUrl}`);

      await this.updateTask(taskId, 'running', { progress: 10 });

      const authArgs = this.buildCurlAuthArgs(cfg);
      const authCmd = `curl ${authArgs.join(' ')} ${cfg.apiUrl}/security/user/authenticate`;
      this.updateLog(taskId, `Executing auth request`);
      const { stdout: authStdout } = await execAsync(authCmd, { timeout: 15000 });
      const authResponse = JSON.parse(authStdout);
      const token = authResponse?.data?.token as string;
      if (!token) {
        throw new Error(`Authentication failed: ${authStdout}`);
      }
      this.updateLog(taskId, `Authentication successful`);

      await this.updateTask(taskId, 'running', { progress: 30 });

      const timeFilter = this.buildTimeFilter(cfg.timeRange!);
      const queryArgs = [
        '-s', '-k',
        '-H', `Authorization: Bearer ${token}`,
        '-H', 'Content-Type: application/json',
      ];
      const limit = Math.min(cfg.maxAlerts || 500, 500);
      const queryUrl = `${cfg.apiUrl}/alerts?limit=${limit}&sort=-timestamp&${timeFilter}`;
      const queryCmd = `curl ${queryArgs.join(' ')} '${queryUrl}'`;

      this.updateLog(taskId, `Fetching alerts (limit=${limit}, timeRange=${cfg.timeRange})`);
      const { stdout: alertsStdout } = await execAsync(queryCmd, { timeout: 30000 });

      await this.updateTask(taskId, 'running', { progress: 70 });
      this.updateLog(taskId, `Parsing alerts...`);

      const alertsResponse = JSON.parse(alertsStdout);
      const rawAlerts: WazuhAlert[] = alertsResponse?.data?.affected_items || alertsResponse?.data || [];

      if (!Array.isArray(rawAlerts)) {
        throw new Error(`Unexpected alerts response format: ${typeof rawAlerts}`);
      }

      this.updateLog(taskId, `Received ${rawAlerts.length} alerts`);

      const findings = this.parseAlertsToFindings(rawAlerts, target);

      const t = await this.updateTask(taskId, 'running', { progress: 90 });
      t.findings = findings;

      const summary = this.summarizeFindings(findings);
      this.updateLog(taskId, `Parsed ${findings.length} findings from ${rawAlerts.length} alerts`);
      for (const [severity, count] of Object.entries(summary)) {
        if (count > 0) {
          this.updateLog(taskId, `  [${severity.toUpperCase()}] ${count} findings`);
        }
      }

      await this.updateTask(taskId, 'completed', { progress: 100 });
    } catch (error: any) {
      this.updateLog(taskId, `ERROR: ${error.message}`);
      await this.updateTask(taskId, 'failed', { error: error.message });
    }
  }

  parseAlertsToFindings(alerts: WazuhAlert[], target: string): VulnerabilityFinding[] {
    const findings: VulnerabilityFinding[] = [];

    for (const alert of alerts) {
      const rule = alert.rule || {};
      const agent = alert.agent || {};
      const data = alert.data || {};

      const ruleLevel = rule.level ?? 0;
      const severity = this.mapRuleLevelToSeverity(ruleLevel);
      const ruleId = rule.id != null ? String(rule.id) : 'unknown';
      const description = rule.description || 'Wazuh alert';
      const agentId = agent.id || 'unknown';
      const agentName = agent.name || 'unknown';
      const agentIp = agent.ip || data.srcip || 'unknown';
      const timestamp = alert.timestamp ? new Date(alert.timestamp).getTime() : Date.now();

      const mitreIds: string[] = [];
      const mitreTactics: string[] = [];
      if (Array.isArray(rule.mitre)) {
        for (const m of rule.mitre) {
          if (m.id) mitreIds.push(m.id);
          if (m.tactic) mitreTactics.push(m.tactic);
        }
      }

      findings.push({
        id: `wazuh-${ruleId}-${agentId}-${timestamp}`,
        title: `[Rule ${ruleId}] ${description}`,
        description: this.buildDescription(rule, agent, data),
        severity,
        cvssScore: this.estimateCvss(ruleLevel),
        affectedAsset: agentIp,
        affectedComponent: `${agentName} (id:${agentId})`,
        discoveredAt: timestamp,
        exploitAvailable: false,
        fixSteps: [],
      });

      const last = findings[findings.length - 1];
      if (mitreIds.length > 0 || mitreTactics.length > 0) {
        (last as any).extra = {
          ...(mitreIds.length > 0 ? { mitreAttackIds: mitreIds } : {}),
          ...(mitreTactics.length > 0 ? { mitreAttackTactics: mitreTactics } : {}),
        };
      }
    }

    return findings;
  }

  private buildDescription(rule: WazuhAlert['rule'], agent: WazuhAlert['agent'], data: WazuhAlert['data']): string {
    const parts: string[] = [];
    if (rule?.description) parts.push(rule.description);
    if (rule?.level != null) parts.push(`Level: ${rule.level}`);
    if (agent?.name) parts.push(`Agent: ${agent.name}`);
    if (data?.srcip) parts.push(`Source: ${data.srcip}`);
    if (data?.dstip) parts.push(`Destination: ${data.dstip}`);
    if (data?.username) parts.push(`User: ${data.username}`);
    return parts.join(' | ');
  }

  private mapRuleLevelToSeverity(level: number): VulnerabilityFinding['severity'] {
    if (level >= 12) return 'critical';
    if (level >= 7) return 'high';
    if (level >= 4) return 'medium';
    return 'low';
  }

  private estimateCvss(level: number): number {
    if (level >= 14) return 9.5;
    if (level >= 12) return 9.0;
    if (level >= 10) return 8.5;
    if (level >= 7) return 7.0;
    if (level >= 4) return 5.0;
    if (level >= 2) return 3.0;
    return 1.0;
  }

  private buildTimeFilter(timeRange: string): string {
    const now = new Date();
    let past: Date;
    const match = timeRange.match(/^(\d+)([hdM])$/);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];
      past = new Date(now);
      if (unit === 'h') past.setHours(past.getHours() - value);
      else if (unit === 'd') past.setDate(past.getDate() - value);
      else if (unit === 'M') past.setMonth(past.getMonth() - value);
    } else {
      past = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    return `timestamp_gte=${past.toISOString()}&timestamp_lte=${now.toISOString()}`;
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
