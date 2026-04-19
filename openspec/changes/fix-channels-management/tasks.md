## 1. 后端 - Channels Enable/Disable

- [x] 1.1 `channels-routes.ts` 新增 `channels.enable` handler — 设置 enabled=true
- [x] 1.2 新增 `channels.disable` handler — 设置 enabled=false
- [x] 1.3 修改 `channels.send` handler — 检查 enabled 状态，禁用时拒绝发送

## 2. 前端 - 频道管理页面

- [x] 2.1 新建 `sc-channels-page.ts` — 10 个频道的卡片网格
- [x] 2.2 每张卡片：频道图标+名称、连接状态指示器、enable/disable toggle 开关
- [x] 2.3 实现配置按钮（打开配置弹窗）
- [x] 2.4 实现测试发送按钮
- [x] 2.5 `data-service.ts` 新增 `enableChannel(channelId)` 和 `disableChannel(channelId)`

## 3. 前端 - 路由

- [x] 3.1 `app.ts` 修改 `/channels` 指向新页面
- [x] 3.2 `sc-secops-center.ts` 移除 `/channels` 映射
- [x] 3.3 i18n 三语言新增翻译键

## 4. 验证

- [x] 4.1 验证 enable/disable 切换正确生效
- [x] 4.2 验证 disabled 频道无法发送消息
