# 能力中心（Capabilities Center）前端设计规格文档

> 版本: 1.0 | 日期: 2026-03-30 | 状态: 已实现

---

## 1. 概述

### 1.1 功能定位

能力中心是 SecuClaw 安全运营平台的**核心治理模块**，将企业安全能力划分为 6 大领域进行统一管理、执行和审计。每个领域拥有独立的能力项、任务流、KPI 指标和审批机制。

### 1.2 一句话描述

> 管理和执行 6 大安全能力域的任务，跟踪 KPI 指标，确保合规审计闭环。

### 1.3 目标用户

| 角色 | 使用场景 |
|---|---|
| 安全运营工程师 | 执行日常安全任务、上传证据、查看运行日志 |
| 安全主管 | 审查 KPI 指标、审批暗域操作、查看趋势 |
| 合规审计员 | 验证证据链完整性、导出审计报告 |
| CISO | 查看全局概览指标、跨域风险对比 |

---

## 2. 信息架构

### 2.1 页面层级

```
/capabilities (sc-capabilities-page)         ← 入口页
  ├── 全局概览指标栏 (metrics-bar)
  ├── 6 域标签页 (tabs)
  └── /capabilities/:domainId (sc-domain-board) ← 域详情（同页面切换）
       ├── KPI 指标卡 × 4
       ├── 能力项网格 (capabilities-grid)
       ├── 任务列表 (tasks-section)
       └── 侧边抽屉面板：
            ├── sc-task-panel        任务详情 + 状态机
            ├── sc-run-log-panel     执行日志时间线
            ├── sc-evidence-panel    证据包管理
            └── sc-kpi-explain-drawer KPI 归因解释
  └── sc-approval-dialog（弹窗）        暗域审批
```

### 2.2 导航路径

```
侧边栏「能力中心」→ /capabilities → 默认选中「光域」标签 → 展示域详情
```

---

## 3. 数据模型

### 3.1 核心实体关系

```
CapabilityDomain (6 个)          能力域
  ├── CapabilityItem (N 个)      能力项（属于域）
  ├── SecurityTask (N 个)        安全任务（属于域）
  │    ├── ExecutionRun (N 个)   执行记录（属于任务）
  │    └── EvidencePack (N 个)   证据包（关联任务或运行）
  └── DomainKPI                  域级 KPI 指标
       └── OverviewMetrics       全局汇总指标

Approval (审批单)                 暗域任务审批
  └── 关联 SecurityTask
```

### 3.2 六大能力域

| 域 ID | 中文名 | 图标 | 颜色 | 定位 |
|---|---|---|---|---|
| `light` | 光域（防御） | 🛡️ | `#10B981` 绿 | 主动防御、漏洞管理、补丁 |
| `dark` | 暗域（攻击模拟） | ⚔️ | `#EF4444` 红 | 渗透测试、红队演练（需审批） |
| `security` | 安全运营 | 🔍 | `#3B82F6` 蓝 | SIEM、告警分析、事件响应 |
| `legal` | 法律合规 | ⚖️ | `#8B5CF6` 紫 | 法规遵从、审计、数据保护 |
| `technology` | 技术架构 | 🔧 | `#F59E0B` 橙 | 架构评审、云安全、DevSecOps |
| `business` | 业务连续性 | 📊 | `#EC4899` 粉 | BCP/DRP、供应链、第三方风险 |

### 3.3 任务状态机

```
todo ──→ in_progress ──→ done ──→ closed
  │          │              
  └──→ blocked ←──┘         
         │                   
         └──→ in_progress (恢复)
```

| 状态 | 中文名 | 允许转换 |
|---|---|---|
| `todo` | 待办 | → in_progress, → blocked |
| `in_progress` | 进行中 | → done, → blocked |
| `blocked` | 阻塞 | → in_progress, → todo |
| `done` | 完成 | → closed |
| `closed` | 已关闭 | 无（可通过 reopen 重开到 in_progress） |

转换 `done → closed` 需要填写**评审评论**。转换到 `blocked` 需要填写**阻塞原因**。

### 3.4 KPI 指标

| 指标 | 计算方式 | 取值范围 | 色彩规则 |
|---|---|---|---|
| `riskScore` | 基于风险因子加权计算 | 0-100 | >70 红色 / ≤70 灰色 |
| `closureRate` | 已关闭任务 / 总任务 | 0-100% | 绿色 |
| `slaRate` | SLA 达成任务数 / 总任务 | 0-100% | 绿色 |
| `trend` | 近期变化率 | -1~1 | ≥0 绿色 / <0 红色 |

---

## 4. 页面详细设计

### 4.1 入口页 (sc-capabilities-page, 294 行)

#### 布局结构

```
┌─────────────────────────────────────────────────────┐
│ ⚔️ 能力中心                              [+ 执行任务] [📋 审批] │
│ 查看 6 大安全能力域，执行和跟踪安全任务                         │
├─────────────────────────────────────────────────────┤
│ 🛡️ 光域  │  ⚔️ 暗域  │  🔍 安全运营  │  ⚖️ 法律合规  │  🔧 技术架构  │  📊 业务连续性  │
├─────────────────────────────────────────────────────┤
│ 全局指标: 风险评分 25 | 闭环率 78% | SLA 达成率 92%           │
├─────────────────────────────────────────────────────┤
│                                                     │
│              sc-domain-board (域详情)                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### 功能点

| # | 功能 | 交互 | API |
|---|---|---|---|
| 1 | 全局概览指标 | 页面加载时自动获取 | `capabilities.overview.metrics` |
| 2 | 域标签切换 | 点击切换，高亮当前选中 | 无（前端切换 `selectedDomain` 状态） |
| 3 | 域列表加载 | 页面初始化 | `capabilities.domains.list` |
| 4 | 执行任务按钮 | 点击后触发子域板的创建任务流程 | 透传至 `sc-domain-board` |

---

### 4.2 域详情板 (sc-domain-board, 719 行)

#### 布局结构

```
┌─────────────────────────────────────────────────────┐
│ 🛡️ 光域 - 主动防御与漏洞管理                              │
│   (域图标 + 名称 + 描述)                                │
├─────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │ ℹ️ 25    │ │ ℹ️ 78%   │ │ ℹ️ 92%   │ │ ℹ️ ↑5%   │ │
│ │ 风险评分  │ │ 闭环率    │ │ SLA达成率 │ │ 趋势     │ │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
├─────────────────────────────────────────────────────┤
│ 能力项 (6)                                           │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐     │
│ │ 漏洞扫描管理  │ │ 补丁管理     │ │ 安全基线检查  │     │
│ │ 描述文字...   │ │ 描述文字...   │ │ 描述文字...   │     │
│ │ [安全工程师]  │ │ [安全工程师]  │ │ [安全工程师]  │     │
│ │   [执行]     │ │   [执行]     │ │   [执行]     │     │
│ └─────────────┘ └─────────────┘ └─────────────┘     │
├─────────────────────────────────────────────────────┤
│ 任务 (12)                                            │
│ ┌───────────────────────────────────────────────┐   │
│ │ Q1漏洞扫描  P2·安全工程师·2024-03-15  [📋][📁][▼todo] │ │
│ ├───────────────────────────────────────────────┤   │
│ │ 补丁部署    P1·运维工程师·2024-03-16  [📋][📁][▼done] │ │
│ └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

#### 功能点

| # | 功能 | 交互 | API |
|---|---|---|---|
| 1 | KPI 指标卡 | 点击打开 KPI 解释抽屉 | 无（展示 domain.kpi 数据） |
| 2 | KPI 解释 | 抽屉展示归因因子 | `sc-kpi-explain-drawer` |
| 3 | 能力项网格 | 展示该域下所有能力项 | `capabilities.items.list({domainId})` |
| 4 | 执行能力 | 非暗域：直接创建任务；暗域：弹出审批对话框 | `capabilities.tasks.create` |
| 5 | 任务列表 | 展示该域下所有任务 | `capabilities.tasks.list({domainId})` |
| 6 | 任务状态切换 | 行内下拉切换状态 | `capabilities.tasks.updateStatus` |
| 7 | 查看执行日志 | 点击📋图标，右侧抽屉打开 | `capabilities.runs.listByTask` |
| 8 | 查看证据 | 点击📁图标，右侧抽屉打开 | `capabilities.evidence.list` |
| 9 | 点击任务行 | 打开任务详情面板 | 无（展示已加载的任务数据） |
| 10 | 暗域审批 | 暗域执行时弹出审批对话框 | `capabilities.approvals.create/approve` |
| 11 | 需要审批标记 | 能力卡片上展示 ⚠️ 标记 | 数据字段 `requiresApproval` |

#### 抽屉面板机制

- 统一使用右侧 480px 抽屉（drawer）
- 同一时刻只打开一个面板
- 遮罩层点击关闭
- 面板类型：`task` / `runs` / `evidence` / `kpi`

---

### 4.3 任务详情面板 (sc-task-panel, 703 行)

#### 布局结构

```
┌─ 任务详情 ─────────────────────────── ✕ ─┐
│                                          │
│  Q1 漏洞扫描任务                           │
│  [P2] [进行中]                            │
│  描述文字...                               │
│                                          │
│  ── 状态机 ──────────────────────────────  │
│  [📋 待办] → [🔄 进行中] → [✅ 完成] → [🔒 已关闭]│
│                                          │
│  ── SLA 倒计时 ──────────────────────────  │
│  │ 剩余时间     2h 30m ✓                   │
│                                          │
│  ── 状态转换 ────────────────────────────  │
│  [✅ 完成] [🚫 阻塞]                       │
│                                          │
│  ── 快捷操作 ────────────────────────────  │
│  [📋 查看日志] [📁 查看证据]                │
│                                          │
│  ─────────────────────────────────────── │
│  [取消]                          [确认]    │
└──────────────────────────────────────────┘
```

#### 功能点

| # | 功能 | 交互 | API |
|---|---|---|---|
| 1 | 任务信息展示 | 展示标题、优先级、状态、描述 | 数据来自 `selectedTask` |
| 2 | 状态机可视化 | 横向流程图，高亮当前状态 | 前端常量 `VALID_TRANSITIONS` |
| 3 | SLA 倒计时 | 实时倒计时，颜色反映紧急程度 | 前端计算（基于 `slaMinutes`） |
| 4 | SLA 状态判定 | >20% 绿色 / ≤20% 黄色 / ≤0% 红色 | 前端计算 |
| 5 | 状态转换选择 | 点击转换按钮，展开输入框 | 无（前端选择） |
| 6 | 评审评论 | 转换到 `closed` 时必填 | 随 `updateStatus` 提交 |
| 7 | 阻塞原因 | 转换到 `blocked` 时必填 | 随 `updateStatus` 提交 |
| 8 | 确认转换 | 提交状态变更 | `capabilities.tasks.updateStatus` |
| 9 | 查看日志 | 触发父组件打开 run-log 面板 | 自定义事件 `view-logs` |
| 10 | 查看证据 | 触发父组件打开 evidence 面板 | 自定义事件 `view-evidence` |

#### SLA 计算逻辑

```
deadline = task.createdAt + task.slaMinutes × 60000
remaining = deadline - Date.now()
ratio = remaining / (slaMinutes × 60000)

status = ratio > 0.2 ? 'on-track' : ratio > 0 ? 'warning' : 'breached'
```

---

### 4.4 执行日志面板 (sc-run-log-panel, 540 行)

#### 布局结构

```
┌─ 执行日志 ─────────────────────────── ✕ ─┐
│                                          │
│  [✅ 成功]                                │
│                                          │
│  ── 基本信息 ────────────────────────────  │
│  运行ID    run_abc123                      │
│  任务ID    task_def456                      │
│  工具ID    port-scanner                    │
│  开始时间   2024-03-30 10:00:00             │
│  结束时间   2024-03-30 10:05:30             │
│  耗时      5m 30s                          │
│                                          │
│  ── 执行时间线 ──────────────────────────  │
│  ● 创建: 2024-03-30 10:00:00              │
│  │                                       │
│  ● 开始: 2024-03-30 10:00:05              │
│  │                                       │
│  ● 结束: 2024-03-30 10:05:30              │
│                                          │
│  ── 参数 ───────────────────────────────  │
│  ┌────────────────────────────────────┐  │
│  │ { "target": "10.0.0.0/8" }        │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ── 执行摘要 ───────────────────────────  │
│  发现 156 个开放端口，3 个高危服务             │
│                                          │
│  ── 产物 (2) ──────────────────────────  │
│  📄 scan_results.json         →          │
│  📄 vulnerabilities.csv       →          │
│                                          │
│  ── 历史运行 ──────────────────────────  │
│  ✅ run_abc123  2024-03-30 10:00         │
│  ❌ run_def456  2024-03-29 14:00         │
│                                          │
│  ─────────────────────────────────────── │
│                              [关闭]        │
└──────────────────────────────────────────┘
```

#### 功能点

| # | 功能 | 交互 | API |
|---|---|---|---|
| 1 | 运行状态展示 | 状态徽章（颜色+图标） | 数据来自 `ExecutionRun.status` |
| 2 | 基本信息 | 信息网格展示运行详情 | 数据来自 `ExecutionRun` |
| 3 | 执行时间线 | 三节点时间线：创建→开始→结束 | 数据来自 `createdAt/startedAt/endedAt` |
| 4 | 参数展示 | JSON 格式化展示 | 数据来自 `ExecutionRun.params` |
| 5 | 执行摘要 | 纯文本展示 | 数据来自 `ExecutionRun.summary` |
| 6 | 错误信息 | 红色错误框（仅失败时展示） | 数据来自 `ExecutionRun.error` |
| 7 | 产物列表 | 文件列表，可点击跳转证据面板 | 数据来自 `ExecutionRun.artifacts` |
| 8 | 历史运行 | 列出同任务的所有运行记录 | 数据来自 `allRuns` 属性 |
| 9 | 切换运行 | 点击历史记录切换当前展示 | 前端状态切换 |

---

### 4.5 证据面板 (sc-evidence-panel, 533 行)

#### 布局结构

```
┌─ 证据包 (3) ──────────────────────── ✕ ─┐
│                                          │
│  ⚠️ 证据必须验证后才能导出                    │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ 扫描结果报告            ○ 未验证     │  │
│  │ 包含端口扫描和漏洞发现结果            │  │
│  │ 👤 security-bot  📅 2024-03-30      │  │
│  │ ┌────────────────────────────────┐ │  │
│  │ │ 哈希: sha256:a3f2b8...         │ │  │
│  │ └────────────────────────────────┘ │  │
│  │ [扫描] [报告] [端口]                 │  │
│  │                                    │  │
│  │  ── 文件 (2) ──────────────────     │  │
│  │  📋 scan_results.json               │  │
│  │  📊 vulnerabilities.csv             │  │
│  │                                    │  │
│  │  [🔍 验证]  [📥 导出]               │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ─────────────────────────────────────── │
│                              [关闭]        │
└──────────────────────────────────────────┘
```

#### 功能点

| # | 功能 | 交互 | API |
|---|---|---|---|
| 1 | 证据列表 | 卡片式展示所有证据包 | `capabilities.evidence.list` |
| 2 | 验证状态 | 徽章展示已验证/未验证 | 前端 `verificationStatus` Map |
| 3 | 哈希展示 | 等宽字体展示 SHA-256 哈希 | 数据来自 `EvidencePack.hash` |
| 4 | 标签展示 | 标签列表 | 数据来自 `EvidencePack.tags` |
| 5 | 文件列表 | 展开/折叠展示关联文件 | 数据来自 `EvidencePack.files` |
| 6 | 哈希验证 | 点击验证按钮 | 前端模拟（对比哈希值） |
| 7 | 导出证据 | 验证后可导出 | 自定义事件 `export-evidence` |
| 8 | 验证前置条件 | 未验证时导出按钮禁用 | 前端逻辑 |
| 9 | 空状态 | 无证据时展示空状态图标 | 前端判断 |

---

### 4.6 暗域审批对话框 (sc-approval-dialog, 613 行)

#### 布局结构

```
┌─────────────────────────────────────────┐
│ 暗域操作审批                          ✕  │
├─────────────────────────────────────────┤
│ ⚠️ 安全警告                               │
│ 此操作涉及暗域能力，需要双人审批             │
├─────────────────────────────────────────┤
│                                         │
│ 操作范围 *                               │
│ ┌─────────────────────────────────────┐ │
│ │ 对生产网段进行端口扫描                │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 变更单号 *                               │
│ ┌─────────────────────────────────────┐ │
│ │ CHG-2024-0301                       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 有效期 *                                 │
│ ┌─────────────────────────────────────┐ │
│ │ 2024-03-30 18:00                    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 原因                                     │
│ ┌─────────────────────────────────────┐ │
│ │ 季度安全评估需要                     │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│          [关闭]  [创建审批]               │
└─────────────────────────────────────────┘
```

#### 功能点

| # | 功能 | 交互 | API |
|---|---|---|---|
| 1 | 暗域警告 | 始终展示红色警告横幅 | 条件：`task.domainId === 'dark'` |
| 2 | 表单验证 | 范围/单号/有效期必填 | 前端 `validateForm()` |
| 3 | 创建审批 | 提交审批单 | `capabilities.approvals.create` |
| 4 | 查看审批状态 | 审批后展示状态信息 | 数据来自 `Approval` 对象 |
| 5 | 批准操作 | 审批人点击批准 | `capabilities.approvals.approve(approved: true)` |
| 6 | 拒绝操作 | 填写拒绝原因后拒绝 | `capabilities.approvals.approve(approved: false)` |
| 7 | SoD 校验 | 申请人不能批准自己的请求 | 前端校验 `currentUser !== requester` |
| 8 | 审批状态流转 | pending → approved / rejected | 后端 `ApprovalService` |

#### 三种模式

| 模式 | 触发 | 展示 |
|---|---|---|
| `create` | 暗域执行能力项 | 创建审批表单 |
| `view` | 审批已创建 | 查看审批状态（只读） |
| `approve` | 审批人操作 | 批准/拒绝按钮 |

---

### 4.7 KPI 解释抽屉 (sc-kpi-explain-drawer, 58 行)

#### 功能点

| # | 功能 | 交互 | API |
|---|---|---|---|
| 1 | KPI 归因展示 | 抽屉展示 KPI 计算因子 | 数据来自 `domain.kpi` |
| 2 | 关闭抽屉 | 点击遮罩或关闭按钮 | 前端状态 |

---

## 5. 交互流程

### 5.1 页面加载流程

```
用户点击「能力中心」
  │
  ├── 并行请求:
  │   ├── capabilities.domains.list → 获取 6 个域定义
  │   └── capabilities.overview.metrics → 获取全局指标
  │
  ├── 域列表按 order 排序
  │
  └── 默认选中「光域」标签 → 触发 sc-domain-board 加载
       │
       └── 并行请求:
            ├── capabilities.items.list({domainId: 'light'}) → 能力项
            └── capabilities.tasks.list({domainId: 'light'}) → 任务列表
```

### 5.2 执行能力项流程

```
用户点击「执行」按钮
  │
  ├── 判断: domainId === 'dark'?
  │   │
  │   ├── YES → 弹出 sc-approval-dialog
  │   │          │
  │   │          ├── 用户填写审批表单 → capabilities.approvals.create
  │   │          │
  │   │          ├── 审批人批准 → capabilities.approvals.approve
  │   │          │
  │   │          └── 审批通过 → 创建任务
  │   │
  │   └── NO → 直接创建任务
  │              │
  │              └── capabilities.tasks.create({
  │                    domainId, capabilityId, title, priority, assigneeRole
  │                  })
  │
  └── 刷新域数据 → loadDomainData()
```

### 5.3 任务状态转换流程

```
用户在任务面板选择新状态
  │
  ├── 状态需要评审(closed)? → 展示评论输入框
  ├── 状态需要原因(blocked)? → 展示原因输入框
  │
  └── 用户点击「确认」
       │
       ├── capabilities.tasks.updateStatus({ id, status, comment })
       │
       └── 刷新域数据 → loadDomainData()
```

### 5.4 证据验证与导出流程

```
用户打开证据面板
  │
  ├── 展示所有证据包（卡片形式）
  │
  ├── 用户点击证据卡片 → 展开详情（文件列表 + 操作按钮）
  │
  ├── 用户点击「验证」 → 模拟哈希校验 → 标记为已验证
  │
  └── 用户点击「导出」
       │
       ├── 已验证? → 触发 export-evidence 事件
       └── 未验证? → 提示「请先验证」
```

---

## 6. 组件接口

### 6.1 属性和事件

#### sc-capabilities-page

| 类型 | 名称 | 类型 | 说明 |
|---|---|---|---|
| 状态 | `domains` | `CapabilityDomain[]` | 域列表 |
| 状态 | `selectedDomain` | `DomainId` | 当前选中域 |
| 状态 | `metrics` | `OverviewMetrics \| null` | 全局指标 |

#### sc-domain-board

| 类型 | 名称 | 类型 | 说明 |
|---|---|---|---|
| 属性 | `domain` | `CapabilityDomain` | 当前域（由父组件传入） |
| 状态 | `items` | `CapabilityItem[]` | 能力项列表 |
| 状态 | `tasks` | `SecurityTask[]` | 任务列表 |
| 状态 | `activePanel` | `'task' \| 'runs' \| 'evidence' \| null` | 当前打开的面板 |
| 状态 | `showApprovalDialog` | `boolean` | 审批对话框是否打开 |

#### sc-task-panel

| 类型 | 名称 | 类型 | 说明 |
|---|---|---|---|
| 属性 | `task` | `SecurityTask` | 当前任务 |
| 事件 | `task-status-change` | `{ taskId, newStatus, comment }` | 状态变更 |
| 事件 | `view-logs` | `{ taskId }` | 查看日志 |
| 事件 | `view-evidence` | `{ taskId }` | 查看证据 |
| 事件 | `close-panel` | — | 关闭面板 |

#### sc-run-log-panel

| 类型 | 名称 | 类型 | 说明 |
|---|---|---|---|
| 属性 | `run` | `ExecutionRun` | 当前运行记录 |
| 属性 | `allRuns` | `ExecutionRun[]` | 同任务所有运行记录 |
| 事件 | `close-panel` | — | 关闭面板 |

#### sc-evidence-panel

| 类型 | 名称 | 类型 | 说明 |
|---|---|---|---|
| 属性 | `evidence` | `EvidencePack[]` | 证据列表 |
| 属性 | `taskId` | `string` | 任务 ID |
| 属性 | `runId` | `string` | 运行 ID |
| 事件 | `close-panel` | — | 关闭面板 |
| 事件 | `export-evidence` | `{ evidenceId, verified }` | 导出证据 |

#### sc-approval-dialog

| 类型 | 名称 | 类型 | 说明 |
|---|---|---|---|
| 属性 | `task` | `SecurityTask \| null` | 关联任务 |
| 属性 | `existingApproval` | `Approval \| null` | 已有审批 |
| 属性 | `mode` | `'create' \| 'view' \| 'approve'` | 对话框模式 |
| 属性 | `currentUser` | `string` | 当前用户 |
| 事件 | `approval-created` | `{ approval }` | 审批创建成功 |
| 事件 | `approval-approved` | `{ approvalId, approved }` | 审批结果 |
| 事件 | `close-dialog` | — | 关闭对话框 |

---

## 7. API 映射

### 7.1 前端调用 → 后端路由

| 前端方法 | 后端 Handler | CRUD |
|---|---|---|
| `capabilitiesClient.listDomains()` | `capabilities.domains.list` | R |
| `capabilitiesClient.getOverviewMetrics()` | `capabilities.overview.metrics` | R |
| `capabilitiesClient.listItems({domainId})` | `capabilities.items.list` | R |
| `capabilitiesClient.listTasks({domainId})` | `capabilities.tasks.list` | R |
| `capabilitiesClient.createTask({...})` | `capabilities.tasks.create` | C |
| `capabilitiesClient.updateTaskStatus({...})` | `capabilities.tasks.updateStatus` | U |
| `capabilitiesClient.getTaskSla(taskId)` | `capabilities.tasks.sla` | R |
| `capabilitiesClient.closeTask(id)` | `capabilities.tasks.close` | U |
| `capabilitiesClient.reopenTask(id)` | `capabilities.tasks.reopen` | U |
| `capabilitiesClient.createApproval({...})` | `capabilities.approvals.create` | C |
| `capabilitiesClient.approveApproval({...})` | `capabilities.approvals.approve` | U |
| `capabilitiesClient.executeRun({...})` | `capabilities.runs.execute` | C |
| `capabilitiesClient.listRunsByTask(taskId)` | `capabilities.runs.listByTask` | R |
| `capabilitiesClient.createEvidence({...})` | `capabilities.evidence.create` | C |
| `capabilitiesClient.listEvidence({...})` | `capabilities.evidence.list` | R |

### 7.2 后端服务层

| 文件 | 职责 |
|---|---|
| `packages/core/src/capabilities/service.ts` | 主服务入口（单例），编排各子服务 |
| `packages/core/src/capabilities/repository.ts` | JsonStore 数据持久化 |
| `packages/core/src/capabilities/state-machine.ts` | 任务状态转换校验 |
| `packages/core/src/capabilities/risk-assessment-service.ts` | 风险因子管理与计算 |
| `packages/core/src/capabilities/report-generator.ts` | 域级报告生成 |
| `packages/core/src/capabilities/approval-service.ts` | 审批流 + SoD 校验 |
| `packages/core/src/capabilities/tool-task-service.ts` | 工具执行任务管理 |
| `packages/core/src/capabilities/types.ts` | 共享类型定义 |

---

## 8. 设计约束

### 8.1 技术约束

- WebSocket-only 架构，所有 API 通过 `gatewayClient.request()` 调用
- 使用 Lit Web Components + `@state()` / `@property()` 响应式
- 使用 `I18nController` 支持中英双语
- 不引入新依赖
- 不使用 REST API

### 8.2 安全约束

- 暗域（dark）所有操作**必须**经过双人审批
- SoD（职责分离）：申请人 ≠ 审批人
- 证据导出前**必须**验证哈希
- 审批有效期机制防止长期授权

### 8.3 UX 约束

- 页面加载时并行请求所有数据（`Promise.all`）
- API 失败时展示空状态，不展示空白页
- 状态转换需要明确确认，防止误操作
- 所有标签、提示、按钮使用中文

---

## 9. 文件清单

| 文件 | 行数 | 职责 |
|---|---|---|
| `ui/src/ui/pages/capabilities/sc-capabilities-page.ts` | 294 | 入口页：域标签 + 全局指标 |
| `ui/src/ui/pages/capabilities/sc-domain-board.ts` | 719 | 域详情：能力网格 + 任务列表 + 面板管理 |
| `ui/src/ui/pages/capabilities/sc-task-panel.ts` | 703 | 任务面板：状态机 + SLA + 转换 |
| `ui/src/ui/pages/capabilities/sc-run-log-panel.ts` | 540 | 运行日志：时间线 + 参数 + 产物 |
| `ui/src/ui/pages/capabilities/sc-evidence-panel.ts` | 533 | 证据面板：哈希验证 + 导出 |
| `ui/src/ui/pages/capabilities/sc-approval-dialog.ts` | 613 | 审批对话框：表单 + SoD |
| `ui/src/ui/pages/capabilities/sc-kpi-explain-drawer.ts` | 58 | KPI 归因解释抽屉 |
| `ui/src/ui/capabilities-client.ts` | 277 | API 客户端封装（15 个方法） |
| **总计** | **3737** | |

---

## 10. 路由注册

```typescript
// ui/src/ui/app.ts
{ path: '/capabilities', component: 'sc-capabilities-page', action: guardRoute },
```

侧边栏导航项：
```typescript
{ label: '能力中心', icon: '⚔️', path: '/capabilities' }
```

i18n 键：
```typescript
'nav.capabilities': '能力中心',
'capabilities.title': '能力中心',
'capabilities.domains.light': '光域',
'capabilities.domains.dark': '暗域',
// ... 完整 i18n 见 ui/src/i18n/locales/zh-CN.ts
```
