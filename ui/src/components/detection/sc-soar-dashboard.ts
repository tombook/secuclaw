import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('sc-soar-dashboard')
export class ScSoarDashboard extends LitElement {
  static styles = css`
    :host { display: block; padding: 16px; background: var(--sc-bg-primary, #0a0f1a); min-height: 100vh; color: var(--sc-text-primary, #f9fafb); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--sc-border, #374151); }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .header-icon { font-size: 22px; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: var(--sc-bg-secondary, #111827); border-radius: 10px; border: 1px solid var(--sc-border, #374151); }
    .header-title { font-size: 20px; font-weight: 600; margin: 0; color: var(--sc-text-primary, #f9fafb); }
    .header-subtitle { font-size: 11px; color: var(--sc-text-muted, #6b7280); margin-top: 2px; display: flex; align-items: center; gap: 6px; }
    .live-dot { width: 8px; height: 8px; background: var(--sc-low, #22c55e); border-radius: 50%; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .header-actions { display: flex; align-items: center; gap: 8px; }
    .btn { padding: 7px 14px; border-radius: 6px; border: 1px solid var(--sc-border, #374151); background: var(--sc-bg-secondary, #111827); color: var(--sc-text-primary, #f9fafb); font-size: 12px; cursor: pointer; transition: all 0.2s; }
    .btn:hover { border-color: var(--sc-primary, #00d4ff); }
    .btn-primary { background: var(--sc-primary, #00d4ff); color: #0f172a; border-color: var(--sc-primary, #00d4ff); font-weight: 600; }
    .btn-primary:hover { filter: brightness(1.1); }
    .filter-select { padding: 7px 10px; border-radius: 6px; border: 1px solid var(--sc-border, #374151); background: var(--sc-bg-secondary, #111827); color: var(--sc-text-primary, #f9fafb); font-size: 12px; cursor: pointer; }
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
    .stat-card { background: var(--sc-bg-secondary, #111827); border: 1px solid var(--sc-border, #374151); border-radius: 8px; padding: 16px; position: relative; overflow: hidden; }
    .stat-card::before { content: ''; position: absolute; top: 0; left: 0; width: 3px; height: 100%; background: var(--accent, var(--sc-primary, #00d4ff)); }
    .stat-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
    .stat-label { font-size: 11px; color: var(--sc-text-muted, #6b7280); text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-icon { font-size: 20px; opacity: 0.8; }
    .stat-value { font-size: 28px; font-weight: 700; color: var(--accent, var(--sc-primary, #00d4ff)); line-height: 1; }
    .stat-meta { font-size: 11px; color: var(--sc-text-muted, #6b7280); margin-top: 6px; }
    .main-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 16px; }
    .panel { background: var(--sc-bg-secondary, #111827); border: 1px solid var(--sc-border, #374151); border-radius: 8px; padding: 14px; }
    .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--sc-border, #374151); }
    .panel-title { font-size: 13px; font-weight: 700; color: var(--sc-text-primary, #f9fafb); display: flex; align-items: center; gap: 6px; margin: 0; }
    .panel-subtitle { font-size: 10px; color: var(--sc-text-muted, #6b7280); margin-left: 6px; }
    .table-wrap { overflow-x: auto; }
    .incidents-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .incidents-table th { text-align: left; padding: 8px 10px; font-size: 10px; text-transform: uppercase; color: var(--sc-text-muted, #6b7280); font-weight: 600; border-bottom: 1px solid var(--sc-border, #374151); letter-spacing: 0.5px; }
    .incidents-table td { padding: 10px; border-bottom: 1px solid var(--sc-border, #374151); vertical-align: middle; }
    .incidents-table tr:hover td { background: rgba(0, 212, 255, 0.04); }
    .incidents-table tr:last-child td { border-bottom: none; }
    .incident-title { font-weight: 600; color: var(--sc-text-primary, #f9fafb); margin-bottom: 2px; }
    .incident-id { font-size: 10px; color: var(--sc-text-muted, #6b7280); font-family: monospace; }
    .mitre-tactics { display: flex; flex-wrap: wrap; gap: 4px; }
    .mitre-tag { font-size: 10px; padding: 2px 6px; border-radius: 3px; background: rgba(0, 212, 255, 0.12); color: var(--sc-primary, #00d4ff); border: 1px solid rgba(0, 212, 255, 0.3); font-family: monospace; }
    .alert-count { display: inline-flex; align-items: center; justify-content: center; min-width: 24px; height: 20px; padding: 0 6px; border-radius: 10px; background: var(--sc-bg-primary, #0a0f1a); color: var(--sc-text-primary, #f9fafb); font-weight: 600; font-size: 11px; }
    .last-seen { font-size: 11px; color: var(--sc-text-muted, #6b7280); }
    .severity-badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; }
    .severity-critical { background: rgba(239, 68, 68, 0.15); color: var(--sc-critical, #ef4444); border: 1px solid rgba(239, 68, 68, 0.4); }
    .severity-high { background: rgba(245, 158, 11, 0.15); color: var(--sc-high, #f59e0b); border: 1px solid rgba(245, 158, 11, 0.4); }
    .severity-medium { background: rgba(59, 130, 246, 0.15); color: var(--sc-medium, #3b82f6); border: 1px solid rgba(59, 130, 246, 0.4); }
    .severity-low { background: rgba(34, 197, 94, 0.15); color: var(--sc-low, #22c55e); border: 1px solid rgba(34, 197, 94, 0.4); }
    .severity-info { background: rgba(107, 114, 128, 0.15); color: var(--sc-info, #6b7280); border: 1px solid rgba(107, 114, 128, 0.4); }
    .status-badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
    .status-open { background: rgba(239, 68, 68, 0.15); color: var(--sc-critical, #ef4444); border: 1px solid rgba(239, 68, 68, 0.3); }
    .status-investigating { background: rgba(245, 158, 11, 0.15); color: var(--sc-high, #f59e0b); border: 1px solid rgba(245, 158, 11, 0.3); }
    .status-contained { background: rgba(59, 130, 246, 0.15); color: var(--sc-medium, #3b82f6); border: 1px solid rgba(59, 130, 246, 0.3); }
    .status-closed { background: rgba(34, 197, 94, 0.15); color: var(--sc-low, #22c55e); border: 1px solid rgba(34, 197, 94, 0.3); }
    .action-btn { padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: 600; border: 1px solid var(--sc-border, #374151); background: var(--sc-bg-primary, #0a0f1a); color: var(--sc-text-primary, #f9fafb); cursor: pointer; transition: all 0.2s; }
    .action-btn:hover { border-color: var(--sc-primary, #00d4ff); color: var(--sc-primary, #00d4ff); }
    .rules-list { display: flex; flex-direction: column; gap: 8px; max-height: 480px; overflow-y: auto; }
    .rule-item { padding: 10px; background: var(--sc-bg-primary, #0a0f1a); border: 1px solid var(--sc-border, #374151); border-radius: 6px; border-left: 3px solid var(--sc-primary, #00d4ff); transition: all 0.2s; }
    .rule-item:hover { border-color: var(--sc-primary, #00d4ff); }
    .rule-item.muted { opacity: 0.6; border-left-color: var(--sc-text-muted, #6b7280); }
    .rule-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
    .rule-name { font-size: 12px; font-weight: 600; color: var(--sc-text-primary, #f9fafb); }
    .rule-matches { font-size: 10px; padding: 2px 6px; border-radius: 3px; background: rgba(0, 212, 255, 0.15); color: var(--sc-primary, #00d4ff); font-weight: 600; min-width: 28px; text-align: center; }
    .rule-matches.zero { background: rgba(107, 114, 128, 0.15); color: var(--sc-info, #6b7280); }
    .rule-desc { font-size: 11px; color: var(--sc-text-muted, #6b7280); line-height: 1.4; margin-top: 2px; }
    .rule-meta { display: flex; gap: 8px; margin-top: 6px; font-size: 10px; color: var(--sc-text-muted, #6b7280); }
    .rule-meta span { display: flex; align-items: center; gap: 3px; }
    .alerts-stream { display: flex; flex-direction: column; gap: 6px; max-height: 360px; overflow-y: auto; }
    .stream-item { display: grid; grid-template-columns: 90px 110px 1fr auto; gap: 12px; align-items: center; padding: 8px 12px; background: var(--sc-bg-primary, #0a0f1a); border: 1px solid var(--sc-border, #374151); border-radius: 6px; font-size: 12px; }
    .stream-item:hover { border-color: var(--sc-primary, #00d4ff); }
    .stream-time { font-size: 10px; color: var(--sc-text-muted, #6b7280); font-family: monospace; }
    .stream-source { font-size: 11px; color: var(--sc-text-primary, #f9fafb); display: flex; align-items: center; gap: 4px; }
    .stream-type { font-size: 11px; color: var(--sc-text-primary, #f9fafb); font-weight: 500; }
    .stream-type-meta { font-size: 10px; color: var(--sc-text-muted, #6b7280); margin-top: 2px; }
    .empty-state { padding: 40px 20px; text-align: center; color: var(--sc-text-muted, #6b7280); font-size: 12px; }
    .empty-state-icon { font-size: 32px; margin-bottom: 8px; opacity: 0.5; }
    .loading-state { padding: 40px 20px; text-align: center; color: var(--sc-text-muted, #6b7280); font-size: 12px; }
    .error-state { padding: 12px 16px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 6px; color: var(--sc-critical, #ef4444); font-size: 12px; margin-bottom: 12px; }
    @media (max-width: 1100px) { .main-grid { grid-template-columns: 1fr; } .stats-row { grid-template-columns: repeat(2, 1fr); } }
  `;

  @state() private stats = { total: 0, criticalHigh: 0, open: 0, chains: 0 };
  @state() private incidents: any[] = [];
  @state() private rules: any[] = [];
  @state() private recentAlerts: any[] = [];
  @state() private loading = false;
  @state() private error: string | null = null;
  @state() private severityFilter = 'all';

  private apiBase = 'http://127.0.0.1:21981/api/v1/soar-engine';
  private refreshTimer: number | null = null;

  connectedCallback() {
    super.connectedCallback();
    this._loadStats();
    this._loadIncidents();
    this._loadCorrelationRules();
    this._loadRecentAlerts();
    this.refreshTimer = window.setInterval(() => {
      this._loadStats();
      this._loadIncidents();
      this._loadRecentAlerts();
    }, 30000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private async _fetchJson(path: string): Promise<any> {
    const res = await fetch(`${this.apiBase}${path}`);
    if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
    return res.json();
  }

  private async _loadStats() {
    try {
      const data = await this._fetchJson('.stats');
      this.stats = {
        total: data?.total_incidents ?? data?.total ?? 0,
        criticalHigh: data?.critical_high ?? data?.criticalHighCount ?? ((data?.by_severity?.critical ?? 0) + (data?.by_severity?.high ?? 0)),
        open: data?.open ?? data?.open_count ?? 0,
        chains: data?.attack_chains ?? data?.chains ?? 0,
      };
    } catch (e: any) {
      this.stats = { total: 0, criticalHigh: 0, open: 0, chains: 0 };
    }
  }

  private async _loadIncidents() {
    this.loading = true;
    this.error = null;
    try {
      const sev = this.severityFilter !== 'all' ? `?severity=${this.severityFilter}` : '';
      const data = await this._fetchJson(`.incidents.list${sev}`);
      const list = data?.incidents ?? data?.items ?? data ?? [];
      this.incidents = Array.isArray(list) ? list : [];
    } catch (e: any) {
      this.error = e?.message || 'Failed to load incidents';
      this.incidents = [];
    } finally {
      this.loading = false;
    }
  }

  private async _loadCorrelationRules() {
    try {
      const data = await this._fetchJson('.correlation.rules');
      const list = data?.rules ?? data?.items ?? data ?? [];
      this.rules = Array.isArray(list) ? list : [];
    } catch (e) {
      this.rules = [];
    }
  }

  private async _loadRecentAlerts() {
    try {
      const data = await this._fetchJson('.alerts.recent?limit=10');
      const list = data?.alerts ?? data?.items ?? data ?? [];
      this.recentAlerts = Array.isArray(list) ? list.slice(0, 10) : [];
    } catch (e) {
      this.recentAlerts = [];
    }
  }

  private _handleRefresh() {
    this._loadStats();
    this._loadIncidents();
    this._loadCorrelationRules();
    this._loadRecentAlerts();
  }

  private _handleSeverityChange(e: Event) {
    const value = (e.target as HTMLSelectElement).value;
    this.severityFilter = value;
    this._loadIncidents();
  }

  private _formatTime(ts: string | number | undefined): string {
    if (!ts) return '—';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return String(ts);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleString();
  }

  private _formatClock(ts: string | number | undefined): string {
    if (!ts) return '--:--:--';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '--:--:--';
    return d.toLocaleTimeString();
  }

  private _renderSeverityBadge(severity: string) {
    const sev = (severity || 'info').toLowerCase();
    return html`<span class="severity-badge severity-${sev}">${sev}</span>`;
  }

  private _renderStatusBadge(status: string) {
    const s = (status || 'open').toLowerCase().replace(/\s+/g, '-');
    const cls = ['open', 'investigating', 'contained', 'closed'].includes(s) ? `status-${s}` : 'status-open';
    return html`<span class="status-badge ${cls}">${status || 'open'}</span>`;
  }

  private _renderIncident(incident: any) {
    const id = incident?.id ?? incident?.incident_id ?? '—';
    const title = incident?.title ?? incident?.name ?? 'Untitled Incident';
    const severity = incident?.severity ?? 'info';
    const mitre = incident?.mitre_tactics ?? incident?.tactics ?? incident?.mitre ?? [];
    const alertCount = incident?.alert_count ?? incident?.alerts ?? incident?.events ?? 0;
    const lastSeen = incident?.last_seen ?? incident?.updated_at ?? incident?.timestamp;
    const status = incident?.status ?? 'open';
    return html`
      <tr>
        <td>${this._renderSeverityBadge(severity)}</td>
        <td>
          <div class="incident-title">${title}</div>
          <div class="incident-id">#${id}</div>
        </td>
        <td>
          <div class="mitre-tactics">
            ${(Array.isArray(mitre) ? mitre : []).slice(0, 4).map((t: string) => html`<span class="mitre-tag">${t}</span>`)}
            ${Array.isArray(mitre) && mitre.length > 4 ? html`<span class="mitre-tag">+${mitre.length - 4}</span>` : ''}
          </div>
        </td>
        <td><span class="alert-count">${alertCount}</span></td>
        <td><span class="last-seen">${this._formatTime(lastSeen)}</span></td>
        <td>${this._renderStatusBadge(status)}</td>
        <td><button class="action-btn" @click=${() => this._handleAction(id)}>Investigate</button></td>
      </tr>
    `;
  }

  private _handleAction(incidentId: string | number) {
    this.dispatchEvent(new CustomEvent('incident-select', {
      detail: { id: incidentId },
      bubbles: true,
      composed: true,
    }));
  }

  private _renderIncidentsTable() {
    if (this.loading && this.incidents.length === 0) {
      return html`<div class="loading-state">Loading incidents…</div>`;
    }
    if (this.incidents.length === 0) {
      return html`
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <div>No incidents found${this.severityFilter !== 'all' ? ` with severity "${this.severityFilter}"` : ''}</div>
        </div>
      `;
    }
    return html`
      <div class="table-wrap">
        <table class="incidents-table">
          <thead>
            <tr>
              <th>Severity</th>
              <th>Incident</th>
              <th>MITRE Tactics</th>
              <th>Alerts</th>
              <th>Last Seen</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${this.incidents.map(i => this._renderIncident(i))}
          </tbody>
        </table>
      </div>
    `;
  }

  private _renderRulesList() {
    if (this.rules.length === 0) {
      return html`
        <div class="empty-state">
          <div class="empty-state-icon">📜</div>
          <div>No correlation rules configured</div>
        </div>
      `;
    }
    return html`
      <div class="rules-list" role="list">
        ${this.rules.map(rule => {
          const matches = rule?.matches ?? rule?.match_count ?? rule?.hits ?? 0;
          const name = rule?.name ?? rule?.rule_name ?? 'Unnamed Rule';
          const desc = rule?.description ?? rule?.desc ?? '';
          const enabled = rule?.enabled ?? true;
          const tactic = rule?.tactic ?? rule?.mitre_tactic ?? '';
          const severity = rule?.severity ?? '';
          return html`
            <div class="rule-item ${enabled ? '' : 'muted'}" role="listitem">
              <div class="rule-header">
                <div class="rule-name">${name}</div>
                <div class="rule-matches ${matches === 0 ? 'zero' : ''}">${matches}</div>
              </div>
              <div class="rule-desc">${desc}</div>
              ${(tactic || severity) ? html`
                <div class="rule-meta">
                  ${tactic ? html`<span>🎯 ${tactic}</span>` : ''}
                  ${severity ? html`<span>⚠️ ${severity}</span>` : ''}
                  ${enabled ? '' : html`<span>⏸️ disabled</span>`}
                </div>
              ` : ''}
            </div>
          `;
        })}
      </div>
    `;
  }

  private _renderRecentAlerts() {
    if (this.recentAlerts.length === 0) {
      return html`
        <div class="empty-state">
          <div class="empty-state-icon">🔕</div>
          <div>No recent alerts</div>
        </div>
      `;
    }
    return html`
      <div class="alerts-stream" role="log" aria-live="polite">
        ${this.recentAlerts.map(alert => {
          const ts = alert?.timestamp ?? alert?.ts ?? alert?.created_at;
          const source = alert?.source ?? alert?.source_system ?? alert?.origin ?? 'unknown';
          const type = alert?.alert_type ?? alert?.type ?? alert?.rule ?? 'Alert';
          const detail = alert?.detail ?? alert?.description ?? alert?.message ?? '';
          const severity = alert?.severity ?? 'info';
          return html`
            <div class="stream-item">
              <div class="stream-time">${this._formatClock(ts)}</div>
              <div class="stream-source">📡 ${source}</div>
              <div>
                <div class="stream-type">${type}</div>
                ${detail ? html`<div class="stream-type-meta">${detail}</div>` : ''}
              </div>
              ${this._renderSeverityBadge(severity)}
            </div>
          `;
        })}
      </div>
    `;
  }

  render() {
    return html`
      <div role="main" aria-label="SOAR Dashboard">
        <div class="header">
          <div class="header-left">
            <div class="header-icon">🛡️</div>
            <div>
              <h1 class="header-title">SOAR Command Center</h1>
              <div class="header-subtitle"><span class="live-dot"></span> Live correlation & response orchestration</div>
            </div>
          </div>
          <div class="header-actions">
            <select class="filter-select" @change=${this._handleSeverityChange} .value=${this.severityFilter} aria-label="Filter by severity">
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="info">Info</option>
            </select>
            <button class="btn" @click=${this._handleRefresh} aria-label="Refresh">🔄 Refresh</button>
            <button class="btn btn-primary">+ New Playbook</button>
          </div>
        </div>

        ${this.error ? html`<div class="error-state" role="alert">⚠️ ${this.error}</div>` : ''}

        <div class="stats-row" role="status">
          <div class="stat-card" style="--accent: var(--sc-primary, #00d4ff);">
            <div class="stat-header">
              <div class="stat-label">Total Incidents</div>
              <div class="stat-icon">📊</div>
            </div>
            <div class="stat-value">${this.stats.total}</div>
            <div class="stat-meta">All time tracked</div>
          </div>
          <div class="stat-card" style="--accent: var(--sc-critical, #ef4444);">
            <div class="stat-header">
              <div class="stat-label">Critical / High</div>
              <div class="stat-icon">🔥</div>
            </div>
            <div class="stat-value">${this.stats.criticalHigh}</div>
            <div class="stat-meta">High-priority threats</div>
          </div>
          <div class="stat-card" style="--accent: var(--sc-high, #f59e0b);">
            <div class="stat-header">
              <div class="stat-label">Open Incidents</div>
              <div class="stat-icon">⏳</div>
            </div>
            <div class="stat-value">${this.stats.open}</div>
            <div class="stat-meta">Awaiting triage</div>
          </div>
          <div class="stat-card" style="--accent: var(--sc-medium, #3b82f6);">
            <div class="stat-header">
              <div class="stat-label">Attack Chains</div>
              <div class="stat-icon">⛓️</div>
            </div>
            <div class="stat-value">${this.stats.chains}</div>
            <div class="stat-meta">Multi-stage campaigns</div>
          </div>
        </div>

        <div class="main-grid">
          <section class="panel" aria-label="Incidents">
            <div class="panel-header">
              <h2 class="panel-title">🚨 Incidents <span class="panel-subtitle">${this.incidents.length} record${this.incidents.length === 1 ? '' : 's'}</span></h2>
            </div>
            ${this._renderIncidentsTable()}
          </section>
          <aside class="panel" aria-label="Correlation Rules">
            <div class="panel-header">
              <h2 class="panel-title">🔗 Correlation Rules <span class="panel-subtitle">${this.rules.length} active</span></h2>
            </div>
            ${this._renderRulesList()}
          </aside>
        </div>

        <section class="panel" aria-label="Recent Alerts Stream">
          <div class="panel-header">
            <h2 class="panel-title">📡 Recent Alerts <span class="panel-subtitle">Last 10 events</span></h2>
          </div>
          ${this._renderRecentAlerts()}
        </section>
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-soar-dashboard': ScSoarDashboard; } }
