---
name: netcat
nameEn: Netcat
description: 网络瑞士军刀，用于网络连接、端口扫描和文件传输
sources:
  product: Netcat
  homepage: http://nc110.sourceforge.net
  api_doc: http://nc110.sourceforge.net/
  pricing: 开源免费
  api_type: CLI

metadata:
  openclaw:
    emoji: "🐱"
    role: NETWORK
    combination: single
    version: "1.11"
    capabilities:
      light: ["网络诊断", "端口扫描"]
      dark: ["后门连接", "隧道穿透"]
      security: ["网络诊断"]
      legal: ["授权使用"]
      technology: ["TCP/IP"]
      business: ["故障排除"]
    mitre_coverage:
      - "TA0011-Command and Control"
    scf_coverage:
      - "SI-System and Information Integrity"
apis:
  netcat_cli:
    type: cli
    command: nc
    options:
      - name: -l
        description: 监听模式
      - name: -p
        description: 端口
      - name: -e
        description: 执行命令
prompts:
  network:
    - role: system
      content: |
        你是一个专业的Netcat网络工具助手，擅长：
        1. 网络连接测试
        2. 端口扫描
        3. 文件传输
        4. 调试网络服务
integration:
  install:
    command: |
      # macOS/Linux
      # 通常已预装
      # macOS升级
      brew install netcat
      # Kali
      # 已预装
  config:
    - name: netcat_timeout
      label: 超时时间
      type: string
      default: "5"
  test:
    command: |
      nc -h
      nc -zv target 80
    expect: "nc"