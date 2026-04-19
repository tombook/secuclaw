# 工具页面后端接入

## 问题
`sc-tool-baseline-v2.ts`（971行）和 `sc-security-tools.ts`（899行）共1870行代码，零API调用。这两个核心工具页面完全静态，用户无法执行任何安全工具操作。

## 影响角色
- 🎯 SecuClaw Commander — 无法调度工具
- 🛡️ Security Expert — 无法执行扫描/渗透测试
- ⚙️ Security Ops — SOC无法运行工具任务

## 目标
1. 工具列表从后端 `tools.list` 动态加载，替代硬编码配置
2. 工具执行完整闭环：创建任务 → 状态轮询 → 查看结果 → 取消
3. 复用 SecOps 中心已有的 `dataService` 工具任务方法
4. 与 `sc-secops-center.ts` 工具任务管理协同工作

## 范围
- `ui/src/ui/pages/tools/sc-tool-baseline-v2.ts`
- `ui/src/ui/pages/tools/sc-security-tools.ts`
- `ui/src/ui/data-service.ts`（可能需要补充方法）
