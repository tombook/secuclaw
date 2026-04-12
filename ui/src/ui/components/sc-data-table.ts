/**
 * SecuClaw Data Table Component - 数据表格组件
 * 
 * 支持排序、筛选、分页、行选择、自定义渲染
 * 用于展示安全数据列表（漏洞、事件、威胁等）
 */

import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';
import { repeat } from 'lit/directives/repeat.js';
import { classMap } from 'lit/directives/class-map.js';

// ============ 类型定义 ============

export interface TableColumn<T = Record<string, unknown>> {
  key: keyof T | string;
  header: string;
  width?: string;
  minWidth?: string;
  sortable?: boolean;
  sortableKey?: string;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right';
  render?: (value: unknown, row: T, index: number) => unknown;
  renderHeader?: (column: TableColumn<T>) => unknown;
  filterable?: boolean;
  filterType?: 'text' | 'select' | 'date' | 'number';
  filterOptions?: Array<{ label: string; value: string | number }>;
  ellipsis?: boolean;
  tooltip?: boolean;
}

export interface TableConfig {
  showHeader?: boolean;
  showIndex?: boolean;
  showCheckbox?: boolean;
  showPagination?: boolean;
  showQuickJumper?: boolean;
  showSizeChanger?: boolean;
  showTotal?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  stickyHeader?: boolean;
  bordered?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  emptyText?: string;
  loading?: boolean;
  rowKey?: string;
  expandable?: {
    expandedRowRender?: (row: Record<string, unknown>) => unknown;
    rowExpandable?: (row: Record<string, unknown>) => boolean;
    expandedRowKeys?: string[];
    onExpand?: (expanded: boolean, row: Record<string, unknown>) => void;
  };
}

export type SortOrder = 'asc' | 'desc' | null;

export interface SortState {
  key: string;
  order: SortOrder;
}

export interface FilterState {
  key: string;
  value: string | number | undefined;
}

export interface TableSelection<T = Record<string, unknown>> {
  selectedRowKeys: Set<string>;
  selectedRows: T[];
}

// ============ 组件定义 ============

@customElement('sc-data-table')
export class ScDataTable<T = Record<string, unknown>> extends LitElement {
  // ============ 属性 ============

  @property({ type: Array })
  columns: TableColumn<T>[] = [];

  @property({ type: Array })
  data: T[] = [];

  @property({ type: Object })
  config: TableConfig = {};

  @property({ type: Number })
  total: number = 0;

  @property({ type: Number })
  page: number = 1;

  @property({ type: Number })
  pageSize: number = 10;

  @property({ type: Boolean })
  loading: boolean = false;

  @property({ type: String })
  rowKey: string = 'id';

  // ============ 状态 ============

  @state()
  private sortState: SortState | null = null;

  @state()
  private filterStates: Map<string, FilterState> = new Map();

  @state()
  private selectedRowKeys: Set<string> = new Set();

  @state()
  private expandedRowKeys: Set<string> = new Set();

  @state()
  private activeFilterKey: string | null = null;

  private i18n = new I18nController(this);

  // ============ 样式 ============

  static styles = css`
    :host {
      display: block;
      font-family: var(--sc-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
    }

    .table-container {
      background: var(--sc-bg-secondary, #1a1a2e);
      border-radius: var(--sc-radius-lg, 12px);
      overflow: hidden;
    }

    .table-wrapper {
      overflow-x: auto;
      overflow-y: visible;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      border-spacing: 0;
      table-layout: auto;
    }

    thead {
      background: var(--sc-bg-tertiary, #16162a);
    }

    thead.sticky {
      position: sticky;
      top: 0;
      z-index: 10;
    }

    th {
      padding: var(--sc-spacing-md, 12px) var(--sc-spacing-lg, 16px);
      text-align: left;
      font-weight: 600;
      font-size: var(--sc-font-size-sm, 13px);
      color: var(--sc-text-secondary, rgba(255, 255, 255, 0.6));
      border-bottom: 1px solid var(--sc-border-color, rgba(255, 255, 255, 0.1));
      white-space: nowrap;
      user-select: none;
    }

    th.center { text-align: center; }
    th.right { text-align: right; }

    th.sortable {
      cursor: pointer;
      transition: background 0.2s;
    }

    th.sortable:hover {
      background: var(--sc-bg-hover, rgba(255, 255, 255, 0.05));
    }

    th.fixed-left {
      position: sticky;
      left: 0;
      background: var(--sc-bg-tertiary, #16162a);
      z-index: 5;
    }

    th.fixed-right {
      position: sticky;
      right: 0;
      background: var(--sc-bg-tertiary, #16162a);
      z-index: 5;
    }

    .sort-icon {
      display: inline-flex;
      flex-direction: column;
      margin-left: 4px;
      vertical-align: middle;
    }

    .sort-icon svg {
      width: 10px;
      height: 10px;
      fill: var(--sc-text-tertiary, rgba(255, 255, 255, 0.3));
    }

    .sort-icon.active svg { fill: var(--sc-primary, #6366f1); }
    .sort-icon.desc svg.up { opacity: 0.3; }
    .sort-icon.asc svg.down { opacity: 0.3; }

    .filter-trigger {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 6px;
      border-radius: var(--sc-radius-sm, 4px);
      cursor: pointer;
      transition: background 0.2s;
    }

    .filter-trigger:hover {
      background: var(--sc-bg-hover, rgba(255, 255, 255, 0.1));
    }

    .filter-trigger.active {
      background: var(--sc-primary, #6366f1);
    }

    td {
      padding: var(--sc-spacing-md, 12px) var(--sc-spacing-lg, 16px);
      font-size: var(--sc-font-size-sm, 13px);
      color: var(--sc-text-primary, #fff);
      border-bottom: 1px solid var(--sc-border-color, rgba(255, 255, 255, 0.05));
      vertical-align: middle;
    }

    td.center { text-align: center; }
    td.right { text-align: right; }

    tr:hover td {
      background: var(--sc-bg-hover, rgba(255, 255, 255, 0.02));
    }

    tr.striped td {
      background: var(--sc-bg-striped, rgba(255, 255, 255, 0.01));
    }

    tr.selected td {
      background: var(--sc-primary-light, rgba(99, 102, 241, 0.1));
    }

    td.fixed-left {
      position: sticky;
      left: 0;
      background: var(--sc-bg-secondary, #1a1a2e);
      z-index: 3;
    }

    td.fixed-right {
      position: sticky;
      right: 0;
      background: var(--sc-bg-secondary, #1a1a2e);
      z-index: 3;
    }

    .ellipsis {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .checkbox-cell {
      width: 40px;
    }

    .checkbox {
      width: 16px;
      height: 16px;
      border: 1.5px solid var(--sc-border-color, rgba(255, 255, 255, 0.3));
      border-radius: var(--sc-radius-sm, 4px);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .checkbox:hover {
      border-color: var(--sc-primary, #6366f1);
    }

    .checkbox.checked {
      background: var(--sc-primary, #6366f1);
      border-color: var(--sc-primary, #6366f1);
    }

    .checkbox svg {
      width: 12px;
      height: 12px;
      fill: #fff;
    }

    .index-cell {
      width: 60px;
      color: var(--sc-text-tertiary, rgba(255, 255, 255, 0.4));
      font-size: var(--sc-font-size-xs, 12px);
    }

    .expand-icon {
      width: 20px;
      height: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: var(--sc-radius-sm, 4px);
      transition: all 0.2s;
    }

    .expand-icon:hover {
      background: var(--sc-bg-hover, rgba(255, 255, 255, 0.1));
    }

    .expand-icon svg {
      width: 14px;
      height: 14px;
      fill: var(--sc-text-secondary, rgba(255, 255, 255, 0.6));
      transition: transform 0.2s;
    }

    .expand-icon.expanded svg {
      transform: rotate(90deg);
    }

    .expanded-row td {
      background: var(--sc-bg-elevated, #2a2a4a);
      padding: var(--sc-spacing-lg, 16px);
    }

    .pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--sc-spacing-md, 12px) var(--sc-spacing-lg, 16px);
      border-top: 1px solid var(--sc-border-color, rgba(255, 255, 255, 0.1));
    }

    .pagination-info {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-md, 12px);
      font-size: var(--sc-font-size-sm, 13px);
      color: var(--sc-text-secondary, rgba(255, 255, 255, 0.6));
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-xs, 4px);
    }

    .page-btn {
      min-width: 32px;
      height: 32px;
      padding: 0 8px;
      border: 1px solid var(--sc-border-color, rgba(255, 255, 255, 0.1));
      background: transparent;
      color: var(--sc-text-primary, #fff);
      border-radius: var(--sc-radius-sm, 4px);
      cursor: pointer;
      font-size: var(--sc-font-size-sm, 13px);
      transition: all 0.2s;
    }

    .page-btn:hover:not(:disabled) {
      background: var(--sc-bg-hover, rgba(255, 255, 255, 0.05));
      border-color: var(--sc-primary, #6366f1);
    }

    .page-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .page-btn.active {
      background: var(--sc-primary, #6366f1);
      border-color: var(--sc-primary, #6366f1);
    }

    .page-jumper {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-xs, 4px);
    }

    .page-jumper input {
      width: 50px;
      height: 32px;
      text-align: center;
      border: 1px solid var(--sc-border-color, rgba(255, 255, 255, 0.1));
      background: transparent;
      color: var(--sc-text-primary, #fff);
      border-radius: var(--sc-radius-sm, 4px);
      font-size: var(--sc-font-size-sm, 13px);
    }

    .page-jumper input:focus {
      outline: none;
      border-color: var(--sc-primary, #6366f1);
    }

    .size-changer select {
      height: 32px;
      padding: 0 24px 0 8px;
      border: 1px solid var(--sc-border-color, rgba(255, 255, 255, 0.1));
      background: transparent;
      color: var(--sc-text-primary, #fff);
      border-radius: var(--sc-radius-sm, 4px);
      font-size: var(--sc-font-size-sm, 13px);
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 8L2 4h8z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 8px center;
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
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--sc-spacing-xl, 48px);
      color: var(--sc-text-tertiary, rgba(255, 255, 255, 0.4));
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: var(--sc-spacing-md, 12px);
    }

    .filter-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      margin-top: 4px;
      padding: var(--sc-spacing-sm, 8px);
      background: var(--sc-bg-elevated, #2a2a4a);
      border: 1px solid var(--sc-border-color, rgba(255, 255, 255, 0.1));
      border-radius: var(--sc-radius-md, 8px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 100;
      min-width: 150px;
    }

    .filter-input {
      width: 100%;
      height: 32px;
      padding: 0 8px;
      border: 1px solid var(--sc-border-color, rgba(255, 255, 255, 0.1));
      background: transparent;
      color: var(--sc-text-primary, #fff);
      border-radius: var(--sc-radius-sm, 4px);
      font-size: var(--sc-font-size-sm, 13px);
    }

    .filter-input:focus {
      outline: none;
      border-color: var(--sc-primary, #6366f1);
    }

    .filter-options {
      max-height: 200px;
      overflow-y: auto;
      margin-top: var(--sc-spacing-xs, 4px);
    }

    .filter-option {
      padding: var(--sc-spacing-xs, 8px);
      cursor: pointer;
      border-radius: var(--sc-radius-sm, 4px);
      transition: background 0.2s;
    }

    .filter-option:hover {
      background: var(--sc-bg-hover, rgba(255, 255, 255, 0.05));
    }

    .filter-option.selected {
      background: var(--sc-primary-light, rgba(99, 102, 241, 0.1));
    }
  `;

  // ============ 计算属性 ============

  private get tableConfig(): TableConfig {
    return {
      showHeader: true,
      showIndex: false,
      showCheckbox: false,
      showPagination: true,
      showQuickJumper: true,
      showSizeChanger: true,
      showTotal: true,
      pageSize: 10,
      pageSizeOptions: [10, 20, 50, 100],
      stickyHeader: true,
      bordered: false,
      striped: true,
      hoverable: true,
      emptyText: this.i18n.t('table.noData') || '暂无数据',
      loading: false,
      rowKey: 'id',
      ...this.config,
    };
  }

  private get processedData(): T[] {
    let result = [...this.data];

    // 应用筛选
    this.filterStates.forEach((filter) => {
      if (filter.value !== undefined && filter.value !== '') {
        result = result.filter((row) => {
          const value = this.getCellValue(row, filter.key);
          return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
        });
      }
    });

    // 应用排序
    if (this.sortState) {
      result.sort((a, b) => {
        const aVal = this.getCellValue(a, this.sortState!.key);
        const bVal = this.getCellValue(b, this.sortState!.key);
        const comparison = this.compareValues(aVal, bVal);
        return this.sortState!.order === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }

  private get pagedData(): T[] {
    if (!this.tableConfig.showPagination) {
      return this.processedData;
    }
    const start = (this.page - 1) * this.pageSize;
    return this.processedData.slice(start, start + this.pageSize);
  }

  private get totalPages(): number {
    return Math.ceil(this.total / this.pageSize);
  }

  private get isAllSelected(): boolean {
    return this.pagedData.length > 0 && this.pagedData.every((row) =>
      this.selectedRowKeys.has(this.getRowKey(row))
    );
  }

  private get isIndeterminate(): boolean {
    const selectedCount = this.pagedData.filter((row) =>
      this.selectedRowKeys.has(this.getRowKey(row))
    ).length;
    return selectedCount > 0 && selectedCount < this.pagedData.length;
  }

  // ============ 渲染方法 ============

  render() {
    return html`
      <div class="table-container" style="position: relative;">
        <div class="table-wrapper">
          <table>
            ${this.renderHeader()}
            ${this.renderBody()}
          </table>
        </div>
        ${this.tableConfig.showPagination ? this.renderPagination() : ''}
        ${this.loading || this.tableConfig.loading ? this.renderLoading() : ''}
      </div>
    `;
  }

  private renderHeader() {
    if (!this.tableConfig.showHeader) return html``;

    return html`
      <thead class=${classMap({ sticky: !!(this.tableConfig.stickyHeader) })}>
        <tr>
          ${this.tableConfig.showCheckbox ? html`
            <th class="checkbox-cell">
              <div 
                class="checkbox ${classMap({ 
                  checked: this.isAllSelected,
                  indeterminate: this.isIndeterminate 
                })}"
                @click=${this.handleSelectAll}
              >
                ${this.isAllSelected ? this.renderCheckIcon() : ''}
              </div>
            </th>
          ` : ''}
          ${this.tableConfig.showIndex ? html`
            <th class="index-cell">#</th>
          ` : ''}
          ${this.tableConfig.expandable ? html`
            <th style="width: 40px;"></th>
          ` : ''}
          ${repeat(this.columns, (col) => String(col.key), (col) => this.renderTh(col))}
        </tr>
      </thead>
    `;
  }

  private renderTh(column: TableColumn<T>) {
    const classes = classMap({
      [column.align || 'left']: true,
      sortable: !!column.sortable,
      'fixed-left': column.fixed === 'left',
      'fixed-right': column.fixed === 'right',
    });

    const headerContent = column.renderHeader
      ? column.renderHeader(column)
      : html`<span>${column.header}</span>`;

    return html`
      <th 
        class=${classes}
        style=${this.getColumnStyle(column)}
        @click=${column.sortable ? () => this.handleSort(column) : undefined}
      >
        <div style="display: flex; align-items: center; gap: 4px;">
          ${headerContent}
          ${column.sortable ? this.renderSortIcon(column) : ''}
          ${column.filterable ? this.renderFilterTrigger(column) : ''}
        </div>
        ${this.activeFilterKey === column.key ? this.renderFilterDropdown(column) : ''}
      </th>
    `;
  }

  private renderSortIcon(column: TableColumn<T>) {
    const isActive = this.sortState?.key === (column.sortableKey || column.key);
    const isDesc = this.sortState?.order === 'desc';
    const isAsc = this.sortState?.order === 'asc';

    return html`
      <span class="sort-icon ${isActive ? 'active' : ''} ${isDesc ? 'desc' : ''} ${isAsc ? 'asc' : ''}">
        <svg class="up" viewBox="0 0 10 10"><path d="M5 2L2 6h6z"/></svg>
        <svg class="down" viewBox="0 0 10 10"><path d="M5 8L2 4h6z"/></svg>
      </span>
    `;
  }

  private renderFilterTrigger(column: TableColumn<T>) {
    const filter = this.filterStates.get(String(column.key));
    const isActive = filter?.value !== undefined && filter.value !== '';

    return html`
      <span 
        class="filter-trigger ${isActive ? 'active' : ''}"
        @click=${(e: Event) => this.handleFilterTrigger(e, column)}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M1 2h10L7 7v3l-2 1V7L1 2z"/>
        </svg>
      </span>
    `;
  }

  private renderFilterDropdown(column: TableColumn<T>) {
    const filter = this.filterStates.get(String(column.key));

    return html`
      <div class="filter-dropdown" @click=${(e: Event) => e.stopPropagation()}>
        ${column.filterType === 'select' && column.filterOptions ? html`
          <div class="filter-options">
            ${column.filterOptions.map((opt) => html`
              <div 
                class="filter-option ${filter?.value === opt.value ? 'selected' : ''}"
                @click=${() => this.handleFilterSelect(column, opt.value)}
              >
                ${opt.label}
              </div>
            `)}
          </div>
        ` : html`
          <input 
            class="filter-input"
            type="${column.filterType === 'number' ? 'number' : column.filterType === 'date' ? 'date' : 'text'}"
            placeholder="${this.i18n.t('table.filterPlaceholder') || '筛选...'}"
            .value=${String(filter?.value || '')}
            @input=${(e: Event) => this.handleFilterInput(column, (e.target as HTMLInputElement).value)}
            @keydown=${(e: KeyboardEvent) => e.key === 'Enter' && this.handleFilterConfirm(column)}
          />
        `}
      </div>
    `;
  }

  private renderBody() {
    if (this.pagedData.length === 0) {
      return html`
        <tbody>
          <tr>
            <td colspan=${this.columns.length + (this.tableConfig.showCheckbox ? 1 : 0) + (this.tableConfig.showIndex ? 1 : 0)}>
              <div class="empty-state">
                <div class="empty-icon">📭</div>
                <div>${this.tableConfig.emptyText}</div>
              </div>
            </td>
          </tr>
        </tbody>
      `;
    }

    return html`
      <tbody>
        ${repeat(this.pagedData, (row) => this.getRowKey(row), (row, index) => this.renderRow(row, index))}
      </tbody>
    `;
  }

  private renderRow(row: T, index: number) {
    const rowKey = this.getRowKey(row);
    const isSelected = this.selectedRowKeys.has(rowKey);
    const isExpanded = this.expandedRowKeys.has(rowKey);
    const isStriped = this.tableConfig.striped && index % 2 === 1;

    const trClasses = classMap({
      selected: isSelected,
      striped: !!isStriped,
    });

    return html`
      <tr class=${trClasses}>
        ${this.tableConfig.showCheckbox ? html`
          <td class="checkbox-cell">
            <div 
              class="checkbox ${isSelected ? 'checked' : ''}"
              @click=${() => this.handleSelectRow(row)}
            >
              ${isSelected ? this.renderCheckIcon() : ''}
            </div>
          </td>
        ` : ''}
        ${this.tableConfig.showIndex ? html`
          <td class="index-cell">${(this.page - 1) * this.pageSize + index + 1}</td>
        ` : ''}
        ${this.tableConfig.expandable ? html`
          <td>
            ${this.tableConfig.expandable.rowExpandable?.(row as Record<string, unknown>) !== false ? html`
              <span 
                class="expand-icon ${isExpanded ? 'expanded' : ''}"
                @click=${() => this.handleExpandRow(row)}
              >
                <svg viewBox="0 0 12 12"><path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" stroke-width="2"/></svg>
              </span>
            ` : ''}
          </td>
        ` : ''}
        ${repeat(this.columns, (col) => String(col.key), (col) => this.renderTd(row, col, index))}
      </tr>
      ${isExpanded && this.tableConfig.expandable ? html`
        <tr class="expanded-row">
          <td colspan=${this.columns.length + (this.tableConfig.showCheckbox ? 1 : 0) + (this.tableConfig.showIndex ? 1 : 0) + 1}>
            ${this.tableConfig.expandable.expandedRowRender?.(row as Record<string, unknown>)}
          </td>
        </tr>
      ` : ''}
    `;
  }

  private renderTd(row: T, column: TableColumn<T>, index: number) {
    const value = this.getCellValue(row, column.key);
    const content = column.render ? column.render(value, row, index) : value;

    const tdClasses = classMap({
      [column.align || 'left']: true,
      'fixed-left': column.fixed === 'left',
      'fixed-right': column.fixed === 'right',
      ellipsis: !!column.ellipsis,
    });

    return html`
      <td class=${tdClasses} style=${this.getColumnStyle(column)} title=${column.tooltip ? String(value) : '' as string}>
        ${content}
      </td>
    `;
  }

  private renderPagination() {
    const pages = this.getPageNumbers();

    return html`
      <div class="pagination">
        <div class="pagination-info">
          ${this.tableConfig.showTotal ? html`
            <span>${this.i18n.t('table.total', { count: String(this.total) }) || `共 ${this.total} 条`}</span>
          ` : ''}
          ${this.tableConfig.showSizeChanger ? html`
            <div class="size-changer">
              <select @change=${this.handlePageSizeChange}>
                ${(this.tableConfig.pageSizeOptions ?? []).map((size: number) => html`
                  <option value=${size} ?selected=${size === this.pageSize}>
                    ${size} ${this.i18n.t('table.perPage') || '条/页'}
                  </option>
                `)}
              </select>
            </div>
          ` : ''}
        </div>
        <div class="pagination-controls">
          <button 
            class="page-btn" 
            ?disabled=${this.page === 1}
            @click=${() => this.handlePageChange(1)}
          >«</button>
          <button 
            class="page-btn" 
            ?disabled=${this.page === 1}
            @click=${() => this.handlePageChange(this.page - 1)}
          >‹</button>
          ${pages.map((p) => html`
            <button 
              class="page-btn ${p === this.page ? 'active' : ''}"
              ?disabled=${p === '...'}
              @click=${() => p !== '...' && this.handlePageChange(Number(p))}
            >${p}</button>
          `)}
          <button 
            class="page-btn" 
            ?disabled=${this.page === this.totalPages}
            @click=${() => this.handlePageChange(this.page + 1)}
          >›</button>
          <button 
            class="page-btn" 
            ?disabled=${this.page === this.totalPages}
            @click=${() => this.handlePageChange(this.totalPages)}
          >»</button>
          ${this.tableConfig.showQuickJumper ? html`
            <div class="page-jumper">
              <span>${this.i18n.t('table.jumpTo') || '跳至'}</span>
              <input 
                type="number" 
                min="1" 
                max=${this.totalPages}
                @keydown=${this.handlePageJumper}
              />
              <span>${this.i18n.t('table.page') || '页'}</span>
            </div>
          ` : ''}
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

  private renderCheckIcon() {
    return html`
      <svg viewBox="0 0 12 12">
        <path d="M10 3L4.5 8.5 2 6" fill="none" stroke="currentColor" stroke-width="2"/>
      </svg>
    `;
  }

  // ============ 辅助方法 ============

  private getRowKey(row: T): string {
    return String((row as Record<string, unknown>)[this.tableConfig.rowKey ?? 'id'] || '');
  }

  private getCellValue(row: T, key: string | keyof T): unknown {
    const keyStr = String(key);
    const parts = keyStr.split('.');
    let value: unknown = row;
    for (const part of parts) {
      if (value == null) break;
      value = (value as Record<string, unknown>)?.[part];
    }
    return value;
  }

  private getColumnStyle(column: TableColumn<T>): string {
    const styles: string[] = [];
    if (column.width) styles.push(`width: ${column.width}`);
    if (column.minWidth) styles.push(`min-width: ${column.minWidth}`);
    return styles.join('; ');
  }

  private compareValues(a: unknown, b: unknown): number {
    if (a === b) return 0;
    if (a === null || a === undefined) return -1;
    if (b === null || b === undefined) return 1;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b));
  }

  private getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const total = this.totalPages;
    const current = this.page;

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }

    return pages;
  }

  // ============ 事件处理 ============

  private handleSort(column: TableColumn<T>): void {
    const key = String(column.sortableKey || column.key);
    let order: SortOrder = 'asc';

    if (this.sortState?.key === key) {
      order = this.sortState.order === 'asc' ? 'desc' : this.sortState.order === 'desc' ? null : 'asc';
    }

    this.sortState = order ? { key, order } : null;

    this.dispatchEvent(new CustomEvent('sort-change', {
      detail: this.sortState,
      bubbles: true,
      composed: true,
    }));
  }

  private handleFilterTrigger(e: Event, column: TableColumn<T>): void {
    e.stopPropagation();
    const key = String(column.key);
    this.activeFilterKey = this.activeFilterKey === key ? null : key;
  }

  private handleFilterInput(column: TableColumn<T>, value: string): void {
    const key = String(column.key);
    this.filterStates.set(key, { key, value });
  }

  private handleFilterSelect(column: TableColumn<T>, value: string | number): void {
    const key = String(column.key);
    this.filterStates.set(key, { key, value });
    this.activeFilterKey = null;
    this.dispatchEvent(new CustomEvent('filter-change', {
      detail: { filters: Array.from(this.filterStates.values()) },
      bubbles: true,
      composed: true,
    }));
  }

  private handleFilterConfirm(column: TableColumn<T>): void {
    this.activeFilterKey = null;
    this.dispatchEvent(new CustomEvent('filter-change', {
      detail: { filters: Array.from(this.filterStates.values()) },
      bubbles: true,
      composed: true,
    }));
  }

  private handleSelectAll(): void {
    if (this.isAllSelected) {
      // 取消选择当前页所有行
      this.pagedData.forEach((row) => {
        this.selectedRowKeys.delete(this.getRowKey(row));
      });
    } else {
      // 选择当前页所有行
      this.pagedData.forEach((row) => {
        this.selectedRowKeys.add(this.getRowKey(row));
      });
    }
    this.dispatchEvent(new CustomEvent('selection-change', {
      detail: {
        selectedRowKeys: Array.from(this.selectedRowKeys),
        selectedRows: this.data.filter((row) => this.selectedRowKeys.has(this.getRowKey(row))),
      },
      bubbles: true,
      composed: true,
    }));
    this.requestUpdate();
  }

  private handleSelectRow(row: T): void {
    const key = this.getRowKey(row);
    if (this.selectedRowKeys.has(key)) {
      this.selectedRowKeys.delete(key);
    } else {
      this.selectedRowKeys.add(key);
    }
    this.dispatchEvent(new CustomEvent('selection-change', {
      detail: {
        selectedRowKeys: Array.from(this.selectedRowKeys),
        selectedRows: this.data.filter((r) => this.selectedRowKeys.has(this.getRowKey(r))),
      },
      bubbles: true,
      composed: true,
    }));
    this.requestUpdate();
  }

  private handleExpandRow(row: T): void {
    const key = this.getRowKey(row);
    if (this.expandedRowKeys.has(key)) {
      this.expandedRowKeys.delete(key);
    } else {
      this.expandedRowKeys.add(key);
    }
    this.tableConfig.expandable?.onExpand?.(this.expandedRowKeys.has(key), row as Record<string, unknown>);
    this.requestUpdate();
  }

  private handlePageChange(page: number): void {
    this.page = page;
    this.dispatchEvent(new CustomEvent('page-change', {
      detail: { page, pageSize: this.pageSize },
      bubbles: true,
      composed: true,
    }));
  }

  private handlePageSizeChange(e: Event): void {
    const size = Number((e.target as HTMLSelectElement).value);
    this.pageSize = size;
    this.page = 1;
    this.dispatchEvent(new CustomEvent('page-change', {
      detail: { page: this.page, pageSize: size },
      bubbles: true,
      composed: true,
    }));
  }

  private handlePageJumper(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      const input = e.target as HTMLInputElement;
      const page = Number(input.value);
      if (page >= 1 && page <= this.totalPages) {
        this.handlePageChange(page);
        input.value = '';
      }
    }
  }

  // ============ 公共方法 ============

  /**
   * 获取选中的行
   */
  getSelection(): TableSelection<T> {
    return {
      selectedRowKeys: this.selectedRowKeys,
      selectedRows: this.data.filter((row) => this.selectedRowKeys.has(this.getRowKey(row))),
    };
  }

  /**
   * 清除选择
   */
  clearSelection(): void {
    this.selectedRowKeys.clear();
    this.requestUpdate();
  }

  /**
   * 设置选中行
   */
  setSelectedRows(keys: string[]): void {
    this.selectedRowKeys = new Set(keys);
    this.requestUpdate();
  }

  /**
   * 刷新数据
   */
  refresh(): void {
    this.dispatchEvent(new CustomEvent('refresh', {
      bubbles: true,
      composed: true,
    }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-data-table': ScDataTable<Record<string, unknown>>;
  }
}
