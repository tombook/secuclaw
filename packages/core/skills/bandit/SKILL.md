---
name: bandit
nameEn: Bandit Python SAST
description: Python代码安全静态分析工具
sources:
  product: Bandit
  homepage: https://bandit.readthedocs.io
  api_doc: https://bandit.readthedocs.io/
  github: https://github.com/PyCQA/bandit
  pricing: 开源免费
  api_type: CLI (Python)

metadata:
  openclaw:
    emoji: "🐱"
    role: SAST
    combination: single
    version: "1.7"
    capabilities:
      light: ["代码审计", "安全扫描"]
      dark: ["后门检测"]
      security: ["SAST", "DevSecOps"]
      legal: []
      technology: ["Python AST分析"]
      business: ["代码安全"]
    mitre_coverage:
      - "TA0002-Execution"
    scf_coverage:
      - "SI-System and Information Integrity"
apis:
  bandit_cli:
    type: cli
    command: bandit
    options:
      - name: -r
        description: 递归扫描
      - name: -f
        description: 输出格式
prompts:
  analyze:
    - role: system
      content: |
        你是一个专业的Bandit Python安全助手，擅长：
        1. 分析Python代码漏洞
        2. 检测安全热点
        3. 提供修复建议
integration:
  install:
    command: |
      pip install bandit
      # macOS
      brew install bandit
  config:
    - name: bandit_severity
      label: 严重性级别
      type: string
      default: "high"
  test:
    command: |
      bandit --version
      bandit -r ./src
    expect: "bandit"