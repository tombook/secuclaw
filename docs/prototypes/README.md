# SecuClaw 产品原型库

> 36 个静态 HTML 原型 + 1 个共享 CSS，覆盖项目**全部功能页面**。
> 双击即可在浏览器中打开，零依赖。

## 文件结构

```
docs/prototypes/
├── _shared.css                  # 共享样式（深色主题 + 设计系统）
├── README.md                    # 本文件
│
├── phase1-*.html (3)            # Phase 1: 门户 / 注册 / 引导
├── phase2-*.html (2)            # Phase 2: RACI / 战情室
├── phase3-*.html (1)            # Phase 3: SSO + 多租户 + 计费
├── phase4-*.html (1)            # Phase 4: AI + 自动化
│
├── role-*.html (8)              # 8 角色指挥台
├── list-*.html (6)              # 6 个核心业务列表
├── detail-*.html (3)            # 3 个关键详情页
├── cap-*.html (5)               # 5 个新能力 dashboard（含 11 个能力）
└── aux-*.html (8)               # 8 个辅助功能页
```

## 完整索引

### Phase 1-4 业务流（7 个）
| 文件 | Phase | 内容 |
|------|-------|------|
| [phase1-portal.html](./phase1-portal.html) | Phase 1 | 门户（PC 工作台风格首页） |
| [phase1-signup.html](./phase1-signup.html) | Phase 1 | 注册页（角色预选） |
| [phase1-onboarding.html](./phase1-onboarding.html) | Phase 1 | 引导气泡（3 步 RACI 任务） |
| [phase2-raci.html](./phase2-raci.html) | Phase 2 | RACI 任务对话框 + 4 状态卡片 |
| [phase2-warroom.html](./phase2-warroom.html) | Phase 2 | 战情室（实时协同） |
| [phase3-sso-billing.html](./phase3-sso-billing.html) | Phase 3 | SSO + 多租户 + 计费升级 |
| [phase4-ai.html](./phase4-ai.html) | Phase 4 | AI 推荐 + 上下文 + 自动化 |

### 8 角色指挥台（8 个）
| 文件 | 角色 | 关键内容 |
|------|------|----------|
| [role-commander.html](./role-commander.html) | 🎖️ 指挥官 | 全域态势地图 + 跨角色协同 + 资源调度 + 角色负载 |
| [role-ciso.html](./role-ciso.html) | 👔 CISO 战略官 | 战略趋势 + 预算分配 + Q2 目标 + 待审批 |
| [role-expert.html](./role-expert.html) | 🔍 安全专家 | 漏洞工作台 + 威胁狩猎 + MITRE + 渗透工具 |
| [role-secops.html](./role-secops.html) | ⚡ 安全运营 | 实时告警流 + SOAR 执行 + 告警统计 + 应急工具 |
| [role-architect.html](./role-architect.html) | 🏗️ 安全架构师 | 零信任成熟度 + 威胁模型 + 攻击路径图 + 设计审查 |
| [role-privacy.html](./role-privacy.html) | 🔒 隐私官 | DSR 管理 + 合规框架 + PII 数据资产 + PIA |
| [role-business.html](./role-business.html) | 💼 业务安全 | BIA 流程 + 危机通讯录 + 业务影响热图 + 演练 |
| [role-supply.html](./role-supply.html) | 🔗 供应链安全 | 供应商风险 + SBOM 统计 + AI 工具链 + 依赖漏洞 |

### 核心业务列表页（6 个）
| 文件 | 内容 | 关键元素 |
|------|------|----------|
| [list-assets.html](./list-assets.html) | 📦 资产管理 | 487 资产 + 5 KPI + 8 过滤维度 + 关键性评级 |
| [list-incidents.html](./list-incidents.html) | 🚨 事件管理 | P1/P2 紧急 + SOAR 自动化 + MTTD/MTTR |
| [list-vulnerabilities.html](./list-vulnerabilities.html) | 🛡️ 漏洞管理 | CVE 库 + CVSS 分级 + 零日 + 依赖漏洞 |
| [list-threats.html](./list-threats.html) | 🎯 威胁情报 | IOC 12,847 + TTP 映射 + 威胁组织 + 置信度 |
| [list-compliance.html](./list-compliance.html) | 📋 合规管理 | 12 框架 + GDPR/PIPL/SOC2 + 1451 SCF 控制项 |
| [list-tasks.html](./list-tasks.html) | 📋 任务中心 | RACI 矩阵 + SLA 警告 + 协同人员 + 状态徽章 |
| [list-roles-users.html](./list-roles-users.html) | 👥 角色与权限 | 8 内置 + 12 自定义 + 247 权限点 |

### 详情页（3 个）
| 文件 | 内容 |
|------|------|
| [detail-asset.html](./detail-asset.html) | 资产详情 · 风险维度 + 漏洞 + 事件 + 依赖 + 扫描 |
| [detail-incident.html](./detail-incident.html) | 事件详情 · 时间线 + 取证 + MITRE + 战情室 + 协同 |
| [detail-vulnerability.html](./detail-vulnerability.html) | 漏洞详情 · CVSS 3.1 维度 + 修复方案 + EPSS + 利用情报 |

### 11 个新能力 Dashboard（5 个 HTML 覆盖 11 能力）
| 文件 | 覆盖能力 | 关键元素 |
|------|----------|----------|
| [cap-cspm-dspm-easm.html](./cap-cspm-dspm-easm.html) | ☁️ CSPM 云安全 | 多云合规 + CIS 规则 + 框架覆盖度 + 趋势 |
| [cap-rasp-itdr-privacy.html](./cap-rasp-itdr-privacy.html) | 🛡️ RASP 自保护 | 12 保护规则 + 247 拦截 + 部署应用 + 实时日志 |
| [cap-ai-soar-ueba.html](./cap-ai-soar-ueba.html) | ⚡ SOAR + 📋 AI-SPM | Playbook 设计 + 实时执行 + 集成生态 + 5 AI 模型 |
| [cap-ueba-sigma-dspm.html](./cap-ueba-sigma-dspm.html) | 🧠 UEBA + 🎯 Sigma + 💾 DSPM | 行为基线 + 风险评分 + Sigma 规则 + 数据资产 |
| [cap-ai-scm-spm.html](./cap-ai-scm-spm.html) | 🤖 AI-SCM 工具链 | 15 AI 工具 + 数据出境 + 合同 + 风险评估 |

### 辅助功能（8 个）
| 文件 | 内容 |
|------|------|
| [aux-overview-capability.html](./aux-overview-capability.html) | 📊 安全总览（默认首页）· 6 KPI + 8 角色入口 + 12 能力矩阵 |
| [aux-evolution-market.html](./aux-evolution-market.html) | 🧬 自主进化 + 🛒 工具市场（合并）· AI 推荐 + 已部署技能 |
| [aux-knowledge-team.html](./aux-knowledge-team.html) | 📚 知识库 · MITRE/SCF/威胁情报 + 培训 |
| [aux-monitor-audit.html](./aux-monitor-audit.html) | 🖥️ 系统监控 · CPU/内存/服务 + 实时日志 + API 统计 |
| [aux-audit-settings.html](./aux-audit-settings.html) | 📋 审计日志 · 不可篡改 + 哈希校验 + 90 天留存 |
| [aux-notification-cmd.html](./aux-notification-cmd.html) | 🔔 通知中心 · @提及 + P1 紧急 + AI 洞察 |
| [aux-command-team.html](./aux-command-team.html) | ⌨️ 命令面板 · ⌘K 唤起 + 全局搜索 + 快捷键 |
| [aux-team-dynamics.html](./aux-team-dynamics.html) | 👥 团队动态 · 时间线 + 在线协同 + 活动热图 |

## 技术特性

- **纯静态 HTML/CSS**：零依赖，双击即可在浏览器中打开
- **共享设计系统**：`_shared.css` 定义颜色变量、组件、状态徽章
- **深色主题**：与 SecuClaw 实际界面一致
- **真实数据**：所有 KPI、资产、事件、漏洞数据均使用项目实际指标
- **响应式断点**：适配 PC 大屏（≥1280px）
- **可交互元素**：表单、按钮、悬停、过渡、脉冲动画、SVG 图表
- **多 SVG 趋势图**：CPU 监控、趋势线、柱状图、饼图

## 预览方式

```bash
# 单个文件
open docs/prototypes/role-commander.html

# 启动本地服务（推荐，可访问多个文件）
cd docs/prototypes && python3 -m http.server 8000
# 访问 http://localhost:8000/role-commander.html
```

## 完整覆盖的功能（39 个）

### 8 角色指挥台
🎖️ 指挥官 · 👔 CISO 战略官 · 🔍 安全专家 · ⚡ 安全运营 · 🏗️ 安全架构师 · 🔒 隐私官 · 💼 业务安全 · 🔗 供应链安全

### 核心业务管理
📦 资产 · 🚨 事件 · 🛡️ 漏洞 · 🎯 威胁 · 📋 合规 · 📋 任务 · 👥 角色与权限

### 详情视图
资产详情 · 事件详情 · 漏洞详情

### 11 大安全能力
☁️ CSPM · 💾 DSPM · 🌐 EASM · 🛡️ RASP · 🔐 ITDR · ⚡ SOAR · 🧠 UEBA · 🎯 Sigma · 🤖 AI-SCM · 📋 AI-SPM · 🔒 Privacy

### 辅助功能
📊 安全总览 · 🧬 自主进化 · 🛒 工具市场 · 📚 知识库 · 🖥️ 系统监控 · 📋 审计日志 · ⚙️ 系统设置 · 🔔 通知中心 · ⌨️ 命令面板 · 👥 团队动态

**总计 39 个独立页面，全部为可交互静态原型。**
