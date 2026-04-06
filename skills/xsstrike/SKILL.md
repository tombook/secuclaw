---
name: xsstrike
nameEn: XSStrike XSS Scanner
description: 高级XSS检测和利用框架
sources:
  product: XSStrike
  homepage: https://github.com/s0md3v/XSStrike
  api_doc: https://github.com/s0md3v/XSStrike
  github: https://github.com/s0md3v/XSStrike
  pricing: 开源免费
  api_type: CLI (Python)

metadata:
  openclaw:
    emoji: "❌"
    role: WEB
    combination: single
    version: "4.4"
    capabilities:
      light: ["XSS检测", "渗透测试"]
      dark: ["XSS利用"]
      security: ["渗透测试"]
      legal: ["渗透测试授权"]
      technology: ["Web安全"]
      business: ["漏洞评估"]
    mitre_coverage:
      - "TA0001-Initial Access"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  xsstrike_cli:
    type: cli
    command: xsstrike
    options:
      - name: -u
        description: 目标URL
      - name: --crawl
        description: 爬虫扫描
prompts:
  test:
    - role: system
      content: |
        你是一个专业的XSStrike XSS助手，擅长：
        1. 检测XSS漏洞
        2. 利用XSS漏洞
        3. 提供修复建议
integration:
  install:
    command: |
      # GitHub
      git clone https://github.com/s0md3v/XSStrike.git
      cd XSStrike && pip install -r requirements.txt
      # Docker
      docker run -it s0md3v/xsstrike -u https://example.com
  config:
    - name: xsstrike_options
      label: 常用选项
      type: string
      default: "--crawl"
  test:
    command: |
      python xsstrike.py --version
      python xsstrike.py -u "https://example.com/?q=test"
    expect: "XSStrike"