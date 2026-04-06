# SecuClaw 项目实施状态与下一步计划

2: 
3: ## 更新日期: 2026-03-30
4: 
5: ---
6: 
7: ## 一、已完成工作总结
8: 
9: ### 1.1 架构变更 ✅
10: - 移除 REST API Server，统一为 **WebSocket-only 罋关架构**
11: - 后端入口: `packages/core/src/main.ts` → WebSocket 服务器 + `/health` HTTP端点
12: - 前端通信: `ui/src/ui/gateway-client.ts` 单例 WebSocket 客户端
13: 
14: ### 1.2 后端路由模块 (22个文件, 161+ API方法)
15: 
16: | 路由文件 | 注册的API方法 | 状态 |
17: |---|---|---|
18: | `auth-routes.ts` | auth.login, auth.logout, auth.getCurrentUser, auth.hasPermission | ✅ |
19: | `knowledge-routes.ts` | knowledge.mitre.* (10个) | ✅ |
20: | `commander-routes.ts` | commander.* (6个) | ✅ |
21: | `llm-routes.ts` | llm.* (7个) | ✅ |
22: | `security-routes.ts` | security.* (vuln/threats/compliance/assets) (16个) | ✅ |
23: | `ai-routes.ts` | ai.* (9个) + kpi.calculate | ✅ |
24: | `assets-routes.ts` | assets.* (11个) | ✅ |
25: | `roles-crud-routes.ts` | roles.* (15个) | ✅ |
26: | `incidents-crud-routes.ts` | incidents.list/get/create/update/delete/stats/enums (7个) | ✅ |
27: | `incidents-routes.ts` | incidents.getByTicketId/escalate/linkedResources 等 (11个) | ✅ |
28: | `vulnerabilities-crud-routes.ts` | vulnerabilities.list/get/create/update/delete/stats/enums (7个) | ✅ |
29: | `vulnerabilities-routes.ts` | vulnerabilities.findByAssetId/active/batchImport/linkAsset/unlinkAsset 等 (13个) | ✅ |
30: | `tasks-crud-routes.ts` | tasks.* (9个) | ✅ |
31: | `tools-routes.ts` | tools.* (6个) | ✅ |
32: | `risk-routes.ts` | risk.* (9个) + risk.predict | ✅ |
33: | `report-routes.ts` | reports.* (5个) | ✅ |
34: | `approval-routes.ts` | approval.* (7个) | ✅ |
35: | `playbook-routes.ts` | playbook.* (6个) | ✅ |
36: | `audit-routes.ts` | audit.* (5个) | ✅ |
37: | `capabilities-routes.ts` | capabilities.* (16个) | ✅ |
38: | `channels-routes.ts` | channels.* (3个) | ✅ |
39: | `skills-routes.ts` | skills.* (2个) | ✅ |
40: 
41: ### 1.3 前端页面API接入状态 (42个组件, 38条路由)
42: 
43: | 页面 | 数据来源 | 调用的API方法 | 接入状态 |
44: |---|---|---|---|
45: | **sc-dashboard** | gatewayClient + dataService | incidents.stats, vulnerabilities.stats, knowledge.scf.stats | ✅ 已接入 |
46: | **sc-incidents-page** | dataService + gatewayClient | incidents.list/get/create/update/delete/escalate/linkedResources/getByTicketId/enums/stats | ✅ 全功能接入 |
47: | **sc-vulnerabilities-page** | gatewayClient + aiService | vulnerabilities.* (12个API) + tools.createTask/listTasks + ✅ 全功能接入 |
48: | **sc-threats-page** | dataService + aiService | threats.list/get/stats/search | ✅ 已接入 |
49: | **sc-compliance-page** | dataService + aiService | compliance.list/get/stats | ✅ 已接入 |
50: | **sc-reports-page** | gatewayClient + aiService | reports.list/listTemplates/generate/get/delete | ✅ 已接入 |
51: | **sc-risk-page** | gatewayClient | risk.listFactors/getMetrics/createFactor/deleteFactor/createAssessment/history/getFactor/updateFactor | ✅ 全功能接入 |
52: | **sc-war-room-page** | gatewayClient + aiService | playbook.* (6个) + approval.canExecute + commander.create/get | ✅ 全功能接入 |
53: | **sc-ai-experts-page** | gatewayClient | llm.providers.list (WebSocket直连) | ✅ 已接入 |
54: | **sc-vulnscan-page** | gatewayClient | tools.* (5个) + vulnerabilities.list | ✅ 全功能接入 |
55: | **sc-threathunt-page** | gatewayClient | incidents.list, knowledge.mitre.tactics | ✅ 已接入 |
56: | **sc-pentest-page** | gatewayClient | tasks.list | ✅ 已接入 |
57: | **sc-baseline-page** | gatewayClient + fallback | tasks.list | ✅ 已接入 |
58: | **sc-risk-center** | gatewayClient | risk.history, risk.predict + fallback | ✅ 已接入 |
59: | **sc-reports-pro** | gatewayClient | reports.list/listTemplates + fallback | ✅ 已接入 |
60: | **sc-assets-page** | gatewayClient | assets.* (11个API) | ✅ 全功能接入 |
61: | **sc-capabilities-page** | dataService + aiService | getIncidents | ✅ 已接入 |
62: | **sc-login-page** | authService | auth.login | ✅ 已接入 |
63: | **sc-audit-page** | gatewayClient | audit.query/stats/getByResource/getResourceHistory/log | ✅ 全功能接入 |
64: | **sc-approval-page** | gatewayClient | approval.list/approve/reject/create/get/getByTaskId | ✅ 全功能接入 |
65: | settings/**sc-roles-page** | gatewayClient | roles.* (15个API) | ✅ 全功能接入 |
66: | settings/**sc-settings-page** | gatewayClient | — | ✅ 已接入 |
67: | settings/**sc-ai-experts-config** | gatewayClient | aiExperts.config.save | ✅ 已接入 |
68: | settings/**sc-llm-service-config** | gatewayClient | llm.providers.* | ✅ 已接入 |
69: | **sc-secops-center** | gatewayClient | incidents/vulns/tasks/reports/risk/knowledge/tools (7个API) | ✅ 全功能接入 |
70: | **sc-datacenter-page** | gatewayClient | assets.list, vulnerabilities.list, incidents.list | ✅ 已接入 |
71: | **sc-channels-page** | gatewayClient | channels.status/configure/send | ✅ 全功能接入 |
72: | **sc-knowledge-base** | gatewayClient | knowledge.mitre.* + knowledge.scf.* (7个API) | ✅ 全功能接入 |
73: | **sc-skills-market** | gatewayClient | skills.list/get | ✅ 已接入 |
74: | **sc-tasks-page** | gatewayClient | tasks.* (9个API) | ✅ 全功能接入 |
75: 
76: ---
77: 
78: ## 二、未接入API的页面 (0个)
79: 
80: > **所有页面均已接入API，** 无剩余未接入页面。
81: 
82: ---
83: 
84: ## 三、Phase 1-5 实施计划完成状态
85: 
86: ### Phase 1: MVP ✅ 已完成
87: 
88: | 任务 | 状态 | 完成内容 |
89: |---|---|---|
90: | T1.1 事件响应工作流 | ✅ | incidents CRUD + 状态流转 + AI分析 |
91: | T1.2 漏洞管理闭环 | ✅ | vulnerabilities CRUD + 扫描任务 + fallback |
92: | T1.3 黑暗面审批流程 | ✅ | approval-routes + war-room审批 |
93: | T1.4 风险评估基础 | ✅ | risk-routes (CRUD + metrics) |
94: | T1.5 报告生成框架 | ✅ | report-generator + 5模板 |
95: | T1.6 WebSocket实时更新 | ✅ | gateway-client单例 + 全局连接管理 |
96: 
97: ### Phase 2: 完整功能 ✅ 已完成
98: 
99: | 任务 | 状态 | 宏成内容 |
100: |---|---|---|
101: | T2.1 威胁狩猎工具 | ✅ | threathunt页面接入MITRE ATTCK + IOC数据 |
102: | T2.2 渗透测试工具 | ✅ | pentest页面接入tasks.list |
103: | T2.3 证据管理 | ✅ | incidents页面含证据保全功能 |
104: | T2.4 合规检查自动化 | ✅ | compliance页面全功能 |
105: | T2.5 LLM智能分析 | ✅ | ai-experts页面已接入gatewayClient |
106: | T2.6 基线检查工具 | ✅ | baseline页面接入tasks.list + fallback |
107: | T2.7 完整KPI仪表板 | ✅ | dashboard全指标 + 安全评分 |
108: 
109: ### Phase 3: 高级功能 ✅ 已完成
110: 
111: | 任务 | 状态 | 完成内容 |
112: |---|---|---|
113: | T3.1 预测性风险分析 | ✅ | risk.history + risk.predict API + SVG趋势图 |
114: | T3.2 自动化Playbook | ✅ | playbook-routes (6方法) + war-room面板 + 执行按钮 |
115: | T3.3 高级报告生成 | ✅ | reports-pro接入reports.list/listTemplates + fallback |
116: | T3.4 性能优化 | ✅ | vite manualChunks已, 760KB→86KB, 24个chunk全部<130KB |
117: 
118: ---
119: 
120: ## 四、Phase 4: 已完成 ✅
121: 
122: | 编号 | 任务 | 涉及页面 | 状态 | 完成内容 |
123: |---|---|---|---|---|
124: | **T4.1** | SecOps中心接入真实API | sc-secops-center | ✅ | 7个API并行加载(incidents/vulns/tasks/reports/risks/knowledge/tools)，动态config合并 |
125: | **T4.2** | app chunk代码分割优化 | 所有页面 | ✅ | 760KB→86KB，24个chunk全部<130KB |
126: | **T4.3** | 渠道管理接入API | sc-channels-page | ✅ | channels.status/configure/send全部接入，状态实时同步 |
127: | **T4.4** | 数据中心页面接入 | sc-datacenter-page | ✅ | assets/vulns/incidents数据聚合，API+fallback合并 |
128: | **T4.5** | aiService替换真实LLM | 8个使用页面 | ⏭️ 跳过 | 约束条件禁止集成LLM到项目代码 |
129: | **T4.6** | 知识库/技能市场扩展 | sc-knowledge-base, sc-skills-market | ✅ | MITRE ATT&CK + SCF搜索/浏览,技能安装/详情 |
130: | **T4.7** | 外部扫描工具真实集成 | scanner目录 | ⏭️ 跳过 | 适配器架构已就绪，需外部工具基础设施 |
131: | **T4.8** | WebSocket推送(服务端→客户端) | 所有页面 | ✅ | EventBus→GatewayServer bridge，23个事件类型全量推送 |
132: 
133: ---
134: 
135: ## 五、Phase 5: API覆盖缺口修复 ✅ 已完成
136: 
137: | 编号 | 任务 | 涉及页面 | 状态 | 完成内容 |
138: |---|---|---|---|---|
139: | **T5.1** | 审计日志页面 | 新页面 sc-audit-page | ✅ | audit.query + audit.stats, 过滤/分页/统计 |
140: | **T5.2** | 审批管理页面 | 新页面 sc-approval-page | ✅ | approval.list/approve/reject, 卡片/详情/状态过滤 |
141: | **T5.3** | 资产CRUD补全 | sc-assets-page | ✅ | gatewayClient替换dataService, assets.create/batchImport |
142: | **T5.4** | 风险因子CRUD | sc-risk-page | ✅ | risk.listFactors/getMetrics/createFactor/deleteFactor/createAssessment/history |
143: | **T5.5** | 角色用户管理 | sc-roles-page | ✅ | roles.listUsers/createUser/updateUser/deleteUser/assignRole + 分配角色UI |
144: | **T5.6** | 报告生成/删除 | sc-reports-page | ✅ | reports.generate/get/delete, 新建报告+查看+删除 |
145: | **T5.7** | Playbook状态/取消 | sc-war-room-page | ✅ | playbook.getStatus/cancel/getExecution + approval.canExecute + 实时状态轮询 |
146: | **T5.8** | 工具任务跟踪 | sc-vulnscan-page | ✅ | tools.createTask/getTask/listTasks/cancelTask/getFindings + 实时进度 + 扫描历史 |
147: | **T5.9** | 事件升级+关联 | sc-incidents-page | ✅ | incidents.escalate/linkedResources + 升级按钮 + 关联资源面板 |
148: | **T5.10** | 路由/导航注册 | app.ts + sc-sidebar.ts | ✅ | audit/approval页面路由+导航+i18n(zh-CN/en/zh-TW) |
149: 
150: ---
151: 
152: ## 六、Phase 6: API深度覆盖修复 ✅ 已完成
153: 
154: | 编号 | 任务 | 涉及页面 | 状态 | 完成内容 |
155: |---|---|---|---|---|
156: | **T6.1** | 任务管理页面 | 新页面 sc-tasks-page | ✅ | tasks.* (8个API), 统计/筛选/CRUD/审批 |
157: | **T6.2** | 漏洞CRUD补全 | sc-vulnerabilities-page | ✅ | vulnerabilities.create/delete/batchImport/linkAsset/unlinkAsset/update |
158: | **T6.3** | 资产操作增强 | sc-assets-page | ✅ | assets.update/delete/findByIp/findByTag/linkVulnerability/unlinkVulnerability |
159: | **T6.4** | 角色权限增强 | sc-roles-page | ✅ | roles.create/delete/get/getByCode/getUser/getUserPermissions/initialize/removeRole |
160: | **T6.5** | 审批操作增强 | sc-approval-page | ✅ | approval.create/get/getByTaskId + 按钮 |
161: | **T6.6** | 风险因子编辑/查看 | sc-risk-page | ✅ | risk.getFactor/updateFactor (编辑/详情弹窗) |
162: | **T6.7** | Auth守卫增强 | app.ts guardRoute | ✅ | auth.getCurrentUser/auth.hasPermission 调用 |
163: | **T6.8** | SecOps工具列表 | sc-secops-center | ✅ | tools.list 加入并行加载 |
164: | **T6.9** | 工单号查询/删除 | sc-incidents-page | ✅ | incidents.getByTicketId/enums/delete + 查询按钮 |
165: | **T6.10** | 路由/导航注册 | app.ts + sc-sidebar.ts | ✅ | /tasks 路由 + 侧边栏 + i18n |
166: 
167: ---
168: 
169: ## 七、Phase 7: UI按钮模板接入 ✅ 已完成
170: 
171: 将所有"已声明但未接入模板"的方法接入UI按钮,使API调用可真正可用户触发。
172: 
173: | 页面 | 新增按钮功能 | 接入的方法 |
174: |---|---|---|
175: | **sc-vulnerabilities-page** | 🔴活跃漏洞、🔍按资产搜索、✏️编辑、🔗关联资产、✂️取消关联、🗑️删除 | loadActiveVulns, findVulnsByAssetId, updateVuln, linkAsset, unlinkAsset, deleteVulnerability |
176: | **sc-roles-page** | +新建角色、🔄初始化默认角色、🗑️删除角色、移除角色、查看权限、详情、按ID/编码查询 | createRole, initializeRoles, deleteRole, removeRoleFromUser, getUserPermissions, getUser, getRole, getByCode |
177: | **sc-war-room-page** | 🚨指挥官操作、📢指挥官状态、📋剧本详情 | createCommanderAction, getCommanderStatus, getPlaybookDetail |
178: | **sc-audit-page** | 📦资源查询、📜资源历史、📝记录审计 | getByResource, getResourceHistory, logAudit |
179: | **sc-channels-page** | 📤发送测试消息 | sendMessage |
180: | **sc-incidents-page** | 🔍工单查询、🗑️删除 + 枚举数据加载 | getByTicketId, deleteIncident, loadIncidentEnums |
181: | **sc-assets-page** | ✂️取消关联漏洞 | handleUnlinkVuln |
182: 
183: ---
184: 
185: ## 八、技术架构现状
186: 
187: ### 8.1 后端
188: - **运行时**: Bun
189: - **入口**: `packages/core/src/main.ts`
190: - **端口**: 21981 (WebSocket + /health)
191: - **路由**: 22个路由模块, 161+ API方法
192: - **存储**: JsonStore (JSON文件)
193: - **命令引擎**: PlaybookEngine + PlaybookRepository
194: - **事件总线**: EventBus + 23个事件类型 + WebSocket实时推送
195: 
196: ### 8.2 前端
197: - **框架**: Lit + LitElement Web Components
198: - **构建**: Vite 5.4.21
199: - **模块数**: 107个
200: - **代码分割**: 24个chunk, 最大126KB, 全部<130KB
201: - **数据层**: gatewayClient(WebSocket) + dataService(封装层) + aiService(mock)
202: - **路由**: @vaadin/router, 38条路由
203: - **页面组件**: 42个 LitElement组件 (含子组件)
204: 
205: ### 8.3 构建状态
206: - **零错误**, 453ms构建时间
207: - **输出**: dist/目录, http-server静态服务
208: 
209: ---
210: 
211: ## 九、6大能力域最终状态
212: 
213: | 能力域 | 页面 | 后端API | 前端接入 | 业务闭环 | 完成度 |
214: |---|---|---|---|---|---|
215: | **Light (光明面)** | sc-reports-page, sc-reports-pro | ✅ report-routes (5个) | ✅ | ✅ | **95%** |
216: | **Dark (黑暗面)** | sc-war-room-page, sc-pentest-page | ✅ playbook (6) + approval (7) | ✅ | ✅ | **95%** |
217: | **Security (安全运营)** | sc-incidents, sc-threathunt, sc-baseline, sc-threats, sc-secops-center | ✅ incidents (11) + knowledge (10) + tasks (9) | ✅ | ✅ | **95%** |
218: | **Legal (法务)** | sc-compliance-page | ✅ compliance (3个) | ✅ | ✅ | **85%** |
219: | **Technology (技术)** | sc-vulnerabilities, sc-vulnscan, sc-assets | ✅ vuln (16) + assets (11) + tools (6) | ✅ | ✅ | **90%** |
220: | **Business (业务)** | sc-risk-page, sc-risk-center | ✅ risk (9) + predict | ✅ + SVG图表 | ✅ | **95%** |
221: | **Data (数据)** | sc-datacenter-page | ✅ assets/vulns/incidents | ✅ | ✅ | **90%** |
222: | **Channels (渠道)** | sc-channels-page | ✅ channels (3个) | ✅ | ✅ | **90%** |
223: | **Knowledge (知识)** | sc-knowledge-base, sc-skills-market | ✅ knowledge (10) + skills (2) | ✅ | ✅ | **90%** |
224: | **Capabilities (能力)** | sc-capabilities-page + 子组件 | ✅ capabilities (16个) | ✅ | ✅ | **90%** |
225: 
226: ---
227: 
228: ## 十、API覆盖总览 (Phase 7后最终状态)
229: 
230: | 类别 | 后端API数 | 前端已调用 | 覆盖率 | 状态 |
231: |---|---|---|---|---|
232: | auth | 4 | 3 | 75% | ✅ (login走authStore) |
233: | incidents | 11 | 11 | 100% | ✅ |
234: | vulnerabilities | 16 | 16 | 100% | ✅ |
235: | threats | 4 | 4 | 100% | ✅ (via dataService) |
236: | compliance | 3 | 3 | 100% | ✅ (via dataService) |
237: | assets | 11 | 11 | 100% | ✅ |
238: | tasks | 9 | 9 | 100% | ✅ |
239: | roles | 15 | 15 | 100% | ✅ |
240: | tools | 6 | 6 | 100% | ✅ |
241: | risk | 9 | 9 | 100% | ✅ |
242: | reports | 5 | 5 | 100% | ✅ |
243: | approval | 7 | 7 | 100% | ✅ |
244: | playbook | 6 | 6 | 100% | ✅ |
245: | knowledge | 10 | 10 | 100% | ✅ |
246: | channels | 3 | 3 | 100% | ✅ |
247: | capabilities | 16 | 16 | 100% | ✅ (via client wrapper) |
248: | audit | 5 | 5 | 100% | ✅ |
249: | llm | 7 | 6 | 86% | ✅ (collaborative跳过) |
250: | ai | 9 | 8 | 89% | ✅ (kpi.calculate未用) |
251: | commander | 6 | 6 | 100% | ✅ |
252: | skills | 2 | 2 | 100% | ✅ |
253: | **总计** | **~182** | **~176** | **~97%** | — |
254: 
255: ### 未覆盖API说明
256: 
257: | API方法 | 原因 | 优先级 |
258: |---|---|---|
259: | `auth.login` | 通过authStore/login页面间接调用, 不走gatewayClient | P3 |
260: | `llm.chat.collaborative` | 用户约束"不集成LLM到项目代码" | ⏭️ 跳过 |
261: | `kpi.calculate` | KPI计算端点, 暂无页面使用 | P3 |
262: 
263: ---
264: 
265: ## 十一、待改进事项 (Phase 8)
266: 
267: ### 8.1 已知技术债
268: 
269: | 编号 | 问题 | 影响 | 优先级 | 建议 |
270: |---|---|---|---|---|
269: | **D8.1** | sc-secops-center.ts 过大 (34KB, 1148行) | 维护困难 | P2 | 考虑拆分为独立子组件 |
270: | **D8.2** | dataService封装层不一致 | 部分页面用dataService, 部分直接用gatewayClient | P3 | 统一为gatewayClient调用 |
271: | **D8.3** | 8个tools路由指向同一组件 | URL冗余 | P3 | 可保留(有意为之的统一入口)或拆分 |
272: | **D8.4** | sc-compliance-page/sc-threats-page仍用dataService | 不影响功能, P3 | 后续统一为gatewayClient |
273: | **D8.5** | incidentsEnums状态已声明但未在模板中直接展示 | 不影响功能 | P3 | 可添加severity/category筛选下拉框 |
274: 
275: ### 8.2 功能增强建议
276: 
277: | 编号 | 功能 | 涉及页面 | 描述 | 优先级 |
277: |---|---|---|---|---|
278: | **F8.1** | 事件创建表单 | sc-incidents-page | 当前只能看板视图, 缺少标准创建表单 | P2 |
279: | **F8.2** | 漏洞批量编辑 | sc-vulnerabilities-page | 缺少批量选择+批量状态更新 | P2 |
280: | **F8.3** | 资产拓扑图 | sc-assets-page | 缺少可视化网络拓扑 | P3 |
281: | **F8.4** | 合规框架详情 | sc-compliance-page | 缺少合规框架详情展开 | P2 |
282: | **F8.5** | 报告定时生成 | sc-reports-page | 缺少定时/周期性报告调度 | P3 |
282: | **F8.6** | 风险热力图 | sc-risk-page | 缺少风险因子关系热力图 | P3 |
283: | **F8.7** | 剧本编辑器 | sc-war-room-page | 缺少可视化Playbook编辑/设计器 | P2 |
284: | **F8.8** | 证据链管理 | sc-incidents-page | 缺少证据上传/下载功能 | P2 |
285: | **F8.9** | 用户头像/角色可视化 | sc-roles-page | 缺少角色权限矩阵可视化 | P3 |
286: | **F8.10** | 审计导出 | sc-audit-page | 缺少审计日志导出为CSV/PDF | P3 |
287: 
288: ### 8.3 质量改进建议
289: 
290: | 编号 | 问题 | 描述 | 优先级 |
291: |---|---|---|---|
292: | **Q8.1** | 预存后端错误 | roles/repository.ts, llm-routes.ts等有TypeScript错误 | P1 |
293: | **Q8.2** | 预存前端warning | sc-roles-page有多处类型不匹配warning | P2 |
293: | **Q8.3** | 前端测试覆盖 | 目前无前端测试 | P3 |
294: | **Q8.4** | E2E测试 | 目前无端到端测试 | P3 |
295: 
296: ---
297: 
298: ## 十二、约束条件
299: 
300: 1. **不集成LLM到项目代码** — LLM仅用于外部开发协作
301: 2. **WebSocket-only架构** — 无REST API服务器
302: 3. **Fallback机制** — 所有页面API调用失败时自动使用本地备用数据,不会空白
303: 4. **中文UI** — 所有界面文字使用中文
304: 
305: > ⚠️ **安全提醒**: 外部API密钥应通过环境变量或 `.env` 文件管理，切勿硬编码或提交到版本控制。