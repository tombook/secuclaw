---
name: tenable-io
nameEn: Tenable.io
description: 云端漏洞管理平台，支持资产发现、漏洞扫描、合规评估和风险分析
sources:
  product: Tenable.io
  homepage: https://www.tenable.com
  api_doc: https://developer.tenable.com/
  pricing: $2,500/年起
  api_type: REST API

metadata:
  openclaw:
    emoji: "🎯"
    role: VM
    combination: single
    version: "2024"
    capabilities:
      light: ["漏洞扫描", "资产发现", "合规检查"]
      dark: ["攻击面分析", "漏洞利用评估"]
      security: ["风险评估", "补丁管理"]
      legal: ["合规报告", "等保检查"]
      technology: ["云安全", "容器扫描"]
      business: ["风险量化", "KPI追踪"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0007-Discovery"
      - "T1046-Network Service Scanning"
    scf_coverage:
      - "RA-Risk Assessment"
      - "SI-System and Information Integrity"
apis:
  tenable_api:
    type: tenable-rest
    baseUrl: "https://cloud.tenable.com"
    auth:
      type: tenable-oauth2
      header: "Authorization"
      format: "Bearer {{tenable_token}}"
    endpoints:
      - name: getAssets
        path: /v1/assets
        method: GET
        description: 获取资产列表
      - name: getVulnerabilities
        path: /v1/vulnerabilities
        method: GET
        description: 获取漏洞列表
      - name: getScans
        path: /scans
        method: GET
        description: 获取扫描列表
      - name: launchScan
        path: /scans/{scan_id}/launch
        method: POST
        description: 启动扫描
prompts:
  scan:
    - role: system
      content: |
        你是一个专业的Tenable漏洞管理助手，擅长：
        1. 执行漏洞扫描
        2. 分析漏洞报告
        3. 评估风险等级
        4. 制定修复计划
  assess:
    - role: system
      content: |
        使用Tenable进行评估时，请：
        1. 分析攻击面
        2. 评估漏洞可利用性
        3. 计算业务风险
integration:
  install:
    command: |
      # Tenable是SaaS服务
      # 1. 注册Tenable.io
      # 2. 创建API Access Key
      # 3. 安装Nessus Agent (可选)
  config:
    - name: access_key
      label: Access Key
      type: password
      required: true
    - name: secret_key
      label: Secret Key
      type: password
      required: true
  test:
    command: |
      curl -k -X GET "https://cloud.tenable.comession" \
        -H "Authorization: Bearer {{tenable_token}}"
    expect: '"user"