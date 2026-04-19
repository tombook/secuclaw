---
name: amass
nameEn: Amass Subdomain
description: OWASP子域名发现工具，支持被动和主动枚举
sources:
  product: OWASP Amass
  homepage: https://github.com/OWASP/Amass
  api_doc: https://github.com/OWASP/Amass
  github: https://github.com/OWASP/Amass
  pricing: 开源免费
  api_type: CLI

metadata:
  openclaw:
    emoji: "🔍"
    role: RECON
    combination: single
    version: "3.23"
    capabilities:
      light: ["子域名枚举", "OSINT"]
      dark: ["攻击面发现", "侦察"]
      security: ["渗透测试", "安全评估"]
      legal: ["渗透测试授权"]
      technology: ["DNS枚举"]
      business: ["攻击面评估"]
    mitre_coverage:
      - "TA0007-Discovery"
      - "TA0013-Scanning"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  amass_cli:
    type: cli
    command: amass
    options:
      - name: enum
        description: 枚举模式
      - name: -d
        description: 目标域名
      - name: -o
        description: 输出文件
prompts:
  enumerate:
    - role: system
      content: |
        你是一个专业的Amass子域名枚举助手，擅长：
        1. 发现子域名
        2. 收集OSINT情报
        3. 分析DNS记录
        4. 评估攻击面
integration:
  install:
    command: |
      # macOS
      brew install amass
      # Linux
      apt-get install amass
      # Go
      go install github.com/OWASP/Amass/v3/...@latest
  config:
    - name: amass_wordlist
      label: 字典文件
      type: string
      default: "/usr/share/wordlists/amass/"
  test:
    command: |
      amass version
      amass enum -d example.com
    expect: "amass"