# SecuClaw 前端实现计划 - Phase 3: 12菜单项 + AI能力 + 数据资源中心

## 📋 文档信息

- **版本**: v1.0
- **创建日期**: 2024-03-09
- **状态**: 待实现
- **优先级**: P0 - 核心功能

---

## 🎯 目标

1. 实现12个导航菜单页面，2. 为每个页面集成AI能力
3. 实现16个核心数据库管理页面
4. 实现数据血缘追踪功能

---

## 📐 技术栈

- **前端框架**: Lit 3.x (已存在)
- **路由**: @vaadin/router(已存在)
- **国际化**: 自研i18n(已存在)
- **状态管理**: 自研Store(已存在)
- **样式**: CSS Variables(已存在)

---

## 🗂️ 项目结构

```
secuclaw/
├── ui/
│   └── src/
│       ├── main.ts                    # 入口
│       ├── i18n/                    # 国际化
│       ├── styles/                  # 样式
│       └── ui/
│           ├── app.ts                # 主应用
│           ├── gateway-client.ts     # 网关客户端
│           ├── capabilities-client.ts # 能力客户端
│           ├── store/               # 状态管理
│           │   ├── ui-store.ts
│           │   ├── commander-store.ts
│           │   ├── skill-store.ts
│           │   └── data-store.ts          # 新增: 数据存储
│           ├── layout/             # 布局组件
│           │   ├── sc-layout.ts
│           │   ├── sc-sidebar.ts
│           │   └── sc-header.ts
│           ├── components/          # 公共组件
│           │   ├── sc-ai-assistant.ts    # 新增: AI助手
│           │   ├── sc-smart-card.ts     # 新增: 智能卡片
│           │   ├── sc-metric-card.ts    # 新增: 指标卡片
│           │   ├── sc-trend-chart.ts    # 新增: 趋势图表
│           │   ├── sc-data-table.ts     # 新增: 数据表格
│           │   ├── sc-kanban-board.ts   # 新增: 看板组件
│           │   └── sc-lineage-graph.ts   # 新增: 血缘图
│           ├── pages/              # 页面组件 (12菜单)
│           │   ├── sc-dashboard.ts        # ✅ 已有基础
│           │   ├── sc-threats-page.ts    # 需要完善
│           │   ├── sc-incidents-page.ts  # 需要完善
│           │   ├── sc-vulnerabilities-page.ts # 需要完善
│           │   ├── sc-compliance-page.ts  # 需要完善
│           │   ├── sc-reports-page.ts    # 需要完善
│           │   ├── sc-risk-page.ts       # 需要完善
│           │   ├── sc-war-room-page.ts   # 需要完善
│           │   ├── sc-capabilities-page.ts # ✅ 已有基础
│           │   └── tools/               # 工具页面
│           │       ├── sc-tool-baseline.ts  # ✅ 已有基础
│           │       ├── sc-tool-vuln-scan.ts  # 新增
│           │       ├── sc-tool-pentest.ts   # 新增
│           │       └── sc-tool-threat-hunt.ts # 新增
│           └── data-center/       # 数据资源中心 (新增)
│               ├── sc-data-overview.ts    # 总览
│               ├── sc-asset-db.ts       # 资产库
│               ├── sc-threat-db.ts      # 威胁库
│               ├── sc-knowledge-db.ts   # 知识库
│               ├── sc-people-db.ts      # 人员库
│               ├── sc-data-lineage.ts   # 血缘图
│               ├── sc-data-quality.ts   # 质量监控
│               └── sc-data-integration.ts # 集成管理
├── packages/
│   └── core/
│       ├── src/
│       │   ├── ai/                # AI服务
│       │   │   ├── ai-service.ts    # AI服务基类
│       │   │   ├── insight-generator.ts  # 洞察生成
│       │   │   ├── anomaly-detector.ts  # 异常检测
│       │   │   ├── trend-predictor.ts  # 趋势预测
│       │   │   └── recommendation-engine.ts # 建议引擎
│       │   └── data/
│       │       ├── repositories/  # 数据仓库
│       │       │   ├── asset-repo.ts
│       │       │   ├── vuln-repo.ts
│       │       │   ├── threat-repo.ts
│       │       │   ├── incident-repo.ts
│       │       │   ├── compliance-repo.ts
│       │       │   ├── risk-repo.ts
│       │       │   └── task-repo.ts
│       │       └── migrations/     # 数据迁移
│       └── data/
│           └── storage/
│               ├── assets.json
│               ├── vulnerabilities.json
│               ├── threats.json
│               ├── incidents.json
│               └── compliance.json
└── docs/
    └── specs/
        └── sec3.md              # 本文档
```

---

## 🔢 实现阶段

### Phase 3.1: AI服务基础设施 (Week 1)

#### 任务清单

| ID | 任务 | 类型 | 优先级 | 依赖 |
|----|------|------|--------|------|
| 1.1 | 创建AI服务基类 | service | P0 | - |
| 1.2 | 实现洞察生成器 | service | P0 | 1.1 |
| 1.3 | 实现异常检测器 | service | P0 | 1.1 |
| 1.4 | 实现趋势预测器 | service | P0 | 1.1 |
| 1.5 | 实现建议引擎 | service | P0 | 1.1 |
| 1.6 | 创建AI服务API | api | P0 | 1.2-1.5 |

---

### Phase 3.2: 公共组件库 (Week 1-2)

#### 任务清单

| ID | 任务 | 类型 | 优先级 | 依赖 |
|----|------|------|--------|------|
| 2.1 | sc-ai-assistant组件 | component | P0 | 1.6 |
| 2.2 | sc-smart-card组件 | component | P0 | 2.1 |
| 2.3 | sc-metric-card组件 | component | P0 | 2.1 |
| 2.4 | sc-trend-chart组件 | component | P0 | 2.1 |
| 2.5 | sc-data-table组件 | component | P0 | 2.1 |
| 2.6 | sc-kanban-board组件 | component | P0 | 2.1 |
| 2.7 | sc-lineage-graph组件 | component | P0 | 2.1 |

---

### Phase 3.3: 12菜单页面实现 (Week 2-4)

#### 任务清单

| ID | 任务 | 类型 | 优先级 | AI能力 |
|----|------|------|--------|--------|
| 3.1 | 仪表盘页面增强 | page | P0 | 智能洞察、异常预警、趋势预测 |
| 3.2 | 威胁情报页面 | page | P0 | 威胁分析、MITRE映射建议 |
| 3.3 | 安全事件页面 | page | P0 | 事件关联分析、响应建议 |
| 3.4 | 漏洞管理页面 | page | P0 | 优先级排序、修复建议 |
| 3.5 | 合规审计页面 | page | P1 | 合规差距分析、整改建议 |
| 3.6 | 分析报告页面 | page | P1 | 报告生成、数据洞察 |
| 3.7 | 安全风险页面 | page | P1 | 风险评估、处置建议 |
| 3.8 | 作战室页面 | page | P2 | 实时决策支持、协同建议 |
| 3.9 | 能力中心页面 | page | P0 | ✅ 已有基础 |
| 3.10 | 基线检查工具 | page | P2 | ✅ 已有基础 |
| 3.11 | 漏洞扫描工具 | page | P2 | 扫描策略建议 |
| 3.12 | 渗透测试工具 | page | P3 | 测试计划建议 |
| 3.13 | 威胁狩猎工具 | page | P3 | 狩猎假设建议 |

---

### Phase 3.4: 数据资源中心 (Week 3-4)

#### 任务清单

| ID | 任务 | 类型 | 优先级 | 依赖 |
|----|------|------|--------|------|
| 4.1 | 数据资源总览 | page | P1 | - |
| 4.2 | 资产数据库管理 | page | P0 | 4.1 |
| 4.3 | 威胁情报库管理 | page | P1 | 4.1 |
| 4.4 | 知识库管理 | page | P1 | 4.1 |
| 4.5 | 人员组织库管理 | page | P1 | 4.1 |
| 4.6 | 数据血缘图 | page | P1 | 4.1 |
| 4.7 | 数据质量监控 | page | P2 | 4.1 |
| 4.8 | 数据集成管理 | page | P2 | 4.1 |

---

## 🤖 AI能力详细设计

### 1. 智能洞察 (Smart Insights)

**位置**: 所有页面侧边栏

**功能**:
- 基于当前页面数据自动生成洞察
- 识别潜在问题
- 提供上下文相关建议

**实现**:
```typescript
interface SmartInsight {
  id: string;
  type: 'warning' | 'info' | 'recommendation';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  createdAt: Date;
}
```

---

### 2. 异常检测 (Anomaly Detection)

**位置**: 仪表盘、事件、漏洞页面

**功能**:
- 实时监控数据异常
- 基于历史数据检测偏差
- 自动告警

**实现**:
```typescript
interface AnomalyAlert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  metric: string;
  currentValue: number;
  expectedValue: number;
  deviation: number;
  detectedAt: Date;
  status: 'new' | 'acknowledged' | 'resolved';
  suggestedActions: string[];
}
```

---

### 3. 趋势预测 (Trend Prediction)

**位置**: 仪表盘、风险页面

**功能**:
- 基于历史数据预测趋势
- 提供预测置信度
- 预警阈值

**实现**:
```typescript
interface TrendPrediction {
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number; // 0-100
  timeframe: '7d' | '30d' | '90d';
  trend: 'increasing' | 'stable' | 'decreasing';
  factors: string[];
  recommendation?: string;
}
```

---

### 4. 建议引擎 (Recommendation Engine)

**位置**: 所有页面

**功能**:
- 基于上下文生成建议
- 优先级排序
- 可执行操作

**实现**:
```typescript
interface AIRecommendation {
  id: string;
  category: 'security' | 'compliance' | 'operations' | 'risk';
  title: string;
  description: string;
  priority: number; // 1-100
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  actions: RecommendedAction[];
  relatedEntities: {
    type: 'vulnerability' | 'incident' | 'risk' | 'asset';
    id: string;
  }[];
}
```

---

## 📊 12菜单AI能力映射

| 菜单 | AI洞察 | AI预警 | AI预测 | AI建议 | AI助手 |
|------|---------|--------|--------|--------|--------|
| 仪表盘 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 威胁情报 | ✅ | ✅ | - | ✅ | ✅ |
| 安全事件 | ✅ | ✅ | - | ✅ | ✅ |
| 漏洞管理 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 合规审计 | ✅ | - | - | ✅ | ✅ |
| 分析报告 | - | - | - | ✅ | ✅ |
| 安全风险 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 作战室 | ✅ | ✅ | - | ✅ | ✅ |
| 能力中心 | ✅ | - | - | ✅ | ✅ |
| 基线检查 | - | - | - | ✅ | ✅ |
| 漏洞扫描 | - | - | - | ✅ | ✅ |
| 渗透测试 | - | - | - | ✅ | ✅ |
| 威胁狩猎 | ✅ | - | ✅ | ✅ | ✅ |

---

## 🎨 UI组件规范

### sc-ai-assistant (AI助手面板)

**位置**: 所有页面右侧固定面板

**功能**:
- 显示AI洞察
- 提供建议
- 接受用户提问
- 显示相关帮助

**状态**:
- collapsed: 最小化状态
- expanded: 展开状态
- chatting: 对话状态

---

### sc-smart-card (智能卡片)

**功能**:
- 显示关键指标
- 趋势箭头
- 状态指示
- 点击展开详情

**属性**:
```typescript
@property({ type: String }) title: string;
@property({ type: String }) value: string;
@property({ type: String }) trend?: 'up' | 'down' | 'stable';
@property({ type: String }) trendValue?: string;
@property({ type: String }) status?: 'success' | 'warning' | 'error';
@property({ type: String }) icon?: string;
```

---

### sc-metric-card (指标卡片)

**功能**:
- 显示指标详情
- 迷你图表
- 历史数据
- AI分析

---

### sc-trend-chart (趋势图表)

**功能**:
- 折线图
- 区域图
- 预测线
- AI标注

---

### sc-data-table (数据表格)

**功能**:
- 排序/筛选/分页
- AI优先级列
- 状态指示
- 批量操作

---

### sc-kanban-board (看板)

**功能**:
- 拖拽卡片
- 状态列
- AI建议区域
- 快速操作

---

### sc-lineage-graph (血缘图)

**功能**:
- 节点拖拽
- 连线动画
- 数据流向
- 影响分析

---

## 🔗 路由配置

```typescript
// app.ts 路由更新
router.setRoutes([
  // 现有路由...
  
  // 数据资源中心
  { path: '/data-center', component: 'sc-data-overview' },
  { path: '/data-center/assets', component: 'sc-asset-db' },
  { path: '/data-center/threats', component: 'sc-threat-db' },
  { path: '/data-center/knowledge', component: 'sc-knowledge-db' },
  { path: '/data-center/people', component: 'sc-people-db' },
  { path: '/data-center/lineage', component: 'sc-data-lineage' },
  { path: '/data-center/quality', component: 'sc-data-quality' },
  { path: '/data-center/integration', component: 'sc-data-integration' },
]);
```

---

## 📝 侧边栏更新

```typescript
// sc-sidebar.ts 更新
const navItems: NavItem[] = [
  // 现有菜单...
  
  // 数据资源中心
  { path: '/data-center', icon: '🗄️', labelKey: 'nav.dataCenter' },
];
```

---

## 🌐 API端点设计

### AI服务API

```
POST /api/ai/insights
Request: { context: string, pageId: string, data?: any }
Response: SmartInsight[]

POST /api/ai/anomalies
Request: { metricId: string, timeRange: string }
Response: AnomalyAlert[]

POST /api/ai/predictions
Request: { metricId: string, horizon: '7d' | '30d' | '90d' }
Response: TrendPrediction

POST /api/ai/recommendations
Request: { context: string, entityType: string, entityId: string }
Response: AIRecommendation[]

POST /api/ai/chat
Request: { message: string, context: ChatContext }
Response: { reply: string, actions?: RecommendedAction[] }
```

### 数据血缘API

```
GET /api/lineage/:entityType/:entityId
Response: LineageGraph

GET /api/lineage/impact/:entityType/:entityId
Response: ImpactAnalysis
```

### 数据质量API

```
GET /api/quality/overview
Response: QualityOverview

GET /api/quality/issues
Response: QualityIssue[]

POST /api/quality/fix/:issueId
Request: { fixAction: string }
Response: FixResult
```

---

## 📊 国际化更新

```typescript
// zh-CN.ts 新增
{
  nav: {
    // 现有...
    dataCenter: '数据资源中心',
  },
  
  ai: {
    assistant: 'AI助手',
    insights: '智能洞察',
    recommendations: '建议',
    askAI: '询问AI',
    noInsights: '暂无洞察',
    loading: 'AI分析中...',
    
    insightTypes: {
      warning: '警告',
      info: '信息',
      recommendation: '建议',
    },
    
    priority: {
      high: '高',
      medium: '中',
      low: '低',
    },
  },
  
  dataCenter: {
    title: '数据资源中心',
    subtitle: '统一管理企业安全数据资产',
    
    overview: '总览',
    assets: '资产库',
    threats: '威胁库',
    knowledge: '知识库',
    people: '人员库',
    lineage: '血缘图',
    quality: '质量监控',
    integration: '集成管理',
    
    metrics: {
      totalDbs: '数据库总数',
      healthy: '健康',
      warning: '警告',
      error: '异常',
      totalSize: '总容量',
      relations: '血缘关系',
    },
    
    quality: {
      score: '质量评分',
      issues: '问题',
      fixed: '已修复',
      lastCheck: '最后检查',
    },
  },
}
```

---

## ✅ 验收标准

### 功能验收

- [ ] 所有12菜单页面可正常访问
- [ ] 每个页面AI助手面板可用
- [ ] AI洞察实时更新
- [ ] 建议可执行
- [ ] 数据血缘图可交互
- [ ] 数据质量监控正常

### 性能验收

- [ ] 页面加载 < 2秒
- [ ] AI响应 < 3秒
- [ ] 图表渲染流畅
- [ ] 表格滚动流畅

### 兼容性验收

- [ ] Chrome 最新版
- [ ] Firefox 最新版
- [ ] Safari 最新版
- [ ] Edge 最新版

---

## 📅 时间线

| 周次 | 任务 | 产出 |
|------|------|------|
| Week 1 | Phase 3.1 + 3.2 | AI服务 + 公共组件 |
| Week 2 | Phase 3.3 (P0页面) | 仪表盘、威胁、事件、漏洞 |
| Week 3 | Phase 3.3 (P1页面) + 3.4 | 合规、报告、风险 + 数据中心 |
| Week 4 | Phase 3.3 (P2-P3) + 完善 | 作战室、工具页面 + 整体优化 |

---

## 📌 注意事项

1. **AI响应缓存**: 相同请求1分钟内返回缓存结果
2. **降级处理**: AI服务不可用时显示静态数据
3. **权限控制**: 部分AI功能需要相应角色权限
4. **审计日志**: 所有AI调用记录审计日志
5. **数据隔离**: 多租户环境数据隔离

---

## 📚 参考资料

- sec1.md - 项目概述
- sec2.md - 详细设计规范
- skills/ - 8个安全角色定义
- packages/core/src/knowledge/ - MITRE/SCF知识库

