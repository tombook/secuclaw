---
name: prisma-cloud
nameEn: Prisma Cloud
description: 云安全平台，支持CSPM、CWPP、CIEM和云原生应用保护
sources:
  product: Prisma Cloud
  homepage: https://www.paloaltonetworks.com/prisma/cloud
  api_doc: https://prisma.paloaltonetworks.com/api/
  pricing: 企业定价
  api_type: REST API

metadata:
  openclaw:
    emoji: "☁️"
    role: CSPM
    combination: single
    version: "23.6"
    capabilities:
      light: ["云安全态势管理", "合规检查", "风险评估"]
      dark: ["攻击路径分析", "横向移动检测"]
      security: ["CSPM", "CWPP", "CIEM"]
      legal: ["合规报告", "GDPR检查", "SOC2"]
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
  prismacloud_api:
    type: prismacloud-rest
    baseUrl: "{{pc_api_url}}"
    auth:
      type: pc-jwt
      header: "Authorization"
      format: "Bearer {{pc_token}}"
    endpoints:
      - name: getAlerts
        path: /v1/alert
        method: GET
        description: 获取云安全告警
      - name: getResources
        path: /v1/resource
        method: GET
        description: 获取云资源列表
      - name: getCompliance
        path: /v1/compliance
        method: GET
        description: 获取合规状态
      - name: getRisks
        path: /v1/policy
        method: GET
        description: 获取风险策略
prompts:
  analyze:
    - role: system
      content: |
        你是一个专业的Prisma Cloud云安全助手，擅长：
        1. 分析云安全态势
        2. 发现云资源风险
        3. 评估合规状态
        4. 提供修复建议
integration:
  install:
    command: |
      # Prisma Cloud是SaaS服务
      # 1. 注册Prisma Cloud
      # 2. 连接云账户 (AWS/Azure/GCP)
      # 3. 获取API凭证
  config:
    - name: pc_api_url
      label: API URL
      type: string
      required: true
      description: Prisma Cloud Console URL
    - name: pc_access_key
      label: Access Key
      type: password
      required: true
    - name: pc_secret_key
      label: Secret Key
      type: password
      required: true
  test:
    command: |
      curl -k -X GET "{{pc_api_url}}/v1/user/me" \
        -H "Authorization: Bearer {{pc_token}}"
    expect: '"email"