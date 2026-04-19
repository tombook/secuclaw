---
name: gobuster
nameEn: Gobuster Directory Scanner
description: 目录和DNS暴破工具，用于Web路径发现和子域名枚举
sources:
  product: Gobuster
  homepage: https://github.com/OJ/gobuster
  api_doc: https://github.com/OJ/gobuster
  github: https://github.com/OJ/gobuster
  pricing: 开源免费
  api_type: CLI

metadata:
  openclaw:
    emoji: "🗂️"
    role: WEB
    combination: single
    version: "3.6"
    capabilities:
      light: ["目录扫描", "子域名发现"]
      dark: ["路径发现", "隐藏资源探测"]
      security: ["渗透测试", "Web安全"]
      legal: ["渗透测试授权"]
      technology: ["Web枚举"]
      business: ["攻击面评估"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0007-Discovery"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  gobuster_cli:
    type: cli
    command: gobuster
    options:
      - name: dir
        description: 目录模式
      - name: -u
        description: 目标URL
      - name: -w
        description: 字典文件
prompts:
  enumerate:
    - role: system
      content: |
        你是一个专业的Gobuster Web枚举助手，擅长：
        1. 发现隐藏目录
        2. 枚举子域名
        3. 发现敏感文件
        4. 评估攻击面
integration:
  install:
    command: |
      # macOS
      brew install gobuster
      # Linux
      apt-get install gobuster
      # Go
      go install github.com/OJ/gobuster/v3@latest
  config:
    - name: gobuster_wordlist
      label: 默认字典
      type: string
      default: "/usr/share/wordlists/dirb/common.txt"
  test:
    command: |
      gobuster version
      gobuster dir -u https://example.com -w /usr/share/wordlists/dirb/common.txt
    expect: "gobuster"