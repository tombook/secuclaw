## Context

SecuClaw是一个安全运营平台,需要通过AI安全专家页面提供多角色支持。每种安全角色具备不同的技能矩阵,驱动平台各个功能模块。

**当前状态**: 功能已实现
- 前端页面位于`ui/src/ui/pages/sc-ai-experts-page.ts`
- 8种角色技能定义位于`skills/{role-id}/SKILL.md`
- 技能加载器位于`packages/core/src/skills/loader.ts`

**约束**:
- 使用Lit Web Components框架
- 通过WebSocket与后端通信
- 技能数据使用gray-matter格式解析

## Goals / Non-Goals

**Goals:**
- 统一管理8种安全角色的技能定义
- 在AI专家页面展示角色技能和MITRE/SCF覆盖
- 支持角色切换和聊天功能

**Non-Goals:**
- 不修改现有技能定义文件格式
- 不添加新的角色类型
- 不实现复杂的AI对话功能

## Decisions

### 1. SKILL.md格式定义

使用gray-matter格式定义技能:
```yaml
---
name: security-expert
description: 安全专家角色描述
metadata:
  openclaw:
    emoji: "🛡️"
    role: SEC
    combination: single
    capabilities:
      light: [...]
      dark: [...]
      security: [...]
      legal: []
      technology: [...]
      business: []
    mitre_coverage: [...]
    scf_coverage: [...]
---
# 技能内容
```

**理由**: 统一格式便于解析和扩展

### 2. 技能分类

6个技能维度:
- **Light**: 防御性技能 (蓝队)
- **Dark**: 攻击性技能 (红队)
- **Security**: 安全评估技能
- **Legal**: 合规法律技能
- **Technology**: 技术架构技能
- **Business**: 业务管理技能

### 3. 前端Fallback机制

当后端技能未加载时,使用前端默认技能数据`DEFAULT_SKILLS`:
```typescript
private getCapabilities(): Capabilities {
  if (this.skillData?.metadata?.openclaw?.capabilities) {
    return this.skillData.metadata.openclaw.capabilities;
  }
  return DEFAULT_SKILLS[this.selectedRoleId] || {...};
}
```

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 前后端技能数据不一致 | UI显示错误 | Fallback机制保证基本显示 |
| 技能数量过多 | 页面加载慢 | 按类别分组展示 |

## Migration Plan

无需迁移 - 功能已完全实现并验证。

## Open Questions

1. 是否需要添加更多可视化组件展示技能?
2. 是否需要实现多角色协同对话?
3. 是否需要导出角色技能报告?