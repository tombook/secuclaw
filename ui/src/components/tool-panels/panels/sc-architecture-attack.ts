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
          </div>

          ${this._activeTab === 'zones' ? this._renderZones() : nothing}
          ${this._activeTab === 'boundaries' ? this._renderBoundaries() : nothing}
          ${this._activeTab === 'surface' ? this._renderSurface() : nothing}
          ${this._activeTab === 'did' ? this._renderDid() : nothing}
          ${this._activeTab === 'remediation' ? this._renderRemediations() : nothing}
          ${this._activeTab === 'report' ? this._renderReport() : nothing}
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
}
