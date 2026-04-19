## Context

频道管理后端有 `channels.status/configure/send`（`channels-routes.ts`），缺少 enable/disable。前端无独立页面。10 种通讯渠道（飞书/Telegram/Slack/Discord/WhatsApp/Google Chat/Teams/Signal/iMessage/Nostr）的配置已有基础支持。

## Goals / Non-Goals

**Goals:**
- 新增 `channels.enable`、`channels.disable` API
- 新建 `sc-channels-page.ts` 独立页面
- 频道卡片带启用/禁用开关

**Non-Goals:**
- 频道消息历史
- 频道消息模板
- 新增频道类型

## Decisions

### D1: enable/disable 实现方式

**选择**: 在 `channels-routes.ts` 中新增 handler，修改频道配置的 `enabled` 字段。
**原因**: 频道配置已有 `enabled` 布尔字段，直接切换即可。

### D2: 前端页面

**选择**: 新建 `sc-channels-page.ts`，10 个频道的卡片网格，每张卡片含配置表单+启用开关+测试发送。
**原因**: 频道数量固定（10种），卡片布局最直观。

## Risks / Trade-offs

- **频道实际连接未实现** → 当前 configure/send 是框架级实现，各渠道的 SDK 适配器未完成
- **配置安全性** → API Key 等敏感信息需要加密存储（当前明文 JSON）
