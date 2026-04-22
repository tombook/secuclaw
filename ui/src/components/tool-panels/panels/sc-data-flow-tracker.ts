/**
 * sc-data-flow-tracker.ts - Data Flow Mapping and Tracking (Security Ops Dark Capability)
 * Data flow diagram creation, sensitivity classification, flow path analysis,
 * cross-boundary tracking, compliance validation, leak detection scoring
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';

type Sensitivity = 'public' | 'internal' | 'confidential' | 'restricted' | 'top-secret';
type FlowType = 'internal' | 'external' | 'cross-zone' | 'cloud-sync' | 'api-integration' | 'email' | 'backup' | 'third-party';
type DataFormat = 'structured' | 'unstructured' | 'semi-structured' | 'binary' | 'encrypted';
type ComplianceFramework = 'gdpr' | 'hipaa' | 'pci-dss' | 'sox' | 'iso27001' | 'ccpa';

interface DataNode {
  id: string; name: string; type: 'database' | 'file-server' | 'application' | 'cloud-service' | 'endpoint' | 'api' | 'email-system' | 'backup-system';
  sensitivity: Sensitivity; dataTypes: string[]; recordCount: string; encryption: boolean; accessControl: boolean;
}

interface DataFlow {
  id: string; source: string; destination: string; type: FlowType; format: DataFormat;
  protocol: string; encrypted: boolean; authenticated: boolean; volume: string; frequency: string;
  complianceFlags: string[]; riskScore: number;
}

interface BoundaryRule {
  id: string; name: string; sourceZone: string; destZone: string; enforcement: 'enforced' | 'monitor' | 'none';
  dataAllowed: Sensitivity[]; description: string;
}

interface FlowAnalysis {
  id: string; flowId: string; findings: string[]; riskScore: number; recommendations: string[];
  complianceViolations: { framework: ComplianceFramework; rule: string; severity: string }[];
}

interface TrackerConfig {
  projectName: string; frameworks: ComplianceFramework[]; sensitivityDefault: Sensitivity;
  autoClassify: boolean; trackEncrypted: boolean;
}

const SAMPLE_NODES: DataNode[] = [
  { id: 'n1', name: 'Customer Database', type: 'database', sensitivity: 'restricted', dataTypes: ['PII', 'SSN', 'Payment Data'], recordCount: '2.5M', encryption: true, accessControl: true },
  { id: 'n2', name: 'HR System', type: 'application', sensitivity: 'confidential', dataTypes: ['Employee Records', 'Salaries', 'Medical'], recordCount: '50K', encryption: true, accessControl: true },
  { id: 'n3', name: 'File Server', type: 'file-server', sensitivity: 'internal', dataTypes: ['Documents', 'Spreadsheets', 'Contracts'], recordCount: '500K', encryption: false, accessControl: true },
  { id: 'n4', name: 'CRM Cloud (Salesforce)', type: 'cloud-service', sensitivity: 'confidential', dataTypes: ['Customer Data', 'Opportunities', 'Contacts'], recordCount: '1.2M', encryption: true, accessControl: true },
  { id: 'n5', name: 'Analytics Platform', type: 'application', sensitivity: 'internal', dataTypes: ['Aggregated Data', 'Reports'], recordCount: '10M', encryption: false, accessControl: true },
  { id: 'n6', name: 'Email Gateway', type: 'email-system', sensitivity: 'internal', dataTypes: ['Emails', 'Attachments'], recordCount: '100M', encryption: true, accessControl: true },
  { id: 'n7', name: 'AWS S3 Bucket', type: 'cloud-service', sensitivity: 'confidential', dataTypes: ['Backups', 'Logs', 'Exports'], recordCount: '5M', encryption: true, accessControl: false },
  { id: 'n8', name: 'Payment Gateway API', type: 'api', sensitivity: 'top-secret', dataTypes: ['Credit Cards', 'Transactions'], recordCount: '500K/mo', encryption: true, accessControl: true },
  { id: 'n9', name: 'Employee Laptops', type: 'endpoint', sensitivity: 'confidential', dataTypes: ['Local Copies', 'Cached Data', 'Credentials'], recordCount: '2000 devices', encryption: false, accessControl: false },
  { id: 'n10', name: 'Backup System (Veeam)', type: 'backup-system', sensitivity: 'restricted', dataTypes: ['Full Backups', 'Snapshots'], recordCount: '50TB', encryption: true, accessControl: true },
];

const SAMPLE_FLOWS: DataFlow[] = [
  { id: 'f1', source: 'n1', destination: 'n4', type: 'cloud-sync', format: 'structured', protocol: 'HTTPS/TLS 1.3', encrypted: true, authenticated: true, volume: '500K records/day', frequency: 'Real-time', complianceFlags: ['gdpr', 'pci-dss'], riskScore: 25 },
  { id: 'f2', source: 'n1', destination: 'n5', type: 'internal', format: 'structured', protocol: 'JDBC', encrypted: false, authenticated: true, volume: '2M records/day', frequency: 'Hourly batch', complianceFlags: ['gdpr'], riskScore: 55 },
  { id: 'f3', source: 'n2', destination: 'n6', type: 'email', format: 'unstructured', protocol: 'SMTP/TLS', encrypted: true, authenticated: true, volume: '500 emails/day', frequency: 'Continuous', complianceFlags: ['hipaa'], riskScore: 40 },
  { id: 'f4', source: 'n3', destination: 'n7', type: 'cloud-sync', format: 'binary', protocol: 'S3 API', encrypted: true, authenticated: false, volume: '10GB/day', frequency: 'Daily sync', complianceFlags: ['gdpr', 'iso27001'], riskScore: 65 },
  { id: 'f5', source: 'n5', destination: 'n9', type: 'cross-zone', format: 'semi-structured', protocol: 'HTTPS', encrypted: false, authenticated: true, volume: '100MB/day', frequency: 'On-demand', complianceFlags: ['gdpr'], riskScore: 70 },
  { id: 'f6', source: 'n8', destination: 'n1', type: 'external', format: 'structured', protocol: 'API/TLS', encrypted: true, authenticated: true, volume: '50K txn/day', frequency: 'Real-time', complianceFlags: ['pci-dss'], riskScore: 15 },
  { id: 'f7', source: 'n1', destination: 'n10', type: 'backup', format: 'binary', protocol: 'Veeam', encrypted: true, authenticated: true, volume: '500GB/day', frequency: 'Nightly', complianceFlags: ['gdpr', 'hipaa', 'pci-dss'], riskScore: 10 },
  { id: 'f8', source: 'n9', destination: 'n6', type: 'email', format: 'unstructured', protocol: 'SMTP', encrypted: false, authenticated: true, volume: '200 emails/day', frequency: 'Continuous', complianceFlags: ['gdpr', 'hipaa'], riskScore: 75 },
  { id: 'f9', source: 'n7', destination: 'n5', type: 'cloud-sync', format: 'structured', protocol: 'S3 API', encrypted: true, authenticated: true, volume: '5GB/day', frequency: 'Hourly', complianceFlags: [], riskScore: 35 },
  { id: 'f10', source: 'n3', destination: 'n9', type: 'cross-zone', format: 'unstructured', protocol: 'SMB', encrypted: false, authenticated: true, volume: '2GB/day', frequency: 'On-demand', complianceFlags: ['gdpr'], riskScore: 60 },
];

const ZONE_RULES: BoundaryRule[] = [
  { id: 'zr1', name: 'Internal to Cloud', sourceZone: 'internal', destZone: 'cloud', enforcement: 'monitor', dataAllowed: ['internal', 'public'], description: 'Data flowing from on-prem to cloud services' },
  { id: 'zr2', name: 'Restricted Zone Egress', sourceZone: 'restricted', destZone: 'external', enforcement: 'enforced', dataAllowed: ['encrypted-only'], description: 'Highly sensitive data cannot leave restricted zone unencrypted' },
  { id: 'zr3', name: 'Cloud to Cloud', sourceZone: 'cloud', destZone: 'cloud', enforcement: 'monitor', dataAllowed: ['internal', 'confidential', 'public'], description: 'Cross-cloud service data sharing' },
  { id: 'zr4', name: 'Endpoint to External', sourceZone: 'endpoint', destZone: 'external', enforcement: 'none', dataAllowed: ['public'], description: 'Data from endpoints to external destinations' },
];

@customElement('sc-data-flow-tracker')
export class ScDataFlowTracker extends LitElement {
  @property({ type: String }) panelId = 'data-flow-tracker';
  @state() private _config: TrackerConfig = {
    projectName: 'Enterprise Data Flow Assessment', frameworks: ['gdpr', 'pci-dss', 'hipaa'],
    sensitivityDefault: 'internal', autoClassify: true, trackEncrypted: true,
  };
  @state() private _nodes: DataNode[] = [...SAMPLE_NODES];
  @state() private _flows: DataFlow[] = [...SAMPLE_FLOWS];
  @state() private _analyses: FlowAnalysis[] = [];
  @state() private _activeTab: 'overview' | 'nodes' | 'flows' | 'analysis' | 'boundaries' | 'export' = 'overview';
  @state() private _selectedNode: DataNode | null = null;
  @state() private _expandedFlow: string | null = null;
  @state() private _analyzing = false;
  @state() private _progress = 0;
  @state() private _output: string[] = [];
  @state() private _filterSensitivity: Sensitivity | 'all' = 'all';

  @state() private _showExport = false;
  @state() private _showApproval = false;
  @state() private _selectedForBatch: Set<string> = new Set();
  @state() private _showRiskScoring = false;
  // Enhanced features
  @state() private _auditTrail: Array<{id:string;timestamp:string;action:string;user:string;details:string;category:string}> = [];
  @state() private _auditFilter = 'all';
  @state() private _execHistory: Array<{id:string;timestamp:string;itemsScanned:number;findings:number;criticalCount:number;duration:number;status:string}> = [];
  @state() private _execRunning = false;
  @state() private _execProgress = 0;
  @state() private _settingsTab: string = 'general';
  @state() private _autoInterval = 24;
  @state() private _criticalThreshold = 3;
  @state() private _escalationEmail = '';
  @state() private _webhookUrl = '';
  @state() private _slaTargetHours = 72;
  @state() private _tablePage = 0;
  @state() private _tablePageSize = 10;
  @state() private _showEnhanced = false;


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
    .btn-secondary { background: #374151; color: #d1d5db; }
    .btn-sm { padding: 4px 10px; font-size: 11px; }
    .btn-row { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
    .stat { background: #1a1d27; border-radius: 8px; padding: 12px; text-align: center; }
    .stat-value { font-size: 22px; font-weight: 700; }
    .stat-label { font-size: 10px; color: #9ca3af; margin-top: 2px; }
    .node-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
    .node-card { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 14px; cursor: pointer; transition: all 0.2s; }
    .node-card:hover { border-color: #3b82f6; }
    .node-card.selected { border-color: #3b82f6; background: #1e293b; }
    .node-name { font-weight: 700; font-size: 14px; margin-bottom: 4px; }
    .node-meta { font-size: 11px; color: #9ca3af; }
    .tag { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #374151; color: #d1d5db; }
    .sens-public { color: #34d399; }
    .sens-internal { color: #60a5fa; }
    .sens-confidential { color: #fbbf24; }
    .sens-restricted { color: #f97316; }
    .sens-top-secret { color: #f87171; }
    .flow-card { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 12px; margin-bottom: 8px; }
    .flow-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; cursor: pointer; }
    .flow-source { font-weight: 600; font-size: 13px; color: #60a5fa; }
    .flow-arrow { color: #6b7280; font-size: 14px; }
    .flow-dest { font-weight: 600; font-size: 13px; color: #34d399; }
    .flow-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }
    .flow-detail { background: #0f1117; border-radius: 6px; padding: 10px; margin-top: 8px; font-size: 12px; }
    .risk-high { color: #f87171; font-weight: 700; }
    .risk-med { color: #fbbf24; }
    .risk-low { color: #34d399; }
    .boundary-card { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 12px; margin-bottom: 8px; }
    .boundary-name { font-weight: 700; font-size: 13px; margin-bottom: 4px; }
    .boundary-desc { font-size: 12px; color: #9ca3af; }
    .enforce-enforced { color: #34d399; }
    .enforce-monitor { color: #fbbf24; }
    .enforce-none { color: #f87171; }
    .violation-card { background: #1a1d27; border: 1px solid #3a1e1e; border-radius: 8px; padding: 12px; margin-bottom: 8px; border-left: 3px solid #f87171; }
    .violation-title { font-weight: 600; font-size: 13px; margin-bottom: 4px; }
    .violation-desc { font-size: 12px; color: #9ca3af; }
    .output-box { background: #0a0c10; border: 1px solid #1a1d27; border-radius: 8px; padding: 12px; font-family: 'JetBrains Mono', monospace; font-size: 12px; line-height: 1.6; max-height: 300px; overflow-y: auto; white-space: pre-wrap; }
    .output-info { color: #60a5fa; }
    .output-success { color: #34d399; }
    .output-error { color: #f87171; }
    .output-warn { color: #fbbf24; }
    .progress-bar { width: 100%; height: 8px; background: #1a1d27; border-radius: 4px; overflow: hidden; margin: 12px 0; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); border-radius: 4px; transition: width 0.5s; }
    .empty-state { text-align: center; padding: 40px; color: #6b7280; }
    .filter-row { display: flex; gap: 8px; margin-bottom: 12px; align-items: center; flex-wrap: wrap; }
    @media (max-width: 768px) {
      .stat-grid { grid-template-columns: repeat(2, 1fr); }
      .node-grid { grid-template-columns: 1fr; }
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
    .sla-bar { display: flex; align-items: center; gap: 12px; background: #1f2937; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; }
    .sla-indicator { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
  `;

  private _getNodeName(id: string): string {
    return this._nodes.find(n => n.id === id)?.name || id;
  }

  private _getNode(id: string): DataNode | undefined {
    return this._nodes.find(n => n.id === id);
  }

  private _analyzeFlows(): void {
    if (this._analyzing) return;
    this._analyzing = true;
    this._analyses = [];
    this._output = [];
    this._progress = 0;
    this._activeTab = 'analysis';

    this._output.push(`[*] Data Flow Analysis Started`);
    this._output.push(`[*] Nodes: ${this._nodes.length} | Flows: ${this._flows.length}`);
    this._output.push(`[*] Frameworks: ${this._config.frameworks.join(', ')}`);
    this._output.push('');

    let flowIdx = 0;
    const analyzeFlow = () => {
      if (flowIdx >= this._flows.length) {
        this._analyzing = false;
        this._output.push('');
        const totalViolations = this._analyses.reduce((s, a) => s + a.complianceViolations.length, 0);
        const highRisk = this._analyses.filter(a => a.riskScore > 50).length;
        this._output.push(`[+] Analysis Complete`);
        this._output.push(`[*] High-risk flows: ${highRisk}/${this._flows.length}`);
        this._output.push(`[*] Total compliance violations: ${totalViolations}`);
        this.requestUpdate();
        return;
      }

      const flow = this._flows[flowIdx];
      const sourceNode = this._getNode(flow.source);
      const destNode = this._getNode(flow.destination);
      const findings: string[] = [];
      const recommendations: string[] = [];
      const violations: { framework: ComplianceFramework; rule: string; severity: string }[] = [];
      let riskScore = flow.riskScore;

      if (!flow.encrypted) {
        findings.push('Data transmitted in plaintext');
        riskScore += 20;
        recommendations.push('Enable TLS/SSL encryption for this data flow');
        if (sourceNode && (sourceNode.sensitivity === 'restricted' || sourceNode.sensitivity === 'top-secret')) {
          violations.push({ framework: 'gdpr', rule: 'Article 32 - Encryption of personal data', severity: 'high' });
        }
      }

      if (!flow.authenticated) {
        findings.push('No authentication on data flow');
        riskScore += 15;
        recommendations.push('Implement mutual TLS or API key authentication');
      }

      if (sourceNode && destNode && sourceNode.sensitivity !== 'public') {
        const sensOrder = ['public', 'internal', 'confidential', 'restricted', 'top-secret'];
        const srcIdx = sensOrder.indexOf(sourceNode.sensitivity);
        const destIdx = sensOrder.indexOf(destNode.sensitivity);
        if (destIdx < srcIdx && destIdx <= 1) {
          findings.push(`Sensitive data (${sourceNode.sensitivity}) flowing to lower-trust node (${destNode.sensitivity})`);
          riskScore += 15;
          recommendations.push('Implement data loss prevention (DLP) controls');
        }
      }

      if (flow.type === 'cross-zone' && !flow.encrypted) {
        findings.push('Cross-zone transfer without encryption');
        violations.push({ framework: 'iso27001', rule: 'A.13.2.1 - Information transfer', severity: 'medium' });
      }

      if (flow.type === 'email' && sourceNode && (sourceNode.sensitivity === 'confidential' || sourceNode.sensitivity === 'restricted')) {
        findings.push('Sensitive data transmitted via email');
        riskScore += 10;
        recommendations.push('Use secure file transfer instead of email for sensitive data');
        violations.push({ framework: 'hipaa', rule: '164.312(e) - Transmission security', severity: 'high' });
      }

      if (destNode && !destNode.accessControl) {
        findings.push('Destination has no access controls');
        riskScore += 10;
        recommendations.push('Implement access controls on destination system');
      }

      if (flow.complianceFlags.length === 0) {
        recommendations.push('Map compliance requirements for this data flow');
      }

      riskScore = Math.min(100, riskScore);

      const analysis: FlowAnalysis = {
        id: 'FA-' + Date.now().toString(36), flowId: flow.id,
        findings, riskScore, recommendations, complianceViolations: violations,
      };
      this._analyses = [...this._analyses, analysis];

      this._output.push(`[*] ${this._getNodeName(flow.source)} -> ${this._getNodeName(flow.destination)}`);
      if (findings.length > 0) {
        findings.forEach(f => this._output.push(`  [!] ${f}`));
      } else {
        this._output.push(`  [+] No issues found`);
      }
      if (violations.length > 0) {
        violations.forEach(v => this._output.push(`  [-] Violation: ${v.framework} - ${v.rule}`));
      }

      this._progress = Math.round(((flowIdx + 1) / this._flows.length) * 100);
      this.requestUpdate();
      flowIdx++;
      setTimeout(analyzeFlow, 300 + Math.random() * 200);
    };
    setTimeout(analyzeFlow, 500);
  }

  private _exportReport(): void {
    const report = {
      config: this._config, nodes: this._nodes, flows: this._flows,
      analyses: this._analyses.map(a => ({
        ...a,
        sourceName: this._getNodeName(this._flows.find(f => f.id === a.flowId)?.source || ''),
        destName: this._getNodeName(this._flows.find(f => f.id === a.flowId)?.destination || ''),
      })),
      summary: {
        totalNodes: this._nodes.length, totalFlows: this._flows.length,
        highRiskFlows: this._analyses.filter(a => a.riskScore > 50).length,
        totalViolations: this._analyses.reduce((s, a) => s + a.complianceViolations.length, 0),
        unencryptedFlows: this._flows.filter(f => !f.encrypted).length,
        unauthenticatedFlows: this._flows.filter(f => !f.authenticated).length,
      },
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `data-flow-report-${Date.now()}.json`; a.click();
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
    const blob = new Blob(['data-flow-tracker export'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'data-flow-tracker-export.' + (format === 'markdown' ? 'md' : format); a.click();
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

  private _addAudit(category: string, details: string): void {
    this._auditTrail = [{ id: 'a-' + Date.now(), timestamp: new Date().toISOString(), action: category, user: 'Current User', details, category }, ...this._auditTrail].slice(0, 50);
  }

  private _runScanWithHistory(): void {
    this._execRunning = true;
    this._execProgress = 0;
    this._addAudit('scan', 'Starting analysis');
    const record: any = { id: 'ex-' + Date.now(), timestamp: new Date().toISOString(), itemsScanned: 0, findings: 0, criticalCount: 0, duration: 0, status: 'running' };
    const start = Date.now();
    const iv = setInterval(() => {
      this._execProgress = Math.min(this._execProgress + 12, 100);
      record.duration = Math.round((Date.now() - start) / 1000);
      if (this._execProgress >= 100) {
        clearInterval(iv);
        record.status = 'success';
        record.itemsScanned = this._nodes.length;
        record.findings = this._nodes.filter((x: any) => x.risk && x.risk !== 'low').length;
        record.criticalCount = this._nodes.filter((x: any) => x.risk === 'critical').length;
        this._execHistory = [record, ...this._execHistory].slice(0, 20);
        this._execRunning = false;
        this._addAudit('scan', 'Scan completed: ' + record.findings + ' findings');
      }
    }, 200);
  }

  private _renderAuditPanel(): any {
    const filtered = this._auditFilter === 'all' ? this._auditTrail : this._auditTrail.filter((e: any) => e.category === this._auditFilter);
    return html`<div>
      <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">
        ${['all', 'scan', 'review', 'config', 'export'].map((f: string) => html`<button class="btn btn-sm ${this._auditFilter === f ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._auditFilter = f; }}>${f}</button>`)}
      </div>
      <div style="max-height:400px;overflow-y:auto">
        ${filtered.map((e: any) => html`<div style="display:flex;gap:10px;padding:8px 10px;background:#0f172a;border-radius:6px;margin-bottom:4px;font-size:12px">
          <span style="padding:2px 6px;border-radius:3px;font-size:9px;font-weight:600;background:${((({scan:'#3b82f6',review:'#f59e0b',config:'#8b5cf6',export:'#22c55e'}}) as any)[e.category]) || '#374151'}20;color:${((({scan:'#60a5fa',review:'#fbbf24',config:'#a78bfa',export:'#34d399'}}) as any)[e.category]) || '#9ca3af'}">${e.category}</span>
          <div style="flex:1"><div style="color:#e2e8f0;font-weight:500">${e.details}</div><div style="font-size:10px;color:#6b7280;margin-top:2px">${e.user} | ${new Date(e.timestamp).toLocaleString()}</div></div>
        </div>`)}
      </div>
    </div>`;
  }

  private _renderExecHistory(): any {
    if (this._execHistory.length === 0) return html`<div class="empty-state"><div>No scan history</div></div>`;
    const sorted = [...this._execHistory].sort((a: any, b: any) => b.timestamp.localeCompare(a.timestamp));
    const totalPages = Math.max(1, Math.ceil(sorted.length / this._tablePageSize));
    const start = this._tablePage * this._tablePageSize;
    const records = sorted.slice(start, start + this._tablePageSize);
    return html`<div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
        <span style="font-weight:600;font-size:12px;color:#94a3b8">History (${this._execHistory.length})</span>
        <select style="background:#1f2937;border:1px solid #374151;border-radius:4px;padding:4px 8px;color:#e2e8f0;font-size:11px" .value=${String(this._tablePageSize)} @change=${(e: Event) => { this._tablePageSize = parseInt((e.target as HTMLSelectElement).value); this._tablePage = 0; }}>
          <option value="5">5/page</option><option value="10">10/page</option><option value="25">25/page</option>
        </select>
      </div>
      ${this._execRunning ? html`<div class="progress-bar"><div class="progress-fill" style="width:${this._execProgress}%"></div></div>` : nothing}
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr><th style="text-align:left;padding:8px;background:#0f172a;color:#94a3b8;border-bottom:1px solid #374151">Time</th><th style="text-align:left;padding:8px;background:#0f172a;color:#94a3b8;border-bottom:1px solid #374151">Items</th><th style="text-align:left;padding:8px;background:#0f172a;color:#94a3b8;border-bottom:1px solid #374151">Findings</th><th style="text-align:left;padding:8px;background:#0f172a;color:#94a3b8;border-bottom:1px solid #374151">Duration</th><th style="text-align:left;padding:8px;background:#0f172a;color:#94a3b8;border-bottom:1px solid #374151">Status</th></tr></thead>
        <tbody>${records.map((r: any) => html`<tr style="border-bottom:1px solid #1f2937">
          <td style="padding:7px 8px;font-size:11px;color:#6b7280">${new Date(r.timestamp).toLocaleString()}</td>
          <td style="padding:7px 8px">${r.itemsScanned}</td>
          <td style="padding:7px 8px;color:#f59e0b;font-weight:700">${r.findings}</td>
          <td style="padding:7px 8px">${r.duration}s</td>
          <td style="padding:7px 8px"><span style="font-size:10px;padding:2px 8px;border-radius:4px;font-weight:600;background:${r.status === 'success' ? '#22c55e20' : '#ef444420'};color:${r.status === 'success' ? '#34d399' : '#f87171'}">${r.status}</span></td>
        </tr>`)}</tbody>
      </table>
      ${totalPages > 1 ? html`<div style="display:flex;gap:4px;justify-content:center;margin-top:8px">${Array.from({ length: totalPages }, (_: any, i: number) => html`<button class="btn btn-sm ${this._tablePage === i ? 'btn-primary' : 'btn-secondary'}" style="padding:4px 10px" @click=${() => { this._tablePage = i; }}>${i + 1}</button>`)}
      </div>` : nothing}
    </div>`;
  }

  private _renderSettingsPanel(): any {
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px">
      <div style="font-weight:700;font-size:14px;margin-bottom:12px">Settings</div>
      <div style="display:flex;gap:4px;margin-bottom:12px">
        ${['general', 'thresholds', 'integrations'].map((t: string) => html`<button class="btn btn-sm ${this._settingsTab === t ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._settingsTab = t; }}>${t}</button>`)}
      </div>
      ${this._settingsTab === 'general' ? html`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Auto-scan Interval</div><div style="display:flex;align-items:center;gap:10px"><input type="range" min="1" max="168" .value=${String(this._autoInterval)} @input=${(e: Event) => { this._autoInterval = parseInt((e.target as HTMLInputElement).value); } style="flex:1;accent-color:#8b5cf6;background:transparent;border:none"><span style="font-weight:700;color:#8b5cf6;min-width:40px;text-align:right;font-size:13px">${this._autoInterval}h</span></div></div>
        <div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">SLA Target</div><div style="display:flex;align-items:center;gap:10px"><input type="range" min="1" max="720" .value=${String(this._slaTargetHours)} @input=${(e: Event) => { this._slaTargetHours = parseInt((e.target as HTMLInputElement).value); } style="flex:1;accent-color:#8b5cf6;background:transparent;border:none"><span style="font-weight:700;color:#8b5cf6;min-width:40px;text-align:right;font-size:13px">${this._slaTargetHours}h</span></div></div>
      </div>` : nothing}
      ${this._settingsTab === 'thresholds' ? html`<div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Critical Threshold</div><div style="display:flex;align-items:center;gap:10px"><input type="range" min="1" max="20" .value=${String(this._criticalThreshold)} @input=${(e: Event) => { this._criticalThreshold = parseInt((e.target as HTMLInputElement).value); } style="flex:1;accent-color:#8b5cf6;background:transparent;border:none"><span style="font-weight:700;color:#8b5cf6;min-width:40px;text-align:right;font-size:13px">${this._criticalThreshold}</span></div></div>` : nothing}
      ${this._settingsTab === 'integrations' ? html`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Escalation Email</div><input type="email" .value=${this._escalationEmail} @input=${(e: Event) => { this._escalationEmail = (e.target as HTMLInputElement).value; } style="background:#0f172a;border:1px solid #374151;border-radius:6px;padding:8px;color:#e2e8f0;font-size:12px;width:100%"></div>
        <div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Webhook URL</div><input type="url" .value=${this._webhookUrl} @input=${(e: Event) => { this._webhookUrl = (e.target as HTMLInputElement).value; } style="background:#0f172a;border:1px solid #374151;border-radius:6px;padding:8px;color:#e2e8f0;font-size:12px;width:100%"></div>
        <div style="grid-column:1/-1;display:flex;gap:8px;margin-top:8px">
          <button class="btn btn-primary btn-sm" @click=${() => { this._addAudit('config', 'Settings saved'); }}>Save</button>
          <button class="btn btn-secondary btn-sm" @click=${() => { this._addAudit('config', 'Config exported'); }}>Export</button>
        </div>
      </div>` : nothing}
    </div>`;
  }

  private _renderRiskGauge(): any {
    const riskDist: any = { critical: 0, high: 0, medium: 0, low: 0 };
    this._nodes.forEach((item: any) => { const r = item.risk; if (riskDist[r] !== undefined) riskDist[r]++; else riskDist.medium++; });
    const total = this._nodes.length || 1;
    const score = Math.round(((riskDist.critical * 10 + riskDist.high * 7 + riskDist.medium * 4 + riskDist.low * 1) / (total * 10)) * 100);
    const scoreColor = score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#22c55e';
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:8px">Risk Overview</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">
        <div style="background:#0f172a;border-radius:8px;padding:10px;text-align:center"><div style="font-size:22px;font-weight:700;color:${scoreColor}">${score}</div><div style="font-size:9px;color:#6b7280">Risk Score</div></div>
        <div style="background:#0f172a;border-radius:8px;padding:10px;text-align:center"><div style="font-size:22px;font-weight:700;color:#ef4444">${riskDist.critical}</div><div style="font-size:9px;color:#6b7280">Critical</div></div>
        <div style="background:#0f172a;border-radius:8px;padding:10px;text-align:center"><div style="font-size:22px;font-weight:700;color:#f59e0b">${riskDist.high}</div><div style="font-size:9px;color:#6b7280">High Risk</div></div>
      </div>
      <div style="display:flex;height:12px;border-radius:6px;overflow:hidden;gap:1px;margin-bottom:6px">
        <div style="width:${(riskDist.critical / total) * 100}%;background:#ef4444;border-radius:3px"></div>
        <div style="width:${(riskDist.high / total) * 100}%;background:#f97316"></div>
        <div style="width:${(riskDist.medium / total) * 100}%;background:#eab308"></div>
        <div style="width:${(riskDist.low / total) * 100}%;background:#22c55e;border-radius:3px"></div>
      </div>
      <div style="display:flex;gap:12px;font-size:9px;color:#6b7280">
        <span><span style="display:inline-block;width:8px;height:8px;background:#ef4444;border-radius:2px;margin-right:3px"></span>Critical</span>
        <span><span style="display:inline-block;width:8px;height:8px;background:#f97316;border-radius:2px;margin-right:3px"></span>High</span>
        <span><span style="display:inline-block;width:8px;height:8px;background:#eab308;border-radius:2px;margin-right:3px"></span>Medium</span>
        <span><span style="display:inline-block;width:8px;height:8px;background:#22c55e;border-radius:2px;margin-right:3px"></span>Low</span>
      </div>
    </div>`;
  }

  private _renderBarChart(): any {
    const data = this._nodes.slice(0, 10).map((item: any, i: number) => ({ name: (item.name || item.title || item.id || 'Item ' + i).substring(0, 8), score: ({critical: 10, high: 7, medium: 4, low: 1}}}}) as any)[item.risk]) || 2, risk: item.risk || 'medium' }));
    const w = 380, h = 160;
    const bw = Math.max(18, Math.floor((w - 50) / data.length) - 4);
    const colors: any = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:8px">Score Chart</div>
      <svg width="100%" viewBox="0 0 ${w} ${h}" style="max-width:440px">
        ${[0,5,10].map(v => html`<line x1="35" y1="${h - 20 - (v / 10) * (h - 45)}" x2="${w - 10}" y2="${h - 20 - (v / 10) * (h - 45)}" stroke="#1f2937" stroke-width="0.5"/><text x="30" y="${h - 18 - (v / 10) * (h - 45)}" text-anchor="end" fill="#6b7280" font-size="7">${v}</text>`)}
        ${data.map((d: any, i: number) => html`<g><rect x="${40 + i * (bw + 4)}" y="${h - 20 - (d.score / 10) * (h - 45)}" width="${bw}" height="${(d.score / 10) * (h - 45)}" fill="${(colors[d.risk] || '#8b5cf6')}60" rx="2" stroke="${colors[d.risk] || '#8b5cf6'}" stroke-width="0.5"/><text x="${40 + i * (bw + 4) + bw / 2}" y="${h - 6}" text-anchor="middle" fill="#6b7280" font-size="6" transform="rotate(-25, ${40 + i * (bw + 4) + bw / 2}, ${h - 6})">${d.name}</text></g>`)}
        <line x1="35" y1="${h - 20}" x2="${w - 10}" y2="${h - 20}" stroke="#374151" stroke-width="1"/>
      </svg>
    </div>`;
  }

  private _renderEnhancedSection(): any {
    if (!this._showEnhanced) return nothing;
    return html`<div style="margin-top:16px;border-top:1px solid #374151;padding-top:16px">
      <div style="display:flex;gap:4px;margin-bottom:12px;border-bottom:1px solid #374151;padding-bottom:8px">
        <button class="btn btn-sm ${this._settingsTab === 'audit' ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._settingsTab = 'audit'; }}>Audit</button>
        <button class="btn btn-sm ${this._settingsTab === 'history' ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._settingsTab = 'history'; }}>History</button>
        <button class="btn btn-sm ${this._settingsTab === 'settings' ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._settingsTab = 'settings'; }}>Settings</button>
      </div>
      ${this._settingsTab === 'audit' ? this._renderAuditPanel() : ''}
      ${this._settingsTab === 'history' ? this._renderExecHistory() : ''}
      ${this._settingsTab === 'settings' ? this._renderSettingsPanel() : ''}
      <div style="margin-top:12px">
        ${this._renderRiskGauge()}
        ${this._renderBarChart()}
      </div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <div style="flex:1;padding:8px;border-radius:6px;border:1px solid #374151;background:#1f2937;color:#94a3b8;font-size:11px;cursor:pointer;text-align:center" @click=${() => { this._addAudit('export', 'Report exported'); }}>Export Report</div>
        <div style="flex:1;padding:8px;border-radius:6px;border:1px solid #374151;background:#1f2937;color:#94a3b8;font-size:11px;cursor:pointer;text-align:center" @click=${this._runScanWithHistory}>Run Analysis</div>
      </div>
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid #374151;display:flex;justify-content:space-between;font-size:10px;color:#6b7280">
        <span>Last scan: ${this._execHistory.length > 0 ? new Date(this._execHistory[0].timestamp).toLocaleString() : 'Never'}</span>
        <span>${this._nodes.length} items | ${this._auditTrail.length} audit entries</span>
      </div>
    </div>`;
  }


  render() {
    const totalViolations = this._analyses.reduce((s, a) => s + a.complianceViolations.length, 0);
    const highRiskFlows = this._analyses.filter(a => a.riskScore > 50).length;

    return html`
      <div class="panel">
        <div class="header"><div class="title"><span>&#x1F4CA;</span> Data Flow Tracker</div></div>
        <div class="tabs">
          <button class="tab ${this._activeTab === 'overview' ? 'active' : ''}" @click=${() => { this._activeTab = 'overview'; }}>Overview</button>
          <button class="tab ${this._activeTab === 'nodes' ? 'active' : ''}" @click=${() => { this._activeTab = 'nodes'; }}>Data Nodes (${this._nodes.length})</button>
          <button class="tab ${this._activeTab === 'flows' ? 'active' : ''}" @click=${() => { this._activeTab = 'flows'; }}>Flows (${this._flows.length})</button>
          <button class="tab ${this._activeTab === 'analysis' ? 'active' : ''}" @click=${() => { this._activeTab = 'analysis'; }}>Analysis</button>
          <button class="tab ${this._activeTab === 'boundaries' ? 'active' : ''}" @click=${() => { this._activeTab = 'boundaries'; }}>Boundaries</button>
          <button class="tab ${this._activeTab === 'export' ? 'active' : ''}" @click=${() => { this._activeTab = 'export'; }}>Export</button>
        </div>

        ${this._activeTab === 'overview' ? html`
          <div class="stat-grid">
            <div class="stat"><div class="stat-value" style="color:#60a5fa">${this._nodes.length}</div><div class="stat-label">Data Nodes</div></div>
            <div class="stat"><div class="stat-value" style="color:#34d399">${this._flows.length}</div><div class="stat-label">Data Flows</div></div>
            <div class="stat"><div class="stat-value" style="color:#f87171">${highRiskFlows}</div><div class="stat-label">High-Risk Flows</div></div>
            <div class="stat"><div class="stat-value" style="color:#fbbf24">${totalViolations}</div><div class="stat-label">Compliance Issues</div></div>
          </div>
          <div style="font-weight:600;margin-bottom:8px">Data Flow Map (SVG):</div>
          <svg viewBox="0 0 800 400" style="width:100%;background:#0a0c10;border-radius:8px;border:1px solid #2a2d3a;margin-bottom:16px">
            ${this._nodes.map((n, i) => {
              const cols = 5;
              const x = (i % cols) * 150 + 50;
              const y = Math.floor(i / cols) * 150 + 50;
              const color = n.sensitivity === 'top-secret' ? '#f87171' : n.sensitivity === 'restricted' ? '#f97316' : n.sensitivity === 'confidential' ? '#fbbf24' : n.sensitivity === 'internal' ? '#60a5fa' : '#34d399';
              return html`<g>
                <rect x="${x - 40}" y="${y - 20}" width="80" height="40" rx="6" fill="#1a1d27" stroke="${color}" stroke-width="2"/>
                <text x="${x}" y="${y + 4}" text-anchor="middle" fill="#e2e8f0" font-size="9" font-weight="600">${n.name.length > 16 ? n.name.slice(0, 16) + '...' : n.name}</text>
              </g>`;
            })}
            ${this._flows.map(f => {
              const si = this._nodes.findIndex(n => n.id === f.source);
              const di = this._nodes.findIndex(n => n.id === f.destination);
              if (si < 0 || di < 0) return nothing;
              const cols = 5;
              const sx = (si % cols) * 150 + 50;
              const sy = Math.floor(si / cols) * 150 + 50;
              const dx = (di % cols) * 150 + 50;
              const dy = Math.floor(di / cols) * 150 + 50;
              const color = f.riskScore > 60 ? '#f87171' : f.riskScore > 35 ? '#fbbf24' : '#34d399';
              const midX = (sx + dx) / 2;
              const midY = (sy + dy) / 2 - 20;
              return html`<path d="M${sx},${sy} Q${midX},${midY} ${dx},${dy}" fill="none" stroke="${color}" stroke-width="1.5" stroke-opacity="0.6" marker-end="url(#arrow)"/>`;
            })}
            <defs><marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#6b7280"/></marker></defs>
          </svg>
          <div class="btn-row">
            <button class="btn btn-primary" @click=${this._analyzeFlows}>Run Full Flow Analysis</button>
          </div>
        ` : nothing}

        ${this._activeTab === 'nodes' ? html`
          <div class="filter-row">
            <label style="font-size:12px">Filter:</label>
            <select .value=${this._filterSensitivity} @change=${(e: Event) => { this._filterSensitivity = (e.target as HTMLSelectElement).value as any; } style="background:#1a1d27;border:1px solid #2a2d3a;border-radius:6px;padding:6px 10px;color:#e2e8f0;font-size:12px;font-family:inherit">
              <option value="all">All Sensitivities</option>
              <option value="public">Public</option><option value="internal">Internal</option><option value="confidential">Confidential</option><option value="restricted">Restricted</option><option value="top-secret">Top Secret</option>
            </select>
          </div>
          <div class="node-grid">${this._nodes.filter(n => this._filterSensitivity === 'all' || n.sensitivity === this._filterSensitivity).map(n => html`
            <div class="node-card ${this._selectedNode?.id === n.id ? 'selected' : ''}" @click=${() => { this._selectedNode = n; }}>
              <div class="node-name">${n.name}</div>
              <div class="node-meta">
                <span class="tag">${n.type}</span>
                <span class="sens-${n.sensitivity}" style="font-weight:600">${n.sensitivity.toUpperCase()}</span>
              </div>
              <div class="node-meta" style="margin-top:4px">Data: ${n.dataTypes.join(', ')}</div>
              <div class="node-meta">Records: ${n.recordCount} | Encrypted: ${n.encryption ? 'Yes' : 'NO'} | ACL: ${n.accessControl ? 'Yes' : 'NO'}</div>
              <div class="node-meta">Flows: ${this._flows.filter(f => f.source === n.id || f.destination === n.id).length}</div>
            </div>
          `)}</div>
        ` : nothing}

        ${this._activeTab === 'flows' ? html`
          <div style="font-weight:600;margin-bottom:8px">All Data Flows (${this._flows.length})</div>
          ${this._flows.sort((a, b) => b.riskScore - a.riskScore).map(f => html`
            <div class="flow-card">
              <div class="flow-header" @click=${() => { this._expandedFlow = this._expandedFlow === f.id ? null : f.id; }}>
                <span class="flow-source">${this._getNodeName(f.source)}</span>
                <span class="flow-arrow">&#x27A1;</span>
                <span class="flow-dest">${this._getNodeName(f.destination)}</span>
                <span class="tag">${f.type}</span>
                <span style="margin-left:auto;font-weight:700;font-size:12px;color:${f.riskScore > 60 ? '#f87171' : f.riskScore > 35 ? '#fbbf24' : '#34d399'}">Risk: ${f.riskScore}%</span>
              </div>
              <div class="flow-meta">
                <span class="tag">${f.protocol}</span>
                <span>${f.encrypted ? 'Encrypted' : '<span style="color:#f87171;font-weight:600">UNENCRYPTED</span>'}</span>
                <span>${f.authenticated ? 'Auth' : '<span style="color:#fbbf24">No Auth</span>'}</span>
                <span>Volume: ${f.volume}</span>
                <span>Freq: ${f.frequency}</span>
                ${f.complianceFlags.map(cf => html`<span class="tag">${cf}</span>`)}
              </div>
              ${this._expandedFlow === f.id ? html`
                <div class="flow-detail">
                  <div>Format: ${f.format} | Protocol: ${f.protocol}</div>
                  <div>Volume: ${f.volume} | Frequency: ${f.frequency}</div>
                  <div>Encryption: ${f.encrypted ? 'Yes (TLS)' : 'None - RISK'} | Auth: ${f.authenticated ? 'Yes' : 'None - RISK'}</div>
                  <div>Source Sensitivity: ${this._getNode(f.source)?.sensitivity || 'unknown'} | Dest: ${this._getNode(f.destination)?.sensitivity || 'unknown'}</div>
                </div>
              ` : nothing}
            </div>
          `)}
        ` : nothing}

        ${this._activeTab === 'analysis' ? html`
          <div class="btn-row">
            <button class="btn btn-primary" ?disabled=${this._analyzing} @click=${this._analyzeFlows}>
              ${this._analyzing ? 'Analyzing...' : 'Run Analysis'}
            </button>
          </div>
          ${this._analyzing ? html`<div class="progress-bar"><div class="progress-fill" style="width:${this._progress}%"></div></div>` : nothing}
          ${this._output.length > 0 ? html`<div class="output-box">${this._output.map(l => html`<div class="${l.startsWith('[+]') ? 'output-success' : l.startsWith('[!]') || l.startsWith('[-]') ? 'output-error' : 'output-info'}">${l}</div>`)}</div>` : nothing}
          ${this._analyses.length > 0 && !this._analyzing ? html`
            <div style="font-weight:600;margin:12px 0 8px">Findings by Flow:</div>
            ${this._analyses.sort((a, b) => b.riskScore - a.riskScore).map(a => {
              const flow = this._flows.find(f => f.id === a.flowId);
              if (!flow) return nothing;
              return html`<div style="background:#1a1d27;border:1px solid #2a2d3a;border-radius:8px;padding:10px 12px;margin-bottom:6px;border-left:3px solid ${a.riskScore > 60 ? '#f87171' : a.riskScore > 35 ? '#fbbf24' : '#34d399'}">
                <div style="font-weight:600;font-size:13px">${this._getNodeName(flow.source)} -> ${this._getNodeName(flow.destination)} <span style="color:${a.riskScore > 60 ? '#f87171' : '#fbbf24'}">Risk: ${a.riskScore}%</span></div>
                ${a.findings.map(f => html`<div style="font-size:12px;color:#fbbf24;padding:2px 0">! ${f}</div>`)}
                ${a.recommendations.map(r => html`<div style="font-size:12px;color:#34d399;padding:2px 0">+ ${r}</div>`)}
                ${a.complianceViolations.map(v => html`<div style="font-size:11px;color:#f87171;padding:2px 0">- ${v.framework}: ${v.rule} (${v.severity})</div>`)}
              </div>`;
            })}
          ` : nothing}
        ` : nothing}

        ${this._activeTab === 'boundaries' ? html`
          <div style="font-weight:600;margin-bottom:8px">Trust Boundary Rules</div>
          ${ZONE_RULES.map(z => html`
            <div class="boundary-card">
              <div class="boundary-name">${z.name} <span class="enforce-${z.enforcement}" style="font-size:11px;font-weight:700">[${z.enforcement.toUpperCase()}]</span></div>
              <div class="boundary-desc">${z.description}</div>
              <div style="font-size:11px;color:#6b7280;margin-top:4px">${z.sourceZone} -> ${z.destZone} | Allowed: ${z.dataAllowed.join(', ')}</div>
            </div>
          `)}
          <div style="font-weight:600;margin:16px 0 8px">Flow-Boundary Crossings:</div>
          ${this._flows.filter(f => f.type === 'cross-zone' || f.type === 'external' || f.type === 'cloud-sync').map(f => html`
            <div style="background:#1a1d27;border:1px solid #2a2d3a;border-radius:6px;padding:8px 12px;margin-bottom:4px;font-size:12px">
              <span class="flow-source">${this._getNodeName(f.source)}</span> <span class="flow-arrow">&#x27A1;</span> <span class="flow-dest">${this._getNodeName(f.destination)}</span>
              <span class="tag" style="margin-left:8px">${f.type}</span>
              <span style="margin-left:auto;color:${f.riskScore > 60 ? '#f87171' : '#fbbf24'};font-weight:600">Risk: ${f.riskScore}%</span>
            </div>
          `)}
        ` : nothing}

        ${this._activeTab === 'export' ? html`
          <div class="stat-grid">
            <div class="stat"><div class="stat-value">${this._nodes.length}</div><div class="stat-label">Data Nodes</div></div>
            <div class="stat"><div class="stat-value">${this._flows.length}</div><div class="stat-label">Data Flows</div></div>
            <div class="stat"><div class="stat-value" style="color:#f87171">${this._flows.filter(f => !f.encrypted).length}</div><div class="stat-label">Unencrypted Flows</div></div>
            <div class="stat"><div class="stat-value" style="color:#fbbf24">${totalViolations}</div><div class="stat-label">Compliance Issues</div></div>
          </div>
          <div class="btn-row">
            <button class="btn btn-primary" @click=${this._exportReport}>Export Full Report (JSON)</button>
            <button class="btn btn-secondary" @click=${() => {
              const csv = 'Source,Destination,Type,Protocol,Encrypted,Authenticated,RiskScore,Volume,Frequency\n' +
                this._flows.map(f => `"${this._getNodeName(f.source)}","${this._getNodeName(f.destination)}",${f.type},${f.protocol},${f.encrypted},${f.authenticated},${f.riskScore},"${f.volume}","${f.frequency}"`).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'data-flows.csv'; a.click(); URL.revokeObjectURL(url);
            }>Export Flows (CSV)</button>
          </div>
        ` : nothing}
      </div>
      </div>
      <div style="margin-top:12px;display:flex;justify-content:center">
        <button class="btn btn-sm ${this._showEnhanced ? 'btn-primary' : 'btn-secondary'}" @click=${() => {{ this._showEnhanced = !this._showEnhanced; this.requestUpdate(); }}>${this._showEnhanced ? 'Hide' : 'Show'} Advanced</button>
      </div>
      ${this._renderEnhancedSection()}
    `;
  }
}
