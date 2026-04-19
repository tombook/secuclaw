---
name: opencti
nameEn: OpenCTI Threat Intelligence
description: 开源威胁情报平台，支持结构化威胁信息管理、MITRE ATT&CK映射和可视化分析
sources:
  product: OpenCTI
  homepage: https://www.opencti.io
  api_doc: https://api.opencti.io/
  github: https://github.com/OpenCTI-Platform/opencti
  pricing: 开源免费
  api_type: GraphQL API

metadata:
  openclaw:
    emoji: "🕵️"
    role: THREAT
    combination: single
    version: "6.0"
    capabilities:
      light: ["威胁情报", "IOC管理", "知识管理"]
      dark: ["APT追踪", "攻击分析"]
      security: ["威胁情报", "MITRE映射"]
      legal: ["取证支持"]
      technology: ["STIX/TAXII"]
      business: ["第三方风险"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0011-Command and Control"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  opencti_api:
    type: opencti-rest
    baseUrl: "{{opencti_url}}/api"
    auth:
      type: opencti-token
      header: "Authorization"
      format: "Bearer {{opencti_token}}"
    endpoints:
      - name: getIndicators
        path: /v1/indicators
        method: GET
        description: 获取威胁指标
      - name: getEntities
        path: /v1/entities
        method: GET
        description: 获取实体
      - name: getRelations
        path: /v1/relations
        method: GET
        description: 获取关系
prompts:
  analyze:
    - role: system
      content: |
        你是一个专业的OpenCTI威胁情报助手，擅长：
        1. 分析威胁指标
        2. 追踪APT组织
        3. 映射MITRE ATT&CK
        4. 生成威胁报告
integration:
  install:
    command: |
      # Docker Compose
      cat > docker-compose.yml << 'EOF'
      version: '3'
      services:
        opencti:
          image: opencti/platform:latest
          ports:
            - "3000:3000"
      EOF
  config:
    - name: opencti_url
      label: OpenCTI URL
      type: string
      default: "http://localhost:3000"
      required: true
    - name: opencti_token
      label: API Token
      type: password
      required: true
  test:
    command: |
      curl -k -H "Authorization: Bearer {{opencti_token}}" \
        "{{opencti_url}}/api/v1/indicators"
    expect: '"data"