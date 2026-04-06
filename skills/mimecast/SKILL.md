---
name: mimecast
nameEn: Mimecast Email Security
description: 邮件安全网关，提供威胁防护、数据丢失防护和邮件归档服务
sources:
  product: Mimecast
  homepage: https://www.mimecast.com
  api_doc: https://www.mimecast.com/developers/
  pricing: 按用户计费
  api_type: REST API

metadata:
  openclaw:
    emoji: "📬"
    role: EMAIL
    combination: single
    version: "2024"
    capabilities:
      light: ["邮件安全", "钓鱼防护", "归档"]
      dark: ["BEC检测", "欺诈分析"]
      security: ["邮件网关", "DLP"]
      legal: ["合规归档", "eDiscovery"]
      technology: ["沙箱分析", "URL保护"]
      business: ["邮件风控"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "T1566-Phishing"
    scf_coverage:
      - "SI-System and Information Integrity"
apis:
  mimecast_api:
    type: mimecast-rest
    baseUrl: "https://{{region}}.mimecast.com/api"
    auth:
      type: mimecast-hmac
      header: "Authorization"
      format: "MC {{mimecast_access_key}}:{{mimecast_secret}}"
    endpoints:
      - name: getMessages
        path: /security/get-message-log
        method: POST
        description: 获取邮件日志
      - name: getDiscover
        path: /discover/get-quarantine
        method: POST
        description: 获取隔离邮件
prompts:
  analyze:
    - role: system
      content: |
        你是一个专业的Mimecast邮件安全助手，擅长：
        1. 分析邮件威胁
        2. 检测钓鱼攻击
        3. 管理隔离邮件
        4. 生成安全报告
integration:
  install:
    command: |
      # Mimecast是SaaS服务
      # 1. 订阅Mimecast服务
      # 2. 配置邮件流
      # 3. 获取API凭证
  config:
    - name: mimecast_access_key
      label: Access Key
      type: password
      required: true
    - name: mimecast_secret
      label: Secret Key
      type: password
      required: true
    - name: mimecast_app_id
      label: Application ID
      type: string
      required: true
  test:
    command: |
      curl -k -X POST "https://us1.mimecast.com/api/discover/get-quarantine" \
        -H "Authorization: MC {{access_key}}:{{secret}}" \
        -H "Content-Type: application/json" \
        -d '{"data": [{"start": "2024-01-01T00:00:00"}]}'
    expect: '"data"