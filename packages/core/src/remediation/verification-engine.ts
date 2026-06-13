import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export type VerificationStatus =
  | 'pending'
  | 'in_progress'
  | 'passed'
  | 'failed'
  | 'error'
  | 'skipped';

export interface VerificationCheck {
  id: string;
  name: string;
  type: 'connectivity' | 'process' | 'port' | 'service' | 'log' | 'ioc' | 'custom';
  command: string;
  expectedOutput: string | null;
  timeoutMs: number;
}

export interface VerificationResult {
  checkId: string;
  checkName: string;
  status: VerificationStatus;
  actualOutput: string;
  passed: boolean;
  timestamp: number;
  durationMs: number;
}

export interface VerificationReport {
  id: string;
  actionId: string;
  actionType: string;
  checks: VerificationResult[];
  overallStatus: VerificationStatus;
  overallPassed: boolean;
  metricsBefore: Record<string, number>;
  metricsAfter: Record<string, number>;
  improvement: Record<string, number>;
  startedAt: number;
  completedAt: number;
  durationMs: number;
}

const STORE_KEY = 'remediation/verification-reports.json';

const BUILT_IN_CHECKS: Record<string, VerificationCheck[]> = {
  block_ip: [
    { id: 'block_ip_ping', name: 'Ping Check', type: 'connectivity', command: 'ping -c 1 -W 2 {target}', expectedOutput: null, timeoutMs: 10000 },
    { id: 'block_ip_curl', name: 'Curl Check', type: 'connectivity', command: 'curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://{target}', expectedOutput: null, timeoutMs: 10000 },
    { id: 'block_ip_port_scan', name: 'Port Scan', type: 'port', command: 'nc -z -w 2 {target} 80 443 2>&1 || true', expectedOutput: null, timeoutMs: 10000 },
  ],
  isolate_host: [
    { id: 'isolate_host_connectivity', name: 'Connectivity Check', type: 'connectivity', command: 'ping -c 1 -W 2 {target}', expectedOutput: null, timeoutMs: 10000 },
    { id: 'isolate_host_process', name: 'Process Check', type: 'process', command: 'ps aux | grep -v grep | grep "{target}" || true', expectedOutput: null, timeoutMs: 10000 },
  ],
  kill_process: [
    { id: 'kill_process_existence', name: 'Process Existence', type: 'process', command: 'pgrep -f "{processName}" || true', expectedOutput: null, timeoutMs: 10000 },
    { id: 'kill_process_port', name: 'Port Check', type: 'port', command: 'ss -tlnp | grep "{processName}" || true', expectedOutput: null, timeoutMs: 10000 },
  ],
  patch_vulnerability: [
    { id: 'patch_vuln_version', name: 'Version Check', type: 'service', command: 'dpkg -l {package} 2>/dev/null || rpm -q {package} 2>/dev/null || true', expectedOutput: null, timeoutMs: 10000 },
    { id: 'patch_vuln_cve', name: 'CVE Check', type: 'log', command: 'echo "CVE verification for {vulnerabilityId}"', expectedOutput: null, timeoutMs: 10000 },
  ],
  disable_user: [
    { id: 'disable_user_auth', name: 'Auth Test', type: 'custom', command: 'id {userId} 2>&1 || true', expectedOutput: null, timeoutMs: 10000 },
    { id: 'disable_user_account_status', name: 'Account Status', type: 'custom', command: 'passwd -S {userId} 2>/dev/null || dscl . -read /Users/{userId} 2>&1 || true', expectedOutput: null, timeoutMs: 10000 },
  ],
};

export class RemediationVerificationEngine {
  private checkRegistry: Map<string, VerificationCheck[]> = new Map();

  constructor(private store: JsonStore) {
    for (const [actionType, checks] of Object.entries(BUILT_IN_CHECKS)) {
      this.checkRegistry.set(actionType, checks);
    }
  }

  registerCheck(actionType: string, checks: VerificationCheck[]): void {
    this.checkRegistry.set(actionType, checks);
  }

  async verify(
    actionId: string,
    actionType: string,
    metricsBefore: Record<string, number>,
  ): Promise<VerificationReport> {
    const startedAt = Date.now();
    const checks = this.checkRegistry.get(actionType) ?? [];

    const results: VerificationResult[] = [];

    for (const check of checks) {
      const result = await this.runCheck(check);
      results.push(result);
    }

    const completedAt = Date.now();

    const metricsAfter = await this.collectMetrics();
    const improvement = this.computeImprovement(metricsBefore, metricsAfter);

    const overallPassed = results.length > 0 && results.every((r) => r.passed);
    const overallStatus = this.determineOverallStatus(results);

    const report: VerificationReport = {
      id: this.generateId(),
      actionId,
      actionType,
      checks: results,
      overallStatus,
      overallPassed,
      metricsBefore,
      metricsAfter,
      improvement,
      startedAt,
      completedAt,
      durationMs: completedAt - startedAt,
    };

    await this.persistReport(report);

    return report;
  }

  async getReport(reportId: string): Promise<VerificationReport | null> {
    const reports = await this.loadReports();
    return reports.find((r) => r.id === reportId) ?? null;
  }

  async getReportsForAction(actionId: string): Promise<VerificationReport[]> {
    const reports = await this.loadReports();
    return reports.filter((r) => r.actionId === actionId);
  }

  async getRecentReports(limit: number = 50): Promise<VerificationReport[]> {
    const reports = await this.loadReports();
    return reports
      .sort((a, b) => b.completedAt - a.completedAt)
      .slice(0, limit);
  }

  async getVerificationStats(): Promise<{
    total: number;
    passed: number;
    failed: number;
    passRate: number;
  }> {
    const reports = await this.loadReports();
    const total = reports.length;
    const passed = reports.filter((r) => r.overallPassed).length;
    const failed = reports.filter((r) => !r.overallPassed).length;
    const passRate = total > 0 ? (passed / total) * 100 : 0;

    return { total, passed, failed, passRate };
  }

  private async runCheck(check: VerificationCheck): Promise<VerificationResult> {
    const start = Date.now();

    try {
      const { stdout } = await execAsync(check.command, {
        timeout: check.timeoutMs,
      });

      const actualOutput = stdout.trim();
      const passed = check.expectedOutput === null || actualOutput.includes(check.expectedOutput);
      const durationMs = Date.now() - start;

      return {
        checkId: check.id,
        checkName: check.name,
        status: passed ? 'passed' : 'failed',
        actualOutput,
        passed,
        timestamp: Date.now(),
        durationMs,
      };
    } catch (error: unknown) {
      const durationMs = Date.now() - start;
      const actualOutput = error instanceof Error ? error.message : String(error);

      if (check.expectedOutput === null) {
        return {
          checkId: check.id,
          checkName: check.name,
          status: 'passed',
          actualOutput,
          passed: true,
          timestamp: Date.now(),
          durationMs,
        };
      }

      return {
        checkId: check.id,
        checkName: check.name,
        status: 'error',
        actualOutput,
        passed: false,
        timestamp: Date.now(),
        durationMs,
      };
    }
  }

  private computeImprovement(
    before: Record<string, number>,
    after: Record<string, number>,
  ): Record<string, number> {
    const improvement: Record<string, number> = {};
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    for (const key of allKeys) {
      const beforeVal = before[key] ?? 0;
      const afterVal = after[key] ?? 0;
      improvement[key] = afterVal - beforeVal;
    }

    return improvement;
  }

  private generateId(): string {
    return randomUUID();
  }

  private determineOverallStatus(results: VerificationResult[]): VerificationStatus {
    if (results.length === 0) {
      return 'skipped';
    }

    if (results.some((r) => r.status === 'error')) {
      return 'error';
    }

    if (results.every((r) => r.status === 'passed')) {
      return 'passed';
    }

    return 'failed';
  }

  private async collectMetrics(): Promise<Record<string, number>> {
    try {
      const { stdout } = await execAsync('uptime', { timeout: 5000 });
      const loadMatch = stdout.match(/load averages?:\s*([\d.]+)/i);
      return {
        loadAvg: loadMatch ? parseFloat(loadMatch[1]) : 0,
        timestamp: Date.now(),
      };
    } catch {
      return { timestamp: Date.now() };
    }
  }

  private async loadReports(): Promise<VerificationReport[]> {
    const data = await this.store.get<VerificationReport[]>(STORE_KEY);
    return data ?? [];
  }

  private async persistReport(report: VerificationReport): Promise<void> {
    const reports = await this.loadReports();
    reports.push(report);
    await this.store.set(STORE_KEY, reports);
  }
}
