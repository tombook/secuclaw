## Context

### 当前状态

SecuClaw UI 采用传统的功能分类菜单结构：

```
├── 运营 (运营)
│   ├── 概览 (Dashboard)
│   ├── 威胁 (Threats)
│   ├── 事件 (Incidents)
│   ├── 漏洞 (Vulnerabilities)
│   └── 资产 (Assets)
├── 作战 (作战)
│   ├── 作战室 (War Room)
│   └── 安全工具 (Security Ops)
├── 治理 (Governance)
│   ├── 合规 (Compliance)
│   ├── 审计 (Audit)
│   ├── 审批 (Approval)
│   └── 风险中心 (Risk Center)
├── AI
│   ├── AI Experts ← 8个安全角色被降级至此
│   └── 配置
└── ...
```

**8 个安全角色** (AI Experts)：
1. **security-expert** (🛡️) - 漏洞管理
2. **privacy-officer** (🔐) - 隐私合规
3. **security-architect** (🏗️) - 安全架构
4. **business-security-officer** (📊) - 业务连续性
5. **secuclaw-commander** (🎯) - 全域指挥
6. **ciso** (👔) - 安全战略
7. **security-ops** (⚙️) - SOC 运营
8. **supply-chain-security** (🔗) - 供应链安全

每个角色拥有 6 个技能维度：
- Light Side (防御技能)
- Dark Side (攻击技能)
- Security (安全技术)
- Legal (法律合规)
- Technology (技术能力)
- Business (业务能力)

以及覆盖范围：
- MITRE ATT&CK 战术覆盖
- SCF (Security Control Framework) 控制覆盖

### 问题

1. **角色被降级** - 核心产品价值被埋在子菜单中
2. **技能不可见** - 用户看不到每个角色的专业深度
3. **缺乏身份感** - 切换角色没有"成为那个专家"的体验
4. **数据无视角** - 同一威胁/事件，不同角色应有不同分析视角

## Goals / Non-Goals

**Goals:**
- 将 8 个安全角色重新定位为产品核心导航范式
- 提供角色适配型仪表盘，同一数据不同角色有不同视图
- 打造"与安全专家协作"的沉浸式体验
- 可视化展示每个角色的专业能力和覆盖范围

**Non-Goals:**
- 不改变后端 API 或数据模型
- 不改变 8 个角色的权限体系（已在 permissions.ts 定义）
- 不改变现有的 Skill/Capability 执行机制
- 不移除任何现有功能页面

## Decisions

### Decision 1: 角色中心化布局 vs 混合布局

**选择**: 角色中心化布局

**理由**:
- 混合布局（角色+功能并存）会让导航复杂化
- 产品核心价值需要最大化体现
- 角色中心化是差异化竞争优势

**替代方案考虑**:
- 混合布局：左侧角色选择 + 右侧功能菜单 → 复杂，不够聚焦
- 标签式：顶部切换角色/功能 → 切换成本高

### Decision 2: 仪表盘适配策略

**选择**: 单一仪表盘 + 角色 Context + 动态内容

**理由**:
- 用户无需在多个仪表盘间跳转
- 通过 Context 传递当前角色，组件自适应
- 降低开发成本和维护复杂度

**实现方式**:
```typescript
// 角色 Context 注入
roleContext.getState().currentRole // 'security-expert' | 'ciso' | ...

// Dashboard 组件根据角色渲染不同内容
const roleConfig = ROLE_DASHBOARD_CONFIG[currentRole];
const primaryKpis = roleConfig?.primaryKpis || [];
```

### Decision 3: 菜单重构策略

**选择**: 功能菜单按角色专业领域重组

**新菜单结构**:
```
SecuClaw
├── 🛡️ 安全专家 (当前角色指示器 + 快捷切换)
├── ─────────────
├── 📊 我的仪表盘 (Role-Adaptive Dashboard)
├── ─────────────
├── 🔍 威胁分析
│   ├── 威胁列表 (Security Expert View)
│   ├── 威胁情报 (Threat Intel)
│   └── 攻击路径 (Security Architect View)
├── 🚨 事件响应
│   ├── 事件列表
│   ├── 作战室 (War Room)
│   └── 溯源分析 (Forensics)
├── 🐛 漏洞管理
│   ├── 漏洞列表
│   └── 修复优先级 (根据角色动态)
├── ✅ 合规治理
│   ├── 合规状态
│   ├── 审计追踪
│   └── DPIA (Privacy Officer View)
├── 🔗 供应链安全 (Supply Chain View)
├── 📈 风险管理
│   ├── 风险矩阵 (Business Security Officer View)
│   └── 业务影响 (Impact Analysis)
├── 🛠️ 安全工具 (Security Ops Tools)
├── 📚 知识库
├── ⚙️ 能力中心 (Capabilities/Skills Market)
└── ⚙️ 管理
    ├── 设置
    ├── 角色管理
    └── LLM 配置
```

### Decision 4: 角色切换器设计

**选择**: 顶部固定角色指示器 + 下拉选择面板

**理由**:
- 位置固定，切换成本最低
- 展示当前角色身份，增强身份感
- 下拉面板展示所有 8 个角色卡片，带图标和简介

**UI 规范**:
```
┌─────────────────────────────────────────────────────────────┐
│ [🛡️ Security Expert ▼]  │  Search...  │  🔔  │  👤  │
└─────────────────────────────────────────────────────────────┘
```

下拉面板：
```
┌─────────────────────────────────────────┐
│  选择你的安全专家身份                     │
├─────────────────────────────────────────┤
│  🛡️ Security Expert        [当前]       │
│     漏洞管理与威胁检测                    │
├─────────────────────────────────────────┤
│  🔐 Privacy Officer                     │
│     隐私合规与数据保护                    │
├─────────────────────────────────────────┤
│  🏗️ Security Architect                 │
│     安全架构与零信任                     │
├─────────────────────────────────────────┤
│  📊 Business Security Officer           │
│     业务连续性与风险管理                  │
├─────────────────────────────────────────┤
│  🎯 Secuclaw Commander                  │
│     全域安全指挥与协调                   │
├─────────────────────────────────────────┤
│  👔 CISO                                │
│     安全战略与治理                       │
├─────────────────────────────────────────┤
│  ⚙️ Security Ops                        │
│     SOC 运营与事件响应                   │
├─────────────────────────────────────────┤
│  🔗 Supply Chain Security                │
│     第三方风险管理                       │
└─────────────────────────────────────────┘
```

### Decision 5: 技能可视化方案

**选择**: 雷达图 + 覆盖标签云

**理由**:
- 雷达图直观展示 6 维技能平衡
- 标签云展示 MITRE/SCF 覆盖范围
- 与现有 AI Experts 页面设计语言一致

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 菜单重构影响现有用户习惯 | 提供旧版菜单选项（Legacy Mode）过渡 |
| 角色切换增加认知负担 | 角色切换器设计简洁，一键切换 |
| 仪表盘动态内容增加开发复杂度 | 复用现有组件，通过 roleContext 传递角色 |
| 移动端适配困难 | 采用响应式设计，移动端简化菜单 |

## Migration Plan

### Phase 1: 角色切换器 (Week 1)
1. 在现有布局顶部添加角色指示器
2. 实现下拉选择面板
3. 集成 roleContext

### Phase 2: 菜单重构 (Week 2)
1. 创建新菜单配置 `role-centric-menu-config.ts`
2. 实现菜单组件 `RoleCentricNav`
3. 添加旧版菜单兼容模式

### Phase 3: 仪表盘适配 (Week 3)
1. 创建 `RoleAdaptiveDashboard` 组件
2. 定义各角色 `ROLE_DASHBOARD_CONFIG`
3. 迁移现有 dashboard 逻辑

### Phase 4: 技能可视化 (Week 4)
1. 创建 `ExpertiseRadarChart` 组件
2. 创建 `CoverageTags` 组件
3. 升级 AI Experts 页面

### Rollback
- 通过 Feature Flag 控制新/旧 UI
- 出现问题可快速切换回旧版

## Open Questions

1. **角色权限 vs 角色视角**: 是否允许用户查看无权限角色的专业内容（仅展示，不操作）？
2. **默认角色**: 新用户首次登录应选择哪个角色作为默认？
3. **多角色协作**: 未来是否支持同时激活多个角色身份？
