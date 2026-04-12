## Why

SecuClaw项目存在紧耦合问题：服务间依赖通过手动实例化传递，导致难以测试、难以单独修改服务、配置分散在代码中。需要通过依赖注入容器统一管理依赖，提升代码质量和可维护性。

## What Changes

### DI容器改造
- 引入typedi作为IoC容器，所有Service/Repository类添加`@Service()`装饰器
- 服务依赖通过构造函数自动解析，无需手动`new`实例化
- JsonStore注册为全局单例，其他服务按需解析

### 网关路由拆分
- 创建`Handler`和`HandlerResponse`类型定义
- 创建`RouteGroup`基类和示例实现
- 创建`ServiceFactory`实现类型安全的service访问
- Router简化为`registerHandler()`方法

### 事件系统重构
- EventBus添加`@Service()`装饰器
- 创建EventSystem服务，支持规则注册和中间件链
- 创建EventRule抽象类和EventMiddleware接口
- 迁移5个默认规则到EventRule模式

### 配置外部化
- ConfigService添加`@Service()`装饰器
- 统一管理gateway/api/storage配置
- 环境变量覆盖默认配置

### 性能优化
- KPI Service添加30秒缓存
- MITRE Loader并行加载3个attack JSON文件
- SCF Loader并行加载domains和controls
- 移除JsonStore中的冗余dynamic imports
- API添加compression中间件(gzip/deflate)
- WebSocket添加16ms微批处理

## Capabilities

### New Capabilities
- `di-container`: 依赖注入容器管理服务生命周期
- `event-system`: 基于规则的事件处理系统
- `config-service`: 统一配置管理服务
- `api-compression`: API响应压缩
- `ws-batching`: WebSocket消息批处理

### Modified Capabilities
- (无)

## Impact

- `packages/core/src/di/container.ts` - DI容器模板
- `packages/core/src/gateway/router.ts` - 路由简化
- `packages/core/src/events/` - 事件系统重构
- `packages/core/src/config/config-service.ts` - 配置统一
- `packages/core/src/api/server.ts` - 压缩中间件
- `packages/core/src/gateway/server.ts` - 消息批处理
- `packages/core/src/kpi/service.ts` - KPI缓存
- `packages/core/src/knowledge/mitre/loader.ts` - 并行加载
- `packages/core/src/knowledge/scf/loader.ts` - 并行加载
- `packages/core/src/storage/json-store.ts` - 移除dynamic imports