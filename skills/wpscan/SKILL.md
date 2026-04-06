---
name: wpscan
nameEn: WPScan WordPress
description: WordPress安全扫描器，检测插件、主题和配置漏洞
sources:
  product: WPScan
  homepage: https://wpscan.com
  api_doc: https://wpscan.com/documentation
  github: https://github.com/wpscanteam/wpscan
  pricing: 免费版无限制 | API $65/月起
  api_type: CLI + REST API

metadata:
  openclaw:
    emoji: "📝"
    role: WEB
    combination: single
    version: "3.8"
    capabilities:
      light: ["WordPress扫描", "漏洞检测"]
      dark: ["WP漏洞挖掘"]
      security: ["渗透测试"]
      legal: ["渗透测试授权"]
      technology: ["WordPress安全"]
      business: ["CMS安全评估"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0007-Discovery"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  wpscan_cli:
    type: cli
    command: wpscan
    options:
      - name: --url
        description: 目标URL
      - name: --enumerate
        description: 枚举选项
prompts:
  scan:
    - role: system
      content: |
        你是一个专业的WPScan WordPress扫描助手，擅长：
        1. 检测WordPress漏洞
        2. 发现弱插件/主题
        3. 评估WP安全
integration:
  install:
    command: |
      # macOS
      brew install wpscan
      # Linux
      apt-get install wpscan
      # Docker
      docker run -rm wpscanteam/wpscan wpscan --url https://example.com
  config:
    - name: wpscan_token
      label: API Token
      type: password
      required: false
      description: "免费获取: https://wpscan.com/api"
  test:
    command: |
      wpscan --version
      wpscan --url https://example.com --enumerate vp
    expect: "WPScan"