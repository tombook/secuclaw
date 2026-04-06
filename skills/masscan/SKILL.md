---
name: masscan
nameEn: Masscan Port Scanner
description: 超高速异步端口扫描器
sources:
  product: Masscan
  homepage: https://github.com/robertdavidgraham/masscan
  api_doc: https://github.com/robertdavidgraham/masscan
  github: https://github.com/robertdavidgraham/masscan
  pricing: 开源免费
  api_type: CLI

metadata:
  openclaw:
    emoji: "⚡"
    role: RECON
    combination: single
    version: "1.3"
    capabilities:
      light: ["端口扫描", "快速发现"]
      dark: ["大范围扫描", "侦察"]
      security: ["渗透测试"]
      legal: ["渗透测试授权"]
      technology: ["异步扫描"]
      business: ["攻击面评估"]
    mitre_coverage:
      - "TA0007-Discovery"
      - "T1046-Network Service Scanning"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  masscan_cli:
    type: cli
    command: masscan
    options:
      - name: -p
        description: 端口范围
      - name: -oX
        description: XML输出
prompts:
  scan:
    - role: system
      content: |
        你是一个专业的Masscan端口扫描助手，擅长：
        1. 快速端口扫描
        2. 发现开放服务
        3. 评估攻击面
integration:
  install:
    command: |
      # 编译安装
      git clone https://github.com/robertdavidgraham/masscan
      cd masscan && make
      # macOS
      brew install masscan
      # Linux
      apt-get install masscan
  config:
    - name: masscan_ports
      label: 默认端口
      type: string
      default: "1-10000"
  test:
    command: |
      masscan --version
      masscan 0.0.0.0/0 -p0-1000 --rate 10000
    expect: "masscan"