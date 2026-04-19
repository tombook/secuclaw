---
name: ssrfmap
nameEn: SSRFMap
description: SSRF漏洞检测和利用工具
sources:
  product: SSRFMap
  homepage: https://github.com/swisskyrepo/SSRFmap
  api_doc: https://github.com/swisskyrepo/SSRFmap
  github: https://github.com/swisskyrepo/SSRFmap
  pricing: 开源免费
  api_type: CLI (Python)

metadata:
  openclaw:
    emoji: "🌐"
    role: WEB
    combination: single
    version: "1.2"
    capabilities:
      light: ["SSRF检测", "渗透测试"]
      dark: ["SSRF利用"]
      security: ["渗透测试"]
      legal: ["渗透测试授权"]
      technology: ["Web安全"]
      business: ["漏洞评估"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0007-Discovery"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  ssrfmap_cli:
    type: cli
    command: ssrfmap
    options:
      - name: -r
        description: 请求文件
      - name: -p
        description: 参数名
prompts:
  test:
    - role: system
      content: |
        你是一个专业的SSRFMap助手，擅长：
        1. 检测SSRF漏洞
        2. 利用SSRF进行内网访问
        3. 提供修复建议
integration:
  install:
    command: |
      # GitHub
      git clone https://github.com/swisskyrepo/SSRFmap.git
      cd SSRFmap && pip install -r requirements.txt
      # Docker
      docker run -it --rm swisskyrepo/ssrfmap
  config:
    - name: ssrfmap_handler
      label: 攻击模块
      type: string
      default: "Gopher"
  test:
    command: |
      python ssrfmap.py --version
      python ssrfmap.py -r request.txt -p url
    expect: "SSRFMap"