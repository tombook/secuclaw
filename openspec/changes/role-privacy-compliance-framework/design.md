# 隐私合规框架管理 — 设计

## 架构
新增Privacy模块，与现有Compliance页面协同。Privacy是Compliance的子域但需要独立的PIA工作流和数据分类。

## 数据模型
```
PrivacyFramework { id, name(GDPR/PIPL/CCPA), articles[], controls[] }
PIA { id, projectId, status, dataTypes[], riskLevel, mitigations[], approver }
DataClassification { id, dataType, sensitivityLevel, protectionMeasures[], retention }
SubjectRequest { id, type(access/delete/portability), status, deadline, response }
```

## 数据流
1. `privacy.frameworks` → 框架列表+条款
2. `privacy.pia.create/list/update/approve` → PIA生命周期
3. `privacy.classification.list/create` → 数据分类CRUD
4. `privacy.subjectRequests.list/create/fulfill` → 权利请求管理
5. `privacy.consent.stats` → 同意管理统计

## 文件变更
- 新增 privacy-service.ts, privacy-routes.ts
- 新增 sc-privacy-page.ts(标签页: 框架/PIA/分类/权利/同意)
- compliance-page.ts 增加"隐私"标签入口
- data-service.ts 增加 8个privacy方法

## 约束
- GDPR条款映射到SCF控制(已有knowledge.scf)
- PIA状态机: draft → review → approved → archived
- 数据敏感级别: public/internal/confidential/restricted
