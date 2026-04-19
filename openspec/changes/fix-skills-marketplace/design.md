## Context

技能市场后端仅有 `skills.list/get`（`skills-routes.ts`），前端 `skill-store.ts` 仅调用读取。Commander 实体已有 `skillStates: Record<string, SkillState>` 字段（ARCHITECTURE.md 定义），但无写入方法。前端路由 `/skills-market` 指向 `sc-secops-center` 的 `baseline` 工具。

## Goals / Non-Goals

**Goals:**
- 实现技能安装/卸载/激活/停用生命周期
- 技能状态关联 Commander 的 `skillStates` 字段
- 新建 `sc-skills-market-page.ts` 独立页面
- 扩展 `skill-store.ts` 支持写入操作

**Non-Goals:**
- 自定义技能创建/编辑
- 技能版本管理
- 技能插件热加载

## Decisions

### D1: 技能安装 = Commander.skillStates 写入

**选择**: `skills.install` 实现为在当前 Commander 的 `skillStates` 中添加条目。
**原因**: Commander 实体已定义 `skillStates` 字段结构，直接复用。
**数据结构**:
```typescript
interface SkillState {
  installed: boolean;
  activated: boolean;
  installedAt?: number;
  activatedAt?: number;
  version: string;
}
```

### D2: 技能市场 UI 架构

**选择**: 新建 `sc-skills-market-page.ts`，卡片网格布局，每个角色技能一张卡片。
**原因**: 8 种角色技能以视觉化卡片展示最直观，与设计文档 `SPEC-12-AI-EXPERTS.md` 一致。

## Risks / Trade-offs

- **Commander 可能未初始化** → 需处理无 Commander 时的技能安装（创建默认 Commander）
- **技能定义与安装状态分离** → skills 来自 SKILL.md 文件，安装状态在 Commander 中，查询需关联
