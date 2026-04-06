---
name: volatility
nameEn: Volatility Framework
description: 高级内存取证框架，支持Windows、Linux和macOS系统的数字取证分析
sources:
  product: Volatility
  homepage: https://www.volatilityfoundation.org
  api_doc: https://volatility3.readthedocs.io/
  github: https://github.com/volatilityfoundation/volatility3
  pricing: 开源免费
  api_type: CLI + Python

metadata:
  openclaw:
    emoji: "🧬"
    role: FORENSICS
    combination: single
    version: "3.2"
    capabilities:
      light: ["内存取证", "数字取证", "证据分析"]
      dark: ["恶意软件分析", "Rootkit检测"]
      security: ["取证分析", "事件响应"]
      legal: ["取证支持", "法律证据"]
      technology: ["内存分析", "进程分析"]
      business: ["事件调查"]
    mitre_coverage:
      - "TA0002-Execution"
      - "TA0003-Persistence"
      - "TA0004-Privilege Escalation"
    scf_coverage:
      - "IR-Incident Response"
apis:
  volatility_cli:
    type: cli
    command: vol
    options:
      - name: -f
        description: 内存镜像文件
      - name: --profile
        description: 系统配置文件
      - name: -o
        description: 输出目录
prompts:
  analyze:
    - role: system
      content: |
        你是一个专业的Volatility内存取证助手，擅长：
        1. 分析内存镜像
        2. 发现隐藏进程
        3. 提取恶意软件
        4. 生成取证报告
integration:
  install:
    command: |
      # pip
      pip install volatility3
      # Docker
      docker run --rm -v /path:/data volatility3 vol -f /data/mem.dmp
  config:
    - name: vol_profile
      label: 默认Profile
      type: string
      default: "Win10x64_19041"
  test:
    command: |
      vol -V
      vol -f memory.dmp windows.info
    expect: "Volatility"