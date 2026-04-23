/**
 * sc-architecture-attack.ts — Architecture Security Assessment (Architect Dark Capability)
 * Trust boundary analysis, attack surface enumeration, defense-in-depth assessment,
 * micro-segmentation gap analysis, remediation priority matrix
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';

type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
type ZoneTrust = 'untrusted' | 'semi-trusted' | 'trusted' | 'highly-trusted';
type AssessStatus = 'idle' | 'analyzing' | 'complete';

interface ArchZone {
  id: string;
  name: string;
  trust: ZoneTrust;
  description: string;
  assets: string[];
  dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
  controls: { name: string; type: string; effective: boolean }[];
}

interface TrustBoundary {
  id: string;
  sourceZone: string;
  targetZone: string;
  controlType: string;
  enforcement: 'strong' | 'moderate' | 'weak' | 'none';
  dataFlow: string[];
  protocols: string[];
  bypassPossible: boolean;
  bypassMethod?: string;
}

interface AttackSurfaceItem {
  id: string;
  zone: string;
  type: 'api' | 'web' | 'service' | 'database' | 'file' | 'network' | 'identity' | 'cloud';
  name: string;
  exposure: 'internet' | 'internal' | 'restricted';
  authentication: 'none' | 'basic' | 'oauth' | 'mfa' | 'cert';
  encryption: 'none' | 'tls' | 'mtls' | 'e2e';
  vulnerabilities: { name: string; severity: RiskLevel; description: string }[];
  riskScore: number;
}

interface DidLayer {
  name: string;
  controls: string[];
  gaps: string[];
  effectiveness: number;
}

interface RemediationItem {
  id: string;
  title: string;
  category: string;
  priority: number;
  effort: 'low' | 'medium' | 'high';
  impact: number;
  affectedZones: string[];
  description: string;
}

const TRUST_COLORS: Record<ZoneTrust, string> = {
  'untrusted': '#ef4444', 'semi-trusted': '#f59e0b', 'trusted': '#3b82f6', 'highly-trusted': '#8b5cf6'
};

@customElement('sc-architecture-attack')
export class ScArchitectureAttack extends LitElement {
  @property({ type: String }) panelId = 'architecture-attack';
  @state() private _zones: ArchZone[] = [];
  @state() private _boundaries: TrustBoundary[] = [];
  @state() private _attackSurface: AttackSurfaceItem[] = [];
  @state() private _didLayers: DidLayer[] = [];
  @state() private _remediations: RemediationItem[] = [];
  @state() private _status: AssessStatus = 'idle';
  @state() private _progress = 0;
  @state() private _activeTab: 'zones' | 'boundaries' | 'surface' | 'did' | 'remediation' | 'report' = 'zones';
  @state() private _selectedZone: ArchZone | null = null;
  @state() private _showReport = false;
  @state() private _reportContent = '';
  @state() private _overallRiskScore = 0;
  @state() private _totalFindings = 0;
  @state() private _criticalFindings = 0;
  @state() private _segmentationScore = 0;

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
    .stats-bar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
    .stat { background: #1a1d27; border-radius: 8px; padding: 10px 16px; text-align: center; min-width: 90px; }
    .stat-value { font-size: 22px; font-weight: 700; }
    .stat-label { font-size: 11px; color: #9ca3af; margin-top: 2px; }

    .tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid #2a2d3a; overflow-x: auto; }
    .tab { padding: 8px 16px; cursor: pointer; border: none; background: none; color: #6b7280; font-size: 13px; font-weight: 500; border-bottom: 2px solid transparent; transition: all 0.2s; white-space: nowrap; }
    .tab:hover { color: #d1d5db; }
    .tab.active { color: #e2e8f0; border-bottom-color: #3b82f6; }

    .btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s; font-family: inherit; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: #3b82f6; color: white; }
    .btn-primary:hover:not(:disabled) { background: #2563eb; }
    .btn-secondary { background: #374151; color: #d1d5db; }
    .btn-secondary:hover:not(:disabled) { background: #4b5563; }
    .btn-sm { padding: 4px 10px; font-size: 11px; }
    .btn-row { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }

    .progress-bar { width: 100%; height: 6px; background: #1a1d27; border-radius: 3px; overflow: hidden; margin-bottom: 12px; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); border-radius: 3px; transition: width 0.3s; }

    .zone-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
    .zone-card { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 14px; cursor: pointer; transition: all 0.2s; border-top: 3px solid transparent; }
    .zone-card:hover { border-color: #3b82f6; }
    .zone-card.selected { border-color: #3b82f6; background: #1e2a3a; }
    .zone-name { font-weight: 600; font-size: 14px; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
    .zone-trust { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
    .zone-desc { font-size: 12px; color: #9ca3af; margin-bottom: 8px; }
    .zone-assets { font-size: 11px; color: #d1d5db; }
    .zone-controls { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 6px; }
    .control-tag { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #374151; color: #d1d5db; }
    .control-effective { background: #064e3b; color: #34d399; }
    .control-ineffective { background: #7f1d1d; color: #fca5a5; }

    .boundary-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .boundary-table th { text-align: left; padding: 8px 12px; background: #1a1d27; color: #9ca3af; font-weight: 600; border-bottom: 1px solid #2a2d3a; }
    .boundary-table td { padding: 8px 12px; border-bottom: 1px solid #1a1d27; }
    .boundary-table tr:hover td { background: #1a1d27; }

    .surface-list { display: flex; flex-direction: column; gap: 8px; }
    .surface-card { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 12px; }
    .surface-name { font-weight: 600; font-size: 13px; margin-bottom: 4px; }
    .surface-meta { display: flex; gap: 8px; flex-wrap: wrap; font-size: 11px; margin-bottom: 6px; }
    .surface-vuln { font-size: 11px; padding: 3px 8px; border-radius: 4px; margin-top: 4px; }
    .vuln-critical { background: rgba(220,38,38,0.15); color: #fca5a5; }
    .vuln-high { background: rgba(245,158,11,0.15); color: #fcd34d; }
    .vuln-medium { background: rgba(59,130,246,0.15); color: #93c5fd; }

    .did-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
    .did-card { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 14px; text-align: center; }
    .did-name { font-weight: 600; font-size: 13px; margin-bottom: 8px; }
    .did-score { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
    .did-bar { height: 6px; background: #1a1d27; border-radius: 3px; overflow: hidden; margin: 8px 0; }
    .did-fill { height: 100%; border-radius: 3px; }
    .did-gap { font-size: 11px; color: #f87171; }

    .remediation-list { display: flex; flex-direction: column; gap: 8px; }
    .rem-card { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 12px; display: flex; gap: 12px; align-items: flex-start; }
    .rem-priority { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0; }
    .p-critical { background: #7f1d1d; color: #fca5a5; }
    .p-high { background: #78350f; color: #fcd34d; }
    .p-medium { background: #1e3a5f; color: #93c5fd; }
    .p-low { background: #374151; color: #d1d5db; }
    .rem-content { flex: 1; }
    .rem-title { font-weight: 600; font-size: 13px; margin-bottom: 4px; }
    .rem-desc { font-size: 12px; color: #9ca3af; margin-bottom: 6px; }
    .rem-meta { display: flex; gap: 12px; font-size: 11px; }

    .report-box { background: #0a0c10; border: 1px solid #2a2d3a; border-radius: 8px; padding: 16px; font-size: 12px; line-height: 1.8; max-height: 400px; overflow-y: auto; white-space: pre-wrap; font-family: 'JetBrains Mono', monospace; color: #d1d5db; }
    .empty-state { text-align: center; padding: 40px; color: #6b7280; }
    .detail-panel { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 16px; margin-bottom: 16px; }

    @media (max-width: 640px) {
      .zone-grid, .did-grid { grid-template-columns: 1fr; }
      .stats-bar { flex-direction: column; }
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
    .intel-row { display: flex; gap: 10px; padding: 8px; background: #0a0c10; border-radius: 6px; margin-bottom: 6px; align-items: center; }
    .intel-type { padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
    .intel-val { font-family: monospace; font-size: 12px; color: #e2e8f0; min-width: 120px; }
    .intel-desc { flex: 1; font-size: 10px; color: #6b7280; }
    .intel-conf { font-size: 10px; font-weight: 700; min-width: 40px; text-align: right; }
    .insight-card { background: linear-gradient(135deg, #1a1d27 0%, #0a0c10 100%); border-radius: 8px; padding: 14px; margin-bottom: 8px; border-left: 3px solid #f97316; }
    .insight-title { font-size: 12px; font-weight: 700; color: #f97316; margin-bottom: 4px; }
    .insight-body { font-size: 11px; color: #9ca3af; line-height: 1.5; }
    .trend-indicator { display: inline-flex; align-items: center; gap: 3px; font-size: 10px; font-weight: 700; }
    .trend-up { color: #f87171; }
    .trend-down { color: #34d399; }
    .trend-flat { color: #9ca3af; }
    .risk-factor-row { display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid #0a0c10; font-size: 11px; }
    .risk-factor-label { flex: 1; color: #9ca3af; }
    .risk-factor-bar { width: 100px; height: 6px; background: #1f2937; border-radius: 3px; overflow: hidden; }
    .risk-factor-fill { height: 100%; border-radius: 3px; }
    .config-select { padding: 6px 10px; background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 6px; color: #e2e8f0; font-size: 11px; outline: none; }
    .config-select:focus { border-color: #f97316; }
  `;

  private _runAssessment(): void {
    this._status = 'analyzing';
    this._progress = 0;

    this._zones = [
      { id: 'z1', name: 'Internet / DMZ', trust: 'untrusted', description: 'Public-facing infrastructure', assets: ['Load Balancer', 'WAF', 'Reverse Proxy', 'Web Servers'], dataClassification: 'public', controls: [{ name: 'WAF', type: 'network', effective: true }, { name: 'DDoS Protection', type: 'network', effective: true }, { name: 'TLS Termination', type: 'crypto', effective: true }, { name: 'Rate Limiting', type: 'network', effective: false }] },
      { id: 'z2', name: 'Application Tier', trust: 'semi-trusted', description: 'Application servers and APIs', assets: ['API Gateway', 'App Servers', 'Cache Layer', 'Message Queue'], dataClassification: 'internal', controls: [{ name: 'API Authentication', type: 'identity', effective: true }, { name: 'Input Validation', type: 'application', effective: false }, { name: 'CORS Policy', type: 'application', effective: true }, { name: 'Secrets Management', type: 'crypto', effective: false }] },
      { id: 'z3', name: 'Data Tier', trust: 'trusted', description: 'Databases and data stores', assets: ['Primary DB', 'Replica DB', 'Data Warehouse', 'Object Storage'], dataClassification: 'restricted', controls: [{ name: 'Encryption at Rest', type: 'crypto', effective: true }, { name: 'TDE', type: 'crypto', effective: true }, { name: 'Access Controls', type: 'identity', effective: true }, { name: 'Audit Logging', type: 'monitoring', effective: false }] },
      { id: 'z4', name: 'Management / Admin', trust: 'highly-trusted', description: 'Infrastructure management plane', assets: ['AD Controller', 'SSH Bastion', 'CI/CD Pipeline', 'Monitoring Stack'], dataClassification: 'confidential', controls: [{ name: 'MFA Required', type: 'identity', effective: true }, { name: 'Privileged Access Mgmt', type: 'identity', effective: false }, { name: 'Jump Host', type: 'network', effective: true }, { name: 'Session Recording', type: 'monitoring', effective: false }] },
      { id: 'z5', name: 'Cloud Services', trust: 'semi-trusted', description: 'Cloud infrastructure and services', assets: ['Kubernetes Cluster', 'Serverless Functions', 'Cloud Storage', 'IAM'], dataClassification: 'internal', controls: [{ name: 'IAM Policies', type: 'identity', effective: false }, { name: 'Network Policies', type: 'network', effective: true }, { name: 'Secrets Rotation', type: 'crypto', effective: false }, { name: 'VPC Isolation', type: 'network', effective: true }] },
      { id: 'z6', name: 'Partner / B2B', trust: 'semi-trusted', description: 'Third-party integrations', assets: ['API Integrations', 'VPN Gateways', 'SFTP Servers', 'Webhooks'], dataClassification: 'internal', controls: [{ name: 'VPN Encryption', type: 'crypto', effective: true }, { name: 'API Key Rotation', type: 'identity', effective: false }, { name: 'IP Whitelisting', type: 'network', effective: true }, { name: 'Data Loss Prevention', type: 'monitoring', effective: false }] },
    ];

    this._boundaries = [
      { id: 'b1', sourceZone: 'z1', targetZone: 'z2', controlType: 'WAF + API Gateway', enforcement: 'moderate', dataFlow: ['HTTP/HTTPS', 'WebSocket'], protocols: ['HTTPS', 'WSS'], bypassPossible: true, bypassMethod: 'API path traversal or malformed requests bypassing WAF rules' },
      { id: 'b2', sourceZone: 'z2', targetZone: 'z3', controlType: 'Service Mesh + Network Policy', enforcement: 'moderate', dataFlow: ['SQL queries', 'Object storage ops'], protocols: ['gRPC', 'AMQP', 'S3 API'], bypassPossible: true, bypassMethod: 'Compromised service account with cross-tier access' },
      { id: 'b3', sourceZone: 'z4', targetZone: 'z3', controlType: 'PAM + Just-in-Time Access', enforcement: 'weak', dataFlow: ['DB admin queries', 'Backup operations'], protocols: ['SSH', 'RDP', 'JDBC'], bypassPossible: true, bypassMethod: 'Over-privileged admin accounts without JIT enforcement' },
      { id: 'b4', sourceZone: 'z1', targetZone: 'z4', controlType: 'Bastion + MFA', enforcement: 'strong', dataFlow: ['Admin access'], protocols: ['SSH', 'HTTPS'], bypassPossible: false },
      { id: 'b5', sourceZone: 'z5', targetZone: 'z3', controlType: 'IAM Roles + VPC Endpoints', enforcement: 'weak', dataFlow: ['Database queries', 'Storage ops'], protocols: ['HTTPS', 'PrivateLink'], bypassPossible: true, bypassMethod: 'Overly permissive IAM role allowing direct data access' },
      { id: 'b6', sourceZone: 'z6', targetZone: 'z2', controlType: 'API Gateway + Rate Limit', enforcement: 'moderate', dataFlow: ['B2B data exchange'], protocols: ['HTTPS', 'SFTP'], bypassPossible: true, bypassMethod: 'Stolen API keys or compromised partner credentials' },
      { id: 'b7', sourceZone: 'z6', targetZone: 'z3', controlType: 'Data Masking + DLP', enforcement: 'weak', dataFlow: ['Partner data access'], protocols: ['SQL', 'S3'], bypassPossible: true, bypassMethod: 'DLP rules not covering new data formats; masking incomplete' },
    ];

    this._attackSurface = [
      { id: 's1', zone: 'z1', type: 'web', name: 'Public Website', exposure: 'internet', authentication: 'none', encryption: 'tls', vulnerabilities: [{ name: 'SQL Injection', severity: 'critical', description: 'User input not parameterized in search' }, { name: 'XSS (Stored)', severity: 'high', description: 'User comments not sanitized' }], riskScore: 9.2 },
      { id: 's2', zone: 'z1', type: 'api', name: 'REST API v1', exposure: 'internet', authentication: 'oauth', encryption: 'tls', vulnerabilities: [{ name: 'Broken Object Authorization', severity: 'critical', description: 'IDOR allows accessing other users data' }, { name: 'Rate Limit Bypass', severity: 'medium', description: 'Rate limit applied per IP not per user' }], riskScore: 8.8 },
      { id: 's3', zone: 'z2', type: 'api', name: 'Internal API', exposure: 'internal', authentication: 'basic', encryption: 'none', vulnerabilities: [{ name: 'No Authentication on Debug Endpoints', severity: 'critical', description: '/debug and /metrics exposed without auth' }, { name: 'Hardcoded Credentials', severity: 'critical', description: 'Service accounts in source code' }], riskScore: 9.5 },
      { id: 's4', zone: 'z3', type: 'database', name: 'Primary PostgreSQL', exposure: 'restricted', authentication: 'cert', encryption: 'e2e', vulnerabilities: [{ name: 'Excessive Database Privileges', severity: 'high', description: 'App role has DROP TABLE permission' }], riskScore: 7.2 },
      { id: 's5', zone: 'z4', type: 'identity', name: 'Active Directory', exposure: 'restricted', authentication: 'mfa', encryption: 'tls', vulnerabilities: [{ name: 'Kerberoasting', severity: 'high', description: 'Service accounts with weak SPNs' }, { name: 'AS-REP Roasting', severity: 'medium', description: 'Accounts without pre-auth required' }], riskScore: 8.1 },
      { id: 's6', zone: 'z5', type: 'cloud', name: 'Kubernetes API', exposure: 'internal', authentication: 'cert', encryption: 'mtls', vulnerabilities: [{ name: 'Privileged Pod Escalation', severity: 'critical', description: 'Pods running as root with hostPath mounts' }, { name: 'Network Policy Not Enforced', severity: 'high', description: 'Default allow-all network policy' }], riskScore: 9.0 },
      { id: 's7', zone: 'z6', type: 'api', name: 'Partner API', exposure: 'internet', authentication: 'oauth', encryption: 'tls', vulnerabilities: [{ name: 'API Key in URL', severity: 'medium', description: 'API key passed as query parameter' }, { name: 'No Request Signing', severity: 'medium', description: 'Requests not signed, susceptible to replay' }], riskScore: 6.5 },
      { id: 's8', zone: 'z2', type: 'service', name: 'Redis Cache', exposure: 'internal', authentication: 'none', encryption: 'none', vulnerabilities: [{ name: 'No Authentication', severity: 'critical', description: 'Redis accessible without password' }, { name: 'Sensitive Data in Cache', severity: 'high', description: 'Session tokens and PII cached without encryption' }], riskScore: 9.3 },
    ];

    this._didLayers = [
      { name: 'Perimeter', controls: ['WAF', 'DDoS Protection', 'Firewall', 'TLS'], gaps: ['Rate limiting not enforced', 'Geo-blocking disabled'], effectiveness: 72 },
      { name: 'Network', controls: ['Segmentation', 'Network Policies', 'VPN'], gaps: ['Flat network in app tier', 'No east-west traffic inspection'], effectiveness: 58 },
      { name: 'Host', controls: ['HIDS', 'Endpoint Protection', 'Patching'], gaps: ['Agent coverage 85%', 'Patch SLA > 30 days'], effectiveness: 65 },
      { name: 'Application', controls: ['Input Validation', 'CORS', 'CSRF Protection'], gaps: ['No SAST in CI/CD', 'Legacy endpoints unvalidated'], effectiveness: 45 },
      { name: 'Data', controls: ['Encryption at Rest', 'TDE', 'Access Controls'], gaps: ['No DLP', 'Encryption key rotation > 1 year', 'No data classification enforcement'], effectiveness: 52 },
      { name: 'Identity', controls: ['MFA', 'SSO', 'PAM', 'RBAC'], gaps: ['PAM not enforced for all admins', 'No privileged session recording', 'Service account sprawl'], effectiveness: 55 },
    ];

    this._remediations = [
      { id: 'r1', title: 'Implement Input Validation on All Endpoints', category: 'Application Security', priority: 1, effort: 'medium', impact: 85, affectedZones: ['z1', 'z2'], description: 'Add server-side input validation and parameterized queries for all user-facing endpoints. Deploy SAST in CI/CD pipeline.' },
      { id: 'r2', title: 'Enforce Micro-Segmentation in Application Tier', category: 'Network Security', priority: 2, effort: 'high', impact: 80, affectedZones: ['z2', 'z3', 'z5'], description: 'Implement network policies to restrict lateral movement. Enforce zero-trust between services. Enable east-west traffic inspection.' },
      { id: 'r3', title: 'Deploy Secrets Management Across All Tiers', category: 'Identity & Access', priority: 3, effort: 'medium', impact: 90, affectedZones: ['z2', 'z3', 'z4', 'z5'], description: 'Remove hardcoded credentials. Implement HashiCorp Vault or cloud-native secrets manager. Enable automatic rotation.' },
      { id: 'r4', title: 'Secure Redis with Authentication and TLS', category: 'Data Security', priority: 4, effort: 'low', impact: 75, affectedZones: ['z2'], description: 'Enable Redis AUTH. Configure TLS for connections. Remove sensitive data from cache. Implement cache encryption.' },
      { id: 'r5', title: 'Fix Kubernetes Pod Security', category: 'Cloud Security', priority: 5, effort: 'medium', impact: 85, affectedZones: ['z5'], description: 'Enforce Pod Security Standards. Remove root containers. Disable hostPath mounts. Implement default deny network policies.' },
      { id: 'r6', title: 'Implement Data Loss Prevention', category: 'Data Security', priority: 6, effort: 'high', impact: 70, affectedZones: ['z3', 'z6'], description: 'Deploy DLP solution for data exfiltration detection. Implement data classification labels. Monitor partner data flows.' },
      { id: 'r7', title: 'Harden Active Directory Configuration', category: 'Identity & Access', priority: 7, effort: 'medium', impact: 75, affectedZones: ['z4'], description: 'Disable AS-REP roastable accounts. Implement gMSA. Enable Credential Guard. Deploy PAM with JIT access.' },
      { id: 'r8', title: 'Implement API Rate Limiting per User', category: 'Application Security', priority: 8, effort: 'low', impact: 60, affectedZones: ['z1', 'z2'], description: 'Move rate limiting from IP-based to user-based. Implement request signing for partner APIs.' },
    ].sort((a, b) => a.priority - b.priority);

    this._overallRiskScore = Math.round(this._attackSurface.reduce((s, a) => s + a.riskScore, 0) / this._attackSurface.length * 10) / 10;
    this._totalFindings = this._attackSurface.reduce((s, a) => s + a.vulnerabilities.length, 0) + this._boundaries.filter(b => b.bypassPossible).length;
    this._criticalFindings = this._attackSurface.reduce((s, a) => s + a.vulnerabilities.filter(v => v.severity === 'critical').length, 0);
    this._segmentationScore = Math.round(this._didLayers.filter(l => l.name === 'Network')[0]?.effectiveness || 0);

    let p = 0;
    const iv = setInterval(() => {
      p += 8;
      this._progress = Math.min(p, 100);
      if (p >= 100) {
        clearInterval(iv);
        this._status = 'complete';
      }
    }, 150);
  }

  private _getTrustColor(trust: ZoneTrust): string { return TRUST_COLORS[trust] || '#6b7280'; }
  private _getRiskColor(score: number): string { return score >= 9 ? '#f87171' : score >= 7 ? '#fbbf24' : score >= 5 ? '#60a5fa' : '#34d399'; }
  private _getEnforcementColor(e: string): string { return e === 'strong' ? '#34d399' : e === 'moderate' ? '#fbbf24' : e === 'weak' ? '#f87171' : '#ef4444'; }
  private _getDidColor(eff: number): string { return eff >= 70 ? '#34d399' : eff >= 50 ? '#fbbf24' : '#f87171'; }

  private _generateReport(): void {
    const lines: string[] = [];
    lines.push('# Architecture Security Assessment Report');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('## Executive Summary');
    lines.push(`- Overall Risk Score: ${this._overallRiskScore}/10`);
    lines.push(`- Total Findings: ${this._totalFindings}`);
    lines.push(`- Critical Findings: ${this._criticalFindings}`);
    lines.push(`- Segmentation Score: ${this._segmentationScore}%`);
    lines.push('');
    lines.push('## Trust Zones');
    this._zones.forEach(z => {
      lines.push(`### ${z.name} [Trust: ${z.trust}, Classification: ${z.dataClassification}]`);
      lines.push(`- Assets: ${z.assets.join(', ')}`);
      lines.push(`- Controls: ${z.controls.map(c => c.name + (c.effective ? ' (effective)' : ' (ineffective)')).join(', ')}`);
    });
    lines.push('');
    lines.push('## Attack Surface');
    this._attackSurface.sort((a, b) => b.riskScore - a.riskScore).forEach(s => {
      lines.push(`### ${s.name} [Risk: ${s.riskScore}]`);
      lines.push(`- Zone: ${s.zone} | Type: ${s.type} | Exposure: ${s.exposure}`);
      lines.push(`- Auth: ${s.authentication} | Encryption: ${s.encryption}`);
      s.vulnerabilities.forEach(v => { lines.push(`  - [${v.severity.toUpperCase()}] ${v.name}: ${v.description}`); });
    });
    lines.push('');
    lines.push('## Defense-in-Depth Analysis');
    this._didLayers.forEach(l => {
      lines.push(`- ${l.name}: ${l.effectiveness}% effective`);
      lines.push(`  Gaps: ${l.gaps.join('; ')}`);
    });
    lines.push('');
    lines.push('## Top Remediations');
    this._remediations.slice(0, 5).forEach(r => {
      lines.push(`### P${r.priority}: ${r.title}`);
      lines.push(`- Category: ${r.category} | Effort: ${r.effort} | Impact: ${r.impact}%`);
      lines.push(`- Affected: ${r.affectedZones.join(', ')}`);
      lines.push(`- ${r.description}`);
    });
    this._reportContent = lines.join('\n');
    this._showReport = true;
    this._activeTab = 'report';
  }

  private _exportReport(): void {
    if (!this._reportContent) return;
    const blob = new Blob([this._reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arch-assessment-${Date.now()}.md`;
    a.click();
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
    const blob = new Blob(['architecture-attack export'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'architecture-attack-export.' + (format === 'markdown' ? 'md' : format); a.click();
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
    return html`
      <div class="panel">
        <div class="header">
          <div class="title"><span>&#x1F3D7;</span> Architecture Security Assessment</div>
          <div class="btn-row">
            <button class="btn btn-secondary btn-sm" @click=${() => { this._zones = []; this._boundaries = []; this._attackSurface = []; this._didLayers = []; this._remediations = []; this._status = 'idle'; this._progress = 0; }}>Reset</button>
            <button class="btn btn-secondary btn-sm" @click=${this._generateReport} ?disabled=${this._status !== 'complete'}>Generate Report</button>
          </div>
        </div>

        ${this._status === 'complete' ? html`
          <div class="stats-bar">
            <div class="stat"><div class="stat-value" style="color:${this._getRiskColor(this._overallRiskScore)}">${this._overallRiskScore}</div><div class="stat-label">Risk Score</div></div>
            <div class="stat"><div class="stat-value" style="color:#f87171">${this._criticalFindings}</div><div class="stat-label">Critical</div></div>
            <div class="stat"><div class="stat-value" style="color:#fbbf24">${this._totalFindings}</div><div class="stat-label">Total Findings</div></div>
            <div class="stat"><div class="stat-value" style="color:#60a5fa">${this._segmentationScore}%</div><div class="stat-label">Segmentation</div></div>
            <div class="stat"><div class="stat-value">${this._zones.length}</div><div class="stat-label">Zones</div></div>
            <div class="stat"><div class="stat-value">${this._boundaries.length}</div><div class="stat-label">Boundaries</div></div>
          </div>
        ` : nothing}

        <div class="btn-row">
          <button class="btn btn-primary" @click=${this._runAssessment} ?disabled=${this._status === 'analyzing'}>
            ${this._status === 'idle' ? 'Run Architecture Assessment' : 'Analyzing...'}
          </button>
        </div>

        ${this._status === 'analyzing' ? html`<div class="progress-bar"><div class="progress-fill" style="width:${this._progress}%"></div></div>` : nothing}

        ${this._status === 'complete' ? html`
          <div class="tabs">
            <button class="tab ${this._activeTab === 'zones' ? 'active' : ''}" @click=${() => { this._activeTab = 'zones'; }}>Zones</button>
            <button class="tab ${this._activeTab === 'boundaries' ? 'active' : ''}" @click=${() => { this._activeTab = 'boundaries'; }}>Boundaries</button>
            <button class="tab ${this._activeTab === 'surface' ? 'active' : ''}" @click=${() => { this._activeTab = 'surface'; }}>Attack Surface</button>
            <button class="tab ${this._activeTab === 'did' ? 'active' : ''}" @click=${() => { this._activeTab = 'did'; }}>Defense-in-Depth</button>
            <button class="tab ${this._activeTab === 'remediation' ? 'active' : ''}" @click=${() => { this._activeTab = 'remediation'; }}>Remediations</button>
            <button class="tab ${this._activeTab === 'report' ? 'active' : ''}" @click=${() => { this._activeTab = 'report'; }}>Report</button>
            <button class="tab ${this._activeTab === 'analytics' ? 'active' : ''}" @click=${() => { this._activeTab = 'analytics'; }}>Analytics</button>
            <button class="tab ${this._activeTab === 'compliance' ? 'active' : ''}" @click=${() => { this._activeTab = 'compliance'; }}>Compliance</button>
          </div>

          ${this._activeTab === 'zones' ? this._renderZones() : nothing}
          ${this._activeTab === 'boundaries' ? this._renderBoundaries() : nothing}
          ${this._activeTab === 'surface' ? this._renderSurface() : nothing}
          ${this._activeTab === 'did' ? this._renderDid() : nothing}
          ${this._activeTab === 'remediation' ? this._renderRemediations() : nothing}
          ${this._activeTab === 'report' ? this._renderReport() : nothing}
          ${this._activeTab === 'analytics' ? html`
            <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
              <div style="font-weight:600;font-size:12px;margin-bottom:10px;color:#9ca3af;text-transform:uppercase">CVSS Vulnerability Scores</div>
              ${this._findings.filter(f => f.severity === 'critical' || f.severity === 'high').slice(0, 4).map(f => {
                const cvss = this._cvssScore(f);
                const color = cvss.base >= 9.0 ? '#ef4444' : cvss.base >= 7.0 ? '#f97316' : cvss.base >= 4.0 ? '#fbbf24' : '#34d399';
                return html`<div style="display:flex;align-items:center;gap:10px;padding:6px;background:#0a0c10;border-radius:4px;margin-bottom:4px;font-size:11px">
                  <span style="min-width:24px;font-size:16px;font-weight:800;color:${color}">${cvss.base}</span>
                  <span style="flex:1;color:#e2e8f0">${f.title}</span>
                  <span style="font-size:8px;color:#6b7280;font-family:monospace">${cvss.vector}</span>
                </div>`;
              })}
            </div>
            ${this._renderTrendChart()}
            ${this._renderRiskAnalysis()}
            ${this._renderMitreArchCorrelation()}
            <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
              <div style="font-weight:600;font-size:12px;margin-bottom:10px;color:#9ca3af;text-transform:uppercase">Attack Path Tree</div>
              <div style="background:#0a0c10;border-radius:8px;padding:12px">${this._renderAttackPathTreeSVG()}</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
              <div>
                ${this._generateArchInsights().map(ins => html`
                  <div class="insight-card" style="border-left-color:${ins.severity === 'critical' ? '#ef4444' : ins.severity === 'warning' ? '#fbbf24' : '#3b82f6'}">
                    <div class="insight-title" style="color:${ins.severity === 'critical' ? '#ef4444' : ins.severity === 'warning' ? '#fbbf24' : '#3b82f6'}">${ins.severity.toUpperCase()}: ${ins.title}</div>
                    <div class="insight-body">${ins.body}</div>
                  </div>
                `)}
              </div>
              <div>
                ${this._archTrendData.map(d => html`
                  <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid #0a0c10;font-size:11px">
                    <span style="min-width:60px;color:#6b7280">${d.period}</span>
                    <div style="flex:1;height:6px;background:#1f2937;border-radius:3px;overflow:hidden"><div style="height:100%;width:${d.critical / d.findings * 100}%;background:#ef4444;border-radius:3px"></div></div>
                    <span style="min-width:50px;font-weight:600;color:#ef4444">${d.critical}/${d.findings}</span>
                    <span style="font-size:10px;color:${d.avgRisk <= 40 ? '#34d399' : d.avgRisk <= 55 ? '#fbbf24' : '#f87171'};min-width:30px;text-align:right">${d.avgRisk}</span>
                  </div>
                `)}
              </div>
            </div>
            <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
              <div style="font-weight:600;font-size:12px;margin-bottom:10px;color:#9ca3af;text-transform:uppercase">Attack Surface Flow</div>
              <div style="background:#0a0c10;border-radius:8px;padding:12px">${this._renderAttackSurfaceSankeySVG()}</div>
            </div>
            ${this._renderDefenseMatrix()}
            ${this._renderPanelConfig()}
          ` : nothing}
          ${this._activeTab === 'compliance' ? html`
            ${this._renderComplianceTab()}
            ${this._renderMitreArchCorrelation()}
            ${this._renderDefenseMatrix()}
          ` : nothing}
        ` : html`
          <div class="empty-state">Click "Run Architecture Assessment" to start the analysis</div>
        `}
      </div>
        ${this._renderRiskGauge()}
        ${this._renderFooter()}
      </div>
    `;
  }

  private _renderZones() {
    return html`<div class="zone-grid">${this._zones.map(z => html`
      <div class="zone-card" style="border-top-color:${this._getTrustColor(z.trust)}" @click=${() => { this._selectedZone = this._selectedZone?.id === z.id ? null : z; }}>
        <div class="zone-name">
          ${z.name}
          <span class="zone-trust" style="background:${this._getTrustColor(z.trust)}20;color:${this._getTrustColor(z.trust)}">${z.trust}</span>
        </div>
        <div class="zone-desc">${z.description}</div>
        <div class="zone-assets">Assets: ${z.assets.join(', ')}</div>
        <div style="font-size:11px;color:#9ca3af;margin-top:4px">Classification: ${z.dataClassification}</div>
        <div class="zone-controls">
          ${z.controls.map(c => html`<span class="control-tag ${c.effective ? 'control-effective' : 'control-ineffective'}">${c.name}</span>`)}
        </div>
        ${this._selectedZone?.id === z.id ? html`
          <div style="margin-top:10px;padding-top:8px;border-top:1px solid #2a2d3a">
            <div style="font-weight:600;font-size:12px;margin-bottom:6px">Connected Boundaries</div>
            ${this._boundaries.filter(b => b.sourceZone === z.id || b.targetZone === z.id).map(b => {
              const other = b.sourceZone === z.id ? this._zones.find(zz => zz.id === b.targetZone) : this._zones.find(zz => zz.id === b.sourceZone);
              return html`<div style="font-size:11px;margin-bottom:3px">
                <span style="color:${this._getEnforcementColor(b.enforcement)}">${b.enforcement.toUpperCase()}</span>
                &#x27A1; ${other?.name || 'Unknown'} (${b.controlType})
              </div>`;
            })}
          </div>
        ` : nothing}
      </div>
    `)}</div>`;
  }

  private _renderBoundaries() {
    return html`<table class="boundary-table">
      <thead><tr><th>Source Zone</th><th>Target Zone</th><th>Control</th><th>Enforcement</th><th>Bypass</th><th>Protocols</th></tr></thead>
      <tbody>${this._boundaries.map(b => {
        const src = this._zones.find(z => z.id === b.sourceZone);
        const tgt = this._zones.find(z => z.id === b.targetZone);
        return html`<tr>
          <td>${src?.name || b.sourceZone}</td>
          <td>${tgt?.name || b.targetZone}</td>
          <td>${b.controlType}</td>
          <td style="color:${this._getEnforcementColor(b.enforcement)};font-weight:600">${b.enforcement}</td>
          <td>${b.bypassPossible ? html`<span style="color:#f87171">Yes</span><br><span style="font-size:10px;color:#9ca3af">${b.bypassMethod}</span>` : html`<span style="color:#34d399">No</span>`}</td>
          <td>${b.protocols.join(', ')}</td>
        </tr>`;
      })}</tbody>
    </table>`;
  }

  private _renderSurface() {
    const sorted = [...this._attackSurface].sort((a, b) => b.riskScore - a.riskScore);
    return html`<div class="surface-list">${sorted.map(s => html`
      <div class="surface-card">
        <div class="surface-name">${s.name} <span style="font-size:11px;color:${this._getRiskColor(s.riskScore)};font-weight:700">Risk: ${s.riskScore}</span></div>
        <div class="surface-meta">
          <span class="control-tag">${s.type}</span>
          <span class="control-tag">${s.exposure}</span>
          <span class="control-tag">Auth: ${s.authentication}</span>
          <span class="control-tag">Encrypt: ${s.encryption}</span>
        </div>
        ${s.vulnerabilities.map(v => html`<div class="surface-vuln vuln-${v.severity}">[${v.severity.toUpperCase()}] ${v.name}: ${v.description}</div>`)}
      </div>
    `)}</div>`;
  }

  private _renderDid() {
    return html`<div class="did-grid">${this._didLayers.map(l => html`
      <div class="did-card">
        <div class="did-name">${l.name}</div>
        <div class="did-score" style="color:${this._getDidColor(l.effectiveness)}">${l.effectiveness}%</div>
        <div class="did-bar"><div class="did-fill" style="width:${l.effectiveness}%;background:${this._getDidColor(l.effectiveness)}"></div></div>
        <div style="font-size:11px;color:#9ca3af;margin-bottom:4px">Controls: ${l.controls.join(', ')}</div>
        ${l.gaps.length > 0 ? html`<div class="did-gap">Gaps: ${l.gaps.join('; ')}</div>` : html`<div style="font-size:11px;color:#34d399">No gaps identified</div>`}
      </div>
    `)}</div>`;
  }

  private _renderRemediations() {
    return html`<div class="remediation-list">${this._remediations.map(r => html`
      <div class="rem-card">
        <div class="rem-priority ${r.priority <= 2 ? 'p-critical' : r.priority <= 5 ? 'p-high' : r.priority <= 7 ? 'p-medium' : 'p-low'}">P${r.priority}</div>
        <div class="rem-content">
          <div class="rem-title">${r.title}</div>
          <div class="rem-desc">${r.description}</div>
          <div class="rem-meta">
            <span>${r.category}</span>
            <span>Effort: <strong>${r.effort}</strong></span>
            <span>Impact: <strong style="color:#34d399">${r.impact}%</strong></span>
            <span>Zones: ${r.affectedZones.length}</span>
          </div>
        </div>
      </div>
    `)}</div>`;
  }

  // Architecture risk scoring engine
  private _calculateArchRisk(finding: any): { overall: number; factors: { name: string; score: number; weight: number; color: string }[] } {
    const sevMap: Record<string, number> = { critical: 95, high: 70, medium: 45, low: 20 };
    const exposure = finding.exposure || 50;
    const impact = finding.impact || 50;
    const exploitability = finding.exploitability || 50;
    const factors = [
      { name: 'Severity', score: sevMap[finding.severity] || 50, weight: 30, color: (sevMap[finding.severity] || 50) >= 70 ? '#ef4444' : '#fbbf24' },
      { name: 'Attack Surface', score: exposure, weight: 25, color: exposure >= 70 ? '#ef4444' : exposure >= 40 ? '#fbbf24' : '#34d399' },
      { name: 'Business Impact', score: impact, weight: 25, color: impact >= 70 ? '#ef4444' : impact >= 40 ? '#fbbf24' : '#34d399' },
      { name: 'Exploitability', score: exploitability, weight: 20, color: exploitability >= 70 ? '#ef4444' : exploitability >= 40 ? '#fbbf24' : '#34d399' },
    ];
    const overall = Math.min(100, Math.round(factors.reduce((s: number, f: any) => s + f.score * f.weight / 100, 0)));
    return { overall, factors };
  }

  // MITRE ATT&CK correlation for architecture findings
  private _archMitreDB: { id: string; name: string; tactic: string; detection: number }[] = [
    { id: 'T1190', name: 'Exploit Public-Facing App', tactic: 'Initial Access', detection: 82 },
    { id: 'T1133', name: 'External Remote Services', tactic: 'Initial Access', detection: 55 },
    { id: 'T1505', name: 'Server Software Component', tactic: 'Persistence', detection: 68 },
    { id: 'T1071', name: 'Application Layer Protocol', tactic: 'Command and Control', detection: 75 },
    { id: 'T1048', name: 'Exfiltration Over Alt Protocol', tactic: 'Exfiltration', detection: 42 },
    { id: 'T1083', name: 'File and Directory Discovery', tactic: 'Discovery', detection: 90 },
    { id: 'T1110', name: 'Brute Force', tactic: 'Credential Access', detection: 85 },
    { id: 'T1059', name: 'Command and Scripting Interpreter', tactic: 'Execution', detection: 78 },
  ];

  // Trend data for architecture assessments
  private _archTrendData: { period: string; findings: number; critical: number; avgRisk: number }[] = [
    { period: 'Q1 2025', findings: 28, critical: 5, avgRisk: 62 },
    { period: 'Q2 2025', findings: 32, critical: 6, avgRisk: 58 },
    { period: 'Q3 2025', findings: 25, critical: 4, avgRisk: 54 },
    { period: 'Q4 2025', findings: 30, critical: 5, avgRisk: 52 },
    { period: 'Q1 2026', findings: 22, critical: 3, avgRisk: 48 },
    { period: 'Q2 2026', findings: 20, critical: 2, avgRisk: 42 },
  ];

  private _renderRiskAnalysis(): any {
    const criticalFindings = this._findings.filter(f => f.severity === 'critical' || f.severity === 'high');
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:10px;color:#9ca3af;text-transform:uppercase">Risk Analysis (Top Findings)</div>
      ${criticalFindings.slice(0, 5).map(f => {
        const risk = this._calculateArchRisk(f);
        return html`<div style="padding:8px;background:#0a0c10;border-radius:6px;margin-bottom:4px;border-left:3px solid ${risk.overall >= 70 ? '#ef4444' : '#fbbf24'}">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-size:11px;font-weight:600;color:#e2e8f0">${f.title}</span>
            <span style="font-size:14px;font-weight:800;color:${risk.overall >= 70 ? '#ef4444' : '#fbbf24'}">${risk.overall}</span>
          </div>
          ${risk.factors.map(fact => html`
            <div class="risk-factor-row">
              <span class="risk-factor-label">${fact.name} (${fact.weight}%)</span>
              <div class="risk-factor-bar"><div class="risk-factor-fill" style="width:${fact.score}%;background:${fact.color}"></div></div>
              <span style="font-weight:700;min-width:30px;text-align:right;color:${fact.color}">${Math.round(fact.score)}</span>
            </div>
          `)}
        </div>`;
      })}
    </div>`;
  }

  private _renderMitreArchCorrelation(): any {
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:10px;color:#9ca3af;text-transform:uppercase">MITRE ATT&CK Detection Coverage</div>
      ${this._archMitreDB.map(t => html`
        <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid #0a0c10;font-size:11px">
          <span class="tag" style="background:#312e81;color:#a5b4fc">${t.id}</span>
          <span style="flex:1;color:#e2e8f0">${t.name}</span>
          <span class="tag">${t.tactic}</span>
          <div style="width:60px;height:6px;background:#1f2937;border-radius:3px;overflow:hidden"><div style="height:100%;width:${t.detection}%;background:${t.detection >= 70 ? '#34d399' : t.detection >= 50 ? '#fbbf24' : '#f87171'};border-radius:3px"></div></div>
          <span style="font-size:10px;color:${t.detection >= 70 ? '#34d399' : '#fbbf24'};min-width:30px;text-align:right">${t.detection}%</span>
        </div>
      `)}
    </div>`;
  }

  private _renderTrendChart(): any {
    const data = this._archTrendData;
    const W = 260, H = 80, pad = 20;
    const maxVal = Math.max(...data.map(d => d.findings), 1);
    const stepX = (W - pad * 2) / (data.length - 1);
    let svg = '';
    for (let i = 0; i <= 4; i++) {
      const y = pad + (i / 4) * (H - pad * 2);
      svg += `<line x1="${pad}" y1="${y}" x2="${W - pad}" y2="${y}" stroke="#2a2d3a" stroke-width="0.5"/>`;
    }
    const findPts = data.map((d, i) => `${pad + i * stepX},${pad + (1 - d.findings / maxVal) * (H - pad * 2)}`).join(' ');
    svg += `<polyline points="${findPts}" fill="none" stroke="#f97316" stroke-width="1.5" stroke-linecap="round"/>`;
    const critPts = data.map((d, i) => `${pad + i * stepX},${pad + (1 - d.critical / maxVal) * (H - pad * 2)}`).join(' ');
    svg += `<polyline points="${critPts}" fill="none" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="4 2"/>`;
    data.forEach((d, i) => { svg += `<text x="${pad + i * stepX}" y="${H - 4}" text-anchor="middle" fill="#6b7280" font-size="6">${d.period}</text>`; });
    svg += `<circle cx="${W - 100}" cy="8" r="3" fill="#f97316"/><text x="${W - 94}" y="11" fill="#9ca3af" font-size="7">Findings</text>`;
    svg += `<circle cx="${W - 50}" cy="8" r="3" fill="#ef4444"/><text x="${W - 44}" y="11" fill="#9ca3af" font-size="7">Critical</text>`;
    const risks = data.map(d => d.avgRisk);
    const n = risks.length || 1;
    const sumX = risks.reduce((s, _, i) => s + i, 0);
    const sumY = risks.reduce((s, v) => s + v, 0);
    const sumXY = risks.reduce((s, v, i) => s + i * v, 0);
    const sumX2 = risks.reduce((s, _, i) => s + i * i, 0);
    const denom = n * sumX2 - sumX * sumX || 1;
    const slope = (n * sumXY - sumX * sumY) / denom;
    const cls = slope < -0.5 ? 'trend-down' : slope > 0.5 ? 'trend-up' : 'trend-flat';
    const arrow = slope < -0.5 ? '\u2193' : slope > 0.5 ? '\u2191' : '\u2192';
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:10px;color:#9ca3af;text-transform:uppercase">Assessment Trend</div>
      <svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}">${svg}</svg>
      <span class="trend-indicator ${cls}" style="margin-top:8px;display:inline-flex">${arrow} Risk trend: ${slope > 0 ? '+' : ''}${slope.toFixed(1)}/quarter ${slope < -0.5 ? '(improving)' : ''}</span>
    </div>`;
  }

  private _generateArchInsights(): { title: string; body: string; severity: string }[] {
    const insights: { title: string; body: string; severity: string }[] = [];
    const critCount = this._findings.filter(f => f.severity === 'critical').length;
    if (critCount > 0) insights.push({ title: 'Critical Findings Remain', body: `${critCount} critical architecture findings require immediate remediation. Prioritize attack surface reduction and segmentation hardening.`, severity: 'critical' });
    const lowDetect = this._archMitreDB.filter(t => t.detection < 50);
    if (lowDetect.length > 0) insights.push({ title: 'Detection Gap', body: `${lowDetect.length} MITRE techniques have below 50% detection: ${lowDetect.map(t => t.name).join(', ')}. Deploy additional monitoring.`, severity: 'warning' });
    insights.push({ title: 'Posture Improvement', body: 'Architecture risk has decreased 20 points over 6 quarters. Continue cloud-native security controls adoption and reduce legacy dependencies.', severity: 'info' });
    return insights;
  }

  private _renderPanelConfig(): any {
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:10px;color:#9ca3af;text-transform:uppercase">Panel Configuration</div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #0a0c10">
        <div><div style="font-size:11px;color:#e2e8f0">Auto-Refresh Interval</div><div style="font-size:9px;color:#6b7280">Refresh architecture scan results</div></div>
        <select class="config-select" style="width:120px"><option value="0">Disabled</option><option value="30">30s</option><option value="60">1 min</option><option value="300">5 min</option></select>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #0a0c10">
        <div><div style="font-size:11px;color:#e2e8f0">Scan Depth</div><div style="font-size:9px;color:#6b7280">Architecture analysis depth level</div></div>
        <select class="config-select" style="width:120px"><option value="standard">Standard</option><option value="deep">Deep Analysis</option><option value="full">Full Map</option></select>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0">
        <div><div style="font-size:11px;color:#e2e8f0">Filter Presets</div><div style="font-size:9px;color:#6b7280">Quick filter architecture findings</div></div>
        <div style="display:flex;gap:4px">${['All', 'Critical', 'Network', 'Cloud'].map(p => html`<span class="tag" style="cursor:pointer;background:#f9731620;color:#fb923c">${p}</span>`)}</div>
      </div>
    </div>`;
  }

  // Attack path tree visualization
  private _renderAttackPathTreeSVG(): string {
    const W = 260, H = 140;
    const nodes = [
      { x: W / 2, y: 15, label: 'Internet', color: '#ef4444' },
      { x: 60, y: 45, label: 'Web App', color: '#f97316' },
      { x: W / 2, y: 45, label: 'VPN Gateway', color: '#f97316' },
      { x: W - 60, y: 45, label: 'Email Gateway', color: '#f97316' },
      { x: 40, y: 75, label: 'DMZ Server', color: '#fbbf24' },
      { x: 120, y: 75, label: 'AD Controller', color: '#fbbf24' },
      { x: 200, y: 75, label: 'Mail Server', color: '#fbbf24' },
      { x: 60, y: 105, label: 'Internal Net', color: '#22c55e' },
      { x: 160, y: 105, label: 'DB Server', color: '#22c55e' },
      { x: W / 2, y: 130, label: 'Crown Jewels', color: '#a855f7' },
    ];
    const edges = [[0,1],[0,2],[0,3],[1,4],[2,5],[3,6],[4,7],[5,7],[5,8],[7,9],[8,9]];
    let svg = '';
    edges.forEach(([from, to]) => {
      svg += `<line x1="${nodes[from].x}" y1="${nodes[from].y}" x2="${nodes[to].x}" y2="${nodes[to].y}" stroke="#374151" stroke-width="1" stroke-dasharray="3 2"/>`;
    });
    nodes.forEach(n => {
      svg += `<circle cx="${n.x}" cy="${n.y}" r="12" fill="${n.color}20" stroke="${n.color}" stroke-width="1.5"/>`;
      svg += `<text x="${n.x}" y="${n.y + 4}" text-anchor="middle" fill="#e2e8f0" font-size="5.5">${n.label}</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}">${svg}</svg>`;
  }

  // Layer defense matrix
  private _renderDefenseMatrix(): any {
    const layers = ['Perimeter', 'Network', 'Host', 'Application', 'Data'];
    const controls = ['Firewall', 'IDS/IPS', 'EDR', 'WAF', 'DLP', 'IAM', 'SIEM', 'Logging'];
    const matrix: Record<string, string[]> = {
      Perimeter: ['Firewall', 'WAF', 'IDS/IPS', 'Logging'],
      Network: ['IDS/IPS', 'IAM', 'SIEM', 'Logging'],
      Host: ['EDR', 'IAM', 'Logging'],
      Application: ['WAF', 'IAM', 'SIEM'],
      Data: ['DLP', 'IAM', 'Logging'],
    };
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:10px;color:#9ca3af;text-transform:uppercase">Defense Layer Matrix</div>
      ${layers.map(layer => html`
        <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #0a0c10;font-size:11px">
          <span style="min-width:80px;font-weight:600;color:#e2e8f0">${layer}</span>
          <div style="flex:1;display:flex;gap:3px">
            ${controls.map(c => {
              const active = matrix[layer]?.includes(c);
              return html`<div style="flex:1;height:18px;border-radius:3px;background:${active ? '#22c55e30' : '#1f2937'};display:flex;align-items:center;justify-content:center;font-size:7;color:${active ? '#34d399' : '#374151'};border:1px solid ${active ? '#34d39940' : '#1f2937'}">${active ? c : '-'}</div>`;
            })}
          </div>
        </div>
      `)}
    </div>`;
  }

  // Sankey diagram for attack surface
  private _renderAttackSurfaceSankeySVG(): string {
    const W = 260, H = 100;
    const sources = [
      { label: 'Web', value: 12, color: '#ef4444' },
      { label: 'VPN', value: 8, color: '#f97316' },
      { label: 'Email', value: 10, color: '#fbbf24' },
      { label: 'Cloud', value: 15, color: '#a855f7' },
    ];
    const sinks = [
      { label: 'Data Exfil', value: 10, color: '#ef4444' },
      { label: 'Ransomware', value: 12, color: '#f97316' },
      { label: 'Persistence', value: 8, color: '#fbbf24' },
      { label: 'Lateral Move', value: 15, color: '#22c55e' },
    ];
    const total = sources.reduce((s, v) => s + v.value, 0) || 1;
    let svg = '';
    sources.forEach((src, i) => {
      const h = (src.value / total) * (H - 20);
      const y = 10 + sources.slice(0, i).reduce((s, v) => s + (v.value / total) * (H - 20), 0);
      svg += `<rect x="5" y="${y}" width="35" height="${h}" rx="3" fill="${src.color}" fill-opacity="0.7"/>`;
      svg += `<text x="22" y="${y + h / 2 + 3}" text-anchor="middle" fill="#fff" font-size="6" font-weight="600">${src.label}</text>`;
    });
    sinks.forEach((sink, i) => {
      const h = (sink.value / total) * (H - 20);
      const y = 10 + sinks.slice(0, i).reduce((s, v) => s + (v.value / total) * (H - 20), 0);
      svg += `<rect x="${W - 40}" y="${y}" width="35" height="${h}" rx="3" fill="${sink.color}" fill-opacity="0.7"/>`;
      svg += `<text x="${W - 22}" y="${y + h / 2 + 3}" text-anchor="middle" fill="#fff" font-size="6" font-weight="600">${sink.label}</text>`;
    });
    for (let i = 0; i < 5; i++) {
      const opacity = Math.random() * 0.3 + 0.1;
      svg += `<path d="M45,${H / 2} C100,${H / 2} 160,${H / 2} ${W - 45},${H / 2}" stroke="#94a3b8" stroke-opacity="${opacity}" stroke-width="${Math.random() * 6 + 2}" fill="none"/>`;
    }
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}">${svg}</svg>`;
  }

  // CVSS-style vulnerability scoring
  private _cvssScore(finding: any): { base: number; temporal: number; environmental: number; vector: string } {
    const avMap: Record<string, number> = { network: 0.85, adjacent: 0.62, local: 0.55, physical: 0.2 };
    const acMap: Record<string, number> = { low: 0.77, high: 0.44 };
    const prMap: Record<string, number> = { none: 0.85, low: 0.62, high: 0.27 };
    const cMap: Record<string, number> = { high: 0.56, low: 0.22, none: 0 };
    const iMap: Record<string, number> = { high: 0.56, low: 0.22, none: 0 };
    const aMap: Record<string, number> = { high: 0.56, low: 0.22, none: 0 };
    const av = avMap[finding.accessVector || 'network'] || 0.85;
    const ac = acMap[finding.accessComplexity || 'low'] || 0.77;
    const pr = prMap[finding.privilegesRequired || 'none'] || 0.85;
    const c = cMap[finding.confidentialityImpact || 'high'] || 0.56;
    const i = iMap[finding.integrityImpact || 'high'] || 0.56;
    const a = aMap[finding.availabilityImpact || 'low'] || 0.22;
    const iss = 1 - ((1 - c) * (1 - i) * (1 - a));
    const base = Math.min(10, Math.round((iss * 8.22 * iss * 1.08 + av * ac * pr) * 10) / 10);
    const temporal = Math.min(10, Math.round(base * 0.91 * 0.95 * 0.92 * 10) / 10);
    const vector = `CVSS:3.1/AV:${(finding.accessVector || 'N').substring(0, 1).toUpperCase()}/AC:${(finding.accessComplexity || 'L').substring(0, 1).toUpperCase()}/PR:${(finding.privilegesRequired || 'N').substring(0, 1).toUpperCase()}/C:${(finding.confidentialityImpact || 'H').substring(0, 1).toUpperCase()}/I:${(finding.integrityImpact || 'H').substring(0, 1).toUpperCase()}/A:${(finding.availabilityImpact || 'L').substring(0, 1).toUpperCase()}`;
    return { base, temporal, environmental: temporal, vector };
  }

  // Compliance framework checks for architecture
  private _archComplianceChecks: { framework: string; control: string; name: string; status: string; score: number }[] = [
    { framework: 'NIST CSF', control: 'PR.AC-1', name: 'Identity Management', status: 'pass', score: 88 },
    { framework: 'NIST CSF', control: 'PR.AC-5', name: 'Network Integrity', status: 'partial', score: 65 },
    { framework: 'CIS Controls', control: '1.1', name: 'Inventory of Authorized Devices', status: 'pass', score: 82 },
    { framework: 'CIS Controls', control: '12.1', name: 'Network Segmentation', status: 'fail', score: 35 },
    { framework: 'ISO 27001', control: 'A.13.1', name: 'Network Security Controls', status: 'partial', score: 58 },
    { framework: 'SOC 2', control: 'CC6.1', name: 'Logical and Physical Access', status: 'pass', score: 91 },
    { framework: 'PCI DSS', control: 'Req 1', name: 'Network Security Controls', status: 'partial', score: 62 },
    { framework: 'GDPR', control: 'Art. 32', name: 'Security of Processing', status: 'pass', score: 78 },
  ];

  private _renderComplianceTab(): any {
    const total = this._archComplianceChecks.length || 1;
    const passed = this._archComplianceChecks.filter(c => c.status === 'pass').length;
    const partial = this._archComplianceChecks.filter(c => c.status === 'partial').length;
    const failed = this._archComplianceChecks.filter(c => c.status === 'fail').length;
    const avgScore = Math.round(this._archComplianceChecks.reduce((s, c) => s + c.score, 0) / total);
    const scoreColor = avgScore >= 80 ? '#34d399' : avgScore >= 60 ? '#fbbf24' : '#f87171';
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <span style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase">Architecture Compliance</span>
        <span style="font-size:18px;font-weight:800;color:${scoreColor}">${avgScore}/100</span>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <div style="background:#0a0c10;border-radius:6px;padding:10px;text-align:center;flex:1"><div style="font-size:20px;font-weight:700;color:#34d399">${passed}</div><div style="font-size:9px;color:#6b7280">Pass</div></div>
        <div style="background:#0a0c10;border-radius:6px;padding:10px;text-align:center;flex:1"><div style="font-size:20px;font-weight:700;color:#fbbf24">${partial}</div><div style="font-size:9px;color:#6b7280">Partial</div></div>
        <div style="background:#0a0c10;border-radius:6px;padding:10px;text-align:center;flex:1"><div style="font-size:20px;font-weight:700;color:#f87171">${failed}</div><div style="font-size:9px;color:#6b7280">Fail</div></div>
      </div>
      ${this._archComplianceChecks.map(c => html`
        <div style="display:flex;align-items:center;gap:10px;padding:6px;background:#0a0c10;border-radius:4px;margin-bottom:4px;font-size:11px">
          <span class="tag">${c.framework}</span>
          <span style="flex:1;color:#e2e8f0">${c.control}: ${c.name}</span>
          <div style="width:60px;height:6px;background:#1f2937;border-radius:3px;overflow:hidden"><div style="height:100%;width:${c.score}%;background:${c.score >= 80 ? '#34d399' : c.score >= 60 ? '#fbbf24' : '#f87171'};border-radius:3px"></div></div>
          <span class="tag" style="background:${c.status === 'pass' ? '#22c55e20' : c.status === 'partial' ? '#fbbf2420' : '#ef444420'};color:${c.status === 'pass' ? '#34d399' : c.status === 'partial' ? '#fbbf24' : '#f87171'}">${c.status}</span>
        </div>
      `)}
    </div>`;
  }

  private _renderReport() {
    if (!this._showReport) return html`<div class="empty-state">Click "Generate Report" to create the assessment report</div>`;
    return html`<div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-weight:600;font-size:14px">Assessment Report</span>
        <button class="btn btn-primary btn-sm" @click=${this._exportReport}>Export Markdown</button>
      </div>
      <div class="report-box">${this._reportContent}</div>
    </div>`;
  }

  // === SECTION A: Multi-Phase Pipeline Execution Engine ===
  private _pipelinePhases: { id: string; name: string; status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled-back'; progress: number; duration: number; errors: string[]; rollbackSteps: string[] }[] = [
    { id: 'ph-1', name: 'Asset Discovery & Inventory', status: 'completed', progress: 100, duration: 45, errors: [], rollbackSteps: ['Clear discovered assets from cache'] },
    { id: 'ph-2', name: 'Trust Boundary Mapping', status: 'completed', progress: 100, duration: 62, errors: [], rollbackSteps: ['Reset boundary definitions'] },
    { id: 'ph-3', name: 'Attack Surface Enumeration', status: 'running', progress: 73, duration: 120, errors: [], rollbackSteps: ['Remove enumerated attack vectors'] },
    { id: 'ph-4', name: 'Defense-in-Depth Analysis', status: 'pending', progress: 0, duration: 0, errors: [], rollbackSteps: ['Restore original defense configurations'] },
    { id: 'ph-5', name: 'Micro-Segmentation Gap Detection', status: 'pending', progress: 0, duration: 0, errors: [], rollbackSteps: ['Reset segmentation rules'] },
    { id: 'ph-6', name: 'Remediation Priority Scoring', status: 'pending', progress: 0, duration: 0, errors: [], rollbackSteps: ['Clear remediation scores'] },
    { id: 'ph-7', name: 'Report Generation & Export', status: 'pending', progress: 0, duration: 0, errors: [], rollbackSteps: ['Delete generated reports'] },
  ];

  private _pipelineJobQueue: { id: string; name: string; priority: number; status: 'queued' | 'processing' | 'done'; phaseId: string; submittedAt: number; startedAt: number }[] = [
    { id: 'job-001', name: 'Scan DMZ perimeter', priority: 1, status: 'done', phaseId: 'ph-1', submittedAt: Date.now() - 300000, startedAt: Date.now() - 290000 },
    { id: 'job-002', name: 'Map internal trust boundaries', priority: 2, status: 'done', phaseId: 'ph-2', submittedAt: Date.now() - 280000, startedAt: Date.now() - 270000 },
    { id: 'job-003', name: 'Enumerate east-west traffic', priority: 3, status: 'processing', phaseId: 'ph-3', submittedAt: Date.now() - 200000, startedAt: Date.now() - 150000 },
    { id: 'job-004', name: 'Test lateral movement paths', priority: 2, status: 'queued', phaseId: 'ph-4', submittedAt: Date.now() - 100000, startedAt: 0 },
    { id: 'job-005', name: 'Validate segmentation zones', priority: 3, status: 'queued', phaseId: 'ph-5', submittedAt: Date.now() - 80000, startedAt: 0 },
    { id: 'job-006', name: 'Score remediation actions', priority: 4, status: 'queued', phaseId: 'ph-6', submittedAt: Date.now() - 60000, startedAt: 0 },
  ];

  private _errorCategories: { category: string; icon: string; count: number; autoRemediation: string }[] = [
    { category: 'Network Configuration Error', icon: 'net', count: 3, autoRemediation: 'Auto-fix firewall rules and ACL misconfigurations' },
    { category: 'Authentication Gap', icon: 'auth', count: 5, autoRemediation: 'Recommend MFA enforcement and credential rotation' },
    { category: 'Encryption Missing', icon: 'enc', count: 2, autoRemediation: 'Enable TLS 1.3 on all inter-zone communication' },
    { category: 'Segmentation Violation', icon: 'seg', count: 7, autoRemediation: 'Apply micro-segmentation policies to flat networks' },
    { category: 'Logging Deficiency', icon: 'log', count: 4, autoRemediation: 'Enable structured logging with SIEM integration' },
    { category: 'Access Control Overreach', icon: 'acl', count: 6, autoRemediation: 'Apply least-privilege principle and review RBAC policies' },
  ];

  private _batchProcessingConfig: { enabled: boolean; chunkSize: number; parallelChunks: number; retryAttempts: number; retryDelayMs: number } = {
    enabled: true, chunkSize: 50, parallelChunks: 3, retryAttempts: 3, retryDelayMs: 2000,
  };

  private _renderPipelineEngine(): any {
    const phases = this._pipelinePhases;
    const running = phases.filter(p => p.status === 'running');
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
            <span style="font-size:16px">${e.icon === 'net' ? '🌐' : e.icon === 'auth' ? '🔐' : e.icon === 'enc' ? '🔒' : e.icon === 'seg' ? '🧱' : e.icon === 'log' ? '📋' : '🛡️'}</span>
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

  // === SECTION B: Advanced Data Grid with Frozen Columns & Cell Renderers ===
  private _gridColumns: { key: string; label: string; width: number; frozen: boolean; editable: boolean; type: 'text' | 'progress' | 'badge' | 'sparkline'; sortable: boolean; resizable: boolean }[] = [
    { key: 'id', label: 'ID', width: 60, frozen: true, editable: false, type: 'text', sortable: true, resizable: true },
    { key: 'zone', label: 'Security Zone', width: 140, frozen: true, editable: true, type: 'text', sortable: true, resizable: true },
    { key: 'finding', label: 'Finding', width: 220, frozen: false, editable: true, type: 'text', sortable: true, resizable: true },
    { key: 'severity', label: 'Severity', width: 90, frozen: false, editable: false, type: 'badge', sortable: true, resizable: true },
    { key: 'riskScore', label: 'Risk Score', width: 110, frozen: false, editable: false, type: 'progress', sortable: true, resizable: true },
    { key: 'trend', label: '7-Day Trend', width: 100, frozen: false, editable: false, type: 'sparkline', sortable: false, resizable: true },
    { key: 'status', label: 'Status', width: 90, frozen: false, editable: true, type: 'badge', sortable: true, resizable: true },
    { key: 'assignee', label: 'Assignee', width: 120, frozen: false, editable: true, type: 'text', sortable: true, resizable: true },
    { key: 'remediation', label: 'Remediation', width: 180, frozen: false, editable: true, type: 'text', sortable: false, resizable: true },
  ];

  private _gridRows: Record<string, any>[] = [
    { id: 'ARCH-001', zone: 'DMZ', finding: 'Unrestricted inbound traffic on port 443', severity: 'critical', riskScore: 92, trend: [65, 70, 78, 85, 88, 90, 92], status: 'open', assignee: 'J. Chen', remediation: 'Restrict source IPs and enable WAF' },
    { id: 'ARCH-002', zone: 'Internal', finding: 'Flat network with no micro-segmentation', severity: 'high', riskScore: 85, trend: [70, 72, 75, 78, 80, 82, 85], status: 'in-progress', assignee: 'M. Lopez', remediation: 'Implement VLAN segmentation policies' },
    { id: 'ARCH-003', zone: 'Cloud', finding: 'Security group allows 0.0.0.0/0 SSH access', severity: 'critical', riskScore: 95, trend: [88, 90, 91, 93, 94, 94, 95], status: 'open', assignee: 'S. Patel', remediation: 'Restrict SSH to bastion host IPs only' },
    { id: 'ARCH-004', zone: 'DMZ', finding: 'Missing TLS termination at load balancer', severity: 'medium', riskScore: 55, trend: [40, 42, 45, 48, 50, 52, 55], status: 'mitigated', assignee: 'A. Kim', remediation: 'Enable TLS passthrough or termination' },
    { id: 'ARCH-005', zone: 'Database', finding: 'Direct database access from app tier without proxy', severity: 'high', riskScore: 78, trend: [60, 62, 65, 68, 72, 75, 78], status: 'in-progress', assignee: 'R. Zhang', remediation: 'Deploy database connection proxy' },
    { id: 'ARCH-006', zone: 'Internal', finding: 'Kerberos delegation misconfiguration', severity: 'medium', riskScore: 62, trend: [50, 52, 55, 58, 59, 60, 62], status: 'open', assignee: 'D. Novak', remediation: 'Review constrained delegation settings' },
    { id: 'ARCH-007', zone: 'Cloud', finding: 'Cross-account IAM role trust policy too broad', severity: 'high', riskScore: 82, trend: [70, 73, 75, 78, 79, 80, 82], status: 'open', assignee: 'L. Wang', remediation: 'Restrict trust policy to specific account ARNs' },
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
    const scrollCols = cols.filter(c => !c.frozen);
    return html`
      <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase">Architecture Findings Grid</span>
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
                    ${c.type === 'badge' ? html`<span class="tag" style="font-size:9px;background:${r[c.key] === 'critical' ? '#ef444420' : r[c.key] === 'high' ? '#f9731620' : r[c.key] === 'medium' ? '#fbbf2420' : r[c.key] === 'low' ? '#22c55e20' : r[c.key] === 'open' ? '#ef444420' : r[c.key] === 'in-progress' ? '#3b82f620' : '#22c55e20'};color:${r[c.key] === 'critical' ? '#f87171' : r[c.key] === 'high' ? '#fb923c' : r[c.key] === 'medium' ? '#fbbf24' : r[c.key] === 'low' ? '#34d399' : r[c.key] === 'open' ? '#f87171' : r[c.key] === 'in-progress' ? '#60a5fa' : '#34d399'}">${r[c.key]}</span>` :
                      c.type === 'progress' ? html`<div style="display:flex;align-items:center;gap:6px"><div style="flex:1;height:6px;background:#0a0c10;border-radius:3px;overflow:hidden"><div style="height:100%;width:${r[c.key]}%;background:${r[c.key] >= 80 ? '#ef4444' : r[c.key] >= 60 ? '#f97316' : '#22c55e'};border-radius:3px"></div></div><span style="font-size:10px;color:#9ca3af">${r[c.key]}</span></div>` :
                      c.type === 'sparkline' ? html`<svg width="80" height="24" viewBox="0 0 80 24">${r[c.key].map((v: number, i: number, arr: number[]) => { const x = (i / (arr.length - 1)) * 80; const y = 24 - (v / 100) * 24; return i === 0 ? '' : `<line x1="${(i - 1) / (arr.length - 1) * 80}" y1="${24 - (arr[i - 1] / 100) * 24}" x2="${x}" y2="${y}" stroke="#3b82f6" stroke-width="1.5"/>`; }).join('')}</svg>` :
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
    { name: 'Micro-Segmentation Deployment', investment: 250000, annualSavings: 180000, riskReduction: 42, paybackMonths: 17, npv: 420000 },
    { name: 'Zero Trust Architecture', investment: 500000, annualSavings: 350000, riskReduction: 65, paybackMonths: 18, npv: 890000 },
    { name: 'Network Detection & Response', investment: 150000, annualSavings: 120000, riskReduction: 28, paybackMonths: 15, npv: 310000 },
    { name: 'Cloud Security Posture Mgmt', investment: 80000, annualSavings: 95000, riskReduction: 22, paybackMonths: 11, npv: 210000 },
    { name: 'Automated Compliance Scanning', investment: 60000, annualSavings: 75000, riskReduction: 18, paybackMonths: 10, npv: 165000 },
  ];

  private _riskQuantMetrics: { metric: string; sle: number; aro: number; ale: number; mitigationCost: number; roi: number }[] = [
    { metric: 'Data Breach via Flat Network', sle: 4500000, aro: 0.15, ale: 675000, mitigationCost: 250000, roi: 170 },
    { metric: 'Lateral Movement Compromise', sle: 2800000, aro: 0.25, ale: 700000, mitigationCost: 180000, roi: 289 },
    { metric: 'Unauthorized Zone Access', sle: 1200000, aro: 0.4, ale: 480000, mitigationCost: 90000, roi: 433 },
    { metric: 'DMZ Penetration to Internal', sle: 8000000, aro: 0.08, ale: 640000, mitigationCost: 350000, roi: 83 },
  ];

  private _renderDomainCalculators(): any {
    return html`
      <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
        <div style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase;margin-bottom:10px">ROI Scenario Modeling</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;margin-bottom:10px">
          ${this._roiScenarios.map(s => html`
            <div style="background:#0a0c10;border-radius:6px;padding:10px;border-left:3px solid ${s.npv > 500000 ? '#22c55e' : s.npv > 200000 ? '#3b82f6' : '#fbbf24'}">
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
    { name: 'Architecture Scanner', url: '/api/v1/arch/scan', method: 'POST', headers: { 'Content-Type': 'application/json', 'X-API-Key': 'arch****k7f2' }, lastStatus: 200, lastCalled: '2 min ago' },
    { name: 'Zone Validator', url: '/api/v1/zones/validate', method: 'GET', headers: { 'Authorization': 'Bearer ****' }, lastStatus: 200, lastCalled: '5 min ago' },
    { name: 'Boundary Analyzer', url: '/api/v1/boundaries/analyze', method: 'POST', headers: { 'Content-Type': 'application/json' }, lastStatus: 503, lastCalled: '15 min ago' },
  ];

  private _webhookConfigs: { id: string; name: string; url: string; events: string[]; active: boolean; lastTriggered: string }[] = [
    { id: 'wh-1', name: 'Critical Finding Alert', url: 'https://hooks.slack.com/services/T00/B00/xxx', events: ['critical_finding', 'boundary_violation'], active: true, lastTriggered: '1h ago' },
    { id: 'wh-2', name: 'Scan Complete', url: 'https://hooks.slack.com/services/T00/B00/yyy', events: ['scan_complete', 'report_generated'], active: true, lastTriggered: '3h ago' },
    { id: 'wh-3', name: 'JIRA Ticket Creator', url: 'https://company.atlassian.net/rest/webhooks/1', events: ['new_finding'], active: false, lastTriggered: 'Never' },
  ];

  private _dataSourceConnections: { name: string; type: string; status: 'connected' | 'disconnected' | 'error'; lastSync: string; records: number }[] = [
    { name: 'Internal SIEM', type: 'Splunk', status: 'connected', lastSync: '1 min ago', records: 145230 },
    { name: 'Threat Intelligence', type: 'MISP', status: 'connected', lastSync: '10 min ago', records: 87341 },
    { name: 'Network Scanner', type: 'Nessus', status: 'error', lastSync: '2h ago', records: 45678 },
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
            <span style="color:${wh.active ? '#22c55e' : '#6b7280'}">●</span>
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
    { term: 'Trust Boundary', definition: 'A logical or physical perimeter where data transitions between different security domains or trust levels.' },
    { term: 'Attack Surface', definition: 'The total sum of vulnerabilities, entry points, and exposure areas that an adversary could exploit.' },
    { term: 'Defense-in-Depth', definition: 'A layered security approach using multiple controls at different levels to protect assets.' },
    { term: 'Micro-Segmentation', definition: 'Fine-grained network segmentation that isolates workloads at the VM or container level.' },
    { term: 'Zero Trust', definition: 'Security model that assumes no implicit trust and continuously validates every access request.' },
    { term: 'ALE', definition: 'Annualized Loss Expectancy - the estimated yearly financial loss from a specific risk (SLE x ARO).' },
    { term: 'SLE', definition: 'Single Loss Expectancy - the monetary impact of a single security incident occurrence.' },
    { term: 'ARO', definition: 'Annualized Rate of Occurrence - the estimated frequency of a risk event per year.' },
    { term: 'DMZ', definition: 'Demilitarized Zone - a perimeter network segment exposing services to untrusted networks.' },
    { term: 'East-West Traffic', definition: 'Lateral network communication between servers within the same data center or cloud environment.' },
    { term: 'NPV', definition: 'Net Present Value - the difference between the present value of cash inflows and outflows over time.' },
    { term: 'Blast Radius', definition: 'The scope of impact if a single security control fails or a component is compromised.' },
  ];

  private _keyboardShortcuts: { key: string; action: string }[] = [
    { key: 'Ctrl+Enter', action: 'Run assessment pipeline' },
    { key: 'Ctrl+Shift+E', action: 'Export current findings' },
    { key: 'Ctrl+Shift+R', action: 'Rollback last pipeline phase' },
    { key: 'Ctrl+F', action: 'Find in findings grid' },
    { key: 'Ctrl+A', action: 'Select all grid rows' },
    { key: 'Escape', action: 'Close overlay / deselect' },
    { key: 'Ctrl+1-5', action: 'Switch between tabs' },
    { key: 'Ctrl+H', action: 'Toggle help overlay' },
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


  // === SCENARIO SIMULATION ENGINE ===
  @state() private _aaScenarios: {id:string;name:string;attackType:string;target:string;method:string;impactLow:number;impactHigh:number;confidence:number;mitigation:string;status:string}[] = [];
  @state() private _aaScenarioForm: {attackType:string;target:string;method:string} = {attackType:'',target:'',method:''};
  @state() private _aaScenarioCompare: boolean = false;
  @state() private _aaScenarioSelected: string[] = [];

  private _aaInitScenarios(): void {
    const saved = localStorage.getItem('aa_scenarios');
    if (saved) { try { this._aaScenarios = JSON.parse(saved); } catch { /* ignore */ } }
    if (this._aaScenarios.length === 0) {
      this._aaScenarios = [
        {id:'aa-s1',name:'Baseline Threat',attackType:'Phishing',target:'Employees',method:'Spear Email',impactLow:45,impactHigh:78,confidence:72,mitigation:'Security awareness training + email filtering',status:'active'},
        {id:'aa-s2',name:'Escalated Attack',attackType:'Ransomware',target:'Endpoints',method:'Drive-by Download',impactLow:65,impactHigh:95,confidence:58,mitigation:'EDR deployment + network segmentation',status:'saved'},
        {id:'aa-s3',name:'Insider Threat',attackType:'Data Exfiltration',target:'Databases',method:'SQL Injection',impactLow:55,impactHigh:88,confidence:65,mitigation:'DLP policies + query monitoring',status:'draft'},
      ];
    }
  }

  private _aaSaveScenarios(): void {
    localStorage.setItem('aa_scenarios', JSON.stringify(this._aaScenarios));
  }

  private _aaAddScenario(): void {
    const f = this._aaScenarioForm;
    if (!f.attackType || !f.target) return;
    this._aaScenarios = [...this._aaScenarios, {
      id: 'aa-s' + (this._aaScenarios.length + 1),
      name: f.attackType + ' vs ' + f.target,
      attackType: f.attackType,
      target: f.target,
      method: f.method || 'Unknown',
      impactLow: Math.floor(Math.random() * 40 + 20),
      impactHigh: Math.floor(Math.random() * 30 + 70),
      confidence: Math.floor(Math.random() * 30 + 50),
      mitigation: 'Review and implement appropriate controls',
      status: 'draft',
    }];
    this._aaScenarioForm = {attackType:'',target:'',method:''};
    this._aaSaveScenarios();
  }

  private _aaRenderScenarioEngine(): any {
    const attackTypes = ['Phishing','Ransomware','DDoS','SQL Injection','XSS','Privilege Escalation','Supply Chain','Zero-Day'];
    const targets = ['Employees','Endpoints','Servers','Databases','Network','Cloud','APIs','Mobile'];
    const methods = ['Spear Email','Drive-by Download','Brute Force','Social Engineering','Exploit Kit','Watering Hole','Malware','Misconfiguration'];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">Scenario Simulation Engine</span>
          <button class="tab" @click=${() => { this._aaScenarioCompare = !this._aaScenarioCompare; }}>${this._aaScenarioCompare ? 'List View' : 'Compare'}</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px">
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._aaScenarioForm = {...this._aaScenarioForm, attackType: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Attack Type</option>
            ${attackTypes.map(a => html`<option value=${a} ${this._aaScenarioForm.attackType === a ? 'selected' : ''}>${a}</option>`)}
          </select>
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._aaScenarioForm = {...this._aaScenarioForm, target: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Target</option>
            ${targets.map(t => html`<option value=${t} ${this._aaScenarioForm.target === t ? 'selected' : ''}>${t}</option>`)}
          </select>
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._aaScenarioForm = {...this._aaScenarioForm, method: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Method</option>
            ${methods.map(m => html`<option value=${m} ${this._aaScenarioForm.method === m ? 'selected' : ''}>${m}</option>`)}
          </select>
        </div>
        <button style="background:#3b82f6;border:none;border-radius:4px;padding:4px 12px;color:#fff;font-size:11px;cursor:pointer" @click=${this._aaAddScenario}>Run Simulation</button>
      </div>
      ${this._aaScenarioCompare && this._aaScenarios.length >= 2 ? html`
        <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
          <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:8px">Side-by-Side Comparison</div>
          <div style="display:grid;grid-template-columns:repeat(${Math.min(3, this._aaScenarios.length)},1fr);gap:8px">
            ${this._aaScenarios.slice(0,3).map(s => html`
              <div style="background:#1a1d2e;border-radius:6px;padding:8px;border:1px solid #2a2d3a">
                <div style="font-weight:600;font-size:11px;color:#60a5fa;margin-bottom:4px">${s.name}</div>
                <div style="font-size:10px;color:#9ca3af">${s.attackType} / ${s.target}</div>
                <div style="margin-top:6px;font-size:10px">
                  <div>Impact: ${s.impactLow}-${s.impactHigh}%</div>
                  <div>Confidence: ${s.confidence}%</div>
                  <div style="margin-top:4px;color:#f59e0b">${s.mitigation}</div>
                </div>
              </div>
            `)}
          </div>
        </div>
      ` : ''}
      <div style="background:#0f1117;border-radius:8px;padding:12px">
        <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:8px">Saved Scenarios (${this._aaScenarios.length})</div>
        ${this._aaScenarios.map(s => html`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #1a1d2e">
            <div>
              <span style="font-size:11px;color:#e2e8f0">${s.name}</span>
              <span style="font-size:9px;color:#6b7280;margin-left:6px">${s.attackType}</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center">
              <span style="font-size:9px;padding:2px 6px;border-radius:3px;background:${s.impactHigh > 80 ? '#dc262620' : '#f59e0b20'};color:${s.impactHigh > 80 ? '#ef4444' : '#f59e0b'}">${s.impactLow}-${s.impactHigh}%</span>
              <span style="font-size:9px;color:#6b7280">${s.confidence}% conf</span>
            </div>
          </div>
        `)}
      </div>
    `;
  }

  // === TIME-SERIES ANALYSIS ===
  @state() private _aaTrendData: {day:number;value:number;anomaly:boolean}[] = [];
  @state() private _aaTrendZoom: {start:number;end:number} | null = null;
  @state() private _aaTrendMA: number = 7;

  private _aaInitTrendData(): void {
    const data: {day:number;value:number;anomaly:boolean}[] = [];
    let base = 50 + Math.random() * 30;
    for (let i = 0; i < 90; i++) {
      base += (Math.random() - 0.48) * 8;
      base = Math.max(10, Math.min(100, base));
      const anomaly = Math.random() < 0.05;
      data.push({ day: i, value: anomaly ? base + (Math.random() > 0.5 ? 25 : -20) : base, anomaly });
    }
    this._aaTrendData = data;
  }

  private _aaCalcMA(window: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < this._aaTrendData.length; i++) {
      const start = Math.max(0, i - window + 1);
      const slice = this._aaTrendData.slice(start, i + 1);
      result.push(slice.reduce((s, d) => s + d.value, 0) / slice.length);
    }
    return result;
  }

  private _aaGetStats(): {mean:number;median:number;stddev:number;trend:string} {
    const vals = this._aaTrendData.map(d => d.value);
    const n = vals.length;
    const mean = vals.reduce((a,b) => a+b, 0) / n;
    const sorted = [...vals].sort((a,b) => a-b);
    const median = n % 2 === 0 ? (sorted[n/2-1]+sorted[n/2])/2 : sorted[Math.floor(n/2)];
    const variance = vals.reduce((s,v) => s + (v-mean)*(v-mean), 0) / n;
    const stddev = Math.sqrt(variance);
    const firstHalf = vals.slice(0, Math.floor(n/2));
    const secondHalf = vals.slice(Math.floor(n/2));
    const firstMean = firstHalf.reduce((a,b)=>a+b,0)/firstHalf.length;
    const secondMean = secondHalf.reduce((a,b)=>a+b,0)/secondHalf.length;
    const trend = secondMean > firstMean + stddev*0.5 ? 'Increasing' : secondMean < firstMean - stddev*0.5 ? 'Decreasing' : 'Stable';
    return {mean: Math.round(mean*10)/10, median: Math.round(median*10)/10, stddev: Math.round(stddev*10)/10, trend};
  }

  private _aaRenderTimeSeries(): any {
    const stats = this._aaGetStats();
    const filtered = this._aaTrendZoom ? this._aaTrendData.filter(d => d.day >= this._aaTrendZoom.start && d.day <= this._aaTrendZoom.end) : this._aaTrendData;
    const maxVal = Math.max(...filtered.map(d => d.value));
    const minVal = Math.min(...filtered.map(d => d.value));
    const range = maxVal - minVal || 1;
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">90-Day Trend Analysis</span>
          <div style="display:flex;gap:4px">
            <button class="tab ${this._aaTrendMA === 7 ? 'active' : ''}" @click=${() => { this._aaTrendMA = 7; }}>7D MA</button>
            <button class="tab ${this._aaTrendMA === 30 ? 'active' : ''}" @click=${() => { this._aaTrendMA = 30; }}>30D MA</button>
            <button class="tab" @click=${() => { this._aaTrendZoom = null; }}>Reset Zoom</button>
          </div>
        </div>
        <div style="position:relative;height:120px;background:#1a1d2e;border-radius:6px;overflow:hidden;margin-bottom:8px;cursor:crosshair" @click=${(e: any) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const x = e.clientX - rect.left;
          const ratio = x / rect.width;
          const center = Math.floor(ratio * 90);
          this._aaTrendZoom = { start: Math.max(0, center - 10), end: Math.min(89, center + 10) };
        }}>
          ${filtered.map((d, i) => html`
            <div style="position:absolute;left:${(d.day / 89) * 100}%;bottom:${((d.value - minVal) / range) * 100}%;width:2px;height:${(d.value - minVal) / range * 100}%;background:${d.anomaly ? '#ef4444' : '#3b82f6'};opacity:0.7"></div>
            ${d.anomaly ? html`<div style="position:absolute;left:${(d.day / 89) * 100 - 2}%;top:0;width:4px;height:100%;background:#ef444620;border-left:1px dashed #ef4444"></div>` : nothing}
          `)}
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">
          <div style="background:#1a1d2e;border-radius:4px;padding:6px;text-align:center">
            <div style="font-size:14px;font-weight:700;color:#60a5fa">${stats.mean}</div>
            <div style="font-size:9px;color:#6b7280">Mean</div>
          </div>
          <div style="background:#1a1d2e;border-radius:4px;padding:6px;text-align:center">
            <div style="font-size:14px;font-weight:700;color:#34d399">${stats.median}</div>
            <div style="font-size:9px;color:#6b7280">Median</div>
          </div>
          <div style="background:#1a1d2e;border-radius:4px;padding:6px;text-align:center">
            <div style="font-size:14px;font-weight:700;color:#f59e0b">${stats.stddev}</div>
            <div style="font-size:9px;color:#6b7280">Std Dev</div>
          </div>
          <div style="background:#1a1d2e;border-radius:4px;padding:6px;text-align:center">
            <div style="font-size:14px;font-weight:700;color:${stats.trend === 'Increasing' ? '#ef4444' : stats.trend === 'Decreasing' ? '#22c55e' : '#6b7280'}">${stats.trend}</div>
            <div style="font-size:9px;color:#6b7280">Trend</div>
          </div>
        </div>
      </div>
    `;
  }

  // === ACCESS CONTROL MATRIX ===
  @state() private _aaRoles: string[] = ['Admin','Analyst','Operator','Viewer','Auditor'];
  @state() private _aaActions: string[] = ['Create','Read','Update','Delete','Export','Approve'];
  @state() private _aaPermissions: { [role: string]: { [action: string]: boolean } } = {};
  @state() private _aaPermAudit: {role:string;action:string;changedBy:string;timestamp:string;oldVal:boolean;newVal:boolean}[] = [];
  @state() private _aaPermCompare: string[] = [];

  private _aaInitPermissions(): void {
    const perms: Record<string, Record<string, boolean>> = {};
    const defaults: Record<string, boolean[]> = {
      Admin: [true,true,true,true,true,true],
      Analyst: [true,true,true,false,true,false],
      Operator: [true,true,true,false,false,false],
      Viewer: [false,true,false,false,false,false],
      Auditor: [false,true,false,false,true,false],
    };
    for (const role of this._aaRoles) {
      perms[role] = {};
      this._aaActions.forEach((a, i) => { perms[role][a] = defaults[role]?.[i] ?? false; });
    }
    this._aaPermissions = perms;
  }

  private _aaTogglePermission(role: string, action: string): void {
    const old = this._aaPermissions[role][action];
    this._aaPermissions = {...this._aaPermissions, [role]: {...this._aaPermissions[role], [action]: !old}};
    this._aaPermAudit.unshift({role,action,changedBy:'current_user',timestamp:new Date().toISOString(),oldVal:old,newVal:!old});
  }

  private _aaRenderRBAC(): any {
    const compareRoles = this._aaPermCompare.map(r => this._aaPermissions[r]).filter(Boolean);
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">RBAC Permission Matrix</span>
          <div style="display:flex;gap:4px">
            ${this._aaRoles.map(r => html`
              <button class="tab ${this._aaPermCompare.includes(r) ? 'active' : ''}" @click=${() => {
                this._aaPermCompare = this._aaPermCompare.includes(r) ? this._aaPermCompare.filter(x => x !== r) : [...this._aaPermCompare, r];
              }}>${r}</button>
            `)}
          </div>
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:10px">
            <thead>
              <tr>
                <th style="text-align:left;padding:6px;color:#6b7280;border-bottom:1px solid #2a2d3a">Role \ Action</th>
                ${this._aaActions.map(a => html`<th style="padding:6px;color:#6b7280;border-bottom:1px solid #2a2d3a;text-align:center">${a}</th>`)}
              </tr>
            </thead>
            <tbody>
              ${this._aaRoles.map(role => html`
                <tr style="border-bottom:1px solid #1a1d2e">
                  <td style="padding:6px;color:#e2e8f0;font-weight:600">${role}</td>
                  ${this._aaActions.map(action => html`
                    <td style="text-align:center;padding:6px">
                      <button style="width:28px;height:20px;border-radius:3px;border:1px solid #2a2d3a;background:${this._aaPermissions[role][action] ? '#22c55e' : '#1a1d2e'};cursor:pointer;color:#fff;font-size:10px" @click=${() => this._aaTogglePermission(role, action)}>${this._aaPermissions[role][action] ? 'Y' : 'N'}</button>
                    </td>
                  `)}
                </tr>
              `)}
            </tbody>
          </table>
        </div>
        ${compareRoles.length >= 2 ? html`
          <div style="margin-top:10px;padding:8px;background:#1a1d2e;border-radius:6px">
            <div style="font-size:11px;font-weight:600;color:#e2e8f0;margin-bottom:6px">Role Diff: ${this._aaPermCompare.join(' vs ')}</div>
            ${this._aaActions.map(action => {
              const vals = compareRoles.map(r => r[action]);
              const allSame = vals.every(v => v === vals[0]);
              return allSame ? nothing : html`
                <div style="display:flex;gap:8px;padding:3px 0;font-size:10px">
                  <span style="color:#6b7280;width:60px">${action}:</span>
                  ${compareRoles.map((r, i) => html`<span style="color:${r[action] ? '#22c55e' : '#ef4444'}">${this._aaPermCompare[i]}=${r[action] ? 'Y' : 'N'}</span>`)}
                </div>
              `;
            })}
          </div>
        ` : nothing}
        ${this._aaPermAudit.length > 0 ? html`
          <div style="margin-top:8px;font-size:9px;color:#6b7280">Recent: ${this._aaPermAudit.slice(0,3).map(a => html`<span style="margin-right:8px">${a.role}.${a.action}: ${a.oldVal ? 'Y' : 'N'}->${a.newVal ? 'Y' : 'N'}</span>`)}
        ` : nothing}
      </div>
    `;
  }

  // === REPORTING SUITE ===
  @state() private _aaReportTemplate: string = 'executive';
  @state() private _aaReportSchedule: string = 'weekly';
  @state() private _aaReportDistList: string[] = ['security-team@company.com','ciso@company.com'];
  @state() private _aaReportHistory: {id:string;template:string;generatedAt:string;status:string}[] = [];

  private _aaGenerateReport(): void {
    const id = 'rpt-' + Date.now();
    this._aaReportHistory.unshift({id,template:this._aaReportTemplate,generatedAt:new Date().toISOString(),status:'sent'});
  }

  private _aaRenderReporting(): any {
    const templates = [{key:'executive',label:'Executive Summary',desc:'High-level overview for leadership'},{key:'technical',label:'Technical Report',desc:'Detailed findings for engineers'},{key:'compliance',label:'Compliance Audit',desc:'Regulatory compliance evidence'}];
    const schedules = [{key:'daily',label:'Daily'},{key:'weekly',label:'Weekly'},{key:'monthly',label:'Monthly'}];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="font-weight:700;font-size:13px;color:#e2e8f0;margin-bottom:8px">Report Generator</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Template</div>
            ${templates.map(t => html`
              <div style="padding:6px;background:${this._aaReportTemplate === t.key ? '#1e3a5f' : '#1a1d2e'};border:1px solid ${this._aaReportTemplate === t.key ? '#3b82f6' : '#2a2d3a'};border-radius:4px;margin-bottom:4px;cursor:pointer" @click=${() => { this._aaReportTemplate = t.key; }}>
                <div style="font-size:11px;color:#e2e8f0">${t.label}</div>
                <div style="font-size:9px;color:#6b7280">${t.desc}</div>
              </div>
            `)}
          </div>
          <div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Schedule</div>
            <div style="display:flex;gap:4px;margin-bottom:8px">
              ${schedules.map(s => html`<button class="tab ${this._aaReportSchedule === s.key ? 'active' : ''}" @click=${() => { this._aaReportSchedule = s.key; }}>${s.label}</button>`)}
            </div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Distribution</div>
            <div style="font-size:10px;color:#9ca3af">${this._aaReportDistList.map(d => html`<div>${d}</div>`)}</div>
            <div style="margin-top:6px;display:flex;gap:4px">
              <button style="background:#3b82f6;border:none;border-radius:4px;padding:4px 10px;color:#fff;font-size:10px;cursor:pointer" @click=${this._aaGenerateReport}>Generate</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">PDF</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">CSV</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">JSON</button>
            </div>
          </div>
        </div>
        ${this._aaReportHistory.length > 0 ? html`
          <div style="border-top:1px solid #2a2d3a;padding-top:8px">
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Recent Reports</div>
            ${this._aaReportHistory.slice(0,3).map(r => html`
              <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:10px">
                <span style="color:#e2e8f0">${r.template}</span>
                <span style="color:${r.status === 'sent' ? '#22c55e' : r.status === 'failed' ? '#ef4444' : '#f59e0b'}">${r.status}</span>
              </div>
            `)}
          </div>
        ` : nothing}
      </div>
    `;
  }

  // === KEYBOARD SHORTCUTS & ACCESSIBILITY ===
  @state() private _aaHighContrast: boolean = false;
  @state() private _aaA11yAnnounce: string = '';
  @state() private _aaShortcutsVisible: boolean = false;
  @state() private _aaFocusTrap: boolean = false;

  private _aaShortcuts: Record<string, string> = {
    'Escape': 'Close dialogs / Cancel',
    'Ctrl+Shift+S': 'Toggle scenario simulation',
    'Ctrl+Shift+T': 'Toggle time-series view',
    'Ctrl+Shift+R': 'Open report generator',
    'Ctrl+Shift+A': 'Toggle accessibility panel',
    'Ctrl+Shift+H': 'Toggle high contrast',
    'Tab': 'Navigate between sections',
    'Enter/Space': 'Activate focused button',
  };

  private _aaHandleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this._aaFocusTrap) { this._aaFocusTrap = false; this._aaAnnounce('Dialog closed'); }
    if (e.ctrlKey && e.shiftKey && e.key === 'H') { e.preventDefault(); this._aaHighContrast = !this._aaHighContrast; this._aaAnnounce('High contrast ' + (this._aaHighContrast ? 'enabled' : 'disabled')); }
    if (e.ctrlKey && e.shiftKey && e.key === 'A') { e.preventDefault(); this._aaShortcutsVisible = !this._aaShortcutsVisible; }
  }

  private _aaAnnounce(msg: string): void {
    this._aaA11yAnnounce = msg;
    setTimeout(() => { this._aaA11yAnnounce = ''; }, 2000);
  }

  private _aaRenderAccessibility(): any {
    return html`
      <div role="region" aria-label="Accessibility Controls" style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0" role="heading" aria-level="3">Accessibility</span>
          <button class="tab ${this._aaShortcutsVisible ? 'active' : ''}" @click=${() => { this._aaShortcutsVisible = !this._aaShortcutsVisible; }} aria-expanded=${this._aaShortcutsVisible}>Shortcuts</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:#e2e8f0;cursor:pointer">
            <input type="checkbox" .checked=${this._aaHighContrast} @change=${() => { this._aaHighContrast = !this._aaHighContrast; }} aria-label="Toggle high contrast mode">
            High Contrast
          </label>
        </div>
        ${this._aaShortcutsVisible ? html`
          <div role="list" aria-label="Keyboard shortcuts" style="background:#1a1d2e;border-radius:6px;padding:8px">
            ${Object.entries(this._aaShortcuts).map(([key, desc]) => html`
              <div role="listitem" style="display:flex;justify-content:space-between;padding:3px 0;font-size:10px">
                <kbd style="background:#2a2d3a;padding:1px 6px;border-radius:3px;color:#60a5fa;font-family:monospace">${key}</kbd>
                <span style="color:#9ca3af">${desc}</span>
              </div>
            `)}
          </div>
        ` : nothing}
        <div role="status" aria-live="polite" aria-atomic="true" style="position:absolute;left:-9999px">${this._aaA11yAnnounce}</div>
      </div>
    `;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this._initThreatModel();
    this._initPipeline();
    this._initPlaybooks();
    this._initMetrics();
    this._initIntegration();
    this._aaInitScenarios();
    this._aaInitTrendData();
    this._aaInitPermissions();
    document.addEventListener('keydown', this._aaHandleKeydown.bind(this));
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._aaHandleKeydown.bind(this));
  }

  // === TAB INTEGRATION FOR EXTENDED FEATURES ===
  @state() private _aaActiveSubTab: string = 'scenario';



  // === Advanced Threat Modeling (STRIDE/DREAD/Attack Tree) ===
  @state() private _threatModelEnabled = false;
  @state() private _threatCategories: Array<{
    id: string;
    category: string;
    threats: Array<{
      id: string;
      name: string;
      stride: string;
      likelihood: number;
      impact: number;
      dreadScore: number;
      status: string;
      mitigations: string[];
      assignedTo: string;
      discoveredDate: string;
      lastReviewed: string;
    }>;
    totalCount: number;
    criticalCount: number;
    mitigatedCount: number;
  }> = [];
  @state() private _selectedThreatCategory = '';
  @state() private _threatViewMode: 'matrix' | 'tree' | 'canvas' | 'comparison' = 'matrix';
  @state() private _threatModelVersion = 'v1.0';
  @state() private _threatModelHistory: Array<{ version: string; date: string; changes: string; author: string }> = [];

  private _initThreatModel() {
    const categories = [
      { id: 'tc1', category: 'Spoofing', threats: [
        { id: 't1', name: 'Credential theft via phishing', stride: 'S', likelihood: 8, impact: 9, dreadScore: 7.2, status: 'open', mitigations: ['MFA enforcement', 'Security awareness training'], assignedTo: 'Security Team', discoveredDate: '2024-01-10', lastReviewed: '2024-02-15' },
        { id: 't2', name: 'Session hijacking', stride: 'S', likelihood: 6, impact: 8, dreadScore: 6.5, status: 'mitigated', mitigations: ['Session rotation', 'Binding tokens'], assignedTo: 'Platform Team', discoveredDate: '2024-01-12', lastReviewed: '2024-02-20' },
        { id: 't3', name: 'Token forgery attack', stride: 'S', likelihood: 4, impact: 9, dreadScore: 5.8, status: 'in-progress', mitigations: ['Token signing', 'Short TTL'], assignedTo: 'Auth Team', discoveredDate: '2024-01-15', lastReviewed: '2024-02-18' },
      ], totalCount: 3, criticalCount: 1, mitigatedCount: 1 },
      { id: 'tc2', category: 'Tampering', threats: [
        { id: 't4', name: 'Data injection in architecture security', stride: 'T', likelihood: 7, impact: 8, dreadScore: 7.0, status: 'open', mitigations: ['Input validation', 'WAF rules'], assignedTo: 'Dev Team', discoveredDate: '2024-01-08', lastReviewed: '2024-02-10' },
        { id: 't5', name: 'Configuration drift', stride: 'T', likelihood: 5, impact: 6, dreadScore: 5.2, status: 'mitigated', mitigations: ['Config management', 'Drift detection'], assignedTo: 'SRE Team', discoveredDate: '2024-01-20', lastReviewed: '2024-02-22' },
      ], totalCount: 2, criticalCount: 1, mitigatedCount: 1 },
      { id: 'tc3', category: 'Repudiation', threats: [
        { id: 't6', name: 'Log tampering evidence loss', stride: 'R', likelihood: 5, impact: 7, dreadScore: 5.8, status: 'in-progress', mitigations: ['Immutable logs', 'Log forwarding'], assignedTo: 'SOC Team', discoveredDate: '2024-01-22', lastReviewed: '2024-02-25' },
      ], totalCount: 1, criticalCount: 0, mitigatedCount: 0 },
      { id: 'tc4', category: 'Info Disclosure', threats: [
        { id: 't7', name: 'Sensitive data exposure in API', stride: 'I', likelihood: 8, impact: 9, dreadScore: 8.2, status: 'open', mitigations: ['Data masking', 'Field-level encryption'], assignedTo: 'API Team', discoveredDate: '2024-01-05', lastReviewed: '2024-02-12' },
        { id: 't8', name: 'Cloud storage misconfiguration', stride: 'I', likelihood: 6, impact: 8, dreadScore: 6.8, status: 'mitigated', mitigations: ['Storage policies', 'Access reviews'], assignedTo: 'Cloud Team', discoveredDate: '2024-01-18', lastReviewed: '2024-02-20' },
        { id: 't9', name: 'Error message information leak', stride: 'I', likelihood: 7, impact: 4, dreadScore: 5.0, status: 'mitigated', mitigations: ['Generic error pages', 'Stack trace filter'], assignedTo: 'Dev Team', discoveredDate: '2024-01-25', lastReviewed: '2024-02-28' },
      ], totalCount: 3, criticalCount: 1, mitigatedCount: 2 },
      { id: 'tc5', category: 'Denial of Service', threats: [
        { id: 't10', name: 'Resource exhaustion attack', stride: 'D', likelihood: 7, impact: 8, dreadScore: 7.2, status: 'open', mitigations: ['Rate limiting', 'Circuit breaker'], assignedTo: 'Infra Team', discoveredDate: '2024-01-14', lastReviewed: '2024-02-16' },
        { id: 't11', name: 'API abuse amplification', stride: 'D', likelihood: 5, impact: 6, dreadScore: 5.4, status: 'in-progress', mitigations: ['API gateway throttling', 'Request quotas'], assignedTo: 'API Team', discoveredDate: '2024-01-28', lastReviewed: '2024-03-01' },
      ], totalCount: 2, criticalCount: 1, mitigatedCount: 0 },
      { id: 'tc6', category: 'Elevation of Privilege', threats: [
        { id: 't12', name: 'Privilege escalation via misconfig', stride: 'E', likelihood: 6, impact: 10, dreadScore: 7.8, status: 'open', mitigations: ['Least privilege', 'RBAC audit'], assignedTo: 'IAM Team', discoveredDate: '2024-01-06', lastReviewed: '2024-02-08' },
        { id: 't13', name: 'Container breakout exploit', stride: 'E', likelihood: 3, impact: 10, dreadScore: 5.8, status: 'mitigated', mitigations: ['Runtime security', 'Seccomp profiles'], assignedTo: 'Platform Team', discoveredDate: '2024-01-30', lastReviewed: '2024-03-02' },
      ], totalCount: 2, criticalCount: 1, mitigatedCount: 1 },
      { id: 'tc7', category: 'Supply Chain', threats: [
        { id: 't14', name: 'Dependency compromise', stride: 'E', likelihood: 5, impact: 8, dreadScore: 6.2, status: 'in-progress', mitigations: ['SBOM scanning', 'Lock files'], assignedTo: 'DevSecOps', discoveredDate: '2024-02-01', lastReviewed: '2024-03-05' },
      ], totalCount: 1, criticalCount: 1, mitigatedCount: 0 },
      { id: 'tc8', category: 'Physical / Social', threats: [
        { id: 't15', name: 'Tailgating access breach', stride: 'S', likelihood: 4, impact: 7, dreadScore: 5.2, status: 'open', mitigations: ['Badge access', 'Security cameras'], assignedTo: 'Physical Security', discoveredDate: '2024-02-03', lastReviewed: '2024-03-08' },
      ], totalCount: 1, criticalCount: 0, mitigatedCount: 0 },
    ];
    this._threatCategories = categories;
    this._threatModelHistory = [
      { version: 'v1.0', date: '2024-01-01', changes: 'Initial threat model created', author: 'Security Lead' },
      { version: 'v1.1', date: '2024-02-01', changes: 'Added supply chain threats, updated DREAD scores', author: 'Security Analyst' },
    ];
    this._threatModelEnabled = true;
  }

  private _getThreatColor(score: number): string {
    if (score >= 7) return '#f87171';
    if (score >= 5) return '#fbbf24';
    if (score >= 3) return '#34d399';
    return '#60a5fa';
  }

  private _renderThreatModelPanel(): any {
    if (!this._threatModelEnabled) return nothing;
    const totalThreats = this._threatCategories.reduce((s, c) => s + c.totalCount, 0);
    const criticalThreats = this._threatCategories.reduce((s, c) => s + c.criticalCount, 0);
    const mitigatedThreats = this._threatCategories.reduce((s, c) => s + c.mitigatedCount, 0);
    return html`
      <div style="margin-top:12px;padding:12px;background:#111827;border:1px solid #374151;border-radius:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div style="font-weight:700;font-size:13px;color:#f9fafb">Threat Model (STRIDE/DREAD)</div>
          <div style="display:flex;gap:6px">
            ${['matrix', 'tree', 'canvas', 'comparison'].map(m => html`
              <button class="btn btn-sm" style="padding:3px 10px;font-size:10px;${this._threatViewMode === m ? 'background:#1e40af;color:#fff' : 'background:#1f2937;color:#9ca3af'}" @click=${() => { this._threatViewMode = m as any; }}>${m.charAt(0).toUpperCase() + m.slice(1)}</button>
            `)}
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:10px">
          <div style="flex:1;padding:8px;background:#1f2937;border-radius:6px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:#f9fafb">${totalThreats}</div>
            <div style="font-size:10px;color:#9ca3af">Total Threats</div>
          </div>
          <div style="flex:1;padding:8px;background:#1f2937;border-radius:6px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:#f87171">${criticalThreats}</div>
            <div style="font-size:10px;color:#9ca3af">Critical</div>
          </div>
          <div style="flex:1;padding:8px;background:#1f2937;border-radius:6px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:#34d399">${mitigatedThreats}</div>
            <div style="font-size:10px;color:#9ca3af">Mitigated</div>
          </div>
          <div style="flex:1;padding:8px;background:#1f2937;border-radius:6px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:#fbbf24">${this._threatModelVersion}</div>
            <div style="font-size:10px;color:#9ca3af">Version</div>
          </div>
        </div>
        ${this._threatViewMode === 'matrix' ? html`
          <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:4px;font-size:10px;margin-bottom:8px">
            <div style="padding:4px;text-align:center;color:#6b7280;border-bottom:1px solid #374151">Low Impact</div>
            <div style="padding:4px;text-align:center;color:#6b7280;border-bottom:1px solid #374151">Medium Impact</div>
            <div style="padding:4px;text-align:center;color:#6b7280;border-bottom:1px solid #374151">High Impact</div>
            <div style="padding:4px;text-align:center;color:#6b7280;border-bottom:1px solid #374151">Critical Impact</div>
            ${[0,1,2,3].map(row => html`
              <div style="padding:4px;text-align:center;color:#6b7280;background:#111827">${row === 0 ? 'Unlikely' : row === 1 ? 'Possible' : row === 2 ? 'Likely' : 'Almost Certain'}</div>
              ${[0,1,2,3].map(col => {
                const impact = (col + 1) * 2.5;
                const likelihood = (row + 1) * 2.5;
                const threats = this._threatCategories.flatMap(c => c.threats).filter(t => t.likelihood >= likelihood - 1.25 && t.likelihood < likelihood + 1.25 && t.impact >= impact - 1.25 && t.impact < impact + 1.25);
                const bgColor = (row + col) >= 4 ? 'rgba(239,68,68,0.15)' : (row + col) >= 2 ? 'rgba(251,191,36,0.15)' : 'rgba(52,211,153,0.15)';
                return html`<div style="padding:4px;text-align:center;background:${bgColor};border-radius:4px;cursor:pointer;font-size:9px;color:#d1d5db" title="${threats.map(t => t.name).join(', ')}">${threats.length}</div>`;
              })}
            `)}
          </div>
        ` : this._threatViewMode === 'canvas' ? html`
          <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:8px">
            ${this._threatCategories.map(cat => html`
              <div style="padding:8px;background:#1f2937;border-radius:6px;border-left:3px solid ${this._getThreatColor(cat.threats.reduce((s, t) => s + t.dreadScore, 0) / cat.totalCount)}">
                <div style="font-size:11px;font-weight:600;color:#f9fafb;margin-bottom:4px">${cat.category}</div>
                <div style="font-size:9px;color:#9ca3af">${cat.totalCount} threats (span style="color:#f87171">${cat.criticalCount} critical</span>)</div>
                <div style="margin-top:6px">${cat.threats.slice(0, 2).map(t => html`
                  <div style="display:flex;justify-content:space-between;padding:2px 0;font-size:9px">
                    <span style="color:#d1d5db">${t.name.substring(0, 20)}</span>
                    <span style="color:${this._getThreatColor(t.dreadScore)}">${t.dreadScore}</span>
                  </div>
                `)}</div>
              </div>
            `)}
          </div>
        ` : this._threatViewMode === 'tree' ? html`
          <div style="max-height:200px;overflow-y:auto">
            ${this._threatCategories.map(cat => html`
              <div style="margin-bottom:6px">
                <div style="padding:4px 8px;background:#1e3a5f;border-radius:4px 4px 0 0;font-size:11px;font-weight:600;color:#60a5fa">${cat.category} (${cat.totalCount})</div>
                ${cat.threats.map(t => html`
                  <div style="display:flex;align-items:center;padding:3px 8px 3px 24px;background:#111827;border-left:2px solid #374151;font-size:10px">
                    <span style="flex:1;color:#d1d5db">${t.name}</span>
                    <span style="color:${this._getThreatColor(t.dreadScore)};font-weight:600;margin-right:8px">${t.dreadScore}</span>
                    <span style="padding:1px 6px;border-radius:3px;font-size:8px;background:${t.status === 'mitigated' ? '#064e3b' : t.status === 'in-progress' ? '#78350f' : '#7f1d1d'};color:${t.status === 'mitigated' ? '#34d399' : t.status === 'in-progress' ? '#fbbf24' : '#f87171'}">${t.status}</span>
                  </div>
                `)}
              </div>
            `)}
          </div>
        ` : html`
          <div style="font-size:10px;color:#9ca3af;padding:8px;text-align:center">
            <div style="font-weight:600;color:#d1d5db;margin-bottom:6px">Threat Model Version History</div>
            ${this._threatModelHistory.map(h => html`
              <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #1f2937">
                <span style="color:#60a5fa">${h.version}</span>
                <span>${h.date}</span>
                <span style="color:#d1d5db">${h.author}</span>
                <span style="color:#9ca3af">${h.changes}</span>
              </div>
            `)}
          </div>
        `}
      </div>
    `;
  }


  // === Data Pipeline Visualization (DAG) ===
  @state() private _pipelineEnabled = false;
  @state() private _pipelineStages: Array<{
    id: string;
    name: string;
    type: string;
    status: 'running' | 'completed' | 'failed' | 'pending' | 'warning';
    inputRecords: number;
    outputRecords: number;
    errorRate: number;
    latencyMs: number;
    throughput: number;
    qualityScore: number;
    startTime: string;
    endTime: string;
    dependencies: string[];
    bottlenecks: string[];
  }> = [];
  @state() private _pipelineViewMode: 'dag' | 'timeline' | 'metrics' = 'dag';
  @state() private _pipelineSelectedStage = '';
  @state() private _pipelineAutoRefresh = false;

  private _initPipeline() {
    this._pipelineStages = [
      { id: 's1', name: 'Data Ingestion', type: 'source', status: 'completed', inputRecords: 0, outputRecords: 125000, errorRate: 0.01, latencyMs: 120, throughput: 5200, qualityScore: 98.5, startTime: '00:00:00', endTime: '00:00:48', dependencies: [], bottlenecks: [] },
      { id: 's2', name: 'Schema Validation', type: 'transform', status: 'completed', inputRecords: 125000, outputRecords: 124500, errorRate: 0.4, latencyMs: 85, throughput: 4800, qualityScore: 99.6, startTime: '00:00:48', endTime: '00:01:14', dependencies: ['s1'], bottlenecks: [] },
      { id: 's3', name: 'Enrichment Engine', type: 'enrichment', status: 'running', inputRecords: 124500, outputRecords: 98200, errorRate: 2.1, latencyMs: 340, throughput: 2900, qualityScore: 92.3, startTime: '00:01:14', endTime: '', dependencies: ['s2'], bottlenecks: ['High latency on geolocation lookup', 'External API rate limiting'] },
      { id: 's4', name: 'Deduplication', type: 'transform', status: 'pending', inputRecords: 98200, outputRecords: 0, errorRate: 0, latencyMs: 0, throughput: 0, qualityScore: 0, startTime: '', endTime: '', dependencies: ['s3'], bottlenecks: [] },
      { id: 's5', name: 'Threat Correlation', type: 'analysis', status: 'pending', inputRecords: 0, outputRecords: 0, errorRate: 0, latencyMs: 0, throughput: 0, qualityScore: 0, startTime: '', endTime: '', dependencies: ['s3', 's4'], bottlenecks: [] },
      { id: 's6', name: 'Scoring Engine', type: 'scoring', status: 'pending', inputRecords: 0, outputRecords: 0, errorRate: 0, latencyMs: 0, throughput: 0, qualityScore: 0, startTime: '', endTime: '', dependencies: ['s5'], bottlenecks: [] },
      { id: 's7', name: 'Alert Generation', type: 'sink', status: 'pending', inputRecords: 0, outputRecords: 0, errorRate: 0, latencyMs: 0, throughput: 0, qualityScore: 0, startTime: '', endTime: '', dependencies: ['s6'], bottlenecks: [] },
      { id: 's8', name: 'Archive Storage', type: 'sink', status: 'pending', inputRecords: 0, outputRecords: 0, errorRate: 0, latencyMs: 0, throughput: 0, qualityScore: 0, startTime: '', endTime: '', dependencies: ['s6'], bottlenecks: [] },
    ];
    this._pipelineEnabled = true;
  }

  private _getPipelineStatusColor(status: string): string {
    switch (status) {
      case 'completed': return '#34d399';
      case 'running': return '#60a5fa';
      case 'failed': return '#f87171';
      case 'warning': return '#fbbf24';
      default: return '#6b7280';
    }
  }

  private _getPipelineStatusIcon(status: string): string {
    switch (status) {
      case 'completed': return '✓';
      case 'running': return '●';
      case 'failed': return '✗';
      case 'warning': return '⚠';
      default: return '○';
    }
  }

  private _renderPipelineVisualization(): any {
    if (!this._pipelineEnabled) return nothing;
    const completedCount = this._pipelineStages.filter(s => s.status === 'completed').length;
    const runningCount = this._pipelineStages.filter(s => s.status === 'running').length;
    const totalRecords = this._pipelineStages.reduce((s, p) => s + p.outputRecords, 0);
    return html`
      <div style="margin-top:12px;padding:12px;background:#111827;border:1px solid #374151;border-radius:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div style="font-weight:700;font-size:13px;color:#f9fafb">Data Pipeline (DAG)</div>
          <div style="display:flex;gap:6px;align-items:center">
            <span style="font-size:10px;color:#9ca3af">${completedCount}/${this._pipelineStages.length} stages</span>
            <span style="font-size:10px;color:#60a5fa">${totalRecords.toLocaleString()} records</span>
          </div>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:10px">
          ${['dag', 'timeline', 'metrics'].map(v => html`
            <button class="btn btn-sm" style="padding:3px 10px;font-size:10px;${this._pipelineViewMode === v ? 'background:#1e40af;color:#fff' : 'background:#1f2937;color:#9ca3af'}" @click=${() => { this._pipelineViewMode = v as any; }}>${v === 'dag' ? 'Flow Graph' : v === 'timeline' ? 'Timeline' : 'Metrics'}</button>
          `)}
        </div>
        ${this._pipelineViewMode === 'dag' ? html`
          <div style="position:relative;padding:8px">
            ${this._pipelineStages.map((stage, i) => html`
              <div style="display:flex;align-items:center;margin-bottom:4px;position:relative">
                <div style="width:16px;height:16px;border-radius:50%;background:${this._getPipelineStatusColor(stage.status)};display:flex;align-items:center;justify-content:center;font-size:8px;color:#111827;font-weight:700;z-index:1;flex-shrink:0">${this._getPipelineStatusIcon(stage.status)}</div>
                ${i < this._pipelineStages.length - 1 ? html`<div style="position:absolute;left:7px;top:16px;width:2px;height:20px;background:#374151"></div>` : nothing}
                <div style="margin-left:12px;flex:1;padding:6px 10px;background:#1f2937;border-radius:6px;border-left:3px solid ${this._getPipelineStatusColor(stage.status)};cursor:pointer" @click=${() => { this._pipelineSelectedStage = this._pipelineSelectedStage === stage.id ? '' : stage.id; }}>
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <span style="font-size:11px;font-weight:600;color:#f9fafb">${stage.name}</span>
                    <span style="font-size:9px;color:#9ca3af">${stage.type}</span>
                  </div>
                  ${this._pipelineSelectedStage === stage.id ? html`
                    <div style="margin-top:6px;display:grid;grid-template-columns:repeat(3, 1fr);gap:4px;font-size:9px">
                      <div style="color:#9ca3af">In: <span style="color:#60a5fa">${stage.inputRecords.toLocaleString()}</span></div>
                      <div style="color:#9ca3af">Out: <span style="color:#34d399">${stage.outputRecords.toLocaleString()}</span></div>
                      <div style="color:#9ca3af">Errors: <span style="color:${stage.errorRate > 1 ? '#f87171' : '#fbbf24'}">${stage.errorRate}%</span></div>
                      <div style="color:#9ca3af">Latency: <span style="color:#d1d5db">${stage.latencyMs}ms</span></div>
                      <div style="color:#9ca3af">Throughput: <span style="color:#d1d5db">${stage.throughput}/s</span></div>
                      <div style="color:#9ca3af">Quality: <span style="color:${stage.qualityScore >= 95 ? '#34d399' : stage.qualityScore >= 80 ? '#fbbf24' : '#f87171'}">${stage.qualityScore}%</span></div>
                    </div>
                    ${stage.bottlenecks.length > 0 ? html`
                      <div style="margin-top:4px;padding:4px 6px;background:#7f1d1d;border-radius:4px;font-size:9px;color:#fca5a5">
                        Bottleneck: ${stage.bottlenecks.join('; ')}
                      </div>
                    ` : nothing}
                  ` : html`
                    <div style="font-size:9px;color:#6b7280;margin-top:2px">${stage.status === 'running' ? `Processing... ${stage.outputRecords.toLocaleString()} records` : stage.status === 'completed' ? `${stage.outputRecords.toLocaleString()} records processed` : 'Waiting for dependencies'}</div>
                  `}
                </div>
              </div>
            `)}
          </div>
        ` : this._pipelineViewMode === 'timeline' ? html`
          <div style="overflow-x:auto">
            <div style="display:flex;gap:2px;min-width:600px">
              ${this._pipelineStages.map(stage => {
                const totalSpan = 300;
                const startOffset = stage.startTime ? this._timeToOffset(stage.startTime) : 0;
                const endOffset = stage.endTime ? this._timeToOffset(stage.endTime) : this._timeToOffset('00:02:30');
                const width = Math.max(endOffset - startOffset, 8);
                return html`
                  <div style="flex-shrink:0;width:${width}px;margin-left:${startOffset}px;padding:4px;background:${this._getPipelineStatusColor(stage.status)}22;border:1px solid ${this._getPipelineStatusColor(stage.status)}44;border-radius:3px;font-size:8px;color:#d1d5db;overflow:hidden">
                    <div style="font-weight:600;white-space:nowrap">${stage.name}</div>
                    <div style="color:#9ca3af">${stage.startTime} - ${stage.endTime || '...'}</div>
                  </div>
                `;
              })}
            </div>
            <div style="display:flex;justify-content:space-between;font-size:8px;color:#6b7280;margin-top:4px">
              <span>00:00</span><span>00:30</span><span>01:00</span><span>01:30</span><span>02:00</span><span>02:30</span>
            </div>
          </div>
        ` : html`
          <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:6px">
            ${this._pipelineStages.filter(s => s.status !== 'pending').map(stage => html`
              <div style="padding:8px;background:#1f2937;border-radius:6px;text-align:center">
                <div style="font-size:10px;font-weight:600;color:#f9fafb;margin-bottom:4px">${stage.name}</div>
                <div style="font-size:16px;font-weight:700;color:${this._getPipelineStatusColor(stage.status)}">${stage.qualityScore}%</div>
                <div style="font-size:8px;color:#9ca3af">Quality Score</div>
                <div style="margin-top:4px;height:3px;background:#374151;border-radius:2px;overflow:hidden">
                  <div style="height:100%;width:${stage.qualityScore}%;background:${this._getPipelineStatusColor(stage.status)};border-radius:2px"></div>
                </div>
              </div>
            `)}
          </div>
        `}
      </div>
    `;
  }

  private _timeToOffset(time: string): number {
    const parts = time.split(':').map(Number);
    return Math.round((parts[0] * 3600 + parts[1] * 60 + parts[2]) / 5);
  }


  // === Playbook System (Runbooks) ===
  @state() private _playbookEnabled = false;
  @state() private _playbooks: Array<{
    id: string;
    name: string;
    type: 'incident-response' | 'containment' | 'eradication' | 'recovery' | 'forensic' | 'communication';
    severity: string;
    steps: Array<{
      id: string;
      title: string;
      description: string;
      condition?: string;
      completed: boolean;
      assignedTo: string;
      estimatedMinutes: number;
      tools: string[];
    }>;
    totalSteps: number;
    completedSteps: number;
    status: 'not-started' | 'in-progress' | 'completed' | 'paused';
    startedAt: string;
    estimatedDuration: number;
    currentStepIndex: number;
    version: string;
    lastModified: string;
  }> = [];
  @state() private _activePlaybookId = '';
  @state() private _playbookTimer = 0;
  @state() private _playbookTimerInterval: ReturnType<typeof setInterval> | null = null;

  private _initPlaybooks() {
    this._playbooks = [
      { id: 'pb1', name: 'Ransomware Incident Response', type: 'incident-response', severity: 'critical', steps: [
        { id: 's1', title: 'Isolate affected systems', description: 'Immediately disconnect compromised systems from the network to prevent lateral movement', completed: true, assignedTo: 'SOC Tier 2', estimatedMinutes: 5, tools: ['EDR Console', 'Network ACLs'] },
        { id: 's2', title: 'Preserve volatile evidence', description: 'Capture memory dumps and running process lists before shutdown', completed: true, assignedTo: 'Forensic Team', estimatedMinutes: 15, tools: ['Volatility', 'FTK Imager'] },
        { id: 's3', title: 'Identify ransomware variant', description: 'Analyze ransom note, encrypted file extensions, and behavioral indicators', completed: false, assignedTo: 'Malware Analyst', estimatedMinutes: 30, tools: ['VirusTotal', 'IDA Pro', 'ANY.RUN'] },
        { id: 's4', title: 'Check for data exfiltration', description: 'Review network logs for outbound data transfers during the attack window', completed: false, assignedTo: 'SOC Analyst', estimatedMinutes: 20, tools: ['SIEM', 'NetFlow Analyzer'] },
        { id: 's5', title: 'Assess backup integrity', description: 'Verify that clean backups exist and are not encrypted', condition: 'If backups are available', completed: false, assignedTo: 'Backup Admin', estimatedMinutes: 10, tools: ['Veeam', 'Backup Dashboard'] },
        { id: 's6', title: 'Report to leadership', description: 'Notify CISO and executive team with initial assessment and timeline', completed: false, assignedTo: 'Incident Commander', estimatedMinutes: 15, tools: ['Slack', 'Email'] },
        { id: 's7', title: 'Engage legal counsel', description: 'Contact legal team for regulatory notification requirements', completed: false, assignedTo: 'Legal Team', estimatedMinutes: 10, tools: ['Phone', 'Secure Email'] },
      ], totalSteps: 7, completedSteps: 2, status: 'in-progress', startedAt: '2024-02-15T14:30:00', estimatedDuration: 105, currentStepIndex: 2, version: 'v2.3', lastModified: '2024-02-10' },
      { id: 'pb2', name: 'Credential Compromise Containment', type: 'containment', severity: 'high', steps: [
        { id: 's1', title: 'Force password reset for affected users', description: 'Initiate password reset for all accounts with detected compromise indicators', completed: false, assignedTo: 'IAM Team', estimatedMinutes: 10, tools: ['ADUC', 'Okta Admin'] },
        { id: 's2', title: 'Revoke active sessions', description: 'Terminate all active sessions for compromised accounts across all systems', completed: false, assignedTo: 'IAM Team', estimatedMinutes: 5, tools: ['Session Manager', 'WAF'] },
        { id: 's3', title: 'Enable enhanced monitoring', description: 'Add additional logging and alerting for affected accounts', completed: false, assignedTo: 'SOC Team', estimatedMinutes: 15, tools: ['SIEM', 'UEBA'] },
        { id: 's4', title: 'Review privileged access', description: 'Audit any privilege escalation that occurred during compromise', completed: false, assignedTo: 'Security Architect', estimatedMinutes: 30, tools: ['PAM Console', 'Audit Logs'] },
        { id: 's5', title: 'Update firewall rules', description: 'Block known malicious IPs associated with the credential abuse', completed: false, assignedTo: 'Network Team', estimatedMinutes: 10, tools: ['Firewall Manager', 'Threat Intel'] },
      ], totalSteps: 5, completedSteps: 0, status: 'not-started', startedAt: '', estimatedDuration: 70, currentStepIndex: 0, version: 'v1.5', lastModified: '2024-02-08' },
      { id: 'pb3', name: 'Data Breach Eradication', type: 'eradication', severity: 'critical', steps: [
        { id: 's1', title: 'Identify all compromised endpoints', description: 'Scan entire fleet for indicators of compromise', completed: false, assignedTo: 'EDR Team', estimatedMinutes: 20, tools: ['CrowdStrike', 'SentinelOne'] },
        { id: 's2', title: 'Remove malicious persistence', description: 'Erase backdoors, scheduled tasks, and registry modifications', completed: false, assignedTo: 'Incident Response', estimatedMinutes: 30, tools: ['Autoruns', 'YARA'] },
        { id: 's3', title: 'Patch exploited vulnerabilities', description: 'Apply security patches for all known entry points', completed: false, assignedTo: 'Patch Team', estimatedMinutes: 45, tools: ['WSUS', 'Chef'] },
        { id: 's4', title: 'Rotate all compromised credentials', description: 'Systematic rotation of all potentially exposed secrets', completed: false, assignedTo: 'Secrets Team', estimatedMinutes: 25, tools: ['Vault', 'Key Management'] },
      ], totalSteps: 4, completedSteps: 0, status: 'not-started', startedAt: '', estimatedDuration: 120, currentStepIndex: 0, version: 'v1.2', lastModified: '2024-01-28' },
      { id: 'pb4', name: 'Service Recovery Procedure', type: 'recovery', severity: 'medium', steps: [
        { id: 's1', title: 'Restore from clean backup', description: 'Restore affected systems from verified clean backups', completed: false, assignedTo: 'Backup Team', estimatedMinutes: 60, tools: ['Veeam', 'AWS Backup'] },
        { id: 's2', title: 'Validate system integrity', description: 'Run baseline scans to confirm clean state', completed: false, assignedTo: 'Security Team', estimatedMinutes: 30, tools: ['Baseline Scanner', 'FIM'] },
        { id: 's3', title: 'Gradual service restoration', description: 'Bring systems online in phases with monitoring', completed: false, assignedTo: 'SRE Team', estimatedMinutes: 45, tools: ['Load Balancer', 'Monitoring'] },
      ], totalSteps: 3, completedSteps: 0, status: 'not-started', startedAt: '', estimatedDuration: 135, currentStepIndex: 0, version: 'v1.0', lastModified: '2024-02-01' },
      { id: 'pb5', name: 'Phishing Triage and Response', type: 'incident-response', severity: 'low', steps: [
        { id: 's1', title: 'Collect phishing report details', description: 'Document the phishing email headers, body, and attachments', completed: false, assignedTo: 'SOC Tier 1', estimatedMinutes: 5, tools: ['Ticket System'] },
        { id: 's2', title: 'Identify all recipients', description: 'Search mail logs for all users who received the phishing email', completed: false, assignedTo: 'Email Admin', estimatedMinutes: 10, tools: ['Exchange Admin', 'Google Workspace'] },
        { id: 's3', title: 'Block sender and URLs', description: 'Add malicious sender and URLs to blocklists', completed: false, assignedTo: 'Security Ops', estimatedMinutes: 5, tools: ['Email Gateway', 'Web Proxy'] },
        { id: 's4', title: 'Notify affected users', description: 'Send security advisory to all recipients', completed: false, assignedTo: 'Communications', estimatedMinutes: 10, tools: ['Email', 'Slack'] },
      ], totalSteps: 4, completedSteps: 0, status: 'not-started', startedAt: '', estimatedDuration: 30, currentStepIndex: 0, version: 'v3.1', lastModified: '2024-02-12' },
    ];
    this._playbookEnabled = true;
  }

  private _renderPlaybookSystem(): any {
    if (!this._playbookEnabled) return nothing;
    return html`
      <div style="margin-top:12px;padding:12px;background:#111827;border:1px solid #374151;border-radius:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div style="font-weight:700;font-size:13px;color:#f9fafb">Playbooks & Runbooks</div>
          <div style="display:flex;gap:4px;font-size:9px;color:#9ca3af">
            <span>${this._playbooks.filter(p => p.status === 'in-progress').length} active</span>
            <span>|</span>
            <span>${this._playbooks.filter(p => p.status === 'completed').length} done</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:280px;overflow-y:auto">
          ${this._playbooks.map(pb => {
            const progress = pb.totalSteps > 0 ? Math.round((pb.completedSteps / pb.totalSteps) * 100) : 0;
            const statusColor = pb.status === 'completed' ? '#34d399' : pb.status === 'in-progress' ? '#60a5fa' : pb.status === 'paused' ? '#fbbf24' : '#6b7280';
            const severityColor = pb.severity === 'critical' ? '#f87171' : pb.severity === 'high' ? '#fb923c' : '#fbbf24';
            return html`
              <div style="padding:8px;background:#1f2937;border-radius:6px;border-left:3px solid ${statusColor};cursor:pointer" @click=${() => { this._activePlaybookId = this._activePlaybookId === pb.id ? '' : pb.id; }}>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                  <span style="font-size:11px;font-weight:600;color:#f9fafb">${pb.name}</span>
                  <span style="display:flex;gap:4px;align-items:center">
                    <span style="padding:1px 6px;border-radius:3px;font-size:8px;background:${severityColor}22;color:${severityColor}">${pb.severity}</span>
                    <span style="font-size:9px;color:#9ca3af">${pb.version}</span>
                  </span>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                  <div style="flex:1;height:4px;background:#374151;border-radius:2px;overflow:hidden">
                    <div style="height:100%;width:${progress}%;background:${statusColor};border-radius:2px;transition:width 0.3s"></div>
                  </div>
                  <span style="font-size:9px;color:#9ca3af">${pb.completedSteps}/${pb.totalSteps} (${progress}%)</span>
                  <span style="font-size:9px;color:#6b7280">${pb.estimatedDuration}min</span>
                </div>
                ${this._activePlaybookId === pb.id ? html`
                  <div style="margin-top:8px;padding-top:8px;border-top:1px solid #374151">
                    ${pb.steps.map((step, i) => html`
                      <div style="display:flex;align-items:flex-start;gap:8px;padding:4px 0;${i < pb.steps.length - 1 ? 'border-bottom:1px solid #111827' : ''}">
                        <div style="width:16px;height:16px;border-radius:50%;border:2px solid ${step.completed ? '#34d399' : i === pb.currentStepIndex ? '#60a5fa' : '#374151'};display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;background:${step.completed ? '#34d399' : 'transparent'}">
                          ${step.completed ? html`<span style="font-size:9px;color:#111827">✓</span>` : i === pb.currentStepIndex ? html`<div style="width:6px;height:6px;border-radius:50%;background:#60a5fa"></div>` : nothing}
                        </div>
                        <div style="flex:1">
                          <div style="font-size:10px;font-weight:${step.completed ? '400' : '600'};color:${step.completed ? '#6b7280' : '#f9fafb'};${step.completed ? 'text-decoration:line-through' : ''}">${step.title}</div>
                          <div style="font-size:9px;color:#6b7280;margin-top:1px">${step.description.substring(0, 60)}${step.description.length > 60 ? '...' : ''}</div>
                          ${step.condition ? html`<div style="font-size:8px;color:#fbbf24;margin-top:2px;font-style:italic">${step.condition}</div>` : nothing}
                          <div style="font-size:8px;color:#4b5563;margin-top:2px">${step.assignedTo} · ${step.estimatedMinutes}min · ${step.tools.join(', ')}</div>
                        </div>
                      </div>
                    `)}
                  </div>
                ` : nothing}
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }


  // === Metrics Dashboard (KPIs) ===
  @state() private _metricsEnabled = false;
  @state() private _kpis: Array<{
    id: string;
    name: string;
    value: number;
    previousValue: number;
    unit: string;
    threshold: { warning: number; critical: number; direction: 'above' | 'below' };
    trend: Array<number>;
    status: 'normal' | 'warning' | 'critical';
    alertEnabled: boolean;
    category: string;
  }> = [];
  @state() private _metricsPeriod: '1h' | '6h' | '24h' | '7d' = '24h';
  @state() private _metricsAutoRefresh = true;

  private _initMetrics() {
    const genTrend = (base: number, variance: number, len: number = 12): number[] =>
      Array.from({ length: len }, (_, i) => Math.round(base + (Math.random() - 0.5) * variance * 2));
    this._kpis = [
      { id: 'k1', name: 'MTTD (Mean Time to Detect)', value: 4.2, previousValue: 5.1, unit: 'min', threshold: { warning: 10, critical: 15, direction: 'above' }, trend: genTrend(4.5, 1.2), status: 'normal', alertEnabled: true, category: 'Detection' },
      { id: 'k2', name: 'MTTR (Mean Time to Respond)', value: 12.8, previousValue: 14.2, unit: 'min', threshold: { warning: 20, critical: 30, direction: 'above' }, trend: genTrend(13, 3), status: 'normal', alertEnabled: true, category: 'Response' },
      { id: 'k3', name: 'False Positive Rate', value: 8.3, previousValue: 9.1, unit: '%', threshold: { warning: 10, critical: 15, direction: 'above' }, trend: genTrend(8.5, 2), status: 'normal', alertEnabled: true, category: 'Accuracy' },
      { id: 'k4', name: 'Threat Coverage', value: 94.7, previousValue: 92.3, unit: '%', threshold: { warning: 85, critical: 75, direction: 'below' }, trend: genTrend(93, 3), status: 'normal', alertEnabled: true, category: 'Coverage' },
      { id: 'k5', name: 'Patch Compliance', value: 87.2, previousValue: 84.5, unit: '%', threshold: { warning: 90, critical: 80, direction: 'below' }, trend: genTrend(86, 4), status: 'warning', alertEnabled: true, category: 'Compliance' },
      { id: 'k6', name: 'Active Incidents', value: 3, previousValue: 5, unit: '', threshold: { warning: 5, critical: 10, direction: 'above' }, trend: genTrend(4, 2), status: 'normal', alertEnabled: true, category: 'Operations' },
      { id: 'k7', name: 'Vulnerability Backlog', value: 127, previousValue: 145, unit: '', threshold: { warning: 100, critical: 200, direction: 'above' }, trend: genTrend(130, 20), status: 'warning', alertEnabled: true, category: 'Risk' },
      { id: 'k8', name: 'Security Score', value: 82, previousValue: 79, unit: '/100', threshold: { warning: 70, critical: 50, direction: 'below' }, trend: genTrend(80, 5), status: 'normal', alertEnabled: true, category: 'Overall' },
    ];
    this._metricsEnabled = true;
  }

  private _getKpiStatus(kpi: any): string {
    if (kpi.threshold.direction === 'above') {
      if (kpi.value >= kpi.threshold.critical) return 'critical';
      if (kpi.value >= kpi.threshold.warning) return 'warning';
    } else {
      if (kpi.value <= kpi.threshold.critical) return 'critical';
      if (kpi.value <= kpi.threshold.warning) return 'warning';
    }
    return 'normal';
  }

  private _getKpiColor(status: string): string {
    switch (status) {
      case 'critical': return '#f87171';
      case 'warning': return '#fbbf24';
      default: return '#34d399';
    }
  }

  private _renderSparkline(data: number[], width: number = 60, height: number = 20): string {
    if (data.length < 2) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pts: string[] = [];
    for (let i = 0; i < data.length; i++) {
      const x = ((i / (data.length - 1)) * width).toFixed(1);
      const y = (height - ((data[i] - min) / range) * height).toFixed(1);
      pts.push(x + ',' + y);
    }
    const points = pts.join(' ');
    return '<svg width="' + width + '" height="' + height + '" style="display:block"><polyline points="' + points + '" fill="none" stroke="#60a5fa" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>';
  }

  private _renderMetricsDashboard(): any {
    if (!this._metricsEnabled) return nothing;
    return html`
      <div style="margin-top:12px;padding:12px;background:#111827;border:1px solid #374151;border-radius:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div style="font-weight:700;font-size:13px;color:#f9fafb">Security KPIs</div>
          <div style="display:flex;gap:4px">
            ${(['1h', '6h', '24h', '7d'] as const).map(p => html`
              <button class="btn btn-sm" style="padding:2px 8px;font-size:9px;${this._metricsPeriod === p ? 'background:#1e40af;color:#fff' : 'background:#1f2937;color:#9ca3af'}" @click=${() => { this._metricsPeriod = p; }}>${p}</button>
            `)}
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:6px">
          ${this._kpis.map(kpi => {
            const status = this._getKpiStatus(kpi);
            const color = this._getKpiColor(status);
            const change = kpi.previousValue > 0 ? (((kpi.value - kpi.previousValue) / kpi.previousValue) * 100).toFixed(1) : '0';
            const changePositive = kpi.name.includes('Backlog') || kpi.name.includes('Time') ? parseFloat(change) < 0 : parseFloat(change) > 0;
            return html`
              <div style="padding:8px;background:#1f2937;border-radius:6px;border-top:2px solid ${color}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                  <div style="font-size:9px;color:#9ca3af;text-transform:uppercase">${kpi.name}</div>
                  <div style="display:flex;align-items:center;gap:2px;font-size:8px;color:${changePositive ? '#34d399' : '#f87171'}">
                    ${parseFloat(change) > 0 ? html`▲` : html`▼`} ${Math.abs(parseFloat(change))}%
                  </div>
                </div>
                <div style="font-size:22px;font-weight:700;color:#f9fafb;margin:4px 0">${kpi.value}<span style="font-size:10px;color:#6b7280;font-weight:400">${kpi.unit}</span></div>
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <span style="font-size:8px;color:#6b7280">Prev: ${kpi.previousValue}${kpi.unit}</span>
                  <span innerHTML=${this._renderSparkline(kpi.trend, 50, 16)}></span>
                </div>
                <div style="margin-top:4px;display:flex;justify-content:space-between;align-items:center;font-size:8px">
                  <span style="color:#6b7280">${kpi.category}</span>
                  <span style="padding:1px 4px;border-radius:2px;background:${color}22;color:${color}">${status}</span>
                </div>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }


  // === Cross-Panel Integration (Event Bus) ===
  @state() private _integrationEnabled = false;
  @state() private _eventLog: Array<{
    id: string;
    source: string;
    target: string;
    eventType: string;
    payload: string;
    timestamp: string;
    status: 'delivered' | 'pending' | 'failed';
  }> = [];
  @state() private _sharedStateKeys: string[] = [];
  @state() private _integrationNavLinks: Array<{
    panel: string;
    label: string;
    description: string;
    icon: string;
  }> = [];

  private _initIntegration() {
    this._sharedStateKeys = [
      'selectedThreats', 'activeIncidentId', 'riskScore',
      'complianceStatus', 'assetFilter', 'timeRange',
      'userContext', 'severityFilter', 'teamAssignments',
      'pipelineStatus', 'alertCorrelationId', 'vulnerabilityScope',
    ];
    this._integrationNavLinks = [
      { panel: 'threat-model', label: 'Threat Model', description: 'View STRIDE analysis', icon: '🛡' },
      { panel: 'incident-response', label: 'Incident Timeline', description: 'Active incidents', icon: '📅' },
      { panel: 'vulnerability-mgmt', label: 'Vulnerability Scanner', description: 'Scan results', icon: '🔍' },
      { panel: 'compliance-dashboard', label: 'Compliance Map', description: 'Framework coverage', icon: '✅' },
      { panel: 'soc-workflow', label: 'SOC Workflow', description: 'Analyst queue', icon: '📋' },
      { panel: 'risk-dashboard', label: 'Risk Register', description: 'Risk assessment', icon: '⚠' },
    ];
    this._eventLog = [
      { id: 'e1', source: 'Alert System', target: 'Incident Timeline', eventType: 'alert.created', payload: 'New critical alert detected', timestamp: '2024-02-15T14:32:00', status: 'delivered' },
      { id: 'e2', source: 'Threat Intel', target: 'Alert Correlation', eventType: 'ioc.matched', payload: '3 IOCs matched active alerts', timestamp: '2024-02-15T14:31:00', status: 'delivered' },
      { id: 'e3', source: 'Vulnerability Scanner', target: 'Risk Dashboard', eventType: 'vuln.critical', payload: 'New CVE-2024-XXXX detected', timestamp: '2024-02-15T14:30:00', status: 'pending' },
      { id: 'e4', source: 'Pipeline', target: 'Metrics Dashboard', eventType: 'pipeline.completed', payload: 'Data ingestion pipeline completed', timestamp: '2024-02-15T14:28:00', status: 'delivered' },
      { id: 'e5', source: 'Compliance Check', target: 'Board Report', eventType: 'compliance.drift', payload: 'CIS benchmark drift detected', timestamp: '2024-02-15T14:25:00', status: 'failed' },
    ];
    this._integrationEnabled = true;
  }

  private _publishEvent(source: string, target: string, eventType: string, payload: string) {
    const event = {
      id: 'e' + (this._eventLog.length + 1),
      source, target, eventType, payload,
      timestamp: new Date().toISOString(),
      status: 'delivered' as const,
    };
    this._eventLog = [event, ...this._eventLog].slice(0, 20);
  }

  private _renderIntegrationPanel(): any {
    if (!this._integrationEnabled) return nothing;
    return html`
      <div style="margin-top:12px;padding:12px;background:#111827;border:1px solid #374151;border-radius:8px">
        <div style="font-weight:700;font-size:13px;color:#f9fafb;margin-bottom:10px">Cross-Panel Integration</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div style="padding:8px;background:#1f2937;border-radius:6px">
            <div style="font-size:10px;font-weight:600;color:#60a5fa;margin-bottom:6px">Navigation Links</div>
            ${this._integrationNavLinks.map(link => html`
              <div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:10px;cursor:pointer" @click=${() => this._publishEvent(this.panelId, link.panel, 'nav.requested', link.description)}>
                <span>${link.icon}</span>
                <div>
                  <div style="color:#f9fafb;font-weight:500">${link.label}</div>
                  <div style="color:#6b7280;font-size:8px">${link.description}</div>
                </div>
              </div>
            `)}
          </div>
          <div style="padding:8px;background:#1f2937;border-radius:6px">
            <div style="font-size:10px;font-weight:600;color:#60a5fa;margin-bottom:6px">Event Stream</div>
            ${this._eventLog.slice(0, 5).map(ev => html`
              <div style="display:flex;align-items:center;gap:4px;padding:3px 0;border-bottom:1px solid #111827;font-size:9px">
                <span style="width:6px;height:6px;border-radius:50%;background:${ev.status === 'delivered' ? '#34d399' : ev.status === 'pending' ? '#fbbf24' : '#f87171'}"></span>
                <span style="color:#60a5fa">${ev.source}</span>
                <span style="color:#4b5563">→</span>
                <span style="color:#d1d5db">${ev.target}</span>
                <span style="color:#6b7280;margin-left:auto">${ev.eventType}</span>
              </div>
            `)}
          </div>
        </div>
        <div style="margin-top:8px;padding:6px;background:#1f2937;border-radius:6px">
          <div style="font-size:10px;font-weight:600;color:#60a5fa;margin-bottom:4px">Shared State (${this._sharedStateKeys.length} keys)</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px">
            ${this._sharedStateKeys.map(key => html`
              <span style="padding:2px 8px;background:#111827;border-radius:4px;font-size:8px;color:#9ca3af;border:1px solid #374151">${key}</span>
            `)}
          </div>
        </div>
      </div>
    `;
  }

  private _aaGetAllSubTabs(): {key:string;label:string}[] {
    return [
      {key:'scenario', label:'Simulation'},
      {key:'timeseries', label:'Trends'},
      {key:'rbac', label:'Access Control'},
      {key:'reporting', label:'Reports'},
      {key:'a11y', label:'Accessibility'},
    ];
  }

  private _aaRenderSubPanel(): any {
    switch (this._aaActiveSubTab) {
      case 'scenario': return this._aaRenderScenarioEngine();
      case 'timeseries': return this._aaRenderTimeSeries();
      case 'rbac': return this._aaRenderRBAC();
      case 'reporting': return this._aaRenderReporting();
      case 'a11y': return this._aaRenderAccessibility();
      default: return nothing;
    }
  }

  private _aaRenderTabBar(): any {
    return html`
      <div style="display:flex;gap:4px;margin-bottom:12px;border-bottom:1px solid #2a2d3a;padding-bottom:8px;flex-wrap:wrap" role="tablist" aria-label="Extended panel features">
        ${this._aaGetAllSubTabs().map(t => html`
          <button class="tab ${this._aaActiveSubTab === t.key ? 'active' : ''}" @click=${() => { this._aaActiveSubTab = t.key; }} role="tab" aria-selected=${this._aaActiveSubTab === t.key}>${t.label}</button>
        `)}
      </div>
      <div role="tabpanel" aria-labelledby="aa-tab-${this._aaActiveSubTab}">
        ${this._aaRenderSubPanel()}
      </div>
    `;
  }

  }
