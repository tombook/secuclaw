---
name: ffuf
nameEn: FFUF Web Fuzzer
description: 快速Web fuzzing工具，支持目录、参数和子域名fuzzing
sources:
  product: FFUF
  homepage: https://github.com/ffuf/ffuf
  api_doc: https://github.com/ffuf/ffuf
  github: https://github.com/ffuf/ffuf
  pricing: 开源免费
  api_type: CLI

metadata:
  openclaw:
    emoji: "🎲"
    role: WEB
    combination: single
    version: "2.1"
    capabilities:
      light: ["Web fuzzing", "目录发现"]
      dark: ["漏洞挖掘", "参数测试"]
      security: ["渗透测试"]
      legal: ["渗透测试授权"]
      technology: ["Web安全"]
      business: ["攻击面评估"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0007-Discovery"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  ffuf_cli:
    type: cli
    command: ffuf
    options:
      - name: -u
        description: 目标URL
      - name: -w
        description: 字典文件
      - name: -mc
        description: 匹配的状态码
prompts:
  fuzz:
    - role: system
      content: |
        你是一个专业的FFUF Web fuzzing助手，擅长：
        1. 发现隐藏目录
        2. 测试参数
        3. 发现漏洞
        4. 评估攻击面
integration:
  install:
    command: |
      # macOS
      brew install ffuf
      # Linux
      apt-get install ffuf
      # Go
      go install github.com/ffuf/ffuf@latest
  config:
    - name: ffuf_wordlist
      label: 字典文件
      type: string
      default: "/usr/share/wordlists/dirb/common.txt"
  test:
    command: |
      ffuf --version
      ffuf -u https://example.com/FUZZ -w wordlist.txt
    expect: "ffuf"