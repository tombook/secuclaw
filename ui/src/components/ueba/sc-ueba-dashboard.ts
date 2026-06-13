/** UEBA Dashboard */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface UebaBaseline {
  entityId: string;
  entityType: string;
  activityType: string;
  totalEvents: number;
  avgBytesTransferred: number;
  lastUpdated: string;
}

interface UebaAnomaly {
  id: string;
  entityId: string;
  entityType: string;
  activityType: string;
  description: string;
  score: number;
  timestamp: string;
}

@customElement('sc-ueba-dashboard')
export class ScUebaDashboard extends LitElement {
  static styles = css`
    :host {
      display: block;
      --sc-bg-primary: #0a0e17;
      --sc-bg-secondary: #141b26;
      --sc-text-primary: #ffffff;
      --sc-text-muted: #8899aa;
      --sc-border: #2a3a4a;
      --sc-primary: #00ff88;
      --sc-critical: #ff4444;
      --sc-high: #ffaa00;
      --sc-medium: #00aaff;
      --sc-low: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .dashboard { background: var(--sc-bg-primary); min-height: 100vh; color: var(--sc-text-primary); padding: 24px; font-family: Inter, system-ui, sans-serif; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--sc-border); }
    .title { font-size: 24px; font-weight: 700; color: var(--sc-primary); display: flex; align-items: center; gap: 12px; }
    .subtitle { font-size: 13px; color: var(--sc-text-muted); }
    .live-dot { width: 8px; height: 8px; background: var(--sc-low); border-radius: 50%; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .header-actions { display: flex; gap: 12px; align-items: center; }
    .btn { padding: 8px 16px; border-radius: 8px; border: 1px solid var(--sc-border); background: var(--sc-bg-secondary); color: var(--sc-text-primary); font-size: 13px; cursor: pointer; transition: all 0.2s; }
    .btn-primary { background: linear-gradient(135deg, var(--sc-primary), #00cc6a); color: var(--sc-bg-primary); border: none; font-weight: 600; }
    .btn:hover { border-color: var(--sc-primary); }
    .select { padding: 8px 12px; border-radius: 8px; border: 1px solid var(--sc-border); background: var(--sc-bg-secondary); color: var(--sc-text-primary); font-size: 13px; cursor: pointer; }
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: var(--sc-bg-secondary); border-radius: 12px; padding: 18px; border: 1px solid var(--sc-border); display: flex; align-items: center; gap: 14px; }
    .stat-icon { font-size: 28px; flex-shrink: 0; }
    .stat-body { flex: 1; }
    .stat-value { font-size: 26px; font-weight: 700; }
    .stat-label { font-size: 11px; color: var(--sc-text-muted); text-transform: uppercase; margin-top: 4px; letter-spacing: 0.5px; }
    .stat-trend { font-size: 10px; margin-top: 4px; color: var(--sc-low); }
    .stat-trend.warn { color: var(--sc-high); }
    .stat-trend.crit { color: var(--sc-critical); }
    .middle-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; margin-bottom: 20px; }
    .card { background: var(--sc-bg-secondary); border-radius: 12px; padding: 20px; border: 1px solid var(--sc-border); }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--sc-border); }
    .card-title { font-size: 15px; font-weight: 600; color: var(--sc-text-primary); display: flex; align-items: center; gap: 8px; }
    .card-meta { font-size: 11px; color: var(--sc-text-muted); }
    .table-wrap { max-height: 360px; overflow-y: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { background: var(--sc-bg-primary); padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--sc-text-muted); border-bottom: 1px solid var(--sc-border); position: sticky; top: 0; }
    .data-table td { padding: 10px 12px; border-bottom: 1px solid var(--sc-border); font-size: 12px; }
    .data-table tr:hover td { background: rgba(0, 255, 136, 0.04); }
    .entity-id { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 600; color: var(--sc-primary); }
    .entity-type { padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase; background: rgba(0, 170, 255, 0.15); color: var(--sc-medium); display: inline-block; }
    .score-bars { display: flex; flex-direction: column; gap: 14px; padding: 8px 0; }
    .score-bar-row { display: grid; grid-template-columns: 80px 1fr 50px; align-items: center; gap: 12px; }
    .score-bar-label { font-size: 12px; color: var(--sc-text-muted); font-weight: 600; }
    .score-bar-track { height: 10px; background: var(--sc-bg-primary); border-radius: 5px; overflow: hidden; border: 1px solid var(--sc-border); }
    .score-bar-fill { height: 100%; border-radius: 5px; transition: width 0.4s; }
    .score-bar-value { font-size: 12px; font-weight: 700; text-align: right; }
    .anomalies-section { margin-top: 4px; }
    .anomalies-meta { display: flex; justify-content: space-between; align-items: center; }
    .anomaly-row { display: grid; grid-template-columns: 90px 1fr 1fr 1fr 130px; gap: 12px; padding: 12px; background: var(--sc-bg-primary); border-radius: 8px; margin-bottom: 8px; border-left: 4px solid; align-items: center; }
    .anomaly-row.critical { border-left-color: var(--sc-critical); }
    .anomaly-row.high { border-left-color: var(--sc-high); }
    .anomaly-row.medium { border-left-color: var(--sc-medium); }
    .anomaly-row.low { border-left-color: var(--sc-low); }
    .anomaly-cell { font-size: 12px; }
    .anomaly-score-pill { padding: 6px 10px; border-radius: 6px; font-weight: 700; text-align: center; font-size: 13px; }
    .score-critical { background: rgba(255, 68, 68, 0.2); color: var(--sc-critical); }
    .score-high { background: rgba(255, 170, 0, 0.2); color: var(--sc-high); }
    .score-medium { background: rgba(0, 170, 255, 0.2); color: var(--sc-medium); }
    .score-low { background: rgba(16, 185, 129, 0.2); color: var(--sc-low); }
    .anomaly-entity { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--sc-primary); font-weight: 600; }
    .anomaly-activity { color: var(--sc-text-muted); font-size: 11px; }
    .anomaly-desc { color: var(--sc-text-primary); font-size: 12px; line-height: 1.4; }
    .anomaly-time { color: var(--sc-text-muted); font-size: 11px; text-align: right; }
    .empty-state { text-align: center; padding: 40px 20px; color: var(--sc-text-muted); font-size: 13px; }
    .empty-state-icon { font-size: 36px; margin-bottom: 12px; opacity: 0.5; }
    .loading-state { text-align: center; padding: 24px; color: var(--sc-text-muted); font-size: 12px; }
    .error-state { text-align: center; padding: 24px; color: var(--sc-critical); font-size: 12px; background: rgba(255, 68, 68, 0.08); border-radius: 8px; border: 1px solid rgba(255, 68, 68, 0.2); }
    @media (max-width: 1200px) { .middle-grid { grid-template-columns: 1fr; } .stats-row { grid-template-columns: repeat(2, 1fr); } .anomaly-row { grid-template-columns: 80px 1fr 120px; } }
  `;

  @state() private baselines: UebaBaseline[] = [];
  @state() private anomalies: UebaAnomaly[] = [];
  @state() private loadingBaselines = true;
  @state() private loadingAnomalies = true;
  @state() private detecting = false;
  @state() private baselinesError = '';
  @state() private anomaliesError = '';
  @state() private entityFilter = 'all';
  @state() private lastUpdated = new Date();

  private readonly apiBase = 'http://127.0.0.1:21981/api/v1/ueba-baseline';

  connectedCallback() {
    super.connectedCallback();
    this._handleRefresh();
  }

  private async _handleRefresh() {
    await Promise.all([this._loadBaselines(), this._loadAnomalies()]);
    this.lastUpdated = new Date();
  }

  private async _loadBaselines() {
    this.loadingBaselines = true;
    this.baselinesError = '';
    try {
      const res = await fetch(`${this.apiBase}.list`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items = Array.isArray(data) ? data : (data?.items ?? data?.baselines ?? data?.data ?? []);
      this.baselines = items.map((b: any) => ({
        entityId: b.entityId ?? b.entity_id ?? b.entity ?? 'unknown',
        entityType: b.entityType ?? b.entity_type ?? b.type ?? 'user',
        activityType: b.activityType ?? b.activity_type ?? b.activity ?? 'login',
        totalEvents: Number(b.totalEvents ?? b.total_events ?? b.events ?? 0),
        avgBytesTransferred: Number(b.avgBytesTransferred ?? b.avg_bytes ?? b.bytes ?? 0),
        lastUpdated: b.lastUpdated ?? b.last_updated ?? b.updatedAt ?? new Date().toISOString(),
      }));
    } catch (e) {
      this.baselinesError = (e as Error).message;
      this.baselines = [];
    } finally {
      this.loadingBaselines = false;
    }
  }

  private async _loadAnomalies() {
    this.loadingAnomalies = true;
    this.anomaliesError = '';
    try {
      const res = await fetch(`${this.apiBase}.anomaly.list`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items = Array.isArray(data) ? data : (data?.items ?? data?.anomalies ?? data?.data ?? []);
      this.anomalies = items.slice(0, 20).map((a: any) => ({
        id: a.id ?? a.anomalyId ?? crypto.randomUUID(),
        entityId: a.entityId ?? a.entity_id ?? a.entity ?? 'unknown',
        entityType: a.entityType ?? a.entity_type ?? 'user',
        activityType: a.activityType ?? a.activity_type ?? 'login',
        description: a.description ?? a.reason ?? a.detail ?? 'Unusual behavior detected',
        score: Math.max(0, Math.min(100, Number(a.score ?? a.anomalyScore ?? 0))),
        timestamp: a.timestamp ?? a.detectedAt ?? a.time ?? new Date().toISOString(),
      }));
      if (this.anomalies.length === 0) await this._detectAnomalies();
    } catch (e) {
      this.anomaliesError = (e as Error).message;
      this.anomalies = [];
    } finally {
      this.loadingAnomalies = false;
    }
  }

  private async _detectAnomalies() {
    this.detecting = true;
    try {
      const sampleActivities = this.baselines.slice(0, 25).map(b => ({
        entityId: b.entityId,
        entityType: b.entityType,
        activityType: b.activityType,
        bytesTransferred: b.avgBytesTransferred * (1 + Math.random() * 4),
        events: b.totalEvents,
        timestamp: new Date().toISOString(),
      }));
      const res = await fetch(`${this.apiBase}.anomaly.detect-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activities: sampleActivities }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const detected = Array.isArray(data) ? data : (data?.anomalies ?? data?.items ?? data?.results ?? []);
      this.anomalies = detected.slice(0, 20).map((a: any, idx: number) => ({
        id: a.id ?? `det-${idx}-${Date.now()}`,
        entityId: a.entityId ?? a.entity_id ?? sampleActivities[idx]?.entityId ?? 'unknown',
        entityType: a.entityType ?? a.entity_type ?? sampleActivities[idx]?.entityType ?? 'user',
        activityType: a.activityType ?? a.activity_type ?? sampleActivities[idx]?.activityType ?? 'activity',
        description: a.description ?? a.reason ?? 'Anomalous pattern detected against baseline',
        score: Math.max(0, Math.min(100, Number(a.score ?? a.anomalyScore ?? 0))),
        timestamp: a.timestamp ?? a.detectedAt ?? new Date().toISOString(),
      }));
    } catch (e) {
      this.anomalies = [];
    } finally {
      this.detecting = false;
    }
  }

  private _formatTimestamp(ts: string): string {
    try {
      const d = new Date(ts);
      const now = Date.now();
      const diff = Math.floor((now - d.getTime()) / 1000);
      if (diff < 60) return `${diff}s ago`;
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return d.toLocaleString();
    } catch {
      return ts;
    }
  }

  private _formatBytes(n: number): string {
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)} GB`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(2)} MB`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(2)} KB`;
    return `${n} B`;
  }

  private _getAnomalySeverity(score: number): 'critical' | 'high' | 'medium' | 'low' {
    if (score >= 85) return 'critical';
    if (score >= 65) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  private _getScoreColor(score: number): string {
    const sev = this._getAnomalySeverity(score);
    return sev === 'critical' ? 'var(--sc-critical)'
      : sev === 'high' ? 'var(--sc-high)'
      : sev === 'medium' ? 'var(--sc-medium)'
      : 'var(--sc-low)';
  }

  private get _activeEntities() {
    return this.baselines.length;
  }

  private get _totalActivities() {
    return this.baselines.reduce((sum, b) => sum + b.totalEvents, 0);
  }

  private get _anomaliesCount() {
    return this.anomalies.filter(a => {
      const ageMs = Date.now() - new Date(a.timestamp).getTime();
      return ageMs <= 24 * 60 * 60 * 1000;
    }).length;
  }

  private get _anomalousRate(): string {
    if (this._totalActivities === 0) return '0.0%';
    return `${((this._anomaliesCount / Math.max(this._totalActivities, 1)) * 100).toFixed(2)}%`;
  }

  private get _entityTypes(): string[] {
    const types = new Set<string>();
    this.anomalies.forEach(a => types.add(a.entityType));
    return Array.from(types).sort();
  }

  private get _filteredAnomalies(): UebaAnomaly[] {
    if (this.entityFilter === 'all') return this.anomalies;
    return this.anomalies.filter(a => a.entityType === this.entityFilter);
  }

  private _renderAnomalyScore(score: number) {
    const sev = this._getAnomalySeverity(score);
    return html`<div class="anomaly-score-pill score-${sev}">${score.toFixed(1)}</div>`;
  }

  private _renderBaselineRow(baseline: UebaBaseline) {
    return html`
      <tr>
        <td><span class="entity-id">${baseline.entityId}</span></td>
        <td><span class="entity-type">${baseline.entityType}</span></td>
        <td>${baseline.activityType}</td>
        <td style="text-align: right; font-weight: 600;">${baseline.totalEvents.toLocaleString()}</td>
        <td style="text-align: right; color: var(--sc-text-muted);">${this._formatBytes(baseline.avgBytesTransferred)}</td>
        <td style="font-size: 11px; color: var(--sc-text-muted);">${this._formatTimestamp(baseline.lastUpdated)}</td>
      </tr>
    `;
  }

  private _renderAnomalyRow(anomaly: UebaAnomaly) {
    const sev = this._getAnomalySeverity(anomaly.score);
    return html`
      <div class="anomaly-row ${sev}">
        <div class="anomaly-cell">${this._renderAnomalyScore(anomaly.score)}</div>
        <div class="anomaly-cell">
          <div class="anomaly-entity">${anomaly.entityId}</div>
          <div class="anomaly-activity">${anomaly.entityType}</div>
        </div>
        <div class="anomaly-cell">
          <span class="entity-type">${anomaly.activityType}</span>
        </div>
        <div class="anomaly-cell">
          <div class="anomaly-desc">${anomaly.description}</div>
        </div>
        <div class="anomaly-cell">
          <div class="anomaly-time">${this._formatTimestamp(anomaly.timestamp)}</div>
        </div>
      </div>
    `;
  }

  private _renderScoreDistribution() {
    const buckets = [
      { label: '0-20', min: 0, max: 20, count: 0, color: 'var(--sc-low)' },
      { label: '20-40', min: 20, max: 40, count: 0, color: 'var(--sc-low)' },
      { label: '40-60', min: 40, max: 60, count: 0, color: 'var(--sc-medium)' },
      { label: '60-80', min: 60, max: 80, count: 0, color: 'var(--sc-high)' },
      { label: '80-100', min: 80, max: 100, count: 0, color: 'var(--sc-critical)' },
    ];
    this.anomalies.forEach(a => {
      const bucket = buckets.find(b => a.score >= b.min && a.score < (b.max === 100 ? 101 : b.max));
      if (bucket) bucket.count += 1;
    });
    const max = Math.max(...buckets.map(b => b.count), 1);
    return html`
      <div class="score-bars">
        ${buckets.map(b => html`
          <div class="score-bar-row">
            <div class="score-bar-label">${b.label}</div>
            <div class="score-bar-track">
              <div class="score-bar-fill" style="width: ${(b.count / max) * 100}%; background: ${b.color}"></div>
            </div>
            <div class="score-bar-value" style="color: ${b.color}">${b.count}</div>
          </div>
        `)}
      </div>
    `;
  }

  render() {
    return html`
      <div class="dashboard" role="main" aria-label="UEBA Dashboard">
        <header class="header">
          <div>
            <h1 class="title"><span>🧠</span> UEBA — Behavior Analytics</h1>
            <div class="subtitle"><span class="live-dot"></span> Live | Updated ${this.lastUpdated.toLocaleTimeString()}</div>
          </div>
          <div class="header-actions">
            <button class="btn" @click=${this._detectAnomalies} ?disabled=${this.detecting}>
              ${this.detecting ? '🔄 Detecting…' : '🔬 Run Detection'}
            </button>
            <button class="btn btn-primary" @click=${this._handleRefresh}>↻ Refresh</button>
          </div>
        </header>

        <div class="stats-row" role="status">
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-body">
              <div class="stat-value" style="color: var(--sc-primary)">${this._activeEntities}</div>
              <div class="stat-label">Active Entities</div>
              <div class="stat-trend">users + hosts with baselines</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-body">
              <div class="stat-value" style="color: var(--sc-medium)">${this._totalActivities.toLocaleString()}</div>
              <div class="stat-label">Total Activities</div>
              <div class="stat-trend">events recorded</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🚨</div>
            <div class="stat-body">
              <div class="stat-value" style="color: var(--sc-critical)">${this._anomaliesCount}</div>
              <div class="stat-label">Anomalies (24h)</div>
              <div class="stat-trend crit">requires review</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⚠️</div>
            <div class="stat-body">
              <div class="stat-value" style="color: var(--sc-high)">${this._anomalousRate}</div>
              <div class="stat-label">Anomalous Rate</div>
              <div class="stat-trend warn">of total activity</div>
            </div>
          </div>
        </div>

        <div class="middle-grid">
          <section class="card" aria-label="Behavior Baselines">
            <div class="card-header">
              <h2 class="card-title">📋 Behavior Baselines</h2>
              <span class="card-meta">${this.baselines.length} entities</span>
            </div>
            ${this.loadingBaselines
              ? html`<div class="loading-state">Loading baselines…</div>`
              : this.baselinesError
                ? html`<div class="error-state">Failed to load baselines: ${this.baselinesError}</div>`
                : this.baselines.length === 0
                  ? html`<div class="empty-state"><div class="empty-state-icon">📭</div>No baselines available</div>`
                  : html`
                    <div class="table-wrap">
                      <table class="data-table">
                        <thead>
                          <tr>
                            <th>Entity ID</th>
                            <th>Type</th>
                            <th>Activity</th>
                            <th style="text-align: right;">Events</th>
                            <th style="text-align: right;">Avg Bytes</th>
                            <th>Last Updated</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${this.baselines.slice(0, 30).map(b => this._renderBaselineRow(b))}
                        </tbody>
                      </table>
                    </div>
                  `}
          </section>

          <section class="card" aria-label="Anomaly Score Distribution">
            <div class="card-header">
              <h2 class="card-title">📈 Score Distribution</h2>
              <span class="card-meta">${this.anomalies.length} anomalies</span>
            </div>
            ${this._renderScoreDistribution()}
          </section>
        </div>

        <section class="card anomalies-section" aria-label="Recent Anomalies">
          <div class="card-header anomalies-meta">
            <h2 class="card-title">🔥 Recent Anomalies</h2>
            <div class="header-actions">
              <select class="select" .value=${this.entityFilter} @change=${(e: Event) => { this.entityFilter = (e.target as HTMLSelectElement).value; }}>
                <option value="all">All entity types</option>
                ${this._entityTypes.map(t => html`<option value=${t}>${t}</option>`)}
              </select>
              <button class="btn" @click=${this._handleRefresh}>↻ Refresh</button>
            </div>
          </div>
          ${this.loadingAnomalies
            ? html`<div class="loading-state">Loading anomalies…</div>`
            : this.anomaliesError
              ? html`<div class="error-state">Failed to load anomalies: ${this.anomaliesError}</div>`
              : this._filteredAnomalies.length === 0
                ? html`<div class="empty-state"><div class="empty-state-icon">✅</div>No anomalies detected</div>`
                : html`
                  <div>
                    ${this._filteredAnomalies.slice(0, 20).map(a => this._renderAnomalyRow(a))}
                  </div>
                `}
        </section>
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-ueba-dashboard': ScUebaDashboard; } }
