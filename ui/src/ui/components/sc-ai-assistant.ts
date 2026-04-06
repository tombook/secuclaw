/**
 * SecuClaw AI Assistant Component - AI助手面板
 * 
 * 提供智能洞察、建议和AI对话功能
 * 位置：所有页面右侧固定面板
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { aiService, type SmartInsight, type AIRecommendation, type ChatMessage, type ChatContext } from '../ai-service.js';
import './sc-ai-insights.js';
import './sc-ai-recommendations.js';
import './sc-ai-chat.js';

// ============ 类型定义 ============

type AssistantMode = 'collapsed' | 'insights' | 'recommendations' | 'chat';

// ============ 组件定义 ============

@customElement('sc-ai-assistant')
export class ScAIAssistant extends LitElement {
  // ============ 属性 ============

  @property({ type: String })
  pageId: string = '';

  @property({ type: String })
  pageTitle: string = '';

  @property({ type: Object })
  pageData: Record<string, unknown> = {};

  @property({ type: String })
  userRole: string = 'security-expert';

  // ============ 状态 ============

  @state()
  private mode: AssistantMode = 'collapsed';

  @state()
  private insights: SmartInsight[] = [];

  @state()
  private recommendations: AIRecommendation[] = [];

  @state()
  private chatMessages: ChatMessage[] = [];

  @state()
  private loading: boolean = false;

  @state()
  private chatLoading: boolean = false;

  // ============ 样式 ============

  static styles = css`
    :host {
      display: block;
      position: fixed;
      right: 0;
      top: 64px;
      bottom: 0;
      width: 48px;
      z-index: var(--sc-z-dropdown, 100);
      transition: width var(--sc-transition-normal, 250ms ease);
    }

    :host([mode='insights']),
    :host([mode='recommendations']),
    :host([mode='chat']) {
      width: 360px;
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
    }

    .assistant-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--sc-bg-primary, #ffffff);
      border-left: 1px solid var(--sc-border-color, #e5e7eb);
    }

    /* 折叠状态 */
    .collapsed-bar {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--sc-spacing-md, 1rem);
      gap: var(--sc-spacing-sm, 0.5rem);
    }

    .toggle-button {
      width: 40px;
      height: 40px;
      border-radius: var(--sc-radius-md, 8px);
      border: none;
      background: var(--sc-bg-secondary, #f3f4f6);
      color: var(--sc-text-secondary, #6b7280);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      transition: all var(--sc-transition-fast, 150ms ease);
    }

    .toggle-button:hover {
      background: var(--sc-primary, #3b82f6);
      color: white;
    }

    .toggle-button.has-insights {
      background: var(--sc-warning, #f59e0b);
      color: white;
    }

    .toggle-button .badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: var(--sc-error, #ef4444);
      color: white;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: var(--sc-radius-full, 9999px);
      min-width: 16px;
      text-align: center;
    }

    /* 展开状态 */
    .expanded-container {
      display: none;
      flex-direction: column;
      height: 100%;
    }

    :host([mode='insights']) .expanded-container,
    :host([mode='recommendations']) .expanded-container,
    :host([mode='chat']) .expanded-container {
      display: flex;
    }

    :host([mode='insights']) .collapsed-bar,
    :host([mode='recommendations']) .collapsed-bar,
    :host([mode='chat']) .collapsed-bar {
      display: none;
    }

    /* 头部 */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--sc-spacing-md, 1rem);
      border-bottom: 1px solid var(--sc-border-color, #e5e7eb);
    }

    .header-title {
      font-size: var(--sc-font-size-md, 1rem);
      font-weight: 600;
      color: var(--sc-text-primary, #111827);
    }

    .header-actions {
      display: flex;
      gap: var(--sc-spacing-xs, 0.25rem);
    }

    .header-btn {
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      color: var(--sc-text-secondary, #6b7280);
      cursor: pointer;
      border-radius: var(--sc-radius-sm, 4px);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-btn:hover {
      background: var(--sc-bg-secondary, #f3f4f6);
    }

    /* Tab导航 */
    .tab-nav {
      display: flex;
      border-bottom: 1px solid var(--sc-border-color, #e5e7eb);
    }

    .tab-btn {
      flex: 1;
      padding: var(--sc-spacing-sm, 0.5rem) var(--sc-spacing-md, 1rem);
      border: none;
      background: transparent;
      color: var(--sc-text-secondary, #6b7280);
      font-size: var(--sc-font-size-sm, 0.875rem);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all var(--sc-transition-fast, 150ms ease);
    }

    .tab-btn:hover {
      color: var(--sc-text-primary, #111827);
      background: var(--sc-bg-secondary, #f3f4f6);
    }

    .tab-btn.active {
      color: var(--sc-primary, #3b82f6);
      border-bottom-color: var(--sc-primary, #3b82f6);
    }

    /* 内容区 */
    .content {
      flex: 1;
      overflow-y: auto;
      padding: var(--sc-spacing-md, 1rem);
    }

    /* 洞察卡片 */
    .insight-card {
      background: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e5e7eb);
      border-radius: var(--sc-radius-md, 8px);
      padding: var(--sc-spacing-md, 1rem);
      margin-bottom: var(--sc-spacing-sm, 0.5rem);
      cursor: pointer;
      transition: all var(--sc-transition-fast, 150ms ease);
    }

    .insight-card:hover {
      border-color: var(--sc-primary, #3b82f6);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .insight-header {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm, 0.5rem);
      margin-bottom: var(--sc-spacing-xs, 0.25rem);
    }

    .insight-icon {
      font-size: 16px;
    }

    .insight-title {
      font-size: var(--sc-font-size-sm, 0.875rem);
      font-weight: 500;
      color: var(--sc-text-primary, #111827);
    }

    .insight-priority {
      margin-left: auto;
      padding: 2px 8px;
      border-radius: var(--sc-radius-full, 9999px);
      font-size: var(--sc-font-size-xs, 0.75rem);
      font-weight: 500;
    }

    .insight-priority.high {
      background: var(--sc-error-bg, #fee2e2);
      color: var(--sc-error, #ef4444);
    }

    .insight-priority.medium {
      background: var(--sc-warning-bg, #fef3c7);
      color: var(--sc-warning, #f59e0b);
    }

    .insight-priority.low {
      background: var(--sc-success-bg, #d1fae5);
      color: var(--sc-success, #10b981);
    }

    .insight-description {
      font-size: var(--sc-font-size-xs, 0.75rem);
      color: var(--sc-text-secondary, #6b7280);
      line-height: 1.5;
    }

    .insight-action {
      margin-top: var(--sc-spacing-sm, 0.5rem);
      padding: var(--sc-spacing-xs, 0.25rem) var(--sc-spacing-sm, 0.5rem);
      background: var(--sc-primary, #3b82f6);
      color: white;
      border: none;
      border-radius: var(--sc-radius-sm, 4px);
      font-size: var(--sc-font-size-xs, 0.75rem);
      cursor: pointer;
    }

    .insight-action:hover {
      background: var(--sc-primary-hover, #2563eb);
    }

    /* 建议卡片 */
    .recommendation-card {
      background: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e5e7eb);
      border-left: 3px solid var(--sc-primary, #3b82f6);
      border-radius: var(--sc-radius-md, 8px);
      padding: var(--sc-spacing-md, 1rem);
      margin-bottom: var(--sc-spacing-sm, 0.5rem);
    }

    .recommendation-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--sc-spacing-xs, 0.25rem);
    }

    .recommendation-title {
      font-size: var(--sc-font-size-sm, 0.875rem);
      font-weight: 500;
      color: var(--sc-text-primary, #111827);
    }

    .recommendation-priority {
      font-size: var(--sc-font-size-xs, 0.75rem);
      color: var(--sc-text-tertiary, #9ca3af);
    }

    .recommendation-description {
      font-size: var(--sc-font-size-xs, 0.75rem);
      color: var(--sc-text-secondary, #6b7280);
      margin-bottom: var(--sc-spacing-sm, 0.5rem);
    }

    .recommendation-meta {
      display: flex;
      gap: var(--sc-spacing-md, 1rem);
      font-size: var(--sc-font-size-xs, 0.75rem);
      color: var(--sc-text-tertiary, #9ca3af);
    }

    /* 聊天区域 */
    .chat-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: var(--sc-spacing-md, 1rem);
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-sm, 0.5rem);
    }

    .chat-message {
      max-width: 85%;
      padding: var(--sc-spacing-sm, 0.5rem) var(--sc-spacing-md, 1rem);
      border-radius: var(--sc-radius-lg, 12px);
      font-size: var(--sc-font-size-sm, 0.875rem);
      line-height: 1.5;
    }

    .chat-message.user {
      align-self: flex-end;
      background: var(--sc-primary, #3b82f6);
      color: white;
    }

    .chat-message.assistant {
      align-self: flex-start;
      background: var(--sc-bg-secondary, #f3f4f6);
      color: var(--sc-text-primary, #111827);
    }

    .chat-input-container {
      display: flex;
      gap: var(--sc-spacing-sm, 0.5rem);
      padding: var(--sc-spacing-md, 1rem);
      border-top: 1px solid var(--sc-border-color, #e5e7eb);
    }

    .chat-input {
      flex: 1;
      padding: var(--sc-spacing-sm, 0.5rem) var(--sc-spacing-md, 1rem);
      border: 1px solid var(--sc-border-color, #e5e7eb);
      border-radius: var(--sc-radius-md, 8px);
      font-size: var(--sc-font-size-sm, 0.875rem);
      background: var(--sc-input-bg, #ffffff);
      color: var(--sc-text-primary, #111827);
    }

    .chat-input:focus {
      outline: none;
      border-color: var(--sc-primary, #3b82f6);
    }

    .chat-send-btn {
      padding: var(--sc-spacing-sm, 0.5rem) var(--sc-spacing-md, 1rem);
      background: var(--sc-primary, #3b82f6);
      color: white;
      border: none;
      border-radius: var(--sc-radius-md, 8px);
      font-size: var(--sc-font-size-sm, 0.875rem);
      cursor: pointer;
    }

    .chat-send-btn:hover {
      background: var(--sc-primary-hover, #2563eb);
    }

    .chat-send-btn:disabled {
      background: var(--sc-text-tertiary, #9ca3af);
      cursor: not-allowed;
    }

    /* 空状态 */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--sc-spacing-xl, 2rem);
      color: var(--sc-text-tertiary, #9ca3af);
      text-align: center;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: var(--sc-spacing-md, 1rem);
    }

    .empty-text {
      font-size: var(--sc-font-size-sm, 0.875rem);
    }

    /* 加载状态 */
    .loading-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--sc-spacing-lg, 1.5rem);
      color: var(--sc-text-tertiary, #9ca3af);
    }

    .loading-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid var(--sc-border-color, #e5e7eb);
      border-top-color: var(--sc-primary, #3b82f6);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  // ============ 生命周期 ============

  connectedCallback(): void {
    super.connectedCallback();
    if (this.pageId) {
      this.loadData();
    }
  }

  updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('pageId') || changedProperties.has('pageData')) {
      this.loadData();
    }
    // 同步mode属性到host
    this.setAttribute('mode', this.mode);
  }

  // ============ 数据加载 ============

  private async loadData(): Promise<void> {
    if (!this.pageId) return;

    this.loading = true;

    try {
      const [insights, recommendations] = await Promise.all([
        aiService.generateInsights({
          pageId: this.pageId,
          data: this.pageData,
          userRole: this.userRole,
        }),
        aiService.generateRecommendations({
          pageId: this.pageId,
          data: this.pageData,
          userRole: this.userRole,
        }),
      ]);

      this.insights = insights;
      this.recommendations = recommendations;
    } catch (error) {
      console.error('[AI Assistant] Failed to load data:', error);
    } finally {
      this.loading = false;
    }
  }

  // ============ 事件处理 ============

  private handleToggle(): void {
    if (this.mode === 'collapsed') {
      this.mode = 'insights';
    } else {
      this.mode = 'collapsed';
    }
  }

  private handleModeChange(newMode: AssistantMode): void {
    this.mode = newMode;
  }

  private handleInsightAction(insight: SmartInsight): void {
    this.dispatchEvent(new CustomEvent('insight-action', {
      detail: { insight },
      bubbles: true,
      composed: true,
    }));
  }

  // ============ 渲染 ============

  render() {
    return html`
      <div class="assistant-container">
        ${this.renderCollapsedBar()}
        ${this.renderExpandedContainer()}
      </div>
    `;
  }

  private renderCollapsedBar() {
    const hasInsights = this.insights.some(i => i.priority === 'high');
    const insightCount = this.insights.length;

    return html`
      <div class="collapsed-bar">
        <button 
          class="toggle-button ${hasInsights ? 'has-insights' : ''}"
          @click=${this.handleToggle}
          title="AI助手"
        >
          🤖
          ${insightCount > 0 ? html`<span class="badge">${insightCount}</span>` : ''}
        </button>
      </div>
    `;
  }

  private renderExpandedContainer() {
    return html`
      <div class="expanded-container">
        <div class="header">
          <span class="header-title">🤖 AI助手</span>
          <div class="header-actions">
            <button class="header-btn" @click=${() => this.loadData()} title="刷新">
              🔄
            </button>
            <button class="header-btn" @click=${() => this.mode = 'collapsed'} title="关闭">
              ✕
            </button>
          </div>
        </div>

        <div class="tab-nav">
          <button 
            class="tab-btn ${this.mode === 'insights' ? 'active' : ''}"
            @click=${() => this.handleModeChange('insights')}
          >
            洞察 (${this.insights.length})
          </button>
          <button 
            class="tab-btn ${this.mode === 'recommendations' ? 'active' : ''}"
            @click=${() => this.handleModeChange('recommendations')}
          >
            建议 (${this.recommendations.length})
          </button>
          <button 
            class="tab-btn ${this.mode === 'chat' ? 'active' : ''}"
            @click=${() => this.handleModeChange('chat')}
          >
            对话
          </button>
        </div>

        <div class="content">
          ${this.mode === 'insights' ? this.renderInsights() : ''}
          ${this.mode === 'recommendations' ? this.renderRecommendations() : ''}
          ${this.mode === 'chat' ? this.renderChat() : ''}
        </div>
      </div>
    `;
  }

  private renderInsights() {
    return html`
      <sc-ai-insights
        .insights=${this.insights}
        .loading=${this.loading}
        @insight-action=${this.handleInsightAction}
      ></sc-ai-insights>
    `;
  }

  private renderRecommendations() {
    return html`
      <sc-ai-recommendations
        .recommendations=${this.recommendations}
        .loading=${this.loading}
      ></sc-ai-recommendations>
    `;
  }

  private renderChat() {
    return html`
      <sc-ai-chat
        .messages=${this.chatMessages}
        .loading=${this.chatLoading}
        @chat-submit=${this.handleChatSubmitFromChild}
      ></sc-ai-chat>
    `;
  }

  private handleChatSubmitFromChild(e: CustomEvent<{ message: string }>) {
    this.handleChatSubmit(e.detail.message);
  }

  private async handleChatSubmit(message: string): Promise<void> {
    if (!message.trim() || this.chatLoading) return;

    const userMessage = message.trim();

    // 添加用户消息
    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    this.chatMessages = [...this.chatMessages, userMsg];

    // 发送到AI
    this.chatLoading = true;
    try {
      const context: ChatContext = {
        pageId: this.pageId,
        pageTitle: this.pageTitle,
        userRole: this.userRole,
        currentData: this.pageData,
      };

      const response = await aiService.chat(context, userMessage);
      this.chatMessages = [...this.chatMessages, response];
    } catch (error) {
      console.error('[AI Assistant] Chat failed:', error);
    } finally {
      this.chatLoading = false;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-ai-assistant': ScAIAssistant;
  }
}
