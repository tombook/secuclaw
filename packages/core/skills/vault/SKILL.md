---
name: hashicorp-vault
nameEn: HashiCorp Vault
description: 密钥和秘密管理平台，支持安全存储、动态凭证、加密服务和身份授权
sources:
  product: HashiCorp Vault
  homepage: https://www.vaultproject.io
  api_doc: https://developer.hashicorp.com/vault/api
  github: https://github.com/hashicorp/vault
  pricing: 开源免费 | 云版$0.026/MAU起
  api_type: REST API

metadata:
  openclaw:
    emoji: "🔐"
    role: KMS
    combination: single
    version: "1.16"
    capabilities:
      light: ["密钥管理", "秘密存储", "凭证管理"]
      dark: ["凭证窃取检测", "密钥滥用分析"]
      security: ["PKI", "加密服务", "审计"]
      legal: ["合规审计", "GDPR"]
      technology: ["零信任", "动态凭证"]
      business: ["密钥轮换", "访问控制"]
    mitre_coverage:
      - "TA0006-Credential Access"
      - "T1552-Unsecured Credentials"
    scf_coverage:
      - "AC-Access Control"
      - "SI-System and Information Integrity"
apis:
  vault_api:
    type: vault-rest
    baseUrl: "{{vault_addr}}"
    auth:
      type: vault-token
      header: "X-Vault-Token"
      format: "{{vault_token}}"
    endpoints:
      - name: health
        path: /sys/health
        method: GET
        description: 健康检查
      - name: listSecrets
        path: /v1/{{secret_path}}
        method: LIST
        description: 列出秘密
      - name: readSecret
        path: /v1/{{secret_path}}
        method: GET
        description: 读取秘密
      - name: writeSecret
        path: /v1/{{secret_path}}
        method: POST
        description: 写入秘密
      - name: getPolicies
        path: /v1/sys/policies/acl
        method: GET
        description: 获取策略
      - name: getLogs
        path: /v1/sys/loggers
        method: GET
        description: 获取审计日志
prompts:
  manage:
    - role: system
      content: |
        你是一个专业的Vault密钥管理助手，擅长：
        1. 管理密钥和秘密
        2. 配置访问策略
        3. 分析审计日志
        4. 实施密钥轮换
  audit:
    - role: system
      content: |
        使用Vault进行安全审计时，请：
        1. 检查异常访问模式
        2. 审查密钥使用情况
        3. 分析凭证生命周期
integration:
  install:
    command: |
      # Docker
      docker run -d --name vault \
        -p 8200:8200 \
        -e VAULT_ADDR=http://localhost:8200 \
        hashicorp/vault:latest
      # 本地安装
      # https://www.vaultproject.io/downloads
  config:
    - name: vault_addr
      label: Vault Address
      type: string
      default: "http://localhost:8200"
      required: true
    - name: vault_token
      label: Vault Token
      type: password
      required: true
      description: Root Token或具有相应权限的Token
  test:
    command: |
      export VAULT_ADDR="{{vault_addr}}"
      vault status
      vault token lookup
    expect: '"Key"