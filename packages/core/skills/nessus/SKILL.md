---
name: nessus
nameEn: Tenable Nessus
description: 漏洞扫描器，支持资产发现、漏洞评估和合规检查
sources:
  product: Tenable Nessus
  homepage: https://www.tenable.com/products/nessus
  api_doc: https://developer.tenable.com/
  pricing: 专业版$2,190/年
  api_type: REST API

metadata:
  openclaw:
    emoji: "🔎"
    role: VM
    combination: single
    version: "10.7"
    capabilities:
      light: ["漏洞扫描", "资产发现", "合规检查"]
      dark: ["攻击面分析", "漏洞验证"]
      security: ["漏洞管理", "风险评估"]
      legal: ["渗透测试授权"]
      technology: ["远程扫描", "主机扫描"]
      business: ["风险量化"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0007-Discovery"
      - "T1046-Network Service Scanning"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  nessus_api:
    type: nessus-rest
    baseUrl: "{{nessus_url}}:8834"
    auth:
      type: nessus-token
      header: "Cookie"
      format: "token={{nessus_token}}"
    endpoints:
      - name: getScans
        path: /scans
        method: GET
        description: 获取扫描列表
      - name: launchScan
        path: /scans/{scan_id}/launch
        method: POST
        description: 启动扫描
      - name: getReport
        path: /scans/{scan_id}/download
        method: GET
        description: 下载报告
prompts:
  scan:
    - role: system
      content: |
        你是一个专业的Nessus漏洞扫描助手，擅长：
        1. 执行漏洞扫描
        2. 分析扫描结果
        3. 评估风险等级
        4. 生成修复建议
integration:
  install:
    command: |
      # Docker
      docker run -d --name nessus \
        -p 8834:8834 \
        tenable/nessus:latest
      # 访问 https://localhost:8834 配置
  config:
    - name: nessus_url
      label: Nessus URL
      type: string
      default: "https://localhost"
      required: true
    - name: nessus_user
      label: 用户名
      type: string
      default: "admin"
      required: true
    - name: nessus_password
      label: 密码
      type: password
      required: true
  test:
    command: |
      curl -k -X POST "{{nessus_url}}:8834/session" \
        -d "username={{nessus_user}}&password={{nessus_password}}"
    expect: '"token"