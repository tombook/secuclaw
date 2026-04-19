---
name: thehive
nameEn: TheHive Security Platform
description: 开源安全事件响应和案例管理平台，支持任务管理、IOC管理和MISP集成
sources:
  product: TheHive
  homepage: https://thehive-project.org
  api_doc: https://docs.thehive-project.org/thaleaf/api/
  github: https://github.com/TheHive-Project/TheHive
  pricing: 开源免费
  api_type: REST API

metadata:
  openclaw:
    emoji: "🐝"
    role: SOAR
    combination: single
    version: "5.2"
    capabilities:
      light: ["事件管理", "案例追踪", "任务分配"]
      dark: ["威胁狩猎", "IOC关联", "攻击分析"]
      security: ["事件响应", "SOP管理"]
      legal: ["取证支持", "合规审计"]
      technology: ["MISP集成", "Cortex分析"]
      business: ["运营效率", "KPI追踪"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0004-Privilege Escalation"
      - "T1053-Scheduled Task"
    scf_coverage:
      - "IR-Incident Response"
      - "RA-Risk Assessment"
apis:
  thehive_api:
    type: thehive-rest
    baseUrl: "{{thehive_url}}"
    auth:
      type: thehive-key
      header: "Authorization"
      format: "Bearer {{thehive_key}}"
    endpoints:
      - name: getCases
        path: /v1/case
        method: GET
        description: 获取案例列表
      - name: getCase
        path: /v1/case/{case_id}
        method: GET
        description: 获取案例详情
      - name: createCase
        path: /v1/case
        method: POST
        description: 创建案例
        body: |
          {
            "title": "{{title}}",
            "description": "{{description}}",
            "severity": {{severity}},
            "tags": ["{{tags}}"]
          }
      - name: addObservable
        path: /v1/case/{case_id}/observable
        method: POST
        description: 添加可观察对象
prompts:
  respond:
    - role: system
      content: |
        你是一个专业的TheHive事件响应助手，擅长：
        1. 创建和管理安全事件案例
        2. 追踪响应任务进度
        3. 分析IOC和攻击指标
        4. 生成事件报告
  hunt:
    - role: system
      content: |
        使用TheHive进行威胁狩猎时，请：
        1. 创建调查案例
        2. 添加可疑IOC
        3. 关联MISP情报
        4. 执行Cortex分析
integration:
  install:
    command: |
      # Docker Compose
      cat > docker-compose.yml << 'EOF'
      version: '3'
      services:
        thehive:
          image: thehiveproject/thehive:latest
          ports:
            - "9000:9000"
          environment:
            - ADMIN_PASSWORD=admin_password
        cortex:
          image: thehiveproject/cortex:latest
          ports:
            - "9001:9001"
      EOF
      docker-compose up -d
  config:
    - name: thehive_url
      label: TheHive URL
      type: string
      default: "http://localhost:9000"
      required: true
    - name: thehive_key
      label: API Key
      type: password
      required: true
      description: |
        获取Key:
        1. 登录TheHive
        2. 用户菜单 → API Key
        3. 复制Key
  test:
    command: |
      curl -k -H "Authorization: Bearer {{thehive_key}}" \
        "{{thehive_url}}/api/case"
    expect: '"data"