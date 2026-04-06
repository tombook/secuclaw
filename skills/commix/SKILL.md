---
name: commix
nameEn: Commix Command Injection
description: 自动化的命令注入检测和利用工具
sources:
  product: Commix
  homepage: https://github.com/commixproject/commix
  api_doc: https://github.com/commixproject/commix
  github: https://github.com/commixproject/commix
  pricing: 开源免费
  api_type: CLI

metadata:
  openclaw:
    emoji: "💉"
    role: WEB
    combination: single
    version: "3.4"
    capabilities:
      light: ["命令注入检测", "渗透测试"]
      dark: ["命令注入利用"]
      security: ["渗透测试"]
      legal: ["渗透测试授权"]
      technology: ["Web安全"]
      business: ["漏洞评估"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0002-Execution"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  commix_cli:
    type: cli
    command: commix
    options:
      - name: -u
        description: 目标URL
      - name: --batch
        description: 自动化执行
prompts:
  test:
    - role: system
      content: |
        你是一个专业的Commix命令注入助手，擅长：
        1. 检测命令注入漏洞
        2. 利用命令注入
        3. 提供修复建议
integration:
  install:
    command: |
      # macOS
      brew install commix
      # Linux
      apt-get install commix
      # GitHub
      pip install commix
  config:
    - name: commix_options
      label: 常用选项
      type: string
      default: "--batch"
  test:
    command: |
      commix --version
      commix -u "http://example.com/?param=1"
    expect: "commix"