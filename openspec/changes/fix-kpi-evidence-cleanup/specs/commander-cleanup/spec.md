# Commander Cleanup Spec

## Overview
指挥官账户注销。

## Requirements

### REQ-1: Delete Commander
- **方法**: 新增 `commander.delete`
- **参数**: `{ id }`
- **校验**: 仅当 commander 无关联角色激活、无关联 LLM 绑定时允许删除

### REQ-2: Safety
- 删除前二次确认
- 设置页面增加注销入口
