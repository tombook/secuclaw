---
name: sonarqube
nameEn: SonarQube Code Quality
description: 代码质量和安全审计平台，支持代码异味检测、安全漏洞扫描和技术债务管理
sources:
  product: SonarQube
  homepage: https://sonarsource.com
  api_doc: https://sonarsource.com/go-academy/technical-article-sonarqube-web-api/
  github: https://github.com/SonarSource/sonarqube
  pricing: 社区版免费 | 付费版€10/月起
  api_type: REST API

metadata:
  openclaw:
    emoji: "🐞"
    role: SCA
    combination: single
    version: "10.5"
    capabilities:
      light: ["代码质量", "代码异味", "漏洞扫描"]
      dark: ["后门检测", "恶意代码分析"]
      security: ["SAST", "代码审计"]
      legal: ["许可证合规"]
      technology: ["DevSecOps", "CI/CD集成"]
      business: ["代码质量指标"]
    mitre_coverage:
      - "TA0002-Execution"
      - "TA0005-Defense Evasion"
    scf_coverage:
      - "SI-System and Information Integrity"
apis:
  sonarqube_api:
    type: sonarqube-rest
    baseUrl: "{{sonarqube_url}}"
    auth:
      type: sonarqube-token
      header: "Authorization"
      format: "Bearer {{sonarqube_token}}"
    endpoints:
      - name: getProjects
        path: /api/projects/search
        method: GET
        description: 获取项目列表
      - name: getMeasures
        path: /api/measures/search
        method: GET
        description: 获取度量数据
      - name: getIssues
        path: /api/issues/search
        method: GET
        description: 获取问题列表
      - name: getHotspots
        path: /api/hotspots/search
        method: GET
        description: 获取安全热点
prompts:
  analyze:
    - role: system
      content: |
        你是一个专业的SonarQube代码分析助手，擅长：
        1. 分析代码质量问题
        2. 检测安全漏洞
        3. 评估技术债务
        4. 提供修复建议
  audit:
    - role: system
      content: |
        使用SonarQube进行代码审计时，请：
        1. 识别高严重性问题
        2. 分析安全热点
        3. 评估代码复杂度
integration:
  install:
    command: |
      # Docker
      docker run -d --name sonarqube \
        -p 9000:9000 \
        sonarqube:latest
      # 扫描代码
      sonar-scanner
  config:
    - name: sonarqube_url
      label: SonarQube URL
      type: string
      default: "http://localhost:9000"
      required: true
    - name: sonarqube_token
      label: Token
      type: password
      required: true
      description: |
        获取Token:
        1. 登录SonarQube
        2. My Account → Security
        3. 生成Token
  test:
    command: |
      curl -k -H "Authorization: Bearer {{sonarqube_token}}" \
        "{{sonarqube_url}}/api/projects/search"
    expect: '"components"