---
name: virustotal
nameEn: VirusTotal
description: 威胁情报分析平台 - 文件/URL/IP/域名多维度安全检测，恶意软件分析，关系图谱
sources:
  product: VirusTotal
  homepage: https://www.virustotal.com
  api_doc: https://developers.virustotal.com/reference
  github: https://github.com/VirusTotal/vt-api
  pricing: 免费版500次/天 | 付费版$15/月起
  api_type: API Key (x-apikey header)

metadata:
  openclaw:
    emoji: "🦠"
    role: THREAT
    combination: single
    version: "3.0"
    capabilities:
      light: ["文件检测", "URL分析", "域名查询", "IP声誉", "威胁情报"]
      dark: ["恶意样本分析", "攻击路径追踪", "基础设施识别"]
      security: ["威胁检测", "IOC分析", "APT关联"]
      legal: ["合规调查", "取证支持"]
      technology: ["沙箱分析", "行为监控", "网络空间测绘"]
      business: ["风险评估", "第三方安全评估"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0002-Execution"
      - "TA0011-Command and Control"
      - "T1105 - Ingress Tool Transfer"
      - "T1071 - Application Layer Protocol"
    scf_coverage:
      - "SI-System and Information Integrity"
      - "RA-Risk Assessment"
      - "AU-Audit and Accountability"
apis:
  threat_intelligence:
    type: virustotal-v3
    baseUrl: https://www.virustotal.com/api/v3
    auth:
      type: apikey
      header: "x-apikey"
    endpoints:
      - name: fileAnalysis
        path: /files/{id}
        method: GET
        description: 获取文件分析结果
        params:
          - name: id
            type: string
            required: true
            description: 文件哈希(SHA256/SHA1/MD5)
      - name: uploadFile
        path: /files
        method: POST
        description: 上传文件进行分析
        body: |
          multipart/form-data: file
      - name: urlAnalysis
        path: /urls/{id}
        method: GET
        description: 获取URL分析结果
        params:
          - name: id
            type: string
            required: true
            description: URL的base64编码
      - name: scanUrl
        path: /urls
        method: POST
        description: 提交URL进行扫描
        body: |
          url=https://example.com
      - name: ipAnalysis
        path: /ip_addresses/{ip}
        method: GET
        description: 获取IP威胁情报
        params:
          - name: ip
            type: string
            required: true
            description: IP地址
      - name: domainAnalysis
        path: /domains/{domain}
        method: GET
        description: 获取域名威胁情报
        params:
          - name: domain
            type: string
            required: true
            description: 域名
      - name: fileRelationships
        path: /files/{id}/relationships
        method: GET
        description: 获取文件关联关系
        params:
          - name: id
            type: string
            required: true
          - name: relationship
            type: string
            required: true
            description: itw/witnesses/pcap/comments/compactable...
      - name: huntRules
        path: /hunting_rulesets
        method: GET
        description: 获取狩猎规则
prompts:
  analyze:
    - role: system
      content: |
        你是一个专业的威胁情报分析助手，擅长分析：
        1. 文件/样本的威胁情报
        2. URL和域名的安全评估
        3. IP和域名的关联分析
        4. APT攻击链还原
    - role: user
      content: |
        分析以下IOC：{{ioc}}
  hunt:
    - role: system
      content: |
        基于VirusTotal关系图谱功能，你可以：
        1. 发现攻击者的基础设施
        2. 追踪恶意软件传播路径
        3. 识别攻击者的战术技术(TTPs)
        4. 生成完整的威胁情报报告
integration:
  install:
    command: |
      # VirusTotal是SaaS服务，无需安装
      # 只需获取API Key即可使用
      echo "注册获取API Key: https://www.virustotal.com/gui/join-us"
  config:
    - name: api_key
      label: VirusTotal API Key
      type: password
      required: true
      description: |
        从 https://www.virustotal.com/gui/join-us 免费注册获取
        免费版: 500次/天
        付费版: 无限制
    - name: daily_quota
      label: 每日配额
      type: info
      value: "500次/天 (免费版)"
  test:
    command: curl -X GET "https://www.virustotal.com/api/v3/users/current" -H "x-apikey: {{api_key}}"
    expect: contains "id"
examples:
  - name: 文件威胁分析
    description: 分析可疑文件的威胁情报
    code: |
      # 获取文件报告
      curl -X GET \
        "https://www.virustotal.com/api/v3/files/{sha256}" \
        -H "x-apikey: {{api_key}}"
      # 响应示例
      {
        "data": {
          "id": "275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f",
          "type": "file",
          "attributes": {
            "last_analysis_stats": {
              "malicious": 68,
              "suspicious": 3,
              "undetected": 12,
              "harmless": 1
            },
            "meaningful_name": "malware.exe",
            "creation_date": 1234567890,
            "names": ["malware.exe", "payload.dll"]
          }
        }
      }
  - name: 域名威胁分析
    description: 分析域名的关联和历史
    code: |
      # 获取域名报告
      curl -X GET \
        "https://www.virustotal.com/api/v3/domains/malicious-domain.com" \
        -H "x-apikey: {{api_key}}"
      # 获取域名历史DNS记录
      curl -X GET \
        "https://www.virustotal.com/api/v3/domains/{domain}/resolutions?limit=10" \
        -H "x-apikey: {{api_key}}"
outputs:
  report:
    format: [json, markdown]
    template: |
      # 威胁情报分析报告
      ## IOC信息
      - 类型: {{type}}
      - 值: {{ioc}}
      - 首次发现: {{first_submission}}
      - 最新发现: {{last_submission}}
      ## 检测统计
      - 安全引擎: {{undetected}}
      - 可疑: {{suspicious}}
      - 恶意: {{malicious}}
      - 置信度: {{provider_matches_ratio}}%
      ## 详细结果
      {{detailed_results}}
      ## 关联IOCs
      {{related_iocs}}
      ## 建议行动
      {{recommended_actions}}
---
# VirusTotal 技能使用指南
## 功能概述
VirusTotal 是全球领先的威胁情报平台，提供：
- **多引擎检测**：使用70+安全引擎检测文件
- **URL分析**：检测钓鱼、恶意网站
- **IP/域名情报**：获取IP和域名的历史和关联
- **文件行为分析**：获取文件的网络行为、签名等信息
- **关系图谱**：发现IOC之间的关联关系
- **VT Hunting**：基于YARA规则的主动狩猎
## API使用
### 1. 获取API Key
1. 访问 https://www.virustotal.com/gui/join-us
2. 注册账户（支持Google/GitHub登录）
3. 复制API Key
### 2. API版本
| 版本 | 端点 | 说明 |
|------|------|------|
| v3 (推荐) | `https://www.virustotal.com/api/v3` | 完整功能 |
| v2 (旧) | `https://www.virustotal.com/api/v2` | 兼容旧系统 |
### 3. 配额限制
| 套餐 | 配额 | 价格 |
|------|------|------|
| Free | 500次/天, 4次/分钟 | 免费 |
| Premium | 无限制 | $15/月 |
| Enterprise | 无限制 + VT Hunting | $200/月 |
## 使用示例
### 智能分析对话
```
用户: 分析这个IP: 192.168.1.100
助手:
🔍 **IP威胁情报查询**
基础信息:
- IP: 192.168.1.100
- 类型: 私有IP (非可路由地址)
- 用途: 内网主机
⚠️ 注意: 这是私有IP地址，无法查询VirusTotal。
如果是公网IP，分析将包括：
1. **基础声誉**
   - 恶意标记: 68/72引擎
   - 首次发现: 2024-01-15
   - 国家: 🇷🇺 俄罗斯
2. **关联威胁**
   - Botnet: Emotet
   - C2 Server: Cobalt Strike
   - 家族: TrickBot
3. **历史DNS**
   - evil-c2.ru
   - malware-domain.com
   - phishing-site.com
4. **攻击报告**
   - UDP Flood攻击: 2024-02-10
   - SMTP Spam: 2024-02-15
📋 **建议行动**:
1. 🚨 立即隔离该主机
2. 🔍 检查内网横向移动痕迹
3. 📧 搜索邮件网关日志
4. 🔐 重置所有可能泄露的凭据
```
### 自动化威胁狩猎
```bash
# 导入可疑文件到VirusTotal
curl -X POST "https://www.virustotal.com/api/v3/files" \
  -H "x-apikey: YOUR_API_KEY" \
  -F "file=@suspicious.exe"
# 获取分析结果
curl -X GET "https://www.virustotal.com/api/v3/files/{file_id}" \
  -H "x-apikey: YOUR_API_KEY"
# 分析关联域名
curl -X GET "https://www.virustotal.com/api/v3/domains/{domain}/relationships" \
  -H "x-apikey: YOUR_API_KEY"
```