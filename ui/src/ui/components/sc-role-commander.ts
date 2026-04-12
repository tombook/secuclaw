import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { roleContext } from '../store/role-context.js';
import { raciStore } from '../store/raci-store.js';
import { ROLE_THEMES, type RoleId } from '../config/role-themes.js';
import { getRoleLayoutConfig, type RoleLayoutConfig } from '../config/role-layout-config.js';
import type { RaciTask } from './sc-raci-task-section.js';
import type { RaciTask as StoreRaciTask } from '../store/raci-store.js';

import './sc-raci-task-section.js';
import './sc-role-metrics-section.js';
import './sc-role-collaboration-section.js';

export type RoleStatus = 'focused' | 'collaborating' | 'standby';

export interface RoleStatusInfo {
  id: RoleId;
  status: RoleStatus;
  currentTask?: string;
  lastActive?: number;
}

@customElement('sc-role-commander')
export class ScRoleCommander extends LitElement {
  @state() private currentRole: RoleId = 'security-expert';
  @state() private layoutConfig: RoleLayoutConfig | null = null;
  @state() private raciTasks: RaciTask[] = [];
  @state() private roleStatuses: RoleStatusInfo[] = [];
  @state() private showSceneMenu = false;
  @state() private hasError = false;
  @state() private errorMessage = '';
  @state() private isInitialized = false;

  private unsubscribe?: () => void;
  private taskAbortController?: AbortController;

  static styles = css`
    :host {
      display: block;
      min-height: 100%;
    }

    .commander-container {
      padding: 20px;
      background: var(--role-background, #0f172a);
      background-image: var(--role-bg-pattern, none);
      background-size: cover;
      background-position: center;
      min-height: calc(100vh - 48px);
      transition: background 0.3s ease, background-color 0.3s ease;
      position: relative;
    }

    .commander-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%);
      pointer-events: none;
      z-index: 0;
    }

    .commander-container > * {
      position: relative;
      z-index: 1;
    }

    .commander-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #334155;
    }

    .role-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .role-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      background: var(--role-primary, #3b82f6);
      box-shadow: 0 4px 12px var(--role-primary, #3b82f6);
      animation: iconPulse 2s ease-in-out infinite;
    }

    @keyframes iconPulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.9; }
    }

    .role-icon.scan {
      animation: iconScan 1.5s ease-in-out infinite;
    }

    @keyframes iconScan {
      0%, 100% { box-shadow: 0 4px 12px var(--role-primary, #3b82f6); }
      50% { box-shadow: 0 4px 24px var(--role-primary, #3b82f6), 0 0 40px var(--role-accent, #ef4444); }
    }

    .role-icon.tactical {
      animation: iconTactical 1s ease-in-out infinite;
    }

    @keyframes iconTactical {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-5deg); }
      75% { transform: rotate(5deg); }
    }

    .role-details {
      display: flex;
      flex-direction: column;
    }

    .role-name {
      font-size: 24px;
      font-weight: 700;
      color: #f1f5f9;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .role-name-cn {
      font-size: 14px;
      color: #94a3b8;
      margin-top: 4px;
    }

    .role-description {
      font-size: 13px;
      color: #64748b;
      margin-top: 8px;
      max-width: 600px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .action-btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid #334155;
      background: #1e293b;
      color: #f1f5f9;
    }

    .action-btn:hover {
      border-color: var(--role-primary, #3b82f6);
      color: var(--role-primary, #3b82f6);
    }

    .action-btn.primary {
      background: var(--role-primary, #3b82f6);
      border-color: var(--role-primary, #3b82f6);
      color: white;
    }

    .action-btn.primary:hover {
      opacity: 0.9;
    }

    .commander-content {
      display: grid;
      gap: 20px;
    }

    .content-grid {
      display: grid;
      gap: 20px;
    }

    .content-grid.grid {
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    }

    .content-grid.card-flow {
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      grid-auto-rows: minmax(200px, auto);
    }

    .content-grid.three-column {
      grid-template-columns: repeat(3, 1fr);
    }

    .content-grid.timeline {
      grid-template-columns: 1fr;
      grid-auto-rows: auto;
    }

    .content-grid.war-room {
      grid-template-columns: 1fr 1fr;
      grid-template-rows: auto auto;
    }

    .content-grid.queue {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      grid-auto-rows: minmax(150px, auto);
    }

    .content-grid.graph {
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    }

    .content-grid.dashboard {
      grid-template-columns: repeat(4, 1fr);
    }

    .war-room .section-full {
      grid-column: 1 / -1;
    }

    .content-grid.three-column .section-card:first-child {
      grid-column: 1 / -1;
    }

    .content-grid.timeline .section-card[style*="large"] {
      grid-column: 1 / -1;
    }

    .section-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 20px;
      position: relative;
      overflow: hidden;
    }

    .section-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: var(--role-primary, #3b82f6);
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #f1f5f9;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-icon {
      font-size: 18px;
    }

    .back-to-overview {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 6px;
      color: #94a3b8;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .back-to-overview:hover {
      border-color: var(--role-primary, #3b82f6);
      color: var(--role-primary, #3b82f6);
    }

    .role-status-wall {
      display: flex;
      gap: 12px;
      padding: 16px;
      background: #1e293b;
      border-radius: 12px;
      margin-bottom: 20px;
      overflow-x: auto;
    }

    .role-status-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border-radius: 8px;
      min-width: 72px;
      cursor: pointer;
      transition: all 0.2s;
      background: #0f172a;
    }

    .role-status-item:hover {
      background: #334155;
    }

    .role-status-item.active {
      background: var(--role-primary, #3b82f6);
      background: rgba(59, 130, 246, 0.2);
    }

    .role-status-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      position: relative;
    }

    .role-status-dot {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: 2px solid #1e293b;
    }

    .role-status-dot.focused { background: #10b981; }
    .role-status-dot.collaborating { background: #3b82f6; }
    .role-status-dot.standby { background: #94a3b8; }

    .role-status-label {
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
      max-width: 60px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .role-status-item.active .role-status-label {
      color: #f1f5f9;
    }

    .scene-quick-entry {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .scene-btn {
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid #334155;
      background: #1e293b;
      color: #f1f5f9;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .scene-btn:hover {
      border-color: var(--role-primary, #3b82f6);
      transform: translateY(-1px);
    }

    .scene-btn.active {
      background: var(--role-primary, #3b82f6);
      border-color: var(--role-primary, #3b82f6);
    }

    .scene-menu {
      position: relative;
    }

    .scene-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 8px 0;
      min-width: 200px;
      z-index: 100;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      margin-top: 4px;
    }

    .scene-dropdown-item {
      padding: 10px 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #f1f5f9;
      font-size: 13px;
      transition: background 0.15s;
    }

    .scene-dropdown-item:hover {
      background: #334155;
    }

    .scene-dropdown-item:focus {
      outline: none;
      background: #334155;
    }

    .scene-dropdown-item-icon {
      font-size: 16px;
    }

    @media (max-width: 1024px) {
      .content-grid.grid-3col,
      .content-grid.grid-2col {
        grid-template-columns: 1fr;
      }
    }

    .error-boundary {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
    }

    .error-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .error-title {
      font-size: 18px;
      font-weight: 600;
      color: #f1f5f9;
      margin-bottom: 8px;
    }

    .error-message {
      font-size: 14px;
      color: #94a3b8;
      margin-bottom: 16px;
      max-width: 400px;
    }

    .retry-btn {
      background: var(--role-primary, #3b82f6);
      border: none;
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
    }

    .retry-btn:hover {
      opacity: 0.9;
    }

    .loading-skeleton {
      background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
      background-size: 200% 100%;
      animation: skeleton 1.5s ease-in-out infinite;
      border-radius: 8px;
    }

    @keyframes skeleton {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .skeleton-header {
      height: 80px;
      margin-bottom: 24px;
    }

    .skeleton-content {
      height: 200px;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.taskAbortController = new AbortController();
    try {
      this.initializeRoleStatuses();
      this.unsubscribe = roleContext.subscribe((state) => {
        if (state.currentRole) {
          this.currentRole = state.currentRole as RoleId;
          this.layoutConfig = getRoleLayoutConfig(this.currentRole);
          this.applyTheme();
          this.loadRoleData();
        }
      });
      
      const state = roleContext.getState();
      if (state.currentRole) {
        this.currentRole = state.currentRole as RoleId;
        this.layoutConfig = getRoleLayoutConfig(this.currentRole);
        this.applyTheme();
        this.loadRoleData();
      }
      this.isInitialized = true;
    } catch (error) {
      this.hasError = true;
      this.errorMessage = error instanceof Error ? error.message : '初始化失败';
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribe?.();
    this.taskAbortController?.abort();
  }

  protected override willUpdate(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('currentRole')) {
      this.layoutConfig = getRoleLayoutConfig(this.currentRole);
    }
    super.willUpdate(changedProperties);
  }

  private retryInitialization() {
    this.hasError = false;
    this.errorMessage = '';
    this.isInitialized = false;
    this.connectedCallback();
  }

  private applyTheme() {
    const theme = ROLE_THEMES[this.currentRole];
    if (!theme) return;

    const root = this.shadowRoot?.host as HTMLElement | null;
    if (!root) return;

    root.style.setProperty('--role-primary', theme.colors.primary);
    root.style.setProperty('--role-secondary', theme.colors.secondary);
    root.style.setProperty('--role-accent', theme.colors.accent);
    root.style.setProperty('--role-background', theme.colors.background);
    root.style.setProperty('--role-surface', theme.colors.surface);
    
    const container = this.shadowRoot?.querySelector('.commander-container') as HTMLElement;
    if (container && theme.backgroundPattern) {
      container.style.backgroundImage = `url('${theme.backgroundPattern}')`;
    }
  }

  private async loadRoleData() {
    try {
      const storeState = raciStore.getState();
      if (storeState.tasks && storeState.tasks.length > 0) {
        this.raciTasks = storeState.tasks.slice(0, 5).map((t: StoreRaciTask) => ({
          id: t.id,
          type: t.assignedRole as 'R' | 'A' | 'C' | 'I',
          title: t.title,
          description: t.description || '',
          scenario: t.scenario,
          status: this.convertStatus(t.status),
          assignees: [t.assignedRole],
        }));
      } else {
        this.raciTasks = this.generateMockRaciTasks();
      }
    } catch (error) {
      console.warn('[ScRoleCommander] Failed to load role data from store, using mock data:', error);
      this.raciTasks = this.generateMockRaciTasks();
    }
  }

  private convertStatus(storeStatus: string): 'pending' | 'in-progress' | 'completed' {
    switch (storeStatus) {
      case 'completed': return 'completed';
      case 'in_progress': return 'in-progress';
      default: return 'pending';
    }
  }

  private generateMockRaciTasks(): RaciTask[] {
    return [
      { id: '1', type: 'R', title: '处理 CVE-2024-XXXX 漏洞', description: '高危漏洞需要紧急修复', scenario: '漏洞管理', status: 'pending', assignees: ['security-expert'] },
      { id: '2', type: 'R', title: '完成渗透测试报告', description: 'Q1 季度渗透测试结果整理', scenario: '安全评估', status: 'in-progress', assignees: ['security-expert'] },
      { id: '3', type: 'A', title: '审批漏洞修复方案', description: '等待审批高危漏洞修复方案', scenario: '漏洞管理', status: 'pending', assignees: ['security-architect'] },
      { id: '4', type: 'C', title: '零信任架构评审', description: '需要安全架构师提供技术意见', scenario: '架构评审', status: 'pending', assignees: ['security-architect'] },
      { id: '5', type: 'I', title: 'SOC 日报', description: '今日 SOC 运营概况已生成', scenario: '安全运营', status: 'completed', assignees: ['security-ops'] },
    ];
  }

  private goBackToOverview() {
    this.dispatchEvent(new CustomEvent('back-to-overview', {
      bubbles: true,
      composed: true,
    }));
  }

  private initializeRoleStatuses() {
    const statuses: RoleStatus[] = ['focused', 'collaborating', 'standby'];
    const taskTitles = ['漏洞修复中', '架构评审', '待命中'];
    
    const newStatuses: RoleStatusInfo[] = (Object.keys(ROLE_THEMES) as RoleId[]).map((roleId, index) => ({
      id: roleId,
      status: statuses[index % 3],
      currentTask: taskTitles[index % 3],
      lastActive: Date.now() - Math.random() * 3600000,
    }));
    this.roleStatuses = newStatuses;
  }

  private switchToRole(roleId: RoleId) {
    roleContext.setRole(roleId);
  }

  private toggleSceneMenu() {
    this.showSceneMenu = !this.showSceneMenu;
    if (this.showSceneMenu) {
      this.addEventListener('click', this.handleOutsideClick);
    } else {
      this.removeEventListener('click', this.handleOutsideClick);
    }
  }

  private handleOutsideClick = (e: Event) => {
    const sceneMenu = this.shadowRoot?.querySelector('.scene-menu');
    if (sceneMenu && !sceneMenu.contains(e.target as Node)) {
      this.showSceneMenu = false;
      this.removeEventListener('click', this.handleOutsideClick);
    }
  }

  private enterScene(scene: string) {
    this.showSceneMenu = false;
    this.dispatchEvent(new CustomEvent('enter-scene', {
      detail: { scene },
      bubbles: true,
      composed: true,
    }));
  }

  private getSceneIcon(scene: string): string {
    const icons: Record<string, string> = {
      'war-room': '🏰',
      'vuln-management': '🔴',
      'compliance': '📋',
      'threat-intel': '🔍',
      'incident-response': '🚨',
      'security-ops': '🛡️',
      'architecture-review': '🏗️',
      'supply-chain': '🔗',
      'privacy': '🔒',
    };
    return icons[scene] || '📌';
  }

  private handleTaskAction(e: CustomEvent) {
    const { task, action } = e.detail;
    if (typeof window !== 'undefined' && (window as any).__DEV__) {
      console.log('[ScRoleCommander] Task action:', task, action);
    }
  }

  private handleMetricClick(e: CustomEvent) {
    const { metric } = e.detail;
    if (typeof window !== 'undefined' && (window as any).__DEV__) {
      console.log('[ScRoleCommander] Metric clicked:', metric);
    }
  }

  private handleCollaborationSend(e: CustomEvent) {
    const { message, mentions } = e.detail;
    if (typeof window !== 'undefined' && (window as any).__DEV__) {
      console.log('[ScRoleCommander] Collaboration send:', message, mentions);
    }
  }

  private handleSceneEnter(scene: string) {
    this.dispatchEvent(new CustomEvent('scene-enter', {
      detail: { scene },
      bubbles: true,
      composed: true,
    }));
  }

  private handleRoleSwitch(roleId: RoleId) {
    this.dispatchEvent(new CustomEvent('role-switch', {
      detail: { roleId },
      bubbles: true,
      composed: true,
    }));
  }

  private handleEnterCommander(e: CustomEvent) {
    const { roleId } = e.detail;
    if (roleId) {
      roleContext.setRole(roleId);
    }
  }

  private handleNavigate(e: CustomEvent) {
    const { path } = e.detail;
    if (path) {
      this.dispatchEvent(new CustomEvent('navigate-to', {
        detail: { path },
        bubbles: true,
        composed: true,
      }));
    }
  }

  private handleBackToOverview() {
    this.dispatchEvent(new CustomEvent('back-to-overview', {
      bubbles: true,
      composed: true,
    }));
  }

  private renderSection(section: { type: string; title?: string }) {
    switch (section.type) {
      case 'raci':
        return html`
          <div class="section-card">
            <sc-raci-task-section 
              @task-action=${this.handleTaskAction}
            ></sc-raci-task-section>
          </div>
        `;
      case 'metrics':
        return html`
          <div class="section-card">
            <sc-role-metrics-section 
              .title=${section.title || ''}
              .roleId=${this.currentRole}
            ></sc-role-metrics-section>
          </div>
        `;
      case 'collaboration':
        return html`
          <div class="section-card">
            <sc-role-collaboration-section 
              .roleId=${this.currentRole}
            ></sc-role-collaboration-section>
          </div>
        `;
      default:
        return html`<div class="section-card">${section.title || ''}</div>`;
    }
  }

  render() {
    if (this.hasError) {
      return html`
        <div class="error-boundary" role="alert">
          <div class="error-icon">⚠️</div>
          <div class="error-title">加载失败</div>
          <div class="error-message">${this.errorMessage || '组件初始化时发生错误'}</div>
          <button class="retry-btn" @click=${this.retryInitialization}>重试</button>
        </div>
      `;
    }

    if (!this.isInitialized) {
      return html`
        <div class="commander-container">
          <div class="loading-skeleton skeleton-header"></div>
          <div class="loading-skeleton skeleton-content"></div>
        </div>
      `;
    }

    const theme = ROLE_THEMES[this.currentRole];
    const animationClass = theme?.animation ? `role-icon ${theme.animation}` : 'role-icon';
    
    return html`
      <div class="commander-container" role="main" aria-label="角色指挥台">
        <div class="commander-header">
          <div class="role-info">
            <div class="${animationClass}" role="img" aria-label="${theme?.nameCn || '角色'}">${theme?.icon || '🛡️'}</div>
            <div class="role-details">
              <div class="role-name" role="heading" aria-level="1">
                ${theme?.name || 'Security Expert'}
                <span style="font-size: 14px; color: #94a3b8;">|</span>
                <span style="font-size: 18px;">${theme?.nameCn || '安全专家'}</span>
              </div>
              <div class="role-description">${theme?.description || ''}</div>
            </div>
          </div>
          
          <div class="header-actions">
            <button class="back-to-overview" @click=${this.handleBackToOverview} aria-label="返回总览">
              ← 返回总览
            </button>
            <button class="action-btn" aria-label="导出报告">📤 导出报告</button>
            <button class="action-btn primary" aria-label="快速操作">⚡ 快速操作</button>
          </div>
        </div>

        <div class="role-status-wall" role="group" aria-label="团队状态">
          ${this.roleStatuses.map(statusInfo => {
            const roleTheme = ROLE_THEMES[statusInfo.id];
            return html`
              <div 
                class="role-status-item ${statusInfo.id === this.currentRole ? 'active' : ''}"
                @click=${() => this.switchToRole(statusInfo.id)}
                role="button"
                aria-label="${roleTheme?.nameCn || statusInfo.id}: ${statusInfo.status === 'focused' ? '专注中' : statusInfo.status === 'collaborating' ? '协作中' : '待命'}"
              >
                <div class="role-status-icon" style="background: ${roleTheme?.colors?.primary || '#3b82f6'}">
                  ${roleTheme?.icon || '🤖'}
                  <div class="role-status-dot ${statusInfo.status}"></div>
                </div>
                <span class="role-status-label">${roleTheme?.nameCn || statusInfo.id}</span>
              </div>
            `;
          })}
        </div>

        <div class="scene-quick-entry" role="group" aria-label="场景快速入口">
          <button 
            class="scene-btn" 
            @click=${() => this.enterScene('war-room')}
            aria-label="进入作战室场景"
          >
            🏰 作战室
          </button>
          <button 
            class="scene-btn" 
            @click=${() => this.enterScene('vuln-management')}
            aria-label="进入漏洞管理场景"
          >
            🔴 漏洞管理
          </button>
          <button 
            class="scene-btn" 
            @click=${() => this.enterScene('incident-response')}
            aria-label="进入事件响应场景"
          >
            🚨 事件响应
          </button>
          <button 
            class="scene-btn" 
            @click=${() => this.enterScene('compliance')}
            aria-label="进入合规审查场景"
          >
            📋 合规审查
          </button>
          <button 
            class="scene-btn" 
            @click=${() => this.enterScene('threat-intel')}
            aria-label="进入威胁情报场景"
          >
            🔍 威胁情报
          </button>
          <button 
            class="scene-btn" 
            @click=${() => this.enterScene('security-ops')}
            aria-label="进入安全运营场景"
          >
            🛡️ 安全运营
          </button>
          <div class="scene-menu">
            <button 
              class="scene-btn" 
              @click=${this.toggleSceneMenu}
              aria-expanded=${this.showSceneMenu}
              aria-haspopup="true"
            >
              更多场景 ▼
            </button>
            ${this.showSceneMenu ? html`
              <div class="scene-dropdown" role="menu">
                <div 
                  class="scene-dropdown-item" 
                  @click=${() => this.enterScene('architecture-review')}
                  role="menuitem"
                >
                  <span class="scene-dropdown-item-icon">🏗️</span>
                  <span>架构评审</span>
                </div>
                <div 
                  class="scene-dropdown-item" 
                  @click=${() => this.enterScene('supply-chain')}
                  role="menuitem"
                >
                  <span class="scene-dropdown-item-icon">🔗</span>
                  <span>供应链安全</span>
                </div>
                <div 
                  class="scene-dropdown-item" 
                  @click=${() => this.enterScene('privacy')}
                  role="menuitem"
                >
                  <span class="scene-dropdown-item-icon">🔒</span>
                  <span>隐私合规</span>
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="commander-content">
          <div class="content-grid ${this.layoutConfig?.layoutType || 'grid'}">
            ${this.layoutConfig?.sections.map(section => {
              const sizeClass = section.size === 'full' ? 'section-full' : '';
              return html`
                <div class="${sizeClass}">
                  ${this.renderSection(section)}
                </div>
              `;
            })}
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-role-commander': ScRoleCommander;
  }
}
