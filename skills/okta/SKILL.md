---
name: okta
nameEn: Okta Identity
description: 企业身份和访问管理平台，支持单点登录、多因素认证和生命周期管理
sources:
  product: Okta
  homepage: https://www.okta.com
  api_doc: https://developer.okta.com/docs/reference/
  pricing: 免费版1,000 MAU | 付费版$0.75/MAU起
  api_type: REST API + OAuth2

metadata:
  openclaw:
    emoji: "🔑"
    role: IAM
    combination: single
    version: "2024"
    capabilities:
      light: ["身份认证", "访问管理", "单点登录"]
      dark: ["身份绕过检测", "权限滥用分析"]
      security: ["IAM", "MFA", "SSO"]
      legal: ["合规审计", "GDPR", "SOX"]
      technology: ["身份治理", "零信任"]
      business: ["访问控制", "风险评估"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0006-Credential Access"
      - "TA0003-Persistence"
    scf_coverage:
      - "AC-Access Control"
      - "IA-Identification and Authentication"
apis:
  okta_api:
    type: okta-rest
    baseUrl: "https://{{okta_domain}}/api/v1"
    auth:
      type: okta-token
      header: "Authorization"
      format: "SSWS {{okta_token}}"
    endpoints:
      - name: getUsers
        path: /users
        method: GET
        description: 获取用户列表
      - name: getUser
        path: /users/{user_id}
        method: GET
        description: 获取用户详情
      - name: getGroups
        path: /groups
        method: GET
        description: 获取用户组
      - name: getLogs
        path: /logs
        method: GET
        description: 获取审计日志
        params:
          - name: since
            type: string
            required: false
prompts:
  analyze:
    - role: system
      content: |
        你是一个专业的Okta身份安全助手，擅长：
        1. 分析身份认证日志
        2. 检测异常登录
        3. 审查访问权限
        4. 生成合规报告
  audit:
    - role: system
      content: |
        使用Okta进行审计时，请：
        1. 检查异常登录行为
        2. 审查权限变更
        3. 分析MFA绕过尝试
integration:
  install:
    command: |
      # Okta是SaaS服务
      # 1. 注册Okta组织
      # 2. 创建API Token
      # 3. 配置集成应用
  config:
    - name: okta_domain
      label: Okta Domain
      type: string
      required: true
      description: "如: your-org.okta.com"
    - name: okta_token
      label: API Token
      type: password
      required: true
      description: |
        获取Token:
        1. 登录Admin Console
        2. Security → API
        3. 创建Token
  test:
    command: |
      curl -v -H "Authorization: SSWS {{okta_token}}" \
        "https://{{okta_domain}}/api/v1/users?limit=1"
    expect: '"id"