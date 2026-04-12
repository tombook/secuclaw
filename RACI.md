# SecuClaw RACI 矩阵定义

## RACI 角色定义

| 缩写 | 角色 | 中文说明 | 职责描述 |
|------|------|----------|----------|
| R | Responsible | 执行 / 做事的 | 实际动手完成任务的人，可以有多个 |
| A | Accountable | 负责 / 最终拍板人 | 对任务成败负最终责任，只有一人；通常也是决策和审批人 |
| C | Consulted | 咨询 / 征求意见的对象 | 做决定或行动前，需要主动征求其意见的人（双向沟通） |
| I | Informed | 通知 / 知晓结果的人 | 任务完成后需要被动告知结果的人（单向通知） |

## 8 个安全角色

1. **security-expert** (🛡️) - 安全专家：漏洞管理、威胁检测、渗透测试
2. **privacy-officer** (🔐) - 隐私官：隐私合规(GDPR/PIPL/CCPA)、数据保护
3. **security-architect** (🏗️) - 安全架构师：零信任架构、防御纵深、安全架构设计
4. **business-security-officer** (📊) - 业务安全官：业务连续性、灾难恢复、ROI分析
5. **secuclaw-commander** (🎯) - 安全指挥官：全域安全指挥、跨角色协调、危机管理
6. **ciso** (👔) - CISO：安全战略、治理、预算管理、董事会汇报
7. **security-ops** (⚙️) - 安全运营：SOC运营、SIEM/SOAR、事件响应
8. **supply-chain-security** (🔗) - 供应链安全：供应商评估、SBOM管理、第三方风险

## 场景 RACI 矩阵

### 1. incident-response (事件响应)

| 角色 | RACI 类型 |
|------|-----------|
| security-expert | R |
| secuclaw-commander | A |
| ciso | C |
| security-ops | I |
| privacy-officer | C |
| security-architect | I |
| business-security-officer | I |
| supply-chain-security | I |

### 2. vulnerability-management (漏洞管理)

| 角色 | RACI 类型 |
|------|-----------|
| security-expert | R |
| security-architect | A |
| privacy-officer | C |
| ciso | I |
| secuclaw-commander | I |
| security-ops | C |
| business-security-officer | I |
| supply-chain-security | I |

### 3. threat-hunting (威胁狩猎)

| 角色 | RACI 类型 |
|------|-----------|
| security-ops | R |
| security-expert | A |
| secuclaw-commander | C |
| ciso | I |
| privacy-officer | I |
| security-architect | I |
| business-security-officer | I |
| supply-chain-security | I |

### 4. compliance-audit (合规审计)

| 角色 | RACI 类型 |
|------|-----------|
| privacy-officer | R |
| ciso | A |
| security-architect | C |
| business-security-officer | I |
| security-expert | I |
| secuclaw-commander | I |
| security-ops | I |
| supply-chain-security | I |

### 5. security-assessment (安全评估)

| 角色 | RACI 类型 |
|------|-----------|
| security-architect | R |
| ciso | A |
| security-expert | C |
| business-security-officer | I |
| privacy-officer | I |
| secuclaw-commander | I |
| security-ops | C |
| supply-chain-security | C |

## 角色自动化工作流模板

### 安全专家 (security-expert) - 漏洞管理工作流

1. **触发条件**：新漏洞报告或漏洞扫描完成
2. **RACI 类型**：R (执行)
3. **工作流步骤**：
   - 接收漏洞通知
   - 验证漏洞真实性
   - 评估漏洞风险等级
   - 制定修复方案
   - 执行修复或协调修复
   - 验证修复结果
   - 记录并归档

### 安全指挥官 (secuclaw-commander) - 事件响应决策工作流

1. **触发条件**：安全事件达到高风险等级
2. **RACI 类型**：A (负责)
3. **工作流步骤**：
   - 接收事件警报
   - 评估事件严重程度
   - 协调跨角色资源
   - 做出关键决策
   - 审批响应方案
   - 监督执行过程
   - 确认事件关闭

### 安全运营 (security-ops) - 威胁狩猎工作流

1. **触发条件**：定时任务或异常检测
2. **RACI 类型**：R (执行)
3. **工作流步骤**：
   - 启动狩猎任务
   - 收集安全数据
   - 分析异常行为
   - 验证潜在威胁
   - 生成狩猎报告
   - 触发响应流程（如需要）
   - 记录狩猎结果
