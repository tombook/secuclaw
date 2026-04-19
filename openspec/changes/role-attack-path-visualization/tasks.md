# 攻击路径可视化与红蓝对抗 — 任务

- [ ] 1. 新增 `packages/core/src/services/attack-path-service.ts` (路径生成+分析)
- [ ] 2. 新增 `packages/core/src/gateway/routes/attack-path-routes.ts` (8个handler)
- [ ] 3. 扩展 `ui/src/ui/data-service.ts` 增加 8个attackPath/redTeam方法
- [ ] 4. 新增 `ui/src/ui/pages/sc-attack-path-page.ts` (路径图+分析+覆盖)
- [ ] 5. 新增 `ui/src/ui/pages/sc-red-team-page.ts` (演练创建+执行+评估)
- [ ] 6. 扩展 `ui/src/ui/pages/sc-assets-page.ts` 增加攻击面入口
- [ ] 7. 扩展 `ui/src/ui/app.ts` 增加 /attack-path 和 /red-team 路由
- [ ] 8. 扩展 `ui/src/ui/config/role-centric-menu-config.ts` 增加攻击路径和演练菜单
- [ ] 9. 后端测试 + 前端LSP诊断 + Vite构建验证
