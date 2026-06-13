import { exec } from 'child_process';
import { promisify } from 'util';
import type { ToolTask, VulnerabilityFinding, ToolAdapter } from './scanner-adapter.js';

const execAsync = promisify(exec);

const DEFAULT_VQL_QUERIES = [
  'SELECT * FROM Artifact.Windows.Network.Netstat()',
  'SELECT * FROM Artifact.Windows.System.Pslist()',
  'SELECT * FROM Artifact.Windows.NTFS.MFT()',
  'SELECT * FROM Artifact.Windows.Registry.Amcache()',
  'SELECT * FROM Artifact.Windows.EventLogs.Evtx()',
  'SELECT * FROM Artifact.Linux.Sys.BashShell()',
  'SELECT * FROM Artifact.Linux.Sys.Processes()',
];

const KNOWN_C2_INDICATORS = [
  /\.onion$/i,
  /\.tor2web\.org$/i,
  /^0\.0\.0\.0$/,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
];

const SUSPICIOUS_PROCESS_NAMES = [
  /mimikatz/i,
  /procdump/i,
  /lazagne/i,
  /hashcat/i,
  /john the ripper/i,
  /nmap/i,
  /ncat/i,
  /netcat/i,
  /psexec/i,
  /wmic.*process.*call.*create/i,
  /powershell.*-enc/i,
  /powershell.*-executionpolicy.*bypass/i,
  /cmd\.exe.*\/c/i,
  /rundll32.*\.dat/i,
  /rundll32.*\.tmp/i,
  /svchost.*-k/i,
  /csrss.*\.exe$/i,
];

interface VelociraptorConfig {
  serverUrl?: string;
  apiCert?: string;
  vqlQueries?: string[];
  artifactNames?: string[];
}

export class VelociraptorAdapter implements ToolAdapter {
  id = 'velociraptor';
  name = 'Velociraptor DFIR';
  version = '0.7x';
  type = 'scanner' as const;

  private tasks: Map<string, ToolTask> = new Map();

  async isAvailable(): Promise<boolean> {
    try {
      await execAsync('velociraptor version');
      return true;
    } catch {
      return false;
    }
  }

  async createTask(target: string, config?: Record<string, unknown>): Promise<ToolTask> {
    const taskId = `velociraptor_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const toolTaskId = `VR-${Date.now()}`;

    const task: ToolTask = {
      id: taskId,
      toolId: this.id,
      taskId: toolTaskId,
      status: 'pending',
      target,
      config,
      logs: [`[${new Date().toISOString()}] Velociraptor forensic collection task created for ${target}`],
      findings: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.tasks.set(taskId, task);
    this.executeCollection(taskId, target, config as VelociraptorConfig | undefined);
    return task;
  }

  private async executeCollection(
    taskId: string,
    target: string,
    config?: VelociraptorConfig,
  ): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    try {
      await this.updateTask(taskId, 'queued');
      this.updateLog(taskId, 'Preparing VQL artifact queries');

      const vqlQueries = config?.vqlQueries || DEFAULT_VQL_QUERIES;
      const artifactNames = config?.artifactNames || [];
      const serverUrl = config?.serverUrl;
      const apiCert = config?.apiCert;

      const allQueries = [...vqlQueries];
      for (const artifact of artifactNames) {
        allQueries.push(`SELECT * FROM Artifact.${artifact}()`);
      }

      await this.updateTask(taskId, 'running', { progress: 5 });

      const allResults: Record<string, Record<string, unknown>[]> = {};
      const totalQueries = allQueries.length;

      for (let i = 0; i < allQueries.length; i++) {
        const query = allQueries[i];
        const artifactName = this.extractArtifactName(query);

        this.updateLog(taskId, `Executing VQL [${i + 1}/${totalQueries}]: ${query}`);

        try {
          const result = await this.runVqlQuery(query, target, serverUrl, apiCert);
          allResults[artifactName] = result;
          this.updateLog(taskId, `VQL returned ${result.length} rows from ${artifactName}`);
        } catch (err: any) {
          this.updateLog(taskId, `VQL failed for ${artifactName}: ${err.message}`);
          allResults[artifactName] = [];
        }

        const progress = Math.min(Math.round(((i + 1) / totalQueries) * 80) + 5, 85);
        await this.updateTask(taskId, 'running', { progress });
      }

      await this.updateTask(taskId, 'running', { progress: 90 });
      this.updateLog(taskId, 'Analyzing VQL results for security findings...');

      const findings = this.convertToFindings(allResults, target);
      task.findings = findings;

      this.updateLog(taskId, `Analysis complete: ${findings.length} security findings generated`);

      const critical = findings.filter(f => f.severity === 'critical').length;
      const high = findings.filter(f => f.severity === 'high').length;
      const medium = findings.filter(f => f.severity === 'medium').length;
      this.updateLog(taskId, `Breakdown: ${critical} critical, ${high} high, ${medium} medium`);

      await this.updateTask(taskId, 'completed', { progress: 100 });
    } catch (error: any) {
      this.updateLog(taskId, `ERROR: ${error.message}`);
      await this.updateTask(taskId, 'failed', { error: error.message });
    }
  }

  private async runVqlQuery(
    query: string,
    target: string,
    serverUrl?: string,
    apiCert?: string,
  ): Promise<Record<string, unknown>[]> {
    const args: string[] = ['query', '--format', 'json'];

    if (serverUrl) {
      args.push('--server', serverUrl);
    }
    if (apiCert) {
      args.push('--api-cert', apiCert);
    }

    args.push('--', query);

    const cmd = `velociraptor ${args.join(' ')}`;

    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 300000,
    });

    if (stderr && !stderr.includes('WARNING')) {
      void stderr;
    }

    if (!stdout.trim()) return [];

    try {
      const parsed = JSON.parse(stdout);
      if (Array.isArray(parsed)) return parsed;
      return parsed.rows || parsed.results || [];
    } catch {
      const lines = stdout.split('\n').filter(l => l.trim());
      const results: Record<string, unknown>[] = [];
      for (const line of lines) {
        try {
          results.push(JSON.parse(line));
        } catch {
          continue;
        }
      }
      return results;
    }
  }

  private extractArtifactName(query: string): string {
    const match = query.match(/Artifact\.([A-Za-z.]+)\(\)/);
    return match ? match[1] : 'custom';
  }

  private convertToFindings(
    results: Record<string, Record<string, unknown>[]>,
    target: string,
  ): VulnerabilityFinding[] {
    const findings: VulnerabilityFinding[] = [];
    const now = Date.now();

    if (results['Windows.Network.Netstat'] || results['Network.Netstat']) {
      const rows = results['Windows.Network.Netstat'] || results['Network.Netstat'] || [];
      for (const row of rows) {
        const localAddr = String(row.local_address || row.LocalAddress || '0.0.0.0');
        const localPort = Number(row.local_port || row.LocalPort || 0);
        const remoteAddr = String(row.remote_address || row.RemoteAddress || '');
        const remotePort = Number(row.remote_port || row.RemotePort || 0);
        const state = String(row.state || row.State || '');
        const pid = row.pid != null ? String(row.pid) : row.Pid != null ? String(row.Pid) : '';
        const procName = String(row.process_name || row.Name || row.name || '');

        const isSuspicious = this.isSuspiciousConnection(remoteAddr, remotePort, state);
        if (isSuspicious) {
          const indicator = this.getConnectionIndicator(remoteAddr, remotePort);
          findings.push({
            id: `velociraptor-netstat-${localAddr}-${localPort}-${remoteAddr}-${remotePort}`,
            title: `Suspicious Network Connection: ${remoteAddr}:${remotePort}`,
            description: `Suspicious outbound connection detected. Local: ${localAddr}:${localPort} -> Remote: ${remoteAddr}:${remotePort} (State: ${state}). Process: ${procName} (PID: ${pid}). Indicator: ${indicator}`,
            severity: indicator === 'C2 beacon pattern' ? 'critical' : 'high',
            cvssScore: indicator === 'C2 beacon pattern' ? 9.8 : 7.5,
            affectedAsset: target,
            affectedComponent: `${procName}:${localPort}`,
            discoveredAt: now,
            fixSteps: [
              `Investigate process ${procName} (PID: ${pid})`,
              'Block outbound connection to suspicious IP if confirmed malicious',
              'Check for lateral movement indicators',
              'Review DNS resolution history for the remote address',
            ],
          });
        }
      }
    }

    if (results['Windows.System.Pslist'] || results['Linux.Sys.Processes'] || results['System.Pslist'] || results['Sys.Processes']) {
      const rows = results['Windows.System.Pslist'] || results['Linux.Sys.Processes'] || results['System.Pslist'] || results['Sys.Processes'] || [];
      for (const row of rows) {
        const procName = String(row.Name || row.name || row.process_name || '');
        const pid = row.pid != null ? String(row.pid) : row.Pid != null ? String(row.Pid) : '';
        const ppid = row.ppid != null ? String(row.ppid) : row.Ppid != null ? String(row.Ppid) : '';
        const cmdLine = String(row.CommandLine || row.command_line || row.cmdline || '');
        const createTime = String(row.CreateTime || row.create_time || '');

        const suspicious = this.isSuspiciousProcess(procName, cmdLine);
        if (suspicious) {
          findings.push({
            id: `velociraptor-proc-${pid}-${procName}`,
            title: `Suspicious Process: ${procName}`,
            description: `Suspicious process detected. Name: ${procName}, PID: ${pid}, PPID: ${ppid}. Command: ${cmdLine}. Started: ${createTime}`,
            severity: 'high',
            cvssScore: 8.0,
            affectedAsset: target,
            affectedComponent: procName,
            discoveredAt: now,
            fixSteps: [
              'Terminate suspicious process if confirmed malicious',
              'Investigate parent process chain',
              'Check for associated file artifacts',
              'Review process execution timeline',
              'Preserve forensic evidence before remediation',
            ],
          });
        }
      }
    }

    if (results['Windows.EventLogs.Evtx'] || results['EventLogs.Evtx']) {
      const rows = results['Windows.EventLogs.Evtx'] || results['EventLogs.Evtx'] || [];
      const seenEventIds = new Set<string>();
      for (const row of rows) {
        const eventId = String(row.EventID || row.event_id || row.EventId || '');
        const source = String(row.SourceName || row.source_name || '');
        const timeCreated = String(row.TimeCreated || row.time_created || '');
        const message = String(row.Message || row.message || '');
        const level = String(row.Level || row.level || '');

        if (!this.isSecurityEvent(eventId, level)) continue;

        const dedupeKey = `${eventId}-${timeCreated}`;
        if (seenEventIds.has(dedupeKey)) continue;
        seenEventIds.add(dedupeKey);

        const severity = this.assessEventSeverity(eventId, level);
        findings.push({
          id: `velociraptor-evtx-${eventId}-${timeCreated}`,
          title: `Security Event ${eventId}: ${source}`,
          description: `Windows security event detected. EventID: ${eventId}, Source: ${source}, Level: ${level}. Time: ${timeCreated}. ${message.substring(0, 500)}`,
          severity,
          cvssScore: severity === 'critical' ? 9.0 : severity === 'high' ? 7.5 : severity === 'medium' ? 5.0 : 3.0,
          affectedAsset: target,
          affectedComponent: `EventLog:${source}`,
          discoveredAt: now,
          fixSteps: [
            'Review event details in Windows Event Viewer',
            'Correlate with other security events in the timeline',
            'Determine if the event indicates an active attack',
            'Escalate if part of a broader attack pattern',
          ],
        });
      }
    }

    if (results['Windows.Registry.Amcache'] || results['Registry.Amcache']) {
      const rows = results['Windows.Registry.Amcache'] || results['Registry.Amcache'] || [];
      for (const row of rows) {
        const filePath = String(row.FilePath || row.file_path || row.Path || '');
        const sha1 = String(row.SHA1 || row.sha1 || '');
        const lastModified = String(row.LastModified || row.last_modified || '');
        const size = row.FileSize || row.file_size;

        if (filePath && (filePath.includes('\\Temp\\') || filePath.includes('\\Downloads\\') || filePath.includes('\\AppData\\'))) {
          findings.push({
            id: `velociraptor-amcache-${sha1 || filePath.substring(0, 40)}`,
            title: `Executed Binary from Suspicious Path: ${filePath.split('\\').pop()}`,
            description: `Binary executed from user-writable location. Path: ${filePath}, SHA1: ${sha1}, LastModified: ${lastModified}, Size: ${size}`,
            severity: 'medium',
            cvssScore: 5.5,
            affectedAsset: target,
            affectedComponent: filePath,
            discoveredAt: now,
            fixSteps: [
              'Verify binary legitimacy via SHA1 hash lookup',
              'Check VirusTotal or internal threat intelligence',
              'Review execution context and parent process',
              'Remove if confirmed malicious',
            ],
          });
        }
      }
    }

    if (results['Windows.NTFS.MFT'] || results['NTFS.MFT']) {
      const rows = results['Windows.NTFS.MFT'] || results['NTFS.MFT'] || [];
      const suspiciousExtensions = ['.ps1', '.bat', '.vbs', '.vbe', '.wsf', '.js', '.jse', '.hta', '.sct', '.xls', '.xlsx', '.doc', '.docm', '.xlsm'];
      let mftCount = 0;
      for (const row of rows) {
        const fileName = String(row.FileName || row.file_name || row.Name || '');
        const filePath = String(row.FilePath || row.file_path || row.FullPath || '');
        const ext = fileName.includes('.') ? `.${fileName.split('.').pop()!.toLowerCase()}` : '';

        if (suspiciousExtensions.includes(ext)) {
          mftCount++;
          if (mftCount <= 50) {
            findings.push({
              id: `velociraptor-mft-${filePath.substring(0, 80)}`,
              title: `Suspicious File in MFT: ${fileName}`,
              description: `Potentially interesting file type found in MFT. Name: ${fileName}, Path: ${filePath}, Extension: ${ext}`,
              severity: 'low',
              cvssScore: 2.0,
              affectedAsset: target,
              affectedComponent: filePath,
              discoveredAt: now,
            });
          }
        }
      }
      if (mftCount > 50) {
        this.updateLogForTask(target, `MFT scan found ${mftCount} suspicious files, only first 50 reported`);
      }
    }

    return findings;
  }

  private isSuspiciousConnection(remoteAddr: string, remotePort: number, state: string): boolean {
    if (!remoteAddr || remoteAddr === '0.0.0.0' || remoteAddr === '::' || remoteAddr === '[::]') {
      return false;
    }

    if (state === 'LISTEN') return false;

    const c2Ports = [4444, 5555, 6666, 6667, 6668, 6669, 7000, 8888, 9999, 31337, 1234, 12345];
    if (c2Ports.includes(remotePort)) return true;

    for (const pattern of KNOWN_C2_INDICATORS) {
      if (pattern.test(remoteAddr)) return false;
    }

    const privateIpPattern = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|127\.|169\.254\.)/;
    if (!privateIpPattern.test(remoteAddr) && remoteAddr !== '0.0.0.0') {
      return remotePort > 49152 || [4443, 8443, 9999, 8888].includes(remotePort);
    }

    return false;
  }

  private getConnectionIndicator(remoteAddr: string, remotePort: number): string {
    const c2Ports = [4444, 5555, 6666, 6667, 7000, 8888, 9999, 31337, 1234, 12345];
    if (c2Ports.includes(remotePort)) return 'C2 beacon pattern';

    const privateIpPattern = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|127\.|169\.254\.)/;
    if (!privateIpPattern.test(remoteAddr)) return 'External unknown connection';

    return 'Anomalous connection';
  }

  private isSuspiciousProcess(procName: string, cmdLine: string): boolean {
    const combined = `${procName} ${cmdLine}`;
    for (const pattern of SUSPICIOUS_PROCESS_NAMES) {
      if (pattern.test(combined)) return true;
    }
    return false;
  }

  private isSecurityEvent(eventId: string, level: string): boolean {
    const securityEventIds = [
      '4624', '4625', '4634', '4648', '4656', '4658',
      '4663', '4672', '4688', '4697', '4698', '4702',
      '4720', '4728', '4732', '4740', '4756', '4768',
      '4769', '4771', '4776', '4720', '4722', '4724',
      '4728', '4732', '4735', '4740', '4756', '4767',
      '4780', '4781', '4946', '4950', '4954', '4956',
      '1102', '4616', '4697',
    ];

    if (securityEventIds.includes(eventId)) return true;

    const criticalLevels = ['Critical', 'Error', '2', '1'];
    if (criticalLevels.includes(level)) return true;

    return false;
  }

  private assessEventSeverity(eventId: string, level: string): VulnerabilityFinding['severity'] {
    const criticalEvents = ['1102', '4616', '4697'];
    const highEvents = ['4625', '4648', '4672', '4688', '4720', '4740', '4767', '4780'];

    if (criticalEvents.includes(eventId)) return 'critical';
    if (highEvents.includes(eventId)) return 'high';
    if (level === 'Critical' || level === '2' || level === '1') return 'critical';
    if (level === 'Error' || level === '3') return 'high';
    return 'medium';
  }

  private updateLogForTask(_target: string, _message: string): void {
    void _target;
    void _message;
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
