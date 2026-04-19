---
name: security-tools-catalog
description: 安全工具技能目录 - 收录100+开源与商业安全工具API，支持漏洞扫描、威胁情报、渗透测试、云安全、代码审计等能力的标准化接入
homepage: https://github.com/secuclaw
metadata:
  openclaw:
    emoji: "🔧"
    role: TOOLS
    combination: single
    version: "1.0.0"
    capabilities:
      light:
        - 漏洞管理
        - 配置核查
        - 合规扫描
        - 资产发现
        - 补丁管理
        - 事件响应
        - 日志分析
        - 告警处置
      dark:
        - 渗透测试
        - 漏洞利用
        - 社工攻击
        - 无线破解
        - 逆向工程
        - 恶意软件分析
        - 数字取证
        - 红队演练
      security:
        - 威胁检测
        - 入侵防御
        - 数据加密
        - 身份认证
        - 访问控制
        - 安全审计
        - 风险评估
        - 应急响应
      legal:
        - GDPR合规
        - 等保测评
        - 数据保护
        - 隐私合规
      technology:
        - 云安全
        - 容器安全
        - DevSecOps
        - API安全
        - 零信任架构
      business:
        - 风险量化
        - 合规报表
        - 供应链安全
        - 安全运营
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0002-Execution"
      - "TA0003-Persistence"
      - "TA0004-Privilege Escalation"
      - "TA0005-Defense Evasion"
      - "TA0006-Credential Access"
      - "TA0007-Discovery"
      - "TA0008-Lateral Movement"
      - "TA0009-Collection"
      - "TA0010-Exfiltration"
      - "TA0011-Command and Control"
    scf_coverage:
      - "RA-Risk Assessment"
      - "SI-System and Information Integrity"
      - "SC-Systems and Communications Protection"
      - "AC-Access Control"
      - "AU-Audit and Accountability"
      - "IR-Incident Response"
      - "CM-Configuration Management"
---

# 安全工具技能目录

本文档收录100+种开源与商业安全工具的API信息，支持接入SecuClaw技能市场。

## 一、漏洞扫描与评估

### 1.1 开源工具

#### 1. OpenVAS (Greenbone Vulnerability Scanner)
- **类型**: 开源 (GPL)
- **API**: Greenbone OpenVAS REST API / OSP (Open Scanner Protocol)
- **端点**: `https://openvas-host:9390/api`
- **功能**: 漏洞扫描、资产发现、配置审计
- **认证**: 用户名/密码 + Token
- **MITRE映射**: T1046 网络服务扫描, T1499 终端拒绝服务

#### 2. Nessus
- **类型**: 商业
- **API**: Nessus REST API v2
- **端点**: `https://nessus-host:8834/api/v2`
- **功能**: 漏洞扫描、合规检查、配置审计
- **认证**: Access Key / Secret Key
- **MITRE映射**: T1046 网络服务扫描, T1499 终端拒绝服务

#### 3. Qualys Vulnerability Management
- **类型**: 商业 (SaaS)
- **API**: Qualys VMDR API
- **端点**: `https://qualysapi.qualys.com/api/2.0/fo/`
- **功能**: 漏洞管理、资产发现、补丁管理
- **认证**: 用户名/密码 + X-Requested-With header
- **MITRE映射**: T1046 网络服务扫描

#### 4. Rapid7 InsightVM
- **类型**: 商业
- **API**: Rapid7 Nexpose API v3
- **端点**: `https://InsightVM-Host:37893/api/3`
- **功能**: 漏洞扫描、风险评分、修复优先级
- **认证**: 用户名/密码 + Session Token
- **MITRE映射**: T1046 网络服务扫描, T1499 终端拒绝服务

#### 5. OpenSCAP
- **类型**: 开源 (LGPL)
- **API**: SCAP Workbench CLI / oscap CLI
- **端点**: 本地CLI工具
- **功能**: 安全配置核查、CVE检查、合规报告
- **认证**: 无需认证
- **MITRE映射**: T1046 网络服务扫描, T1499 终端拒绝服务

#### 6. GVM (Greenbone Vulnerability Management)
- **类型**: 开源 (AGPL)
- **API**: GVM REST API / GMP (Greenbone Management Protocol)
- **端点**: `https://gvmd-host:9390/api`
- **功能**: 漏洞扫描、威胁情报、资产关联
- **认证**: 用户名/密码 + Token
- **MITRE映射**: T1046 网络服务扫描

#### 7. Tripwire IP360
- **类型**: 商业
- **API**: Tripwire API
- **端点**: `https://tripwire-host:7443/api/v1/`
- **功能**: 配置评估、文件完整性监控、漏洞关联
- **认证**: API Token
- **MITRE映射**: T1036 隐藏, T1041 通过可移动介质窃取

#### 8. Tenable.io (Tenable Cloud)
- **类型**: 商业 (SaaS)
- **API**: Tenable.io API
- **端点**: `https://cloud.tenable.com/api/v4.0`
- **功能**: 云漏洞管理、资产发现、容器扫描
- **认证**: Access Key / Secret Key
- **MITRE映射**: T1046 网络服务扫描

### 1.2 商业工具

#### 9. Tenable Nessus Expert
- **类型**: 商业
- **API**: Tenable Nessus REST API
- **端点**: `https://nessus-host:8834/api`
- **功能**: Web应用扫描、供应链审查、配置审计
- **认证**: Access Key / Secret Key
- **MITRE映射**: T1046 网络服务扫描

#### 10. Qualys Container Security
- **类型**: 商业 (SaaS)
- **API**: Qualys CS API
- **端点**: `https://container-security.qualys.com/api/v2.0/`
- **功能**: 容器镜像扫描、Kubernetes审计、运行时保护
- **认证**: OAuth 2.0
- **MITRE映射**: T1525 植入容器镜像, T1611 逃逸宿主机

## 二、威胁情报平台 (TIP)

### 2.1 开源工具

#### 11. MISP (Malware Information Sharing Platform)
- **类型**: 开源 (AGPL)
- **API**: MISP REST API v2
- **端点**: `https://misp-host/api/arc2/events`
- **功能**: 威胁情报共享、IOC存储、属性分析
- **认证**: 认证密钥 / MISP对象
- **MITRE映射**: T1040 协议链路窃取, T1053 计划任务

#### 12. OpenCTI
- **类型**: 开源 (Apache 2.0)
- **API**: OpenCTI GraphQL API
- **端点**: `https://opencti-host/graphql`
- **功能**: 威胁情报管理、知识图谱、动态分析
- **认证**: Bearer Token / API Key
- **MITRE映射**: T1040 协议链路窃取

#### 13. Abuse.ch Feefty
- **类型**: 开源
- **API**: Feefty API
- **端点**: `https://feefly.io/api/v1/`
- **功能**: 恶意软件追踪、URL分析、主机信息
- **认证**: API Key
- **MITRE映射**: T1102 隐藏服务, T1071 应用层协议

#### 14. AlienVault OTX (Open Threat Exchange)
- **类型**: 开源/商业
- **API**: AlienVault OTX REST API v2
- **端点**: `https://otx.alienvault.com/api/v1/`
- **功能**: 脉冲订阅、IOC查询、地理情报
- **认证**: API Key
- **MITRE映射**: T1040 协议链路窃取

#### 15. ThreatConnect
- **类型**: 商业
- **API**: ThreatConnect API v3
- **端点**: `https://app.threatconnect.com/api/v3/`
- **功能**: 威胁情报分析、编排自动化、第三方集成
- **认证**: API Token
- **MITRE映射**: T1040 协议链路窃取, T1053 计划任务

### 2.2 商业工具

#### 16. VirusTotal
- **类型**: 商业 (有免费配额)
- **API**: VirusTotal API v3
- **端点**: `https://www.virustotal.com/api/v3/`
- **功能**: 文件分析、URL扫描、IP/域名查询、关系图谱
- **认证**: API Key
- **MITRE映射**: T1105 入口工具转移, T1071 应用层协议

#### 17. Shodan
- **类型**: 商业 (有免费配额)
- **API**: Shodan REST API
- **端点**: `https://api.shodan.io/api/v2.0/`
- **功能**: 网络空间测绘、设备搜索、漏洞搜索
- **认证**: API Key
- **MITRE映射**: T1046 网络服务扫描, T1595 主动搜索

#### 18. GreyNoise
- **类型**: 商业
- **API**: GreyNoise API v1
- **端点**: `https://api.greynoise.io/v4/`
- **功能**: 互联网背景噪音分析、威胁分类、IP信誉
- **认证**: API Key
- **MITRE映射**: T1040 协议链路窃取

#### 19. Recorded Future
- **类型**: 商业
- **API**: Recorded Future API v2
- **端点**: `https://api.recordedfuture.com/v2/`
- **功能**: 威胁情报分析、风险评分、漏洞预测
- **认证**: API Token
- **MITRE映射**: T1040 协议链路窃取

#### 20. CrowdStrike Threat Intelligence
- **类型**: 商业
- **API**: CrowdStrike Falcon Horizon API
- **端点**: `https://api.crowdstrike.com/intel/graphql`
- **功能**: 威胁情报订阅、攻击者画像、MITRE映射
- **认证**: Client ID / Secret
- **MITRE映射**: T1040 协议链路窃取

## 三、渗透测试与红队工具

### 3.1 开源工具

#### 21. Metasploit Framework
- **类型**: 开源 (BSD)
- **API**: Metasploit REST API
- **端点**: `https://msf-host:3790/api/v1/`
- **功能**: 漏洞利用、模块开发、后渗透测试
- **认证**: Bearer Token
- **MITRE映射**: T1053 计划任务, T1068 漏洞利用提权

#### 22. Burp Suite Professional
- **类型**: 商业
- **API**: Burp Suite REST API
- **端点**: `http://burp-host:1337/v0.1/`
- **功能**: Web应用渗透测试、漏洞扫描、Intruder攻击
- **认证**: API Key
- **MITRE映射**: T1053 计划任务, T1071 应用层协议

#### 23. OWASP ZAP (Zed Attack Proxy)
- **类型**: 开源 (Apache 2.0)
- **API**: ZAP REST API
- **端点**: `http://zap-host:8090/UI/`
- **功能**: Web应用扫描、主动扫描、被动扫描
- **认证**: API Key
- **MITRE映射**: T1053 计划任务, T1071 应用层协议

#### 24. SQLMap
- **类型**: 开源 (GPL)
- **API**: 无REST API (CLI工具)
- **端点**: 本地CLI
- **功能**: SQL注入检测与利用
- **认证**: 无
- **MITRE映射**: T1053 计划任务, T1071 应用层协议

#### 25. Nmap
- **类型**: 开源 (GPL)
- **API**: python-nmap / libnmap
- **端点**: 本地CLI
- **功能**: 端口扫描、服务发现、操作系统检测
- **认证**: 无
- **MITRE映射**: T1046 网络服务扫描, T1016 系统网络配置发现

#### 26. Nikto
- **类型**: 开源 (GPL)
- **API**: 无REST API (CLI工具)
- **端点**: 本地CLI
- **功能**: Web服务器扫描、危险文件检测
- **认证**: 无
- **MITRE映射**: T1046 网络服务扫描, T1016 系统网络配置发现

#### 27. Recon-ng
- **类型**: 开源 (GPL)
- **API**: REST API模块
- **端点**: 本地CLI
- **功能**: Web侦察、信息收集、域名发现
- **认证**: API Keys (多服务)
- **MITRE映射**: T1016 系统网络配置发现, T1595 主动搜索

#### 28. theHarvester
- **类型**: 开源 (GPL)
- **API**: CLI工具
- **端点**: 本地CLI
- **功能**: 邮件地址、子域名、虚拟主机收集
- **认证**: 无
- **MITRE映射**: T1016 系统网络配置发现, T1595 主动搜索

### 3.2 商业工具

#### 29. Cobalt Strike
- **类型**: 商业
- **API**: Cobalt Strike REST API
- **端点**: `https://cobaltstrike-host:50050/api/v1/`
- **功能**: 渗透测试框架、Beacon C2、钓鱼模拟
- **认证**: 团队服务器凭证
- **MITRE映射**: T1053 计划任务, T1071 应用层协议

#### 30. Core Impact
- **类型**: 商业
- **API**: Core Impact REST API
- **端点**: `https://core-impact-host:7443/api/v1/`
- **功能**: 漏洞利用、植入物管理、后渗透
- **认证**: API Token
- **MITRE映射**: T1053 计划任务, T1068 漏洞利用提权

#### 31. Immunity Canvas
- **类型**: 商业
- **API**: Canvas REST API
- **端点**: `https://canvas-host:8443/api/`
- **功能**: 漏洞利用开发、0day研究
- **认证**: 许可证密钥
- **MITRE映射**: T1053 计划任务, T1068 漏洞利用提权

## 四、安全信息和事件管理 (SIEM)

### 4.1 开源工具

#### 32. Elastic SIEM (ELK Stack)
- **类型**: 开源 (Apache 2.0)
- **API**: Elasticsearch REST API
- **端点**: `https://elastic-host:9200/_search`
- **功能**: 日志收集、告警分析、可视化
- **认证**: Basic Auth / API Key / OAuth
- **MITRE映射**: T1070 清除日志, T1047 Windows管理工具

#### 33. Wazuh
- **类型**: 开源 (GPL)
- **API**: Wazuh REST API v4.4
- **端点**: `https://wazuh-host:55000/api/v4.0/`
- **功能**: 端点检测、日志分析、威胁响应
- **认证**: 角色/用户 + 密码
- **MITRE映射**: T1070 清除日志, T1047 Windows管理工具

#### 34. Security Onion
- **类型**: 开源 (GPL)
- **API**: Elasticsearch / Kibana / SOC Workflow
- **端点**: `https://securityonion-host:9200/`
- **功能**: 网络安全监控、IDS/IPS、完整数据包捕获
- **认证**: Basic Auth / Cert
- **MITRE映射**: T1040 协议链路窃取, T1070 清除日志

#### 35. Apache Metron (Incubating)
- **类型**: 开源 (Apache 2.0)
- **API**: REST API
- **端点**: `https://metron-host:8080/api/v1/`
- **功能**: 安全分析、实时告警、威胁情报整合
- **认证**: Kerberos / Basic Auth
- **MITRE映射**: T1040 协议链路窃取

### 4.2 商业工具

#### 36. Splunk Enterprise Security
- **类型**: 商业
- **API**: Splunk REST API v2
- **端点**: `https://splunk-host:8089/services/search/jobs`
- **功能**: 日志管理、威胁检测、安全分析
- **认证**: Bearer Token / Basic Auth
- **MITRE映射**: T1070 清除日志, T1047 Windows管理工具

#### 37. IBM QRadar
- **类型**: 商业
- **API**: QRadar REST API v7
- **端点**: `https://qradar-host:443/api/ariel/searchjobs`
- **功能**: 威胁检测、事件分析、合规报告
- **认证**: SEC Token / Basic Auth
- **MITRE映射**: T1070 清除日志, T1047 Windows管理工具

#### 38. Microsoft Azure Sentinel
- **类型**: 商业 (SaaS)
- **API**: Azure Monitor / Log Analytics API
- **端点**: `https://management.azure.com/subscriptions/{subId}/resourcegroups/{rg}/providers/Microsoft.OperationalInsights/workspaces/{ws}/api/query`
- **功能**: 云SIEM、威胁检测、事件自动化响应
- **认证**: Azure AD OAuth 2.0
- **MITRE映射**: T1070 清除日志, T1053 计划任务

#### 39. Google Chronicle
- **类型**: 商业 (SaaS)
- **API**: Chronicle REST API
- **端点**: `https://backstory.googleapis.com/v1/`
- **功能**: 安全分析、日志存储、威胁追溯
- **认证**: Service Account / API Key
- **MITRE映射**: T1070 清除日志, T1040 协议链路窃取

#### 40. Splunk SOAR (Phantom)
- **类型**: 商业
- **API**: Phantom REST API v3
- **端点**: `https://phantom-host/rest/`
- **功能**: 安全编排自动化响应、剧本执行
- **认证**: Username / Password + 2FA
- **MITRE映射**: T1053 计划任务, T1047 Windows管理工具

## 五、端点安全

### 5.1 开源工具

#### 41. osquery
- **类型**: 开源 (BSD)
- **API**: osqueryi CLI / Thrift RPC / HTTP REST API
- **端点**: `http://osquery-host:48000/api/v1/query`
- **功能**: 端点检测查询、文件完整性、用户监控
- **认证**: Invalid Pack
- **MITRE映射**: T1016 系统网络配置发现, T1053 计划任务

#### 42. Wazuh Agent
- **类型**: 开源 (GPL)
- **API**: Agent->Manager RSA加密通信
- **端点**: Manager: `55000/tcp`
- **功能**: 文件完整性监控、注册表监控、Rootkit检测
- **认证**: Agent密钥
- **MITRE映射**: T1069 权限组发现, T1053 计划任务

#### 43. Velociraptor
- **类型**: 开源 (Apache 2.0)
- **API**: Velociraptor REST API / VQL
- **端点**: `https://vr-host:8000/api/v0/`
- **功能**: 数字取证、终端检测、威胁狩猎
- **认证**: 客户端证书 / 用户认证
- **MITRE映射**: T1016 系统网络配置发现, T1053 计划任务

### 5.2 商业工具

#### 44. CrowdStrike Falcon
- **类型**: 商业 (SaaS)
- **API**: CrowdStrike Falcon API v2
- **端点**: `https://api.crowdstrike.com/api/v2/`
- **功能**: 端点保护、威胁狩猎、事件响应
- **认证**: Client ID / Secret / OAuth 2.0
- **MITRE映射**: T1053 计划任务, T1070 清除日志

#### 45. Carbon Black Response (VMware CB Defense)
- **类型**: 商业
- **API**: Carbon Black API v5
- **端点**: `https://defense-prod05.cbdq.io/api/v5/`
- **功能**: 终端检测响应(EDR)、应用控制、威胁响应
- **认证**: API Secret Key / Org Key
- **MITRE映射**: T1053 计划任务, T1070 清除日志

#### 46. SentinelOne
- **类型**: 商业
- **API**: SentinelOne REST API v2
- **端点**: `https://#SentinelOne-Host/api/v2.1/`
- **功能**: 端点保护、自动化响应、威胁狩猎
- **认证**: Token
- **MITRE映射**: T1053 计划任务, T1070 清除日志

#### 47. Microsoft Defender for Endpoint
- **类型**: 商业 (SaaS)
- **API**: Microsoft Graph API / Defender ATP API
- **端点**: `https://api.securitycenter.microsoft.com/api/`
- **功能**: 端点检测响应(EDR)、威胁分析、自动修复
- **认证**: Azure AD OAuth 2.0
- **MITRE映射**: T1053 计划任务, T1070 清除日志

#### 48. Palo Alto Cortex XDR
- **类型**: 商业
- **API**: Cortex XDR API v2
- **端点**: `https://xdr-host/api/v1/`
- **功能**: 网络检测响应、端点检测、用户行为分析
- **认证**: API Key + XSRF Token
- **MITRE映射**: T1053 计划任务, T1070 清除日志

## 六、容器与云安全

### 6.1 开源工具

#### 49. Trivy
- **类型**: 开源 (Apache 2.0)
- **API**: Trivy CLI / Server Mode REST API
- **端点**: `http://trivy-host:8080/`
- **功能**: 容器镜像扫描、漏洞检测、密钥检测
- **认证**: 无 (Server模式支持认证)
- **MITRE映射**: T1525 植入容器镜像, T1070 清除日志

#### 50. Anchore
- **类型**: 开源 (Apache 2.0)
- **API**: Anchore Enterprise API v2
- **端点**: `https://anchore-host:8228/v2/`
- **功能**: 镜像分析、合规检查、策略评估
- **认证**: Basic Auth / API Token
- **MITRE映射**: T1525 植入容器镜像

#### 51. Clair
- **类型**: 开源 (Apache 2.0)
- **API**: Clair REST API v1
- **端点**: `http://clair-host:6060/`
- **功能**: 容器漏洞静态分析
- **认证**: 无
- **MITRE映射**: T1525 植入容器镜像

#### 52. Dagda
- **类型**: 开源 (GPL)
- **API**: Dagda REST API
- **端点**: `http://dagda-host:5000/api/`
- **功能**: 容器安全分析、恶意软件检测
- **认证**: 无
- **MITRE映射**: T1525 植入容器镜像, T1070 清除日志

#### 53. Falco
- **类型**: 开源 (Apache 2.0)
- **API**: Falco gRPC API / Sidekick
- **端点**: `http://falco-host:5060/`
- **功能**: 容器运行时安全监控、异常行为检测
- **认证**: Client Cert
- **MITRE映射**: T1053 计划任务, T1070 清除日志

### 6.2 商业工具

#### 54. Prisma Cloud (Palo Alto)
- **类型**: 商业 (SaaS)
- **API**: Prisma Cloud API
- **端点**: `https://api.prismacloud.io/`
- **功能**: 云安全态势管理(CSPM)、合规检查、运行时保护
- **认证**: Access Key / Secret Key / JWT
- **MITRE映射**: T1525 植入容器镜像, T1070 清除日志

#### 55. Wiz
- **类型**: 商业 (SaaS)
- **API**: Wiz API v1
- **端点**: `https://api.wiz.io/graphql`
- **功能**: 云安全态势管理、容器安全、无服务器安全
- **认证**: Bearer Token
- **MITRE映射**: T1525 植入容器镜像, T1070 清除日志

#### 56. Orca Security
- **类型**: 商业 (SaaS)
- **API**: Orca API
- **端点**: `https://api.orcasecurity.io/api/v1/`
- **功能**: 云资产发现、漏洞检测、合规评估
- **认证**: API Token
- **MITRE映射**: T1525 植入容器镜像, T1070 清除日志

#### 57. Snyk
- **类型**: 商业 (有免费配额)
- **API**: Snyk REST API v1
- **端点**: `https://api.snyk.io/v1/`
- **功能**: 容器镜像扫描、代码漏洞检测、依赖项分析
- **认证**: API Token / Service Account
- **MITRE映射**: T1525 植入容器镜像, T1070 清除日志

#### 58. Aqua Security
- **类型**: 商业
- **API**: Aqua Security REST API
- **端点**: `https://aqua-host:8080/api/v1/`
- **功能**: 容器安全、运行时保护、微服务防火墙
- **认证**: User / Password / API Key
- **MITRE映射**: T1525 植入容器镜像, T1070 清除日志

## 七、代码安全与DevSecOps

### 7.1 开源工具

#### 59. SonarQube
- **类型**: 开源 (LGPL)
- **API**: SonarQube Web API
- **端点**: `https://sonarqube-host/api/ce/`
- **功能**: 代码质量检测、安全漏洞扫描、代码重复率
- **认证**: User / Password / Token
- **MITRE映射**: T1070 清除日志, T1053 计划任务

#### 60. Semgrep
- **类型**: 开源 (GPL)
- **API**: Semgrep App API
- **端点**: `https://api.semgrep.dev/v1/`
- **功能**: 静态应用安全测试(SAST)、自定义规则
- **认证**: API Token
- **MITRE映射**: T1070 清除日志

#### 61. Bandit
- **类型**: 开源 (Apache 2.0)
- **API**: CLI工具
- **端点**: 本地CLI
- **功能**: Python代码安全分析
- **认证**: 无
- **MITRE映射**: T1070 清除日志

#### 62. Snyk Open Source (CLI)
- **类型**: 开源/商业
- **API**: Snyk CLI / REST API
- **端点**: `https://api.snyk.io/v1/`
- **功能**: 开源依赖漏洞检测、许可证合规
- **认证**: API Token
- **MITRE映射**: T1070 清除日志

#### 63. Checkmarx SAST
- **类型**: 商业
- **API**: Checkmarx OData API / REST API
- **端点**: `https://checkmarx-host/cxrestapi/`
- **功能**: 代码安全分析、漏洞追踪、合规报告
- **认证**: SSO / API Key / Basic Auth
- **MITRE映射**: T1070 清除日志, T1053 计划任务

### 7.2 商业工具

#### 64. Veracode
- **类型**: 商业 (SaaS)
- **API**: Veracode REST API v3
- **端点**: `https://analysiscenter.veracode.com/api/3.0/`
- **功能**: SAST/DAST/ SCA组合分析、移动应用测试
- **认证**: API ID / Key
- **MITRE映射**: T1070 清除日志, T1053 计划任务

#### 65. Contrast Security
- **类型**: 商业
- **API**: Contrast REST API
- **端点**: `https://app.contrastsecurity.com/ContrastAPI/api/`
- **功能**: 运行时应用自保护(RASP)、IAST
- **认证**: API Key / Basic Auth
- **MITRE映射**: T1070 清除日志, T1053 计划任务

#### 66. Synopsys Coverity
- **类型**: 商业
- **API**: Coverity Connect REST API
- **端点**: `https://coverity-host/api/`
- **功能**: 代码缺陷检测、安全漏洞分析
- **认证**: User / Password
- **MITRE映射**: T1070 清除日志, T1053 计划任务

## 八、网络安全与IDS/IPS

### 8.1 开源工具

#### 67. Suricata
- **类型**: 开源 (GPL)
- **API**: REST API + Unix Socket
- **端点**: `http://suricata-host:5001/`
- **功能**: IDS/IPS、网络安全监控、日志分析
- **认证**: Basic Auth (可选)
- **MITRE映射**: T1040 协议链路窃取, T1070 清除日志

#### 68. Zeek (formerly Bro)
- **类型**: 开源 (BSD)
- **API**: ZeekControl / JSON日志
- **端点**: `http://zeek-host:8080/`
- **功能**: 网络流量分析、协议解析、安全监控
- **认证**: 无
- **MITRE映射**: T1040 协议链路窃取, T1070 清除日志

#### 69. Snort
- **类型**: 开源 (GPL)
- **API**: Snort SOAP / Barnyard2
- **端点**: 本地CLI + unified2输出
- **功能**: 入侵检测系统、规则匹配
- **认证**: 无
- **MITRE映射**: T1040 协议链路窃取

#### 70. Wazuh (SIEM/Integration)
- **类型**: 开源 (GPL)
- **API**: Wazuh REST API
- **端点**: `https://wazuh-host:55000/api/v4.0/`
- **功能**: 日志聚合、告警关联、PCI DSS合规
- **认证**: 角色/用户 + JWT
- **MITRE映射**: T1040 协议链路窃取, T1070 清除日志

### 8.2 商业工具

#### 71. Cisco Secure Firewall (Firepower)
- **类型**: 商业
- **API**: Cisco Firepower Management Center API
- **端点**: `https://fmc-host/api/`
- **功能**: 下一代防火墙、入侵防御、URL过滤
- **认证**: API Token / Basic Auth
- **MITRE映射**: T1040 协议链路窃取, T1070 清除日志

#### 72. Palo Alto Networks NGFW
- **类型**: 商业
- **API**: PAN-OS API / Panorama API
- **端点**: `https://panorama-host/api/`
- **功能**: 下一代防火墙、威胁防御、SSL解密
- **认证**: API Key
- **MITRE映射**: T1040 协议链路窃取, T1070 清除日志

#### 73. Check Point Quantum
- **类型**: 商业
- **API**: Check Point Management API (R80+)
- **端点**: `https://checkpoint-host:443/web_api/`
- **功能**: 下一代防火墙、入侵防御、威胁防护
- **认证**: API Key / User Session
- **MITRE映射**: T1040 协议链路窃取, T1070 清除日志

## 九、邮件安全

### 9.1 开源工具

#### 74. Apache SpamAssassin
- **类型**: 开源 (Apache 2.0)
- **API**: spamd RPC / Pyzor / DCC
- **端点**: 本地CLI或spamc客户端
- **功能**: 邮件垃圾过滤、恶意软件检测
- **认证**: 无
- **MITRE映射**: T1070 清除日志

#### 75. MailScanner
- **类型**: 开源 (GPL)
- **API**: MailScanner.conf
- **端点**: 本地SMTP/MTA集成
- **功能**: 邮件病毒扫描、钓鱼检测、内容过滤
- **认证**: 无
- **MITRE映射**: T1070 清除日志

### 9.2 商业工具

#### 76. Proofpoint TAP (Targeted Attack Protection)
- **类型**: 商业 (SaaS)
- **API**: Proofpoint TAP API v2
- **端点**: `https://tap.proofpoint.com/api/v2/`
- **功能**: 钓鱼邮件分析、恶意软件检测、URL点击追踪
- **认证**: Service Principal / Secret
- **MITRE映射**: T1071 应用层协议, T1105 入口工具转移

#### 77. Mimecast
- **类型**: 商业 (SaaS)
- **API**: Mimecast API v2
- **端点**: `https://api.mimecast.com/api/`
- **功能**: 邮件归档、安全网关、威胁防护
- **认证**: Access Key / Secret Key
- **MITRE映射**: T1071 应用层协议

#### 78. Abnormal Security
- **类型**: 商业 (SaaS)
- **API**: Abnormal API
- **端点**: `https://api.abnormalsecurity.com/v1/`
- **功能**: 异常行为检测、商务邮件入侵(BEC)防护
- **认证**: API Token
- **MITRE映射**: T1071 应用层协议

## 十、身份与访问管理安全

### 10.1 开源工具

#### 79. OpenIAM
- **类型**: 开源 (GPL)
- **API**: OpenIAM REST API
- **端点**: `https://openiam-host:8080/openiam/`
- **功能**: 身份治理、访问管理、密码管理
- **认证**: SSO / Basic Auth / JWT
- **MITRE映射**: T1070 清除日志, T1053 计划任务

#### 80. Keycloak
- **类型**: 开源 (Apache 2.0)
- **API**: Keycloak Admin REST API
- **端点**: `https://keycloak-host:8443/auth/admin/realms/{realm}`
- **功能**: 身份认证授权、SSO、OAuth 2.0
- **认证**: Admin Token / Service Account
- **MITRE映射**: T1070 清除日志, T1053 计划任务

### 10.2 商业工具

#### 81. Okta
- **类型**: 商业 (SaaS)
- **API**: Okta API v1
- **端点**: `https://.okta.com/api/v1/`
- **功能**: 身份认证、生命周期管理、API访问管理
- **认证**: API Token / OAuth 2.0
- **MITRE映射**: T1070 清除日志, T1053 计划任务

#### 82. Microsoft Azure AD
- **类型**: 商业 (SaaS)
- **API**: Microsoft Graph API
- **端点**: `https://graph.microsoft.com/v1.0/`
- **功能**: 身份保护、条件访问、 Privileged Identity Management
- **认证**: Azure AD OAuth 2.0
- **MITRE映射**: T1070 清除日志, T1053 计划任务

#### 83. CyberArk PAM
- **类型**: 商业
- **API**: CyberArk REST API
- **端点**: `https://cyberark-host/api/`
- **功能**: 特权账户管理、密钥管理、会话监控
- **认证**: Authentication Token
- **MITRE映射**: T1070 清除日志, T1053 计划任务

## 十一、密码与密钥安全

### 11.1 开源工具

#### 84. HashiCorp Vault
- **类型**: 开源 (MPL 2.0) / 商业
- **API**: Vault HTTP API
- **端点**: `https://vault-host:8200/v1/`
- **功能**: 密钥管理、加密即服务、动态凭据
- **认证**: Token / AppRole / LDAP / Kubernetes
- **MITRE映射**: T1070 清除日志, T1053 计划任务

#### 85. Bitwarden
- **类型**: 开源/商业 (SaaS)
- **API**: Bitwarden Public API
- **端点**: `https://api.bitwarden.com/public/`
- **功能**: 密码管理、密码生成、安全共享
- **认证**: Client ID / Secret / API Key
- **MITRE映射**: T1070 清除日志

### 11.2 商业工具

#### 86. 1Password Business
- **类型**: 商业 (SaaS)
- **API**: 1Password Connect API
- **端点**: `https://1password.com/api/connect/`
- **功能**: 企业密码管理、敏感信息保护
- **认证**: API Token
- **MITRE映射**: T1070 清除日志, T1053 计划任务

#### 87. CyberArk Conjur
- **类型**: 商业
- **API**: Conjur REST API
- **端点**: `https://conjurserver-host/api/`
- **功能**: 密钥即服务、合规审计、开发者集成
- **认证**: Authenticator / API Key
- **MITRE映射**: T1070 清除日志, T1053 计划任务

## 十二、安全自动化与SOAR

### 12.1 开源工具

#### 88. TheHive
- **类型**: 开源 (AGPL)
- **API**: TheHive REST API v1
- **端点**: `https://thehive-host/api/v1/`
- **功能**: 安全事件响应、案例管理、任务追踪
- **认证**: API Key
- **MITRE映射**: T1053 计划任务, T1070 清除日志

#### 89. MISP (for SOAR)
- **类型**: 开源 (AGPL)
- **API**: MISP REST API v2
- **端点**: `https://misp-host/api/v2/`
- **功能**: 威胁情报共享、IOC管理、自动化响应
- **认证**: 认证密钥
- **MITRE映射**: T1053 计划任务, T1070 清除日志

### 12.2 商业工具

#### 90. Splunk SOAR (Phantom)
- **类型**: 商业
- **API**: Phantom REST API v3
- **端点**: `https://phantom-host/rest/`
- **功能**: 安全编排自动化响应、剧本执行、第三方集成
- **认证**: Username / Password + 2FA
- **MITRE映射**: T1053 计划任务, T1047 Windows管理工具

#### 91. Palo Alto XSOAR (Demisto)
- **类型**: 商业
- **API**: XSOAR REST API
- **端点**: `https://xsoar-host/api/v1/`
- **功能**: 安全编排、案例管理、威胁情报整合
- **认证**: API Key / OAuth
- **MITRE映射**: T1053 计划任务, T1047 Windows管理工具

#### 92. D3 Security (SOAR)
- **类型**: 商业
- **API**: D3 REST API
- **端点**: `https://d3-host/api/v2/`
- **功能**: 自动化响应、剧本编排、资产关联
- **认证**: API Token
- **MITRE映射**: T1053 计划任务, T1047 Windows管理工具

## 十三、数据防泄漏 (DLP)

### 13.1 开源工具

#### 93. MyDLP
- **类型**: 开源 (GPL)
- **API**: MyDLP REST API
- **端点**: `https://mydlp-host/api/`
- **功能**: 数据防泄漏、内容过滤、端点DLP
- **认证**: Admin Token
- **MITRE映射**: T1070 清除日志, T1053 计划任务

### 13.2 商业工具

#### 94. Forcepoint DLP
- **类型**: 商业
- **API**: Forcepoint DLP API
- **端点**: `https://forcepoint-dlp-host/api/`
- **功能**: 数据分类、策略执行、事件报告
- **认证**: Service Account
- **MITRE映射**: T1070 清除日志, T1053 计划任务

#### 95. Symantec DLP (Broadcom)
- **类型**: 商业
- **API**: Symantec DLP REST API
- **端点**: `https://symantec-dlp-host:8443/api/`
- **功能**: 网络DLP、端点DLP、云DLP
- **认证**: Vontu Proxy Credentials
- **MITRE映射**: T1070 清除日志, T1053 计划任务

## 十四、安全测试与模糊测试

### 14.1 开源工具

#### 96. AFL (American Fuzzy Lop)
- **类型**: 开源 (Apache 2.0)
- **API**: afl-fuzz CLI
- **端点**: 本地CLI
- **功能**: 模糊测试、覆盖率引导测试
- **认证**: 无
- **MITRE映射**: T1068 漏洞利用提权

#### 97. libFuzzer
- **类型**: 开源 (Apache 2.0)
- **API**: LLVMFuzzerTestOneTarget
- **端点**: 本地编译测试
- **功能**: 内存模糊测试、持续模糊测试
- **认证**: 无
- **MITRE映射**: T1068 漏洞利用提权

### 14.2 商业工具

#### 98. Synopsys Fuzzing (Defensics)
- **类型**: 商业
- **API**: Defensics REST API
- **端点**: `https://defensics-host:8443/api/`
- **功能**: 协议模糊测试、安全测试套件
- **认证**: License Token
- **MITRE映射**: T1068 漏洞利用提权

## 十五、安全合规与治理

### 15.1 开源工具

#### 99. InSpec (Chef)
- **类型**: 开源 (Apache 2.0)
- **API**: InSpec CLI + REST Server
- **端点**: 本地CLI或Chef Automate
- **功能**: 合规性测试、基础设施审计
- **认证**: Chef Server认证
- **MITRE映射**: T1070 清除日志

#### 100. OpenSCAP (Compliance)
- **类型**: 开源 (LGPL)
- **API**: SCAP Workbench / oscap CLI
- **端点**: 本地CLI
- **功能**: SCAP合规检查、CIS/NIST评估
- **认证**: 无
- **MITRE映射**: T1070 清除日志

### 15.2 商业工具

#### 101. AWS Security Hub
- **类型**: 商业 (SaaS)
- **API**: AWS Security Hub API
- **端点**: `https://securityhub.region.amazonaws.com/`
- **功能**: 安全态势可见性、合规检查、自动化修复
- **认证**: AWS IAM Role / Access Key
- **MITRE映射**: T1070 清除日志, T1053 计划任务

#### 102. Azure Security Center / Defender for Cloud
- **类型**: 商业 (SaaS)
- **API**: Azure REST API / Security Center API
- **端点**: `https://management.azure.com/subscriptions/{subId}/providers/Microsoft.Security/`
- **功能**: 云安全态势管理、威胁防护、合规评估
- **认证**: Azure AD OAuth 2.0
- **MITRE映射**: T1070 清除日志, T1053 计划任务

---

## 接入指南

要将这些工具接入SecuClaw技能市场，需要：

1. **创建技能定义文件**（SKILL.md）在 `/secuclaw/skills/<tool-name>/` 目录
2. **实现API集成**，使用对应API进行认证和调用
3. **映射MITRE ATT&CK技术**，建立攻击链关联
4. **定义输入输出格式**，实现技能间的数据流转

每个工具的技能定义需包含：
- 基本信息（名称、类型、版本）
- API配置（端点、认证方式）
- 支持的操作（scan、analyze、mitigate等）
- MITRE映射关系
- 与其他技能的组合方式（light/dark/security/legal/technology/business）
