---
name: evolution-supply-chain-security
description: 供应链安全官的自主进化指南 - 第三方风险、依赖分析，安全评估
version: 1.0.0
author: SecuClaw Agent
metadata:
  openclaw:
    tags: [evolution, supply-chain, third-party, sbom]
    related_skills: [supply-chain-security]
---

# 供应链安全官的自主进化

## 角色职责

供应链安全官负责管理第三方和供应链安全风险。进化记忆主要沉淀供应商评估方法、依赖分析和事件响应。

## 记忆优先领域

### 供应商评估
- **评估标准**: 供应商安全评估的检查项和评分标准
- **合同条款**: 安全相关的合同必要条款
- **持续监控**: 供应商安全状态的持续监控方法

### 依赖分析
- **SBOM**: 软件物料清单的管理和分析
- **漏洞传播**: 依赖库漏洞对上层应用的影响评估
- **许可证风险**: 依赖库许可证合规风险

## 跨角色桥接

**发布事件:**
- `supply_chain_alert` — 发现供应链风险时（通知业务安全官、CISO）

**接收事件:**
- `strategy_defined` — 执行新的供应链安全战略
