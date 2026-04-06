---
name: cloudflare
nameEn: Cloudflare Security
description: 全球CDN和Web安全平台，提供DDoS防护、WAF、Bot管理和零信任安全
sources:
  product: Cloudflare
  homepage: https://www.cloudflare.com
  api_doc: https://developers.cloudflare.com/api/
  pricing: 免费版 | 付费版$20/月起
  api_type: REST API + GraphQL

metadata:
  openclaw:
    emoji: "🌤️"
    role: WAF
    combination: single
    version: "2024"
    capabilities:
      light: ["DDoS防护", "CDN加速", "WAF防护"]
      dark: ["Bot检测", "攻击分析", "威胁狩猎"]
      security: ["WAF", "零信任", "DDoS防护"]
      legal: ["合规报告", "GDPR"]
      technology: ["Anycast", "边缘计算"]
      business: ["性能优化", "可用性"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0011-Command and Control"
    scf_coverage:
      - "SI-System and Information Integrity"
apis:
  cloudflare_api:
    type: cloudflare-rest
    baseUrl: "https://api.cloudflare.com/client/v4"
    auth:
      type: cloudflare-token
      header: "Authorization"
      format: "Bearer {{cf_token}}"
    endpoints:
      - name: getZones
        path: /zones
        method: GET
        description: 获取域名列表
      - name: getAnalytics
        path: /zones/{zone_id}/analytics/dashboard
        method: GET
        description: 获取流量分析
      - name: getFirewallEvents
        path: /zones/{zone_id}/firewall/events
        method: GET
        description: 获取防火墙事件
      - name: getWAFRules
        path: /zones/{zone_id}/firewall/rules
        method: GET
        description: 获取WAF规则
prompts:
  analyze:
    - role: system
      content: |
        你是一个专业的Cloudflare安全分析助手，擅长：
        1. 分析Web攻击日志
        2. 配置WAF规则
        3. 检测Bot活动
        4. 生成安全报告
  protect:
    - role: system
      content: |
        使用Cloudflare进行防护时，请：
        1. 分析攻击模式
        2. 配置IP/域阻断
        3. 调整WAF规则
integration:
  install:
    command: |
      # Cloudflare是SaaS服务
      # 1. 注册Cloudflare
      # 2. 添加域名
      # 3. 获取API Token
  config:
    - name: cf_token
      label: API Token
      type: password
      required: true
      description: |
        获取Token:
        1. 登录Cloudflare Dashboard
        2. Profile → API Tokens
        3. 创建自定义Token
    - name: zone_id
      label: Zone ID
      type: string
      required: false
  test:
    command: |
      curl -k -X GET "https://api.cloudflare.com/client/v4/zones" \
        -H "Authorization: Bearer {{cf_token}}"
    expect: '"result"