---
name: burp-suite
nameEn: Burp Suite Professional
description: Web应用安全测试平台，支持漏洞扫描、渗透测试、请求拦截、API测试和高级配置
sources:
  product: Burp Suite Pro
  homepage: https://portswigger.net/burp
  api_doc: https://portswigger.net/burp/documentation
  pricing: $449/年
  api_type: REST API

metadata:
  openclaw:
    emoji: "🌍"
    role: WEB
    combination: single
    version: "2024.1"
    capabilities:
      light: ["漏洞扫描", "安全测试", "API测试"]
      dark: ["Web渗透", "漏洞利用", "越权测试"]
      security: ["代码审计", "API安全", "认证测试"]
      legal: ["渗透测试授权"]
      technology: ["Web安全", "API安全"]
      business: ["安全评估", "合规测试"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0002-Execution"
      - "TA0003-Persistence"
      - "TA0006-Credential Access"
      - "T1071-Application Layer Protocol"
      - "T1190-Exploit Public-Facing Application"
    scf_coverage:
      - "RA-Risk Assessment"
      - "SI-System and Information Integrity"
apis:
  burp_api:
    type: burp-rest
    baseUrl: "{{burp_url}}"
    auth:
      type: apikey
      header: "Authorization"
      format: "Bearer {{api_key}}"
    description: |
      Burp Suite Professional提供REST API用于自动化测试
    endpoints:
      - name: getScanStatus
        path: /v0.1/scan/status
        method: GET
        description: 获取扫描状态
        params:
          - name: scan_reference
            type: string
            required: false
            description: "扫描引用ID"
      - name: getScanProgress
        path: /v0.1/scan/{scan_ref}/progress
        method: GET
        description: 获取扫描进度
      - name: scanTarget
        path: /v0.1/scan
        method: POST
        description: 启动新扫描
        body: |
          {
            "scan_configuration": "{{config_name}}",
            "urls": ["https://target.example.com"],
            "scope": {
              "include": [{"url": "https://target.example.com/*"}],
              "exclude": []
            }
          }
      - name: getIssues
        path: /v0.1/issues
        method: GET
        description: 获取发现的问题
        params:
          - name: base_url
            type: string
            required: true
            description: "过滤特定URL的漏洞"
          - name: severity
            type: string
            required: false
            description: "过滤严重性: critical, high, medium, low, info"
      - name: getIssueDetails
        path: /v0.1/issues/{issue_name}
        method: GET
        description: 获取漏洞详情
        params:
          - name: issue_name
            type: string
            required: true
            description: "漏洞名称，如: SQL_injection"
      - name: getProxyHistory
        path: /v0.1/proxy/history
        method: GET
        description: 获取代理历史记录
        params:
          - name: url
            type: string
            required: false
            description: "过滤特定URL"
          - name: start
            type: integer
            required: false
            description: "起始索引"
      - name: doScan
        path: /v0.1/scan/{scan_ref}/issues
        method: GET
        description: 获取扫描发现的漏洞
      - name: getConfiguration
        path: /v0.1/scan/configuration
        method: GET
        description: 获取扫描配置列表
prompts:
  scan:
    - role: system
      content: |
        你是一个专业的Burp Suite渗透测试助手，擅长：
        1. 配置和管理Web扫描
        2. 分析漏洞报告
        3. 进行手动渗透测试
        4. 生成安全测试报告
    - role: user
      content: |
        {{action}}：{{target}}
  analyze:
    - role: system
      content: |
        分析Burp扫描结果时，请提供：
        1. 漏洞分类和风险评级
        2. CVSS评分
        3. 修复优先级
        4. 详细修复步骤
integration:
  install:
    command: |
      # Burp Suite是商业软件
      # 下载地址: https://portswigger.net/burp/releases
      # Docker (社区版/企业版)
      docker run -d --name burp \
        -p 1337:1337 \
        portswigger/burp-rest-api:latest
      # 或使用Burp Collaborator服务器
      # 用于检测Blind漏洞
  config:
    - name: burp_url
      label: Burp Suite API地址
      type: string
      default: "http://localhost:1337"
      required: true
    - name: burp_api_key
      label: API Key
      type: password
      required: true
      description: |
        获取API Key:
        1. 打开Burp Suite Pro
        2. Extender → API → Burp Suite API Key
        3. 生成或导入密钥
        4. 勾选 "Enable API" 
    - name: scan_config
      label: 扫描配置
      type: select
      options: ["Default Configuration", "Audit Checked", "Lightweight", "Fast-Complete Scan"]
      default: "Default Configuration"
    - name: scope_type
      label: 扫描范围
      type: select
      options: ["Include all", "Custom scope", "Use suite scope"]
      default: "Include all"
  test:
    command: |
      curl -k -X GET "http://localhost:1337/v0.1/scan/status" \
        -H "Authorization: Bearer {{api_key}}"
    expect: '"baselineScanTimeEstimateInSeconds"'
examples:
  - name: 启动Web扫描
    description: 对Web应用启动完整扫描
    code: |
      # 1. 检查API状态
      curl -k -X GET "http://localhost:1337/v0.1/scan/status" \
        -H "Authorization: Bearer {{api_key}}"
      # 2. 获取可用配置
      curl -k -X GET "http://localhost:1337/v0.1/scan/configuration" \
        -H "Authorization: Bearer {{api_key}}"
      # 3. 启动扫描
      curl -k -X POST "http://localhost:1337/v0.1/scan" \
        -H "Authorization: Bearer {{api_key}}" \
        -H "Content-Type: application/json" \
        -d '{
          "scan_configuration": "Default Configuration",
          "urls": ["https://example.com"],
          "scope": {
            "include": [{"url": "https://example.com/*"}],
            "exclude": []
          }
        }'
      # 4. 检查扫描进度
      curl -k -X GET "http://localhost:1337/v0.1/scan/{scan_ref}/progress" \
        -H "Authorization: Bearer {{api_key}}"
  - name: 获取扫描结果
    description: 获取发现的漏洞
    code: |
      # 获取问题列表
      curl -k -X GET "http://localhost:1337/v0.1/issues?base_url=https://example.com" \
        -H "Authorization: Bearer {{api_key}}"
      # 响应示例
      {
        "issues": [
          {
            "type": "sql_injection",
            "name": "SQL injection",
            "severity": "high",
            "confidence": "firm",
            "host": "https://example.com",
            "path": "/api/users",
            "issue_detail": "Parameter: id",
            "issue_background": "SQL injection flaws...",
            "remediation_background": "To fix SQL injection...",
            "remediation": "Use parameterized queries..."
          }
        ]
      }
  - name: 配置扫描
    description: 自定义扫描配置
    code: |
      # 设置自定义范围
      curl -k -X POST "http://localhost:1337/v0.1/scan" \
        -H "Authorization: Bearer {{api_key}}" \
        -H "Content-Type: application/json" \
        -d '{
          "scan_configuration": "Default Configuration",
          "urls": ["https://example.com/api/"],
          "scope": {
            "include": [
              {"url": "https://example.com/api/*"},
              {"url": "https://example.com/admin/*"}
            ],
            "exclude": [
              {"url": "https://example.com/api/health"}
            ]
          }
        }'
outputs:
  report:
    format: [html, json, xml]
    template: |
      # Web安全扫描报告
      ## 扫描概要
      - 目标: {{target}}
      - 扫描时间: {{scan_time}}
      - 扫描配置: {{config}}
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
# Burp Suite 技能使用指南
## 功能概述
Burp Suite Professional 是领先的Web应用安全测试平台：
- **Proxy**: 拦截和修改HTTP/HTTPS流量
- **Scanner**: 自动化Web漏洞扫描
- **Intruder**: 自动化定制攻击
- **Repeater**: 请求重放和测试
- **Sequencer**: 会话令牌分析
- **Decoder**: 编码解码工具
- **Collaborator**: 检测Blind漏洞
- **Extender**: 扩展功能
## API配置
### 1. 启用REST API
```bash
# 启动Burp Suite API
# 1. 打开Burp Suite Pro
# 2. Extender → API → Burp Suite API Key
# 3. 勾选 "Enable REST API"
# 4. 设置端口（默认1337）
# 5. 生成或导入API Key
```
### 2. API调用示例
```bash
# 设置变量
BURP_URL="http://localhost:1337"
API_KEY="your-api-key-here"
# 1. 检查API状态
curl -k -X GET "$BURP_URL/v0.1/scan/status" \
  -H "Authorization: Bearer $API_KEY"
# 2. 获取扫描配置
curl -k -X GET "$BURP_URL/v0.1/scan/configuration" \
  -H "Authorization: Bearer $API_KEY"
# 3. 启动扫描
curl -k -X POST "$BURP_URL/v0.1/scan" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "scan_configuration": "Default Configuration",
    "urls": ["https://example.com"]
  }'
# 4. 获取扫描进度
curl -k -X GET "$BURP_URL/v0.1/scan/{scan_ref}/progress" \
  -H "Authorization: Bearer $API_KEY"
# 5. 获取问题列表
curl -k -X GET "$BURP_URL/v0.1/issues?base_url=https://example.com" \
  -H "Authorization: Bearer $API_KEY"
# 6. 获取特定问题详情
curl -k -X GET "$BURP_URL/v0.1/issues/SQL_injection" \
  -H "Authorization: Bearer $API_KEY"
# 7. 获取代理历史
curl -k -X GET "$BURP_URL/v0.1/proxy/history?url=https://example.com" \
  -H "Authorization: Bearer $API_KEY"
```
## 扫描配置
| 配置 | 说明 | 适用场景 |
|------|------|----------|
| Default Configuration | 全面扫描 | 完整测试 |
| Audit Checked | 只检测有问题的 | 快速扫描 |
| Lightweight | 最轻量 | 快速评估 |
| Fast-Complete Scan | 快速但完整 | CI/CD集成 |
## 漏洞类型
| 漏洞 | 严重性 | CVSS | 说明 |
|------|--------|------|------|
| SQL注入 | 严重 | 9.8 | 数据库命令执行 |
| XSS | 高危 | 7.5 | 脚本注入攻击 |
| 命令注入 | 严重 | 9.8 | OS命令执行 |
| CSRF | 中危 | 6.5 | 跨站请求伪造 |
| SSRF | 高危 | 8.6 | 服务端请求伪造 |
| XXE | 严重 | 9.8 | XML外部实体 |
| 路径遍历 | 高危 | 7.5 | 文件访问 |
| 敏感信息泄露 | 中危 | 6.5 | 配置/凭据暴露 |
| 不安全反序列化 | 严重 | 9.8 | 代码执行风险 |
| 认证绕过 | 高危 | 8.0 | 未授权访问 |
## 使用示例
### 智能Web渗透测试对话
```
用户: 扫描 https://app.example.com
助手:
🌍 **Burp Suite Web安全扫描**
目标: https://app.example.com
扫描配置: Default Configuration
扫描模式: 主动+被动
⏱️ 正在扫描...
📊 **扫描进度**: 65%
- 已扫描: 128个页面
- 已发现: 3个请求
- 活跃漏洞: 2个
✅ **扫描完成**
📊 **漏洞统计**
| 严重性 | 数量 |
|--------|------|
| 🔴 严重 | 1 |
| 🟠 高危 | 2 |
| 🟡 中危 | 5 |
| 🟢 低危 | 8 |
⚠️ **高危漏洞详情**
**1. SQL注入 (CVE-2024-1234)**
- URL: https://app.example.com/api/user?id=1
- 参数: id
- 方法: UNION注入
- CVSS: 9.8
- 证明: ' OR 1=1 --
- 影响: 可获取全部用户数据
- 修复: 使用参数化查询
**2. 存储型XSS**
- URL: https://app.example.com/comment
- 参数: comment
- CVSS: 7.5
- 影响: 窃取会话Cookie
- 修复: 输入验证和输出编码
📋 **修复建议**
P0 (24小时内):
1. 使用参数化查询防止SQL注入
2. 对所有用户输入进行HTML编码
3. 实施内容安全策略(CSP)
P1 (1周内):
1. 部署WAF
2. 安全代码审查
3. 定期渗透测试
```
## Python API客户端示例
```python
import requests
import json
BURP_URL = "http://localhost:1337"
API_KEY = "your-api-key"
HEADERS = {"Authorization": f"Bearer {API_KEY}"}
def start_scan(url):
    """启动扫描"""
    data = {
        "scan_configuration": "Default Configuration",
        "urls": [url],
        "scope": {
            "include": [{"url": f"{url}/*"}],
            "exclude": []
        }
    }
    response = requests.post(
        f"{BURP_URL}/v0.1/scan",
        headers=HEADERS,
        json=data
    )
    return response.json()
def get_issues(base_url):
    """获取漏洞"""
    response = requests.get(
        f"{BURP_URL}/v0.1/issues",
        headers=HEADERS,
        params={"base_url": base_url}
    )
    return response.json()
def get_issue_details(issue_name):
    """获取漏洞详情"""
    response = requests.get(
        f"{BURP_URL}/v0.1/issues/{issue_name}",
        headers=HEADERS
    )
    return response.json()
# 使用示例
scan_result = start_scan("https://example.com")
print(f"扫描ID: {scan_result.get('scan_reference')}")
issues = get_issues("https://example.com")
for issue in issues.get('issues', []):
    print(f"[{issue['severity']}] {issue['name']}: {issue['path']}")
```
## Burp Suite使用技巧
### 1. Proxy拦截
```
# 设置代理
浏览器 → Burp Suite Proxy → 目标服务器
# 拦截请求
Proxy → Intercept → "Intercept is On"
# 修改请求后转发
Edit → Forward
# 拦截响应
Proxy → Options → "Intercept responses based on..."
```
### 2. Intruder攻击
```
# 配置Intruder
1. 选择目标请求
2. Positions → Auto payloads 或手动设置
3. Payloads → 设置载荷列表
4. Options → 设置攻击类型
# 攻击类型
- Sniper: 单个payload位置
- Battering ram: 所有位置相同payload
- Pitchfork: 多位置不同payload
- Cluster bomb: 多位置所有组合
```
### 3. Repeater测试
```
# 重放请求
1. 从Proxy历史发送请求到Repeater
2. 修改请求参数
3. 点击"Go"发送
4. 分析响应
```
### 4. Scanner配置
```
# 配置扫描范围
Scanner → Scope → 设置include/exclude规则
# 配置扫描选项
Scanner → Options → 设置：
- 扫描类型
- 并行线程数
- 主动扫描限制
- 爬虫设置
```