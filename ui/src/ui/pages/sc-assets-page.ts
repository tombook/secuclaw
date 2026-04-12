
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';
import { gatewayClient } from '../gateway-client.js';
import { roleContext } from '../store/role-context.js';
import '../components/sc-data-table.js';
import '../components/sc-metric-card.js';
import '../components/sc-filter-bar.js';
import '../components/design-system/sc-button.js';
import '../components/design-system/sc-card.js';
import '../components/design-system/sc-badge.js';
import '../components/sc-smart-recommendation-bar.js';

@customElement('sc-assets-page')
export class ScAssetsPage extends LitElement {
  private i18n = new I18nController(this);

  @state()
  private loading = true;

  @state()
  private assets: any[] = [];

  @state()
  private stats = {
    total: 0,
    online: 0,
    offline: 0,
    criticalVulns: 0
  };

  @state()
  private filters = {
    page: 1,
    pageSize: 20,
    status: '',
    criticality: '',
    environment: '',
    search: ''
  };

  // Modal state
  @state()
  private showModal = false;

  @state()
  private modalMode: 'create' | 'edit' = 'create';

  @state()
  private editingAsset: any = null;

  @state()
  private formData = {
    name: '',
    type: 'server',
    ip: '',
    environment: 'production',
    criticality: 'medium',
    tags: ''
  };

  // Toast state
  @state()
  private toastMessage = '';

  @state()
  private toastType: 'success' | 'error' | 'info' = 'info';

  private toastTimeout: number | null = null;

  static styles = css`
    :host {
      display: block;
      height: 100%;
      padding: var(--sc-spacing-lg, 20px);
    }

    .page-header {
      margin-bottom: var(--sc-spacing-lg, 20px);
    }

    .page-title {
      font-size: var(--sc-font-size-2xl, 24px);
      font-weight: 600;
      color: var(--sc-text-primary, #1e293b);
      margin-bottom: var(--sc-spacing-xs, 4px);
    }

    .page-description {
      font-size: var(--sc-font-size-sm, 14px);
      color: var(--sc-text-secondary, #64748b);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--sc-spacing-md, 16px);
      margin-bottom: var(--sc-spacing-lg, 20px);
    }

    .filter-section {
      background: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-md, 16px);
      margin-bottom: var(--sc-spacing-lg, 20px);
    }

    .table-container {
      background: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-lg, 12px);
      overflow: hidden;
    }

    .action-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--sc-spacing-md, 16px);
      border-bottom: 1px solid var(--sc-border-color, #e2e8f0);
    }

    .btn {
      padding: var(--sc-spacing-sm, 8px) var(--sc-spacing-md, 16px);
      border-radius: var(--sc-radius-md, 8px);
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background-color: var(--sc-primary, #3b82f6);
      color: white;
    }

    .btn-primary:hover {
      background-color: var(--sc-primary-dark, #2563eb);
    }

    .status-badge {
      padding: 2px 8px;
      border-radius: var(--sc-radius-full, 999px);
      font-size: var(--sc-font-size-xs, 12px);
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-online {
      background-color: rgba(34, 197, 94, 0.1);
      color: var(--sc-success, #22c55e);
    }

    .status-offline {
      background-color: rgba(239, 68, 68, 0.1);
      color: var(--sc-danger, #ef4444);
    }

    .status-warning {
      background-color: rgba(245, 158, 11, 0.1);
      color: var(--sc-warning, #f59e0b);
    }

    .criticality-critical {
      background-color: rgba(239, 68, 68, 0.1);
      color: var(--sc-danger, #ef4444);
    }

    .criticality-high {
      background-color: rgba(245, 158, 11, 0.1);
      color: var(--sc-warning, #f59e0b);
    }

    .criticality-medium {
      background-color: rgba(59, 130, 246, 0.1);
      color: var(--sc-primary, #3b82f6);
    }

    .criticality-low {
      background-color: rgba(34, 197, 94, 0.1);
      color: var(--sc-success, #22c55e);
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: var(--sc-bg-primary, #ffffff);
      border-radius: var(--sc-radius-lg, 12px);
      width: 480px;
      max-width: 90vw;
      max-height: 90vh;
      overflow: auto;
      box-shadow: var(--sc-shadow-lg, 0 10px 25px rgba(0, 0, 0, 0.15));
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid var(--sc-border-color, #e5e7eb);
    }

    .modal-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--sc-text-primary, #111827);
    }

    .modal-close {
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      font-size: 24px;
      cursor: pointer;
      color: var(--sc-text-secondary, #6b7280);
      border-radius: var(--sc-radius-md, 8px);
    }

    .modal-close:hover {
      background: var(--sc-bg-hover, #f3f4f6);
    }

    .modal-body {
      padding: 20px;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: var(--sc-text-primary, #111827);
      margin-bottom: 6px;
    }

    .form-input, .form-select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--sc-border-color, #e5e7eb);
      border-radius: var(--sc-radius-md, 8px);
      font-size: 14px;
      background: var(--sc-bg-primary, #ffffff);
      color: var(--sc-text-primary, #111827);
      box-sizing: border-box;
    }

    .form-input:focus, .form-select:focus {
      outline: none;
      border-color: var(--sc-primary, #3b82f6);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 20px;
      border-top: 1px solid var(--sc-border-color, #e5e7eb);
    }

    .btn-secondary {
      background: var(--sc-bg-secondary, #f3f4f6);
      color: var(--sc-text-primary, #111827);
    }

    .btn-danger {
      background: var(--sc-danger, #ef4444);
      color: white;
    }

    /* Toast Styles */
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 12px 20px;
      border-radius: var(--sc-radius-md, 8px);
      font-size: 14px;
      font-weight: 500;
      z-index: 1001;
      animation: slideIn 0.3s ease;
    }

    .toast.success {
      background: var(--sc-success, #10b981);
      color: white;
    }

    .toast.error {
      background: var(--sc-danger, #ef4444);
      color: white;
    }

    .toast.info {
      background: var(--sc-primary, #3b82f6);
      color: white;
    }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;

  constructor() {
    super();
    this.loadData();
  }

  private async loadData() {
    this.loading = true;
    try {
      const [assetsRes, statsRes] = await Promise.allSettled([
        gatewayClient.request('assets.list', { ...this.filters }),
        gatewayClient.request('assets.stats', {}),
      ]);
      if (assetsRes.status === 'fulfilled') {
        const data = (assetsRes.value as any)?.data ?? assetsRes.value;
        this.assets = Array.isArray(data) ? [...data] : [];
      }
      if (statsRes.status === 'fulfilled') {
        const s = (statsRes.value as any)?.data ?? statsRes.value;
        this.stats = {
          total: s?.total ?? this.assets.length,
          online: s?.online ?? 0,
          offline: s?.offline ?? 0,
          criticalVulns: s?.criticalVulns ?? 0,
        };
      }
    } catch (error) {
      console.error('[assets-page] Load failed:', error);
    } finally {
      this.loading = false;
    }
  }

  private handleFilterChange(e: CustomEvent) {
    this.filters = { ...this.filters, ...e.detail };
    this.loadData();
  }

  private handlePageChange(e: CustomEvent) {
    this.filters.page = e.detail.page;
    this.loadData();
  }

  private openAddModal() {
    this.modalMode = 'create';
    this.editingAsset = null;
    this.formData = {
      name: '',
      type: 'server',
      ip: '',
      environment: 'production',
      criticality: 'medium',
      tags: ''
    };
    this.showModal = true;
  }

  private openEditModal(asset: any) {
    this.modalMode = 'edit';
    this.editingAsset = asset;
    this.formData = {
      name: asset.name || '',
      type: asset.type || 'server',
      ip: asset.config?.ipAddresses?.join(', ') || '',
      environment: asset.info?.environment || 'production',
      criticality: asset.info?.criticality || 'medium',
      tags: asset.tags?.join(', ') || ''
    };
    this.showModal = true;
  }

  private closeModal() {
    this.showModal = false;
    this.editingAsset = null;
  }

  private updateFormField(field: string, value: string) {
    this.formData = { ...this.formData, [field]: value };
  }

  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.toastMessage = message;
    this.toastType = type;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = window.setTimeout(() => {
      this.toastMessage = '';
    }, 3000);
  }

  private async handleSubmitAsset() {
    const { name, type, ip, environment, criticality, tags } = this.formData;
    if (!name.trim()) {
      this.showToast('请输入资产名称', 'error');
      return;
    }

    try {
      if (this.modalMode === 'create') {
        await gatewayClient.request('assets.create', {
          name: name.trim(),
          type,
          config: { ipAddresses: ip ? ip.split(',').map((s: string) => s.trim()).filter(Boolean) : [] },
          info: { environment, status: 'online', criticality },
          tags: tags ? tags.split(',').map((s: string) => s.trim()).filter(Boolean) : []
        });
        this.showToast('资产创建成功', 'success');
      } else {
        await gatewayClient.request('assets.update', {
          id: this.editingAsset.id,
          name: name.trim(),
          type,
          config: { ipAddresses: ip ? ip.split(',').map((s: string) => s.trim()).filter(Boolean) : [] },
          info: { ...this.editingAsset.info, environment, criticality },
          tags: tags ? tags.split(',').map((s: string) => s.trim()).filter(Boolean) : []
        });
        this.showToast('资产更新成功', 'success');
      }
      this.closeModal();
      this.loadData();
    } catch (e: any) {
      console.error('[assets-page] Save failed:', e);
      this.showToast(`操作失败: ${e.message || '后端未连接'}`, 'error');
    }
  }

  private async handleAddAsset() {
    this.openAddModal();
  }

  private async handleBatchImport() {
    const json = prompt('请输入资产JSON数组:');
    if (!json) return;
    try {
      const assets = JSON.parse(json);
      await gatewayClient.request('assets.batchImport', { assets });
      this.showToast('批量导入成功', 'success');
      this.loadData();
    } catch (e: any) {
      console.error('[assets-page] Batch import failed:', e);
      this.showToast(`批量导入失败: ${e.message || '后端未连接'}`, 'error');
    }
  }

  private async handleEditAsset(asset: any) {
    this.openEditModal(asset);
  }

  private async handleDeleteAsset(id: string) {
    if (!confirm('确定删除此资产？')) return;
    try {
      await gatewayClient.request('assets.delete', { id });
      this.showToast('资产删除成功', 'success');
      this.loadData();
    } catch (e: any) {
      console.error('[assets-page] Delete failed:', e);
      this.showToast(`删除失败: ${e.message || '后端未连接'}`, 'error');
    }
  }

  private async handleFindByIp() {
    const ip = prompt('输入IP地址:');
    if (!ip) return;
    try {
      const res = await gatewayClient.request('assets.findByIp', { ip });
      const data = (res as any)?.data ?? res;
      if (Array.isArray(data)) {
        this.assets = [...data];
        this.showToast(`找到 ${data.length} 个资产`, 'success');
      }
    } catch (e: any) {
      console.error('[assets-page] FindByIp failed:', e);
      this.showToast(`搜索失败: ${e.message || '后端未连接'}`, 'error');
    }
  }

  private async handleFindByTag() {
    const tag = prompt('输入标签:');
    if (!tag) return;
    try {
      const res = await gatewayClient.request('assets.findByTag', { tag });
      const data = (res as any)?.data ?? res;
      if (Array.isArray(data)) this.assets = [...data];
    } catch (e) { console.error('[assets-page] FindByTag failed:', e); }
  }

  private async handleLinkVuln(assetId: string) {
    const vulnId = prompt('漏洞ID:');
    if (!vulnId) return;
    try {
      await gatewayClient.request('assets.linkVulnerability', { assetId, vulnerabilityId: vulnId });
      this.loadData();
    } catch (e) { console.error('[assets-page] LinkVuln failed:', e); }
  }

  private async handleUnlinkVuln(assetId: string) {
    const vulnId = prompt('要取消关联的漏洞ID:');
    if (!vulnId) return;
    try {
      await gatewayClient.request('assets.unlinkVulnerability', { assetId, vulnerabilityId: vulnId });
      this.loadData();
    } catch (e) { console.error('[assets-page] UnlinkVuln failed:', e); }
  }

  private renderStatusBadge(status: string) {
    const statusMap: Record<string, string> = {
      'online': this.i18n.t('assets.status.online'),
      'offline': this.i18n.t('assets.status.offline'),
      'warning': this.i18n.t('assets.status.warning'),
      'critical': this.i18n.t('assets.status.critical')
    };
    return html`
      <span class="status-badge status-${status}">
        ${statusMap[status] || status}
      </span>
    `;
  }

  private renderCriticalityBadge(criticality: string) {
    const criticalityMap: Record<string, string> = {
      'critical': this.i18n.t('assets.criticality.critical'),
      'high': this.i18n.t('assets.criticality.high'),
      'medium': this.i18n.t('assets.criticality.medium'),
      'low': this.i18n.t('assets.criticality.low')
    };
    return html`
      <span class="criticality-badge criticality-${criticality}">
        ${criticalityMap[criticality] || criticality}
      </span>
    `;
  }

  private getColumns() {
    return [
      { key: 'name', title: this.i18n.t('assets.columns.name'), width: '200px' },
      { key: 'ip', title: this.i18n.t('assets.columns.ip'), width: '150px', render: (row: any) => row.config?.ipAddresses?.[0] || '-' },
      { key: 'type', title: this.i18n.t('assets.columns.type'), width: '120px' },
      { key: 'criticality', title: this.i18n.t('assets.columns.criticality'), width: '120px', render: (row: any) => this.renderCriticalityBadge(row.info?.criticality) },
      { key: 'environment', title: this.i18n.t('assets.columns.environment'), width: '120px' },
      { key: 'status', title: this.i18n.t('assets.columns.status'), width: '100px', render: (row: any) => this.renderStatusBadge(row.info?.status) },
      { key: 'department', title: this.i18n.t('assets.columns.department'), width: '120px', render: (row: any) => row.info?.department || '-' },
      { key: 'owner', title: this.i18n.t('assets.columns.owner'), width: '120px', render: (row: any) => row.info?.owner || '-' },
      { key: 'vulnCount', title: this.i18n.t('assets.columns.vulnCount'), width: '100px', render: (row: any) => row.risk?.vulnerabilityCount || 0 },
      { key: 'actions', title: this.i18n.t('common.actions'), width: '260px', fixed: 'right', render: (row: any) => html`
        <button class="btn" style="padding:4px 8px;font-size:12px;margin-right:4px;background:var(--sc-bg-secondary);" @click=${(e: Event) => { e.stopPropagation(); this.handleEditAsset(row); }}>编辑</button>
        <button class="btn" style="padding:4px 8px;font-size:12px;margin-right:4px;background:var(--sc-bg-secondary);" @click=${(e: Event) => { e.stopPropagation(); this.handleLinkVuln(row.id); }}>🔗</button>
        <button class="btn" style="padding:4px 8px;font-size:12px;margin-right:4px;background:var(--sc-bg-secondary);" @click=${(e: Event) => { e.stopPropagation(); this.handleUnlinkVuln(row.id); }}>✂️</button>
        <button class="btn" style="padding:4px 8px;font-size:12px;background:rgba(239,68,68,0.1);color:#ef4444;" @click=${(e: Event) => { e.stopPropagation(); this.handleDeleteAsset(row.id); }}>删除</button>
      ` }
    ];
  }

  render() {
    if (this.loading) {
      return html`
        <div style="text-align: center; padding: 4rem;">
          <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
          <div style="color: var(--sc-text-secondary);">${this.i18n.t('common.loading')}</div>
        </div>
      `;
    }

    return html`
      <sc-smart-recommendation-bar></sc-smart-recommendation-bar>
      <div class="page-container">
        <div class="page-header">
          <h1 class="page-title">${this.i18n.t('assets.title')}</h1>
          <p class="page-description">${this.i18n.t('assets.description')}</p>
        </div>

        <div class="stats-grid">
          <sc-metric-card
            .title=${this.i18n.t('assets.stats.total')}
            .value=${this.stats.total}
            .icon="📊"
            .status="healthy"
          ></sc-metric-card>
          <sc-metric-card
            .title=${this.i18n.t('assets.stats.online')}
            .value=${this.stats.online}
            .icon="🟢"
            .status=${this.stats.online / this.stats.total > 0.9 ? 'healthy' : 'warning'}
          ></sc-metric-card>
          <sc-metric-card
            .title=${this.i18n.t('assets.stats.offline')}
            .value=${this.stats.offline}
            .icon="🔴"
            .status=${this.stats.offline > 0 ? 'warning' : 'healthy'}
          ></sc-metric-card>
          <sc-metric-card
            .title=${this.i18n.t('assets.stats.criticalVulns')}
            .value=${this.stats.criticalVulns}
            .icon="🐛"
            .status=${this.stats.criticalVulns > 0 ? 'critical' : 'healthy'}
          ></sc-metric-card>
        </div>

        <div class="filter-section">
          <sc-filter-bar
            .filters=${[
              { key: 'search', type: 'input', label: this.i18n.t('common.search'), placeholder: this.i18n.t('assets.searchPlaceholder') },
              { key: 'status', type: 'select', label: this.i18n.t('assets.filters.status'), options: [
                { value: '', label: this.i18n.t('common.all') },
                { value: 'online', label: this.i18n.t('assets.status.online') },
                { value: 'offline', label: this.i18n.t('assets.status.offline') },
                { value: 'warning', label: this.i18n.t('assets.status.warning') }
              ]},
              { key: 'criticality', type: 'select', label: this.i18n.t('assets.filters.criticality'), options: [
                { value: '', label: this.i18n.t('common.all') },
                { value: 'critical', label: this.i18n.t('assets.criticality.critical') },
                { value: 'high', label: this.i18n.t('assets.criticality.high') },
                { value: 'medium', label: this.i18n.t('assets.criticality.medium') },
                { value: 'low', label: this.i18n.t('assets.criticality.low') }
              ]},
              { key: 'environment', type: 'select', label: this.i18n.t('assets.filters.environment'), options: [
                { value: '', label: this.i18n.t('common.all') },
                { value: 'production', label: this.i18n.t('assets.environment.production') },
                { value: 'staging', label: this.i18n.t('assets.environment.staging') },
                { value: 'test', label: this.i18n.t('assets.environment.test') },
                { value: 'development', label: this.i18n.t('assets.environment.development') }
              ]}
            ]}
            @change=${this.handleFilterChange}
          ></sc-filter-bar>
        </div>

        <div class="table-container">
          <div class="action-bar">
            <div>
              <sc-button variant="primary" @click=${this.handleAddAsset}>
                ➕ ${this.i18n.t('assets.addAsset')}
              </button>
              <button class="btn" style="margin-left: 8px; background: var(--sc-bg-secondary);" @click=${this.handleBatchImport}>
                📥 ${this.i18n.t('assets.batchImport')}
              </button>
              <button class="btn" style="margin-left: 8px; background: var(--sc-bg-secondary);" @click=${this.handleFindByIp}>🔍 IP搜索</button>
              <button class="btn" style="margin-left: 8px; background: var(--sc-bg-secondary);" @click=${this.handleFindByTag}>🏷️ 标签搜索</button>
            </div>
            <div>
              <button class="btn" style="background: var(--sc-bg-secondary);" @click=${() => this.loadData()}>
                🔄 ${this.i18n.t('common.refresh')}
              </button>
            </div>
          </div>

          <sc-data-table
            .columns=${this.getColumns()}
            .data=${this.assets}
            .pagination=${true}
            .page=${this.filters.page}
            .pageSize=${this.filters.pageSize}
            .total=${this.stats.total}
            @page-change=${this.handlePageChange}
          ></sc-data-table>
        </div>
      </div>

      ${this.renderModal()}
      ${this.renderToast()}
    `;
  }

  private renderModal() {
    if (!this.showModal) return html``;

    return html`
      <div class="modal-overlay" @click=${(e: Event) => e.target === e.currentTarget && this.closeModal()}>
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">
              ${this.modalMode === 'create' ? '➕ 创建资产' : '✏️ 编辑资产'}
            </h2>
            <button class="modal-close" @click=${this.closeModal}>×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">资产名称 *</label>
              <input
                type="text"
                class="form-input"
                .value=${this.formData.name}
                @input=${(e: Event) => this.updateFormField('name', (e.target as HTMLInputElement).value)}
                placeholder="请输入资产名称"
              />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">类型</label>
                <select
                  class="form-select"
                  .value=${this.formData.type}
                  @change=${(e: Event) => this.updateFormField('type', (e.target as HTMLSelectElement).value)}
                >
                  <option value="server">服务器</option>
                  <option value="workstation">工作站</option>
                  <option value="network">网络设备</option>
                  <option value="database">数据库</option>
                  <option value="application">应用程序</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">重要程度</label>
                <select
                  class="form-select"
                  .value=${this.formData.criticality}
                  @change=${(e: Event) => this.updateFormField('criticality', (e.target as HTMLSelectElement).value)}
                >
                  <option value="critical">严重</option>
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">IP地址</label>
                <input
                  type="text"
                  class="form-input"
                  .value=${this.formData.ip}
                  @input=${(e: Event) => this.updateFormField('ip', (e.target as HTMLInputElement).value)}
                  placeholder="多个IP用逗号分隔"
                />
              </div>
              <div class="form-group">
                <label class="form-label">环境</label>
                <select
                  class="form-select"
                  .value=${this.formData.environment}
                  @change=${(e: Event) => this.updateFormField('environment', (e.target as HTMLSelectElement).value)}
                >
                  <option value="production">生产环境</option>
                  <option value="staging">预发布环境</option>
                  <option value="test">测试环境</option>
                  <option value="development">开发环境</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">标签</label>
              <input
                type="text"
                class="form-input"
                .value=${this.formData.tags}
                @input=${(e: Event) => this.updateFormField('tags', (e.target as HTMLInputElement).value)}
                placeholder="多个标签用逗号分隔"
              />
            </div>
          </div>
          <div class="modal-footer">
            <sc-button variant="secondary" size="sm" @click=${this.closeModal}>取消</sc-button>
            <sc-button variant="primary" @click=${this.handleSubmitAsset}>
              ${this.modalMode === 'create' ? '创建' : '保存'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderToast() {
    if (!this.toastMessage) return html``;

    return html`
      <div class="toast ${this.toastType}">
        ${this.toastType === 'success' ? '✅ ' : this.toastType === 'error' ? '❌ ' : 'ℹ️ '}
        ${this.toastMessage}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-assets-page': ScAssetsPage;
  }
}
