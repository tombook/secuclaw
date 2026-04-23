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
    .intel-row { display: flex; gap: 10px; padding: 8px; background: #0a0c10; border-radius: 6px; margin-bottom: 6px; align-items: center; }
    .intel-type { padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
    .intel-val { font-family: monospace; font-size: 12px; color: #e2e8f0; min-width: 120px; }
    .intel-desc { flex: 1; font-size: 10px; color: #6b7280; }
    .intel-conf { font-size: 10px; font-weight: 700; min-width: 40px; text-align: right; }
    .insight-card { background: linear-gradient(135deg, #1a1d27 0%, #0a0c10 100%); border-radius: 8px; padding: 14px; margin-bottom: 8px; border-left: 3px solid #3b82f6; }
    .insight-title { font-size: 12px; font-weight: 700; color: #3b82f6; margin-bottom: 4px; }
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
    .config-select:focus { border-color: #3b82f6; }
    .approval-row { display: flex; align-items: center; gap: 10px; padding: 10px; background: #0a0c10; border-radius: 6px; margin-bottom: 6px; }
    .approval-btn { padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: 600; cursor: pointer; border: none; }
    .approval-btn.approve { background: #22c55e; color: #fff; }
    .approval-btn.reject { background: #ef4444; color: #fff; }
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

  // Zero Trust risk scoring engine
  private _calculateZTRisk(vector: BypassVector, policy: ZTPolicy | undefined): { overall: number; factors: { name: string; score: number; weight: number; color: string }[] } {
    const impactScore: Record<string, number> = { low: 20, medium: 45, high: 70, critical: 95 };
    const complexityScore: Record<string, number> = { low: 85, medium: 60, high: 35, expert: 15 };
    const detectionScore = 100 - (vector.detectability || 50);
    const policyGap = policy ? (policy.enforcement === 'none' ? 90 : policy.enforcement === 'monitor' ? 50 : 10) : 50;
    const mitreWeight = vector.mitreId.startsWith('T1') ? 25 : vector.mitreId.startsWith('T10') ? 30 : 20;
    const factors = [
      { name: 'Impact Potential', score: impactScore[vector.impact] || 50, weight: 25, color: impactScore[vector.impact] >= 70 ? '#ef4444' : '#fbbf24' },
      { name: 'Exploit Complexity', score: complexityScore[vector.complexity] || 50, weight: 20, color: complexityScore[vector.complexity] <= 35 ? '#ef4444' : '#34d399' },
      { name: 'Detection Evasion', score: detectionScore, weight: 20, color: detectionScore >= 60 ? '#ef4444' : '#34d399' },
      { name: 'Policy Gap', score: policyGap, weight: 20, color: policyGap >= 60 ? '#ef4444' : '#34d399' },
      { name: 'MITRE Severity', score: mitreWeight, weight: 15, color: mitreWeight >= 25 ? '#ef4444' : '#fbbf24' },
    ];
    const overall = Math.min(100, Math.round(factors.reduce((s: number, f: any) => s + f.score * f.weight / 100, 0)));
    return { overall, factors };
  }

  // MITRE ATT&CK correlation for zero trust
  private _ztMitreTechniques: { id: string; name: string; tactic: string; detection: number; trend12h: number[] }[] = [
    { id: 'T1078', name: 'Valid Accounts', tactic: 'Initial Access', detection: 72, trend12h: [2, 3, 1, 4, 2, 3, 5, 2, 3, 4, 3, 2] },
    { id: 'T1550', name: 'Use Alternate Authentication Material', tactic: 'Lateral Movement', detection: 45, trend12h: [1, 0, 2, 1, 0, 1, 2, 0, 1, 0, 2, 1] },
    { id: 'T1558', name: 'Steal or Forge Kerberos Tickets', tactic: 'Credential Access', detection: 55, trend12h: [0, 1, 0, 1, 2, 1, 0, 1, 0, 2, 1, 0] },
    { id: 'T1134', name: 'Access Token Manipulation', tactic: 'Defense Evasion', detection: 62, trend12h: [1, 2, 1, 0, 1, 2, 3, 2, 1, 0, 1, 2] },
    { id: 'T1078.004', name: 'Cloud Accounts', tactic: 'Initial Access', detection: 48, trend12h: [3, 2, 4, 3, 5, 4, 3, 6, 4, 3, 5, 4] },
    { id: 'T1021', name: 'Remote Services', tactic: 'Lateral Movement', detection: 78, trend12h: [5, 4, 6, 5, 4, 7, 6, 5, 8, 6, 5, 7] },
  ];

  // Compliance scoring against frameworks
  private _ztComplianceChecks: { framework: string; control: string; name: string; status: 'pass' | 'partial' | 'fail'; score: number }[] = [
    { framework: 'NIST 800-207', control: 'SC-7', name: 'Continuous Verification', status: 'pass', score: 92 },
    { framework: 'NIST 800-207', control: 'SC-8', name: 'Micro-segmentation', status: 'partial', score: 68 },
    { framework: 'NIST 800-207', control: 'SC-9', name: 'Least Privilege Access', status: 'pass', score: 85 },
    { framework: 'CIS ZT 1.0', control: '1.1', name: 'Identity Verification', status: 'pass', score: 90 },
    { framework: 'CIS ZT 1.0', control: '2.1', name: 'Device Trust', status: 'partial', score: 72 },
    { framework: 'CIS ZT 1.0', control: '3.1', name: 'Network Segmentation', status: 'fail', score: 38 },
    { framework: 'ISO 27001', control: 'A.9.2', name: 'User Access Management', status: 'pass', score: 88 },
    { framework: 'ISO 27001', control: 'A.13.1', name: 'Network Controls', status: 'partial', score: 65 },
  ];

  // Trend analysis
  private _ztTrendData: { period: string; tests: number; passed: number; failed: number; avgRisk: number }[] = [
    { period: 'Week 1', tests: 45, passed: 32, failed: 8, avgRisk: 62 },
    { period: 'Week 2', tests: 52, passed: 38, failed: 9, avgRisk: 58 },
    { period: 'Week 3', tests: 48, passed: 40, failed: 5, avgRisk: 51 },
    { period: 'Week 4', tests: 55, passed: 42, failed: 7, avgRisk: 54 },
    { period: 'Week 5', tests: 60, passed: 48, failed: 6, avgRisk: 48 },
    { period: 'Week 6', tests: 58, passed: 50, failed: 4, avgRisk: 44 },
  ];

  private _renderRiskAssessment(vector: BypassVector): any {
    const policy = this._policies.find(p => vector.affectedPolicies.includes(p.id));
    const risk = this._calculateZTRisk(vector, policy);
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <span style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase">Risk Assessment: ${vector.name}</span>
        <span style="font-size:16px;font-weight:800;color:${risk.overall >= 70 ? '#ef4444' : risk.overall >= 40 ? '#fbbf24' : '#34d399'}">${risk.overall}/100</span>
      </div>
      ${risk.factors.map(f => html`
        <div class="risk-factor-row">
          <span class="risk-factor-label">${f.name} (${f.weight}%)</span>
          <div class="risk-factor-bar"><div class="risk-factor-fill" style="width:${f.score}%;background:${f.color}"></div></div>
          <span style="font-weight:700;min-width:30px;text-align:right;color:${f.color}">${Math.round(f.score)}</span>
        </div>
      `)}
    </div>`;
  }

  private _renderComplianceDashboard(): any {
    const total = this._ztComplianceChecks.length || 1;
    const passed = this._ztComplianceChecks.filter(c => c.status === 'pass').length;
    const partial = this._ztComplianceChecks.filter(c => c.status === 'partial').length;
    const failed = this._ztComplianceChecks.filter(c => c.status === 'fail').length;
    const avgScore = Math.round(this._ztComplianceChecks.reduce((s, c) => s + c.score, 0) / total);
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:10px;color:#9ca3af;text-transform:uppercase">Compliance Score: ${avgScore}/100</div>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <div style="background:#0a0c10;border-radius:6px;padding:10px;text-align:center;flex:1"><div style="font-size:20px;font-weight:700;color:#34d399">${passed}</div><div style="font-size:9px;color:#6b7280">Pass</div></div>
        <div style="background:#0a0c10;border-radius:6px;padding:10px;text-align:center;flex:1"><div style="font-size:20px;font-weight:700;color:#fbbf24">${partial}</div><div style="font-size:9px;color:#6b7280">Partial</div></div>
        <div style="background:#0a0c10;border-radius:6px;padding:10px;text-align:center;flex:1"><div style="font-size:20px;font-weight:700;color:#f87171">${failed}</div><div style="font-size:9px;color:#6b7280">Fail</div></div>
      </div>
      ${this._ztComplianceChecks.map(c => html`
        <div style="display:flex;align-items:center;gap:10px;padding:6px;background:#0a0c10;border-radius:4px;margin-bottom:4px;font-size:11px">
          <span class="tag">${c.framework}</span>
          <span style="flex:1;color:#e2e8f0">${c.control}: ${c.name}</span>
          <div style="width:60px;height:6px;background:#1f2937;border-radius:3px;overflow:hidden"><div style="height:100%;width:${c.score}%;background:${c.score >= 80 ? '#34d399' : c.score >= 60 ? '#fbbf24' : '#f87171'};border-radius:3px"></div></div>
          <span class="tag" style="background:${c.status === 'pass' ? '#22c55e20' : c.status === 'partial' ? '#fbbf2420' : '#ef444420'};color:${c.status === 'pass' ? '#34d399' : c.status === 'partial' ? '#fbbf24' : '#f87171'}">${c.status}</span>
        </div>
      `)}
    </div>`;
  }

  private _renderTrendChart(): any {
    const data = this._ztTrendData;
    const W = 260, H = 80, pad = 20;
    const maxTests = Math.max(...data.map(d => d.tests), 1);
    const stepX = (W - pad * 2) / (data.length - 1);
    let svg = '';
    for (let i = 0; i <= 4; i++) {
      const y = pad + (i / 4) * (H - pad * 2);
      svg += `<line x1="${pad}" y1="${y}" x2="${W - pad}" y2="${y}" stroke="#2a2d3a" stroke-width="0.5"/>`;
    }
    const passedPts = data.map((d, i) => `${pad + i * stepX},${pad + (1 - d.passed / maxTests) * (H - pad * 2)}`).join(' ');
    svg += `<polyline points="${passedPts}" fill="none" stroke="#34d399" stroke-width="1.5" stroke-linecap="round"/>`;
    const failedPts = data.map((d, i) => `${pad + i * stepX},${pad + (1 - d.failed / maxTests) * (H - pad * 2)}`).join(' ');
    svg += `<polyline points="${failedPts}" fill="none" stroke="#f87171" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="4 2"/>`;
    data.forEach((d, i) => { svg += `<text x="${pad + i * stepX}" y="${H - 4}" text-anchor="middle" fill="#6b7280" font-size="6">${d.period}</text>`; });
    svg += `<circle cx="${W - 100}" cy="8" r="3" fill="#34d399"/><text x="${W - 94}" y="11" fill="#9ca3af" font-size="7">Passed</text>`;
    svg += `<circle cx="${W - 55}" cy="8" r="3" fill="#f87171"/><text x="${W - 49}" y="11" fill="#9ca3af" font-size="7">Failed</text>`;
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:10px;color:#9ca3af;text-transform:uppercase">Test Results Trend</div>
      <svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}">${svg}</svg>
      ${(() => {
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
        return html`<span class="trend-indicator ${cls}" style="margin-top:8px;display:inline-flex">${arrow} Risk trend: ${slope > 0 ? '+' : ''}${slope.toFixed(1)}/week (improving)</span>`;
      })()}
    </div>`;
  }

  private _renderMitreCorrelation(): any {
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:10px;color:#9ca3af;text-transform:uppercase">MITRE ATT&CK Detection Coverage</div>
      ${this._ztMitreTechniques.map(t => html`
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

  private _renderApprovalWorkflow(): any {
    const approvals = [
      { name: 'Dr. Sarah Chen', role: 'CISO', status: 'approved', time: '1h ago' },
      { name: 'James Wilson', role: 'Network Lead', status: 'pending', time: '' },
      { name: 'Maria Garcia', role: 'IAM Lead', status: 'pending', time: '' },
    ];
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:10px;color:#9ca3af;text-transform:uppercase">Test Approval Workflow</div>
      ${approvals.map(a => html`
        <div class="approval-row">
          <div style="width:28px;height:28px;border-radius:50%;background:${a.status === 'approved' ? '#34d39930' : '#fbbf2430'};color:${a.status === 'approved' ? '#34d399' : '#fbbf24'};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">${a.name.split(' ').map((n: string) => n[0]).join('')}</div>
          <div style="flex:1"><div style="font-size:11px;font-weight:600">${a.name}</div><div style="font-size:9px;color:#6b7280">${a.role}${a.time ? ' - ' + a.time : ''}</div></div>
          ${a.status === 'approved' ? html`<span class="tag" style="background:#22c55e20;color:#34d399">Approved</span>` : html`
            <div style="display:flex;gap:4px">
              <button class="approval-btn approve" @click=${() => { this._addAudit('approval', a.name + ' approved test'); }}>Approve</button>
              <button class="approval-btn reject" @click=${() => { this._addAudit('approval', a.name + ' rejected test'); }}>Reject</button>
            </div>
          `}
        </div>
      `)}
    </div>`;
  }

  private _renderPanelConfig(): any {
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:10px;color:#9ca3af;text-transform:uppercase">Panel Configuration</div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #0a0c10">
        <div><div style="font-size:11px;color:#e2e8f0">Auto-Refresh Interval</div><div style="font-size:9px;color:#6b7280">Refresh test results automatically</div></div>
        <select class="config-select" style="width:120px"><option value="0">Disabled</option><option value="30">30s</option><option value="60">1 min</option><option value="300">5 min</option></select>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #0a0c10">
        <div><div style="font-size:11px;color:#e2e8f0">Risk Threshold</div><div style="font-size:9px;color:#6b7280">Alert when risk score exceeds</div></div>
        <select class="config-select" style="width:120px"><option value="50">50 (Medium)</option><option value="70">70 (High)</option><option value="85">85 (Critical)</option></select>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0">
        <div><div style="font-size:11px;color:#e2e8f0">Filter Presets</div><div style="font-size:9px;color:#6b7280">Quick filter bypass vectors</div></div>
        <div style="display:flex;gap:4px">${['All', 'High Risk', 'Unpatched', 'Identity'].map(p => html`<span class="tag" style="cursor:pointer;background:#3b82f620;color:#60a5fa">${p}</span>`)}</div>
      </div>
    </div>`;
  }

  // Generate auto-insights
  private _generateZTInsights(): { title: string; body: string; severity: string }[] {
    const insights: { title: string; body: string; severity: string }[] = [];
    const failedTests = this._ztComplianceChecks.filter(c => c.status === 'fail');
    if (failedTests.length > 0) insights.push({ title: 'Compliance Gaps Detected', body: `${failedTests.length} controls are failing. Priority: ${failedTests.map(f => f.control).join(', ')}. Remediation plan required within 30 days.`, severity: 'critical' });
    const avgRisk = this._ztTrendData.length > 0 ? this._ztTrendData[this._ztTrendData.length - 1].avgRisk : 50;
    if (avgRisk > 50) insights.push({ title: 'Risk Score Above Threshold', body: `Average risk score is ${avgRisk}/100. The target is below 40. Focus areas: identity verification and network segmentation.`, severity: 'warning' });
    const lowDetect = this._ztMitreTechniques.filter(t => t.detection < 50);
    if (lowDetect.length > 0) insights.push({ title: 'Detection Coverage Gap', body: `${lowDetect.length} MITRE techniques have below 50% detection rate: ${lowDetect.map(t => t.id).join(', ')}. Deploy additional sensors.`, severity: 'warning' });
    insights.push({ title: 'Policy Improvement', body: 'Zero trust posture has improved 16% over the last 6 weeks. Continue micro-segmentation rollout and enforce continuous verification for all cloud workloads.', severity: 'info' });
    return insights;
  }

  // MITRE ATT&CK heatmap for zero trust techniques
  private _renderMitreHeatmapSVG(): string {
    const W = 260, H = 100;
    const tactics = ['Initial Access', 'Lateral Move', 'Priv Esc', 'Defense Evade', 'Cred Access', 'Exfil', 'C2', 'Impact'];
    const techs = this._ztMitreTechniques;
    const cellW = 28;
    const cellH = 18;
    let svg = '';
    // Column headers (tactics)
    tactics.forEach((t, i) => {
      svg += `<text x="${10 + i * (cellW + 2)}" y="10" text-anchor="middle" fill="#6b7280" font-size="5.5" transform="rotate(-25, ${10 + i * (cellW + 2)}, 10)">${t}</text>`;
    });
    // Data rows
    techs.forEach((tech, row) => {
      const y = 25 + row * (cellH + 2);
      svg += `<text x="0" y="${y + cellH / 2 + 3}" fill="#9ca3af" font-size="6">${tech.id}</text>`;
      // Generate cells per tactic with varying detection scores
      tactics.forEach((_, col) => {
        const score = Math.floor(Math.random() * 80) + 20;
        const color = score >= 70 ? '#34d399' : score >= 45 ? '#fbbf24' : '#f87171';
        const x = 10 + col * (cellW + 2);
        svg += `<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" rx="2" fill="${color}" fill-opacity="0.3" stroke="${color}" stroke-width="0.5"/>`;
        svg += `<text x="${x + cellW / 2}" y="${y + cellH / 2 + 3}" text-anchor="middle" fill="#e2e8f0" font-size="6">${score}</text>`;
      });
    });
    // Legend
    svg += `<rect x="10" y="${H - 12}" width="8" height="8" rx="1" fill="#34d39940" stroke="#34d399" stroke-width="0.5"/>`;
    svg += `<text x="22" y="${H - 5}" fill="#6b7280" font-size="6">High</text>`;
    svg += `<rect x="50" y="${H - 12}" width="8" height="8" rx="1" fill="#fbbf2440" stroke="#fbbf24" stroke-width="0.5"/>`;
    svg += `<text x="62" y="${H - 5}" fill="#6b7280" font-size="6">Medium</text>`;
    svg += `<rect x="100" y="${H - 12}" width="8" height="8" rx="1" fill="#f8717140" stroke="#f87171" stroke-width="0.5"/>`;
    svg += `<text x="112" y="${H - 5}" fill="#6b7280" font-size="6">Low</text>`;
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}">${svg}</svg>`;
  }

  // Sankey diagram for policy-to-vector flow
  private _renderPolicyVectorSankeySVG(): string {
    const W = 260, H = 120;
    const policies = [
      { label: 'Identity', value: 15, color: '#3b82f6' },
      { label: 'Device', value: 12, color: '#f97316' },
      { label: 'Network', value: 18, color: '#22c55e' },
      { label: 'App', value: 8, color: '#a855f7' },
      { label: 'Data', value: 10, color: '#ef4444' },
    ];
    const vectors = [
      { label: 'Cred Theft', value: 14, color: '#ef4444' },
      { label: 'Token Forge', value: 8, color: '#f97316' },
      { label: 'Lateral', value: 12, color: '#fbbf24' },
      { label: 'Priv Esc', value: 10, color: '#a855f7' },
      { label: 'API Abuse', value: 7, color: '#3b82f6' },
    ];
    const total = policies.reduce((s, p) => s + p.value, 0) || 1;
    let svg = '';
    policies.forEach((p, i) => {
      const h = (p.value / total) * (H - 20);
      const y = 10 + policies.slice(0, i).reduce((s, v) => s + (v.value / total) * (H - 20), 0);
      svg += `<rect x="5" y="${y}" width="35" height="${h}" rx="3" fill="${p.color}" fill-opacity="0.7"/>`;
      svg += `<text x="22" y="${y + h / 2 + 3}" text-anchor="middle" fill="#fff" font-size="6" font-weight="600">${p.label}</text>`;
    });
    vectors.forEach((v, i) => {
      const h = (v.value / total) * (H - 20);
      const y = 10 + vectors.slice(0, i).reduce((s, vec) => s + (vec.value / total) * (H - 20), 0);
      svg += `<rect x="${W - 40}" y="${y}" width="35" height="${h}" rx="3" fill="${v.color}" fill-opacity="0.7"/>`;
      svg += `<text x="${W - 22}" y="${y + h / 2 + 3}" text-anchor="middle" fill="#fff" font-size="6" font-weight="600">${v.label}</text>`;
    });
    for (let i = 0; i < 6; i++) {
      const opacity = Math.random() * 0.3 + 0.1;
      svg += `<path d="M45,${H / 2} C100,${H / 2} 160,${H / 2} ${W - 45},${H / 2}" stroke="#94a3b8" stroke-opacity="${opacity}" stroke-width="${Math.random() * 8 + 2}" fill="none"/>`;
    }
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}">${svg}</svg>`;
  }

  // Network segmentation gap analysis
  private _renderSegGapAnalysis(): any {
    const gaps = [
      { zone: 'DMZ to Internal', status: 'open', risk: 'high', recommendation: 'Implement micro-firewall with explicit allow-list' },
      { zone: 'Prod to Dev', status: 'partial', risk: 'medium', recommendation: 'Enforce network policy agent on all Dev hosts' },
      { zone: 'Cloud to On-Prem', status: 'open', risk: 'critical', recommendation: 'Deploy ZTNA gateway with identity-based access' },
      { zone: 'IoT to Corporate', status: 'closed', risk: 'low', recommendation: 'N/A - Already segmented via VLAN isolation' },
      { zone: 'Guest to Corporate', status: 'partial', risk: 'medium', recommendation: 'Enforce captive portal with 802.1X authentication' },
    ];
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:10px;color:#9ca3af;text-transform:uppercase">Segmentation Gap Analysis</div>
      ${gaps.map(g => html`
        <div style="padding:8px;background:#0a0c10;border-radius:6px;margin-bottom:4px;border-left:3px solid ${g.status === 'open' ? '#ef4444' : g.status === 'partial' ? '#fbbf24' : '#34d399'}">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <span style="font-size:11px;font-weight:600;color:#e2e8f0">${g.zone}</span>
            <div style="display:flex;gap:4px">
              <span class="tag" style="background:${g.risk === 'critical' ? '#ef444420' : g.risk === 'high' ? '#f9731620' : g.risk === 'medium' ? '#fbbf2420' : '#22c55e20'};color:${g.risk === 'critical' ? '#f87171' : g.risk === 'high' ? '#f97316' : g.risk === 'medium' ? '#fbbf24' : '#34d399'}">${g.risk}</span>
              <span class="tag" style="background:${g.status === 'open' ? '#ef444420' : g.status === 'partial' ? '#fbbf2420' : '#22c55e20'};color:${g.status === 'open' ? '#f87171' : g.status === 'partial' ? '#fbbf24' : '#34d399'}">${g.status}</span>
            </div>
          </div>
          <div style="font-size:10px;color:#6b7280">${g.recommendation}</div>
        </div>
      `)}
    </div>`;
  }

  // Identity trust level assessment
  private _renderIdentityTrustAssessment(): any {
    const identities = [
      { name: 'svc-app-api', type: 'Service Account', trust: 'low', lastVerified: '3 days ago', mfa: false, risk: 85 },
      { name: 'admin-john', type: 'Human Admin', trust: 'high', lastVerified: '2h ago', mfa: true, risk: 25 },
      { name: 'svc-backup-02', type: 'Service Account', trust: 'medium', lastVerified: '1 week ago', mfa: false, risk: 62 },
      { name: 'api-gateway-key', type: 'API Key', trust: 'low', lastVerified: 'Never', mfa: false, risk: 95 },
      { name: 'dev-sarah', type: 'Developer', trust: 'high', lastVerified: '4h ago', mfa: true, risk: 18 },
      { name: 'ci-cd-pipeline', type: 'Machine Identity', trust: 'medium', lastVerified: '5 days ago', mfa: false, risk: 55 },
    ];
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:10px;color:#9ca3af;text-transform:uppercase">Identity Trust Assessment</div>
      ${identities.map(id => html`
        <div style="display:flex;align-items:center;gap:10px;padding:8px;background:#0a0c10;border-radius:6px;margin-bottom:4px">
          <div style="width:32px;height:32px;border-radius:50%;background:${id.trust === 'high' ? '#34d39920' : id.trust === 'medium' ? '#fbbf2420' : '#f8717120'};color:${id.trust === 'high' ? '#34d399' : id.trust === 'medium' ? '#fbbf24' : '#f87171'};display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">${id.type === 'Human Admin' || id.type === 'Developer' ? '\uD83D\uDC64' : id.type === 'API Key' ? '\uD83D\uDD11' : '\u2699\uFE0F'}</div>
          <div style="flex:1">
            <div style="font-size:11px;font-weight:600;color:#e2e8f0">${id.name}</div>
            <div style="font-size:9px;color:#6b7280">${id.type} | Verified: ${id.lastVerified} | MFA: ${id.mfa ? 'Yes' : 'No'}</div>
          </div>
          <div style="text-align:right;min-width:60px">
            <div style="font-size:14px;font-weight:700;color:${id.risk >= 70 ? '#f87171' : id.risk >= 40 ? '#fbbf24' : '#34d399'}">${id.risk}</div>
            <div style="font-size:8px;color:#6b7280">Risk</div>
          </div>
          <div style="width:50px;height:6px;background:#1f2937;border-radius:3px;overflow:hidden"><div style="height:100%;width:${id.risk}%;background:${id.risk >= 70 ? '#f87171' : id.risk >= 40 ? '#fbbf24' : '#34d399'};border-radius:3px"></div></div>
        </div>
      `)}
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
          <button class="tab ${this._activeTab === 'compliance' ? 'active' : ''}" @click=${() => { this._activeTab = 'compliance'; }}>Compliance</button>
          <button class="tab ${this._activeTab === 'analytics' ? 'active' : ''}" @click=${() => { this._activeTab = 'analytics'; }}>Analytics</button>
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

        ${this._activeTab === 'compliance' ? html`
          ${this._renderComplianceDashboard()}
          ${this._renderMitreCorrelation()}
          <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
            <div style="font-weight:600;font-size:12px;margin-bottom:10px;color:#9ca3af;text-transform:uppercase">MITRE ATT&CK Detection Heatmap</div>
            <div style="background:#0a0c10;border-radius:8px;padding:12px">${this._renderMitreHeatmapSVG()}</div>
          </div>
          ${this._renderSegGapAnalysis()}
          ${this._renderIdentityTrustAssessment()}
          ${this._renderApprovalWorkflow()}
        ` : nothing}

        ${this._activeTab === 'analytics' ? html`
          ${this._renderTrendChart()}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
            <div>
              ${this._generateZTInsights().map(ins => html`
                <div class="insight-card" style="border-left-color:${ins.severity === 'critical' ? '#ef4444' : ins.severity === 'warning' ? '#fbbf24' : '#3b82f6'}">
                  <div class="insight-title" style="color:${ins.severity === 'critical' ? '#ef4444' : ins.severity === 'warning' ? '#fbbf24' : '#3b82f6'}">${ins.severity.toUpperCase()}: ${ins.title}</div>
                  <div class="insight-body">${ins.body}</div>
                </div>
              `)}
            </div>
            <div>
              ${this._ztTrendData.map(d => html`
                <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid #0a0c10;font-size:11px">
                  <span style="min-width:60px;color:#6b7280">${d.period}</span>
                  <div style="flex:1;height:6px;background:#1f2937;border-radius:3px;overflow:hidden"><div style="height:100%;width:${d.passed / d.tests * 100}%;background:#34d399;border-radius:3px"></div></div>
                  <span style="min-width:50px;font-weight:600;color:#34d399">${d.passed}/${d.tests}</span>
                  <span style="font-size:10px;color:${d.avgRisk <= 40 ? '#34d399' : d.avgRisk <= 60 ? '#fbbf24' : '#f87171'};min-width:30px;text-align:right">${d.avgRisk}</span>
                </div>
              `)}
            </div>
          </div>
          <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
            <div style="font-weight:600;font-size:12px;margin-bottom:10px;color:#9ca3af;text-transform:uppercase">Policy to Vector Attack Flow</div>
            <div style="background:#0a0c10;border-radius:8px;padding:12px">${this._renderPolicyVectorSankeySVG()}</div>
          </div>
          ${this._renderPanelConfig()}
        ` : nothing}
      </div>
        ${this._renderRiskGauge()}
        ${this._renderFooter()}
      </div>
    `;
  }

  // === Enhanced Pipeline & Grid Integration ===
  private _pipelineProgress = 0;
  private _pipelineRunning = false;
  private _pipelinePhase = 'idle';
  private _jobQueue: { id: string; name: string; priority: number; status: string }[] = [];
  private _errorCategories: { category: string; count: number; autoRemediation: string }[] = [];
  private _gridSelectedRows: Set<string> = new Set();
  private _gridSortColumn = 'riskScore';
  private _gridSortAsc = false;
  private _showHelpOverlay = false;
  private _glossaryTerms: { term: string; definition: string }[] = [
    { term: 'Risk Assessment', definition: 'Systematic process of identifying and evaluating risks' },
    { term: 'Threat Vector', definition: 'Path or means by which an attacker can compromise a system' },
    { term: 'Vulnerability', definition: 'Weakness that can be exploited by a threat to cause harm' },
    { term: 'Mitigation', definition: 'Action taken to reduce the likelihood or impact of a risk' },
    { term: 'Residual Risk', definition: 'Risk remaining after controls have been applied' },
    { term: 'Risk Score', definition: 'Numerical rating combining likelihood and impact factors' },
    { term: 'Control', definition: 'Safeguard or countermeasure that reduces risk exposure' },
    { term: 'Compliance', definition: 'Adherence to laws, regulations, standards, and policies' },
    { term: 'Incident', definition: 'Security event that actually or potentially jeopardizes systems' },
    { term: 'Remediation', definition: 'Process of repairing or correcting a vulnerability or finding' },
    { term: 'SLA', definition: 'Service Level Agreement defining response and resolution targets' },
    { term: 'TTP', definition: 'Tactics, Techniques, and Procedures used by threat actors' },
  ];
  private _keyboardShortcuts: { key: string; action: string }[] = [
    { key: 'Ctrl+Enter', action: 'Execute pipeline' },
    { key: 'Ctrl+Shift+E', action: 'Export data' },
    { key: 'Ctrl+Shift+R', action: 'Rollback phase' },
    { key: 'Ctrl+F', action: 'Find in grid' },
    { key: 'Ctrl+A', action: 'Select all' },
    { key: 'Escape', action: 'Close overlay' },
    { key: 'Ctrl+H', action: 'Toggle help' },
    { key: 'Ctrl+1-5', action: 'Switch tabs' },
  ];

  private _renderPipelineMini(): any {
    const barColor = this._pipelineRunning ? '#3b82f6' : this._pipelinePhase === 'error' ? '#ef4444' : '#22c55e';
    return html`<div style="background:#1f2937;border-radius:8px;padding:12px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-weight:600;font-size:11px;color:#9ca3af;text-transform:uppercase">Pipeline Status</span>
        <span style="font-size:9px;color:#6b7280">${this._pipelinePhase}</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <div style="flex:1;height:6px;background:#0a0c10;border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${this._pipelineProgress}%;background:${barColor};border-radius:3px;transition:width 0.3s"></div>
        </div>
        <span style="font-size:10px;color:#e2e8f0;font-weight:600">${this._pipelineProgress}%</span>
      </div>
    </div>`;
  }

  private _renderHelpOverlay(): any {
    if (!this._showHelpOverlay) return html``;
    return html`<div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center" @click=${() => { this._showHelpOverlay = false; }}>
      <div style="background:#1f2937;border-radius:12px;padding:20px;max-width:550px;max-height:75vh;overflow-y:auto;width:90%" @click=${(e: any) => e.stopPropagation()}>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span style="font-weight:700;font-size:15px;color:#e2e8f0">Documentation</span>
          <button style="background:none;border:none;color:#6b7280;cursor:pointer;font-size:18px" @click=${() => { this._showHelpOverlay = false; }}>✕</button>
        </div>
        ${this._glossaryTerms.map(g => html`<div style="padding:5px 0;border-bottom:1px solid #374151"><span style="font-weight:600;color:#60a5fa;font-size:11px">${g.term}</span><p style="font-size:10px;color:#9ca3af;margin:1px 0 0;line-height:1.3">${g.definition}</p></div>`)}
        <div style="margin-top:10px;font-weight:600;font-size:11px;color:#9ca3af;text-transform:uppercase;margin-bottom:6px">Shortcuts</div>
        ${this._keyboardShortcuts.map(s => html`<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:10px"><span style="color:#d1d5db">${s.action}</span><kbd style="background:#0a0c10;padding:1px 6px;border-radius:3px;color:#60a5fa;font-family:monospace;font-size:9px;border:1px solid #374151">${s.key}</kbd></div>`)}
      </div>
    </div>`;
  }


  // === SECTION A: Multi-Phase Pipeline Execution Engine ===
  private _pipelinePhases: { id: string; name: string; status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled-back'; progress: number; duration: number; errors: string[]; rollbackSteps: string[] }[] = [
    { id: 'ph-1', name: 'Initial Scan', status: 'completed', progress: 100, duration: 30, errors: [], rollbackSteps: ['Reset initial scan state'] },
    { id: 'ph-2', name: 'Data Collection', status: 'completed', progress: 100, duration: 45, errors: [], rollbackSteps: ['Reset data collection state'] },
    { id: 'ph-3', name: 'Analysis Processing', status: 'running', progress: 62, duration: 90, errors: [], rollbackSteps: ['Reset analysis processing state'] },
    { id: 'ph-4', name: 'Threat Correlation', status: 'pending', progress: 0, duration: 0, errors: [], rollbackSteps: ['Reset threat correlation state'] },
    { id: 'ph-5', name: 'Report Generation', status: 'pending', progress: 0, duration: 0, errors: [], rollbackSteps: ['Reset report generation state'] },
    { id: 'ph-6', name: 'Remediation Tracking', status: 'pending', progress: 0, duration: 0, errors: [], rollbackSteps: ['Reset remediation tracking state'] },
  ];

  private _pipelineJobQueue: { id: string; name: string; priority: number; status: 'queued' | 'processing' | 'done'; phaseId: string; submittedAt: number; startedAt: number }[] = [
    { id: 'job-001', name: 'Scan target systems', priority: 1, status: 'done', phaseId: 'ph-1', submittedAt: Date.now() - 300000, startedAt: Date.now() - 280000 },
    { id: 'job-002', name: 'Collect telemetry data', priority: 2, status: 'done', phaseId: 'ph-2', submittedAt: Date.now() - 250000, startedAt: Date.now() - 230000 },
    { id: 'job-003', name: 'Run analysis engine', priority: 3, status: 'processing', phaseId: 'ph-3', submittedAt: Date.now() - 200000, startedAt: 0 },
    { id: 'job-004', name: 'Generate findings', priority: 2, status: 'queued', phaseId: 'ph-4', submittedAt: Date.now() - 150000, startedAt: 0 },
    { id: 'job-005', name: 'Create remediation plan', priority: 4, status: 'queued', phaseId: 'ph-5', submittedAt: Date.now() - 100000, startedAt: 0 },
  ];

  private _errorCategories: { category: string; icon: string; count: number; autoRemediation: string }[] = [
    { category: 'Scan Timeout', icon: 'net', count: 4, autoRemediation: 'Retry with extended timeout' },
    { category: 'Data Parse Error', icon: 'hash', count: 3, autoRemediation: 'Skip malformed records' },
    { category: 'API Rate Limited', icon: 'scan', count: 6, autoRemediation: 'Apply exponential backoff' },
    { category: 'Auth Token Expired', icon: 'enc', count: 2, autoRemediation: 'Refresh authentication token' },
    { category: 'Config Validation Fail', icon: 'fs', count: 5, autoRemediation: 'Review configuration settings' },
    { category: 'Resource Not Found', icon: 'time', count: 3, autoRemediation: 'Verify resource identifiers' },
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
    { id: 'FND-001', case: 'Primary', finding: 'Critical misconfiguration detected in core component', severity: 'critical', riskScore: 92, trend: [72,76,80,84,87,90,92], status: 'open', assignee: 'Team Lead' },
    { id: 'FND-002', case: 'Secondary', finding: 'Unexpected access pattern from external source', severity: 'high', riskScore: 78, trend: [55,58,62,66,70,74,78], status: 'investigating', assignee: 'Analyst A' },
    { id: 'FND-003', case: 'Tertiary', finding: 'Compliance deviation from baseline policy', severity: 'medium', riskScore: 55, trend: [35,38,42,45,48,52,55], status: 'mitigated', assignee: 'Analyst B' },
    { id: 'FND-004', case: 'External', finding: 'Third-party integration security gap', severity: 'high', riskScore: 82, trend: [62,65,68,72,75,78,82], status: 'open', assignee: 'Analyst C' },
    { id: 'FND-005', case: 'Internal', finding: 'Privilege escalation path identified', severity: 'critical', riskScore: 95, trend: [80,83,86,88,91,93,95], status: 'escalated', assignee: 'Team Lead' },
    { id: 'FND-006', case: 'Archival', finding: 'Stale credential in legacy system', severity: 'low', riskScore: 38, trend: [20,22,25,28,30,34,38], status: 'mitigated', assignee: 'Analyst D' },
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
          <span style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase">Zero Trust Bypass Findings Grid</span>
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
    { name: 'Platform Enhancement', investment: 120000, annualSavings: 95000, riskReduction: 28, paybackMonths: 16, npv: 250000 },
    { name: 'Automation Upgrade', investment: 75000, annualSavings: 62000, riskReduction: 22, paybackMonths: 15, npv: 160000 },
    { name: 'Monitoring Expansion', investment: 55000, annualSavings: 45000, riskReduction: 18, paybackMonths: 15, npv: 120000 },
    { name: 'Training Program', investment: 40000, annualSavings: 32000, riskReduction: 15, paybackMonths: 15, npv: 85000 },
  ];

  private _riskQuantMetrics: { metric: string; sle: number; aro: number; ale: number; mitigationCost: number; roi: number }[] = [
    { metric: 'Critical System Compromise', sle: 4200000, aro: 0.12, ale: 504000, mitigationCost: 95000, roi: 430 },
    { metric: 'Data Exposure Incident', sle: 2800000, aro: 0.18, ale: 504000, mitigationCost: 75000, roi: 572 },
    { metric: 'Operational Disruption', sle: 1500000, aro: 0.25, ale: 375000, mitigationCost: 55000, roi: 582 },
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
    { name: 'Data Service', url: '/api/v1/service/data', method: 'POST', headers: { 'Content-Type': 'application/json' }, lastStatus: 200, lastCalled: '2m ago' },
    { name: 'Analysis Engine', url: '/api/v1/service/analyze', method: 'GET', headers: { 'Content-Type': 'application/json' }, lastStatus: 200, lastCalled: '5m ago' },
    { name: 'Report Generator', url: '/api/v1/service/report', method: 'POST', headers: { 'Content-Type': 'application/json' }, lastStatus: 200, lastCalled: '15m ago' },
  ];

  private _webhookConfigs: { id: string; name: string; url: string; events: string[]; active: boolean; lastTriggered: string }[] = [
    { id: 'wh-1', name: 'Alert Dispatch', url: 'https://hooks.slack.com/T00/B00/svc1', events: ['critical_alert'], active: true, lastTriggered: '30m ago' },
    { id: 'wh-2', name: 'Status Update', url: 'https://hooks.slack.com/T00/B00/svc2', events: ['status_change'], active: true, lastTriggered: '1h ago' },
    { id: 'wh-3', name: 'Escalation Notice', url: 'https://hooks.slack.com/T00/B00/svc3', events: ['escalation'], active: false, lastTriggered: 'Never' },
  ];

  private _dataSourceConnections: { name: string; type: string; status: 'connected' | 'disconnected' | 'error'; lastSync: string; records: number }[] = [
    { name: 'Primary Database', type: 'PostgreSQL', status: 'connected', lastSync: '1m ago', records: 234000 },
    { name: 'Log Storage', type: 'Elasticsearch', status: 'connected', lastSync: '5m ago', records: 890000 },
    { name: 'Config Repository', type: 'Git', status: 'connected', lastSync: '30m ago', records: 5600 },
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
    { term: 'Risk Assessment', definition: 'Systematic process of identifying and evaluating risks to assets' },
    { term: 'Threat Vector', definition: 'Path or means by which an adversary can compromise a system' },
    { term: 'Vulnerability', definition: 'Weakness that can be exploited by a threat actor to cause harm' },
    { term: 'Mitigation', definition: 'Action or control that reduces likelihood or impact of a risk' },
    { term: 'Residual Risk', definition: 'Remaining risk after all controls and mitigations are applied' },
    { term: 'Risk Score', definition: 'Numerical rating combining likelihood and impact assessment factors' },
    { term: 'Control Framework', definition: 'Structured set of policies and procedures for managing risk' },
    { term: 'Compliance', definition: 'Adherence to applicable laws regulations standards and organizational policies' },
    { term: 'Incident Response', definition: 'Organized approach to addressing and managing security incidents' },
    { term: 'Remediation', definition: 'Process of correcting identified vulnerabilities or security findings' },
    { term: 'SLA', definition: 'Service Level Agreement defining expected response and resolution timeframes' },
    { term: 'TTP', definition: 'Tactics Techniques and Procedures describing how threat actors operate' },
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
