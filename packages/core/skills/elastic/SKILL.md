---
name: elastic-siem
nameEn: Elastic SIEM
description: 开源Elastic Stack安全信息和事件管理平台，支持日志分析、威胁检测、告警响应和可视化
sources:
  product: Elastic SIEM
  homepage: https://www.elastic.co/security
  api_doc: https://www.elastic.co/guide/index.html
  github: https://github.com/elastic/elasticsearch
  pricing: 基础版免费 | 付费版$95/月起
  api_type: REST API
metadata:
  openclaw:
    emoji: "🔵"
    role: SIEM
    combination: single
    version: "8.12"
    capabilities:
      light: ["日志收集", "告警分析", "可视化", "合规报告", "资产监控"]
      dark: ["威胁狩猎", "攻击溯源", "异常检测"]
      security: ["威胁检测", "风险评分", "关联分析"]
      legal: ["合规审计", "日志归档", "GDPR报告"]
      technology: ["KQL查询", "机器学习", "图分析"]
      business: ["KPI监控", "趋势分析", "报表生成"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0002-Execution"
      - "TA0005-Defense Evasion"
      - "TA0007-Discovery"
      - "T1070-Indicator Removal"
      - "T1047-Windows Management Instrumentation"
    scf_coverage:
      - "SI-System and Information Integrity"
      - "AU-Audit and Accountability"
      - "IR-Incident Response"
apis:
  elasticsearch:
    type: elastic-rest
    baseUrl: "{{elastic_url}}"
    auth:
      type: apikey
      header: "Authorization"
      format: "ApiKey {{api_key}}"
    endpoints:
      - name: search
        path: /_search
        method: POST
        description: 执行搜索
        body: |
          {
            "query": {
              "match": { "message": "{{keyword}}" }
            }
          }
          
      - name: searchWithIndex
        path: /{index}/_search
        method: POST
        description: 在指定索引搜索
        body: |
          {
            "query": {
              "bool": {
                "must": [
                  { "match": { "event.category": "{{category}}" }
                ]
              }
            },
            "sort": [{ "@timestamp": "desc" }],
            "size": {{limit}}
          }
          
      - name: getAlerts
        path: /.alerts-security.alerts/_search
        method: POST
        description: 获取安全告警
        body: |
          {
            "query": {
              "range": {
                "@timestamp": {
                  "gte": "now-{time_range}",
                  "lte": "now"
                }
              }
            },
            "sort": [{ "kibana.alert.timeRange": "desc" }]
          }
          
      - name: getHosts
        path: /metrics-endpoint.metadata-default/_search
        method: POST
        description: 获取主机信息
        body: |
          {
            "size": 0,
            "aggs": {
              "hosts": {
                "terms": { "field": "host.name", "size": 1000 }
              }
            }
          }
          
      - name: getNetworkTraffic
        path: /logs-network-default/_search
        method: POST
        description: 获取网络流量
        body: |
          {
            "query": {
              "range": {
                "@timestamp": { "gte": "now-1h" }
              }
            },
            "aggs": {
              "top_sources": {
                "terms": { "field": "source.address", "size": 10 }
              },
              "top_destinations": {
                "terms": { "field": "destination.address", "size": 10 }
              }
            }
          }
          
      - name: createAlert
        path: /_plugins/_security_analytics/api/rule
        method: POST
        description: 创建检测规则
        body: |
          {
            "name": "{{rule_name}}",
            "description": "{{description}}",
            "type": "query",
            "query": "{{kql_query}}",
            "severity": "{{severity}}",
            "enabled": true
          }
          
      - name: getThreatIntel
        path: /_plugins/_security_analytics/threat_intel
        method: GET
        description: 获取威胁情报

prompts:
  analyze:
    - role: system
      content: |
        你是一个专业的Elastic SIEM分析助手，擅长：
        1. 使用KQL (Kibana Query Language) 进行日志搜索
        2. 分析安全告警和事件
        3. 进行威胁狩猎和溯源
        4. 生成安全分析报告
        
    - role: user
      content: |
        {{query_type}}：{{query}}
        
  hunt:
    - role: system
      content: |
        基于Elastic Security，你可以：
        1. 发现异常行为和潜在威胁
        2. 追踪攻击路径
        3. 关联多源数据
        4. 生成MITRE ATT&CK映射报告

integration:
  install:
    command: |
      # Docker Compose 快速部署
      cat > docker-compose.yml << 'EOF'
      version: '3'
      services:
        elasticsearch:
          image: docker.elastic.co/elasticsearch/elasticsearch:8.12.0
          environment:
            - discovery.type=single-node
            - ELASTIC_PASSWORD=elastic_password
          ports:
            - 9200:9200
            
        kibana:
          image: docker.elastic.co/kibana/kibana:8.12.0
          environment:
            - ELASTICSEARCH_HOSTS=https://elasticsearch:9200
            - ELASTICSEARCH_USERNAME=kibana_system
            - ELASTICSEARCH_PASSWORD=elastic_password
          ports:
            - 5601:5601
      EOF
      
      docker-compose up -d
      
  config:
    - name: elastic_url
      label: Elasticsearch URL
      type: string
      default: "https://localhost:9200"
      required: true
      
    - name: elastic_api_key
      label: API Key
      type: password
      required: true
      description: |
        生成API Key:
        1. 登录 Kibana → Stack Management → API Keys
        2. 创建 "Analytics" 角色用户
        3. 生成API Key并安全保存
        
    - name: default_index
      label: 默认索引
      type: string
      default: "logs-*,metrics-*"
      
  test:
    command: |
      curl -k -X GET "{{elastic_url}}/_cluster/health" \
        -H "Authorization: ApiKey {{api_key}}"
    expect: '"cluster_name"'

examples:
  - name: 安全告警搜索
    description: 搜索高严重性告警
    code: |
      curl -k -X POST "{{elastic_url}}/.alerts-security.alerts/_search" \
        -H "Authorization: ApiKey {{api_key}}" \
        -H "Content-Type: application/json" \
        -d '{
          "query": {
            "bool": {
              "must": [
                { "range": { "kibana.alert.severity": { "gte": "high" } } }
              ]
            }
          },
          "sort": [{ "@timestamp": "desc" }],
          "size": 50
        }'
        
  - name: 威胁狩猎
    description: 使用KQL进行威胁狩猎
    code: |
      # 搜索可疑的PowerShell活动
      curl -k -X POST "{{elastic_url}}/_search" \
        -H "Authorization: ApiKey {{api_key}}" \
        -d '{
          "query": {
            "bool": {
              "must": [
                { "match": { "process.name": "powershell.exe" } },
                { "range": { "@timestamp": { "gte": "now-24h" } } }
              ]
            }
          }
        }'
        
  - name: 主机风险评分
    description: 计算主机风险评分
    code: |
      # 按主机统计告警
      curl -k -X POST "{{elastic_url}}/_security/analytics Query" \
        -H "Authorization: ApiKey {{api_key}}" \
        -d '{
          "operationType": "stats",
          "queryFilters": [],
          "filterDropdowns": [],
          "timeSize": "1h"
        }'

outputs:
  report:
    format: [json, markdown, pdf]
    template: |
      # Elastic SIEM 安全分析报告
      ## 分析概要
      - 时间范围: {{time_range}}
      - 索引: {{index}}
      - 告警总数: {{total_alerts}}
      - 高危告警: {{critical_count}}
      
      ## 告警统计
      | 严重性 | 数量 | 占比 |
      |--------|------|------|
      | Critical | {{critical}} | {{critical_pct}}% |
      | High | {{high}} | {{high_pct}}% |
      | Medium | {{medium}} | {{medium_pct}}% |
      | Low | {{low}} | {{low_pct}}% |
      
      ## 攻击链分析
      {{attack_chain}}
      
      ## 受影响主机
      {{affected_hosts}}
      
      ## MITRE ATT&CK 映射
      {{mitre_mapping}}
      
      ## 建议行动
      {{recommended_actions}}
---

# Elastic SIEM 技能使用指南

## 功能概述

Elastic Security (SIEM) 提供：

- **日志管理**：统一收集和存储各类日志
- **威胁检测**：基于规则和机器学习的检测
- **威胁狩猎**：主动搜索隐藏威胁
- **事件响应**：自动化响应和调查
- **可视化**：实时安全仪表板
- **合规报告**：满足各类合规要求

## API配置

### 1. 生成API Key

```bash
# 方式1: 通过Kibana
# 1. 登录 Kibana → Stack Management → API Keys
# 2. 点击 "Create API Key"
# 3. 设置名称和权限
# 4. 复制生成的Base64编码的Key

# 方式2: 通过API
POST /_security/api_key
{
  "name": "secuclaw-skill",
  "role_descriptors": {
    "secuclaw_reader": {
      "cluster": ["monitor"],
      "index": [
        {
          "names": ["logs-*", "metrics-*", ".alerts-*"],
          "privileges": ["read", "view_index_metadata"]
        }
      ]
    }
  }
}
```

### 2. API调用示例

```bash
# 设置变量
ELASTIC_URL="https://localhost:9200"
API_KEY="your_base64_encoded_api_key"

# 1. 健康检查
curl -k $ELASTIC_URL/_cluster/health \
  -H "Authorization: ApiKey $API_KEY"

# 2. 搜索日志
curl -k -X POST $ELASTIC_URL/_search \
  -H "Authorization: ApiKey $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": {"match": {"message": "failed"}}'}'

# 3. 获取告警
curl -k -X POST $ELASTIC_URL/.alerts-security.alerts/_search \
  -H "Authorization: ApiKey $API_KEY" \
  -d '{"size": 100, "sort": [{"@timestamp": "desc"}]}'
```

## KQL查询示例

### 安全分析常用查询

```kql
# 1. 失败登录尝试
event.category:authentication AND event.outcome:failure

# 2. 可疑PowerShell活动
process.name:powershell.exe AND event.action:parent_process_started

# 3. 外部连接
network.direction:external AND event.category:network

# 4. 敏感文件访问
file.path:*admin* OR file.path:*config* OR file.path:*password*

# 5. 横向移动
event.category:network AND 
(destination.ip:(10.0.0.0/8 OR 192.168.0.0/16) OR source.ip:(10.0.0.0/8 OR 192.168.0.0/16))

# 6. 数据外泄
event.category:exfiltration AND event.type:error

# 7. 恶意软件指标
file.hash.md5:42md5hash OR 
process.name:malware.exe OR
registry.path:*malicious*
```

## 使用示例

### 智能安全分析对话

```
用户: 过去24小时有什么高危告警？

助手:
🔍 **Elastic SIEM 告警分析**

时间范围: 过去24小时 (2026-03-30 09:00 - 2026-03-31 09:00)
索引: .alerts-security.alerts
严重性: 高危 (Critical + High)

📊 **告警统计**
| 严重性 | 数量 | 趋势 |
|--------|------|------|
| 🔴 Critical | 3 | ↓ 25% |
| 🟠 High | 15 | ↑ 12% |
| 🟡 Medium | 42 | → 持平 |
| 🟢 Low | 128 | ↓ 8% |

⚠️ **Critical 告警详情**

1. **Emotet 恶意软件检测**
   - 时间: 2026-03-31 02:15:32
   - 主机: WORKSTATION-03
   - 进程: rundll32.exe
   - 动作: 隔离成功

2. **横向移动尝试**
   - 时间: 2026-03-31 01:42:18
   - 源IP: 192.168.1.105
   - 目标IP: 192.168.1.50
   - 事件: SMB Lateral Movement

3. **凭据窃取**
   - 时间: 2026-03-30 23:08:45
   - 用户: Domain\Admin
   - 类型: LSASS 访问

📋 **建议行动**
P0 (立即):
1. 隔离 WORKSTATION-03
2. 重置 Domain\Admin 密码
3. 检查域控制器日志

P1 (24小时内):
1. 审查RDP访问策略
2. 部署新签名规则
```

## 内置检测规则

Elastic Security提供400+内置规则，涵盖：

| MITRE ATT&CK战术 | 规则数量 |
|------------------|----------|
| Initial Access | 25+ |
| Execution | 40+ |
| Persistence | 35+ |
| Privilege Escalation | 30+ |
| Defense Evasion | 45+ |
| Credential Access | 30+ |
| Discovery | 25+ |
| Lateral Movement | 20+ |
| Collection | 25+ |
| Exfiltration | 15+ |
| Command and Control | 35+ |
