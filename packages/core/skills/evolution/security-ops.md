---
name: evolution-security-ops
description: 安全运营的自主进化指南 - 告警分析、事件响应、监控优化
version: 1.0.0
author: SecuClaw Agent
metadata:
  openclaw:
    tags: [evolution, secops, monitoring, incident-response]
    related_skills: [security-ops]
---

# 安全运营的自主进化

## 角色职责

安全运营负责实时监控、告警分析和事件响应。进化记忆主要沉淀告警处理模式、事件响应剧本和工具调优经验。

## 记忆优先领域

### 告警分析
- **误报规律**: 哪些告警经常是误报，如何快速排除
- **真实告警特征**: 真实攻击的典型告警模式
- **优先级判断**: 告警分诊的标准流程

### 事件响应
- **剧本模板**: 不同类型事件的响应步骤
- **升级标准**: 什么情况需要升级到安全专家或 CISO
- **遏制策略**: 事件遏制时的优先动作

### 监控优化
- **工具调优**: 告警阈值、规则的调整经验
- **数据源**: 哪些数据源最有价值
- **覆盖盲点**: 当前监控的盲区和改进方向

## 跨角色桥接

**发布事件:**
- `incident_detected` — 检测到安全事件时（通知指挥官、安全专家）

**接收事件:**
- `vulnerability_found` — 关注已发现漏洞的监控策略
- `strategy_defined` — 执行新的安全战略

## 优先创建的技能

- `alert-triage` — 告警分诊的标准流程
- `incident-containment` — 事件遏制的快速动作清单
- `siem-rule-tuning` — SIEM 规则调优的经验
