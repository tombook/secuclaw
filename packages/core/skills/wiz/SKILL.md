---
name: wiz
nameEn: Wiz Cloud Security
description: 云安全态势管理平台，支持CSPM、CWPP和云原生应用保护
sources:
  product: Wiz
  homepage: https://www.wiz.io
  api_doc: https://www.wiz.io/doc/overview
  pricing: 企业定价
  api_type: GraphQL API

metadata:
  openclaw:
    emoji: "🧙"
    role: CSPM
    combination: single
    version: "2024"
    capabilities:
      light: ["云安全态势", "合规检查", "资产发现"]
      dark: ["攻击路径分析", "横向移动检测"]
      security: ["CSPM", "CWPP", "CIEM"]
      legal: ["合规报告", "SOC2", "ISO27001"]
      technology: ["云原生安全", "容器安全"]
      business: ["风险量化", "合规管理"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0003-Persistence"
      - "TA0006-Credential Access"
    scf_coverage:
      - "RA-Risk Assessment"
      - "SI-System and Information Integrity"
apis:
  wiz_api:
    type: wiz-rest
    baseUrl: "https://{{wiz_domain}}/api"
    auth:
      type: wiz-oidc
      header: "Authorization"
      format: "Bearer {{wiz_token}}"
    endpoints:
      - name: getIssues
        path: /v1/issues
        method: GET
        description: 获取安全问题
      - name: getVulnerabilities
        path: /v1/vulnerabilities
        method: GET
        description: 获取漏洞
      - name: getCloudResources
        path: /v1/resources
        method: GET
        description: 获取云资源
prompts:
  analyze:
    - role: system
      content: |
        你是一个专业的Wiz云安全助手，擅长：
        1. 分析云安全态势
        2. 发现云资源风险
        3. 评估合规状态
        4. 提供修复建议
integration:
  install:
    command: |
      # Wiz是SaaS服务
      # 1. 注册Wiz
      # 2. 连接云账户
      # 3. 获取API凭证
  config:
    - name: wiz_domain
      label: Wiz Domain
      type: string
      required: true
      description: "如: app.wiz.io"
    - name: wiz_token
      label: API Token
      type: password
      required: true
  test:
    command: |
      curl -k -X POST "https://auth.wiz.io/oauth/token" \
        -d "client_id={{wiz_client_id}}&client_secret={{wiz_secret}}"
    expect: '"access_token"