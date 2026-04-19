# 全实体详情查看 — 设计

## 交互模式
采用可展开行（expandable row）模式：点击列表行→下方展开详情面板。与 `sc-vulnerabilities-page.ts` 已有的资产关联展开面板模式一致。

## 数据获取
每个详情面板调用对应的 `dataService.getXxx(id)` 获取完整数据。

## 实现要点
- 新增 `@state selectedDetail: any | null` 状态
- 行点击 handler：调用 `getXxx(id)` → 设置 selectedDetail
- 详情面板渲染：条件渲染在行下方
- 再次点击同一行收起

## 约束
- 不修改 data-service.ts（方法已存在）
- 不修改后端
- 详情面板使用 `--sc-*` 设计系统变量
