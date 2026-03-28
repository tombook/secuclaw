# SecuClaw 安全指挥官系统 - 功能设计说明

> **文档版本**: v2.0  
> **更新日期**: 2026-03-28  
> **项目路径**: `/Users/tombook/Documents/work/ai_openclaw/dev_work/secuclaw`

---

## 一、系统概述

### 1.1 核心理念

**SecuClaw安全指挥官系统**是一个以8种安全角色为核心、光明与黑暗双面技能为驱动的安全决策指挥平台。

### 1.2 技术架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SecuClaw System                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Frontend (Lit + Vite + TypeScript)                 │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │   │
│  │  │Dashboard │ │  Threats │ │Incidents │ │ War-Room │              │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │   │
│  │  │AI Experts│ │Knowledge │ │  Skills  │ │  Login   │              │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                    WebSocket (21981)  │  REST API (21982)                   │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Gateway Server (WebSocket)  │  API Server (REST)                  │   │
│  │  - 77 WebSocket Methods      │  - CRUD Operations                   │   │
│  │  - Real-time Communication    │  - File Upload/Download              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Core Services                                │   │
│  │  AI Engine │ Skills │ Knowledge │ Capabilities │ Compliance       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 端口配置

| 服务 | 端口 | 协议 | 说明 |
|------|------|------|------|
| Gateway | 21981 | WebSocket | 实时双向通信 |
| API | 21982 | REST | HTTP接口 |

---

## 二、八种安全角色

### 2.1 角色列表

| 角色ID | 名称 | Emoji | 组合 | 光明能力 | 黑暗能力 |
|--------|------|-------|------|----------|----------|
| `security-expert` | 安全专家 | 🛡️ | SEC | 漏洞扫描、安全监控、事件响应 | 渗透测试、红队演练、漏洞利用 |
| `privacy-officer` | 隐私安全官 | 🔐 | SEC+LEG | 隐私影响评估、合规审计、用户权利响应 | 隐私合规渗透、数据流向追踪 |
| `security-architect` | 安全架构师 | 🏗️ | SEC+IT | 安全架构设计、零信任架构、防御纵深 | 架构弱点分析、攻击路径绘制 |
| `business-security-officer` | 业务安全官 | 📊 | SEC+BIZ | 业务连续性管理、风险量化评估、供应链安全 | 业务逻辑漏洞挖掘、业务流程攻击模拟 |
| `secuclaw-commander` | 全域安全指挥官 | 🎯 | SEC+LEG+IT+BIZ | 战略规划、全面安全治理、危机管理 | 全面渗透测试、APT模拟、供应链攻击 |
| `ciso` | 首席信息安全官 | 👔 | SEC+LEG+IT | 安全战略规划、合规治理、风险管理 | 合规漏洞挖掘、监管渗透测试 |
| `security-ops` | 安全运营官 | ⚙️ | SEC+IT+BIZ | 威胁监控、事件响应、SOC运营 | 渗透测试、红队演练、攻击路径发现 |
| `supply-chain-security` | 供应链安全官 | 🔗 | SEC+LEG+BIZ | 供应商安全评估、第三方风险管理、供应链合规 | 供应链渗透测试、第三方漏洞挖掘 |

---

## 三、API方法清单 (77个)

### 3.1 认证模块 (4个)
| Method | 说明 |
|--------|------|
| `auth.login` | 用户登录 |
| `auth.logout` | 用户登出 |
| `auth.getCurrentUser` | 获取当前用户 |
| `auth.hasPermission` | 检查权限 |

### 3.2 技能模块 (2个)
| Method | 说明 |
|--------|------|
| `skills.list` | 获取技能列表 |
| `skills.get` | 获取技能详情 |

### 3.3 知识库-MITRE (5个)
| Method | 说明 |
|--------|------|
| `knowledge.mitre.stats` | 获取MITRE统计 |
| `knowledge.mitre.tactics` | 获取战术列表 |
| `knowledge.mitre.techniques` | 获取技术列表 |
| `knowledge.mitre.search` | 搜索MITRE |

### 3.4 知识库-SCF (5个)
| Method | 说明 |
|--------|------|
| `knowledge.scf.stats` | 获取SCF统计 |
| `knowledge.scf.domains` | 获取领域列表 |
| `knowledge.scf.controls` | 获取控制项 |
| `knowledge.scf.search` | 搜索SCF |

### 3.5 指挥官模块 (6个)
| Method | 说明 |
|--------|------|
| `commander.get` | 获取指挥官信息 |
| `commander.create` | 创建指挥官 |
| `commander.update` | 更新指挥官 |
| `commander.activateRole` | 激活角色 |
| `commander.deactivateRole` | 停用角色 |
| `commander.bindLLM` | 绑定LLM |

### 3.6 LLM模块 (5个)
| Method | 说明 |
|--------|------|
| `llm.providers.list` | 获取LLM提供商列表 |
| `llm.providers.add` | 添加LLM提供商 |
| `llm.providers.update` | 更新LLM提供商 |
| `llm.providers.delete` | 删除LLM提供商 |
| `llm.chat` | LLM对话 |

### 3.7 AI专家模块 (2个)
| Method | 说明 |
|--------|------|
| `aiExperts.config.get` | 获取AI专家配置 |
| `aiExperts.config.save` | 保存AI专家配置 |

### 3.8 频道模块 (3个)
| Method | 说明 |
|--------|------|
| `channels.status` | 获取频道状态 |
| `channels.configure` | 配置频道 |
| `channels.send` | 发送消息 |

### 3.9 能力模块 (16个)
| Method | 说明 |
|--------|------|
| `capabilities.domains.list` | 获取能力领域列表 |
| `capabilities.items.list` | 获取能力项列表 |
| `capabilities.tasks.list` | 获取任务列表 |
| `capabilities.tasks.create` | 创建任务 |
| `capabilities.tasks.updateStatus` | 更新任务状态 |
| `capabilities.tasks.sla` | 获取SLA信息 |
| `capabilities.tasks.close` | 关闭任务 |
| `capabilities.tasks.reopen` | 重开任务 |
| `capabilities.approvals.create` | 创建审批 |
| `capabilities.approvals.approve` | 审批通过 |
| `capabilities.runs.execute` | 执行演练 |
| `capabilities.runs.listByTask` | 获取任务执行记录 |
| `capabilities.evidence.create` | 创建证据 |
| `capabilities.evidence.list` | 获取证据列表 |
| `capabilities.overview.metrics` | 获取能力概览指标 |

### 3.10 KPI模块 (2个)
| Method | 说明 |
|--------|------|
| `kpi.calculate` | 计算KPI |
| `kpi.summary` | 获取KPI摘要 |

### 3.11 安全事件模块 (6个)
| Method | 说明 |
|--------|------|
| `incidents.list` | 获取事件列表 |
| `incidents.get` | 获取事件详情 |
| `incidents.create` | 创建事件 |
| `incidents.update` | 更新事件 |
| `incidents.delete` | 删除事件 |
| `incidents.updateStatus` | 更新事件状态 |
| `incidents.stats` | 获取事件统计 |

### 3.12 漏洞模块 (5个)
| Method | 说明 |
|--------|------|
| `vulnerabilities.list` | 获取漏洞列表 |
| `vulnerabilities.get` | 获取漏洞详情 |
| `vulnerabilities.updateStatus` | 更新漏洞状态 |
| `vulnerabilities.assign` | 分配漏洞 |
| `vulnerabilities.stats` | 获取漏洞统计 |

### 3.13 威胁模块 (4个)
| Method | 说明 |
|--------|------|
| `threats.list` | 获取威胁列表 |
| `threats.get` | 获取威胁详情 |
| `threats.stats` | 获取威胁统计 |
| `threats.search` | 搜索威胁 |

### 3.14 合规模块 (3个)
| Method | 说明 |
|--------|------|
| `compliance.list` | 获取合规列表 |
| `compliance.get` | 获取合规详情 |
| `compliance.stats` | 获取合规统计 |

### 3.15 资产模块 (3个)
| Method | 说明 |
|--------|------|
| `assets.list` | 获取资产列表 |
| `assets.get` | 获取资产详情 |
| `assets.stats` | 获取资产统计 |

### 3.16 AI分析模块 (7个)
| Method | 说明 |
|--------|------|
| `ai.insights` | AI洞察 |
| `ai.anomalies` | 异常检测 |
| `ai.trend` | 趋势分析 |
| `ai.recommendations` | AI推荐 |
| `ai.anomaly.acknowledge` | 确认异常 |
| `ai.anomaly.resolve` | 解决异常 |
| `ai.chat` | AI对话 |
| `ai.action.execute` | 执行AI动作 |

---

## 四、前端页面清单

### 4.1 核心页面

| 页面文件 | 路由 | 说明 |
|----------|------|------|
| `sc-dashboard.ts` | `/` | 首页仪表盘 |
| `sc-login-page.ts` | `/login` | 登录页 |
| `sc-ai-experts-page.ts` | `/ai-experts` | AI专家配置 |
| `sc-knowledge-base.ts` | `/knowledge` | 知识库 |

### 4.2 安全运营页面

| 页面文件 | 路由 | 说明 |
|----------|------|------|
| `sc-threats-page.ts` | `/threats` | 威胁管理 |
| `sc-incidents-page.ts` | `/incidents` | 安全事件 |
| `sc-vulnerabilities-page.ts` | `/vulnerabilities` | 漏洞管理 |
| `sc-compliance-page.ts` | `/compliance` | 合规管理 |
| `sc-secops-center.ts` | `/secops` | 安全运营中心 |

### 4.3 高级功能页面

| 页面文件 | 路由 | 说明 |
|----------|------|------|
| `sc-war-room-page.ts` | `/war-room` | 红蓝对抗作战室 |
| `sc-skills-market.ts` | `/skills-market` | 技能市场 |
| `sc-pentest-page.ts` | `/pentest` | 渗透测试 |
| `sc-threathunt-page.ts` | `/threat-hunt` | 威胁狩猎 |
| `sc-capabilities-page.ts` | `/capabilities` | 能力管理 |

### 4.4 数据与报告页面

| 页面文件 | 路由 | 说明 |
|----------|------|------|
| `sc-reports-page.ts` | `/reports` | 报告中心 |
| `sc-reports-pro.ts` | `/reports-pro` | 专业报告 |
| `sc-risk-page.ts` | `/risk` | 风险中心 |
| `sc-risk-center.ts` | `/risk-center` | 风险量化 |
| `sc-datacenter-page.ts` | `/datacenter` | 数据中心 |

### 4.5 工具与设置页面

| 页面文件 | 路由 | 说明 |
|----------|------|------|
| `sc-settings` (目录) | `/settings` | 系统设置 |
| `sc-baseline-page.ts` | `/baseline` | 基线管理 |
| `sc-vulnscan-page.ts` | `/vuln-scan` | 漏洞扫描 |
| `sc-channels-page.ts` | `/channels` | 频道管理 |

---

## 五、核心数据结构

### 5.1 Commander (指挥官)
```typescript
interface Commander {
  id: string;
  name: string;
  type: 'personal' | 'organization' | 'government';
  organization?: string;
  roles: RoleConfig[];
  primaryRole: string;
  llmBindings: Record<string, LLMBinding>;
  skillStates: Record<string, SkillState>;
  settings: CommanderSettings;
}
```

### 5.2 Incident (安全事件)
```typescript
interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  category: string;
  source: string;
  assignee?: string;
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
}
```

### 5.3 Vulnerability (漏洞)
```typescript
interface Vulnerability {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in-progress' | 'resolved' | 'accepted';
  cvss?: number;
  cveId?: string;
  affectedAsset: string;
  discoveredAt: number;
}
```

### 5.4 Threat (威胁)
```typescript
interface Threat {
  id: string;
  name: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  source: string;
  ioc: Record<string, any>;
  mitreTechniques?: string[];
  status: 'active' | 'mitigated' | 'false-positive';
  detectedAt: number;
}
```

---

## 六、知识库集成

### 6.1 MITRE ATT&CK
- **战术 (Tactics)**: Initial Access, Execution, Persistence, Privilege Escalation, Defense Evasion, Credential Access, Discovery, Lateral Movement, Collection, Command and Control, Exfiltration, Impact
- **技术 (Techniques)**: 100+ 攻击技术
- **数据源 (Data Sources)**: 进程、网络、文件等

### 6.2 SCF (安全控制框架)
- **领域 (Domains)**: 身份安全、数据安全、边界安全等
- **控制项 (Controls)**: 50+ 安全控制

---

## 七、服务端口与启动

### 7.1 启动命令
```bash
cd packages/core
bun src/main.ts
```

### 7.2 访问地址
- **WebSocket**: `ws://127.0.0.1:21981/ws`
- **REST API**: `http://127.0.0.1:21982/api/v1`
- **健康检查**: `http://127.0.0.1:21982/health`

---

## 八、目录结构

```
secuclaw/
├── packages/
│   └── core/src/
│       ├── ai/                    # AI分析引擎
│       │   ├── anomaly-detection.ts
│       │   ├── incident-summary.ts
│       │   ├── insight-engine.ts
│       │   ├── service.ts
│       │   ├── threat-intel.ts
│       │   ├── types.ts
│       │   └── vulnerability-fix.ts
│       ├── api/                   # REST API服务器
│       │   ├── middleware/
│       │   ├── routes/
│       │   └── server.ts
│       ├── capabilities/          # 能力模块
│       ├── gateway/              # WebSocket网关
│       │   ├── router.ts        # 77个方法
│       │   └── server.ts
│       ├── incidents/            # 安全事件
│       ├── knowledge/            # 知识库
│       │   ├── mitre/           # MITRE ATT&CK
│       │   └── scf/             # SCF控制框架
│       ├── kpi/                  # KPI指标
│       ├── roles/                # 角色管理
│       ├── skills/               # 技能系统
│       ├── threats/              # 威胁管理
│       ├── vulnerabilities/       # 漏洞管理
│       ├── storage/             # JSON存储
│       └── main.ts              # 入口文件
├── ui/                          # 前端
│   └── src/ui/
│       ├── pages/               # 25+ 页面
│       ├── components/          # 组件
│       ├── services/           # 服务
│       └── layout/             # 布局
└── skills/                     # 8个角色技能定义
    ├── security-expert/
    ├── ciso/
    ├── security-ops/
    └── ... (共8个)
```

---

## 九、SPEC文档对应关系

| SPEC编号 | 描述 | 实现状态 |
|----------|------|----------|
| SPEC-01 | 系统架构设计 | ✅ 已完成 |
| SPEC-02 | 八种安全角色定义 | ✅ 已完成 |
| SPEC-03 | WebSocket网关 | ✅ 已完成 (77方法) |
| SPEC-04 | REST API服务器 | ✅ 已完成 |
| SPEC-05 | 前端仪表盘 | ✅ 已完成 |
| SPEC-06 | 安全事件管理 | ✅ 已完成 |
| SPEC-07 | 漏洞管理 | ✅ 已完成 |
| SPEC-08 | 威胁管理 | ✅ 已完成 |
| SPEC-09 | 知识库(MITRE+SCF) | ✅ 已完成 |
| SPEC-10 | AI分析引擎 | ✅ 已完成 |
| SPEC-11 | 红蓝对抗作战室 | 🔄 进行中 |
| SPEC-12 | AI专家系统 | ✅ 已完成 |

---

*文档生成时间: 2026-03-28*
