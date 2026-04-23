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

  connectedCallback() { super.connectedCallback(); this._initAuditLog(); this._initSlaItems(); }

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


  render() {
    const totalRisk = this._getTotalRisk();
    const riskLevel = totalRisk >= 70 ? 'critical' : totalRisk >= 40 ? 'high' : totalRisk >= 20 ? 'medium' : 'low';
    const successRate = this._getSuccessRate();
    const maxImpact = this._getMaxImpact();

    return html`
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
}

declare global { interface HTMLElementTagNameMap { 'sc-attack-path-visualization': ScAttackPathVisualization; } }
