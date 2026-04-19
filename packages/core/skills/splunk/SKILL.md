---
name: splunk
nameEn: Splunk Enterprise Security
description: 企业级SIEM和日志管理平台，支持安全分析、威胁检测、合规管理和可视化仪表板
sources:
  product: Splunk
  homepage: https://www.splunk.com
  api_doc: https://docs.splunk.com/Documentation/Splunk/latest/RESTTUT/RESTandPython
  pricing: 免费版500MB/天 | 付费版$150/月起
  api_type: REST API + SPL

metadata:
  openclaw:
    emoji: "🟢"
    role: SIEM
    combination: single
    version: "9.2"
    capabilities:
      light: ["日志管理", "告警分析", "可视化", "合规报告"]
      dark: ["威胁狩猎", "攻击溯源", "异常检测"]
      security: ["威胁检测", "风险评分", "关联分析"]
      legal: ["合规审计", "SOX/HIPAA报告"]
      technology: ["SPL查询", "数据索引"]
      business: ["KPI监控", "运营分析"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0005-Defense Evasion"
      - "TA0007-Discovery"
      - "T1070-Indicator Removal"
    scf_coverage:
      - "AU-Audit and Accountability"
      - "SI-System and Information Integrity"
      - "IR-Incident Response"
apis:
  splunk_api:
    type: splunk-rest
    baseUrl: "{{splunk_url}}"
    auth:
      type: basicauth
      username: "{{username}}"
      password: "{{password}}"
    endpoints:
      - name: search
        path: /services/search/jobs
        method: POST
        description: 执行搜索
        body: |
          {
            "search": "search {{spl_query}}",
            "exec_mode": "normal",
            "earliest_time": "{{earliest}}",
            "latest_time": "{{latest}}"
          }
      - name: getSearchResults
        path: /services/search/jobs/{sid}/results
        method: GET
        description: 获取搜索结果
        params:
          - name: sid
            type: string
            required: true
          - name: count
            type: integer
            required: false
            default: 100
      - name: getKVStore
        path: /servicesNS/nobody/splunk_enterprise_security/storage/collections/data/{collection}
        method: GET
        description: 获取KV存储数据
      - name: createKVStoreEntry
        path: /servicesNS/nobody/splunk_enterprise_security/storage/collections/data/{collection}
        method: POST
        description: 创建KV存储条目
      - name: getAlerts
        path: /services/alerts fired
        method: GET
        description: 获取告警
        params:
          - name: count
            type: integer
            required: false
      - name: getNotableEvents
        path: /servicesNS/nobody/splunk_enterprise_security/saved/searches/Notable_Events
        method: GET
        description: 获取ES重要事件
prompts:
  analyze:
    - role: system
      content: |
        你是一个专业的Splunk SIEM分析助手，擅长：
        1. 使用SPL (Splunk Processing Language) 进行搜索
        2. 分析安全事件和告警
        3. 进行威胁狩猎
        4. 生成安全分析报告
    - role: user
      content: |
        {{action}}：{{query}}
  hunt:
    - role: system
      content: |
        使用Splunk进行威胁狩猎时，请：
        1. 分析异常行为模式
        2. 关联多源数据
        3. 识别攻击链
        4. 提供MITRE ATT&CK映射
integration:
  install:
    command: |
      # Splunk是商业软件
      # 下载: https://www.splunk.com/en_us/download/splunk-enterprise.html
      # Docker部署 (测试版)
      docker run -d -p 8000:8000 \
        -e SPLUNK_START_ARGS=--accept-license \
        -e SPLUNK_PASSWORD=adminpassword \
        splunk/splunk:latest
  config:
    - name: splunk_url
      label: Splunk URL
      type: string
      default: "https://localhost:8089"
      required: true
    - name: splunk_user
      label: 用户名
      type: string
      default: "admin"
      required: true
    - name: splunk_password
      label: 密码
      type: password
      required: true
    - name: earliest_time
      label: 默认时间范围
      type: string
      default: "-24h"
  test:
    command: |
      curl -k -u "{{username}}:{{password}}" \
        "https://localhost:8089/services/server/info"
    expect: '"version"'
examples:
  - name: 搜索认证失败
    description: 搜索多次认证失败事件
    code: |
      # 创建搜索任务
      curl -k -u "{{username}}:{{password}}" \
        -X POST "https://localhost:8089/services/search/jobs" \
        -d 'search=search index=authentication failure" \
          | stats count by user, src_ip \
          | where count > 5 \
          | sort -count" \
        -d "earliest_time=-24h" \
        -d "exec_mode=normal"
      # 获取结果
      # SID从上一个请求获取
      curl -k -u "{{username}}:{{password}}" \
        "https://localhost:8089/services/search/jobs/{sid}/results?count=100"
  - name: 告警分析
    description: 获取ES重要告警
    code: |
      curl -k -u "{{username}}:{{password}}" \
        "https://localhost:8089/servicesNS/nobody/splunk_enterprise_security/saved/searches/Notable_Events?count=50"
  - name: 威胁狩猎
    description: 使用SPL进行APT狩猎
    code: |
      # PowerShell攻击检测
      curl -k -u "{{username}}:{{password}}" \
        -X POST "https://localhost:8089/services/search/jobs" \
        -d 'search=search index=main process_name=power* \
          | stats count, values(process_path) by host, user \
          | where count > 10" \
        -d "earliest_time=-7d"
outputs:
  report:
    format: [json, html, pdf]
    template: |
      # Splunk 安全分析报告
      ## 概要
      - 时间范围: {{time_range}}
      - 搜索: {{search_query}}
      - 结果数: {{result_count}}
      ## 结果统计
      {{results_stats}}
      ## 详细数据
      {{results_detail}}
---
# Splunk Enterprise Security 技能使用指南
## 功能概述
Splunk 是世界领先的SIEM平台：
- **日志管理**：收集和索引各类数据
- **SPL搜索**：强大的搜索处理语言
- **安全分析**：威胁检测和狩猎
- **可视化**：实时仪表板
- **告警**：自动化告警和响应
- **合规**：满足各类合规要求
## API配置
### 1. 获取凭证
```bash
# Splunk默认凭证
# 用户: admin
# 密码: (安装时设置)
# 或创建新用户
# 管理 → 用户 → 新用户
```
### 2. API调用示例
```bash
# 设置凭证
USER="admin"
PASS="your_password"
SPLUNK="https://localhost:8089"
# 1. 获取服务器信息
curl -k -u $USER:$PASS "$SPLUNK/services/server/info"
# 2. 执行搜索
curl -k -u $USER:$PASS \
  -X POST "$SPLUNK/services/search/jobs" \
  -d 'search=search index=main error | head 100' \
  -d "earliest_time=-24h"
# 3. 获取搜索结果
# 先从上面获取sid
curl -k -u $USER:$PASS \
  "$SPLUNK/services/search/jobs/{sid}/results?count=100"
# 4. 获取索引列表
curl -k -u $USER:$PASS "$SPLUNK/services/data/indexes"
# 5. 获取ES重要事件
curl -k -u $USER:$PASS \
  "$SPLUNK/servicesNS/nobody/splunk_enterprise_security/saved/searches/Notable_Events"
```
## SPL搜索示例
### 常用安全搜索
```spl
# 1. 认证失败Top10用户
index=authentication failure
| stats count by user, src_ip
| where count > 5
| sort -count
# 2. DNS异常检测
index=network dns
| stats count by query, src_ip
| where count > 50
| sort -count
# 3. PowerShell活动
index=endpoint process_name=power*
| stats count by host, command_line
| sort -count
# 4. 数据外泄检测
index=network destination_category=external
| stats sum(bytes_out) by src_ip, user
| where sum(bytes_out) > 1000000000
| sort -sum(bytes_out) desc
# 5. 横向移动
index=network lateral*
| stats values(destination_ip) by source_ip, user
| where mvcount(destination_ip) > 5
# 6. Webshell检测
index=endpoint 
| search ProcessName=*svchost* OR CommandLine=*eval*
| stats count by host, ProcessName, CommandLine
# 7. 敏感文件访问
index=filesystem path="/etc/passwd" OR path="C:\\Windows\\System32\\config\*"
| stats count by user, host, path
# 8. 异常时间登录
index=authentication 
| where strftime(_time, "%H") < "06:00" OR strftime(_time, "%H") > "22:00"
| stats count by user, src_ip, _time
```
## 使用示例
### 智能安全分析对话
```
用户: 过去24小时有什么异常？
助手:
🟢 **Splunk 安全分析**
时间范围: 过去24小时
搜索: 全部安全索引
📊 **统计概览**
- 认证事件: 45,231
- 网络事件: 128,492
- 端点事件: 67,834
⚠️ **异常发现**
**1. 暴力破解攻击**
- 来源IP: 203.0.113.50
- 目标: VPN网关
- 失败次数: 487次
- 受影响用户: 23个
- 时间: 03-31 02:15-04:30
**2. 异常数据外泄**
- 主机: 192.168.1.105
- 用户: john.doe
- 流量: 2.3GB
- 目的地: 未知外部IP
- 时间: 03-31 03:45
**3. 特权账户异常**
- 用户: administrator
- 源IP: 192.168.1.50 (非正常登录点)
- 时间: 03-31 01:30
- 登录类型: Network
📋 **建议行动**
P0:
1. 阻断 203.0.113.50
2. 隔离 192.168.1.105
3. 重置 john.doe 凭据
P1:
1. 审查 VPN 访问策略
2. 审查 administrator 活动
```