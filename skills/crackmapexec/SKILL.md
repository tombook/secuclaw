---
name: crackmapexec
nameEn: CrackMapExec
description: Active Directory渗透测试工具，支持凭证攻击和横向移动
sources:
  product: CrackMapExec
  homepage: https://github.com/PorLaCola25/CrackMapExec
  api_doc: https://github.com/PorLaCola25/CrackMapExec
  github: https://github.com/PorLaCola25/CrackMapExec
  pricing: 开源免费
  api_type: CLI

metadata:
  openclaw:
    emoji: "🗝️"
    role: AD
    combination: single
    version: "5.4"
    capabilities:
      light: ["AD审计", "安全评估"]
      dark: ["横向移动", "凭证攻击"]
      security: ["渗透测试"]
      legal: ["渗透测试授权"]
      technology: ["AD安全"]
      business: ["安全评估"]
    mitre_coverage:
      - "TA0006-Credential Access"
      - "TA0008-Lateral Movement"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  cme_cli:
    type: cli
    command: crackmapexec
    options:
      - name: smb
        description: SMB协议
      - name: -u
        description: 用户名
      - name: -p
        description: 密码
prompts:
  pentest:
    - role: system
      content: |
        你是一个专业的CME AD渗透测试助手，擅长：
        1. 执行AD攻击测试
        2. 发现横向移动路径
        3. 评估AD安全
integration:
  install:
    command: |
      # Docker
      docker run -it --rm \
        byt3bl33d3r/crackmapexec
      # pip
      pip install crackmapexec
      # Kali
      # 已预装
  config:
    - name: cme_target
      label: 目标
      type: string
      default: "192.168.1.0/24"
  test:
    command: |
      crackmapexec --version
      crackmapexec smb 192.168.1.0/24 -u admin -p password
    expect: "CrackMapExec"