/**
 * SecuClaw Incident Response Workflow Component
 * Automated IR workflow with playbooks, escalation, and timeline
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

export interface Incident {
  id: string; title: string; severity: string; status: string; assignee: string;
  createdAt: string; updatedAt: string; category: string; description: string;
  timeline: TimelineEvent[]; playbook?: string; escalation?: EscalationLevel;
}

export interface TimelineEvent { id: string; timestamp: string; type: string; user: string; action: string; details?: string; }
export interface EscalationLevel { level: number; name: string; team: string; notified: string; }

@customElement('sc-incident-response-workflow')
export class ScIncidentResponseWorkflow extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: var(--text-primary, #e2e8f0); }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: var(--bg-primary, #111827); border-radius: 12px; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .title { font-size: 16px; font-weight: 700; }
    .incidents-list { max-height: 500px; overflow-y: auto; }
    .incident-card { background: var(--bg-secondary, #1f2937); border-radius: 8px; padding: 14px; margin-bottom: 10px; cursor: pointer; border-left: 4px solid; transition: all 0.2s; }
    .incident-card:hover { transform: translateX(4px); }
    .incident-card.critical { border-color: #ef4444; }
    .incident-card.high { border-color: #f97316; }
    .incident-card.medium { border-color: #eab308; }
    .incident-card.low { border-color: #3b82f6; }
    .incident-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
    .incident-id { font-size: 11px; color: #94a3b8; }
    .incident-title { font-size: 14px; font-weight: 600; flex: 1; }
    .status-badge { padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .status-new { background: #1e3a5f; color: #93c5fd; }
    .status-investigating { background: #422006; color: #fde047; }
    .status-contained { background: #172554; color: #60a5fa; }
    .status-resolved { background: #052e16; color: #86efac; }
    .incident-meta { display: flex; gap: 12px; font-size: 11px; color: #94a3b8; margin-bottom: 8px; }
    .sev-badge { padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: 600; text-transform: uppercase; }
    .sev-critical { background: #450a0a; color: #fca5a5; }
    .sev-high { background: #431407; color: #fdba74; }
    .sev-medium { background: #422006; color: #fde047; }
    .sev-low { background: #172554; color: #93c5fd; }
    .timeline { border-left: 2px solid var(--border-color, #374151); padding-left: 16px; margin-top: 12px; margin-left: 8px; }
    .timeline-item { position: relative; padding-bottom: 16px; }
    .timeline-item::before { content: ''; position: absolute; left: -21px; top: 0; width: 10px; height: 10px; border-radius: 50%; background: #3b82f6; }
    .timeline-item.action::before { background: #22c55e; }
    .timeline-item.escalation::before { background: #f97316; }
    .timeline-item.alert::before { background: #ef4444; }
    .timeline-time { font-size: 10px; color: #94a3b8; }
    .timeline-action { font-size: 12px; font-weight: 600; margin: 2px 0; }
    .timeline-details { font-size: 11px; color: #cbd5e1; }
    .playbook { background: var(--bg-tertiary, #0a0e17); border-radius: 6px; padding: 12px; margin-top: 12px; }
    .playbook-step { display: flex; gap: 10px; padding: 8px 0; border-bottom: 1px solid #1f2937; }
    .playbook-step:last-child { border-bottom: none; }
    .step-num { width: 24px; height: 24px; border-radius: 50%; background: #3b82f6; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; flex-shrink: 0; }
    .step-content { flex: 1; }
    .step-title { font-size: 13px; font-weight: 600; }
    .step-desc { font-size: 11px; color: #94a3b8; }
    .escalation-matrix { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 12px; }
    .esc-level { background: var(--bg-tertiary, #0a0e17); border-radius: 6px; padding: 10px; text-align: center; }
    .esc-level.active { border: 2px solid #3b82f6; }
    .esc-level.current { border: 2px solid #22c55e; }
    .esc-name { font-size: 12px; font-weight: 600; }
    .esc-team { font-size: 10px; color: #94a3b8; }
    .esc-ttr { font-size: 11px; margin-top: 4px; color: #22c55e; }
    .btn { padding: 8px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid var(--border-color, #374151); background: var(--bg-secondary, #1f2937); color: var(--text-primary, #e2e8f0); }
    .btn.primary { background: #059669; border-color: #059669; color: white; }
    .btn.danger { background: #dc2626; border-color: #dc2626; color: white; }
    .filters { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
    .filter-btn { padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; cursor: pointer; background: var(--bg-secondary, #1f2937); border: 1px solid var(--border-color, #374151); }
    .filter-btn.active { background: #3b82f6; border-color: #3b82f6; color: white; }
  `;

  @state() private selectedIncident: Incident | null = null;
  @state() private statusFilter = 'all';
  @state() private view: 'list' | 'detail' = 'list';

  private incidents: Incident[] = [
    { id: 'INC-2024-0147', title: 'Suspected Ransomware Activity', severity: 'critical', status: 'investigating', assignee: 'IR Team Alpha', createdAt: '2024-04-20 14:32', updatedAt: '2024-04-20 15:45', category: 'Malware', description: 'Multiple endpoints showing signs of encryption activity. File servers experiencing unusual I/O patterns.',
      timeline: [
        { id: 't1', timestamp: '14:32', type: 'alert', user: 'EDR System', action: 'Alert triggered', details: 'Unusual file encryption detected on 5 endpoints' },
        { id: 't2', timestamp: '14:35', type: 'action', user: 'SOC Analyst', action: 'Initial triage', details: 'Confirmed suspicious activity, escalating to IR' },
        { id: 't3', timestamp: '14:40', type: 'escalation', user: 'IR Lead', action: 'Incident declared', details: 'Severity upgraded to Critical' },
        { id: 't4', timestamp: '14:50', type: 'action', user: 'Security Engineer', action: 'Isolated affected endpoints', details: 'Network segmentation applied' },
        { id: 't5', timestamp: '15:30', type: 'action', user: 'IR Team', action: 'Evidence collection started', details: 'Memory dumps and logs captured' },
      ],
      playbook: 'ransomware-response', escalation: { level: 3, name: 'War Room', team: 'Executive + IR + Legal', notified: '15:00' }
    },
    { id: 'INC-2024-0146', title: 'Phishing Campaign Targeting Finance', severity: 'high', status: 'contained', assignee: 'SOC Team', createdAt: '2024-04-20 09:15', updatedAt: '2024-04-20 12:30', category: 'Phishing', description: 'Targeted phishing emails identified. 12 users clicked links, 3 submitted credentials.',
      timeline: [
        { id: 't1', timestamp: '09:15', type: 'alert', user: 'Email Gateway', action: 'Suspicious emails detected' },
        { id: 't2', timestamp: '09:20', type: 'action', user: 'SOC Analyst', action: 'URLs blocked', details: 'Malicious URLs added to blocklist' },
        { id: 't3', timestamp: '09:45', type: 'action', user: 'SOC Lead', action: 'Password reset enforced', details: 'Affected accounts secured' },
        { id: 't4', timestamp: '11:00', type: 'action', user: 'IR Team', action: 'Forensic analysis complete' },
        { id: 't5', timestamp: '12:30', type: 'action', user: 'SOC Lead', action: 'Incident contained', details: 'No further compromise detected' },
      ],
      playbook: 'phishing-response', escalation: { level: 2, name: 'IR Team', team: 'Incident Response', notified: '09:30' }
    },
    { id: 'INC-2024-0145', title: 'Unauthorized Access Attempt', severity: 'medium', status: 'new', assignee: 'Unassigned', createdAt: '2024-04-20 08:00', updatedAt: '2024-04-20 08:00', category: 'Unauthorized Access', description: 'Multiple failed login attempts detected from foreign IP addresses targeting admin accounts.',
      timeline: [
        { id: 't1', timestamp: '08:00', type: 'alert', user: 'SIEM', action: 'Brute force attempt detected', details: '200+ failed attempts in 10 minutes' },
      ],
      playbook: 'brute-force-response'
    },
    { id: 'INC-2024-0144', title: 'Data Exfiltration Alert', severity: 'high', status: 'resolved', assignee: 'IR Team Beta', createdAt: '2024-04-19 22:15', updatedAt: '2024-04-20 06:00', category: 'Data Loss', description: 'Large data transfer detected after hours. Investigation revealed legitimate backup activity.',
      timeline: [
        { id: 't1', timestamp: '22:15', type: 'alert', user: 'DLP System', action: 'Large transfer flagged' },
        { id: 't2', timestamp: '22:20', type: 'action', user: 'On-call Analyst', action: 'Transfer blocked temporarily' },
        { id: 't3', timestamp: '22:45', type: 'action', user: 'IT Manager', action: 'Verified as backup job', details: 'Approved transfer to continue' },
        { id: 't4', timestamp: '06:00', type: 'action', user: 'IR Lead', action: 'Incident closed', details: 'False positive - legitimate activity' },
      ],
      playbook: 'dlp-alert-response', escalation: { level: 1, name: 'SOC Team', team: 'Security Operations', notified: '22:20' }
    }
  ];

  private playbooks: Record<string, { steps: { title: string; desc: string }[]; sla: string }> = {
    'ransomware-response': {
      steps: [
        { title: 'Containment', desc: 'Isolate affected systems from network immediately' },
        { title: 'Assessment', desc: 'Identify scope of infection and encryption progress' },
        { title: 'Evidence Collection', desc: 'Capture memory dumps, logs, and affected files' },
        { title: 'Communication', desc: 'Notify stakeholders and prepare public statements' },
        { title: 'Recovery', desc: 'Restore from clean backups, verify integrity' },
        { title: 'Post-Incident', desc: 'Root cause analysis and lessons learned' }
      ],
      sla: '1 hour'
    },
    'phishing-response': {
      steps: [
        { title: 'Email Analysis', desc: 'Extract indicators and analyze payload' },
        { title: 'URL Blocking', desc: 'Block malicious URLs across all security layers' },
        { title: 'User Notification', desc: 'Alert affected users and provide guidance' },
        { title: 'Credential Reset', desc: 'Force password changes for compromised accounts' },
        { title: 'Search & Destroy', desc: 'Remove emails from all mailboxes' }
      ],
      sla: '4 hours'
    }
  };

  private get filteredIncidents(): Incident[] {
    if (this.statusFilter === 'all') return this.incidents;
    return this.incidents.filter(i => i.status === this.statusFilter);
  }

  private formatTime(ts: string): string {
    const d = new Date(`2024-04-20 ${ts}`);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  render() {
    if (this.view === 'detail' && this.selectedIncident) {
      return this.renderDetail(this.selectedIncident);
    }
    return this.renderList();
  }

  private renderList() {
    return html`
      <div class="panel">
        <div class="header">
          <h2 class="title">🚨 Incident Response</h2>
          <button class="btn primary" @click=${() => {}}>+ New Incident</button>
        </div>

        <div class="filters">
          <button class="filter-btn ${this.statusFilter === 'all' ? 'active' : ''}" @click=${() => this.statusFilter = 'all'}>All</button>
          <button class="filter-btn ${this.statusFilter === 'new' ? 'active' : ''}" @click=${() => this.statusFilter = 'new'}>New</button>
          <button class="filter-btn ${this.statusFilter === 'investigating' ? 'active' : ''}" @click=${() => this.statusFilter = 'investigating'}>Investigating</button>
          <button class="filter-btn ${this.statusFilter === 'contained' ? 'active' : ''}" @click=${() => this.statusFilter = 'contained'}>Contained</button>
          <button class="filter-btn ${this.statusFilter === 'resolved' ? 'active' : ''}" @click=${() => this.statusFilter = 'resolved'}>Resolved</button>
        </div>

        <div class="incidents-list">
          ${this.filteredIncidents.map(inc => html`
            <div class="incident-card ${inc.severity}" @click=${() => { this.selectedIncident = inc; this.view = 'detail'; }}>
              <div class="incident-header">
                <span class="incident-id">${inc.id}</span>
                <span class="status-badge status-${inc.status}">${inc.status}</span>
              </div>
              <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px;">
                <span class="incident-title">${inc.title}</span>
                <span class="sev-badge sev-${inc.severity}">${inc.severity}</span>
              </div>
              <div class="incident-meta">
                <span>👤 ${inc.assignee}</span>
                <span>📅 ${inc.createdAt}</span>
                <span>📁 ${inc.category}</span>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private renderDetail(inc: Incident) {
    const playbook = inc.playbook ? this.playbooks[inc.playbook] : null;
    return html`
      <div class="panel">
        <div class="header">
          <button class="btn" @click=${() => { this.view = 'list'; this.selectedIncident = null; }}>← Back</button>
          <h2 class="title">${inc.id}: ${inc.title}</h2>
          <div style="display: flex; gap: 8px;">
            <button class="btn danger">Escalate</button>
            <button class="btn primary">Change Status</button>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 300px; gap: 16px;">
          <div>
            <div style="background: var(--bg-secondary, #1f2937); border-radius: 8px; padding: 14px; margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span class="sev-badge sev-${inc.severity}">${inc.severity.toUpperCase()}</span>
                <span class="status-badge status-${inc.status}">${inc.status}</span>
              </div>
              <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 12px;">${inc.description}</p>
              <div style="display: flex; gap: 16px; font-size: 12px; color: #94a3b8;">
                <span>👤 Assignee: ${inc.assignee}</span>
                <span>📅 Created: ${inc.createdAt}</span>
                <span>🕐 Updated: ${inc.updatedAt}</span>
              </div>
            </div>

            <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 12px;">📜 Timeline</h3>
            <div class="timeline">
              ${inc.timeline.map(e => html`
                <div class="timeline-item ${e.type}">
                  <div class="timeline-time">${e.timestamp}</div>
                  <div class="timeline-action">${e.action} <span style="font-weight: normal; color: #94a3b8;">by ${e.user}</span></div>
                  ${e.details ? html`<div class="timeline-details">${e.details}</div>` : ''}
                </div>
              `)}
            </div>
          </div>

          <div>
            ${playbook ? html`
              <div class="playbook">
                <h4 style="font-size: 13px; font-weight: 600; margin-bottom: 10px;">📋 Response Playbook</h4>
                ${playbook.steps.map((step, i) => html`
                  <div class="playbook-step">
                    <div class="step-num">${i + 1}</div>
                    <div class="step-content">
                      <div class="step-title">${step.title}</div>
                      <div class="step-desc">${step.desc}</div>
                    </div>
                  </div>
                `)}
                <div style="margin-top: 8px; font-size: 11px; color: #22c55e;">⏱️ SLA: ${playbook.sla}</div>
              </div>
            ` : ''}

            <div class="escalation-matrix" style="margin-top: 16px;">
              <div class="esc-level ${inc.escalation?.level === 1 ? 'current' : ''}">
                <div class="esc-name">Level 1</div>
                <div class="esc-team">SOC Team</div>
                <div class="esc-ttr">15 min</div>
              </div>
              <div class="esc-level ${inc.escalation?.level === 2 ? 'current' : ''}">
                <div class="esc-name">Level 2</div>
                <div class="esc-team">IR Team</div>
                <div class="esc-ttr">1 hour</div>
              </div>
              <div class="esc-level ${inc.escalation?.level === 3 ? 'current' : ''}">
                <div class="esc-name">Level 3</div>
                <div class="esc-team">War Room</div>
                <div class="esc-ttr">Immediate</div>
              </div>
            </div>

            ${inc.escalation ? html`
              <div style="background: var(--bg-secondary, #1f2937); border-radius: 8px; padding: 12px; margin-top: 12px;">
                <div style="font-size: 11px; color: #94a3b8; margin-bottom: 4px;">CURRENT ESCALATION</div>
                <div style="font-size: 13px; font-weight: 600;">${inc.escalation.name}</div>
                <div style="font-size: 11px; color: #94a3b8;">${inc.escalation.team}</div>
                <div style="font-size: 11px; color: #22c55e; margin-top: 4px;">Notified: ${inc.escalation.notified}</div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-incident-response-workflow': ScIncidentResponseWorkflow; } }
