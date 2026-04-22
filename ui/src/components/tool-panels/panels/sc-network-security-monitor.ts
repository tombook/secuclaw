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
}
declare global { interface HTMLElementTagNameMap { 'sc-network-security-monitor': ScNetworkSecurityMonitor; } }
