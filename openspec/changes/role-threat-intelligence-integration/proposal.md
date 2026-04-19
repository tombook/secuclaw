# 安全专家/运营官 — 威胁情报集成

## 问题
SecuClaw 威胁页面仅展示静态威胁列表，无外部威胁情报源接入、无IOC管理、无威胁情报关联分析、无MITRE ATT&CK实时映射。安全专家和运营官无法获取实时威胁情报来驱动检测和响应。

## 影响角色
- 🛡️ Security Expert — 无法获取最新威胁情报辅助漏洞评估
- ⚙️ Security Ops — 缺少IOC驱动的告警和狩猎
- 🏗️ Security Architect — 无法基于威胁情报进行架构决策
- 🎯 SecuClaw Commander — 缺少全局威胁态势感知

## 目标
1. 威胁情报源管理：配置外部情报源(MISP/OpenCTI/MITRE)、拉取频率、状态监控
2. IOC指标管理：IP/域名/哈希/URL指标库、导入导出、关联分析
3. 威胁情报 → 告警关联：自动匹配IOC与现有资产/漏洞/事件
4. MITRE ATT&CK热力图：技术覆盖度可视化、检测盲区标识
5. 威胁狩猎工作台：基于情报的主动搜索任务

## 范围
- 新增 `packages/core/src/services/threat-intel-service.ts`
- 新增 `packages/core/src/gateway/routes/threat-intel-routes.ts`
- 新增 `ui/src/ui/pages/sc-threat-intel-page.ts`
- 扩展 `ui/src/ui/pages/sc-threats-page.ts` 增加情报标签
- 扩展 `ui/src/ui/pages/sc-knowledge-base-page.ts` MITRE映射增强
- 扩展 `ui/src/ui/data-service.ts`
