/**
 * sc-roles-page.ts - 角色权限管理页面
 */

import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { gatewayClient } from '../../gateway-client.js';
import '../../components/design-system/sc-button.js';
import { I18nController } from '../../../i18n/lib/lit-controller.js';

interface Role {
  id: string;
  name: string;
  nameCn: string;
  description: string;
  permissions: string[];
  type: 'system' | 'custom';
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  roleIds: string[];
  permissions: string[];
  department?: string;
  title?: string;
}

// Permission categories for display
const PERMISSION_CATEGORIES = [
  { 
    category: '仪表盘', 
    permissions: [
      { code: 'dashboard.view', name: '查看仪表盘', description: '访问首页仪表盘' },
    ]
  },
  { 
    category: '安全事件', 
    permissions: [
      { code: 'incidents.view', name: '查看事件', description: '查看安全事件列表和详情' },
      { code: 'incidents.create', name: '创建事件', description: '创建新的安全事件' },
      { code: 'incidents.update', name: '更新事件', description: '更新事件状态和内容' },
      { code: 'incidents.delete', name: '删除事件', description: '删除安全事件' },
    ]
  },
  { 
    category: '漏洞管理', 
    permissions: [
      { code: 'vulnerabilities.view', name: '查看漏洞', description: '查看漏洞列表和详情' },
      { code: 'vulnerabilities.update', name: '更新漏洞', description: '更新漏洞状态' },
    ]
  },
  { 
    category: '威胁情报', 
    permissions: [
      { code: 'threats.view', name: '查看威胁', description: '查看威胁情报' },
    ]
  },
  { 
    category: '合规审计', 
    permissions: [
      { code: 'compliance.view', name: '查看合规', description: '查看合规状态' },
      { code: 'compliance.update', name: '更新合规', description: '更新合规控制项' },
    ]
  },
  { 
    category: '资产管理', 
    permissions: [
      { code: 'assets.view', name: '查看资产', description: '查看资产列表' },
      { code: 'assets.update', name: '更新资产', description: '更新资产信息' },
    ]
  },
  { 
    category: '黑暗面操作', 
    permissions: [
      { code: 'dark-side.view', name: '查看黑暗面', description: '访问黑暗面能力中心' },
      { code: 'dark-side.task.create', name: '创建任务', description: '创建黑暗面任务' },
      { code: 'dark-side.task.approve', name: '审批任务', description: '审批黑暗面任务' },
      { code: 'dark-side.task.execute', name: '执行任务', description: '执行黑暗面任务' },
    ]
  },
  { 
    category: '知识库', 
    permissions: [
      { code: 'knowledge.view', name: '查看知识库', description: '访问MITRE/SCF知识库' },
    ]
  },
  { 
    category: 'AI专家', 
    permissions: [
      { code: 'ai-experts.view', name: '查看AI专家', description: '使用AI专家对话' },
      { code: 'ai-experts.configure', name: '配置AI专家', description: '配置AI专家设置' },
    ]
  },
  { 
    category: '系统管理', 
    permissions: [
      { code: 'settings.view', name: '查看设置', description: '访问系统设置' },
      { code: 'settings.configure', name: '配置设置', description: '修改系统配置' },
      { code: 'admin.access', name: '管理员访问', description: '管理员功能' },
      { code: 'admin.users', name: '管理用户', description: '管理用户账户' },
      { code: 'admin.roles', name: '管理角色', description: '管理角色和权限' },
    ]
  },
];

// Default roles
const DEFAULT_ROLES: Role[] = [
  {
    id: 'role-admin',
    name: 'Administrator',
    nameCn: '系统管理员',
    description: '拥有系统所有权限',
    permissions: ['admin.access', 'admin.users', 'admin.roles', 'settings.configure', 'capabilities.manage'],
    type: 'system',
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'role-security-expert',
    name: 'Security Expert',
    nameCn: '安全专家',
    description: '安全事件响应和处置',
    permissions: ['incidents.view', 'incidents.create', 'incidents.update', 'vulnerabilities.view', 'vulnerabilities.update', 'threats.view', 'assets.view', 'dark-side.view', 'dark-side.task.create'],
    type: 'system',
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'role-ciso',
    name: 'CISO',
    nameCn: '首席信息安全官',
    description: '安全战略和合规管理',
    permissions: ['dashboard.view', 'incidents.view', 'vulnerabilities.view', 'compliance.view', 'compliance.update', 'assets.view', 'reports.view', 'knowledge.view', 'ai-experts.view'],
    type: 'system',
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'role-security-ops',
    name: 'Security Ops',
    nameCn: '安全运营',
    description: '日常安全运营和监控',
    permissions: ['dashboard.view', 'incidents.view', 'incidents.update', 'vulnerabilities.view', 'threats.view', 'assets.view', 'capabilities.view', 'knowledge.view'],
    type: 'system',
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'role-auditor',
    name: 'Auditor',
    nameCn: '审计员',
    description: '合规审计和报告',
    permissions: ['dashboard.view', 'incidents.view', 'compliance.view', 'reports.view', 'knowledge.view', 'ai-experts.view'],
    type: 'system',
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'role-user',
    name: 'User',
    nameCn: '普通用户',
    description: '基本访问权限',
    permissions: ['dashboard.view', 'knowledge.view', 'ai-experts.view'],
    type: 'system',
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

@customElement('sc-roles-page')
export class ScRolesPage extends LitElement {
  private i18n = new I18nController(this);

  @state() private roles: Role[] = [];
  @state() private users: User[] = [];
  @state() private selectedRole: Role | null = null;
  @state() private editingPermissions: string[] = [];
  @state() private _loading = false;
  @state() private activeTab: 'roles' | 'users' = 'roles';
  @state() private _userLoading = false;

  // Lifecycle
  connectedCallback() {
    super.connectedCallback();
    this.loadRoles();
  }

  private async loadUsers() {
    this._userLoading = true;
    try {
      const res = await gatewayClient.request('roles.listUsers', {});
      const data = (res as any)?.data ?? res;
      this.users = Array.isArray(data) ? data.map((u: any) => ({
        id: u.id, username: u.username, name: u.name ?? u.username,
        email: u.email, roleIds: u.roleIds ?? [],
        permissions: u.permissions ?? [], department: u.department,
      })) : [];
    } catch (e) {
      console.error('[roles-page] Load users failed:', e);
      this.users = [];
    }
    this._userLoading = false;
  }

  private handleTabChange(tab: 'roles' | 'users') {
    this.activeTab = tab;
    if (tab === 'users' && this.users.length === 0) {
      this.loadUsers();
    }
  }

  // Load roles from backend
  private async loadRoles() {
    this._loading = true;
    try {
      const result = await gatewayClient.request('roles.list', {});
      if (result && (result as any).data) {
        this.roles = (result as any).data.map((r: any) => ({
          id: r.id,
          name: r.name,
          nameCn: r.name,
          description: r.description,
          permissions: r.permissions,
          type: r.isSystem ? 'system' : 'custom',
          isActive: true,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }));
      }
    } catch (error) {
      console.error('[RolesPage] Failed to load roles:', error);
      this.roles = DEFAULT_ROLES;
    } finally {
      this._loading = false;
    }
  }

  private async _savePermissions() {
    if (!this.selectedRole) return;
    
    try {
      console.log('[RolesPage] Saving permissions:', {
        roleId: this.selectedRole.id,
        permissions: this.editingPermissions,
      });
      
      const result = await gatewayClient.request('roles.update', {
        id: this.selectedRole.id,
        permissions: this.editingPermissions,
      });
      
      if (result) {
        this.selectedRole = {
          ...this.selectedRole,
          permissions: this.editingPermissions,
          updatedAt: Date.now(),
        };
        await this.loadRoles();
        alert(this.i18n.t('roles.saved', '权限配置已保存'));
      }
    } catch (error) {
      console.error('[RolesPage] Failed to save permissions:', error);
      alert('保存失败: ' + (error as Error).message);
    }
  }

  static styles = css`
    :host {
      display: block;
      padding: var(--sc-spacing-lg, 20px);
      background: var(--sc-bg-primary, #f9fafb);
      min-height: 100vh;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--sc-spacing-xl, 24px);
    }

    .page-title {
      font-size: var(--sc-font-size-2xl, 24px);
      font-weight: 600;
      color: var(--sc-text-primary, #f1f5f9);
      margin: 0;
    }

    .tabs {
      display: flex;
      gap: var(--sc-spacing-md, 16px);
      margin-bottom: var(--sc-spacing-lg, 20px);
      border-bottom: 1px solid var(--sc-border-color, #334155);
    }

    .tab {
      padding: var(--sc-spacing-sm, 12px) var(--sc-spacing-md, 16px);
      font-size: var(--sc-font-size-base, 14px);
      color: var(--sc-text-secondary, #94a3b8);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }

    .tab:hover {
      color: var(--sc-primary, #3b82f6);
    }

    .tab.active {
      color: var(--sc-primary, #3b82f6);
      border-bottom-color: var(--sc-primary, #3b82f6);
    }

    .content {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: var(--sc-spacing-lg, 20px);
    }

    .roles-list {
      background: var(--sc-bg-card, #ffffff);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-md, 16px);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .role-item {
      padding: var(--sc-spacing-md, 12px);
      border-radius: var(--sc-radius-md, 8px);
      cursor: pointer;
      margin-bottom: var(--sc-spacing-sm, 8px);
      transition: background 0.2s;
    }

    .role-item:hover {
      background: var(--sc-bg-secondary, #f3f4f6);
    }

    .role-item.selected {
      background: var(--sc-primary-light, #eff6ff);
      border: 1px solid var(--sc-primary, #3b82f6);
    }

    .role-name {
      font-weight: 500;
      color: var(--sc-text-primary, #f1f5f9);
      margin-bottom: 4px;
    }

    .role-desc {
      font-size: var(--sc-font-size-sm, 12px);
      color: var(--sc-text-secondary, #94a3b8);
    }

    .role-badge {
      display: inline-block;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--sc-bg-secondary, #f3f4f6);
      color: var(--sc-text-secondary, #6b7280);
      margin-left: 8px;
    }

    .permissions-panel {
      background: var(--sc-bg-card, #ffffff);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-lg, 20px);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .permissions-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--sc-spacing-lg, 20px);
      padding-bottom: var(--sc-spacing-md, 16px);
      border-bottom: 1px solid var(--sc-border-color, #e5e7eb);
    }

    .permissions-title {
      font-size: var(--sc-font-size-xl, 18px);
      font-weight: 600;
      color: var(--sc-text-primary, #111827);
    }

    .permission-category {
      margin-bottom: var(--sc-spacing-lg, 24px);
    }

    .category-title {
      font-size: var(--sc-font-size-base, 14px);
      font-weight: 600;
      color: var(--sc-text-primary, #111827);
      margin-bottom: var(--sc-spacing-md, 12px);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .permission-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: var(--sc-spacing-sm, 12px);
    }

    .permission-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: var(--sc-spacing-sm, 12px);
      background: var(--sc-bg-secondary, #f9fafb);
      border-radius: var(--sc-radius-md, 8px);
      cursor: pointer;
      transition: background 0.2s;
    }

    .permission-item:hover {
      background: var(--sc-bg-tertiary, #f3f4f6);
    }

    .permission-item.granted {
      background: var(--sc-primary-light, #eff6ff);
      border: 1px solid var(--sc-primary, #3b82f6);
    }

    .permission-checkbox {
      width: 18px;
      height: 18px;
      border-radius: 4px;
      border: 2px solid var(--sc-border-color, #d1d5db);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s;
    }

    .permission-item.granted .permission-checkbox {
      background: var(--sc-primary, #3b82f6);
      border-color: var(--sc-primary, #3b82f6);
    }

    .permission-checkbox svg {
      width: 12px;
      height: 12px;
      color: white;
    }

    .permission-info {
      flex: 1;
    }

    .permission-name {
      font-size: var(--sc-font-size-sm, 13px);
      font-weight: 500;
      color: var(--sc-text-primary, #111827);
    }

    .permission-desc {
      font-size: var(--sc-font-size-xs, 11px);
      color: var(--sc-text-secondary, #6b7280);
    }

    .empty-state {
      text-align: center;
      padding: var(--sc-spacing-2xl, 48px);
      color: var(--sc-text-secondary, #6b7280);
    }

    .btn {
      padding: var(--sc-spacing-sm, 12px) var(--sc-spacing-md, 20px);
      border-radius: var(--sc-radius-md, 8px);
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .btn-primary {
      background: var(--sc-primary, #3b82f6);
      color: white;
    }

    .btn-primary:hover {
      background: var(--sc-primary-dark, #2563eb);
    }

    .btn-secondary {
      background: var(--sc-bg-secondary, #f3f4f6);
      color: var(--sc-text-primary, #111827);
    }

    .btn-secondary:hover {
      background: var(--sc-border-color, #e5e7eb);
    }
  `;

  render() {
    return html`
      <sc-smart-recommendation-bar></sc-smart-recommendation-bar>
      <div class="page-header">
        <h1 class="page-title">${this.i18n.t('roles.pageTitle', '角色权限管理')}</h1>
        <div style="display: flex; gap: 8px;">
          <sc-button variant="secondary" size="sm" @click=${this.createRole}>+ 新建角色</sc-button>
          <sc-button variant="secondary" size="sm" @click=${this.initializeRoles}>🔄 初始化默认角色</sc-button>
        </div>
      </div>

      <div class="tabs">
        <div class="tab ${this.activeTab === 'roles' ? 'active' : ''}" @click=${() => this.handleTabChange('roles')}>
          ${this.i18n.t('roles.roles', '角色列表')}
        </div>
        <div class="tab ${this.activeTab === 'users' ? 'active' : ''}" @click=${() => this.handleTabChange('users')}>
          ${this.i18n.t('roles.users', '用户列表')}
        </div>
      </div>

      ${this.activeTab === 'roles' ? this.renderRolesTab() : this.renderUsersTab()}
    `;
  }

  private renderRolesTab() {
    return html`
      <div class="content">
        <div class="roles-list">
          ${this.roles.map(role => html`
            <div class="role-item ${this.selectedRole?.id === role.id ? 'selected' : ''}" @click=${() => this.selectRole(role)}>
              <div class="role-name">
                ${role.nameCn}
                ${role.type === 'system' ? html`<span class="role-badge">${this.i18n.t('roles.system', '系统')}</span>` : ''}
              </div>
              <div class="role-desc">${role.description}</div>
              ${role.type === 'custom' ? html`<sc-button variant="secondary" size="sm" style="margin-top:8px;" @click=${(e: Event) => { e.stopPropagation(); this.deleteRole(role.id); }}>🗑️ 删除</sc-button>` : ''}
            </div>
          `)}
        </div>

        <div class="permissions-panel">
          ${this.selectedRole ? this.renderPermissions() : html`
            <div class="empty-state">
              <p>${this.i18n.t('roles.selectRole', '请选择一个角色查看权限')}</p>
            </div>
          `}
          <div style="margin-top: 16px; display: flex; gap: 8px; flex-wrap: wrap;">
            <sc-button variant="secondary" size="sm" @click=${() => { const id = prompt('角色ID:'); if (id) this.getRole(id).then(r => { if (r) alert(JSON.stringify(r, null, 2)); }); }}>🔍 按ID查询</sc-button>
            <sc-button variant="secondary" size="sm" @click=${() => { const code = prompt('角色编码:'); if (code) this.getRoleByCode(code).then(r => { if (r) alert(JSON.stringify(r, null, 2)); }); }}>🔎 按编码查询</sc-button>
          </div>
        </div>
      </div>
    `;
  }

  private renderPermissions() {
    return html`
      <div class="permissions-header">
        <div class="permissions-title">
          ${this.selectedRole?.nameCn} - ${this.i18n.t('roles.permissions', '权限配置')}
        </div>
        <sc-button variant="secondary" size="sm" @click=${this.resetPermissions}>
          ${this.i18n.t('roles.reset', '重置')}
        </button>
      </div>

      ${PERMISSION_CATEGORIES.map(cat => html`
        <div class="permission-category">
          <div class="category-title">${cat.category}</div>
          <div class="permission-grid">
            ${cat.permissions.map(perm => html`
              <div 
                class="permission-item ${this.editingPermissions.includes(perm.code) ? 'granted' : ''}"
                @click=${() => this.togglePermission(perm.code)}
              >
                <div class="permission-checkbox">
                  ${this.editingPermissions.includes(perm.code) ? html`
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <path d="M5 13l4 4L19 7"/>
                    </svg>
                  ` : ''}
                </div>
                <div class="permission-info">
                  <div class="permission-name">${perm.name}</div>
                  <div class="permission-desc">${perm.description}</div>
                </div>
              </div>
            `)}
          </div>
        </div>
      `)}
    `;
  }

  private renderUsersTab() {
    return html`
      <div class="permissions-panel">
        <div class="permissions-header">
          <div class="permissions-title">用户管理</div>
          <sc-button variant="primary" @click=${this.showAddUserDialog}>
            + 添加用户
          </button>
        </div>
        
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--sc-border-color, #e5e7eb);">
              <th style="text-align: left; padding: 12px; font-weight: 600;">用户名</th>
              <th style="text-align: left; padding: 12px; font-weight: 600;">姓名</th>
              <th style="text-align: left; padding: 12px; font-weight: 600;">部门</th>
              <th style="text-align: left; padding: 12px; font-weight: 600;">角色</th>
              <th style="text-align: left; padding: 12px; font-weight: 600;">操作</th>
            </tr>
          </thead>
          <tbody>
            ${this.users.map(user => html`
              <tr style="border-bottom: 1px solid var(--sc-border-color, #e5e7eb);">
                <td style="padding: 12px;">${user.username}</td>
                <td style="padding: 12px;">${user.name}</td>
                <td style="padding: 12px;">${user.department || '-'}</td>
                <td style="padding: 12px;">
                  ${user.roleIds.map(rid => {
                    const role = this.roles.find(r => r.id === rid);
                    return role ? html`<span class="role-badge">${role.nameCn}</span>` : null;
                  })}
                </td>
                 <td style="padding: 12px;">
                    <sc-button variant="secondary" size="sm" style="margin-right: 8px;" @click=${() => this.editUser(user)}>
                      编辑
                    </sc-button>
                    <sc-button variant="secondary" size="sm" style="margin-right: 8px;" @click=${() => this.assignRole(user.id)}>
                      分配角色
                    </sc-button>
                    <sc-button variant="secondary" size="sm" style="margin-right: 8px;" @click=${() => this.removeRoleFromUser(user.id)}>
                      移除角色
                    </sc-button>
                    <sc-button variant="secondary" size="sm" style="margin-right: 8px;" @click=${() => this.getUserPermissions(user.id)}>
                      查看权限
                    </sc-button>
                    <sc-button variant="secondary" size="sm" style="margin-right: 8px;" @click=${() => this.getUser(user.id)}>
                      详情
                    </sc-button>
                    <sc-button variant="secondary" size="sm" @click=${() => this.deleteUser(user.id)}>
                      删除
                    </button>
                 </td>
              </tr>
            `)}
          </tbody>
        </table>
        
        ${this.users.length === 0 ? html`
          <div class="empty-state">
            <p>暂无用户，点击上方按钮添加</p>
          </div>
        ` : ''}
      </div>
    `;
  }

  private async showAddUserDialog() {
    const username = prompt('用户名:');
    if (!username) return;
    const name = prompt('姓名:') || username;
    const email = prompt('邮箱:') || '';
    const department = prompt('部门:') || '';
    try {
      await gatewayClient.request('roles.createUser', { username, name, email, department });
      this.loadUsers();
    } catch (e) {
      console.error('[roles-page] Create user failed:', e);
    }
  }

  private async editUser(user: User) {
    const name = prompt('姓名:', user.name) || user.name;
    const email = prompt('邮箱:', user.email ?? '') || user.email;
    const department = prompt('部门:', user.department ?? '') || user.department;
    try {
      await gatewayClient.request('roles.updateUser', { id: user.id, name, email, department });
      this.loadUsers();
    } catch (e) {
      console.error('[roles-page] Update user failed:', e);
    }
  }

  private async deleteUser(userId: string) {
    if (!confirm('确定要删除此用户吗？')) return;
    try {
      await gatewayClient.request('roles.deleteUser', { id: userId });
      this.loadUsers();
    } catch (e) {
      console.error('[roles-page] Delete user failed:', e);
    }
  }

  private async assignRole(userId: string) {
    const roleId = prompt('角色ID:');
    if (!roleId) return;
    try {
      await gatewayClient.request('roles.assignRole', { userId, roleId });
      this.loadUsers();
    } catch (e) {
      console.error('[roles-page] Assign role failed:', e);
    }
  }

  private async removeRoleFromUser(userId: string) {
    const roleId = prompt('要移除的角色ID:');
    if (!roleId) return;
    try {
      await gatewayClient.request('roles.removeRole', { userId, roleId });
      this.loadUsers();
    } catch (e) {
      console.error('[roles-page] Remove role failed:', e);
    }
  }

  private async getUserPermissions(userId: string) {
    try {
      const res = await gatewayClient.request('roles.getUserPermissions', { userId });
      const perms = (res as any)?.data ?? res;
      alert(`用户权限:\n${JSON.stringify(perms, null, 2)}`);
    } catch (e) {
      console.error('[roles-page] Get permissions failed:', e);
    }
  }

  private async createRole() {
    const name = prompt('角色名称:');
    if (!name) return;
    const code = prompt('角色编码:', '') || '';
    const description = prompt('角色描述:', '') || '';
    try {
      await gatewayClient.request('roles.create', { name, code, description, permissions: {} });
      this.loadRoles();
    } catch (e) {
      console.error('[roles-page] Create role failed:', e);
    }
  }

  private async deleteRole(roleId: string) {
    if (!confirm('确定删除此角色？')) return;
    try {
      await gatewayClient.request('roles.delete', { id: roleId });
      this.loadRoles();
    } catch (e) {
      console.error('[roles-page] Delete role failed:', e);
    }
  }

  private async initializeRoles() {
    if (!confirm('确定初始化默认角色？')) return;
    try {
      await gatewayClient.request('roles.initialize', {});
      this.loadRoles();
    } catch (e) {
      console.error('[roles-page] Initialize failed:', e);
    }
  }

  private async getRole(id: string) {
    try {
      const res = await gatewayClient.request('roles.get', { id });
      return (res as any)?.data ?? res;
    } catch (e) { console.error('[roles-page] Get role failed:', e); return null; }
  }

  private async getRoleByCode(code: string) {
    try {
      const res = await gatewayClient.request('roles.getByCode', { code });
      return (res as any)?.data ?? res;
    } catch (e) { console.error('[roles-page] GetByCode failed:', e); return null; }
  }

  private async getUser(userId: string) {
    try {
      const res = await gatewayClient.request('roles.getUser', { userId });
      const detail = (res as any)?.data ?? res;
      alert(`用户详情:\n${JSON.stringify(detail, null, 2)}`);
    } catch (e) { console.error('[roles-page] GetUser failed:', e); }
  }

  private selectRole(role: Role) {
    this.selectedRole = role;
    this.editingPermissions = [...role.permissions];
  }

  private togglePermission(permission: string) {
    if (this.editingPermissions.includes(permission)) {
      this.editingPermissions = this.editingPermissions.filter(p => p !== permission);
    } else {
      this.editingPermissions = [...this.editingPermissions, permission];
    }
  }

  private resetPermissions() {
    if (this.selectedRole) {
      this.editingPermissions = [...this.selectedRole.permissions];
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-roles-page': ScRolesPage;
  }
}
