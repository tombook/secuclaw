---
name: evolution
description: 自主进化能力 - 记忆沉淀、技能进化、跨角色知识桥接、上下文压缩
version: 1.0.0
author: SecuClaw Agent
metadata:
  openclaw:
    tags: [evolution, memory, skills, nudge, compression]
    related_skills: [context-driven-development]
---

# 自主进化 (Autonomous Evolution)

## 角色定义

自主进化是 SecuClaw 的核心能力，让 AI 能够从对话历史中持续学习和积累经验。与 SecuClaw 的多角色协同架构配合，进化系统在每个角色的独立记忆中沉淀知识，同时通过 RoleBridge 在角色间传递关键发现。

## 核心机制

### 1. 记忆系统 (Memory)

**两条记忆链：**
- `memory` (Agent Notes) — 安全知识、工作流程、经验教训
- `user` (User Profile) — 用户偏好、工作风格、期望行为

**何时保存记忆：**
- 用户明确表达偏好或期望（"以后都用 XXX 方式"）
- 用户纠正了错误（"不要这样做，正确的是..."）
- 发现了一个可复用的工作流程或模式
- 经过多次尝试才找到正确的解决方法
- 用户揭示了个人信息（角色、职位、项目背景）

**何时不保存：**
- 简单的事实性问题（What's the capital of France?）
- 一次性操作（没有积累价值的对话）
- 重复已记住的内容

**格式规范：**
- 每条记忆不超过 2200 字符（memory）或 1375 字符（user）
- 使用 `§` 分隔符连接多条记忆
- 内容必须包含足够的上下文，独立可理解

### 2. Nudge 自省触发器

**计数器机制：**
- `turnsSinceMemory` — 每用户轮次 +1，10 轮触发一次 Memory Review
- `itersSinceSkill` — 每工具调用 +1，10 次调用触发一次 Skill Review

**触发时机：**
- Nudge 触发后计数器重置，不立即再次触发
- Review 通过 LLM 分析对话历史，决定是否创建/更新记忆或技能
- 审查是静默的后台过程，不打断主对话流

### 3. 技能进化 (Skills)

**技能来源：**
- `manual` — 用户手动创建
- `evolved` — 后台审查自动创建
- `installed` — 内置 skill（managed）

**何时创建/更新技能：**
- 完成了非平凡的任务（需要多次尝试或改变方向）
- 用户期望或偏好与当前方法不同
- 发现了一个可复用的工作流程
- 复杂的命令序列被反复使用

**技能命名规范：**
- 使用 `kebab-case`（如 `nmap-network-scan`）
- 名称必须描述功能，不使用缩写
- 描述清晰说明何时使用此技能

### 4. 跨角色知识桥接 (RoleBridge)

**事件类型：**
- `vulnerability_found` — 安全专家发现漏洞
- `compliance_gap` — 隐私官发现合规缺口
- `risk_accepted` — CISO 审批了风险
- `strategy_defined` — Commander 定义了战略
- `incident_detected` — 安全运营官检测到事件
- `supply_chain_alert` — 供应链安全官发出警报
- `architecture_review` — 安全架构师完成架构评审
- `business_impact` — 业务安全官评估了业务影响

**共享原则：**
- 角色间不共享原始记忆（安全隔离）
- 共享经过 LLM 压缩的摘要
- 每个角色有独立的 nudge 计数器

### 5. 上下文压缩 (Context Compression)

**触发条件：**
- Token 消耗超过上下文窗口的 75%
- 连续 2 次压缩节省 < 10% → 跳过（反抖动）
- 压缩失败后 600s 冷却

**压缩策略：**
- 保护前 3 条消息（系统提示、角色定义等）
- 保护最后 6 条消息（最新上下文）
- 中间部分 LLM 摘要生成结构化总结
- 摘要格式：Summary / Key Decisions / Files / Remaining Work / Resolved Questions

## 工具使用

### memory

添加或读取记忆：

```
action: add
target: memory  # 或 user
content: |
  用户偏好：总是先用 nmap -sV 探测版本，再针对性扫描
  原因：避免触发 IDS 的高频扫描规则
```

```
action: read
target: memory
```

### skill_manage

创建或更新技能：

```
action: create
name: nmap-service-detection
content: |
  ---
  name: nmap-service-detection
  description: 使用 nmap 进行服务版本探测的标准流程
  ---
  # Nmap 服务版本探测

  先探测再深入，避免打草惊蛇。

  1. nmap -sV --version-intensity 5 target
  2. 分析版本信息
  3. 针对性详细扫描
```

## 决策框架

### 什么值得记忆？

```
是用户揭示的个人信息？
├── 是 → 保存到 user profile
└── 否 → 继续检查

是用户表达的明确偏好或期望？
├── 是 → 保存到 user profile
└── 否 → 继续检查

是经过试错才发现的解决方案？
├── 是 → 保存到 memory (lesson 或 pattern)
└── 否 → 继续检查

是可复用的工作流程？
├── 是 → 考虑创建 skill
└── 否 → 不保存
```

### 什么值得创建技能？

```
任务是否非平凡？
├── 否（一次性）→ 不创建
└── 是 → 继续

是否有明确的可复用模式？
├── 是 → 创建 skill
└── 否 → 检查用户是否表达了不同期望

用户是否期望不同的方法？
├── 是 → 创建/更新 skill
└── 否 → 不创建
```

## 安全原则

1. **无自我修改** — 不修改系统提示、AGENTS.md 或其他安全文件
2. **审查后保存** — 所有进化决策经过 LLM 审查，不自动保存
3. **内容扫描** — 记忆和技能内容经过威胁模式扫描（注入、后门等）
4. **角色隔离** — 各角色的记忆严格隔离，不跨角色泄露
5. **摘要共享** — 跨角色知识通过 LLM 摘要传递，不共享原始记忆

## 限制

- 记忆有字数限制（2200/1375 字符）
- 技能内容限制 100K 字符
- 单次 LLM 摘要最多 12000 tokens
- 后台审查最多 8 次迭代
- 敏感信息（如密钥、凭据）永不存入记忆
