# 工具页面后端接入 — 任务

- [ ] 1. `sc-tool-baseline-v2.ts` 导入 `dataService` 和 `gatewayClient`
- [ ] 2. `connectedCallback` 调用 `tools.list` 动态加载工具配置
- [ ] 3. 移除硬编码 `toolConfigs` 对象，改为 `@state tools: any[]`
- [ ] 4. 每个工具卡片增加"执行"按钮→`createToolTask()`
- [ ] 5. 实现任务状态轮询和结果展示
- [ ] 6. `sc-security-tools.ts` 同样接入后端 API
- [ ] 7. LSP 诊断 + Vite 构建验证
