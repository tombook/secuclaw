---
name: sysdig
nameEn: Sysdig Container Security
description: 云原生安全和可观测性平台，保护容器、Kubernetes和云工作负载
sources:
  product: Sysdig
  homepage: https://sysdig.com
  api_doc: https://docs.sysdig.com/
  github: https://github.com/sysdiglabs/sysdig
  pricing: 免费版 | 付费版$20/月起
  api_type: REST API

metadata:
  openclaw:
    emoji: "🐙"
    role: CONTAINER
    combination: single
    version: "2024"
    capabilities:
      light: ["容器安全", "K8s监控", "审计"]
      dark: ["威胁检测", "异常行为"]
      security: ["CNAPP", "CSPM"]
      legal: ["合规审计"]
      technology: [" Falco", "运行时安全"]
      business: ["DevSecOps"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0002-Execution"
      - "T1525-Implant Internal Image"
    scf_coverage:
      - "SI-System and Information Integrity"
apis:
  sysdig_api:
    type: sysdig-rest
    baseUrl: "https://{{region}}.sysdig.com/api"
    auth:
      type: sysdig-token
      header: "Authorization"
      format: "Bearer {{sysdig_token}}"
    endpoints:
      - name: getAlerts
        path: /v1/alerts
        method: GET
        description: 获取告警
      - name: getEvents
        path: /v1/events
        method: GET
        description: 获取事件
prompts:
  secure:
    - role: system
      content: |
        你是一个专业的Sysdig云原生安全助手，擅长：
        1. 监控容器行为
        2. 检测异常活动
        3. 配置Falco规则
        4. 审计K8s安全
integration:
  install:
    command: |
      # Sysdig是SaaS服务
      # 1. 注册Sysdig
      # 2. 部署Agent
      # 3. 配置API访问
  config:
    - name: sysdig_token
      label: API Token
      type: password
      required: true
    - name: sysdig_region
      label: Region
      type: string
      default: "us-east-1"
  test:
    command: |
      curl -k -H "Authorization: Bearer {{sysdig_token}}" \
        "https://{{region}}.sysdig.com/api/v1/alerts"
    expect: '"alerts"