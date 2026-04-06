# SecuClaw 团队任务指南

> 更新时间: 2026-04-03

---

## 📋 当前任务状态

| 团队 | 任务 | 状态 |
|------|------|------|
| **software-dev** | 9项 | ✅ 全部完成 |
| **shared-services** | 2项 | ⏳ 待开始 |
| **security-startup** | 2项 | ⏳ 待开始 |
| **sec-vuln-research** | 3项 | ⏳ 待开始 |

---

## 🔵 shared-services 团队任务

### AI-001~004: AI 基础设施
- **任务ID**: t100015 (guid: 34626a00-50ad-4ad8-93fa-273fe09b7d95)
- **内容**: 洞察引擎、异常检测、趋势预测、AI助手组件
- **依赖**: 后端 API 框架已完成
- **执行**: 调用 `ai-routes.ts` 中的 AI 服务

### AI-005~007: 漏洞修复建议/威胁情报/事件摘要
- **任务ID**: t100015 (guid: 6d24cd7f-20b0-4dbc-8d63-887f09b88152)
- **内容**: AI 驱动的漏洞修复建议、威胁情报分析、安全事件摘要

---

## 🟢 security-startup 团队任务

### ARCH-001~002: AI助手 + 智能卡片组件设计
- **任务ID**: (guid: 76aa3698-e7ef-46db-91df-07c9af891f46)
- **内容**: 设计 SecuClaw 专用 AI助手组件、智能卡片组件
- **参考**: `ui/src/ui/components/` 目录

### ARCH-003~004: 数据表格/KPI组件设计
- **任务ID**: t100011 (guid: cc571419-6bbc-4d52-835a-f76cd8186264)
- **内容**: 通用数据表格组件、KPI 指标卡组件
- **参考**: `ui/src/ui/components/` 目录

---

## 🔴 sec-vuln-research 团队任务

### SKILL-001~003: nmap/sqlmap/nuclei 技能包适配
- **任务ID**: t100009 (guid: 66595152-3bc8-464c-b704-2e0ee05d40c6)
- **内容**: 将 nmap、sqlmap、nuclei 适配到 SecuClaw Skills 系统
- **参考**: `skills/` 目录结构

### QA-004~006: 性能/安全/兼容性测试
- **任务ID**: t100010 (guid: 5ed88fa2-8446-45ae-9d58-5caca3ebff47)
- **内容**: 性能测试、安全测试、兼容性测试

---

## 🚀 后端运行状态

```
WebSocket Gateway: ws://127.0.0.1:21981/ws
REST API: http://127.0.0.1:21982/api/v1
Frontend: http://localhost:3000
```

---

## 📞 团队切换

在群里 @ 对应机器人即可切换到对应团队对话：
- `@shared-services` → shared-services 团队
- `@security-startup` → security-startup 团队
- `@sec-vuln-research` → sec-vuln-research 团队
