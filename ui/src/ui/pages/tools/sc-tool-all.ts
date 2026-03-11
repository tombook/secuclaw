// Security Tool Demos - 按现有模块整合
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

// 通用样式
const sharedStyles = css`
  :host { display: block; }
  .page-container { padding: var(--sc-spacing-xl); }
  .header { display: flex; align-items: center; gap: var(--sc-spacing-md); margin-bottom: var(--sc-spacing-xl); }
  .icon { font-size: 32px; }
  .title { font-size: var(--sc-font-size-2xl); font-weight: 600; color: var(--sc-text-primary); }
  .badge { padding: 4px 12px; border-radius: var(--sc-radius-full); font-size: var(--sc-font-size-xs); }
  .badge.light { background: #10B98120; color: #10B981; }
  .badge.dark { background: #EF444420; color: #EF4444; }
  .badge.tech { background: #3B82F620; color: #3B82F6; }
  .badge.compliance { background: #8B5CF620; color: #8B5CF6; }
  .badge.risk { background: #EC489920; color: #EC4899; }
  .desc { color: var(--sc-text-secondary); margin-top: var(--sc-spacing-xs); }
  .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--sc-spacing-md); margin-bottom: var(--sc-spacing-lg); }
  .metric { background: var(--sc-bg-card); border: 1px solid var(--sc-border-color); border-radius: var(--sc-radius-md); padding: var(--sc-spacing-lg); text-align: center; }
  .metric-val { font-size: var(--sc-font-size-2xl); font-weight: 600; }
  .metric-label { font-size: var(--sc-font-size-xs); color: var(--sc-text-tertiary); margin-top: var(--sc-spacing-xs); }
  .card { background: var(--sc-bg-card); border: 1px solid var(--sc-border-color); border-radius: var(--sc-radius-lg); padding: var(--sc-spacing-lg); margin-bottom: var(--sc-spacing-md); }
  .card h3 { font-size: var(--sc-font-size-md); font-weight: 600; margin: 0 0 var(--sc-spacing-md); }
  .tabs { display: flex; gap: var(--sc-spacing-xs); border-bottom: 1px solid var(--sc-border-color); margin-bottom: var(--sc-spacing-lg); }
  .tab { padding: var(--sc-spacing-sm) var(--sc-spacing-lg); font-size: var(--sc-font-size-sm); color: var(--sc-text-secondary); cursor: pointer; border: none; background: none; border-bottom: 2px solid transparent; }
  .tab.active { color: var(--sc-primary); border-bottom-color: var(--sc-primary); }
  .warning { color: var(--sc-warning); font-size: var(--sc-font-size-sm); margin-top: var(--sc-spacing-sm); }
  .list-item { display: flex; justify-content: space-between; align-items: center; padding: var(--sc-spacing-sm) 0; border-bottom: 1px solid var(--sc-border-color); }
  .list-item:last-child { border-bottom: none; }
  .severity { padding: 2px 8px; border-radius: var(--sc-radius-sm); font-size: var(--sc-font-size-xs); font-weight: 600; }
  .severity.critical { background: #EF444420; color: #EF4444; }
  .severity.high { background: #F9731620; color: #F97316; }
  .severity.medium { background: #EAB30820; color: #EAB308; }
  .severity.low { background: #22C55E20; color: #22C55E; }
`;

// 漏洞扫描
@customElement('sc-tool-vuln')
export class ScToolVuln extends LitElement {
  @state() private activeTab = 'overview';
  static styles = sharedStyles;

  render() {
    return html`
      <div class="page-container">
        <div class="header">
          <span class="icon">🔍</span>
          <div>
            <h1 class="title">漏洞扫描</h1>
            <span class="badge light">光明面</span>
            <p class="desc">自动化漏洞扫描与修复建议</p>
          </div>
        </div>
        <div class="tabs">
          <button class="tab ${this.activeTab === 'overview' ? 'active' : ''}" @click=${() => this.activeTab = 'overview'}>概览</button>
          <button class="tab ${this.activeTab === 'demo' ? 'active' : ''}" @click=${() => this.activeTab = 'demo'}>演示</button>
        </div>
        <div class="metrics">
          <div class="metric"><div class="metric-val" style="color:#ef4444">2</div><div class="metric-label">严重</div></div>
          <div class="metric"><div class="metric-val" style="color:#f97316">3</div><div class="metric-label">高危</div></div>
          <div class="metric"><div class="metric-val" style="color:#eab308">5</div><div class="metric-label">中危</div></div>
          <div class="metric"><div class="metric-val" style="color:#22c55e">18</div><div class="metric-label">总计</div></div>
        </div>
        <div class="card">
          <h3>最新漏洞</h3>
          <div class="list-item"><span>Apache Log4j RCE</span><span class="severity critical">严重</span></div>
          <div class="list-item"><span>OpenSSL 心脏出血</span><span class="severity high">高危</span></div>
          <div class="list-item"><span>SMB 签名未启用</span><span class="severity medium">中危</span></div>
        </div>
      </div>
    `;
  }
}

// 配置核查
@customElement('sc-tool-config')
export class ScToolConfig extends LitElement {
  @state() private activeTab = 'overview';
  static styles = sharedStyles;

  render() {
    return html`
      <div class="page-container">
        <div class="header">
          <span class="icon">⚙️</span>
          <div>
            <h1 class="title">配置核查</h1>
            <span class="badge light">光明面</span>
            <p class="desc">系统配置基线检查与漂移检测</p>
          </div>
        </div>
        <div class="metrics">
          <div class="metric"><div class="metric-val" style="color:#22c55e">156</div><div class="metric-label">合规项</div></div>
          <div class="metric"><div class="metric-val" style="color:#eab308">12</div><div class="metric-label">漂移</div></div>
          <div class="metric"><div class="metric-val" style="color:#ef4444">3</div><div class="metric-label">不合规</div></div>
          <div class="metric"><div class="metric-val">92%</div><div class="metric-label">合规率</div></div>
        </div>
        <div class="card">
          <h3>配置漂移</h3>
          <div class="list-item"><span>防火墙规则变更</span><span class="severity high">高危</span></div>
          <div class="list-item"><span>密码策略变更</span><span class="severity medium">中危</span></div>
          <div class="list-item"><span>端口开放变更</span><span class="severity high">高危</span></div>
        </div>
      </div>
    `;
  }
}

// 渗透测试
export class ScToolPentest extends LitElement {
  static styles = sharedStyles;

  render() {
    return html`
      <div class="page-container">
        <div class="header">
          <span class="icon">🎯</span>
          <div>
            <h1 class="title">渗透测试</h1>
            <span class="badge dark">黑暗面</span>
            <p class="warning">⚠️ 需要审批后方可执行</p>
          </div>
        </div>
        <div class="card">
          <h3>测试范围</h3>
          <p style="color:var(--sc-text-secondary)">Web应用、移动端、内网域控、云环境</p>
        </div>
        <div class="card">
          <h3>执行记录</h3>
          <div class="list-item"><span>2024-01-15 Web渗透测试</span><span class="severity high">已完成</span></div>
          <div class="list-item"><span>2024-02-20 内网渗透测试</span><span class="severity high">已完成</span></div>
        </div>
      </div>
    `;
  }
}

// 攻击路径
@customElement('sc-tool-attack-path')
export class ScToolAttackPath extends LitElement {
  static styles = sharedStyles;

  render() {
    return html`
      <div class="page-container">
        <div class="header">
          <span class="icon">🗺️</span>
          <div>
            <h1 class="title">攻击路径分析</h1>
            <span class="badge dark">黑暗面</span>
            <p class="desc">可视化攻击路径与横向渗透链</p>
          </div>
        </div>
        <div class="metrics">
          <div class="metric"><div class="metric-val" style="color:#ef4444">5</div><div class="metric-label">攻击路径</div></div>
          <div class="metric"><div class="metric-val" style="color:#f97316">12</div><div class="metric-label">关键节点</div></div>
          <div class="metric"><div class="metric-val" style="color:#eab308">3</div><div class="metric-label">可达域</div></div>
          <div class="metric"><div class="metric-val" style="color:#22c55e">8</div><div class="metric-label">阻断点</div></div>
        </div>
        <div class="card">
          <h3>攻击链分析</h3>
          <div class="list-item"><span>钓鱼入口 → 主机上线 → 凭据窃取 → 域控沦陷</span><span class="severity critical">高风险</span></div>
          <div class="list-item"><span>Web漏洞 → 数据库拖库 → 数据外传</span><span class="severity high">高风险</span></div>
        </div>
      </div>
    `;
  }
}

// 威胁狩猎
@customElement('sc-tool-threat-hunt')
export class ScToolThreatHunt extends LitElement {
  static styles = sharedStyles;

  render() {
    return html`
      <div class="page-container">
        <div class="header">
          <span class="icon">🕵️</span>
          <div>
            <h1 class="title">威胁狩猎</h1>
            <span class="badge tech">安全技术</span>
            <p class="desc">基于威胁情报的主动狩猎</p>
          </div>
        </div>
        <div class="metrics">
          <div class="metric"><div class="metric-val">24</div><div class="metric-label">IOC命中</div></div>
          <div class="metric"><div class="metric-val" style="color:#ef4444">3</div><div class="metric-label">可疑主机</div></div>
          <div class="metric"><div class="metric-val">156</div><div class="metric-label">狩猎规则</div></div>
          <div class="metric"><div class="metric-val">98%</div><div class="metric-label">覆盖率</div></div>
        </div>
        <div class="card">
          <h3>最近发现</h3>
          <div class="list-item"><span>C2通信特征匹配</span><span class="severity critical">需处置</span></div>
          <div class="list-item"><span>异常PowerShell行为</span><span class="severity high">调查中</span></div>
        </div>
      </div>
    `;
  }
}

// 供应链攻击
@customElement('sc-tool-supply-chain')
export class ScToolSupplyChain extends LitElement {
  static styles = sharedStyles;

  render() {
    return html`
      <div class="page-container">
        <div class="header">
          <span class="icon">🔗</span>
          <div>
            <h1 class="title">供应链安全</h1>
            <span class="badge tech">安全技术</span>
            <p class="desc">第三方组件与依赖安全检测</p>
          </div>
        </div>
        <div class="metrics">
          <div class="metric"><div class="metric-val" style="color:#ef4444">2</div><div class="metric-label">漏洞</div></div>
          <div class="metric"><div class="metric-val" style="color:#f97316">8</div><div class="metric-label">过时</div></div>
          <div class="metric"><div class="metric-val" style="color:#eab308">5</div><div class="metric-label">许可风险</div></div>
          <div class="metric"><div class="metric-val">234</div><div class="metric-label">组件数</div></div>
        </div>
        <div class="card">
          <h3>风险组件</h3>
          <div class="list-item"><span>lodash < 4.17.21</span><span class="severity high">高危</span></div>
          <div class="list-item"><span>axios < 1.6.0</span><span class="severity medium">中危</span></div>
        </div>
      </div>
    `;
  }
}

// 告警处置
@customElement('sc-tool-alerts')
export class ScToolAlerts extends LitElement {
  @state() private activeTab = 'overview';
  static styles = sharedStyles;

  render() {
    return html`
      <div class="page-container">
        <div class="header">
          <span class="icon">🔔</span>
          <div>
            <h1 class="title">告警处置</h1>
            <span class="badge light">光明面</span>
            <p class="desc">智能告警降噪与自动化响应</p>
          </div>
        </div>
        <div class="metrics">
          <div class="metric"><div class="metric-val">1,247</div><div class="metric-label">总告警</div></div>
          <div class="metric"><div class="metric-val" style="color:var(--sc-success)">89%</div><div class="metric-label">降噪率</div></div>
          <div class="metric"><div class="metric-val">12</div><div class="metric-label">自动处置</div></div>
          <div class="metric"><div class="metric-val">3</div><div class="metric-label">待处理</div></div>
        </div>
        <div class="card">
          <h3>告警分布</h3>
          <div class="list-item"><span>暴力破解</span><span class="severity high">234</span></div>
          <div class="list-item"><span>异常登录</span><span class="severity medium">156</span></div>
          <div class="list-item"><span>恶意文件</span><span class="severity critical">12</span></div>
        </div>
      </div>
    `;
  }
}

// EDR处置
@customElement('sc-tool-edr')
export class ScToolEdr extends LitElement {
  static styles = sharedStyles;

  render() {
    return html`
      <div class="page-container">
        <div class="header">
          <span class="icon">🖥️</span>
          <div>
            <h1 class="title">终端响应</h1>
            <span class="badge tech">安全技术</span>
            <p class="desc">终端检测与响应(EDR)</p>
          </div>
        </div>
        <div class="metrics">
          <div class="metric"><div class="metric-val">1,024</div><div class="metric-label">受控终端</div></div>
          <div class="metric"><div class="metric-val" style="color:#ef4444">5</div><div class="metric-label">告警中</div></div>
          <div class="metric"><div class="metric-val" style="color:#22c55e">98%</div><div class="metric-label">在线率</div></div>
          <div class="metric"><div class="metric-val">23</div><div class="metric-label">隔离中</div></div>
        </div>
        <div class="card">
          <h3>终端告警</h3>
          <div class="list-item"><span>WORKSTATION-01 恶意进程</span><span class="severity critical">隔离中</span></div>
          <div class="list-item"><span>SERVER-DB 异常行为</span><span class="severity high">调查中</span></div>
        </div>
      </div>
    `;
  }
}

// 合规审计
@customElement('sc-tool-compliance')
export class ScToolCompliance extends LitElement {
  static styles = sharedStyles;

  render() {
    return html`
      <div class="page-container">
        <div class="header">
          <span class="icon">✅</span>
          <div>
            <h1 class="title">合规审计</h1>
            <span class="badge compliance">法律合规</span>
            <p class="desc">法规差距扫描与证据导出</p>
          </div>
        </div>
        <div class="metrics">
          <div class="metric"><div class="metric-val" style="color:#22c55e">89%</div><div class="metric-label">合规率</div></div>
          <div class="metric"><div class="metric-val" style="color:#f97316">23</div><div class="metric-label">差距项</div></div>
          <div class="metric"><div class="metric-val">12</div><div class="metric-label">框架</div></div>
          <div class="metric"><div class="metric-val">156</div><div class="metric-label">证据包</div></div>
        </div>
        <div class="card">
          <h3>合规框架</h3>
          <div class="list-item"><span>等保2.0</span><span class="severity low">92%</span></div>
          <div class="list-item"><span>GDPR</span><span class="severity medium">78%</span></div>
          <div class="list-item"><span>ISO27001</span><span class="severity low">95%</span></div>
        </div>
      </div>
    `;
  }
}

// DPIA评估
@customElement('sc-tool-dpia')
export class ScToolDpia extends LitElement {
  static styles = sharedStyles;

  render() {
    return html`
      <div class="page-container">
        <div class="header">
          <span class="icon">📋</span>
          <div>
            <h1 class="title">DPIA评估</h1>
            <span class="badge compliance">法律合规</span>
            <p class="desc">数据保护影响评估</p>
          </div>
        </div>
        <div class="metrics">
          <div class="metric"><div class="metric-val">8</div><div class="metric-label">待评估</div></div>
          <div class="metric"><div class="metric-val" style="color:#f97316">3</div><div class="metric-label">高风险</div></div>
          <div class="metric"><div class="metric-val" style="color:#22c55e">12</div><div class="metric-label">已通过</div></div>
          <div class="metric"><div class="metric-val">6</div><div class="metric-label">审核中</div></div>
        </div>
        <div class="card">
          <h3>高风险项目</h3>
          <div class="list-item"><span>用户画像分析系统</span><span class="severity high">需复审</span></div>
          <div class="list-item"><span>人脸识别门禁</span><span class="severity high">需复审</span></div>
        </div>
      </div>
    `;
  }
}

// 风险评估
@customElement('sc-tool-risk')
export class ScToolRisk extends LitElement {
  static styles = sharedStyles;

  render() {
    return html`
      <div class="page-container">
        <div class="header">
          <span class="icon">⚠️</span>
          <div>
            <h1 class="title">风险评估</h1>
            <span class="badge risk">业务运营</span>
            <p class="desc">风险量化与供应商评估</p>
          </div>
        </div>
        <div class="metrics">
          <div class="metric"><div class="metric-val" style="color:#ef4444">5</div><div class="metric-label">高风险</div></div>
          <div class="metric"><div class="metric-val" style="color:#f97316">12</div><div class="metric-label">中风险</div></div>
          <div class="metric"><div class="metric-val" style="color:#22c55e">34</div><div class="metric-label">低风险</div></div>
          <div class="metric"><div class="metric-val">¥2.5M</div><div class="metric-label">风险敞口</div></div>
        </div>
        <div class="card">
          <h3>Top风险</h3>
          <div class="list-item"><span>核心系统勒索风险</span><span class="severity critical">高</span></div>
          <div class="list-item"><span>第三方数据泄露</span><span class="severity high">高</span></div>
          <div class="list-item"><span>员工意识不足</span><span class="severity medium">中</span></div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-tool-vuln': ScToolVuln;
    'sc-tool-config': ScToolConfig;
    'sc-tool-pentest': ScToolPentest;
    'sc-tool-attack-path': ScToolAttackPath;
    'sc-tool-threat-hunt': ScToolThreatHunt;
    'sc-tool-supply-chain': ScToolSupplyChain;
    'sc-tool-alerts': ScToolAlerts;
    'sc-tool-edr': ScToolEdr;
    'sc-tool-compliance': ScToolCompliance;
    'sc-tool-dpia': ScToolDpia;
    'sc-tool-risk': ScToolRisk;
  }
}
