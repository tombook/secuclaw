---
name: wazuh
nameEn: Wazuh Security Platform
description: 开源安全平台，集成SIEM、XDR和云安全功能，支持威胁检测、完整性监控、日志分析和合规管理
sources:
  product: Wazuh
  homepage: https://wazuh.com
  api_doc: https://documentation.wazuh.com/current/user-manual/api/index.html
  github: https://github.com/wazuh/wazuh
  pricing: 开源免费
  api_type: REST API

metadata:
  openclaw:
    emoji: "🟣"
    role: SIEM
    combination: single
    version: "4.7"
    capabilities:
      light: ["威胁检测", "日志分析", "完整性监控", "合规检查", "告警响应"]
      dark: ["入侵检测", "后门分析", "异常行为"]
      security: ["实时监控", "风险评估", "事件分析"]
      legal: ["合规报告", "等保检查", "GDPR审计"]
      technology: ["文件完整性", "注册表监控", "Rootkit检测"]
      business: ["安全仪表板", "报表生成", "趋势分析"]
    mitre_coverage:
      - "TA0002-Execution"
      - "TA0003-Persistence"
      - "TA0004-Privilege Escalation"
      - "TA0005-Defense Evasion"
      - "TA0007-Discovery"
      - "T1070-Indicator Removal"
      - "T1014-Rootkit"
    scf_coverage:
      - "SI-System and Information Integrity"
      - "AU-Audit and Accountability"
      - "RA-Risk Assessment"
apis:
  wazuh_api:
    type: wazuh-rest
    baseUrl: "{{wazuh_url}}"
    auth:
      type: basicauth
      username: "{{username}}"
      password: "{{password}}"
    endpoints:
      - name: getAgents
        path: /agents
        method: GET
        description: 获取受管理代理列表
        params:
          - name: status
            type: string
            required: false
            description: "online/offline/never_connected/pending_but_connected"
      - name: getAgentInfo
        path: /agents/{agent_id}
        method: GET
        description: 获取指定代理信息
        params:
          - name: agent_id
            type: string
            required: true
      - name: getAgentStats
        path: /agents/{agent_id}/stats
        method: GET
        description: 获取代理统计
        params:
          - name: agent_id
            type: string
            required: true
      - name: getAlerts
        path: /events
        method: GET
        description: 获取安全告警
        params:
          - name: limit
            type: integer
            required: false
            default: 500
          - name: q
            type: string
            required: false
            description: "查询过滤器，如: rule.id>1000"
          - name: sort
            type: string
            required: false
            description: "排序，如: -timestamp"
      - name: searchAlerts
        path: /search
        method: POST
        description: 搜索告警
        body: |
          {
            "q": "{{query}}",
            "time": "{{time_range}}",
            "limit": {{limit}}
          }
      - name: getRules
        path: /rules
        method: GET
        description: 获取检测规则
      - name: getDecoders
        path: /decoders
        method: GET
        description: 获取解码器
      - name: getSyscheck
        path: /syscheck/{agent_id}
        method: GET
        description: 获取文件完整性检查结果
        params:
          - name: agent_id
            type: string
            required: true
      - name: getRootcheck
        path: /rootcheck/{agent_id}
        method: GET
        description: 获取Rootkit检测结果
      - name: getVuls
        path: /vulnerabilities/{agent_id}
        method: GET
        description: 获取漏洞信息
        params:
          - name: agent_id
            type: string
            required: true
      - name: addAgent
        path: /agents
        method: POST
        description: 注册新代理
        body: |
          {
            "name": "{{agent_name}}",
            "ip": "{{agent_ip}}",
            "id": "{{agent_id}}"
          }
      - name: deleteAgent
        path: /agents
        method: DELETE
        description: 删除代理
        params:
          - name: agents_list
            type: string
            required: true
prompts:
  analyze:
    - role: system
      content: |
        你是一个专业的Wazuh安全分析助手，擅长：
        1. 分析安全告警和事件
        2. 检查代理状态和系统完整性
        3. 发现安全威胁和异常
        4. 生成安全报告和统计
    - role: user
      content: |
        {{query_type}}：{{query}}
  hunt:
    - role: system
      content: |
        使用Wazuh进行威胁狩猎时，请：
        1. 分析告警趋势和分布
        2. 检查高风险主机
        3. 识别攻击模式
        4. 提供修复建议
integration:
  install:
    command: |
      # Docker Compose 部署
      cat > docker-compose.yml << 'EOF'
      version: '3'
      services:
        wazuh.manager:
          image: wazuh/wazuh-manager:4.7.0
          ports:
            - "1514:1514/udp"
            - "1515:1515"
            - "514:514/udp"
            - "55000:55000"
          environment:
            - INDEXER_URL=https://wazuh.indexer:9200
            - INDEXER_USERNAME=admin
            - INDEXER_PASSWORD=admin
        wazuh.dashboard:
          image: wazuh/wazuh-dashboard:4.7.0
          ports:
            - "443:5601"
      EOF
      docker-compose up -d
  config:
    - name: wazuh_url
      label: Wazuh API地址
      type: string
      default: "https://localhost:55000"
      required: true
    - name: wazuh_user
      label: 用户名
      type: string
      default: "wazuh-wui"
      required: true
    - name: wazuh_password
      label: 密码
      type: password
      required: true
    - name: agents_filter
      label: 默认代理过滤器
      type: string
      default: "status=active"
  test:
    command: |
      curl -k -u "{{username}}:{{password}}" \
        -X GET "https://localhost:55000/"
    expect: '"data":{"API_VERSION"'
examples:
  - name: 获取在线代理
    description: 列出所有在线代理
    code: |
      curl -k -u "{{username}}:{{password}}" \
        -X GET "https://localhost:55000/agents?status=active"
      # 响应示例
      {
        "data": {
          "affected_items": [
            {
              "id": "000",
              "name": "wazuh-master",
              "ip": "192.168.1.100",
              "status": "active",
              "version": "v4.7.0"
            },
            {
              "id": "001",
              "name": "web-server-01",
              "ip": "192.168.1.101",
              "status": "active",
              "version": "v4.7.0"
            }
          ],
          "total_affected_items": 2
        }
      }
  - name: 搜索告警
    description: 搜索高严重性告警
    code: |
      curl -k -u "{{username}}:{{password}}" \
        -X GET "https://localhost:55000/events?q=rule.level>12&limit=100&sort=-timestamp"
      # 响应示例
      {
        "data": {
          "items": [
            {
              "timestamp": "2026-03-31T09:00:00.000Z",
              "rule": {
                "level": 15,
                "description": "Shellshock attack detected"
              },
              "agent": {
                "id": "001",
                "name": "web-server-01"
              },
              "location": "/var/log/apache2/access.log"
            }
          ]
        }
      }
  - name: 文件完整性告警
    description: 获取系统关键文件变更告警
    code: |
      curl -k -u "{{username}}:{{password}}" \
        -X GET "https://localhost:55000/syscheck/001?pretty=true"
outputs:
  report:
    format: [json, markdown, html]
    template: |
      # Wazuh 安全分析报告
      ## 概要
      - 时间范围: {{time_range}}
      - 在线代理: {{active_agents}}
      - 告警总数: {{total_alerts}}
      ## 告警分布
      | 严重性 | 数量 | 趋势 |
      |--------|------|------|
      | Critical (15) | {{critical}} | {{critical_trend}} |
      | High (13-14) | {{high}} | {{high_trend}} |
      | Medium (7-12) | {{medium}} | {{medium_trend}} |
      | Low (1-6) | {{low}} | {{low_trend}} |
      ## 高危告警
      {{top_alerts}}
      ## 受影响主机
      {{affected_agents}}
      ## 文件完整性
      {{syscheck_changes}}
      ## 建议
      {{recommendations}}
---
# Wazuh 技能使用指南
## 功能概述
Wazuh 是一个开源安全平台：
- **SIEM**：集中日志管理和分析
- **XDR**：扩展检测和响应
- **云安全**：AWS、Azure、GCP安全监控
- **容器安全**：Docker和Kubernetes监控
- **合规**：PCI DSS、GDPR、HIPAA合规
## API配置
### 1. 获取API凭证
```bash
# 默认凭证 (测试环境)
# 用户: wazuh-wui
# 密码: wazuh-wui
# 生产环境建议通过Wazuh Dashboard创建新用户
```
### 2. API调用示例
```bash
# 设置凭证
USER="wazuh-wui"
PASS="wazuh-wui"
URL="https://localhost:55000"
# 1. 检查API状态
curl -k -u $USER:$PASS -X GET $URL/
# 2. 获取代理列表
curl -k -u $USER:$PASS -X GET "$URL/agents?status=active"
# 3. 获取告警
curl -k -u $USER:$PASS -X GET "$URL/events?q=rule.level>10&limit=100"
# 4. 获取文件完整性检查
curl -k -u $USER:$PASS -X GET "$URL/syscheck/001/last_scan"
# 5. 获取漏洞信息
curl -k -u $USER:$PASS -X GET "$URL/vulnerabilities/001?pretty=true"
# 6. 获取Rootkit检测
curl -k -u $USER:$PASS -X GET "$URL/rootcheck/001?pretty=true"
```
## 查询语法
### 告警过滤器
| 过滤器 | 说明 | 示例 |
|--------|------|------|
| `rule.level>X` | 规则级别 | `rule.level>12` |
| `agent.id=X` | 指定代理 | `agent.id=001` |
| `group=X` | 告警组 | `group=syslog` |
| `location=X` | 日志源 | `location=auth.log` |
| `file=X` | 文件路径 | `file=/etc/passwd` |
### 规则级别
| 级别 | 说明 |
|------|------|
| 0-6 | 低危 |
| 7-9 | 中危 |
| 10-12 | 高危 |
| 13-14 | 严重 |
| 15 | 最高 |
## 使用示例
### 智能安全分析对话
```
用户: 检查一下今天的安全状况
助手:
🔍 **Wazuh 安全分析**
时间: 2026-03-31 00:00 - 现在
在线代理: 42台
📊 **告警统计 (今日)**
| 严重性 | 数量 | 较昨日 |
|--------|------|--------|
| 🔴 Critical | 3 | ↓ 40% |
| 🟠 High | 12 | ↑ 15% |
| 🟡 Medium | 45 | ↓ 8% |
| 🟢 Low | 156 | → 持平 |
⚠️ **Critical 告警详情**
1. **Shellshock 攻击检测**
   - 时间: 09:15:32
   - 主机: web-server-01 (192.168.1.101)
   - 告警: CVE-2014-6271 特征匹配
   - 来源IP: 203.0.113.50
   - 状态: 已自动阻断
2. **关键文件篡改**
   - 时间: 08:42:18
   - 主机: db-server-03 (192.168.1.115)
   - 文件: /etc/passwd
   - 变更: 新增用户 "backdoor"
3. **Rootkit 嫌疑**
   - 时间: 07:30:05
   - 主机: workstation-22
   - 检查: 隐藏进程/端口
📋 **建议行动**
P0 (立即):
1. 检查 web-server-01 的Shellshock攻击源
2. 验证 /etc/passwd 变更合法性
P1 (24小时内):
1. 重置 workstation-22 可能泄露的凭据
2. 审查新增的高危告警规则
P2 (本周内):
1. 更新所有代理到最新版本
2. 审查文件完整性监控策略
```
## 内置规则示例
| 规则ID | 描述 | 级别 |
|--------|------|------|
| 1002 | Syslog messages | 2 |
| 2001 |可疑文件 | 10 |
| 2002 | Rootcheck hidden file | 13 |
| 2100 |Multiple authentication failures | 6 |
| 2502 |Web attack | 5 |
| 100005 | AWS - Root login | 6 |
| 14000 |Docker container threat | 10 |