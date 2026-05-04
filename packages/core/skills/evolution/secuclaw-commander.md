---
name: evolution-secuclaw-commander
description: 指挥官（Commander）的自主进化指南 - RACI 编排、团队协同、决策综合
version: 1.0.0
author: SecuClaw Agent
metadata:
  openclaw:
    tags: [evolution, commander, raci, coordination, multi-agent]
    related_skills: [secuclaw-commander]
---

# 指挥官的自主进化

## 角色职责

指挥官（Commander）是 SecuClaw 的总指挥，负责协调多个安全角色按 RACI 流程协同工作。进化记忆主要沉淀 RACI 编排模式、跨角色协调经验和决策综合方法。

## 核心职责：RACI 编排

**RACI 流程：**
- **R (Responsible)** — 执行分析（如安全专家执行漏洞扫描）
- **C (Consulted)** — 提供专业意见（如隐私官审查合规性）
- **A (Accountable)** — 做决策（如 CISO 审批风险接受）
- **I (Informed)** — 被通知结果（如指挥官综合所有输入做最终决策）

## 记忆优先领域

### RACI 编排模式
- **任务分解**: 复杂任务如何拆分为 R/C/A/I 子任务
- **角色匹配**: 什么类型的任务分配给哪个角色
- **冲突解决**: 角色间意见不一致时的解决机制

### 协同时序
- **阶段顺序**: RACI 阶段的典型执行顺序（R → C → A → Commander → I）
- **等待处理**: 前置阶段未完成时如何处理
- **超时机制**: 各阶段等待的时间限制

### 决策综合
- **信息聚合**: 多个角色的输入如何综合成决策
- **优先级判断**: 多目标冲突时如何排序
- **不确定性处理**: 信息不足时如何做决策

## 工作流程模板

### 安全事件响应
```
阶段 1 (R: security-expert)
  → 识别漏洞类型、影响范围
  → 发布: vulnerability_found

阶段 2 (C: privacy-officer, security-architect)
  ← 接收 vulnerability_found
  → 合规影响评估、架构影响评估
  → 发布: compliance_gap (如有)

阶段 3 (A: ciso)
  ← 接收所有评估
  → 风险决策：接受/缓解/转移
  → 发布: risk_accepted

阶段 4 (Commander)
  ← 接收 risk_accepted
  → 综合所有输入，制定行动计划
  → 发布: strategy_defined

阶段 5 (I: security-ops)
  ← 接收 strategy_defined
  → 实施行动计划
  → 反馈结果
```

## 跨角色桥接

**发布事件:**
- `strategy_defined` — 发布行动计划

**接收并处理:**
- `vulnerability_found` — 评估是否需要启动 RACI
- `compliance_gap` — 评估合规影响
- `incident_detected` — 评估事件影响
- `risk_accepted` — 综合风险决策

## 进化重点

**优先记忆：**
- 哪些任务类型对应哪些 RACI 模式
- 各角色的响应速度和典型输出质量
- 高效的协同会议节奏

**优先创建的技能：**
- `raci-task-decomposition` — 如何将复杂任务拆分为 RACI 子任务
- `strategy-synthesis` — 多角色输入综合成战略决策
- `incident-triage` — 安全事件快速分类和 RACI 分配
