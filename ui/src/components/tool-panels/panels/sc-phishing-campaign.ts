/**
 * sc-phishing-campaign.ts - Phishing Campaign Manager (Security Ops Dark Capability)
 * Campaign creation, template management, target list handling, payload configuration,
 * delivery scheduling, tracking dashboard, metrics analysis, export reports
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';

type CampaignType = 'spear-phishing' | 'whaling' | 'business-compromise' | 'credential-harvest' | 'malware-delivery' | 'smishing' | 'vishing';
type PhishStatus = 'draft' | 'scheduled' | 'active' | 'completed' | 'paused';
type TemplateType = 'credential-harvest' | 'attachment-malware' | 'link-exploit' | 'qrcode' | 'mfa-bypass' | 'oauth-consent';
type TargetSource = 'csv-upload' | 'manual' | 'ldap-sync' | 'enriched-list';
type PayloadType = 'html-form' | 'macro-doc' | 'pdf-exploit' | 'exe-dropper' | 'url-redirect' | 'js-injection';

interface PhishTemplate {
  id: string; name: string; type: TemplateType; subject: string; senderName: string; senderEmail: string;
  body: string; landingUrl: string; trackingPixel: boolean; replyTracking: boolean;
}

interface Target {
  id: string; email: string; firstName: string; lastName: string; department: string; role: string;
  seniority: 'junior' | 'mid' | 'senior' | 'executive'; phishingScore: number; lastTrained: string;
}

interface PayloadConfig {
  type: PayloadType; encoding: string; obfuscation: boolean; sandboxEvasion: boolean;
  certificate: string; redirectChain: string; expiration: number;
}

interface CampaignConfig {
  name: string; type: CampaignType; templateId: string; payload: PayloadConfig;
  scheduleDate: string; scheduleTime: string; sendDelay: number; maxResend: number;
  followUpEnabled: boolean; followUpDays: number; aBTest: boolean;
}

interface EmailEvent {
  targetId: string; event: 'sent' | 'opened' | 'clicked' | 'submitted' | 'reported' | 'bounced';
  timestamp: string; ip?: string; userAgent?: string;
}

interface CampaignResult {
  id: string; config: CampaignConfig; template: PhishTemplate; targets: Target[];
  events: EmailEvent[]; status: PhishStatus; startedAt: string; completedAt: string;
  metrics: { sent: number; opened: number; clicked: number; submitted: number; reported: number; bounced: number };
}

const SAMPLE_TEMPLATES: PhishTemplate[] = [
  { id: 'tpl-1', name: 'IT Password Reset Alert', type: 'credential-harvest', subject: 'Urgent: Your password expires in 24 hours', senderName: 'IT Help Desk', senderEmail: 'helpdesk@company-portal.com', body: 'Your corporate password will expire in 24 hours. Click below to update your credentials immediately to avoid account lockout.', landingUrl: 'https://portal.company-auth.com/reset', trackingPixel: true, replyTracking: true },
  { id: 'tpl-2', name: 'Quarterly Bonus Announcement', type: 'link-exploit', subject: 'Q1 Performance Bonus - Action Required', senderName: 'HR Department', senderEmail: 'hr-benefits@company-portal.com', body: 'Congratulations on your Q1 performance. Your bonus has been processed. Please review and confirm your direct deposit information.', landingUrl: 'https://hr.company-portal.com/bonus', trackingPixel: true, replyTracking: false },
  { id: 'tpl-3', name: 'Invoice Attachment - Urgent', type: 'attachment-malware', subject: 'URGENT: Overdue Invoice #INV-2024-8847', senderName: 'Accounts Payable', senderEmail: 'ap@vendor-solutions.net', body: 'Please find attached the overdue invoice for your immediate attention. Payment is now 30 days past due. Open the attachment to review details.', landingUrl: '', trackingPixel: true, replyTracking: true },
  { id: 'tpl-4', name: 'MFA Reconfiguration Required', type: 'mfa-bypass', subject: 'Security Alert: MFA token compromised', senderName: 'Security Operations', senderEmail: 'security@company-auth.com', body: 'We detected unauthorized access to your MFA token. Please reconfigure your multi-factor authentication immediately by clicking the secure link below.', landingUrl: 'https://auth.company-portal.com/mfa-fix', trackingPixel: true, replyTracking: true },
  { id: 'tpl-5', name: 'Microsoft 365 OAuth Consent', type: 'oauth-consent', subject: 'Review requested app permissions', senderName: 'Microsoft 365 Admin', senderEmail: 'admin@accounts.microsoft-portal.com', body: 'A new application is requesting access to your Microsoft 365 account. Review and approve the permissions request to continue using integrated services.', landingUrl: 'https://login.microsoftonline.com/consent', trackingPixel: true, replyTracking: false },
  { id: 'tpl-6', name: 'CEO Emergency Wire Transfer', type: 'whaling', subject: 'CONFIDENTIAL - Immediate action required', senderName: 'CEO Office', senderEmail: 'executive-office@company.com', body: 'I need you to process an urgent wire transfer for an acquisition we are closing today. Do not discuss this with anyone. Reply to confirm you received this.', landingUrl: '', trackingPixel: false, replyTracking: true },
];

const SAMPLE_TARGETS: Target[] = [
  { id: 'tgt-1', email: 'jsmith@target.com', firstName: 'John', lastName: 'Smith', department: 'Engineering', role: 'Developer', seniority: 'mid', phishingScore: 72, lastTrained: '2024-11-15' },
  { id: 'tgt-2', email: 'mjones@target.com', firstName: 'Mary', lastName: 'Jones', department: 'Finance', role: 'Controller', seniority: 'senior', phishingScore: 35, lastTrained: '2024-10-20' },
  { id: 'tgt-3', email: 'rwilson@target.com', firstName: 'Robert', lastName: 'Wilson', department: 'Executive', role: 'CFO', seniority: 'executive', phishingScore: 18, lastTrained: '2024-09-10' },
  { id: 'tgt-4', email: 'lchen@target.com', firstName: 'Lisa', lastName: 'Chen', department: 'HR', role: 'Director', seniority: 'senior', phishingScore: 45, lastTrained: '2024-12-01' },
  { id: 'tgt-5', email: 'dpatel@target.com', firstName: 'Dev', lastName: 'Patel', department: 'IT', role: 'SysAdmin', seniority: 'mid', phishingScore: 65, lastTrained: '2024-11-28' },
  { id: 'tgt-6', email: 'slee@target.com', firstName: 'Sarah', lastName: 'Lee', department: 'Marketing', role: 'Manager', seniority: 'mid', phishingScore: 58, lastTrained: '2024-10-05' },
  { id: 'tgt-7', email: 'tgarcia@target.com', firstName: 'Tom', lastName: 'Garcia', department: 'Sales', role: 'Rep', seniority: 'junior', phishingScore: 82, lastTrained: '2024-08-15' },
  { id: 'tgt-8', email: 'akim@target.com', firstName: 'Alice', lastName: 'Kim', department: 'Legal', role: 'Counsel', seniority: 'senior', phishingScore: 28, lastTrained: '2024-12-10' },
  { id: 'tgt-9', email: 'bbrown@target.com', firstName: 'Bob', lastName: 'Brown', department: 'Engineering', role: 'CTO', seniority: 'executive', phishingScore: 15, lastTrained: '2024-12-15' },
  { id: 'tgt-10', email: 'ctaylor@target.com', firstName: 'Carol', lastName: 'Taylor', department: 'Support', role: 'Lead', seniority: 'mid', phishingScore: 60, lastTrained: '2024-11-01' },
];

@customElement('sc-phishing-campaign')
export class ScPhishingCampaign extends LitElement {
  @property({ type: String }) panelId = 'phishing-campaign';
  @state() private _config: CampaignConfig = {
    name: '', type: 'spear-phishing', templateId: 'tpl-1',
    payload: { type: 'html-form', encoding: 'base64', obfuscation: true, sandboxEvasion: true, certificate: 'self-signed', redirectChain: 'none', expiration: 72 },
    scheduleDate: '', scheduleTime: '09:00', sendDelay: 5, maxResend: 1, followUpEnabled: false, followUpDays: 3, aBTest: false,
  };
  @state() private _campaigns: CampaignResult[] = [];
  @state() private _activeCampaign: CampaignResult | null = null;
  @state() private _targets: Target[] = [...SAMPLE_TARGETS];
  @state() private _activeTab: 'templates' | 'targets' | 'configure' | 'execute' | 'results' | 'history' = 'templates';
  @state() private _selectedTemplate: PhishTemplate = SAMPLE_TEMPLATES[0];
  @state() private _output: string[] = [];
  @state() private _progress = 0;
  @state() private _filterDept = 'all';
  @state() private _filterResult = 'all';

  @state() private _showExport = false;
  @state() private _showApproval = false;
  @state() private _selectedForBatch: Set<string> = new Set();
  @state() private _showRiskScoring = false;

  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: var(--text-primary, #e2e8f0); }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: var(--bg-primary, #0f1117); border-radius: 12px; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
    .title { font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid #2a2d3a; flex-wrap: wrap; }
    .tab { padding: 8px 16px; cursor: pointer; border: none; background: none; color: #6b7280; font-size: 13px; font-weight: 500; border-bottom: 2px solid transparent; }
    .tab:hover { color: #d1d5db; }
    .tab.active { color: #e2e8f0; border-bottom-color: #3b82f6; }
    .btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; font-family: inherit; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: #3b82f6; color: white; }
    .btn-primary:hover:not(:disabled) { background: #2563eb; }
    .btn-danger { background: #dc2626; color: white; }
    .btn-secondary { background: #374151; color: #d1d5db; }
    .btn-sm { padding: 4px 10px; font-size: 11px; }
    .btn-row { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-group.full { grid-column: 1 / -1; }
    label { font-size: 12px; color: #9ca3af; font-weight: 500; }
    input, select, textarea { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 6px; padding: 8px 12px; color: #e2e8f0; font-size: 13px; outline: none; font-family: inherit; }
    input:focus, select:focus, textarea:focus { border-color: #3b82f6; }
    .template-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
    .template-card { background: #1a1d27; border: 2px solid #2a2d3a; border-radius: 8px; padding: 14px; cursor: pointer; transition: all 0.2s; }
    .template-card:hover { border-color: #3b82f6; }
    .template-card.selected { border-color: #3b82f6; background: #1e293b; }
    .tpl-name { font-weight: 700; font-size: 14px; margin-bottom: 4px; }
    .tpl-subject { font-size: 12px; color: #fbbf24; font-style: italic; margin-bottom: 6px; }
    .tpl-body { font-size: 11px; color: #9ca3af; line-height: 1.5; margin-bottom: 8px; }
    .tpl-meta { font-size: 10px; color: #6b7280; display: flex; gap: 12px; flex-wrap: wrap; }
    .tag { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #374151; color: #d1d5db; }
    .target-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .target-table th { text-align: left; padding: 8px 10px; background: #1a1d27; color: #9ca3af; font-weight: 600; border-bottom: 1px solid #2a2d3a; cursor: pointer; }
    .target-table td { padding: 8px 10px; border-bottom: 1px solid #1a1d27; }
    .target-table tr:hover { background: #1a1d27; }
    .risk-high { color: #f87171; }
    .risk-med { color: #fbbf24; }
    .risk-low { color: #34d399; }
    .stat-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-bottom: 16px; }
    .stat { background: #1a1d27; border-radius: 8px; padding: 12px; text-align: center; }
    .stat-value { font-size: 22px; font-weight: 700; }
    .stat-label { font-size: 10px; color: #9ca3af; margin-top: 2px; }
    .progress-bar { width: 100%; height: 8px; background: #1a1d27; border-radius: 4px; overflow: hidden; margin: 12px 0; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); border-radius: 4px; transition: width 0.5s; }
    .output-box { background: #0a0c10; border: 1px solid #1a1d27; border-radius: 8px; padding: 12px; font-family: 'JetBrains Mono', monospace; font-size: 12px; line-height: 1.6; max-height: 300px; overflow-y: auto; white-space: pre-wrap; }
    .output-info { color: #60a5fa; }
    .output-success { color: #34d399; }
    .output-error { color: #f87171; }
    .output-warn { color: #fbbf24; }
    .metric-bar { display: flex; height: 20px; border-radius: 6px; overflow: hidden; margin: 8px 0; }
    .metric-seg { display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; min-width: 30px; }
    .timeline { position: relative; padding-left: 20px; border-left: 2px solid #2a2d3a; margin: 12px 0; }
    .timeline-event { position: relative; padding: 6px 0 6px 12px; font-size: 12px; }
    .timeline-event::before { content: ''; position: absolute; left: -25px; top: 10px; width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; }
    .timeline-event.event-open::before { background: #fbbf24; }
    .timeline-event.event-click::before { background: #f87171; }
    .timeline-event.event-submit::before { background: #dc2626; }
    .timeline-event.event-report::before { background: #34d399; }
    .empty-state { text-align: center; padding: 40px; color: #6b7280; }
    .filter-row { display: flex; gap: 8px; margin-bottom: 12px; align-items: center; flex-wrap: wrap; }
    .filter-row label { font-size: 12px; white-space: nowrap; }
    .history-item { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 12px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s; }
    .history-item:hover { border-color: #3b82f6; }
    .history-title { font-weight: 600; font-size: 13px; margin-bottom: 4px; }
    .history-meta { font-size: 11px; color: #9ca3af; }
    @media (max-width: 768px) {
      .form-grid { grid-template-columns: 1fr; }
      .stat-grid { grid-template-columns: repeat(3, 1fr); }
      .template-grid { grid-template-columns: 1fr; }
    }

    .wizard-num { width: 24px; height: 24px; border-radius: 50%; background: #374151; color: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
    .wizard-num.active { background: #8b5cf6; }
    .wizard-num.done { background: #22c55e; }
    .mitre-tag { display: inline-block; font-size: 9px; padding: 1px 5px; border-radius: 3px; background: #312e81; color: #a5b4fc; margin-right: 3px; }
    .export-panel { background: #0f172a; border: 1px solid #374151; border-radius: 10px; padding: 16px; margin-bottom: 12px; }
    .export-btn { padding: 8px 16px; border-radius: 6px; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; font-size: 11px; font-weight: 600; cursor: pointer; margin-right: 6px; }
    .export-btn:hover { border-color: #8b5cf6; background: #8b5cf620; }
    .risk-bar-track { flex: 1; height: 6px; background: #1f2937; border-radius: 3px; overflow: hidden; }
    .risk-bar-fill { height: 100%; border-radius: 3px; }
    .cb { width: 14px; height: 14px; accent-color: #8b5cf6; cursor: pointer; }
    .batch-bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #1e1b4b; border-radius: 8px; margin-bottom: 10px; font-size: 11px; }
    .batch-bar button { padding: 4px 12px; border-radius: 5px; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; font-size: 10px; font-weight: 600; cursor: pointer; }
    .batch-bar button:hover { background: #8b5cf630; border-color: #8b5cf6; }
    .approval-modal { background: #0f172a; border: 1px solid #374151; border-radius: 10px; padding: 16px; margin-bottom: 12px; }
    .heatmap-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
    .heatmap-cell { width: 100%; aspect-ratio: 1; border-radius: 3px; }
    .risk-gauge { background: #1f2937; border-radius: 8px; padding: 14px; margin-bottom: 12px; }
    .gauge-row { display: flex; justify-content: space-around; margin-top: 8px; }
    .gauge-item { text-align: center; }
    .gauge-item .gauge-val { font-size: 20px; font-weight: 700; }
    .gauge-item .gauge-lbl { font-size: 10px; color: #6b7280; }
    .comment-section { background: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 14px; margin-bottom: 12px; }
    .comment-item { display: flex; gap: 10px; padding: 8px 0; border-bottom: 1px solid #1f2937; }
    .comment-item:last-child { border-bottom: none; }
    .comment-avatar { width: 28px; height: 28px; border-radius: 50%; background: #374151; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
    .comment-text { font-size: 12px; color: #d1d5db; margin-top: 2px; }
    .footer-bar { margin-top: 12px; padding-top: 8px; border-top: 1px solid #374151; display: flex; justify-content: space-between; font-size: 10px; color: #6b7280; }
    .footer-actions { display: flex; gap: 8px; margin-top: 6px; }
    .footer-btn { flex: 1; padding: 8px; border-radius: 6px; border: 1px solid #374151; background: #1f2937; color: #94a3b8; font-size: 11px; cursor: pointer; text-align: center; }
    .footer-btn:hover { border-color: #8b5cf6; color: #e2e8f0; }
    .dist-bar { display: flex; height: 12px; border-radius: 6px; overflow: hidden; gap: 1px; margin-bottom: 6px; }
    .dist-legend { display: flex; gap: 12px; font-size: 9px; color: #6b7280; }
    .dist-legend span { display: inline-flex; align-items: center; gap: 3px; }
    .dist-dot { width: 8px; height: 8px; border-radius: 2px; display: inline-block; }
    .intel-row { display: flex; gap: 10px; padding: 8px; background: #0a0c10; border-radius: 6px; margin-bottom: 6px; align-items: center; }
    .intel-type { padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
    .intel-val { font-family: monospace; font-size: 12px; color: #e2e8f0; min-width: 120px; }
    .intel-desc { flex: 1; font-size: 10px; color: #6b7280; }
    .intel-conf { font-size: 10px; font-weight: 700; min-width: 40px; text-align: right; }
    .insight-card { background: linear-gradient(135deg, #1a1d27 0%, #0a0c10 100%); border-radius: 8px; padding: 14px; margin-bottom: 8px; border-left: 3px solid #8b5cf6; }
    .insight-title { font-size: 12px; font-weight: 700; color: #8b5cf6; margin-bottom: 4px; }
    .insight-body { font-size: 11px; color: #9ca3af; line-height: 1.5; }
    .trend-indicator { display: inline-flex; align-items: center; gap: 3px; font-size: 10px; font-weight: 700; }
    .trend-up { color: #f87171; }
    .trend-down { color: #34d399; }
    .trend-flat { color: #9ca3af; }
    .notif-dot { width: 8px; height: 8px; border-radius: 50%; background: #f87171; position: relative; display: inline-block; }
    .notif-dot::after { content: ''; position: absolute; top: -2px; left: -2px; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #f87171; animation: nd-pulse 1.5s infinite; }
    @keyframes nd-pulse { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(1.6); opacity: 0; } }
    .config-select { padding: 6px 10px; background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 6px; color: #e2e8f0; font-size: 11px; outline: none; }
    .config-select:focus { border-color: #8b5cf6; }
  `;

  private _getTemplate(): PhishTemplate {
    return SAMPLE_TEMPLATES.find(t => t.id === this._config.templateId) || SAMPLE_TEMPLATES[0];
  }

  private _getFilteredTargets(): Target[] {
    let filtered = [...this._targets];
    if (this._filterDept !== 'all') filtered = filtered.filter(t => t.department === this._filterDept);
    return filtered;
  }

  private _launchCampaign(): void {
    if (!this._config.name.trim() || this._targets.length === 0) return;
    const template = this._getTemplate();
    const campaign: CampaignResult = {
      id: 'PHISH-' + Date.now().toString(36).toUpperCase(),
      config: { ...this._config }, template: { ...template },
      targets: [...this._targets], events: [], status: 'active',
      startedAt: new Date().toISOString(), completedAt: '',
      metrics: { sent: 0, opened: 0, clicked: 0, submitted: 0, reported: 0, bounced: 0 },
    };
    this._activeCampaign = campaign;
    this._activeTab = 'execute';
    this._output = [];
    this._progress = 0;
    this._output.push(`[*] Phishing Campaign ${campaign.id} launched`);
    this._output.push(`[*] Template: ${template.name} (${template.type})`);
    this._output.push(`[*] Targets: ${this._targets.length} recipients`);
    this._output.push(`[*] Type: ${this._config.type} | Delay: ${this._config.sendDelay}s between emails`);
    this._output.push('');

    let targetIdx = 0;
    const sendNext = () => {
      if (targetIdx >= this._targets.length) {
        campaign.status = 'completed';
        campaign.completedAt = new Date().toISOString();
        this._campaigns = [campaign, ...this._campaigns].slice(0, 20);
        this._output.push('');
        this._output.push(`[+] Campaign completed`);
        this._output.push(`[*] Sent: ${campaign.metrics.sent} | Opened: ${campaign.metrics.opened} (${this._pct(campaign.metrics.opened, campaign.metrics.sent)}%)`);
        this._output.push(`[*] Clicked: ${campaign.metrics.clicked} (${this._pct(campaign.metrics.clicked, campaign.metrics.sent)}%)`);
        this._output.push(`[*] Submitted: ${campaign.metrics.submitted} (${this._pct(campaign.metrics.submitted, campaign.metrics.sent)}%)`);
        this._output.push(`[*] Reported: ${campaign.metrics.reported} (${this._pct(campaign.metrics.reported, campaign.metrics.sent)}%)`);
        this.requestUpdate();
        return;
      }
      const target = this._targets[targetIdx];
      const phishScore = target.phishingScore / 100;
      campaign.metrics.sent++;
      campaign.events.push({ targetId: target.id, event: 'sent', timestamp: new Date().toISOString() });
      this._output.push(`  [*] Sent to ${target.email} (${target.department})`);

      const simulateEvents = () => {
        const opened = Math.random() < phishScore * 0.9 + 0.1;
        if (opened) {
          campaign.metrics.opened++;
          campaign.events.push({ targetId: target.id, event: 'opened', timestamp: new Date().toISOString(), ip: `10.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}` });
        }
        const clicked = opened && Math.random() < phishScore * 0.7 + 0.05;
        if (clicked) {
          campaign.metrics.clicked++;
          campaign.events.push({ targetId: target.id, event: 'clicked', timestamp: new Date().toISOString(), userAgent: 'Outlook/Windows' });
        }
        const submitted = clicked && Math.random() < phishScore * 0.6;
        if (submitted) {
          campaign.metrics.submitted++;
          campaign.events.push({ targetId: target.id, event: 'submitted', timestamp: new Date().toISOString() });
        }
        const reported = !submitted && Math.random() < (1 - phishScore) * 0.4;
        if (reported) {
          campaign.metrics.reported++;
          campaign.events.push({ targetId: target.id, event: 'reported', timestamp: new Date().toISOString() });
        }
        const bounced = Math.random() < 0.03;
        if (bounced) {
          campaign.metrics.bounced++;
          campaign.events.push({ targetId: target.id, event: 'bounced', timestamp: new Date().toISOString() });
        }
        this._progress = Math.round(((targetIdx + 1) / this._targets.length) * 100);
        this.requestUpdate();
      };

      simulateEvents();
      targetIdx++;
      this.requestUpdate();
      setTimeout(sendNext, 200 + Math.random() * 300);
    };
    setTimeout(sendNext, 500);
  }

  private _pct(n: number, total: number): string {
    return total > 0 ? Math.round((n / total) * 100).toString() : '0';
  }

  private _exportResults(campaign: CampaignResult): void {
    const data = {
      campaignId: campaign.id, name: campaign.config.name, type: campaign.config.type,
      template: campaign.template.name, status: campaign.status,
      startedAt: campaign.startedAt, completedAt: campaign.completedAt,
      metrics: campaign.metrics,
      targets: campaign.targets.map(t => {
        const events = campaign.events.filter(e => e.targetId === t.id).map(e => e.event);
        return { ...t, events };
      }),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `phish-campaign-${campaign.id}.json`; a.click();
    URL.revokeObjectURL(url);
  }


  private _mitreTechniques = ['T1059', 'T1078', 'T1566', 'T1190'];

  private _computeRiskScore(item: { id: string; risk: string; status: string }): number {
    const riskW: Record<string, number> = { critical: 40, high: 30, medium: 20, low: 10 };
    const statusW: Record<string, number> = { active: 0, reviewing: -5, flagged: 10, completed: -15, expired: 5 };
    return Math.max(0, Math.min(100, (riskW[item.risk] || 20) + (statusW[item.status] || 0)));
  }

  private _riskColor(score: number): string {
    if (score >= 80) return '#ef4444';
    if (score >= 60) return '#f97316';
    if (score >= 40) return '#eab308';
    return '#22c55e';
  }

  private _riskLabel(score: number): string {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  }

  private _exportData(format: string) {
    const blob = new Blob(['phishing-campaign export'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'phishing-campaign-export.' + (format === 'markdown' ? 'md' : format); a.click();
    URL.revokeObjectURL(url);
    this._showExport = false;
  }

  private _renderExportPanel() {
    return html`<div class="export-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-size:13px;font-weight:700">Export Data</div>
        <button class="detail-close" style="background:#374151;border:none;color:#94a3b8;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:11px" @click=${() => { this._showExport = false; }}>\u2715</button>
      </div>
      <div style="display:flex;gap:8px">
        <button class="export-btn" @click=${() => this._exportData('csv')}>CSV</button>
        <button class="export-btn" @click=${() => this._exportData('json')}>JSON</button>
        <button class="export-btn" @click=${() => this._exportData('markdown')}>Markdown</button>
      </div>
    </div>`;
  }

  private _renderPlaybook() {
    const steps: [string, string][] = [
      ['Identify', 'Identify relevant items and scope the analysis'],
      ['Assess', 'Evaluate current state against security requirements'],
      ['Plan', 'Develop prioritized remediation plan'],
      ['Implement', 'Execute remediation actions with proper controls'],
      ['Verify', 'Validate remediation effectiveness through testing'],
      ['Report', 'Document results, metrics, and lessons learned'],
    ];
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Panel Playbook</div>
      ${steps.map((s: [string, string], i: number) => html`
        <div style="display:flex;align-items:center;gap:10px;${i < steps.length - 1 ? 'margin-bottom:4px' : ''}">
          <div class="wizard-num ${i < 3 ? 'done' : i === 3 ? 'active' : ''}">${i < 3 ? '\u2713' : (i + 1).toString()}</div>
          <div style="flex:1">
            <div style="font-size:12px;font-weight:600;${i === 3 ? 'color:#8b5cf6' : i < 3 ? 'color:#22c55e' : 'color:#6b7280'}">${s[0]}</div>
            <div style="font-size:10px;color:#6b7280">${s[1]}</div>
          </div>
        </div>
      `)}
    </div>`;
  }

  private _renderDecisionTree() {
    const nodes: [string, string][] = [
      ['Is the item high-risk or critical?', 'YES -> Immediate action required | NO -> Standard process'],
      ['Is there an existing control?', 'YES -> Verify effectiveness | NO -> Implement new control'],
      ['Is remediation within SLA?', 'YES -> Continue monitoring | NO -> Escalate to management'],
      ['Is the item recurring?', 'YES -> Automate detection and response | NO -> One-time remediation'],
    ];
    return html`<div style="background:#0f172a;border-radius:8px;padding:12px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Decision Tree</div>
      ${nodes.map((n: [string, string]) => html`
        <div style="margin-bottom:8px">
          <div style="font-size:11px;color:#e2e8f0;font-weight:600">${n[0]}</div>
          <div style="margin-left:20px;font-size:10px;color:#94a3b8;margin-top:2px">${n[1]}</div>
        </div>
      `)}
    </div>`;
  }

  private _renderKPIs() {
    const kpis: [string, string, string, string][] = [
      ['Total Items', '142', '+5', '#3b82f6'],
      ['High Risk', '23', '-2', '#ef4444'],
      ['Compliance Rate', '94%', '+3%', '#22c55e'],
      ['Pending Actions', '12', '-4', '#f97316'],
    ];
    return html`<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:12px">
      ${kpis.map((k: [string, string, string, string]) => html`
        <div style="background:#0f172a;border-radius:8px;padding:12px;border-left:3px solid ${k[3]}">
          <div style="font-size:10px;color:#6b7280;text-transform:uppercase">${k[0]}</div>
          <div style="font-size:20px;font-weight:700;color:${k[3]}">${k[1]}</div>
          <div style="font-size:10px;color:${k[2].startsWith('+') ? '#22c55e' : '#ef4444'}">${k[2].startsWith('+') ? '\u25B2' : '\u25BC'} ${k[2]} vs last period</div>
        </div>
      `)}
    </div>`;
  }

  private _renderHeatmap() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const heatColor = (v: number) => v >= 10 ? '#ef4444' : v >= 7 ? '#f97316' : v >= 4 ? '#eab308' : v >= 2 ? '#22c55e80' : '#22c55e30';
    const grouped: { day: string; hours: { hour: number; value: number }[] }[] = [];
    for (const d of days) {
      const hours: { hour: number; value: number }[] = [];
      for (let h = 0; h < 24; h++) {
        const base = (h >= 8 && h <= 18) ? 5 : 1;
        const wknd = (d === 'Sat' || d === 'Sun') ? 0.3 : 1;
        hours.push({ hour: h, value: Math.round((base + Math.random() * 8) * wknd) });
      }
      grouped.push({ day: d, hours });
    }
    return html`<div style="background:#0f172a;border-radius:8px;padding:12px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">Activity Heatmap</div>
      <div style="display:flex;gap:4px;align-items:center;margin-bottom:4px">
        <span style="width:30px;font-size:9px;color:#6b7280"></span>
        ${Array.from({ length: 24 }, (_, i) => html`<div style="flex:1;text-align:center;font-size:8px;color:#6b7280">${i}</div>`)}
      </div>
      ${grouped.map(d => html`<div style="display:flex;gap:4px;align-items:center;margin-bottom:2px">
        <span style="width:30px;font-size:9px;color:#6b7280">${d.day}</span>
        ${d.hours.map(h => html`<div class="heatmap-cell" style="flex:1;background:${heatColor(h.value)}" title="${d.day} ${h.hour}:00 - ${h.value} events"></div>`)}
      </div>`)}
      <div style="display:flex;gap:8px;margin-top:6px;font-size:9px;color:#6b7280;align-items:center">
        <span>Low</span><div style="width:12px;height:8px;border-radius:2px;background:#22c55e30"></div>
        <div style="width:12px;height:8px;border-radius:2px;background:#eab308"></div>
        <div style="width:12px;height:8px;border-radius:2px;background:#ef4444"></div><span>High</span>
      </div>
    </div>`;
  }

  private _approvalQueue = [
    { id: 'APR-001', item: 'Review pending', requestor: 'Team Lead', action: 'Approve changes', status: 'pending', submittedAt: '2026-04-21T10:00:00' },
    { id: 'APR-002', item: 'Policy update', requestor: 'Compliance', action: 'Update document', status: 'pending', submittedAt: '2026-04-20T14:00:00' },
    { id: 'APR-003', item: 'Access request', requestor: 'IT Ops', action: 'Grant access', status: 'approved', submittedAt: '2026-04-19T09:00:00' },
  ];

  private _renderApprovalWorkflow() {
    const pending = this._approvalQueue.filter(a => a.status === 'pending');
    const resolved = this._approvalQueue.filter(a => a.status !== 'pending');
    return html`<div class="approval-modal">
      <div style="font-size:13px;font-weight:700;margin-bottom:12px">Approval Queue (${pending.length} pending)</div>
      ${pending.map(a => html`<div style="background:#1f2937;border-radius:8px;padding:10px;margin-bottom:8px;border-left:3px solid #f97316">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><div style="font-weight:600;font-size:12px">${a.id}: ${a.action}</div>
          <div style="font-size:10px;color:#6b7280;margin-top:2px">By: ${a.requestor} | ${a.submittedAt}</div></div>
          <div style="display:flex;gap:4px">
            <button class="export-btn" style="border-color:#22c55e;color:#22c55e;padding:4px 10px" @click=${() => { a.status = 'approved'; this.requestUpdate(); }}>Approve</button>
            <button class="export-btn" style="border-color:#ef4444;color:#ef4444;padding:4px 10px" @click=${() => { a.status = 'rejected'; this.requestUpdate(); }}>Reject</button>
          </div>
        </div>
      </div>`)}
      ${resolved.map(a => html`<div style="background:#1f2937;border-radius:6px;padding:8px;margin-bottom:4px;opacity:0.6">
        <div style="display:flex;justify-content:space-between;font-size:11px"><span>${a.id}: ${a.action}</span>
        <span style="color:${a.status === 'approved' ? '#22c55e' : '#ef4444'}">${a.status}</span></div>
      </div>`)}
    </div>`;
  }

  private _renderRiskScoringTable() {
    const items = this._items || [];
    return html`<div class="approval-modal">
      <div style="font-size:13px;font-weight:700;margin-bottom:12px">Risk Scoring Analysis</div>
      <table style="width:100%;border-collapse:collapse;font-size:11px">
        <thead><tr><th style="text-align:left;padding:6px 8px;background:#0f172a;color:#94a3b8;font-size:9px;text-transform:uppercase;border-bottom:1px solid #374151">Item</th><th style="text-align:left;padding:6px 8px;background:#0f172a;color:#94a3b8;font-size:9px;text-transform:uppercase;border-bottom:1px solid #374151">Score</th><th style="text-align:left;padding:6px 8px;background:#0f172a;color:#94a3b8;font-size:9px;text-transform:uppercase;border-bottom:1px solid #374151">Level</th></tr></thead>
        <tbody>${items.map((item: { id: string; name: string; risk: string; status: string }) => {
          const score = this._computeRiskScore(item);
          return html`<tr><td style="padding:6px 8px;border-bottom:1px solid #1f2937">${item.name}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #1f2937"><div style="display:flex;align-items:center;gap:6px">
              <span style="font-weight:700;color:${this._riskColor(score)}">${score}</span>
              <div class="risk-bar-track"><div class="risk-bar-fill" style="width:${score}%;background:${this._riskColor(score)}"></div></div></div></td>
            <td style="padding:6px 8px;border-bottom:1px solid #1f2937"><span style="color:${this._riskColor(score)};font-size:10px;font-weight:600">${this._riskLabel(score)}</span></td></tr>`;
        })}</tbody></table>
    </div>`;
  }

  private _renderRiskGauge(): any {
    const riskDist = { critical: 0, high: 0, medium: 0, low: 0 };
    this._items.forEach((item: any) => { riskDist[item.risk] = (riskDist[item.risk] || 0) + 1; });
    const total = this._items.length || 1;
    const score = Math.round(((riskDist.critical * 10 + riskDist.high * 7 + riskDist.medium * 4 + riskDist.low * 1) / (total * 10)) * 100);
    const scoreColor = score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#22c55e';
    return html`<div class="risk-gauge">
      <div style="font-weight:600;font-size:12px;margin-bottom:8px">Risk Overview</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">
        <div style="background:#0f172a;border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:22px;font-weight:700;color:${scoreColor}">${score}</div>
          <div style="font-size:9px;color:#6b7280">Risk Score</div>
        </div>
        <div style="background:#0f172a;border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:22px;font-weight:700;color:#ef4444">${riskDist.critical}</div>
          <div style="font-size:9px;color:#6b7280">Critical</div>
        </div>
        <div style="background:#0f172a;border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:22px;font-weight:700;color:#f59e0b">${riskDist.high}</div>
          <div style="font-size:9px;color:#6b7280">High Risk</div>
        </div>
      </div>
      <div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Distribution</div>
      <div class="dist-bar">
        <div style="width:${(riskDist.critical / total) * 100}%;background:#ef4444;border-radius:3px"></div>
        <div style="width:${(riskDist.high / total) * 100}%;background:#f97316"></div>
        <div style="width:${(riskDist.medium / total) * 100}%;background:#eab308"></div>
        <div style="width:${(riskDist.low / total) * 100}%;background:#22c55e;border-radius:3px"></div>
      </div>
      <div class="dist-legend">
        <span><span class="dist-dot" style="background:#ef4444"></span>Critical</span>
        <span><span class="dist-dot" style="background:#f97316"></span>High</span>
        <span><span class="dist-dot" style="background:#eab308"></span>Medium</span>
        <span><span class="dist-dot" style="background:#22c55e"></span>Low</span>
      </div>
    </div>`;
  }

  private _renderComments(): any {
    if (!this._expandedId) return nothing;
    const itemComments = this._comments.filter((c: any) => c.itemId === this._expandedId);
    return html`<div class="comment-section">
      <div style="font-weight:600;font-size:12px;margin-bottom:8px">Discussion (${itemComments.length})</div>
      ${itemComments.length === 0 ? html`<div style="font-size:12px;color:#6b7280;padding:8px 0">No comments yet</div>` : ''}
      ${itemComments.map((c: any) => html`<div class="comment-item">
        <div class="comment-avatar">${c.author.charAt(0)}</div>
        <div style="flex:1"><div style="font-size:11px"><span style="font-weight:600">${c.author}</span> <span style="color:#6b7280">${new Date(c.timestamp).toLocaleString()}</span></div><div class="comment-text">${c.text}</div></div>
      </div>`)}
      <div style="display:flex;gap:8px;margin-top:8px">
        <input type="text" placeholder="Add comment..." .value=${this._newComment} @input=${(e: Event) => { this._newComment = (e.target as HTMLInputElement).value; }} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._addComment(); }} style="flex:1;background:#0f172a;border:1px solid #374151;border-radius:6px;padding:8px;color:#e2e8f0;font-size:12px;outline:none">
        <button class="btn btn-primary btn-sm" @click=${this._addComment}>Post</button>
      </div>
      <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">
        ${['Security Team', 'IT Ops', 'HR', 'Legal', 'Compliance'].map(team => html`<span class="tag" style="cursor:pointer;background:#3b82f620;color:#60a5fa" @click=${() => { this._newComment += '@' + team + ' '; }}>@${team}</span>`)}
      </div>
    </div>`;
  }

  // Panel configuration
  private _renderPanelConfig(): any {
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:10px;color:#9ca3af;text-transform:uppercase">Panel Configuration</div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #0a0c10">
        <div><div style="font-size:11px;color:#e2e8f0">Auto-Refresh Interval</div><div style="font-size:9px;color:#6b7280">Refresh campaign metrics automatically</div></div>
        <select class="config-select" style="width:120px">
          <option value="0">Disabled</option>
          <option value="30">30 seconds</option>
          <option value="60">1 minute</option>
          <option value="300">5 minutes</option>
        </select>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #0a0c10">
        <div><div style="font-size:11px;color:#e2e8f0">Color Theme</div><div style="font-size:9px;color:#6b7280">Visual theme for charts and metrics</div></div>
        <select class="config-select" style="width:120px">
          <option value="dark">Dark (Default)</option>
          <option value="high-contrast">High Contrast</option>
          <option value="minimal">Minimal</option>
        </select>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #0a0c10">
        <div><div style="font-size:11px;color:#e2e8f0">Default Campaign Type</div><div style="font-size:9px;color:#6b7280">Pre-select when creating new campaigns</div></div>
        <select class="config-select" style="width:120px">
          <option value="spear-phishing">Spear Phishing</option>
          <option value="credential-harvest">Credential Harvest</option>
          <option value="business-compromise">BEC</option>
          <option value="malware-delivery">Malware</option>
        </select>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0">
        <div><div style="font-size:11px;color:#e2e8f0">Filter Presets</div><div style="font-size:9px;color:#6b7280">Quick filter targets by risk profile</div></div>
        <div style="display:flex;gap:4px">
          ${['All', 'High Risk', 'Untrained', 'Executives'].map(preset => html`<span class="tag" style="cursor:pointer;background:#8b5cf620;color:#a5b4fc">${preset}</span>`)}
        </div>
      </div>
    </div>`;
  }

  // Team workload for campaign review
  private _renderReviewWorkflow(): any {
    const reviewers = [
      { name: 'Sarah Chen', role: 'Security Lead', status: 'approved', time: '2h ago' },
      { name: 'James Wilson', role: 'Compliance', status: 'pending', time: '' },
      { name: 'Maria Garcia', role: 'HR Manager', status: 'pending', time: '' },
    ];
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:10px;color:#9ca3af;text-transform:uppercase">Campaign Approval Workflow</div>
      ${reviewers.map(r => html`
        <div style="display:flex;align-items:center;gap:10px;padding:8px;background:#0a0c10;border-radius:6px;margin-bottom:4px">
          <div class="comment-avatar" style="background:${r.status === 'approved' ? '#22c55e30' : '#fbbf2430'};color:${r.status === 'approved' ? '#34d399' : '#fbbf24'}">${r.name.split(' ').map((n: string) => n[0]).join('')}</div>
          <div style="flex:1">
            <div style="font-size:11px;font-weight:600">${r.name}</div>
            <div style="font-size:9px;color:#6b7280">${r.role}${r.time ? ' - ' + r.time : ''}</div>
          </div>
          ${r.status === 'approved' ? html`<span class="tag" style="background:#22c55e20;color:#34d399">Approved</span>` : html`
            <div style="display:flex;gap:4px">
              <button class="btn btn-sm" style="background:#22c55e;color:#fff;padding:4px 10px" @click=${() => { this._addAudit('approval', r.name + ' approved campaign'); }}>Approve</button>
              <button class="btn btn-sm" style="background:#ef4444;color:#fff;padding:4px 10px" @click=${() => { this._addAudit('approval', r.name + ' rejected campaign'); }}>Reject</button>
            </div>
          `}
        </div>
      `)}
    </div>`;
  }

  // Department risk distribution
  private _renderDeptRiskDistSVG(): string {
    const W = 260, H = 80;
    const depts = ['Engineering', 'Finance', 'HR', 'Sales', 'Marketing', 'Legal'];
    const values = depts.map(() => Math.floor(Math.random() * 80) + 20);
    const maxVal = Math.max(...values);
    const barW = (W - 60) / depts.length - 4;
    let svg = '';
    depts.forEach((d, i) => {
      const h = (values[i] / maxVal) * (H - 24);
      const x = 50 + i * (barW + 4);
      const color = values[i] > 70 ? '#ef4444' : values[i] > 45 ? '#fbbf24' : '#34d399';
      svg += `<rect x="${x}" y="${H - 18 - h}" width="${barW}" height="${h}" rx="2" fill="${color}" fill-opacity="0.7"/>`;
      svg += `<text x="${x + barW / 2}" y="${H - 6}" text-anchor="middle" fill="#6b7280" font-size="6">${d.substring(0, 5)}</text>`;
      svg += `<text x="${x + barW / 2}" y="${H - 20 - h}" text-anchor="middle" fill="#e2e8f0" font-size="7" font-weight="600">${values[i]}</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}">${svg}</svg>`;
  }

  private _renderFooter(): any {
    return html`<div>
      <div class="footer-bar">
        <span>Last scan: ${this._execHistory.length > 0 ? new Date(this._execHistory[0].timestamp).toLocaleString() : 'Never'}</span>
        <span>${this._items.length} items | ${this._auditTrail.length} audit entries</span>
      </div>
      <div class="footer-actions">
        <div class="footer-btn" @click=${() => { this._addAudit('export', 'Full report exported'); }}>Export Report</div>
        <div class="footer-btn" @click=${() => { this._addAudit('export', 'CSV exported'); }}>Export CSV</div>
        <div class="footer-btn" @click=${this._runScanWithHistory}>Run Analysis</div>
      </div>
    </div>`;
  }

  private _renderSLABar(): any {
    const total = this._slaTargetHours * 3600;
    const pct = 75 + Math.floor(Math.random() * 25);
    const hrs = Math.floor((total * (100 - pct)) / 3600000);
    const color = pct < 25 ? '#ef4444' : pct < 50 ? '#f59e0b' : '#22c55e';
    return html`<div class="sla-bar">
      <div class="sla-indicator" style="background:${color}"></div>
      <div style="flex:1">
        <div style="font-size:11px;color:#94a3b8;margin-bottom:4px">SLA (${this._slaTargetHours}h)</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div>
      </div>
      <div class="sla-time" style="color:${color}">${hrs}h elapsed</div>
    </div>`;
  }


  private _renderMiniGraph(): any {
    const data = this._items.slice(0, 12).map((item: any, i: number) => ({
      name: item.name.substring(0, 10),
      risk: item.risk,
      score: ({critical: 10, high: 7, medium: 4, low: 1}) as any)[item.risk]) || 1,
      idx: i
    }));
    const barW = 360;
    const barH = 180;
    const maxBars = data.length;
    const bw = Math.max(20, Math.floor((barW - 40) / maxBars) - 4);
    const maxScore = 10;
    const riskColors: any = {critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e'};
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:10px">Risk Score Chart</div>
      <svg width="100%" viewBox="0 0 ${barW} ${barH}" style="max-width:420px">
        ${[0, 2, 4, 6, 8, 10].map(v => html`<line x1="30" y1="${barH - 20 - (v / maxScore) * (barH - 50)}" x2="${barW - 10}" y2="${barH - 20 - (v / maxScore) * (barH - 50)}" stroke="#1f2937" stroke-width="0.5"/><text x="25" y="${barH - 18 - (v / maxScore) * (barH - 50)}" text-anchor="end" fill="#6b7280" font-size="7">${v}</text>`)}
        ${data.map((d: any, i: number) => {
          const x = 35 + i * (bw + 4);
          const h = (d.score / maxScore) * (barH - 50);
          const y = barH - 20 - h;
          return html`<g><rect x="${x}" y="${y}" width="${bw}" height="${h}" fill="${riskColors[d.risk]}60" rx="2" stroke="${riskColors[d.risk]}" stroke-width="0.5"/><text x="${x + bw / 2}" y="${barH - 8}" text-anchor="middle" fill="#6b7280" font-size="6" transform="rotate(-30, ${x + bw / 2}, ${barH - 8})">${d.name}</text></g>`;
        })}
        <line x1="30" y1="${barH - 20}" x2="${barW - 10}" y2="${barH - 20}" stroke="#374151" stroke-width="1"/>
      </svg>
    </div>`;
  }

  private _renderEscalationRules(): any {
    const rules = [
      { name: 'Auto-escalate critical', condition: 'risk === critical', action: 'Notify security lead', enabled: true },
      { name: 'Auto-escalate high count', condition: 'flagged >= threshold', action: 'Create incident', enabled: this._criticalThreshold > 0 },
      { name: 'SLA breach warning', condition: 'elapsed > 75% SLA', action: 'Send reminder', enabled: true },
      { name: 'Daily digest', condition: 'schedule: daily 9am', action: 'Email summary', enabled: false },
    ];
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:10px">Escalation Rules</div>
      ${rules.map((r: any) => html`<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:#0f172a;border-radius:6px;margin-bottom:4px;font-size:12px">
        <input type="checkbox" .checked=${r.enabled} style="accent-color:#8b5cf6" @change=${(e: Event) => { this._addAudit('config', 'Rule ' + (r.enabled ? 'disabled' : 'enabled') + ': ' + r.name); }}>
        <div style="flex:1">
          <div style="font-weight:600">${r.name}</div>
          <div style="font-size:10px;color:#6b7280;margin-top:2px">${r.condition} → ${r.action}</div>
        </div>
      </div>`)}
    </div>`;
  }

  private _renderNotificationPanel(): any {
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:10px">Notification Channels</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div style="background:#0f172a;border-radius:6px;padding:10px;display:flex;align-items:center;gap:8px">
          <span style="font-size:16px">&#128232;</span>
          <div><div style="font-size:11px;font-weight:600">Email</div><div style="font-size:9px;color:#6b7280">${this._escalationEmail || 'Not configured'}</div></div>
        </div>
        <div style="background:#0f172a;border-radius:6px;padding:10px;display:flex;align-items:center;gap:8px">
          <span style="font-size:16px">&#128276;</span>
          <div><div style="font-size:11px;font-weight:600">Slack Webhook</div><div style="font-size:9px;color:#6b7280">${this._webhookUrl ? 'Configured' : 'Not configured'}</div></div>
        </div>
        <div style="background:#0f172a;border-radius:6px;padding:10px;display:flex;align-items:center;gap:8px">
          <span style="font-size:16px">&#128172;</span>
          <div><div style="font-size:11px;font-weight:600">Teams</div><div style="font-size:9px;color:#6b7280">Not configured</div></div>
        </div>
        <div style="background:#0f172a;border-radius:6px;padding:10px;display:flex;align-items:center;gap:8px">
          <span style="font-size:16px">&#128279;</span>
          <div><div style="font-size:11px;font-weight:600">PagerDuty</div><div style="font-size:9px;color:#6b7280">Not configured</div></div>
        </div>
      </div>
    </div>`;
  }

  // Domain-specific risk scoring engine for phishing campaigns
  private _calculateCampaignRisk(campaign: any): { overall: number; factors: { name: string; score: number; weight: number; color: string }[] } {
    const clickRate = campaign.metrics.sent > 0 ? campaign.metrics.clicked / campaign.metrics.sent : 0;
    const submitRate = campaign.metrics.sent > 0 ? campaign.metrics.submitted / campaign.metrics.sent : 0;
    const reportRate = campaign.metrics.sent > 0 ? campaign.metrics.reported / campaign.metrics.sent : 0;
    const avgPhishScore = campaign.targets.length > 0 ? campaign.targets.reduce((s: number, t: any) => s + t.phishingScore, 0) / campaign.targets.length : 0;
    const factors = [
      { name: 'Click Rate', score: Math.min(100, clickRate * 200), weight: 25, color: clickRate > 0.3 ? '#ef4444' : clickRate > 0.15 ? '#f59e0b' : '#22c55e' },
      { name: 'Credential Exposure', score: Math.min(100, submitRate * 250), weight: 30, color: submitRate > 0.1 ? '#ef4444' : submitRate > 0.05 ? '#f59e0b' : '#22c55e' },
      { name: 'Report Rate (inverse)', score: Math.min(100, (1 - reportRate) * 100), weight: 20, color: reportRate < 0.1 ? '#ef4444' : reportRate < 0.3 ? '#f59e0b' : '#22c55e' },
      { name: 'Target Risk Profile', score: avgPhishScore, weight: 15, color: avgPhishScore > 60 ? '#ef4444' : avgPhishScore > 40 ? '#f59e0b' : '#22c55e' },
      { name: 'Template Sophistication', score: this._config.payload.obfuscation ? 75 : 40, weight: 10, color: this._config.payload.obfuscation ? '#f97316' : '#22c55e' },
    ];
    const overall = Math.round(factors.reduce((s: number, f: any) => s + f.score * f.weight / 100, 0));
    return { overall: Math.min(100, overall), factors };
  }

  // MITRE ATT&CK technique mapping for phishing campaigns
  private _mitrePhishingMap: { id: string; name: string; tactic: string; relevance: number }[] = [
    { id: 'T1566.001', name: 'Spearphishing Attachment', tactic: 'Initial Access', relevance: 95 },
    { id: 'T1566.002', name: 'Spearphishing Link', tactic: 'Initial Access', relevance: 90 },
    { id: 'T1566.003', name: 'Spearphishing via Service', tactic: 'Initial Access', relevance: 85 },
    { id: 'T1566.004', name: 'Spearphishing Voice', tactic: 'Initial Access', relevance: 70 },
    { id: 'T1193', name: 'Spearphishing Attachment', tactic: 'Initial Access', relevance: 80 },
    { id: 'T1071.001', name: 'Web Protocols', tactic: 'Command and Control', relevance: 60 },
    { id: 'T1071.004', name: 'DNS', tactic: 'Command and Control', relevance: 55 },
    { id: 'T1327', name: 'Phishing for Information', tactic: 'Collection', relevance: 75 },
  ];

  private _renderMitreMapping(): any {
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:10px;color:#9ca3af;text-transform:uppercase">MITRE ATT&CK Mapping</div>
      ${this._mitrePhishingMap.map(m => html`
        <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid #0a0c10;font-size:11px">
          <span class="mitre-tag">${m.id}</span>
          <span style="flex:1;color:#e2e8f0">${m.name}</span>
          <span class="tag">${m.tactic}</span>
          <div style="width:60px;height:6px;background:#1f2937;border-radius:3px;overflow:hidden">
            <div style="height:100%;width:${m.relevance}%;background:${m.relevance >= 85 ? '#ef4444' : m.relevance >= 60 ? '#f59e0b' : '#22c55e'};border-radius:3px"></div>
          </div>
          <span style="font-size:10px;color:#9ca3af;min-width:30px;text-align:right">${m.relevance}%</span>
        </div>
      `)}
    </div>`;
  }

  // Sankey diagram for campaign funnel
  private _renderCampaignFunnelSVG(): string {
    const W = 280, H = 140;
    const stages = [
      { label: 'Sent', value: 500, color: '#3b82f6' },
      { label: 'Opened', value: 320, color: '#fbbf24' },
      { label: 'Clicked', value: 140, color: '#f97316' },
      { label: 'Submitted', value: 45, color: '#dc2626' },
      { label: 'Reported', value: 85, color: '#34d399' },
    ];
    const maxVal = stages[0].value || 1;
    let svg = '';
    stages.forEach((s, i) => {
      const w = (s.value / maxVal) * (W - 120);
      const x = 60;
      const y = i * 26;
      svg += `<rect x="${x}" y="${y}" width="${w}" height="18" rx="3" fill="${s.color}" fill-opacity="0.7"/>`;
      svg += `<text x="${x - 4}" y="${y + 13}" text-anchor="end" fill="#9ca3af" font-size="8">${s.label}</text>`;
      svg += `<text x="${x + w + 6}" y="${y + 13}" fill="#e2e8f0" font-size="8" font-weight="600">${s.value}</text>`;
      if (i < stages.length - 1) {
        const convRate = ((stages[i + 1].value / s.value) * 100).toFixed(1);
        svg += `<text x="${x + w + 36}" y="${y + 13}" fill="#6b7280" font-size="7">${convRate}%</text>`;
      }
    });
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}">${svg}</svg>`;
  }

  // Trend analysis with linear regression
  private _campaignTrendData: { date: string; clickRate: number; submitRate: number }[] = [
    { date: 'Apr 17', clickRate: 22, submitRate: 5 },
    { date: 'Apr 18', clickRate: 28, submitRate: 8 },
    { date: 'Apr 19', clickRate: 25, submitRate: 6 },
    { date: 'Apr 20', clickRate: 31, submitRate: 9 },
    { date: 'Apr 21', clickRate: 35, submitRate: 12 },
    { date: 'Apr 22', clickRate: 29, submitRate: 7 },
  ];

  private _renderTrendAnalysis(): any {
    const clickData = this._campaignTrendData.map(d => d.clickRate);
    const submitData = this._campaignTrendData.map(d => d.submitRate);
    const n = clickData.length || 1;
    const sumX = clickData.reduce((s, _, i) => s + i, 0);
    const sumY = clickData.reduce((s, v) => s + v, 0);
    const sumXY = clickData.reduce((s, v, i) => s + i * v, 0);
    const sumX2 = clickData.reduce((s, _, i) => s + i * i, 0);
    const denom = n * sumX2 - sumX * sumX || 1;
    const slope = (n * sumXY - sumX * sumY) / denom;
    const trendClass = slope > 0.5 ? 'trend-up' : slope < -0.5 ? 'trend-down' : 'trend-flat';
    const arrow = slope > 0.5 ? '\u2191' : slope < -0.5 ? '\u2193' : '\u2192';

    const W = 260, H = 80, pad = 20;
    const maxVal = Math.max(...clickData, ...submitData, 1);
    const stepX = (W - pad * 2) / (n - 1);
    let svg = '';
    for (let i = 0; i <= 4; i++) {
      const y = pad + (i / 4) * (H - pad * 2);
      svg += `<line x1="${pad}" y1="${y}" x2="${W - pad}" y2="${y}" stroke="#2a2d3a" stroke-width="0.5"/>`;
    }
    const clickPts = clickData.map((v, i) => `${pad + i * stepX},${pad + (1 - v / maxVal) * (H - pad * 2)}`).join(' ');
    svg += `<polyline points="${clickPts}" fill="none" stroke="#f97316" stroke-width="1.5" stroke-linecap="round"/>`;
    const submitPts = submitData.map((v, i) => `${pad + i * stepX},${pad + (1 - v / maxVal) * (H - pad * 2)}`).join(' ');
    svg += `<polyline points="${submitPts}" fill="none" stroke="#dc2626" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="4 2"/>`;
    this._campaignTrendData.forEach((d, i) => {
      const x = pad + i * stepX;
      svg += `<text x="${x}" y="${H - 4}" text-anchor="middle" fill="#6b7280" font-size="6">${d.date}</text>`;
    });
    svg += `<circle cx="${W - 90}" cy="8" r="3" fill="#f97316"/><text x="${W - 84}" y="11" fill="#9ca3af" font-size="7">Click %</text>`;
    svg += `<circle cx="${W - 45}" cy="8" r="3" fill="#dc2626"/><text x="${W - 39}" y="11" fill="#9ca3af" font-size="7">Submit %</text>`;

    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:10px;color:#9ca3af;text-transform:uppercase">Campaign Trend Analysis</div>
      <svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}">${svg}</svg>
      <div style="display:flex;gap:12px;margin-top:8px">
        <span class="trend-indicator ${trendClass}">${arrow} Click rate trend: ${slope > 0 ? '+' : ''}${slope.toFixed(2)}/day</span>
      </div>
    </div>`;
  }

  // Auto-generated insights
  private _generatePhishingInsights(): { title: string; body: string; severity: string }[] {
    const insights: { title: string; body: string; severity: string }[] = [];
    const lastCampaign = this._campaigns[this._campaigns.length - 1];
    if (lastCampaign) {
      const clickRate = this._pct(lastCampaign.metrics.clicked, lastCampaign.metrics.sent);
      if (clickRate > 30) insights.push({ title: 'High Click Rate Detected', body: `The last campaign had a ${clickRate}% click rate, exceeding the industry average of 12%. Consider increasing security awareness training frequency.`, severity: 'critical' });
      const reportRate = this._pct(lastCampaign.metrics.reported, lastCampaign.metrics.sent);
      if (reportRate < 10) insights.push({ title: 'Low Reporting Rate', body: `Only ${reportRate}% of targets reported the phishing email. The reporting culture needs improvement - deploy phishing report button training.`, severity: 'warning' });
    }
    const highRiskTargets = this._targets.filter(t => t.phishingScore > 60);
    if (highRiskTargets.length > 0) insights.push({ title: 'High Risk Target Group', body: `${highRiskTargets.length} targets have a phishing score above 60%. These users need prioritized security awareness training.`, severity: 'warning' });
    insights.push({ title: 'Template Recommendation', body: 'Based on historical data, credential harvest templates with realistic sender domains have the highest engagement rate. Consider rotating templates monthly.', severity: 'info' });
    return insights;
  }

  // Threat intelligence feed
  private _phishIntelFeed: { type: string; value: string; confidence: number; actor: string; desc: string }[] = [
    { type: 'domain', value: 'secure-login[.]microsoft[.]com', confidence: 92, actor: 'FIN7', desc: 'Active credential harvest campaign' },
    { type: 'url', value: 'https://verify-account[.]azure[.]net', confidence: 88, actor: 'APT-29', desc: 'Microsoft 365 impersonation page' },
    { type: 'ip', value: '192.168.xxx.xxx', confidence: 76, actor: 'Unknown', desc: 'Phishing landing page host' },
    { type: 'hash', value: 'b4a7c3e2f1d8...', confidence: 95, actor: 'TA577', desc: 'QakBot macro dropper' },
  ];

  private _renderIntelFeed(): any {
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:10px;color:#9ca3af;text-transform:uppercase">Threat Intelligence Feed</div>
      ${this._phishIntelFeed.map(ti => html`
        <div class="intel-row">
          <span class="intel-type" style="background:${ti.type === 'ip' ? '#ef444420' : ti.type === 'domain' ? '#3b82f620' : ti.type === 'hash' ? '#a855f720' : '#f9731620'};color:${ti.type === 'ip' ? '#ef4444' : ti.type === 'domain' ? '#3b82f6' : ti.type === 'hash' ? '#a855f7' : '#f97316'}">${ti.type}</span>
          <span class="intel-val">${ti.value}</span>
          <span class="intel-desc">${ti.desc}</span>
          <span class="intel-conf" style="color:${ti.confidence >= 85 ? '#34d399' : ti.confidence >= 70 ? '#fbbf24' : '#f87171'}">${ti.confidence}%</span>
        </div>
      `)}
    </div>`;
  }

  render() {
    const campaign = this._activeCampaign;
    const template = this._getTemplate();
    const totalTargets = this._targets.length;
    const departments = [...new Set(this._targets.map(t => t.department))];

    return html`
      <div class="panel">
        <div class="header"><div class="title"><span>&#x1F98C;</span> Phishing Campaign Manager</div></div>
        <div class="tabs">
          <button class="tab ${this._activeTab === 'templates' ? 'active' : ''}" @click=${() => { this._activeTab = 'templates'; }}>Templates</button>
          <button class="tab ${this._activeTab === 'targets' ? 'active' : ''}" @click=${() => { this._activeTab = 'targets'; }}>Targets (${totalTargets})</button>
          <button class="tab ${this._activeTab === 'configure' ? 'active' : ''}" @click=${() => { this._activeTab = 'configure'; }}>Configure</button>
          <button class="tab ${this._activeTab === 'execute' ? 'active' : ''}" @click=${() => { this._activeTab = 'execute'; }}>Execute</button>
          <button class="tab ${this._activeTab === 'results' ? 'active' : ''}" @click=${() => { this._activeTab = 'results'; }}>Results</button>
          <button class="tab ${this._activeTab === 'history' ? 'active' : ''}" @click=${() => { this._activeTab = 'history'; }}>History (${this._campaigns.length})</button>
          <button class="tab ${this._activeTab === 'analytics' ? 'active' : ''}" @click=${() => { this._activeTab = 'analytics'; }}>Analytics</button>
          <button class="tab ${this._activeTab === 'compliance' ? 'active' : ''}" @click=${() => { this._activeTab = 'compliance'; }}>Compliance</button>
        </div>

        ${this._activeTab === 'templates' ? html`
          <div style="font-weight:600;margin-bottom:12px">Select a phishing template:</div>
          <div class="template-grid">
            ${SAMPLE_TEMPLATES.map(t => html`
              <div class="template-card ${this._config.templateId === t.id ? 'selected' : ''}" @click=${() => { this._config.templateId = t.id; this._selectedTemplate = t; }}>
                <div class="tpl-name">${t.name}</div>
                <div class="tpl-subject">"${t.subject}"</div>
                <div class="tpl-body">${t.body}</div>
                <div class="tpl-meta">
                  <span class="tag">${t.type}</span>
                  <span>From: ${t.senderName} &lt;${t.senderEmail}&gt;</span>
                  ${t.trackingPixel ? html`<span>Pixel: ON</span>` : nothing}
                  ${t.replyTracking ? html`<span>Reply: ON</span>` : nothing}
                </div>
              </div>
            `)}
          </div>
        ` : nothing}

        ${this._activeTab === 'targets' ? html`
          <div class="filter-row">
            <label>Filter by Department:</label>
            <select .value=${this._filterDept} @change=${(e: Event) => { this._filterDept = (e.target as HTMLSelectElement).value; }}>
              <option value="all">All Departments</option>
              ${departments.map(d => html`<option value=${d}>${d}</option>`)}
            </select>
            <span style="font-size:12px;color:#9ca3af;margin-left:auto">Showing ${this._getFilteredTargets().length} of ${totalTargets} targets</span>
          </div>
          <div style="max-height:400px;overflow-y:auto">
            <table class="target-table">
              <thead><tr><th>Email</th><th>Name</th><th>Department</th><th>Role</th><th>Seniority</th><th>Phish Score</th><th>Last Trained</th></tr></thead>
              <tbody>${this._getFilteredTargets().map(t => html`
                <tr>
                  <td>${t.email}</td>
                  <td>${t.firstName} ${t.lastName}</td>
                  <td>${t.department}</td>
                  <td>${t.role}</td>
                  <td><span class="tag">${t.seniority}</span></td>
                  <td><span class="${t.phishingScore > 60 ? 'risk-high' : t.phishingScore > 40 ? 'risk-med' : 'risk-low'}">${t.phishingScore}%</span></td>
                  <td style="font-size:11px;color:#9ca3af">${t.lastTrained}</td>
                </tr>
              `)}</tbody>
            </table>
          </div>
        ` : nothing}

        ${this._activeTab === 'configure' ? html`
          <div style="font-weight:600;margin-bottom:8px">Campaign Configuration</div>
          <div style="background:#1e293b;border-radius:8px;padding:12px;margin-bottom:16px;font-size:12px">
            <strong>Selected Template:</strong> ${template.name} - "${template.subject}"
          </div>
          <div class="form-grid">
            <div class="form-group"><label>Campaign Name</label><input type="text" .value=${this._config.name} @input=${(e: Event) => { this._config.name = (e.target as HTMLInputElement).value; }} placeholder="e.g. Q1 Security Awareness Test"></div>
            <div class="form-group"><label>Campaign Type</label>
              <select .value=${this._config.type} @change=${(e: Event) => { this._config.type = (e.target as HTMLSelectElement).value as CampaignType; }}>
                <option value="spear-phishing">Spear Phishing</option><option value="whaling">Whaling (Executive)</option>
                <option value="business-compromise">Business Email Compromise</option><option value="credential-harvest">Credential Harvesting</option>
                <option value="malware-delivery">Malware Delivery</option><option value="smishing">SMS Phishing</option>
                <option value="vishing">Voice Phishing</option>
              </select>
            </div>
            <div class="form-group"><label>Payload Type</label>
              <select .value=${this._config.payload.type} @change=${(e: Event) => { this._config.payload.type = (e.target as HTMLSelectElement).value as PayloadType; }}>
                <option value="html-form">HTML Credential Form</option><option value="macro-doc">Macro Document</option>
                <option value="pdf-exploit">PDF Exploit</option><option value="exe-dropper">EXE Dropper</option>
                <option value="url-redirect">URL Redirect</option><option value="js-injection">JS Injection</option>
              </select>
            </div>
            <div class="form-group"><label>Send Delay (seconds)</label><input type="number" min="0" max="300" .value=${String(this._config.sendDelay)} @input=${(e: Event) => { this._config.sendDelay = parseInt((e.target as HTMLInputElement).value) || 0; }}></div>
            <div class="form-group"><label>SSL Certificate</label>
              <select .value=${this._config.payload.certificate} @change=${(e: Event) => { this._config.payload.certificate = (e.target as HTMLSelectElement).value; }}>
                <option value="self-signed">Self-Signed</option><option value="lets-encrypt">Let's Encrypt</option>
                <option value="ev">Extended Validation</option><option value="expired">Expired (Realistic)</option>
              </select>
            </div>
            <div class="form-group"><label>Landing Page Expiration (hours)</label><input type="number" min="1" max="168" .value=${String(this._config.payload.expiration)} @input=${(e: Event) => { this._config.payload.expiration = parseInt((e.target as HTMLInputElement).value) || 72; }}></div>
          </div>
          <div style="margin-bottom:16px;display:flex;gap:24px;flex-wrap:wrap">
            <label style="display:flex;align-items:center;gap:6px;font-size:13px"><input type="checkbox" ?checked=${this._config.payload.obfuscation} @change=${(e: Event) => { this._config.payload.obfuscation = (e.target as HTMLInputElement).checked; }} style="accent-color:#3b82f6"> Payload obfuscation</label>
            <label style="display:flex;align-items:center;gap:6px;font-size:13px"><input type="checkbox" ?checked=${this._config.payload.sandboxEvasion} @change=${(e: Event) => { this._config.payload.sandboxEvasion = (e.target as HTMLInputElement).checked; }} style="accent-color:#3b82f6"> Sandbox evasion</label>
            <label style="display:flex;align-items:center;gap:6px;font-size:13px"><input type="checkbox" ?checked=${this._config.followUpEnabled} @change=${(e: Event) => { this._config.followUpEnabled = (e.target as HTMLInputElement).checked; }} style="accent-color:#3b82f6"> Follow-up email</label>
            <label style="display:flex;align-items:center;gap:6px;font-size:13px"><input type="checkbox" ?checked=${this._config.aBTest} @change=${(e: Event) => { this._config.aBTest = (e.target as HTMLInputElement).checked; }} style="accent-color:#3b82f6"> A/B testing</label>
          </div>
          <div class="btn-row">
            <button class="btn btn-primary" ?disabled=${!this._config.name.trim() || totalTargets === 0} @click=${this._launchCampaign}>
              Launch Campaign (${totalTargets} targets)
            </button>
          </div>
        ` : nothing}

        ${this._activeTab === 'execute' ? html`
          ${campaign ? html`
            <div class="stat-grid">
              <div class="stat"><div class="stat-value" style="color:#60a5fa">${campaign.metrics.sent}</div><div class="stat-label">Sent</div></div>
              <div class="stat"><div class="stat-value" style="color:#fbbf24">${campaign.metrics.opened}</div><div class="stat-label">Opened</div></div>
              <div class="stat"><div class="stat-value" style="color:#f97316">${campaign.metrics.clicked}</div><div class="stat-label">Clicked</div></div>
              <div class="stat"><div class="stat-value" style="color:#dc2626">${campaign.metrics.submitted}</div><div class="stat-label">Submitted</div></div>
              <div class="stat"><div class="stat-value" style="color:#34d399">${campaign.metrics.reported}</div><div class="stat-label">Reported</div></div>
              <div class="stat"><div class="stat-value" style="color:#6b7280">${campaign.metrics.bounced}</div><div class="stat-label">Bounced</div></div>
            </div>
            ${campaign.metrics.sent > 0 ? html`
              <div class="metric-bar">
                <div class="metric-seg" style="width:${this._pct(campaign.metrics.opened, campaign.metrics.sent)}%;background:#fbbf24">Opened</div>
                <div class="metric-seg" style="width:${this._pct(campaign.metrics.clicked, campaign.metrics.sent)}%;background:#f97316">Clicked</div>
                <div class="metric-seg" style="width:${this._pct(campaign.metrics.submitted, campaign.metrics.sent)}%;background:#dc2626">Submitted</div>
                <div class="metric-seg" style="width:${this._pct(campaign.metrics.reported, campaign.metrics.sent)}%;background:#34d399">Reported</div>
                <div class="metric-seg" style="width:${this._pct(campaign.metrics.bounced, campaign.metrics.sent)}%;background:#6b7280">Bounced</div>
                <div class="metric-seg" style="flex:1;background:#1a1d27;color:#6b7280">No Action</div>
              </div>
            ` : nothing}
            <div class="progress-bar"><div class="progress-fill" style="width:${this._progress}%"></div></div>
            ${this._output.length > 0 ? html`<div class="output-box">${this._output.map(l => html`<div class="${l.startsWith('[+]') ? 'output-success' : l.startsWith('[!]') ? 'output-warn' : l.startsWith('[-]') ? 'output-error' : 'output-info'}">${l}</div>`)}</div>` : nothing}
          ` : html`<div class="empty-state">Configure and launch a campaign first</div>`}
        ` : nothing}

        ${this._activeTab === 'results' ? html`
          ${campaign && campaign.status === 'completed' ? html`
            <div style="font-weight:600;margin-bottom:12px">Campaign Results: ${campaign.config.name}</div>
            <div class="stat-grid">
              <div class="stat"><div class="stat-value" style="color:#60a5fa">${this._pct(campaign.metrics.opened, campaign.metrics.sent)}%</div><div class="stat-label">Open Rate</div></div>
              <div class="stat"><div class="stat-value" style="color:#f97316">${this._pct(campaign.metrics.clicked, campaign.metrics.sent)}%</div><div class="stat-label">Click Rate</div></div>
              <div class="stat"><div class="stat-value" style="color:#dc2626">${this._pct(campaign.metrics.submitted, campaign.metrics.sent)}%</div><div class="stat-label">Credential Rate</div></div>
              <div class="stat"><div class="stat-value" style="color:#34d399">${this._pct(campaign.metrics.reported, campaign.metrics.sent)}%</div><div class="stat-label">Report Rate</div></div>
              <div class="stat"><div class="stat-value" style="color:#fbbf24">${this._pct(campaign.metrics.clicked, campaign.metrics.opened)}%</div><div class="stat-label">Click-to-Open</div></div>
              <div class="stat"><div class="stat-value">${this._pct(campaign.metrics.submitted, campaign.metrics.clicked)}%</div><div class="stat-label">Submit-to-Click</div></div>
            </div>
            <div class="btn-row">
              <button class="btn btn-secondary btn-sm" @click=${() => this._exportResults(campaign)}>Export Results (JSON)</button>
            </div>
            ${(() => {
              const risk = this._calculateCampaignRisk(campaign);
              return html`
                <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                    <span style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase">Campaign Risk Assessment</span>
                    <span style="font-size:16px;font-weight:800;color:${risk.overall >= 70 ? '#ef4444' : risk.overall >= 40 ? '#fbbf24' : '#34d399'}">${risk.overall}/100</span>
                  </div>
                  ${risk.factors.map((f: any) => html`
                    <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid #0a0c10;font-size:11px">
                      <span style="flex:1;color:#9ca3af">${f.name} (${f.weight}%)</span>
                      <div style="width:100px;height:6px;background:#1f2937;border-radius:3px;overflow:hidden"><div style="height:100%;width:${f.score}%;background:${f.color};border-radius:3px"></div></div>
                      <span style="font-weight:700;min-width:30px;text-align:right;color:${f.color}">${Math.round(f.score)}</span>
                    </div>
                  `)}
                </div>
              `;
            })()}
            <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
              <div style="font-weight:600;font-size:12px;margin-bottom:10px;color:#9ca3af;text-transform:uppercase">Campaign Funnel</div>
              <div style="background:#0a0c10;border-radius:8px;padding:12px">${this._renderCampaignFunnelSVG()}</div>
            </div>
            ${this._renderTrendAnalysis()}
            ${this._renderMitreMapping()}
            ${this._renderIntelFeed()}
            <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
              <div style="font-weight:600;font-size:12px;margin-bottom:10px;color:#9ca3af;text-transform:uppercase">Auto-Generated Insights</div>
              ${this._generatePhishingInsights().map(ins => html`
                <div class="insight-card" style="border-left-color:${ins.severity === 'critical' ? '#ef4444' : ins.severity === 'warning' ? '#fbbf24' : '#3b82f6'}">
                  <div class="insight-title" style="color:${ins.severity === 'critical' ? '#ef4444' : ins.severity === 'warning' ? '#fbbf24' : '#3b82f6'}">${ins.severity.toUpperCase()}: ${ins.title}</div>
                  <div class="insight-body">${ins.body}</div>
                </div>
              `)}
            </div>
            <div style="font-weight:600;margin-bottom:8px">Target Breakdown:</div>
            <div style="max-height:300px;overflow-y:auto">
              <table class="target-table">
                <thead><tr><th>Email</th><th>Department</th><th>Phish Score</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>${campaign.targets.map(t => {
                  const events = campaign.events.filter(e => e.targetId === t.id).map(e => e.event);
                  const status = events.includes('submitted') ? 'Compromised' : events.includes('clicked') ? 'Clicked' : events.includes('opened') ? 'Opened' : events.includes('reported') ? 'Reported' : 'Safe';
                  const statusColor = events.includes('submitted') ? '#dc2626' : events.includes('clicked') ? '#f97316' : events.includes('opened') ? '#fbbf24' : events.includes('reported') ? '#34d399' : '#6b7280';
                  return html`<tr>
                    <td>${t.email}</td><td>${t.department}</td>
                    <td class="${t.phishingScore > 60 ? 'risk-high' : t.phishingScore > 40 ? 'risk-med' : 'risk-low'}">${t.phishingScore}%</td>
                    <td style="color:${statusColor};font-weight:600">${status}</td>
                    <td>${events.map(e => html`<span class="tag" style="margin-right:4px">${e}</span>`)}</td>
                  </tr>`;
                })}</tbody>
              </table>
            </div>
          ` : html`<div class="empty-state">No completed campaigns yet</div>`}
        ` : nothing}

        ${this._activeTab === 'history' ? html`
          ${this._campaigns.length === 0 ? html`<div class="empty-state">No campaign history</div>` : this._campaigns.map(c => html`
            <div class="history-item" @click=${() => { this._activeCampaign = c; this._activeTab = 'results'; }}>
              <div class="history-title">${c.id} - ${c.config.name || 'Untitled'}</div>
              <div class="history-meta">
                Type: ${c.config.type} | Template: ${c.template.name} |
                Targets: ${c.targets.length} |
                Click Rate: ${this._pct(c.metrics.clicked, c.metrics.sent)}% |
                Submit Rate: ${this._pct(c.metrics.submitted, c.metrics.sent)}% |
                ${new Date(c.completedAt).toLocaleString()}
              </div>
            </div>
          `)}
          ${this._renderReviewWorkflow()}
          ${this._renderPanelConfig()}
          <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
            <div style="font-weight:600;font-size:12px;margin-bottom:10px;color:#9ca3af;text-transform:uppercase">Department Risk Distribution</div>
            <div style="background:#0a0c10;border-radius:8px;padding:12px">${this._renderDeptRiskDistSVG()}</div>
          </div>
        ` : nothing}

        ${this._activeTab === 'analytics' ? html`
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
            <div style="background:#1f2937;border-radius:8px;padding:14px">
              <div style="font-weight:600;font-size:12px;margin-bottom:10px;color:#9ca3af;text-transform:uppercase">Historical Performance</div>
              ${this._campaignTrendData.map(d => html`
                <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid #0a0c10;font-size:11px">
                  <span style="min-width:60px;color:#6b7280">${d.date}</span>
                  <div style="flex:1;height:6px;background:#1f2937;border-radius:3px;overflow:hidden"><div style="height:100%;width:${d.clickRate * 2}%;background:#f97316;border-radius:3px"></div></div>
                  <span style="min-width:40px;font-weight:600;color:#f97316">${d.clickRate}%</span>
                  <div style="flex:1;height:6px;background:#1f2937;border-radius:3px;overflow:hidden"><div style="height:100%;width:${d.submitRate * 4}%;background:#dc2626;border-radius:3px"></div></div>
                  <span style="min-width:40px;font-weight:600;color:#dc2626">${d.submitRate}%</span>
                </div>
              `)}
              <div style="display:flex;gap:12px;margin-top:6px;font-size:9px;color:#6b7280">
                <span style="display:flex;align-items:center;gap:3px"><span class="dist-dot" style="background:#f97316"></span> Click Rate</span>
                <span style="display:flex;align-items:center;gap:3px"><span class="dist-dot" style="background:#dc2626"></span> Submit Rate</span>
              </div>
            </div>
            <div>
              ${this._generatePhishingInsights().map(ins => html`
                <div class="insight-card" style="border-left-color:${ins.severity === 'critical' ? '#ef4444' : ins.severity === 'warning' ? '#fbbf24' : '#3b82f6'}">
                  <div class="insight-title" style="color:${ins.severity === 'critical' ? '#ef4444' : ins.severity === 'warning' ? '#fbbf24' : '#3b82f6'}">${ins.severity.toUpperCase()}: ${ins.title}</div>
                  <div class="insight-body">${ins.body}</div>
                </div>
              `)}
            </div>
          </div>
          <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
            <div style="font-weight:600;font-size:12px;margin-bottom:10px;color:#9ca3af;text-transform:uppercase">Campaign Funnel (All Time)</div>
            <div style="background:#0a0c10;border-radius:8px;padding:12px">${this._renderCampaignFunnelSVG()}</div>
          </div>
          ${this._renderIntelFeed()}
        ` : nothing}

        ${this._activeTab === 'compliance' ? html`
          <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
            <div style="font-weight:600;font-size:12px;margin-bottom:10px;color:#9ca3af;text-transform:uppercase">Compliance Framework Alignment</div>
            ${[
              { framework: 'NIST CSF 2.0', category: 'PR.IP-1', requirement: 'Baseline Configuration', status: 'compliant', score: 95 },
              { framework: 'NIST CSF 2.0', category: 'PR.AT-1', requirement: 'Security Awareness Training', status: 'partial', score: 72 },
              { framework: 'ISO 27001', category: 'A.6.3', requirement: 'Information Security Awareness', status: 'compliant', score: 88 },
              { framework: 'GDPR', category: 'Art. 32', requirement: 'Security of Processing', status: 'compliant', score: 91 },
              { framework: 'PCI DSS', category: 'Req 12.6', requirement: 'Security Policies and Programs', status: 'partial', score: 65 },
              { framework: 'SOC 2', category: 'CC6.1', requirement: 'Logical Access Security', status: 'compliant', score: 85 },
              { framework: 'HIPAA', category: '164.308(a)(5)', requirement: 'Security Awareness Training', status: 'non-compliant', score: 42 },
            ].map(c => html`
              <div style="display:flex;align-items:center;gap:10px;padding:8px;background:#0a0c10;border-radius:6px;margin-bottom:4px;font-size:11px">
                <span class="tag">${c.framework}</span>
                <span style="flex:1;color:#e2e8f0">${c.category} - ${c.requirement}</span>
                <div style="width:60px;height:6px;background:#1f2937;border-radius:3px;overflow:hidden"><div style="height:100%;width:${c.score}%;background:${c.score >= 80 ? '#34d399' : c.score >= 60 ? '#fbbf24' : '#f87171'};border-radius:3px"></div></div>
                <span class="tag" style="background:${c.status === 'compliant' ? '#22c55e20' : c.status === 'partial' ? '#fbbf2420' : '#ef444420'};color:${c.status === 'compliant' ? '#34d399' : c.status === 'partial' ? '#fbbf24' : '#f87171'}">${c.status}</span>
              </div>
            `)}
          </div>
          ${this._renderMitreMapping()}
          ${this._renderReviewWorkflow()}
        ` : nothing}

      </div>
        ${this._renderRiskGauge()}
        ${this._renderFooter()}
      </div>
    `;
  }
}
