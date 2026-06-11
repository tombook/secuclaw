/**
 * 工具面板注册表 — 所有工具面板的工厂函数
 * 每个函数返回 Lit html 模板，由 sc-role-commander 渲染到 sc-tool-panel slot 中
 */

import { html, nothing } from 'lit';
import type { RoleId } from '../../config/role-tool-config';

export interface ToolPanelDef {
  toolId: string;
  label: string;
  icon: string;
  mode: 'slide' | 'modal' | 'fullscreen';
}

/** 工具面板配置注册表 */
export const TOOL_PANELS: Record<string, ToolPanelDef> = {
  'alert-queue': { toolId: 'alert-queue', label: '告警响应', icon: '🚨', mode: 'slide' },
  'soar-exec': { toolId: 'soar-exec', label: 'SOAR 剧本执行', icon: '🤖', mode: 'modal' },
  'vuln-scan': { toolId: 'vuln-scan', label: '漏洞扫描', icon: '🔍', mode: 'modal' },
  'threat-intel': { toolId: 'threat-intel', label: '威胁情报查询', icon: '📡', mode: 'slide' },
  'global-situation': { toolId: 'global-situation', label: '全域态势', icon: '🌐', mode: 'fullscreen' },
  'risk-score': { toolId: 'risk-score', label: '风险评分板', icon: '📊', mode: 'slide' },
  'board-report': { toolId: 'board-report', label: '董事会报告生成', icon: '📝', mode: 'modal' },
  'compliance-chk': { toolId: 'compliance-chk', label: '合规检查', icon: '✅', mode: 'slide' },
  'threat-model': { toolId: 'threat-model', label: '威胁建模 STRIDE', icon: '⚠️', mode: 'modal' },
  'bcp-mgmt': { toolId: 'bcp-mgmt', label: 'BCP 管理', icon: '🛡️', mode: 'modal' },
  'sbom-scan': { toolId: 'sbom-scan', label: 'SBOM 扫描', icon: '📦', mode: 'modal' },
  'ai-dispatch': { toolId: 'ai-dispatch', label: 'AI 调度中心', icon: '🤖', mode: 'slide' },
  'budget-dash': { toolId: 'budget-dash', label: '预算仪表盘', icon: '💰', mode: 'slide' },
  'cloud-security': { toolId: 'cloud-security', label: '云安全检查', icon: '☁️', mode: 'modal' },
  'contract-review': { toolId: 'contract-review', label: '合同安全审查', icon: '📋', mode: 'modal' },
  'cost-calc': { toolId: 'cost-calc', label: 'ROI 计算', icon: '📊', mode: 'modal' },
  'data-map': { toolId: 'data-map', label: '数据资产地图', icon: '🗺️', mode: 'slide' },
  'gdpr-audit': { toolId: 'gdpr-audit', label: 'GDPR 审计', icon: '📜', mode: 'slide' },
  'iam-config': { toolId: 'iam-config', label: 'IAM 配置', icon: '🔑', mode: 'modal' },
  'incident-mgmt': { toolId: 'incident-mgmt', label: '事件管理', icon: '🚨', mode: 'modal' },
  'kpi-track': { toolId: 'kpi-track', label: 'KPI 追踪', icon: '🎯', mode: 'slide' },
  'log-analysis': { toolId: 'log-analysis', label: '日志分析', icon: '📝', mode: 'modal' },
  'patch-mgmt': { toolId: 'patch-mgmt', label: '补丁管理', icon: '🔧', mode: 'modal' },
  'pen-test': { toolId: 'pen-test', label: '渗透测试', icon: '🔍', mode: 'modal' },
  'policy-mgmt': { toolId: 'policy-mgmt', label: '策略管理', icon: '📄', mode: 'slide' },
  'risk-register': { toolId: 'risk-register', label: '风险登记册', icon: '📋', mode: 'slide' },
  'report-gen': { toolId: 'report-gen', label: '报告生成', icon: '📊', mode: 'modal' },
  'third-party-risk': { toolId: 'third-party-risk', label: '第三方风险评估', icon: '🔗', mode: 'modal' },
  'vendor-eval': { toolId: 'vendor-eval', label: '供应商评估', icon: '🏢', mode: 'modal' },
  'zero-trust': { toolId: 'zero-trust', label: '零信任评估', icon: '🛡️', mode: 'modal' },
  'security-governance': { toolId: 'security-governance', label: '安全治理', icon: '🛡️', mode: 'modal' },
  'investment-decision': { toolId: 'investment-decision', label: '投资决策', icon: '📈', mode: 'modal' },
  'sec-awareness': { toolId: 'sec-awareness', label: '安全意识培训', icon: '🎓', mode: 'modal' },
  'cookie-mgmt': { toolId: 'cookie-mgmt', label: 'Cookie 管理', icon: '🍪', mode: 'slide' },
  'consent-mgmt': { toolId: 'consent-mgmt', label: '同意管理', icon: '✅', mode: 'slide' },
  'drill-mgmt': { toolId: 'drill-mgmt', label: '应急演练', icon: '🔥', mode: 'modal' },
  'devsecops': { toolId: 'devsecops', label: 'DevSecOps', icon: '🔄', mode: 'modal' },
  'perf-mgmt': { toolId: 'perf-mgmt', label: '绩效管理', icon: '📊', mode: 'modal' },
  'vendor-monitor': { toolId: 'vendor-monitor', label: '供应商监控', icon: '👁️', mode: 'modal' },
  'sla-mgmt': { toolId: 'sla-mgmt', label: 'SLA 管理', icon: '⏱️', mode: 'modal' },
  'supply-intel': { toolId: 'supply-intel', label: '供应链情报', icon: '🌐', mode: 'modal' },
  'material-track': { toolId: 'material-track', label: '物料追踪', icon: '📦', mode: 'modal' },
  'data-arch': { toolId: 'data-arch', label: '数据安全架构', icon: '🗄️', mode: 'modal' },
  'dr-arch': { toolId: 'dr-arch', label: '容灾架构', icon: '🏗️', mode: 'modal' },
  'arch-governance': { toolId: 'arch-governance', label: '架构治理', icon: '📋', mode: 'modal' },
  'bia-analysis': { toolId: 'bia-analysis', label: '业务影响分析', icon: '📉', mode: 'modal' },

  // ─── Phase 2: Advanced Interactive Panels ───
  'dark-sim-engine': { toolId: 'dark-sim-engine', label: 'Dark Mode 攻击模拟', icon: '🔴', mode: 'fullscreen' },
  'scan-results': { toolId: 'scan-results', label: '扫描结果详情', icon: '🔍', mode: 'slide' },
  'sc-access-matrix': { toolId: 'sc-access-matrix', label: 'Access Matrix', icon: '🔧', mode: 'slide' },
  'sc-alert-correlation': { toolId: 'sc-alert-correlation', label: 'Alert Correlation', icon: '🔧', mode: 'slide' },
  'sc-alert-system': { toolId: 'sc-alert-system', label: 'Alert System', icon: '🔧', mode: 'slide' },
  'sc-api-security': { toolId: 'sc-api-security', label: 'Api Security', icon: '🔧', mode: 'slide' },
  'sc-arch-review': { toolId: 'sc-arch-review', label: 'Arch Review', icon: '🔧', mode: 'slide' },
  'sc-asset-inventory': { toolId: 'sc-asset-inventory', label: 'Asset Inventory', icon: '🔧', mode: 'slide' },
  'sc-attack-patterns': { toolId: 'sc-attack-patterns', label: 'Attack Patterns', icon: '🔧', mode: 'slide' },
  'sc-attack-surface-graph': { toolId: 'sc-attack-surface-graph', label: 'Attack Surface Graph', icon: '🔧', mode: 'slide' },
  'sc-automation-editor': { toolId: 'sc-automation-editor', label: 'Automation Editor', icon: '🔧', mode: 'slide' },
  'sc-backup-check': { toolId: 'sc-backup-check', label: 'Backup Check', icon: '🔧', mode: 'slide' },
  'sc-baseline-scan': { toolId: 'sc-baseline-scan', label: 'Baseline Scan', icon: '🔧', mode: 'slide' },
  'sc-bcp-dashboard': { toolId: 'sc-bcp-dashboard', label: 'Bcp Dashboard', icon: '🔧', mode: 'slide' },
  'sc-bia-analysis': { toolId: 'sc-bia-analysis', label: 'Bia Analysis', icon: '🔧', mode: 'slide' },
  'sc-board-report': { toolId: 'sc-board-report', label: 'Board Report', icon: '🔧', mode: 'slide' },
  'sc-budget-planner': { toolId: 'sc-budget-planner', label: 'Budget Planner', icon: '🔧', mode: 'slide' },
  'sc-cert-management': { toolId: 'sc-cert-management', label: 'Cert Management', icon: '🔧', mode: 'slide' },
  'sc-champions': { toolId: 'sc-champions', label: 'Champions', icon: '🔧', mode: 'slide' },
  'sc-change-review': { toolId: 'sc-change-review', label: 'Change Review', icon: '🔧', mode: 'slide' },
  'sc-cloud-posture': { toolId: 'sc-cloud-posture', label: 'Cloud Posture', icon: '🔧', mode: 'slide' },
  'sc-code-review': { toolId: 'sc-code-review', label: 'Code Review', icon: '🔧', mode: 'slide' },
  'sc-compliance-calendar': { toolId: 'sc-compliance-calendar', label: 'Compliance Calendar', icon: '🔧', mode: 'slide' },
  'sc-compliance-map': { toolId: 'sc-compliance-map', label: 'Compliance Map', icon: '🔧', mode: 'slide' },
  'sc-config-audit': { toolId: 'sc-config-audit', label: 'Config Audit', icon: '🔧', mode: 'slide' },
  'sc-container-security': { toolId: 'sc-container-security', label: 'Container Security', icon: '🔧', mode: 'slide' },
  'sc-contract-review': { toolId: 'sc-contract-review', label: 'Contract Review', icon: '🔧', mode: 'slide' },
  'sc-darkweb-monitor': { toolId: 'sc-darkweb-monitor', label: 'Darkweb Monitor', icon: '🔧', mode: 'slide' },
  'sc-data-classification': { toolId: 'sc-data-classification', label: 'Data Classification', icon: '🔧', mode: 'slide' },
  'sc-data-flow': { toolId: 'sc-data-flow', label: 'Data Flow', icon: '🔧', mode: 'slide' },
  'sc-data-transfer': { toolId: 'sc-data-transfer', label: 'Data Transfer', icon: '🔧', mode: 'slide' },
  'sc-deception': { toolId: 'sc-deception', label: 'Deception', icon: '🔧', mode: 'slide' },
  'sc-dependency-tree': { toolId: 'sc-dependency-tree', label: 'Dependency Tree', icon: '🔧', mode: 'slide' },
  'sc-dlp-dashboard': { toolId: 'sc-dlp-dashboard', label: 'Dlp Dashboard', icon: '🔧', mode: 'slide' },
  'sc-dns-security': { toolId: 'sc-dns-security', label: 'Dns Security', icon: '🔧', mode: 'slide' },
  'sc-dpia-workflow': { toolId: 'sc-dpia-workflow', label: 'Dpia Workflow', icon: '🔧', mode: 'slide' },
  'sc-dr-plan': { toolId: 'sc-dr-plan', label: 'Dr Plan', icon: '🔧', mode: 'slide' },
  'sc-dr-test': { toolId: 'sc-dr-test', label: 'Dr Test', icon: '🔧', mode: 'slide' },
  'sc-email-security': { toolId: 'sc-email-security', label: 'Email Security', icon: '🔧', mode: 'slide' },
  'sc-encryption-mgmt': { toolId: 'sc-encryption-mgmt', label: 'Encryption Mgmt', icon: '🔧', mode: 'slide' },
  'sc-endpoint-dash': { toolId: 'sc-endpoint-dash', label: 'Endpoint Dash', icon: '🔧', mode: 'slide' },
  'sc-evidence-collector': { toolId: 'sc-evidence-collector', label: 'Evidence Collector', icon: '🔧', mode: 'slide' },
  'evolution-dashboard': { toolId: 'evolution-dashboard', label: '自主进化', icon: '🧬', mode: 'slide' },
  'sc-exfil-detection': { toolId: 'sc-exfil-detection', label: 'Exfil Detection', icon: '🔧', mode: 'slide' },
  'sc-exploit-predict': { toolId: 'sc-exploit-predict', label: 'Exploit Predict', icon: '🔧', mode: 'slide' },
  'sc-forensics-timeline': { toolId: 'sc-forensics-timeline', label: 'Forensics Timeline', icon: '🔧', mode: 'slide' },
  'sc-gdpr-tracker': { toolId: 'sc-gdpr-tracker', label: 'Gdpr Tracker', icon: '🔧', mode: 'slide' },
  'sc-gov-framework': { toolId: 'sc-gov-framework', label: 'Gov Framework', icon: '🔧', mode: 'slide' },
  'sc-identity-gov': { toolId: 'sc-identity-gov', label: 'Identity Gov', icon: '🔧', mode: 'slide' },
  'sc-incident-comms': { toolId: 'sc-incident-comms', label: 'Incident Comms', icon: '🔧', mode: 'slide' },
  'sc-incident-timeline': { toolId: 'sc-incident-timeline', label: 'Incident Timeline', icon: '🔧', mode: 'slide' },
  'sc-integration-health': { toolId: 'sc-integration-health', label: 'Integration Health', icon: '🔧', mode: 'slide' },
  'sc-ir-playbook': { toolId: 'sc-ir-playbook', label: 'Ir Playbook', icon: '🔧', mode: 'slide' },
  'sc-k8s-security': { toolId: 'sc-k8s-security', label: 'K8S Security', icon: '🔧', mode: 'slide' },
  'sc-kpi-dashboard': { toolId: 'sc-kpi-dashboard', label: 'Kpi Dashboard', icon: '🔧', mode: 'slide' },
  'sc-log-query': { toolId: 'sc-log-query', label: 'Log Query', icon: '🔧', mode: 'slide' },
  'sc-malware-analysis': { toolId: 'sc-malware-analysis', label: 'Malware Analysis', icon: '🔧', mode: 'slide' },
  'sc-mdm-dashboard': { toolId: 'sc-mdm-dashboard', label: 'Mdm Dashboard', icon: '🔧', mode: 'slide' },
  'sc-metrics-export': { toolId: 'sc-metrics-export', label: 'Metrics Export', icon: '🔧', mode: 'slide' },
  'sc-mitre-navigator': { toolId: 'sc-mitre-navigator', label: 'Mitre Navigator', icon: '🔧', mode: 'slide' },
  'sc-network-topo': { toolId: 'sc-network-topo', label: 'Network Topo', icon: '🔧', mode: 'slide' },
  'sc-news-feed': { toolId: 'sc-news-feed', label: 'News Feed', icon: '🔧', mode: 'slide' },
  'sc-orchestration': { toolId: 'sc-orchestration', label: 'Orchestration', icon: '🔧', mode: 'slide' },
  'sc-osint-tool': { toolId: 'sc-osint-tool', label: 'Osint Tool', icon: '🔧', mode: 'slide' },
  'sc-pam-dashboard': { toolId: 'sc-pam-dashboard', label: 'Pam Dashboard', icon: '🔧', mode: 'slide' },
  'sc-password-audit': { toolId: 'sc-password-audit', label: 'Password Audit', icon: '🔧', mode: 'slide' },
  'sc-patch-tracker': { toolId: 'sc-patch-tracker', label: 'Patch Tracker', icon: '🔧', mode: 'slide' },
  'sc-pentest-method': { toolId: 'sc-pentest-method', label: 'Pentest Method', icon: '🔧', mode: 'slide' },
  'sc-pentest-report': { toolId: 'sc-pentest-report', label: 'Pentest Report', icon: '🔧', mode: 'slide' },
  'sc-phishing-sim': { toolId: 'sc-phishing-sim', label: 'Phishing Sim', icon: '🔧', mode: 'slide' },
  'sc-policy-checker': { toolId: 'sc-policy-checker', label: 'Policy Checker', icon: '🔧', mode: 'slide' },
  'sc-privacy-computing': { toolId: 'sc-privacy-computing', label: 'Privacy Computing', icon: '🔧', mode: 'slide' },
  'sc-purple-team': { toolId: 'sc-purple-team', label: 'Purple Team', icon: '🔧', mode: 'slide' },
  'sc-reg-tracker': { toolId: 'sc-reg-tracker', label: 'Reg Tracker', icon: '🔧', mode: 'slide' },
  'sc-risk-gauge': { toolId: 'sc-risk-gauge', label: 'Risk Gauge', icon: '🔧', mode: 'slide' },
  'sc-risk-heatmap': { toolId: 'sc-risk-heatmap', label: 'Risk Heatmap', icon: '🔧', mode: 'slide' },
  'sc-risk-register': { toolId: 'sc-risk-register', label: 'Risk Register', icon: '🔧', mode: 'slide' },
  'sc-roi-calculator': { toolId: 'sc-roi-calculator', label: 'Roi Calculator', icon: '🔧', mode: 'slide' },
  'sc-scanner-integration': { toolId: 'sc-scanner-integration', label: 'Scanner Integration', icon: '🔧', mode: 'slide' },
  'sc-scf-questionnaire': { toolId: 'sc-scf-questionnaire', label: 'Scf Questionnaire', icon: '🔧', mode: 'slide' },
  'sc-sec-quiz': { toolId: 'sc-sec-quiz', label: 'Sec Quiz', icon: '🔧', mode: 'slide' },
  'sc-security-chat': { toolId: 'sc-security-chat', label: 'Security Chat', icon: '🔧', mode: 'slide' },
  'sc-severity-calc': { toolId: 'sc-severity-calc', label: 'Severity Calc', icon: '🔧', mode: 'slide' },
  'sc-soc-metrics': { toolId: 'sc-soc-metrics', label: 'Soc Metrics', icon: '🔧', mode: 'slide' },
  'sc-sso-config': { toolId: 'sc-sso-config', label: 'Sso Config', icon: '🔧', mode: 'slide' },
  'sc-stride-model': { toolId: 'sc-stride-model', label: 'Stride Model', icon: '🔧', mode: 'slide' },
  'sc-supply-chain-graph': { toolId: 'sc-supply-chain-graph', label: 'Supply Chain Graph', icon: '🔧', mode: 'slide' },
  'sc-threat-feed': { toolId: 'sc-threat-feed', label: 'Threat Feed', icon: '🔧', mode: 'slide' },
  'sc-threat-hunting': { toolId: 'sc-threat-hunting', label: 'Threat Hunting', icon: '🔧', mode: 'slide' },
  'sc-training-module': { toolId: 'sc-training-module', label: 'Training Module', icon: '🔧', mode: 'slide' },
  'sc-training-tracker': { toolId: 'sc-training-tracker', label: 'Training Tracker', icon: '🔧', mode: 'slide' },
  'sc-vendor-onboard': { toolId: 'sc-vendor-onboard', label: 'Vendor Onboard', icon: '🔧', mode: 'slide' },
  'sc-vendor-scorecard': { toolId: 'sc-vendor-scorecard', label: 'Vendor Scorecard', icon: '🔧', mode: 'slide' },
  'sc-vendor-sla': { toolId: 'sc-vendor-sla', label: 'Vendor Sla', icon: '🔧', mode: 'slide' },
  'sc-vuln-priority': { toolId: 'sc-vuln-priority', label: 'Vuln Priority', icon: '🔧', mode: 'slide' },
  'sc-vuln-sla': { toolId: 'sc-vuln-sla', label: 'Vuln Sla', icon: '🔧', mode: 'slide' },
  'sc-vuln-summary-chart': { toolId: 'sc-vuln-summary-chart', label: 'Vuln Summary Chart', icon: '🔧', mode: 'slide' },
  'sc-vuln-trend': { toolId: 'sc-vuln-trend', label: 'Vuln Trend', icon: '🔧', mode: 'slide' },
  'sc-waf-dashboard': { toolId: 'sc-waf-dashboard', label: 'Waf Dashboard', icon: '🔧', mode: 'slide' },
  'sc-wireless-security': { toolId: 'sc-wireless-security', label: 'Wireless Security', icon: '🔧', mode: 'slide' },
  'sc-zero-trust-designer': { toolId: 'sc-zero-trust-designer', label: 'Zero Trust Designer', icon: '🔧', mode: 'slide' },
  'security-timeline': { toolId: 'security-timeline', label: '安全事件时间线', icon: '📅', mode: 'slide' },
};

// ─── Mock result generators ────────────────────────────────────

function _mockVulns() {
  const vulns = [
    { cve: 'CVE-2026-1234', cvss: 9.1, desc: 'Apache Log4j2 远程代码执行', asset: 'web-prod-01', status: '未修复' },
    { cve: 'CVE-2026-1198', cvss: 7.8, desc: 'Nginx 缓冲区溢出漏洞', asset: 'nginx-lb-02', status: '修复中' },
    { cve: 'CVE-2026-1055', cvss: 6.5, desc: 'OpenSSL 信息泄露', asset: 'api-gateway-01', status: '未修复' },
    { cve: 'CVE-2026-0892', cvss: 5.3, desc: 'MySQL 权限提升漏洞', asset: 'db-master-01', status: '已修复' },
    { cve: 'CVE-2026-0741', cvss: 4.2, desc: 'Redis 未授权访问', asset: 'cache-01', status: '未修复' },
  ];
  return vulns;
}

function _mockIntel() {
  return [
    { type: 'APT 组织', name: 'DarkHotel', confidence: '92%', firstSeen: '2025-11', desc: '针对酒店 Wi-Fi 的定向攻击' },
    { type: '恶意软件', name: 'Emotet v4', confidence: '88%', firstSeen: '2026-01', desc: '银行木马，通过钓鱼邮件传播' },
    { type: '漏洞利用', name: 'CVE-2026-1234 PoC', confidence: '95%', firstSeen: '2026-03', desc: 'Log4j2 RCE 公开利用代码' },
  ];
}

function _mockSBOM() {
  return [
    { component: 'log4j', version: '2.14.1', license: 'Apache-2.0', vulns: 2, risk: '高危' },
    { component: 'openssl', version: '1.1.1k', license: 'OpenSSL', vulns: 1, risk: '中危' },
    { component: 'nginx', version: '1.21.3', license: 'BSD-2', vulns: 0, risk: '低危' },
    { component: 'mysql-connector', version: '8.0.28', license: 'GPL-2.0', vulns: 1, risk: '中危' },
    { component: 'spring-boot', version: '2.7.0', license: 'Apache-2.0', vulns: 3, risk: '高危' },
  ];
}

function _cvssClass(v: number) {
  return v >= 9 ? 'chip-critical' : v >= 7 ? 'chip-high' : v >= 4 ? 'chip-medium' : 'chip-low';
}

function _riskClass(r: string) {
  return r === '高危' ? 'chip-critical' : r === '中危' ? 'chip-medium' : 'chip-low';
}

// ─── Panel Content Renderers ───────────────────────────────────

export function renderToolContent(toolId: string, roleId: RoleId, executing: boolean, result: unknown, onExecute: () => void): unknown {
  switch (toolId) {

    // ─── 安全运营：告警响应 ───
    case 'alert-queue': {
      const alert = result as Record<string, string> | null;
      return html`
        <div class="form-group">
          <label class="form-label">告警 ID</label>
          <input class="form-input" value="ALT-2026-04182" readonly />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">告警级别</label>
            <select class="form-select"><option>P1 - 紧急</option><option>P2 - 高</option><option>P3 - 中</option><option>P4 - 低</option></select>
          </div>
          <div class="form-group">
            <label class="form-label">处置方式</label>
            <select class="form-select"><option>遏制</option><option>封禁 IP</option><option>标记误报</option><option>升级指挥官</option></select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">处置备注</label>
          <textarea class="form-textarea" placeholder="描述处置措施和原因..."></textarea>
        </div>
        <button class="exec-btn exec-btn-red" ?disabled=${executing} @click=${onExecute}>
          ${executing ? html`处理中...` : html`🚨 执行处置`}
        </button>
        ${alert ? html`
          <div class="result-section">
            <div class="result-title">处置结果</div>
            <div class="result-item">
              <div class="ri-header"><span class="ri-title">处置成功</span><span class="chip chip-pass">已完成</span></div>
              <div class="ri-desc">可疑进程已隔离，受影响资产：${alert.asset ?? 'web-prod-01'}</div>
              <div class="ri-meta">SOAR 剧本：木马遏制 | 耗时 2.3s | 操作人：安全运营</div>
            </div>
          </div>
        ` : nothing}
      `;
    }

    // ─── 安全运营：SOAR 剧本 ───
    case 'soar-exec': {
      const soarResult = result as string[] | null;
      const scripts = ['木马遏制剧本', 'DNS 隧道封堵剧本', '横向移动隔离剧本', '暴力破解封锁剧本'];
      return html`
        <div class="form-group">
          <label class="form-label">选择 SOAR 剧本</label>
          <select class="form-select">${scripts.map((s, i) => html`<option value=${i}>${s}</option>`)}</select>
        </div>
        <div class="form-group">
          <label class="form-label">目标资产</label>
          <input class="form-input" placeholder="输入 IP 或主机名" value="10.0.1.45" />
        </div>
        <button class="exec-btn exec-btn-orange" ?disabled=${executing} @click=${onExecute}>
          ${executing ? html`剧本执行中...` : html`🤖 执行剧本`}
        </button>
        ${soarResult ? html`
          <div class="result-section">
            <div class="result-title">执行步骤</div>
            ${(soarResult as string[]).map((step, i) => html`
              <div class="result-item">
                <div class="ri-header"><span class="ri-title">步骤 ${i + 1}：${step}</span><span class="chip chip-pass">✓ 成功</span></div>
              </div>
            `)}
          </div>
        ` : nothing}
      `;
    }

    // ─── 安全专家：漏洞扫描 ───
    case 'vuln-scan': {
      const vulns = result as ReturnType<typeof _mockVulns> | null;
      return html`
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">扫描目标</label>
            <select class="form-select"><option>10.0.0.0/24（内网全段）</option><option>web-prod-01</option><option>dmz-zone</option></select>
          </div>
          <div class="form-group">
            <label class="form-label">扫描类型</label>
            <select class="form-select"><option>快速扫描</option><option>全量扫描</option><option>合规扫描</option></select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">严重级别过滤</label>
          <select class="form-select"><option>全部</option><option>Critical + High</option><option>Critical only</option></select>
        </div>
        ${executing ? html`<div class="progress-bar"><div class="fill" style="width:60%;background:#3b82f6"></div></div><div class="text-muted-sm text-center">扫描进行中... 已检测 67%</div>` : nothing}
        <button class="exec-btn exec-btn-blue" ?disabled=${executing} @click=${onExecute}>
          ${executing ? html`扫描中...` : html`🔍 开始扫描`}
        </button>
        ${vulns ? html`
          <div class="result-section">
            <div class="result-title">发现 ${vulns.length} 个漏洞</div>
            <table class="result-table">
              <tr><th>CVE</th><th>CVSS</th><th>描述</th><th>资产</th><th>状态</th></tr>
              ${vulns.map(v => html`
                <tr>
                  <td class="text-bold">${v.cve}</td>
                  <td><span class="chip ${_cvssClass(v.cvss)}">${v.cvss}</span></td>
                  <td>${v.desc}</td>
                  <td class="text-muted">${v.asset}</td>
                  <td><span class="chip ${v.status === '已修复' ? 'chip-pass' : 'chip-fail'}">${v.status}</span></td>
                </tr>
              `)}
            </table>
          </div>
        ` : nothing}
      `;
    }

    // ─── 安全专家：威胁情报 ───
    case 'threat-intel': {
      const intel = result as ReturnType<typeof _mockIntel> | null;
      return html`
        <div class="form-group">
          <label class="form-label">搜索 IOC / 哈希 / IP / 域名</label>
          <input class="form-input" placeholder="输入威胁指标..." value="10.0.1.45" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">时间范围</label>
            <select class="form-select"><option>最近 7 天</option><option>最近 30 天</option><option>最近 90 天</option></select>
          </div>
          <div class="form-group">
            <label class="form-label">情报源</label>
            <select class="form-select"><option>全部源</option><option>微步在线</option><option>AlienVault</option><option>VirusTotal</option></select>
          </div>
        </div>
        <button class="exec-btn exec-btn-blue" ?disabled=${executing} @click=${onExecute}>
          ${executing ? html`查询中...` : html`📡 查询情报`}
        </button>
        ${intel ? html`
          <div class="result-section">
            <div class="result-title">匹配 ${intel.length} 条情报</div>
            ${intel.map(i => html`
              <div class="result-item">
                <div class="ri-header"><span class="ri-title">${i.name}</span><span class="chip chip-info">${i.type}</span></div>
                <div class="ri-desc">${i.desc}</div>
                <div class="ri-meta">置信度 ${i.confidence} · 首次发现 ${i.firstSeen}</div>
              </div>
            `)}
          </div>
        ` : nothing}
      `;
    }

    // ─── 安全指挥官：全域态势 ───
    case 'global-situation': {
      return html`
        <div class="grid-3 mb-lg">
          <div class="box-stat">
            <div class="box-stat-value text-red">7</div>
            <div class="text-muted-xs">活跃事件</div>
          </div>
          <div class="box-stat">
            <div class="box-stat-value text-amber">12</div>
            <div class="text-muted-xs">跨角色协作</div>
          </div>
          <div class="box-stat">
            <div class="box-stat-value text-green">93%</div>
            <div class="text-muted-xs">封堵率</div>
          </div>
        </div>
        <div class="result-title">各角色实时状态</div>
        <table class="result-table">
          <tr><th>角色</th><th>状态</th><th>关键指标</th><th>活跃任务</th></tr>
          <tr><td class="text-red text-bold">安全运营</td><td><span class="chip chip-critical">告警中</span></td><td>23 待处理</td><td>P1 横向移动响应</td></tr>
          <tr><td class="text-blue text-bold">安全专家</td><td><span class="chip chip-critical">注意</span></td><td>65 漏洞</td><td>CVE-2026-1234 验证</td></tr>
          <tr><td class="text-red text-bold">安全指挥官</td><td><span class="chip chip-high">协调中</span></td><td>241 告警</td><td>零信任迁移协调</td></tr>
          <tr><td class="text-purple text-bold">隐私官</td><td><span class="chip chip-pass">正常</span></td><td>93% 合规</td><td>GDPR 审计</td></tr>
          <tr><td class="text-cyan text-bold">安全架构师</td><td><span class="chip chip-pass">正常</span></td><td>23 风险</td><td>微服务网关评审</td></tr>
          <tr><td class="text-teal text-bold">业务安全</td><td><span class="chip chip-pass">正常</span></td><td>89 连续性</td><td>BCP 演练</td></tr>
          <tr><td class="text-blue text-bold">CISO</td><td><span class="chip chip-pass">正常</span></td><td>44 风险分</td><td>Q2 战略报告</td></tr>
          <tr><td class="text-lime text-bold">供应链</td><td><span class="chip chip-pass">正常</span></td><td>3 高风险</td><td>SBOM 扫描</td></tr>
        </table>
      `;
    }

    // ─── CISO：风险评分板 ───
    case 'risk-score': {
      return html`
        <div class="form-group">
          <label class="form-label">评估周期</label>
          <select class="form-select"><option>Q2 2026（当前）</option><option>Q1 2026</option><option>2025 年度</option></select>
        </div>
        <button class="exec-btn exec-btn-blue" ?disabled=${executing} @click=${onExecute}>
          ${executing ? html`评估中...` : html`📊 重新评估`}
        </button>
        <div class="result-section">
          <div class="result-title">四维风险评估</div>
          <div class="grid-2">
            <div class="result-item"><div class="ri-header"><span class="ri-title">技术风险</span><span class="chip chip-high">38/100</span></div><div class="ri-desc">↓ 较上季降低 5 分</div></div>
            <div class="result-item"><div class="ri-header"><span class="ri-title">合规风险</span><span class="chip chip-medium">25/100</span></div><div class="ri-desc">↓ GDPR 合规率提升至 93%</div></div>
            <div class="result-item"><div class="ri-header"><span class="ri-title">运营风险</span><span class="chip chip-high">42/100</span></div><div class="ri-desc">↑ 告警数量环比增长 12%</div></div>
            <div class="result-item"><div class="ri-header"><span class="ri-title">战略风险</span><span class="chip chip-low">15/100</span></div><div class="ri-desc">→ 稳定，零信任推进中</div></div>
          </div>
          <div class="result-item mt-center">
            <span class="ri-title">综合风险评分</span>
            <span class="score-lg" style="color:#fbbf24">44</span>
            <span class="text-muted-sm">/100</span>
            <div class="ri-meta">同比 ↓8 | 环比 ↑3 | 趋势：需要关注运营风险</div>
          </div>
        </div>
      `;
    }

    // ─── CISO：董事会报告 ───
    case 'board-report': {
      return html`
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">报告模板</label>
            <select class="form-select"><option>季度安全报告</option><option>年度安全报告</option><option>专项风险报告</option></select>
          </div>
          <div class="form-group">
            <label class="form-label">包含模块</label>
            <select class="form-select" multiple><option selected>风险评分</option><option selected>KPI 达成</option><option>事件统计</option><option>预算使用</option></select>
          </div>
        </div>
        <button class="exec-btn exec-btn-blue" ?disabled=${executing} @click=${onExecute}>
          ${executing ? html`生成中...` : html`📝 生成报告`}
        </button>
        <div class="result-section">
          <div class="result-title">报告预览</div>
          <div class="result-item line-relaxed">
            <div class="section-title">2026 年 Q2 安全态势报告</div>
            <div class="text-muted-sec">
              <p><strong>一、总体态势</strong><br>全域安全评分 79/100，较上季度提升 3 分。活跃安全事件 7 起，其中 P1 级 2 起已处置。</p>
              <p><strong>二、风险评分</strong><br>综合风险 44/100（中低），技术风险下降明显，运营风险需持续关注。</p>
              <p><strong>三、KPI 达成</strong><br>8 项 KPI 达成率 85%，其中补丁覆盖率、SOAR 自动化率超额完成。</p>
            </div>
            <div class="mt-flex">
              <button class="exec-btn box-btn-secondary">📄 导出 PDF</button>
              <button class="exec-btn box-btn-secondary">📋 复制内容</button>
            </div>
          </div>
        </div>
      `;
    }

    // ─── 隐私官：合规检查 ───
    case 'compliance-chk': {
      return html`
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">法规</label>
            <select class="form-select"><option>GDPR</option><option>PIPL</option><option>CCPA</option><option>全部</option></select>
          </div>
          <div class="form-group">
            <label class="form-label">检查范围</label>
            <select class="form-select"><option>全量检查</option><option>抽样检查</option></select>
          </div>
        </div>
        <button class="exec-btn exec-btn-purple" ?disabled=${executing} @click=${onExecute}>
          ${executing ? html`检查中...` : html`✅ 开始合规检查`}
        </button>
        <div class="result-section">
          <div class="result-title">GDPR 合规检查结果</div>
          <table class="result-table">
            <tr><th>检查项</th><th>结果</th><th>详情</th></tr>
            <tr><td>数据处理合法性基础</td><td><span class="chip chip-pass">通过</span></td><td>6/6 处理活动已记录</td></tr>
            <tr><td>数据主体权利保障</td><td><span class="chip chip-pass">通过</span></td><td>响应率 91%，平均 3.2 天</td></tr>
            <tr><td>跨境数据传输</td><td><span class="chip chip-fail">不通过</span></td><td>2 条传输链缺少 SCCs</td></tr>
            <tr><td>数据泄露通知机制</td><td><span class="chip chip-pass">通过</span></td><td>72 小时内通知率 100%</td></tr>
            <tr><td>DPO 任免与履职</td><td><span class="chip chip-pass">通过</span></td><td>DPO 已任命并备案</td></tr>
            <tr><td>隐私影响评估 (DPIA)</td><td><span class="chip chip-fail">不通过</span></td><td>3 个高风险处理活动未完成 DPIA</td></tr>
          </table>
          <div class="result-item mt-center">
            <span class="text-muted-sm">合规率</span>
            <span class="score-md text-purple">93%</span>
            <span class="chip chip-medium">2 项需整改</span>
          </div>
        </div>
      `;
    }

    // ─── 安全架构师：威胁建模 ───
    case 'threat-model': {
      return html`
        <div class="form-group">
          <label class="form-label">系统/项目名称</label>
          <input class="form-input" value="零信任网关 v3" />
        </div>
        <div class="form-group">
          <label class="form-label">STRIDE 分析维度</label>
          <div class="flex-wrap-sm mt-sm">
            ${['S-Spoofing', 'T-Tampering', 'R-Repudiation', 'I-Info Disclosure', 'D-DoS', 'E-Elevation'].map(d => html`
              <label class="stride-label">
                <input type="checkbox" checked style="accent-color:#06b6d4" /> ${d}
              </label>
            `)}
          </div>
        </div>
        <button class="exec-btn exec-btn-cyan" ?disabled=${executing} @click=${onExecute}>
          ${executing ? html`分析中...` : html`⚠️ 执行 STRIDE 分析`}
        </button>
        <div class="result-section">
          <div class="result-title">STRIDE 威胁矩阵</div>
          <table class="result-table">
            <tr><th>威胁类型</th><th>攻击向量</th><th>影响组件</th><th>风险</th><th>缓解建议</th></tr>
            <tr><td><strong>S</strong> 伪造</td><td>Token 窃取</td><td>身份认证层</td><td><span class="chip chip-high">高</span></td><td>MFA + 设备绑定</td></tr>
            <tr><td><strong>T</strong> 篡改</td><td>中间人攻击</td><td>API 网关</td><td><span class="chip chip-medium">中</span></td><td>mTLS + 请求签名</td></tr>
            <tr><td><strong>R</strong> 否认</td><td>操作日志删除</td><td>审计系统</td><td><span class="chip chip-low">低</span></td><td>不可变日志 + SIEM</td></tr>
            <tr><td><strong>I</strong> 信息泄露</td><td>API 响应过度</td><td>数据服务层</td><td><span class="chip chip-high">高</span></td><td>字段级脱敏 + 最小权限</td></tr>
            <tr><td><strong>D</strong> 拒绝服务</td><td>连接耗尽</td><td>网关入口</td><td><span class="chip chip-medium">中</span></td><td>限流 + WAF + CDN</td></tr>
            <tr><td><strong>E</strong> 提权</td><td>容器逃逸</td><td>K8s 集群</td><td><span class="chip chip-critical">严重</span></td><td>Pod 安全策略 + 运行时防护</td></tr>
          </table>
        </div>
      `;
    }

    // ─── 业务安全：BCP 管理 ───
    case 'bcp-mgmt': {
      return html`
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">计划类型</label>
            <select class="form-select"><option>BCP 业务连续性计划</option><option>DRP 灾难恢复计划</option></select>
          </div>
        </div>
        /* [Phase 1B] 防御纵深设计选项 */
        <div class="form-group">
          <label class="form-label">防御纵深设计 [Phase 1B]</label>
          <div class="grid-2-mt-sm">
            <div class="box-input">
              <div class="text-xs text-cyan mb-sm">🌐 网络分段</div>
              <select class="form-select"><option selected>已完成 VLAN 分段</option><option>微分段进行中</option><option>待规划</option></select>
            </div>
            <div class="box-input">
              <div class="text-xs text-green mb-sm">🛡️ DMZ 区域</div>
              <select class="form-select"><option selected>标准 DMZ 已部署</option><option>云 DMZ 待规划</option><option>无 DMZ</option></select>
            </div>
            <div class="box-input">
              <div class="text-xs text-amber mb-sm">🏢 安全区域</div>
              <select class="form-select"><option selected>办公区/生产区隔离</option><option>零信任区域规划中</option><option>未分区</option></select>
            </div>
            <div class="box-input">
              <div class="text-xs text-purple mb-sm">💻 应用层防护</div>
              <select class="form-select"><option selected>WAF + RASP 已部署</option><option>仅 WAF</option><option>待部署</option></select>
            </div>
          </div>
        </div>
          </div>
          <div class="form-group">
            <label class="form-label">演练方式</label>
            <select class="form-select"><option>桌面推演</option><option>模拟演练</option><option>全量实战</option></select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">参与部门</label>
          <input class="form-input" value="IT运维、客服、财务" />
        </div>
        <button class="exec-btn exec-btn-teal" ?disabled=${executing} @click=${onExecute}>
          ${executing ? html`准备中...` : html`🛡️ 创建演练计划`}
        </button>
        <div class="result-section">
          <div class="result-title">BCP 演练检查清单</div>
          <table class="result-table">
            <tr><th>检查项</th><th>RTO 目标</th><th>实际</th><th>结果</th></tr>
            <tr><td>核心系统切换</td><td>≤ 30 min</td><td>22 min</td><td><span class="chip chip-pass">达标</span></td></tr>
            <tr><td>数据恢复完整性</td><td>≤ 60 min</td><td>45 min</td><td><span class="chip chip-pass">达标</span></td></tr>
            <tr><td>客户通知到位</td><td>≤ 15 min</td><td>18 min</td><td><span class="chip chip-fail">未达标</span></td></tr>
            <tr><td>备用通信链路</td><td>≤ 10 min</td><td>8 min</td><td><span class="chip chip-pass">达标</span></td></tr>
            <tr><td>管理团队集结</td><td>≤ 20 min</td><td>15 min</td><td><span class="chip chip-pass">达标</span></td></tr>
          </table>
          <div class="result-item mt-center">
            <span class="text-muted-sm">RTO 达标率</span>
            <span class="score-md text-teal">96%</span>
            <span class="chip chip-medium">1 项需改进</span>
          </div>
        </div>
      `;
    }

    // ─── 供应链：SBOM 扫描 ───
    case 'sbom-scan': {
      const sbom = result as ReturnType<typeof _mockSBOM> | null;
      return html`
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">供应商</label>
            <select class="form-select"><option>云盾科技</option><option>安恒信息</option><option>全部供应商</option></select>
          </div>
          <div class="form-group">
            <label class="form-label">扫描深度</label>
            <select class="form-select"><option>浅层扫描</option><option selected>深度扫描</option><option>合规扫描</option></select>
          </div>
        </div>
        <button class="exec-btn exec-btn-lime" ?disabled=${executing} @click=${onExecute}>
          ${executing ? html`扫描中...` : html`📦 开始 SBOM 扫描`}
        </button>
        ${sbom ? html`
          <div class="result-section">
            <div class="result-title">组件清单（${sbom.length} 个组件，${sbom.reduce((s, c) => s + c.vulns, 0)} 个已知漏洞）</div>
            <table class="result-table">
              <tr><th>组件</th><th>版本</th><th>许可证</th><th>漏洞</th><th>风险</th></tr>
              ${sbom.map(c => html`
                <tr>
                  <td class="text-bold">${c.component}</td>
                  <td class="text-muted">${c.version}</td>
                  <td>${c.license}</td>
                  <td>${c.vulns > 0 ? html`<span class="chip chip-critical">${c.vulns}</span>` : html`<span class="chip chip-pass">0</span>`}</td>
                  <td><span class="chip ${_riskClass(c.risk)}">${c.risk}</span></td>
                </tr>
              `)}
            </table>
          </div>
        ` : nothing}
      `;
    }


    // ─── 指挥官：AI 调度 ───
    case 'ai-dispatch': {
      return html`
        <div class="form-row">
          <div class="form-group"><label class="form-label">调度模式</label><select class="form-select"><option>自动响应</option><option>半自动审批</option><option>手动触发</option></select></div>
          <div class="form-group"><label class="form-label">优先级过滤</label><select class="form-select"><option>P0 仅</option><option selected>P0+P1</option><option>全部</option></select></div>
        </div>
        <button class="exec-btn exec-btn-orange" ?disabled=${executing} @click=${onExecute}>${executing ? html`调度中...` : html`🤖 启动 AI 调度`}</button>
        <div class="result-section">
          <div class="result-title">调度决策</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">P1 告警自动升级</span><span class="chip chip-high">已通知安全指挥官</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">漏洞扫描任务分配</span><span class="chip chip-pass">分配至安全专家 A</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">合规检查触发</span><span class="chip chip-info">PIPL 审计已排入队列</span></div></div>
        </div>
      `;
    }

    // ─── CISO：预算仪表盘 ───
    case 'budget-dash': {
      return html`
        <div class="form-group"><label class="form-label">预算周期</label><select class="form-select"><option>2026 年度</option><option>Q2 2026</option><option>Q1 2026</option></select></div>
        <button class="exec-btn exec-btn-violet" ?disabled=${executing} @click=${onExecute}>${executing ? html`刷新中...` : html`💰 刷新预算`}</button>
        <div class="result-section">
          <div class="result-title">预算执行概况</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">技术投入</span><span class="chip chip-medium">¥1,280万 / ¥1,600万 (80%)</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">人员培训</span><span class="chip chip-pass">¥85万 / ¥120万 (71%)</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">合规认证</span><span class="chip chip-pass">¥32万 / ¥45万 (71%)</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">应急储备</span><span class="chip chip-info">¥0 / ¥200万 (0%)</span></div></div>
          <div class="result-item mt-center"><div class="ri-desc text-muted-sec">总预算使用率 63%，技术投入同比 ↑18%</div></div>
        </div>
      `;
    }

    // ─── 架构师：云安全 ───
    case 'cloud-security': {
      return html`
        <div class="form-row">
          <div class="form-group"><label class="form-label">云平台</label><select class="form-select"><option>AWS</option><option>Azure</option><option>阿里云</option><option selected>全部</option></select></div>
          <div class="form-group"><label class="form-label">检查范围</label><select class="form-select"><option>IAM 配置</option><option>网络 ACL</option><option>存储策略</option><option selected>全面扫描</option></select></div>
        </div>
        <button class="exec-btn exec-btn-cyan" ?disabled=${executing} @click=${onExecute}>${executing ? html`检查中...` : html`☁️ 开始检查`}</button>
        <div class="result-section">
          <div class="result-title">云安全配置审计</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">S3 Bucket 公开访问</span><span class="chip chip-critical">3 个 Bucket 未启用 Block Public Access</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">IAM 角色权限过度</span><span class="chip chip-high">12 个角色拥有 AdministratorAccess</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">安全组规则宽松</span><span class="chip chip-medium">8 条规则开放 0.0.0.0/0 入站</span></div></div>
        </div>
      `;
    }

    // ─── 供应链：合同审查 ───
    case 'contract-review': {
      return html`
        <div class="form-group"><label class="form-label">合同类型</label><select class="form-select"><option>数据处理协议 DPA</option><option>保密协议 NDA</option><option>服务级别协议 SLA</option><option selected>全面审查</option></select></div>
        <button class="exec-btn exec-btn-lime" ?disabled=${executing} @click=${onExecute}>${executing ? html`审查中...` : html`📋 开始审查`}</button>
        </div>
        /* [Phase 1B] DPA 数据处理协议管理 */
        <div class="form-group">
          <label class="form-label">DPA 数据处理协议 [Phase 1B]</label>
          <div class="grid-2-mt-sm">
            <div class="box-input">
              <div class="text-xs text-purple mb-sm">📋 DPA 状态</div>
              <select class="form-select"><option selected>12 份有效 DPA</option><option>3 份待签署</option><option>2 份过期</option><option>全部过期</option></select>
            </div>
            <div class="box-input">
              <div class="text-xs text-red mb-sm">⚠️ 数据泄露通知</div>
              <select class="form-select"><option selected>72h 内通知</option><option>48h 内通知</option><option>无要求</option></select>
            </div>
            <div class="box-input">
              <div class="text-xs text-green mb-sm">🌍 跨境传输</div>
              <select class="form-select"><option selected>标准合同条款 SCC</option><option>约束性公司规则 BCR</option><option>充分性认定</option><option>禁止跨境</option></select>
            </div>
            <div class="box-input">
              <div class="text-xs text-amber mb-sm">🔒 数据处理限制</div>
              <select class="form-select"><option selected>仅指定目的</option><option>允许二次使用</option><option>无限制</option></select>
            </div>
          </div>
        </div>
        <div class="result-section">
          <div class="result-title">合同安全条款审查</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">数据泄露通知条款</span><span class="chip chip-critical">15 份合同缺少 72h 通知要求</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">安全审计权利</span><span class="chip chip-high">8 份合同未包含审计条款</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">数据本地化要求</span><span class="chip chip-medium">5 份跨境合同缺少本地存储条款</span></div></div>
        </div>
      `;
    }

    // ─── 业务安全：成本计算 ───
    case 'cost-calc': {
      return html`
        <div class="form-row">
          <div class="form-group"><label class="form-label">投资方案</label><select class="form-select"><option selected>零信任架构</option><option>SOC 升级</option><option>安全培训</option></select></div>
          <div class="form-group"><label class="form-label">计算周期</label><select class="form-select"><option>1 年</option><option selected>3 年</option><option>5 年</option></select></div>
        </div>
        <button class="exec-btn exec-btn-teal" ?disabled=${executing} @click=${onExecute}>${executing ? html`计算中...` : html`📊 计算 ROI`}</button>
        <div class="result-section">
          <div class="result-title">零信任架构 ROI（3年）</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">投资总额</span><span class="chip chip-info">¥320万（硬件+软件+服务）</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">风险降低收益</span><span class="chip chip-pass">¥480万（事件减少 65%）</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">合规效率提升</span><span class="chip chip-pass">¥120万（审计时间减少 40%）</span></div></div>
          <div class="result-item mt-center"><div class="ri-desc text-muted-sec">净 ROI 87.5%，回收期 1.8 年</div></div>
        </div>
      `;
    }

    // ─── 隐私官：数据地图 ───
    case 'data-map': {
      return html`
        <div class="form-group"><label class="form-label">数据分类</label><select class="form-select"><option>个人数据</option><option>敏感数据</option><option>跨境数据</option><option selected>全量</option></select></div>
        <button class="exec-btn exec-btn-purple" ?disabled=${executing} @click=${onExecute}>${executing ? html`生成中...` : html`🗺️ 生成数据地图`}</button>
        <div class="result-section">
          <div class="result-title">数据资产分布</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">L4 极敏感</span><span class="chip chip-critical">12 个数据集</span></div><div class="ri-desc">生物特征/金融信息</div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">L3 敏感</span><span class="chip chip-high">45 个数据集</span></div><div class="ri-desc">个人身份/健康记录</div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">L2 内部</span><span class="chip chip-medium">128 个数据集</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">L1 公开</span><span class="chip chip-pass">67 个数据集</span></div></div>
          <div class="result-item mt-center"><div class="ri-desc text-muted-sec">跨境数据流 3 条待审查</div></div>
        </div>
      `;
    }

    // ─── 隐私官：GDPR 审计 + 数据主体权利请求 ───
    // [Phase 1A] 增强：增加「数据主体权利请求」子功能
    case 'gdpr-audit': {
      return html`
        <div class="form-group"><label class="form-label">审计范围</label><select class="form-select"><option>Art.5-6 合法性</option><option>Art.13-14 透明性</option><option>Art.25 隐私设计</option><option selected>全面审计</option></select></div>
        <button class="exec-btn exec-btn-purple" ?disabled=${executing} =${onExecute}>${executing ? html`审计中...` : html`📜 执行审计`}</button>
        <div class="result-section">
          <div class="result-title">GDPR 审计结果</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">数据处理合法性</span><span class="chip chip-pass">6/6 已记录</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">数据主体权利</span><span class="chip chip-pass">响应率 91%</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">DPIA 完成度</span><span class="chip chip-high">76% — 3 项未完成</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">跨境传输合规</span><span class="chip chip-fail">2 条缺少 SCCs</span></div></div>
          <div class="result-item mt-center"><div class="ri-desc text-muted-sec">合规率 87%，2 项需优先整改</div></div>
        </div>

        <div class="mt-lg p-lg rounded bg-secondary border-default">
          <div class="text-sm text-purple section-subtitle">📋 数据主体权利请求（DSR）</div>
          
          <div class="form-group">
            <label class="form-label">权利类型</label>
            <select class="form-select">
              <option value="access">Art.15 访问权 — 查看个人数据</option>
              <option value="rectification">Art.16 更正权 — 修正错误数据</option>
              <option value="erasure">Art.17 删除权 — 要求删除数据</option>
              <option value="portability">Art.20 携带权 — 数据可携带性</option>
              <option value="restriction">Art.18 限制权 — 限制处理</option>
              <option value="objection">Art.21 反对权 — 反对自动化决策</option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">请求ID</label>
              <input class="form-input" placeholder="DSR-2026-XXXX" value="DSR-2026-0423" />
            </div>
            <div class="form-group">
              <label class="form-label">请求人</label>
              <input class="form-input" placeholder="姓名/邮箱" value="user.com" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">处理状态</label>
            <select class="form-select">
              <option>🟡 收到请求</option>
              <option>🔵 处理中</option>
              <option selected>🟢 已响应</option>
              <option>🔴 SLA 逾期</option>
              <option>⚫ 已拒绝</option>
            </select>
          </div>

          <div class="result-section mt-md">
            <div class="result-title">响应 SLA 追踪</div>
            <div class="result-item"><div class="ri-header"><span class="ri-title">Art.15 访问权</span><span class="chip chip-pass">23/30天 ✓</span></div><div class="ri-desc">SLA: 30天内响应 | 剩余 7 天</div></div>
            <div class="result-item"><div class="ri-header"><span class="ri-title">Art.16 更正权</span><span class="chip chip-pass">15/30天 ✓</span></div><div class="ri-desc">SLA: 30天内响应 | 剩余 15 天</div></div>
            <div class="result-item"><div class="ri-header"><span class="ri-title">Art.17 删除权</span><span class="chip chip-fail">32/30天 ⚠️</span></div><div class="ri-desc">SLA 逾期 2 天！需立即处理</div></div>
            <div class="result-item"><div class="ri-header"><span class="ri-title">Art.20 携带权</span><span class="chip chip-high">8/30天</span></div><div class="ri-desc">SLA: 30天内响应 | 剩余 22 天</div></div>
          </div>

          <div class="summary-bar">
            <span class="text-xs text-muted">总体响应率: <strong class="text-green">91%</strong> | 待处理: <strong class="text-amber">12</strong> | SLA 预警: <strong class="text-red">2</strong></span>
          </div>
        </div>
      `;
    }

    // ─── 架构师：IAM 配置 ───
    case 'iam-config': {
      return html`
        <div class="form-group"><label class="form-label">检查维度</label><select class="form-select"><option>权限分配</option><option>MFA 覆盖率</option><option>生命周期管理</option><option selected>全面检查</option></select></div>
        <button class="exec-btn exec-btn-cyan" ?disabled=${executing} @click=${onExecute}>${executing ? html`检查中...` : html`🔑 执行检查`}</button>
        <div class="result-section">
          <div class="result-title">IAM 配置审计</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">过度授权账户</span><span class="chip chip-high">23 个超范围权限</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">MFA 覆盖率</span><span class="chip chip-medium">87%（目标 95%）</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">僵尸账户</span><span class="chip chip-high">15 个 90+ 天未登录</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">特权账户管理</span><span class="chip chip-medium">PAM 覆盖率 72%</span></div></div>
        </div>
      `;
    }

    // ─── 安全运营：事件管理 ───
    case 'incident-mgmt': {
      return html`
        <div class="form-row">
          <div class="form-group"><label class="form-label">事件级别</label><select class="form-select"><option>P0 紧急</option><option>P1 高</option><option>P2 中</option><option selected>全部</option></select></div>
          <div class="form-group"><label class="form-label">时间范围</label><select class="form-select"><option>24h</option><option selected>7天</option><option>30天</option></select></div>
        </div>
        <button class="exec-btn exec-btn-red" ?disabled=${executing} @click=${onExecute}>${executing ? html`查询中...` : html`🚨 查询事件`}</button>
        <div class="result-section">
          <div class="result-title">活跃安全事件（7天）</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">INC-2026-0418</span><span class="chip chip-critical">P1 APT C2 通信检测</span></div><div class="ri-desc">10.0.1.45 异常外联</div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">INC-2026-0415</span><span class="chip chip-high">P2 异常 DNS 隧道</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">INC-2026-0412</span><span class="chip chip-medium">P2 暴力破解攻击</span></div><div class="ri-desc">来源 45.33.x.x</div></div>
        </div>
      `;
    }

    // ─── CISO：KPI 追踪 ───
    case 'kpi-track': {
      return html`
        <div class="form-group"><label class="form-label">KPI 周期</label><select class="form-select"><option selected>4月</option><option>Q2</option><option>2026年度</option></select></div>
        <button class="exec-btn exec-btn-blue" ?disabled=${executing} @click=${onExecute}>${executing ? html`刷新中...` : html`🎯 刷新 KPI`}</button>
        <div class="result-section">
          <div class="result-title">4月 KPI 达成情况</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">MTTD 检测时间</span><span class="chip chip-high">15min / 目标 12min</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">MTTR 响应时间</span><span class="chip chip-pass">45min / 目标 60min ✓</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">补丁覆盖率</span><span class="chip chip-pass">94% / 目标 90% ✓</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">SOAR 自动化率</span><span class="chip chip-pass">78% / 目标 70% ✓</span></div></div>
          <div class="result-item mt-center"><div class="ri-desc text-muted-sec">8 项 KPI 达成率 85%，MTTD 超标需优化</div></div>
        </div>
      `;
    }

    // ─── 安全运营：日志分析 ───
    case 'log-analysis': {
      return html`
        <div class="form-row">
          <div class="form-group"><label class="form-label">日志源</label><select class="form-select"><option selected>SIEM 全量</option><option>防火墙</option><option>DNS</option><option>Web 应用</option></select></div>
          <div class="form-group"><label class="form-label">时间窗口</label><select class="form-select"><option>1h</option><option>6h</option><option selected>24h</option><option>7d</option></select></div>
        </div>
        <button class="exec-btn exec-btn-orange" ?disabled=${executing} @click=${onExecute}>${executing ? html`分析中...` : html`📝 分析日志`}</button>
        <div class="result-section">
          <div class="result-title">异常日志分析（24h）</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">认证失败激增</span><span class="chip chip-critical">1,247 次 RDP 暴力破解</span></div><div class="ri-desc">来源 45.33.x.x</div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">异常 DNS 查询</span><span class="chip chip-high">3 个域名 TXT 记录数据外传</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">权限提升事件</span><span class="chip chip-high">2 次成功提权至 root</span></div></div>
        </div>
      `;
    }

    // ─── 安全专家：补丁管理 ───
    case 'patch-mgmt': {
      return html`
        <div class="form-row">
          <div class="form-group"><label class="form-label">补丁类型</label><select class="form-select"><option selected>安全补丁</option><option>功能更新</option><option>紧急修复</option></select></div>
          <div class="form-group"><label class="form-label">影响范围</label><select class="form-select"><option selected>关键资产</option><option>生产环境</option><option>全部</option></select></div>
        </div>
        <button class="exec-btn exec-btn-blue" ?disabled=${executing} @click=${onExecute}>${executing ? html`检查中...` : html`🔧 检查补丁`}</button>
        <div class="result-section">
          <div class="result-title">待安装补丁清单</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">CVE-2026-1234 Log4j2</span><span class="chip chip-critical">CVSS 9.1 — 8 台待补</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">CVE-2026-0892 MySQL</span><span class="chip chip-medium">CVSS 5.3 — 3 台待补</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">Nginx 1.25.3</span><span class="chip chip-high">缓冲区溢出 — 5 台待更新</span></div></div>
        </div>
      `;
    }

    // ─── 安全专家：渗透测试 ───
    case 'pen-test': {
      return html`
        <div class="form-row">
          <div class="form-group"><label class="form-label">测试类型</label><select class="form-select"><option>黑盒测试</option><option selected>灰盒测试</option><option>白盒测试</option><option>红队演练</option></select></div>
          <div class="form-group"><label class="form-label">目标范围</label><select class="form-select"><option>外网边界</option><option>内网横向</option><option>Web 应用</option><option selected>全面测试</option></select></div>
        </div>
        <button class="exec-btn exec-btn-red" ?disabled=${executing} @click=${onExecute}>${executing ? html`测试中...` : html`🔍 启动渗透测试`}</button>
        <div class="result-section">
          <div class="result-title">最近渗透测试结果</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">外网入口突破</span><span class="chip chip-critical">钓鱼获取管理员凭证 4h</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">内网横向移动</span><span class="chip chip-critical">Pass-the-Hash 获取域控</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">Web 应用漏洞</span><span class="chip chip-high">SQL 注入 + XSS 共 12 处</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">物理安全</span><span class="chip chip-medium">尾随进入机房未受阻</span></div></div>
        </div>
      `;
    }

    // ─── 隐私官：策略管理 ───
    case 'policy-mgmt': {
      return html`
        <div class="form-group"><label class="form-label">策略类型</label><select class="form-select"><option>信息安全策略</option><option>数据保护策略</option><option>访问控制策略</option><option selected>全部</option></select></div>
        <button class="exec-btn exec-btn-purple" ?disabled=${executing} @click=${onExecute}>${executing ? html`审查中...` : html`📄 审查策略`}</button>
        <div class="result-section">
          <div class="result-title">策略合规性检查</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">数据保留策略</span><span class="chip chip-fail">已过期 — 需更新至 2026 版</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">密码策略</span><span class="chip chip-pass">符合要求 — 90天轮换</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">远程办公策略</span><span class="chip chip-medium">需补充 Zero Trust 条款</span></div></div>
        </div>
      `;
    }

    // ─── 风险登记册 ───
    case 'risk-register': {
      return html`
        <div class="form-group"><label class="form-label">风险类别</label><select class="form-select"><option>技术风险</option><option>合规风险</option><option>运营风险</option><option selected>全部</option></select></div>
        <button class="exec-btn exec-btn-amber" ?disabled=${executing} @click=${onExecute}>${executing ? html`加载中...` : html`📋 查看风险`}</button>
        <div class="result-section">
          <div class="result-title">活跃风险清单</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">R-001 APT 攻击</span><span class="chip chip-critical">可能性:高 影响:严重</span></div><div class="ri-desc">状态：缓解中</div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">R-002 数据泄露</span><span class="chip chip-high">可能性:中 影响:严重</span></div><div class="ri-desc">状态：监控中</div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">R-003 合规违规</span><span class="chip chip-medium">可能性:中 影响:高</span></div><div class="ri-desc">状态：整改中</div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">R-004 供应链中断</span><span class="chip chip-low">可能性:低 影响:高</span></div><div class="ri-desc">状态：已转移</div></div>
        </div>
      `;
    }

    // ─── 供应链：第三方风险 ───
    case 'third-party-risk': {
      return html`
        <div class="form-group"><label class="form-label">评估模型</label><select class="form-select"><option>SIG 问卷</option><option>SOGLA</option><option>自定义</option><option selected>全面评估</option></select></div>
        <button class="exec-btn exec-btn-lime" ?disabled=${executing} @click=${onExecute}>${executing ? html`评估中...` : html`🔗 执行评估`}</button>
        <div class="result-section">
          <div class="result-title">第三方风险评估</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">云盾科技</span><span class="chip chip-high">B 级 — DPA 过期</span></div><div class="ri-desc">安全事件响应 SLA 不达标</div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">金蝶软件</span><span class="chip chip-pass">A 级 — SOC2 Type II</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">安恒信息</span><span class="chip chip-medium">B+ — SBOM 发现高危组件</span></div></div>
        </div>
      `;
    }

    // ─── 供应商评估 ───
    case 'vendor-eval': {
      return html`
        <div class="form-group"><label class="form-label">评估维度</label><select class="form-select"><option>安全认证</option><option>数据保护</option><option>业务连续性</option><option selected>全面评估</option></select></div>
        <button class="exec-btn exec-btn-teal" ?disabled=${executing} @click=${onExecute}>${executing ? html`评估中...` : html`🏢 评估供应商`}</button>
        <div class="result-section">
          <div class="result-title">供应商安全评级</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">云盾科技</span><span class="chip chip-medium">B 级 — ISO27001 已认证</span></div><div class="ri-desc">数据本地化不达标</div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">金蝶软件</span><span class="chip chip-pass">A 级 — SOC2 + ISO27001</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">远端科技</span><span class="chip chip-fail">C 级 — 缺少安全认证</span></div><div class="ri-desc">渗透测试未通过</div></div>
        </div>
      `;
    }

    // ─── 架构师：零信任评估 ───
    case 'zero-trust': {
      return html`
        <div class="form-group"><label class="form-label">评估维度</label><select class="form-select"><option>身份验证</option><option>设备安全</option><option>网络分段</option><option selected>全面评估</option></select></div>
        <button class="exec-btn exec-btn-cyan" ?disabled=${executing} @click=${onExecute}>${executing ? html`评估中...` : html`🛡️ 执行评估`}</button>
        <div class="result-section">
          <div class="result-title">零信任成熟度（NIST SP 800-207）</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">身份验证</span><span class="chip chip-medium">3.2/5 — MFA 覆盖 87%</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">设备安全</span><span class="chip chip-high">2.8/5 — EDR 覆盖 72%</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">网络分段</span><span class="chip chip-pass">3.5/5 — 微分段 60%</span></div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">应用安全</span><span class="chip chip-medium">3.0/5 — SASE 部署中</span></div></div>
          <div class="result-item mt-center"><div class="ri-desc text-muted-sec">综合成熟度 3.1/5，优先提升设备安全</div></div>
        </div>
      `;
    }

    // ─── 报告生成 ───
    case 'report-gen': {
      return html`
        <div class="form-row">
          <div class="form-group"><label class="form-label">报告类型</label><select class="form-select"><option>安全态势报告</option><option>合规报告</option><option>风险评估报告</option></select></div>
          <div class="form-group"><label class="form-label">时间范围</label><select class="form-select"><option selected>本月</option><option>本季度</option><option>本年度</option></select></div>
        </div>
        <button class="exec-btn exec-btn-blue" ?disabled=${executing} @click=${onExecute}>${executing ? html`生成中...` : html`📊 生成报告`}</button>
        <div class="result-section">
          <div class="result-title">报告预览</div>
          <div class="result-item line-relaxed">
            <div class="section-title">安全态势月度报告 — 2026年4月</div>
            <div class="text-muted-sec">
              <p><strong>总体态势：</strong>全域安全评分 79/100，活跃事件 7 起。</p>
              <p><strong>关键发现：</strong>APT C2 通信检测（已处置）、GDPR DPIA 完成度待提升。</p>
              <p><strong>建议行动：</strong>优先完成零信任二期、GDPR 差距整改。</p>
            </div>
            <div class="mt-flex">
              <button class="exec-btn box-btn-secondary">📄 导出 PDF</button>
            </div>
          </div>
        </div>
      `;
    }
    // ─── Phase 1C 新增工具面板 ───
    case 'security-governance': {
      return html`
        <div class="form-group"><label class="form-label">治理框架</label><select class="form-select"><option selected>ISO 27001</option><option>NIST CSF</option><option>等保2.0</option></select></div>
        <div class="form-group"><label class="form-label">评估范围</label><select class="form-select"><option selected>全组织</option><option>安全部门</option></select></div>
        <button class="exec-btn exec-btn-green" ?disabled=${executing} @click=${onExecute}>${executing ? '评估中...' : '🛡️ 执行评估'}</button>
        <div class="result-section"><div class="result-title">治理成熟度评估</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">安全治理</span><span class="chip chip-pass">3.5/5</span></div><div class="ri-desc">Policy/GDR/Risk 三层架构</div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">合规管理</span><span class="chip chip-medium">3.2/5</span></div><div class="ri-desc">GDPR/ISO27001 对齐度 92%</div></div>
        </div>
      `;
    }

    // ─── 指挥官：投资决策 [Phase 1C] ───
    case 'investment-decision': {
      return html`
        <div class="form-group"><label class="form-label">投资类型</label><select class="form-select"><option selected>安全工具</option><option>人员培训</option><option>基础设施</option></select></div>
        <div class="form-group"><label class="form-label">预算范围</label><select class="form-select"><option>50万以下</option><option selected>50-200万</option><option>200万以上</option></select></div>
        <button class="exec-btn exec-btn-blue" ?disabled=${executing} @click=${onExecute}>${executing ? '计算中...' : '📈 ROI 分析'}</button>
        <div class="result-section"><div class="result-title">ROI 分析结果</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">零信任架构</span><span class="chip chip-pass">ROI 285%</span></div><div class="ri-desc">投资 ¥320万，预期3年回报 ¥912万</div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">SOC 升级</span><span class="chip chip-pass">ROI 210%</span></div><div class="ri-desc">投资 ¥180万，预期3年回报 ¥378万</div></div>
        </div>
      `;
    }

    // ─── BSO：安全意识培训 [Phase 1C] ───
    case 'sec-awareness': {
      return html`
        <div class="form-group"><label class="form-label">培训类型</label><select class="form-select"><option selected>钓鱼模拟</option><option>安全意识课</option><option>合规培训</option></select></div>
        <div class="form-group"><label class="form-label">目标群体</label><select class="form-select"><option selected>全员</option><option>开发团队</option><option>管理层</option></select></div>
        <button class="exec-btn exec-btn-violet" ?disabled=${executing} @click=${onExecute}>${executing ? '发起中...' : '🎓 发起培训'}</button>
        <div class="result-section"><div class="result-title">培训效果统计</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">完成率</span><span class="chip chip-pass">87%</span></div><div class="ri-desc">本月已完成 1,305/1,500 人</div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">钓鱼识别率</span><span class="chip chip-pass">92%</span></div><div class="ri-desc">较上季度提升 15%</div></div>
        </div>
      `;
    }

    // ─── 隐私官：Cookie 管理 [Phase 1C] ───
    case 'cookie-mgmt': {
      return html`
        <div class="form-group"><label class="form-label">Cookie 类型</label><select class="form-select"><option>必要 Cookie</option><option selected>分析 Cookie</option><option>营销 Cookie</option></select></div>
        <div class="form-group"><label class="form-label">合规标准</label><select class="form-select"><option selected>GDPR</option><option>CCPA</option><option>PIPL</option></select></div>
        <button class="exec-btn exec-btn-amber" ?disabled=${executing} @click=${onExecute}>${executing ? '扫描中...' : '🍪 Cookie 审计'}</button>
        <div class="result-section"><div class="result-title">Cookie 合规状态</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">合规 Cookie</span><span class="chip chip-pass">23</span></div><div class="ri-desc">已清理 8 个不合规 Cookie</div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">同意率</span><span class="chip chip-pass">94%</span></div><div class="ri-desc">用户 Cookie 同意率达标</div></div>
        </div>
      `;
    }

    // ─── 隐私官：同意管理 [Phase 1C] ───
    case 'consent-mgmt': {
      return html`
        <div class="form-group"><label class="form-label">同意类型</label><select class="form-select"><option selected>明确同意</option><option>默示同意</option><option>选择退出</option></select></div>
        <div class="form-group"><label class="form-label">数据用途</label><select class="form-select"><option selected>营销通信</option><option>数据分析</option><option>第三方共享</option></select></div>
        <button class="exec-btn exec-btn-green" ?disabled=${executing} @click=${onExecute}>${executing ? '分析中...' : '✅ 同意率分析'}</button>
        <div class="result-section"><div class="result-title">同意管理状态</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">明确同意率</span><span class="chip chip-pass">94%</span></div><div class="ri-desc">营销用途同意 1,410/1,500</div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">撤回率</span><span class="chip chip-pass">3.2%</span></div><div class="ri-desc">月度撤回请求 48 件</div></div>
        </div>
      `;
    }

    // ─── Phase 1D: Commander 运营工具 ───
    case 'drill-mgmt': {
      return html`
        <div class="form-group"><label class="form-label">演练类型</label><select class="form-select"><option selected>红蓝对抗</option><option>桌面推演</option><option>实战演练</option><option>合规演练</option></select></div>
        <div class="form-group"><label class="form-label">演练范围</label><select class="form-select"><option selected>全组织</option><option>IT部门</option><option>核心业务</option></select></div>
        <button class="exec-btn exec-btn-amber" ?disabled=${executing} @click=${onExecute}>${executing ? '规划中...' : '🔥 发起演练'}</button>
        <div class="result-section"><div class="result-title">演练记录</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">Q1 红蓝对抗</span><span class="chip chip-pass">完成</span></div><div class="ri-desc">发现 12 个弱点，已修复 10 个</div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">Q2 桌面推演</span><span class="chip chip-medium">进行中</span></div><div class="ri-desc">勒索场景，3个部门参与</div></div>
        </div>
      `;
    }

    case 'devsecops': {
      return html`
        <div class="form-group"><label class="form-label">流水线阶段</label><select class="form-select"><option selected>SAST</option><option>DAST</option><option>SCA</option><option>容器扫描</option></select></div>
        <div class="form-group"><label class="form-label">项目</label><select class="form-select"><option selected>全部项目</option><option>核心业务</option><option>基础设施</option></select></div>
        <button class="exec-btn exec-btn-violet" ?disabled=${executing} @click=${onExecute}>${executing ? '扫描中...' : '🔄 安全扫描'}</button>
        <div class="result-section"><div class="result-title">DevSecOps 概览</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">流水线覆盖</span><span class="chip chip-pass">87%</span></div><div class="ri-desc">42/48 仓库已集成安全扫描</div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">SAST 漏洞</span><span class="chip chip-pass">23</span></div><div class="ri-desc">高危 5 / 中危 12 / 低危 6</div></div>
        </div>
      `;
    }

    case 'perf-mgmt': {
      return html`
        <div class="form-group"><label class="form-label">评估周期</label><select class="form-select"><option selected>Q2 2026</option><option>Q1 2026</option><option>年度</option></select></div>
        <div class="form-group"><label class="form-label">团队</label><select class="form-select"><option selected>安全团队</option><option>红队</option><option>蓝队</option><option>GRC</option></select></div>
        <button class="exec-btn exec-btn-cyan" ?disabled=${executing} @click=${onExecute}>${executing ? '评估中...' : '📊 绩效评估'}</button>
        <div class="result-section"><div class="result-title">安全绩效报告</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">团队评级</span><span class="chip chip-pass">B+</span></div><div class="ri-desc">综合评分 85/100，较上季 +5</div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">MTTR</span><span class="chip chip-pass">2.3h</span></div><div class="ri-desc">平均响应时间，目标 4h 以内</div></div>
        </div>
      `;
    }

    // ─── Phase 1D: Supply Chain 工具 ───
    case 'vendor-monitor': {
      return html`
        <div class="form-group"><label class="form-label">监控维度</label><select class="form-select"><option selected>安全态势</option><option>合规状态</option><option>SLA 达成</option><option>漏洞趋势</option></select></div>
        <div class="form-group"><label class="form-label">供应商</label><select class="form-select"><option selected>全部 (38)</option><option>高风险 (5)</option><option>新增 (3)</option></select></div>
        <button class="exec-btn exec-btn-cyan" ?disabled=${executing} @click=${onExecute}>${executing ? '监控中...' : '👁️ 刷新监控'}</button>
        <div class="result-section"><div class="result-title">供应商监控概览</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">健康供应商</span><span class="chip chip-pass">33/38</span></div><div class="ri-desc">87% 供应商安全评级达标</div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">预警</span><span class="chip chip-medium">5</span></div><div class="ri-desc">2 个合规降级 + 3 个漏洞激增</div></div>
        </div>
      `;
    }

    case 'sla-mgmt': {
      return html`
        <div class="form-group"><label class="form-label">SLA 类型</label><select class="form-select"><option selected>安全响应 SLA</option><option>漏洞修复 SLA</option><option>事件通知 SLA</option></select></div>
        <div class="form-group"><label class="form-label">统计周期</label><select class="form-select"><option selected>近30天</option><option>近90天</option><option>本年度</option></select></div>
        <button class="exec-btn exec-btn-green" ?disabled=${executing} @click=${onExecute}>${executing ? '统计中...' : '⏱️ SLA 分析'}</button>
        <div class="result-section"><div class="result-title">SLA 达成报告</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">总体 SLA</span><span class="chip chip-pass">94%</span></div><div class="ri-desc">36/38 供应商达到 SLA 标准</div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">违约事件</span><span class="chip chip-medium">2</span></div><div class="ri-desc">Vendor-A 响应超时 48h</div></div>
        </div>
      `;
    }

    case 'supply-intel': {
      return html`
        <div class="form-group"><label class="form-label">情报源</label><select class="form-select"><option selected>全部源</option><option>NVD</option><option>CISA KEV</option><option>厂商公告</option></select></div>
        <div class="form-group"><label class="form-label">相关组件</label><input class="form-input" value="log4j, openssl, spring" /></div>
        <button class="exec-btn exec-btn-amber" ?disabled=${executing} @click=${onExecute}>${executing ? '搜索中...' : '🌐 情报查询'}</button>
        <div class="result-section"><div class="result-title">供应链威胁情报</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">活跃威胁</span><span class="chip chip-fail">7</span></div><div class="ri-desc">3 个 Critical + 4 个 High 影响在用组件</div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">最新告警</span><span class="chip chip-medium">CVE-2026-1234</span></div><div class="ri-desc">OpenSSL 3.x 远程代码执行</div></div>
        </div>
      `;
    }

    case 'material-track': {
      return html`
        <div class="form-group"><label class="form-label">追踪维度</label><select class="form-select"><option selected>组件来源</option><option>许可证</option><option>版本状态</option></select></div>
        <div class="form-group"><label class="form-label">产品线</label><select class="form-select"><option selected>全部</option><option>核心产品</option><option>内部工具</option></select></div>
        <button class="exec-btn exec-btn-violet" ?disabled=${executing} @click=${onExecute}>${executing ? '追踪中...' : '📦 物料追踪'}</button>
        <div class="result-section"><div class="result-title">物料追踪报告</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">已追踪组件</span><span class="chip chip-pass">156</span></div><div class="ri-desc">覆盖率 92%，6 个未识别来源</div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">许可证风险</span><span class="chip chip-medium">3</span></div><div class="ri-desc">GPL 组件需法务审核</div></div>
        </div>
      `;
    }

    // ─── Phase 1E: Architect 数据/容灾/治理 + BSO BIA ───
    case 'bia-analysis': {
      return html`
        <div class="form-group"><label class="form-label">分析范围</label><select class="form-select"><option selected>核心业务流程</option><option>全部流程</option><option>IT 服务</option></select></div>
        <div class="form-group"><label class="form-label">场景</label><select class="form-select"><option selected>综合中断</option><option>网络攻击</option><option>自然灾害</option><option>供应链中断</option></select></div>
        <button class="exec-btn exec-btn-amber" ?disabled=${executing} @click=${onExecute}>${executing ? '分析中...' : '📉 执行 BIA'}</button>
        <div class="result-section"><div class="result-title">业务影响分析</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">核心流程覆盖</span><span class="chip chip-pass">88%</span></div><div class="ri-desc">22/25 核心业务流程已完成 BIA</div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">最大影响</span><span class="chip chip-fail">¥2.3M/h</span></div><div class="ri-desc">支付系统中断每小时损失预估</div></div>
        </div>
      `;
    }

    case 'data-arch': {
      return html`
        <div class="form-group"><label class="form-label">数据分类</label><select class="form-select"><option selected>全量数据</option><option>敏感数据</option><option>个人数据</option><option>财务数据</option></select></div>
        <div class="form-group"><label class="form-label">加密策略</label><select class="form-select"><option selected>AES-256</option><option>国密SM4</option><option>RSA-4096</option></select></div>
        <button class="exec-btn exec-btn-cyan" ?disabled=${executing} @click=${onExecute}>${executing ? '分析中...' : '🗄️ 架构评估'}</button>
        <div class="result-section"><div class="result-title">数据安全架构</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">数据分类覆盖</span><span class="chip chip-pass">92%</span></div><div class="ri-desc">14,580/15,850 数据资产已分类标记</div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">加密覆盖率</span><span class="chip chip-pass">98%</span></div><div class="ri-desc">静态数据 100% + 传输中 96%</div></div>
        </div>
      `;
    }

    case 'dr-arch': {
      return html`
        <div class="form-group"><label class="form-label">容灾等级</label><select class="form-select"><option selected>Tier 4 (Active-Active)</option><option>Tier 3 (Hot Standby)</option><option>Tier 2 (Warm)</option></select></div>
        <div class="form-group"><label class="form-label">RTO/RPO 目标</label><select class="form-select"><option selected>RTO 2h / RPO 15min</option><option>RTO 4h / RPO 1h</option><option>RTO 24h / RPO 4h</option></select></div>
        <button class="exec-btn exec-btn-green" ?disabled=${executing} @click=${onExecute}>${executing ? '评估中...' : '🏗️ 容灾评估'}</button>
        <div class="result-section"><div class="result-title">容灾架构评估</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">RTO 达成</span><span class="chip chip-pass">2h</span></div><div class="ri-desc">核心系统实际切换时间 1.8h</div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">RPO 达成</span><span class="chip chip-pass">12min</span></div><div class="ri-desc">数据同步延迟在可控范围</div></div>
        </div>
      `;
    }

    case 'arch-governance': {
      return html`
        <div class="form-group"><label class="form-label">评审周期</label><select class="form-select"><option selected>本季度</option><option>本年度</option><option>全部</option></select></div>
        <div class="form-group"><label class="form-label">架构域</label><select class="form-select"><option selected>全部</option><option>应用架构</option><option>数据架构</option><option>基础设施</option></select></div>
        <button class="exec-btn exec-btn-violet" ?disabled=${executing} @click=${onExecute}>${executing ? '审查中...' : '📋 架构评审'}</button>
        <div class="result-section"><div class="result-title">架构治理报告</div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">评审覆盖率</span><span class="chip chip-pass">100%</span></div><div class="ri-desc">本季 12 个新系统全部通过安全架构评审</div></div>
          <div class="result-item"><div class="ri-header"><span class="ri-title">技术债务</span><span class="chip chip-medium">3</span></div><div class="ri-desc">遗留系统待迁移，预计 Q3 完成</div></div>
        </div>
      `;
    }

    // ─── Phase 2: Advanced Interactive Panels ───
    case 'dark-sim-engine': {
      return html`<sc-dark-sim-engine></sc-dark-sim-engine>`;
    }

    case 'scan-results': {
      return html`<sc-scan-results-table></sc-scan-results-table>`;
    }

    case 'security-timeline': {
      return html`<sc-security-timeline></sc-security-timeline>`;
    }

    case 'evolution-dashboard': {
      return html`<evolution-dashboard></evolution-dashboard>`;
    }

    default:
      return html`<div class="text-muted text-center" style="padding:20px">工具面板开发中...</div>`;
  }
}
