---
name: veracode
nameEn: Veracode SAST
description: 云端应用安全测试平台，支持SAST、DAST、SCA和容器安全测试
sources:
  product: Veracode
  homepage: https://www.veracode.com
  api_doc: https://docs.veracode.com/
  pricing: 按扫描计费
  api_type: REST API

metadata:
  openclaw:
    emoji: "✅"
    role: SAST
    combination: single
    version: "2024"
    capabilities:
      light: ["代码扫描", "DAST", "SCA"]
      dark: ["漏洞检测", "后门分析"]
      security: ["AppSec", "DevSecOps"]
      legal: ["合规报告", "SOC2"]
      technology: ["自动化测试"]
      business: ["风险评估"]
    mitre_coverage:
      - "TA0002-Execution"
      - "TA0005-Defense Evasion"
    scf_coverage:
      - "SI-System and Information Integrity"
apis:
  veracode_api:
    type: veracode-rest
    baseUrl: "https://analysiscenter.veracode.com/api"
    auth:
      type: veracode-hmac
      header: "Authorization"
      format: "veraorg={{org_id}},verakey={{api_id}},veratoken={{token}}"
    endpoints:
      - name: getApps
        path: /v1/applications
        method: GET
        description: 获取应用列表
      - name: getFindings
        path: /v2/Findings
        method: GET
        description: 获取漏洞发现
prompts:
  analyze:
    - role: system
      content: |
        你是一个专业的Veracode安全分析助手，擅长：
        1. 分析应用漏洞
        2. 评估风险等级
        3. 提供修复建议
integration:
  install:
    command: |
      # Veracode是SaaS服务
      # 1. 注册Veracode
      # 2. 获取API凭证
      # 3. 配置IDE插件
  config:
    - name: veracode_org_id
      label: Organization ID
      type: password
      required: true
    - name: veracode_api_id
      label: API ID
      type: password
      required: true
    - name: veracode_token
      label: API Token
      type: password
      required: true
  test:
    command: |
      curl -k -H "Authorization: veraorg={{org_id}},verakey={{api_id}},veratoken={{token}}" \
        "https://analysiscenter.veracode.com/api/v1/applications"
    expect: '"application"