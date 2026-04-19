---
name: openvas
nameEn: OpenVAS Vulnerability Scanner
description: 开源漏洞扫描器 - 支持资产发现、漏洞检测、配置审计、CVE关联
sources:
  product: OpenVAS
  homepage: https://www.greenbone.net/
  api_doc: https://docs.greenbone.net/API/
  github: https://github.com/greenbone/openvas
  pricing: 开源免费
  api_type: REST API

metadata:
  openclaw:
    emoji: "🔴"
    role: VULN
    combination: single
    version: "22.4.0"
    capabilities:
      light: ["漏洞扫描", "资产发现", "配置审计", "CVE检测", "补丁建议"]
      dark: ["渗透探测", "弱点识别", "攻击面分析"]
      security: ["风险评估", "威胁检测", "合规检查"]
      legal: ["等保合规", "GDPR审计"]
      technology: ["网络扫描", "主机审计", "服务识别"]
      business: ["风险量化", "合规报表"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0002-Execution"  
      - "TA0004-Privilege Escalation"
      - "TA0007-Discovery"
      - "T1046 - Network Service Scanning"
      - "T1499 - Endpoint Denial of Service"
    scf_coverage:
      - "RA-Risk Assessment"
      - "SI-System and Information Integrity"
      - "CM-Configuration Management"
visualizations:
  mode: light
  panels:
    - id: vuln-summary
      name: "漏洞概览"
      type: chart
      dataSource: openvas.results
      chartType: donut
      groupBy: severity
    - id: top-vulns
      name: "高危漏洞Top10"
      type: table
      dataSource: openvas.results
      columns: [name, severity, cvss, hosts]
      filter: severity=high
    - id: host-health
      name: "主机健康度"
      type: gauge
      dataSource: openvas.results
      aggregation: vuln_score_by_host
apis:
  vulnerability_scanner:
    type: openvas-rest
    baseUrl: "{{openvas_url}}"
    auth:
      type: token
      tokenHeader: "X-Auth-Token"
    endpoints:
      - name: getVersion
        path: /api/info/version
        method: GET
        description: 获取OpenVAS版本信息
      - name: listScanConfigs
        path: /api/v2/configs
        method: GET
        description: 列出扫描配置
      - name: listTargets
        path: /api/v2/targets
        method: GET
        description: 列出扫描目标
      - name: createTarget
        path: /api/v2/targets
        method: POST
        description: 创建扫描目标
        body: |
          {
            "name": "{{target_name}}",
            "hosts": "{{target_hosts}}",
            "port_list_id": "{{port_list_id}}"
          }
      - name: listTasks
        path: /api/v2/tasks
        method: GET
        description: 列出扫描任务
      - name: createTask
        path: /api/v2/tasks
        method: POST
        description: 创建扫描任务
        body: |
          {
            "name": "{{task_name}}",
            "config_id": "{{scan_config_id}}",
            "target_id": "{{target_id}}",
            "scanner_id": "{{scanner_id}}"
          }
      - name: startTask
        path: /api/v2/tasks/{{task_id}}/start
        method: POST
        description: 启动扫描任务
      - name: getTaskResults
        path: /api/v2/reports?task_id={{task_id}}
        method: GET
        description: 获取扫描结果
      - name: listVulnerabilities
        path: /api/v2/results?task_id={{task_id}}
        method: GET
        description: 列出漏洞结果
      - name: getHostDetails
        path: /api/v2/hosts?task_id={{task_id}}
        method: GET
        description: 获取主机详细信息
prompts:
  scan:
    - role: system
      content: |
        你是一个专业的OpenVAS漏洞扫描助手。你可以：
        1. 创建和管理扫描目标
        2. 配置和启动漏洞扫描
        3. 分析扫描结果并生成报告
        4. 提供修复建议和优先级排序
    - role: user
      content: |
        对 {{target}} 进行漏洞扫描，生成报告
  analyze:
    - role: system
      content: |
        分析漏洞扫描结果，提供：
        1. 漏洞分类统计
        2. 风险评分
        3. 修复优先级建议
        4. 合规影响评估
    - role: user  
      content: |
        分析以下漏洞扫描结果：{{results}}
integration:
  install:
    command: docker run -d --name openvas -p 9392:9392 securecompliance/openvas:latest
  config:
    - name: openvas_url
      label: OpenVAS API地址
      type: string
      default: "http://localhost:9392"
      required: true
    - name: openvas_user
      label: 用户名
      type: string
      default: "admin"
      required: true
    - name: openvas_password
      label: 密码
      type: password
      required: true
    - name: default_port_list
      label: 默认端口列表
      type: select
      options: ["OpenVAS Default", "All TCP", "Nmap TOP 100"]
      default: "OpenVAS Default"
  test:
    command: curl -k -X GET "{{openvas_url}}/api/info/version" -H "X-Auth-Token: {{token}}"
    expect: contains "version"
examples:
  - name: 基础漏洞扫描
    description: 对单个主机进行快速漏洞扫描
    code: |
      # 创建目标
      curl -X POST "{{openvas_url}}/api/v2/targets" \
        -H "X-Auth-Token: {{token}}" \
        -d '{"name":"test-target","hosts":"192.168.1.1","port_list_id":"{{port_list_id}}"}'
      # 创建任务
      curl -X POST "{{openvas_url}}/api/v2/tasks" \
        -H "X-Auth-Token: {{token}}" \
        -d '{"name":"test-scan","config_id":"{{config_id}}","target_id":"{{target_id}}"}'
      # 启动扫描
      curl -X POST "{{openvas_url}}/api/v2/tasks/{{task_id}}/start" \
        -H "X-Auth-Token: {{token}}"
  - name: 漏洞分析
    description: 分析扫描结果并生成报告
    code: |
      # 获取结果
      curl -X GET "{{openvas_url}}/api/v2/results?task_id={{task_id}}" \
        -H "X-Auth-Token: {{token}}" | jq '.results.result[] | select(.severity > 7)'
outputs:
  report:
    format: ["json", "html", "xml", "pdf"]
    template: |
      # 漏洞扫描报告
      ## 扫描概要
      - 扫描目标: {{target}}
      - 扫描时间: {{start_time}} - {{end_time}}
      - 发现漏洞: {{total_vulns}}
      ## 漏洞统计
      | 严重程度 | 数量 | CVSS范围 |
      |---------|------|----------|
      | 严重 | {{critical_count}} | 9.0-10.0 |
      | 高危 | {{high_count}} | 7.0-8.9 |
      | 中危 | {{medium_count}} | 4.0-6.9 |
      | 低危 | {{low_count}} | 0.1-3.9 |
      ## 高危漏洞详情
      {{high_vulns_table}}
      ## 修复建议
      {{remediation_steps}}
---
# OpenVAS 技能使用指南
## 功能概述
OpenVAS (Open Vulnerability Assessment Scanner) 是一个开源的漏洞扫描和管理系统，支持：
- **资产发现**：自动发现网络上的主机和服务
- **漏洞扫描**：检测操作系统、应用和服务的已知漏洞
- **配置审计**：检查系统配置是否符合安全基线
- **CVE关联**：将检测到的漏洞与CVE数据库关联
- **报告生成**：生成详细的漏洞报告和修复建议
## API配置
### 1. 安装部署
```bash
# Docker部署
docker run -d --name openvas \
  -p 9392:9392 \
  -e GMP_PASSWORD=your_password \
  securecompliance/openvas:latest
# 或使用Greenbone Enterprise VM
```
### 2. 获取API Token
```bash
# 通过用户名密码获取Token
curl -k -X POST "https://openvas-host:9392/api/auth" \
  -d "username=admin&password=your_password"
```
### 3. 配置技能参数
在SecuClaw技能市场安装OpenVAS技能后，配置以下参数：
| 参数 | 说明 | 示例 |
|------|------|------|
| openvas_url | API地址 | `http://openvas-host:9392` |
| openvas_user | 用户名 | `admin` |
| openvas_password | 密码 | `***` |
| default_port_list | 端口列表 | `OpenVAS Default` |
## 使用示例
### 创建并执行扫描
```
用户: 对 192.168.1.0/24 网段进行漏洞扫描
助手:
1. 创建目标
   - 名称: 192.168.1.0-24_net_scan
   - 目标: 192.168.1.0/24
   - 端口: OpenVAS Default (所有TCP端口)
2. 创建扫描任务
   - 配置: Full and Fast
   - 目标: 192.168.1.0-24_net_scan
   - 扫描器: OpenVAS Default
3. 启动扫描
   - 预计时间: 30-60分钟
   - 正在扫描: 192.168.1.x (共254台主机)
4. 扫描完成，正在分析结果...
```
### 分析结果示例
```
扫描结果摘要:
==================
目标范围: 192.168.1.0/24
扫描时间: 2026-03-31 08:00 - 09:30
存活主机: 42台
扫描完成率: 100%
漏洞统计:
------------------
严重 (CVSS 9-10): 3个
高危 (CVSS 7-8.9): 12个
中危 (CVSS 4-6.9): 28个
低危 (CVSS 0-3.9): 15个
高危漏洞详情:
------------------
1. CVE-2024-21762 - FortiGate SSL-VPN远程代码执行
   影响主机: 3台 (192.168.1.10, 192.168.1.15, 192.168.1.22)
   CVSS评分: 9.8
   建议: 立即升级FortiGate固件
2. CVE-2024-3400 - Palo Alto PAN-OS命令注入
   影响主机: 1台 (192.168.1.50)
   CVSS评分: 9.1
   建议: 升级PAN-OS到最新版本
修复优先级:
------------------
P0 (24小时内): 3个严重漏洞
P1 (1周内): 12个高危漏洞
P2 (1月内): 28个中危漏洞
```