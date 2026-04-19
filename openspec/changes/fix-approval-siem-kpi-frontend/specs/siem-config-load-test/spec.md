## Capability: siem-config-load-test

SIEM 集成配置的加载与连接测试。

### Requirements

- **REQ-1**: 进入 SIEM 配置页时自动调用 `siem.configs.get` 加载已保存配置
- **REQ-2**: 加载成功后填充各平台配置表单（Splunk/QRadar/Elastic）
- **REQ-3**: 用户可点击"测试连接"按钮调用 `siem.test` 验证配置连通性
- **REQ-4**: 测试结果展示成功/失败状态和错误信息

### Affected Roles
- security-ops: 配置和维护 SIEM 集成
- secuclaw-commander: 监控 SIEM 连接状态
