---
name: responder
nameEn: Responder LLMNR
description: NBT-NS和LLMNR欺骗工具，用于内网渗透测试
sources:
  product: Responder
  homepage: https://github.com/SpiderLabs/Responder
  api_doc: https://github.com/SpiderLabs/Responder
  github: https://github.com/SpiderLabs/Responder
  pricing: 开源免费
  api_type: CLI

metadata:
  openclaw:
    emoji: "🎭"
    role: REDTEAM
    combination: single
    version: "3.1"
    capabilities:
      light: ["安全研究", "防御测试"]
      dark: ["LLMNR欺骗", "凭证窃取"]
      security: ["渗透测试"]
      legal: ["渗透测试授权"]
      technology: ["网络欺骗"]
      business: ["安全评估"]
    mitre_coverage:
      - "TA0006-Credential Access"
      - "T1048-Exfiltration"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  responder_cli:
    type: cli
    command: Responder
    options:
      - name: -I
        description: 网卡接口
      - name: -w
        description: 启用WPAD代理
prompts:
  test:
    - role: system
      content: |
        你是一个专业的Responder安全研究助手，擅长：
        1. 演示LLMNR欺骗攻击
        2. 评估内网安全
        3. 提供防御建议
integration:
  install:
    command: |
      # Kali Linux
      # 已预装
      # GitHub
      git clone https://github.com/SpiderLabs/Responder
  config:
    - name: responder_interface
      label: 网络接口
      type: string
      default: "eth0"
  test:
    command: |
      python Responder.py --version
      python Responder.py -I eth0
    expect: "Responder"