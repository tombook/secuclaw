---
name: dirb
nameEn: DIRB Web Scanner
description: Web目录和文件扫描工具
sources:
  product: DIRB
  homepage: https://github.com/v0re/dirb
  api_doc: https://github.com/v0re/dirb
  github: https://github.com/v0re/dirb
  pricing: 开源免费
  api_type: CLI

metadata:
  openclaw:
    emoji: "📂"
    role: WEB
    combination: single
    version: "2024"
    capabilities:
      light: ["目录扫描", "文件发现"]
      dark: ["隐藏资源探测"]
      security: ["渗透测试"]
      legal: ["渗透测试授权"]
      technology: ["Web枚举"]
      business: ["攻击面评估"]
    mitre_coverage:
      - "TA0007-Discovery"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  dirb_cli:
    type: cli
    command: dirb
    options:
      - name: url
        description: 目标URL
      - name: wordlist
        description: 字典文件
prompts:
  scan:
    - role: system
      content: |
        你是一个专业的DIRB Web扫描助手，擅长：
        1. 发现隐藏目录
        2. 识别敏感文件
        3. 评估攻击面
integration:
  install:
    command: |
      # Kali Linux
      # 已预装
      # macOS
      brew install dirb
      # Linux
      apt-get install dirb
  config:
    - name: dirb_wordlist
      label: 默认字典
      type: string
      default: "/usr/share/dirb/wordlists/common.txt"
  test:
    command: |
      dirb
    expect: "DIRB"