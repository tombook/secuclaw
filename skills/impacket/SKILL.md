---
name: impacket
nameEn: Impacket
description: Python网络协议工具集，用于AD渗透和凭证攻击
sources:
  product: Impacket
  homepage: https://github.com/fortra/impacket
  api_doc: https://github.com/fortra/impacket
  github: https://github.com/fortra/impacket
  pricing: 开源免费
  api_type: Python库

metadata:
  openclaw:
    emoji: "🐍"
    role: AD
    combination: single
    version: "0.12"
    capabilities:
      light: ["安全研究", "AD审计"]
      dark: ["NTLMRelay", "SMB攻击"]
      security: ["渗透测试"]
      legal: ["渗透测试授权"]
      technology: ["Python网络"]
      business: ["安全评估"]
    mitre_coverage:
      - "TA0006-Credential Access"
      - "TA0008-Lateral Movement"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  impacket_cli:
    type: cli
    command: python
    options:
      - name: -m
        description: impacket模块
prompts:
  pentest:
    - role: system
      content: |
        你是一个专业的Impacket工具助手，擅长：
        1. 使用impacket进行AD攻击
        2. 执行凭证攻击
        3. 评估AD安全
integration:
  install:
    command: |
      # pip
      pip install impacket
      # Kali
      # 已预装
  config:
    - name: impacket_examples
      label: 常用工具
      type: string
      default: "wmiexec,smbexec,psexec"
  test:
    command: |
      python -c "import impacket; print(impacket.__version__)"
      python -m impacket.examples.wmiexec
    expect: "impacket"