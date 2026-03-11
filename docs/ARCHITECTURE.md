# SecuClaw Security Commander System Architecture

> 文档版本: v1.0  
> 创建日期: 2026-03-08  
> 项目路径: /Users/huangzhou/Documents/work/ai_secuclaw/secuclaw

---

## 一、系统愿景

### 1.1 核心理念

**SecuClaw安全指挥官系统**是一个以8种安全角色为核心、光明与黑暗双面技能为驱动的安全决策指挥平台。

```
┌─────────────────────────────────────────────────────────────────┐
│                    SecuClaw Commander Universe                   │
│                                                                  │
│    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    │
│    │ 个人    │    │ 企业    │    │ 政府    │    │ 组织    │    │
│    │ 指挥官  │    │ 指挥官  │    │ 指挥官  │    │ 指挥官  │    │
│    └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘    │
│         │              │              │              │          │
│         └──────────────┴──────┬───────┴──────────────┘          │
│                               │                                 │
│                    ┌──────────▼──────────┐                      │
│                    │      SecuHub        │                      │
│                    │    技能库中心        │                      │
│                    │  ┌───────────────┐  │                      │
│                    │  │ 8种安全角色   │  │                      │
│                    │  │ 光明/黑暗技能 │  │                      │
│                    │  │ MITRE + SCF   │  │                      │
│                    │  └───────────────┘  │                      │
│                    └─────────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 设计目标

1. **角色驱动**: 所有功能围绕8种安全角色设计
2. **双面能力**: 每个角色具备光明(防御)和黑暗(攻击)两种技能
3. **指挥官宇宙**: 支持不同个人、组织创建独立的安全指挥官
4. **技能连接**: 通过SecuHub技能库连接所有指挥官
5. **知识赋能**: 集成MITRE ATT&CK和SCF知识库

---

## 二、系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SecuClaw System                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Presentation Layer                            │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    Frontend (Lit + Vite)                     │   │   │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │   │   │
│  │  │  │ Dashboard│ │ Threats  │ │Incidents │ │ War-Room │       │   │   │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │   │   │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │   │   │
│  │  │  │AI Experts│ │Knowledge │ │  Skills  │ │ Channels │       │   │   │
│  │  │  │   Page   │ │   Base   │ │  Market  │ │   Page   │       │   │   │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │   │   │
│  │  │                                                              │   │   │
│  │  │  ┌──────────────────────────────────────────────────────┐   │   │   │
│  │  │  │                 i18n (zh-CN, en, zh-TW)               │   │   │   │
│  │  │  └──────────────────────────────────────────────────────┘   │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    │ WebSocket / REST API                   │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Gateway Layer                                │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              WebSocket Gateway (Port 21981)                  │   │   │
│  │  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   │   │   │
│  │  │  │  Control  │ │  Channel  │ │   Skill   │ │ Knowledge │   │   │   │
│  │  │  │  Plane    │ │  Manager  │ │  Router   │ │  Router   │   │   │   │
│  │  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘   │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          Core Services                               │   │
│  │                                                                     │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │   │
│  │  │  Commander  │ │    Skill    │ │  Knowledge  │ │   Channel   │  │   │
│  │  │   Manager   │ │   System    │ │    Base     │ │   Manager   │  │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │   │
│  │                                                                     │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │   │
│  │  │  SecuHub    │ │    LLM      │ │  Security   │ │    Org      │  │   │
│  │  │  Connector  │ │  Provider   │ │   Engine    │ │   Manager   │  │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                           Data Layer                                 │   │
│  │                                                                     │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │   │
│  │  │  Skills/    │ │  MITRE/     │ │   SCF/      │ │  Config/    │  │   │
│  │  │  8 Roles    │ │  ATT&CK     │ │  Controls   │ │  Storage    │  │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 前端框架 | Lit (Web Components) | 轻量级、高性能 |
| 构建工具 | Vite | 快速开发体验 |
| 状态管理 | 自定义 Store | 基于 Lit reactive |
| 国际化 | i18n (参考openclaw) | zh-CN, en, zh-TW |
| 通信协议 | WebSocket | 实时双向通信 |
| 后端运行时 | Bun/Node.js | 高性能 JavaScript |
| 数据存储 | JSON Files + SQLite | 轻量级持久化 |

---

## 三、核心概念

### 3.1 指挥官 (Commander)

指挥官是SecuClaw系统的核心实体，代表一个安全决策主体。

```typescript
interface Commander {
  id: string;                    // 指挥官唯一标识
  name: string;                  // 指挥官名称
  type: 'personal' | 'organization' | 'government';
  organization?: string;         // 所属组织
  createdAt: number;             // 创建时间
  updatedAt: number;             // 更新时间
  
  // 角色配置
  roles: RoleConfig[];           // 激活的角色列表
  primaryRole: string;           // 主角色ID
  
  // LLM绑定
  llmBindings: Record<string, LLMBinding>;  // 角色ID -> LLM绑定
  
  // 技能状态
  skillStates: Record<string, SkillState>;  // 技能ID -> 状态
  
  // 设置
  settings: CommanderSettings;
}

interface RoleConfig {
  roleId: string;                // 角色ID
  enabled: boolean;              // 是否启用
  activatedAt?: number;          // 激活时间
  customCapabilities?: Partial<Capabilities>;  // 自定义能力覆盖
}

interface LLMBinding {
  providerId: string;            // LLM服务商ID
  modelName: string;             // 模型名称
  temperature?: number;          // 温度参数
  maxTokens?: number;            // 最大token数
}
```

### 3.2 八种安全角色

| 角色ID | 名称 | Emoji | 组合 | 光明能力 | 黑暗能力 |
|--------|------|-------|------|----------|----------|
| security-expert | 安全专家 | 🛡️ | SEC | 漏洞扫描、安全监控、事件响应 | 渗透测试、红队演练、漏洞利用 |
| privacy-officer | 隐私安全官 | 🔐 | SEC+LEG | 隐私影响评估、合规审计、用户权利响应 | 隐私合规渗透、数据流向追踪 |
| security-architect | 安全架构师 | 🏗️ | SEC+IT | 安全架构设计、零信任架构、防御纵深 | 架构弱点分析、攻击路径绘制 |
| business-security-officer | 业务安全官 | 📊 | SEC+BIZ | 业务连续性管理、风险量化评估、供应链安全 | 业务逻辑漏洞挖掘、业务流程攻击模拟 |
| secuclaw-commander | 全域安全指挥官 | 🎯 | SEC+LEG+IT+BIZ | 战略规划、全面安全治理、危机管理 | 全面渗透测试、APT模拟、供应链攻击 |
| ciso | 首席信息安全官 | 👔 | SEC+LEG+IT | 安全战略规划、合规治理、风险管理 | 合规漏洞挖掘、监管渗透测试 |
| security-ops | 安全运营官 | ⚙️ | SEC+IT+BIZ | 威胁监控、事件响应、SOC运营 | 渗透测试、红队演练、攻击路径发现 |
| supply-chain-security | 供应链安全官 | 🔗 | SEC+LEG+BIZ | 供应商安全评估、第三方风险管理、供应链合规 | 供应链渗透测试、第三方漏洞挖掘 |

### 3.3 技能能力分类

每个角色的技能分为6个维度：

```typescript
interface Capabilities {
  light: string[];       // 光明面 - 防御性、建设性安全能力
  dark: string[];        // 黑暗面 - 攻击性、渗透测试能力
  security: string[];    // 安全技术 - 传统安全技术能力
  legal: string[];       // 法律合规 - 法律合规相关能力
  technology: string[];  // 技术架构 - 技术架构相关能力
  business: string[];    // 业务 - 业务相关能力
}
```

### 3.4 SecuHub 技能库

SecuHub是连接所有指挥官的中央技能库：

```
SecuHub/
├── skills/                    # 8种角色技能定义
│   ├── security-expert/
│   │   ├── SKILL.md          # 中文定义
│   │   └── SKILL.en-US.md    # 英文定义
│   ├── privacy-officer/
│   ├── security-architect/
│   ├── business-security-officer/
│   ├── secuclaw-commander/
│   ├── ciso/
│   ├── security-ops/
│   └── supply-chain-security/
│
├── knowledge/                 # 知识库
│   ├── mitre/                # MITRE ATT&CK
│   │   ├── enterprise-attack.json
│   │   ├── mobile-attack.json
│   │   └── ics-attack.json
│   └── scf/                  # SCF控制框架
│       ├── scf-data.json
│       ├── scf-20254.json
│       └── ...
│
├── marketplace/               # 技能市场
│   ├── plugins/              # 可安装的技能插件
│   └── templates/            # 报告模板、可视化模板
│
└── connectors/                # 外部连接器
    ├── llm-providers/        # LLM服务商连接
    ├── channels/             # 通讯渠道连接
    └── tools/                # 安全工具集成
```

---

## 四、核心组件设计

### 4.1 Commander Manager (指挥官管理器)

```typescript
class CommanderManager {
  // 指挥官CRUD
  async createCommander(config: CommanderConfig): Promise<Commander>;
  async getCommander(id: string): Promise<Commander>;
  async updateCommander(id: string, updates: Partial<Commander>): Promise<Commander>;
  async deleteCommander(id: string): Promise<void>;
  
  // 角色管理
  async activateRole(commanderId: string, roleId: string): Promise<void>;
  async deactivateRole(commanderId: string, roleId: string): Promise<void>;
  async setPrimaryRole(commanderId: string, roleId: string): Promise<void>;
  
  // LLM绑定
  async bindLLM(commanderId: string, roleId: string, binding: LLMBinding): Promise<void>;
  async unbindLLM(commanderId: string, roleId: string): Promise<void>;
  
  // 技能状态
  async getSkillState(commanderId: string, skillId: string): Promise<SkillState>;
  async activateSkill(commanderId: string, skillId: string): Promise<void>;
}
```

### 4.2 Skill System (技能系统)

```typescript
class SkillSystem {
  // 技能加载
  async loadSkill(roleId: string): Promise<SkillDefinition>;
  async loadAllSkills(): Promise<Record<string, SkillDefinition>>;
  
  // 技能解析
  parseSkillMarkdown(content: string): SkillDefinition;
  
  // 能力查询
  getCapabilities(roleId: string): Promise<Capabilities>;
  getMitreCoverage(roleId: string): Promise<string[]>;
  getScfCoverage(roleId: string): Promise<string[]>;
  
  // 技能市场
  async getAvailableSkills(): Promise<SkillMarketItem[]>;
  async installSkill(commanderId: string, skillId: string): Promise<void>;
  async uninstallSkill(commanderId: string, skillId: string): Promise<void>;
}

interface SkillDefinition {
  name: string;
  description: string;
  metadata: {
    openclaw: {
      emoji: string;
      role: string;
      combination: 'single' | 'binary' | 'ternary' | 'quaternary';
      version: string;
      capabilities: Capabilities;
      mitre_coverage: string[];
      scf_coverage: string[];
    };
  };
  visualizations?: Visualization[];
  content: string;  // Markdown内容
}
```

### 4.3 Knowledge Base (知识库)

```typescript
class KnowledgeBase {
  // MITRE ATT&CK
  async getMitreTactics(): Promise<MitreTactic[]>;
  async getMitreTechniques(): Promise<MitreTechnique[]>;
  async searchMitre(query: string): Promise<MitreSearchResult[]>;
  async getMitreStats(): Promise<MitreStats>;
  
  // SCF控制框架
  async getScfDomains(): Promise<ScfDomain[]>;
  async getScfControls(): Promise<ScfControl[]>;
  async searchScf(query: string): Promise<ScfSearchResult[]>;
  async getScfStats(): Promise<ScfStats>;
  
  // 知识关联
  async getRelatedMitre(scfControlId: string): Promise<MitreTechnique[]>;
  async getRelatedScf(mitreTechniqueId: string): Promise<ScfControl[]>;
}
```

### 4.4 Channel Manager (通讯渠道管理器)

```typescript
class ChannelManager {
  // 渠道状态
  async getChannelStatus(): Promise<ChannelsStatus>;
  async getChannelAccounts(channelId: string): Promise<ChannelAccount[]>;
  
  // 渠道配置
  async configureChannel(channelId: string, config: ChannelConfig): Promise<void>;
  async enableChannel(channelId: string): Promise<void>;
  async disableChannel(channelId: string): Promise<void>;
  
  // 消息发送
  async sendMessage(channelId: string, message: OutgoingMessage): Promise<void>;
  async broadcastAlert(alert: SecurityAlert): Promise<void>;
}

// 支持的通讯渠道
type ChannelId = 
  | 'feishu'      // 飞书
  | 'telegram'    // Telegram
  | 'slack'       // Slack
  | 'discord'     // Discord
  | 'whatsapp'    // WhatsApp
  | 'google-chat' // Google Chat
  | 'teams'       // Microsoft Teams
  | 'signal'      // Signal
  | 'imessage'    // iMessage
  | 'nostr';      // Nostr
```

### 4.5 LLM Provider (LLM服务商)

```typescript
class LLMProviderManager {
  // 服务商管理
  async getProviders(): Promise<LLMProvider[]>;
  async addProvider(provider: LLMProviderConfig): Promise<LLMProvider>;
  async updateProvider(id: string, updates: Partial<LLMProviderConfig>): Promise<LLMProvider>;
  async deleteProvider(id: string): Promise<void>;
  
  // 模型管理
  async getAvailableModels(providerId: string): Promise<string[]>;
  
  // 对话
  async chat(request: ChatRequest): Promise<ChatResponse>;
  async streamChat(request: ChatRequest): AsyncGenerator<ChatChunk>;
}

interface LLMProvider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'azure' | 'local' | 'custom';
  baseUrl: string;
  apiKey?: string;
  models: string[];
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}
```

---

## 五、前端架构

### 5.1 目录结构

```
ui/
├── src/
│   ├── main.ts                      # 入口
│   ├── i18n/                        # 国际化
│   │   ├── index.ts
│   │   ├── lib/
│   │   │   ├── translate.ts         # I18nManager
│   │   │   ├── types.ts             # 类型定义
│   │   │   ├── registry.ts          # 语言注册
│   │   │   └── lit-controller.ts    # Lit控制器
│   │   └── locales/
│   │       ├── zh-CN.ts             # 简体中文
│   │       ├── en.ts                # 英文
│   │       └── zh-TW.ts             # 繁体中文
│   │
│   ├── ui/
│   │   ├── app.ts                   # 根组件
│   │   ├── router.ts                # 路由
│   │   ├── gateway-client.ts        # WebSocket客户端
│   │   │
│   │   ├── layout/
│   │   │   ├── sc-layout.ts         # 布局容器
│   │   │   ├── sc-sidebar.ts        # 侧边栏
│   │   │   └── sc-header.ts         # 顶部栏
│   │   │
│   │   ├── pages/
│   │   │   ├── sc-dashboard.ts      # 仪表盘
│   │   │   ├── sc-threats-page.ts   # 威胁情报
│   │   │   ├── sc-incidents-page.ts # 安全事件
│   │   │   ├── sc-vulnerabilities-page.ts  # 漏洞管理
│   │   │   ├── sc-compliance-page.ts # 合规审计
│   │   │   ├── sc-reports-page.ts   # 分析报告
│   │   │   ├── sc-risk-page.ts      # 安全风险
│   │   │   ├── sc-war-room-page.ts  # 作战室
│   │   │   ├── sc-ai-experts-page.ts # AI安全专家
│   │   │   ├── sc-knowledge-base.ts # 知识库
│   │   │   ├── sc-skills-market.ts  # 技能市场
│   │   │   ├── sc-channels-page.ts  # 通讯管理
│   │   │   └── settings/
│   │   │       ├── sc-settings-page.ts
│   │   │       ├── sc-llm-service-config.ts
│   │   │       └── sc-ai-experts-config.ts
│   │   │
│   │   ├── components/
│   │   │   ├── sc-role-card.ts      # 角色卡片
│   │   │   ├── sc-skill-panel.ts    # 技能面板
│   │   │   ├── sc-mitre-heatmap.ts  # MITRE热力图
│   │   │   ├── sc-scf-dashboard.ts  # SCF仪表盘
│   │   │   └── sc-channel-card.ts   # 渠道卡片
│   │   │
│   │   └── store/
│   │       ├── commander-store.ts   # 指挥官状态
│   │       ├── skill-store.ts       # 技能状态
│   │       └── ui-store.ts          # UI状态
│   │
│   └── styles/
│       ├── main.css
│       └── themes/
│           ├── light.css
│           └── dark.css
│
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### 5.2 路由设计

```typescript
const routes = {
  '/': 'sc-dashboard',
  '/threats': 'sc-threats-page',
  '/threats/:id': 'sc-threat-detail',
  '/incidents': 'sc-incidents-page',
  '/vulnerabilities': 'sc-vulnerabilities-page',
  '/compliance': 'sc-compliance-page',
  '/reports': 'sc-reports-page',
  '/risk': 'sc-risk-page',
  '/war-room': 'sc-war-room-page',
  '/ai-experts': 'sc-ai-experts-page',
  '/knowledge-base': 'sc-knowledge-base',
  '/skills-market': 'sc-skills-market',
  '/channels': 'sc-channels-page',
  '/settings': 'sc-settings-page',
  '/settings/llm-config': 'sc-llm-service-config',
  '/settings/ai-experts-config': 'sc-ai-experts-config',
};
```

### 5.3 页面与角色映射

| 页面 | 主角色 | 次角色 | 功能特点 |
|------|--------|--------|----------|
| 仪表盘 | CISO | 安全专家 | 风险仪表盘、合规状态、预算分配 |
| 威胁情报 | 安全专家 | - | 漏洞分布、攻击面分析、MITRE映射 |
| 安全事件 | 安全运营官 | CISO | 事件时间线、响应工作流、SOC指标 |
| 漏洞管理 | 安全专家 | 安全运营官 | 漏洞列表、CVSS评分、修复建议 |
| 合规审计 | CISO | 隐私安全官 | 合规框架、控制项检查、差距分析 |
| 分析报告 | CISO | 业务安全官 | 报告模板、风险分析、投资回报 |
| 安全风险 | CISO | 业务安全官 | 风险矩阵、量化分析、业务影响 |
| 作战室 | 全域指挥官 | 安全运营官 | 实时态势、协同响应、资源调度 |
| AI专家 | 所有角色 | - | 角色切换、技能展示、对话交互 |

### 5.4 角色技能面板组件

```typescript
// sc-skill-panel.ts
@customElement('sc-skill-panel')
export class ScSkillPanel extends LitElement {
  @property({ type: String }) roleId: string = '';
  @property({ type: Object }) skill: SkillDefinition | null = null;
  
  render() {
    if (!this.skill) return html`<div class="loading">Loading...</div>`;
    
    const { capabilities, mitre_coverage, scf_coverage } = this.skill.metadata.openclaw;
    
    return html`
      <div class="skill-panel">
        <div class="skill-header">
          <span class="emoji">${this.skill.metadata.openclaw.emoji}</span>
          <h3>${t(`roles.${this.roleId}`)}</h3>
        </div>
        
        <div class="capabilities-grid">
          ${this.renderCapabilityCategory('light', '🔵', capabilities.light)}
          ${this.renderCapabilityCategory('dark', '⚫', capabilities.dark)}
          ${this.renderCapabilityCategory('security', '🛡️', capabilities.security)}
          ${this.renderCapabilityCategory('legal', '⚖️', capabilities.legal)}
          ${this.renderCapabilityCategory('technology', '💻', capabilities.technology)}
          ${this.renderCapabilityCategory('business', '📈', capabilities.business)}
        </div>
        
        <div class="coverage-section">
          <h4>🎯 MITRE ATT&CK 覆盖 (${mitre_coverage.length}/14 战术)</h4>
          <div class="coverage-tags">
            ${mitre_coverage.map(t => html`<span class="tag">${t}</span>`)}
          </div>
        </div>
        
        <div class="coverage-section">
          <h4>🛡️ SCF 控制项覆盖 (${scf_coverage.length} 项)</h4>
          <div class="coverage-tags">
            ${scf_coverage.map(t => html`<span class="tag">${t}</span>`)}
          </div>
        </div>
      </div>
    `;
  }
  
  private renderCapabilityCategory(key: string, emoji: string, items: string[]) {
    return html`
      <div class="capability-category ${key}">
        <div class="category-header">
          <span class="emoji">${emoji}</span>
          <span class="name">${t(`capabilities.${key}`)}</span>
          <span class="count">(${items.length})</span>
        </div>
        <ul class="capability-list">
          ${items.map(item => html`<li>${item}</li>`)}
        </ul>
      </div>
    `;
  }
}
```

---

## 六、后端架构

### 6.1 目录结构

```
packages/core/src/
├── main.ts                     # 入口
├── gateway/
│   ├── server.ts               # WebSocket服务器
│   ├── router.ts               # API路由
│   └── middleware/
│       ├── auth.ts
│       └── validation.ts
│
├── commander/
│   ├── manager.ts              # 指挥官管理器
│   ├── store.ts                # 指挥官存储
│   └── types.ts
│
├── skills/
│   ├── loader.ts               # 技能加载器
│   ├── parser.ts               # SKILL.md解析器
│   ├── manager.ts              # 技能管理器
│   └── market-service.ts       # 技能市场服务
│
├── knowledge/
│   ├── mitre/
│   │   ├── loader.ts           # MITRE数据加载
│   │   ├── search.ts           # MITRE搜索
│   │   └── types.ts
│   └── scf/
│       ├── loader.ts           # SCF数据加载
│       ├── search.ts           # SCF搜索
│       └── types.ts
│
├── channels/
│   ├── manager.ts              # 渠道管理器
│   ├── feishu.ts
│   ├── telegram.ts
│   ├── slack.ts
│   ├── discord.ts
│   ├── whatsapp.ts
│   ├── google-chat.ts
│   ├── teams.ts
│   ├── signal.ts
│   ├── imessage.ts
│   └── nostr.ts
│
├── llm/
│   ├── provider-manager.ts     # LLM服务商管理
│   ├── openai.ts
│   ├── anthropic.ts
│   ├── azure.ts
│   └── local.ts
│
└── storage/
    ├── json-store.ts           # JSON文件存储
    └── sqlite-store.ts         # SQLite存储
```

### 6.2 WebSocket协议

```typescript
// 消息类型
type GatewayMessage = 
  | RequestMessage
  | ResponseMessage
  | EventMessage;

interface RequestMessage {
  type: 'req';
  seq: number;
  method: string;
  params?: Record<string, unknown>;
}

interface ResponseMessage {
  type: 'res';
  seq: number;
  result?: unknown;
  error?: { code: string; message: string };
}

interface EventMessage {
  type: 'event';
  event: string;
  data?: unknown;
}

// API方法
const apiMethods = {
  // 指挥官
  'commander.get': (id: string) => Commander;
  'commander.create': (config: CommanderConfig) => Commander;
  'commander.update': (id: string, updates: Partial<Commander>) => Commander;
  
  // 技能
  'skills.list': () => SkillDefinition[];
  'skills.get': (roleId: string) => SkillDefinition;
  'skills.activate': (commanderId: string, skillId: string) => void;
  
  // 知识库
  'knowledge.mitre.search': (query: string) => MitreSearchResult[];
  'knowledge.mitre.tactics': () => MitreTactic[];
  'knowledge.scf.search': (query: string) => ScfSearchResult[];
  'knowledge.scf.domains': () => ScfDomain[];
  
  // 渠道
  'channels.status': () => ChannelsStatus;
  'channels.configure': (channelId: string, config: ChannelConfig) => void;
  
  // LLM
  'llm.providers.list': () => LLMProvider[];
  'llm.providers.add': (provider: LLMProviderConfig) => LLMProvider;
  'llm.chat': (request: ChatRequest) => ChatResponse;
  
  // AI专家对话
  'ai-experts.chat': (roleId: string, message: string) => ChatResponse;
  'ai-experts.getCapabilities': (roleId: string) => Capabilities;
};
```

### 6.3 REST API端点

```typescript
// REST API (用于文件上传、导出等)
const restEndpoints = {
  // 知识库
  'GET /api/knowledge/mitre/stats': () => MitreStats;
  'GET /api/knowledge/mitre/tactics': () => MitreTactic[];
  'GET /api/knowledge/mitre/techniques': () => MitreTechnique[];
  'POST /api/knowledge/mitre/search': (query: string) => MitreSearchResult[];
  
  'GET /api/knowledge/scf/stats': () => ScfStats;
  'GET /api/knowledge/scf/domains': () => ScfDomain[];
  'GET /api/knowledge/scf/controls': () => ScfControl[];
  'POST /api/knowledge/scf/search': (query: string) => ScfSearchResult[];
  
  // 技能
  'GET /api/skills': () => SkillDefinition[];
  'GET /api/skills/:roleId': (roleId: string) => SkillDefinition;
  'GET /api/skills/:roleId/capabilities': (roleId: string) => Capabilities;
  
  // LLM服务商
  'GET /api/llm/providers': () => LLMProvider[];
  'POST /api/llm/providers': (provider: LLMProviderConfig) => LLMProvider;
  'PUT /api/llm/providers/:id': (id: string, updates: Partial<LLMProviderConfig>) => LLMProvider;
  'DELETE /api/llm/providers/:id': (id: string) => void;
  
  // 渠道
  'GET /api/channels/status': () => ChannelsStatus;
  'POST /api/channels/:channelId/config': (channelId: string, config: ChannelConfig) => void;
  'POST /api/channels/:channelId/send': (channelId: string, message: OutgoingMessage) => void;
  
  // 页面角色技能
  'GET /api/pages/:pageId/role-skills': (pageId: string) => PageRoleSkillsResponse;
};
```

---

## 七、数据模型

### 7.1 指挥官模型

```typescript
// 存储位置: ~/.secuclaw/commanders/{commander-id}.json
interface Commander {
  id: string;
  name: string;
  type: 'personal' | 'organization' | 'government';
  organization?: string;
  createdAt: number;
  updatedAt: number;
  
  roles: RoleConfig[];
  primaryRole: string;
  
  llmBindings: Record<string, LLMBinding>;
  skillStates: Record<string, SkillState>;
  
  settings: {
    language: 'zh-CN' | 'en' | 'zh-TW';
    theme: 'light' | 'dark' | 'system';
    notifications: {
      enabled: boolean;
      channels: string[];
    };
  };
}

interface RoleConfig {
  roleId: string;
  enabled: boolean;
  activatedAt?: number;
  customCapabilities?: Partial<Capabilities>;
}

interface LLMBinding {
  providerId: string;
  modelName: string;
  temperature?: number;
  maxTokens?: number;
}

interface SkillState {
  installed: boolean;
  activated: boolean;
  installedAt?: number;
  activatedAt?: number;
  version: string;
}
```

### 7.2 LLM服务商模型

```typescript
// 存储位置: ~/.secuclaw/config/llm-providers.json
interface LLMProvider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'azure' | 'local' | 'custom';
  baseUrl: string;
  apiKey?: string;
  models: string[];
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

interface LLMProviderConfig {
  name: string;
  type: string;
  baseUrl: string;
  apiKey?: string;
  models: string[];
  enabled?: boolean;
}
```

### 7.3 技能定义模型

```typescript
// 来源: skills/{role-id}/SKILL.md
interface SkillDefinition {
  name: string;
  description: string;
  homepage: string;
  
  metadata: {
    openclaw: {
      emoji: string;
      role: string;
      combination: 'single' | 'binary' | 'ternary' | 'quaternary';
      version: string;
      capabilities: Capabilities;
      mitre_coverage: string[];
      scf_coverage: string[];
    };
  };
  
  visualizations?: {
    mode: 'inline' | 'modal' | 'hybrid';
    inline: Visualization[];
  };
  
  content: string;
}

interface Capabilities {
  light: string[];
  dark: string[];
  security: string[];
  legal: string[];
  technology: string[];
  business: string[];
}

interface Visualization {
  id: string;
  name: string;
  description: string;
  type: 'chart' | 'table' | 'graph' | 'timeline' | 'gauge';
  category: 'widget' | 'dashboard' | 'panel';
  dataSource: string;
  config: Record<string, unknown>;
  layout: {
    width: number | string;
    height: number | string;
  };
}
```

### 7.4 知识库模型

```typescript
// MITRE ATT&CK
interface MitreTactic {
  id: string;
  external_id: string;  // TA0001
  name: string;
  description: string;
}

interface MitreTechnique {
  id: string;
  external_id: string;  // T1566
  name: string;
  description: string;
  tactics: string[];
  kill_chain_phases: string[];
  platforms: string[];
}

// SCF控制框架
interface ScfDomain {
  id: string;
  name: string;
  description: string;
  controls: string[];
}

interface ScfControl {
  id: string;
  control_id: string;
  name: string;
  description: string;
  domain: string;
  category: string;
  objectives?: string[];
}
```

---

## 八、安全设计

### 8.1 认证与授权

```typescript
// 指挥官认证
interface CommanderAuth {
  type: 'local' | 'oauth' | 'saml';
  credentials?: {
    password?: string;  // 加密存储
    token?: string;
  };
}

// API密钥管理
interface ApiKey {
  id: string;
  name: string;
  key: string;  // 哈希存储
  scopes: string[];
  createdAt: number;
  expiresAt?: number;
}
```

### 8.2 数据安全

1. **敏感数据加密**: API Key等敏感信息使用AES-256加密
2. **本地存储**: 数据存储在用户本地，不上传云端
3. **通信加密**: WebSocket使用WSS，REST使用HTTPS
4. **审计日志**: 记录所有敏感操作

---

## 九、实施路线图

### Phase 1: 核心基础 (Week 1-2)

- [ ] 项目初始化 (Vite + Lit + TypeScript)
- [ ] i18n国际化系统
- [ ] WebSocket Gateway基础架构
- [ ] 基础布局组件 (Layout, Sidebar, Header)
- [ ] 路由系统

### Phase 2: 技能系统 (Week 3-4)

- [ ] 技能加载器 (SKILL.md解析)
- [ ] 8种角色技能面板
- [ ] AI安全专家页面
- [ ] 角色切换功能

### Phase 3: 知识库集成 (Week 5-6)

- [ ] MITRE ATT&CK数据加载
- [ ] SCF控制框架数据加载
- [ ] 知识库搜索功能
- [ ] 知识库页面

### Phase 4: LLM集成 (Week 7-8)

- [ ] LLM服务商配置
- [ ] 角色LLM绑定
- [ ] AI对话功能
- [ ] 流式响应

### Phase 5: 页面开发 (Week 9-12)

- [ ] 仪表盘页面
- [ ] 威胁情报页面
- [ ] 安全事件页面
- [ ] 漏洞管理页面
- [ ] 合规审计页面
- [ ] 分析报告页面
- [ ] 安全风险页面
- [ ] 作战室页面

### Phase 6: 渠道集成 (Week 13-14)

- [ ] 通讯管理页面
- [ ] 飞书/Telegram/Slack集成
- [ ] 安全告警推送

### Phase 7: 技能市场 (Week 15-16)

- [ ] 技能市场页面
- [ ] 技能安装/激活
- [ ] 技能详情展示

---

## 十、附录

### A. 8种角色完整技能矩阵

| 角色 | Light | Dark | Security | Legal | Technology | Business |
|------|-------|------|----------|-------|------------|----------|
| 安全专家 | 8 | 8 | 8 | 0 | 7 | 0 |
| 隐私安全官 | 8 | 7 | 5 | 8 | 6 | 4 |
| 安全架构师 | 8 | 8 | 6 | 0 | 7 | 4 |
| 业务安全官 | 8 | 8 | 6 | 0 | 0 | 7 |
| 全域指挥官 | 13 | 12 | 12 | 11 | 11 | 11 |
| CISO | 9 | 8 | 8 | 9 | 8 | 6 |
| 安全运营官 | 9 | 8 | 8 | 0 | 8 | 8 |
| 供应链安全官 | 8 | 8 | 6 | 8 | 0 | 7 |

### B. 国际化键值示例

```typescript
// locales/zh-CN.ts
export const zh_CN: TranslationMap = {
  common: {
    loading: '加载中...',
    save: '保存',
    cancel: '取消',
    delete: '删除',
    edit: '编辑',
    search: '搜索',
  },
  
  nav: {
    dashboard: '仪表盘',
    threats: '威胁情报',
    incidents: '安全事件',
    vulnerabilities: '漏洞管理',
    compliance: '合规审计',
    reports: '分析报告',
    risk: '安全风险',
    warRoom: '作战室',
    aiExperts: 'AI安全专家',
    knowledgeBase: '知识库',
    skillsMarket: '技能市场',
    channels: '通讯管理',
    settings: '系统设置',
  },
  
  roles: {
    'security-expert': '安全专家',
    'privacy-officer': '隐私安全官',
    'security-architect': '安全架构师',
    'business-security-officer': '业务安全官',
    'secuclaw-commander': '全域安全指挥官',
    'ciso': '首席信息安全官',
    'security-ops': '安全运营官',
    'supply-chain-security': '供应链安全官',
  },
  
  capabilities: {
    light: '光明面',
    dark: '黑暗面',
    security: '安全技术',
    legal: '法律合规',
    technology: '技术架构',
    business: '业务',
  },
};
```

### C. 启动命令

```bash
# 开发模式
pnpm run dev

# 启动Gateway
pnpm run gateway:start

# 构建前端
pnpm run ui:build

# 运行测试
pnpm run test
```

---

*文档结束*
