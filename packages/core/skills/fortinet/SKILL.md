---
name: fortinet
nameEn: Fortinet FortiGate
description: Fortinet网络安全平台，支持下一代防火墙、SD-WAN、VPN和高级威胁防护
sources:
  product: Fortinet FortiGate
  homepage: https://www.fortinet.com
  api_doc: https://docs.fortinet.com/fortigate/70doc/dita/fortigate-70-odocs.pdf
  pricing: 硬件/VM定价
  api_type: REST API

metadata:
  openclaw:
    emoji: "🏰"
    role: NGFW
    combination: single
    version: "7.4"
    capabilities:
      light: ["防火墙", "VPN", "Web过滤"]
      dark: ["入侵检测", "恶意流量分析"]
      security: ["NGFW", "UTM", "VPN"]
      legal: ["合规审计"]
      technology: ["SD-WAN", "SSL检测"]
      business: ["网络分段", "性能优化"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0011-Command and Control"
    scf_coverage:
      - "SI-System and Information Integrity"
apis:
  fortinet_api:
    type: fortinet-rest
    baseUrl: "{{fortinet_url}}"
    auth:
      type: fortinet-token
      header: "Authorization"
      format: "Bearer {{fortinet_token}}"
    endpoints:
      - name: getSystemStatus
        path: /api/v2/monitor/system/status
        method: GET
        description: 获取系统状态
      - name: getLogs
        path: /api/v2/log/{type}/traffic
        method: GET
        description: 获取流量日志
      - name: getAlerts
        path: /api/v2/log/{type}/attack
        method: GET
        description: 获取攻击日志
prompts:
  analyze:
    - role: system
      content: |
        你是一个专业的Fortinet安全分析助手，擅长：
        1. 分析网络流量日志
        2. 检测安全威胁
        3. 审查防火墙策略
        4. 生成网络态势报告
integration:
  install:
    command: |
      # Fortinet是硬件/VM系列
      # 1. 访问Web管理界面
      # 2. 配置FortiGate
      # 3. 启用API访问
  config:
    - name: fortinet_url
      label: FortiGate URL
      type: string
      required: true
    - name: fortinet_token
      label: API Token
      type: password
      required: true
  test:
    command: |
      curl -k -H "Authorization: Bearer {{fortinet_token}}" \
        "{{fortinet_url}}/api/v2/monitor/system/status"
    expect: '"vdom"