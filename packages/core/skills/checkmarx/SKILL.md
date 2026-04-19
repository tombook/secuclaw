---
name: checkmarx
nameEn: Checkmarx SAST
description: 企业级静态应用安全测试工具，支持代码漏洞扫描和DevSecOps集成
sources:
  product: Checkmarx
  homepage: https://checkmarx.com
  api_doc: https://checkmarx.atlassian.net/wiki/spaces/KC/overview
  pricing: 企业定价
  api_type: REST API

metadata:
  openclaw:
    emoji: "🔬"
    role: SAST
    combination: single
    version: "9.6"
    capabilities:
      light: ["代码漏洞扫描", "SAST", "代码审计"]
      dark: ["后门检测", "恶意代码分析"]
      security: ["安全编码", "漏洞修复"]
      legal: ["合规审计"]
      technology: ["AST", "DevSecOps"]
      business: ["代码质量", "风险评估"]
    mitre_coverage:
      - "TA0002-Execution"
      - "TA0005-Defense Evasion"
    scf_coverage:
      - "SI-System and Information Integrity"
apis:
  checkmarx_api:
    type: checkmarx-rest
    baseUrl: "{{checkmarx_url}}"
    auth:
      type: checkmarx-token
      header: "Authorization"
      format: "{{cx_token}}"
    endpoints:
      - name: getProjects
        path: /cxrestapi/projects
        method: GET
        description: 获取项目列表
      - name: getScans
        path: /cxrestapi/scan/{scan_id}
        method: GET
        description: 获取扫描结果
      - name: getResults
        path: /cxrestapi/scan/{scan_id}/results
        method: GET
        description: 获取漏洞结果
prompts:
  analyze:
    - role: system
      content: |
        你是一个专业的Checkmarx代码安全助手，擅长：
        1. 分析代码漏洞
        2. 评估风险等级
        3. 提供修复建议
        4. 生成安全报告
integration:
  install:
    command: |
      # Checkmarx是商业软件
      # 1. 部署Checkmarx服务器
      # 2. 配置IDE插件
      # 3. 设置CI/CD集成
  config:
    - name: checkmarx_url
      label: Checkmarx URL
      type: string
      required: true
    - name: cx_token
      label: API Token
      type: password
      required: true
  test:
    command: |
      curl -k -H "Authorization: {{cx_token}}" \
        "{{checkmarx_url}}/cxrestapi/projects"
    expect: '"id"