import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('sc-billing-page')
export class ScBillingPage extends LitElement {
  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background: #0a0f1a;
      color: #f9fafb;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
      padding: 40px 20px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 1px solid #374151; }
    .title { font-size: 28px; font-weight: 800; }
    .subtitle { font-size: 13px; color: #6b7280; margin-top: 4px; }

    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .kpi { padding: 20px; background: #111827; border: 1px solid #374151; border-radius: 10px; }
    .kpi-label { font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.05em; }
    .kpi-value { font-size: 28px; font-weight: 800; }
    .kpi-accent { color: #00d4ff; }
    .kpi-success { color: #22c55e; }
    .kpi-warning { color: #f59e0b; }
    .kpi-danger { color: #ef4444; }

    .panel { padding: 24px; background: #111827; border: 1px solid #374151; border-radius: 10px; margin-bottom: 20px; }
    .panel-title { font-size: 16px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }

    .plan-current { display: flex; align-items: center; justify-content: space-between; padding: 20px; background: linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%); border: 1px solid rgba(0, 212, 255, 0.3); border-radius: 10px; margin-bottom: 20px; }
    .plan-name { font-size: 24px; font-weight: 800; }
    .plan-tier { font-size: 12px; color: #00d4ff; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
    .plan-amount { font-size: 32px; font-weight: 800; color: #00d4ff; }
    .plan-status { font-size: 13px; color: #22c55e; margin-top: 4px; }

    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 10px 12px; background: #1f2937; color: #9ca3af; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 12px; border-bottom: 1px solid #1f2937; color: #d1d5db; }
    tr:hover td { background: rgba(0, 212, 255, 0.03); }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .badge-paid { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
    .badge-pending { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
    .badge-overdue { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
    .badge-active { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
    .badge-trialing { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
    .code { font-family: 'SF Mono', Monaco, monospace; background: #1f2937; padding: 2px 6px; border-radius: 3px; color: #9ca3af; font-size: 11px; }

    .btn { padding: 8px 16px; background: #1f2937; color: #f9fafb; border: 1px solid #374151; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; }
    .btn:hover { border-color: #00d4ff; color: #00d4ff; }
    .btn-primary { padding: 8px 16px; background: linear-gradient(135deg, #00d4ff, #0ea5e9); color: #0a0f1a; border: none; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; }
    .btn-primary:hover { opacity: 0.9; }

    .usage-bar { height: 6px; background: #1f2937; border-radius: 3px; overflow: hidden; margin-top: 6px; }
    .usage-fill { height: 100%; background: linear-gradient(90deg, #22c55e, #10b981); transition: width 0.3s; }
    .usage-fill.warn { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .usage-fill.danger { background: linear-gradient(90deg, #ef4444, #f87171); }

    .empty { padding: 40px; text-align: center; color: #6b7280; font-size: 13px; }
  `;

  @state() private _stats: any = null;
  @state() private _invoices: any[] = [];
  @state() private _subs: any[] = [];
  @state() private _loading = false;

  connectedCallback() {
    super.connectedCallback();
    this._loadBilling();
  }

  private async _apiCall(handler: string, params: any = {}): Promise<any> {
    try {
      const r = await fetch(`http://127.0.0.1:21981/api/v1/${handler}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params }),
      });
      if (!r.ok) return null;
      return await r.json();
    } catch (e) { return null; }
  }

  private async _loadBilling() {
    this._loading = true;
    const [stats, invoices, subs] = await Promise.all([
      this._apiCall('saas.billing.stats'),
      this._apiCall('saas.billing.invoice.list', { limit: 10 }),
      this._apiCall('saas.billing.subscription.list'),
    ]);
    this._stats = stats;
    this._invoices = invoices || [];
    this._subs = subs || [];
    this._loading = false;
  }

  private _navigateTo(route: string) {
    window.location.hash = `#/${route}`;
  }

  render() {
    const s = this._stats;
    const currentSub = this._subs[0];
    const currentPlanCode = currentSub?.planCode || 'professional';

    return html`
      <div class="container">
        <div class="header">
          <div>
            <a style="color: #00d4ff; cursor: pointer; font-size: 12px;" @click=${() => this._navigateTo('app')}>← 返回应用</a>
            <h1 class="title" style="margin-top: 8px;">💰 计费与订阅</h1>
            <div class="subtitle">管理您的订阅、发票和使用量</div>
          </div>
          <button class="btn-primary" @click=${() => this._navigateTo('pricing')}>📋 升级计划</button>
        </div>

        <div class="grid-4">
          <div class="kpi"><div class="kpi-label">月经常性收入 (MRR)</div><div class="kpi-value kpi-accent">$${(s?.monthlyRecurringRevenue || 0).toFixed(0)}</div></div>
          <div class="kpi"><div class="kpi-label">年经常性收入 (ARR)</div><div class="kpi-value kpi-success">$${(s?.annualRecurringRevenue || 0).toFixed(0)}</div></div>
          <div class="kpi"><div class="kpi-label">活跃订阅</div><div class="kpi-value">${s?.activeSubscriptions || 0}</div></div>
          <div class="kpi"><div class="kpi-label">未付金额</div><div class="kpi-value kpi-warning">$${(s?.outstandingAmount || 0).toFixed(0)}</div></div>
        </div>

        ${currentSub ? html`
          <div class="plan-current">
            <div>
              <div class="plan-tier">当前订阅</div>
              <div class="plan-name">${currentSub.planCode} 计划</div>
              <div class="plan-status">✓ ${currentSub.status === 'trialing' ? '试用中' : '已激活'} · 续费日期：${new Date(currentSub.currentPeriodEnd).toLocaleDateString()}</div>
            </div>
            <div style="text-align: right;">
              <div class="plan-amount">$${currentSub.amount}<span style="font-size: 14px; color: #9ca3af;">/${currentSub.cycle === 'monthly' ? '月' : currentSub.cycle === 'annual' ? '年' : currentSub.cycle}</span></div>
              <button class="btn" style="margin-top: 8px;">取消订阅</button>
            </div>
          </div>
        ` : ''}

        <div class="panel">
          <div class="panel-title">📊 本月使用量</div>
          <table>
            <thead>
              <tr><th>指标</th><th>已用</th><th>上限</th><th>使用率</th><th>状态</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>API 调用</td>
                <td>0</td>
                <td>100,000 / 天</td>
                <td><div class="usage-bar"><div class="usage-fill" style="width: 0%"></div></div></td>
                <td><span class="badge badge-active">✓ 正常</span></td>
              </tr>
              <tr>
                <td>存储</td>
                <td>0.35 MB</td>
                <td>100 GB</td>
                <td><div class="usage-bar"><div class="usage-fill" style="width: 0%"></div></div></td>
                <td><span class="badge badge-active">✓ 正常</span></td>
              </tr>
              <tr>
                <td>扫描次数</td>
                <td>0</td>
                <td>无限</td>
                <td><div class="usage-bar"><div class="usage-fill" style="width: 0%"></div></div></td>
                <td><span class="badge badge-active">✓ 正常</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="panel">
          <div class="panel-title">🧾 发票历史 (${this._invoices.length})</div>
          ${this._invoices.length === 0 ? html`<div class="empty">暂无发票</div>` : html`
            <table>
              <thead>
                <tr><th>编号</th><th>金额</th><th>日期</th><th>状态</th><th>操作</th></tr>
              </thead>
              <tbody>
                ${this._invoices.map((inv: any) => html`
                  <tr>
                    <td><span class="code">${inv.number}</span></td>
                    <td>${inv.currency} ${inv.total.toFixed(2)}</td>
                    <td>${new Date(inv.issuedAt).toLocaleDateString()}</td>
                    <td>
                      <span class="badge badge-${inv.status === 'paid' ? 'paid' : inv.status === 'pending' ? 'pending' : 'overdue'}">${inv.status}</span>
                    </td>
                    <td><button class="btn">下载 PDF</button></td>
                  </tr>
                `)}
              </tbody>
            </table>
          `}
        </div>

        <div class="panel">
          <div class="panel-title">💳 支付方式</div>
          <table>
            <thead>
              <tr><th>类型</th><th>账户</th><th>状态</th><th>默认</th><th>操作</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>💳 信用卡</td>
                <td>**** 4242</td>
                <td><span class="badge badge-active">✓ 已验证</span></td>
                <td>✓</td>
                <td><button class="btn">更新</button></td>
              </tr>
              <tr>
                <td>🏦 银行汇款</td>
                <td>未配置</td>
                <td><span class="badge badge-pending">未设置</span></td>
                <td></td>
                <td><button class="btn">添加</button></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="panel">
          <div class="panel-title">📜 计费地址</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 12px;">
            <div>
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">公司名称</div>
              <div style="font-size: 14px;">Acme Corp</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">税号</div>
              <div style="font-size: 14px;">US-12-3456789</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">地址</div>
              <div style="font-size: 14px;">123 Security St, San Francisco, CA 94102, USA</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">邮箱</div>
              <div style="font-size: 14px;">billing@acme.com</div>
            </div>
          </div>
          <button class="btn" style="margin-top: 16px;">编辑地址</button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-billing-page': ScBillingPage;
  }
}
