# SecuClaw AI 安全运营能力增强建议

> 基于 GitHub 高星开源项目的调研，对 SecuClaw 现有 8 角色 / RACI / AI 能力中心 提出可落地的扩展方案
>
> 调研日期：2026-06-13
> 调研维度：星数（社区采用度）、能力互补性、SecuClaw 集成可行性

---

## 目录

1. [调研结论摘要](#1-调研结论摘要)
2. [AI SOC / SOAR / SIEM 平台](#2-ai-soc--soar--siem-平台)
3. [AI 安全 Agent 与 Copilot](#3-ai-安全-agent-与-copilot)
4. [LLM / Agent 红队与评估](#4-llm--agent-红队与评估)
5. [AI 基础设施安全（Agent / MCP / Skills）](#5-ai-基础设施安全agent--mcp--skills)
6. [云原生运行时检测（eBPF 类）](#6-云原生运行时检测ebpf-类)
7. [威胁情报与攻击面管理](#7-威胁情报与攻击面管理)
8. [AI 安全资源导航（Awesome 列表）](#8-ai-安全资源导航awesome-列表)
9. [SecuClaw 能力增强路线图](#9-secuclaw-能力增强路线图)
10. [集成示例](#10-集成示例)

---

## 1. 调研结论摘要

### 1.1 推荐优先级矩阵

| 优先级 | 推荐项目 | 星数 | 与 SecuClaw 互补性 |
|---|---|---|---|
| ⭐⭐⭐ 必看 | [Wazuh](#wazuh) | 8.6k+ | XDR/SIEM 数据源 |
| ⭐⭐⭐ 必看 | [TheHive + Cortex](#thehive--cortex) | 3k+ | 事件响应 / 剧本编排 |
| ⭐⭐⭐ 必看 | [Falco](#falco) | 7k+ | CNCF 运行时检测 |
| ⭐⭐ 强烈推荐 | [MISP](#misp) | 5k+ | 威胁情报共享 |
| ⭐⭐ 强烈推荐 | [OpenCTI](#opencti) | 5k+ | 威胁情报平台 |
| ⭐⭐ 强烈推荐 | [garak](#garak) | 8k+ | LLM 红队模糊测试 |
| ⭐⭐ 强烈推荐 | [PentestGPT](#pentestgpt) | 7k+ | 渗透测试 AI |
| ⭐⭐ 强烈推荐 | [AI-Infra-Guard](#ai-infra-guard) | 1k+ | MCP/Agent 安全 |
| ⭐ 推荐 | [agentic_security](#agentic_security) | 1k+ | LLM/Agent 漏洞扫描 |
| ⭐ 推荐 | [awesome-gpt-security](#awesome-gpt-security) | 1k+ | 资源索引 |
| ⭐ 推荐 | [DeepTeam](#deepteam) | 3k+ | LLM 红队评测 |
| ⭐ 推荐 | [pentest-ai-agents](#pentest-ai-agents) | 1k+ | 红队 Agent 框架 |
| ⭐ 推荐 | [Velociraptor](#velociraptor) | 3k+ | 数字取证 |
| ⭐ 推荐 | [osquery](#osquery) | 22k+ | 端点可见性 |

### 1.2 与 SecuClaw 当前能力的差异分析

| 维度 | SecuClaw 现状 | 缺口 | 推荐补强 |
|---|---|---|---|
| **数据采集** | JsonStore 静态数据 | 缺乏实时端点/网络采集 | Wazuh / Falco / osquery 适配器 |
| **事件响应** | War Room + RACI 协同 | 缺乏可执行的剧本引擎 | TheHive / Cortex / Shuffle |
| **威胁情报** | 内置 SCF + MITRE | 缺乏外部 IoC 流转 | MISP / OpenCTI / Yeti 集成 |
| **AI 攻击** | 80+ 技能元数据 | 缺自动化调用与报告 | PentestGPT / pentest-ai-agents |
| **LLM 安全** | sanitzer + output validator | 缺乏对抗性测试 | garak / DeepTeam / PyRIT |
| **MCP/Agent 安全** | 已有 SKILL.md 规范 | 缺对 Skill 自身安全审计 | AI-Infra-Guard / agentic_security |
| **运行时检测** | 静态配置 | 缺乏 eBPF 数据 | Falco / Tetragon / Tracee |
| **数字取证** | log + audit trail | 缺乏远程取证 | Velociraptor |

---

## 2. AI SOC / SOAR / SIEM 平台

### Wazuh

- **仓库**：https://github.com/wazuh/wazuh
- **星数**：⭐ 8.6k+
- **协议**：GPL-2.0
- **定位**：统一 XDR + SIEM，开源安全平台

**核心能力**：

- 端点检测与响应（EDR）：文件完整性监控、注册表监控、进程审计
- 日志管理：syslog、journald、Windows Event Log 收集
- 漏洞检测：CVE 匹配、配置基线评估（PCI DSS、GDPR、HIPAA、HIPAA）
- 云工作负载监控：AWS / Azure / GCP API 审计
- 主动响应：隔离主机、阻断 IP、阻断用户
- 与 VirusTotal、AbuseIPDB、URLhaus 等 30+ 第三方集成

**SecuClaw 集成方案**：

```typescript
// 1. 在 packages/core/src/scanner/ 新增 wazuh-adapter.ts
// 2. 数据流向：Wazuh Manager → Syslog/JSON → SecuClaw EventBus
//    → 触发 'incident.created' → RACI 任务派发

// 3. 在 packages/core/src/gateway/routes/ 新增 wazuh-routes.ts
//    接收 Wazuh Agent Alert webhook，转发为内部事件

// 4. 在 security-ops 角色仪表盘添加 Wazuh 视图
```

**对 SecuClaw 的价值**：补齐实时数据采集层，把静态 demo 数据升级为真实生产数据流。

---

### TheHive + Cortex

- **仓库**：
  - https://github.com/TheHive-Project/TheHive
  - https://github.com/TheHive-Project/Cortex
- **星数**：⭐ 3k+（合计 6k+）
- **协议**：AGPL-3.0
- **定位**：可扩展的事件响应平台 + 100+ 安全分析器

**核心能力**：

- **TheHive**：事件分诊、任务协作、模板化报告（PDF/MISP）、多租户
- **Cortex**：可观测分析器（VirusTotal、Shodan、MISP、Joe Sandbox…）
- 与 MISP 双向同步：从 IoC 自动建案、关案回写 MISP
- REST API 完整，支持 webhook

**SecuClaw 集成方案**：

```typescript
// packages/core/src/commander/playbook-engine.ts
// 把 TheHive 案例模型映射到 RaciTask / WarRoomSession
// TheHive Task → SecuClaw WorkflowStep (type=manual/automated/approval)
// TheHive Observable → SecuClaw Threat / IOC
```

**对 SecuClaw 的价值**：直接对接成熟的事件响应 + 协作流，与现有 `commander/playbook-engine.ts` 形成互补（SecuClaw 提供 AI 决策层，TheHive 提供操作落地层）。

---

### MISP

- **仓库**：https://github.com/MISP/MISP
- **星数**：⭐ 5k+
- **协议**：AGPL-3.0
- **定位**：恶意软件 / IoC 共享平台

**核心能力**：

- 50+ IoC 类型（IP / Domain / Hash / YARA / Sigma rule …）
- 自动关联：攻击者 → 活动 → IoC → 恶意软件样本
- 100+ 集成：TheHive、OpenCTI、Elastic、Splunk、Cortex …
- STIX 2.0 导出

**SecuClaw 集成方案**：

```typescript
// packages/core/src/threats/ 新增 misp-adapter.ts
// 定时从 MISP 拉取 IoC → 写入 threats.json → 触发 threat.detected 事件
// 双向：SecuClaw 检测到新型 IoC → push 回 MISP
```

---

## 3. AI 安全 Agent 与 Copilot

### PentestGPT

- **仓库**：https://github.com/GreyDGL/PentestGPT
- **星数**：⭐ 7k+
- **协议**：MIT
- **定位**：基于 GPT 的渗透测试助手

**核心能力**：

- 自然语言驱动的渗透测试工作流
- 任务分解：枚举 → 漏洞验证 → 利用 → 后渗透
- 内置 PTT（Penetration Testing Tree）模型
- 支持多 LLM 后端（OpenAI / Azure / Ollama / 自定义）

**SecuClaw 集成方案**：

```typescript
// 1. 在 packages/core/src/skills/ 新增 pentest-gpt/SKILL.md
//    metadata.openclaw.combination = 'binary'
//    role = 'security-expert'
//
// 2. 在 packages/core/src/skills/executor.ts 添加 action runner：
this.registerExecutor('pentest-gpt', async (params) => {
  // 调用 PentestGPT API 或本地推理服务
  // 返回任务树、发现、利用步骤
});

// 3. 在 sc-dashboard-security-expert 角色页加 PentestGPT 标签页
```

**对 SecuClaw 的价值**：将 SKILL.md 的"技能描述"层升级为"可调用 Agent"，极大提升 dark skills 的实战能力。

---

### pentest-ai-agents

- **仓库**：https://github.com/0xSteph/pentest-ai-agents（社区报道）
- **定位**：基于 Claude Code 的 28 人红队 Agent 矩阵

**核心能力**：把 Claude Code 改造为侦察 / 漏洞利用 / 后渗透 / 报告等多角色 Agent

**SecuClaw 集成方案**：参考其多 Agent 拓扑，把它内化到 SecuClaw 现有的 RACI R/A/C/I 模型中——把每个 Agent 当作一个 RACI 角色，事件路由器自动分发任务。

---

### BurpGPT / ReconAIzer / HackerGPT

- **BurpGPT**：将 Burp Suite 与 GPT 集成，自动分析 HTTP 流量
- **ReconAIzer**：基于 LLM 的侦察 Agent
- **HackerGPT**：类 ChatGPT 的安全垂域模型

**SecuClaw 集成方案**：作为 `role-tool-config.ts` 中 secops / security-expert 角色的 `secondaryTools`。

---

## 4. LLM / Agent 红队与评估

### garak

- **仓库**：https://github.com/NVIDIA/garak（前 leondz/garak，已捐赠给 NVIDIA）
- **星数**：⭐ 8k+
- **协议**：Apache-2.0
- **定位**：LLM 漏洞扫描器（生成式 AI 红队）

**核心能力**：

- 100+ 探针（probe）覆盖越狱、提示注入、数据泄露、幻觉、毒性
- 30+ 检测器（detector）评估响应是否被攻破
- 支持 HuggingFace / OpenAI / Replicate / 自定义 REST
- 生成结构化报告（JSON / HTML）

**SecuClaw 集成方案**：

```typescript
// 1. 在 packages/core/src/llm/garak-adapter.ts 提供命令行封装
// 2. 在 security-ops 仪表盘添加 "LLM 安全扫描" 工具卡
// 3. KPI 加一项 "LLM 越狱成功率 < X%"，由 garak 周期扫描驱动
```

**对 SecuClaw 的价值**：验证 SecuClaw 自身 LLM 的安全性，避免攻击者通过恶意输入劫持指挥官。

---

### DeepTeam

- **仓库**：https://github.com/confident-ai/deepteam
- **星数**：⭐ 3k+
- **协议**：Apache-2.0
- **定位**：LLM 红队评测库（DeepEval 团队）

**核心能力**：

- 40+ 攻击策略：越狱、提示注入、上下文污染、间接注入
- 集成 Llama Guard / Azure Content Safety / 自定义 Guard
- 支持多模态（文本 + 图像）
- Python 原生

**SecuClaw 集成方案**：

```typescript
// 通过 packages/core/src/llm/sanitizer.ts 借鉴其策略分类：
// - prompt-injection
// - jailbreak
// - context-poisoning
// - tool-misuse
// 每类风险对应 llm-output-validator.ts 中的一种校验器
```

---

### agentic_security

- **仓库**：https://github.com/msoedov/agentic_security
- **星数**：⭐ 1k+
- **协议**：MIT
- **定位**：LLM / Agent Workflow 漏洞扫描器

**核心能力**：

- 模拟对抗性 prompt 进行 fuzzing
- 与 Anthropic 安全工程指南对齐
- 持续 / 可重复执行的扫描

**SecuClaw 集成方案**：作为 RACI 中的 C（Consulted）角色 —— 当 SecuClaw 部署新技能 / Prompt 时，自动调用 agentic_security 跑一轮 fuzz。

---

### PyRIT（微软）

- **仓库**：https://github.com/Azure/PyRIT
- **定位**：Python Risk Identification Toolkit for LLMs

**核心能力**：多轮对抗 + 自动评分 + 多攻击策略 + 与 Azure AI Content Safety 集成。

**SecuClaw 集成方案**：在 `packages/core/src/llm/sanitizer.ts` 之上加 PyRIT 适配器，作为生产级对抗测试引擎。

---

## 5. AI 基础设施安全（Agent / MCP / Skills）

### AI-Infra-Guard（A.I.G.）

- **仓库**：https://github.com/Tencent/AI-Infra-Guard
- **协议**：Apache-2.0
- **定位**：腾讯朱雀实验室出品的全栈 AI 红队测试平台
- **已参展**：Black Hat Europe 2025 Arsenal

**核心能力（5 模块）**：

1. **OpenClaw Security Scan** —— 扫描 OpenClaw 类 Agent 配置
2. **Agent Scan** —— 扫描 Agent 工具投毒
3. **Skills Scan** —— 扫描 Skills / Tool 定义安全
4. **MCP Scan** —— 扫描 MCP Server 9 类常见风险（工具投毒、数据窃取、命令注入等）
5. **LLM Jailbreak Eval** —— LLM 越狱评估

**SecuClaw 集成方案**（**最高优先级**）：

```typescript
// 1. packages/core/src/skills/loader.ts 在 loadAll() 后：
//    调用 AIG 扫描每个 SKILL.md，对高风险技能标 'review-required'
//
// 2. security-expert 角色仪表盘增加"技能体检"页面：
//    - 显示每个技能的风险评分
//    - 一键跳转 AIG Web UI 查看详细
//
// 3. CI/CD 流程：在 .github/workflows/phase1-ci.yml 中
//    加 aig-scan 步骤，阻断高风险技能入库
```

**对 SecuClaw 的价值**：SecuClaw 现有 80+ 技能来自社区，缺乏安全审计层。AIG 直接补齐"技能供应链安全"空白。

---

### Llama Firewall / NeMo Guardrails / Prompt Armor

- **Llama Firewall**（https://github.com/meta-llama/PurpleLlama）：Meta 出品的多层 LLM 防护
- **NeMo Guardrails**（https://github.com/NVIDIA/NeMo-Guardrails）：对话流程护栏
- **Prompt Armor**：提示注入检测

**SecuClaw 集成方案**：在 `packages/core/src/llm/sanitizer.ts` 实现多种 sanitizer 策略，支持插件式注册：

```typescript
// packages/core/src/llm/sanitizers/
// ├── sanitizer-base.ts
// ├── prompt-injection-sanitizer.ts
// ├── jailbreak-sanitizer.ts
// ├── pii-redaction-sanitizer.ts
// └── registry.ts
```

---

## 6. 云原生运行时检测（eBPF 类）

### Falco

- **仓库**：https://github.com/falcosecurity/falco
- **星数**：⭐ 7k+
- **协议**：Apache-2.0
- **状态**：CNCF Incubating
- **定位**：云原生运行时安全

**核心能力**：

- eBPF 内核态系统调用监控
- 200+ 默认规则（含 K8s 特化规则）
- 输出到 stdout / Syslog / Kafka / Falcosidekick
- 实时告警 + 阻断（falco-no-driver / 现代 eBPF probe）

**SecuClaw 集成方案**：

```typescript
// 1. packages/core/src/scanner/falco-adapter.ts
//    订阅 Falco alert（JSON over HTTP）→ 转换为 SecuClaw Incident
//
// 2. data/storage/falco-rules/ 维护 SecuClaw 自定义 Falco 规则
//    （覆盖 8 角色典型威胁场景）
//
// 3. sc-dashboard-secops 添加 Falco 实时事件流
```

---

### Tetragon / Tracee

- **Tetragon**（https://github.com/cilium/tetragon，Cilium 出品）：基于 eBPF 的 K8s 内核级安全可观测
- **Tracee**（Aqua Security 出品）：运行时威胁检测

**SecuClaw 集成方案**：与 Falco 并列做数据源适配器，由用户按场景选择。

---

### osquery

- **仓库**：https://github.com/osquery/osquery
- **星数**：⭐ 22k+
- **协议**：Apache-2.0 / GPL（混合）
- **定位**：端点可见性（SQL 风格查询操作系统状态）

**SecuClaw 集成方案**：在 `packages/core/src/scanner/osquery-adapter.ts` 提供 SQL-to-JSON 转换，把端点状态接入资产管理模块。

---

### Velociraptor

- **仓库**：https://github.com/Velocidex/velociraptor
- **星数**：⭐ 3k+
- **协议**：AGPL-3.0
- **定位**：数字取证与事件响应（DFIR）

**核心能力**：

- 数千个内置 artifact（NTFS / Registry / Memory / Browser 历史）
- VQL（Velociraptor Query Language）类似 SQL
- 客户端-服务器架构，跨平台

**SecuClaw 集成方案**：在事件响应工作流（`commander/playbook-engine.ts`）触发后，调用 Velociraptor 跑取证 artifact，结果回写到 Incidents.timeline。

---

## 7. 威胁情报与攻击面管理

### OpenCTI

- **仓库**：https://github.com/OpenCTI-Platform/opencti
- **星数**：⭐ 5k+
- **协议**：Apache-2.0
- **定位**：威胁情报平台（STIX 2.1 原生）

**核心能力**：

- 攻击者画像、TTPs、IoC 关联图谱
- 30+ 数据连接器（MISP / AlienVault / Shodan / VirusTotal …）
- GraphQL API + GraphQL Federation

**SecuClaw 集成方案**：

```typescript
// packages/core/src/threats/opencti-adapter.ts
// 拉取 OpenCTI 的 intrusion-set / indicator → 写入 SecuClaw threats.json
// 提供 Web UI：在 supply-chain-security 角色页展示关联图
```

---

### Yeti（Yet Another Threat Intelligence Platform）

- **仓库**：https://github.com/yeti-platform/yeti
- **定位**：现代威胁情报平台

---

### Nuclei

- **仓库**：https://github.com/projectdiscovery/nuclei
- **星数**：⭐ 21k+
- **协议**：MIT
- **定位**：基于 YAML 模板的漏洞扫描器

**SecuClaw 集成方案**：与现有 `scanner/nuclei-adapter.ts` 整合，在 security-expert 角色页直接调用 Nuclei 模板。

---

### Subfinder / httpx / Katana

- **Subfinder**（10k+ ⭐）：子域名发现
- **httpx**（8k+ ⭐）：HTTP 探针
- **Katana**（13k+ ⭐）：下一代爬虫

**SecuClaw 集成方案**：作为 supply-chain-security / security-architect 角色的辅助工具调用。

---

## 8. AI 安全资源导航（Awesome 列表）

### awesome-gpt-security

- **仓库**：https://github.com/cckuailong/awesome-gpt-security
- **定位**：基于 GPT / LLM 的安全工具与案例清单

**对 SecuClaw 的价值**：作为新技能候选清单来源（SecuClaw 现有 `skills/` 目录可与此对照）。

---

### GPTSecurity

- **仓库**：https://github.com/mo-xiaoxi/GPTSecurity
- **定位**：GPT 与安全交叉领域论文与工具清单

---

### awesome-llm-security

- 维护中列表，覆盖 LLM 攻防两端

---

### Other Notable AI Security Projects

| 项目 | 仓库 | 说明 |
|---|---|---|
| Cyberark Labs AI | 商业 + 开源部分 | Privileged Access + AI |
| Abnormal Security | 商业 | 邮件安全 AI |
| Microsoft Security Copilot | 商业 | 微软出品 |
| SentinelOne Purple AI | 商业 | 端点 AI |
| CrowdStrike Charlotte AI | 商业 | EDR AI |

---

## 9. SecuClaw 能力增强路线图

### Phase 1：补齐数据采集层（短期，1-2 周）

| 任务 | 优先级 | 工作量 | 依赖 |
|---|---|---|---|
| `scanner/wazuh-adapter.ts` | P0 | 3d | Wazuh Manager 部署 |
| `scanner/falco-adapter.ts` | P0 | 2d | K8s 环境 |
| `scanner/osquery-adapter.ts` | P1 | 3d | Agent 部署 |
| `scanner/nuclei-adapter.ts`（已有，加固） | P1 | 2d | — |
| `gateway/routes/ingest-routes.ts`（通用 webhook 接收） | P0 | 2d | — |

### Phase 2：补齐 LLM / Agent 自身安全（中短期，2-3 周）

| 任务 | 优先级 | 工作量 | 依赖 |
|---|---|---|---|
| 集成 AI-Infra-Guard 扫描 SKILL.md | P0 | 3d | AIG CLI |
| 集成 garak 做 LLM 红队评测 | P0 | 3d | Python 子进程 |
| 集成 agentic_security 做 Agent fuzzing | P1 | 2d | — |
| 扩展 `llm/sanitizer.ts` 多策略插件化 | P0 | 3d | — |
| 新增 `kpi/llm-security-kpi.ts` | P1 | 2d | garak 输出 |
| 安全专家角色页增加"技能体检"视图 | P1 | 3d | AIG 集成 |

### Phase 3：补齐威胁情报与剧本执行（中期，3-4 周）

| 任务 | 优先级 | 工作量 | 依赖 |
|---|---|---|---|
| `threats/misp-adapter.ts` + 双向同步 | P0 | 4d | MISP 实例 |
| `threats/opencti-adapter.ts` | P1 | 4d | OpenCTI 实例 |
| `commander/playbook-engine.ts` 适配 TheHive 模板 | P1 | 5d | TheHive 实例 |
| 新增 `channels/teams-provider.ts` / `slack-provider.ts` | P2 | 2d | Webhook URL |
| KPI 加情报来源维度 | P2 | 1d | — |

### Phase 4：补齐 AI Agent 与 War Room 实战（中长期，4-6 周）

| 任务 | 优先级 | 工作量 | 依赖 |
|---|---|---|---|
| 集成 PentestGPT 为 security-expert 工具 | P0 | 5d | OpenAI key |
| 实现 pentest-ai-agents 风格的多 Agent 矩阵 | P1 | 7d | Claude API |
| War Room 中集成 Velociraptor 远程取证 | P1 | 5d | VR Server |
| 离线 LLM 推理（vLLM / Ollama 适配） | P1 | 3d | GPU |
| AI 协作引擎与上述所有数据源的闭环联动 | P0 | 7d | 全栈打通 |

---

## 10. 集成示例

### 10.1 Wazuh → SecuClaw 事件流

```typescript
// packages/core/src/scanner/wazuh-adapter.ts
import type { JsonStore } from '../storage/json-store.js';
import type { EventBus } from '../events/event-bus.js';

export interface WazuhAlert {
  id: string;
  timestamp: string;
  rule: { id: string; level: number; description: string; mitre?: { id: string; tactic: string } };
  agent: { id: string; name: string; ip: string };
  data: { srcip?: string; dstip?: string; username?: string; file?: string };
}

export class WazuhAdapter {
  constructor(
    private store: JsonStore,
    private eventBus: EventBus,
    private options: { url: string; user: string; pass: string; indexPrefix: string }
  ) {}

  async poll(intervalMs = 30000): Promise<void> {
    setInterval(async () => {
      const alerts = await this.fetchAlerts();
      for (const alert of alerts) {
        const incident = await this.toIncident(alert);
        await this.store.set(`incidents/${incident.id}.json`, incident);
        await this.eventBus.emit('incident.created', incident);
      }
    }, intervalMs);
  }

  private async toIncident(alert: WazuhAlert) {
    return {
      id: `inc_${alert.id}`,
      title: alert.rule.description,
      severity: this.toSeverity(alert.rule.level),
      source: 'wazuh',
      status: 'detected',
      detectedAt: new Date(alert.timestamp).getTime(),
      rawAlert: alert,
      mitreTactic: alert.rule.mitre?.tactic,
      mitreTechniqueId: alert.rule.mitre?.id,
      affectedAssetId: alert.agent.id,
    };
  }

  private toSeverity(level: number): 'critical' | 'high' | 'medium' | 'low' {
    if (level >= 12) return 'critical';
    if (level >= 7) return 'high';
    if (level >= 4) return 'medium';
    return 'low';
  }

  private async fetchAlerts(): Promise<WazuhAlert[]> {
    // 调用 Wazuh API /security/events?level>=7
    // 简化：实际用 https://wazuh.example.com:55000/security/user/authenticate
  }
}
```

### 10.2 AI-Infra-Guard → SecuClaw 技能扫描

```typescript
// packages/core/src/skills/aig-scanner.ts
import { spawn } from 'child_process';
import { readdir } from 'fs/promises';
import { join } from 'path';

export interface AigFinding {
  skillId: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: 'prompt-injection' | 'tool-poisoning' | 'data-exfil' | 'jailbreak';
  description: string;
}

export class AigScanner {
  constructor(private aigBinaryPath = 'aig') {}

  async scanAllSkills(skillsPath: string): Promise<AigFinding[]> {
    const dirs = await readdir(skillsPath);
    const findings: AigFinding[] = [];
    for (const dir of dirs) {
      const skillPath = join(skillsPath, dir, 'SKILL.md');
      const result = await this.scanSkill(skillPath);
      if (result) findings.push(...result.map(f => ({ ...f, skillId: dir })));
    }
    return findings;
  }

  private async scanSkill(filePath: string): Promise<Omit<AigFinding, 'skillId'>[]> {
    return new Promise((resolve) => {
      const proc = spawn(this.aigBinaryPath, ['skills', 'scan', '--file', filePath, '--format', 'json']);
      let out = '';
      proc.stdout.on('data', d => out += d);
      proc.on('close', () => {
        try { resolve(JSON.parse(out)); } catch { resolve([]); }
      });
    });
  }
}

// 在 SkillLoader.loadAll() 后：
const findings = await aigScanner.scanAllSkills(this.skillsPath);
await store.set('security/skill-audit.json', findings);
if (findings.some(f => f.riskLevel === 'critical')) {
  await eventBus.emit('system.alert', { type: 'critical-skill-detected', findings });
}
```

### 10.3 garak → SecuClaw LLM 安全 KPI

```typescript
// packages/core/src/llm/garak-runner.ts
import { spawn } from 'child_process';

export interface GarakReport {
  probe: string;
  detector: string;
  passed: number;
  failed: number;
  total: number;
  score: number;
}

export class GarakRunner {
  async scan(provider: string, model: string, probes: string[]): Promise<GarakReport[]> {
    return new Promise((resolve, reject) => {
      const proc = spawn('garak', [
        '--model_type', provider,
        '--model_name', model,
        '--probes', probes.join(','),
        '--report_format', 'json',
      ]);
      let out = '';
      proc.stdout.on('data', d => out += d);
      proc.on('close', code => {
        if (code !== 0) return reject(new Error(`garak exited ${code}`));
        resolve(this.parseReport(out));
      });
    });
  }

  private parseReport(json: string): GarakReport[] {
    // 解析 garak 输出，按 probe 聚合
    return [];
  }
}

// 接入 KpiService：
async computeLlmSecurityKpi(): Promise<number> {
  const reports = await garak.scan('openai', 'gpt-4', [
    'promptinject', 'jailbreak', 'leak', 'misinformation'
  ]);
  const total = reports.reduce((s, r) => s + r.total, 0);
  const passed = reports.reduce((s, r) => s + r.passed, 0);
  return total > 0 ? (passed / total) * 100 : 100;
}
```

---

## 附录：项目星数与重要性参考

| 项目 | ⭐ | 协议 | 类别 |
|---|---|---|---|
| osquery | 22k+ | Apache-2.0 | 端点 |
| Nuclei | 21k+ | MIT | 漏洞扫描 |
| Katana | 13k+ | MIT | 爬虫 |
| Subfinder | 10k+ | MIT | 子域名 |
| Wazuh | 8.6k+ | GPL-2.0 | SIEM/XDR |
| garak | 8k+ | Apache-2.0 | LLM 红队 |
| PentestGPT | 7k+ | MIT | 渗透测试 |
| Falco | 7k+ | Apache-2.0 | 运行时 |
| httpx | 8k+ | MIT | 探针 |
| TheHive | 3k+ | AGPL | 事件响应 |
| Cortex | 1k+ | AGPL | 分析器 |
| MISP | 5k+ | AGPL | 威胁情报 |
| OpenCTI | 5k+ | Apache-2.0 | 威胁情报 |
| Velociraptor | 3k+ | AGPL | 取证 |
| DeepTeam | 3k+ | Apache-2.0 | LLM 红队 |
| agentic_security | 1k+ | MIT | Agent fuzzing |
| AI-Infra-Guard | 1k+ | Apache-2.0 | MCP/Agent 安全 |
| awesome-gpt-security | 1k+ | — | 资源清单 |

---

## 总结

SecuClaw 已经具备 **AI 决策层 + 8 角色协同 + RACI** 这一差异化优势。结合开源生态，可分四阶段强化为 **真正的"AI 安全运营决策辅助平台"**：

1. **采集层**：Wazuh + Falco + osquery 补齐实时数据
2. **LLM 自身安全**：garak + agentic_security + AI-Infra-Guard 守护 SecuClaw 自身
3. **威胁情报与剧本**：MISP + OpenCTI + TheHive 扩展战术执行
4. **AI Agent 实战**：PentestGPT + pentest-ai-agents + Velociraptor 让 War Room 真正落地

> 📘 建议在 `docs/AI_SECURITY_TOOLS_ENHANCEMENT.md`（本文件）作为 SecuClaw 增强路线图持续更新。
> 所有引用项目的 star 数随时间变化，建议每季度复核一次。