# 威胁情报集成 — 设计

## 架构
新增ThreatIntel模块，作为现有Threats域的扩展。集成MITRE ATT&CK知识库(已有knowledge.mitre)，增加IOC管理和情报源配置。

## 数据模型
```
IntelSource { id, name, type(MISP/OpenCTI/API), url, apiKey, enabled, lastSync, status }
IOC { id, type(IP/domain/hash/url/email), value, threatLevel, source, firstSeen, lastSeen, relatedThreats[] }
ThreatHunt { id, name, iocQuery, status, findings[], assignee, created }
```

## 数据流
1. `threat-intel.sources.list/configure/sync` → 情报源管理
2. `threat-intel.iocs.list/create/import/export` → IOC指标库
3. `threat-intel.iocs.match` → IOC与资产/漏洞/事件匹配
4. `threat-intel.mitre.heatmap` → MITRE覆盖热力图
5. `threat-intel.hunts.create/list` → 威胁狩猎任务

## 文件变更
- 新增 threat-intel-service.ts, threat-intel-routes.ts
- 新增 sc-threat-intel-page.ts(标签: 源/IOC/匹配/热力图/狩猎)
- threats-page.ts 增加情报关联标签
- knowledge-base-page.ts MITRE热力图增强
- data-service.ts 增加 8个threatIntel方法

## 约束
- IOC匹配算法: 精确匹配IP/域名 + 模糊匹配哈希前缀
- MITRE热力图数据来自已有knowledge.mitre API
- 情报源初始模拟数据(不实际调用外部API)
