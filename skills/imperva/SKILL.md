---
name: imperva-waf
sources:
  product: Imperva WAF
  homepage: https://www.imperva.com
  api_doc: https://docs.imperva.com/
  pricing: 企业定价
  api_type: REST API
nameEn: Imperva WAF
description: Web应用防火墙，保护Web应用和API免受攻击，支持DDoS防护和BOT管理
homepage: https://www.imperva.com
metadata:
  openclaw:
    emoji: "🛡️"
    role: WAF
    combination: single
    version: "2024"
    capabilities:
      light: ["WAF防护", "DDoS防护", "BOT管理"]
      dark: ["攻击检测", "漏洞利用防护"]
      security: ["WAF", "API安全"]
      legal: ["合规报告", "PCI-DSS"]
      technology: ["深度包检测", "行为分析"]
      business: ["性能优化", "可用性保障"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0011-Command and Control"
    scf_coverage:
      - "SI-System and Information Integrity"
apis:
  imperva_api:
    type: imperva-rest
    baseUrl: "{{imperva_api_url}}"
    auth:
      type: imperva-api-key
      header: "APIKeyId"
      format: "{{api_id}}:{{api_key}}"
    endpoints:
      - name: getEvents
        path: /v3/events
        method: GET
        description: 获取安全事件
        
      - name: getTraffic
        path: /v3/traffic
        method: GET
        description: 获取流量数据

prompts:
  analyze:
    - role: system
      content: |
        你是一个专业的Imperva WAF分析助手，擅长：
        1. 分析Web攻击事件
        2. 配置防护规则
        3. 检测BOT活动
        4. 生成安全报告

integration:
  install:
    command: |
      # Imperva是SaaS/本地服务
      # 1. 订阅Imperva服务
      # 2. 配置DNS指向Imperva
      # 3. 获取API凭证
  config:
    - name: imperva_api_url
      label: API URL
      type: string
      required: true
    - name: imperva_api_id
      label: API Key ID
      type: password
      required: true
    - name: imperva_api_key
      label: API Key
      type: password
      required: true
  test:
    command: |
      curl -k -H "APIKeyId: {{api_id}}:{{api_key}}" \
        "{{imperva_api_url}}/v3/events"
    expect: '"events"
