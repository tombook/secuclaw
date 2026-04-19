## Capability: vuln-asset-correlation

漏洞与资产的双向关联管理。

### Requirements

- **REQ-1**: 用户可在漏洞详情中查看关联的资产列表
- **REQ-2**: 用户可手动将漏洞关联到一个或多个资产（调用 `vulnerabilities.linkAsset`）
- **REQ-3**: 用户可解除漏洞与资产的关联（调用 `vulnerabilities.unlinkAsset`）
- **REQ-4**: 用户可按资产 ID 查询该资产关联的所有漏洞（调用 `vulnerabilities.findByAssetId`）
- **REQ-5**: 用户可通过 CVE ID 精确查找漏洞（调用 `vulnerabilities.getByVulnId`）
- **REQ-6**: 用户可筛选"活跃漏洞"（调用 `vulnerabilities.active`）
- **REQ-7**: 用户可批量选择漏洞并统一更新状态（调用 `vulnerabilities.batchUpdateStatus`）
- **REQ-8**: 所有操作需 `vulnerabilities.update` 权限
- **REQ-9**: 批量操作前需二次确认，显示影响数量

### Affected Roles
- security-expert: 主要使用者，负责漏洞管理和关联分析
- security-ops: 使用活跃漏洞筛选和批量状态更新进行运营
- secuclaw-commander: 通过资产维度查看关联漏洞进行全局态势感知
