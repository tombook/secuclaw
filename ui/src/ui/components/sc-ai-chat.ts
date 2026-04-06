/**
 * SecuClaw AI Chat Component - AI聊天子组件
 * 提供AI对话界面
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { type ChatMessage } from '../ai-service.js';

@customElement('sc-ai-chat')
export class ScAIChat extends LitElement {
  @property({ type: Array })
  messages: ChatMessage[] = [];

  @property({ type: Boolean })
  loading: boolean = false;

  @state()
  private inputValue: string = '';

  static styles = css`
    :host { display: block; height: 100%; }
    
    .chat-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }
    
    .empty-state {
      text-align: center;
      padding: 2rem;
      color: var(--sc-text-secondary, #6b7280);
    }
    
    .empty-icon { font-size: 32px; margin-bottom: 8px; }
    .empty-text { font-size: 14px; }
    
    .chat-message {
      padding: 10px 14px;
      margin-bottom: 8px;
      border-radius: var(--sc-radius-md, 8px);
      font-size: 14px;
      line-height: 1.5;
      max-width: 85%;
      word-wrap: break-word;
    }
    
    .chat-message.user {
      background: var(--sc-primary, #3b82f6);
      color: white;
      margin-left: auto;
      border-bottom-right-radius: 4px;
    }
    
    .chat-message.assistant {
      background: var(--sc-bg-secondary, #f3f4f6);
      color: var(--sc-text-primary, #111827);
      border-bottom-left-radius: 4px;
    }
    
    .loading-indicator {
      display: flex;
      justify-content: center;
      padding: 1rem;
    }
    
    .loading-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid var(--sc-border-color, #e5e7eb);
      border-top-color: var(--sc-primary, #3b82f6);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin { to { transform: rotate(360deg); } }
    
    .chat-input-container {
      display: flex;
      gap: 8px;
      padding: 12px;
      border-top: 1px solid var(--sc-border-color, #e5e7eb);
    }
    
    .chat-input {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid var(--sc-border-color, #e5e7eb);
      border-radius: var(--sc-radius-md, 8px);
      font-size: 14px;
      background: var(--sc-bg-primary, #ffffff);
      color: var(--sc-text-primary, #111827);
      outline: none;
      transition: border-color 0.2s ease;
    }
    
    .chat-input:focus {
      border-color: var(--sc-primary, #3b82f6);
    }
    
    .chat-input::placeholder {
      color: var(--sc-text-tertiary, #9ca3af);
    }
    
    .chat-send-btn {
      padding: 10px 18px;
      background: var(--sc-primary, #3b82f6);
      color: white;
      border: none;
      border-radius: var(--sc-radius-md, 8px);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s ease, opacity 0.2s ease;
    }
    
    .chat-send-btn:hover:not(:disabled) {
      background: color-mix(in srgb, var(--sc-primary, #3b82f6) 85%, black);
    }
    
    .chat-send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `;

  private handleInput(e: Event) {
    this.inputValue = (e.target as HTMLInputElement).value;
  }

  private handleSubmit() {
    if (!this.inputValue.trim() || this.loading) return;
    
    this.dispatchEvent(new CustomEvent('chat-submit', {
      detail: { message: this.inputValue },
      bubbles: true,
      composed: true
    }));
    
    this.inputValue = '';
  }

  private handleKeyPress(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.handleSubmit();
    }
  }

  render() {
    return html`
      <div class="chat-container">
        <div class="chat-messages">
          ${this.messages.length === 0 ? html`
            <div class="empty-state">
              <div class="empty-icon">💬</div>
              <div class="empty-text">开始与AI助手对话</div>
            </div>
          ` : html`
            ${this.messages.map(msg => html`
              <div class="chat-message ${msg.role}">
                ${msg.content}
              </div>
            `)}
            ${this.loading ? html`
              <div class="loading-indicator">
                <div class="loading-spinner"></div>
              </div>
            ` : ''}
          `}
        </div>
        <div class="chat-input-container">
          <input 
            type="text"
            class="chat-input"
            .value=${this.inputValue}
            @input=${this.handleInput}
            @keypress=${this.handleKeyPress}
            placeholder="输入消息..."
          />
          <button 
            class="chat-send-btn"
            @click=${this.handleSubmit}
            ?disabled=${!this.inputValue.trim() || this.loading}
          >
            发送
          </button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-ai-chat': ScAIChat;
  }
}
