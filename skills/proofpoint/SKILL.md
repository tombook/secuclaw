---
name: proofpoint
nameEn: Proofpoint Email Security
description: 邮件安全平台，支持威胁防护、网络钓鱼检测和邮件归档
sources:
  product: Proofpoint
  homepage: https://www.proofpoint.com
  api_doc: https://proofpoint.com/us/platform-api
  pricing: 企业定价
  api_type: REST API

metadata:
  openclaw:
    emoji: "📧"
    role: EMAIL
    combination: single
    version: "2024"
    capabilities:
      light: ["邮件安全", "钓鱼防护", "恶意软件检测"]
      dark: ["钓鱼攻击分析", "BEC检测", "品牌伪造检测"]
      security: ["邮件网关", "威胁情报"]
      legal: ["合规归档", "eDiscovery"]
      technology: ["沙箱分析", "URL检测"]
      business: ["邮件风控", "品牌保护"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0003-Persistence"
      - "T1566-Phishing"
    scf_coverage:
      - "SI-System and Information Integrity"
apis:
  proofpoint_api:
    type: proofpoint-rest
    baseUrl: "{{pp_api_url}}"
    auth:
      type: proofpoint-oauth2
      header: "Authorization"
      format: "Bearer {{pp_token}}"
    endpoints:
      - name: getMessages
        path: /v2/messages
        method: GET
        description: 获取消息列表
      - name: getMessageDetail
        path: /v2/messages/{message_id}
        method: GET
        description: 获取消息详情
      - name: getClicks
        path: /v2/clicks
        method: GET
        description: 获取点击数据
      - name: getThreats
        path: /v2/threats
        method: GET
        description: 获取威胁列表
prompts:
  analyze:
    - role: system
      content: |
        你是一个专业的Proofpoint邮件安全助手，擅长：
        1. 分析邮件威胁
        2. 检测钓鱼攻击
        3. 调查BEC事件
        4. 生成邮件安全报告
  hunt:
    - role: system
      content: |
        使用Proofpoint进行威胁狩猎时，请：
        1. 分析恶意邮件
        2. 追踪钓鱼链接
        3. 检测异常点击
integration:
  install:
    command: |
      # Proofpoint是SaaS服务
      # 1. 订阅Proofpoint服务
      # 2. 获取API凭证
      # 3. 配置邮件流
  config:
    - name: pp_api_url
      label: API URL
      type: string
      required: true
      description: Proofpoint TAP API URL
    - name: pp_token
      label: API Token
      type: password
      required: true
    - name: pp_secret
      label: API Secret
      type: password
      required: true
  test:
    command: |
      curl -k -X GET "{{pp_api_url}}/v2/messages?limit=1" \
        -H "Authorization: Bearer {{pp_token}}"
    expect: '"messages"