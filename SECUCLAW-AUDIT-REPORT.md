# SecuClaw 功能与实现审查报告

> 审查时间: 2026-03-31  
> 项目路径: `/Users/tombook/Documents/work/ai_openclaw/dev_work/secuclaw`  
> 审查范围: 功能矩阵、CRUD完整性、数据持久化、设计与实现差距

---

## 一、功能矩阵（设计 vs 实现）

### 1.1 前端页面实现状态

| 页面 | 设计文档 | 实现文件 | 实现状态 | 说明 |
|------|----------|----------|----------|------|
| 仪表盘 | ✅ | `sc-dashboard.ts` | ✅ 已实现 | |
| 登录页 | ✅ | `sc-login-page.ts` | ✅ 已实现 | |
| 威胁情报 | ✅ | `sc-threats-page.ts` | ✅ 已实现 | |
| 安全事件 | ✅ | `sc-incidents-page.ts` | ✅ 已实现 | |
| 漏洞管理 | ✅ | `sc-vulnerabilities-page.ts` | ✅ 已实现 | |
| 合规审计 | ✅ | `sc-compliance-page.ts` | ✅ 已实现 | |
| 分析报告 | ✅ | `sc-reports-page.ts` | ✅ 已实现 | |
| 安全风险 | ✅ | `sc-risk-page.ts` | ✅ 已实现 | |
| 作战室 | ✅ | `sc-war-room-page.ts` | ✅ 已实现 | |
| AI专家 | ✅ | `sc-ai-experts-page.ts` | ✅ 已实现 | |
| 知识库 | ✅ | `sc-knowledge-base.ts` | ✅ 已实现 | |
| 技能市场 | ✅ | `sc-skills-market.ts` | ✅ 已实现 | |
| 频道管理 | ✅ | `sc-channels-page.ts` | ✅ 已实现 | |
| 安全运营中心 | ✅ | `sc-secops-center.ts` | ✅ 已实现 | |
| 能力中心 | ✅ | `sc-capabilities-page.ts` | ✅ 已实现 | |
| 渗透测试 | ✅ | `sc-pentest-page.ts` | ✅ 已实现 | |
| 威胁狩猎 | ✅ | `sc-threathunt-page.ts` | ✅ 已实现 | |
| 基线管理 | ✅ | `sc-baseline-page.ts` | ✅ 已实现 | |
| 漏洞扫描 | ✅ | `sc-vulnscan-page.ts` | ✅ 已实现 | |
| 数据中心 | ✅ | `sc-datacenter-page.ts` | ✅ 已实现 | |
| 报告Pro | ✅ | `sc-reports-pro.ts` | ✅ 已实现 | |
| 风险中心 | ✅ | `sc-risk-center.ts` | ✅ 已实现 | |
| 任务页 | ✅ | `sc-tasks-page.ts` | ✅ 已实现 | |
| 审计页 | ✅ | `sc-audit-page.ts` | ✅ 已实现 | |
| 审批页 | ✅ | `sc-approval-page.ts` | ✅ 已实现 | |
| 资产页 | ✅ | `sc-assets-page.ts` | ✅ 已实现 | |
| LLM配置 | ✅ | `settings/sc-llm-service-config.ts` | ✅ 已实现 | |
| AI专家配置 | ✅ | `settings/sc-ai-experts-config.ts` | ✅ 已实现 | |
| 角色管理 | ✅ | `settings/sc-roles-page.ts` | ✅ 已实现 | |

**前端页面：29个页面全部实现 ✅**

### 1.2 核心组件实现状态

| 组件 | 实现文件 | 状态 |
|------|----------|------|
| 布局容器 | `layout/sc-layout.ts` | ✅ |
| 侧边栏 | `layout/sc-sidebar.ts` | ✅ |
| 顶部栏 | `layout/sc-header.ts` | ✅ |
| 角色卡片 | `components/sc-skill-panel.ts` | ✅ |
| MITRE热力图 | `components/sc-mitre-heatmap.ts` | ✅ |
| SCF仪表盘 | `components/sc-scf-dashboard.ts` | ✅ |
| 渠道卡片 | (内嵌) | ✅ |
| AI助手 | `components/sc-ai-assistant.ts` | ✅ |
| AI对话 | `components/sc-ai-chat.ts` | ✅ |
| AI洞察 | `components/sc-ai-insights.ts` | ✅ |
| 数据表格 | `components/sc-data-table.ts` | ✅ |
| 看板 | `components/sc-kanban-board.ts` | ✅ |
| 指标卡片 | `components/sc-metric-card.ts` | ✅ |
| 趋势图 | `components/sc-trend-chart.ts` | ✅ |
| 智能卡片 | `components/sc-smart-card.ts` | ✅ |
| 血缘图 | `components/sc-lineage-graph.ts` | ✅ |

### 1.3 后端模块实现状态

| 模块 | 目录 | 方法数 | 状态 |
|------|------|--------|------|
| 认证 | `auth/` | 4 | ✅ |
| 技能 | `skills/` | 2 | ✅ |
| 知识库-MITRE | `knowledge/mitre/` | 4 | ✅ |
| 知识库-SCF | `knowledge/scf/` | 4 | ✅ |
| 指挥官 | `commander/` | 6 | ✅ |
| LLM | `llm/` | 6 | ✅ |
| AI分析 | `ai/` | 9 | ✅ |
| 资产 | `assets/` | 12 | ✅ |
| 审计 | `audit/` | 5 | ✅ |
| 角色CRUD | `roles/` | 15 | ✅ |
| 频道 | `channels/` | 3 | ✅ |
| 事件CRUD | `incidents/` | 12 | ✅ |
| 漏洞CRUD | `vulnerabilities/` | 16 | ✅ |
| 威胁 | `threats/` | 4 | ⚠️ 只读 |
| 合规 | `compliance/` | 3 | ⚠️ 只读 |
| 任务CRUD | `tasks/` | 7 | ✅ |
| 工具 | `tools/` | 6 | ✅ |
| 风险 | `risk/` | 9 | ✅ |
| 报告 | `reports/` | 5 | ✅ |
| 审批 | `approval/` | 6 | ✅ |
| 剧本 | `playbook/` | 10 | ✅ |
| 能力中心 | `capabilities/` | 14 | ⚠️ 只读 Domains/Items |
| KPI | `kpi/` | 1 | ✅ |

**实际实现: ~162 个 WebSocket API 方法**（设计文档声称77个，实际实现数量远超设计文档）

### 1.4 设计与实现差距总结

| 功能模块 | 设计状态 | 实现状态 | 差距说明 |
|----------|----------|----------|----------|
| 威胁情报 | 完整 | 部分 | 缺少 Create/Update/Delete，只有只读 CRUD |
| 合规管理 | 完整 | 部分 | 缺少 Create/Update/Delete，只有只读 CRUD |
| 资产管理 | 完整 | 部分 | 缺少 Update/Delete；Create 在后端有但前端未集成 |
| 能力中心-Domains | 完整 | 部分 | 只读，无 Create/Update/Delete |
| 能力中心-Items | 完整 | 部分 | 只读，无 Create/Update/Delete |
| 技能市场 | 完整 | 部分 | 只读，无安装/激活/卸载流程 |
| 频道管理 | 完整 | 部分 | 缺少禁用/启用频道的 API |
| 剧本管理 | 完整 | ✅ | Playbook CRUD 完整 |
| 审批流程 | 完整 | ✅ | Approval CRUD 完整 |

---

## 二、CRUD完整性

### 2.1 数据实体 CRUD 矩阵

| 数据实体 | Create | Read | Update | Delete | 备注 |
|----------|--------|-------|--------|--------|------|
| 安全事件 (Incidents) | ✅ | ✅ | ✅ | ✅ | 状态机完整，支持枚举 |
| 漏洞 (Vulnerabilities) | ✅ | ✅ | ✅ | ✅ | 包含批量导入、资产关联 |
| 威胁 (Threats) | ❌ | ✅ | ❌ | ❌ | 只读（list/get/stats/search） |
| 合规 (Compliance) | ❌ | ✅ | ❌ | ❌ | 只读（list/get/stats） |
| 资产 (Assets) | ✅* | ✅ | ✅* | ❌ | Create/Update 在后端存在但前端未集成 |
| 任务 (Tasks) | ✅ | ✅ | ✅ | ✅ | 完整的任务生命周期 |
| 剧本 (Playbooks) | ✅ | ✅ | ✅ | ✅ | 剧本 CRUD + 执行管理 |
| 审批 (Approvals) | ✅ | ✅ | ✅ | ❌ | 创建/审批通过/拒绝，无删除 |
| 证据 (Evidence) | ✅ | ✅ | ❌ | ❌ | 可创建/列表，缺更新/删除 |
| 技能 (Skills) | ❌ | ✅ | ❌ | ❌ | 只读（list/get） |
| 角色 (Roles) | ✅ | ✅ | ✅ | ✅ | 完整 CRUD |
| 指挥官 (Commander) | ✅ | ✅ | ✅ | ❌ | 创建/获取/更新，无删除 |
| LLM服务商 | ✅ | ✅ | ✅ | ✅ | 完整 CRUD |
| 频道配置 | ❌ | ✅ | ✅ | ❌ | 可配置/获取状态，无创建/删除 |
| AI洞察 | N/A | ✅ | N/A | N/A | 只读，AI生成 |
| 执行记录 (Runs) | N/A | ✅ | N/A | N/A | 通过 executeRun 创建，只读列表 |

> *注: Assets 的 Create/Update 在后端实现，但前端 (`sc-assets-page.ts`) 仅调用 list/get，未调用 create/update。

### 2.2 CRUD 问题详解

#### 问题 2.2.1: 威胁实体 CRUD 不完整
- **现状**: `threats.list/get/stats/search` 存在，但无 `threats.create/update/delete`
- **前端调用**: `dataService.getThreats()` → `gatewayClient.request('threats.list')`
- **后端实现**: `security-routes.ts` 仅暴露只读方法
- **影响**: 用户无法通过 UI 创建/编辑/删除威胁情报条目

#### 问题 2.2.2: 合规实体 CRUD 不完整
- **现状**: `compliance.list/get/stats` 存在，无 create/update/delete
- **影响**: 用户无法通过 UI 管理合规项

#### 问题 2.2.3: 资产实体前端未集成 Create/Update
- **现状**: 后端 `assets.create/assets.update` 存在，但前端 `sc-assets-page.ts` 仅调用 `assets.list/assets.get`
- **前端代码**:
```typescript
// sc-assets-page.ts - 只有读取操作
const assets = await dataService.getAssets({ pageSize: 100 });
const stats = await dataService.getAssetStats();
```
- **影响**: 资产增改只能通过后端 API 或数据库直接操作

---

## 三、数据持久化验证

### 3.1 WebSocket连接

**连接地址**: `ws://127.0.0.1:21981/ws`

**连接状态管理** (`gateway-client.ts`):
- 4种状态: `disconnected | connecting | connected | error`
- 连接成功回调: `ws.onopen` → `status='connected'` → `flushMessageQueue()` → `notifyConnectionHandlers(true)`
- 断开连接: `ws.onclose` → `status='disconnected'` → `scheduleReconnect()`

**重连机制**:
- 指数退避: `delay = 1000 * 2^(reconnectAttempts-1)`
- 最大重试: 10次
- 超过上限后不再重连

**消息队列**:
- 连接断开时，`request()` 消息进入 `messageQueue`
- 连接恢复时，`flushMessageQueue()` 重发队列消息
- **问题**: 队列仅在 `connected` 时 flush，若连接始终失败，队列消息会永久pending（无界）

**鉴权机制**:
- 支持 `?token=xxx` URL参数传递 JWT
- `setAuthToken()` 设置后自动附加到连接 URL

**健康检查**:
- `isConnected()`: 返回 `status === 'connected'`
- `waitForConnection(timeoutMs)`: 等待连接建立（默认10秒超时）

### 3.2 数据流验证

```
用户操作 → 前端Page → dataService/aiService → gatewayClient.request()
    ↓ (WebSocket)
gateway-server.ts (port 21981) → Router.handleRequest()
    ↓
Handler (各 route 文件) → Service → Repository → JsonStore
    ↓
本地 JSON 文件 (~/.secuclaw/data/storage/*.json)
```

**后端持久化**: JSON 文件存储（`storage/json-store.ts`）
- 路径: `./data/storage/`（可通过 `DATA_PATH` 环境变量配置）
- 每个数据实体对应一个 JSON 文件（`incidents.json`、`vulnerabilities.json` 等）
- 读取: `jsonStore.get(key)` → 解析 JSON
- 写入: `jsonStore.set(key, data)` → 序列化 JSON

**前端持久化**: 仅 localStorage 用于 UI 状态
- `secuclaw-theme`: 主题设置
- `secuclaw-locale`: 语言设置
- `secuclaw-sidebar-collapsed`: 侧边栏折叠状态
- **无 IndexedDB 使用**: 用户数据（事件/漏洞等）不存储在浏览器本地

### 3.3 数据流关键问题

#### 问题 3.3.1: 后端必须运行才能持久化
- 前端不直接操作数据库，所有写操作依赖后端 WebSocket 连接
- 若后端未启动，前端运行在"纯 Mock 模式"，写操作返回假数据但**不持久化**
- 示例:
```typescript
// data-service.ts createIncident fallback
async createIncident(data) {
  try {
    return await gatewayClient.request('incidents.create', data);
  } catch (error) {
    // ⚠️ 返回的是前端构造的临时对象，不写入后端
    return { id: `inc-${Date.now()}`, ticketId: ..., ... };
  }
}
```
- **影响**: 用户"创建"事件/漏洞后刷新页面，数据丢失

#### 问题 3.3.2: 前端 Mock 数据阻断真实持久化验证
- 所有 Service 方法都有 `catch` fallback 到 mock 数据
- 这使得开发阶段无需后端即可运行，但**掩盖了持久化是否真正工作**
- `app.ts` 连接失败时不阻止应用启动:
```typescript
try {
  await gatewayClient.connect();
} catch (e) {
  console.error('[sc-app] Failed to connect to gateway:', e);
  // 继续运行，应用使用 Mock 数据
}
```

#### 问题 3.3.3: gateway 连接失败不感知
- `gatewayClient.connect()` 在 `app.ts` 中调用但错误被 console.error 吞掉
- 前端无连接状态提示，用户不知道数据是否真的保存了
- 建议: UI 应显示 "离线模式" 或 "数据仅本地" 提示

#### 问题 3.3.4: 消息队列无界积累
- 若 WebSocket 始终 `connecting` 状态，`messageQueue` 会无限增长
- `gateway-client.ts` 中 `flushMessageQueue()` 在非 `OPEN` 状态时不发送
- 长连接不稳定场景（如移动网络）可能导致内存问题

---

## 四、设计与实现差距

### 4.1 高优先级差距

#### 【高-1】威胁/合规实体无写操作
- **描述**: `threats` 和 `compliance` 仅有只读 CRUD（Read-only），设计文档规划完整 CRUD
- **影响**: 用户无法创建/编辑/删除威胁和合规条目
- **修复建议**: 实现 `threats.create/update/delete` 和 `compliance.create/update/delete` 方法

#### 【高-2】数据持久化依赖后端运行
- **描述**: 前端所有写操作依赖后端 WebSocket，无后端时写操作不持久化
- **影响**: 用户在本地开发时"创建"的事件/漏洞等，刷新后消失
- **修复建议**:
  1. 增加前端 localStorage 缓存（离线支持）
  2. 后端未连接时显示明确状态提示
  3. 实现"离线队列 + 同步"机制

#### 【高-3】资产前端未集成写操作
- **描述**: 后端有 `assets.create/update`，前端 `sc-assets-page.ts` 未调用
- **影响**: 资产增改必须通过 API 手动调用
- **修复建议**: 在 `sc-assets-page.ts` 中添加"创建资产"表单，调用 `assets.create`

### 4.2 中优先级差距

#### 【中-1】能力中心 Domains/Items 无 CRUD
- **描述**: `capabilities.domains.list` 和 `capabilities.items.list` 只有只读
- **影响**: 无法通过 UI 添加/编辑/删除能力域和能力项
- **修复建议**: 实现 `capabilities.domains.create/update/delete` 和 `capabilities.items.create/update/delete`

#### 【中-2】技能市场无安装/卸载流程
- **描述**: `skills.list/get` 只读，无 `skills.install/uninstall`
- **影响**: 用户只能查看技能定义，无法安装到自己的指挥官
- **修复建议**: 实现技能安装/激活/卸载的完整流程

#### 【中-3】频道管理无启用/禁用
- **描述**: `channels.configure` 可配置，但无启用/禁用状态切换
- **影响**: 用户无法临时关闭某个频道的推送
- **修复建议**: 实现 `channels.enable` / `channels.disable`

#### 【中-4】剧本(Playbook)执行无前端入口
- **描述**: 后端完整实现 playbook CRUD + start/cancel/getStatus，但无独立 UI 页面
- **影响**: 剧本功能存在但用户无法使用
- **修复建议**: 创建 `sc-playbooks-page.ts` 页面

#### 【中-5】审批删除功能缺失
- **描述**: `approval.create/get/list/approve/reject` 都有，但无 `delete`
- **影响**: 过期的审批记录无法清理
- **修复建议**: 实现 `approval.delete`

### 4.3 低优先级差距

#### 【低-1】证据(Evidence)无更新/删除
- **描述**: `capabilities.evidence.create/list` 存在，缺 update/delete
- **影响**: 证据上传后无法修改或删除

#### 【低-2】指挥官(Commander)无删除
- **描述**: `commander.create/get/update/activateRole/deactivateRole/bindLLM` 存在，无 `delete`
- **影响**: 指挥官账户无法注销

#### 【低-3】KPI 计算无前端入口
- **描述**: `kpi.calculate` 和 `kpi.summary` 存在，但无独立 UI 调用
- **影响**: KPI 数据可能未自动刷新

---

## 五、建议

### 5.1 立即行动（阻塞性问题）

1. **修复持久化感知问题**
   - 在 `app.ts` 的 `catch` 块中设置 UI 离线状态标志
   - 在 `sc-layout.ts` 或 `sc-header.ts` 显示连接状态（🟢已连接 / 🔴离线模式）
   - 离线模式下，对用户的写操作提示"数据将在重新连接后同步"

2. **为 Threat 和 Compliance 补充写操作**
   - 实现 `threats.create/update/delete` 后端方法
   - 实现 `compliance.create/update/delete` 后端方法
   - 前端页面添加"新建威胁"/"新建合规项"表单

3. **验证后端数据持久化路径**
   - 确认 `./data/storage/` 目录存在且可写
   - 确认 `process.env.DATA_PATH` 配置正确

### 5.2 短期计划（功能完整性）

4. **前端资产 CRUD 集成**
   - 在 `sc-assets-page.ts` 添加"创建资产"和"编辑资产"功能
   - 调用 `assets.create` 和 `assets.update` API

5. **技能市场安装流程**
   - 实现 `skills.install` / `skills.uninstall` 后端方法
   - 前端技能市场页面添加安装/卸载按钮

6. **能力中心 CRUD**
   - 实现 `capabilities.domains.create/update/delete`
   - 实现 `capabilities.items.create/update/delete`

### 5.3 中期计划（体验优化）

7. **实现前端离线缓存**
   - 使用 IndexedDB 缓存用户数据（事件/漏洞/任务等）
   - WebSocket 离线时，先写入 IndexedDB
   - 重连后与后端同步

8. **完善连接状态管理**
   - 修复 `messageQueue` 无界积累问题（设置最大队列长度或 TTL）
   - 增加连接超时提示
   - 实现手动重连按钮

9. **创建剧本管理 UI**
   - 新建 `sc-playbooks-page.ts`
   - 支持剧本列表、创建、编辑、启动/取消

### 5.4 长期计划（架构完善）

10. **后端存储升级**: JSON 文件 → SQLite（提升并发写入性能）
11. **数据迁移**: 实现 Export/Import 功能，支持数据备份和迁移
12. **多租户**: 实现指挥官隔离（当前所有数据在共享 JSON 文件中）

---

## 六、附录

### A. 已实现 API 方法完整清单（162个）

**认证 (4)**: `auth.login`, `auth.logout`, `auth.getCurrentUser`, `auth.hasPermission`

**技能 (2)**: `skills.list`, `skills.get`

**知识库-MITRE (4)**: `knowledge.mitre.stats`, `knowledge.mitre.tactics`, `knowledge.mitre.techniques`, `knowledge.mitre.search`

**知识库-SCF (4)**: `knowledge.scf.stats`, `knowledge.scf.domains`, `knowledge.scf.controls`, `knowledge.scf.search`

**指挥官 (6)**: `commander.get`, `commander.create`, `commander.update`, `commander.activateRole`, `commander.deactivateRole`, `commander.bindLLM`

**LLM (6)**: `llm.providers.list`, `llm.providers.add`, `llm.providers.update`, `llm.providers.delete`, `llm.chat`, `llm.chat.collaborative`, `llm.chat.parallel`

**AI分析 (9)**: `ai.insights`, `ai.anomalies`, `ai.trend`, `ai.recommendations`, `ai.anomaly.acknowledge`, `ai.anomaly.resolve`, `ai.chat`, `ai.action.execute`, `kpi.calculate`

**AI专家 (2)**: `aiExperts.config.get`, `aiExperts.config.save`

**资产 (12)**: `assets.list`, `assets.get`, `assets.create`, `assets.update`, `assets.delete`, `assets.stats`, `assets.batchImport`, `assets.findByIp`, `assets.findByTag`, `assets.linkVulnerability`, `assets.unlinkVulnerability`

**审计 (5)**: `audit.log`, `audit.query`, `audit.stats`, `audit.getByResource`, `audit.getResourceHistory`

**角色 (15)**: `roles.list`, `roles.get`, `roles.create`, `roles.update`, `roles.delete`, `roles.getByCode`, `roles.assignRole`, `roles.removeRole`, `roles.listUsers`, `roles.getUser`, `roles.createUser`, `roles.updateUser`, `roles.deleteUser`, `roles.getUserPermissions`, `roles.initialize`

**频道 (3)**: `channels.status`, `channels.configure`, `channels.send`

**安全事件 (12)**: `incidents.list`, `incidents.get`, `incidents.create`, `incidents.update`, `incidents.delete`, `incidents.updateStatus`, `incidents.stats`, `incidents.enums`, `incidents.escalate`, `incidents.getByTicketId`, `incidents.linkedResources`

**漏洞 (16)**: `vulnerabilities.list`, `vulnerabilities.get`, `vulnerabilities.create`, `vulnerabilities.update`, `vulnerabilities.delete`, `vulnerabilities.updateStatus`, `vulnerabilities.assign`, `vulnerabilities.stats`, `vulnerabilities.enums`, `vulnerabilities.nextStatuses`, `vulnerabilities.active`, `vulnerabilities.findByAssetId`, `vulnerabilities.getByVulnId`, `vulnerabilities.linkAsset`, `vulnerabilities.unlinkAsset`, `vulnerabilities.batchImport`

**威胁 (4)**: `threats.list`, `threats.get`, `threats.stats`, `threats.search`

**合规 (3)**: `compliance.list`, `compliance.get`, `compliance.stats`

**任务 (7)**: `tasks.list`, `tasks.get`, `tasks.create`, `tasks.update`, `tasks.updateStatus`, `tasks.delete`, `tasks.stats`, `tasks.approve`, `tasks.enums`

**工具 (6)**: `tools.list`, `tools.getTask`, `tools.createTask`, `tools.cancelTask`, `tools.listTasks`, `tools.getFindings`

**风险 (9)**: `risk.createFactor`, `risk.getFactor`, `risk.updateFactor`, `risk.deleteFactor`, `risk.listFactors`, `risk.predict`, `risk.getMetrics`, `risk.history`, `risk.createAssessment`

**报告 (5)**: `reports.list`, `reports.get`, `reports.generate`, `reports.delete`, `reports.listTemplates`

**审批 (6)**: `approval.create`, `approval.get`, `approval.list`, `approval.approve`, `approval.reject`, `approval.canExecute`, `approval.getByTaskId`

**剧本 (10)**: `playbook.list`, `playbook.get`, `playbook.create`, `playbook.update`, `playbook.delete`, `playbook.start`, `playbook.getStatus`, `playbook.getExecution`, `playbook.listExecutions`, `playbook.cancel`

**能力中心 (14)**: `capabilities.domains.list`, `capabilities.items.list`, `capabilities.tasks.list`, `capabilities.tasks.create`, `capabilities.tasks.updateStatus`, `capabilities.tasks.sla`, `capabilities.tasks.close`, `capabilities.tasks.reopen`, `capabilities.approvals.create`, `capabilities.approvals.approve`, `capabilities.runs.execute`, `capabilities.runs.listByTask`, `capabilities.evidence.create`, `capabilities.evidence.list`, `capabilities.overview.metrics`

### B. 关键文件路径索引

| 类别 | 文件 |
|------|------|
| 前端入口 | `ui/src/ui/app.ts` |
| WebSocket客户端 | `ui/src/ui/gateway-client.ts` |
| 数据服务 | `ui/src/ui/data-service.ts` |
| AI服务 | `ui/src/ui/ai-service.ts` |
| Mock数据 | `ui/src/ui/mock-data.ts` |
| 后端网关 | `packages/core/src/gateway/server.ts` |
| 后端路由 | `packages/core/src/gateway/router.ts` |
| 事件CRUD | `packages/core/src/gateway/routes/incidents-crud-routes.ts` |
| 漏洞CRUD | `packages/core/src/gateway/routes/vulnerabilities-crud-routes.ts` |
| 威胁路由 | `packages/core/src/gateway/routes/security-routes.ts` |
| 合规路由 | `packages/core/src/gateway/routes/security-routes.ts` |
| JSON存储 | `packages/core/src/storage/json-store.ts` |
| 架构文档 | `docs/ARCHITECTURE.md` |
| 功能文档 | `docs/FEATURES-DESIGN.md` |

### C. 已知 Mock 数据来源

| 实体 | Mock文件位置 | 条目数 |
|------|-------------|--------|
| 事件 | `mockIncidents` (64行) | ~5条 |
| 漏洞 | `mockVulnerabilities` (72行) | ~5条 |
| 威胁 | `mockThreats` (82行) | ~5条 |
| 合规 | `mockComplianceItems` (89行) | ~5条 |
| 资产 | `mockAssets` (98行) | ~5条 |
