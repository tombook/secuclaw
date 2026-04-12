## ADDED Requirements

### Requirement: AI安全专家页面 SHALL显示8种安全角色

页面左侧面板 SHALL 显示8种安全角色卡片,每种角色包含emoji图标和英文描述。

#### Scenario: 显示所有角色
- **WHEN** 用户访问AI专家页面
- **THEN** 页面 SHALL 显示8种角色: security-expert, privacy-officer, security-architect, business-security-officer, secuclaw-commander, ciso, security-ops, supply-chain-security

#### Scenario: 选择角色
- **WHEN** 用户点击角色卡片
- **THEN** 选中角色 SHALL 高亮显示
- **AND** 右侧面板 SHALL 显示该角色的技能详情

### Requirement: 技能展示 SHALL包含6个维度

每个角色的技能 SHALL 在6个维度展示: Light, Dark, Security, Legal, Technology, Business。

#### Scenario: 显示技能统计
- **WHEN** 用户选择角色
- **THEN** 技能概览 SHALL 显示: 总技能数, 活跃类别数, MITRE战术覆盖数, SCF控制覆盖数

#### Scenario: 显示技能网格
- **WHEN** 用户查看技能标签页
- **THEN** 技能 SHALL 以网格形式按6个维度展示
- **AND** 每个维度 SHALL 显示技能数量和具体技能列表

### Requirement: 覆盖范围展示 SHALL显示MITRE和SCF

每个角色 SHALL 显示其MITRE ATT&CK战术和SCF控制框架覆盖。

#### Scenario: 显示覆盖标签
- **WHEN** 用户查看角色技能
- **THEN** 覆盖范围区域 SHALL 显示MITRE ATT&CK战术标签(红色边框)
- **AND** 覆盖范围区域 SHALL 显示SCF控制框架标签(蓝色边框)

### Requirement: 8种安全角色 SHALL各自具备独特技能

#### Security Expert (security-expert)
- **WHEN** 角色为security-expert
- **THEN** Light技能 SHALL包含: 漏洞扫描, 补丁管理, 安全监控, 事件响应, 威胁检测, 访问控制, 加密管理, 身份认证
- **AND** Dark技能 SHALL包含: 渗透测试, 红队演练, 漏洞利用, 权限提升, 横向移动, 数据窃取, 社会工程, 无线攻击

#### Privacy Officer (privacy-officer)
- **WHEN** 角色为privacy-officer
- **THEN** Light技能 SHALL包含: 隐私影响评估, 数据分类分级, 合规审计, 用户权利响应, 数据保护政策, 跨境传输合规, cookie合规, 同意管理

#### Security Architect (security-architect)
- **WHEN** 角色为security-architect
- **THEN** Technology技能 SHALL包含: 网络架构, 云架构, 应用架构, 数据架构, 身份架构, 容灾架构, DevSecOps

#### Business Security Officer (business-security-officer)
- **WHEN** 角色为business-security-officer
- **THEN** Business技能 SHALL包含: 预算管理, ROI分析, 供应商管理, 绩效评估, 危机沟通

#### SecuClaw Commander (secuclaw-commander)
- **WHEN** 角色为secuclaw-commander
- **THEN** 该角色 SHALL 具备最全面的技能覆盖(Light/Dark/Security/Legal/Technology/Business全部非空)

#### CISO (ciso)
- **WHEN** 角色为ciso
- **THEN** Business技能 SHALL包含: 战略规划, 预算管理, 跨部门协调, 董事会汇报, 投资决策, 供应商管理

#### Security Ops (security-ops)
- **WHEN** 角色为security-ops
- **THEN** Technology技能 SHALL包含: SIEM, SOAR, EDR, NDR, 防火墙, IDS/IPS, 沙箱分析

#### Supply Chain Security (supply-chain-security)
- **WHEN** 角色为supply-chain-security
- **THEN** Technology技能 SHALL包含: SBOM管理, 依赖扫描, 制品安全, CI/CD安全

### Requirement: 技能定义 SHALL存储在SKILL.md文件中

每个角色的技能 SHALL 定义在`skills/{role-id}/SKILL.md`文件中,使用gray-matter格式。

#### Scenario: 技能加载
- **WHEN** SkillLoader初始化
- **THEN** 后端 SHALL 从`skills/{role-id}/SKILL.md`加载角色技能
- **AND** 技能 SHALL 包含capabilities, mitre_coverage, scf_coverage
