## Context

SecuClaw 是一个基于 20 年以上顶级安全专家经验的 AI 安全工程产品。当前 UI 未能体现 8 个安全角色的创新性产品价值，业务功能分布不合理。本设计基于用户的明确选择：优先实现「多角色协作 War Room」，基于 RACI.md 设计角色自动化工作流和 AI 自动触发机制，重新规划产品（非基于现有 change 迭代）。

### Tech Stack
- **Backend**: packages/core (Node.js + TypeScript + tSOA + WebSocket Gateway)
- **Frontend**: ui/ (Lit Web Components + TypeScript + Vite)
- **AI/Skills**: packages/core/src/ai/ (已存在协作引擎和技能执行框架)
- **RACI**: packages/core/src/raci/ (已存在 RACI 类型和会话管理)

### Key Existing Files
- Backend: `packages/core/src/ai/ai-collaboration-engine.ts`, `packages/core/src/skills/executor.ts`, `packages/core/src/raci/session-manager.ts`
- Frontend: `ui/src/ui/pages/sc-war-room-page.ts`, `ui/src/ui/store/raci-store.ts`, `ui/src/ui/layout/sc-layout.ts`

## Goals / Non-Goals

**Goals:**
- 实现基于 RACI 矩阵的多角色 War Room 协作中心
- 为 8 个安全角色提供基于 RACI.md 的预设自动化工作流
- 实现基于 RACI.md 的 AI 自动触发机制
- 提供 8 个角色的沉浸式身份体验
- 建立 RACI 矩阵技能库

**Non-Goals:**
- 不实现角色视角切换功能（优先级低于 War Room）
- 不在现有 `security-role-centered-ui-redesign` 基础上迭代
- 不将角色简单实现为独立聊天智能体
- 不简化 RACI 矩阵的角色责任定义

## Decisions

### 1. War Room Architecture: Frontend + Backend RACI Integration
**Decision**: 扩展现有 `sc-war-room-page.ts` 和 `ai-collaboration-engine.ts`，深度整合 RACI 矩阵。
**Rationale**: 后端已有 `AICollaborationEngine` 和 RACI 会话管理，前端已有 War Room 页面基础，避免从零开始。
**Alternatives Considered**: 完全重写 War Room → 风险高、工期长；复用现有组件更高效。

### 2. Frontend State Management: Extend raci-store.ts
**Decision**: 扩展 `ui/src/ui/store/raci-store.ts`，管理 RACI 会话、角色状态、协作阶段和工作流执行。
**Rationale**: 现有 raci-store.ts 已管理部分 War Room 状态，扩展可保持一致性。
**Alternatives Considered**: 创建新 store → 增加状态管理复杂度；扩展现有 store 更合理。

### 3. Skill Execution: Use Existing SkillExecutor
**Decision**: 复用 `packages/core/src/skills/executor.ts`，增加 RACI 权限验证和角色特定技能路由。
**Rationale**: 技能执行引擎已存在，只需添加 RACI 相关逻辑。
**Alternatives Considered**: 重写技能执行器 → 浪费现有投资；复用更高效。

### 4. AI Trigger: Integrate with EventBus
**Decision**: AI 触发机制基于 packages/core/src/events/EventBus，监听安全事件并根据 RACI.md 自动触发工作流。
**Rationale**: 现有 EventBus 已广播各类安全事件，便于集成。
**Alternatives Considered**: 轮询事件 → 效率低；基于事件驱动更实时。

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 现有技能执行器为 Mock 实现，无法真实执行 | 分阶段实现：先集成 Mock 验证流程，再逐步替换为真实工具集成 |
| AI 触发机制可能误触发 | 配置触发阈值和人工确认环节，支持开关控制 |
| War Room 前端复杂度高 | 分解为小组件（角色面板、时间线、聊天、工作流控制），并行开发 |
| 废弃现有 change 的 43 个未完成任务 | 明确记录废弃原因，与用户确认后归档现有 change |

## Migration Plan

1. **归档现有 change**: 将 `openspec/changes/security-role-centered-ui-redesign/` 移动到 `openspec/changes/archive/`
2. **后端优先**: 先增强后端 RACI 集成、技能执行和 AI 触发
3. **前端并行**: 后端 API 稳定后，并行开发前端 War Room 组件
4. **增量验证**: 每个功能模块完成后立即验证，避免大规模集成问题
5. **回滚策略**: 保留主分支稳定状态，通过 feature branch 开发，随时可回滚

## Open Questions (已解决)

1. **RACI.md 具体内容**: ✅ 已解决
   - 项目中虽无 RACI.md 文件，但 `packages/core/src/raci/types.ts` 已定义 `RACI_SCENARIO_MAP`
   - 包含 5 个标准场景：incident-response、vulnerability-management、threat-hunting、compliance-audit、security-assessment
   - 每个场景都为 8 个安全角色定义了完整的 RACI 分配（R/A/C/I）
   
2. **真实技能集成优先级**: ✅ 已解决
   - 项目根目录 `skills/` 已有 60+ 安全工具技能（Nuclei、Semgrep、Nmap、Metasploit、Wireshark 等）
   - 优先级建议：先集成漏洞扫描类（Nuclei、OpenVAS）、日志分析类（Splunk、Elastic）、渗透测试类（Metasploit、Nmap）
   
3. **AI 模型路由策略**: ✅ 已解决
   - AI 模型路由已在 `packages/core/src/ai/ai-model-router.ts` 中实现
   - `DEFAULT_CONFIG` 已定义：
     - R 类型（执行）：GLM-5-Turbo
     - A 类型（负责）：GLM-5-Turbo
     - C 类型（咨询）：doubao-seed-2.0-pro
     - I 类型（通知）：doubao-seed-2.0-lite
     - Commander：GLM-5-Turbo
   - 支持通过 JsonStore 持久化和自定义配置
