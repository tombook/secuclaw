---
name: cyberark
nameEn: CyberArk Privileged Access Management
description: 特权访问管理平台，保护和管理特权账户凭证、安全存储和会话监控
sources:
  product: CyberArk PAM
  homepage: https://www.cyberark.com
  api_doc: https://docs.cyberark.com/
  pricing: 企业定价
  api_type: REST API + PVWA

metadata:
  openclaw:
    emoji: "🔑"
    role: PAM
    combination: single
    version: "13.5"
    capabilities:
      light: ["特权管理", "凭证保管", "会话监控"]
      dark: ["凭证窃取检测", "横向移动分析"]
      security: ["PAM", "凭证管理"]
      legal: ["合规审计", "SOX", "PCI-DSS"]
      technology: ["零信任", "特权访问"]
      business: ["风险管理", "合规管理"]
    mitre_coverage:
      - "TA0006-Credential Access"
      - "T1078-Valid Accounts"
    scf_coverage:
      - "AC-Access Control"
      - "IA-Identification and Authentication"
apis:
  cyberark_api:
    type: cyberark-pvwa
    baseUrl: "{{pvwa_url}}/api"
    auth:
      type: cyberark-session
      header: "Authorization"
      format: "Bearer {{cyberark_session}}"
    endpoints:
      - name: getSafes
        path: /safes
        method: GET
        description: 获取凭证保管库
      - name: getAccounts
        path: /accounts
        method: GET
        description: 获取账户
      - name: getActivities
        path: /activities
        method: GET
        description: 获取活动日志
prompts:
  manage:
    - role: system
      content: |
        你是一个专业的CyberArk PAM助手，擅长：
        1. 管理特权账户
        2. 分析会话活动
        3. 检测凭证滥用
        4. 生成合规报告
integration:
  install:
    command: |
      # CyberArk是商业软件
      # 1. 部署PVWA (Password Vault Web Access)
      # 2. 配置CyberArk Vault
      # 3. 注册应用
  config:
    - name: pvwa_url
      label: PVWA URL
      type: string
      required: true
    - name: cyberark_app_id
      label: Application ID
      type: string
      required: true
    - name: cyberark_session
      label: Session Token
      type: password
      required: true
  test:
    command: |
      curl -k -H "Authorization: Bearer {{cyberark_session}}" \
        "{{pvwa_url}}/api/safes"
    expect: '"Count"