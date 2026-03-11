/**
 * SecuClaw Data Lineage Graph Page - 数据血缘关系图页面
 * 
 * 可视化展示数据流向和依赖关系
 */
import { LitElement, html, css, svg } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';
import { dataStore, type LineageNode as LineageNodeType, type LineageRelation } from '../store/data-store.js';
import '../components/sc-ai-assistant.js';

@customElement('sc-data-lineage')
export class ScDataLineage extends LitElement {
  private i18n = new I18nController(this);

  @state() private loading = true;
  @state() private nodes: LineageNodeType[] = [];
  @state() private relations: LineageRelation[] = [];
  @state() private selectedNode: LineageNodeType | null = null;
  @state() private zoom = 1;
  @state() private panOffset = { x: 0, y: 0 };

  staticstyles= css`
    :host { display: block; }
    .lineage-container{
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: var(--sc-spacing-lg, 20px);
      height: 100%;
    }
    @media (max-width: 1200px) {
      .lineage-container { grid-template-columns: 1fr; }
    }
    .main-content{
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-lg, 20px);
      overflow-y: auto;
    }
    .page-header{
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .page-title{
      font-size: var(--sc-font-size-2xl, 24px);
      font-weight: 600;
      color: var(--sc-text-primary, #1e293b);
    }
    .header-actions{
      display: flex;
      gap: var(--sc-spacing-sm, 8px);
    }
    .btn{
      padding: var(--sc-spacing-sm, 8px) var(--sc-spacing-md, 16px);
      border-radius: var(--sc-radius-md, 8px);
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }
    .btn-primary{
      background-color: var(--sc-primary, #3b82f6);
      color: white;
    }
    .btn-secondary{
      background-color: var(--sc-bg-secondary, #f8fafc);
      color: var(--sc-text-primary, #1e293b);
      border: 1px solid var(--sc-border-color, #e2e8f0);
    }
    /* 图形控制 */
    .graph-controls{
      display: flex;
      gap: var(--sc-spacing-sm, 8px);
      align-items: center;
    }
    .zoom-controls{
      display: flex;
      gap: var(--sc-spacing-xs, 4px);
    }
    .zoom-btn{
      width: 32px;
      height: 32px;
      border-radius: var(--sc-radius-md, 8px);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      background-color: var(--sc-bg-card, #ffffff);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }
    .zoom-btn:hover{
      background-color: var(--sc-bg-secondary, #f8fafc);
    }
    .zoom-label{
      font-size: var(--sc-font-size-sm, 14px);
      color: var(--sc-text-secondary, #64748b);
      min-width: 60px;
      text-align: center;
    }
    /* 图形容器 */
    .graph-container{
      flex: 1;
      background-color: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-lg, 12px);
      overflow: hidden;
      position: relative;
    }
    .graph-canvas{
      width: 100%;
      height: 100%;
      min-height: 500px;
    }
    /* 图例 */
    .legend{
      position: absolute;
      bottom: var(--sc-spacing-md, 16px);
      left: var(--sc-spacing-md, 16px);
      background-color: rgba(255, 255, 255, 0.95);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-md, 8px);
      padding: var(--sc-spacing-sm, 8px);
      display: flex;
      gap: var(--sc-spacing-md, 16px);
    }
    .legend-item{
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-xs, 4px);
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, #64748b);
    }
    .legend-dot{
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    .legend-dot.source{ background-color: #22c55e; }
    .legend-dot.database{ background-color: #3b82f6; }
    .legend-dot.consumer{ background-color: #f59e0b; }
    /* 节点详情 */
    .node-detail{
      position: absolute;
      top: var(--sc-spacing-md, 16px);
      right: var(--sc-spacing-md, 16px);
      width: 280px;
      background-color: rgba(255, 255, 255, 0.95);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-lg, 20px);
    }
    .detail-header{
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm, 8px);
      margin-bottom: var(--sc-spacing-md, 16px);
      padding-bottom: var(--sc-spacing-sm, 8px);
      border-bottom: 1px solid var(--sc-border-color, #e2e8f0);
    }
    .detail-icon{
      width: 40px;
      height: 40px;
      border-radius: var(--sc-radius-md, 8px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      background-color: var(--sc-bg-secondary, #f8fafc);
    }
    .detail-title{
      font-size: var(--sc-font-size-lg, 18px);
      font-weight: 600;
      color: var(--sc-text-primary, #1e293b);
    }
    .detail-type{
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-tertiary, #94a3b8);
    }
    .detail-info{
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-sm, 8px);
    }
    .info-item{
      display: flex;
      justify-content: space-between;
      font-size: var(--sc-font-size-sm, 14px);
    }
    .info-label{
      color: var(--sc-text-secondary, #64748b);
    }
    .info-value{
      color: var(--sc-text-primary, #1e293b);
      font-weight: 500;
    }
    .ai-sidebar{
      position: sticky;
      top: 0;
      height: calc(100vh - var(--sc-spacing-lg, 20px) * 2);
      overflow: hidden;
    }
  `;

  constructor() {
    super();
    this.loadLineageData();
  }

  private async loadLineageData() {
    this.loading = true;
    try {
      await dataStore.loadLineageGraph();
      const graph = dataStore.getLineageGraph();
      if (graph) {
        this.nodes = graph.nodes;
        this.relations = graph.relations;
      }
    } finally {
      this.loading = false;
    }
  }

  private handleZoomIn() {
    this.zoom = Math.min(this.zoom + 0.1, 2);
  }

  private handleZoomOut() {
    this.zoom = Math.max(this.zoom - 0.1, 0.5);
  }

  private handleReset() {
    this.zoom = 1;
    this.panOffset = { x: 0, y: 0 };
  }

  private handleNodeClick(node: LineageNodeType) {
    this.selectedNode = this.selectedNode?.id === node.id? null : node;
  }

  private getNodePosition(index: number, total: number, type: string): { x: number; y: number } {
    const width = 1000;
    const height = 600;
    const marginX = 100;
    const marginY = 80;

    if (type === 'source') {
      const y = marginY + (index * (height - 2 * marginY) / Math.max(total - 1, 1));
      return { x: marginX, y };
    } else if (type === 'consumer') {
      const y = marginY + (index * (height - 2 * marginY) / Math.max(total - 1, 1));
      return { x: width - marginX, y };
    } else {
      // Database nodes in the middle
      const cols = Math.ceil(Math.sqrt(total));
      const row = Math.floor(index / cols);
      const col = index % cols;
      const spacingX = (width - 2 * marginX) / (cols + 1);
      const rows = Math.ceil(total / cols);
      const spacingY = (height - 2 * marginY) / (rows + 1);
      return { x: marginX + spacingX * (col + 1), y: marginY + spacingY * (row + 1) };
    }
  }

  private renderGraph() {
    const sources = this.nodes.filter(n => n.type === 'source');
    const databases = this.nodes.filter(n => n.type === 'database');
    const consumers = this.nodes.filter(n => n.type === 'consumer');

    return svg`
      <svg class="graph-canvas" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
          </marker>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.1"/>
          </filter>
        </defs>

        <!-- Relations (edges) -->
        ${this.relations.map(rel => {
          const sourceNode = this.nodes.find(n => n.id === rel.sourceId);
          const targetNode = this.nodes.find(n => n.id === rel.targetId);
          if (!sourceNode || !targetNode) return null;

          const sourceIndex = this.nodes.filter(n => n.type === sourceNode.type).findIndex(n => n.id === sourceNode.id);
          const targetIndex = this.nodes.filter(n => n.type === targetNode.type).findIndex(n => n.id === targetNode.id);
          const sourceTotal = this.nodes.filter(n => n.type === sourceNode.type).length;
          const targetTotal = this.nodes.filter(n => n.type === targetNode.type).length;

          const sourcePos = this.getNodePosition(sourceIndex, sourceTotal, sourceNode.type);
          const targetPos = this.getNodePosition(targetIndex, targetTotal, targetNode.type);

          return svg`
            <path
              d="M ${sourcePos.x + 40} ${sourcePos.y} C ${(sourcePos.x + targetPos.x) / 2} ${sourcePos.y}, ${(sourcePos.x + targetPos.x) / 2} ${targetPos.y}, ${targetPos.x - 40} ${targetPos.y}"
              fill="none"
              stroke="#94a3b8"
              stroke-width="2"
              marker-end="url(#arrowhead)"
              stroke-dasharray=${rel.type === 'manual'? '5,5': 'none'}
            />
          `;
        })}

        <!-- Source nodes -->
        ${sources.map((node, i) => {
          const pos = this.getNodePosition(i, sources.length, 'source');
          const isSelected = this.selectedNode?.id === node.id;
          return svg`
            <g @click=${() => this.handleNodeClick(node)} style="cursor: pointer">
              <circle cx="${pos.x}" cy="${pos.y}" r="35" fill="${node.status === 'active'? '#22c55e': '#94a3b8'}" filter=${isSelected? 'url(#shadow)': 'none'} stroke=${isSelected? '#1e293b': 'none'} stroke-width="3"/>
              <text x="${pos.x}" y="${pos.y + 5}" text-anchor="middle" fill="white" font-size="20">${node.icon}</text>
              <text x="${pos.x}" y="${pos.y + 50}" text-anchor="middle" fill="#1e293b" font-size="11" font-weight="500">${node.name}</text>
            </g>
          `;
        })}

        <!-- Database nodes -->
        ${databases.map((node, i) => {
          const pos = this.getNodePosition(i, databases.length, 'database');
          const isSelected = this.selectedNode?.id === node.id;
          return svg`
            <g @click=${() => this.handleNodeClick(node)} style="cursor: pointer">
              <circle cx="${pos.x}" cy="${pos.y}" r="35" fill="${node.status === 'active'? '#3b82f6': '#94a3b8'}" filter=${isSelected? 'url(#shadow)': 'none'} stroke=${isSelected? '#1e293b': 'none'} stroke-width="3"/>
              <text x="${pos.x}" y="${pos.y + 5}" text-anchor="middle" fill="white" font-size="20">${node.icon}</text>
              <text x="${pos.x}" y="${pos.y + 50}" text-anchor="middle" fill="#1e293b" font-size="11" font-weight="500">${node.name}</text>
            </g>
          `;
        })}

        <!-- Consumer nodes -->
        ${consumers.map((node, i) => {
          const pos = this.getNodePosition(i, consumers.length, 'consumer');
          const isSelected = this.selectedNode?.id === node.id;
          return svg`
            <g @click=${() => this.handleNodeClick(node)} style="cursor: pointer">
              <circle cx="${pos.x}" cy="${pos.y}" r="35" fill="${node.status === 'active'? '#f59e0b': '#94a3b8'}" filter=${isSelected? 'url(#shadow)': 'none'} stroke=${isSelected? '#1e293b': 'none'} stroke-width="3"/>
              <text x="${pos.x}" y="${pos.y + 5}" text-anchor="middle" fill="white" font-size="20">${node.icon}</text>
              <text x="${pos.x}" y="${pos.y + 50}" text-anchor="middle" fill="#1e293b" font-size="11" font-weight="500">${node.name}</text>
            </g>
          `;
        })}
      </svg>
    `;
  }

  private renderNodeDetail() {
    if (!this.selectedNode) return null;

    const node = this.selectedNode;
    const incomingRelations = this.relations.filter(r => r.targetId === node.id);
    const outgoingRelations = this.relations.filter(r => r.sourceId === node.id);

    const typeLabels: Record<string, string> = {
      'source': '数据源',
      'database': '数据库',
      'consumer': '消费者'
    };

    return html`
      <div class="node-detail">
        <div class="detail-header">
          <div class="detail-icon">${node.icon}</div>
          <div>
            <div class="detail-title">${node.name}</div>
            <div class="detail-type">${typeLabels[node.type]}</div>
          </div>
        </div>
        <div class="detail-info">
          <div class="info-item">
            <span class="info-label">状态</span>
            <span class="info-value" style="color: ${node.status === 'active'? 'var(--sc-success)': 'var(--sc-text-tertiary)'}">${node.status === 'active'? '活跃': '未活跃'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">上游数据源</span>
            <span class="info-value">${incomingRelations.length}</span>
          </div>
          <div class="info-item">
            <span class="info-label">下游消费者</span>
            <span class="info-value">${outgoingRelations.length}</span>
          </div>
        </div>
        ${incomingRelations.length > 0? html`
          <div style="margin-top: 16px;">
            <div style="font-size: 12px; color: var(--sc-text-secondary); margin-bottom: 8px;">上游来源</div>
            ${incomingRelations.slice(0, 3).map(rel => {
              const sourceNode = this.nodes.find(n => n.id === rel.sourceId);
              return html`<div style="font-size: 12px; padding: 4px 8px; background: var(--sc-bg-secondary); border-radius: 4px; margin-bottom: 4px;">${sourceNode?.icon} ${sourceNode?.name}</div>`;
            })}
          </div>
        `: ''}
        ${outgoingRelations.length > 0? html`
          <div style="margin-top: 16px;">
            <div style="font-size: 12px; color: var(--sc-text-secondary); margin-bottom: 8px;">下游去向</div>
            ${outgoingRelations.slice(0, 3).map(rel => {
              const targetNode = this.nodes.find(n => n.id === rel.targetId);
              return html`<div style="font-size: 12px; padding: 4px 8px; background: var(--sc-bg-secondary); border-radius: 4px; margin-bottom: 4px;">${targetNode?.icon} ${targetNode?.name}</div>`;
            })}
          </div>
        `: ''}
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return html`<div style="text-align:center;padding:2rem;"><div style="font-size:48px;margin-bottom:16px;">⏳</div><div style="color:var(--sc-text-secondary);">加载中...</div></div>`;
    }

    return html`
      <div class="lineage-container">
        <div class="main-content">
          <div class="page-header">
            <h1 class="page-title">🔗 数据血缘关系</h1>
            <div class="header-actions">
              <div class="graph-controls">
                <div class="zoom-controls">
                  <button class="zoom-btn" @click=${this.handleZoomOut}>−</button>
                  <span class="zoom-label">${Math.round(this.zoom * 100)}%</span>
                  <button class="zoom-btn" @click=${this.handleZoomIn}>+</button>
                </div>
                <button class="btn btn-secondary" @click=${this.handleReset}>重置</button>
              </div>
              <button class="btn btn-secondary">📥 导出</button>
              <button class="btn btn-primary">🔄 刷新</button>
            </div>
          </div>

          <div class="graph-container" style="transform: scale(${this.zoom}); transform-origin: center;">
            ${this.renderGraph()}
            <div class="legend">
              <div class="legend-item">
                <div class="legend-dot source"></div>
                <span>数据源</span>
              </div>
              <div class="legend-item">
                <div class="legend-dot database"></div>
                <span>数据库</span>
              </div>
              <div class="legend-item">
                <div class="legend-dot consumer"></div>
                <span>消费者</span>
              </div>
            </div>
            ${this.renderNodeDetail()}
          </div>
        </div>

        <div class="ai-sidebar">
          <sc-ai-assistant
            pageId="data-lineage"
            pageTitle="数据血缘关系"
            .pageData=${{ nodes: this.nodes, relations: this.relations, selectedNode: this.selectedNode }}
            userRole="security-expert"
          ></sc-ai-assistant>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-data-lineage': ScDataLineage;
  }
}
