import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

interface TimelineEvent { time: string; title: string; severity: 'critical' | 'high' | 'medium' | 'low' | 'info'; desc?: string; }

@customElement('sc-timeline-viz')
export class ScTimelineViz extends LitElement {
  static styles = css`
    :host { display: block; }
    .tl { position: relative; padding-left: 20px; }
    .tl::before { content: ''; position: absolute; left: 6px; top: 4px; bottom: 4px; width: 2px; background: var(--sc-border, #374151); }
    .ev { position: relative; padding: 8px 0; }
    .ev::before { content: ''; position: absolute; left: -17px; top: 12px; width: 10px; height: 10px; border-radius: 50%; background: var(--sc-bg-tertiary, #1f2937); border: 2px solid var(--sc-border, #374151); }
    .ev.critical::before { background: var(--sc-critical, #ef4444); border-color: var(--sc-critical, #ef4444); }
    .ev.high::before { background: var(--sc-high, #f97316); border-color: var(--sc-high, #f97316); }
    .ev.medium::before { background: var(--sc-medium, #f59e0b); border-color: var(--sc-medium, #f59e0b); }
    .ev.low::before { background: var(--sc-low, #22c55e); border-color: var(--sc-low, #22c55e); }
    .ev.info::before { background: var(--sc-info, #3b82f6); border-color: var(--sc-info, #3b82f6); }
    .time { font-size: 10px; color: var(--sc-text-muted, #6b7280); }
    .title { font-size: 12px; font-weight: 600; color: var(--sc-text-primary, #f9fafb); }
    .desc { font-size: 11px; color: var(--sc-text-secondary, #9ca3af); margin-top: 2px; }
  `;
  @property({ type: Array }) events: TimelineEvent[] = [];

  render() {
    if (!this.events.length) return html`<div style="text-align:center;padding:20px;color:var(--sc-text-muted);font-size:11px;">暂无事件</div>`;
    return html`
      <div class="tl" role="list" aria-label="事件时间线">
        ${this.events.map(e => html`
          <div class="ev ${e.severity}" role="listitem">
            <div class="time">${e.time}</div>
            <div class="title">${e.title}</div>
            ${e.desc ? html`<div class="desc">${e.desc}</div>` : ''}
          </div>
        `)}
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-timeline-viz': ScTimelineViz; } }
