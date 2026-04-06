---
name: misp
nameEn: MISP Threat Intelligence
description: 开源威胁情报共享平台，支持IOC存储、属性分析、Galaxies知识库、自动化关联和情报分发
sources:
  product: MISP
  homepage: https://www.misp-project.org
  api_doc: https://www.misp-project.org/openapi/
  github: https://github.com/MISP/MISP
  pricing: 开源免费
  api_type: REST API

metadata:
  openclaw:
    emoji: "🧠"
    role: THREAT
    combination: single
    version: "3.0"
    capabilities:
      light: ["IOC存储", "情报共享", "事件管理", "属性分析"]
      dark: ["攻击追踪", "APT分析", "基础设施识别"]
      security: ["威胁情报", "关联分析", "TTP映射"]
      legal: ["取证支持", "合规调查"]
      technology: ["恶意软件分析", "网络空间测绘"]
      business: ["第三方风险", "供应链安全"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0002-Execution"
      - "TA0011-Command and Control"
      - "T1105-Ingress Tool Transfer"
      - "T1071-Application Layer Protocol"
    scf_coverage:
      - "RA-Risk Assessment"
      - "SI-System and Information Integrity"
apis:
  misp_api:
    type: misp-rest
    baseUrl: "{{misp_url}}"
    auth:
      type: mispkey
      header: "Authorization"
      format: "{{misp_key}}"
    endpoints:
      - name: getVersion
        path: /servers/getVersion
        method: GET
        description: 获取MISP版本
      - name: listEvents
        path: /events
        method: GET
        description: 列出事件
        params:
          - name: page
            type: integer
            required: false
          - name: limit
            type: integer
            required: false
          - name: timestamp
            type: string
            required: false
            description: "过滤时间戳，如: 2026-01-01"
      - name: getEvent
        path: /events/{event_id}
        method: GET
        description: 获取事件详情
        params:
          - name: event_id
            type: string
            required: true
      - name: createEvent
        path: /events
        method: POST
        description: 创建事件
        body: |
          {
            "Event": {
              "info": "{{event_info}}",
              "threat_level_id": "{{threat_level}}",
              "analysis": "{{analysis_level}}",
              "distribution": "{{distribution}}",
              "date": "{{date}}"
            }
          }
      - name: addAttribute
        path: /events/{event_id}/attribute
        method: POST
        description: 添加属性(IOC)
        body: |
          {
            "Attribute": {
              "type": "{{ioc_type}}",
              "value": "{{ioc_value}}",
              "category": "{{category}}",
              "to_ids": {{to_ids}}
            }
          }
      - name: listAttributes
        path: /attributes
        method: GET
        description: 列出属性
        params:
          - name: type
            type: string
            required: false
            description: "属性类型，如: ip-src, domain, hash"
          - name: limit
            type: integer
            required: false
      - name: searchAttributes
        path: /attributes/search
        method: GET
        description: 搜索属性
        params:
          - name: value
            type: string
            required: false
            description: "IOC值"
          - name: type
            type: string
            required: false
          - name: category
            type: string
            required: false
      - name: listTags
        path: /tags
        method: GET
        description: 列出标签
      - name: addTag
        path: /tags/attachTagToObject
        method: POST
        description: 添加标签
        body: |
          {
            "uuid": "{{uuid}}",
            "tag": "{{tag}}"
          }
      - name: listGalaxies
        path: /galaxies
        method: GET
        description: 列出知识库星系
      - name: getGalaxy
        path: /galaxies/{galaxy_id}
        method: GET
        description: 获取星系详情
prompts:
  analyze:
    - role: system
      content: |
        你是一个专业的MISP威胁情报分析助手，擅长：
        1. 管理威胁情报事件
        2. 添加和分析IOC
        3. 关联MITRE ATT&CK战术
        4. 搜索和分发情报
        5. 进行威胁狩猎
    - role: user
      content: |
        {{action}}：{{query}}
  hunt:
    - role: system
      content: |
        使用MISP进行威胁情报分析时，请：
        1. 首先验证IOC的可靠性
        2. 关联相关事件和标签
        3. 分析攻击模式
        4. 提供防御建议
integration:
  install:
    command: |
      # Docker Compose 部署
      cat > docker-compose.yml << 'EOF'
      version: '3'
      services:
        misp:
          image: coolacid/misp-docker:latest
          ports:
            - "443:443"
          environment:
            - MYSQL_ROOT_PASSWORD=admin_password
            - MISP_ADMIN_PASSWORD=admin_password
            - MISP_EMAIL=admin@example.com
          volumes:
            - ./data:/var/www/MISP
      EOF
      docker-compose up -d
  config:
    - name: misp_url
      label: MISP URL
      type: string
      default: "https://localhost"
      required: true
    - name: misp_key
      label: MISP Auth Key
      type: password
      required: true
      description: |
        获取MISP Key:
        1. 登录MISP
        2. 我的设置 → 认证密钥
        3. 创建新密钥并安全保存
    - name: default_distribution
      label: 默认分发级别
      type: select
      options: ["你的组织", "已连接社区", "所有社区", "Intelligence共享"]
      default: "你的组织"
  test:
    command: |
      curl -k -X GET "{{misp_url}}/servers/getVersion" \
        -H "Authorization: {{misp_key}}"
    expect: '"version"'
examples:
  - name: 创建威胁情报事件
    description: 创建新的APT威胁情报事件
    code: |
      # 创建事件
      curl -k -X POST "{{misp_url}}/events" \
        -H "Authorization: {{misp_key}}" \
        -H "Content-Type: application/json" \
        -d '{
          "Event": {
            "info": "APT29 Campaign 2026",
            "threat_level_id": 1,
            "analysis": 2,
            "distribution": 1,
            "date": "2026-03-31"
          }
        }'
      # 添加IOC
      curl -k -X POST "{{misp_url}}/events/1234/attribute" \
        -H "Authorization: {{misp_key}}" \
        -H "Content-Type: application/json" \
        -d '{
          "Attribute": {
            "type": "ip-src",
            "value": "192.168.1.100",
            "category": "Network activity",
            "to_ids": true
          }
        }'
  - name: 搜索IOC
    description: 搜索恶意域名
    code: |
      curl -k -X GET "{{misp_url}}/attributes/search?type=domain&value=malware" \
        -H "Authorization: {{misp_key}}"
      # 响应示例
      {
        "response": [
          {
            "Attribute": {
              "id": "12345",
              "type": "domain",
              "value": "evil-c2.malware.com",
              "category": "Network activity",
              "to_ids": true,
              "tag": ["APT29", "malware-stage2"]
            }
          }
        ]
      }
  - name: 获取MITRE星系
    description: 获取MITRE ATT&CK知识库
    code: |
      curl -k -X GET "{{misp_url}}/galaxies" \
        -H "Authorization: {{misp_key}}"
outputs:
  report:
    format: [json, markdown, csv]
    template: |
      # MISP 威胁情报报告
      ## 事件概要
      - ID: {{event_id}}
      - 标题: {{event_info}}
      - 级别: {{threat_level}}
      - 分布: {{distribution}}
      - 创建时间: {{date}}
      ## IOC统计
      | 类型 | 数量 | 可检测 |
      |------|------|--------|
      | IP地址 | {{ip_count}} | {{ip_ids}} |
      | 域名 | {{domain_count}} | {{domain_ids}} |
      | 文件哈希 | {{hash_count}} | {{hash_ids}} |
      | URL | {{url_count}} | {{url_ids}} |
      ## IOC列表
      {{iocs_table}}
      ## 关联分析
      {{correlations}}
      ## ATT&CK 映射
      {{mitre_mapping}}
---
# MISP 技能使用指南
## 功能概述
MISP (Malware Information Sharing Platform) 是领先的威胁情报平台：
- **事件管理**：创建和管理威胁情报事件
- **IOC存储**：存储各类指标（IP、域名、哈希等）
- **Galaxies知识库**：MITRE ATT&CK、Mitre Enterprise等
- **自动关联**：发现相关情报
- **情报分发**：与社区和组织共享
## API配置
### 1. 获取API Key
```bash
# 1. 登录MISP
# 2. 我的设置 → 认证密钥
# 3. 创建新密钥
# 4. 复制并安全保存密钥
```
### 2. API调用示例
```bash
# 设置变量
MISP_URL="https://localhost"
MISP_KEY="your_misp_key_here"
# 1. 检查连接
curl -k -X GET "$MISP_URL/servers/getVersion" \
  -H "Authorization: $MISP_KEY"
# 2. 列出最近事件
curl -k -X GET "$MISP_URL/events?limit=10" \
  -H "Authorization: $MISP_KEY"
# 3. 搜索特定IOC
curl -k -X GET "$MISP_URL/attributes/search?value=malware.com" \
  -H "Authorization: $MISP_KEY"
# 4. 获取特定事件
curl -k -X GET "$MISP_URL/events/123" \
  -H "Authorization: $MISP_KEY"
# 5. 创建事件
curl -k -X POST "$MISP_URL/events" \
  -H "Authorization: $MISP_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "Event": {
      "info": "Suspicious domain activity",
      "threat_level_id": 2,
      "analysis": 1
    }
  }'
# 6. 添加属性
curl -k -X POST "$MISP_URL/events/123/attribute" \
  -H "Authorization: $MISP_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "Attribute": {
      "type": "domain",
      "value": "evil-domain.com",
      "category": "Network activity",
      "to_ids": true
    }
  }'
```
## IOC类型
| 类型 | 类别 | to_ids |
|------|------|--------|
| `ip-src`, `ip-dst` | Network activity | ✅ |
| `domain`, `hostname` | Network activity | ✅ |
| `url` | Network activity | ✅ |
| `md5`, `sha1`, `sha256` | Payload delivery | ✅ |
| `filename`, `filepath` | Payload delivery | ❌ |
| `email-src`, `email-dst` | External analysis | ✅ |
| `regkey` | Persistence | ✅ |
| `mutex` | Persistence | ✅ |
| `cookie-name` | External analysis | ❌ |
| `x509-fingerprint-sha1` | Network activity | ✅ |
## 威胁级别
| ID | 名称 | 说明 |
|----|------|------|
| 1 | 极高 | 国家APT级别 |
| 2 | 高危 | 复杂攻击 |
| 3 | 中危 | 一般威胁 |
| 4 | 低危 | 信息类 |
## 使用示例
### 智能威胁情报对话
```
用户: 搜索一下有没有 APT29 相关的情报
助手:
🧠 **MISP 威胁情报搜索**
搜索关键词: APT29
结果: 找到 15 个相关事件
📊 **事件列表**
| 事件ID | 标题 | 级别 | IOC数 | 日期 |
|--------|------|------|-------|------|
| #2341 | APT29 C2 Infrastructure | 高危 | 45 | 2026-03-28 |
| #2289 | APT29 Spear Phishing | 高危 | 12 | 2026-03-15 |
| #2201 | APT29 Toolset Analysis | 中危 | 28 | 2026-02-20 |
📋 **APT29 典型IOC**
**C2域名:**
- sunbandl[.]hopto[.]org
- newsite[.]cn
- update-server[.]duckdns[.]org
**IP地址:**
- 185.234.x.x (荷兰)
- 45.142.x.x (俄罗斯)
**文件哈希:**
- 8a8b9... (Cobalt Strike beacon)
- 1a2b3... (Trojan downloader)
🎯 **MITRE ATT&CK 映射**
- T1071 - 应用层协议
- T1105 - 入口工具转移
- T1027 - 混淆文件
- T1059 - 命令和脚本解释器
📋 **防御建议**
1. 阻断上述C2域名和IP
2. 检查邮件网关日志
3. 审查VPN连接日志
4. 部署检测规则
```