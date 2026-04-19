---
name: nmap-scripts
nameEn: Nmap Scripting Engine
description: Nmap脚本引擎，支持自动化安全检测和漏洞扫描
sources:
  product: Nmap NSE
  homepage: https://nmap.org
  api_doc: https://nmap.org/nsedoc/
  github: https://github.com/nmap/nmap
  pricing: 开源免费
  api_type: NSE脚本

metadata:
  openclaw:
    emoji: "📜"
    role: VM
    combination: single
    version: "7.9"
    capabilities:
      light: ["漏洞扫描", "服务检测"]
      dark: ["漏洞利用检测", "渗透侦察"]
      security: ["渗透测试", "安全评估"]
      legal: ["渗透测试授权"]
      technology: ["NSE脚本"]
      business: ["攻击面评估"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0007-Discovery"
      - "T1046-Network Service Scanning"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  nmap_cli:
    type: cli
    command: nmap
    options:
      - name: --script
        description: 脚本类别
      - name: --script-args
        description: 脚本参数
prompts:
  scan:
    - role: system
      content: |
        你是一个专业的Nmap NSE脚本助手，擅长：
        1. 使用NSE脚本检测漏洞
        2. 执行服务指纹识别
        3. 发现潜在攻击点
integration:
  install:
    command: |
      # Nmap已包含NSE
      # macOS
      brew install nmap
      # Linux
      apt-get install nmap
  config:
    - name: nse_categories
      label: 脚本类别
      type: string
      default: "vuln,discovery,auth"
  test:
    command: |
      nmap --script-updatedb
      nmap --script-help
    expect: "nmap"