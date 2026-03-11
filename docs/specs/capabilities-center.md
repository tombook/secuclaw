# Capabilities Center 详细设计规范（V2）

## 1. 文档信息

- 文档名称: Capabilities Center 详细设计规范（V2）
- 目标系统: SecuClaw
- 更新时间: 2026-03-09
- 适用范围: 6 大能力域工作台、任务闭环、审批与证据体系、工具连接层
- 设计定位: 可直接交给 AI/工程团队执行的实施级设计

---

## 2. 设计输入与约束

### 2.1 设计输入

本设计基于以下输入整理：

1. 6 大能力域目标定义（光明面、黑暗面、安全技术、法律合规、技术架构、业务运营）
2. 8 个安全角色技能模型（skills/*.md）
3. 现有系统已实现模块：
   - 系统设置（/settings）
   - LLM 服务配置（/settings/llm-config）
   - AI 安全专家（/ai-experts）
   - AI 专家配置（/settings/ai-experts-config）
4. 当前 capabilities 基础实现：
   - 后端: `packages/core/src/capabilities/{types,repository,service}.ts`
   - 网关: `capabilities.*` methods 已注册
   - 前端: `/capabilities`、`sc-capabilities-page.ts`、`sc-domain-board.ts`

### 2.2 关键约束

1. 不重复建设配置链路：LLM Provider 仍以 `llm.providers.*` 为唯一来源。
2. 不绕过审批链路：黑暗面执行必须后端强校验审批。
3. 与现有 AI 专家/设置模块兼容演进，不做平行系统。
4. 先保证 P0 发现-处置-闭环跑通，再扩展 P1/P2。

---

## 3. 当前基线与核心差距

### 3.1 已实现基线（As-Is）

1. 能力域、能力项、任务、执行、审批、证据的基础数据类型与 JSON 存储已具备。
2. `capabilities.*` 方法已可用于列表、创建任务、状态更新、执行、审批与证据查询。
3. 能力中心前端页面已可展示域、KPI、能力项与任务列表。
4. 系统设置已具备主题/语言切换和 LLM Provider 管理。
5. AI 安全专家已具备 8 角色技能展示与聊天能力。

### 3.2 关键不足（需在 V2 补齐）

1. 指标体系缺阈值与公式，验收不可量化。
2. 统一事件模型不足，工具接入后容易数据割裂。
3. 权限矩阵和职责分离不完整，尤其黑暗面执行风控不足。
4. 连接器契约不完整，缺标准输入输出、重试和超时策略。
5. 任务状态机较弱，缺复核、回退、SLA 违规管理。
6. AI 专家配置未形成权威持久化绑定，聊天未优先按角色绑定选模型。

---

## 4. V2 总体目标

### 4.1 业务目标

1. 打通 6 大能力域“发现-处置-验证-闭环-审计”全链路。
2. 建立面向管理层与执行层双视角的统一安全运营工作台。
3. 实现高风险动作（黑暗面）可控、可审、可追溯。

### 4.2 技术目标

1. 形成统一数据模型和事件模型。
2. 形成可扩展连接器标准。
3. 形成统一指标体系（KPI/SLA/质量）并可自动计算。
4. 形成跨模块协同（Settings、AI Experts、Capabilities）一致性链路。

---

## 5. 6 大能力域详细方案

### 5.1 统一字段定义

每个能力域统一定义以下字段：

1. `UI 展示`: 看板和核心视图
2. `能力与工具`: 可执行动作和工具类型
3. `主责角色`: Owner
4. `协作角色`: Partner
5. `核心 KPI`: 至少 4 个
6. `P0 任务模板`: 直接可执行任务模板

### 5.2 能力域详细矩阵

| 能力域 | UI 展示（工作台） | 能力与工具 | 主责角色 | 协作角色 | 核心 KPI（示例阈值） | P0 任务模板 |
|---|---|---|---|---|---|---|
| 光明面 | 安全健康分、基线合规率、漏洞闭环趋势、事件处置看板 | CIS/云/容器/终端基线检测、漏洞扫描与修复编排、告警降噪与响应 Runbook、配置漂移检测 | security-expert、security-ops、security-architect | ciso | 基线合规率 >= 95%、漏洞闭环率 >= 90%、P1 事件 MTTR <= 4h、误报率 <= 15% | 基线扫描 -> 自动建单 -> 修复验证 -> 复核关闭 |
| 黑暗面 | 攻击面图谱、攻击路径热力图、红蓝演练结果、紫队覆盖率 | 渗透测试、攻击路径验证、红蓝对抗、业务逻辑攻击模拟、供应链攻击模拟（全程授权审计） | security-expert、security-ops、security-architect、supply-chain-security | secuclaw-commander | 授权覆盖率 = 100%、越权执行 = 0、关键链路验证覆盖 >= 85%、演练复盘完成率 = 100% | 提交授权 -> 范围校验 -> 自动化验证 -> 证据归档 -> 检测规则回灌 |
| 安全技术 | SOC 态势总览、资产暴露面、检测规则效果、MITRE 覆盖度 | SIEM/EDR/SOAR 联动、威胁狩猎、日志与取证分析、身份访问控制、数据保护加密 | security-ops | security-expert、security-architect | 告警有效率 >= 70%、MTTD <= 15m、规则命中质量分 >= 80、MITRE 关键战术覆盖 >= 80% | 规则评估 -> 自动联动处置 -> 复盘调优 |
| 法律合规 | 法规义务清单、差距矩阵、审计证据库、整改进度 | GDPR/CCPA/PIPL 映射、DPIA/PIA、跨境与同意管理、合同安全条款检查、监管应对台账 | privacy-officer、ciso、supply-chain-security | secuclaw-commander | 高风险条款闭环率 >= 95%、审计一次通过率 >= 90%、证据完备率 = 100%、法规更新滞后 <= 5 工作日 | 数据流梳理 -> 差距分析 -> 整改任务 -> 证据包导出 |
| 技术架构 | 架构风险图、零信任成熟度、关键控制点状态、技术债风险 | 架构评审引擎、信任边界分析、分区分域验证、DevSecOps 门禁、灾备弹性验证 | security-architect | ciso、secuclaw-commander | 高风险架构缺陷关闭率 >= 90%、门禁拦截有效率 >= 95%、RTO/RPO 达标率 >= 95%、技术债风险下降趋势 > 0 | 架构审查 -> 控制点验证 -> 门禁策略落地 |
| 业务运营 | 风险货币化、业务影响热图、预算 ROI、供应商风险排名 | BIA/RTO/RPO 建模、ALE 风险量化、安全投资优先级、供应链分级治理、高层简报生成 | business-security-officer | ciso、supply-chain-security、secuclaw-commander | 高风险业务流程覆盖 >= 95%、ALE 量化覆盖 >= 85%、安全 ROI 可解释率 = 100%、关键供应商复评达标率 >= 95% | 业务影响评估 -> 风险货币化 -> 投资建议 -> 管理层简报 |

---

## 6. 系统级能力架构（实施版）

### 6.1 四层架构

1. 角色能力编排层
   - 输入: 角色 ID、角色技能、角色绑定模型
   - 输出: 可执行能力项、可见数据范围、可用工具权限
2. 能力域工作台层
   - 域看板、任务面板、执行面板、证据面板、指标面板
3. 工具连接层
   - 扫描器/SIEM/EDR/工单/CMDB/合规系统连接器
4. 决策与证据层
   - MITRE+SCF 映射、审计留痕、监管/管理层报告

### 6.2 与现有模块集成规则

1. Settings 负责 Provider 与基础设置，不在 Capabilities 再做一套 Provider 配置。
2. AI Experts 负责角色能力解释与建议，Capabilities 负责执行编排与审计。
3. Commander 作为角色绑定与协同中枢，承担 role->provider/model 权威映射。

---

## 7. 指标体系（可量化验收）

### 7.1 全局北极星指标

1. 风险下降率: `((期初风险 - 期末风险) / 期初风险) * 100%`
2. 闭环率: `关闭任务数 / 新建任务数`
3. SLA 达成率: `SLA 内完成任务数 / 已完成任务数`
4. 审计通过率: `一次通过审计项 / 总审计项`

### 7.2 质量指标

1. 误报率
2. 漏报率（通过演练反证）
3. 证据完整率（必须 100%）
4. 违规执行次数（黑暗面必须为 0）

### 7.3 指标刷新策略

1. 执行类指标: 事件驱动实时刷新
2. 汇总类指标: 每 5 分钟聚合
3. 报告类指标: 日/周/月快照

---

## 8. 统一数据与事件模型

### 8.1 现有核心实体（保留）

1. `CapabilityDomain`
2. `CapabilityItem`
3. `SecurityTask`
4. `ExecutionRun`
5. `Approval`
6. `EvidencePack`

### 8.2 V2 增补实体（建议新增）

1. `AssetSnapshot`
   - 资产唯一 ID、业务归属、环境、关键性
2. `Finding`
   - 发现项（漏洞/配置偏差/合规差距）
3. `ControlCheck`
   - 控制项检查结果（通过/失败/豁免）
4. `PolicyVersion`
   - 法规/制度规则版本（地域、生效日期）
5. `AuditTrail`
   - 操作留痕（谁、何时、做了什么、影响对象）

### 8.3 统一事件模型

事件名建议统一为：

1. `task.created`
2. `task.assigned`
3. `task.status_changed`
4. `run.started`
5. `run.completed`
6. `approval.created`
7. `approval.approved`
8. `approval.rejected`
9. `evidence.created`
10. `kpi.updated`

---

## 9. 工作流与状态机

### 9.1 通用任务状态机

`todo -> in_progress -> done -> closed`

可插入状态:

1. `blocked`（阻塞）
2. `reopen`（由 closed 回退到 in_progress）

流转规则：

1. `done` 必须有验证结果。
2. `closed` 必须有复核人和复核结论。
3. `blocked` 必须有阻塞原因和预计恢复时间。

### 9.2 黑暗面执行状态机（强管控）

`task_created -> approval_pending -> approval_approved -> run_queued -> run_running -> run_finished -> evidence_archived -> detection_feedback`

硬性校验：

1. 无审批不可执行。
2. 审批过期不可执行。
3. 执行目标必须在审批范围白名单内。
4. 执行前后自动记录审计日志。

### 9.3 法律合规审计状态机

`obligation_identified -> gap_assessed -> remediation_planned -> remediation_done -> evidence_collected -> audit_ready -> audit_closed`

---

## 10. 权限与职责分离（RBAC + SoD）

### 10.1 角色动作矩阵（摘要）

| 动作 | 执行角色 | 审批角色 | 复核角色 |
|---|---|---|---|
| 光明面任务执行 | security-expert/security-ops | 无 | security-architect/ciso |
| 黑暗面任务执行 | security-expert/security-ops/security-architect | secuclaw-commander（或授权审批人） | ciso/commander |
| 合规整改关闭 | privacy-officer/supply-chain-security | ciso | commander |
| 架构门禁策略发布 | security-architect | ciso | commander |

### 10.2 必须满足的 SoD 规则

1. 黑暗面同一任务中，请求人与审批人不能是同一账号。
2. 执行人与复核人不能是同一账号。
3. 证据包导出需要至少一名审批角色授权。

---

## 11. 工具连接层契约（Connector Contract）

### 11.1 连接器注册模型

```ts
interface ToolConnector {
  id: string;
  name: string;
  category: 'scanner' | 'siem' | 'edr' | 'soar' | 'cmdb' | 'ticket' | 'compliance';
  version: string;
  timeoutMs: number;
  retryPolicy: { maxRetries: number; backoffMs: number };
  supportsDomain: DomainId[];
}
```

### 11.2 执行请求与响应模型

```ts
interface ConnectorExecuteRequest {
  runId: string;
  taskId: string;
  domainId: DomainId;
  toolId: string;
  params: Record<string, unknown>;
  context: { requester: string; approvalId?: string };
}

interface ConnectorExecuteResponse {
  status: 'success' | 'failed' | 'partial';
  summary: string;
  findings?: Array<{ id: string; severity: string; title: string }>;
  artifacts?: string[];
  raw?: Record<string, unknown>;
}
```

### 11.3 错误码约定

1. `TOOL_UNAVAILABLE`
2. `TOOL_TIMEOUT`
3. `TOOL_AUTH_FAILED`
4. `INVALID_TARGET_SCOPE`
5. `APPROVAL_REQUIRED`
6. `APPROVAL_EXPIRED`

---

## 12. API 详细设计

### 12.1 Capabilities API（已实现+扩展）

1. `capabilities.domains.list`
2. `capabilities.items.list`
3. `capabilities.tasks.list`
4. `capabilities.tasks.create`
5. `capabilities.tasks.updateStatus`
6. `capabilities.approvals.create`
7. `capabilities.approvals.approve`
8. `capabilities.runs.execute`
9. `capabilities.runs.listByTask`
10. `capabilities.evidence.create`
11. `capabilities.evidence.list`
12. `capabilities.overview.metrics`

### 12.2 与现有 API 的协同

1. Provider 来源: `llm.providers.*`
2. 角色绑定权威源: `commander.bindLLM`（需前端配置页接入持久化）
3. 技能来源: `skills.list/get`

### 12.3 黑暗面后端校验伪代码

```ts
async function executeRun(params) {
  const task = await getTask(params.taskId);
  if (!task) throw { code: 'TASK_NOT_FOUND' };

  if (task.domainId === 'dark') {
    const approval = await getValidApproval(task.id);
    if (!approval) throw { code: 'APPROVAL_REQUIRED' };
    if (Date.now() > approval.expiresAt) throw { code: 'APPROVAL_EXPIRED' };
    if (!isTargetInScope(params.params, approval.scope)) throw { code: 'INVALID_TARGET_SCOPE' };
  }

  return runConnector(params);
}
```

---

## 13. UI/工作台详细设计

### 13.1 信息架构

1. `/capabilities` 顶层能力中心
2. 6 个域 Tab
3. 每域统一包含：
   - KPI 条
   - 能力项网格
   - 任务看板
   - 执行日志
   - 证据列表

### 13.2 页面组件（现有 + 待补）

已存在：

1. `ui/src/ui/pages/capabilities/sc-capabilities-page.ts`
2. `ui/src/ui/pages/capabilities/sc-domain-board.ts`
3. `ui/src/ui/capabilities-client.ts`

待补（V2 必做）：

1. `sc-task-panel.ts`（任务状态机可视化）
2. `sc-run-log-panel.ts`（执行明细和错误回放）
3. `sc-evidence-panel.ts`（证据包与哈希校验）
4. `sc-approval-dialog.ts`（黑暗面审批流程）
5. `sc-kpi-explain-drawer.ts`（指标公式与数据来源解释）

### 13.3 交互硬规则

1. 黑暗面“执行”按钮在无审批时必须弹审批流程，不得直接执行。
2. `done -> closed` 必须要求复核意见。
3. 证据导出前必须校验证据完整性（文件+哈希）。

---

## 14. 非功能设计

### 14.1 性能

1. 列表查询默认分页。
2. 指标查询与列表查询分离，避免页面首屏阻塞。
3. 大列表用增量加载。

### 14.2 可观测性

1. 网关日志: 请求 ID、method、耗时、错误码。
2. 执行日志: runId 全链路关联。
3. 审计日志: 审批、执行、导出、状态流转全量留痕。

### 14.3 安全

1. 敏感参数脱敏存储（如 token、密钥）。
2. 审批与执行日志不可删除，仅可追加。
3. 导出行为记录操作者和时间。

---

## 15. 分阶段实施计划（P0/P1/P2）

### 15.1 P0（光明面 + 安全技术）

目标: 跑通发现-处置-闭环。

交付：

1. 任务状态机与 SLA 统计可用。
2. 光明面与安全技术域可创建任务并闭环。
3. 规则联动与执行记录可追踪。

验收：

1. 闭环率与 SLA 指标可自动计算。
2. 任务从发现到关闭全链路可追溯。

### 15.2 P1（法律合规 + 技术架构）

目标: 补齐治理与设计能力。

交付：

1. 法规差距矩阵与证据包链路。
2. 架构评审与控制点验证任务链路。

验收：

1. 审计证据完备率 100%。
2. 架构高风险项可量化下降。

### 15.3 P2（黑暗面 + 业务运营）

目标: 构建攻防验证与经营决策闭环。

交付：

1. 黑暗面审批+执行+证据+回灌闭环。
2. 风险货币化与管理层简报自动输出。

验收：

1. 黑暗面越权执行为 0。
2. 风险货币化报表可复算、可审计。

---

## 16. 验收清单（DoD）

### 16.1 功能验收

1. 6 大域均可访问与查询。
2. 每域至少 4 项 KPI 可见且可解释。
3. 任务可创建、流转、复核、关闭。
4. 黑暗面无审批不可执行（后端强校验）。
5. 执行结果可形成证据包并可追溯。

### 16.2 工程验收

1. API 错误码统一且前端有明确提示。
2. 单元测试覆盖核心状态机与审批逻辑。
3. 关键流程有集成测试（任务、审批、执行、证据）。
4. 文档与实现一致，接口样例可运行。

### 16.3 集成验收

1. AI Experts Config 绑定持久化并可刷新恢复。
2. AI Experts Chat 按角色绑定优先选 provider/model。
3. capabilities 与 settings/ai-experts 数据链路一致。

---

## 17. 风险与缓解

1. 连接器能力差异大
   - 缓解: 统一 connector contract + 适配层
2. 黑暗面流程被绕过
   - 缓解: 后端强校验 + 审计不可变日志
3. 指标失真
   - 缓解: 指标公式固定化 + 数据来源可追踪
4. 模块割裂
   - 缓解: 强制复用 settings/ai-experts/commander 现有链路

---

## 18. 立即执行任务（建议）

1. 完成 Sprint 0 对齐：
   - `sc-ai-experts-config.ts` 接入 `commander.bindLLM` 持久化
   - `sc-ai-experts-page.ts` 聊天按角色绑定优先选模型
2. 在 `sc-domain-board.ts` 增加：
   - 任务复核流程
   - 黑暗面审批弹窗
   - 执行日志与证据面板入口
3. 在 `service.ts` 增强：
   - 目标范围校验
   - 状态机合法流转校验
   - 审批与执行审计事件输出

---

## 19. 相关文件（当前实现）

后端:

1. `packages/core/src/capabilities/types.ts`
2. `packages/core/src/capabilities/repository.ts`
3. `packages/core/src/capabilities/service.ts`
4. `packages/core/src/gateway/router.ts`

前端:

1. `ui/src/ui/capabilities-client.ts`
2. `ui/src/ui/pages/capabilities/sc-capabilities-page.ts`
3. `ui/src/ui/pages/capabilities/sc-domain-board.ts`
4. `ui/src/ui/pages/sc-ai-experts-page.ts`
5. `ui/src/ui/pages/settings/sc-ai-experts-config.ts`
6. `ui/src/ui/pages/settings/sc-llm-service-config.ts`

存储:

1. `packages/core/data/storage/capability-domains.json`
2. `packages/core/data/storage/capability-items.json`
3. `packages/core/data/storage/capability-tasks.json`
4. `packages/core/data/storage/execution-runs.json`
5. `packages/core/data/storage/approvals.json`
6. `packages/core/data/storage/evidence-packs.json`
7. `packages/core/data/storage/llm-providers.json`

