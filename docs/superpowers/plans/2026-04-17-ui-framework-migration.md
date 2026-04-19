# SecuClaw UI Framework Migration - 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 SecuClaw 前端从 Lit 迁移到 React + shadcn/ui + Tailwind CSS，实现角色指挥台 UI 和视觉升级

**Architecture:**
- React 18 + TypeScript + Vite
- shadcn/ui (Radix UI primitives)
- Tailwind CSS v4
- Zustand (状态管理)
- React Router (路由)
- Recharts (图表)
- WebSocket + REST API 保持不变

**Tech Stack:** React, TypeScript, shadcn/ui, Tailwind CSS v4, Zustand, React Router, Recharts, Vite

---

## Phase 1: 基础设施搭建

### Task 1: 初始化 React 脚手架，清理旧 Lit 依赖

**Files:**
- Modify: `ui/package.json`
- Modify: `ui/vite.config.ts`
- Modify: `ui/tsconfig.json`
- Create: `ui/index.html` (更新)
- Create: `ui/src/main.tsx` (React 入口)
- Create: `ui/src/App.tsx` (根组件)
- Create: `ui/tailwind.config.ts`
- Create: `ui/postcss.config.js`
- Create: `ui/src/styles/globals.css`

- [ ] **Step 1:** 重写 `ui/package.json`，替换所有 Lit 依赖为 React 生态

```json
{
  "name": "ui",
  "version": "2.0.0",
  "description": "SecuClaw Frontend - React + shadcn/ui",
  "type": "module",
  "scripts": {
    "dev": "vite --host",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .ts,.tsx",
    "clean": "rm -rf dist node_modules"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",
    "zustand": "^5.0.0",
    "recharts": "^2.15.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^3.0.0",
    "class-variance-authority": "^0.7.0",
    "lucide-react": "^0.468.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.0",
    "@radix-ui/react-avatar": "^1.1.0",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-scroll-area": "^1.2.0",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-popover": "^1.1.0",
    "@radix-ui/react-collapsible": "^1.1.0",
    "cmdk": "^1.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 2:** 重写 `ui/vite.config.ts` 为 React 配置

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': { target: 'http://127.0.0.1:21982', changeOrigin: true },
      '/ws': { target: 'http://127.0.0.1:21981', ws: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2022',
  },
});
```

- [ ] **Step 3:** 更新 `ui/tsconfig.json` 支持 JSX

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4:** 创建 `ui/src/main.tsx` React 入口

- [ ] **Step 5:** 创建 `ui/src/styles/globals.css` 含 Tailwind 导入和 CSS 变量

- [ ] **Step 6:** 创建 `ui/src/App.tsx` 根组件含路由

- [ ] **Step 7:** 更新 `ui/index.html` 使用 React root

- [ ] **Step 8:** 创建 `ui/src/lib/utils.ts` (cn 工具函数)

---

### Task 2: 创建 shadcn/ui 基础组件

**Files:**
- Create: `ui/src/components/ui/button.tsx`
- Create: `ui/src/components/ui/card.tsx`
- Create: `ui/src/components/ui/badge.tsx`
- Create: `ui/src/components/ui/avatar.tsx`
- Create: `ui/src/components/ui/tabs.tsx`
- Create: `ui/src/components/ui/dialog.tsx`
- Create: `ui/src/components/ui/dropdown-menu.tsx`
- Create: `ui/src/components/ui/tooltip.tsx`
- Create: `ui/src/components/ui/progress.tsx`
- Create: `ui/src/components/ui/scroll-area.tsx`
- Create: `ui/src/components/ui/separator.tsx`
- Create: `ui/src/components/ui/select.tsx`
- Create: `ui/src/components/ui/switch.tsx`
- Create: `ui/src/components/ui/input.tsx`
- Create: `ui/src/components/ui/skeleton.tsx`
- Create: `ui/src/components/ui/sheet.tsx`

- [ ] **Step 1:** 创建所有 shadcn/ui 基础组件 (从 shadcn/ui 官方模板复制)

---

### Task 3: 创建角色主题系统 (React 版)

**Files:**
- Create: `ui/src/config/role-themes.ts`
- Create: `ui/src/config/role-layout-config.ts`
- Create: `ui/src/config/role-dashboard-config.ts`
- Create: `ui/src/config/raci-matrix.ts`

- [ ] **Step 1:** 迁移并升级 role-themes.ts 为 React 版（用 Tailwind class 替代 CSS 变量方案）
- [ ] **Step 2:** 迁移 role-layout-config.ts
- [ ] **Step 3:** 迁移 role-dashboard-config.ts
- [ ] **Step 4:** 迁移 raci-matrix.ts

---

### Task 4: 创建 Zustand Store 层

**Files:**
- Create: `ui/src/stores/role-context.ts`
- Create: `ui/src/stores/commander-store.ts`
- Create: `ui/src/stores/auth-store.ts`
- Create: `ui/src/stores/ui-store.ts`
- Create: `ui/src/stores/data-store.ts`
- Create: `ui/src/stores/websocket.ts`

- [ ] **Step 1:** 创建 WebSocket 连接 store (zustand)
- [ ] **Step 2:** 创建角色上下文 store
- [ ] **Step 3:** 创建认证 store
- [ ] **Step 4:** 创建数据 store
- [ ] **Step 5:** 创建 UI 状态 store

---

## Phase 2: 核心布局

### Task 5: 创建核心布局组件

**Files:**
- Create: `ui/src/components/layout/AppLayout.tsx`
- Create: `ui/src/components/layout/AppHeader.tsx`
- Create: `ui/src/components/layout/AppSidebar.tsx`
- Create: `ui/src/components/layout/RoleSwitcher.tsx`
- Create: `ui/src/components/layout/SmartRecommendationBar.tsx`

- [ ] **Step 1:** 创建 AppLayout 主布局（侧边栏 + 顶部栏 + 内容区）
- [ ] **Step 2:** 创建 AppHeader 含角色切换器和通知
- [ ] **Step 3:** 创建 AppSidebar 含角色中心导航
- [ ] **Step 4:** 创建 RoleSwitcher 角色切换下拉组件
- [ ] **Step 5:** 创建 SmartRecommendationBar 智能推荐条

---

## Phase 3: 角色指挥台

### Task 6: 创建角色指挥台三合一组件

**Files:**
- Create: `ui/src/components/commander/RoleCommander.tsx`
- Create: `ui/src/components/commander/RaciTaskSection.tsx`
- Create: `ui/src/components/commander/RoleMetricsSection.tsx`
- Create: `ui/src/components/commander/RoleCollaborationSection.tsx`
- Create: `ui/src/components/commander/RoleHeader.tsx`

- [ ] **Step 1:** 创建 RoleCommander 主容器（根据角色动态布局）
- [ ] **Step 2:** 创建 RaciTaskSection (R/A/C/I 四卡片)
- [ ] **Step 3:** 创建 RoleMetricsSection (KPI 指标卡片 + 迷你图)
- [ ] **Step 4:** 创建 RoleCollaborationSection (讨论/请求/任务)
- [ ] **Step 5:** 创建 RoleHeader (角色头像 + 名称 + 操作按钮)

---

### Task 7: 创建安全可视化组件

**Files:**
- Create: `ui/src/components/visualizations/MitreHeatmap.tsx`
- Create: `ui/src/components/visualizations/SecurityScoreGauge.tsx`
- Create: `ui/src/components/visualizations/ThreatTimeline.tsx`
- Create: `ui/src/components/visualizations/VulnerabilityChart.tsx`
- Create: `ui/src/components/visualizations/ExpertiseRadar.tsx`
- Create: `ui/src/components/visualizations/SparkLine.tsx`

- [ ] **Step 1:** 创建 MITRE ATT&CK 热力图 (Recharts)
- [ ] **Step 2:** 创建安全评分仪表盘
- [ ] **Step 3:** 创建威胁时间线
- [ ] **Step 4:** 创建漏洞分布图
- [ ] **Step 5:** 创建技能雷达图
- [ ] **Step 6:** 创建迷你趋势线 (SparkLine)

---

## Phase 4: 业务页面迁移

### Task 8: 创建 Dashboard 首页

**Files:**
- Create: `ui/src/pages/Dashboard.tsx`
- Create: `ui/src/pages/LoginPage.tsx`

- [ ] **Step 1:** 创建 Dashboard 首页（统一总览 + 角色指挥台双模式）
- [ ] **Step 2:** 创建登录页

---

### Task 9: 创建安全运营页面

**Files:**
- Create: `ui/src/pages/IncidentsPage.tsx`
- Create: `ui/src/pages/VulnerabilitiesPage.tsx`
- Create: `ui/src/pages/ThreatsPage.tsx`
- Create: `ui/src/pages/CompliancePage.tsx`

- [ ] **Step 1:** 创建安全事件页面
- [ ] **Step 2:** 创建漏洞管理页面
- [ ] **Step 3:** 创建威胁情报页面
- [ ] **Step 4:** 创建合规管理页面

---

### Task 10: 创建高级功能页面

**Files:**
- Create: `ui/src/pages/WarRoomPage.tsx`
- Create: `ui/src/pages/AIExpertsPage.tsx`
- Create: `ui/src/pages/KnowledgeBasePage.tsx`
- Create: `ui/src/pages/SkillsMarketPage.tsx`
- Create: `ui/src/pages/ChannelsPage.tsx`
- Create: `ui/src/pages/SettingsPage.tsx`

- [ ] **Step 1:** 创建作战室页面
- [ ] **Step 2:** 创建 AI 专家页面
- [ ] **Step 3:** 创建知识库页面
- [ ] **Step 4:** 创建技能市场页面
- [ ] **Step 5:** 创建频道管理页面
- [ ] **Step 6:** 创建设置页面

---

## Phase 5: 清理

### Task 11: 删除旧 Lit 代码

**Files:**
- Delete: 所有 `ui/src/ui/` 目录下的 `.ts` 文件（Lit 组件）
- Delete: `ui/src/ui/` 目录
- Clean: package.json 中 Lit 依赖

- [ ] **Step 1:** 确认新 React UI 完全可用
- [ ] **Step 2:** 删除 `ui/src/ui/` 整个目录
- [ ] **Step 3:** 清理 package.json 残留 Lit 依赖
- [ ] **Step 4:** 更新 openspec/config.yaml 的 Tech Stack 描述

---

## 实施检查清单

- [ ] Task 1: React 脚手架 + 依赖
- [ ] Task 2: shadcn/ui 组件库
- [ ] Task 3: 角色主题系统
- [ ] Task 4: Zustand Store 层
- [ ] Task 5: 核心布局
- [ ] Task 6: 角色指挥台
- [ ] Task 7: 安全可视化组件
- [ ] Task 8: Dashboard + Login
- [ ] Task 9: 安全运营页面
- [ ] Task 10: 高级功能页面
- [ ] Task 11: 清理旧代码
