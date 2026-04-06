---
name: hydra
nameEn: Hydra Password Cracking
description: 并行登录暴力破解工具，支持50+协议
sources:
  product: THC-Hydra
  homepage: https://github.com/vanhauser-thc/thc-hydra
  api_doc: https://github.com/vanhauser-thc/thc-hydra
  github: https://github.com/vanhauser-thc/thc-hydra
  pricing: 开源免费
  api_type: CLI

metadata:
  openclaw:
    emoji: "💥"
    role: CRACKER
    combination: single
    version: "9.5"
    capabilities:
      light: ["凭证测试", "服务审计"]
      dark: ["暴力破解", "凭证填充"]
      security: ["渗透测试", "安全审计"]
      legal: ["渗透测试授权"]
      technology: ["并行破解", "协议支持"]
      business: ["安全评估"]
    mitre_coverage:
      - "TA0006-Credential Access"
      - "T1110-Brute Force"
    scf_coverage:
      - "IA-Identification and Authentication"
apis:
  hydra_cli:
    type: cli
    command: hydra
    options:
      - name: -l
        description: 登录名
      - name: -P
        description: 密码字典
      - name: -t
        description: 并行任务数
prompts:
  audit:
    - role: system
      content: |
        你是一个专业的Hydra凭证测试助手，擅长：
        1. 执行授权的暴力测试
        2. 审计服务安全
        3. 评估密码策略
integration:
  install:
    command: |
      # macOS
      brew install hydra
      # Linux
      apt-get install hydra
  config:
    - name: hydra_targets
      label: 默认目标
      type: string
      default: "ssh://target:22"
  test:
    command: |
      hydra -h
    expect: "hydra"