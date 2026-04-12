## ADDED Requirements

### Requirement: 角色视角视图组件
系统 SHALL 提供角色视角切换组件，允许用户在同一安全数据上切换不同角色的分析维度。

#### Scenario: 视角标签切换
- **WHEN** 用户在事件/威胁/漏洞详情页点击角色视角标签
- **THEN** 系统 SHALL 切换到该角色视角，展示该角色关注的分析维度和数据

#### Scenario: 默认角色视角
- **WHEN** 用户进入数据详情页但未选择视角
- **THEN** 系统 SHALL 默认展示当前全局角色身份对应的视角

### Requirement: 角色视角内容差异化
系统 SHALL 为每个角色视角定义不同的数据展示焦点和分析维度。

#### Scenario: Security Expert 视角展示技术分析
- **WHEN** 用户以 Security Expert 视角查看安全事件
- **THEN** 系统 SHALL 重点展示：攻击技术分析（TTP）、漏洞详情、修复方案建议

#### Scenario: CISO 视角展示战略影响
- **WHEN** 用户以 CISO 视角查看安全事件
- **THEN** 系统 SHALL 重点展示：业务影响评估、合规风险、预算影响、董事会报告要点

#### Scenario: Security Ops 视角展示运营状态
- **WHEN** 用户以 Security Ops 视角查看安全事件
- **THEN** 系统 SHALL 重点展示：响应动作状态、影响系统列表、IOC 指标、时间线

### Requirement: 视角对比模式
系统 SHALL 支持多角色视角并排对比展示。

#### Scenario: 双视角对比
- **WHEN** 用户在详情页点击"对比视角"按钮并选择两个角色
- **THEN** 系统 SHALL 以左右分栏形式并排展示两个角色视角的分析结果
