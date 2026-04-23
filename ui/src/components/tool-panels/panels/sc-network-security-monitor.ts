/**
 * sc-network-security-monitor — Network Security Monitoring Panel
 * Real-time traffic analysis, firewall coverage, and IDS alerts
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface TrafficMetric {
  time: string;
  inbound: number;
  outbound: number;
  blocked: number;
}

interface FirewallRule {
  id: string;
  name: string;
  action: 'allow' | 'deny';
  hits: number;
  lastHit: string;
  coverage: 'covered' | 'partial' | 'uncovered';
}

@customElement('sc-network-security-monitor')
export class ScNetworkSecurityMonitor extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 16px; }
    .stat { background: #1f2937; border-radius: 8px; padding: 12px; text-align: center; }
    .sv { font-size: 20px; font-weight: 700; }
    .sl { font-size: 9px; color: #94a3b8; margin-top: 2px; }
    .tabs { display: flex; gap: 4px; margin-bottom: 14px; }
    .tab { padding: 6px 14px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; background: transparent; color: #94a3b8; }
    .tab:hover { background: #374151; }
    .tab.active { background: #f59e0b; color: #111827; }
    .chart-box { background: #1f2937; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
    .chart-title { font-weight: 600; font-size: 12px; margin-bottom: 12px; }
    .tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
    .tbl th { text-align: left; padding: 8px; background: #0f172a; color: #94a3b8; font-weight: 600; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #374151; }
    .tbl td { padding: 10px 8px; border-bottom: 1px solid #1f2937; }
    .badge { display: inline-block; font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
    .b-allow { background: #052e16; color: #86efac; }
    .b-deny { background: #450a0a; color: #fca5a5; }
    .b-covered { background: #052e16; color: #86efac; }
    .b-partial { background: #422006; color: #fde047; }
    .b-uncovered { background: #450a0a; color: #fca5a5; }
    .geo-map { background: #0f172a; border-radius: 8px; padding: 16px; text-align: center; }
    .geo-placeholder { height: 150px; display: flex; align-items: center; justify-content: center; color: #6b7280; }
    .alert-row { background: #0f172a; border-radius: 6px; padding: 10px; margin-bottom: 6px; border-left: 3px solid; }
    .alert-row.critical { border-color: #ef4444; }
    .alert-row.high { border-color: #f97316; }
    .alert-row.medium { border-color: #eab308; }
    .alert-title { font-weight: 600; font-size: 12px; }
    .alert-meta { font-size: 10px; color: #6b7280; margin-top: 4px; }
    .seg-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .seg-item { background: #0f172a; border-radius: 6px; padding: 12px; text-align: center; }
    .seg-name { font-size: 11px; color: #94a3b8; margin-bottom: 4px; }
    .seg-status { font-size: 14px; font-weight: 700; }
    .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 14px; }
    .kpi-card { background: #0f172a; border-radius: 8px; padding: 12px; border-left: 3px solid; }
    .kpi-card-title { font-size: 10px; color: #6b7280; margin-bottom: 4px; text-transform: uppercase; }
    .kpi-card-value { font-size: 20px; font-weight: 700; }
    .kpi-card-change { font-size: 10px; margin-top: 4px; }
    .kpi-change-up { color: #22c55e; }
    .kpi-change-down { color: #ef4444; }
    .rec-row { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: #0f172a; border-radius: 6px; margin-bottom: 6px; }
    .rec-priority { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .rec-text { flex: 1; font-size: 11px; }
    .rec-meta { font-size: 10px; color: #6b7280; }
    .status-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; margin-right: 4px; }
    .cb { width: 14px; height: 14px; accent-color: #f59e0b; cursor: pointer; }
    .batch-bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #1e1b4b; border-radius: 8px; margin-bottom: 10px; font-size: 11px; }
    .batch-bar button { padding: 4px 12px; border-radius: 5px; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; font-size: 10px; font-weight: 600; cursor: pointer; }
    .batch-bar button:hover { background: #f59e0b30; border-color: #f59e0b; }
    .export-panel { background: #0f172a; border: 1px solid #374151; border-radius: 10px; padding: 16px; margin-bottom: 12px; }
    .export-btn { padding: 8px 16px; border-radius: 6px; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; font-size: 11px; font-weight: 600; cursor: pointer; margin-right: 6px; }
    .export-btn:hover { border-color: #f59e0b; background: #f59e0b20; }
    .risk-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }
    .risk-table th { text-align: left; padding: 6px 8px; background: #0f172a; color: #94a3b8; font-weight: 600; font-size: 9px; text-transform: uppercase; border-bottom: 1px solid #374151; }
    .risk-table td { padding: 6px 8px; border-bottom: 1px solid #1f2937; }
    .risk-bar-track { flex: 1; height: 6px; background: #1f2937; border-radius: 3px; overflow: hidden; }
    .risk-bar-fill { height: 100%; border-radius: 3px; }
    .mitre-tag { display: inline-block; font-size: 9px; padding: 1px 5px; border-radius: 3px; background: #312e81; color: #a5b4fc; margin-right: 3px; }
    .wizard-num { width: 24px; height: 24px; border-radius: 50%; background: #374151; color: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
    .wizard-num.active { background: #f59e0b; }
    .wizard-num.done { background: #22c55e; }
    .wizard-line { flex: 1; height: 2px; background: #374151; }
    .wizard-line.done { background: #22c55e; }
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
  `;

  @state() private _tab: 'traffic' | 'firewall' | 'ids' | 'segmentation' | 'analysis' | 'audit' | 'config' = 'traffic';
  @state() private _showExport = false;
  @state() private _selectedAlerts: Set<string> = new Set();
  @state() private _showRiskAnalysis = false;
  @state() private _execPhase = 'idle';
  @state() private _execProgress = 0;
  @state() private _execSteps: { name: string; desc: string; status: 'pending' | 'running' | 'done'; duration: number }[] = [];
  @state() private _execResults: { step: string; output: string; timestamp: string }[] = [];
  @state() private _auditLog: { timestamp: string; action: string; user: string; detail: string }[] = [];
  @state() private _configSettings: { autoBlock: boolean; idsAlerts: boolean;trafficEncrypt: boolean; geoBlock: boolean; pcapCapture: boolean; slaAlerts: boolean } = { autoBlock: true, idsAlerts: true, trafficEncrypt: true, geoBlock: false, pcapCapture: true, slaAlerts: true };

  private _trafficData: TrafficMetric[] = [
    { time: '00:00', inbound: 120, outbound: 80, blocked: 15 },
    { time: '04:00', inbound: 80, outbound: 50, blocked: 8 },
    { time: '08:00', inbound: 350, outbound: 200, blocked: 45 },
    { time: '12:00', inbound: 420, outbound: 280, blocked: 62 },
    { time: '16:00', inbound: 380, outbound: 220, blocked: 38 },
    { time: '20:00', inbound: 200, outbound: 150, blocked: 22 },
  ];

  private _firewallRules: FirewallRule[] = [
    { id: 'f1', name: 'Allow HTTPS Inbound', action: 'allow', hits: 15420, lastHit: '1m ago', coverage: 'covered' },
    { id: 'f2', name: 'Block Telnet', action: 'deny', hits: 234, lastHit: '5m ago', coverage: 'covered' },
    { id: 'f3', name: 'Allow SSH from Admin Subnet', action: 'allow', hits: 1234, lastHit: '2m ago', coverage: 'covered' },
    { id: 'f4', name: 'Block RDP from External', action: 'deny', hits: 89, lastHit: '15m ago', coverage: 'partial' },
    { id: 'f5', name: 'Allow DNS Outbound', action: 'allow', hits: 45670, lastHit: '0m ago', coverage: 'covered' },
    { id: 'f6', name: 'Block SMB External', action: 'deny', hits: 12, lastHit: '1h ago', coverage: 'uncovered' },
  ];

  private _idsAlerts = [
    { id: 'i1', title: 'SQL Injection Attempt Detected', severity: 'critical', source: 'Snort', time: '3m ago', srcIp: '203.0.113.45', destIp: '10.0.1.10' },
    { id: 'i2', title: 'XSS Attack Blocked', severity: 'high', source: 'Suricata', time: '12m ago', srcIp: '198.51.100.23', destIp: '10.0.1.15' },
    { id: 'i3', title: 'Port Scan Detected', severity: 'medium', source: 'Zeek', time: '25m ago', srcIp: '185.220.101.50', destIp: '10.0.1.0/24' },
    { id: 'i4', title: 'C2 Beacon Pattern', severity: 'critical', source: 'Suricata', time: '45m ago', srcIp: '10.0.42.15', destIp: '45.33.32.156' },
  ];

  private _segmentation = [
    { name: 'DMZ', status: 'Compliant', color: '#22c55e', hosts: 12 },
    { name: 'Internal', status: 'Compliant', color: '#22c55e', hosts: 245 },
    { name: 'PCI Scope', status: 'Review', color: '#f97316', hosts: 8 },
    { name: 'Guest', status: 'Isolated', color: '#3b82f6', hosts: 35 },
  ];

  private _initAuditLog() {
    this._auditLog = [
      { timestamp: '2026-04-22T14:30:00Z', action: 'FIREWALL_RULE', user: 'Admin', detail: 'Added deny rule for 203.0.113.0/24' },
      { timestamp: '2026-04-22T14:15:00Z', action: 'IDS_ALERT', user: 'IDS', detail: 'Detected SQL injection attempt from 198.51.100.42' },
      { timestamp: '2026-04-22T14:00:00Z', action: 'PCAP_START', user: 'Analyst', detail: 'Started packet capture on vlan-100 for 30min' },
      { timestamp: '2026-04-22T13:45:00Z', action: 'GEO_BLOCK', user: 'System', detail: 'Auto-blocked traffic from high-risk country IPs' },
      { timestamp: '2026-04-22T13:30:00Z', action: 'TRAFFIC_ANOMALY', user: 'NDR', detail: 'Unusual outbound traffic pattern detected on 10.0.5.23' },
      { timestamp: '2026-04-22T13:00:00Z', action: 'RULE_UPDATE', user: 'Admin', detail: 'Updated TLS inspection policy for production VLAN' },
    ];
  }

  private _addAudit(action: string, user: string, detail: string) {
    this._auditLog = [{ timestamp: new Date().toISOString(), action, user, detail }, ...this._auditLog.slice(0, 49)];
  }

  private _runNetworkScan() {
    if (this._execPhase === 'running') return;
    this._execSteps = [
      { name: 'Port Scan', desc: 'Scan top 1000 ports on target subnets', status: 'pending', duration: 0 },
      { name: 'Service Detection', desc: 'Identify running services and versions', status: 'pending', duration: 0 },
      { name: 'TLS Analysis', desc: 'Check certificate validity and cipher suites', status: 'pending', duration: 0 },
      { name: 'Firewall Audit', desc: 'Verify rule consistency and coverage gaps', status: 'pending', duration: 0 },
      { name: 'IDS Signature Check', desc: 'Validate IDS signature coverage for detected services', status: 'pending', duration: 0 },
      { name: 'Generate Report', desc: 'Compile findings with risk prioritization', status: 'pending', duration: 0 },
    ];
    this._execResults = [];
    this._execPhase = 'running';
    this._execProgress = 0;
    this._execScanStep(0);
  }

  private _execScanStep(index: number) {
    if (index >= this._execSteps.length) {
      this._execPhase = 'complete';
      this._addAudit('SCAN_COMPLETE', 'System', 'Network security scan completed');
      return;
    }
    this._execSteps = this._execSteps.map((s, i) => i === index ? { ...s, status: 'running' as const } : i < index ? { ...s, status: 'done' as const } : s);
    this._execProgress = Math.round((index / this._execSteps.length) * 100);
    const dur = 300 + Math.random() * 400;
    setTimeout(() => {
      const outputs = [
        'Found 847 open ports across 12 subnets. 23 unexpected services detected.',
        'Identified 45 services. 8 running outdated versions (3 critical patches available).',
        'Analyzed 156 TLS endpoints. 12 using weak ciphers, 5 expired certificates.',
        'Found 4 shadow rules, 2 overlapping deny rules, 8 coverage gaps in segmentation.',
        'IDS covers 89% of detected services. 5 services lack signature coverage.',
        'Report generated: 3 critical, 8 high, 12 medium findings prioritized.',
      ];
      this._execSteps = this._execSteps.map((s, i) => i === index ? { ...s, status: 'done' as const, duration: Math.round(dur) } : s);
      this._execResults = [...this._execResults, { step: this._execSteps[index].name, output: outputs[index], timestamp: new Date().toISOString() }];
      this._execScanStep(index + 1);
    }, dur);
  }

  private _networkTopologySVG(): string {
    const nodes = [
      { id: 'n1', label: 'Internet', x: 140, y: 20, color: '#6b7280' },
      { id: 'n2', label: 'Firewall', x: 140, y: 60, color: '#ef4444' },
      { id: 'n3', label: 'DMZ', x: 60, y: 100, color: '#f97316' },
      { id: 'n4', label: 'Web', x: 220, y: 100, color: '#22c55e' },
      { id: 'n5', label: 'App', x: 140, y: 140, color: '#3b82f6' },
      { id: 'n6', label: 'DB', x: 60, y: 170, color: '#a855f7' },
      { id: 'n7', label: 'Internal', x: 220, y: 170, color: '#eab308' },
      { id: 'n8', label: 'IDS/IPS', x: 60, y: 60, color: '#06b6d4' },
    ];
    const edges = [
      { from: 'n1', to: 'n2' }, { from: 'n2', to: 'n3' }, { from: 'n2', to: 'n4' },
      { from: 'n4', to: 'n5' }, { from: 'n3', to: 'n5' }, { from: 'n5', to: 'n6' },
      { from: 'n5', to: 'n7' }, { from: 'n8', to: 'n2' }, { from: 'n1', to: 'n8' },
    ];
    const nm = Object.fromEntries(nodes.map(n => [n.id, n]));
    let svg = '';
    edges.forEach(e => { const f = nm[e.from], t = nm[e.to]; svg += `<line x1="${f.x}" y1="${f.y}" x2="${t.x}" y2="${t.y}" stroke="#374151" stroke-width="1.5"/>`; });
    nodes.forEach(n => { svg += `<circle cx="${n.x}" cy="${n.y}" r="16" fill="${n.color}" fill-opacity="0.2" stroke="${n.color}" stroke-width="2"/>`; svg += `<text x="${n.x}" y="${n.y + 3}" text-anchor="middle" fill="#e2e8f0" font-size="7" font-weight="600">${n.label}</text>`; });
    return svg;
  }

  private _bandwidthHeatmapSVG(): string {
    const hours = ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22'];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const W = 260, H = 110, cellW = 18, cellH = 12, gap = 2;
    let rects = '';
    days.forEach((d, di) => {
      rects += `<text x="30" y="${di * (cellH + gap) + 10}" text-anchor="end" fill="#94a3b8" font-size="7">${d}</text>`;
      hours.forEach((h, hi) => {
        const val = (di < 5 && hi >= 4 && hi <= 14) ? 60 + Math.floor(Math.random() * 40) : 10 + Math.floor(Math.random() * 30);
        const color = val > 80 ? '#ef4444' : val > 50 ? '#f59e0b' : val > 25 ? '#22c55e' : '#1f2937';
        rects += `<rect x="${34 + hi * (cellW + gap)}" y="${di * (cellH + gap)}" width="${cellW}" height="${cellH}" rx="2" fill="${color}" fill-opacity="0.6"/>`;
      });
    });
    hours.forEach((h, hi) => { rects += `<text x="${34 + hi * (cellW + gap) + 9}" y="${H - 2}" text-anchor="middle" fill="#6b7280" font-size="6">${h}</text>`; });
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}">${rects}</svg>`;
  }

  private _protocolDistributionSVG(): string {
    const protocols = [
      { name: 'HTTPS', pct: 62, color: '#22c55e' },
      { name: 'HTTP', pct: 15, color: '#f59e0b' },
      { name: 'SSH', pct: 8, color: '#3b82f6' },
      { name: 'DNS', pct: 7, color: '#a855f7' },
      { name: 'SMTP', pct: 4, color: '#06b6d4' },
      { name: 'Other', pct: 4, color: '#6b7280' },
    ];
    const W = 260, H = 40, barH = 20;
    let rects = '';
    let x = 0;
    protocols.forEach(p => {
      const w = (p.pct / 100) * W;
      rects += `<rect x="${x}" y="0" width="${w}" height="${barH}" fill="${p.color}" fill-opacity="0.6" rx="2"/>`;
      if (p.pct >= 8) rects += `<text x="${x + w / 2}" y="${barH / 2 + 4}" text-anchor="middle" fill="#fff" font-size="8" font-weight="600">${p.name} ${p.pct}%</text>`;
      x += w;
    });
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}">${rects}</svg>`;
  }

  private _slaItems: { id: string; task: string; assignee: string; deadline: string; elapsed: number; total: number; priority: string }[] = [];
  private _initSlaItems() {
    const now = Date.now();
    this._slaItems = [
      { id: 'ns-sla-1', task: 'Review firewall rule gaps', assignee: 'NetOps', deadline: new Date(now + 7200000).toISOString(), elapsed: 14400000, total: 21600000, priority: 'high' },
      { id: 'ns-sla-2', task: 'Update IDS signatures', assignee: 'SecOps', deadline: new Date(now + 14400000).toISOString(), elapsed: 3600000, total: 36000000, priority: 'medium' },
      { id: 'ns-sla-3', task: 'Patch vulnerable firewall firmware', assignee: 'NetOps', deadline: new Date(now - 3600000).toISOString(), elapsed: 72000000, total: 86400000, priority: 'critical' },
      { id: 'ns-sla-4', task: 'Audit DMZ segmentation rules', assignee: 'Compliance', deadline: new Date(now + 43200000).toISOString(), elapsed: 86400000, total: 172800000, priority: 'medium' },
    ];
  }

  connectedCallback() { super.connectedCallback(); this._initAuditLog(); this._initSlaItems(); }

  private _renderTraffic() {
    const maxTraffic = Math.max(...this._trafficData.map(t => t.inbound));
    return html`
      <div class="chart-box">
        <div class="chart-title">Network Traffic Overview (Last 24h)</div>
        <div style="display:flex;gap:16px;margin-bottom:12px">
          <span style="font-size:11px"><span style="color:#3b82f6">●</span> Inbound</span>
          <span style="font-size:11px"><span style="color:#22c55e">●</span> Outbound</span>
          <span style="font-size:11px"><span style="color:#ef4444">●</span> Blocked</span>
        </div>
        <svg viewBox="0 0 500 150" style="width:100%;height:150px">
          <line x1="0" y1="130" x2="500" y2="130" stroke="#374151" stroke-width="1"/>
          ${[0, 25, 50, 75, 100].map(p => html`<text x="${p * 5}" y="145" fill="#6b7280" font-size="9">${maxTraffic * p / 100}</text>`)}
          ${this._trafficData.map((t, i) => {
            const x = 40 + i * 75;
            const h1 = (t.inbound / maxTraffic) * 100;
            const h2 = (t.outbound / maxTraffic) * 100;
            return html`
              <rect x="${x}" y="${120 - h1}" width="20" height="${h1}" fill="#3b82f6" opacity="0.7"/>
              <rect x="${x + 22}" y="${120 - h2}" width="20" height="${h2}" fill="#22c55e" opacity="0.7"/>
              <text x="${x + 10}" y="140" fill="#6b7280" font-size="8" text-anchor="middle">${t.time}</text>
            `;
          })}
        </svg>
      </div>
      <div class="geo-map">
        <div style="font-weight:600;margin-bottom:8px">Traffic Origin Distribution</div>
        <div class="geo-placeholder">🌍 Geographic Traffic Map</div>
        <div style="display:flex;justify-content:center;gap:20px;margin-top:12px;font-size:11px">
          <span>🇺🇸 US: 45%</span>
          <span>🇪🇺 EU: 28%</span>
          <span>🇬🇧 UK: 12%</span>
          <span>🌏 APAC: 15%</span>
        </div>
      </div>
    `;
  }

  private _renderFirewall() {
    return html`
      <div class="chart-box">
        <div class="chart-title">Firewall Rule Coverage Analysis</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div style="background:#0f172a;border-radius:6px;padding:12px;text-align:center">
            <div style="font-size:24px;font-weight:700;color:#22c55e">85%</div>
            <div style="font-size:10px;color:#6b7280">Rules Fully Covered</div>
          </div>
          <div style="background:#0f172a;border-radius:6px;padding:12px;text-align:center">
            <div style="font-size:24px;font-weight:700;color:#f97316">10%</div>
            <div style="font-size:10px;color:#6b7280">Partial Coverage</div>
          </div>
        </div>
        <div class="kpi-grid">
          ${this._kpiCards.map(k => html`
            <div class="kpi-card" style="border-left-color:${k.color}">
              <div class="kpi-card-title">${k.title}</div>
              <div class="kpi-card-value" style="color:${k.color}">${k.value}</div>
              <div class="kpi-card-change ${k.positive ? 'kpi-change-up' : 'kpi-change-down'}">${k.positive ? '&#9650;' : '&#9660;'} ${k.change} vs last period</div>
            </div>
          `)}
        </div>
        <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:14px">
          <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Recommendations</div>
          ${this._recommendations.map(r => html`
            <div class="rec-row">
              <div class="rec-priority" style="background:${r.priority}"></div>
              <div style="flex:1">
                <div class="rec-text">${r.text}</div>
                <div class="rec-meta">${r.meta}</div>
              </div>
            </div>
          `)}
        </div>

      </div>
      <table class="tbl">
        <thead><tr><th>Rule Name</th><th>Action</th><th>Hits</th><th>Last Hit</th><th>Coverage</th></tr></thead>
        <tbody>
          ${this._firewallRules.map(r => html`
            <tr>
              <td style="font-weight:600">${r.name}</td>
              <td><span class="badge b-${r.action}">${r.action}</span></td>
              <td>${r.hits.toLocaleString()}</td>
              <td style="color:#6b7280">${r.lastHit}</td>
              <td><span class="badge b-${r.coverage}">${r.coverage}</span></td>
            </tr>
          `)}
        </tbody>
      </table>
    `;
  }

  private _renderIds() {
    return html`
      <div class="stats" style="grid-template-columns:repeat(4, 1fr);margin-bottom:12px">
        <div class="stat"><div class="sv" style="color:#ef4444">${this._extendedAlerts.filter(a => a.severity === 'critical').length}</div><div class="sl">Critical</div></div>
        <div class="stat"><div class="sv" style="color:#f97316">${this._extendedAlerts.filter(a => a.severity === 'high').length}</div><div class="sl">High</div></div>
        <div class="stat"><div class="sv" style="color:#eab308">${this._extendedAlerts.filter(a => a.severity === 'medium').length}</div><div class="sl">Medium</div></div>
        <div class="stat"><div class="sv" style="color:#22c55e">156</div><div class="sl">Blocked Today</div></div>
      </div>
      ${this._renderPlaybook()}
      ${this._extendedAlerts.map(a => {
        const score = this._computeNetworkRisk(a);
        return html`
          <div class="alert-row ${a.severity}" style="cursor:pointer">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <div class="alert-title">${a.title}</div>
                <div class="alert-meta">${a.source} | ${a.time} | ${a.srcIp} → ${a.destIp} (${a.destZone}) | ${a.protocol}</div>
                <div style="font-size:9px;color:#6b7280;margin-top:2px">${a.payload}</div>
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
                <span class="badge ${a.severity === 'critical' ? 'b-deny' : a.severity === 'high' ? 'b-uncovered' : 'b-partial'}">${a.severity}</span>
                <span style="font-size:10px;font-weight:700;color:${this._riskColor(score)}">${score}/100</span>
                ${(this._mitreMapping[a.title] || []).map(t => html`<span class="mitre-tag">T${t}</span>`)}
              </div>
            </div>
          </div>`;
      })}
    `;
  }

  private _renderSegmentation() {
    return html`
      <div class="chart-box">
        <div class="chart-title">Network Segmentation Status</div>
        <div class="seg-grid">
          ${this._segmentation.map(s => html`
            <div class="seg-item">
              <div class="seg-name">${s.name}</div>
              <div class="seg-status" style="color:${s.color}">${s.status}</div>
              <div style="font-size:10px;color:#6b7280">${s.hosts} hosts</div>
            </div>
          `)}
        </div>
      </div>
      <div class="chart-box">
        <div class="chart-title">Encryption Status</div>
        <div style="display:flex;gap:12px;align-items:center">
          <div style="flex:1">
            <div style="font-size:11px;margin-bottom:4px">Encrypted Traffic</div>
            <div style="height:12px;background:#374151;border-radius:6px;overflow:hidden">
              <div style="width:87%;height:100%;background:#22c55e;border-radius:6px"></div>
            </div>
          </div>
          <div style="font-size:20px;font-weight:700;color:#22c55e">87%</div>
        </div>
        <div style="display:flex;gap:12px;align-items:center;margin-top:8px">
          <div style="flex:1">
            <div style="font-size:11px;margin-bottom:4px">Unencrypted Traffic</div>
            <div style="height:12px;background:#374151;border-radius:6px;overflow:hidden">
              <div style="width:13%;height:100%;background:#f97316;border-radius:6px"></div>
            </div>
          </div>
          <div style="font-size:20px;font-weight:700;color:#f97316">13%</div>
        </div>
      </div>
    `;
  }


  private _kpiCards = [
    { title: 'Primary KPI', value: '92%', change: '+5%', positive: true, color: '#22c55e' },
    { title: 'Secondary KPI', value: '78%', change: '+3%', positive: true, color: '#3b82f6' },
    { title: 'Risk Indicator', value: '12', change: '-2', positive: true, color: '#f97316' },
    { title: 'Compliance Score', value: '95%', change: '+1%', positive: true, color: '#06b6d4' },
  ];

  private _recommendations = [
    { priority: '#ef4444', text: 'Address 3 critical findings identified in latest assessment', meta: 'Due: 2026-04-30 | Owner: Security Team' },
    { priority: '#f97316', text: 'Complete semi-annual review for all Network Security Monitor items', meta: 'Due: 2026-05-15 | Owner: Compliance' },
    { priority: '#eab308', text: 'Update policies to reflect recent regulatory changes', meta: 'Due: 2026-06-01 | Owner: Legal' },
    { priority: '#22c55e', text: 'Schedule next quarterly review with stakeholders', meta: 'Due: 2026-06-15 | Owner: PMO' },
  ];

  private _mitreMapping: Record<string, string[]> = {
    'SQL Injection Attempt Detected': ['T1190', 'T1059'],
    'XSS Attack Blocked': ['T1189', 'T1059.009'],
    'Port Scan Detected': ['T1046', 'T1595'],
    'C2 Beacon Pattern': ['T1071', 'T1573'],
  };

  private _networkRiskFactors = [
    { factor: 'Alert Severity', weight: 0.25, values: { critical: 10, high: 7, medium: 4, low: 1 } },
    { factor: 'Source Reputation', weight: 0.20, values: { known_malicious: 10, suspicious: 7, unknown: 5, trusted: 2 } },
    { factor: 'Target Sensitivity', weight: 0.20, values: { pci: 10, phi: 9, internal: 5, dmz: 4, external: 2 } },
    { factor: 'Attack Frequency', weight: 0.15, values: { sustained: 10, repeated: 7, sporadic: 4, single: 2 } },
    { factor: 'Lateral Movement', weight: 0.10, values: { confirmed: 10, suspected: 7, none: 1 } },
    { factor: 'Time Context', weight: 0.10, values: { after_hours: 8, weekend: 9, business: 3, normal: 2 } },
  ];

  private _extendedAlerts = [
    { id: 'i1', title: 'SQL Injection Attempt Detected', severity: 'critical', source: 'Snort', time: '3m ago', srcIp: '203.0.113.45', destIp: '10.0.1.10', destZone: 'PCI Scope', protocol: 'HTTPS', payload: 'SELECT * FROM users WHERE', frequency: 'sustained', srcReputation: 'known_malicious' },
    { id: 'i2', title: 'XSS Attack Blocked', severity: 'high', source: 'Suricata', time: '12m ago', srcIp: '198.51.100.23', destIp: '10.0.1.15', destZone: 'DMZ', protocol: 'HTTP', payload: '<script>alert(1)</script>', frequency: 'sporadic', srcReputation: 'suspicious' },
    { id: 'i3', title: 'Port Scan Detected', severity: 'medium', source: 'Zeek', time: '25m ago', srcIp: '185.220.101.50', destIp: '10.0.1.0/24', destZone: 'Internal', protocol: 'TCP', payload: 'SYN scan ports 1-1024', frequency: 'repeated', srcReputation: 'known_malicious' },
    { id: 'i4', title: 'C2 Beacon Pattern', severity: 'critical', source: 'Suricata', time: '45m ago', srcIp: '10.0.42.15', destIp: '45.33.32.156', destZone: 'External', protocol: 'HTTPS', payload: 'Periodic 60s beacon to C2 server', frequency: 'sustained', srcReputation: 'unknown' },
    { id: 'i5', title: 'DNS Tunneling Detected', severity: 'high', source: 'Zeek', time: '1h ago', srcIp: '10.0.15.22', destIp: '8.8.8.8', destZone: 'External', protocol: 'DNS', payload: 'Long TXT record queries to suspicious domain', frequency: 'sustained', srcReputation: 'suspicious' },
    { id: 'i6', title: 'Brute Force SSH Attempt', severity: 'high', source: 'Snort', time: '1.5h ago', srcIp: '91.132.137.78', destIp: '10.0.1.5', destZone: 'DMZ', protocol: 'SSH', payload: 'Multiple failed root login attempts', frequency: 'sustained', srcReputation: 'known_malicious' },
    { id: 'i7', title: 'Suspicious ARP Activity', severity: 'medium', source: 'Zeek', time: '2h ago', srcIp: '10.0.3.44', destIp: '10.0.3.1', destZone: 'Internal', protocol: 'ARP', payload: 'Gratuitous ARP from unknown MAC', frequency: 'sporadic', srcReputation: 'unknown' },
    { id: 'i8', title: 'ICMP Tunnel Detection', severity: 'low', source: 'Suricata', time: '3h ago', srcIp: '10.0.42.8', destIp: '172.16.0.1', destZone: 'External', protocol: 'ICMP', payload: 'Large ICMP payload with encoded data', frequency: 'single', srcReputation: 'unknown' },
  ];

  private _computeNetworkRisk(alert: typeof this._extendedAlerts[0]): number {
    let score = 0;
    for (const rf of this._networkRiskFactors) {
      let val = 5;
      if (rf.factor === 'Alert Severity') val = rf.values[alert.severity] || 5;
      else if (rf.factor === 'Source Reputation') val = rf.values[alert.srcReputation] || 5;
      else if (rf.factor === 'Target Sensitivity') {
        const z = alert.destZone.toLowerCase();
        val = z.includes('pci') ? 10 : z.includes('phi') ? 9 : z.includes('internal') ? 5 : z.includes('dmz') ? 4 : 2;
      }
      else if (rf.factor === 'Attack Frequency') val = rf.values[alert.frequency] || 3;
      else if (rf.factor === 'Lateral Movement') val = alert.destZone === 'Internal' ? 7 : 1;
      else if (rf.factor === 'Time Context') val = 5;
      score += val * rf.weight;
    }
    return Math.round(Math.min(score * 10, 100));
  }

  private _riskColor(score: number): string {
    if (score >= 80) return '#ef4444';
    if (score >= 60) return '#f97316';
    if (score >= 40) return '#eab308';
    return '#22c55e';
  }

  private _exportAlerts(format: string) {
    const data = this._extendedAlerts;
    let content = '';
    if (format === 'csv') {
      content = 'ID,Severity,Title,Source,Time,SourceIP,DestIP,DestZone,Protocol,RiskScore\n' +
        data.map(a => `${a.id},${a.severity},${a.title},${a.source},${a.time},${a.srcIp},${a.destIp},${a.destZone},${a.protocol},${this._computeNetworkRisk(a)}`).join('\n');
    } else if (format === 'json') {
      content = JSON.stringify(data.map(a => ({ ...a, riskScore: this._computeNetworkRisk(a) })), null, 2);
    } else if (format === 'markdown') {
      content = '# Network Security Alerts\n\n' + data.map(a => `## ${a.id} - ${a.title}\n- **Severity:** ${a.severity} | **Risk:** ${this._computeNetworkRisk(a)}/100\n- **Source:** ${a.source} | ${a.srcIp} → ${a.destIp} (${a.destZone})\n- **Protocol:** ${a.protocol}\n- **Payload:** ${a.payload}\n- **MITRE:** ${(this._mitreMapping[a.title] || []).map(t => 'T' + t).join(', ') || 'N/A'}\n`).join('\n');
    }
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.href = url; el.download = 'network-alerts.' + (format === 'markdown' ? 'md' : format); el.click();
    URL.revokeObjectURL(url);
    this._showExport = false;
  }

  private _renderPlaybook() {
    const steps = [
      { num: 1, title: 'Detect', desc: 'IDS/IPS identifies suspicious network activity', status: 'done' },
      { num: 2, title: 'Classify', desc: 'Alert categorized by severity, protocol, and MITRE technique', status: 'done' },
      { num: 3, title: 'Enrich', desc: 'Threat intelligence and source reputation lookup', status: 'done' },
      { num: 4, title: 'Triage', desc: 'SOC analyst reviews and assigns risk score', status: 'active' },
      { num: 5, title: 'Respond', desc: 'Block IP, update firewall rules, isolate host', status: '' },
      { num: 6, title: 'Report', desc: 'Document incident, update threat model, notify stakeholders', status: '' },
    ];
    return html`
      <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
        <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Network Incident Response Playbook</div>
        ${steps.map((s, idx) => html`
          <div style="display:flex;align-items:center;gap:10px;${idx < steps.length - 1 ? 'margin-bottom:4px' : ''}">
            <div class="wizard-num ${s.status === 'done' ? 'done' : s.status === 'active' ? 'active' : ''}">${s.status === 'done' ? '✓' : s.num}</div>
            <div style="flex:1">
              <div style="font-size:12px;font-weight:600;${s.status === 'active' ? 'color:#f59e0b' : s.status === 'done' ? 'color:#22c55e' : 'color:#6b7280'}">${s.title}</div>
              <div style="font-size:10px;color:#6b7280">${s.desc}</div>
            </div>
            ${idx < steps.length - 1 ? html`<div class="wizard-line ${s.status === 'done' ? 'done' : ''}"></div>` : nothing}
          </div>
        `)}
      </div>`;
  }

  private _renderRiskAnalysis() {
    return html`
      <div class="export-panel">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div style="font-size:13px;font-weight:700">Network Risk Analysis</div>
          <button class="detail-close" style="background:#374151;border:none;color:#94a3b8;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:11px" @click=${() => { this._showRiskAnalysis = false; }}>✕</button>
        </div>
        <div style="font-size:10px;color:#6b7280;margin-bottom:10px">Weighted: Severity (25%) + Source Rep (20%) + Target Sens (20%) + Frequency (15%) + Lateral (10%) + Time (10%)</div>
        <table class="risk-table">
          <thead><tr><th>ID</th><th>Title</th><th>Score</th><th>MITRE</th><th>Protocol</th></tr></thead>
          <tbody>
            ${this._extendedAlerts.sort((a, b) => this._computeNetworkRisk(b) - this._computeNetworkRisk(a)).map(a => {
              const score = this._computeNetworkRisk(a);
              return html`<tr>
                <td style="font-weight:600">${a.id}</td>
                <td>${a.title}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:6px">
                    <span style="font-weight:700;color:${this._riskColor(score)};width:28px">${score}</span>
                    <div class="risk-bar-track"><div class="risk-bar-fill" style="width:${score}%;background:${this._riskColor(score)}"></div></div>
                  </div>
                </td>
                <td>${(this._mitreMapping[a.title] || []).map(t => html`<span class="mitre-tag">T${t}</span>`) || html`<span style="color:#6b7280">N/A</span>`}</td>
                <td>${a.protocol}</td>
              </tr>`;
            })}
          </tbody>
        </table>
      </div>`;
  }

  private _renderExportPanel() {
    return html`
      <div class="export-panel">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div style="font-size:13px;font-weight:700">Export Alerts</div>
          <button class="detail-close" style="background:#374151;border:none;color:#94a3b8;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:11px" @click=${() => { this._showExport = false; }}>✕</button>
        </div>
        <div style="font-size:11px;color:#6b7280;margin-bottom:12px">Export ${this._extendedAlerts.length} alerts in your preferred format.</div>
        <div style="display:flex;gap:8px">
          <button class="export-btn" @click=${() => this._exportAlerts('csv')}>CSV</button>
          <button class="export-btn" @click=${() => this._exportAlerts('json')}>JSON</button>
          <button class="export-btn" @click=${() => this._exportAlerts('markdown')}>Markdown</button>
        </div>
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


  // --- Domain Rules Engine ---
  @state() private _nsmRules: { id: string; name: string; category: string; severity: Severity; enabled: boolean; lastEval: string; passRate: number }[] = [];
  private _initNsmRules() {
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
    this._nsmRules = rules;
  }
  private _evaluateNsmRules(): { passed: number; failed: number; skipped: number; total: number } {
    let passed = 0, failed = 0, skipped = 0;
    this._nsmRules.forEach(r => { if (!r.enabled) { skipped++; } else if (r.passRate >= 80) { passed++; } else { failed++; } });
    return { passed, failed, skipped, total: this._nsmRules.length };
  }

  // --- CVSS Scoring ---
  @state() private _nsmcvssData: { itemId: string; vector: string; base: number; temporal: number; environmental: number; overall: number }[] = [];
  private _initNsmCvss() {
    const vectors = ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', 'CVSS:3.1/AV:A/AC:H/PR:L/UI:R/S:C/C:L/I:L/A:N', 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N', 'CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H', 'CVSS:3.1/AV:N/AC:H/PR:H/UI:R/S:U/C:N/I:L/A:N'];
    this._nsmcvssData = vectors.map((v, i) => {
      const base = parseFloat((Math.random() * 6 + 3).toFixed(1));
      const temporal = parseFloat((base * (0.7 + Math.random() * 0.3)).toFixed(1));
      const environmental = parseFloat((temporal * (0.8 + Math.random() * 0.2)).toFixed(1));
      return { itemId: 'V-' + String(i + 1).padStart(3, '0'), vector: v, base, temporal, environmental, overall: environmental };
    });
  }

  // --- Anomaly Detection ---
  @state() private _nsmanomalies: { id: string; type: string; severity: Severity; description: string; detected: string; confidence: number; affected: string[] }[] = [];
  private _runNsmAnomalyDetection() {
    const types = [
      { type: 'Spike in violation rate', severity: 'high' as Severity, desc: 'Detected 280% increase in violations over the last 24 hours', affected: ['Core', 'Operations'] },
      { type: 'SLA breach pattern', severity: 'critical' as Severity, desc: 'Recurring SLA breaches on weekends indicating staffing gaps', affected: ['SLA', 'Staffing'] },
      { type: 'Baseline drift detected', severity: 'medium' as Severity, desc: 'Score drifted 10 points below established baseline over 7 days', affected: ['Metrics', 'Baseline'] },
      { type: 'Unusual escalation volume', severity: 'high' as Severity, desc: 'Escalation rate 2.5x above normal in infrastructure controls', affected: ['Infrastructure', 'Controls'] },
      { type: 'Stale findings accumulation', severity: 'low' as Severity, desc: '18 findings older than 90 days without status change', affected: ['Maintenance'] },
    ];
    this._nsmanomalies = types.map((a, i) => ({
      id: 'ANO-' + String(i + 1).padStart(3, '0'), type: a.type, severity: a.severity,
      description: a.desc, detected: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
      confidence: parseFloat((0.65 + Math.random() * 0.30).toFixed(2)), affected: a.affected,
    }));
  }

  // --- Trend Prediction ---
  @state() private _nsmpredictions: { horizon: string; metric: string; current: number; predicted: number; direction: 'up' | 'down' | 'stable'; confidence: number }[] = [];
  private _generateNsmPredictions() {
    this._nsmpredictions = [
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
  @state() private _nsmApprovals: { id: string; title: string; requester: string; status: 'pending' | 'approved' | 'rejected' | 'expired'; createdAt: string; priority: Priority; type: string }[] = [];
  private _initNsmApprovals() {
    this._nsmApprovals = [
      { id: 'APR-001', title: 'Emergency exception request for critical finding', requester: 'Alice Chen', status: 'pending', createdAt: '2026-04-23T07:00:00Z', priority: 'p1', type: 'Exception' },
      { id: 'APR-002', title: 'Extend compliance deadline for quarterly audit', requester: 'Bob Martinez', status: 'pending', createdAt: '2026-04-22T18:00:00Z', priority: 'p2', type: 'Extension' },
      { id: 'APR-003', title: 'Disable security control for system migration', requester: 'Carol Wu', status: 'rejected', createdAt: '2026-04-22T14:00:00Z', priority: 'p1', type: 'Policy Change' },
      { id: 'APR-004', title: 'New assessment approval for third-party vendor', requester: 'Dave Kim', status: 'approved', createdAt: '2026-04-21T10:00:00Z', priority: 'p3', type: 'Vendor' },
      { id: 'APR-005', title: 'Network rule change for partner integration', requester: 'Eve Johnson', status: 'expired', createdAt: '2026-04-19T08:00:00Z', priority: 'p2', type: 'Network' },
    ];
  }
  private _approveNsmItem(id: string) { const item = this._nsmApprovals.find(a => a.id === id); if (item) item.status = 'approved'; this.requestUpdate(); }
  private _rejectNsmItem(id: string) { const item = this._nsmApprovals.find(a => a.id === id); if (item) item.status = 'rejected'; this.requestUpdate(); }

  // --- Activity Feed ---
  @state() private _nsmActivity: { id: string; action: string; user: string; target: string; timestamp: string }[] = [];
  private _initNsmActivity() {
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
    this._nsmActivity = actions.map((a, i) => ({ id: 'ACT-' + String(i + 1).padStart(3, '0'), ...a, timestamp: new Date(Date.now() - i * 3600000).toISOString() }));
  }

  // --- Notification System ---
  @state() private _nsmNotifications: { id: string; message: string; type: 'info' | 'warning' | 'error' | 'success'; read: boolean; timestamp: string }[] = [];
  private _initNsmNotifications() {
    this._nsmNotifications = [
      { id: 'NTF-001', message: 'Score dropped below threshold', type: 'warning', read: false, timestamp: new Date().toISOString() },
      { id: 'NTF-002', message: '3 items approaching SLA deadline within 24h', type: 'error', read: false, timestamp: new Date(Date.now() - 1800000).toISOString() },
      { id: 'NTF-003', message: 'Weekly report generated successfully', type: 'success', read: true, timestamp: new Date(Date.now() - 7200000).toISOString() },
      { id: 'NTF-004', message: 'New framework mapped to existing controls', type: 'info', read: true, timestamp: new Date(Date.now() - 14400000).toISOString() },
    ];
  }
  private _markNsmNotifRead(id: string) { const n = this._nsmNotifications.find(x => x.id === id); if (n) n.read = true; this.requestUpdate(); }

  // --- Panel Configuration ---
  @state() private _nsmConfig: { layout: 'compact' | 'default' | 'expanded'; theme: 'dark' | 'midnight' | 'slate'; showAnomalies: boolean; showPredictions: boolean; autoRefresh: boolean; refreshInterval: number } = {
    layout: 'default', theme: 'dark', showAnomalies: true, showPredictions: true, autoRefresh: true, refreshInterval: 60,
  };
  private _nsmPresets: { name: string; config: typeof this._nsmConfig }[] = [
    { name: 'Analyst View', config: { layout: 'expanded', theme: 'dark', showAnomalies: true, showPredictions: false, autoRefresh: true, refreshInterval: 30 } },
    { name: 'Executive Summary', config: { layout: 'compact', theme: 'slate', showAnomalies: false, showPredictions: true, autoRefresh: false, refreshInterval: 300 } },
    { name: 'Audit Mode', config: { layout: 'expanded', theme: 'midnight', showAnomalies: true, showPredictions: true, autoRefresh: true, refreshInterval: 60 } },
  ];
  private _applyNsmPreset(preset: typeof this._nsmPresets[0]) { this._nsmConfig = { ...preset.config }; this.requestUpdate(); }

  private _renderNsmTreemapSVG(): string {
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

  private _renderNsmSankeySVG(): string {
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
  private _renderNsmRules(): any {
    const ev = this._evaluateNsmRules();
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
          $${this._nsmRules.map(r => html`
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
  private _renderNsmAnomalies(): any {
    const sc = (s: Severity) => s === 'critical' ? '#ef4444' : s === 'high' ? '#f97316' : s === 'medium' ? '#eab308' : '#22c55e';
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Anomaly Detection</div>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto">
          $${this._nsmanomalies.map(a => html`
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
  private _renderNsmPredictions(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Trend Predictions</div>
        <div style="display:flex;flex-direction:column;gap:4px">
          $${this._nsmpredictions.map(pr => html`
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
  private _renderNsmApprovals(): any {
    const stc = (s: string) => s === 'pending' ? '#eab308' : s === 'approved' ? '#22c55e' : s === 'rejected' ? '#ef4444' : '#6b7280';
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Approval Workflow</div>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto">
          $${this._nsmApprovals.map(a => html`
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
                  <button class="btn success" style="padding:2px 8px;font-size:9px" @click=$${() => this._approveNsmItem(a.id)}>Approve</button>
                  <button class="btn error" style="padding:2px 8px;font-size:9px" @click=$${() => this._rejectNsmItem(a.id)}>Reject</button>
                </div>` : nothing}
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Activity Feed ---
  private _renderNsmActivity(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Activity Feed</div>
        <div style="display:flex;flex-direction:column;gap:4px;max-height:140px;overflow-y:auto">
          $${this._nsmActivity.map(a => html`
            <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:#1f2937;border-radius:4px;font-size:10px">
              <div style="width:20px;height:20px;border-radius:50%;background:#374151;display:flex;align-items:center;justify-content:center;font-size:9px">•</div>
              <div style="flex:1"><span style="font-weight:600">$${a.user}</span> $${a.action}</div>
              <span style="font-size:8px;color:#6b7280">$${new Date(a.timestamp).toLocaleTimeString()}</span>
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Notifications ---
  private _renderNsmNotifications(): any {
    const tc = (t: string) => t === 'error' ? '#ef4444' : t === 'warning' ? '#eab308' : t === 'success' ? '#22c55e' : '#3b82f6';
    const unread = this._nsmNotifications.filter(n => !n.read).length;
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Notifications $${unread > 0 ? html`<span class="badge badge-error">$${unread} new</span>` : nothing}</div>
        <div style="display:flex;flex-direction:column;gap:4px;max-height:120px;overflow-y:auto">
          $${this._nsmNotifications.map(n => html`
            <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:$${n.read ? '#1f2937' : '#252a36'};border-radius:4px;font-size:10px;opacity:$${n.read ? '0.6' : '1'};cursor:pointer" @click=$${() => this._markNsmNotifRead(n.id)}>
              <span style="width:8px;height:8px;border-radius:50%;background:$${tc(n.type)}"></span>
              <span style="flex:1">$${n.message}</span>
              $${!n.read ? html`<span style="width:6px;height:6px;border-radius:50%;background:#3b82f6"></span>` : nothing}
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Panel Config ---
  private _renderNsmConfig(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Panel Configuration</div>
        <div style="display:flex;flex-direction:column;gap:6px;font-size:10px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Layout</span>
            <select class="form-input" style="flex:1" @change=$${(e: Event) => { this._nsmConfig.layout = (e.target as HTMLSelectElement).value as any; this.requestUpdate(); }}>
              <option value="compact" ?selected=$${this._nsmConfig.layout === 'compact'}>Compact</option>
              <option value="default" ?selected=$${this._nsmConfig.layout === 'default'}>Default</option>
              <option value="expanded" ?selected=$${this._nsmConfig.layout === 'expanded'}>Expanded</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Theme</span>
            <select class="form-input" style="flex:1" @change=$${(e: Event) => { this._nsmConfig.theme = (e.target as HTMLSelectElement).value as any; this.requestUpdate(); }}>
              <option value="dark" ?selected=$${this._nsmConfig.theme === 'dark'}>Dark</option>
              <option value="midnight" ?selected=$${this._nsmConfig.theme === 'midnight'}>Midnight</option>
              <option value="slate" ?selected=$${this._nsmConfig.theme === 'slate'}>Slate</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Auto Refresh</span>
            <input type="checkbox" ?checked=$${this._nsmConfig.autoRefresh} @change=$${() => { this._nsmConfig.autoRefresh = !this._nsmConfig.autoRefresh; this.requestUpdate(); }}/>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Show Anomalies</span>
            <input type="checkbox" ?checked=$${this._nsmConfig.showAnomalies} @change=$${() => { this._nsmConfig.showAnomalies = !this._nsmConfig.showAnomalies; this.requestUpdate(); }}/>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Show Predictions</span>
            <input type="checkbox" ?checked=$${this._nsmConfig.showPredictions} @change=$${() => { this._nsmConfig.showPredictions = !this._nsmConfig.showPredictions; this.requestUpdate(); }}/>
          </div>
          <div style="margin-top:6px;font-weight:600">Presets</div>
          <div style="display:flex;gap:4px">
            $${this._nsmPresets.map(ps => html`<button class="btn" style="padding:2px 8px;font-size:9px" @click=$${() => this._applyNsmPreset(ps)}>$${ps.name}</button>`)}
          </div>
        </div>
      </div>`;
  }

  render() {
    return html`
      <div class="panel">
        <div class="pt">🛡 Network Security Monitor
          <div style="margin-left:auto;display:flex;gap:6px">
            <span class="tab ${this._showRiskAnalysis ? 'active' : ''}" style="font-size:10px;padding:4px 10px" @click=${() => { this._showRiskAnalysis = !this._showRiskAnalysis; this._showExport = false; }}>Risk Analysis</span>
            <span class="tab ${this._showExport ? 'active' : ''}" style="font-size:10px;padding:4px 10px" @click=${() => { this._showExport = !this._showExport; this._showRiskAnalysis = false; }}>Export</span>
          </div>
        </div>

        ${this._showRiskAnalysis ? this._renderRiskAnalysis() : nothing}
        ${this._showExport ? this._renderExportPanel() : nothing}

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
          <div style="background:#1f2937;border-radius:8px;padding:14px">
            <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Key Metrics Summary</div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Firewall Rules</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#06b6d4">1,247</div>              <div style="flex:1;font-size:10px;color:#6b7280">23 pending review</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">IDS Alerts (24h)</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#f97316">342</div>              <div style="flex:1;font-size:10px;color:#6b7280">8 high severity</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Blocked Connections</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#ef4444">12.4K</div>              <div style="flex:1;font-size:10px;color:#6b7280">+8% vs yesterday</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Network Zones</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#3b82f6">12</div>              <div style="flex:1;font-size:10px;color:#6b7280">All segmented</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Active Sessions</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#a855f7">4,521</div>              <div style="flex:1;font-size:10px;color:#6b7280">Within baseline</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Bandwidth Util</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#22c55e">67%</div>              <div style="flex:1;font-size:10px;color:#6b7280">Normal range</div>            </div>
          </div>
          <div style="background:#1f2937;border-radius:8px;padding:14px">
            <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Security Insights</div>
            <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <span style="color:#06b6d4;flex-shrink:0;margin-top:1px">&#8226;</span>              <span style="color:#94a3b8">Network segmentation validation completed for all 12 zones.</span>            </div>
            <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <span style="color:#06b6d4;flex-shrink:0;margin-top:1px">&#8226;</span>              <span style="color:#94a3b8">IDS/IPS signature database updated with 847 new rules this week.</span>            </div>
            <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <span style="color:#06b6d4;flex-shrink:0;margin-top:1px">&#8226;</span>              <span style="color:#94a3b8">Zero unauthorized lateral movement detected in the last 72 hours.</span>            </div>
            <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <span style="color:#06b6d4;flex-shrink:0;margin-top:1px">&#8226;</span>              <span style="color:#94a3b8">DNS query monitoring identified 3 new suspicious domains.</span>            </div>
          </div>
        </div>

        <div class="stats">
          <div class="stat"><div class="sv">4.2</div><div class="sl">Gbps Traffic</div></div>
          <div class="stat"><div class="sv" style="color:#ef4444">23</div><div class="sl">Blocked/min</div></div>
          <div class="stat"><div class="sv">156</div><div class="sl">IDS Alerts</div></div>
          <div class="stat"><div class="sv" style="color:#22c55e">99.2%</div><div class="sl">Uptime</div></div>
          <div class="stat"><div class="sv">87%</div><div class="sl">Encrypted</div></div>
        </div>
        <div class="tabs">
          <span class="tab ${this._tab === 'traffic' ? 'active' : ''}" @click=${() => { this._tab = 'traffic'; this.requestUpdate(); }}>Traffic</span>
          <span class="tab ${this._tab === 'firewall' ? 'active' : ''}" @click=${() => { this._tab = 'firewall'; this.requestUpdate(); }}>Firewall</span>
          <span class="tab ${this._tab === 'ids' ? 'active' : ''}" @click=${() => { this._tab = 'ids'; this.requestUpdate(); }}>IDS Alerts</span>
          <span class="tab ${this._tab === 'segmentation' ? 'active' : ''}" @click=${() => { this._tab = 'segmentation'; this.requestUpdate(); }}>Segmentation</span>
          <span class="tab ${this._tab === 'analysis' ? 'active' : ''}" @click=${() => { this._tab = 'analysis'; this.requestUpdate(); }}>Analysis</span>
          <span class="tab ${this._tab === 'audit' ? 'active' : ''}" @click=${() => { this._tab = 'audit'; this.requestUpdate(); }}>Audit</span>
          <span class="tab ${this._tab === 'config' ? 'active' : ''}" @click=${() => { this._tab = 'config'; this.requestUpdate(); }}>Config</span>
        </div>
        ${this._tab === 'traffic' ? this._renderTraffic() : ''}
        ${this._tab === 'firewall' ? this._renderFirewall() : ''}
        ${this._tab === 'ids' ? this._renderIds() : ''}
        ${this._tab === 'analysis' ? html`
          <div class="section">
            <div class="stitle">Network Security Scan</div>
            <div style="display:flex;gap:8px;margin-bottom:12px">
              <button class="action-btn primary" @click=${this._runNetworkScan} ?disabled=${this._execPhase === 'running'}>${this._execPhase === 'running' ? 'Scanning...' : 'Run Scan'}</button>
              ${this._execPhase === 'complete' ? html`<button class="action-btn" @click=${() => { this._execPhase = 'idle'; this._execResults = []; }}>Reset</button>` : nothing}
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
              <div style="background:#0f172a;border-radius:8px;padding:12px;margin-bottom:12px">
                <div style="font-size:11px;font-weight:600;color:#94a3b8;margin-bottom:8px">Scan Results</div>
                ${this._execResults.map(r => html`<div style="padding:6px 0;border-bottom:1px solid #1f2937"><div style="font-size:11px;font-weight:600;color:#06b6d4">${r.step}</div><div style="font-size:10px;color:#94a3b8;margin-top:2px">${r.output}</div></div>`)}
              </div>
            ` : nothing}
          </div>
          <div class="section">
            <div class="stitle">Network Topology</div>
            <div class="topology-svg"><svg viewBox="0 0 280 190" width="100%" height="190">${this._networkTopologySVG()}</svg></div>
          </div>
          <div class="section">
            <div class="stitle">Bandwidth Heatmap (7 Days)</div>
            ${this._bandwidthHeatmapSVG()}
          </div>
          <div class="section">
            <div class="stitle">Protocol Distribution</div>
            ${this._protocolDistributionSVG()}
          </div>
          <div class="section">
            <div class="stitle">Network Task SLA Timers</div>
            ${this._slaItems.map(item => {
              const pct = Math.min(100, (item.elapsed / item.total) * 100);
              const remaining = Math.max(0, item.total - item.elapsed);
              const hrs = Math.floor(remaining / 3600000);
              const mins = Math.floor((remaining % 3600000) / 60000);
              const color = pct > 100 ? '#ef4444' : pct > 80 ? '#f59e0b' : '#22c55e';
              return html`
                <div class="sla-timer">
                  <div style="width:8px;height:8px;border-radius:50%;background:${item.priority === 'critical' ? '#ef4444' : item.priority === 'high' ? '#f97316' : '#eab308'}"></div>
                  <div style="flex:1;min-width:0"><div style="font-size:11px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.task}</div><div style="font-size:9px;color:#6b7280">${item.assignee}</div></div>
                  <div style="width:100px;flex-shrink:0"><div class="sla-bar"><div class="sla-fill" style="width:${Math.min(pct, 100)}%;background:${color}"></div></div></div>
                  <div class="sla-label" style="color:${color}">${pct > 100 ? 'OVERDUE' : hrs + 'h' + mins + 'm'}</div>
                </div>`;
            })}
          </div>
        ` : ''}

        ${this._tab === 'audit' ? html`
          <div class="section">
            <div class="stitle">Network Audit Log (${this._auditLog.length})</div>
            ${this._auditLog.map(entry => html`
              <div class="audit-entry">
                <div class="audit-time">${new Date(entry.timestamp).toLocaleString()}</div>
                <div class="audit-action">${entry.action}</div>
                <div class="audit-detail">${entry.user}: ${entry.detail}</div>
              </div>
            `)}
          </div>
        ` : ''}

        ${this._tab === 'config' ? html`
          <div class="section">
            <div class="stitle">Network Security Configuration</div>
            ${Object.entries(this._configSettings).map(([key, val]) => {
              const labels: Record<string, { label: string; desc: string }> = {
                autoBlock: { label: 'Auto-Block', desc: 'Automatically block confirmed malicious IPs' },
                idsAlerts: { label: 'IDS Alerts', desc: 'Enable real-time IDS alert notifications' },
                trafficEncrypt: { label: 'Traffic Encryption', desc: 'Enforce TLS inspection on all traffic' },
                geoBlock: { label: 'Geo-Blocking', desc: 'Block traffic from sanctioned countries' },
                pcapCapture: { label: 'PCAP Capture', desc: 'Auto-capture packets on suspicious flows' },
                slaAlerts: { label: 'SLA Alerts', desc: 'Alert when response SLA is at risk' },
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
            <div class="form-group"><label class="form-label">Firewall Management URL</label><input class="form-input" type="text" value="https://firewall.internal:8443" readonly></div>
            <div class="form-group"><label class="form-label">IDS Platform</label><input class="form-input" type="text" value="Suricata 7.0" readonly></div>
            <div style="display:flex;gap:8px"><button class="action-btn primary" @click=${() => this._addAudit('CONFIG_SAVE', 'You', 'Saved network config')}>Save</button><button class="action-btn">Test Connectivity</button></div>
          </div>
        ` : ''}

        ${this._tab === 'segmentation' ? this._renderSegmentation() : ''}
      </div>
    `;
  }

  // === SCENARIO SIMULATION ENGINE ===
  @state() private _netScenarios: {id:string;name:string;attackType:string;target:string;method:string;impactLow:number;impactHigh:number;confidence:number;mitigation:string;status:string}[] = [];
  @state() private _netScenarioForm: {attackType:string;target:string;method:string} = {attackType:'',target:'',method:''};
  @state() private _netScenarioCompare: boolean = false;
  @state() private _netScenarioSelected: string[] = [];

  private _netInitScenarios(): void {
    const saved = localStorage.getItem('net_scenarios');
    if (saved) { try { this._netScenarios = JSON.parse(saved); } catch { /* ignore */ } }
    if (this._netScenarios.length === 0) {
      this._netScenarios = [
        {id:'net-s1',name:'Baseline Threat',attackType:'Phishing',target:'Employees',method:'Spear Email',impactLow:45,impactHigh:78,confidence:72,mitigation:'Security awareness training + email filtering',status:'active'},
        {id:'net-s2',name:'Escalated Attack',attackType:'Ransomware',target:'Endpoints',method:'Drive-by Download',impactLow:65,impactHigh:95,confidence:58,mitigation:'EDR deployment + network segmentation',status:'saved'},
        {id:'net-s3',name:'Insider Threat',attackType:'Data Exfiltration',target:'Databases',method:'SQL Injection',impactLow:55,impactHigh:88,confidence:65,mitigation:'DLP policies + query monitoring',status:'draft'},
      ];
    }
  }

  private _netSaveScenarios(): void {
    localStorage.setItem('net_scenarios', JSON.stringify(this._netScenarios));
  }

  private _netAddScenario(): void {
    const f = this._netScenarioForm;
    if (!f.attackType || !f.target) return;
    this._netScenarios = [...this._netScenarios, {
      id: 'net-s' + (this._netScenarios.length + 1),
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
    this._netScenarioForm = {attackType:'',target:'',method:''};
    this._netSaveScenarios();
  }

  private _netRenderScenarioEngine(): any {
    const attackTypes = ['Phishing','Ransomware','DDoS','SQL Injection','XSS','Privilege Escalation','Supply Chain','Zero-Day'];
    const targets = ['Employees','Endpoints','Servers','Databases','Network','Cloud','APIs','Mobile'];
    const methods = ['Spear Email','Drive-by Download','Brute Force','Social Engineering','Exploit Kit','Watering Hole','Malware','Misconfiguration'];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">Scenario Simulation Engine</span>
          <button class="tab" @click=${() => { this._netScenarioCompare = !this._netScenarioCompare; }}>${this._netScenarioCompare ? 'List View' : 'Compare'}</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px">
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._netScenarioForm = {...this._netScenarioForm, attackType: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Attack Type</option>
            ${attackTypes.map(a => html`<option value=${a} ${this._netScenarioForm.attackType === a ? 'selected' : ''}>${a}</option>`)}
          </select>
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._netScenarioForm = {...this._netScenarioForm, target: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Target</option>
            ${targets.map(t => html`<option value=${t} ${this._netScenarioForm.target === t ? 'selected' : ''}>${t}</option>`)}
          </select>
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._netScenarioForm = {...this._netScenarioForm, method: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Method</option>
            ${methods.map(m => html`<option value=${m} ${this._netScenarioForm.method === m ? 'selected' : ''}>${m}</option>`)}
          </select>
        </div>
        <button style="background:#3b82f6;border:none;border-radius:4px;padding:4px 12px;color:#fff;font-size:11px;cursor:pointer" @click=${this._netAddScenario}>Run Simulation</button>
      </div>
      ${this._netScenarioCompare && this._netScenarios.length >= 2 ? html`
        <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
          <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:8px">Side-by-Side Comparison</div>
          <div style="display:grid;grid-template-columns:repeat(${Math.min(3, this._netScenarios.length)},1fr);gap:8px">
            ${this._netScenarios.slice(0,3).map(s => html`
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
        <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:8px">Saved Scenarios (${this._netScenarios.length})</div>
        ${this._netScenarios.map(s => html`
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
  @state() private _netTrendData: {day:number;value:number;anomaly:boolean}[] = [];
  @state() private _netTrendZoom: {start:number;end:number} | null = null;
  @state() private _netTrendMA: number = 7;

  private _netInitTrendData(): void {
    const data: {day:number;value:number;anomaly:boolean}[] = [];
    let base = 50 + Math.random() * 30;
    for (let i = 0; i < 90; i++) {
      base += (Math.random() - 0.48) * 8;
      base = Math.max(10, Math.min(100, base));
      const anomaly = Math.random() < 0.05;
      data.push({ day: i, value: anomaly ? base + (Math.random() > 0.5 ? 25 : -20) : base, anomaly });
    }
    this._netTrendData = data;
  }

  private _netCalcMA(window: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < this._netTrendData.length; i++) {
      const start = Math.max(0, i - window + 1);
      const slice = this._netTrendData.slice(start, i + 1);
      result.push(slice.reduce((s, d) => s + d.value, 0) / slice.length);
    }
    return result;
  }

  private _netGetStats(): {mean:number;median:number;stddev:number;trend:string} {
    const vals = this._netTrendData.map(d => d.value);
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

  private _netRenderTimeSeries(): any {
    const stats = this._netGetStats();
    const filtered = this._netTrendZoom ? this._netTrendData.filter(d => d.day >= this._netTrendZoom.start && d.day <= this._netTrendZoom.end) : this._netTrendData;
    const maxVal = Math.max(...filtered.map(d => d.value));
    const minVal = Math.min(...filtered.map(d => d.value));
    const range = maxVal - minVal || 1;
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">90-Day Trend Analysis</span>
          <div style="display:flex;gap:4px">
            <button class="tab ${this._netTrendMA === 7 ? 'active' : ''}" @click=${() => { this._netTrendMA = 7; }}>7D MA</button>
            <button class="tab ${this._netTrendMA === 30 ? 'active' : ''}" @click=${() => { this._netTrendMA = 30; }}>30D MA</button>
            <button class="tab" @click=${() => { this._netTrendZoom = null; }}>Reset Zoom</button>
          </div>
        </div>
        <div style="position:relative;height:120px;background:#1a1d2e;border-radius:6px;overflow:hidden;margin-bottom:8px;cursor:crosshair" @click=${(e: any) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const x = e.clientX - rect.left;
          const ratio = x / rect.width;
          const center = Math.floor(ratio * 90);
          this._netTrendZoom = { start: Math.max(0, center - 10), end: Math.min(89, center + 10) };
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
  @state() private _netRoles: string[] = ['Admin','Analyst','Operator','Viewer','Auditor'];
  @state() private _netActions: string[] = ['Create','Read','Update','Delete','Export','Approve'];
  @state() private _netPermissions: { [role: string]: { [action: string]: boolean } } = {};
  @state() private _netPermAudit: {role:string;action:string;changedBy:string;timestamp:string;oldVal:boolean;newVal:boolean}[] = [];
  @state() private _netPermCompare: string[] = [];

  private _netInitPermissions(): void {
    const perms: Record<string, Record<string, boolean>> = {};
    const defaults: Record<string, boolean[]> = {
      Admin: [true,true,true,true,true,true],
      Analyst: [true,true,true,false,true,false],
      Operator: [true,true,true,false,false,false],
      Viewer: [false,true,false,false,false,false],
      Auditor: [false,true,false,false,true,false],
    };
    for (const role of this._netRoles) {
      perms[role] = {};
      this._netActions.forEach((a, i) => { perms[role][a] = defaults[role]?.[i] ?? false; });
    }
    this._netPermissions = perms;
  }

  private _netTogglePermission(role: string, action: string): void {
    const old = this._netPermissions[role][action];
    this._netPermissions = {...this._netPermissions, [role]: {...this._netPermissions[role], [action]: !old}};
    this._netPermAudit.unshift({role,action,changedBy:'current_user',timestamp:new Date().toISOString(),oldVal:old,newVal:!old});
  }

  private _netRenderRBAC(): any {
    const compareRoles = this._netPermCompare.map(r => this._netPermissions[r]).filter(Boolean);
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">RBAC Permission Matrix</span>
          <div style="display:flex;gap:4px">
            ${this._netRoles.map(r => html`
              <button class="tab ${this._netPermCompare.includes(r) ? 'active' : ''}" @click=${() => {
                this._netPermCompare = this._netPermCompare.includes(r) ? this._netPermCompare.filter(x => x !== r) : [...this._netPermCompare, r];
              }}>${r}</button>
            `)}
          </div>
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:10px">
            <thead>
              <tr>
                <th style="text-align:left;padding:6px;color:#6b7280;border-bottom:1px solid #2a2d3a">Role \ Action</th>
                ${this._netActions.map(a => html`<th style="padding:6px;color:#6b7280;border-bottom:1px solid #2a2d3a;text-align:center">${a}</th>`)}
              </tr>
            </thead>
            <tbody>
              ${this._netRoles.map(role => html`
                <tr style="border-bottom:1px solid #1a1d2e">
                  <td style="padding:6px;color:#e2e8f0;font-weight:600">${role}</td>
                  ${this._netActions.map(action => html`
                    <td style="text-align:center;padding:6px">
                      <button style="width:28px;height:20px;border-radius:3px;border:1px solid #2a2d3a;background:${this._netPermissions[role][action] ? '#22c55e' : '#1a1d2e'};cursor:pointer;color:#fff;font-size:10px" @click=${() => this._netTogglePermission(role, action)}>${this._netPermissions[role][action] ? 'Y' : 'N'}</button>
                    </td>
                  `)}
                </tr>
              `)}
            </tbody>
          </table>
        </div>
        ${compareRoles.length >= 2 ? html`
          <div style="margin-top:10px;padding:8px;background:#1a1d2e;border-radius:6px">
            <div style="font-size:11px;font-weight:600;color:#e2e8f0;margin-bottom:6px">Role Diff: ${this._netPermCompare.join(' vs ')}</div>
            ${this._netActions.map(action => {
              const vals = compareRoles.map(r => r[action]);
              const allSame = vals.every(v => v === vals[0]);
              return allSame ? nothing : html`
                <div style="display:flex;gap:8px;padding:3px 0;font-size:10px">
                  <span style="color:#6b7280;width:60px">${action}:</span>
                  ${compareRoles.map((r, i) => html`<span style="color:${r[action] ? '#22c55e' : '#ef4444'}">${this._netPermCompare[i]}=${r[action] ? 'Y' : 'N'}</span>`)}
                </div>
              `;
            })}
          </div>
        ` : nothing}
        ${this._netPermAudit.length > 0 ? html`
          <div style="margin-top:8px;font-size:9px;color:#6b7280">Recent: ${this._netPermAudit.slice(0,3).map(a => html`<span style="margin-right:8px">${a.role}.${a.action}: ${a.oldVal ? 'Y' : 'N'}->${a.newVal ? 'Y' : 'N'}</span>`)}
        ` : nothing}
      </div>
    `;
  }

  // === REPORTING SUITE ===
  @state() private _netReportTemplate: string = 'executive';
  @state() private _netReportSchedule: string = 'weekly';
  @state() private _netReportDistList: string[] = ['security-team@company.com','ciso@company.com'];
  @state() private _netReportHistory: {id:string;template:string;generatedAt:string;status:string}[] = [];

  private _netGenerateReport(): void {
    const id = 'rpt-' + Date.now();
    this._netReportHistory.unshift({id,template:this._netReportTemplate,generatedAt:new Date().toISOString(),status:'sent'});
  }

  private _netRenderReporting(): any {
    const templates = [{key:'executive',label:'Executive Summary',desc:'High-level overview for leadership'},{key:'technical',label:'Technical Report',desc:'Detailed findings for engineers'},{key:'compliance',label:'Compliance Audit',desc:'Regulatory compliance evidence'}];
    const schedules = [{key:'daily',label:'Daily'},{key:'weekly',label:'Weekly'},{key:'monthly',label:'Monthly'}];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="font-weight:700;font-size:13px;color:#e2e8f0;margin-bottom:8px">Report Generator</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Template</div>
            ${templates.map(t => html`
              <div style="padding:6px;background:${this._netReportTemplate === t.key ? '#1e3a5f' : '#1a1d2e'};border:1px solid ${this._netReportTemplate === t.key ? '#3b82f6' : '#2a2d3a'};border-radius:4px;margin-bottom:4px;cursor:pointer" @click=${() => { this._netReportTemplate = t.key; }}>
                <div style="font-size:11px;color:#e2e8f0">${t.label}</div>
                <div style="font-size:9px;color:#6b7280">${t.desc}</div>
              </div>
            `)}
          </div>
          <div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Schedule</div>
            <div style="display:flex;gap:4px;margin-bottom:8px">
              ${schedules.map(s => html`<button class="tab ${this._netReportSchedule === s.key ? 'active' : ''}" @click=${() => { this._netReportSchedule = s.key; }}>${s.label}</button>`)}
            </div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Distribution</div>
            <div style="font-size:10px;color:#9ca3af">${this._netReportDistList.map(d => html`<div>${d}</div>`)}</div>
            <div style="margin-top:6px;display:flex;gap:4px">
              <button style="background:#3b82f6;border:none;border-radius:4px;padding:4px 10px;color:#fff;font-size:10px;cursor:pointer" @click=${this._netGenerateReport}>Generate</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">PDF</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">CSV</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">JSON</button>
            </div>
          </div>
        </div>
        ${this._netReportHistory.length > 0 ? html`
          <div style="border-top:1px solid #2a2d3a;padding-top:8px">
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Recent Reports</div>
            ${this._netReportHistory.slice(0,3).map(r => html`
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
  @state() private _netHighContrast: boolean = false;
  @state() private _netA11yAnnounce: string = '';
  @state() private _netShortcutsVisible: boolean = false;
  @state() private _netFocusTrap: boolean = false;

  private _netShortcuts: Record<string, string> = {
    'Escape': 'Close dialogs / Cancel',
    'Ctrl+Shift+S': 'Toggle scenario simulation',
    'Ctrl+Shift+T': 'Toggle time-series view',
    'Ctrl+Shift+R': 'Open report generator',
    'Ctrl+Shift+A': 'Toggle accessibility panel',
    'Ctrl+Shift+H': 'Toggle high contrast',
    'Tab': 'Navigate between sections',
    'Enter/Space': 'Activate focused button',
  };

  private _netHandleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this._netFocusTrap) { this._netFocusTrap = false; this._netAnnounce('Dialog closed'); }
    if (e.ctrlKey && e.shiftKey && e.key === 'H') { e.preventDefault(); this._netHighContrast = !this._netHighContrast; this._netAnnounce('High contrast ' + (this._netHighContrast ? 'enabled' : 'disabled')); }
    if (e.ctrlKey && e.shiftKey && e.key === 'A') { e.preventDefault(); this._netShortcutsVisible = !this._netShortcutsVisible; }
  }

  private _netAnnounce(msg: string): void {
    this._netA11yAnnounce = msg;
    setTimeout(() => { this._netA11yAnnounce = ''; }, 2000);
  }

  private _netRenderAccessibility(): any {
    return html`
      <div role="region" aria-label="Accessibility Controls" style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0" role="heading" aria-level="3">Accessibility</span>
          <button class="tab ${this._netShortcutsVisible ? 'active' : ''}" @click=${() => { this._netShortcutsVisible = !this._netShortcutsVisible; }} aria-expanded=${this._netShortcutsVisible}>Shortcuts</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:#e2e8f0;cursor:pointer">
            <input type="checkbox" .checked=${this._netHighContrast} @change=${() => { this._netHighContrast = !this._netHighContrast; }} aria-label="Toggle high contrast mode">
            High Contrast
          </label>
        </div>
        ${this._netShortcutsVisible ? html`
          <div role="list" aria-label="Keyboard shortcuts" style="background:#1a1d2e;border-radius:6px;padding:8px">
            ${Object.entries(this._netShortcuts).map(([key, desc]) => html`
              <div role="listitem" style="display:flex;justify-content:space-between;padding:3px 0;font-size:10px">
                <kbd style="background:#2a2d3a;padding:1px 6px;border-radius:3px;color:#60a5fa;font-family:monospace">${key}</kbd>
                <span style="color:#9ca3af">${desc}</span>
              </div>
            `)}
          </div>
        ` : nothing}
        <div role="status" aria-live="polite" aria-atomic="true" style="position:absolute;left:-9999px">${this._netA11yAnnounce}</div>
      </div>
    `;
  }


  // === TAB INTEGRATION FOR EXTENDED FEATURES ===
  @state() private _netActiveSubTab: string = 'scenario';

  private _netGetAllSubTabs(): {key:string;label:string}[] {
    return [
      {key:'scenario', label:'Simulation'},
      {key:'timeseries', label:'Trends'},
      {key:'rbac', label:'Access Control'},
      {key:'reporting', label:'Reports'},
      {key:'a11y', label:'Accessibility'},
    ];
  }

  private _netRenderSubPanel(): any {
    switch (this._netActiveSubTab) {
      case 'scenario': return this._netRenderScenarioEngine();
      case 'timeseries': return this._netRenderTimeSeries();
      case 'rbac': return this._netRenderRBAC();
      case 'reporting': return this._netRenderReporting();
      case 'a11y': return this._netRenderAccessibility();
      default: return nothing;
    }
  }

  private _netRenderTabBar(): any {
    return html`
      <div style="display:flex;gap:4px;margin-bottom:12px;border-bottom:1px solid #2a2d3a;padding-bottom:8px;flex-wrap:wrap" role="tablist" aria-label="Extended panel features">
        ${this._netGetAllSubTabs().map(t => html`
          <button class="tab ${this._netActiveSubTab === t.key ? 'active' : ''}" @click=${() => { this._netActiveSubTab = t.key; }} role="tab" aria-selected=${this._netActiveSubTab === t.key}>${t.label}</button>
        `)}
      </div>
      <div role="tabpanel" aria-labelledby="net-tab-${this._netActiveSubTab}">
        ${this._netRenderSubPanel()}
      </div>
    `;
  }

  }
declare global { interface HTMLElementTagNameMap { 'sc-network-security-monitor': ScNetworkSecurityMonitor; } 
  // === SECTION A: Multi-Phase Pipeline Execution Engine ===
  private _pipelinePhases: { id: string; name: string; status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled-back'; progress: number; duration: number; errors: string[]; rollbackSteps: string[] }[] = [
    { id: 'ph-1', name: 'Capture Traffic', status: 'completed', progress: 100, duration: 30, errors: [], rollbackSteps: ['Reset capture traffic state'] },
    { id: 'ph-2', name: 'Protocol Analysis', status: 'completed', progress: 100, duration: 45, errors: [], rollbackSteps: ['Reset protocol analysis state'] },
    { id: 'ph-3', name: 'Anomaly Detection', status: 'running', progress: 67, duration: 90, errors: [], rollbackSteps: ['Reset anomaly detection state'] },
    { id: 'ph-4', name: 'Threat Correlation', status: 'pending', progress: 0, duration: 0, errors: [], rollbackSteps: ['Reset threat correlation state'] },
    { id: 'ph-5', name: 'Alert Generation', status: 'pending', progress: 0, duration: 0, errors: [], rollbackSteps: ['Reset alert generation state'] },
    { id: 'ph-6', name: 'Report Compilation', status: 'pending', progress: 0, duration: 0, errors: [], rollbackSteps: ['Reset report compilation state'] },
  ];

  private _pipelineJobQueue: { id: string; name: string; priority: number; status: 'queued' | 'processing' | 'done'; phaseId: string; submittedAt: number; startedAt: number }[] = [
    { id: 'job-001', name: 'Monitor DMZ bandwidth', priority: 1, status: 'done', phaseId: 'ph-1', submittedAt: Date.now() - 300000, startedAt: Date.now() - 280000 },
    { id: 'job-002', name: 'Analyze DNS queries', priority: 2, status: 'done', phaseId: 'ph-2', submittedAt: Date.now() - 250000, startedAt: Date.now() - 230000 },
    { id: 'job-003', name: 'Detect port scans', priority: 3, status: 'processing', phaseId: 'ph-3', submittedAt: Date.now() - 200000, startedAt: 0 },
    { id: 'job-004', name: 'Correlate IDS alerts', priority: 2, status: 'queued', phaseId: 'ph-4', submittedAt: Date.now() - 150000, startedAt: 0 },
    { id: 'job-005', name: 'Generate traffic report', priority: 4, status: 'queued', phaseId: 'ph-5', submittedAt: Date.now() - 100000, startedAt: 0 },
  ];

  private _errorCategories: { category: string; icon: string; count: number; autoRemediation: string }[] = [
    { category: 'Bandwidth Anomaly', icon: 'net', count: 4, autoRemediation: 'Auto-adjust threshold and re-baseline' },
    { category: 'Protocol Violation', icon: 'proto', count: 7, autoRemediation: 'Block non-compliant traffic patterns' },
    { category: 'DNS Tunneling Suspect', icon: 'dns', count: 3, autoRemediation: 'Enable deep DNS inspection rules' },
    { category: 'Port Scan Detected', icon: 'scan', count: 12, autoRemediation: 'Apply rate limiting and alert SOC' },
    { category: 'TLS Version Mismatch', icon: 'tls', count: 5, autoRemediation: 'Enforce TLS 1.2+ minimum policy' },
    { category: 'Unexpected Outbound', icon: 'out', count: 8, autoRemediation: 'Quarantine source and investigate' },
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
    { id: 'NSM-001', case: 'DMZ', finding: 'Unusual DNS query volume from web server', severity: 'high', riskScore: 78, trend: [60,65,70,72,74,76,78], status: 'investigating', assignee: 'K. Roy' },
    { id: 'NSM-002', case: 'Internal', finding: 'SSH brute force from 10.0.1.45', severity: 'critical', riskScore: 95, trend: [80,82,85,88,90,92,95], status: 'escalated', assignee: 'P. Singh' },
    { id: 'NSM-003', case: 'Cloud', finding: 'Cross-VPC traffic to unknown CIDR', severity: 'high', riskScore: 82, trend: [70,72,74,76,78,80,82], status: 'open', assignee: 'M. Garcia' },
    { id: 'NSM-004', case: 'DMZ', finding: 'HTTP traffic on non-standard port 8443', severity: 'medium', riskScore: 55, trend: [40,42,44,48,50,52,55], status: 'mitigated', assignee: 'J. Lee' },
    { id: 'NSM-005', case: 'Internal', finding: 'Large data exfil pattern detected', severity: 'critical', riskScore: 91, trend: [75,78,82,85,87,89,91], status: 'open', assignee: 'A. Chen' },
    { id: 'NSM-006', case: 'Cloud', finding: 'API gateway rate limit breach attempt', severity: 'medium', riskScore: 62, trend: [50,52,54,56,58,60,62], status: 'in-progress', assignee: 'R. Smith' },
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
          <span style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase">Network Security Monitoring Findings Grid</span>
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
    { name: 'NDR Platform Deployment', investment: 180000, annualSavings: 145000, riskReduction: 38, paybackMonths: 15, npv: 380000 },
    { name: 'Network Segmentation Upgrade', investment: 320000, annualSavings: 220000, riskReduction: 52, paybackMonths: 18, npv: 510000 },
    { name: 'DNS Security Layer', investment: 45000, annualSavings: 38000, riskReduction: 15, paybackMonths: 15, npv: 95000 },
    { name: 'Traffic Encryption Everywhere', investment: 95000, annualSavings: 72000, riskReduction: 25, paybackMonths: 16, npv: 175000 },
  ];

  private _riskQuantMetrics: { metric: string; sle: number; aro: number; ale: number; mitigationCost: number; roi: number }[] = [
    { metric: 'Network Breach via Unmonitored Port', sle: 5200000, aro: 0.12, ale: 624000, mitigationCost: 180000, roi: 247 },
    { metric: 'Data Exfiltration via Covert Channel', sle: 3800000, aro: 0.2, ale: 760000, mitigationCost: 120000, roi: 533 },
    { metric: 'DDoS Service Disruption', sle: 900000, aro: 0.8, ale: 720000, mitigationCost: 65000, roi: 1008 },
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
    { name: 'Traffic Collector', url: '/api/v1/nsm/traffic', method: 'POST', headers: { 'Content-Type': 'application/json' }, lastStatus: 200, lastCalled: '30s ago' },
    { name: 'Alert Service', url: '/api/v1/nsm/alerts', method: 'GET', headers: { 'Content-Type': 'application/json' }, lastStatus: 200, lastCalled: '1m ago' },
    { name: 'Protocol Analyzer', url: '/api/v1/nsm/protocols', method: 'POST', headers: { 'Content-Type': 'application/json' }, lastStatus: 200, lastCalled: '2m ago' },
  ];

  private _webhookConfigs: { id: string; name: string; url: string; events: string[]; active: boolean; lastTriggered: string }[] = [
    { id: 'wh-1', name: 'Critical Alert Dispatch', url: 'https://hooks.slack.com/T00/B00/nsm1', events: ['critical_alert', 'breach_detected'], active: true, lastTriggered: '45m ago' },
    { id: 'wh-2', name: 'SIEM Forwarder', url: 'https://siem.internal/webhooks/nsm', events: ['all_alerts'], active: true, lastTriggered: '2m ago' },
    { id: 'wh-3', name: 'On-Call PagerDuty', url: 'https://events.pagerduty.com/integration/xxx', events: ['escalation'], active: true, lastTriggered: '3h ago' },
  ];

  private _dataSourceConnections: { name: string; type: string; status: 'connected' | 'disconnected' | 'error'; lastSync: string; records: number }[] = [
    { name: 'Core Network Switches', type: 'NetFlow', status: 'connected', lastSync: '30s ago', records: 2345670 },
    { name: 'Cloud VPC Flow Logs', type: 'AWS VPC', status: 'connected', lastSync: '1m ago', records: 1890340 },
    { name: 'DNS Query Logs', type: 'BIND', status: 'connected', lastSync: '2m ago', records: 567890 },
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
    { term: 'NDR', definition: 'Network Detection and Response - real-time monitoring for threats' },
    { term: 'NetFlow', definition: 'Cisco protocol for collecting IP traffic information' },
    { term: 'IDS', definition: 'Intrusion Detection System - monitors for suspicious activity' },
    { term: 'IPS', definition: 'Intrusion Prevention System - actively blocks detected threats' },
    { term: 'PCAP', definition: 'Packet Capture - raw network traffic data for analysis' },
    { term: 'MITM', definition: 'Man-in-the-Middle attack intercepting communications' },
    { term: 'Beaconing', definition: 'Periodic callback pattern from compromised hosts to C2' },
    { term: 'DNS Tunneling', definition: 'Covert data exfiltration using DNS protocol encoding' },
    { term: 'East-West Traffic', definition: 'Lateral communication between internal segments' },
    { term: 'Zero-Day', definition: 'Vulnerability unknown to vendor with no available patch' },
    { term: 'Kill Chain', definition: 'Framework describing stages of a cyber attack' },
    { term: 'False Positive', definition: 'Alert from legitimate activity incorrectly flagged' },
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
