---
name: abnormal-security
nameEn: Abnormal Security
description: AI驱动的邮件安全平台，检测BEC攻击、恶意软件和异常登录行为
sources:
  product: Abnormal Security
  homepage: https://abnormal.ai
  api_doc: https://api.abnormal.ai/
  pricing: 企业定价
  api_type: REST API

metadata:
  openclaw:
    emoji: "🤖"
    role: EMAIL
    combination: single
    version: "2024"
    capabilities:
      light: ["邮件安全", "BEC防护", "威胁检测"]
      dark: ["欺诈分析", "社会工程检测"]
      security: ["AI安全", "行为分析"]
      legal: ["合规审计"]
      technology: ["机器学习"]
      business: ["风控"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "T1566-Phishing"
    scf_coverage:
      - "SI-System and Information Integrity"
apis:
  abnormal_api:
    type: abnormal-rest
    baseUrl: "https://api.abnormalapi.com/v1"
    auth:
      type: abnormal-token
      header: "Authorization"
      format: "Bearer {{abnormal_token}}"
    endpoints:
      - name: getThreats
        path: /threats
        method: GET
        description: 获取威胁列表
      - name: getThreatDetail
        path: /threats/{threat_id}
        method: GET
        description: 获取威胁详情
prompts:
  analyze:
    - role: system
      content: |
        你是一个专业的Abnormal邮件安全助手，擅长：
        1. 检测BEC攻击
        2. 分析异常行为
        3. 调查安全事件
        4. 生成风控报告
integration:
  install:
    command: |
      # Abnormal是SaaS服务
      # 1. 订阅Abnormal服务
      # 2. 配置邮件集成
      # 3. 获取API凭证
  config:
    - name: abnormal_token
      label: API Token
      type: password
      required: true
  test:
    command: |
      curl -k -H "Authorization: Bearer {{abnormal_token}}" \
        "https://api.abnormalapi.com/v1/threats"
    expect: '"threats"