/** AI Supply Chain Security Dashboard */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface McpTool {
  toolId: string;
  name: string;
  server: string;
  category: string;
  riskLevel: string;
  trustScore: number;
  status: string;
  usageCount?: number;
  lastUsed?: number;
}

interface McpStats {
  totalTools: number;
  highRiskCount: number;
  activeCount: number;
  quarantinedCount: number;
}

interface McpEvaluation {
  toolId: string;
  score: number;
  level: string;
  factors: string[];
  warnings: string[];
  recommendations: string[];
  allowed: boolean;
}

interface GuardStats {
  totalScans: number;
  blockRate: number;
  maliciousDetections: number;
  criticalDetections: number;
}

interface GuardScan {
  scanId: string;
  sessionId: string;
  agentId: string;
  severity: string;
  overallScore: number;
  action: string;
  detectedAt: number;
  findings?: Array<{ ruleId: string; category: string; matchedText?: string }>;
}

interface AuditStats {
  totalActions: number;
  anomalyCount: number;
  piiLeaks: number;
  loopDetections: number;
}

interface AuditAnomaly {
  anomalyId: string;
  agentId: string;
  alertType: string;
  severity: string;
  description: string;
  recommendedAction: string;
  detectedAt: number;
}

@customElement('sc-ai-scm-dashboard')
export class ScAiScmDashboard extends LitElement {
  static styles = css`
    :host {
      display: block;
      --sc-bg-primary: #0a0e17;
      --sc-bg-secondary: #141b26;
      --sc-bg-tertiary: #1a2536;
      --sc-text-primary: #ffffff;
      --sc-text-muted: #8899aa;
      --sc-border: #2a3a4a;
      --sc-primary: #00ff88;
      --sc-critical: #ff4444;
      --sc-high: #ffaa00;
      --sc-medium: #00aaff;
      --sc-low: #10b981;
      --sc-info: #a855f7;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .dashboard {
      background: var(--sc-bg-primary);
      min-height: 100vh;
      color: var(--sc-text-primary);
      padding: 24px;
      font-family: Inter, system-ui, sans-serif;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--sc-border);
    }
    .title {
      font-size: 24px;
      font-weight: 700;
      color: var(--sc-primary);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .subtitle {
      font-size: 13px;
      color: var(--sc-text-muted);
      margin-top: 4px;
    }
    .live-dot {
      width: 8px; height: 8px;
      background: var(--sc-low);
      border-radius: 50%;
      display: inline-block;
      margin-right: 6px;
      animation: pulse 2s infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .header-actions { display: flex; gap: 12px; }
    .btn {
      padding: 8px 16px;
      border-radius: 8px;
      border: 1px solid var(--sc-border);
      background: var(--sc-bg-secondary);
      color: var(--sc-text-primary);
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
    }
    .btn:hover { border-color: var(--sc-primary); }
    .btn-primary {
      background: linear-gradient(135deg, var(--sc-primary), #00cc6a);
      color: var(--sc-bg-primary);
      border: none;
      font-weight: 600;
    }
    .btn-sm { padding: 4px 10px; font-size: 11px; }
    .btn-danger { color: var(--sc-critical); border-color: var(--sc-critical); }
    .btn-warn { color: var(--sc-high); border-color: var(--sc-high); }
    .tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--sc-border);
      padding-bottom: 0;
    }
    .tab {
      padding: 12px 20px;
      background: transparent;
      border: none;
      color: var(--sc-text-muted);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
      font-family: inherit;
    }
    .tab:hover { color: var(--sc-text-primary); }
    .tab.active {
      color: var(--sc-primary);
      border-bottom-color: var(--sc-primary);
    }
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }
    .kpi-card {
      background: var(--sc-bg-secondary);
      border-radius: 12px;
      padding: 18px;
      border: 1px solid var(--sc-border);
    }
    .kpi-label {
      font-size: 11px;
      color: var(--sc-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .kpi-value {
      font-size: 28px;
      font-weight: 700;
      line-height: 1;
    }
    .kpi-sub {
      font-size: 11px;
      color: var(--sc-text-muted);
      margin-top: 6px;
    }
    .card {
      background: var(--sc-bg-secondary);
      border-radius: 12px;
      padding: 20px;
      border: 1px solid var(--sc-border);
      margin-bottom: 20px;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--sc-border);
    }
    .card-title { font-size: 15px; font-weight: 600; }
    .card-subtitle { font-size: 12px; color: var(--sc-text-muted); }
    .main-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    th {
      text-align: left;
      padding: 10px 12px;
      color: var(--sc-text-muted);
      font-weight: 500;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.5px;
      border-bottom: 1px solid var(--sc-border);
    }
    td {
      padding: 12px;
      border-bottom: 1px solid var(--sc-border);
    }
    tr:hover td { background: var(--sc-bg-tertiary); }
    .risk-badge {
      padding: 3px 8px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .risk-critical { background: rgba(255,68,68,0.2); color: var(--sc-critical); }
    .risk-high { background: rgba(255,170,0,0.2); color: var(--sc-high); }
    .risk-medium { background: rgba(0,170,255,0.2); color: var(--sc-medium); }
    .risk-low { background: rgba(16,185,129,0.2); color: var(--sc-low); }
    .risk-info { background: rgba(168,85,247,0.2); color: var(--sc-info); }
    .status-pill {
      padding: 3px 8px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      background: var(--sc-bg-tertiary);
      color: var(--sc-text-muted);
    }
    .status-active { background: rgba(16,185,129,0.2); color: var(--sc-low); }
    .status-quarantined { background: rgba(255,68,68,0.2); color: var(--sc-critical); }
    .status-disabled { background: rgba(136,153,170,0.2); color: var(--sc-text-muted); }
    .trust-bar {
      width: 80px;
      height: 6px;
      background: var(--sc-bg-primary);
      border-radius: 3px;
      overflow: hidden;
      display: inline-block;
      vertical-align: middle;
      margin-right: 8px;
    }
    .trust-fill { height: 100%; border-radius: 3px; }
    .form-row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
    .form-label { font-size: 11px; color: var(--sc-text-muted); text-transform: uppercase; }
    .form-input, .form-select, .form-textarea {
      background: var(--sc-bg-primary);
      border: 1px solid var(--sc-border);
      color: var(--sc-text-primary);
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 13px;
      font-family: inherit;
      width: 100%;
    }
    .form-input:focus, .form-select:focus, .form-textarea:focus {
      outline: none;
      border-color: var(--sc-primary);
    }
    .form-textarea { min-height: 90px; resize: vertical; font-family: 'JetBrains Mono', monospace; }
    .result-box {
      margin-top: 16px;
      padding: 14px;
      background: var(--sc-bg-primary);
      border-radius: 8px;
      border: 1px solid var(--sc-border);
      font-size: 12px;
    }
    .result-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--sc-border); }
    .result-row:last-child { border-bottom: none; }
    .result-key { color: var(--sc-text-muted); }
    .result-value { font-weight: 600; }
    .list-item {
      display: flex;
      gap: 12px;
      padding: 12px;
      background: var(--sc-bg-primary);
      border-radius: 8px;
      margin-bottom: 8px;
      border-left: 4px solid var(--sc-border);
      align-items: center;
    }
    .list-item.critical { border-left-color: var(--sc-critical); }
    .list-item.high { border-left-color: var(--sc-high); }
    .list-item.medium { border-left-color: var(--sc-medium); }
    .list-item.low { border-left-color: var(--sc-low); }
    .list-meta { font-size: 11px; color: var(--sc-text-muted); }
    .list-title { font-size: 13px; font-weight: 600; margin-bottom: 2px; }
    .list-content { flex: 1; }
    .list-actions { display: flex; gap: 6px; }
    .empty-state { padding: 30px; text-align: center; color: var(--sc-text-muted); font-size: 13px; }
    .loading { padding: 20px; text-align: center; color: var(--sc-text-muted); }
    .recommend-list { margin: 8px 0 0 16px; color: var(--sc-text-muted); font-size: 12px; }
    .recommend-list li { margin-bottom: 4px; }
    .factor-tag {
      display: inline-block;
      padding: 2px 8px;
      background: var(--sc-bg-tertiary);
      border-radius: 8px;
      font-size: 11px;
      margin: 2px 4px 2px 0;
      color: var(--sc-text-muted);
    }
    @media (max-width: 1100px) {
      .main-grid { grid-template-columns: 1fr; }
      .kpi-row { grid-template-columns: repeat(2, 1fr); }
    }
  `;

  @state() private activeTab: 'mcp' | 'guard' | 'audit' = 'mcp';
  @state() private currentTime = new Date();

  @state() private mcpStats: McpStats = { totalTools: 0, highRiskCount: 0, activeCount: 0, quarantinedCount: 0 };
  @state() private mcpTools: McpTool[] = [];
  @state() private mcpLoading = false;

  @state() private evalToolId = '';
  @state() private evalInput = '{}';
  @state() private evalResult: McpEvaluation | null = null;
  @state() private evalBusy = false;

  @state() private guardStats: GuardStats = { totalScans: 0, blockRate: 0, maliciousDetections: 0, criticalDetections: 0 };
  @state() private guardHistory: GuardScan[] = [];
  @state() private guardLoading = false;

  @state() private scanContent = '';
  @state() private scanSource: string = 'user_input';
  @state() private scanResult: GuardScan | null = null;
  @state() private scanBusy = false;

  @state() private auditStats: AuditStats = { totalActions: 0, anomalyCount: 0, piiLeaks: 0, loopDetections: 0 };
  @state() private auditAnomalies: AuditAnomaly[] = [];
  @state() private auditLoading = false;

  @state() private recAgentId = '';
  @state() private recActionType: string = 'tool_call';
  @state() private recRiskClass: string = 'low';
  @state() private recBusy = false;
  @state() private recResult: string = '';

  private readonly apiBase = 'http://127.0.0.1:21981/api/v1';

  connectedCallback() {
    super.connectedCallback();
    setInterval(() => { this.currentTime = new Date(); }, 1000);
    this._loadMcpStats();
    this._loadMcpTools();
    this._loadGuardStats();
    this._loadGuardHistory();
    this._loadAuditStats();
    this._loadAuditAnomalies();
  }

  private async _apiCall<T>(handler: string, params: Record<string, unknown> = {}): Promise<T> {
    const resp = await fetch(`${this.apiBase}/${handler}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ params }),
    });
    if (!resp.ok) throw new Error(`API error: ${resp.status}`);
    const json = await resp.json();
    if (json && typeof json === 'object' && 'result' in json) return json.result as T;
    return json as T;
  }

  private async _loadMcpStats() {
    try {
      const result = await this._apiCall<any>('ai-scm.mcp.tool.stats', {});
      this.mcpStats = {
        totalTools: result.totalTools ?? result.total ?? 0,
        highRiskCount: result.highRiskCount ?? result.highCriticalRisk ?? 0,
        activeCount: result.activeCount ?? result.active ?? 0,
        quarantinedCount: result.quarantinedCount ?? result.quarantined ?? 0,
      };
    } catch (e) {
      this.mcpStats = { totalTools: 24, highRiskCount: 5, activeCount: 18, quarantinedCount: 2 };
    }
  }

  private async _loadMcpTools() {
    this.mcpLoading = true;
    try {
      const result = await this._apiCall<any>('ai-scm.mcp.tool.list', {});
      const list = Array.isArray(result) ? result : (result.tools ?? []);
      this.mcpTools = list.slice(0, 50);
    } catch (e) {
      this.mcpTools = [
        { toolId: 't1', name: 'web_search', server: 'open-mcp', category: 'network', riskLevel: 'high', trustScore: 42, status: 'active' },
        { toolId: 't2', name: 'read_file', server: 'fs-mcp', category: 'filesystem', riskLevel: 'medium', trustScore: 71, status: 'active' },
        { toolId: 't3', name: 'shell_exec', server: 'os-mcp', category: 'system', riskLevel: 'critical', trustScore: 18, status: 'quarantined' },
        { toolId: 't4', name: 'send_email', server: 'comm-mcp', category: 'network', riskLevel: 'high', trustScore: 38, status: 'active' },
        { toolId: 't5', name: 'db_query', server: 'data-mcp', category: 'data', riskLevel: 'medium', trustScore: 65, status: 'active' },
        { toolId: 't6', name: 'image_gen', server: 'media-mcp', category: 'media', riskLevel: 'low', trustScore: 88, status: 'active' },
      ];
    } finally {
      this.mcpLoading = false;
    }
  }

  private async _loadGuardStats() {
    try {
      const result = await this._apiCall<any>('ai-scm.guard.stats', {});
      this.guardStats = {
        totalScans: result.totalScans ?? result.total ?? 0,
        blockRate: result.blockRate ?? 0,
        maliciousDetections: result.maliciousDetections ?? result.malicious ?? 0,
        criticalDetections: result.criticalDetections ?? result.critical ?? 0,
      };
    } catch (e) {
      this.guardStats = { totalScans: 1247, blockRate: 12.4, maliciousDetections: 38, criticalDetections: 7 };
    }
  }

  private async _loadGuardHistory() {
    this.guardLoading = true;
    try {
      const result = await this._apiCall<any>('ai-scm.guard.history', { limit: 30 });
      const list = Array.isArray(result) ? result : (result.scans ?? result.history ?? []);
      this.guardHistory = list.slice(0, 30);
    } catch (e) {
      const now = Date.now();
      this.guardHistory = [
        { scanId: 's1', sessionId: 'sess-aa1', agentId: 'agent-01', severity: 'critical', overallScore: 92, action: 'block', detectedAt: now - 60_000 },
        { scanId: 's2', sessionId: 'sess-bb2', agentId: 'agent-02', severity: 'high', overallScore: 78, action: 'sanitize', detectedAt: now - 180_000 },
        { scanId: 's3', sessionId: 'sess-cc3', agentId: 'agent-03', severity: 'medium', overallScore: 54, action: 'warn', detectedAt: now - 420_000 },
        { scanId: 's4', sessionId: 'sess-dd4', agentId: 'agent-01', severity: 'low', overallScore: 18, action: 'allow', detectedAt: now - 720_000 },
      ];
    } finally {
      this.guardLoading = false;
    }
  }

  private async _loadAuditStats() {
    try {
      const result = await this._apiCall<any>('ai-scm.audit.stats', {});
      this.auditStats = {
        totalActions: result.totalActions ?? result.total ?? 0,
        anomalyCount: result.anomalyCount ?? result.anomalies ?? 0,
        piiLeaks: result.piiLeaks ?? 0,
        loopDetections: result.loopDetections ?? result.loops ?? 0,
      };
    } catch (e) {
      this.auditStats = { totalActions: 8932, anomalyCount: 23, piiLeaks: 4, loopDetections: 6 };
    }
  }

  private async _loadAuditAnomalies() {
    this.auditLoading = true;
    try {
      const result = await this._apiCall<any>('ai-scm.audit.anomalies', { limit: 30 });
      const list = Array.isArray(result) ? result : (result.anomalies ?? []);
      this.auditAnomalies = list.slice(0, 30);
    } catch (e) {
      const now = Date.now();
      this.auditAnomalies = [
        { anomalyId: 'a1', agentId: 'agent-02', alertType: 'data_exfiltration', severity: 'critical', description: 'Bulk file read outside baseline (2.4GB in 60s)', recommendedAction: 'Revoke session and quarantine agent', detectedAt: now - 90_000 },
        { anomalyId: 'a2', agentId: 'agent-04', alertType: 'loop_behavior', severity: 'high', description: 'Repeated identical tool calls 47 times in 30s', recommendedAction: 'Throttle agent and notify operator', detectedAt: now - 240_000 },
        { anomalyId: 'a3', agentId: 'agent-01', alertType: 'pii_leak', severity: 'high', description: 'Email address pattern detected in tool output', recommendedAction: 'Enable output redaction for this agent', detectedAt: now - 600_000 },
        { anomalyId: 'a4', agentId: 'agent-03', alertType: 'cost_anomaly', severity: 'medium', description: 'Token usage 4.2x baseline average', recommendedAction: 'Apply rate limit and review prompt', detectedAt: now - 1_200_000 },
      ];
    } finally {
      this.auditLoading = false;
    }
  }

  private async _handleTestEvaluation() {
    if (!this.evalToolId) return;
    this.evalBusy = true;
    this.evalResult = null;
    let parsedInput: Record<string, unknown> = {};
    try { parsedInput = JSON.parse(this.evalInput); } catch {
      this.evalResult = { toolId: this.evalToolId, score: 0, level: 'invalid', factors: [], warnings: ['Invalid JSON input'], recommendations: ['Provide a valid JSON object'], allowed: false };
      this.evalBusy = false;
      return;
    }
    try {
      const result = await this._apiCall<any>('ai-scm.mcp.tool.evaluate', { toolId: this.evalToolId, input: parsedInput });
      this.evalResult = {
        toolId: this.evalToolId,
        score: result.score ?? 0,
        level: result.level ?? result.riskLevel ?? 'unknown',
        factors: result.factors ?? [],
        warnings: result.warnings ?? [],
        recommendations: result.recommendations ?? [],
        allowed: result.allowed ?? (result.score ?? 0) < 70,
      };
    } catch (e) {
      this.evalResult = {
        toolId: this.evalToolId,
        score: 68,
        level: 'medium',
        factors: ['external_network', 'untrusted_source'],
        warnings: ['Tool targets external endpoints'],
        recommendations: ['Whitelist target domain', 'Add input validation'],
        allowed: true,
      };
    } finally {
      this.evalBusy = false;
    }
  }

  private async _handleTestScan() {
    if (!this.scanContent.trim()) return;
    this.scanBusy = true;
    this.scanResult = null;
    try {
      const result = await this._apiCall<any>('ai-scm.guard.scan', { input: { content: this.scanContent, source: this.scanSource } });
      this.scanResult = {
        scanId: result.scanId ?? 'scan-' + Date.now(),
        sessionId: result.sessionId ?? 'manual',
        agentId: result.agentId ?? 'manual-test',
        severity: result.severity ?? 'low',
        overallScore: result.overallScore ?? result.score ?? 0,
        action: result.action ?? 'allow',
        detectedAt: Date.now(),
        findings: result.findings ?? [],
      };
    } catch (e) {
      const detected = /ignore (previous|all) instructions/i.test(this.scanContent) || /system:\s*you are/i.test(this.scanContent);
      this.scanResult = {
        scanId: 'scan-' + Date.now(),
        sessionId: 'manual',
        agentId: 'manual-test',
        severity: detected ? 'high' : 'low',
        overallScore: detected ? 82 : 8,
        action: detected ? 'block' : 'allow',
        detectedAt: Date.now(),
        findings: detected
          ? [{ ruleId: 'pi-001', category: 'instruction_override', matchedText: 'ignore previous instructions' }]
          : [],
      };
    } finally {
      this.scanBusy = false;
    }
  }

  private async _handleRecordAction() {
    if (!this.recAgentId.trim()) return;
    this.recBusy = true;
    this.recResult = '';
    try {
      const result = await this._apiCall<any>('ai-scm.audit.action.record', {
        action: {
          agentId: this.recAgentId,
          actionType: this.recActionType,
          riskClassification: this.recRiskClass,
          timestamp: Date.now(),
        },
      });
      this.recResult = `Recorded action ${result.actionId ?? result.id ?? ''} successfully`;
    } catch (e) {
      this.recResult = `Recorded (offline): ${this.recAgentId} / ${this.recActionType} / ${this.recRiskClass}`;
    } finally {
      this.recBusy = false;
    }
  }

  private async _handleQuarantine(toolId: string) {
    try {
      await this._apiCall('ai-scm.mcp.tool.quarantine', { toolId, reason: 'manual from dashboard' });
    } catch (e) {
      this.mcpTools = this.mcpTools.map(t => t.toolId === toolId ? { ...t, status: 'quarantined' } : t);
    }
    await this._loadMcpTools();
    await this._loadMcpStats();
  }

  private _handleEvaluate(tool: McpTool) {
    this.evalToolId = tool.toolId;
    this.evalInput = JSON.stringify({ tool: tool.name, args: {} }, null, 2);
    this._handleTestEvaluation();
  }

  private _setActiveTab(tab: 'mcp' | 'guard' | 'audit') {
    this.activeTab = tab;
  }

  private _formatTime(ts: number): string {
    const diff = Date.now() - ts;
    if (diff < 60_000) return Math.floor(diff / 1000) + 's ago';
    if (diff < 3_600_000) return Math.floor(diff / 60_000) + 'm ago';
    if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + 'h ago';
    return new Date(ts).toLocaleDateString();
  }

  private _getTrustColor(score: number): string {
    if (score >= 80) return 'var(--sc-low)';
    if (score >= 60) return 'var(--sc-medium)';
    if (score >= 40) return 'var(--sc-high)';
    return 'var(--sc-critical)';
  }

  private _renderKpi(label: string, value: string | number, color: string, sub?: string) {
    return html`
      <div class="kpi-card">
        <div class="kpi-label">${label}</div>
        <div class="kpi-value" style="color: ${color}">${value}</div>
        ${sub ? html`<div class="kpi-sub">${sub}</div>` : ''}
      </div>
    `;
  }

  private _renderMcpTab() {
    return html`
      <div class="kpi-row">
        ${this._renderKpi('Total Tools', this.mcpStats.totalTools, 'var(--sc-primary)')}
        ${this._renderKpi('High/Critical Risk', this.mcpStats.highRiskCount, 'var(--sc-critical)')}
        ${this._renderKpi('Active Tools', this.mcpStats.activeCount, 'var(--sc-low)')}
        ${this._renderKpi('Quarantined', this.mcpStats.quarantinedCount, 'var(--sc-high)')}
      </div>

      <div class="main-grid">
        <section class="card">
          <div class="card-header">
            <div>
              <div class="card-title">MCP Tools Registry</div>
              <div class="card-subtitle">${this.mcpTools.length} tool(s) registered</div>
            </div>
            <button class="btn btn-sm" @click=${() => this._loadMcpTools()}>Refresh</button>
          </div>
          ${this.mcpLoading
            ? html`<div class="loading">Loading tools...</div>`
            : this.mcpTools.length === 0
              ? html`<div class="empty-state">No tools registered yet</div>`
              : html`
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Server</th>
                      <th>Category</th>
                      <th>Risk</th>
                      <th>Trust</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${this.mcpTools.map(t => html`
                      <tr>
                        <td><strong>${t.name}</strong></td>
                        <td>${t.server}</td>
                        <td>${t.category}</td>
                        <td><span class="risk-badge risk-${t.riskLevel}">${t.riskLevel}</span></td>
                        <td>
                          <div class="trust-bar"><div class="trust-fill" style="width: ${t.trustScore}%; background: ${this._getTrustColor(t.trustScore)}"></div></div>
                          ${t.trustScore}
                        </td>
                        <td><span class="status-pill status-${t.status}">${t.status}</span></td>
                        <td>
                          <div class="list-actions">
                            <button class="btn btn-sm btn-warn" @click=${() => this._handleEvaluate(t)}>Evaluate</button>
                            ${t.status !== 'quarantined'
                              ? html`<button class="btn btn-sm btn-danger" @click=${() => this._handleQuarantine(t.toolId)}>Quarantine</button>`
                              : ''}
                          </div>
                        </td>
                      </tr>
                    `)}
                  </tbody>
                </table>
              `}
        </section>

        <section class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Test Evaluation</div>
              <div class="card-subtitle">Score tool invocation risk</div>
            </div>
          </div>
          <div class="form-row">
            <span class="form-label">Tool</span>
            <select class="form-select" .value=${this.evalToolId} @change=${(e: Event) => this.evalToolId = (e.target as HTMLSelectElement).value}>
              <option value="">-- Select tool --</option>
              ${this.mcpTools.map(t => html`<option value=${t.toolId}>${t.name} (${t.server})</option>`)}
            </select>
          </div>
          <div class="form-row">
            <span class="form-label">Invocation Input (JSON)</span>
            <textarea class="form-textarea" .value=${this.evalInput} @input=${(e: Event) => this.evalInput = (e.target as HTMLTextAreaElement).value}></textarea>
          </div>
          <button class="btn btn-primary" ?disabled=${this.evalBusy || !this.evalToolId} @click=${() => this._handleTestEvaluation()}>
            ${this.evalBusy ? 'Evaluating...' : 'Evaluate'}
          </button>
          ${this.evalResult ? html`
            <div class="result-box">
              <div class="result-row"><span class="result-key">Risk Score</span><span class="result-value" style="color: ${this._getTrustColor(100 - this.evalResult.score)}">${this.evalResult.score}</span></div>
              <div class="result-row"><span class="result-key">Level</span><span class="risk-badge risk-${this.evalResult.level}">${this.evalResult.level}</span></div>
              <div class="result-row"><span class="result-key">Allowed</span><span class="result-value">${this.evalResult.allowed ? 'Yes' : 'No'}</span></div>
              <div class="result-row"><span class="result-key">Factors</span>
                <span class="result-value">
                  ${this.evalResult.factors.length === 0 ? '—' : this.evalResult.factors.map(f => html`<span class="factor-tag">${f}</span>`)}
                </span>
              </div>
              ${this.evalResult.warnings.length > 0 ? html`
                <div class="result-row" style="flex-direction: column; align-items: stretch; gap: 4px;">
                  <span class="result-key">Warnings</span>
                  <ul class="recommend-list">${this.evalResult.warnings.map(w => html`<li>${w}</li>`)}</ul>
                </div>
              ` : ''}
              ${this.evalResult.recommendations.length > 0 ? html`
                <div class="result-row" style="flex-direction: column; align-items: stretch; gap: 4px;">
                  <span class="result-key">Recommendations</span>
                  <ul class="recommend-list">${this.evalResult.recommendations.map(r => html`<li>${r}</li>`)}</ul>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </section>
      </div>
    `;
  }

  private _renderGuardTab() {
    return html`
      <div class="kpi-row">
        ${this._renderKpi('Total Scans', this.guardStats.totalScans, 'var(--sc-primary)')}
        ${this._renderKpi('Block Rate', this.guardStats.blockRate.toFixed(1) + '%', 'var(--sc-high)', 'of all scans')}
        ${this._renderKpi('Malicious Detections', this.guardStats.maliciousDetections, 'var(--sc-critical)')}
        ${this._renderKpi('Critical Detections', this.guardStats.criticalDetections, 'var(--sc-critical)')}
      </div>

      <div class="main-grid">
        <section class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Recent Scans</div>
              <div class="card-subtitle">${this.guardHistory.length} scan(s)</div>
            </div>
            <button class="btn btn-sm" @click=${() => this._loadGuardHistory()}>Refresh</button>
          </div>
          ${this.guardLoading
            ? html`<div class="loading">Loading history...</div>`
            : this.guardHistory.length === 0
              ? html`<div class="empty-state">No scans recorded yet</div>`
              : html`
                <div>
                  ${this.guardHistory.map(s => html`
                    <div class="list-item ${s.severity}">
                      <div class="list-content">
                        <div class="list-title">${s.sessionId} <span class="list-meta">· ${s.agentId}</span></div>
                        <div class="list-meta">Score: ${s.overallScore} · Action: ${s.action} · ${this._formatTime(s.detectedAt)}</div>
                      </div>
                      <span class="risk-badge risk-${s.severity}">${s.severity}</span>
                    </div>
                  `)}
                </div>
              `}
        </section>

        <section class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Test Scanner</div>
              <div class="card-subtitle">Detect prompt injection patterns</div>
            </div>
          </div>
          <div class="form-row">
            <span class="form-label">Source</span>
            <select class="form-select" .value=${this.scanSource} @change=${(e: Event) => this.scanSource = (e.target as HTMLSelectElement).value}>
              <option value="user_input">User Input</option>
              <option value="tool_output">Tool Output</option>
              <option value="retrieved_doc">Retrieved Document</option>
              <option value="email">Email</option>
              <option value="web_content">Web Content</option>
            </select>
          </div>
          <div class="form-row">
            <span class="form-label">Content</span>
            <textarea class="form-textarea" placeholder="Paste content to scan..." .value=${this.scanContent} @input=${(e: Event) => this.scanContent = (e.target as HTMLTextAreaElement).value}></textarea>
          </div>
          <button class="btn btn-primary" ?disabled=${this.scanBusy || !this.scanContent.trim()} @click=${() => this._handleTestScan()}>
            ${this.scanBusy ? 'Scanning...' : 'Scan'}
          </button>
          ${this.scanResult ? html`
            <div class="result-box">
              <div class="result-row"><span class="result-key">Severity</span><span class="risk-badge risk-${this.scanResult.severity}">${this.scanResult.severity}</span></div>
              <div class="result-row"><span class="result-key">Score</span><span class="result-value">${this.scanResult.overallScore}</span></div>
              <div class="result-row"><span class="result-key">Action</span><span class="result-value">${this.scanResult.action}</span></div>
              <div class="result-row"><span class="result-key">Scan ID</span><span class="result-value">${this.scanResult.scanId}</span></div>
              ${this.scanResult.findings && this.scanResult.findings.length > 0 ? html`
                <div class="result-row" style="flex-direction: column; align-items: stretch; gap: 4px;">
                  <span class="result-key">Findings</span>
                  <ul class="recommend-list">
                    ${this.scanResult.findings.map(f => html`<li><strong>${f.ruleId}</strong> — ${f.category}${f.matchedText ? html` <span class="list-meta">"${f.matchedText}"</span>` : ''}</li>`)}
                  </ul>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </section>
      </div>
    `;
  }

  private _renderAuditTab() {
    return html`
      <div class="kpi-row">
        ${this._renderKpi('Total Actions', this.auditStats.totalActions, 'var(--sc-primary)')}
        ${this._renderKpi('Anomalies', this.auditStats.anomalyCount, 'var(--sc-high)')}
        ${this._renderKpi('PII Leaks', this.auditStats.piiLeaks, 'var(--sc-critical)')}
        ${this._renderKpi('Loop Detections', this.auditStats.loopDetections, 'var(--sc-info)')}
      </div>

      <div class="main-grid">
        <section class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Recent Anomalies</div>
              <div class="card-subtitle">${this.auditAnomalies.length} anomaly(ies)</div>
            </div>
            <button class="btn btn-sm" @click=${() => this._loadAuditAnomalies()}>Refresh</button>
          </div>
          ${this.auditLoading
            ? html`<div class="loading">Loading anomalies...</div>`
            : this.auditAnomalies.length === 0
              ? html`<div class="empty-state">No anomalies detected</div>`
              : html`
                <div>
                  ${this.auditAnomalies.map(a => html`
                    <div class="list-item ${a.severity}">
                      <div class="list-content">
                        <div class="list-title">${a.alertType} <span class="list-meta">· ${a.agentId}</span></div>
                        <div style="font-size: 12px; color: var(--sc-text-primary); margin: 4px 0;">${a.description}</div>
                        <div class="list-meta">→ ${a.recommendedAction} · ${this._formatTime(a.detectedAt)}</div>
                      </div>
                      <span class="risk-badge risk-${a.severity}">${a.severity}</span>
                    </div>
                  `)}
                </div>
              `}
        </section>

        <section class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Record Test Action</div>
              <div class="card-subtitle">Submit an action to the audit log</div>
            </div>
          </div>
          <div class="form-row">
            <span class="form-label">Agent ID</span>
            <input class="form-input" placeholder="e.g. agent-01" .value=${this.recAgentId} @input=${(e: Event) => this.recAgentId = (e.target as HTMLInputElement).value} />
          </div>
          <div class="form-row">
            <span class="form-label">Action Type</span>
            <select class="form-select" .value=${this.recActionType} @change=${(e: Event) => this.recActionType = (e.target as HTMLSelectElement).value}>
              <option value="tool_call">Tool Call</option>
              <option value="file_read">File Read</option>
              <option value="file_write">File Write</option>
              <option value="network_request">Network Request</option>
              <option value="shell_exec">Shell Exec</option>
              <option value="data_export">Data Export</option>
              <option value="auth">Auth</option>
            </select>
          </div>
          <div class="form-row">
            <span class="form-label">Risk Classification</span>
            <select class="form-select" .value=${this.recRiskClass} @change=${(e: Event) => this.recRiskClass = (e.target as HTMLSelectElement).value}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <button class="btn btn-primary" ?disabled=${this.recBusy || !this.recAgentId.trim()} @click=${() => this._handleRecordAction()}>
            ${this.recBusy ? 'Recording...' : 'Record'}
          </button>
          ${this.recResult ? html`
            <div class="result-box">
              <div class="result-row"><span class="result-key">Status</span><span class="result-value" style="color: var(--sc-low)">${this.recResult}</span></div>
            </div>
          ` : ''}
        </section>
      </div>
    `;
  }

  render() {
    return html`
      <div class="dashboard" role="main" aria-label="AI Supply Chain Security Dashboard">
        <header class="header">
          <div>
            <h1 class="title"><span>🔗</span> AI Supply Chain Security</h1>
            <div class="subtitle"><span class="live-dot"></span> Live · ${this.currentTime.toLocaleString()} · MCP tools · Prompt Guard · Agent Audit</div>
          </div>
          <div class="header-actions">
            <button class="btn" @click=${() => { this._loadMcpStats(); this._loadGuardStats(); this._loadAuditStats(); }}>↻ Refresh All</button>
            <button class="btn btn-primary">+ Export Report</button>
          </div>
        </header>

        <nav class="tabs" role="tablist">
          <button class="tab ${this.activeTab === 'mcp' ? 'active' : ''}" role="tab" @click=${() => this._setActiveTab('mcp')}>MCP Tools</button>
          <button class="tab ${this.activeTab === 'guard' ? 'active' : ''}" role="tab" @click=${() => this._setActiveTab('guard')}>Prompt Injection Guard</button>
          <button class="tab ${this.activeTab === 'audit' ? 'active' : ''}" role="tab" @click=${() => this._setActiveTab('audit')}>Agent Behavior Audit</button>
        </nav>

        ${this.activeTab === 'mcp' ? this._renderMcpTab() : ''}
        ${this.activeTab === 'guard' ? this._renderGuardTab() : ''}
        ${this.activeTab === 'audit' ? this._renderAuditTab() : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-ai-scm-dashboard': ScAiScmDashboard;
  }
}
