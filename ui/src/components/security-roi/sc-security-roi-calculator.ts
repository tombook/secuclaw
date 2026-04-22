import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

/**
 * Security ROI Calculator Component
 * @element sc-security-roi-calculator
 */
@customElement('sc-security-roi-calculator')
export class ScSecurityRoiCalculator extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      --primary: #00ff88;
      --secondary: #00aaff;
      --danger: #ff4444;
      --warning: #ffaa00;
      --bg-dark: #0d1117;
      --bg-card: #161b22;
      --bg-hover: #21262d;
      --text-primary: #f0f6fc;
      --text-secondary: #8b949e;
      --border-color: #30363d;
    }

    * {
      box-sizing: border-box;
    }

    .container {
      background: var(--bg-card);
      border-radius: 12px;
      border: 1px solid var(--border-color);
      overflow: hidden;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-color);
      background: linear-gradient(180deg, rgba(0,255,136,0.05) 0%, transparent 100%);
    }

    .header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .header h2::before {
      content: '';
      width: 4px;
      height: 20px;
      background: var(--primary);
      border-radius: 2px;
    }

    .main-content {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 24px;
      padding: 24px;
    }

    .calculator-panel {
      background: var(--bg-dark);
      border-radius: 12px;
      border: 1px solid var(--border-color);
      padding: 24px;
    }

    .panel-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .panel-title svg {
      color: var(--primary);
    }

    .input-group {
      margin-bottom: 20px;
    }

    .input-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .input-label span {
      font-size: 14px;
      color: var(--text-primary);
      font-weight: 500;
    }

    .input-hint {
      font-size: 12px;
      color: var(--text-secondary);
    }

    .input-wrapper {
      position: relative;
    }

    .currency-input {
      width: 100%;
      padding: 12px 16px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      color: var(--text-primary);
      font-size: 16px;
      font-weight: 600;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .currency-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(0,255,136,0.1);
    }

    .currency-input::placeholder {
      color: var(--text-secondary);
      font-weight: 400;
    }

    .input-prefix {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-secondary);
      font-size: 16px;
      pointer-events: none;
    }

    .input-wrapper .currency-input {
      padding-left: 32px;
    }

    .slider-group {
      margin-bottom: 24px;
    }

    .slider-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .slider-header span {
      font-size: 14px;
      color: var(--text-primary);
      font-weight: 500;
    }

    .slider-value {
      font-size: 14px;
      font-weight: 600;
      color: var(--primary);
      background: rgba(0,255,136,0.1);
      padding: 4px 12px;
      border-radius: 4px;
    }

    .slider {
      width: 100%;
      height: 8px;
      border-radius: 4px;
      background: var(--bg-hover);
      outline: none;
      -webkit-appearance: none;
      appearance: none;
      cursor: pointer;
    }

    .slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--primary);
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,255,136,0.3);
      transition: transform 0.2s;
    }

    .slider::-webkit-slider-thumb:hover {
      transform: scale(1.1);
    }

    .slider::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--primary);
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 8px rgba(0,255,136,0.3);
    }

    .result-panel {
      background: var(--bg-dark);
      border-radius: 12px;
      border: 1px solid var(--border-color);
      padding: 24px;
    }

    .roi-highlight {
      text-align: center;
      padding: 24px;
      background: linear-gradient(135deg, rgba(0,255,136,0.1) 0%, rgba(0,170,255,0.1) 100%);
      border-radius: 12px;
      margin-bottom: 20px;
      border: 1px solid rgba(0,255,136,0.2);
    }

    .roi-label {
      font-size: 14px;
      color: var(--text-secondary);
      margin-bottom: 8px;
    }

    .roi-value {
      font-size: 48px;
      font-weight: 700;
      color: var(--primary);
      text-shadow: 0 0 20px rgba(0,255,136,0.3);
    }

    .roi-period {
      font-size: 16px;
      color: var(--text-secondary);
      margin-top: 8px;
    }

    .breakdown {
      margin-bottom: 20px;
    }

    .breakdown-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid var(--border-color);
    }

    .breakdown-item:last-child {
      border-bottom: none;
    }

    .breakdown-label {
      font-size: 14px;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .breakdown-label .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .breakdown-value {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .breakdown-value.positive {
      color: var(--primary);
    }

    .breakdown-value.negative {
      color: var(--danger);
    }

    .benefits-section {
      margin-top: 24px;
    }

    .benefits-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 16px;
    }

    .benefit-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      background: var(--bg-card);
      border-radius: 8px;
      margin-bottom: 8px;
    }

    .benefit-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .benefit-icon svg {
      width: 18px;
      height: 18px;
    }

    .benefit-icon.green {
      background: rgba(0,255,136,0.15);
      color: var(--primary);
    }

    .benefit-icon.blue {
      background: rgba(0,170,255,0.15);
      color: var(--secondary);
    }

    .benefit-icon.yellow {
      background: rgba(255,170,0,0.15);
      color: var(--warning);
    }

    .benefit-content h4 {
      margin: 0 0 4px;
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .benefit-content p {
      margin: 0;
      font-size: 12px;
      color: var(--text-secondary);
      line-height: 1.4;
    }

    .action-buttons {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }

    .btn {
      flex: 1;
      padding: 12px 18px;
      border-radius: 8px;
      border: none;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .btn-primary {
      background: var(--primary);
      color: #000;
    }

    .btn-primary:hover {
      background: #00dd77;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,255,136,0.3);
    }

    .btn-secondary {
      background: var(--bg-hover);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
    }

    .btn-secondary:hover {
      border-color: var(--primary);
      background: rgba(0,255,136,0.1);
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .summary-card {
      background: var(--bg-dark);
      border-radius: 12px;
      border: 1px solid var(--border-color);
      padding: 20px;
      text-align: center;
    }

    .summary-card h3 {
      margin: 0 0 8px;
      font-size: 13px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .summary-card .value {
      font-size: 24px;
      font-weight: 700;
    }

    .summary-card .value.green { color: var(--primary); }
    .summary-card .value.blue { color: var(--secondary); }
    .summary-card .value.red { color: var(--danger); }

    .comparison-chart {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid var(--border-color);
    }

    .chart-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 16px;
    }

    .chart-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .chart-label {
      width: 100px;
      font-size: 13px;
      color: var(--text-secondary);
      text-align: right;
    }

    .chart-track {
      flex: 1;
      height: 24px;
      background: var(--bg-hover);
      border-radius: 4px;
      overflow: hidden;
    }

    .chart-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    .chart-fill.before {
      background: linear-gradient(90deg, var(--danger), #ff6666);
    }

    .chart-fill.after {
      background: linear-gradient(90deg, var(--primary), #33ff99);
    }

    .chart-value {
      width: 80px;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
    }

    @media (max-width: 1024px) {
      .main-content {
        grid-template-columns: 1fr;
      }

      .summary-cards {
        grid-template-columns: 1fr;
      }
    }

    .btn:focus-visible,
    .slider:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `;

  @state() private securityInvestment = 150000;
  @state() private annualBreachCost = 500000;
  @state() private riskReduction = 65;
  @state() private implementationCost = 75000;
  @state() private maintenanceCost = 25000;

  @property({ type: String }) accessiblename = 'Security ROI Calculator Dashboard';

  private get netSavings() {
    const annualSavings = this.annualBreachCost * (this.riskReduction / 100);
    const annualCosts = this.maintenanceCost;
    return Math.round(annualSavings - annualCosts);
  }

  private get totalInvestment() {
    return this.securityInvestment + this.implementationCost;
  }

  private get roi() {
    const netSavings = this.netSavings;
    const investment = this.totalInvestment;
    if (investment === 0) return 0;
    return Math.round(((netSavings - investment) / investment) * 100);
  }

  private get paybackPeriod() {
    const annualSavings = this.annualBreachCost * (this.riskReduction / 100);
    if (annualSavings === 0) return 0;
    return Math.round((this.totalInvestment / annualSavings) * 12);
  }

  private get fiveYearROI() {
    const annualNet = this.netSavings;
    return Math.round(annualNet * 5 - this.totalInvestment);
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  private getBenefitsData() {
    return [
      {
        icon: 'check',
        iconClass: 'green',
        title: 'Reduced Breach Costs',
        description: 'Lower financial impact from security incidents through proactive prevention'
      },
      {
        icon: 'shield',
        iconClass: 'blue',
        title: 'Operational Efficiency',
        description: 'Streamlined security workflows and automated compliance reporting'
      },
      {
        icon: 'trending',
        iconClass: 'green',
        title: 'Insurance Benefits',
        description: 'Potential reduction in cyber insurance premiums'
      },
      {
        icon: 'users',
        iconClass: 'blue',
        title: 'Talent Retention',
        description: 'Better security posture attracts and retains security professionals'
      },
      {
        icon: 'star',
        iconClass: 'yellow',
        title: 'Compliance Savings',
        description: 'Avoided penalties and reduced audit costs'
      }
    ];
  }

  renderIcon(icon: string) {
    const icons: Record<string, any> = {
      check: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
      shield: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
      trending: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
      users: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      star: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
      calculator: html`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10.01"/><line x1="12" y1="10" x2="12" y2="10.01"/><line x1="16" y1="10" x2="16" y2="10.01"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="12" y1="14" x2="12" y2="14.01"/><line x1="16" y1="14" x2="16" y2="14.01"/><line x1="8" y1="18" x2="16" y2="18"/></svg>`,
      report: html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`
    };
    return icons[icon] || icons.check;
  }

  render() {
    const benefits = this.getBenefitsData();

    return html`
      <div 
        class="container" 
        role="region" 
        aria-label="${this.accessiblename}"
        aria-describedby="roi-desc"
      >
        <span id="roi-desc" class="sr-only">
          Calculate return on investment for security initiatives
        </span>

        <div class="header">
          <h2>Security ROI Calculator</h2>
          <div class="action-buttons" style="margin-top: 0; flex: none;">
            <button class="btn btn-secondary" aria-label="Generate ROI report">
              ${this.renderIcon('report')}
              Generate Report
            </button>
          </div>
        </div>

        <div class="main-content">
          <div class="calculator-panel">
            <div class="panel-title">
              ${this.renderIcon('calculator')}
              Investment Inputs
            </div>

            <div class="input-group">
              <div class="input-label">
                <span>Current Annual Breach Cost</span>
                <span class="input-hint">Average cost of security incidents</span>
              </div>
              <div class="input-wrapper">
                <span class="input-prefix">$</span>
                <input 
                  type="text" 
                  class="currency-input"
                  .value="${this.formatCurrency(this.annualBreachCost)}"
                  @input="${(e: Event) => {
                    const val = (e.target as HTMLInputElement).value.replace(/[^0-9]/g, '');
                    this.annualBreachCost = parseInt(val) || 0;
                  }}"
                  aria-label="Current annual breach cost in dollars"
                />
              </div>
            </div>

            <div class="input-group">
              <div class="input-label">
                <span>Security Investment</span>
                <span class="input-hint">Initial capital expenditure</span>
              </div>
              <div class="input-wrapper">
                <span class="input-prefix">$</span>
                <input 
                  type="text" 
                  class="currency-input"
                  .value="${this.formatCurrency(this.securityInvestment)}"
                  @input="${(e: Event) => {
                    const val = (e.target as HTMLInputElement).value.replace(/[^0-9]/g, '');
                    this.securityInvestment = parseInt(val) || 0;
                  }}"
                  aria-label="Security investment in dollars"
                />
              </div>
            </div>

            <div class="input-group">
              <div class="input-label">
                <span>Implementation Cost</span>
                <span class="input-hint">One-time setup and deployment</span>
              </div>
              <div class="input-wrapper">
                <span class="input-prefix">$</span>
                <input 
                  type="text" 
                  class="currency-input"
                  .value="${this.formatCurrency(this.implementationCost)}"
                  @input="${(e: Event) => {
                    const val = (e.target as HTMLInputElement).value.replace(/[^0-9]/g, '');
                    this.implementationCost = parseInt(val) || 0;
                  }}"
                  aria-label="Implementation cost in dollars"
                />
              </div>
            </div>

            <div class="input-group">
              <div class="input-label">
                <span>Annual Maintenance Cost</span>
                <span class="input-hint">Yearly operational expenses</span>
              </div>
              <div class="input-wrapper">
                <span class="input-prefix">$</span>
                <input 
                  type="text" 
                  class="currency-input"
                  .value="${this.formatCurrency(this.maintenanceCost)}"
                  @input="${(e: Event) => {
                    const val = (e.target as HTMLInputElement).value.replace(/[^0-9]/g, '');
                    this.maintenanceCost = parseInt(val) || 0;
                  }}"
                  aria-label="Annual maintenance cost in dollars"
                />
              </div>
            </div>

            <div class="slider-group">
              <div class="slider-header">
                <span>Expected Risk Reduction</span>
                <span class="slider-value">${this.riskReduction}%</span>
              </div>
              <input 
                type="range" 
                class="slider" 
                min="0" 
                max="100" 
                .value="${this.riskReduction}"
                @input="${(e: Event) => this.riskReduction = parseInt((e.target as HTMLInputElement).value)}"
                aria-label="Expected risk reduction percentage"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow="${this.riskReduction}"
              />
            </div>
          </div>

          <div class="result-panel">
            <div class="roi-highlight">
              <div class="roi-label">Return on Investment</div>
              <div class="roi-value">${this.roi}%</div>
              <div class="roi-period">Payback in ${this.paybackPeriod} months</div>
            </div>

            <div class="breakdown">
              <div class="breakdown-item">
                <span class="breakdown-label">
                  <span class="dot" style="background: var(--warning);"></span>
                  Total Investment
                </span>
                <span class="breakdown-value negative">${this.formatCurrency(this.totalInvestment)}</span>
              </div>
              <div class="breakdown-item">
                <span class="breakdown-label">
                  <span class="dot" style="background: var(--primary);"></span>
                  Annual Risk Savings
                </span>
                <span class="breakdown-value positive">${this.formatCurrency(Math.round(this.annualBreachCost * (this.riskReduction / 100)))}</span>
              </div>
              <div class="breakdown-item">
                <span class="breakdown-label">
                  <span class="dot" style="background: var(--danger);"></span>
                  Annual Maintenance
                </span>
                <span class="breakdown-value negative">${this.formatCurrency(this.maintenanceCost)}</span>
              </div>
              <div class="breakdown-item">
                <span class="breakdown-label">
                  <span class="dot" style="background: var(--secondary);"></span>
                  Net Annual Benefit
                </span>
                <span class="breakdown-value positive">${this.formatCurrency(this.netSavings)}</span>
              </div>
              <div class="breakdown-item">
                <span class="breakdown-label">
                  <span class="dot" style="background: var(--primary);"></span>
                  5-Year Total ROI
                </span>
                <span class="breakdown-value positive">${this.formatCurrency(this.fiveYearROI)}</span>
              </div>
            </div>

            <div class="summary-cards">
              <div class="summary-card">
                <h3>Cost Avoidance</h3>
                <div class="value green">${this.formatCurrency(Math.round(this.annualBreachCost * (this.riskReduction / 100) * 5))}</div>
              </div>
              <div class="summary-card">
                <h3>Efficiency Gains</h3>
                <div class="value blue">+35%</div>
              </div>
              <div class="summary-card">
                <h3>Risk Coverage</h3>
                <div class="value green">${this.riskReduction}%</div>
              </div>
            </div>

            <div class="comparison-chart">
              <div class="chart-title">Risk Reduction Impact</div>
              <div class="chart-bar">
                <span class="chart-label">Without</span>
                <div class="chart-track">
                  <div class="chart-fill before" style="width: 100%;"></div>
                </div>
                <span class="chart-value">${this.formatCurrency(this.annualBreachCost)}</span>
              </div>
              <div class="chart-bar">
                <span class="chart-label">With Security</span>
                <div class="chart-track">
                  <div class="chart-fill after" style="width: ${100 - this.riskReduction}%;"></div>
                </div>
                <span class="chart-value">${this.formatCurrency(Math.round(this.annualBreachCost * (1 - this.riskReduction / 100)))}</span>
              </div>
            </div>
          </div>
        </div>

        <div style="padding: 0 24px 24px;">
          <div class="benefits-section">
            <div class="benefits-title">Key Benefits Included in Calculation</div>
            ${benefits.map(benefit => html`
              <div class="benefit-item">
                <div class="benefit-icon ${benefit.iconClass}">
                  ${this.renderIcon(benefit.icon)}
                </div>
                <div class="benefit-content">
                  <h4>${benefit.title}</h4>
                  <p>${benefit.description}</p>
                </div>
              </div>
            `)}
          </div>

          <div class="action-buttons">
            <button class="btn btn-primary">
              Save Calculation
            </button>
            <button class="btn btn-secondary">
              Export PDF
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-security-roi-calculator': ScSecurityRoiCalculator;
  }
}
