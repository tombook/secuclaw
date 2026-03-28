# SecuClaw 黑暗面审批流程设计

**版本**: v1.0
**日期**: 2026-03-12
**作者**: SecuClaw 安全专家

---

## 1. 概述

### 1.1 背景
SecuClaw 系统包含"光明面"（防御）和"黑暗面"（攻击）两种安全能力。黑暗面任务涉及敏感操作，需要严格的审批流程控制。

### 1.2 黑暗面能力类型
| 类型 | 代码 | 描述 | 风险等级 |
|------|------|------|----------|
| 渗透测试 | `PENETRATION_TEST` | 模拟黑客攻击行为 | 🔴 高 |
| 漏洞扫描 | `VULNERABILITY_SCAN` | 主动扫描目标系统漏洞 | 🟡 中 |
| 威胁狩猎 | `THREAT_HUNTING` | 主动搜寻隐藏威胁 | 🟡 中 |
| 社工测试 | `SOCIAL_ENGINEERING` | 钓鱼邮件、电话等社工攻击 | 🔴 高 |
| 无线攻击 | `WIRELESS_ATTACK` | WiFi、蓝牙等无线攻击 | 🟡 中 |

---

## 2. 审批状态机

### 2.1 状态定义

```
┌──────────┐    创建     ┌──────────┐    审批通过   ┌───────────┐
│  DRAFT   │ ──────────→ │ PENDING  │ ────────────→ │ APPROVED  │
└──────────┘             └──────────┘              └───────────┘
     │                        │                          │
     │ 撤回                   │ 拒绝                      │ 开始执行
     ▼                       ▼                          ▼
┌──────────┐             ┌──────────┐              ┌───────────┐
│ CANCELLED│             │ REJECTED │              │ EXECUTING │
└──────────┘             └──────────┘              └───────────┘
                                                            │
                    ┌───────────────────────────────────────┤
                    │                   │                   │
                    ▼                   ▼                   ▼
              ┌───────────┐        ┌──────────┐       ┌──────────┐
              │ COMPLETED │        │  FAILED  │       │ TIMEOUT  │
              └───────────┘        └──────────┘       └──────────┘
```

### 2.2 状态详细说明

| 状态 | 描述 | 可进入状态 | 可退出状态 |
|------|------|-----------|-----------|
| `DRAFT` | 草稿，未提交审批 | - | PENDING, CANCELLED |
| `PENDING` | 待审批 | DRAFT, (自动) | APPROVED, REJECTED |
| `APPROVED` | 已批准，待执行 | PENDING | EXECUTING, CANCELLED |
| `EXECUTING` | 执行中 | APPROVED | COMPLETED, FAILED, TIMEOUT |
| `COMPLETED` | 已完成 | EXECUTING | - (终态) |
| `FAILED` | 执行失败 | EXECUTING | APPROVED (重试) |
| `TIMEOUT` | 执行超时 | EXECUTING | APPROVED (重试) |
| `REJECTED` | 已拒绝 | PENDING | DRAFT (重新编辑) |
| `CANCELLED` | 已取消 | DRAFT, PENDING, APPROVED | - (终态) |

---

## 3. 审批规则

### 3.1 提交规则

**谁能提交黑暗面任务:**
- ✅ 安全分析师 (Security Analyst)
- ✅ 渗透测试工程师 (Penetration Tester)
- ✅ 安全研究员 (Security Researcher)
- ✅ 安全运营经理 (Security Operations Manager)
- ✅ CISO / 首席信息安全官
- ❌ 普通用户
- ❌ 外部人员

**提交前必须填写:**
- 任务目标 (target)
- 任务类型 (type)
- 预期开始/结束时间
- 影响范围评估
- 风险缓解措施

### 3.2 审批规则

**谁能审批黑暗面任务:**

| 任务类型 | 审批人要求 | 审批时效 |
|----------|-----------|----------|
| VULNERABILITY_SCAN | 安全运营经理 + | 4小时 |
| THREAT_HUNTING | 安全运营经理 + | 4小时 |
| PENETRATION_TEST | CISO 或 授权代理 | 24小时 |
| SOCIAL_ENGINEERING | CISO + 法务 | 48小时 |
| WIRELESS_ATTACK | 安全运营经理 + | 4小时 |

**审批时效要求:**
- 高风险任务 (PENETRATION_TEST, SOCIAL_ENGINEERING): 24-48小时
- 中风险任务 (VULNERABILITY_SCAN, THREAT_HUNTING, WIRELESS_ATTACK): 4小时
- 超时处理: 自动通知上级 + 升级审批

**自动拒绝条件:**
- 目标系统属于生产核心系统且无备份计划
- 任务时间窗口与重要业务高峰期重叠
- 申请人无法提供风险缓解方案

### 3.3 执行规则

**谁能执行已批准的黑暗面任务:**
- ✅ 任务创建者
- ✅ 任务指定执行人
- ✅ 安全运营经理

**执行限制:**
- 执行时必须开启审计日志
- 关键操作需要实时监控
- 发现异常立即终止并告警

---

## 4. API 端点设计

### 4.1 端点列表

```
POST   /api/v1/dark-approvals              # 创建黑暗面审批请求
GET    /api/v1/dark-approvals              # 列表查询
GET    /api/v1/dark-approvals/:id          # 获取详情
PATCH  /api/v1/dark-approvals/:id          # 审批（通过/拒绝）
DELETE /api/v1/dark-approvals/:id          # 撤回/取消

POST   /api/v1/dark-approvals/:id/execute  # 开始执行
POST   /api/v1/dark-approvals/:id/complete # 标记完成
POST   /api/v1/dark-approvals/:id/retry    # 重试失败任务

GET    /api/v1/dark-approvals/stats        # 统计信息
```

### 4.2 请求/响应示例

#### POST /api/v1/dark-approvals (创建)

**Request:**
```json
{
  "name": "Q1季度生产环境渗透测试",
  "type": "PENETRATION_TEST",
  "description": "对生产环境核心系统进行授权渗透测试",
  "target": {
    "assets": ["asset-001", "asset-002"],
    "scope": "10.0.0.0/8",
    "whiteList": ["10.0.1.0/24"]
  },
  "scheduledStart": "2026-03-20T00:00:00Z",
  "scheduledEnd": "2026-03-25T23:59:59Z",
  "riskLevel": "HIGH",
  "riskMitigation": "已准备回滚方案，监控告警已配置",
  "executors": ["user-001", "user-002"],
  "tags": ["quarterly", "production", "authorized"]
}
```

**Response (201):**
```json
{
  "id": "dark_6825600000_abc123",
  "approvalId": "DARK-2026-000001",
  "name": "Q1季度生产环境渗透测试",
  "type": "PENETRATION_TEST",
  "status": "PENDING",
  "requester": {
    "id": "user-001",
    "name": "张三",
    "role": "SECURITY_ANALYST"
  },
  "target": {...},
  "riskLevel": "HIGH",
  "approvalRequired": ["CISO", "LEGAL"],
  "scheduledStart": "2026-03-20T00:00:00Z",
  "scheduledEnd": "2026-03-25T23:59:59Z",
  "statusHistory": [
    {
      "status": "PENDING",
      "timestamp": "2026-03-12T10:00:00Z",
      "actor": "user-001",
      "note": "已提交审批"
    }
  ],
  "createdAt": "2026-03-12T10:00:00Z",
  "updatedAt": "2026-03-12T10:00:00Z"
}
```

#### PATCH /api/v1/dark-approvals/:id (审批)

**Request:**
```json
{
  "action": "APPROVE",  // APPROVE | REJECT
  "note": "批准，注意控制攻击强度",
  "conditions": ["限制SQL注入测试", "禁止目录遍历"]
}
```

**Response (200):**
```json
{
  "id": "dark_6825600000_abc123",
  "approvalId": "DARK-2026-000001",
  "status": "APPROVED",
  "approvals": [
    {
      "approver": {
        "id": "ciso-001",
        "name": "李四",
        "role": "CISO"
      },
      "decision": "APPROVED",
      "timestamp": "2026-03-12T14:00:00Z",
      "note": "批准，注意控制攻击强度",
      "conditions": ["限制SQL注入测试", "禁止目录遍历"]
    }
  ],
  "validUntil": "2026-03-25T23:59:59Z",
  "updatedAt": "2026-03-12T14:00:00Z"
}
```

---

## 5. 数据模型设计

### 5.1 Prisma Schema 扩展

```prisma
// ============================================
// 黑暗面审批 (Dark Side Approval)
// ============================================

model DarkApproval {
  id          String   @id @default(cuid())
  approvalId  String   @unique  // DARK-2026-000001

  // 基本信息
  name        String
  description String?  @db.Text
  type        DarkApprovalType
  
  // 状态机
  status      DarkApprovalStatus @default(PENDING)
  
  // 风险等级
  riskLevel   RiskLevel @default(MEDIUM)
  
  // 目标与范围
  target      Json      // { assets: [], scope: "", whiteList: [] }
  
  // 计划时间
  scheduledStart DateTime?
  scheduledEnd   DateTime?
  actualStart    DateTime?
  actualEnd      DateTime?
  
  // 有效期
  validFrom DateTime?
  validUntil DateTime?
  
  // 风险缓解
  riskMitigation String? @db.Text
  
  // 执行信息
  executors     String[]  // 执行人列表
  executedBy    String?   // 当前执行人
  executionLog  Json?     // 执行日志
  
  // 审批链
  approvalChain DarkApprovalAction[]
  
  // 当前审批阶段
  currentApprovalStage Int @default(0)
  
  // 标签
  tags         String[]
  
  // 审计字段
  requesterId  String
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  // 关联
  history      AuditLog[]
  executions   DarkApprovalExecution[]

  @@index([status])
  @@index([type])
  @@index([requesterId])
}

// 审批动作记录
model DarkApprovalAction {
  id          String   @id @default(cuid())
  darkApprovalId String
  
  // 动作信息
  action      DarkApprovalActionType
  status      DarkApprovalStatus  // 执行该动作后的状态
  
  // 执行者
  actorId     String
  actorName   String?
  actorRole   String?
  
  // 决策信息
  decision    Decision?  // APPROVED | REJECTED
  note        String?  @db.Text
  conditions  String[]   // 批准条件/限制
  
  // 时间
  timestamp   DateTime @default(now())
  
  // 关联
  darkApproval DarkApproval @relation(fields: [darkApprovalId], references: [id], onDelete: Cascade)

  @@index([darkApprovalId])
}

// 执行记录
model DarkApprovalExecution {
  id          String   @id @default(cuid())
  darkApprovalId String
  
  attempt     Int      @default(1)
  
  // 状态
  status      DarkExecutionStatus
  
  // 时间
  startedAt   DateTime @default(now())
  completedAt DateTime?
  durationMs  Int?
  
  // 结果
  output      String?  @db.Text
  error       String?  @db.Text
  
  // 执行者
  executedBy  String?
  
  // 关联
  darkApproval DarkApproval @relation(fields: [darkApprovalId], references: [id], onDelete: Cascade)

  @@index([darkApprovalId])
}

// ============================================
// 枚举定义
// ============================================

// 黑暗面审批类型
enum DarkApprovalType {
  PENETRATION_TEST     // 渗透测试
  VULNERABILITY_SCAN   // 漏洞扫描
  THREAT_HUNTING       // 威胁狩猎
  SOCIAL_ENGINEERING   // 社会工程学测试
  WIRELESS_ATTACK      // 无线攻击
}

// 黑暗面审批状态
enum DarkApprovalStatus {
  DRAFT       // 草稿
  PENDING     // 待审批
  APPROVED    // 已批准
  EXECUTING   // 执行中
  COMPLETED   // 已完成
  FAILED      // 失败
  TIMEOUT     // 超时
  REJECTED    // 已拒绝
  CANCELLED   // 已取消
}

// 黑暗面动作类型
enum DarkApprovalActionType {
  CREATE      // 创建
  SUBMIT      // 提交审批
  APPROVE     // 批准
  REJECT      // 拒绝
  EXECUTE     // 执行
  COMPLETE    // 完成
  FAIL        // 失败
  TIMEOUT     // 超时
  CANCEL      // 取消
  RETRY       // 重试
  EXPIRE      // 过期
}

// 决策
enum Decision {
  APPROVED
  REJECTED
}

// 风险等级
enum RiskLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

// 执行状态
enum DarkExecutionStatus {
  STARTED
  RUNNING
  SUCCESS
  FAILED
  TIMEOUT
  CANCELLED
}
```

### 5.2 TypeScript 类型定义

```typescript
// 黑暗面审批类型
export type DarkApprovalType = 
  | 'PENETRATION_TEST' 
  | 'VULNERABILITY_SCAN' 
  | 'THREAT_HUNTING' 
  | 'SOCIAL_ENGINEERING' 
  | 'WIRELESS_ATTACK';

// 审批状态
export type DarkApprovalStatus = 
  | 'DRAFT' 
  | 'PENDING' 
  | 'APPROVED' 
  | 'EXECUTING' 
  | 'COMPLETED' 
  | 'FAILED' 
  | 'TIMEOUT' 
  | 'REJECTED' 
  | 'CANCELLED';

// 风险等级
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// 决策
export type Decision = 'APPROVED' | 'REJECTED';

// 目标定义
export interface DarkApprovalTarget {
  assets: string[];       // 目标资产ID列表
  scope: string;         // IP范围/CIDR
  whiteList: string[];   // 白名单（不测试的范围）
  credentials?: {
    provided: boolean;
    storage: 'VAULT' | 'NONE';
  };
}

// 创建请求
export interface CreateDarkApprovalRequest {
  name: string;
  description?: string;
  type: DarkApprovalType;
  target: DarkApprovalTarget;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  riskMitigation?: string;
  executors: string[];
  tags?: string[];
}

// 审批请求
export interface ApproveDarkApprovalRequest {
  decision: Decision;
  note?: string;
  conditions?: string[];
  validUntil?: Date;
}

// 状态转换映射
export const DARK_STATUS_TRANSITIONS: Record<DarkApprovalStatus, DarkApprovalStatus[]> = {
  DRAFT: ['PENDING', 'CANCELLED'],
  PENDING: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: ['EXECUTING', 'CANCELLED', 'EXPIRED'],
  EXECUTING: ['COMPLETED', 'FAILED', 'TIMEOUT', 'CANCELLED'],
  COMPLETED: [],
  FAILED: ['APPROVED', 'CANCELLED'],
  TIMEOUT: ['APPROVED', 'CANCELLED'],
  REJECTED: ['DRAFT', 'CANCELLED'],
  CANCELLED: [],
  EXPIRED: ['APPROVED', 'CANCELLED'],
};

// 审批要求配置
export const APPROVAL_REQUIREMENTS: Record<DarkApprovalType, {
  requiredRoles: string[];
  approvalStages: number;
  slaHours: number;
  escalationRoles: string[];
}> = {
  PENETRATION_TEST: {
    requiredRoles: ['CISO', 'CISO_DELEGATE'],
    approvalStages: 1,
    slaHours: 24,
    escalationRoles: ['CEO'],
  },
  VULNERABILITY_SCAN: {
    requiredRoles: ['SECURITY_OPS_MANAGER', 'CISO'],
    approvalStages: 1,
    slaHours: 4,
    escalationRoles: ['CISO'],
  },
  THREAT_HUNTING: {
    requiredRoles: ['SECURITY_OPS_MANAGER', 'CISO'],
    approvalStages: 1,
    slaHours: 4,
    escalationRoles: ['CISO'],
  },
  SOCIAL_ENGINEERING: {
    requiredRoles: ['CISO', 'LEGAL'],
    approvalStages: 2,
    slaHours: 48,
    escalationRoles: ['CEO', 'LEGAL_DIRECTOR'],
  },
  WIRELESS_ATTACK: {
    requiredRoles: ['SECURITY_OPS_MANAGER', 'CISO'],
    approvalStages: 1,
    slaHours: 4,
    escalationRoles: ['CISO'],
  },
};
```

---

## 6. 实现建议

### 6.1 目录结构

```
src/
├── dark-approval/
│   ├── repository.ts    # 数据访问层
│   ├── service.ts       # 业务逻辑层
│   ├── types.ts         # 类型定义
│   ├── validators.ts    # 审批规则验证
│   └── handlers.ts      # 状态转换处理器
```

### 6.2 关键业务逻辑

1. **状态转换验证**: 每次状态变更必须验证转换合法性
2. **审批时效监控**: 定时任务检查待审批任务，超时自动升级
3. **执行监控**: 执行过程中实时监控，发现异常立即终止
4. **审计日志**: 所有操作必须记录完整审计日志

### 6.3 安全考虑

1. **权限最小化**: 只有白名单角色可以提交/审批黑暗面任务
2. **双人审批**: 高风险任务需要多人审批
3. **时间窗口限制**: 批准后必须在有效期内执行
4. **范围限制**: 严格控制测试范围，防止误伤
5. **即时终止**: 发现异常可即时终止任务

---

## 7. 后续工作

- [ ] 实现 DarkApprovalRepository
- [ ] 实现 DarkApprovalService
- [ ] 实现 API Routes
- [ ] 添加审批时效监控定时任务
- [ ] 添加执行过程监控
- [ ] 集成告警系统
