# Channels Toggle Spec

## Overview
频道启用/禁用状态切换。

## Requirements

### REQ-1: Enable Channel
- **方法**: `channels.enable`
- **参数**: `{ channelId }`
- **行为**: 设置频道配置 `enabled: true`

### REQ-2: Disable Channel
- **方法**: `channels.disable`
- **参数**: `{ channelId }`
- **行为**: 设置频道配置 `enabled: false`
- **效果**: 禁用后 `channels.send` 应拒绝发送

### REQ-3: Frontend Page
- 新建 `sc-channels-page.ts`
- 10 个频道的卡片网格
- 每张卡片：频道图标+名称、连接状态、启用/禁用 toggle 开关
- 配置按钮（打开配置弹窗）
- 测试发送按钮
