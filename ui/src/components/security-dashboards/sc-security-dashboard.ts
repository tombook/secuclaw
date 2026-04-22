import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

/**
 * Security Dashboard Overview Component
 * Central command center for all security metrics and alerts
 */
@customElement('sc-security-dashboard')
export class ScSecurityDashboard extends LitElement {
  
  static styles = css`
    :host {
      display: block;
      --primary-color: #00d4ff;
      --secondary-color: #7c3aed;
      --danger-color: #ef4444;
      --warning-color: #f59e0b;
      --success-color: #10b981;
      --info-color: #3b82f6;
      --bg-dark: #0a0f1a;
      --bg-card: #111827;
      --bg-hover: #1f2937;
      --text-primary: #f9fafb;
      --text-secondary: #9ca3af;
      --border-color: #374151;
    }

    .dashboard {
      background: var(--bg-dark);
      border-radius: 12px;
      padding: 24px;
      color: var(--text-primary);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border-color);
      flex-wrap: wrap;
      gap: 16px;
    }

    .dashboard-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .dashboard-title svg {
      width: 28px;
      height: 28px;
      color: var(--primary-color);
    }

    .dashboard-title h1 {
      font-size: 24px;
      font-weight: 700;
      margin: 0;
      background: linear-gradient(135deg, var(--text-primary) 0%, var(--primary-color) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .dashboard-subtitle {
      font-size: 13px;
      color: var(--text-secondary);
      margin-top: 4px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .btn {
      padding: 10px 16px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: var(--bg-card);
      color: var(--text-primary);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: inherit;
    }

    .btn:hover {
      background: var(--bg-hover);
      border-color: var(--primary-color);
    }

    .btn:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    .btn-primary {
      background: var(--primary-color);
      color: var(--bg-dark);
      border-color: var(--primary-color);
    }

    .btn-primary:hover {
      background: #00b8e6;
      transform: translateY(-1px);
    }

    .live-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 20px;
      font-size: 12px;
      color: var(--success-color);
    }

    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--success-color);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.2); }
    }

    .metrics-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .metric-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 20px;
      transition: all 0.3s;
      position: relative;
      overflow: hidden;
    }

    .metric-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: var(--metric-color, var(--primary-color));
    }

    .metric-card:hover {
      transform: translateY(-4px);
      border-color: var(--metric-color, var(--primary-color));
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }

    .metric-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .metric-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(var(--metric-rgb, 0, 212, 255), 0.1);
    }

    .metric-icon svg {
      width: 22px;
      height: 22px;
      color: var(--metric-color, var(--primary-color));
    }

    .metric-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 600;
    }

    .metric-trend.up { color: var(--danger-color); }
    .metric-trend.down { color: var(--success-color); }
    .metric-trend.neutral { color: var(--text-secondary); }

    .metric-value {
      font-size: 32px;
      font-weight: 800;
      color: var(--text-primary);
      line-height: 1;
      margin-bottom: 8px;
    }

    .metric-label {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 12px;
    }

    .metric-chart {
      height: 40px;
      display: flex;
      align-items: flex-end;
      gap: 3px;
    }

    .chart-bar {
      flex: 1;
      background: var(--metric-color, var(--primary-color));
      opacity: 0.3;
      border-radius: 2px;
      transition: all 0.3s;
    }

    .chart-bar:last-child {
      opacity: 1;
    }

    .metric-card:hover .chart-bar:last-child {
      transform: scaleY(1.1);
    }

    .main-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
    }

    @media (max-width: 1200px) {
      .main-grid {
        grid-template-columns: 1fr;
      }
    }

    .card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      overflow: hidden;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color);
    }

    .card-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .card-title svg {
      width: 18px;
      height: 18px;
      color: var(--primary-color);
    }

    .card-body {
      padding: 20px;
    }

    .alert-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .alert-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px;
      background: var(--bg-dark);
      border-radius: 8px;
      border-left: 3px solid;
      transition: all 0.2s;
    }

    .alert-item:hover {
      transform: translateX(4px);
    }

    .alert-item.critical { border-left-color: var(--danger-color); }
    .alert-item.high { border-left-color: var(--warning-color); }
    .alert-item.medium { border-left-color: var(--primary-color); }
    .alert-item.low { border-left-color: var(--success-color); }

    .alert-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .alert-icon.critical { background: rgba(239, 68, 68, 0.15); color: var(--danger-color); }
    .alert-icon.high { background: rgba(245, 158, 11, 0.15); color: var(--warning-color); }
    .alert-icon.medium { background: rgba(0, 212, 255, 0.15); color: var(--primary-color); }
    .alert-icon.low { background: rgba(16, 185, 129, 0.15); color: var(--success-color); }

    .alert-icon svg {
      width: 18px;
      height: 18px;
    }

    .alert-content {
      flex: 1;
    }

    .alert-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 4px;
    }

    .alert-description {
      font-size: 12px;
      color: var(--text-secondary);
      line-height: 1.4;
    }

    .alert-meta {
      display: flex;
      gap: 12px;
      margin-top: 8px;
      font-size: 11px;
      color: var(--text-secondary);
    }

    .alert-time {
      font-family: monospace;
    }

    .severity-chart {
      padding: 20px;
    }

    .donut-chart {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
    }

    .donut-chart svg {
      transform: rotate(-90deg);
    }

    .donut-bg {
      fill: none;
      stroke: var(--border-color);
      stroke-width: 20;
    }

    .donut-segment {
      fill: none;
      stroke-width: 20;
      stroke-linecap: round;
      transition: stroke-dashoffset 1s ease-out;
    }

    .chart-legend {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      background: var(--bg-dark);
      border-radius: 6px;
    }

    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 3px;
    }

    .legend-dot.critical { background: var(--danger-color); }
    .legend-dot.high { background: var(--warning-color); }
    .legend-dot.medium { background: var(--primary-color); }
    .legend-dot.low { background: var(--success-color); }

    .legend-info {
      flex: 1;
    }

    .legend-label {
      font-size: 11px;
      color: var(--text-secondary);
    }

    .legend-value {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .activity-feed {
      max-height: 400px;
      overflow-y: auto;
    }

    .activity-item {
      display: flex;
      gap: 12px;
      padding: 14px 20px;
      border-bottom: 1px solid var(--border-color);
      transition: background 0.2s;
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-item:hover {
      background: var(--bg-hover);
    }

    .activity-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .activity-icon.alert { background: rgba(239, 68, 68, 0.15); color: var(--danger-color); }
    .activity-icon.resolved { background: rgba(16, 185, 129, 0.15); color: var(--success-color); }
    .activity-icon.info { background: rgba(59, 130, 246, 0.15); color: var(--info-color); }
    .activity-icon.warning { background: rgba(245, 158, 11, 0.15); color: var(--warning-color); }

    .activity-icon svg {
      width: 16px;
      height: 16px;
    }

    .activity-content {
      flex: 1;
    }

    .activity-text {
      font-size: 13px;
      color: var(--text-primary);
      line-height: 1.4;
    }

    .activity-text strong {
      font-weight: 600;
    }

    .activity-time {
      font-size: 11px;
      color: var(--text-secondary);
      margin-top: 4px;
    }

    .quick-actions {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      padding: 20px;
    }

    .quick-action {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 20px;
      background: var(--bg-dark);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .quick-action:hover {
      border-color: var(--primary-color);
      transform: translateY(-2px);
    }

    .quick-action:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    .quick-action-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 212, 255, 0.1);
      color: var(--primary-color);
    }

    .quick-action-icon svg {
      width: 22px;
      height: 22px;
    }

    .quick-action-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-primary);
      text-align: center;
    }

    .threat-map {
      position: relative;
      height: 200px;
      background: radial-gradient(ellipse at center, rgba(0, 212, 255, 0.05) 0%, transparent 70%);
    }

    .threat-map svg {
      width: 100%;
      height: 100%;
    }

    .threat-pulse {
      animation: threatPulse 2s infinite;
    }

    @keyframes threatPulse {
      0% { r: 5; opacity: 1; }
      100% { r: 20; opacity: 0; }
    }

    .view-all-btn {
      padding: 8px 16px;
      background: transparent;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      color: var(--primary-color);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .view-all-btn:hover {
      background: var(--primary-color);
      color: var(--bg-dark);
    }

    @media (prefers-reduced-motion: reduce) {
      .metric-card,
      .alert-item,
      .quick-action,
      .activity-item {
        transition: none;
      }
      
      .live-dot,
      .threat-pulse {
        animation: none;
      }
    }

    @media (max-width: 768px) {
      .metrics-row {
        grid-template-columns: 1fr 1fr;
      }
      
      .quick-actions {
        grid-template-columns: 1fr;
      }
      
      .chart-legend {
        grid-template-columns: 1fr;
      }
    }
  `;

  @state() private metrics: any = {};
  @state() private alerts: any[] = [];
  @state() private activities: any[] = [];
  @state() private chartData: number[] = [];

  connectedCallback() {
    super.connectedCallback();
    this.loadData();
  }

  private loadData() {
    this.metrics = {
      threats: { value: 127, trend: '+12%', direction: 'up', history: [30, 45, 38, 52, 48, 55, 62, 58, 65, 72, 68, 75] },
      vulnerabilities: { value: 43, trend: '-8%', direction: 'down', history: [65, 60, 58, 55, 52, 48, 45, 42, 44, 43, 41, 43] },
      compliance: { value: 94, trend: '+2%', direction: 'up', history: [85, 86, 88, 89, 90, 91, 91, 92, 93, 93, 94, 94] },
      mttd: { value: 2.4, trend: '-0.3d', direction: 'down', history: [3.2, 3.0, 2.9, 2.8, 2.7, 2.6, 2.5, 2.5, 2.4, 2.4, 2.3, 2.4] }
    };

    this.alerts = [
      {
        id: 1,
        severity: 'critical',
        title: 'Brute Force Attack Detected',
        description: 'Multiple failed login attempts from IP 192.168.1.105 targeting admin accounts',
        source: 'Firewall',
        time: '2 min ago'
      },
      {
        id: 2,
        severity: 'high',
        title: 'Suspicious PowerShell Activity',
        description: 'Encoded PowerShell command detected on workstation WS-045',
        source: 'EDR',
        time: '15 min ago'
      },
      {
        id: 3,
        severity: 'high',
        title: 'Data Exfiltration Attempt',
        description: 'Large data transfer to external IP detected from file server FS-01',
        source: 'DLP',
        time: '23 min ago'
      },
      {
        id: 4,
        severity: 'medium',
        title: 'SSL Certificate Expiring',
        description: 'Certificate for api.secuclaw.io expires in 14 days',
        source: 'Certificate Monitor',
        time: '1 hour ago'
      },
      {
        id: 5,
        severity: 'low',
        title: 'New Device Connected',
        description: 'Unknown device detected on guest network segment',
        source: 'Network Monitor',
        time: '2 hours ago'
      }
    ];

    this.activities = [
      { type: 'alert', icon: 'alert', text: '<strong>Malware blocked</strong> on workstation WS-023', time: '5 min ago' },
      { type: 'resolved', icon: 'resolved', text: '<strong>Incident INC-2024-042</strong> resolved - Phishing campaign contained', time: '32 min ago' },
      { type: 'info', icon: 'info', text: '<strong>Patch deployed</strong> to 47 servers - CVE-2024-0056 remediation', time: '1 hour ago' },
      { type: 'warning', icon: 'warning', text: '<strong>Vulnerability CVE-2024-21762</strong> escalated to critical', time: '2 hours ago' },
      { type: 'resolved', icon: 'resolved', text: '<strong>Firewall rule</strong> updated for new DMZ segment', time: '3 hours ago' },
      { type: 'alert', icon: 'alert', text: '<strong>Login anomaly</strong> detected for user john.doe@secuclaw.io', time: '4 hours ago' }
    ];

    this.chartData = [45, 32, 67, 23, 89, 34, 56, 78, 41, 92, 28, 65];
  }

  private renderMetricCard(metric: any, type: string, icon: string, label: string, color: string, rgb: string) {
    const maxVal = Math.max(...metric.history);
    const minVal = Math.min(...metric.history);
    
    return html`
      <div class="metric-card" style="--metric-color: ${color}; --metric-rgb: ${rgb}">
        <div class="metric-header">
          <div class="metric-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              ${icon === 'shield' ? html`<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>` : ''}
              ${icon === 'bug' ? html`<path d="M8 2l1.88 1.88M14.12 3.88L16 2M9 7.13v-1a3 3 0 116 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 014-4h4a4 4 0 014 4v3c0 3.3-2.7 6-6 6z"/><path d="M12 20v-9M6.53 9C4.6 8.8 3 7.1 3 5M6 13H2M6 17l-2 1M17.47 9c1.93-.2 3.53-1.9 3.53-4M18 13h4M18 17l2-1"/>` : ''}
              ${icon === 'check' ? html`<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>` : ''}
              ${icon === 'clock' ? html`<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>` : ''}
            </svg>
          </div>
          <span class="metric-trend ${metric.direction === 'up' ? (type === 'compliance' ? 'down' : 'up') : (type === 'compliance' ? 'up' : 'down')}">
            ${metric.trend}
          </span>
        </div>
        <div class="metric-value">${metric.value}${type === 'compliance' ? '%' : type === 'mttd' ? 'd' : ''}</div>
        <div class="metric-label">${label}</div>
        <div class="metric-chart">
          ${metric.history.map((val: number, i: number) => html`
            <div 
              class="chart-bar" 
              style="height: ${((val - minVal) / (maxVal - minVal)) * 100}%"
            ></div>
          `)}
        </div>
      </div>
    `;
  }

  private renderDonutChart() {
    const data = [
      { label: 'Critical', value: 12, color: 'var(--danger-color)' },
      { label: 'High', value: 28, color: 'var(--warning-color)' },
      { label: 'Medium', value: 45, color: 'var(--primary-color)' },
      { label: 'Low', value: 15, color: 'var(--success-color)' }
    ];
    
    const total = data.reduce((sum, d) => sum + d.value, 0);
    const circumference = 2 * Math.PI * 60;
    let offset = 0;
    
    return html`
      <div class="donut-chart">
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle class="donut-bg" cx="80" cy="80" r="60"/>
          ${data.map(d => {
            const percent = d.value / total;
            const dashLength = circumference * percent;
            const dashOffset = -offset;
            offset += dashLength;
            
            return html`
              <circle 
                class="donut-segment" 
                cx="80" 
                cy="80" 
                r="60"
                stroke="${d.color}"
                stroke-dasharray="${dashLength} ${circumference}"
                stroke-dashoffset="${dashOffset}"
              />
            `;
          })}
          <text x="80" y="75" text-anchor="middle" font-size="24" font-weight="700" fill="var(--text-primary)">${total}</text>
          <text x="80" y="92" text-anchor="middle" font-size="11" fill="var(--text-secondary)">Total</text>
        </svg>
      </div>
      <div class="chart-legend">
        ${data.map(d => html`
          <div class="legend-item">
            <span class="legend-dot ${d.label.toLowerCase()}"></span>
            <div class="legend-info">
              <div class="legend-label">${d.label}</div>
              <div class="legend-value">${d.value}</div>
            </div>
          </div>
        `)}
      </div>
    `;
  }

  private renderThreatMap() {
    const threats = [
      { x: 25, y: 30, size: 8, color: 'var(--danger-color)' },
      { x: 70, y: 20, size: 6, color: 'var(--warning-color)' },
      { x: 45, y: 60, size: 10, color: 'var(--danger-color)' },
      { x: 80, y: 55, size: 5, color: 'var(--primary-color)' },
      { x: 15, y: 70, size: 7, color: 'var(--warning-color)' },
      { x: 60, y: 80, size: 4, color: 'var(--success-color)' },
      { x: 35, y: 15, size: 6, color: 'var(--warning-color)' },
    ];

    return html`
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <!-- Grid lines -->
        <line x1="0" y1="50" x2="100" y2="50" stroke="var(--border-color)" stroke-width="0.2" stroke-dasharray="2"/>
        <line x1="50" y1="0" x2="50" y2="100" stroke="var(--border-color)" stroke-width="0.2" stroke-dasharray="2"/>
        
        <!-- Connection lines -->
        <path d="M 25 30 Q 35 45, 45 60" stroke="var(--danger-color)" stroke-width="0.3" fill="none" opacity="0.5"/>
        <path d="M 45 60 Q 55 50, 70 20" stroke="var(--warning-color)" stroke-width="0.3" fill="none" opacity="0.5"/>
        <path d="M 15 70 Q 30 65, 45 60" stroke="var(--warning-color)" stroke-width="0.3" fill="none" opacity="0.5"/>
        
        <!-- Threat nodes -->
        ${threats.map(t => html`
          <circle class="threat-pulse" cx="${t.x}" cy="${t.y}" r="${t.size}" fill="${t.color}" opacity="0.3"/>
          <circle cx="${t.x}" cy="${t.y}" r="${t.size * 0.5}" fill="${t.color}"/>
        `)}
        
        <!-- Center point (organization) -->
        <circle cx="50" cy="50" r="4" fill="var(--primary-color)"/>
        <circle cx="50" cy="50" r="2" fill="var(--bg-dark)"/>
      </svg>
    `;
  }

  render() {
    return html`
      <div class="dashboard" role="main" aria-label="Security Dashboard">
        <div class="dashboard-header">
          <div class="dashboard-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
            <div>
              <h1>Security Operations Center</h1>
              <div class="dashboard-subtitle">Real-time threat monitoring and incident management</div>
            </div>
          </div>
          <div class="header-actions">
            <div class="live-badge" role="status" aria-live="polite">
              <span class="live-dot"></span>
              Live Monitoring
            </div>
            <button class="btn btn-primary" aria-label="Create new incident">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              New Incident
            </button>
            <button class="btn" aria-label="Refresh dashboard">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 4v6h-6M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
              Refresh
            </button>
          </div>
        </div>

        <div class="metrics-row" role="list" aria-label="Security metrics">
          ${this.renderMetricCard(this.metrics.threats, 'threats', 'shield', 'Active Threats', 'var(--danger-color)', '239, 68, 68')}
          ${this.renderMetricCard(this.metrics.vulnerabilities, 'vulnerabilities', 'bug', 'Open Vulnerabilities', 'var(--warning-color)', '245, 158, 11')}
          ${this.renderMetricCard(this.metrics.compliance, 'compliance', 'check', 'Compliance Score', 'var(--success-color)', '16, 185, 129')}
          ${this.renderMetricCard(this.metrics.mttd, 'mttd', 'clock', 'Mean Time to Detect', 'var(--info-color)', '59, 130, 246')}
        </div>

        <div class="main-grid">
          <div class="left-column">
            <div class="card">
              <div class="card-header">
                <span class="card-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    <path d="M12 9v4M12 17h.01"/>
                  </svg>
                  Recent Alerts
                </span>
                <button class="view-all-btn">View All</button>
              </div>
              <div class="card-body">
                <div class="alert-list" role="list" aria-label="Security alerts">
                  ${this.alerts.map(alert => html`
                    <div class="alert-item ${alert.severity}" role="listitem">
                      <div class="alert-icon ${alert.severity}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                          <path d="M12 9v4M12 17h.01"/>
                        </svg>
                      </div>
                      <div class="alert-content">
                        <div class="alert-title">${alert.title}</div>
                        <div class="alert-description">${alert.description}</div>
                        <div class="alert-meta">
                          <span>${alert.source}</span>
                          <span class="alert-time">${alert.time}</span>
                        </div>
                      </div>
                    </div>
                  `)}
                </div>
              </div>
            </div>

            <div class="card" style="margin-top: 24px;">
              <div class="card-header">
                <span class="card-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
                  </svg>
                  Threat Intelligence Map
                </span>
              </div>
              <div class="threat-map" role="img" aria-label="Geographic threat map showing attack sources">
                ${this.renderThreatMap()}
              </div>
            </div>
          </div>

          <div class="right-column">
            <div class="card">
              <div class="card-header">
                <span class="card-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  Vulnerability Severity
                </span>
              </div>
              <div class="severity-chart">
                ${this.renderDonutChart()}
              </div>
            </div>

            <div class="card" style="margin-top: 24px;">
              <div class="card-header">
                <span class="card-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                  Recent Activity
                </span>
              </div>
              <div class="activity-feed" role="log" aria-label="Recent security activities">
                ${this.activities.map(activity => html`
                  <div class="activity-item">
                    <div class="activity-icon ${activity.type}">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        ${activity.icon === 'alert' ? html`<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4"/>` : ''}
                        ${activity.icon === 'resolved' ? html`<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>` : ''}
                        ${activity.icon === 'info' ? html`<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>` : ''}
                        ${activity.icon === 'warning' ? html`<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>` : ''}
                      </svg>
                    </div>
                    <div class="activity-content">
                      <div class="activity-text" .innerHTML="${activity.text}"></div>
                      <div class="activity-time">${activity.time}</div>
                    </div>
                  </div>
                `)}
              </div>
            </div>

            <div class="card" style="margin-top: 24px;">
              <div class="card-header">
                <span class="card-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M9 9h6M9 15h6M9 12h6"/>
                  </svg>
                  Quick Actions
                </span>
              </div>
              <div class="quick-actions">
                <button class="quick-action" aria-label="Scan for vulnerabilities">
                  <div class="quick-action-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="M21 21l-4.35-4.35"/>
                    </svg>
                  </div>
                  <span class="quick-action-label">Run Scan</span>
                </button>
                <button class="quick-action" aria-label="View incident reports">
                  <div class="quick-action-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                    </svg>
                  </div>
                  <span class="quick-action-label">Reports</span>
                </button>
                <button class="quick-action" aria-label="Block IP address">
                  <div class="quick-action-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M4.93 4.93l14.14 14.14"/>
                    </svg>
                  </div>
                  <span class="quick-action-label">Block IP</span>
                </button>
                <button class="quick-action" aria-label="Isolate endpoint">
                  <div class="quick-action-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <path d="M9 9h6v6H9z"/>
                    </svg>
                  </div>
                  <span class="quick-action-label">Isolate</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-security-dashboard': ScSecurityDashboard;
  }
}
