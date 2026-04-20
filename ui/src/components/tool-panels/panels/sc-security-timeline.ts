/**
 * sc-security-timeline — 安全事件时间线
 * 
 * Phase 2 进化：可视化时间线视图
 * 对应 SKILL.md security-expert 的 security-timeline 可视化定义
 * 支持：按类别着色、缩放、点击查看详情
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

/* ─── Types ──────────────────────────────────────── */

interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  category: 'attack' | 'detection' | 'response' | 'vulnerability' | 'compliance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  detail: string;
  source: string;
}

/* ─── Mock Data ──────────────────────────────────── */

const MOCK_EVENTS: TimelineEvent[] = [
  { id: 'evt-001', timestamp: '2026-04-21 03:15', title: 'Brute force attack detected', category: 'attack', severity: 'high', detail: '1,247 failed login attempts from 45.33.xx.xx targeting SSH service on prod-server-01', source: 'SIEM' },
  { id: 'evt-002', timestamp: '2026-04-21 03:18', title: 'Auto-block triggered', category: 'response', severity: 'medium', detail: 'Source IP blocked via SOAR playbook. Firewall rule added.', source: 'SOAR' },
  { id: 'evt-003', timestamp: '2026-04-21 02:45', title: 'CVE-2026-1234 exploited', category: 'vulnerability', severity: 'critical', detail: 'Apache Log4j2 RCE actively exploited on web-prod-01. Evidence of reverse shell execution.', source: 'EDR' },
  { id: 'evt-004', timestamp: '2026-04-21 02:50', title: 'Lateral movement detected', category: 'attack', severity: 'critical', detail: 'Suspicious SMB traffic from web-prod-01 to db-master-01. Credential reuse detected.', source: 'NDR' },
  { id: 'evt-005', timestamp: '2026-04-21 02:55', title: 'Isolation initiated', category: 'response', severity: 'high', detail: 'web-prod-01 isolated from network. Traffic redirect to honeypot.', source: 'SOAR' },
  { id: 'evt-006', timestamp: '2026-04-21 01:30', title: 'Phishing campaign identified', category: 'attack', severity: 'high', detail: 'Mass phishing email targeting 200+ employees. 23 clicks detected, 3 credential submissions.', source: 'Email Gateway' },
  { id: 'evt-007', timestamp: '2026-04-21 01:35', title: 'Credential reset enforced', category: 'response', severity: 'medium', detail: 'MFA challenge triggered for affected accounts. 3 accounts locked.', source: 'IAM' },
  { id: 'evt-008', timestamp: '2026-04-20 23:00', title: 'GDPR audit finding', category: 'compliance', severity: 'medium', detail: 'Quarterly GDPR audit found 2 DPIA assessments overdue.', source: 'GRC' },
  { id: 'evt-009', timestamp: '2026-04-20 22:15', title: 'New vulnerability scan completed', category: 'vulnerability', severity: 'high', detail: 'Full scan found 4 critical, 12 high, 34 medium vulnerabilities.', source: 'Qualys' },
  { id: 'evt-010', timestamp: '2026-04-20 20:00', title: 'Anomalous data transfer', category: 'attack', severity: 'critical', detail: '50GB exfiltration from db-replica-01 to external IP via DNS tunneling.', source: 'DLP' },
  { id: 'evt-011', timestamp: '2026-04-20 20:05', title: 'DNS anomaly alert', category: 'detection', severity: 'high', detail: 'Unusual DNS query volume detected from db-replica-01. 15,000 TXT queries in 30 min.', source: 'DNS Monitor' },
  { id: 'evt-012', timestamp: '2026-04-20 20:10', title: 'Incident P0 declared', category: 'response', severity: 'critical', detail: 'IR team activated. War room opened. CISO notified.', source: 'IR Platform' },
  { id: 'evt-013', timestamp: '2026-04-20 18:30', title: 'Patch deployment completed', category: 'response', severity: 'low', detail: 'Critical patches deployed to 95% of endpoints. 12 devices pending reboot.', source: 'Patch Mgmt' },
  { id: 'evt-014', timestamp: '2026-04-20 16:00', title: 'Threat intel feed update', category: 'detection', severity: 'medium', detail: 'Updated IOCs from APT28 campaign added to detection rules.', source: 'Threat Intel' },
  { id: 'evt-015', timestamp: '2026-04-20 14:00', title: 'Penetration test report', category: 'compliance', severity: 'high', detail: 'Quarterly pentest completed. Domain admin compromised in 48h. Golden Ticket persistence.', source: 'Pentest Team' },
];

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  attack: { icon: '⚔️', color: '#ef4444', label: 'Attack' },
  detection: { icon: '🔍', color: '#3b82f6', label: 'Detection' },
  response: { icon: '🛡️', color: '#22c55e', label: 'Response' },
  vulnerability: { icon: '🐛', color: '#f97316', label: 'Vulnerability' },
  compliance: { icon: '📋', color: '#8b5cf6', label: 'Compliance' },
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#dc2626',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

/* ─── Component ──────────────────────────────────── */

@customElement('sc-security-timeline')
export class ScSecurityTimeline extends LitElement {

  static styles = css`
    :host {
      display: block;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: #e2e8f0;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    .timeline-container {
      background: #111827;
      border-radius: 12px;
      padding: 20px;
    }

    /* Header */
    .timeline-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .timeline-header h4 {
      font-size: 16px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .category-filters {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .cat-filter {
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid #374151;
      background: transparent;
      color: #94a3b8;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .cat-filter:hover { border-color: #60a5fa; }
    .cat-filter.active { border-color: currentColor; font-weight: 600; }

    /* Stats bar */
    .stats-bar {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
      padding: 12px 16px;
      background: #0a0e17;
      border-radius: 8px;
    }
    .stat-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .stat-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .stat-value { font-size: 16px; font-weight: 700; }
    .stat-label { font-size: 11px; color: #94a3b8; }

    /* Timeline */
    .timeline {
      position: relative;
      padding-left: 32px;
    }
    .timeline::before {
      content: '';
      position: absolute;
      left: 11px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: linear-gradient(to bottom, #374151, #1e293b);
    }

    .tl-item {
      position: relative;
      padding: 0 0 24px 20px;
      cursor: pointer;
    }
    .tl-item:last-child { padding-bottom: 0; }

    /* Timeline dot */
    .tl-dot {
      position: absolute;
      left: -27px;
      top: 4px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      border: 2px solid;
      z-index: 1;
      transition: transform 0.2s;
    }
    .tl-item:hover .tl-dot { transform: scale(1.2); }

    /* Event card */
    .tl-card {
      background: #1f2937;
      border-radius: 8px;
      padding: 14px 16px;
      transition: all 0.2s;
      border: 1px solid transparent;
    }
    .tl-item:hover .tl-card { border-color: #374151; transform: translateX(4px); }
    .tl-item.selected .tl-card { border-color: #f59e0b; background: #1a1f2e; }

    .tl-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .tl-title {
      font-size: 14px;
      font-weight: 600;
    }
    .tl-time {
      font-size: 11px;
      color: #6b7280;
      font-family: 'JetBrains Mono', monospace;
      white-space: nowrap;
    }
    .tl-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    .tl-category {
      font-size: 11px;
      padding: 1px 6px;
      border-radius: 3px;
      font-weight: 600;
    }
    .tl-severity {
      font-size: 10px;
      padding: 1px 6px;
      border-radius: 3px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .tl-severity.critical { background: #450a0a; color: #fca5a5; }
    .tl-severity.high { background: #431407; color: #fdba74; }
    .tl-severity.medium { background: #422006; color: #fde047; }
    .tl-severity.low { background: #052e16; color: #86efac; }

    .tl-source {
      font-size: 11px;
      color: #6b7280;
    }
    .tl-detail {
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.5;
      margin-top: 6px;
      display: none;
    }
    .tl-item.selected .tl-detail,
    .tl-item.expanded .tl-detail {
      display: block;
    }

    .empty-timeline {
      text-align: center;
      padding: 60px 20px;
      color: #6b7280;
    }
  `;

  /* ─── State ──────────────────────────────────── */

  @state() private _selectedId = '';
  @state() private _expandedId = '';
  @state() private _activeCategories = new Set(['attack', 'detection', 'response', 'vulnerability', 'compliance']);

  /* ─── Handlers ───────────────────────────────── */

  private _toggleCategory(cat: string) {
    const newSet = new Set(this._activeCategories);
    if (newSet.has(cat)) {
      if (newSet.size > 1) newSet.delete(cat); // keep at least one
    } else {
      newSet.add(cat);
    }
    this._activeCategories = newSet;
  }

  private _selectEvent(id: string) {
    this._expandedId = this._expandedId === id ? '' : id;
    this._selectedId = id;
  }

  /* ─── Render ─────────────────────────────────── */

  render() {
    const events = MOCK_EVENTS.filter(e => this._activeCategories.has(e.category));

    // Stats
    const stats = events.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return html`
      <div class="timeline-container">
        <div class="timeline-header">
          <h4>📅 Security Event Timeline</h4>
          <div class="category-filters">
            ${Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => html`
              <button
                class="cat-filter ${this._activeCategories.has(key) ? 'active' : ''}"
                style="${this._activeCategories.has(key) ? `color:${cfg.color};border-color:${cfg.color}` : ''}"
                @click=${() => this._toggleCategory(key)}
              >
                ${cfg.icon} ${cfg.label} (${stats[key] || 0})
              </button>
            `)}
          </div>
        </div>

        <!-- Stats Bar -->
        <div class="stats-bar">
          ${['critical', 'high', 'medium', 'low'].map(sev => {
            const count = events.filter(e => e.severity === sev).length;
            return html`
              <div class="stat-item">
                <div class="stat-dot" style="background:${SEVERITY_COLORS[sev]}"></div>
                <div>
                  <div class="stat-value" style="color:${SEVERITY_COLORS[sev]}">${count}</div>
                  <div class="stat-label">${sev}</div>
                </div>
              </div>
            `;
          })}
        </div>

        <!-- Timeline -->
        ${events.length > 0 ? html`
          <div class="timeline">
            ${events.map(evt => {
              const catCfg = CATEGORY_CONFIG[evt.category];
              const isSelected = this._expandedId === evt.id;
              return html`
                <div
                  class="tl-item ${isSelected ? 'selected expanded' : ''} ${this._selectedId === evt.id ? 'selected' : ''}"
                  @click=${() => this._selectEvent(evt.id)}
                >
                  <div class="tl-dot" style="border-color:${catCfg.color};background:${catCfg.color}22">
                    <span style="font-size:10px">${catCfg.icon}</span>
                  </div>
                  <div class="tl-card">
                    <div class="tl-card-header">
                      <span class="tl-title">${evt.title}</span>
                      <span class="tl-time">${evt.timestamp}</span>
                    </div>
                    <div class="tl-meta">
                      <span class="tl-category" style="background:${catCfg.color}22;color:${catCfg.color}">${catCfg.label}</span>
                      <span class="tl-severity ${evt.severity}">${evt.severity}</span>
                      <span class="tl-source">📡 ${evt.source}</span>
                    </div>
                    <div class="tl-detail">${evt.detail}</div>
                  </div>
                </div>
              `;
            })}
          </div>
        ` : html`
          <div class="empty-timeline">
            <div style="font-size:48px;margin-bottom:12px">📭</div>
            <div>No events match selected filters</div>
          </div>
        `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-security-timeline': ScSecurityTimeline;
  }
}
