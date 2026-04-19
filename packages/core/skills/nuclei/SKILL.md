---
name: nuclei
nameEn: Nuclei Vulnerability Scanner
description: 基于模板的漏洞扫描器，支持自定义模板、快速扫描和社区模板库
sources:
  product: Nuclei
  homepage: https://nuclei.projectdiscovery.io
  api_doc: https://github.com/projectdiscovery/nuclei
  github: https://github.com/projectdiscovery/nuclei
  pricing: 开源免费 | Nuclei Cloud $20/月
  api_type: CLI + REST API

metadata:
  openclaw:
    emoji: "⚡"
    role: VM
    combination: single
    version: "3.1"
    capabilities:
      light: ["漏洞扫描", "模板检测", "安全评估"]
      dark: ["漏洞验证", "POC测试", "安全研究"]
      security: ["渗透测试", "漏洞管理", "安全审计"]
      legal: ["渗透测试授权"]
      technology: ["YAML模板", "快速扫描", "社区驱动"]
      business: ["漏洞管理", "DevSecOps"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0007-Discovery"
      - "T1190-Exploit Public-Facing Application"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  nuclei_api:
    type: nuclei-rest
    baseUrl: "{{nuclei_server}}/api"
    auth:
      type: nuclei-api-key
      header: "X-API-Key"
      format: "{{nuclei_api_key}}"
    description: |
      Nuclei提供REST API用于程序化扫描
    endpoints:
      - name: startScan
        path: /scan
        method: POST
        description: 启动新扫描
        body: |
          {
            "targets": ["https://example.com"],
            "templates": ["cves/", "vulnerabilities/"],
            "rate-limit": 150,
            "bulk-size": 25
          }
      - name: getScanStatus
        path: /scan/{id}/status
        method: GET
        description: 获取扫描状态
      - name: getResults
        path: /scan/{id}/results
        method: GET
        description: 获取扫描结果
      - name: listTemplates
        path: /templates
        method: GET
        description: 列出可用模板
  nuclei_cli:
    type: cli
    command: nuclei
    options:
      - name: -u
        description: 目标URL
        required: true
      - name: -l
        description: 目标列表文件
        required: true
      - name: -t
        description: 模板路径或标签
        example: "cves/2021/,vulnerabilities/"
      - name: -tags
        description: 按标签过滤模板
        example: "cve,rce,xss"
      - name: -severity
        description: 按严重性过滤
        options: ["critical", "high", "medium", "low", "info"]
      - name: -o
        description: 输出文件
        example: "results.json"
      - name: -json
        description: JSON格式输出
        boolean: true
      - name: -markdown
        description: Markdown格式输出
        boolean: true
      - name: -stats
        description: 显示扫描统计
        boolean: true
      - name: -rate-limit
        description: 每秒最大请求数
        default: 150
      - name: -bulk-size
        description: 并行批量大小
        default: 25
      - name: -timeout
        description: 超时时间(秒)
        default: 5
      - name: -retries
        description: 重试次数
        default: 1
      - name: -update
        description: 更新模板
        boolean: true
      - name: -validate
        description: 验证模板
        boolean: true
      - name: -duc
        description: 不验证证书
        boolean: true
    template_options:
      - name: cves
        description: CVE漏洞模板
        path: "nuclei-templates/cves/"
      - name: vulnerabilities
        description: 通用漏洞模板
        path: "nuclei-templates/vulnerabilities/"
      - name: exposed-panels
        description: 暴露面板检测
        path: "nuclei-templates/exposed-panels/"
      - name: exposed-tokens
        description: 敏感Token检测
        path: "nuclei-templates/exposed-tokens/"
      - name: misconfiguration
        description: 配置错误
        path: "nuclei-templates/misconfiguration/"
      - name: default-logins
        description: 默认凭据
        path: "nuclei-templates/default-logins/"
prompts:
  scan:
    - role: system
      content: |
        你是一个专业的Nuclei漏洞扫描助手，擅长：
        1. 使用模板进行漏洞扫描
        2. 编写自定义检测模板
        3. 分析扫描结果
        4. 提供修复建议
    - role: user
      content: |
        {{action}}：{{target}}
  analyze:
    - role: system
      content: |
        分析Nuclei扫描结果时，请提供：
        1. 漏洞分类统计
        2. CVSS评分和风险评级
        3. 漏洞详情和POC
        4. 修复建议
integration:
  install:
    command: |
      # macOS
      brew install nuclei
      # Linux
      apt-get install nuclei
      # Go安装
      go install -v github.com/projectdiscovery/nuclei/v2/cmd/nuclei@latest
      # 更新模板
      nuclei -update-templates
      # Docker
      docker run -v ~/nuclei-templates:/root/nuclei-templates \
        projectdiscovery/nuclei -t cves/ -u https://example.com
  config:
    - name: nuclei_tags
      label: 常用模板标签
      type: string
      default: "cve,rce,xss,sql-injection"
    - name: nuclei_severity
      label: 严重性过滤
      type: string
      default: "critical,high,medium"
    - name: nuclei_rate
      label: 速率限制
      type: integer
      default: 150
  test:
    command: nuclei -version
    expect: "nuclei"
outputs:
  report:
    format: [json, markdown, html, txt]
    template: |
      # Nuclei 漏洞扫描报告
      ## 扫描概要
      - 目标: {{target}}
      - 扫描时间: {{scan_time}}
      - 模板数量: {{template_count}}
      ## 漏洞统计
      | 严重性 | 数量 | CVSS范围 |
      |--------|------|----------|
      | 严重 | {{critical}} | 9.0-10.0 |
      | 高危 | {{high}} | 7.0-8.9 |
      | 中危 | {{medium}} | 4.0-6.9 |
      | 低危 | {{low}} | 0.1-3.9 |
      ## 漏洞详情
      {{vulns_detail}}
      ## 修复建议
      {{remediation}}
---
# Nuclei 技能使用指南
## 功能概述
Nuclei是一款基于模板的漏洞扫描器：
- **社区模板**: 5000+预制漏洞模板
- **高速扫描**: 高效并发扫描
- **易于定制**: YAML模板语言
- **持续更新**: 活跃的社区贡献
- **多协议支持**: HTTP, TCP, DNS, etc.
- **CI/CD集成**: 便捷的CI/CD集成
## 快速开始
### 基本扫描
```bash
# 扫描单个目标
nuclei -u https://example.com
# 扫描多个目标
nuclei -l urls.txt
# 使用特定模板
nuclei -u https://example.com -t cves/
# 使用多个模板
nuclei -u https://example.com -t cves/,vulnerabilities/
```
### 模板选择
```bash
# CVE模板
nuclei -u https://example.com -t cves/2021/
# 漏洞模板
nuclei -u https://example.com -t vulnerabilities/
# 暴露面板
nuclei -u https://example.com -t exposed-panels/
# 敏感信息
nuclei -u https://example.com -t exposed-tokens/
# 按标签选择
nuclei -u https://example.com -tags cve,rce
```
### 输出格式
```bash
# 标准输出
nuclei -u https://example.com
# JSON输出
nuclei -u https://example.com -json -o results.json
# Markdown输出
nuclei -u https://example.com -markdown -o results.md
# 所有输出格式
nuclei -u https://example.com -json -markdown -o results/
```
## 高级用法
### 严重性过滤
```bash
# 只显示严重漏洞
nuclei -u https://example.com -severity critical,high
# 排除低危
nuclei -u https://example.com -severity critical,high,medium
```
### 速率控制
```bash
# 限制每秒请求
nuclei -u https://example.com -rate-limit 100
# 批量大小
nuclei -u https://example.com -bulk-size 50
# 最大并发
nuclei -u https://example.com -bulk-size 25 -rate-limit 150
```
### 认证支持
```bash
# Bearer Token
nuclei -u https://example.com/api \
  -H "Authorization: Bearer token123"
# Cookie
nuclei -u https://example.com \
  -H "Cookie: PHPSESSID=abc123"
# 自定义头
nuclei -u https://example.com \
  -H "X-API-Key: key123"
```
### 代理支持
```bash
# HTTP代理
nuclei -u https://example.com -proxy http://127.0.0.1:8080
# SOCKS代理
nuclei -u https://example.com -proxy socks5://127.0.0.1:1080
```
## 自定义模板
### 基础模板结构
```yaml
id: example-vulnerability
info:
  name: Example Vulnerability
  author: your-name
  severity: high
  description: Description of the vulnerability
  reference:
    - https://example.com/reference
  tags: cve,owasp
requests:
  - method: GET
    path:
      - "{{BaseURL}}/vulnerable endpoint"
    matchers:
      - type: word
        words:
          - "VULNERABLE"
          - "error"
        condition: and
```
### HTTP请求模板
```yaml
id: sql-injection-test
info:
  name: SQL Injection Test
  author: nuclei-team
  severity: critical
  tags: injection, sqli
requests:
  - method: GET
    path:
      - "{{BaseURL}}/search?id=1'"
      - "{{BaseURL}}/admin/login"
    matchers-condition: or
    matchers:
      - type: word
        words:
          - "sql syntax"
          - "MySQL"
          - "syntax error"
        condition: or
      - type: regex
        regex:
          - "SQLite.*error"
          - "PostgreSQL.*error"
```
## 使用示例
### 智能漏洞扫描对话
```
用户: 扫描 https://test.example.com
助手:
⚡ **Nuclei 漏洞扫描**
目标: https://test.example.com
模板: CVE + 漏洞模板
并发: 150 req/s
⏱️ 扫描中...
📊 已测试: 5,432 个模板
🎯 发现漏洞: 12个
✅ **扫描完成**
📊 **漏洞统计**
| 严重性 | 数量 | CVE |
|--------|------|-----|
| 🔴 严重 | 2 | CVE-2021-xxxxx |
| 🟠 高危 | 4 | CVE-2022-xxxxx |
| 🟡 中危 | 6 | - |
⚠️ **严重漏洞详情**
**1. CVE-2024-21762 (FortiGate SSL VPN)**
- 严重性: Critical (9.8)
- 类型: RCE (远程代码执行)
- 描述: FortiOS SSL VPN 远程代码执行漏洞
- 影响: 可完全控制设备
- 修复: 升级到 FortiOS 7.4.4 或更高版本
**2. CVE-2023-44487 (HTTP/2 Rapid Reset)**
- 严重性: Critical (9.0)
- 类型: DoS (拒绝服务)
- 描述: HTTP/2 协议漏洞导致 DDoS
- 修复: 更新到最新版本
📋 **修复建议**
P0 (立即):
1. 修补 FortiGate VPN 漏洞
2. 更新所有中间件版本
P1 (本周):
1. 审查所有 CVE 漏洞
2. 实施补丁管理流程
```
## Nuclei模板市场
社区模板来源：
- **Nuclei Templates**: https://github.com/projectdiscovery/nuclei-templates
- **Tag-based**: CVE, RCE, XSS, SQLi, etc.
- **按厂商**: nginx, apache, wordpress, etc.
- **按类型**: vulnerabilities, exposures, technologies
## CI/CD集成
### GitHub Actions
```yaml
name: Security Scan
on: [push, pull_request]
jobs:
  nuclei-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Nuclei
        run: go install -v github.com/projectdiscovery/nuclei/v2/cmd/nuclei@latest
      - name: Update Templates
        run: nuclei -update-templates
      - name: Run Scan
        run: nuclei -l urls.txt -severity critical,high -json -o results.json
      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: nuclei-results
          path: results.json
```
## 常用命令速查
```bash
# 基本扫描
nuclei -u https://example.com
# 批量扫描
nuclei -l targets.txt
# 指定模板
nuclei -u https://example.com -t cves/2021/
# 严重性过滤
nuclei -u https://example.com -severity critical,high
# JSON输出
nuclei -u https://example.com -json -o results.json
# 更新模板
nuclei -update-templates
# 验证模板
nuclei -t cves/ -validate
```