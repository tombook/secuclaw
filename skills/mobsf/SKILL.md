---
name: mobsf
nameEn: MobSF Mobile Security
description: 移动应用安全测试框架，支持Android/iOS应用安全评估和API安全测试
sources:
  product: MobSF
  homepage: https://github.com/MobSF
  api_doc: https://github.com/MobSF/MobSF/wiki
  github: https://github.com/MobSF/MobSF
  pricing: 开源免费
  api_type: REST API

metadata:
  openclaw:
    emoji: "📱"
    role: MOBILE
    combination: single
    version: "3.4"
    capabilities:
      light: ["移动安全", "代码审计", "漏洞扫描"]
      dark: ["逆向工程", "恶意软件分析"]
      security: ["AppSec", "API测试"]
      legal: ["合规审计"]
      technology: ["静态分析", "动态分析"]
      business: ["风险评估"]
    mitre_coverage:
      - "TA0007-Discovery"
      - "T1474-Component Tampering"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  mobsf_api:
    type: mobsf-rest
    baseUrl: "{{mobsf_url}}"
    auth:
      type: none
    endpoints:
      - name: uploadScan
        path: /api/v1/upload
        method: POST
        description: 上传应用扫描
        body: |
          Content-Type: multipart/form-data
          file: <apk/ipa file>
      - name: getReport
        path: /api/v1/report/{scan_hash}
        method: GET
        description: 获取报告
      - name: getJSONReport
        path: /api/v1/reportjson/{scan_hash}
        method: GET
        description: 获取JSON报告
prompts:
  analyze:
    - role: system
      content: |
        你是一个专业的MobSF移动安全助手，擅长：
        1. 分析移动应用漏洞
        2. 检测安全问题
        3. 评估风险等级
        4. 提供修复建议
integration:
  install:
    command: |
      # Docker
      docker run -d --name mobsf \
        -p 8000:8000 \
        opensecurity/mobsf:latest
      # 或本地安装
      pip install mobsfscan
  config:
    - name: mobsf_url
      label: MobSF URL
      type: string
      default: "http://localhost:8000"
      required: true
  test:
    command: |
      curl -k "{{mobsf_url}}/api/v1/version"
    expect: '"version"