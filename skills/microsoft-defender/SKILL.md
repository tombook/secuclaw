---
name: microsoft-defender
nameEn: Microsoft Defender for Endpoint
description: 企业端点安全平台，与Microsoft 365集成，支持威胁检测、自动化响应和安全分析
sources:
  product: Microsoft Defender
  homepage: https://www.microsoft.com/security
  api_doc: https://learn.microsoft.com/en-us/microsoft-365/security/defender/
  pricing: M365 E5包含
  api_type: Microsoft Graph API

metadata:
  openclaw:
    emoji: "🪟"
    role: EDR
    combination: single
    version: "2024"
    capabilities:
      light: ["端点保护", "威胁检测", "漏洞管理"]
      dark: ["入侵检测", "横向移动检测", "APT追踪"]
      security: ["EDR", "MDNA", "威胁情报"]
      legal: ["合规报告"]
      technology: ["云原生", "AI驱动"]
      business: ["风险评分", "运营效率"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0002-Execution"
      - "TA0004-Privilege Escalation"
      - "TA0005-Defense Evasion"
      - "TA0007-Discovery"
      - "TA0008-Lateral Movement"
    scf_coverage:
      - "SI-System and Information Integrity"
apis:
  defender_api:
    type: msgraph
    baseUrl: "https://api.security.microsoft.com"
    auth:
      type: ms-graph
      header: "Authorization"
      format: "Bearer {{ms_token}}"
    endpoints:
      - name: getAlerts
        path: /api/alerts
        method: GET
        description: 获取安全告警
      - name: getMachines
        path: /api/machines
        method: GET
        description: 获取受保护设备
      - name: getInvestigations
        path: /api/investigations
        method: GET
        description: 获取调查任务
prompts:
  detect:
    - role: system
      content: |
        你是一个专业的Microsoft Defender分析助手，擅长：
        1. 分析端点威胁检测
        2. 进行威胁狩猎
        3. 调查安全事件
        4. 生成安全报告
integration:
  install:
    command: |
      # Microsoft Defender是SaaS服务
      # 1. 订阅Microsoft 365 E5
      # 2. 在设备上部署Defender Agent
      # 3. 配置API权限
  config:
    - name: ms_tenant_id
      label: Tenant ID
      type: string
      required: true
    - name: ms_client_id
      label: Client ID
      type: password
      required: true
    - name: ms_client_secret
      label: Client Secret
      type: password
      required: true
  test:
    command: |
      # 获取Token
      TOKEN=$(curl -s -X POST "https://login.microsoftonline.com/{{tenant_id}}/oauth2/v2.0/token" \
        -d "client_id={{client_id}}&client_secret={{client_secret}}&scope=https://security.microsoft.com/.default" \
        | jq -r '.access_token')
      curl -k -H "Authorization: Bearer $TOKEN" \
        "https://api.security.microsoft.com/api/alerts"
    expect: '"value"