/**
 * sc-asset-inventory-mgmt — Asset Inventory Management (Enhanced)
 * Complete asset lifecycle with criticality, dependencies, EOL tracking,
 * compliance scanning, network topology visualization, and bulk operations.
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface Asset {
  id: string;
  name: string;
  type: 'server' | 'workstation' | 'network' | 'database' | 'application' | 'cloud';
  criticality: 'tier1' | 'tier2' | 'tier3' | 'tier4';
  owner: string;
  ip: string;
  status: 'active' | 'maintenance' | 'retired' | 'discovered';
  lastScan: string;
  vulnCount: number;
  eolDate: string | null;
  dependencies: string[];
  os: string;
  location: string;
  compliance: 'compliant' | 'partial' | 'non-compliant' | 'unknown';
  lastPatch: string;
  riskScore: number;
}

interface ScanHistory {
  date: string;
  newAssets: number;
  resolvedVulns: number;
  newVulns: number;
}

@customElement('sc-asset-inventory-mgmt')
export class ScAssetInventoryMgmt extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-bottom: 16px; }
    .stat { background: #1f2937; border-radius: 8px; padding: 10px; text-align: center; }
    .sv { font-size: 18px; font-weight: 700; }
    .sl { font-size: 9px; color: #94a3b8; margin-top: 2px; }
    .tabs { display: flex; gap: 4px; margin-bottom: 14px; flex-wrap: wrap; }
    .tab { padding: 6px 14px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; background: transparent; color: #94a3b8; border: 1px solid transparent; }
    .tab:hover { background: #374151; }
    .tab.active { background: #f59e0b; color: #111827; }
    .tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
    .tbl th { text-align: left; padding: 8px; background: #0f172a; color: #94a3b8; font-weight: 600; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #374151; }
    .tbl td { padding: 10px 8px; border-bottom: 1px solid #1f2937; }
    .tbl tr:hover td { background: #1f2937; }
    .badge { display: inline-block; font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
    .b-tier1 { background: #450a0a; color: #fca5a5; }
    .b-tier2 { background: #431407; color: #fdba74; }
    .b-tier3 { background: #422006; color: #fde047; }
    .b-tier4 { background: #052e16; color: #86efac; }
    .b-active { background: #052e16; color: #86efac; }
    .b-maintenance { background: #422006; color: #fde047; }
    .b-retired { background: #1f2937; color: #6b7280; }
    .b-discovered { background: #172554; color: #93c5fd; }
    .b-compliant { background: #052e16; color: #86efac; }
    .b-partial { background: #422006; color: #fde047; }
    .b-non-compliant { background: #450a0a; color: #fca5a5; }
    .b-unknown { background: #1f2937; color: #6b7280; }
    .sb { padding: 8px 12px; border-radius: 6px; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; font-size: 12px; width: 100%; margin-bottom: 12px; outline: none; }
    .sb:focus { border-color: #f59e0b; }
    .eol-warning { color: #ef4444; font-size: 10px; }
    .eol-soon { color: #f97316; font-size: 10px; }
    .filter-row { display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap; }
    .filter-chip { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; cursor: pointer; background: #374151; color: #94a3b8; border: 1px solid transparent; }
    .filter-chip.active { background: #f59e0b; color: #111827; }
    .dep-tag { font-size: 9px; background: #172554; color: #93c5fd; padding: 2px 6px; border-radius: 3px; margin: 1px; display: inline-block; }
    .section { background: #1f2937; border-radius: 8px; padding: 14px; margin-bottom: 12px; }
    .stitle { font-weight: 600; font-size: 12px; margin-bottom: 10px; color: #94a3b8; }
    .risk-bar { width: 50px; height: 6px; background: #374151; border-radius: 3px; display: inline-block; vertical-align: middle; }
    .action-btn { padding: 5px 10px; border-radius: 4px; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; font-size: 10px; font-weight: 600; cursor: pointer; margin-right: 4px; }
    .action-btn:hover { border-color: #f59e0b; background: #f59e0b20; }
    .action-btn.primary { background: #f59e0b; color: #111827; border-color: #f59e0b; }
    .action-btn.primary:hover { background: #d97706; }
    .checkbox { width: 14px; height: 14px; accent-color: #f59e0b; cursor: pointer; }
    .bulk-bar { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: #0f172a; border-radius: 8px; margin-bottom: 12px; }
    .bulk-count { font-size: 12px; font-weight: 600; color: #f59e0b; }
    .detail-panel { background: #0f172a; border: 1px solid #374151; border-radius: 10px; padding: 16px; margin-bottom: 14px; }
    .detail-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 12px; }
    .dm { background: #1f2937; border-radius: 6px; padding: 10px; }
    .dm-label { font-size: 10px; color: #6b7280; margin-bottom: 4px; }
    .dm-value { font-size: 13px; font-weight: 700; }
    .topo-svg { background: #0f172a; border-radius: 8px; padding: 12px; }
    .scan-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #374151; font-size: 12px; }
    .scan-row:last-child { border-bottom: none; }
    .sparkline { display: inline-block; vertical-align: middle; }
    .export-btn { padding: 6px 14px; border-radius: 6px; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; font-size: 11px; font-weight: 600; cursor: pointer; }
    .export-btn:hover { border-color: #3b82f6; background: #3b82f620; }
    @media (max-width: 768px) {
      .stats { grid-template-columns: repeat(3, 1fr); }
      .detail-grid { grid-template-columns: repeat(2, 1fr); }
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

  @state() private _tab: 'all' | 'critical' | 'eol' | 'unmanaged' | 'topology' | 'scans' = 'all';
  @state() private _typeFilter = 'all';
  @state() private _search = '';
  @state() private _selected: Asset | null = null;
  @state() private _selectedIds = new Set<string>();

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


  private _assets: Asset[] = [
    { id: 'a1', name: 'web-prod-01.acme.com', type: 'server', criticality: 'tier1', owner: 'Platform Team', ip: '10.0.1.10', status: 'active', lastScan: '2h ago', vulnCount: 2, eolDate: null, dependencies: ['db-master-01', 'cache-01'], os: 'Ubuntu 22.04 LTS', location: 'US-East-1a', compliance: 'compliant', lastPatch: '2026-04-20', riskScore: 35 },
    { id: 'a2', name: 'db-master-01.acme.com', type: 'database', criticality: 'tier1', owner: 'DBA Team', ip: '10.0.2.5', status: 'active', lastScan: '1h ago', vulnCount: 1, eolDate: null, dependencies: ['storage-array-01'], os: 'RHEL 9.2', location: 'US-East-1b', compliance: 'compliant', lastPatch: '2026-04-19', riskScore: 28 },
    { id: 'a3', name: 'nginx-lb-02.acme.com', type: 'network', criticality: 'tier2', owner: 'Infra Team', ip: '10.0.1.2', status: 'active', lastScan: '3h ago', vulnCount: 0, eolDate: null, dependencies: ['web-prod-01'], os: 'Alpine Linux 3.19', location: 'US-East-1a', compliance: 'compliant', lastPatch: '2026-04-21', riskScore: 15 },
    { id: 'a4', name: 'k8s-node-03', type: 'cloud', criticality: 'tier1', owner: 'DevOps', ip: '10.0.3.15', status: 'active', lastScan: '30m ago', vulnCount: 0, eolDate: null, dependencies: [], os: 'Flatcar Container Linux', location: 'US-West-2a', compliance: 'compliant', lastPatch: '2026-04-21', riskScore: 12 },
    { id: 'a5', name: 'legacy-app-01', type: 'application', criticality: 'tier3', owner: 'App Team', ip: '10.0.5.20', status: 'maintenance', lastScan: '1d ago', vulnCount: 5, eolDate: '2026-06-30', dependencies: ['db-master-01'], os: 'Windows Server 2016', location: 'US-East-1c', compliance: 'non-compliant', lastPatch: '2026-03-01', riskScore: 78 },
    { id: 'a6', name: 'fin-server-01', type: 'server', criticality: 'tier1', owner: 'Finance IT', ip: '10.0.10.5', status: 'active', lastScan: '4h ago', vulnCount: 0, eolDate: null, dependencies: [], os: 'RHEL 8.8', location: 'US-East-1a', compliance: 'compliant', lastPatch: '2026-04-20', riskScore: 10 },
    { id: 'a7', name: 'workstation-pool-42', type: 'workstation', criticality: 'tier4', owner: 'IT Ops', ip: 'DHCP', status: 'active', lastScan: '6h ago', vulnCount: 1, eolDate: null, dependencies: [], os: 'macOS Sonoma 14.4', location: 'HQ-Building-A', compliance: 'partial', lastPatch: '2026-04-18', riskScore: 22 },
    { id: 'a8', name: 'old-database-vendor', type: 'database', criticality: 'tier2', owner: 'DBA Team', ip: '10.0.2.10', status: 'maintenance', lastScan: '7d ago', vulnCount: 8, eolDate: '2026-05-15', dependencies: ['web-prod-01'], os: 'Oracle Linux 7', location: 'US-East-1b', compliance: 'non-compliant', lastPatch: '2026-01-15', riskScore: 85 },
    { id: 'a9', name: 'unmanaged-switch-05', type: 'network', criticality: 'tier3', owner: 'Unknown', ip: '10.0.15.5', status: 'discovered', lastScan: 'Never', vulnCount: 0, eolDate: null, dependencies: [], os: 'Unknown', location: 'HQ-Building-B', compliance: 'unknown', lastPatch: 'Never', riskScore: 55 },
    { id: 'a10', name: 'retired-web-01', type: 'server', criticality: 'tier4', owner: 'Archive', ip: '10.0.1.100', status: 'retired', lastScan: '30d ago', vulnCount: 3, eolDate: '2025-12-31', dependencies: [], os: 'CentOS 7 (EOL)', location: 'DR-Site', compliance: 'non-compliant', lastPatch: '2025-06-01', riskScore: 90 },
    { id: 'a11', name: 'api-gateway-prod', type: 'application', criticality: 'tier1', owner: 'Platform Team', ip: '10.0.1.50', status: 'active', lastScan: '1h ago', vulnCount: 0, eolDate: null, dependencies: ['k8s-node-03', 'db-master-01'], os: 'Container (distroless)', location: 'US-East-1a', compliance: 'compliant', lastPatch: '2026-04-21', riskScore: 8 },
    { id: 'a12', name: 'vpn-concentrator', type: 'network', criticality: 'tier1', owner: 'Security Team', ip: '10.0.0.1', status: 'active', lastScan: '2h ago', vulnCount: 1, eolDate: null, dependencies: [], os: 'PaloAlto PAN-OS 11.1', location: 'US-East-1a', compliance: 'partial', lastPatch: '2026-04-15', riskScore: 40 },
  ];

  private _scanHistory: ScanHistory[] = [
    { date: '2026-04-21', newAssets: 1, resolvedVulns: 5, newVulns: 2 },
    { date: '2026-04-20', newAssets: 0, resolvedVulns: 8, newVulns: 1 },
    { date: '2026-04-19', newAssets: 2, resolvedVulns: 3, newVulns: 4 },
    { date: '2026-04-18', newAssets: 1, resolvedVulns: 6, newVulns: 0 },
    { date: '2026-04-17', newAssets: 0, resolvedVulns: 10, newVulns: 3 },
    { date: '2026-04-16', newAssets: 3, resolvedVulns: 4, newVulns: 2 },
    { date: '2026-04-15', newAssets: 0, resolvedVulns: 7, newVulns: 1 },
  ];

  private _getCriticalityColor(tier: string): string {
    const m: Record<string, string> = { tier1: '#ef4444', tier2: '#f97316', tier3: '#eab308', tier4: '#22c55e' };
    return m[tier] ?? '#94a3b8';
  }

  private _getRiskColor(score: number): string {
    if (score >= 80) return '#ef4444';
    if (score >= 50) return '#f97316';
    if (score >= 30) return '#eab308';
    return '#22c55e';
  }

  private _getFilteredAssets(): Asset[] {
    let filtered = this._assets;
    if (this._tab === 'critical') filtered = filtered.filter(a => a.criticality === 'tier1');
    else if (this._tab === 'eol') filtered = filtered.filter(a => a.eolDate && new Date(a.eolDate) < new Date('2026-07-01'));
    else if (this._tab === 'unmanaged') filtered = filtered.filter(a => a.status === 'discovered');
    if (this._typeFilter !== 'all') filtered = filtered.filter(a => a.type === this._typeFilter);
    const q = this._search.toLowerCase();
    if (q) filtered = filtered.filter(a => a.name.toLowerCase().includes(q) || a.ip.includes(q) || a.owner.toLowerCase().includes(q));
    return filtered;
  }

  private _toggleSelect(id: string) {
    const s = new Set(this._selectedIds);
    if (s.has(id)) s.delete(id); else s.add(id);
    this._selectedIds = s;
  }

  private _toggleSelectAll() {
    const filtered = this._getFilteredAssets();
    if (this._selectedIds.size === filtered.length) {
      this._selectedIds = new Set();
    } else {
      this._selectedIds = new Set(filtered.map(a => a.id));
    }
  }

  private _exportCSV() {
    const filtered = this._getFilteredAssets();
    const header = 'Name,Type,Criticality,Owner,IP,Status,Vulns,EOL,Compliance,Risk';
    const rows = filtered.map(a => `"${a.name}","${a.type}","${a.criticality}","${a.owner}","${a.ip}","${a.status}",${a.vulnCount},"${a.eolDate || 'N/A'}","${a.compliance}",${a.riskScore}`);
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'asset-inventory-export.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  private _renderAssetRow(asset: Asset) {
    const isEol = asset.eolDate && new Date(asset.eolDate) < new Date();
    const isEolSoon = asset.eolDate && !isEol && new Date(asset.eolDate) < new Date('2026-07-01');
    const isSelected = this._selectedIds.has(asset.id);

    return html`
      <tr>
        <td><input type="checkbox" class="checkbox" .checked=${isSelected} @change=${() => this._toggleSelect(asset.id)} @click=${(e: Event) => e.stopPropagation()} /></td>
        <td>
          <div style="font-weight:600;cursor:pointer" @click=${() => { this._selected = asset; }}>${asset.name}</div>
          <div style="font-size:10px;color:#6b7280">${asset.ip} | ${asset.os}</div>
        </td>
        <td><span style="text-transform:capitalize">${asset.type}</span></td>
        <td><span class="badge b-${asset.criticality}" style="color:${this._getCriticalityColor(asset.criticality)}">${asset.criticality.toUpperCase()}</span></td>
        <td><span class="badge b-${asset.status}">${asset.status}</span></td>
        <td>
          <span class="badge b-${asset.compliance}">${asset.compliance}</span>
        </td>
        <td>${asset.owner}</td>
        <td>
          ${asset.vulnCount > 0 ? html`<span style="color:${asset.vulnCount > 3 ? '#ef4444' : '#f97316'};font-weight:600">${asset.vulnCount}</span>` : html`<span style="color:#22c55e">0</span>`}
        </td>
        <td>
          <div style="display:flex;align-items:center;gap:4px">
            <div class="risk-bar"><div style="width:${asset.riskScore}%;height:100%;background:${this._getRiskColor(asset.riskScore)};border-radius:3px"></div></div>
            <span style="font-size:10px;color:${this._getRiskColor(asset.riskScore)};font-weight:600">${asset.riskScore}</span>
          </div>
        </td>
        <td>
          ${asset.eolDate ? html`<span class="${isEol ? 'eol-warning' : isEolSoon ? 'eol-soon' : ''}">${asset.eolDate}</span>` : html`<span style="color:#6b7280">N/A</span>`}
        </td>
        <td>
          ${asset.dependencies.slice(0, 2).map(d => html`<span class="dep-tag">${d}</span>`)}
          ${asset.dependencies.length > 2 ? html`<span class="dep-tag">+${asset.dependencies.length - 2}</span>` : nothing}
        </td>
      </tr>
    `;
  }

  private _renderTopologySVG(): string {
    const nodes = this._assets.filter(a => a.status !== 'retired').slice(0, 10);
    const positions = [
      { x: 300, y: 40 }, { x: 150, y: 100 }, { x: 450, y: 100 },
      { x: 80, y: 180 }, { x: 220, y: 180 }, { x: 360, y: 180 },
      { x: 500, y: 180 }, { x: 150, y: 260 }, { x: 300, y: 260 }, { x: 450, y: 260 }
    ];
    let edges = '';
    const nodeMap = new Map<string, number>();
    nodes.forEach((n, i) => nodeMap.set(n.name, i));

    nodes.forEach((n, i) => {
      n.dependencies.forEach(dep => {
        const depIdx = nodeMap.get(dep);
        if (depIdx !== undefined && depIdx !== i) {
          edges += `<line x1="${positions[i].x}" y1="${positions[i].y}" x2="${positions[depIdx].x}" y2="${positions[depIdx].y}" stroke="#374151" stroke-width="1.5" stroke-dasharray="4,2"/>`;
        }
      });
    });

    const nodeCircles = nodes.map((n, i) => {
      const color = this._getCriticalityColor(n.criticality);
      const shortName = n.name.split('.')[0];
      return `<circle cx="${positions[i].x}" cy="${positions[i].y}" r="18" fill="#1f2937" stroke="${color}" stroke-width="2"/>
        <text x="${positions[i].x}" y="${positions[i].y - 22}" fill="#e2e8f0" font-size="8" text-anchor="middle">${shortName}</text>
        <text x="${positions[i].x}" y="${positions[i].y + 4}" fill="${color}" font-size="9" text-anchor="middle" font-weight="700">${n.riskScore}</text>`;
    }).join('');

    return `<svg viewBox="0 0 580 300" width="100%" height="300">
      <text x="10" y="20" fill="#94a3b8" font-size="11" font-weight="600">Network Dependency Topology (Risk Score)</text>
      ${edges}${nodeCircles}
    </svg>`;
  }

  private _renderScanSparkline(values: number[], color: string): string {
    if (values.length < 2) return '';
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const w = 120, h = 30;
    const points = values.map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    }).join(' ');
    return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5"/><polyline points="0,${h} ${points} ${w},${h}" fill="${color}10" stroke="none"/></svg>`;
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
    const blob = new Blob(['asset-inventory-mgmt export'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'asset-inventory-mgmt-export.' + (format === 'markdown' ? 'md' : format); a.click();
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
    const assets = this._getFilteredAssets();
    const tier1Count = this._assets.filter(a => a.criticality === 'tier1').length;
    const eolCount = this._assets.filter(a => a.eolDate && new Date(a.eolDate) < new Date('2026-07-01')).length;
    const unmanagedCount = this._assets.filter(a => a.status === 'discovered').length;
    const compliant = this._assets.filter(a => a.compliance === 'compliant').length;
    const nonCompliant = this._assets.filter(a => a.compliance === 'non-compliant').length;
    const sel = this._selected;
    const hasSelection = this._selectedIds.size > 0;
    const allSelected = hasSelection && this._selectedIds.size === assets.length;

    return html`
      <div class="panel">
        <div class="pt">
          📦 Asset Inventory Management
          <div style="flex:1"></div>
          <button class="export-btn" @click=${() => this._exportCSV()}>📥 Export CSV</button>
        </div>
        <div class="stats">
          <div class="stat"><div class="sv">${this._assets.length}</div><div class="sl">Total Assets</div></div>
          <div class="stat"><div class="sv" style="color:#ef4444">${tier1Count}</div><div class="sl">Tier 1 Critical</div></div>
          <div class="stat"><div class="sv" style="color:#f97316">${eolCount}</div><div class="sl">EOL Soon</div></div>
          <div class="stat"><div class="sv" style="color:#3b82f6">${unmanagedCount}</div><div class="sl">Unmanaged</div></div>
          <div class="stat"><div class="sv" style="color:#22c55e">${compliant}</div><div class="sl">Compliant</div></div>
          <div class="stat"><div class="sv" style="color:#ef4444">${nonCompliant}</div><div class="sl">Non-Compliant</div></div>
        </div>

        <div class="tabs">
          <span class="tab ${this._tab === 'all' ? 'active' : ''}" @click=${() => { this._tab = 'all'; this._selected = null; }}>All Assets</span>
          <span class="tab ${this._tab === 'critical' ? 'active' : ''}" @click=${() => { this._tab = 'critical'; this._selected = null; }}>Tier 1 Critical</span>
          <span class="tab ${this._tab === 'eol' ? 'active' : ''}" @click=${() => { this._tab = 'eol'; this._selected = null; }}>EOL Soon</span>
          <span class="tab ${this._tab === 'unmanaged' ? 'active' : ''}" @click=${() => { this._tab = 'unmanaged'; this._selected = null; }}>Unmanaged</span>
          <span class="tab ${this._tab === 'topology' ? 'active' : ''}" @click=${() => { this._tab = 'topology'; this._selected = null; }}>Topology</span>
          <span class="tab ${this._tab === 'scans' ? 'active' : ''}" @click=${() => { this._tab = 'scans'; this._selected = null; }}>Scan History</span>
        </div>

        ${this._tab === 'topology' ? html`
          <div class="topo-svg">${this._renderTopologySVG()}</div>
          <div style="display:flex;gap:16px;margin-top:12px;font-size:10px;color:#94a3b8">
            <span style="color:#ef4444">● Tier 1</span>
            <span style="color:#f97316">● Tier 2</span>
            <span style="color:#eab308">● Tier 3</span>
            <span style="color:#22c55e">● Tier 4</span>
            <span style="margin-left:auto">Dashed lines = dependency</span>
          </div>
        ` : this._tab === 'scans' ? html`
          <div class="section">
            <div class="stitle">Recent Scan History</div>
            ${this._scanHistory.map(s => html`
              <div class="scan-row">
                <span>${s.date}</span>
                <span style="display:flex;gap:16px">
                  <span style="color:#3b82f6">+${s.newAssets} new assets</span>
                  <span style="color:#22c55e">${s.resolvedVulns} resolved</span>
                  <span style="color:#ef4444">${s.newVulns} new vulns</span>
                </span>
              </div>
            `)}
          </div>
          <div class="section">
            <div class="stitle">Vulnerability Trend (7 Days)</div>
            <div style="display:flex;gap:20px">
              <div>
                <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Resolved Vulns</div>
                ${this._renderScanSparkline(this._scanHistory.map(s => s.resolvedVulns), '#22c55e')}
              </div>
              <div>
                <div style="font-size:10px;color:#6b7280;margin-bottom:4px">New Vulns</div>
                ${this._renderScanSparkline(this._scanHistory.map(s => s.newVulns), '#ef4444')}
              </div>
            </div>
          </div>
        ` : html`
          <input class="sb" placeholder="Search assets by name, IP, or owner..." .value=${this._search} @input=${(e: Event) => { this._search = (e.target as HTMLInputElement).value; this.requestUpdate(); }/>

          <div class="filter-row">
            <span class="filter-chip ${this._tab === 'all' ? 'active' : ''}" @click=${() => { this._tab = 'all'; this.requestUpdate(); }}>All</span>
            <span class="filter-chip ${this._tab === 'critical' ? 'active' : ''}" @click=${() => { this._tab = 'critical'; this.requestUpdate(); }}>Tier 1 Critical</span>
            <span class="filter-chip ${this._tab === 'eol' ? 'active' : ''}" @click=${() => { this._tab = 'eol'; this.requestUpdate(); }}>EOL Soon</span>
            <span class="filter-chip ${this._tab === 'unmanaged' ? 'active' : ''}" @click=${() => { this._tab = 'unmanaged'; this.requestUpdate(); }}>Unmanaged</span>
          </div>

          <div class="filter-row" style="margin-top:-4px">
            ${['all', 'server', 'database', 'network', 'workstation', 'cloud', 'application'].map(t => html`
              <span class="filter-chip ${this._typeFilter === t ? 'active' : ''}" @click=${() => { this._typeFilter = t; this.requestUpdate(); } style="font-size:10px;padding:3px 10px">${t === 'all' ? 'All Types' : t}</span>
            `)}
          </div>

          ${sel ? html`
            <div class="detail-panel">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <div style="font-weight:700;font-size:14px">${sel.name}</div>
                <button class="action-btn" @click=${() => { this._selected = null; }}>✕ Close</button>
              </div>
              <div class="detail-grid">
                <div class="dm"><div class="dm-label">Type / OS</div><div class="dm-value" style="font-size:12px">${sel.type} | ${sel.os}</div></div>
                <div class="dm"><div class="dm-label">Criticality</div><div class="dm-value" style="color:${this._getCriticalityColor(sel.criticality)}">${sel.criticality.toUpperCase()}</div></div>
                <div class="dm"><div class="dm-label">Risk Score</div><div class="dm-value" style="color:${this._getRiskColor(sel.riskScore)}">${sel.riskScore}/100</div></div>
                <div class="dm"><div class="dm-label">Owner</div><div class="dm-value" style="font-size:12px">${sel.owner}</div></div>
                <div class="dm"><div class="dm-label">Compliance</div><div class="dm-value"><span class="badge b-${sel.compliance}">${sel.compliance}</span></div></div>
                <div class="dm"><div class="dm-label">Last Patched</div><div class="dm-value" style="font-size:12px">${sel.lastPatch}</div></div>
                <div class="dm"><div class="dm-label">Location</div><div class="dm-value" style="font-size:12px">${sel.location}</div></div>
                <div class="dm"><div class="dm-label">Last Scan</div><div class="dm-value" style="font-size:12px">${sel.lastScan}</div></div>
                <div class="dm"><div class="dm-label">EOL Date</div><div class="dm-value" style="font-size:12px;color:${sel.eolDate && new Date(sel.eolDate) < new Date('2026-07-01') ? '#f97316' : '#94a3b8'}">${sel.eolDate || 'N/A'}</div></div>
              </div>
              <div style="margin-top:10px">
                <span style="font-size:10px;color:#6b7280">Dependencies (${sel.dependencies.length}):</span>
                ${sel.dependencies.map(d => html`<span class="dep-tag" style="margin-left:4px">${d}</span>`)}
              </div>
            </div>
          ` : nothing}

          ${hasSelection ? html`
            <div class="bulk-bar">
              <span class="bulk-count">${this._selectedIds.size} selected</span>
              <button class="action-btn" @click=${() => this._toggleSelectAll()}>${allSelected ? 'Deselect All' : 'Select All'}</button>
              <button class="action-btn primary">▶ Scan Selected</button>
              <button class="action-btn">📋 Bulk Assign</button>
              <button class="action-btn">⚠ Tag as Critical</button>
            </div>
          ` : nothing}

          <div style="overflow-x:auto">
            <table class="tbl">
              <thead>
                <tr>
                  <th><input type="checkbox" class="checkbox" .checked=${allSelected} @change=${() => this._toggleSelectAll()} /></th>
                  <th>Asset</th><th>Type</th><th>Criticality</th><th>Status</th><th>Compliance</th><th>Owner</th><th>Vulns</th><th>Risk</th><th>EOL</th><th>Deps</th>
                </tr>
              </thead>
              <tbody>
                ${assets.map(a => this._renderAssetRow(a))}
              </tbody>
            </table>
          </div>
          ${assets.length === 0 ? html`<div style="text-align:center;padding:40px;color:#6b7280">No assets match your filters</div>` : nothing}
        `}
      </div>
      </div>
      <div style="margin-top:12px;display:flex;justify-content:center">
        <button class="btn btn-sm ${this._showEnhanced ? 'btn-primary' : 'btn-secondary'}" @click=${() => {{ this._showEnhanced = !this._showEnhanced; this.requestUpdate(); }}>${this._showEnhanced ? 'Hide' : 'Show'} Advanced</button>
      </div>
      ${this._renderEnhancedSection()}
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-asset-inventory-mgmt': ScAssetInventoryMgmt; } }
