/**
 * sc-supply-chain-attack.ts - Supply Chain Attack Analyzer (Supply Chain Security Dark Capability)
 * Supplier dependency mapping, SBOM input, vulnerability per dependency, attack path analysis,
 * impact radius calculation, containment recommendations, vendor notification workflow
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';

type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
type DependencyType = 'direct' | 'transitive' | 'dev' | 'platform' | 'infrastructure';
type CompromiseType = 'malicious-package' | 'typosquatting' | 'dependency-confusion' | 'account-takeover' | 'ci-injection' | 'code-injection' | 'prototype-pollution' | 'crypto-miner';

interface SBOMEntry {
  id: string;
  name: string;
  version: string;
  type: DependencyType;
  supplier: string;
  ecosystem: 'npm' | 'pypi' | 'maven' | 'nuget' | 'go' | 'docker' | 'os';
  license: string;
  directDependencies: number;
  transitiveDependencies: number;
  lastUpdated: string;
  vulnerabilities: { id: string; severity: RiskLevel; cvss: number; title: string; patched: boolean; patchVersion?: string }[];
  riskScore: number;
}

interface Supplier {
  id: string;
  name: string;
  type: 'open-source' | 'commercial' | 'internal' | 'cloud';
  criticality: RiskLevel;
  components: string[];
  securityScore: number;
  lastAudit: string;
  compromiseHistory: number;
  mfaEnabled: boolean;
  signedReleases: boolean;
  reviewProcess: string;
}

interface SupplyChainPath {
  id: string;
  name: string;
  entryComponent: string;
  targetComponent: string;
  intermediateSteps: string[];
  attackType: CompromiseType;
  feasibility: number;
  impact: number;
  riskScore: number;
  description: string;
  mitigations: string[];
}

interface AnalysisResult {
  id: string;
  timestamp: string;
  totalComponents: number;
  totalVulnerabilities: number;
  criticalVulns: number;
  paths: SupplyChainPath[];
  highestRiskScore: number;
  supplierRisk: number;
}

const SAMPLE_SBOM: SBOMEntry[] = [
  { id: 'P1', name: 'react', version: '18.2.0', type: 'direct', supplier: 'Meta (Facebook)', ecosystem: 'npm', license: 'MIT', directDependencies: 3, transitiveDependencies: 45, lastUpdated: '2024-01-15', vulnerabilities: [{ id: 'CVE-2024-0001', severity: 'high', cvss: 7.5, title: 'XSS in SSR', patched: true, patchVersion: '18.2.1' }], riskScore: 3.2 },
  { id: 'P2', name: 'lodash', version: '4.17.21', type: 'direct', supplier: 'OpenJS Foundation', ecosystem: 'npm', license: 'MIT', directDependencies: 0, transitiveDependencies: 0, lastUpdated: '2024-02-01', vulnerabilities: [], riskScore: 1.5 },
  { id: 'P3', name: 'express', version: '4.18.2', type: 'direct', supplier: 'OpenJS Foundation', ecosystem: 'npm', license: 'MIT', directDependencies: 25, transitiveDependencies: 60, lastUpdated: '2023-09-01', vulnerabilities: [{ id: 'CVE-2024-0002', severity: 'medium', cvss: 5.3, title: 'Open Redirect', patched: false }], riskScore: 4.1 },
  { id: 'P4', name: 'event-stream', version: '3.3.6', type: 'transitive', supplier: 'Dominic Tarr', ecosystem: 'npm', license: 'MIT', directDependencies: 2, transitiveDependencies: 5, lastUpdated: '2018-11-20', vulnerabilities: [{ id: 'HISTORIC', severity: 'critical', cvss: 9.8, title: 'Malicious injection (flatmap-stream)', patched: true, patchVersion: '4.0.0' }], riskScore: 8.5 },
  { id: 'P5', name: 'axios', version: '1.6.0', type: 'direct', supplier: 'OpenJS Foundation', ecosystem: 'npm', license: 'MIT', directDependencies: 1, transitiveDependencies: 8, lastUpdated: '2024-01-10', vulnerabilities: [], riskScore: 1.2 },
  { id: 'P6', name: 'ua-parser-js', version: '0.7.33', type: 'transitive', supplier: 'Faisal Salman', ecosystem: 'npm', license: 'MIT', directDependencies: 0, transitiveDependencies: 0, lastUpdated: '2021-10-15', vulnerabilities: [{ id: 'CVE-2024-0003', severity: 'critical', cvss: 9.8, title: 'Malicious code injection', patched: true, patchVersion: '1.0.0' }], riskScore: 7.8 },
  { id: 'P7', name: 'node-ipc', version: '9.2.1', type: 'transitive', supplier: 'Brandon Nozaki Miller', ecosystem: 'npm', license: 'MIT', directDependencies: 3, transitiveDependencies: 10, lastUpdated: '2022-03-15', vulnerabilities: [{ id: 'HISTORIC-2', severity: 'critical', cvss: 8.6, title: 'Protestware (peacenotwar)', patched: true, patchVersion: '10.0.0' }], riskScore: 7.2 },
  { id: 'P8', name: 'colors.js', version: '1.4.0', type: 'transitive', supplier: 'Marak Squires', ecosystem: 'npm', license: 'MIT', directDependencies: 0, transitiveDependencies: 0, lastUpdated: '2022-01-08', vulnerabilities: [{ id: 'HISTORIC-3', severity: 'high', cvss: 7.5, title: 'Maintainer sabotage (infinite loop)', patched: false }], riskScore: 6.8 },
  { id: 'P9', name: 'webpack', version: '5.89.0', type: 'direct', supplier: 'OpenJS Foundation', ecosystem: 'npm', license: 'MIT', directDependencies: 50, transitiveDependencies: 200, lastUpdated: '2024-01-20', vulnerabilities: [], riskScore: 2.5 },
  { id: 'P10', name: 'jsonwebtoken', version: '9.0.0', type: 'direct', supplier: 'auth0', ecosystem: 'npm', license: 'MIT', directDependencies: 2, transitiveDependencies: 15, lastUpdated: '2023-06-01', vulnerabilities: [{ id: 'CVE-2024-0004', severity: 'high', cvss: 7.8, title: 'Insecure default algorithm', patched: false }], riskScore: 5.5 },
  { id: 'P11', name: 'postcss', version: '8.4.31', type: 'direct', supplier: 'Andrey Sitnik', ecosystem: 'npm', license: 'MIT', directDependencies: 5, transitiveDependencies: 20, lastUpdated: '2024-01-15', vulnerabilities: [], riskScore: 1.8 },
  { id: 'P12', name: 'minimist', version: '1.2.8', type: 'transitive', supplier: 'James Halliday', ecosystem: 'npm', license: 'MIT', directDependencies: 0, transitiveDependencies: 0, lastUpdated: '2023-06-01', vulnerabilities: [{ id: 'CVE-2024-0005', severity: 'high', cvss: 7.5, title: 'Prototype pollution', patched: true, patchVersion: '1.2.6' }], riskScore: 4.5 },
];

const SAMPLE_SUPPLIERS: Supplier[] = [
  { id: 'S1', name: 'Meta (Facebook)', type: 'open-source', criticality: 'high', components: ['react', 'react-dom'], securityScore: 82, lastAudit: '2024-01-10', compromiseHistory: 0, mfaEnabled: true, signedReleases: true, reviewProcess: 'CI + Code Review + Security Audit' },
  { id: 'S2', name: 'OpenJS Foundation', type: 'open-source', criticality: 'high', components: ['express', 'lodash', 'webpack', 'axios'], securityScore: 78, lastAudit: '2024-01-05', compromiseHistory: 1, mfaEnabled: true, signedReleases: true, reviewProcess: 'CI + Code Review' },
  { id: 'S3', name: 'Dominic Tarr', type: 'open-source', criticality: 'critical', components: ['event-stream'], securityScore: 35, lastAudit: '2020-01-01', compromiseHistory: 2, mfaEnabled: false, signedReleases: false, reviewProcess: 'Single maintainer, no review' },
  { id: 'S4', name: 'Faisal Salman', type: 'open-source', criticality: 'critical', components: ['ua-parser-js'], securityScore: 40, lastAudit: '2022-06-01', compromiseHistory: 1, mfaEnabled: false, signedReleases: false, reviewProcess: 'Single maintainer, minimal review' },
  { id: 'S5', name: 'Brandon Nozaki Miller', type: 'open-source', criticality: 'high', components: ['node-ipc'], securityScore: 55, lastAudit: '2023-01-01', compromiseHistory: 1, mfaEnabled: true, signedReleases: false, reviewProcess: 'CI + Basic review' },
  { id: 'S6', name: 'Marak Squires', type: 'open-source', criticality: 'high', components: ['colors.js', 'faker.js'], securityScore: 30, lastAudit: '2022-01-01', compromiseHistory: 2, mfaEnabled: false, signedReleases: false, reviewProcess: 'No active review process' },
  { id: 'S7', name: 'auth0', type: 'commercial', criticality: 'medium', components: ['jsonwebtoken'], securityScore: 75, lastAudit: '2024-01-15', compromiseHistory: 0, mfaEnabled: true, signedReleases: true, reviewProcess: 'Enterprise review + Security audit' },
];

@customElement('sc-supply-chain-attack')
export class ScSupplyChainAttack extends LitElement {
  @property({ type: String }) panelId = 'supply-chain-attack';
  @state() private _sbom: SBOMEntry[] = [];
  @state() private _suppliers: Supplier[] = [];
  @state() private _paths: SupplyChainPath[] = [];
  @state() private _analysis: AnalysisResult | null = null;
  @state() private _activeTab: 'sbom' | 'suppliers' | 'paths' | 'report' = 'sbom';
  @state() private _analyzing = false;
  @state() private _progress = 0;
  @state() private _selectedComponent: SBOMEntry | null = null;
  @state() private _filterRisk: RiskLevel | 'all' = 'all';
  @state() private _filterType: DependencyType | 'all' = 'all';
  @state() private _showReport = false;
  @state() private _reportContent = '';

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
  @state() private _showEnhanced = false;
  @state() private _showDependencyTree = false;
  @state() private _showVendorRiskMatrix = false;
  @state() private _showVulnDistribution = false;
  @state() private _showComplianceMap = false;
  @state() private _showTeamPanel = false;

  // CVSS Calculator Data
  private _cvssMetrics = [
    { id: 'AV', label: 'Attack Vector', options: ['Network', 'Adjacent', 'Local', 'Physical'], values: ['N', 'A', 'L', 'P'] },
    { id: 'AC', label: 'Attack Complexity', options: ['Low', 'High'], values: ['L', 'H'] },
    { id: 'PR', label: 'Privileges Required', options: ['None', 'Low', 'High'], values: ['N', 'L', 'H'] },
    { id: 'UI', label: 'User Interaction', options: ['None', 'Required'], values: ['N', 'R'] },
    { id: 'S', label: 'Scope', options: ['Unchanged', 'Changed'], values: ['U', 'C'] },
    { id: 'C', label: 'Confidentiality', options: ['None', 'Low', 'High'], values: ['N', 'L', 'H'] },
    { id: 'I', label: 'Integrity', options: ['None', 'Low', 'High'], values: ['N', 'L', 'H'] },
    { id: 'A', label: 'Availability', options: ['None', 'Low', 'High'], values: ['N', 'L', 'H'] },
  ];
  private _cvssSelections: Record<string, number> = { AV: 0, AC: 0, PR: 0, UI: 0, S: 0, C: 2, I: 2, A: 2 };

  // Vendor Risk Matrix data
  private _vendorRiskFactors = [
    { factor: 'MFA Enabled', weight: 0.20 },
    { factor: 'Signed Releases', weight: 0.15 },
    { factor: 'Code Review Process', weight: 0.20 },
    { factor: 'Compromise History', weight: 0.20 },
    { factor: 'Last Audit Date', weight: 0.10 },
    { factor: 'Dependency Count', weight: 0.10 },
    { factor: 'Maintainer Count', weight: 0.05 },
  ];

  // Team members
  private _supplyChainTeam = [
    { id: 'sct1', name: 'Alex Rivera', role: 'Security Architect', avatar: 'AR', color: '#ef4444', components: 15, audits: 8, findings: 12 },
    { id: 'sct2', name: 'Priya Patel', role: 'AppSec Engineer', avatar: 'PP', color: '#3b82f6', components: 22, audits: 12, findings: 8 },
    { id: 'sct3', name: 'Chris Lee', role: 'DevSecOps', avatar: 'CL', color: '#22c55e', components: 18, audits: 5, findings: 15 },
    { id: 'sct4', name: 'Nina Kowalski', role: 'Compliance Analyst', avatar: 'NK', color: '#f59e0b', components: 8, audits: 20, findings: 6 },
  ];

  // Compliance mappings
  private _complianceMappings = [
    { standard: 'NIST 800-53', controls: ['SA-12', 'SR-3', 'RA-5'], description: 'Supply chain risk management, third-party authorization, vulnerability scanning' },
    { standard: 'CIS v8', controls: ['15.1', '15.2', '15.3'], description: 'Service provider management, application software security, penetration testing' },
    { standard: 'SLSA', levels: ['Level 1', 'Level 2', 'Level 3'], description: 'Build provenance, hosted build platform, hardened builds' },
    { standard: 'ISO 27001', controls: ['A.15.1', 'A.15.2'], description: 'Information security in supplier relationships, supplier service delivery management' },
    { standard: 'EO 14028', focus: 'Software supply chain security', description: 'Executive order on improving the nation cybersecurity, SBOM requirements' },
  ];

  // CVSS v3.1 Base Score Calculator
  private _calculateCVSS(): { score: number; severity: string; vector: string } {
    const avScores: Record<string, number> = { N: 0.85, A: 0.62, L: 0.55, P: 0.20 };
    const acScores: Record<string, number> = { L: 0.77, H: 0.44 };
    const prScoresChanged: Record<string, number> = { N: 0.85, L: 0.62, H: 0.27 };
    const prScoresUnchanged: Record<string, number> = { N: 0.85, L: 0.68, H: 0.50 };
    const uiScores: Record<string, number> = { N: 0.85, R: 0.62 };
    const ciaScores: Record<string, number> = { N: 0, L: 0.22, H: 0.56 };
    const issBase = 1 - ((1 - ciaScores[this._cvssSelections.C === 0 ? 'N' : this._cvssSelections.C === 1 ? 'L' : 'H']) * (1 - ciaScores[this._cvssSelections.I === 0 ? 'N' : this._cvssSelections.I === 1 ? 'L' : 'H']) * (1 - ciaScores[this._cvssSelections.A === 0 ? 'N' : this._cvssSelections.A === 1 ? 'L' : 'H']));
    const av = avScores[this._cvssSelections.AV === 0 ? 'N' : this._cvssSelections.AV === 1 ? 'A' : this._cvssSelections.AV === 2 ? 'L' : 'P'];
    const ac = acScores[this._cvssSelections.AC === 0 ? 'L' : 'H'];
    const pr = this._cvssSelections.S === 1 ? prScoresChanged[this._cvssSelections.PR === 0 ? 'N' : this._cvssSelections.PR === 1 ? 'L' : 'H'] : prScoresUnchanged[this._cvssSelections.PR === 0 ? 'N' : this._cvssSelections.PR === 1 ? 'L' : 'H'];
    const ui = uiScores[this._cvssSelections.UI === 0 ? 'N' : 'R'];
    const exploitability = 8.22 * av * ac * pr * ui;
    let baseScore: number;
    if (issBase <= 0) baseScore = 0;
    else if (this._cvssSelections.S === 1) baseScore = Math.min(10, 1.08 * (issBase + exploitability));
    else baseScore = Math.min(10, issBase + exploitability);
    const severity = baseScore >= 9.0 ? 'Critical' : baseScore >= 7.0 ? 'High' : baseScore >= 4.0 ? 'Medium' : baseScore > 0 ? 'Low' : 'None';
    const vector = `CVSS:3.1/AV:${this._cvssSelections.AV === 0 ? 'N' : this._cvssSelections.AV === 1 ? 'A' : this._cvssSelections.AV === 2 ? 'L' : 'P'}/AC:${this._cvssSelections.AC === 0 ? 'L' : 'H'}/PR:${this._cvssSelections.PR === 0 ? 'N' : this._cvssSelections.PR === 1 ? 'L' : 'H'}/UI:${this._cvssSelections.UI === 0 ? 'N' : 'R'}/S:${this._cvssSelections.S === 0 ? 'U' : 'C'}/C:${this._cvssSelections.C === 0 ? 'N' : this._cvssSelections.C === 1 ? 'L' : 'H'}/I:${this._cvssSelections.I === 0 ? 'N' : this._cvssSelections.I === 1 ? 'L' : 'H'}/A:${this._cvssSelections.A === 0 ? 'N' : this._cvssSelections.A === 1 ? 'L' : 'H'}`;
    return { score: Math.round(baseScore * 10) / 10, severity, vector };
  }

  private _renderCVSSCalculator(): any {
    const result = this._calculateCVSS();
    const sevColors: Record<string, string> = { Critical: '#ef4444', High: '#f97316', Medium: '#eab308', Low: '#22c55e', None: '#6b7280' };
    return html`<div style="background:#1a1d27;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">CVSS v3.1 Base Score Calculator</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">
        <div style="background:#0f1117;border-radius:8px;padding:14px;text-align:center">
          <div style="font-size:28px;font-weight:700;color:${sevColors[result.severity]}">${result.score}</div>
          <div style="font-size:10px;color:#6b7280;margin-top:2px">Base Score</div>
          <div style="font-size:12px;font-weight:600;color:${sevColors[result.severity]};margin-top:4px">${result.severity}</div>
        </div>
        <div style="grid-column:span 2;background:#0f1117;border-radius:8px;padding:10px">
          <div style="font-size:9px;color:#6b7280;margin-bottom:4px">Vector String</div>
          <div style="font-size:10px;font-family:monospace;color:#e2e8f0;word-break:break-all">${result.vector}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">
        ${this._cvssMetrics.map(m => html`<div style="background:#0f1117;border-radius:6px;padding:8px">
          <div style="font-size:9px;color:#6b7280;margin-bottom:4px">${m.label}</div>
          <select style="width:100%;background:#1a1d27;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:10px;font-family:inherit" @change=${(e: Event) => { this._cvssSelections[m.id] = parseInt((e.target as HTMLSelectElement).value); this.requestUpdate(); }}>
            ${m.options.map((opt, i) => html`<option value="${i}" .selected=${this._cvssSelections[m.id] === i}>${opt} (${m.values[i]})</option>`)}
          </select>
        </div>`)}
      </div>
    </div>`;
  }

  private _renderVendorRiskMatrix(): any {
    return html`<div style="background:#1a1d27;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Vendor Risk Factor Matrix</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px">
        ${this._vendorRiskFactors.map(f => html`<div style="background:#0f1117;border-radius:6px;padding:8px;text-align:center">
          <div style="font-size:9px;color:#6b7280">${f.factor}</div>
          <div style="font-size:14px;font-weight:700;color:#e2e8f0">${(f.weight * 100).toFixed(0)}%</div>
          <div style="font-size:8px;color:#6b7280">weight</div>
        </div>`)}
      </div>
      ${this._suppliers.sort((a, b) => a.securityScore - b.securityScore).map(s => {
        const riskLevel = s.securityScore < 40 ? 'Critical' : s.securityScore < 60 ? 'High' : s.securityScore < 75 ? 'Medium' : 'Low';
        const rlColor = riskLevel === 'Critical' ? '#ef4444' : riskLevel === 'High' ? '#f97316' : riskLevel === 'Medium' ? '#eab308' : '#22c55e';
        return html`<div style="background:#0f1117;border-radius:6px;padding:10px;margin-bottom:6px;border-left:3px solid ${rlColor}">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-size:12px;font-weight:600">${s.name}</span>
            <div style="display:flex;align-items:center;gap:8px">
              <div style="width:60px;height:6px;background:#2a2d3a;border-radius:3px;overflow:hidden">
                <div style="width:${s.securityScore}%;height:100%;background:${rlColor};border-radius:3px"></div>
              </div>
              <span style="font-size:12px;font-weight:700;color:${rlColor}">${s.securityScore}</span>
            </div>
          </div>
          <div style="display:flex;gap:8px;font-size:10px;color:#94a3b8;flex-wrap:wrap">
            <span>MFA: ${s.mfaEnabled ? '✅' : '❌'}</span>
            <span>Signed: ${s.signedReleases ? '✅' : '❌'}</span>
            <span>Compromises: ${s.compromiseHistory}</span>
            <span>Audit: ${s.lastAudit}</span>
            <span>Components: ${s.components.length}</span>
          </div>
        </div>`;
      })}
    </div>`;
  }

  private _renderVulnDistribution(): any {
    const allVulns = this._sbom.flatMap(s => s.vulnerabilities);
    const bySev = { critical: allVulns.filter(v => v.severity === 'critical').length, high: allVulns.filter(v => v.severity === 'high').length, medium: allVulns.filter(v => v.severity === 'medium').length, low: allVulns.filter(v => v.severity === 'low').length };
    const total = allVulns.length || 1;
    const patched = allVulns.filter(v => v.patched).length;
    const unpatched = allVulns.filter(v => !v.patched).length;
    const sevColors: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };
    const W = 400, H = 160;
    const barH = 20;
    return html`<div style="background:#1a1d27;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Vulnerability Distribution</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px">
        <div style="background:#0f1117;border-radius:6px;padding:8px;text-align:center">
          <div style="font-size:18px;font-weight:700;color:#ef4444">${bySev.critical}</div>
          <div style="font-size:9px;color:#6b7280">Critical</div>
        </div>
        <div style="background:#0f1117;border-radius:6px;padding:8px;text-align:center">
          <div style="font-size:18px;font-weight:700;color:#f97316">${bySev.high}</div>
          <div style="font-size:9px;color:#6b7280">High</div>
        </div>
        <div style="background:#0f1117;border-radius:6px;padding:8px;text-align:center">
          <div style="font-size:18px;font-weight:700;color:#22c55e">${patched}</div>
          <div style="font-size:9px;color:#6b7280">Patched</div>
        </div>
        <div style="background:#0f1117;border-radius:6px;padding:8px;text-align:center">
          <div style="font-size:18px;font-weight:700;color:#f59e0b">${unpatched}</div>
          <div style="font-size:9px;color:#6b7280">Unpatched</div>
        </div>
      </div>
      <svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:420px">
        ${Object.entries(bySev).map(([sev, count], i) => {
          const y = i * (barH + 16);
          const w = (count / total) * (W - 100);
          return html`<g>
            <text x="0" y="${y + barH / 2 + 3}" fill="#94a3b8" font-size="9" font-weight="600">${sev}</text>
            <rect x="60" y="${y}" width="${Math.max(2, w)}" height="${barH}" fill="${sevColors[sev]}40" rx="4" stroke="${sevColors[sev]}" stroke-width="0.5"/>
            <text x="${65 + w}" y="${y + barH / 2 + 3}" fill="#e2e8f0" font-size="9" font-weight="600">${count}</text>
            <text x="${W - 30}" y="${y + barH / 2 + 3}" fill="#6b7280" font-size="8">${Math.round((count / total) * 100)}%</text>
          </g>`;
        })}
      </svg>
      <div style="font-size:10px;color:#6b7280;margin-top:8px">Patch rate: ${Math.round((patched / total) * 100)}% | ${allVulns.length} total vulnerabilities across ${this._sbom.length} components</div>
    </div>`;
  }

  private _renderComplianceMap(): any {
    return html`<div style="background:#1a1d27;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Compliance Framework Mapping</div>
      ${this._complianceMappings.map(cm => html`<div style="background:#0f1117;border-radius:6px;padding:10px;margin-bottom:6px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <span style="font-size:12px;font-weight:700;color:#e2e8f0">${cm.standard}</span>
          <div style="display:flex;gap:4px">
            ${(cm.controls || cm.levels || []).map((c: string) => html`<span style="font-size:9px;padding:1px 6px;border-radius:3px;background:#172554;color:#93c5fd">${c}</span>`)}
          </div>
        </div>
        <div style="font-size:10px;color:#94a3b8">${cm.description}</div>
      </div>`)}
    </div>`;
  }

  private _renderTeamPanel(): any {
    return html`<div style="background:#1a1d27;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Supply Chain Security Team</div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px">
        ${this._supplyChainTeam.map(m => html`<div style="background:#0f1117;border-radius:8px;padding:10px;display:flex;gap:10px;align-items:center">
          <div style="width:36px;height:36px;border-radius:50%;background:${m.color};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;flex-shrink:0">${m.avatar}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:11px;font-weight:600">${m.name}</div>
            <div style="font-size:9px;color:#6b7280">${m.role}</div>
            <div style="display:flex;gap:8px;margin-top:3px;font-size:9px">
              <span style="color:#3b82f6">${m.components} comps</span>
              <span style="color:#22c55e">${m.audits} audits</span>
              <span style="color:#ef4444">${m.findings} findings</span>
            </div>
          </div>
        </div>`)}
      </div>
      <div style="font-size:11px;font-weight:600;margin-bottom:6px">Recent Activity</div>
      ${[
        { user: 'Priya Patel', action: 'completed SLSA audit for', target: 'build pipeline', time: '30m ago', color: '#3b82f6' },
        { user: 'Alex Rivera', action: 'flagged new vulnerability in', target: 'event-stream dependency', time: '2h ago', color: '#ef4444' },
        { user: 'Chris Lee', action: 'updated SBOM for', target: 'production release v2.4', time: '4h ago', color: '#22c55e' },
        { user: 'Nina Kowalski', action: 'generated compliance report for', target: 'Q2 2026 NIST audit', time: '6h ago', color: '#f59e0b' },
      ].map(a => html`<div style="display:flex;gap:8px;padding:4px 0;border-bottom:1px solid #2a2d3a;font-size:11px">
        <div style="width:5px;height:5px;border-radius:50%;background:${a.color};margin-top:6px;flex-shrink:0"></div>
        <div style="flex:1"><span style="font-weight:600;color:#e2e8f0">${a.user}</span> <span style="color:#9ca3af">${a.action}</span> <span style="color:#e2e8f0">${a.target}</span></div>
        <span style="font-size:9px;color:#6b7280;white-space:nowrap">${a.time}</span>
      </div>`)}
    </div>`;
  }
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
    .sbom-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .sbom-table th { text-align: left; padding: 8px 10px; background: #1a1d27; color: #9ca3af; font-weight: 600; border-bottom: 1px solid #2a2d3a; position: sticky; top: 0; }
    .sbom-table td { padding: 8px 10px; border-bottom: 1px solid #1a1d27; }
    .sbom-table tr:hover td { background: #1a1d27; }
    .sbom-table tr.selected td { background: #1e2a3a; }
    .risk-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 4px; }
    .risk-critical { background: #f87171; }
    .risk-high { background: #fbbf24; }
    .risk-medium { background: #60a5fa; }
    .risk-low { background: #34d399; }
    .sev-critical { color: #f87171; font-weight: 700; }
    .sev-high { color: #fbbf24; font-weight: 600; }
    .sev-medium { color: #60a5fa; }
    .tag { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #374151; color: #d1d5db; }
    .supplier-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
    .supplier-card { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 14px; }
    .supplier-name { font-weight: 600; font-size: 14px; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
    .supplier-meta { display: flex; gap: 8px; flex-wrap: wrap; font-size: 11px; margin-bottom: 8px; }
    .supplier-score { font-size: 28px; font-weight: 700; margin: 8px 0; }
    .supplier-controls { display: flex; gap: 6px; flex-wrap: wrap; font-size: 10px; }
    .control-yes { color: #34d399; }
    .control-no { color: #f87171; }
    .path-list { display: flex; flex-direction: column; gap: 8px; }
    .path-card { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 12px; border-left: 3px solid; }
    .path-critical { border-left-color: #dc2626; }
    .path-high { border-left-color: #f59e0b; }
    .path-medium { border-left-color: #3b82f6; }
    .path-name { font-weight: 600; font-size: 13px; margin-bottom: 4px; }
    .path-desc { font-size: 12px; color: #9ca3af; margin-bottom: 6px; }
    .path-meta { display: flex; gap: 12px; font-size: 11px; flex-wrap: wrap; margin-bottom: 6px; }
    .mitigation-list { margin-top: 6px; font-size: 11px; }
    .mitigation-item { padding: 3px 0; color: #d1d5db; }
    .report-box { background: #0a0c10; border: 1px solid #2a2d3a; border-radius: 8px; padding: 16px; font-size: 12px; line-height: 1.8; max-height: 400px; overflow-y: auto; white-space: pre-wrap; font-family: 'JetBrains Mono', monospace; color: #d1d5db; }
    .empty-state { text-align: center; padding: 40px; color: #6b7280; }
    .detail-panel { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    @media (max-width: 640px) { .stats-bar { flex-direction: column; } .supplier-grid { grid-template-columns: 1fr; } }

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

  private _runAnalysis(): void {
    this._analyzing = true;
    this._progress = 0;
    this._sbom = [...SAMPLE_SBOM];
    this._suppliers = [...SAMPLE_SUPPLIERS];

    this._paths = [
      { id: 'SCP1', name: 'Transitive Dependency Compromise via event-stream', entryComponent: 'event-stream', targetComponent: 'Application (via flatmap-stream)', intermediateSteps: ['event-stream -> flatmap-stream -> crypto wallet steal'], attackType: 'malicious-package', feasibility: 7, impact: 9, riskScore: 8.5, description: 'Historic attack where flatmap-stream was injected as a dependency of event-stream to steal cryptocurrency wallets', mitigations: ['Lock dependency versions', 'Use npm audit', 'Pin exact versions', 'Review transitive dependencies'] },
      { id: 'SCP2', name: 'Maintainer Account Takeover (ua-parser-js)', entryComponent: 'ua-parser-js', targetComponent: 'Application', intermediateSteps: ['npm account takeover -> malicious version publish -> CI/CD install'], attackType: 'account-takeover', feasibility: 6, impact: 8, riskScore: 7.8, description: 'Attacker compromises maintainer npm account and publishes malicious version with cryptocurrency miner', mitigations: ['Enable 2FA for npm accounts', 'Monitor package versions', 'Use lockfiles', 'Verify package integrity'] },
      { id: 'SCP3', name: 'Dependency Confusion Attack', entryComponent: 'internal-package', targetComponent: 'Application', intermediateSteps: ['Higher version published to public registry -> CI/CD pulls public version'], attackType: 'dependency-confusion', feasibility: 5, impact: 9, riskScore: 7.5, description: 'Attacker publishes package with same name to public registry with higher version number', mitigations: ['Use scoped packages', 'Configure registry priority', 'Use internal package registry', 'Verify package source'] },
      { id: 'SCP4', name: 'CI/CD Pipeline Injection via node-ipc', entryComponent: 'node-ipc', targetComponent: 'Build System', intermediateSteps: ['Malicious version installed -> postinstall script executes -> build environment compromised'], attackType: 'code-injection', feasibility: 6, impact: 7, riskScore: 7.2, description: 'Postinstall scripts execute arbitrary code during npm install, potentially compromising build environment', mitigations: ['Disable lifecycle scripts (npm ignore-scripts)', 'Use --ignore-scripts flag', 'Audit postinstall scripts', 'Isolate build environment'] },
      { id: 'SCP5', name: 'Prototype Pollution via minimist', entryComponent: 'minimist', targetComponent: 'Application', intermediateSteps: ['User input -> minimist parse -> prototype pollution -> application logic bypass'], attackType: 'prototype-pollution', feasibility: 7, impact: 6, riskScore: 6.5, description: 'Prototype pollution in minimist can lead to application logic bypass or RCE in vulnerable downstream code', mitigations: ['Update to patched version', 'Use Object.create(null)', 'Implement input sanitization', 'Run npm audit regularly'] },
      { id: 'SCP6', name: 'Maintainer Sabotage (colors.js)', entryComponent: 'colors.js', targetComponent: 'Application', intermediateSteps: ['Maintainer pushes malicious update -> dependent projects break -> infinite loop DoS'], attackType: 'malicious-package', feasibility: 8, impact: 5, riskScore: 6.8, description: 'Maintainer intentionally breaks own packages as protest, causing downstream dependency failures', mitigations: ['Pin exact versions', 'Use lockfiles', 'Fork critical dependencies', 'Monitor for breaking changes'] },
    ].sort((a, b) => b.riskScore - a.riskScore);

    const totalVulns = this._sbom.reduce((s, e) => s + e.vulnerabilities.length, 0);
    const critVulns = this._sbom.reduce((s, e) => s + e.vulnerabilities.filter(v => v.severity === 'critical').length, 0);
    this._analysis = {
      id: 'SCA-' + Date.now(), timestamp: new Date().toISOString(), totalComponents: this._sbom.length,
      totalVulnerabilities: totalVulns, criticalVulns: critVulns, paths: this._paths,
      highestRiskScore: Math.max(...this._paths.map(p => p.riskScore)),
      supplierRisk: Math.round(this._suppliers.filter(s => s.securityScore < 50).length / this._suppliers.length * 100),
    };

    let p = 0;
    const iv = setInterval(() => {
      p += 8;
      this._progress = Math.min(p, 100);
      if (p >= 100) { clearInterval(iv); this._analyzing = false; }
    }, 150);
  }

  private _getRiskClass(score: number): string {
    if (score >= 8) return 'risk-critical';
    if (score >= 5) return 'risk-high';
    if (score >= 3) return 'risk-medium';
    return 'risk-low';
  }

  private _getSupplierScoreColor(score: number): string {
    if (score >= 70) return '#34d399';
    if (score >= 50) return '#fbbf24';
    return '#f87171';
  }

  private _generateReport(): void {
    if (!this._analysis) return;
    const lines: string[] = [];
    lines.push('# Supply Chain Security Analysis Report');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('## Summary');
    lines.push(`- Total Components: ${this._analysis.totalComponents}`);
    lines.push(`- Total Vulnerabilities: ${this._analysis.totalVulnerabilities}`);
    lines.push(`- Critical Vulnerabilities: ${this._analysis.criticalVulns}`);
    lines.push(`- Attack Paths: ${this._analysis.paths.length}`);
    lines.push(`- Highest Risk Score: ${this._analysis.highestRiskScore}`);
    lines.push(`- Supplier Risk Level: ${this._analysis.supplierRisk}%`);
    lines.push('');
    lines.push('## Attack Paths (Ordered by Risk)');
    this._paths.forEach(p => {
      lines.push(`### ${p.name} [Risk: ${p.riskScore}]`);
      lines.push(`- Entry: ${p.entryComponent} -> Target: ${p.targetComponent}`);
      lines.push(`- Attack Type: ${p.attackType.replace(/-/g, ' ')}`);
      lines.push(`- Feasibility: ${p.feasibility}/10 | Impact: ${p.impact}/10`);
      lines.push(`- ${p.description}`);
      lines.push(`- Mitigations: ${p.mitigations.join('; ')}`);
      lines.push('');
    });
    lines.push('## High Risk Suppliers');
    this._suppliers.filter(s => s.securityScore < 50).forEach(s => {
      lines.push(`- ${s.name}: Security Score ${s.securityScore}/100, Compromise History: ${s.compromiseHistory}`);
    });
    lines.push('');
    lines.push('## Recommendations');
    lines.push('1. Pin all dependency versions in lockfiles');
    lines.push('2. Enable npm audit in CI/CD pipeline');
    lines.push('3. Review and fork high-risk single-maintainer packages');
    lines.push('4. Implement software composition analysis (SCA) tooling');
    lines.push('5. Monitor for new vulnerabilities in dependencies');
    lines.push('6. Establish vendor security assessment program');
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
    a.download = `supply-chain-report-${Date.now()}.md`;
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
    const blob = new Blob(['supply-chain-attack export'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'supply-chain-attack-export.' + (format === 'markdown' ? 'md' : format); a.click();
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
        record.itemsScanned = this._items.length;
        record.findings = this._items.filter((x: any) => x.risk && x.risk !== 'low').length;
        record.criticalCount = this._items.filter((x: any) => x.risk === 'critical').length;
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
    this._items.forEach((item: any) => { const r = item.risk; if (riskDist[r] !== undefined) riskDist[r]++; else riskDist.medium++; });
    const total = this._items.length || 1;
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
    const data = this._items.slice(0, 10).map((item: any, i: number) => ({ name: (item.name || item.title || item.id || 'Item ' + i).substring(0, 8), score: ({critical: 10, high: 7, medium: 4, low: 1}}}}) as any)[item.risk]) || 2, risk: item.risk || 'medium' }));
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
      <div style="display:flex;gap:4px;margin-bottom:12px;border-bottom:1px solid #374151;padding-bottom:8px;flex-wrap:wrap">
        <button class="btn btn-sm ${this._settingsTab === 'audit' ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._settingsTab = 'audit'; }}>Audit</button>
        <button class="btn btn-sm ${this._settingsTab === 'history' ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._settingsTab = 'history'; }}>History</button>
        <button class="btn btn-sm ${this._settingsTab === 'settings' ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._settingsTab = 'settings'; }}>Settings</button>
        <button class="btn btn-sm ${this._settingsTab === 'cvss' ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._settingsTab = 'cvss'; }}>CVSS Calc</button>
        <button class="btn btn-sm ${this._settingsTab === 'vendor' ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._settingsTab = 'vendor'; }}>Vendor Matrix</button>
        <button class="btn btn-sm ${this._settingsTab === 'vuln-dist' ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._settingsTab = 'vuln-dist'; }}>Vuln Dist</button>
        <button class="btn btn-sm ${this._settingsTab === 'compliance' ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._settingsTab = 'compliance'; }}>Compliance</button>
        <button class="btn btn-sm ${this._settingsTab === 'team' ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._settingsTab = 'team'; }}>Team</button>
      </div>
      ${this._settingsTab === 'audit' ? this._renderAuditPanel() : ''}
      ${this._settingsTab === 'history' ? this._renderExecHistory() : ''}
      ${this._settingsTab === 'settings' ? this._renderSettingsPanel() : ''}
      ${this._settingsTab === 'cvss' ? this._renderCVSSCalculator() : ''}
      ${this._settingsTab === 'vendor' ? html`${this._renderVendorRiskMatrix()}${this._renderComplianceMap()}` : ''}
      ${this._settingsTab === 'vuln-dist' ? html`${this._renderVulnDistribution()}${this._renderRiskGauge()}${this._renderBarChart()}` : ''}
      ${this._settingsTab === 'compliance' ? html`${this._renderComplianceMap()}${this._renderVendorRiskMatrix()}` : ''}
      ${this._settingsTab === 'team' ? html`${this._renderTeamPanel()}${this._renderCVSSCalculator()}` : ''}
      <div style="display:flex;gap:8px;margin-top:8px">
        <div style="flex:1;padding:8px;border-radius:6px;border:1px solid #374151;background:#1f2937;color:#94a3b8;font-size:11px;cursor:pointer;text-align:center" @click=${() => { this._addAudit('export', 'Report exported'); }}>Export Report</div>
        <div style="flex:1;padding:8px;border-radius:6px;border:1px solid #374151;background:#1f2937;color:#94a3b8;font-size:11px;cursor:pointer;text-align:center" @click=${this._runScanWithHistory}>Run Analysis</div>
      </div>
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid #374151;display:flex;justify-content:space-between;font-size:10px;color:#6b7280">
        <span>Last scan: ${this._execHistory.length > 0 ? new Date(this._execHistory[0].timestamp).toLocaleString() : 'Never'}</span>
        <span>${this._items.length} items | ${this._auditTrail.length} audit entries</span>
      </div>
    </div>`;
  }



  // --- Domain Rules Engine ---
  @state() private _scaRules: { id: string; name: string; category: string; severity: Severity; enabled: boolean; lastEval: string; passRate: number }[] = [];
  private _initScaRules() {
    const rules = [
      { id: 'R-001', name: 'Primary Compliance Check', category: 'Core', severity: 'critical' as Severity, enabled: true, lastEval: '2026-04-23T08:00:00Z', passRate: 88 },
      { id: 'R-002', name: 'Secondary Validation', category: 'Operations', severity: 'high' as Severity, enabled: true, lastEval: '2026-04-23T07:30:00Z', passRate: 74 },
      { id: 'R-003', name: 'Tertiary Assessment', category: 'Infrastructure', severity: 'medium' as Severity, enabled: true, lastEval: '2026-04-23T06:00:00Z', passRate: 82 },
      { id: 'R-004', name: 'Quaternary Audit', category: 'Security', severity: 'critical' as Severity, enabled: true, lastEval: '2026-04-23T05:00:00Z', passRate: 65 },
      { id: 'R-005', name: 'Quinary Review', category: 'Governance', severity: 'high' as Severity, enabled: true, lastEval: '2026-04-23T04:00:00Z', passRate: 91 },
      { id: 'R-006', name: 'Senary Inspection', category: 'Access Control', severity: 'medium' as Severity, enabled: false, lastEval: '2026-04-22T20:00:00Z', passRate: 53 },
      { id: 'R-007', name: 'Septenary Check', category: 'Data Protection', severity: 'high' as Severity, enabled: true, lastEval: '2026-04-22T18:00:00Z', passRate: 78 },
      { id: 'R-008', name: 'Octenary Scan', category: 'Network', severity: 'critical' as Severity, enabled: true, lastEval: '2026-04-22T14:00:00Z', passRate: 96 },
    ];
    this._scaRules = rules;
  }
  private _evaluateScaRules(): { passed: number; failed: number; skipped: number; total: number } {
    let passed = 0, failed = 0, skipped = 0;
    this._scaRules.forEach(r => { if (!r.enabled) { skipped++; } else if (r.passRate >= 80) { passed++; } else { failed++; } });
    return { passed, failed, skipped, total: this._scaRules.length };
  }

  // --- CVSS Scoring ---
  @state() private _scacvssData: { itemId: string; vector: string; base: number; temporal: number; environmental: number; overall: number }[] = [];
  private _initScaCvss() {
    const vectors = ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', 'CVSS:3.1/AV:A/AC:H/PR:L/UI:R/S:C/C:L/I:L/A:N', 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N', 'CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H', 'CVSS:3.1/AV:N/AC:H/PR:H/UI:R/S:U/C:N/I:L/A:N'];
    this._scacvssData = vectors.map((v, i) => {
      const base = parseFloat((Math.random() * 6 + 3).toFixed(1));
      const temporal = parseFloat((base * (0.7 + Math.random() * 0.3)).toFixed(1));
      const environmental = parseFloat((temporal * (0.8 + Math.random() * 0.2)).toFixed(1));
      return { itemId: 'V-' + String(i + 1).padStart(3, '0'), vector: v, base, temporal, environmental, overall: environmental };
    });
  }

  // --- Anomaly Detection ---
  @state() private _scaanomalies: { id: string; type: string; severity: Severity; description: string; detected: string; confidence: number; affected: string[] }[] = [];
  private _runScaAnomalyDetection() {
    const types = [
      { type: 'Spike in violation rate', severity: 'high' as Severity, desc: 'Detected 280% increase in violations over the last 24 hours', affected: ['Core', 'Operations'] },
      { type: 'SLA breach pattern', severity: 'critical' as Severity, desc: 'Recurring SLA breaches on weekends indicating staffing gaps', affected: ['SLA', 'Staffing'] },
      { type: 'Baseline drift detected', severity: 'medium' as Severity, desc: 'Score drifted 10 points below established baseline over 7 days', affected: ['Metrics', 'Baseline'] },
      { type: 'Unusual escalation volume', severity: 'high' as Severity, desc: 'Escalation rate 2.5x above normal in infrastructure controls', affected: ['Infrastructure', 'Controls'] },
      { type: 'Stale findings accumulation', severity: 'low' as Severity, desc: '18 findings older than 90 days without status change', affected: ['Maintenance'] },
    ];
    this._scaanomalies = types.map((a, i) => ({
      id: 'ANO-' + String(i + 1).padStart(3, '0'), type: a.type, severity: a.severity,
      description: a.desc, detected: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
      confidence: parseFloat((0.65 + Math.random() * 0.30).toFixed(2)), affected: a.affected,
    }));
  }

  // --- Trend Prediction ---
  @state() private _scapredictions: { horizon: string; metric: string; current: number; predicted: number; direction: 'up' | 'down' | 'stable'; confidence: number }[] = [];
  private _generateScaPredictions() {
    this._scapredictions = [
      { horizon: '7 days', metric: 'Compliance Score', current: 78, predicted: 75, direction: 'down' as const, confidence: 0.82 },
      { horizon: '7 days', metric: 'Open Critical Items', current: 12, predicted: 15, direction: 'up' as const, confidence: 0.71 },
      { horizon: '30 days', metric: 'Overall Score', current: 78, predicted: 82, direction: 'up' as const, confidence: 0.64 },
      { horizon: '30 days', metric: 'SLA Rate', current: 88, predicted: 91, direction: 'up' as const, confidence: 0.73 },
      { horizon: '30 days', metric: 'Readiness', current: 72, predicted: 68, direction: 'down' as const, confidence: 0.59 },
      { horizon: '90 days', metric: 'Risk Score', current: 45, predicted: 38, direction: 'down' as const, confidence: 0.51 },
      { horizon: '90 days', metric: 'Maturity Level', current: 3.2, predicted: 3.5, direction: 'up' as const, confidence: 0.47 },
    ];
  }

  // --- Approval Workflow ---
  @state() private _scaApprovals: { id: string; title: string; requester: string; status: 'pending' | 'approved' | 'rejected' | 'expired'; createdAt: string; priority: Priority; type: string }[] = [];
  private _initScaApprovals() {
    this._scaApprovals = [
      { id: 'APR-001', title: 'Emergency exception request for critical finding', requester: 'Alice Chen', status: 'pending', createdAt: '2026-04-23T07:00:00Z', priority: 'p1', type: 'Exception' },
      { id: 'APR-002', title: 'Extend compliance deadline for quarterly audit', requester: 'Bob Martinez', status: 'pending', createdAt: '2026-04-22T18:00:00Z', priority: 'p2', type: 'Extension' },
      { id: 'APR-003', title: 'Disable security control for system migration', requester: 'Carol Wu', status: 'rejected', createdAt: '2026-04-22T14:00:00Z', priority: 'p1', type: 'Policy Change' },
      { id: 'APR-004', title: 'New assessment approval for third-party vendor', requester: 'Dave Kim', status: 'approved', createdAt: '2026-04-21T10:00:00Z', priority: 'p3', type: 'Vendor' },
      { id: 'APR-005', title: 'Network rule change for partner integration', requester: 'Eve Johnson', status: 'expired', createdAt: '2026-04-19T08:00:00Z', priority: 'p2', type: 'Network' },
    ];
  }
  private _approveScaItem(id: string) { const item = this._scaApprovals.find(a => a.id === id); if (item) item.status = 'approved'; this.requestUpdate(); }
  private _rejectScaItem(id: string) { const item = this._scaApprovals.find(a => a.id === id); if (item) item.status = 'rejected'; this.requestUpdate(); }

  // --- Activity Feed ---
  @state() private _scaActivity: { id: string; action: string; user: string; target: string; timestamp: string }[] = [];
  private _initScaActivity() {
    const actions = [
      { action: 'Updated compliance rule R-003', user: 'Alice Chen', target: 'Policy Update' },
      { action: 'Approved exception APR-004', user: 'Bob Martinez', target: 'Vendor Assessment' },
      { action: 'Created new finding F-1024', user: 'Carol Wu', target: 'Cloud Misconfiguration' },
      { action: 'Resolved finding F-0987', user: 'Dave Kim', target: 'Unencrypted Storage' },
      { action: 'Escalated finding F-1015 to P1', user: 'Eve Johnson', target: 'Exposed Credentials' },
      { action: 'Ran automated scan', user: 'System', target: 'Full Infrastructure' },
      { action: 'Updated risk score for asset A-2048', user: 'Alice Chen', target: 'Database Server' },
      { action: 'Rejected policy change request', user: 'Bob Martinez', target: 'Encryption Policy' },
    ];
    this._scaActivity = actions.map((a, i) => ({ id: 'ACT-' + String(i + 1).padStart(3, '0'), ...a, timestamp: new Date(Date.now() - i * 3600000).toISOString() }));
  }

  // --- Notification System ---
  @state() private _scaNotifications: { id: string; message: string; type: 'info' | 'warning' | 'error' | 'success'; read: boolean; timestamp: string }[] = [];
  private _initScaNotifications() {
    this._scaNotifications = [
      { id: 'NTF-001', message: 'Score dropped below threshold', type: 'warning', read: false, timestamp: new Date().toISOString() },
      { id: 'NTF-002', message: '3 items approaching SLA deadline within 24h', type: 'error', read: false, timestamp: new Date(Date.now() - 1800000).toISOString() },
      { id: 'NTF-003', message: 'Weekly report generated successfully', type: 'success', read: true, timestamp: new Date(Date.now() - 7200000).toISOString() },
      { id: 'NTF-004', message: 'New framework mapped to existing controls', type: 'info', read: true, timestamp: new Date(Date.now() - 14400000).toISOString() },
    ];
  }
  private _markScaNotifRead(id: string) { const n = this._scaNotifications.find(x => x.id === id); if (n) n.read = true; this.requestUpdate(); }

  // --- Panel Configuration ---
  @state() private _scaConfig: { layout: 'compact' | 'default' | 'expanded'; theme: 'dark' | 'midnight' | 'slate'; showAnomalies: boolean; showPredictions: boolean; autoRefresh: boolean; refreshInterval: number } = {
    layout: 'default', theme: 'dark', showAnomalies: true, showPredictions: true, autoRefresh: true, refreshInterval: 60,
  };
  private _scaPresets: { name: string; config: typeof this._scaConfig }[] = [
    { name: 'Analyst View', config: { layout: 'expanded', theme: 'dark', showAnomalies: true, showPredictions: false, autoRefresh: true, refreshInterval: 30 } },
    { name: 'Executive Summary', config: { layout: 'compact', theme: 'slate', showAnomalies: false, showPredictions: true, autoRefresh: false, refreshInterval: 300 } },
    { name: 'Audit Mode', config: { layout: 'expanded', theme: 'midnight', showAnomalies: true, showPredictions: true, autoRefresh: true, refreshInterval: 60 } },
  ];
  private _applyScaPreset(preset: typeof this._scaPresets[0]) { this._scaConfig = { ...preset.config }; this.requestUpdate(); }

  private _renderScaTreemapSVG(): string {
    const categories = [
      { name: 'Critical', value: 28, color: '#ef4444' },
      { name: 'High', value: 22, color: '#f97316' },
      { name: 'Medium', value: 18, color: '#eab308' },
      { name: 'Low', value: 14, color: '#22c55e' },
      { name: 'Info', value: 10, color: '#3b82f6' },
      { name: 'Monitoring', value: 8, color: '#8b5cf6' },
    ];
    const total = categories.reduce((s, c) => s + c.value, 0);
    const w = 480, h = 200;
    let svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg">';
    let x = 0, rowH = h, rowStart = 0, rowSum = 0;
    for (let i = 0; i < categories.length; i++) {
      const c = categories[i];
      if (rowSum + c.value > total * 0.55 && rowStart < i) {
        const rw = (rowSum / total) * w;
        let ry = 0;
        for (let j = rowStart; j < i; j++) {
          const ch = (categories[j].value / rowSum) * rowH;
          svg += '<rect x="' + x + '" y="' + ry + '" width="' + rw + '" height="' + ch + '" rx="3" fill="' + categories[j].color + '" opacity="0.35" stroke="' + categories[j].color + '" stroke-width="0.5"/>';
          svg += '<text x="' + (x + rw / 2) + '" y="' + (ry + ch / 2) + '" fill="#e2e8f0" font-size="8" text-anchor="middle" dominant-baseline="middle">' + categories[j].name + ' (' + categories[j].value + ')</text>';
          ry += ch;
        }
        x += rw; rowH = h; rowStart = i; rowSum = c.value;
      } else { rowSum += c.value; }
    }
    if (rowStart < categories.length) {
      const rw = w - x; let ry = 0;
      for (let j = rowStart; j < categories.length; j++) {
        const ch = (categories[j].value / rowSum) * rowH;
        svg += '<rect x="' + x + '" y="' + ry + '" width="' + rw + '" height="' + ch + '" rx="3" fill="' + categories[j].color + '" opacity="0.35" stroke="' + categories[j].color + '" stroke-width="0.5"/>';
        svg += '<text x="' + (x + rw / 2) + '" y="' + (ry + ch / 2) + '" fill="#e2e8f0" font-size="8" text-anchor="middle" dominant-baseline="middle">' + categories[j].name + ' (' + categories[j].value + ')</text>';
        ry += ch;
      }
    }
    svg += '</svg>';
    return svg;
  }

  private _renderScaSankeySVG(): string {
    const sources = ['Source A', 'Source B', 'Source C'];
    const targets = ['Target 1', 'Target 2', 'Target 3', 'Target 4'];
    const links: { s: number; t: number; v: number }[] = [
      { s: 0, t: 0, v: 14 }, { s: 0, t: 1, v: 8 }, { s: 0, t: 3, v: 5 },
      { s: 1, t: 1, v: 10 }, { s: 1, t: 2, v: 12 },
      { s: 2, t: 0, v: 6 }, { s: 2, t: 2, v: 9 }, { s: 2, t: 3, v: 7 },
    ];
    const w = 520, h = 180, lx = 20, rx = 400, nodeW = 14;
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
    const targetH: number[] = targets.map(() => 0);
    links.forEach(l => { targetH[l.t] += l.v; });
    const maxH = Math.max(...targets.map((_, i) => targetH[i]));
    const scaleY = (h - 10) / maxH;
    let svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg">';
    sources.forEach((s, i) => { const sy = 10 + i * (h - 10) / sources.length; svg += '<rect x="' + lx + '" y="' + sy + '" width="' + nodeW + '" height="12" rx="2" fill="#6366f1"/>'; svg += '<text x="' + (lx - 2) + '" y="' + (sy + 7) + '" fill="#9ca3af" font-size="7" text-anchor="end">' + s + '</text>'; });
    targets.forEach((t, i) => {
      const ty = (h - targetH[i] * scaleY) / 2;
      svg += '<rect x="' + rx + '" y="' + ty + '" width="' + nodeW + '" height="' + (targetH[i] * scaleY) + '" rx="2" fill="' + colors[i] + '"/>';
      svg += '<text x="' + (rx + nodeW + 3) + '" y="' + (ty + targetH[i] * scaleY / 2) + '" fill="#9ca3af" font-size="7">' + t + '</text>';
    });
    links.forEach(l => {
      const sx = lx + nodeW; const sy = 10 + l.s * (h - 10) / sources.length + 4;
      const tx = rx; const targetOffset = links.filter(ll => ll.t === l.t && ll.s < l.s).reduce((s, ll) => s + ll.v, 0);
      const ty = (h - targetH[l.t] * scaleY) / 2 + targetOffset * scaleY;
      const sw = l.v * 0.6; const tw = l.v * scaleY;
      const mx = (sx + tx) / 2;
      svg += '<path d="M' + sx + ' ' + (sy - sw / 2) + ' C' + mx + ' ' + (sy - sw / 2) + ' ' + mx + ' ' + ty + ' ' + tx + ' ' + ty + '" fill="' + colors[l.t] + '" opacity="0.25"/>';
      svg += '<path d="M' + sx + ' ' + (sy + sw / 2) + ' C' + mx + ' ' + (sy + sw / 2) + ' ' + mx + ' ' + (ty + tw) + ' ' + tx + ' ' + (ty + tw) + '" fill="' + colors[l.t] + '" opacity="0.25"/>';
    });
    svg += '</svg>';
    return svg;
  }

  // --- Render: Rules Engine ---
  private _renderScaRules(): any {
    const ev = this._evaluateScaRules();
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Rules Engine</div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <span class="badge badge-success">$${ev.passed} Passed</span>
          <span class="badge badge-error">$${ev.failed} Failed</span>
          <span class="badge" style="background:#374151">$${ev.skipped} Skipped</span>
          <span class="badge" style="background:#1f2937">$${ev.total} Total</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;max-height:140px;overflow-y:auto">
          $${this._scaRules.map(r => html`
            <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:#1f2937;border-radius:4px;font-size:10px">
              <span style="width:8px;height:8px;border-radius:50%;background:$${r.passRate >= 80 ? '#22c55e' : '#ef4444'}"></span>
              <span style="flex:1;font-weight:600">$${r.name}</span>
              <span style="color:#9ca3af">$${r.category}</span>
              <span class="badge badge-$${r.severity === 'critical' ? 'error' : r.severity === 'high' ? 'warning' : 'info'}">$${r.severity}</span>
              <span style="font-weight:700;color:$${r.passRate >= 80 ? '#22c55e' : '#ef4444'}">$${r.passRate}%</span>
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Anomaly Panel ---
  private _renderScaAnomalies(): any {
    const sc = (s: Severity) => s === 'critical' ? '#ef4444' : s === 'high' ? '#f97316' : s === 'medium' ? '#eab308' : '#22c55e';
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Anomaly Detection</div>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto">
          $${this._scaanomalies.map(a => html`
            <div style="padding:6px 8px;background:#1f2937;border-radius:4px;border-left:3px solid $${sc(a.severity)}">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
                <span class="badge badge-$${a.severity === 'critical' ? 'error' : a.severity === 'high' ? 'warning' : 'info'}">$${a.severity}</span>
                <span style="font-weight:600;font-size:10px">$${a.type}</span>
                <span style="margin-left:auto;font-size:9px;color:#9ca3af">$${(a.confidence * 100).toFixed(0)}%</span>
              </div>
              <div style="font-size:9px;color:#9ca3af;margin-bottom:3px">$${a.description}</div>
              <div style="display:flex;gap:4px">$${a.affected.map(af => html`<span class="badge" style="background:#374151;font-size:8px">$${af}</span>`)}</div>
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Predictions ---
  private _renderScaPredictions(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Trend Predictions</div>
        <div style="display:flex;flex-direction:column;gap:4px">
          $${this._scapredictions.map(pr => html`
            <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:#1f2937;border-radius:4px;font-size:10px">
              <span class="badge" style="background:#374151">$${pr.horizon}</span>
              <span style="flex:1">$${pr.metric}</span>
              <span style="color:#9ca3af">$${pr.current}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="$${pr.direction === 'up' ? '#22c55e' : pr.direction === 'down' ? '#ef4444' : '#eab308'}" stroke-width="2"><path d="$${pr.direction === 'up' ? 'M12 19V5M5 12l7-7 7 7' : pr.direction === 'down' ? 'M12 5v14M19 12l-7 7-7-7' : 'M5 12h14'}"/></svg>
              <span style="font-weight:700;color:$${pr.direction === 'up' ? '#22c55e' : pr.direction === 'down' ? '#ef4444' : '#eab308'}">$${pr.predicted}</span>
              <span style="font-size:8px;color:#6b7280">$${(pr.confidence * 100).toFixed(0)}%</span>
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Approvals ---
  private _renderScaApprovals(): any {
    const stc = (s: string) => s === 'pending' ? '#eab308' : s === 'approved' ? '#22c55e' : s === 'rejected' ? '#ef4444' : '#6b7280';
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Approval Workflow</div>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto">
          $${this._scaApprovals.map(a => html`
            <div style="padding:6px 8px;background:#1f2937;border-radius:4px">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
                <span style="width:8px;height:8px;border-radius:50%;background:$${stc(a.status)}"></span>
                <span style="font-weight:600;font-size:10px;flex:1">$${a.title}</span>
                <span class="badge badge-$${a.priority === 'p1' ? 'error' : a.priority === 'p2' ? 'warning' : 'info'}">$${a.priority}</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px;font-size:9px;color:#9ca3af;margin-bottom:3px">
                <span>By $${a.requester}</span><span>Type: $${a.type}</span>
                <span>Status: <span style="color:$${stc(a.status)};text-transform:capitalize">$${a.status}</span></span>
              </div>
              $${a.status === 'pending' ? html`
                <div style="display:flex;gap:4px;margin-top:4px">
                  <button class="btn success" style="padding:2px 8px;font-size:9px" @click=$${() => this._approveScaItem(a.id)}>Approve</button>
                  <button class="btn error" style="padding:2px 8px;font-size:9px" @click=$${() => this._rejectScaItem(a.id)}>Reject</button>
                </div>` : nothing}
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Activity Feed ---
  private _renderScaActivity(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Activity Feed</div>
        <div style="display:flex;flex-direction:column;gap:4px;max-height:140px;overflow-y:auto">
          $${this._scaActivity.map(a => html`
            <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:#1f2937;border-radius:4px;font-size:10px">
              <div style="width:20px;height:20px;border-radius:50%;background:#374151;display:flex;align-items:center;justify-content:center;font-size:9px">•</div>
              <div style="flex:1"><span style="font-weight:600">$${a.user}</span> $${a.action}</div>
              <span style="font-size:8px;color:#6b7280">$${new Date(a.timestamp).toLocaleTimeString()}</span>
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Notifications ---
  private _renderScaNotifications(): any {
    const tc = (t: string) => t === 'error' ? '#ef4444' : t === 'warning' ? '#eab308' : t === 'success' ? '#22c55e' : '#3b82f6';
    const unread = this._scaNotifications.filter(n => !n.read).length;
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Notifications $${unread > 0 ? html`<span class="badge badge-error">$${unread} new</span>` : nothing}</div>
        <div style="display:flex;flex-direction:column;gap:4px;max-height:120px;overflow-y:auto">
          $${this._scaNotifications.map(n => html`
            <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:$${n.read ? '#1f2937' : '#252a36'};border-radius:4px;font-size:10px;opacity:$${n.read ? '0.6' : '1'};cursor:pointer" @click=$${() => this._markScaNotifRead(n.id)}>
              <span style="width:8px;height:8px;border-radius:50%;background:$${tc(n.type)}"></span>
              <span style="flex:1">$${n.message}</span>
              $${!n.read ? html`<span style="width:6px;height:6px;border-radius:50%;background:#3b82f6"></span>` : nothing}
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Panel Config ---
  private _renderScaConfig(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Panel Configuration</div>
        <div style="display:flex;flex-direction:column;gap:6px;font-size:10px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Layout</span>
            <select class="form-input" style="flex:1" @change=$${(e: Event) => { this._scaConfig.layout = (e.target as HTMLSelectElement).value as any; this.requestUpdate(); }}>
              <option value="compact" ?selected=$${this._scaConfig.layout === 'compact'}>Compact</option>
              <option value="default" ?selected=$${this._scaConfig.layout === 'default'}>Default</option>
              <option value="expanded" ?selected=$${this._scaConfig.layout === 'expanded'}>Expanded</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Theme</span>
            <select class="form-input" style="flex:1" @change=$${(e: Event) => { this._scaConfig.theme = (e.target as HTMLSelectElement).value as any; this.requestUpdate(); }}>
              <option value="dark" ?selected=$${this._scaConfig.theme === 'dark'}>Dark</option>
              <option value="midnight" ?selected=$${this._scaConfig.theme === 'midnight'}>Midnight</option>
              <option value="slate" ?selected=$${this._scaConfig.theme === 'slate'}>Slate</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Auto Refresh</span>
            <input type="checkbox" ?checked=$${this._scaConfig.autoRefresh} @change=$${() => { this._scaConfig.autoRefresh = !this._scaConfig.autoRefresh; this.requestUpdate(); }}/>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Show Anomalies</span>
            <input type="checkbox" ?checked=$${this._scaConfig.showAnomalies} @change=$${() => { this._scaConfig.showAnomalies = !this._scaConfig.showAnomalies; this.requestUpdate(); }}/>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Show Predictions</span>
            <input type="checkbox" ?checked=$${this._scaConfig.showPredictions} @change=$${() => { this._scaConfig.showPredictions = !this._scaConfig.showPredictions; this.requestUpdate(); }}/>
          </div>
          <div style="margin-top:6px;font-weight:600">Presets</div>
          <div style="display:flex;gap:4px">
            $${this._scaPresets.map(ps => html`<button class="btn" style="padding:2px 8px;font-size:9px" @click=$${() => this._applyScaPreset(ps)}>$${ps.name}</button>`)}
          </div>
        </div>
      </div>`;
  }

  render() {
    return html`
      <div class="panel">
        <div class="header">
          <div class="title"><span>&#x1F517;</span> Supply Chain Attack Analyzer</div>
          <div class="btn-row">
            <button class="btn btn-secondary btn-sm" @click=${() => { this._sbom = []; this._suppliers = []; this._paths = []; this._analysis = null; }}>Reset</button>
            <button class="btn btn-secondary btn-sm" @click=${this._generateReport} ?disabled=${!this._analysis}>Generate Report</button>
          </div>
        </div>

        ${this._analysis ? html`
          <div class="stats-bar">
            <div class="stat"><div class="stat-value">${this._analysis.totalComponents}</div><div class="stat-label">Components</div></div>
            <div class="stat"><div class="stat-value" style="color:#f87171">${this._analysis.criticalVulns}</div><div class="stat-label">Critical Vulns</div></div>
            <div class="stat"><div class="stat-value" style="color:#fbbf24">${this._analysis.totalVulnerabilities}</div><div class="stat-label">Total Vulns</div></div>
            <div class="stat"><div class="stat-value" style="color:#f87171">${this._analysis.highestRiskScore}</div><div class="stat-label">Max Risk</div></div>
            <div class="stat"><div class="stat-value" style="color:#fbbf24">${this._analysis.supplierRisk}%</div><div class="stat-label">Supplier Risk</div></div>
          </div>
        ` : nothing}

        <div class="btn-row">
          <button class="btn btn-primary" @click=${this._runAnalysis} ?disabled=${this._analyzing}>
            ${this._analysis ? 'Re-analyze Supply Chain' : 'Analyze Supply Chain'}
          </button>
        </div>

        ${this._analyzing ? html`<div class="progress-bar"><div class="progress-fill" style="width:${this._progress}%"></div></div>` : nothing}

        ${this._analysis ? html`
          <div class="tabs">
            <button class="tab ${this._activeTab === 'sbom' ? 'active' : ''}" @click=${() => { this._activeTab = 'sbom'; }}>SBOM (${this._sbom.length})</button>
            <button class="tab ${this._activeTab === 'suppliers' ? 'active' : ''}" @click=${() => { this._activeTab = 'suppliers'; }}>Suppliers (${this._suppliers.length})</button>
            <button class="tab ${this._activeTab === 'paths' ? 'active' : ''}" @click=${() => { this._activeTab = 'paths'; }}>Attack Paths (${this._paths.length})</button>
            <button class="tab ${this._activeTab === 'report' ? 'active' : ''}" @click=${() => { this._activeTab = 'report'; }}>Report</button>
          </div>

          ${this._activeTab === 'sbom' ? this._renderSBOM() : nothing}
          ${this._activeTab === 'suppliers' ? this._renderSuppliers() : nothing}
          ${this._activeTab === 'paths' ? this._renderPaths() : nothing}
          ${this._activeTab === 'report' ? this._renderReport() : nothing}
        ` : html`<div class="empty-state">Click "Analyze Supply Chain" to start the analysis</div>`}
      </div>
      </div>
      <div style="margin-top:12px;display:flex;justify-content:center">
        <button class="btn btn-sm ${this._showEnhanced ? 'btn-primary' : 'btn-secondary'}" @click=${() => {{ this._showEnhanced = !this._showEnhanced; this.requestUpdate(); }}>${this._showEnhanced ? 'Hide' : 'Show'} Advanced</button>
      </div>
      ${this._renderEnhancedSection()}
    `;
  }

  private _renderSBOM() {
    const filtered = this._sbom.filter(e => {
      if (this._filterRisk !== 'all') {
        const rs = e.riskScore;
        if (this._filterRisk === 'critical' && rs < 7) return false;
        if (this._filterRisk === 'high' && (rs < 5 || rs >= 7)) return false;
        if (this._filterRisk === 'medium' && (rs < 3 || rs >= 5)) return false;
        if (this._filterRisk === 'low' && rs >= 3) return false;
      }
      return this._filterType === 'all' || e.type === this._filterType;
    });

    return html`
      <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
        <select .value=${this._filterRisk} @change=${(e: Event) => { this._filterRisk = (e.target as HTMLSelectElement).value as any; } style="background:#1a1d27;border:1px solid #2a2d3a;border-radius:6px;padding:6px 12px;color:#e2e8f0;font-size:12px;font-family:inherit">
          <option value="all">All Risk Levels</option><option value="critical">Critical (7+)</option><option value="high">High (5-7)</option><option value="medium">Medium (3-5)</option><option value="low">Low (<3)</option>
        </select>
        <select .value=${this._filterType} @change=${(e: Event) => { this._filterType = (e.target as HTMLSelectElement).value as any; } style="background:#1a1d27;border:1px solid #2a2d3a;border-radius:6px;padding:6px 12px;color:#e2e8f0;font-size:12px;font-family:inherit">
          <option value="all">All Types</option><option value="direct">Direct</option><option value="transitive">Transitive</option><option value="dev">Dev</option>
        </select>
      </div>
      <div style="max-height:400px;overflow-y:auto">
        <table class="sbom-table">
          <thead><tr><th></th><th>Package</th><th>Version</th><th>Type</th><th>Risk</th><th>Vulns</th><th>Supplier</th></tr></thead>
          <tbody>${filtered.map(e => html`
            <tr class="${this._selectedComponent?.id === e.id ? 'selected' : ''}" @click=${() => { this._selectedComponent = this._selectedComponent?.id === e.id ? null : e; }}>
              <td><span class="risk-dot ${this._getRiskClass(e.riskScore)}"></span></td>
              <td style="font-weight:500">${e.name}</td>
              <td>${e.version}</td>
              <td><span class="tag">${e.type}</span></td>
              <td style="font-weight:600;color:${e.riskScore >= 7 ? '#f87171' : e.riskScore >= 5 ? '#fbbf24' : '#60a5fa'}">${e.riskScore}</td>
              <td>${e.vulnerabilities.map(v => html`<span class="sev-${v.severity}">[${v.severity[0].toUpperCase()}]</span> `)}</td>
              <td style="font-size:11px;color:#9ca3af">${e.supplier}</td>
            </tr>
          `)}</tbody>
        </table>
      </div>
      ${this._selectedComponent ? html`
        <div class="detail-panel" style="margin-top:12px">
          <div style="font-weight:600;font-size:14px;margin-bottom:8px">${this._selectedComponent.name} @ ${this._selectedComponent.version}</div>
          <div style="font-size:12px;display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
            <div>Ecosystem: ${this._selectedComponent.ecosystem}</div>
            <div>License: ${this._selectedComponent.license}</div>
            <div>Direct Deps: ${this._selectedComponent.directDependencies}</div>
            <div>Transitive Deps: ${this._selectedComponent.transitiveDependencies}</div>
            <div>Last Updated: ${this._selectedComponent.lastUpdated}</div>
            <div>Risk Score: <strong>${this._selectedComponent.riskScore}</strong></div>
          </div>
          ${this._selectedComponent.vulnerabilities.length > 0 ? html`
            <div style="font-weight:600;font-size:12px;margin-bottom:4px">Vulnerabilities</div>
            ${this._selectedComponent.vulnerabilities.map(v => html`
              <div style="font-size:11px;padding:4px 0;border-bottom:1px solid #2a2d3a">
                <span class="sev-${v.severity}">[${v.severity.toUpperCase()}]</span> ${v.id}: ${v.title} (CVSS ${v.cvss})
                ${v.patched ? html`<span style="color:#34d399">Patched in ${v.patchVersion}</span>` : html`<span style="color:#f87171">No patch available</span>`}
              </div>
            `)}
          ` : html`<div style="font-size:12px;color:#34d399">No known vulnerabilities</div>`}
        </div>
      ` : nothing}
    `;
  }

  private _renderSuppliers() {
    return html`<div class="supplier-grid">${this._suppliers.sort((a, b) => a.securityScore - b.securityScore).map(s => html`
      <div class="supplier-card">
        <div class="supplier-name">${s.name} <span class="tag">${s.type}</span></div>
        <div class="supplier-score" style="color:${this._getSupplierScoreColor(s.securityScore)}">${s.securityScore}</div>
        <div class="supplier-meta">
          <span>Criticality: <span class="sev-${s.criticality}">${s.criticality}</span></span>
          <span>Last Audit: ${s.lastAudit}</span>
          <span>Compromises: ${s.compromiseHistory}</span>
        </div>
        <div style="font-size:11px;margin-bottom:6px">Components: ${s.components.join(', ')}</div>
        <div class="supplier-controls">
          <span class="${s.mfaEnabled ? 'control-yes' : 'control-no'}">MFA: ${s.mfaEnabled ? 'Yes' : 'No'}</span>
          <span class="${s.signedReleases ? 'control-yes' : 'control-no'}">Signed: ${s.signedReleases ? 'Yes' : 'No'}</span>
          <span style="color:#9ca3af">Review: ${s.reviewProcess}</span>
        </div>
      </div>
    `)}</div>`;
  }

  private _renderPaths() {
    return html`<div class="path-list">${this._paths.map(p => html`
      <div class="path-card path-${p.riskScore >= 8 ? 'critical' : p.riskScore >= 6 ? 'high' : 'medium'}">
        <div class="path-name">${p.name}</div>
        <div class="path-desc">${p.description}</div>
        <div class="path-meta">
          <span>Risk: <strong style="color:${p.riskScore >= 8 ? '#f87171' : '#fbbf24'}">${p.riskScore}</strong></span>
          <span>Feasibility: ${p.feasibility}/10</span>
          <span>Impact: ${p.impact}/10</span>
          <span class="tag">${p.attackType.replace(/-/g, ' ')}</span>
        </div>
        <div style="font-size:11px;margin-bottom:4px"><strong>Path:</strong> ${p.intermediateSteps.join(' -> ')}</div>
        <div class="mitigation-list"><strong style="color:#9ca3af">Mitigations:</strong>
          ${p.mitigations.map(m => html`<div class="mitigation-item">- ${m}</div>`)}
        </div>
      </div>
    `)}</div>`;
  }

  private _renderReport() {
    if (!this._showReport) return html`<div class="empty-state">Click "Generate Report" to create the analysis report</div>`;
    return html`<div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-weight:600;font-size:14px">Supply Chain Analysis Report</span>
        <button class="btn btn-primary btn-sm" @click=${this._exportReport}>Export Markdown</button>
      </div>
      <div class="report-box">${this._reportContent}</div>
    </div>`;
  }
}
