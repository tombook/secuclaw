---
name: safety
nameEn: Python Safety
description: Python依赖项漏洞扫描工具
sources:
  product: Safety
  homepage: https://pyup.io/safety/
  api_doc: https://pyup.io/safety/
  github: https://github.com/pyupio/safety
  pricing: 免费版有限 | 付费版$299/月起
  api_type: CLI + REST API

metadata:
  openclaw:
    emoji: "🐍"
    role: SCA
    combination: single
    version: "3.0"
    capabilities:
      light: ["依赖扫描", "漏洞检测"]
      dark: ["供应链分析"]
      security: ["SCA", "DevSecOps"]
      legal: []
      technology: ["Python安全"]
      business: ["风险评估"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0002-Execution"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  safety_cli:
    type: cli
    command: safety
    options:
      - name: check
        description: 检查命令
      - name: --file
        description: requirements文件
prompts:
  scan:
    - role: system
      content: |
        你是一个专业的Safety Python安全助手，擅长：
        1. 扫描Python依赖漏洞
        2. 提供修复建议
        3. 评估供应链安全
integration:
  install:
    command: |
      pip install safety
      # Docker
      docker run -rm -ti pyupio/safety check -r requirements.txt
  config:
    - name: safety_api_key
      label: API Key
      type: password
      required: false
  test:
    command: |
      safety check
      safety check -r requirements.txt
    expect: "Safety"