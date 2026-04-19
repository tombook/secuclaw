---
name: greynoise
nameEn: GreyNoise Threat Intelligence
description: 互联网背景噪音分析平台，帮助识别恶意扫描和自动化威胁
sources:
  product: GreyNoise
  homepage: https://greynoise.io
  api_doc: https://docs.greynoise.io/
  github: https://github.com/GreyNoise-Intelligence
  pricing: 免费版1,000次/月 | 付费版$99/月起
  api_type: REST API

metadata:
  openclaw:
    emoji: "🌊"
    role: THREAT
    combination: single
    version: "2024"
    capabilities:
      light: ["威胁情报", "IP信誉", "扫描检测"]
      dark: ["威胁狩猎", "C2检测"]
      security: ["威胁情报", "态势感知"]
      legal: []
      technology: ["互联网分析"]
      business: ["风险评估"]
    mitre_coverage:
      - "TA0013-Scanning"
      - "TA0011-Command and Control"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  greynoise_api:
    type: greynoise-rest
    baseUrl: "https://api.greynoise.io"
    auth:
      type: greynoise-key
      header: "key"
      format: "{{greynoise_key}}"
    endpoints:
      - name: queryIP
        path: /v3/community/{ip}
        method: GET
        description: 查询IP信誉
      - name: getGNQL
        path: /v2/experimental/gnql
        method: GET
        description: 执行GNQL查询
        params:
          - name: query
            type: string
            required: true
prompts:
  analyze:
    - role: system
      content: |
        你是一个专业的GreyNoise威胁分析助手，擅长：
        1. 分析IP威胁情报
        2. 识别扫描源
        3. 检测恶意C2
        4. 生成IP报告
integration:
  install:
    command: |
      # GreyNoise是SaaS服务
      # 1. 注册GreyNoise账户
      # 2. 获取API Key
  config:
    - name: greynoise_key
      label: API Key
      type: password
      required: true
  test:
    command: |
      curl -k -H "key: {{greynoise_key}}" \
        "https://api.greynoise.io/v3/community/1.1.1.1"
    expect: '"status"