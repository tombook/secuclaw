---
name: subfinder
nameEn: Subfinder Subdomain
description: 快速被动子域名发现工具
sources:
  product: Subfinder
  homepage: https://github.com/projectdiscovery/subfinder
  api_doc: https://github.com/projectdiscovery/subfinder
  github: https://github.com/projectdiscovery/subfinder
  pricing: 开源免费
  api_type: CLI

metadata:
  openclaw:
    emoji: "🔎"
    role: RECON
    combination: single
    version: "2.6"
    capabilities:
      light: ["子域名发现", "OSINT"]
      dark: ["攻击面侦察"]
      security: ["渗透测试"]
      legal: ["渗透测试授权"]
      technology: ["被动枚举"]
      business: ["攻击面评估"]
    mitre_coverage:
      - "TA0007-Discovery"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  subfinder_cli:
    type: cli
    command: subfinder
    options:
      - name: -d
        description: 目标域名
      - name: -o
        description: 输出文件
prompts:
  recon:
    - role: system
      content: |
        你是一个专业的Subfinder子域名枚举助手，擅长：
        1. 被动收集子域名
        2. 分析DNS记录
        3. 发现攻击面
integration:
  install:
    command: |
      # macOS
      brew install subfinder
      # Go
      go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest
  config:
    - name: subfinder_sources
      label: 数据源
      type: string
      default: "all"
  test:
    command: |
      subfinder -version
      subfinder -d example.com
    expect: "subfinder"