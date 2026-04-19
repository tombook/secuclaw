---
name: nikto
nameEn: Nikto Web Scanner
description: 开源Web服务器扫描器，检测危险文件、CGI漏洞和服务器配置问题
sources:
  product: Nikto
  homepage: https://cirt.net/Nikto2
  api_doc: https://github.com/sullo/nikto/wiki
  github: https://github.com/sullo/nikto
  pricing: 开源免费
  api_type: CLI

metadata:
  openclaw:
    emoji: "🕷️"
    role: WEB
    combination: single
    version: "2.5"
    capabilities:
      light: ["Web漏洞扫描", "配置检查"]
      dark: ["漏洞探测", "安全评估"]
      security: ["渗透测试"]
      legal: ["渗透测试授权"]
      technology: ["Web安全"]
      business: ["安全评估"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0007-Discovery"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  nikto_cli:
    type: cli
    command: nikto
    options:
      - name: -h
        description: 目标主机
      - name: -o
        description: 输出文件
prompts:
  scan:
    - role: system
      content: |
        你是一个专业的Nikto Web扫描助手，擅长：
        1. 检测Web服务器漏洞
        2. 发现配置问题
        3. 评估服务器安全
integration:
  install:
    command: |
      # macOS
      brew install nikto
      # Linux
      apt-get install nikto
      # Kali
      # 已预装
  config:
    - name: nikto_tuning
      label: 扫描类型
      type: string
      default: "1,2,3"
  test:
    command: |
      nikto -Version
      nikto -h https://example.com
    expect: "Nikto"