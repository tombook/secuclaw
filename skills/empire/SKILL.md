---
name: empire
nameEn: Empire PowerShell
description: PowerShell后渗透框架，支持Windows和Linux的权限维持和横向移动
sources:
  product: Empire
  homepage: https://github.com/BC-SECURITY/Empire
  api_doc: https://github.com/BC-SECURITY/Empire
  github: https://github.com/BC-SECURITY/Empire
  pricing: 开源免费
  api_type: REST API + CLI

metadata:
  openclaw:
    emoji: "👑"
    role: REDTEAM
    combination: single
    version: "4.8"
    capabilities:
      light: ["安全研究", "防御测试"]
      dark: ["后渗透", "权限维持", "横向移动"]
      security: ["红队演练", "攻击模拟"]
      legal: ["渗透测试授权"]
      technology: ["PowerShell", "Python"]
      business: ["安全评估"]
    mitre_coverage:
      - "TA0002-Execution"
      - "TA0003-Persistence"
      - "TA0008-Lateral Movement"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  empire_api:
    type: empire-rest
    baseUrl: "{{empire_url}}:5000"
    auth:
      type: empire-token
      header: "Authorization"
      format: "Bearer {{empire_token}}"
    endpoints:
      - name: getAgents
        path: /api/agents
        method: GET
        description: 获取agent列表
      - name: getListeners
        path: /api/listeners
        method: GET
        description: 获取监听器
prompts:
  redteam:
    - role: system
      content: |
        你是一个专业的Empire红队助手，擅长：
        1. 执行后渗透测试
        2. 演示权限维持
        3. 模拟横向移动
integration:
  install:
    command: |
      # Docker
      docker run -d --name empire \
        -p 5000:5000 -p 5001:5001 \
        bcsecurity/empire:latest
      # 源码安装
      # https://github.com/BC-SECURITY/Empire
  config:
    - name: empire_url
      label: Empire URL
      type: string
      default: "http://localhost"
      required: true
  test:
    command: |
      curl -k "http://localhost:5000/api/status"
    expect: '"version"