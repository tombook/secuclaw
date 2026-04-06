---
name: shodan
nameEn: Shodan Network Intelligence
description: 网络空间测绘引擎 - 设备搜索、漏洞搜索、CVE查询、暴露面分析
sources:
  product: Shodan
  homepage: https://www.shodan.io
  api_doc: https://developer.shodan.io/api
  pricing: 免费版100次/月 | 付费版$59/月起
  api_type: API Key

metadata:
  openclaw:
    emoji: "🌐"
    role: RECON
    combination: single
    version: "2.0"
    capabilities:
      light: ["资产发现", "暴露面分析", "CVE查询", "设备分类"]
      dark: ["目标侦察", "攻击面探测", "漏洞搜索", "入侵指标"]
      security: ["安全评估", "威胁狩猎", "情报分析"]
      legal: ["合规检查", "供应链安全"]
      technology: ["网络测绘", "IoT安全", "云暴露检测"]
      business: ["第三方风险", "品牌保护", "资产清点"]
    mitre_coverage:
      - "TA0011-Command and Control"
      - "T1046 - Network Service Scanning"
      - "T1595 - Active Scanning"
      - "T1592 - Gather Victim Host Information"
    scf_coverage:
      - "RA-Risk Assessment"
      - "SI-System and Information Integrity"
      - "CM-Configuration Management"
apis:
  network_intelligence:
    type: shodan-rest
    baseUrl: https://api.shodan.io/api/v2.0
    auth:
      type: apikey
      param: key
    endpoints:
      - name: search
        path: /shodan/search
        method: GET
        description: 搜索设备
        params:
          - name: query
            type: string
            required: true
            description: 搜索查询语句
          - name: facets
            type: string
            required: false
            description: 统计字段 (org,country,port)
          - name: minify
            type: boolean
            required: false
            description: 减少返回结果
      - name: host
        path: /shodan/host/{ip}
        method: GET
        description: 获取主机详细信息
        params:
          - name: ip
            type: string
            required: true
            description: IP地址
      - name: hostCount
        path: /shodan/host/count
        method: GET
        description: 获取搜索结果数量
        params:
          - name: query
            type: string
            required: true
      - name: ports
        path: /shodan/ports
        method: GET
        description: 获取常用端口列表
      - name: scan
        path: /shodan/scan
        method: POST
        description: 扫描指定IP范围
        body: |
          {
            "ips": "192.168.1.1,192.168.1.2"
          }
      - name: exploitSearch
        path: /shodan/exploit
        method: GET
        description: 搜索CVE/Exploit
        params:
          - name: query
            type: string
            required: true
          - name: author
            type: string
            required: false
          - name: cve
            type: string
            required: false
      - name: dnsResolve
        path: /dns/resolve
        method: GET
        description: DNS解析
        params:
          - name: hostnames
            type: string
            required: true
      - name: dnsReverse
        path: /dns/reverse
        method: GET
        description: 反向DNS查询
        params:
          - name: ips
            type: string
            required: true
prompts:
  recon:
    - role: system
      content: |
        你是一个专业的网络空间测绘助手，擅长：
        1. 发现互联网暴露的设备和服务
        2. 分析组织的攻击面
        3. 搜索存在漏洞的设备
        4. 生成暴露面分析报告
    - role: user
      content: |
        搜索 {{query}}
  analyze:
    - role: system
      content: |
        分析 Shodan 数据时，请提供：
        1. 设备类型和服务
        2. 潜在漏洞
        3. 安全建议
integration:
  install:
    command: |
      # Shodan 是SaaS服务
      # 注册获取API Key: https://account.shodan.io/register
  config:
    - name: api_key
      label: Shodan API Key
      type: password
      required: true
      description: |
        免费版: 100次/月
        开发者版: 10000次/月 ($49/月)
        企业版: 无限制
    - name: default_facets
      label: 默认统计字段
      type: string
      default: "org,country,port"
  test:
    command: curl "https://api.shodan.io/api/v2.0/info?key={{api_key}}"
    expect: '"query_credits"'
examples:
  - name: 搜索暴露设备
    description: 搜索暴露的思科设备
    code: |
      curl "https://api.shodan.io/api/v2.0/shodan/search?key={{api_key}}&query=cisco+webcon"
      # 响应示例
      {
        "total": 15432,
        "matches": [{
          "ip_str": "203.0.113.50",
          "port": 443,
          "transport": "tcp",
          "product": "Cisco ASA",
          "version": "9.7",
          "hostnames": ["fw01.example.com"],
          "country_name": "United States",
          "org": "Example Corp",
          "os": "FortiOS 5.x"
        }]
      }
  - name: 搜索漏洞设备
    description: 搜索受Heartbleed影响的设备
    code: |
      curl "https://api.shodan.io/api/v2.0/shodan/search?key={{api_key}}&query=ssl+heartbeat"
      # 搜索特定CVE
      curl "https://api.shodan.io/api/v2.0/shodan/exploit?key={{api_key}}&query=CVE-2021-44228"
  - name: 主机分析
    description: 获取单个IP的详细情报
    code: |
      curl "https://api.shodan.io/api/v2.0/shodan/host/8.8.8.8?key={{api_key}}"
outputs:
  report:
    format: [json, markdown]
    template: |
      # 网络空间暴露面分析报告
      ## 目标信息
      - 查询: {{query}}
      - 结果总数: {{total}}
      - 统计: {{facets}}
      ## 设备分布
      {{device_distribution}}
      ## 高危发现
      {{critical_findings}}
      ## 暴露服务统计
      {{service_stats}}
      ## 加固建议
      {{recommendations}}
---
# Shodan 技能使用指南
## 功能概述
Shodan 是世界领先的网络空间测绘引擎：
- **设备发现**：搜索互联网上的摄像头、路由器、服务器等
- **漏洞搜索**：发现存在特定漏洞的设备
- **CVE查询**：搜索已知漏洞的利用代码
- **品牌保护**：监控组织资产的暴露情况
- **威胁情报**：获取攻击者的基础设施信息
## API配置
### 1. 获取API Key
1. 访问 https://account.shodan.io/register
2. 免费注册账户
3. 获取API Key（免费版每月100次查询）
### 2. API版本
| 版本 | 端点 | 说明 |
|------|------|------|
| v2.0 | `https://api.shodan.io/api/v2.0` | 当前版本 |
| v1 | `https://api.shodan.io/api/v1` | 旧版本（已弃用） |
### 3. 配额限制
| 套餐 | 价格 | 配额 |
|------|------|------|
| Free | 免费 | 100次/月 |
| Developer | $49/月 | 10,000次/月 |
| Corporate | $299/月 | 50,000次/月 |
| Enterprise | $899/月 | 无限制 |
## 搜索语法
### 基础操作符
| 操作符 | 说明 | 示例 |
|--------|------|------|
| `keyword` | 关键词 | `apache` |
| `"exact"` | 精确匹配 | `"Cisco IOS"` |
| `NOT` | 排除 | `apache NOT nginx` |
| `OR` | 或 | `mysql OR postgres` |
| `port:` | 端口 | `port:22` |
| `country:` | 国家 | `country:CN` |
| `city:` | 城市 | `city:Beijing` |
| `geo:` | 坐标 | `geo:39.9,116.4` |
| `hostname:` | 主机名 | `hostname:.gov` |
| `net:` | 网段 | `net:192.168.1.0/24` |
| `os:` | 操作系统 | `os:"Windows 10"` |
| `product:` | 产品 | `product:nginx` |
| `version:` | 版本 | `version:1.2.3` |
| `vuln:` | 漏洞 | `vuln:CVE-2021-44228` |
### 常用搜索模板
```bash
# 1. 搜索暴露的摄像头
shodan search "webcam+liveview"
# 2. 搜索思科设备
shodan search "cisco"
# 3. 搜索开放Redis
shodan search "redis"
# 4. 搜索MySQL
shodan search "product:MySQL"
# 5. 搜索工控设备
shodan search "scada+protocol"
# 6. 搜索VPN
shodan search "vpn+ssl"
# 7. 搜索MongoDB
shodan search "mongodb+no+password"
# 8. 搜索特定漏洞
shodan search "vuln:CVE-2021-26855"
```
## 使用示例
### 智能分析对话
```
用户: 搜索我们公司的公网暴露情况，域名是 example.com
助手:
🌐 **Shodan 资产暴露分析**
目标: example.com
查询范围: 
1. hostname:.example.com
2. org:"Example Corp"
3. ssl:*.example.com
📊 **搜索结果**
**总暴露资产**: 156个IP
按类型分布:
- Web服务 (80/443): 89个
- SSH (22): 45个
- VPN (443/1194): 12个
- 数据库 (3306/5432): 8个
- 其他: 2个
⚠️ **高危发现**:
1. 🔴 **敏感服务暴露**
   - 4台MongoDB直接暴露公网
   - 2台Redis无密码
   - 1台phpMyAdmin开放
2. 🟡 **过旧版本**
   - Apache 2.2 (已停止更新)
   - OpenSSL 1.0.2 (存在Heartbleed风险)
3. 🟡 **VPN设备**
   - 12台VPN设备暴露
   - 部分支持SSL v3
📋 **加固建议**:
P0 (24小时内):
1. 关闭/加密MongoDB公网访问
2. 配置Redis密码
3. 关闭phpMyAdmin外部访问
P1 (1周内):
1. 升级Apache到最新版本
2. 禁用SSL v3
P2 (1月内):
1. 审查VPN访问策略
2. 实施网络隔离
```
### CLI使用
```bash
# 安装Shodan CLI
pip install shodan
# 初始化
shodan init YOUR_API_KEY
# 搜索
shodan search "org:Example Corp"
# 获取主机详情
shodan host 192.168.1.1
# 查看账户信息
shodan info
# 查看我的IP
shodan myip
# 下载扫描结果
shodan scan list
```