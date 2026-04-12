## Context

SecuClaw是一个安全运营平台，使用TypeScript/Bun开发，包含：
- WebSocket网关服务器 (port 21981)
- REST API服务器 (port 21982)
- 多个微服务 (capabilities, incidents, vulnerabilities等)
- JSON文件存储 (JsonStore)

**问题**：
1. 服务间依赖通过构造函数手动传递，难以单独测试
2. 配置分散在代码各处 (main.ts中的inline config)
3. 数据加载同步进行，性能可优化
4. 事件处理使用简单的on/off模式，缺乏规则抽象

**约束**：
- 使用Bun作为运行时
- 已有typeti依赖可用于DI
- 需要保持向后兼容 (Router的setCapabilitiesService等方法)

## Goals / Non-Goals

**Goals:**
- 实现依赖注入容器统一管理服务生命周期
- 事件系统支持规则和中间件
- 配置集中管理，支持环境变量覆盖
- 性能优化 (缓存、并行加载、批处理)

**Non-Goals:**
- 不修改现有API接口
- 不迁移到SQL数据库 (继续使用JsonStore)
- 不改变前端代码
- 不添加新功能，只做重构和优化

## Decisions

### 1. 使用typedi作为DI容器

**决策**：使用typedi而非其他DI框架

**理由**：
- 轻量级，已在项目中安装
- 支持装饰器 `@Service()`
- 与TypeScript reflect-metadata兼容
- 社区活跃，维护良好

**替代方案考虑**：
- InversifyJS: 功能更强大但学习曲线陡峭
- 自定义IoC: 需要更多代码，维护成本高

### 2. EventSystem桥接EventBus

**决策**：EventSystem订阅EventBus事件，规则注册到EventSystem

**架构**：
```
EventBus (pub/sub)
    ↓ (bridged via EventSystem)
EventSystem (middleware chain + rules)
    ↓
EventRules (5个规则类)
    ↓
context.emit() → EventBus (用于派生事件)
```

**理由**：
- 保持EventBus简单，只做pub/sub
- 规则逻辑封装在EventRule子类中
- 可通过中间件链扩展

### 3. 消息微批处理 (16ms窗口)

**决策**：WebSocket消息先缓存，16ms后批量发送

**理由**：
- 减少网络往返次数
- 16ms约等于60fps的一帧，用户无感知延迟
- 客户端断开时自动flush未发送消息

### 4. 配置通过ConfigService统一管理

**决策**：ConfigService作为单例，提供gateway/api/storage配置

**理由**：
- 配置集中，避免散落在各处
- 支持环境变量覆盖
- 预定义dev/test/production三套配置

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| typedi运行时错误 | DI解析失败导致服务无法启动 | 验证所有@Service()类正确装饰 |
| 循环依赖 | 服务启动失败 | 避免服务间循环依赖，保持单向依赖链 |
| 批处理延迟 | 高频事件用户感知延迟 | 16ms窗口是合理折衷，可配置 |
| 缓存一致性 | KPI数据可能过期 | 30秒TTL，平衡性能和实时性 |

## Migration Plan

所有变更已在`refactor/di-container`分支完成并验证：

1. **分支**: `refactor/di-container` (已创建)
2. **提交历史**: 
   - DI容器改造 (多个提交)
   - 事件系统重构 (多个提交)
   - 配置外部化
   - 性能优化
3. **验证**: 应用可正常启动，所有功能正常
4. **合并**: 可直接合并到main分支 (非破坏性重构)

## Open Questions

1. 是否需要将ConfigService的日志级别传递给logger？
2. 是否需要添加配置热重载功能？
3. EventSystem中间件链是否需要持久化？

以上问题可在后续迭代中解决，当前实现已满足基本需求。