# 能力域管理 CRUD — 设计

## 交互模式
在 `sc-capabilities-page.ts` 域列表和项目列表中增加"新增"和"编辑"按钮。使用模态对话框表单。

## 数据流
- 新增域：`capabilitiesClient.createDomain(data)`
- 编辑域：`capabilitiesClient.updateDomain(id, data)`
- 删除域：`capabilitiesClient.deleteDomain(id)`
- 新增项：`capabilitiesClient.createItem(data)`
- 编辑项：`capabilitiesClient.updateItem(id, data)`
- 删除项：`capabilitiesClient.deleteItem(id)`

所有方法已在 `capabilities-client.ts` 中定义。

## 约束
- 复用 `capabilities-client.ts` 已有方法
- 不修改后端
- 表单字段：名称、描述、类型/所属域
