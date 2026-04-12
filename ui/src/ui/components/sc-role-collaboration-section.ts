import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { RoleId } from '../config/role-themes.js';
import { ROLE_THEMES } from '../config/role-themes.js';
import { raciStore, type ChatMessage } from '../store/raci-store.js';

export interface CollaborationItem {
  id: string;
  type: 'discussion' | 'request' | 'invitation' | 'task';
  title: string;
  description: string;
  participants: RoleId[];
  timestamp: number;
  status: 'active' | 'pending' | 'resolved';
  scenario?: string;
}

@customElement('sc-role-collaboration-section')
export class ScRoleCollaborationSection extends LitElement {
  @state() private items: CollaborationItem[] = [];
  @state() private activeTab: 'discussions' | 'requests' | 'tasks' = 'discussions';
  @state() private messages: ChatMessage[] = [];
  @state() private messageInput = '';
  @state() private showMentionPopup = false;
  @state() private mentionFilter = '';
  @state() private mentionStartIndex = -1;
  @state() private selectedMentionIndex = 0;
  
  private _roleId: RoleId = 'security-expert';
  private unsubscribe?: () => void;

  connectedCallback() {
    super.connectedCallback();
    this.unsubscribe = raciStore.subscribe((state) => {
      this.messages = state.chatMessages;
      if (this.activeTab === 'discussions') {
        this.items = this.transformMessagesToItems(state.chatMessages);
      }
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribe?.();
  }

  protected override willUpdate(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('activeTab')) {
      this.loadItems();
    }
    super.willUpdate(changedProperties);
  }

  private transformMessagesToItems(msgs: ChatMessage[]): CollaborationItem[] {
    return msgs.slice(0, 10).map(msg => ({
      id: msg.id,
      type: 'discussion' as const,
      title: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''),
      description: msg.content,
      participants: [msg.senderRole],
      timestamp: msg.timestamp,
      status: 'active' as const,
      scenario: 'War Room',
    }));
  }

  static styles = css`
    :host {
      display: block;
      contain: layout style;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #f1f5f9;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-icon {
      font-size: 16px;
    }

    .new-btn {
      background: var(--role-primary, #3b82f6);
      border: none;
      color: white;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .new-btn:hover {
      opacity: 0.9;
    }

    .tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      border-bottom: 1px solid #334155;
      padding-bottom: 8px;
      overflow-x: auto;
    }

    @media (max-width: 480px) {
      .tabs {
        gap: 4px;
      }
      .tab {
        padding: 4px 8px;
        font-size: 12px;
      }
      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
    }

    .tab {
      padding: 6px 12px;
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 13px;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .tab:hover {
      color: #f1f5f9;
      background: #0f172a;
    }

    .tab.active {
      color: var(--role-primary, #3b82f6);
      background: rgba(59, 130, 246, 0.1);
    }

    .tab-badge {
      margin-left: 4px;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 10px;
      background: #1e293b;
    }

    .tab.active .tab-badge {
      background: var(--role-primary, #3b82f6);
      color: white;
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 300px;
      overflow-y: auto;
    }

    .item-card {
      background: #0f172a;
      border-radius: 8px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .item-card:hover {
      background: #1e293b;
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .item-type {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      font-weight: 600;
    }

    .item-type.discussion {
      background: rgba(59, 130, 246, 0.2);
      color: #3b82f6;
    }

    .item-type.request {
      background: rgba(245, 158, 11, 0.2);
      color: #f59e0b;
    }

    .item-type.invitation {
      background: rgba(16, 185, 129, 0.2);
      color: #10b981;
    }

    .item-type.task {
      background: rgba(139, 92, 246, 0.2);
      color: #8b5cf6;
    }

    .item-time {
      font-size: 11px;
      color: #64748b;
    }

    .item-title {
      font-size: 14px;
      font-weight: 500;
      color: #f1f5f9;
      margin-bottom: 4px;
    }

    .item-description {
      font-size: 12px;
      color: #94a3b8;
      margin-bottom: 8px;
    }

    .item-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .item-participants {
      display: flex;
      gap: -4px;
    }

    .participant-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      border: 2px solid #0f172a;
      margin-left: -4px;
    }

    .participant-avatar:first-child {
      margin-left: 0;
    }

    .item-scenario {
      font-size: 11px;
      padding: 2px 6px;
      background: #1e293b;
      border-radius: 4px;
      color: #64748b;
    }

    .empty-state {
      text-align: center;
      padding: 32px;
      color: #64748b;
      font-size: 13px;
    }

    .message-input-container {
      position: relative;
      margin-bottom: 16px;
    }

    .message-input {
      width: 100%;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 10px 12px;
      color: #f1f5f9;
      font-size: 13px;
      resize: none;
      min-height: 40px;
      font-family: inherit;
    }

    .message-input:focus {
      outline: none;
      border-color: var(--role-primary, #3b82f6);
    }

    .message-input::placeholder {
      color: #64748b;
    }

    .mention-popup {
      position: absolute;
      bottom: 100%;
      left: 0;
      right: 0;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      max-height: 200px;
      overflow-y: auto;
      z-index: 100;
      margin-bottom: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .mention-popup::-webkit-scrollbar {
      width: 6px;
    }

    .mention-popup::-webkit-scrollbar-track {
      background: rgba(255,255,255,0.05);
    }

    .mention-popup::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.2);
      border-radius: 3px;
    }

    .mention-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .mention-item:hover,
    .mention-item.selected {
      background: #334155;
    }

    .mention-item:focus {
      outline: none;
      background: #334155;
    }

    .mention-item-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      flex-shrink: 0;
    }

    .mention-item-name {
      font-size: 13px;
      color: #f1f5f9;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .mention-item-id {
      font-size: 11px;
      color: #64748b;
      margin-left: auto;
      flex-shrink: 0;
    }

    .send-btn {
      background: var(--role-primary, #3b82f6);
      border: none;
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      margin-top: 8px;
      transition: opacity 0.2s;
    }

    .send-btn:hover {
      opacity: 0.9;
    }

    .send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `;

  set roleId(val: RoleId) {
    this._roleId = val;
    this.loadItems();
  }

  private async loadItems() {
    try {
      if (this.activeTab === 'discussions' && this.messages.length > 0) {
        this.items = this.transformMessagesToItems(this.messages);
      } else {
        this.items = this.getMockItems();
      }
    } catch (error) {
      console.warn('[ScRoleCollaborationSection] Failed to load items, using mock data:', error);
      this.items = this.getMockItems();
    }
  }

  private getMockItems(): CollaborationItem[] {
    return [
      {
        id: '1',
        type: 'discussion',
        title: 'CVE-2024-XXXX 漏洞响应讨论',
        description: '需要协调安全专家和架构师共同评估漏洞影响范围',
        participants: ['security-expert', 'security-architect', 'secuclaw-commander'],
        timestamp: Date.now() - 3600000,
        status: 'active',
        scenario: '漏洞管理',
      },
      {
        id: '2',
        type: 'request',
        title: '零信任架构评审请求',
        description: '新系统上线前需要安全架构师进行架构评审',
        participants: ['security-architect'],
        timestamp: Date.now() - 7200000,
        status: 'pending',
        scenario: '架构评审',
      },
      {
        id: '3',
        type: 'invitation',
        title: '参与安全运营例会',
        description: '每周安全运营例会，讨论本周安全态势',
        participants: ['security-ops', 'secuclaw-commander', 'ciso'],
        timestamp: Date.now() - 86400000,
        status: 'active',
        scenario: '安全运营',
      },
      {
        id: '4',
        type: 'task',
        title: '供应链安全评估任务',
        description: '对新增供应商进行安全评估和风险评级',
        participants: ['supply-chain-security'],
        timestamp: Date.now() - 1800000,
        status: 'active',
        scenario: '供应链安全',
      },
    ];
  }

  private getFilteredItems(): CollaborationItem[] {
    const activeTab = this.activeTab;
    if (activeTab === 'requests') {
      return this.items.filter(i => i.type === 'request' || i.type === 'invitation');
    }
    const typeMap = {
      'discussions': 'discussion',
      'tasks': 'task',
    } as const;
    return this.items.filter(i => i.type === typeMap[activeTab]);
  }

  private getParticipantAvatar(roleId: RoleId): { bg: string; fg: string } {
    const theme = ROLE_THEMES[roleId];
    return {
      bg: theme?.colors.primary || '#3b82f6',
      fg: theme?.colors.text || '#ffffff',
    };
  }

  private formatTime(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    return `${days}天前`;
  }

  private handleItemClick(item: CollaborationItem) {
    this.dispatchEvent(new CustomEvent('collaboration-item-click', {
      detail: { item },
      bubbles: true,
      composed: true,
    }));
  }

  private handleItemKeyDown(e: KeyboardEvent, item: CollaborationItem) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.handleItemClick(item);
    }
  }

  private handleNewCollaboration() {
    this.dispatchEvent(new CustomEvent('create-collaboration', {
      bubbles: true,
      composed: true,
    }));
  }

  private getAllRoles(): Array<{ id: RoleId; name: string; icon: string; color: string }> {
    return Object.entries(ROLE_THEMES).map(([id, theme]) => ({
      id: id as RoleId,
      name: theme?.nameCn || id,
      icon: theme?.icon || '🤖',
      color: theme?.colors?.primary || '#3b82f6',
    }));
  }

  private getFilteredRoles(): Array<{ id: RoleId; name: string; icon: string; color: string }> {
    const roles = this.getAllRoles();
    if (!this.mentionFilter) return roles;
    const filter = this.mentionFilter.toLowerCase();
    return roles.filter(r => 
      r.id.toLowerCase().includes(filter) || 
      r.name.toLowerCase().includes(filter)
    );
  }

  private handleInput(e: InputEvent) {
    const target = e.target as HTMLTextAreaElement;
    const value = target.value;
    const cursorPos = target.selectionStart || 0;
    
    this.messageInput = value;
    
    const textBeforeCursor = value.substring(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    
    if (atIndex !== -1 && atIndex < cursorPos) {
      const textAfterAt = textBeforeCursor.substring(atIndex + 1);
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n') && textAfterAt.length < 30) {
        this.mentionStartIndex = atIndex;
        this.mentionFilter = textAfterAt;
        this.showMentionPopup = true;
        this.selectedMentionIndex = 0;
        return;
      }
    }
    
    this.showMentionPopup = false;
    this.mentionFilter = '';
    this.mentionStartIndex = -1;
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (this.showMentionPopup) {
      const filteredRoles = this.getFilteredRoles();
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.selectedMentionIndex = Math.min(this.selectedMentionIndex + 1, filteredRoles.length - 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.selectedMentionIndex = Math.max(this.selectedMentionIndex - 1, 0);
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          if (filteredRoles[this.selectedMentionIndex]) {
            this.selectMention(filteredRoles[this.selectedMentionIndex]);
          }
          break;
        case 'Escape':
          this.showMentionPopup = false;
          break;
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.handleSend();
    }
  }

  private selectMention(role: { id: RoleId; name: string; icon: string; color: string }) {
    const insertIndex = this.mentionStartIndex;
    const before = this.messageInput.substring(0, insertIndex);
    const afterStart = insertIndex + 1 + this.mentionFilter.length;
    const after = this.messageInput.substring(afterStart);
    this.messageInput = before + '@' + role.id + ' ' + after;
    this.showMentionPopup = false;
    this.mentionFilter = '';
    this.mentionStartIndex = -1;
    this.requestUpdate();
    setTimeout(() => {
      const input = this.shadowRoot?.querySelector('.message-input') as HTMLTextAreaElement;
      if (input) {
        input.focus();
        const newPos = insertIndex + role.id.length + 2;
        input.setSelectionRange(newPos, newPos);
      }
    }, 0);
  }

  private handleSend() {
    const text = this.messageInput.trim();
    if (!text) return;
    
    this.dispatchEvent(new CustomEvent('collaboration-send', {
      detail: { message: text, mentions: this.extractMentions(text) },
      bubbles: true,
      composed: true,
    }));
    
    this.messageInput = '';
  }

  private extractMentions(text: string): RoleId[] {
    const mentions: RoleId[] = [];
    const seen = new Set<RoleId>();
    const regex = /@(\w[\w-]*)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const roleId = match[1] as RoleId;
      if (ROLE_THEMES[roleId] && !seen.has(roleId)) {
        mentions.push(roleId);
        seen.add(roleId);
      }
    }
    return mentions;
  }

  render() {
    const filteredItems = this.getFilteredItems();
    const counts = {
      discussions: this.items.filter(i => i.type === 'discussion').length,
      requests: this.items.filter(i => i.type === 'request' || i.type === 'invitation').length,
      tasks: this.items.filter(i => i.type === 'task').length,
    };

    return html`
      <div class="section-header">
        <h3 class="section-title">
          <span class="section-icon">💬</span>
          协作指挥
        </h3>
        <button class="new-btn" @click=${this.handleNewCollaboration}>+ 新建</button>
      </div>

      <div class="message-input-container">
        <textarea 
          class="message-input"
          placeholder="输入消息，使用 @ 提及角色..."
          .value=${this.messageInput}
          @input=${this.handleInput}
          @keydown=${this.handleKeyDown}
          rows="1"
          maxlength="1000"
          aria-label="输入消息"
        ></textarea>
        ${this.showMentionPopup ? html`
          <div class="mention-popup" role="listbox" aria-label="选择要提及的角色">
            ${this.getFilteredRoles().map((role, index) => html`
              <div 
                class="mention-item ${index === this.selectedMentionIndex ? 'selected' : ''}"
                role="option"
                aria-selected=${index === this.selectedMentionIndex}
                @click=${() => this.selectMention(role)}
              >
                <div class="mention-item-icon" style="background: ${role.color}">
                  ${role.icon}
                </div>
                <span class="mention-item-name">${role.name}</span>
                <span class="mention-item-id">@${role.id}</span>
              </div>
            `)}
          </div>
        ` : ''}
      </div>
      <button 
        class="send-btn" 
        @click=${this.handleSend}
        ?disabled=${!this.messageInput.trim()}
      >
        发送
      </button>

      <div class="tabs" role="tablist" aria-label="协作类型">
        <button 
          class="tab ${this.activeTab === 'discussions' ? 'active' : ''}"
          role="tab"
          aria-selected=${this.activeTab === 'discussions'}
          @click=${() => this.activeTab = 'discussions'}
        >
          讨论
          <span class="tab-badge">${counts.discussions}</span>
        </button>
        <button 
          class="tab ${this.activeTab === 'requests' ? 'active' : ''}"
          role="tab"
          aria-selected=${this.activeTab === 'requests'}
          @click=${() => this.activeTab = 'requests'}
        >
          请求
          <span class="tab-badge">${counts.requests}</span>
        </button>
        <button 
          class="tab ${this.activeTab === 'tasks' ? 'active' : ''}"
          role="tab"
          aria-selected=${this.activeTab === 'tasks'}
          @click=${() => this.activeTab = 'tasks'}
        >
          任务
          <span class="tab-badge">${counts.tasks}</span>
        </button>
      </div>

      <div class="items-list">
        ${filteredItems.length === 0 ? html`
          <div class="empty-state" role="status">
            <div style="font-size: 32px; margin-bottom: 8px;">💬</div>
            <div>暂无${this.activeTab === 'discussions' ? '讨论' : this.activeTab === 'requests' ? '请求' : '任务'}内容</div>
            <button 
              class="new-btn" 
              style="margin-top: 12px;"
              @click=${this.handleNewCollaboration}
            >
              创建第一个${this.activeTab === 'discussions' ? '讨论' : this.activeTab === 'requests' ? '请求' : '任务'}
            </button>
          </div>
        ` : filteredItems.map((item, index) => {
          const avatar = this.getParticipantAvatar(item.participants[0]);
          const theme = ROLE_THEMES[item.participants[0]];
          return html`
            <div 
              class="item-card" 
              @click=${() => this.handleItemClick(item)}
              @keydown=${(e: KeyboardEvent) => this.handleItemKeyDown(e, item)}
              role="button"
              tabindex="0"
              aria-label="${item.title}, ${item.type}, ${this.formatTime(item.timestamp)}"
            >
              <div class="item-header">
                <span class="item-type ${item.type}">${item.type}</span>
                <span class="item-time">${this.formatTime(item.timestamp)}</span>
              </div>
              <div class="item-title">${item.title}</div>
              <div class="item-description">${item.description}</div>
              <div class="item-footer">
                <div class="item-participants">
                  ${item.participants.slice(0, 3).map(p => {
                    const av = this.getParticipantAvatar(p);
                    const theme = ROLE_THEMES[p];
                    return html`
                      <div 
                        class="participant-avatar"
                        style="background: ${av.bg}; color: ${av.fg}"
                        title="${theme?.nameCn || p}"
                      >
                        ${theme?.icon || '🤖'}
                      </div>
                    `;
                  })}
                  ${item.participants.length > 3 ? html`
                    <div class="participant-avatar" style="background: #1e293b;">
                      +${item.participants.length - 3}
                    </div>
                  ` : ''}
                </div>
                ${item.scenario ? html`
                  <span class="item-scenario">${item.scenario}</span>
                ` : ''}
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-role-collaboration-section': ScRoleCollaborationSection;
  }
}
