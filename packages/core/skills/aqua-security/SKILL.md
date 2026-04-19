---
name: aqua-security
nameEn: Aqua Security
description: 云原生应用保护平台，保护容器、Kubernetes和无服务器工作负载
sources:
  product: Aqua Security
  homepage: https://www.aquasec.com
  api_doc: https://docs.aquasec.com/
  github: https://github.com/aquasecurity
  pricing: 按容器计费
  api_type: REST API

metadata:
  openclaw:
    emoji: "🐳"
    role: CONTAINER
    combination: single
    version: "6.5"
    capabilities:
      light: ["容器安全", "K8s保护", "漏洞扫描"]
      dark: ["恶意镜像检测", "运行时保护"]
      security: ["CNAPP", "CSPM"]
      legal: ["合规审计"]
      technology: ["微服务安全"]
      business: ["DevSecOps"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0002-Execution"
      - "T1525-Implant Internal Image"
    scf_coverage:
      - "SI-System and Information Integrity"
apis:
  aqua_api:
    type: aqua-rest
    baseUrl: "{{aqua_url}}/api"
    auth:
      type: aqua-token
      header: "Authorization"
      format: "Bearer {{aqua_token}}"
    endpoints:
      - name: getImages
        path: /images
        method: GET
        description: 获取容器镜像
      - name: getVulnerabilities
        path: /vulnerabilities
        method: GET
        description: 获取漏洞
      - name: getRisks
        path: /risks
        method: GET
        description: 获取风险
prompts:
  protect:
    - role: system
      content: |
        你是一个专业的Aqua容器安全助手，擅长：
        1. 分析容器镜像漏洞
        2. 配置运行时保护
        3. 审计K8s配置
        4. 生成安全报告
integration:
  install:
    command: |
      # Aqua是SaaS/本地服务
      # 1. 部署Aqua Server
      # 2. 安装Scanner
      # 3. 配置Kubernetes集成
  config:
    - name: aqua_url
      label: Aqua URL
      type: string
      required: true
    - name: aqua_user
      label: 用户名
      type: string
      required: true
    - name: aqua_password
      label: 密码
      type: password
      required: true
  test:
    command: |
      curl -k -u "{{aqua_user}}:{{aqua_password}}" \
        "{{aqua_url}}/api/v1/images"
    expect: '"result"