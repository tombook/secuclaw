# 全实体详情查看

## 问题
14个 `dataService.getXxx(id)` 方法定义但从未被任何页面调用。用户无法查看事件、漏洞、资产、威胁、合规等实体的完整详情。所有列表页只有行级概要，无详情展开。

## 影响角色
- 全部8个安全专家角色

## 目标
1. 事件页：点击行展开完整详情（时间线、状态历史、关联资产、处理记录）
2. 漏洞页：点击行展开详情（CVE信息、关联资产、修复建议、状态历史）
3. 资产页：点击行展开详情（资产信息、关联漏洞列表、风险评估）
4. 威胁页：点击行展开详情（IOC指标、MITRE映射、置信度评分）
5. 合规页：点击行展开详情（控制措施、审计状态、合规证据）

## 范围
- `ui/src/ui/pages/sc-incidents-page.ts`
- `ui/src/ui/pages/sc-vulnerabilities-page.ts`
- `ui/src/ui/pages/sc-assets-page.ts`
- `ui/src/ui/pages/sc-threats-page.ts`
- `ui/src/ui/pages/sc-compliance-page.ts`
