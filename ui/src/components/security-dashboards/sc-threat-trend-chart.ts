import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

/**
 * Threat Trend Chart - SVG-based visualization for security trends
 * @element sc-threat-trend-chart
 */
@customElement('sc-threat-trend-chart')
export class ScThreatTrendChart extends LitElement {
  static styles = css`
    :host {
      display: block;
      --primary: #00ff88;
      --secondary: #00aaff;
      --danger: #ff4444;
      --warning: #ffaa00;
      --bg-dark: #0a0e17;
      --bg-card: #141b26;
      --text-primary: #ffffff;
      --text-secondary: #8899aa;
      --border: #2a3a4a;
    }

    .chart-wrapper {
      width: 100%;
      height: 100%;
      min-height: 250px;
      position: relative;
    }

    .chart-svg {
      width: 100%;
      height: 100%;
    }

    .grid-line {
      stroke: var(--border);
      stroke-width: 1;
      stroke-dasharray: 4, 4;
    }

    .axis-label {
      fill: var(--text-secondary);
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
    }

    .chart-line {
      fill: none;
      stroke-width: 2.5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .line-malware { stroke: var(--danger); }
    .line-phishing { stroke: var(--warning); }
    .line-ddos { stroke: var(--secondary); }
    .line-intrusion { stroke: var(--primary); }

    .chart-area {
      opacity: 0.15;
    }

    .area-malware { fill: var(--danger); }
    .area-phishing { fill: var(--warning); }
    .area-ddos { fill: var(--secondary); }
    .area-intrusion { fill: var(--primary); }

    .data-point {
      cursor: pointer;
      transition: r 0.2s ease;
    }

    .data-point:hover {
      r: 6;
    }

    .tooltip {
      position: absolute;
      background: var(--bg-card);
      border: 1px solid var(--primary);
      border-radius: 8px;
      padding: 12px;
      pointer-events: none;
      z-index: 100;
      box-shadow: 0 4px 20px rgba(0, 255, 136, 0.2);
      min-width: 160px;
    }

    .tooltip-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--primary);
      margin-bottom: 8px;
    }

    .tooltip-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin: 4px 0;
    }

    .tooltip-label { color: var(--text-secondary); }
    .tooltip-value { color: var(--text-primary); font-weight: 600; }

    .legend-container {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin-top: 16px;
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .legend-item:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .legend-dot.malware { background: var(--danger); }
    .legend-dot.phishing { background: var(--warning); }
    .legend-dot.ddos { background: var(--secondary); }
    .legend-dot.intrusion { background: var(--primary); }

    .legend-text {
      font-size: 12px;
      color: var(--text-secondary);
    }

    .period-selector {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      justify-content: flex-end;
    }

    .period-btn {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text-secondary);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .period-btn:hover {
      border-color: var(--primary);
      color: var(--primary);
    }

    .period-btn.active {
      background: var(--primary);
      color: var(--bg-dark);
      border-color: var(--primary);
    }

    .total-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      padding: 8px 14px;
      border-radius: 8px;
    }

    .total-label {
      font-size: 10px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .total-value {
      font-size: 18px;
      font-weight: 700;
      color: var(--primary);
    }
  `;

  @property({ type: String }) period = '7d';
  @state() private tooltipData: { x: number; y: number; data: any } | null = null;
  @state() private visibleLines = { malware: true, phishing: true, ddos: true, intrusion: true };

  private generateData() {
    const days = this.period === '24h' ? 24 : this.period === '7d' ? 7 : 30;
    const labels = this.period === '24h' 
      ? Array.from({ length: 24 }, (_, i) => `${i}:00`)
      : this.period === '7d' 
        ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        : Array.from({ length: 30 }, (_, i) => `${i + 1}`);

    const generatePoints = (base: number, variance: number) =>
      labels.map(() => Math.floor(base + Math.random() * variance - variance / 2));

    return {
      labels,
      malware: generatePoints(45, 30),
      phishing: generatePoints(35, 25),
      ddos: generatePoints(20, 15),
      intrusion: generatePoints(55, 35),
    };
  }

  private getChartPath(points: number[], width: number, height: number, padding: number) {
    const max = Math.max(...points, 1);
    const min = Math.min(...points);
    const range = max - min || 1;
    
    const xStep = (width - padding * 2) / (points.length - 1);
    
    return points.map((val, i) => {
      const x = padding + i * xStep;
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }

  private getAreaPath(points: number[], width: number, height: number, padding: number) {
    const linePath = this.getChartPath(points, width, height, padding);
    const lastX = padding + (points.length - 1) * ((width - padding * 2) / (points.length - 1));
    const firstX = padding;
    return `${linePath} L ${lastX} ${height - padding} L ${firstX} ${height - padding} Z`;
  }

  private toggleLine(line: keyof typeof this.visibleLines) {
    this.visibleLines = { ...this.visibleLines, [line]: !this.visibleLines[line] };
  }

  private handleDataPointHover(e: MouseEvent, label: string, data: any) {
    const rect = (e.target as SVGElement).closest('svg')?.getBoundingClientRect();
    if (rect) {
      this.tooltipData = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        data: { label, ...data }
      };
    }
  }

  private hideTooltip() {
    this.tooltipData = null;
  }

  render() {
    const data = this.generateData();
    const width = 800;
    const height = 250;
    const padding = 40;

    const totals = {
      malware: data.malware.reduce((a, b) => a + b, 0),
      phishing: data.phishing.reduce((a, b) => a + b, 0),
      ddos: data.ddos.reduce((a, b) => a + b, 0),
      intrusion: data.intrusion.reduce((a, b) => a + b, 0),
    };

    return html`
      <div class="chart-wrapper" role="img" aria-label="Threat trend visualization chart">
        <div class="period-selector">
          <button class="period-btn ${this.period === '24h' ? 'active' : ''}" @click=${() => this.period = '24h'}>24H</button>
          <button class="period-btn ${this.period === '7d' ? 'active' : ''}" @click=${() => this.period = '7d'}>7D</button>
          <button class="period-btn ${this.period === '30d' ? 'active' : ''}" @click=${() => this.period = '30d'}>30D</button>
        </div>

        <svg class="chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
          <!-- Grid lines -->
          ${[0, 1, 2, 3, 4].map(i => html`
            <line class="grid-line" 
              x1="${padding}" y1="${padding + i * ((height - padding * 2) / 4)}" 
              x2="${width - padding}" y2="${padding + i * ((height - padding * 2) / 4)}" />
          `)}

          <!-- Y-axis labels -->
          <text class="axis-label" x="${padding - 10}" y="${padding + 4}" text-anchor="end">100</text>
          <text class="axis-label" x="${padding - 10}" y="${height - padding + 4}" text-anchor="end">0</text>

          <!-- X-axis labels -->
          ${data.labels.filter((_, i) => this.period === '24h' ? i % 4 === 0 : true).map((label, i, arr) => html`
            <text class="axis-label" 
              x="${padding + i * (arr.length > 1 ? (width - padding * 2) / (arr.length - 1) : 0)}" 
              y="${height - 10}" text-anchor="middle">${label}</text>
          `)}

          <!-- Area fills -->
          ${this.visibleLines.ddos ? html`
            <path class="chart-area area-ddos" d="${this.getAreaPath(data.ddos, width, height, padding)}" />
          ` : ''}
          ${this.visibleLines.intrusion ? html`
            <path class="chart-area area-intrusion" d="${this.getAreaPath(data.intrusion, width, height, padding)}" />
          ` : ''}
          ${this.visibleLines.phishing ? html`
            <path class="chart-area area-phishing" d="${this.getAreaPath(data.phishing, width, height, padding)}" />
          ` : ''}
          ${this.visibleLines.malware ? html`
            <path class="chart-area area-malware" d="${this.getAreaPath(data.malware, width, height, padding)}" />
          ` : ''}

          <!-- Lines -->
          ${this.visibleLines.malware ? html`
            <path class="chart-line line-malware" d="${this.getChartPath(data.malware, width, height, padding)}" />
          ` : ''}
          ${this.visibleLines.phishing ? html`
            <path class="chart-line line-phishing" d="${this.getChartPath(data.phishing, width, height, padding)}" />
          ` : ''}
          ${this.visibleLines.ddos ? html`
            <path class="chart-line line-ddos" d="${this.getChartPath(data.ddos, width, height, padding)}" />
          ` : ''}
          ${this.visibleLines.intrusion ? html`
            <path class="chart-line line-intrusion" d="${this.getChartPath(data.intrusion, width, height, padding)}" />
          ` : ''}

          <!-- Data points (sample) -->
          ${this.visibleLines.malware ? data.malware.filter((_, i) => i % Math.ceil(data.malware.length / 7) === 0).map((val, i, arr) => {
            const xStep = (width - padding * 2) / (data.malware.length - 1);
            const max = Math.max(...data.malware);
            const min = Math.min(...data.malware);
            const x = padding + i * 7 * xStep;
            const y = height - padding - ((val - min) / (max - min || 1)) * (height - padding * 2);
            return html`<circle class="data-point" cx="${x}" cy="${y}" r="4" fill="var(--danger)" 
              @mouseenter=${(e: MouseEvent) => this.handleDataPointHover(e, data.labels[i * 7], { malware: val })} 
              @mouseleave=${this.hideTooltip} />`;
          }) : ''}
        </svg>

        ${this.tooltipData ? html`
          <div class="tooltip" style="left: ${this.tooltipData.x + 10}px; top: ${this.tooltipData.y - 10}px;">
            <div class="tooltip-title">${this.tooltipData.data.label}</div>
            ${Object.entries(this.tooltipData.data).filter(([k]) => k !== 'label').map(([key, val]) => html`
              <div class="tooltip-row">
                <span class="tooltip-label">${key}:</span>
                <span class="tooltip-value">${val}</span>
              </div>
            `)}
          </div>
        ` : ''}

        <div class="total-badge" aria-label="Total threats detected">
          <div class="total-label">Total Threats</div>
          <div class="total-value">${totals.malware + totals.phishing + totals.ddos + totals.intrusion}</div>
        </div>

        <div class="legend-container" role="group" aria-label="Chart legend">
          <div class="legend-item" role="button" tabindex="0" @click=${() => this.toggleLine('malware')}>
            <span class="legend-dot malware"></span>
            <span class="legend-text">Malware (${totals.malware})</span>
          </div>
          <div class="legend-item" role="button" tabindex="0" @click=${() => this.toggleLine('phishing')}>
            <span class="legend-dot phishing"></span>
            <span class="legend-text">Phishing (${totals.phishing})</span>
          </div>
          <div class="legend-item" role="button" tabindex="0" @click=${() => this.toggleLine('ddos')}>
            <span class="legend-dot ddos"></span>
            <span class="legend-text">DDoS (${totals.ddos})</span>
          </div>
          <div class="legend-item" role="button" tabindex="0" @click=${() => this.toggleLine('intrusion')}>
            <span class="legend-dot intrusion"></span>
            <span class="legend-text">Intrusion (${totals.intrusion})</span>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-threat-trend-chart': ScThreatTrendChart;
  }
}
