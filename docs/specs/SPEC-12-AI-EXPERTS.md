# SPEC-12: AI Experts Page

> **Document Version**: 1.0  
> **Created**: 2026-03-08  
> **Purpose**: AI-Implementation-Ready Specification for SecuClaw AI Experts Page

---

## 1. Page Overview

### 1.1 Purpose
The AI Experts page is the core interface for interacting with the 8 security roles. It displays role cards, skills capabilities, and provides a chat interface for AI-powered security consultations.

### 1.2 Key Features
- 8 security role cards with visual representation
- Skills capability display (Light/Dark/Security/Legal/Technology/Business)
- MITRE ATT&CK and SCF coverage visualization
- LLM-powered chat interface per role
- Role switching with persistent LLM binding

### 1.3 Implementation Status Update (2026-03-09)

Current code implementation (`ui/src/ui/pages/sc-ai-experts-page.ts`) already includes:

1. 8 role cards + role switching
2. Skills/Chat two-tab layout
3. 6-category capability rendering with MITRE/SCF coverage tags
4. Dynamic system prompt generation per selected role
5. Provider retrieval via `llm.providers.list` and direct provider API chat calls
6. Local fallback response when provider is unavailable

Current integration gap:

1. Role-specific provider/model binding is not yet consumed as primary selection in chat.
2. This will be aligned in `SPEC-15` Sprint 0 with commander-backed role binding priority.

### 1.4 Detailed As-Is Implementation

#### 1.4.1 Entry and Layout

1. File: `ui/src/ui/pages/sc-ai-experts-page.ts`
2. Route: `/ai-experts`
3. Layout:
   - left: 8 role cards
   - right: role header + tabs (`skills`, `chat`)

#### 1.4.2 Skills Tab Data Flow

1. Primary source: `skillStore` (`ui/src/ui/store/skill-store.ts`)
2. Backend methods:
   - `skills.list`
   - `skills.get`
3. Fallback source: built-in default role capability map in page code.
4. Render content:
   - 6 capability categories: `light/dark/security/legal/technology/business`
   - MITRE coverage tags
   - SCF coverage tags
   - overview stats (total skills, active categories, coverage counts)

#### 1.4.3 Chat Tab Data Flow

1. Build role-specific system prompt from selected role capability set.
2. Load providers via `llm.providers.list`.
3. Current provider selection:
   - first enabled provider
   - fallback first item
4. Endpoint strategy:
   - local provider: `${baseUrl}/api/chat`
   - compatible provider: `${baseUrl}/chat/completions`
5. Failure fallback:
   - local deterministic response generator based on role skill categories.

#### 1.4.4 Relationship with Settings

1. Provider inventory depends on Settings -> LLM Service Config page output.
2. Role-provider-model binding UI exists in Settings -> AI Experts Config.
3. Current gap:
   - AI Experts page does not yet consume persisted role binding as first-priority provider/model source.

---

## 2. Component Structure

### 2.1 Main Component

**File**: `ui/src/ui/pages/sc-ai-experts-page.ts`

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';
import { gatewayClient } from '../gateway-client.js';
import { skillStore } from '../store/skill-store.js';
import { commanderStore } from '../store/commander-store.js';
import type { SkillDefinition } from '../store/skill-store.js';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface RoleInfo {
  id: string;
  name: string;
  emoji: string;
  description: string;
  llmBinding?: {
    providerId: string;
    modelName: string;
  };
}

const ROLES: RoleInfo[] = [
  { id: 'security-expert', name: 'Security Expert', emoji: '🛡️', description: 'Vulnerability management, penetration testing, threat analysis' },
  { id: 'privacy-officer', name: 'Privacy Officer', emoji: '🔐', description: 'Privacy compliance, GDPR/CCPA, data protection' },
  { id: 'security-architect', name: 'Security Architect', emoji: '🏗️', description: 'Security architecture, zero trust, defense in depth' },
  { id: 'business-security-officer', name: 'Business Security Officer', emoji: '📊', description: 'Business continuity, risk quantification, supply chain' },
  { id: 'secuclaw-commander', name: 'SecuClaw Commander', emoji: '🎯', description: 'Full-spectrum security command, crisis management' },
  { id: 'ciso', name: 'CISO', emoji: '👔', description: 'Security strategy, compliance governance, risk management' },
  { id: 'security-ops', name: 'Security Operations', emoji: '⚙️', description: 'SOC operations, threat monitoring, incident response' },
  { id: 'supply-chain-security', name: 'Supply Chain Security', emoji: '🔗', description: 'Vendor security, third-party risk, supply chain compliance' },
];

@customElement('sc-ai-experts-page')
export class ScAiExpertsPage extends LitElement {
  private i18n = new I18nController(this);

  @state()
  private selectedRoleId: string = 'security-expert';

  @state()
  private selectedSkill: SkillDefinition | null = null;

  @state()
  private chatMessages: ChatMessage[] = [];

  @state()
  private chatInput: string = '';

  @state()
  private isStreaming: boolean = false;

  @state()
  private loading: boolean = true;

  static styles = css`
    :host {
      display: block;
      height: calc(100vh - 64px);
    }

    .page-container {
      display: grid;
      grid-template-columns: 300px 1fr;
      height: 100%;
      gap: var(--sc-spacing-lg);
    }

    @media (max-width: 1024px) {
      .page-container {
        grid-template-columns: 1fr;
      }
    }

    /* Role Cards Panel */
    .roles-panel {
      background-color: var(--sc-bg-card);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-lg);
      padding: var(--sc-spacing-md);
      overflow-y: auto;
    }

    .roles-title {
      font-size: var(--sc-font-size-lg);
      font-weight: 600;
      color: var(--sc-text-primary);
      margin-bottom: var(--sc-spacing-md);
    }

    .role-card {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-md);
      padding: var(--sc-spacing-md);
      margin-bottom: var(--sc-spacing-sm);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-md);
      cursor: pointer;
      transition: all var(--sc-transition-fast);
    }

    .role-card:hover {
      background-color: var(--sc-bg-hover);
      border-color: var(--sc-primary);
    }

    .role-card.active {
      background-color: var(--sc-primary-light);
      border-color: var(--sc-primary);
    }

    .role-emoji {
      font-size: 32px;
    }

    .role-info {
      flex: 1;
    }

    .role-name {
      font-size: var(--sc-font-size-sm);
      font-weight: 600;
      color: var(--sc-text-primary);
    }

    .role-desc {
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-tertiary);
      margin-top: var(--sc-spacing-xs);
    }

    .role-binding {
      font-size: var(--sc-font-size-xs);
      color: var(--sc-primary);
      margin-top: var(--sc-spacing-xs);
    }

    /* Main Content Area */
    .main-panel {
      display: flex;
      flex-direction: column;
      background-color: var(--sc-bg-card);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-lg);
      overflow: hidden;
    }

    .selected-role-header {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-md);
      padding: var(--sc-spacing-lg);
      border-bottom: 1px solid var(--sc-border-color);
    }

    .selected-role-emoji {
      font-size: 48px;
    }

    .selected-role-info h2 {
      font-size: var(--sc-font-size-xl);
      font-weight: 600;
      color: var(--sc-text-primary);
      margin: 0;
    }

    .selected-role-info p {
      font-size: var(--sc-font-size-sm);
      color: var(--sc-text-secondary);
      margin: var(--sc-spacing-xs) 0 0;
    }

    /* Tabs */
    .tabs {
      display: flex;
      border-bottom: 1px solid var(--sc-border-color);
    }

    .tab {
      padding: var(--sc-spacing-md) var(--sc-spacing-lg);
      font-size: var(--sc-font-size-sm);
      color: var(--sc-text-secondary);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all var(--sc-transition-fast);
    }

    .tab:hover {
      color: var(--sc-text-primary);
    }

    .tab.active {
      color: var(--sc-primary);
      border-bottom-color: var(--sc-primary);
    }

    /* Content */
    .content-area {
      flex: 1;
      overflow-y: auto;
      padding: var(--sc-spacing-lg);
    }

    /* Skills Panel */
    .skills-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--sc-spacing-md);
    }

    @media (max-width: 768px) {
      .skills-grid {
        grid-template-columns: 1fr;
      }
    }

    .skill-category {
      background-color: var(--sc-bg-secondary);
      border-radius: var(--sc-radius-md);
      padding: var(--sc-spacing-md);
    }

    .skill-category-header {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm);
      margin-bottom: var(--sc-spacing-sm);
    }

    .skill-category-icon {
      font-size: 20px;
    }

    .skill-category-name {
      font-size: var(--sc-font-size-sm);
      font-weight: 600;
      color: var(--sc-text-primary);
    }

    .skill-count {
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-tertiary);
      margin-left: auto;
    }

    .skill-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .skill-item {
      font-size: var(--sc-font-size-sm);
      color: var(--sc-text-secondary);
      padding: var(--sc-spacing-xs) 0;
      border-bottom: 1px solid var(--sc-border-color);
    }

    .skill-item:last-child {
      border-bottom: none;
    }

    /* Coverage Section */
    .coverage-section {
      margin-top: var(--sc-spacing-lg);
      padding-top: var(--sc-spacing-lg);
      border-top: 1px solid var(--sc-border-color);
    }

    .coverage-title {
      font-size: var(--sc-font-size-md);
      font-weight: 600;
      color: var(--sc-text-primary);
      margin-bottom: var(--sc-spacing-md);
    }

    .coverage-tags {
      display: flex;
      flex-wrap: wrap;
      gap: var(--sc-spacing-xs);
    }

    .coverage-tag {
      padding: var(--sc-spacing-xs) var(--sc-spacing-sm);
      background-color: var(--sc-bg-tertiary);
      border-radius: var(--sc-radius-full);
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-secondary);
    }

    /* Chat Interface */
    .chat-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: var(--sc-spacing-md);
    }

    .message {
      margin-bottom: var(--sc-spacing-md);
      max-width: 80%;
    }

    .message.user {
      margin-left: auto;
    }

    .message-content {
      padding: var(--sc-spacing-md);
      border-radius: var(--sc-radius-lg);
    }

    .message.user .message-content {
      background-color: var(--sc-primary);
      color: white;
    }

    .message.assistant .message-content {
      background-color: var(--sc-bg-secondary);
      color: var(--sc-text-primary);
    }

    .chat-input-area {
      display: flex;
      gap: var(--sc-spacing-sm);
      padding: var(--sc-spacing-md);
      border-top: 1px solid var(--sc-border-color);
    }

    .chat-input {
      flex: 1;
      padding: var(--sc-spacing-md);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-md);
      background-color: var(--sc-input-bg);
      color: var(--sc-text-primary);
      font-size: var(--sc-font-size-sm);
      resize: none;
    }

    .chat-input:focus {
      outline: none;
      border-color: var(--sc-input-focus);
    }

    .send-button {
      padding: var(--sc-spacing-md) var(--sc-spacing-lg);
      background-color: var(--sc-primary);
      color: white;
      border: none;
      border-radius: var(--sc-radius-md);
      font-size: var(--sc-font-size-sm);
      cursor: pointer;
      transition: background-color var(--sc-transition-fast);
    }

    .send-button:hover {
      background-color: var(--sc-primary-hover);
    }

    .send-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Skills Chat Response */
    .skills-response {
      background-color: var(--sc-bg-secondary);
      border-radius: var(--sc-radius-md);
      padding: var(--sc-spacing-lg);
    }

    .skills-response h4 {
      font-size: var(--sc-font-size-md);
      color: var(--sc-primary);
      margin-bottom: var(--sc-spacing-md);
    }

    .skills-response-section {
      margin-bottom: var(--sc-spacing-md);
    }

    .skills-response-section h5 {
      font-size: var(--sc-font-size-sm);
      color: var(--sc-text-secondary);
      margin-bottom: var(--sc-spacing-xs);
    }

    .skills-response-list {
      font-size: var(--sc-font-size-sm);
      color: var(--sc-text-primary);
    }
  `;

  @state()
  private activeTab: 'skills' | 'chat' = 'skills';

  constructor() {
    super();
    this.loadSelectedSkill();
  }

  private async loadSelectedSkill() {
    this.loading = true;
    try {
      await skillStore.loadSkill(this.selectedRoleId);
      this.selectedSkill = skillStore.getSkill(this.selectedRoleId);
    } catch (error) {
      console.error('Failed to load skill:', error);
    }
    this.loading = false;
  }

  private handleRoleSelect(roleId: string) {
    this.selectedRoleId = roleId;
    this.chatMessages = [];
    this.loadSelectedSkill();
  }

  private handleTabChange(tab: 'skills' | 'chat') {
    this.activeTab = tab;
  }

  private handleChatInput(e: Event) {
    this.chatInput = (e.target as HTMLTextAreaElement).value;
  }

  private async handleSendMessage() {
    if (!this.chatInput.trim() || this.isStreaming) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: this.chatInput,
      timestamp: Date.now(),
    };

    this.chatMessages = [...this.chatMessages, userMessage];
    const input = this.chatInput;
    this.chatInput = '';
    this.isStreaming = true;

    try {
      // Check if asking about role
      if (input.toLowerCase().includes('your role') || input.toLowerCase().includes('who are you')) {
        await this.sendRoleCapabilitiesResponse();
      } else {
        // Regular LLM chat
        const response = await gatewayClient.request<{ message: string }>('llm.chat', {
          roleId: this.selectedRoleId,
          messages: this.chatMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        });

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.message,
          timestamp: Date.now(),
        };

        this.chatMessages = [...this.chatMessages, assistantMessage];
      }
    } catch (error) {
      console.error('Chat error:', error);
    }

    this.isStreaming = false;
  }

  private async sendRoleCapabilitiesResponse() {
    const skill = this.selectedSkill;
    if (!skill) return;

    const capabilities = skill.metadata?.openclaw?.capabilities || {};
    const mitre = skill.metadata?.openclaw?.mitre_coverage || [];
    const scf = skill.metadata?.openclaw?.scf_coverage || [];

    const roleName = this.i18n.t(`roles.${this.selectedRoleId}`);
    const role = ROLES.find((r) => r.id === this.selectedRoleId);

    const content = this.generateSkillsResponse(roleName, role?.emoji || '🛡️', capabilities, mitre, scf);

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content,
      timestamp: Date.now(),
    };

    this.chatMessages = [...this.chatMessages, assistantMessage];
  }

  private generateSkillsResponse(
    roleName: string,
    emoji: string,
    capabilities: any,
    mitre: string[],
    scf: string[]
  ): string {
    const formatList = (items: string[]) => items.map((i) => `- ${i}`).join('\n');

    return `${emoji} **${roleName}**

My role is ${roleName}, with the following capabilities:

📋 **Light (Defense)**:
${formatList(capabilities.light || [])}

⚫ **Dark (Attack)**:
${formatList(capabilities.dark || [])}

🛡️ **Security**:
${formatList(capabilities.security || [])}

⚖️ **Legal & Compliance**:
${formatList(capabilities.legal || [])}

💻 **Technology**:
${formatList(capabilities.technology || [])}

📈 **Business**:
${formatList(capabilities.business || [])}

🎯 **MITRE ATT&CK Coverage**: ${mitre.length} tactics

🛡️ **SCF Coverage**: ${scf.length} control categories`;
  }

  private renderRoleCards() {
    const commander = commanderStore.getState().commander;

    return html`
      <div class="roles-panel">
        <h2 class="roles-title">${this.i18n.t('nav.aiExperts')}</h2>
        ${ROLES.map(
          (role) => html`
            <div
              class="role-card ${this.selectedRoleId === role.id ? 'active' : ''}"
              @click=${() => this.handleRoleSelect(role.id)}
            >
              <span class="role-emoji">${role.emoji}</span>
              <div class="role-info">
                <div class="role-name">${this.i18n.t(`roles.${role.id}`)}</div>
                <div class="role-desc">${role.description}</div>
                ${commander?.llmBindings?.[role.id]
                  ? html`
                      <div class="role-binding">
                        🤖 ${commander.llmBindings[role.id].modelName}
                      </div>
                    `
                  : ''}
              </div>
            </div>
          `
        )}
      </div>
    `;
  }

  private renderSkillCategory(icon: string, name: string, skills: string[]) {
    return html`
      <div class="skill-category">
        <div class="skill-category-header">
          <span class="skill-category-icon">${icon}</span>
          <span class="skill-category-name">${name}</span>
          <span class="skill-count">(${skills.length})</span>
        </div>
        <ul class="skill-list">
          ${skills.map((skill) => html` <li class="skill-item">${skill}</li> `)}
        </ul>
      </div>
    `;
  }

  private renderSkillsPanel() {
    const capabilities = this.selectedSkill?.metadata?.openclaw?.capabilities || {
      light: [],
      dark: [],
      security: [],
      legal: [],
      technology: [],
      business: [],
    };

    const mitre = this.selectedSkill?.metadata?.openclaw?.mitre_coverage || [];
    const scf = this.selectedSkill?.metadata?.openclaw?.scf_coverage || [];

    return html`
      <div class="skills-grid">
        ${this.renderSkillCategory('🔵', this.i18n.t('capabilities.light'), capabilities.light)}
        ${this.renderSkillCategory('⚫', this.i18n.t('capabilities.dark'), capabilities.dark)}
        ${this.renderSkillCategory('🛡️', this.i18n.t('capabilities.security'), capabilities.security)}
        ${this.renderSkillCategory('⚖️', this.i18n.t('capabilities.legal'), capabilities.legal)}
        ${this.renderSkillCategory('💻', this.i18n.t('capabilities.technology'), capabilities.technology)}
        ${this.renderSkillCategory('📈', this.i18n.t('capabilities.business'), capabilities.business)}
      </div>

      <div class="coverage-section">
        <h3 class="coverage-title">🎯 MITRE ATT&CK Coverage (${mitre.length}/14 tactics)</h3>
        <div class="coverage-tags">
          ${mitre.map((t) => html` <span class="coverage-tag">${t}</span> `)}
        </div>
      </div>

      <div class="coverage-section">
        <h3 class="coverage-title">🛡️ SCF Control Coverage (${scf.length} categories)</h3>
        <div class="coverage-tags">
          ${scf.map((t) => html` <span class="coverage-tag">${t}</span> `)}
        </div>
      </div>
    `;
  }

  private renderChatPanel() {
    return html`
      <div class="chat-container">
        <div class="chat-messages">
          ${this.chatMessages.length === 0
            ? html`
                <div style="text-align: center; color: var(--sc-text-tertiary); padding: 2rem;">
                  <p>Ask me about my role, or start a conversation about security topics.</p>
                  <p style="font-size: var(--sc-font-size-sm); margin-top: 1rem;">
                    Try: "What is your role?" or "Help me with threat analysis"
                  </p>
                </div>
              `
            : this.chatMessages.map(
                (msg) => html`
                  <div class="message ${msg.role}">
                    <div class="message-content">${msg.content}</div>
                  </div>
                `
              )}
        </div>
        <div class="chat-input-area">
          <textarea
            class="chat-input"
            .value=${this.chatInput}
            @input=${this.handleChatInput}
            placeholder="Type your message..."
            rows="2"
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
              }
            }}
          ></textarea>
          <button class="send-button" @click=${this.handleSendMessage} ?disabled=${this.isStreaming}>
            ${this.isStreaming ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    `;
  }

  render() {
    const role = ROLES.find((r) => r.id === this.selectedRoleId);

    return html`
      <div class="page-container">
        ${this.renderRoleCards()}

        <div class="main-panel">
          <div class="selected-role-header">
            <span class="selected-role-emoji">${role?.emoji}</span>
            <div class="selected-role-info">
              <h2>${this.i18n.t(`roles.${this.selectedRoleId}`)}</h2>
              <p>${role?.description}</p>
            </div>
          </div>

          <div class="tabs">
            <div
              class="tab ${this.activeTab === 'skills' ? 'active' : ''}"
              @click=${() => this.handleTabChange('skills')}
            >
              Skills Capabilities
            </div>
            <div
              class="tab ${this.activeTab === 'chat' ? 'active' : ''}"
              @click=${() => this.handleTabChange('chat')}
            >
              Chat
            </div>
          </div>

          <div class="content-area">
            ${this.activeTab === 'skills' ? this.renderSkillsPanel() : this.renderChatPanel()}
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-ai-experts-page': ScAiExpertsPage;
  }
}
```

---

## 3. Features

### 3.1 Role Cards

8 security roles displayed as clickable cards:
| Role | Emoji | Focus |
|------|-------|-------|
| Security Expert | 🛡️ | Vulnerability management, penetration testing |
| Privacy Officer | 🔐 | Privacy compliance, GDPR/CCPA |
| Security Architect | 🏗️ | Security architecture, zero trust |
| Business Security Officer | 📊 | Business continuity, risk quantification |
| SecuClaw Commander | 🎯 | Full-spectrum security command |
| CISO | 👔 | Security strategy, compliance governance |
| Security Operations | ⚙️ | SOC operations, incident response |
| Supply Chain Security | 🔗 | Vendor security, third-party risk |

### 3.2 Skills Capability Display

Shows 6 capability categories:
- 🔵 Light (Defense) - Defensive capabilities
- ⚫ Dark (Attack) - Offensive/penetration capabilities
- 🛡️ Security - Core security skills
- ⚖️ Legal - Compliance and legal skills
- 💻 Technology - Technical architecture skills
- 📈 Business - Business-related security skills

### 3.3 Coverage Display

- MITRE ATT&CK tactics coverage
- SCF control categories coverage

### 3.4 Chat Interface

- Ask "What is your role?" → Returns full skills breakdown
- LLM-powered conversations for security consultations
- Role-specific context and knowledge

---

## 4. API Endpoints

| Method | Description |
|--------|-------------|
| `skills.get` | Get skill definition for role |
| `llm.chat` | Send chat message to LLM |
| `commander.bindLLM` | Bind LLM to role |

---

## 5. UI Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ┌─────────────────┐ ┌─────────────────────────────────────────────────────┐ │
│ │ AI Experts      │ │ 🛡️ Security Expert                                │ │
│ │                 │ │ Vulnerability management, penetration testing       │ │
│ │ ┌─────────────┐ │ ├─────────────────────────────────────────────────────┤ │
│ │ │🛡️ Sec Expert│ │ │ [Skills Capabilities] [Chat]                       │ │
│ │ │  🤖 GPT-4   │ │ ├─────────────────────────────────────────────────────┤ │
│ │ └─────────────┘ │ │ ┌──────────┐ ┌──────────┐ ┌──────────┐             │ │
│ │ ┌─────────────┐ │ │ │🔵 Light  │ │⚫ Dark   │ │🛡️Security│             │ │
│ │ │🔐 Privacy   │ │ │ │(8 items) │ │(8 items) │ │(8 items) │             │ │
│ │ └─────────────┘ │ │ │• Vuln    │ │• Pen Test│ │• Risk    │             │ │
│ │ ┌─────────────┐ │ │ │  Scan    │ │• Red Team│ │  Assess  │             │ │
│ │ │🏗️ Architect │ │ │ │• Monitor │ │• Exploit │ │• Threat  │             │ │
│ │ └─────────────┘ │ │ └──────────┘ └──────────┘ └──────────┘             │ │
│ │ ┌─────────────┐ │ │                                                     │ │
│ │ │📊 Business  │ │ │ 🎯 MITRE ATT&CK: 11/14 tactics                     │ │
│ │ └─────────────┘ │ │ [Initial Access] [Execution] [Persistence]...      │ │
│ │ ┌─────────────┐ │ │                                                     │ │
│ │ │🎯 Commander │ │ │ 🛡️ SCF Coverage: 17 categories                     │ │
│ │ └─────────────┘ │ │ [GOV] [TRM] [ASM] [IRM]...                          │ │
│ │ ┌─────────────┐ │ │                                                     │ │
│ │ │👔 CISO      │ │ └─────────────────────────────────────────────────────┘ │
│ │ └─────────────┘ │                                                         │
│ │ ┌─────────────┐ │                                                         │
│ │ │⚙️ Sec Ops   │ │                                                         │
│ │ └─────────────┘ │                                                         │
│ │ ┌─────────────┐ │                                                         │
│ │ │🔗 Supply    │ │                                                         │
│ │ └─────────────┘ │                                                         │
│ └─────────────────┘                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Role Skills Response Format

When user asks "What is your role?":

```markdown
🛡️ **Security Expert**

My role is Security Expert, with the following capabilities:

📋 **Light (Defense)**:
- Vulnerability scanning
- Security monitoring
- Incident response
- Threat detection
...

⚫ **Dark (Attack)**:
- Penetration testing
- Red team operations
- Vulnerability exploitation
- Privilege escalation
...

🛡️ **Security**:
- Risk assessment
- Threat modeling
- Vulnerability management
...

🎯 **MITRE ATT&CK Coverage**: 11/14 tactics

🛡️ **SCF Coverage**: 17 control categories
```

---

*End of SPEC-12: AI Experts Page*
