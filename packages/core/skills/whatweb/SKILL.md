---
name: whatweb
nameEn: WhatWeb Fingerprinting
description: Web技术指纹识别工具，识别Web服务器、CMS和Web应用技术
sources:
  product: WhatWeb
  homepage: https://github.com/urbanadventurer/WhatWeb
  api_doc: https://github.com/urbanadventurer/WhatWeb
  github: https://github.com/urbanadventurer/WhatWeb
  pricing: 开源免费
  api_type: CLI

metadata:
  openclaw:
    emoji: "🌐"
    role: RECON
    combination: single
    version: "0.5"
    capabilities:
      light: ["指纹识别", "技术发现"]
      dark: ["目标侦察", "技术栈分析"]
      security: ["渗透测试"]
      legal: ["渗透测试授权"]
      technology: ["Web指纹"]
      business: ["攻击面评估"]
    mitre_coverage:
      - "TA0007-Discovery"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  whatweb_cli:
    type: cli
    command: whatweb
    options:
      - name: -a
        description:  agresst级别
      - name: -o
        description: 输出文件
prompts:
  fingerprint:
    - role: system
      content: |
        你是一个专业的WhatWeb指纹识别助手，擅长：
        1. 识别Web技术栈
        2. 发现版本信息
        3. 分析攻击面
integration:
  install:
    command: |
      # macOS
      brew install whatweb
      # Linux
      apt-get install whatweb
      # 源码
      # https://github.com/urbanadventurer/WhatWeb
  config:
    - name: whatweb_aggression
      label: 激进级别
      type: string
      default: "1"
  test:
    command: |
      whatweb --version
      whatweb https://example.com
    expect: "WhatWeb"