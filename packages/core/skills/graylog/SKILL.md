---
name: graylog
nameEn: Graylog SIEM
description: 开源日志管理和SIEM平台，支持日志收集、搜索分析和安全告警
sources:
  product: Graylog
  homepage: https://www.graylog.org
  api_doc: https://docs.graylog.org/
  github: https://github.com/Graylog2/graylog2-server
  pricing: 开源免费 | 企业版定价
  api_type: REST API

metadata:
  openclaw:
    emoji: "🐘"
    role: SIEM
    combination: single
    version: "6.0"
    capabilities:
      light: ["日志管理", "告警分析", "可视化"]
      dark: ["威胁狩猎", "攻击溯源"]
      security: ["SIEM", "日志分析"]
      legal: ["合规审计"]
      technology: ["全文搜索", "GELF"]
      business: ["运营分析"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0007-Discovery"
    scf_coverage:
      - "AU-Audit and Accountability"
apis:
  graylog_api:
    type: graylog-rest
    baseUrl: "{{graylog_url}}"
    auth:
      type: graylog-token
      header: "X-Requested-By"
      format: "Graylog API Token: {{graylog_token}}"
    endpoints:
      - name: search
        path: /api/search/universal/relative
        method: GET
        description: 执行搜索
        params:
          - name: query
            type: string
            required: true
          - name: range
            type: integer
            required: false
          - name: limit
            type: integer
            required: false
prompts:
  analyze:
    - role: system
      content: |
        你是一个专业的Graylog日志分析助手，擅长：
        1. 搜索和分析日志
        2. 检测异常行为
        3. 创建告警规则
        4. 生成安全报告
integration:
  install:
    command: |
      # Docker Compose
      cat > docker-compose.yml << 'EOF'
      version: '3'
      services:
        mongodb:
          image: mongo:6
        elasticsearch:
          image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
        graylog:
          image: graylog/graylog:6.0
          ports:
            - 9000:9000
      EOF
  config:
    - name: graylog_url
      label: Graylog URL
      type: string
      default: "http://localhost:9000"
      required: true
    - name: graylog_token
      label: API Token
      type: password
      required: true
  test:
    command: |
      curl -k -H "X-Requested-By: Graylog API" \
        "{{graylog_url}}/api/system/locales"
    expect: '"locales"