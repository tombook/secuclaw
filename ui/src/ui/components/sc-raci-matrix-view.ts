import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { RACI_SCENARIOS, type ScenarioType, type RaciRole, type RaciAssignment } from '../config/raci-matrix.js';
import type { RoleId } from '../store/role-context.js';

interface RoleInfo {
  id: RoleId;
  emoji: string;
  displayName: string;
}

const ROLES: RoleInfo[] = [
  { id: 'security-expert', emoji: '🔐', displayName: '安全专家' },
  { id: 'privacy-officer', emoji: '🔒', displayName: '隐私安全官' },
  { id: 'security-architect', emoji: '🏗️', displayName: '安全架构师' },
  { id: 'business-security-officer', emoji: '📊', displayName: '业务安全官' },
  { id: 'secuclaw-commander', emoji: '🎯', displayName: '全域安全指挥官' },
  { id: 'ciso', emoji: '👔', displayName: '首席信息安全官' },
  { id: 'security-ops', emoji: '⚙️', displayName: '安全运营官' },
  { id: 'supply-chain-security', emoji: '🔗', displayName: '供应链安全官' },
];

const RACI_LABELS: Record<RaciRole, { label: string; color: string; bgColor: string }> = {
  R: { label: 'Responsible', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.1)' },
  A: { label: 'Accountable', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' },
  C: { label: 'Consulted', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
  I: { label: 'Informed', color: '#64748b', bgColor: 'rgba(100, 116, 139, 0.1)' },
};

@customElement('sc-raci-matrix-view')
export class ScRaciMatrixView extends LitElement {
  @property({ type: String })
  scenarioType: ScenarioType = 'incident-response';

  @property({ type: String, attribute: false })
  currentRole: RoleId | null = null;

  @property({ type: Boolean })
  compact: boolean = false;

  @state()
  private expandedRoleId: RoleId | null = null;

  @state()
  private isMobile = window.innerWidth < 768;

  static styles = css`
    :host {
      display: block;
      font-family: var(--sc-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
    }

    .matrix-container {
      background-color: var(--sc-bg-card, #1e293b);
      border: 1px solid var(--sc-border-color, #334155);
      border-radius: var(--sc-radius-lg, 0.5rem);
      overflow: hidden;
    }

    .matrix-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--sc-spacing-md, 1rem);
      border-bottom: 1px solid var(--sc-border-color, #334155);
      background-color: var(--sc-bg-secondary, #1e3a5f);
    }

    .matrix-title {
      font-size: var(--sc-font-size-md, 1rem);
      font-weight: 600;
      color: var(--sc-text-primary, #f8fafc);
    }

    .scenario-badge {
      padding: 2px 8px;
      background-color: var(--sc-primary, #3b82f6);
      color: white;
      border-radius: var(--sc-radius-full, 999px);
      font-size: var(--sc-font-size-xs, 0.75rem);
      font-weight: 600;
    }

    .compact-view {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-sm, 0.5rem);
      padding: var(--sc-spacing-md, 1rem);
    }

    .compact-role-row {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-md, 1rem);
      padding: var(--sc-spacing-sm, 0.5rem);
      border-radius: var(--sc-radius-md, 0.375rem);
      transition: all var(--sc-transition-fast, 150ms ease);
      cursor: pointer;
    }

    .compact-role-row:hover {
      background-color: var(--sc-bg-hover, #334155);
    }

    .compact-role-row.current {
      background-color: var(--sc-role-primary, rgba(59, 130, 246, 0.2));
      border-left: 3px solid var(--sc-primary, #3b82f6);
    }

    .compact-role-emoji {
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .compact-role-name {
      flex: 1;
      font-size: var(--sc-font-size-sm, 0.875rem);
      color: var(--sc-text-primary, #f8fafc);
      font-weight: 500;
    }

    .compact-raci-badges {
      display: flex;
      gap: var(--sc-spacing-xs, 0.25rem);
    }

    .raci-badge {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--sc-radius-full, 999px);
      font-size: var(--sc-font-size-xs, 0.75rem);
      font-weight: 700;
      color: white;
    }

    .raci-badge.R { background-color: #22c55e; }
    .raci-badge.A { background-color: #3b82f6; }
    .raci-badge.C { background-color: #f59e0b; }
    .raci-badge.I { background-color: #64748b; }

    .expanded-view {
      padding: var(--sc-spacing-md, 1rem);
    }

    .matrix-table {
      width: 100%;
      border-collapse: collapse;
    }

    .matrix-table th,
    .matrix-table td {
      padding: var(--sc-spacing-sm, 0.5rem) var(--sc-spacing-md, 1rem);
      text-align: left;
      border-bottom: 1px solid var(--sc-border-color, #334155);
    }

    .matrix-table th {
      font-size: var(--sc-font-size-xs, 0.75rem);
      color: var(--sc-text-tertiary, #64748b);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .matrix-table tr {
      transition: all var(--sc-transition-fast, 150ms ease);
    }

    .matrix-table tr.role-row {
      cursor: pointer;
    }

    .matrix-table tr.role-row:hover {
      background-color: var(--sc-bg-hover, #334155);
    }

    .matrix-table tr.role-row.current {
      background-color: var(--sc-role-primary, rgba(59, 130, 246, 0.15));
      border-left: 3px solid var(--sc-primary, #3b82f6);
    }

    .matrix-table tr.role-row:not(.current) {
      opacity: 0.7;
    }

    .role-cell {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm, 0.5rem);
    }

    .role-emoji {
      font-size: 1.25rem;
    }

    .role-name {
      font-weight: 500;
      color: var(--sc-text-primary, #f8fafc);
    }

    .raci-cell {
      text-align: center;
    }

    .raci-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: var(--sc-radius-md, 0.375rem);
      font-weight: 700;
      font-size: var(--sc-font-size-sm, 0.875rem);
    }

    .raci-count.R { background-color: #22c55e; color: white; }
    .raci-count.A { background-color: #3b82f6; color: white; }
    .raci-count.C { background-color: #f59e0b; color: white; }
    .raci-count.I { background-color: #64748b; color: white; }
    .raci-count.zero { background-color: var(--sc-bg-tertiary, #334155); color: var(--sc-text-tertiary, #64748b); }

    .task-list {
      margin-top: var(--sc-spacing-md, 1rem);
      padding: var(--sc-spacing-md, 1rem);
      background-color: var(--sc-bg-secondary, #1e3a5f);
      border-radius: var(--sc-radius-md, 0.375rem);
      border-left: 3px solid var(--sc-primary, #3b82f6);
    }

    .task-list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--sc-spacing-sm, 0.5rem);
    }

    .task-list-title {
      font-size: var(--sc-font-size-sm, 0.875rem);
      font-weight: 600;
      color: var(--sc-text-primary, #f8fafc);
    }

    .task-list-close {
      cursor: pointer;
      padding: 4px;
      border-radius: var(--sc-radius-sm, 0.25rem);
      color: var(--sc-text-tertiary, #64748b);
      transition: all var(--sc-transition-fast, 150ms ease);
    }

    .task-list-close:hover {
      background-color: var(--sc-bg-hover, #334155);
      color: var(--sc-text-primary, #f8fafc);
    }

    .task-list-items {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-xs, 0.25rem);
    }

    .task-item {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm, 0.5rem);
      font-size: var(--sc-font-size-sm, 0.875rem);
      color: var(--sc-text-secondary, #cbd5e1);
    }

    .task-item::before {
      content: '•';
      color: var(--sc-primary, #3b82f6);
    }

    .empty-state {
      padding: var(--sc-spacing-lg, 1.5rem);
      text-align: center;
      color: var(--sc-text-tertiary, #64748b);
    }

    .empty-state-icon {
      font-size: 2rem;
      margin-bottom: var(--sc-spacing-sm, 0.5rem);
    }

    .legend {
      display: flex;
      gap: var(--sc-spacing-md, 1rem);
      padding: var(--sc-spacing-sm, 0.5rem);
      background-color: var(--sc-bg-tertiary, #334155);
      border-radius: var(--sc-radius-md, 0.375rem);
      margin-top: var(--sc-spacing-md, 1rem);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-xs, 0.25rem);
      font-size: var(--sc-font-size-xs, 0.75rem);
      color: var(--sc-text-secondary, #cbd5e1);
    }

    .legend-badge {
      width: 16px;
      height: 16px;
      border-radius: var(--sc-radius-sm, 0.25rem);
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .legend-badge.R { background-color: #22c55e; }
    .legend-badge.A { background-color: #3b82f6; }
    .legend-badge.C { background-color: #f59e0b; }
    .legend-badge.I { background-color: #64748b; }

    @media (max-width: 768px) {
      .expanded-view {
        display: none;
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('resize', this.handleResize);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('resize', this.handleResize);
  }

  private handleResize = () => {
    this.isMobile = window.innerWidth < 768;
  };

  private getScenario() {
    return RACI_SCENARIOS.find(s => s.id === this.scenarioType);
  }

  private getAssignmentsByRole(roleId: RoleId): RaciAssignment | undefined {
    const scenario = this.getScenario();
    return scenario?.assignments.find(a => a.role === roleId);
  }

  private toggleExpandedRole(roleId: RoleId) {
    if (this.expandedRoleId === roleId) {
      this.expandedRoleId = null;
    } else {
      this.expandedRoleId = roleId;
    }
  }

  private closeTaskList() {
    this.expandedRoleId = null;
  }

  private renderCompactView() {
    const scenario = this.getScenario();
    if (!scenario) return this.renderEmptyState();

    return html`
      <div class="compact-view">
        ${ROLES.map(role => {
          const assignment = this.getAssignmentsByRole(role.id);
          const isCurrent = role.id === this.currentRole;

          return html`
            <div 
              class="compact-role-row ${isCurrent ? 'current' : ''}"
              @click=${() => this.compact ? this.toggleExpandedRole(role.id) : null}
            >
              <span class="compact-role-emoji">${role.emoji}</span>
              <span class="compact-role-name">${role.displayName}</span>
              ${assignment ? html`
                <div class="compact-raci-badges">
                  <span class="raci-badge ${assignment.raci}">${assignment.raci}</span>
                </div>
              ` : ''}
            </div>
          `;
        })}
        ${this.renderLegend()}
      </div>
    `;
  }

  private renderExpandedView() {
    const scenario = this.getScenario();
    if (!scenario) return this.renderEmptyState();

    return html`
      <div class="expanded-view">
        <table class="matrix-table">
          <thead>
            <tr>
              <th>角色</th>
              <th>R</th>
              <th>A</th>
              <th>C</th>
              <th>I</th>
            </tr>
          </thead>
          <tbody>
            ${ROLES.map(role => {
              const assignment = this.getAssignmentsByRole(role.id);
              const isCurrent = role.id === this.currentRole;
              const roleInfo = ROLES.find(r => r.id === role.id);

              return html`
                <tr 
                  class="role-row ${isCurrent ? 'current' : ''}"
                  @click=${() => this.toggleExpandedRole(role.id)}
                >
                  <td>
                    <div class="role-cell">
                      <span class="role-emoji">${roleInfo?.emoji || ''}</span>
                      <span class="role-name">${roleInfo?.displayName || role.id}</span>
                    </div>
                  </td>
                  <td class="raci-cell">${assignment?.raci === 'R' ? html`<span class="raci-count R">${assignment.tasks.length}</span>` : html`<span class="raci-count zero">-</span>`}</td>
                  <td class="raci-cell">${assignment?.raci === 'A' ? html`<span class="raci-count A">${assignment.tasks.length}</span>` : html`<span class="raci-count zero">-</span>`}</td>
                  <td class="raci-cell">${assignment?.raci === 'C' ? html`<span class="raci-count C">${assignment.tasks.length}</span>` : html`<span class="raci-count zero">-</span>`}</td>
                  <td class="raci-cell">${assignment?.raci === 'I' ? html`<span class="raci-count I">${assignment.tasks.length}</span>` : html`<span class="raci-count zero">-</span>`}</td>
                </tr>
              `;
            })}
          </tbody>
        </table>
        ${this.expandedRoleId ? this.renderTaskList() : ''}
        ${this.renderLegend()}
      </div>
    `;
  }

  private renderTaskList() {
    const assignment = this.getAssignmentsByRole(this.expandedRoleId!);
    if (!assignment) return '';

    const roleInfo = ROLES.find(r => r.id === assignment.role);

    return html`
      <div class="task-list">
        <div class="task-list-header">
          <div class="task-list-title">
            ${roleInfo?.emoji} ${roleInfo?.displayName} - ${RACI_LABELS[assignment.raci].label}
          </div>
          <span class="task-list-close" @click=${this.closeTaskList}>✕</span>
        </div>
        <div class="task-list-items">
          ${assignment.tasks.map(task => html`
            <div class="task-item">${task}</div>
          `)}
        </div>
      </div>
    `;
  }

  private renderLegend() {
    return html`
      <div class="legend">
        <div class="legend-item"><span class="legend-badge R">R</span> Responsible</div>
        <div class="legend-item"><span class="legend-badge A">A</span> Accountable</div>
        <div class="legend-item"><span class="legend-badge C">C</span> Consulted</div>
        <div class="legend-item"><span class="legend-badge I">I</span> Informed</div>
      </div>
    `;
  }

  private renderEmptyState() {
    return html`
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div>未找到RACI矩阵数据</div>
      </div>
    `;
  }

  render() {
    const scenario = this.getScenario();
    const effectiveCompact = this.compact || this.isMobile;

    return html`
      <div class="matrix-container">
        <div class="matrix-header">
          <span class="matrix-title">${scenario?.name || 'RACI Matrix'}</span>
          <span class="scenario-badge">${scenario?.description || ''}</span>
        </div>
        ${effectiveCompact ? this.renderCompactView() : this.renderExpandedView()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-raci-matrix-view': ScRaciMatrixView;
  }
}
