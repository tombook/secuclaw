import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

interface TimelineStep { time: string; title: string; desc: string; status: 'done' | 'current' | 'pending'; }

@customElement('sc-ai-result-timeline')
export class ScAiResultTimeline extends LitElement {
  static styles = css`
    :host { display: block; }
    .wrap { background: var(--sc-bg-secondary, #111827); border: 1px solid var(--sc-border, #374151); border-radius: 8px; padding: 14px; }
    .step { position: relative; padding-left: 28px; padding-bottom: 14px; }
    .step:not(:last-child)::before { content: ''; position: absolute; left: 8px; top: 18px; bottom: 0; width: 2px; background: var(--sc-border, #374151); }
    .dot { position: absolute; left: 0; top: 4px; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; }
    .step.done .dot { background: var(--sc-low, #22c55e); color: #fff; }
    .step.current .dot { background: var(--sc-primary, #00d4ff); color: var(--sc-text-inverse, #0f172a); box-shadow: 0 0 0 4px rgba(0, 212, 255, 0.2); }
    .step.pending .dot { background: var(--sc-bg-tertiary, #1f2937); border: 2px solid var(--sc-border, #374151); }
    .time { font-size: 10px; color: var(--sc-text-muted, #6b7280); }
    .title { font-size: 13px; font-weight: 600; color: var(--sc-text-primary, #f9fafb); margin: 2px 0; }
    .desc { font-size: 11px; color: var(--sc-text-secondary, #9ca3af); line-height: 1.5; }
  `;
  @property({ type: Array }) steps: TimelineStep[] = [];

  render() {
    if (!this.steps.length) return html`<div class="wrap" style="color:var(--sc-text-muted);text-align:center;padding:20px;">暂无步骤</div>`;
    return html`
      <div class="wrap" role="list" aria-label="AI 执行时间线">
        ${this.steps.map(s => html`
          <div class="step ${s.status}" role="listitem">
            <div class="dot">${s.status === 'done' ? '✓' : s.status === 'current' ? '●' : ''}</div>
            <div class="time">${s.time}</div>
            <div class="title">${s.title}</div>
            <div class="desc">${s.desc}</div>
          </div>
        `)}
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-ai-result-timeline': ScAiResultTimeline; } }
