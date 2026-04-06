---
name: node-security-platform
nameEn: NSP Node Security
description: Node.js安全平台，检测依赖项漏洞
sources:
  product: NSP
  homepage: https://nodesecurity.io
  api_doc: https://nodesecurity.io/
  github: https://github.com/nodesecurity
  pricing: 免费版有限 | 付费版$49/月起
  api_type: CLI + REST API

metadata:
  openclaw:
    emoji: "📦"
    role: SCA
    combination: single
    version: "2024"
    capabilities:
      light: ["依赖扫描", "漏洞检测"]
      dark: ["供应链分析"]
      security: ["SCA", "DevSecOps"]
      legal: []
      technology: ["Node.js安全"]
      business: ["风险评估"]
    mitre_coverage:
      - "TA0001-Initial Access"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  nsp_cli:
    type: cli
    command: nsp
    options:
      - name: check
        description: 检查命令
prompts:
  scan:
    - role: system
      content: |
        你是一个专业的NSP Node安全助手，擅长：
        1. 检测Node.js漏洞
        2. 分析供应链风险
        3. 提供修复建议
integration:
  install:
    command: |
      npm install -g nsp
      # Docker
      docker run -rm nodesecurity/nsp check
  config:
    - name: nsp_output
      label: 输出格式
      type: string
      default: "json"
  test:
    command: |
      nsp --version
      nsp check
    expect: "nsp"