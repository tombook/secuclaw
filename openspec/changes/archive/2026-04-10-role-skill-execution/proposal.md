## Why

当前8种安全角色定义的技能(capabilities)仅用于AI对话和UI展示,用户无法通过角色技能执行实际操作。需要让角色技能真正可执行,例如Security Expert的"漏洞扫描"技能可以触发扫描,Privacy Officer的"合规审计"技能可以启动审计流程。

## What Changes

### 技能执行器框架
- 创建SkillExecutor引擎,根据角色技能路由到对应的执行器
- 每个技能对应一个可执行的Action
- 执行器支持参数配置和结果回调

### 技能到执行的映射
```typescript
const SKILL_EXECUTION_MAP = {
  '漏洞扫描': {
    executor: 'nuclei-scanner',
    params: { target: string, templates: string[] },
    resultType: 'vulnerability-report',
  },
  '隐私影响评估': {
    executor: 'pia-calculator',
    params: { dataProcessing: DataProcessing[] },
    resultType: 'pia-report',
  },
  '安全架构评审': {
    executor: 'architecture-reviewer',
    params: { architecture: ArchitectureSpec },
    resultType: 'security-review-report',
  },
  // ...
};
```

### 技能执行历史
- 记录所有技能执行历史
- 按角色分类查看执行记录
- 执行结果与角色技能关联

### 多角色协同执行
- 支持多个角色技能串联执行
- 例如: 漏洞扫描(Security Expert) → 风险评估(Security Architect) → 合规报告(Privacy Officer)

## Capabilities

### New Capabilities
- `skill-executor`: 技能执行引擎
- `skill-registry`: 技能注册表
- `skill-history`: 技能执行历史
- `multi-role-execution`: 多角色协同执行

### Modified Capabilities
- `ai-security-experts`: 扩展支持技能执行

## Impact

- `packages/core/src/skills/executor.ts` - 技能执行器
- `packages/core/src/skills/registry.ts` - 技能注册表
- `packages/core/src/skills/actions/` - 各类技能执行器
- `ui/src/ui/pages/sc-skill-execution.ts` - 技能执行UI
- `ui/src/ui/pages/sc-skill-history.ts` - 执行历史UI