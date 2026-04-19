---
name: crowdstrike
nameEn: CrowdStrike Falcon
description: 云端端点保护平台(EPP+EDR)，支持威胁检测、威胁狩猎、事件响应和自动化修复
sources:
  product: CrowdStrike Falcon
  homepage: https://www.crowdstrike.com
  api_doc: https://falcon.us-2.crowdstrike.com/api/documentation/
  pricing: $20/终端/月起
  api_type: OAuth2 API

metadata:
  openclaw:
    emoji: "🦅"
    role: EDR
    combination: single
    version: "2024.1"
    capabilities:
      light: ["威胁检测", "终端保护", "漏洞管理"]
      dark: ["入侵检测", "横向移动检测", "APT追踪"]
      security: ["实时监控", "风险评分", "事件分析"]
      legal: ["合规报告", "取证支持"]
      technology: ["行为分析", "威胁情报"]
      business: ["风险量化", "态势感知"]
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
      - "TA0011-Command and Control"
    scf_coverage:
      - "SI-System and Information Integrity"
      - "AU-Audit and Accountability"
      - "IR-Incident Response"
apis:
  crowdstrike_api:
    type: crowdstrike-oauth2
    baseUrl: "{{cs_api_url}}"
    auth:
      type: oauth2
      tokenEndpoint: /oauth2/token
      clientId: "{{client_id}}"
      clientSecret: "{{client_secret}}"
    endpoints:
      - name: getDevices
        path: /devices/entities/devices/v1
        method: GET
        description: 获取受保护设备列表
        params:
          - name: ids
            type: string
            required: false
            description: "设备AID列表，逗号分隔"
      - name: searchDevices
        path: /devices/queries/devices/v1
        method: GET
        description: 搜索设备
        params:
          - name: filter
            type: string
            required: false
            description: "FQL过滤条件"
      - name: getIncidents
        path: /incidents/entities/incidents/v1
        method: GET
        description: 获取安全事件
        params:
          - name: ids
            type: string
            required: false
      - name: searchIncidents
        path: /incidents/queries/incidents/v1
        method: GET
        description: 搜索事件
      - name: getDetections
        path: /detections/entities/detections/v1
        method: GET
        description: 获取检测
        params:
          - name: ids
            type: string
            required: false
      - name: searchDetections
        path: /detections/queries/detections/v1
        method: GET
        description: 搜索检测
      - name: searchIOC
        path: /iocs/entities/indicators/v1
        method: POST
        description: 搜索IOC
        body: |
          {
            "indicators": [{{indicators}}]
          }
      - name: getProcess
        path: /entities/processes/v1
        method: GET
        description: 获取进程详情
        params:
          - name: ids
            type: string
            required: true
prompts:
  detect:
    - role: system
      content: |
        你是一个专业的CrowdStrike EDR分析助手，擅长：
        1. 分析端点威胁检测
        2. 进行威胁狩猎和溯源
        3. 调查安全事件
        4. 提供修复和防护建议
    - role: user
      content: |
        {{action}}：{{query}}
  hunt:
    - role: system
      content: |
        使用CrowdStrike进行威胁狩猎时，请：
        1. 分析进程行为异常
        2. 检查网络连接
        3. 识别凭证滥用
        4. 追踪攻击链
integration:
  install:
    command: |
      # CrowdStrike是SaaS服务
      # 1. 注册Falcon平台: https://falcon.crowdstrike.com/
      # 2. 创建API客户端获取凭证
      # 3. 安装Falcon Sensor到终端 (可选)
  config:
    - name: cs_client_id
      label: OAuth2 Client ID
      type: string
      required: true
      description: |
        获取凭证:
        1. 登录Falcon平台
        2. Support → API Clients → OAuth2 API
        3. 创建客户端，分配权限
        4. 保存Client ID和Secret
    - name: cs_client_secret
      label: OAuth2 Client Secret
      type: password
      required: true
    - name: cs_cloud
      label: 云区域
      type: select
      options: ["us-1", "us-2", "eu-1", "uk-1"]
      default: "us-1"
  test:
    command: |
      # 获取Token
      TOKEN=$(curl -X POST "https://login.us-1.crowdstrike.com/oauth2/token" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "client_id={{client_id}}&client_secret={{client_secret}}" \
        | jq -r '.access_token')
      # 测试API
      curl -H "Authorization: Bearer $TOKEN" \
        "https://api.us-1.crowdstrike.com/devices/entities/devices/v1?limit=1"
    expect: '"resources"'
examples:
  - name: 获取告警事件
    description: 获取最新安全事件
    code: |
      # 1. 获取Token
      TOKEN=$(curl -s -X POST "https://login.us-1.crowdstrike.com/oauth2/token" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "client_id={{client_id}}&client_secret={{client_secret}}" \
        | jq -r '.access_token')
      # 2. 获取检测列表
      curl -s -X GET "https://api.us-1.crowdstrike.com/detections/queries/detections/v1?limit=20&sort=last_behavior.desc" \
        -H "Authorization: Bearer $TOKEN"
      # 3. 获取设备列表
      curl -s -X GET "https://api.us-1.crowdstrike.com/devices/queries/devices/v1?limit=50" \
        -H "Authorization: Bearer $TOKEN"
      # 响应示例
      {
        "meta": {
          "query_time": 0.123
        },
        "resources": ["aid1", "aid2", "aid3"]
      }
  - name: 威胁狩猎
    description: 使用FQL进行威胁狩猎
    code: |
      # 搜索可疑PowerShell活动
      curl -s -X GET "https://api.us-1.crowdstrike.com/processes/queries/processes/v1?filter=process_name:powershell.exe" \
        -H "Authorization: Bearer $TOKEN"
      # 搜索网络连接
      curl -s -X GET "https://api.us-1.crowdstrike.com/network\_discovery/queries/network\_discovery/v1?filter=dest\_port:4444" \
        -H "Authorization: Bearer $TOKEN"
outputs:
  report:
    format: [json, markdown]
    template: |
      # CrowdStrike EDR 安全分析报告
      ## 概要
      - 查询时间: {{query_time}}
      - 设备总数: {{device_count}}
      - 活跃告警: {{alert_count}}
      ## 威胁统计
      | 严重性 | 数量 |
      |--------|------|
      | CRITICAL | {{critical}} |
      | HIGH | {{high}} |
      | MEDIUM | {{medium}} |
      | LOW | {{low}} |
      ## 检测详情
      {{detections}}
      ## 受影响设备
      {{affected_devices}}
---
# CrowdStrike Falcon 技能使用指南
## 功能概述
CrowdStrike Falcon 是云原生端点保护平台：
- **预防**：阻止恶意软件和攻击
- **检测**：实时威胁检测和行为分析
- **响应**：自动化调查和修复
- **威胁狩猎**：主动发现隐藏威胁
- **云原生**：无需本地部署
## API配置
### 1. 创建API客户端
```bash
# 1. 登录 Falcon Console
#    https://falcon.crowdstrike.com/
# 2. 创建API客户端
#    Support → API Clients → OAuth2 API
#    权限建议:
#    - Device Read
#    - Detection Read
#    - Incident Read
#    - IOC Read
# 3. 保存 Client ID 和 Client Secret
```
### 2. API调用示例
```bash
# 设置凭证
CLIENT_ID="your_client_id"
CLIENT_SECRET="your_client_secret"
BASE_URL="https://api.us-1.crowdstrike.com"
# 1. 获取Access Token
TOKEN=$(curl -s -X POST "https://login.us-1.crowdstrike.com/oauth2/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET" \
  | jq -r '.access_token')
# 2. 获取设备列表
curl -s -X GET "$BASE_URL/devices/queries/devices/v1?limit=10" \
  -H "Authorization: Bearer $TOKEN"
# 3. 获取设备详情
curl -s -X GET "$BASE_URL/devices/entities/devices/v1?ids=$DEVICE_ID" \
  -H "Authorization: Bearer $TOKEN"
# 4. 获取检测列表
curl -s -X GET "$BASE_URL/detections/queries/detections/v1?limit=20&sort=last_behavior.desc" \
  -H "Authorization: Bearer $TOKEN"
# 5. 获取事件详情
curl -s -X GET "$BASE_URL/incidents/entities/incidents/v1?ids=$INCIDENT_ID" \
  -H "Authorization: Bearer $TOKEN"
# 6. 搜索IOC
curl -s -X POST "$BASE_URL/iocs/entities/indicators/v1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"indicators":[{"type":"hash256","value":"abc123..."}]}'
```
## FQL查询示例
### 威胁狩猎查询
```fql
# 1. PowerShell异常活动
process_name:powershell.exe AND command_line:*encodedcommand*
# 2. RDP横向移动
dest_port:3389 AND (user_account:*admin* OR user_account:*domain admin*)
# 3. 凭证窃取工具
(process_name:mimikatz.exe OR process_name:lsass.exe) AND action_type:lsass_access
# 4. 恶意C2通信
dest_port:4444 OR dest_port:8080 OR domain:*evil*
# 5. 数据外泄
(file_hash:suspicious_hash) AND (dest_port:21 OR dest_port:22 OR dest_port:445)
# 6. 持久化检测
(reg_key:*runonce* OR reg_key:*startup*) AND action_type:regmod
# 7. 提权尝试
action_type:privilege_escalation AND severity:high
# 8. 内部侦察
(action_type:system_info_request) AND (host_count > 10)
```
## 使用示例
### 智能EDR分析对话
```
用户: 检查一下有没有可疑活动
助手:
🦅 **CrowdStrike Falcon 分析**
⏱️ 查询时间: 2026-03-31 09:00
📊 **设备概览**
- 受保护设备: 1,847台
- 在线: 1,623台 (88%)
- 离线: 224台 (12%)
📋 **活跃检测 (过去24小时)**
| 严重性 | 数量 | 趋势 |
|--------|------|------|
| 🔴 CRITICAL | 3 | ↓ 40% |
| 🟠 HIGH | 15 | ↑ 12% |
| 🟡 MEDIUM | 42 | ↓ 8% |
| 🟢 LOW | 128 | → 持平 |
⚠️ **CRITICAL 检测详情**
**1. Credential Dumping**
- 主机: WORKSTATION-05
- 用户: john.doe
- 进程: rundll32.exe → lsass.exe
- 时间: 2026-03-31 02:15:32
- 状态: 已遏制
**2. Masquerading Process**
- 主机: SERVER-DB-01
- 进程: svchost.exe (伪进程)
- PID: 4532
- 父进程: malicious.exe
**3. Suspicious Network**
- 主机: WORKSTATION-12
- 外部IP: 185.234.x.x
- 端口: 4444, 8080
- 模式: beacon
📋 **建议行动**
P0 (立即):
1. 遏制 WORKSTATION-05
2. 检查凭证泄露范围
P1 (24小时内):
1. 审查所有可疑进程
2. 检查网络连接日志
```
## 检测严重性
| 级别 | 说明 | 响应时间 |
|------|------|----------|
| CRITICAL | 主动攻击/数据泄露 | 立即 |
| HIGH | 高危行为/APT | 4小时 |
| MEDIUM | 可疑行为 | 24小时 |
| LOW | 信息性告警 | 72小时 |