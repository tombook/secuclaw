# SecuClaw Web 改造方案

> 文档版本: v1.0  
> 创建日期: 2026-03-08  
> 项目路径: /Users/huangzhou/Documents/work/ai_secuclaw/secuclaw

---

## 一、项目背景

### 1.1 改造目标

通过解决Web太重的现象，为本项目的8种安全角色搭建指挥系统，为skills市场里不同安全场景工具解决安全决策指挥问题。

### 1.2 参考架构

项目采用 **WebSocket 优先** 的架构：

```
┌─────────────────────────────────────────────────────┐
│                   Gateway (21981)                    │
│  ┌─────────────────┐    ┌─────────────────────────┐ │
│  │  WebSocket API  │◄───│  前端 UI (Control UI)   │ │
│  │  (控制平面)      │    │  Vite + Lit 构建        │ │
│  └─────────────────┘    └─────────────────────────┘ │
│  ┌─────────────────┐                                │
│  │  静态文件服务    │  ← 同时提供前端静态文件        │
│  └─────────────────┘                                │
└─────────────────────────────────────────────────────┘
```

---

## 二、现状分析

### 2.1 技术栈确认

| 模块 | 技术栈 | 状态 |
|------|--------|------|
| 前端框架 | Lit (Web Components) | ✅ 已满足 |
| 构建工具 | Vite | ✅ 已满足 |
| 通信协议 | WebSocket (ws://127.0.0.1:21981) | ✅ 已实现 |
| 后端服务 | Node.js (Bun) | ✅ 已实现 |

### 2.2 现有页面清单

| 路由 | 组件 | 说明 |
|------|------|------|
| `/` | sc-dashboard.ts | 仪表盘 |
| `/threats` | sc-threats-page.ts | 威胁情报 |
| `/threats/:id` | sc-threat-detail.ts | 威胁详情 |
| `/incidents` | sc-incidents-page.ts | 安全事件 |
| `/vulnerabilities` | sc-vulnerabilities-page.ts | 漏洞管理 |
| `/compliance` | sc-compliance-page.ts | 合规审计 |
| `/reports` | sc-reports-page.ts | 分析报告 |
| `/risk` | sc-risk-page.ts | 安全风险 |
| `/war-room` | sc-war-room-page.ts | 作战室 |
| `/ai-experts` | sc-ai-experts-page.ts | AI安全专家 |
| `/knowledge-base` | sc-knowledge-base.ts | 知识库 |
| `/skills-market` | sc-skills-market.ts | 技能市场 |
| `/settings` | sc-settings-page.ts | 系统设置 |
| `/settings/llm-config` | sc-llm-service-config.ts | LLM服务配置 |
| `/settings/ai-experts-config` | sc-ai-experts-config.ts | AI专家配置 |

### 2.3 现有Skills清单

| 角色 | 配置文件路径 | 状态 |
|------|--------------|------|
| 安全专家 | skills/security-expert/SKILL.md | ✅ |
| 隐私安全官 | skills/privacy-officer/SKILL.md | ✅ |
| 安全架构师 | skills/security-architect/SKILL.md | ✅ |
| 业务安全官 | skills/business-security-officer/SKILL.md | ✅ |
| 全域安全指挥官 | skills/secuclaw-commander/SKILL.md | ✅ |
| 首席信息安全官 | skills/ciso/SKILL.md | ✅ |
| 安全运营官 | skills/security-ops/SKILL.md | ✅ |
| 供应链安全官 | skills/supply-chain-security/SKILL.md | ✅ |

### 2.4 数据文件清单

**MITRE ATT&CK:**
- `data/mitre/attack-stix-data/enterprise-attack.json`
- `data/mitre/attack-stix-data/mobile-attack.json`
- `data/mitre/attack-stix-data/ics-attack.json`

**SCF知识库:**
- `data/scf/scf-data.json`
- `data/scf/scf-20254.json`
- `data/scf/dimensions-config.json`
- 等20+文件

---

## 三、问题清单

### 3.1 需要修复的问题

| 优先级 | 问题 | 说明 |
|--------|------|------|
| P0 | LLM服务配置保存失效 | 无法新增/修改/删除LLM服务商数据 |
| P0 | 端口显示错误 | 页面显示连接18789，应显示21981 |

### 3.2 需要增强的功能

| 优先级 | 功能 | 说明 |
|--------|------|------|
| P1 | AI安全专家配置 | 8种角色绑定不同LLM厂商/模型 |
| P1 | LLM服务配置 | 添加/修改/删除服务商信息 |
| P1 | 技能市场激活 | 安装/激活状态管理 |
| P1 | AI安全专家页面 | 切换角色展示skills能力 |

---

## 四、改造计划

### Phase 1: 修复核心Bug (P0)

#### 任务 1.1: 修复LLM服务配置保存功能

**涉及文件:**
- 前端: `ui/src/ui/pages/sc-llm-service-config.ts`
- 后端: `packages/core/src/` (API端点)

**工作内容:**
1. 检查后端 `/api/llm/providers` API实现
2. 补全新增(POST)、修改(PUT)、删除(DELETE)逻辑
3. 验证前端表单提交流程
4. 测试数据持久化

**验收标准:**
- [ ] 能新增LLM服务商
- [ ] 能修改服务商信息
- [ ] 能删除服务商
- [ ] 刷新页面数据保持

---

#### 任务 1.2: 修复端口显示

**涉及文件:**
- `ui/src/ui/gateway-client.ts`
- `ui/src/ui/layout/sc-header.ts`

**工作内容:**
1. 确认gateway-client.ts中URL为 `ws://127.0.0.1:21981/ws`
2. 检查header连接状态显示逻辑

---

### Phase 2: 完善系统设置 (P1)

#### 任务 2.1: AI安全专家配置页面

**涉及文件:**
- `ui/src/ui/pages/sc-ai-experts-config.ts`
- `packages/core/src/` (配置存储)

**功能需求:**
1. 8种角色列表展示
2. 角色绑定LLM服务商选择
3. 角色使用模型配置
4. 支持多角色共用一个模型
5. 支持按角色使用不同模型

**数据模型:**
```typescript
interface RoleLLMConfig {
  roleId: string;           // 角色ID
  roleName: string;        // 角色名称
  providerId: string;      // LLM服务商ID
  modelName: string;       // 模型名称
  enabled: boolean;        // 是否启用
}
```

---

#### 任务 2.2: LLM服务配置功能完善

**涉及文件:**
- `ui/src/ui/pages/sc-llm-service-config.ts`

**功能需求:**
1. LLM服务商CRUD
2. 字段: 服务商名称、base_url、api-key、模型名称
3. 模型列表管理(逗号分隔)
4. API Key显示/隐藏切换
5. 启用/禁用开关

**数据模型:**
```typescript
interface LLMProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  models: string;        // 逗号分隔
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}
```

---

### Phase 3: 技能市场增强 (P1)

#### 任务 3.1: 技能市场安装/激活功能

**涉及文件:**
- `ui/src/ui/pages/sc-skills-market.ts`
- `packages/core/src/skills/market-service.ts`
- `packages/core/src/skills/loader.ts`

**功能需求:**
1. 技能列表展示(仪表盘、威胁情报、安全事件、漏洞管理、分析报告、合规审计、安全风险、作战室)
2. 技能安装状态
3. 技能激活/停用
4. 左侧导航根据激活状态显示技能名称
5. 技能详情页展示

**数据模型:**
```typescript
interface Skill {
  id: string;
  name: string;
  description: string;
  category: 'dashboard' | 'threat-intel' | 'incidents' | 'vulnerabilities' | 'reports' | 'compliance' | 'risk' | 'war-room';
  installed: boolean;
  activated: boolean;
  hasUI: boolean;        // 是否有可视化界面
  version: string;
}
```

---

### Phase 4: AI安全专家页面增强 (P1)

#### 任务 4.1: AI安全专家页面设计 - 角色Skills能力展示

**需求编号**: 12

**需求描述**:
‘AI安全专家’页面设计，里面显示的8个安全角色，输入‘你的角色是什么’，通过角色配置管理，必须体现出每种角色具备‘ai_secuclaw/secuclaw/skills’下角色技能的能力，不是简单回答接入LLM模型的能力。

**详细功能需求**:

1. **页面布局**
   - 顶部: 连接状态显示 (ws://127.0.0.1:21981)
   - 左侧: 8种安全角色列表卡片
   - 右侧: 角色对话区域 + Skills能力展示区

2. **8种安全角色卡片**
   | 角色ID | 角色名称 | Skills配置文件 |
   |--------|----------|----------------|
   | security-expert | 安全专家 | skills/security-expert/SKILL.md |
   | privacy-officer | 隐私安全官 | skills/privacy-officer/SKILL.md |
   | security-architect | 安全架构师 | skills/security-architect/SKILL.md |
   | business-security-officer | 业务安全官 | skills/business-security-officer/SKILL.md |
   | secuclaw-commander | 全域安全指挥官 | skills/secuclaw-commander/SKILL.md |
   | ciso | 首席信息安全官 | skills/ciso/SKILL.md |
   | security-ops | 安全运营官 | skills/security-ops/SKILL.md |
   | supply-chain-security | 供应链安全官 | skills/supply-chain-security/SKILL.md |

3. **角色对话交互**
   - 用户输入: "你的角色是什么" 或类似问题
   - 系统响应: 根据当前选中角色，展示该角色的Skills能力
   - **不是简单回答**: "我是安全专家，使用XXX模型"
   - **而是展示**: 该角色在skills/目录下定义的完整技能列表

4. **Skills能力展示**
   - 动态读取对应角色的SKILL.md文件
   - 解析YAML Front Matter中的能力定义
   - 展示内容应包括:
     - 角色描述 (description)
     - 覆盖的MITRE ATT&CK战术 (mitre.tactics)
     - 覆盖的SCF控制项 (scf.controls)
     - 具备的工具能力 (tools)
     - 可视化组件 (visualizations)
     - 触发关键词 (triggers)

5. **Skills能力示例输出**
   ```
   【安全专家角色】
   
   我的角色是安全专家，具备以下能力：
   
   📋 角色描述:
   - 负责企业安全风险评估和威胁分析
   - 具备红队攻防能力
   
   🎯 MITRE ATT&CK 覆盖:
   - 初始访问 (Initial Access)
   - 执行 (Execution)
   - 持久化 (Persistence)
   - 权限提升 (Privilege Escalation)
   
   🛡️ SCF 控制项覆盖:
   - PR.AC: 身份识别与访问管理
   - PR.DS: 数据安全
   - DE.AE: 分析与监控
   
   🔧 具备技能:
   - 漏洞扫描与分析
   - 渗透测试
   - 恶意软件分析
   - 日志审计
   - 威胁情报分析
   
   📊 可视化能力:
   - 攻击时间线
   - MITRE热力图
   - IOC关系图
   - 风险雷达图
   ```

6. **后端API需求**
   - 新增API: `GET /api/skills/:roleId` - 获取角色Skills配置
   - 新增API: `POST /api/chat` - 支持角色上下文的对话
   - Skills配置加载: 从 `skills/{roleId}/SKILL.md` 读取

**涉及文件:**
- 前端: `ui/src/ui/pages/sc-ai-experts-page.ts`
- 后端: `packages/core/src/skills/`
- Skills配置: `skills/*/SKILL.md`

**数据流:**
```
用户输入 "你的角色是什么"
    ↓
前端发送请求到后端 (包含当前角色ID)
    ↓
后端读取 skills/{roleId}/SKILL.md
    ↓
解析YAML Front Matter
    ↓
返回角色Skills能力详情
    ↓
前端渲染展示
```

**验收标准:**
- [ ] 页面显示8种安全角色卡片
- [ ] 点击角色可切换当前对话角色
- [ ] 输入"你的角色是什么"返回完整Skills能力
- [ ] Skills能力来源为skills/目录下的配置文件
- [ ] 不是简单回答"使用XXX模型"，而是展示具体技能
BQ|

**详细需求: 角色Skills能力详情展示**

在'AI安全专家'页面中，每种角色的详情页应体现角色具备'skills'能力，统计与显示skills的分类、数量、名称。

##### 1. Skills分类展示

每个角色的Skills按以下6个维度分类展示：

| 分类 | 说明 | 示例来源 |
|------|------|----------|
| **light (光明面)** | 防御性、建设性安全能力 | 业务连续性管理、风险评估等 |
| **dark (黑暗面)** | 攻击性、渗透测试能力 | 漏洞挖掘、攻击模拟等 |
| **security (安全技术)** | 传统安全技术能力 | 漏洞管理、事件响应等 |
| **legal (法律合规)** | 法律合规相关能力 | 合规审计、隐私保护等 |
| **technology (技术架构)** | 技术架构相关能力 | 安全架构设计、云安全等 |
| **business (业务)** | 业务相关能力 | 供应链管理、风险管理等 |

##### 2. 数据来源

从 `skills/{roleId}/SKILL.md` 文件的 YAML Front Matter 中解析：

```yaml
metadata:
  openclaw:
    capabilities:
      light: ["业务连续性管理", "风险量化评估", ...]
      dark: ["业务逻辑漏洞挖掘", ...]
      security: ["风险评估", "威胁建模", ...]
      legal: []
      technology: []
      business: ["供应链管理", ...]
    mitre_coverage: ["TA0001-Initial Access", ...]
    scf_coverage: ["AT-Awareness and Training", ...]
```

##### 3. 页面展示要求

每个角色详情页应展示：

1. **Skills分类统计**
   - 每个分类显示技能数量 (如: 8项)
   - 展开后显示完整技能名称列表

2. **MITRE ATT&CK 覆盖**
   - 显示覆盖的战术ID和名称
   - 格式: "TA0001-Initial Access"

3. **SCF 控制项覆盖**
   - 显示覆盖的控制项类别
   - 格式: "AT-Awareness and Training"

##### 4. UI展示示例

```
【业务安全官角色详情】

📊 Skills 分类统计
┌─────────────────────────────────────────────────┐
│ 分类          │ 数量 │ 技能列表                     │
├─────────────────────────────────────────────────┤
│ 🔵 light     │  8   │ 业务连续性管理、风险量化...  │
│ ⚫ dark      │  8   │ 业务逻辑漏洞挖掘、业务...    │
│ 🛡️ security │  6   │ 风险评估、威胁建模、漏洞...  │
│ ⚖️ legal    │  0   │ -                           │
│ 💻 technology│  0   │ -                           │
│ 📈 business  │  7   │ 供应链管理、风险管理、...   │
└─────────────────────────────────────────────────┘

🎯 MITRE ATT&CK 覆盖 (8/14 战术)
┌─────────────────────────────────────────────────┐
│ TA0001-Initial Access       ✓                   │
│ TA0003-Persistence         ✓                   │
│ TA0004-Privilege Escalation✓                   │
│ TA0008-Lateral Movement    ✓                   │
│ TA0009-Collection          ✓                   │
│ TA0010-Exfiltration        ✓                   │
│ TA0011-Command and Control ✓                   │
│ TA0040-Impact              ✓                   │
└─────────────────────────────────────────────────┘

🛡️ SCF 控制项覆盖 (8/20 类别)
┌─────────────────────────────────────────────────┐
│ AT-Awareness and Training     ✓               │
│ AU-Audit and Accountability   ✓               │
│ BC-Business Continuity        ✓               │
│ CP-Contingency Planning      ✓               │
│ IR-Incident Response         ✓               │
│ RA-Risk Assessment           ✓               │
│ RSK-Risk Management          ✓               │
│ TPM-Third Party Management   ✓               │
└─────────────────────────────────────────────────┘
```

##### 5. 8种角色对应Skills配置文件

| 角色ID | 角色名称 | 配置文件 | capabilities结构 |
|--------|----------|----------|------------------|
| security-expert | 安全专家 | skills/security-expert/SKILL.md | light/dark/security/legal/technology/business |
| privacy-officer | 隐私安全官 | skills/privacy-officer/SKILL.md | light/dark/security/legal/technology/business |
| security-architect | 安全架构师 | skills/security-architect/SKILL.md | light/dark/security/legal/technology/business |
| business-security-officer | 业务安全官 | skills/business-security-officer/SKILL.md | light/dark/security/legal/technology/business |
| secuclaw-commander | 全域安全指挥官 | skills/secuclaw-commander/SKILL.md | light/dark/security/legal/technology/business |
| ciso | 首席信息安全官 | skills/ciso/SKILL.md | light/dark/security/legal/technology/business |
| security-ops | 安全运营官 | skills/security-ops/SKILL.md | light/dark/security/legal/technology/business |
| supply-chain-security | 供应链安全官 | skills/supply-chain-security/SKILL.md | light/dark/security/legal/technology/business |

##### 6. 后端API需求

```typescript
// GET /api/skills/:roleId
// 返回角色Skills配置
interface RoleSkillsResponse {
  roleId: string;
  roleName: string;
  description: string;
  capabilities: {
    light: string[];
    dark: string[];
    security: string[];
    legal: string[];
    technology: string[];
    business: string[];
  };
  mitre_coverage: string[];
  scf_coverage: string[];
  // 统计信息
  stats: {
    total_skills: number;
    light_count: number;
    dark_count: number;
    security_count: number;
    legal_count: number;
    technology_count: number;
    business_count: number;
    mitre_count: number;
    scf_count: number;
  };
}
```

##### 7. 验收标准

- [ ] 每个角色详情页显示6个分类的Skills
- [ ] 每个分类显示技能数量
- [ ] 每个分类展开显示完整技能名称列表
- [ ] 显示MITRE ATT&CK覆盖的战术列表
- [ ] 显示SCF控制项覆盖列表
- [ ] 数据来源于skills/{roleId}/SKILL.md
- [ ] 页面布局清晰，分类颜色区分
ZN|

---

### Phase 5: 知识库真实数据加载 (P1)

#### 任务 5.1: 知识库页面加载真实数据

**需求描述**:
'知识库'页面应该加载真实的知识数据，包括MITRE ATT&CK和SCF知识库的完整内容。

**现状分析**:

前端调用API:
- `POST /api/knowledge-base/load` - 加载知识库
- `POST /api/knowledge-base/search` - 搜索知识库

后端已有API:
- `POST /api/knowledge/mitre/search` - MITRE搜索
- `GET /api/knowledge/mitre/tactics` - MITRE战术列表
- `GET /api/knowledge/mitre/techniques` - MITRE技术列表
- `GET /api/knowledge/mitre/stats` - MITRE统计
- `POST /api/knowledge/scf/search` - SCF搜索
- `GET /api/knowledge/scf/stats` - SCF统计
- `GET /api/knowledge/scf/domains` - SCF域列表
- `GET /api/knowledge/scf/controls` - SCF控制项列表
- `GET /api/knowledge/scf/domain` - SCF域详情

**问题**: 前端API与后端API不匹配，需要修复连接。

**功能需求**:

1. **MITRE ATT&CK 知识库**
   - 加载企业(Enterprise)攻击技术数据
   - 加载ICS攻击技术数据
   - 加载移动(Mobile)攻击技术数据
   - 显示战术( Tactics)和技术(Techniques)列表
   - 支持按战术/技术搜索

2. **SCF 安全能力框架**
   - 加载SCF控制项数据
   - 显示域(Domains)和控制项(Controls)列表
   - 支持按关键词搜索
   - 显示统计信息(控制项数量、覆盖领域等)

3. **数据展示**
   - 知识库卡片显示加载状态
   - 显示记录数量
   - 支持搜索和筛选

**涉及文件:**
- 前端: `ui/src/ui/pages/sc-knowledge-base.ts`
- 后端: `packages/core/src/main.ts` (现有API)
- 数据: `data/mitre/attack-stix-data/*.json`
- 数据: `data/scf/*.json`

**数据文件详情:**

| 知识库 | 文件路径 | 记录类型 |
|--------|----------|----------|
| MITRE Enterprise | data/mitre/attack-stix-data/enterprise-attack.json | attack-patterns, mitre-techniques |
| MITRE ICS | data/mitre/attack-stix-data/ics-attack.json | attack-patterns, mitre-techniques |
| MITRE Mobile | data/mitre/attack-stix-data/mobile-attack.json | attack-patterns, mitre-techniques |
| SCF | data/scf/scf-data.json | domains, controls |
| SCF | data/scf/scf-20254.json | 完整控制项 |

**后端API响应格式 (现有):**

```typescript
// GET /api/knowledge/mitre/stats
interface MitreStats {
  total_techniques: number;
  total_tactics: number;
  enterprise_count: number;
  ics_count: number;
  mobile_count: number;
}

// GET /api/knowledge/scf/stats
interface ScfStats {
  total_domains: number;
  total_controls: number;
  categories: string[];
}

// POST /api/knowledge/mitre/search
interface MitreSearchRequest {
  query: string;
  type?: 'technique' | 'tactic' | 'all';
}
interface MitreSearchResult {
  id: string;
  name: string;
  description: string;
  type: 'technique' | 'tactic';
  external_id: string;
}

// POST /api/knowledge/scf/search
interface ScfSearchRequest {
  query: string;
}
interface ScfSearchResult {
  id: string;
  control_id: string;
  name: string;
  description: string;
  domain: string;
  category: string;
}
```

**修复方案:**

1. 修改前端API调用，与后端现有API对齐
2. 添加缺失的API端点(如果需要)
3. 实现真实数据加载和展示

**验收标准:**
- [ ] MITRE ATT&CK知识库可正常加载
- [ ] SCF知识库可正常加载
- [ ] 搜索功能返回真实数据
- [ ] 统计信息显示正确
- [ ] 页面显示记录数量

---

ZN|
---

SH|---
---

#### 任务 4.2: (预留)

#### 任务 4.1: 角色Skills能力展示

**涉及文件:**
- `ui/src/ui/pages/sc-ai-experts-page.ts`
- `skills/*/SKILL.md` (读取角色配置)

**功能需求:**
1. 8种安全角色卡片展示
2. 切换角色时展示该角色具备的skills能力
3. 根据skills目录动态加载角色能力描述
4. 体现每种角色具备ai_secuclaw/secuclaw/skills下角色技能的能力

**角色Skills映射:**
| 角色 | Skills能力来源 |
|------|---------------|
| 安全专家 | skills/security-expert/SKILL.md |
| 隐私安全官 | skills/privacy-officer/SKILL.md |
| 安全架构师 | skills/security-architect/SKILL.md |
| 业务安全官 | skills/business-security-officer/SKILL.md |
| 全域安全指挥官 | skills/secuclaw-commander/SKILL.md |
| 首席信息安全官 | skills/ciso/SKILL.md |
| 安全运营官 | skills/security-ops/SKILL.md |
VZ|| 供应链安全官 | skills/supply-chain-security/SKILL.md |
XB|

**详细需求说明 (需求12):**
- 页面显示8种安全角色卡片
- 用户输入'你的角色是什么'时，展示该角色在skills/目录下的完整Skills能力
- 不是简单回答接入LLM模型的能力，而是体现每种角色的专业技能

---

TQ|---

---

## 五、关键文件路径

### 前端核心文件
```
secuclaw/ui/src/
├── main.ts
└── ui/
    ├── app.ts                    # 根组件
    ├── router.ts                 # 路由配置
    ├── gateway-client.ts         # WebSocket客户端
    ├── layout/
    │   ├── sc-sidebar.ts         # 侧边栏
    │   ├── sc-header.ts          # 顶部栏
    │   └── sc-layout.ts          # 布局
    ├── pages/
    │   ├── sc-dashboard.ts
    │   ├── sc-threats-page.ts
    │   ├── sc-threat-detail.ts
    │   ├── sc-incidents-page.ts
    │   ├── sc-vulnerabilities-page.ts
    │   ├── sc-compliance-page.ts
    │   ├── sc-reports-page.ts
    │   ├── sc-risk-page.ts
    │   ├── sc-war-room-page.ts
    │   ├── sc-ai-experts-page.ts       # AI安全专家
    │   ├── sc-ai-experts-config.ts     # AI专家配置
    │   ├── sc-llm-service-config.ts    # LLM服务配置
    │   ├── sc-skills-market.ts         # 技能市场
    │   ├── sc-knowledge-base.ts        # 知识库
    │   └── sc-settings-page.ts         # 系统设置
    └── store/
        └── data-store.ts               # 状态管理
```

### 后端核心文件
```
secuclaw/packages/core/src/
├── main.ts                          # 后端入口
├── gateway/
│   ├── server.ts                    # WebSocket服务
│   ├── index.ts                     # 导出
│   └── wrapper.ts                   # 包装器
├── skills/
│   ├── index.ts                     # 技能入口
│   ├── loader.ts                    # 加载器
│   ├── manager.ts                   # 管理器
│   └── market-service.ts            # 技能市场
└── knowledge/
    └── mitre/
        └── loader.ts                # MITRE加载器
```

### Skills配置文件
```
secuclaw/skills/
├── security-expert/SKILL.md
├── privacy-officer/SKILL.md
├── security-architect/SKILL.md
├── business-security-officer/SKILL.md
├── secuclaw-commander/SKILL.md
├── ciso/SKILL.md
├── security-ops/SKILL.md
└── supply-chain-security/SKILL.md
```

---

## 六、执行顺序

```
[Phase 1 - 核心Bug修复]
├── 1.1 修复LLM服务配置保存功能
└── 1.2 修复端口显示

[Phase 2 - 系统设置完善]
├── 2.1 完善AI安全专家配置
└── 2.2 完善LLM服务配置

[Phase 3 - 技能市场增强]
└── 3.1 技能安装/激活功能

[Phase 4 - AI安全专家增强]
└── 4.1 角色Skills能力展示
```

---

## 七、验收标准

### 功能验收

- [ ] LLM服务配置可正常保存
- [ ] 端口显示正确(21981)
- [ ] AI安全专家可绑定LLM配置
- [ ] 技能市场可安装/激活
- [ ] 切换角色展示Skills能力

### 技术验收

- [ ] WebSocket通信正常
- [ ] 前端构建无错误
- [ ] 后端API响应正常
- [ ] 数据持久化正常

---

## 八、附录

### A. WebSocket协议

```typescript
// 连接地址
ws://127.0.0.1:21981/ws

// 消息格式
// 请求: { type: 'req', seq: number, method: string, params?: object }
// 响应: { type: 'res', seq: number, result?: object, error?: object }
// 事件: { type: 'event', event: string, data?: object }
```

### B. 启动命令

```bash
# 启动后端Gateway
pnpm run start
# 或
secuclaw gateway start --port 21981

# 启动前端开发
pnpm run ui:dev

# 构建前端
pnpm run ui:build
NQ|

---

### Phase 6: 页面与安全角色Skills结合 (P1)

#### 任务 6.1: 页面设计结合安全角色Skills能力

**需求描述**:
仪表盘、威胁情报、安全事件、漏洞管理、合规审计、分析报告、安全风险、作战室页面中的安全功能应该结合8种安全角色的skills能力设计。本项目以8种安全角色的安全skills创建，页面功能应体现对应角色的能力。

**8种安全角色与页面映射关系**:

| 页面 | 主要角色 | 次要角色 | 角色Skills能力 |
|------|----------|----------|----------------|
| 仪表盘 | CISO | 安全专家 | 风险仪表盘、预算分配、合规状态 |
| 威胁情报 | 安全专家 | 威胁猎手 | 漏洞扫描、威胁检测、攻击面分析 |
| 安全事件 | 安全运营官 | CISO | 事件响应、SOC运营、威胁监控 |
| 漏洞管理 | 安全专家 | 安全运营官 | 漏洞管理、补丁管理、风险评估 |
| 合规审计 | CISO | 隐私安全官 | 合规治理、审计管理、法规对接 |
| 分析报告 | CISO | 业务安全官 | 安全绩效、风险分析、投资回报 |
| 安全风险 | CISO | 业务安全官 | 风险评估、量化分析、业务影响 |
| 作战室 | 全域安全指挥官 | 安全运营官 | 指挥调度、协同响应、多方协调 |

**详细页面设计**:

##### 1. 仪表盘页面

**结合角色**: CISO (首席信息安全官)

**角色Skills能力映射**:
- light: 安全战略规划、合规治理、风险管理、安全预算管理
- security: 威胁管理、漏洞管理、数据保护、事件响应
- technology: 基础设施安全、应用安全、云安全、安全运营
- business: 战略规划、预算管理、跨部门协调、董事会汇报
- visualizations: 企业风险仪表盘、合规状态追踪、安全预算分配

**页面功能**:
- 整体安全风险评分 (风险仪表盘)
- 各法规合规状态 (合规状态追踪)
- 安全投资分布 (预算分配饼图)
- 安全事件趋势 (事件趋势折线图)
- 安全成熟度评估

##### 2. 威胁情报页面

**结合角色**: 安全专家 (Security Expert)

**角色Skills能力映射**:
- light: 漏洞扫描、补丁管理、安全监控、威胁检测
- dark: 渗透测试、红队演练、漏洞利用、社会工程
- security: 风险评估、威胁建模、渗透测试、代码审计
- technology: 网络防御、主机安全、应用安全、云安全
- visualizations: 漏洞分布概览、攻击面分析、风险评分仪表盘

**页面功能**:
- 漏洞分布统计 (按严重程度)
- 攻击面分析图
- 威胁情报列表
- IOC ( Indicators of Compromise) 详情
- MITRE ATT&CK 映射

##### 3. 安全事件页面

**结合角色**: 安全运营官 (Security Operations)

**角色Skills能力映射**:
- light: 威胁监控、事件响应、SOC运营、日志分析
- dark: 渗透测试、红队演练、攻击路径发现
- security: 威胁检测、事件响应、取证分析、应急响应
- technology: SOC运营、SIEM运维、EDR管理、网络监控
- visualizations: 安全事件时间线、事件趋势图

**页面功能**:
- 实时安全事件列表
- 事件时间线视图
- 事件详情与响应
- 事件分类统计
- 事件响应工作流

##### 4. 漏洞管理页面

**结合角色**: 安全专家 + 安全运营官

**角色Skills能力映射**:
- light: 漏洞扫描、补丁管理、访问控制
- dark: 漏洞利用、权限提升
- security: 漏洞管理、风险评估、渗透测试
- technology: 主机安全、应用安全、云安全
- visualizations: 扫描结果详情表、漏洞趋势图

**页面功能**:
- 漏洞列表 (支持筛选、排序)
- 漏洞详情 (CVE信息、CVSS评分)
- 修复建议
- 漏洞趋势统计
- 补丁管理状态

##### 5. 合规审计页面

**结合角色**: CISO + 隐私安全官

**角色Skills能力映射**:
- light: 合规治理、监管对接、安全政策制定
- dark: 合规漏洞挖掘、监管渗透测试
- security: 合规检查、安全审计
- legal: GDPR合规、CCPA合规、PIPL合规、网络安全法
- visualizations: 合规状态追踪、合规分数图表

**页面功能**:
- 合规框架选择 (GDPR, SOC2, ISO27001, SCF等)
- 合规状态概览
- 控制项检查状态
- 审计历史记录
- 合规差距分析

##### 6. 分析报告页面

**结合角色**: CISO + 业务安全官

**角色Skills能力映射**:
- light: 安全绩效评估、风险量化评估、安全投资回报分析
- security: 风险评估、威胁建模
- business: 战略规划、投资决策、财务影响分析
- visualizations: 风险仪表盘、趋势分析图表

**页面功能**:
- 报告模板选择
- 自定义报告生成
- 导出功能 (PDF, Excel)
- 周期性报告计划
- 报告历史存档

##### 7. 安全风险页面

**结合角色**: CISO + 业务安全官

**角色Skills能力映射**:
- light: 风险量化评估、安全KPI制定
- dark: 业务流程攻击模拟、经济影响分析
- security: 风险评估、威胁建模
- business: 风险管理、财务影响分析、业务影响分析
- visualizations: 风险雷达图、风险热力图

**页面功能**:
- 风险矩阵视图
- 风险趋势跟踪
- 风险评估工具
- 风险处置建议
- 风险关联分析

##### 8. 作战室页面

**结合角色**: 全域安全指挥官 (SecuClaw Commander)

**角色Skills能力映射**:
- light: 指挥调度、协同响应、资源协调
- dark: 多维度攻击模拟、复合攻击路径
- security: 事件响应、威胁管理、应急指挥
- technology: 安全运营、威胁情报、协同平台
- business: 跨部门协调、多方沟通、资源调度
- visualizations: 作战态势图、事件响应时间线、资源分布图

**页面功能**:
- 实时安全态势
- 事件响应协同
- 资源调度指挥
- 多方通信集成
- 决策支持面板

**角色切换功能**:

每个页面应支持角色切换，根据选中角色显示不同的Skills能力面板：

```
┌────────────────────────────────────────────────────────┐
│ 页面工具栏                                            │
│ [当前角色: CISO ▼] [切换角色]                          │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ 角色Skills面板                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 🔵 Light (光明面):                                 │ │
│ │    - 安全战略规划  - 合规治理  - 风险管理           │ │
│ │                                                    │ │
│ │ ⚫ Dark (黑暗面):                                   │ │
│ │    - 合规漏洞挖掘  - 监管渗透测试  - 架构弱点评估   │ │
│ │                                                    │ │
│ │ 🛡️ Security:                                        │ │
│ │    - 威胁管理  - 漏洞管理  - 事件响应               │ │
│ │                                                    │ │
│ │ 📊 MITRE覆盖: 11/14 战术                           │ │
│ │ 🛡️ SCF覆盖: 17/20 控制项                          │ │
│ └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

**后端API需求**:

```typescript
// 获取页面绑定的角色Skills
// GET /api/pages/:pageId/role-skills
interface PageRoleSkillsResponse {
  pageId: string;
  primaryRole: string;
  secondaryRoles: string[];
  roleSkills: {
    roleId: string;
    roleName: string;
    capabilities: {
      light: string[];
      dark: string[];
      security: string[];
      legal: string[];
      technology: string[];
      business: string[];
    };
    mitre_coverage: string[];
    scf_coverage: string[];
  }[];
}

// 切换页面角色
// POST /api/pages/:pageId/switch-role
interface SwitchRoleRequest {
  roleId: string;
}
```

**涉及文件:**
- 前端页面: `ui/src/ui/pages/sc-*.ts`
- 后端API: `packages/core/src/`
- Skills配置: `skills/*/SKILL.md`

**验收标准:**
- [ ] 8个页面都显示对应的角色Skills面板
- [ ] 支持角色切换功能
- [ ] Skills面板显示6个分类的能力
- [ ] 显示MITRE ATT&CK和SCF覆盖情况
JR|

---

### Phase 7: 新增Skills专题页面 (P1)

#### 任务 7.1: 基于安全角色Skills能力新增专题页面

**需求描述**:
根据8种安全角色的skills能力，可以设计更多专门的skills页面。不仅是已有的8个页面，还可以根据黑暗面(Attack)/光明面(Defense)能力创建更多专题页面，展示不同安全角色的专业能力。

**黑暗面(Attack) Skills专题**:

根据各角色dark capabilities，可以创建以下专题页面：

##### 1. 渗透测试中心 (Penetration Testing Hub)

**来源角色**: 安全专家 (security-expert)

**黑暗面Skills**:
- 渗透测试
- 红队演练
- 漏洞利用
- 权限提升
- 横向移动
- 数据窃取
- 社会工程
- 无线攻击

**页面功能**:
- 渗透测试项目管理
- 测试范围配置
- 漏洞发现记录
- 攻击路径可视化
- 测试报告生成

##### 2. 红队演练中心 (Red Team Operations)

**来源角色**: 安全专家、安全运营官

**黑暗面Skills**:
- 红队演练
- 攻击路径发现
- 漏洞利用验证
- 内网横向移动
- 权限提升
- 数据窃取模拟
- 社工攻击模拟

**页面功能**:
- 红队演练计划
- 攻击场景库
- 演练进度跟踪
- 防御能力评估
- 演练报告

##### 3. 威胁狩猎中心 (Threat Hunting)

**来源角色**: 安全运营官、威胁猎手

**黑暗面Skills**:
- 攻击路径发现
- 漏洞利用验证
- 内网横向移动

**页面功能**:
- 狩猎假设管理
- IOC搜索
- 异常行为检测
- 威胁线索追踪
- 狩猎报告

##### 4. 漏洞研究实验室 (Vulnerability Research)

**来源角色**: 安全专家

**黑暗面Skills**:
- 漏洞利用
- 权限提升
- 漏洞利用开发

**页面功能**:
- CVE管理
- PoC开发记录
- 漏洞分析报告
- 漏洞库搜索

##### 5. 社会工程测试中心 (Social Engineering)

**来源角色**: 安全专家、安全运营官

**黑暗面Skills**:
- 社会工程
- 社工攻击模拟

**页面功能**:
- 钓鱼邮件模板
- 钓鱼演练管理
- 员工意识评估
- 社工报告

**光明面(Defense) Skills专题**:

##### 6. 安全运营中心 (SOC Dashboard)

**来源角色**: 安全运营官

**光明面Skills**:
- 威胁监控
- 事件响应
- SOC运营
- 日志分析
- 威胁狩猎
- 安全自动化

**页面功能**:
- 实时威胁监控
- 告警管理
- 事件响应工作流
- SOC KPI展示

##### 7. 合规管理中心 (Compliance Hub)

**来源角色**: CISO、隐私安全官

**光明面Skills**:
- 合规治理
- 监管对接
- 合规审计
- 隐私影响评估

**页面功能**:
- 多框架合规状态 (GDPR, SOC2, ISO27001, SCF)
- 控制项管理
- 审计计划
- 合规报告

##### 8. 风险管理平台 (Risk Management)

**来源角色**: CISO、业务安全官

**光明面Skills**:
- 风险量化评估
- 安全投资回报分析
- 业务影响分析
- 安全KPI制定

**页面功能**:
- 风险矩阵
- 风险评估工具
- 风险趋势分析
- ROI计算器

**新增页面清单**:

| 页面ID | 页面名称 | 来源角色 | Skills分类 | 优先级 |
|--------|----------|----------|------------|--------|
| sc-pentest-hub | 渗透测试中心 | 安全专家 | dark | P1 |
| sc-red-team | 红队演练中心 | 安全专家/安全运营官 | dark | P1 |
| sc-threat-hunting | 威胁狩猎中心 | 安全运营官 | dark | P1 |
| sc-vuln-research | 漏洞研究实验室 | 安全专家 | dark | P2 |
| sc-social-eng | 社会工程测试中心 | 安全专家/安全运营官 | dark | P2 |
| sc-soc-dashboard | 安全运营中心 | 安全运营官 | light | P1 |
| sc-compliance-hub | 合规管理中心 | CISO/隐私安全官 | light | P1 |
| sc-risk-platform | 风险管理平台 | CISO/业务安全官 | light | P1 |

**页面设计规范**:

每个新增页面应包含：

1. **页面头部**
   - 页面标题
   - 角色标识 (显示该页面对应的安全角色)
   - 角色切换按钮

2. **Skills能力面板**
   - 显示页面所代表的Skills分类
   - 展示该技能的专业能力列表
   - MITRE ATT&CK覆盖展示
   - SCF控制项覆盖展示

3. **功能区域**
   - 符合该Skills特性的功能模块
   - 数据可视化组件
   - 操作面板

**页面结构示例**:

```
┌─────────────────────────────────────────────────────────────┐
│ 渗透测试中心                                      [CISO ▼]  │
│ 角色: 安全专家 | MITRE覆盖: 11战术 | SCF覆盖: 17项        │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 🔵 Light Skills      │ ⚫ Dark Skills                   ││
│ │ ─────────────────────│ ────────────────────             ││
│ │ • 漏洞扫描           │ • 渗透测试                       ││
│ │ • 安全监控           │ • 红队演练                       ││
│ │ • 事件响应           │ • 漏洞利用                       ││
│ │ • 威胁检测           │ • 权限提升                       ││
│ └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    功能区域                                  │
│                                                             │
│  [新建项目]  [进行中: 3]  [已完成: 12]                     │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│  │ 项目A    │ │ 项目B    │ │ 项目C    │                   │
│  │ 进度: 80%│ │ 进度: 45%│ │ 进度: 20%│                   │
│  │ 漏洞: 5  │ │ 漏洞: 12 │ │ 漏洞: 3  │                   │
│  └──────────┘ └──────────┘ └──────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**涉及文件:**
- 新增页面: `ui/src/ui/pages/sc-pentest-hub.ts`
- 新增页面: `ui/src/ui/pages/sc-red-team.ts`
- 新增页面: `ui/src/ui/pages/sc-threat-hunting.ts`
- 新增页面: `ui/src/ui/pages/sc-vuln-research.ts`
- 新增页面: `ui/src/ui/pages/sc-social-eng.ts`
- 新增页面: `ui/src/ui/pages/sc-soc-dashboard.ts`
- 新增页面: `ui/src/ui/pages/sc-compliance-hub.ts`
- 新增页面: `ui/src/ui/pages/sc-risk-platform.ts`
- 路由配置: `ui/src/ui/router.ts`

**验收标准:**
- [ ] 新增至少4个Skills专题页面
- [ ] 每个页面显示对应的角色Skills面板
- [ ] 黑暗面Skills页面突出攻击能力展示
- [ ] 光明面Skills页面突出防御能力展示
SV|

---

### Phase 8: 多国语言支持 (i18n) (P1)

#### 任务 8.1: 参考openclaw项目实现多国语言支持

**需求描述**:
参考 openclaw-2026.3.2/ui/src/i18n 实现多国语言支持，支持中英文等多种语言切换。

**参考实现**:
项目路径: `/Users/huangzhou/Documents/work/ai_secuclaw/openclaw-2026.3.2/ui/src/i18n/`

**OpenClaw i18n架构**:

```
ui/src/i18n/
├── index.ts              # 导出入口
├── lib/
│   ├── translate.ts      # 翻译管理器 (I18nManager类)
│   ├── types.ts         # 类型定义 (Locale, TranslationMap)
│   ├── registry.ts       # 语言注册
│   └── lit-controller.ts # Lit组件集成控制器
└── locales/
    ├── en.ts            # 英语
    ├── zh-CN.ts         # 简体中文
    ├── zh-TW.ts         # 繁体中文
    ├── pt-BR.ts         # 葡萄牙语
    └── de.ts            # 德语
```

**支持的语言**:

| Locale | 语言 | 状态 |
|--------|------|------|
| en | 英语 (English) | ✅ 默认 |
| zh-CN | 简体中文 | ✅ |
| zh-TW | 繁体中文 | ✅ |
| pt-BR | 葡萄牙语(巴西) | ✅ |
| de | 德语 | ✅ |

**核心功能**:

1. **I18nManager 类**
   - 管理当前语言环境
   - 动态加载语言包
   - 翻译函数 `t(key, params?)`
   - 语言切换持久化 (localStorage)
   - 订阅机制 (语言切换时通知)

2. **Lit组件集成 (I18nController)**
   - 实现 ReactiveController 接口
   - 语言切换时自动触发组件更新
   - 简化Lit组件中的多语言使用

3. **语言包结构**
   ```typescript
   // locales/zh-CN.ts
   export const zh_CN: TranslationMap = {
     common: {
       version: "版本",
       health: "健康状况",
       ok: "正常",
     },
     nav: {
       chat: "聊天",
       control: "控制",
       settings: "设置",
     },
     // 更多模块...
   };
   ```

**SecuClaw需要支持的语言**:

| Locale | 语言 | 优先级 |
|--------|------|--------|
| zh-CN | 简体中文 | P0 (默认) |
| en | 英语 | P0 |
| zh-TW | 繁体中文 | P1 |

**需要翻译的模块**:

1. **导航菜单**
   - 仪表盘、威胁情报、安全事件、漏洞管理
   - 合规审计、分析报告、安全风险、作战室
   - AI安全专家、知识库、技能市场、系统设置

2. **页面标题和描述**

3. **按钮和操作**
   - 新增、编辑、删除、搜索、导出等

4. **状态提示**
   - 加载中、成功、失败、连接中等

5. **错误消息**

6. **安全角色名称**
   - 安全专家、隐私安全官、安全架构师
   - 业务安全官、全域安全指挥官、首席信息安全官
   - 安全运营官、供应链安全官

7. **Skills能力名称**
   - light (光明面)、dark (黑暗面)
   - security、legal、technology、business

**涉及文件:**

新建:
- `ui/src/i18n/index.ts`
- `ui/src/i18n/lib/translate.ts`
- `ui/src/i18n/lib/types.ts`
- `ui/src/i18n/lib/registry.ts`
- `ui/src/i18n/lib/lit-controller.ts`
- `ui/src/i18n/locales/en.ts`
- `ui/src/i18n/locales/zh-CN.ts`
- `ui/src/i18n/locales/zh-TW.ts`

修改:
- `ui/src/ui/app.ts` - 初始化i18n
- `ui/src/ui/layout/sc-header.ts` - 添加语言切换器
- `ui/src/ui/pages/*.ts` - 各页面使用翻译

**语言切换UI设计**:

```
┌─────────────────────────────────────────────────────────┐
│  Header工具栏                                           │
│  [🔔] [🌐 中文 ▼] [👤]                                │
└─────────────────────────────────────────────────────────┘

点击 [🌐 中文 ▼] 显示:
┌──────────────────┐
│ ✓ 简体中文        │
│   English        │
│   繁體中文        │
└──────────────────┘
```

**API需求:**

```typescript
// 获取当前语言
i18n.getLocale(): Locale

// 设置语言
i18n.setLocale(locale: Locale): Promise<void>

// 翻译函数
t(key: string, params?: Record<string, string>): string

// 示例
t('nav.dashboard')  // -> "仪表盘"
t('common.enabled')  // -> "已启用"
t('roles.securityExpert')  // -> "安全专家"
```

**验收标准:**
- [ ] 实现i18n基础架构
- [ ] 支持简体中文和英文切换
- [ ] 页面主要文本支持多语言
- [ ] 语言切换持久化 (刷新后保持)
- [ ] 语言切换器UI实现
- [ ] 8种安全角色名称支持多语言
- [ ] Skills能力分类支持多语言
NY|

---

### Phase 9: 通讯管理页面 (P1)

#### 任务 9.1: 新增通讯管理页面，复用通讯IM软件的API能力

**需求描述**:
新增'通讯管理'页面，管理多种通讯渠道（飞书、Telegram、Slack等20个通讯工具），实现多渠道集成、消息管理和协作通讯。

**参考实现**:
参考 openclaw-2026.3.2/ui/src/ui/views/channels.ts 的实现架构。

**后端已实现的通讯渠道**:

| 渠道ID | 名称 | 状态 | 优先级 |
|--------|------|------|--------|
| feishu | 飞书 | ✅ 已实现 | P0 |
| telegram | Telegram | ✅ 已实现 | P0 |
| slack | Slack | ✅ 已实现 | P0 |
| discord | Discord | ✅ 已实现 | P0 |
| whatsapp | WhatsApp | ✅ 已实现 | P0 |
| google-chat | Google Chat | ✅ 已实现 | P0 |
| teams | Microsoft Teams | ✅ 已实现 | P0 |
| signal | Signal | ✅ 已实现 | P1 |
| imessage | iMessage | ✅ 已实现 | P1 |
| nostr | Nostr | ✅ 已实现 | P1 |

**计划新增的通讯渠道** (参考openclaw):

| 渠道ID | 名称 | 描述 |
|--------|------|------|
| sms | SMS | 短信服务 |
| email | Email | 邮件服务 |
| webhook | Webhook | 自定义Webhook |
| matrix | Matrix | 开源通讯 |
| irc | IRC | IRC频道 |
| zulip | Zulip | 企业通讯 |
| mattermost | Mattermost | 开源Slack替代 |
| rocket | Rocket.Chat | 开源聊天 |
| twilio | Twilio | 商业短信/电话 |
| wechat | WeChat | 微信 (如需要) |

**页面功能需求**:

1. **通讯渠道管理**
   - 渠道列表展示
   - 渠道启用/禁用
   - 渠道配置 (API Key, Webhook URL等)
   - 渠道状态监控

2. **消息管理**
   - 消息收发
   - 消息历史
   - 消息搜索
   - 消息转发

3. **多渠道集成**
   - 统一收件箱
   - 跨渠道消息聚合
   - 渠道优先级设置

4. **安全告警通知**
   - 安全事件通知
   - 漏洞告警推送
   - 合规状态通知

**涉及文件:**

新增:
- `ui/src/ui/pages/sc-channels-page.ts` - 通讯管理页面
- `ui/src/ui/pages/sc-channels-config.ts` - 渠道配置页面

修改:
- `ui/src/ui/router.ts` - 添加路由
- `ui/src/ui/layout/sc-sidebar.ts` - 添加导航项

**后端API需求:**

```typescript
// 获取所有通讯渠道状态
// GET /api/channels/status
// 配置通讯渠道
// POST /api/channels/:channelId/config
// 发送消息
// POST /api/channels/:channelId/send
// 获取消息
// GET /api/channels/:channelId/messages
```

**验收标准:**
- [ ] 页面显示已实现的通讯渠道列表
- [ ] 支持渠道启用/禁用
- [ ] 显示渠道在线状态
- [ ] 消息中心展示消息列表
- [ ] 可配置渠道参数
- [ ] 安全告警可推送到各渠道

---

TY|---
---

PQ|---

---

JR|-

NR|-

RT|SX|---

---

SX|---

---

*文档结束*
