---
name: rubeus
nameEn: Rubeus Kerberos
description: Kerberos滥用工具，用于AD渗透和票据攻击
sources:
  product: Rubeus
  homepage: https://github.com/GhostPack/Rubeus
  api_doc: https://github.com/GhostPack/Rubeus
  github: https://github.com/GhostPack/Rubeus
  pricing: 开源免费
  api_type: CLI (.NET)

metadata:
  openclaw:
    emoji: "🎫"
    role: AD
    combination: single
    version: "2.3"
    capabilities:
      light: ["安全研究"]
      dark: ["Kerberoast", "Pass-the-Ticket"]
      security: ["渗透测试"]
      legal: ["渗透测试授权"]
      technology: ["Kerberos"]
      business: ["AD安全评估"]
    mitre_coverage:
      - "TA0006-Credential Access"
      - "T1550-Use Alternate Authentication"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  rubeus_cli:
    type: cli
    command: Rubeus
    options:
      - name: kerberoast
        description: Kerberoasting攻击
      - name: ptT
        description: Pass-the-Ticket
prompts:
  test:
    - role: system
      content: |
        你是一个专业的Rubeus Kerberos安全助手，擅长：
        1. 演示Kerberos攻击
        2. 评估AD安全
        3. 提供防御建议
integration:
  install:
    command: |
      # 下载最新release
      # https://github.com/GhostPack/Rubeus/releases
      # Kali
      locate rubeus
  config:
    - name: rubeus_command
      label: 常用命令
      type: string
      default: "kerberoast"
  test:
    command: |
      ./Rubeus.exe --help
      ./Rubeus.exe kerberoast
    expect: "Rubeus"