import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

/**
 * Incident Timeline Visualization Component
 * Provides chronological timeline view with event markers, phases, and correlation links
 */
@customElement('sc-incident-timeline')
export class ScIncidentTimeline extends LitElement {
  static styles = css`
    :host {
      --timeline-bg: #0d1117;
      --timeline-surface: #161b22;
      --timeline-border: #30363d;
      --timeline-text: #e6edf3;
      --timeline-muted: #7d8590;
      --timeline-accent: #58a6ff;
      --timeline-detection: #f85149;
      --timeline-analysis: #f0883e;
      --timeline-containment: #a371f7;
      --timeline-eradication: #8957e5;
      --timeline-recovery: #3fb950;
      --timeline-width: 100%;
      --timeline-height: 500px;
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    :host([light-mode]) {
      --timeline-bg: #ffffff;
      --timeline-surface: #f6f8fa;
      --timeline-border: #d0d7de;
      --timeline-text: #1f2328;
      --timeline-muted: #656d76;
      --timeline-accent: #0969da;
    }

    .timeline-container {
      background: var(--timeline-bg);
      color: var(--timeline-text);
      border-radius: 8px;
      border: 1px solid var(--timeline-border);
      height: var(--timeline-height);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid var(--timeline-border);
      background: var(--timeline-surface);
    }

    .timeline-title {
      font-size: 14px;
      font-weight: 600;
      margin: 0;
    }

    .zoom-controls {
      display: flex;
      gap: 4px;
    }

    .zoom-btn {
      padding: 6px 12px;
      border: 1px solid var(--timeline-border);
      background: var(--timeline-surface);
      color: var(--timeline-text);
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s;
    }

    .zoom-btn:hover {
      background: var(--timeline-accent);
      color: white;
      border-color: var(--timeline-accent);
    }

    .zoom-btn.active {
      background: var(--timeline-accent);
      color: white;
      border-color: var(--timeline-accent);
    }

    .timeline-body {
      flex: 1;
      display: flex;
      overflow: hidden;
    }

    .timeline-track {
      flex: 1;
      position: relative;
      overflow-x: auto;
      overflow-y: hidden;
    }

    .timeline-axis {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 40px;
      background: var(--timeline-surface);
      border-bottom: 1px solid var(--timeline-border);
      display: flex;
      align-items: center;
      padding: 0 16px;
    }

    .time-marker {
      position: absolute;
      font-size: 10px;
      color: var(--timeline-muted);
      transform: translateX(-50%);
    }

    .timeline-phases {
      position: absolute;
      top: 40px;
      left: 0;
      right: 0;
      height: 60px;
      display: flex;
    }

    .phase-segment {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 500;
      color: white;
      cursor: pointer;
      transition: filter 0.2s;
      position: relative;
    }

    .phase-segment:hover {
      filter: brightness(1.2);
    }

    .phase-detection { background: var(--timeline-detection); }
    .phase-analysis { background: var(--timeline-analysis); }
    .phase-containment { background: var(--timeline-containment); }
    .phase-eradication { background: var(--timeline-eradication); }
    .phase-recovery { background: var(--timeline-recovery); }

    .events-layer {
      position: absolute;
      top: 110px;
      left: 0;
      right: 0;
      bottom: 0;
      overflow-y: auto;
    }

    .event-marker {
      position: absolute;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      border: 2px solid var(--timeline-bg);
    }

    .event-marker:hover {
      transform: scale(1.5);
      box-shadow: 0 0 8px rgba(88, 166, 255, 0.6);
    }

    .event-marker.selected {
      transform: scale(1.5);
      box-shadow: 0 0 12px rgba(88, 166, 255, 0.8);
    }

    .correlation-line {
      position: absolute;
      height: 2px;
      background: var(--timeline-accent);
      opacity: 0.5;
      transform-origin: left center;
      pointer-events: none;
    }

    .event-tooltip {
      position: absolute;
      background: var(--timeline-surface);
      border: 1px solid var(--timeline-border);
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 12px;
      z-index: 100;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      pointer-events: none;
      max-width: 250px;
    }

    .event-tooltip::before {
      content: '';
      position: absolute;
      top: -6px;
      left: 12px;
      width: 10px;
      height: 10px;
      background: var(--timeline-surface);
      border-left: 1px solid var(--timeline-border);
      border-top: 1px solid var(--timeline-border);
      transform: rotate(45deg);
    }

    .details-panel {
      width: 320px;
      border-left: 1px solid var(--timeline-border);
      background: var(--timeline-surface);
      padding: 16px;
      overflow-y: auto;
      display: none;
    }

    .details-panel.visible {
      display: block;
    }

    .details-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .details-title {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      color: var(--timeline-muted);
      cursor: pointer;
      font-size: 18px;
      padding: 4px;
    }

    .close-btn:hover {
      color: var(--timeline-text);
    }

    .detail-group {
      margin-bottom: 16px;
    }

    .detail-label {
      font-size: 11px;
      color: var(--timeline-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .detail-value {
      font-size: 14px;
    }

    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
    }

    .status-open { background: #f8514922; color: var(--timeline-detection); }
    .status-investigating { background: #f0883e22; color: var(--timeline-analysis); }
    .status-contained { background: #a371f722; color: var(--timeline-containment); }
    .status-resolved { background: #3fb95022; color: var(--timeline-recovery); }

    .related-links {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }

    .related-link {
      padding: 4px 8px;
      background: var(--timeline-bg);
      border: 1px solid var(--timeline-border);
      border-radius: 4px;
      font-size: 11px;
      color: var(--timeline-accent);
      cursor: pointer;
      text-decoration: none;
    }

    .related-link:hover {
      background: var(--timeline-accent);
      color: white;
    }

    .timeline-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      border-top: 1px solid var(--timeline-border);
      background: var(--timeline-surface);
    }

    .export-controls {
      display: flex;
      gap: 8px;
    }

    .export-btn {
      padding: 6px 12px;
      border: 1px solid var(--timeline-border);
      background: var(--timeline-bg);
      color: var(--timeline-text);
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s;
    }

    .export-btn:hover {
      background: var(--timeline-accent);
      color: white;
      border-color: var(--timeline-accent);
    }

    .timeline-legend {
      display: flex;
      gap: 16px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: var(--timeline-muted);
    }

    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .dot-detection { background: var(--timeline-detection); }
    .dot-analysis { background: var(--timeline-analysis); }
    .dot-containment { background: var(--timeline-containment); }
    .dot-eradication { background: var(--timeline-eradication); }
    .dot-recovery { background: var(--timeline-recovery); }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: var(--timeline-muted);
    }

    .empty-state-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }
  `;

  @property({ type: String }) incidentId = '';
  @property({ type: Array }) events = [];
  @property({ type: Array }) relatedIncidents = [];
  @property({ type: String }) zoomLevel = 'day';
  @property({ type: Boolean }) lightMode = false;

  @state() private selectedEvent: any = null;
  @state() private hoveredEvent: any = null;
  @state() private mousePosition = { x: 0, y: 0 };

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('mousemove', this.handleMouseMove.bind(this));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('mousemove', this.handleMouseMove.bind(this));
  }

  handleMouseMove(e: MouseEvent) {
    const rect = (e.target as HTMLElement)?.getBoundingClientRect();
    if (rect) {
      this.mousePosition = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  }

  setZoom(level: string) {
    this.zoomLevel = level;
    this.dispatchEvent(new CustomEvent('zoom-change', { detail: { level } }));
  }

  selectEvent(event: any) {
    this.selectedEvent = event;
    this.dispatchEvent(new CustomEvent('event-select', { detail: { event } }));
  }

  closeDetails() {
    this.selectedEvent = null;
  }

  exportTimeline(format: 'json' | 'csv' | 'png') {
    this.dispatchEvent(new CustomEvent('export', { 
      detail: { format, events: this.events, incidentId: this.incidentId } 
    }));
  }

  getPhaseClass(phase: string): string {
    return 'phase-segment phase-' + phase.toLowerCase();
  }

  getStatusClass(status: string): string {
    return 'status-badge status-' + status.toLowerCase().replace(' ', '');
  }

  getPhaseColor(phase: string): string {
    const colors: Record<string, string> = {
      'Detection': '#f85149',
      'Analysis': '#f0883e',
      'Containment': '#a371f7',
      'Eradication': '#8957e5',
      'Recovery': '#3fb950'
    };
    return colors[phase] || '#58a6ff';
  }

  renderTimeMarkers() {
    const markers = [];
    const hourCount = this.zoomLevel === 'hour' ? 24 : this.zoomLevel === 'day' ? 24 : 7;
    for (let i = 0; i < hourCount; i++) {
      const position = (i / hourCount) * 100;
      const label = this.zoomLevel === 'hour' ? i + ':00' : 
                    this.zoomLevel === 'day' ? i + ':00' : 'Day ' + (i + 1);
      markers.push(html`<span class="time-marker" style="left: ${position}%">${label}</span>`);
    }
    return markers;
  }

  renderPhaseSegments() {
    const phases = [
      { name: 'Detection', width: 15 },
      { name: 'Analysis', width: 25 },
      { name: 'Containment', width: 20 },
      { name: 'Eradication', width: 20 },
      { name: 'Recovery', width: 20 }
    ];

    return phases.map(phase => html`
      <div class="${this.getPhaseClass(phase.name)}" style="width: ${phase.width}%">
        ${phase.name}
      </div>
    `);
  }

  renderEvents() {
    return this.events.map((event, index) => {
      const top = 20 + (index % 10) * 35;
      const left = 5 + (index % 20) * 4.5;
      return html`
        <div 
          class="event-marker ${this.selectedEvent?.id === event.id ? 'selected' : ''}"
          style="top: ${top}px; left: ${left}%; background: ${this.getPhaseColor(event.phase)};"
          @click=${() => this.selectEvent(event)}
          @mouseenter=${() => this.hoveredEvent = event}
          @mouseleave=${() => this.hoveredEvent = null}
        ></div>
        ${this.renderCorrelationLines(event, index)}
      `;
    });
  }

  renderCorrelationLines(event: any, index: number) {
    if (!event.correlatedEvents || event.correlatedEvents.length === 0) return '';

    return event.correlatedEvents.map((corrId: string) => {
      const corrEvent = this.events.find((e: any) => e.id === corrId);
      if (!corrEvent) return '';

      const corrIndex = this.events.indexOf(corrEvent);
      const startLeft = 5 + (index % 20) * 4.5;
      const endLeft = 5 + (corrIndex % 20) * 4.5;

      return html`
        <div 
          class="correlation-line"
          style="left: ${Math.min(startLeft, endLeft) + 0.5}%; 
                 width: ${Math.abs(endLeft - startLeft)}%; 
                 top: ${20 + (index % 10) * 35 + 6}px;"
        ></div>
      `;
    });
  }

  renderDetailsPanel() {
    if (!this.selectedEvent) return '';

    return html`
      <div class="details-panel visible">
        <div class="details-header">
          <h3 class="details-title">${this.selectedEvent.title}</h3>
          <button class="close-btn" @click=${this.closeDetails}>×</button>
        </div>

        <div class="detail-group">
          <div class="detail-label">Status</div>
          <span class="${this.getStatusClass(this.selectedEvent.status)}">
            ${this.selectedEvent.status}
          </span>
        </div>

        <div class="detail-group">
          <div class="detail-label">Phase</div>
          <div class="detail-value">${this.selectedEvent.phase}</div>
        </div>

        <div class="detail-group">
          <div class="detail-label">Timestamp</div>
          <div class="detail-value">${new Date(this.selectedEvent.timestamp).toLocaleString()}</div>
        </div>

        <div class="detail-group">
          <div class="detail-label">Description</div>
          <div class="detail-value">${this.selectedEvent.description}</div>
        </div>

        ${this.selectedEvent.relatedIncidents?.length > 0 ? html`
          <div class="detail-group">
            <div class="detail-label">Related Incidents</div>
            <div class="related-links">
              ${this.selectedEvent.relatedIncidents.map((id: string) => html`
                <a class="related-link" href="#incident/${id}">INC-${id}</a>
              `)}
            </div>
          </div>
        ` : ''}

        <div class="detail-group">
          <div class="detail-label">Severity</div>
          <div class="detail-value">${this.selectedEvent.severity || 'Medium'}</div>
        </div>
      </div>
    `;
  }

  renderEventTooltip() {
    if (!this.hoveredEvent || this.selectedEvent) return '';

    return html`
      <div class="event-tooltip" style="left: ${this.mousePosition.x + 15}px; top: ${this.mousePosition.y - 40}px;">
        <strong>${this.hoveredEvent.title}</strong>
        <div style="color: var(--timeline-muted); font-size: 11px; margin-top: 4px;">
          ${this.hoveredEvent.phase} • ${new Date(this.hoveredEvent.timestamp).toLocaleString()}
        </div>
      </div>
    `;
  }

  renderLegend() {
    return html`
      <div class="timeline-legend">
        <div class="legend-item"><span class="legend-dot dot-detection"></span>Detection</div>
        <div class="legend-item"><span class="legend-dot dot-analysis"></span>Analysis</div>
        <div class="legend-item"><span class="legend-dot dot-containment"></span>Containment</div>
        <div class="legend-item"><span class="legend-dot dot-eradication"></span>Eradication</div>
        <div class="legend-item"><span class="legend-dot dot-recovery"></span>Recovery</div>
      </div>
    `;
  }

  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('lightMode')) {
      this.toggleAttribute('light-mode', this.lightMode);
    }
  }

  render() {
    return html`
      <div class="timeline-container">
        <div class="timeline-header">
          <h2 class="timeline-title">Incident Timeline${this.incidentId ? ' - ' + this.incidentId : ''}</h2>
          <div class="zoom-controls">
            <button class="zoom-btn ${this.zoomLevel === 'hour' ? 'active' : ''}" @click=${() => this.setZoom('hour')}>Hour</button>
            <button class="zoom-btn ${this.zoomLevel === 'day' ? 'active' : ''}" @click=${() => this.setZoom('day')}>Day</button>
            <button class="zoom-btn ${this.zoomLevel === 'week' ? 'active' : ''}" @click=${() => this.setZoom('week')}>Week</button>
          </div>
        </div>

        <div class="timeline-body">
          <div class="timeline-track">
            <div class="timeline-axis">
              ${this.renderTimeMarkers()}
            </div>
            
            <div class="timeline-phases">
              ${this.renderPhaseSegments()}
            </div>

            <div class="events-layer">
              ${this.events.length > 0 ? this.renderEvents() : html`
                <div class="empty-state">
                  <div class="empty-state-icon">📊</div>
                  <span>No events to display</span>
                </div>
              `}
            </div>

            ${this.renderEventTooltip()}
          </div>

          ${this.renderDetailsPanel()}
        </div>

        <div class="timeline-footer">
          <div class="export-controls">
            <button class="export-btn" @click=${() => this.exportTimeline('json')}>
              📥 Export JSON
            </button>
            <button class="export-btn" @click=${() => this.exportTimeline('csv')}>
              📊 Export CSV
            </button>
            <button class="export-btn" @click=${() => this.exportTimeline('png')}>
              🖼️ Export PNG
            </button>
          </div>
          ${this.renderLegend()}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-incident-timeline': ScIncidentTimeline;
  }
}

