/**
 * sc-forensics-workstation.ts - Digital Forensics Case Management (Security Ops Dark Capability)
 * Case creation, evidence management, artifact analysis, hash verification,
 * chain of custody tracking, timeline reconstruction, report generation
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';

type CasePriority = 'critical' | 'high' | 'medium' | 'low';
type CaseStatus = 'open' | 'in-progress' | 'suspended' | 'closed';
type EvidenceType = 'disk-image' | 'memory-dump' | 'log-file' | 'network-capture' | 'malware-sample' | 'document' | 'email-archive' | 'registry-hive' | 'mobile-extract';
type ArtifactCategory = 'filesystem' | 'registry' | 'network' | 'process' | 'memory' | 'timeline' | 'browser' | 'email' | 'credential';
type HashAlgorithm = 'md5' | 'sha1' | 'sha256';

interface Case {
  id: string; name: string; priority: CasePriority; status: CaseStatus; description: string;
  client: string; investigator: string; createdAt: string; updatedAt: string; closedAt: string;
  tags: string[]; notes: string[];
}

interface EvidenceItem {
  id: string; caseId: string; name: string; type: EvidenceType; source: string;
  size: string; hashMd5: string; hashSha1: string; hashSha256: string;
  collectedAt: string; collectedBy: string; chainOfCustody: { action: string; by: string; at: string; notes: string }[];
  verified: boolean; analysisStatus: 'pending' | 'analyzing' | 'complete' | 'skipped';
}

interface ForensicArtifact {
  id: string; caseId: string; evidenceId: string; category: ArtifactCategory;
  name: string; description: string; timestamp: string; severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  source: string; data: string; tags: string[];
}

interface AnalysisResult {
  id: string; caseId: string; type: string; findings: ForensicArtifact[];
  startedAt: string; completedAt: string; status: 'running' | 'complete' | 'error';
  summary: string;
}

@customElement('sc-forensics-workstation')
export class ScForensicsWorkstation extends LitElement {
  @property({ type: String }) panelId = 'forensics-workstation';
  @state() private _cases: Case[] = [];
  @state() private _activeCase: Case | null = null;
  @state() private _evidence: EvidenceItem[] = [];
  @state() private _artifacts: ForensicArtifact[] = [];
  @state() private _analyses: AnalysisResult[] = [];
  @state() private _activeTab: 'cases' | 'evidence' | 'analysis' | 'artifacts' | 'timeline' | 'report' = 'cases';
  @state() private _newCaseName = '';
  @state() private _newCaseDesc = '';
  @state() private _newCasePriority: CasePriority = 'medium';
  @state() private _newCaseClient = '';
  @state() private _newCaseTags = '';
  @state() private _output: string[] = [];
  @state() private _progress = 0;
  @state() private _analysisRunning = false;

  @state() private _showExport = false;
  @state() private _showApproval = false;
  @state() private _selectedForBatch: Set<string> = new Set();
  @state() private _showRiskScoring = false;

  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: var(--text-primary, #e2e8f0); }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: var(--bg-primary, #0f1117); border-radius: 12px; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
    .title { font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid #2a2d3a; flex-wrap: wrap; }
    .tab { padding: 8px 16px; cursor: pointer; border: none; background: none; color: #6b7280; font-size: 13px; font-weight: 500; border-bottom: 2px solid transparent; }
    .tab:hover { color: #d1d5db; }
    .tab.active { color: #e2e8f0; border-bottom-color: #3b82f6; }
    .btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; font-family: inherit; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: #3b82f6; color: white; }
    .btn-primary:hover:not(:disabled) { background: #2563eb; }
    .btn-danger { background: #dc2626; color: white; }
    .btn-secondary { background: #374151; color: #d1d5db; }
    .btn-sm { padding: 4px 10px; font-size: 11px; }
    .btn-row { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-group.full { grid-column: 1 / -1; }
    label { font-size: 12px; color: #9ca3af; font-weight: 500; }
    input, select, textarea { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 6px; padding: 8px 12px; color: #e2e8f0; font-size: 13px; outline: none; font-family: inherit; }
    input:focus, select:focus, textarea:focus { border-color: #3b82f6; }
    textarea { resize: vertical; min-height: 60px; }
    .case-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px; }
    .case-card { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 14px; cursor: pointer; transition: all 0.2s; }
    .case-card:hover { border-color: #3b82f6; }
    .case-card.active { border-color: #3b82f6; background: #1e293b; }
    .case-name { font-weight: 700; font-size: 14px; margin-bottom: 4px; }
    .case-desc { font-size: 12px; color: #9ca3af; margin-bottom: 8px; }
    .case-meta { font-size: 11px; color: #6b7280; display: flex; gap: 12px; flex-wrap: wrap; }
    .tag { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #374151; color: #d1d5db; }
    .priority-critical { color: #f87171; }
    .priority-high { color: #f97316; }
    .priority-medium { color: #fbbf24; }
    .priority-low { color: #34d399; }
    .evidence-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .evidence-table th { text-align: left; padding: 8px 10px; background: #1a1d27; color: #9ca3af; font-weight: 600; border-bottom: 1px solid #2a2d3a; }
    .evidence-table td { padding: 8px 10px; border-bottom: 1px solid #1a1d27; }
    .hash-value { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #9ca3af; word-break: break-all; }
    .artifact-card { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 12px; margin-bottom: 8px; border-left: 3px solid; }
    .artifact-critical { border-left-color: #dc2626; }
    .artifact-high { border-left-color: #f97316; }
    .artifact-medium { border-left-color: #fbbf24; }
    .artifact-low { border-left-color: #3b82f6; }
    .artifact-info { border-left-color: #6b7280; }
    .artifact-name { font-weight: 600; font-size: 13px; margin-bottom: 4px; }
    .artifact-desc { font-size: 12px; color: #9ca3af; margin-bottom: 4px; }
    .artifact-meta { font-size: 11px; color: #6b7280; display: flex; gap: 12px; }
    .timeline-view { position: relative; padding-left: 24px; border-left: 2px solid #2a2d3a; margin: 12px 0; }
    .timeline-item { position: relative; padding: 8px 0 8px 16px; font-size: 12px; }
    .timeline-item::before { content: ''; position: absolute; left: -29px; top: 12px; width: 10px; height: 10px; border-radius: 50%; border: 2px solid #3b82f6; background: #0f1117; }
    .timeline-item.critical::before { border-color: #dc2626; background: #dc2626; }
    .timeline-item.high::before { border-color: #f97316; background: #f97316; }
    .timeline-time { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #6b7280; }
    .timeline-text { margin-top: 2px; }
    .output-box { background: #0a0c10; border: 1px solid #1a1d27; border-radius: 8px; padding: 12px; font-family: 'JetBrains Mono', monospace; font-size: 12px; line-height: 1.6; max-height: 300px; overflow-y: auto; white-space: pre-wrap; }
    .output-info { color: #60a5fa; }
    .output-success { color: #34d399; }
    .output-error { color: #f87171; }
    .output-warn { color: #fbbf24; }
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
    .stat { background: #1a1d27; border-radius: 8px; padding: 12px; text-align: center; }
    .stat-value { font-size: 22px; font-weight: 700; }
    .stat-label { font-size: 10px; color: #9ca3af; margin-top: 2px; }
    .progress-bar { width: 100%; height: 8px; background: #1a1d27; border-radius: 4px; overflow: hidden; margin: 12px 0; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); border-radius: 4px; transition: width 0.5s; }
    .empty-state { text-align: center; padding: 40px; color: #6b7280; }
    @media (max-width: 768px) {
      .form-grid { grid-template-columns: 1fr; }
      .stat-grid { grid-template-columns: repeat(2, 1fr); }
      .case-grid { grid-template-columns: 1fr; }
    }

    .wizard-num { width: 24px; height: 24px; border-radius: 50%; background: #374151; color: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
    .wizard-num.active { background: #8b5cf6; }
    .wizard-num.done { background: #22c55e; }
    .mitre-tag { display: inline-block; font-size: 9px; padding: 1px 5px; border-radius: 3px; background: #312e81; color: #a5b4fc; margin-right: 3px; }
    .export-panel { background: #0f172a; border: 1px solid #374151; border-radius: 10px; padding: 16px; margin-bottom: 12px; }
    .export-btn { padding: 8px 16px; border-radius: 6px; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; font-size: 11px; font-weight: 600; cursor: pointer; margin-right: 6px; }
    .export-btn:hover { border-color: #8b5cf6; background: #8b5cf620; }
    .risk-bar-track { flex: 1; height: 6px; background: #1f2937; border-radius: 3px; overflow: hidden; }
    .risk-bar-fill { height: 100%; border-radius: 3px; }
    .cb { width: 14px; height: 14px; accent-color: #8b5cf6; cursor: pointer; }
    .batch-bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #1e1b4b; border-radius: 8px; margin-bottom: 10px; font-size: 11px; }
    .batch-bar button { padding: 4px 12px; border-radius: 5px; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; font-size: 10px; font-weight: 600; cursor: pointer; }
    .batch-bar button:hover { background: #8b5cf630; border-color: #8b5cf6; }
    .approval-modal { background: #0f172a; border: 1px solid #374151; border-radius: 10px; padding: 16px; margin-bottom: 12px; }
    .heatmap-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
    .heatmap-cell { width: 100%; aspect-ratio: 1; border-radius: 3px; }
    .risk-gauge { background: #1f2937; border-radius: 8px; padding: 14px; margin-bottom: 12px; }
    .gauge-row { display: flex; justify-content: space-around; margin-top: 8px; }
    .gauge-item { text-align: center; }
    .gauge-item .gauge-val { font-size: 20px; font-weight: 700; }
    .gauge-item .gauge-lbl { font-size: 10px; color: #6b7280; }
    .comment-section { background: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 14px; margin-bottom: 12px; }
    .comment-item { display: flex; gap: 10px; padding: 8px 0; border-bottom: 1px solid #1f2937; }
    .comment-item:last-child { border-bottom: none; }
    .comment-avatar { width: 28px; height: 28px; border-radius: 50%; background: #374151; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
    .comment-text { font-size: 12px; color: #d1d5db; margin-top: 2px; }
    .footer-bar { margin-top: 12px; padding-top: 8px; border-top: 1px solid #374151; display: flex; justify-content: space-between; font-size: 10px; color: #6b7280; }
    .footer-actions { display: flex; gap: 8px; margin-top: 6px; }
    .footer-btn { flex: 1; padding: 8px; border-radius: 6px; border: 1px solid #374151; background: #1f2937; color: #94a3b8; font-size: 11px; cursor: pointer; text-align: center; }
    .footer-btn:hover { border-color: #8b5cf6; color: #e2e8f0; }
    .dist-bar { display: flex; height: 12px; border-radius: 6px; overflow: hidden; gap: 1px; margin-bottom: 6px; }
    .dist-legend { display: flex; gap: 12px; font-size: 9px; color: #6b7280; }
    .dist-legend span { display: inline-flex; align-items: center; gap: 3px; }
    .dist-dot { width: 8px; height: 8px; border-radius: 2px; display: inline-block; }
  `;

  private _createCase(): void {
    if (!this._newCaseName.trim()) return;
    const newCase: Case = {
      id: 'FWD-' + Date.now().toString(36).toUpperCase(),
      name: this._newCaseName, priority: this._newCasePriority,
      status: 'open', description: this._newCaseDesc,
      client: this._newCaseClient, investigator: 'Analyst',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), closedAt: '',
      tags: this._newCaseTags.split(',').map(t => t.trim()).filter(Boolean),
      notes: [],
    };
    this._cases = [newCase, ...this._cases];
    this._activeCase = newCase;
    this._evidence = [];
    this._artifacts = [];
    this._newCaseName = '';
    this._newCaseDesc = '';
    this._newCaseClient = '';
    this._newCaseTags = '';
    this._activeTab = 'evidence';
  }

  private _addEvidence(): void {
    if (!this._activeCase) return;
    const types: EvidenceType[] = ['disk-image', 'memory-dump', 'log-file', 'network-capture', 'malware-sample', 'document', 'email-archive', 'registry-hive', 'mobile-extract'];
    const type = types[Math.floor(Math.random() * types.length)];
    const randHex = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const item: EvidenceItem = {
      id: 'EV-' + Date.now().toString(36).toUpperCase(),
      caseId: this._activeCase.id, name: `Evidence_${type}_${Date.now().toString(36)}`, type,
      source: 'Collected from workstation', size: `${(Math.random() * 100).toFixed(1)} GB`,
      hashMd5: randHex(32), hashSha1: randHex(40), hashSha256: randHex(64),
      collectedAt: new Date().toISOString(), collectedBy: 'Analyst',
      chainOfCustody: [{ action: 'Collected', by: 'Analyst', at: new Date().toISOString(), notes: 'Initial collection with write blocker' }],
      verified: false, analysisStatus: 'pending',
    };
    this._evidence = [...this._evidence, item];
  }

  private _runAnalysis(): void {
    if (!this._activeCase || this._analysisRunning || this._evidence.length === 0) return;
    this._analysisRunning = true;
    this._output = [];
    this._progress = 0;
    this._activeTab = 'analysis';
    const analysis: AnalysisResult = {
      id: 'AN-' + Date.now().toString(36).toUpperCase(),
      caseId: this._activeCase.id, type: 'Full forensic analysis',
      findings: [], startedAt: new Date().toISOString(), completedAt: '', status: 'running',
      summary: '',
    };
    this._output.push(`[*] Starting forensic analysis for case ${this._activeCase.id}`);
    this._output.push(`[*] Evidence items: ${this._evidence.length}`);

    const steps = [
      { name: 'Hash verification', artifacts: this._generateFilesystemArtifacts() },
      { name: 'Filesystem analysis', artifacts: this._generateFilesystemArtifacts() },
      { name: 'Registry analysis', artifacts: this._generateRegistryArtifacts() },
      { name: 'Network artifact extraction', artifacts: this._generateNetworkArtifacts() },
      { name: 'Timeline reconstruction', artifacts: this._generateTimelineArtifacts() },
      { name: 'Browser history analysis', artifacts: this._generateBrowserArtifacts() },
      { name: 'Credential recovery', artifacts: this._generateCredentialArtifacts() },
    ];

    let stepIdx = 0;
    const runStep = () => {
      if (stepIdx >= steps.length) {
        analysis.status = 'complete';
        analysis.completedAt = new Date().toISOString();
        analysis.summary = `Found ${analysis.findings.length} artifacts across ${steps.length} analysis categories. ${analysis.findings.filter(f => f.severity === 'critical' || f.severity === 'high').length} high-severity findings.`;
        this._analyses = [analysis, ...this._analyses];
        this._artifacts = [...analysis.findings, ...this._artifacts];
        this._analysisRunning = false;
        this._output.push('');
        this._output.push(`[+] Analysis complete: ${analysis.findings.length} artifacts found`);
        this._output.push(`[*] Critical: ${analysis.findings.filter(f => f.severity === 'critical').length}`);
        this._output.push(`[*] High: ${analysis.findings.filter(f => f.severity === 'high').length}`);
        this._output.push(`[*] Medium: ${analysis.findings.filter(f => f.severity === 'medium').length}`);
        this._output.push(`[*] Low: ${analysis.findings.filter(f => f.severity === 'low').length}`);
        this.requestUpdate();
        return;
      }
      const step = steps[stepIdx];
      this._output.push(`[*] Running: ${step.name}...`);
      step.artifacts.forEach(a => {
        a.id = 'FA-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5);
        a.caseId = this._activeCase!.id;
        analysis.findings.push(a);
        this._output.push(`  [${a.severity === 'critical' ? '!' : a.severity === 'high' ? '+' : '-'}] ${a.name}: ${a.description}`);
      });
      this._progress = Math.round(((stepIdx + 1) / steps.length) * 100);
      this.requestUpdate();
      stepIdx++;
      setTimeout(runStep, 600 + Math.random() * 400);
    };
    setTimeout(runStep, 300);
  }

  private _generateFilesystemArtifacts(): ForensicArtifact[] {
    const artifacts: ForensicArtifact[] = [];
    const r = Math.random;
    if (r() > 0.3) artifacts.push({ id: '', caseId: '', evidenceId: '', category: 'filesystem', name: 'Deleted file recovery', description: 'Recovered deleted files from unallocated space - found potentially sensitive documents', timestamp: new Date(Date.now() - r() * 86400000 * 7).toISOString(), severity: r() > 0.5 ? 'high' : 'medium', source: 'MFT analysis', data: '15 files recovered, 3 contain PII', tags: ['deleted-files', 'mft'] });
    if (r() > 0.5) artifacts.push({ id: '', caseId: '', evidenceId: '', category: 'filesystem', name: 'Suspicious executable found', description: 'Unknown PE binary in AppData\\Roaming with recent modification time', timestamp: new Date(Date.now() - r() * 86400000 * 3).toISOString(), severity: 'critical', source: 'File system scan', data: 'C:\\Users\\victim\\AppData\\Roaming\\svchost_up.exe', tags: ['malware', 'persistence'] });
    if (r() > 0.4) artifacts.push({ id: '', caseId: '', evidenceId: '', category: 'filesystem', name: 'Alternate data streams detected', description: 'Hidden data in NTFS alternate data streams on multiple files', timestamp: new Date(Date.now() - r() * 86400000 * 2).toISOString(), severity: 'medium', source: 'ADS enumeration', data: '4 files with ADS, total 2.3 MB hidden data', tags: ['ads', 'steganography'] });
    return artifacts;
  }

  private _generateRegistryArtifacts(): ForensicArtifact[] {
    const artifacts: ForensicArtifact[] = [];
    const r = Math.random;
    if (r() > 0.3) artifacts.push({ id: '', caseId: '', evidenceId: '', category: 'registry', name: 'Persistence registry key', description: 'Autorun entry added for suspicious binary in HKLM Run key', timestamp: new Date(Date.now() - r() * 86400000 * 5).toISOString(), severity: 'critical', source: 'Registry hive analysis', data: 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run\\UpdateService', tags: ['persistence', 'registry'] });
    if (r() > 0.5) artifacts.push({ id: '', caseId: '', evidenceId: '', category: 'registry', name: 'USB device history', description: 'Found evidence of USB mass storage device connected recently', timestamp: new Date(Date.now() - r() * 86400000 * 1).toISOString(), severity: 'medium', source: 'USBSTOR registry key', data: 'USB\\VID_0781&PID_5581\\Serial - SanDisk 64GB', tags: ['usb', 'removable-media'] });
    if (r() > 0.6) artifacts.push({ id: '', caseId: '', evidenceId: '', category: 'registry', name: 'UserAssist log cleared', description: 'UserAssist registry key shows evidence of clearing activity', timestamp: new Date(Date.now() - r() * 86400000 * 1).toISOString(), severity: 'low', source: 'UserAssist analysis', data: 'Last cleared 2 hours before incident', tags: ['anti-forensics', 'registry'] });
    return artifacts;
  }

  private _generateNetworkArtifacts(): ForensicArtifact[] {
    const artifacts: ForensicArtifact[] = [];
    const r = Math.random;
    if (r() > 0.3) artifacts.push({ id: '', caseId: '', evidenceId: '', category: 'network', name: 'Suspicious DNS queries', description: 'High volume DNS queries to known-bad domains with DGA patterns', timestamp: new Date(Date.now() - r() * 86400000 * 2).toISOString(), severity: 'high', source: 'DNS cache analysis', data: '247 queries to 15 DGA domains in 4 hours', tags: ['dns', 'dga', 'c2'] });
    if (r() > 0.5) artifacts.push({ id: '', caseId: '', evidenceId: '', category: 'network', name: 'Outbound connection to C2', description: 'HTTPS beaconing pattern detected to external IP at regular intervals', timestamp: new Date(Date.now() - r() * 86400000 * 1).toISOString(), severity: 'critical', source: 'PCAP analysis', data: '10.0.0.5 -> 185.220.101.xx:443 every 60s', tags: ['beaconing', 'c2', 'https'] });
    return artifacts;
  }

  private _generateTimelineArtifacts(): ForensicArtifact[] {
    const artifacts: ForensicArtifact[] = [];
    const r = Math.random;
    if (r() > 0.3) artifacts.push({ id: '', caseId: '', evidenceId: '', category: 'timeline', name: 'System time anomaly', description: 'System clock shows evidence of time manipulation around incident window', timestamp: new Date(Date.now() - r() * 86400000 * 3).toISOString(), severity: 'high', source: 'Event log timeline', data: 'Clock adjusted by -2h during incident window', tags: ['anti-forensics', 'time-manipulation'] });
    if (r() > 0.4) artifacts.push({ id: '', caseId: '', evidenceId: '', category: 'timeline', name: 'Event log gaps detected', description: 'Security event log shows 4-hour gap during active compromise period', timestamp: new Date(Date.now() - r() * 86400000 * 2).toISOString(), severity: 'critical', source: 'Windows Event Log', data: 'Event ID 1102 (Audit log cleared) at 02:15 UTC', tags: ['log-clearing', 'anti-forensics'] });
    return artifacts;
  }

  private _generateBrowserArtifacts(): ForensicArtifact[] {
    const artifacts: ForensicArtifact[] = [];
    const r = Math.random;
    if (r() > 0.4) artifacts.push({ id: '', caseId: '', evidenceId: '', category: 'browser', name: 'Suspicious browser history', description: 'Visited phishing URLs and credential submission pages', timestamp: new Date(Date.now() - r() * 86400000 * 3).toISOString(), severity: 'high', source: 'Chrome History DB', data: '12 visits to credential-harvesting pages', tags: ['browser', 'phishing', 'credentials'] });
    if (r() > 0.5) artifacts.push({ id: '', caseId: '', evidenceId: '', category: 'browser', name: 'Saved passwords found', description: 'Browser autofill contains sensitive credentials', timestamp: new Date(Date.now() - r() * 86400000 * 5).toISOString(), severity: 'medium', source: 'Chrome Login Data', data: '8 saved credentials including corporate accounts', tags: ['credentials', 'browser'] });
    return artifacts;
  }

  private _generateCredentialArtifacts(): ForensicArtifact[] {
    const artifacts: ForensicArtifact[] = [];
    const r = Math.random;
    if (r() > 0.4) artifacts.push({ id: '', caseId: '', evidenceId: '', category: 'credential', name: 'Cracked password hash', description: 'NTLM hash cracked for privileged account using dictionary attack', timestamp: new Date(Date.now() - r() * 86400000 * 2).toISOString(), severity: 'critical', source: 'Hash cracking', data: 'Administrator:500:aad3b435b51404ee:aed7268e39... -> Password1!', tags: ['credentials', 'hash-cracking', 'privilege-escalation'] });
    if (r() > 0.6) artifacts.push({ id: '', caseId: '', evidenceId: '', category: 'credential', name: 'WiFi passwords recovered', description: 'Recovered stored WiFi credentials from system', timestamp: new Date(Date.now() - r() * 86400000 * 1).toISOString(), severity: 'low', source: 'Windows Credential Manager', data: '5 WiFi networks with plaintext passwords', tags: ['wifi', 'credentials'] });
    return artifacts;
  }

  private _exportReport(): void {
    if (!this._activeCase) return;
    const caseArtifacts = this._artifacts.filter(a => a.caseId === this._activeCase!.id);
    const report = {
      case: this._activeCase, evidenceCount: this._evidence.length,
      artifactCount: caseArtifacts.length,
      artifactsBySeverity: {
        critical: caseArtifacts.filter(a => a.severity === 'critical').length,
        high: caseArtifacts.filter(a => a.severity === 'high').length,
        medium: caseArtifacts.filter(a => a.severity === 'medium').length,
        low: caseArtifacts.filter(a => a.severity === 'low').length,
      },
      evidence: this._evidence,
      artifacts: caseArtifacts,
      analyses: this._analyses.filter(a => a.caseId === this._activeCase!.id),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `forensics-report-${this._activeCase.id}.json`; a.click();
    URL.revokeObjectURL(url);
  }


  private _mitreTechniques = ['T1059', 'T1078', 'T1566', 'T1190'];

  private _computeRiskScore(item: { id: string; risk: string; status: string }): number {
    const riskW: Record<string, number> = { critical: 40, high: 30, medium: 20, low: 10 };
    const statusW: Record<string, number> = { active: 0, reviewing: -5, flagged: 10, completed: -15, expired: 5 };
    return Math.max(0, Math.min(100, (riskW[item.risk] || 20) + (statusW[item.status] || 0)));
  }

  private _riskColor(score: number): string {
    if (score >= 80) return '#ef4444';
    if (score >= 60) return '#f97316';
    if (score >= 40) return '#eab308';
    return '#22c55e';
  }

  private _riskLabel(score: number): string {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  }

  private _exportData(format: string) {
    const blob = new Blob(['forensics-workstation export'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'forensics-workstation-export.' + (format === 'markdown' ? 'md' : format); a.click();
    URL.revokeObjectURL(url);
    this._showExport = false;
  }

  private _renderExportPanel() {
    return html`<div class="export-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-size:13px;font-weight:700">Export Data</div>
        <button class="detail-close" style="background:#374151;border:none;color:#94a3b8;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:11px" @click=${() => { this._showExport = false; }}>\u2715</button>
      </div>
      <div style="display:flex;gap:8px">
        <button class="export-btn" @click=${() => this._exportData('csv')}>CSV</button>
        <button class="export-btn" @click=${() => this._exportData('json')}>JSON</button>
        <button class="export-btn" @click=${() => this._exportData('markdown')}>Markdown</button>
      </div>
    </div>`;
  }

  private _renderPlaybook() {
    const steps: [string, string][] = [
      ['Identify', 'Identify relevant items and scope the analysis'],
      ['Assess', 'Evaluate current state against security requirements'],
      ['Plan', 'Develop prioritized remediation plan'],
      ['Implement', 'Execute remediation actions with proper controls'],
      ['Verify', 'Validate remediation effectiveness through testing'],
      ['Report', 'Document results, metrics, and lessons learned'],
    ];
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Panel Playbook</div>
      ${steps.map((s: [string, string], i: number) => html`
        <div style="display:flex;align-items:center;gap:10px;${i < steps.length - 1 ? 'margin-bottom:4px' : ''}">
          <div class="wizard-num ${i < 3 ? 'done' : i === 3 ? 'active' : ''}">${i < 3 ? '\u2713' : (i + 1).toString()}</div>
          <div style="flex:1">
            <div style="font-size:12px;font-weight:600;${i === 3 ? 'color:#8b5cf6' : i < 3 ? 'color:#22c55e' : 'color:#6b7280'}">${s[0]}</div>
            <div style="font-size:10px;color:#6b7280">${s[1]}</div>
          </div>
        </div>
      `)}
    </div>`;
  }

  private _renderDecisionTree() {
    const nodes: [string, string][] = [
      ['Is the item high-risk or critical?', 'YES -> Immediate action required | NO -> Standard process'],
      ['Is there an existing control?', 'YES -> Verify effectiveness | NO -> Implement new control'],
      ['Is remediation within SLA?', 'YES -> Continue monitoring | NO -> Escalate to management'],
      ['Is the item recurring?', 'YES -> Automate detection and response | NO -> One-time remediation'],
    ];
    return html`<div style="background:#0f172a;border-radius:8px;padding:12px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Decision Tree</div>
      ${nodes.map((n: [string, string]) => html`
        <div style="margin-bottom:8px">
          <div style="font-size:11px;color:#e2e8f0;font-weight:600">${n[0]}</div>
          <div style="margin-left:20px;font-size:10px;color:#94a3b8;margin-top:2px">${n[1]}</div>
        </div>
      `)}
    </div>`;
  }

  private _renderKPIs() {
    const kpis: [string, string, string, string][] = [
      ['Total Items', '142', '+5', '#3b82f6'],
      ['High Risk', '23', '-2', '#ef4444'],
      ['Compliance Rate', '94%', '+3%', '#22c55e'],
      ['Pending Actions', '12', '-4', '#f97316'],
    ];
    return html`<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:12px">
      ${kpis.map((k: [string, string, string, string]) => html`
        <div style="background:#0f172a;border-radius:8px;padding:12px;border-left:3px solid ${k[3]}">
          <div style="font-size:10px;color:#6b7280;text-transform:uppercase">${k[0]}</div>
          <div style="font-size:20px;font-weight:700;color:${k[3]}">${k[1]}</div>
          <div style="font-size:10px;color:${k[2].startsWith('+') ? '#22c55e' : '#ef4444'}">${k[2].startsWith('+') ? '\u25B2' : '\u25BC'} ${k[2]} vs last period</div>
        </div>
      `)}
    </div>`;
  }

  private _renderHeatmap() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const heatColor = (v: number) => v >= 10 ? '#ef4444' : v >= 7 ? '#f97316' : v >= 4 ? '#eab308' : v >= 2 ? '#22c55e80' : '#22c55e30';
    const grouped: { day: string; hours: { hour: number; value: number }[] }[] = [];
    for (const d of days) {
      const hours: { hour: number; value: number }[] = [];
      for (let h = 0; h < 24; h++) {
        const base = (h >= 8 && h <= 18) ? 5 : 1;
        const wknd = (d === 'Sat' || d === 'Sun') ? 0.3 : 1;
        hours.push({ hour: h, value: Math.round((base + Math.random() * 8) * wknd) });
      }
      grouped.push({ day: d, hours });
    }
    return html`<div style="background:#0f172a;border-radius:8px;padding:12px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">Activity Heatmap</div>
      <div style="display:flex;gap:4px;align-items:center;margin-bottom:4px">
        <span style="width:30px;font-size:9px;color:#6b7280"></span>
        ${Array.from({ length: 24 }, (_, i) => html`<div style="flex:1;text-align:center;font-size:8px;color:#6b7280">${i}</div>`)}
      </div>
      ${grouped.map(d => html`<div style="display:flex;gap:4px;align-items:center;margin-bottom:2px">
        <span style="width:30px;font-size:9px;color:#6b7280">${d.day}</span>
        ${d.hours.map(h => html`<div class="heatmap-cell" style="flex:1;background:${heatColor(h.value)}" title="${d.day} ${h.hour}:00 - ${h.value} events"></div>`)}
      </div>`)}
      <div style="display:flex;gap:8px;margin-top:6px;font-size:9px;color:#6b7280;align-items:center">
        <span>Low</span><div style="width:12px;height:8px;border-radius:2px;background:#22c55e30"></div>
        <div style="width:12px;height:8px;border-radius:2px;background:#eab308"></div>
        <div style="width:12px;height:8px;border-radius:2px;background:#ef4444"></div><span>High</span>
      </div>
    </div>`;
  }

  private _approvalQueue = [
    { id: 'APR-001', item: 'Review pending', requestor: 'Team Lead', action: 'Approve changes', status: 'pending', submittedAt: '2026-04-21T10:00:00' },
    { id: 'APR-002', item: 'Policy update', requestor: 'Compliance', action: 'Update document', status: 'pending', submittedAt: '2026-04-20T14:00:00' },
    { id: 'APR-003', item: 'Access request', requestor: 'IT Ops', action: 'Grant access', status: 'approved', submittedAt: '2026-04-19T09:00:00' },
  ];

  private _renderApprovalWorkflow() {
    const pending = this._approvalQueue.filter(a => a.status === 'pending');
    const resolved = this._approvalQueue.filter(a => a.status !== 'pending');
    return html`<div class="approval-modal">
      <div style="font-size:13px;font-weight:700;margin-bottom:12px">Approval Queue (${pending.length} pending)</div>
      ${pending.map(a => html`<div style="background:#1f2937;border-radius:8px;padding:10px;margin-bottom:8px;border-left:3px solid #f97316">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><div style="font-weight:600;font-size:12px">${a.id}: ${a.action}</div>
          <div style="font-size:10px;color:#6b7280;margin-top:2px">By: ${a.requestor} | ${a.submittedAt}</div></div>
          <div style="display:flex;gap:4px">
            <button class="export-btn" style="border-color:#22c55e;color:#22c55e;padding:4px 10px" @click=${() => { a.status = 'approved'; this.requestUpdate(); }}>Approve</button>
            <button class="export-btn" style="border-color:#ef4444;color:#ef4444;padding:4px 10px" @click=${() => { a.status = 'rejected'; this.requestUpdate(); }}>Reject</button>
          </div>
        </div>
      </div>`)}
      ${resolved.map(a => html`<div style="background:#1f2937;border-radius:6px;padding:8px;margin-bottom:4px;opacity:0.6">
        <div style="display:flex;justify-content:space-between;font-size:11px"><span>${a.id}: ${a.action}</span>
        <span style="color:${a.status === 'approved' ? '#22c55e' : '#ef4444'}">${a.status}</span></div>
      </div>`)}
    </div>`;
  }

  private _renderRiskScoringTable() {
    const items = this._items || [];
    return html`<div class="approval-modal">
      <div style="font-size:13px;font-weight:700;margin-bottom:12px">Risk Scoring Analysis</div>
      <table style="width:100%;border-collapse:collapse;font-size:11px">
        <thead><tr><th style="text-align:left;padding:6px 8px;background:#0f172a;color:#94a3b8;font-size:9px;text-transform:uppercase;border-bottom:1px solid #374151">Item</th><th style="text-align:left;padding:6px 8px;background:#0f172a;color:#94a3b8;font-size:9px;text-transform:uppercase;border-bottom:1px solid #374151">Score</th><th style="text-align:left;padding:6px 8px;background:#0f172a;color:#94a3b8;font-size:9px;text-transform:uppercase;border-bottom:1px solid #374151">Level</th></tr></thead>
        <tbody>${items.map((item: { id: string; name: string; risk: string; status: string }) => {
          const score = this._computeRiskScore(item);
          return html`<tr><td style="padding:6px 8px;border-bottom:1px solid #1f2937">${item.name}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #1f2937"><div style="display:flex;align-items:center;gap:6px">
              <span style="font-weight:700;color:${this._riskColor(score)}">${score}</span>
              <div class="risk-bar-track"><div class="risk-bar-fill" style="width:${score}%;background:${this._riskColor(score)}"></div></div></div></td>
            <td style="padding:6px 8px;border-bottom:1px solid #1f2937"><span style="color:${this._riskColor(score)};font-size:10px;font-weight:600">${this._riskLabel(score)}</span></td></tr>`;
        })}</tbody></table>
    </div>`;
  }

  // --- Forensic Risk Scoring Engine ---
  private _riskFactors: Record<string, { weight: number; label: string; description: string }> = {
    criticalArtifacts: { weight: 0.25, label: 'Critical Findings', description: 'High-severity artifacts discovered' },
    evidenceIntegrity: { weight: 0.20, label: 'Evidence Integrity', description: 'Hash verification and chain of custody status' },
    caseAge: { weight: 0.15, label: 'Case Age', description: 'Time elapsed since case creation' },
    artifactDensity: { weight: 0.15, label: 'Artifact Density', description: 'Number of artifacts per evidence item' },
    analysisCoverage: { weight: 0.15, label: 'Analysis Coverage', description: 'Percentage of evidence analyzed' },
    timelineGaps: { weight: 0.10, label: 'Timeline Gaps', description: 'Unexplained time periods in event timeline' },
  };

  private _computeForensicRisk(): { score: number; factors: { name: string; score: number; weight: number; label: string }[]; level: string } {
    const factors: { name: string; score: number; weight: number; label: string }[] = [];
    const caseArtifacts = this._artifacts.filter(a => this._activeCase && a.caseId === this._activeCase.id);
    const criticalCount = caseArtifacts.filter(a => a.severity === 'critical').length;
    const highCount = caseArtifacts.filter(a => a.severity === 'high').length;
    const totalArtifacts = caseArtifacts.length;
    const verifiedEvidence = this._evidence.filter(e => e.verified && (!this._activeCase || e.caseId === this._activeCase.id)).length;
    const totalEvidence = this._evidence.filter(e => !this._activeCase || e.caseId === this._activeCase.id).length;
    const caseAge = this._activeCase ? (Date.now() - new Date(this._activeCase.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 0;
    const analyzedEvidence = this._evidence.filter(e => e.analysisStatus === 'complete' && (!this._activeCase || e.caseId === this._activeCase.id)).length;

    // Critical artifacts factor (0-100)
    const critScore = Math.min(100, (criticalCount * 30 + highCount * 15));
    factors.push({ name: 'criticalArtifacts', score: critScore, weight: this._riskFactors.criticalArtifacts.weight, label: this._riskFactors.criticalArtifacts.label });

    // Evidence integrity factor (0-100, inverted: higher = better)
    const integrityScore = totalEvidence > 0 ? Math.round((verifiedEvidence / totalEvidence) * 100) : 50;
    factors.push({ name: 'evidenceIntegrity', score: 100 - integrityScore, weight: this._riskFactors.evidenceIntegrity.weight, label: this._riskFactors.evidenceIntegrity.label });

    // Case age factor (0-100)
    const ageScore = Math.min(100, caseAge * 2);
    factors.push({ name: 'caseAge', score: ageScore, weight: this._riskFactors.caseAge.weight, label: this._riskFactors.caseAge.label });

    // Artifact density (0-100)
    const density = totalEvidence > 0 ? totalArtifacts / totalEvidence : 0;
    const densityScore = Math.min(100, density * 10);
    factors.push({ name: 'artifactDensity', score: densityScore, weight: this._riskFactors.artifactDensity.weight, label: this._riskFactors.artifactDensity.label });

    // Analysis coverage (0-100, inverted)
    const coverageScore = totalEvidence > 0 ? Math.round((analyzedEvidence / totalEvidence) * 100) : 0;
    factors.push({ name: 'analysisCoverage', score: 100 - coverageScore, weight: this._riskFactors.analysisCoverage.weight, label: this._riskFactors.analysisCoverage.label });

    // Timeline gaps (simplified)
    const gapScore = totalArtifacts > 0 ? Math.max(0, 30 - totalArtifacts) * 3 : 50;
    factors.push({ name: 'timelineGaps', score: gapScore, weight: this._riskFactors.timelineGaps.weight, label: this._riskFactors.timelineGaps.label });

    const weightedScore = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
    const level = weightedScore > 75 ? 'critical' : weightedScore > 50 ? 'high' : weightedScore > 25 ? 'medium' : 'low';
    return { score: Math.round(weightedScore), factors, level };
  }

  // --- MITRE ATT&CK Correlation for Forensics ---
  private _forensicMitreMap: Record<string, { tactic: string; techniqueId: string; techniqueName: string; description: string }> = {
    'registry-modification': { tactic: 'Persistence', techniqueId: 'T1112', techniqueName: 'Modify Registry', description: 'Registry keys modified for persistence' },
    'suspicious-process': { tactic: 'Execution', techniqueId: 'T1059', techniqueName: 'Command and Scripting Interpreter', description: 'Suspicious process execution detected' },
    'credential-access': { tactic: 'Credential Access', techniqueId: 'T1003', techniqueName: 'OS Credential Dumping', description: 'Credential harvesting activity' },
    'network-exfiltration': { tactic: 'Exfiltration', techniqueId: 'T1041', techniqueName: 'Exfiltration Over C2 Channel', description: 'Data exfiltration via command channel' },
    'lateral-movement': { tactic: 'Lateral Movement', techniqueId: 'T1021', techniqueName: 'Remote Services', description: 'Lateral movement via remote services' },
    'privilege-escalation': { tactic: 'Privilege Escalation', techniqueId: 'T1068', techniqueName: 'Exploitation for Privilege Escalation', description: 'Exploitation-based privilege escalation' },
    'defense-evasion': { tactic: 'Defense Evasion', techniqueId: 'T1070', techniqueName: 'Indicator Removal', description: 'Anti-forensic techniques detected' },
    'malware-install': { tactic: 'Initial Access', techniqueId: 'T1193', techniqueName: 'Spearphishing Attachment', description: 'Malware delivery via attachment' },
  };

  private _correlateMitre(artifacts: typeof this._artifacts): { tactic: string; techniques: { id: string; name: string; count: number; artifacts: string[] }[] }[] {
    const tacticMap: Record<string, { id: string; name: string; count: number; artifacts: string[] }[]> = {};
    for (const art of artifacts) {
      for (const [key, mitre] of Object.entries(this._forensicMitreMap)) {
        if (art.name.toLowerCase().includes(key) || art.description.toLowerCase().includes(key)) {
          if (!tacticMap[mitre.tactic]) tacticMap[mitre.tactic] = [];
          const existing = tacticMap[mitre.tactic].find(t => t.id === mitre.techniqueId);
          if (existing) {
            existing.count++;
            existing.artifacts.push(art.name);
          } else {
            tacticMap[mitre.tactic].push({ id: mitre.techniqueId, name: mitre.techniqueName, count: 1, artifacts: [art.name] });
          }
        }
      }
    }
    return Object.entries(tacticMap).map(([tactic, techniques]) => ({ tactic, techniques }));
  }

  // --- Advanced Forensic Timeline SVG ---
  private _forensicTimelineSVG(): string {
    const artifacts = this._artifacts.filter(a => this._activeCase && a.caseId === this._activeCase.id);
    if (artifacts.length === 0) return '';
    const sorted = [...artifacts].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const minTime = new Date(sorted[0].timestamp).getTime();
    const maxTime = new Date(sorted[sorted.length - 1].timestamp).getTime();
    const range = maxTime - minTime || 1;
    const w = 800, h = 200, pad = 40;
    const colors: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e', info: '#6366f1' };
    let svg = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<line x1="${pad}" y1="${h / 2}" x2="${w - pad}" y2="${h / 2}" stroke="#374151" stroke-width="2"/>`;
    // Time markers
    for (let i = 0; i <= 5; i++) {
      const x = pad + (i / 5) * (w - 2 * pad);
      const t = new Date(minTime + (i / 5) * range);
      svg += `<line x1="${x}" y1="${h / 2 - 5}" x2="${x}" y2="${h / 2 + 5}" stroke="#4b5563" stroke-width="1"/>`;
      svg += `<text x="${x}" y="${h - 5}" fill="#6b7280" font-size="9" text-anchor="middle">${t.toLocaleTimeString()}</text>`;
    }
    // Event dots
    sorted.forEach((art, idx) => {
      const x = pad + ((new Date(art.timestamp).getTime() - minTime) / range) * (w - 2 * pad);
      const y = idx % 2 === 0 ? h / 2 - 30 : h / 2 + 30;
      const c = colors[art.severity] || '#6b7280';
      svg += `<circle cx="${x}" cy="${h / 2}" r="5" fill="${c}" opacity="0.8"><title>${art.name}: ${art.description}</title></circle>`;
      svg += `<line x1="${x}" y1="${h / 2}" x2="${x}" y2="${y}" stroke="${c}" stroke-width="1" opacity="0.5"/>`;
      svg += `<text x="${x}" y="${y - 5}" fill="${c}" font-size="8" text-anchor="middle">${art.name.substring(0, 12)}</text>`;
    });
    svg += `</svg>`;
    return svg;
  }

  // --- Evidence Integrity Heatmap ---
  private _evidenceHeatmapSVG(): string {
    const w = 400, h = 180;
    const evidence = this._evidence.filter(e => !this._activeCase || e.caseId === this._activeCase.id).slice(0, 12);
    const cols = 4, rows = Math.ceil(evidence.length / cols);
    const cellW = (w - 40) / cols, cellH = (h - 40) / rows;
    let svg = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`;
    evidence.forEach((ev, idx) => {
      const col = idx % cols, row = Math.floor(idx / cols);
      const x = 20 + col * cellW, y = 20 + row * cellH;
      const integrity = ev.verified ? (ev.analysisStatus === 'complete' ? 1.0 : 0.6) : 0.2;
      const color = integrity > 0.8 ? '#22c55e' : integrity > 0.5 ? '#eab308' : '#ef4444';
      svg += `<rect x="${x + 2}" y="${y + 2}" width="${cellW - 4}" height="${cellH - 4}" rx="4" fill="${color}" opacity="0.3" stroke="${color}" stroke-width="1"/>`;
      svg += `<text x="${x + cellW / 2}" y="${y + cellH / 2 - 4}" fill="#e2e8f0" font-size="9" text-anchor="middle">${ev.name.substring(0, 15)}</text>`;
      svg += `<text x="${x + cellW / 2}" y="${y + cellH / 2 + 10}" fill="#9ca3af" font-size="8" text-anchor="middle">${Math.round(integrity * 100)}% integrity</text>`;
    });
    svg += `</svg>`;
    return svg;
  }

  // --- Forensic Collaboration Features ---
  @state() private _collaborators: { id: string; name: string; role: string; avatar: string; status: 'online' | 'offline' | 'busy'; lastActive: string }[] = [
    { id: 'u1', name: 'Dr. Chen', role: 'Lead Forensics', avatar: 'DC', status: 'online', lastActive: '2 min ago' },
    { id: 'u2', name: 'Agent Smith', role: 'Digital Analyst', avatar: 'AS', status: 'busy', lastActive: '15 min ago' },
    { id: 'u3', name: 'Officer Lee', role: 'Law Enforcement', avatar: 'OL', status: 'online', lastActive: '5 min ago' },
    { id: 'u4', name: 'Tech Expert Kim', role: 'Malware Analyst', avatar: 'TK', status: 'offline', lastActive: '2 hours ago' },
  ];

  @state() private _activityFeed: { id: string; userId: string; action: string; target: string; timestamp: string; type: 'comment' | 'action' | 'mention' | 'approval' }[] = [];
  @state() private _pendingApprovals: { id: string; requester: string; action: string; item: string; timestamp: string }[] = [
    { id: 'ap1', requester: 'Agent Smith', action: 'request_destroy_evidence', item: 'EVD-003 (Malware Sample)', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 'ap2', requester: 'Officer Lee', action: 'request_case_closure', item: 'CASE-2024-001', timestamp: new Date(Date.now() - 7200000).toISOString() },
  ];
  @state() private _showCollabPanel = false;
  @state() private _commentText = '';
  @state() private _mentionQuery = '';

  private _addActivity(userId: string, action: string, target: string, type: 'comment' | 'action' | 'mention' | 'approval' = 'action') {
    this._activityFeed = [{ id: 'act-' + Date.now(), userId, action, target, timestamp: new Date().toISOString(), type }, ...this._activityFeed].slice(0, 50);
  }

  private _approveAction(approvalId: string, approved: boolean) {
    const approval = this._pendingApprovals.find(a => a.id === approvalId);
    if (approval) {
      this._addActivity('You', approved ? 'approved' : 'rejected', approval.item, 'approval');
      this._pendingApprovals = this._pendingApprovals.filter(a => a.id !== approvalId);
    }
  }

  private _renderCollaboration(): any {
    return html`
      <div style="margin-top:16px">
        <div style="font-weight:700;font-size:13px;margin-bottom:12px;display:flex;align-items:center;gap:8px;cursor:pointer" @click=${() => { this._showCollabPanel = !this._showCollabPanel; }}>
          <span>Team Collaboration</span>
          <span style="font-size:10px;color:#6b7280">${this._collaborators.filter(c => c.status === 'online').length} online</span>
          <span style="font-size:10px">${this._showCollabPanel ? '\u25B2' : '\u25BC'}</span>
        </div>
        ${this._showCollabPanel ? html`
          <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-bottom:12px">
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
              ${this._collaborators.map(c => html`
                <div style="display:flex;align-items:center;gap:6px;background:#1f2937;border-radius:6px;padding:6px 10px">
                  <div style="width:24px;height:24px;border-radius:50%;background:#374151;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#e2e8f0">${c.avatar}</div>
                  <div><div style="font-size:11px;font-weight:600">${c.name}</div><div style="font-size:9px;color:#6b7280">${c.role}</div></div>
                  <div style="width:8px;height:8px;border-radius:50%;background:${c.status === 'online' ? '#22c55e' : c.status === 'busy' ? '#eab308' : '#6b7280'}"></div>
                </div>
              `)}
            </div>
            <div style="margin-bottom:8px;font-size:11px;font-weight:600;color:#9ca3af">Activity Feed</div>
            <div style="max-height:120px;overflow-y:auto">
              ${this._activityFeed.length === 0 ? html`<div style="font-size:11px;color:#6b7280;padding:8px">No recent activity</div>` : this._activityFeed.slice(0, 10).map(act => {
                const user = this._collaborators.find(c => c.id === act.userId);
                return html`<div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">
                  <span style="font-weight:600;color:#e2e8f0">${user?.name || act.userId}</span>
                  <span style="color:#6b7280">${act.action}</span>
                  <span style="color:#9ca3af">${act.target}</span>
                  <span style="margin-left:auto;font-size:9px;color:#4b5563">${new Date(act.timestamp).toLocaleTimeString()}</span>
                </div>`;
              })}
            </div>
            ${this._pendingApprovals.length > 0 ? html`
              <div style="margin-top:12px;font-size:11px;font-weight:600;color:#f59e0b">Pending Approvals (${this._pendingApprovals.length})</div>
              ${this._pendingApprovals.map(a => html`
                <div style="background:#1f2937;border-radius:6px;padding:8px;margin-top:6px;display:flex;align-items:center;gap:8px;font-size:11px">
                  <span style="font-weight:600">${a.requester}</span>
                  <span style="color:#6b7280">requests:</span>
                  <span style="flex:1">${a.item}</span>
                  <button style="background:#052e16;color:#86efac;border:none;border-radius:4px;padding:3px 10px;font-size:10px;cursor:pointer" @click=${() => this._approveAction(a.id, true)}>Approve</button>
                  <button style="background:#450a0a;color:#fca5a5;border:none;border-radius:4px;padding:3px 10px;font-size:10px;cursor:pointer" @click=${() => this._approveAction(a.id, false)}>Reject</button>
                </div>
              `)}
            ` : ''}
            <div style="margin-top:12px;display:flex;gap:8px">
              <input style="flex:1;background:#0f172a;border:1px solid #374151;border-radius:6px;padding:6px 10px;color:#e2e8f0;font-size:11px" placeholder="@mention collaborator..." .value=${this._mentionQuery} @input=${(e: any) => { this._mentionQuery = e.target.value; }}>
              <input style="flex:2;background:#0f172a;border:1px solid #374151;border-radius:6px;padding:6px 10px;color:#e2e8f0;font-size:11px" placeholder="Add comment..." .value=${this._commentText} @input=${(e: any) => { this._commentText = e.target.value; }}>
              <button style="background:#f59e0b;color:#111827;border:none;border-radius:6px;padding:6px 12px;font-size:11px;font-weight:600;cursor:pointer" @click=${() => { if (this._commentText.trim()) { this._addActivity('You', 'commented', this._commentText.trim(), 'comment'); this._commentText = ''; } }}>Post</button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  // --- Auto-Insights Engine ---
  private _generateForensicInsights(): { icon: string; text: string; severity: string; category: string }[] {
    const insights: { icon: string; text: string; severity: string; category: string }[] = [];
    const caseArtifacts = this._artifacts.filter(a => this._activeCase && a.caseId === this._activeCase.id);
    const criticalArtifacts = caseArtifacts.filter(a => a.severity === 'critical');
    const verifiedEvidence = this._evidence.filter(e => e.verified && (!this._activeCase || e.caseId === this._activeCase.id));
    const unverified = this._evidence.filter(e => !e.verified && (!this._activeCase || e.caseId === this._activeCase.id));

    if (criticalArtifacts.length >= 3) {
      insights.push({ icon: '\u26A0\uFE0F', text: `High concentration of critical findings (${criticalArtifacts.length}). Consider escalation to incident response team.`, severity: 'critical', category: 'risk' });
    }
    if (unverified.length > 0) {
      insights.push({ icon: '\uD83D\uDD12', text: `${unverified.length} evidence items lack hash verification. Integrity cannot be guaranteed for legal proceedings.`, severity: 'high', category: 'integrity' });
    }
    const mitreCorrelation = this._correlateMitre(caseArtifacts);
    if (mitreCorrelation.length > 3) {
      insights.push({ icon: '\uD83D\uDD0D', text: `Artifacts correlate with ${mitreCorrelation.length} MITRE ATT&CK tactics. Attack pattern analysis recommended.`, severity: 'medium', category: 'correlation' });
    }
    if (caseArtifacts.filter(a => a.category === 'network').length > 0 && caseArtifacts.filter(a => a.category === 'credential').length > 0) {
      insights.push({ icon: '\uD83C\uDF10', text: 'Network activity combined with credential artifacts detected. Possible lateral movement pattern.', severity: 'high', category: 'pattern' });
    }
    if (caseArtifacts.filter(a => a.category === 'registry').length > 0 && caseArtifacts.filter(a => a.category === 'process').length > 0) {
      insights.push({ icon: '\uD83D\uDCBB', text: 'Registry modifications paired with suspicious processes suggest persistence mechanism.', severity: 'high', category: 'pattern' });
    }
    const recentArtifacts = caseArtifacts.filter(a => (Date.now() - new Date(a.timestamp).getTime()) < 86400000);
    if (recentArtifacts.length > 0) {
      insights.push({ icon: '\uD83D\uDCC5', text: `${recentArtifacts.length} artifacts from the last 24 hours. Activity appears recent and ongoing.`, severity: 'medium', category: 'temporal' });
    }
    if (insights.length === 0) {
      insights.push({ icon: '\u2705', text: 'No significant anomalies detected in current case evidence.', severity: 'low', category: 'status' });
    }
    return insights;
  }

  private _renderInsightsPanel(): any {
    const insights = this._generateForensicInsights();
    return html`
      <div style="margin-top:16px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:13px;margin-bottom:10px;display:flex;align-items:center;gap:8px">
          <span>Auto-Insights</span>
          <span style="font-size:10px;color:#6b7280">${insights.length} findings</span>
        </div>
        ${insights.map(i => html`
          <div style="display:flex;gap:8px;padding:8px;margin-bottom:4px;background:#1f2937;border-radius:6px;border-left:3px solid ${i.severity === 'critical' ? '#ef4444' : i.severity === 'high' ? '#f97316' : i.severity === 'medium' ? '#eab308' : '#22c55e'}">
            <span style="font-size:14px">${i.icon}</span>
            <div style="flex:1"><div style="font-size:11px;color:#e2e8f0">${i.text}</div><div style="font-size:9px;color:#6b7280;margin-top:2px">${i.category} | ${i.severity}</div></div>
          </div>
        `)}
      </div>
    `;
  }

  // --- Forensic Pattern Analysis Engine ---
  private _forensicPatterns: { id: string; name: string; description: string; indicators: string[]; severity: string; confidence: number }[] = [
    { id: 'fp1', name: 'Ransomware Deployment', description: 'Pattern of file encryption, shadow copy deletion, and ransom note deployment', indicators: ['vss-delete', 'cipher-wipe', 'ransom-note', 'mass-file-mod'], severity: 'critical', confidence: 0 },
    { id: 'fp2', name: 'Data Exfiltration Chain', description: 'Staged data collection, compression, and encrypted outbound transfer', indicators: ['archive-create', 'large-upload', 'encrypted-tunnel', 'dns-tunneling'], severity: 'high', confidence: 0 },
    { id: 'fp3', name: 'Persistence Framework', description: 'Multiple persistence mechanisms established across registry, services, and scheduled tasks', indicators: ['run-key', 'service-install', 'scheduled-task', 'wmi-subscription'], severity: 'high', confidence: 0 },
    { id: 'fp4', name: 'Credential Harvesting', description: 'Systematic credential collection from memory, registry, and browser stores', indicators: ['lsass-access', 'credential-dump', 'cookie-extract', 'password-vault'], severity: 'critical', confidence: 0 },
    { id: 'fp5', name: 'Anti-Forensics Activity', description: 'Evidence destruction, log clearing, and timestamp manipulation', indicators: ['log-clear', 'timestomp', 'secure-delete', 'event-log-wipe'], severity: 'high', confidence: 0 },
    { id: 'fp6', name: 'Lateral Movement Campaign', description: 'Sequential compromise of systems via pass-the-hash, RDP, or WMI', indicators: ['pth-attempt', 'rdp-session', 'wmi-exec', 'ps-exec'], severity: 'high', confidence: 0 },
  ];

  private _matchForensicPatterns(): typeof this._forensicPatterns {
    const caseArtifacts = this._artifacts.filter(a => this._activeCase && a.caseId === this._activeCase.id);
    const allText = caseArtifacts.map(a => (a.name + ' ' + a.description + ' ' + a.tags.join(' ')).toLowerCase()).join(' ');
    return this._forensicPatterns.map(pattern => {
      const matched = pattern.indicators.filter(ind => allText.includes(ind));
      const confidence = matched.length > 0 ? Math.min(1, matched.length / pattern.indicators.length) : 0;
      return { ...pattern, confidence };
    }).filter(p => p.confidence > 0).sort((a, b) => b.confidence - a.confidence);
  }

  private _renderPatternAnalysis(): any {
    const matched = this._matchForensicPatterns();
    if (matched.length === 0) return nothing;
    return html`
      <div style="margin-top:16px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:13px;margin-bottom:10px;display:flex;align-items:center;gap:8px">
          <span>Pattern Analysis</span>
          <span style="font-size:10px;color:#f59e0b">${matched.length} patterns detected</span>
        </div>
        ${matched.map(p => html`
          <div style="background:#1f2937;border-radius:6px;padding:10px;margin-bottom:6px;border-left:3px solid ${p.severity === 'critical' ? '#ef4444' : '#f97316'}">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:600;font-size:12px;color:#e2e8f0">${p.name}</span>
              <span style="font-size:10px;font-weight:700;color:${p.confidence > 0.7 ? '#ef4444' : p.confidence > 0.4 ? '#f59e0b' : '#22c55e'}">${Math.round(p.confidence * 100)}% confidence</span>
            </div>
            <div style="font-size:10px;color:#9ca3af;margin-top:4px">${p.description}</div>
            <div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap">
              ${p.indicators.map(ind => html`<span style="font-size:9px;background:#0f172a;color:#6b7280;padding:2px 6px;border-radius:3px">${ind}</span>`)}
            </div>
            <div style="margin-top:6px;height:4px;background:#0f172a;border-radius:2px;overflow:hidden">
              <div style="height:100%;width:${p.confidence * 100}%;background:${p.confidence > 0.7 ? '#ef4444' : p.confidence > 0.4 ? '#f59e0b' : '#22c55e'};border-radius:2px;transition:width 0.3s"></div>
            </div>
          </div>
        `)}
      </div>
    `;
  }

  // --- Artifact Category Radar Chart ---
  private _artifactRadarSVG(): string {
    const categories = ['filesystem', 'registry', 'network', 'process', 'memory', 'browser', 'credential', 'timeline'];
    const caseArtifacts = this._artifacts.filter(a => this._activeCase && a.caseId === this._activeCase.id);
    const counts = categories.map(cat => caseArtifacts.filter(a => a.category === cat).length);
    const maxCount = Math.max(...counts, 1);
    const cx = 100, cy = 100, r = 70;
    const n = categories.length;
    let svg = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">`;
    // Grid rings
    for (let ring = 1; ring <= 4; ring++) {
      const rr = (ring / 4) * r;
      const points = categories.map((_, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        return `${cx + rr * Math.cos(angle)},${cy + rr * Math.sin(angle)}`;
      }).join(' ');
      svg += `<polygon points="${points}" fill="none" stroke="#374151" stroke-width="0.5"/>`;
    }
    // Axis lines
    categories.forEach((_, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      svg += `<line x1="${cx}" y1="${cy}" x2="${cx + r * Math.cos(angle)}" y2="${cy + r * Math.sin(angle)}" stroke="#374151" stroke-width="0.5"/>`;
    });
    // Data polygon
    const dataPoints = counts.map((count, i) => {
      const val = (count / maxCount) * r;
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      return `${cx + val * Math.cos(angle)},${cy + val * Math.sin(angle)}`;
    }).join(' ');
    svg += `<polygon points="${dataPoints}" fill="#f59e0b" fill-opacity="0.2" stroke="#f59e0b" stroke-width="1.5"/>`;
    // Labels
    categories.forEach((cat, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const lx = cx + (r + 15) * Math.cos(angle);
      const ly = cy + (r + 15) * Math.sin(angle);
      svg += `<text x="${lx}" y="${ly}" fill="#9ca3af" font-size="7" text-anchor="middle" dominant-baseline="middle">${cat}</text>`;
    });
    svg += `</svg>`;
    return svg;
  }

  private _renderRiskGauge(): any {
    const riskDist = { critical: 0, high: 0, medium: 0, low: 0 };
    this._items.forEach((item: any) => { riskDist[item.risk] = (riskDist[item.risk] || 0) + 1; });
    const total = this._items.length || 1;
    const score = Math.round(((riskDist.critical * 10 + riskDist.high * 7 + riskDist.medium * 4 + riskDist.low * 1) / (total * 10)) * 100);
    const scoreColor = score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#22c55e';
    return html`<div class="risk-gauge">
      <div style="font-weight:600;font-size:12px;margin-bottom:8px">Risk Overview</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">
        <div style="background:#0f172a;border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:22px;font-weight:700;color:${scoreColor}">${score}</div>
          <div style="font-size:9px;color:#6b7280">Risk Score</div>
        </div>
        <div style="background:#0f172a;border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:22px;font-weight:700;color:#ef4444">${riskDist.critical}</div>
          <div style="font-size:9px;color:#6b7280">Critical</div>
        </div>
        <div style="background:#0f172a;border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:22px;font-weight:700;color:#f59e0b">${riskDist.high}</div>
          <div style="font-size:9px;color:#6b7280">High Risk</div>
        </div>
      </div>
      <div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Distribution</div>
      <div class="dist-bar">
        <div style="width:${(riskDist.critical / total) * 100}%;background:#ef4444;border-radius:3px"></div>
        <div style="width:${(riskDist.high / total) * 100}%;background:#f97316"></div>
        <div style="width:${(riskDist.medium / total) * 100}%;background:#eab308"></div>
        <div style="width:${(riskDist.low / total) * 100}%;background:#22c55e;border-radius:3px"></div>
      </div>
      <div class="dist-legend">
        <span><span class="dist-dot" style="background:#ef4444"></span>Critical</span>
        <span><span class="dist-dot" style="background:#f97316"></span>High</span>
        <span><span class="dist-dot" style="background:#eab308"></span>Medium</span>
        <span><span class="dist-dot" style="background:#22c55e"></span>Low</span>
      </div>
    </div>`;
  }

  private _renderComments(): any {
    if (!this._expandedId) return nothing;
    const itemComments = this._comments.filter((c: any) => c.itemId === this._expandedId);
    return html`<div class="comment-section">
      <div style="font-weight:600;font-size:12px;margin-bottom:8px">Discussion (${itemComments.length})</div>
      ${itemComments.length === 0 ? html`<div style="font-size:12px;color:#6b7280;padding:8px 0">No comments yet</div>` : ''}
      ${itemComments.map((c: any) => html`<div class="comment-item">
        <div class="comment-avatar">${c.author.charAt(0)}</div>
        <div style="flex:1"><div style="font-size:11px"><span style="font-weight:600">${c.author}</span> <span style="color:#6b7280">${new Date(c.timestamp).toLocaleString()}</span></div><div class="comment-text">${c.text}</div></div>
      </div>`)}
      <div style="display:flex;gap:8px;margin-top:8px">
        <input type="text" placeholder="Add comment..." .value=${this._newComment} @input=${(e: Event) => { this._newComment = (e.target as HTMLInputElement).value; }} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._addComment(); }} style="flex:1;background:#0f172a;border:1px solid #374151;border-radius:6px;padding:8px;color:#e2e8f0;font-size:12px;outline:none">
        <button class="btn btn-primary btn-sm" @click=${this._addComment}>Post</button>
      </div>
    </div>`;
  }

  private _renderFooter(): any {
    return html`<div>
      <div class="footer-bar">
        <span>Last scan: ${this._execHistory.length > 0 ? new Date(this._execHistory[0].timestamp).toLocaleString() : 'Never'}</span>
        <span>${this._items.length} items | ${this._auditTrail.length} audit entries</span>
      </div>
      <div class="footer-actions">
        <div class="footer-btn" @click=${() => { this._addAudit('export', 'Full report exported'); }}>Export Report</div>
        <div class="footer-btn" @click=${() => { this._addAudit('export', 'CSV exported'); }}>Export CSV</div>
        <div class="footer-btn" @click=${this._runScanWithHistory}>Run Analysis</div>
      </div>
    </div>`;
  }

  private _renderSLABar(): any {
    const total = this._slaTargetHours * 3600;
    const pct = 75 + Math.floor(Math.random() * 25);
    const hrs = Math.floor((total * (100 - pct)) / 3600000);
    const color = pct < 25 ? '#ef4444' : pct < 50 ? '#f59e0b' : '#22c55e';
    return html`<div class="sla-bar">
      <div class="sla-indicator" style="background:${color}"></div>
      <div style="flex:1">
        <div style="font-size:11px;color:#94a3b8;margin-bottom:4px">SLA (${this._slaTargetHours}h)</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div>
      </div>
      <div class="sla-time" style="color:${color}">${hrs}h elapsed</div>
    </div>`;
  }


  private _renderMiniGraph(): any {
    const data = this._items.slice(0, 12).map((item: any, i: number) => ({
      name: item.name.substring(0, 10),
      risk: item.risk,
      score: ({critical: 10, high: 7, medium: 4, low: 1}) as any)[item.risk]) || 1,
      idx: i
    }));
    const barW = 360;
    const barH = 180;
    const maxBars = data.length;
    const bw = Math.max(20, Math.floor((barW - 40) / maxBars) - 4);
    const maxScore = 10;
    const riskColors: any = {critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e'};
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:10px">Risk Score Chart</div>
      <svg width="100%" viewBox="0 0 ${barW} ${barH}" style="max-width:420px">
        ${[0, 2, 4, 6, 8, 10].map(v => html`<line x1="30" y1="${barH - 20 - (v / maxScore) * (barH - 50)}" x2="${barW - 10}" y2="${barH - 20 - (v / maxScore) * (barH - 50)}" stroke="#1f2937" stroke-width="0.5"/><text x="25" y="${barH - 18 - (v / maxScore) * (barH - 50)}" text-anchor="end" fill="#6b7280" font-size="7">${v}</text>`)}
        ${data.map((d: any, i: number) => {
          const x = 35 + i * (bw + 4);
          const h = (d.score / maxScore) * (barH - 50);
          const y = barH - 20 - h;
          return html`<g><rect x="${x}" y="${y}" width="${bw}" height="${h}" fill="${riskColors[d.risk]}60" rx="2" stroke="${riskColors[d.risk]}" stroke-width="0.5"/><text x="${x + bw / 2}" y="${barH - 8}" text-anchor="middle" fill="#6b7280" font-size="6" transform="rotate(-30, ${x + bw / 2}, ${barH - 8})">${d.name}</text></g>`;
        })}
        <line x1="30" y1="${barH - 20}" x2="${barW - 10}" y2="${barH - 20}" stroke="#374151" stroke-width="1"/>
      </svg>
    </div>`;
  }

  private _renderEscalationRules(): any {
    const rules = [
      { name: 'Auto-escalate critical', condition: 'risk === critical', action: 'Notify security lead', enabled: true },
      { name: 'Auto-escalate high count', condition: 'flagged >= threshold', action: 'Create incident', enabled: this._criticalThreshold > 0 },
      { name: 'SLA breach warning', condition: 'elapsed > 75% SLA', action: 'Send reminder', enabled: true },
      { name: 'Daily digest', condition: 'schedule: daily 9am', action: 'Email summary', enabled: false },
    ];
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:10px">Escalation Rules</div>
      ${rules.map((r: any) => html`<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:#0f172a;border-radius:6px;margin-bottom:4px;font-size:12px">
        <input type="checkbox" .checked=${r.enabled} style="accent-color:#8b5cf6" @change=${(e: Event) => { this._addAudit('config', 'Rule ' + (r.enabled ? 'disabled' : 'enabled') + ': ' + r.name); }}>
        <div style="flex:1">
          <div style="font-weight:600">${r.name}</div>
          <div style="font-size:10px;color:#6b7280;margin-top:2px">${r.condition} → ${r.action}</div>
        </div>
      </div>`)}
    </div>`;
  }

  private _renderNotificationPanel(): any {
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:10px">Notification Channels</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div style="background:#0f172a;border-radius:6px;padding:10px;display:flex;align-items:center;gap:8px">
          <span style="font-size:16px">&#128232;</span>
          <div><div style="font-size:11px;font-weight:600">Email</div><div style="font-size:9px;color:#6b7280">${this._escalationEmail || 'Not configured'}</div></div>
        </div>
        <div style="background:#0f172a;border-radius:6px;padding:10px;display:flex;align-items:center;gap:8px">
          <span style="font-size:16px">&#128276;</span>
          <div><div style="font-size:11px;font-weight:600">Slack Webhook</div><div style="font-size:9px;color:#6b7280">${this._webhookUrl ? 'Configured' : 'Not configured'}</div></div>
        </div>
        <div style="background:#0f172a;border-radius:6px;padding:10px;display:flex;align-items:center;gap:8px">
          <span style="font-size:16px">&#128172;</span>
          <div><div style="font-size:11px;font-weight:600">Teams</div><div style="font-size:9px;color:#6b7280">Not configured</div></div>
        </div>
        <div style="background:#0f172a;border-radius:6px;padding:10px;display:flex;align-items:center;gap:8px">
          <span style="font-size:16px">&#128279;</span>
          <div><div style="font-size:11px;font-weight:600">PagerDuty</div><div style="font-size:9px;color:#6b7280">Not configured</div></div>
        </div>
      </div>
    </div>`;
  }

  render() {
    const caseArtifacts = this._activeCase ? this._artifacts.filter(a => a.caseId === this._activeCase.id) : [];
    return html`
      <div class="panel">
        <div class="header">
          <div class="title"><span>&#x1F50D;</span> Digital Forensics Workstation</div>
          ${this._activeCase ? html`<span class="tag" style="font-size:12px">Case: ${this._activeCase.id}</span>` : nothing}
        </div>
        <div class="tabs">
          <button class="tab ${this._activeTab === 'cases' ? 'active' : ''}" @click=${() => { this._activeTab = 'cases'; }}>Cases (${this._cases.length})</button>
          <button class="tab ${this._activeTab === 'evidence' ? 'active' : ''}" @click=${() => { this._activeTab = 'evidence'; }}>Evidence (${this._evidence.length})</button>
          <button class="tab ${this._activeTab === 'analysis' ? 'active' : ''}" @click=${() => { this._activeTab = 'analysis'; }}>Analysis</button>
          <button class="tab ${this._activeTab === 'artifacts' ? 'active' : ''}" @click=${() => { this._activeTab = 'artifacts'; }}>Artifacts (${caseArtifacts.length})</button>
          <button class="tab ${this._activeTab === 'timeline' ? 'active' : ''}" @click=${() => { this._activeTab = 'timeline'; }}>Timeline</button>
          <button class="tab ${this._activeTab === 'report' ? 'active' : ''}" @click=${() => { this._activeTab = 'report'; }}>Report</button>
        </div>

        ${this._activeTab === 'cases' ? html`
          <div style="font-weight:600;margin-bottom:12px">Create New Case:</div>
          <div class="form-grid">
            <div class="form-group"><label>Case Name</label><input type="text" .value=${this._newCaseName} @input=${(e: Event) => { this._newCaseName = (e.target as HTMLInputElement).value; }} placeholder="e.g. Ransomware Incident - Corp"></div>
            <div class="form-group"><label>Client</label><input type="text" .value=${this._newCaseClient} @input=${(e: Event) => { this._newCaseClient = (e.target as HTMLInputElement).value; }} placeholder="Client or organization name"></div>
            <div class="form-group"><label>Priority</label>
              <select .value=${this._newCasePriority} @change=${(e: Event) => { this._newCasePriority = (e.target as HTMLSelectElement).value as CasePriority; }}>
                <option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
              </select>
            </div>
            <div class="form-group"><label>Tags (comma-separated)</label><input type="text" .value=${this._newCaseTags} @input=${(e: Event) => { this._newCaseTags = (e.target as HTMLInputElement).value; }} placeholder="ransomware, finance, q1-2024"></div>
            <div class="form-group full"><label>Description</label><textarea .value=${this._newCaseDesc} @input=${(e: Event) => { this._newCaseDesc = (e.target as HTMLInputElement).value; }} placeholder="Case description and initial findings..."></textarea></div>
          </div>
          <div class="btn-row"><button class="btn btn-primary" ?disabled=${!this._newCaseName.trim()} @click=${this._createCase}>Create Case</button></div>
          ${this._cases.length > 0 ? html`
            <div style="font-weight:600;margin:16px 0 8px">Existing Cases:</div>
            <div class="case-grid">${this._cases.map(c => html`
              <div class="case-card ${this._activeCase?.id === c.id ? 'active' : ''}" @click=${() => { this._activeCase = c; this._evidence = []; this._artifacts = []; this._activeTab = 'evidence'; }}>
                <div class="case-name">${c.id} - ${c.name}</div>
                <div class="case-desc">${c.description || 'No description'}</div>
                <div class="case-meta">
                  <span class="priority-${c.priority}">${c.priority}</span>
                  <span>${c.status}</span>
                  <span>${new Date(c.createdAt).toLocaleDateString()}</span>
                  ${c.tags.map(t => html`<span class="tag">${t}</span>`)}
                </div>
              </div>
            `)}</div>
          ` : nothing}
        ` : nothing}

        ${this._activeTab === 'evidence' ? html`
          ${!this._activeCase ? html`<div class="empty-state">Select or create a case first</div>` : html`
            <div class="btn-row">
              <button class="btn btn-primary btn-sm" @click=${this._addEvidence}>Add Evidence Item</button>
              <button class="btn btn-secondary btn-sm" @click=${() => { for (let i = 0; i < 5; i++) this._addEvidence(); }}>Add 5 Random Items</button>
            </div>
            ${this._evidence.length === 0 ? html`<div class="empty-state">No evidence items yet</div>` : html`
              <div style="max-height:400px;overflow-y:auto">
                <table class="evidence-table">
                  <thead><tr><th>Name</th><th>Type</th><th>Size</th><th>SHA256</th><th>Status</th></tr></thead>
                  <tbody>${this._evidence.map(e => html`
                    <tr>
                      <td style="font-weight:600">${e.name}</td>
                      <td><span class="tag">${e.type}</span></td>
                      <td>${e.size}</td>
                      <td class="hash-value">${e.hashSha256.slice(0, 24)}...</td>
                      <td><span style="color:${e.analysisStatus === 'complete' ? '#34d399' : e.analysisStatus === 'analyzing' ? '#fbbf24' : '#6b7280'}">${e.analysisStatus}</span></td>
                    </tr>
                  `)}</tbody>
                </table>
              </div>
            `}
          `}
        ` : nothing}

        ${this._activeTab === 'analysis' ? html`
          ${!this._activeCase ? html`<div class="empty-state">Select a case first</div>` : html`
            ${this._activeCase && caseArtifacts.length > 0 ? html`
              <div class="stat-grid">
                <div class="stat"><div class="stat-value" style="color:#dc2626">${caseArtifacts.filter(a => a.severity === 'critical').length}</div><div class="stat-label">Critical</div></div>
                <div class="stat"><div class="stat-value" style="color:#f97316">${caseArtifacts.filter(a => a.severity === 'high').length}</div><div class="stat-label">High</div></div>
                <div class="stat"><div class="stat-value" style="color:#fbbf24">${caseArtifacts.filter(a => a.severity === 'medium').length}</div><div class="stat-label">Medium</div></div>
                <div class="stat"><div class="stat-value" style="color:#3b82f6">${caseArtifacts.filter(a => a.severity === 'low').length}</div><div class="stat-label">Low</div></div>
              </div>
            ` : nothing}
            <div class="btn-row">
              <button class="btn btn-primary" ?disabled=${this._analysisRunning || this._evidence.length === 0} @click=${this._runAnalysis}>
                ${this._analysisRunning ? 'Analysis Running...' : 'Run Forensic Analysis'}
              </button>
            </div>
            ${this._analysisRunning ? html`<div class="progress-bar"><div class="progress-fill" style="width:${this._progress}%"></div></div>` : nothing}
            ${this._output.length > 0 ? html`<div class="output-box">${this._output.map(l => html`<div class="${l.startsWith('[+]') ? 'output-success' : l.startsWith('[!]') || l.startsWith('[!') ? 'output-warn' : l.startsWith('[-]') ? 'output-error' : 'output-info'}">${l}</div>`)}</div>` : html`<div class="empty-state">Add evidence and run analysis</div>`}
          `}
        ` : nothing}

        ${this._activeTab === 'artifacts' ? html`
          ${caseArtifacts.length === 0 ? html`<div class="empty-state">No artifacts found. Run analysis first.</div>` : html`
            <div class="btn-row">
              <select @change=${(e: Event) => { this._activeTab = 'artifacts'; this.requestUpdate(); }} style="background:#1a1d27;border:1px solid #2a2d3a;border-radius:6px;padding:6px 10px;color:#e2e8f0;font-size:12px;font-family:inherit">
                <option value="">All Categories</option>
                <option value="filesystem">Filesystem</option><option value="registry">Registry</option><option value="network">Network</option>
                <option value="browser">Browser</option><option value="credential">Credential</option><option value="timeline">Timeline</option>
              </select>
            </div>
            ${caseArtifacts.sort((a, b) => {
              const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
              return order[a.severity] - order[b.severity];
            }).map(a => html`
              <div class="artifact-card artifact-${a.severity}">
                <div class="artifact-name">${a.name} <span style="font-size:11px;color:${a.severity === 'critical' ? '#f87171' : a.severity === 'high' ? '#f97316' : '#fbbf24'}">[${a.severity.toUpperCase()}]</span></div>
                <div class="artifact-desc">${a.description}</div>
                <div class="artifact-meta">
                  <span class="tag">${a.category}</span>
                  <span>${new Date(a.timestamp).toLocaleString()}</span>
                  <span>${a.source}</span>
                  ${a.tags.map(t => html`<span class="tag">${t}</span>`)}
                </div>
              </div>
            `)}
          `}
        ` : nothing}

        ${this._activeTab === 'timeline' ? html`
          ${caseArtifacts.length === 0 ? html`<div class="empty-state">No artifacts to display. Run analysis first.</div>` : html`
            <div style="font-weight:600;margin-bottom:12px">Event Timeline (${caseArtifacts.length} events)</div>
            <div class="timeline-view">
              ${caseArtifacts.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map(a => html`
                <div class="timeline-item ${a.severity}">
                  <div class="timeline-time">${new Date(a.timestamp).toISOString()}</div>
                  <div class="timeline-text"><strong>${a.name}</strong> - ${a.description}</div>
                  <div style="font-size:10px;color:#6b7280;margin-top:2px">Source: ${a.source} | Category: ${a.category}</div>
                </div>
              `)}
            </div>
          `}
        ` : nothing}

        ${this._activeTab === 'report' ? html`
          ${!this._activeCase ? html`<div class="empty-state">Select a case first</div>` : html`
            <div class="stat-grid">
              <div class="stat"><div class="stat-value">${this._evidence.length}</div><div class="stat-label">Evidence Items</div></div>
              <div class="stat"><div class="stat-value">${caseArtifacts.length}</div><div class="stat-label">Artifacts Found</div></div>
              <div class="stat"><div class="stat-value" style="color:#dc2626">${caseArtifacts.filter(a => a.severity === 'critical' || a.severity === 'high').length}</div><div class="stat-label">High Severity</div></div>
              <div class="stat"><div class="stat-value">${this._analyses.filter(a => a.caseId === this._activeCase.id).length}</div><div class="stat-label">Analyses Run</div></div>
            </div>
            <div style="background:#1a1d27;border-radius:8px;padding:16px;margin-bottom:16px">
              <div style="font-weight:700;margin-bottom:8px">Case Summary: ${this._activeCase.id}</div>
              <div style="font-size:13px;color:#9ca3af">${this._activeCase.description || 'No description'}</div>
              <div style="font-size:12px;color:#6b7280;margin-top:8px">Priority: ${this._activeCase.priority} | Status: ${this._activeCase.status} | Created: ${new Date(this._activeCase.createdAt).toLocaleString()}</div>
            </div>
            <div class="btn-row">
              <button class="btn btn-primary" @click=${this._exportReport}>Export Full Report (JSON)</button>
            </div>
          `}
        ` : nothing}
      </div>
        ${this._renderPatternAnalysis()}
        ${this._renderCollaboration()}
        ${this._renderInsightsPanel()}
        ${this._renderRiskGauge()}
        ${this._renderFooter()}
      </div>
    `;
  }

  // === SECTION A: Multi-Phase Pipeline Execution Engine ===
  private _pipelinePhases: { id: string; name: string; status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled-back'; progress: number; duration: number; errors: string[]; rollbackSteps: string[] }[] = [
    { id: 'ph-1', name: 'Evidence Acquisition', status: 'completed', progress: 100, duration: 120, errors: [], rollbackSteps: ['Reset evidence acquisition state'] },
    { id: 'ph-2', name: 'Hash Verification (SHA-256)', status: 'completed', progress: 100, duration: 15, errors: [], rollbackSteps: ['Reset hash verification (sha-256) state'] },
    { id: 'ph-3', name: 'Disk Image Analysis', status: 'completed', progress: 100, duration: 300, errors: [], rollbackSteps: ['Reset disk image analysis state'] },
    { id: 'ph-4', name: 'Timeline Reconstruction', status: 'running', progress: 55, duration: 180, errors: [], rollbackSteps: ['Reset timeline reconstruction state'] },
    { id: 'ph-5', name: 'Artifact Extraction', status: 'pending', progress: 0, duration: 0, errors: [], rollbackSteps: ['Reset artifact extraction state'] },
    { id: 'ph-6', name: 'Malware Identification', status: 'pending', progress: 0, duration: 0, errors: [], rollbackSteps: ['Reset malware identification state'] },
    { id: 'ph-7', name: 'Report Compilation', status: 'pending', progress: 0, duration: 0, errors: [], rollbackSteps: ['Reset report compilation state'] },
  ];

  private _pipelineJobQueue: { id: string; name: string; priority: number; status: 'queued' | 'processing' | 'done'; phaseId: string; submittedAt: number; startedAt: number }[] = [
    { id: 'job-001', name: 'Extract browser history', priority: 1, status: 'done', phaseId: 'ph-1', submittedAt: Date.now() - 300000, startedAt: Date.now() - 280000 },
    { id: 'job-002', name: 'Parse Windows registry', priority: 2, status: 'done', phaseId: 'ph-2', submittedAt: Date.now() - 250000, startedAt: Date.now() - 230000 },
    { id: 'job-003', name: 'Analyze prefetch files', priority: 3, status: 'processing', phaseId: 'ph-3', submittedAt: Date.now() - 200000, startedAt: 0 },
    { id: 'job-004', name: 'Extract persistence artifacts', priority: 2, status: 'queued', phaseId: 'ph-4', submittedAt: Date.now() - 150000, startedAt: 0 },
    { id: 'job-005', name: 'Recover deleted files', priority: 3, status: 'queued', phaseId: 'ph-5', submittedAt: Date.now() - 100000, startedAt: 0 },
    { id: 'job-006', name: 'Generate hash timeline', priority: 4, status: 'queued', phaseId: 'ph-6', submittedAt: Date.now() - 50000, startedAt: 0 },
  ];

  private _errorCategories: { category: string; icon: string; count: number; autoRemediation: string }[] = [
    { category: 'Disk Read Error', icon: 'disk', count: 2, autoRemediation: 'Retry with lower block size' },
    { category: 'Hash Mismatch', icon: 'hash', count: 1, autoRemediation: 'Re-acquire and verify chain of custody' },
    { category: 'Encrypted Volume', icon: 'enc', count: 3, autoRemediation: 'Attempt password recovery' },
    { category: 'Filesystem Corruption', icon: 'fs', count: 4, autoRemediation: 'Use raw carving tools' },
    { category: 'Timeline Gap', icon: 'time', count: 6, autoRemediation: 'Cross-reference external logs' },
    { category: 'Anti-Forensic Tool', icon: 'aft', count: 2, autoRemediation: 'Document and attempt recovery' },
  ];

  private _batchProcessingConfig: { enabled: boolean; chunkSize: number; parallelChunks: number; retryAttempts: number; retryDelayMs: number } = {
    enabled: true, chunkSize: 50, parallelChunks: 3, retryAttempts: 3, retryDelayMs: 2000,
  };

  private _renderPipelineEngine(): any {
    const phases = this._pipelinePhases;
    const completed = phases.filter(p => p.status === 'completed').length;
    const totalProgress = Math.round(phases.reduce((s, p) => s + p.progress, 0) / (phases.length || 1));
    return html`
      <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase">Pipeline Execution Engine</span>
          <div style="display:flex;gap:6px">
            <button class="btn btn-sm" style="background:#ef4444;color:#fff" @click=${() => this._handlePipelineAction('rollback')}>Rollback</button>
            <button class="btn btn-sm" style="background:#22c55e;color:#fff" @click=${() => this._handlePipelineAction('resume')}>Resume</button>
            <button class="btn btn-sm" style="background:#3b82f6;color:#fff" @click=${() => this._handlePipelineAction('pause')}>Pause</button>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <div style="flex:1;height:8px;background:#0a0c10;border-radius:4px;overflow:hidden">
            <div style="height:100%;width:${totalProgress}%;background:linear-gradient(90deg,#3b82f6,#8b5cf6);border-radius:4px;transition:width 0.5s"></div>
          </div>
          <span style="font-size:11px;color:#e2e8f0;font-weight:600">${totalProgress}%</span>
          <span style="font-size:10px;color:#6b7280">${completed}/${phases.length} phases</span>
        </div>
        ${phases.map((p, i) => html`
          <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:${p.status === 'running' ? '#3b82f610' : '#0a0c10'};border-radius:4px;margin-bottom:3px;border-left:3px solid ${p.status === 'completed' ? '#22c55e' : p.status === 'running' ? '#3b82f6' : p.status === 'failed' ? '#ef4444' : '#374151'}">
            <span style="font-size:10px;color:#6b7280;width:18px">P${i + 1}</span>
            <span style="flex:1;font-size:11px;color:#e2e8f0">${p.name}</span>
            <div style="width:80px;height:4px;background:#1f2937;border-radius:2px;overflow:hidden">
              <div style="height:100%;width:${p.progress}%;background:${p.status === 'failed' ? '#ef4444' : '#8b5cf6'};border-radius:2px"></div>
            </div>
            <span style="font-size:9px;color:#6b7280;width:30px;text-align:right">${p.progress}%</span>
            ${p.duration > 0 ? html`<span style="font-size:9px;color:#6b7280">${p.duration}s</span>` : html``}
            <span class="tag" style="font-size:8px;background:${p.status === 'completed' ? '#22c55e20' : p.status === 'running' ? '#3b82f620' : p.status === 'failed' ? '#ef444420' : '#37415120'};color:${p.status === 'completed' ? '#22c55e' : p.status === 'running' ? '#3b82f6' : p.status === 'failed' ? '#ef4444' : '#6b7280'}">${p.status}</span>
          </div>
        `)}
        <div style="margin-top:10px">
          <div style="font-size:10px;color:#6b7280;margin-bottom:6px;text-transform:uppercase;font-weight:600">Job Queue (${this._pipelineJobQueue.length} jobs)</div>
          ${this._pipelineJobQueue.slice(0, 4).map(j => html`
            <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:#0a0c10;border-radius:3px;margin-bottom:2px;font-size:10px">
              <span style="color:#fbbf24;font-weight:700">P${j.priority}</span>
              <span style="flex:1;color:#d1d5db">${j.name}</span>
              <span class="tag" style="font-size:8px;color:${j.status === 'done' ? '#22c55e' : j.status === 'processing' ? '#3b82f6' : '#6b7280'}">${j.status}</span>
            </div>
          `)}
        </div>
      </div>
      <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
        <div style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase;margin-bottom:10px">Error Categories & Auto-Remediation</div>
        ${this._errorCategories.map(e => html`
          <div style="display:flex;align-items:center;gap:8px;padding:6px;background:#0a0c10;border-radius:4px;margin-bottom:3px">
            <span style="font-size:14px">${e.icon === 'net' ? '🌐' : e.icon === 'proto' ? '📡' : e.icon === 'dns' ? '🔍' : e.icon === 'scan' ? '🔎' : e.icon === 'tls' ? '🔒' : e.icon === 'out' ? '📤' : e.icon === 'disk' ? '💿' : e.icon === 'hash' ? '#️⃣' : e.icon === 'enc' ? '🔐' : e.icon === 'fs' ? '📁' : e.icon === 'time' ? '⏰' : e.icon === 'aft' ? '🛡️' : '⚠️'}</span>
            <div style="flex:1">
              <div style="font-size:11px;color:#e2e8f0;font-weight:600">${e.category}</div>
              <div style="font-size:9px;color:#6b7280">${e.autoRemediation}</div>
            </div>
            <span style="font-size:14px;font-weight:700;color:#f87171">${e.count}</span>
            <button class="btn btn-sm" style="font-size:9px;background:#22c55e20;color:#22c55e;border:1px solid #22c55e40">Auto-Fix</button>
          </div>
        `)}
      </div>`;
  }

  private _handlePipelineAction(action: string) {
    if (action === 'rollback') {
      const runningPhase = this._pipelinePhases.find(p => p.status === 'running');
      if (runningPhase) { runningPhase.status = 'rolled-back'; runningPhase.progress = 0; }
    } else if (action === 'resume') {
      const pending = this._pipelinePhases.find(p => p.status === 'pending');
      if (pending) { pending.status = 'running'; pending.progress = 10; }
    }
  }

  // === SECTION B: Advanced Data Grid ===
  private _gridColumns: { key: string; label: string; width: number; frozen: boolean; editable: boolean; type: 'text' | 'progress' | 'badge' | 'sparkline'; sortable: boolean; resizable: boolean }[] = [
    { key: 'id', label: 'ID', width: 70, frozen: true, editable: false, type: 'text', sortable: true, resizable: true },
    { key: 'case', label: 'Case/Zone', width: 130, frozen: true, editable: true, type: 'text', sortable: true, resizable: true },
    { key: 'finding', label: 'Finding', width: 240, frozen: false, editable: true, type: 'text', sortable: true, resizable: true },
    { key: 'severity', label: 'Severity', width: 90, frozen: false, editable: false, type: 'badge', sortable: true, resizable: true },
    { key: 'riskScore', label: 'Risk Score', width: 110, frozen: false, editable: false, type: 'progress', sortable: true, resizable: true },
    { key: 'trend', label: '7-Day Trend', width: 100, frozen: false, editable: false, type: 'sparkline', sortable: false, resizable: true },
    { key: 'status', label: 'Status', width: 100, frozen: false, editable: true, type: 'badge', sortable: true, resizable: true },
    { key: 'assignee', label: 'Assignee', width: 120, frozen: false, editable: true, type: 'text', sortable: true, resizable: true },
  ];

  private _gridRows: Record<string, any>[] = [
    { id: 'FR-001', case: 'Case Alpha', finding: 'Suspicious PowerShell execution chain', severity: 'critical', riskScore: 92, trend: [70,75,80,84,87,90,92], status: 'analyzing', assignee: 'Dr. Watson' },
    { id: 'FR-002', case: 'Case Bravo', finding: 'Unauthorized remote access tool', severity: 'critical', riskScore: 88, trend: [65,70,75,78,82,85,88], status: 'confirmed', assignee: 'Agent Smith' },
    { id: 'FR-003', case: 'Case Charlie', finding: 'Data staging before exfiltration', severity: 'high', riskScore: 76, trend: [50,55,60,64,68,72,76], status: 'investigating', assignee: 'Forensics Lead' },
    { id: 'FR-004', case: 'Case Delta', finding: 'Credential harvesting from memory', severity: 'high', riskScore: 82, trend: [60,63,66,70,74,78,82], status: 'confirmed', assignee: 'Sr. Analyst' },
    { id: 'FR-005', case: 'Case Echo', finding: 'Rootkit persistence mechanism', severity: 'critical', riskScore: 95, trend: [80,83,86,88,90,92,95], status: 'analyzing', assignee: 'Malware Team' },
    { id: 'FR-006', case: 'Case Foxtrot', finding: 'Lateral movement via pass-the-hash', severity: 'high', riskScore: 79, trend: [55,58,62,66,70,74,79], status: 'open', assignee: 'IR Team' },
  ];

  private _gridSelectedRows: Set<string> = new Set();
  private _gridSortColumn: string = 'riskScore';
  private _gridSortAsc: boolean = false;

  private _renderAdvancedGrid(): any {
    const cols = this._gridColumns;
    const rows = [...this._gridRows].sort((a, b) => {
      const av = a[this._gridSortColumn], bv = b[this._gridSortColumn];
      if (typeof av === 'number') return this._gridSortAsc ? av - bv : bv - av;
      return this._gridSortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    const frozenCols = cols.filter(c => c.frozen);
    return html`
      <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase">Digital Forensics Findings Grid</span>
          <div style="display:flex;gap:4px">
            <button class="btn btn-sm" style="font-size:9px" ?disabled=${this._gridSelectedRows.size === 0} @click=${() => {}}>Export Selected (${this._gridSelectedRows.size})</button>
            <button class="btn btn-sm" style="font-size:9px" @click=${() => this._gridSelectedRows.clear()}>Clear Selection</button>
          </div>
        </div>
        <div style="overflow-x:auto;border-radius:6px;border:1px solid #374151">
          <table style="width:100%;border-collapse:collapse;font-size:11px">
            <thead>
              <tr style="background:#0a0c10">
                <th style="padding:6px 8px;text-align:left;color:#6b7280;width:30px"><input type="checkbox" @change=${(e: any) => { rows.forEach(r => { if (e.target.checked) this._gridSelectedRows.add(r.id); else this._gridSelectedRows.delete(r.id); }); }} /></th>
                ${cols.map(c => html`
                  <th style="padding:6px 8px;text-align:left;color:#9ca3af;font-weight:600;min-width:${c.width}px;position:${c.frozen ? 'sticky' : 'static'};left:${c.frozen && frozenCols.indexOf(c) === 0 ? '30px' : c.frozen ? '90px' : 'auto'};z-index:2;background:#0a0c10;cursor:pointer;border-right:1px solid #1f2937" @click=${() => { if (c.sortable) { if (this._gridSortColumn === c.key) this._gridSortAsc = !this._gridSortAsc; else { this._gridSortColumn = c.key; this._gridSortAsc = true; } } }}>
                    ${c.label} ${this._gridSortColumn === c.key ? (this._gridSortAsc ? '▲' : '▼') : ''}
                  </th>
                `)}
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => html`
                <tr style="background:${this._gridSelectedRows.has(r.id) ? '#3b82f610' : 'transparent'};border-bottom:1px solid #1f293710">
                  <td style="padding:4px 8px;position:sticky;left:0;z-index:1;background:${this._gridSelectedRows.has(r.id) ? '#3b82f610' : '#1f2937'}"><input type="checkbox" .checked=${this._gridSelectedRows.has(r.id)} @change=${(e: any) => { if (e.target.checked) this._gridSelectedRows.add(r.id); else this._gridSelectedRows.delete(r.id); }} /></td>
                  ${cols.map(c => html`<td style="padding:4px 8px;color:#d1d5db;${c.frozen ? 'position:sticky;z-index:1;background:' + (this._gridSelectedRows.has(r.id) ? '#3b82f610' : '#1f2937') + ';' : ''}${c.frozen && frozenCols.indexOf(c) === 0 ? 'left:30px;' : c.frozen ? 'left:90px;' : ''}">
                    ${c.type === 'badge' ? html`<span class="tag" style="font-size:9px;background:${r[c.key] === 'critical' ? '#ef444420' : r[c.key] === 'high' ? '#f9731620' : r[c.key] === 'medium' ? '#fbbf2420' : r[c.key] === 'low' ? '#22c55e20' : r[c.key] === 'open' ? '#ef444420' : r[c.key] === 'in-progress' ? '#3b82f620' : r[c.key] === 'investigating' ? '#fbbf2420' : r[c.key] === 'confirmed' ? '#ef444420' : r[c.key] === 'analyzing' ? '#8b5cf620' : r[c.key] === 'escalated' ? '#f9731620' : r[c.key] === 'mitigated' ? '#22c55e20' : r[c.key] === 'active' ? '#3b82f620' : r[c.key] === 'completed' ? '#22c55e20' : '#37415120'};color:${r[c.key] === 'critical' ? '#f87171' : r[c.key] === 'high' ? '#fb923c' : r[c.key] === 'medium' ? '#fbbf24' : r[c.key] === 'low' ? '#34d399' : r[c.key] === 'open' ? '#f87171' : r[c.key] === 'in-progress' ? '#60a5fa' : r[c.key] === 'investigating' ? '#fbbf24' : r[c.key] === 'confirmed' ? '#f87171' : r[c.key] === 'analyzing' ? '#a78bfa' : r[c.key] === 'escalated' ? '#fb923c' : r[c.key] === 'mitigated' ? '#34d399' : r[c.key] === 'active' ? '#60a5fa' : r[c.key] === 'completed' ? '#34d399' : '#6b7280'}">${r[c.key]}</span>` :
                      c.type === 'progress' ? html`<div style="display:flex;align-items:center;gap:6px"><div style="flex:1;height:6px;background:#0a0c10;border-radius:3px;overflow:hidden"><div style="height:100%;width:${r[c.key]}%;background:${r[c.key] >= 80 ? '#ef4444' : r[c.key] >= 60 ? '#f97316' : '#22c55e'};border-radius:3px"></div></div><span style="font-size:10px;color:#9ca3af">${r[c.key]}</span></div>` :
                      c.type === 'sparkline' ? html`<svg width="80" height="24" viewBox="0 0 80 24">${r[c.key].map((v: number, i: number, arr: number[]) => { const x = (i / (arr.length - 1)) * 80; const y = 24 - (v / 100) * 24; return i === 0 ? '' : '<line x1="' + ((i - 1) / (arr.length - 1) * 80) + '" y1="' + (24 - (arr[i - 1] / 100) * 24) + '" x2="' + x + '" y2="' + y + '" stroke="#3b82f6" stroke-width="1.5"/>'; }).join('')}</svg>` :
                      r[c.key]}
                  </td>`)}
                </tr>
              `)}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  // === SECTION C: Domain-Specific Calculators ===
  private _roiScenarios: { name: string; investment: number; annualSavings: number; riskReduction: number; paybackMonths: number; npv: number }[] = [
    { name: 'Forensics Platform License', investment: 120000, annualSavings: 95000, riskReduction: 20, paybackMonths: 16, npv: 240000 },
    { name: 'Memory Analysis Toolkit', investment: 35000, annualSavings: 28000, riskReduction: 12, paybackMonths: 15, npv: 78000 },
    { name: 'Automated Triage Engine', investment: 85000, annualSavings: 72000, riskReduction: 30, paybackMonths: 15, npv: 195000 },
    { name: 'Cloud Forensics Capability', investment: 150000, annualSavings: 110000, riskReduction: 25, paybackMonths: 17, npv: 280000 },
  ];

  private _riskQuantMetrics: { metric: string; sle: number; aro: number; ale: number; mitigationCost: number; roi: number }[] = [
    { metric: 'Evidence Spoliation Risk', sle: 2000000, aro: 0.1, ale: 200000, mitigationCost: 45000, roi: 344 },
    { metric: 'Chain of Custody Break', sle: 5000000, aro: 0.05, ale: 250000, mitigationCost: 80000, roi: 213 },
    { metric: 'Delayed Incident Response', sle: 3200000, aro: 0.15, ale: 480000, mitigationCost: 120000, roi: 300 },
  ];

  private _renderDomainCalculators(): any {
    return html`
      <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
        <div style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase;margin-bottom:10px">ROI Scenario Modeling</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;margin-bottom:10px">
          ${this._roiScenarios.map(s => html`
            <div style="background:#0a0c10;border-radius:6px;padding:10px;border-left:3px solid ${s.npv > 300000 ? '#22c55e' : s.npv > 150000 ? '#3b82f6' : '#fbbf24'}">
              <div style="font-size:11px;font-weight:600;color:#e2e8f0;margin-bottom:6px">${s.name}</div>
              <div style="display:flex;justify-content:space-between;font-size:9px;color:#6b7280;margin-bottom:2px"><span>Investment</span><span style="color:#e2e8f0">$${(s.investment / 1000).toFixed(0)}K</span></div>
              <div style="display:flex;justify-content:space-between;font-size:9px;color:#6b7280;margin-bottom:2px"><span>Annual Savings</span><span style="color:#22c55e">$${(s.annualSavings / 1000).toFixed(0)}K</span></div>
              <div style="display:flex;justify-content:space-between;font-size:9px;color:#6b7280;margin-bottom:2px"><span>Risk Reduction</span><span style="color:#3b82f6">${s.riskReduction}%</span></div>
              <div style="display:flex;justify-content:space-between;font-size:9px;color:#6b7280;margin-bottom:2px"><span>Payback</span><span style="color:#fbbf24">${s.paybackMonths}mo</span></div>
              <div style="display:flex;justify-content:space-between;font-size:10px;font-weight:600;margin-top:4px"><span style="color:#9ca3af">NPV (3yr)</span><span style="color:#22c55e">$${(s.npv / 1000).toFixed(0)}K</span></div>
            </div>
          `)}
        </div>
      </div>
      <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
        <div style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase;margin-bottom:10px">Risk Quantification (ALE/SLE/ARO)</div>
        ${this._riskQuantMetrics.map(r => html`
          <div style="display:flex;align-items:center;gap:8px;padding:6px;background:#0a0c10;border-radius:4px;margin-bottom:3px;font-size:10px">
            <span style="flex:1;color:#e2e8f0;font-weight:600">${r.metric}</span>
            <span style="color:#6b7280;width:70px;text-align:right">SLE: $${(r.sle / 1000000).toFixed(1)}M</span>
            <span style="color:#6b7280;width:50px;text-align:right">ARO: ${r.aro}</span>
            <span style="color:#f87171;font-weight:700;width:80px;text-align:right">ALE: $${(r.ale / 1000).toFixed(0)}K</span>
            <span style="color:#22c55e;width:70px;text-align:right">ROI: ${r.roi}%</span>
          </div>
        `)}
      </div>`;
  }

  // === SECTION D: Integration Points ===
  private _apiEndpoints: { name: string; url: string; method: string; headers: Record<string, string>; lastStatus: number; lastCalled: string }[] = [
    { name: 'Evidence Repository', url: '/api/v1/forensics/evidence', method: 'POST', headers: { 'Content-Type': 'application/json' }, lastStatus: 200, lastCalled: '5m ago' },
    { name: 'Hash Database', url: '/api/v1/forensics/hashes', method: 'GET', headers: { 'Content-Type': 'application/json' }, lastStatus: 200, lastCalled: '10m ago' },
    { name: 'Timeline Service', url: '/api/v1/forensics/timeline', method: 'POST', headers: { 'Content-Type': 'application/json' }, lastStatus: 200, lastCalled: '15m ago' },
  ];

  private _webhookConfigs: { id: string; name: string; url: string; events: string[]; active: boolean; lastTriggered: string }[] = [
    { id: 'wh-1', name: 'Case Assignment Alert', url: 'https://hooks.slack.com/T00/B00/for1', events: ['case_created', 'evidence_added'], active: true, lastTriggered: '1h ago' },
    { id: 'wh-2', name: 'Report Ready', url: 'https://hooks.slack.com/T00/B00/for2', events: ['report_generated'], active: true, lastTriggered: '4h ago' },
    { id: 'wh-3', name: 'Management Escalation', url: 'https://hooks.slack.com/T00/B00/for3', events: ['critical_finding'], active: false, lastTriggered: 'Never' },
  ];

  private _dataSourceConnections: { name: string; type: string; status: 'connected' | 'disconnected' | 'error'; lastSync: string; records: number }[] = [
    { name: 'Disk Image Storage', type: 'RAW/E01', status: 'connected', lastSync: '5m ago', records: 45 },
    { name: 'Memory Dump Archive', type: 'DMP/LIME', status: 'connected', lastSync: '10m ago', records: 128 },
    { name: 'Network PCAP Repository', type: 'PCAP/JSON', status: 'connected', lastSync: '2m ago', records: 2340 },
  ];

  private _renderIntegrationPoints(): any {
    return html`
      <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
        <div style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase;margin-bottom:10px">API Endpoints</div>
        ${this._apiEndpoints.map(ep => html`
          <div style="display:flex;align-items:center;gap:8px;padding:6px;background:#0a0c10;border-radius:4px;margin-bottom:3px;font-size:10px">
            <span class="tag" style="background:${ep.method === 'GET' ? '#22c55e20' : '#3b82f620'};color:${ep.method === 'GET' ? '#22c55e' : '#60a5fa'}">${ep.method}</span>
            <span style="flex:1;color:#d1d5db;font-family:monospace;font-size:9px">${ep.url}</span>
            <span style="color:${ep.lastStatus < 300 ? '#22c55e' : '#f87171'}">${ep.lastStatus}</span>
            <span style="color:#6b7280">${ep.lastCalled}</span>
            <button class="btn btn-sm" style="font-size:8px">Test</button>
          </div>
        `)}
        <div style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase;margin:12px 0 8px">Webhooks</div>
        ${this._webhookConfigs.map(wh => html`
          <div style="display:flex;align-items:center;gap:8px;padding:6px;background:#0a0c10;border-radius:4px;margin-bottom:3px;font-size:10px">
            <span style="color:${wh.active ? '#22c55e' : '#6b7280'}">${wh.active ? '●' : '○'}</span>
            <span style="flex:1;color:#e2e8f0">${wh.name}</span>
            <span style="color:#6b7280">${wh.events.length} events</span>
            <span style="color:#6b7280">${wh.lastTriggered}</span>
            <button class="btn btn-sm" style="font-size:8px">Edit</button>
          </div>
        `)}
        <div style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase;margin:12px 0 8px">Data Sources</div>
        ${this._dataSourceConnections.map(ds => html`
          <div style="display:flex;align-items:center;gap:8px;padding:6px;background:#0a0c10;border-radius:4px;margin-bottom:3px;font-size:10px">
            <span style="color:${ds.status === 'connected' ? '#22c55e' : ds.status === 'error' ? '#f87171' : '#6b7280'}">${ds.status === 'connected' ? '●' : '○'}</span>
            <span style="flex:1;color:#e2e8f0">${ds.name}</span>
            <span class="tag" style="font-size:8px">${ds.type}</span>
            <span style="color:#6b7280">${ds.records.toLocaleString()} records</span>
            <span style="color:#6b7280">${ds.lastSync}</span>
          </div>
        `)}
      </div>`;
  }

  // === SECTION E: Documentation & Help ===
  private _showHelpOverlay = false;
  private _glossaryTerms: { term: string; definition: string }[] = [
    { term: 'Chain of Custody', definition: 'Documented trail proving evidence integrity from collection to court' },
    { term: 'Volatility Framework', definition: 'Open-source tool for analyzing RAM dumps' },
    { term: 'Timeline Analysis', definition: 'Reconstructing chronological sequence of events' },
    { term: 'Artifact', definition: 'Any data fragment providing evidence of system activity' },
    { term: 'Hash Verification', definition: 'Cryptographic checksum to verify evidence integrity' },
    { term: 'Carving', definition: 'Extracting files from disk images by file signatures' },
    { term: 'Prefetch', definition: 'Windows feature caching application launch data' },
    { term: 'Registry Hive', definition: 'Windows database storing configuration and activity' },
    { term: 'MFT', definition: 'Master File Table - NTFS filesystem metadata structure' },
    { term: 'Anti-Forensics', definition: 'Techniques to erase evidence of activities' },
    { term: 'Write Blocker', definition: 'Prevents writes to evidence media during acquisition' },
    { term: 'Steganography', definition: 'Hiding data within legitimate files to evade detection' },
  ];

  private _keyboardShortcuts: { key: string; action: string }[] = [
    { key: 'Ctrl+Enter', action: 'Execute pipeline' },
    { key: 'Ctrl+Shift+E', action: 'Export current data' },
    { key: 'Ctrl+Shift+R', action: 'Rollback last phase' },
    { key: 'Ctrl+F', action: 'Find in grid' },
    { key: 'Ctrl+A', action: 'Select all rows' },
    { key: 'Escape', action: 'Close overlay' },
    { key: 'Ctrl+1-5', action: 'Switch tabs' },
    { key: 'Ctrl+H', action: 'Toggle help' },
  ];

  private _renderDocumentationHelp(): any {
    if (!this._showHelpOverlay) return html``;
    return html`
      <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center" @click=${() => { this._showHelpOverlay = false; }}>
        <div style="background:#1f2937;border-radius:12px;padding:20px;max-width:600px;max-height:80vh;overflow-y:auto;width:90%" @click=${(e: any) => e.stopPropagation()}>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
            <span style="font-weight:700;font-size:16px;color:#e2e8f0">Help & Documentation</span>
            <button style="background:none;border:none;color:#6b7280;cursor:pointer;font-size:18px" @click=${() => { this._showHelpOverlay = false; }}>✕</button>
          </div>
          <div style="margin-bottom:14px">
            <div style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase;margin-bottom:8px">Domain Glossary</div>
            ${this._glossaryTerms.map(g => html`
              <div style="padding:6px 0;border-bottom:1px solid #374151">
                <span style="font-weight:600;color:#60a5fa;font-size:11px">${g.term}</span>
                <p style="font-size:10px;color:#9ca3af;margin:2px 0 0;line-height:1.4">${g.definition}</p>
              </div>
            `)}
          </div>
          <div>
            <div style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase;margin-bottom:8px">Keyboard Shortcuts</div>
            ${this._keyboardShortcuts.map(s => html`
              <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:11px">
                <span style="color:#d1d5db">${s.action}</span>
                <kbd style="background:#0a0c10;padding:2px 8px;border-radius:4px;color:#60a5fa;font-family:monospace;font-size:10px;border:1px solid #374151">${s.key}</kbd>
              </div>
            `)}
          </div>
        </div>
      </div>`;
  }

}
