# 安全架构师/专家 — 攻击路径可视化与红蓝对抗

## 问题
SecuClaw 缺乏攻击路径可视化和红蓝对抗管理功能。安全架构师无法绘制攻击面图、无法展示从外到内的攻击路径。安全专家缺少红队演练管理工具。二者都无法进行基于MITRE ATT&CK的攻击模拟和防御评估。

## 影响角色
- 🏗️ Security Architect — 无法可视化架构弱点和信任边界
- 🛡️ Security Expert — 缺少渗透测试管理和红队演练工具
- ⚙️ Security Ops — 缺少蓝队防御评估和检测验证
- 🎯 SecuClaw Commander — 缺少攻防对抗的统一指挥视图

## 目标
1. 攻击面图谱：资产 → 漏洞 → 攻击路径 → 影响范围可视化
2. 攻击路径绘制：基于MITRE ATT&CK技术链绘制多步攻击路径
3. 红蓝对抗管理：创建演练 → 分配角色 → 执行追踪 → 结果评估
4. 防御覆盖分析：攻击路径 vs 现有控制措施 → 覆盖率 → 盲区
5. 漏洞利用链分析：CVSS + 可达性 + 资产价值 → 实际风险评分

## 范围
- 新增 `packages/core/src/services/attack-path-service.ts`
- 新增 `packages/core/src/gateway/routes/attack-path-routes.ts`
- 新增 `ui/src/ui/pages/sc-attack-path-page.ts`
- 新增 `ui/src/ui/pages/sc-red-team-page.ts`
- 扩展 `ui/src/ui/pages/sc-assets-page.ts` 攻击面集成
- 扩展 `ui/src/ui/data-service.ts`
