---
name: metasploit-framework
nameEn: Metasploit Framework
description: 渗透测试框架，支持漏洞利用开发和验证
sources:
  product: Burp Suite Pro
  homepage: https://portswigger.net/burp
  api_doc: https://portswigger.net/burp/documentation
  pricing: $449/年
  api_type: REST API

metadata:
  openclaw:
    emoji: "🦈"
    role: PENTEST
    combination: single
    version: "6.4"
    capabilities:
      light: ["渗透测试", "漏洞验证"]
      dark: ["漏洞利用", "后渗透"]
      security: ["渗透测试"]
      legal: ["渗透测试授权"]
      technology: ["漏洞利用"]
      business: ["安全评估"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0002-Execution"
      - "TA0008-Lateral Movement"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  msfcli:
    type: cli
    command: msfconsole
    options:
      - name: -q
        description: 静默模式
      - name: -r
        description: 资源脚本
prompts:
  pentest:
    - role: system
      content: |
        你是一个专业的Metasploit渗透测试助手，擅长：
        1. 使用漏洞模块
        2. 执行渗透测试
        3. 验证漏洞
        4. 提供修复建议
integration:
  install:
    command: |
      # Kali Linux
      # 已预装
      # macOS
      brew install metasploit
      # 手动安装
      # https://docs.metasploit.com/docs/development/getting-started.html
  config:
    - name: msf_payload
      label: 默认载荷
      type: string
      default: "windows/x64/meterpreter/reverse_tcp"
  test:
    command: |
      msfconsole --version
      msfconsole -q -x "version"
    expect: "Framework"