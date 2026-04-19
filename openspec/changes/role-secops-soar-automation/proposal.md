# 安全运营官 — SOAR自动化编排

## 问题
SecuClaw 安全运营中心页面以数据展示为主，缺乏SOC核心的自动化能力：无告警分类/升级工作流、无自动化响应playbook执行、无SIEM集成联动、无安全编排(SOAR)功能。SecOps的7×24运营需求无法满足。

## 影响角色
- ⚙️ Security Ops — 核心SOC运营无自动化支撑
- 🎯 SecuClaw Commander — 无法通过编排协调多角色响应
- 🛡️ Security Expert — 缺少自动化扫描和响应工具链
- 📊 Business Security Officer — 无法量化运营效率和响应时间

## 目标
1. 告警中心：统一告警聚合、分级(P0-P3)、分类、升级工作流
2. SOAR Playbook执行引擎：从playbook模板创建自动化流程
3. 告警 → 自动响应链：触发条件 → 执行动作 → 通知
4. SOC运营KPI仪表盘：MTTD/MTTR、告警数量趋势、响应达标率
5. 值班管理：排班表、交接记录、告警分配

## 范围
- 新增 `packages/core/src/services/alert-service.ts`
- 新增 `packages/core/src/services/soar-service.ts`
- 新增 `packages/core/src/gateway/routes/alert-routes.ts`
- 新增 `packages/core/src/gateway/routes/soar-routes.ts`
- 新增 `ui/src/ui/pages/sc-alert-center.ts`
- 扩展 `ui/src/ui/pages/sc-secops-center.ts` 增加SOAR面板
- 扩展 `ui/src/ui/data-service.ts`
