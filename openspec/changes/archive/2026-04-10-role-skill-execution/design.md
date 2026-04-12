## Context

当前系统现状:
- 8种角色技能仅用于AI对话和UI展示
- 技能定义在SKILL.md中,但无可执行逻辑
- 无技能执行历史记录

目标:
- 让角色技能真正可执行
- 技能执行结果可追踪
- 支持多角色协同执行

## Goals / Non-Goals

**Goals:**
- 创建技能执行器框架
- 将SKILL.md中的技能映射到可执行Action
- 实现技能执行历史和追踪
- 支持多角色协同执行

**Non-Goals:**
- 不实现所有技能的执行(先实现关键技能)
- 不实现技能编排引擎(简单串联)
- 不实现技能市场/交易系统

## Decisions

### 1. 技能执行器架构

```
SkillExecutor
├── Registry (技能注册表)
├── SkillExecutor (执行引擎)
├── ActionRunner (动作执行器)
└── HistoryStore (执行历史)
```

### 2. 技能注册表

```typescript
interface SkillDefinition {
  id: string;
  name: string;
  executor: string;      // 执行器名称
  params: ParamSchema[];  // 参数模式
  resultType: string;     // 结果类型
  requiredRole: RoleId[]; // 需要的角色
}
```

### 3. 技能执行流程

```
用户选择技能 → 参数填写 → 权限检查 → 执行器选择 → 
ActionRunner执行 → 结果存储 → 通知用户 → 历史记录
```

### 4. 技能到执行的映射

基于SKILL.md capabilities映射:

```typescript
const SKILL_EXECUTION_MAP = {
  // Security Expert
  '漏洞扫描': { executor: 'nuclei', requires: ['target'] },
  '渗透测试': { executor: 'metasploit', requires: ['target', 'scope'] },
  '代码审计': { executor: 'semgrep', requires: ['repository'] },
  
  // Privacy Officer  
  '隐私影响评估': { executor: 'pia-calculator', requires: ['dataProcessing'] },
  '合规审计': { executor: 'compliance-auditor', requires: ['framework', 'scope'] },
  
  // Security Architect
  '安全架构评审': { executor: 'architecture-reviewer', requires: ['designDoc'] },
  '威胁建模': { executor: 'threat-modeler', requires: ['architecture'] },
  
  // Security Ops
  '日志分析': { executor: 'log-analyzer', requires: ['logSource', 'timeRange'] },
  '入侵追踪': { executor: 'forensic-toolkit', requires: ['evidence'] },
  
  // Supply Chain
  '供应商评估': { executor: 'vendor-assessor', requires: ['vendorId'] },
  'SBOM扫描': { executor: 'syft-scanner', requires: ['packageLock'] },
};
```

### 5. 执行结果处理

```typescript
interface ExecutionResult {
  executionId: string;
  skill: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  artifacts?: string[];  // 报告路径等
  executedBy: RoleId;
  timestamp: Date;
}
```

### 6. 多角色协同

```typescript
interface ChainExecution {
  steps: {
    role: RoleId;
    skill: string;
    params: any;
    dependsOn: string[];  // 前置步骤ID
  }[];
}
```

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 技能执行耗时 | UI无响应 | 异步执行 + WebSocket通知 |
| 执行器不存在 | 技能无法执行 | 先检查执行器可用性 |
| 技能冲突 | 多角色执行结果冲突 | 执行锁机制 |

## Migration Plan

1. 创建技能注册表
2. 实现基础SkillExecutor
3. 实现3-5个关键技能的ActionRunner
4. 创建执行历史UI
5. 创建技能执行UI

## Open Questions

1. 技能执行是否需要审批流程?
2. 技能执行资源限制(并发数)?
3. 失败重试策略?