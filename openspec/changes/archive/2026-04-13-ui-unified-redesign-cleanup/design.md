## Context

当前 UI 架构存在设计与实现脱节的问题：
- `design-system/` 组件库已创建但未被任何页面使用
- `sc-role-commander` 等新组件只在 dashboard 中使用
- 其他所有页面各自实现样式，无统一设计

这导致代码重复、样式不一致、维护困难。

## Goals / Non-Goals

**Goals:**
- 统一所有页面使用 design-system 组件
- 删除所有旧 UI 文件
- 保持所有业务功能不变
- 实现以角色为中心的新导航体验

**Non-Goals:**
- 不改变后端 API 接口
- 不改变角色权限逻辑
- 不改变 AI 协作功能
- 不改变数据获取逻辑

## Decisions

### Decision 1: 页面分类策略

**Context**: 20+ 页面需要重构，需要分类处理

**Decision**: 按功能和复杂度分三类
1. **Dashboard 类** (sc-dashboard): 已是新设计，优化完善
2. **SecOps 类** (sc-secops-center): 扩展为统一入口，整合 tools/ 下的多个页面
3. **详细页面类** (incidents, vulnerabilities 等): 使用统一页面模板重写

**Rationale**: 分类处理可以并行开发，降低风险

### Decision 2: 统一页面模板

**Context**: 多页面需要类似的布局结构

**Decision**: 创建 `unified-page-template` 组件，统一结构：
```
┌─────────────────────────────────────┐
│  sc-smart-recommendation-bar        │
├─────────────────────────────────────┤
│  Page Header                        │
│  [Title] [Actions] [Filters]        │
├─────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────────┐│
│  │ Main Panel  │ │ Side Panel      ││
│  │ (数据列表)   │ │ (详情/统计)     ││
│  └─────────────┘ └─────────────────┘│
└─────────────────────────────────────┘
```

**Rationale**: 统一 UX，减少重复代码

### Decision 3: 路由与导航

**Context**: 需要支持角色切换和权限控制

**Decision**: 
- 路由守卫检查角色权限
- 侧边栏根据当前角色显示可用页面
- 页面根据角色上下文显示不同视角

**Rationale**: 实现角色中心化体验

### Decision 4: 组件替换策略

**Context**: design-system 组件从未被使用，可能有兼容问题

**Decision**: 
1. 先验证 design-system 组件可用
2. 新页面完全使用新组件
3. 旧页面逐个替换，发现问题及时修复

**Alternatives**: 
- 全部重写后再测试 → 风险高
- 保留旧组件作为 fallback → 增加复杂度

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| design-system 组件不完善 | 先检查组件完整性，必要时补充 |
| 重构过程中功能丢失 | 保持后端 API 不变，逐页面验证 |
| 工作量大导致半途而废 | 分阶段执行，每个阶段可交付 |
| 样式不一致问题残留 | 使用统一的 CSS 变量和组件 |
