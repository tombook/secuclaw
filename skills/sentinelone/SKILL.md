---
name: sentinelone
nameEn: SentinelOne EDR
description: AI驱动的端点保护平台，提供威胁检测、自动化响应和威胁狩猎功能
sources:
  product: SentinelOne
  homepage: https://www.sentinelone.com
  api_doc: https://integrations.sentinelone.net/
  pricing: $8/终端/月起
  api_type: REST API

metadata:
  openclaw:
    emoji: "🦊"
    role: EDR
    combination: single
    version: "24.2"
    capabilities:
      light: ["威胁检测", "终端保护", "漏洞管理"]
      dark: ["入侵检测", "横向移动检测", "APT追踪"]
      security: ["实时监控", "风险评分", "事件分析"]
      legal: ["合规报告", "取证支持"]
      technology: ["行为AI", "威胁情报"]
      business: ["风险量化", "态势感知"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0002-Execution"
      - "TA0005-Defense Evasion"
      - "TA0007-Discovery"
      - "TA0008-Lateral Movement"
    scf_coverage:
      - "SI-System and Information Integrity"
      - "IR-Incident Response"
apis:
  sentinelone_api:
    type: sentinelone-rest
    baseUrl: "{{s1_api_url}}"
    auth:
      type: token
      header: "Authorization"
      format: "ApiToken {{api_token}}"
    endpoints:
      - name: getAgents
        path: /v2.1/agents
        method: GET
        description: 获取受保护终端
        params:
          - name: computer_name
            type: string
            required: false
          - name: operational_state
            type: string
            required: false
            description: "online/offline/renew"
      - name: getThreats
        path: /v2.1/threats
        method: GET
        description: 获取威胁列表
        params:
          - name: limit
            type: integer
            required: false
          - name: severity
            type: string
            required: false
            description: "critical/high/medium/low"
      - name: getThreatDetails
        path: /v2.1/threats/{threat_id}
        method: GET
        description: 获取威胁详情
      - name: mitigateThreat
        path: /v2.1/threats/{threat_id}/mitigate
        method: POST
        description: 响应威胁
        body: |
          {
            "action": "{{action}}"
          }
      - name: getActivities
        path: /v2.1/activities
        method: GET
        description: 获取活动日志
      - name: searchEvents
        path: /v2.1/events
        method: GET
        description: 搜索事件
        params:
          - name: query
            type: string
            required: false
prompts:
  detect:
    - role: system
      content: |
        你是一个专业的SentinelOne EDR分析助手，擅长：
        1. 分析端点威胁检测
        2. 进行威胁狩猎和溯源
        3. 调查安全事件
        4. 提供修复和防护建议
  hunt:
    - role: system
      content: |
        使用SentinelOne进行威胁狩猎时，请：
        1. 分析进程行为异常
        2. 检查网络连接
        3. 识别凭证滥用
        4. 追踪攻击链
integration:
  install:
    command: |
      # SentinelOne是SaaS服务
      # 1. 注册SentinelOne管理控制台
      # 2. 创建API Token
      # 3. 安装Agent到终端 (可选)
  config:
    - name: s1_api_url
      label: API URL
      type: string
      default: "https://usea1.sentinelone.net"
      required: true
      description: 登录Console查看API地址
    - name: api_token
      label: API Token
      type: password
      required: true
      description: |
        获取Token:
        1. 登录SentinelOne Console
        2. Settings → API Token
        3. 生成新Token
  test:
    command: |
      curl -k -X GET "{{s1_api_url}}/v2.1/agents?limit=5" \
        -H "Authorization: ApiToken {{api_token}}"
    expect: '"results"'