---
name: raccoon
nameEn: Raccoon reconnaissance
description: 高性能Web reconnaissance工具，用于渗透测试信息收集
sources:
  product: Raccoon
  homepage: https://github.com/evyatarmeged/Raccoon
  api_doc: https://github.com/evyatarmeged/Raccoon
  github: https://github.com/evyatarmeged/Raccoon
  pricing: 开源免费
  api_type: CLI

metadata:
  openclaw:
    emoji: "🦝"
    role: RECON
    combination: single
    version: "1.2"
    capabilities:
      light: ["信息收集", "OSINT"]
      dark: ["侦察", "攻击面发现"]
      security: ["渗透测试", "安全评估"]
      legal: ["渗透测试授权"]
      technology: ["Web侦察"]
      business: ["攻击面评估"]
    mitre_coverage:
      - "TA0007-Discovery"
      - "TA0013-Scanning"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  raccoon_cli:
    type: cli
    command: raccoon
    options:
      - name: -d
        description: 目标域名
      - name: -o
        description: 输出目录
prompts:
  recon:
    - role: system
      content: |
        你是一个专业的Raccoon侦察助手，擅长：
        1. 执行OSINT侦察
        2. 发现攻击面
        3. 收集子域名
        4. 分析目标信息
integration:
  install:
    command: |
      # Docker
      docker run -d --name raccoon \
        raccoon-attack/scanner:latest
      # Go
      go install github.com/evyatarmeged/Raccoon@latest
  config:
    - name: raccoon_dns_servers
      label: DNS服务器
      type: string
      default: "8.8.8.8"
  test:
    command: |
      raccoon --version
      raccoon -d example.com
    expect: "raccoon"