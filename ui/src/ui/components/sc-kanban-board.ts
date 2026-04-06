/**
 * SecuClaw Kanban Board Component - 看板组件
 * 
 * 支持拖拽排序、列间移动、卡片自定义渲染
 * 用于展示安全事件、任务流转等场景
 */

import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';
import { repeat } from 'lit/directives/repeat.js';

// ============ 类型定义 ============

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  tags?: string[];
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  dueDate?: number;
  createdAt?: number;
  updatedAt?: number;
  metadata?: Record<string, unknown>;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color?: string;
  icon?: string;
  limit?: number;
  cards: KanbanCard[];
  wipLimit?: number;
}

export interface KanbanConfig {
  enableDragDrop?: boolean;
  enableCardAdd?: boolean;
  enableCardEdit?: boolean;
  enableCardDelete?: boolean;
  enableColumnCollapse?: boolean;
  showCardCount?: boolean;
  showWipLimit?: boolean;
  cardHeight?: 'auto' | 'fixed' | 'compact';
  compact?: boolean;
  groupBy?: string;
  sortBy?: 'priority' | 'dueDate' | 'createdAt' | 'updatedAt';
}

export type DropPosition = 'before' | 'after' | 'inside';

// ============ 组件定义 ============

@customElement('sc-kanban-board')
export class ScKanbanBoard extends LitElement {
  // ============ 属性 ============

  @property({ type: Array })
  columns: KanbanColumn[] = [];

  @property({ type: Object })
  config: KanbanConfig = {};

  @property({ type: String })
  title: string = '';

  @property({ type: Boolean })
  loading: boolean = false;

  // ============ 状态 ============

  @state()
  private collapsedColumns: Set<string> = new Set();

  @state()
  private draggedCard: { card: KanbanCard; columnId: string } | null = null;

  @state()
  private dragOverColumn: string | null = null;

  @state()
  private dragOverCard: { cardId: string; position: DropPosition } | null = null;

  @state()
  private editingCard: string | null = null;

  @state()
  private addingCardToColumn: string | null = null;

  @state()
  private newCardTitle: string = '';

  private i18n = new I18nController(this);

  // ============ 样式 ============

  static styles = css`
    :host {
      display: block;
      font-family: var(--sc-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
    }

    .kanban-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--sc-bg-primary, #0f0f1a);
    }

    .kanban-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--sc-spacing-lg, 16px);
      border-bottom: 1px solid var(--sc-border-color, rgba(255, 255, 255, 0.1));
    }

    .kanban-title {
      font-size: var(--sc-font-size-lg, 18px);
      font-weight: 600;
      color: var(--sc-text-primary, #fff);
    }

    .kanban-controls {
      display: flex;
      gap: var(--sc-spacing-sm, 8px);
    }

    .control-btn {
      background: transparent;
      border: 1px solid var(--sc-border-color, rgba(255, 255, 255, 0.1));
      color: var(--sc-text-secondary, rgba(255, 255, 255, 0.6));
      padding: 6px 12px;
      border-radius: var(--sc-radius-sm, 4px);
      cursor: pointer;
      font-size: var(--sc-font-size-sm, 13px);
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .control-btn:hover {
      background: var(--sc-bg-hover, rgba(255, 255, 255, 0.05));
      color: var(--sc-text-primary, #fff);
    }

    .kanban-body {
      display: flex;
      gap: var(--sc-spacing-md, 12px);
      padding: var(--sc-spacing-md, 12px);
      overflow-x: auto;
      flex: 1;
      min-height: 0;
    }

    .kanban-column {
      flex-shrink: 0;
      width: 300px;
      background: var(--sc-bg-secondary, #1a1a2e);
      border-radius: var(--sc-radius-lg, 12px);
      display: flex;
      flex-direction: column;
      max-height: 100%;
      transition: all 0.3s;
    }

    .kanban-column.collapsed {
      width: 48px;
      min-width: 48px;
    }

    .kanban-column.drag-over {
      background: var(--sc-primary-light, rgba(99, 102, 241, 0.1));
      border: 2px dashed var(--sc-primary, #6366f1);
    }

    .column-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--sc-spacing-md, 12px) var(--sc-spacing-lg, 16px);
      border-bottom: 1px solid var(--sc-border-color, rgba(255, 255, 255, 0.05));
    }

    .column-title-wrapper {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm, 8px);
      flex: 1;
      min-width: 0;
    }

    .column-icon {
      font-size: 16px;
    }

    .column-title {
      font-size: var(--sc-font-size-md, 14px);
      font-weight: 600;
      color: var(--sc-text-primary, #fff);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .column-count {
      background: var(--sc-bg-tertiary, #16162a);
      padding: 2px 8px;
      border-radius: var(--sc-radius-full, 999px);
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, rgba(255, 255, 255, 0.6));
    }

    .column-count.over-limit {
      background: var(--sc-danger-light, rgba(239, 68, 68, 0.2));
      color: var(--sc-danger, #ef4444);
    }

    .column-actions {
      display: flex;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .column-header:hover .column-actions {
      opacity: 1;
    }

    .action-btn {
      background: transparent;
      border: none;
      color: var(--sc-text-tertiary, rgba(255, 255, 255, 0.4));
      cursor: pointer;
      padding: 4px;
      border-radius: var(--sc-radius-sm, 4px);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background: var(--sc-bg-hover, rgba(255, 255, 255, 0.1));
      color: var(--sc-text-primary, #fff);
    }

    .column-cards {
      flex: 1;
      overflow-y: auto;
      padding: var(--sc-spacing-sm, 8px);
      min-height: 100px;
    }

    .column-cards::-webkit-scrollbar {
      width: 6px;
    }

    .column-cards::-webkit-scrollbar-track {
      background: transparent;
    }

    .column-cards::-webkit-scrollbar-thumb {
      background: var(--sc-border-color, rgba(255, 255, 255, 0.1));
      border-radius: 3px;
    }

    .card-list {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-sm, 8px);
      min-height: 60px;
    }

    .kanban-card {
      background: var(--sc-bg-elevated, #2a2a4a);
      border-radius: var(--sc-radius-md, 8px);
      padding: var(--sc-spacing-md, 12px);
      cursor: grab;
      transition: all 0.2s;
      border: 2px solid transparent;
    }

    .kanban-card:hover {
      background: var(--sc-bg-card-hover, #3a3a5a);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .kanban-card.dragging {
      opacity: 0.5;
      cursor: grabbing;
    }

    .kanban-card.drag-over-before {
      border-top: 2px solid var(--sc-primary, #6366f1);
    }

    .kanban-card.drag-over-after {
      border-bottom: 2px solid var(--sc-primary, #6366f1);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--sc-spacing-sm, 8px);
    }

    .card-title {
      font-size: var(--sc-font-size-sm, 13px);
      font-weight: 500;
      color: var(--sc-text-primary, #fff);
      flex: 1;
      word-break: break-word;
    }

    .card-priority {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .card-priority.critical { background: #ef4444; }
    .card-priority.high { background: #f59e0b; }
    .card-priority.medium { background: #3b82f6; }
    .card-priority.low { background: #6b7280; }

    .card-description {
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, rgba(255, 255, 255, 0.6));
      margin-top: var(--sc-spacing-xs, 4px);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-tags {
      display: flex;
      flex-wrap: wrap;
      gap: var(--sc-spacing-xs, 4px);
      margin-top: var(--sc-spacing-sm, 8px);
    }

    .card-tag {
      background: var(--sc-bg-tertiary, #16162a);
      padding: 2px 6px;
      border-radius: var(--sc-radius-sm, 4px);
      font-size: 10px;
      color: var(--sc-text-secondary, rgba(255, 255, 255, 0.6));
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: var(--sc-spacing-sm, 8px);
      padding-top: var(--sc-spacing-sm, 8px);
      border-top: 1px solid var(--sc-border-color, rgba(255, 255, 255, 0.05));
    }

    .card-meta {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm, 8px);
    }

    .card-assignee {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .assignee-avatar {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--sc-primary, #6366f1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: #fff;
    }

    .assignee-name {
      font-size: var(--sc-font-size-xs, 11px);
      color: var(--sc-text-secondary, rgba(255, 255, 255, 0.6));
    }

    .card-due-date {
      font-size: var(--sc-font-size-xs, 11px);
      color: var(--sc-text-secondary, rgba(255, 255, 255, 0.6));
    }

    .card-due-date.overdue {
      color: var(--sc-danger, #ef4444);
    }

    .card-due-date.today {
      color: var(--sc-warning, #f59e0b;
    }

    .card-actions {
      display: flex;
      gap: 2px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .kanban-card:hover .card-actions {
      opacity: 1;
    }

    .add-card-btn {
      width: 100%;
      padding: var(--sc-spacing-sm, 8px);
      background: transparent;
      border: 1px dashed var(--sc-border-color, rgba(255, 255, 255, 0.2));
      border-radius: var(--sc-radius-md, 8px);
      color: var(--sc-text-secondary, rgba(255, 255, 255, 0.6));
      cursor: pointer;
      font-size: var(--sc-font-size-sm, 13px);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: all 0.2s;
      margin-top: var(--sc-spacing-sm, 8px);
    }

    .add-card-btn:hover {
      background: var(--sc-bg-hover, rgba(255, 255, 255, 0.05));
      border-color: var(--sc-primary, #6366f1);
      color: var(--sc-primary, #6366f1);
    }

    .add-card-form {
      background: var(--sc-bg-elevated, #2a2a4a);
      border-radius: var(--sc-radius-md, 8px);
      padding: var(--sc-spacing-sm, 8px);
      margin-top: var(--sc-spacing-sm, 8px);
    }

    .add-card-input {
      width: 100%;
      padding: var(--sc-spacing-sm, 8px);
      background: var(--sc-bg-tertiary, #16162a);
      border: 1px solid var(--sc-border-color, rgba(255, 255, 255, 0.1));
      border-radius: var(--sc-radius-sm, 4px);
      color: var(--sc-text-primary, #fff);
      font-size: var(--sc-font-size-sm, 13px);
      resize: none;
      min-height: 60px;
    }

    .add-card-input:focus {
      outline: none;
      border-color: var(--sc-primary, #6366f1);
    }

    .add-card-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--sc-spacing-xs, 4px);
      margin-top: var(--sc-spacing-sm, 8px);
    }

    .btn-primary {
      background: var(--sc-primary, #6366f1);
      border: none;
      color: #fff;
      padding: 6px 12px;
      border-radius: var(--sc-radius-sm, 4px);
      cursor: pointer;
      font-size: var(--sc-font-size-sm, 13px);
      transition: all 0.2s;
    }

    .btn-primary:hover {
      background: var(--sc-primary-dark, #4f46e5);
    }

    .btn-secondary {
      background: transparent;
      border: 1px solid var(--sc-border-color, rgba(255, 255, 255, 0.1));
      color: var(--sc-text-secondary, rgba(255, 255, 255, 0.6));
      padding: 6px 12px;
      border-radius: var(--sc-radius-sm, 4px);
      cursor: pointer;
      font-size: var(--sc-font-size-sm, 13px);
      transition: all 0.2s;
    }

    .btn-secondary:hover {
      background: var(--sc-bg-hover, rgba(255, 255, 255, 0.05));
    }

    .empty-column {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--sc-spacing-xl, 32px);
      color: var(--sc-text-tertiary, rgba(255, 255, 255, 0.3));
      text-align: center;
    }

    .empty-icon {
      font-size: 32px;
      margin-bottom: var(--sc-spacing-sm, 8px);
    }

    .collapsed-column {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--sc-spacing-md, 12px);
      gap: var(--sc-spacing-sm, 8px);
    }

    .collapsed-icon {
      font-size: 20px;
    }

    .collapsed-count {
      background: var(--sc-primary, #6366f1);
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: #fff;
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
      border-radius: var(--sc-radius-lg, 12px);
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

    .drop-zone {
      min-height: 4px;
      border-radius: 2px;
      transition: all 0.2s;
    }

    .drop-zone.active {
      background: var(--sc-primary-light, rgba(99, 102, 241, 0.3));
      min-height: 60px;
      border: 2px dashed var(--sc-primary, #6366f1);
    }

    /* Compact mode */
    .kanban-card.compact {
      padding: var(--sc-spacing-sm, 8px);
    }

    .kanban-card.compact .card-description,
    .kanban-card.compact .card-tags,
    .kanban-card.compact .card-footer {
      display: none;
    }
  `;

  // ============ 计算属性 ============

  private get kanbanConfig(): KanbanConfig {
    return {
      enableDragDrop: true,
      enableCardAdd: true,
      enableCardEdit: true,
      enableCardDelete: true,
      enableColumnCollapse: true,
      showCardCount: true,
      showWipLimit: true,
      cardHeight: 'auto',
      compact: false,
      sortBy: 'priority',
      ...this.config,
    };
  }

  // ============ 渲染方法 ============

  render() {
    return html`
      <div class="kanban-container">
        ${this.title ? this.renderHeader() : ''}
        <div class="kanban-body">
          ${repeat(this.columns, (col) => col.id, (col) => this.renderColumn(col))}
        </div>
        ${this.loading ? this.renderLoading() : ''}
      </div>
    `;
  }

  private renderHeader() {
    return html`
      <div class="kanban-header">
        <h2 class="kanban-title">${this.title}</h2>
        <div class="kanban-controls">
          <button class="control-btn" @click=${this.handleCollapseAll}>
            <span>📂</span>
            <span>${this.i18n.t('kanban.collapseAll') || '收起'}</span>
          </button>
          <button class="control-btn" @click=${this.handleExpandAll}>
            <span>📄</span>
            <span>${this.i18n.t('kanban.expandAll') || '展开'}</span>
          </button>
        </div>
      </div>
    `;
  }

  private renderColumn(column: KanbanColumn) {
    const isCollapsed = this.collapsedColumns.has(column.id);
    const isDragOver = this.dragOverColumn === column.id;
    const isOverLimit = column.wipLimit && column.cards.length > column.wipLimit;

    if (isCollapsed) {
      return this.renderCollapsedColumn(column);
    }

    return html`
      <div 
        class="kanban-column ${isDragOver ? 'drag-over' : ''}"
        data-column-id=${column.id}
        @dragover=${this.handleDragOver}
        @dragleave=${this.handleDragLeave}
        @drop=${(e: DragEvent) => this.handleDrop(e, column.id)}
      >
        <div class="column-header">
          <div class="column-title-wrapper">
            ${column.icon ? html`<span class="column-icon">${column.icon}</span>` : ''}
            <span class="column-title">${column.title}</span>
            ${this.kanbanConfig.showCardCount ? html`
              <span class="column-count ${isOverLimit ? 'over-limit' : ''}">
                ${column.cards.length}${column.wipLimit ? `/${column.wipLimit}` : ''}
              </span>
            ` : ''}
          </div>
          <div class="column-actions">
            ${this.kanbanConfig.enableCardAdd ? html`
              <button class="action-btn" @click=${() => this.handleAddCard(column.id)} title="添加卡片">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            ` : ''}
            ${this.kanbanConfig.enableColumnCollapse ? html`
              <button class="action-btn" @click=${() => this.toggleColumnCollapse(column.id)} title="收起">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <path d="M10 3L5 7l5 4" fill="none" stroke="currentColor" stroke-width="2"/>
                </svg>
              </button>
            ` : ''}
          </div>
        </div>
        <div class="column-cards">
          ${this.renderCardList(column)}
        </div>
      </div>
    `;
  }

  private renderCollapsedColumn(column: KanbanColumn) {
    return html`
      <div 
        class="kanban-column collapsed"
        @click=${() => this.toggleColumnCollapse(column.id)}
        style=${column.color ? `border-left: 3px solid ${column.color}` : ''}
      >
        <div class="collapsed-column">
          ${column.icon ? html`<span class="collapsed-icon">${column.icon}</span>` : ''}
          <span class="collapsed-count">${column.cards.length}</span>
        </div>
      </div>
    `;
  }

  private renderCardList(column: KanbanColumn) {
    if (column.cards.length === 0) {
      return html`
        <div class="empty-column">
          <div class="empty-icon">📭</div>
          <div>${this.i18n.t('kanban.noCards') || '暂无卡片'}</div>
        </div>
        ${this.renderAddCardForm(column.id)}
      `;
    }

    const sortedCards = this.sortCards(column.cards);

    return html`
      <div class="card-list">
        ${sortedCards.map((card, index) => this.renderCard(card, column.id, index))}
        ${this.renderAddCardForm(column.id)}
      </div>
    `;
  }

  private renderCard(card: KanbanCard, columnId: string, index: number) {
    const isDragging = this.draggedCard?.card.id === card.id;
    const dragOverClass = this.getDragOverClass(card.id);

    return html`
      <div 
        class="kanban-card ${isDragging ? 'dragging' : ''} ${dragOverClass} ${this.kanbanConfig.compact ? 'compact' : ''}"
        draggable=${this.kanbanConfig.enableDragDrop}
        data-card-id=${card.id}
        data-column-id=${columnId}
        @dragstart=${(e: DragEvent) => this.handleDragStart(e, card, columnId)}
        @dragend=${this.handleDragEnd}
        @dragover=${this.handleCardDragOver}
        @click=${() => this.handleCardClick(card)}
      >
        <div class="card-header">
          <span class="card-title">${card.title}</span>
          ${card.priority ? html`<span class="card-priority ${card.priority}"></span>` : ''}
        </div>
        ${card.description ? html`
          <div class="card-description">${card.description}</div>
        ` : ''}
        ${card.tags && card.tags.length > 0 ? html`
          <div class="card-tags">
            ${card.tags.map(tag => html`<span class="card-tag">${tag}</span>`)}
          </div>
        ` : ''}
        <div class="card-footer">
          <div class="card-meta">
            ${card.assignee ? html`
              <div class="card-assignee">
                <div class="assignee-avatar">
                  ${card.assignee.avatar ? '' : card.assignee.name.charAt(0).toUpperCase()}
                </div>
                <span class="assignee-name">${card.assignee.name}</span>
              </div>
            ` : ''}
            ${card.dueDate ? html`
              <div class="card-due-date ${this.getDueDateClass(card.dueDate)}">
                ${this.formatDueDate(card.dueDate)}
              </div>
            ` : ''}
          </div>
          <div class="card-actions">
            ${this.kanbanConfig.enableCardEdit ? html`
              <button class="action-btn" @click=${(e: Event) => { e.stopPropagation(); this.handleEditCard(card); }} title="编辑">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M9.5 1l1.5 1.5-7 7H2V7l7.5-6z"/>
                </svg>
              </button>
            ` : ''}
            ${this.kanbanConfig.enableCardDelete ? html`
              <button class="action-btn" @click=${(e: Event) => { e.stopPropagation(); this.handleDeleteCard(card); }} title="删除">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M2 3h8v8a1 1 0 01-1 1H3a1 1 0 01-1-1V3zm2-1h4V1H4v1z"/>
                </svg>
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  private renderAddCardForm(columnId: string) {
    if (this.addingCardToColumn !== columnId) {
      return this.kanbanConfig.enableCardAdd ? html`
        <button class="add-card-btn" @click=${() => this.handleAddCard(columnId)}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span>${this.i18n.t('kanban.addCard') || '添加卡片'}</span>
        </button>
      ` : '';
    }

    return html`
      <div class="add-card-form">
        <textarea 
          class="add-card-input"
          placeholder=${this.i18n.t('kanban.cardTitlePlaceholder') || '输入卡片标题...'}
          .value=${this.newCardTitle}
          @input=${(e: Event) => this.newCardTitle = (e.target as HTMLTextAreaElement).value}
          @keydown=${this.handleAddCardKeydown}
        ></textarea>
        <div class="add-card-actions">
          <button class="btn-secondary" @click=${this.cancelAddCard}>${this.i18n.t('common.cancel') || '取消'}</button>
          <button class="btn-primary" @click=${() => this.confirmAddCard(columnId)}>${this.i18n.t('common.add') || '添加'}</button>
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

  private sortCards(cards: KanbanCard[]): KanbanCard[] {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    
    return [...cards].sort((a, b) => {
      switch (this.kanbanConfig.sortBy) {
        case 'priority':
          return (priorityOrder[a.priority || 'low'] ?? 3) - (priorityOrder[b.priority || 'low'] ?? 3);
        case 'dueDate':
          return (a.dueDate || Infinity) - (b.dueDate || Infinity);
        case 'createdAt':
          return (b.createdAt || 0) - (a.createdAt || 0);
        case 'updatedAt':
          return (b.updatedAt || 0) - (a.updatedAt || 0);
        default:
          return 0;
      }
    });
  }

  private getDragOverClass(cardId: string): string {
    if (!this.dragOverCard || this.dragOverCard.cardId !== cardId) return '';
    return `drag-over-${this.dragOverCard.position}`;
  }

  private getDueDateClass(dueDate: number): string {
    const now = Date.now();
    const diff = dueDate - now;
    const oneDay = 24 * 60 * 60 * 1000;
    
    if (diff < 0) return 'overdue';
    if (diff < oneDay) return 'today';
    return '';
  }

  private formatDueDate(dueDate: number): string {
    const date = new Date(dueDate);
    const now = new Date();
    const diff = dueDate - now.getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    if (diff < 0) {
      return `${this.i18n.t('kanban.overdue') || '逾期'} ${Math.abs(Math.floor(diff / oneDay))} ${this.i18n.t('kanban.days') || '天'}`;
    }
    if (diff < oneDay) {
      return this.i18n.t('kanban.today') || '今天';
    }
    if (diff < 7 * oneDay) {
      return `${Math.floor(diff / oneDay)} ${this.i18n.t('kanban.daysLeft') || '天后'}`;
    }
    return date.toLocaleDateString();
  }

  // ============ 事件处理 ============

  private toggleColumnCollapse(columnId: string): void {
    if (this.collapsedColumns.has(columnId)) {
      this.collapsedColumns.delete(columnId);
    } else {
      this.collapsedColumns.add(columnId);
    }
    this.requestUpdate();
  }

  private handleCollapseAll(): void {
    this.columns.forEach(col => this.collapsedColumns.add(col.id));
    this.requestUpdate();
  }

  private handleExpandAll(): void {
    this.collapsedColumns.clear();
    this.requestUpdate();
  }

  private handleAddCard(columnId: string): void {
    this.addingCardToColumn = columnId;
    this.newCardTitle = '';
    this.requestUpdate();
  }

  private cancelAddCard(): void {
    this.addingCardToColumn = null;
    this.newCardTitle = '';
    this.requestUpdate();
  }

  private confirmAddCard(columnId: string): void {
    if (!this.newCardTitle.trim()) return;

    const newCard: KanbanCard = {
      id: `card-${Date.now()}`,
      title: this.newCardTitle.trim(),
      createdAt: Date.now(),
    };

    this.dispatchEvent(new CustomEvent('card-add', {
      detail: { columnId, card: newCard },
      bubbles: true,
      composed: true,
    }));

    this.addingCardToColumn = null;
    this.newCardTitle = '';
    this.requestUpdate();
  }

  private handleAddCardKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (this.addingCardToColumn) {
        this.confirmAddCard(this.addingCardToColumn);
      }
    }
    if (e.key === 'Escape') {
      this.cancelAddCard();
    }
  }

  private handleCardClick(card: KanbanCard): void {
    this.dispatchEvent(new CustomEvent('card-click', {
      detail: { card },
      bubbles: true,
      composed: true,
    }));
  }

  private handleEditCard(card: KanbanCard): void {
    this.dispatchEvent(new CustomEvent('card-edit', {
      detail: { card },
      bubbles: true,
      composed: true,
    }));
  }

  private handleDeleteCard(card: KanbanCard): void {
    this.dispatchEvent(new CustomEvent('card-delete', {
      detail: { card },
      bubbles: true,
      composed: true,
    }));
  }

  // ============ 拖拽事件 ============

  private handleDragStart(e: DragEvent, card: KanbanCard, columnId: string): void {
    if (!this.kanbanConfig.enableDragDrop) return;
    
    this.draggedCard = { card, columnId };
    (e.target as HTMLElement).classList.add('dragging');
    
    e.dataTransfer!.effectAllowed = 'move';
    e.dataTransfer!.setData('text/plain', card.id);
  }

  private handleDragEnd(e: DragEvent): void {
    (e.target as HTMLElement).classList.remove('dragging');
    this.draggedCard = null;
    this.dragOverColumn = null;
    this.dragOverCard = null;
    this.requestUpdate();
  }

  private handleDragOver(e: DragEvent): void {
    if (!this.draggedCard) return;
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
    
    const columnEl = (e.currentTarget as HTMLElement);
    this.dragOverColumn = columnEl.dataset.columnId || null;
  }

  private handleDragLeave(e: DragEvent): void {
    const columnEl = (e.currentTarget as HTMLElement);
    if (!columnEl.contains(e.relatedTarget as Node)) {
      this.dragOverColumn = null;
    }
  }

  private handleCardDragOver(e: DragEvent): void {
    if (!this.draggedCard) return;
    e.stopPropagation();
    
    const cardEl = (e.currentTarget as HTMLElement);
    const cardId = cardEl.dataset.cardId || '';
    const rect = cardEl.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    this.dragOverCard = {
      cardId,
      position: y < rect.height / 2 ? 'before' : 'after',
    };
    this.requestUpdate();
  }

  private handleDrop(e: DragEvent, targetColumnId: string): void {
    if (!this.draggedCard) return;
    e.preventDefault();
    
    const { card, columnId: sourceColumnId } = this.draggedCard;
    
    this.dispatchEvent(new CustomEvent('card-move', {
      detail: {
        card,
        sourceColumnId,
        targetColumnId,
        position: this.dragOverCard?.position || 'after',
        targetCardId: this.dragOverCard?.cardId,
      },
      bubbles: true,
      composed: true,
    }));

    this.draggedCard = null;
    this.dragOverColumn = null;
    this.dragOverCard = null;
    this.requestUpdate();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-kanban-board': ScKanbanBoard;
  }
}
