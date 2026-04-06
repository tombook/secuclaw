---
name: snyk
nameEn: Snyk Developer Security
description: 开发者安全平台，专注于代码安全、依赖项漏洞和容器安全
sources:
  product: Snyk
  homepage: https://snyk.io
  api_doc: https://docs.snyk.io/snyk-api
  github: https://github.com/snyk/snyk
  pricing: 免费版100次/周 | 付费版$25/月起
  api_type: REST API + CLI

metadata:
  openclaw:
    emoji: "🦄"
    role: SCA
    combination: single
    version: "2024"
    capabilities:
      light: ["代码漏洞扫描", "依赖项检查", "容器安全"]
      dark: ["供应链攻击检测", "恶意依赖分析"]
      security: ["SCA", "SAST", "容器扫描"]
      legal: ["许可证合规", "GDPR合规"]
      technology: ["DevSecOps", "CI/CD集成"]
      business: ["风险评估", "开发者安全"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0002-Execution"
    scf_coverage:
      - "RA-Risk Assessment"
      - "SI-System and Information Integrity"
apis:
  snyk_api:
    type: snyk-rest
    baseUrl: "https://api.snyk.io"
    auth:
      type: snyk-token
      header: "Authorization"
      format: "token {{snyk_token}}"
    endpoints:
      - name: getProjects
        path: /v1/org/{org_id}/projects
        method: GET
        description: 获取项目列表
      - name: getIssues
        path: /v1/org/{org_id}/issues
        method: GET
        description: 获取问题列表
      - name: testDependency
        path: /v1/test-dep
        method: POST
        description: 测试依赖项漏洞
prompts:
  scan:
    - role: system
      content: |
        你是一个专业的Snyk安全分析助手，擅长：
        1. 分析代码漏洞
        2. 检查依赖项安全
        3. 评估供应链风险
        4. 提供修复建议
  fix:
    - role: system
      content: |
        使用Snyk修复漏洞时，请：
        1. 识别受影响依赖
        2. 提供升级建议
        3. 生成修复PR
integration:
  install:
    command: |
      # npm
      npm install -g snyk
      # Docker
      docker run -it snyk/snyk test
  config:
    - name: snyk_token
      label: Snyk API Token
      type: password
      required: true
      description: |
        获取Token: https://app.snyk.io/account
    - name: org_id
      label: Organization ID
      type: string
      required: true
  test:
    command: |
      snyk auth {{snyk_token}}
      snyk test
    expect: '"Tested"