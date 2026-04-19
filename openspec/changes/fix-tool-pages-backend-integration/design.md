# 工具页面后端接入 — 设计

## 架构
复用 `sc-secops-center.ts` 已验证的工具任务生命周期模式：
`tools.list` → 工具卡片 → 创建任务 → 轮询状态 → 查看发现 → 取消

## 数据流
1. `connectedCallback` 调用 `gatewayClient.request('tools.list', {})` 获取工具列表
2. 替换硬编码的 `toolConfigs` 对象
3. 每个工具卡片增加"执行"按钮
4. 执行流程：`dataService.createToolTask()` → 定时轮询 `dataService.getToolTask()` → `dataService.getToolFindings()`

## 文件变更
- `sc-tool-baseline-v2.ts`：移除静态配置，接入API
- `sc-security-tools.ts`：同上，增加分类展示

## 约束
- 不修改 `data-service.ts`（已有完整工具任务方法）
- 不修改后端（路由完整）
- 保持现有 CSS 设计系统风格
