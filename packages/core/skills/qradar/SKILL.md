---
name: ibm-qradar
sources:
  product: IBM QRadar
  homepage: https://www.ibm.com/qradar
  api_doc: https://www.ibm.com/docs/en/qradar-common
  pricing: 企业定价
  api_type: REST API + AQL
metadata:
  openclaw:
    emoji: "🟦"
    role: SIEM
    combination: single
    version: "7.5"
    capabilities:
      light: ["日志管理", "威胁检测", "合规报告"]
      dark: ["威胁狩猎", "攻击溯源", "APT检测"]
      security: ["SIEM", "AQL查询"]
      legal: ["合规审计", "GDPR", "SOX"]
      technology: ["DSM", "App hosts"]
      business: ["风险评分", "运营效率"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0007-Discovery"
      - "TA0011-Command and Control"
    scf_coverage:
      - "AU-Audit and Accountability"
apis:
  qradar_api:
    type: qradar-rest
    baseUrl: "{{qradar_url}}/api"
    auth:
      type: qradar-token
      header: "SEC"
      format: "{{qradar_token}}"
    endpoints:
      - name: getOffenses
        path: /siEM/offenses
        method: GET
        description: 获取安全事件
        params:
          - name: filter
            type: string
            required: false
          - name: range
            type: string
            required: false
          
      - name: getLogs
        path: /ariel/searches
        method: POST
        description: 执行AQL搜索
        body: |
          {
            "query": "SELECT * FROM events LAST {{hours}} HOURS",
            "range": "AUTO"
          }

prompts:
  analyze:
    - role: system
      content: |
        你是一个专业的QRadar SIEM分析助手，擅长：
        1. 使用AQL进行搜索
        2. 分析安全事件
        3. 进行威胁狩猎
        4. 生成合规报告

integration:
  install:
    command: |
      # QRadar是商业软件
      # 1. 部署QRadar服务器
      # 2. 配置数据源
      # 3. 获取API Token
  config:
    - name: qradar_url
      label: QRadar Console URL
      type: string
      required: true
    - name: qradar_token
      label: API Token
      type: password
      required: true
  test:
    command: |
      curl -k -H "SEC: {{qradar_token}}" \
        "{{qradar_url}}/api/system/status"
    expect: '"hostname"
