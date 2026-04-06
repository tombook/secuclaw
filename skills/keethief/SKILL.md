---
name: keethief
nameEn: KeeThief
description: KeePass凭证提取工具，用于安全研究
sources:
  product: KeeThief
  homepage: https://github.com/GhostPack/KeeThief
  api_doc: https://github.com/GhostPack/KeeThief
  github: https://github.com/GhostPack/KeeThief
  pricing: 开源免费
  api_type: PowerShell

metadata:
  openclaw:
    emoji: "🔐"
    role: REDTEAM
    combination: single
    version: "1.0"
    capabilities:
      light: ["安全研究"]
      dark: ["凭证提取", "密码窃取"]
      security: ["渗透测试"]
      legal: ["渗透测试授权"]
      technology: ["凭证窃取"]
      business: ["安全评估"]
    mitre_coverage:
      - "TA0006-Credential Access"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  keethief_powershell:
    type: cli
    command: powershell
    options:
      - name: -ExecutionPolicy
        description: 执行策略
      - name: -File
        description: 脚本文件
prompts:
  research:
    - role: system
      content: |
        你是一个专业的KeeThief安全研究助手，擅长：
        1. 演示KeePass攻击
        2. 评估密码管理器安全
        3. 提供防御建议
integration:
  install:
    command: |
      # 下载KeeThief.ps1
      # https://github.com/GhostPack/KeeThief
  config:
    - name: keethief_usage
      label: 使用说明
      type: string
      default: "提取KeePass内存中的凭证"
  test:
    command: |
      powershell -ExecutionPolicy Bypass -FileKeeThief.ps1
    expect: "KeeThief"