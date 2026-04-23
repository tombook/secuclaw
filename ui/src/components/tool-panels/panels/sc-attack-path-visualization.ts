/**
 * sc-attack-path-visualization — Attack Path Visualization (Security Expert Core)
 * Directed graph showing multi-stage attack path with risk score and asset impact analysis
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface AttackNode {
  id: string;
  name: string;
  type: 'entry' | 'lateral' | 'asset' | 'data';
  risk: 'critical' | 'high' | 'medium' | 'low';
  cve?: string;
  description: string;
  x: number;
  y: number;
}

interface AttackEdge {
  from: string;
  to: string;
  technique: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  successRate: number;
  description: string;
}

@customElement('sc-attack-path-visualization')
export class ScAttackPathVisualization extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: var(--text-primary, #e2e8f0); }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: var(--bg-primary, #111827); border-radius: 12px; padding: 20px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
    .stats { display: flex; gap: 10px; flex-wrap: wrap; }
    .stat { background: var(--bg-tertiary, #0a0e17); border-radius: 6px; padding: 6px 12px; min-width: 70px; text-align: center; }
    .sv { font-size: 16px; font-weight: 700; }
    .sl { font-size: 10px; color: var(--text-tertiary, #94a3b8); }
    .sv.critical { color: #ef4444; }
    .sv.high { color: #f97316; }
    .sv.medium { color: #eab308; }
    .sv.low { color: #22c55e; }
    .controls-right { display: flex; gap: 6px; }
    .btn { padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; background: var(--bg-secondary, #1f2937); border: 1px solid var(--border-color, #374151); color: var(--text-secondary, #94a3b8); transition: all 0.2s; }
    .btn.active { background: var(--accent-color, #3b82f6); color: white; border-color: var(--accent-color, #3b82f6); }
    .btn:hover { border-color: var(--accent-color, #3b82f6); color: var(--text-primary, #e2e8f0); }
    svg { width: 100%; height: 350px; margin-bottom: 16px; border-radius: 8px; background: var(--bg-tertiary, #0a0e17); }
    .node { cursor: pointer; transition: all 0.2s; }
    .node:hover { filter: brightness(1.3); }
    .node.critical circle { fill: #7f1d1d; stroke: #ef4444; stroke-width: 2; }
    .node.high circle { fill: #431407; stroke: #f97316; stroke-width: 2; }
    .node.medium circle { fill: #422006; stroke: #eab308; stroke-width: 2; }
    .node.low circle { fill: #052e16; stroke: #22c55e; stroke-width: 2; }
    .node text { fill: var(--text-primary, #e2e8f0); font-size: 11px; font-weight: 600; text-anchor: middle; }
    .edge { stroke-width: 2; opacity: 0.7; }
    .edge.critical { stroke: #ef4444; }
    .edge.high { stroke: #f97316; }
    .edge.medium { stroke: #eab308; }
    .edge.low { stroke: #22c55e; }
    .edge-label { fill: var(--text-tertiary, #94a3b8); font-size: 9px; text-anchor: middle; }
    .legend { display: flex; gap: 16px; align-items: center; justify-content: center; margin-bottom: 16px; flex-wrap: wrap; }
    .legend-item { display: flex; align-items: center; gap: 4px; font-size: 11px; }
    .legend-color { width: 12px; height: 12px; border-radius: 50%; }
    .legend-color.critical { background: #ef4444; }
    .legend-color.high { background: #f97316; }
    .legend-color.medium { background: #eab308; }
    .legend-color.low { background: #22c55e; }
    .details-panel { background: var(--bg-secondary, #1f2937); border-radius: 8px; padding: 14px; border: 1px solid var(--border-color, #374151); }
    .details-title { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
    .details-content { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px; font-size: 12px; }
    .detail-item { display: flex; flex-direction: column; gap: 2px; }
    .detail-label { color: var(--text-tertiary, #94a3b8); font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .detail-value { line-height: 1.4; }
    .mitigation { background: rgba(34, 197, 94, 0.1); color: #86efac; padding: 3px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; display: inline-block; margin-top: 4px; }
    .risk-badge { padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; display: inline-block; }
    .risk-badge.critical { background: #450a0a; color: #fca5a5; }
    .risk-badge.high { background: #431407; color: #fdba74; }
    .risk-badge.medium { background: #422006; color: #fde047; }
    .risk-badge.low { background: #052e16; color: #86efac; }
    .tab-bar { display: flex; gap: 4px; margin-bottom: 14px; flex-wrap: wrap; }
    .tab-btn { padding: 6px 14px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; background: transparent; color: #94a3b8; border: 1px solid transparent; }
    .tab-btn:hover { background: #1f2937; }
    .tab-btn.active { background: #06b6d4; color: #fff; border-color: #06b6d4; }
    .technique-table { width: 100%; font-size: 11px; border-collapse: collapse; margin-top: 10px; }
    .technique-table th { text-align: left; padding: 6px 8px; color: #94a3b8; font-size: 10px; border-bottom: 2px solid #374151; }
    .technique-table td { padding: 6px 8px; border-bottom: 1px solid #1f2937; }
    .technique-table tr:hover td { background: #1f293720; }
    .playbook-step { display: flex; gap: 12px; padding: 12px; background: #0f172a; border-radius: 8px; margin-bottom: 8px; align-items: flex-start; }
    .step-num { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .step-num.done { background: #22c55e; color: #fff; }
    .step-num.active { background: #f59e0b; color: #111; }
    .step-num.wait { background: #374151; color: #94a3b8; }
    .step-content { flex: 1; }
    .step-name { font-size: 13px; font-weight: 600; }
    .step-desc { font-size: 11px; color: #94a3b8; margin-top: 2px; }
    .tech-tag { font-size: 9px; padding: 2px 6px; background: #3b82f620; color: #60a5fa; border-radius: 3px; font-weight: 600; margin: 2px; display: inline-block; }
    .comparison-card { background: #1f2937; border-radius: 8px; padding: 14px; border: 1px solid #374151; }
    .comparison-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
    .gauge-wrap { display: flex; flex-direction: column; align-items: center; }
    .gauge-label { font-size: 10px; color: #6b7280; margin-top: 4px; }
    .export-btn { padding: 10px 20px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; transition: all 0.2s; }
    .export-btn:hover { border-color: #06b6d4; background: #06b6d420; }
    .heatmap-grid { display: grid; gap: 2px; }
    .heatmap-cell { width: 100%; aspect-ratio: 1; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 600; color: #fff; }
    .exec-pipeline { background: #0f172a; border-radius: 8px; padding: 14px; margin-bottom: 12px; }
    .pipeline-step { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #1f2937; }
    .pipeline-step:last-child { border-bottom: none; }
    .step-icon { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .step-icon.pending { background: #374151; color: #6b7280; }
    .step-icon.running { background: #06b6d420; color: #06b6d4; animation: pulse 1.5s infinite; }
    .step-icon.done { background: #22c55e20; color: #22c55e; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
    .step-info { flex: 1; }
    .step-name { font-size: 12px; font-weight: 600; }
    .step-desc { font-size: 10px; color: #6b7280; margin-top: 2px; }
    .step-time { font-size: 10px; color: #94a3b8; min-width: 60px; text-align: right; }
    .config-section { background: #0f172a; border-radius: 8px; padding: 14px; margin-bottom: 12px; }
    .config-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1f2937; }
    .config-row:last-child { border-bottom: none; }
    .config-label { font-size: 12px; color: #e2e8f0; }
    .config-desc { font-size: 10px; color: #6b7280; margin-top: 2px; }
    .config-toggle { position: relative; width: 40px; height: 22px; background: #374151; border-radius: 11px; cursor: pointer; transition: background 0.3s; border: none; }
    .config-toggle.on { background: #06b6d4; }
    .config-toggle::after { content: ''; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; background: #fff; border-radius: 50%; transition: transform 0.3s; }
    .config-toggle.on::after { transform: translateX(18px); }
    .audit-entry { display: flex; gap: 8px; padding: 6px 0; border-bottom: 1px solid #1f2937; font-size: 10px; }
    .audit-time { color: #6b7280; min-width: 120px; flex-shrink: 0; }
    .audit-action { color: #06b6d4; font-weight: 600; min-width: 100px; }
    .audit-detail { color: #94a3b8; }
    .sla-timer { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #0f172a; border-radius: 6px; margin-bottom: 6px; }
    .sla-bar { flex: 1; height: 6px; background: #374151; border-radius: 3px; overflow: hidden; }
    .sla-fill { height: 100%; border-radius: 3px; transition: width 0.5s; }
    .sla-label { font-size: 10px; min-width: 60px; text-align: right; font-weight: 600; }
    .form-group { margin-bottom: 12px; }
    .form-label { display: block; font-size: 11px; font-weight: 600; color: #94a3b8; margin-bottom: 4px; }
    .form-input { width: 100%; padding: 8px 12px; background: #0f172a; border: 1px solid #374151; border-radius: 6px; color: #e2e8f0; font-size: 12px; outline: none; }
    .form-input:focus { border-color: #06b6d4; }
    .sla-bar { display: flex; align-items: center; gap: 12px; background: #1f2937; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; }
    .sla-indicator { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
  `;

  @state() private _selectedNode: AttackNode | null = null;
  @state() private _showSuccessRate = true;
  @state() private _tabView: 'graph' | 'techniques' | 'playbook' | 'export' | 'analysis' | 'audit' | 'config' = 'graph';
  @state() private _execPhase = 'idle';
  @state() private _execProgress = 0;
  @state() private _execSteps: { name: string; desc: string; status: 'pending' | 'running' | 'done'; duration: number }[] = [];
  @state() private _execResults: { step: string; output: string; timestamp: string }[] = [];
  @state() private _auditLog: { timestamp: string; action: string; user: string; detail: string }[] = [];
  @state() private _configSettings: { autoScore: boolean; mitreMap: boolean; realTime: boolean; exportEncrypted: boolean; slaTracking: boolean; historicalData: boolean } = { autoScore: true, mitreMap: true, realTime: true, exportEncrypted: false, slaTracking: true, historicalData: true };
  @state() private _selectedEdge: AttackEdge | null = null;
  @state() private _simulationRunning = false;
  @state() private _simulationStep = 0;
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


  private _mitreMapping: Record<string, { technique: string; tactic: string }> = {
    'Exploit RCE': { technique: 'T1190', tactic: 'Initial Access' },
    'Priv Esc': { technique: 'T1548', tactic: 'Privilege Escalation' },
    'Lateral Movement': { technique: 'T1550', tactic: 'Lateral Movement' },
    'DB Access': { technique: 'T1555', tactic: 'Credential Access' },
    'File Share Access': { technique: 'T1021', tactic: 'Lateral Movement' },
    'Data Exfiltration': { technique: 'T1048', tactic: 'Exfiltration' },
  };

  private _playbookSteps = [
    { step: 1, name: 'Reconnaissance', desc: 'Identify attack surface, map external entry points and exposed services', status: 'done' as const, techniques: ['T1595', 'T1046', 'T1592'] },
    { step: 2, name: 'Weaponization', desc: 'Develop exploit payloads targeting identified vulnerabilities', status: 'done' as const, techniques: ['T1588', 'T1602'] },
    { step: 3, name: 'Initial Access', desc: 'Gain foothold through RCE or phishing', status: 'done' as const, techniques: ['T1190', 'T1566'] },
    { step: 4, name: 'Privilege Escalation', desc: 'Escalate from low-privilege user to administrator', status: 'active' as const, techniques: ['T1548', 'T1068'] },
    { step: 5, name: 'Lateral Movement', desc: 'Move across network to reach high-value targets', status: 'wait' as const, techniques: ['T1550', 'T1021'] },
    { step: 6, name: 'Data Collection', desc: 'Locate and stage sensitive data for exfiltration', status: 'wait' as const, techniques: ['T1005', 'T1083'] },
    { step: 7, name: 'Exfiltration', desc: 'Transfer stolen data to external C2 infrastructure', status: 'wait' as const, techniques: ['T1048', 'T1041'] },
    { step: 8, name: 'Impact', desc: 'Deploy ransomware or maintain persistence', status: 'wait' as const, techniques: ['T1486', 'T1078'] },
  ];

  private _runSimulation() {
    this._simulationRunning = true;
    this._simulationStep = 0;
    const interval = setInterval(() => {
      this._simulationStep++;
      if (this._simulationStep >= this._edges.length) {
        this._simulationRunning = false;
        clearInterval(interval);
      }
      this.requestUpdate();
    }, 800);
  }

  private _stopSimulation() {
    this._simulationRunning = false;
    this._simulationStep = 0;
  }

  private _exportJSON() {
    const data = { nodes: this._nodes, edges: this._edges, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'attack-path.json'; a.click();
  }

  private _exportCSV() {
    const header = 'From,To,Technique,Severity,SuccessRate,Description\n';
    const rows = this._edges.map(e => `"${e.from}","${e.to}","${e.technique}",${e.severity},${e.successRate}%,"${e.description}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'attack-path.csv'; a.click();
  }

  private _exportMarkdown() {
    const md = '# Attack Path Analysis\n\n## Nodes\n| ID | Name | Type | Risk |\n|---|---|---|---|\n'
      + this._nodes.map(n => `| ${n.id} | ${n.name.replace(/\n/g, ' ')} | ${n.type} | ${n.risk} |`).join('\n')
      + '\n## Edges\n| From | To | Technique | Severity | Success Rate |\n|---|---|---|---|---|\n'
      + this._edges.map(e => `| ${e.from} | ${e.to} | ${e.technique} | ${e.severity} | ${e.successRate}% |`).join('\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'attack-path.md'; a.click();
  }

  private _heatmapSVG(): string {
    const techniques = this._edges.map(e => e.technique);
    const unique = [...new Set(techniques)];
    const W = 300, H = 120, cellW = W / 7, cellH = H / unique.length;
    const colors = ['#22c55e', '#eab308', '#f97316', '#ef4444'];
    const stages = ['Recon', 'Access', 'Privesc', 'Lateral', 'Collect', 'Exfil', 'Impact'];
    let rects = '';
    stages.forEach((stage, sx) => {
      unique.forEach((tech, ty) => {
        const val = Math.floor(Math.random() * 4);
        const x = sx * cellW, y = ty * cellH;
        rects += `<rect x="${x+1}" y="${y+1}" width="${cellW-2}" height="${cellH-2}" rx="2" fill="${colors[val]}" fill-opacity="0.7"/>`;
      });
    });
    const labels = stages.map((s, i) => `<text x="${i * cellW + cellW/2}" y="${H - 2}" text-anchor="middle" fill="#6b7280" font-size="7">${s}</text>`).join('');
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}">${rects}${labels}</svg>`;
  }

  private _funnelSVG(): string {
    const stages = [
      { label: 'Recon', value: 100 }, { label: 'Initial Access', value: 78 },
      { label: 'Priv Esc', value: 52 }, { label: 'Lateral Move', value: 38 },
      { label: 'Data Access', value: 25 }, { label: 'Exfiltration', value: 15 },
    ];
    const W = 260, H = 120, maxW = W - 20;
    let rects = '';
    let y = 5;
    stages.forEach(s => {
      const w = Math.max(20, (s.value / 100) * maxW);
      const x = (W - w) / 2;
      const h = (H - 30) / stages.length - 2;
      const color = s.value >= 60 ? '#22c55e' : s.value >= 30 ? '#eab308' : '#ef4444';
      rects += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${color}" fill-opacity="0.6"/>`;
      rects += `<text x="${W/2}" y="${y + h/2 + 3}" text-anchor="middle" fill="#fff" font-size="8" font-weight="600">${s.label} (${s.value}%)</text>`;
      y += h + 2;
    });
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}">${rects}</svg>`;
  }

  private _nodes: AttackNode[] = [
    { id: '1', name: 'External IP\n192.168.1.100', type: 'entry', risk: 'high', description: 'Internet exposed web server, open port 443/80', x: 100, y: 175 },
    { id: '2', name: 'Web Server\nCVE-2026-1234', type: 'lateral', risk: 'critical', cve: 'CVE-2026-1234 (CVSS 10.0)', description: 'Unpatched Log4j RCE vulnerability, attacker gets initial foothold', x: 250, y: 100 },
    { id: '3', name: 'Application Server\nPrivEsc', type: 'lateral', risk: 'high', description: 'Privilege escalation from www-data to root via CVE-2026-4567', x: 250, y: 250 },
    { id: '4', name: 'Domain Controller\nKerberoast', type: 'lateral', risk: 'critical', description: 'Kerberoast attack gets DA credential via SPN service ticket', x: 400, y: 75 },
    { id: '5', name: 'User Database\n(Customer PII)', type: 'asset', risk: 'critical', description: 'Production DB with 2.3M customer records, SSN, credit card info', x: 400, y: 175 },
    { id: '6', name: 'File Server\n(Confidential Docs)', type: 'asset', risk: 'high', description: 'File share with financial records, intellectual property', x: 400, y: 275 },
    { id: '7', name: 'Data Exfiltration\nTo C2 Server', type: 'data', risk: 'critical', description: '50GB sensitive data exfiltrated over DNS tunnel', x: 550, y: 175 },
  ];

  private _edges: AttackEdge[] = [
    { from: '1', to: '2', technique: 'Exploit RCE', severity: 'critical', successRate: 95, description: 'Exploit Log4j vulnerability to get reverse shell' },
    { from: '2', to: '3', technique: 'Priv Esc', severity: 'high', successRate: 85, description: 'Local privilege escalation to root access' },
    { from: '3', to: '4', technique: 'Lateral Movement', severity: 'high', successRate: 75, description: 'Pass the hash attack using dumped credentials' },
    { from: '3', to: '5', technique: 'DB Access', severity: 'critical', successRate: 90, description: 'Access DB using hardcoded credential' },
    { from: '4', to: '6', technique: 'File Share Access', severity: 'medium', successRate: 65, description: 'Access file share using DA account' },
    { from: '4', to: '7', technique: 'Data Exfiltration', severity: 'critical', successRate: 80, description: 'Exfiltrate data via DNS tunnel to external C2' },
    { from: '5', to: '7', technique: 'Data Exfiltration', severity: 'critical', successRate: 95, description: 'Dump DB and exfiltrate sensitive records' },
    { from: '6', to: '7', technique: 'Data Exfiltration', severity: 'high', successRate: 70, description: 'Exfiltrate confidential documents' },
  ];

  private _initAuditLog() {
    this._auditLog = [
      { timestamp: '2026-04-22T14:00:00Z', action: 'PATH_ANALYSIS', user: 'Analyst', detail: 'Completed attack path analysis for finance subnet' },
      { timestamp: '2026-04-22T13:30:00Z', action: 'RISK_UPDATE', user: 'System', detail: 'Risk score updated from 72 to 85 after new CVE disclosure' },
      { timestamp: '2026-04-22T13:00:00Z', action: 'MITIGATION_ADD', user: 'Engineer', detail: 'Added network segmentation mitigation for lateral movement' },
      { timestamp: '2026-04-22T12:00:00Z', action: 'NODE_ADD', user: 'Analyst', detail: 'Added new cloud infrastructure node to attack graph' },
      { timestamp: '2026-04-22T11:00:00Z', action: 'EXPORT', user: 'Manager', detail: 'Exported attack path report in PDF format' },
    ];
  }

  private _addAudit(action: string, user: string, detail: string) {
    this._auditLog = [{ timestamp: new Date().toISOString(), action, user, detail }, ...this._auditLog.slice(0, 49)];
  }

  private _runPathAnalysis() {
    if (this._execPhase === 'running') return;
    this._execSteps = [
      { name: 'Graph Traversal', desc: 'Analyze all possible attack paths in the network graph', status: 'pending', duration: 0 },
      { name: 'Risk Scoring', desc: 'Calculate risk scores for each path based on CVSS and asset value', status: 'pending', duration: 0 },
      { name: 'MITRE Mapping', desc: 'Map techniques to MITRE ATT&CK framework', status: 'pending', duration: 0 },
      { name: 'Impact Analysis', desc: 'Estimate business impact and data exposure for critical paths', status: 'pending', duration: 0 },
      { name: 'Mitigation Priority', desc: 'Rank mitigations by cost-effectiveness ratio', status: 'pending', duration: 0 },
    ];
    this._execResults = [];
    this._execPhase = 'running';
    this._execProgress = 0;
    this._execAnalysisStep(0);
  }

  private _execAnalysisStep(index: number) {
    if (index >= this._execSteps.length) {
      this._execPhase = 'complete';
      this._addAudit('PATH_ANALYSIS', 'System', 'Attack path analysis pipeline completed');
      return;
    }
    this._execSteps = this._execSteps.map((s, i) => i === index ? { ...s, status: 'running' as const } : i < index ? { ...s, status: 'done' as const } : s);
    this._execProgress = Math.round((index / this._execSteps.length) * 100);
    const dur = 300 + Math.random() * 400;
    setTimeout(() => {
      const outputs = [
        'Found 12 attack paths. 3 critical paths lead to domain controller compromise.',
        'Path risk scores: 3 critical (85-95), 5 high (60-84), 4 medium (30-59).',
        'Mapped 18 unique techniques across 9 MITRE tactics. Top: TA0006 (Credential Access).',
        'Estimated data exposure: 2.4TB across critical paths. Business impact: $12M-18M.',
        'Top mitigation: Network segmentation (cost: $50K, risk reduction: 35%). Second: MFA rollout.',
      ];
      this._execSteps = this._execSteps.map((s, i) => i === index ? { ...s, status: 'done' as const, duration: Math.round(dur) } : s);
      this._execResults = [...this._execResults, { step: this._execSteps[index].name, output: outputs[index], timestamp: new Date().toISOString() }];
      this._execAnalysisStep(index + 1);
    }, dur);
  }

  private _riskMatrixSVG(): string {
    const W = 200, H = 140;
    const cells = [
      { x: 0, y: 0, w: 50, h: 35, label: 'Low', color: '#22c55e' },
      { x: 50, y: 0, w: 50, h: 35, label: 'Med', color: '#eab308' },
      { x: 100, y: 0, w: 50, h: 35, label: 'High', color: '#f97316' },
      { x: 150, y: 0, w: 50, h: 35, label: 'Crit', color: '#ef4444' },
      { x: 0, y: 35, w: 50, h: 35, label: 'Low', color: '#22c55e' },
      { x: 50, y: 35, w: 50, h: 35, label: 'Med', color: '#eab308' },
      { x: 100, y: 35, w: 50, h: 35, label: 'High', color: '#f97316' },
      { x: 150, y: 35, w: 50, h: 35, label: 'Crit', color: '#ef4444' },
      { x: 0, y: 70, w: 50, h: 35, label: 'Low', color: '#22c55e' },
      { x: 50, y: 70, w: 50, h: 35, label: 'Med', color: '#eab308' },
      { x: 100, y: 70, w: 50, h: 35, label: 'High', color: '#f97316' },
      { x: 150, y: 70, w: 50, h: 35, label: 'Crit', color: '#ef4444' },
    ];
    const dots = [{ cx: 130, cy: 17 }, { cx: 165, cy: 52 }, { cx: 80, cy: 87 }, { cx: 145, cy: 87 }, { cx: 25, cy: 17 }, { cx: 60, cy: 52 }];
    let svg = cells.map(c => '<rect x="' + c.x + '" y="' + c.y + '" width="' + c.w + '" height="' + c.h + '" fill="' + c.color + '" fill-opacity="0.15" stroke="' + c.color + '" stroke-width="0.5"/>').join('');
    svg += dots.map(d => '<circle cx="' + d.cx + '" cy="' + d.cy + '" r="6" fill="#06b6d4" opacity="0.8"/>').join('');
    svg += '<text x="100" y="120" text-anchor="middle" fill="#94a3b8" font-size="8">Likelihood --> </text>';
    svg += '<text x="195" y="70" text-anchor="middle" fill="#94a3b8" font-size="8" transform="rotate(90,195,70)">Impact --> </text>';
    return svg;
  }

  private _techniqueDistributionSVG(): string {
    const tactics = ['Initial Access', 'Execution', 'Persistence', 'Priv Esc', 'Defense Evasion', 'Credential Access', 'Discovery', 'Lateral Move', 'Collection', 'Exfiltration'];
    const data = tactics.map(() => 2 + Math.floor(Math.random() * 8));
    const W = 260, H = 60, max = Math.max(...data);
    const barW = 22, gap = 1;
    let rects = '';
    data.forEach((v, i) => {
      const h = (v / max) * 40;
      const x = i * (barW + gap);
      const color = v >= 7 ? '#ef4444' : v >= 5 ? '#f59e0b' : '#22c55e';
      rects += '<rect x="' + x + '" y="' + (H - 6 - h) + '" width="' + barW + '" height="' + h + '" rx="2" fill="' + color + '" fill-opacity="0.6"/>';
      rects += '<text x="' + (x + barW / 2) + '" y="' + (H - 2) + '" text-anchor="middle" fill="#6b7280" font-size="5">' + tactics[i].split(' ')[0] + '</text>';
      rects += '<text x="' + (x + barW / 2) + '" y="' + (H - 8 - h) + '" text-anchor="middle" fill="' + color + '" font-size="7" font-weight="600">' + v + '</text>';
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '">' + rects + '</svg>';
  }

  private _pathLengthSVG(): string {
    const paths = [
      { name: 'Internet->DC', steps: 8, risk: 92 },
      { name: 'Phishing->DB', steps: 6, risk: 78 },
      { name: 'VPN->Finance', steps: 5, risk: 85 },
      { name: 'USB->DC', steps: 7, risk: 71 },
      { name: 'Web->Internal', steps: 4, risk: 65 },
      { name: 'Supplier->Prod', steps: 9, risk: 88 },
      { name: 'Cloud->OnPrem', steps: 6, risk: 74 },
    ];
    const W = 260, H = 100;
    let rects = '';
    paths.forEach((p, i) => {
      const y = i * 13;
      const barW = (p.steps / 9) * 140;
      const color = p.risk >= 85 ? '#ef4444' : p.risk >= 70 ? '#f59e0b' : '#22c55e';
      rects += '<text x="2" y="' + (y + 9) + '" fill="#94a3b8" font-size="7">' + p.name + '</text>';
      rects += '<rect x="80" y="' + y + '" width="' + barW + '" height="10" rx="2" fill="' + color + '" fill-opacity="0.5"/>';
      rects += '<text x="' + (85 + barW) + '" y="' + (y + 9) + '" fill="' + color + '" font-size="7" font-weight="600">' + p.risk + '/100</text>';
    });
    rects += '<text x="2" y="' + (paths.length * 13 + 8) + '" fill="#6b7280" font-size="6">Bar length = path depth | Color = risk level</text>';
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '">' + rects + '</svg>';
  }

  private _mitigationImpactSVG(): string {
    const mitigations = [
      { name: 'Network Segmentation', cost: 50, riskReduction: 35, color: '#22c55e' },
      { name: 'MFA Deployment', cost: 30, riskReduction: 25, color: '#3b82f6' },
      { name: 'EDR Upgrade', cost: 80, riskReduction: 20, color: '#a855f7' },
      { name: 'Patching', cost: 20, riskReduction: 15, color: '#f59e0b' },
      { name: 'Monitoring', cost: 40, riskReduction: 10, color: '#06b6d4' },
    ];
    const W = 260, H = 80;
    let rects = '';
    mitigations.forEach((m, i) => {
      const y = i * 14;
      const barW = m.riskReduction * 3;
      rects += '<text x="2" y="' + (y + 10) + '" fill="#94a3b8" font-size="7">' + m.name + '</text>';
      rects += '<rect x="100" y="' + y + '" width="' + barW + '" height="10" rx="2" fill="' + m.color + '" fill-opacity="0.5"/>';
      rects += '<text x="' + (105 + barW) + '" y="' + (y + 9) + '" fill="' + m.color + '" font-size="7" font-weight="600">-' + m.riskReduction + '%</text>';
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '">' + rects + '</svg>';
  }

  private _slaItems: { id: string; task: string; assignee: string; elapsed: number; total: number; priority: string }[] = [];
  private _initSlaItems() {
    const now = Date.now();
    this._slaItems = [
      { id: 'ap-sla-1', task: 'Implement network segmentation for lateral movement prevention', assignee: 'NetOps', elapsed: 72000000, total: 172800000, priority: 'critical' },
      { id: 'ap-sla-2', task: 'Deploy MFA across all privileged accounts', assignee: 'IAM Team', elapsed: 144000000, total: 259200000, priority: 'high' },
      { id: 'ap-sla-3', task: 'Patch domain controller CVE-2026-8901', assignee: 'SysOps', elapsed: 3600000, total: 86400000, priority: 'critical' },
      { id: 'ap-sla-4', task: 'Update EDR signatures for Cobalt Strike detection', assignee: 'SecOps', elapsed: 28800000, total: 86400000, priority: 'medium' },
    ];
  }

  connectedCallback() { super.connectedCallback();
    this.apInitRound17();
    this._initThreatModel();
    this._initPipeline();
    this._initPlaybooks();
    this._initMetrics();
    this._initIntegration(); this._initAuditLog(); this._initSlaItems(); }

  private _getRiskColor(risk: string) {
    switch (risk) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  }

  private _getTotalRisk(): number {
    return Math.round(this._edges.reduce((sum, e) => sum + (e.severity === 'critical' ? 10 : e.severity === 'high' ? 5 : 2) * e.successRate / 100, 0));
  }

  private _getMaxImpact(): string {
    const highest = this._nodes.find(n => n.risk === 'critical');
    return highest ? highest.name : 'N/A';
  }

  private _getSuccessRate(): number {
    return Math.round(this._edges.reduce((sum, e) => sum + e.successRate, 0) / this._edges.length);
  }

  private _handleNodeClick(node: AttackNode) {
    this._selectedNode = node === this._selectedNode ? null : node;
  }

  private _getMitigationForNode(node: AttackNode): string {
    switch (node.id) {
      case '1': return 'WAF rate limiting, IP reputation filtering, regular port scan';
      case '2': return 'Patch critical CVEs within 24h, EDR process monitoring, regular vulnerability scanning';
      case '3': return 'Least privilege principle, remove unnecessary root access, audit privileged operations';
      case '4': return 'Enable Kerberos pre-authentication, limited DA account usage, monitor abnormal TGS requests';
      case '5': return 'DB encryption at rest/in transit, data access auditing, DLP for exfiltration prevention';
      case '6': return 'File share permission tightening, data classification, access logging';
      case '7': return 'DNS tunnel detection, outbound traffic filtering, data loss prevention policies';
      default: return 'Security control enhancement, regular penetration testing';
    }
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
          <span style="padding:2px 6px;border-radius:3px;font-size:9px;font-weight:600;background:${((({scan:'#3b82f6',review:'#f59e0b',config:'#8b5cf6',export:'#22c55e'}) as any)[e.category]) || '#374151'}20;color:${((({scan:'#60a5fa',review:'#fbbf24',config:'#a78bfa',export:'#34d399'}) as any)[e.category]) || '#9ca3af'}">${e.category}</span>
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
        <div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Auto-scan Interval</div><div style="display:flex;align-items:center;gap:10px"><input type="range" min="1" max="168" .value=${String(this._autoInterval)} @input=${(e: Event) => { this._autoInterval = parseInt((e.target as HTMLInputElement).value); }} style="flex:1;accent-color:#8b5cf6;background:transparent;border:none"><span style="font-weight:700;color:#8b5cf6;min-width:40px;text-align:right;font-size:13px">${this._autoInterval}h</span></div></div>
        <div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">SLA Target</div><div style="display:flex;align-items:center;gap:10px"><input type="range" min="1" max="720" .value=${String(this._slaTargetHours)} @input=${(e: Event) => { this._slaTargetHours = parseInt((e.target as HTMLInputElement).value); }} style="flex:1;accent-color:#8b5cf6;background:transparent;border:none"><span style="font-weight:700;color:#8b5cf6;min-width:40px;text-align:right;font-size:13px">${this._slaTargetHours}h</span></div></div>
      </div>` : nothing}
      ${this._settingsTab === 'thresholds' ? html`<div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Critical Threshold</div><div style="display:flex;align-items:center;gap:10px"><input type="range" min="1" max="20" .value=${String(this._criticalThreshold)} @input=${(e: Event) => { this._criticalThreshold = parseInt((e.target as HTMLInputElement).value); }} style="flex:1;accent-color:#8b5cf6;background:transparent;border:none"><span style="font-weight:700;color:#8b5cf6;min-width:40px;text-align:right;font-size:13px">${this._criticalThreshold}</span></div></div>` : nothing}
      ${this._settingsTab === 'integrations' ? html`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Escalation Email</div><input type="email" .value=${this._escalationEmail} @input=${(e: Event) => { this._escalationEmail = (e.target as HTMLInputElement).value; }} style="background:#0f172a;border:1px solid #374151;border-radius:6px;padding:8px;color:#e2e8f0;font-size:12px;width:100%"></div>
        <div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Webhook URL</div><input type="url" .value=${this._webhookUrl} @input=${(e: Event) => { this._webhookUrl = (e.target as HTMLInputElement).value; }} style="background:#0f172a;border:1px solid #374151;border-radius:6px;padding:8px;color:#e2e8f0;font-size:12px;width:100%"></div>
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
    const data = this._items.slice(0, 10).map((item: any, i: number) => ({ name: (item.name || item.title || item.id || 'Item ' + i).substring(0, 8), score: ({critical: 10, high: 7, medium: 4, low: 1}) as any)[item.risk]) || 2, risk: item.risk || 'medium' }));
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
        <span>${this._items.length} items | ${this._auditTrail.length} audit entries</span>
      </div>
    </div>`;
  }



  // ===== THREAT HUNTING WORKSPACE MODULE =====
  @state() private _huntHypotheses: Array<{
    id: string; title: string; description: string; status: 'active' | 'validated' | 'refuted' | 'pending';
    created: string; lastUpdated: string; assignedTo: string; killChainStage: string;
    iocPivots: number; findingsCount: number; confidence: number;
  }> = [
    { id: 'h-001', title: 'Credential Dumping via LSASS', description: 'Investigate potential LSASS access patterns from non-system processes',
      status: 'active', created: '2026-04-20T08:00:00Z', lastUpdated: '2026-04-23T06:30:00Z',
      assignedTo: 'Hunter-A', killChainStage: 'Credential Access', iocPivots: 12, findingsCount: 3, confidence: 72 },
    { id: 'h-002', title: 'Lateral Movement via RDP', description: 'Detect anomalous RDP connections between workstations',
      status: 'validated', created: '2026-04-19T14:00:00Z', lastUpdated: '2026-04-22T18:00:00Z',
      assignedTo: 'Hunter-B', killChainStage: 'Lateral Movement', iocPivots: 8, findingsCount: 5, confidence: 89 },
    { id: 'h-003', title: 'DNS Tunneling Detection', description: 'Analyze DNS query patterns for potential data exfiltration tunnels',
      status: 'pending', created: '2026-04-21T10:00:00Z', lastUpdated: '2026-04-21T10:00:00Z',
      assignedTo: 'Hunter-C', killChainStage: 'Command & Control', iocPivots: 3, findingsCount: 0, confidence: 35 },
    { id: 'h-004', title: 'Persistence via Scheduled Tasks', description: 'Hunt for suspicious scheduled task creations on critical servers',
      status: 'active', created: '2026-04-18T09:00:00Z', lastUpdated: '2026-04-22T12:00:00Z',
      assignedTo: 'Hunter-A', killChainStage: 'Persistence', iocPivots: 6, findingsCount: 2, confidence: 64 },
    { id: 'h-005', title: 'Living off the Land Binaries', description: 'Identify abuse of legitimate system tools for malicious purposes',
      status: 'refuted', created: '2026-04-17T11:00:00Z', lastUpdated: '2026-04-20T16:00:00Z',
      assignedTo: 'Hunter-D', killChainStage: 'Defense Evasion', iocPivots: 15, findingsCount: 1, confidence: 91 },
  ];
  @state() private _huntSessions: Array<{
    id: string; hypothesisId: string; startedAt: string; endedAt: string | null; duration: number;
    queriesRun: number; resultsFound: number; truePositives: number; falsePositives: number; status: 'running' | 'completed' | 'paused';
  }> = [
    { id: 's-001', hypothesisId: 'h-001', startedAt: '2026-04-23T06:00:00Z', endedAt: null, duration: 4500,
      queriesRun: 24, resultsFound: 8, truePositives: 3, falsePositives: 5, status: 'running' },
    { id: 's-002', hypothesisId: 'h-002', startedAt: '2026-04-22T14:00:00Z', endedAt: '2026-04-22T18:00:00Z', duration: 14400,
      queriesRun: 47, resultsFound: 12, truePositives: 5, falsePositives: 7, status: 'completed' },
    { id: 's-003', hypothesisId: 'h-004', startedAt: '2026-04-22T08:00:00Z', endedAt: '2026-04-22T11:30:00Z', duration: 12600,
      queriesRun: 31, resultsFound: 6, truePositives: 2, falsePositives: 4, status: 'completed' },
  ];
  @state() private _huntTimer: number = 0;
  @state() private _huntTimerRunning: boolean = false;
  @state() private _selectedHypothesis: string = 'h-001';

  private _renderHuntingWorkspace(): unknown {
    const statusColors: Record<string, string> = { active: '#3b82f6', validated: '#22c55e', refuted: '#ef4444', pending: '#f59e0b', running: '#3b82f6', completed: '#22c55e', paused: '#f59e0b' };
    const formatDuration = (s: number) => { const h = Math.floor(s/3600); const m = Math.floor((s%3600)/60); return h > 0 ? h + 'h ' + m + 'm' : m + 'm'; };
    return html`
      <div style="padding:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div style="font-size:11px;font-weight:700;color:#e2e8f0">Threat Hunting Workspace</div>
          <div style="display:flex;gap:6px;align-items:center">
            <span style="font-size:9px;color:#9ca3af">Session Timer:</span>
            <span style="font-size:10px;font-weight:600;color:#60a5fa;font-family:monospace">${formatDuration(this._huntTimer)}</span>
            <button @click=${() => { this._huntTimerRunning = !this._huntTimerRunning; }}
              style="padding:2px 8px;font-size:8px;border-radius:3px;border:1px solid #374151;background:${this._huntTimerRunning ? '#dc2626' : '#1f2937'};color:#e2e8f0;cursor:pointer">${this._huntTimerRunning ? 'Stop' : 'Start'}</button>
          </div>
        </div>
        <div style="font-size:9px;font-weight:600;color:#9ca3af;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Active Hypotheses</div>
        ${this._huntHypotheses.filter(h => h.status !== 'refuted').map(h => html`
          <div style="padding:5px 8px;background:${h.id === this._selectedHypothesis ? '#1e3a5f' : '#111827'};border:1px solid ${h.id === this._selectedHypothesis ? '#2563eb' : '#1f2937'};border-radius:4px;margin-bottom:3px;cursor:pointer"
            @click=${() => { this._selectedHypothesis = h.id; }}>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div style="display:flex;align-items:center;gap:6px">
                <span style="width:6px;height:6px;border-radius:50%;background:${statusColors[h.status]}"></span>
                <span style="font-size:9px;font-weight:600;color:#e2e8f0">${h.title}</span>
                <span style="font-size:7px;color:#6b7280;background:#1f2937;padding:1px 4px;border-radius:2px">${h.killChainStage}</span>
              </div>
              <div style="display:flex;gap:8px;align-items:center">
                <span style="font-size:8px;color:#60a5fa">IOCs: ${h.iocPivots}</span>
                <span style="font-size:8px;color:#22c55e">Findings: ${h.findingsCount}</span>
                <span style="font-size:8px;color:${h.confidence > 70 ? '#22c55e' : h.confidence > 40 ? '#f59e0b' : '#ef4444'}">${h.confidence}%</span>
              </div>
            </div>
            <div style="font-size:7px;color:#6b7280;margin-top:2px;margin-left:12px">${h.description}</div>
          </div>
        `)}
        <div style="font-size:9px;font-weight:600;color:#9ca3af;margin-top:8px;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Hunt Sessions</div>
        ${this._huntSessions.map(s => html`
          <div style="padding:4px 8px;background:#111827;border-radius:3px;margin-bottom:2px;display:flex;justify-content:space-between;align-items:center;font-size:8px">
            <div style="display:flex;align-items:center;gap:4px">
              <span style="width:5px;height:5px;border-radius:50%;background:${statusColors[s.status]}"></span>
              <span style="color:#e2e8f0;font-weight:600">${s.id}</span>
              <span style="color:#6b7280">${formatDuration(s.duration)}</span>
            </div>
            <div style="display:flex;gap:6px">
              <span style="color:#9ca3af">Queries: ${s.queriesRun}</span>
              <span style="color:#22c55e">TP: ${s.truePositives}</span>
              <span style="color:#ef4444">FP: ${s.falsePositives}</span>
              <span style="color:#60a5fa">Precision: ${s.resultsFound > 0 ? Math.round(s.truePositives/s.resultsFound*100) : 0}%</span>
            </div>
          </div>
        `)}
        <div style="font-size:9px;font-weight:600;color:#9ca3af;margin-top:8px;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Hypothesis Evolution Timeline</div>
        ${[
          { date: 'Apr 17', event: 'H005 Living off the Land - Refuted after 47 queries, confirmed as admin activity', status: 'refuted' },
          { date: 'Apr 18', event: 'H004 Scheduled Tasks - 2 suspicious tasks found on DC-01 and FILE-03', status: 'active' },
          { date: 'Apr 19', event: 'H002 RDP Lateral Movement - Validated: 5 confirmed lateral hops from WKST-07', status: 'validated' },
          { date: 'Apr 20', event: 'H001 LSASS Credential Dumping - Elevated priority based on H002 findings', status: 'active' },
          { date: 'Apr 21', event: 'H003 DNS Tunneling - New hypothesis created from anomaly detection alerts', status: 'pending' },
        ].map(e => html`
          <div style="padding:3px 8px;border-left:2px solid ${statusColors[e.status]};margin-bottom:2px;margin-left:4px;font-size:7px">
            <span style="color:#60a5fa;font-weight:600">${e.date}</span>
            <span style="color:#9ca3af;margin-left:6px">${e.event}</span>
          </div>
        `)}
      </div>`;
  }

  // ===== DIGITAL FORENSICS LAB MODULE =====
  @state() private _forensicCases: Array<{
    id: string; caseName: string; status: 'open' | 'in-progress' | 'closed' | 'archived';
    priority: 'critical' | 'high' | 'medium' | 'low'; assignedTo: string; created: string;
    evidenceItems: number; artifacts: number; timelineEvents: number; findings: number;
  }> = [
    { id: 'fc-001', caseName: 'Ransomware Incident - FIN-DEPT', status: 'in-progress', priority: 'critical',
      assignedTo: 'Forensics-A', created: '2026-04-15T08:00:00Z', evidenceItems: 23, artifacts: 156, timelineEvents: 89, findings: 34 },
    { id: 'fc-002', caseName: 'Insider Threat - Engineering', status: 'open', priority: 'high',
      assignedTo: 'Forensics-B', created: '2026-04-20T14:00:00Z', evidenceItems: 8, artifacts: 45, timelineEvents: 23, findings: 12 },
    { id: 'fc-003', caseName: 'Data Exfiltration Attempt', status: 'in-progress', priority: 'high',
      assignedTo: 'Forensics-A', created: '2026-04-18T10:00:00Z', evidenceItems: 15, artifacts: 78, timelineEvents: 56, findings: 18 },
    { id: 'fc-004', caseName: 'Phishing Campaign Analysis', status: 'closed', priority: 'medium',
      assignedTo: 'Forensics-C', created: '2026-04-10T09:00:00Z', evidenceItems: 31, artifacts: 203, timelineEvents: 120, findings: 45 },
  ];
  @state() private _chainOfCustody: Array<{
    id: string; caseId: string; item: string; collectedBy: string; collectedAt: string;
    hashMd5: string; hashSha1: string; hashSha256: string; storage: string;
    transferLog: string;
  }> = [
    { id: 'coc-001', caseId: 'fc-001', item: 'WKST-FIN01 Memory Dump', collectedBy: 'Forensics-A', collectedAt: '2026-04-15T09:30:00Z',
      hashMd5: 'a3f2b8c1d4e5f6a7b8c9d0e1f2a3b4c5', hashSha1: 'b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2', hashSha256: 'c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7',
      storage: 'Evidence Locker A-3', transferLog: 'Scene -> Lab (Apr 15) -> Reviewer (Apr 16)' },
    { id: 'coc-002', caseId: 'fc-001', item: 'Server-FIN01 Disk Image', collectedBy: 'Forensics-A', collectedAt: '2026-04-15T11:00:00Z',
      hashMd5: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9', hashSha1: 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3', hashSha256: 'f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7',
      storage: 'Evidence Locker A-3', transferLog: 'Scene -> Lab (Apr 15)' },
  ];
  @state() private _artifactChecklist: Array<{
    category: string; items: Array<{ name: string; status: 'pending' | 'collected' | 'analyzed' | 'skipped'; notes: string }>;
  }> = [
    { category: 'Registry', items: [
      { name: 'SAM/SYSTEM Hives', status: 'collected', notes: 'Extracted from WKST-FIN01' },
      { name: 'NTUSER.DAT', status: 'analyzed', notes: 'Suspicious run keys found' },
      { name: 'Software Hive', status: 'analyzed', notes: 'Unusual installed software detected' },
      { name: 'Amcache', status: 'collected', notes: 'Pending analysis' },
      { name: 'UserAssist', status: 'pending', notes: '' },
    ]},
    { category: 'Memory', items: [
      { name: 'Process List', status: 'analyzed', notes: '3 suspicious processes identified' },
      { name: 'Network Connections', status: 'analyzed', notes: 'C2 callback to 192.168.45.102' },
      { name: 'DLL List', status: 'collected', notes: '2 injected DLLs detected' },
      { name: 'Handle Table', status: 'pending', notes: '' },
    ]},
    { category: 'Network', items: [
      { name: 'PCAP Files', status: 'collected', notes: 'Firewall logs exported' },
      { name: 'DNS Cache', status: 'analyzed', notes: 'Tunneling patterns found' },
      { name: 'Proxy Logs', status: 'pending', notes: '' },
    ]},
    { category: 'Disk', items: [
      { name: 'MFT Analysis', status: 'analyzed', notes: 'Deleted ransomware binary recovered' },
      { name: 'USN Journal', status: 'analyzed', notes: 'File encryption timeline reconstructed' },
      { name: 'Prefetch', status: 'collected', notes: '' },
      { name: 'Event Logs', status: 'analyzed', notes: '4624/4625 anomalies detected' },
    ]},
  ];
  @state() private _forensicTimeline: Array<{
    time: string; event: string; source: string; severity: 'critical' | 'high' | 'medium' | 'low'; confidence: number;
  }> = [
    { time: '2026-04-15 02:14:33', event: 'Initial access via phishing email attachment', source: 'Email Gateway', severity: 'critical', confidence: 95 },
    { time: '2026-04-15 02:15:01', event: 'Malicious macro execution in Word document', source: 'AMSI Logs', severity: 'critical', confidence: 92 },
    { time: '2026-04-15 02:15:45', event: 'PowerShell download cradle executed', source: 'PowerShell Logging', severity: 'critical', confidence: 98 },
    { time: '2026-04-15 02:16:12', event: 'Second stage payload dropped to AppData', source: 'File System Timeline', severity: 'high', confidence: 88 },
    { time: '2026-04-15 02:17:30', event: 'LSASS memory access from non-system process', source: 'EDR Alerts', severity: 'critical', confidence: 97 },
    { time: '2026-04-15 02:18:00', event: 'Lateral movement to SRV-FIN01 via WMI', source: 'WMI Event Logs', severity: 'high', confidence: 90 },
    { time: '2026-04-15 02:20:00', event: 'File encryption started on network shares', source: 'File Server Logs', severity: 'critical', confidence: 99 },
    { time: '2026-04-15 02:25:00', event: 'Ransom note deployed to all accessible shares', source: 'File System', severity: 'critical', confidence: 100 },
  ];

  private _renderForensicsLab(): unknown {
    const statusColors: Record<string, string> = { open: '#f59e0b', 'in-progress': '#3b82f6', closed: '#22c55e', archived: '#6b7280', pending: '#6b7280', collected: '#60a5fa', analyzed: '#22c55e', skipped: '#ef4444' };
    const severityColors: Record<string, string> = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#22c55e' };
    return html`
      <div style="padding:8px">
        <div style="font-size:11px;font-weight:700;color:#e2e8f0;margin-bottom:8px">Digital Forensics Lab</div>
        <div style="font-size:9px;font-weight:600;color:#9ca3af;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Case Management</div>
        ${this._forensicCases.map(c => html`
          <div style="padding:4px 8px;background:#111827;border-radius:3px;margin-bottom:2px;display:flex;justify-content:space-between;align-items:center;font-size:8px">
            <div style="display:flex;align-items:center;gap:6px">
              <span style="width:6px;height:6px;border-radius:50%;background:${statusColors[c.status]}"></span>
              <span style="color:#e2e8f0;font-weight:600">${c.caseName}</span>
              <span style="color:${severityColors[c.priority]};font-weight:600">${c.priority.toUpperCase()}</span>
            </div>
            <div style="display:flex;gap:6px;color:#9ca3af">
              <span>Evidence: ${c.evidenceItems}</span>
              <span>Artifacts: ${c.artifacts}</span>
              <span>Timeline: ${c.timelineEvents}</span>
              <span style="color:#60a5fa">Findings: ${c.findings}</span>
            </div>
          </div>
        `)}
        <div style="font-size:9px;font-weight:600;color:#9ca3af;margin-top:8px;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Chain of Custody</div>
        ${this._chainOfCustody.map(c => html`
          <div style="padding:4px 8px;background:#111827;border-radius:3px;margin-bottom:2px;font-size:7px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="color:#e2e8f0;font-weight:600">${c.item}</span>
              <span style="color:#6b7280">${c.storage}</span>
            </div>
            <div style="color:#4b5563;margin-top:1px;font-family:monospace;font-size:6px">MD5: ${c.hashMd5} | SHA1: ${c.hashSha1.substring(0, 16)}... | SHA256: ${c.hashSha256.substring(0, 24)}...</div>
            <div style="color:#9ca3af;margin-top:1px">Transfers: ${c.transferLog}</div>
          </div>
        `)}
        <div style="font-size:9px;font-weight:600;color:#9ca3af;margin-top:8px;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Artifact Analysis Checklist</div>
        ${this._artifactChecklist.map(cat => html`
          <div style="margin-bottom:4px">
            <div style="font-size:8px;font-weight:600;color:#60a5fa;margin-bottom:2px">${cat.category}</div>
            ${cat.items.map(item => html`
              <div style="padding:2px 8px;background:#0d1117;border-radius:2px;margin-bottom:1px;display:flex;justify-content:space-between;align-items:center;font-size:7px">
                <div style="display:flex;align-items:center;gap:4px">
                  <span style="color:${statusColors[item.status]}">${item.status === 'analyzed' ? '[OK]' : item.status === 'collected' ? '[..]' : '[  ]'}</span>
                  <span style="color:#d1d5db">${item.name}</span>
                </div>
                <span style="color:#6b7280">${item.notes || '-'}</span>
              </div>
            `)}
          </div>
        `)}
        <div style="font-size:9px;font-weight:600;color:#9ca3af;margin-top:8px;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Incident Timeline Reconstruction</div>
        ${this._forensicTimeline.map(e => html`
          <div style="padding:3px 8px;border-left:2px solid ${severityColors[e.severity]};margin-bottom:1px;margin-left:4px;font-size:7px;display:flex;justify-content:space-between">
            <div>
              <span style="color:#60a5fa;font-family:monospace">${e.time}</span>
              <span style="color:#d1d5db;margin-left:6px">${e.event}</span>
            </div>
            <div style="display:flex;gap:6px">
              <span style="color:#6b7280">${e.source}</span>
              <span style="color:${e.confidence > 90 ? '#22c55e' : '#f59e0b'}">${e.confidence}%</span>
            </div>
          </div>
        `)}
      </div>`;
  }

  // ===== PENETRATION TESTING DASHBOARD MODULE =====
  @state() private _pentestEngagements: Array<{
    id: string; name: string; client: string; phase: 'scoping' | 'recon' | 'exploit' | 'post-exploit' | 'reporting' | 'delivered';
    startDate: string; endDate: string; scope: string; vulnsFound: number; critVulns: number;
    exploited: number; credentials: number; progress: number;
  }> = [
    { id: 'pe-001', name: 'External Network Assessment', client: 'Acme Corp', phase: 'exploit',
      startDate: '2026-04-10', endDate: '2026-04-24', scope: '241 hosts / 18 web apps', vulnsFound: 47, critVulns: 6, exploited: 8, credentials: 12, progress: 72 },
    { id: 'pe-002', name: 'Internal Network Pentest', client: 'Globex Inc', phase: 'recon',
      startDate: '2026-04-18', endDate: '2026-05-02', scope: '1847 hosts / AD environment', vulnsFound: 12, critVulns: 1, exploited: 2, credentials: 5, progress: 25 },
    { id: 'pe-003', name: 'Web Application Assessment', client: 'Initech LLC', phase: 'reporting',
      startDate: '2026-04-01', endDate: '2026-04-15', scope: '6 web applications', vulnsFound: 89, critVulns: 11, exploited: 15, credentials: 3, progress: 92 },
  ];
  @state() private _exploitCatalog: Array<{
    id: string; name: string; type: string; platform: string;
    cve: string; risk: 'critical' | 'high' | 'medium' | 'low'; verified: boolean; pocAvailable: boolean;
  }> = [
    { id: 'ex-001', name: 'EternalBlue SMB RCE', type: 'remote', platform: 'Windows', cve: 'CVE-2017-0144', risk: 'critical', verified: true, pocAvailable: true },
    { id: 'ex-002', name: 'Log4Shell JNDI Injection', type: 'remote', platform: 'Java', cve: 'CVE-2021-44228', risk: 'critical', verified: true, pocAvailable: true },
    { id: 'ex-003', name: 'SQL Injection Auth Bypass', type: 'web', platform: 'PHP', cve: 'N/A', risk: 'high', verified: true, pocAvailable: true },
    { id: 'ex-004', name: 'Privilege Escalation via Kernel', type: 'local', platform: 'Linux', cve: 'CVE-2023-32233', risk: 'high', verified: false, pocAvailable: true },
    { id: 'ex-005', name: 'XSS Stored in Dashboard', type: 'web', platform: 'React', cve: 'N/A', risk: 'medium', verified: true, pocAvailable: true },
    { id: 'ex-006', name: 'SSRF Internal Port Scan', type: 'web', platform: 'Node.js', cve: 'N/A', risk: 'high', verified: true, pocAvailable: true },
  ];
  @state() private _deliverableChecklist: Array<{
    engagementId: string; item: string; status: 'pending' | 'in-progress' | 'completed';
  }> = [
    { engagementId: 'pe-003', item: 'Executive Summary', status: 'completed' },
    { engagementId: 'pe-003', item: 'Technical Findings Report', status: 'completed' },
    { engagementId: 'pe-003', item: 'Vulnerability Remediation Guide', status: 'in-progress' },
    { engagementId: 'pe-003', item: 'Evidence Screenshots and Videos', status: 'completed' },
    { engagementId: 'pe-003', item: 'Re-test Verification Results', status: 'pending' },
    { engagementId: 'pe-003', item: 'Risk Rating Matrix', status: 'completed' },
  ];

  private _renderPentestDashboard(): unknown {
    const phaseColors: Record<string, string> = { scoping: '#9ca3af', recon: '#60a5fa', exploit: '#ef4444', 'post-exploit': '#f59e0b', reporting: '#22c55e', delivered: '#6b7280' };
    const riskColors: Record<string, string> = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#22c55e' };
    return html`
      <div style="padding:8px">
        <div style="font-size:11px;font-weight:700;color:#e2e8f0;margin-bottom:8px">Penetration Testing Dashboard</div>
        <div style="font-size:9px;font-weight:600;color:#9ca3af;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Active Engagements</div>
        ${this._pentestEngagements.map(e => html`
          <div style="padding:5px 8px;background:#111827;border-radius:4px;margin-bottom:3px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
              <div style="display:flex;align-items:center;gap:6px">
                <span style="font-size:9px;font-weight:600;color:#e2e8f0">${e.name}</span>
                <span style="font-size:7px;color:${phaseColors[e.phase]};background:#1f2937;padding:1px 4px;border-radius:2px">${e.phase.toUpperCase()}</span>
              </div>
              <span style="font-size:8px;color:#6b7280">${e.startDate} - ${e.endDate}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:8px">
              <span style="color:#9ca3af">${e.scope}</span>
              <div style="display:flex;gap:6px">
                <span style="color:#ef4444">Critical: ${e.critVulns}</span>
                <span style="color:#f59e0b">Total: ${e.vulnsFound}</span>
                <span style="color:#22c55e">Exploited: ${e.exploited}</span>
                <span style="color:#60a5fa">Creds: ${e.credentials}</span>
              </div>
            </div>
            <div style="margin-top:3px;height:3px;background:#1f2937;border-radius:2px;overflow:hidden">
              <div style="height:100%;width:${e.progress}%;background:${phaseColors[e.phase]};border-radius:2px;transition:width 0.3s"></div>
            </div>
          </div>
        `)}
        <div style="font-size:9px;font-weight:600;color:#9ca3af;margin-top:8px;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Exploit Catalog</div>
        ${this._exploitCatalog.map(ex => html`
          <div style="padding:3px 8px;background:#111827;border-radius:3px;margin-bottom:2px;display:flex;justify-content:space-between;align-items:center;font-size:8px">
            <div style="display:flex;align-items:center;gap:4px">
              <span style="color:${ex.verified ? '#22c55e' : '#f59e0b'}">${ex.verified ? '[V]' : '[U]'}</span>
              <span style="color:#e2e8f0;font-weight:600">${ex.name}</span>
              <span style="color:#6b7280;font-size:7px">${ex.cve}</span>
            </div>
            <div style="display:flex;gap:4px">
              <span style="color:#9ca3af">${ex.type}</span>
              <span style="color:#6b7280">${ex.platform}</span>
              <span style="color:${riskColors[ex.risk]}">${ex.risk}</span>
            </div>
          </div>
        `)}
        <div style="font-size:9px;font-weight:600;color:#9ca3af;margin-top:8px;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Client Deliverables</div>
        ${this._deliverableChecklist.map(d => html`
          <div style="padding:2px 8px;font-size:7px;display:flex;justify-content:space-between;color:#9ca3af">
            <span>${d.item}</span>
            <span style="color:${d.status === 'completed' ? '#22c55e' : d.status === 'in-progress' ? '#3b82f6' : '#6b7280'}">${d.status}</span>
          </div>
        `)}
      </div>`;
  }

  // ===== RED TEAM OPERATIONS MODULE =====
  @state() private _redteamObjectives: Array<{
    id: string; title: string; status: 'planned' | 'active' | 'achieved' | 'failed';
    mitreTactic: string; mitreTechnique: string; difficulty: 'easy' | 'medium' | 'hard';
    started: string; completed: string | null; assignedTo: string; notes: string;
  }> = [
    { id: 'rt-001', title: 'Gain initial access via phishing', status: 'achieved', mitreTactic: 'Initial Access', mitreTechnique: 'T1566.001', difficulty: 'easy', started: '2026-04-15', completed: '2026-04-15', assignedTo: 'RT-Lead', notes: 'Spear-phishing email with macro-enabled doc' },
    { id: 'rt-002', title: 'Establish C2 channel', status: 'achieved', mitreTactic: 'Command & Control', mitreTechnique: 'T1071.001', difficulty: 'medium', started: '2026-04-15', completed: '2026-04-16', assignedTo: 'RT-Oper', notes: 'HTTPS beaconing via CDN-fronted domain' },
    { id: 'rt-003', title: 'Dump AD credentials', status: 'active', mitreTactic: 'Credential Access', mitreTechnique: 'T1003.006', difficulty: 'medium', started: '2026-04-18', completed: null, assignedTo: 'RT-Oper', notes: 'DCSync attack in progress' },
    { id: 'rt-004', title: 'Pivot to segmented network', status: 'planned', mitreTactic: 'Lateral Movement', mitreTechnique: 'T1021.002', difficulty: 'hard', started: '', completed: null, assignedTo: 'RT-Lead', notes: 'Target: PCI segment via compromised jump host' },
    { id: 'rt-005', title: 'Exfiltrate customer PII', status: 'planned', mitreTactic: 'Exfiltration', mitreTechnique: 'T1048.003', difficulty: 'hard', started: '', completed: null, assignedTo: 'RT-Lead', notes: 'Test DLP controls effectiveness' },
    { id: 'rt-006', title: 'Domain admin escalation', status: 'active', mitreTactic: 'Privilege Escalation', mitreTechnique: 'T1068', difficulty: 'hard', started: '2026-04-19', completed: null, assignedTo: 'RT-Oper', notes: 'Kerberoasting attack vector' },
  ];
  @state() private _ttpLibrary: Array<{
    techniqueId: string; name: string; tactic: string; detectionRate: number;
    blueTeamDetection: 'detected' | 'missed' | 'partial'; timeToDetect: number;
  }> = [
    { techniqueId: 'T1566.001', name: 'Spearphishing Attachment', tactic: 'Initial Access', detectionRate: 65, blueTeamDetection: 'partial', timeToDetect: 2400 },
    { techniqueId: 'T1071.001', name: 'Web C2', tactic: 'Command & Control', detectionRate: 40, blueTeamDetection: 'missed', timeToDetect: 0 },
    { techniqueId: 'T1003.006', name: 'DCSync', tactic: 'Credential Access', detectionRate: 55, blueTeamDetection: 'missed', timeToDetect: 0 },
    { techniqueId: 'T1059.001', name: 'PowerShell', tactic: 'Execution', detectionRate: 80, blueTeamDetection: 'detected', timeToDetect: 300 },
    { techniqueId: 'T1087.002', name: 'Domain Account', tactic: 'Discovery', detectionRate: 70, blueTeamDetection: 'detected', timeToDetect: 1800 },
    { techniqueId: 'T1021.002', name: 'SMB Admin Shares', tactic: 'Lateral Movement', detectionRate: 60, blueTeamDetection: 'partial', timeToDetect: 3600 },
  ];
  @state() private _c2Infrastructure: Array<{
    id: string; domain: string; ip: string; port: number; protocol: string;
    status: 'active' | 'burned' | 'standby'; lastCheckin: string; beacons: number;
  }> = [
    { id: 'c2-001', domain: 'cdn-static-assets.net', ip: '10.0.0.50', port: 443, protocol: 'HTTPS', status: 'active', lastCheckin: '2026-04-23T10:00:00Z', beacons: 156 },
    { id: 'c2-002', domain: 'api-update-service.io', ip: '10.0.0.51', port: 8443, protocol: 'HTTPS', status: 'active', lastCheckin: '2026-04-23T09:55:00Z', beacons: 89 },
    { id: 'c2-003', domain: 'relay-analytics.cloud', ip: '10.0.0.52', port: 53, protocol: 'DNS', status: 'burned', lastCheckin: '2026-04-20T14:00:00Z', beacons: 234 },
  ];

  private _renderRedteamOps(): unknown {
    const statusColors: Record<string, string> = { planned: '#6b7280', active: '#3b82f6', achieved: '#22c55e', failed: '#ef4444', burned: '#ef4444', standby: '#f59e0b' };
    const detColors: Record<string, string> = { detected: '#22c55e', missed: '#ef4444', partial: '#f59e0b' };
    return html`
      <div style="padding:8px">
        <div style="font-size:11px;font-weight:700;color:#e2e8f0;margin-bottom:8px">Red Team Operations</div>
        <div style="font-size:9px;font-weight:600;color:#9ca3af;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Operation Objectives</div>
        ${this._redteamObjectives.map(o => html`
          <div style="padding:4px 8px;background:#111827;border-radius:3px;margin-bottom:2px;font-size:8px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div style="display:flex;align-items:center;gap:4px">
                <span style="width:6px;height:6px;border-radius:50%;background:${statusColors[o.status]}"></span>
                <span style="color:#e2e8f0;font-weight:600">${o.title}</span>
                <span style="font-size:7px;color:#6b7280">${o.mitreTechnique}</span>
              </div>
              <span style="color:${o.difficulty === 'hard' ? '#ef4444' : o.difficulty === 'medium' ? '#f59e0b' : '#22c55e'};font-size:7px">${o.difficulty}</span>
            </div>
            <div style="color:#6b7280;font-size:7px;margin-top:1px;margin-left:10px">${o.notes}</div>
          </div>
        `)}
        <div style="font-size:9px;font-weight:600;color:#9ca3af;margin-top:8px;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">TTP Detection Analysis</div>
        ${this._ttpLibrary.map(t => html`
          <div style="padding:3px 8px;background:#111827;border-radius:3px;margin-bottom:2px;display:flex;justify-content:space-between;align-items:center;font-size:8px">
            <div style="display:flex;align-items:center;gap:4px">
              <span style="color:#60a5fa;font-weight:600">${t.techniqueId}</span>
              <span style="color:#e2e8f0">${t.name}</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center">
              <span style="color:${detColors[t.blueTeamDetection]}">${t.blueTeamDetection.toUpperCase()}</span>
              <span style="color:#9ca3af">Detect: ${t.detectionRate}%</span>
              <span style="color:#6b7280">MTTD: ${t.timeToDetect > 0 ? Math.floor(t.timeToDetect/60) + 'm' : 'N/A'}</span>
            </div>
          </div>
        `)}
        <div style="font-size:9px;font-weight:600;color:#9ca3af;margin-top:8px;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">C2 Infrastructure</div>
        ${this._c2Infrastructure.map(c => html`
          <div style="padding:3px 8px;background:#111827;border-radius:3px;margin-bottom:2px;display:flex;justify-content:space-between;align-items:center;font-size:8px">
            <div style="display:flex;align-items:center;gap:4px">
              <span style="width:5px;height:5px;border-radius:50%;background:${statusColors[c.status]}"></span>
              <span style="color:#e2e8f0">${c.domain}</span>
              <span style="color:#6b7280;font-size:7px">${c.ip}:${c.port}</span>
            </div>
            <div style="display:flex;gap:6px">
              <span style="color:#9ca3af">${c.protocol}</span>
              <span style="color:#60a5fa">Beacons: ${c.beacons}</span>
            </div>
          </div>
        `)}
      </div>`;
  }

  // ===== BLUE TEAM DEFENSE METRICS MODULE =====
  @state() private _defenseMetrics: {
    mttD: number; mttC: number; mttR: number;
    alertVolume: number; truePositiveRate: number; falsePositiveRate: number;
    triageEfficiency: number; detectionCoverage: number; controlEffectiveness: number;
  } = { mttD: 847, mttC: 2340, mttR: 7200, alertVolume: 1247, truePositiveRate: 23.4, falsePositiveRate: 76.6, triageEfficiency: 67.2, detectionCoverage: 71.8, controlEffectiveness: 78.3 };
  @state() private _defenseTrend: Array<{
    period: string; mttD: number; mttC: number; mttR: number; fpr: number; coverage: number;
  }> = [
    { period: 'Week 1', mttD: 1200, mttC: 3600, mttR: 14400, fpr: 82.1, coverage: 65.2 },
    { period: 'Week 2', mttD: 1050, mttC: 3200, mttR: 10800, fpr: 79.5, coverage: 67.8 },
    { period: 'Week 3', mttD: 920, mttC: 2800, mttR: 9000, fpr: 77.3, coverage: 69.4 },
    { period: 'Week 4', mttD: 847, mttC: 2340, mttR: 7200, fpr: 76.6, coverage: 71.8 },
  ];
  @state() private _defenseLayers: Array<{
    layer: string; status: 'active' | 'degraded' | 'offline'; effectiveness: number;
    controls: number; gaps: number; lastTested: string;
  }> = [
    { layer: 'Perimeter Firewall', status: 'active', effectiveness: 92, controls: 18, gaps: 2, lastTested: '2026-04-20' },
    { layer: 'Endpoint Detection', status: 'active', effectiveness: 78, controls: 24, gaps: 5, lastTested: '2026-04-22' },
    { layer: 'Network IDS/IPS', status: 'degraded', effectiveness: 65, controls: 12, gaps: 4, lastTested: '2026-04-18' },
    { layer: 'Email Security', status: 'active', effectiveness: 88, controls: 15, gaps: 2, lastTested: '2026-04-21' },
    { layer: 'Identity and Access', status: 'active', effectiveness: 82, controls: 20, gaps: 3, lastTested: '2026-04-19' },
    { layer: 'Data Loss Prevention', status: 'degraded', effectiveness: 58, controls: 10, gaps: 6, lastTested: '2026-04-15' },
    { layer: 'SIEM / Log Analysis', status: 'active', effectiveness: 75, controls: 16, gaps: 4, lastTested: '2026-04-22' },
    { layer: 'Vulnerability Management', status: 'active', effectiveness: 71, controls: 14, gaps: 5, lastTested: '2026-04-17' },
  ];
  @state() private _alertTriage: Array<{
    category: string; volume: number; autoResolved: number; manualTriage: number; avgTriageTime: number; backlog: number;
  }> = [
    { category: 'Malware Detection', volume: 342, autoResolved: 289, manualTriage: 53, avgTriageTime: 120, backlog: 8 },
    { category: 'Network Anomaly', volume: 278, autoResolved: 198, manualTriage: 80, avgTriageTime: 300, backlog: 15 },
    { category: 'Phishing Report', volume: 224, autoResolved: 180, manualTriage: 44, avgTriageTime: 90, backlog: 3 },
    { category: 'Privilege Escalation', volume: 156, autoResolved: 45, manualTriage: 111, avgTriageTime: 600, backlog: 22 },
    { category: 'Data Exfiltration', volume: 89, autoResolved: 34, manualTriage: 55, avgTriageTime: 480, backlog: 12 },
    { category: 'Brute Force', volume: 158, autoResolved: 142, manualTriage: 16, avgTriageTime: 60, backlog: 2 },
  ];

  private _renderBlueTeamMetrics(): unknown {
    const fmtMins = (s: number) => { const h = Math.floor(s/3600); const m = Math.floor((s%3600)/60); return h > 0 ? h + 'h ' + m + 'm' : m + 'min'; };
    const layerColors: Record<string, string> = { active: '#22c55e', degraded: '#f59e0b', offline: '#ef4444' };
    return html`
      <div style="padding:8px">
        <div style="font-size:11px;font-weight:700;color:#e2e8f0;margin-bottom:8px">Blue Team Defense Metrics</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin-bottom:8px">
          ${[
            { label: 'MTTD', value: fmtMins(this._defenseMetrics.mttD), color: '#3b82f6' },
            { label: 'MTTC', value: fmtMins(this._defenseMetrics.mttC), color: '#f59e0b' },
            { label: 'MTTR', value: fmtMins(this._defenseMetrics.mttR), color: '#22c55e' },
            { label: 'Alert Volume', value: String(this._defenseMetrics.alertVolume), color: '#60a5fa' },
            { label: 'TP Rate', value: this._defenseMetrics.truePositiveRate + '%', color: '#22c55e' },
            { label: 'FP Rate', value: this._defenseMetrics.falsePositiveRate + '%', color: '#ef4444' },
          ].map(m => html`
            <div style="padding:4px 6px;background:#111827;border-radius:3px;text-align:center">
              <div style="font-size:7px;color:#6b7280;text-transform:uppercase">${m.label}</div>
              <div style="font-size:12px;font-weight:700;color:${m.color}">${m.value}</div>
            </div>
          `)}
        </div>
        <div style="font-size:9px;font-weight:600;color:#9ca3af;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Defense-in-Depth Layers</div>
        ${this._defenseLayers.map(l => html`
          <div style="padding:3px 8px;background:#111827;border-radius:3px;margin-bottom:2px;display:flex;justify-content:space-between;align-items:center;font-size:8px">
            <div style="display:flex;align-items:center;gap:4px">
              <span style="width:5px;height:5px;border-radius:50%;background:${layerColors[l.status]}"></span>
              <span style="color:#e2e8f0;font-weight:500">${l.layer}</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center">
              <div style="width:50px;height:3px;background:#1f2937;border-radius:2px;overflow:hidden">
                <div style="height:100%;width:${l.effectiveness}%;background:${l.effectiveness > 80 ? '#22c55e' : l.effectiveness > 60 ? '#f59e0b' : '#ef4444'};border-radius:2px"></div>
              </div>
              <span style="color:${l.effectiveness > 80 ? '#22c55e' : l.effectiveness > 60 ? '#f59e0b' : '#ef4444'};font-weight:600;min-width:28px">${l.effectiveness}%</span>
              <span style="color:#9ca3af">Controls: ${l.controls}</span>
              <span style="color:#ef4444">Gaps: ${l.gaps}</span>
            </div>
          </div>
        `)}
        <div style="font-size:9px;font-weight:600;color:#9ca3af;margin-top:8px;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Alert Triage Efficiency</div>
        ${this._alertTriage.map(a => html`
          <div style="padding:3px 8px;background:#111827;border-radius:3px;margin-bottom:2px;display:flex;justify-content:space-between;align-items:center;font-size:8px">
            <span style="color:#e2e8f0;min-width:120px">${a.category}</span>
            <div style="display:flex;gap:8px">
              <span style="color:#9ca3af">Vol: ${a.volume}</span>
              <span style="color:#22c55e">Auto: ${a.autoResolved}</span>
              <span style="color:#f59e0b">Manual: ${a.manualTriage}</span>
              <span style="color:#60a5fa">Avg: ${a.avgTriageTime}s</span>
              <span style="color:${a.backlog > 10 ? '#ef4444' : '#22c55e'}">Backlog: ${a.backlog}</span>
            </div>
          </div>
        `)}
        <div style="font-size:9px;font-weight:600;color:#9ca3af;margin-top:8px;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Weekly Trend (FPR Reduction)</div>
        ${this._defenseTrend.map(t => html`
          <div style="padding:2px 8px;background:#111827;border-radius:2px;margin-bottom:1px;display:flex;justify-content:space-between;font-size:7px;color:#9ca3af">
            <span style="min-width:60px">${t.period}</span>
            <span>MTTD: ${fmtMins(t.mttD)}</span>
            <span>MTTC: ${fmtMins(t.mttC)}</span>
            <span>MTTR: ${fmtMins(t.mttR)}</span>
            <span style="color:${t.fpr < 78 ? '#22c55e' : '#f59e0b'}">FPR: ${t.fpr}%</span>
            <span style="color:#60a5fa">Coverage: ${t.coverage}%</span>
          </div>
        `)}
      </div>`;
  }


  // ─── Incident Post-Mortem Engine ───
  @state() private _pmActiveTab: string = 'timeline';
  @state() private _pmIncidents: Array<{ id: string; title: string; severity: string; date: string; status: string; rootCause: string; rcaMethod: string; timeline: Array<{ time: string; event: string; actor: string }>; impactMatrix: Array<{ dimension: string; score: number; description: string }>; actionItems: Array<{ id: string; title: string; owner: string; priority: string; status: string; dueDate: string }>; lessonsLearned: string[] }> = [];
  @state() private _pmSelectedIncident: string = '';
  @state() private _pmFishboneCategories: string[] = ['People', 'Process', 'Technology', 'Environment', 'Communication', 'External'];
  @state() private _pmFiveWhysResults: string[] = [];
  @state() private _pmReportFormat: string = 'detailed';

  private _initPostMortem(): void {
    if (this._pmIncidents.length > 0) return;
    this._pmIncidents = [
      {
        id: 'PM-2024-001', title: 'Ransomware Attack on File Servers', severity: 'critical',
        date: '2024-03-15', status: 'completed', rootCause: 'Unpatched VPN gateway + weak MFA',
        rcaMethod: '5-Whys',
        timeline: [
          { time: '03:12', event: 'Initial compromise via VPN vulnerability CVE-2024-1234', actor: 'APT-29' },
          { time: '03:45', event: 'Lateral movement to file server cluster', actor: 'APT-29' },
          { time: '04:02', event: 'Data exfiltration initiated (2.3 TB)', actor: 'APT-29' },
          { time: '04:30', event: 'Ransomware payload deployed across 14 servers', actor: 'APT-29' },
          { time: '05:15', event: 'SOC detected anomalous network traffic spike', actor: 'SOC Analyst' },
          { time: '05:30', event: 'Incident response team activated', actor: 'IR Lead' },
          { time: '06:00', event: 'Network segmentation completed', actor: 'Network Ops' },
          { time: '08:45', event: 'Containment achieved, forensic imaging started', actor: 'Forensic Team' },
        ],
        impactMatrix: [
          { dimension: 'Financial', score: 9, description: 'Estimated $4.2M in downtime, recovery, and regulatory fines' },
          { dimension: 'Operational', score: 8, description: '14 servers offline for 72 hours, 200+ users affected' },
          { dimension: 'Reputational', score: 7, description: 'Customer notification required, media coverage risk' },
          { dimension: 'Compliance', score: 6, description: 'GDPR breach notification, PCI-DSS audit triggered' },
          { dimension: 'Data Integrity', score: 9, description: '15% of encrypted files had no backup, permanent data loss' },
        ],
        actionItems: [
          { id: 'AI-001', title: 'Patch all VPN gateways to latest firmware', owner: 'Network Team', priority: 'critical', status: 'completed', dueDate: '2024-03-20' },
          { id: 'AI-002', title: 'Implement hardware MFA for all VPN users', owner: 'Identity Team', priority: 'critical', status: 'completed', dueDate: '2024-03-25' },
          { id: 'AI-003', title: 'Deploy network detection rules for lateral movement', owner: 'SOC', priority: 'high', status: 'in-progress', dueDate: '2024-04-01' },
          { id: 'AI-004', title: 'Review and update incident response playbook', owner: 'IR Lead', priority: 'high', status: 'pending', dueDate: '2024-04-15' },
          { id: 'AI-005', title: 'Implement immutable backups for critical file servers', owner: 'Backup Ops', priority: 'critical', status: 'completed', dueDate: '2024-03-22' },
        ],
        lessonsLearned: [
          'VPN gateway patching cycle was 90 days instead of the required 14 days',
          'MFA bypass was possible because SMS-based OTP was still allowed',
          'Network segmentation between DMZ and internal network was insufficient',
          'SOC lacked automated detection rules for lateral movement patterns',
          'Backup verification testing had not been performed in 6 months',
        ],
      },
      {
        id: 'PM-2024-002', title: 'Phishing Campaign Targeting Finance Team', severity: 'high',
        date: '2024-04-02', status: 'in-review', rootCause: 'Lack of URL sandboxing for email attachments',
        rcaMethod: 'Fishbone',
        timeline: [
          { time: '09:15', event: 'Spear-phishing email sent to 12 finance team members', actor: 'Threat Actor' },
          { time: '09:22', event: '3 users clicked malicious link in email', actor: 'Finance Staff' },
          { time: '09:25', event: 'Credential harvesting form submitted by 2 users', actor: 'Threat Actor' },
          { time: '09:45', event: 'Email gateway flagged campaign as spam (delayed)', actor: 'Email Gateway' },
          { time: '10:00', event: 'SOC received alert on suspicious login from new geolocation', actor: 'SOC Analyst' },
          { time: '10:15', event: 'Compromised accounts identified and locked', actor: 'Identity Team' },
        ],
        impactMatrix: [
          { dimension: 'Financial', score: 4, description: 'No direct financial loss, remediation cost estimated at $15K' },
          { dimension: 'Operational', score: 5, description: '2 accounts locked for 4 hours during investigation' },
          { dimension: 'Reputational', score: 2, description: 'Internal incident, no external disclosure needed' },
          { dimension: 'Compliance', score: 3, description: 'Minor policy violation, no regulatory impact' },
          { dimension: 'Data Integrity', score: 2, description: 'No data exfiltration detected' },
        ],
        actionItems: [
          { id: 'AI-010', title: 'Deploy URL sandboxing for all email attachments', owner: 'Email Admin', priority: 'high', status: 'in-progress', dueDate: '2024-04-20' },
          { id: 'AI-011', title: 'Mandatory anti-phishing training for finance team', owner: 'Security Awareness', priority: 'high', status: 'completed', dueDate: '2024-04-10' },
          { id: 'AI-012', title: 'Implement conditional access policies for finance apps', owner: 'Identity Team', priority: 'medium', status: 'pending', dueDate: '2024-05-01' },
        ],
        lessonsLearned: [
          'Email gateway sandboxing was disabled due to performance concerns',
          'Finance team had not received targeted phishing training in 12 months',
          'Geolocation-based anomaly detection had a 15-minute delay',
        ],
      },
      {
        id: 'PM-2024-003', title: 'Insider Data Exfiltration via Cloud Storage', severity: 'critical',
        date: '2024-04-10', status: 'completed', rootCause: 'Excessive cloud storage permissions + no DLP',
        rcaMethod: '5-Whys',
        timeline: [
          { time: '14:00', event: 'Employee uploaded 45GB of sensitive documents to personal cloud', actor: 'Insider' },
          { time: '14:30', event: 'DLP alert triggered on bulk upload (previously disabled)', actor: 'DLP System' },
          { time: '15:00', event: 'Security team initiated investigation', actor: 'Investigator' },
          { time: '16:00', event: 'Employee account suspended pending HR review', actor: 'Security Lead' },
          { time: '17:00', event: 'Legal team engaged for data breach assessment', actor: 'Legal Counsel' },
        ],
        impactMatrix: [
          { dimension: 'Financial', score: 7, description: 'Potential IP theft valued at $8M, legal costs TBD' },
          { dimension: 'Operational', score: 3, description: 'One account suspended, minimal operational disruption' },
          { dimension: 'Reputational', score: 6, description: 'Client trust impact if data reaches competitors' },
          { dimension: 'Compliance', score: 8, description: 'Multiple regulatory violations, potential fines' },
          { dimension: 'Data Integrity', score: 8, description: 'Trade secrets and client PII were exfiltrated' },
        ],
        actionItems: [
          { id: 'AI-020', title: 'Re-enable and tune DLP policies for cloud storage uploads', owner: 'DLP Admin', priority: 'critical', status: 'completed', dueDate: '2024-04-12' },
          { id: 'AI-021', title: 'Implement just-in-time access for sensitive document repositories', owner: 'IAM Team', priority: 'critical', status: 'in-progress', dueDate: '2024-04-25' },
          { id: 'AI-022', title: 'Deploy user behavior analytics for anomaly detection', owner: 'SOC', priority: 'high', status: 'pending', dueDate: '2024-05-10' },
        ],
        lessonsLearned: [
          'DLP policies were disabled 3 months ago without proper change approval',
          'Cloud storage permissions followed allow-all default rather than least-privilege',
          'No automated alerting for bulk uploads to external cloud services',
        ],
      },
    ];
    this._pmSelectedIncident = this._pmIncidents[0]?.id || '';
    this._pmFiveWhysResults = [
      'Why did the breach occur? -> Unpatched VPN gateway vulnerability was exploited',
      'Why was the VPN unpatched? -> Patching cycle was set to 90 days, not 14-day critical path',
      'Why was the patching cycle 90 days? -> Change management process required extensive testing',
      'Why was extensive testing required? -> Previous patch caused service disruption',
      'Why did previous patch cause disruption? -> No staging environment for pre-deployment validation',
    ];
  }

  private _getPmSelectedIncident() {
    return this._pmIncidents.find(i => i.id === this._pmSelectedIncident) || this._pmIncidents[0];
  }

  private _getPmSeverityColor(severity: string): string {
    return severity === 'critical' ? '#ff4757' : severity === 'high' ? '#ff6b35' : severity === 'medium' ? '#ffa502' : '#2ed573';
  }

  private _getPmActionCompletionRate(incident: typeof this._pmIncidents[0]): number {
    if (!incident || incident.actionItems.length === 0) return 0;
    return Math.round((incident.actionItems.filter(a => a.status === 'completed').length / incident.actionItems.length) * 100);
  }

  private _getPmAvgImpactScore(incident: typeof this._pmIncidents[0]): number {
    if (!incident || incident.impactMatrix.length === 0) return 0;
    return Math.round(incident.impactMatrix.reduce((s, m) => s + m.score, 0) / incident.impactMatrix.length * 10) / 10;
  }

  private _getPmTotalActionItems(): { total: number; completed: number; inProgress: number; pending: number } {
    const all = this._pmIncidents.flatMap(i => i.actionItems);
    return {
      total: all.length,
      completed: all.filter(a => a.status === 'completed').length,
      inProgress: all.filter(a => a.status === 'in-progress').length,
      pending: all.filter(a => a.status === 'pending').length,
    };
  }

  // ─── Security Metrics Benchmarking ───
  @state() private _benchActiveTab: string = 'overview';
  @state() private _benchSelectedFramework: string = 'cis';
  @state() private _benchMaturityData: Array<{ domain: string; currentLevel: number; targetLevel: number; industryAvg: number; gaps: string[] }> = [];
  @state() private _benchPeerComparison: Array<{ metric: string; ourValue: number; peerAvg: number; peerBest: number; industryStd: number; unit: string }> = [];
  @state() private _benchTrendData: Array<{ month: string; score: number; benchmark: number }> = [];

  private _initBenchmarking(): void {
    if (this._benchMaturityData.length > 0) return;
    this._benchMaturityData = [
      { domain: 'Governance & Risk', currentLevel: 4, targetLevel: 5, industryAvg: 3.2, gaps: ['Formal risk quantification not fully adopted', 'Board reporting cadence needs improvement'] },
      { domain: 'Identity & Access', currentLevel: 3, targetLevel: 4, industryAvg: 2.8, gaps: ['MFA coverage at 78%, target 95%', 'Privileged access review cycle too long'] },
      { domain: 'Data Protection', currentLevel: 3, targetLevel: 5, industryAvg: 2.5, gaps: ['DLP policies need tuning', 'Data classification incomplete for cloud workloads'] },
      { domain: 'Threat Detection', currentLevel: 4, targetLevel: 5, industryAvg: 3.0, gaps: ['MITRE ATT&CK coverage at 65%', 'Automated response playbooks need expansion'] },
      { domain: 'Vulnerability Mgmt', currentLevel: 3, targetLevel: 4, industryAvg: 2.9, gaps: ['Mean time to patch critical: 18 days (target: 7)', 'Asset inventory incomplete'] },
      { domain: 'Incident Response', currentLevel: 4, targetLevel: 5, industryAvg: 3.1, gaps: ['Tabletop exercises quarterly instead of monthly', 'Forensic capability gaps for cloud environments'] },
    ];
    this._benchPeerComparison = [
      { metric: 'Mean Time to Detect (MTTD)', ourValue: 4.2, peerAvg: 12.5, peerBest: 1.8, industryStd: 8.0, unit: 'hours' },
      { metric: 'Mean Time to Respond (MTTR)', ourValue: 2.1, peerAvg: 8.3, peerBest: 0.5, industryStd: 4.0, unit: 'hours' },
      { metric: 'Patch Compliance (Critical)', ourValue: 78, peerAvg: 65, peerBest: 98, industryStd: 80, unit: '%' },
      { metric: 'Phishing Click Rate', ourValue: 3.2, peerAvg: 12.5, peerBest: 0.8, industryStd: 8.0, unit: '%' },
      { metric: 'Vulnerability Backlog (Critical)', ourValue: 12, peerAvg: 45, peerBest: 2, industryStd: 25, unit: 'count' },
      { metric: 'Security Awareness Score', ourValue: 82, peerAvg: 68, peerBest: 96, industryStd: 75, unit: '%' },
      { metric: 'MFA Adoption Rate', ourValue: 78, peerAvg: 62, peerBest: 100, industryStd: 85, unit: '%' },
      { metric: 'Endpoint Compliance', ourValue: 91, peerAvg: 78, peerBest: 99, industryStd: 85, unit: '%' },
    ];
    this._benchTrendData = [
      { month: '2024-01', score: 62, benchmark: 58 },
      { month: '2024-02', score: 65, benchmark: 59 },
      { month: '2024-03', score: 61, benchmark: 60 },
      { month: '2024-04', score: 68, benchmark: 61 },
      { month: '2024-05', score: 72, benchmark: 62 },
      { month: '2024-06', score: 74, benchmark: 63 },
      { month: '2024-07', score: 73, benchmark: 64 },
      { month: '2024-08', score: 76, benchmark: 65 },
      { month: '2024-09', score: 79, benchmark: 66 },
      { month: '2024-10', score: 81, benchmark: 67 },
      { month: '2024-11', score: 83, benchmark: 68 },
      { month: '2024-12', score: 85, benchmark: 69 },
    ];
  }

  private _getBenchOverallMaturity(): number {
    if (this._benchMaturityData.length === 0) return 0;
    return Math.round(this._benchMaturityData.reduce((s, d) => s + d.currentLevel, 0) / this._benchMaturityData.length * 10) / 10;
  }

  private _getBenchTargetMaturity(): number {
    if (this._benchMaturityData.length === 0) return 0;
    return Math.round(this._benchMaturityData.reduce((s, d) => s + d.targetLevel, 0) / this._benchMaturityData.length * 10) / 10;
  }

  private _getBenchTotalGaps(): number {
    return this._benchMaturityData.reduce((s, d) => s + d.gaps.length, 0);
  }

  private _getBenchOutperformingMetrics(): number {
    return this._benchPeerComparison.filter(m => m.ourValue > m.peerAvg).length;
  }

  private _getBenchMaturityLevelLabel(level: number): string {
    const labels = ['', 'Initial', 'Developing', 'Defined', 'Managed', 'Optimizing'];
    return labels[level] || 'Unknown';
  }

  private _getBenchMaturityColor(level: number): string {
    if (level >= 4) return '#2ed573';
    if (level >= 3) return '#ffa502';
    if (level >= 2) return '#ff6b35';
    return '#ff4757';
  }

  private _getBenchScoreTrend(): string {
    if (this._benchTrendData.length < 2) return 'neutral';
    const recent = this._benchTrendData.slice(-3);
    const first = recent[0].score;
    const last = recent[recent.length - 1].score;
    if (last > first + 3) return 'improving';
    if (last < first - 3) return 'declining';
    return 'stable';
  }

  // ─── Alert Triage & Enrichment ───
  @state() private _triageActiveView: string = 'queue';
  @state() private _triageAlerts: Array<{ id: string; title: string; severity: string; source: string; status: string; score: number; confidence: number; enrichment: { iocCount: number; relatedAlerts: number; assetCriticality: string; threatIntelHits: number; mitreTactics: string[] }; assignedTo: string; created: string; enrichedAt: string }> = [];
  @state() private _triageRoutingRules: Array<{ id: string; name: string; condition: string; action: string; enabled: boolean }> = [];
  @state() private _triageEscalationPolicy: Array<{ level: number; threshold: string; notify: string; autoAction: string }> = [];

  private _initTriage(): void {
    if (this._triageAlerts.length > 0) return;
    this._triageAlerts = [
      { id: 'ALT-001', title: 'Brute force login attempt detected', severity: 'high', source: 'SIEM', status: 'new', score: 85, confidence: 92,
        enrichment: { iocCount: 3, relatedAlerts: 2, assetCriticality: 'high', threatIntelHits: 5, mitreTactics: ['TA0006', 'TA0001'] }, assignedTo: '', created: '2024-04-15T09:12:00Z', enrichedAt: '2024-04-15T09:12:05Z' },
      { id: 'ALT-002', title: 'Suspicious PowerShell execution on workstation', severity: 'critical', source: 'EDR', status: 'investigating', score: 95, confidence: 88,
        enrichment: { iocCount: 7, relatedAlerts: 5, assetCriticality: 'critical', threatIntelHits: 12, mitreTactics: ['TA0002', 'TA0005', 'TA0003'] }, assignedTo: 'SOC-L1-John', created: '2024-04-15T08:45:00Z', enrichedAt: '2024-04-15T08:45:03Z' },
      { id: 'ALT-003', title: 'Anomalous data transfer to external IP', severity: 'high', source: 'NDR', status: 'escalated', score: 88, confidence: 76,
        enrichment: { iocCount: 4, relatedAlerts: 3, assetCriticality: 'high', threatIntelHits: 8, mitreTactics: ['TA0010', 'TA0009'] }, assignedTo: 'SOC-L2-Sarah', created: '2024-04-15T07:30:00Z', enrichedAt: '2024-04-15T07:30:08Z' },
      { id: 'ALT-004', title: 'Failed SSL certificate validation', severity: 'low', source: 'Proxy', status: 'resolved', score: 25, confidence: 95,
        enrichment: { iocCount: 0, relatedAlerts: 0, assetCriticality: 'low', threatIntelHits: 0, mitreTactics: [] }, assignedTo: 'SOC-L1-Mike', created: '2024-04-15T06:15:00Z', enrichedAt: '2024-04-15T06:15:02Z' },
      { id: 'ALT-005', title: 'Privileged account used from new location', severity: 'critical', source: 'IAM', status: 'new', score: 92, confidence: 84,
        enrichment: { iocCount: 5, relatedAlerts: 4, assetCriticality: 'critical', threatIntelHits: 9, mitreTactics: ['TA0006', 'TA0001'] }, assignedTo: '', created: '2024-04-15T10:00:00Z', enrichedAt: '2024-04-15T10:00:04Z' },
      { id: 'ALT-006', title: 'Malware signature match on email attachment', severity: 'medium', source: 'Email GW', status: 'auto-contained', score: 72, confidence: 98,
        enrichment: { iocCount: 2, relatedAlerts: 1, assetCriticality: 'medium', threatIntelHits: 15, mitreTactics: ['TA0001'] }, assignedTo: 'Auto-Remediation', created: '2024-04-15T09:30:00Z', enrichedAt: '2024-04-15T09:30:01Z' },
    ];
    this._triageRoutingRules = [
      { id: 'RR-001', name: 'Critical Alert to SOC L2', condition: 'severity == critical AND score >= 90', action: 'Assign to SOC-L2 on-call', enabled: true },
      { id: 'RR-002', name: 'Threat Intel Match Enrichment', condition: 'threatIntelHits > 0', action: 'Auto-enrich with CTI context', enabled: true },
      { id: 'RR-003', name: 'Low Confidence Auto-Close', condition: 'confidence < 30 AND severity == low', action: 'Auto-close with note after 24h', enabled: true },
      { id: 'RR-004', name: 'Related Alert Grouping', condition: 'relatedAlerts > 2', action: 'Group as incident and notify IR lead', enabled: true },
      { id: 'RR-005', name: 'VIP Asset Escalation', condition: 'assetCriticality == critical AND severity >= high', action: 'Page on-call security engineer', enabled: false },
    ];
    this._triageEscalationPolicy = [
      { level: 1, threshold: 'No response in 15 minutes', notify: 'SOC L1 team chat', autoAction: 'Reassign to next available analyst' },
      { level: 2, threshold: 'No response in 30 minutes', notify: 'SOC L2 on-call via SMS', autoAction: 'Escalate to L2 queue' },
      { level: 3, threshold: 'No response in 60 minutes', notify: 'Security Manager + CISO', autoAction: 'Page on-call incident commander' },
      { level: 4, threshold: 'Active threat confirmed', notify: 'Executive team', autoAction: 'Activate full incident response' },
    ];
  }

  private _getTriageStats(): { total: number; newCount: number; investigating: number; escalated: number; resolved: number; autoContained: number } {
    return {
      total: this._triageAlerts.length,
      newCount: this._triageAlerts.filter(a => a.status === 'new').length,
      investigating: this._triageAlerts.filter(a => a.status === 'investigating').length,
      escalated: this._triageAlerts.filter(a => a.status === 'escalated').length,
      resolved: this._triageAlerts.filter(a => a.status === 'resolved').length,
      autoContained: this._triageAlerts.filter(a => a.status === 'auto-contained').length,
    };
  }

  private _getTriageAvgScore(): number {
    if (this._triageAlerts.length === 0) return 0;
    return Math.round(this._triageAlerts.reduce((s, a) => s + a.score, 0) / this._triageAlerts.length);
  }

  private _getTriageHighConfidence(): number {
    return this._triageAlerts.filter(a => a.confidence >= 85).length;
  }

  private _getTriageTopSource(): string {
    if (this._triageAlerts.length === 0) return 'N/A';
    const counts: Record<string, number> = {};
    this._triageAlerts.forEach(a => { counts[a.source] = (counts[a.source] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }

  private _getTriageActiveRoutingRules(): number {
    return this._triageRoutingRules.filter(r => r.enabled).length;
  }

  // ─── Security Architecture Review ───
  @state() private _archActiveSection: string = 'components';
  @state() private _archComponents: Array<{ id: string; name: string; category: string; trustZone: string; controls: string[]; status: string; lastReview: string; riskScore: number }> = [];
  @state() private _archTrustBoundaries: Array<{ id: string; name: string; from: string; to: string; controlType: string; enforcement: string; status: string }> = [];
  @state() private _archDecisionRecords: Array<{ id: string; title: string; date: string; status: string; context: string; decision: string; consequences: string }> = [];

  private _initArchitecture(): void {
    if (this._archComponents.length > 0) return;
    this._archComponents = [
      { id: 'AC-001', name: 'Web Application Firewall', category: 'Network Security', trustZone: 'DMZ', controls: ['OWASP CRS', 'Rate Limiting', 'Bot Detection', 'Geo-blocking'], status: 'active', lastReview: '2024-04-01', riskScore: 2 },
      { id: 'AC-002', name: 'Identity Provider (IdP)', category: 'Identity & Access', trustZone: 'Internal', controls: ['SAML 2.0', 'OIDC', 'MFA', 'Adaptive Auth', 'SSO'], status: 'active', lastReview: '2024-03-15', riskScore: 3 },
      { id: 'AC-003', name: 'Data Loss Prevention', category: 'Data Protection', trustZone: 'Internal', controls: ['Content Inspection', 'Endpoint Agent', 'Cloud API Integration', 'Encryption'], status: 'needs-review', lastReview: '2024-01-20', riskScore: 7 },
      { id: 'AC-004', name: 'SIEM Platform', category: 'Detection & Response', trustZone: 'SOC', controls: ['Log Aggregation', 'Correlation Rules', 'Threat Intel Feed', 'SOAR Integration'], status: 'active', lastReview: '2024-03-28', riskScore: 4 },
      { id: 'AC-005', name: 'Container Security Platform', category: 'Cloud Security', trustZone: 'Cloud', controls: ['Image Scanning', 'Runtime Protection', 'Network Policy', 'Secrets Management'], status: 'active', lastReview: '2024-04-05', riskScore: 3 },
      { id: 'AC-006', name: 'Zero Trust Network Access', category: 'Network Security', trustZone: 'Perimeter', controls: ['Micro-segmentation', 'Continuous Verification', 'Least Privilege Access', 'Device Trust'], status: 'implementing', lastReview: '2024-04-10', riskScore: 5 },
    ];
    this._archTrustBoundaries = [
      { id: 'TB-001', name: 'Internet to DMZ', from: 'External', to: 'DMZ', controlType: 'WAF + DDoS Protection', enforcement: 'Active', status: 'enforced' },
      { id: 'TB-002', name: 'DMZ to Internal', from: 'DMZ', to: 'Internal', controlType: 'Application Layer Firewall', enforcement: 'Active', status: 'enforced' },
      { id: 'TB-003', name: 'Internal to SOC', from: 'Internal', to: 'SOC', controlType: 'Role-Based Access + Network Segmentation', enforcement: 'Active', status: 'enforced' },
      { id: 'TB-004', name: 'Internal to Cloud', from: 'Internal', to: 'Cloud', controlType: 'CASB + Zero Trust', enforcement: 'Partial', status: 'partial' },
      { id: 'TB-005', name: 'Partner to Internal', from: 'External', to: 'Internal', controlType: 'VPN + MFA + Limited Access', enforcement: 'Active', status: 'needs-review' },
    ];
    this._archDecisionRecords = [
      { id: 'ADR-001', title: 'Adopt Zero Trust Architecture', date: '2024-01-15', status: 'accepted', context: 'VPN-based perimeter security is insufficient for hybrid workforce', decision: 'Implement ZTNA with micro-segmentation across all network zones', consequences: 'Reduced lateral movement risk, increased authentication friction' },
      { id: 'ADR-002', title: 'Migrate SIEM to Cloud-Native Platform', date: '2024-02-20', status: 'accepted', context: 'On-prem SIEM cannot scale to handle cloud log volume', decision: 'Migrate to cloud-native SIEM with 90-day retention', consequences: 'Better scalability, dependency on cloud provider uptime' },
      { id: 'ADR-003', title: 'Deploy Runtime Container Security', date: '2024-03-10', status: 'accepted', context: 'Static image scanning misses runtime threats and supply chain attacks', decision: 'Deploy eBPF-based runtime security agent in all Kubernetes clusters', consequences: 'Improved threat detection, minimal performance overhead' },
    ];
  }

  private _getArchComponentStats(): { total: number; active: number; needsReview: number; implementing: number; avgRisk: number } {
    const active = this._archComponents.filter(c => c.status === 'active').length;
    const needsReview = this._archComponents.filter(c => c.status === 'needs-review').length;
    const implementing = this._archComponents.filter(c => c.status === 'implementing').length;
    const avgRisk = this._archComponents.length > 0
      ? Math.round(this._archComponents.reduce((s, c) => s + c.riskScore, 0) / this._archComponents.length * 10) / 10 : 0;
    return { total: this._archComponents.length, active, needsReview, implementing, avgRisk };
  }

  private _getArchBoundaryStats(): { total: number; enforced: number; partial: number; needsReview: number } {
    return {
      total: this._archTrustBoundaries.length,
      enforced: this._archTrustBoundaries.filter(b => b.status === 'enforced').length,
      partial: this._archTrustBoundaries.filter(b => b.status === 'partial').length,
      needsReview: this._archTrustBoundaries.filter(b => b.status === 'needs-review').length,
    };
  }

  private _getArchControlCoverage(): number {
    if (this._archComponents.length === 0) return 0;
    const totalControls = this._archComponents.reduce((s, c) => s + c.controls.length, 0);
    return totalControls;
  }

  // ─── Continuous Monitoring Suite ───
  @state() private _monActiveView: string = 'dashboard';
  @state() private _monMetricGauges: Array<{ id: string; name: string; value: number; max: number; unit: string; status: string; trend: string }> = [];
  @state() private _monAnomalyStream: Array<{ id: string; timestamp: string; type: string; description: string; severity: string; source: string; status: string }> = [];
  @state() private _monHealthChecks: Array<{ service: string; status: string; latency: number; uptime: number; lastCheck: string; slaTarget: number }> = [];
  @state() private _monAlertFatigue: { totalAlerts: number; actionable: number; falsePositive: number; noiseRate: number; topNoiseSource: string; fatigueIndex: number } = { totalAlerts: 0, actionable: 0, falsePositive: 0, noiseRate: 0, topNoiseSource: '', fatigueIndex: 0 };

  private _initMonitoring(): void {
    if (this._monMetricGauges.length > 0) return;
    this._monMetricGauges = [
      { id: 'MG-001', name: 'Threat Detection Coverage', value: 72, max: 100, unit: '%', status: 'warning', trend: 'improving' },
      { id: 'MG-002', name: 'Mean Time to Detect', value: 4.2, max: 24, unit: 'hrs', status: 'healthy', trend: 'improving' },
      { id: 'MG-003', name: 'Mean Time to Respond', value: 2.1, max: 8, unit: 'hrs', status: 'healthy', trend: 'stable' },
      { id: 'MG-004', name: 'Patch Compliance', value: 78, max: 100, unit: '%', status: 'warning', trend: 'improving' },
      { id: 'MG-005', name: 'MFA Adoption', value: 78, max: 100, unit: '%', status: 'warning', trend: 'improving' },
      { id: 'MG-006', name: 'Security Posture Score', value: 82, max: 100, unit: '', status: 'healthy', trend: 'improving' },
      { id: 'MG-007', name: 'Endpoint Compliance', value: 91, max: 100, unit: '%', status: 'healthy', trend: 'stable' },
      { id: 'MG-008', name: 'Vulnerability SLA Compliance', value: 85, max: 100, unit: '%', status: 'healthy', trend: 'declining' },
    ];
    this._monAnomalyStream = [
      { id: 'AN-001', timestamp: '2024-04-15T10:32:00Z', type: 'Behavioral', description: 'Unusual login pattern detected for service account svc-backup', severity: 'high', source: 'UEBA', status: 'investigating' },
      { id: 'AN-002', timestamp: '2024-04-15T10:15:00Z', type: 'Network', description: 'DNS tunneling attempt blocked from workstation WS-042', severity: 'medium', source: 'NDR', status: 'blocked' },
      { id: 'AN-003', timestamp: '2024-04-15T09:58:00Z', type: 'Endpoint', description: 'New autorun key created on server SRV-DB-03', severity: 'high', source: 'EDR', status: 'investigating' },
      { id: 'AN-004', timestamp: '2024-04-15T09:30:00Z', type: 'Cloud', description: 'IAM role assumption from unexpected principal', severity: 'medium', source: 'CSPM', status: 'resolved' },
      { id: 'AN-005', timestamp: '2024-04-15T09:12:00Z', type: 'Data', description: 'Bulk download of sensitive files detected (3.2 GB in 5 min)', severity: 'critical', source: 'DLP', status: 'escalated' },
    ];
    this._monHealthChecks = [
      { service: 'SIEM Platform', status: 'healthy', latency: 45, uptime: 99.97, lastCheck: '2024-04-15T10:35:00Z', slaTarget: 99.9 },
      { service: 'EDR Agent Fleet', status: 'healthy', latency: 120, uptime: 99.85, lastCheck: '2024-04-15T10:35:00Z', slaTarget: 99.5 },
      { service: 'Threat Intel Feed', status: 'healthy', latency: 200, uptime: 99.99, lastCheck: '2024-04-15T10:35:00Z', slaTarget: 99.5 },
      { service: 'Vulnerability Scanner', status: 'degraded', latency: 3500, uptime: 98.2, lastCheck: '2024-04-15T10:35:00Z', slaTarget: 99.0 },
      { service: 'SOAR Platform', status: 'healthy', latency: 80, uptime: 99.95, lastCheck: '2024-04-15T10:35:00Z', slaTarget: 99.5 },
      { service: 'Log Forwarder Cluster', status: 'healthy', latency: 15, uptime: 99.98, lastCheck: '2024-04-15T10:35:00Z', slaTarget: 99.9 },
    ];
    this._monAlertFatigue = {
      totalAlerts: 1247, actionable: 312, falsePositive: 685,
      noiseRate: 54.9, topNoiseSource: 'Endpoint Detection (false positives on legitimate admin tools)',
      fatigueIndex: 3.8,
    };
  }

  private _getMonOverallHealth(): string {
    const degraded = this._monHealthChecks.filter(h => h.status !== 'healthy').length;
    if (degraded === 0) return 'healthy';
    if (degraded <= 1) return 'warning';
    return 'critical';
  }

  private _getMonAvgUptime(): number {
    if (this._monHealthChecks.length === 0) return 0;
    return Math.round(this._monHealthChecks.reduce((s, h) => s + h.uptime, 0) / this._monHealthChecks.length * 100) / 100;
  }

  private _getMonSlaBreaches(): number {
    return this._monHealthChecks.filter(h => h.uptime < h.slaTarget).length;
  }

  private _getMonActiveAnomalies(): number {
    return this._monAnomalyStream.filter(a => a.status !== 'resolved' && a.status !== 'blocked').length;
  }

  private _getMonGaugeStatusColor(status: string): string {
    if (status === 'healthy') return '#2ed573';
    if (status === 'warning') return '#ffa502';
    if (status === 'critical') return '#ff4757';
    return '#95a5a6';
  }




  // === Round 17: Risk Quantification Framework ===
  @state() private _apFairModel: any = null;
  @state() private _apRiskHeatMap: any = null;
  @state() private _apRiskAppetite: any = null;
  @state() private _apMonteCarlo: any = null;
  @state() private _apRiskRegister: any = null;
  @state() private _apRiskTrend: any = null;

  private apInitRiskQuant() {
    this._apFairModel = {
      scenarios: [
        { name: "Ransomware Attack", lef: 0.15, primaryLoss: 2500000, secondaryLoss: 800000, productivityLoss: 120000 },
        { name: "Data Breach (PII)", lef: 0.25, primaryLoss: 4800000, secondaryLoss: 1500000, productivityLoss: 200000 },
        { name: "Insider Threat", lef: 0.08, primaryLoss: 1800000, secondaryLoss: 600000, productivityLoss: 90000 },
        { name: "Supply Chain Compromise", lef: 0.05, primaryLoss: 3200000, secondaryLoss: 1100000, productivityLoss: 300000 },
        { name: "Cloud Misconfiguration", lef: 0.35, primaryLoss: 900000, secondaryLoss: 300000, productivityLoss: 60000 },
        { name: "Phishing Campaign", lef: 0.45, primaryLoss: 500000, secondaryLoss: 150000, productivityLoss: 40000 },
        { name: "Zero-Day Exploit", lef: 0.02, primaryLoss: 5500000, secondaryLoss: 2000000, productivityLoss: 500000 },
        { name: "DDoS Attack", lef: 0.20, primaryLoss: 700000, secondaryLoss: 200000, productivityLoss: 80000 }
      ],
      totalAlec: 8750000,
      riskCapacity: 12000000,
      toleranceThreshold: 75
    };
    this._apRiskHeatMap = ((): any[] => {
      const grid: any[] = [];
      const labels = ["Rare","Unlikely","Possible","Likely","Almost Certain"];
      const impacts = ["Negligible","Minor","Moderate","Major","Catastrophic"];
      const data = [
        [1,2,3,4,5],[2,4,6,8,10],[3,6,9,12,15],[4,8,12,16,20],[5,10,15,20,25]
      ];
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          const score = data[i][j];
          grid.push({ likelihood: labels[i], impact: impacts[j], score, risk: score <= 4 ? "Low" : score <= 9 ? "Medium" : score <= 15 ? "High" : "Critical", color: score <= 4 ? "#4caf50" : score <= 9 ? "#ff9800" : score <= 15 ? "#f44336" : "#9c27b0" });
        }
      }
      return grid;
    })();
    this._apRiskAppetite = {
      maxAcceptable: 5000000,
      boardApproved: 8000000,
      currentExposure: 6200000,
      categories: [
        { category: "Financial", appetite: 3000000, exposure: 2100000 },
        { category: "Reputational", appetite: 2000000, exposure: 1500000 },
        { category: "Operational", appetite: 1500000, exposure: 1200000 },
        { category: "Regulatory", appetite: 1000000, exposure: 800000 },
        { category: "Legal", appetite: 500000, exposure: 600000 }
      ]
    };
    this._apMonteCarlo = ((): any[] => {
      const results: any[] = [];
      for (let i = 0; i < 20; i++) {
        const seed = (i + 1) * 7919;
        const r1 = ((seed * 16807) % 2147483647) / 2147483647;
        const r2 = ((seed * 48271) % 2147483647) / 2147483647;
        const baseLoss = 2000000 + r1 * 6000000;
        const variance = baseLoss * (r2 - 0.5) * 0.4;
        results.push({ iteration: i + 1, loss: Math.round(baseLoss + variance), percentile: 0 });
      }
      results.sort((a, b) => a.loss - b.loss);
      results.forEach((r, i) => { r.percentile = Math.round(((i + 1) / results.length) * 100); });
      return results;
    })();
    this._apRiskRegister = [
      { id: "RSK-001", name: "Credential Stuffing", owner: "IAM Team", likelihood: 4, impact: 3, score: 12, status: "Mitigating", trend: "improving" },
      { id: "RSK-002", name: "Cloud Data Exposure", owner: "Cloud Sec", likelihood: 3, impact: 5, score: 15, status: "Open", trend: "stable" },
      { id: "RSK-003", name: "Third-Party Breach", owner: "GRC Team", likelihood: 3, impact: 4, score: 12, status: "Mitigating", trend: "worsening" },
      { id: "RSK-004", name: "Insider Data Theft", owner: "HR + SecOps", likelihood: 2, impact: 4, score: 8, status: "Monitoring", trend: "stable" },
      { id: "RSK-005", name: "Ransomware", owner: "SecOps", likelihood: 4, impact: 5, score: 20, status: "Mitigating", trend: "improving" },
      { id: "RSK-006", name: "API Security Flaw", owner: "AppSec", likelihood: 3, impact: 3, score: 9, status: "Open", trend: "worsening" },
      { id: "RSK-007", name: "Compliance Violation", owner: "GRC Team", likelihood: 2, impact: 5, score: 10, status: "Mitigating", trend: "improving" },
      { id: "RSK-008", name: "Social Engineering", owner: "SecAwareness", likelihood: 5, impact: 2, score: 10, status: "Monitoring", trend: "stable" }
    ];
    this._apRiskTrend = [
      { month: "Oct", critical: 3, high: 8, medium: 15, low: 22 },
      { month: "Nov", critical: 2, high: 7, medium: 14, low: 24 },
      { month: "Dec", critical: 4, high: 9, medium: 16, low: 20 },
      { month: "Jan", critical: 3, high: 8, medium: 13, low: 21 },
      { month: "Feb", critical: 2, high: 6, medium: 12, low: 23 },
      { month: "Mar", critical: 1, high: 5, medium: 11, low: 25 }
    ];
  }

  private apRenderRiskQuant() {
    const fm = this._apFairModel;
    if (!fm) return nothing;
    const fmt = (n: number) => n >= 1000000 ? (n / 1000000).toFixed(1) + "M" : (n / 1000).toFixed(0) + "K";
    const sevColor = (s: number) => s <= 4 ? "#4caf50" : s <= 9 ? "#ff9800" : s <= 15 ? "#f44336" : "#9c27b0";
    return html`<div class="card" style="padding:14px;margin-bottom:8px">
        <h4 style="margin:0 0 10px;color:#e0e0e0;font-size:13px">Risk Quantification Framework (FAIR)</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
          <div style="background:#1a1d27;border-radius:4px;padding:8px">
            <div style="color:#aaa;font-size:9px;margin-bottom:4px">Annual Loss Expectancy</div>
            <div style="color:#48f;font-size:18px;font-weight:bold">${fmt(fm.totalAlec)}</div>
            <div style="color:#888;font-size:8px">Capacity: ${fmt(fm.riskCapacity)}</div>
          </div>
          <div style="background:#1a1d27;border-radius:4px;padding:8px">
            <div style="color:#aaa;font-size:9px;margin-bottom:4px">Risk Tolerance</div>
            <div style="color:#f84;font-size:18px;font-weight:bold">${fm.toleranceThreshold}%</div>
            <div style="background:#1a1d27;border-radius:3px;height:6px;margin-top:4px;overflow:hidden">
              <div style="height:100%;width:${Math.round((fm.totalAlec / fm.riskCapacity) * 100)}%;background:${fm.totalAlec / fm.riskCapacity > 0.75 ? "#f44" : "#48f"}"></div>
            </div>
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin-bottom:6px">FAIR Model Scenarios</div>
        ${fm.scenarios.map((s: any) => html`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;font-size:9px">
            <span style="color:#ccc;width:130px;flex-shrink:0">${s.name}</span>
            <span style="color:#888;width:40px">LEF ${(s.lef * 100).toFixed(0)}%</span>
            <div style="flex:1;background:#1a1d27;border-radius:3px;height:5px;overflow:hidden">
              <div style="height:100%;width:${Math.min(100, (s.primaryLoss / 6000000) * 100)}%;background:${s.primaryLoss > 3000000 ? "#f44" : s.primaryLoss > 1500000 ? "#f84" : "#4caf50"}"></div>
            </div>
            <span style="color:#ddd;width:50px;text-align:right">${fmt(s.primaryLoss)}</span>
          </div>`)}
        <div style="color:#aaa;font-size:10px;margin:8px 0 6px">Risk Heat Map (5x5)</div>
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:2px;font-size:8px">
          ${this._apRiskHeatMap.map((c: any) => html`<div style="background:${c.color}22;border:1px solid ${c.color}44;border-radius:2px;padding:3px;text-align:center;color:${c.color}">
              <div>${c.score}</div>
            </div>`)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Monte Carlo Simulation (20 iterations)</div>
            ${this._apMonteCarlo.slice(0, 10).map((r: any) => html`<div style="display:flex;gap:4px;font-size:8px;margin-bottom:1px">
                <span style="color:#888;width:20px">#${r.iteration}</span>
                <div style="flex:1;background:#1a1d27;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${(r.loss / 8000000) * 100}%;background:${r.loss > 5000000 ? "#f44" : r.loss > 3000000 ? "#f84" : "#4caf50"}"></div>
                </div>
                <span style="color:#ccc;width:40px;text-align:right">${fmt(r.loss)}</span>
              </div>`)}
          </div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Risk Register (Top 8)</div>
            ${this._apRiskRegister.map((r: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
                <span style="color:${sevColor(r.score)};font-weight:bold;width:16px">${r.score}</span>
                <span style="color:#ccc;flex:1">${r.name}</span>
                <span style="color:${r.trend === "improving" ? "#4caf50" : r.trend === "worsening" ? "#f44" : "#888"};font-size:7px">${r.trend}</span>
              </div>`)}
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin:8px 0 4px">Risk Trend (6 months)</div>
        <div style="display:flex;gap:4px;align-items:flex-end;height:50px">
          ${this._apRiskTrend.map((t: any) => html`<div style="flex:1;display:flex;flex-direction:column;gap:1px;align-items:center">
              <div style="display:flex;gap:1px;align-items:flex-end;height:40px">
                <div style="width:8px;height:${(t.critical / 25) * 40}px;background:#f44;border-radius:1px"></div>
                <div style="width:8px;height:${(t.high / 25) * 40}px;background:#f84;border-radius:1px"></div>
                <div style="width:8px;height:${(t.medium / 25) * 40}px;background:#ff8;border-radius:1px"></div>
                <div style="width:8px;height:${(t.low / 25) * 40}px;background:#4caf50;border-radius:1px"></div>
              </div>
              <span style="color:#888;font-size:7px">${t.month}</span>
            </div>`)}
        </div>
      </div>`;
  }

  // === Round 17: Security Program Management ===
  @state() private _apOkrs: any = null;
  @state() private _apInitiatives: any = null;
  @state() private _apResourceAlloc: any = null;
  @state() private _apHeadcount: any = null;
  @state() private _apMilestones: any = null;
  @state() private _apBudget: any = null;

  private apInitSecProgram() {
    this._apOkrs = [
      { objective: "Reduce Mean Time to Detect", keyResults: [{ kr: "MTTD < 24 hours", progress: 72 }, { kr: "Deploy EDR to 100% endpoints", progress: 89 }, { kr: "SIEM coverage 95%+", progress: 81 }], overallProgress: 81 },
      { objective: "Eliminate Critical Vulnerabilities in 7 days", keyResults: [{ kr: "Patch SLA compliance > 95%", progress: 67 }, { kr: "Zero critical vulns > 30 days", progress: 45 }, { kr: "Automated patching 80%+", progress: 58 }], overallProgress: 57 },
      { objective: "Achieve Zero Trust Architecture", keyResults: [{ kr: "Micro-segment 90% workloads", progress: 63 }, { kr: "ZTNA adoption 100%", progress: 78 }, { kr: "Continuous verification deployed", progress: 54 }], overallProgress: 65 },
      { objective: "Build Security-First Culture", keyResults: [{ kr: "Phishing click rate < 3%", progress: 85 }, { kr: "Security training 100%", progress: 92 }, { kr: "DevSecOps maturity L3+", progress: 48 }], overallProgress: 75 }
    ];
    this._apInitiatives = [
      { name: "Zero Trust Migration", phase: "Phase 2", status: "On Track", owner: "ZT Program", budget: 1200000, spent: 680000, completion: 45, priority: "P0" },
      { name: "Cloud Security Posture", phase: "Phase 3", status: "At Risk", owner: "Cloud Sec", budget: 800000, spent: 750000, completion: 72, priority: "P0" },
      { name: "SOC Modernization", phase: "Phase 2", status: "On Track", owner: "SOC Lead", budget: 1500000, spent: 520000, completion: 35, priority: "P0" },
      { name: "AppSec Program", phase: "Phase 1", status: "On Track", owner: "AppSec Lead", budget: 600000, spent: 180000, completion: 25, priority: "P1" },
      { name: "Identity Governance", phase: "Phase 2", status: "Delayed", owner: "IAM Team", budget: 400000, spent: 380000, completion: 60, priority: "P1" },
      { name: "Threat Intelligence", phase: "Phase 1", status: "On Track", owner: "CTI Team", budget: 350000, spent: 120000, completion: 30, priority: "P1" },
      { name: "Vendor Risk Program", phase: "Phase 1", status: "On Track", owner: "GRC Team", budget: 250000, spent: 80000, completion: 20, priority: "P2" },
      { name: "Data Classification", phase: "Phase 2", status: "At Risk", owner: "Data Sec", budget: 300000, spent: 220000, completion: 55, priority: "P1" },
      { name: "Security Automation", phase: "Phase 2", status: "On Track", owner: "SecOps", budget: 500000, spent: 280000, completion: 40, priority: "P0" },
      { name: "Incident Response Upgrade", phase: "Phase 1", status: "On Track", owner: "IR Lead", budget: 200000, spent: 60000, completion: 22, priority: "P1" },
      { name: "Compliance Automation", phase: "Phase 1", status: "Delayed", owner: "GRC Team", budget: 450000, spent: 200000, completion: 35, priority: "P2" },
      { name: "Security Metrics Platform", phase: "Phase 1", status: "On Track", owner: "SecEng", budget: 300000, spent: 90000, completion: 28, priority: "P1" }
    ];
    this._apResourceAlloc = [
      { domain: "Security Operations", allocated: 35, used: 31, budget: 2800000 },
      { domain: "Identity & Access", allocated: 12, used: 11, budget: 960000 },
      { domain: "Application Security", allocated: 10, used: 8, budget: 800000 },
      { domain: "Cloud Security", allocated: 8, used: 9, budget: 640000 },
      { domain: "GRC & Compliance", allocated: 8, used: 7, budget: 640000 },
      { domain: "Threat Intelligence", allocated: 5, used: 4, budget: 400000 },
      { domain: "Security Engineering", allocated: 7, used: 6, budget: 560000 }
    ];
    this._apHeadcount = {
      total: 85, filled: 72, open: 13, budget: 10200000,
      byLevel: [{ level: "L3 (Senior)", count: 28, target: 32 }, { level: "L4 (Staff)", count: 18, target: 20 }, { level: "L5 (Principal)", count: 8, target: 10 }, { level: "L2 (Mid)", count: 14, target: 15 }, { level: "L1 (Junior)", count: 4, target: 8 }],
      criticalRoles: ["Cloud Security Architect", "Senior Threat Hunter", "AppSec Engineer", "SOC Analyst L2"]
    };
    this._apMilestones = [
      { initiative: "Zero Trust", milestone: "Micro-seg Phase 2 complete", due: "2026-03-31", status: "On Track", rag: "green" },
      { initiative: "SOC Mod", milestone: "SOAR platform deployed", due: "2026-04-15", status: "At Risk", rag: "amber" },
      { initiative: "Cloud Sec", milestone: "CSPM full coverage", due: "2026-05-01", status: "Behind", rag: "red" },
      { initiative: "AppSec", milestone: "SAST in all CI/CD", due: "2026-06-30", status: "On Track", rag: "green" },
      { initiative: "IAM", milestone: "PAM deployment complete", due: "2026-04-30", status: "Delayed", rag: "red" },
      { initiative: "Automation", milestone: "50% alert triage automated", due: "2026-05-15", status: "On Track", rag: "green" }
    ];
    this._apBudget = {
      total: 10200000, allocated: 9650000, spent: 5480000, remaining: 4170000,
      quarterly: [{ q: "Q1", allocated: 2412500, spent: 2412500 }, { q: "Q2", allocated: 2412500, spent: 1950000 }, { q: "Q3", allocated: 2412500, spent: 1117500 }, { q: "Q4", allocated: 2412500, spent: 0 }],
      byCategory: [{ cat: "Personnel", pct: 68 }, { cat: "Tools & Licenses", pct: 18 }, { cat: "Services", pct: 9 }, { cat: "Training", pct: 5 }]
    };
  }

  private apRenderSecProgram() {
    const okrs = this._apOkrs;
    if (!okrs) return nothing;
    const fmt = (n: number) => n >= 1000000 ? (n / 1000000).toFixed(1) + "M" : (n / 1000).toFixed(0) + "K";
    const ragColor = (r: string) => r === "green" ? "#4caf50" : r === "amber" ? "#ff9800" : "#f44";
    const statusColor = (s: string) => s === "On Track" ? "#4caf50" : s === "At Risk" ? "#ff9800" : "#f44";
    return html`<div class="card" style="padding:14px;margin-bottom:8px">
        <h4 style="margin:0 0 10px;color:#e0e0e0;font-size:13px">Security Program Management</h4>
        <div style="color:#aaa;font-size:10px;margin-bottom:6px">OKR Tracking</div>
        ${okrs.map((o: any) => html`<div style="margin-bottom:8px;background:#1a1d27;border-radius:4px;padding:8px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
              <span style="color:#e0e0e0;font-size:10px;font-weight:bold">${o.objective}</span>
              <span style="color:${o.overallProgress >= 75 ? "#4caf50" : o.overallProgress >= 50 ? "#ff9800" : "#f44"};font-size:10px;font-weight:bold">${o.overallProgress}%</span>
            </div>
            <div style="background:#111;border-radius:3px;height:6px;overflow:hidden;margin-bottom:4px">
              <div style="height:100%;width:${o.overallProgress}%;background:${o.overallProgress >= 75 ? "#4caf50" : o.overallProgress >= 50 ? "#ff9800" : "#f44"};transition:width 0.3s"></div>
            </div>
            ${o.keyResults.map((kr: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#888;width:12px">${kr.progress >= 75 ? "\u2713" : kr.progress >= 50 ? "\u25CB" : "\u25CB"}</span>
                <span style="color:#bbb;flex:1">${kr.kr}</span>
                <span style="color:#aaa;width:24px;text-align:right">${kr.progress}%</span>
              </div>`)}
          </div>`)}
        <div style="color:#aaa;font-size:10px;margin:6px 0 4px">Initiative Roadmap (12 initiatives)</div>
        <div style="max-height:120px;overflow-y:auto">
          ${this._apInitiatives.map((i: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
              <span style="color:${i.priority === "P0" ? "#f44" : i.priority === "P1" ? "#f84" : "#888"};font-weight:bold;width:16px">${i.priority}</span>
              <span style="color:#ccc;flex:1">${i.name}</span>
              <span style="color:${statusColor(i.status)};width:50px">${i.status}</span>
              <span style="color:#888;width:24px;text-align:right">${i.completion}%</span>
            </div>`)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Resource Allocation</div>
            ${this._apResourceAlloc.slice(0, 5).map((r: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;width:90px">${r.domain}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${(r.used / r.allocated) * 100}%;background:${r.used > r.allocated ? "#f44" : "#48f"}"></div>
                </div>
                <span style="color:#888">${r.used}/${r.allocated}</span>
              </div>`)}
          </div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Budget Utilization</div>
            <div style="font-size:9px;color:#ccc;margin-bottom:4px">Total: ${fmt(this._apBudget.total)} | Spent: ${fmt(this._apBudget.spent)}</div>
            ${this._apBudget.quarterly.map((q: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#888;width:16px">${q.q}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${(q.spent / q.allocated) * 100}%;background:#48f"></div>
                </div>
                <span style="color:#aaa">${fmt(q.spent)}</span>
              </div>`)}
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin:6px 0 4px">Milestone Tracker</div>
        ${this._apMilestones.map((m: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
            <div style="width:6px;height:6px;border-radius:50%;background:${ragColor(m.rag)}"></div>
            <span style="color:#ccc;width:60px">${m.initiative}</span>
            <span style="color:#bbb;flex:1">${m.milestone}</span>
            <span style="color:#888">${m.due}</span>
          </div>`)}
      </div>`;
  }

  // === Round 17: Third-Party Risk Assessment ===
  @state() private _apVendorTiers: any = null;
  @state() private _apDueDiligence: any = null;
  @state() private _apContractClauses: any = null;
  @state() private _apVendorScorecard: any = null;
  @state() private _apSubProcessors: any = null;
  @state() private _apVendorIncidents: any = null;

  private apInitThirdParty() {
    this._apVendorTiers = [
      { tier: "Critical", count: 8, vendors: ["AWS", "Azure AD", "CrowdStrike", "Okta", "ServiceNow", "Salesforce", "Workday", "Datadog"] },
      { tier: "High", count: 14, vendors: ["Slack", "GitHub", "Jenkins", "Terraform", "Artifactory", "Snyk", "Palo Alto", "Zscaler"] },
      { tier: "Medium", count: 32, vendors: ["Figma", "Confluence", "Zoom", "Dropbox", "Notion", "Linear"] },
      { tier: "Low", count: 67, vendors: ["Various SaaS tools", "Utilities", "Dev tools"] }
    ];
    this._apDueDiligence = [
      { item: "SOC 2 Type II Report", required: true, passRate: 0.78 },
      { item: "ISO 27001 Certification", required: true, passRate: 0.65 },
      { item: "Penetration Test Results", required: true, passRate: 0.72 },
      { item: "Data Processing Agreement", required: true, passRate: 0.91 },
      { item: "Sub-processor List", required: true, passRate: 0.85 },
      { item: "Incident Response Plan", required: true, passRate: 0.68 },
      { item: "Business Continuity Plan", required: false, passRate: 0.58 },
      { item: "Encryption Standards", required: true, passRate: 0.88 },
      { item: "Access Control Policy", required: true, passRate: 0.76 },
      { item: "Vulnerability Management", required: true, passRate: 0.71 },
      { item: "Data Retention Policy", required: false, passRate: 0.64 },
      { item: "Privacy Impact Assessment", required: false, passRate: 0.52 },
      { item: "Insurance Coverage", required: true, passRate: 0.45 },
      { item: "Right to Audit Clause", required: true, passRate: 0.82 },
      { item: "Breach Notification SLA", required: true, passRate: 0.90 }
    ];
    this._apContractClauses = [
      { clause: "Data Breach Notification", vendors: 98, compliant: 89, gap: 9 },
      { clause: "Right to Audit", vendors: 85, compliant: 72, gap: 13 },
      { clause: "Data Return on Termination", vendors: 92, compliant: 78, gap: 14 },
      { clause: "Liability Cap", vendors: 90, compliant: 65, gap: 25 },
      { clause: "Sub-processor Restrictions", vendors: 88, compliant: 80, gap: 8 },
      { clause: "Encryption Requirements", vendors: 95, compliant: 91, gap: 4 },
      { clause: "Incident Response SLA", vendors: 86, compliant: 74, gap: 12 },
      { clause: "Data Residency", vendors: 78, compliant: 62, gap: 16 }
    ];
    this._apVendorScorecard = [
      { vendor: "AWS", security: 92, compliance: 95, reliability: 98, risk: "Low", overall: 95 },
      { vendor: "CrowdStrike", security: 94, compliance: 90, reliability: 96, risk: "Low", overall: 93 },
      { vendor: "Okta", security: 85, compliance: 92, reliability: 90, risk: "Low", overall: 89 },
      { vendor: "GitHub", security: 82, compliance: 78, reliability: 94, risk: "Medium", overall: 85 },
      { vendor: "Slack", security: 78, compliance: 80, reliability: 92, risk: "Medium", overall: 83 },
      { vendor: "Figma", security: 75, compliance: 72, reliability: 88, risk: "Medium", overall: 78 },
      { vendor: "Linear", security: 70, compliance: 65, reliability: 90, risk: "Medium", overall: 75 },
      { vendor: "StartupAI Inc", security: 55, compliance: 48, reliability: 72, risk: "High", overall: 58 }
    ];
    this._apSubProcessors = [
      { vendor: "AWS", subProcessors: ["CloudFront", "S3 (US-East)", "DynamoDB", "Lambda"], reviewed: "2026-01" },
      { vendor: "CrowdStrike", subProcessors: ["AWS (hosting)", "Snowflake (analytics)"], reviewed: "2026-02" },
      { vendor: "Okta", subProcessors: ["AWS", "MongoDB Atlas"], reviewed: "2026-01" },
      { vendor: "Salesforce", subProcessors: ["AWS", "Heroku", "MuleSoft"], reviewed: "2025-11" },
      { vendor: "Datadog", subProcessors: ["GCP", "AWS"], reviewed: "2026-03" }
    ];
    this._apVendorIncidents = [
      { vendor: "Okta", date: "2026-01-15", severity: "Medium", description: "Support access breach", resolved: true, ourImpact: "None" },
      { vendor: "Cloudflare", date: "2026-02-20", severity: "Low", description: "Config exposure", resolved: true, ourImpact: "Minimal" },
      { vendor: "GitHub", date: "2026-03-05", severity: "Low", description: "Dependency confusion", resolved: true, ourImpact: "None" },
      { vendor: "StartupAI Inc", date: "2026-03-18", severity: "High", description: "Data exposure incident", resolved: false, ourImpact: "Under review" }
    ];
  }

  private apRenderThirdParty() {
    const tiers = this._apVendorTiers;
    if (!tiers) return nothing;
    const tierColor = (t: string) => t === "Critical" ? "#f44" : t === "High" ? "#f84" : t === "Medium" ? "#ff8" : "#888";
    const sevColor = (s: string) => s === "High" ? "#f44" : s === "Medium" ? "#f84" : "#888";
    return html`<div class="card" style="padding:14px;margin-bottom:8px">
        <h4 style="margin:0 0 10px;color:#e0e0e0;font-size:13px">Third-Party Risk Assessment</h4>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px">
          ${tiers.map((t: any) => html`<div style="background:#1a1d27;border-radius:4px;padding:8px;text-align:center;border-top:2px solid ${tierColor(t.tier)}">
              <div style="color:${tierColor(t.tier)};font-size:18px;font-weight:bold">${t.count}</div>
              <div style="color:#aaa;font-size:9px">${t.tier}</div>
            </div>`)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Due Diligence Pass Rate</div>
            ${this._apDueDiligence.slice(0, 8).map((d: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:${d.required ? "#f44" : "#888"};width:8px">${d.required ? "*" : ""}</span>
                <span style="color:#ccc;flex:1">${d.item}</span>
                <div style="width:40px;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${d.passRate * 100}%;background:${d.passRate > 0.8 ? "#4caf50" : d.passRate > 0.6 ? "#ff9800" : "#f44"}"></div>
                </div>
                <span style="color:#888;width:28px;text-align:right">${(d.passRate * 100).toFixed(0)}%</span>
              </div>`)}
          </div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Contract Clause Compliance</div>
            ${this._apContractClauses.map((c: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;flex:1">${c.clause}</span>
                <span style="color:${c.gap > 15 ? "#f44" : c.gap > 8 ? "#f84" : "#4caf50"};width:28px;text-align:right">${c.gap} gap</span>
              </div>`)}
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin-bottom:4px">Vendor Security Scorecard</div>
        ${this._apVendorScorecard.map((v: any) => html`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;font-size:8px">
            <span style="color:#ccc;width:80px;flex-shrink:0">${v.vendor}</span>
            <div style="display:flex;gap:2px;flex:1">
              <div title="Security" style="width:30px;background:#111;border-radius:2px;height:6px;overflow:hidden"><div style="height:100%;width:${v.security}%;background:#48f"></div></div>
              <div title="Compliance" style="width:30px;background:#111;border-radius:2px;height:6px;overflow:hidden"><div style="height:100%;width:${v.compliance}%;background:#4caf50"></div></div>
              <div title="Reliability" style="width:30px;background:#111;border-radius:2px;height:6px;overflow:hidden"><div style="height:100%;width:${v.reliability}%;background:#ff9800"></div></div>
            </div>
            <span style="color:${tierColor(v.risk)};font-weight:bold;width:40px;text-align:right">${v.overall}</span>
          </div>`)}
        <div style="color:#aaa;font-size:10px;margin:8px 0 4px">Vendor Incidents (Recent)</div>
        ${this._apVendorIncidents.map((i: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
            <div style="width:6px;height:6px;border-radius:50%;background:${sevColor(i.severity)}"></div>
            <span style="color:#ccc;width:70px">${i.vendor}</span>
            <span style="color:#bbb;flex:1">${i.description}</span>
            <span style="color:${i.resolved ? "#4caf50" : "#f44"}">${i.resolved ? "Resolved" : "Open"}</span>
          </div>`)}
      </div>`;
  }

  // === Round 17: Data Loss Prevention ===
  @state() private _apDlpRules: any = null;
  @state() private _apDataMovement: any = null;
  @state() private _apDataDiscovery: any = null;
  @state() private _apDlpIncidents: any = null;
  @state() private _apEncryptionMatrix: any = null;

  private apInitDLP() {
    this._apDlpRules = [
      { rule: "PII Detection (SSN)", type: "Content", channel: "Email+Cloud", enabled: true, matches: 234, blocked: 218, severity: "Critical" },
      { rule: "Credit Card Numbers", type: "Pattern", channel: "All", enabled: true, matches: 156, blocked: 148, severity: "Critical" },
      { rule: "Source Code Export", type: "Fingerprint", channel: "USB+Cloud", enabled: true, matches: 89, blocked: 85, severity: "High" },
      { rule: "Healthcare Records", type: "Content", channel: "Email", enabled: true, matches: 45, blocked: 42, severity: "Critical" },
      { rule: "Financial Reports", type: "Label", channel: "Email+Cloud", enabled: true, matches: 178, blocked: 165, severity: "High" },
      { rule: "API Key Detection", type: "Pattern", channel: "All", enabled: true, matches: 312, blocked: 301, severity: "High" },
      { rule: "Bulk Data Transfer", type: "Behavioral", channel: "Network", enabled: true, matches: 67, blocked: 58, severity: "Medium" },
      { rule: "Credential in Code", type: "Pattern", channel: "Git+Chat", enabled: true, matches: 445, blocked: 438, severity: "High" },
      { rule: "Encrypted Archive Upload", type: "Behavioral", channel: "Cloud", enabled: false, matches: 23, blocked: 0, severity: "Medium" },
      { rule: "Off-hours Data Access", type: "Behavioral", channel: "All", enabled: true, matches: 92, blocked: 78, severity: "Medium" }
    ];
    this._apDataMovement = {
      totalEvents: 15847, monitored: 12456, blocked: 1533, allowed: 10923,
      byChannel: [{ channel: "Email", events: 5234, blocked: 892 }, { channel: "Cloud Upload", events: 4123, blocked: 345 }, { channel: "USB", events: 1234, blocked: 198 }, { channel: "Network", events: 3890, blocked: 67 }, { channel: "Print", events: 1366, blocked: 31 }],
      bySensitivity: [{ level: "Confidential", pct: 35 }, { level: "Internal", pct: 45 }, { level: "Public", pct: 20 }]
    };
    this._apDataDiscovery = [
      { location: "SharePoint", total: 245000, sensitive: 12300, unclassified: 45000, lastScan: "2026-04-20" },
      { location: "S3 Buckets", total: 189000, sensitive: 8900, unclassified: 32000, lastScan: "2026-04-21" },
      { location: "Database Servers", total: 3400, sensitive: 2100, unclassified: 800, lastScan: "2026-04-19" },
      { location: "File Shares", total: 156000, sensitive: 6700, unclassified: 28000, lastScan: "2026-04-18" },
      { location: "Endpoints", total: 89000, sensitive: 3400, unclassified: 15000, lastScan: "2026-04-21" }
    ];
    this._apDlpIncidents = [
      { id: "DLP-001", type: "PII Exposure", status: "Resolved", severity: "Critical", assignee: "SecOps", time: "2h" },
      { id: "DLP-002", type: "Source Code Leak", status: "Investigating", severity: "High", assignee: "AppSec", time: "4h" },
      { id: "DLP-003", type: "Credential Commit", status: "Resolved", severity: "High", assignee: "DevSecOps", time: "1h" },
      { id: "DLP-004", type: "Bulk Export", status: "Monitoring", severity: "Medium", assignee: "SOC", time: "8h" },
      { id: "DLP-005", type: "API Key in Log", status: "Resolved", severity: "Medium", assignee: "SecOps", time: "30m" }
    ];
    this._apEncryptionMatrix = [
      { data: "PII at Rest", algorithm: "AES-256-GCM", coverage: 98, keyMgmt: "KMS" },
      { data: "PII in Transit", algorithm: "TLS 1.3", coverage: 100, keyMgmt: "Auto" },
      { data: "Source Code", algorithm: "AES-256-CBC", coverage: 85, keyMgmt: "Git Crypt" },
      { data: "Database", algorithm: "AES-256", coverage: 95, keyMgmt: "KMS" },
      { data: "Backups", algorithm: "AES-256-GCM", coverage: 92, keyMgmt: "KMS" },
      { data: "Email", algorithm: "TLS 1.2+", coverage: 88, keyMgmt: "S/MIME" },
      { data: "File Shares", algorithm: "BitLocker", coverage: 76, keyMgmt: "AD CS" },
      { data: "Cloud Storage", algorithm: "SSE-KMS", coverage: 94, keyMgmt: "Cloud KMS" }
    ];
  }

  private apRenderDLP() {
    const rules = this._apDlpRules;
    if (!rules) return nothing;
    const sevColor = (s: string) => s === "Critical" ? "#f44" : s === "High" ? "#f84" : "#ff8";
    const statusColor = (s: string) => s === "Resolved" ? "#4caf50" : s === "Investigating" ? "#f84" : "#ff8";
    return html`<div class="card" style="padding:14px;margin-bottom:8px">
        <h4 style="margin:0 0 10px;color:#e0e0e0;font-size:13px">Data Loss Prevention</h4>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px">
          ${[["Monitored",this._apDataMovement.monitored.toLocaleString(),"#48f"],["Blocked",this._apDataMovement.blocked.toLocaleString(),"#f44"],["Rules",rules.length,"#ff8"],["Incidents",this._apDlpIncidents.length,"#f84"]].map(([l,v,c]) => html`<div style="background:#1a1d27;border-radius:4px;padding:6px;text-align:center">
              <div style="color:${c};font-size:16px;font-weight:bold">${v}</div>
              <div style="color:#888;font-size:8px">${l}</div>
            </div>`)}
        </div>
        <div style="color:#aaa;font-size:10px;margin-bottom:4px">DLP Policy Rules (10 active)</div>
        ${rules.slice(0, 6).map((r: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
            <div style="width:6px;height:6px;border-radius:50%;background:${r.enabled ? "#4f4" : "#666"}"></div>
            <span style="color:#ccc;flex:1">${r.rule}</span>
            <span style="color:${sevColor(r.severity)};width:40px;text-align:right">${r.blocked}/${r.matches}</span>
          </div>`)}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Data Movement by Channel</div>
            ${this._apDataMovement.byChannel.map((c: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;width:60px">${c.channel}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${(c.events / 5500) * 100}%;background:#48f"></div>
                </div>
                <span style="color:#888;width:30px;text-align:right">${c.blocked}</span>
              </div>`)}
          </div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Encryption Coverage</div>
            ${this._apEncryptionMatrix.map((e: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;width:60px">${e.data}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${e.coverage}%;background:${e.coverage >= 95 ? "#4caf50" : e.coverage >= 85 ? "#ff9800" : "#f44"}"></div>
                </div>
                <span style="color:#888;width:28px;text-align:right">${e.coverage}%</span>
              </div>`)}
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin:6px 0 4px">DLP Incident Response</div>
        ${this._apDlpIncidents.map((i: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
            <span style="color:${statusColor(i.status)};width:70px">${i.status}</span>
            <span style="color:#ccc;flex:1">${i.type}</span>
            <span style="color:${sevColor(i.severity)}">${i.severity}</span>
            <span style="color:#888">${i.time}</span>
          </div>`)}
      </div>`;
  }

  // === Round 17: Security Automation Metrics ===
  @state() private _apAutoMetrics: any = null;
  @state() private _apAutoTimeSaved: any = null;
  @state() private _apAutoReliability: any = null;
  @state() private _apAutoComparison: any = null;
  @state() private _apAutoROI: any = null;
  @state() private _apAutoCandidates: any = null;

  private apInitAutomation() {
    this._apAutoMetrics = {
      totalPlaybooks: 48, activePlaybooks: 42, triggered: 12847, successful: 12156, failed: 691,
      coverage: 67, targetCoverage: 85, mttrReduction: 58, falsePositiveRate: 3.2
    };
    this._apAutoTimeSaved = [
      { task: "Alert Triage", manualMin: 15, autoMin: 0.5, daily: 120, savedHours: 2920 },
      { task: "Vuln Scanning", manualMin: 60, autoMin: 5, daily: 8, savedHours: 2730 },
      { task: "Patch Deployment", manualMin: 45, autoMin: 10, daily: 15, savedHours: 2555 },
      { task: "User Provisioning", manualMin: 30, autoMin: 2, daily: 25, savedHours: 1825 },
      { task: "Compliance Reporting", manualMin: 120, autoMin: 15, daily: 1, savedHours: 639 },
      { task: "Incident Escalation", manualMin: 10, autoMin: 1, daily: 45, savedHours: 2737 },
      { task: "Log Analysis", manualMin: 90, autoMin: 8, daily: 3, savedHours: 1277 },
      { task: "Threat Intel Enrichment", manualMin: 20, autoMin: 3, daily: 60, savedHours: 1972 }
    ];
    this._apAutoReliability = [
      { playbook: "Phishing Auto-Block", success: 98.5, executions: 4521, avgTime: "1.2s" },
      { playbook: "Vuln Auto-Scan", success: 97.2, executions: 2340, avgTime: "4.5m" },
      { playbook: "User Offboard", success: 99.1, executions: 156, avgTime: "30s" },
      { playbook: "Alert Enrichment", success: 96.8, executions: 8945, avgTime: "3.1s" },
      { playbook: "Malware Isolate", success: 95.4, executions: 89, avgTime: "8.2s" },
      { playbook: "Compliance Check", success: 94.7, executions: 365, avgTime: "2.1m" }
    ];
    this._apAutoComparison = [
      { process: "Vulnerability Management", manual: 45, automated: 12, reduction: 73 },
      { process: "Incident Response", manual: 180, automated: 65, reduction: 64 },
      { process: "Access Reviews", manual: 30, automated: 5, reduction: 83 },
      { process: "Compliance Audits", manual: 120, automated: 45, reduction: 63 },
      { process: "Threat Detection", manual: 60, automated: 8, reduction: 87 },
      { process: "Configuration Drift", manual: 40, automated: 10, reduction: 75 }
    ];
    this._apAutoROI = {
      investment: 850000, annualSavings: 2100000, roi: 147,
      costAvoidance: 1200000, efficiencyGain: 900000, headcountSaved: 4.5
    };
    this._apAutoCandidates = [
      { task: "Security Questionnaire Response", complexity: "Medium", savings: "120 hrs/yr", priority: "High" },
      { task: "Certificate Rotation", complexity: "Low", savings: "80 hrs/yr", priority: "High" },
      { task: "Firewall Rule Review", complexity: "High", savings: "200 hrs/yr", priority: "Medium" },
      { task: "Data Classification Tagging", complexity: "Medium", savings: "150 hrs/yr", priority: "High" },
      { task: "Vendor Risk Scoring", complexity: "Medium", savings: "90 hrs/yr", priority: "Medium" },
      { task: "Security Awareness Campaigns", complexity: "Low", savings: "60 hrs/yr", priority: "Low" }
    ];
  }

  private apRenderAutomation() {
    const m = this._apAutoMetrics;
    if (!m) return nothing;
    return html`<div class="card" style="padding:14px;margin-bottom:8px">
        <h4 style="margin:0 0 10px;color:#e0e0e0;font-size:13px">Security Automation Metrics</h4>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px">
          ${[["Coverage",m.coverage + "%","#48f"],["Playbooks",m.activePlaybooks,"#4caf50"],["MTTR Reduction",m.mttrReduction + "%","#f84"],["False + Rate",m.falsePositiveRate + "%","#ff8"]].map(([l,v,c]) => html`<div style="background:#1a1d27;border-radius:4px;padding:6px;text-align:center">
              <div style="color:${c};font-size:16px;font-weight:bold">${v}</div>
              <div style="color:#888;font-size:8px">${l}</div>
            </div>`)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Time Saved by Task (annual hours)</div>
            ${this._apAutoTimeSaved.slice(0, 5).map((t: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;width:90px">${t.task}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${(t.savedHours / 3000) * 100}%;background:#48f"></div>
                </div>
                <span style="color:#888;width:40px;text-align:right">${t.savedHours}h</span>
              </div>`)}
          </div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Playbook Reliability</div>
            ${this._apAutoReliability.map((p: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;width:90px">${p.playbook}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${p.success}%;background:${p.success >= 97 ? "#4caf50" : p.success >= 95 ? "#ff9800" : "#f44"}"></div>
                </div>
                <span style="color:#888;width:35px;text-align:right">${p.success}%</span>
              </div>`)}
          </div>
        </div>
        <div style="background:#1a1d27;border-radius:4px;padding:8px;margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="color:#aaa;font-size:9px">Automation ROI</div>
              <div style="color:#4caf50;font-size:16px;font-weight:bold">${this._apAutoROI.roi}%</div>
            </div>
            <div style="text-align:center">
              <div style="color:#aaa;font-size:9px">Annual Savings</div>
              <div style="color:#48f;font-size:16px;font-weight:bold">${(this._apAutoROI.annualSavings / 1000000).toFixed(1)}M</div>
            </div>
            <div style="text-align:center">
              <div style="color:#aaa;font-size:9px">Headcount Saved</div>
              <div style="color:#ff8;font-size:16px;font-weight:bold">${this._apAutoROI.headcountSaved}</div>
            </div>
            <div style="text-align:right">
              <div style="color:#aaa;font-size:9px">Investment</div>
              <div style="color:#ccc;font-size:16px;font-weight:bold">${(this._apAutoROI.investment / 1000).toFixed(0)}K</div>
            </div>
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin-bottom:4px">Manual vs Automated (hours/process)</div>
        ${this._apAutoComparison.map((c: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
            <span style="color:#ccc;width:90px">${c.process}</span>
            <span style="color:#f84;width:30px;text-align:right">${c.manual}h</span>
            <span style="color:#888;width:15px;text-align:center">\u2192</span>
            <span style="color:#4caf50;width:30px;text-align:right">${c.automated}h</span>
            <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
              <div style="height:100%;width:${c.reduction}%;background:#48f"></div>
            </div>
            <span style="color:#888;width:30px;text-align:right">-${c.reduction}%</span>
          </div>`)}
        <div style="color:#aaa;font-size:10px;margin:6px 0 4px">Next Automation Candidates</div>
        ${this._apAutoCandidates.map((c: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
            <span style="color:${c.priority === "High" ? "#f44" : c.priority === "Medium" ? "#f84" : "#888"};font-weight:bold;width:40px">${c.priority}</span>
            <span style="color:#ccc;flex:1">${c.task}</span>
            <span style="color:#888">${c.savings}</span>
          </div>`)}
      </div>`;
  }

  // Round 17 initialization
  private apInitRound17() {
    this.apInitRiskQuant();
    this.apInitSecProgram();
    this.apInitThirdParty();
    this.apInitDLP();
    this.apInitAutomation();
  }

  private apRenderRound17() {
    return html`${this.apRenderRiskQuant()}${this.apRenderSecProgram()}${this.apRenderThirdParty()}${this.apRenderDLP()}${this.apRenderAutomation()}`;
  }
  render() {
    const totalRisk = this._getTotalRisk();
    const riskLevel = totalRisk >= 70 ? 'critical' : totalRisk >= 40 ? 'high' : totalRisk >= 20 ? 'medium' : 'low';
    const successRate = this._getSuccessRate();
    const maxImpact = this._getMaxImpact();

    return html`${this.apRenderRound17()}
      <div class="panel">
        <div class="pt">

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
          <div style="background:#1f2937;border-radius:8px;padding:14px">
            <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Key Metrics Summary</div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Attack Paths</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#ef4444">47</div>              <div style="flex:1;font-size:10px;color:#6b7280">3 critical</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Choke Points</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#22c55e">12</div>              <div style="flex:1;font-size:10px;color:#6b7280">Secured: 9</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Lateral Paths</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#f97316">23</div>              <div style="flex:1;font-size:10px;color:#6b7280">Down 40%</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Credential Exposure</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#eab308">15%</div>              <div style="flex:1;font-size:10px;color:#6b7280">Target: 5%</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Privilege Escalation</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#f97316">8</div>              <div style="flex:1;font-size:10px;color:#6b7280">2 unmitigated</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Graph Nodes</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#3b82f6">342</div>              <div style="flex:1;font-size:10px;color:#6b7280">Complete map</div>            </div>
          </div>
          <div style="background:#1f2937;border-radius:8px;padding:14px">
            <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Security Insights</div>
            <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <span style="color:#06b6d4;flex-shrink:0;margin-top:1px">&#8226;</span>              <span style="color:#94a3b8">3 critical attack paths identified from internet to domain controller.</span>            </div>
            <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <span style="color:#06b6d4;flex-shrink:0;margin-top:1px">&#8226;</span>              <span style="color:#94a3b8">Lateral movement paths reduced by 40% through segmentation improvements.</span>            </div>
            <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <span style="color:#06b6d4;flex-shrink:0;margin-top:1px">&#8226;</span>              <span style="color:#94a3b8">Credential exposure risk mitigated for 85% of service accounts.</span>            </div>
            <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <span style="color:#06b6d4;flex-shrink:0;margin-top:1px">&#8226;</span>              <span style="color:#94a3b8">New attack path analysis included cloud infrastructure for the first time.</span>            </div>
          </div>
        </div>

          🗺️ Attack Path Visualization
          <span class="risk-badge ${riskLevel}">Risk Score: ${totalRisk}/100</span>
        </div>

        <div class="tab-bar">
          <button class="tab-btn ${this._tabView === 'graph' ? 'active' : ''}" @click=${() => this._tabView = 'graph'}>Graph</button>
          <button class="tab-btn ${this._tabView === 'techniques' ? 'active' : ''}" @click=${() => this._tabView = 'techniques'}>Techniques</button>
          <button class="tab-btn ${this._tabView === 'playbook' ? 'active' : ''}" @click=${() => this._tabView = 'playbook'}>Playbook</button>
          <button class="tab-btn ${this._tabView === 'analysis' ? 'active' : ''}" @click=${() => this._tabView = 'analysis'}>Analysis</button>
          <button class="tab-btn ${this._tabView === 'audit' ? 'active' : ''}" @click=${() => this._tabView = 'audit'}>Audit</button>
          <button class="tab-btn ${this._tabView === 'config' ? 'active' : ''}" @click=${() => this._tabView = 'config'}>Config</button>
          <button class="tab-btn ${this._tabView === 'export' ? 'active' : ''}" @click=${() => this._tabView = 'export'}>Export</button>
        </div>

        ${this._tabView === 'playbook' ? html`
          <div style="margin-bottom:14px">
            <div style="font-size:13px;font-weight:700;margin-bottom:10px">Attack Chain Playbook</div>
            ${this._playbookSteps.map(s => html`
              <div class="playbook-step">
                <div class="step-num ${s.status}">${s.step}</div>
                <div class="step-content">
                  <div class="step-name">${s.name}</div>
                  <div class="step-desc">${s.desc}</div>
                  <div style="margin-top:4px">${s.techniques.map(t => html`<span class="tech-tag">${t}</span>`)}</div>
                </div>
                <span class="risk-badge ${s.status === 'done' ? 'low' : s.status === 'active' ? 'medium' : 'high'}">${s.status}</span>
              </div>
            `)}
          </div>
        ` : nothing}

        ${this._tabView === 'techniques' ? html`
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
            <div style="background:#1f2937;border-radius:8px;padding:14px">
              <div style="font-size:11px;font-weight:600;color:#94a3b8;margin-bottom:8px;text-transform:uppercase">Technique Heatmap</div>
              ${this._heatmapSVG()}
            </div>
            <div style="background:#1f2937;border-radius:8px;padding:14px">
              <div style="font-size:11px;font-weight:600;color:#94a3b8;margin-bottom:8px;text-transform:uppercase">Attack Funnel</div>
              ${this._funnelSVG()}
            </div>
          </div>
          <div style="background:#1f2937;border-radius:8px;padding:14px">
            <div style="font-size:12px;font-weight:600;margin-bottom:10px">MITRE ATT&CK Technique Details</div>
            <table class="technique-table">
              <tr><th>Technique</th><th>MITRE ID</th><th>Tactic</th><th>Severity</th><th>Success Rate</th><th>Description</th></tr>
              ${this._edges.map(e => html`<tr>
                <td style="font-weight:600">${e.technique}</td>
                <td><span class="tech-tag">${this._mitreMapping[e.technique]?.technique || 'N/A'}</span></td>
                <td style="color:#c084fc">${this._mitreMapping[e.technique]?.tactic || 'N/A'}</td>
                <td><span class="risk-badge ${e.severity}">${e.severity}</span></td>
                <td style="font-weight:600;color:${e.successRate >= 80 ? '#ef4444' : '#eab308'}">${e.successRate}%</td>
                <td style="color:#94a3b8">${e.description}</td>
              </tr>`)}
            </table>
          </div>
        ` : nothing}

        ${this._tabView === 'analysis' ? html`
          <div class="details-panel" style="margin-bottom:12px">
            <div class="stitle">Attack Path Analysis Pipeline</div>
            <div style="display:flex;gap:8px;margin-bottom:12px">
              <button class="btn active" @click=${this._runPathAnalysis} ?disabled=${this._execPhase === 'running'}>${this._execPhase === 'running' ? 'Analyzing...' : 'Run Analysis'}</button>
              ${this._execPhase === 'complete' ? html`<button class="btn" @click=${() => { this._execPhase = 'idle'; this._execResults = []; }}>Reset</button>` : nothing}
              <span style="flex:1"></span><span style="font-size:10px;color:#94a3b8">${this._execProgress}%</span>
            </div>
            <div style="height:8px;background:#374151;border-radius:4px;overflow:hidden;margin-bottom:12px"><div style="height:100%;width:${this._execProgress}%;background:${this._execPhase === 'complete' ? '#22c55e' : '#06b6d4'};border-radius:4px;transition:width 0.3s"></div></div>
            <div class="exec-pipeline">
              ${this._execSteps.map((s, i) => html`
                <div class="pipeline-step">
                  <div class="step-icon ${s.status}">${s.status === 'done' ? '\u2713' : s.status === 'running' ? '\u25CF' : (i + 1)}</div>
                  <div class="step-info"><div class="step-name">${s.name}</div><div class="step-desc">${s.desc}</div></div>
                  <div class="step-time">${s.status === 'done' ? s.duration + 'ms' : ''}</div>
                </div>
              `)}
            </div>
            ${this._execResults.length > 0 ? html`
              <div style="background:#0f172a;border-radius:8px;padding:12px;margin-top:12px">
                <div style="font-size:11px;font-weight:600;color:#94a3b8;margin-bottom:8px">Analysis Results</div>
                ${this._execResults.map(r => html`<div style="padding:6px 0;border-bottom:1px solid #1f2937"><div style="font-size:11px;font-weight:600;color:#06b6d4">${r.step}</div><div style="font-size:10px;color:#94a3b8;margin-top:2px">${r.output}</div></div>`)}
              </div>
            ` : nothing}
          </div>
          <div class="details-panel" style="margin-bottom:12px">
            <div class="stitle">Risk Matrix</div>
            <svg viewBox="0 0 200 140" width="200" height="140">${this._riskMatrixSVG()}</svg>
          </div>
          <div class="details-panel" style="margin-bottom:12px">
            <div class="stitle">Technique Distribution by Tactic</div>
            ${this._techniqueDistributionSVG()}
          </div>
          <div class="details-panel" style="margin-bottom:12px">
            <div class="stitle">Path Length vs Risk Score</div>
            ${this._pathLengthSVG()}
          </div>
          <div class="details-panel" style="margin-bottom:12px">
            <div class="stitle">Mitigation Impact Analysis</div>
            ${this._mitigationImpactSVG()}
          </div>
          <div class="details-panel" style="margin-bottom:12px">
            <div class="stitle">Mitigation SLA Tracking</div>
            ${this._slaItems.map(item => {
              const pct = Math.min(100, (item.elapsed / item.total) * 100);
              const remaining = Math.max(0, item.total - item.elapsed);
              const hrs = Math.floor(remaining / 3600000);
              const color = pct > 80 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#22c55e';
              return html`
                <div class="sla-timer">
                  <div style="width:8px;height:8px;border-radius:50%;background:${item.priority === 'critical' ? '#ef4444' : item.priority === 'high' ? '#f97316' : '#eab308'}"></div>
                  <div style="flex:1;min-width:0"><div style="font-size:11px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.task}</div><div style="font-size:9px;color:#6b7280">${item.assignee}</div></div>
                  <div style="width:100px;flex-shrink:0"><div class="sla-bar"><div class="sla-fill" style="width:${pct}%;background:${color}"></div></div></div>
                  <div class="sla-label" style="color:${color}">${hrs}h</div>
                </div>`;
            })}
          </div>
        ` : ''}

        ${this._tabView === 'audit' ? html`
          <div class="details-panel">
            <div class="stitle">Analysis Audit Log (${this._auditLog.length})</div>
            ${this._auditLog.map(entry => html`
              <div class="audit-entry">
                <div class="audit-time">${new Date(entry.timestamp).toLocaleString()}</div>
                <div class="audit-action">${entry.action}</div>
                <div class="audit-detail">${entry.user}: ${entry.detail}</div>
              </div>
            `)}
          </div>
        ` : ''}

        ${this._tabView === 'config' ? html`
          <div class="details-panel">
            <div class="stitle">Visualization Configuration</div>
            ${Object.entries(this._configSettings).map(([key, val]) => {
              const labels: Record<string, { label: string; desc: string }> = {
                autoScore: { label: 'Auto Risk Scoring', desc: 'Automatically calculate risk scores based on CVSS and asset value' },
                mitreMap: { label: 'MITRE ATT&CK Mapping', desc: 'Map all techniques to MITRE ATT&CK framework' },
                realTime: { label: 'Real-time Updates', desc: 'Update graph when new vulnerability data arrives' },
                exportEncrypted: { label: 'Encrypted Exports', desc: 'Encrypt exported reports with AES-256' },
                slaTracking: { label: 'SLA Tracking', desc: 'Track mitigation SLA deadlines' },
                historicalData: { label: 'Historical Data', desc: 'Include historical attack path data in analysis' },
              };
              const info = labels[key] || { label: key, desc: '' };
              return html`
                <div class="config-row">
                  <div><div class="config-label">${info.label}</div><div class="config-desc">${info.desc}</div></div>
                  <button class="config-toggle ${val ? 'on' : ''}" @click=${() => { this._configSettings = { ...this._configSettings, [key]: !val }; this._addAudit('CONFIG_CHANGE', 'You', 'Toggled ' + info.label); }}></button>
                </div>`;
            })}
          </div>
          <div class="config-section">
            <div class="form-group"><label class="form-label">Risk Scoring Model</label><select class="form-input" style="appearance:auto"><option>CVSS v3.1 Weighted</option><option>DREAD</option><option>OWASP Risk Rating</option></select></div>
            <div class="form-group"><label class="form-label">Max Path Depth</label><input class="form-input" type="number" value="10"></div>
            <div style="display:flex;gap:8px"><button class="btn active" @click=${() => this._addAudit('CONFIG_SAVE', 'You', 'Saved visualization config')}>Save</button><button class="btn">Reset Defaults</button></div>
          </div>
        ` : ''}

        ${this._tabView === 'export' ? html`
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px">
            <button class="export-btn" @click=${this._exportJSON}>Export JSON</button>
            <button class="export-btn" @click=${this._exportCSV}>Export CSV</button>
            <button class="export-btn" @click=${this._exportMarkdown}>Export Markdown</button>
          </div>
          <div style="font-size:12px;color:#6b7280">Export attack path graph data including ${this._nodes.length} nodes and ${this._edges.length} edges with full technique mapping.</div>
        ` : nothing}

        ${this._tabView === 'graph' ? html`

        <div class="controls">
          <div class="stats">
            <div class="stat">
              <div class="sv ${successRate >= 70 ? 'critical' : successRate >= 50 ? 'high' : 'medium'}">
                ${successRate}%
              </div>
              <div class="sl">Attack Success Rate</div>
            </div>
            <div class="stat">
              <div class="sv">${this._edges.length}</div>
              <div class="sl">Attack Steps</div>
            </div>
            <div class="stat">
              <div class="sv">${this._nodes.length}</div>
              <div class="sl">Nodes Compromised</div>
            </div>
          </div>
          <div class="controls-right">
            <button class="btn ${this._showSuccessRate ? 'active' : ''}" @click=${() => this._showSuccessRate = !this._showSuccessRate}>
              ${this._showSuccessRate ? 'Hide' : 'Show'} Success Rate
            </button>
            <button class="btn ${this._simulationRunning ? 'active' : ''}" @click=${() => this._simulationRunning ? this._stopSimulation() : this._runSimulation()}>
              ${this._simulationRunning ? 'Stop Sim' : 'Run Sim'}
            </button>
            <button class="btn" @click=${() => { this._selectedNode = null; this._selectedEdge = null; }}>Clear Selection</button>
          </div>
        </div>

        <svg viewBox="0 0 650 350">
          <!-- Edges -->
          ${this._edges.map((e, idx) => {
            const from = this._nodes.find(n => n.id === e.from)!;
            const to = this._nodes.find(n => n.id === e.to)!;
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const angle = Math.atan2(dy, dx);
            const midX = from.x + dx/2;
            const midY = from.y + dy/2;
            const isSimActive = this._simulationRunning && idx < this._simulationStep;
            const isSimCurrent = this._simulationRunning && idx === this._simulationStep;
            
            return html`
              <line 
                class="edge ${e.severity}" 
                x1="${from.x}" y1="${from.y}" 
                x2="${to.x}" y2="${to.y}"
                stroke-dasharray="${e.successRate < 70 ? '5,5' : 'none'}"
                stroke-width="${isSimCurrent ? 4 : 2}"
                opacity="${this._simulationRunning && idx >= this._simulationStep ? 0.2 : 0.7}"
              />
              <polygon 
                points="0,-6 12,0 0,6" 
                fill="${this._getRiskColor(e.severity)}" 
                fill-opacity="${isSimActive || !this._simulationRunning ? 1 : 0.2}"
                transform="translate(${from.x + dx*0.9}, ${from.y + dy*0.9}) rotate(${angle * 180/Math.PI})"
              />
              ${this._showSuccessRate ? html`
                <text class="edge-label" x="${midX}" y="${midY - 5}">
                  ${e.technique} (${e.successRate}%)
                </text>
              ` : html`
                <text class="edge-label" x="${midX}" y="${midY - 5}">
                  ${e.technique}
                </text>
              `}
            `
          })}

          <!-- Nodes -->
          ${this._nodes.map(n => html`
            <g 
              class="node ${n.risk}" 
              @click=${() => this._handleNodeClick(n)}
              style="${this._selectedNode && this._selectedNode.id !== n.id ? 'opacity: 0.5;' : ''}"
            >
              <circle 
                cx="${n.x}" 
                cy="${n.y}" 
                r="${this._selectedNode?.id === n.id ? 35 : 30}"
              />
              <text x="${n.x}" y="${n.y - 5}">${n.name.split('\n')[0]}</text>
              <text x="${n.x}" y="${n.y + 10}" style="font-size: 9px; opacity: 0.8;">${n.name.split('\n')[1]}</text>
            </g>
          `)}
        </svg>

        <div class="legend">
          <div class="legend-item"><span class="legend-color critical"></span> Critical Risk</div>
          <div class="legend-item"><span class="legend-color high"></span> High Risk</div>
          <div class="legend-item"><span class="legend-color medium"></span> Medium Risk</div>
          <div class="legend-item"><span class="legend-color low"></span> Low Risk</div>
          <div style="color: var(--text-tertiary); font-size: 11px; margin-left: 16px;">💡 Click any node to view details</div>
        </div>

        ${this._selectedNode ? html`
          <div class="details-panel">
            <div class="details-title">
              🔍 Node Details: ${this._selectedNode.name}
              <span class="risk-badge ${this._selectedNode.risk}">${this._selectedNode.risk.toUpperCase()}</span>
            </div>
            <div class="details-content">
              <div class="detail-item">
                <span class="detail-label">Type</span>
                <span class="detail-value">${this._selectedNode.type.charAt(0).toUpperCase() + this._selectedNode.type.slice(1)}</span>
              </div>
              ${this._selectedNode.cve ? html`
                <div class="detail-item">
                  <span class="detail-label">CVE</span>
                  <span class="detail-value">${this._selectedNode.cve}</span>
                </div>
              ` : nothing}
              <div class="detail-item">
                <span class="detail-label">Description</span>
                <span class="detail-value">${this._selectedNode.description}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Recommended Mitigation</span>
                <span class="detail-value">
                  ${this._getMitigationForNode(this._selectedNode)}
                  <span class="mitigation">Mitigation Effort: ${this._selectedNode.risk === 'critical' ? 'High' : 'Medium'}</span>
                </span>
              </div>
            </div>
          </div>
        ` : html`
          <div style="text-align: center; color: var(--text-tertiary, #94a3b8); font-size: 13px; padding: 20px 0;">
            Click any node in the attack path graph to view detailed information and mitigation recommendations
          </div>
        `}
        ` : nothing}
      </div>
      </div>
      <div style="margin-top:12px;display:flex;justify-content:center">
        <button class="btn btn-sm ${this._showEnhanced ? 'btn-primary' : 'btn-secondary'}}" @click=${() => {{ this._showEnhanced = !this._showEnhanced; this.requestUpdate(); }}}}>${this._showEnhanced ? 'Hide' : 'Show'}} Advanced</button>
      </div>
      ${this._renderEnhancedSection()}}
    `;
  }

  // --- Attack Path Risk Scoring Engine ---
  private _pathRiskFactors: Record<string, { weight: number; label: string }> = {
    vulnDensity: { weight: 0.25, label: 'Vulnerability Density' },
    pathComplexity: { weight: 0.20, label: 'Path Complexity' },
    assetCriticality: { weight: 0.25, label: 'Target Criticality' },
    exploitMaturity: { weight: 0.15, label: 'Exploit Maturity' },
    detectionGap: { weight: 0.15, label: 'Detection Gap' },
  };

  private _computePathVisualizationRisk(): { score: number; level: string; factors: { name: string; score: number; label: string }[] } {
    const vulns = this._paths.reduce((s: number, p: any) => s + (p.vulns?.length || 0), 0);
    const totalPaths = this._paths.length || 1;
    const factors = [
      { name: 'vulnDensity', score: Math.min(100, (vulns / totalPaths) * 25), label: this._pathRiskFactors.vulnDensity.label },
      { name: 'pathComplexity', score: Math.min(100, totalPaths * 8), label: this._pathRiskFactors.pathComplexity.label },
      { name: 'assetCriticality', score: this._paths.some((p: any) => p.criticality === 'critical') ? 90 : 40, label: this._pathRiskFactors.assetCriticality.label },
      { name: 'exploitMaturity', score: Math.min(100, this._paths.filter((p: any) => p.exploitAvailable).length * 20), label: this._pathRiskFactors.exploitMaturity.label },
      { name: 'detectionGap', score: Math.min(100, this._paths.filter((p: any) => !p.monitored).length * 15), label: this._pathRiskFactors.detectionGap.label },
    ];
    const score = Math.round(factors.reduce((s, f) => s + f.score * (this._pathRiskFactors[f.name]?.weight || 0.15), 0));
    const level = score > 75 ? 'critical' : score > 50 ? 'high' : score > 25 ? 'medium' : 'low';
    return { score, level, factors };
  }

  // --- MITRE ATT&CK Path Correlation ---
  private _mitrePathVizMap: Record<string, { techniqueId: string; techniqueName: string; tactic: string }> = {
    'lateral-movement': { techniqueId: 'T1021', techniqueName: 'Remote Services', tactic: 'Lateral Movement' },
    'credential-access': { techniqueId: 'T1110', techniqueName: 'Brute Force', tactic: 'Credential Access' },
    'privilege-escalation': { techniqueId: 'T1068', techniqueName: 'Exploitation for Privilege Escalation', tactic: 'Privilege Escalation' },
    'persistence': { techniqueId: 'T1053', techniqueName: 'Scheduled Task/Job', tactic: 'Persistence' },
    'exfiltration': { techniqueId: 'T1048', techniqueName: 'Exfiltration Over Alternative Protocol', tactic: 'Exfiltration' },
    'discovery': { techniqueId: 'T1046', techniqueName: 'Network Service Discovery', tactic: 'Discovery' },
  };

  private _correlatePathVizMitre(): { tactic: string; techniques: { id: string; name: string; count: number }[] }[] {
    const tacticMap: Record<string, { id: string; name: string; count: number }[]> = {};
    this._paths.forEach((p: any) => {
      for (const [key, mitre] of Object.entries(this._mitrePathVizMap)) {
        if (p.type?.toLowerCase().includes(key) || p.name?.toLowerCase().includes(key)) {
          if (!tacticMap[mitre.tactic]) tacticMap[mitre.tactic] = [];
          const ex = tacticMap[mitre.tactic].find(t => t.id === mitre.techniqueId);
          if (ex) ex.count++; else tacticMap[mitre.tactic].push({ id: mitre.techniqueId, name: mitre.techniqueName, count: 1 });
        }
      }
    });
    return Object.entries(tacticMap).map(([tactic, techniques]) => ({ tactic, techniques }));
  }

  // --- Attack Path Treemap SVG ---
  private _pathVizTreemapSVG(): string {
    const w = 500, h = 220;
    const data = this._paths.slice(0, 12).map((p: any) => ({
      name: p.name || p.id || 'Unknown',
      risk: p.risk || Math.floor(Math.random() * 100),
      vulns: (p.vulns || []).length,
    }));
    const totalRisk = data.reduce((s: number, d: any) => s + d.risk, 0) || 1;
    let x = 0, y = 0, rowH = h;
    let svg = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`;
    data.sort((a: any, b: any) => b.risk - a.risk).forEach((d: any) => {
      const cellW = Math.max(40, (d.risk / totalRisk) * w);
      if (x + cellW > w) { x = 0; y += rowH; rowH = h - y; }
      const color = d.risk > 75 ? '#ef4444' : d.risk > 50 ? '#f97316' : d.risk > 25 ? '#eab308' : '#22c55e';
      const ch = Math.max(20, rowH);
      svg += `<rect x="${x}" y="${y}" width="${cellW - 2}" height="${ch - 2}" rx="4" fill="${color}" opacity="0.3" stroke="${color}" stroke-width="1"/>`;
      svg += `<text x="${x + cellW / 2}" y="${y + ch / 2 - 3}" fill="#e2e8f0" font-size="8" text-anchor="middle" font-weight="600">${d.name.substring(0, 18)}</text>`;
      svg += `<text x="${x + cellW / 2}" y="${y + ch / 2 + 8}" fill="#9ca3af" font-size="7" text-anchor="middle">Risk: ${d.risk} | Vulns: ${d.vulns}</text>`;
      x += cellW;
    });
    svg += `</svg>`;
    return svg;
  }

  // --- Path Risk Heatmap SVG ---
  private _pathVizHeatmapSVG(): string {
    const w = 500, h = 200;
    const zones = ['DMZ', 'Internal', 'Core', 'Cloud', 'IoT', 'Remote'];
    const metrics = ['Vulns', 'Paths', 'Exposure', 'Monitoring', 'Access'];
    const data = zones.map(() => metrics.map(() => Math.floor(Math.random() * 100)));
    const cellW = (w - 70) / metrics.length, cellH = (h - 30) / zones.length;
    let svg = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`;
    metrics.forEach((m, i) => { svg += `<text x="${70 + i * cellW + cellW / 2}" y="15" fill="#9ca3af" font-size="8" text-anchor="middle">${m}</text>`; });
    zones.forEach((z, zi) => {
      svg += `<text x="60" y="${30 + zi * cellH + cellH / 2 + 3}" fill="#9ca3af" font-size="8" text-anchor="end">${z}</text>`;
      metrics.forEach((m, mi) => {
        const val = data[zi][mi];
        const x = 70 + mi * cellW, y = 30 + zi * cellH;
        const color = val > 75 ? '#ef4444' : val > 50 ? '#f97316' : val > 25 ? '#eab308' : '#22c55e';
        svg += `<rect x="${x + 1}" y="${y + 1}" width="${cellW - 2}" height="${cellH - 2}" rx="3" fill="${color}" opacity="0.3" stroke="${color}" stroke-width="0.5"/>`;
        svg += `<text x="${x + cellW / 2}" y="${y + cellH / 2 + 3}" fill="#e2e8f0" font-size="9" text-anchor="middle">${val}</text>`;
      });
    });
    svg += `</svg>`;
    return svg;
  }

  // --- Collaboration ---
  @state() private _vizTeam: { id: string; name: string; role: string; status: string }[] = [
    { id: 'v1', name: 'Security Architect', role: 'Design', status: 'online' },
    { id: 'v2', name: 'Threat Analyst', role: 'Analysis', status: 'online' },
    { id: 'v3', name: 'Network Engineer', role: 'Implementation', status: 'busy' },
  ];
  @state() private _vizComments: { id: string; userId: string; text: string; timestamp: string }[] = [];
  @state() private _vizCommentText = '';

  private _addVizComment() {
    if (!this._vizCommentText.trim()) return;
    this._vizComments = [{ id: 'vc' + Date.now(), userId: 'You', text: this._vizCommentText.trim(), timestamp: new Date().toISOString() }, ...this._vizComments].slice(0, 30);
    this._vizCommentText = '';
  }

  private _renderVizCollab(): any {
    return html`
      <div style="margin-top:16px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Team Discussion</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
          ${this._vizTeam.map(m => html`
            <div style="display:flex;align-items:center;gap:4px;background:#1f2937;border-radius:4px;padding:3px 8px;font-size:10px">
              <div style="width:6px;height:6px;border-radius:50%;background:${m.status === 'online' ? '#22c55e' : '#eab308'}"></div>
              <span style="font-weight:600">${m.name}</span>
            </div>
          `)}
        </div>
        ${this._vizComments.length > 0 ? html`
          <div style="max-height:60px;overflow-y:auto;margin-bottom:6px">
            ${this._vizComments.slice(0, 5).map(c => html`<div style="font-size:10px;padding:3px 0;border-bottom:1px solid #1f2937"><span style="font-weight:600;color:#e2e8f0">${c.userId}</span><span style="color:#9ca3af">: ${c.text}</span></div>`)}
          </div>
        ` : ''}
        <div style="display:flex;gap:6px">
          <input style="flex:1;background:#0f172a;border:1px solid #374151;border-radius:4px;padding:4px 8px;color:#e2e8f0;font-size:10px" placeholder="Comment..." .value=${this._vizCommentText} @input=${(e: any) => this._vizCommentText = e.target.value}>
          <button style="background:#f59e0b;color:#111827;border:none;border-radius:4px;padding:4px 10px;font-size:10px;font-weight:600;cursor:pointer" @click=${this._addVizComment}>Post</button>
        </div>
      </div>
    `;
  }

  // --- Auto-Insights ---
  private _generateVizInsights(): { icon: string; text: string; severity: string }[] {
    const insights: { icon: string; text: string; severity: string }[] = [];
    const risk = this._computePathVisualizationRisk();
    if (risk.score > 75) insights.push({ icon: '\uD83D\uDFE1', text: `High attack path risk (${risk.score}/100). Multiple exploitable paths to critical assets.`, severity: 'critical' });
    const unmonitored = this._paths.filter((p: any) => !p.monitored).length;
    if (unmonitored > 0) insights.push({ icon: '\uD83D\uDD0D', text: `${unmonitored} paths lack monitoring coverage. Blind spots in detection.`, severity: 'high' });
    const mitre = this._correlatePathVizMitre();
    if (mitre.length > 4) insights.push({ icon: '\uD83D\uDD0E', text: `Paths span ${mitre.length} MITRE ATT&CK tactics. Comprehensive attack surface.`, severity: 'medium' });
    return insights.length > 0 ? insights : [{ icon: '\u2705', text: 'Attack paths are well-controlled.', severity: 'low' }];
  }

  private _renderVizInsights(): any {
    const insights = this._generateVizInsights();
    return html`
      <div style="margin-top:12px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Auto-Insights</div>
        ${insights.map(i => html`<div style="display:flex;gap:6px;padding:5px;margin-bottom:3px;background:#1f2937;border-radius:4px;font-size:10px;border-left:3px solid ${i.severity === 'critical' ? '#ef4444' : i.severity === 'high' ? '#f97316' : '#22c55e'}"><span>${i.icon}</span><span style="color:#e2e8f0">${i.text}</span></div>`)}
      </div>
    `;
  }

  // --- Panel Config ---
  @state() private _vizConfig: { showTreemap: boolean; showHeatmap: boolean; showCollab: boolean; autoRefresh: boolean } = { showTreemap: true, showHeatmap: true, showCollab: true, autoRefresh: false };

  private _renderVizConfig(): any {
    return html`
      <div style="margin-top:12px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Configuration</div>
        ${Object.entries(this._vizConfig).map(([key, val]) => html`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #1f2937">
            <span style="font-size:10px;color:#9ca3af">${key.replace(/([A-Z])/g, ' $1').trim()}</span>
            <div style="width:32px;height:18px;border-radius:9px;background:${val ? '#22c55e' : '#374151'};cursor:pointer;position:relative" @click=${() => { this._vizConfig = { ...this._vizConfig, [key]: !val }; }}><div style="width:14px;height:14px;border-radius:50%;background:white;position:absolute;top:2px;left:${val ? '16px' : '2px'};transition:left 0.2s"></div></div>
          </div>
        `)}
      </div>
    `;
  }

  // --- Anomaly Detection ---
  private _detectVizAnomalies(): { type: string; description: string; severity: string }[] {
    const anomalies: { type: string; description: string; severity: string }[] = [];
    const criticalPaths = this._paths.filter((p: any) => p.criticality === 'critical' && p.status === 'exploitable');
    if (criticalPaths.length > 2) anomalies.push({ type: 'Critical Path Cluster', description: `${criticalPaths.length} exploitable paths to critical assets detected`, severity: 'critical' });
    return anomalies;
  }

  private _renderVizAnomalies(): any {
    const anomalies = this._detectVizAnomalies();
    if (anomalies.length === 0) return nothing;
    return html`
      <div style="margin-top:12px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px;color:#f59e0b">Anomalies (${anomalies.length})</div>
        ${anomalies.map(a => html`<div style="background:#1f2937;border-radius:4px;padding:6px;margin-bottom:4px;border-left:3px solid ${a.severity === 'critical' ? '#ef4444' : '#eab308'}"><div style="font-size:11px;font-weight:600;color:#e2e8f0">${a.type}</div><div style="font-size:10px;color:#9ca3af">${a.description}</div></div>`)}
      </div>
    `;
  }

  // --- Trend Prediction ---
  private _predictVizTrend(): { direction: string; confidence: number; reason: string } {
    const risk = this._computePathVisualizationRisk();
    if (risk.score > 60) return { direction: 'INCREASING', confidence: 0.75, reason: 'Elevated risk with multiple attack vectors' };
    return { direction: 'STABLE', confidence: 0.6, reason: 'Risk within acceptable thresholds' };
  }

  private _renderVizTrend(): any {
    const trend = this._predictVizTrend();
    return html`
      <div style="margin-top:12px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Trend Prediction</div>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="font-size:20px">${trend.direction === 'INCREASING' ? '\uD83D\uDD3C' : '\u2192'}</div>
          <div><div style="font-size:11px;font-weight:600;color:${trend.direction === 'INCREASING' ? '#ef4444' : '#eab308'}">${trend.direction}</div><div style="font-size:10px;color:#9ca3af">${trend.reason}</div><div style="font-size:9px;color:#6b7280">Confidence: ${Math.round(trend.confidence * 100)}%</div></div>
        </div>
      </div>
    `;
  }

  // --- Compliance Rules ---
  private _vizComplianceRules: { rule: string; standard: string; status: 'pass' | 'fail' | 'warning' }[] = [
    { rule: 'All attack paths documented', standard: 'NIST 800-30', status: 'pass' },
    { rule: 'Critical asset paths monitored', standard: 'CIS Control 8', status: 'warning' },
    { rule: 'Lateral movement controls tested', standard: 'NIST 800-53 CA-8', status: 'pass' },
    { rule: 'Network segmentation enforced', standard: 'PCI-DSS 1.3', status: 'fail' },
    { rule: 'Zero-trust path validation', standard: 'NIST 800-207', status: 'warning' },
  ];

  private _renderVizCompliance(): any {
    return html`
      <div style="margin-top:12px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Compliance</div>
        ${this._vizComplianceRules.map(r => html`
          <div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid #1f2937;font-size:10px">
            <div style="width:8px;height:8px;border-radius:50%;background:${r.status === 'pass' ? '#22c55e' : r.status === 'fail' ? '#ef4444' : '#eab308'}"></div>
            <span style="flex:1;color:#e2e8f0">${r.rule}</span>
            <span style="color:#6b7280;font-size:9px">${r.standard}</span>
          </div>
        `)}
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
          <span style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase">Attack Path Visualization Findings Grid</span>
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


  // === SCENARIO SIMULATION ENGINE ===
  @state() private _attScenarios: {id:string;name:string;attackType:string;target:string;method:string;impactLow:number;impactHigh:number;confidence:number;mitigation:string;status:string}[] = [];
  @state() private _attScenarioForm: {attackType:string;target:string;method:string} = {attackType:'',target:'',method:''};
  @state() private _attScenarioCompare: boolean = false;
  @state() private _attScenarioSelected: string[] = [];

  private _attInitScenarios(): void {
    const saved = localStorage.getItem('att_scenarios');
    if (saved) { try { this._attScenarios = JSON.parse(saved); } catch { /* ignore */ } }
    if (this._attScenarios.length === 0) {
      this._attScenarios = [
        {id:'att-s1',name:'Baseline Threat',attackType:'Phishing',target:'Employees',method:'Spear Email',impactLow:45,impactHigh:78,confidence:72,mitigation:'Security awareness training + email filtering',status:'active'},
        {id:'att-s2',name:'Escalated Attack',attackType:'Ransomware',target:'Endpoints',method:'Drive-by Download',impactLow:65,impactHigh:95,confidence:58,mitigation:'EDR deployment + network segmentation',status:'saved'},
        {id:'att-s3',name:'Insider Threat',attackType:'Data Exfiltration',target:'Databases',method:'SQL Injection',impactLow:55,impactHigh:88,confidence:65,mitigation:'DLP policies + query monitoring',status:'draft'},
      ];
    }
  }

  private _attSaveScenarios(): void {
    localStorage.setItem('att_scenarios', JSON.stringify(this._attScenarios));
  }

  private _attAddScenario(): void {
    const f = this._attScenarioForm;
    if (!f.attackType || !f.target) return;
    this._attScenarios = [...this._attScenarios, {
      id: 'att-s' + (this._attScenarios.length + 1),
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
    this._attScenarioForm = {attackType:'',target:'',method:''};
    this._attSaveScenarios();
  }

  private _attRenderScenarioEngine(): any {
    const attackTypes = ['Phishing','Ransomware','DDoS','SQL Injection','XSS','Privilege Escalation','Supply Chain','Zero-Day'];
    const targets = ['Employees','Endpoints','Servers','Databases','Network','Cloud','APIs','Mobile'];
    const methods = ['Spear Email','Drive-by Download','Brute Force','Social Engineering','Exploit Kit','Watering Hole','Malware','Misconfiguration'];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">Scenario Simulation Engine</span>
          <button class="tab" @click=${() => { this._attScenarioCompare = !this._attScenarioCompare; }}>${this._attScenarioCompare ? 'List View' : 'Compare'}</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px">
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._attScenarioForm = {...this._attScenarioForm, attackType: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Attack Type</option>
            ${attackTypes.map(a => html`<option value=${a} ${this._attScenarioForm.attackType === a ? 'selected' : ''}>${a}</option>`)}
          </select>
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._attScenarioForm = {...this._attScenarioForm, target: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Target</option>
            ${targets.map(t => html`<option value=${t} ${this._attScenarioForm.target === t ? 'selected' : ''}>${t}</option>`)}
          </select>
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._attScenarioForm = {...this._attScenarioForm, method: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Method</option>
            ${methods.map(m => html`<option value=${m} ${this._attScenarioForm.method === m ? 'selected' : ''}>${m}</option>`)}
          </select>
        </div>
        <button style="background:#3b82f6;border:none;border-radius:4px;padding:4px 12px;color:#fff;font-size:11px;cursor:pointer" @click=${this._attAddScenario}>Run Simulation</button>
      </div>
      ${this._attScenarioCompare && this._attScenarios.length >= 2 ? html`
        <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
          <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:8px">Side-by-Side Comparison</div>
          <div style="display:grid;grid-template-columns:repeat(${Math.min(3, this._attScenarios.length)},1fr);gap:8px">
            ${this._attScenarios.slice(0,3).map(s => html`
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
        <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:8px">Saved Scenarios (${this._attScenarios.length})</div>
        ${this._attScenarios.map(s => html`
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
  @state() private _attTrendData: {day:number;value:number;anomaly:boolean}[] = [];
  @state() private _attTrendZoom: {start:number;end:number} | null = null;
  @state() private _attTrendMA: number = 7;

  private _attInitTrendData(): void {
    const data: {day:number;value:number;anomaly:boolean}[] = [];
    let base = 50 + Math.random() * 30;
    for (let i = 0; i < 90; i++) {
      base += (Math.random() - 0.48) * 8;
      base = Math.max(10, Math.min(100, base));
      const anomaly = Math.random() < 0.05;
      data.push({ day: i, value: anomaly ? base + (Math.random() > 0.5 ? 25 : -20) : base, anomaly });
    }
    this._attTrendData = data;
  }

  private _attCalcMA(window: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < this._attTrendData.length; i++) {
      const start = Math.max(0, i - window + 1);
      const slice = this._attTrendData.slice(start, i + 1);
      result.push(slice.reduce((s, d) => s + d.value, 0) / slice.length);
    }
    return result;
  }

  private _attGetStats(): {mean:number;median:number;stddev:number;trend:string} {
    const vals = this._attTrendData.map(d => d.value);
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

  private _attRenderTimeSeries(): any {
    const stats = this._attGetStats();
    const filtered = this._attTrendZoom ? this._attTrendData.filter(d => d.day >= this._attTrendZoom.start && d.day <= this._attTrendZoom.end) : this._attTrendData;
    const maxVal = Math.max(...filtered.map(d => d.value));
    const minVal = Math.min(...filtered.map(d => d.value));
    const range = maxVal - minVal || 1;
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">90-Day Trend Analysis</span>
          <div style="display:flex;gap:4px">
            <button class="tab ${this._attTrendMA === 7 ? 'active' : ''}" @click=${() => { this._attTrendMA = 7; }}>7D MA</button>
            <button class="tab ${this._attTrendMA === 30 ? 'active' : ''}" @click=${() => { this._attTrendMA = 30; }}>30D MA</button>
            <button class="tab" @click=${() => { this._attTrendZoom = null; }}>Reset Zoom</button>
          </div>
        </div>
        <div style="position:relative;height:120px;background:#1a1d2e;border-radius:6px;overflow:hidden;margin-bottom:8px;cursor:crosshair" @click=${(e: any) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const x = e.clientX - rect.left;
          const ratio = x / rect.width;
          const center = Math.floor(ratio * 90);
          this._attTrendZoom = { start: Math.max(0, center - 10), end: Math.min(89, center + 10) };
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
  @state() private _attRoles: string[] = ['Admin','Analyst','Operator','Viewer','Auditor'];
  @state() private _attActions: string[] = ['Create','Read','Update','Delete','Export','Approve'];
  @state() private _attPermissions: { [role: string]: { [action: string]: boolean } } = {};
  @state() private _attPermAudit: {role:string;action:string;changedBy:string;timestamp:string;oldVal:boolean;newVal:boolean}[] = [];
  @state() private _attPermCompare: string[] = [];

  private _attInitPermissions(): void {
    const perms: Record<string, Record<string, boolean>> = {};
    const defaults: Record<string, boolean[]> = {
      Admin: [true,true,true,true,true,true],
      Analyst: [true,true,true,false,true,false],
      Operator: [true,true,true,false,false,false],
      Viewer: [false,true,false,false,false,false],
      Auditor: [false,true,false,false,true,false],
    };
    for (const role of this._attRoles) {
      perms[role] = {};
      this._attActions.forEach((a, i) => { perms[role][a] = defaults[role]?.[i] ?? false; });
    }
    this._attPermissions = perms;
  }

  private _attTogglePermission(role: string, action: string): void {
    const old = this._attPermissions[role][action];
    this._attPermissions = {...this._attPermissions, [role]: {...this._attPermissions[role], [action]: !old}};
    this._attPermAudit.unshift({role,action,changedBy:'current_user',timestamp:new Date().toISOString(),oldVal:old,newVal:!old});
  }

  private _attRenderRBAC(): any {
    const compareRoles = this._attPermCompare.map(r => this._attPermissions[r]).filter(Boolean);
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">RBAC Permission Matrix</span>
          <div style="display:flex;gap:4px">
            ${this._attRoles.map(r => html`
              <button class="tab ${this._attPermCompare.includes(r) ? 'active' : ''}" @click=${() => {
                this._attPermCompare = this._attPermCompare.includes(r) ? this._attPermCompare.filter(x => x !== r) : [...this._attPermCompare, r];
              }}>${r}</button>
            `)}
          </div>
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:10px">
            <thead>
              <tr>
                <th style="text-align:left;padding:6px;color:#6b7280;border-bottom:1px solid #2a2d3a">Role \ Action</th>
                ${this._attActions.map(a => html`<th style="padding:6px;color:#6b7280;border-bottom:1px solid #2a2d3a;text-align:center">${a}</th>`)}
              </tr>
            </thead>
            <tbody>
              ${this._attRoles.map(role => html`
                <tr style="border-bottom:1px solid #1a1d2e">
                  <td style="padding:6px;color:#e2e8f0;font-weight:600">${role}</td>
                  ${this._attActions.map(action => html`
                    <td style="text-align:center;padding:6px">
                      <button style="width:28px;height:20px;border-radius:3px;border:1px solid #2a2d3a;background:${this._attPermissions[role][action] ? '#22c55e' : '#1a1d2e'};cursor:pointer;color:#fff;font-size:10px" @click=${() => this._attTogglePermission(role, action)}>${this._attPermissions[role][action] ? 'Y' : 'N'}</button>
                    </td>
                  `)}
                </tr>
              `)}
            </tbody>
          </table>
        </div>
        ${compareRoles.length >= 2 ? html`
          <div style="margin-top:10px;padding:8px;background:#1a1d2e;border-radius:6px">
            <div style="font-size:11px;font-weight:600;color:#e2e8f0;margin-bottom:6px">Role Diff: ${this._attPermCompare.join(' vs ')}</div>
            ${this._attActions.map(action => {
              const vals = compareRoles.map(r => r[action]);
              const allSame = vals.every(v => v === vals[0]);
              return allSame ? nothing : html`
                <div style="display:flex;gap:8px;padding:3px 0;font-size:10px">
                  <span style="color:#6b7280;width:60px">${action}:</span>
                  ${compareRoles.map((r, i) => html`<span style="color:${r[action] ? '#22c55e' : '#ef4444'}">${this._attPermCompare[i]}=${r[action] ? 'Y' : 'N'}</span>`)}
                </div>
              `;
            })}
          </div>
        ` : nothing}
        ${this._attPermAudit.length > 0 ? html`
          <div style="margin-top:8px;font-size:9px;color:#6b7280">Recent: ${this._attPermAudit.slice(0,3).map(a => html`<span style="margin-right:8px">${a.role}.${a.action}: ${a.oldVal ? 'Y' : 'N'}->${a.newVal ? 'Y' : 'N'}</span>`)}
        ` : nothing}
      </div>
    `;
  }

  // === REPORTING SUITE ===
  @state() private _attReportTemplate: string = 'executive';
  @state() private _attReportSchedule: string = 'weekly';
  @state() private _attReportDistList: string[] = ['security-team@company.com','ciso@company.com'];
  @state() private _attReportHistory: {id:string;template:string;generatedAt:string;status:string}[] = [];

  private _attGenerateReport(): void {
    const id = 'rpt-' + Date.now();
    this._attReportHistory.unshift({id,template:this._attReportTemplate,generatedAt:new Date().toISOString(),status:'sent'});
  }

  private _attRenderReporting(): any {
    const templates = [{key:'executive',label:'Executive Summary',desc:'High-level overview for leadership'},{key:'technical',label:'Technical Report',desc:'Detailed findings for engineers'},{key:'compliance',label:'Compliance Audit',desc:'Regulatory compliance evidence'}];
    const schedules = [{key:'daily',label:'Daily'},{key:'weekly',label:'Weekly'},{key:'monthly',label:'Monthly'}];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="font-weight:700;font-size:13px;color:#e2e8f0;margin-bottom:8px">Report Generator</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Template</div>
            ${templates.map(t => html`
              <div style="padding:6px;background:${this._attReportTemplate === t.key ? '#1e3a5f' : '#1a1d2e'};border:1px solid ${this._attReportTemplate === t.key ? '#3b82f6' : '#2a2d3a'};border-radius:4px;margin-bottom:4px;cursor:pointer" @click=${() => { this._attReportTemplate = t.key; }}>
                <div style="font-size:11px;color:#e2e8f0">${t.label}</div>
                <div style="font-size:9px;color:#6b7280">${t.desc}</div>
              </div>
            `)}
          </div>
          <div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Schedule</div>
            <div style="display:flex;gap:4px;margin-bottom:8px">
              ${schedules.map(s => html`<button class="tab ${this._attReportSchedule === s.key ? 'active' : ''}" @click=${() => { this._attReportSchedule = s.key; }}>${s.label}</button>`)}
            </div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Distribution</div>
            <div style="font-size:10px;color:#9ca3af">${this._attReportDistList.map(d => html`<div>${d}</div>`)}</div>
            <div style="margin-top:6px;display:flex;gap:4px">
              <button style="background:#3b82f6;border:none;border-radius:4px;padding:4px 10px;color:#fff;font-size:10px;cursor:pointer" @click=${this._attGenerateReport}>Generate</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">PDF</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">CSV</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">JSON</button>
            </div>
          </div>
        </div>
        ${this._attReportHistory.length > 0 ? html`
          <div style="border-top:1px solid #2a2d3a;padding-top:8px">
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Recent Reports</div>
            ${this._attReportHistory.slice(0,3).map(r => html`
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
  @state() private _attHighContrast: boolean = false;
  @state() private _attA11yAnnounce: string = '';
  @state() private _attShortcutsVisible: boolean = false;
  @state() private _attFocusTrap: boolean = false;

  private _attShortcuts: Record<string, string> = {
    'Escape': 'Close dialogs / Cancel',
    'Ctrl+Shift+S': 'Toggle scenario simulation',
    'Ctrl+Shift+T': 'Toggle time-series view',
    'Ctrl+Shift+R': 'Open report generator',
    'Ctrl+Shift+A': 'Toggle accessibility panel',
    'Ctrl+Shift+H': 'Toggle high contrast',
    'Tab': 'Navigate between sections',
    'Enter/Space': 'Activate focused button',
  };

  private _attHandleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this._attFocusTrap) { this._attFocusTrap = false; this._attAnnounce('Dialog closed'); }
    if (e.ctrlKey && e.shiftKey && e.key === 'H') { e.preventDefault(); this._attHighContrast = !this._attHighContrast; this._attAnnounce('High contrast ' + (this._attHighContrast ? 'enabled' : 'disabled')); }
    if (e.ctrlKey && e.shiftKey && e.key === 'A') { e.preventDefault(); this._attShortcutsVisible = !this._attShortcutsVisible; }
  }

  private _attAnnounce(msg: string): void {
    this._attA11yAnnounce = msg;
    setTimeout(() => { this._attA11yAnnounce = ''; }, 2000);
  }

  private _attRenderAccessibility(): any {
    return html`
      <div role="region" aria-label="Accessibility Controls" style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0" role="heading" aria-level="3">Accessibility</span>
          <button class="tab ${this._attShortcutsVisible ? 'active' : ''}" @click=${() => { this._attShortcutsVisible = !this._attShortcutsVisible; }} aria-expanded=${this._attShortcutsVisible}>Shortcuts</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:#e2e8f0;cursor:pointer">
            <input type="checkbox" .checked=${this._attHighContrast} @change=${() => { this._attHighContrast = !this._attHighContrast; }} aria-label="Toggle high contrast mode">
            High Contrast
          </label>
        </div>
        ${this._attShortcutsVisible ? html`
          <div role="list" aria-label="Keyboard shortcuts" style="background:#1a1d2e;border-radius:6px;padding:8px">
            ${Object.entries(this._attShortcuts).map(([key, desc]) => html`
              <div role="listitem" style="display:flex;justify-content:space-between;padding:3px 0;font-size:10px">
                <kbd style="background:#2a2d3a;padding:1px 6px;border-radius:3px;color:#60a5fa;font-family:monospace">${key}</kbd>
                <span style="color:#9ca3af">${desc}</span>
              </div>
            `)}
          </div>
        ` : nothing}
        <div role="status" aria-live="polite" aria-atomic="true" style="position:absolute;left:-9999px">${this._attA11yAnnounce}</div>
      </div>
    `;
  }


  // === TAB INTEGRATION FOR EXTENDED FEATURES ===
  @state() private _attActiveSubTab: string = 'scenario';



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
        { id: 't4', name: 'Data injection in attack analysis', stride: 'T', likelihood: 7, impact: 8, dreadScore: 7.0, status: 'open', mitigations: ['Input validation', 'WAF rules'], assignedTo: 'Dev Team', discoveredDate: '2024-01-08', lastReviewed: '2024-02-10' },
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

  private _attGetAllSubTabs(): {key:string;label:string}[] {
    return [
      {key:'scenario', label:'Simulation'},
      {key:'timeseries', label:'Trends'},
      {key:'rbac', label:'Access Control'},
      {key:'reporting', label:'Reports'},
      {key:'a11y', label:'Accessibility'},
    ];
  }

  private _attRenderSubPanel(): any {
    switch (this._attActiveSubTab) {
      case 'scenario': return this._attRenderScenarioEngine();
      case 'timeseries': return this._attRenderTimeSeries();
      case 'rbac': return this._attRenderRBAC();
      case 'reporting': return this._attRenderReporting();
      case 'a11y': return this._attRenderAccessibility();
      default: return nothing;
    }
  }

  private _attRenderTabBar(): any {
    return html`
      <div style="display:flex;gap:4px;margin-bottom:12px;border-bottom:1px solid #2a2d3a;padding-bottom:8px;flex-wrap:wrap" role="tablist" aria-label="Extended panel features">
        ${this._attGetAllSubTabs().map(t => html`
          <button class="tab ${this._attActiveSubTab === t.key ? 'active' : ''}" @click=${() => { this._attActiveSubTab = t.key; }} role="tab" aria-selected=${this._attActiveSubTab === t.key}>${t.label}</button>
        `)}
      </div>
      <div role="tabpanel" aria-labelledby="att-tab-${this._attActiveSubTab}">
        ${this._attRenderSubPanel()}
      </div>
    `;
  }

  
  // Register new subtabs for extended sections
  private _attGetNewSubTabs(): {key:string;label:string}[] {
    return [
      { key: 'analytics', label: 'Analytics' },
      { key: 'incident-coord', label: 'IR Coordination' },
      { key: 'metrics-corr', label: 'Metrics Correlation' },
      { key: 'api-gateway', label: 'API Gateway' },
      { key: 'perf-opt', label: 'Performance' },
    ];
  }

  // ========== Section A: Advanced Analytics Engine ==========
  @state() private _attBayesianPrior: number = 0.5;
  @state() private _attBayesianLikelihood: number = 0.7;
  @state() private _attMonteCarloResults: number[] = [];
  @state() private _attCorrelationMatrix: number[][] = [];
  @state() private _attOutlierIndices: number[] = [];
  @state() private _attTrendComponents: {trend:number;seasonal:number;residual:number}[] = [];
  @state() private _attAnalyticsView: string = 'bayesian';
  @state() private _attConfidenceLevel: number = 95;
  @state() private _attMonteCarloIterations: number = 100;

  private _attCalculateBayesianPosterior(): number {
    const prior = this._attBayesianPrior;
    const likelihood = this._attBayesianLikelihood;
    const falsePositiveRate = 1 - likelihood;
    const marginal = prior * likelihood + (1 - prior) * falsePositiveRate;
    return marginal > 0 ? (prior * likelihood) / marginal : 0;
  }

  private _attRunMonteCarloSimulation(): number[] {
    const results: number[] = [];
    const baseRisk = 0.35;
    const volatility = 0.15;
    for (let i = 0; i < this._attMonteCarloIterations; i++) {
      let cumulative = baseRisk;
      for (let j = 0; j < 12; j++) {
        const shock = (Math.random() - 0.5) * 2 * volatility;
        cumulative = Math.max(0, Math.min(1, cumulative + shock * 0.1));
      }
      results.push(cumulative);
    }
    this._attMonteCarloResults = results;
    return results;
  }

  private _attComputeCorrelationMatrix(): number[][] {
    const events = this._attGenerateMockTimeSeries(6, 50);
    const n = events.length;
    const matrix: number[][] = [];
    for (let i = 0; i < n; i++) {
      const row: number[] = [];
      for (let j = 0; j < n; j++) {
        row.push(this._attPearsonCorrelation(events[i], events[j]));
      }
      matrix.push(row);
    }
    this._attCorrelationMatrix = matrix;
    return matrix;
  }

  private _attPearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;
    const mx = x.slice(0, n).reduce((a, b) => a + b, 0) / n;
    const my = y.slice(0, n).reduce((a, b) => a + b, 0) / n;
    let num = 0, dx = 0, dy = 0;
    for (let i = 0; i < n; i++) {
      const xi = x[i] - mx, yi = y[i] - my;
      num += xi * yi;
      dx += xi * xi;
      dy += yi * yi;
    }
    const denom = Math.sqrt(dx * dy);
    return denom > 0 ? num / denom : 0;
  }

  private _attDetectOutliersZScore(data: number[]): number[] {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const std = Math.sqrt(data.reduce((a, b) => a + (b - mean) ** 2, 0) / data.length);
    const threshold = 2.0;
    return data.map((v, i) => Math.abs((v - mean) / (std || 1)) > threshold ? i : -1).filter(i => i >= 0);
  }

  private _attDetectOutliersIQR(data: number[]): number[] {
    const sorted = [...data].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;
    return data.map((v, i) => v < lower || v > upper ? i : -1).filter(i => i >= 0);
  }

  private _attDecomposeTrend(data: number[]): {trend:number;seasonal:number;residual:number}[] {
    const result: {trend:number;seasonal:number;residual:number}[] = [];
    const window = 5;
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - window);
      const end = Math.min(data.length, i + window + 1);
      const trend = data.slice(start, end).reduce((a, b) => a + b, 0) / (end - start);
      const seasonal = Math.sin((i / 12) * Math.PI * 2) * 0.1;
      const residual = data[i] - trend - seasonal;
      result.push({ trend, seasonal, residual });
    }
    this._attTrendComponents = result;
    return result;
  }

  private _attPredictiveScoreWithCI(data: number[]): {score:number;low:number;high:number} {
    const recent = data.slice(-10);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const std = Math.sqrt(recent.reduce((a, b) => a + (b - avg) ** 2, 0) / recent.length);
    const zScore = this._attConfidenceLevel === 99 ? 2.576 : this._attConfidenceLevel === 90 ? 1.645 : 1.96;
    return { score: avg, low: avg - zScore * std, high: avg + zScore * std };
  }

  private _attGenerateMockTimeSeries(count: number, length: number): number[][] {
    const series: number[][] = [];
    for (let s = 0; s < count; s++) {
      const arr: number[] = [];
      let val = 50 + s * 10;
      for (let i = 0; i < length; i++) {
        val += (Math.random() - 0.48) * 5;
        arr.push(Math.max(0, Math.min(100, val)));
      }
      series.push(arr);
    }
    return series;
  }

  private _attRenderAnalyticsEngine(): any {
    const posterior = this._attCalculateBayesianPosterior();
    const mcResults = this._attMonteCarloResults.length > 0 ? this._attMonteCarloResults : this._attRunMonteCarloSimulation();
    const mcAvg = mcResults.reduce((a, b) => a + b, 0) / mcResults.length;
    const mcP95 = [...mcResults].sort((a, b) => a - b)[Math.floor(mcResults.length * 0.95)];
    const matrix = this._attCorrelationMatrix.length > 0 ? this._attCorrelationMatrix : this._attComputeCorrelationMatrix();
    const labels = ['Vulns', 'Incidents', 'Phishing', 'Access', 'Compliance', 'Training'];
    return html`
      <div class="analytics-engine" style="padding:12px">
        <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
          <button class="tab ${this._attAnalyticsView === 'bayesian' ? 'active' : ''}" @click=${() => { this._attAnalyticsView = 'bayesian'; }}>Bayesian</button>
          <button class="tab ${this._attAnalyticsView === 'montecarlo' ? 'active' : ''}" @click=${() => { this._attAnalyticsView = 'montecarlo'; }}>Monte Carlo</button>
          <button class="tab ${this._attAnalyticsView === 'correlation' ? 'active' : ''}" @click=${() => { this._attAnalyticsView = 'correlation'; }}>Correlation</button>
          <button class="tab ${this._attAnalyticsView === 'outliers' ? 'active' : ''}" @click=${() => { this._attAnalyticsView = 'outliers'; }}>Outliers</button>
          <button class="tab ${this._attAnalyticsView === 'trend' ? 'active' : ''}" @click=${() => { this._attAnalyticsView = 'trend'; }}>Trend</button>
          <button class="tab ${this._attAnalyticsView === 'predictive' ? 'active' : ''}" @click=${() => { this._attAnalyticsView = 'predictive'; }}>Predictive</button>
        </div>
        ${this._attAnalyticsView === 'bayesian' ? html`
          <div class="card" style="padding:12px;margin-bottom:8px">
            <h4 style="margin:0 0 8px;color:#e0e0e0">Bayesian Risk Probability</h4>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <div><span style="color:#888">Prior:</span> ${this._attBayesianPrior.toFixed(2)}</div>
              <div><span style="color:#888">Likelihood:</span> ${this._attBayesianLikelihood.toFixed(2)}</div>
              <div><span style="color:#888">Posterior:</span> <strong style="color:${posterior > 0.6 ? '#f44' : '#4f4'}">${posterior.toFixed(4)}</strong></div>
              <div><span style="color:#888">Risk Level:</span> ${posterior > 0.7 ? 'Critical' : posterior > 0.5 ? 'High' : posterior > 0.3 ? 'Medium' : 'Low'}</div>
            </div>
            <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
              <label style="color:#888;font-size:12px">Prior:</label>
              <input type="range" min="0" max="100" .value=${String(this._attBayesianPrior * 100)} @input=${(e: any) => { this._attBayesianPrior = Number(e.target.value) / 100; }} style="flex:1" />
              <label style="color:#888;font-size:12px">Likelihood:</label>
              <input type="range" min="0" max="100" .value=${String(this._attBayesianLikelihood * 100)} @input=${(e: any) => { this._attBayesianLikelihood = Number(e.target.value) / 100; }} style="flex:1" />
            </div>
          </div>
        ` : nothing}
        ${this._attAnalyticsView === 'montecarlo' ? html`
          <div class="card" style="padding:12px;margin-bottom:8px">
            <h4 style="margin:0 0 8px;color:#e0e0e0">Monte Carlo Risk Simulation (${mcResults.length} iterations)</h4>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
              <div><span style="color:#888">Mean:</span> ${(mcAvg * 100).toFixed(1)}%</div>
              <div><span style="color:#888">P95 VaR:</span> ${(mcP95 * 100).toFixed(1)}%</div>
              <div><span style="color:#888">Min:</span> ${(Math.min(...mcResults) * 100).toFixed(1)}%</div>
            </div>
            <div style="margin-top:8px">
              <div style="display:flex;height:60px;align-items:flex-end;gap:1px">${mcResults.slice(0, 50).map(v => html`<div style="flex:1;background:${v > 0.6 ? '#f44' : v > 0.4 ? '#fa0' : '#4a4'};height:${v * 100}%;min-height:2px"></div>`)}</div>
            </div>
            <button class="btn" style="margin-top:8px" @click=${() => { this._attRunMonteCarloSimulation(); }}>Re-run Simulation</button>
          </div>
        ` : nothing}
        ${this._attAnalyticsView === 'correlation' ? html`
          <div class="card" style="padding:12px;margin-bottom:8px">
            <h4 style="margin:0 0 8px;color:#e0e0e0">Cross-Metric Correlation Matrix</h4>
            <table style="width:100%;border-collapse:collapse;font-size:11px">
              <thead><tr><th style="color:#888"></th>${labels.map(l => html`<th style="color:#aaa;padding:2px 4px">${l}</th>`)}</tr></thead>
              <tbody>${matrix.map((row, i) => html`
                <tr><td style="color:#aaa;padding:2px 4px">${labels[i]}</td>
                ${row.map((v, j) => html`<td style="text-align:center;padding:2px 4px;background:rgba(${v > 0.5 ? '255,0,0' : v < -0.5 ? '0,0,255' : '128,128,128'},${Math.abs(v) * 0.6})">${v.toFixed(2)}</td>`)}</tr>
              `)}</tbody>
            </table>
          </div>
        ` : nothing}
        ${this._attAnalyticsView === 'outliers' ? html`
          <div class="card" style="padding:12px;margin-bottom:8px">
            <h4 style="margin:0 0 8px;color:#e0e0e0">Statistical Outlier Detection</h4>
            ${['zscore', 'iqr'].map(method => {
              const data = this._attGenerateMockTimeSeries(1, 30)[0];
              const outliers = method === 'zscore' ? this._attDetectOutliersZScore(data) : this._attDetectOutliersIQR(data);
              return html`<div style="margin-bottom:8px">
                <div style="color:#aaa;font-size:12px">${method === 'zscore' ? 'Z-Score Method' : 'IQR Method'}: ${outliers.length} outliers detected</div>
                <div style="display:flex;gap:1px;height:30px;align-items:flex-end">${data.map((v, i) => html`<div style="flex:1;background:${outliers.includes(i) ? '#f44' : '#3a3d4a'};height:${v}%;min-height:1px"></div>`)}</div>
              </div>`;
            })}
          </div>
        ` : nothing}
        ${this._attAnalyticsView === 'trend' ? html`
          <div class="card" style="padding:12px;margin-bottom:8px">
            <h4 style="margin:0 0 8px;color:#e0e0e0">Trend Decomposition</h4>
            ${['Trend', 'Seasonal', 'Residual'].map((comp, ci) => html`
              <div style="margin-bottom:8px">
                <div style="color:#aaa;font-size:12px">${comp}</div>
                <div style="display:flex;gap:1px;height:25px;align-items:center">${this._attDecomposeTrend(this._attGenerateMockTimeSeries(1, 24)[0]).map(p => {
                  const val = [p.trend, p.seasonal * 500, p.residual][ci];
                  return html`<div style="flex:1;background:${ci === 0 ? '#4a9' : ci === 1 ? '#a4a' : '#aa4'};height:${Math.abs(val) * 50}%;min-height:1px"></div>`;
                })}</div>
              </div>
            `)}
          </div>
        ` : nothing}
        ${this._attAnalyticsView === 'predictive' ? html`
          <div class="card" style="padding:12px;margin-bottom:8px">
            <h4 style="margin:0 0 8px;color:#e0e0e0">Predictive Scoring with Confidence Intervals</h4>
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
              <label style="color:#888;font-size:12px">Confidence:</label>
              <select .value=${String(this._attConfidenceLevel)} @change=${(e: any) => { this._attConfidenceLevel = Number(e.target.value); }}>
                <option value="90">90%</option><option value="95">95%</option><option value="99">99%</option>
              </select>
            </div>
            ${['Risk Score', 'Compliance', 'Threat Index'].map(label => {
              const data = this._attGenerateMockTimeSeries(1, 20)[0];
              const pred = this._attPredictiveScoreWithCI(data);
              return html`<div style="margin-bottom:6px">
                <span style="color:#aaa;font-size:12px">${label}:</span>
                <span style="color:#e0e0e0;font-weight:bold">${pred.score.toFixed(2)}</span>
                <span style="color:#888;font-size:11px">[${pred.low.toFixed(2)}, ${pred.high.toFixed(2)}]</span>
              </div>`;
            })}
          </div>
        ` : nothing}
      </div>
    `;
  }

  // ========== Section B: Incident Response Coordination ==========
  @state() private _attWarRoomActive: boolean = false;
  @state() private _attWarRoomParticipants: string[] = ['SOC Lead', 'IR Manager', 'CISO', 'Legal', 'PR'];
  @state() private _attIncidentSeverity: string = 'P3';
  @state() private _attEscalationLevel: number = 0;
  @state() private _attCommTemplate: string = 'initial';
  @state() private _attLessonsLearned: string = '';
  @state() private _attPostIncidentAnswers: Record<string, string> = {};
  @state() private _attWarRoomMessages: {sender:string;time:string;text:string}[] = [];

  private _attGetSeverityMatrix(): {severity:string;responseTime:string;escalation:string;notify:string}[] {
    return [
      { severity: 'P1 - Critical', responseTime: '15 min', escalation: 'CISO + CEO + Legal', notify: 'All stakeholders immediately' },
      { severity: 'P2 - High', responseTime: '30 min', escalation: 'CISO + IR Manager', notify: 'Security team + affected dept heads' },
      { severity: 'P3 - Medium', responseTime: '2 hours', escalation: 'IR Manager', notify: 'Security team' },
      { severity: 'P4 - Low', responseTime: '24 hours', escalation: 'SOC Lead', notify: 'Ticket created' },
    ];
  }

  private _attGetCommunicationTemplates(): {key:string;subject:string;body:string}[] {
    return [
      { key: 'initial', subject: 'Security Incident Notification', body: 'We are investigating a potential security incident. The security team has been activated and is assessing the scope. We will provide updates every 30 minutes. Please do not share this information externally.' },
      { key: 'escalation', subject: 'Incident Escalation - Action Required', body: 'The incident has been escalated to P1 severity. Additional resources have been engaged. All non-essential access to affected systems has been suspended pending investigation.' },
      { key: 'contained', subject: 'Incident Containment Update', body: 'The incident has been contained. Affected systems have been isolated. Forensic analysis is ongoing. We will provide a detailed timeline within 24 hours.' },
      { key: 'resolved', subject: 'Incident Resolution Notification', body: 'The incident has been fully resolved. Root cause analysis is complete. Remediation actions have been implemented. A post-incident review has been scheduled.' },
      { key: 'external', subject: 'Security Advisory', body: 'We have identified and resolved a security matter. There is no evidence of customer data impact. We are working with relevant authorities and will provide updates as appropriate.' },
    ];
  }

  private _attGetStakeholderMatrix(): {role:string;notifyP1:boolean;notifyP2:boolean;notifyP3:boolean;channel:string}[] {
    return [
      { role: 'CISO', notifyP1: true, notifyP2: true, notifyP3: false, channel: 'Direct message + Phone' },
      { role: 'CEO', notifyP1: true, notifyP2: false, notifyP3: false, channel: 'Direct message + Phone' },
      { role: 'Legal Counsel', notifyP1: true, notifyP2: true, notifyP3: false, channel: 'Email + Phone' },
      { role: 'PR/Communications', notifyP1: true, notifyP2: false, notifyP3: false, channel: 'Email' },
      { role: 'IT Operations', notifyP1: true, notifyP2: true, notifyP3: true, channel: 'Slack + Email' },
      { role: 'Affected Dept Heads', notifyP1: true, notifyP2: true, notifyP3: true, channel: 'Email' },
      { role: 'Board of Directors', notifyP1: true, notifyP2: false, notifyP3: false, channel: 'Briefed by CEO' },
    ];
  }

  private _attGetPostIncidentQuestions(): {id:string;question:string;type:string;options:string[]}[] {
    return [
      { id: 'q1', question: 'What was the initial detection method?', type: 'select', options: ['SIEM Alert', 'User Report', 'Threat Intel Feed', 'Automated Scan', 'Third-party Notification'] },
      { id: 'q2', question: 'How long was the dwell time?', type: 'select', options: ['< 1 hour', '1-24 hours', '1-7 days', '7-30 days', '> 30 days'] },
      { id: 'q3', question: 'Was the incident response plan followed?', type: 'select', options: ['Fully', 'Partially', 'Deviated significantly', 'No plan existed'] },
      { id: 'q4', question: 'What was the root cause category?', type: 'select', options: ['Misconfiguration', 'Unpatched Vulnerability', 'Social Engineering', 'Insider Threat', 'Zero-day Exploit', 'Supply Chain'] },
      { id: 'q5', question: 'What improvements are needed?', type: 'text', options: [] },
    ];
  }

  private _attToggleWarRoom(): void {
    this._attWarRoomActive = !this._attWarRoomActive;
    if (this._attWarRoomActive) {
      this._attWarRoomMessages = [
        { sender: 'System', time: new Date().toLocaleTimeString(), text: 'War room activated. All participants notified.' },
        { sender: 'SOC Lead', time: new Date().toLocaleTimeString(), text: 'Acknowledged. Investigating initial indicators.' },
      ];
    }
  }

  private _attSendWarRoomMessage(text: string): void {
    this._attWarRoomMessages = [...this._attWarRoomMessages, {
      sender: 'You', time: new Date().toLocaleTimeString(), text
    }];
  }

  private _attEscalateIncident(): void {
    const levels = ['P4', 'P3', 'P2', 'P1'];
    const idx = levels.indexOf(this._attIncidentSeverity);
    if (idx < levels.length - 1) {
      this._attIncidentSeverity = levels[idx + 1];
      this._attEscalationLevel = idx + 1;
    }
  }

  private _attRenderIncidentCoordination(): any {
    const templates = this._attGetCommunicationTemplates();
    const currentTemplate = templates.find(t => t.key === this._attCommTemplate) || templates[0];
    const questions = this._attGetPostIncidentQuestions();
    const severityMatrix = this._attGetSeverityMatrix();
    const stakeholders = this._attGetStakeholderMatrix();
    return html`
      <div class="incident-coordination" style="padding:12px">
        <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
          <button class="tab ${this._attWarRoomActive ? 'active' : ''}" @click=${() => { this._attToggleWarRoom(); }}>War Room ${this._attWarRoomActive ? '(Active)' : ''}</button>
          <button class="tab" @click=${() => { this._attEscalateIncident(); }}>Escalate (${this._attIncidentSeverity})</button>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Severity Escalation Matrix</h4>
          <table style="width:100%;border-collapse:collapse;font-size:11px">
            <thead><tr><th style="color:#888;text-align:left">Severity</th><th style="color:#888">Response Time</th><th style="color:#888">Escalation</th><th style="color:#888">Notification</th></tr></thead>
            <tbody>${severityMatrix.map(r => html`
              <tr style="${r.severity.startsWith(this._attIncidentSeverity) ? 'background:rgba(255,68,68,0.15)' : ''}">
                <td style="padding:4px;color:${r.severity.includes('P1') ? '#f44' : r.severity.includes('P2') ? '#fa0' : '#aaa'}">${r.severity}</td>
                <td style="padding:4px;text-align:center;color:#ddd">${r.responseTime}</td>
                <td style="padding:4px;text-align:center;color:#ddd">${r.escalation}</td>
                <td style="padding:4px;text-align:center;color:#888;font-size:10px">${r.notify}</td>
              </tr>
            `)}</tbody>
          </table>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Stakeholder Notification Matrix</h4>
          <table style="width:100%;border-collapse:collapse;font-size:11px">
            <thead><tr><th style="color:#888;text-align:left">Role</th><th style="color:#888">P1</th><th style="color:#888">P2</th><th style="color:#888">P3</th><th style="color:#888">Channel</th></tr></thead>
            <tbody>${stakeholders.map(s => html`
              <tr>
                <td style="padding:4px;color:#ddd">${s.role}</td>
                <td style="padding:4px;text-align:center">${s.notifyP1 ? html`<span style="color:#4f4">YES</span>` : html`<span style="color:#666">no</span>`}</td>
                <td style="padding:4px;text-align:center">${s.notifyP2 ? html`<span style="color:#4f4">YES</span>` : html`<span style="color:#666">no</span>`}</td>
                <td style="padding:4px;text-align:center">${s.notifyP3 ? html`<span style="color:#4f4">YES</span>` : html`<span style="color:#666">no</span>`}</td>
                <td style="padding:4px;text-align:center;color:#888">${s.channel}</td>
              </tr>
            `)}</tbody>
          </table>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Communication Templates</h4>
          <div style="display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap">
            ${templates.map(t => html`<button class="tab ${this._attCommTemplate === t.key ? 'active' : ''}" @click=${() => { this._attCommTemplate = t.key; }}>${t.subject.split(' - ')[0]}</button>`)}
          </div>
          <div style="background:#1a1d27;padding:8px;border-radius:4px">
            <div style="color:#4a9;font-weight:bold;margin-bottom:4px">${currentTemplate.subject}</div>
            <div style="color:#bbb;font-size:12px;line-height:1.5">${currentTemplate.body}</div>
          </div>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Post-Incident Review Questionnaire</h4>
          ${questions.map(q => html`
            <div style="margin-bottom:8px">
              <div style="color:#aaa;font-size:12px;margin-bottom:4px">${q.question}</div>
              ${q.type === 'select' ? html`
                <select style="background:#1a1d27;color:#ddd;border:1px solid #333;padding:4px;border-radius:3px;width:100%;font-size:12px" @change=${(e: any) => { this._attPostIncidentAnswers = {...this._attPostIncidentAnswers, [q.id]: e.target.value}; }}>
                  <option value="">Select...</option>
                  ${q.options.map(o => html`<option value="${o}" ${this._attPostIncidentAnswers[q.id] === o ? 'selected' : ''}>${o}</option>`)}
                </select>
              ` : html`
                <textarea style="background:#1a1d27;color:#ddd;border:1px solid #333;padding:4px;border-radius:3px;width:100%;font-size:12px;min-height:40px" placeholder="Enter details..." @input=${(e: any) => { this._attPostIncidentAnswers = {...this._attPostIncidentAnswers, [q.id]: e.target.value}; }}></textarea>
              `}
            </div>
          `)}
          <div style="margin-top:8px">
            <label style="color:#aaa;font-size:12px;display:block;margin-bottom:4px">Lessons Learned</label>
            <textarea style="background:#1a1d27;color:#ddd;border:1px solid #333;padding:4px;border-radius:3px;width:100%;font-size:12px;min-height:60px" .value=${this._attLessonsLearned} @input=${(e: any) => { this._attLessonsLearned = e.target.value; }}></textarea>
          </div>
        </div>
      </div>
    `;
  }

  // ========== Section C: Security Metrics Correlation ==========
  @state() private _attMetricData: Record<string, number[]> = {};
  @state() private _attCompositeScore: number = 72;
  @state() private _attMetricAlerts: string[] = [];
  @state() private _attLeadingIndicators: string[] = ['Phishing Click Rate', 'Patch Compliance', 'Training Completion', 'Access Review Age'];
  @state() private _attLaggingIndicators: string[] = ['Incident Count', 'MTTR', 'Data Breach Cost', 'Compliance Failures'];
  @state() private _attExecutiveSummary: string = '';

  private _attInitializeMetricData(): void {
    const metrics = ['Vulnerability Count', 'Incident Rate', 'Patch Coverage', 'Training Score', 'Compliance Pct', 'Access Anomalies'];
    metrics.forEach(m => {
      this._attMetricData[m] = this._attGenerateMockTimeSeries(1, 30)[0];
    });
  }

  private _attCalculateCompositeScore(): number {
    const weights: Record<string, number> = {
      'Vulnerability Count': -0.2, 'Incident Rate': -0.25, 'Patch Coverage': 0.2,
      'Training Score': 0.15, 'Compliance Pct': 0.15, 'Access Anomalies': -0.05
    };
    let score = 75;
    for (const [metric, weight] of Object.entries(weights)) {
      const data = this._attMetricData[metric];
      if (data && data.length > 0) {
        const recent = data.slice(-7);
        const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
        score += (avg - 50) * weight;
      }
    }
    this._attCompositeScore = Math.max(0, Math.min(100, score));
    return this._attCompositeScore;
  }

  private _attDetectMetricAnomalies(): string[] {
    const alerts: string[] = [];
    for (const [metric, data] of Object.entries(this._attMetricData)) {
      if (!data || data.length < 10) continue;
      const outliers = this._attDetectOutliersZScore(data);
      if (outliers.length > 0) {
        alerts.push(metric + ': ' + outliers.length + ' anomalous data points detected in last ' + data.length + ' periods');
      }
      const last = data[data.length - 1];
      const prev = data[data.length - 2];
      if (Math.abs(last - prev) / (Math.abs(prev) || 1) > 0.5) {
        alerts.push(metric + ': ' + (last > prev ? 'Sudden increase' : 'Sudden decrease') + ' of ' + (Math.abs(last - prev) / (Math.abs(prev) || 1) * 100).toFixed(0) + '%');
      }
    }
    this._attMetricAlerts = alerts;
    return alerts;
  }

  private _attGenerateExecutiveSummary(): string {
    const score = this._attCalculateCompositeScore();
    const alerts = this._attDetectMetricAnomalies();
    const scoreTrend = score > 80 ? 'improving' : score > 60 ? 'stable' : 'declining';
    let summary = 'Security Posture Score: ' + score.toFixed(0) + '/100 (' + scoreTrend + '). ';
    summary += 'Leading indicators show ' + (this._attLeadingIndicators.length > 2 ? 'generally positive' : 'mixed') + ' trends. ';
    if (alerts.length > 0) {
      summary += 'Active alerts: ' + alerts.length + '. Key concerns: ' + alerts.slice(0, 3).join('; ') + '. ';
    } else {
      summary += 'No critical metric anomalies detected. ';
    }
    summary += 'Recommendation: ' + (score > 80 ? 'Maintain current security posture and continue monitoring.' : score > 60 ? 'Focus on patch management and training completion rates.' : 'Immediate attention required for vulnerability remediation and incident response readiness.');
    this._attExecutiveSummary = summary;
    return summary;
  }

  private _attRenderMetricsCorrelation(): any {
    if (Object.keys(this._attMetricData).length === 0) this._attInitializeMetricData();
    const score = this._attCalculateCompositeScore();
    const alerts = this._attDetectMetricAnomalies();
    const metricNames = Object.keys(this._attMetricData);
    const corrMatrix = metricNames.map((m1, i) =>
      metricNames.map((m2, j) => this._attPearsonCorrelation(this._attMetricData[m1] || [], this._attMetricData[m2] || []))
    );
    const scoreColor = score > 80 ? '#4f4' : score > 60 ? '#fa0' : '#f44';
    return html`
      <div class="metrics-correlation" style="padding:12px">
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Security Posture Composite Score</h4>
          <div style="display:flex;align-items:center;gap:16px">
            <div style="font-size:48px;font-weight:bold;color:${scoreColor}">${score.toFixed(0)}</div>
            <div style="flex:1">
              <div style="background:#1a1d27;border-radius:4px;height:16px;overflow:hidden">
                <div style="height:100%;width:${score}%;background:${scoreColor};border-radius:4px;transition:width 0.5s"></div>
              </div>
              <div style="display:flex;justify-content:space-between;color:#888;font-size:10px;margin-top:2px">
                <span>0 - Critical</span><span>50 - Fair</span><span>100 - Excellent</span>
              </div>
            </div>
          </div>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Leading vs Lagging Indicators</h4>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div>
              <div style="color:#4a9;font-size:12px;font-weight:bold;margin-bottom:4px">Leading (Predictive)</div>
              ${this._attLeadingIndicators.map(ind => html`<div style="color:#aaa;font-size:11px;padding:2px 0">- ${ind}</div>`)}
            </div>
            <div>
              <div style="color:#a4a;font-size:12px;font-weight:bold;margin-bottom:4px">Lagging (Reactive)</div>
              ${this._attLaggingIndicators.map(ind => html`<div style="color:#aaa;font-size:11px;padding:2px 0">- ${ind}</div>`)}
            </div>
          </div>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Cross-Metric Correlation (6x6)</h4>
          <table style="width:100%;border-collapse:collapse;font-size:10px">
            <thead><tr><th style="color:#666"></th>${metricNames.map(m => html`<th style="color:#888;padding:1px 2px;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.split(' ')[0]}</th>`)}</tr></thead>
            <tbody>${corrMatrix.map((row, i) => html`
              <tr><td style="color:#888;padding:1px 2px;font-size:9px">${metricNames[i].split(' ')[0]}</td>
              ${row.map((v, j) => html`<td style="text-align:center;padding:1px;background:rgba(${v > 0.3 ? '0,200,100' : v < -0.3 ? '200,50,50' : '100,100,100'},${Math.abs(v) * 0.8});font-size:9px">${v.toFixed(1)}</td>`)}</tr>
            `)}</tbody>
          </table>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Metric Anomaly Alerts (${alerts.length})</h4>
          ${alerts.length === 0 ? html`<div style="color:#4f4;font-size:12px">No anomalies detected</div>` : html`
            ${alerts.map(a => html`<div style="color:#fa0;font-size:11px;padding:2px 0;border-bottom:1px solid #2a2d3a">Warning: ${a}</div>`)}
          `}
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Executive Summary</h4>
          <div style="background:#1a1d27;padding:8px;border-radius:4px;color:#bbb;font-size:12px;line-height:1.6">${this._attGenerateExecutiveSummary()}</div>
          <button class="btn" style="margin-top:8px;font-size:11px" @click=${() => { this._attGenerateExecutiveSummary(); }}>Regenerate Summary</button>
        </div>
      </div>
    `;
  }

  // ========== Section D: API Gateway & Rate Limiting ==========
  @state() private _attApiEndpoints: {id:string;path:string;method:string;status:string;latency:number;rateLimit:number}[] = [];
  @state() private _attRateLimitPolicy: {endpoint:string;requestsPerMin:number;burstLimit:number;windowSec:number}[] = [];
  @state() private _attApiKeys: {id:string;name:string;created:string;expires:string;status:string;lastUsed:string}[] = [];
  @state() private _attWebhookStatuses: {id:string;url:string;events:string;lastDelivery:string;status:string;retryCount:number}[] = [];

  private _attInitializeApiData(): void {
    this._attApiEndpoints = [
      { id: 'api-1', path: '/api/v1/security/events', method: 'POST', status: 'active', latency: 45, rateLimit: 100 },
      { id: 'api-2', path: '/api/v1/vulnerabilities', method: 'GET', status: 'active', latency: 120, rateLimit: 200 },
      { id: 'api-3', path: '/api/v1/incidents', method: 'POST', status: 'active', latency: 85, rateLimit: 50 },
      { id: 'api-4', path: '/api/v1/assets', method: 'GET', status: 'active', latency: 200, rateLimit: 150 },
      { id: 'api-5', path: '/api/v1/compliance', method: 'GET', status: 'deprecated', latency: 350, rateLimit: 30 },
    ];
    this._attRateLimitPolicy = [
      { endpoint: '/api/v1/security/*', requestsPerMin: 100, burstLimit: 150, windowSec: 60 },
      { endpoint: '/api/v1/vulnerabilities/*', requestsPerMin: 200, burstLimit: 300, windowSec: 60 },
      { endpoint: '/api/v1/incidents/*', requestsPerMin: 50, burstLimit: 75, windowSec: 60 },
      { endpoint: '/api/v1/assets/*', requestsPerMin: 150, burstLimit: 200, windowSec: 60 },
    ];
    this._attApiKeys = [
      { id: 'key-1', name: 'SOC Integration Key', created: '2025-01-15', expires: '2026-01-15', status: 'active', lastUsed: '2 min ago' },
      { id: 'key-2', name: 'SIEM Connector', created: '2025-03-20', expires: '2026-03-20', status: 'active', lastUsed: '5 min ago' },
      { id: 'key-3', name: 'Legacy Scanner', created: '2024-06-01', expires: '2025-06-01', status: 'expired', lastUsed: '30 days ago' },
    ];
    this._attWebhookStatuses = [
      { id: 'wh-1', url: 'https://hooks.slack.com/services/T00/B00/xxx', events: 'incident.created', lastDelivery: '1 min ago', status: 'success', retryCount: 0 },
      { id: 'wh-2', url: 'https://api.pagerduty.com/integration/xxx', events: 'incident.escalated', lastDelivery: '5 min ago', status: 'success', retryCount: 0 },
      { id: 'wh-3', url: 'https://webhooks.jira.com/xxx', events: 'vulnerability.critical', lastDelivery: 'Failed', status: 'failed', retryCount: 3 },
    ];
  }

  private _attUpdateRateLimit(endpoint: string, field: string, value: number): void {
    this._attRateLimitPolicy = this._attRateLimitPolicy.map(p =>
      p.endpoint === endpoint ? { ...p, [field]: value } : p
    );
  }

  private _attRenderApiGateway(): any {
    if (this._attApiEndpoints.length === 0) this._attInitializeApiData();
    const totalRpm = this._attApiEndpoints.reduce((a, e) => a + (Math.random() * e.rateLimit * 0.5), 0);
    const errorRate = (Math.random() * 2).toFixed(1);
    return html`
      <div class="api-gateway" style="padding:12px">
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">API Usage Analytics</h4>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
            <div style="background:#1a1d27;padding:8px;border-radius:4px;text-align:center">
              <div style="color:#4a9;font-size:20px;font-weight:bold">${totalRpm.toFixed(0)}</div>
              <div style="color:#888;font-size:10px">Requests/min</div>
            </div>
            <div style="background:#1a1d27;padding:8px;border-radius:4px;text-align:center">
              <div style="color:${Number(errorRate) > 1 ? '#f44' : '#4f4'};font-size:20px;font-weight:bold">${errorRate}%</div>
              <div style="color:#888;font-size:10px">Error Rate</div>
            </div>
            <div style="background:#1a1d27;padding:8px;border-radius:4px;text-align:center">
              <div style="color:#e0e0e0;font-size:20px;font-weight:bold">${this._attApiEndpoints.length}</div>
              <div style="color:#888;font-size:10px">Active Endpoints</div>
            </div>
          </div>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">API Endpoints</h4>
          <table style="width:100%;border-collapse:collapse;font-size:11px">
            <thead><tr><th style="color:#888;text-align:left">Endpoint</th><th style="color:#888">Method</th><th style="color:#888">Latency</th><th style="color:#888">Rate Limit</th><th style="color:#888">Status</th></tr></thead>
            <tbody>${this._attApiEndpoints.map(e => html`
              <tr>
                <td style="padding:4px;color:#ddd;font-family:monospace;font-size:10px">${e.path}</td>
                <td style="padding:4px;text-align:center"><span style="color:${e.method === 'GET' ? '#4a9' : '#a4a'};font-size:10px">${e.method}</span></td>
                <td style="padding:4px;text-align:center;color:${e.latency > 200 ? '#fa0' : '#4f4'}">${e.latency}ms</td>
                <td style="padding:4px;text-align:center;color:#aaa">${e.rateLimit}/min</td>
                <td style="padding:4px;text-align:center"><span style="color:${e.status === 'active' ? '#4f4' : '#fa0'}">${e.status}</span></td>
              </tr>
            `)}</tbody>
          </table>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Rate Limit Policy Editor</h4>
          ${this._attRateLimitPolicy.map(p => html`
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;padding:4px;background:#1a1d27;border-radius:4px">
              <span style="color:#ddd;font-size:10px;font-family:monospace;min-width:160px">${p.endpoint}</span>
              <div style="display:flex;align-items:center;gap:4px">
                <span style="color:#888;font-size:10px">RPM:</span>
                <input type="number" style="background:#0d0f17;color:#ddd;border:1px solid #333;padding:2px 4px;border-radius:3px;width:60px;font-size:11px" .value=${String(p.requestsPerMin)} @change=${(e: any) => { this._attUpdateRateLimit(p.endpoint, 'requestsPerMin', Number(e.target.value)); }} />
              </div>
              <div style="display:flex;align-items:center;gap:4px">
                <span style="color:#888;font-size:10px">Burst:</span>
                <input type="number" style="background:#0d0f17;color:#ddd;border:1px solid #333;padding:2px 4px;border-radius:3px;width:60px;font-size:11px" .value=${String(p.burstLimit)} @change=${(e: any) => { this._attUpdateRateLimit(p.endpoint, 'burstLimit', Number(e.target.value)); }} />
              </div>
              <div style="display:flex;align-items:center;gap:4px">
                <span style="color:#888;font-size:10px">Window:</span>
                <span style="color:#ddd;font-size:11px">${p.windowSec}s</span>
              </div>
            </div>
          `)}
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">API Key Lifecycle</h4>
          <table style="width:100%;border-collapse:collapse;font-size:11px">
            <thead><tr><th style="color:#888;text-align:left">Name</th><th style="color:#888">Created</th><th style="color:#888">Expires</th><th style="color:#888">Last Used</th><th style="color:#888">Status</th></tr></thead>
            <tbody>${this._attApiKeys.map(k => html`
              <tr>
                <td style="padding:4px;color:#ddd">${k.name}</td>
                <td style="padding:4px;text-align:center;color:#888">${k.created}</td>
                <td style="padding:4px;text-align:center;color:${k.status === 'expired' ? '#f44' : '#888'}">${k.expires}</td>
                <td style="padding:4px;text-align:center;color:#888">${k.lastUsed}</td>
                <td style="padding:4px;text-align:center"><span style="color:${k.status === 'active' ? '#4f4' : '#f44'}">${k.status}</span></td>
              </tr>
            `)}</tbody>
          </table>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Webhook Delivery Status</h4>
          ${this._attWebhookStatuses.map(w => html`
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;padding:6px;background:#1a1d27;border-radius:4px">
              <span style="color:${w.status === 'success' ? '#4f4' : '#f44'};font-size:16px">${w.status === 'success' ? '\u2713' : '\u2717'}</span>
              <div style="flex:1">
                <div style="color:#ddd;font-size:10px;font-family:monospace">${w.url.substring(0, 50)}...</div>
                <div style="color:#888;font-size:10px">Events: ${w.events} | Last: ${w.lastDelivery}${w.retryCount > 0 ? ' | Retries: ' + w.retryCount : ''}</div>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  // ========== Section E: Performance Optimization Panel ==========
  @state() private _attRenderTime: number = 0;
  @state() private _attMemoryEstimate: number = 0;
  @state() private _attCacheHits: number = 0;
  @state() private _attCacheMisses: number = 0;
  @state() private _attLazyLoadingEnabled: boolean = true;
  @state() private _attVirtualScrollEnabled: boolean = false;
  @state() private _attPerfHistory: {timestamp:number;renderMs:number;memoryKb:number;cacheRatio:number}[] = [];
  @state() private _attDataSetSize: number = 1000;

  private _attMeasurePerformance(): void {
    const start = performance.now();
    const data = Array.from({ length: this._attDataSetSize }, (_, i) => ({
      id: i, value: Math.random() * 100, category: ['A', 'B', 'C'][i % 3],
      timestamp: Date.now() - i * 60000
    }));
    const filtered = data.filter(d => d.value > 30).map(d => d.value).sort((a, b) => b - a);
    const end = performance.now();
    this._attRenderTime = Math.round((end - start) * 100) / 100;
    this._attMemoryEstimate = Math.round((this._attDataSetSize * 0.15) * 100) / 100;
    this._attCacheHits = Math.floor(Math.random() * 80 + 60);
    this._attCacheMisses = Math.floor(Math.random() * 30 + 10);
    this._attPerfHistory.push({
      timestamp: Date.now(), renderMs: this._attRenderTime,
      memoryKb: this._attMemoryEstimate,
      cacheRatio: this._attCacheHits / (this._attCacheHits + this._attCacheMisses)
    });
    if (this._attPerfHistory.length > 20) this._attPerfHistory = this._attPerfHistory.slice(-20);
  }

  private _attGetCacheRatio(): number {
    const total = this._attCacheHits + this._attCacheMisses;
    return total > 0 ? this._attCacheHits / total : 0;
  }

  private _attGetPerfRecommendation(): string {
    if (this._attRenderTime > 50) return 'High render time detected. Consider enabling virtual scrolling and reducing data set size.';
    if (this._attGetCacheRatio() < 0.7) return 'Cache hit ratio is low. Review cache invalidation strategy and increase cache TTL.';
    if (this._attMemoryEstimate > 500) return 'High memory usage. Enable lazy loading and consider pagination for large datasets.';
    if (this._attDataSetSize > 500 && !this._attVirtualScrollEnabled) return 'Large dataset detected. Enable virtual scrolling for optimal performance.';
    return 'Performance is within acceptable parameters. Continue monitoring.';
  }

  private _attRenderPerformancePanel(): any {
    if (this._attPerfHistory.length === 0) this._attMeasurePerformance();
    const cacheRatio = this._attGetCacheRatio();
    const recommendation = this._attGetPerfRecommendation();
    const isWarning = recommendation.includes('detected') || recommendation.includes('low') || recommendation.includes('High');
    return html`
      <div class="perf-panel" style="padding:12px">
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Render Performance Metrics</h4>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
            <div style="background:#1a1d27;padding:8px;border-radius:4px;text-align:center">
              <div style="color:${this._attRenderTime > 50 ? '#f44' : '#4f4'};font-size:18px;font-weight:bold">${this._attRenderTime}ms</div>
              <div style="color:#888;font-size:10px">Render Time</div>
            </div>
            <div style="background:#1a1d27;padding:8px;border-radius:4px;text-align:center">
              <div style="color:${this._attMemoryEstimate > 500 ? '#fa0' : '#4a9'};font-size:18px;font-weight:bold">${this._attMemoryEstimate}KB</div>
              <div style="color:#888;font-size:10px">Memory Est.</div>
            </div>
            <div style="background:#1a1d27;padding:8px;border-radius:4px;text-align:center">
              <div style="color:${cacheRatio > 0.8 ? '#4f4' : '#fa0'};font-size:18px;font-weight:bold">${(cacheRatio * 100).toFixed(0)}%</div>
              <div style="color:#888;font-size:10px">Cache Hit Ratio</div>
            </div>
            <div style="background:#1a1d27;padding:8px;border-radius:4px;text-align:center">
              <div style="color:#e0e0e0;font-size:18px;font-weight:bold">${this._attDataSetSize}</div>
              <div style="color:#888;font-size:10px">Dataset Size</div>
            </div>
          </div>
          <div style="margin-top:8px">
            <div style="display:flex;gap:8px;align-items:center">
              <label style="color:#888;font-size:12px">Dataset size:</label>
              <input type="range" min="100" max="10000" step="100" .value=${String(this._attDataSetSize)} @input=${(e: any) => { this._attDataSetSize = Number(e.target.value); }} style="flex:1" />
              <button class="btn" style="font-size:11px" @click=${() => { this._attMeasurePerformance(); }}>Benchmark</button>
            </div>
          </div>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Optimization Controls</h4>
          <div style="display:flex;gap:16px;flex-wrap:wrap">
            <label style="display:flex;align-items:center;gap:6px;color:#ddd;font-size:12px;cursor:pointer">
              <input type="checkbox" .checked=${this._attLazyLoadingEnabled} @change=${(e: any) => { this._attLazyLoadingEnabled = e.target.checked; }} />
              Lazy Loading
            </label>
            <label style="display:flex;align-items:center;gap:6px;color:#ddd;font-size:12px;cursor:pointer">
              <input type="checkbox" .checked=${this._attVirtualScrollEnabled} @change=${(e: any) => { this._attVirtualScrollEnabled = e.target.checked; }} />
              Virtual Scrolling
            </label>
          </div>
          <div style="margin-top:8px;color:${isWarning ? '#fa0' : '#4f4'};font-size:11px;padding:6px;background:${isWarning ? 'rgba(255,170,0,0.1)' : 'rgba(0,255,0,0.05)'};border-radius:4px">
            ${recommendation}
          </div>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Cache Statistics</h4>
          <div style="display:flex;gap:12px;align-items:center;margin-bottom:8px">
            <div style="flex:1">
              <div style="display:flex;justify-content:space-between;color:#888;font-size:10px;margin-bottom:2px">
                <span>Hits: ${this._attCacheHits}</span><span>Misses: ${this._attCacheMisses}</span>
              </div>
              <div style="background:#1a1d27;border-radius:4px;height:10px;overflow:hidden;display:flex">
                <div style="height:100%;width:${(cacheRatio * 100)}%;background:#4f4"></div>
                <div style="height:100%;width:${((1 - cacheRatio) * 100)}%;background:#f44"></div>
              </div>
            </div>
            <div style="color:#ddd;font-size:14px;font-weight:bold">${(cacheRatio * 100).toFixed(0)}%</div>
          </div>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Performance History</h4>
          <div style="display:flex;height:40px;align-items:flex-end;gap:1px">
            ${this._attPerfHistory.slice(-15).map(h => html`
              <div style="flex:1;background:${h.renderMs > 50 ? '#f44' : '#4a4'};height:${Math.min(100, h.renderMs * 2)}%;min-height:2px" title="${h.renderMs}ms"></div>
            `)}
          </div>
          <div style="display:flex;justify-content:space-between;color:#666;font-size:9px;margin-top:2px">
            <span>Render time (ms) - last 15 benchmarks</span>
          </div>
        </div>
      </div>
    `;
  }
}

declare global { interface HTMLElementTagNameMap { 'sc-attack-path-visualization': ScAttackPathVisualization; } }
