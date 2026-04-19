# 技能执行历史后端持久化

## 问题
`sc-skill-execution-history.ts`（267行）仅使用本地 `historyStore`，技能执行记录不持久化。页面刷新后历史丢失，且无后端接口支持。

## 影响角色
- 全部8个角色

## 目标
1. 评估并实现后端技能执行历史持久化接口
2. dataService 新增对应方法
3. 页面接入后端数据源替代本地 store

## 范围
- `ui/src/ui/pages/sc-skill-execution-history.ts`
- `ui/src/ui/data-service.ts`
- 可能需要新增后端路由
