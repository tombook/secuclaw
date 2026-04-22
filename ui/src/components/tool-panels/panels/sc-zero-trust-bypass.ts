/**
 * sc-zero-trust-bypass.ts - Zero Trust Policy Tester (Security Ops Dark Capability)
 * Zero trust architecture assessment, policy gap analysis, bypass vector testing,
 * segmentation validation, identity trust evaluation, compliance scoring
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';

type ZTComponent = 'identity' | 'device' | 'network' | 'application' | 'data';
type BypassCategory = 'credential-theft' | 'token-forgery' | 'device-spoof' | 'lateral-movement' | 'privilege-escalation' | 'session-hijack' | 'api-abuse' | 'supply-chain';
type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'warning' | 'skipped';
type TrustLevel = 'zero' | 'low' | 'medium' | 'high' | 'full';

interface ZTPolicy {
  id: string; name: string; component: ZTComponent; description: string; enabled: boolean;
  enforcement: 'none' | 'monitor' | 'block'; trustLevel: TrustLevel;
}

interface BypassVector {
  id: string; name: string; category: BypassCategory; description: string;
  technique: string; mitreId: string; complexity: 'low' | 'medium' | 'high' | 'expert';
  impact: 'low' | 'medium' | 'high' | 'critical'; detectability: number;
  affectedPolicies: string[]; steps: string[]; mitigations: string[];
}

interface TestResult {
  id: string; vectorId: string; status: TestStatus; startedAt: string; completedAt: string;
  output: string[]; riskScore: number; details: string;
}

interface AssessmentConfig {
  targetEnv: string; environmentType: 'on-prem' | 'cloud' | 'hybrid' | 'saas';
  identityProvider: 'ad' | 'azure-ad' | 'okta' | 'ldap' | 'custom';
  mfaEnabled: boolean; deviceTrustEnabled: boolean; microSegEnabled: boolean;
  ztProvider: string; testScope: ZTComponent[];
}

interface SegmentRule {
  id: string; source: string; destination: string; port: string; protocol: string;
  allowed: boolean; enforced: boolean; risk: number;
}

const DEFAULT_POLICIES: ZTPolicy[] = [
  { id: 'p1', name: 'Multi-Factor Authentication', component: 'identity', description: 'Require MFA for all access regardless of location', enabled: true, enforcement: 'block', trustLevel: 'high' },
  { id: 'p2', name: 'Continuous Authentication', component: 'identity', description: 'Re-evaluate user trust on every request', enabled: false, enforcement: 'monitor', trustLevel: 'medium' },
  { id: 'p3', name: 'Device Health Check', component: 'device', description: 'Validate device compliance before access', enabled: true, enforcement: 'block', trustLevel: 'high' },
  { id: 'p4', name: 'Device Certificate Validation', component: 'device', description: 'Require valid device certificates for network access', enabled: false, enforcement: 'monitor', trustLevel: 'low' },
  { id: 'p5', name: 'Micro-Segmentation', component: 'network', description: 'Enforce east-west traffic policies between segments', enabled: true, enforcement: 'block', trustLevel: 'high' },
  { id: 'p6', name: 'Network Access Control (NAC)', component: 'network', description: 'Validate endpoint compliance before network admission', enabled: true, enforcement: 'block', trustLevel: 'medium' },
  { id: 'p7', name: 'Application-Level Access', component: 'application', description: 'Per-application access policies with least privilege', enabled: false, enforcement: 'monitor', trustLevel: 'low' },
  { id: 'p8', name: 'API Gateway Protection', component: 'application', description: 'API rate limiting, auth, and input validation', enabled: true, enforcement: 'block', trustLevel: 'medium' },
  { id: 'p9', name: 'Data Classification Enforcement', component: 'data', description: 'Enforce access controls based on data sensitivity', enabled: false, enforcement: 'monitor', trustLevel: 'low' },
  { id: 'p10', name: 'DLP Integration', component: 'data', description: 'Prevent data exfiltration across trust boundaries', enabled: true, enforcement: 'block', trustLevel: 'medium' },
];

const BYPASS_VECTORS: BypassVector[] = [
  { id: 'bv1', name: 'Kerberoasting', category: 'credential-theft', description: 'Extract service account tickets and crack offline', technique: 'T1558.003', mitreId: 'T1558.003', complexity: 'medium', impact: 'high', detectability: 45, affectedPolicies: ['p1', 'p2'], steps: ['Enumerate service accounts via LDAP', 'Request service tickets (TGS)', 'Extract tickets from memory', 'Crack offline with hashcat'], mitigations: ['Use Group Managed Service Accounts', 'Enforce AES encryption for Kerberos', 'Monitor Kerberos event logs'] },
  { id: 'bv2', name: 'Pass-the-Hash', category: 'credential-theft', description: 'Use NTLM hash to authenticate without knowing password', technique: 'T1550.002', mitreId: 'T1550.002', complexity: 'low', impact: 'critical', detectability: 35, affectedPolicies: ['p1', 'p2'], steps: ['Dump LSASS memory for NTLM hashes', 'Inject hash into authentication process', 'Access resources with stolen hash'], mitigations: ['Enable Credential Guard', 'Monitor LSASS access', 'Deploy LAPS for local admin passwords'] },
  { id: 'bv3', name: 'Device Identity Spoofing', category: 'device-spoof', description: 'Forge device certificates to bypass NAC and device trust', technique: 'T1112', mitreId: 'T1112', complexity: 'high', impact: 'critical', detectability: 55, affectedPolicies: ['p3', 'p4', 'p6'], steps: ['Extract device certificate from compromised endpoint', 'Clone certificate to attacker device', 'Register spoofed device with NAC', 'Access network with spoofed identity'], mitigations: ['Short certificate lifetimes', 'Device attestation with TPM', 'Certificate pinning and OCSP checks'] },
  { id: 'bv4', name: 'JWT Token Manipulation', category: 'token-forgery', description: 'Forge or manipulate JWT tokens to escalate privileges', technique: 'T1134.003', mitreId: 'T1134.003', complexity: 'medium', impact: 'high', detectability: 40, affectedPolicies: ['p1', 'p2', 'p7'], steps: ['Intercept JWT from authentication flow', 'Modify claims (role, groups)', 'Re-sign with leaked signing key or alg:none', 'Access protected resources with forged token'], mitigations: ['Strong signing key management', 'Token expiration and rotation', 'Validate all claims server-side'] },
  { id: 'bv5', name: 'Segmentation Bypass via DNS', category: 'lateral-movement', description: 'Use DNS to exfiltrate data across micro-segment boundaries', technique: 'T1071.004', mitreId: 'T1071.004', complexity: 'medium', impact: 'high', detectability: 50, affectedPolicies: ['p5'], steps: ['Encode data as DNS queries', 'Send queries to attacker-controlled DNS server', 'DNS traffic may bypass east-west rules', 'Receive commands via DNS TXT responses'], mitigations: ['DNS monitoring and filtering', 'Block DNS to unauthorized servers', 'Deploy DNS security solutions'] },
  { id: 'bv6', name: 'Session Token Replay', category: 'session-hijack', description: 'Replay stolen session tokens to bypass continuous authentication', technique: 'T1189', mitreId: 'T1189', complexity: 'low', impact: 'medium', detectability: 55, affectedPolicies: ['p1', 'p2'], steps: ['Capture session token via XSS or network sniffing', 'Replay token from different IP/device', 'Access session without re-authentication'], mitigations: ['Bind sessions to IP and device fingerprint', 'Short session timeouts', 'Implement continuous session validation'] },
  { id: 'bv7', name: 'API Key Extraction', category: 'api-abuse', description: 'Extract API keys from source code or environment to bypass application access controls', technique: 'T1525', mitreId: 'T1525', complexity: 'low', impact: 'high', detectability: 30, affectedPolicies: ['p7', 'p8'], steps: ['Scan source code repos for hardcoded keys', 'Check environment variables and config files', 'Extract keys from CI/CD pipeline', 'Use keys to access APIs directly'], mitigations: ['Secret scanning in CI/CD', 'Use secret management (Vault)', 'Rotate keys regularly', 'API key scope restrictions'] },
  { id: 'bv8', name: 'Supply Chain Dependency Attack', category: 'supply-chain', description: 'Compromise trusted software dependency to bypass all trust controls', technique: 'T1195.002', mitreId: 'T1195.002', complexity: 'expert', impact: 'critical', detectability: 15, affectedPolicies: ['p3', 'p5', 'p8'], steps: ['Identify target software dependencies', 'Compromise package registry or maintainership', 'Inject malicious code into update', 'Trusted software installs backdoor'], mitigations: ['Software Bill of Materials (SBOM)', 'Package integrity verification', 'Dependency scanning', 'Least privilege for build systems'] },
];

const SEGMENT_RULES: SegmentRule[] = [
  { id: 'sr1', source: '10.0.1.0/24', destination: '10.0.2.0/24', port: '443', protocol: 'TCP', allowed: true, enforced: true, risk: 10 },
  { id: 'sr2', source: '10.0.1.0/24', destination: '10.0.2.0/24', port: '445', protocol: 'TCP', allowed: false, enforced: true, risk: 5 },
  { id: 'sr3', source: '10.0.1.0/24', destination: '10.0.3.0/24', port: '3389', protocol: 'TCP', allowed: false, enforced: false, risk: 85 },
  { id: 'sr4', source: '10.0.1.0/24', destination: '10.0.4.0/24', port: '*', protocol: 'TCP', allowed: true, enforced: false, risk: 75 },
  { id: 'sr5', source: '10.0.2.0/24', destination: '10.0.5.0/24', port: '5432', protocol: 'TCP', allowed: true, enforced: true, risk: 15 },
  { id: 'sr6', source: '10.0.3.0/24', destination: '10.0.1.0/24', port: '22', protocol: 'TCP', allowed: true, enforced: true, risk: 20 },
  { id: 'sr7', source: '10.0.1.0/24', destination: '0.0.0.0/0', port: '53', protocol: 'UDP', allowed: true, enforced: false, risk: 65 },
  { id: 'sr8', source: '10.0.3.0/24', destination: '10.0.4.0/24', port: '8080', protocol: 'TCP', allowed: true, enforced: false, risk: 55 },
];

@customElement('sc-zero-trust-bypass')
export class ScZeroTrustBypass extends LitElement {
  @property({ type: String }) panelId = 'zero-trust-bypass';
  @state() private _config: AssessmentConfig = {
    targetEnv: '', environmentType: 'hybrid', identityProvider: 'azure-ad',
    mfaEnabled: true, deviceTrustEnabled: false, microSegEnabled: true,
    ztProvider: '', testScope: ['identity', 'device', 'network', 'application', 'data'],
  };
  @state() private _policies: ZTPolicy[] = [...DEFAULT_POLICIES];
  @state() private _results: TestResult[] = [];
  @state() private _output: string[] = [];
  @state() private _progress = 0;
  @state() private _testing = false;
  @state() private _activeTab: 'policies' | 'vectors' | 'segmentation' | 'test' | 'results' | 'score' = 'policies';
  @state() private _expandedVector: string | null = null;

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
    .btn-secondary { background: #374151; color: #d1d5db; }
    .btn-sm { padding: 4px 10px; font-size: 11px; }
    .btn-row { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    label { font-size: 12px; color: #9ca3af; font-weight: 500; }
    input, select { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 6px; padding: 8px 12px; color: #e2e8f0; font-size: 13px; outline: none; font-family: inherit; }
    input:focus, select:focus { border-color: #3b82f6; }
    .policy-card { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 12px; margin-bottom: 8px; display: flex; align-items: center; gap: 12px; transition: all 0.2s; }
    .policy-card:hover { border-color: #3b82f6; }
    .policy-card.disabled { opacity: 0.5; }
    .policy-toggle { position: relative; width: 40px; height: 22px; flex-shrink: 0; }
    .policy-toggle input { opacity: 0; width: 0; height: 0; }
    .policy-slider { position: absolute; cursor: pointer; inset: 0; background: #374151; border-radius: 11px; transition: 0.3s; }
    .policy-slider::before { content: ''; position: absolute; height: 16px; width: 16px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.3s; }
    .policy-toggle input:checked + .policy-slider { background: #3b82f6; }
    .policy-toggle input:checked + .policy-slider::before { transform: translateX(18px); }
    .policy-info { flex: 1; }
    .policy-name { font-weight: 600; font-size: 13px; }
    .policy-desc { font-size: 11px; color: #9ca3af; margin-top: 2px; }
    .policy-meta { display: flex; gap: 8px; margin-top: 4px; }
    .tag { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #374151; color: #d1d5db; }
    .enforce-block { background: #1e3a2f; color: #34d399; }
    .enforce-monitor { background: #3a3a1e; color: #fbbf24; }
    .enforce-none { background: #3a1e1e; color: #f87171; }
    .vector-card { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 12px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s; }
    .vector-card:hover { border-color: #3b82f6; }
    .vector-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .vector-name { font-weight: 600; font-size: 13px; flex: 1; }
    .vector-desc { font-size: 12px; color: #9ca3af; margin-bottom: 6px; }
    .vector-detail { background: #0f1117; border-radius: 6px; padding: 10px; margin-top: 8px; font-size: 12px; }
    .vector-steps { margin-bottom: 8px; }
    .vector-step { padding: 3px 0; color: #d1d5db; }
    .vector-step-num { color: #60a5fa; font-weight: 600; margin-right: 6px; }
    .segment-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .segment-table th { text-align: left; padding: 8px 10px; background: #1a1d27; color: #9ca3af; font-weight: 600; border-bottom: 1px solid #2a2d3a; }
    .segment-table td { padding: 8px 10px; border-bottom: 1px solid #1a1d27; }
    .risk-high { color: #f87171; }
    .risk-med { color: #fbbf24; }
    .risk-low { color: #34d399; }
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
    .stat { background: #1a1d27; border-radius: 8px; padding: 12px; text-align: center; }
    .stat-value { font-size: 22px; font-weight: 700; }
    .stat-label { font-size: 10px; color: #9ca3af; margin-top: 2px; }
    .progress-bar { width: 100%; height: 8px; background: #1a1d27; border-radius: 4px; overflow: hidden; margin: 12px 0; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); border-radius: 4px; transition: width 0.5s; }
    .output-box { background: #0a0c10; border: 1px solid #1a1d27; border-radius: 8px; padding: 12px; font-family: 'JetBrains Mono', monospace; font-size: 12px; line-height: 1.6; max-height: 300px; overflow-y: auto; white-space: pre-wrap; }
    .output-info { color: #60a5fa; }
    .output-success { color: #34d399; }
    .output-error { color: #f87171; }
    .output-warn { color: #fbbf24; }
    .score-ring { width: 160px; height: 160px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 20px auto; position: relative; }
    .score-value { font-size: 42px; font-weight: 700; }
    .score-label { font-size: 12px; color: #9ca3af; text-align: center; margin-top: 8px; }
    .score-breakdown { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-top: 16px; }
    .score-item { background: #1a1d27; border-radius: 8px; padding: 12px; text-align: center; }
    .score-item-value { font-size: 20px; font-weight: 700; }
    .score-item-label { font-size: 10px; color: #9ca3af; margin-top: 2px; }
    .empty-state { text-align: center; padding: 40px; color: #6b7280; }
    @media (max-width: 768px) {
      .form-grid { grid-template-columns: 1fr; }
      .stat-grid { grid-template-columns: repeat(2, 1fr); }
      .score-breakdown { grid-template-columns: repeat(3, 1fr); }
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

  private _togglePolicy(policy: ZTPolicy, enabled: boolean): void {
    this._policies = this._policies.map(p => p.id === policy.id ? { ...p, enabled } : p);
  }

  private _runBypassTest(): void {
    if (this._testing) return;
    this._testing = true;
    this._results = [];
    this._output = [];
    this._progress = 0;
    this._activeTab = 'test';
    this._output.push(`[*] Zero Trust Bypass Assessment Started`);
    this._output.push(`[*] Environment: ${this._config.environmentType} | IdP: ${this._config.identityProvider}`);
    this._output.push(`[*] MFA: ${this._config.mfaEnabled ? 'Enabled' : 'DISABLED'} | Device Trust: ${this._config.deviceTrustEnabled ? 'Enabled' : 'DISABLED'}`);
    this._output.push(`[*] Micro-Segmentation: ${this._config.microSegEnabled ? 'Enabled' : 'DISABLED'}`);
    this._output.push('');

    const enabledPolicies = this._policies.filter(p => p.enabled);
    let vectorIdx = 0;

    const testVector = () => {
      if (vectorIdx >= BYPASS_VECTORS.length) {
        this._testing = false;
        this._output.push('');
        this._output.push(`[+] Assessment Complete`);
        const passed = this._results.filter(r => r.status === 'passed').length;
        const failed = this._results.filter(r => r.status === 'failed').length;
        const warned = this._results.filter(r => r.status === 'warning').length;
        this._output.push(`[*] Results: ${passed} passed, ${warned} warnings, ${failed} bypassed`);
        this.requestUpdate();
        return;
      }

      const vector = BYPASS_VECTORS[vectorIdx];
      const affectedPolicies = vector.affectedPolicies.map(pid => enabledPolicies.find(p => p.id === pid)).filter(Boolean) as ZTPolicy[];
      const hasBlock = affectedPolicies.some(p => p.enforcement === 'block');
      const hasMonitor = affectedPolicies.some(p => p.enforcement === 'monitor');

      this._output.push(`[*] Testing: ${vector.name} (${vector.technique})`);
      this._output.push(`    Category: ${vector.category} | Complexity: ${vector.complexity}`);

      let status: TestStatus;
      let riskScore: number;

      if (hasBlock && this._config.mfaEnabled) {
        const bypassChance = vector.complexity === 'expert' ? 0.3 : vector.complexity === 'high' ? 0.4 : 0.15;
        if (Math.random() < bypassChance) {
          status = 'warning';
          riskScore = 40 + Math.floor(Math.random() * 30);
          this._output.push(`    [!] PARTIAL BYPASS - Policy enforced but advanced technique may circumvent`);
        } else {
          status = 'passed';
          riskScore = 10 + Math.floor(Math.random() * 15);
          this._output.push(`    [+] BLOCKED - Active policies prevent this bypass`);
        }
      } else if (hasMonitor) {
        status = 'warning';
        riskScore = 50 + Math.floor(Math.random() * 25);
        this._output.push(`    [!] DETECTED BUT NOT BLOCKED - Monitor mode only`);
      } else {
        status = 'failed';
        riskScore = 70 + Math.floor(Math.random() * 25);
        this._output.push(`    [-] BYPASSED - No active policy blocks this vector`);
      }

      if (status === 'failed' || status === 'warning') {
        this._output.push(`    Impact: ${vector.impact} | Mitigation: ${vector.mitigations[0]}`);
      }

      this._results = [...this._results, {
        id: 'TR-' + Date.now().toString(36), vectorId: vector.id, status,
        startedAt: new Date().toISOString(), completedAt: new Date().toISOString(),
        output: [], riskScore, details: vector.description,
      }];

      this._progress = Math.round(((vectorIdx + 1) / BYPASS_VECTORS.length) * 100);
      this.requestUpdate();
      vectorIdx++;
      setTimeout(testVector, 400 + Math.random() * 300);
    };

    setTimeout(testVector, 500);
  }

  private _getOverallScore(): number {
    const enabledCount = this._policies.filter(p => p.enabled).length;
    const blockCount = this._policies.filter(p => p.enabled && p.enforcement === 'block').length;
    let score = (enabledCount / this._policies.length) * 50 + (blockCount / this._policies.length) * 30;
    if (this._config.mfaEnabled) score += 10;
    if (this._config.deviceTrustEnabled) score += 5;
    if (this._config.microSegEnabled) score += 5;
    return Math.min(100, Math.round(score));
  }

  private _getComponentScore(component: ZTComponent): number {
    const policies = this._policies.filter(p => p.component === component);
    if (policies.length === 0) return 0;
    const enabled = policies.filter(p => p.enabled).length;
    const blocked = policies.filter(p => p.enabled && p.enforcement === 'block').length;
    return Math.round((enabled / policies.length) * 60 + (blocked / policies.length) * 40);
  }

  private _exportReport(): void {
    const report = {
      config: this._config, policies: this._policies,
      overallScore: this._getOverallScore(),
      componentScores: {
        identity: this._getComponentScore('identity'),
        device: this._getComponentScore('device'),
        network: this._getComponentScore('network'),
        application: this._getComponentScore('application'),
        data: this._getComponentScore('data'),
      },
      testResults: this._results.map(r => {
        const vector = BYPASS_VECTORS.find(v => v.id === r.vectorId);
        return { ...r, vectorName: vector?.name, category: vector?.category, impact: vector?.impact };
      }),
      segmentRules: SEGMENT_RULES,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `zt-assessment-${Date.now()}.json`; a.click();
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
    const blob = new Blob(['zero-trust-bypass export'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'zero-trust-bypass-export.' + (format === 'markdown' ? 'md' : format); a.click();
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
    const overallScore = this._getOverallScore();
    const scoreColor = overallScore >= 80 ? '#34d399' : overallScore >= 60 ? '#fbbf24' : '#f87171';
    const scoreRingColor = overallScore >= 80 ? '#10b981' : overallScore >= 60 ? '#f59e0b' : '#dc2626';

    return html`
      <div class="panel">
        <div class="header">
          <div class="title"><span>&#x1F6E1;</span> Zero Trust Policy Tester</div>
          <span style="font-size:14px;font-weight:700;color:${scoreColor}">Score: ${overallScore}/100</span>
        </div>
        <div class="tabs">
          <button class="tab ${this._activeTab === 'policies' ? 'active' : ''}" @click=${() => { this._activeTab = 'policies'; }}>Policies</button>
          <button class="tab ${this._activeTab === 'vectors' ? 'active' : ''}" @click=${() => { this._activeTab = 'vectors'; }}>Bypass Vectors</button>
          <button class="tab ${this._activeTab === 'segmentation' ? 'active' : ''}" @click=${() => { this._activeTab = 'segmentation'; }}>Segmentation</button>
          <button class="tab ${this._activeTab === 'test' ? 'active' : ''}" @click=${() => { this._activeTab = 'test'; }}>Test</button>
          <button class="tab ${this._activeTab === 'results' ? 'active' : ''}" @click=${() => { this._activeTab = 'results'; }}>Results</button>
          <button class="tab ${this._activeTab === 'score' ? 'active' : ''}" @click=${() => { this._activeTab = 'score'; }}>Score</button>
        </div>

        ${this._activeTab === 'policies' ? html`
          <div class="form-grid" style="margin-bottom:16px">
            <div class="form-group"><label>Environment Type</label>
              <select .value=${this._config.environmentType} @change=${(e: Event) => { this._config.environmentType = (e.target as HTMLSelectElement).value as any; }}>
                <option value="on-prem">On-Premises</option><option value="cloud">Cloud</option><option value="hybrid">Hybrid</option><option value="saas">SaaS</option>
              </select>
            </div>
            <div class="form-group"><label>Identity Provider</label>
              <select .value=${this._config.identityProvider} @change=${(e: Event) => { this._config.identityProvider = (e.target as HTMLSelectElement).value as any; }}>
                <option value="ad">Active Directory</option><option value="azure-ad">Azure AD</option><option value="okta">Okta</option><option value="ldap">LDAP</option><option value="custom">Custom</option>
              </select>
            </div>
          </div>
          <div style="display:flex;gap:24px;margin-bottom:16px;flex-wrap:wrap">
            <label style="display:flex;align-items:center;gap:6px;font-size:13px"><input type="checkbox" ?checked=${this._config.mfaEnabled} @change=${(e: Event) => { this._config.mfaEnabled = (e.target as HTMLInputElement).checked; }} style="accent-color:#3b82f6"> MFA Enforced</label>
            <label style="display:flex;align-items:center;gap:6px;font-size:13px"><input type="checkbox" ?checked=${this._config.deviceTrustEnabled} @change=${(e: Event) => { this._config.deviceTrustEnabled = (e.target as HTMLInputElement).checked; }} style="accent-color:#3b82f6"> Device Trust</label>
            <label style="display:flex;align-items:center;gap:6px;font-size:13px"><input type="checkbox" ?checked=${this._config.microSegEnabled} @change=${(e: Event) => { this._config.microSegEnabled = (e.target as HTMLInputElement).checked; }} style="accent-color:#3b82f6"> Micro-Segmentation</label>
          </div>
          <div style="font-weight:600;margin-bottom:8px">Zero Trust Policies:</div>
          ${this._policies.map(p => html`
            <div class="policy-card ${p.enabled ? '' : 'disabled'}">
              <label class="policy-toggle">
                <input type="checkbox" ?checked=${p.enabled} @change=${(e: Event) => { this._togglePolicy(p, (e.target as HTMLInputElement).checked); }}>
                <span class="policy-slider"></span>
              </label>
              <div class="policy-info">
                <div class="policy-name">${p.name}</div>
                <div class="policy-desc">${p.description}</div>
                <div class="policy-meta">
                  <span class="tag">${p.component}</span>
                  <span class="tag enforce-${p.enforcement}">${p.enforcement}</span>
                  <span style="font-size:10px;color:#6b7280">Trust: ${p.trustLevel}</span>
                </div>
              </div>
            </div>
          `)}
        ` : nothing}

        ${this._activeTab === 'vectors' ? html`
          <div style="font-weight:600;margin-bottom:8px">Known Bypass Vectors (${BYPASS_VECTORS.length})</div>
          ${BYPASS_VECTORS.map(v => html`
            <div class="vector-card" @click=${() => { this._expandedVector = this._expandedVector === v.id ? null : v.id; }}>
              <div class="vector-header">
                <span class="vector-name">${v.name}</span>
                <span class="tag">${v.category}</span>
                <span style="font-size:10px;color:#6b7280">${v.technique}</span>
                <span style="font-size:11px;color:${v.impact === 'critical' ? '#f87171' : v.impact === 'high' ? '#f97316' : '#fbbf24'}">${v.impact}</span>
              </div>
              <div class="vector-desc">${v.description} | Complexity: ${v.complexity} | Detectability: ${v.detectability}%</div>
              ${this._expandedVector === v.id ? html`
                <div class="vector-detail">
                  <div style="font-weight:600;margin-bottom:4px">Attack Steps:</div>
                  <div class="vector-steps">${v.steps.map((s, i) => html`<div class="vector-step"><span class="vector-step-num">${i + 1}.</span>${s}</div>`)}</div>
                  <div style="font-weight:600;margin-bottom:4px">Mitigations:</div>
                  ${v.mitigations.map(m => html`<div style="font-size:11px;color:#34d399;padding:2px 0">+ ${m}</div>`)}
                  <div style="margin-top:6px;font-size:10px;color:#6b7280">Affected Policies: ${v.affectedPolicies.map(pid => this._policies.find(p => p.id === pid)?.name || pid).join(', ')}</div>
                </div>
              ` : nothing}
            </div>
          `)}
        ` : nothing}

        ${this._activeTab === 'segmentation' ? html`
          <div style="font-weight:600;margin-bottom:8px">Network Segmentation Rules</div>
          <div style="margin-bottom:12px;font-size:12px;color:#9ca3af">Review and identify gaps in micro-segmentation enforcement</div>
          <table class="segment-table">
            <thead><tr><th>Source</th><th>Destination</th><th>Port</th><th>Protocol</th><th>Allowed</th><th>Enforced</th><th>Risk</th></tr></thead>
            <tbody>${SEGMENT_RULES.map(r => html`
              <tr>
                <td style="font-family:'JetBrains Mono',monospace;font-size:11px">${r.source}</td>
                <td style="font-family:'JetBrains Mono',monospace;font-size:11px">${r.destination}</td>
                <td>${r.port}</td>
                <td>${r.protocol}</td>
                <td><span style="color:${r.allowed ? '#34d399' : '#f87171'}">${r.allowed ? 'Yes' : 'No'}</span></td>
                <td><span style="color:${r.enforced ? '#34d399' : '#f87171'};font-weight:600">${r.enforced ? 'Yes' : 'NO'}</span></td>
                <td class="${r.risk > 60 ? 'risk-high' : r.risk > 30 ? 'risk-med' : 'risk-low'}" style="font-weight:600">${r.risk}%</td>
              </tr>
            `)}</tbody>
          </table>
          <div style="margin-top:12px;font-size:12px;color:#f87171">${SEGMENT_RULES.filter(r => !r.enforced && r.allowed).length} unenforced allowed rules - HIGH RISK</div>
        ` : nothing}

        ${this._activeTab === 'test' ? html`
          <div class="btn-row">
            <button class="btn btn-primary" ?disabled=${this._testing} @click=${this._runBypassTest}>
              ${this._testing ? 'Testing...' : 'Run Full Bypass Assessment'}
            </button>
          </div>
          ${this._testing ? html`<div class="progress-bar"><div class="progress-fill" style="width:${this._progress}%"></div></div>` : nothing}
          ${this._output.length > 0 ? html`<div class="output-box">${this._output.map(l => html`<div class="${l.startsWith('[+]') ? 'output-success' : l.startsWith('[-]') ? 'output-error' : l.startsWith('[!]') ? 'output-warn' : 'output-info'}">${l}</div>`)}</div>` : html`<div class="empty-state">Configure policies and run assessment</div>`}
        ` : nothing}

        ${this._activeTab === 'results' ? html`
          ${this._results.length === 0 ? html`<div class="empty-state">Run assessment first</div>` : html`
            <div class="stat-grid">
              <div class="stat"><div class="stat-value" style="color:#34d399">${this._results.filter(r => r.status === 'passed').length}</div><div class="stat-label">Blocked</div></div>
              <div class="stat"><div class="stat-value" style="color:#fbbf24">${this._results.filter(r => r.status === 'warning').length}</div><div class="stat-label">Warnings</div></div>
              <div class="stat"><div class="stat-value" style="color:#f87171">${this._results.filter(r => r.status === 'failed').length}</div><div class="stat-label">Bypassed</div></div>
              <div class="stat"><div class="stat-value">${this._results.length}</div><div class="stat-label">Total Tests</div></div>
            </div>
            ${this._results.map(r => {
              const vector = BYPASS_VECTORS.find(v => v.id === r.vectorId);
              return html`<div style="background:#1a1d27;border:1px solid #2a2d3a;border-radius:8px;padding:10px 12px;margin-bottom:6px;border-left:3px solid ${r.status === 'passed' ? '#34d399' : r.status === 'warning' ? '#fbbf24' : '#f87171'}">
                <div style="display:flex;align-items:center;gap:8px">
                  <span style="font-weight:600;font-size:13px">${vector?.name || r.vectorId}</span>
                  <span class="tag" style="background:${r.status === 'passed' ? '#1e3a2f' : r.status === 'warning' ? '#3a3a1e' : '#3a1e1e'};color:${r.status === 'passed' ? '#34d399' : r.status === 'warning' ? '#fbbf24' : '#f87171'}">${r.status.toUpperCase()}</span>
                  <span style="font-size:11px;color:#9ca3af">Risk: ${r.riskScore}%</span>
                </div>
              </div>`;
            })}
          `}
        ` : nothing}

        ${this._activeTab === 'score' ? html`
          <div class="score-ring" style="background:conic-gradient(${scoreRingColor} ${overallScore * 3.6}deg, #1a1d27 0deg)">
            <div style="width:140px;height:140px;border-radius:50%;background:#0f1117;display:flex;align-items:center;justify-content:center;flex-direction:column">
              <div class="score-value" style="color:${scoreColor}">${overallScore}</div>
            </div>
          </div>
          <div class="score-label">Overall Zero Trust Maturity Score</div>
          <div class="score-breakdown">
            ${(['identity', 'device', 'network', 'application', 'data'] as ZTComponent[]).map(c => {
              const s = this._getComponentScore(c);
              return html`<div class="score-item">
                <div class="score-item-value" style="color:${s >= 70 ? '#34d399' : s >= 40 ? '#fbbf24' : '#f87171'}">${s}</div>
                <div class="score-item-label">${c}</div>
              </div>`;
            })}
          </div>
          <div class="btn-row" style="margin-top:16px;justify-content:center">
            <button class="btn btn-secondary" @click=${this._exportReport}>Export Assessment (JSON)</button>
          </div>
        ` : nothing}
      </div>
        ${this._renderRiskGauge()}
        ${this._renderFooter()}
      </div>
    `;
  }
}
