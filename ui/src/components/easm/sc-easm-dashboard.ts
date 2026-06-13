/** EASM Dashboard */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

type Tab = 'surface' | 'exposures' | 'leaks' | 'phishing';

interface AssetStat {
  totalAssets: number;
  activeDomains: number;
  subdomains: number;
  highRiskAssets: number;
}

interface Target {
  id: string;
  name: string;
  rootDomain: string;
  organization: string;
  totalAssets: number;
  lastRun: string;
  active: boolean;
}

interface Asset {
  id: string;
  type: 'domain' | 'subdomain' | 'ip' | 'service' | 'certificate' | 'bucket';
  value: string;
  rootDomain: string;
  status: 'active' | 'inactive' | 'new' | 'deprecated';
  riskScore: number;
  cloudProvider?: 'aws' | 'azure' | 'gcp' | 'cloudflare' | 'other';
}

interface ExposureStat {
  totalExposures: number;
  critical: number;
  openRemediation: number;
  inTheWildExploits: number;
}

interface Exposure {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  affectedAsset: string;
  remediationStatus: 'open' | 'in_progress' | 'resolved' | 'accepted';
}

interface LeakStat {
  totalLeaks: number;
  critical: number;
  active: number;
  meanTimeToRevoke: string;
}

interface Leak {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  secretType: string;
  preview: string;
  source: string;
  status: 'active' | 'revoked' | 'expired' | 'rotated';
}

interface PhishingStat {
  totalSites: number;
  active: number;
  takenDown: number;
  highRisk: number;
}

interface BrandWatch {
  id: string;
  brand: string;
  officialDomains: number;
  protectionLevel: 'standard' | 'enhanced' | 'premium';
  totalDetections: number;
}

interface PhishingSite {
  id: string;
  risk: 'critical' | 'high' | 'medium' | 'low';
  type: 'phishing' | 'typosquat' | 'impersonation' | 'clone';
  domain: string;
  brandImpersonated: string;
  status: 'active' | 'taken_down' | 'monitoring' | 'sinkholed';
}

@customElement('sc-easm-dashboard')
export class ScEasmDashboard extends LitElement {
  static styles = css`
    :host {
      display: block;
      color: var(--sc-text-primary, #e6edf3);
      font-family: Inter, system-ui, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .dashboard { background: var(--sc-bg-primary, #0a0e17); min-height: 100vh; padding: 24px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--sc-border, #2a3a4a); }
    .title { font-size: 24px; font-weight: 700; color: var(--sc-primary, #00ff88); display: flex; align-items: center; gap: 12px; }
    .subtitle { font-size: 13px; color: var(--sc-text-muted, #8899aa); margin-top: 4px; }
    .live-dot { display: inline-block; width: 8px; height: 8px; background: var(--sc-low, #10b981); border-radius: 50%; margin-right: 6px; animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
    .header-actions { display: flex; gap: 10px; }
    .btn { padding: 8px 16px; border-radius: 8px; border: 1px solid var(--sc-border, #2a3a4a); background: var(--sc-bg-secondary, #141b26); color: var(--sc-text-primary, #e6edf3); font-size: 13px; cursor: pointer; transition: all 0.2s; }
    .btn:hover { border-color: var(--sc-primary, #00ff88); }
    .btn-primary { background: linear-gradient(135deg, var(--sc-primary, #00ff88), #00cc6a); color: var(--sc-bg-primary, #0a0e17); border: none; font-weight: 600; }
    .tabs { display: flex; gap: 4px; margin-bottom: 20px; border-bottom: 1px solid var(--sc-border, #2a3a4a); }
    .tab { padding: 10px 18px; background: transparent; border: none; color: var(--sc-text-muted, #8899aa); font-size: 13px; font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
    .tab:hover { color: var(--sc-text-primary, #e6edf3); }
    .tab.active { color: var(--sc-primary, #00ff88); border-bottom-color: var(--sc-primary, #00ff88); }
    .tab-icon { margin-right: 6px; }
    .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .kpi-card { background: var(--sc-bg-secondary, #141b26); border-radius: 12px; padding: 18px; border: 1px solid var(--sc-border, #2a3a4a); }
    .kpi-label { font-size: 11px; color: var(--sc-text-muted, #8899aa); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .kpi-value { font-size: 28px; font-weight: 700; }
    .kpi-icon { float: right; font-size: 22px; opacity: 0.6; }
    .card { background: var(--sc-bg-secondary, #141b26); border-radius: 12px; padding: 20px; border: 1px solid var(--sc-border, #2a3a4a); margin-bottom: 20px; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--sc-border, #2a3a4a); }
    .card-title { font-size: 15px; font-weight: 600; }
    .card-actions { display: flex; gap: 8px; align-items: center; }
    .table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .table th { text-align: left; padding: 10px 12px; color: var(--sc-text-muted, #8899aa); font-weight: 500; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; border-bottom: 1px solid var(--sc-border, #2a3a4a); }
    .table td { padding: 12px; border-bottom: 1px solid var(--sc-border, #2a3a4a); }
    .table tr:hover td { background: rgba(255,255,255,0.02); }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge-critical { background: rgba(255,68,68,0.15); color: var(--sc-critical, #ff4444); border: 1px solid rgba(255,68,68,0.3); }
    .badge-high { background: rgba(255,170,0,0.15); color: var(--sc-high, #ffaa00); border: 1px solid rgba(255,170,0,0.3); }
    .badge-medium { background: rgba(0,170,255,0.15); color: var(--sc-medium, #00aaff); border: 1px solid rgba(0,170,255,0.3); }
    .badge-low { background: rgba(16,185,129,0.15); color: var(--sc-low, #10b981); border: 1px solid rgba(16,185,129,0.3); }
    .badge-info { background: rgba(168,85,247,0.15); color: var(--sc-info, #a855f7); border: 1px solid rgba(168,85,247,0.3); }
    .badge-active { background: rgba(16,185,129,0.15); color: var(--sc-low, #10b981); border: 1px solid rgba(16,185,129,0.3); }
    .badge-inactive { background: rgba(136,153,170,0.15); color: var(--sc-text-muted, #8899aa); border: 1px solid rgba(136,153,170,0.3); }
    .badge-new { background: rgba(0,170,255,0.15); color: var(--sc-medium, #00aaff); border: 1px solid rgba(0,170,255,0.3); }
    .badge-deprecated { background: rgba(255,68,68,0.15); color: var(--sc-critical, #ff4444); border: 1px solid rgba(255,68,68,0.3); }
    .badge-open { background: rgba(255,68,68,0.15); color: var(--sc-critical, #ff4444); }
    .badge-in_progress { background: rgba(255,170,0,0.15); color: var(--sc-high, #ffaa00); }
    .badge-resolved { background: rgba(16,185,129,0.15); color: var(--sc-low, #10b981); }
    .badge-accepted { background: rgba(168,85,247,0.15); color: var(--sc-info, #a855f7); }
    .badge-revoked, .badge-taken_down, .badge-rotated { background: rgba(16,185,129,0.15); color: var(--sc-low, #10b981); }
    .badge-expired { background: rgba(136,153,170,0.15); color: var(--sc-text-muted, #8899aa); }
    .badge-monitoring { background: rgba(0,170,255,0.15); color: var(--sc-medium, #00aaff); }
    .badge-sinkholed { background: rgba(168,85,247,0.15); color: var(--sc-info, #a855f7); }
    .badge-standard { background: rgba(136,153,170,0.15); color: var(--sc-text-muted, #8899aa); }
    .badge-enhanced { background: rgba(0,170,255,0.15); color: var(--sc-medium, #00aaff); }
    .badge-premium { background: rgba(168,85,247,0.15); color: var(--sc-info, #a855f7); }
    .type-icon { font-size: 16px; margin-right: 6px; }
    .cloud-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase; background: rgba(0,170,255,0.12); color: var(--sc-info, #a855f7); margin-left: 6px; }
    .target-row { display: grid; grid-template-columns: 1.2fr 1.4fr 1fr 0.8fr 1fr 0.6fr; gap: 12px; align-items: center; padding: 12px; background: var(--sc-bg-primary, #0a0e17); border-radius: 8px; margin-bottom: 8px; border: 1px solid var(--sc-border, #2a3a4a); }
    .target-name { font-weight: 600; }
    .target-domain { color: var(--sc-text-muted, #8899aa); font-size: 12px; }
    .target-meta { font-size: 12px; color: var(--sc-text-muted, #8899aa); }
    .toggle { position: relative; display: inline-block; width: 36px; height: 20px; }
    .toggle input { display: none; }
    .toggle-slider { position: absolute; inset: 0; background: var(--sc-border, #2a3a4a); border-radius: 10px; cursor: pointer; transition: 0.2s; }
    .toggle-slider::before { content: ''; position: absolute; left: 2px; top: 2px; width: 16px; height: 16px; background: #fff; border-radius: 50%; transition: 0.2s; }
    .toggle input:checked + .toggle-slider { background: var(--sc-low, #10b981); }
    .toggle input:checked + .toggle-slider::before { transform: translateX(16px); }
    .brand-row { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; align-items: center; padding: 12px; background: var(--sc-bg-primary, #0a0e17); border-radius: 8px; margin-bottom: 8px; border: 1px solid var(--sc-border, #2a3a4a); }
    .brand-name { font-weight: 600; }
    .panel { background: var(--sc-bg-primary, #0a0e17); border: 1px solid var(--sc-primary, #00ff88); border-radius: 8px; padding: 16px; margin-bottom: 20px; }
    .panel-title { font-size: 13px; font-weight: 600; color: var(--sc-primary, #00ff88); margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
    .panel-close { background: none; border: none; color: var(--sc-text-muted, #8899aa); cursor: pointer; font-size: 16px; }
    .form-row { display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
    .form-input { flex: 1; min-width: 180px; padding: 8px 12px; background: var(--sc-bg-secondary, #141b26); border: 1px solid var(--sc-border, #2a3a4a); border-radius: 6px; color: var(--sc-text-primary, #e6edf3); font-size: 13px; font-family: inherit; }
    .form-input:focus { outline: none; border-color: var(--sc-primary, #00ff88); }
    .form-textarea { width: 100%; min-height: 120px; padding: 10px 12px; background: var(--sc-bg-secondary, #141b26); border: 1px solid var(--sc-border, #2a3a4a); border-radius: 6px; color: var(--sc-text-primary, #e6edf3); font-size: 13px; font-family: monospace; resize: vertical; }
    .form-select { padding: 8px 12px; background: var(--sc-bg-secondary, #141b26); border: 1px solid var(--sc-border, #2a3a4a); border-radius: 6px; color: var(--sc-text-primary, #e6edf3); font-size: 13px; cursor: pointer; }
    .empty { padding: 40px; text-align: center; color: var(--sc-text-muted, #8899aa); font-size: 13px; }
    .empty-icon { font-size: 32px; margin-bottom: 8px; opacity: 0.5; }
    .risk-score { font-weight: 600; }
    .risk-score.critical { color: var(--sc-critical, #ff4444); }
    .risk-score.high { color: var(--sc-high, #ffaa00); }
    .risk-score.medium { color: var(--sc-medium, #00aaff); }
    .risk-score.low { color: var(--sc-low, #10b981); }
    .secret-preview { font-family: monospace; color: var(--sc-text-muted, #8899aa); }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 14px; font-weight: 600; margin-bottom: 12px; color: var(--sc-text-primary, #e6edf3); }
    @media (max-width: 1100px) { .kpi-row { grid-template-columns: repeat(2, 1fr); } }
  `;

  @state() private activeTab: Tab = 'surface';
  @state() private assetStats: AssetStat = { totalAssets: 0, activeDomains: 0, subdomains: 0, highRiskAssets: 0 };
  @state() private targets: Target[] = [];
  @state() private assets: Asset[] = [];
  @state() private showNewTarget = false;
  @state() private newRootDomain = '';
  @state() private newOrganization = '';
  @state() private newSeeds = '';

  @state() private exposureStats: ExposureStat = { totalExposures: 0, critical: 0, openRemediation: 0, inTheWildExploits: 0 };
  @state() private exposures: Exposure[] = [];
  @state() private exposureFilter: 'all' | 'critical' | 'high' | 'medium' | 'low' = 'all';

  @state() private leakStats: LeakStat = { totalLeaks: 0, critical: 0, active: 0, meanTimeToRevoke: '—' };
  @state() private leaks: Leak[] = [];
  @state() private showScanContent = false;
  @state() private scanContent = '';

  @state() private phishingStats: PhishingStat = { totalSites: 0, active: 0, takenDown: 0, highRisk: 0 };
  @state() private brandWatches: BrandWatch[] = [];
  @state() private phishingSites: PhishingSite[] = [];
  @state() private showNewBrand = false;
  @state() private newBrand = '';
  @state() private newBrandDomains = '';
  @state() private showCheckUrl = false;
  @state() private checkUrl = '';

  private apiBase = 'http://127.0.0.1:21981/api/v1/easm';

  connectedCallback() {
    super.connectedCallback();
    this._loadAssetStats();
    this._loadAssets();
    this._loadTargets();
    this._loadExposures();
    this._loadExposureStats();
    this._loadLeaks();
    this._loadLeakStats();
    this._loadPhishingSites();
    this._loadBrandWatches();
    this._loadPhishingStats();
  }

  private async _api<T>(path: string, init?: RequestInit): Promise<T | null> {
    try {
      const res = await fetch(`${this.apiBase}${path}`, { headers: { 'Content-Type': 'application/json' }, ...init });
      if (!res.ok) return null;
      return await res.json() as T;
    } catch {
      return null;
    }
  }

  private async _loadAssetStats() {
    const data = await this._api<AssetStat>('/assets/stats');
    if (data) this.assetStats = data;
  }

  private async _loadAssets() {
    const data = await this._api<Asset[]>('/assets');
    if (data) this.assets = data;
  }

  private async _loadTargets() {
    const data = await this._api<Target[]>('/targets');
    if (data) this.targets = data;
  }

  private async _loadExposures() {
    const data = await this._api<Exposure[]>('/exposures');
    if (data) this.exposures = data;
  }

  private async _loadExposureStats() {
    const data = await this._api<ExposureStat>('/exposures/stats');
    if (data) this.exposureStats = data;
  }

  private async _loadLeaks() {
    const data = await this._api<Leak[]>('/leaks');
    if (data) this.leaks = data;
  }

  private async _loadLeakStats() {
    const data = await this._api<LeakStat>('/leaks/stats');
    if (data) this.leakStats = data;
  }

  private async _loadPhishingSites() {
    const data = await this._api<PhishingSite[]>('/phishing/sites');
    if (data) this.phishingSites = data;
  }

  private async _loadBrandWatches() {
    const data = await this._api<BrandWatch[]>('/phishing/brands');
    if (data) this.brandWatches = data;
  }

  private async _loadPhishingStats() {
    const data = await this._api<PhishingStat>('/phishing/stats');
    if (data) this.phishingStats = data;
  }

  private _setActiveTab(tab: Tab) {
    this.activeTab = tab;
  }

  private _renderTabs() {
    const tabs: { id: Tab; label: string; icon: string }[] = [
      { id: 'surface', label: 'Attack Surface', icon: '🌐' },
      { id: 'exposures', label: 'Exposures', icon: '🛡️' },
      { id: 'leaks', label: 'Credential Leaks', icon: '🔑' },
      { id: 'phishing', label: 'Phishing', icon: '🎣' },
    ];
    return html`
      <div class="tabs" role="tablist">
        ${tabs.map(t => html`
          <button
            role="tab"
            aria-selected=${this.activeTab === t.id}
            class="tab ${this.activeTab === t.id ? 'active' : ''}"
            @click=${() => this._setActiveTab(t.id)}>
            <span class="tab-icon">${t.icon}</span>${t.label}
          </button>
        `)}
      </div>
    `;
  }

  private _getTypeIcon(type: Asset['type']): string {
    const icons: Record<Asset['type'], string> = {
      domain: '🌍', subdomain: '🔗', ip: '🖥️', service: '⚙️', certificate: '📜', bucket: '🪣',
    };
    return icons[type] || '•';
  }

  private _toggleTarget(id: string) {
    this.targets = this.targets.map(t => t.id === id ? { ...t, active: !t.active } : t);
  }

  private _createTarget() {
    if (!this.newRootDomain.trim()) return;
    const seeds = this.newSeeds.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    const newTarget: Target = {
      id: `t-${Date.now()}`,
      name: this.newOrganization || this.newRootDomain,
      rootDomain: this.newRootDomain,
      organization: this.newOrganization,
      totalAssets: 0,
      lastRun: 'Never',
      active: true,
    };
    this.targets = [newTarget, ...this.targets];
    this._api('/targets', { method: 'POST', body: JSON.stringify({ rootDomain: newTarget.rootDomain, organization: newTarget.organization, seeds }) });
    this.newRootDomain = '';
    this.newOrganization = '';
    this.newSeeds = '';
    this.showNewTarget = false;
  }

  private _updateRemediation(id: string) {
    this.exposures = this.exposures.map(e => e.id === id ? { ...e, remediationStatus: 'resolved' as const } : e);
    this._api(`/exposures/${id}/remediation`, { method: 'PATCH', body: JSON.stringify({ status: 'resolved' }) });
  }

  private _revokeLeak(id: string) {
    this.leaks = this.leaks.map(l => l.id === id ? { ...l, status: 'revoked' as const } : l);
    this._api(`/leaks/${id}/revoke`, { method: 'POST' });
  }

  private _markTakenDown(id: string) {
    this.phishingSites = this.phishingSites.map(p => p.id === id ? { ...p, status: 'taken_down' as const } : p);
    this._api(`/phishing/sites/${id}/takedown`, { method: 'POST' });
  }

  private _runScan() {
    this._api('/exposures/scan', { method: 'POST' });
  }

  private _createBrand() {
    if (!this.newBrand.trim()) return;
    const domains = this.newBrandDomains.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    const brand: BrandWatch = {
      id: `b-${Date.now()}`,
      brand: this.newBrand,
      officialDomains: domains.length,
      protectionLevel: 'standard',
      totalDetections: 0,
    };
    this.brandWatches = [brand, ...this.brandWatches];
    this._api('/phishing/brands', { method: 'POST', body: JSON.stringify({ brand: brand.brand, domains }) });
    this.newBrand = '';
    this.newBrandDomains = '';
    this.showNewBrand = false;
  }

  private _scanContent() {
    if (!this.scanContent.trim()) return;
    this._api('/leaks/scan', { method: 'POST', body: JSON.stringify({ content: this.scanContent }) });
    this.scanContent = '';
    this.showScanContent = false;
  }

  private _checkUrl() {
    if (!this.checkUrl.trim()) return;
    this._api('/phishing/check', { method: 'POST', body: JSON.stringify({ url: this.checkUrl }) });
    this.checkUrl = '';
    this.showCheckUrl = false;
  }

  private _renderSurfaceTab() {
    return html`
      <div class="kpi-row">
        <div class="kpi-card"><div class="kpi-icon">🌐</div><div class="kpi-label">Total Assets</div><div class="kpi-value">${this.assetStats.totalAssets.toLocaleString()}</div></div>
        <div class="kpi-card"><div class="kpi-icon">✅</div><div class="kpi-label">Active Domains</div><div class="kpi-value" style="color: var(--sc-low, #10b981)">${this.assetStats.activeDomains.toLocaleString()}</div></div>
        <div class="kpi-card"><div class="kpi-icon">🔗</div><div class="kpi-label">Subdomains</div><div class="kpi-value" style="color: var(--sc-medium, #00aaff)">${this.assetStats.subdomains.toLocaleString()}</div></div>
        <div class="kpi-card"><div class="kpi-icon">⚠️</div><div class="kpi-label">High-Risk Assets</div><div class="kpi-value" style="color: var(--sc-critical, #ff4444)">${this.assetStats.highRiskAssets.toLocaleString()}</div></div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Discovery Targets</h3>
          <div class="card-actions">
            <button class="btn btn-primary" @click=${() => this.showNewTarget = !this.showNewTarget}>
              ${this.showNewTarget ? '× Cancel' : '+ New Target'}
            </button>
          </div>
        </div>

        ${this.showNewTarget ? html`
          <div class="panel">
            <div class="panel-title">
              <span>Create Discovery Target</span>
              <button class="panel-close" @click=${() => this.showNewTarget = false}>×</button>
            </div>
            <div class="form-row">
              <input class="form-input" placeholder="Root domain (e.g. example.com)" .value=${this.newRootDomain}
                @input=${(e: Event) => this.newRootDomain = (e.target as HTMLInputElement).value} />
              <input class="form-input" placeholder="Organization" .value=${this.newOrganization}
                @input=${(e: Event) => this.newOrganization = (e.target as HTMLInputElement).value} />
            </div>
            <textarea class="form-textarea" placeholder="Seeds (one per line, e.g. example.com, www.example.com, api.example.com)"
              .value=${this.newSeeds}
              @input=${(e: Event) => this.newSeeds = (e.target as HTMLTextAreaElement).value}></textarea>
            <div style="margin-top: 12px; display: flex; justify-content: flex-end; gap: 8px;">
              <button class="btn" @click=${() => this.showNewTarget = false}>Cancel</button>
              <button class="btn btn-primary" @click=${() => this._createTarget()}>Create Target</button>
            </div>
          </div>
        ` : ''}

        ${this.targets.length === 0 ? html`
          <div class="empty"><div class="empty-icon">🎯</div>No discovery targets yet. Create one to start scanning.</div>
        ` : this.targets.map(t => html`
          <div class="target-row">
            <div>
              <div class="target-name">${t.name}</div>
              <div class="target-domain">${t.rootDomain}</div>
            </div>
            <div class="target-meta">${t.organization || '—'}</div>
            <div class="target-meta">${t.totalAssets} assets</div>
            <div class="target-meta">${t.lastRun}</div>
            <div class="target-meta">Last run</div>
            <label class="toggle">
              <input type="checkbox" .checked=${t.active} @change=${() => this._toggleTarget(t.id)} />
              <span class="toggle-slider"></span>
            </label>
          </div>
        `)}
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Discovered Assets</h3>
          <div class="card-actions"><span class="badge badge-info">${this.assets.length} total</span></div>
        </div>
        ${this.assets.length === 0 ? html`
          <div class="empty"><div class="empty-icon">📡</div>No assets discovered yet.</div>
        ` : html`
          <table class="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Value</th>
                <th>Root Domain</th>
                <th>Status</th>
                <th>Risk</th>
                <th>Cloud</th>
              </tr>
            </thead>
            <tbody>
              ${this.assets.slice(0, 50).map(a => html`
                <tr>
                  <td><span class="type-icon">${this._getTypeIcon(a.type)}</span>${a.type}</td>
                  <td style="font-family: monospace;">${a.value}</td>
                  <td>${a.rootDomain}</td>
                  <td><span class="badge badge-${a.status}">${a.status}</span></td>
                  <td><span class="risk-score ${a.riskScore >= 80 ? 'critical' : a.riskScore >= 60 ? 'high' : a.riskScore >= 40 ? 'medium' : 'low'}">${a.riskScore}</span></td>
                  <td>${a.cloudProvider ? html`<span class="cloud-badge">${a.cloudProvider}</span>` : '—'}</td>
                </tr>
              `)}
            </tbody>
          </table>
        `}
      </div>
    `;
  }

  private _renderExposuresTab() {
    const filtered = this.exposureFilter === 'all' ? this.exposures : this.exposures.filter(e => e.severity === this.exposureFilter);
    return html`
      <div class="kpi-row">
        <div class="kpi-card"><div class="kpi-icon">🛡️</div><div class="kpi-label">Total Exposures</div><div class="kpi-value">${this.exposureStats.totalExposures.toLocaleString()}</div></div>
        <div class="kpi-card"><div class="kpi-icon">🔴</div><div class="kpi-label">Critical</div><div class="kpi-value" style="color: var(--sc-critical, #ff4444)">${this.exposureStats.critical.toLocaleString()}</div></div>
        <div class="kpi-card"><div class="kpi-icon">📋</div><div class="kpi-label">Open Remediation</div><div class="kpi-value" style="color: var(--sc-high, #ffaa00)">${this.exposureStats.openRemediation.toLocaleString()}</div></div>
        <div class="kpi-card"><div class="kpi-icon">💥</div><div class="kpi-label">In-The-Wild Exploits</div><div class="kpi-value" style="color: var(--sc-info, #a855f7)">${this.exposureStats.inTheWildExploits.toLocaleString()}</div></div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Exposures</h3>
          <div class="card-actions">
            <select class="form-select" .value=${this.exposureFilter}
              @change=${(e: Event) => this.exposureFilter = (e.target as HTMLSelectElement).value as typeof this.exposureFilter}>
              <option value="all">All severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <button class="btn btn-primary" @click=${() => this._runScan()}>▶ Run Scan</button>
          </div>
        </div>
        ${filtered.length === 0 ? html`
          <div class="empty"><div class="empty-icon">🛡️</div>No exposures found.</div>
        ` : html`
          <table class="table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Category</th>
                <th>Title</th>
                <th>Affected Asset</th>
                <th>Remediation</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(e => html`
                <tr>
                  <td><span class="badge badge-${e.severity}">${e.severity}</span></td>
                  <td>${e.category}</td>
                  <td>${e.title}</td>
                  <td style="font-family: monospace; font-size: 12px;">${e.affectedAsset}</td>
                  <td><span class="badge badge-${e.remediationStatus}">${e.remediationStatus.replace('_', ' ')}</span></td>
                  <td>
                    <button class="btn" @click=${() => this._updateRemediation(e.id)}
                      ?disabled=${e.remediationStatus === 'resolved'}>
                      ${e.remediationStatus === 'resolved' ? '✓ Done' : 'Update'}
                    </button>
                  </td>
                </tr>
              `)}
            </tbody>
          </table>
        `}
      </div>
    `;
  }

  private _renderLeaksTab() {
    return html`
      <div class="kpi-row">
        <div class="kpi-card"><div class="kpi-icon">🔑</div><div class="kpi-label">Total Leaks</div><div class="kpi-value">${this.leakStats.totalLeaks.toLocaleString()}</div></div>
        <div class="kpi-card"><div class="kpi-icon">🔴</div><div class="kpi-label">Critical</div><div class="kpi-value" style="color: var(--sc-critical, #ff4444)">${this.leakStats.critical.toLocaleString()}</div></div>
        <div class="kpi-card"><div class="kpi-icon">⚡</div><div class="kpi-label">Active</div><div class="kpi-value" style="color: var(--sc-high, #ffaa00)">${this.leakStats.active.toLocaleString()}</div></div>
        <div class="kpi-card"><div class="kpi-icon">⏱️</div><div class="kpi-label">Mean Time to Revoke</div><div class="kpi-value" style="color: var(--sc-info, #a855f7); font-size: 22px;">${this.leakStats.meanTimeToRevoke}</div></div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Credential Leaks</h3>
          <div class="card-actions">
            <button class="btn btn-primary" @click=${() => this.showScanContent = !this.showScanContent}>
              ${this.showScanContent ? '× Cancel' : '🔍 Scan Content'}
            </button>
          </div>
        </div>

        ${this.showScanContent ? html`
          <div class="panel">
            <div class="panel-title">
              <span>Scan Content for Secrets</span>
              <button class="panel-close" @click=${() => this.showScanContent = false}>×</button>
            </div>
            <textarea class="form-textarea" placeholder="Paste code, log output, or any text content to scan for exposed secrets..."
              .value=${this.scanContent}
              @input=${(e: Event) => this.scanContent = (e.target as HTMLTextAreaElement).value}></textarea>
            <div style="margin-top: 12px; display: flex; justify-content: flex-end; gap: 8px;">
              <button class="btn" @click=${() => this.showScanContent = false}>Cancel</button>
              <button class="btn btn-primary" @click=${() => this._scanContent()}>Scan</button>
            </div>
          </div>
        ` : ''}

        ${this.leaks.length === 0 ? html`
          <div class="empty"><div class="empty-icon">🔐</div>No credential leaks detected.</div>
        ` : html`
          <table class="table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Type</th>
                <th>Preview</th>
                <th>Source</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${this.leaks.map(l => html`
                <tr>
                  <td><span class="badge badge-${l.severity}">${l.severity}</span></td>
                  <td>${l.secretType}</td>
                  <td><span class="secret-preview">${l.preview}</span></td>
                  <td style="font-family: monospace; font-size: 12px;">${l.source}</td>
                  <td><span class="badge badge-${l.status}">${l.status}</span></td>
                  <td>
                    <button class="btn" @click=${() => this._revokeLeak(l.id)}
                      ?disabled=${l.status !== 'active'}>
                      ${l.status === 'active' ? 'Revoke' : '✓ ' + l.status}
                    </button>
                  </td>
                </tr>
              `)}
            </tbody>
          </table>
        `}
      </div>
    `;
  }

  private _renderPhishingTab() {
    return html`
      <div class="kpi-row">
        <div class="kpi-card"><div class="kpi-icon">🎣</div><div class="kpi-label">Total Sites</div><div class="kpi-value">${this.phishingStats.totalSites.toLocaleString()}</div></div>
        <div class="kpi-card"><div class="kpi-icon">⚡</div><div class="kpi-label">Active</div><div class="kpi-value" style="color: var(--sc-critical, #ff4444)">${this.phishingStats.active.toLocaleString()}</div></div>
        <div class="kpi-card"><div class="kpi-icon">✓</div><div class="kpi-label">Taken Down</div><div class="kpi-value" style="color: var(--sc-low, #10b981)">${this.phishingStats.takenDown.toLocaleString()}</div></div>
        <div class="kpi-card"><div class="kpi-icon">⚠️</div><div class="kpi-label">High Risk</div><div class="kpi-value" style="color: var(--sc-high, #ffaa00)">${this.phishingStats.highRisk.toLocaleString()}</div></div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Brand Watches</h3>
          <div class="card-actions">
            <button class="btn btn-primary" @click=${() => this.showNewBrand = !this.showNewBrand}>
              ${this.showNewBrand ? '× Cancel' : '+ New Brand Watch'}
            </button>
          </div>
        </div>

        ${this.showNewBrand ? html`
          <div class="panel">
            <div class="panel-title">
              <span>Create Brand Watch</span>
              <button class="panel-close" @click=${() => this.showNewBrand = false}>×</button>
            </div>
            <div class="form-row">
              <input class="form-input" placeholder="Brand name (e.g. Acme Corp)" .value=${this.newBrand}
                @input=${(e: Event) => this.newBrand = (e.target as HTMLInputElement).value} />
            </div>
            <textarea class="form-textarea" placeholder="Official domains (one per line, e.g. acme.com, acme.io, acmecorp.com)"
              .value=${this.newBrandDomains}
              @input=${(e: Event) => this.newBrandDomains = (e.target as HTMLTextAreaElement).value}></textarea>
            <div style="margin-top: 12px; display: flex; justify-content: flex-end; gap: 8px;">
              <button class="btn" @click=${() => this.showNewBrand = false}>Cancel</button>
              <button class="btn btn-primary" @click=${() => this._createBrand()}>Create Watch</button>
            </div>
          </div>
        ` : ''}

        ${this.brandWatches.length === 0 ? html`
          <div class="empty"><div class="empty-icon">🏷️</div>No brand watches configured.</div>
        ` : this.brandWatches.map(b => html`
          <div class="brand-row">
            <div class="brand-name">${b.brand}</div>
            <div>${b.officialDomains} official domains</div>
            <div><span class="badge badge-${b.protectionLevel}">${b.protectionLevel}</span></div>
            <div class="target-meta">${b.totalDetections} detections</div>
          </div>
        `)}
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Phishing Sites</h3>
          <div class="card-actions">
            <button class="btn btn-primary" @click=${() => this.showCheckUrl = !this.showCheckUrl}>
              ${this.showCheckUrl ? '× Cancel' : '🔗 Check URL'}
            </button>
          </div>
        </div>

        ${this.showCheckUrl ? html`
          <div class="panel">
            <div class="panel-title">
              <span>Check URL for Phishing</span>
              <button class="panel-close" @click=${() => this.showCheckUrl = false}>×</button>
            </div>
            <div class="form-row">
              <input class="form-input" placeholder="https://suspicious-site.example.com" .value=${this.checkUrl}
                @input=${(e: Event) => this.checkUrl = (e.target as HTMLInputElement).value} />
              <button class="btn btn-primary" @click=${() => this._checkUrl()}>Check</button>
            </div>
          </div>
        ` : ''}

        ${this.phishingSites.length === 0 ? html`
          <div class="empty"><div class="empty-icon">🎣</div>No phishing sites detected.</div>
        ` : html`
          <table class="table">
            <thead>
              <tr>
                <th>Risk</th>
                <th>Type</th>
                <th>Domain</th>
                <th>Brand Impersonated</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${this.phishingSites.map(p => html`
                <tr>
                  <td><span class="badge badge-${p.risk}">${p.risk}</span></td>
                  <td>${p.type}</td>
                  <td style="font-family: monospace; font-size: 12px;">${p.domain}</td>
                  <td>${p.brandImpersonated}</td>
                  <td><span class="badge badge-${p.status}">${p.status.replace('_', ' ')}</span></td>
                  <td>
                    <button class="btn" @click=${() => this._markTakenDown(p.id)}
                      ?disabled=${p.status === 'taken_down'}>
                      ${p.status === 'taken_down' ? '✓ Down' : 'Mark Taken Down'}
                    </button>
                  </td>
                </tr>
              `)}
            </tbody>
          </table>
        `}
      </div>
    `;
  }

  render() {
    return html`
      <div class="dashboard" role="main" aria-label="External Attack Surface Management Dashboard">
        <header class="header">
          <div>
            <h1 class="title"><span>🌐</span> External Attack Surface</h1>
            <div class="subtitle"><span class="live-dot"></span>EASM · Live asset discovery & exposure monitoring</div>
          </div>
          <div class="header-actions">
            <button class="btn">📊 Reports</button>
            <button class="btn btn-primary">+ New Scan</button>
          </div>
        </header>

        ${this._renderTabs()}

        ${this.activeTab === 'surface' ? this._renderSurfaceTab() : ''}
        ${this.activeTab === 'exposures' ? this._renderExposuresTab() : ''}
        ${this.activeTab === 'leaks' ? this._renderLeaksTab() : ''}
        ${this.activeTab === 'phishing' ? this._renderPhishingTab() : ''}
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-easm-dashboard': ScEasmDashboard; } }
