import { LitElement, html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';

interface SankeyNode { name: string; }
interface SankeyLink { source: number; target: number; value: number; }

@customElement('sc-sankey-chart')
export class ScSankeyChart extends LitElement {
  static styles = css`
    :host { display: block; }
    svg { display: block; width: 100%; }
    .node-label { font-size: 10px; fill: var(--sc-text-primary, #f9fafb); }
    .link { fill: var(--sc-info, #3b82f6); fill-opacity: 0.3; }
  `;
  @property({ type: Array }) nodes: SankeyNode[] = [];
  @property({ type: Array }) links: SankeyLink[] = [];
  @property({ type: Number }) height = 200;
  @property({ type: Array }) colors: string[] = ['#3b82f6', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444'];

  render() {
    const w = 600;
    const h = this.height;
    const padX = 8, padY = 8;
    const nodeW = 12;
    const stages = new Set<number>();
    this.links.forEach(l => { stages.add(l.source); stages.add(l.target); });
    const totalStages = Math.max(1, ...stages) + 1;
    const stageWidth = (w - padX * 2 - nodeW) / Math.max(1, totalStages - 1);
    const sourceTotals: Record<number, number> = {};
    this.links.forEach(l => { sourceTotals[l.source] = (sourceTotals[l.source] || 0) + l.value; });
    const totalValue = Math.max(1, ...Object.values(sourceTotals));
    const innerH = h - padY * 2;
    const renderNodes: Array<{ idx: number; x: number; y: number; h: number; color: string; name: string }> = [];
    const seenNodes = new Map<number, number>();
    for (let stage = 0; stage < totalStages; stage++) {
      const linksAtStage = this.links.filter(l => l.source === stage);
      const stageTotal = linksAtStage.reduce((s, l) => s + l.value, 0);
      let yOffset = padY;
      linksAtStage.forEach((l, i) => {
        const nodeH = (l.value / totalValue) * innerH;
        const key = stage * 1000 + i;
        seenNodes.set(stage, (seenNodes.get(stage) || 0) + 1);
        renderNodes.push({
          idx: stage,
          x: padX + stage * stageWidth,
          y: yOffset,
          h: Math.max(2, nodeH - 2),
          color: this.colors[stage % this.colors.length],
          name: this.nodes[stage]?.name || `阶段${stage + 1}`,
        });
        yOffset += nodeH;
      });
    }
    return html`
      <div role="img" aria-label="Sankey flow">
        <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
          ${this.links.map(l => {
            const srcX = padX + l.source * stageWidth + nodeW;
            const tgtX = padX + l.target * stageWidth;
            const srcY = padY + (sourceTotals[l.source] > 0 ? (l.value / sourceTotals[l.source]) * innerH * 0.5 : 0);
            const tgtY = padY + innerH * 0.5;
            const path = `M ${srcX} ${srcY} C ${(srcX + tgtX) / 2} ${srcY}, ${(srcX + tgtX) / 2} ${tgtY}, ${tgtX} ${tgtY}`;
            return svg`<path class="link" d="${path}"/>`;
          })}
          ${renderNodes.map(n => svg`
            <rect x="${n.x}" y="${n.y}" width="${nodeW}" height="${n.h}" fill="${n.color}"/>
            <text class="node-label" x="${n.x + nodeW + 4}" y="${n.y + n.h / 2 + 3}">${n.name}</text>
          `)}
        </svg>
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-sankey-chart': ScSankeyChart; } }
