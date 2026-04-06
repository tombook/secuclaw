---
name: owasp-zap
nameEn: OWASP ZAP Security Scanner
description: 开源Web应用安全扫描器，支持自动扫描、爬虫、被动扫描和API测试
sources:
  product: OWASP ZAP
  homepage: https://www.zaproxy.org
  api_doc: https://www.zaproxy.org/docs/api/
  github: https://github.com/zaproxy/zaproxy
  pricing: 开源免费
  api_type: REST API + CLI

metadata:
  openclaw:
    emoji: "🕷️"
    role: WEB
    combination: single
    version: "2.14"
    capabilities:
      light: ["Web漏洞扫描", "爬虫", "安全测试"]
      dark: ["漏洞挖掘", "API测试"]
      security: ["DAST", "渗透测试", "安全审计"]
      legal: ["渗透测试授权"]
      technology: ["Web安全", "OWASP Top 10"]
      business: ["安全评估", "合规测试"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0007-Discovery"
      - "TA0002-Execution"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  zap_api:
    type: zap-rest
    baseUrl: "{{zap_url}}"
    auth:
      type: zap-key
      header: "X-ZAP-API-Key"
      format: "{{zap_api_key}}"
    description: |
      ZAP提供完整的REST API用于自动化扫描
    endpoints:
      - name: spiderScan
        path: /JSON/spider/action/scan
        method: GET
        description: 启动爬虫
        params:
          - name: url
            type: string
            required: true
            description: 目标URL
          - name: maxChildren
            type: integer
            required: false
            description: 最大子页面数
          - name: recurse
            type: boolean
            required: false
            description: 是否递归爬取
      - name: activeScan
        path: /JSON/ascan/action/scan
        method: GET
        description: 启动主动扫描
        params:
          - name: url
            type: string
            required: true
            description: 目标URL
          - name: recurse
            type: boolean
            required: false
            description: 是否递归扫描
          - name: inScopeOnly
            type: boolean
            required: false
            description: 仅扫描范围内URL
      - name: getAlerts
        path: /JSON/alert/view/alerts
        method: GET
        description: 获取告警列表
        params:
          - name: baseurl
            type: string
            required: false
            description: 过滤特定URL
          - name: risk
            type: string
            required: false
            description: "high, medium, low, informational"
      - name: getUrls
        path: /JSON/core/view/urls
        method: GET
        description: 获取访问过的URL列表
      - name: getSites
        path: /JSON/core/view/sites
        method: GET
        description: 获取访问过的站点
      - name: getReport
        path: /JSON/core/view/html
        method: GET
        description: 生成HTML报告
      - name: importUrls
        path: /JSON/spider/action/importUrls
        method: POST
        description: 导入URL列表
        body: |
          {"urls": ["http://example.com/", "http://test.com/"]}
      - name: enableApi
        path: /JSON/api/view/isEnabled
        method: GET
        description: 检查API是否启用
prompts:
  scan:
    - role: system
      content: |
        你是一个专业的OWASP ZAP Web安全助手，擅长：
        1. 配置和执行Web扫描
        2. 分析扫描结果
        3. 生成安全报告
        4. 提供修复建议
    - role: user
      content: |
        {{action}}：{{target}}
  analyze:
    - role: system
      content: |
        分析ZAP扫描结果时，请提供：
        1. 漏洞分类统计
        2. CVSS评分
        3. 详细漏洞分析
        4. 修复建议
integration:
  install:
    command: |
      # Docker (推荐)
      docker run -d --name zap \
        -p 8080:8080 \
        -p 9090:9090 \
        owasp/zap2docker-stable zap-baseline.py -t https://example.com
      # macOS
      brew install owasp-zap
      # Linux
      apt-get install zaproxy
      # Windows
      # 下载: https://www.zaproxy.org/download/
  config:
    - name: zap_url
      label: ZAP API URL
      type: string
      default: "http://localhost:8080"
      required: true
    - name: zap_api_key
      label: API Key
      type: password
      required: false
      description: |
        获取API Key:
        1. 打开ZAP
        2. Tools → Options → API
        3. 勾选"Enable API"
        4. 生成或设置API Key
    - name: scan_policy
      label: 扫描策略
      type: select
      options: ["baseline", "full", "api", "traditional-spider"]
      default: "baseline"
  test:
    command: |
      curl "http://localhost:8080/JSON/core/view/version"
    expect: '"version"'
outputs:
  report:
    format: [html, json, xml, markdown]
    template: |
      # OWASP ZAP 安全扫描报告
      ## 扫描概要
      - 目标: {{target}}
      - 扫描时间: {{scan_time}}
      - 扫描类型: {{scan_type}}
      ## 漏洞统计
      | 严重性 | 数量 | CVSS范围 |
      |--------|------|----------|
      | 高危 | {{high}} | 7.0-10.0 |
      | 中危 | {{medium}} | 4.0-6.9 |
      | 低危 | {{low}} | 0.1-3.9 |
      | 信息 | {{info}} | N/A |
      ## 漏洞详情
      {{vulnerability_details}}
      ## 修复建议
      {{remediation}}
---
# OWASP ZAP 技能使用指南
## 功能概述
OWASP ZAP (Zed Attack Proxy) 是全球最流行的开源Web应用安全扫描器：
- **Spider爬虫**: 自动发现网站页面
- **主动扫描**: 自动检测Web漏洞
- **被动扫描**: 监听流量检测问题
- **AJAX Spider**: 扫描动态Web应用
- **API测试**: REST API安全测试
- **认证支持**: 表单、JSON、Bearer Token
- **报告生成**: HTML、JSON、XML格式
## API使用
### 1. 启用API
```bash
# 启动ZAP API (Docker)
docker run -d -p 8080:8080 owasp/zap2docker-stable
# 在ZAP GUI中启用API
# Tools → Options → API → Enable API
```
### 2. 基本API调用
```bash
# 设置API Key (如果需要)
ZAP_KEY="your-api-key"
# 获取版本
curl "http://localhost:8080/JSON/core/view/version"
# 获取告警
curl "http://localhost:8080/JSON/alert/view/alerts?baseurl=https://example.com"
# 获取扫描的URL
curl "http://localhost:8080/JSON/core/view/urls"
```
## 快速开始
### Docker扫描
```bash
# 基础扫描 (推荐)
docker run -t owasp/zap2docker-stable \
  zap-baseline.py -t https://example.com
# 完整扫描
docker run -t owasp/zap2docker-stable \
  zap-full-scan.py -t https://example.com
# API扫描
docker run -t owasp/zap2docker-stable \
  zap-api-scan.py -t https://example.com -f openapi
# 指定输出
docker run -v $(pwd):/zap/wrk:rw \
  -t owasp/zap2docker-stable \
  zap-baseline.py -t https://example.com -J report.json
```
### Python API客户端
```python
from zapv2 import ZAPv2
# 初始化
zap = ZAPv2(apikey='your-api-key')
# 爬虫
zap.spider.scan(url='https://example.com', maxchildren=10)
# 等待爬虫完成
import time
while int(zap.spider.status()) < 100:
    print(f'Spider progress: {zap.spider.status()}%')
    time.sleep(5)
# 主动扫描
zap.ascan.scan(url='https://example.com')
# 等待扫描完成
while int(zap.ascan.status()) < 100:
    print(f'Scan progress: {zap.ascan.status()}%')
    time.sleep(5)
# 获取告警
alerts = zap.alert.all()
for alert in alerts:
    print(f"{alert['risk']}: {alert['name']} - {alert['url']}")
```
## 扫描策略
### 基础扫描 (zap-baseline.py)
```bash
# 快速扫描，不产生大量请求
docker run -t owasp/zap2docker-stable \
  zap-baseline.py \
  -t https://example.com \
  -r baseline_report.html
# 选项
  -t: 目标URL
  -r: HTML报告路径
  -J: JSON报告路径  
  -x: XML报告路径
  -m: 并行扫描数
  -d: 显示详细输出
```
### 完整扫描 (zap-full-scan.py)
```bash
# 更深入的扫描
docker run -t owasp/zap2docker-stable \
  zap-full-scan.py \
  -t https://example.com \
  -r full_report.html
```
### API扫描 (zap-api-scan.py)
```bash
# 扫描OpenAPI/Swagger定义的API
docker run -t owasp/zap2docker-stable \
  zap-api-scan.py \
  -t https://api.example.com/openapi.json \
  -f openapi \
  -r api_report.html
# 扫描GraphQL API
docker run -t owasp/zap2docker-stable \
  zap-api-scan.py \
  -t https://api.example.com/graphql \
  -f graphql \
  -r graphql_report.html
```
## 智能扫描配置
### 配置认证
```python
from zapv2 import ZAPv2
zap = ZAPv2(apikey='your-key')
# 表单认证
zap.authentication.login(
    loginurl='https://example.com/login',
    username='admin',
    password='admin',
    # 根据实际表单调整参数名
    authmethod='manual',
    body='username={%username%}&password={%password%}'
)
# Bearer Token认证
zap.context.extendcontext(
    contextname='API Context',
    regexurls=['https://example.com/api/.*']
)
zap.httpsender.setheader(
    contextname='API Context',
    headername='Authorization',
    headervalue='Bearer your-token-here'
)
```
### 配置扫描范围
```python
# 添加到扫描范围
zap.context.include_in_context(
    contextname='Default Context',
    regex='https://example.com/.*'
)
# 从范围排除
zap.context.exclude_from_context(
    contextname='Default Context',
    regex='https://example.com/logout.*'
)
```
## 使用示例
### 智能Web安全扫描对话
```
用户: 扫描 https://test.example.com
助手:
🕷️ **OWASP ZAP Web安全扫描**
目标: https://test.example.com
扫描类型: 基础扫描
扫描策略: OWASP Top 10
⏱️ 正在爬取网站结构...
⏱️ 发现 127 个页面
⏱️ 正在进行主动扫描...
📊 **扫描完成**
| 严重性 | 数量 | 趋势 |
|--------|------|------|
| 🔴 高危 | 3 | ↓ 1 |
| 🟠 中危 | 8 | → 持平 |
| 🟡 低危 | 15 | ↑ 3 |
| ⚪ 信息 | 42 | - |
⚠️ **高危漏洞详情**
**1. SQL注入 (CVE-2024-1234)**
- URL: /api/users?id=1
- 参数: id
- CVSS: 9.1
- 描述: 未使用参数化查询
**2. 存储型XSS**
- URL: /comment/submit
- 参数: comment
- CVSS: 8.2
- 描述: 未进行输入输出编码
**3. 敏感信息泄露**
- URL: /admin/config
- CVSS: 5.3
- 描述: 泄露数据库配置信息
📋 **修复建议**
P0 (立即):
1. 对所有数据库查询使用参数化查询
2. 对所有用户输入进行HTML编码
3. 限制管理接口访问
P1 (本周):
1. 实施WAF防护
2. 添加输入验证
3. 启用安全响应头
```
## 告警严重性
| 风险 | 说明 | ZAP Alert级别 |
|------|------|---------------|
| 高危 | 可直接利用，导致数据泄露或服务器控制 | High |
| 中危 | 存在风险，需要特定条件利用 | Medium |
| 低危 | 信息泄露或低风险问题 | Low |
| 信息 | 仅供参考，不是安全漏洞 | Informational |
## 常见漏洞检测
ZAP自动检测以下OWASP Top 10漏洞：
- A1:2017 - Injection
- A2:2017 - Broken Authentication
- A3:2017 - Sensitive Data Exposure
- A4:2017 - XML External Entities (XXE)
- A5:2017 - Broken Access Control
- A6:2017 - Security Misconfiguration
- A7:2017 - XSS (Cross-Site Scripting)
- A8:2017 - Insecure Deserialization
- A9:2017 - Using Components with Known Vulnerabilities
- A10:2017 - Insufficient Logging & Monitoring