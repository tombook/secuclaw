/**
 * SecuClaw Lineage Graph Component - 数据血缘图组件
 * 
 * 支持节点展开/收起、路径高亮、搜索过滤
 * 用于展示数据流向、资产关系、攻击路径等场景
 */

import { LitElement, html, css, svg, SVGTemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';
import { classMap } from 'lit/directives/class-map.js';

// ============ 类型定义 ============

export interface LineageNode {
  id: string;
  type: 'source' | 'transform' | 'sink' | 'system' | 'database' | 'api' | 'file' | 'custom';
  name: string;
  icon?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  x?: number;
  y?: number;
  expanded?: boolean;
  hidden?: boolean;
}

export interface LineageEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: 'data' | 'control' | 'dependency' | 'attack';
  metadata?: Record<string, unknown>;
}

export interface LineageGraph {
  nodes: LineageNode[];
  edges: LineageEdge[];
}

export interface LineageConfig {
  layout?: 'hierarchical' | 'force' | 'radial' | 'tree';
  direction?: 'LR' | 'RL' | 'TB' | 'BT';
  nodeWidth?: number;
  nodeHeight?: number;
  enableZoom?: boolean;
  enablePan?: boolean;
  enableSearch?: boolean;
  enableExpand?: boolean;
  enablePathHighlight?: boolean;
  showLabels?: boolean;
  showEdgeLabels?: boolean;
  animate?: boolean;
  minZoom?: number;
  maxZoom?: number;
}

export interface LayoutNode extends LineageNode {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============ 组件定义 ============

@customElement('sc-lineage-graph')
export class ScLineageGraph extends LitElement {
  // ============ 属性 ============

  @property({ type: Object })
  graph: LineageGraph = { nodes: [], edges: [] };

  @property({ type: Object })
  config: LineageConfig = {};

  @property({ type: String })
  title: string = '';

  @property({ type: Boolean })
  loading: boolean = false;

  @property({ type: String })
  highlightPath: string = '';

  // ============ 状态 ============

  @state()
  private layoutNodes: Map<string, LayoutNode> = new Map();

  @state()
  private zoom: number = 1;

  @state()
  private pan: { x: number; y: number } = { x: 0, y: 0 };

  @state()
  private selectedNode: string | null = null;

  @state()
  private hoveredNode: string | null = null;

  @state()
  private hoveredEdge: string | null = null;

  @state()
  private searchQuery: string = '';

  @state()
  private expandedNodes: Set<string> = new Set();

  @state()
  private isDragging: boolean = false;

  @state()
  private dragStart: { x: number; y: number } | null = null;

  private i18n = new I18nController(this);
  private svgRef?: SVGSVGElement;
  private animationFrame?: number;

  // ============ 样式 ============

  static styles = css`
    :host {
      display: block;
      font-family: var(--sc-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
    }

    .lineage-container {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 400px;
      background: var(--sc-bg-secondary, #1a1a2e);
      border-radius: var(--sc-radius-lg, 12px);
      overflow: hidden;
    }

    .lineage-header {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--sc-spacing-md, 12px) var(--sc-spacing-lg, 16px);
      background: linear-gradient(to bottom, var(--sc-bg-secondary, #1a1a2e), transparent);
      z-index: 10;
    }

    .lineage-title {
      font-size: var(--sc-font-size-md, 14px);
      font-weight: 600;
      color: var(--sc-text-primary, #fff);
    }

    .lineage-controls {
      display: flex;
      gap: var(--sc-spacing-sm, 8px);
      align-items: center;
    }

    .search-box {
      position: relative;
    }

    .search-input {
      width: 200px;
      height: 32px;
      padding: 0 12px 0 32px;
      background: var(--sc-bg-tertiary, #16162a);
      border: 1px solid var(--sc-border-color, rgba(255, 255, 255, 0.1));
      border-radius: var(--sc-radius-sm, 4px);
      color: var(--sc-text-primary, #fff);
      font-size: var(--sc-font-size-sm, 13px);
      transition: all 0.2s;
    }

    .search-input:focus {
      outline: none;
      border-color: var(--sc-primary, #6366f1);
      width: 260px;
    }

    .search-input::placeholder {
      color: var(--sc-text-tertiary, rgba(255, 255, 255, 0.3));
    }

    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--sc-text-tertiary, rgba(255, 255, 255, 0.3));
    }

    .control-btn {
      background: var(--sc-bg-tertiary, #16162a);
      border: 1px solid var(--sc-border-color, rgba(255, 255, 255, 0.1));
      color: var(--sc-text-secondary, rgba(255, 255, 255, 0.6));
      width: 32px;
      height: 32px;
      border-radius: var(--sc-radius-sm, 4px);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .control-btn:hover {
      background: var(--sc-bg-hover, rgba(255, 255, 255, 0.05));
      color: var(--sc-text-primary, #fff);
    }

    .control-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .zoom-control {
      display: flex;
      align-items: center;
      gap: 4px;
      background: var(--sc-bg-tertiary, #16162a);
      border: 1px solid var(--sc-border-color, rgba(255, 255, 255, 0.1));
      border-radius: var(--sc-radius-sm, 4px);
      padding: 2px;
    }

    .zoom-level {
      min-width: 40px;
      text-align: center;
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, rgba(255, 255, 255, 0.6));
    }

    .graph-canvas {
      width: 100%;
      height: 100%;
      cursor: grab;
    }

    .graph-canvas:active {
      cursor: grabbing;
    }

    .node-group {
      cursor: pointer;
    }

    .node-rect {
      fill: var(--sc-bg-elevated, #2a2a4a);
      stroke: var(--sc-border-color, rgba(255, 255, 255, 0.2));
      stroke-width: 1;
      rx: 8;
      transition: all 0.2s;
    }

    .node-rect:hover {
      fill: var(--sc-bg-card-hover, #3a3a5a);
      stroke: var(--sc-primary, #6366f1);
    }

    .node-rect.selected {
      stroke: var(--sc-primary, #6366f1);
      stroke-width: 2;
    }

    .node-rect.highlighted {
      stroke: var(--sc-success, #22c55e);
      stroke-width: 2;
    }

    .node-rect.dimmed {
      opacity: 0.3;
    }

    .node-type-badge {
      fill: var(--sc-primary, #6366f1);
    }

    .node-type-badge.source { fill: #22c55e; }
    .node-type-badge.transform { fill: #f59e0b; }
    .node-type-badge.sink { fill: #ef4444; }
    .node-type-badge.system { fill: #6366f1; }
    .node-type-badge.database { fill: #3b82f6; }
    .node-type-badge.api { fill: #8b5cf6; }
    .node-type-badge.file { fill: #6b7280; }

    .node-icon {
      fill: #fff;
      font-size: 12px;
    }

    .node-label {
      fill: var(--sc-text-primary, #fff);
      font-size: 12px;
      font-weight: 500;
    }

    .node-description {
      fill: var(--sc-text-secondary, rgba(255, 255, 255, 0.6));
      font-size: 10px;
    }

    .edge-path {
      fill: none;
      stroke: var(--sc-border-color, rgba(255, 255, 255, 0.3));
      stroke-width: 2;
      transition: stroke 0.2s;
    }

    .edge-path.data { stroke: #3b82f6; }
    .edge-path.control { stroke: #f59e0b; }
    .edge-path.dependency { stroke: #8b5cf6; }
    .edge-path.attack { stroke: #ef4444; stroke-dasharray: 5 3; }

    .edge-path.highlighted {
      stroke: var(--sc-success, #22c55e);
      stroke-width: 3;
    }

    .edge-path.dimmed {
      opacity: 0.2;
    }

    .edge-label {
      fill: var(--sc-text-tertiary, rgba(255, 255, 255, 0.5));
      font-size: 10px;
    }

    .arrow-marker {
      fill: var(--sc-border-color, rgba(255, 255, 255, 0.3));
    }

    .arrow-marker.highlighted {
      fill: var(--sc-success, #22c55e);
    }

    .expand-btn {
      fill: var(--sc-bg-tertiary, #16162a);
      stroke: var(--sc-border-color, rgba(255, 255, 255, 0.2));
      cursor: pointer;
    }

    .expand-btn:hover {
      fill: var(--sc-bg-hover, rgba(255, 255, 255, 0.05));
    }

    .expand-icon {
      fill: var(--sc-text-secondary, rgba(255, 255, 255, 0.6));
      font-size: 10px;
    }

    .tooltip {
      position: absolute;
      background: var(--sc-bg-elevated, #2a2a4a);
      border: 1px solid var(--sc-border-color, rgba(255, 255, 255, 0.1));
      border-radius: var(--sc-radius-md, 8px);
      padding: var(--sc-spacing-sm, 8px) var(--sc-spacing-md, 12px);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 100;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      max-width: 300px;
    }

    .tooltip.visible {
      opacity: 1;
    }

    .tooltip-title {
      font-size: var(--sc-font-size-sm, 13px);
      font-weight: 600;
      color: var(--sc-text-primary, #fff);
      margin-bottom: 4px;
    }

    .tooltip-description {
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, rgba(255, 255, 255, 0.6));
    }

    .tooltip-meta {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--sc-border-color, rgba(255, 255, 255, 0.1));
    }

    .tooltip-meta-item {
      display: flex;
      justify-content: space-between;
      font-size: var(--sc-font-size-xs, 11px);
      margin-bottom: 2px;
    }

    .tooltip-meta-label {
      color: var(--sc-text-tertiary, rgba(255, 255, 255, 0.4));
    }

    .tooltip-meta-value {
      color: var(--sc-text-secondary, rgba(255, 255, 255, 0.6));
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 20;
    }

    .loading-spinner {
      width: 32px;
      height: 32px;
      border: 2px solid var(--sc-border-color, rgba(255, 255, 255, 0.1));
      border-top-color: var(--sc-primary, #6366f1);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-state {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      color: var(--sc-text-tertiary, rgba(255, 255, 255, 0.4));
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: var(--sc-spacing-md, 12px);
    }

    .minimap {
      position: absolute;
      bottom: var(--sc-spacing-md, 12px);
      right: var(--sc-spacing-md, 12px);
      width: 150px;
      height: 100px;
      background: var(--sc-bg-tertiary, #16162a);
      border: 1px solid var(--sc-border-color, rgba(255, 255, 255, 0.1));
      border-radius: var(--sc-radius-sm, 4px);
      overflow: hidden;
    }

    .minimap-viewport {
      fill: rgba(99, 102, 241, 0.2);
      stroke: var(--sc-primary, #6366f1);
      stroke-width: 1;
    }

    .legend {
      position: absolute;
      bottom: var(--sc-spacing-md, 12px);
      left: var(--sc-spacing-md, 12px);
      display: flex;
      gap: var(--sc-spacing-md, 12px);
      padding: var(--sc-spacing-sm, 8px) var(--sc-spacing-md, 12px);
      background: var(--sc-bg-tertiary, #16162a);
      border: 1px solid var(--sc-border-color, rgba(255, 255, 255, 0.1));
      border-radius: var(--sc-radius-sm, 4px);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: var(--sc-font-size-xs, 11px);
      color: var(--sc-text-secondary, rgba(255, 255, 255, 0.6));
    }

    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
  `;

  // ============ 计算属性 ============

  private get graphConfig(): Required<LineageConfig> {
    return {
      layout: 'hierarchical',
      direction: 'LR',
      nodeWidth: 180,
      nodeHeight: 60,
      enableZoom: true,
      enablePan: true,
      enableSearch: true,
      enableExpand: true,
      enablePathHighlight: true,
      showLabels: true,
      showEdgeLabels: true,
      animate: true,
      minZoom: 0.2,
      maxZoom: 3,
      ...this.config,
    };
  }

  private get filteredNodes(): LineageNode[] {
    if (!this.searchQuery) return this.graph.nodes;
    const query = this.searchQuery.toLowerCase();
    return this.graph.nodes.filter(
      node => node.name.toLowerCase().includes(query) ||
              node.description?.toLowerCase().includes(query)
    );
  }

  private get highlightedPath(): Set<string> {
    if (!this.highlightPath) return new Set();
    // 解析高亮路径 (格式: "node1->node2->node3")
    return new Set(this.highlightPath.split('->').filter(Boolean));
  }

  // ============ 生命周期 ============

  protected async firstUpdated(): Promise<void> {
    this.calculateLayout();
  }

  protected updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('graph') || changedProperties.has('config')) {
      this.calculateLayout();
    }
  }

  // ============ 布局计算 ============

  private calculateLayout(): void {
    const { nodeWidth, nodeHeight, direction, layout } = this.graphConfig;
    const nodes = this.filteredNodes;
    const edges = this.graph.edges;

    if (layout === 'hierarchical') {
      this.calculateHierarchicalLayout(nodes, edges);
    } else if (layout === 'tree') {
      this.calculateTreeLayout(nodes, edges);
    } else if (layout === 'radial') {
      this.calculateRadialLayout(nodes, edges);
    }

    this.requestUpdate();
  }

  private calculateHierarchicalLayout(nodes: LineageNode[], edges: LineageEdge[]): void {
    const { nodeWidth, nodeHeight, direction } = this.graphConfig;
    
    // 构建入度表
    const inDegree = new Map<string, number>();
    const outEdges = new Map<string, string[]>();
    
    nodes.forEach(n => {
      inDegree.set(n.id, 0);
      outEdges.set(n.id, []);
    });
    
    edges.forEach(e => {
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
      outEdges.get(e.source)?.push(e.target);
    });

    // 拓扑排序分层
    const layers: string[][] = [];
    const visited = new Set<string>();
    let queue = nodes.filter(n => inDegree.get(n.id) === 0).map(n => n.id);

    while (queue.length > 0) {
      layers.push(queue);
      queue.forEach(id => visited.add(id));
      
      const nextQueue: string[] = [];
      queue.forEach(id => {
        outEdges.get(id)?.forEach(targetId => {
          if (!visited.has(targetId)) {
            const newDegree = (inDegree.get(targetId) || 1) - 1;
            inDegree.set(targetId, newDegree);
            if (newDegree === 0) {
              nextQueue.push(targetId);
            }
          }
        });
      });
      queue = nextQueue;
    }

    // 计算位置
    const spacingX = 250;
    const spacingY = nodeHeight + 40;
    
    layers.forEach((layer, layerIndex) => {
      const totalHeight = layer.length * spacingY;
      const startY = -totalHeight / 2 + spacingY / 2;
      
      layer.forEach((nodeId, nodeIndex) => {
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
          const x = layerIndex * spacingX;
          const y = startY + nodeIndex * spacingY;
          this.layoutNodes.set(nodeId, {
            ...node,
            x,
            y,
            width: nodeWidth,
            height: nodeHeight,
          });
        }
      });
    });
  }

  private calculateTreeLayout(nodes: LineageNode[], edges: LineageEdge[]): void {
    // 简化版树形布局
    this.calculateHierarchicalLayout(nodes, edges);
  }

  private calculateRadialLayout(nodes: LineageNode[], edges: LineageEdge[]): void {
    const { nodeWidth, nodeHeight } = this.graphConfig;
    const centerX = 0;
    const centerY = 0;
    const radius = Math.max(200, nodes.length * 30);

    nodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / nodes.length;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      this.layoutNodes.set(node.id, {
        ...node,
        x,
        y,
        width: nodeWidth,
        height: nodeHeight,
      });
    });
  }

  // ============ 渲染方法 ============

  render() {
    return html`
      <div class="lineage-container">
        ${this.renderHeader()}
        <svg 
          class="graph-canvas"
          viewBox=${this.getViewBox()}
          @wheel=${this.handleWheel}
          @mousedown=${this.handleMouseDown}
          @mousemove=${this.handleMouseMove}
          @mouseup=${this.handleMouseUp}
          @mouseleave=${this.handleMouseUp}
        >
          <defs>
            ${this.renderDefs()}
          </defs>
          <g transform="translate(${this.pan.x}, ${this.pan.y}) scale(${this.zoom})">
            ${this.renderEdges()}
            ${this.renderNodes()}
          </g>
        </svg>
        ${this.renderTooltip()}
        ${this.renderLegend()}
        ${this.loading ? this.renderLoading() : ''}
      </div>
    `;
  }

  private renderHeader() {
    return html`
      <div class="lineage-header">
        <span class="lineage-title">${this.title || this.i18n.t('lineage.title') || '数据血缘图'}</span>
        <div class="lineage-controls">
          ${this.graphConfig.enableSearch ? html`
            <div class="search-box">
              <svg class="search-icon" width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <circle cx="6" cy="6" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
                <path d="M9.5 9.5l2.5 2.5" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              <input 
                class="search-input"
                type="text"
                placeholder=${this.i18n.t('lineage.searchPlaceholder') || '搜索节点...'}
                .value=${this.searchQuery}
                @input=${(e: Event) => this.handleSearch((e.target as HTMLInputElement).value)}
              />
            </div>
          ` : ''}
          
          ${this.graphConfig.enableZoom ? html`
            <div class="zoom-control">
              <button class="control-btn" @click=${() => this.handleZoomOut()} ?disabled=${this.zoom <= this.graphConfig.minZoom}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <path d="M2 7h10" stroke="currentColor" stroke-width="2"/>
                </svg>
              </button>
              <span class="zoom-level">${Math.round(this.zoom * 100)}%</span>
              <button class="control-btn" @click=${() => this.handleZoomIn()} ?disabled=${this.zoom >= this.graphConfig.maxZoom}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <path d="M7 2v10M2 7h10" stroke="currentColor" stroke-width="2"/>
                </svg>
              </button>
            </div>
          ` : ''}
          
          <button class="control-btn" @click=${this.handleReset} title=${this.i18n.t('lineage.reset') || '重置视图'}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M7 1a6 6 0 100 12A6 6 0 007 1zm0 10.5a4.5 4.5 0 110-9 4.5 4.5 0 010 9z"/>
              <path d="M7 4v3l2 2" fill="none" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </button>
          
          <button class="control-btn" @click=${this.handleFitView} title=${this.i18n.t('lineage.fitView') || '适应视图'}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M1 3V1h2M13 3V1h-2M1 11v2h2M13 11v2h-2" fill="none" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  private renderDefs(): SVGTemplateResult {
    return svg`
      <marker 
        id="arrowhead" 
        markerWidth="10" 
        markerHeight="7" 
        refX="9" 
        refY="3.5" 
        orient="auto"
      >
        <polygon points="0 0, 10 3.5, 0 7" class="arrow-marker"/>
      </marker>
      <marker 
        id="arrowhead-highlighted" 
        markerWidth="10" 
        markerHeight="7" 
        refX="9" 
        refY="3.5" 
        orient="auto"
      >
        <polygon points="0 0, 10 3.5, 0 7" class="arrow-marker highlighted"/>
      </marker>
    `;
  }

  private renderNodes(): SVGTemplateResult[] {
    const nodes: SVGTemplateResult[] = [];
    
    this.layoutNodes.forEach((layoutNode, id) => {
      if (this.searchQuery && !this.filteredNodes.find(n => n.id === id)) {
        return;
      }
      
      const isHighlighted = this.highlightedPath.has(id);
      const isDimmed = this.searchQuery && !this.filteredNodes.find(n => n.id === id);
      const isSelected = this.selectedNode === id;
      
      nodes.push(this.renderNode(layoutNode, { isHighlighted, isDimmed, isSelected }));
    });
    
    return nodes;
  }

  private renderNode(
    node: LayoutNode, 
    state: { isHighlighted: boolean; isDimmed: boolean; isSelected: boolean }
  ): SVGTemplateResult {
    const { x, y, width, height } = node;
    const typeClass = `node-type-badge ${node.type}`;
    const rectClasses = classMap({
      'node-rect': true,
      selected: state.isSelected,
      highlighted: state.isHighlighted,
      dimmed: state.isDimmed,
    });

    return svg`
      <g 
        class="node-group"
        transform="translate(${x - width / 2}, ${y - height / 2})"
        @click=${() => this.handleNodeClick(node)}
        @mouseenter=${() => this.handleNodeHover(node.id)}
        @mouseleave=${() => this.handleNodeLeave()}
      >
        <rect class=${rectClasses} width=${width} height=${height} rx="8"/>
        
        <!-- Type badge -->
        <rect class=${typeClass} x="8" y="8" width="24" height="24" rx="4"/>
        
        <!-- Icon -->
        <text class="node-icon" x="20" y="25" text-anchor="middle">
          ${this.getNodeIcon(node.type)}
        </text>
        
        <!-- Label -->
        ${this.graphConfig.showLabels ? svg`
          <text class="node-label" x="40" y="24" text-anchor="start">
            ${this.truncateText(node.name, 16)}
          </text>
        ` : ''}
        
        <!-- Description -->
        ${node.description && this.graphConfig.showLabels ? svg`
          <text class="node-description" x="40" y="40" text-anchor="start">
            ${this.truncateText(node.description, 20)}
          </text>
        ` : ''}
      </g>
    `;
  }

  private renderEdges(): SVGTemplateResult[] {
    const edges: SVGTemplateResult[] = [];
    
    this.graph.edges.forEach(edge => {
      const source = this.layoutNodes.get(edge.source);
      const target = this.layoutNodes.get(edge.target);
      
      if (!source || !target) return;
      if (this.searchQuery && (!this.filteredNodes.find(n => n.id === edge.source) || !this.filteredNodes.find(n => n.id === edge.target))) {
        return;
      }

      const isHighlighted = this.highlightedPath.has(edge.source) && this.highlightedPath.has(edge.target);
      const isDimmed = this.searchQuery && (!this.filteredNodes.find(n => n.id === edge.source) || !this.filteredNodes.find(n => n.id === edge.target));
      
      edges.push(this.renderEdge(edge, source, target, { isHighlighted, isDimmed }));
    });
    
    return edges;
  }

  private renderEdge(
    edge: LineageEdge,
    source: LayoutNode,
    target: LayoutNode,
    state: { isHighlighted: boolean; isDimmed: boolean }
  ): SVGTemplateResult {
    const path = this.calculateEdgePath(source, target);
    const edgeClass = edge.type || 'data';
    const pathClasses = classMap({
      'edge-path': true,
      [edgeClass]: true,
      highlighted: state.isHighlighted,
      dimmed: state.isDimmed,
    });
    const markerEnd = state.isHighlighted ? 'url(#arrowhead-highlighted)' : 'url(#arrowhead)';

    return svg`
      <g 
        class="edge-group"
        @mouseenter=${() => this.handleEdgeHover(edge.id)}
        @mouseleave=${() => this.handleEdgeLeave()}
      >
        <path 
          class=${pathClasses}
          d=${path}
          marker-end=${markerEnd}
        />
        ${edge.label && this.graphConfig.showEdgeLabels ? svg`
          <text class="edge-label">
            <textPath href="#edge-${edge.id}" startOffset="50%" text-anchor="middle">
              ${edge.label}
            </textPath>
          </text>
        ` : ''}
      </g>
    `;
  }

  private calculateEdgePath(source: LayoutNode, target: LayoutNode): string {
    const sx = source.x;
    const sy = source.y;
    const tx = target.x;
    const ty = target.y;
    
    // 贝塞尔曲线
    const dx = tx - sx;
    const controlOffset = Math.min(Math.abs(dx) / 2, 100);
    
    return `M ${sx + source.width / 2} ${sy} C ${sx + source.width / 2 + controlOffset} ${sy}, ${tx - target.width / 2 - controlOffset} ${ty}, ${tx - target.width / 2} ${ty}`;
  }

  private renderTooltip() {
    if (!this.hoveredNode) return html``;

    const node = this.layoutNodes.get(this.hoveredNode);
    if (!node) return html``;

    return html`
      <div class="tooltip visible">
        <div class="tooltip-title">${node.name}</div>
        ${node.description ? html`
          <div class="tooltip-description">${node.description}</div>
        ` : ''}
        ${node.metadata ? html`
          <div class="tooltip-meta">
            ${Object.entries(node.metadata).map(([key, value]) => html`
              <div class="tooltip-meta-item">
                <span class="tooltip-meta-label">${key}</span>
                <span class="tooltip-meta-value">${String(value)}</span>
              </div>
            `)}
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderLegend() {
    return html`
      <div class="legend">
        <div class="legend-item">
          <span class="legend-dot" style="background: #22c55e;"></span>
          <span>${this.i18n.t('lineage.source') || '数据源'}</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: #f59e0b;"></span>
          <span>${this.i18n.t('lineage.transform') || '转换'}</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: #ef4444;"></span>
          <span>${this.i18n.t('lineage.sink') || '目标'}</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: #3b82f6;"></span>
          <span>${this.i18n.t('lineage.database') || '数据库'}</span>
        </div>
      </div>
    `;
  }

  private renderLoading() {
    return html`
      <div class="loading-overlay">
        <div class="loading-spinner"></div>
      </div>
    `;
  }

  // ============ 辅助方法 ============

  private getViewBox(): string {
    const bounds = this.getGraphBounds();
    const padding = 100;
    return `${bounds.minX - padding} ${bounds.minY - padding} ${bounds.width + padding * 2} ${bounds.height + padding * 2}`;
  }

  private getGraphBounds(): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    this.layoutNodes.forEach(node => {
      minX = Math.min(minX, node.x - node.width / 2);
      minY = Math.min(minY, node.y - node.height / 2);
      maxX = Math.max(maxX, node.x + node.width / 2);
      maxY = Math.max(maxY, node.y + node.height / 2);
    });
    
    if (minX === Infinity) {
      return { minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600 };
    }
    
    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
  }

  private getNodeIcon(type: string): string {
    const icons: Record<string, string> = {
      source: '📥',
      transform: '🔄',
      sink: '📤',
      system: '💻',
      database: '🗄️',
      api: '🔌',
      file: '📁',
      custom: '📦',
    };
    return icons[type] || '📦';
  }

  private truncateText(text: string, maxLength: number): string {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  }

  // ============ 事件处理 ============

  private handleNodeClick(node: LayoutNode): void {
    this.selectedNode = node.id;
    this.dispatchEvent(new CustomEvent('node-click', {
      detail: { node },
      bubbles: true,
      composed: true,
    }));
  }

  private handleNodeHover(nodeId: string): void {
    this.hoveredNode = nodeId;
  }

  private handleNodeLeave(): void {
    this.hoveredNode = null;
  }

  private handleEdgeHover(edgeId: string): void {
    this.hoveredEdge = edgeId;
  }

  private handleEdgeLeave(): void {
    this.hoveredEdge = null;
  }

  private handleSearch(query: string): void {
    this.searchQuery = query;
    this.calculateLayout();
  }

  private handleWheel(e: WheelEvent): void {
    if (!this.graphConfig.enableZoom) return;
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(this.graphConfig.minZoom, Math.min(this.graphConfig.maxZoom, this.zoom * delta));
    this.zoom = newZoom;
  }

  private handleMouseDown(e: MouseEvent): void {
    if (!this.graphConfig.enablePan) return;
    this.isDragging = true;
    this.dragStart = { x: e.clientX - this.pan.x, y: e.clientY - this.pan.y };
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDragging || !this.dragStart) return;
    this.pan = {
      x: e.clientX - this.dragStart.x,
      y: e.clientY - this.dragStart.y,
    };
  }

  private handleMouseUp(): void {
    this.isDragging = false;
    this.dragStart = null;
  }

  private handleZoomIn(): void {
    this.zoom = Math.min(this.graphConfig.maxZoom, this.zoom * 1.2);
  }

  private handleZoomOut(): void {
    this.zoom = Math.max(this.graphConfig.minZoom, this.zoom / 1.2);
  }

  private handleReset(): void {
    this.zoom = 1;
    this.pan = { x: 0, y: 0 };
    this.selectedNode = null;
    this.searchQuery = '';
    this.calculateLayout();
  }

  private handleFitView(): void {
    const bounds = this.getGraphBounds();
    const padding = 50;
    // 简化实现：重置缩放和平移
    this.zoom = 0.8;
    this.pan = { x: padding, y: padding };
  }

  // ============ 公共方法 ============

  /**
   * 高亮指定路径
   */
  highlightNodePath(nodeIds: string[]): void {
    this.highlightPath = nodeIds.join('->');
  }

  /**
   * 清除高亮
   */
  clearHighlight(): void {
    this.highlightPath = '';
  }

  /**
   * 获取选中的节点
   */
  getSelectedNode(): LineageNode | null {
    return this.selectedNode ? this.layoutNodes.get(this.selectedNode) || null : null;
  }

  /**
   * 导出为图片
   */
  async exportAsImage(): Promise<string> {
    // 简化实现：返回空字符串
    // 实际实现需要使用 html2canvas 或类似库
    return '';
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-lineage-graph': ScLineageGraph;
  }
}
