# 攻击路径可视化与红蓝对抗 — 设计

## 架构
新增AttackPath和RedTeam模块。AttackPath基于资产和漏洞关系图绘制攻击路径。RedTeam管理演练生命周期。

## 数据模型
```
AttackPath { id, name, startNode, endNode, steps[{assetId, vulnId, technique}], riskScore, likelihood }
AttackSurface { assetId, entryPoints[], exposures[], linkedVulns[] }
RedTeamExercise { id, name, type(red/blue/purple), status, scope, objectives[], timeline, results }
Engagement { id, exerciseId, role(red/blue), assignee, findings[], score }
```

## 数据流
1. `attack-path.generate` → 基于资产+漏洞自动生成攻击路径
2. `attack-path.list/get` → 攻击路径CRUD
3. `attack-path.surface` → 攻击面分析
4. `red-team.exercises.create/list/update` → 演练管理
5. `red-team.exercises.execute/evaluate` → 执行和评估
6. `attack-path.coverage` → 防御覆盖分析

## 文件变更
- 新增 attack-path-service.ts, attack-path-routes.ts
- 新增 sc-attack-path-page.ts(路径图+分析)
- 新增 sc-red-team-page.ts(演练管理)
- assets-page.ts 增加攻击面入口
- data-service.ts 增加 8个attackPath/redTeam方法

## 约束
- 攻击路径生成算法: BFS从外部资产到核心资产
- 路径风险 = Σ(漏洞CVSS × 可达性 × 资产价值) / 路径长度
- 演练评分: 检测率×40% + 响应时间×30% + 控制度×30%
- 可视化使用CSS/SVG(不引入图形库)
